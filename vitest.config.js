import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['**/__tests__/**/*.test.{js,ts}'],
        alias: {
            '@/': new URL('./', import.meta.url).pathname,
        },
    },
});
