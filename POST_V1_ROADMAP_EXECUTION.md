# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-11
Status: repository-native execution companion to the owner-approved August 9 post-v1 roadmap.

## 1. Purpose

The original post-v1 roadmap was created outside the repository and described the future release train in a strong dependency order. This file brings that roadmap into GitHub and deepens it against the actual current source so a future developer can execute it without guessing how milestones connect to the existing architecture.

This is not a new product roadmap and does not reopen settled planning. It preserves the approved order and adds implementation-oriented detail, current-source touchpoints, milestone gates, exclusions, and migration dependencies.

Current source remains the implementation authority.

## 2. Current starting point

Current maintenance release candidate: `v1.1.5`

Current candidate runtime revision: `1.1.5-r1`

Current public production remains immutable v1.1.4 runtime `1a498441a6ccf557aa8b8bc7ced2b3d9cd22cdf7` until the maintenance PR is merged and Pages proof is complete.

Current product model:

- exactly two managers;
- one browser/device;
- one active local Showdown;
- manual FIFA 17 result entry;
- localStorage persistence;
- GitHub Pages deployment;
- static SPA using HTML/CSS/vanilla JavaScript.

Candidate A export, Candidate B read-only import analysis and Candidate C atomic restore/recovery are complete and protected. v1.1.5 is a finite maintenance release that hardens confirmed restore intent, exact storage preconditions and mutation-owned rollback; it does not reopen Candidate A/B/C design.

`CLOUD_STORAGE_FOUNDATION.md` records future identity, revision, conflict, tombstone, privacy and security requirements without adding cloud runtime. After v1.1.5 is merged, Pages-deployed, twice-proven and documentation-sealed, v1.2.0 Installable Offline App is the next substantive roadmap milestone. Stable local profiles/save identity and later cloud readiness remain dependency-ordered after that.

## 3. Permanent rules that every roadmap milestone inherits

### Gameplay integrity

- maximum Season score remains 11;
- performance pair bonus remains maximum +1;
- Top Scorer/Top Assist pair remains maximum +1;
- only 0–0 uses league position then league points;
- equal non-zero scores remain Draw;
- managers use same selected league and different permanent clubs;
- pair is chosen/saved once, no reroll;
- default Wheel remains the accepted top five FIFA 17 era leagues;
- Transfer phase locks/rollback remain authoritative;
- Season Review remains nonpersistent until confirmation.

### Architecture integrity

- `js/screens.js` remains sole navigation/history authority;
- `js/storage.js` remains sole persistence authority;
- `js/analytics.js` remains sole analytics calculation authority;
- critical transitions save first and rollback/block on failure;
- draft writes remain debounced/deduplicated;
- optional/gameplay modules remain lazy unless measurement proves otherwise;
- every changed runtime byte receives a new cache identity;
- no framework rewrite merely for modernization.

### Presentation/rights integrity

- FIFA 17-inspired language remains original and rights-safe;
- no copied EA/FIFA UI artwork, proprietary font, copied menu audio, or official club crests by default;
- local/appropriately licensed photography keeps provenance;
- mobile and Chromebook remain first-class;
- reduced motion always remains a first-class path.

## 4. Dependency chain

`v1.0.x Stability Lane`
→ `v1.1.0 Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Local Profiles and Save Library`
→ `v1.4.0 Legacy 2.0 and Achievements`
→ `v1.5.0 Analytics 2.0`
→ `v1.6.0 Optional Content Packs`
→ `v1.7.0 Challenge Studio`
→ `v1.8.0 Cloud Readiness`
→ `v1.9.0 Cloud Backup Beta`
→ `v2.0.0 Private QR Paired Two-Device Alpha`
→ `v2.1.0 Connected Rivalry`
→ `v2.2.0 Private Sharing and Groups`
→ `v3.0 community/rankings decision gate`

Most important ordering rule:

Cloud and two-device work cannot begin on the present singleton localStorage model. Export/import, migrations, stable identities, a save registry, and a cloud-safe persistence boundary must exist first.

## 5. Release-train matrix

