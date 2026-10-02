// Ballot encryption with the election's public key (Web Crypto, RSA-OAEP/SHA-256).
// The matching private key stays on the server, which decrypts only to tally.
// The parameters must match server/election-keys.js.

export const importKey = async (jwk) => {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
};

export const encryptVote = async (plaintext, publicKey) => {
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, encoded);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};
