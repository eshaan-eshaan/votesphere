// Election keypair management.
//
// Ballots are encrypted client-side (Web Crypto, RSA-OAEP/SHA-256) with this
// election's PUBLIC key. The private key never leaves the server and is only
// ever used to decrypt choices in aggregate, for tallying (see /api/stats).
//
// If ELECTION_PRIVATE_KEY isn't provided, a keypair is generated in memory at
// boot. That's fine for now since vote data itself doesn't persist across
// restarts either (no persistent disk configured yet) - but it does mean
// ballots encrypted before a restart become undecryptable after one. Set
// ELECTION_PRIVATE_KEY (PEM) for a stable key once persistence is added.

const crypto = require("crypto");

let privateKey;
let publicKey;

if (process.env.ELECTION_PRIVATE_KEY) {
    privateKey = crypto.createPrivateKey(process.env.ELECTION_PRIVATE_KEY);
    publicKey = crypto.createPublicKey(privateKey);
    console.log("🔑 Election keypair loaded from ELECTION_PRIVATE_KEY.");
} else {
    const generated = crypto.generateKeyPairSync("rsa", {
        modulusLength: 4096,
        publicExponent: 0x10001
    });
    privateKey = generated.privateKey;
    publicKey = generated.publicKey;
    console.warn(
        "⚠️  ELECTION_PRIVATE_KEY not set - generated an ephemeral election " +
        "keypair in memory. It will change on every restart, invalidating " +
        "any ballots encrypted before that restart. Fine for a demo; set " +
        "ELECTION_PRIVATE_KEY for a stable key in a persistent deployment."
    );
}

const getPublicKeyJwk = () => publicKey.export({ format: "jwk" });

// A valid RSA-OAEP ciphertext is exactly one modulus long.
const CIPHERTEXT_BYTES = privateKey.asymmetricKeyDetails.modulusLength / 8;

const decryptChoice = (base64Ciphertext) => {
    const buffer = Buffer.from(base64Ciphertext, "base64");
    const plaintext = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        buffer
    );
    return plaintext.toString("utf8");
};

module.exports = { getPublicKeyJwk, decryptChoice, CIPHERTEXT_BYTES };