| Version | Outcome | Depends on | Explicitly does not include |
| --- | --- | --- | --- |
| v1.1.0 | validated backup/export/import/recovery | stable v1 schema | profiles, PWA, cloud |
| v1.2.0 | installable/offline shell | recovery foundation | profiles/cloud |
| v1.3.0 | stable local identities + multi-save registry | migrations/export | accounts/cloud |
| v1.4.0 | richer rivalry history + achievements | stable identities | scoring changes |
| v1.5.0 | deeper accessible analytics | identity/history model | global leaderboards |
| v1.6.0 | opt-in content packs | backup + registry | default Wheel replacement |
| v1.7.0 | optional challenge studio | pack/version rules | canonical score changes |
| v1.8.0 | async repository/cloud-ready data model | stable local model | cloud UI/network dependency |
| v1.9.0 | opt-in cloud backup | provider/budget/privacy decision | realtime play |
| v2.0.0 | private QR two-device alpha | remote reliability/security | matchmaking/public rooms |
| v2.1.0 | full connected rivalry | paired alpha | public social network |
| v2.2.0 | private sharing/groups | identity/privacy/backend | public feed/comments |
| v3.0 gate | decide community/rankings | proven demand/integrity/budget | automatic commitment |

## 6. v1.0.x Stability Lane — current exit state

The planned finite stability work has already built strong release evidence:

- deterministic product contracts;
- pinned Chromium/Playwright/axe tooling;
- corrupt active/Legacy/preference fixtures;
- quota rejection and rollback;
- rapid activation/drafts/double submit;
- reload, Smart Back, browser Back/Forward;
- complete Chromebook and mobile journeys;
- exact deployed runtime-byte checks;
- public Pages complete journey;
- Home/Reus and football-photo visual gates.

Current remaining nontechnical exit condition:

- owner real-device acceptance of r5 James/Rashford/Martial, or explicit owner deferral.

No planned `v1.0.2` exists. Only a reproduced release defect justifies another stability patch.

## 7. v1.1.0 — Data Safety and Recovery

### 7.1 Goal

Make all current local user data portable, inspectable, previewable and recoverable before any structural storage expansion.

### 7.2 Why this must come first

Every later migration is safer when the user can export and restore local state.

Without v1.1:

- v1.3 multi-save migration has no robust escape hatch;
- v1.8 cloud readiness would have no tested migration/restore foundation;
- v1.9 remote backup would duplicate an unsolved local recovery problem;
- two-device work would amplify storage mistakes across devices.

### 7.3 Current persistence map

`js/storage.js` owns exactly three localStorage keys:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current preference schema version: `2`.

Current Showdown schema version: `2`.

Legacy is currently stored as an array of Showdown snapshots rather than as a separately versioned archive envelope.

Current caches that Candidate C must remember to invalidate correctly:

- active save presence cache;
- Legacy cache/revision;
- application preferences cache.

Current failure behavior deliberately preserves malformed raw bytes rather than erasing them.

### 7.4 Current identity/revision reality

A new Showdown currently receives:

`id: Date.now()`

That ID is persisted and already functions as current Showdown identity.

Legacy deduplication currently compares Showdown IDs as strings and uses `updatedAt` plus `completedAt` to determine whether an archived revision is already current.

Roadmap implication:

v1.1 should preserve those IDs and build backup conflict logic around the existing identity model. It should not prematurely introduce the opaque manager/Showdown/Season identity redesign reserved for v1.3.

### 7.5 Natural UI location

Settings already describes the local-storage model and sends Data Management into the lazy Legacy module.

Legacy already owns:

- delete one archived Showdown;
- delete all Legacy history;
- reset all Showdown data;
- destructive confirmations;
- transactional rollback around related active/Legacy deletion.

Preferred v1.1 presentation:

add Backup/Import controls to the existing lazy Data Management surface, with Settings continuing to link into it.

Do not create a new top-level route unless usability testing proves the existing surface cannot hold the recovery workflow safely.

## 8. v1.1 Candidate A — Backup Envelope and Non-Mutating Export

### Goal

Create a deterministic downloadable backup containing the complete current application state without writing or normalizing anything back into storage.

### Candidate A implementation boundary

Included:

- active Showdown;
- Legacy history;
- application preferences;
- backup metadata;
- validation status/warnings;
- checksum;
- JSON download;
- export UI;
- deterministic and browser tests.

Excluded:

- importing;
- merging;
- restoring;
- profiles;
- save slots;
- service worker/PWA;
- cloud upload;
- background backup.

### Recommended backup envelope shape

The exact field names may be adjusted during implementation, but the envelope needs these semantic fields:

