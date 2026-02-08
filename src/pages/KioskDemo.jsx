import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../components/ThemeContext";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import TiltCard from "../components/ui/TiltCard";
import { generateIdentity, signVote } from "../utils/ring-signature";
import { generateKeyPair, encryptVote } from "../utils/crypto";
import { QRCodeSVG } from "qrcode.react";
import { API_BASE } from "../config";

// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const candidates = [
  { id: "c1", name: "Alice Johnson", party: "Progressive Future", color: "#3b82f6" },
  { id: "c2", name: "Bob Smith", party: "Liberty Alliance", color: "#ef4444" },
  { id: "c3", name: "Carol Davis", party: "Green Vison", color: "#22c55e" },
  { id: "c4", name: "David Wilson", party: "Tech Forward", color: "#a855f7" }
];

const KioskDemo = () => {
  const [step, setStep] = useState(1);
  const [voterId, setVoterId] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [verified, setVerified] = useState(false);

  // Crypto State
  const [keyPair, setKeyPair] = useState(null);
  const [encryptedVote, setEncryptedVote] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Ring Signature State
  const [voterIdentity, setVoterIdentity] = useState(null);
  const [ring, setRing] = useState([]);
  const [ringSize, setRingSize] = useState(5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  // Initialize Admin Key for Encryption (Receiver)
  useEffect(() => {
    const initKeys = async () => {
      try {
        const encKeys = await generateKeyPair();
        setKeyPair(encKeys);
      } catch (err) {
        console.error("Key generation failed:", err);
        setError("Failed to initialize secure voting system.");
      }
    };
    initKeys();
  }, []);

  const handleVerify = () => {
    if (voterId.trim()) {
      // Simulate Voter Registry: Generate Identity + Decoys for Ring
      try {
        const identity = generateIdentity();
        setVoterIdentity(identity);

        // Generate decoys
        const decoys = [];
        for (let i = 0; i < ringSize - 1; i++) {
          decoys.push(generateIdentity().publicKey);
        }

        // Create Ring (Shuffle voter into decoys)
        const newRing = [...decoys, identity.publicKey].sort();
        setRing(newRing);

        setVerified(true);
      } catch (e) {
        console.error("Ring generation failed:", e);
        setError("Failed to generate anonymous identity. Browser compatibility issue?");
      }
    }
  };

  const handleSelect = (candidate) => {
    setSelectedCandidate(candidate);
    performEncryption(candidate);
  };

  const performEncryption = async (candidate) => {
    if (!keyPair) return;
    setIsEncrypting(true);

    try {
      const cipher = await encryptVote(candidate.name, keyPair.publicKey);
      // Simulate delay for effect
      setTimeout(() => {
        setEncryptedVote(cipher);
        setIsEncrypting(false);
      }, 800);
    } catch (err) {
      console.error("Encryption failed:", err);
      setError("Encryption failed. Please try again.");
      setIsEncrypting(false);
    }
  };

  const handleSubmit = async () => {
    if (!encryptedVote || !voterId || !voterIdentity) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Sign with Ring Signature
      // Message can be the encrypted vote
      const signature = signVote(encryptedVote, voterIdentity, ring);

      const payload = {
        ballotId: crypto.randomUUID(),
        electionId: "election-2025",
        choiceId: selectedCandidate.id,
        encryptedBallot: encryptedVote,
        signature: signature,
        ring: ring,
        previousHash: "GENESIS_HASH"
      };

      const response = await fetch(`${API_BASE}/api/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Vote submission failed");
      }

      // Success
      const finalizedHash = data.vote?.ballotId || data.transactionHash;

      setReceipt({
        id: finalizedHash,
        hash: finalizedHash,
        timestamp: new Date().toLocaleString(),
        candidate: selectedCandidate.name,
        ringSize: ring.length
      });

      // Update local storage for Audit page convenience
      localStorage.setItem("votesphere_lastBallot", JSON.stringify({
        vote: {
          transactionHash: finalizedHash,
          encryptedBallot: encryptedVote,
          castAt: new Date().toISOString()
        }
      }));

      setStep(4);
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "8rem", paddingBottom: "5rem", maxWidth: "800px" }}>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          style={{ marginBottom: "3rem" }}
        >
          <div className="badge badge-primary mb-3">
            Demo Only • Simulated Kiosk Flow
          </div>
          <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
            VoteSphere Voting Portal
          </h2>
          <p className="text-muted" style={{ fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.7" }}>
            Experience the complete voter journey: identity verification, ballot
            selection, and client‑side encryption before submission.
          </p>
        </motion.div>

        {/* Global error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: 20,
                padding: 15,
                borderRadius: 12,
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#fca5a5",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step < 3 ? (
            <motion.div
              key="voting-steps"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Identity Verification */}
              <GlassCard className="mb-4" style={{ padding: "2rem" }}>
                <div className="badge badge-soft mb-3">STEP 1 OF 2</div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", fontWeight: 600 }}>
                  Identity Verification (Smart Card / Biometric)
                </h3>
                <p className="text-muted mb-4">
                  In a real deployment, this step would authenticate via smart card reader or biometric scanner.
                </p>

                <div className="flex gap-4">
                  <input
                    className="input"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                    placeholder="Enter Voter ID (e.g., V12345)"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    disabled={verified}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleVerify}
                    disabled={!voterId.trim() || verified}
                  >
                    {verified ? "Verified ✓" : "Verify Identity"}
                  </button>
                </div>
                <div className="info-row">
                  <span className="label">Voter ID Hash:</span>
                  <span className="value font-mono">
                    {voterId ? btoa(voterId).substring(0, 12) + "..." : "---"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Anonymity Ring:</span>
                  <span className="value font-mono">
                    Active (Size: {ring.length})
                  </span>
                </div>
                {verified && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      marginTop: 15,
                      padding: "10px 15px",
                      borderRadius: 8,
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      color: "#86efac",
                    }}
                  >
                    ✓ Voter verified successfully. You are eligible to cast <strong>one</strong> encrypted ballot.
                  </motion.div>
                )}
              </GlassCard>

              {/* Step 2: Ballot Selection */}
              {verified && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard className="mb-4" style={{ padding: "2rem" }}>
                    <div className="badge badge-soft mb-3">STEP 2 OF 2</div>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 600 }}>
                      Cast Your Vote – Society Chairperson Election 2026
                    </h3>

                    <div style={{ display: "grid", gap: "1rem" }}>
                      {candidates.map((c) => {
                        const sel = selectedCandidate && selectedCandidate.id === c.id;
                        return (
                          <motion.button
                            key={c.id}
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(c)}
                            style={{
                              width: "100%",
                              padding: "1.5rem",
                              textAlign: "left",
                              borderRadius: "12px",
                              border: sel ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.1)",
                              background: sel ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.05)",
                              color: "white",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: sel ? "var(--primary)" : "white" }}>
                              {c.name}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <button
                      className="btn btn-primary btn-lg mt-4 w-full"
                      style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "2rem" }}
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedCandidate}
                    >
                      {isSubmitting ? "Encrypting & Submitting..." : "Cast Encrypted Vote"}
                    </button>
                  </GlassCard>
                </motion.div>
              )}

              {/* Encryption Panel */}
              {selectedCandidate && (
                <TiltCard>
                  <div style={{ padding: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                      🔐 Client‑Side Encryption Panel
                      <span className="badge badge-soft" style={{ fontSize: "0.7rem" }}>SERVER‑BLIND</span>
                    </h3>
                    <div style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "rgba(0,0,0,0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="mb-2">
                        <span style={{ color: "#a5b4fc" }}>choice</span> = <span style={{ color: "#4ade80" }}>{selectedCandidate.name}</span>
                      </div>
                      <div className="mb-2">
                        <span style={{ color: "#a5b4fc" }}>public_key</span> = <span style={{ color: "#fbbf24" }}>"society-election-2026"</span>
                      </div>
                      <div>
                        <span style={{ color: "#a5b4fc" }}>ciphertext</span> = <span style={{ color: "#4ade80", wordBreak: "break-all" }}>{encryptedVote || "Encrypting..."}</span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              )}
            </motion.div>
          ) : (
            /* Vote Receipt with QR Code */
            <motion.div
              key="receipt"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <TiltCard>
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                  <h3 className="text-gradient" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Vote Successfully Cast</h3>
                  <p className="text-muted mb-4">Your vote has been signed, encrypted, and anchored to the ledger.</p>
                </div>

                <div style={{ background: "white", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "black" }}>
                  <QRCodeSVG value={receipt?.vote?.ballotId || "void"} size={180} />
                  <p style={{ fontSize: "0.9rem", color: "#666" }}>Scan to Verify on Mobile</p>
                </div>

                <div className="mt-4 p-4 rounded bg-black/50 border border-white/10 font-mono text-sm break-all">
                  <div className="text-blue-300 mb-1">Ballot ID:</div>
                  <div className="text-green-400">{receipt?.id}</div>
                  <div className="text-blue-300 mt-2 mb-1">Ring Signature:</div>
                  <div className="text-gray-400">Verified (Ring Size: {receipt?.ringSize})</div>
                  <div className="text-blue-300 mt-2 mb-1">Receipt Hash:</div>
                  <div className="text-gray-400" style={{ wordBreak: "break-all" }}>{receipt?.hash}</div>
                </div>

                <button
                  className="btn btn-outline mt-6 w-full"
                  style={{ width: "100%", padding: "1rem" }}
                  onClick={() => window.location.reload()}
                >
                  Return to Kiosk Home
                </button>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollLayout>
  );
};

export default KioskDemo;
