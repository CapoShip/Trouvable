import 'server-only';

const PROVENANCE_META = {
    observed: {
        key: 'observed',
        label: 'Observe',
        shortLabel: 'Observe',
        description: 'Observe directement dans les audits, executions, mentions, actions ou donnees client stockees.',
        tone: 'emerald',
    },
    derived: {
        key: 'derived',
        label: 'Derive',
        shortLabel: 'Derive',
        description: 'Calcule de maniere deterministe a partir des donnees observees deja stockees dans Trouvable.',
        tone: 'violet',
    },
    inferred: {
        key: 'inferred',
        label: 'Infere',
        shortLabel: 'Infere',
        description: 'Suggere ou infere via analyse structuree, pas observe directement comme evenement brut.',
        tone: 'amber',
    },
    not_connected: {
        key: 'not_connected',
        label: 'Non connecte',
        shortLabel: 'Non connecte',
        description: 'Cette capacite n est pas encore connectee a une source de donnees active.',
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
