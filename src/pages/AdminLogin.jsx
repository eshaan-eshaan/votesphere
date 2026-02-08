import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../components/ThemeContext";

const AdminLogin = () => {
  const { theme } = useTheme();
  const { login, register, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLight = theme === "light";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when switching modes
  useEffect(() => {
    setLocalError("");
    setSuccessMsg("");
    clearError();
  }, [mode, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");

    // Validation
    if (!email.trim() || !password.trim()) {
      setLocalError("Please enter email and password.");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters.");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        setLocalError("Password must contain uppercase, lowercase, and numbers.");
        return;
      }
    }

    setSubmitting(true);

    if (mode === "login") {
      const result = await login(email, password);
      if (result.success) {
        navigate("/admin");
      } else {
        setLocalError(result.error);
      }
    } else {
      const result = await register(email, password);
      if (result.success) {
        setSuccessMsg("Account created! You can now login.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        setLocalError(result.error);
      }
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <ScrollLayout>
        <div className="container" style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: isLight ? "#4f46e5" : "#a5b4fc" }}>Loading...</div>
        </div>
      </ScrollLayout>
    );
  }

  return (
    <ScrollLayout>
      <div className="container" style={{ minHeight: "90vh", paddingTop: "6rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: "420px" }}
        >
          <GlassCard style={{ padding: "3rem 2.5rem" }}>
            <div style={{ textAlign: "center" }}>
              {/* Shield Icon */}
              <div style={{
                fontSize: "3.5rem",
                marginBottom: "1.5rem",
                filter: "drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))"
              }}>
                🛡️
              </div>

              <div className="badge badge-primary" style={{ marginBottom: "1rem" }}>
                Administrator Access
              </div>

              <h2 className="text-gradient" style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                marginBottom: "0.75rem"
              }}>
                {mode === "login" ? "Admin Login" : "Create Account"}
              </h2>

              <p style={{
                color: isLight ? "#475569" : "#94a3b8",
                fontSize: "0.9rem",
                marginBottom: "2rem",
                lineHeight: "1.6"
              }}>
                {mode === "login"
                  ? "Enter your credentials to access the dashboard."
                  : "First time? Create an admin account."}
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    marginBottom: "1rem",
                    borderRadius: "12px",
                    border: isLight ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255,255,255,0.15)",
                    background: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)",
                    color: isLight ? "#0f172a" : "white",
                    fontSize: "1rem",
                    outline: "none"
                  }}
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    marginBottom: mode === "register" ? "1rem" : "1.25rem",
                    borderRadius: "12px",
                    border: isLight ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255,255,255,0.15)",
                    background: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)",
                    color: isLight ? "#0f172a" : "white",
                    fontSize: "1rem",
                    outline: "none"
                  }}
                />

                {mode === "register" && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      marginBottom: "1.25rem",
                      borderRadius: "12px",
                      border: isLight ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255,255,255,0.15)",
                      background: isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)",
                      color: isLight ? "#0f172a" : "white",
                      fontSize: "1rem",
                      outline: "none"
                    }}
                  />
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: "12px",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer"
                  }}
                >
                  {submitting
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </motion.button>
              </form>

              {/* Success Message */}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: "1.25rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    color: "#4ade80",
                    fontSize: "0.85rem"
                  }}
                >
                  {successMsg}
                </motion.div>
              )}

              {/* Error Message */}
              {(localError || error) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: "1.25rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    fontSize: "0.85rem"
                  }}
                >
                  {localError || error}
                </motion.div>
              )}

              {/* Toggle Mode */}
              <div style={{
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: isLight ? "1px solid rgba(99, 102, 241, 0.15)" : "1px solid rgba(255,255,255,0.08)"
              }}>
                <button
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: isLight ? "#4f46e5" : "#a5b4fc",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    textDecoration: "underline"
                  }}
                >
                  {mode === "login"
                    ? "First time? Create an account"
                    : "Already have an account? Sign in"}
                </button>
              </div>

              <div style={{
                marginTop: "1rem",
                fontSize: "0.75rem",
                color: isLight ? "#64748b" : "#64748b"
              }}>
                Contact your election administrator for access credentials.
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </ScrollLayout>
  );
};

export default AdminLogin;
