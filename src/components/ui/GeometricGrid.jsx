import React, { useRef, useEffect } from "react";
import { useTheme } from "../ThemeContext";

const GeometricGrid = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();
    const animationRef = useRef(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const isLight = theme === "light";
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);

        // Hexagon grid settings
        const hexSize = 40;
        const hexHeight = hexSize * Math.sqrt(3);
        const hexWidth = hexSize * 2;

        // Colors
        const colors = [
            { r: 99, g: 102, b: 241 },   // Indigo
            { r: 139, g: 92, b: 246 },   // Purple
            { r: 34, g: 211, b: 238 },   // Cyan
            { r: 52, g: 211, b: 153 },   // Teal
            { r: 251, g: 146, b: 60 },   // Orange
        ];

        const drawHexagon = (x, y, size, color, alpha) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const hx = x + size * Math.cos(angle);
                const hy = y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        const animate = () => {
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            if (isLight) {
                gradient.addColorStop(0, "#f8fafc");
                gradient.addColorStop(0.3, "#e0e7ff");
                gradient.addColorStop(0.7, "#ddd6fe");
                gradient.addColorStop(1, "#e0e7ff");
            } else {
                gradient.addColorStop(0, "#1e1b4b");
                gradient.addColorStop(0.4, "#0f172a");
                gradient.addColorStop(1, "#020617");
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const mouse = mouseRef.current;

            // Draw hexagon grid
            const cols = Math.ceil(canvas.width / (hexWidth * 0.75)) + 2;
            const rows = Math.ceil(canvas.height / hexHeight) + 2;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * hexWidth * 0.75;
                    const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);

                    // Distance from mouse
                    const dx = x - mouse.x;
                    const dy = y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Pulse effect based on time and position
                    const pulse = Math.sin(time * 2 + (x + y) * 0.01) * 0.5 + 0.5;

                    // Color selection based on position
                    const colorIndex = Math.floor((x + y + time * 50) / 200) % colors.length;
                    const color = colors[Math.abs(colorIndex)];

                    // Alpha based on mouse proximity and pulse
                    let alpha = isLight ? 0.08 + pulse * 0.08 : 0.15 + pulse * 0.1;

                    // Highlight near mouse
                    if (dist < 200) {
                        const highlight = (200 - dist) / 200;
                        alpha += highlight * (isLight ? 0.3 : 0.4);
                    }

                    drawHexagon(x, y, hexSize * 0.9, color, alpha);

                    // Draw inner hexagon for highlighted ones
                    if (dist < 150) {
                        const innerAlpha = ((150 - dist) / 150) * (isLight ? 0.15 : 0.25);
                        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${innerAlpha})`;
                        ctx.fill();
                    }
                }
            }

            time += 0.01;
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: -1,
            }}
        />
    );
};

export default GeometricGrid;
