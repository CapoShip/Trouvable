"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqAccordion({ faqs }) {
    const [openFaq, setOpenFaq] = useState(0);

    return (
        <div className="space-y-4">
            {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                    <button className="w-full px-6 py-5 text-left font-bold text-slate-800 flex justify-between items-center hover:bg-slate-100 transition-colors"
                        onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                        {faq.question}
                        {openFaq === i ? <ChevronUp className="text-orange-600 flex-shrink-0" /> : <ChevronDown className="text-slate-400 flex-shrink-0" />}
                    </button>
                    {openFaq === i && (
                        <div className="px-6 pb-5 text-slate-600 border-t border-slate-100 pt-4 bg-white animate-fade-in">{faq.answer}</div>
                    )}
                </div>
            ))}
        </div>
    );
}
