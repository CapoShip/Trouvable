/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizeCss: true,
        cssChunking: 'strict',
    },
};

export default nextConfig;
