import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import { useTheme } from "../components/ThemeContext";
import { API_BASE } from "../config";

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

  // A receipt QR code opens /audit?ballot=<id>; prefill the search box from it.
  const [searchId, setSearchId] = useState(() => new URLSearchParams(window.location.search).get("ballot") || "");
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await fetch(`${API_BASE}/api/votes`);
        if (!res.ok) throw new Error("bad response");
        setRecords(await res.json());
      } catch {
        setLoadError("Could not load the ledger. The server may be waking up - try again in a moment.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRecords();
  }, []);

  const handleSearch = () => {
    setVerifyError("");
    setSearchResult(null);

    const query = searchId.trim();
    if (!query) {
      setVerifyError("Enter the Ballot ID from your receipt to verify.");
      return;
    }
    const found = records.find((r) => r.ballotId === query);
    if (found) setSearchResult(found);
    else setVerifyError("Ballot ID not found in the ledger. Check your receipt.");
  };

  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-center">
          <div className="badge badge-primary mb-3">VoteSphere Public Transparency Portal • Read‑Only</div>
          <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem" }}>Public Audit Dashboard</h2>
          <p className="text-muted" style={{ maxWidth: "800px", margin: "0 auto" }}>
            Verify that your ballot was recorded without revealing your choice. The ledger lists every ballot cast,
            with its anonymity-ring size and link tag; nothing here identifies a voter or shows how anyone voted.
          </p>
        </motion.div>

        {loadError && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, backgroundColor: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.6)", fontSize: 13, color: "#ef4444" }}>
            ⚠ {loadError}
          </div>
        )}

        <GlassCard style={{ marginBottom: "2.5rem", marginTop: "2rem", padding: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: headingColor }}>
            🔍 Verify Your Vote
          </h3>
          <p className="text-muted mb-4">Paste the Ballot ID from your receipt to confirm it was recorded.</p>

          <div className="flex gap-4 flex-wrap">
            <input
              className="input flex-1"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputText, minWidth: "250px" }}
              placeholder="ballot_..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              disabled={isLoading}
            />
            <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading || !searchId.trim()}>
              Verify on Ledger
            </button>
          </div>

          {verifyError && (
            <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "0.9rem" }}>
              ⚠ {verifyError}
            </div>
          )}

          {searchResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ marginTop: "1rem", padding: "1rem", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "1.1rem" }}>✓ Ballot found in the ledger</div>
              <div style={{ fontSize: "0.9rem", display: "grid", gap: "0.25rem" }}>
                <div><span style={{ color: "#94a3b8" }}>Recorded (rounded to 15 min):</span> {new Date(searchResult.castAt).toLocaleString()}</div>
                <div><span style={{ color: "#94a3b8" }}>Signed as one of:</span> {searchResult.ringSize} registered voters</div>
                <div style={{ wordBreak: "break-all" }}><span style={{ color: "#94a3b8" }}>Link tag:</span> <span style={{ fontFamily: "monospace" }}>{searchResult.keyImage}</span></div>
              </div>
            </motion.div>
          )}
        </GlassCard>

        <GlassCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: headingColor }}>Public Ballot Ledger</h3>
            <div style={{ fontSize: "0.9rem", color: mutedColor }}>
              Ballots: <span style={{ color: isLight ? "#4f46e5" : "#22c55e", fontWeight: "bold" }}>{records.length}</span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", color: headerColor }}>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Time (rounded)</th>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Ballot ID</th>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Link tag</th>
                  <th style={{ padding: "0 1rem", fontWeight: 600 }}>Ring</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.ballotId} style={{ background: r.ballotId === searchId.trim() ? "rgba(34, 197, 94, 0.08)" : rowBg }}>
                    <td style={{ padding: "1rem", borderRadius: "8px 0 0 8px", color: textColor }}>{new Date(r.castAt).toLocaleString()}</td>
                    <td style={{ padding: "1rem", fontFamily: "monospace", color: hashColor }}>{r.ballotId}</td>
                    <td style={{ padding: "1rem", fontFamily: "monospace", color: mutedColor }}>{r.keyImage.slice(0, 16)}...</td>
                    <td style={{ padding: "1rem", borderRadius: "0 8px 8px 0", color: textColor }}>1 of {r.ringSize}</td>
                  </tr>
                ))}
                {!isLoading && records.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: mutedColor }}>No ballots have been cast yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </ScrollLayout>
  );
};

export default PublicAudit;
