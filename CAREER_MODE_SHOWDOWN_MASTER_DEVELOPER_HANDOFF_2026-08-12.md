# Career Mode Showdown — Master Developer Handoff Deep-Dive

Date opened: 2026-08-12
Research branch: `handoff/master-developer-deep-dive-2026-08-12`
Starting repository `main`: `5f21bdeb5122839e4a9a1e1a1c24936d856b3da6`
Validated documentation head beneath the evidence seal: `e25f3a326fbe2eeef9196ac8e6140bd17f217a2d`
Immutable v1.1.3 application runtime authority: `29760bbf33c974267bd1ad64d0839f73ad8051fa`
Application version: `v1.1.3`
Runtime asset revision: `1.1.3-r1`

> This document is the public, continuously updated handoff requested by the owner on 2026-08-12. It is being written before and during the historical review rather than reconstructed only at the end. Historical conclusions are not considered final until cross-checked against the current repository authority and the relevant exported conversation records.

## 0. Authority and method

When sources disagree, use this order:

1. current source code on `main`;
2. current `PROJECT_STATE.md` / `NEXT_TASK.md` and current authoritative handoffs;
3. current architecture/data/roadmap documents;
4. historical repository handoffs and release evidence;
5. historical ChatGPT conversation records;
6. external commentary/reviews (including Grok), used as critique only and never as implementation authority.

The purpose of the historical review is not to resurrect superseded code or old plans. It is to recover product intent, owner preferences, causal history, rejected approaches, and the reasons behind protected decisions so a future developer does not accidentally regress the project while technically following only the latest code.

## 1. Exact project state before the deep-dive

### 1.1 Current shipped state

v1.1.3 is COMPLETE / PROTECTED.

The owner-priority v1.1.3 maintenance release:

- fixed the League Wheel post-selection visual reroll without changing the selected league or gameplay semantics;
- preserved the one-league / two-different-permanent-clubs Showdown model;
- replaced and expanded licensed football photography without reviving rejected player-image sources;
- preserved the accepted FIFA 17-inspired visual language and Reus loading/Home treatment;
- retained Candidate A backup export and Candidate B import-analysis semantics;
- retained the singleton local-storage product model for the current release;
- stayed under unchanged eager-startup limits at **164,965 raw / 37,006 gzip** against protected ceilings of **165,000 / 37,500**;
- passed all 13 permanent gate families twice on one frozen pre-merge candidate;
- merged through expected-head protection;
- passed all 13 permanent gate families twice again on the immutable production runtime;
- passed deployed-site byte parity, provenance, Home/Reus, licensed-photo, Candidate A, Candidate B and complete public journey audits;
- completed a final documentation-only closure matrix and Pages deployment;
- ended with an evidence-only `[skip ci]` seal at current `main`.

The evidence-only seal is not the application runtime authority. Runtime behavior remains represented by `29760bbf33c974267bd1ad64d0839f73ad8051fa`.

### 1.2 Current persistence and data-safety position

Canonical localStorage authority remains `js/storage.js`.

The current three canonical keys are:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A is COMPLETE / PROTECTED:

- versioned backup envelope;
- non-mutating export;
- exact raw snapshot capture;
- checksum/corruption detection;
- corrupt raw-data preservation;
- no canonical write during export.

Candidate B is COMPLETE / PROTECTED:

- local file analysis only;
- strict JSON / format / checksum / schema checks;
- hostile-structure and future-schema fail-closed behavior;
- deterministic migration preview;
- deterministic conflict classification;
- active / Legacy / preferences impact preview;
- zero canonical storage writes/removals during analysis;
- no network request;
- explicit preview-only UX.

Candidate B `PREVIEW READY` is not permission to write.

### 1.3 Next legal substantive build

**Candidate C — Atomic Restore + Recovery UX** is the next legal v1.1.x task.

Candidate C is the first stage allowed to write imported canonical state. It must build on Candidate A + Candidate B and must not bypass either one.

Mandatory transaction sequence currently protected in `NEXT_TASK.md`:

