// Voting codes: random, single-use, typeable. See docs/adr/ADR-001-*.md.
//
// A code is 100 random bits written as 20 Crockford-base32 characters plus one
// check character, printed as  VS-XXXX-XXXX-XXXX-XXXX-C.  There is nothing to
// "decode": the code carries no identity. Only an HMAC of it is stored.

const crypto = require("crypto");
const { CODE_HMAC_KEY } = require("./config");

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // no I, L, O, U
const DATA_CHARS = 20;

function checkChar(chars) {
    let sum = 0;
    for (let i = 0; i < chars.length; i++) sum += (i + 1) * ALPHABET.indexOf(chars[i]);
    return ALPHABET[sum % 32];
}

function generateCode() {
    const bytes = crypto.randomBytes(13);
    let bits = "";
    for (const b of bytes) bits += b.toString(2).padStart(8, "0");
    let chars = "";
    for (let i = 0; i < DATA_CHARS; i++) {
        chars += ALPHABET[parseInt(bits.slice(i * 5, i * 5 + 5), 2)];
    }
    chars += checkChar(chars);
    return chars;
}

function formatCode(chars) {
    return `VS-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}-${chars.slice(16, 20)}${chars.slice(20)}`;
}

// Accepts what a person might type (lowercase, spaces, hyphens, O for 0, I/L
// for 1, optional "VS" prefix) and returns the 21 canonical characters, or
// null if it is malformed or the check character is wrong.
function normalizeCode(input) {
    if (typeof input !== "string" || input.length > 64) return null;
    let s = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
    if (s.length === DATA_CHARS + 3 && s.startsWith("VS")) s = s.slice(2);
    s = s.replace(/O/g, "0").replace(/[IL]/g, "1");
    if (s.length !== DATA_CHARS + 1) return null;
    if (![...s].every((c) => ALPHABET.includes(c))) return null;
    if (checkChar(s.slice(0, DATA_CHARS)) !== s[DATA_CHARS]) return null;
    return s;
}

function hashCode(canonicalChars) {
    return crypto.createHmac("sha256", CODE_HMAC_KEY).update(canonicalChars).digest("hex");
}

module.exports = { generateCode, formatCode, normalizeCode, hashCode };
