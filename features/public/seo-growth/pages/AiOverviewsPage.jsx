'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Layers, LayoutList, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import ContactButton from '@/features/public/shared/ContactButton';
import { FaqSection, LinksSection, CtaSection } from './shared-primitives';

export default function AiOverviewsPage({ page }) {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const op = useTransform(scrollYProgress, [0, 1], [1, 0]);
    return (<>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.07),transparent_50%),#080810]" />
        <main>
            <motion.section ref={heroRef} style={{ opacity: op }} className="relative mt-[58px] overflow-hidden px-6 pb-24 pt-[82px] sm:px-10 sm:pt-[112px]">
                {/* Stacking cards animation */}
                <div className="pointer-events-none absolute right-[5%] top-[100px] hidden lg:block">
                    {[0,1,2].map(i => <motion.div key={i} initial={{ opacity: 0, y: 40, rotate: -3 + i * 3 }} animate={{ opacity: 0.15 - i * 0.03, y: 0 }} transition={{ delay: 0.5 + i * 0.2 }} className="absolute rounded-xl border border-indigo-400/15 bg-indigo-400/[0.04]" style={{ width: 280 - i * 20, height: 120, right: i * 15, top: i * 20 }} />)}
                </div>
                <div className="relative z-[1] mx-auto max-w-[960px]">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300"><Layers className="h-3.5 w-3.5" /> {page.eyebrow}</motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="max-w-[700px] text-[clamp(36px,6vw,72px)] font-bold leading-[1.04] tracking-[-0.045em]"><span className="bg-gradient-to-r from-indigo-200 via-white to-indigo-200/60 bg-clip-text text-transparent">{page.h1}</span></motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-7 max-w-[680px] text-[17px] leading-[1.7] text-[#a8a8a8]">{page.summary}</motion.p>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3.5 text-sm font-semibold text-white hover:-translate-y-px hover:bg-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition">{page.ctaLabel} <ArrowRight className="h-4 w-4" /></ContactButton>
                        {page.secondaryCta && <Link href={page.secondaryCta.href} className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/20 px-6 py-3.5 text-sm font-medium text-indigo-300/70 hover:border-indigo-400/40 hover:text-indigo-200 transition">{page.secondaryCta.label}</Link>}
                    </motion.div>
                </div>
            </motion.section>
            <section className="border-t border-indigo-400/[0.06] bg-[#060610] px-6 py-16 sm:px-10">
                <div className="mx-auto max-w-[960px]">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-indigo-400/12 bg-indigo-400/[0.02] p-6 sm:p-8">
                        <div className="mb-4 flex items-center gap-3"><LayoutList className="h-5 w-5 text-indigo-400" /><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-400/70">AI Overviews expliqué</span></div>
                        <p className="text-[16px] leading-[1.75] text-white/80">{page.definition}</p>
                        <div className="mt-6 rounded-lg border border-indigo-400/8 bg-[#0a0a10] p-5"><p className="text-[15px] leading-[1.7] text-[#a8a8a8]">{page.clientProblem}</p></div>
                    </motion.div>
                </div>
            </section>
            {/* Stacked expanding panels */}
            <section className="border-t border-indigo-400/[0.06] px-6 py-20 sm:px-10">
                <div className="mx-auto max-w-[960px] space-y-4">
                    {[{ t: 'Failles identifiées', items: page.problems, icon: AlertTriangle, c: 'text-red-400', bg: 'hover:border-red-400/20', dc: 'bg-red-400' },
                      { t: 'Stratégie de correction', items: page.corrections, icon: Wrench, c: 'text-indigo-400', bg: 'hover:border-indigo-400/20', dc: 'bg-indigo-400' },
                      { t: 'Livrables contractuels', items: page.deliverables, icon: CheckCircle2, c: 'text-emerald-400', bg: 'hover:border-emerald-400/20', dc: 'bg-emerald-400' }
                    ].map((s, si) => (
                        <motion.details key={s.t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: si * 0.1 }} className={`group rounded-2xl border border-white/8 bg-[#0a0a0a] ${s.bg} transition [&_summary::-webkit-details-marker]:hidden`} open={si === 0}>
                            <summary className="flex cursor-pointer items-center gap-4 px-6 py-5">
                                <s.icon className={`h-5 w-5 ${s.c}`} />
                                <h3 className="text-[16px] font-bold flex-1">{s.t}</h3>
                                <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/30">{s.items.length}</span>
                                <ArrowRight className="h-4 w-4 text-white/20 transition group-open:rotate-90" />
                            </summary>
                            <div className="border-t border-white/5 px-6 py-5 grid gap-3 sm:grid-cols-2">
                                {s.items.map((item, i) => <div key={item} className="flex items-start gap-2.5 text-[13px] leading-[1.65] text-[#a8a8a8]"><div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.dc}`} />{item}</div>)}
                            </div>
                        </motion.details>
                    ))}
                </div>
            </section>
            <section className="border-t border-indigo-400/[0.06] bg-[#060610] px-6 py-20 sm:px-10"><FaqSection faqs={page.faqs} accent="indigo" heading="Questions sur AI Overviews" /></section>
            <section className="border-t border-indigo-400/[0.06] px-6 py-20 sm:px-10"><LinksSection links={page.internalLinks} accent="indigo" heading="Explorer plus loin" /></section>
            <section className="relative overflow-hidden border-t border-indigo-400/[0.06] bg-[#060610] px-6 py-24 sm:px-10"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_55%)]" /><CtaSection page={page} accent="indigo" headline="Apparaître dans les AI Overviews de Google." icon={Layers} /></section>
        </main>
    </>);
}

