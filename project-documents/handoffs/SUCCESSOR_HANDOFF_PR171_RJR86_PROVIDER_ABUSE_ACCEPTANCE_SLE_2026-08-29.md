# SUCCESSOR HANDOFF — PR #171 / RJR86 / Provider Abuse Acceptance — 2026-08-29

SLE = Smart Lean Efficient. This is the complete deep-reference successor handoff for the closing environment `we-2026-08-29-rjr-provider-rules-acceptance`. Treat it as orientation only. Current source, live GitHub/provider/deployment evidence and later explicit owner instructions always win.

## 1. Mandatory successor boot

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.
Production application/runtime: `v1.8.1 / 1.8.1-r5`.
Known-good rollback runtime: `1.8.1-r4`.
Pre-PR #171 live main: `cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc` from PR #169.
Publication candidate: PR #171 `Record provider-proven Rules and add production abuse acceptance` on branch `rjr/provider-rules-acceptance-2026-08-29`.
Fixed RJR-1 at this handoff boundary: `86/100` before any live production provider-abuse acceptance result.

Before substantive work, independently fetch live main, PR #171 state/final exact head, changed files, all permanent workflow families, reviews, inline threads, mergeability, Pages deployment, production runtime identity, provider truth, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md`, `SESSION_BOOTSTRAP.json`, `WORK_ENVIRONMENT_STATUS.json`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, and standing owner authorization. If recorded facts conflict with live state, live state wins.

Validate/archive predecessor WEC `we-2026-08-29-rjr-provider-rules-acceptance`, initialize a fresh unique successor WEC from independently observed live main with every per-environment signal reset, then run and obey the fresh assessment. Never inherit the predecessor `PREPARE_HANDOFF`, `HANDOFF_AT_CHECKPOINT`, or any later closing decision.

## 2. What this environment inherited

PR #169 had merged the isolated production Firestore Rules deployment path. Its sealed head was `534c0a9f97aa1f6000a591fb3d0612b8ac4b6f6d`; squash merge/live main was `cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc`; all 14 permanent PR workflow families passed that exact head; both automated inline review findings were resolved; post-merge Pages run `33233575696` succeeded.

Root `firebase.json` intentionally remains on historical `firestore.rules`. Root `.firebaserc` intentionally defaults to `demo-career-mode-showdown-phase1f`, with named production alias `fifa17-career-showdown-prod`. Do not redirect either merely because production now runs the strengthened source. `firebase.production.rules.json` is the isolated production-only deployment config and points to `firestore.spark.rules`.

At inherited RJR85, production strengthened Rules publication was the smallest concrete uncredited cloud-security capability.

## 3. New provider-authoritative proof

The owner opened authenticated Firebase Console project `fifa17-career-showdown-prod` → Cloud Firestore → Database `(default)` → Rules, replaced the editor with the exact reviewed current `firestore.spark.rules` source and published it.

Owner screenshots show:

- production project `fifa17-career-showdown-prod`;
- Firestore Database `(default)`;
- Rules tab/version history;
- a new provider version labeled `Today · 7:48 AM` on 2026-08-29;
- strengthened source anchors visible across approximately lines 1–720;
- `activeDevice` and registered-device validation;
- `validDeviceRevoke`;
- `currentlyEntitled`;
- `activePairedRivalry` with exactly two distinct authorized accounts;
- maximum ten-season shared-state boundary;
- idempotency and server-time mutation-frequency protections;
- rivalry collection `allow list, delete: if false`;
- session boundary still read-only for Stage 5, with create/update/delete/list denied;
- final catch-all `allow read, write: if false`.

Reviewed source blob SHA: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.
Provider proof record added by this branch: `PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md`.
`firebase.production.environment.json` is reconciled to record `firestore.spark.rules` as provider-verified production Rules source.

No evidence says App Check enforcement was enabled, IAM was activated/broadened, billing changed, Authentication settings changed, database data was edited, or any unrelated provider resource changed. Permanent locks remain unchanged.

## 4. RJR reconciliation

`REMOTE_JOINING_READINESS.json` advances exactly `85 → 86`.

Only `production-cloud-security` changes: `19/20 → 20/20`.

