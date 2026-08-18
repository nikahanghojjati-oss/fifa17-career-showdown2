# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-17 ET
Status: current dependency/status authority for the post-v1 direction. This file is not an implementation queue. `NEXT_TASK.md` remains the sole primary implementation-authorization authority.

## 1. Current authority

Current production application milestone: **v1.4.0 — Product Deepening**
Current runtime revision: `1.4.0-r1`
Previous known-good whole shell: `1.3.0-r2`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 full multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Feature release version: **v1.4.0**
Authorized product candidate: **none**

`PROJECT_STATE.md` owns current production facts. `NEXT_TASK.md` owns implementation authorization. This file owns dependency direction and roadmap classification only.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

The shipped local product chain now includes stable Local Profiles / Save Library identity, identity-safe Career Analytics / Trophy Room consumption, Local Profile display-label editing, formatVersion 2 full multi-Save backup/import portability, Phase B Save Library / Local Profile Experience 2.0 first slice, and Phase C Showdown Home & Season Experience first slice. All are closed and production-proven.

No roadmap position by itself authorizes a new runtime candidate.

## 2. Permanent rules inherited by every future area

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains Analytics calculation authority. No framework rewrite merely for modernization.

Data-safety integrity: canonical storage remains exactly three public keys at a time. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the only destructive import Apply stage. Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership and exact verification.

Presentation integrity: accepted FIFA 17-inspired visual behavior, mobile/Chromebook/reduced motion, Settings-owned install/update presentation and established Smart Back ownership remain protected.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal implementation/authority PRs generally exercise 13; Release Integration Burn-In remains main/manual release authority. Performance ceilings and workflow timeouts are not negotiation knobs for future features.

Product philosophy lock: Career Mode Showdown is a private two-manager companion. Public community features and global leaderboard/rankings are **ELIMINATED**. Private remote joining remains important future work but is **BLOCKED** until the dependency path Cloud → Identity → Paired Device → Remote Joining is explicitly authorized and proven.

