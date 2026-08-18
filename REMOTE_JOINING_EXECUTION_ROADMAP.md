# Career Mode Showdown — Private Remote Joining Execution Roadmap

Status: owner-priority roadmap overlay
Effective: 2026-08-17 ET
Relationship to authority: `NEXT_TASK.md` owns the bounded implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns broader post-v1 status; this file owns the detailed Remote Joining prerequisite lane.

## Product destination

Career Mode Showdown remains a private two-manager companion.

Private Remote Joining is a prioritized long-term destination so the two managers can participate safely from different devices and locations.

Public community, public discovery, public matchmaking, public profiles and global leaderboard/rankings are eliminated.

## Delivery principle

Build Remote Joining as a dependency chain, not as one multiplayer feature.

Every stage must be bounded, validated, merged and proven before the next stage may depend on it. No provider convenience or visible-feature pressure may bypass recovery, identity, authorization, stale-write, conflict, offline/reconnect or two-device proof.

## Versioning principle

`VERSIONING_POLICY.md` is permanent release-numbering authority.

Shipped bug fixes and runtime maintenance receive PATCH bumps unless a larger version is justified. Meaningful backward-compatible capabilities receive MINOR bumps. Transformative or compatibility-breaking boundaries may receive MAJOR bumps. Dormant architecture/tests/docs that do not change shipped application behavior do not consume a visible application version.

## Stage 0 — Proven local foundation

Status: DONE / PROTECTED.

Completed foundation includes:

1. v1.3 recovery and device resilience;
2. Candidate A non-mutating export;
3. Candidate B read-only analysis;
4. Candidate C exact destructive Apply with strict snapshot/preconditions, transaction ownership, anti-clobber, rollback and exact verification;
5. Installable Offline App whole-shell recovery;
6. stable `profile_*`, `save_*`, `season_*` identities;
7. Save Library canonical persistence and runtime authority;
8. explicit cross-Save profile reuse and unresolved-history semantics;
9. Identity-Safe Career Analytics / Trophy Room;
10. formatVersion 2 complete multi-Save portability;
11. v1.4.0 Product Deepening first slices.

No connected feature may weaken these guarantees.

## Stage 1 — Cloud / Sync Readiness

Status: ACTIVE PRIORITY LANE / DEPENDENCY-GATED.

### Phase 1A — deterministic revision model

Status: DONE / MERGED / PROTECTED — PR #76, merge `b1fafd9cba7e2c647b88445026f6c2d1134378b1`.

Proven without backend or production networking:

- monotonic server-authoritative revision model;
- exact immutable `baseRevision` compare-and-swap;
- explicit stale-write conflicts;
- tombstones and anti-resurrection;
- explicit restore from tombstone;
- idempotency/replay protection;
- account/object scope separation;
- `deviceId` attribution without treating device identity as authentication;
- deterministic test coverage;
- no direct `localStorage` ownership.

The model remains dormant and is not loaded by production v1.4.0 / `1.4.0-r1`.

### Phase 1B — provider and operational decision

Status: DONE / MERGED / PROTECTED — PR #77, merge `2dc61e24ef07a0a150a228865f954ab3b3941398`.

Primary future provider candidate:

- Firebase Authentication;
- Cloud Firestore Standard edition;
- Firestore real-time listeners where appropriate;
- Firebase Local Emulator Suite before production provider connection.

Permanent guardrails:

- provider selection is not provider connection;
- Firestore persistent offline cache remains disabled because its documented reconnect semantics can use last-write-wins;
- project-owned revision/CAS/conflict semantics remain authoritative;
- Firebase transaction auto-retry may never refresh client intent to a newer base revision;
- privileged credentials never enter the GitHub Pages client;
- Cloud Functions/Blaze requires a later explicit operational gate if server-only operations prove necessary.

Supabase remains a fallback. Cloudflare Durable Objects remains a possible dedicated session-coordinator fallback if later evidence justifies a second provider.

Detailed authority: `CLOUD_PROVIDER_DECISION_2026-08-17.md`.

### Phase 1C — private remote data inventory, privacy and retention

Status: DONE / MERGED / PROTECTED — PR #78, merge `59957f8b0c29ce0cd480a0e9270a095160005599`.

Detailed authority: `REMOTE_DATA_PRIVACY_RETENTION_POLICY.md`.

Protected decisions:

1. remote-by-need only: no automatic upload of every local Save;
2. unshared Saves, Candidate A/B/C recovery material, local preferences and unrelated Legacy history remain local-only by default;
3. optional Private Cloud Backup remains a separate future opt-in product;
4. remote identity preserves `accountId` versus `profileId`/`saveId`/`seasonId` separation;
5. registered device metadata is minimized and device identity is never authentication;
6. invite/pairing secrets are short-lived and raw secrets are never logged;
7. tombstones retain deletion authority without deleted gameplay content and remain strong enough for long-offline anti-resurrection;
8. expired invite/replay metadata has bounded retention;
9. idempotency metadata defaults to 7-day retention;
10. app-controlled security/audit metadata defaults to 30-day retention;
11. account deletion immediately revokes normal connected authority and requires provider-specific cleanup proof before production;
12. local-only fallback and Candidate A/B/C recovery remain available during cloud disable/outage;
13. region-selection criteria are defined without prematurely selecting a region;
14. public discovery/matchmaking/profiles/community/global rankings remain eliminated.

No SDK, provider project, credential, remote collection or auth runtime was added by Phase 1C.

### Phase 1D — exact remote schema and API/authorization contract

Status: CURRENT BOUNDED CANDIDATE.

