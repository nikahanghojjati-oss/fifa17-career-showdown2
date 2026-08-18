# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` owns bounded implementation authorization.

## Current production boundary

Application: v1.4.0 — Product Deepening
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

PR #81 completed Cloud/Sync Readiness Phase 1F from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` to squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

PR #82 synchronized the completed Phase 1F boundary and authorized Stage 2A from exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7` to squash merge `87ea27a8dd28a041f973a3ba42312ff9e78ba74d`.

PR #83 completed Private Account / Authentication Stage 2A from exact validated head `a4022d6f316622f73ead9aacde812b545b8dcf78` to squash merge / verified starting main `e39c1b0689598ac922569ff839ca30a1d5dee5fa`. All 13 normal pull-request workflow families were successful on that exact unchanged head before merge.

Production Firebase remains disconnected. No production Auth account, Firestore data, deployed production Security Rules, Cloud Function, Admin runtime, service-account credential or Blaze billing exists.

Every application-client Firestore write remains denied. The protected Phase 1D shared-state schema still does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. A trusted mutation gateway or separately reviewed schema/protocol change remains a later independent production-write gate.

Firestore persistent offline cache remains disabled. Project-owned immutable `baseRevision`, explicit stale conflict, replay/idempotency, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Current PR #84 Stage 2B checkpoint

PR #84: `Private Auth Stage 2B session lifecycle and revocation proof`.
Branch: `agent/private-auth-stage2b-session-revocation`.
Base: verified main `e39c1b0689598ac922569ff839ca30a1d5dee5fa`.

Fresh Work Environment Continuity environment: `we-2026-08-18-private-auth-stage2b-session-revocation`.

The successor independently verified live main and PR #83, reconciled the predecessor's successful merge into append-only history, then initialized a fresh status before assessment. The predecessor `HANDOFF_AT_CHECKPOINT` decision was not inherited. Fresh assessment decision was `CONTINUE`; usage percentage remains unavailable and was not estimated.

PR #84 implements only Private Account / Authentication Stage 2B — Provider Session Lifecycle & Revocation Boundary.

The implementation:

1. adds `PRIVATE_ACCOUNT_AUTH_STAGE_2B.md` as exact bounded authority;
2. keeps the existing fixed emulator project `demo-career-mode-showdown-phase1f`, Auth port `127.0.0.1:9099` and Firestore port `127.0.0.1:8080`;
3. adds Firebase Admin only to CI/test tooling with `--no-save --package-lock=false`, initialized only against the Auth Emulator and never with a service-account credential;
4. proves the test-only Admin boundary and real Web Auth observe the same stable Firebase `uid` / architecture `accountId`;
5. proves provider disable causes a new client sign-in to fail closed and provider re-enable restores sign-in for the exact same `uid`;
6. proves provider re-enable does not fabricate or transfer Local Profile, Save, device, rivalry or manager identity;
7. proves application account status remains a separate immediate authorization boundary, so a provider-enabled/authenticated account with application status `disabled` still cannot read private rivalry state;
8. proves a client cannot reactivate its own application account because every application-client Firestore create/update/delete remains denied;
9. exercises test-only `revokeRefreshTokens(uid)` without requesting, logging or persisting raw bearer tokens;
10. explicitly does not overclaim the emulator as proof of all production in-flight token invalidation timing or backend `checkRevoked` behavior;
11. retains explicit in-memory Web Auth test persistence only and leaves production Auth persistence unselected;
12. keeps Firebase/Admin absent from production `package.json`, `package-lock.json`, `index.html`, `js/optionalModules.js` and `service-worker.js`;
13. keeps production at v1.4.0 / `1.4.0-r1`.

## Validation evidence so far

Initial PR #84 technical head:

`1acabc790f647d0f6441591cdc1117a56f20f6a0`

GitHub started all 13 normal workflow families. The Static App and Stability workflows both stopped on the same new Stage 2B static contract before emulator startup. The source document correctly stated the app-account authorization boundary, but the matcher demanded a different exact phrase.

This was a test/source-coherence defect, not a runtime or Security Rules defect. The matcher was corrected to assert the actual source-grounded phrase `immediate fail-closed boundary for connected Firestore authorization`. No Security Rule, application behavior, Candidate C guarantee, timeout, workflow topology or performance ceiling was weakened.

Corrected matcher head:

`3f7713712c1ca9cffb2af05b5e9c0916b62cb0d4`

A fresh 13-family run started automatically from that head. Authority synchronization after the correction intentionally creates later heads, so no earlier run may become merge authority. The final status-seal head must receive a completely fresh exact-head gate.

