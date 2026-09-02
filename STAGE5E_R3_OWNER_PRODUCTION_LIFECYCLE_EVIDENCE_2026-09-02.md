# Stage 5E r3 Owner Production Lifecycle Evidence — 2026-09-02

Status: **REMOTE JOINING LIFECYCLE PASS / AUTO-LINK UX PARTIAL FAIL**

This record is intentionally capability-safe. It never records the full private `session_...` capability and truncates rivalry identifiers. The owner screenshots showed the terminal session capability after CLOSE; do not copy that value into repository evidence, future chat, logs, or tests.

## Production boundary

- Repository: `nikahanghojjati-oss/fifa17-career-showdown2`
- Public site: `https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/`
- Live main / PR #183 merge: `4eefed1f855d66c4af8c823291e24344886c617e`
- Application: `v1.9.0`
- Runtime: `1.9.0-r3`
- Pages run: `33672057887` — build/deploy successful for exact merge SHA
- Pages artifact: `9862881955`
- Artifact digest: `sha256:adb6e4e9384f5b2fd9f83865a5aeb8ad28ec01e947a0f28698498243aa1035e1`
- Post-merge integration burn-in: run `33672057860` — both passes successful
- Stability lane: run `33672057917` — stability contracts, Chromium stability, and deployed-site smoke all successful

## Owner-device topology

- Player One: ordinary Chrome on owner Chromebook, authenticated as the Player One account and registered application-device identity.
- Player Two: Chrome Incognito on the same physical Chromebook, authenticated as a distinct Player Two account and registered distinct application-device identity.
- This proves two independent browser/application-device identities. It does **not** substitute for the remaining two-physical-device/two-network hardening requirement.

## Pairing / Connected Rivalry evidence

Current test rivalry observed in screenshots: `pair_516141...d3a07a`.
Prior stale Player One durable rivalry observed before manual correction: `pair_691f64...ae444`.

Observed sequence:

1. Player Two's r3 normal flow did automatically attach the newly completed private pairing into Connected Rivalry without a second code entry. The UI explicitly reported: `Connected Rivalry attached automatically from the completed private pairing. No second code entry was required.`
2. Player One still restored a valid durable pointer from the previous production test (`pair_691f64...`) instead of converging to the newer completed pairing (`pair_516141...`).
3. The owner manually replaced the stale Player One rivalry ID with the current pairing ID and used `VERIFY / REATTACH`.
4. The owner reports also using manual reattach on Player Two to make sure the context was aligned before continuing.
5. Therefore the intended r3 no-manual-reattach acceptance **did not pass**. Do not claim it passed merely because Remote Joining subsequently worked.

## Confirmed root cause in `js/sparkConnectedRivalry.js`

`crInitialize()` resolves a saved durable Connected Rivalry pointer first. The pairing-candidate auto-attach path runs only when no durable pointer was found. Consequently, a valid stale durable pointer A can prevent a newer current provider-active pairing candidate B from being considered at all.

This exactly matches owner evidence:

- stale durable A = prior Player One `pair_691f64...`
- new completed B = current `pair_516141...`
- Player Two with no conflicting durable pointer auto-attached B
- Player One restored A and skipped B until the owner manually corrected it

This is distinct from the earlier r1 bug that scanned only the first manager binding. r2/r3 fixed binding restoration, but r3 still gives any valid saved pointer precedence over a newer exact pairing candidate.

## Genuine provider-live Remote Joining lifecycle — PASS after manual pointer correction

After both browser contexts were aligned to the current rivalry, owner screenshots prove:

1. Player One hosted the exact private session.
2. Player Two joined as the entitled peer.
3. Player Two displayed `ACTIVE · REV 1 · PEER` for the current rivalry and reported that the private session was active with exactly the two paired rivalry accounts; local gameplay remained unchanged.
4. Player One displayed `ACTIVE · REV 1 · HOST` for the same rivalry and could read/refresh the active state.
5. Player Two closed the session and displayed `CLOSED · REV 2 · PEER`.
6. Player One refreshed/read and displayed `CLOSED · REV 2 · HOST`, proving terminal close propagation to the other browser context.

No local gameplay mutation was reported by the runtime during the session lifecycle.

## Evidence classification

- Production Pages r3 deployment: **PASS**
- Two distinct authenticated accounts: **PASS**
- Two distinct registered application-device identities: **PASS**
- Exact private Host → Join → Active Read/Refresh → Close → peer terminal Read/Refresh: **PASS**
- Terminal close propagation: **PASS**
- Local gameplay/canonical save mutation during Remote Joining: **none reported / runtime contract remains false**
- Player Two one-paste pairing → initial Connected Rivalry auto-attach: **PASS**
- Player One automatic convergence from stale prior pointer to new current pairing: **FAIL**
- Entire normal flow requiring no manual Verify/Reattach: **FAIL / PARTIAL**
- Two physical devices / two networks: **NOT PROVEN by this test**

## Required successor correction

The smallest next engineering correction is stale-pointer precedence, not a new pairing/session architecture.

Required selection policy:

1. Preserve an existing durable pointer A while the current pairing candidate B is absent, pending, expired, invalid, unauthorized, wrong-account, wrong-device, or wrong-manager.
2. If B is provider-confirmed `active` and authorizes the exact current account + registered browser/device context + selected manager binding, B must supersede stale A and be persisted through the existing verified Connected Rivalry pointer path.
3. Never delete, edit, force, or destructively test the older provider rivalry merely to switch the browser pointer.
4. No polling, new storage authority, new Rules, new auth, canonical save mutation, or privilege broadening.
5. Preserve the exact one-copy / one-Player-Two-paste four-code equality contract.

Permanent regression matrix required before another owner test:

- stale durable A + current provider-active exact B → initialize automatically converges to B and stores B;
- B pending/unverified/mismatched → preserve A;
- Player One automatically converges to B after Player Two completes pairing without Verify/Reattach;
- Player Two remains on B;
- P1 generated == P1 Connected Rivalry == P2 one pasted value == P2 Connected Rivalry;
- no canonical localStorage mutation, billing, discovery, Candidate C, or session-authority expansion.

After that correction is production-live, the smallest owner acceptance should prove the missed behavior only: fresh pairing → one Player Two paste → Player Two auto-attach → Player One reopen Save Library/Remote Joining → automatic convergence to the same current rivalry with **no Verify/Reattach**. Do not repeat the already-proven full Host/Join/Close lifecycle merely for confidence unless the correction changes session runtime behavior.

## RJR note

The checked-in `REMOTE_JOINING_READINESS.json` remains fixed at `87/100` at this handoff boundary. The owner evidence above materially proves a previously uncredited provider-live actual Remote Joining lifecycle, but the score has not yet been recalculated in this closing environment because the same test also exposed a still-open normal-flow Connected Rivalry automation defect. The fresh successor must perform an evidence-only RJR-1 recalculation before assigning any new points; source, CI, review, merge, deployment, documentation, or handoff work earn zero credit.
