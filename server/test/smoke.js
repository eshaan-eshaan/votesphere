// End-to-end API smoke test for the voter registry, voting codes, ring freeze and attack cases.
// It CHANGES the election state (issues codes, freezes the ring, casts ballots), so run it against a throwaway database.
// Usage: node test/smoke.js <baseUrl> <ADMIN_SETUP_KEY>      (npm run smoke -- <baseUrl> <key>)
const lrs = require("lrs");
const BASE = process.argv[2] || "http://localhost:5000";
const SETUP_KEY = process.argv[3];

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => {
    (ok ? pass++ : fail++);
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  -> " + extra : ""}`);
};
const api = async (method, path, body, token) => {
    const res = await fetch(BASE + path, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* none */ }
    return { status: res.status, json };
};

async function encrypt(jwk, plaintext) {
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
    const buf = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, new TextEncoder().encode(plaintext));
    return Buffer.from(buf).toString("base64");
}

(async () => {
    const email = `smoke${Date.now()}@example.com`;
    const password = "Smoke1234Pass";

    let r = await api("GET", "/api/election");
    check("election state is DRAFT with 4 candidates", r.json.status === "DRAFT" && r.json.candidates.length === 4, JSON.stringify(r.json.counts));
    const electionId = r.json.id;
    const names = r.json.candidates.map((c) => c.name);
    check("candidates resolved from the roll", names.every((n) => !/^PRW-/.test(n)), names.join(", "));

    r = await api("POST", "/api/auth/register", { email, password, setupKey: SETUP_KEY });
    check("admin register with setup key", r.status === 201, String(r.status));
    r = await api("POST", "/api/auth/login", { email, password });
    const token = r.json.accessToken;
    check("admin login", r.status === 200 && !!token);

    r = await api("POST", "/api/election/admin/phase", { to: "REGISTRATION" }, token);
    check("cannot open registration before codes exist", r.status === 409, r.json.error);

    r = await api("POST", "/api/election/admin/issue-codes", {}, token);
    const sheet = r.json.issued || [];
    check("issue codes for eligible members only", r.status === 200 && sheet.length === 46, `issued=${sheet.length}`);
    check("code format VS-XXXX-XXXX-XXXX-XXXX-XXXXC (20 data + 1 check char)", /^VS-([0-9A-Z]{4}-){4}[0-9A-Z]{5}$/.test(sheet[0].code), sheet[0].code);
    r = await api("POST", "/api/election/admin/issue-codes", {}, token);
    check("issuing again issues nothing new", r.json.issued.length === 0 && r.json.skipped === 46);
    r = await api("GET", "/api/election/admin/members", undefined, token);
    check("roll lists 50 with 46 codes issued", r.json.members.length === 50 && r.json.members.filter((m) => m.code === "ISSUED").length === 46);
    check("ineligible members get no code", r.json.members.filter((m) => !m.eligible).every((m) => m.code === "NONE"));

    const ids = [];
    for (let i = 0; i < 6; i++) ids.push(lrs.gen());

    r = await api("POST", "/api/election/register-key", { code: sheet[0].code, publicKey: ids[0].publicKey });
    check("register-key refused before registration opens", r.status === 409, r.json.error);

    r = await api("POST", "/api/election/admin/phase", { to: "REGISTRATION" }, token);
    check("open registration", r.status === 200);

    for (let i = 0; i < 6; i++) {
        r = await api("POST", "/api/election/register-key", { code: sheet[i].code, publicKey: ids[i].publicKey });
        if (r.status !== 201) check(`register key ${i}`, false, JSON.stringify(r));
    }
    check("6 voters registered keys", true);
    r = await api("POST", "/api/election/register-key", { code: sheet[0].code, publicKey: lrs.gen().publicKey });
    check("used code is rejected", r.status === 409, r.json.error);
    r = await api("POST", "/api/election/register-key", { code: "VS-AAAA-AAAA-AAAA-AAAA-A", publicKey: lrs.gen().publicKey });
    check("unknown/invalid code is rejected", r.status === 400, r.json.error);
    r = await api("POST", "/api/election/register-key", { code: sheet[10].code.toLowerCase().replace(/-/g, " "), publicKey: "1" });
    check("invalid public key is rejected", r.status === 400, r.json.error);
    r = await api("POST", "/api/election/register-key", { code: sheet[10].code.toLowerCase().replace(/-/g, " "), publicKey: ids[1].publicKey });
    check("duplicate public key is rejected", r.status === 409, r.json.error);
    r = await api("POST", "/api/election/register-key", { code: sheet[10].code.toLowerCase().replace(/-/g, " "), publicKey: lrs.gen().publicKey });
    check("typed-style code (lowercase, spaces) is accepted", r.status === 201, String(r.status));
    ids.push(null); // key 10 registered by a throwaway identity, not used below

    r = await api("POST", "/api/votes", { electionId, encryptedBallot: "x", signature: "a_b_c" });
    check("voting refused before it opens", r.status === 409, r.json.error);
    r = await api("GET", "/api/election/ring");
    check("ring hidden before freeze", r.status === 409);

    r = await api("POST", "/api/election/admin/phase", { to: "VOTING" }, token);
    check("freeze ring and open voting", r.status === 200 && !!r.json.ringHash, `hash=${(r.json.ringHash || "").slice(0, 12)}`);
    r = await api("POST", "/api/election/register-key", { code: sheet[20].code, publicKey: lrs.gen().publicKey });
    check("no new keys after the freeze", r.status === 409, r.json.error);

    const ringRes = await api("GET", "/api/election/ring");
    const ring = ringRes.json.ring;
    const ringHash = ringRes.json.ringHash;
    check("ring is the 7 registered keys, canonical order", ring.length === 7);

    const pk = (await api("GET", "/api/election/public-key")).json.publicKey;
    const vote = async (identity, choice, over = {}) => {
        const encryptedBallot = over.encryptedBallot ?? (await encrypt(pk, choice));
        const signature = over.signature ?? lrs.sign(ring, identity, encryptedBallot);
        return api("POST", "/api/votes", { electionId, encryptedBallot, signature, ringHash, ...over.extra });
    };

    r = await vote(ids[0], "c1");
    check("registered voter can vote", r.status === 201 && /^ballot_[0-9a-f]{24}$/.test(r.json.ballotId), JSON.stringify(r.json));
    const firstSig = lrs.sign(ring, ids[1], await encrypt(pk, "c2"));
    r = await vote(ids[1], "c2", { signature: firstSig, encryptedBallot: undefined });
    // (signed over a different ciphertext than the one sent, so it must fail)
    check("signature over a different ballot is rejected", r.status === 400, r.json.error);

    r = await vote(ids[1], "c2");
    check("second voter votes", r.status === 201);
    r = await vote(ids[1], "c3");
    check("same identity, same ring, second ballot -> 409", r.status === 409, r.json.error);

    const ballotC = await encrypt(pk, "c3");
    const sig2 = lrs.sign(ring, ids[2], ballotC);
    const [k, ...rest] = sig2.split("_");
    r = await api("POST", "/api/votes", { electionId, encryptedBallot: ballotC, signature: [k.toUpperCase(), ...rest].join("_"), ringHash });
    check("upper-cased signature is rejected (non-canonical)", r.status === 400, r.json.error);
    r = await api("POST", "/api/votes", { electionId, encryptedBallot: ballotC, signature: ["0" + k, ...rest].join("_"), ringHash });
    check("zero-padded key image is rejected (non-canonical)", r.status === 400, r.json.error);
    r = await api("POST", "/api/votes", { electionId, encryptedBallot: ballotC, signature: sig2, ringHash });
    check("voter 3 votes with a clean signature", r.status === 201);

    const outsider = lrs.gen();
    const ballotO = await encrypt(pk, "c1");
    r = await api("POST", "/api/votes", { electionId, encryptedBallot: ballotO, signature: lrs.sign([...ring, outsider.publicKey].sort(), outsider, ballotO), ringHash });
    check("outsider with their own ring is rejected", r.status === 400, r.json.error);
    r = await vote(ids[3], "hello-not-a-candidate");
    check("non-candidate plaintext is rejected", r.status === 400, r.json.error);
    r = await vote(ids[3], "c1", { encryptedBallot: "hello" });
    check("garbage ballot is rejected", r.status === 400, r.json.error);
    r = await vote(ids[3], "c1", { extra: { ringHash: "deadbeef" } });
    check("wrong ringHash is rejected", r.status === 400, r.json.error);
    r = await vote(ids[3], "c4");
    check("voter 4 votes", r.status === 201);

    r = await api("POST", "/api/votes", "x".repeat(70000));
    check("oversize body -> 413 (not 500)", r.status === 413, String(r.status));

    r = await api("GET", "/api/votes");
    check("public ledger has 4 ballots, no secrets", r.json.length === 4 && r.json.every((v) => !("encryptedBallot" in v) && !("signature" in v)));
    const bid = r.json[0].ballotId;
    r = await api("GET", `/api/votes/${bid}`);
    check("ballot proof is retrievable and re-verifies", r.status === 200 && lrs.verify(ring, r.json.signature, r.json.encryptedBallot));
    check("ballot time is bucketed to 15 minutes", new Date(r.json.castAt).getTime() % (15 * 60 * 1000) === 0, r.json.castAt);

    r = await api("GET", "/api/stats");
    check("stats need auth", r.status === 401);
    r = await api("GET", "/api/stats", undefined, token);
    check("tally is sealed while voting is open (count only, no per-candidate data)", r.json.sealed === true && r.json.total === 4 && !("byChoice" in r.json), JSON.stringify(r.json));

    r = await api("POST", "/api/election/admin/reset", { confirm: "RESET" }, token);
    check("reset needs superadmin", r.status === 403);

    r = await api("POST", "/api/auth/change-password", { currentPassword: password, newPassword: "abcdefgh" }, token);
    check("change-password enforces the complexity rule", r.status === 400, r.json.error);

    r = await api("POST", "/api/election/admin/phase", { to: "CLOSED" }, token);
    check("close election", r.status === 200);
    r = await vote(ids[4], "c1");
    check("voting refused after close", r.status === 409, r.json.error);
    r = await api("GET", "/api/stats", undefined, token);
    check("tally is revealed after close: c1=1 c2=1 c3=1 c4=1, 0 undecryptable", r.json.sealed !== true && r.json.total === 4 && ["c1", "c2", "c3", "c4"].every((c) => r.json.byChoice[c] === 1) && r.json.undecryptable === 0, JSON.stringify(r.json));

    // Rate limiter: /me must never lock anyone out; only failed logins count.
    let blocked = 0;
    for (let i = 0; i < 25; i++) { const m = await api("GET", "/api/auth/me", undefined, token); if (m.status === 429) blocked++; }
    check("25 x /api/auth/me never rate-limited", blocked === 0, `429s=${blocked}`);
    let firstBlock = 0;
    for (let i = 1; i <= 12; i++) { const l = await api("POST", "/api/auth/login", { email, password: "WrongPass123" }); if (l.status === 429 && !firstBlock) firstBlock = i; }
    check("failed logins are limited (10 failures allowed per window, incl. the earlier 400)", firstBlock === 10, `first 429 at attempt ${firstBlock}`);

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("SMOKE TEST CRASHED", e); process.exit(2); });