## Stage 2B completion boundary

Stage 2B reaches DONE only when:

1. the Stage 2B static contract passes;
2. the real Auth/Firestore/Admin emulator proof passes under the fixed demo project;
3. provider disable/new-sign-in denial/re-enable stable-uid behavior is proven;
4. app-account status independently denies private rivalry access and trusted test-only reactivation restores only the same existing entitlement;
5. refresh-token revocation routes only through the test-only Admin/Auth Emulator boundary with no raw client token retrieval or persistence;
6. every application-client Firestore write remains denied;
7. Firebase/Admin remains absent from production runtime/dependencies and production remains v1.4.0 / `1.4.0-r1`;
8. the exact final PR #84 head is unchanged and all 13 normal workflow families are successful;
9. submitted review state is clean;
10. inline review-thread state is clean;
11. PR #84 is mergeable;
12. expected-head squash merge succeeds under the standing owner rule;
13. live `main` is independently verified after merge.

Merging PR #84 completes only Stage 2B. It does not authorize production account UI, production Firebase, later Stage 2 implementation, registered devices/pairing, Connected Rivalry or Remote Joining.

## Permanent product and recovery locks

Private Remote Joining remains PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A DONE / Stage 2B PR #84 completion gate
→ paired-device / private-session capability — blocked Stage 3
→ Connected Rivalry — blocked Stage 4
→ Private Remote Joining — final destination.

Public discovery, public profiles, public matchmaking, community systems and global leaderboard/rankings remain eliminated.

Exactly two managers remain authoritative. Same selected league, different permanent clubs. Showdown lengths `1 / 3 / 5 / 10`. Maximum Season score `11`. Equal non-zero score is a Draw; only 0–0 uses league position then league points.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive import Apply authority with strict exact raw snapshot/preconditions, transaction-owned mutation, ownership-scoped reverse rollback, anti-clobber checks, exact verification and critical recovery.

Canonical storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

No Auth/cloud/sync module may directly own canonical `localStorage`.

## Historical predecessor / Analytics evidence retained for provenance

The immediate predecessor environment was `we-2026-08-18-private-auth-stage2a-proof`. Its final decision was `HANDOFF_AT_CHECKPOINT`; that decision belonged only to that predecessor and correctly stopped after the PR #83 publication boundary.

PR #83 validation historically rejected seal heads `89264d7a7e08b81e5b3da82b532067e1702edb67` and `5cb7501d301c0e52aa8751c94e6abc081e78ed32` for documentation/contract-coherence defects. Neither is a validated merge head. Final exact PR #83 validated head was `a4022d6f316622f73ead9aacde812b545b8dcf78`.

The earlier Stage 2A boundary environment was `we-2026-08-18-private-auth-stage2a-boundary`. Its rejected seal heads `30c96dd23238d11984e1af04ce18ff82d0ea1bd2` and `1afc134ebe831270336f2be7387c651b05dab919` remain historical only. Final exact PR #82 validated head was `8f1fb4d4c9324947815936b21c6bc29a657a94b7`.

A direct profile-ID key swap is not sufficiently correct because longitudinal Analytics also needed to exclude unresolved historical manager roles while retaining identity-independent Showdown and Season totals.

Failure 7 in historical PR #59 validation was a transient/offscreen rendered-text assertion issue rather than a product data-corruption finding. The offscreen Trophy cabinet rendered-text assertion evidence remains preserved so future developers do not erase the source-grounded classification that shaped the shipped Identity-Safe Career Analytics implementation.

Historical Stage 2A status before PR #83 began was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. It is historical provenance only.

## Tooling boundary

Direct shell DNS to GitHub is unavailable in this environment. Connector-backed GitHub source/write access and GitHub-hosted CI are therefore the verified source/proof path. The repository-owned GitHub CLI bootstrap remains protected for environments where routing permits it. Never copy connector credentials into local configuration.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Finish only the Stage 2B / PR #84 publication boundary: complete authority/continuity synchronization, require all 13 normal workflow families to pass on the exact final unchanged head, verify clean submitted reviews and inline threads, verify unchanged mergeable head, squash merge with expected-head protection, then independently verify live `main`.

After verified PR #84 merge, reassess Work Environment Continuity before selecting another distinct Stage 2 prerequisite. Do not begin Stage 3 pairing, Connected Rivalry or Remote Joining automatically.

Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F, PR #82 or Stage 2A / PR #83. Do not rush Private Remote Joining.
