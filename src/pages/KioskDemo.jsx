import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import TiltCard from "../components/ui/TiltCard";
import { useElection } from "../hooks/useElection";
import { generateIdentity, signVote } from "../utils/ring-signature";
import { importKey, encryptVote } from "../utils/crypto";
import {
  loadIdentity, saveIdentity, getVotedBallot, rememberVoted,
  downloadIdentityBackup, parseIdentityBackup,
} from "../utils/identity";
import { API_BASE } from "../config";

const postJson = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const inputStyle = {
  width: "100%", padding: "1rem", borderRadius: "12px", fontSize: "1rem",
  background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.15)", color: "white",
  fontFamily: "monospace", letterSpacing: "0.05em",
};

const KioskDemo = () => {
  const { election, error: electionError, loading } = useElection(5000);

  // Registration
  const [code, setCode] = useState("");
  const [registering, setRegistering] = useState(false);
  const [identityVersion, setIdentityVersion] = useState(0);

  // Voting
  const [electionKey, setElectionKey] = useState(null); // { cryptoKey, fingerprint }
  const [selected, setSelected] = useState(null);
  const [cipher, setCipher] = useState("");
  const [encrypting, setEncrypting] = useState(false);
  const encryptSeq = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [error, setError] = useState(null);

  const electionId = election ? election.id : null;
  const status = election ? election.status : null;

  // The voter's ring key lives in this browser between registration and voting.
  // identityVersion forces a re-read after it changes.
  const identity = useMemo(
    () => (electionId ? loadIdentity(electionId) : null),
    [electionId, identityVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const votedBallot = electionId && !receipt ? getVotedBallot(electionId) : null;

  // Fetch the election's public key once voting is open.
  const needsKey = status === "VOTING" && !!identity && !votedBallot;
  useEffect(() => {
    if (!needsKey || electionKey) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/election/public-key`);
        if (!res.ok) throw new Error("Failed to fetch the election public key");
        const { publicKey: jwk } = await res.json();
        const cryptoKey = await importKey(jwk);
        if (!cancelled) setElectionKey({ cryptoKey, fingerprint: `${jwk.n.slice(0, 20)}...` });
      } catch {
        if (!cancelled) setError("Could not load the election key. Please reload the page.");
      }
    })();
    return () => { cancelled = true; };
  }, [needsKey, electionKey]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!code.trim() || registering) return;
    setRegistering(true);
    setError(null);
    try {
      const fresh = generateIdentity();
      await postJson("/api/election/register-key", { code, publicKey: fresh.publicKey });
      saveIdentity(electionId, fresh);
      setIdentityVersion((v) => v + 1);
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      saveIdentity(electionId, parseIdentityBackup(await file.text(), electionId));
      setIdentityVersion((v) => v + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  // Each selection starts a fresh encryption, clears the previous ciphertext
  // and ignores stale results, so the ballot always matches the highlighted
  // candidate (the Cast button stays disabled until the right one is ready).
  const handleSelect = async (candidate) => {
    if (submitting || !electionKey) return;
    const seq = ++encryptSeq.current;
    setSelected(candidate);
    setCipher("");
    setEncrypting(true);
    setError(null);
    try {
      const result = await encryptVote(candidate.id, electionKey.cryptoKey);
      if (seq === encryptSeq.current) setCipher(result);
    } catch {
      if (seq === encryptSeq.current) setError("Encryption failed. Please try again.");
    } finally {
      if (seq === encryptSeq.current) setEncrypting(false);
    }
  };

  const handleSubmit = async () => {
    if (!cipher || encrypting || submitting || !selected || !identity) return;
    setSubmitting(true);
    setError(null);
    try {
      // Sign over the server's frozen ring, never one of our own.
      const ringRes = await fetch(`${API_BASE}/api/election/ring`);
      const ringData = await ringRes.json().catch(() => ({}));
      if (!ringRes.ok) throw new Error(ringData.error || "Could not load the voter ring.");
      if (ringData.ringHash !== election.ringHash) throw new Error("The voter ring changed. Reload the page and try again.");
      if (!ringData.ring.includes(identity.publicKey)) {
        throw new Error("This browser's key is not in the voter ring. Register a key first, or import your key backup.");
      }

      const signature = signVote(cipher, identity, ringData.ring);
      const data = await postJson("/api/votes", {
        electionId: election.id,
        encryptedBallot: cipher,
        signature,
        ringHash: ringData.ringHash,
      });

      rememberVoted(election.id, data.ballotId);
      setReceipt({
        id: data.ballotId,
        timestamp: new Date(data.castAt).toLocaleString(),
        candidate: selected.name,
        ringSize: ringData.ring.length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const muted = { color: "#94a3b8", lineHeight: 1.7 };

  const renderBody = () => {
    if (loading) return <GlassCard style={{ padding: "2rem" }}><p style={muted}>Loading election...</p></GlassCard>;
    if (!election) {
      return <GlassCard style={{ padding: "2rem" }}><p style={muted}>{electionError || "Election unavailable."}</p></GlassCard>;
    }

    if (receipt) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <TiltCard>
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
              <h3 className="text-gradient" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Vote Successfully Cast</h3>
              <p style={muted}>Your ballot was encrypted, anonymously signed, and recorded.</p>
            </div>

            <div style={{ background: "white", padding: "2rem", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "black", margin: "1rem 0" }}>
              <QRCodeSVG value={`${window.location.origin}/audit?ballot=${receipt.id}`} size={180} />
              <p style={{ fontSize: "0.9rem", color: "#666" }}>Scan to open your ballot on the audit page</p>
            </div>

            <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1rem", fontFamily: "monospace", fontSize: "0.85rem", wordBreak: "break-all" }}>
              <div style={{ color: "#93c5fd" }}>Ballot ID</div>
              <div style={{ color: "#4ade80", marginBottom: "0.75rem" }}>{receipt.id}</div>
              <div style={{ color: "#93c5fd" }}>Anonymity set</div>
              <div style={{ color: "#cbd5e1", marginBottom: "0.75rem" }}>Signed as one of {receipt.ringSize} registered voters</div>
              <div style={{ color: "#93c5fd" }}>Recorded (rounded to 15 minutes)</div>
              <div style={{ color: "#cbd5e1" }}>{receipt.timestamp}</div>
            </div>
            <p style={{ ...muted, fontSize: "0.85rem", marginTop: "1rem" }}>
              Keep the Ballot ID. Anyone can look it up on the Audit page; it does not reveal your choice or your identity.
            </p>
          </TiltCard>
        </motion.div>
      );
    }

    if (status === "DRAFT") {
      return (
        <GlassCard style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Voting has not opened yet</h3>
          <p style={muted}>
            The Returning Officer issues each eligible member a personal voting code first, then opens key registration.
            This page updates automatically.
          </p>
        </GlassCard>
      );
    }

    if (status === "CLOSED") {
      return (
        <GlassCard style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Voting is closed</h3>
          <p style={muted}>
            {election.counts.ballots} ballots were cast. Check that yours was counted on the <a href="/audit" style={{ color: "#a5b4fc" }}>Audit page</a>.
          </p>
        </GlassCard>
      );
    }

    if (votedBallot) {
      return (
        <GlassCard style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>You have already voted</h3>
          <p style={muted}>Your ballot ID is <span style={{ fontFamily: "monospace", color: "#4ade80", wordBreak: "break-all" }}>{votedBallot}</span>. You can verify it on the <a href="/audit" style={{ color: "#a5b4fc" }}>Audit page</a>.</p>
        </GlassCard>
      );
    }

    if (status === "REGISTRATION") {
      if (identity) {
        return (
          <GlassCard style={{ padding: "2rem" }}>
            <div className="badge badge-soft mb-3">STEP 1 OF 2 COMPLETE</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Your voting key is registered ✓</h3>
            <p style={muted}>
              Come back to this same browser when voting opens (this page updates by itself). Your private key never leaves
              this device. To vote from another device, download the backup and keep it private: anyone holding it can vote as you.
            </p>
            <button className="btn btn-outline" style={{ marginTop: "1rem" }} onClick={() => downloadIdentityBackup(election.id, identity)}>
              Download key backup
            </button>
          </GlassCard>
        );
      }
      return (
        <GlassCard style={{ padding: "2rem" }}>
          <div className="badge badge-soft mb-3">STEP 1 OF 2 · REGISTER YOUR KEY</div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Enter your personal voting code</h3>
          <p style={{ ...muted, marginBottom: "1.25rem" }}>
            Use the code the Returning Officer gave you (it looks like <span style={{ fontFamily: "monospace" }}>VS-XXXX-XXXX-XXXX-XXXX-XXXXX</span>).
            It works once. Your browser creates a secret key that stays on this device; the code only proves you are eligible to register it.
          </p>
          <form onSubmit={handleRegister} style={{ display: "grid", gap: "1rem" }}>
            <input
              style={inputStyle}
              placeholder="VS-XXXX-XXXX-XXXX-XXXX-XXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={registering}
            />
            <button className="btn btn-primary" type="submit" disabled={!code.trim() || registering} style={{ padding: "1rem" }}>
              {registering ? "Registering..." : "Register my voting key"}
            </button>
          </form>
          <label style={{ ...muted, fontSize: "0.85rem", display: "block", marginTop: "1.25rem" }}>
            Already registered on another device? Import your key backup:{" "}
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
        </GlassCard>
      );
    }

    // status === "VOTING"
    if (!identity) {
      return (
        <GlassCard style={{ padding: "2rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No voting key on this browser</h3>
          <p style={muted}>
            Voting is open, and keys can no longer be registered. If you registered on another device, import your key backup here.
          </p>
          <label style={{ ...muted, display: "block", marginTop: "1rem" }}>
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
        </GlassCard>
      );
    }

    return (
      <>
        <GlassCard className="mb-4" style={{ padding: "2rem" }}>
          <div className="badge badge-soft mb-3">STEP 2 OF 2 · CAST YOUR VOTE</div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 600 }}>{election.title}</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {election.candidates.map((c) => {
              const isSel = selected && selected.id === c.id;
              return (
                <motion.button
                  key={c.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(c)}
                  disabled={submitting || !electionKey}
                  style={{
                    width: "100%", padding: "1.25rem 1.5rem", textAlign: "left", borderRadius: "12px",
                    border: isSel ? `2px solid ${c.color}` : "1px solid rgba(255,255,255,0.1)",
                    background: isSel ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    color: "white", cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{c.name}</div>
                  {c.unitLabel && <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Flat {c.unitLabel}</div>}
                </motion.button>
              );
            })}
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "2rem" }}
            onClick={handleSubmit}
            disabled={!cipher || encrypting || submitting}
          >
            {submitting ? "Signing & submitting..." : encrypting ? "Encrypting..." : "Cast Encrypted Vote"}
          </button>
        </GlassCard>

        {selected && (
          <TiltCard>
            <div style={{ padding: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                🔐 Encrypted on this device
              </h3>
              <div style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "rgba(0,0,0,0.5)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ marginBottom: "0.5rem" }}><span style={{ color: "#a5b4fc" }}>choice</span> = <span style={{ color: "#4ade80" }}>{selected.name}</span></div>
                <div style={{ marginBottom: "0.5rem" }}><span style={{ color: "#a5b4fc" }}>election_key</span> = <span style={{ color: "#fbbf24" }}>RSA-OAEP-4096 · {electionKey ? electionKey.fingerprint : "..."}</span></div>
                <div><span style={{ color: "#a5b4fc" }}>ciphertext</span> = <span style={{ color: "#4ade80", wordBreak: "break-all" }}>{cipher || "Encrypting..."}</span></div>
              </div>
              <p style={{ ...muted, fontSize: "0.8rem", marginTop: "0.75rem" }}>
                Only the ciphertext is sent. The server holds the election key and decrypts ballots in aggregate to count them.
              </p>
            </div>
          </TiltCard>
        )}
      </>
    );
  };

  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "8rem", paddingBottom: "5rem", maxWidth: "800px" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center" style={{ marginBottom: "3rem" }}>
          <div className="badge badge-primary mb-3">
            Demo Only • Fictional electorate{election ? ` • ${election.counts.registered} of ${election.counts.eligible} voters registered` : ""}
          </div>
          <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>VoteSphere Voting Portal</h2>
          <p style={{ ...muted, fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto" }}>
            One flat, one vote. A personal voting code registers your secret key; your vote is encrypted on this device and signed
            anonymously within the ring of all registered voters.
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: 20, padding: 15, borderRadius: 12, backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5" }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {renderBody()}
      </div>
    </ScrollLayout>
  );
};

export default KioskDemo;
