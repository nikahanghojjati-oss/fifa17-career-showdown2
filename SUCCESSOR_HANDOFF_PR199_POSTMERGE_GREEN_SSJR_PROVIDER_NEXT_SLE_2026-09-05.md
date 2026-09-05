# Successor handoff — PR199 post-merge green → SSJR Shared Remote Setup provider enforcement

SLE = Smart Lean Efficient. This document is orientation and evidence context only. Current verified source, live GitHub/provider/deployment state, and later owner instructions override it.

## 1. Executive checkpoint

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`

RJR-1 is COMPLETE/FROZEN at 100/100. The new fixed model is SSJR-1.1, total 100. Current genuine Shared Showdown Journey readiness remains 0/100 because PR #199 publishes only a dormant/provider-neutral setup candidate and evidence model. No production Shared Setup transport or UI is credited yet.

Production runtime remains previously proven `v1.9.1 / 1.9.1-r2`; previous known-good whole-shell recovery remains `1.9.1-r1`. PR #199 is non-runtime and did not activate Firestore Rules or billing.

## 2. Recovered interruption and completed publication

The previous Work environment reached a usage limit while resealing a valid review correction. Recovery independently found PR #199 open on `ssjr/authoritative-setup-foundation-2026-09-05` and completed the publication instead of guessing from stale handoff text.

PR #199 final exact reviewed head: `378931e7bec2a4e95fb31912d4879e294b63d79f`.
Final exact-head permanent PR workflow families: 15/15 successful.
Valid review P1: client-selectable draw outcomes through repeated prepare calls or direct construction of another schema-valid favorable league/club outcome.
Correction: deterministic provider-bound draw derived from paired-rivalry binding + catalog, `apply()` re-derives the expected outcome, alternate valid outcomes fail with `SETUP_DRAW_MISMATCH`.
Automated regression expansion: Node contract proof plus two isolated Chromium contexts using real WebCrypto; repeated prepare calls cannot redraw; alternate valid league and club pair are rejected; dual confirmation converges; canonical local bytes remain unchanged.
Review thread: resolved after exact-head evidence.
Merge: expected-head protected squash.
Main after merge: `780abd7b779cda5acd722b75fd59ef1e82c71f97`.
Post-merge permanent push workflow families: 15/15 successful. `Validate Release Integration Burn-In` run `33996909745` completed success; it was the last observed post-merge workflow to finish.

Do not repeat this PR199 publication proof unless later live evidence establishes a regression. It earns zero SSJR points.

## 3. SSJR-1.1 scoring discipline

SSJR-1.1 is fixed at 100 points. Current score is 0/100. The model explicitly uses evidence-backed whole-capability credit; source code, tests, PRs, CI, review, merge, deployment mechanics, WEC, SLE/SNS and documentation do not automatically earn readiness points.

The paired-first correction is a dependency gate, not readiness credit. Missing proof that exact Connected Rivalry pairing and ACTIVE session precede league/club selection blocks dependent credit. A proven ordering regression removes all dependent downstream credit. Keep the original baseline comparable at 0/100.

Current forecast is approximately 8–14 focused sessions to genuine SSJR100. This estimate is milestone-based rather than score arithmetic. Re-estimate only when concrete implementation/evidence materially changes the remaining dependency graph.

## 4. Locked product journey

Supported order:

1. Profiles and a pre-draw Save shell exist without requiring league/club selection.
2. Two private managers pair to the exact Connected Rivalry.
3. An ACTIVE session exists for that rivalry.
4. Exactly one authoritative League Wheel outcome is committed.
5. Two distinct permanent clubs from that same league are committed.
6. Season length is one of 1/3/5/10.
7. Both managers confirm identical setup content.
8. Each manager plays local FIFA17 careers; the web app does not stream or control the FIFA17 match engine.
9. Shared transfer challenges and per-manager results converge.
10. Canonical scoring/history/progression advances across seasons.
11. Final reconciliation closes the showdown without resurrection.

A fresh ACTIVE session for the same rivalry must resume the existing competition and must not reset setup. Pairing and ACTIVE session must be enforced before league/club selection in provider authority and final UI.

## 5. Immediate next substantive milestone

After independently verifying live main and initializing a fresh WEC, implement the smallest Spark-compatible exact-path Shared Remote Setup provider transaction adapter plus candidate Firestore Rules and emulator tests.

Provider requirements:

* derive authenticated account, registered device, exact rivalry binding, manager slot, and ACTIVE session from protected provider records inside the same transaction/read-write authority boundary;
* never trust caller-supplied role, account/device/rivalry/session binding, client-computed hashes, or arbitrary client-prepared league/club outcomes as authorization;
* exactly two private managers only;
* preserve immutable revision/CAS and idempotency semantics;
* replay an accepted operation without advancing revision; conflicting replay must fail;
* fresh same-rivalry ACTIVE session resumes the same setup;
* deterministic non-redrawable league and club selection must survive modified clients;
* both managers must independently confirm identical setup content;
* provider adapter must not mutate canonical local gameplay save bytes;
* no raw private capability or raw authority identifiers may be retained in durable gameplay state.

Automate before owner action. At minimum add emulator/contract negatives for unpaired account, unrelated authenticated third account, revoked/inactive device, inactive/deletion-requested manager, wrong rivalry, wrong session, expired/inactive session, stale base revision, idempotency conflict, repeated prepare non-redrawability, arbitrary valid alternate league, arbitrary valid alternate club pair, same-club invalid pair, cross-league invalid club, malformed extra fields, and forbidden direct writes that bypass the transaction contract.

Only after exact-path provider persistence and Rules are proven should the next milestone activate the paired-first Shared Setup UI/production path. Do not jump straight to season-play transport or scoring while setup authority is unproven.

## 6. Current security and infrastructure locks

Billing is permanently forbidden. Firebase must remain Spark. Never link Cloud Billing, enable Blaze, add a payment method, purchase credits, invoke Cloud Run, deploy Cloud Functions, or use another billing-required service.

App Check enforcement remains OFF unless later explicit owner direction changes it after zero-billing proof. Firestore browser persistence remains memory-only. Google Auth remains popup-only `browserSessionPersistence` and must not request extra scopes.

Exactly two private managers. No public discovery, listings, public lobbies, matchmaking, community features, global leaderboards or rankings.

Canonical localStorage is exactly:
`careerModeShowdown.saveLibrary`
`careerModeShowdown.legacyShowdowns`
`careerModeShowdown.preferences`

Candidate A remains non-mutating. Candidate B remains read-only. Candidate C remains the sole destructive remote-to-local gameplay Apply authority with transaction-owned strict exact raw-snapshot rollback. Do not weaken this while adding Shared Setup.

Never destructively test the protected historical rivalry. Never request, quote, log, paste or durably retain full private session capabilities or raw account/device/rivalry/session IDs.

## 7. Work Environment Continuity / SLE

The closing setup-foundation WEC was `we-2026-09-05-ssjr-setup-foundation-28cf84`. It had already reached a transition decision before the final PR199 publication gate. A fresh successor must validate the inherited record, preserve its final facts, initialize a new unique WEC with current live main as `startingMainSha`, reset per-environment counters, run the repository assessment, and obey its own decision. Never inherit HANDOFF_NOW from the predecessor as the new environment decision.

At every future Handoff proximity 100%, HANDOFF_AT_CHECKPOINT, HANDOFF_NOW or equivalent final transition: create the full root SLE handoff and byte-identical project mirror, create a new versioned START_NEXT_SESSION and byte-identical project mirror, refresh current bootstrap/pointers, archive/finalize the WEC, preserve exact next task/security/readiness evidence, run applicable SLE/publication checks, and stop before a new substantial milestone.

The compact successor entrypoint for this checkpoint is `START_NEXT_SESSION_V1.4.47_PR199_POSTMERGE_GREEN_SSJR_PROVIDER_NEXT.md`.

## 8. Mandatory reporting format for all future project sessions

Use this exact eight-line block at every substantive checkpoint and explain the concrete relationship to genuine SSJR100:

```text
Handoff proximity: X%
Shared Showdown Journey readiness: Y/100
Estimated focused sessions to genuine SSJR100: ~N–M
Current lane: ...
Concrete dependency completed: ...
Next unlock: ...
Blocker: ...
Sidequest check: NONE
```

Do not silently rename `Estimated focused sessions to genuine SSJR100`. Never replace it with RJR wording. If a step only removes a dependency but satisfies no fixed SSJR evidence contract, say so and keep the score unchanged.

## 9. What not to redo

Do not redo accepted RJR100 two-device/two-network physical acceptance. Do not redo PR199 exact-head publication merely for comfort. Do not re-award readiness for the same evidence. Do not broaden provider setup into public systems. Do not activate billing. Do not start visual/menu sidequests while provider setup is the current dependency.

## 10. Successor first actions

1. Use connected GitHub first and verify live `main`, open PRs/branches, latest permanent workflow states and current authority files.
2. Confirm PR #199 is merged at `780abd7b779cda5acd722b75fd59ef1e82c71f97` or identify any later superseding main.
3. Read `SHARED_SHOWDOWN_JOURNEY_MODEL.json` and `SHARED_SHOWDOWN_JOURNEY_READINESS.json`; do not infer score from this handoff.
4. Validate/replace inherited WEC with a fresh unique record.
5. Inspect `SHARED_REMOTE_SETUP_DECISION.json`, `SHARED_REMOTE_SETUP_PROVIDER_SEAM.json`, `firestore.rules`, the existing Connected Rivalry/session provider code, and emulator/test harness before designing writes.
6. Implement the bounded provider transaction + candidate Rules + automated emulator negatives.
7. Run the complete required test/workflow set, exact-head review and expected-head publication gates.
8. Recalculate SSJR only from its fixed evidence contract. Continue relentlessly toward the next genuine capability dependency.

Current clean boundary at handoff creation:

Handoff proximity: 100%
Shared Showdown Journey readiness: 0/100
Estimated focused sessions to genuine SSJR100: ~8–14
Current lane: PR199 corrected foundation publication complete; transition to exact-path Shared Remote Setup provider enforcement
Concrete dependency completed: Corrected provider-neutral Shared Setup candidate is exact-head reviewed, 15/15 PR green, expected-head merged, and 15/15 post-merge green
Next unlock: Fresh-WEC Spark-compatible Shared Remote Setup transaction adapter, candidate Firestore Rules, and modified-client emulator negatives
Blocker: Mandatory clean environment transition before the next substantial provider milestone
Sidequest check: NONE
