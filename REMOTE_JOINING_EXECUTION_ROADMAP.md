# Career Mode Showdown — Private Remote Joining Execution Roadmap

Status: owner-priority roadmap overlay
Effective: 2026-08-17 ET
Relationship to authority: this roadmap expands the Remote Joining prerequisite lane. `NEXT_TASK.md` remains the bounded implementation authority and `POST_V1_ROADMAP_EXECUTION.md` remains the broader post-v1 dependency/status authority.

## Product destination

Career Mode Showdown remains a private two-manager companion.

Private Remote Joining is a prioritized long-term product destination so the two managers can safely participate from different devices and locations.

Public community, public discovery, public matchmaking, public profiles and global leaderboard/rankings are eliminated.

## Delivery rule

Remote Joining must be built as a dependency chain, not as one large multiplayer feature.

Every stage must be implemented, validated, merged and production-proven before the next stage is allowed to depend on it. No provider convenience, UI pressure or schedule pressure may bypass recovery, authorization, stale-write, conflict, offline or two-device proof.

## Versioning rule

`VERSIONING_POLICY.md` is the permanent release-numbering authority.

Shipped runtime bug fixes and maintenance receive PATCH bumps unless a larger version is justified. Meaningful new backward-compatible product capabilities receive MINOR bumps. Transformative or compatibility-breaking product boundaries may receive MAJOR bumps. Dormant non-runtime prerequisite models, docs and tests do not consume a visible application version until they change shipped application behavior.

## Stage 0 — Proven local foundation

Status: DONE / PROTECTED.

Required foundation already shipped:

1. recovery and device resilience;
2. Candidate A non-mutating export;
3. Candidate B read-only analysis;
4. Candidate C destructive Apply with exact raw preconditions, transaction ownership, anti-clobber, rollback and exact verification;
5. Installable Offline App whole-shell recovery;
6. stable `profile_*`, `save_*`, `season_*` identities;
7. Save Library canonical persistence and runtime authority;
8. explicit cross-Save Local Profile reuse and unresolved-history semantics;
9. Identity-Safe Career Analytics / Trophy Room;
10. formatVersion 2 complete multi-Save portability;
11. v1.4.0 Product Deepening first slices.

No later connected feature may weaken these guarantees.

## Stage 1 — Cloud / Sync Readiness

Status: ACTIVE PRIORITY LANE, dependency-gated.

### Phase 1A — deterministic revision model

Status: current bounded implementation.

Deliverables:

- monotonic server-authoritative revision model;
- exact `baseRevision` compare-and-swap;
- explicit stale-write conflict record;
- tombstones and anti-resurrection behavior;
- explicit restore from tombstone;
- idempotency/replay protection;
- account/object scope separation;
- device attribution as metadata only;
- deterministic tests with no backend and no production network path.

No production runtime loading is allowed in this phase.

### Phase 1B — provider and operational decision

Status: NEXT CLOUD READINESS GATE after Phase 1A proof, not automatically authorized.

Required decision record:

- candidate providers and why each is suitable or unsuitable;
- free/low-cost operating envelope;
- expected storage, database, auth and egress costs;
- static GitHub Pages integration constraints;
- secret-management model;
- availability and regional considerations;
- backup/restore and export options;
- account deletion and retention capabilities;
- operational ownership and rollback/disable plan.

Do not select Firebase, Supabase or any provider merely because setup is easy.

### Phase 1C — privacy, retention and remote data inventory

Status: dependency after provider/operational boundary.

Define exactly what is remote, why it is needed, how long it is retained, how it is exported/deleted, and what remains local-only.

Local-only use remains available unless a later explicit owner decision changes that rule.

### Phase 1D — remote schema and API contract

Status: dependency after Phase 1A through 1C.

Required concepts include:

- `accountId`;
- `profileId`;
- `saveId`;
- `deviceId`;
- `installationId`;
- `objectType` / `objectId`;
- `revision` / `baseRevision` / `parentRevision`;
- `contentHash`;
- tombstone metadata;
- idempotency key;
- conflict record;
- authorization scope.

