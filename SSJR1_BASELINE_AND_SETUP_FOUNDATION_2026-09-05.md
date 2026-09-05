# SSJR-1 baseline and authoritative setup foundation

Status: candidate protocol; production Shared Setup is not enabled.

Owner direction on 2026-09-05: build toward genuine SSJR100, report SSJR constantly, and explain how each meaningful action contributes. Billing must never be activated. Firebase remains Spark. The later owner instruction and verified PR #198 closure activate this successor task; predecessor transition decisions belong to the predecessor.

## Verified starting boundary

Live main `39ffe88d61dcda973df03a18e0266fcfe4cf5638`, tree `5e6b8defdb526337ed47d4742b0540cd321bdf3f`, is PR #198's expected-head squash merge. Its reviewed head was `165b21a1e9a269fae87efa06ebd1df89cfc48e04`. Independently fetched GitHub evidence confirms 15/15 exact-head PR workflows, 15/15 main-push workflows, no submitted reviews or inline review threads, Stability `33990982219`, Burn-In `33990982204`, and closure comment `5554721311`. Open PRs at entry are older unrelated handoffs/features; none implements SSJR.

The production verifier independently matched all 100 existing public runtime files byte for byte at `v1.9.1 / 1.9.1-r2`; whole-shell recovery remains `1.9.1-r1`. Firebase provider records cite the protected zero-billing Rules deployment and current Spark constraints. This environment has not independently queried the live billing control plane or changed any provider setting. The attached PR115 handoff is historical context and does not supersede current standard Google Auth / Spark authority.

RJR-1 is complete/frozen at 100/100. Its physical Chromebook/Home WiFi plus iPhone/cellular acceptance is consumed. It is not repeated or credited as new SSJR progress.

## Fixed model and explicit initial backcast

`SHARED_SHOWDOWN_JOURNEY_MODEL.json` fixes SSJR-1.1 at 100 points across 20 whole capabilities. `SHARED_SHOWDOWN_JOURNEY_READINESS.json` owns the evidence ledger. `npm run ssjr:assess` calculates the score from events and checks the frozen model fingerprint.

| Domain | Fixed points | Initial credit | Why this weight exists |
| --- | ---: | ---: | --- |
| Shared identity and journey entry | 10 | 0 | Bind the journey before either device independently draws setup. |
| Authoritative shared setup | 25 | 0 | Every season depends on the same league, two permanent clubs, length and confirmations. |
| Season lifecycle and results | 20 | 0 | Both managers need isolated transfer/result ownership and one accepted season. |
| Scoring, history and progression | 20 | 0 | Correct competition must converge throughout 1/3/5/10 seasons. |
| Recovery and conflict safety | 15 | 0 | Shared setup/results introduce state and ownership that RJR transport proof did not exercise. |
| Final reconciliation and closure | 5 | 0 | Complete the actual Showdown and reject later resurrection. |
| Physical journey and stable release | 5 | 0 | Validate the integrated outcome on real devices and independent networks. |
| Total | 100 | 0 | Fixed denominator, independent of implementation effort. |

The initial backcast is deliberately `SSJR-1 0/100`, not a claim that the website has no working features. None of the fixed new shared-journey capabilities is yet production-proven. RJR100, local gameplay, and manual full-save projection are valuable prerequisites but do not satisfy the new entry/setup/season transition and ownership criteria. Model creation, protocol code, tests, PRs, CI, reviews, merges, deployments alone, docs, WEC, SLE and SNS earn zero readiness points.

Each capability specifies the outcome, exact acceptance criteria, required evidence layers, and dependencies. Credit requires deterministic behavior, provider enforcement and production two-account proof. The last physical capability additionally requires genuine two-device/two-network evidence. No partial point allocation or retroactive moving baseline is permitted. A reproduced regression invalidates its credited capability and all credited dependents through append-only events. Old evidence cannot be recycled to claim a repair. A changed denominator requires a different model version and separately comparable backcast.

## Source-first journey study

