# Career Mode Showdown — Private Remote Joining Execution Roadmap

Status: owner-priority roadmap overlay
Effective: 2026-08-18 ET, synchronized through Stage 2C and PR #86 completion; remaining Stage 2 prerequisite not yet selected
Relationship to authority: `NEXT_TASK.md` owns bounded implementation authorization; `POST_V1_ROADMAP_EXECUTION.md` owns broader post-v1 status; this file owns the detailed Remote Joining prerequisite lane.

## Product destination

Career Mode Showdown remains a private two-manager companion.

Private Remote Joining is PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED so the two managers can eventually participate safely from different devices and locations.

Public community, public discovery, public matchmaking, public profiles and global leaderboard/rankings are eliminated.

## Delivery principle

Build Remote Joining as a dependency chain, not as one multiplayer feature.

Every stage must be bounded, validated, merged and proven before the next stage may depend on it. No provider convenience or visible-feature pressure may bypass recovery, identity, authorization, stale-write, conflict, offline/reconnect, two-owner governance or two-device proof.

## Versioning principle

`VERSIONING_POLICY.md` is permanent release-numbering authority. Dormant architecture/tests/emulator proof and policy-only prerequisite work do not consume a visible application version. A shipped runtime change receives the PATCH/MINOR/MAJOR bump justified by actual scope; `rN` never substitutes for a semantic version bump.

## Continuity principle

Every substantive owner-facing project response visibly reports `Handoff proximity: X%`. At 100%, the current environment automatically generates the complete successor handoff, finishes only the safe bounded checkpoint and stops before another substantial milestone. Unknown usage is never fabricated; stricter WEC decisions remain authoritative; generated successor handoffs preserve the rule recursively.

PR #86 `Protect Handoff Proximity governance and seal Stage 2C` is DONE / MERGED / PROTECTED from exact validated head `15cfa82d9aa74db1275968ed3bc1e42669ab23ec` to squash merge / independently verified live main `1794f1f86968781b898d000360d1fb56234fb92f`. All 13 normal workflow families passed on that exact unchanged head; submitted reviews and inline review threads were empty. PR #86 changed no production runtime and is not a Stage 2 engineering prerequisite.

## Stage 0 — Proven local foundation

Status: DONE / PROTECTED.

Completed foundation includes v1.3 Recovery & Device Resilience Hardening, Candidate A/B/C, Installable Offline App recovery, stable `profile_*` / `save_*` / `season_*` identities, Save Library canonical authority, explicit cross-Save identity reuse, Identity-Safe Career Analytics/Trophy Room, formatVersion 2 multi-Save portability and v1.4.0 Product Deepening first slices.

No connected feature may weaken these guarantees.

## Stage 1 — Cloud / Sync Readiness

Status: DONE / MERGED / PROTECTED through Phase 1F.

Phase 1A — DONE / MERGED / PROTECTED — PR #76, merge `b1fafd9cba7e2c647b88445026f6c2d1134378b1`.
Phase 1B — DONE / MERGED / PROTECTED — PR #77, merge `2dc61e24ef07a0a150a228865f954ab3b3941398`.
Phase 1C — DONE / MERGED / PROTECTED — PR #78, merge `59957f8b0c29ce0cd480a0e9270a095160005599`.
Phase 1D — DONE / MERGED / PROTECTED — PR #79, merge `fc2e8e8b921a435103a438a9239efbb890584d22`, exact validated head `2e3c9560590fb934e684fbae44138f16194da6bd`.
Phase 1E — DONE / MERGED / PROTECTED — PR #80, merge `cebd9c031657c9ee01ba68f1baaac7816c9748b9`, exact validated head `36db46b34a0675623dbdd1a4e2c76e93d438de45`.
Phase 1F — DONE / MERGED / PROTECTED — PR #81, merge `231556d86a93535fa90e173577c1159de4f40be0`, exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d`.

Firebase Authentication + Cloud Firestore remains the selected primary future provider candidate. Firestore persistent offline cache remains disabled.

Permanent security result: every application-client Firestore write remains denied. The protected Phase 1D shared-state document does not carry the idempotency-key hash required for Security Rules to identify the matching sibling idempotency receipt. A trusted mutation gateway or separately reviewed protocol/schema adjustment remains a later production-write gate. Phase 1F does not authorize Cloud Functions, Firebase Admin production runtime, service-account credentials or Blaze billing.

Production Firebase runtime and production remote writes are still not enabled.

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

Stage 2 requirements remain private authenticated `accountId`; provider-enforced authorization; account identity separate from Local Profile identity/display labels; no historical-name guessing; secure token/session lifecycle; no unsafe bearer-secret persistence; abuse/rate controls; account export/deletion and recovery tests; authentication failure/revocation proof; safe account metadata lifecycle; and a production mutation/authorization boundary that does not weaken Phase 1D/1F.

Stage 2 is intentionally split into bounded prerequisites rather than one broad account feature.

### Stage 2A — Firebase Auth Emulator Identity Boundary

Status: DONE / MERGED / PROVEN — PR #83.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2A.md`.

