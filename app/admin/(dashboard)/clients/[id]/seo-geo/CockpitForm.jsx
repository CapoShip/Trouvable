'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveCockpitDataAction } from './actions';
import Toast from '@/app/admin/(dashboard)/components/Toast';
import {
    LayoutDashboard, UserCircle, Search, Sparkles,
    Send, Info, CheckCircle2, ChevronRight, X, Plus
} from 'lucide-react';

// Helper to calculate completeness
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

    // Mute warnings about controlled/uncontrolled logic by defaulting all arrays/objects
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

    // Dynamic Generic Handler
    const handleNestedChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleBaseChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Array Management Handlers
    const addToArray = (category, field) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: [...prev[category][field], '']
            }
        }));
    };

    const updateArrayItem = (category, field, index, value) => {
        setFormData(prev => {
            const arr = [...prev[category][field]];
            arr[index] = value;
            return {
                ...prev,
                [category]: { ...prev[category], [field]: arr }
            };
        });
    };

    const removeFromArray = (category, field, index) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: prev[category][field].filter((_, i) => i !== index)
            }
        }));
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

    // Array Input Component
    const ArrayInputGroup = ({ category, field, label, description, placeholder }) => (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-800 mb-1">{label}</label>
            {description && <p className="text-xs text-slate-500 mb-3">{description}</p>}

            <div className="space-y-3">
                {formData[category][field].map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={val}
                            onChange={(e) => updateArrayItem(category, field, idx, e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 focus:border-orange-600 outline-none text-sm"
                        />
                        <button type="button" onClick={() => removeFromArray(category, field, idx)} className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-100 hover:bg-red-50 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => addToArray(category, field)} className="mt-3 text-sm flex items-center gap-1 text-orange-600 font-medium hover:text-orange-700 transition-colors">
                <Plus size={16} /> Ajouter une entrée
            </button>
        </div>
    );

    return (
        <div className="relative flex flex-col lg:flex-row gap-8 items-start">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden sticky top-6">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="text-xs font-bold text-slate-500 uppercase flex justify-between mb-2">
                        Complétude <span>{completeness}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${completeness}%` }}></div>
                    </div>
                </div>
                <nav className="flex flex-col p-2 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className={activeTab === tab.id ? 'text-orange-600' : 'text-slate-400'}>{tab.icon}</span>
                            <span className="flex-1 text-left">{tab.label}</span>
                            {activeTab === tab.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* TAB 1: APERÇU */}
                    <div className={activeTab === 'apercu' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-2">Aperçu du Profil Client</h2>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-slate-800 mb-4">{initialData.client_name} - {initialData.business_type}</h3>
                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                {formData.business_details.short_desc || <span className="text-slate-400 italic">Aucune description courte.</span>}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-6 border-t pt-4">
                                <div><span className="font-semibold block text-slate-700">Mots-clés cibles:</span> <span className="text-slate-500">{formData.seo_data.main_keywords.filter(Boolean).join(', ') || 'N/A'}</span></div>
                                <div><span className="font-semibold block text-slate-700">Villes ciblées:</span> <span className="text-slate-500">{formData.seo_data.target_cities.filter(Boolean).join(', ') || 'N/A'}</span></div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg text-sm text-blue-800">
                            <strong>Information :</strong> Le contenu de ce cockpit enrichit automatiquement la logique Schema.org (JSON-LD) du site, augmentant ainsi la structuration de vos données pour les moteurs IA.
                        </div>
                    </div>

                    {/* TAB 2: IDENTITÉ */}
                    <div className={activeTab === 'identite' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-2">Identité Publique & Contact</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1">Téléphone de la boutique</label>
                                    <input
                                        type="tel"
                                        value={formData.contact_info.phone}
                                        onChange={e => handleNestedChange('contact_info', 'phone', e.target.value)}
                                        placeholder="+1 514-XXX-XXXX"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1">Email Public</label>
                                    <input
                                        type="email"
                                        value={formData.contact_info.public_email}
                                        onChange={e => handleNestedChange('contact_info', 'public_email', e.target.value)}
                                        placeholder="contact@exemple.com"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">Lien Google Maps</label>
                                <input
                                    type="url"
                                    value={formData.business_details.maps_url}
                                    onChange={e => handleNestedChange('business_details', 'maps_url', e.target.value)}
                                    placeholder="https://maps.google.com/?cid=..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm bg-slate-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">Description Courte</label>
                                <p className="text-xs text-slate-500 mb-2">Utilisée dans les résumés rapides et les en-têtes IA.</p>
                                <textarea
                                    value={formData.business_details.short_desc}
                                    onChange={e => handleNestedChange('business_details', 'short_desc', e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1">Description Longue</label>
                                <p className="text-xs text-slate-500 mb-2">Idéale pour intégrer l'historique de l'entreprise et la proposition de valeur détaillée.</p>
                                <textarea
                                    value={formData.business_details.long_desc}
                                    onChange={e => handleNestedChange('business_details', 'long_desc', e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* TAB 3: SEO LOCAL */}
                    <div className={activeTab === 'seo' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-2">SEO Local (Ciblage)</h2>

                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1">Proposition de Valeur Unique (UVP)</label>
                            <input
                                type="text"
                                value={formData.seo_data.value_proposition}
                                onChange={e => handleNestedChange('seo_data', 'value_proposition', e.target.value)}
                                placeholder="Ex: Le seul garage ouvert 24/7 à Laval"
                                className="w-full px-4 py-2 mb-6 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm"
                            />
                        </div>

                        <ArrayInputGroup
                            category="seo_data"
                            field="main_keywords"
                            label="Mots-clés principaux"
                            description="Les 3 ou 4 termes de recherche visés par le client (ex: Plombier Urgence Montréal)."
                            placeholder="Mot clé..."
                        />

                        <ArrayInputGroup
                            category="seo_data"
                            field="target_cities"
                            label="Villes ou quartiers ciblés"
                            description="Toutes les zones géographiques couvertes par le service."
                            placeholder="Nom de ville..."
                        />
                    </div>

                    {/* TAB 4: GEO & IA */}
                    <div className={activeTab === 'geo' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-2">GEO : Optimisation IA Contextuelle</h2>
                        <div className="bg-orange-50/50 p-4 border border-orange-100 rounded-lg mb-6 text-sm text-slate-700">
                            <strong>Note :</strong> Les moteurs IA adorent les détails précis sur la différenciation pour recommander une entreprise. Nourrissez-les ! (Notez que les FAQs sont désormais gérées depuis le profil de base du client).
                        </div>

                        <ArrayInputGroup
                            category="geo_ai_data"
                            field="differentiators"
                            label="Différenciateurs clés"
                            description="Ce qui rend l'entreprise meilleure que ses voisins."
                            placeholder="Ex: Utilise uniquement des produits bio."
                        />

                        <ArrayInputGroup
                            category="geo_ai_data"
                            field="client_types"
                            label="Types de clients idéaux"
                            description="À qui s'adresse l'entreprise exactement ?"
                            placeholder="Ex: Familles avec jeunes enfants."
                        />

                        <ArrayInputGroup
                            category="geo_ai_data"
                            field="objections"
                            label="Objections fréquentes brisées"
                            description="Réassurances préventives face aux freins à l'achat."
                            placeholder="Ex: Service coûteux -> Plan de financement à 0% disponible."
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1">Résumé IA Conversationnel</label>
                            <p className="text-xs text-slate-500 mb-2">Un paragraphe hyper structuré "pitch" pour que les LLMs vous retiennent facilement.</p>
                            <textarea
                                value={formData.geo_ai_data.ai_summary_short}
                                onChange={e => handleNestedChange('geo_ai_data', 'ai_summary_short', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-orange-600 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* TAB 5: PUBLICATION & NOTES */}
                    <div className={activeTab === 'publication' ? 'block' : 'hidden'}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b pb-2">Publication & Notes Internes</h2>

                        <div className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <label className="block font-bold text-slate-800 mb-3">Statut du profiling Cockpit</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { v: 'draft', l: 'Brouillon (En cours d\'analyse)' },
                                    { v: 'ready', l: 'Prêt (Attente de validation)' },
                                    { v: 'published', l: 'Publié et Actif (Rendu public)' }
                                ].map(status => (
                                    <label key={status.v} className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="publication_status"
                                            value={status.v}
                                            checked={formData.publication_status === status.v}
                                            onChange={(e) => handleBaseChange('publication_status', e.target.value)}
                                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-slate-700 font-medium">{status.l}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1">Notes Internes (Invisibles au public)</label>
                            <p className="text-xs text-slate-500 mb-2">Pour l'équipe Trouvable uniquement.</p>
                            <textarea
                                value={formData.internal_notes}
                                onChange={e => handleBaseChange('internal_notes', e.target.value)}
                                rows={6}
                                className="w-full px-4 py-2 bg-yellow-50/50 border border-yellow-200 rounded-lg focus:ring-yellow-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* GLOBAL SUBMIT ACTIONS */}
                    <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-4 sticky bottom-0 bg-white pb-4 px-2">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/clients')}
                            className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-8 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isPending ? 'Sauvegarde...' : 'Sauvegarder et Valider'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