## 3. Completed dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.2.0-r2 production maintenance hotfix`
→ `v1.3.0 Recovery & Device Resilience Hardening`
→ `Local Profiles / Save Library identity foundation`
→ `Local Profiles / Save Library canonical persistence`
→ `Local Profiles / Save Library runtime authority cutover`
→ `Visible Local Profiles / Save Library Core UI`
→ `Explicit cross-Save / historical manager identity linkage foundation`
→ `Identity-Safe longitudinal Career Analytics / Trophy Room consumption`
→ `Local Profile display-label editing / 1.3.0-r2 whole-shell maintenance`
→ `formatVersion 2 full multi-Save backup/import portability` (PR #67)
→ `Phase A authority synchronization` (PR #68)
→ `Phase B Save Library / Local Profile Experience 2.0 first slice` (PR #70)
→ `Phase C Showdown Home & Season Experience first slice` (PR #73)
→ `v1.4.0 — Product Deepening visible seal / 1.4.0-r1 whole shell`.

Every layer above is closed and production-proven.

## 4. Completed resilience baseline — v1.3.0 Recovery & Device Resilience Hardening

Status: DONE.

The v1.3 resilience milestone remains the protected recovery/device baseline beneath v1.4.0 Product Deepening. Its Candidate A/B/C ownership model, fail-closed behavior, exact raw snapshot authority, whole-shell recovery and installed-app guarantees remain binding.

Runtime `1.3.0-r2` is now the immediate previous known-good whole shell for `1.4.0-r1`.

## 5. Local Profiles and Save Library — completed dependency milestone

Status: FOUNDATION DONE / FIRST EXPERIENCE DEEPENING SLICE DONE.

The shipped product has stable `profile_*`, `save_*` and `season_*` IDs, canonical multi-save state, explicit `activeSaveId`, additive creation, switching, single-Save deletion, visible Local Profiles, old-singleton compatibility, fail-closed authority behavior and Candidate A/B/C compatibility.

Fresh Showdowns intentionally begin with fresh profiles for their two manager roles. Same display names never imply the same identity.

The completed explicit manager identity foundation includes:

- explicit reuse of an existing stable Local Profile across Save manager roles;
- same-name distinct profiles preserved unless a user explicitly links a role;
- stable-save-ID-only propagation to an exact matching Legacy copy;
- explicit historical-only map/unmap to an existing profile;
- intentionally unresolved/null historical roles as a supported state;
- profile retention rather than destructive merge/delete;
- display labels remaining historical labels when stable identity refs change;
- Candidate A/C preservation of explicit active `profile_*` refs.

Phase B first slice is also shipped: richer Save cards, clearer Local Profile presentation, local non-destructive sorting and 44px touch targets. Broader profile CRUD and further Save Library deepening remain unassigned until explicitly authorized.

## 6. Multi-Save portability — completed

Status: DONE / PRODUCTION-PROVEN.

formatVersion 2 full multi-Save backup/import portability shipped in PR #67 and is closed.

The complete Save Library registry can round-trip to a fresh device while preserving exact `activeSaveId`, same-name distinct profiles, explicit cross-Save profile reuse, unresolved historical roles, Legacy and preferences. v1 envelopes remain readable. Existing-data restore still requires explicit safe choices. Candidate A remains non-mutating, Candidate B remains read-only, and Candidate C remains the sole destructive Apply stage with strict exact raw snapshot authority, transaction-owned mutation, ownership-scoped rollback, anti-clobber and exact verification.

Do not reopen portability as an unfinished roadmap gate.

## 7. Identity × Legacy × Analytics dependency

The identity-consumption dependency is complete in production:

stable local IDs and Save Library — DONE
→ explicit cross-Save/profile linkage semantics plus explicit unresolved-history treatment — DONE
→ narrow identity-safe longitudinal Career Analytics / Trophy Room correction — DONE / PRODUCTION-PROVEN.

Production `js/analytics.js` keys longitudinal manager aggregation by valid stable `profile_*` references. One explicitly reused profile aggregates across Saves; same-name distinct profile IDs remain distinct; unresolved historical roles remain excluded from identified longitudinal manager totals/leaderboards until explicitly mapped; identity-independent totals and Showdown/Season-scoped records remain complete; display labels remain presentation only; Rivalry Analytics remains Showdown-scoped; identity and profile-presentation changes invalidate Analytics/Trophy Room derived caches coherently.

This completion does not authorize broad Analytics 2.0 expansion. Never use display-name equality to bypass unresolved identity.

## 8. Product Deepening — v1.4.0

Status: CURRENT VISIBLE MILESTONE / FIRST SLICES CLOSED.

The visible v1.4.0 milestone formally groups already-shipped product-deepening work:

1. Phase B / Save Library Experience 2.0 first slice, PR #70.
2. Phase C / Showdown Home & Season Experience first slice, PR #73.

Phase C includes the series lead/trail status chip, contextual primary action including `VIEW COMPLETED SHOWDOWN`, last completed season summary, and presentation/touch-target polish while preserving eager CSS ceilings.

Runtime identity is `1.4.0-r1`; previous known-good whole shell is `1.3.0-r2`.

No further Product Deepening slice is authorized merely because v1.4.0 exists.

## 9. Roadmap classification matrix

The classifications below describe dependency/product state, not implementation authorization. `NEXT_TASK.md` remains the sole primary task authority.

| Area | Current classification | Source-grounded interpretation |
| --- | --- | --- |
| Recovery & Device Resilience | DONE / PROTECTED BASELINE | v1.3 implementation and production proof are closed; guarantees remain binding. |
| Installable Offline App | DONE / `1.4.0-r1` PRODUCTION | Current whole shell is `1.4.0-r1`; immediate previous known-good is `1.3.0-r2`. |
| Stable Local Identity | DONE | `profile_*`, `save_*`, `season_*` exist and are protected. |
| Local Profiles | FOUNDATION + FIRST UX SLICE DONE | Visible profiles, explicit cross-Save reuse, display-label editing and Phase B first-slice presentation are shipped; generic profile CRUD remains unauthorized. |
| Save Library | FOUNDATION + FIRST UX SLICE DONE | Multi-save create/switch/delete/runtime authority and Phase B first slice are shipped. |
| Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED | Historical-only roles can be explicitly mapped or remain null when identity is not proven. |
| Cross-Save manager/profile linkage semantics | DONE | Existing Local Profiles can be explicitly reused across Save roles; name matching is never automatic. |
| Backup/import envelope portability | DONE / PRODUCTION-PROVEN | formatVersion 2 complete multi-Save portability shipped in PR #67. |
| Current production derived Analytics | IDENTITY-SAFE / PRODUCTION-PROVEN | Career manager aggregation and Trophy Room consume stable Local Profile identity with explicit unresolved-history semantics. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | NARROW IDENTITY-SAFE LAYER DONE | Broader Analytics 2.0 expansion is separate and not authorized. |
| Showdown Home & Season Experience | FIRST SLICE DONE / PRODUCTION-PROVEN | Phase C first slice shipped in PR #73; broader expansion needs explicit authorization. |
| Legacy expansion | FUTURE / NOT AUTHORIZED | Showdown/Season-scoped expansion or deeper career history remains separately bounded. |
| Achievements | CONDITIONAL / NOT AUTHORIZED | Requires a separately authorized product definition. |
| Optional content/league/challenge packs | FUTURE / NOT AUTHORIZED | Must not replace the accepted default Wheel or scoring authority. |
| Custom challenge content | FUTURE / NOT AUTHORIZED | Must preserve canonical scoring and default behavior. |
| Cloud Readiness | FUTURE / NOT AUTHORIZED | Architecture-only future work; no required cloud dependency. |
| Cloud Backup | BLOCKED | Requires Cloud Readiness, provider/cost, auth/privacy, revisions/conflicts/tombstones and recovery escape hatches. |
| Private Identity / Account Layer | BLOCKED | Requires explicit cloud/identity authorization and privacy/security definition. |
| Paired-device capability | BLOCKED | Requires reliable private remote persistence/security first. |
| Connected Rivalry | BLOCKED | Requires proven paired-device/sync semantics and conflict safety. |
| Private sharing/groups | BLOCKED | Depends on reliable connected identity, privacy and authorization. |
| Private remote joining | BLOCKED | Dependency order remains Cloud → Identity → Paired Device → Remote Joining. |
| Public/community/rankings | ELIMINATED | Owner decision 2026-08-16: private two-manager companion only; public community and global leaderboard removed from roadmap. |

## 10. Corrected dependency map

Dependency direction is now:

proven local recovery/data safety — DONE
→ Installable Offline App and device resilience — DONE
→ stable local identity and Save Library — DONE
→ explicit cross-Save/historical manager identity semantics — DONE
→ narrow identity-safe longitudinal Career Analytics / Trophy Room correction — DONE / PRODUCTION-PROVEN
→ full multi-Save portability — DONE / PRODUCTION-PROVEN
→ Phase B first product-deepening slice — DONE / PRODUCTION-PROVEN
→ Phase C first product-deepening slice — DONE / PRODUCTION-PROVEN
→ clean stop until a new bounded owner authorization
→ optional later local product deepening if explicitly authorized
→ Cloud Readiness architecture if explicitly authorized
→ opt-in private Cloud Backup
→ private Identity / Account Layer
→ private paired-device capability
→ reliable Connected Rivalry
→ private remote joining.

Public community/discovery/global rankings are ELIMINATED and are not a dependency destination.

Independent Showdown/Season-scoped Legacy, Achievement or Analytics improvements remain separate candidates when explicitly authorized.

Dependency order, product/milestone name and release version number are separate decisions. A future roadmap position is never implementation permission.

## 11. Current implementation authorization boundary

**Authorized product candidate: none.**

Phase B first slice and Phase C first slice are closed as production-proven. Hold a clean stop until a further explicit owner instruction authorizes one bounded next slice.

Do not begin profile merge/delete or generic CRUD, broader Analytics 2.0, Season redesign, Legacy 2.0, optional content, cloud, paired device, connected rivalry or remote joining from roadmap ordering alone.

Public community and global leaderboard/rankings are permanently ELIMINATED unless the owner explicitly reverses that lock in a later roadmap amendment.

## 12. Repeated-use and recovery evidence

Automated production proof covers multiple Saves, same-name profiles, explicit cross-Save identity reuse, matching Legacy propagation, historical unresolved/map/unmap behavior, identity-safe Career Statistics/Trophy Room, switching, deletion/profile retention, formatVersion 2 full multi-Save portability, Candidate A/B/C identity preservation, keyboard/focus, Chromebook/mobile/reduced-motion containment, stale authority and corrupt/dual fail-closed behavior.

Long-term human usage remains distinct from automation. Large Save counts, many repeated cycles, true installed-PWA process restarts and extended real-device use remain evidence areas rather than reasons for speculative redesign.

## 13. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains a future architecture contract only. It authorizes no cloud runtime.

Completed prerequisites include recovery/resilience, stable local Save Library/manager identity, identity-safe local Career Analytics and complete local multi-Save portability. None creates or accelerates cloud runtime authorization.

Future cloud work additionally requires explicit revision/conflict/tombstone semantics, authentication/authorization, privacy/retention, provider/cost ownership, recovery/export escape hatches and two-device simulation.

No future cloud module may call localStorage directly.

The private remote path remains ordered:

v1.3.0 Recovery & Device Resilience Hardening — completed protected baseline
→ Local Profiles / Save Library / multi-Save portability — completed local dependency
→ Cloud Readiness — future / not authorized
→ opt-in Cloud Backup
→ private Identity / Account Layer
→ Paired Device
→ Remote Joining.

## 14. Current execution rule

Preserve production `v1.4.0` / `1.4.0-r1`, immediate `1.3.0-r2` whole-shell recovery, the completed Local Profiles / Save Library chain, explicit manager identity linkage, Identity-Safe Career Analytics, formatVersion 2 multi-Save portability, and the closed Phase B and Phase C first slices.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin a runtime feature merely because it appears next in this roadmap. `NEXT_TASK.md` currently authorizes no product candidate. Hold the clean stop until a later explicit owner instruction.