Exact validated head: `a4022d6f316622f73ead9aacde812b545b8dcf78`.
Squash merge: `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

Stage 2A proves real Firebase Auth `uid` → architecture `accountId`, explicit in-memory emulator Auth persistence, wrong-account/unauthenticated/sign-out/failure denial paths, application-account lifecycle separation, provider identity over client-supplied identity and continued denial of every application-client Firestore create/update/delete.

Synthetic email/password users remain an emulator test mechanism only. Stage 2A did not select production sign-in UX.

Do not repeat Stage 2A.

### Stage 2B — Provider Session Lifecycle & Revocation Boundary

Status: DONE / MERGED / PROVEN — PR #84.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md`.

Exact validated head: `d6786d9d3f65a329aaf3607c3eb3d3d357983c5f`.
Squash merge: `c4feadb69fb5e26eba19fa520afa0a09baf1de03`.

Stage 2B uses Firebase Admin only as emulator/CI test tooling and proves the same stable `uid` / architecture `accountId`, trusted provider disable, new-sign-in failure while disabled, re-enable with the same identity, independent application-account fail-closed authorization, and test-only `revokeRefreshTokens(uid)` routing without deliberate raw bearer-token retrieval or persistence.

The Authentication Emulator is not treated as proof of every production in-flight ID-token invalidation timing detail or backend `checkRevoked` behavior. Final production session verification/revocation remains a later Stage 2 provider-operation gate.

Production Firebase remains disconnected and every application-client Firestore write remains denied.

Do not repeat Stage 2B.

### Stage 2C — Production Authentication Policy & Static-Hosting Compatibility Boundary

Status: DONE / MERGED / PROVEN / POLICY-ONLY / PRODUCTION FIREBASE DISCONNECTED — PR #85.

Detailed authority: `PRIVATE_ACCOUNT_AUTH_STAGE_2C.md`.

Exact validated head: `48aa61a8d1b26f2c621cf7f0b410c68e0418257a`.
Squash merge / verified completion boundary: `22566e1409cf53d728b38d0b5a19de478ae6761b`.

Stage 2C permanently selects only the initial future production authentication behavior:

- Google federated sign-in through `GoogleAuthProvider` only;
- `signInWithPopup()` from an explicit user gesture on the current GitHub Pages host;
- `signInWithRedirect()` blocked until a separately reviewed auth-domain/hosting compatibility boundary exists;
- explicit `browserSessionPersistence`, not implicit durable local persistence;
- no extra Google OAuth scopes;
- no deliberate Google provider access-token retrieval or persistence;
- Firebase `uid` remains architecture `accountId`, never Local Profile/gameplay identity;
- application account status and rivalry entitlement remain separate authorization;
- every application-client Firestore write remains denied.

Stage 2C created no production Firebase project, real production users, account UI, production Firestore data, deployed Security Rules, Admin production runtime, Cloud Function, service credential or paid infrastructure.

Do not repeat Stage 2C.

### PR #86 governance synchronization — completed

Status: DONE / MERGED / PROTECTED / NON-RUNTIME — PR #86.

Exact validated head: `15cfa82d9aa74db1275968ed3bc1e42669ab23ec`.
Squash merge / independently verified live main: `1794f1f86968781b898d000360d1fb56234fb92f`.

PR #86 permanently protects Handoff Proximity governance and reconciles Stage 2C current authority. It does not add account/auth runtime, provider configuration or remote data behavior. Do not repeat PR #86.

### Remaining Stage 2 prerequisites

Status: NOT YET SELECTED OR IMPLEMENTATION-AUTHORIZED.

Remaining concerns include production Firebase operational/project setup, production web-app configuration, Google provider/authorized-domain setup, safe application-account bootstrap/write lifecycle, trusted production token verification and revoked-token behavior, account export/deletion cascade, authentication abuse/rate controls, production Security Rules deployment, provider outage/recovery behavior and the trusted production mutation-boundary decision.

Their order is not pre-authorized. The current bounded work is only the post-PR #86 current-authority reconciliation. After that reconciliation is exact-head validated, merged and independently verified, the fresh environment must reassess WEC, complete the mandatory current repository-source plus current primary provider/security-documentation study and select only the next smallest prerequisite that safely advances the Remote Joining chain. Selection must be recorded before implementation begins.

### Historical Stage 2A pre-implementation provenance

At the predecessor boundary Stage 2A status was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. That wording is retained only as historical provenance and is not current status.

## Stage 3 — Registered Devices and Private Pairing

Status: BLOCKED until Stage 2 is proven.

Requirements include revocable registered `deviceId`; device identity never substitutes for authentication; private expiring one-use invite/pairing capabilities; replay protection; exact intended account/session authorization; device revocation; pairing cancellation/recovery; unauthorized join denial; and no public discovery or matchmaking.

## Stage 4 — Connected Rivalry Synchronization

Status: BLOCKED until Stage 3 is proven.

This is the first stage where actual two-manager rivalry state becomes a connected synchronization concern.

Requirements include private authorized rivalry access, revision-safe mutations, explicit conflicts rather than silent last-write-wins, tombstone safety, reconnect recovery, deterministic offline behavior, two-device proof, Candidate C-grade local Apply, export/rollback escape hatch and local-only mode.

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