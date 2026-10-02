const express = require("express");
const rateLimit = require("express-rate-limit");
const prisma = require("../db");
const { authenticate } = require("../middleware/auth");
const { getPublicKeyJwk } = require("../election-keys");
const { ELECTION_ID, CANDIDATES, MIN_RING_SIZE, TIME_BUCKET_MS } = require("../election-config");
const { generateCode, formatCode, normalizeCode, hashCode } = require("../codes");
const { canonicalPublicKey, sortRing, ringHash, bucketDate } = require("../ring");
const {
    getElection,
    isEligible,
    ineligibleReason,
    getFrozenRing,
    clearRingCache,
} = require("../election-service");

const router = express.Router();

// Only FAILED attempts count, and this is separate from the admin login limiter.
const redeemLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Too many failed attempts. Please try again in 15 minutes." },
});

const NEXT_PHASE = { DRAFT: "REGISTRATION", REGISTRATION: "VOTING", VOTING: "CLOSED" };

const fail = (res, status, error) => res.status(status).json({ ok: false, error });

class Conflict extends Error { }

// ---------- Public ----------

// Election state, candidates and public counts.
router.get("/", async (req, res) => {
    try {
        const election = await getElection();
        if (!election) return fail(res, 503, "Election is not initialised yet.");

        const [onRoll, eligible, registered, ballots, candidateMembers] = await Promise.all([
            prisma.member.count(),
            prisma.member.count({ where: { duesCleared: true, titleDisputed: false } }),
            prisma.ringMember.count({ where: { electionId: election.id } }),
            prisma.vote.count({ where: { electionId: election.id } }),
            prisma.member.findMany({
                where: { membershipNo: { in: CANDIDATES.map((c) => c.membershipNo) } },
            }),
        ]);

        const byNo = new Map(candidateMembers.map((m) => [m.membershipNo, m]));
        const candidates = CANDIDATES.map((c) => {
            const m = byNo.get(c.membershipNo);
            return {
                id: c.id,
                name: m ? m.fullName : c.membershipNo,
                unitLabel: m ? m.unitLabel : null,
                color: c.color,
            };
        });

        res.json({
            id: election.id,
            title: election.title,
            status: election.status,
            ringHash: election.ringHash,
            minRingSize: MIN_RING_SIZE,
            candidates,
            counts: { onRoll, eligible, registered, ballots },
        });
    } catch (error) {
        console.error("Error fetching election:", error);
        fail(res, 500, "Failed to load the election.");
    }
});

// Election public key - clients encrypt their ballot choice with this before
// signing and submitting it. The matching private key never leaves the server.
router.get("/public-key", (req, res) => {
    res.json({ publicKey: getPublicKeyJwk() });
});

// The frozen ring, available once voting has opened.
router.get("/ring", async (req, res) => {
    try {
        const election = await getElection();
        if (!election || !["VOTING", "CLOSED"].includes(election.status)) {
            return fail(res, 409, "The ring is not frozen yet.");
        }
        const ring = await getFrozenRing(election);
        res.json({ ringHash: election.ringHash, ring });
    } catch (error) {
        console.error("Error fetching ring:", error);
        fail(res, 500, "Failed to load the ring.");
    }
});

// Exchange a voting code for a place in the ring. The code is burned and the
// public key is stored with NO link back to the code or the member.
router.post("/register-key", redeemLimiter, async (req, res) => {
    try {
        const { code, publicKey } = req.body || {};

        const election = await getElection();
        if (!election || election.status !== "REGISTRATION") {
            return fail(res, 409, "Key registration is not open.");
        }

        const normalized = normalizeCode(code);
        const key = canonicalPublicKey(publicKey);
        if (!key) return fail(res, 400, "Invalid public key.");

        const credential = normalized
            ? await prisma.credential.findUnique({
                where: { codeHmac: hashCode(normalized) },
                include: { member: true },
            })
            : null;
        if (!credential || credential.electionId !== election.id) {
            return fail(res, 400, "That voting code is not valid. Check it and try again.");
        }
        if (credential.redeemedAt) return fail(res, 409, "This voting code has already been used.");
        if (!isEligible(credential.member)) return fail(res, 403, "This member is not eligible to vote.");

        try {
            await prisma.$transaction(async (tx) => {
                const claimed = await tx.credential.updateMany({
                    where: { id: credential.id, redeemedAt: null },
                    data: { redeemedAt: bucketDate(new Date(), TIME_BUCKET_MS) },
                });
                if (claimed.count !== 1) throw new Conflict("This voting code has already been used.");
                await tx.ringMember.create({ data: { electionId: election.id, publicKey: key } });
            });
        } catch (e) {
            if (e instanceof Conflict) return fail(res, 409, e.message);
            if (e && e.code === "P2002") return fail(res, 409, "This key is already registered.");
            throw e;
        }

        res.status(201).json({ ok: true, message: "Key registered. Keep this browser, or download the key backup." });
    } catch (error) {
        console.error("Key registration error:", error);
        fail(res, 500, "Failed to register the key.");
    }
});

// ---------- Admin (Returning Officer) ----------

router.use("/admin", authenticate);

router.get("/admin/status", async (req, res) => {
    try {
        const election = await getElection();
        const [issued, redeemed] = await Promise.all([
            prisma.credential.count({ where: { electionId: ELECTION_ID } }),
            prisma.credential.count({ where: { electionId: ELECTION_ID, redeemedAt: { not: null } } }),
        ]);
        res.json({ ok: true, status: election.status, ringHash: election.ringHash, issued, redeemed });
    } catch (error) {
        console.error("Admin status error:", error);
        fail(res, 500, "Failed to load election status.");
    }
});

