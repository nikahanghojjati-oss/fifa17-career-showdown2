# SUCCESSOR HANDOFF — PR #171 / RJR86 / Provider Abuse Acceptance — 2026-08-29

SLE = Smart Lean Efficient. This is the complete deep-reference successor handoff for closing environment `we-2026-08-29-rjr-provider-rules-acceptance`. Treat it as orientation only. Current source, live GitHub/provider/deployment evidence, the fresh successor WEC, and later explicit owner instructions win.

## 1. Mandatory successor boot

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.
Production application/runtime identity: `v1.8.1 / 1.8.1-r5`.
Known-good rollback runtime: `1.8.1-r4`.
Pre-PR #171 live main: `cbdc8cbf12f53b1bb60e6e1306f070a11ae6ccbc`, the PR #169 squash merge.
Publication PR: #171 `Record provider-proven Rules and add production abuse acceptance` on `rjr/provider-rules-acceptance-2026-08-29`.
Fixed Remote Joining readiness at this handoff boundary: `86/100`, before any live provider-abuse acceptance result.

Before substantive work, independently verify live `main`, PR #171 final exact head/post-merge state, all 14 permanent workflow families, reviews and inline threads, mergeability, GitHub Pages publication, production runtime identity, provider Rules truth, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md`, `SESSION_BOOTSTRAP.json`, `WORK_ENVIRONMENT_STATUS.json`, `00_DEVELOPER_START_HERE.md`, `00_CURRENT_HANDOFF.md`, and standing owner authorization. Live facts override this handoff.

Validate/archive predecessor WEC `we-2026-08-29-rjr-provider-rules-acceptance`, initialize a fresh unique successor WEC from independently observed live main with every per-environment signal reset, and obey the fresh assessment. Never inherit this environment's `HANDOFF_AT_CHECKPOINT` decision.

## 2. Provider proof and fixed RJR reconciliation

