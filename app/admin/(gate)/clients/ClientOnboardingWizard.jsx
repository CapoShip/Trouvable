'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ProvenancePill } from '@/components/ui/ProvenancePill';
import QualityPill from '@/components/ui/QualityPill';
import { getQualityMeta, getQualityToneClasses } from '@/lib/quality-status';

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
    const resolved = review?.suggestionSignals?.resolved_category;
    const autoCategory = resolved?.confidence === 'high' && resolved?.canonical_category && resolved.canonical_category !== 'unknown'
        ? (resolved.display_label || humanizeSlug(resolved.canonical_category))
        : '';
    return {
        client_name: profile.client_name || '',
        client_slug: profile.client_slug || '',
        business_type: autoCategory || profile.business_type || '',
        city: address.city || profile.target_region || '',
        contact_email: contact.public_email || contact.email || '',
        contact_phone: contact.phone || '',
        seo_description: profile.seo_description || '',
        short_desc: business.short_desc || business.short_description || '',
        services_text: (business.services || []).join(', '),
        areas_text: (business.areas_served || []).filter((a) => a.toLowerCase() !== (address.city || profile.target_region || '').toLowerCase()).join(', '),
        socials_text: (profile.social_profiles || []).join('\n'),
        geo_faqs: profile.geo_faqs || [],
    };
}

