import 'server-only';

export const RECURRING_JOB_TYPES = ['audit_refresh', 'prompt_rerun'];
export const RECURRING_RUN_STATUS = ['pending', 'running', 'completed', 'failed', 'cancelled'];
export const RECURRING_TRIGGER_SOURCES = ['cron', 'manual', 'retry', 'system'];

export const DEFAULT_RECURRING_JOB_CONFIG = {
    audit_refresh: {
        cadence_minutes: 1440,
        retry_limit: 2,
        retry_backoff_minutes: 30,
    },
    prompt_rerun: {
        cadence_minutes: 1440,
        retry_limit: 2,
        retry_backoff_minutes: 20,
    },
};

export const CONNECTOR_PROVIDERS = ['ga4', 'gsc'];
export const CONNECTOR_STATES = ['not_connected', 'configured', 'disabled', 'sample_mode', 'error'];

export const METRIC_KEYS = [
    'seo_score',
    'geo_score',
    'visibility_proxy_percent',
    'mention_rate_percent',
    'citation_coverage_percent',
    'competitor_visibility_count',
];
