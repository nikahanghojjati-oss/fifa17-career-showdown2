# Source Manifest

Compiled: 2026-10-04 ET  
Branch: `qa/showdown-qa-review-2026-10-04`

Purpose:
make evidence provenance explicit so a future reviewer can distinguish:
- current live GitHub observations;
- retained project/library evidence;
- earlier QA conversation records;
- reconstructed findings;
- unknown/unavailable sources.

## A. Current live GitHub snapshot used

### Main

Observed:
`8abc561601b75a5a18f03a13ae93be991c5c12bc`

Commit:
`Release r53: game fixes (#348)`

Represented live release:
v1.9.1 r53.

### Team V

Branch:
`factory/v1-wtt5ye`

Observed package head:
`5e05a1f7dd17ac4ecbba7bb12f0cb91ce8c41f41`

Key live files read:
- `project-documents/factory/FACTORY_RULES.md`
- `project-documents/factory/WORKER_HANDBOOK.md`
- `project-documents/factory/BOARD.md`
- `project-documents/factory/reviews/WORKER_SCORECARD.md`
- `project-documents/factory/reviews/FINAL_REVIEW.md`
- `project-documents/factory/PACKAGE.md`
- `project-documents/factory/HANDOFF_TO_SOL.md`
- `project-documents/factory/handoffs/C2W-006_SOL_PACKAGE_NOTES.md`

Observed Team V board state:
238 / 238 jobs complete.

### Team G

Control branch:
`factory/gameplay-v1`

Recovery branch:
`gameplay/recovery-v1`

Recovery head observed during review:
`710121b34a6bb332e67bb9d2dfcd92abccbf9a19`

Key live files read:
- `project-documents/gameplay-factory/RULES.md`
- `project-documents/gameplay-factory/WORKER_HANDBOOK.md`
- `project-documents/gameplay-factory/BOARD.md`
- `project-documents/gameplay-factory/BUG_BOARD.md`
- `project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md`
- `project-documents/gameplay-factory/jobs/JOB-29.md`
- `project-documents/gameplay-factory/status/JOB-27.md`
- `project-documents/gameplay-factory/status/JOB-29.md`

The control branch later moved due automated board commits; therefore the exact branch head itself is not treated as durable product authority here.

### Cross-team relay

Read:
`leads/relay/project-documents/leads-relay/FEED.md`

Important rows included:
- V2G-013: visual package complete;
- V2G-014: worker comparison;
- V2G-015: final polish;
- V2G-016: Nik approved visual package;
- G2V-011 / G2V-012: wiring/integration status.

## B. Root authority files read live

- `AGENTS.md`
- `CURRENT_PRODUCT_GUARDS.json`

Live observation used in finding F2/H08:
- AGENTS says POS20 is active;
- CURRENT_PRODUCT_GUARDS.json still contains `"operatingSystem": "POS10"`.

No assumption is made here about whether the latter is stale intent or provenance. The ambiguity itself is the finding.

## C. Recent PR evidence read

Recent PR metadata was retrieved for the current repo.

Special attention:
- #338 composed Rules regression;
- #339 acknowledgement race;
- #340 Shared Showdown reload/resume;
- #341 accidental factory/cloud PR toward main, DO NOT MERGE;
- #342 r52 gameplay recovery release;
- #343 tied-season docs decision;
- #344 simultaneous-tap retry;
- #345 transfer lock confirmation;
- #346 paired result clash warning;
- #347 career screens;
- #348 r53 release;
- #349 V10 loader/top bar;
- #350 ten-season/session-expiry recovery;
- #352 Rivalry Statistics and History;
- #353 Career Start read fix;
- #354 Start/Join/League/Club V10;
- #355 Rule Book/Settings;
- #356 stale background refresh noise fix;
- #357 Season Results/Final Winner/Standings;
- #358 fewer-taps work;
- #359 simultaneous Season Result STALE handling;
- #360 Home/Audius/Loading;
- #361 header readability;
- #362 Transfer War;
- #363 J10 local reconciliation waiting fix.

Important:
PR state is time-sensitive. Re-check live before using this list operationally.

## D. Retained project/library sources used for historical findings

### Career Mode Showdown Grok Expert Review Conversation, 2026-08-21

Retained file:
`Career_Mode_Showdown_Grok_Expert_Review_Conversation_2026-08-21.txt`

Used for:
- praise of the private/local-first architecture;
- warning that process/documentation complexity had become a first-class risk;
- recommendation to simplify current authority and re-verify live state;
- distinction between source/emulator evidence and production capability.

### ASTRA R44 State of Project and Coaching Request, 2026-09-21

Retained file:
`ASTRA_R44_STATE_OF_PROJECT_AND_COACHING_REQUEST_2026-09-21.md`

Used for:
- real two-account/two-device/two-network evidence gap;
- stale `POS20_CURRENT_STATE.json`;
- stale `MILESTONE_DELIVERY_PROGRESS.json`;
- stale `NEXT_TASK.md`;
- distinction between readiness/evidence score and engineering delivery;
- request for one small current-state authority surface;
- repository cognitive-load statistics/concern.

### Sol browser reliability dossier, 2026-09-23

Retained file:
`SOL6_MASTER_WORK_ENVIRONMENT_BROWSER_RELIABILITY_DOSSIER_2026-09-23 (2).md`

