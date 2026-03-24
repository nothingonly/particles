import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleCloud({ color, mood }) {
    const ref = useRef();
    const count = 5000;
    
    // Create initial positions array
    const [positions] = useState(() => new Float32Array(count * 3));

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        const time = state.clock.elapsedTime;
        const positionsArray = ref.current.geometry.attributes.position.array;
        
        // High-performance Casberry math integration (ZERO GARBAGE COLLECTION)
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            if (mood === 'neutral') {
                // Casberry Sphere Formation
                const r = 1.2 + Math.sin(time * 0.5) * 0.05; 
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi + time * 0.1;
                
                positionsArray[i3] = r * Math.cos(theta) * Math.sin(phi);
                positionsArray[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
                positionsArray[i3 + 2] = r * Math.cos(phi);
            } 
            else if (mood === 'angry') {
                // Chaotic Swarm
                const scale = 2;
                const angle = i * 0.1 + time * 2;
                const noise = Math.sin(i * 100 + time) * 0.5;
                
                positionsArray[i3] = Math.cos(angle) * scale * Math.sin(i) + noise;
                positionsArray[i3 + 1] = Math.sin(angle) * scale * Math.cos(i) + noise;
                positionsArray[i3 + 2] = (i % 100) * 0.05 - 2.5 + noise;
            }
            else if (mood === 'happy') {
                // Torus Formation
                const R = 1.0;
                const r = 0.4;
                const u = (i / count) * Math.PI * 2 * 10;
                const v = (i / count) * Math.PI * 2 * 100 + time;
                
                positionsArray[i3] = (R + r * Math.cos(v)) * Math.cos(u);
                positionsArray[i3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
                positionsArray[i3 + 2] = r * Math.sin(v);
            }
            else if (mood === 'sad') {
                // Droplets
                const x = Math.sin(i * 123) * 2;
                const z = Math.cos(i * 321) * 2;
                let startY = (i % 100) * 0.05; 
                let currentY = ((startY - time * 0.5) % 4) + 2; 
                
                positionsArray[i3] = x;
                positionsArray[i3 + 1] = currentY;
                positionsArray[i3 + 2] = z;
            }
            else if (mood === 'love') {
                // Heart beat
                const t = (i / count) * Math.PI * 2;
                const beat = 0.1 + Math.sin(time * 4) * 0.02; // Beating speed
                const x = 16 * Math.pow(Math.sin(t), 3);
                const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
                
                const noiseX = Math.sin(i * 10) * 0.1;
                const noiseY = Math.cos(i * 10) * 0.1;
                const noiseZ = Math.sin(i * 20) * 0.3;
                
                positionsArray[i3] = (x * beat) + noiseX;
                positionsArray[i3 + 1] = (y * beat) + noiseY;
                positionsArray[i3 + 2] = noiseZ;
            }
        }
        ref.current.geometry.attributes.position.needsUpdate = true;
        
        // Smooth rotation
        ref.current.rotation.x -= delta * 0.1;
        ref.current.rotation.y += delta * 0.15;

        // Smoothly change color
        ref.current.material.color.lerp(new THREE.Color(color), 0.05);
    });

    return (
        <group rotation={[0, 0, Math.PI / 8]}>
            <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color={color}
                    size={0.025}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
        </group>
    );
}

export function ParticleSphere() {
    const [text, setText] = useState("Click to Speak");
    const [color, setColor] = useState("#88CCFF");
    const [mood, setMood] = useState("neutral");
    const [isListening, setIsListening] = useState(false);

    const askGemini = async (userText) => {
        try {
            console.log("Analyzing mood via Vercel api...");
            setText("...");

            const response = await fetch('/api/analyzeMood', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: userText })
            });

            const data = await response.json();

            if (data.error) {
                alert("API ERROR: " + data.error);
                return;
            }

            setColor(data.hex);
            setMood(data.mood);
            
            // Show the AI's response if available, else keep the transcript
            if (data.reply) {
                setText(data.reply);
            } else {
                setText(userText);
            }

        } catch (error) {
            console.error(error);
            setText("Error connecting to soul.");
        }
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Use Chrome browser for Speech.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setText(transcript);
            askGemini(transcript);
        };

        recognition.start();
    };

    return (
        <div style={{ width: "100vw", height: "100vh", background: "#050510", overflow: "hidden" }}>

            <Canvas camera={{ position: [0, 0, 4] }}>
                <color attach="background" args={['#050510']} />
                <ambientLight intensity={0.5} />
                <ParticleCloud color={color} mood={mood} />
            </Canvas>

            <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: 'white', pointerEvents: 'none', width: '80%', maxWidth: '600px' }}>
                <h1 style={{ fontFamily: '"Inter", sans-serif', fontSize: '2.5rem', fontWeight: 300, letterSpacing: '2px', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>{text}</h1>
            </div>

            <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)' }}>
                <button
                    onClick={startListening}
                    style={{ 
                        padding: '16px 40px', 
                        fontSize: '1.2rem', 
                        cursor: 'pointer', 
                        borderRadius: '50px', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        background: isListening ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', 
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        transition: '0.3s',
                        letterSpacing: '1px'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseOut={(e) => e.target.style.background = isListening ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
                >
                    {isListening ? "Listening to your soul..." : "Speak to the Void"}
                </button>
            </div>
        </div>
    );
}