router.get("/admin/members", async (req, res) => {
    try {
        const members = await prisma.member.findMany({
            orderBy: { membershipNo: "asc" },
            include: { credentials: { where: { electionId: ELECTION_ID } } },
        });
        res.json({
            ok: true,
            members: members.map((m) => {
                const credential = m.credentials[0];
                return {
                    membershipNo: m.membershipNo,
                    unitLabel: m.unitLabel,
                    fullName: m.fullName,
                    jointOwnerName: m.jointOwnerName,
                    aadhaarMasked: m.aadhaarMasked,
                    phoneMasked: m.phoneMasked,
                    occupancy: m.occupancy,
                    eligible: isEligible(m),
                    ineligibleReason: ineligibleReason(m),
                    code: credential ? (credential.redeemedAt ? "REDEEMED" : "ISSUED") : "NONE",
                };
            }),
        });
    } catch (error) {
        console.error("Admin members error:", error);
        fail(res, 500, "Failed to load the roll.");
    }
});

// Issue codes to eligible members who do not have one yet (or replace the
// unredeemed codes of the members listed in `reissue`). The plaintext codes
// are returned ONCE, as the distribution sheet; only their HMACs are stored.
// Email delivery is simulated: the admin hands the sheet out.
router.post("/admin/issue-codes", async (req, res) => {
    try {
        const election = await getElection();
        if (!["DRAFT", "REGISTRATION"].includes(election.status)) {
            return fail(res, 409, "Codes can only be issued before voting opens.");
        }
        const reissue = new Set(Array.isArray(req.body?.reissue) ? req.body.reissue : []);

        const members = await prisma.member.findMany({
            where: { duesCleared: true, titleDisputed: false },
            orderBy: { membershipNo: "asc" },
            include: { credentials: { where: { electionId: election.id } } },
        });

        const sheet = [];
        const operations = [];
        for (const m of members) {
            const existing = m.credentials[0];
            const replace = existing && reissue.has(m.membershipNo) && !existing.redeemedAt;
            if (existing && !replace) continue;

            const chars = generateCode();
            const codeHmac = hashCode(chars);
            operations.push(
                existing
                    ? prisma.credential.update({
                        where: { id: existing.id },
                        data: { codeHmac, issuedAt: new Date() },
                    })
                    : prisma.credential.create({
                        data: { electionId: election.id, memberId: m.id, codeHmac },
                    })
            );
            sheet.push({
                membershipNo: m.membershipNo,
                fullName: m.fullName,
                unitLabel: m.unitLabel,
                aadhaarMasked: m.aadhaarMasked,
                phoneMasked: m.phoneMasked,
                code: formatCode(chars),
            });
        }
        await prisma.$transaction(operations);

        console.log(`Voting codes issued by ${req.admin.email}: ${sheet.length}`);
        res.set("Cache-Control", "no-store");
        res.json({ ok: true, issued: sheet, skipped: members.length - sheet.length });
    } catch (error) {
        console.error("Issue codes error:", error);
        fail(res, 500, "Failed to issue codes.");
    }
});

// Advance the election: DRAFT -> REGISTRATION -> VOTING -> CLOSED.
// Opening voting freezes the ring.
router.post("/admin/phase", async (req, res) => {
    try {
        const election = await getElection();
        const to = req.body?.to;
        const next = NEXT_PHASE[election.status];
        if (!next || next !== to) {
            return fail(res, 409, `Cannot move from ${election.status} to ${to}.`);
        }

        if (to === "REGISTRATION") {
            const issued = await prisma.credential.count({ where: { electionId: election.id } });
            if (issued === 0) return fail(res, 409, "Issue voting codes before opening registration.");
        }

        let ringHashValue = election.ringHash;
        if (to === "VOTING") {
            const rows = await prisma.ringMember.findMany({ where: { electionId: election.id } });
            if (rows.length < MIN_RING_SIZE) {
                return fail(res, 409, `At least ${MIN_RING_SIZE} voters must register keys before voting opens (have ${rows.length}).`);
            }
            ringHashValue = ringHash(sortRing(rows.map((r) => r.publicKey)));
        }

        const updated = await prisma.election.update({
            where: { id: election.id },
            data: { status: to, ringHash: ringHashValue },
        });
        console.log(`Election ${election.id}: ${election.status} -> ${to} by ${req.admin.email}`);
        res.json({ ok: true, status: updated.status, ringHash: updated.ringHash });
    } catch (error) {
        console.error("Phase change error:", error);
        fail(res, 500, "Failed to change the election phase.");
    }
});

// Wipe codes, ring keys and ballots and go back to DRAFT. Superadmin only.
router.post("/admin/reset", async (req, res) => {
    try {
        if (req.admin.role !== "superadmin") return fail(res, 403, "Only a superadmin can reset the election.");
        if (req.body?.confirm !== "RESET") return fail(res, 400, 'Send {"confirm":"RESET"} to confirm.');

        await prisma.$transaction([
            prisma.vote.deleteMany({ where: { electionId: ELECTION_ID } }),
            prisma.ringMember.deleteMany({ where: { electionId: ELECTION_ID } }),
            prisma.credential.deleteMany({ where: { electionId: ELECTION_ID } }),
            prisma.election.update({ where: { id: ELECTION_ID }, data: { status: "DRAFT", ringHash: null } }),
        ]);
        clearRingCache();
        console.log(`Election ${ELECTION_ID} reset by ${req.admin.email}`);
        res.json({ ok: true, status: "DRAFT" });
    } catch (error) {
        console.error("Reset error:", error);
        fail(res, 500, "Failed to reset the election.");
    }
});

module.exports = router;
