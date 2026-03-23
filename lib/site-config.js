/**
 * Configuration that serves as the single source of truth for the site URL
 * and other core technical SEO global constants.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL 
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') 
    : 'https://www.trouvable.app';
