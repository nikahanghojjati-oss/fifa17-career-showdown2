# Successor Handoff — PR #173 / Stage 5A Candidate Proven / RJR87 — SLE 2026-08-31

SLE = Smart Lean Efficient. This is the complete deep-reference successor package for the Stage 5A private-session protocol/client and candidate Firestore Rules checkpoint.

This handoff is orientation only. Current source, live GitHub/provider/deployment evidence, `REMOTE_JOINING_READINESS.json`, current authority files, the successor's freshly initialized WEC, and later owner instructions win.

## 1. Repository and production identity

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.

Production application/runtime: `v1.8.1 / 1.8.1-r5`.

Known-good rollback runtime: `1.8.1-r4`.

Stage 5A starting live main: `4c12d68dacc0112c7c0fe70d4f1a25e3df7de5de`, the PR #172 squash merge.

PR #173: `Implement Stage 5A private-session candidate boundary`.

Implementation proof head before SLE packaging: `217d9d729774b23ab4fdf8c5cae842d993986a3f`.

Implementation proof tree: `21a96e44f2e606cc14cd6b54254544b456095036`.

Candidate proof record: `STAGE5A_PRIVATE_SESSION_CANDIDATE_EMULATOR_PROOF_2026-08-31.md`.

Reviewed and provider-proven production Rules source: `firestore.spark.rules`.

Reviewed production Rules blob: `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.

Production provider project remains `fifa17-career-showdown-prod`, database `(default)`.

App Check enforcement remains OFF. Firebase remains Spark / zero billing. Firestore client persistence remains memory-only.

The closing environment must independently verify PR #173's final exact head, all workflows, review/thread/mergeability state, squash merge, post-merge workflows, Pages publication, live main, public runtime and unchanged production Rules. A successor must not treat this pre-seal candidate head as the final publication fact.

## 2. Predecessor verification and fresh WEC provenance

The Stage 5A environment independently verified before implementation:

- PR #172 exact final head `d282c204122e7610beb9093b2d79a3db804336c5`;
- PR #172 squash/live main `4c12d68dacc0112c7c0fe70d4f1a25e3df7de5de`;
- identical tree `cab8416c4c822ada3b62a71a1d747262f9294ff6`;
- all 14 exact-head PR workflows successful;
- zero submitted reviews and zero inline review threads;
- all 14 post-merge validation families plus Pages run `33309615324` successful;
- all 91 public runtime files byte-for-byte equal to source `1.8.1-r5`;
- unchanged production Rules blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`;
- fixed RJR `87/100`.

Predecessor WEC `we-2026-08-29-provider-abuse-production-acceptance` was validated and archived additions-only. Its `HANDOFF_AT_CHECKPOINT` decision and counters were not inherited.

Fresh environment `we-2026-08-30-stage5a-private-session-protocol` was initialized from exact live main with reset counters and initially assessed `CONTINUE`. That environment owns PR #173 and this transition package.

## 3. Why Stage 5A was authorized

The legitimate deployed production probe returned `PASS / PROVIDER_ABUSE_AUTHENTICATED_LIST_DENIED` for an existing active Connected Account with stable authentication, a held authentication-control lock, one `limit(1)` rivalry enumeration request, provider `permission-denied`, zero writes and unchanged localStorage.

That consumed production evidence advanced fixed RJR exactly `86 -> 87` and closed the last explicit non-state-dependent Stage 4 security prerequisite. It did not fabricate third-account or revoked-device state.

Current authority therefore permitted the smallest real Stage 5 slice only: a separate private-session protocol/client, deterministic emulator contracts and isolated candidate minimum session Rules. Production Rules publication and host/join UX were deliberately excluded.

## 4. Stage 5A implementation

`js/sparkPrivateSession.js` is a separate UMD/CommonJS module. It is not loaded by `index.html`, the service worker, production runtime or the protected Stage 4 module.

It defines:

