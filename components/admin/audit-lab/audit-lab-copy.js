/**
 * Dictionnaires de libellés français pour la page interne d'audit opérateur.
 *
 * Centralise toutes les conversions "clé backend" -> "texte lisible opérateur"
 * pour éviter la dispersion des libellés techniques dans l'UI. Toutes les
 * fonctions tolèrent l'absence de valeur et retournent un fallback lisible.
 */

const SEVERITY_LABELS = {
    critical: 'Critique',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
    info: 'Info',
    warn: 'À surveiller',
    warning: 'À surveiller',
};

export function severityFr(value) {
    if (!value) return null;
    const key = String(value).toLowerCase();
    return SEVERITY_LABELS[key] || String(value);
}

export function severityTone(value) {
    const key = String(value || '').toLowerCase();
    if (key === 'critical' || key === 'high') return 'bad';
    if (key === 'medium' || key === 'warn' || key === 'warning') return 'warn';
    if (key === 'low' || key === 'info') return 'neutral';
    return 'neutral';
}

/**
 * Traduit un check déterministe (passed + severity) en statut lisible.
 * - OK : test réussi
 * - À surveiller : échec de sévérité faible/moyenne
 * - Problème : échec de sévérité élevée/critique
 * - Indéterminé : statut non renseigné
 */
export function checkStatusFr(check) {
    if (!check) return { label: 'Indéterminé', tone: 'neutral' };
    if (check.passed === true) return { label: 'OK', tone: 'good' };
    if (check.passed === false) {
        const sev = String(check.severity || '').toLowerCase();
        if (sev === 'critical' || sev === 'high') return { label: 'Problème', tone: 'bad' };
        if (sev === 'medium' || sev === 'warn' || sev === 'warning') return { label: 'À surveiller', tone: 'warn' };
        return { label: 'À corriger', tone: 'warn' };
    }
    return { label: 'Indéterminé', tone: 'neutral' };
}

const CATEGORY_LABELS = {
    technical: 'Technique',
    technical_seo: 'SEO technique',
    on_page: 'Optimisation on-page',
    onpage: 'Optimisation on-page',
    content: 'Contenu',
    ai: 'Intelligence artificielle',
    ai_readiness: 'Lisibilité IA',
    ai_discovery: 'Découverte IA',
    geo: 'GEO',
    geo_signals: 'Signaux GEO',
    brand: 'Marque',
    entity: 'Entité',
    brand_entity: 'Marque / entité',
    trust: 'Confiance',
    trust_stack: 'Signaux de confiance',
    local: 'Local',
    accessibility: 'Accessibilité',
    performance: 'Performance',
    structured_data: 'Données structurées',
    schema: 'Données structurées',
    metadata: 'Métadonnées',
    llms_txt: 'Fichier llms.txt',
    llms_txt_deep: 'Fichier llms.txt',
    robots: 'Robots / indexation',
    indexation: 'Indexation',
    crawl: 'Exploration',
    security: 'Sécurité',
    negative_signals: 'Signaux négatifs',
    ai_discovery_endpoints: 'Endpoints IA',
    citability: 'Citabilité',
};

/**
 * Transforme une clé brute (ex. `technical_seo`) en libellé français lisible.
 * Fallback : remplacement des underscores par des espaces et capitalisation.
 */
export function humanizeCategoryKey(key) {
    if (!key) return '—';
    const raw = String(key);
    const lower = raw.toLowerCase();
    if (CATEGORY_LABELS[lower]) return CATEGORY_LABELS[lower];
    const spaced = raw.replace(/[_\-]+/g, ' ').trim();
    if (!spaced) return raw;
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const PRIORITY_LABELS = {
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Faible',
    critical: 'Critique',
};

export function priorityFr(value) {
    if (!value) return null;
    const key = String(value).toLowerCase();
    return PRIORITY_LABELS[key] || String(value);
}

const CRAWL_STRATEGY_LABELS = {
    sitemap_first: 'Sitemap en priorité',
    sitemap: 'Via sitemap',
    bfs: 'Exploration en largeur',
    seed_bfs: 'Exploration à partir d\u2019une page',
    single_page: 'Page unique',
    homepage_only: 'Page d\u2019accueil uniquement',
};

export function crawlStrategyFr(value) {
    if (!value) return null;
    const key = String(value).toLowerCase();
    return CRAWL_STRATEGY_LABELS[key] || humanizeCategoryKey(value);
}

const RENDER_STRATEGY_LABELS = {
    static_only: 'Analyse statique uniquement',
    static: 'Statique',
    render_on_demand: 'Rendu à la demande',
    render_all: 'Rendu systématique',
    hybrid: 'Rendu hybride',
    playwright: 'Rendu navigateur',
};

export function renderStrategyFr(value) {
    if (!value) return null;
    const key = String(value).toLowerCase();
    return RENDER_STRATEGY_LABELS[key] || humanizeCategoryKey(value);
}

const LLM_STATUS_LABELS = {
    available: 'Disponible',
    failed: 'Dégradée',
    degraded: 'Dégradée',
    skipped: 'Non exécutée',
    unavailable: 'Indisponible',
    pending: 'En attente',
};

export function llmStatusFr(value) {
    if (!value) return null;
    const key = String(value).toLowerCase();
    return LLM_STATUS_LABELS[key] || String(value);
}

const SCAN_STATUS_LABELS = {
    completed: 'Terminé',
    success: 'Terminé',
    succeeded: 'Terminé',
    failed: 'Échec',
    error: 'Échec',
    running: 'En cours',
    pending: 'En attente',
    timeout: 'Délai dépassé',
};

export function scanStatusFr(value) {
    if (!value) return null;
    const key = String(value).toLowerCase();
    return SCAN_STATUS_LABELS[key] || String(value);
}
