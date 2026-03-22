import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

const SAFE_ACTION_TYPES = [
    'geo_queries_run',
    'geo_query_run_single',
    'geo_query_run_rerun',
    'geo_query_reparse',
    'geo_queries_benchmark_run',
    'tracked_query_created',
    'tracked_query_updated',
    'tracked_query_toggled',
    'tracked_query_deleted',
    'publication_state_changed',
    'client_onboarding_started',
    'client_onboarding_activated',
];

function mapAuditActivity(audit) {
    return {
        id: `audit-${audit.id}`,
        type: 'audit',
        title: 'Audit du site termine',
        description: `SEO ${audit.seo_score ?? '-'} · GEO ${audit.geo_score ?? '-'}`,
        created_at: audit.created_at,
        provenance: getProvenanceMeta('observed'),
    };
}

function mapActionActivity(action) {
    if (action.action_type === 'geo_queries_run') {
        const total = Number(action.details?.total_queries || 0);
        const successful = Number(action.details?.successful || 0);
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Cycle de prompts termine',
            description: `${successful}/${total} prompts suivis executes`,
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'geo_query_run_single') {
        const successful = Number(action.details?.successful || 0);
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Execution unitaire terminee',
            description: successful > 0 ? 'Prompt execute avec succes.' : 'Prompt execute avec erreurs.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'geo_query_run_rerun') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Relance d execution',
            description: 'Une execution existante a ete relancee depuis l inspecteur.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'geo_query_reparse') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Reparse effectue',
            description: 'Le pipeline extraction/citations/concurrents a ete reapplique sur une execution stockee.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'geo_queries_benchmark_run') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Benchmark sandbox execute',
            description: 'Comparaison multi-variantes terminee en mode sandbox gratuit.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_created') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Prompt suivi ajoute',
            description: 'Un nouveau prompt suivi a ete ajoute.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_updated') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Prompt suivi mis a jour',
            description: 'Le texte ou la classification du prompt a ete mis a jour.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_toggled') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Statut prompt modifie',
            description: action.details?.is_active ? 'Prompt reactive.' : 'Prompt mis en pause.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_deleted') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Prompt suivi supprime',
            description: 'Un prompt suivi a ete retire de ce client.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'publication_state_changed') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Profil public mis a jour',
            description: action.details?.is_published ? 'Le profil public est publie.' : 'Le profil public repasse en brouillon.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'client_onboarding_started') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Onboarding demarre',
            description: 'Intake capture puis enrichissement automatique lance.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'client_onboarding_activated') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Onboarding active',
            description: 'Le profil brouillon a ete finalise avec revue operateur.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    return null;
}

export async function getRecentSafeActivity(clientId, limit = 8) {
    const [audits, actions] = await Promise.all([
        db.getRecentAudits(clientId, limit).catch(() => []),
        db.getActions(clientId, SAFE_ACTION_TYPES, limit).catch(() => []),
    ]);

    const auditItems = (audits || [])
        .filter((audit) => audit.scan_status === 'success' || audit.scan_status === 'partial_error')
        .map(mapAuditActivity);

    const actionItems = (actions || []).map(mapActionActivity).filter(Boolean);

    const items = [...auditItems, ...actionItems]
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .slice(0, limit);

    return {
        provenance: getProvenanceMeta('observed'),
        items,
        emptyState: {
            title: 'Aucune activite recente partageable',
            description: 'Les audits termines, executions et changements de publication apparaitront ici.',
        },
    };
}