Timestamps are informational only and never conflict authority.

### Phase 1E — deterministic two-device sync harness

Status: final Cloud/Sync Readiness proof before production-capable sync.

Must permanently test:

- two devices editing from one base;
- stale write rejection;
- duplicate/replayed mutation;
- deletion and stale resurrection attempt;
- interrupted request/retry;
- corrupted payload rejection;
- offline edit then reconnect;
- local state changing between remote preview and local apply;
- rollback/ownership failure;
- unsupported schema;
- remote disable/rollback behavior.

## Stage 2 — Private Account / Authentication / Authorization

Status: BLOCKED until Stage 1 is proven.

Requirements:

1. private authenticated principal `accountId`;
2. server-side authorization on every object read/write/delete;
3. Local Profile display labels remain separate from account identity;
4. unresolved historical Local Profiles are never guessed by name;
5. secure session/token lifecycle;
6. no long-lived bearer secrets in `localStorage` when a safer browser mechanism exists;
7. CSRF/XSS/session-replay boundaries as applicable;
8. rate limiting and abuse controls;
9. account export/deletion and retention policy;
10. authentication failure and recovery tests.

## Stage 3 — Registered Devices and Private Pairing

Status: BLOCKED until Stage 2 is proven.

Requirements:

- revocable registered `deviceId`;
- device ID is not authentication;
- secure invite/pairing token with expiration and replay protection;
- invite authorization for exactly the intended private account/session relationship;
- device revocation;
- rate/abuse protection;
- unauthorized join denial;
- pairing recovery and cancellation;
- no public discovery or matchmaking.

## Stage 4 — Connected Rivalry Synchronization

Status: BLOCKED until Stage 3 is proven.

This is the first stage where the actual two-manager rivalry state becomes a connected synchronization concern.

Requirements:

- private authorized rivalry object access;
- revision-safe mutations;
- explicit conflicts rather than silent last-write-wins;
- tombstone safety;
- reconnect recovery;
- deterministic offline behavior;
- two-device synchronization proof;
- local transaction boundary preserved when applying downloaded state;
- export/rollback escape hatch;
- one-device/local-first mode remains functional.

## Stage 5 — Private Session Transport and Remote Joining

Status: FINAL DEPENDENCY-GATED DESTINATION.

Only after Stages 1 through 4 are production-proven may Remote Joining itself be implemented.

Required experience:

1. one manager creates or opens a private rivalry session;
2. the second manager receives a private invite/join mechanism;
3. both devices prove authorized session membership;
4. session reconnect works after temporary network loss;
5. stale or conflicting actions are surfaced safely;
6. revoked or expired devices/sessions cannot continue;
7. session state never becomes publicly discoverable;
8. local recovery/export remains available;
9. remote failure cannot silently destroy the proven local Save Library state.

## Stage 6 — Remote Joining hardening and stable release

Status: FUTURE.

Before stable promotion, permanently test:

- repeated join/leave/reconnect cycles;
- two-device concurrent actions;
- revoked device during active session;
- invite replay;
- wrong-account object probing;
- network interruption at every mutation phase;
- stale client after long offline period;
- remote deletion versus stale live state;
- rollback failure and ownership loss;
- service/provider outage;
- production disable switch;
- Chromebook/mobile/PWA lifecycle behavior;
- accessibility and responsive session UX.

The final stable Remote Joining version number is chosen from actual shipped scope under `VERSIONING_POLICY.md`; it is not preassigned by roadmap position.

## Parallel work rule

Unrelated optional expansion may continue only when it does not delay or destabilize the owner-prioritized prerequisite chain.

Once the connected-development lane is active, prefer the next safe Remote Joining prerequisite over optional achievements, cosmetic content packs or other unrelated expansion.

Never rush a blocked prerequisite merely to show visible progress.
