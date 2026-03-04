"use client";
import React from 'react';

export default function ContactButton({ children, className, onClickProp }) {
    return (
        <button className={className} onClick={(e) => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openContactModal'));
            }
            if (onClickProp) onClickProp(e);
        }}>
            {children}
        </button>
    );
}
