'use client';

import Link from 'next/link';

import { useGeoClient } from '@/app/admin/(gate)/context/ClientContext';

import AuditLabBenchmark from './AuditLabBenchmark';
import AuditLabCanonical from './AuditLabCanonical';
import AuditLabLayer1Checks from './AuditLabLayer1Checks';
import AuditLabLayer1Summary from './AuditLabLayer1Summary';
import AuditLabLayer2Diagnostic from './AuditLabLayer2Diagnostic';
import AuditLabRunner from './AuditLabRunner';
import AuditLabStableResult from './AuditLabStableResult';

/**
 * Page interne opérateur — Audit Trouvable.
 *
 * 7 sections dans l'ordre de lecture :
 *   1. Lancer un audit (runner + mode pipeline).
 *   2. Résultat final Trouvable (vérité produit, score unique).
 *   3. Résumé technique (couche 1 — exploration, rendu, score brut).
 *   4. Vérifications détaillées (couche 1 — checks par page).
 *   5. Enrichissements experts GEO (couche 2 — modules).
 *   6. Vue normalisée interne (couches 3 & 4 — objet canonique).
 *   7. Débogage / benchmark (timings, payload brut, audit id).
 *
 * Règle non négociable : la section 2 est la seule "vérité produit" du client.
 * Les sections 3 à 6 sont diagnostiques (chrome visuel distinct). La section 7
 * est technique et reste repliée par défaut.
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
                    <span className="text-white/80">Résultat Trouvable</span> en haut : c&apos;est la vérité partagée avec le client.
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/70">Analyse technique</span>, <span className="text-white/70">vérifications par page</span> et <span className="text-white/70">enrichissements experts</span> : diagnostic interne, utile pour comprendre d&apos;où vient le score, sans jamais le remplacer.
                    <span className="mx-1 text-white/20">·</span>
                    <span className="text-white/60">Vue normalisée</span> et <span className="text-white/50">débogage</span> : réservés à la validation opérateur.
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

                <AuditLabCanonical audit={audit} />

                <AuditLabBenchmark audit={audit} />
            </div>
        </div>
    );
}
