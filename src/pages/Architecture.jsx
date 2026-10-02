import React, { Suspense } from "react";
import { motion } from "framer-motion";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import TiltCard from "../components/ui/TiltCard";
import { useTheme } from "../components/ThemeContext";

// Lazy load the 3D scene to prevent blocking
const SecurityScene = React.lazy(() => import("../components/three/SecurityScene"));

const Architecture = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Theme-aware colors
  const headingColor = isLight ? "#1e293b" : "white";
  const subHeadingColor = isLight ? "#4f46e5" : "#a5b4fc";
  const flowBg = isLight ? "rgba(99, 102, 241, 0.08)" : "rgba(0,0,0,0.4)";
  const flowBorder = isLight ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.08)";
  const flowText = isLight ? "#1e293b" : "#e2e8f0";
  const flowMuted = isLight ? "#475569" : "#64748b";
  const accentGreen = isLight ? "#059669" : "#4ade80";
  const accentBlue = isLight ? "#2563eb" : "#60a5fa";
  const accentPurple = isLight ? "#7c3aed" : "#a78bfa";
  const strongText = isLight ? "#0f172a" : "#e2e8f0";

  return (
    <ScrollLayout>
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          style={{ marginBottom: "3rem" }}
        >
          <div className="badge badge-primary mb-3">
            VoteSphere System Design • Advanced Concepts
          </div>
          <h2 className="section-title text-gradient" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
            System Architecture & Security Model
          </h2>
          <p className="text-muted" style={{ maxWidth: "800px", margin: "0 auto", lineHeight: "1.8" }}>
            How VoteSphere works today: single-use voting codes, a frozen ring of registered
            voters, anonymous ring-signed ballots, and a public audit ledger. The limits of this
            demo are listed honestly at the bottom of the page.
          </p>
        </motion.div>

        {/* 3D Security Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ marginBottom: "4rem" }}
        >
          <Suspense fallback={
            <div style={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6366f1"
            }}>
              Loading 3D visualization...
            </div>
          }>
            <SecurityScene />
          </Suspense>
          <p className="text-center text-muted text-sm" style={{ marginTop: "1rem" }}>
            Interactive Security Shield — Representing multi-layered cryptographic protection
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <GlassCard style={{ marginBottom: "4rem", padding: "2rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", color: headingColor }}>
            🏗️ System Architecture Flow
          </h3>
          <div
            style={{
              padding: "2rem",
              backgroundColor: flowBg,
              borderRadius: "16px",
              border: `1px solid ${flowBorder}`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.95rem",
              lineHeight: "2",
              color: flowText
            }}
          >
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ color: accentGreen, fontWeight: 700, fontSize: "1rem" }}>┌─ Voter (browser)</div>
              <div style={{ paddingLeft: "1.5rem", borderLeft: `2px solid ${flowBorder}`, marginLeft: "0.5rem" }}>
                <div style={{ color: accentBlue, marginBottom: "0.25rem" }}>▼ 1. Register a ring key</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, marginBottom: "1rem", paddingLeft: "1rem" }}>
                  A single-use voting code from the Returning Officer proves eligibility; the browser creates the secret key and keeps it
                </div>

                <div style={{ color: accentGreen, marginBottom: "0.25rem" }}>▼ 2. Encrypt the choice</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, marginBottom: "1rem", paddingLeft: "1rem" }}>
                  RSA-OAEP-4096 with the election public key (Web Crypto)
                </div>

                <div style={{ color: accentBlue, marginBottom: "0.25rem" }}>▼ 3. Ring-sign the ciphertext</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "1rem" }}>
                  Linkable ring signature over the frozen ring of all registered voters
                </div>
              </div>

              <div style={{ color: accentPurple, fontWeight: 700, marginTop: "1rem", fontSize: "1rem" }}>├─ Server (Node + Express)</div>
              <div style={{ paddingLeft: "1.5rem", borderLeft: `2px solid ${flowBorder}`, marginLeft: "0.5rem" }}>
                <div style={{ color: accentGreen, marginBottom: "0.25rem" }}>├─ Verify, de-duplicate, store</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "1rem" }}>
                  Checks the signature against its own frozen ring, rejects a repeated link tag, stores ciphertext with no voter identity
                </div>
              </div>

              <div style={{ color: accentBlue, fontWeight: 700, marginTop: "1rem", fontSize: "1rem" }}>├─ Public audit ledger</div>
              <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "2rem" }}>
                Every ballot&apos;s proof is published; anyone can re-verify its signature
              </div>

              <div style={{ color: accentGreen, fontWeight: 700, marginTop: "1rem", fontSize: "1rem" }}>└─ Tally</div>
              <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "2rem" }}>
                The server decrypts ballots in aggregate with the election private key; admins see only totals
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Governance Roles Grid */}
        <div style={{ marginBottom: "4rem" }}>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "2rem", textAlign: "center", color: headingColor }}>
            👥 Who Does What
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            <TiltCard delay={0.1}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🗳️ Returning Officer (admin)
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Issues each eligible member a single-use voting code, opens key registration, freezes the ring and
                  closes the poll. Sees totals only; holds no voter keys, so cannot vote for anyone.
                </p>
              </div>
            </TiltCard>

            <TiltCard delay={0.2}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🔑 Voter
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  One flat, one vote. Redeems the code once to register a secret key that never leaves the browser,
                  then casts one encrypted, ring-signed ballot.
                </p>
              </div>
            </TiltCard>

            <TiltCard delay={0.3}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🖥️ Server
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Verifies signatures against its frozen ring, rejects repeat link tags, stores ciphertext with no identity,
                  and holds the election decryption key to tally. It must be trusted to count honestly.
                </p>
              </div>
            </TiltCard>

            <TiltCard delay={0.4}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🔍 Public auditor
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Anyone can read the ledger, fetch a ballot&apos;s proof and re-verify its ring signature against the
                  published ring, without learning how anyone voted.
                </p>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {/* Trust model */}
          <GlassCard style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.25rem", color: headingColor }}>
              ⚖️ Trust Model &amp; Limits
            </h3>
            <p className="text-muted" style={{ marginBottom: "1.5rem", lineHeight: "1.7" }}>
              This is a demonstration, not a certified election system.
            </p>
            <ul style={{ fontSize: "0.95rem", color: flowMuted, lineHeight: "2", listStyle: "disc", paddingLeft: "1.25rem" }}>
              <li><strong style={{ color: strongText }}>Not end-to-end:</strong> the server holds the election key and decrypts ballots to count them.</li>
              <li><strong style={{ color: strongText }}>Anonymity comes from the ring signature:</strong> a ballot carries no voter identity.</li>
              <li><strong style={{ color: strongText }}>Codes:</strong> whoever controls a voter&apos;s code can register their key.</li>
              <li><strong style={{ color: strongText }}>Library:</strong> the ring-signature package is early-stage, unaudited, and uses a small (768-bit) group.</li>
              <li><strong style={{ color: strongText }}>Data:</strong> the electorate is synthetic, and storage resets on free hosting.</li>
            </ul>
          </GlassCard>

          {/* Implementation Summary */}
          <GlassCard style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.25rem", color: headingColor }}>
              🛠️ Implementation Stack
            </h3>
            <ul style={{ fontSize: "0.95rem", color: flowMuted, lineHeight: "2", listStyle: "disc", paddingLeft: "1.25rem" }}>
              <li><strong style={{ color: strongText }}>Frontend:</strong> React + Vite + Framer Motion (Glass UI)</li>
              <li><strong style={{ color: strongText }}>Anonymity:</strong> Linkable Ring Signatures (lrs)</li>
              <li><strong style={{ color: strongText }}>3D Graphics:</strong> React Three Fiber + Three.js</li>
              <li><strong style={{ color: strongText }}>Backend:</strong> Node.js + Express + Prisma (SQLite)</li>
              <li><strong style={{ color: strongText }}>Auth:</strong> JWT + HTTP-Only Cookies</li>
              <li><strong style={{ color: strongText }}>Codes:</strong> random 100-bit, stored only as HMACs</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </ScrollLayout>
  );
};

export default Architecture;
