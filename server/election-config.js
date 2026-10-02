// Static configuration for the demo election.
// Candidates are members of the (synthetic) roll who are eligible and
// owner-occupied; their names are resolved from the database at request time.

module.exports = {
    ELECTION_ID: "rwa-2026",
    ELECTION_TITLE: "Parijat Residency RWA - President (Demo)",

    CANDIDATES: [
        { id: "c1", membershipNo: "PRW-004", color: "#3b82f6" },
        { id: "c2", membershipNo: "PRW-011", color: "#ef4444" },
        { id: "c3", membershipNo: "PRW-024", color: "#22c55e" },
        { id: "c4", membershipNo: "PRW-034", color: "#a855f7" },
    ],

    // A ring smaller than this gives no real anonymity, so voting cannot open.
    MIN_RING_SIZE: 3,

    // Ballot and redemption times are rounded down to this bucket so they
    // cannot be matched against each other.
    TIME_BUCKET_MS: 15 * 60 * 1000,
};
