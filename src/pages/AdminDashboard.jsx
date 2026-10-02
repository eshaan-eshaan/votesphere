import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { useElection } from "../hooks/useElection";
import { API_BASE } from "../config";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import TiltCard from "../components/ui/TiltCard";

const PHASES = [
  { id: "DRAFT", label: "Setup" },
  { id: "REGISTRATION", label: "Key registration" },
  { id: "VOTING", label: "Voting" },
  { id: "CLOSED", label: "Closed" },
];

const api = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

const downloadCsv = (rows, filename) => {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const cols = Object.keys(rows[0]);
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const th = { padding: "0 1rem", fontWeight: 600 };
const td = { padding: "0.75rem 1rem" };
const muted = { color: "#94a3b8" };

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === "light";

  const { election, refresh: refreshElection } = useElection(10000);
  const [adminStatus, setAdminStatus] = useState(null);
  const [members, setMembers] = useState([]);
  const [results, setResults] = useState(null);
  const [ballots, setBallots] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null); // { kind: "ok" | "error", text }

  const isSuperadmin = admin?.role === "superadmin";

  const loadAll = useCallback(async () => {
    try {
      const [status, roll, stats, votes] = await Promise.all([
        api("/api/election/admin/status"),
        api("/api/election/admin/members"),
        api("/api/stats"),
        api("/api/votes"),
      ]);
      setAdminStatus(status);
      setMembers(roll.members);
      setResults(stats);
      setBallots(votes);
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
    }
  }, []);

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 10000);
    return () => clearInterval(id);
  }, [loadAll]);

  const run = async (label, fn) => {
    setBusy(label);
    setMessage(null);
    try {
      await fn();
      await Promise.all([loadAll(), refreshElection()]);
    } catch (err) {
      setMessage({ kind: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  // Issues codes for members without one; `reissue` (membership numbers) also
  // replaces those members' unredeemed codes, so a lost sheet is recoverable.
  const issueCodes = (reissue = []) =>
    run("issue", async () => {
      const data = await api("/api/election/admin/issue-codes", { method: "POST", body: JSON.stringify({ reissue }) });
      if (data.issued.length > 0) {
        const fresh = new Set(data.issued.map((s) => s.membershipNo));
        setSheet((prev) =>
          [...(prev || []).filter((s) => !fresh.has(s.membershipNo)), ...data.issued]
            .sort((a, b) => a.membershipNo.localeCompare(b.membershipNo))
        );
      }
      setMessage({
        kind: "ok",
        text: data.issued.length > 0
          ? `${data.issued.length} voting code(s) ${reissue.length > 0 ? "re-issued (the old ones no longer work)" : "issued"}. They are shown below ONCE - download the sheet now.`
          : "Every eligible member already has a code.",
      });
    });

  const reissueCodes = (membershipNos, what) => {
    if (!window.confirm(`Replace the unredeemed voting code for ${what}? The old code(s) stop working immediately.`)) return;
    issueCodes(membershipNos);
  };

  const hideSheet = () => {
    if (!window.confirm("Hide the sheet? Codes cannot be shown again (you can re-issue unredeemed ones from the roll). Download the CSV first if you have not.")) return;
    setSheet(null);
  };

  const changePhase = (to) =>
    run(to, async () => {
      await api("/api/election/admin/phase", { method: "POST", body: JSON.stringify({ to }) });
      setMessage({ kind: "ok", text: `Election is now in the ${to} phase.` });
    });

  const resetElection = () => {
    if (!window.confirm("Wipe all codes, registered keys and ballots and return to Setup?")) return;
    run("reset", async () => {
      await api("/api/election/admin/reset", { method: "POST", body: JSON.stringify({ confirm: "RESET" }) });
      setSheet(null);
      setMessage({ kind: "ok", text: "Election reset." });
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/admin-login");
  };

  const status = election?.status;
  const counts = election?.counts;
  const issued = adminStatus?.issued ?? 0;
  const turnout = counts && counts.eligible > 0 ? Math.round((counts.ballots / counts.eligible) * 100) : 0;
  const phaseIndex = PHASES.findIndex((p) => p.id === status);
  const canFreeze = counts && election && counts.registered >= election.minRingSize;
  const canReissue = status === "DRAFT" || status === "REGISTRATION";
  const unredeemed = members.filter((m) => m.eligible && m.code === "ISSUED").map((m) => m.membershipNo);
  const cardText = isLight ? "#1e293b" : "white";

  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="badge badge-primary mb-3">
                Returning Officer • {admin?.email || "Authenticated"}{isSuperadmin ? " • superadmin" : ""}
              </div>
              <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem" }}>Election Control Center</h2>
              <p className="text-muted" style={{ maxWidth: "800px" }}>
                {election ? election.title : "Loading election..."} — issue voting codes, run the phases, and watch the tally.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              style={{
                padding: "0.75rem 1.5rem", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
                background: isLight ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171",
              }}
            >
              🚪 Logout
            </motion.button>
          </div>
        </motion.div>

        {message && (
          <div style={{
            marginBottom: "1.5rem", padding: "0.85rem 1rem", borderRadius: "10px",
            background: message.kind === "ok" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${message.kind === "ok" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: message.kind === "ok" ? "#4ade80" : "#fca5a5",
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <TiltCard delay={0}>
            <div className="text-muted text-sm mb-2">Eligible voters</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{counts ? counts.eligible : "-"}</div>
            <div className="text-muted text-sm">of {counts ? counts.onRoll : "-"} flats on the roll</div>
          </TiltCard>
          <TiltCard delay={0.1}>
            <div className="text-muted text-sm mb-2">Codes issued / keys registered</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{issued} / {counts ? counts.registered : "-"}</div>
            <div className="text-muted text-sm">one code per eligible member</div>
          </TiltCard>
          <TiltCard delay={0.2}>
            <div className="text-muted text-sm mb-2">Ballots cast</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{counts ? counts.ballots : "-"}</div>
            <div className="text-muted text-sm">anonymous, ring-signed</div>
          </TiltCard>
          <TiltCard delay={0.3}>
            <div className="text-muted text-sm mb-2">Turnout</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#4ade80" }}>{turnout}%</div>
            <div className="text-muted text-sm">ballots / eligible voters</div>
          </TiltCard>
        </div>

        <div style={{ display: "grid", gap: "2rem" }}>
          {/* Election control */}
          <GlassCard>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Election phase</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              {PHASES.map((p, i) => (
                <span key={p.id} style={{
                  padding: "0.4rem 0.9rem", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 600,
                  background: i === phaseIndex ? "rgba(99,102,241,0.25)" : "rgba(148,163,184,0.1)",
                  color: i === phaseIndex ? "#a5b4fc" : i < phaseIndex ? "#4ade80" : "#94a3b8",
                  border: `1px solid ${i === phaseIndex ? "rgba(99,102,241,0.5)" : "rgba(148,163,184,0.2)"}`,
                }}>
                  {i < phaseIndex ? "✓ " : ""}{p.label}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {(status === "DRAFT" || status === "REGISTRATION") && (
                <button className="btn btn-outline" onClick={() => issueCodes()} disabled={!!busy}>
                  {busy === "issue" ? "Issuing..." : "Issue voting codes"}
                </button>
              )}
              {(status === "DRAFT" || status === "REGISTRATION") && unredeemed.length > 0 && (
                <button
                  className="btn btn-outline"
                  onClick={() => reissueCodes(unredeemed, `${unredeemed.length} member(s)`)}
                  disabled={!!busy}
                >
                  Reissue {unredeemed.length} unredeemed code{unredeemed.length === 1 ? "" : "s"}
                </button>
              )}
              {status === "DRAFT" && (
                <button className="btn btn-primary" onClick={() => changePhase("REGISTRATION")} disabled={!!busy || issued === 0}>
                  Open key registration
                </button>
              )}
              {status === "REGISTRATION" && (
                <button
                  className="btn btn-primary"
                  onClick={() => changePhase("VOTING")}
                  disabled={!!busy || !canFreeze}
                  title={canFreeze ? undefined : `Needs at least ${election?.minRingSize} registered keys (have ${counts?.registered ?? 0})`}
                >
                  Freeze ring &amp; open voting
                </button>
              )}
              {status === "REGISTRATION" && !canFreeze && (
                <span className="text-sm" style={{ alignSelf: "center", color: "#fbbf24" }}>
                  Waiting for voters to register keys: {counts?.registered ?? 0} of {election?.minRingSize} needed
                </span>
              )}
              {status === "VOTING" && (
                <button className="btn btn-primary" onClick={() => changePhase("CLOSED")} disabled={!!busy}>
                  Close voting
                </button>
              )}
              {isSuperadmin && (
                <button className="btn btn-outline" onClick={resetElection} disabled={!!busy} style={{ color: "#f87171" }}>
                  Reset election
                </button>
              )}
            </div>
            <p className="text-muted text-sm" style={{ marginTop: "1rem" }}>
              {status === "DRAFT" && "Issue a personal voting code to every eligible member, then open key registration."}
              {status === "REGISTRATION" && `Voters register their keys with their codes. Voting can open once at least ${election?.minRingSize} keys are registered; opening it freezes the ring, so no more keys can join.`}
              {status === "VOTING" && `Ring frozen (${counts?.registered} voters, fingerprint ${election?.ringHash?.slice(0, 12)}...). Close voting when the poll ends.`}
              {status === "CLOSED" && "Voting is closed. Results below are final."}
            </p>
          </GlassCard>

          {/* Distribution sheet (simulated email) */}
          {sheet && (
            <GlassCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Voting code distribution sheet</h3>
                  <p className="text-muted text-sm">
                    Email delivery is simulated: hand each member their code. Codes are shown once and only their hashes are stored, so this sheet cannot be regenerated.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-primary" onClick={() => downloadCsv(
                    sheet.map((s) => ({ membership_no: s.membershipNo, name: s.fullName, flat: s.unitLabel, aadhaar: s.aadhaarMasked, phone: s.phoneMasked, voting_code: s.code })),
                    "voting-code-sheet.csv"
                  )}>Download CSV</button>
                  <button className="btn btn-outline" onClick={hideSheet}>Hide</button>
                </div>
              </div>
              <div style={{ overflowX: "auto", maxHeight: "320px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: cardText }}>
                  <thead>
                    <tr style={{ textAlign: "left", ...muted }}>
                      <th style={th}>Member</th><th style={th}>Name</th><th style={th}>Flat</th><th style={th}>Aadhaar</th><th style={th}>Phone</th><th style={th}>Voting code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.map((s) => (
                      <tr key={s.membershipNo} style={{ borderTop: "1px solid rgba(148,163,184,0.15)" }}>
                        <td style={td}>{s.membershipNo}</td>
                        <td style={td}>{s.fullName}</td>
                        <td style={td}>{s.unitLabel}</td>
                        <td style={{ ...td, fontFamily: "monospace" }}>{s.aadhaarMasked}</td>
                        <td style={{ ...td, fontFamily: "monospace" }}>{s.phoneMasked}</td>
                        <td style={{ ...td, fontFamily: "monospace", color: "#4ade80" }}>{s.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* Results */}
          <GlassCard>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Results by candidate</h3>
              <p className="text-muted text-sm">
                Ballots are decrypted on the server, in aggregate, to tally them. No individual choice is ever shown.
              </p>
            </div>
            {!results && <div className="text-muted text-sm">Loading results...</div>}
            {results && election && (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {election.candidates.map((c) => {
                  const count = results.byChoice?.[c.id] || 0;
                  const pct = results.total > 0 ? Math.round((count / results.total) * 100) : 0;
                  return (
                    <div key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                        <span>{c.name} <span className="text-muted">(Flat {c.unitLabel})</span></span>
                        <span style={{ fontWeight: 600 }}>{count} votes · {pct}%</span>
                      </div>
                      <div style={{ height: "8px", borderRadius: "99px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: c.color, borderRadius: "99px", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
                {results.undecryptable > 0 && (
                  <div className="text-muted text-sm">{results.undecryptable} ballot(s) could not be decrypted (encrypted under a rotated election key).</div>
                )}
              </div>
            )}
          </GlassCard>

          {/* Ballot feed */}
          <GlassCard>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem" }}>Latest ballots</h3>
            <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
              Ballot times are rounded to 15 minutes so they cannot be matched to key registrations. The list refreshes every 10 seconds.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", color: cardText }}>
                <thead>
                  <tr style={{ textAlign: "left", ...muted }}>
                    <th style={th}>Time (rounded)</th><th style={th}>Ballot ID</th><th style={th}>Key image (link tag)</th><th style={th}>Ring</th>
                  </tr>
                </thead>
                <tbody>
                  {ballots.slice(0, 10).map((b) => (
                    <tr key={b.ballotId} style={{ borderTop: "1px solid rgba(148,163,184,0.15)" }}>
                      <td style={td}>{new Date(b.castAt).toLocaleString()}</td>
                      <td style={{ ...td, fontFamily: "monospace" }}>{b.ballotId.slice(0, 18)}...</td>
                      <td style={{ ...td, fontFamily: "monospace", color: "#64748b" }}>{b.keyImage.slice(0, 16)}...</td>
                      <td style={td}>1 of {b.ringSize}</td>
                    </tr>
                  ))}
                  {ballots.length === 0 && (
                    <tr><td colSpan={4} style={{ ...td, textAlign: "center", color: "#64748b" }}>Waiting for votes...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Roll */}
          <GlassCard>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.25rem" }}>Electoral roll</h3>
            <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
              One vote per flat; the registered owner votes. Synthetic data. Members with dues pending or a disputed title are not eligible.
            </p>
            <div style={{ overflowX: "auto", maxHeight: "420px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: cardText }}>
                <thead>
                  <tr style={{ textAlign: "left", ...muted }}>
                    <th style={th}>Member</th><th style={th}>Flat</th><th style={th}>Name</th><th style={th}>Occupancy</th><th style={th}>Eligibility</th><th style={th}>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.membershipNo} style={{ borderTop: "1px solid rgba(148,163,184,0.15)" }}>
                      <td style={td}>{m.membershipNo}</td>
                      <td style={td}>{m.unitLabel}</td>
                      <td style={td}>{m.fullName}{m.jointOwnerName ? ` & ${m.jointOwnerName}` : ""}</td>
                      <td style={td}>{m.occupancy.replace("_", " ").toLowerCase()}</td>
                      <td style={{ ...td, color: m.eligible ? "#4ade80" : "#fbbf24" }}>{m.eligible ? "Eligible" : m.ineligibleReason.replace("_", " ").toLowerCase()}</td>
                      <td style={{ ...td, color: m.code === "REDEEMED" ? "#4ade80" : m.code === "ISSUED" ? "#a5b4fc" : "#64748b" }}>
                        {m.code === "NONE" ? "-" : m.code.toLowerCase()}
                        {canReissue && m.eligible && m.code === "ISSUED" && (
                          <button
                            className="btn btn-outline"
                            style={{ marginLeft: "0.75rem", padding: "0.15rem 0.6rem", fontSize: "0.75rem" }}
                            onClick={() => reissueCodes([m.membershipNo], m.membershipNo)}
                            disabled={!!busy}
                          >
                            Reissue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </ScrollLayout>
  );
};

export default AdminDashboard;
