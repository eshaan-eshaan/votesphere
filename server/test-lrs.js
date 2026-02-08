const lrs = require('lrs');

console.log("LRS Library exports:", Object.keys(lrs));
const alice = lrs.gen();
const bob = lrs.gen();
const charlie = lrs.gen();

const ring = [alice.publicKey, bob.publicKey, charlie.publicKey];
const msg = "Vote for A";

console.log("Signing...");
const signed = lrs.sign(ring, alice, msg);
console.log("Signature (Type):", typeof signed);
console.log("Signature (Value):", signed);

const valid = lrs.verify(ring, signed, msg);
console.log("Valid?", valid);

// Check double signing
const signed2 = lrs.sign(ring, alice, "Vote for B");
const linked = lrs.link(signed, signed2);
console.log("Linked (Alice signed both)?", linked);

// Analyze structure
const parts1 = signed.split('_');
const parts2 = signed2.split('_');

console.log(`Sig 1 has ${parts1.length} parts.`);
console.log(`Sig 2 has ${parts2.length} parts.`);

for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] === parts2[i]) {
        console.log(`Part ${i} is IDENTICAL (Potential Key Image):`, parts1[i].substring(0, 20) + "...");
    } else {
        console.log(`Part ${i} differs.`);
    }
}

const signedBob = lrs.sign(ring, bob, "Vote for B");
const linkedBob = lrs.link(signed, signedBob);
console.log("Linked (Alice vs Bob)?", linkedBob);

// key image?
// lrs might not expose key image directly in a format we can store easily as a unique string unless we dig.
// However, lrs.link(sig1, sig2) works.
// Ideally we store a 'tag'.
