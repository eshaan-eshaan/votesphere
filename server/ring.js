// Helpers for the ring-signature scheme. See docs/adr/ADR-001-*.md.
//
// Measured facts about the `lrs` library that these helpers exist for:
//  - the key image (first "_" part of a signature) is bound to the exact ring
//    (members AND order), so the ring must be frozen and canonically ordered;
//  - hex parts can be re-cased or zero-padded and still verify, so signatures
//    must be in canonical form before the key image is used for uniqueness;
//  - verify() accepts rings of one, duplicates and garbage keys, so the server
//    only ever verifies against its own frozen ring of validated keys.

const crypto = require("crypto");

// Group used by lrs (Crypto.LRS.SimpleAPI -> lgMedium): the RFC 2409
// section 6.1 768-bit MODP prime, generator 2, subgroup order q = (p-1)/2.
const P = BigInt(
    "0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74" +
    "020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374F" +
    "E1356D6D51C245E485B576625E7EC6F44C42E9A63A3620FFFFFFFFFFFFFFFF"
);
const Q = (P - 1n) / 2n;

// lrs prints numbers with BigInt#toString(16): lowercase, no leading zeros.
const CANONICAL_HEX = /^(?:0|[1-9a-f][0-9a-f]*)$/;

function modPow(base, exp, mod) {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
        if (e & 1n) result = (result * b) % mod;
        b = (b * b) % mod;
        e >>= 1n;
    }
    return result;
}

// Accepts any hex spelling a client might send and returns the canonical one,
// or null if it is not a valid ring public key (a non-identity member of the
// prime-order subgroup). Keys outside the subgroup could break verification.
function canonicalPublicKey(input) {
    if (typeof input !== "string" || !/^[0-9a-fA-F]{1,200}$/.test(input)) return null;
    const n = BigInt("0x" + input);
    if (n < 2n || n >= P) return null;
    if (modPow(n, Q, P) !== 1n) return null;
    return n.toString(16);
}

// A signature is accepted only in canonical form: "_"-separated canonical hex.
// Returns the parts, or null.
function parseSignature(signature) {
    if (typeof signature !== "string" || signature.length > 200000) return null;
    const parts = signature.split("_");
    if (parts.length < 3 || !parts.every((p) => CANONICAL_HEX.test(p))) return null;
    return parts;
}

// Canonical ring order: ascending numeric value.
function sortRing(keys) {
    return keys.slice().sort((a, b) => {
        const x = BigInt("0x" + a);
        const y = BigInt("0x" + b);
        return x < y ? -1 : x > y ? 1 : 0;
    });
}

function ringHash(ring) {
    return crypto.createHash("sha256").update(ring.join("\n")).digest("hex");
}

function bucketDate(date, bucketMs) {
    return new Date(Math.floor(date.getTime() / bucketMs) * bucketMs);
}

module.exports = { canonicalPublicKey, parseSignature, sortRing, ringHash, bucketDate };
