# Career Mode Showdown — Current Handoff

Last updated: 2026-08-18 ET
Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

This is the concise rolling handoff and evidence trail. Current verified source and later owner instructions override every historical statement. `PROJECT_STATE.md` owns deployed product state and `NEXT_TASK.md` owns bounded implementation authorization.

## Current production boundary

Application: **v1.4.0 — Product Deepening**
Package: `1.4.0`
Installable Offline App runtime: `1.4.0-r1`
Immediate previous known-good whole shell: `1.3.0-r2`

PR #81 completed Cloud/Sync Readiness Phase 1F from exact validated head `0bdbe2e8c0dc36901361a8aa15056c6af3f5e70d` to squash merge `231556d86a93535fa90e173577c1159de4f40be0`.

PR #82 synchronized the completed Phase 1F boundary and authorized Stage 2A from exact validated head `8f1fb4d4c9324947815936b21c6bc29a657a94b7` to verified squash merge / starting main `87ea27a8dd28a041f973a3ba42312ff9e78ba74d`.

Production Firebase remains disconnected. No production Auth account, Firestore data, deployed production Security Rules, Cloud Function, Admin runtime, service-account credential or Blaze billing exists.

Every application-client Firestore write remains denied. The protected Phase 1D shared-state schema still does not expose the idempotency-key hash required for Security Rules to identify the matching sibling replay receipt. A trusted mutation gateway or separately reviewed schema/protocol change remains a later independent production-write gate.

Firestore persistent offline cache remains disabled. Project-owned immutable `baseRevision`, explicit stale conflict, replay/idempotency, tombstone, reconnect and Candidate C local Apply semantics remain authoritative.

## Current PR #83 Stage 2A checkpoint

PR #83: `Private Auth Stage 2A real emulator identity proof`.
Branch: `agent/private-auth-stage2a-emulator-proof`.
Base: verified main `87ea27a8dd28a041f973a3ba42312ff9e78ba74d`.

Fresh Work Environment Continuity environment: `we-2026-08-18-private-auth-stage2a-proof`.

The successor independently verified live main and PR #82 before initializing its own environment. The predecessor `HANDOFF_AT_CHECKPOINT` decision was not inherited. Fresh assessment decision was `CONTINUE`; usage percentage remains unavailable and was not estimated.

PR #83 implements only **Private Account / Authentication Stage 2A — Firebase Auth Emulator Identity Boundary**.

The implementation:

1. adds Firebase Authentication Emulator `127.0.0.1:9099` beside Firestore Emulator `127.0.0.1:8080` under fixed project `demo-career-mode-showdown-phase1f`;
2. uses real Firebase Web Auth synthetic users with explicit in-memory Auth persistence;
3. proves distinct stable Firebase `uid` principals and `uid` as architecture `accountId` while keeping `profileId`, `saveId`, `seasonId`, `deviceId`, `installationId`, `rivalryId`, `sessionId` and display labels distinct;
4. proves self/private reads, wrong-account denial, unauthenticated denial, sign-out denial, failed-sign-in fail-closed behavior, app-account lifecycle separation and provider identity over client-supplied identity through the existing Firestore Security Rules;
5. preserves denial of every application-client Firestore create, update and delete;
6. keeps credentials confined to the isolated emulator process, never requests raw ID/refresh tokens and uses no canonical browser persistence;
7. keeps Firebase absent from production `package.json`, `package-lock.json`, `index.html`, `js/optionalModules.js` and `service-worker.js`;
8. keeps production at v1.4.0 / `1.4.0-r1`.

The Static App workflow now runs Phase 1F and Stage 2A in one Auth + Firestore emulator process while retaining the protected 13-workflow / 27-executable-block topology.

## Validation evidence so far

The first PR #83 technical head reached the new Stage 2A static contract but failed before emulator startup because that new contract expected a literal `status: "disabled"`. The real test correctly expressed the transition as `accountEnvelope(accountIdB, "disabled")`. The contract matcher was corrected at source. No runtime behavior, rule, timeout, Candidate C guarantee or performance ceiling was weakened.

Corrected technical head:

`1420d8ffec9e689f1b3973021517713c446c85a0`

On that head:

- the dynamic static release contract passed at v1.4.0 / `1.4.0-r1`;
- all 37 repository contract files passed;
- Firebase CLI started Auth and Firestore under the fixed demo project;
- the protected Phase 1F emulator proof passed;
- the real Stage 2A Auth/Firestore identity proof passed;
- expected client Firestore create/update/delete attempts were denied by Security Rules;
- permanent workflow topology remained 13 workflows / 27 executable blocks.