1. flush pending canonical application writes;
2. revalidate the selected/analyzed backup immediately before apply;
3. snapshot exact raw bytes for every affected canonical key before first mutation;
4. require explicit user choices for active replacement, Legacy merge/conflicts and preferences;
5. compute the entire final candidate state in memory before first write;
6. write only through `js/storage.js`;
7. treat the multi-key restore as one transaction boundary;
8. verify every committed key/value after writing;
9. on any write or verification failure, restore every affected key to exact pre-restore raw bytes;
10. verify rollback byte-for-byte;
11. surface rollback failure as critical recovery state, never false success;
12. invalidate caches / route-derived state / navigation only after total success;
13. keep re-import deterministic and idempotent;
14. preserve corrupt raw-data recovery semantics;
15. keep recovery/export guidance before destructive active replacement;
16. do not create a second persistence owner.

Required failure-injection evidence includes first/middle/final-key failure, quota exception, post-write verification mismatch, rollback-write failure, corrupt pre-existing raw data, same-ID conflicts, rapid/double Apply, lifecycle interruption where reproducible, stale preview vs apply, and repeat import of an already-restored backup.

### 1.4 Protected systems Candidate C must not casually change

- max-11 scoring;
- 0–0-only tiebreak rule;
- exactly two managers;
- one browser/device product model for the present release;
- same league + different permanent clubs;
- Transfer Challenge state machine;
- Season Review persistence boundary;
- Statistics / Legacy / Trophy derivations;
- `js/screens.js` route/history authority;
- `js/storage.js` persistence authority;
- football-photo source authority and accepted presentation;
- Candidate A export semantics;
- Candidate B read-only analysis semantics;
- v1.2.0 reservation for Installable Offline App.

### 1.5 Roadmap from here

The dependency order remains intentional and must not be collapsed into a feature wishlist:

1. **v1.1 Data Safety and Recovery** — finish Candidate C and close atomic restore/recovery.
2. **v1.2.0 Installable Offline App** — PWA/offline capability after restore safety exists.
3. **v1.3.0 Local Profiles and Save Library** — move beyond singleton active save only after safe backup/import/restore foundations exist.
4. **v1.4.0 Legacy 2.0 and Achievements** — richer long-term local history on top of stable save identity/library.
5. **v1.5.0 Analytics 2.0** — deeper derived insight without turning analytics into persistence authority.
6. **v1.6.0 Optional Content Packs** — expand optional content without bloating the initial shell or violating rights constraints.
7. **v1.7.0 Challenge Studio** — richer user-configurable challenge systems after core data identity and history are mature.
8. **v1.8.0 Cloud Readiness** — adapters, IDs, conflict/migration preparation; not yet opt-in cloud sync.
9. **v1.9.0 Opt-In Cloud Backup Beta** — conditional, cost/privacy-aware cloud backup only after readiness gates.
10. **v2.0.0 Private QR Paired Two-Device Alpha** — first two-device work only after cloud/readiness foundations.
11. **v2.1.0 Connected Rivalry** — deeper paired-device experience.
12. **v2.2.0 Private Sharing and Groups** — private social layer after identity/sync safety exists.
13. **Conditional v3** — only after explicit future decision gates; not a currently authorized implementation target.

The importance of this ordering is architectural, not cosmetic. Profiles, cloud and two-device work would be dangerous if built directly on the current singleton storage model before atomic restore, migrations, stable IDs and a save registry are proven.

## 2. Historical research scope opened by the owner

The owner asked this deep-dive to focus only on relevant project discussions and artifacts, especially:

1. **Website Creation and Guide** — earliest build environment / product formation;
2. **Career Mode Showdown Dev** — second major development environment and visual/product refinement;
3. **Career Mode Showdown — Master Development Continuation** — recover from exported ChatGPT history plus repository records produced by that chat;
4. **Project r4 Visual Fixes** — recover visual-source/crop decisions, rebuild work, and continuity practices;
5. current repository handoffs / release evidence;
6. the newly supplied Grok review as outside critique.

The uploaded ChatGPT history will be searched by conversation title and project-specific phrases rather than reviewed indiscriminately. Irrelevant personal/non-project conversations will be ignored.

## 3. Deep-dive log — opened, findings pending

Research status at document creation:

- current `main` SHA verified;
- current `NEXT_TASK.md` read and used to freeze the exact handoff starting state above;
- dedicated public research branch created;
- this master handoff created before historical analysis begins;
- exported ChatGPT history not yet mined at this point in the record;
- current architecture/roadmap/historical handoff cross-check still pending;
- Grok review has been supplied by the owner and will be treated as external critique, not source-of-truth.

The remainder of this document will be expanded continuously with source-by-source findings, contradictions, lessons, protected intent, historical mistakes to avoid, roadmap rationale, and a final next-developer operating protocol.