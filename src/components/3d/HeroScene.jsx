import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Html, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { useTheme } from "../ThemeContext";

// Enhanced Voting Box with shield and digital effects
const VotingConcept = ({ isLightMode }) => {
    const groupRef = useRef();
    const ballotRef = useRef();
    const shieldRef = useRef();
    const ringRef = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime;

        // Floating ballot animation
        if (ballotRef.current) {
            ballotRef.current.position.y = 0.8 + Math.sin(t * 1.5) * 0.15;
            ballotRef.current.rotation.z = Math.sin(t * 0.8) * 0.05;
        }

        // Shield pulse
        if (shieldRef.current) {
            const pulse = 0.95 + Math.sin(t * 2) * 0.05;
            shieldRef.current.scale.setScalar(pulse);
        }

        // Ring rotation
        if (ringRef.current) {
            ringRef.current.rotation.z = t * 0.3;
        }
    });

    // Theme-aware colors
    const boxColor = isLightMode ? "#4f46e5" : "#0f172a";
    const boxEmissive = isLightMode ? "#6366f1" : "#4f46e5";
    const wireframeColor = isLightMode ? "#4f46e5" : "#6366f1";

    const labelStyle = {
        color: isLightMode ? "#1e293b" : "white",
        fontSize: "11px",
        fontWeight: 600,
        textAlign: "center",
        pointerEvents: "none",
        textShadow: isLightMode ? "0 1px 3px rgba(255,255,255,0.8)" : "0 2px 10px rgba(0,0,0,0.8)",
        whiteSpace: "nowrap",
        background: isLightMode ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.5)",
        padding: "4px 8px",
        borderRadius: "6px",
    };

    const subLabelStyle = {
        color: isLightMode ? "#4f46e5" : "#94a3b8",
        fontSize: "9px",
        fontWeight: 500,
        marginTop: "2px",
    };

    return (
        <group ref={groupRef} position={[0, -0.3, 0]}>
            {/* Main Voting Box */}
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[1.3, 1.5, 1.8, 6]} />
                    <MeshDistortMaterial
                        color={boxColor}
                        emissive={boxEmissive}
                        emissiveIntensity={isLightMode ? 0.3 : 0.15}
                        roughness={0.1}
                        metalness={0.9}
                        distort={0.05}
                        speed={1}
                        transparent
                        opacity={isLightMode ? 0.95 : 0.9}
                    />
                </mesh>

                {/* Box slot */}
                <mesh position={[0, 0.95, 0]}>
                    <boxGeometry args={[0.8, 0.08, 0.15]} />
                    <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
                </mesh>

                {/* Slot Label */}
                <Html position={[0, 1.4, 0]} center style={labelStyle}>
                    <div>
                        <div style={{ color: "#22c55e" }}>🔐 Secure Slot</div>
                        <div style={subLabelStyle}>Encrypted Entry</div>
                    </div>
                </Html>

                {/* Glowing edges */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[1.35, 1.55, 1.85, 6]} />
                    <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={isLightMode ? 0.5 : 0.3} />
                </mesh>
            </Float>

            {/* Box Label */}
            <Html position={[-2.2, 0, 0]} center style={labelStyle}>
                <div>
                    <div style={{ color: isLightMode ? "#4f46e5" : "#a5b4fc" }}>📦 Ballot Box</div>
                    <div style={subLabelStyle}>Tamper-Proof</div>
                </div>
            </Html>

            {/* Security Shield */}
            <group ref={shieldRef} position={[0, 0, 1.55]}>
                <mesh>
                    <circleGeometry args={[0.4, 32]} />
                    <meshStandardMaterial
                        color={isLightMode ? "#6366f1" : "#4f46e5"}
                        emissive="#6366f1"
                        emissiveIntensity={isLightMode ? 0.4 : 0.5}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
                <mesh position={[0, 0, 0.01]}>
                    <circleGeometry args={[0.25, 32]} />
                    <meshBasicMaterial color="#22c55e" />
                </mesh>
                <Html position={[0, 0, 0.02]} center style={{ pointerEvents: "none" }}>
                    <div style={{ fontSize: "18px", color: "white" }}>✓</div>
                </Html>
                <Html position={[0, -0.75, 0]} center style={labelStyle}>
                    <div>
                        <div style={{ color: "#22c55e" }}>Verified</div>
                        <div style={subLabelStyle}>Cryptographic</div>
                    </div>
                </Html>
            </group>

            {/* Floating Ballot */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
                <group ref={ballotRef} position={[0, 0.8, 0.3]}>
                    <mesh>
                        <boxGeometry args={[0.9, 1.2, 0.06]} />
                        <meshStandardMaterial
                            color={isLightMode ? "#ffffff" : "#f8fafc"}
                            emissive="#22d3ee"
                            emissiveIntensity={0.1}
                            roughness={0.3}
                            metalness={0.1}
                        />
                    </mesh>
                    {[-0.3, -0.1, 0.1, 0.3].map((y, i) => (
                        <mesh key={i} position={[0, y, 0.035]}>
                            <boxGeometry args={[0.6, 0.04, 0.01]} />
                            <meshBasicMaterial color={i === 1 ? "#22c55e" : "#cbd5e1"} />
                        </mesh>
                    ))}
                    <mesh position={[-0.35, -0.1, 0.04]}>
                        <circleGeometry args={[0.06, 16]} />
                        <meshBasicMaterial color="#22c55e" />
                    </mesh>
                    <Html position={[0.95, 0, 0]} center style={labelStyle}>
                        <div>
                            <div style={{ color: "#0891b2" }}>📄 Your Vote</div>
                            <div style={subLabelStyle}>AES-256</div>
                        </div>
                    </Html>
                </group>
            </Float>

            {/* Rotating ring */}
            <mesh ref={ringRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2, 0.02, 16, 64]} />
                <meshBasicMaterial color={isLightMode ? "#6366f1" : "#4f46e5"} transparent opacity={isLightMode ? 0.6 : 0.5} />
            </mesh>

            <Html position={[2.3, 0.3, 0]} center style={labelStyle}>
                <div>
                    <div style={{ color: isLightMode ? "#4f46e5" : "#818cf8" }}>🔄 Blockchain</div>
                    <div style={subLabelStyle}>Immutable</div>
                </div>
            </Html>

            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.3, 0.01, 16, 64]} />
                <meshBasicMaterial color="#22c55e" transparent opacity={isLightMode ? 0.4 : 0.3} />
            </mesh>

            <Sparkles
                count={30}
                scale={4}
                size={2}
                speed={0.3}
                color={isLightMode ? "#4f46e5" : "#6366f1"}
                opacity={isLightMode ? 0.4 : 0.6}
            />
        </group>
    );
};

