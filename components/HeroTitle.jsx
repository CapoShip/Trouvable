"use client";
import React, { useState, useEffect } from 'react';

export default function HeroTitle() {
    const [activeAi, setActiveAi] = useState('Gemini');

    useEffect(() => {
        const aiNames = ['Gemini', 'ChatGPT', 'Claude'];
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                currentIndex = (currentIndex + 1) % aiNames.length;
                setActiveAi(aiNames[currentIndex]);
            }
        }, 2500);

        const handleVisibilityChange = () => { };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 transition-all duration-500">
            {activeAi}
        </span>
    );
}
