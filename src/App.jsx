import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';

const MAX_PARTICLES = 5000;

function getTextPositions(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Background (Black)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Text setup
    ctx.font = 'bold 45px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrapping Text
    const words = text.split(' ');
    let line = '';
    const lines = [];
    
    // Better word wrapping
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width * 0.9 && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Vertically center the text block
    const lineHeight = 55;
    const totalHeight = lines.length * lineHeight;
    let y = (canvas.height - totalHeight) / 2 + (lineHeight / 2);
    
    lines.forEach(l => {
        ctx.fillText(l.trim(), canvas.width / 2, y);
        y += lineHeight;
    });

    // Sample Pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const points = [];
    
    // Map Canvas pixels to 3D Space centered around 0,0
    for (let py = 0; py < canvas.height; py += 4) {
        for (let px = 0; px < canvas.width; px += 4) {
            const index = (px + py * canvas.width) * 4;
            // If the pixel is not black (r > 128)
            if (data[index] > 128) {
                // Map to -2.5 to 2.5
                const x = (px / canvas.width - 0.5) * 5;
                const y = -(py / canvas.height - 0.5) * 5; 
                points.push({ x, y, z: (Math.random() - 0.5) * 0.2 });
            }
        }
    }
    return points;
}

function ParticleCloud({ color, speed, shapeType, replyText }) {
    const ref = useRef();
    
    // Current positions holding state
    const currentPositions = useRef(new Float32Array(MAX_PARTICLES * 3));
    
    // Target positions to lerp towards
    const targetPositions = useMemo(() => {
        const positions = new Float32Array(MAX_PARTICLES * 3);
        
        if (shapeType === 'text' && replyText) {
            const textPoints = getTextPositions(replyText);
            const ptCount = textPoints.length;
            
            for (let i = 0; i < MAX_PARTICLES; i++) {
                // If we have text points, map particles to them (wrap around if less points than particles)
                if (ptCount > 0) {
                    const pt = textPoints[i % ptCount];
                    positions[i * 3] = pt.x;
                    positions[i * 3 + 1] = pt.y;
                    positions[i * 3 + 2] = pt.z;
                } else {
                    positions[i * 3] = 0; 
                    positions[i * 3 + 1] = 0; 
                    positions[i * 3 + 2] = 0;
                }
            }
        }
        else if (shapeType === 'box') {
            for (let i = 0; i < MAX_PARTICLES; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 2.5;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
            }
        } else if (shapeType === 'torus') {
            for (let i = 0; i < MAX_PARTICLES; i++) {
                const u = Math.random() * Math.PI * 2;
                const v = Math.random() * Math.PI * 2;
                const r1 = 1.0; 
                const r2 = 0.4; 
                positions[i * 3] = (r1 + r2 * Math.cos(v)) * Math.cos(u);
                positions[i * 3 + 1] = (r1 + r2 * Math.cos(v)) * Math.sin(u);
                positions[i * 3 + 2] = r2 * Math.sin(v);
            }
        } else {
            // Default Sphere
            random.inSphere(positions, { radius: 1.2 });
        }
        return positions;
    }, [shapeType, replyText]);

    // Initial assignment
    useEffect(() => {
        for(let i=0; i < MAX_PARTICLES * 3; i++){
            currentPositions.current[i] = targetPositions[i];
        }
    }, []);

    useFrame((state, delta) => {
        if (shapeType !== 'text') {
            ref.current.rotation.x -= delta / 10;
            ref.current.rotation.y -= delta / 15;
            ref.current.rotation.z += delta / 20;
        } else {
            // Smoothly reset rotation for text readability
            ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 0.05);
            ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, 0, 0.05);
            ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 0.05);
        }

        // Lerp positions towards target
        const positions = ref.current.geometry.attributes.position.array;
        for(let i=0; i < MAX_PARTICLES * 3; i++) {
            positions[i] = THREE.MathUtils.lerp(positions[i], targetPositions[i], 0.05);
        }
        ref.current.geometry.attributes.position.needsUpdate = true;

        // "Breathing" and speed effect
        const speedValue = speed === 'Fast' ? 2 : speed === 'Slow' ? 0.2 : speed === 'Gentle' ? 0.5 : speed === 'Idle' ? 0.1 : 1;
        ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * speedValue) * 0.1);
        
        // Smooth color change
        ref.current.material.color.lerp(new THREE.Color(color), 0.05);
    });

    return (
        <Points ref={ref} positions={currentPositions.current} stride={3} frustumCulled={false}>
            <PointMaterial transparent color={color} size={0.02} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
        </Points>
    );
}

