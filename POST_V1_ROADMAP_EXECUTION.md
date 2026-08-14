# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-14 ET
Status: current dependency/status authority for the post-v1 direction. This file is not an implementation queue and does not assign release versions.

## 1. Current authority

Current production application milestone: v1.3.0 — Recovery & Device Resilience Hardening
Current runtime revision: `1.3.0-r1`
Previous known-good whole shell: `1.2.0-r2`
Current shipped product layer: Visible Local Profiles / Save Library Core UI
Current runtime feature merge: `9c648d10e869a56de54e0fa98c30cf2d2e5d05aa`
Feature release version: intentionally unassigned

`PROJECT_STATE.md` owns current production facts. `NEXT_TASK.md` owns implementation authorization. This file owns dependency direction and roadmap classification only.

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

## 2. Permanent rules inherited by every future area

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains public raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library mutation authority; `js/analytics.js` remains current Analytics calculation authority unless a separately approved architecture change supersedes it. No framework rewrite merely for modernization.

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

All of these layers are technically production-proven.

## 4. Current milestone — v1.3.0 Recovery & Device Resilience Hardening

Status: DONE.

Implementation and technical production proof for the whole-shell v1.3 milestone are closed. PR #37 remains historical/untrusted and is not a current baseline.

Later Local Profiles / Save Library work deliberately remained on the same `v1.3.0` / `1.3.0-r1` application/runtime labels because no new release version was authorized.

## 5. Local Profiles and Save Library — completed dependency milestone, feature version unassigned

Status: FOUNDATION DONE / EXPERIENCE MAY EXPAND.

The shipped product has stable `profile_*`, `save_*` and `season_*` IDs, canonical multi-save state, explicit `activeSaveId`, additive creation, switching, single-Save deletion, visible read-only Local Profiles, old-singleton compatibility, fail-closed authority behavior and Candidate A/B/C compatibility.

This completed foundation does not imply that every stable Local Profile across different Saves is already known to represent one global real-world manager. Current New Showdown creation intentionally creates fresh profiles for the Save/manager roles.

Further UX refinement is evidence-driven only. Profile rename/edit is not generic CRUD and is not required merely to call Save Library complete.

## 6. Source-grounded identity × Legacy × Analytics dependency

Current `js/analytics.js` career aggregation is derived/read-only but keyed by normalized display name. It does not consume `identity.managerProfileIds` when building career manager rows.

That creates a real defect: two distinct same-name authoritative profiles can collapse into one career Analytics manager.

However, a direct `profileId` key replacement is not yet sufficient person-level career semantics because one real manager may currently receive different stable Local Profiles across separately created Saves. Historical Legacy records may also deliberately retain null profile mappings when the relationship is not provable.

The safe dependency is therefore:

stable local IDs and Save Library — DONE
→ explicit cross-Save/profile linkage semantics plus explicit unresolved-history treatment — ACTIVE DEPENDENCY QUESTION
→ identity-safe longitudinal career Analytics / cross-career achievements — BLOCKED on that decision.

This does not force one monolithic Legacy release before every Analytics improvement. Showdown- and Season-scoped history, achievements or visualizations that do not claim cross-history manager identity can remain independent future candidates.

Never use display-name equality to bypass unresolved identity.

## 7. Roadmap classification matrix

The classifications below describe current dependency/product state, not release numbers or automatic implementation order.

| Area | Current classification | Source-grounded interpretation |
| --- | --- | --- |
| Recovery & Device Resilience | DONE | v1.3 implementation and production proof are closed. |
| Installable Offline App | DONE | `1.3.0-r1` whole shell is current and production-proven. |
| Stable Local Identity | DONE | `profile_*`, `save_*`, `season_*` exist and are protected. |
| Local Profiles | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Visible/read-only profiles are shipped; cross-Save person linkage is not implied. |
| Save Library | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Multi-save create/switch/delete/runtime authority is shipped. |
| Historical profile identity mapping | ACTIVE DEPENDENCY QUESTION | Ambiguous Legacy relationships remain unresolved by design. |
| Cross-Save manager/profile linkage semantics | ACTIVE DEPENDENCY QUESTION | Needed before authoritative person-level longitudinal aggregation. |
| Legacy expansion | FUTURE / NOT AUTHORIZED | Showdown/Season-scoped expansion can be independent; identity-linked history depends on the identity decision. |
| Achievements | CONDITIONAL | Showdown/Season achievements can be independent; cross-career manager achievements depend on authoritative identity. |
| Current derived Analytics | FOUNDATION DONE / EXPERIENCE MAY EXPAND | Shipped and useful, but career manager aggregation has a known name-identity limitation. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | BLOCKED | Full career-manager authority depends on explicit cross-Save/historical identity semantics. Independent non-identity enhancements may be separately bounded later. |
| Optional content/league/challenge packs | FUTURE / NOT AUTHORIZED | Must not replace the accepted default Wheel or scoring authority. |
| Custom challenge content | FUTURE / NOT AUTHORIZED | Must preserve canonical scoring and default behavior. |
| Cloud Readiness | FUTURE / NOT AUTHORIZED | Architecture-only future work; no required cloud dependency. |
| Cloud Backup | BLOCKED | Requires Cloud Readiness, provider/cost, auth/privacy, revisions/conflicts/tombstones and recovery escape hatches. |
| Paired-device capability | BLOCKED | Requires reliable private remote persistence/security first. |
| Connected Rivalry | BLOCKED | Requires proven paired-device/sync semantics and conflict safety. |
| Private sharing/groups | BLOCKED | Depends on reliable connected identity, privacy and authorization. |
| Public/community/rankings | CONDITIONAL | Much later only after explicit integrity, moderation, privacy and cost gates. |

