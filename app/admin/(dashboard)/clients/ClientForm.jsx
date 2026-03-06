'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveClientProfileAction } from './formActions';
import Toast from '../components/Toast';

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // remove accents
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-') // spaces to dashes
        .replace(/[^\w-]+/g, '') // remove non-word chars
        .replace(/--+/g, '-') // collapse multiple dashes
        .replace(/^-+/, '') // trim starting dash
        .replace(/-+$/, ''); // trim ending dash
}

export default function ClientForm({ initialData = null }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null); // { message, type }

    const isEditMode = !!initialData?.id;

    // We build a single large state object to hold all fields.
    // For arrays and JSON, we'll keep it simple for Bloc 3 standard compliance.
    // (Bloc 4 will enhance the UX of the arrays)
    const [formData, setFormData] = useState({
        id: initialData?.id || null,
        client_name: initialData?.client_name || '',
        client_slug: initialData?.client_slug || '',
        website_url: initialData?.website_url || '',
        business_type: initialData?.business_type || 'LocalBusiness',
        seo_title: initialData?.seo_title || '',
        seo_description: initialData?.seo_description || '',
        is_published: initialData?.is_published || false,
        // Real Objects for UI Editors (Bloc 4)
        social_profiles: initialData?.social_profiles || [],
        address: initialData?.address || { street: '', city: '', region: '', postalCode: '', country: '' },
        geo_faqs: initialData?.geo_faqs || [],
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        let newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const up = { ...prev, [name]: newValue };

            // Auto-slugify when writing the name (only in Create mode or if slug is empty)
            if (name === 'client_name' && (!isEditMode || !prev.client_slug)) {
                up.client_slug = slugify(newValue);
            }
            // If they manually edit the slug, force slugify formatting LIVE
            if (name === 'client_slug') {
                up.client_slug = slugify(newValue);
            }

            return up;
        });
    };

    // Advanced UI Handlers
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
    };

    const addSocialProfile = () => {
        setFormData(prev => ({ ...prev, social_profiles: [...prev.social_profiles, ''] }));
    };
    const updateSocialProfile = (index, value) => {
        setFormData(prev => {
            const arr = [...prev.social_profiles];
            arr[index] = value;
            return { ...prev, social_profiles: arr };
        });
    };
    const removeSocialProfile = (index) => {
        setFormData(prev => ({
            ...prev,
            social_profiles: prev.social_profiles.filter((_, i) => i !== index)
        }));
    };

    const addFaq = () => {
        setFormData(prev => ({ ...prev, geo_faqs: [...prev.geo_faqs, { question: '', answer: '' }] }));
    };
    const updateFaq = (index, field, value) => {
        setFormData(prev => {
            const arr = [...prev.geo_faqs];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, geo_faqs: arr };
        });
    };
    const removeFaq = (index) => {
        setFormData(prev => ({
            ...prev,
            geo_faqs: prev.geo_faqs.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        // Build a clean payload: trim + filter empty entries so Zod doesn't reject blanks
        const payload = {
            ...formData,
            social_profiles: formData.social_profiles
                .map(p => p.trim())
                .filter(Boolean),
            geo_faqs: formData.geo_faqs
                .map(f => ({ question: f.question.trim(), answer: f.answer.trim() }))
                .filter(f => f.question && f.answer),
        };

        startTransition(async () => {
            const result = await saveClientProfileAction(payload);

            if (result?.error) {
                setError(result.error);
                setToast({ message: result.error, type: 'error' });
            } else if (result?.success) {
                setToast({ message: isEditMode ? 'Profil mis à jour avec succès !' : 'Profil créé avec succès !', type: 'success' });
                // Slight delay before redirect to show toast
                setTimeout(() => {
                    router.push('/admin/clients');
                }, 1500);
            }
        });
    };

    return (
        <div className="relative"> {/* Added a wrapper div for the Toast component */}
            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1. Informations Principales */}
                    <div className="space-y-4 md:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Informations Principales</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Client *</label>
                                <input
                                    required
                                    type="text"
                                    name="client_name"
                                    value={formData.client_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (URL) *</label>
                                <input
                                    required
                                    type="text"
                                    name="client_slug"
                                    value={formData.client_slug}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none bg-slate-50"
                                />
                                <p className="text-xs text-slate-500 mt-1">Généré automatiquement. Minuscules et tirets uniquement.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">URL du Site Web *</label>
                                <input
                                    required
                                    type="url"
                                    name="website_url"
                                    value={formData.website_url}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type d'Entreprise (Schema.org)</label>
                                <input
                                    type="text"
                                    name="business_type"
                                    value={formData.business_type}
                                    onChange={handleChange}
                                    placeholder="ex: LocalBusiness, Restaurant, LegalService..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. SEO */}
                    <div className="space-y-4 md:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mt-4">Meta SEO (Optionnel)</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SEO Title</label>
                            <input
                                type="text"
                                name="seo_title"
                                value={formData.seo_title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">SEO Description</label>
                            <textarea
                                name="seo_description"
                                value={formData.seo_description}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* 3. Données Structurées Spécifiques (UI Editors) */}
                    <div className="space-y-6 md:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mt-4">Données Structurées (AEO / GEO)</h3>

                        {/* Address UI */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-medium text-slate-800 mb-3">Adresse Physique (Optionnel)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <input
                                    type="text" name="street" value={formData.address.street || ''} onChange={handleAddressChange}
                                    placeholder="Rue (Ex: 123 rue Principale)"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none"
                                />
                                <input
                                    type="text" name="city" value={formData.address.city || ''} onChange={handleAddressChange}
                                    placeholder="Ville (Ex: Montréal)"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text" name="region" value={formData.address.region || ''} onChange={handleAddressChange}
                                        placeholder="Région (Ex: QC)"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none"
                                    />
                                    <input
                                        type="text" name="postalCode" value={formData.address.postalCode || ''} onChange={handleAddressChange}
                                        placeholder="Code Postal"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none"
                                    />
                                </div>
                                <input
                                    type="text" name="country" value={formData.address.country || ''} onChange={handleAddressChange}
                                    placeholder="Pays (Ex: Canada)"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Social Profiles UI */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-slate-800">Profils Sociaux (URLs)</h4>
                                    <button type="button" onClick={addSocialProfile} className="text-orange-600 text-sm font-semibold hover:underline border border-orange-600 px-2 py-0.5 rounded transition-colors hover:bg-orange-50">+ Ajouter</button>
                                </div>
                                <div className="space-y-2">
                                    {formData.social_profiles.length === 0 && <p className="text-xs text-slate-500 italic">Aucun profil lié.</p>}
                                    {formData.social_profiles.map((sp, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                type="url"
                                                value={sp}
                                                onChange={(e) => updateSocialProfile(i, e.target.value)}
                                                placeholder="https://facebook.com/..."
                                                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none"
                                            />
                                            <button type="button" onClick={() => removeSocialProfile(i)} className="text-red-500 hover:bg-red-50 px-2 rounded transition-colors text-lg lead-none" title="Supprimer">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* GEO FAQs UI */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-slate-800">FAQs (Schema.org)</h4>
                                    <button type="button" onClick={addFaq} className="text-orange-600 text-sm font-semibold hover:underline border border-orange-600 px-2 py-0.5 rounded transition-colors hover:bg-orange-50">+ FAQ</button>
                                </div>
                                <div className="space-y-4">
                                    {formData.geo_faqs.length === 0 && <p className="text-xs text-slate-500 italic">Aucune question.</p>}
                                    {formData.geo_faqs.map((faq, i) => (
                                        <div key={i} className="relative border-l-2 border-orange-600 pl-3">
                                            <button type="button" onClick={() => removeFaq(i)} className="absolute -top-1 -right-1 text-red-500 hover:bg-red-50 w-6 h-6 flex items-center justify-center rounded transition-colors" title="Supprimer FAQ">×</button>
                                            <div className="space-y-2 pr-4">
                                                <input
                                                    type="text"
                                                    value={faq.question}
                                                    onChange={(e) => updateFaq(i, 'question', e.target.value)}
                                                    placeholder="Question"
                                                    className="w-full px-3 py-1.5 text-sm font-medium border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none focus:bg-white"
                                                />
                                                <textarea
                                                    value={faq.answer}
                                                    onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                                                    placeholder="Réponse"
                                                    rows="2"
                                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-orange-600 focus:border-orange-600 outline-none resize-none focus:bg-white"
                                                ></textarea>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Statut & Submit */}
                    <div className="md:col-span-2 pt-6 flex items-center justify-between border-t mt-6 border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
                            />
                            <span className="font-semibold text-slate-800">Publier immédiatement le profil</span>
                        </label>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors disabled:opacity-50 min-w-[200px]"
                        >
                            {isPending ? 'Sauvegarde...' : isEditMode ? 'Mettre à jour' : 'Créer le profil'}
                        </button>
                    </div>
                </div>
            </form>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
