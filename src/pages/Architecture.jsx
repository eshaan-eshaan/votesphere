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
            Technical deep‑dive into how VoteSphere delivers secure, efficient,
            and transparent digital elections while enforcing ONE PERSON, ONE
            VOTE through strong identity, cryptography, and governance.
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
              <div style={{ color: accentGreen, fontWeight: 700, fontSize: "1rem" }}>┌─ Voter (Client Device)</div>
              <div style={{ paddingLeft: "1.5rem", borderLeft: `2px solid ${flowBorder}`, marginLeft: "0.5rem" }}>
                <div style={{ color: accentBlue, marginBottom: "0.25rem" }}>▼ 1. Identity Verification</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, marginBottom: "1rem", paddingLeft: "1rem" }}>
                  Smart Card / Biometric / Aadhaar eKYC
                </div>

                <div style={{ color: accentGreen, marginBottom: "0.25rem" }}>▼ 2. Secure Kiosk UI (Offline-First)</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, marginBottom: "1rem", paddingLeft: "1rem" }}>
                  Air-gapped capable, tamper-evident interface
                </div>

                <div style={{ color: accentBlue, marginBottom: "0.25rem" }}>▼ 3. Client-Side Encryption</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, marginBottom: "1rem", paddingLeft: "1rem" }}>
                  RSA-4096 / ECDSA (fully auditable source code)
                </div>

                <div style={{ color: accentGreen, marginBottom: "0.25rem" }}>▼ 4. Encrypted Vote + Receipt Hash</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "1rem" }}>
                  Zero-knowledge proof generation for anonymity
                </div>
              </div>

              <div style={{ color: accentPurple, fontWeight: 700, marginTop: "1rem", fontSize: "1rem" }}>├─ Backend API (Server-Blind)</div>
              <div style={{ paddingLeft: "1.5rem", borderLeft: `2px solid ${flowBorder}`, marginLeft: "0.5rem" }}>
                <div style={{ color: accentGreen, marginBottom: "0.25rem" }}>├─ Tamper-Proof Ledger / Blockchain</div>
                <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "1rem" }}>
                  Immutable, append-only cryptographic log
                </div>
              </div>

              <div style={{ color: accentBlue, fontWeight: 700, marginTop: "1rem", fontSize: "1rem" }}>└─ Threshold Decryption Ceremony</div>
              <div style={{ fontSize: "0.8rem", color: flowMuted, paddingLeft: "2rem" }}>
                2-of-3 Key Holders required (Privacy Preserved)
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Governance Roles Grid */}
        <div style={{ marginBottom: "4rem" }}>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "2rem", textAlign: "center", color: headingColor }}>
            👥 Role‑Separated Governance
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            <TiltCard delay={0.1}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🗳️ Election Creator
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Creates election, sets candidates, configures rules. Cannot access votes or decryption keys.
                </p>
              </div>
            </TiltCard>

            <TiltCard delay={0.2}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🔑 Authentication Authority
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Verifies voter eligibility and prevents duplicate ballots. Cannot see vote content.
                </p>
              </div>
            </TiltCard>

            <TiltCard delay={0.3}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  📜 Ledger Manager
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Anchors encrypted votes to blockchain. Cannot decrypt or modify any votes.
                </p>
              </div>
            </TiltCard>

            <TiltCard delay={0.4}>
              <div style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600, color: subHeadingColor, marginBottom: "0.75rem" }}>
                  🧮 Counting Authority
                </div>
                <p className="text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Holds one key share. Participates in threshold decryption only during tallying.
                </p>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {/* Threshold Cryptography */}
          <GlassCard style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.25rem", color: headingColor }}>
              🔐 Threshold Cryptography
            </h3>
            <p className="text-muted" style={{ marginBottom: "1.5rem", lineHeight: "1.7" }}>
              The private decryption key is split using Shamir&apos;s Secret
              Sharing. No single party can decrypt alone.
            </p>
            <ul style={{ fontSize: "0.95rem", color: flowMuted, lineHeight: "2", listStyle: "disc", paddingLeft: "1.25rem" }}>
              <li><strong style={{ color: strongText }}>Key Split:</strong> 3 trusted authorities (EC, University, Observer)</li>
              <li><strong style={{ color: strongText }}>Threshold:</strong> Any 2 of 3 must collaborate to decrypt.</li>
              <li><strong style={{ color: strongText }}>No Single Point of Failure:</strong> Prevents rogue admin attacks.</li>
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
            </ul>
          </GlassCard>
        </div>
      </div>
    </ScrollLayout>
  );
};

export default Architecture;