```text
formatId
formatVersion
appVersion
runtimeRevision (diagnostic only, not a migration authority)
exportedAt
checksumAlgorithm
checksum
counts
payload.activeShowdown
payload.legacyShowdowns
payload.preferences
warnings
```

Do not use filenames, runtime cache revisions, or UI text as schema authority.

### Checksum rule

Use a documented deterministic checksum over canonical backup content with the checksum field excluded from its own digest.

A browser-native SHA-256 implementation through Web Crypto is the preferred direction if compatibility testing passes.

The checksum detects accidental corruption; it is not encryption, authentication, or tamper-proof signing. UI copy must not imply otherwise.

### Corrupt-byte recovery question

Current stability behavior preserves malformed raw localStorage bytes. Candidate A must not silently convert that safety into data loss.

Recommended behavior:

- attempt strict read/parse/validation;
- if a record cannot be parsed, keep the export operation non-mutating;
- show a visible warning;
- preserve a clearly labeled raw recovery representation inside a recovery section or produce a separate recovery warning/export path;
- do not pretend malformed data is valid canonical payload;
- do not erase or overwrite the source bytes.

The final implementation must make this behavior explicit in tests and UI copy.

### Candidate A file ownership

Expected touchpoints:

- `js/storage.js` — authoritative snapshot/read APIs only;
- existing lazy Data Management UI (`js/legacy.js`) — Export Backup action;
- optional helper/module for envelope construction/download if useful, but it must not become a second storage authority;
- tests/contracts — deterministic envelope and zero-write assertions;
- browser audit — real download/large-history/accessibility behavior;
- docs/version/cache files if runtime bytes change.

### Candidate A must prove

1. Export does not call `localStorage.setItem` or `removeItem`.
2. Active/Legacy/preferences are all represented or explicitly warned as unreadable.
3. Export preserves original IDs/timestamps.
4. Repeated export of unchanged data changes only intentionally time-based metadata.
5. Checksum verification succeeds for generated backups.
6. A one-byte payload mutation fails checksum verification.
7. Large Legacy history remains responsive.
8. Downloaded JSON is human inspectable.
9. No account/network call occurs.
10. Chromebook/mobile/keyboard/touch paths work.

## 9. v1.1 Candidate B — Import Analysis and Migration Preview

### Goal

Read a backup in isolation and tell the user exactly what would happen without changing local data.

### Included

- file input/drop target if accessible;
- strict size ceiling before full parse where browser APIs permit;
- JSON parse;
- format ID/version validation;
- checksum verification;
- payload/schema validation;
- ordered migration preview;
- duplicate/conflict analysis;
- summary of active/Legacy/preferences changes;
- dry-run warnings/errors.

### Excluded

- any localStorage write;
- automatic restore;
- profile mapping UI reserved for v1.3 unless historical v1.1 fixtures genuinely require a narrowly scoped ambiguity prompt;
- cloud upload.

### Migration registry rule

Do not scatter old-data fixes across random import code.

Use an ordered migration pipeline with explicit source/target schema versions and fixtures.

A migration must be:

- deterministic;
- non-mutating to the input object where practical;
- idempotent when rerun against already-migrated output;
- covered by golden old-data fixtures.

### Conflict-preview identity rule

For v1.1, compare existing Showdown IDs as strings.

Suggested conflict categories:

- new record;
- exact duplicate;
- same ID, same effective revision;
- same ID, different revision;
- malformed/unresolvable record.

Do not silently resolve same-ID/different-content conflicts during preview.

### Future-format rule

A backup with a newer unsupported format or data schema must fail closed with a clear message. Do not best-effort write unknown future data.

## 10. v1.1 Candidate C — Atomic Restore and Recovery UX

### Goal

Apply explicit user choices atomically and guarantee rollback if any write fails.

### Required pre-commit sequence

1. flush pending application writes;
2. revalidate the analyzed backup/fingerprint so preview cannot be stale;
3. capture exact raw snapshots of all affected storage keys;
4. record user restore choices;
5. compute final candidate values in memory;
6. write through `js/storage.js` only;
7. if any write fails, restore every affected raw key;
8. verify rollback itself;
9. only after successful commit invalidate caches and refresh UI/canonical route.

### Restore choices

The UI must clearly separate:

- active Showdown replacement;
- Legacy merge;
- preference restore.

