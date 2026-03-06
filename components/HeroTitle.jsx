"use client";
import React, { useState, useEffect } from 'react';

export default function HeroTitle() {
    const [activeAi, setActiveAi] = useState('l\'IA');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const aiNames = ['l\'IA', 'ChatGPT', 'Gemini', 'Claude', 'Perplexity'];
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                setIsVisible(false);
                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % aiNames.length;
                    setActiveAi(aiNames[currentIndex]);
                    setIsVisible(true);
                }, 300);
            }
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <span
            className={`inline-block transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            {activeAi}
        </span>
    );
}
