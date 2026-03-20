/**
 * Génère les opportunities à persister (issues déterministes + suggestions IA).
 */
export function generateOpportunities({ clientId, auditId, deterministicIssues, aiOpportunities }) {
    const opps = [];

    for (const issue of deterministicIssues || []) {
        opps.push({
            client_id: clientId,
            audit_id: auditId,
            title: issue.length > 80 ? issue.slice(0, 77) + '...' : issue,
            description: issue,
            priority: 'medium',
            category: guessCategory(issue),
            source: 'observed',
            status: 'open',
        });
    }

    for (const opp of aiOpportunities || []) {
        if (!opp.title || !opp.description) continue;
        opps.push({
            client_id: clientId,
            audit_id: auditId,
            title: opp.title,
            description: opp.description,
            priority: opp.priority || 'medium',
            category: opp.category || 'general',
            source: opp.source || 'recommended',
            status: 'open',
        });
    }

    return opps;
}

function guessCategory(text) {
    const lower = text.toLowerCase();
    if (lower.includes('https') || lower.includes('noindex') || lower.includes('canonical')) return 'technical';
    if (lower.includes('schema') || lower.includes('structuré')) return 'seo';
    if (lower.includes('faq') || lower.includes('contenu')) return 'content';
    if (lower.includes('zone') || lower.includes('géo') || lower.includes('service')) return 'geo';
    if (lower.includes('avis') || lower.includes('confiance') || lower.includes('crédi')) return 'trust';
    return 'seo';
}
