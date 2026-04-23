import { SITE_URL } from '@/lib/site-config';

export const MCP_TOOL_DEFINITIONS = [
    {
        name: 'navigate_page',
        description: 'Navigate to a public Trouvable page path.',
        inputSchema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Absolute path on trouvable.app, for example /contact or /offres.',
                },
            },
            required: ['path'],
            additionalProperties: false,
        },
        readOnlyHint: false,
    },
    {
        name: 'open_contact_page',
        description: 'Open the public contact page.',
        inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
        },
        readOnlyHint: false,
    },
    {
        name: 'search_site',
        description: 'Open Trouvable search results page for a query.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query used on /recherche.',
                },
            },
            required: ['query'],
            additionalProperties: false,
        },
        readOnlyHint: false,
    },
];

function safePath(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed.startsWith('/')) return '';
    if (trimmed.startsWith('/admin') || trimmed.startsWith('/portal') || trimmed.startsWith('/espace') || trimmed.startsWith('/api')) {
        return '';
    }
    return trimmed;
}

export function listMcpTools() {
    return MCP_TOOL_DEFINITIONS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
            readOnlyHint: tool.readOnlyHint,
        },
    }));
}

export function executeMcpToolServer(name, args = {}) {
    if (name === 'navigate_page') {
        const path = safePath(args.path);
        if (!path) {
            return { ok: false, error: 'invalid_path' };
        }
        return {
            ok: true,
            action: 'navigate',
            path,
            url: `${SITE_URL}${path}`,
        };
    }

    if (name === 'open_contact_page') {
        return {
            ok: true,
            action: 'navigate',
            path: '/contact',
            url: `${SITE_URL}/contact`,
        };
    }

    if (name === 'search_site') {
        const query = typeof args.query === 'string' ? args.query.trim() : '';
        if (!query) return { ok: false, error: 'missing_query' };
        const url = `${SITE_URL}/recherche?q=${encodeURIComponent(query)}`;
        return {
            ok: true,
            action: 'navigate',
            path: `/recherche?q=${encodeURIComponent(query)}`,
            url,
        };
    }

    return { ok: false, error: 'unknown_tool' };
}
