# Successor Handoff — PR #166 Production Rollback / RJR85

SLE = Smart Lean Efficient. This is the complete deep repository handoff for environment `we-2026-08-28-rjr-production-rollback-proof`. Treat it as orientation only; current source, live GitHub/provider/deployment evidence, security/recovery authority and later explicit owner instructions win.

## Executive state

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Application / production runtime: `v1.8.1 / 1.8.1-r5`
PR #166 proof publication main: `32c32afb1365c9ae6120d810a68e5c72c4b8229a`
Known-good rollback target: `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c` — `1.8.1-r4`
Production rollback workflow: `33190961085` — SUCCESS
Proof record: `PRODUCTION_PAGES_ROLLBACK_PROOF_2026-08-28.md`
Fixed Remote Joining readiness: `85/100` under RJR-1
Transition PR: #167
Closing WEC decision: `HANDOFF_AT_CHECKPOINT`
Handoff proximity at complete package: `100%`

## What this environment completed

The successor independently verified live main `9c086f5548de4e65a9d2bb6645d01e10da7facf6`, predecessor publication state and fixed RJR84, then initialized a fresh WEC instead of inheriting the predecessor's transition decision. It determined that strengthened Firestore Rules provider publication could not be truthfully proven from available credentials/evidence and did not fabricate provider state.

The next distinct repository-executable uncredited capability was production rollback proof. PR #166 added a bounded one-shot serialized GitHub Pages drill. Its implementation does not rewrite Git history and does not touch Firebase Rules, provider IAM, billing, App Check enforcement, Auth scopes/persistence, canonical data or the protected historical rivalry.

The known-good rollback candidate was pinned to PR #160 merge `2964527c4f7fc80b16d6d5ce73bd4f5823487d2c`, production runtime `1.8.1-r4`. Current production remains `1.8.1-r5`.

## PR #166 publication and production proof

PR #166 exact review head passed the repository publication gate with no observed failures/cancellations and no review comments/inline findings before squash merge. It merged as `32c32afb1365c9ae6120d810a68e5c72c4b8229a`.

Dedicated workflow run `33190961085` then completed successfully:

1. built exact r4 rollback and exact r5 restore artifacts before production mutation;
2. deployed r4 through the existing serialized `pages-production` environment;
3. passed `Verify r4 is actually live in production`, requiring both r4 HTML asset identity and r4 production runtime identity from the public site;
4. ran the restore job after successful artifact construction under a fail-safe `always()` boundary;
5. deployed exact r5 restore artifact;
6. passed `Verify r5 is restored live in production`, requiring both r5 public identities;
7. passed `Require both rollback and restoration proof` in the final seal job.

Production is therefore safely restored to `v1.8.1 / 1.8.1-r5`, with a real production rollback-and-exact-restoration path independently proven.

The one-shot path must not be rerun merely for confidence. The trigger remains unchanged so ordinary later pushes do not re-execute the destructive production drill.

## RJR truth

Fixed RJR-1 is `85/100`.

The prior authority explicitly listed production rollback proof as uncredited in the fixed 10-point hardening/release domain. The two preceding distinct capabilities moved that domain through structural abuse resistance 82 → 83 and sustained mutation-frequency resistance 83 → 84. The new production rollback/restoration proof closes exactly the next distinct capability, moving hardening/release 7/10 → 8/10 and total `84 → 85`.

No duplicate point is awarded for workflow implementation, PR #166, CI volume, merge, restoration mechanics, documentation, provider publication or SLE packaging.

Still uncredited: legitimate authenticated third-account/revoked registered-device production negatives; two-physical-network behavior; Remote Joining-specific real-device token-lifecycle acceptance; production provider abuse acceptance; actual Stage 5 Remote Joining sessions; final stable Remote Joining release acceptance.

## Provider boundary and strict nonclaims

Repository and emulator evidence prove strengthened Rules source semantics, but current production-provider publication of the strengthened `firestore.spark.rules` remains independently unverified. GitHub Pages proves website bytes only. Do not claim provider-live Rules from this handoff.

The rollback proof is not production abuse acceptance, not an authorization-negative test, not two-network evidence, not new real-device token-lifecycle acceptance and not Stage 5 Remote Joining proof.

## Consumed proof — do not repeat

Do not repeat completed owner pairing/device proof, r3 account recovery, unavailable-code proof, destructive Candidate C reconciliation, exact accepted-result replay, deterministic adverse-provider safety, deterministic App Check token-lifecycle safety, structural abuse, sustained mutation-frequency proof or the new production rollback drill merely for confidence or CI volume. Do not manufacture provider/authenticated identity/device/network state. Historical rivalry `pair_a07108...756fb` must not be forced, edited or deleted.

## Permanent product/security/recovery locks

