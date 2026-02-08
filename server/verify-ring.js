
const lrs = require('lrs');

async function testRingSignatureFlow() {
    const BASE_URL = "http://localhost:5000/api/votes";

    console.log("Testing Ring Signature Voting Flow...");

    try {
        // 1. Setup Identities
        console.log("1. Generating Ring Identities...");
        const voter = lrs.gen();
        const decoys = [lrs.gen().publicKey, lrs.gen().publicKey, lrs.gen().publicKey, lrs.gen().publicKey];
        const ring = [voter.publicKey, ...decoys].sort();

        console.log(`   Ring Size: ${ring.length}`);
        console.log(`   Voter Public Key: ${voter.publicKey.substring(0, 20)}...`);

        // 2. Sign Vote
        const encryptedBallot = "ENCRYPTED_DATA_MOCK";
        const signature = lrs.sign(ring, voter, encryptedBallot);

        // Extract key image (first part) to check
        const parts = signature.split('_');
        const keyImage = parts[0];
        console.log(`   Generated Signature (Key Image: ${keyImage.substring(0, 20)}...)`);

        // 3. Submit Vote
        console.log("\n2. Submitting Vote...");
        const payload = {
            electionId: "test-election",
            encryptedBallot: encryptedBallot,
            choiceId: "cand-a",
            signature: signature,
            ring: ring,
            voterIdHash: "ANONYMOUS_TESTER" // Should be ignored/optional
        };

        const res = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(`Submission failed: ${data.error}`);
        }
        console.log("✅ Vote Accepted:", data);

        // 4. Try Double Voting (Same Voter, Different Message/Ring?)
        // If we use same ring and voter, key image should be identical for Linkable Ring Signatures
        console.log("\n3. Attempting Double Vote (Same Voter)...");

        // Even if we change the message, LRS key image should be same if it's based on (user, ring).
        // Let's test with new message.
        const newEncryptedBallot = "NEW_ENCRYPTED_DATA";
        const newSignature = lrs.sign(ring, voter, newEncryptedBallot);

        const resDouble = await fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...payload,
                encryptedBallot: newEncryptedBallot,
                signature: newSignature
            })
        });

        const dataDouble = await resDouble.json();
        if (resDouble.status === 409) {
            console.log("✅ Double Voting Prevented (409 Conflict):", dataDouble.error);
        } else {
            console.error("❌ Double Voting Check Failed! Response:", dataDouble);
            if (resDouble.ok) console.error("   The system allowed a double vote!");
        }

    } catch (err) {
        console.error("❌ Test failed:", err.message);
    }
}

// Simple delay to let server start
setTimeout(testRingSignatureFlow, 2000);
