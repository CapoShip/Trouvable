import { notFound } from "next/navigation";
import { VILLES, EXPERTISES } from "@/lib/data/geo-architecture";
import { resolveVilleComposition } from "@/lib/data/composition";
import { SITE_URL } from "@/lib/site-config";
import VillePageClient from "./VillePageClient";

export function generateStaticParams() {
    return VILLES.map((v) => ({ ville_slug: v.slug }));
}

export async function generateMetadata({ params }) {
    const { ville_slug } = await params;
    const ville = VILLES.find((v) => v.slug === ville_slug);
    if (!ville) return {};

    const title = `Visibilité IA à ${ville.name} — Trouvable`;
    const description = ville.description;

    return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/villes/${ville.slug}` },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/villes/${ville.slug}`,
            siteName: "Trouvable",
            type: "website",
        },
        twitter: { card: "summary" },
        robots: { index: true, follow: true },
    };
}

export default async function VillePage({ params }) {
    const { ville_slug } = await params;
    const ville = VILLES.find((v) => v.slug === ville_slug);
    if (!ville) notFound();

    const composition = resolveVilleComposition(ville);
    const linkedExpertises = ville.linkedExpertises
        .map((s) => EXPERTISES.find((e) => e.slug === s))
        .filter(Boolean);

    return (
        <VillePageClient
            ville={ville}
            composition={composition}
            linkedExpertises={linkedExpertises}
        />
    );
}
