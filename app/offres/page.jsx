import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, Search, ShieldCheck, TrendingUp, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Mandats de visibilité | Trouvable',
    description: 'Trois mandats : cartographie stratégique, implémentation encadrée, pilotage continu. Visibilité Google et réponses IA, exécutée par notre équipe.',
};

const mandates = [
    {
        id: 'cartographie-strategique',
        icon: Search,
        iconClass: 'text-[#5b73ff]',
        borderClass: 'border-white/10',
        highlight: false,
        name: 'Cartographie stratégique',
        subtitle: 'Un constat net sur votre visibilité Google et votre crédibilité dans les réponses IA — avant tout investissement d\'exécution.',
        forWho: 'Dirigeants et équipes direction qui veulent trancher sur des faits, pas sur des impressions.',
        when: 'Reprise en main, refonte, baisse d\'appels entrants, arbitrage budgétaire ou cadrage avant mandat.',
        weDo: 'Lecture croisée de vos signaux publics, scénarios de recherche sur votre marché, hiérarchisation des causes (Google local, recherche organique, cohérence face aux systèmes conversationnels).',
        youGet: 'Synthèse direction, plan d\'action priorisé, risques et critères de succès alignés sur notre cadre de mesure.',
        outcome: 'Décision claire : quoi corriger en premier, pourquoi, et dans quel ordre — base pour chiffrer la phase d\'exécution.',
        bullets: [
            'Écart entre votre discours commercial et ce que les systèmes retiennent',
            'Priorités : cohérence des données publiques, fondations, preuves locales',
            'Feuille de route exploitable, sans engagement de suite',
            'Points de contrôle pour mesurer l\'impact ensuite',
        ],
        cta: 'Demander une cartographie',
        secondary: { href: '/notre-mesure', label: 'Voir notre cadre de mesure' },
    },
    {
        id: 'mandat-implementation',
        icon: ShieldCheck,
        iconClass: 'text-emerald-400',
        borderClass: 'border-[#5b73ff]/40',
        highlight: true,
        name: 'Mandat d\'implémentation',
        subtitle: 'Nous exécutons les corrections et enrichissements sur un périmètre défini : vous validez les points sensibles convenus, nous déployons.',
        forWho: 'Organisations sans bande passante interne, ou sortie d\'une cartographie / diagnostic externe à passer en production.',
        when: 'Après cartographie Trouvable ou lorsque le diagnostic existe déjà et doit être mis en œuvre proprement.',
        weDo: 'Mise aux normes des informations publiques, rédactionnel et structuration attendus par les moteurs, intégrations sans fragiliser l\'existant, contrôle qualité et preuve de ce qui a été appliqué.',
        youGet: 'Livrables documentés (contenus, schémas de données, fichiers de référence pour les systèmes de lecture), compte rendu d\'exécution, liste des changements réels.',
        outcome: 'Signal public plus lisible et cohérent ; base solide pour que Google et les réponses IA s\'appuient sur des informations vérifiables.',
        bullets: [
            'Périmètre contractualisé — pas de prestation floue',
            'Correctifs prioritaires et enrichissements métier',
            'Traçabilité des changements appliqués',
            'Garde-fous : pas de promesse de résultat instantané',
            'Passage de relais clair vers le pilotage si vous poursuivez avec nous',
        ],
        cta: 'Lancer le mandat d\'implémentation',
        secondary: { href: '/etudes-de-cas/dossier-type', label: 'Aperçu d\'un dossier-type' },
    },
    {
        id: 'pilotage-continu',
        icon: TrendingUp,
        iconClass: 'text-[#5b73ff]',
        borderClass: 'border-white/10',
        highlight: false,
        name: 'Pilotage continu',
        subtitle: 'Un rôle dédié : veille, mesure, arbitrage et itérations sur votre visibilité Google et votre crédibilité dans les réponses IA.',
        forWho: 'Marchés serrés, multi-établissements, saisonnalité forte, ou besoin d\'un interlocuteur unique sur le sujet.',
        when: 'Après implémentation, ou lorsque l\'enjeu est récurrent (concurrence, mises à jour des moteurs, extension géographique).',
        weDo: 'Suivi selon notre cadre de mesure, revue des scénarios de recherche, ajustements contenus et signaux, compte rendu périodique et exécution dans le périmètre convenu.',
        youGet: 'Compte rendu régulier (changements, interprétation, suites), backlog priorisé, actions réalisées pendant la période, accès direct au responsable de dossier.',
        outcome: 'Stabilité et progression mesurée de la présence pertinente et de la qualité de la recommandation ; moins de dérive entre canaux.',
        bullets: [
            'Rythme et périmètre fixés dans le mandat',
            'Signaux, présence et indicateurs business distingués',
            'Itérations fondées sur des constats',
            'Relation directe, pas de file anonyme',
        ],
        cta: 'Discuter d\'un mandat récurrent',
        secondary: null,
    },
];

