"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqAccordion({ faqs }) {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="space-y-4">
            {faqs.map((faq, i) => (
                <div key={i} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300">
                    <button
                        className="w-full px-8 py-6 text-left font-bold text-white flex justify-between items-center transition-colors group"
                        onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    >
                        <span className="text-lg tracking-tight">{faq.question}</span>
                        <div className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}>
                            <ChevronDown className="text-white/20 group-hover:text-white/40" size={20} />
                        </div>
                    </button>
                    {openFaq === i && (
                        <div className="px-8 pb-8 transition-all animate-fade-up">
                            <div className="divider-h opacity-10 mb-6"></div>
                            <p className="text-white/40 leading-relaxed text-[15px] max-w-2xl font-medium">
                                {faq.answer}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