const HeroScene = () => {
    const { theme } = useTheme();
    const isLightMode = theme === "light";

    return (
        <div style={{ height: "480px", width: "100%", position: "relative" }}>
            <Canvas
                camera={{ position: [0, 0.5, 5.5], fov: 50 }}
                dpr={[1, 1.5]}
                gl={{
                    powerPreference: "high-performance",
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: false,
                }}
            >
                {/* Theme-aware lighting */}
                <ambientLight intensity={isLightMode ? 0.9 : 0.6} />
                <pointLight position={[5, 5, 5]} intensity={isLightMode ? 2 : 1.5} color="#6366f1" />
                <pointLight position={[-5, 3, 5]} intensity={isLightMode ? 1.5 : 1} color="#22c55e" />
                <pointLight position={[0, -3, 3]} intensity={isLightMode ? 0.8 : 0.5} color="#22d3ee" />

                <VotingConcept isLightMode={isLightMode} />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.5}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.8}
                />
            </Canvas>

            {/* Interaction hint */}
            <div style={{
                position: "absolute",
                bottom: "15px",
                left: "50%",
                transform: "translateX(-50%)",
                color: isLightMode ? "#64748b" : "#64748b",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                pointerEvents: "none",
                background: isLightMode ? "rgba(255,255,255,0.7)" : "transparent",
                padding: "4px 10px",
                borderRadius: "12px",
            }}>
                <span style={{ opacity: 0.8 }}>🖱️</span>
                Click and drag to rotate
            </div>

            {/* Bottom gradient - theme aware */}
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60px",
                background: isLightMode
                    ? "linear-gradient(transparent, rgba(240, 244, 255, 0.95))"
                    : "linear-gradient(transparent, rgba(2, 6, 23, 0.95))",
                pointerEvents: "none",
            }} />
        </div>
    );
};

export default HeroScene;