export default function OffersPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-[1140px] mx-auto">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                        Mandats d&apos;exécution
                    </div>
                    <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                        Vous déléguez, <br /><span className="text-[#666]">nous exécutons.</span>
                    </h1>
                    <p className="text-lg leading-relaxed text-[#a0a0a0] mb-6">
                        Trois mandats complémentaires : la cartographie pour décider, l&apos;implémentation pour produire des changements réels sur votre signal public,
                        le pilotage pour tenir la cadence lorsque Google et les modèles évoluent.
                    </p>
                    <p className="text-[15px] leading-relaxed text-[#888] max-w-2xl mx-auto">
                        Nous travaillons avec une méthode interne exigeante. Ce que vous achetez, c&apos;est le travail, le jugement et la responsabilité — pas un produit à piloter vous-même.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0a0a0a] p-8 md:p-10 mb-20 max-w-4xl mx-auto">
                    <h2 className="text-lg font-bold tracking-[-0.02em] mb-6 text-center">Comment nous travaillons ensemble</h2>
                    <ol className="grid gap-4 text-[14px] text-[#a0a0a0] leading-relaxed md:grid-cols-2 md:gap-x-10">
                        <li className="flex gap-3"><span className="font-mono text-[11px] text-white/35 shrink-0 pt-0.5">01</span><span><strong className="text-white/90">Cadrage</strong> — objectifs, territoire, contraintes, interlocuteur unique.</span></li>
                        <li className="flex gap-3"><span className="font-mono text-[11px] text-white/35 shrink-0 pt-0.5">02</span><span><strong className="text-white/90">Preuve</strong> — état initial documenté, repères mesurables.</span></li>
                        <li className="flex gap-3"><span className="font-mono text-[11px] text-white/35 shrink-0 pt-0.5">03</span><span><strong className="text-white/90">Exécution</strong> — nous appliquons ; vous validez ce qui est convenu.</span></li>
                        <li className="flex gap-3"><span className="font-mono text-[11px] text-white/35 shrink-0 pt-0.5">04</span><span><strong className="text-white/90">Compte rendu</strong> — ce qui est fait, ce qui reste, ce que nous observons.</span></li>
                        <li className="flex gap-3 md:col-span-2"><span className="font-mono text-[11px] text-white/35 shrink-0 pt-0.5">05</span><span><strong className="text-white/90">Poursuite</strong> — clôture de mandat ou passage au pilotage récurrent.</span></li>
                    </ol>
                    <p className="mt-8 text-center text-[13px] text-[#666] leading-relaxed border-t border-white/8 pt-8">
                        Nous ne vendons pas de promesse de « première place » : nous vendons une exécution disciplinée, des livrables vérifiables et une lecture honnête des résultats.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    {mandates.map((m) => {
                        const Icon = m.icon;
                        return (
                            <div
                                key={m.id}
                                id={m.id}
                                className={`scroll-mt-28 rounded-2xl border bg-[#0d0d0d] p-8 flex flex-col h-full group transition hover:-translate-y-1 ${m.borderClass} ${m.highlight ? 'relative overflow-hidden shadow-[0_20px_80px_rgba(91,115,255,0.12)]' : 'hover:border-white/15'}`}
                            >
                                {m.highlight && <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#5b73ff] to-emerald-400" />}
                                <div className={`relative z-10 h-12 w-12 rounded-xl border flex items-center justify-center mb-6 ${m.highlight ? 'border-[#5b73ff]/20 bg-[#5b73ff]/10 group-hover:bg-[#5b73ff]/20' : 'border-white/10 bg-white/[0.03] group-hover:bg-white/[0.06]'} transition`}>
                                    <Icon className={`w-5 h-5 ${m.iconClass}`} />
                                </div>
                                <h2 className="text-xl font-bold mb-2 tracking-[-0.02em] text-white relative z-10">{m.name}</h2>
                                <p className="text-sm text-[#7b8fff] font-medium mb-4 relative z-10 leading-snug">{m.subtitle}</p>

                                <div className="space-y-4 mb-6 text-[13px] text-[#a0a0a0] leading-relaxed relative z-10 flex-1">
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Pour qui</div>
                                        <p>{m.forWho}</p>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Quand</div>
                                        <p>{m.when}</p>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Ce que nous faisons</div>
                                        <p>{m.weDo}</p>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Ce que vous recevez</div>
                                        <p>{m.youGet}</p>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/35 mb-1">Résultat attendu</div>
                                        <p>{m.outcome}</p>
                                    </div>
                                </div>

                                <ul className="space-y-2.5 mb-8 text-[13px] text-[#888] relative z-10">
                                    {m.bullets.map((b) => (
                                        <li key={b} className="flex gap-2 items-start">
                                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${m.highlight ? 'text-emerald-400/70' : 'text-white/25'}`} />
                                            <span>{b}</span>
                                        </li>
                                    ))}
                                </ul>

                                <ContactButton className={`w-full relative z-10 py-3.5 rounded-xl text-[14px] font-[600] transition text-center ${m.highlight ? 'bg-white text-black hover:bg-neutral-200' : 'border border-white/10 bg-white/[0.03] text-white/90 hover:bg-white/[0.08]'}`}>
                                    {m.cta}
                                </ContactButton>
                                {m.secondary && (
                                    <Link href={m.secondary.href} className={`mt-4 text-center block text-[13px] font-medium transition-colors relative z-10 ${m.highlight ? 'text-emerald-400 hover:text-emerald-300' : 'text-[#7b8fff] hover:text-white'}`}>
                                        {m.secondary.label} →
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-10 md:p-14 text-center max-w-3xl mx-auto shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
                    <h3 className="text-[clamp(24px,3vw,32px)] font-bold mb-6 tracking-[-0.03em] leading-snug">Chaque mandat est unique.</h3>
                    <p className="text-[#a0a0a0] mb-10 text-[15px] leading-relaxed max-w-xl mx-auto">
                        Les besoins d&apos;un cabinet diffèrent de ceux d&apos;un commerce de proximité. Nous cadrons votre marché et vos contraintes avant de fixer périmètre et rythme.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Link href="/methodologie" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-4 text-[15px] font-[600] text-white transition hover:bg-white/[0.08]">
                            Notre méthode d&apos;exécution
                        </Link>
                        <ContactButton className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#5b73ff] px-8 py-4 text-[15px] font-[600] text-white transition hover:bg-blue-500 hover:shadow-[0_10px_30px_rgba(91,115,255,0.3)]">
                            Planifier un appel de cadrage <ArrowRight className="h-4 w-4" />
                        </ContactButton>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
