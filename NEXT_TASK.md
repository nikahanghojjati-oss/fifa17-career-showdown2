# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-12
Application version: `v1.1.5`
Runtime asset revision: `1.1.5-r1`
Current production status: merged, GitHub Pages deployed and twice-proven
Immutable v1.1.5 runtime authority: `ff755a9863abc843ae9aac45178428e3a104fc65`
Production evidence: `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`

## Current state

v1.1.5 Restore Transaction Safety Maintenance is closed.

Candidate A export is complete and non-mutating.
Candidate B import analysis is complete and strictly read-only.
Candidate C atomic restore/recovery is complete and protected.

v1.1.5 permanently protects immutable confirmed restore intent, strict exact raw snapshot/precondition authority and transaction-owned reverse rollback with anti-clobber ownership checks.

The release passed all 14 permanent workflow families twice before merge and twice in production on the immutable runtime. The validation topology retains 27 protected executable workflow blocks.

The Stability rerun cancellation issue discovered during release proof was a CI scheduling problem, not an application test failure. The post-release CI hardening prevents reruns/manual dispatches from cancelling an already-active Stability/Candidate B/C proof while preserving stale-run cancellation for fresh first-attempt automatic runs. Burn-In remains non-cancelling and five-pass.

## Sole legal substantive task

Implement v1.2.0 — Installable Offline App.

Do not reopen v1.1.5 release closure unless a new reproducible production defect is found.

Before changing runtime source:

1. read `00_HANDOFF_GOLDEN_RULE.md`;
2. read `00_DEVELOPER_START_HERE.md`;
3. read `PROJECT_STATE.md`;
4. read the v1.2 section of `POST_V1_ROADMAP_EXECUTION.md`;
5. inspect current `main` source and existing cache/runtime revision mechanisms;
6. preserve the immutable v1.1.5 runtime evidence in `CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md`.

## v1.2 outcome

Make Career Mode Showdown installable and reliably usable offline without weakening local data safety, startup performance, navigation authority or accepted presentation.

The milestone should introduce only the minimum PWA/install/offline architecture needed for that outcome.

## v1.2 required design constraints

### Data safety

Service-worker and update logic must not mutate canonical Career Mode data directly.

`js/storage.js` remains canonical local persistence authority.

Candidate A/B/C semantics remain unchanged. Any future downloaded or recovered state must still respect the Candidate C exact-precondition and transaction-owned rollback boundary.

### Update safety

A service worker must not strand a user on a mixed runtime where `index.html`, scripts, styles and lazy modules come from incompatible revisions.

The current `1.1.5-r1` asset-revision model must be studied before designing cache names or update promotion.

Required concerns include:

- atomic-enough cache promotion;
- old-cache cleanup only after a usable new cache exists;
- deterministic offline fallback behavior;
- safe recovery from interrupted service-worker installation/activation;
- update UX that does not destroy unsaved/local state;
- no silent forced navigation during a critical save/restore flow;
- offline behavior for optional/lazy modules;
- external Google Fonts/media failures must not break the core local app.

### Scope boundary

v1.2 does not include:

- accounts or authentication;
- cloud backup/sync;
- multi-save profiles/registry;
- QR pairing;
- two-device play;
- public sharing/rankings;
- scoring/gameplay redesign.

`CLOUD_STORAGE_FOUNDATION.md` remains future architecture contract only.

## Locked systems to preserve

- exactly two managers;
- 1/3/5/10 Season Showdowns;
- same league and different permanent clubs;
- max-11 scoring and 0–0-only tiebreak logic;
- League Wheel explicit Continue checkpoint;
- rivalry confirmation before Showdown start;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics/Legacy/Trophy calculations;
- centralized Smart Back/navigation ownership;
- exactly three current canonical localStorage keys;
- Candidate A backup format version 1;
- Candidate B zero-write analysis;
- Candidate C immutable confirmed intent, strict snapshots and transaction-owned rollback;
- accepted Marco Reus loading/Home presentation;
- licensed route-photo architecture;
- startup performance ceilings.

## Validation expectations for v1.2

Do not weaken the existing release suite.

Any PWA implementation must add deterministic and browser evidence for at least:

- manifest correctness/installability;
- service-worker install/activate/update lifecycle;
- first online load then offline reload;
- direct navigation/reload of important routes under offline conditions as applicable to the SPA;
- lazy module availability offline after the intended caching path;
- interrupted/failed cache population;
- old/new revision separation;
- no canonical storage mutation from service-worker code;
- reduced-motion/mobile/Chromebook compatibility;
- exact runtime revision and deployment provenance.

The existing 14 permanent workflow families and 27 protected workflow-block topology remain authority until an intentional, tested topology migration is made.

## Release-proof discipline

The v1.1.5 Stability incident established a permanent CI rule: do not blanket-rerun a matrix while a long proof of the same workflow/ref is active.

Use the repository concurrency contract and target only a failed/cancelled job when a retry is actually required.

A cancelled job is not a failed assertion. Preserve that distinction in release evidence.

## Completion condition

v1.2 is not complete when a manifest icon merely appears or a browser offers an Install button.

It is complete only when install/offline/update behavior is demonstrably reliable across supported desktop/Chromebook/mobile paths, existing product workflows remain green, local data safety is preserved and the deployed runtime is proven under the project release protocol.

## Continuation command

`Load current main. Read 00_HANDOFF_GOLDEN_RULE.md, 00_DEVELOPER_START_HERE.md, PROJECT_STATE.md, CAREER_MODE_SHOWDOWN_V1.1.5_POST_MERGE.md and the v1.2 section of POST_V1_ROADMAP_EXECUTION.md. v1.1.5 / 1.1.5-r1 is merged, deployed and twice-proven with immutable runtime authority ff755a9863abc843ae9aac45178428e3a104fc65. Candidate A/B/C are complete. Preserve strict exact raw restore preconditions and transaction-owned rollback. The current task is v1.2.0 Installable Offline App only; do not jump to cloud/accounts/profiles/two-device work.`
