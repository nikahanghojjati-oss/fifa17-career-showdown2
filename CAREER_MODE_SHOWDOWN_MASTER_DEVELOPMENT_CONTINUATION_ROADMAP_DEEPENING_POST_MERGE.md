# Career Mode Showdown — Roadmap Deepening Post-Merge Continuation

Last updated: 2026-08-11
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Status: closes the owner-requested roadmap/handoff deepening pass after merge and deployed verification.

## 1. Read-order rule for the next developer

Start with:

1. `00_DEVELOPER_START_HERE.md`
2. `NEXT_TASK.md`
3. the Current milestone sections of `POST_V1_ROADMAP_EXECUTION.md`
4. current source files named by `NEXT_TASK.md`

Only then use the deeper chronology files when needed:

- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION.md`
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_POST_MERGE.md`
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING.md`
- this file

The creation-time action logs in `00_DEVELOPER_START_HERE.md` and `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING.md` correctly describe how those documents were built, but their transient phrases such as “open the PR next” are superseded by this post-merge completion record.

Their architecture, roadmap, source-authority and next-milestone guidance remains current unless later source or owner instruction supersedes it.

## 2. Owner request completed by this pass

Owner instruction:

> Do a development on current roadmap to understand it more deeply and then make the room much more detailed and accessible to follow for next chat or work developer sessions

Standing owner continuity instruction also remains active:

- implementation/development happens directly in GitHub;
- do not stop to hand source files back as the primary deliverable;
- record meaningful development actions and substantive chat decisions continuously for the next developer.

## 3. What the roadmap pass accomplished

This pass did not introduce a new gameplay/runtime feature.

It made project continuation substantially more deterministic by:

- bringing the owner-approved post-v1 roadmap into the repository;
- grounding that roadmap against current live source rather than historical assumptions;
- creating one obvious session bootstrap file;
- correcting stale `NEXT_TASK.md` authority that still described the already-resolved r3 visual blocker;
- preserving the merged/deployed r5 implementation as the current visual baseline;
- separating technical r5 completion from pending owner real-device art-direction acceptance;
- decomposing v1.1 Data Safety and Recovery into bounded Candidate A/B/C work;
- identifying exact storage keys, schema versions, cache authorities and existing Data Management UI ownership;
- preventing v1.1 from prematurely absorbing the v1.3 identity/save-registry redesign;
- preserving the dependency order that blocks PWA/profiles/cloud/two-device work until their foundations exist;
- creating a future-session read order and handoff maintenance protocol.

## 4. New/updated repository authority files

### `00_DEVELOPER_START_HERE.md`

Canonical fast bootstrap for a new ChatGPT, Work or developer session.

It contains:

- authority order;
- current production/r5 snapshot;
- current owner gate;
- gameplay and architecture locks;
- current storage reality;
- roadmap dependency chain;
- exact next-decision tree;
- v1.1 A/B/C summary;
- later milestone boundaries;
- definition of done;
- session bootstrap checklist;
- continuous-handoff protocol.

### `POST_V1_ROADMAP_EXECUTION.md`

Repository-native execution companion to the owner-approved August 9 roadmap.

It preserves the approved release order from v1.1 through the conditional v3 decision gate and deepens it against current source ownership/failure boundaries.

### `NEXT_TASK.md`

Replaced the stale r3-era current task with the actual current gate:

- r5 is technically complete/merged/deployed/green;
- owner visual acceptance is still pending;
- new r5 rejection evidence remains a finite v1.0.x correction;
- owner acceptance or explicit deferral unlocks v1.1 Candidate A;
- Candidate B/C remain downstream gates;
- later roadmap milestones remain blocked by dependency order.

The still-valid heading required by release contracts remains:

`## Current baseline: v1.0.1 Stable`

### `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING.md`

Detailed chronology of the roadmap archaeology, source inspection, decisions and implementation actions in this pass.

### This file

Post-merge completion record that supersedes only transient pre-merge status lines in the creation-time action logs.

## 5. Source-grounded v1.1 foundation now recorded

Persistence authority remains:

`js/storage.js`

Current localStorage keys are exactly:

1. `careerModeShowdown.activeShowdown`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Current Showdown schema:

`2`

Current application preferences schema:

`2`

Current Showdown identity:

persisted existing `id`, created with `Date.now()` for new Showdowns.

Legacy currently compares IDs as strings and uses `updatedAt` / `completedAt` as current revision clues.

v1.1 therefore preserves existing Showdown IDs exactly.

