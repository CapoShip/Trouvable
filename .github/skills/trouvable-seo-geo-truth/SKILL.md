---
name: trouvable-seo-geo-truth
description: Keep Trouvable SEO/GEO work truthful. Use for metadata, JSON-LD, GEO pages, entity descriptions, and structured-data correctness.
---

# Trouvable SEO/GEO truthfulness

Use this skill when the task involves:
- metadata
- canonical tags
- JSON-LD
- GEO pages
- local/business entity descriptions
- internal linking for visibility pages
- structured-data correctness

## Required workflow
1. Inspect the existing metadata and page/entity generation path.
2. Verify what data is actually present in the repo or explicitly provided.
3. Separate confirmed facts from assumptions.
4. Prefer truthfulness over richness.
5. Make the smallest change that improves correctness.

## Rules
- Do not invent local signals, citations, ratings, prices, phone numbers, images, or business facts.
- Do not add placeholders disguised as real data.
- Do not optimize for appearance at the cost of factual accuracy.
- Keep page, metadata, and structured-data consistency aligned.
- Use Tavily only when fresh external facts are genuinely required.

## Output format
1. Current state
2. Truthfulness issue or opportunity
3. Minimal safe change
4. Risk notes
5. Validation steps

## Validation guidance
Check:
- page title/description consistency
- canonical correctness
- JSON-LD truthfulness
- entity/page alignment
- internal-linking side effects