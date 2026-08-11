# NEXT TASK — Career Mode Showdown

Last updated: 2026-08-11

Application version: v1.0.2

Runtime asset revision: `1.0.2-r1`

## 1. Read this first

Start with:

1. `00_DEVELOPER_START_HERE.md`
2. this file
3. `POST_V1_ROADMAP_EXECUTION.md`
4. current source files named by the active path below

Do not restart planning and do not return to rejected r3/r4/r5 presentation treatments merely because historical files describe them.

## Current baseline: v1.0.2 Stable

v1.0.2 is the finite owner-directed maintenance response to the August 11 Chromebook screenshots.

Current candidate architecture:

- James Rodríguez uses a clean-anchor photo with no above-photo white wash;
- Marcus Rashford and Anthony Martial use clean right-side photo anchors with decorative geometry behind the photographs;
- desktop Home Marco Reus uses a rectangular right-side player anchor with no diagonal head/neck clipping edge;
- the owner-liked loading screen remains protected;
- Messi and Lahm remain on their protected crop-safe presentation;
- no gameplay, scoring, navigation, storage schema/key, Transfer state-machine, Season Review or analytics behavior is intentionally changed.

## 2. Current technical gate

Branch: `agent/v1.0.2-footballer-tile-maintenance`

PR: `#13 — v1.0.2: rebuild footballer tiles around clean-anchor photography`

The release is not complete merely because source exists.

Before merge/deploy:

1. all eleven permanent workflows must pass on one frozen head;
2. Licensed Football Visuals must pass real desktop/near-breakpoint/mobile Chromium checks;
3. final screenshots must show James readable without washout, Rashford/Martial faces unobstructed, and desktop Reus free of the rejected clipped-head/neck treatment;
4. the protected loading screen must remain regression-green;
5. temporary development workflows/scripts must be removed;
6. exact Pages bytes and the deployed complete journey must pass after merge.

## 3. Current owner gate

Technical status while PR #13 is under validation:

`CANDIDATE IN VALIDATION`

Owner art-direction status:

`PENDING REAL-DEVICE REVIEW OF DEPLOYED V1.0.2`

Automated visual success is not owner acceptance.

After deployment the owner should inspect:

- Home — desktop Marco Reus clean player anchor;
- Create Showdown — James Rodríguez facial contrast and identity plate;
- Transfer Challenge — Marcus Rashford face clarity;
- Transfer Challenge — Anthony Martial consistency;
- loading screen — regression check only, not redesign approval.

## 4. Decision after v1.0.2 deployment

### Path A — owner supplies new rejection evidence

Stay inside the finite `v1.0.x` maintenance lane.

Reproduce the exact screenshot/device failure, fix only that failure class, strengthen its permanent gate, and preserve all accepted systems.

### Path B — owner accepts v1.0.2 or explicitly defers visual review

Exit the finite visual-maintenance lane.

Current feature milestone becomes:

`v1.1.0 Data Safety and Recovery`

First implementation scope remains Candidate A only:

`Versioned Backup Envelope + Non-Mutating Export`

Do not combine Candidate B/C or jump to PWA/profiles/cloud/two-device work.

## 5. Candidate A — exact goal

Create a complete downloadable local backup of the current Career Mode Showdown data without mutating browser storage.

The backup must include:

- active Showdown when present;
- Legacy history;
- application preferences;
- backup format identifier;
- backup format version;
- application version;
- export timestamp;
- record counts;
- corruption-detection checksum metadata;
- explicit warnings if current stored bytes cannot be interpreted safely.

The result must be human inspectable JSON.

The checksum is corruption detection only. Do not describe it as encryption, authentication or tamper-proof signing.

## 6. Candidate A — current source facts

Persistence authority:

`js/storage.js`

Current storage keys:

- `careerModeShowdown.activeShowdown`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

Current Showdown schema:

`2`

Current application-preferences schema:

`2`

Current Showdown ID:

persisted existing `id` created with `Date.now()` at Showdown creation.

Legacy currently compares IDs as strings and uses `updatedAt`/`completedAt` to recognize the current archived revision.

Do not replace those IDs merely to anticipate v1.3. Stable opaque profile/Showdown/Season identities belong to `v1.3.0 Local Profiles and Save Library`.

## 7. Candidate A — required architecture

### Storage authority

All canonical snapshot reads originate through `js/storage.js`.

A helper module may build the envelope/download, but it must not become a second localStorage authority.

### UI surface

Preferred placement is the existing lazy Data Management surface in `js/legacy.js`.

`js/settings.js` already routes Settings → Data Management into Legacy.

Do not create a new top-level route solely for Export Backup unless usability evidence proves the current surface cannot support it cleanly.

### Zero-write rule

Export must not mutate the active save, Legacy, preferences, timestamps, caches or canonical storage bytes.

A Candidate A test must fail if export calls `localStorage.setItem()` or `localStorage.removeItem()`.

## 8. Candidate A — corrupt-data safety

Current v1.0.1 stability behavior deliberately preserves malformed raw storage bytes instead of silently deleting them.

Candidate A must preserve that principle.

