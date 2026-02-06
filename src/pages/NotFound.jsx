import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="page animate-fade-in">
      <div className="container">
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Page not found</h2>
          <p className="text-muted" style={{ fontSize: 13 }}>
            This route is not part of the demo. Use the buttons below to go
            back.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Go to Overview
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/kiosk")}>
              Open Kiosk Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