The new evidence-history event is `production-strengthened-firestore-rules-provider-publication`. It credits exactly the previously explicit provider-publication capability. PR #169, PR #171, implementation, CI, documentation, Pages deployment and process volume earn zero duplicate credit.

Current fixed domains at RJR86:

- deterministic sync/recovery: `20/20`;
- identity/authentication/trust: `18/20`;
- production cloud/security: `20/20`;
- devices/pairing/Connected Rivalry/actual Remote Joining: `20/30`;
- real-device hardening/release: `8/10`.

Do not change model weights or denominator. Future movement requires genuine new verified fixed-domain capability evidence.

## 5. New bounded provider-abuse acceptance candidate

A legitimate third private account is not established in current evidence. A legitimate revoked current browser/device state is also not available without deliberately creating state, and the existing revoked-device client guard stops before provider write staging. The environment therefore did not fabricate either merely to earn a point.

Instead, current production Rules expose a genuinely unblocked provider-abuse acceptance boundary that any existing active Connected Account can exercise: authenticated rivalry collection enumeration must be denied because `/rivalries/{rivalryId}` explicitly uses `allow list: if false`.

PR #171 adds `js/productionProviderAbuseAcceptance.js` and a new `Authenticated enumeration denial` card to `production-authorization-acceptance.html`.

Exact semantics after all final-head security review:

- requires an authenticated existing active private account;
- performs the existing self-account read needed to verify the account is legitimate and active;
- acquires a shared generation-token authentication-control lock before authentication initialization;
- `productionAuthorizationAcceptance.js` owns that shared lock state, and every `onAuthStateChanged` callback routes through a lock-aware control-state helper so callbacks cannot re-enable SIGN IN or SIGN OUT during the operation;
- sign-in and sign-out handlers themselves fail closed while the shared lock is active;
- the provider probe dynamically verifies the same shared lock token is still held before and after the Firestore query rather than hardcoding a lock-success boolean;
- re-checks that the same Firebase Auth UID remains current after the provider query as an additional fail-closed invariant;
- issues exactly one bounded collection query against `rivalries` with `limit(1)`;
- requests zero Firestore writes;
- requires no rivalry ID, third account or device revocation;
- creates no account/pairing/rivalry/session data;
- snapshots browser storage before/after and requires it unchanged;
- never emits returned rivalry payload data;
- fingerprints the account identifier with SHA-256;
- returns PASS only when the provider query is permission denied, the same account remains current, the same shared auth-control lock remained held through the query, and storage is unchanged;
- any readable query, auth transition/end-state mismatch, missing/lost shared lock, or storage change returns `NOT_PROVEN` and must receive zero RJR credit;
- implementation, contract success, PR merge and deployment alone receive zero RJR credit.

PASS code: `PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED`.
Required evidence fields include `authenticatedAccountStable: true`, `authenticationControlsLockedDuringQuery: true`, `rivalryListDenied: true`, `firestoreWritesRequested: 0`, `localStorageUnchanged: true`, `providerAbuseAcceptanceCandidate: true`, `rjrEligibleEvidenceCandidate: true`.

Fail-closed auth codes include `PROVIDER_ABUSE_AUTH_CHANGED_DURING_PROBE`, `PROVIDER_ABUSE_AUTH_CONTROLS_NOT_LOCKED`, `PROVIDER_ABUSE_AUTH_CONTROL_LOCK_UNAVAILABLE`, `ACCEPTANCE_AUTH_CONTROLS_ALREADY_LOCKED`, and `ACCEPTANCE_AUTH_CONTROLS_LOCKED` where applicable.

Permanent contract: `tests/contracts/production-provider-abuse-acceptance-contracts.cjs`, registered in `tests/support/run-contract-suite.cjs`. It covers normal denied/readable cases, sign-out during the provider call, missing shared lock, shared lock released during the query, lock-token generation and wrong-token release, and static proof that auth-state callbacks and sign-in/sign-out handlers respect the shared lock.

## 6. Validation path and corrected failures

The initial PR #171 candidate opened from head `eb1aba693b5d338de8a0cf9b5be13fe9f61b329b`.

The first Stability gate correctly failed in `handoff-immediate-next-task-contracts.cjs` after core runtime/storage/recovery contracts had already passed. Exact log finding: `SESSION_BOOTSTRAP.json` still reported RJR85 while the live branch ledger reported RJR86 (`85 !== 86`). The same legacy SLE/current-authority contracts froze older PR #166/#167 and provider-unverified pointers.

