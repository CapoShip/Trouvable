/**
 * Composition resolver for programmatic pages.
 *
 * Maps market profiles to deterministic layout configs.
 * All output is serializable — safe to pass from server to client components.
 */

const VILLE_PROFILES = {
    'competitive-fortress': {
        sectionOrder: ['signals', 'methodology', 'problems'],
        problemsHeading: 'L\u2019angle mort concurrentiel',
        problemsDescription: (name) => `Les failles de visibilité exploitables par vos concurrents sur le marché de ${name}.`,
        methodologyHeading: 'L\u2019arsenal de domination',
        methodologyDescription: (name) => `L'infrastructure technique que nous déployons pour contrôler votre visibilité à ${name}.`,
        signalsHeading: 'Les signaux de contrôle',
        signalsDescription: (name) => `Ce que nous mesurons pour maintenir votre avantage concurrentiel à ${name}.`,
        ctaHeadline: (name) => `Établissez votre forteresse à ${name}`,
        ctaDescription: 'Ne laissez pas vos concurrents capter les recommandations IA. Dominez le marché le plus compétitif du Québec.',
        ctaSecondaryLabel: 'Notre méthodologie',
        ctaSecondaryHref: '/methodologie',
    },
    'satellite-differentiation': {
        sectionOrder: ['problems', 'methodology', 'signals'],
        problemsHeading: 'Le piège de la confusion',
        problemsDescription: (name) => `Les mécanismes qui rendent les commerces de ${name} invisibles face à la métropole.`,
        methodologyHeading: 'La différenciation territoriale',
        methodologyDescription: (name) => `L'infrastructure qui affirme votre identité numérique propre à ${name}.`,
        signalsHeading: 'Les marqueurs d\u2019identité',
        signalsDescription: (name) => `Les signaux qui ancrent votre commerce dans le territoire de ${name}.`,
        ctaHeadline: (name) => `Affirmez votre identité à ${name}`,
        ctaDescription: 'Sortez de l\u2019ombre de la métropole. Faites de votre commerce la réponse locale des assistants IA.',
        ctaSecondaryLabel: 'Notre méthodologie',
        ctaSecondaryHref: '/methodologie',
    },
    'tourist-capture': {
        sectionOrder: ['methodology', 'signals', 'problems'],
        problemsHeading: 'Les failles saisonnières',
        problemsDescription: (name) => `Les vulnérabilités de visibilité qui coûtent des clients aux commerces de ${name}.`,
        methodologyHeading: 'L\u2019infrastructure de captation',
        methodologyDescription: (name) => `Le dispositif technique pour capter le flux touristique de ${name} via les IA.`,
        signalsHeading: 'Les signaux de captation',
        signalsDescription: (name) => `Les indicateurs qui garantissent votre présence dans les recommandations touristiques à ${name}.`,
        ctaHeadline: (name) => `Captez les visiteurs de ${name}`,
        ctaDescription: 'Les touristes découvrent les commerces locaux via les IA. Soyez la réponse qu\u2019ils reçoivent.',
        ctaSecondaryLabel: 'Notre méthodologie',
        ctaSecondaryHref: '/methodologie',
    },
    'emerging-opportunity': {
        sectionOrder: ['problems', 'signals', 'methodology'],
        problemsHeading: 'Le terrain vierge',
        problemsDescription: (name) => `L'état actuel de la visibilité IA sur le marché émergent de ${name}.`,
        methodologyHeading: 'L\u2019implantation stratégique',
        methodologyDescription: (name) => `L'infrastructure que nous mettons en place pour prendre position à ${name}.`,
        signalsHeading: 'Les signaux précurseurs',
        signalsDescription: (name) => `Ce que nous mesurons pour consolider votre avance à ${name}.`,
        ctaHeadline: (name) => `Prenez position à ${name} maintenant`,
        ctaDescription: 'Le marché se redéfinit. Les premiers à se positionner dans les IA captent l\u2019avantage.',
        ctaSecondaryLabel: 'Notre méthodologie',
        ctaSecondaryHref: '/methodologie',
    },
};

const EXPERTISE_PROFILES = {
    'demand-capture': {
        contentLayout: 'tabs',
        ctaHeadline: (name) => `Captez la demande en ${name}`,
        ctaDescription: 'Les consommateurs cherchent, les IA recommandent. Soyez la réponse.',
        ctaSecondaryLabel: 'Voir un dossier-type',
        ctaSecondaryHref: '/etudes-de-cas/dossier-type',
    },
    'authority-builder': {
        contentLayout: 'sections',
        ctaHeadline: (name) => `Devenez la référence en ${name}`,
        ctaDescription: 'Construisez l\u2019autorité que les algorithmes reconnaissent et recommandent.',
        ctaSecondaryLabel: 'Voir un dossier-type',
        ctaSecondaryHref: '/etudes-de-cas/dossier-type',
        intentsHeading: 'L\u2019intention de recherche',
        architectureHeading: 'L\u2019architecture sémantique',
        precisionHeading: 'Le niveau de précision exigé',
    },
    'market-gap': {
        contentLayout: 'tabs',
        ctaHeadline: (name) => `Comblez le vide en ${name}`,
        ctaDescription: 'Un marché sous-structuré, une demande en explosion. Positionnez-vous avant vos concurrents.',
        ctaSecondaryLabel: 'Voir un dossier-type',
        ctaSecondaryHref: '/etudes-de-cas/dossier-type',
    },
};

/**
 * Resolve composition config for a ville entry.
 * Returns a plain serializable object safe for server→client boundary.
 */
export function resolveVilleComposition(ville) {
    const comp = ville.composition;
    if (!comp) return null;

    const profile = VILLE_PROFILES[comp.marketProfile];
    if (!profile) return null;

    const name = ville.name;

    return {
        marketProfile: comp.marketProfile,
        sectionOrder: profile.sectionOrder,
        problemsHeading: profile.problemsHeading,
        problemsDescription: profile.problemsDescription(name),
        methodologyHeading: profile.methodologyHeading,
        methodologyDescription: profile.methodologyDescription(name),
        signalsHeading: profile.signalsHeading,
        signalsDescription: profile.signalsDescription(name),
        ctaHeadline: profile.ctaHeadline(name),
        ctaDescription: profile.ctaDescription,
        ctaSecondaryLabel: profile.ctaSecondaryLabel,
        ctaSecondaryHref: profile.ctaSecondaryHref,
        heroAngle: comp.heroAngle,
        marketContext: comp.marketContext,
    };
}

/**
 * Resolve composition config for an expertise entry.
 * Returns a plain serializable object safe for server→client boundary.
 */
export function resolveExpertiseComposition(expertise) {
    const comp = expertise.composition;
    if (!comp) return null;

    const profile = EXPERTISE_PROFILES[comp.marketProfile];
    if (!profile) return null;

    const name = expertise.name;

    return {
        marketProfile: comp.marketProfile,
        contentLayout: profile.contentLayout,
        ctaHeadline: profile.ctaHeadline(name),
        ctaDescription: profile.ctaDescription,
        ctaSecondaryLabel: profile.ctaSecondaryLabel,
        ctaSecondaryHref: profile.ctaSecondaryHref,
        heroAngle: comp.heroAngle,
        marketContext: comp.marketContext,
        ...(profile.intentsHeading ? {
            intentsHeading: profile.intentsHeading,
            architectureHeading: profile.architectureHeading,
            precisionHeading: profile.precisionHeading,
        } : {}),
    };
}
