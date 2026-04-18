import 'server-only';

import * as db from '@/lib/db';
import '@/lib/ai/tasks/generate-correction-prompt';
import { executeTask } from '@/lib/ai/tasks/registry';
import { getSeoHealthIssues } from '@/lib/operator-intelligence/seo-health-issues';

import { CorrectionPromptValidationError } from './render';
import { buildSeoHealthCorrectionPromptContext } from './seo-health-context';

export class CorrectionPromptServiceError extends Error {
    constructor(message, { status = 500, details = null } = {}) {
        super(message);
        this.name = 'CorrectionPromptServiceError';
        this.status = status;
        this.details = details;
    }
}

function buildTaskInput(context) {
    return {
        issueId: context.problem.issueId,
        clientName: context.source.clientName,
        problemTitle: context.problem.title,
        problemCategory: context.problem.category,
        truthState: context.problem.truthState,
        sourceUrl: context.evidence.sourceUrl || null,
        categoryInstruction: context.constraints.categoryInstruction,
        context,
    };
}

function buildContextSummary(context) {
    return {
        issueId: context.problem.issueId,
        title: context.problem.title,
        category: context.problem.category,
        truthState: context.problem.truthState,
        confidence: context.problem.confidence,
        evidenceSummary: context.evidence.summary,
        recommendedFix: context.evidence.recommendedFix,
        sourceUrl: context.evidence.sourceUrl || null,
        inspectionTargets: context.inspectionTargets,
        verifiedPaths: context.verifiedPaths,
        repoFacts: context.repoFacts,
        validationTargets: context.validationTargets,
        missingFields: context.missingFields,
    };
}

export async function generateSeoHealthCorrectionPrompt({ clientId, issueId, triggerSource = 'manual' }) {
    if (!clientId) {
        throw new CorrectionPromptServiceError('clientId manquant.', { status: 400 });
    }

    if (!issueId) {
        throw new CorrectionPromptServiceError('issueId manquant.', { status: 400 });
    }

    const [client, audit] = await Promise.all([
        db.getClientById(clientId).catch(() => null),
        db.getLatestAudit(clientId).catch(() => null),
    ]);

    if (!client) {
        throw new CorrectionPromptServiceError('Client introuvable.', { status: 404 });
    }

    if (!audit) {
        throw new CorrectionPromptServiceError("Aucun audit exploitable n'est disponible pour ce client.", { status: 404 });
    }

    const issues = getSeoHealthIssues(audit, { limit: null });
    const issue = issues.find((candidate) => candidate.id === issueId);

    if (!issue) {
        throw new CorrectionPromptServiceError('Probleme SEO Health introuvable dans le dernier audit.', { status: 404 });
    }

    const context = buildSeoHealthCorrectionPromptContext({
        client,
        audit,
        issue,
    });

    try {
        const result = await executeTask(
            'generate-correction-prompt',
            buildTaskInput(context),
            {
                clientId,
                triggerSource,
            },
        );

        return {
            issue: {
                id: issue.id,
                title: issue.title,
                priority: issue.priority,
                category: issue.category,
                dimension: issue.dimension,
                truth_class: issue.truth_class,
                confidence: issue.confidence,
            },
            contextSummary: buildContextSummary(context),
            prompts: result.data,
            meta: result.meta,
            runId: result.runId,
            validation: result.validation,
        };
    } catch (error) {
        if (error instanceof CorrectionPromptValidationError) {
            throw new CorrectionPromptServiceError("La generation Mistral n'a pas produit un prompt exploitable.", {
                status: 422,
                details: error.details,
            });
        }

        throw error;
    }
}
