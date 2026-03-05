import { VILLES, EXPERTISES } from "../lib/data/geo-architecture.js";

async function checkJsonLd(url) {
    console.log(`Checking JSON-LD for: ${url}...`);
    const res = await fetch(url);
    const html = await res.text();

    // Match all script tags of type application/ld+json
    const matches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);

    if (!matches) {
        console.warn(`  [!] No JSON-LD found on ${url}`);
        return [];
    }

    const schemas = matches.map(m => {
        const content = m.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error(`  [ERROR] Invalid JSON on ${url}:`, e.message);
            return null;
        }
    }).filter(Boolean);

    schemas.forEach(schema => {
        if (schema["@graph"]) {
            schema["@graph"].forEach(s => validateSchema(s, url));
        } else {
            validateSchema(schema, url);
        }
    });

    return schemas;
}

function validateSchema(schema, url) {
    const type = schema["@type"];
    console.log(`  [OK] Found ${type}`);

    // STRICT RULES: No fake data
    const forbiddenPatterns = [/555-0123/, /placeholder/, /vite\.svg/];
    const str = JSON.stringify(schema);

    forbiddenPatterns.forEach(pattern => {
        if (pattern.test(str)) {
            throw new Error(`  [CRITICAL] Forbidden data pattern ${pattern} found in ${type} at ${url}`);
        }
    });

    // Specific checks
    if (type === "FAQPage") {
        if (!schema.mainEntity || schema.mainEntity.length === 0) {
            throw new Error(`  [ERROR] FAQPage on ${url} is empty`);
        }
    }
    if (type === "BreadcrumbList") {
        if (!schema.itemListElement || schema.itemListElement.length < 2) {
            throw new Error(`  [ERROR] BreadcrumbList on ${url} is too short`);
        }
    }
}

async function main() {
    const baseUrl = "http://localhost:3000";
    const pages = [
        "/",
        ...VILLES.map(v => `/villes/${v.slug}`),
        ...EXPERTISES.map(e => `/expertises/${e.slug}`)
    ];

    let success = true;
    for (const p of pages) {
        try {
            await checkJsonLd(`${baseUrl}${p}`);
        } catch (e) {
            console.error(e.message);
            success = false;
        }
    }

    if (!success) {
        process.exit(1);
    }
    console.log("\n[SUCCESS] All JSON-LD verified and compliant with strict rules.");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