Import never silently replaces active data.

### Legacy merge expectations

- preserve IDs;
- exact duplicates do not multiply;
- conflicting same-ID records require explicit resolution policy;
- re-import of the same backup is idempotent;
- a completed active save that is also in Legacy must not create accidental duplicate history.

### Rollback failure handling

If the initial import write fails and rollback also fails, surface an explicit high-severity recovery message and retain as much raw evidence as possible. Do not continue navigation as if the import succeeded.

## 11. v1.1 fixture corpus

Before Candidate A implementation freezes, create/identify fixtures for:

- empty storage;
- active Showdown only;
- Legacy only;
- preferences only;
- active + Legacy + preferences;
- completed active also represented in Legacy;
- schema-1 historical Showdown;
- schema-2 current Showdown;
- preference schema 1;
- preference schema 2;
- malformed active JSON;
- malformed Legacy JSON;
- invalid Legacy shape;
- malformed preferences;
- duplicate Legacy IDs;
- same ID / differing timestamps/content;
- future backup format;
- future Showdown schema;
- oversized input;
- checksum mismatch;
- quota rejection during Candidate C;
- partial write failure at each affected key;
- rollback write failure fixture;
- repeated import/idempotence.

The owner-approved roadmap explicitly requires migration fixtures for every supported historical schema.

## 12. v1.2.0 — Installable Offline App

### Goal

Make the core local tracker installable and bootable without network access.

### Depends on

v1.1 recovery foundation.

### Required deliverables

- web app manifest;
- original icons/theme metadata;
- service worker for versioned first-party shell;
- atomic cache activation;
- visible Update Ready flow;
- offline status and graceful external-media unavailable state;
- install behavior for Chromebook/Android and browser-appropriate guidance elsewhere;
- first-load/repeat-load/offline/update/rollback/cache-corruption tests.

### Critical risk

A stale service worker can mix or pin incompatible runtime revisions.

Do not ship until two consecutive cache-revision upgrade/rollback tests prove HTML/CSS/JS never mix across builds.

### Rights/privacy boundary

Do not blindly cache YouTube or other external media. Offline gameplay must not depend on those resources.

## 13. v1.3.0 — Local Manager Profiles and Save Library

### Goal

Move from one active singleton save to a versioned local registry with stable identities.

### Depends on

v1.1 export/import/migrations.

### Data-model responsibilities

- stable opaque manager IDs;
- stable opaque Showdown IDs;
- stable Season IDs;
- stable content-pack IDs where needed;
- editable manager display names independent of identity;
- versioned local save registry;
- several in-progress local Showdowns;
- explicit selected current Showdown;
- Legacy remains preserved;
- migration from current singleton active + Legacy without duplication.

### Critical historical-name risk

Current all-time analytics normalize manager names. Historical data may contain:

- same person with spelling variation;
- two different people with the same display name.

Do not silently merge by name or silently split by spelling.

Ambiguous migration requires an owner/user-reviewed mapping step.

### UX

- recurring manager profiles;
- save library with club pairing/current Season/status/last update;
- resume;
- rename;
- archive;
- duplicate as template;
- delete with confirmation.

Local one-active-save simplicity should remain a convenient default experience.

## 14. v1.4.0 — Legacy 2.0 and Achievement Engine

### Depends on

stable identities from v1.3.

### Deliverables

- chronological rivalry timeline;
- record book;
- streaks/comebacks/perfect-11/title sweeps/repeated pairings/Transfer outcomes;
- achievement definitions with stable IDs/versions;
- retroactive derivation;
- optional Season notes/moment labels;
- reduced-motion milestone presentation;
- local downloadable summary cards;
- filters by manager/club/league/Showdown/date.

Achievements never alter score or winner.

Persist only authored notes or non-derivable state; derive achievements where possible.

## 15. v1.5.0 — Analytics 2.0

### Depends on

stable identities/history.

### Candidate metrics

- head-to-head Showdown/Season record;
- current/longest streaks;
- score distribution/margin;
- club/league performance;
- trophy mix/conversion;
- 100-point/100-goal frequency;
- Top Scorer/Assist frequency;
- Transfer guess accuracy/release rate;
- performance by Showdown length;
- Season-order/time trends;
- rivalry lead changes.

### Presentation rules

