# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-15 ET
Status: current dependency/status authority for the post-v1 direction. This file is not an implementation queue and does not assign release versions.

## 1. Current authority

Current production application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current runtime revision: `1.3.0-r1`
Previous known-good whole shell: `1.2.0-r2`
Current shipped product layer: Identity-Safe Career Analytics / Trophy Room longitudinal consumption
Current runtime feature merge: `c5c7d50cc3a2d9003e057d1813744c877323c068`
Feature release version: intentionally unassigned
Active bounded candidate: Local Profile display-label editing on candidate whole shell `1.3.0-r2`

`PROJECT_STATE.md` owns current production facts. `NEXT_TASK.md` owns implementation authorization. This file owns dependency direction and roadmap classification only.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

Exactly one later owner-authorized runtime candidate is active after the Analytics production seal: Local Profile display-label editing. `NEXT_TASK.md` owns its exact boundary. No second product area is authorized.

## 2. Permanent rules inherited by every future area

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains Analytics calculation authority. No framework rewrite merely for modernization.

Data-safety integrity: canonical storage remains exactly three public keys at a time. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the only destructive import Apply stage. Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership and exact verification.

Presentation integrity: accepted FIFA 17-inspired visual behavior, mobile/Chromebook/reduced motion, Settings-owned install/update presentation and established Smart Back ownership remain protected.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal implementation/authority PRs generally exercise 13; Release Integration Burn-In remains main/manual release authority. Performance ceilings and workflow timeouts are not negotiation knobs for future features.

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

All of these layers are technically production-proven.

## 4. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

Status: DONE.

Implementation and technical production proof for the whole-shell v1.3 milestone are closed. PR #37 remains historical/untrusted and is not a current baseline.

Later Local Profiles / Save Library, manager-identity and Analytics work originally remained on the same `v1.3.0` / `1.3.0-r1` labels. The active display-label candidate keeps application v1.3.0 but advances the atomic candidate shell to `1.3.0-r2` so changed runtime bytes can update installed clients coherently; this delivery revision is not a second feature or a new application milestone.

Product functionality and release identity remain separate decisions.

## 5. Local Profiles and Save Library — completed dependency milestone, feature version unassigned

Status: FOUNDATION DONE / EXPERIENCE MAY EXPAND.

The shipped product has stable `profile_*`, `save_*` and `season_*` IDs, canonical multi-save state, explicit `activeSaveId`, additive creation, switching, single-Save deletion, visible Local Profiles, old-singleton compatibility, fail-closed authority behavior and Candidate A/B/C compatibility.

Fresh Showdowns still intentionally begin with fresh profiles for their two manager roles. Same display names never imply the same identity.

The completed explicit manager identity foundation includes:

- explicit reuse of an existing stable Local Profile across Save manager roles;
- same-name distinct profiles preserved unless a user explicitly links a role;
- stable-save-ID-only propagation to an exact matching Legacy copy;
- explicit historical-only map/unmap to an existing profile;
- intentionally unresolved/null historical roles as a supported state;
- profile retention rather than destructive merge/delete;
- display labels remaining historical labels when stable identity refs change;
- Candidate A/C preservation of explicit active `profile_*` refs without a backup-envelope redesign.

The current bounded experience expansion authorizes display-label editing only. Profile merge/delete and generic profile CRUD remain unassigned.

## 6. Source-grounded identity × Legacy × Analytics dependency

The identity-consumption dependency is now complete in production:

stable local IDs and Save Library — DONE
→ explicit cross-Save/profile linkage semantics plus explicit unresolved-history treatment — DONE
→ narrow identity-safe longitudinal Career Analytics / Trophy Room correction — DONE / PRODUCTION-PROVEN.

Production `js/analytics.js` now keys longitudinal manager aggregation by valid stable `profile_*` references. One explicitly reused profile aggregates across Saves; same-name distinct profile IDs remain distinct; unresolved historical roles remain excluded from identified longitudinal manager totals/leaderboards until explicitly mapped; identity-independent totals and Showdown/Season-scoped records remain complete; display labels remain presentation only; Rivalry Analytics remains Showdown-scoped; identity and profile-presentation changes invalidate Analytics/Trophy Room derived caches coherently.

PR #59 final head `a0aa98e3b24d73ca51dde7d1ebf0856550a0c7e1` passed all 13 normal PR workflow families. Merge `c5c7d50cc3a2d9003e057d1813744c877323c068` passed exact production/deployed proof including Stability run `31827619109` and deployed-site-smoke job `94855938131`.

This completion does not authorize broad Analytics 2.0 expansion or one monolithic Legacy/Achievements release. Showdown- and Season-scoped history, achievements or visualizations remain separate candidates unless required by a later explicit task.

Never use display-name equality to bypass unresolved identity.

## 7. Roadmap classification matrix

The classifications below describe dependency/product state, not release numbers or implementation authorization. `NEXT_TASK.md` remains the sole primary task authority.