The owner supplied direct authenticated Firebase Console evidence that production project `fifa17-career-showdown-prod`, Firestore `(default)`, accepted the reviewed strengthened `firestore.spark.rules` source. Reviewed/published Rules blob: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`. Provider proof record: `PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md`.

The provider evidence showed a new production Rules version on 2026-08-29 and strengthened anchors including active registered devices, revocation validation, two-owner entitlement, active paired-rivalry constraints, idempotency/server-time mutation limits, `allow list, delete: if false` on rivalry collection enumeration, the still-locked Stage 5 session mutation boundary, and final deny-by-default.

Fixed RJR moved exactly `85 -> 86`: only `production-cloud-security` moved `19/20 -> 20/20`. PR count, implementation volume, CI, documentation, deployment-path mechanics, service-worker reachability/cache repair, merge, and Pages publication earn zero duplicate RJR credit.

Current fixed domains:

- deterministic sync/recovery `20/20`;
- identity/authentication/trust `18/20`;
- production cloud/security `20/20`;
- devices/pairing/Connected Rivalry/actual Remote Joining `20/30`;
- real-device hardening/release `8/10`.

Fourteen genuine points remain. Do not change weights or denominator.

## 3. PR #171 provider-abuse acceptance boundary

PR #171 adds the `Authenticated enumeration denial` / `PROBE ENUMERATION DENIAL` surface to `production-authorization-acceptance.html` and supporting `js/productionProviderAbuseAcceptance.js` behavior.

The accepted design requires one legitimate existing active Connected Account. It performs the existing self-account check and then exactly one bounded authenticated Firestore query against the `rivalries` collection with `limit(1)`. It requests zero writes, requires no rivalry ID, no third account, no revoked device, no synthetic state, creates no account/pairing/rivalry/session state, emits no rivalry payload, fingerprints the account identifier, and requires browser storage unchanged.

Authenticated evidence is fail-closed. `productionAuthorizationAcceptance.js` owns one shared generation-token authentication-control lock. The provider probe acquires the exact shared token before authentication initialization, auth-state callbacks route button state through that lock, sign-in and sign-out handlers refuse to run while it is held, the provider probe dynamically verifies that the same token remains held across the asynchronous provider query, and it also verifies the same Firebase Auth UID remains current afterward. Wrong-token release, lock loss, auth change, readable enumeration, or storage change all produce `NOT_PROVEN` and zero RJR credit.

The production acceptance document and its two acceptance-only JavaScript modules are intentionally network-only for service-worker-controlled requests. `production-authorization-acceptance.html`, `js/productionAuthorizationAcceptance.js`, and `js/productionProviderAbuseAcceptance.js` bypass generic shell navigation/versioned-cache routing and are fetched through a cache-bypassing `Request(...,{cache:"reload"})` so stale ordinary HTTP-cache entries cannot preserve the pre-PR document or lock API. They remain outside `SHELL_PATHS`; shared shell assets used by the page may still come from the verified r5 shell cache.

A qualifying production PASS is `PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED` with at least:

- `authenticatedAccountStable: true`;
- `authenticationControlsLockedDuringQuery: true`;
- `rivalryListDenied: true`;
- `firestoreWritesRequested: 0`;
- `localStorageUnchanged: true`;
- `providerAbuseAcceptanceCandidate: true`;
- `rjrEligibleEvidenceCandidate: true`.

Implementation, contracts, merge, and deployment alone are never the acceptance evidence.

## 4. Final-head review history and repairs

PR #171 was deliberately not merged when reviews found real defects.

Round 1: the branch advanced RJR authority to 86 while bootstrap/current-task authority still said 85. Current authority and contracts were reconciled before proceeding.

Round 2: Codex found that signing out while `getDocs` was in flight could make an unauthenticated provider denial look like authenticated evidence. A post-query same-UID invariant and regression case were added.

Round 3: Codex proved an end-state UID check alone could miss transient sign-out/sign-in to the same UID, and also found that the deep SLE handoff omitted the security-repair history. Both prior seals were invalidated. The browser operation was changed to lock authentication controls for the entire query, and both deep handoff mirrors were refreshed.

Round 4: Codex reviewed sealed head `7ce6b8e29c52ddf0be85a1d1655943810b71eeac` and found that the independent `onAuthStateChanged` callback could overwrite the provider module's one-time disabled-button state, re-enable SIGN OUT during a slow query, and recreate the transient-auth race. That seal was invalidated. Repair commits `5b3f4426911d776d26b7469fff72e0573f3ad27e`, `aa751a755de23e58e3d7c8d0d7e3b36c2f8454a8`, and `0e94dd1d69d0c2e586abf8f6a243e330bd732cc9` introduced the shared generation-token lock, dynamic token verification, callback/sign-in/sign-out compliance, and permanent fail-closed regression coverage. The P1 thread was replied to and resolved.

Round 5: Codex reviewed replacement WEC-sealed head `57dd5804aadd402f715fbe39774cbb45c28db523` after that head passed all 14 permanent workflow families. It found a separate publication P1: a returning browser already controlled by the r5 service worker navigated `production-authorization-acceptance.html` through the generic shell fallback and received cached `index.html`, so the new probe was unreachable. The seal was invalidated before merge. `service-worker.js` then named `production-authorization-acceptance.html` as a network-only navigation path and bypassed `chooseNavigationRuntime()`/cached `index.html` for that exact auxiliary route. `tests/contracts/production-provider-abuse-acceptance-contracts.cjs` permanently required that document bypass and required the route to stay outside the offline shell. A subsequent repository contract correctly caught that the refreshed deep SLE omitted the required `work:next-prompt` recursive closer directive; both SLE mirrors were repaired, and exact pre-seal head `3a31cb62339ee40cb5a944db37cd305f085c2d18` passed all 14 permanent workflow families.

Round 6: Codex reviewed final WEC-sealed head `43e63f66675bdb2f2d4b0d011165db5dced628aa` after that exact head passed all 14 permanent workflow families. It found that the document-only service-worker bypass was still incomplete: the network-fetched acceptance HTML references versioned `js/productionAuthorizationAcceptance.js` and `js/productionProviderAbuseAcceptance.js`, neither module is in `SHELL_PATHS`, and the generic versioned-resource handler therefore returned `Response.error()` instead of fetching them. The seal was invalidated before merge. Source repair `5a367f1357c618bb298fbbf7d11541e91fd16200` added both acceptance-only modules to explicit `NETWORK_ONLY_ASSET_PATHS`; contract repair `2b78b8c02c29cec6da4fb14fe3268b2cc1584c58` permanently required both module bypasses and outside-shell invariants. Exact repaired pre-seal head `007b743f11d4ce125990fb339e955140c61d66c1` passed all 14 permanent workflow families.

Round 7: Codex reviewed final WEC-sealed head `f180afcf2b899d2780ea5d1d60ecce4fca4352da` after that exact head passed all 14 permanent workflow families. It found that plain `fetch(request)` on the network-only branches could still reuse ordinary HTTP cache entries because the acceptance document and modules retained the same r5 URLs. A returning browser could therefore receive the pre-PR document or old authorization module even though service-worker shell-cache routing was bypassed. The seal was invalidated before merge. Source repair `04204cae4d4f5a94d360640c7d3c5c5c0520c604` introduced `networkOnlyRequest(request)` using `cache:"reload"` for both the acceptance navigation and acceptance-only module paths; contract repair `a2474af74e8425b219044dfb9048e39022a6133b` permanently requires that cache-bypassing fetch. No provider write authority or RJR credit was added.

Every later final-head workflow/review/merge fact must be independently verified from GitHub; no SHA named above should be assumed to be the final merge SHA.

## 5. Publication gate

The closing environment may finish PR #171 only. Standing owner merge/deploy authorization remains active after all required tests, exact-head workflow, review/thread, recovery/security, mergeability, and publication gates pass. A later explicit owner instruction overrides it.

Required final publication sequence:

1. obtain 14/14 successful permanent workflow families on the complete repaired pre-seal package;
2. refresh both SLE mirrors and any materially affected current pointers;
3. make `WORK_ENVIRONMENT_STATUS.json` the final intended branch mutation with `HANDOFF_AT_CHECKPOINT` and 100% handoff completeness;
4. obtain 14/14 success again on that unchanged sealed head;
5. request final-head Codex review, require no unresolved blocking thread, and confirm mergeability;
6. squash merge with expected-head protection under standing authorization;
7. verify live main equals the merge SHA and the post-merge GitHub Pages deployment succeeds;
8. verify production remains source/runtime `v1.8.1 / 1.8.1-r5` and the deployed acceptance URL renders `PROBE ENUMERATION DENIAL` with fresh acceptance-only modules rather than the app shell, a script-less document, or stale HTTP-cache resources;
9. report Handoff proximity 100%, give the owner the SNS, and stop before the separate live acceptance milestone.

## 6. IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify PR #171 publication facts and production reachability. If publication was interrupted, finish only the already-bounded PR #171 checkpoint after every required gate is clean.
2. Validate/archive predecessor WEC and initialize/assess a fresh successor WEC.
3. If the fresh assessment permits, ask the owner only for the genuinely owner-authenticated action: open deployed `production-authorization-acceptance.html`, sign in with any legitimate existing active Connected Account, click `PROBE ENUMERATION DENIAL`, and provide the sanitized evidence JSON or screenshot. No rivalry ID, third account, revocation, or provider write is required.
4. If and only if the result is the exact qualifying PASS described above, evaluate at most one previously uncredited provider-abuse capability, candidate fixed RJR `86 -> 87`. Otherwise record `NOT_PROVEN` and award zero.
5. Immediately reassess the Stage 5 lock. Do not invent generic prerequisite work. If current source shows explicit preconditions genuinely close, activate the smallest real Private Remote Joining host/join/session orchestration slice atomically in `NEXT_TASK.md` with the engineering candidate.
6. Stage 5 will likely require separately reviewed production session Rules because the current `/sessions/{sessionId}` boundary allows entitled reads but denies create/update/delete/list. Implement the exact session protocol first, contract-test it, then publish only the minimum Rules authority that protocol needs.
7. After Stage 5 implementation, prioritize real two-device/two-network host/join/session acceptance, Remote Joining-specific reconnect/token/adverse-network hardening, and final stable release acceptance until the fixed ledger genuinely reaches 100/100.

## 7. State-dependent negatives and consumed proof

A legitimate third active private account is not established. A legitimate revoked current device state is not established. Do not fabricate either merely for scoring. The existing revoked-device client guard is not provider mutation-denial proof.

Do not repeat already-consumed owner/device pairing, two-physical-device Connected Rivalry, Candidate C destructive reconciliation, exact replay, generic adverse-provider, App Check token-lifecycle, structural-abuse, sustained mutation-frequency, or production rollback/restoration proof merely for confidence.

## 8. Permanent locks

Exactly two private managers remain required. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical. Candidate A remains non-mutating, Candidate B read-only, and Candidate C remains the sole destructive remote-to-local Apply authority with transaction-owned strict exact raw snapshot rollback.

Firebase remains Spark / zero billing. Firestore client persistence remains memory-only. Google Auth remains popup-only with `browserSessionPersistence` and no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains unactivated and unbroadened. Public discovery, public profiles, community, matchmaking, and global rankings remain prohibited. Historical rivalry `pair_a07108...756fb` must not be forced, edited, or deleted.

Root `firebase.json` remains on historical `firestore.rules`; root `.firebaserc` default remains `demo-career-mode-showdown-phase1f`; named production alias remains `fifa17-career-showdown-prod`. Do not redirect those defaults merely because production Rules use `firebase.production.rules.json` + `firestore.spark.rules`.

## 9. Recursive SLE / WEC / owner reporting rule

Every future handoff remains SLE = Smart Lean Efficient and must be a complete mirrored repository package, not a chat-only prompt. At Handoff proximity 100% or a stricter WEC transition decision, finish only the current coherent checkpoint, refresh current pointers and recursive SLE evidence, make the final WEC seal the last intended branch mutation, validate the unchanged exact head, publish/verify when authorized, provide the fresh repository-first next-developer prompt, and stop before another substantial milestone.

After refreshing the current starter, deep handoff, bootstrap, and context pointers, every future closer must run `npm run work:next-prompt` and use its generated repository-first next-developer prompt as the owner-facing continuation entrypoint. The generated prompt supplements rather than replaces the complete mirrored SLE package.

Never fabricate model/account usage. `usageRemainingPercent` stays `null` / `unavailable` unless an approved product source or explicit owner report provides it.

Every substantive owner-facing development response must recursively use exactly this eight-line shape:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: <current bounded engineering lane>
Concrete dependency completed: <most recent concrete dependency completed>
Next unlock: <next dependency or proof gate>
Blocker: <current blocker, or NONE>
Sidequest check: <NONE, or NECESSARY because ...>

The session estimate is roadmap-based planning guidance, not RJR evidence, not a score-derived countdown, and not a promise. Recalculate it when verified dependencies materially change the critical path. At genuine RJR100 it becomes `~0`.

## 10. RJR100 strategic session forecast

Expected critical path from fixed RJR86: approximately `5–8 focused successor sessions`; contingency `8–12` if provider behavior, session-Rules review/publication, real two-network acceptance, reconnect/token hardening, or legitimate bugs force additional iterations.

The expected shape is: finish PR #171 and obtain the live zero-write provider-abuse result; reassess/unlock Stage 5 and implement the smallest real host/join/session lifecycle plus minimum session Rules; prove real two-device/two-network joining; harden Remote Joining-specific reconnect/token/adverse-network behavior; close only legitimate remaining authorization/lifecycle gaps; and complete final stable production acceptance with strict RJR reconciliation. Never shorten this forecast by weakening permanent locks or crediting process volume.
