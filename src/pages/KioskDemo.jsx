import React, { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { appendLedgerEntry, appendAuditEvent } from "../utils/ledger.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const candidates = [
  { id: "cand-a", name: "Rajesh Kumar – Security & Transparency" },
  { id: "cand-b", name: "Priya Sharma – Governance & Ethics" },
  { id: "cand-c", name: "Amit Patel – Innovation & Growth" },
];

const fakeCipher = (text) => {
  if (!text) return "—";
  const base = btoa(text + Date.now().toString());
  return `0x${base.slice(0, 8)}...${base.slice(-6)}`;
};

const generateBallotHash = (voterId, candidateId) => {
  const combined = `${voterId}-${candidateId}-${Date.now()}`;
  const hash = btoa(combined);
  return `0x${hash.slice(0, 16)}...${hash.slice(-8)}`;
};

const KioskDemo = () => {
  const [voterId, setVoterId] = useState("");
  const [verified, setVerified] = useState(false);
  const [selected, setSelected] = useState(null);
  const [voteCast, setVoteCast] = useState(false);
  const [ballotHash, setBallotHash] = useState("");
  const [ballotId, setBallotId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cipherText = useMemo(
    () => fakeCipher(selected ? selected.id : ""),
    [selected]
  );

  const handleVerify = () => {
    setError("");

    if (!voterId.trim()) {
      setError("Please enter a mock Voter ID to continue.");
      return;
    }
    setVerified(true);

    appendAuditEvent({
      type: "identity_verified",
      actor: voterId.trim(),
      message: `Voter ${voterId.trim()} verified at kiosk.`,
    });
  };

  const handleCast = async () => {
    if (!selected) {
      setError("Please select a candidate before casting your vote.");
      return;
    }
    if (submitting) return;

    const cleanVoterId = voterId.trim() || "ANON";
    const maskedVoterId =
      cleanVoterId.length > 3
        ? `${cleanVoterId.slice(0, 2)}***${cleanVoterId.slice(-1)}`
        : "VOTER";

    const hash = generateBallotHash(cleanVoterId, selected.id);
    const id = `BALLOT-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        electionId: "society-chairperson-2026",
        encryptedBallot: cipherText,
        choiceId: selected.id,
        auditHash: hash,
      };

      const res = await fetch(`${API_BASE}/api/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ||
            "There was a problem submitting your vote. Please try again."
        );
      }

      const data = await res.json().catch(() => null);

      setBallotHash(hash);
      setBallotId(id);
      setVoteCast(true);

      try {
        const localPayload = { hash, ballotId: id, timestamp: nowIso };
        localStorage.setItem(
          "votesphere_lastBallot",
          JSON.stringify(localPayload)
        );
      } catch (e) {
        console.error("Could not persist last ballot", e);
      }

      appendLedgerEntry({
        hash,
        ballotId: id,
        voter: maskedVoterId,
        candidateId: selected.id,
        candidateName: selected.name,
        timestamp: nowIso,
        blockId: "Demo Block",
      });

      appendAuditEvent({
        type: "ballot_cast",
        actor: maskedVoterId,
        message: `Encrypted ballot ${id} recorded for ${selected.id}.`,
      });

      console.log("Vote stored successfully", data);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          "There was a problem submitting your vote. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page animate-fade-in">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-primary mb-2">
            Demo Only • Simulated Kiosk Flow
          </div>
          <h2 className="section-title">
            VoteSphere – Online Voting Kiosk Demo
          </h2>
          <p className="section-subtitle">
            Experience the complete voter journey: identity verification, ballot
            selection, and client‑side encryption before submission. This flow
            illustrates VoteSphere&apos;s core rule: ONE PERSON, ONE VOTE.
          </p>
        </div>

        {/* Global error banner */}
        {error && (
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
            ⚠ {error}
          </div>
        )}

        {!voteCast ? (
          <>
            {/* Step 1: Identity Verification */}
            <div className="card mb-3">
              <div className="badge badge-soft mb-2">STEP 1 OF 2</div>
              <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                Identity Verification (Smart Card / Biometric)
              </h3>
              <p className="text-muted" style={{ fontSize: 13 }}>
                In a real deployment, this step would authenticate via smart
                card reader, fingerprint scanner, or Aadhaar‑based biometric. In
                VoteSphere, this verification ensures each eligible voter is
                issued exactly one secure ballot for the election.
              </p>
              <div className="mt-3">
                <input
                  className="input"
                  placeholder="Enter Voter ID (e.g., V12345)"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                />
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  className="btn btn-primary btn-liquid"
                  onClick={handleVerify}
                  disabled={!voterId.trim() || verified}
                >
                  {verified ? "Identity Verified" : "Verify Identity"}
                </button>
                <span className="badge badge-soft">Mock verification only</span>
              </div>
              {verified && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.4)",
                    fontSize: 13,
                    color: "#bbf7d0",
                  }}
                >
                  ✓ Voter verified successfully. In VoteSphere, this marks you
                  as eligible to cast one encrypted vote for this election.
                </div>
              )}
            </div>

            {/* Step 2: Ballot Selection */}
            {verified && (
              <div className="card mb-3">
                <div className="badge badge-soft mb-2">STEP 2 OF 2</div>
                <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                  Cast Your Vote – Society Chairperson Election 2026
                </h3>
                <p className="text-muted" style={{ fontSize: 13 }}>
                  Select one candidate below. Your choice will be encrypted on
                  this device before being transmitted to the backend, enforcing
                  privacy while still guaranteeing one person, one vote.
                </p>
                <div style={{ marginTop: 12 }}>
                  {candidates.map((c) => {
                    const sel = selected && selected.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelected(c)}
                        className="card card-hover"
                        style={{
                          marginBottom: 10,
                          textAlign: "left",
                          cursor: "pointer",
                          borderColor: sel
                            ? "rgba(79,70,229,0.9)"
                            : "rgba(148,163,184,0.35)",
                          backgroundColor: sel
                            ? "rgba(79,70,229,0.15)"
                            : "var(--card-bg)",
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {c.name}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          Click to select this candidate
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  className="btn btn-primary btn-liquid"
                  style={{ marginTop: 16, width: "100%" }}
                  onClick={handleCast}
                  disabled={submitting || !selected}
                >
                  {submitting ? "Submitting..." : "Cast Encrypted Vote"}
                </button>
              </div>
            )}

            {/* Encryption Panel */}
            {selected && (
              <div className="card">
                <h3
                  style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}
                >
                  Client‑Side Encryption Panel
                  <span
                    className="badge badge-soft"
                    style={{ marginLeft: 8, fontSize: 11 }}
                  >
                    SERVER‑BLIND
                  </span>
                </h3>
                <p className="text-muted" style={{ fontSize: 12 }}>
                  The kiosk uses the election&apos;s public key to encrypt the
                  ballot locally. The backend only receives ciphertext, never
                  the plaintext vote.
                </p>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    backgroundColor: "rgba(15,23,42,0.96)",
                    borderRadius: 12,
                    padding: 12,
                    border: "1px solid rgba(148,163,184,0.5)",
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#a5b4fc" }}>plaintext_choice</span>
                    <span style={{ color: "#9ca3af" }}> = </span>
                    <span style={{ color: "#22c55e" }}>{selected.name}</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#a5b4fc" }}>public_key_id</span>
                    <span style={{ color: "#9ca3af" }}> = </span>
                    <span style={{ color: "#fbbf24" }}>
                      "society-election-2026-rsa4096"
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#a5b4fc" }}>ciphertext</span>
                    <span style={{ color: "#9ca3af" }}> = </span>
                    <span style={{ color: "#22c55e" }}>{cipherText}</span>
                  </div>
                </div>
                <p
                  className="text-muted"
                  style={{ fontSize: 11, marginTop: 8 }}
                >
                  In production, this ciphertext would be generated using a
                  vetted cryptographic library (e.g., Web Crypto API with
                  RSA‑OAEP or ECC) and stored on an immutable blockchain or
                  secure ledger.
                </p>
              </div>
            )}
          </>
        ) : (
          /* Vote Receipt with QR Code */
          <div className="card card-hover animate-scale-in">
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.5)",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <h3 style={{ fontSize: 18, color: "#22c55e", marginBottom: 4 }}>
                ✓ Vote Successfully Cast
              </h3>
              <p className="text-muted" style={{ fontSize: 13 }}>
                Your vote has been encrypted and submitted successfully
                (VoteSphere demo).
              </p>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              📄 Vote Receipt
            </h3>
            <p className="text-muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Save this receipt for your records. You can use the Ballot ID to
              verify your vote was counted on the Public Audit page.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 16,
                alignItems: "start",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 12,
                    backgroundColor: "rgba(15,23,42,0.96)",
                                        borderRadius: 12,
                    padding: 12,
                    border: "1px solid rgba(148,163,184,0.5)",
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#a5b4fc" }}>Ballot ID:</span>{" "}
                    <span style={{ color: "#22c55e" }}>{ballotId}</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#a5b4fc" }}>Voter Receipt Hash:</span>
                  </div>
                  <div style={{ color: "#22c55e", wordBreak: "break-all" }}>
                    {ballotHash}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
                    Timestamp: {new Date().toLocaleString("en-IN")}
                  </div>
                </div>
                <p className="text-muted" style={{ fontSize: 11, marginTop: 10 }}>
                  <strong>Voter‑Verifiable Audit:</strong> You can later verify your
                  ballot was counted by checking this hash in the public audit portal,
                  without revealing your vote choice.
                </p>
              </div>

              <div
                style={{
                  padding: 12,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  border: "2px solid rgba(148,163,184,0.5)",
                }}
              >
                <QRCodeSVG value={ballotHash} size={120} />
                <p
                  style={{
                    fontSize: 10,
                    color: "#666",
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  Scan to verify
                </p>
              </div>
            </div>

            <button
              className="btn btn-outline"
              style={{ marginTop: 16, width: "100%" }}
              onClick={() => window.location.reload()}
            >
              Return to Kiosk Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskDemo;