This was a current-authority coherence failure, not a runtime or provider regression. The environment corrected `NEXT_TASK.md` to the real PR #171 / provider-proven / RJR86 checkpoint and updated the complete SLE/current context package instead of weakening the gate. Exact engineering head `04e9f02d17eec4af2775253d821b3699b2d78e9f` subsequently passed all 14 permanent workflow families before final SNS/SLE forecast sealing.

A final-head Codex review on first WEC-sealed head `1f9feba3d6c3edad258e19a6e8dd1976bbefe051` then found a valid P1: signing out while `getDocs` was in flight could make an unauthenticated permission denial look like authenticated provider-abuse evidence. The environment correctly invalidated that seal, added a post-query same-UID check and a regression test, and exact repair head `3658e91bea6636ff1502fe5d2c66838d5660363e` passed all 14 permanent workflow families. The thread was resolved.

A second final-head Codex review on replacement seal `29f71240fb14a336f0304c1f6f7c771a71231452` found two valid P1s before merge. First, an end-state UID check alone could still miss a transient sign-out followed by sign-in to the same UID before the query settled. Second, this deep SLE handoff itself had not yet recorded the first P1/repair chain, leaving security-critical history only in WEC. The environment again invalidated the seal rather than merge stale evidence.

The second-round transient-auth P1 was closed at a stronger browser boundary: source head `da20773a4dbf8e237d6c7fb5552d9076d655222f` disabled both authentication controls around the complete async query and kept the post-query UID check. Test head `c51fc4a1312fef1a9a0bdfb919c1258254ab2ce4` required the control lock and preserved the sign-out-during-query failure case. Exact engineering head `235387446679d83dc121214c4c126f2d029146b9` passed all 14 permanent workflow families. The deep-handoff P1 was also addressed in both mirrors.

The owner then explicitly changed the recurring owner progress report from seven to eight lines by adding `Estimated focused sessions to genuine RJR100`. `AGENTS.md`, both starter copies, both deep SLE copies and `tests/contracts/owner-progress-reporting-contracts.cjs` were reconciled while the immutable historical seven-line provenance record remained historical. Exact pre-seal head `88bae92676998857f16a8cb8ad5603e8b834f863` passed all 14 permanent workflow families after this reporting-governance change.

A third final-head Codex review on WEC-sealed head `7ce6b8e29c52ddf0be85a1d1655943810b71eeac` found another valid P1 before merge: if the provider probe began before `authorizationAcceptanceInitializePageAuth()` finished, a later `onAuthStateChanged` callback could overwrite the provider module's one-time disabled-button state and re-enable SIGN OUT during a slow query. That could recreate the transient sign-out/sign-back-in-to-same-UID race even though the provider module asserted the controls were locked. The environment again invalidated the seal rather than merge false evidence.

The third P1 repair replaces the independent one-time button lock with one shared generation-token lock owned by `productionAuthorizationAcceptance.js`. Source commit `5b3f4426911d776d26b7469fff72e0573f3ad27e` makes auth callbacks, sign-in and sign-out all honor that shared lock. Source commit `aa751a755de23e58e3d7c8d0d7e3b36c2f8454a8` makes the provider probe acquire/release the exact token and dynamically verify the same token remains held across the Firestore query. Contract commit `0e94dd1d69d0c2e586abf8f6a243e330bd732cc9` proves lock generation, wrong-token fail-closed behavior, loss of the lock during the query, auth-state callback routing and continued zero-write/provider-data privacy guarantees. Final post-packaging workflow/review/merge facts must still be independently verified from live GitHub; none of these pre-seal SHAs is automatically the final merge SHA.

A separate branch-local WEC bookkeeping error was also corrected before publication: the first post-implementation WEC manually retained `CONTINUE` although its own deterministic transition advantage exceeded the `PREPARE_HANDOFF` threshold. The corrected calculation recorded `PREPARE_HANDOFF`; no product behavior or provider state changed.

Tooling limitations are non-product evidence: one web route to public Pages was rejected by the browsing safety layer; one direct local clone route was blocked by the environment tunnel; a direct generic check-run fetch route was unsupported, after which the dedicated GitHub job-log action was used successfully. Do not restart these side routes merely for confidence.

