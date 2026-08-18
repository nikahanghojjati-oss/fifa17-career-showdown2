# Career Mode Showdown — Private Remote Joining Execution Roadmap

Status: owner-priority roadmap overlay
Effective: 2026-08-18 ET, synchronized through the Stage 2A PR #83 implementation gate
Relationship to authority: `NEXT_TASK.md` owns bounded implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns broader post-v1 status; this file owns the detailed Remote Joining prerequisite lane.

## Product destination

Career Mode Showdown remains a private two-manager companion.

Private Remote Joining is **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED** so the two managers can eventually participate safely from different devices and locations.

Public community, public discovery, public matchmaking, public profiles and global leaderboard/rankings are eliminated.

## Delivery principle

Build Remote Joining as a dependency chain, not as one multiplayer feature.

Every stage must be bounded, validated, merged and proven before the next stage may depend on it. No provider convenience or visible-feature pressure may bypass recovery, identity, authorization, stale-write, conflict, offline/reconnect, two-owner governance or two-device proof.

## Versioning principle

`VERSIONING_POLICY.md` is permanent release-numbering authority. Dormant architecture/tests/emulator proof do not consume a visible application version. A shipped runtime change receives the PATCH/MINOR/MAJOR bump justified by actual scope; `rN` never substitutes for a semantic version bump.

## Stage 0 — Proven local foundation

Status: DONE / PROTECTED.

Completed foundation includes v1.3 Recovery & Device Resilience Hardening, Candidate A/B/C, Installable Offline App recovery, stable `profile_*` / `save_*` / `season_*` identities, Save Library canonical authority, explicit cross-Save identity reuse, Identity-Safe Career Analytics/Trophy Room, formatVersion 2 multi-Save portability and v1.4.0 Product Deepening first slices.

No connected feature may weaken these guarantees.

## Stage 1 — Cloud / Sync Readiness

Status: DONE / MERGED / PROTECTED through Phase 1F.

### Phase 1A — deterministic revision model

Status: DONE / MERGED / PROTECTED — PR #76, merge `b1fafd9cba7e2c647b88445026f6c2d1134378b1`.

Proves monotonic revision authority, immutable `baseRevision` compare-and-swap, explicit stale conflicts, tombstones, anti-resurrection, explicit restore and replay/idempotency semantics without provider/runtime dependency.

### Phase 1B — provider and operational decision

Status: DONE / MERGED / PROTECTED — PR #77, merge `2dc61e24ef07a0a150a228865f954ab3b3941398`.

Firebase Authentication + Cloud Firestore is the selected primary future provider candidate. Firestore persistent offline cache remains disabled. Cloud Functions/Blaze remains a separate future gate if a trusted server operation is later proven necessary.

### Phase 1C — private remote data inventory, privacy and retention

Status: DONE / MERGED / PROTECTED — PR #78, merge `59957f8b0c29ce0cd480a0e9270a095160005599`.

Protects remote-by-need data minimization, private-by-default access, bounded invite/idempotency/security retention, tombstone anti-resurrection, account-deletion revocation, local-only fallback and permanent prohibition of public/community/ranking surfaces.

### Phase 1D — exact remote schema and API/authorization contract

Status: DONE / MERGED / PROTECTED — PR #79, merge `fc2e8e8b921a435103a438a9239efbb890584d22`, exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`.

Defines exact provider-compatible paths/fields, identity separation, mutation order, immutable original `baseRevision`, replay/idempotency, two-owner governance and deny-by-default authorization.

### Phase 1E — deterministic two-device and offline/reconnect harness

Status: DONE / MERGED / PROTECTED — PR #80, merge `cebd9c031657c9ee01ba68f1baaac7816c9748b9`, exact validated head `36db46b34a0675623dbdd1a4e2c76e93d438de45`.

Proves two-device stale conflicts, recursively frozen queued intent, provider-style retry without silent rebase, tombstone anti-resurrection, current account/device/rivalry reauthorization, two-owner mutation freeze and Candidate C-grade local Apply preconditions.

### Phase 1F — provider connection and Security Rules/emulator proof

Status: DONE / MERGED / PROTECTED — PR #81.

Exact validated head: `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`.
Squash merge / completion boundary: `231556d86a93535fa90e173577c1159de4f40be0`.

Phase 1F connects Firebase only inside fixed demo project `demo-career-mode-showdown-phase1f`, loads deny-by-default Firestore Security Rules and proves real Firestore transaction retry behavior. It keeps Firebase absent from the production GitHub Pages shell.

Permanent security result: every application-client Firestore write remains denied. The protected Phase 1D shared-state document does not carry the idempotency-key hash required for Security Rules to identify the matching sibling idempotency receipt, so direct client state writes cannot safely enforce the replay invariant. A trusted mutation gateway or separately reviewed protocol/schema adjustment remains a later production-write gate. Phase 1F does not authorize Cloud Functions, Firebase Admin production runtime, service-account credentials or Blaze billing.

Stage 1 is complete as a bounded readiness/proof layer. Production Firebase runtime and production remote writes are still not enabled.

### Historical Phase 1E / Phase 1F Stage 1 provenance

The following progression is retained only as historical provenance for permanent Cloud/Sync contracts. It is not current roadmap status:

