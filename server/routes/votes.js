const express = require("express");
const crypto = require("crypto");
const lrs = require("lrs");
const prisma = require("../db");
const { authenticate } = require("../middleware/auth");
const { decryptChoice, ciphertextBytes } = require("../election-keys");
const { ELECTION_ID, TIME_BUCKET_MS } = require("../election-config");
const { parseSignature, bucketDate } = require("../ring");
const { getElection, candidateIds, getFrozenRing } = require("../election-service");

const router = express.Router();

const fail = (res, status, error) => res.status(status).json({ ok: false, error });

// Public ledger: no choices and no heavy proof material. Anyone can fetch one
// ballot's full proof from GET /api/votes/:ballotId and re-verify it.
router.get("/", async (req, res) => {
    try {
        const votes = await prisma.vote.findMany({
            where: { electionId: ELECTION_ID },
            orderBy: { castAt: "desc" },
            take: 500,
            select: { ballotId: true, electionId: true, keyImage: true, ringSize: true, castAt: true },
        });
        res.json(votes);
    } catch (error) {
        console.error("Error fetching votes:", error);
        fail(res, 500, "Failed to fetch votes.");
    }
});

router.get("/:ballotId", async (req, res) => {
    try {
        const vote = await prisma.vote.findUnique({
            where: { ballotId: req.params.ballotId },
            select: {
                ballotId: true, electionId: true, encryptedBallot: true, signature: true,
                keyImage: true, ringSize: true, castAt: true,
            },
        });
        if (!vote) return fail(res, 404, "Ballot not found.");
        const election = await getElection();
        res.json({ ...vote, ringHash: election ? election.ringHash : null });
    } catch (error) {
        console.error("Error fetching vote:", error);
        fail(res, 500, "Failed to fetch the ballot.");
    }
});

// Cast a vote. The server uses ITS OWN frozen ring, never one supplied by the
// client; a valid ring signature proves the voter holds a registered key.
router.post("/", async (req, res) => {
    try {
        const { electionId, encryptedBallot, signature, ringHash } = req.body || {};

        const election = await getElection();
        if (!election || election.status !== "VOTING") return fail(res, 409, "Voting is not open.");
        if (electionId !== election.id) return fail(res, 400, "Wrong election.");
        if (ringHash !== undefined && ringHash !== election.ringHash) {
            return fail(res, 400, "The voter ring has changed. Reload the page and try again.");
        }

        // Cheap shape checks first.
        if (typeof encryptedBallot !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(encryptedBallot)) {
            return fail(res, 400, "Malformed ballot.");
        }
        const cipher = Buffer.from(encryptedBallot, "base64");
        if (cipher.length !== ciphertextBytes() || cipher.toString("base64") !== encryptedBallot) {
            return fail(res, 400, "Malformed ballot.");
        }
        const parts = parseSignature(signature);
        const ring = await getFrozenRing(election);
        if (!parts || !ring || parts.length !== ring.length + 2) {
            return fail(res, 400, "Malformed signature.");
        }

        // 1. The signature must verify against the frozen ring.
        let valid = false;
        try {
            valid = lrs.verify(ring, signature, encryptedBallot);
        } catch {
            valid = false;
        }
        if (!valid) return fail(res, 400, "Invalid ring signature.");

        // 2. The ballot must decrypt to one of the candidates (no garbage votes).
        let choice;
        try {
            choice = decryptChoice(encryptedBallot);
        } catch {
            return fail(res, 400, "Invalid ballot.");
        }
        if (!candidateIds().includes(choice)) return fail(res, 400, "Invalid ballot.");

        // 3. The key image is already canonical (parseSignature), so a
        // re-cased or zero-padded copy of a signature cannot bypass uniqueness.
        const keyImage = parts[0];
        const ballotId = `ballot_${crypto.randomBytes(12).toString("hex")}`;
        let vote;
        try {
            vote = await prisma.vote.create({
                data: {
                    ballotId,
                    electionId: election.id,
                    encryptedBallot,
                    signature,
                    keyImage,
                    ringSize: ring.length,
                    castAt: bucketDate(new Date(), TIME_BUCKET_MS),
                },
            });
        } catch (e) {
            if (e && e.code === "P2002") {
                console.warn("Double voting attempt rejected.");
                return fail(res, 409, "Double voting detected. This identity has already cast a vote.");
            }
            throw e;
        }

        console.log(`Vote recorded: ${ballotId} (ring ${ring.length})`);
        res.status(201).json({ ok: true, ballotId: vote.ballotId, castAt: vote.castAt });
    } catch (error) {
        console.error("Error storing vote:", error);
        fail(res, 500, "Failed to record vote.");
    }
});

// Delete all votes (superadmin only - for testing)
router.delete("/", authenticate, async (req, res) => {
    try {
        if (req.admin.role !== "superadmin") return fail(res, 403, "Only superadmin can delete votes.");
        const result = await prisma.vote.deleteMany();
        console.log(`All votes deleted by ${req.admin.email}`);
        res.json({ ok: true, message: `Deleted ${result.count} votes.` });
    } catch (error) {
        console.error("Error deleting votes:", error);
        fail(res, 500, "Failed to delete votes.");
    }
});

module.exports = router;