## 7. Why this environment stops after PR #171

The fresh environment began with `CONTINUE`, completed provider publication reconciliation and implemented the bounded provider-abuse acceptance candidate. After current context/evidence growth its deterministic WEC moved to `PREPARE_HANDOFF` and ultimately `HANDOFF_AT_CHECKPOINT`. The active PR #171 publication is one coherent bounded checkpoint and may be finished. The live production acceptance run is a separate owner-authenticated evidence milestone and must not be started by the closing environment after the final handoff decision.

The complete SLE package is therefore prepared in this same engineering PR rather than opening a documentation-only follow-up.

## 8. IMMEDIATE NEXT TASK AFTER FULL STUDY

Successor execution order:

1. Verify PR #171 final exact head, all 14 permanent workflows, reviews/threads, mergeability, squash merge/live main and post-merge Pages deployment. If publication was interrupted, finish only this existing checkpoint after all mandatory gates pass.
2. Verify normal production remains `v1.8.1 / 1.8.1-r5` and the Production Authorization Acceptance page includes `PROBE ENUMERATION DENIAL`.
3. Verify provider Rules remain the strengthened `firestore.spark.rules` boundary and RJR remains exactly 86 before live provider-abuse acceptance.
4. Validate/archive predecessor WEC and initialize/assess a fresh successor WEC.
5. If permitted, ask the owner only for the genuinely owner-only production action: open the deployed Production Authorization Acceptance page, sign in with any existing active Connected Account, click `PROBE ENUMERATION DENIAL`, do not attempt to sign in/out while the probe is running, then supply the sanitized evidence JSON or screenshot. No rivalry ID, third account, revocation or write is needed.
6. If the result is the exact PASS described above—including `authenticatedAccountStable: true` and `authenticationControlsLockedDuringQuery: true`—evaluate exactly one new `real-device-hardening-release` provider-abuse capability, which would make the fixed candidate `86 → 87` only if all evidence requirements are satisfied. Never pre-credit it.
7. Immediately reassess the Stage 5 lock. Do not create generic prerequisite work. If current source shows explicit preconditions have genuinely closed, activate the smallest actual Private Remote Joining host/join/session orchestration slice atomically in `NEXT_TASK.md` with that engineering candidate.
8. Stage 5 will likely require a separately reviewed production Rules revision because the current `/sessions/{sessionId}` boundary allows entitled reads but explicitly denies create/update/delete/list. Do not alter those Rules until the exact Stage 5 session protocol is implemented, contract-tested and publication-ready.
9. After Stage 5 implementation, prioritize real two-device/two-network Remote Joining acceptance, Remote Joining-specific token/reconnect/adverse-network hardening, then final stable release acceptance. Those are the large remaining sources of progress toward RJR100.

## 9. State-dependent negatives

Third-account negative: existing acceptance tooling is valid, but current evidence does not establish a legitimate third active private account. Do not create a synthetic account just to obtain a denial.

Revoked-device negative: existing acceptance tooling can prove a real revoked envelope plus client pre-write guard, but that is explicitly not provider mutation-denial evidence. Do not revoke an owner device merely for a point unless a later reviewed plan establishes a genuinely necessary safe test state.

Neither state-dependent negative should keep the project in an endless prerequisite loop if current verified implementation authority does not make it an explicit Stage 5 blocker.

## 10. Consumed proof — do not repeat merely for confidence

- owner/device pairing proof;
- two-physical-device Connected Rivalry proof;
- Candidate C destructive remote-to-local reconciliation;
- exact accepted-result idempotency replay — evidence-proven / consumed;
- deterministic adverse-provider safety;
- App Check token-lifecycle safety;
- structural abuse resistance;
- sustained mutation-frequency resistance;
- production Pages rollback and exact r5 restoration.

## 11. Permanent locks

Exactly two private managers. Same selected league, different permanent clubs, 1/3/5/10-season product rules remain protected.

Canonical browser storage remains exactly:

- `careerModeShowdown.saveLibrary`
- `careerModeShowdown.legacyShowdowns`
- `careerModeShowdown.preferences`

`activeShowdown` is non-canonical. Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains sole destructive remote-to-local Apply authority with strict exact raw snapshot and transaction-owned rollback.

