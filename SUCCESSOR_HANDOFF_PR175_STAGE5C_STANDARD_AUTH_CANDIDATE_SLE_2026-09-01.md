# Successor Handoff — PR #175 / Stage 5C Standard-Auth Candidate / RJR87 — SLE 2026-09-01

SLE = Smart Lean Efficient. This is the complete deep-reference successor package.

This handoff is orientation only. Current source, live GitHub/provider/deployment evidence, `REMOTE_JOINING_READINESS.json`, current authority, the successor's fresh WEC and later owner instructions win.

## 1. Repository and production identity

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`.

Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`.

Production remains `v1.8.1 / 1.8.1-r5`, DEPLOYED / PRODUCTION-PROVEN. Known-good rollback runtime remains `1.8.1-r4`.

Production runtime lineage remains PR #166 merge `32c32afb1365c9ae6120d810a68e5c72c4b8229a`; rollback/restoration run `33190961085` remains consumed evidence.

Production Rules remain exact provider-proven `firestore.spark.rules` blob `2b7c0b166ae0aae7ab7a3ce84725b21091262484`.

## 2. PR #174 closure

PR #174 final reviewed head `1c203fceeb209249687db3c70cafea21a56eabe8` had tree `ec5425c330e6ec80ab6e032b75f0bc316abb2c48`.

All 14 exact-head workflow families passed. The Java 21 Stage 3 job proved both Stage 5A and corrected Stage 5B Auth-plus-Firestore boundaries. Final-head Codex review was clean after its valid P2 thread was resolved; zero threads remained unresolved.

PR #174 squash-merged at `2026-09-01T04:33:51Z` to main `48ceef1e8c9986fdfe346de1a7151a31f314044b` with identical tree `ec5425c330e6ec80ab6e032b75f0bc316abb2c48`.

All 15 normal post-merge/Pages runs are successful. Stability attempt 1 failed only because the loading audit read `object-fit` before the dynamic fidelity stylesheet loaded. Authorized attempt 2 passed the visual step and every later deployed-site step. The 94-file deployment verifier matched public `1.8.1-r5` byte-for-byte.

No production Rules, Firebase provider, IAM, billing, runtime or data mutation resulted from PR #174.

## 3. Controlling owner authority

`00_OWNER_ZERO_BILLING_REMOTE_JOINING_AUTHORIZATION.md` authorizes every remaining engineering, IAM, provider, authentication-policy, Security Rules, runtime, deployment, testing, evidence, merge and publication decision needed for Remote Joining except billing.

Billing must never be activated. Never link Cloud Billing, enable Blaze, add a payment method, activate Cloud Run or activate another service that requires billing even if it advertises a free usage tier. Firebase must remain Spark.

Standing owner authorization permits merge and deploy once all required tests and current mandatory gates pass. A successor must not ask again for already-granted nonbilling production authority.

The architecture authority remains `ZERO_BILLING_REMOTE_JOINING_ARCHITECTURE_DECISION_2026-08-31.md`: existing Google Authentication, direct exact-path Cloud Firestore client operations, deny-by-default Rules, memory-only Firestore and GitHub Pages.

## 4. PR #175 publication boundary

PR #175 is `Prove Stage 5C zero-billing standard-auth session adapter`.

Branch: `rjr/stage5c-zero-billing-standard-auth-session-adapter-2026-09-01`.

Starting main: `48ceef1e8c9986fdfe346de1a7151a31f314044b`.

First published implementation proof head/tree: `cd41261270da53c75313b157625b6d4ac00661c8` / `3cf6baee5b17da852fbad0bf0452681654004798`.

The final SLE seal changes the PR head. The successor must fetch the current exact head/tree, workflow runs, reviews, threads and mergeability rather than infer final state from this recorded first proof.

PR #175 is candidate-only. It does not publish production session Rules, load a runtime module, expose host/join UX or create provider-live session data.

## 5. Stage 5C implementation

`js/sparkStandardAuthPrivateSession.js` wraps the existing private-session protocol with explicit `standard-auth-device-metadata` mode.

