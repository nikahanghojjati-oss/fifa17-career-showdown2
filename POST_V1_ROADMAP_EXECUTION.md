# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-14 ET
Status: current dependency/status authority for the post-v1 direction. This file is not an implementation queue and does not assign release versions.

## 1. Current authority

Current production application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current runtime revision: `1.3.0-r1`
Previous known-good whole shell: `1.2.0-r2`
Current shipped product layer: Explicit Cross-Save / Historical Manager Identity Linkage Foundation
Current runtime feature merge: `95e98c13bbb4cac485531565c3577ae31286d0af`
Feature release version: intentionally unassigned

`PROJECT_STATE.md` owns current production facts. `NEXT_TASK.md` owns implementation authorization. This file owns dependency direction and roadmap classification only.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

## 2. Permanent rules inherited by every future area

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains current Analytics calculation authority unless a separately approved architecture change supersedes it. No framework rewrite merely for modernization.

Data-safety integrity: canonical storage remains exactly three public keys at a time. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the only destructive import Apply stage. Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership and exact verification.

Presentation integrity: accepted FIFA 17-inspired visual behavior, mobile/Chromebook/reduced motion, Settings-owned install/update presentation and established Smart Back ownership remain protected.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal implementation PRs generally exercise 13; Release Integration Burn-In remains main/manual release authority. Performance ceilings and workflow timeouts are not negotiation knobs for future features.

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

All of these layers are technically production-proven.

## 4. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

Status: DONE.

Implementation and technical production proof for the whole-shell v1.3 milestone are closed. PR #37 remains historical/untrusted and is not a current baseline.

Later Local Profiles / Save Library and manager-identity work deliberately remained on the same `v1.3.0` / `1.3.0-r1` application/runtime labels because no new release version was authorized.

## 5. Local Profiles and Save Library — completed dependency milestone, feature version unassigned

Status: FOUNDATION DONE / EXPERIENCE MAY EXPAND.

The shipped product has stable `profile_*`, `save_*` and `season_*` IDs, canonical multi-save state, explicit `activeSaveId`, additive creation, switching, single-Save deletion, visible Local Profiles, old-singleton compatibility, fail-closed authority behavior and Candidate A/B/C compatibility.

Fresh Showdowns still intentionally begin with fresh profiles for their two manager roles. Same display names never imply the same identity.

The completed explicit manager identity foundation extends this Local Profiles / Save Library milestone with:

- explicit reuse of an existing stable Local Profile across Save manager roles;
- same-name distinct profiles preserved unless a user explicitly links a role;
- stable-save-ID-only propagation to an exact matching Legacy copy;
- explicit historical-only map/unmap to an existing profile;
- intentionally unresolved/null historical roles as a supported state;
- profile retention rather than destructive merge/delete;
- display labels remaining historical labels when stable identity refs change;
- Candidate A/C preservation of explicit active `profile_*` refs without a backup-envelope redesign.

Further UX refinement is evidence-driven only. Profile rename/edit and generic profile CRUD are not implied by this completed foundation.

## 6. Source-grounded identity × Legacy × Analytics dependency

Current `js/analytics.js` career aggregation remains derived/read-only but keyed by normalized display name. It does not yet consume `identity.managerProfileIds` when building career manager rows.

That still creates a real defect: two distinct same-name authoritative profiles can collapse into one career Analytics manager.

The prerequisite that previously blocked a correct solution is now resolved in canonical product semantics:

stable local IDs and Save Library — DONE
→ explicit cross-Save/profile linkage semantics plus explicit unresolved-history treatment — DONE
→ identity-safe longitudinal career Analytics / cross-career achievements — READY AS A BOUNDED FUTURE CANDIDATE / NOT AUTHORIZED.

A direct profile-ID key swap is not sufficiently correct by itself. Future Analytics must use authoritative refs where present and represent unresolved historical identity honestly rather than assigning it by display name.

This does not force one monolithic Legacy release before every Analytics improvement. Showdown- and Season-scoped history, achievements or visualizations that do not claim cross-history manager identity can remain independent future candidates.

Never use display-name equality to bypass unresolved identity.

## 7. Roadmap classification matrix

The classifications below describe current dependency/product state, not release numbers or automatic implementation order.