If active/Legacy/preferences data cannot be safely parsed or validated:

- do not normalize/write it back;
- do not silently omit the condition;
- present a warning;
- preserve a clearly labeled recoverable representation or recovery path for the raw bytes;
- keep the canonical backup payload honest about what is valid vs damaged.

The implementation must test this behavior explicitly.

## 9. Candidate A — recommended envelope semantics

The exact code shape is not yet implemented, but the backup format must semantically represent:

```text
formatId
formatVersion
appVersion
runtimeRevision (diagnostic only)
exportedAt
checksumAlgorithm
checksum
counts
payload.activeShowdown
payload.legacyShowdowns
payload.preferences
warnings
optional recovery/raw section for unreadable current records
```

The format version, not runtime revision or filename, is the backup migration authority.

Checksum calculation must exclude its own checksum value and use a documented deterministic serialization rule.

## 10. Candidate A — tests and acceptance

Before Candidate A can merge:

1. Empty storage export passes.
2. Active-only export passes.
3. Legacy-only export passes.
4. Preferences-only export passes.
5. Full three-record export passes.
6. Completed active + matching Legacy record is represented intentionally, not confused as two unrelated identities.
7. Current IDs/timestamps survive unchanged.
8. Export performs zero storage writes/removals.
9. Current malformed raw bytes are not erased.
10. Generated checksum verifies.
11. Mutated backup content fails checksum verification.
12. Human-readable JSON download succeeds.
13. Large Legacy history remains responsive.
14. Keyboard/mouse/touch access works.
15. Changed Data Management UI passes accessibility/overflow checks.
16. 1366×768 and 390×844 browser paths pass.
17. Normal and reduced-motion behavior pass.
18. No severe console error, duplicate ID or failed first-party asset remains.
19. Existing gameplay/route/storage regression suites remain green.
20. Runtime cache identity advances if runtime bytes change.
21. Candidate PR and post-merge workflows pass on immutable SHAs.
22. GitHub Pages deploys the exact merge.
23. Public runtime files match merged source.
24. Rollback target is recorded.

## 11. Candidate B — blocked until A is accepted

Candidate B is:

`Import Analysis + Validation + Migration Preview`

It must parse in isolation and perform zero localStorage writes.

It will own:

- input-size ceiling;
- backup-format/checksum validation;
- supported historical schema migrations;
- future-format rejection;
- duplicate/conflict preview;
- active/Legacy/preferences dry-run summary.

Do not implement restore writes in Candidate B.

## 12. Candidate C — blocked until B is accepted

Candidate C is:

`Atomic Restore + Recovery UX`

Before any write it must capture exact raw snapshots of all affected keys.

All writes must go through `js/storage.js`.

Any failed write must roll back every affected key. UI refresh/cache invalidation/navigation happen only after a successful transaction.

Repeated import must be idempotent.

## 13. Later roadmap dependencies remain blocked

Do not begin:

- v1.2 PWA/offline shell before v1.1 recovery foundation;
- v1.3 profiles/save registry before export/import/migrations;
- cloud before stable local identities/save registry/repository boundary;
- accounts merely for their own sake;
- QR/two-device play before reliable cloud/room security foundation;
- public rankings before a verification/privacy/moderation/budget decision gate.

See `POST_V1_ROADMAP_EXECUTION.md` for the full sequence.

## 14. Stable Version 1 contract to preserve

- responsive metallic Home and finite Marco Reus startup;
- exactly two local managers, one browser/device and one active Showdown;
- same selected league and two different permanent clubs assigned once with no reroll;
- explicit League Selected → Continue → League Confirmed checkpoint;
- Transfer Window → Guess Entry → Signing Entry → Verdicts;
- canonical max-11 scoring and 0–0-only tiebreak;
- memory-only Season Review with Edit recovery and one confirmation write;
- centralized Smart Back, save-before-navigation and critical-write rollback;
- derived analytics, Legacy, Trophy Room, Rule Book and Settings;
- seven user-initiated Home media choices with no iframe before Play;
- reduced motion, keyboard focus, contrast and responsive containment;
- current r5 crop-safe required football photography.

## 15. Required developer behavior

- Build directly in GitHub; do not stop to hand code to the owner as the primary deliverable.
- Inspect current source before implementation.
- Avoid planning loops and redoing solved architecture.
- Keep user-visible progress updates during long work.
- Diagnose failures before weakening a gate.
- Do not raise performance ceilings simply to silence a regression.
- Record meaningful actions, failures, decisions, commits, PRs, merge/deployment evidence and owner acceptance status in the rolling handoff.

## 16. Current handoff requirement

The owner requires continuous developer continuity recording.

At each meaningful milestone update:

- `00_DEVELOPER_START_HERE.md` when current state/next-decision changes;
- the rolling development handoff/addendum for detailed chronology;
- `NEXT_TASK.md` when the active coding gate changes;
- `POST_V1_ROADMAP_EXECUTION.md` only when a milestone boundary or dependency interpretation genuinely changes.

Do not let a stale `NEXT_TASK.md` survive after a completed/merged milestone again.