| Journey area | Existing source and evidence | SSJR finding |
| --- | --- | --- |
| Profiles and Save identity | `saveLibraryFoundation.js`, `saveLibraryRuntime.js`, manager identity browser audit | Profile/Save binding exists; shared entry still needs to precede local randomization. |
| Private pairing | `sparkPrivatePairing.js`, production Stage 3 and r5 convergence proof | Exactly two account-bound roles already exist; consumed RJR prerequisite. |
| Exact Connected Rivalry | `sparkConnectedRivalry.js` attachment and pointer precedence | Reuse exact role/profile/Save authority, never infer identity from display name. |
| Host/Join/ACTIVE | `sparkRemoteJoining.js`, `sparkPrivateSession.js`, standard-auth adapter, final RJR proof | Connection is complete; current session UI deliberately does not mutate gameplay. |
| League Wheel | `leagueWheel.js`, `dataEngine.js`, `data/leagues.js` | Current draw calls local randomness and saves to current local Showdown. |
| Club assignment | `clubAssignment.js`, `data/clubs.js`, `showdown.js` integrity | Existing same-league/distinct-club rules are reusable, but draw authority is local. |
| Season length and creation | `showdown.js` `createShowdown` | 1/3/5/10 lengths exist; current form creates a local Save before opening the wheel. |
| Confirmation | `clubAssignment.js` `continueToShowdownHome` | One browser can mark local setup Ready; no two-account setup confirmation. |
| Transfer Challenge | `transferChallenge.js` window, guesses, signings and phase locks | Shared phase/result ownership and timer reconciliation are unproven. |
| Results and review | `seasonEngine.js` reviewed fingerprint and `persistCompletedSeason` | Local deliberate review is protected; two-account result publication needs new authority. |
| Canonical scoring | `scoring.js` | CL 5, league title 3, main cup 1; each paired bonus capped at 1. Current tiebreak applies only when both scoring totals are zero, then league position and league points. Preserve this verified source behavior. |
| History and records | `seasonEngine.js`, `analytics.js`, `statistics.js`, `trophyRoom.js` | Local identity-safe projections exist; full shared-season convergence is unproven. |
| Multi-season progression | `seasonEngine.js`, `showdown.js`, complete local journey tests | Local length/progression exists; no complete remote 1/3/5/10 journey evidence. |
| Candidate B/C reconciliation | `sparkConnectedRivalry.js`, `importAnalysis.js`, `restore.js` and Stage 4 proof | Keep preview read-only and exact confirmed backup-first Candidate C Apply as sole destructive authority. |
| Revision, CAS and replay | `cloudSyncRevisionModel.js`, Connected Rivalry transaction and receipt implementation | Reuse the safety principles; whole-save CAS is not per-phase or per-manager journey authorization. |
| Terminal completion | Local Completed state and terminal remote sessions | Closing a session is not completion of a shared multi-season Showdown. |
| Offline/reconnect | RJR Stage 5G/5H/5I, offline lifecycle and Candidate C audits | Existing transport proof does not credit new setup/result recovery. |

## First implementation and its contribution

`js/sharedShowdownSetup.js` is a provider-neutral executable setup protocol. It is not loaded by the production shell, optional loader or Service Worker and does not create a new runtime release. It performs no network or canonical-storage operations. Its result may be used by a future transaction adapter only after that adapter derives live authority from provider-verified identity and exact documents inside the write transaction. Supplying a JavaScript authority object does not authenticate anyone.

The candidate covers:

1. Require two distinct active account-bound roles, exact profile/Save binding, active registered-device metadata, exact rivalry and an unexpired ACTIVE session before every mutation, including replay.
2. Let the opening session host become the fixed setup coordinator. A later session host change cannot transfer draw authority.
3. Commit one league, two distinct clubs from that league, and one allowed season length in order.
4. Require each manager to confirm the same setup-content hash. One manager cannot confirm twice or impersonate the other role.
5. Preserve the original operation ID, payload and base revision across retries. Exact accepted-result replay does not advance revision; altered replay and stale competing requests fail closed.
6. Keep at most six receipts because there are exactly six accepted setup mutations. The state contains hashed binding/receipt identities and no raw account/device/rivalry/session capability or profile/Save identifiers.
7. Capture and freeze caller inputs before asynchronous hashing; reject corrupt state and unknown fields; return error codes without echoing sensitive authority.
8. Generate a draw once outside any transaction callback, using bounded secure random selection. Retry sends the same prepared draw. Club selection samples without replacement.

This removes uncertainty from the setup transition contract and gives the next adapter concrete expected outcomes and negative cases. It does not earn the 25 setup points yet: provider enforcement, UI integration and production convergence remain required.

## Material design boundaries

Current private sessions default to 15 minutes and allow at most 30 minutes. A multi-season journey cannot require the original session to remain alive for days. The setup is bound to the stable exact rivalry and manager bindings; each operation requires a current active session, but a fresh active session for the same pair resumes the existing setup. Raw session codes never become durable setup state. A fresh session cannot reset a confirmed setup. Full journey terminal close and new-Showdown policy still need their own later protocol.

