# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-17 ET (Remote Joining priority clarification)
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

The owner clarified on 2026-08-17 that Private Remote Joining is a prioritized long-term product destination. That changes roadmap priority, not current implementation authorization.

No roadmap position by itself authorizes a new runtime candidate.

## 2. Permanent rules inherited by every future area

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains Analytics calculation authority. No framework rewrite merely for modernization.

Data-safety integrity: canonical storage remains exactly three public keys at a time. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the only destructive import Apply stage. Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership and exact verification.

Presentation integrity: accepted FIFA 17-inspired visual behavior, mobile/Chromebook/reduced motion, Settings-owned install/update presentation and established Smart Back ownership remain protected.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal implementation/authority PRs generally exercise 13; Release Integration Burn-In remains main/manual release authority. Performance ceilings and workflow timeouts are not negotiation knobs for future features.

Product philosophy lock: Career Mode Showdown is a private two-manager companion. Public community features and global leaderboard/rankings are **ELIMINATED**. Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**. Its priority requires the ordered enabling path to be completed rather than bypassed: Cloud/sync readiness → private identity/auth → paired-device/private-session capability → Connected Rivalry/two-device proof → Remote Joining.

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
| Cloud Readiness | FUTURE / NOT AUTHORIZED | First enabling prerequisite of the prioritized Remote Joining path when a bounded network-foundation candidate is explicitly authorized; architecture-only until then. |
| Cloud Backup | BLOCKED | Separate optional private backup product; requires Cloud Readiness, provider/cost, auth/privacy, revisions/conflicts/tombstones and recovery escape hatches. It may share the cloud foundation but is not a substitute for Remote Joining synchronization/session infrastructure. |
| Private Identity / Account Layer | BLOCKED / PRIORITIZED PREREQUISITE | Becomes the next Remote Joining prerequisite only after the required Cloud/sync foundation is proven; requires privacy/security/auth definition. |
| Paired-device capability | BLOCKED / PRIORITIZED PREREQUISITE | Requires reliable private remote persistence, authenticated identity, device/session security and revocation first. |
| Connected Rivalry | BLOCKED / PRIORITIZED PREREQUISITE | Requires proven paired-device/sync semantics, stale-write safety, conflict handling and offline/reconnect recovery. |
| Private sharing/groups | BLOCKED | Depends on reliable connected identity, privacy and authorization; it is not required to become a public community surface. |
| Private Remote Joining | PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET AUTHORIZED | Strategic private two-manager destination. Implement only after Cloud/sync readiness → private identity/auth → paired device/private session → Connected Rivalry/two-device proof are complete. |
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
→ clean stop until a new bounded owner authorization.

From that clean stop, local Product Deepening may continue when explicitly authorized. However, once future networked work is selected, the owner-prioritized strategic path is:

Cloud / synchronization readiness
→ private account / authentication / authorization identity
→ secure paired-device / private-session capability
→ reliable Connected Rivalry synchronization with conflict/offline/two-device proof
→ private Remote Joining / session experience.

Optional Private Cloud Backup may branch from the Cloud foundation when separately authorized; it is not itself a substitute for the synchronization and session prerequisites above.

When the project reaches future networked work and no later owner instruction overrides the 2026-08-17 priority, the next safe prerequisite on the Remote Joining path should be preferred over unrelated optional expansion.

Public community/discovery/global rankings are ELIMINATED and are not a dependency destination.

Independent Showdown/Season-scoped Legacy, Achievement or Analytics improvements remain separate candidates when explicitly authorized, but they must not be used to characterize Remote Joining as permanently blocked or non-priority.

Dependency order, product/milestone name and release version number are separate decisions. A future roadmap position is never implementation permission.

## 11. Current implementation authorization boundary

**Authorized product candidate: none.**

Phase B first slice and Phase C first slice are closed as production-proven. Hold a clean stop until a further explicit owner instruction authorizes one bounded next slice.

Do not begin profile merge/delete or generic CRUD, broader Analytics 2.0, Season redesign, Legacy 2.0, optional content, Cloud/sync runtime, private identity/auth, paired device, Connected Rivalry or Remote Joining from roadmap ordering alone.

The 2026-08-17 Remote Joining amendment sets long-term priority only. It does not skip the requirement for a bounded `NEXT_TASK.md` authorization at each prerequisite stage.

Public community and global leaderboard/rankings are permanently ELIMINATED unless the owner explicitly reverses that lock in a later roadmap amendment.

## 12. Repeated-use and recovery evidence

Automated production proof covers multiple Saves, same-name profiles, explicit cross-Save identity reuse, matching Legacy propagation, historical unresolved/map/unmap behavior, identity-safe Career Statistics/Trophy Room, switching, deletion/profile retention, formatVersion 2 full multi-Save portability, Candidate A/B/C identity preservation, keyboard/focus, Chromebook/mobile/reduced-motion containment, stale authority and corrupt/dual fail-closed behavior.

Long-term human usage remains distinct from automation. Large Save counts, many repeated cycles, true installed-PWA process restarts and extended real-device use remain evidence areas rather than reasons for speculative redesign.

## 13. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains a future architecture contract only. It authorizes no cloud runtime.

Completed prerequisites include recovery/resilience, stable local Save Library/manager identity, identity-safe local Career Analytics and complete local multi-Save portability. None creates cloud runtime authorization by itself.

The owner has nevertheless prioritized the private Remote Joining destination. Therefore future Cloud/sync foundation work, when explicitly authorized, should be designed as the first enabling layer for secure private remote sessions rather than as an isolated side quest.

Future cloud work additionally requires explicit revision/conflict/tombstone semantics, authentication/authorization, privacy/retention, provider/cost ownership, recovery/export escape hatches and two-device simulation.

No future cloud module may call localStorage directly.

The prioritized private remote path remains ordered:

v1.3.0 Recovery & Device Resilience Hardening — completed protected baseline
→ Local Profiles / Save Library / multi-Save portability — completed local dependency
→ Cloud / sync Readiness — future / not authorized until bounded candidate
→ private Identity / authentication / authorization
→ Paired Device / private-session security
→ Connected Rivalry synchronization + two-device conflict/offline proof
→ Private Remote Joining.

Optional Private Cloud Backup remains a separately bounded use of the Cloud foundation and is not required to masquerade as the Remote Joining transport layer.

## 14. Current execution rule

Preserve production `v1.4.0` / `1.4.0-r1`, immediate `1.3.0-r2` whole-shell recovery, the completed Local Profiles / Save Library chain, explicit manager identity linkage, Identity-Safe Career Analytics, formatVersion 2 multi-Save portability, and the closed Phase B and Phase C first slices.

Preserve the 2026-08-17 strategic decision that Private Remote Joining is prioritized long-term but dependency-gated. Future developers must neither rush it before prerequisites nor indefinitely deprioritize it behind unrelated optional work once the networked roadmap lane is explicitly opened.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin a runtime feature merely because it appears next in this roadmap. `NEXT_TASK.md` currently authorizes no product candidate. Hold the clean stop until a later explicit owner instruction.
