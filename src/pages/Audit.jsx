import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import { useTheme } from "../components/ThemeContext";
import { API_BASE } from "../config";

// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const mockAuditRecords = [
  { hash: "0x4f3a...9c1b", blockId: "Block #1", timestamp: "10:30 AM", status: "Anchored" },
  { hash: "0x81bc...d2f4", blockId: "Block #2", timestamp: "11:15 AM", status: "Anchored" },
  { hash: "0xa7d9...e5c8", blockId: "Block #3", timestamp: "12:00 PM", status: "Finalizing" },
];

const withLocalBallot = (baseRecords = mockAuditRecords) => {
  try {
    const raw = localStorage.getItem("votesphere_lastBallot");
    if (!raw) return baseRecords;

    const parsed = JSON.parse(raw);
    if (!parsed?.vote) return baseRecords;

    const localRecord = {
      hash: parsed.vote.transactionHash || parsed.vote.encryptedBallot,
      blockId: "Demo Block (Local)",
      timestamp: new Date(parsed.vote.castAt || Date.now()).toLocaleString("en-IN"),
      status: "Verified",
      isLocal: true
    };

    if (baseRecords.find(r => r.hash === localRecord.hash)) return baseRecords;

    return [localRecord, ...baseRecords];
  } catch (e) {
    console.error("Could not load local ballot", e);
    return baseRecords;
  }
};

const PublicAudit = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Theme-aware colors
  const headingColor = isLight ? "#1e293b" : "white";
  const textColor = isLight ? "#1e293b" : "#cbd5e1";
  const mutedColor = isLight ? "#475569" : "#94a3b8";
  const headerColor = isLight ? "#4f46e5" : "#94a3b8";
  const hashColor = isLight ? "#4f46e5" : "#94a3b8";
  const rowBg = isLight ? "rgba(99, 102, 241, 0.04)" : "rgba(255,255,255,0.03)";
  const inputBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.3)";
  const inputBorder = isLight ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.1)";
  const inputText = isLight ? "#0f172a" : "white";

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
              hash: v.ballotId,
              blockId: `Block #${v.ballotId.substring(0, 8)}`,
              timestamp: v.castAt ? new Date(v.castAt).toLocaleString("en-IN") : "N/A",
              status: v.signature ? `Ring Signed (Size: ${v.ringSize})` : "Verified",
              keyImage: v.keyImage
            }));
            base = [...apiRecords, ...mockAuditRecords];
          }
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

    // 1. Remove trailing dots (from copied truncated text) and trim
    let query = searchHash.replace(/\.+$/, "").trim();

    if (!query) {
      setVerifyError("Enter a ballot hash from your receipt to verify.");
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      try {
        // Try strict match first
        let found = records.find((r) => r.hash === query);

        // If not found, try normalizing
        if (!found) {
          // 1. Replace spaces with underscores (common copy-paste issue)
          let normalized = query.replace(/\s+/g, "_");
          if (!found) found = records.find((r) => r.hash === normalized);

          // 2. Add 'ballot_' prefix if missing
          if (!found && !normalized.startsWith("ballot_")) {
            normalized = `ballot_${normalized}`;
            found = records.find((r) => r.hash === normalized);
          }
        }

        if (found) {
          setSearchResult(found);
        } else {
          setVerifyError("Hash not found in ledger. Please check your receipt.");
        }
      } catch (e) {
        console.error(e);
        setVerifyError("Unexpected error while searching the ledger.");
      } finally {
        setIsVerifying(false);
      }
    }, 500);
  };

  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-center"
        >
          <div className="badge badge-primary mb-3">
            VoteSphere Public Transparency Portal • Read‑Only
          </div>
          <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem" }}>
            Public Audit Dashboard
          </h2>
          <p className="text-muted" style={{ maxWidth: "800px", margin: "0 auto" }}>
            Verify that your encrypted ballot was included in the tally without
            revealing your choice. This portal exposes all ballots anchored
            to the tamper‑proof ledger.
          </p>
        </motion.div>

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
              color: "#ef4444",
            }}
          >
            ⚠ {loadError}
          </div>
        )}

        <GlassCard style={{ marginBottom: "2.5rem", marginTop: "2rem", padding: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: headingColor }}>
            🔍 Verify Your Vote (Voter‑Verifiable Audit)
          </h3>
          <p className="text-muted mb-4">
            Enter the ballot hash from your receipt to verify it was counted. Your vote choice remains private.
          </p>

          <div className="flex gap-4 flex-wrap">
            <input
              className="input flex-1"
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: inputText,
                minWidth: "250px"
              }}
              placeholder="Enter ballot hash (e.g., 0x4f3a...)"
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={isLoading || isVerifying || !searchHash.trim()}
            >
              {isVerifying ? "Verifying..." : "Verify on Ledger"}
            </button>
          </div>

          {/* Verify error banner */}
          {verifyError && (
            <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              ⚠ {verifyError}
            </div>
          )}

          {searchResult === "not_found" && !verifyError && (
            <div className="mt-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              ❌ Hash not found in ledger. Please check your receipt.
            </div>
          )}

          {searchResult && searchResult !== "not_found" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-4 rounded bg-green-500/10 border border-green-500/30 text-green-300"
            >
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                ✓ Vote Verified Successfully
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div><span className="text-gray-400">Block:</span> {searchResult.blockId}</div>
                <div><span className="text-gray-400">Timestamp:</span> {searchResult.timestamp}</div>
                <div><span className="text-gray-400">Status:</span> {searchResult.status}</div>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Full Ledger Table */}
        <GlassCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: headingColor }}>Public Ballot Ledger</h3>
            <div style={{ fontSize: "0.9rem", color: mutedColor }}>
              Total Records: <span style={{ color: isLight ? "#4f46e5" : "#22c55e", fontWeight: "bold" }}>{records.length}</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: headerColor }}>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Encrypted Ballot Hash</th>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Block ID</th>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 50).map((r, i) => (
                  <tr key={i} style={{ background: r.isLocal ? "rgba(34, 197, 94, 0.08)" : rowBg }}>
                    <td style={{ padding: "1rem", borderRadius: "8px 0 0 8px", color: textColor }}>
                      {r.timestamp}
                    </td>
                    <td style={{ padding: "1rem", fontFamily: "monospace", color: hashColor }}>
                      {r.hash.substring(0, 24)}...
                    </td>
                    <td style={{ padding: "1rem", color: mutedColor }}>
                      {r.blockId}
                    </td>
                    <td style={{ padding: "1rem", borderRadius: "0 8px 8px 0" }}>
                      <span style={{
                        color: r.status === "Verified" ? "#22c55e" : mutedColor,
                        background: r.status === "Verified" ? "rgba(34, 197, 94, 0.15)" : "rgba(148,163,184,0.1)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: 600
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center text-xs mt-4" style={{ color: mutedColor }}>
              Showing latest 50 records from the immutable ledger.
            </div>
          </div>
        </GlassCard>
      </div>
    </ScrollLayout>
  );
};

export default PublicAudit;
