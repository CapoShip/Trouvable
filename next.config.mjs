/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizeCss: true,
        cssChunking: 'strict',
        inlineCss: true,
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
};

export default nextConfig;
