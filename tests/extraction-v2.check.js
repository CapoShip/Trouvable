import assert from 'node:assert/strict';

import { extractUrlsFromText, normalizeDomainHost } from '../lib/geo-query-utils.js';
import { buildExtractionArtifacts } from '../lib/queries/extraction-v2.js';

function runChecks() {
    const urls = extractUrlsFromText('Sources: https://example.com/a, https://example.com/a and https://www.test.com/path.');
    assert.equal(urls.length, 2);
    assert.equal(urls[0], 'https://example.com/a');
    assert.equal(urls[1], 'https://www.test.com/path');

    assert.equal(normalizeDomainHost('https://WWW.Example.com:443/path?q=1'), 'example.com');
    assert.equal(normalizeDomainHost('blog.exemple.ca/abc'), 'blog.exemple.ca');

    const extracted = buildExtractionArtifacts({
        queryText: 'meilleur plombier a Montreal',
        responseText: [
            'Je recommande Plomberie Tremblay et Atlas Plomberie.',
            'Sources: https://www.journalmtl.com/guide et https://journalmtl.com/guide',
            'Voir aussi https://quebec.ca/services/plomberie.',
        ].join(' '),
        analysis: {
            mentioned_businesses: [
                { name: 'Plomberie Tremblay', position: 1, is_target: true, context: 'Plomberie Tremblay est un choix fiable.' },
                { name: 'Atlas Plomberie', position: 2, context: 'Atlas Plomberie est une alternative.' },
            ],
        },
        clientName: 'Plomberie Tremblay',
        competitorAliases: [
            { canonical_name: 'Plomberie Atlas', alias: 'Atlas Plomberie', match_type: 'fuzzy_safe' },
        ],
        knownCompetitors: ['Plomberie Atlas'],
    });

    assert.equal(extracted.parseStatus, 'parsed_success');
    assert.equal(extracted.targetDetection.target_found, true);
    assert.equal(extracted.counts.sources, 3);
    assert.ok(extracted.counts.competitors >= 1);

    const sources = extracted.mentionRows.filter((item) => item.entity_type === 'source');
    assert.equal(sources[0].normalized_domain, 'journalmtl.com');
    assert.ok(sources.every((item) => typeof item.evidence_span === 'string' && item.evidence_span.length > 0));

    const partial = buildExtractionArtifacts({
        queryText: 'comparatif plombier',
        responseText: 'Je ne peux pas confirmer sans plus de details.',
        analysis: null,
        clientName: 'Plomberie Tremblay',
    });

    assert.equal(partial.parseStatus, 'parsed_partial');

    const failed = buildExtractionArtifacts({
        queryText: 'test vide',
        responseText: '',
        analysis: null,
        clientName: 'Plomberie Tremblay',
    });

    assert.equal(failed.parseStatus, 'parsed_failed');
}

runChecks();
console.log('[test] extraction-v2 checks passed');


