import Link from 'next/link';
import { EXPERTISES, VILLES } from '@/lib/data/geo-architecture';
import { SITE_URL } from '@/lib/site-config';

const STATIC_PAGES = [
    { title: 'Accueil', href: '/', description: 'Positionnement, mandats et FAQ.' },
    { title: 'La Firme', href: '/a-propos', description: 'Identite et principes Trouvable.' },
    { title: 'Mandats', href: '/offres', description: 'Cartographie, implementation et pilotage continu.' },
    { title: 'Methodologie', href: '/methodologie', description: 'Protocole d execution en 4 etapes.' },
    { title: 'Cadre de mesure', href: '/notre-mesure', description: 'Signal, presence et business sans confusion.' },
    { title: 'Etudes de cas', href: '/etudes-de-cas', description: 'Retours d experience et dossier-type.' },
    { title: 'Contact', href: '/contact', description: 'Demarrer un appel de cadrage.' },
];

export const metadata = {
    title: 'Recherche | Trouvable',
    description: 'Recherche interne des pages publiques Trouvable.',
    alternates: {
        canonical: `${SITE_URL}/recherche`,
    },
};

function normalizeQuery(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();
}

function buildSearchIndex() {
    const expertiseItems = EXPERTISES.map((expertise) => ({
        title: expertise.name,
        href: `/expertises/${expertise.slug}`,
        description: expertise.description,
        keywords: `expertise ${expertise.name} ${expertise.slug}`,
    }));

    const cityItems = VILLES.map((city) => ({
        title: `Visibilite IA a ${city.name}`,
        href: `/villes/${city.slug}`,
        description: city.description,
        keywords: `ville ${city.name} ${city.slug}`,
    }));

    return [...STATIC_PAGES, ...expertiseItems, ...cityItems];
}

function scoreEntry(entry, normalizedQuery) {
    if (!normalizedQuery) return 0;
    const haystack = normalizeQuery(`${entry.title} ${entry.description} ${entry.keywords || ''} ${entry.href}`);
    if (!haystack.includes(normalizedQuery)) return 0;
    if (normalizeQuery(entry.title).includes(normalizedQuery)) return 3;
    if (normalizeQuery(entry.href).includes(normalizedQuery)) return 2;
    return 1;
}

export default async function RecherchePage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const rawQuery = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : '';
    const normalizedQuery = normalizeQuery(rawQuery);

    const index = buildSearchIndex();
    const matches = index
        .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuery) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

    return (
        <main className="min-h-screen bg-[#080808] px-6 py-20 text-[#f0f0f0] sm:px-10">
            <div className="mx-auto max-w-[900px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]">Recherche interne</p>
                <h1 className="mt-3 text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.03em]">Trouver une page Trouvable</h1>
                <p className="mt-4 max-w-[720px] text-[15px] leading-[1.7] text-[#a0a0a0]">
                    Cette recherche couvre les principales pages publiques: offres, methodologie, expertises, villes et ressources de contact.
                </p>

                <form action="/recherche" method="get" className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5" data-agent-surface="search-form">
                    <label htmlFor="site-search-input" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-white/60">
                        Rechercher sur le site
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            id="site-search-input"
                            name="q"
                            type="search"
                            defaultValue={rawQuery}
                            autoComplete="off"
                            aria-label="Recherche sur le site Trouvable"
                            placeholder="Ex: methode, montreal, services residentiels"
                            className="w-full rounded-lg border border-white/12 bg-[#0d0d0d] px-4 py-3 text-[14px] text-white outline-none transition focus:border-[#5b73ff]/60"
                            data-agent-action="search-input"
                        />
                        <button
                            type="submit"
                            className="rounded-lg bg-white px-5 py-3 text-[14px] font-semibold text-black transition hover:bg-[#d9d9d9]"
                            data-agent-action="search-submit"
                        >
                            Rechercher
                        </button>
                    </div>
                </form>

                {normalizedQuery ? (
                    <section className="mt-10" data-agent-surface="search-results">
                        <h2 className="text-[18px] font-semibold tracking-[-0.02em]">
                            {matches.length} resultat{matches.length > 1 ? 's' : ''} pour "{rawQuery}"
                        </h2>
                        {matches.length === 0 ? (
                            <p className="mt-3 text-[14px] text-[#a0a0a0]">
                                Aucun resultat exact. Essayez une recherche plus large comme "offres", "villes" ou "contact".
                            </p>
                        ) : (
                            <ul className="mt-4 space-y-3">
                                {matches.map(({ entry }) => (
                                    <li key={entry.href} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                                        <Link href={entry.href} className="text-[17px] font-semibold text-[#b8c5ff] transition hover:text-white" data-agent-action="search-result-link">
                                            {entry.title}
                                        </Link>
                                        <p className="mt-2 text-[14px] leading-[1.7] text-[#a0a0a0]">{entry.description}</p>
                                        <p className="mt-2 text-[12px] text-white/40">{entry.href}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ) : (
                    <section className="mt-10">
                        <h2 className="text-[18px] font-semibold tracking-[-0.02em]">Pages recommandees</h2>
                        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                            {STATIC_PAGES.map((entry) => (
                                <li key={entry.href} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                                    <Link href={entry.href} className="text-[15px] font-semibold text-[#b8c5ff] transition hover:text-white">
                                        {entry.title}
                                    </Link>
                                    <p className="mt-2 text-[13px] leading-[1.6] text-[#a0a0a0]">{entry.description}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </main>
    );
}
