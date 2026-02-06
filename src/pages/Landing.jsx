import React from "react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="page animate-fade-in">
      <div className="container">
        <div className="section">
          <div>
            <h1
              style={{
                fontSize: "2.2rem",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              VoteSphere – Secure Online Voting System
            </h1>
            <p className="text-muted" style={{ maxWidth: 580, fontSize: 15 }}>
              VoteSphere is an innovative online voting system designed to
              enable secure, efficient, and transparent digital elections.
              It simplifies the voting process while maintaining privacy and
              integrity, and bridges the gap between traditional and digital
              voting by offering easy access for every eligible voter.
              Core principle: ONE PERSON, ONE VOTE.
            </p>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {/* renamed from "Try Kiosk Demo" */}
              <button
                className="btn btn-primary btn-liquid"
                onClick={() => navigate("/kiosk")}
              >
                Open Voting Portal
              </button>

              {/* changed from admin dashboard to public audit */}
              <button
                className="btn btn-outline"
                onClick={() => navigate("/audit")}
              >
                Open Public Audit
              </button>
            </div>

            <p className="text-muted" style={{ marginTop: 10, fontSize: 12 }}>
              Public interface for secure organizational voting • Detailed
              analytics and admin controls are restricted to authorized
              administrators.
            </p>
          </div>
        </div>

        <div className="section" style={{ marginTop: 40 }}>
          <h2 className="section-title">Why VoteSphere?</h2>
          <p className="section-subtitle" style={{ marginBottom: 16 }}>
            Many existing voting systems are centralized, opaque, and exclude
            people who lack smartphones or digital literacy. VoteSphere brings
            secure, transparent, and inclusive digital elections to organizations.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            <div className="card card-hover">
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                🔐 End‑to‑End Encryption
              </h3>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Votes are encrypted at the kiosk or browser using public‑key
                cryptography before transmission. Servers never see plaintext
                ballots.
              </p>
            </div>

            <div className="card card-hover">
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                🔒 Server‑Blind Voting
              </h3>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Backend infrastructure only handles ciphertext and metadata.
                Even if compromised, administrators cannot read or selectively
                alter individual votes.
              </p>
            </div>

            <div className="card card-hover">
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                📱 Inclusive Access
              </h3>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Secure kiosks, assisted terminals, and web access let every
                eligible voter participate, including users without personal
                smartphones or laptops.
              </p>
            </div>

            <div className="card card-hover">
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                🛡️ Tamper‑Proof Ledger
              </h3>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Encrypted votes are anchored to an immutable ledger or
                blockchain for complete transparency, public audit, and
                detection of any tampering.
              </p>
            </div>
          </div>
        </div>

        <div className="section" style={{ marginTop: 32 }}>
          <div className="card">
            <h2 className="section-title">Target Use‑Cases</h2>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
              VoteSphere can be used wherever fair digital elections are needed:
            </p>
            <ul style={{ marginTop: 10, fontSize: 13, paddingLeft: 20 }}>
              <li>
                Small and Medium Enterprises – internal board or committee
                elections
              </li>
              <li>
                Universities and Colleges – student union and council voting
              </li>
              <li>
                NGOs and Professional Bodies – member decision‑making
              </li>
              <li>
                Housing Societies – resident voting and opinion polls
              </li>
            </ul>
            <p className="text-muted" style={{ fontSize: 13, marginTop: 10 }}>
              <strong>Objective:</strong> bridge the gap between traditional
              paper voting and modern digital elections with high security and
              strong voter trust.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