Firebase remains Spark / zero billing. Firestore persistence remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated/unbroadened. Public discovery, public profiles, community, matchmaking and global rankings remain prohibited. Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.

Standing owner merge/deploy authorization remains active after all required tests, exact-head, review, recovery/security and publication gates pass. Later explicit owner instructions override it.

## 12. Recursive SLE / WEC rule

Every future handoff remains SLE = Smart Lean Efficient and must be a complete mirrored repository package, not a chat-only prompt. At Handoff proximity 100% or a stricter WEC transition decision, finish only the current coherent checkpoint, refresh current pointers/context, make the final WEC seal the last intended branch mutation, validate the unchanged exact head, publish/verify if allowed, give the owner the newest versioned starter and stop before another substantial milestone.

Every future closer must preserve the repository-first next-developer prompt standard. After refreshing the complete mirrored SLE package, run `npm run work:next-prompt` and use its generated repository-first next-developer prompt as the owner-facing continuation entrypoint; the prompt supplements rather than replaces the complete repository handoff.

Never fabricate model/account usage. `usageRemainingPercent` remains `null` / `unavailable` unless an approved product dashboard, CLI status, or explicit owner report provides it.

The owner explicitly changed the reporting format on 2026-08-29. Every substantive owner-facing development report must now preserve exactly this eight-line shape:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: <current bounded engineering lane>
Concrete dependency completed: <most recent concrete dependency completed>
Next unlock: <next dependency or proof gate>
Blocker: <current blocker, or NONE>
Sidequest check: <NONE, or NECESSARY because ...>

The session estimate is roadmap-based planning guidance, not RJR evidence, not a mechanical `100 - score` conversion, and not a promise. Recalculate it when verified dependencies or evidence materially change the critical path. At genuine RJR100 it becomes `~0`. This eight-line format recursively supersedes the prior seven-line shape unless the owner later changes it again.

## 13. RJR100 strategic session forecast

This forecast is planning guidance, not RJR evidence and not a promise of one point per session. The fixed ledger has `14` genuine points remaining at RJR86: identity/authentication/trust `2`, devices/pairing/Connected Rivalry/actual Remote Joining `10`, and real-device hardening/release `2`. Production cloud/security and deterministic sync/recovery are already maxed and must not be mined for duplicate credit.

Expected critical-path range: `5–8 focused successor sessions` to reach genuine RJR100 if provider acceptance behaves as designed, Stage 5 session authority can be implemented without an unexpected architecture change, and two-device/two-network evidence is available when needed. Contingency range: `8–12 sessions` if session-specific Firestore Rules need additional review/publication iterations, provider behavior exposes a real defect, physical-device/network acceptance must be split, or reconnect/token/release acceptance finds legitimate bugs.

Strategic session shape:

1. Publish/verify PR #171 if not already complete, then run the owner-authenticated zero-write provider-abuse enumeration denial. A qualifying PASS may move `86 → 87`; otherwise record the result and award zero.
2. Reassess Stage 5 immediately. If unlocked, specify/contracts + implement the smallest real private host/join/session lifecycle and the minimum separately reviewed session-specific Rules authority required by that exact protocol. No generic prerequisite lane.
3. Publish Stage 5 and obtain real two-device/two-network host/join/session evidence, including exact two-owner privacy and deterministic session identity. RJR movement must follow the fixed ledger, not implementation volume.
4. Harden Remote Joining-specific disconnect/reconnect, stale/replayed intent, token refresh/expiry, session recovery and adverse-network behavior without rerunning already-consumed generic Stage 4 proofs.
5. Close any remaining legitimate authorization/lifecycle gap only when real state exists. Do not fabricate a third account or revoked device; skip non-blocking state-dependent negatives if current authority does not require them.
6. Complete final stable Remote Joining release acceptance, production validation, release-blocking bug closure and strict RJR reconciliation to `100/100` only when every remaining fixed capability is evidence-proven.

Use the lower end only when a session can close multiple naturally coupled capabilities with one coherent implementation + evidence boundary. Use the upper range when provider/review/device gates force separation. Never accelerate the estimate by weakening permanent locks, enabling billing, broadening IAM, enabling App Check enforcement without separate authority, fabricating test identities, or crediting PR/CI/documentation/process volume.