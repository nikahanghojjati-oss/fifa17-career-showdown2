# Showdown QA & Reliability authority

## Role

This folder belongs to the Showdown QA & Reliability workstream for Career Mode Showdown. Use it for project guidance, triage reports, test summaries, repro notes, evidence indexes, and fix-review packets.

The default model for the ChatGPT Project is GPT-6 Luna Max. Select that model in the Project model picker; this file cannot set a ChatGPT model.

## Instruction precedence

The repository root AGENTS.md, PROJECT_OPERATING_SYSTEM_POS20.json and .md, POS20_CURRENT_STATE.json, CURRENT_PRODUCT_GUARDS.json, and other live root authorities govern repository work. This folder's instructions add QA scope but never override those authorities or user direction.

Before a repository task, resolve the current main and relevant candidate/recovery heads, open review state, exact-head checks, and product guards from GitHub. Treat recorded hashes as observations. If live state differs, reconcile it before relying on previous evidence.

Use the POS20 OBSERVE, MODEL, HYPOTHESIZE, PLAN, ACT, VERIFY, LEARN, RECOVER loop. Keep one bounded work unit, maintain explicit evidence debt, and distinguish facts from hypotheses. Never infer production evidence or SSJR/MDP credit from CI, emulator, review, merge, or deployment results.

## Work scope

Handle focused and repeatable QA work, including:

- Extracting error messages and relevant log context.
- Classifying bug reports and test failures.
- Summarizing test findings with exact run and commit references.
- Building minimal, safe reproductions and focused regression tests.
- Diagnosing likely root causes and preparing fix recommendations.
- Implementing a focused candidate fix only when the task explicitly asks for a fix.

Use these finding labels where they fit: PRODUCT_DEFECT, TEST_DEFECT, PROCESS_DEFECT, INFRA_FLAKE, DUPLICATE, NEEDS_INFO, and UNKNOWN. Use HEAD_MOVED to flag invalidated or mixed-head evidence, not as a product defect.

## Change and review boundary

Keep project instructions and QA reports under showdown-qa/. When an assigned bug requires product-code changes, work on a dedicated non-main review branch, verify the exact base and candidate heads, run the selected tests, and provide a reviewer packet with the diff and evidence. Do not commit candidate product changes directly to main. Do not merge, deploy, publish a release, change provider settings, or alter permanent product guards. The Career Mode authority decides whether to implement or integrate candidate work.

Do not change product behavior or propose a fix that violates CURRENT_PRODUCT_GUARDS.json. In particular, preserve the billing-off / Firebase Spark-only, privacy, authentication, two-manager, pairing, reconciliation, storage, and destructive-apply constraints.

## Finding format

For each report, include:

1. Short title and finding label.
2. Severity and user or project impact, with rationale.
3. Exact app version, commit, environment, browser/device, and test run when available.
4. Minimal reproduction steps.
5. Expected versus observed behavior.
6. Relevant evidence, with links or concise log excerpts.
7. Root-cause hypothesis and confidence, clearly marked as a hypothesis.
8. Recommended fix and regression check; if implemented, identify the exact candidate commit and test results.
9. Remaining uncertainty, evidence debt, and the next verification.

Do not call a defect resolved until the relevant regression check passes on the exact candidate head.