## 8. Corrected dependency map

Dependency direction is now understood as:

proven local recovery/data safety — DONE
→ Installable Offline App and device resilience — DONE
→ stable local identity and Save Library — DONE
→ explicit cross-Save/historical manager identity semantics — ACTIVE DEPENDENCY QUESTION
→ identity-safe cross-career Legacy/Achievements and deeper derived Analytics where identity is required
→ optional content/challenge expansion
→ Cloud Readiness with no production cloud dependency
→ opt-in Cloud Backup
→ private paired-device capability
→ reliable Connected Rivalry
→ private sharing/groups
→ only conditionally much later, community/discovery/rankings.

Independent Showdown/Season-scoped Legacy, Achievement or Analytics improvements may branch before global identity resolution when they make no cross-history identity claim.

Dependency order, product/milestone name and release version number are separate decisions. Historical numeric labels such as "v1.4 Legacy" or "v1.5 Analytics" are planning references only and are not current release assignments.

## 9. Smallest high-value future product candidate

The smallest source-supported next product candidate, if the owner explicitly authorizes it, is a bounded manager identity-linkage semantics candidate rather than a broad Legacy or Analytics rewrite.

It should define how existing Local Profiles can be reused/linked across Saves, how unresolved historical identity is represented, how explicit historical mapping works without name guessing, how display labels behave historically, and which existing transaction authority owns any mutation.

Do not combine this candidate with generic rename/archive CRUD, Analytics presentation expansion, cloud, backup redesign or gameplay changes.

After that semantic layer is proven, a separate narrow Analytics candidate can move career aggregation from label authority to authoritative identity while preserving unresolved history honestly.

## 10. Save Library repeated-use and portability evidence

Automated proof already covers three Saves, same-name profiles, switching, switch/reload, active/non-active deletion, keyboard/focus, Chromebook/mobile/reduced-motion containment, stale authority and corrupt/dual fail-closed behavior.

Long-term human usage remains distinct from automation. Large Save counts, many repeated cycles, true installed-PWA process restarts and extended real-device use remain evidence areas rather than reasons for speculative redesign.

Candidate A/B/C compatibility also should not be confused with complete multi-Save portability. The current v1 backup envelope projects the active Save plus Legacy/preferences; it does not serialize the whole Save Library registry for a fresh-device full-library round trip. Any envelope evolution remains separately authorized future work.

## 11. Cloud foundation boundary

`CLOUD_STORAGE_FOUNDATION.md` remains a future architecture contract only. It authorizes no cloud runtime.

The completed prerequisites are current recovery/resilience and stable local Save Library identity. Future cloud work additionally requires explicit revision/conflict/tombstone semantics, authentication/authorization, privacy/retention, provider/cost ownership, recovery/export escape hatches and two-device simulation.

No future cloud module may call localStorage directly.

The cloud-specific dependency order remains:

Current milestone — v1.3.0 Recovery & Device Resilience Hardening
→ Local Profiles and Save Library — completed dependency milestone, feature version unassigned
→ Cloud Readiness
→ opt-in Cloud Backup.

## 12. Current execution rule

Preserve proven `v1.3.0` / `1.3.0-r1` production and the completed Local Profiles / Save Library chain.

Respond to reproducible defects with root-cause analysis and focused regression evidence.

Do not begin another runtime feature merely because it appears next in this roadmap. `NEXT_TASK.md` and later explicit owner authority govern implementation.

Keep concise rolling evidence in `00_CURRENT_HANDOFF.md` under `00_HANDOFF_GOLDEN_RULE.md`.
