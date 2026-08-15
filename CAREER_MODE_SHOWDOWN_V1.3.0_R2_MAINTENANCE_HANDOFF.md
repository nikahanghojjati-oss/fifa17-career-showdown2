# Career Mode Showdown v1.3.0 r2 Maintenance Handoff

Last updated: 2026-08-15 ET
Status: CLOSED — MERGED, DEPLOYED, EXACT-BYTE VERIFIED AND TECHNICALLY PRODUCTION-PROVEN
Application version: `v1.3.0`
Production runtime: `1.3.0-r2`
Immediate previous known-good whole shell: `1.3.0-r1`
Implementation branch: `agent/local-profile-display-label-edit`
Exact branch base: `eee3b0c62be4d023b7d83fb22447d37db8a8b9b6`
Frozen PR head: `cfedec8dccde51a7a9932a1bd3a92cc91514e579`
PR: #61
Runtime merge: `67095a02188ebd246da0d0f2cd61158b8e9e504e`

## Shipped boundary

The closed owner-authorized candidate is Local Profile display-label editing. It changes only profile presentation through existing Save Library authority and existing lazy Settings UI.

Allowed:

- trim and update one exact `profile.displayName`;
- expose keyboard-accessible edit, save and cancel controls;
- rerender profile and identity-link presentation from the same canonical snapshot;
- invalidate existing Analytics / Trophy Room presentation revisioning through the already shipped profile-presentation signature;
- advance whole-shell delivery identity from `1.3.0-r1` to `1.3.0-r2` so changed runtime bytes reach installed clients atomically.

Not allowed:

- changing `profile_*`, `save_*` or `season_*` identity;
- rewriting saved Showdown, in-memory Showdown or Legacy manager labels;
- matching or merging profiles by visible name;
- profile creation, merge or deletion;
- backup/import envelope redesign, broader Analytics, Legacy/Achievements, cloud/network work, gameplay/scoring change or visual redesign.

## Mutation and recovery authority

Before old-singleton cutover, the three public canonical keys remain active Showdown, Legacy and preferences. After Save Library cutover, they remain Save Library, Legacy and preferences. The active Showdown compatibility slot is never a permanent fourth key.

`js/storage.js` remains public raw browser-storage authority. `js/storageTransaction.js` remains raw transaction authority. `js/saveLibraryRuntime.js` remains product mutation authority. The UI never calls `localStorage` directly.

Profile-label mutation uses strict exact raw authority and the established transaction-owned commit boundary. Stale authority fails closed before a write. Mutation-owned failure handling must not erase or overwrite externally changed state. An unchanged label is a no-write success; invalid input is rejected before a write.

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the only destructive import Apply stage and keeps strict exact raw snapshot authority, last-moment prewrite checks, transaction-owned mutation and rollback, ownership-scoped reverse rollback, anti-clobber verification, exact post-write verification and critical recovery on uncertainty.

## Installable Offline App authority

Production whole shell: `1.3.0-r2`
Previous known-good whole shell: `1.3.0-r1`

The r2 identity is a delivery requirement for the same bounded feature, not a second roadmap candidate or a new application version. It preserves atomic verified cache population, explicit safe-boundary activation, current/previous whole-shell recovery, corruption fail-closed behavior, Settings-only install/update presentation and application-byte-only Service Worker ownership.

## Production proof

Promotion completed with:

1. deterministic runtime contracts proving trimming, invalid input, no-op, stable identities, unchanged Showdown/Legacy labels, exact Legacy bytes and stale-authority failure;
2. Chromium proof for keyboard disclosure/submission, native validation, exact-profile focus restoration, same-name separation, Analytics-facing presentation, Chromebook/mobile containment and reduced motion;
3. offline contracts and lifecycle audits proving coherent `1.3.0-r2` current / `1.3.0-r1` previous shell behavior;
4. all 13 normal pull-request workflow families green on exact frozen head `cfedec8dccde51a7a9932a1bd3a92cc91514e579`;
5. an independent unchanged-head/base/review/thread gate followed by expected-head merge protection;
6. all 15 exact-merge production runs green, including Pages, Release Integration Burn-In and Stability deployed-site smoke;
7. 71 runtime files plus `service-worker.js` and `manifest.webmanifest` matched deployed production byte for byte;
8. an independent public browser journey proving label editing, invalid-input rejection, stable IDs and unchanged saved Showdown manager presentation.

`V1.3.0_R2_PRODUCTION_PROOF.md` owns the frozen evidence. `00_CURRENT_HANDOFF.md` is the rolling evidence trail. `PROJECT_STATE.md` owns current deployed truth. `NEXT_TASK.md` owns implementation authorization. Production is now `1.3.0-r2`; completion of this closed candidate authorizes no second roadmap area.
