import 'server-only';

const PROVENANCE_META = {
    observed: {
        key: 'observed',
        label: 'Observed',
        shortLabel: 'Observed',
        description: 'Directly observed in stored audits, query runs, mentions, actions, or client records.',
        tone: 'emerald',
    },
    derived: {
        key: 'derived',
        label: 'Derived',
        shortLabel: 'Derived',
        description: 'Calculated deterministically from observed records already stored in Trouvable.',
        tone: 'violet',
    },
    inferred: {
        key: 'inferred',
        label: 'Inferred',
        shortLabel: 'Inferred',
        description: 'Suggested or inferred from structured analysis, not directly observed as a raw event.',
        tone: 'amber',
    },
    not_connected: {
        key: 'not_connected',
        label: 'Not connected',
        shortLabel: 'Not connected',
        description: 'This capability is not connected to a live data source yet.',
        tone: 'slate',
    },
};

export function getProvenanceMeta(value) {
    return PROVENANCE_META[value] || PROVENANCE_META.derived;
}

export function mapOpportunitySourceToProvenance(source) {
    if (source === 'observed') return PROVENANCE_META.observed;
    if (source === 'inferred') return PROVENANCE_META.inferred;
    if (source === 'recommended') return PROVENANCE_META.derived;
    return PROVENANCE_META.derived;
}

export function getNotConnectedMeta() {
    return PROVENANCE_META.not_connected;
}
