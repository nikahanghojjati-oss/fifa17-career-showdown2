# Career Mode Showdown — Post-v1 Roadmap Execution Guide

Last updated: 2026-08-17 ET (Cloud/Sync Readiness Phase 1C remote-data policy)
Status: current dependency/status authority for post-v1 direction. `NEXT_TASK.md` remains the sole primary implementation-authorization authority.

## 1. Current authority

Current production application milestone: **v1.4.0 — Product Deepening**
Current runtime revision: `1.4.0-r1`
Previous known-good whole shell: `1.3.0-r2`
Completed resilience baseline: v1.3.0 — Recovery & Device Resilience Hardening
Current production runtime feature merge: `8fc671fc644e69b4fd405d7ebc28f961b2f3ae27` (PR #67 formatVersion 2 full multi-Save portability)
Phase B first-slice production merge: `65b6c9db0a070b6e5e992a39dffeee23df0c6f08` (PR #70)
Phase C first-slice production merge: `dec1d3ba8182c3f62019974dd1704c7c9124def6` (PR #73)
Cloud/Sync Readiness Phase 1A merge: `b1fafd9cba7e2c647b88445026f6c2d1134378b1` (PR #76)
Cloud/Sync Readiness Phase 1B merge: `2dc61e24ef07a0a150a228865f954ab3b3941398` (PR #77)
Feature release version: **v1.4.0**
Authorized product candidate: **none**
Current authorized prerequisite candidate: **Phase 1C remote data inventory / privacy / retention**
Next prerequisite after Phase 1C merges: **Phase 1D exact remote schema / API / authorization contract**

v1.1 Data Safety and Recovery is complete. Candidate A/B/C are protected systems, not the current feature task.

The owner has explicitly opened the prioritized connected-prerequisite lane. That instruction permits one bounded dependency gate at a time; it does not authorize skipping ahead to network runtime, account/auth, pairing, Connected Rivalry or Remote Joining.

## 2. Permanent inherited rules

Gameplay integrity: exactly two managers; same selected league; different permanent clubs; Showdown lengths 1/3/5/10; 11-point maximum; equal non-zero scores Draw; only 0–0 uses league position then league points.

Architecture integrity: `js/screens.js` remains navigation authority; `js/storage.js` remains raw browser-storage authority; `js/storageTransaction.js` remains raw transaction authority; `js/saveLibraryRuntime.js` remains Save Library/manager-identity mutation authority; `js/analytics.js` remains derived Analytics authority.

Data-safety integrity: canonical storage remains exactly three public keys. Candidate A remains non-mutating export, Candidate B read-only analysis and Candidate C the only destructive import Apply stage. Candidate C keeps strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber ownership and exact verification.

Validation integrity: 14 permanent workflow families and 27 protected multiline executable blocks remain. Normal PRs generally exercise 13; Release Integration Burn-In remains main/manual release authority. Performance ceilings and timeouts are not knobs to obtain green CI.

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
→ `Cloud/Sync Readiness Phase 1A deterministic revision model` — PR #76 / DONE
→ `Cloud/Sync Readiness Phase 1B provider decision` — PR #77 / DONE.

All runtime/product layers through v1.4.0 remain closed and production-proven. Phases 1A/1B are protected non-runtime architecture prerequisites and do not change the visible runtime version.

## 4. Completed resilience baseline — v1.3.0 Recovery & Device Resilience Hardening

Status: DONE / PROTECTED BASELINE.

The v1.3 resilience milestone remains the protected recovery and device baseline beneath v1.4.0 Product Deepening. Candidate A/B/C ownership, fail-closed restore behavior, exact raw snapshot authority and whole-shell recovery remain binding. Runtime `1.3.0-r2` remains the immediate previous known-good whole shell for `1.4.0-r1`.

## 5. Local Profiles and Save Library — completed dependency milestone

Status: FOUNDATION DONE / FIRST EXPERIENCE DEEPENING SLICE DONE.

Stable `profile_*`, `save_*` and `season_*` identities, canonical multi-Save authority, explicit active-Save switching, visible Local Profiles, explicit cross-Save reuse and unresolved historical identity semantics are shipped. Same visible names never establish identity.

Historical profile identity mapping: FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED.

Cross-Save manager/profile linkage semantics: DONE.

Current production derived Analytics: IDENTITY-SAFE / PRODUCTION-PROVEN.

Identity-safe longitudinal Analytics / Analytics 2.0: NARROW IDENTITY-SAFE LAYER DONE; broader Analytics 2.0 remains separate.

formatVersion 2 full multi-Save portability: DONE / PRODUCTION-PROVEN.

Same-name profiles never imply identity. Unresolved historical roles may remain null until explicitly mapped. Do not reopen completed portability or identity work as a prerequisite excuse.

## 6. Current Product Deepening milestone

v1.4.0 groups the already-shipped Phase B and Phase C first slices. Runtime remains `1.4.0-r1`; `1.3.0-r2` is the immediate previous known-good whole shell.

Further local Product Deepening remains a separate future candidate. Once the connected lane is active, unrelated optional expansion must not indefinitely displace the next safe Remote Joining prerequisite.

## 7. Cloud Readiness / Sync Readiness — active prerequisite lane

### Phase 1A — deterministic revision/conflict model

Status: DONE / MERGED / PROTECTED — PR #76.

Proves monotonic revisions, immutable `baseRevision` compare-and-swap, explicit stale conflicts, tombstones, anti-resurrection, explicit restore, replay/idempotency behavior, scope separation and deterministic tests without provider/network/browser-storage ownership.

### Phase 1B — provider and operational decision

Status: DONE / MERGED / PROTECTED — PR #77.

`CLOUD_PROVIDER_DECISION_2026-08-17.md` selects Firebase Authentication + Cloud Firestore as the primary future provider candidate without connecting Firebase.

Critical provider rule: Firestore persistent offline cache remains disabled because its documented reconnect semantics can use last-write-wins. The project-owned revision/conflict model remains authoritative. Firebase transaction retries may never refresh a stale client intent to a newer base revision.

Supabase remains a fallback. Cloudflare Durable Objects remains a possible later session-coordinator fallback only if evidence proves a concrete limitation that justifies multi-provider complexity.

### Phase 1C — remote data inventory / privacy / retention

Status: CURRENT BOUNDED CANDIDATE.

`REMOTE_DATA_PRIVACY_RETENTION_POLICY.md` defines the candidate boundary:

- only explicitly connected rivalry data may become remote;
- unshared Saves and Candidate A/B/C recovery material remain local-only by default;
- Private Cloud Backup remains separate and future opt-in;
- remote identity preserves account/profile/save/season/device separation;
- tombstones retain deletion authority without deleted gameplay content;
- invite/replay/security metadata has bounded retention;
- account deletion revokes connected authority immediately and provider-specific cleanup remains a later proof gate;
- local-only fallback and recovery remain available;
- public/community/global ranking features remain eliminated.

No provider SDK/connection/runtime is authorized by Phase 1C.

### Phase 1D — exact remote schema and API/authorization contract

Status: NEXT AFTER PHASE 1C MERGES.

Translate provider-neutral concepts (`accountId`, `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, revisions, hashes, tombstones, idempotency and authorization scope) plus Phase 1C privacy/deletion rules into an exact Firebase-compatible schema, transaction/API contract, shared two-owner deletion rule and Security Rules authorization boundary.

Phase 1D remains architecture-only unless `NEXT_TASK.md` explicitly authorizes otherwise.

### Phase 1E — deterministic two-device/offline harness

Status: BLOCKED behind 1D.

Prove stale write rejection, replay, deletion/resurrection, interruption/retry, offline/reconnect, conflict output, local-state movement during apply, unsupported payloads, rollback/ownership failure and deterministic final state.

### Phase 1F — provider connection / emulator / Security Rules proof

Status: BLOCKED behind 1A–1E.

Only then may a bounded candidate connect a Firebase development/emulator path. Production remote mutation remains blocked until deny-by-default authorization, exact revision semantics, feature disable, local-only fallback and recovery escape hatches are proven.

## 8. Roadmap classification matrix

| Area | Current classification | Source-grounded interpretation |
| --- | --- | --- |
| Recovery & Device Resilience | DONE / PROTECTED BASELINE | v1.3 proof is closed; guarantees remain binding. |
| Installable Offline App | DONE / `1.4.0-r1` PRODUCTION | Current whole shell remains v1.4.0-r1. |
| Stable Local Identity | DONE | `profile_*`, `save_*`, `season_*` are protected. |
| Local Profiles | FOUNDATION + FIRST UX SLICE DONE | Visible profiles and explicit reuse are shipped. |
| Save Library | FOUNDATION + FIRST UX SLICE DONE | Multi-save authority and first UX slice are shipped. |
| Historical profile identity mapping | FOUNDATION DONE / UNRESOLVED RECORDS PERMITTED | No identity guessing from names. |
| Cross-Save manager/profile linkage semantics | DONE | Explicit stable-ID reuse only. |
| Backup/import envelope portability | DONE / PRODUCTION-PROVEN | formatVersion 2 shipped in PR #67. |
| Current production derived Analytics | IDENTITY-SAFE / PRODUCTION-PROVEN | Stable Local Profile identity is authoritative. |
| Identity-safe longitudinal Analytics / Analytics 2.0 | NARROW IDENTITY-SAFE LAYER DONE | Broader expansion is separate. |
| Showdown Home & Season Experience | FIRST SLICE DONE / PRODUCTION-PROVEN | PR #73 shipped. |
| Cloud Readiness | PHASE 1A DONE / 1B DONE / 1C CURRENT / 1D NEXT | Architecture prerequisite lane is active; cloud runtime remains blocked. |
| Cloud Backup | BLOCKED | Optional private product, not a substitute for session synchronization. |
| Private Identity / Account Layer | BLOCKED / PRIORITIZED PREREQUISITE | Waits for Cloud/Sync Readiness proof. |
| Paired-device capability | BLOCKED / PRIORITIZED PREREQUISITE | Waits for private auth and secure revocation. |
| Connected Rivalry | BLOCKED / PRIORITIZED PREREQUISITE | Waits for pairing and proven two-device sync. |
| Private Remote Joining | PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET AUTHORIZED | Final private session destination after all prerequisites. |
| Public/community/rankings | ELIMINATED | Must not return through connected work. |

## 9. Corrected dependency map

proven local recovery/data safety — DONE
→ Installable Offline App/device resilience — DONE
→ stable local identity/Save Library — DONE
→ explicit cross-Save/historical identity — DONE
→ Identity-Safe Career Analytics — DONE
→ multi-Save portability — DONE
→ Product Deepening first slices — DONE
→ Cloud/Sync Phase 1A deterministic model — DONE
→ Phase 1B provider decision — DONE
→ Phase 1C privacy/retention/data inventory — CURRENT CANDIDATE
→ Phase 1D exact remote schema/API/authorization contract — NEXT AFTER 1C
→ Phase 1E deterministic two-device/offline proof
→ Phase 1F provider connection/emulator/security proof
→ private account/auth/authorization
→ secure paired-device/private-session capability
→ Connected Rivalry synchronization
→ Private Remote Joining.

Optional Private Cloud Backup may later branch from the Cloud foundation but is not a substitute for synchronization/session infrastructure.

## 10. Current implementation authorization boundary

**Authorized product candidate: none.** No user-facing network runtime candidate is authorized yet.

`NEXT_TASK.md` authorizes only the current bounded architecture prerequisite. The owner's standing instruction allows progression from one proven prerequisite gate to the next without repeated permission loops, but never allows collapsing blocked gates or starting Remote Joining early.

Public community and global leaderboard/rankings remain permanently ELIMINATED unless the owner explicitly reverses that lock.

## 11. Cloud foundation and provider boundary

`CLOUD_STORAGE_FOUNDATION.md`, `CLOUD_SYNC_READINESS_PHASE_1.md`, `CLOUD_PROVIDER_DECISION_2026-08-17.md`, `REMOTE_DATA_PRIVACY_RETENTION_POLICY.md` and `REMOTE_JOINING_EXECUTION_ROADMAP.md` together define the future cloud safety boundary.

No future cloud module may call `localStorage` directly.

No Firebase SDK or remote collection should be added until Phase 1C–1E are complete and `NEXT_TASK.md` explicitly authorizes the provider-connection phase.

No privileged Firebase/Admin credential may enter the public client. Firebase Auth account identity must remain separate from Local Profile identity.

## 12. Versioning execution rule

`VERSIONING_POLICY.md` is permanent authority.

Runtime bug fixes and maintenance receive PATCH bumps. Meaningful new backward-compatible capabilities receive MINOR bumps. Transformative or compatibility-breaking boundaries may receive MAJOR bumps. Dormant docs/tests/architecture models do not consume visible application numbers until they affect shipped runtime behavior.

Dependency order, milestone name and release number remain separate decisions.
