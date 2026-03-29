# Bloc 4 — Closeout Audit Report

> Generated from full code inspection of the current repository state.
> Classification: VERIFIED_CODE unless otherwise noted.

## Phase B Addendum

The audit below captures the pre-implementation inspection state. The current branch now includes the following closeout work:

- 4.5 completed: the scoring engine is split across `score-meta.js`, `score-indicators.js`, and `score-rules.js`; `score.js` is reduced to 237 lines and keeps the same `scoreAuditV2` API.
- 4.7 completed for the query domain: tracked-query and query-run logic moved out of `lib/db.js` into dedicated modules, `lib/db/queries.js` now re-exports the canonical query-run implementations, and `lib/db.js` is reduced to 358 lines.
- 4.6 completed: `lib/__tests__/citability.test.js` now validates block extraction, per-block scoring, and page-level aggregation.
- 4.3 completed: `docs/truth-remediation-normalization-boundary.md` documents the truth-contract versus remediation status boundary and the bridge functions.
- 4.1 / 4.4 verified: `run-review-contract.test.js` passes, no fixed `scanner-temp.js` artifact remains in code, and the local harness now uses a disposable runtime module path instead of a hardcoded scanner copy.

---

## PART 0 — Executive Summary

**Bloc 4 status: structurally sound, partially delivered.**

The truth contract system (`lib/truth/`) is fully implemented and correctly integrated into the scoring, opportunity, merge, and operator-review pipelines. The normalization boundary between truth-contract vocabulary and remediation vocabulary is intentional and well-bridged. The scanner consolidation (4.1) and operator review (4.4) are functional.

Two items remain open as **structural debt requiring extraction work** (no behavior changes):
- **4.5** `score.js` (761 lines) — needs split into focused modules
- **4.7** `db.js` (672 lines) — needs continued modularization, reconcile `lib/db/queries.js` duplication

One item needs a **validation artifact** only:
- **4.6** Citability scoring — code is solid, needs a test fixture

One item needs **documentation** only:
- **4.3** Normalization boundary — working correctly, needs explicit documentation of dual-vocabulary bridge

---

## PART 1 — 4.1 Scanner Consolidation

**Status: CLOSED — VERIFIED_CODE**

- `lib/audit/scanner.js` is the canonical scanner entry point.
- No `scanner-temp.js` or duplicate scanner exists.
- Scanner feeds into `scoreAuditV2` via `scanResults` — the chain is intact.
- No regression risk identified.

**Action required:** None.

---

## PART 2 — 4.2 Truth-Contract Alignment

**Status: CLOSED — VERIFIED_CODE**

### Truth contract files (all complete)
| File | Lines | Purpose | Status |
|---|---|---|---|
| `lib/truth/definitions.js` | ~68 | Canonical enums, normalization functions | Complete |
| `lib/truth/problems.js` | ~150 | `normalizeAuditProblem` — truth-compliant issue normalization | Complete |
| `lib/truth/operator-review.js` | ~150 | `normalizeProblemForReview` — operator queue normalization | Complete |
| `lib/truth/detection.js` | ~100 | `buildFact`, `normalizePageFact` — fact-layer for crawl evidence | Complete |

### Integration chain (verified)
1. **Score engine** (`score.js`) imports `normalizeAuditProblems` from `truth/problems.js`
2. **Opportunities** (`opportunities.js`) imports `normalizeTruthClass`, `defaultReviewStatusForTruthClass` from `truth/definitions.js`
3. **Merge suggestions** (`merge.js`) imports from `truth/definitions.js`
4. **Operator review** (`run-review-contract.js`) uses `normalizeProblemForReview` from `truth/operator-review.js`
5. **Remediation mapper** (`problem-mapper.js`) reads truth fields from `review_contract.problems` and propagates into `createProblem`

