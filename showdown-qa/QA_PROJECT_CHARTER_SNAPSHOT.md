# QA Project Charter Snapshot

Date captured: 2026-10-04 ET  
Workstream: Career Mode Showdown Quality Assurance & Reliability  
Short name: Showdown QA & Reliability

## Mission

This workstream is evidence-driven QA and reliability review for Career Mode Showdown.

Its bounded responsibilities are:
- extract errors and relevant context from logs and reports;
- classify bug reports and test findings;
- summarize test results and identify regressions;
- reproduce focused failures and determine likely root causes;
- recommend bounded fixes and focused regression checks;
- prepare evidence-based review packets for the main developer.

## Authority boundary

QA is a sibling workstream to the main Career Mode project and Showdown Visual.

QA may inspect evidence and run non-product-mutating checks needed to reproduce or verify a finding.

QA does not:
- implement product-code fixes from this branch;
- change runtime behavior;
- merge;
- deploy;
- claim a fix is shipped or resolved without exact candidate and required verification.

Sol / the main product authority independently verifies current source, refs, pull-request state, reviews, checks and `CURRENT_PRODUCT_GUARDS.json`, then decides whether to accept, revise or reject QA proposals.

Nik remains product owner and source of product scope and constraints.

## Source-of-truth discipline

Before relying on repository facts:
1. resolve current `main`;
2. resolve relevant candidate/recovery/factory refs;
3. resolve open PRs, reviews and exact-head checks;
4. read `AGENTS.md` and current guard/authority files;
5. treat old hashes, handoffs, cached reports and summaries as observations, not current authority;
6. if live state moved, reconcile before acting.

Use the POS20 reasoning loop where applicable:
`OBSERVE -> MODEL -> HYPOTHESIZE -> PLAN -> ACT -> VERIFY -> LEARN -> RECOVER`.

Keep facts separate from hypotheses and state confidence.

CI, emulator, review, merge and deployment evidence do not automatically grant production two-account / physical-device evidence.

## Permanent product constraints preserved by QA proposals

No QA recommendation in this packet is intended to change:
- Firebase billing permanently OFF;
- Spark-only provider path;
- no Cloud Billing linkage / Blaze / Cloud Run / Cloud Functions;
- exactly two private managers;
- pairing plus exact ACTIVE before league/club authority;
- Candidate C alone owns destructive remote-to-local Apply;
- canonical local storage;
- private / remote-by-need scope;
- no public lobby, matchmaking, community, rankings or global leaderboards;
- popup/session-only Google Auth constraints;
- current privacy and retention constraints.

## Finding labels

Use where appropriate:
- `PRODUCT_DEFECT`
- `TEST_DEFECT`
- `PROCESS_DEFECT`
- `INFRA_FLAKE`
- `DUPLICATE`
- `NEEDS_INFO`
- `UNKNOWN`
- `HEAD_MOVED` when evidence is invalidated by a changed or mixed commit head.

## Finding packet standard

A strong finding should include:
1. title, classification, severity and impact;
2. exact version / SHA / environment / run / device where available;
3. minimal reproduction;
4. expected vs observed;
5. logs/screenshots/test output/links;
6. likely root cause marked as hypothesis with confidence;
7. bounded fix recommendation and focused regression check;
8. acceptance criteria and exact regression tests for proposed fixes;
9. remaining unknowns, evidence debt and next verification.

Do not mark a bug resolved until the relevant regression check passes on the accepted exact candidate head and required verification is complete.

## This branch

`qa/showdown-qa-review-2026-10-04` is an evidence/report branch only.

It exists so Claude/Cloud and other reviewers can consume the QA project findings from GitHub without the user carrying files between systems.
