import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { importSigningKey, verifySignature } from "../utils/crypto";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { API_BASE } from "../config";

// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

import { motion } from "framer-motion";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import TiltCard from "../components/ui/TiltCard";

const AdminDashboard = () => {
  const { admin, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === "light";

  const [total] = useState(150);
  const [cast, setCast] = useState(0);
  const [turnout, setTurnout] = useState(0);
  const [votes, setVotes] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState({});

  const handleLogout = async () => {
    await logout();
    navigate("/admin-login");
  };

  useEffect(() => {
    async function fetchVotes() {
      try {
        const res = await fetch(`${API_BASE}/api/votes`);
        if (!res.ok) throw new Error("Failed to fetch votes");
        const data = await res.json();

        if (Array.isArray(data)) {
          setVotes(data);
          setCast(data.length);
          verifyAllVotes(data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchVotes();
  }, []);

  const verifyAllVotes = (voteList) => {
    // In a full implementation, we would verify ring signatures client-side here.
    // For this demo, we rely on the server's verification and display the Ring Size.
    const statusMap = {};

    for (const vote of voteList) {
      if (vote.signature && vote.ringSize) {
        statusMap[vote.ballotId] = `Ring Signed (1 of ${vote.ringSize})`;
      } else {
        statusMap[vote.ballotId] = "Unsigned / Legacy";
      }
    }
    setVerificationStatus(statusMap);
  };

  useEffect(() => {
    const target =
      total > 0 ? Math.round((cast / total) * 100) : 0;
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      if (current >= target) {
        current = target;
        clearInterval(id);
      }
      setTurnout(current);
    }, 20);
    return () => clearInterval(id);
  }, [cast, total]);

  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="badge badge-primary mb-3">
                Admin View • {admin?.email || "Authenticated"}
              </div>
              <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem" }}>
                Election Control Center
              </h2>
              <p className="text-muted" style={{ maxWidth: "800px" }}>
                Real‑time monitoring of encrypted ballots, turnout metrics, and the tamper‑proof ledger.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                background: isLight ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              🚪 Logout
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <TiltCard delay={0}>
            <div className="text-muted text-sm mb-2">Total Registered Voters</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{total}</div>
            <div className="text-green-400 text-sm">100% Eligible</div>
          </TiltCard>
          <TiltCard delay={0.1}>
            <div className="text-muted text-sm mb-2">Encrypted Votes Cast</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{cast}</div>
            <div className="text-blue-400 text-sm">Live Updates</div>
          </TiltCard>
          <TiltCard delay={0.2}>
            <div className="text-muted text-sm mb-2">Voter Turnout</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#4ade80" }}>{turnout}%</div>
            <div className="text-muted text-sm">Real-time tracking</div>
          </TiltCard>
        </div>

        <div style={{ display: "grid", gap: "2rem" }}>
          {/* Live Feed */}
          <GlassCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Live Ballot Feed</h3>
                <p className="text-muted text-sm">Real-time cryptographic verification of incoming votes.</p>
              </div>
              <div className="badge badge-soft" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>
                ● Live Syncing
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#94a3b8" }}>
                    <th style={{ padding: "0 1rem" }}>Time</th>
                    <th style={{ padding: "0 1rem" }}>Ballot ID (Hash)</th>
                    <th style={{ padding: "0 1rem" }}>Key Image (Link Tag)</th>
                    <th style={{ padding: "0 1rem" }}>Signature Status</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.slice().reverse().slice(0, 10).map((vote) => {
                    const status = verificationStatus[vote.ballotId];
                    let badgeColor = "#94a3b8";
                    let badgeBg = "rgba(148,163,184,0.1)";
                    let label = "Checking...";

                    if (status === "valid") {
                      badgeColor = "#4ade80";
                      badgeBg = "rgba(74, 222, 128, 0.1)";
                      label = "✅ Verified Valid";
                    } else if (status === "invalid") {
                      badgeColor = "#f87171";
                      badgeBg = "rgba(248, 113, 113, 0.1)";
                      label = "❌ Invalid Signature";
                    } else if (status === "unsigned") {
                      badgeColor = "#fbbf24";
                      badgeBg = "rgba(251, 191, 36, 0.1)";
                      label = "⚠ Unsigned";
                    }

                    return (
                      <tr key={vote.ballotId} style={{ background: "rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "1rem", borderRadius: "8px 0 0 8px", color: "#cbd5e1" }}>
                          {vote.castAt ? new Date(vote.castAt).toLocaleTimeString() : "N/A"}
                        </td>
                        <td style={{ padding: "1rem", fontFamily: "monospace", color: "#94a3b8" }}>
                          {vote.ballotId.substring(0, 12)}...
                        </td>
                        <td style={{ padding: "1rem", fontFamily: "monospace", color: "#64748b", fontSize: "0.85rem" }}>
                          {vote.keyImage ? vote.keyImage.substring(0, 16) + "..." : "---"}
                        </td>
                        <td style={{ padding: "1rem", borderRadius: "0 8px 8px 0" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "99px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: badgeColor,
                            backgroundColor: badgeBg,
                            border: `1px solid ${badgeColor}30`
                          }}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {votes.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                        Waiting for votes...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Ledger Timeline */}
          <GlassCard>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Tamper-Proof Ledger Timeline</h3>
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div style={{ position: "absolute", left: "0", top: "0", bottom: "0", width: "2px", background: "rgba(255,255,255,0.1)" }}></div>

              {[
                { id: 3, votes: 30, hash: "0xa7d9...e5c8", status: "Finalizing" },
                { id: 2, votes: 32, hash: "0x81bc...d2f4", status: "Anchored" },
                { id: 1, votes: 25, hash: "0x4f3a...9c1b", status: "Anchored" }
              ].map((block, i) => (
                <div key={block.id} style={{ marginBottom: "1.5rem", position: "relative" }}>
                  <div style={{ position: "absolute", left: "-1.9rem", top: "0.25rem", width: "1rem", height: "1rem", borderRadius: "50%", background: i === 0 ? "var(--primary)" : "#64748b", border: "2px solid rgba(0,0,0,0.5)" }}></div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 600, color: "white" }}>Block #{block.id}</span>
                      <span style={{ fontSize: "0.8rem", color: i === 0 ? "var(--primary)" : "#94a3b8" }}>{block.status}</span>
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                      {block.votes} Encrypted Votes • Merkle Root: <span style={{ fontFamily: "monospace", color: "#cbd5e1" }}>{block.hash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </ScrollLayout>
  );
};

export default AdminDashboard;