### Extraction-v2 alignment
`lib/queries/extraction-v2.js` (v2.2.0) extracts structured data from LLM responses. It does not apply truth-contract vocabulary directly — this is correct because truth classification happens downstream in `run-review-contract.js` which receives extraction results and applies `normalizeProblemForReview`.

**Action required:** None.

---

## PART 3 — 4.3 Normalization Boundary

**Status: NEEDS DOCUMENTATION ONLY — VERIFIED_CODE**

### Dual vocabulary (intentional design)

| Layer | Vocabulary | File |
|---|---|---|
| Truth contract | `review_status`: auto_accepted / needs_review / reviewed_confirmed / reviewed_rejected / blocked | `lib/truth/definitions.js` |
| Remediation | `status`: open / in_review / resolved / ignored | `lib/remediation/problem-types.js` |

### Bridge functions (in `lib/truth/operator-review.js`)
- `mapOpportunitySourceToTruthClass` — maps opportunity source → truth_class
- `mapRemediationStatusToReviewStatus` — maps remediation status → review_status
- `mapOpportunityStatusToReviewStatus` — maps opportunity status → review_status
- `mapMergeStatusToReviewStatus` — maps merge status → review_status

These bridges are already implemented and working. The dual vocabulary is correct: truth-contract is for audit provenance tracking, remediation status is for operational workflow.

**Action required:** Add a brief architecture note documenting this boundary (see Phase B).

---

## PART 4 — 4.4 Operator Review Pipeline

**Status: CLOSED — VERIFIED_CODE**

- `lib/queries/run-review-contract.js` exports `buildRunReviewContract` which creates truth-contract-compliant review contracts from query run diagnostics.
- `lib/truth/operator-review.js` provides `normalizeProblemForReview` with full PROBLEM_TYPE_META dictionary (9 problem types).
- The chain `extraction-v2 → run-review-contract → normalizeProblemForReview → review_contract.problems` is intact.
- `problem-mapper.js` reads these back via `problemsFromCanonicalRunReview`.

**Action required:** None.

---

## PART 5 — 4.5 Score.js Split

**Status: OPEN — NEEDS EXTRACTION**

### Current state
- `lib/audit/score.js`: 761 lines
- `lib/audit/score-meta.js`: ~70 lines (already extracted — constants, utilities)

### Proposed split (behavior-preserving)

| New file | Content | ~Lines |
|---|---|---|
| `score-meta.js` | (keep as-is) Constants, DIMENSION_META, utilities | 70 |
| `score-indicators.js` | `makeIndicator` factory + `buildDimensionParts` (indicator definitions) | ~170 |
| `score-rules.js` | `makeIssue`/`makeStrength` factories + all conditional issue/strength push logic | ~400 |
| `score.js` | `collectMetrics`, `scoreAuditV2` orchestrator, `summarizeDimension` + imports from above | ~120 |

### Boundaries
- `score-meta.js` → no changes
- `score-indicators.js` → exports `makeIndicator`, `buildDimensionParts`; imports from `score-meta.js`
- `score-rules.js` → exports `makeIssue`, `makeStrength`, `applyScoreRules`; imports from `score-meta.js`
- `score.js` → imports from all three; exports `scoreAuditV2` (public API unchanged)

### Risk assessment
- **Low risk** — pure extraction, no behavior change
- The only public export is `scoreAuditV2` — all callers import this from `score.js`
- Internal functions become module-private exports (same access, cleaner organization)

---

## PART 6 — 4.6 Citability Validation

**Status: NEEDS TEST FIXTURE ONLY — VERIFIED_CODE**

### Current implementation (solid)
- `lib/audit/citability.js` (~280 lines)
- `collectContentBlocks($, pageUrl)` — cheerio-based DOM traversal, heading-bound block extraction
- `scoreBlockCitability(block)` — 4 sub-scores: specificity (0–25), self_containment (0–25), answer_density (0–25), factual_density (0–25) → total 0–100
- `scorePageCitability(blocks)` — page-level aggregation

