// A voter's ring identity lives in this browser's localStorage between key
// registration and voting. It is also exportable as a backup file, so the same
// voter can vote from another device. Anyone holding the file can vote as
// that voter, so it must be kept private.

const identityKey = (electionId) => `votesphere:identity:${electionId}`;
const votedKey = (electionId) => `votesphere:voted:${electionId}`;

const HEX = /^[0-9a-f]+$/;

export const loadIdentity = (electionId) => {
    try {
        const parsed = JSON.parse(localStorage.getItem(identityKey(electionId)) || "null");
        return parsed && HEX.test(parsed.publicKey) && HEX.test(parsed.privateKey) ? parsed : null;
    } catch {
        return null;
    }
};

export const saveIdentity = (electionId, identity) => {
    localStorage.setItem(
        identityKey(electionId),
        JSON.stringify({ publicKey: identity.publicKey, privateKey: identity.privateKey })
    );
};

export const getVotedBallot = (electionId) => {
    try {
        return localStorage.getItem(votedKey(electionId));
    } catch {
        return null;
    }
};

export const rememberVoted = (electionId, ballotId) => {
    try {
        localStorage.setItem(votedKey(electionId), ballotId);
    } catch {
        // Convenience only; the server enforces one vote per identity.
    }
};

export const downloadIdentityBackup = (electionId, identity) => {
    const file = { app: "votesphere", electionId, publicKey: identity.publicKey, privateKey: identity.privateKey };
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `votesphere-key-${electionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
};

// Returns the identity from a backup file's text, or throws a readable error.
export const parseIdentityBackup = (text, electionId) => {
    let file;
    try {
        file = JSON.parse(text);
    } catch {
        throw new Error("That file is not a VoteSphere key backup.");
    }
    if (!file || file.app !== "votesphere" || !HEX.test(file.publicKey) || !HEX.test(file.privateKey)) {
        throw new Error("That file is not a VoteSphere key backup.");
    }
    if (file.electionId !== electionId) throw new Error("That backup is for a different election.");
    return { publicKey: file.publicKey, privateKey: file.privateKey };
};
