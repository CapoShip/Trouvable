import { notFound } from "next/navigation";
import { EXPERTISES, VILLES } from "@/lib/data/geo-architecture";
import { resolveExpertiseComposition } from "@/lib/data/composition";
import { SITE_URL } from "@/lib/site-config";
import ExpertisePageClient from "./ExpertisePageClient";

export function generateStaticParams() {
    return EXPERTISES.map((e) => ({ expertise_slug: e.slug }));
}

export async function generateMetadata({ params }) {
    const { expertise_slug } = await params;
    const expertise = EXPERTISES.find((e) => e.slug === expertise_slug);
    if (!expertise) return {};

    const title = `${expertise.name} — Visibilité IA | Trouvable`;
    const description = expertise.description;

    return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/expertises/${expertise.slug}` },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}/expertises/${expertise.slug}`,
            siteName: "Trouvable",
            type: "website",
        },
        twitter: { card: "summary" },
        robots: { index: true, follow: true },
    };
}

export default async function ExpertisePage({ params }) {
    const { expertise_slug } = await params;
    const expertise = EXPERTISES.find((e) => e.slug === expertise_slug);
    if (!expertise) notFound();

    const composition = resolveExpertiseComposition(expertise);
    const linkedVilles = expertise.linkedVilles
        .map((s) => VILLES.find((v) => v.slug === s))
        .filter(Boolean);

    return (
        <ExpertisePageClient
            expertise={expertise}
            composition={composition}
            linkedVilles={linkedVilles}
        />
    );
}
