"use client";
import React from 'react';

export default function ContactButton({ children, className, onClickProp, ...rest }) {
    return (
        <button
            type="button"
            className={`font-sans appearance-none ${className || ''}`}
            data-agent-action={rest['data-agent-action'] || 'open-contact-modal'}
            onClick={(e) => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openContactModal'));
            }
            if (onClickProp) onClickProp(e);
        }}
            {...rest}
        >
            {children}
        </button>
    );
}
