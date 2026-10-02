// Linkable ring signatures via the `lrs` library.
//
// The ring is NOT chosen by the voter: it is the server's frozen ring of
// registered public keys, in the server's canonical order (the key image
// changes with the ring's members and order, so any other ring would be
// rejected). See docs/adr/ADR-001-*.md.
import lrs from "lrs";

// A voter's ring identity { publicKey, privateKey } (hex). Generated in the
// browser at registration; the private key never leaves this device.
export const generateIdentity = () => lrs.gen();

export const signVote = (message, identity, ring) => lrs.sign(ring, identity, message);

export const verifySignature = (signature, ring, message) => {
    try {
        return lrs.verify(ring, signature, message);
    } catch {
        return false;
    }
};