Secure client random selection does not prove that a modified coordinator cannot choose among valid outcomes. This candidate guarantees one committed outcome and both managers' confirmation, not trustless fair randomness. Provider Rules must prevent invalid outcomes and rerolls; a stronger joint randomness protocol would be an explicit design extension, not an unearned claim.

The adapter must not embed setup into the existing freely published gameplay payload and claim that this enforces the protocol. Existing whole-save writes do not enforce these phase transitions. The next step must define a separate exact-path shared-journey authority or equivalently protected schema with direct modified-client negative tests. No paid compute is available. Provider Rules cannot trust a client hash as authorization or independently evaluate this JavaScript protocol.

No automatic remote-to-local gameplay overwrite is introduced. The pre-draw local Save shell and later exact setup reconciliation must preserve Candidate C's existing exclusive destructive Apply authority, transaction-owned rollback, profile identity and three canonical storage keys.

## Validation and remaining proof

The first targeted Node run passed 65 accepted/rejected immutable transition calls plus concurrent CAS/exact replay, secure draw preparation and mutation-during-hashing checks. This is provider-neutral evidence, not Firebase security proof or physical acceptance. The SSJR calculator reports 0/100. Subsequent exact commands and outcomes are recorded in the active WEC and publication evidence.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Bootstrap: verify live main, this branch/PR and exact CI, `SESSION_BOOTSTRAP.json`, both readiness ledgers and the current WEC. Treat this document as orientation. Never inherit a predecessor transition decision.

Execution: complete this candidate's adversarial/browser protocol proof and exact-head publication. Then implement the smallest Spark-compatible transaction adapter and isolated candidate Firestore Rules for exact shared setup authority. Re-read both active accounts, actor device metadata, exact paired slots and an ACTIVE session in the transaction. Enforce immutable identity/catalog/setup fields, coordinator/role ownership, monotonic revision, replay and no reset. Test direct forged client writes in the emulator before any production Rules publication. After these gates, add the pre-draw shared entry and two-manager setup UI, preserve Candidate C local Apply, and prove production two-account convergence before crediting any fixed capability. Do not rerun consumed RJR physical acceptance or expand billing/provider services.

SLE = Smart Lean Efficient. Every future handoff must include a versioned starter, full deep handoff, byte-identical project mirrors, refreshed capsule/current pointers, exact evidence and next task, the eight-line owner report, and a short repository-first next-developer prompt. At Handoff proximity: 100%, finish the safe bounded checkpoint, package and stop before the next substantial milestone. Unknown usage stays null/unavailable. WEC takes precedence when stricter. Report current SSJR and why each action changes capability or reduces a concrete dependency; keep RJR100 frozen and use the current `Estimated focused sessions to genuine SSJR100` label.

Owner clarification during this session is preserved in `authority-history/OWNER_SSJR_REPORTING_AND_PAIRING_ORDER_2026-09-05.md`: the final shared UI and provider must require pairing and ACTIVE before league or club selection. The owner authorizes necessary changes to achieve that order and a production-proven playable two-manager remote journey at SSJR100. The focused-session estimate now targets SSJR100.

Publication candidate validation checkpoint: `npm run test:contracts` passed all 89 suite files, the static release contract and all three post-suite gates. `npm run test:ssjr` and the isolated two-context Chromium audit passed. The full-suite correction class was current-authority routing/provenance after completed PR198, plus namespace-prefix compatibility; no product safety gate was relaxed. Provider enforcement and production setup UI remain unimplemented.

PR #199 P1 review correction: fixed model SSJR-1.1 supersedes the unmerged SSJR-1 candidate through an explicit 0/100 → 0/100 comparable backcast. League setup now depends on proven entry-before-draw, so missing pairing-order proof blocks all downstream credit and an ordering regression removes 95 points from a synthetic fully credited ledger. Scope, weights, denominator, original baseline and real evidence remain unchanged. Original candidate definition and fingerprint are archived in `authority-history/SSJR1_MODEL_BEFORE_PR199_PAIRING_REVIEW_2026-09-05.json`; the versioned correction is in `authority-history/SSJR1_1_PAIRING_DEPENDENCY_BACKCAST_2026-09-05.json`. The regression test reproduced the old loophole before the correction and passes afterward. The corrected final seal requires fresh exact-head CI and review before merge.
