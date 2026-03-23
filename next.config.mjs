/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizeCss: true,
        cssChunking: 'strict',
        inlineCss: true,
    },
};

export default nextConfig;
