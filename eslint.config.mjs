import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
    {
        ignores: [
            '.next/**',
            'node_modules/**',
            'out/**',
            'build/**',
            'dist/**',
            'public/**',
        ],
    },
    {
        rules: {
            // --- BLOQUANT : failles de sécurité critiques ---
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-script-url': 'error',

            // --- WARNINGS : code quality progressif ---
            'no-console': ['warn', { allow: ['error', 'warn'] }],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'eqeqeq': ['warn', 'always'],
            'prefer-const': 'warn',
            'no-var': 'warn',
        },
    },
];
