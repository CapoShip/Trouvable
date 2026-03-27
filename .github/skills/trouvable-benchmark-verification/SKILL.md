---
name: trouvable-benchmark-verification
description: Verify benchmark behavior and claims in Trouvable. Use for multi-model runs, output consistency, comparison logic, run duplication, and benchmark truthfulness.
---

# Trouvable benchmark verification

Use this skill when the task involves:
- multi-model benchmark flows
- inconsistent benchmark output
- duplicate runs
- missing benchmark results
- suspect comparison logic
- unreliable benchmark claims

## Required workflow
1. Inspect where benchmark jobs/runs are triggered.
2. Identify how runs are stored, deduplicated, and rendered.
3. Separate orchestration bugs from display bugs.
4. Verify what is actually measured versus what is merely displayed.
5. Only keep benchmark conclusions that are supported by real output.

## Rules
- Do not present assumptions as benchmark facts.
- Do not accept duplicated runs as independent signal.
- Do not trust summary output until run inputs and outputs are traced.
- Prefer reproducible benchmark checks over anecdotal inspection.
- Clearly flag unsupported conclusions.

## Output format
1. Current benchmark path
2. Problem
3. Confirmed cause or uncertainty
4. Minimal fix or verification change
5. Validation steps

## Validation guidance
Prefer:
- one focused benchmark scenario
- run-count verification
- deduplication verification
- storage/result-shape verification
- UI comparison verification