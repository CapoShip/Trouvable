'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveCockpitDataAction } from './actions';
import Toast from '../../../components/Toast';
import {
    LayoutDashboard, UserCircle, Search, Sparkles,
    Send, Info, CheckCircle2, ChevronRight, X, Plus
} from 'lucide-react';

function calculateCompleteness(data) {
    let score = 0;
    let totalFields = 10;
    if (data.contact_info?.phone) score++;
    if (data.contact_info?.public_email) score++;
    if (data.business_details?.short_desc) score++;
    if (data.business_details?.long_desc) score++;
    if (data.seo_data?.main_keywords?.length > 0) score++;
    if (data.seo_data?.target_cities?.length > 0) score++;
    if (data.seo_data?.value_proposition) score++;
    if (data.geo_ai_data?.differentiators?.length > 0) score++;
    if (data.geo_ai_data?.client_types?.length > 0) score++;
    if (data.geo_ai_data?.ai_summary_short) score++;
    return Math.round((score / totalFields) * 100);
}

export default function CockpitForm({ initialData }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('apercu');

    const [formData, setFormData] = useState({
        id: initialData.id,
        publication_status: initialData.publication_status || 'draft',
        internal_notes: initialData.internal_notes || '',
        contact_info: {
            phone: initialData.contact_info?.phone || '',
            public_email: initialData.contact_info?.public_email || ''
        },
        business_details: {
            short_desc: initialData.business_details?.short_desc || '',
            long_desc: initialData.business_details?.long_desc || '',
            maps_url: initialData.business_details?.maps_url || '',
            opening_hours: initialData.business_details?.opening_hours || []
        },
        seo_data: {
            main_keywords: initialData.seo_data?.main_keywords || [],
            secondary_keywords: initialData.seo_data?.secondary_keywords || [],
            target_cities: initialData.seo_data?.target_cities || [],
            value_proposition: initialData.seo_data?.value_proposition || '',
        },
        geo_ai_data: {
            client_types: initialData.geo_ai_data?.client_types || [],
            objections: initialData.geo_ai_data?.objections || [],
            differentiators: initialData.geo_ai_data?.differentiators || [],
            proofs: initialData.geo_ai_data?.proofs || [],
            guarantees: initialData.geo_ai_data?.guarantees || [],
            ai_summary_short: initialData.geo_ai_data?.ai_summary_short || '',
            ai_summary_long: initialData.geo_ai_data?.ai_summary_long || ''
        }
    });

    const completeness = calculateCompleteness(formData);

    const handleNestedChange = (category, field, value) => {
        setFormData(prev => ({ ...prev, [category]: { ...prev[category], [field]: value } }));
    };
    const handleBaseChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    const addToArray = (category, field) => {
        setFormData(prev => ({ ...prev, [category]: { ...prev[category], [field]: [...prev[category][field], ''] } }));
    };
    const updateArrayItem = (category, field, index, value) => {
        setFormData(prev => {
            const arr = [...prev[category][field]];
            arr[index] = value;
            return { ...prev, [category]: { ...prev[category], [field]: arr } };
        });
    };
    const removeFromArray = (category, field, index) => {
        setFormData(prev => ({ ...prev, [category]: { ...prev[category], [field]: prev[category][field].filter((_, i) => i !== index) } }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await saveCockpitDataAction(formData);
            if (result?.error) {
                setError(result.error);
                setToast({ message: result.error, type: 'error' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (result?.success) {
                setToast({ message: 'Cockpit sauvegardé avec succès !', type: 'success' });
            }
        });
    };

    const tabs = [
        { id: 'apercu', label: 'Aperçu & Statut', icon: <LayoutDashboard size={18} /> },
        { id: 'identite', label: 'Identité Publique', icon: <UserCircle size={18} /> },
        { id: 'seo', label: 'SEO Local', icon: <Search size={18} /> },
        { id: 'geo', label: 'GEO / Données IA', icon: <Sparkles size={18} /> },
        { id: 'publication', label: 'Publication & Notes', icon: <Send size={18} /> }
    ];

    const inputClass = "w-full px-4 py-2 bg-[#161616] border border-white/10 rounded-lg text-white placeholder:text-white/25 focus:ring-[#5b73ff] focus:border-[#5b73ff] outline-none text-sm";
    const labelClass = "block text-sm font-semibold text-white mb-1";
    const descClass = "text-xs text-white/30 mb-2";

    const ArrayInputGroup = ({ category, field, label, description, placeholder }) => (
        <div className="mb-6">
            <label className={labelClass}>{label}</label>
            {description && <p className={descClass}>{description}</p>}
            <div className="space-y-3">
                {formData[category][field].map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input type="text" value={val} onChange={(e) => updateArrayItem(category, field, idx, e.target.value)} placeholder={placeholder} className={"flex-1 " + inputClass} />
                        <button type="button" onClick={() => removeFromArray(category, field, idx)} className="p-2 text-white/30 hover:text-red-400 transition-colors bg-white/[0.04] hover:bg-red-400/10 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => addToArray(category, field)} className="mt-3 text-sm flex items-center gap-1 text-[#7b8fff] font-medium hover:text-white transition-colors">
                <Plus size={16} /> Ajouter une entrée
            </button>
        </div>
    );

    return (
        <div className="relative flex flex-col lg:flex-row gap-8 items-start">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 flex-shrink-0 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden sticky top-6">
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.07]">
                    <div className="text-xs font-bold text-white/40 uppercase flex justify-between mb-2">
                        Complétude <span className="text-white/60">{completeness}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#5b73ff] to-[#9333ea] transition-all duration-500" style={{ width: completeness + '%' }}></div>
                    </div>
                </div>
                <nav className="flex flex-col p-2 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={"flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all " + (activeTab === tab.id
                                ? 'bg-[#5b73ff]/15 text-[#7b8fff]'
                                : 'text-[#a0a0a0] hover:bg-white/[0.04] hover:text-white'
                            )}
                        >
                            <span className={activeTab === tab.id ? 'text-[#7b8fff]' : 'text-white/25'}>{tab.icon}</span>
                            <span className="flex-1 text-left">{tab.label}</span>
                            {activeTab === tab.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 md:p-8">

                {error && (
                    <div className="mb-6 p-4 bg-red-400/10 border border-red-400/20 text-red-300 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* TAB 1 */}
                    <div className={activeTab === 'apercu' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Aperçu du Profil Client</h2>
                        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-white mb-4">{initialData.client_name} - {initialData.business_type}</h3>
                            <p className="text-sm text-[#a0a0a0] mb-4 leading-relaxed">
                                {formData.business_details.short_desc || <span className="text-white/20 italic">Aucune description courte.</span>}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-6 border-t border-white/[0.07] pt-4">
                                <div><span className="font-semibold block text-white/60">Mots-clés cibles:</span> <span className="text-white/30">{formData.seo_data.main_keywords.filter(Boolean).join(', ') || 'N/A'}</span></div>
                                <div><span className="font-semibold block text-white/60">Villes ciblées:</span> <span className="text-white/30">{formData.seo_data.target_cities.filter(Boolean).join(', ') || 'N/A'}</span></div>
                            </div>
                        </div>
                        <div className="bg-[#5b73ff]/10 border-l-4 border-[#5b73ff] p-4 rounded-r-lg text-sm text-[#7b8fff]">
                            <strong>Information :</strong> Le contenu de ce cockpit enrichit automatiquement la logique Schema.org (JSON-LD) du site, augmentant ainsi la structuration de vos données pour les moteurs IA.
                        </div>
                    </div>

                    {/* TAB 2 */}
                    <div className={activeTab === 'identite' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Identité Publique & Contact</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Téléphone de la boutique</label>
                                    <input type="tel" value={formData.contact_info.phone} onChange={e => handleNestedChange('contact_info', 'phone', e.target.value)} placeholder="+1 514-XXX-XXXX" className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Email Public</label>
                                    <input type="email" value={formData.contact_info.public_email} onChange={e => handleNestedChange('contact_info', 'public_email', e.target.value)} placeholder="contact@exemple.com" className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Lien Google Maps</label>
                                <input type="url" value={formData.business_details.maps_url} onChange={e => handleNestedChange('business_details', 'maps_url', e.target.value)} placeholder="https://maps.google.com/?cid=..." className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Description Courte</label>
                                <p className={descClass}>Utilisée dans les résumés rapides et les en-têtes IA.</p>
                                <textarea value={formData.business_details.short_desc} onChange={e => handleNestedChange('business_details', 'short_desc', e.target.value)} rows={2} className={inputClass + " resize-none"} />
                            </div>
                            <div>
                                <label className={labelClass}>Description Longue</label>
                                <p className={descClass}>Idéale pour intégrer l'historique de l'entreprise et la proposition de valeur détaillée.</p>
                                <textarea value={formData.business_details.long_desc} onChange={e => handleNestedChange('business_details', 'long_desc', e.target.value)} rows={5} className={inputClass + " resize-none"} />
                            </div>
                        </div>
                    </div>

                    {/* TAB 3 */}
                    <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">SEO Local (Ciblage)</h2>
                        <div>
                            <label className={labelClass}>Proposition de Valeur Unique (UVP)</label>
                            <input type="text" value={formData.seo_data.value_proposition} onChange={e => handleNestedChange('seo_data', 'value_proposition', e.target.value)} placeholder="Ex: Le seul garage ouvert 24/7 à Laval" className={inputClass + " mb-6"} />
                        </div>
                        <ArrayInputGroup category="seo_data" field="main_keywords" label="Mots-clés principaux" description="Les 3 ou 4 termes de recherche visés par le client." placeholder="Mot clé..." />
                        <ArrayInputGroup category="seo_data" field="target_cities" label="Villes ou quartiers ciblés" description="Toutes les zones géographiques couvertes par le service." placeholder="Nom de ville..." />
                    </div>

                    {/* TAB 4 */}
                    <div className={activeTab === 'geo' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">GEO : Optimisation IA Contextuelle</h2>
                        <div className="bg-violet-500/10 p-4 border border-violet-500/20 rounded-lg mb-6 text-sm text-violet-300">
                            <strong>Note :</strong> Les moteurs IA adorent les détails précis sur la différenciation pour recommander une entreprise. Nourrissez-les !
                        </div>
                        <ArrayInputGroup category="geo_ai_data" field="differentiators" label="Différenciateurs clés" description="Ce qui rend l'entreprise meilleure que ses voisins." placeholder="Ex: Utilise uniquement des produits bio." />
                        <ArrayInputGroup category="geo_ai_data" field="client_types" label="Types de clients idéaux" description="À qui s'adresse l'entreprise exactement ?" placeholder="Ex: Familles avec jeunes enfants." />
                        <ArrayInputGroup category="geo_ai_data" field="objections" label="Objections fréquentes brisées" description="Réassurances préventives face aux freins à l'achat." placeholder="Ex: Service coûteux -> Plan de financement à 0%." />
                        <div>
                            <label className={labelClass}>Résumé IA Conversationnel</label>
                            <p className={descClass}>Un paragraphe hyper structuré "pitch" pour que les LLMs vous retiennent facilement.</p>
                            <textarea value={formData.geo_ai_data.ai_summary_short} onChange={e => handleNestedChange('geo_ai_data', 'ai_summary_short', e.target.value)} rows={4} className={inputClass + " resize-none"} />
                        </div>
                    </div>

                    {/* TAB 5 */}
                    <div className={activeTab === 'publication' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Publication & Notes Internes</h2>
                        <div className="mb-6 bg-white/[0.02] p-6 rounded-xl border border-white/[0.07]">
                            <label className="block font-bold text-white mb-3">Statut du profiling Cockpit</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { v: 'draft', l: "Brouillon (En cours d'analyse)" },
                                    { v: 'ready', l: 'Prêt (Attente de validation)' },
                                    { v: 'published', l: 'Publié et Actif (Rendu public)' }
                                ].map(status => (
                                    <label key={status.v} className="flex items-center gap-3 cursor-pointer">
                                        <input type="radio" name="publication_status" value={status.v} checked={formData.publication_status === status.v} onChange={(e) => handleBaseChange('publication_status', e.target.value)} className="w-4 h-4 text-[#5b73ff] focus:ring-[#5b73ff] bg-[#161616] border-white/20" />
                                        <span className="text-sm text-[#a0a0a0] font-medium">{status.l}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Notes Internes (Invisibles au public)</label>
                            <p className={descClass}>Pour l'équipe Trouvable uniquement.</p>
                            <textarea value={formData.internal_notes} onChange={e => handleBaseChange('internal_notes', e.target.value)} rows={6} className="w-full px-4 py-2 bg-amber-400/5 border border-amber-400/15 rounded-lg focus:ring-amber-500 outline-none text-sm text-white placeholder:text-white/25 resize-none" />
                        </div>
                    </div>

                    {/* GLOBAL SUBMIT ACTIONS */}
                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-4 sticky bottom-0 bg-[#0f0f0f] pb-4 px-2">
                        <button type="button" onClick={() => router.push('/admin/clients')} className="px-6 py-2 border border-white/10 text-[#a0a0a0] rounded-lg hover:bg-white/[0.04] font-medium transition-colors">
                            Annuler
                        </button>
                        <button type="submit" disabled={isPending} className="px-8 py-2 bg-white text-black rounded-lg hover:bg-[#d6d6d6] font-bold disabled:opacity-50 transition-colors">
                            {isPending ? 'Sauvegarde...' : 'Sauvegarder et Valider'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
