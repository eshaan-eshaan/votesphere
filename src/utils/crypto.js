export const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
};

export const exportKey = async (key) => {
    return await window.crypto.subtle.exportKey("jwk", key);
};

export const importKey = async (jwk) => {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
};

export const encryptVote = async (plaintext, publicKey) => {
    const encoded = new TextEncoder().encode(plaintext);
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const generateSigningKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["sign", "verify"]
    );
};

export const exportSigningKey = async (key) => {
    return await window.crypto.subtle.exportKey("jwk", key);
};

export const signData = async (data, privateKey) => {
    const encoded = new TextEncoder().encode(data);
    const signature = await window.crypto.subtle.sign(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        privateKey,
        encoded
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

export const importSigningKey = async (jwk) => {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        true,
        ["verify"]
    );
};

export const verifySignature = async (data, signature, publicKey) => {
    const encoded = new TextEncoder().encode(data);
    const sigBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    return await window.crypto.subtle.verify(
        {
            name: "ECDSA",
            hash: { name: "SHA-256" },
        },
        publicKey,
        sigBuffer,
        encoded
    );
};
