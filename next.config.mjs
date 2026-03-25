import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizeCss: true,
        cssChunking: 'strict',
        inlineCss: true,
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    async redirects() {
        return [
            { source: '/admin/dashboard', destination: '/admin/clients', permanent: false },
            { source: '/admin/dashboard/new', destination: '/admin/clients/new', permanent: false },
            {
                source: '/admin/dashboard/:clientId',
                destination: '/admin/clients/:clientId/overview',
                permanent: false,
            },
            {
                source: '/admin/clients/:id/seo-geo',
                destination: '/admin/clients/:id/overview',
                permanent: false,
            },
        ];
    },
};

export default withSentryConfig(nextConfig, {
    org: 'capoship',
    project: 'javascript-nextjs',
    // Upload source maps en production uniquement
    silent: !process.env.CI,
    widenClientFileUpload: true,
    // Désactive le tunnel Sentry (pas nécessaire sur Vercel)
    disableLogger: true,
    automaticVercelMonitors: false,
});
