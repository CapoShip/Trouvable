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
            // Pas de console.log oublié en prod (warn pour garder les console.error intentionnels)
            'no-console': ['warn', { allow: ['error', 'warn'] }],

            // Pas de variables déclarées mais jamais utilisées
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

            // Pas d'eval (faille XSS/injection)
            'no-eval': 'error',

            // Pas d'implied eval (setTimeout('code'), setInterval('code'))
            'no-implied-eval': 'error',

            // Pas de script inline dynamique via innerHTML
            'no-script-url': 'error',

            // Toujours utiliser === et !==
            'eqeqeq': ['error', 'always'],

            // Pas de var (utiliser let/const)
            'no-var': 'error',

            // Préférer const quand la variable n'est pas réassignée
            'prefer-const': 'error',
        },
    },
];
