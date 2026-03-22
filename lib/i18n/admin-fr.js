export const ADMIN_GEO_LABELS = {
    nav: {
        overview: 'Vue d ensemble',
        prompts: 'Prompts suivis',
        runs: 'Executions',
        runHistory: 'Historique des executions',
        citations: 'Citations',
        competitors: 'Concurrents',
        models: 'Modeles IA',
        opportunities: 'Centre d opportunites',
        continuous: 'Suivi quotidien',
        social: 'Veille sociale',
        cockpit: 'Cockpit client',
        audit: 'Audit SEO/GEO',
        settings: 'Parametres',
        connectors: 'Connecteurs',
        optimization: 'Optimisation',
        secondary: 'Secondaire',
    },
    actions: {
        runNow: 'Lancer maintenant',
        edit: 'Modifier',
        delete: 'Supprimer',
        save: 'Enregistrer',
        cancel: 'Annuler',
        captureSnapshot: 'Capturer un instantane',
        schedulerTick: 'Lancer le cycle du planificateur',
        runActivePrompts: 'Lancer les prompts actifs',
        runBenchmark: 'Lancer le benchmark',
        rerun: 'Relancer',
        reparse: 'Reparser',
        openPromptWorkspace: 'Ouvrir les prompts suivis',
    },
    status: {
        activeJobs: 'Jobs actifs',
        failedJobs: 'Jobs en echec',
        configured: 'Configure',
        notConnected: 'Non connecte',
        disabled: 'Desactive',
        sampleMode: 'Mode echantillon',
        dailyRefresh: 'Actualisation quotidienne',
        latestExecution: 'Derniere execution',
        nextRefresh: 'Prochaine actualisation',
        noData: 'Aucune donnee',
        running: 'En cours',
        pending: 'En attente',
        completed: 'Terminee',
        failed: 'Echouee',
        cancelled: 'Annulee',
    },
    sections: {
        benchmarkTitle: 'Sandbox comparatif gratuit',
        benchmarkDisclaimer:
            'Comparaison interne de variantes. Ce sandbox ne reproduit pas les experiences natives ChatGPT/Claude/Perplexity.',
        dailyModeTitle: 'Mode quotidien strict',
        dailyModeHint:
            'En mode Hobby, toute cadence inferieure a 24h est automatiquement alignee sur une actualisation quotidienne.',
    },
    benchmark: {
        title: 'Sandbox comparatif gratuit',
        disclaimer: 'Mode de comparaison interne. Ce sandbox ne reproduit pas les experiences natives ChatGPT/Claude/Perplexity.',
    },
};

export function runStatusLabelFr(status) {
    const map = {
        pending: 'En attente',
        running: 'En cours',
        completed: 'Terminee',
        failed: 'Echouee',
        cancelled: 'Annulee',
        no_run: 'Aucune execution',
    };
    return map[status] || status || '-';
}

export function parseStatusLabelFr(status) {
    const map = {
        parsed_success: 'Parse reussi',
        parsed_partial: 'Parse partiel',
        parsed_failed: 'Parse en echec',
    };
    return map[status] || status || '-';
}

export function connectorStatusLabelFr(status) {
    const map = {
        configured: 'Configure',
        sample_mode: 'Mode echantillon',
        not_connected: 'Non connecte',
        disabled: 'Desactive',
        error: 'Erreur',
    };
    return map[status] || status || '-';
}

export function provenanceLabelFr(key) {
    const map = {
        observed: 'Observe',
        derived: 'Derive',
        inferred: 'Infere',
        not_connected: 'Non connecte',
    };
    return map[key] || key;
}
