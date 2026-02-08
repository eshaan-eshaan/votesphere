import React from "react";
import { useTheme } from "../ThemeContext";
import InteractiveDots from "./InteractiveDots";

const ScrollLayout = ({ children }) => {
    const { theme } = useTheme();

    // Simple clean gradient background
    const backgroundStyle = theme === "light"
        ? "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f0f4ff 100%)"
        : "radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #0f172a 40%, #020617 100%)";

    return (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            {/* Plain gradient background */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: -2,
                    background: backgroundStyle,
                    transition: "background 0.3s ease",
                }}
            />

            {/* Subtle interactive dots - keeping for some life */}
            <InteractiveDots />

            {children}
        </div>
    );
};

export default ScrollLayout;
