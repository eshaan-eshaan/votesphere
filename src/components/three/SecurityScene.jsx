import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../ThemeContext";

// Blockchain-style connected blocks with mouse interactivity
const BlockchainNetwork = ({ mousePosition, isLightMode }) => {
    const groupRef = useRef();
    const blocksRef = useRef([]);
    const [hoveredBlock, setHoveredBlock] = useState(null);

    const blockData = useMemo(() => {
        const blocks = [
            { label: "Identity", desc: "Voter Check", color: isLightMode ? "#4f46e5" : "#3b82f6" },
            { label: "Encrypt", desc: "RSA-2048", color: "#6366f1" },
            { label: "Vote", desc: "Sealed", color: "#22c55e" },
            { label: "Ledger", desc: "Hash Chain", color: "#6366f1" },
            { label: "Audit", desc: "Verify", color: isLightMode ? "#4f46e5" : "#3b82f6" },
        ];

        const spacing = 1.6;
        return blocks.map((block, i) => ({
            ...block,
            x: (i - 2) * spacing,
            y: 0,
            z: 0,
            scale: i === 2 ? 1.1 : 0.85
        }));
    }, [isLightMode]);

    useFrame(() => {
        if (groupRef.current && mousePosition) {
            const targetRotationY = mousePosition.x * 0.3;
            const targetRotationX = mousePosition.y * 0.1;
            groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.05;
            groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.05;
        }

        blocksRef.current.forEach((block, i) => {
            if (block) {
                const time = Date.now() * 0.001;
                block.position.y = blockData[i].y + Math.sin(time * 1.2 + i * 0.5) * 0.08;
                block.rotation.y += 0.003;
            }
        });
    });

    const labelStyle = {
        color: isLightMode ? "#1e293b" : "white",
        fontSize: "11px",
        fontWeight: 500,
        textAlign: "center",
        pointerEvents: "none",
        textShadow: isLightMode ? "0 1px 2px rgba(255,255,255,0.8)" : "0 2px 8px rgba(0,0,0,0.8)",
        background: isLightMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)",
        padding: "4px 8px",
        borderRadius: "6px",
    };

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {blockData.map((block, i) => (
                <group key={i} position={[block.x, block.y, block.z]}>
                    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.1}>
                        <mesh
                            ref={(el) => (blocksRef.current[i] = el)}
                            scale={block.scale}
                            onPointerEnter={() => setHoveredBlock(i)}
                            onPointerLeave={() => setHoveredBlock(null)}
                        >
                            <boxGeometry args={[0.55, 0.55, 0.55]} />
                            <meshStandardMaterial
                                color={hoveredBlock === i ? "#22d3ee" : block.color}
                                emissive={hoveredBlock === i ? "#22d3ee" : block.color}
                                emissiveIntensity={hoveredBlock === i ? 0.6 : isLightMode ? 0.4 : 0.25}
                                metalness={0.6}
                                roughness={0.35}
                                transparent
                                opacity={0.95}
                            />
                        </mesh>
                        <mesh scale={block.scale * 1.06}>
                            <boxGeometry args={[0.55, 0.55, 0.55]} />
                            <meshBasicMaterial
                                color={hoveredBlock === i ? "#22d3ee" : isLightMode ? "#6366f1" : "#a5b4fc"}
                                wireframe
                                transparent
                                opacity={hoveredBlock === i ? 0.6 : isLightMode ? 0.5 : 0.25}
                            />
                        </mesh>
                    </Float>

                    <Html position={[0, -0.7, 0]} center style={labelStyle}>
                        <div>
                            <div>{block.label}</div>
                            <div style={{ fontSize: "9px", color: isLightMode ? "#64748b" : "#94a3b8", marginTop: "2px" }}>{block.desc}</div>
                        </div>
                    </Html>
                </group>
            ))}

            {blockData.slice(0, -1).map((block, i) => {
                const nextBlock = blockData[i + 1];
                const points = [
                    new THREE.Vector3(block.x + 0.35, block.y, 0),
                    new THREE.Vector3(nextBlock.x - 0.35, nextBlock.y, 0),
                ];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                return (
                    <line key={`connector-${i}`} geometry={geometry}>
                        <lineBasicMaterial color="#22c55e" transparent opacity={isLightMode ? 0.6 : 0.4} />
                    </line>
                );
            })}

            <mesh position={[0, 0, -1]} scale={4}>
                <circleGeometry args={[1, 32]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={isLightMode ? 0.1 : 0.05} />
            </mesh>

            <Sparkles
                count={20}
                scale={4}
                size={2}
                speed={0.3}
                color={isLightMode ? "#4f46e5" : "#6366f1"}
                opacity={isLightMode ? 0.5 : 0.6}
            />
        </group>
    );
};

const MouseTracker = ({ setMousePosition }) => {
    React.useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            setMousePosition({ x, y });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [setMousePosition]);
    return null;
};

const SecurityScene = () => {
    const { theme } = useTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const isLightMode = theme === "light";

    return (
        <div style={{ height: "280px", width: "100%", position: "relative" }}>
            <Canvas
                camera={{ position: [0, 0.3, 4.5], fov: 50 }}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "low-power",
                    failIfMajorPerformanceCaveat: true
                }}
                dpr={[1, 1.5]}
                style={{ background: "transparent" }}
            >
                <ambientLight intensity={isLightMode ? 0.8 : 0.5} />
                <pointLight position={[5, 3, 5]} intensity={isLightMode ? 1.5 : 1} color="#6366f1" />
                <pointLight position={[-5, -3, 5]} intensity={isLightMode ? 0.8 : 0.5} color="#22c55e" />
                <MouseTracker setMousePosition={setMousePosition} />
                <BlockchainNetwork mousePosition={mousePosition} isLightMode={isLightMode} />
            </Canvas>

            <div style={{
                position: "absolute",
                bottom: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                color: isLightMode ? "#475569" : "#64748b",
                fontSize: "11px",
                pointerEvents: "none",
                background: isLightMode ? "rgba(255,255,255,0.8)" : "transparent",
                padding: "4px 10px",
                borderRadius: "8px",
            }}>
                ↔ Move cursor to interact
            </div>

            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "30px",
                background: isLightMode
                    ? "linear-gradient(transparent, rgba(224, 231, 255, 0.9))"
                    : "linear-gradient(transparent, rgba(2, 6, 23, 0.9))",
                pointerEvents: "none"
            }} />
        </div>
    );
};

export default SecurityScene;
