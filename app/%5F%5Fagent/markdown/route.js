import { CONTENT_SIGNAL_VALUE, getRequestOrigin } from '@/lib/agent-discovery/config';
import { renderMarkdownFromHtml } from '@/lib/agent-discovery/markdown';

const MARKDOWN_SOURCE_HEADER = 'x-trouvable-markdown-source';

export const runtime = 'nodejs';

function resolveTarget(request) {
    const requestUrl = new URL(request.url);
    const pathParam = requestUrl.searchParams.get('path') || '/';
    const queryParam = requestUrl.searchParams.get('query') || '';

    const safePath = pathParam.startsWith('/') ? pathParam : '/';
    if (safePath.startsWith('/__agent/markdown')) return '/';

    const target = new URL(safePath, getRequestOrigin(request));
    if (queryParam.startsWith('?')) {
        target.search = queryParam;
    }

    return target.toString();
}

function markdownResponse(markdown, estimatedTokens) {
    return new Response(markdown, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            Vary: 'Accept',
            'x-markdown-tokens': String(estimatedTokens),
            'Content-Signal': CONTENT_SIGNAL_VALUE,
            'Cache-Control': 'public, max-age=0, s-maxage=300',
        },
    });
}

export async function GET(request) {
    const targetUrl = resolveTarget(request);

    try {
        const upstream = await fetch(targetUrl, {
            headers: {
                Accept: 'text/html,application/xhtml+xml',
                [MARKDOWN_SOURCE_HEADER]: '1',
            },
            redirect: 'follow',
            cache: 'no-store',
        });

        const html = await upstream.text();
        const rendered = renderMarkdownFromHtml({
            html,
            sourceUrl: targetUrl,
            fallbackTitle: 'Trouvable',
        });

        return markdownResponse(rendered.markdown, rendered.estimatedTokens);
    } catch {
        const fallback = `# Trouvable\n\nMarkdown conversion failed for ${targetUrl}.\n`;
        return markdownResponse(fallback, 18);
    }
}