Registered device IDs are account-owned mutation metadata and are not authentication.

Production identity truth is ordinary Firebase authenticated `uid`, represented in Firestore Rules by `request.auth.uid`.

The adapter preserves the already-selected popup-only Google provider, `browserSessionPersistence`, no extra scopes, memory-only Firestore and no custom-token or custom-device-claim requirement.

`js/sparkPrivateSession.js` retains its original Stage 5A provider-device-credential mode as the default. Stage 5C adds a separate explicit standard-auth mode so historical Stage 5A/5B evidence is not silently rewritten.

Standard-auth mode validates:

1. an authenticated Firebase user with a valid UID;
2. a normalized selected device ID used as current account-owned mutation metadata;
3. exact rivalry/session/capability identifiers;
4. the existing deterministic session lifecycle and CAS boundary.

It explicitly returns `providerBound: false`. It never represents a standard token as proof of a physical browser, non-extractable key or cryptographic device identity.

No new localStorage key, IndexedDB persistence, runtime dependency, custom token, Cloud Run route or billing path is introduced.

## 6. Candidate Rules boundary

`firestore.stage5c.rules` is derived from exact production `firestore.spark.rules` and changes only the explicitly marked candidate session boundary:

`STAGE5C_CANDIDATE_SESSION_FUNCTIONS_BEGIN` / `END` and `STAGE5C_CANDIDATE_SESSION_MATCH_BEGIN` / `END`.

The deterministic contract proves that removing that marked boundary and restoring the production session match yields byte-equivalent production Rules source.

Stage 5C Rules remove all dependence on `request.auth.token.device_id`, `device_credential_version`, `device_key_sha256` and `deviceCredentials`.

Exact session reads require:

1. Firebase authentication;
2. exact opaque capability path possession;
3. an active authenticated account;
4. an active paired rivalry;
5. current membership within the exact two authorized rivalry accounts.

Collection listing remains denied. Capability discovery is impossible through Rules.

Session writes additionally require:

1. root `updatedByAccountId` equals `request.auth.uid`;
2. `updatedByDeviceId` names an active registered device under that authenticated account;
3. the operation-specific open/join/transition lifecycle, membership, timestamp and monotonic revision rules.

This is an honest boundary: a client-supplied device ID cannot cryptographically prove browser possession. A revoked or missing named device denies mutations, while an otherwise entitled account retaining the exact capability may still perform an exact read. The client also rechecks its selected device metadata before every operation.

## 7. Stage 5C evidence

`STAGE5C_ZERO_BILLING_STANDARD_AUTH_SESSION_ADAPTER_PROOF_2026-09-01.md` is the durable candidate proof.

`tests/contracts/stage5c-zero-billing-standard-auth-session-contracts.cjs` proves:

1. standard Firebase UID authority and no custom device claims;
2. no custom token, Cloud Run, billing or persistent cache dependency;
3. no new localStorage or IndexedDB authority;
4. exact capability/no-list/two-account lifecycle;
5. host-open, peer-join, close/revoke/expiry and terminal no-resurrection;
6. missing, third, inactive and revoked-device mutation denial;
7. quota-safe local-first failure;
8. exact candidate/production Rules isolation;
9. fixed RJR delta zero.

`tests/firebase/stage5c-zero-billing-standard-auth-session-emulator.cjs` uses the real Firebase Auth Emulator to issue ordinary email/password test-user tokens solely inside demo project `demo-career-mode-showdown-stage5c`. It verifies those tokens contain no `device_id`, credential version or key claim.

The real Auth-plus-Firestore Emulator proves missing auth, third/wrong account, inactive account, no list/group list, revoked/missing device mutation denial, stale CAS, physical delete denial, close/no resurrection, expiry and loss of exact-get authority for a never-joined peer.

The first emulator run expected a protocol terminal code for that never-joined peer after host-only expiry. Actual Rules correctly returned `permission-denied` because the peer never acquired exact session membership. The fixture was corrected; the boundary was not weakened.

