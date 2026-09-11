// Centralized, fail-fast environment configuration.
// Reading secrets in one place (instead of each file defining its own
// fallback) is what should have prevented the JWT_SECRET env-var-name
// mismatch that broke production earlier — see git history.

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

module.exports = { JWT_SECRET, ADMIN_SETUP_KEY };
