import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "../ThemeContext";

const GlassCard = ({ children, className = "", style = {}, enableAnimation = true, ...props }) => {
    const { theme } = useTheme();

    const animationProps = enableAnimation ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-50px" },
        transition: { duration: 0.5, ease: "easeOut" }
    } : {};

    // Theme-aware glass styles
    const glassStyles = theme === "light" ? {
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        borderRadius: "16px",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        boxShadow: "0 8px 32px rgba(99, 102, 241, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
        padding: "24px",
        color: "#0f172a",
    } : {
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
        padding: "24px",
        color: "white",
    };

    return (
        <motion.div
            className={`glass-card ${className}`}
            {...animationProps}
            whileHover={{
                scale: 1.01,
                boxShadow: theme === "light"
                    ? "0 12px 40px rgba(99, 102, 241, 0.2)"
                    : "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
            }}
            style={{
                ...glassStyles,
                ...style,
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