All Stage 5A, Stage 5B and Stage 5C deterministic tests pass. Java-17-compatible Firebase emulator suites pass locally. Exact pinned Firebase CLI 15.28.1 / Java 21 execution remains owned by PR CI.

All 80 repository contract files pass. Two full-suite documentation mismatches were corrected: the old claim-era session recheck regex and a current release-lineage phrase. No runtime defect was hidden.

## 8. Loading visual race hardening

`tests/browser/loading-visual-audit.cjs` now waits for the dynamically loaded `link[data-visual-fidelity="reus-r3"]` stylesheet and a computed `.sheet` rule before asserting `object-fit`. Mobile profiles also wait for the dynamic offline stylesheet.

This changes audit synchronization only. Production HTML, CSS, JavaScript, images, app version and runtime revision remain unchanged.

Five focused post-fix repetitions pass across desktop, windowed desktop, mobile-browser and iOS-standalone profiles. The permanent workflow mirror adds a sixth passing post-fix loading audit.

## 9. Workflow integration

`.github/workflows/validate-stage3-private-pairing.yml` now runs Stage 5A, Stage 5B and Stage 5C deterministic contracts.

Its Java 21 provider step runs:

1. Stage 5A Firestore Emulator;
2. Stage 5B Auth-plus-Firestore Emulator;
3. Stage 5C Auth-plus-Firestore Emulator.

`tests/support/run-contract-suite.cjs` includes Stage 5C.

The local workflow mirror passed 29 permanent executable blocks. It explicitly deferred only the Java 21 Firebase provider block because the local environment exposes Java 17. That is an environment deferral, not a green substitute; exact-head GitHub Actions must pass it.

## 10. Fixed readiness

`REMOTE_JOINING_READINESS.json` remains the sole numeric authority.

Remote Joining readiness remains `87/100` with domain vector `20/20`, `18/20`, `20/20`, `20/30`, `9/10`.

PR #175 source, isolated Rules, deterministic tests, emulators, browser audits, CI, review, documentation, SLE, merge and deployment process add zero RJR points.

RJR can move only when a fixed-domain capability receives genuine required evidence. The next meaningful evidence requires production-live playable session capability, not more candidate process.

## 11. Stage 5B preserved research

PR #174 preserves a non-extractable P-256 IndexedDB key, one-use signed proof, per-sign-in custom-token claims `device_id`, `device_credential_version`, `device_key_sha256`, simultaneous same-UID device isolation and atomic revocation.

Its deterministic contracts, Chromium browser audit and Auth-plus-Firestore emulator remain valid.

Stage 5B remains preserved dormant research and is not the production critical path. Its trusted Cloud Run issuer requires billing, so it must not be resurrected as a prerequisite for the playable free version.

The production critical path remains standard Google Auth plus exact-path Firestore Rules on Spark.

## 12. Production exclusions and permanent locks

`firebase.json` and deployment workflows do not reference `firestore.stage5c.rules`.

`index.html` and production runtime do not load `js/sparkStandardAuthPrivateSession.js`.

PR #175 performs no production Rules, Firebase Auth/provider configuration, App Check enforcement, IAM, billing, runtime, session-data, canonical-storage, Candidate C, Connected Rivalry or protected-rivalry mutation.

Canonical localStorage remains exactly:

1. `careerModeShowdown.saveLibrary`
2. `careerModeShowdown.legacyShowdowns`
3. `careerModeShowdown.preferences`

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive remote-to-local Apply authority with transaction-owned exact rollback.

Exactly two private managers remain mandatory. No collection listing, public lobby, discovery, community, matchmaking, global ranking or leaderboard is permitted.

Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Firestore remains memory-only. App Check enforcement remains OFF. The protected historical rivalry remains untouched.

## 13. WEC evidence and decision

Environment: `we-2026-09-01-stage5c-zero-billing-standard-auth-session-adapter`.

Starting main: `48ceef1e8c9986fdfe346de1a7151a31f314044b`.