Two later authority-seal candidates were deliberately rejected by the Static App contract suite and must never be treated as validated merge heads:

- `89264d7a7e08b81e5b3da82b532067e1702edb67` omitted historical Phase 1E / Phase 1F `NEXT_TASK.md` provenance still protected by permanent Cloud foundation contracts.
- `5cb7501d301c0e52aa8751c94e6abc081e78ed32` restored that provenance but exposed an exact Stage 2A naming mismatch in `PROJECT_STATE.md` required by the protected Stage 2A boundary contract.

Both defects were documentation/contract-coherence failures. They were corrected at source without weakening runtime behavior, Security Rules, Candidate C, workflow topology, timeouts or performance ceilings.

Authority-coherent diagnostic head:

`063e90adbae3ae9c3f04f9206f36860294338183`

On that head the complete Static App gate passed again: JavaScript syntax, dynamic v1.4.0 / `1.4.0-r1` release identity, all repository contracts, Phase 1F emulator proof, real Stage 2A Auth/Firestore proof and the permanent 27-block workflow topology. This diagnostic head is still not the final merge head because the Work Environment Continuity status must be resealed after recording the corrected publication evidence.

The final exact PR #83 status-seal head must therefore rerun all 13 normal workflow families from scratch. No earlier green head may substitute for that exact-final-head gate.

## Stage 2A completion boundary

Stage 2A reaches DONE only when:

1. the exact final PR #83 head is unchanged and all 13 normal workflow families are successful;
2. submitted review state is clean;
3. inline review-thread state is clean;
4. PR #83 is mergeable;
5. expected-head squash merge succeeds under the standing owner rule;
6. live `main` is independently verified after merge.

Merging PR #83 completes only Stage 2A. It does not authorize production account UI, production Firebase, later Stage 2 implementation, registered devices/pairing, Connected Rivalry or Remote Joining.

## Permanent product and recovery locks

Private Remote Joining remains **PRIORITIZED LONG-TERM / DEPENDENCY-GATED / NOT YET IMPLEMENTATION-AUTHORIZED**.

Ordered path:

Cloud / synchronization readiness — DONE through Phase 1F
→ private account / authentication / authorization — CURRENT Stage 2 lane / Stage 2A PR #83 completion gate
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

The predecessor environment was `we-2026-08-18-private-auth-stage2a-boundary`. Its final decision was `HANDOFF_AT_CHECKPOINT`; that decision belonged only to that predecessor and correctly stopped before the distinct Stage 2A implementation milestone.

The predecessor PR #82 validation rejected two seal heads, `30c96dd23238d11984e1af04ce18ff82d0ea1bd2` and `1afc134ebe831270336f2be7387c651b05dab919`, for authority-coherence omissions. Neither is validated. Final exact PR #82 validated head was `8f1fb4d4c9324947815936b21c6bc29a657a94b7`.

A direct profile-ID key swap is not sufficiently correct because longitudinal Analytics also needed to exclude unresolved historical manager roles while retaining identity-independent Showdown and Season totals.

Failure 7 in historical PR #59 validation was a transient/offscreen rendered-text assertion issue rather than a product data-corruption finding. The offscreen Trophy cabinet rendered-text assertion evidence remains preserved so future developers do not erase the source-grounded classification that shaped the shipped Identity-Safe Career Analytics implementation.

Historical Stage 2A status before PR #83 began was `AUTHORIZED NEXT PREREQUISITE / IMPLEMENTATION NOT STARTED`. It is historical provenance only.

## Tooling boundary

Direct shell DNS to GitHub is unavailable in this environment and `gh` was not preinstalled. Connector-backed GitHub source/write access and GitHub-hosted CI are therefore the verified source/proof path. The repository-owned GitHub CLI bootstrap remains protected for environments where routing permits it. Never copy connector credentials into local configuration.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

If PR #83 is not yet merged, finish only the Stage 2A publication boundary: reseal continuity as the final branch mutation, require exact-final-head CI across all normal workflow families, verify clean submitted reviews and inline threads, verify unchanged mergeable head, squash merge with expected-head protection, then independently verify live `main`.

If PR #83 is already merged, do not reimplement Stage 2A. Validate/archive the completed PR #83 facts, initialize/reassess a fresh Work Environment Continuity environment and select the next smallest remaining Stage 2 prerequisite from current source. No later Stage 2 prerequisite is pre-authorized by this handoff. Stage 3 pairing, Connected Rivalry and Remote Joining remain blocked.

Do not ask the owner to reconstruct prior chats. Do not repeat Phase 1F or PR #82. Do not rush Private Remote Joining.
