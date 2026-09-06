# BUILD-FIRST PRODUCT POLICY

Owner direction, 2026-09-06. This policy applies to current and successor Career Mode Showdown development unless a later explicit owner instruction supersedes it.

## Objective

The project exists to build and ship a playable two-manager Shared Showdown Journey. Testing, continuity, documentation and maintenance protect product work; they are not the product.

Default focused-session allocation should be approximately 75% actual product implementation and 25% validation, maintenance, continuity and publication work. This is a planning target rather than permission to skip a real safety, security, data-integrity or release gate.

## Build-first operating rules

1. Start each continuing environment from the next owner-authorized unbuilt product dependency. Prefer implementation that visibly advances the playable journey over documentation, test expansion or historical cleanup.
2. During implementation, run the smallest relevant targeted checks for the code being changed. Do not repeatedly run the entire permanent workflow matrix after every small edit when a narrower check can establish the immediate fact.
3. Batch coherent implementation and related corrections before publication. Avoid chains of tiny maintenance commits that each trigger the full CI matrix.
4. Reserve the complete permanent workflow-family gate for a publication boundary, merge candidate, release/security boundary, or a demonstrated regression that genuinely requires broad revalidation.
5. Reuse already accepted evidence. Do not repeat consumed physical acceptance, historical provenance proof, unchanged-runtime deployment proof or previously green capability evidence unless current source demonstrates a regression or the fixed readiness model requires genuinely new evidence.
6. When CI exposes several stale wording or continuity assertions in the same class, inspect the surrounding contracts and correct the class in one bounded batch before rerunning the full matrix.
7. Do not create standalone maintenance, continuity, documentation, test-only or provenance milestones unless they remove an objective blocker to safe product implementation/publication or are required for the current clean handoff boundary.
8. Automated tests should primarily protect implemented behavior and speed future building. Do not expand test surface merely to increase test count or create new process obligations without a concrete product risk.
9. Once a required evidence gate is satisfied, move directly to the next unbuilt SSJR capability instead of extending the proof lane. For the current roadmap, after genuine production-two-account Shared Setup evidence is accepted, the next product-building lane is the authorized transfer/results/scoring journey transport unless live source or a later owner instruction identifies a different blocker.
10. Never trade away permanent locks: billing remains OFF, Firebase remains Spark, pairing + exact ACTIVE precedes league/clubs, exactly two private managers, canonical local save protections remain intact, and Candidate C remains the sole destructive remote-to-local gameplay Apply authority.

## Success criterion

A healthy session should normally leave the playable product materially more capable, not merely better documented or more repeatedly tested. If validation/maintenance begins consuming most of a session without discovering a real product blocker, stop the maintenance loop, record the accepted evidence, and return to implementation.
