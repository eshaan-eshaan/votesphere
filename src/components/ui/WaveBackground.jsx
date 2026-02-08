import React, { useRef, useEffect } from "react";
import { useTheme } from "../ThemeContext";

const WaveBackground = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();
    const animationRef = useRef(null);

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

        // Wave colors for light mode
        const waveColors = isLight ? [
            { color: "rgba(99, 102, 241, 0.15)", offset: 0 },      // Indigo
            { color: "rgba(139, 92, 246, 0.12)", offset: 30 },     // Purple
            { color: "rgba(34, 211, 238, 0.10)", offset: 60 },     // Cyan
            { color: "rgba(52, 211, 153, 0.08)", offset: 90 },     // Teal
        ] : [
            { color: "rgba(99, 102, 241, 0.3)", offset: 0 },
            { color: "rgba(139, 92, 246, 0.25)", offset: 30 },
            { color: "rgba(34, 211, 238, 0.2)", offset: 60 },
            { color: "rgba(52, 211, 153, 0.15)", offset: 90 },
        ];

        const drawWave = (yOffset, amplitude, frequency, speed, color) => {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            for (let x = 0; x <= canvas.width; x += 5) {
                const y = canvas.height - yOffset +
                    Math.sin((x * frequency) + (time * speed)) * amplitude +
                    Math.sin((x * frequency * 0.5) + (time * speed * 0.8)) * (amplitude * 0.5);
                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        };

        const animate = () => {
            // Clear with gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            if (isLight) {
                gradient.addColorStop(0, "#f0f4ff");
                gradient.addColorStop(0.3, "#e0e7ff");
                gradient.addColorStop(0.6, "#ddd6fe");
                gradient.addColorStop(1, "#e0e7ff");
            } else {
                gradient.addColorStop(0, "#1e1b4b");
                gradient.addColorStop(0.4, "#0f172a");
                gradient.addColorStop(1, "#020617");
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw waves from back to front
            waveColors.forEach((wave, i) => {
                const yOffset = 100 + (i * 80);
                const amplitude = 30 + (i * 10);
                const frequency = 0.003 - (i * 0.0005);
                const speed = 0.8 + (i * 0.2);
                drawWave(yOffset, amplitude, frequency, speed, wave.color);
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

export default WaveBackground;