### What's needed
A Vitest test fixture that:
1. Feeds known HTML content through `collectContentBlocks`
2. Verifies expected block count and structure
3. Feeds known blocks through `scoreBlockCitability`
4. Asserts score ranges for high-citability vs low-citability content
5. Tests `scorePageCitability` aggregation

**Action required:** Create `lib/__tests__/citability.test.js`.

---

## PART 7 — 4.7 DB.js Modularization

**Status: OPEN — NEEDS CONTINUED EXTRACTION**

### Current state
- `lib/db.js`: 672 lines (facade + inline code)
- Already extracted to `lib/db/`: audits.js, actions.js, competitors.js, benchmarks.js, clients.js, core.js, gsc.js, jobs.js, queries.js, remediation.js, snapshots.js
- Re-exported from db.js: audits, actions, competitors, benchmarks

### What's still inline in db.js (needs extraction)

| Domain | Functions | ~Lines | Target file |
|---|---|---|---|
| Clients | getClientById, getClientBySlug, listClients, createClient, updateClient | ~60 | `lib/db/clients.js` (MERGE — file exists) |
| Tracked queries | getTrackedQueries, createTrackedQuery, getTrackedQueriesAll, updateTrackedQuery, deleteTrackedQuery | ~100 | `lib/db/tracked-queries.js` (NEW) |
| Query runs | createQueryRun, updateQueryRun, getQueryRuns, countQueryRunsForClientSince, getQueryRunById, getQueryRunMentions, getQueryRunsHistory, getCompletedQueryRuns, getRecentQueryRuns, getLastRunPerTrackedQuery | ~130 | `lib/db/query-runs.js` (NEW) |
| Query mentions | createQueryMentions, deleteQueryMentionsByRunId | ~20 | `lib/db/query-runs.js` (include with runs) |
| Opportunities | getOpportunities, archiveOldOpportunities, archiveOldOpportunitiesExceptAudit, createOpportunities, updateOpportunity | ~60 | `lib/db/opportunities.js` (NEW) |
| Merge suggestions | getMergeSuggestions, archiveOldMergeSuggestions, archiveOldMergeSuggestionsExceptAudit, createMergeSuggestions, getMergeSuggestionById, updateMergeSuggestion | ~65 | `lib/db/merge-suggestions.js` (NEW) |
| Client lifecycle | archiveClient, restoreClient, deleteClientHard, getClientGeoMetrics, getLatestOpportunities | ~35 | `lib/db/clients.js` (MERGE) |
| Helpers | normalizeQueryRunRow, validateClientAuditReferences, constraint-drift helpers, debug helpers | ~120 | Keep in db.js or `lib/db/helpers.js` |

### Duplication issue: lib/db/queries.js vs db.js
`lib/db/queries.js` has simpler versions of `getRecentQueryRuns`, `createQueryRun`, `createQueryMentions` that use `db()` from core.js. `lib/db.js` has the full versions with normalization and constraint-drift handling. Resolution: keep the full versions in the extracted modules, remove the simpler duplicates from `lib/db/queries.js`, or consolidate.

### Import pattern
- 34 callers import `* as db from '@/lib/db'`
- db.js must keep re-exporting everything for backward compatibility
- New modules can be imported directly when callers are updated (progressive migration)

### Risk assessment
- **Low risk** — pure extraction with re-exports maintaining backward compatibility
- Constraint-drift helpers are tightly coupled to tracked-query and query-run operations — keep them co-located

---

## Summary — Required Phase B Work

| Priority | Item | Type | Effort |
|---|---|---|---|
| 1 | 4.5 score.js split | Extraction | Medium |
| 2 | 4.7 db.js modularization | Extraction | Medium |
| 3 | 4.3 normalization boundary doc | Documentation | Small |
| 4 | 4.6 citability test fixture | Test | Small |
| 5 | 4.1/4.4 regression check | Verification | Lint + test |
