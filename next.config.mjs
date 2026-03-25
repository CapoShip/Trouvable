/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizeCss: true,
        cssChunking: 'strict',
        inlineCss: true,
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    compiler: {
        // Remove all console.log in production
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    // Explicit modern browser targets — eliminates legacy polyfills (Array.at, flat, flatMap,
    // Object.fromEntries, Object.hasOwn, String.trimStart/trimEnd) that waste ~15 KiB
    // These are already covered by the browserslist in package.json but Next.js
    // needs the swcMinify + target hint to skip the polyfill injection at bundle time.
    async redirects() {
        return [
            // --- Domain canonical redirect (single-hop: naked → www)
            // This lives in next.config.mjs so Vercel handles it at the edge
            // before any other redirect, collapsing the 3-redirect chain to 1.
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'trouvable.app' }],
                destination: 'https://www.trouvable.app/:path*',
                permanent: true,
            },
            // --- Internal app redirects (kept as-is, permanent: true for cacheability)
            { source: '/admin/dashboard', destination: '/admin/clients', permanent: true },
            { source: '/admin/dashboard/new', destination: '/admin/clients/new', permanent: true },
            {
                source: '/admin/dashboard/:clientId',
                destination: '/admin/clients/:clientId/overview',
                permanent: true,
            },
            {
                source: '/admin/clients/:id/seo-geo',
                destination: '/admin/clients/:id/overview',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