| Area | Current classification | Source-grounded interpretation |
| --- | --- | --- |
| Recovery & Device Resilience | DONE | v1.3 implementation and production proof are closed. |
| Installable Offline App | DONE / r2 CANDIDATE | `1.3.0-r1` remains production-proven; `1.3.0-r2` is the active whole-shell candidate required to deliver the bounded label editor atomically. |
| Stable Local Identity | DONE | `profile_*`, `save_*`, `season_*` exist and are protected. |
| Local Profiles | DISPLAY-LABEL CANDIDATE ACTIVE | Visible profiles and explicit cross-Save reuse are shipped; only presentation-label editing is active, without generic profile CRUD. |
| Save Library | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Multi-save create/switch/delete/runtime authority is shipped. |
| Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED | Historical-only roles can be explicitly mapped or remain null when identity is not proven. |
| Cross-Save manager/profile linkage semantics | DONE | Existing Local Profiles can be explicitly reused across Save roles; name matching is never automatic. |
| Current production derived Analytics | IDENTITY-SAFE / PRODUCTION-PROVEN | Career manager aggregation and Trophy Room now consume stable Local Profile identity with explicit unresolved-history semantics. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | NARROW IDENTITY-SAFE LAYER DONE | The owner-authorized identity correction is shipped; broader Analytics 2.0 expansion is separate and not authorized. |
| Legacy expansion | FUTURE / NOT AUTHORIZED | Showdown/Season-scoped expansion or deeper career history remains separately bounded. |
| Achievements | CONDITIONAL | Requires a separately authorized product definition. |
| Optional content/league/challenge packs | FUTURE / NOT AUTHORIZED | Must not replace the accepted default Wheel or scoring authority. |
| Custom challenge content | FUTURE / NOT AUTHORIZED | Must preserve canonical scoring and default behavior. |
| Backup/import envelope portability | FUTURE / NOT AUTHORIZED | Current v1 envelope does not serialize the complete Save Library registry for fresh-device full-library round trip. |
| Cloud Readiness | FUTURE / NOT AUTHORIZED | Architecture-only future work; no required cloud dependency. |
| Cloud Backup | BLOCKED | Requires Cloud Readiness, provider/cost, auth/privacy, revisions/conflicts/tombstones and recovery escape hatches. |
| Paired-device capability | BLOCKED | Requires reliable private remote persistence/security first. |
| Connected Rivalry | BLOCKED | Requires proven paired-device/sync semantics and conflict safety. |
| Private sharing/groups | BLOCKED | Depends on reliable connected identity, privacy and authorization. |
| Public/community/rankings | CONDITIONAL | Much later only after explicit integrity, moderation, privacy and cost gates. |

## 8. Corrected dependency map

Dependency direction is now:

proven local recovery/data safety — DONE
→ Installable Offline App and device resilience — DONE
→ stable local identity and Save Library — DONE
→ explicit cross-Save/historical manager identity semantics — DONE
→ narrow identity-safe longitudinal Career Analytics / Trophy Room correction — DONE / PRODUCTION-PROVEN
→ separately authorized cross-career Legacy/Achievements, broader Analytics, profile UX or backup portability work if later approved
→ optional content/challenge expansion
→ Cloud Readiness with no production cloud dependency
→ opt-in Cloud Backup
→ private paired-device capability
→ reliable Connected Rivalry
→ private sharing/groups
→ only conditionally much later, community/discovery/rankings.

Independent Showdown/Season-scoped Legacy, Achievement or Analytics improvements may remain separate when they make no cross-history identity claim.

Dependency order, product/milestone name and release version number are separate decisions. Historical numeric labels are planning references only and are not current release assignments.

## 9. Current implementation authorization boundary

The sole active runtime candidate is Local Profile display-label editing under `NEXT_TASK.md`.

Do not broaden it into backup portability, profile merge/delete or generic CRUD, Legacy, Achievements, broader Analytics 2.0, optional content or cloud because those areas appear technically ready or next in dependency order.

When a later explicit owner instruction authorizes a product area, reconstruct current source and only the relevant history, preserve all shipped identity/recovery/PWA/gameplay boundaries, then implement the smallest bounded candidate supported by evidence.

## 10. Save Library repeated-use and portability evidence

Automated production proof covers multiple Saves, same-name profiles, explicit cross-Save identity reuse, matching Legacy propagation, historical unresolved/map/unmap behavior, identity-safe Career Statistics/Trophy Room, switching, deletion/profile retention, Candidate A/C identity preservation, keyboard/focus, Chromebook/mobile/reduced-motion containment, stale authority and corrupt/dual fail-closed behavior.

Long-term human usage remains distinct from automation. Large Save counts, many repeated cycles, true installed-PWA process restarts and extended real-device use remain evidence areas rather than reasons for speculative redesign.

Candidate A/B/C compatibility should not be confused with complete multi-Save portability. The current v1 backup envelope projects the active Save plus Legacy/preferences; it does not serialize the whole Save Library registry for a fresh-device full-library round trip. Any envelope evolution remains separately authorized future work.

## 11. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains a future architecture contract only. It authorizes no cloud runtime.

Completed prerequisites now include recovery/resilience, stable local Save Library/manager identity and identity-safe local Career Analytics. None creates or accelerates a cloud runtime authorization. Future cloud work additionally requires explicit revision/conflict/tombstone semantics, authentication/authorization, privacy/retention, provider/cost ownership, recovery/export escape hatches and two-device simulation.

No future cloud module may call localStorage directly.

The cloud-specific dependency order remains:

Current milestone — v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles and Save Library — completed dependency milestone, feature version unassigned
→ Cloud Readiness
→ opt-in Cloud Backup.

## 12. Current execution rule

Preserve proven `v1.3.0` / `1.3.0-r1` production, the completed Local Profiles / Save Library chain, explicit manager identity linkage and Identity-Safe Career Analytics while validating the bounded `1.3.0-r2` Local Profile display-label candidate.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin a second runtime feature merely because it appears next in this roadmap. Completion of the active label candidate authorizes nothing that follows.
