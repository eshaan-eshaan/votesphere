import React, { useRef, useEffect } from "react";
import { useTheme } from "../ThemeContext";

const GlassBubbles = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();
    const animationRef = useRef(null);
    const bubblesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const isLight = theme === "light";

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Rainbow colors for bubbles
        const colors = [
            { r: 255, g: 99, b: 132, name: 'pink' },
            { r: 255, g: 159, b: 64, name: 'orange' },
            { r: 255, g: 205, b: 86, name: 'yellow' },
            { r: 75, g: 192, b: 102, name: 'green' },
            { r: 54, g: 162, b: 235, name: 'blue' },
            { r: 99, g: 102, b: 241, name: 'indigo' },
            { r: 153, g: 102, b: 255, name: 'purple' },
        ];

        // Create bubbles
        const bubbleCount = 15;
        bubblesRef.current = Array.from({ length: bubbleCount }, (_, i) => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 120 + 60,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            color: colors[i % colors.length],
            phase: Math.random() * Math.PI * 2,
        }));

        const drawBubble = (bubble, time) => {
            const { x, y, radius, color, phase } = bubble;

            // Pulsing size
            const pulseRadius = radius + Math.sin(time + phase) * 10;

            // Create gradient for glass effect
            const gradient = ctx.createRadialGradient(
                x - pulseRadius * 0.3, y - pulseRadius * 0.3, 0,
                x, y, pulseRadius
            );

            if (isLight) {
                gradient.addColorStop(0, `rgba(255, 255, 255, 0.6)`);
                gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);
                gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
                gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.02)`);
            } else {
                gradient.addColorStop(0, `rgba(255, 255, 255, 0.15)`);
                gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`);
                gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.02)`);
            }

            // Draw main bubble
            ctx.beginPath();
            ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw rainbow edge/border
            ctx.beginPath();
            ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${isLight ? 0.25 : 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw highlight
            ctx.beginPath();
            ctx.arc(x - pulseRadius * 0.25, y - pulseRadius * 0.25, pulseRadius * 0.15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${isLight ? 0.5 : 0.3})`;
            ctx.fill();
        };

        let time = 0;

        const animate = () => {
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            if (isLight) {
                gradient.addColorStop(0, "#f8fafc");
                gradient.addColorStop(0.25, "#e0e7ff");
                gradient.addColorStop(0.5, "#fae8ff");
                gradient.addColorStop(0.75, "#ddd6fe");
                gradient.addColorStop(1, "#e0f2fe");
            } else {
                gradient.addColorStop(0, "#1e1b4b");
                gradient.addColorStop(0.4, "#0f172a");
                gradient.addColorStop(1, "#020617");
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw bubbles
            bubblesRef.current.forEach((bubble) => {
                // Move bubble
                bubble.x += bubble.vx;
                bubble.y += bubble.vy;

                // Bounce off edges with padding
                const padding = bubble.radius;
                if (bubble.x < padding || bubble.x > canvas.width - padding) {
                    bubble.vx *= -1;
                    bubble.x = Math.max(padding, Math.min(canvas.width - padding, bubble.x));
                }
                if (bubble.y < padding || bubble.y > canvas.height - padding) {
                    bubble.vy *= -1;
                    bubble.y = Math.max(padding, Math.min(canvas.height - padding, bubble.y));
                }

                drawBubble(bubble, time);
            });

            time += 0.02;
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
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

export default GlassBubbles;