Phase 1A — DONE / MERGED / PROTECTED.
Phase 1B — DONE / MERGED / PROTECTED.
Phase 1C — DONE / MERGED / PROTECTED.
Phase 1D — DONE / MERGED / PROTECTED.
Phase 1E — CURRENT BOUNDED CANDIDATE.
Phase 1F — NEXT AFTER PHASE 1E MERGES / BLOCKED.

Current Stage 1 authority is the completed Phase 1F status above.

## Stage 2 — Private Account / Authentication / Authorization

Status: ACTIVE PRIORITY LANE / DEPENDENCY-GATED.

Stage 2 requirements remain:

1. private authenticated `accountId`;
2. provider-enforced authorization on every remote object operation;
3. account identity separate from Local Profile `profile_*` identity and display labels;
4. unresolved historical profiles never guessed by name;
5. secure token/session lifecycle;
6. no unsafe long-lived bearer-secret persistence;
7. abuse/rate controls where needed;
8. account export/deletion and recovery tests;
9. authentication failure and revocation proof.

Stage 2 is intentionally split into bounded prerequisites rather than one broad account feature.

### Stage 2A — Firebase Auth Emulator Identity Boundary

Status: IMPLEMENTED BOUNDED CANDIDATE / PR #83 VALIDATION AND MERGE GATE.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

PR #83 adds only the Authentication Emulator to the existing fixed demo project and proves real Firebase Auth `uid` → architecture `accountId` semantics through cross-service Firestore Security Rules. The proof uses two distinct synthetic Web Auth users, explicit in-memory Auth persistence, wrong-account and unauthenticated denial, sign-out loss of authenticated access, fail-closed invalid sign-in, application-account lifecycle checks separate from provider sign-in, provider identity over client-supplied identity and continued denial of every application-client Firestore create/update/delete.

The corrected technical head `1420d8ffec9e689f1b3973021517713c446c85a0` passed the complete 37-file repository contract suite, preserved Phase 1F emulator proof and the real Stage 2A Auth/Firestore emulator proof under the same demo project. Production remains v1.4.0 / `1.4.0-r1`, Firebase remains absent from the production shell and the workflow topology remains 13 workflows / 27 executable blocks.

Stage 2A is complete only after the final unchanged PR #83 head is fully green, review/thread state is clean, expected-head squash merge succeeds and live `main` is independently verified.

Synthetic email/password users remain an emulator test mechanism only. Stage 2A does not select the eventual production sign-in UX.

Stage 2A does not authorize production Firebase, production account/signup/login UI, production Auth persistence, provider-level disable/revocation implementation, account export/deletion cascade, safe application account writes, rate controls, registered-device UI, pairing, Connected Rivalry or Remote Joining.

After Stage 2A merges, current source and a fresh continuity assessment must choose the next smallest remaining Stage 2 prerequisite. No later Stage 2 prerequisite is pre-authorized by this roadmap.

### Historical Stage 2A pre-implementation provenance

At the predecessor boundary Stage 2A status was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. That wording is retained only as historical provenance and is not current status.

## Stage 3 — Registered Devices and Private Pairing

Status: BLOCKED until Stage 2 is proven.

Requirements:

- revocable registered `deviceId`;
- device identity never substitutes for authentication;
- private expiring one-use invite/pairing capabilities;
- replay protection;
- exact intended account/session authorization;
- device revocation;
- pairing cancellation/recovery;
- unauthorized join denial;
- no public discovery or matchmaking.

## Stage 4 — Connected Rivalry Synchronization

Status: BLOCKED until Stage 3 is proven.

This is the first stage where actual two-manager rivalry state becomes a connected synchronization concern.

Requirements:

- private authorized rivalry access;
- revision-safe mutations;
- explicit conflicts, never silent last-write-wins;
- tombstone safety;
- reconnect recovery;
- deterministic offline behavior;
- two-device synchronization proof;
- validated local transaction boundary for downloaded state;
- export/rollback escape hatch;
- local-only mode remains functional.

The Phase 1F direct-client-write security finding must be resolved through a separately authorized production mutation boundary before Stage 4 remote mutation can be enabled.

## Stage 5 — Private Session Transport and Remote Joining

Status: FINAL DEPENDENCY-GATED PRODUCT DESTINATION.

Only after Stages 1 through 4 are production-proven may the Remote Joining experience itself be implemented.

Required experience remains private invite/join, exact session authorization, reconnect after temporary network loss, explicit stale/conflict handling, revoked/expired session denial, no public discoverability and preservation of local export/recovery.

## Stage 6 — Remote Joining hardening and stable release

Status: FUTURE.

Before stable promotion permanently test repeated join/leave/reconnect, concurrent two-device actions, revoked device during active session, invite replay, wrong-account probing, network interruption at mutation boundaries, long-offline stale clients, remote deletion versus stale live state, rollback ownership loss, provider outage, remote disable switch, Chromebook/mobile/PWA lifecycle, accessibility and responsive session UX.

The stable version number will be selected from actual shipped scope under `VERSIONING_POLICY.md`, not preassigned by roadmap position.

## Parallel-work rule

Once the connected-development lane is active, prefer the next safe prerequisite on this chain over unrelated optional expansion.

Do not rush a blocked prerequisite merely to show visible progress. Infrastructure must advance the product and remain narrowly tied to the Remote Joining dependency path.