| Area | Current classification | Source-grounded interpretation |
| --- | --- | --- |
| Recovery & Device Resilience | DONE | v1.3 implementation and production proof are closed. |
| Installable Offline App | DONE | `1.3.0-r1` whole shell is current and production-proven. |
| Stable Local Identity | DONE | `profile_*`, `save_*`, `season_*` exist and are protected. |
| Local Profiles | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Visible profiles are shipped; explicit cross-Save reuse now exists without generic profile CRUD. |
| Save Library | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Multi-save create/switch/delete/runtime authority is shipped. |
| Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED | Historical-only roles can be explicitly mapped or remain null when identity is not proven. |
| Cross-Save manager/profile linkage semantics | DONE | Existing Local Profiles can be explicitly reused across Save roles; name matching is never automatic. |
| Legacy expansion | FUTURE / NOT AUTHORIZED | Showdown/Season-scoped expansion can be independent; identity-aware career history can use the shipped identity semantics. |
| Achievements | CONDITIONAL | Showdown/Season achievements can be independent; cross-career manager achievements may now consume explicit identity semantics if separately authorized. |
| Current derived Analytics | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Shipped and useful, but career manager aggregation still has the known name-key limitation. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | READY / NOT AUTHORIZED | The identity prerequisite is shipped; the Analytics correction remains a separate owner-authorized candidate. |
| Optional content/league/challenge packs | FUTURE / NOT AUTHORIZED | Must not replace the accepted default Wheel or scoring authority. |
| Custom challenge content | FUTURE / NOT AUTHORIZED | Must preserve canonical scoring and default behavior. |
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
→ identity-safe cross-career Legacy/Achievements and deeper derived Analytics where identity is required — READY AS SEPARATELY BOUNDED FUTURE WORK
→ optional content/challenge expansion
→ Cloud Readiness with no production cloud dependency
→ opt-in Cloud Backup
→ private paired-device capability
→ reliable Connected Rivalry
→ private sharing/groups
→ only conditionally much later, community/discovery/rankings.

Independent Showdown/Season-scoped Legacy, Achievement or Analytics improvements may remain separate when they make no cross-history identity claim.

Dependency order, product/milestone name and release version number are separate decisions. Historical numeric labels such as "v1.4 Legacy" or "v1.5 Analytics" are planning references only and are not current release assignments.

## 9. Smallest high-value future product candidate

The smallest source-supported future product candidate, if the owner explicitly authorizes it, is a narrow identity-safe longitudinal Career Analytics correction rather than more identity foundation work.

It should define how `js/analytics.js` consumes authoritative `identity.managerProfileIds`, how same-name distinct profiles remain separate, how one explicitly reused profile aggregates across Saves, how unresolved historical manager identity is represented without name guessing, how caches invalidate after identity mapping changes, and how Trophy Room consumption remains coherent.

Do not combine that candidate with generic rename/archive CRUD, broad Analytics presentation expansion, cloud, backup redesign or gameplay changes.

This roadmap classification does not authorize implementation. `NEXT_TASK.md` and later explicit owner authority govern that boundary.

## 10. Save Library repeated-use and portability evidence

Automated proof covers multiple Saves, same-name profiles, explicit cross-Save identity reuse, matching Legacy propagation, historical unresolved/map/unmap behavior, switching, deletion/profile retention, Candidate A/C identity preservation, keyboard/focus, Chromebook/mobile/reduced-motion containment, stale authority and corrupt/dual fail-closed behavior.

Long-term human usage remains distinct from automation. Large Save counts, many repeated cycles, true installed-PWA process restarts and extended real-device use remain evidence areas rather than reasons for speculative redesign.

Candidate A/B/C compatibility should not be confused with complete multi-Save portability. The current v1 backup envelope projects the active Save plus Legacy/preferences; it does not serialize the whole Save Library registry for a fresh-device full-library round trip. Any envelope evolution remains separately authorized future work.

## 11. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains a future architecture contract only. It authorizes no cloud runtime.

Completed prerequisites are current recovery/resilience and stable local Save Library/manager identity. Future cloud work additionally requires explicit revision/conflict/tombstone semantics, authentication/authorization, privacy/retention, provider/cost ownership, recovery/export escape hatches and two-device simulation.

No future cloud module may call localStorage directly.

The cloud-specific dependency order remains:

Current milestone — v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles and Save Library — completed dependency milestone, feature version unassigned
→ Cloud Readiness
→ opt-in Cloud Backup.

## 12. Current execution rule

Preserve proven `v1.3.0` / `1.3.0-r1` production, the completed Local Profiles / Save Library chain and the explicit manager identity-linkage foundation.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin another runtime feature merely because it appears next in this roadmap. `NEXT_TASK.md` and later explicit owner authority govern implementation.

Keep concise rolling evidence in `00_CURRENT_HANDOFF.md` under `00_HANDOFF_GOLDEN_RULE.md`.
