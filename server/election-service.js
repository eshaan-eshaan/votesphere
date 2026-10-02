// Shared election helpers used by the election and vote routes.

const prisma = require("./db");
const { ELECTION_ID, CANDIDATES } = require("./election-config");
const { sortRing, ringHash } = require("./ring");

const getElection = () => prisma.election.findUnique({ where: { id: ELECTION_ID } });

const isEligible = (member) => member.duesCleared && !member.titleDisputed;
const ineligibleReason = (member) =>
    !member.duesCleared ? "DUES_PENDING" : member.titleDisputed ? "TITLE_DISPUTED" : null;

const candidateIds = () => CANDIDATES.map((c) => c.id);

// The frozen ring never changes once voting opens (key registration is closed),
// so it is cached by its hash.
const ringCache = new Map();

async function getFrozenRing(election) {
    if (!election.ringHash) return null;
    if (ringCache.has(election.ringHash)) return ringCache.get(election.ringHash);

    const rows = await prisma.ringMember.findMany({ where: { electionId: election.id } });
    const ring = sortRing(rows.map((r) => r.publicKey));
    if (ringHash(ring) !== election.ringHash) {
        throw new Error("Stored ring does not match the frozen ring hash.");
    }
    ringCache.set(election.ringHash, ring);
    return ring;
}

const clearRingCache = () => ringCache.clear();

module.exports = {
    getElection,
    isEligible,
    ineligibleReason,
    candidateIds,
    getFrozenRing,
    clearRingCache,
};
