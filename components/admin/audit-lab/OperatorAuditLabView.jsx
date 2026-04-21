'use client';

import Link from 'next/link';

import { useGeoClient } from '@/app/admin/(gate)/context/ClientContext';

import AuditLabBenchmark from './AuditLabBenchmark';
import AuditLabCanonical from './AuditLabCanonical';
import AuditLabCompare from './AuditLabCompare';
import AuditLabLayer1Checks from './AuditLabLayer1Checks';
import AuditLabLayer1Summary from './AuditLabLayer1Summary';
import AuditLabLayer2Diagnostic from './AuditLabLayer2Diagnostic';
import AuditLabRunner from './AuditLabRunner';
import AuditLabStableResult from './AuditLabStableResult';

/**
 * Page interne opérateur — Audit Trouvable.
 *
 * Lecture guidée :
 *   Runner  — lancer un audit manuel et suivre son mode pipeline.
 *   A.      — Vue d'ensemble (vérité client : score Trouvable + actions).
 *   B.      — Résumé technique (exploration, rendu, score brut couche 1).
 *   C.      — Vérifications détaillées par page (onglets + recherche).
 *   D.      — Enrichissements experts GEO (couche 2 : llms.txt, IA, marque…).
 *   E.      — Comparaison de sites (dry-run sans persistence).
 *   —       — Vue normalisée interne (référence canonique, couches 3–4).
 *   F.      — Débogage (timings, payload brut, replié par défaut).
 *
 * Règle non négociable : la section A est la seule "vérité produit" du client.
 * Toutes les autres sections sont diagnostiques (chrome visuel distinct).
 */
export default function OperatorAuditLabView() {
    const context = useGeoClient();
    const { client, audit, clientId, refetch } = context || {};
    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';

    return (
        <div className="p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/70">
                        Audit Trouvable · espace opérateur
                    </div>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-white/95">
                        Audit du mandat
                    </h1>
                    <p className="mt-1 max-w-2xl text-[12px] text-white/50">
                        Lancez un audit, lisez le résultat Trouvable final, puis explorez le diagnostic technique si besoin. Un seul score fait foi pour le client : le score Trouvable affiché en haut de page.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href={`${geoBase}/opportunities`} className="geo-btn geo-btn-vio px-3 py-1.5 text-xs">
                        File d&apos;actions
                    </Link>
                    <Link href={dossierBase} className="geo-btn geo-btn-ghost px-3 py-1.5 text-xs">
                        Vue dossier
                    </Link>
                </div>
            </div>

            <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                    Comment lire cette page
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                    <span className="text-white/80">A. Vue d&apos;ensemble</span> : la vérité partagée avec le client.
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/70">B. Résumé technique</span>, <span className="text-white/70">C. Vérifications détaillées</span> et <span className="text-white/70">D. Enrichissements experts</span> : diagnostic interne, utile pour comprendre d&apos;où vient le score sans jamais le remplacer.
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/65">E. Comparaison</span> : outil de benchmark interne (dry-run, non persisté).
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/50">F. Débogage</span> : timings &amp; payload techniques, repliés par défaut.
                </p>
            </div>

            <div className="space-y-6">
                <AuditLabRunner
                    clientId={clientId}
                    clientName={client?.client_name}
                    defaultUrl={client?.website_url}
                    latestAuditAt={audit?.created_at}
                    onRunComplete={refetch}
                />

                <AuditLabStableResult audit={audit} />

                <AuditLabLayer1Summary audit={audit} />

                <AuditLabLayer1Checks audit={audit} />

                <AuditLabLayer2Diagnostic audit={audit} />

                <AuditLabCompare defaultUrlA={client?.website_url || ''} />

                <AuditLabCanonical audit={audit} />

                <AuditLabBenchmark audit={audit} />
            </div>
        </div>
    );
}
