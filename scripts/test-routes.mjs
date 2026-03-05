// Programmatic route tester for all Trouvable pages
const BASE = 'http://localhost:3000';

const routes = [
    // Homepage
    { url: '/', expect: 'Trouvable' },

    // Villes
    { url: '/villes/montreal', expect: 'Montréal' },
    { url: '/villes/laval', expect: 'Laval' },
    { url: '/villes/quebec', expect: 'Québec' },
    { url: '/villes/longueuil', expect: 'Longueuil' },
    { url: '/villes/brossard', expect: 'Brossard' },

    // Expertises
    { url: '/expertises/restaurants', expect: 'Restaurants' },
    { url: '/expertises/immobilier', expect: 'Immobilier' },
    { url: '/expertises/sante-cliniques', expect: 'Santé' },
    { url: '/expertises/avocats-notaires', expect: 'Avocats' },
    { url: '/expertises/services-residentiels', expect: 'Services Résidentiels' },

    // Sitemap & Robots
    { url: '/sitemap.xml', expect: 'xml' },
    { url: '/robots.txt', expect: 'User-agent' },

    // 404 tests (should return 404 status)
    { url: '/villes/this-does-not-exist', expect404: true },
    { url: '/expertises/invalid-slug', expect404: true },

    // Cross-links: verify links from ville page to expertises
    { url: '/villes/montreal', expectLinks: ['/expertises/restaurants', '/expertises/immobilier', '/expertises/avocats-notaires'] },
    { url: '/expertises/restaurants', expectLinks: ['/villes/montreal', '/villes/quebec', '/villes/laval'] },
];

async function testRoute(route) {
    try {
        const res = await fetch(`${BASE}${route.url}`);
        const status = res.status;
        const body = await res.text();

        if (route.expect404) {
            if (status === 404) {
                console.log(`✅ ${route.url} → 404 (correct)`);
            } else {
                console.error(`❌ ${route.url} → Expected 404, got ${status}`);
            }
            return;
        }

        if (status !== 200) {
            console.error(`❌ ${route.url} → Status ${status}`);
            return;
        }

        if (route.expect && body.includes(route.expect)) {
            console.log(`✅ ${route.url} → 200 OK (contains "${route.expect}")`);
        } else if (route.expect) {
            console.error(`❌ ${route.url} → 200 but MISSING "${route.expect}"`);
        }

        if (route.expectLinks) {
            const missing = route.expectLinks.filter(link => !body.includes(link));
            if (missing.length === 0) {
                console.log(`   ↳ Cross-links OK: ${route.expectLinks.join(', ')}`);
            } else {
                console.error(`   ↳ ❌ Missing cross-links: ${missing.join(', ')}`);
            }
        }
    } catch (err) {
        console.error(`❌ ${route.url} → FETCH ERROR: ${err.message}`);
    }
}

async function main() {
    console.log(`Testing ${routes.length} routes against ${BASE}\n`);
    for (const route of routes) {
        await testRoute(route);
    }
    console.log('\nDONE');
}

main();
