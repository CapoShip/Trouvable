'use client';

import { useEffect } from 'react';

const WEBMCP_TOOLS = [
    {
        name: 'navigate_page',
        description: 'Navigate to a public Trouvable page.',
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
        execute: async ({ path }) => {
            if (typeof path !== 'string' || !path.startsWith('/')) {
                return { ok: false, error: 'invalid_path' };
            }

            window.location.assign(path);
            return { ok: true, navigatedTo: path };
        },
    },
    {
        name: 'open_contact_page',
        description: 'Open the contact page to start a discussion with Trouvable.',
        inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
        },
        execute: async () => {
            window.location.assign('/contact');
            return { ok: true, navigatedTo: '/contact' };
        },
    },
];

function registerViaProvideContext(modelContext) {
    if (typeof modelContext?.provideContext !== 'function') return false;

    modelContext.provideContext({
        tools: WEBMCP_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            execute: tool.execute,
        })),
    });

    return true;
}

function registerViaRegisterTool(modelContext) {
    if (typeof modelContext?.registerTool !== 'function') return false;

    for (const tool of WEBMCP_TOOLS) {
        try {
            modelContext.registerTool({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
                execute: tool.execute,
                annotations: {
                    readOnlyHint: tool.name !== 'open_contact_page',
                },
            });
        } catch {
            // Ignore duplicate-registration or unsupported-browser errors.
        }
    }

    return true;
}

export default function WebMcpProvider() {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const modelContext = window.navigator?.modelContext;
        if (!modelContext) return;

        try {
            const handled = registerViaProvideContext(modelContext);
            if (handled) return;
            registerViaRegisterTool(modelContext);
        } catch {
            // WebMCP API is experimental and can be absent or gated.
        }
    }, []);

    return null;
}
