'use client';

import { useGeoClient } from '@/app/admin/(gate)/context/ClientContext';

import AuditLabComparison from './AuditLabComparison';

/**
 * Page interne opérateur — Comparaison d'audits (route dédiée).
 *
 * Anciennement une section (E) à l'intérieur de la page d'audit principale,
 * la comparaison a désormais son propre workflow pour ne plus encombrer la
 * lecture d'un audit unique.
 *
 * Trois modes, inchangés par rapport à la version embarquée :
 *   1. Audit actuel vs audit précédent  (historique persisté)
 *   2. Audit actuel vs site externe     (dry-run benchmark)
 *   3. Site A vs Site B                 (dry-run pur)
 *
 * La comparaison n'écrase jamais le score Trouvable : c'est une lecture
 * d'écarts, pas une nouvelle vérité produit.
 */
export default function OperatorAuditComparisonView() {
    const context = useGeoClient();
    const { client, audit, clientId } = context || {};

    return (
        <div className="p-5">
            <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/70">
                    Audit Trouvable · comparaison
                </div>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white/95">
                    Comparer deux audits ou deux sites
                </h1>
                <p className="mt-1 max-w-2xl text-[12px] text-white/50">
                    Espace dédié pour lire les écarts entre deux audits : score Trouvable, SEO, GEO,
                    couverture de crawl, dimensions, problèmes et points forts. Aucune de ces lectures
                    ne remplace le score Trouvable officiel du mandat.
                </p>
            </div>

            <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                    Comment utiliser cette page
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                    <span className="text-white/85">Actuel vs précédent</span> : suivre l&apos;évolution du mandat dans le temps.
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/80">Actuel vs site externe</span> : benchmark rapide contre un concurrent ou une référence.
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/75">Site A vs Site B</span> : comparaison libre entre deux URLs (aucun audit n&apos;est sauvegardé).
                </p>
            </div>

            <AuditLabComparison
                clientId={clientId}
                currentAudit={audit}
                defaultUrl={client?.website_url}
            />
        </div>
    );
}
