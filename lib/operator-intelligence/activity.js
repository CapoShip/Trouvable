import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

const SAFE_ACTION_TYPES = [
    'geo_queries_run',
    'geo_query_run_single',
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
        title: 'Site audit completed',
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
            title: 'Tracked runs refreshed',
            description: `${successful}/${total} tracked prompts completed`,
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'geo_query_run_single') {
        const successful = Number(action.details?.successful || 0);
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Tracked prompt run completed',
            description: successful > 0 ? 'Single prompt run completed successfully.' : 'Single prompt run completed with errors.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_created') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Tracked prompt added',
            description: 'A new tracked prompt was added to this client workspace.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_updated') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Tracked prompt updated',
            description: 'Prompt text or classification was updated.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_toggled') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Tracked prompt status changed',
            description: action.details?.is_active ? 'Prompt is active again.' : 'Prompt has been paused.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'tracked_query_deleted') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Tracked prompt removed',
            description: 'A tracked prompt was removed from this client workspace.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'publication_state_changed') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Public profile updated',
            description: action.details?.is_published ? 'The public profile is now published.' : 'The public profile is back in draft mode.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'client_onboarding_started') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Client onboarding started',
            description: 'Minimal intake captured and automatic enrichment was launched.',
            created_at: action.created_at,
            provenance: getProvenanceMeta('observed'),
        };
    }

    if (action.action_type === 'client_onboarding_activated') {
        return {
            id: `action-${action.id}`,
            type: action.action_type,
            title: 'Client onboarding activated',
            description: 'Draft profile was finalized with reviewed suggestions.',
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
            title: 'No recent safe activity yet',
            description: 'Completed audits, tracked-run refreshes, and safe publication changes will appear here once they happen.',
        },
    };
}
