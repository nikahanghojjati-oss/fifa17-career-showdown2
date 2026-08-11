# Career Mode Showdown — v1.1.2 Candidate B Public Handoff

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Branch: `agent/v1.1.2-candidate-b-import-analysis`
Base main: `c86d8d36285295899e8473539c33d6f7b34b4226`

## GOLDEN RULE — continuous public handoff logging

The owner explicitly requires every development session to record meaningful work continuously in a public repository handoff because a ChatGPT/developer session may be interrupted without warning.

This rule is non-negotiable for every future developer:

- create or identify the active public handoff before meaningful implementation begins;
- record the owner instruction that defines the active task;
- record branch/base/runtime authority;
- record design decisions and why they were made;
- record every meaningful implementation step;
- record failed experiments, CI failures and exact classifications instead of hiding them;
- record corrective commits and why they are safe;
- record exact frozen candidate SHA, PR, merge SHA and deployment evidence;
- record gate results and any rejected/non-counted evidence;
- record owner acceptance/rejection state separately from developer/CI acceptance;
- record the immediate legal next action before ending a session;
- update the handoff during the build, not only after completion.

A future developer must prefer an incomplete-but-current handoff over reconstructing intent from old chat chronology.

## Owner instruction for this build

The owner instructed the developer to work through the next build completely without stopping midway to ask for continuation, apply extensive and accurate gate checks, build/test until all gates are green, deploy the finished build, and then present the result. The owner reiterated that complete continuous public handoff recording is the golden rule and asked for that requirement to be made visible to future developers in repository authority.

## Starting authority

Current technical baseline before Candidate B:

- application: `v1.1.1`;
- runtime revision: `1.1.1-r1`;
- current main: `c86d8d36285295899e8473539c33d6f7b34b4226`;
- v1.1.1 runtime implementation authority: `29caae874bf00deba89bdb1ffcfc0654ead3928f`;
- Candidate A backup envelope/export: complete, deployed and protected;
- Candidate B import analysis/migration preview: not implemented at branch creation;
- Candidate C atomic restore: blocked behind Candidate B and explicitly out of scope;
- v1.2.0 remains reserved for Installable Offline App.

This substantive runtime feature is being developed as `v1.1.2` so the v1.2.0 roadmap reservation remains intact.

## Candidate B scope lock

Candidate B must read a user-selected backup in isolation and explain what would happen without mutating canonical local data.

Included:

- accessible file selection and drag/drop path where appropriate;
- strict file-size ceiling before expensive parsing;
- strict JSON parse;
- backup format ID/version validation;
- SHA-256 checksum verification using Candidate A canonicalization authority;
- active Showdown / Legacy / preferences validation;
- supported historical-schema migrations through one ordered registry;
- rejection of unsupported future backup/data schemas;
- duplicate/conflict classification using existing Showdown IDs as strings;
- dry-run preview of active/Legacy/preferences effects;
- clear warnings/errors and inspectable analysis details;
- deterministic fixtures and browser coverage;
- zero canonical localStorage writes/removals.

Explicitly excluded:

- restore/apply writes;
- automatic merge;
- silent active replacement;
- profile/save-library identity redesign;
- PWA/service worker;
- cloud/account/network upload;
- Candidate C rollback/commit UI.

## Quality/gate philosophy for this build

Candidate B is a data-safety boundary, so green UI smoke alone is insufficient. Gates must prove structural invariants, security/failure behavior and non-mutation.

Planned changed-surface evidence:

1. zero-write instrumentation around every analysis path;
2. strict maximum input bytes before `File.text()`/parse when file metadata is available;
3. malformed JSON, wrong format, unsupported future format and checksum mismatch rejection;
4. supported current and historical schema fixtures;
5. deterministic ordered migration registry and idempotence checks;
6. no mutation of caller-owned parsed backup objects during migration/analysis;
7. duplicate and conflict classification with same-ID/exact/same-effective-revision/different-revision cases;
8. malformed/unresolvable-record accounting rather than silent drops;
9. dry-run preview explaining active replacement impact, Legacy additions/conflicts/duplicates and preference changes;
10. large-but-allowed input responsiveness and oversized rejection;
11. accessibility/keyboard/touch/Chromebook/mobile behavior;
12. lazy loading so startup budgets remain protected;
13. Candidate A export round-trip into Candidate B analysis;
14. protected gameplay/storage/visual regression matrix;
15. exact Pages byte parity and complete deployed journey after merge.

No existing quality, startup, accessibility or performance threshold may be lowered just to obtain green CI.

## Action log

1. Confirmed current main `c86d8d36285295899e8473539c33d6f7b34b4226` and read current `00_DEVELOPER_START_HERE.md`, `NEXT_TASK.md`, and Candidate B/C dependency sections of `POST_V1_ROADMAP_EXECUTION.md`.
2. Confirmed Candidate B is the next substantive legal milestone and Candidate C remains blocked.
3. Created branch `agent/v1.1.2-candidate-b-import-analysis` directly from current main.
4. Created this public handoff before implementation mutation.
5. Next: make the continuous-handoff golden rule prominent in canonical developer-start authority, then inspect Candidate A/storage/Data Management implementation and build Candidate B within those ownership boundaries.

## Current status

`CANDIDATE B BRANCH OPEN — HANDOFF CREATED — IMPLEMENTATION INSPECTION IN PROGRESS`