export default function App() {
    const [text, setText] = useState("Click 'Start Listening' or Type below!");
    const [color, setColor] = useState("#ffffff");
    const [speed, setSpeed] = useState("Idle");
    const [shapeType, setShapeType] = useState("sphere");
    const [replyText, setReplyText] = useState("");
    const [isListening, setIsListening] = useState(false);
    
    // Keyboard Input State
    const [chatInput, setChatInput] = useState("");

    const askGemini = async (userText) => {
        try {
            setText(`You: "${userText}"`);
            
            const backendUrl = "/api/analyzeMood";

            const response = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: userText })
            });

            if (!response.ok) {
                let errorMsg = "Could not reach backend. ";
                try {
                    const errorData = await response.json();
                    errorMsg += errorData.error || response.statusText;
                } catch(e) {
                    errorMsg += response.statusText;
                }
                alert("API Error: " + errorMsg);
                return;
            }

            const data = await response.json();

            if (data.error) {
                alert("BACKEND ERROR: " + data.error);
                return;
            }

            setColor(data.mood_color || "#ffffff");
            setSpeed(data.particle_speed || 0.5);
            setShapeType(data.shape_type || "text"); // Default text if AI omits it
            if (data.reply) {
                setReplyText(data.reply);
            }

        } catch (error) {
            console.error(error);
            alert("Network Error: Could not reach backend.");
        }
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if(!chatInput.trim()) return;
        askGemini(chatInput);
        setChatInput("");
    };

    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Please use Chrome browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            askGemini(transcript);
        };

        recognition.start();
    };

    return (
        <div style={{ width: "100vw", height: "100vh", background: "#000000", margin: 0, padding: 0, position: 'fixed', top: 0, left: 0 }}>
            <Canvas camera={{ position: [0, 0, 3] }}>
                <color attach="background" args={['#000000']} />
                <ParticleCloud color={color} speed={speed} shapeType={shapeType} replyText={replyText} />
            </Canvas>

            {/* Display Spoken / Typed Prompt */}
            <div style={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', color: '#aaaaaa', pointerEvents: 'none', width: '80%' }}>
                <h3 style={{ fontFamily: 'sans-serif', fontSize: '1.2rem', fontWeight: 'normal' }}>{text}</h3>
            </div>

            {/* Clearly Readable HTML Overlay for the AI Reply */}
            {replyText && (
                <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none', width: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '20px 40px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: `1px solid ${color}44` }}>
                        <h2 style={{ fontFamily: '"Inter", sans-serif', fontSize: '2rem', fontWeight: '300', color: color, margin: 0, textShadow: '0 0 15px rgba(0,0,0,0.8)' }}>
                            {replyText}
                        </h2>
                    </div>
                </div>
            )}

            {/* Input Controls */}
            <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', width: '90%', maxWidth: '500px' }}>
                
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', width: '100%', gap: '10px' }}>
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type something to the Soul..."
                        style={{ flex: 1, padding: '12px 20px', borderRadius: '25px', border: 'none', outline: 'none', fontSize: '1rem', background: '#222', color: 'white' }}
                    />
                    <button type="submit" style={{ padding: '12px 25px', borderRadius: '25px', border: 'none', background: '#444', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                        Send
                    </button>
                </form>

                <div style={{color: '#666'}}>OR</div>

                <button
                    onClick={startListening}
                    style={{ padding: '15px 40px', fontSize: '1.1rem', cursor: 'pointer', borderRadius: '50px', border: 'none', background: 'white', color: 'black', fontWeight: 'bold', width: '100%' }}
                >
                    {isListening ? "Listening..." : "Start Voice Input"}
                </button>
            </div>
        </div>
    );
}
