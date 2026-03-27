---
name: trouvable-citations-debugging
description: Diagnose broken or misleading citation behavior in Trouvable. Use for missing citations, bad source mapping, weak evidence, and trust issues in generated outputs.
---

# Trouvable citations debugging

Use this skill when the task involves:
- citations panel failures
- missing citations
- incorrect source mapping
- evidence quality issues
- hallucinated-looking references
- broken citation rendering

## Required workflow
1. Identify where citations are created, transformed, stored, and rendered.
2. Trace the full execution path from input to final UI.
3. Distinguish UI rendering bugs from upstream evidence-generation bugs.
4. Verify whether the data is missing, malformed, filtered, or mis-mapped.
5. Prefer the narrowest fix at the real failure point.

## Rules
- Do not assume the bug is visual until the data path is traced.
- Do not treat weak evidence as valid evidence.
- Do not silently patch the UI if the upstream citation structure is wrong.
- Clearly separate confirmed failures from suspected causes.
- When trust is affected, prefer explicit absence over misleading output.

## Output format
1. Symptoms
2. Citation pipeline path
3. Confirmed failure point
4. Minimal fix
5. Validation steps

## Validation guidance
Validate at multiple layers when relevant:
- upstream citation payload
- transformation logic
- storage shape
- final UI rendering
- one focused end-to-end case