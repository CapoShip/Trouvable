import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Capture 10% des transactions en prod pour les performances
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Replay sessions seulement sur erreur (économise le quota)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    // Ne pas logger en dev
    debug: false,

    environment: process.env.NODE_ENV,
});
