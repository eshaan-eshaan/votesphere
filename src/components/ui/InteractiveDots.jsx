import React, { useRef, useEffect } from "react";
import { useTheme } from "../ThemeContext";

// Rainbow color palette
const rainbowColors = [
    { r: 255, g: 99, b: 132 },   // Pink/Red
    { r: 255, g: 159, b: 64 },   // Orange
    { r: 255, g: 205, b: 86 },   // Yellow
    { r: 75, g: 192, b: 102 },   // Green
    { r: 54, g: 162, b: 235 },   // Blue
    { r: 99, g: 102, b: 241 },   // Indigo
    { r: 153, g: 102, b: 255 },  // Purple
];

const InteractiveDots = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();
    const mouseRef = useRef({ x: 0, y: 0 });
    const dotsRef = useRef([]);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const isLight = theme === "light";

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Create dots with rainbow colors - increased density
        const dotCount = 120;
        dotsRef.current = Array.from({ length: dotCount }, (_, i) => {
            const colorIndex = i % rainbowColors.length;
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 2.5 + 1,
                color: rainbowColors[colorIndex],
                colorIndex: colorIndex,
            };
        });

        // Mouse tracking
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const dots = dotsRef.current;
            const mouse = mouseRef.current;

            // Update and draw dots
            dots.forEach((dot, i) => {
                // Move dots
                dot.x += dot.vx;
                dot.y += dot.vy;

                // Bounce off edges
                if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
                if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

                // Mouse interaction - dots move away from cursor
                const dx = dot.x - mouse.x;
                const dy = dot.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    dot.x += dx * force * 0.02;
                    dot.y += dy * force * 0.02;
                }

                // Draw dot with rainbow color
                const { r, g, b } = dot.color;
                const opacity = isLight ? 0.5 + dot.radius * 0.1 : 0.6 + dot.radius * 0.12;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.fill();

                // Draw connections with gradient between colors
                dots.slice(i + 1).forEach((other) => {
                    const ddx = dot.x - other.x;
                    const ddy = dot.y - other.y;
                    const distance = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.moveTo(dot.x, dot.y);
                        ctx.lineTo(other.x, other.y);
                        const lineOpacity = (1 - distance / 120) * (isLight ? 0.2 : 0.25);
                        // Use average of two dot colors
                        const avgR = Math.round((dot.color.r + other.color.r) / 2);
                        const avgG = Math.round((dot.color.g + other.color.g) / 2);
                        const avgB = Math.round((dot.color.b + other.color.b) / 2);
                        ctx.strokeStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${lineOpacity})`;
                        ctx.stroke();
                    }
                });

                // Draw connection to mouse if close - rainbow glow
                if (dist < 180) {
                    ctx.beginPath();
                    ctx.moveTo(dot.x, dot.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    const mouseOpacity = (1 - dist / 180) * (isLight ? 0.35 : 0.45);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${mouseOpacity})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.lineWidth = 1;
                }
            });

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
                zIndex: 0,
            }}
        />
    );
};

export default InteractiveDots;
