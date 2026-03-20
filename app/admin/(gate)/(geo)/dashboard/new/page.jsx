'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveClientProfileAction } from '@/lib/actions/saveClientProfile';

function slugify(text) {
    return text.toString().toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '').replace(/--+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

export default function NewClientPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        client_slug: '',
        website_url: '',
        business_type: 'LocalBusiness',
        seo_title: '',
        seo_description: '',
        is_published: false,
        social_profiles: [],
        address: { street: '', city: '', region: '', postalCode: '', country: '' },
        geo_faqs: [],
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData((prev) => {
            const up = { ...prev, [name]: newValue };
            if (name === 'client_name') up.client_slug = slugify(newValue);
            if (name === 'client_slug') up.client_slug = slugify(newValue);
            return up;
        });
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, address: { ...prev.address, [name]: value } }));
    };

    const addFaq = () => setFormData((prev) => ({ ...prev, geo_faqs: [...prev.geo_faqs, { question: '', answer: '' }] }));
    const updateFaq = (i, field, value) => {
        setFormData((prev) => {
            const arr = [...prev.geo_faqs];
            arr[i] = { ...arr[i], [field]: value };
            return { ...prev, geo_faqs: arr };
        });
    };
    const removeFaq = (i) => setFormData((prev) => ({ ...prev, geo_faqs: prev.geo_faqs.filter((_, idx) => idx !== i) }));

    const addSocial = () => setFormData((prev) => ({ ...prev, social_profiles: [...prev.social_profiles, ''] }));
    const updateSocial = (i, value) => {
        setFormData((prev) => {
            const arr = [...prev.social_profiles];
            arr[i] = value;
            return { ...prev, social_profiles: arr };
        });
    };
    const removeSocial = (i) => setFormData((prev) => ({ ...prev, social_profiles: prev.social_profiles.filter((_, idx) => idx !== i) }));

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        const payload = {
            ...formData,
            social_profiles: formData.social_profiles.map((p) => p.trim()).filter(Boolean),
            geo_faqs: formData.geo_faqs.filter((f) => f.question.trim() && f.answer.trim()),
        };
        startTransition(async () => {
            const result = await saveClientProfileAction(payload);
            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                setSuccess(true);
                setTimeout(() => router.push('/admin/dashboard'), 1200);
            }
        });
    };

    const inp = 'w-full px-3 py-2.5 bg-[var(--geo-s2)] border border-[var(--geo-bd)] rounded-[var(--geo-r)] text-[var(--geo-t1)] text-sm outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[rgba(99,102,241,0.15)] transition-all placeholder:text-[var(--geo-t4)]';

    return (
        <div className="p-5 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link href="/admin/dashboard" className="text-xs text-[var(--geo-t3)] hover:text-[var(--geo-t1)] transition-colors mb-1 inline-block">← Retour au dashboard</Link>
                    <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold tracking-tight">Nouveau Client</h1>
                    <p className="text-xs text-[var(--geo-t2)]">Créer un nouveau profil client GEO</p>
                </div>
            </div>

            {error && (
                <div className="p-3 mb-4 bg-[var(--geo-red-bg)] border border-[var(--geo-red-bd)] rounded-[var(--geo-r)] text-[#f87171] text-sm font-medium">{error}</div>
            )}
            {success && (
                <div className="p-3 mb-4 bg-[var(--geo-green-bg)] border border-[var(--geo-green-bd)] rounded-[var(--geo-r)] text-[var(--geo-green)] text-sm font-medium">Client créé avec succès ! Redirection...</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="geo-card p-5">
                    <h3 className="geo-ct text-[var(--geo-t1)] mb-4">Informations Principales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--geo-t2)] mb-1 block">Nom du Client *</label>
                            <input required type="text" name="client_name" value={formData.client_name} onChange={handleChange} placeholder="Ex: Boulangerie Lenôtre" className={inp} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--geo-t2)] mb-1 block">Slug (URL) *</label>
                            <input required type="text" name="client_slug" value={formData.client_slug} onChange={handleChange} className={inp + ' font-mono'} />
                            <p className="text-[10px] text-[var(--geo-t4)] mt-1">Minuscules et tirets uniquement.</p>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--geo-t2)] mb-1 block">URL du Site Web *</label>
                            <input required type="url" name="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://..." className={inp} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--geo-t2)] mb-1 block">Type d&apos;Entreprise</label>
                            <input type="text" name="business_type" value={formData.business_type} onChange={handleChange} placeholder="LocalBusiness, Restaurant..." className={inp} />
                        </div>
                    </div>
                </div>

                <div className="geo-card p-5">
                    <h3 className="geo-ct text-[var(--geo-t1)] mb-4">Meta SEO</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--geo-t2)] mb-1 block">SEO Title</label>
                            <input type="text" name="seo_title" value={formData.seo_title} onChange={handleChange} className={inp} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--geo-t2)] mb-1 block">SEO Description</label>
                            <textarea name="seo_description" value={formData.seo_description} onChange={handleChange} rows="2" className={inp + ' resize-none'} />
                        </div>
                    </div>
                </div>

                <div className="geo-card p-5">
                    <h3 className="geo-ct text-[var(--geo-t1)] mb-4">Adresse</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" name="street" value={formData.address.street || ''} onChange={handleAddressChange} placeholder="Rue" className={inp} />
                        <input type="text" name="city" value={formData.address.city || ''} onChange={handleAddressChange} placeholder="Ville" className={inp} />
                        <input type="text" name="region" value={formData.address.region || ''} onChange={handleAddressChange} placeholder="Région (QC)" className={inp} />
                        <input type="text" name="postalCode" value={formData.address.postalCode || ''} onChange={handleAddressChange} placeholder="Code Postal" className={inp} />
                        <input type="text" name="country" value={formData.address.country || ''} onChange={handleAddressChange} placeholder="Pays" className={inp} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="geo-card p-5">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="geo-ct text-[var(--geo-t1)]">Profils Sociaux</h3>
                            <button type="button" onClick={addSocial} className="geo-btn geo-btn-vio text-[10px] py-1 px-2">+ Ajouter</button>
                        </div>
                        <div className="space-y-2">
                            {formData.social_profiles.length === 0 && <p className="text-xs text-[var(--geo-t4)] italic">Aucun profil lié.</p>}
                            {formData.social_profiles.map((sp, i) => (
                                <div key={i} className="flex gap-2">
                                    <input type="url" value={sp} onChange={(e) => updateSocial(i, e.target.value)} placeholder="https://..." className={inp} />
                                    <button type="button" onClick={() => removeSocial(i)} className="text-[#f87171] hover:bg-[var(--geo-red-bg)] px-2 rounded text-lg">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="geo-card p-5">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="geo-ct text-[var(--geo-t1)]">FAQs (Schema.org)</h3>
                            <button type="button" onClick={addFaq} className="geo-btn geo-btn-vio text-[10px] py-1 px-2">+ FAQ</button>
                        </div>
                        <div className="space-y-3">
                            {formData.geo_faqs.length === 0 && <p className="text-xs text-[var(--geo-t4)] italic">Aucune question.</p>}
                            {formData.geo_faqs.map((faq, i) => (
                                <div key={i} className="relative border-l-2 border-[var(--geo-violet)] pl-3">
                                    <button type="button" onClick={() => removeFaq(i)} className="absolute -top-1 -right-1 text-[#f87171] hover:bg-[var(--geo-red-bg)] w-5 h-5 flex items-center justify-center rounded text-xs">×</button>
                                    <input type="text" value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} placeholder="Question" className={inp + ' mb-2 font-medium'} />
                                    <textarea value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} placeholder="Réponse" rows="2" className={inp + ' resize-none'} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--geo-bd)]">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="is_published" checked={formData.is_published} onChange={handleChange} className="w-4 h-4 rounded bg-[var(--geo-s2)] border-[var(--geo-bd)] text-[var(--geo-violet)]" />
                        <span className="text-sm font-semibold text-[var(--geo-t1)]">Publier immédiatement</span>
                    </label>
                    <div className="flex gap-2">
                        <Link href="/admin/dashboard" className="geo-btn geo-btn-ghost py-2.5 px-5">Annuler</Link>
                        <button type="submit" disabled={isPending} className="geo-btn geo-btn-pri py-2.5 px-6 disabled:opacity-50">
                            {isPending ? 'Création...' : 'Créer le profil'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
