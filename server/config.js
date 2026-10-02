// Centralized, fail-fast environment configuration.
// Reading secrets in one place (instead of each file defining its own
// fallback) is what should have prevented the JWT_SECRET env-var-name
// mismatch that broke production earlier - see git history.

const crypto = require("crypto");

if (!process.env.JWT_SECRET) {
    throw new Error(
        "JWT_SECRET is not set. Refusing to start with an insecure default. " +
        "Set it in your environment (see server/.env.example)."
    );
}

const JWT_SECRET = process.env.JWT_SECRET;

// ADMIN_SETUP_KEY is optional at the config level: if unset, admin
// registration is simply disabled (fail closed) rather than open to anyone.
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || null;

// Optional comma-separated list of admin emails that get the superadmin role
// (election reset, vote deletion). Lets the role survive database resets.
const SUPERADMIN_EMAILS = new Set(
    (process.env.SUPERADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
);

// Key for hashing voting codes, derived from JWT_SECRET with domain
// separation so no extra secret has to be configured.
const CODE_HMAC_KEY = crypto
    .createHmac("sha256", JWT_SECRET)
    .update("votesphere/voting-code/v1")
    .digest();

// Key that encrypts the election private key stored in the database.
const ELECTION_KEY_WRAP_KEY = crypto
    .createHmac("sha256", JWT_SECRET)
    .update("votesphere/election-key-wrap/v1")
    .digest();

module.exports = { JWT_SECRET, ADMIN_SETUP_KEY, SUPERADMIN_EMAILS, CODE_HMAC_KEY, ELECTION_KEY_WRAP_KEY };