- `session_` plus exactly 64 lowercase hexadecimal characters, providing an opaque 256-bit capability;
- path `rivalries/{rivalryId}/sessions/{sessionId}`;
- exact fields `rivalryId`, `hostAccountId`, `memberAccountIds`, `state`, `createdAt`, `expiresAt`, `lastActivityAt`, `revokedAt`;
- exact lifecycle `open | active | revoked | expired | closed`;
- default 15-minute TTL and maximum 30-minute TTL;
- a required provider-verifiable Firebase Auth custom claim named `device_id` before any session provider access;
- an exact match between that claim and the caller's in-memory local device identity;
- account, device and rivalry authority reads with immediate local validation;
- exactly two distinct active rivalry accounts and two active manager slots;
- SHA-256 content-envelope integrity;
- host-only open creation;
- exact-session retry as deterministic replay without revision or expiry extension;
- other-entitled-peer-only join from `open` to `active`;
- host-only revoke;
- active-member close;
- bounded member expiry, with host required while the session has no peer;
- immutable terminal states.

The module exposes exact-path operations only. It has no collection query, public discovery, persistent provider cache, localStorage, IndexedDB, local Save, gameplay projection or Candidate C operation.

## 5. Candidate Rules boundary

`firestore.stage5a.rules` copies current `firestore.spark.rules` and adds exactly two tagged regions:

- `STAGE5A_CANDIDATE_SESSION_FUNCTIONS_BEGIN/END`;
- `STAGE5A_CANDIDATE_SESSION_MATCH_BEGIN/END`.

The deterministic contract removes those tagged regions and proves the remaining source is byte-identical to production Rules.

Candidate authority requires:

- a syntactically exact 256-bit session capability;
- an active paired rivalry with exactly two distinct entitled accounts;
- a provider-verifiable `request.auth.token.device_id` claim naming the caller's current active registered device on every read and mutation;
- an exact match between every mutation's `updatedByDeviceId` and that provider credential;
- exact-path get only and no list;
- host/open create with bounded expiry;
- peer/open-to-active join;
- immutable rivalry, host, creation and expiry;
- exact two-member rivalry authority;
- CAS envelope lineage;
- host revoke, active-member close and member expiry;
- no delete and no resurrection.

The missing-document exact get is allowed only to the active entitled pair so a transaction can distinguish initial create from idempotent retry. The capability remains non-enumerable and listing remains denied.

The browser-supplied envelope device ID is not treated as caller authentication. The candidate fails closed without a valid `device_id` token claim. Production has no proven issuer/refresh/revocation path for that claim yet, so these candidate Rules must not be published as functional production session authority until the separate provider-device-credential boundary is established.

The candidate validates shared structural data once per update and then evaluates the exact requested target transition. This removed expression-budget exhaustion exposed by provider logs on deliberately late-failing forged updates.

## 6. Deterministic and provider emulator proof

`tests/contracts/stage5a-private-session-contracts.cjs` proves client semantics, storage/runtime isolation, production Rules isolation and provider-outage safety.

`tests/firebase/stage5a-private-session-emulator.cjs` executes candidate Rules through the real Firestore emulator after establishing a legitimate Stage 3 exactly-two-account rivalry.

The emulator matrix covers:

- authorized host open and replay;
- expiry immutability on replay;
- conflicting host denial;
- host self-join denial;
- peer exact read of open state;
- anonymous and third-account denial;
- collection and collection-group listing denial;
- forged host, membership and expiry mutation denial;
- peer join and replay;
- delete denial;
- close and replay;
- terminal join/resurrection denial;
- peer revoke denial;
- host revoke and replay;
- premature expiry denial followed by accepted expiry and replay;
- malformed ID create denial;
- third-account create denial;
- missing provider-device-credential denial on direct exact get;
- never-registered provider-device-credential denial on direct exact get;
- revoked-device denial;
- revoked-device denial on direct exact get, not only through the client preflight;
- denial when a write names another active device while the caller token still names the current device;
- inactive-account denial;
- lost-rivalry-entitlement denial.

PR #173 initial head `46a546b8b7c36b835133e7a74110393578bad247` compiled and exercised the real candidate but exposed one stale inactive-account expectation. Immediate account/device/rivalry validation and pre-loss fixture snapshots corrected it.