Used for:
- routing/DOM failure classes A-N;
- single-click rule;
- wait-state rule;
- sign-in-first rule;
- mobile Safari rule;
- duplicate-click rule.

### Identity-safe Career Analytics material

Retained source excerpt:
`Pasted text(1).txt`

Used for:
- normalized visible-name longitudinal identity defect;
- stable profile identity semantics;
- unresolved historical identity honesty;
- identity-aware cache revision behavior.

### R19 Physical Journey safe boundary

Retained file:
`CM_SUCCESSOR_HANDOFF_R19_PHYSICAL_JOURNEY_SAFE_BOUNDARY_2026-09-11 (2).md`

Used for:
- MDP vs SSJR separation;
- exact-head publication discipline;
- physical journey credit requirements;
- provider/product constraints.

### Showdown Visual safe-transfer / R9 review sources

Retained examples:
- `SHOWDOWN_VISUAL_R8_44_SAFE_TRANSFER_2026-09-11.md`
- `SOL_R9_REVIEW_AND_COACHING_2026-09-21.pdf`
- `STUDIO_WORKFLOW_AND_ROUTING_V3 (1).md`

Used for:
- visual/product authority separation;
- branch drift review principles;
- model routing history;
- Work-lane intent and budget;
- avoid framework migration without concrete need.

## E. QA project charter source

Current project instruction file:
`01-Project-Instructions.txt`

Used for:
- QA is evidence/review workstream;
- reports belong under `showdown-qa/`;
- Sol/main developer is implementation authority;
- live POS20/source must be re-resolved;
- old handoffs/hashes are observations;
- finding classifications;
- no resolved claim without exact-candidate verification.

A human-readable snapshot is included in:
`showdown-qa/QA_PROJECT_CHARTER_SNAPSHOT.md`.

## F. Earlier QA conversation records

The consolidated ledger also uses prior QA project history that recorded earlier findings, including:

- v1.3 resilience/update ordering defects and Candidate C strict fallback;
- Save Library focus regression;
- normalized-name career identity concern;
- September 25 navigation reliability review;
- stale `NEXT_TASK.md` relative to later main;
- POS20/POS10 authority transition concerns;
- MDP/readiness narrative/accounting mismatch concerns.

These are labeled `PRIOR_QA_RECORD` where the exact old artifact was not independently retrieved during this compilation.

## G. September 25 navigation report retrieval limitation

Prior QA history records:
- branch: `qa/reliability-review-2026-09-25`;
- report: `showdown-qa/reports/2026-09-25-navigation-reliability-repo-review.md`;
- recorded abbreviated head: `1fe30fc`.

On 2026-10-04:
- the branch did not resolve;
- the abbreviated commit did not resolve;
- the old raw report did not resolve.

Therefore this packet includes:
`reports/2026-09-25-navigation-reliability-reconstructed.md`

and clearly labels it a reconstruction from prior QA records.

## H. User-provided Grok share URL limitation

The user supplied a newer Grok share URL during this review.

The available web retrieval path could not render that share page.

This packet does not claim to have read its contents.

The retained August 21 Grok transcript was used instead.

If the newer Grok share contains newer/different findings, add them as a separately dated evidence layer after they can be retrieved. Do not silently overwrite live-GitHub findings.

## I. "Geo" ambiguity

The user referenced how "Geo started and grew."

No distinct model/agent/project phase named Geo was verified in the live repo or retrieved historical material.

Possible intended meanings:
- Grok;
- an early project phase;
- another internal label unavailable to this review.

This is marked UNKNOWN rather than invented.

## J. Generated QA files in this branch

- `showdown-qa/README.md`
- `showdown-qa/QA_PROJECT_CHARTER_SNAPSHOT.md`
- `showdown-qa/SOURCE_MANIFEST.md`
- `showdown-qa/reports/2026-09-25-navigation-reliability-reconstructed.md`
- `showdown-qa/reports/2026-10-04-historical-findings-ledger.md`
- `showdown-qa/reports/2026-10-04-factory-system-master-review.md`
- `showdown-qa/reports/2026-10-04-model-worker-routing-addendum.md`
- `showdown-qa/handoffs/2026-10-04-claude-cloud-review-packet.md`

All are documentation/review artifacts only.

## K. Verification rule for future reviewers

Before accepting a current finding:
1. resolve current main;
2. resolve relevant recovery/factory branch;
3. resolve referenced PR;
4. inspect exact-head checks;
5. compare current source;
6. if evidence moved, label `HEAD_MOVED`;
7. keep historical evidence for learning, but do not let it override current source.

This is especially important because the central finding of this packet is control-plane drift itself.

## L. Model worker routing addendum provenance

The branch also contains `reports/2026-10-04-model-worker-routing-addendum.md`, added during the same QA-project review window and linked into the packet before final verification.

It extends the model-routing discussion with a proposed future QA worker structure:
- GPT-6 Luna Max as deep bug-hunt / adversarial QA worker;
- GPT-5.6 Sol Chat as high-volume general QA/review worker;
- GPT-6.1 Sol Work for environment-heavy investigations;
- Astra Work for rare system-level audit;
- Claude lead for routing/adjudication;
- Sol product authority for implementation.

Its Luna/Astra recommendations are proposals. Unlike the Team V GPT/Claude/Fable scorecard, Luna Max does not yet have a comparable large factory benchmark in this repo. The addendum explicitly recommends measuring matched QA job classes rather than assuming universal superiority.
