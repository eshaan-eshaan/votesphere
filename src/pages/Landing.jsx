import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroScene from "../components/3d/HeroScene";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import TiltCard from "../components/ui/TiltCard";
import { useTheme } from "../components/ThemeContext";

const Landing = () => {
  const { theme } = useTheme();
  const { scrollY } = useScroll();

  // Stronger Parallax Effect
  const heroTextY = useTransform(scrollY, [0, 500], [0, 300]);
  const heroSceneY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  return (
    <ScrollLayout>
      {/* Hero Section */}
      <section style={{ minHeight: "100vh", paddingTop: "8rem", paddingBottom: "6rem", display: "flex", alignItems: "center", position: "relative" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "4rem", alignItems: "center", zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ y: heroTextY, opacity: heroOpacity }}
          >
            <h1 style={{ fontSize: "4rem", lineHeight: 1.1, marginBottom: "1.5rem" }}>
              Secure Vote <br />
              <span className="text-gradient">Democracy V2.0</span>
            </h1>
            <p className="text-muted" style={{ fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "2rem", maxWidth: "650px" }}>
              VoteSphere is an innovative online voting system designed to enable secure,
              efficient, and transparent digital elections. It simplifies the voting process
              while maintaining privacy and integrity, and bridges the gap between
              traditional and digital voting by offering easy access for every eligible voter.
              <br /><br />
              <strong style={{
                color: theme === "light" ? "#0891b2" : "var(--text-main)",
                background: theme === "light" ? "linear-gradient(135deg, #0891b2 0%, #059669 100%)" : "none",
                WebkitBackgroundClip: theme === "light" ? "text" : "unset",
                WebkitTextFillColor: theme === "light" ? "transparent" : "unset"
              }}>Core principle: ONE PERSON, ONE VOTE.</strong>
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link to="/kiosk">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "1rem 2rem",
                    borderRadius: "99px",
                    background: "var(--primary)",
                    border: "none",
                    color: "white",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 0 20px var(--primary-glow)"
                  }}
                >
                  Launch Kiosk
                </motion.button>
              </Link>
              <Link to="/audit">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "1rem 2rem",
                    borderRadius: "99px",
                    background: theme === "light"
                      ? "linear-gradient(135deg, #0891b2 0%, #0d9488 100%)"
                      : "transparent",
                    border: theme === "light" ? "none" : "1px solid var(--text-muted)",
                    color: theme === "light" ? "white" : "var(--text-main)",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: theme === "light" ? "0 4px 15px rgba(8, 145, 178, 0.3)" : "none"
                  }}
                >
                  Public Audit
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ height: "500px", y: heroSceneY }}
          >
            <HeroScene />
          </motion.div>
        </div>
      </section>

      {/* Feature Section with Glass Cards */}
      <section style={{ padding: "4rem 0", position: "relative" }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: "4rem" }}
          >
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Why VoteSphere?</h2>
            <p className="text-muted">Secure, transparent, and inclusive digital elections for organizations.</p>
          </motion.div>

          {/* Staggered Grid Reveal with 3D Tilt */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "6rem", perspective: "1000px" }}>
            <TiltCard delay={0}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔒</div>
              <h3>End-to-End Encryption</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Votes are encrypted on your device using RSA-OAEP before they ever touch the network.
                The server never sees your choice.
              </p>
            </TiltCard>

            <TiltCard delay={0.1}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🙈</div>
              <h3>Server-Blind Voting</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Backend infrastructure only handles ciphertext and metadata.
                Even if compromised, administrators cannot read individual votes.
              </p>
            </TiltCard>

            <TiltCard delay={0.2}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📱</div>
              <h3>Inclusive Access</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Secure kiosks, assisted terminals, and web access let every eligible voter participate,
                including users without personal smartphones.
              </p>
            </TiltCard>

            <TiltCard delay={0.3}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✍️</div>
              <h3>Digital Signatures</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Every vote is mathematically signed (ECDSA) by the voter's secure identity,
                preventing tampering and impersonation.
              </p>
            </TiltCard>

            <TiltCard delay={0.4}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🛡️</div>
              <h3>Tamper-Proof Ledger</h3>
              <p className="text-muted" style={{ marginTop: "0.5rem" }}>
                Encrypted votes are anchored to an immutable ledger.
                You can verify your vote was counted without revealing how you voted.
              </p>
            </TiltCard>
          </div>

          {/* Target Use-Cases Section */}
          {/* Target Use-Cases Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginTop: "8rem" }}
          >
            <h2 style={{ fontSize: "2.5rem", marginBottom: "3rem", textAlign: "center" }}>Where VoteSphere Fits</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", perspective: "1000px" }}>
              <TiltCard delay={0.5}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏢</div>
                <h3>Enterprises</h3>
                <p className="text-muted">Secure board elections and shareholder voting with verifiable audit trails.</p>
              </TiltCard>
              <TiltCard delay={0.6}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎓</div>
                <h3>Universities</h3>
                <p className="text-muted">Student council and departmental representative elections accessible to all.</p>
              </TiltCard>
              <TiltCard delay={0.7}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤝</div>
                <h3>NGOs</h3>
                <p className="text-muted">Transparent leadership selection and policy polling for professional bodies.</p>
              </TiltCard>
              <TiltCard delay={0.8}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏘️</div>
                <h3>Communities</h3>
                <p className="text-muted">Housing society elections and consensus building for resident welfare.</p>
              </TiltCard>
            </div>
          </motion.div>

          {/* Final Mission & CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{ marginTop: "8rem", textAlign: "center", position: "relative" }}
          >
            <div style={{
              background: theme === "light"
                ? "linear-gradient(180deg, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0.5) 100%)"
                : "linear-gradient(180deg, rgba(6,182,212,0.1) 0%, rgba(0,0,0,0) 100%)",
              padding: "4rem 2rem",
              borderRadius: "24px",
              border: theme === "light"
                ? "1px solid rgba(99,102,241,0.25)"
                : "1px solid rgba(6,182,212,0.2)"
            }}>
              <h2 style={{
                fontSize: "3rem",
                marginBottom: "1.5rem",
                background: theme === "light"
                  ? "linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)"
                  : "linear-gradient(to right, #fff, #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>
                The Future of Democracy is Digital
              </h2>
              <p style={{
                fontSize: "1.2rem",
                color: theme === "light" ? "#334155" : "#94a3b8",
                maxWidth: "600px",
                margin: "0 auto 3rem auto"
              }}>
                Bridge the gap between traditional integrity and modern convenience.
                <br />
                Secure. Verifiable. Universal.
              </p>

              <Link to="/kiosk">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(6,182,212,0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: "1.2rem 3rem",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#fff",
                    background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                    border: "none",
                    borderRadius: "99px",
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(6,182,212,0.4)"
                  }}
                >
                  Start Voting Now
                </motion.button>
              </Link>
            </div>
          </motion.div>

        </div>
      </section>
    </ScrollLayout>
  );
};

export default Landing;
