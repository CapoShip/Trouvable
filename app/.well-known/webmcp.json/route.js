import { listMcpTools } from '@/lib/agent-discovery/mcp-tools';
import { getRequestOrigin } from '@/lib/agent-discovery/config';
import { SITE_LAST_MODIFIED_ISO } from '@/lib/site-config';

export function GET(request) {
    const origin = getRequestOrigin(request);
    const payload = {
        version: '1.0',
        name: 'Trouvable WebMCP Declaration',
        endpoint: `${origin}/mcp`,
        tools: listMcpTools(),
    };

    return Response.json(payload, {
        headers: {
            'Cache-Control': 'public, max-age=3600',
            'Last-Modified': new Date(SITE_LAST_MODIFIED_ISO).toUTCString(),
        },
    });
}
