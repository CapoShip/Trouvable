"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ContactButton from "@/components/ContactButton";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import GeoSeoInjector from "@/components/GeoSeoInjector";
import { SITE_URL } from "@/lib/site-config";
import { ArrowRight, Briefcase, Search, Layers, BookOpen, HelpCircle, ChevronDown, Target, Zap, Globe } from "lucide-react";

const TABS = [
    { id: "intents", label: "Requêtes", icon: Search },
    { id: "architecture", label: "Architecture", icon: Layers },
    { id: "precision", label: "Précision", icon: BookOpen },
];

function TabbedContent({ expertise }) {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="mx-auto max-w-[960px]">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-10">
                <div className="flex gap-1 overflow-x-auto pb-2">
                    {TABS.map((tab, i) => {
                        const TabIcon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(i)} className={`group relative flex items-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold whitespace-nowrap transition-all ${i === activeTab ? "text-white" : "text-white/30 hover:text-white/60"}`}>
                                {i === activeTab && <motion.div layoutId="expTab" className="absolute inset-0 rounded-xl border border-violet-500/25 bg-violet-500/[0.05]" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
                                <TabIcon className="relative z-10 h-4 w-4" style={{ color: i === activeTab ? "#a78bfa" : undefined }} />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    {activeTab === 0 && (
                        <div>
                            <h2 className="mb-3 text-xl font-bold tracking-[-0.02em]">L&apos;intention de recherche : {expertise.name}</h2>
                            <p className="mb-8 text-[14px] leading-[1.65] text-[#a0a0a0]">Requêtes formulées quotidiennement aux moteurs IA pour votre secteur :</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {expertise.searchIntents.map((intent, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, duration: 0.3 }} className="group flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.02]">
                                        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-400/50 group-hover:text-violet-400 transition-colors" />
                                        <span className="text-[13px] leading-[1.6] text-[#a0a0a0] italic group-hover:text-white/70 transition-colors">{intent}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 1 && (
                        <div>
                            <h2 className="mb-3 text-xl font-bold tracking-[-0.02em]">L&apos;architecture sémantique de votre offre</h2>
                            <p className="mb-8 text-[14px] leading-[1.65] text-[#a0a0a0]">Les axes de contenu que nous structurons pour les algorithmes :</p>
                            <div className="space-y-2.5">
                                {expertise.contentAngles.map((angle, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:border-[#5b73ff]/15 cursor-default">
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#5b73ff]/20 bg-[#5b73ff]/8 text-[11px] font-bold text-[#7b8fff]">{String(i + 1).padStart(2, "0")}</span>
                                        <span className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/70 transition-colors">{angle}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 2 && (
                        <div>
                            <h2 className="mb-3 text-xl font-bold tracking-[-0.02em]">Le niveau de précision documentaire exigé</h2>
                            <p className="mb-8 text-[14px] leading-[1.65] text-[#a0a0a0]">Les critères que nous appliquons pour que votre profil soit recommandé :</p>
                            <div className="space-y-3">
                                {expertise.useCases.map((uc, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:border-emerald-400/15 cursor-default">
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/8 text-[12px] font-bold text-emerald-400">{i + 1}</span>
                                        <span className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/70 transition-colors pt-1.5">{uc}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function SectionsContent({ expertise, composition }) {
    const sections = [
        {
            heading: composition.intentsHeading,
            icon: Search,
            iconColor: "text-violet-400",
            iconBorder: "border-violet-500/20",
            iconBg: "bg-violet-500/10",
            content: (
                <div className="grid gap-3 sm:grid-cols-2">
                    {expertise.searchIntents.map((intent, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.3 }} className="group flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all hover:border-violet-500/20 hover:bg-violet-500/[0.02]">
                            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-violet-400/50 group-hover:text-violet-400 transition-colors" />
                            <span className="text-[13px] leading-[1.6] text-[#a0a0a0] italic group-hover:text-white/70 transition-colors">{intent}</span>
                        </motion.div>
                    ))}
                </div>
            ),
        },
        {
            heading: composition.architectureHeading,
            icon: Layers,
            iconColor: "text-[#7b8fff]",
            iconBorder: "border-[#5b73ff]/20",
            iconBg: "bg-[#5b73ff]/10",
            content: (
                <div className="space-y-2.5">
                    {expertise.contentAngles.map((angle, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.3 }} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:border-[#5b73ff]/15 cursor-default">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#5b73ff]/20 bg-[#5b73ff]/8 text-[11px] font-bold text-[#7b8fff]">{String(i + 1).padStart(2, "0")}</span>
                            <span className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/70 transition-colors">{angle}</span>
                        </motion.div>
                    ))}
                </div>
            ),
        },
        {
            heading: composition.precisionHeading,
            icon: BookOpen,
            iconColor: "text-emerald-400",
            iconBorder: "border-emerald-400/20",
            iconBg: "bg-emerald-400/10",
            content: (
                <div className="space-y-3">
                    {expertise.useCases.map((uc, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.3 }} className="group flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:border-emerald-400/15 cursor-default">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/8 text-[12px] font-bold text-emerald-400">{i + 1}</span>
                            <span className="text-[14px] leading-[1.65] text-[#a0a0a0] group-hover:text-white/70 transition-colors pt-1.5">{uc}</span>
                        </motion.div>
                    ))}
                </div>
            ),
        },
    ];

    return (
        <div className="mx-auto max-w-[960px] space-y-20">
            {sections.map((section, i) => {
                const Icon = section.icon;
                return (
                    <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}>
                        <div className="mb-6 flex items-center gap-3">
                            <div className={`grid h-10 w-10 place-items-center rounded-xl border ${section.iconBorder} ${section.iconBg}`}>
                                <Icon className={`h-5 w-5 ${section.iconColor}`} />
                            </div>
                            <h2 className="text-xl font-bold tracking-[-0.02em]">{section.heading}</h2>
                        </div>
                        {section.content}
                    </motion.div>
                );
            })}
        </div>
    );
}

export default function ExpertisePageClient({ expertise, composition, linkedVilles }) {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <GeoSeoInjector service={expertise} faqs={expertise.faqs} breadcrumbs={[{ name: "Accueil", url: "/" }, { name: "Expertises", url: null }, { name: expertise.name, url: "/expertises/" + expertise.slug }]} baseUrl={SITE_URL} />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                {/* HERO — split with data panel */}
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-6 sm:pt-[110px]">
                    <div className="pointer-events-none absolute left-[-200px] top-[60px] h-[400px] w-[400px] bg-[radial-gradient(circle,rgba(147,51,234,0.06),transparent_70%)]" />
                    <div className="relative z-[1] mx-auto max-w-[1100px] grid gap-12 lg:grid-cols-[1fr_340px] items-end">
                        <div>
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-violet-300">
                                <Briefcase className="h-3.5 w-3.5" /> {composition.heroAngle}
                            </motion.div>
                            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.06 }} className="text-[clamp(36px,6vw,72px)] font-bold leading-[1.04] tracking-[-0.045em] mb-6">
                                <span className="bg-gradient-to-r from-[#5b73ff] to-[#a78bfa] bg-clip-text text-transparent">{expertise.name}</span>
                            </motion.h1>
                            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="max-w-[520px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                                {expertise.description}
                            </motion.p>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.22 }} className="mt-8 flex flex-wrap gap-3">
                                <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                    Diagnostic {expertise.name} <ArrowRight className="h-4 w-4" />
                                </ContactButton>
                                <Link href="/offres" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-[#a0a0a0] transition hover:border-white/30 hover:text-white">
                                    Nos mandats
                                </Link>
                            </motion.div>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:block relative rounded-2xl border border-violet-500/15 bg-[#0a0a0a] p-7 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-violet-500/40 to-transparent" />
                            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-400/50 mb-5">Périmètre d&apos;expertise</div>
                            <div className="space-y-3">
                                {expertise.contentAngles.slice(0, 4).map((angle, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-[12px] text-[#888]">
                                        <Target className="h-3 w-3 shrink-0 mt-0.5 text-violet-400/60" />
                                        <span className="line-clamp-2">{angle}</span>
                                    </div>
                                ))}
                            </div>
                            {expertise.contentAngles.length > 4 && (
                                <div className="mt-3 text-[11px] text-violet-400/40">+{expertise.contentAngles.length - 4} axes supplémentaires</div>
                            )}
                        </motion.div>
                    </div>
                </section>

                {/* MARKET CONTEXT */}
                {composition.marketContext && (
                    <section className="border-t border-white/[0.05] px-6 py-14 sm:px-10">
                        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mx-auto max-w-[800px] flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 sm:p-8">
                            <Globe className="mt-0.5 h-5 w-5 shrink-0 text-violet-400/60" />
                            <div>
                                <h2 className="mb-2 text-[15px] font-bold tracking-[-0.01em] text-white/90">Contexte de marché</h2>
                                <p className="text-[14px] leading-[1.7] text-[#a0a0a0]">{composition.marketContext}</p>
                            </div>
                        </motion.div>
                    </section>
                )}

                {/* CONTENT — tabs or sections based on composition */}
                <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
                    {composition.contentLayout === "sections" ? (
                        <SectionsContent expertise={expertise} composition={composition} />
                    ) : (
                        <TabbedContent expertise={expertise} />
                    )}
                </section>

                {/* FAQ */}
                <section className="border-t border-white/[0.05] bg-[#060606] px-6 py-20 sm:px-10">
                    <div className="mx-auto max-w-[800px]">
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10">
                            <div className="mb-3 flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-amber-400" />
                                <h2 className="text-xl font-bold tracking-[-0.02em]">Questions fréquentes — {expertise.name}</h2>
                            </div>
                        </motion.div>
                        <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
                            {expertise.faqs.map((faq, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                                    <details itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="group rounded-xl border border-white/7 bg-white/[0.02] transition hover:border-amber-400/15 [&_summary::-webkit-details-marker]:hidden">
                                        <summary itemProp="name" className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90 outline-none">
                                            <span>{faq.question}</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="px-5 pb-5 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                            <span itemProp="text">{faq.answer}</span>
                                        </div>
                                    </details>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* INTERNAL LINKS — villes */}
                {linkedVilles.length > 0 && (
                    <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
                        <div className="mx-auto max-w-[960px]">
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
                                <h2 className="text-xl font-bold tracking-[-0.02em]">{expertise.name} : nos marchés locaux</h2>
                            </motion.div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {linkedVilles.map((v, i) => (
                                    <motion.div key={v.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                                        <Link href={"/villes/" + v.slug} className="group flex items-center justify-between rounded-xl border border-white/7 bg-[#0a0a0a] p-5 transition-all hover:-translate-y-0.5 hover:border-violet-500/25 hover:bg-violet-500/[0.02]">
                                            <div>
                                                <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{v.name}</h3>
                                                <p className="mt-1 text-[11px] text-white/25">Visibilité IA locale</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-white/15 transition-all group-hover:translate-x-1 group-hover:text-violet-400" />
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA — composition-driven */}
                <section className="relative overflow-hidden border-t border-white/[0.05] bg-[#060606] px-6 py-28 sm:px-10">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.04),transparent_60%)]" />
                    <div className="relative z-10 mx-auto max-w-[660px] text-center">
                        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-5 text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.03em]">
                            {composition.ctaHeadline}
                        </motion.h2>
                        <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 }} className="mx-auto mb-10 max-w-md text-[15px] leading-[1.65] text-[#a0a0a0]">
                            {composition.ctaDescription}
                        </motion.p>
                        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.14 }} className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                            <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8] hover:shadow-[0_20px_60px_rgba(255,255,255,0.06)]">
                                Obtenir mon plan d&apos;action <ArrowRight className="h-4 w-4" />
                            </ContactButton>
                            <Link href={composition.ctaSecondaryHref} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-7 py-3.5 text-sm font-medium text-[#a0a0a0] transition hover:border-white/30 hover:text-white">
                                {composition.ctaSecondaryLabel}
                            </Link>
                        </motion.div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
