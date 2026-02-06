import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSCODE = "VSPHERE-ADMIN-2026"; // change for your demo

const AdminLogin = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = code.trim();

    if (!trimmed) {
      setError("Please enter the admin access code.");
      return;
    }

    if (trimmed === ADMIN_PASSCODE) {
      // mark admin in localStorage and redirect to dashboard
      try {
        localStorage.setItem("votesphere_adminToken", "granted");
      } catch (err) {
        console.error("Failed to store admin token", err);
      }
      navigate("/admin");
    } else {
      setError("Invalid access code. Please try again.");
    }
  };

  return (
    <div className="page animate-fade-in">
      <div className="container">
        <div className="section">
          <div className="card">
            <div className="badge badge-primary mb-2">Administrator Access</div>
            <h2 className="section-title">Admin Login</h2>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              This area is restricted to authorized election administrators.
              Enter the one‑time access code provided for this election to view
              dashboards and system logs.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                className="input"
                placeholder="Enter admin access code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: 12, width: "100%" }}
              >
                Continue to Admin Dashboard
              </button>
            </form>

            {error && (
              <div
                style={{
                  marginTop: 10,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  fontSize: 13,
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
            )}

            <p className="text-muted" style={{ fontSize: 11, marginTop: 10 }}>
              Tip for demo: you can configure different codes per election, or
              replace this with OTP / SSO in a production setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
