'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const INITIAL_INPUT = {
    business_name: '',
    website_url: '',
    primary_region: '',
    category: 'LocalBusiness',
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
        business_type: profile.business_type || 'LocalBusiness',
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
                rationale: prompt.rationale || '',
                is_selected: prompt.is_selected !== false,
            })));
            setPortalDraft({
                enabled: onboarding.portalDraft?.enabled === true,
                contact_email: onboarding.portalDraft?.contact_email || input.primary_contact_email,
                portal_role: onboarding.portalDraft?.portal_role || 'viewer',
                member_type: onboarding.portalDraft?.member_type || 'client_contact',
            });
            setStep('review');
            setFlash({ type: 'success', message: 'Auto-enrichment completed. Review and activate when ready.' });
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
            setFlash({ type: 'success', message: 'Client activated in draft mode.' });
        } catch (error) {
            setFlash({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                <div className="text-[11px] uppercase tracking-[0.08em] text-white/45 font-semibold">
                    1. minimal input • 2. auto-enrichment • 3. review • 4. activation
                </div>
                {flash ? (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${panelTone(flash.type)}`}>
                        {flash.message}
                    </div>
                ) : null}
            </div>

            {step === 'input' ? (
                <form onSubmit={handleStart} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Step 1: minimal client input</h2>
                    <p className="text-sm text-white/40">This creates a draft client, runs initial audit enrichment, then opens an operator review screen.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Business name</label>
                            <input required className={inputClass} value={input.business_name} onChange={(event) => setInput((current) => ({ ...current, business_name: event.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Website URL</label>
                            <input required type="url" className={inputClass} value={input.website_url} onChange={(event) => setInput((current) => ({ ...current, website_url: event.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Primary city / region</label>
                            <input required className={inputClass} value={input.primary_region} onChange={(event) => setInput((current) => ({ ...current, primary_region: event.target.value }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Category / business type</label>
                            <input required className={inputClass} value={input.category} onChange={(event) => setInput((current) => ({ ...current, category: event.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Primary contact email</label>
                            <input required type="email" className={inputClass} value={input.primary_contact_email} onChange={(event) => setInput((current) => ({ ...current, primary_contact_email: event.target.value }))} />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-[#d6d6d6] disabled:opacity-50">
                            {loading ? 'Preparing...' : 'Create + enrich'}
                        </button>
                    </div>
                </form>
            ) : null}

            {step === 'enriching' ? (
                <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-8">
                    <h2 className="text-lg font-bold text-white">Step 2: auto-enrichment in progress</h2>
                    <p className="mt-2 text-sm text-white/45">Running initial audit and preparing detected/inferred suggestions...</p>
                </div>
            ) : null}

            {step === 'review' && review && draft ? (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
                        <h2 className="text-lg font-bold text-white">Step 3: operator review</h2>
                        <p className="text-sm text-white/40 mt-1">Approve, edit, or discard weak suggestions before activation.</p>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Identity: <span className="text-white">{review.suggestionSignals?.identity?.value || '-'}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Site type: <span className="text-white">{review.classification?.label || 'Not classified'}</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-white/80">
                                Audit: <span className="text-white">{review.audit?.status || '-'}</span> (SEO {review.audit?.seo_score ?? '-'} / GEO {review.audit?.geo_score ?? '-'})
                            </div>
                        </div>
                        {(review.warnings || []).length > 0 ? (
                            <ul className="mt-3 space-y-1 text-[12px] text-amber-200">
                                {review.warnings.map((item, index) => <li key={`warn-${index}`}>• {item}</li>)}
                            </ul>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                        <h3 className="text-base font-bold text-white">Suggested profile fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelClass}>Client name</label><input className={inputClass} value={draft.client_name} onChange={(event) => setDraft((current) => ({ ...current, client_name: event.target.value }))} /></div>
                            <div><label className={labelClass}>Slug</label><input className={inputClass} value={draft.client_slug} onChange={(event) => setDraft((current) => ({ ...current, client_slug: event.target.value }))} /></div>
                            <div><label className={labelClass}>Business type</label><input className={inputClass} value={draft.business_type} onChange={(event) => setDraft((current) => ({ ...current, business_type: event.target.value }))} /></div>
                            <div><label className={labelClass}>Target region</label><input className={inputClass} value={draft.target_region} onChange={(event) => setDraft((current) => ({ ...current, target_region: event.target.value }))} /></div>
                            <div><label className={labelClass}>City</label><input className={inputClass} value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} /></div>
                            <div><label className={labelClass}>Region</label><input className={inputClass} value={draft.region} onChange={(event) => setDraft((current) => ({ ...current, region: event.target.value }))} /></div>
                            <div><label className={labelClass}>Contact email</label><input type="email" className={inputClass} value={draft.contact_email} onChange={(event) => setDraft((current) => ({ ...current, contact_email: event.target.value }))} /></div>
                            <div><label className={labelClass}>Contact phone</label><input className={inputClass} value={draft.contact_phone} onChange={(event) => setDraft((current) => ({ ...current, contact_phone: event.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Short description</label><textarea rows={2} className={inputClass} value={draft.short_desc} onChange={(event) => setDraft((current) => ({ ...current, short_desc: event.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>SEO description</label><textarea rows={2} className={inputClass} value={draft.seo_description} onChange={(event) => setDraft((current) => ({ ...current, seo_description: event.target.value }))} /></div>
                            <div><label className={labelClass}>Services (comma separated)</label><input className={inputClass} value={draft.services_text} onChange={(event) => setDraft((current) => ({ ...current, services_text: event.target.value }))} /></div>
                            <div><label className={labelClass}>Areas served (comma separated)</label><input className={inputClass} value={draft.areas_text} onChange={(event) => setDraft((current) => ({ ...current, areas_text: event.target.value }))} /></div>
                            <div className="md:col-span-2"><label className={labelClass}>Social profiles (one URL per line)</label><textarea rows={3} className={inputClass} value={draft.socials_text} onChange={(event) => setDraft((current) => ({ ...current, socials_text: event.target.value }))} /></div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 space-y-4">
                        <h3 className="text-base font-bold text-white">Starter prompt suggestions ({selectedPrompts.length} selected)</h3>
                        {(promptDrafts || []).length === 0 ? (
                            <div className="rounded-xl border border-dashed border-white/10 p-3 text-sm text-white/45">No prompt suggestion generated.</div>
                        ) : (
                            <div className="space-y-2">
                                {promptDrafts.map((prompt, index) => (
                                    <div key={prompt.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={prompt.is_selected}
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
                        <h3 className="text-base font-bold text-white">Portal draft preparation</h3>
                        <label className="flex items-center gap-2 text-sm text-white/80">
                            <input type="checkbox" checked={portalDraft.enabled === true} onChange={(event) => setPortalDraft((current) => ({ ...current, enabled: event.target.checked }))} />
                            Prepare pending portal membership draft
                        </label>
                        <div>
                            <label className={labelClass}>Portal contact email</label>
                            <input type="email" className={inputClass} value={portalDraft.contact_email || ''} onChange={(event) => setPortalDraft((current) => ({ ...current, contact_email: event.target.value }))} />
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button type="button" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/[0.05]" onClick={() => setStep('input')} disabled={loading}>
                            Restart
                        </button>
                        <button type="button" className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-[#d6d6d6] disabled:opacity-50" onClick={handleActivate} disabled={loading}>
                            {loading ? 'Activating...' : 'Step 4: activate client'}
                        </button>
                    </div>
                </div>
            ) : null}

            {step === 'done' && result ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6 space-y-3">
                    <h2 className="text-lg font-bold text-emerald-200">Client activated in draft mode</h2>
                    <div className="text-sm text-emerald-100/90">Prompts created: {result.createdPrompts ?? 0} • Portal draft: {result.portalDraft?.status || 'not prepared'}</div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/dashboard/${result.client?.id}`} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-[#d6d6d6]">Open dashboard</Link>
                        <Link href={`/admin/clients/${result.client?.id}`} className="rounded-xl border border-emerald-300/25 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10">Open client record</Link>
                        <Link href="/admin/clients/new" className="rounded-xl border border-emerald-300/25 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10">New onboarding</Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
