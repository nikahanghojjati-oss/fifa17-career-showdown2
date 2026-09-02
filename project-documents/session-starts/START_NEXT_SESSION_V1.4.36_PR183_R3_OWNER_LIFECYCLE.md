# START NEXT SESSION V1.4.36 — PR #183 R3 OWNER LIFECYCLE PROVEN / AUTO-LINK CORRECTION NEXT

SLE = Smart Lean Efficient. Treat this starter and every handoff artifact as orientation only. Current source, live GitHub/provider/deployment evidence, security/recovery authority, the successor's own fresh WEC and later owner instructions always win.

## Repository-first startup

Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
Recorded live main: `4eefed1f855d66c4af8c823291e24344886c617e`
Merged PR: `#183` — `Harden one-copy private pairing and Stage 5E owner flow`
Application/runtime: `v1.9.0 / 1.9.0-r3`
Pages run: `33672057887`
Pages artifact: `9862881955`
Artifact digest: `sha256:adb6e4e9384f5b2fd9f83865a5aeb8ad28ec01e947a0f28698498243aa1035e1`
Recorded RJR-1: `87/100` pending fresh evidence-only recalculation of the owner lifecycle proof below.

First use connected GitHub to independently verify live `main`, PR #183 closure, post-merge workflow state, Pages/deployed runtime identity, `REMOTE_JOINING_READINESS.json`, `NEXT_TASK.md`, `SESSION_BOOTSTRAP.json`, this starter, the deep SLE handoff and closing WEC. Do not inherit the predecessor's final HANDOFF decision.

Then initialize a fresh unique WEC from the verified live main with reset counters and obey its independent assessment.

## What the owner just proved in real production

Read `STAGE5E_R3_OWNER_PRODUCTION_LIFECYCLE_EVIDENCE_2026-09-02.md` before changing code.

On production r3, using two distinct authenticated accounts and two distinct registered application-browser identities (ordinary Chrome Player One + Chrome Incognito Player Two on one Chromebook), the owner completed the actual exact private Remote Joining lifecycle after manually correcting Connected Rivalry pointers:

`Player One Host → Player Two Join → ACTIVE rev 1 → Player One Read/Refresh ACTIVE → Player Two Close → Player One Read/Refresh CLOSED rev 2`

The screenshots prove both HOST and PEER terminal `CLOSED · REV 2` state for the same current rivalry. Never copy or persist the full `session_...` capability visible in those screenshots. It is terminally closed but remains sensitive evidence material.

This is genuine provider-live Remote Joining capability evidence and was previously uncredited. However, do not invent an RJR delta. Recalculate RJR-1 only from the fixed domain model and explicitly separate the lifecycle capability from the still-open auto-link defect.

## Owner-discovered r3 defect — exact root cause already confirmed

The intended one-copy/one-paste QoL flow did not fully pass.

Current pairing: truncated `pair_516141...d3a07a`.
Prior stale Player One durable pointer: truncated `pair_691f64...ae444`.

Player Two initially auto-attached the new current rivalry with no second code entry, but Player One restored the older valid durable rivalry from the previous test. The owner had to manually replace the rivalry ID and use `VERIFY / REATTACH`; the owner reports manually reattaching Player Two as well before the successful session lifecycle.

Source-root cause in `js/sparkConnectedRivalry.js` is established:

1. `crInitialize()` resolves/restores an existing durable Connected Rivalry pointer first.
2. It considers the current pairing candidate only inside the no-pointer path.
3. Therefore a valid stale durable pointer A prevents a newer provider-active exact pairing candidate B from being considered.

This is not the old r1 first-manager-binding bug. r2/r3 correctly restore pointers across bindings; the remaining defect is **stale durable pointer precedence over a newer exact completed pairing**.

## IMMEDIATE NEXT TASK AFTER FULL STUDY

