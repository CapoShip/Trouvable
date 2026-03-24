'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const INITIAL_INPUT = {
    business_name: '',
    website_url: '',
    primary_region: '',
    category: '',
    primary_contact_email: '',
};

function splitLines(value) {
    return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function splitComma(value) {
    return String(value || '').split(',').map((line) => line.trim()).filter(Boolean);
}

async function parseJson(response) {
    return response.json().catch(() => ({}));
}

function toDraft(review) {
    const profile = review?.profileSuggestion || {};
    const contact = profile.contact_info || {};
    const address = profile.address || {};
    const business = profile.business_details || {};
    return {
        client_name: profile.client_name || '',
        client_slug: profile.client_slug || '',
        business_type: profile.business_type || '', // Wait for operator to confirm
        target_region: profile.target_region || '',
        city: address.city || '',
        region: address.region || '',
        contact_email: contact.public_email || contact.email || '',
        contact_phone: contact.phone || '',
        seo_description: profile.seo_description || '',
        short_desc: business.short_desc || business.short_description || '',
        services_text: (business.services || []).join(', '),
        areas_text: (business.areas_served || []).join(', '),
        socials_text: (profile.social_profiles || []).join('\n'),
        geo_faqs: profile.geo_faqs || [],
    };
}

function panelTone(type) {
    if (type === 'error') return 'border-red-400/20 bg-red-400/10 text-red-300';
    if (type === 'success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    return 'border-white/10 bg-white/[0.04] text-white/70';
}

function statusTone(status) {
    if (status === 'strong') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
    if (status === 'weak') return 'border-red-400/30 bg-red-400/10 text-red-200';
    return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
}

export default function ClientOnboardingWizard() {
    const [step, setStep] = useState('input');
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState(INITIAL_INPUT);
    const [review, setReview] = useState(null);
    const [draft, setDraft] = useState(null);
    const [promptDrafts, setPromptDrafts] = useState([]);
    const [portalDraft, setPortalDraft] = useState({ enabled: false, contact_email: '' });
    const [result, setResult] = useState(null);
    const [flash, setFlash] = useState(null);

    const selectedPrompts = useMemo(
        () => promptDrafts.filter((prompt) => prompt.is_selected),
        [promptDrafts]
    );

    const inputClass = 'w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#5b73ff] focus:ring-1 focus:ring-[#5b73ff]';
    const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-white/45';

    async function handleStart(event) {
        event.preventDefault();
        setLoading(true);
        setFlash(null);
        setStep('enriching');

        try {
            const response = await fetch('/api/admin/clients/onboarding/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            const json = await parseJson(response);
            if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);

            const onboarding = json.onboarding;
            setReview(onboarding);
            setDraft(toDraft(onboarding));
            setPromptDrafts((onboarding.trackedPromptSuggestions || []).map((prompt, index) => ({
                id: prompt.id || `prompt-${index}`,
                query_text: prompt.query_text || '',
                category: prompt.category || 'discovery',
                locale: prompt.locale || 'fr-CA',
                prompt_mode: prompt.prompt_mode === 'operator_probe' ? 'operator_probe' : 'user_like',
                intent_family: prompt.intent_family || 'discovery',
                rationale: prompt.rationale || '',
                quality_status: prompt.quality_status || null,
                validation: prompt.validation || null,
                is_valid: prompt.validation?.is_valid !== false && prompt.quality_status !== 'weak',
                is_selected: prompt.is_selected === true,
                offer_anchor: prompt.offer_anchor || '',
                offer_label_normalized: prompt.offer_label_normalized || '',
                user_visible_offering: prompt.user_visible_offering || '',
            })));
            setPortalDraft({
                enabled: onboarding.portalDraft?.enabled === true,
                contact_email: onboarding.portalDraft?.contact_email || input.primary_contact_email,
                portal_role: onboarding.portalDraft?.portal_role || 'viewer',
                member_type: onboarding.portalDraft?.member_type || 'client_contact',
            });
            setStep('review');
            setFlash({ type: 'success', message: 'Auto-enrichissement terminé. Validez et activez ci-dessous.' });
        } catch (error) {
            setFlash({ type: 'error', message: error.message });
            setStep('input');
        } finally {
            setLoading(false);
        }
    }

    async function handleActivate() {
        if (!review?.client?.id || !draft) return;
        setLoading(true);
        setFlash(null);

        try {
            const payload = {
                clientId: review.client.id,
                profile: {
                    client_name: draft.client_name,
                    client_slug: draft.client_slug,
                    business_type: draft.business_type,
                    target_region: draft.target_region,
                    seo_description: draft.seo_description,
                    address: { city: draft.city, region: draft.region, country: '' },
                    contact_info: { public_email: draft.contact_email, email: draft.contact_email, phone: draft.contact_phone },
                    social_profiles: splitLines(draft.socials_text),
                    business_details: {
                        short_desc: draft.short_desc,
                        short_description: draft.short_desc,
                        services: splitComma(draft.services_text),
                        areas_served: splitComma(draft.areas_text),
                    },
                    geo_faqs: draft.geo_faqs || [],
                },
                promptSuggestions: selectedPrompts.map((prompt) => ({
                    query_text: prompt.query_text,
                    category: prompt.category,
                    locale: prompt.locale,
                    is_active: true,
                    is_valid: prompt.is_valid !== false,
                })),
                portalDraft: {
                    enabled: portalDraft.enabled === true,
                    contact_email: portalDraft.contact_email || draft.contact_email,
                    portal_role: portalDraft.portal_role || 'viewer',
                    member_type: portalDraft.member_type || 'client_contact',
                },
            };

            const response = await fetch('/api/admin/clients/onboarding/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await parseJson(response);
            if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);

            setResult(json);
            setStep('done');
            setFlash({ type: 'success', message: 'Client activé (statut brouillon).' });
        } catch (error) {
            setFlash({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] text-white/45 font-semibold leading-relaxed">
                    1. initialisation • 2. auto-enrichissement • 3. vérification • 4. activation
                </div>
                {flash ? (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${panelTone(flash.type)}`}>
                        {flash.message}
                    </div>
                ) : null}
            </div>

            {step === 'input' ? (
                <form onSubmit={handleStart} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Étape 1 : Saisie minimale</h2>
                    <p className="text-sm text-white/40">Cela crée un brouillon, lance un premier audit d'enrichissement et ouvre un écran de validation.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nom de l'entreprise</label>
                            <input required className={inputClass} value={input.business_name} onChange={(event) => setInput((current) => ({ ...current, business_name: event.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>URL du site web</label>
                            <input required type="url" className={inputClass} value={input.website_url} onChange={(event) => setInput((current) => ({ ...current, website_url: event.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Ville / région principale</label>
                            <input required className={inputClass} value={input.primary_region} onChange={(event) => setInput((current) => ({ ...current, primary_region: event.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Indice de typologie (optionnel)</label>
                            <input className={inputClass} value={input.category} onChange={(event) => setInput((current) => ({ ...current, category: event.target.value }))} placeholder="ex: restaurant, logiciel rh..." />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Email de contact principal</label>
                            <input required type="email" className={inputClass} value={input.primary_contact_email} onChange={(event) => setInput((current) => ({ ...current, primary_contact_email: event.target.value }))} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-[#d6d6d6] disabled:opacity-50">
                            {loading ? 'Préparation...' : 'Créer et enrichir'}
                        </button>
                    </div>
                </form>
            ) : null}

            {step === 'enriching' ? (
                <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-8">
                    <h2 className="text-lg font-bold text-white">Étape 2 : Auto-enrichissement en cours</h2>
                    <p className="mt-2 text-sm text-white/45">Exécution de l'audit initial et préparation des suggestions...</p>
                </div>
            ) : null}

            {step === 'review' && review && draft ? (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                        <h2 className="text-lg font-bold text-white">Étape 3 : Vérification opérateur</h2>
                        <p className="text-sm text-white/40 mt-1">Approuvez, éditez ou ignorez les suggestions fragiles avant activation.</p>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Identité détectée: <span className="text-white">{review.suggestionSignals?.identity?.value || '-'}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Site classification: <span className="text-white">{review.classification?.label || 'Not classified'}</span>
                                <div className="text-[11px] text-white/40 mt-1">
                                    Modèle: {review.suggestionSignals?.resolved_category?.business_model || '-'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Audit: <span className="text-white">{review.audit?.status || '-'}</span> (SEO {review.audit?.seo_score ?? '-'} / GEO {review.audit?.geo_score ?? '-'})
                            </div>
                            {review.suggestionSignals?.resolved_category && (
                                <div className={`md:col-span-3 rounded-xl border p-3 text-xs ${review.suggestionSignals.resolved_category.needs_review ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/[0.03] text-white/70'}`}>
                                    <strong>Typologie ({review.suggestionSignals.resolved_category.confidence}) :</strong> {review.suggestionSignals.resolved_category.reason}
                                    <div className="mt-1">
                                        Schéma brut: <span className="italic">{review.suggestionSignals.resolved_category.raw_schema_input || 'N/A'}</span> &rarr; Catégorie canonique: <span className="font-semibold text-white">{review.suggestionSignals.resolved_category.canonical_category}</span>
                                    </div>
                                    {review.suggestionSignals.resolved_category.needs_review && (
                                        <div className="mt-2 font-semibold">
                                            ⚠️ Veuillez confirmer ou saisir manuellement la catégorie dans le champ Business Type ci-dessous.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {(review.warnings || []).length > 0 ? (
                            <ul className="mt-3 space-y-1 text-[12px] text-amber-200">
                                {review.warnings.map((item, index) => <li key={`warn-${index}`}>• {item}</li>)}
                            </ul>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                        <h3 className="text-base font-bold text-white">Champs de profil suggérés</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClass}>Nom du client</label><input className={inputClass} value={draft.client_name} onChange={(event) => setDraft((current) => ({ ...current, client_name: event.target.value }))} /></div>
                            <div><label className={labelClass}>Slug</label><input className={inputClass} value={draft.client_slug} onChange={(event) => setDraft((current) => ({ ...current, client_slug: event.target.value }))} /></div>
                            <div><label className={labelClass}>Type d'entreprise (Business type)</label><input className={inputClass} value={draft.business_type} onChange={(event) => setDraft((current) => ({ ...current, business_type: event.target.value }))} /></div>
                            <div><label className={labelClass}>Région cible</label><input className={inputClass} value={draft.target_region} onChange={(event) => setDraft((current) => ({ ...current, target_region: event.target.value }))} /></div>
                            <div><label className={labelClass}>Ville</label><input className={inputClass} value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} /></div>
                            <div><label className={labelClass}>Région</label><input className={inputClass} value={draft.region} onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))} /></div>
                            <div><label className={labelClass}>Email de contact</label><input type="email" className={inputClass} value={draft.contact_email} onChange={(event) => setDraft((current) => ({ ...current, contact_email: event.target.value }))} /></div>
                            <div><label className={labelClass}>Téléphone</label><input className={inputClass} value={draft.contact_phone} onChange={(event) => setDraft((current) => ({ ...current, contact_phone: event.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Description courte</label><textarea rows={2} className={inputClass} value={draft.short_desc} onChange={(event) => setDraft((current) => ({ ...current, short_desc: event.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Description SEO locale</label><textarea rows={2} className={inputClass} value={draft.seo_description} onChange={(event) => setDraft((current) => ({ ...current, seo_description: event.target.value }))} /></div>
                            <div><label className={labelClass}>Services (séparés par virgule)</label><input className={inputClass} value={draft.services_text} onChange={(event) => setDraft((current) => ({ ...current, services_text: event.target.value }))} /></div>
                            <div><label className={labelClass}>Zones desservies</label><input className={inputClass} value={draft.areas_text} onChange={(event) => setDraft((current) => ({ ...current, areas_text: event.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Liens sociaux (un par ligne)</label><textarea rows={3} className={inputClass} value={draft.socials_text} onChange={(event) => setDraft((current) => ({ ...current, socials_text: event.target.value }))} /></div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                        <h3 className="text-base font-bold text-white">Suggestions de prompts ({selectedPrompts.length} cochés)</h3>
                        <p className="text-xs text-white/40">
                            Source unique: pack suggéré. Les prompts vagues / génériques sont automatiquement exclus.
                        </p>
                        {(promptDrafts || []).length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-white/45">Aucun prompt suggéré..</div>
                        ) : (
                            <div className="space-y-2">
                                {promptDrafts.map((prompt, index) => (
                                    <div key={prompt.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={prompt.is_selected}
                                                disabled={prompt.is_valid === false}
                                                onChange={(event) => {
                                                    const next = [...promptDrafts];
                                                    next[index] = { ...next[index], is_selected: event.target.checked };
                                                    setPromptDrafts(next);
                                                }}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 space-y-2">
                                                <input className={inputClass} value={prompt.query_text} onChange={(event) => {
                                                    const next = [...promptDrafts];
                                                    next[index] = { ...next[index], query_text: event.target.value };
                                                    setPromptDrafts(next);
                                                }} />
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="rounded-md border border-white/20 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/80">
                                                        Mode: {prompt.prompt_mode === 'operator_probe' ? 'operator probe' : 'user-like'}
                                                    </span>
                                                    <span className="rounded-md border border-white/20 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/80">
                                                        Famille: {prompt.intent_family || 'discovery'}
                                                    </span>
                                                    {prompt.quality_status ? (
                                                        <span className={`rounded-md border px-2 py-0.5 text-[10px] ${
                                                            prompt.quality_status === 'strong'
                                                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                                                                : prompt.quality_status === 'review'
                                                                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                                                                    : 'border-red-400/30 bg-red-400/10 text-red-200'
                                                        }`}>
                                                            Qualité: {prompt.quality_status}
                                                        </span>
                                                    ) : null}
                                                    <span className={`rounded-md border px-2 py-0.5 text-[10px] ${statusTone(prompt.validation?.status || prompt.quality_status || 'review')}`}>
                                                        Statut: {prompt.validation?.status || prompt.quality_status || 'review'}
                                                    </span>
                                                    <span className={`rounded-md border px-2 py-0.5 text-[10px] ${
                                                        prompt.is_valid === false ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-white/20 bg-white/[0.04] text-white/80'
                                                    }`}>
                                                        {prompt.is_valid === false ? 'Bloqué' : (prompt.is_selected ? 'Sélectionné' : 'À valider')}
                                                    </span>
                                                </div>
                                                {prompt.offer_label_normalized ? (
                                                    <div className="text-[11px] text-white/40">
                                                        Offre: {prompt.offer_label_normalized}
                                                    </div>
                                                ) : null}
                                                {prompt.validation?.reasons?.length > 0 ? (
                                                    <ul className="text-[11px] text-red-200/80 space-y-0.5">
                                                        {prompt.validation.reasons.map((reason) => (
                                                            <li key={`${prompt.id}-${reason}`}>• {reason}</li>
                                                        ))}
                                                    </ul>
                                                ) : null}
                                                {prompt.validation?.reasons?.length === 0 && (prompt.validation?.status || prompt.quality_status) === 'review' ? (
                                                    <p className="text-[11px] text-amber-200/80">Revue opérateur recommandée avant activation.</p>
                                                ) : null}
                                                {prompt.validation?.reasons?.length === 0 && (prompt.validation?.status || prompt.quality_status) === 'strong' ? (
                                                    <p className="text-[11px] text-emerald-200/80">Prompt prêt à activer.</p>
                                                ) : null}
                                                {prompt.validation?.reasons?.length === 0 && (prompt.validation?.status || prompt.quality_status) === 'weak' ? (
                                                    <p className="text-[11px] text-red-200/80">Prompt bloqué.</p>
                                                ) : null}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input className={inputClass} value={prompt.category} onChange={(event) => {
                                                        const next = [...promptDrafts];
                                                        next[index] = { ...next[index], category: event.target.value };
                                                        setPromptDrafts(next);
                                                    }} />
                                                    <input className={inputClass} value={prompt.locale} onChange={(event) => {
                                                        const next = [...promptDrafts];
                                                        next[index] = { ...next[index], locale: event.target.value };
                                                        setPromptDrafts(next);
                                                    }} />
                                                </div>
                                                {prompt.rationale ? <p className="text-[12px] text-white/45">{prompt.rationale}</p> : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-3">
                        <h3 className="text-base font-bold text-white">Accès portail client</h3>
                        <p className="text-xs text-white/40 leading-relaxed">
                            Si coché, à l&apos;activation nous enregistrons cette adresse : le client pourra se connecter sur{' '}
                            <span className="text-white/55">/portal/sign-in</span> avec un compte Clerk où ce courriel est{' '}
                            <strong className="text-white/60">vérifié</strong> (même adresse que ci-dessous ou que le courriel du profil).
                        </p>
                        <label className="flex items-center gap-2 text-sm text-white/80">
                            <input type="checkbox" checked={portalDraft.enabled === true} onChange={(event) => setPortalDraft((current) => ({ ...current, enabled: event.target.checked }))} />
                            Autoriser la connexion au portail pour ce courriel
                        </label>
                        <div>
                            <label className={labelClass}>Courriel invité (portail)</label>
                            <input type="email" className={inputClass} value={portalDraft.contact_email || ''} onChange={(event) => setPortalDraft((current) => ({ ...current, contact_email: event.target.value }))} placeholder="meme@domaine.com que chez le client" />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button type="button" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05]" onClick={() => setStep('input')} disabled={loading}>
                            Recommencer
                        </button>
                        <button type="button" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-[#d6d6d6] disabled:opacity-50" onClick={handleActivate} disabled={loading || selectedPrompts.length === 0}>
                            {loading ? 'Activation...' : 'Étape 4 : Activer le client'}
                        </button>
                    </div>
                    {selectedPrompts.length === 0 ? (
                        <div className="text-xs text-amber-200/80 text-right">
                            Activez au moins un prompt valide du pack pour éviter une activation sans stratégie GEO exploitable.
                        </div>
                    ) : null}
                </div>
            ) : null}

            {step === 'done' && result ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6 space-y-3">
                    <h2 className="text-lg font-bold text-emerald-200">Client activé avec succès (en brouillon)</h2>
                    <div className="text-sm text-emerald-100/90">
                        Prompts créés : {result.createdPrompts ?? 0}
                        {result.portalDraft
                            ? ` • Portail : ${result.portalDraft.status === 'active' ? 'accès actif' : `statut ${result.portalDraft.status}`} (${result.portalDraft.contact_email})`
                            : ' • Portail : non activé'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/clients/${result.client?.id}/overview`} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-[#d6d6d6]">Ouvrir le workspace</Link>
                        <Link href={`/admin/clients/${result.client?.id}`} className="rounded-xl border border-emerald-300/25 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10">Fiche client</Link>
                        <Link href="/admin/clients/onboarding" className="rounded-xl border border-emerald-300/25 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10">Nouvel onboarding</Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