- lightweight SVG/CSS/native elements;
- table alternative for every chart;
- keyboard filters;
- empty/partial/insufficient-sample states;
- no misleading prediction;
- no persistent analytics cache without profiling evidence.

## 16. v1.6.0 — Optional Content Packs

### Goal

Expand choice without changing the canonical five-league default.

### Deliverables

- versioned pack format;
- league/club/color/metadata/procedural identity seeds;
- optional researched FIFA 17-era league packs;
- local custom pool editor;
- import/export integration;
- deterministic same-league/different-club validation;
- rights/source metadata;
- pack tests for counts/IDs/overflow/pairing/crest determinism.

Official club crests remain excluded by default.

## 17. v1.7.0 — Challenge Studio

### Goal

Add optional replay-value rules while preserving canonical mode.

Possible presets:

- Road to Glory;
- Fallen Giants;
- Youth Academy;
- Transfer Budget War;
- Domestic Dominance;
- European Specialist;
- One Nation recruitment;
- random Season objectives.

Rulesets need stable IDs/versions.

Challenge objectives remain separate from max-11 Season score.

No unsupported FIFA save scraping.

## 18. v1.8.0 — Cloud Readiness, No Cloud UI

### Goal

Prepare architecture for remote storage without making normal local use network-dependent.

### Required engineering

- async repository interface behind `js/storage.js`;
- local adapter remains production default;
- ordered migration registry;
- per-record revisions/timestamps/writer identifiers/tombstones;
- deterministic merge rules;
- local two-device sync simulator;
- privacy/threat/retention/deletion model;
- provider ADR with cost/exit analysis.

### Provider decision gate

Choose provider only after measuring:

- data size;
- authentication needs;
- realtime traffic;
- retention;
- privacy;
- monthly budget.

Gameplay modules must not receive provider-specific types.

## 19. v1.9.0 — Opt-In Cloud Backup Beta

### Goal

Introduce the smallest useful remote capability before realtime play.

### Scope

- explicit opt-in identity/setup;
- encrypted transport/provider storage;
- manual Back Up Now;
- Restore Preview;
- last successful backup/failure state;
- device recovery flow;
- bounded revision history;
- account data export/deletion;
- local-first offline behavior;
- monitoring/rate limits/abuse protection.

### Excluded

- realtime session sync;
- public profiles;
- friends/groups/chat/rankings/discovery.

No long-lived secret in QR/URL/logs/diagnostics.

No silent upload of existing local data.

## 20. v2.0.0 — Private QR Paired Two-Device Alpha

### Goal

Allow one private device per manager while preserving one-device mode as complete fallback.

### First-alpha boundary

- host creates short-lived private room;
- second manager joins by QR/short code;
- each device gets one manager role;
- room tokens expire/are single-purpose/revocable;
- Guess/Signing phases become private role-specific screens;
- host remains canonical for League/club assignment/Season confirmation/irreversible progression;
- both devices acknowledge locks/final confirmations;
- reconnect restores role and last acknowledged state;
- room state rejects stale writes;
- no account required for local one-device fallback.

### Required failure tests

- both role orders;
- expiry/reuse rejection/wrong role;
- refresh/background/network loss;
- simultaneous actions/delayed ordering;
- private Transfer data leak prevention;
- room deletion/token revocation;
- local recovery if remote session fails.

## 21. v2.1.0 — Connected Rivalry

### Goal

Graduate from host-assisted alpha to reliable full shared Showdown session.

### Deliverables

- shared canonical navigation state;
- role-private screens;
- two-party confirmation for irreversible checkpoints;
- presence/reconnect;
- deterministic conflict handling;
- resumable rooms;
- local/cloud recovery;
- host transfer/replacement flow;
- critical phase audit trail;
- parity with canonical one-device flow.

The interface remains game-like, not a technical synchronization dashboard.

## 22. v2.2.0 — Private Sharing and Groups

Recommended order:

1. revocable read-only completed-Showdown links;
2. privacy preview;
3. invited private groups;
4. group history/private standings;
5. sanitized summary cards.

Never expose manager email/internal IDs/device/recovery/draft/unrevealed Transfer data.

No public feed, comments or messaging in this milestone.

## 23. v3.0 decision gate — Community, Discovery and Rankings

This is not an approved implementation milestone.

Proceed only if:

- connected play has sustained real usage;
- owner approves moderation/operating budget;
- privacy/deletion/block/report/rate-limit/abuse response exists;
- verified vs self-reported data is explicit;
- public community adds more value than private rivalry depth.

