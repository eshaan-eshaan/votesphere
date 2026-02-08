import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollLayout from "../components/ui/ScrollLayout";
import GlassCard from "../components/ui/GlassCard";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <ScrollLayout>
      <div className="container" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ width: "100%", maxWidth: "500px", textAlign: "center" }}
        >
          <GlassCard>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛸</div>
            <h2 className="text-gradient" style={{ fontSize: "2rem", marginBottom: "1rem" }}>Page Not Found</h2>
            <p className="text-muted mb-6">
              The page you are looking for seems to have drifted into a black hole.
            </p>
            <div className="flex justify-center gap-4">
              <button className="btn btn-primary" onClick={() => navigate("/")}>
                Return Home
              </button>
              <button className="btn btn-outline" onClick={() => navigate("/kiosk")}>
                Kiosk Demo
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </ScrollLayout>
  );
};

export default NotFound;
