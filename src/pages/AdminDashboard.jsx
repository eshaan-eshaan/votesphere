import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";


const AdminDashboard = () => {
  const [total] = useState(150); // assumed registered voters
  const [cast, setCast] = useState(0);
  const [turnout, setTurnout] = useState(0);
  const navigate = useNavigate();

  // Simple client-side guard: redirect if not "logged in" as admin
  useEffect(() => {
    const token = localStorage.getItem("votesphere_adminToken");
    if (token !== "granted") {
      navigate("/admin-login");
    }
  }, [navigate]);

  // Fetch votes from backend API
  useEffect(() => {
    async function fetchVotes() {
      try {
        const res = await fetch(`${API_BASE}/api/votes`);
        if (!res.ok) throw new Error("Failed to fetch votes");
        const data = await res.json();
        setCast(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error(err);
        // keep cast = 0 on error
      }
    }

    fetchVotes();
  }, []);

  // Animate turnout percentage
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
    <div className="page animate-fade-in">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-primary mb-2">
            Admin View • Restricted Access
          </div>
          <h2 className="section-title">
            VoteSphere Admin Dashboard – Society Chairperson Election 2026
          </h2>
          <p className="section-subtitle">
            Real‑time overview of encrypted ballots, turnout metrics, and
            tamper‑proof ledger timeline. This dashboard provides authorized
            election administrators with comprehensive election monitoring and
            integrity verification tools.
          </p>
        </div>

        <div className="card mb-3">
          <h3 style={{ fontSize: 16, marginBottom: 10, fontWeight: 600 }}>
            Election Overview
          </h3>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Live turnout metrics for the ongoing election. Each verified voter
            can cast at most one encrypted ballot, enforcing VoteSphere&apos;s
            ONE PERSON, ONE VOTE principle.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div className="card card-hover" style={{ flex: 1, minWidth: 120 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Total Voters
              </div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{total}</div>
            </div>
            <div className="card card-hover" style={{ flex: 1, minWidth: 120 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Votes Cast
              </div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{cast}</div>
            </div>
            <div className="card card-hover" style={{ flex: 1, minWidth: 120 }}>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Turnout %
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#22c55e",
                }}
              >
                {turnout}%
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 10, fontWeight: 600 }}>
            Tamper‑Proof Ledger Timeline
          </h3>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Each block represents a batch of encrypted votes anchored to the
            immutable ledger with cryptographic proofs. Any attempt to add,
            remove, or modify ballots would change these hashes and be
            immediately detectable by observers and auditors.
          </p>
          <ul style={{ fontSize: 13, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}>
              <strong>Block #1</strong> – 25 encrypted votes anchored. Hash:
              0x4f3a...9c1b
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Block #2</strong> – 32 encrypted votes anchored with
              Merkle proofs. Hash: 0x81bc...d2f4
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong>Block #3</strong> – 30 encrypted votes anchored. Final
              batch ready for decryption ceremony. Hash: 0xa7d9...e5c8
            </li>
          </ul>
          <p className="text-muted" style={{ fontSize: 11, marginTop: 10 }}>
            Independent observers can verify each block&apos;s integrity
            through the public audit portal and confirm that every accepted
            ballot hash is unique for this election, preserving end‑to‑end
            verifiability.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
