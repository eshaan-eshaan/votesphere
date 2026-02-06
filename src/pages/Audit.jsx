import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const mockAuditRecords = [
  // ...same mock records as before...
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      setLoadError("");
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
        } else {
          setLoadError(
            "Could not load live ledger from server. Showing demo data only."
          );
        }

        setRecords(withLocalBallot(base));
      } catch (e) {
        console.error("Could not load API votes", e);
        setLoadError(
          "Network error while loading ledger. Showing demo data only."
        );
        setRecords(withLocalBallot(mockAuditRecords));
      } finally {
        setIsLoading(false);
      }
    }

    loadRecords();
  }, []);

  const handleSearch = () => {
    if (isLoading || isVerifying) return;

    setVerifyError("");
    setSearchResult(null);

    const cleaned = searchHash.trim();
    if (!cleaned) {
      setVerifyError("Enter a ballot hash from your receipt to verify.");
      return;
    }

    setIsVerifying(true);
    try {
      const target = cleaned.toLowerCase();
      const found = records.find((r) => r.hash.toLowerCase() === target);
      setSearchResult(found || "not_found");
      if (!found) {
        setVerifyError("");
      }
    } catch (e) {
      console.error(e);
      setVerifyError("Unexpected error while searching the ledger.");
    } finally {
      setIsVerifying(false);
    }
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
            revealing your choice. This portal exposes all ballot hashes anchored
            to the tamper‑proof ledger so anyone can confirm ONE PERSON, ONE VOTE.
          </p>
        </div>

        {/* Ledger load error banner */}
        {loadError && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              backgroundColor: "rgba(248, 113, 113, 0.1)",
              border: "1px solid rgba(248, 113, 113, 0.6)",
              fontSize: 13,
              color: "#fecaca",
            }}
          >
            ⚠ {loadError}
          </div>
        )}

        <div className="card mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            🔍 Verify Your Vote (Voter‑Verifiable Audit)
          </h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 12 }}>
            Enter the ballot hash from your receipt to verify it was counted. Your
            vote choice remains private.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Enter ballot hash (e.g., 0x4f3a...)"
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
              disabled={isLoading}
            />
            <button
              className="btn btn-primary btn-liquid"
              onClick={handleSearch}
              disabled={
                isLoading || isVerifying || !searchHash.trim()
              }
            >
              {isLoading
                ? "Loading ledger..."
                : isVerifying
                ? "Verifying..."
                : "Verify"}
            </button>
          </div>

          {/* Verify error banner */}
          {verifyError && (
            <div
              style={{
                marginTop: 10,
                padding: 8,
                borderRadius: 8,
                backgroundColor: "rgba(248, 113, 113, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.6)",
                fontSize: 13,
                color: "#fecaca",
              }}
            >
              ⚠ {verifyError}
            </div>
          )}

          {searchResult === "not_found" && !verifyError && (
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

        {/* Baaki stats + table wala code tumhare original jaisa hi reh sakta hai */}
        {/* ...existing statistics and table JSX... */}
      </div>
    </div>
  );
};

export default PublicAudit;