Manual result entry prevents trustworthy global competitive ranking without a separate verification model.

If gates are not met, keep private groups/share links and stop there.

## 24. Rejected/icebox directions

Do not schedule by default:

- framework rewrite;
- persistent statistics database;
- official club crests/proprietary FIFA assets;
- automatic FIFA/console save scraping;
- public rankings before verification model;
- more soundtrack embeds merely for novelty;
- cloud before local recovery/identity foundations.

## 25. Maintenance lane for every release

Every milestone reserves capacity for:

- reproduced defect fixes;
- accessibility regression fixes;
- migration/rollback safety;
- dead/duplicate authority cleanup with guards;
- cross-module collision scans;
- storage authority enforcement;
- corrupt/quota/rapid/reload/back/double-submit tests;
- normal/reduced-motion checks;
- Chromebook/mobile layouts;
- duplicate ID/name/focus/contrast/overflow checks;
- raw/gzip/runtime budget measurement;
- lazy media protection;
- exact Pages asset verification;
- documentation/version/cache coherence.

## 26. Definition of done for every milestone

A milestone is complete only when all apply:

1. scope/exclusions written before coding;
2. new stored data has schema version and migration path;
3. destructive/critical transitions have rollback tests;
4. deterministic contracts pass;
5. full real-browser journey passes at 1366×768 and 390×844;
6. normal and reduced motion pass;
7. keyboard/mouse/touch critical actions pass;
8. no serious/critical accessibility violation on changed screens;
9. no severe console error/unhandled rejection/duplicate ID/visible overflow/failed local asset;
10. startup/runtime budgets remain approved or amendment is measured/documented;
11. candidate commit frozen;
12. PR checks pass;
13. checks pass again on main;
14. Pages deploys exact merge commit;
15. public runtime files match source;
16. rollback target known;
17. project state/next task/changelog/release status accurate;
18. owner browser acceptance added for material visual/interaction work.

## 27. Change control

- only one milestone is Current at a time;
- later ideas are assigned to a milestone, icebox, conditional gate or rejection;
- later ideas do not interrupt Current unless they fix a release blocker/security issue;
- implementation starts from current `main` and current `NEXT_TASK.md`;
- roadmap is revisited at minor-version boundaries, not every patch;
- completed decisions reopen only with new evidence;
- large milestones may be split, but dependency order cannot be skipped;
- no release is declared from filenames/local tests alone.

## 28. Current immediate execution contract

Until owner r5 visual acceptance/deferral:

Current milestone remains finite v1.0.x visual acceptance.

After acceptance/deferral:

Current milestone becomes `v1.1.0 Data Safety and Recovery`.

First implementation branch should contain Candidate A only:

`backup envelope + non-mutating export`

Candidate B and Candidate C remain downstream gates, not assumptions to bundle into the first branch.

## 29. Required reading for v1.1 developer

Before coding Candidate A, read:

1. `00_DEVELOPER_START_HERE.md`
2. `NEXT_TASK.md`
3. this file sections 7–11
4. `js/storage.js`
5. `js/showdown.js`
6. Data Management portions of `js/settings.js`
7. Data Management/transaction portions of `js/legacy.js`
8. `tests/contracts/stability-contracts.cjs`
9. `STABILITY_PLAN_V1.0.X.md`
10. current full browser/stability workflows

Then inspect current source before deciding file boundaries.

## 30. Roadmap-deepening decisions from 2026-08-11

The following are now explicit for future sessions:

1. The post-v1 roadmap belongs in GitHub, not only in an external chat/file handoff.
2. r5 is current visual implementation; r3/r4 rejection text is historical evidence, not the source baseline.
3. v1.1 begins from three existing persistence records, not from a hypothetical save registry.
4. v1.1 preserves current Showdown IDs; v1.3 owns the opaque identity/save-registry redesign.
5. Existing Data Management is the preferred first UI surface for backup/import.
6. Corrupt raw-byte preservation is a safety invariant that export/import design must respect explicitly.
7. Candidate A must prove zero storage mutation.
8. Candidate B must prove zero storage mutation.
9. Candidate C alone introduces restore writes and must provide complete rollback.
10. Cloud and two-device work remain blocked until local data safety, identities, registry and repository boundaries are proven.