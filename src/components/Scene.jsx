import React from 'react';
import { ParticleSphere } from './ParticleSphere';

export const Scene = ({ moodData, isListening }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <ParticleSphere moodData={moodData} isListening={isListening} />
        </>
    );
};
