import { VILLES, EXPERTISES } from "../lib/data/geo-architecture.js";

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

function checkEntries(label, arr) {
    const slugs = new Set();
    for (const e of arr) {
        assert(e.slug && e.name, `[${label}] slug/name manquant: ${JSON.stringify(e).slice(0, 120)}`);
        assert(!slugs.has(e.slug), `[${label}] slug dupliqué: ${e.slug}`);
        slugs.add(e.slug);

        // no placeholder
        const blob = JSON.stringify(e);
        assert(!blob.includes("'...'") && !blob.includes("..."), `[${label}:${e.slug}] placeholder "..." détecté`);

        // meta description length target
        assert(typeof e.description === "string", `[${label}:${e.slug}] description manquante`);
        const len = e.description.trim().length;
        assert(len >= 120 && len <= 180, `[${label}:${e.slug}] description longueur ${len} (cible ~150-160)`);

        // required arrays
        const reqArrays = label === "VILLE"
            ? ["problems", "methodology", "signals", "faqs", "linkedExpertises"]
            : ["searchIntents", "contentAngles", "useCases", "faqs", "linkedVilles"];

        for (const k of reqArrays) {
            assert(Array.isArray(e[k]) && e[k].length >= 3, `[${label}:${e.slug}] ${k} manquant ou trop court`);
        }
    }
}

checkEntries("VILLE", VILLES);
checkEntries("EXPERTISE", EXPERTISES);

// Basic similarity guard (rough): compare descriptions
function jaccard(a, b) {
    const A = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
    const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
    const inter = [...A].filter(x => B.has(x)).length;
    const union = new Set([...A, ...B]).size;
    return union ? inter / union : 0;
}

function maxPairSimilarity(arr, field) {
    let max = 0, pair = null;
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            const s = jaccard(arr[i][field] ?? "", arr[j][field] ?? "");
            if (s > max) { max = s; pair = [arr[i].slug, arr[j].slug]; }
        }
    }
    return { max, pair };
}

const simCities = maxPairSimilarity(VILLES, "description");
const simExps = maxPairSimilarity(EXPERTISES, "description");

console.log("OK: structure + descriptions");
console.log("Max similarity villes (description):", simCities);
console.log("Max similarity expertises (description):", simExps);

if (simCities.max > 0.75) console.warn("WARN: descriptions villes très proches => risque thin/doorway");
if (simExps.max > 0.75) console.warn("WARN: descriptions expertises très proches => risque thin/doorway");

console.log("DONE");