Detailed authority: `REMOTE_SCHEMA_API_AUTHORIZATION_CONTRACT.md` and dormant `js/cloudSyncRemoteContract.js`.

The Phase 1D contract fixes the exact provider-compatible architecture before Firebase is connected:

- `accountId`, `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and `inviteId` remain distinct;
- Firebase Auth context is the future `accountId` principal source; display labels never authorize;
- exact private Firestore-compatible document paths/fields exist for account metadata, profile links, registered devices, rivalry governance, authoritative shared state, one-use invites, private sessions, idempotency, tombstones and bounded security metadata;
- every first-seen mutation follows authenticate → authorize → read authority → compare immutable original `baseRevision` → explicit mismatch rejection → idempotency reservation → exactly one logical mutation → exactly next revision → tombstone update when applicable → deterministic result;
- an exact accepted idempotency replay is non-mutating and returns the recorded result; a reused key with a different fingerprint is rejected;
- Firestore transaction retry may reread provider state but may never refresh the client's original `baseRevision`;
- future Security Rules are deny-by-default and broad list/discovery access is denied;
- one account deleting itself, leaving, revoking the relationship, requesting deletion, becoming disabled or reconnecting from a stale device cannot silently transfer ownership, delete the other owner's retained data or resurrect a tombstone;
- shared gameplay deletion requires every currently entitled manager's explicit consent, except a sole remaining entitled owner after the other has explicitly relinquished entitlement or deleted its account;
- Firebase Auth owns credentials/tokens/provider account lifecycle while application collections hold only minimized app authorization metadata and explicitly connected private rivalry state;
- account deletion revokes authority before cleanup and preserves the other owner's entitlement;
- no public index, public lobby, public profile, discovery, matchmaking, community or ranking surface is created.

Phase 1D remains architecture/dormant-source/test only. It does not add Firebase runtime, production Firestore data, deployed Security Rules, account UI, pairing runtime, Connected Rivalry runtime, Remote Joining UI, Cloud Backup or persistent Firestore offline cache.

### Phase 1E — deterministic two-device and offline/reconnect harness

Status: NEXT AFTER PHASE 1D MERGES.

Must permanently test:

- two devices editing from one base;
- stale write rejection;
- exact accepted replay and reused-key mismatch;
- deletion and stale resurrection attempt;
- interrupted request/retry while preserving original `baseRevision`;
- corrupted/unsupported payload rejection;
- offline edit then reconnect;
- local state changing between remote preview and local apply;
- ownership/rollback failure;
- disabled remote service;
- explicit conflict presentation contract;
- deterministic final state.

Phase 1E remains provider-neutral. It must not connect Firebase.

### Phase 1F — provider connection and Security Rules/emulator proof

Status: BLOCKED behind Phase 1E.

Only after the architecture and deterministic two-device model are proven may a bounded candidate connect a Firebase development project/emulator path.

Before any production remote mutation:

- deny-by-default rules;
- exact object/account authorization;
- emulator tests for unauthorized reads/writes;
- exact one-use invite capability behavior;
- no privileged client secret;
- feature flag / disable switch;
- local-only fallback;
- export/recovery escape hatch;
- no Firestore persistent offline cache;
- exact revision/CAS/idempotency semantics proven against provider transaction behavior.

If emulator proof establishes that a required security invariant cannot be expressed safely with Firebase Auth, Firestore Security Rules and allowed client transactions, a trusted server boundary may be proposed at that time. Phase 1D does not authorize Cloud Functions, Blaze billing or server deployment.

## Stage 2 — Private Account / Authentication / Authorization

Status: BLOCKED until Cloud/Sync Readiness is proven.

Requirements:

1. private authenticated `accountId`;
2. provider-enforced authorization on every remote object operation;
3. account identity separate from Local Profile `profile_*` identity and display labels;
4. unresolved historical profiles never guessed by name;
5. secure token/session lifecycle;
6. no unsafe long-lived bearer-secret persistence;
7. abuse/rate controls where needed;
8. account export/deletion and recovery tests;
9. authentication failure and revocation proof.

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

## Stage 5 — Private Session Transport and Remote Joining

Status: FINAL DEPENDENCY-GATED PRODUCT DESTINATION.

Only after Stages 1–4 are production-proven may the Remote Joining experience itself be implemented.

Required experience:

1. one manager creates or opens a private rivalry session;
2. the second manager receives a private invite/join path;
3. both devices prove authorized session membership;
4. reconnect works after temporary network loss;
5. stale/conflicting actions are surfaced safely;
6. revoked/expired devices and sessions cannot continue;
7. session state is never publicly discoverable;
8. local recovery/export remains available;
9. remote failure cannot silently destroy proven local Save Library state.

## Stage 6 — Remote Joining hardening and stable release

Status: FUTURE.

Before stable promotion permanently test:

- repeated join/leave/reconnect cycles;
- concurrent two-device actions;
- revoked device during active session;
- invite replay;
- wrong-account object probing;
- network interruption at mutation boundaries;
- stale client after long offline period;
- remote deletion versus stale live state;
- rollback/ownership loss;
- provider outage;
- remote disable switch;
- Chromebook/mobile/PWA lifecycle;
- accessibility and responsive session UX.

The stable Remote Joining version number will be selected from actual shipped scope under `VERSIONING_POLICY.md`, not preassigned by roadmap position.

## Parallel-work rule

Once the connected-development lane is active, prefer the next safe prerequisite on this chain over unrelated optional expansion.

Do not rush a blocked prerequisite merely to show visible progress. Infrastructure must advance the product and remain narrowly tied to the Remote Joining dependency path.
