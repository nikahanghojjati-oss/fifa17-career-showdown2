# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-18 ET (Phase 1F complete / Stage 2A next)
Status: current dependency/status authority for post-v1 direction. `NEXT_TASK.md` remains the sole primary implementation-authorization authority.

## 1. Current authority

Current production application milestone: **v1.4.0 — Product Deepening**
Current runtime revision: `1.4.0-r1`
Previous known-good whole shell: `1.3.0-r2`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Cloud/Sync Readiness Phase 1C merge: `59957f8b0c29ce0cd480a0e9270a095160005599` (PR #78)
Cloud/Sync Readiness Phase 1D merge: `fc2e8e8b921a435103a438a9239efbb890584d22` (PR #79)
Cloud/Sync Readiness Phase 1E merge: `cebd9c031657c9ee01ba68f1baaac7816c9748b9` (PR #80)
Cloud/Sync Readiness Phase 1F merge: `231556d86a93535fa90e173577c1159de4f40be0` (PR #81)
Authorized product candidate: none
Current authorized prerequisite candidate: **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary**

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

The owner has explicitly opened the prioritized connected-prerequisite lane. That instruction permits one bounded dependency gate at a time and does not authorize skipping from account identity to pairing, Connected Rivalry or Remote Joining.

## 2. Permanent inherited rules

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains derived Analytics authority.

Data-safety integrity: canonical storage remains exactly three public keys. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the only destructive import Apply stage. Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership and exact verification.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal PRs generally exercise 13; Release Integration Burn In remains main/manual release authority. Performance ceilings and timeouts are not knobs to obtain green CI.

Product philosophy lock: Career Mode Showdown is a private two-manager companion. Public community features and global leaderboard/rankings are **ELIMINATED**. Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

## 3. Completed dependency chain

`v1.0.x Stability Lane`
→ `v1.1.x Data Safety and Recovery`
→ `v1.2.0 Installable Offline App`
→ `v1.3.0 Recovery & Device Resilience Hardening`
→ `Local Profiles / Save Library identity foundation`
→ `Local Profiles / Save Library canonical persistence`
→ `Local Profiles / Save Library runtime authority cutover`
→ `Visible Local Profiles / Save Library Core UI`
→ `Explicit cross-Save / historical manager identity linkage foundation`
→ `Identity-Safe longitudinal Career Analytics / Trophy Room consumption`
→ `Local Profile display-label editing / 1.3.0-r2 whole-shell maintenance`
→ `formatVersion 2 full multi-Save backup/import portability`
→ `Phase A authority synchronization`
→ `Phase B Save Library / Local Profile Experience 2.0 first slice`
→ `Phase C Showdown Home & Season Experience first slice`
→ `v1.4.0 — Product Deepening visible seal / 1.4.0-r1 whole shell`
→ `Cloud/Sync Phase 1A` — PR #76 / DONE
→ `Phase 1B` — PR #77 / DONE
→ `Phase 1C` — PR #78 / DONE
→ `Phase 1D` — PR #79 / DONE
→ `Phase 1E` — PR #80 / DONE
→ `Phase 1F` — PR #81 / DONE
→ `Private Account / Authentication / Authorization` — CURRENT Stage 2 lane.

## 4. Completed resilience baseline — v1.3.0 Recovery & Device Resilience Hardening

Status: DONE / PROTECTED BASELINE.

Candidate A/B/C ownership, fail-closed restore behavior, exact raw snapshot authority and whole-shell recovery remain binding beneath v1.4.0.

## 5. Local Profiles and Save Library — completed dependency milestone

Status: FOUNDATION DONE / FIRST EXPERIENCE DEEPENING SLICE DONE.

Stable `profile_*`, `save_*` and `season_*` identities, canonical multi-Save authority, explicit active-Save switching, visible Local Profiles, explicit cross-Save reuse and unresolved historical identity semantics are shipped. Same visible names never establish identity.

Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED.
Cross-Save manager/profile linkage semantics | DONE.
Current production derived Analytics | IDENTITY-SAFE / PRODUCTION-PROVEN.
Identity-safe longitudinal Analytics / Analytics 2.0 | NARROW IDENTITY-SAFE LAYER DONE.
Backup/import envelope portability | DONE / PRODUCTION-PROVEN.
Showdown Home & Season Experience | FIRST SLICE DONE / PRODUCTION-PROVEN.

## 6. Current Product Deepening milestone

v1.4.0 groups the already-shipped Phase B and Phase C first slices. Runtime remains `1.4.0-r1`; `1.3.0-r2` is the immediate previous known-good whole shell.

Further unrelated local Product Deepening must not displace the next safe Remote Joining prerequisite while the connected lane is active.

## 7. Cloud Readiness / Sync Readiness — completed prerequisite stage

### Phase 1A — deterministic revision/conflict model

Status: DONE / MERGED / PROTECTED — PR #76.

Proves monotonic revisions, immutable `baseRevision` compare-and-swap, explicit stale conflicts, tombstones, anti-resurrection, explicit restore and replay/idempotency behavior.

### Phase 1B — provider and operational decision

Status: DONE / MERGED / PROTECTED — PR #77.

Firebase Authentication + Cloud Firestore remains the primary future provider candidate. Firestore persistent offline cache remains disabled. Project-owned revision/conflict semantics remain authoritative.

### Phase 1C — remote data inventory / privacy / retention

Status: DONE / MERGED / PROTECTED — PR #78.

Remote-by-need only, private-by-default, minimized identity/metadata, bounded retention, account deletion revocation, local-only fallback and permanent public-feature prohibition remain protected.

### Phase 1D — exact remote schema and API/authorization contract

Status: DONE / MERGED / PROTECTED — PR #79.

Defines exact Firebase-compatible paths/fields, immutable original `baseRevision`, deterministic replay/conflict output, deny-by-default object authorization, two-owner governance and provider/application identity separation.

### Phase 1E — deterministic two-device/offline harness

Status: DONE / MERGED / PROTECTED — PR #80.

Proves stale conflict, immutable queued intent, replay/idempotency, tombstone anti-resurrection, reconnect reauthorization, two-owner mutation freeze and Candidate C-grade local Apply protection without provider/runtime dependency.

### Phase 1F — Firebase Emulator / Security Rules proof

Status: DONE / MERGED / PROTECTED — PR #81.

Exact validated head: `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`.
Squash merge: `231556d86a93535fa90e173577c1159de4f40be0`.

The proof uses fixed demo project `demo-career-mode-showdown-phase1f`, deny-by-default Firestore Security Rules, provider-authenticated `request.auth.uid`, real Firestore transaction retry behavior and synthetic emulator data only.

Every application-client Firestore write remains denied. The Phase 1D shared-state schema does not expose the idempotency-key hash needed for Security Rules to identify the matching sibling replay receipt, so a modified client could otherwise omit required replay authority. A trusted mutation gateway or separately reviewed protocol/schema change remains a later gate. Cloud Functions/Admin/Blaze are not authorized.

Production Firebase remains disconnected and no production runtime version bump is required.

## 8. Private Account / Authentication / Authorization — active prerequisite lane

Stage status: ACTIVE PRIORITY LANE / DEPENDENCY-GATED.

### Stage 2A — Firebase Auth Emulator Identity Boundary

Status: AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

The smallest next proof must use the Firebase Authentication Emulator and existing Firestore Emulator under the same fixed demo project to establish real `uid` → `accountId` identity semantics, cross-service Security Rules authentication, wrong-account/unauthenticated/sign-out denial, app-account lifecycle separation and no unsafe credential persistence.

Stage 2A remains test/emulator-only. Production accounts, signup/login UI, production Auth persistence, provider-level disable/revocation, safe app account writes, account export/deletion, abuse/rate controls and provider production operations remain later Stage 2 gates.

Registered devices and private pairing remain Stage 3 and may not be pulled into Stage 2A.

## 9. Roadmap classification matrix

| Area | Current classification | Source-grounded interpretation |
| --- | --- | --- |
| Recovery & Device Resilience | DONE / PROTECTED BASELINE | v1.3 guarantees remain binding. |
| Installable Offline App | DONE / `1.4.0-r1` PRODUCTION | Current whole shell remains v1.4.0-r1. |
| Stable Local Identity | DONE | `profile_*`, `save_*`, `season_*` protected. |
| Local Profiles | FOUNDATION + FIRST UX SLICE DONE | Shipped. |
| Save Library | FOUNDATION + FIRST UX SLICE DONE | Shipped. |
| Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED | No name guessing. |
| Cross-Save manager/profile linkage semantics | DONE | Explicit stable-ID reuse only. |
| Backup/import envelope portability | DONE / PRODUCTION-PROVEN | formatVersion 2 shipped. |
| Current production derived Analytics | IDENTITY-SAFE / PRODUCTION-PROVEN | Stable Local Profile identity authoritative. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | NARROW IDENTITY-SAFE LAYER DONE | Broader expansion separate. |
| Showdown Home & Season Experience | FIRST SLICE DONE / PRODUCTION-PROVEN | PR #73 shipped. |
| Cloud Readiness | PHASE 1A DONE / 1B DONE / 1C DONE / 1D DONE / 1E DONE / 1F DONE | Provider proof complete; production Firebase still disconnected. |
| Private Identity / Account Layer | STAGE 2 ACTIVE / 2A AUTHORIZED NEXT | Emulator identity proof is next; production account runtime still gated. |
| Paired-device capability | BLOCKED / PRIORITIZED PREREQUISITE | Waits for Stage 2. |
| Connected Rivalry | BLOCKED / PRIORITIZED PREREQUISITE | Waits for pairing and Stage 2. |
| Cloud Backup | BLOCKED | Optional private product, not a session-sync substitute. |
| Private Remote Joining | PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET AUTHORIZED | Final private session destination. |
| Public/community/rankings | ELIMINATED | Must not return. |

## 10. Corrected dependency map

proven local recovery/data safety — DONE
→ Installable Offline App/device resilience — DONE
→ stable local identity/Save Library — DONE
→ explicit cross-Save/historical identity — DONE
→ Identity-Safe Career Analytics — DONE
→ multi-Save portability — DONE
→ Product Deepening first slices — DONE
→ Cloud/Sync Phase 1A — DONE
→ Phase 1B — DONE
→ Phase 1C — DONE
→ Phase 1D — DONE
→ Phase 1E — DONE
→ Phase 1F — DONE / PR #81
→ Private Account/Auth/Authorization Stage 2 — CURRENT
→ Stage 3 secure paired-device/private-session
→ Stage 4 Connected Rivalry
→ Stage 5 Private Remote Joining.

## 11. Stage 3 — Registered Devices and Private Pairing

Status: BLOCKED until Stage 2 is proven.

Required later: revocable `deviceId`, device identity never as authentication, expiring one-use capability invites, replay protection, exact account/session authorization, revocation/cancellation recovery, unauthorized join denial and no public discovery.

## 12. Stage 4 — Connected Rivalry Synchronization

Status: BLOCKED until Stage 3 is proven.

Requires private authorized rivalry access, revision-safe mutations, explicit conflicts, tombstone safety, reconnect recovery, deterministic offline behavior, two-device proof, Candidate C-grade local Apply and local-only escape hatch.

## 13. Stage 5 — Private Remote Joining

Status: PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET AUTHORIZED.

Only after Stages 1 through 4 are production-proven may the Remote Joining UX/runtime itself begin.

## 14. Versioning interaction

`VERSIONING_POLICY.md` remains authority. Dormant docs/tests/emulator proof consume no visible application version. The first production-connected account/cloud capability must receive the PATCH/MINOR/MAJOR bump justified by actual shipped scope; an `rN` suffix never hides a semantic bump.

## 15. Immediate direction

The current exact next prerequisite is Stage 2A Auth Emulator identity proof. Current Work Environment Continuity may require a transition before its implementation. A successor must initialize fresh continuity state, then implement only Stage 2A if its own assessment permits.
