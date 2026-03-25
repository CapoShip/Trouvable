/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Enable gzip/brotli compression — fixes "Applies text compression" audit
    compress: true,
    experimental: {
        optimizeCss: true,
        cssChunking: 'strict',
        inlineCss: true,
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    async headers() {
        return [
            // Long-lived cache for all Next.js static chunks (hashed filenames — safe forever)
            {
                source: '/_next/static/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                ],
            },
            // Extend image cache to 7 days (was 1 day — fixes "Use efficient cache lifetimes")
            {
                source: '/_next/image',
                headers: [
                    { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
                ],
            },
        ];
    },
    async redirects() {
        return [
            // Single-hop canonical redirect: naked → www (collapses the 3-redirect chain to 1)
            {
                source: '/:path*',
                has: [{ type: 'host', value: 'trouvable.app' }],
                destination: 'https://www.trouvable.app/:path*',
                permanent: true,
            },
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
