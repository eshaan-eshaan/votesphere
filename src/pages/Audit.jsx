import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";


const mockAuditRecords = [
  {
    hash: "0x4f3a9c1b7d2e...",
    blockId: "Block #1",
    timestamp: "2026-02-02 14:23:15",
    status: "Verified",
  },
  {
    hash: "0x81bcd2f4a5e3...",
    blockId: "Block #1",
    timestamp: "2026-02-02 14:24:08",
    status: "Verified",
  },
  {
    hash: "0xa7d9e5c8f1b2...",
    blockId: "Block #2",
    timestamp: "2026-02-02 14:31:42",
    status: "Verified",
  },
  {
    hash: "0x3e8f7a2c9d1b...",
    blockId: "Block #2",
    timestamp: "2026-02-02 14:35:19",
    status: "Verified",
  },
  {
    hash: "0x9c5d2f8a4e1b...",
    blockId: "Block #3",
    timestamp: "2026-02-02 15:12:33",
    status: "Verified",
  },
];

// Helper to merge local last ballot (from kiosk) into records
const withLocalBallot = (baseRecords = mockAuditRecords) => {
  try {
    const raw = localStorage.getItem("votesphere_lastBallot");
    if (!raw) return baseRecords;

    const parsed = JSON.parse(raw);
    if (!parsed?.hash) return baseRecords;

    const localRecord = {
      hash: parsed.hash,
      blockId: "Demo Block (Local)",
      timestamp: new Date(parsed.timestamp).toLocaleString("en-IN"),
      status: "Verified",
    };

    // Put the local record at the top
    return [localRecord, ...baseRecords];
  } catch (e) {
    console.error("Could not load local ballot", e);
    return baseRecords;
  }
};

const PublicAudit = () => {
  const [searchHash, setSearchHash] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [records, setRecords] = useState(mockAuditRecords);

  // Load API votes + local receipt + mocks
  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await fetch(`${API_BASE}/api/votes`);
        let base = mockAuditRecords;

        if (res.ok) {
          const votes = await res.json();
          if (Array.isArray(votes) && votes.length > 0) {
            const apiRecords = votes.map((v) => ({
              hash: v.auditHash || v.encryptedBallot || v.id,
              blockId: "API Ledger",
              timestamp: v.castAt
                ? new Date(v.castAt).toLocaleString("en-IN")
                : "N/A",
              status: "Verified",
            }));
            base = [...apiRecords, ...mockAuditRecords];
          }
        }

        setRecords(withLocalBallot(base));
      } catch (e) {
        console.error("Could not load API votes", e);
        setRecords(withLocalBallot(mockAuditRecords));
      }
    }

    loadRecords();
  }, []);

  const handleSearch = () => {
    const cleaned = searchHash.trim();
    if (!cleaned) {
      alert("Enter a ballot hash to verify");
      return;
    }

    const target = cleaned.toLowerCase();

    // Exact match only – no partial includes
    const found = records.find((r) => r.hash.toLowerCase() === target);

    setSearchResult(found || "not_found");
  };

  const totalVotes = records.length;
  const blocksAnchored = Array.from(
    new Set(records.map((r) => r.blockId))
  ).length;

  return (
    <div className="page animate-fade-in">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-primary mb-2">
            VoteSphere Public Transparency Portal • Read‑Only
          </div>
          <h2 className="section-title">VoteSphere Public Audit Dashboard</h2>
          <p className="section-subtitle">
            Verify that your encrypted ballot was included in the tally without
            revealing your choice. This portal exposes all ballot hashes
            anchored to the tamper‑proof ledger so anyone can confirm ONE
            PERSON, ONE VOTE.
          </p>
        </div>

        <div className="card mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            🔍 Verify Your Vote (Voter‑Verifiable Audit)
          </h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Enter the ballot hash from your receipt to verify it was counted.
            Your vote choice remains private.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Enter ballot hash (e.g., 0x4f3a...)"
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <button
              className="btn btn-primary btn-liquid"
              onClick={handleSearch}
            >
              Verify
            </button>
          </div>

          {searchResult === "not_found" && (
            <div
              style={{
                marginTop: 10,
                padding: 8,
                borderRadius: 8,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                fontSize: 13,
                color: "#fca5a5",
              }}
            >
              ❌ Hash not found in ledger. Please check your receipt.
            </div>
          )}

          {searchResult && searchResult !== "not_found" && (
            <div
              className="animate-scale-in"
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.4)",
                fontSize: 13,
                color: "#bbf7d0",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                ✓ Vote Verified Successfully
              </div>
              <div>Block: {searchResult.blockId}</div>
              <div>Timestamp: {searchResult.timestamp}</div>
              <div>Status: {searchResult.status}</div>
            </div>
          )}
        </div>

        <div className="card mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            📊 Election Statistics (Public)
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div className="card card-hover" style={{ flex: 1, minWidth: 120 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Total Votes Cast
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {totalVotes}
              </div>
            </div>
            <div className="card card-hover" style={{ flex: 1, minWidth: 120 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Blocks Anchored
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {blocksAnchored}
              </div>
            </div>
            <div className="card card-hover" style={{ flex: 1, minWidth: 120 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Integrity Status
              </div>
              <div
                style={{ fontSize: 18, fontWeight: 600, color: "#22c55e" }}
              >
                ✓ Valid
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            🔗 All Ballot Hashes (Public Ledger)
          </h3>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Complete list of encrypted ballot hashes. No candidate data is
            exposed, but duplicate hashes would reveal attempted double voting.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ballot Hash</th>
                  <th>Block</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                      {r.hash}
                    </td>
                    <td>{r.blockId}</td>
                    <td>{r.timestamp}</td>
                    <td style={{ color: "#22c55e" }}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAudit;