The predecessor environment was archived before this WEC began. Its counters and transition decision were not inherited.

Current assessment: `HANDOFF_AT_CHECKPOINT` after one compaction, three major phases, six large evidence events, six bounded tool-routing errors, four corrected failures, zero repeated mistakes, zero stale-fact corrections, zero unresolved failures and zero unrecorded decisions.

The four corrected failures were:

1. the never-joined peer emulator expectation;
2. one omitted explicit App Check enforcement-OFF WEC hazard;
3. one stale claim-era permanent contract regex;
4. one missing current production-lineage phrase in `NEXT_TASK.md`.

Tool-routing errors were rejected before unsafe mutation or corrected through a safer exact route. One generic Git push was safety-rejected before publication because its destination and broad payload were not independently verified. Publication then used the targeted GitHub repository connector only after verifying the exact public repository, live main, explicit 18-file payload and absence of real secrets. One graph patch also expected a multiline edge while the source used a compact one-line edge; it was atomically rejected and corrected against the exact source. No workaround altered scope or destination.

The WEC permits finishing only PR #175's already-bounded publication. It forbids beginning the distinct production Rules milestone in this environment.

## 14. PR #175 completion gates

If PR #175 is open, the closing developer must:

1. fetch exact final head/tree and changed files;
2. require all 14 permanent workflow families on that unchanged head;
3. inspect the Java 21 Stage 5C Auth-plus-Firestore job for the exact PASS and genuine emulator execution;
4. request final-head Codex review;
5. classify every review and thread against source;
6. correct every valid finding and restart exact-head gates;
7. verify zero unresolved threads and clean mergeability;
8. expected-head squash merge under standing authorization;
9. require all 15 normal post-merge workflow families plus Pages;
10. verify live main/tree, public `1.8.1-r5`, deployment byte identity where applicable and unchanged production Rules blob.

Do not infer completion from this handoff or from an earlier head.

## 15. IMMEDIATE NEXT TASK AFTER FULL STUDY

First independently verify and, if necessary, finish PR #175 exactly as section 14 requires.

Then validate/archive the closing WEC and initialize a fresh unique WEC from observed live main with reset counters. Run `npm run work:assess` and obey that successor decision.

Only if the fresh WEC permits product work, begin the distinct minimum production session Rules review/publication from the proven Stage 5C candidate boundary. Nonbilling production activation is already authorized after its required gates. Billing, Blaze, Cloud Run, payment methods and billing-required services remain forbidden.

Keep runtime host/join UX separate after Rules publication. Then prove provider-live two-account host/join, real two-device/two-network behavior, reconnect/token/adverse-network hardening and final stable release acceptance until fixed RJR genuinely reaches 100.

Do not repeat consumed pairing, Candidate C, accepted replay, adverse-provider, token-lifecycle, structural-abuse, rate-limit, rollback, provider-Rules or provider-abuse proof merely for confidence. Do not fabricate production identity, device, network, provider or session evidence.

## 16. Recursive SLE and reporting

The normal owner delivery is a short repository-first next-developer prompt pointing to the current starter. Generate it with `npm run work:next-prompt`. Do not burden the owner with this deep handoff unless recovery or explicit request requires it.

Every substantive owner update uses exactly:

Handoff proximity: X%
Remote Joining readiness: ~Y%
Estimated focused sessions to genuine RJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

At Handoff proximity 100%, complete a root SLE handoff plus byte-identical project mirror, a new versioned starter plus byte-identical mirror, refresh `SESSION_BOOTSTRAP.json` and progressive context, preserve exact live/WEC/security/RJR evidence, run applicable SLE contracts and `npm run work:next-prompt`, make the final WEC seal the last intended branch mutation, provide the short repository-first prompt and stop before the next substantial milestone.

Every successor recursively preserves SLE, WEC, fixed RJR evidence discipline, zero-billing owner authority, standing gated merge/deploy authorization, repository-first prompt delivery and this exact reporting format.
