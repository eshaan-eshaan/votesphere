import React from "react";

const Architecture = () => {
  return (
    <div className="page animate-fade-in">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-primary mb-2">
            VoteSphere System Design • Advanced Concepts
          </div>
          <h2 className="section-title">
            VoteSphere System Architecture & Security Model
          </h2>
          <p className="section-subtitle">
            Technical deep‑dive into how VoteSphere delivers secure, efficient,
            and transparent digital elections while enforcing ONE PERSON, ONE
            VOTE through strong identity, cryptography, and governance.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="card mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
            🏗️ System Architecture Flow
          </h3>
          <div
            style={{
              padding: 16,
              backgroundColor: "rgba(15,23,42,0.96)",
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.5)",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: "#22c55e" }}>┌─ Voter</span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#a5b4fc" }}>
                ▼ 1. Identity Verification (Smart Card / Biometric / Aadhaar)
                – enforces ONE PERSON, ONE VOTE
              </span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#22c55e" }}>
                ▼ 2. Secure Kiosk UI (Offline‑First)
              </span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#a5b4fc" }}>
                ▼ 3. Client‑Side Encryption (RSA‑4096 / ECC)
              </span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#22c55e" }}>
                ▼ 4. Encrypted Vote + Receipt Hash
              </span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: "#6366f1" }}>
                ├─ Backend API (Server‑Blind)
              </span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: "#22c55e" }}>
                ├─ Tamper‑Proof Ledger / Blockchain
              </span>
            </div>
            <div style={{ marginBottom: 10, paddingLeft: 20 }}>
              <span style={{ color: "#9ca3af" }}>│</span>
            </div>
            <div>
              <span style={{ color: "#a5b4fc" }}>
                └─ Threshold Decryption (2‑of‑3 Key Holders)
              </span>
            </div>
          </div>
        </div>

        {/* Threshold Cryptography */}
        <div className="card mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            🔐 Threshold Cryptography (Advanced Security)
          </h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 10 }}>
            The private decryption key is split using Shamir&apos;s Secret
            Sharing across multiple trusted authorities, so no single party can
            decrypt all votes alone.
          </p>
          <ul style={{ fontSize: 13, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Key Split:</strong> Election private key divided into 3
              shares (e.g., Election Commission, University Registrar,
              Independent Observer)
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Threshold Requirement:</strong> Any 2 of 3 key holders
              must collaborate to decrypt results
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Single Point Failure Eliminated:</strong> No single
              authority can decrypt votes alone
            </li>
            <li>
              <strong>Ceremonial Decryption:</strong> Public ceremony where key
              holders jointly decrypt results
            </li>
          </ul>
        </div>

        {/* Role-Based Governance */}
        <div className="card mb-3">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            👥 Role‑Separated Governance Model
          </h3>
          <p className="text-muted" style={{ fontSize: 13, marginBottom: 10 }}>
            Different roles with separated permissions ensure no single entity
            can manipulate the election, aligning with VoteSphere&apos;s
            one‑person‑one‑vote guarantee.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                🗳️ Election Creator
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Creates election, sets candidates, configures rules. Cannot
                access votes or keys.
              </div>
            </div>
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                🔑 Authentication Authority
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Verifies voter eligibility and prevents duplicate ballots.
                Cannot see votes or decrypt results.
              </div>
            </div>
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                📜 Ledger Manager
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Anchors encrypted votes to blockchain. Cannot decrypt or modify
                votes.
              </div>
            </div>
            <div className="card" style={{ padding: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                🧮 Counting Authority (Threshold)
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                Holds one or more key shares and participates in threshold
                decryption during result tallying.
              </div>
            </div>
          </div>
        </div>

        {/* Implementation / README-style summary */}
        <div className="section" style={{ marginTop: 32 }}>
          <div className="card">
            <h2 className="section-title">
              Implementation & Runbook (For Evaluators)
            </h2>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
              This section summarizes how VoteSphere is implemented and how to
              run the demo locally during evaluation.
            </p>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>
              What VoteSphere Does
            </h3>
            <ul style={{ marginTop: 6, fontSize: 13, paddingLeft: 20 }}>
              <li>
                Provides a secure <strong>Voting Portal</strong> where verified
                voters cast encrypted ballots (client-side encryption, one
                person one vote).
              </li>
              <li>
                Exposes a <strong>Public Audit</strong> page where anyone can
                verify their ballot hash and inspect the tamper-proof ledger
                entries.
              </li>
              <li>
                Offers an <strong>Admin Dashboard</strong> (passcode protected)
                with turnout metrics and a conceptual ledger timeline for
                election monitoring.
              </li>
            </ul>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>
              Tech Stack
            </h3>
            <ul style={{ marginTop: 6, fontSize: 13, paddingLeft: 20 }}>
              <li>Frontend: React (Vite) with modern CSS glass UI theme.</li>
              <li>
                Routing: <code>react-router-dom</code> single-page application.
              </li>
              <li>
                Data layer: browser <code>localStorage</code> for demo ledger,
                last ballot receipt, and admin session flag.
              </li>
            </ul>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>
              How to Run Locally
            </h3>
            <ul style={{ marginTop: 6, fontSize: 13, paddingLeft: 20 }}>
              <li>
                <code>npm install</code> – install dependencies.
              </li>
              <li>
                <code>npm run dev</code> – start the dev server (default:
                http://localhost:5173).
              </li>
              <li>
                Open the browser and navigate to <code>/</code>,{" "}
                <code>/kiosk</code>, <code>/audit</code>,{" "}
                <code>/architecture</code>.
              </li>
            </ul>

            <h3 style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>
              Admin Access (Demo)
            </h3>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              To open the admin dashboard, navigate to <code>/admin-login</code>{" "}
              and use the access code <code>VSPHERE-ADMIN-2026</code>. Upon
              successful login, the app stores a short-lived flag in{" "}
              <code>localStorage</code> and redirects to <code>/admin</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Architecture;