1. Independently verify the live r3 boundary and archive/accept this predecessor WEC only as historical closure.
2. Perform a conservative RJR-1 evidence recalculation for the new real Host/Join/Refresh/Close production lifecycle. Do not award points for PRs, CI, deployment, documentation or handoff work; do not credit the failed no-manual-reattach behavior.
3. Implement the smallest stale-pointer precedence repair in Connected Rivalry only:
   - existing durable A remains authoritative if B is absent, pending, invalid, expired or mismatched;
   - provider-confirmed ACTIVE B may supersede A only when B authorizes the exact current account, registered device context and selected manager binding;
   - persist B through the existing verified Connected Rivalry pointer path;
   - never delete or destructively mutate old provider rivalry A.
4. Add permanent regression proof:
   - stale A + provider-active exact B → automatic convergence to B;
   - pending/unverified/mismatched B → preserve A;
   - Player One automatically converges after Player Two completes pairing without `VERIFY / REATTACH`;
   - Player Two remains on B;
   - exact four-code equality and exactly one Player Two paste remain intact;
   - no canonical localStorage, billing, discovery, Candidate C or session-authority change.
5. Run targeted deterministic/browser proof, complete repository contracts, all applicable permanent exact-head CI/review gates, merge under standing nonbilling authorization and independently verify exact deployed bytes.
6. Only then ask the owner for the smallest missing production acceptance: fresh pairing → one Player Two paste → Player Two automatic Connected Rivalry attachment → Player One reopens Save Library or Remote Joining and automatically converges to the same current rivalry **without any manual Verify/Reattach**.
7. Do not repeat the already-proven Host/Join/Close lifecycle merely for confidence unless the correction changes session-runtime behavior or new evidence is genuinely required.
8. Continue dependency-gated work toward genuine RJR 100 after the bounded correction/evidence recalculation.

## Permanent locks

- Billing is permanently forbidden. Firebase stays Spark. Never link Cloud Billing, enable Blaze, add a payment method, Cloud Run, Cloud Functions or any billing-required service.
- Firestore browser persistence remains memory-only.
- App Check enforcement remains OFF.
- Exactly two private managers; no public discovery, session listing, lobby, matchmaking, community or rankings.
- Canonical localStorage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`.
- Remote Joining session operations must not mutate canonical local saves.
- Candidate C remains the sole destructive remote-to-local gameplay Apply authority.
- Do not edit, force, delete or destructively test the protected historical rivalry.
- Provider/quota failure must fail closed while local Career Mode remains playable.
- Do not expose full pairing/session capabilities in chat, logs, repository evidence or screenshots.

## Current evidence status

DONE / PROVEN:
- PR #183 merged and r3 production Pages deployment successful.
- All 14 pre-merge exact-head workflow families green with zero unresolved review threads.
- Post-merge integration burn-in both passes green.
- Post-merge Stability contracts, Chromium stability and deployed-site smoke green.
- P2 initial one-paste → Connected Rivalry auto-attach observed in production.
- Genuine provider-live two-account Host/Join/Active Refresh/Close/terminal peer Refresh lifecycle observed in production after manual pointer correction.

OPEN:
- automatic stale-pointer replacement/convergence for Player One after a newer exact completed pairing;
- normal flow with zero manual Verify/Reattach;
- RJR-1 recalculation for newly proven actual Remote Joining lifecycle;
- remaining Remote Joining negative authorization / two-physical-device/two-network / stable-release evidence according to the fixed ledger.

## Recursive SLE rule

At any future handoff boundary, preserve `00_SLE_HANDOFF_PROTOCOL.md`: newest versioned START NEXT SESSION, current `SESSION_BOOTSTRAP.json`, complete mirrored SLE handoff, live/WEC/RJR pointers and a fresh short repository-first next-developer prompt. The successor must initialize a fresh WEC and must never inherit this predecessor environment's `HANDOFF_AT_CHECKPOINT` as its own starting decision.