Exactly two private managers. Canonical browser storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, and `careerModeShowdown.preferences`; `activeShowdown` remains non-canonical.

Candidate A remains non-mutating export. Candidate B remains read-only analysis. Candidate C remains the sole destructive remote-to-local Apply authority with backup-before-Apply, immutable intent, strict exact raw snapshot authority, stale/anti-clobber rejection, transaction-owned mutation/rollback and exact recovery verification.

Firebase remains Spark / zero billing. Firestore persistent cache remains disabled / memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. App Check enforcement remains OFF. Trusted-runtime IAM remains reviewed but unactivated/unbroadened. Public discovery/community/matchmaking/global rankings remain prohibited.

The Installable Offline App remains the local-first startup/recovery baseline. The completed v1.3 recovery hardening and Local Profiles / Save Library chain remain protected. Stage 5 host/join/session orchestration remains locked until explicit remaining preconditions genuinely close.

## WEC closure

Environment `we-2026-08-28-rjr-production-rollback-proof` began from independently verified main `9c086f5548de4e65a9d2bb6645d01e10da7facf6`, completed one bounded production capability, returned production to a coherent exact r5 state and has no atomic mutation in progress. Context/project complexity is high/very-high and the next substantive RJR dependency is a separate investigation requiring fresh evidence. Its own deterministic transition is therefore `HANDOFF_AT_CHECKPOINT` once PR #167 is sealed.

Usage remains unavailable and is not estimated. The successor must not inherit this WEC decision. Validate/archive it, create a fresh unique WEC with reset counters and independently observed main, assess it, and obey its own result. Handoff proximity may restart lower by design; RJR85 does not reset.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

Closing environment: finish only PR #167. Ensure the exact unchanged PR head passes all mandatory workflow families and review gates; merge under standing owner authorization only if no stop condition exists; verify the new live main and transition publication; verify production still exposes `1.8.1-r5`; then stop at Handoff proximity 100 before another substantial milestone.

Fresh successor: independently verify current main, PR #167 post-merge state, production runtime/deployment/provider truth, rollback run `33190961085`, RJR85 authority, `NEXT_TASK.md`, `PROJECT_STATE.md`, `SESSION_BOOTSTRAP.json` and closing WEC. Initialize a fresh WEC. Only if that assessment permits continuation, select the smallest genuinely unblocked remaining RJR dependency. Live evidence should decide between provider-live authorization/Rules proof, legitimate production identity/device authorization negatives, two-network acceptance or remaining real-device/release hardening. Do not insert generic prerequisite work or enter Stage 5 early.

## Standing publication authority

Standing owner merge/deploy authorization remains active through project completion after all required tests and publication gates pass. Do not repeatedly ask for approval. Later explicit owner instructions may narrow or override it.

## Required owner-facing checkpoint format

Handoff proximity: X%
Remote Joining readiness: ~Y%
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: ...

Handoff proximity is evidence-based environment transition readiness, not task completion or RJR. Never invent hidden usage. At 100%, create the complete SLE package and stop before another substantial milestone. WEC transition decisions override weaker handoff proximity.

## Mandatory repository-first next-developer prompt standard

This handoff recursively preserves the mandatory repository-first prompt rule. Every future closer must refresh the newest versioned starter, deep mirrored handoff, bootstrap capsule and WEC, run `npm run work:next-prompt`, then give the owner one short fresh repository-first prompt rather than burdening them with the full handoff by default.

Current compact starter: `START_NEXT_SESSION_V1.4.26_PR166_PRODUCTION_ROLLBACK_RJR85_TRANSITION.md`.

Ready-to-paste prompt:

Open the live repository `nikahanghojjati-oss/fifa17-career-showdown2` and read `START_NEXT_SESSION_V1.4.26_PR166_PRODUCTION_ROLLBACK_RJR85_TRANSITION.md` first. Follow its SLE/deep references as needed. Independently verify current live `main`, PR #167 post-merge/publication state, production/runtime/deployment/provider state, rollback proof run `33190961085`, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `PROJECT_STATE.md`, `SESSION_BOOTSTRAP.json`, and the closing WEC. Treat all handoff material as orientation only; current source and live GitHub/provider/deployment evidence win. Validate/archive predecessor WEC `we-2026-08-28-rjr-production-rollback-proof`, initialize a fresh unique WEC with reset counters and independently observed live-main SHA, and execute `IMMEDIATE NEXT TASK AFTER FULL STUDY`. Fixed RJR-1 is 85/100 after exact production r5 → known-good r4 → exact r5 rollback/restoration proof; do not repeat consumed proof, do not claim strengthened Firestore Rules are provider-live without provider evidence, and keep Stage 5 locked until its explicit preconditions genuinely close.
