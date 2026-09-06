# BUILD-FIRST PRODUCT POLICY

Owner direction, 2026-09-06. This policy applies to current and successor Career Mode Showdown development unless a later explicit owner instruction supersedes it.

## Objective

The project exists to build and ship a playable two-manager Shared Showdown Journey. Testing, continuity, documentation and maintenance protect product work; they are not the product.

Default focused-session allocation should be approximately 75% actual product implementation and 25% validation, maintenance, continuity and publication work. This is a planning target rather than permission to skip a real safety, security, data-integrity or release gate.

`00_HANDOFF_PROXIMITY_STAGE_GATES.md` is the later owner authority for visible Handoff proximity. It prevents the old 99%-for-hours failure mode by tying high percentages to completed publication and handoff stages rather than intuition.

## Build-first operating rules

1. Start each continuing environment from the next owner-authorized unbuilt product dependency. Prefer implementation that visibly advances the playable journey over documentation, test expansion or historical cleanup.
2. During implementation, run the smallest relevant targeted checks for the code being changed. Do not repeatedly run the entire permanent workflow matrix after every small edit when a narrower check can establish the immediate fact.
3. Batch coherent implementation and related corrections before publication. Avoid chains of tiny maintenance commits that each trigger the full CI matrix.
4. When the GitHub connector supports Git tree/commit writes, prefer one atomic multi-file tree commit for a coherent correction batch over one contents-API commit per file. One coherent batch should trigger one meaningful candidate fanout, not many.
5. Do not open the publication PR early merely to use CI as an iterative linter when a local/targeted preflight is available. Build the candidate on its branch, run the smallest relevant checks plus `npm run test:handoff-preflight` when authority/handoff files changed, then open/finalize the PR after preflight is green.
6. Reserve the complete permanent workflow-family gate for a publication boundary, merge candidate, release/security boundary, or a demonstrated regression that genuinely requires broad revalidation.
7. Reuse already accepted evidence. Do not repeat consumed physical acceptance, historical provenance proof, unchanged-runtime deployment proof or previously green capability evidence unless current source demonstrates a regression or the fixed readiness model requires genuinely new evidence.
8. When CI exposes several stale wording or continuity assertions in the same class, inspect the surrounding contracts and correct the class in one bounded batch before rerunning the full matrix. Stale runs from superseded heads are not publication authority.
9. Do not create standalone maintenance, continuity, documentation, test-only or provenance milestones unless they remove an objective blocker to safe product implementation/publication or are required for the current clean handoff boundary.
10. Automated tests should primarily protect implemented behavior and speed future building. Do not expand test surface merely to increase test count or create new process obligations without a concrete product risk.
11. Once a required evidence gate is satisfied, move directly to the next unbuilt SSJR capability instead of extending the proof lane. For the current roadmap, after genuine production-two-account Shared Setup evidence is accepted, the next product-building lane is the authorized transfer/results/scoring journey transport unless live source or a later owner instruction identifies a different blocker.
12. Never trade away permanent locks: billing remains OFF, Firebase remains Spark, pairing + exact ACTIVE precedes league/clubs, exactly two private managers, canonical local save protections remain intact, and Candidate C remains the sole destructive remote-to-local gameplay Apply authority.

## Session budget guardrail

If validation/maintenance exceeds roughly one third of a focused session, classify why before doing more maintenance. Continue beyond that only when an objective security/data-integrity/release blocker is still being resolved. Wording-only or historical-compatibility corrections must be batched and preflighted rather than allowed to consume repeated full-matrix cycles.

## Success criterion

A healthy session should normally leave the playable product materially more capable, not merely better documented or more repeatedly tested. If validation/maintenance begins consuming most of a session without discovering a real product blocker, stop the maintenance loop, record the accepted evidence, and return to implementation.