Corrected head `f7e012e2a5a5d7eef80c72737f0498baa9986efd` passed workflow run `33346774156`, job `99352269382`, including the complete Stage 5A emulator PASS. Provider logs then revealed expression-budget exhaustion only on deliberately forged late-failing updates; no forged write succeeded.

Hardened head `708bb881dec7db65085dc8d9b447126605d00b38` narrows shared update validation to one structural pass and passed all 14 permanent pull-request workflow families. Exact workflow run `33346922234`, job `99352686582`, completed SUCCESS with deterministic Stage 5A plus the full real candidate emulator matrix. The Stage 5A execution interval contains no expression-budget-exhaustion diagnostic; deliberately denied forged operations remained `PERMISSION_DENIED` and no forbidden write succeeded.

Automated review then found a valid P1: session reads proved account/rivalry entitlement but did not provider-authenticate the browser's current registered device. Direct exact reads from an entitled account could therefore bypass the client preflight after local device revocation. The corrected boundary uses Firebase Auth custom claim `device_id`, verifies that exact device is currently active in Rules, and binds writes to the same claim.

Corrected head `217d9d729774b23ab4fdf8c5cae842d993986a3f`, tree `21a96e44f2e606cc14cd6b54254544b456095036`, passed all 14 permanent pull-request workflow families. Exact workflow run `33348247795`, job `99356433928`, completed SUCCESS. Provider logs prove the deterministic credential contract, the complete real emulator credential-denial matrix, zero Stage 5A expression-budget diagnostics and no assertion failure. The 11 permission-denied lines are expected negative cases. Review thread `PRRT_kwDOTomsDM6dlgrC` is resolved after the correction and evidence reply.

Emulator identities and provider mechanics are test evidence only. They receive zero production RJR credit.

## 7. Correction history that must not be repeated

- An early candidate Rules reconstruction interpreted replacement metacharacters and duplicated source suffixes. Diff review caught it before tests/publication; literal functional replacement rebuilt a clean single-service candidate.
- Static release contracts identified seven duplicate top-level helper names in the new module. Helpers were uniquely session-scoped so production release namespace discipline remains intact.
- A generic `npm test` command was invalid because the repository intentionally uses `npm run test:contracts`; the authoritative complete suite passed.
- The managed local runner could install test libraries but could not download/start the Firestore emulator because outbound dependency access was restricted. The permanent GitHub Actions lane supplied the real provider emulator proof.
- The first PR head fetched all transaction documents before classifying an already-read inactive account. Immediate per-read validation now returns the bounded local error before a downstream provider denial.
- Authority-removal fixtures originally attempted to read the session after intentionally invalidating the account/rivalry boundary. Snapshots are now captured before removal and unchanged authority is asserted by direct denied mutation plus restored fixture state.
- Provider logs exposed expression-budget exhaustion for forged late-failing session updates. Shared structural validation is now evaluated once and transition-specific guards remain explicit.
- Automated review correctly showed that a browser-supplied envelope device ID cannot authenticate the caller's current device for direct reads. Session Rules now require the provider-verifiable `device_id` Auth claim, recheck its active device document and bind every write to the claim.

These were bounded corrected failures. No production state, production Rules, local canonical storage or protected rivalry was changed.

## 8. Production and runtime exclusions

PR #173 does not change:

- `firestore.spark.rules`;
- `firebase.json`;
- `firebase.production.rules.json`;
- `.firebaserc`;
- production Firebase provider Rules;
- application version or runtime revision;
- service-worker assets or runtime script loading;
- host/join UX;
- Auth scopes or persistence;
- App Check enforcement;
- trusted-runtime IAM;
- billing;
- canonical localStorage keys;
- Candidate A, B or C authority;
- production accounts, devices, rivalries, sessions or shared state.

Production also does not yet issue, refresh or revoke the candidate's `device_id` custom claim. The credential boundary is emulator-proven only and receives zero production credit. Weakening it back to a browser-supplied device ID is forbidden.

No public discovery, lobbies, matchmaking, community, public profiles, rankings, leaderboards or session listing are permitted.

Historical rivalry `pair_a07108...756fb` remains untouched.

## 9. Fixed RJR authority

`REMOTE_JOINING_READINESS.json` remains the sole numeric authority.

Score: `87/100`.