The opaque manager/Showdown/Season/content-pack identity redesign and multi-save registry remain v1.3 responsibilities.

## 6. Current Data Management ownership recorded

Settings already routes Data Management to the existing lazy Legacy module.

Legacy already owns:

- individual Legacy deletion;
- delete-all Legacy history;
- Reset All Showdown Data;
- destructive confirmations;
- rollback for related active/Legacy transactions.

Preferred v1.1 UX direction:

Add Export/Import controls inside that existing Data Management surface rather than creating a new top-level route merely because backup is new.

`js/screens.js` remains the sole route/history authority.

## 7. v1.1 Candidate A/B/C boundary now explicit

### Candidate A — Versioned Backup Envelope + Non-Mutating Export

First v1.1 implementation branch after the current owner visual gate exits.

Must include:

- active Showdown;
- Legacy history;
- preferences;
- backup format ID/version;
- application version;
- export timestamp;
- record counts;
- deterministic corruption-detection checksum metadata;
- human-inspectable JSON download;
- explicit warning/recovery behavior for malformed current raw data;
- Export Backup UI in existing Data Management;
- zero localStorage writes/removals.

Candidate A does not include import/restore, profiles, PWA or cloud.

### Candidate B — Import Analysis + Migration Preview

Must include:

- input-size ceiling;
- JSON/format/checksum/schema validation;
- future-format rejection;
- ordered non-mutating migrations;
- duplicate/conflict analysis;
- active/Legacy/preferences dry-run preview;
- zero localStorage writes/removals.

Candidate B does not perform restore writes.

### Candidate C — Atomic Restore + Recovery UX

Only Candidate C writes imported state.

Before write it must:

- flush pending application writes;
- revalidate the analyzed input;
- capture exact raw snapshots of every affected storage key;
- compute explicit user-selected result in memory.

All writes remain inside `js/storage.js` authority.

Any failure rolls back every affected key and verifies rollback before continuing.

Caches/UI/navigation update only after successful commit.

Repeated import must be idempotent.

## 8. Corrupt-data principle preserved

Current v1.0.1 stability behavior intentionally preserves malformed raw storage bytes rather than silently deleting them.

The roadmap now explicitly requires v1.1 to preserve this safety principle.

Export/import must not transform unreadable current storage into silent data loss.

A malformed record must be reported honestly and its recoverable raw evidence preserved or explicitly surfaced through a recovery representation/path.

## 9. Future dependency order preserved

Current approved order remains:

`v1.0.x Stability Lane`
→ `v1.1.0 Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Local Profiles and Save Library`
→ `v1.4.0 Legacy 2.0 and Achievements`
→ `v1.5.0 Analytics 2.0`
→ `v1.6.0 Optional Content Packs`
→ `v1.7.0 Challenge Studio`
→ `v1.8.0 Cloud Readiness`
→ `v1.9.0 Opt-In Cloud Backup Beta`
→ `v2.0.0 Private QR Paired Two-Device Alpha`
→ `v2.1.0 Connected Rivalry`
→ `v2.2.0 Private Sharing and Groups`
→ conditional v3 Community/Rankings decision gate.

Do not jump to cloud/two-device work on the present singleton storage model.

Do not create profiles/accounts merely because later milestones may need identities.

Do not alter canonical max-11 scoring through achievements/challenges.

Do not make optional content packs silently replace the default five-league mode.

## 10. PR #12

PR:

`#12 — docs: deepen post-v1 roadmap and developer handoff`

Branch:

`agent/roadmap-handoff-deepening-r1`

Base before the pass:

`bac390abb9c41f6e24df68bf9cafc43e79021830`

Final PR head:

`e62165ca7d87d787f1ff683e3748dadb3c67e557`

Changed files in the PR:

- `00_DEVELOPER_START_HERE.md` — added;
- `POST_V1_ROADMAP_EXECUTION.md` — added;
- `NEXT_TASK.md` — updated;
- `CAREER_MODE_SHOWDOWN_MASTER_DEVELOPMENT_CONTINUATION_ROADMAP_DEEPENING.md` — added.

No HTML, CSS, JavaScript, data, image or runtime asset file changed.

## 11. PR validation incident

The first PR validation head omitted the exact still-valid stable baseline heading from the rewritten `NEXT_TASK.md`.

Static App failed with:

`NEXT_TASK does not identify the stable baseline.`

This was not evidence that the old r3 instructions should return.

The contract required only the stable baseline marker:

`## Current baseline: v1.0.1 Stable`

