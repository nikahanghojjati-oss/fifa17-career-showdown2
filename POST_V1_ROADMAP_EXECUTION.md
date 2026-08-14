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

Current owner-authorized branch candidate: identity-safe longitudinal Career Analytics / Trophy Room correction on `agent/identity-safe-career-analytics`, based on exact production main `8c6fad42e38b4964d848128e40569442c3fa06d5`.

`PROJECT_STATE.md` owns current production facts. `NEXT_TASK.md` owns implementation authorization. This file owns dependency direction and roadmap classification only. An in-progress branch classification is not a claim that the candidate is already shipped.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

## 2. Permanent rules inherited by every future area

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains Analytics calculation authority. No framework rewrite merely for modernization.

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

The current Analytics candidate also has no authorized release-number assignment. Product functionality and release identity remain separate decisions.

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

Current production `js/analytics.js` still has the known name-keyed longitudinal defect recorded in `PROJECT_STATE.md`: two distinct same-name authoritative profiles can collapse into one Career Analytics manager row.

The prerequisite that previously blocked a correct solution is resolved in canonical product semantics:

stable local IDs and Save Library — DONE
→ explicit cross-Save/profile linkage semantics plus explicit unresolved-history treatment — DONE
→ narrow identity-safe longitudinal Career Analytics / Trophy Room correction — OWNER AUTHORIZED / IN PROGRESS.

The active branch candidate corrects the identity-consumption layer without changing mutation authority. Its required semantics are:

- valid stable `profile_*` refs identify longitudinal manager rows;
- one explicitly reused profile aggregates across Saves;
- same-name distinct profile IDs remain distinct;
- unresolved historical manager roles remain excluded from identified longitudinal manager totals/leaderboards until explicitly mapped;
- overall Showdown/Season totals and Showdown/Season-scoped records remain complete despite unresolved identity;
- display labels remain presentation only;
- Rivalry Analytics remains scoped to one Showdown;
- identity changes invalidate Analytics and Trophy Room derived caches/renders coherently.

A direct profile-ID key swap is not sufficiently correct by itself. Unresolved-history treatment and refresh semantics are part of the authorized candidate.

This does not authorize broad Analytics 2.0 expansion or one monolithic Legacy/Achievements release. Showdown- and Season-scoped history, achievements or visualizations remain separate candidates unless required for this narrow correction.

Never use display-name equality to bypass unresolved identity.

## 7. Roadmap classification matrix

The classifications below describe current dependency/product state and branch authorization, not release numbers. `PROJECT_STATE.md` remains production truth until merge/deployment proof.

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
| Achievements | CONDITIONAL | Showdown/Season achievements can be independent; broader cross-career achievements remain separately authorized work. |
| Current production derived Analytics | FOUNDATION DONE / KNOWN IDENTITY LIMITATION | Shipped and useful, but production career manager aggregation remains name-keyed until the active candidate is proven and merged. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | AUTHORIZED / IN PROGRESS | The owner authorized the narrow identity-safe Career Analytics/Trophy Room correction; broader Analytics 2.0 expansion is not implied. |
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
→ narrow identity-safe longitudinal Career Analytics / Trophy Room correction — OWNER AUTHORIZED / IN PROGRESS
→ separately authorized cross-career Legacy/Achievements or broader Analytics expansion where identity is required
→ optional content/challenge expansion
→ Cloud Readiness with no production cloud dependency
→ opt-in Cloud Backup
→ private paired-device capability
→ reliable Connected Rivalry
→ private sharing/groups
→ only conditionally much later, community/discovery/rankings.

Independent Showdown/Season-scoped Legacy, Achievement or Analytics improvements may remain separate when they make no cross-history identity claim.

Dependency order, product/milestone name and release version number are separate decisions. Historical numeric labels such as "v1.4 Legacy" or "v1.5 Analytics" are planning references only and are not current release assignments.

## 9. Current owner-authorized product candidate

The owner has explicitly authorized the narrow identity-safe longitudinal Career Analytics correction identified by the prior roadmap.

The candidate must define and prove how `js/analytics.js` consumes authoritative `identity.managerProfileIds`, how same-name distinct profiles remain separate, how one explicitly reused profile aggregates across Saves, how unresolved historical manager identity is represented without name guessing, how identity changes invalidate calculation/presentation caches, and how Trophy Room consumption remains coherent.

The candidate also corrects the stale developer-bootstrap record that stopped the shipped dependency chain at PR #53 rather than PR #57.

Do not combine this candidate with generic rename/archive CRUD, broad Analytics presentation expansion, cloud, backup redesign, profile editing or gameplay changes.

This roadmap records the current authorization state; `NEXT_TASK.md` owns its exact implementation boundary.

## 10. Save Library repeated-use and portability evidence

Automated production proof covers multiple Saves, same-name profiles, explicit cross-Save identity reuse, matching Legacy propagation, historical unresolved/map/unmap behavior, switching, deletion/profile retention, Candidate A/C identity preservation, keyboard/focus, Chromebook/mobile/reduced-motion containment, stale authority and corrupt/dual fail-closed behavior.

The current Analytics candidate adds deterministic and Chromium proof specifically for identity-safe longitudinal consumption; that evidence is not production proof until the candidate is merged and deployed.

Long-term human usage remains distinct from automation. Large Save counts, many repeated cycles, true installed-PWA process restarts and extended real-device use remain evidence areas rather than reasons for speculative redesign.

Candidate A/B/C compatibility should not be confused with complete multi-Save portability. The current v1 backup envelope projects the active Save plus Legacy/preferences; it does not serialize the whole Save Library registry for a fresh-device full-library round trip. Any envelope evolution remains separately authorized future work.

## 11. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains a future architecture contract only. It authorizes no cloud runtime.

Completed prerequisites are current recovery/resilience and stable local Save Library/manager identity. The current local Analytics correction does not create or accelerate a cloud runtime authorization. Future cloud work additionally requires explicit revision/conflict/tombstone semantics, authentication/authorization, privacy/retention, provider/cost ownership, recovery/export escape hatches and two-device simulation.

No future cloud module may call localStorage directly.

The cloud-specific dependency order remains:

Current milestone — v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles and Save Library — completed dependency milestone, feature version unassigned
→ Cloud Readiness
→ opt-in Cloud Backup.

## 12. Current execution rule

Preserve proven `v1.3.0` / `1.3.0-r1` production, the completed Local Profiles / Save Library chain and the explicit manager identity-linkage foundation while completing only the owner-authorized narrow identity-safe Career Analytics/Trophy Room candidate.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin another runtime feature merely because it appears next in this roadmap. After the current Analytics candidate reaches a coherent production/authority boundary, `NEXT_TASK.md` and a later explicit owner instruction must authorize whatever follows.

Keep current candidate evidence in `IDENTITY_SAFE_CAREER_ANALYTICS_ACTIVE_HANDOFF.md` and fold it back into `00_CURRENT_HANDOFF.md` at the coherent promotion/authority-seal boundary under `00_HANDOFF_GOLDEN_RULE.md`.