Domain vector remains:

- deterministic sync/recovery: `20/20`;
- identity/auth/trust: `18/20`;
- production cloud/security: `20/20`;
- devices/pairing/Connected Rivalry/actual Remote Joining: `20/30`;
- real-device hardening/release: `9/10`.

Stage 5A establishes a source/emulator candidate but does not create a provider-live production session or playable host/join experience. Source, contracts, emulator identities, PRs, CI, merge, Pages and documentation add zero readiness points.

Thirteen genuine points remain. Actual production session authority, playable host/join, two-network behavior, Remote Joining-specific reconnect/token/adverse-network acceptance, remaining identity/session authorization proof and final stable release acceptance remain uncredited.

## 10. Closing publication gate

The closing environment must:

1. finish the complete mirrored SLE/current-authority package;
2. run focused contracts, JSON validation, mirror equality, WEC validation, diff hygiene and the complete repository suite;
3. publish a pre-seal head and require all 14 exact-head workflow families;
4. inspect exact failed job logs before any correction;
5. inspect reviews and every inline review thread;
6. verify mergeability;
7. make the final WEC transition seal the last intended branch mutation;
8. require all 14 workflow families again on the unchanged final seal;
9. expected-head squash merge under standing authorization only when every gate is clean;
10. verify live main, post-merge validation families, Pages and unchanged public `v1.8.1 / 1.8.1-r5`;
11. verify production `firestore.spark.rules` provider truth was not changed by this source-only candidate;
12. report Handoff proximity 100%, give the short repository-first prompt and stop.

## 11. IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify PR #173 final exact head, changed files, all 14 workflow families, submitted reviews, inline threads, mergeability, squash merge, post-merge validation, Pages deployment, live main, public runtime and production/provider Rules truth. If the closing publication was interrupted, finish only that bounded checkpoint when all required gates are clean.

2. Validate/archive closing WEC `we-2026-08-30-stage5a-private-session-protocol`, initialize a fresh unique WEC from observed live main with reset counters, run `npm run work:assess`, and obey the new environment's own decision.

3. If permitted, begin `stage5b-provider-verifiable-device-credential-boundary`: establish the smallest safe provider-verifiable current-device credential issuance, refresh and revocation path for the `device_id` Auth claim, without trusting browser-supplied identity.

4. Preserve Spark / zero billing, App Check OFF and the unactivated/unbroadened trusted-runtime IAM boundary. If a safe credential issuer is impossible inside those locks, freeze the evidence-backed blocker and obtain owner direction; do not broaden IAM, enable billing or weaken Rules by assumption.

5. Keep production session Rules publication, production runtime loading and host/join UX excluded from the credential slice. They remain separate later activation slices after provider credential proof.

Do not insert a generic prerequisite lane. Do not repeat consumed evidence merely for confidence. Do not manufacture third-account, revoked-device, two-network, provider or production session evidence.

## 12. Permanent locks

Exactly two private managers.

Canonical browser storage remains exactly:

- `careerModeShowdown.saveLibrary`;
- `careerModeShowdown.legacyShowdowns`;
- `careerModeShowdown.preferences`.

`activeShowdown` remains non-canonical. Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local Apply authority with strict exact raw snapshot and transaction-owned rollback.

Firebase remains Spark / zero billing. Firestore remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted runtime IAM remains unactivated and unbroadened.

Standing owner merge/deploy authorization remains active through project completion after all applicable tests, exact-head workflows, reviews, threads, mergeability, deployment and live-verification gates pass. Later explicit owner instructions override it.

## 13. Owner progress format

Every substantive owner update uses exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, automatically complete the mirrored SLE package, seal WEC, provide the fresh short prompt and stop before the next substantial milestone.

## 14. Recursive SLE and prompt rule

Future handoffs recursively preserve SLE = Smart Lean Efficient, WEC, fixed RJR evidence discipline, permanent locks, standing gated publication authorization, the exact eight-line progress format and the repository-first next-developer prompt standard.

Future closers run `npm run work:next-prompt`. The owner receives the short repository-first prompt as the normal entrypoint. The full handoff remains the deep fallback and must not become an owner continuity chore.
