# CURRENT TASK — SSJR-1.1 PRODUCTION-TWO-ACCOUNT SHARED SETUP EVIDENCE

Work Environment Continuity (WEC) is mandatory for every successor environment.

Owner build-first policy is repository authority at `00_BUILD_FIRST_PRODUCT_POLICY.md`: default focused-session allocation is approximately 75% actual product implementation and 25% validation/maintenance/continuity, with targeted checks during building and the full permanent matrix reserved for publication, release/security boundaries, or demonstrated regressions. This does not weaken any real security, data-integrity or release gate.

Owner Handoff proximity override V2 is `00_HANDOFF_PROXIMITY_STAGE_GATES.md`. Use stage-gated clean-stop readiness rather than the old heuristic. Pending terminal validation is 70%; pending publication CI is 85%; post-publication green is 98%; 99% requires a sealed handoff package with no mutation left; 100% means generate SNS immediately and stop.

Permanent cloud locks are current authority: Billing must never be activated. Firebase remains Spark. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes.

RJR100 remains COMPLETE/FROZEN `100/100`. Historical PR #198 published the fixed RJR-1 `100/100` acceptance after the final stable Remote Joining release acceptance for Remote Joining. The consumed physical proof used a Chromebook on Home WiFi and an iPhone on cellular across two independent networks; it must not be repeated or re-credited absent a proven regression. Its historical validator commands are `npm run validate:rjr-physical` and `npm run test:rjr-physical-preflight`; preserve them for provenance but do not rerun them absent a proven regression.

Historical consumed RJR closeout markers only: Stage 5F accepted production negatives advanced the historical ledger from RJR89 to `91/100`, including revoked-device denial and authenticated unrelated-account denial. Do not repeat generic Connected Rivalry adverse-network proof. Remote Joining-specific two-device/two-network reconnect/adverse-network hardening and final stable Remote Joining release acceptance were subsequently completed and are consumed evidence; they are not current work and must not be reopened absent a proven regression. Evidence/continuity publication only earns zero RJR credit.

SSJR-1.1 remains `0/100` until fixed whole-capability production evidence qualifies. Publication and continuity work earns zero SSJR credit.

PR #207 recorder tooling is published: exact reviewed head `c6bf6b2cb0d492f2da727b8591e8fb7f118e3db6`, tree `eed8b9c21bcb814a36d96ff43af93bf129a3766c`, expected-head merge/main `791b5f9ad48e8d6d5623fd7271300f7266cfae1e`, exact-head 15/15, zero review threads, post-merge 15/15, deployed Stability `34041920689` attempt 2 green on unchanged production bytes. Recorder: `scripts/record-ssjr-shared-setup-production-evidence.mjs`.

PR #205 strict evidence validator remains authority: exact reviewed head `55d1bcb5f88bb8dcd598090acbcee59887932a97`, merge `66abde6d51ade2e8fbe8296ba60ac46e18a2a353`, tree `72c6063793c8e2908f9b7175f57ad15f7b420d27`, exact-head 15/15, five P1 review threads fixed/resolved, post-merge 15/15, Stability `34033617877`. Validator: `scripts/validate-ssjr-shared-setup-production-evidence.mjs`.

Production remains DEPLOYED / PRODUCTION-PROVEN `v1.9.1 / 1.9.1-r3` from PR #203 merge `65d88b1b413501b328bdf722bc6e8a0aa0d46ef2`. Production Shared Setup Rules remain live on Firebase Spark at `cloud.firestore` ruleset `73b4435e-85a8-49f9-92ef-8ffe3ce0f91c`, exact generated-source blob `5bcde9297f6b2927a2184605192ab5b6cd46fb29`.

Current environment: `we-2026-09-06-ssjr-production-shared-setup-a51`
Starting independently verified live main: `1f68dba26006b8215b8e58d4678035be7a506cab`
Closing environment: `we-2026-09-06-ssjr-production-shared-setup-a51`
Final independently verified PR207 main: `791b5f9ad48e8d6d5623fd7271300f7266cfae1e`
Final main tree: `eed8b9c21bcb814a36d96ff43af93bf129a3766c`

Historical compatibility marker only; the line inside this comment is not current execution authority:
<!--
# CURRENT TASK — SSJR-1 AUTHORITATIVE SETUP FOUNDATION
-->

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Validate/archive sealed a51 and initialize a fresh unique successor WEC from live main. Never inherit a51 `HANDOFF_NOW`.
2. Reverify exact deployed r3 byte/runtime identity and production Spark Rules identity without changing provider architecture or billing.
3. Prepare two legitimate private manager accounts and two distinct registered browser identities. Automate every non-private step first; CI must not fabricate account/device/session observations.
4. Prove exact Connected Rivalry pairing + exact ACTIVE precedes every shared league or club action.
5. Prove one authoritative repository-catalog league, two distinct permanent same-league clubs, supported `1/3/5/10` season length, and two role-distinct confirmations converge through exact `SHOWDOWN_CONFIRMED` revision 6.
6. Prove reload/reconnect and a fresh ACTIVE same-rivalry session resume the identical setup without reset/redraw.
7. Prove direct modified-client and adverse attempts fail closed: `wrongSession`, `expiredSession`, `unrelatedAccount`, `revokedIdentity`, `staleRevision`, `replayConflict`, `directFieldSubstitution`, and `coordinatorBypass` must all be denied for both managers.
8. Prove Shared Setup operation itself does not mutate canonical local gameplay save keys.
9. Pipe each private manager observation only through stdin to `npm run record:ssjr-production-shared-setup`. Retain only the privacy-safe recorder outputs; never durably retain raw private authority.
10. Validate the two outputs with `npm run validate:ssjr-production-shared-setup -- <player-one-evidence.json> <player-two-evidence.json>`.
11. Recalculate SSJR only if the fixed production-two-account layer genuinely passes unchanged.

Automation boundary: PR207 already automates privacy-safe hashing, closed-schema/raw-authority rejection, final setup digesting, storage hashing, required negative-state validation, and recorder-to-validator compatibility. PR205 automates pairwise account/device/rivalry/session/convergence/catalog/revision/continuity validation. The only irreducible owner/private boundary is authenticating two legitimate accounts in two registered browsers and observing the real deployed private-session facts.

Authority/handoff iteration rule: run `npm run test:handoff-preflight` before publication-grade full CI when a usable local shell exists. In connector-only environments, inspect the complete failing assertion class and batch coherent changes into one Git tree/commit before the next exact-head fanout.

Publication discipline: every current permanent workflow family green on the same exact reviewed PR head before merge. Do not combine evidence from different heads or rely on a stale family count.

Do not begin transfer/results/scoring transport until this Shared Setup evidence boundary is credited or a concrete blocker is isolated. Once that boundary is accepted, apply the build-first policy and move directly into the next unbuilt product capability instead of extending the proof lane.

The Installable Offline App, v1.3.0 Recovery & Device Resilience baseline, Local Profiles and Save Library remain protected throughout this successor task.

Permanent locks: Billing must never be activated and Firebase remains Spark. App Check enforcement remains OFF. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` with no extra scopes. Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback. Exactly two private managers; no public discovery/listing/lobby/matchmaking/community/rankings/global leaderboards. Never durably retain raw private capabilities or raw account/device/rivalry/session/pairing IDs. Consumed RJR physical acceptance is not repeated or re-credited absent a proven regression.

Estimated focused sessions to genuine SSJR100: ~5–10.
