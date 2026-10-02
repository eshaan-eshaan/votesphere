// Creates ./.env for docker-compose with fresh random secrets, if it does not
// exist yet. The file is git-ignored. Run via `npm run docker:env`.
import fs from "node:fs";
import crypto from "node:crypto";

const file = new URL("../.env", import.meta.url);

if (fs.existsSync(file)) {
    console.log(".env already exists - leaving it unchanged.");
} else {
    const jwt = crypto.randomBytes(48).toString("hex");
    const setupKey = crypto.randomBytes(18).toString("hex");
    fs.writeFileSync(
        file,
        [
            "# Local secrets for docker-compose. Git-ignored. Do not change JWT_SECRET once an",
            "# election has ballots (the election key is encrypted under it).",
            `JWT_SECRET=${jwt}`,
            "# Needed once, to register the first admin at /admin-login.",
            `ADMIN_SETUP_KEY=${setupKey}`,
            "# Optional: comma-separated admin emails allowed to reset the election.",
            "SUPERADMIN_EMAILS=",
            "",
        ].join("\n")
    );
    console.log("Created .env with random secrets.");
    console.log(`Your admin setup key (for the first admin signup): ${setupKey}`);
}
