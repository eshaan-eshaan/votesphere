// Election keypair management.
//
// Ballots are encrypted client-side (Web Crypto, RSA-OAEP/SHA-256) with this
// election's PUBLIC key. The private key never leaves the server and is only
// ever used to decrypt choices in aggregate, for tallying (see /api/stats).
//
// Where the private key lives, in order of precedence:
//  1. ELECTION_PRIVATE_KEY (PEM) in the environment, if set;
//  2. the database (ElectionKey table), encrypted with AES-256-GCM under a key
//     derived from JWT_SECRET - generated once, on first start, then reused;
// so it survives restarts with no manual setup. If the stored key can no
// longer be decrypted (JWT_SECRET changed) and ballots exist, the server
// refuses to start rather than silently replacing it, which would orphan them.

const crypto = require("crypto");
const { ELECTION_KEY_WRAP_KEY } = require("./config");

let privateKey = null;
let publicKey = null;

const wrap = (pem) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", ELECTION_KEY_WRAP_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(pem, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
};

const unwrap = (stored) => {
    const buf = Buffer.from(stored, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ELECTION_KEY_WRAP_KEY, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
};

const generatePem = () =>
    crypto
        .generateKeyPairSync("rsa", { modulusLength: 4096, publicExponent: 0x10001 })
        .privateKey.export({ type: "pkcs8", format: "pem" });

const setKey = (pem) => {
    privateKey = crypto.createPrivateKey(pem);
    publicKey = crypto.createPublicKey(privateKey);
};

// Must complete before the server starts accepting requests.
async function initElectionKeys(prisma, electionId) {
    if (process.env.ELECTION_PRIVATE_KEY) {
        try {
            // Accept PEMs pasted into a single-line variable with literal "\n".
            setKey(process.env.ELECTION_PRIVATE_KEY.replace(/\\n/g, "\n"));
        } catch {
            throw new Error("ELECTION_PRIVATE_KEY is set but is not a valid PEM private key.");
        }
        console.log("Election keypair loaded from ELECTION_PRIVATE_KEY.");
        return "environment";
    }

    const row = await prisma.electionKey.findUnique({ where: { electionId } });
    if (row) {
        try {
            setKey(unwrap(row.encryptedPrivateKey));
            console.log("Election keypair loaded from the database.");
            return "database";
        } catch {
            const ballots = await prisma.vote.count({ where: { electionId } });
            if (ballots > 0) {
                throw Object.assign(
                    new Error(
                        `The stored election key cannot be decrypted (was JWT_SECRET changed?). ` +
                        `Refusing to start: replacing it would orphan ${ballots} ballot(s). ` +
                        `Restore the previous JWT_SECRET, or set ELECTION_PRIVATE_KEY.`
                    ),
                    { fatal: true } // a configuration error: retrying cannot help
                );
            }
            console.warn("Stored election key was unreadable but no ballots exist; replacing it.");
        }
    }

    const pem = generatePem();
    try {
        await prisma.electionKey.upsert({
            where: { electionId },
            update: { encryptedPrivateKey: wrap(pem) },
            create: { electionId, encryptedPrivateKey: wrap(pem) },
        });
    } catch (e) {
        // Another instance created it a moment ago: use theirs.
        if (e && e.code === "P2002") return initElectionKeys(prisma, electionId);
        throw e;
    }
    setKey(pem);
    console.log("Generated a new election keypair and stored it (encrypted) in the database.");
    return "generated";
}

const requireKey = () => {
    if (!privateKey) throw new Error("Election keys are not initialised.");
};

const getPublicKeyJwk = () => {
    requireKey();
    return publicKey.export({ format: "jwk" });
};

// A valid RSA-OAEP ciphertext is exactly one modulus long.
const ciphertextBytes = () => {
    requireKey();
    return privateKey.asymmetricKeyDetails.modulusLength / 8;
};

const decryptChoice = (base64Ciphertext) => {
    requireKey();
    const plaintext = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(base64Ciphertext, "base64")
    );
    return plaintext.toString("utf8");
};

module.exports = { initElectionKeys, getPublicKeyJwk, decryptChoice, ciphertextBytes };