function panelTone(type) {
    if (type === 'error') return 'border-red-400/20 bg-red-400/10 text-red-300';
    if (type === 'success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    return 'border-white/10 bg-white/[0.04] text-white/70';
}

const CONFIDENCE_LABELS = { high: 'élevée', medium: 'moyenne', low: 'faible' };

function humanizeSlug(slug) {
    if (!slug) return '-';
    return slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
    const [suggestingId, setSuggestingId] = useState(null);
    const [generatingPrompts, setGeneratingPrompts] = useState(false);

    const selectedPrompts = useMemo(
        () => promptDrafts.filter((prompt) => prompt.is_selected),
        [promptDrafts]
    );

    const inputClass = 'w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#5b73ff] focus:ring-1 focus:ring-[#5b73ff]';
    const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-white/45';

    async function handleSuggestPrompt(index) {
        const prompt = promptDrafts[index];
        if (!prompt || !draft) return;
        setSuggestingId(prompt.id);
        try {
            const response = await fetch('/api/admin/clients/onboarding/suggest-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_query: prompt.query_text || '',
                    business_name: draft.client_name || '',
                    business_type: draft.business_type || '',
                    target_region: draft.city || '',
                    seo_description: draft.seo_description || '',
                    services: draft.services_text || '',
                    intent_family: prompt.intent_family || '',
                    prompt_mode: prompt.prompt_mode || '',
                }),
            });
            const json = await parseJson(response);
            if (!response.ok) throw new Error(json.error || 'Erreur IA');
            if (json.suggestion) {
                const next = [...promptDrafts];
                next[index] = { ...next[index], query_text: json.suggestion };
                setPromptDrafts(next);
            }
        } catch (error) {
            setFlash({ type: 'error', message: `Suggestion IA : ${error.message}` });
        } finally {
            setSuggestingId(null);
        }
    }

    async function handleGeneratePrompts(draftData, reviewData) {
        const d = draftData || draft;
        const r = reviewData || review;
        if (!d) return;
        setGeneratingPrompts(true);
        try {
            const response = await fetch('/api/admin/clients/onboarding/generate-prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_name: d.client_name || '',
                    business_type: d.business_type || '',
                    target_region: d.city || '',
                    city: d.city || '',
                    seo_description: d.seo_description || '',
                    services: d.services_text || '',
                    short_description: d.short_desc || '',
                    areas_served: d.areas_text || '',
                    classification_label: r?.classification?.label || '',
                    needs_services: !d.services_text?.trim(),
                }),
            });
            const json = await parseJson(response);
            if (!response.ok) throw new Error(json.error || 'Erreur IA');
            if (json.prompts && json.prompts.length > 0) {
                setPromptDrafts(json.prompts);
                setFlash({ type: 'success', message: `${json.prompts.length} prompts générés par Mistral IA.` });
            }
            if (json.suggested_services && json.suggested_services.length > 0) {
                setDraft((current) => ({
                    ...current,
                    services_text: current.services_text?.trim() ? current.services_text : json.suggested_services.join(', '),
                }));
            }
        } catch (error) {
            console.warn('[generate-prompts]', error.message);
        } finally {
            setGeneratingPrompts(false);
        }
    }

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
            const newDraft = toDraft(onboarding);
            setDraft(newDraft);
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
            setFlash({ type: 'success', message: 'Enrichissement terminé. Génération des prompts IA…' });
            handleGeneratePrompts(newDraft, onboarding);
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
                    target_region: draft.city,
                    seo_description: draft.seo_description,
                    address: { city: draft.city, region: '', country: '' },
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
                                Classification: <span className="text-white">{review.classification?.label || 'Non classifié'}</span>
                                <div className="text-[11px] text-white/40 mt-1">
                                    Modèle: {review.suggestionSignals?.resolved_category?.business_model || '-'}
                                </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Audit: <span className="text-white">{review.audit?.status || '-'}</span> (SEO {review.audit?.seo_score ?? '-'} / GEO {review.audit?.geo_score ?? '-'})
                            </div>
                            {review.suggestionSignals?.resolved_category && (
                                <div className={`md:col-span-3 rounded-xl border p-3 ${review.suggestionSignals.resolved_category.needs_review && review.suggestionSignals.resolved_category.confidence !== 'high' ? 'border-amber-400/20 bg-amber-400/10' : 'border-white/10 bg-white/[0.03]'}`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xs font-semibold text-white/80">Typologie détectée</span>
                                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                                            review.suggestionSignals.resolved_category.confidence === 'high' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' :
                                            review.suggestionSignals.resolved_category.confidence === 'low' ? 'border-red-400/20 bg-red-400/10 text-red-300' :
                                            'border-amber-400/20 bg-amber-400/10 text-amber-300'
                                        }`}>
                                            Confiance {CONFIDENCE_LABELS[review.suggestionSignals.resolved_category.confidence] || 'inconnue'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-white">
                                        {review.suggestionSignals.resolved_category.display_label || humanizeSlug(review.suggestionSignals.resolved_category.canonical_category)}
                                    </div>
                                    <div className="text-[11px] text-white/40 mt-1">{review.suggestionSignals.resolved_category.reason}</div>
                                    {review.suggestionSignals.resolved_category.needs_review && review.suggestionSignals.resolved_category.confidence !== 'high' && (
                                        <div className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200 font-medium">
                                            ⚠️ Confiance insuffisante — confirmez ou corrigez la catégorie dans le champ « Type d'entreprise » ci-dessous.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {(review.warnings || []).length > 0 ? (
                            <ul className="mt-3 space-y-1 text-[12px] text-amber-200">
                                {review.warnings
                                    .filter((w) => !(review.suggestionSignals?.resolved_category?.confidence === 'high' && /site type confidence is low/i.test(w)))
                                    .map((item, index) => <li key={`warn-${index}`}>• {item}</li>)}
                            </ul>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-5">
                        <h3 className="text-base font-bold text-white">Champs de profil suggérés</h3>

                        {/* Identity */}
                        <div className="space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Identité</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className={labelClass}>Nom du client</label><input className={inputClass} value={draft.client_name} onChange={(event) => setDraft((current) => ({ ...current, client_name: event.target.value }))} /></div>
                                <div><label className={labelClass}>Slug</label><input className={inputClass} value={draft.client_slug} onChange={(event) => setDraft((current) => ({ ...current, client_slug: event.target.value }))} /></div>
                                <div><label className={labelClass}>Type d'entreprise</label><input className={inputClass} value={draft.business_type} onChange={(event) => setDraft((current) => ({ ...current, business_type: event.target.value }))} /></div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Localisation</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className={labelClass}>Ville principale</label><input className={inputClass} value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} /></div>
                                <div><label className={labelClass}>Zones desservies (séparées par virgule)</label><input className={inputClass} value={draft.areas_text} onChange={(event) => setDraft((current) => ({ ...current, areas_text: event.target.value }))} /></div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Contact</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className={labelClass}>Email de contact</label><input type="email" className={inputClass} value={draft.contact_email} onChange={(event) => setDraft((current) => ({ ...current, contact_email: event.target.value }))} /></div>
                                <div><label className={labelClass}>Téléphone</label><input className={inputClass} value={draft.contact_phone} onChange={(event) => setDraft((current) => ({ ...current, contact_phone: event.target.value }))} /></div>
                            </div>
                        </div>

                        {/* Business */}
                        <div className="space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Activité</div>
                            <div className="grid grid-cols-1 gap-4">
                                <div><label className={labelClass}>Description courte</label><textarea rows={2} className={`${inputClass} resize-none`} value={draft.short_desc} onChange={(event) => setDraft((current) => ({ ...current, short_desc: event.target.value }))} /></div>
                                <div><label className={labelClass}>Description SEO locale</label><textarea rows={2} className={`${inputClass} resize-none`} value={draft.seo_description} onChange={(event) => setDraft((current) => ({ ...current, seo_description: event.target.value }))} /></div>
                                <div><label className={labelClass}>Services (séparés par virgule)</label><input className={inputClass} value={draft.services_text} onChange={(event) => setDraft((current) => ({ ...current, services_text: event.target.value }))} /></div>
                            </div>
                        </div>

                        {/* Web Presence */}
                        <div className="space-y-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Présence web</div>
                            <div><label className={labelClass}>Liens sociaux (un par ligne)</label><textarea rows={3} className={`${inputClass} resize-none`} value={draft.socials_text} onChange={(event) => setDraft((current) => ({ ...current, socials_text: event.target.value }))} /></div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-bold text-white">Suggestions de prompts ({selectedPrompts.length} cochés)</h3>
                            <button
                                type="button"
                                disabled={generatingPrompts || loading}
                                onClick={() => handleGeneratePrompts()}
                                className="shrink-0 rounded-lg border border-[#5b73ff]/30 bg-[#5b73ff]/10 px-3 py-1.5 text-[11px] font-semibold text-[#8b9dff] hover:bg-[#5b73ff]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {generatingPrompts ? 'Génération…' : 'Régénérer avec Mistral'}
                            </button>
                        </div>
                        <p className="text-xs text-white/40">
                            Prompts générés par Mistral IA — optimisés pour la visibilité GEO.
                        </p>
                        {generatingPrompts ? (
                            <div className="rounded-xl border border-dashed border-[#5b73ff]/20 bg-[#5b73ff]/5 p-6 text-center space-y-2">
                                <div className="text-sm text-[#8b9dff] font-medium">Génération des prompts par Mistral IA…</div>
                                <div className="text-xs text-white/30">Analyse du contexte et création de 7 prompts GEO optimisés</div>
                            </div>
                        ) : (promptDrafts || []).length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-white/45">Aucun prompt suggéré.</div>
                        ) : (
                            <div className="space-y-2">
                                {promptDrafts.map((prompt, index) => {
                                    const qualityMeta = getQualityMeta(prompt.quality_status);
                                    return (
                                    <div key={prompt.id} className={`rounded-xl border p-3 ${
                                        prompt.is_valid === false ? 'border-red-400/15 bg-red-400/[0.03]' :
                                        prompt.quality_status === 'weak' ? 'border-red-400/15 bg-red-400/[0.03]' :
                                        prompt.quality_status === 'review' ? 'border-amber-400/10 bg-amber-400/[0.02]' :
                                        'border-white/10 bg-white/[0.03]'
                                    }`}>
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
                                                <div className="flex gap-2">
                                                    <input className={inputClass} value={prompt.query_text} onChange={(event) => {
                                                        const next = [...promptDrafts];
                                                        next[index] = { ...next[index], query_text: event.target.value };
                                                        setPromptDrafts(next);
                                                    }} />
                                                    <button
                                                        type="button"
                                                        disabled={suggestingId === prompt.id || loading}
                                                        onClick={() => handleSuggestPrompt(index)}
                                                        className="shrink-0 rounded-lg border border-[#5b73ff]/30 bg-[#5b73ff]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#8b9dff] hover:bg-[#5b73ff]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        title="Reformuler avec l'IA"
                                                    >
                                                        {suggestingId === prompt.id ? '...' : 'IA'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {prompt.quality_status ? (
                                                        <QualityPill status={prompt.quality_status} />
                                                    ) : null}
                                                    <span className="text-[10px] text-white/35">
                                                        {prompt.prompt_mode === 'operator_probe' ? 'operator probe' : 'user-like'} · {prompt.intent_family || 'discovery'}
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
                                                {prompt.quality_status === 'review' && !(prompt.validation?.reasons?.length > 0) ? (
                                                    <p className="text-[11px] text-amber-200/80">Revue opérateur recommandée avant activation.</p>
                                                ) : null}
                                                {prompt.quality_status === 'strong' && !(prompt.validation?.reasons?.length > 0) ? (
                                                    <p className="text-[11px] text-emerald-200/80">Prompt prêt à activer.</p>
                                                ) : null}
                                                {(prompt.quality_status === 'weak' || prompt.is_valid === false) && !(prompt.validation?.reasons?.length > 0) ? (
                                                    <p className="text-[11px] text-red-200/80">Prompt bloqué — reformulez pour activer.</p>
                                                ) : null}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input placeholder="Catégorie" className={inputClass} value={prompt.category} onChange={(event) => {
                                                        const next = [...promptDrafts];
                                                        next[index] = { ...next[index], category: event.target.value };
                                                        setPromptDrafts(next);
                                                    }} />
                                                    <input placeholder="Locale" className={inputClass} value={prompt.locale} onChange={(event) => {
                                                        const next = [...promptDrafts];
                                                        next[index] = { ...next[index], locale: event.target.value };
                                                        setPromptDrafts(next);
                                                    }} />
                                                </div>
                                                {prompt.rationale ? <p className="text-[12px] text-white/45">{prompt.rationale}</p> : null}
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
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