That marker was restored while retaining the current r5-aware task body.

Fix commit:

`e62165ca7d87d787f1ff683e3748dadb3c67e557`

The incident demonstrates the desired authority rule:

keep still-valid release coherence markers, but do not preserve stale implementation instructions merely to satisfy history.

## 12. Final pre-merge validation

All eleven permanent workflows passed on exact final PR head:

`e62165ca7d87d787f1ff683e3748dadb3c67e557`

This included:

- Validate Static App;
- Validate Home Bootstrap;
- Validate V1 Visual Immersion;
- Validate Season Review;
- Validate Settings Workstream;
- Validate League Confirmation;
- Validate Final Polish;
- Validate Statistics Workstream;
- Validate Transfer Workstream;
- Validate Licensed Football Visuals, including browser visual audit;
- Validate Stability Lane, including storage/release contracts and two consecutive complete Chromium/provenance/Home/crop-safe-photo browser cycles.

## 13. Merge

PR #12 was merged with exact expected-head protection.

Merge commit:

`1929e9548a2d0f5b083aa0d9e454c6b9a6fd3a9f`

Merge title:

`Merge roadmap deepening and developer continuity`

A compare from the pre-pass main head to the merge confirms the complete merged change remains exactly the four Markdown files listed above.

No runtime byte changed.

Therefore application/runtime identity remains:

- app: `v1.0.1`;
- asset revision: `1.0.1-r5`.

No cache-revision bump was required for this documentation-only pass.

## 14. Post-merge verification

Exact merge SHA tested:

`1929e9548a2d0f5b083aa0d9e454c6b9a6fd3a9f`

Post-merge Licensed Football Visuals:

success, including the real browser visual audit.

Post-merge Stability Lane:

success.

Its completed stages included:

- storage/release/CI contracts;
- two consecutive complete Chromium/provenance/Home/crop-safe-photo browser cycles;
- deployed-site smoke;
- exact Pages runtime-byte verification;
- deployed runtime-error provenance audit;
- deployed Home / Marco Reus visual audit;
- deployed crop-safe football-photo audit;
- complete deployed gameplay/navigation journey.

No post-merge runtime regression was introduced by the documentation/roadmap work.

## 15. Current production/runtime authority after this pass

Current runtime implementation remains the r5 merge:

`8f4f9d2c94e1e1f03f50fb439df34f423cc06d1e`

Current main also includes the later documentation-only continuity/roadmap commits.

Do not interpret a later documentation commit SHA as a new runtime build when its diff contains no runtime byte.

Runtime revision remains `1.0.1-r5`.

## 16. Current owner gate after this pass

Technical r5 state:

`COMPLETE, MERGED, DEPLOYED, POST-MERGE GREEN`

Owner art-direction state:

`PENDING REAL-DEVICE REVIEW`

The owner still has final visual acceptance authority for:

- Create Showdown / James Rodríguez;
- Transfer Challenge / Marcus Rashford;
- Transfer Challenge / Anthony Martial;
- Home/loading / Marco Reus regression check.

If new rejection evidence arrives, remain inside the finite v1.0.x correction path and make a targeted evidence-driven fix from current r5.

If the owner accepts r5 or explicitly defers that visual review, the next substantive feature milestone is:

`v1.1.0 Data Safety and Recovery — Candidate A only`

Candidate A means:

`Versioned Backup Envelope + Non-Mutating Export`

Do not begin Candidate B/C or later milestones automatically.

## 17. Future-session minimum bootstrap

A fresh developer should be able to continue without access to this chat by doing only this first:

1. fetch current `main` and record SHA;
2. read `00_DEVELOPER_START_HERE.md` completely;
3. read `NEXT_TASK.md` completely;
4. read the relevant Current milestone sections in `POST_V1_ROADMAP_EXECUTION.md`;
5. inspect the live source files named by the current task;
6. use deeper handoff files only to resolve history/authority ambiguity;
7. do not ask the owner to repeat documented decisions unless new evidence is genuinely required;
8. continue recording meaningful actions in a new dated/phase handoff or a clearly superseding continuation section.

## 18. Completion status for this roadmap/handoff development pass

`COMPLETE, MERGED, POST-MERGE VALIDATED`

The project is now significantly easier for the next ChatGPT, Work, or developer session to enter without reconstructing the entire conversation history.

The next developer should not start by redesigning the roadmap.

The next developer should resolve the current owner visual gate first, then follow the exact branch of `NEXT_TASK.md` that applies.