/*
 * Ring Signature Utility
 * Implements Linkable Spontaneous Anonymous Group (LSAG) signatures using 'lrs' library.
 */
import lrs from 'lrs';

/**
 * Generate a new identity (key pair) for a voter.
 * In a real system, these would be derived from a master secret or PKI.
 */
export const generateIdentity = () => {
    const account = lrs.gen(); // Returns { publicKey, privateKey }
    return account;
};

/**
 * Sign a message (vote) using a ring of public keys.
 * @param {string} message - The data to sign (e.g., ballot choice).
 * @param {object} signer - The signer's key pair { publicKey, privateKey }.
 * @param {string[]} ringPublicKeys - Array of hex public keys (including signer's).
 */
export const signVote = (message, signer, ringPublicKeys) => {
    try {
        // Ensure ring includes signer
        if (!ringPublicKeys.includes(signer.publicKey)) {
            throw new Error("Signer's public key must be in the ring.");
        }

        // Sign
        const signature = lrs.sign(ringPublicKeys, signer, message);
        return signature;
    } catch (e) {
        console.error("Signing failed:", e);
        throw e;
    }
};

/**
 * Verify a ring signature.
 * @param {string} signature - The signature string.
 * @param {string[]} ringPublicKeys - The ring of public keys.
 * @param {string} message - The original message.
 */
export const verifySignature = (signature, ringPublicKeys, message) => {
    try {
        return lrs.verify(ringPublicKeys, signature, message);
    } catch (e) {
        console.error("Verification error:", e);
        return false;
    }
};

/**
 * Extract Linkability Tag (Key Image) to prevent double voting.
 * The lrs signature format is typically: c_0 + s_0 + ... + s_n + keyImage
 * or some concatenation. 
 * Since 'lrs' library doesn't expose extraction, but 'link' works, 
 * we will use the signature itself as the source of the tag. 
 * 
 * However, to store a unique tag in the DB, we need a consistent string 
 * that is the SAME for every signature by the same user on the same ring?
 * No, LSAG key image is unique per (user, ring?). actually key image is usually I = x * Hp(ring).
 * 
 * We need to be careful. If 'lrs' library creates a tailored key image for the specific message, then it's per-message.
 * Classic LSAG key image is I = x * Hp(P1...Pn). Ideally it's fixed per User+Ring.
 * 
 * Let's rely on the library's 'link' function for verification if possible, 
 * BUT for a DB unique constraint, we really need that string.
 * 
 * Looking at the lrs signature string from debug output:
 * It's a long hex string with underscores.
 * "ba27..._..._..._..."
 * 
 * The parts are likely:
 * 1. c_0 (Challenge)
 * 2. s_0 ... s_n (Responses)
 * 3. Key Image (I)
 * 
 * In standard lrs implementations, the key image is often the second or last component.
 * Let's assume the component that is constant across signatures for different messages is the Key Image.
 * 
 * My debug script showed:
 * Alice signed "Vote for A" -> Sig1
 * Alice signed "Vote for B" -> Sig2
 * lrs.link(Sig1, Sig2) -> true
 * 
 * This implies they share a component. 
 * I'll update the debug script to finding the common component and use that as the Key Image.
 */
export const getKeyImage = (signature) => {
    // Verified via test-lrs.js:
    // The first component of the signature string (split by '_') is constant for the same signer + ring.
    // This serves as the Linkability Tag (Key Image).
    const parts = signature.split('_');
    if (!parts || parts.length < 2) {
        throw new Error("Invalid ring signature format");
    }
    return parts[0];
};
