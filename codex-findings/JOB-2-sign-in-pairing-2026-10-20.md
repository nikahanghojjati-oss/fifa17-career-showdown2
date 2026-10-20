# JOB-2 — sign-in, sign-out and pairing

## Summary

Audited `main` at `9230e33455eae93040317e7553131be34c20da9b`, release **1.9.5-r81**, on 2026-10-20. **Four new P2 findings; no substantiated new P1/P3 findings.** Ordinary two-manager play only; no tampering scenarios. No app code, repository tests, accounts, Rules or deployments changed.

There was no `codex-findings/` folder on this main. Also fetched and read the reports in open PRs #960 (JOB-1), #959 (JOB-A) and #958 (JOB-B). Their session-offer/reconnect stalls, backwards stage restoration, signing drafts, completed-reader failures and career-screen loading/identity notifications are excluded. Started with **Settings/account controls and test-run entry**, rather than JOB-1's second-device/session-offer entry.

Evidence combines source tracing, isolated Chromium using the unchanged identity/modes UI, and deterministic probes against unchanged modules with repository fixture/provider doubles. The JOIN lifetime probe connects the actual persistent START implementation to the actual private-pairing writer. Clock advancement and mailbox delivery are controlled locally; no literal 15/30-minute production wait or real Google popup is claimed. No physical two-device acceptance evidence is claimed.

## Findings

### F1 — P2: a real-career account has no visible sign-out or switch-account action

**Player steps**

1. On Nik's browser, accidentally choose Daniel's already-real Google account in the popup, or open a browser session already signed into that account.
2. The app restores Daniel's identity or offers the manager choice. Try to correct the Google account through the name chip or Settings.
3. Settings shows the manager/device and real-career pairing actions, but neither the signed-in Google identity nor SIGN OUT / SWITCH ACCOUNT. Opening the ready identity gate immediately closes it. Nik cannot select his own Google account through the app; reloading preserves the same session. Closing the browser session or using a different browser is an external workaround.

**Cause / file:line:** `js/onlinePlayerIdentity.js:54` injects `display:none!important` for `#sparkConnectedAccountPanel`, which owns the existing SIGN OUT button (`js/sparkConnectedAccount.js:242`). The replacement product Settings at `js/onlinePlayerIdentity.js:78` shows only PLAYER/DEVICE and has no signed-in auth action. The badge opens Settings when ready (`js/onlinePlayerIdentity.js:76`), while `js/onlinePlayerIdentity.js:75` closes a ready sign-in gate. `js/showdownModes.js:91` supplies pairing actions in real mode; FORGET THIS DEVICE is confined to test mode at `js/showdownModes.js:99`. UNPAIR changes the partner record, not the authenticated account (`js/persistentNikDanielPair.js:432`).

**Reproduction:** isolated Chromium, actual identity and modes modules, provider fixture for a signed-in real account: visible account-panel buttons were exactly `["UNPAIR"]`; no Google account identity appeared; opening the gate created no dialog. The underlying sign-out API exists but is unreachable from this product surface. This is separate from JOB-B's missing career-screen identity notifications.

**Suggested fix:** show the current Google account and an ordinary SIGN OUT / SWITCH GOOGLE ACCOUNT action in the product account panel and manager-choice gate. Sign out without unpairing, revoking the browser or deleting saves. On completion, invalidate the identity/session view and offer the existing popup flow. Preserve popup-only session persistence and the intentional removal of FORGET THIS DEVICE from real careers.

### F2 — P2: Daniel's JOIN note expires after 15 minutes, halfway through the specified 30-minute window

**Player steps**

1. With the permanent real pairing established and no live Showdown, Daniel chooses seasons and presses START.
2. Nik opens Home 16–29 minutes later, expecting the promised 30-minute JOIN opportunity.
3. Home has no valid JOIN note and falls back to WAITING FOR DANIEL / PASTE A CODE. Pasting the original code cannot recover it: the invite expired at the same 15-minute boundary. Daniel must make another code.

**Cause / file:line:** `js/sparkPrivatePairing.js:16` sets the default pairing TTL to 15 minutes; `js/sparkPrivatePairing.js:283` uses it when `ttlMs` is omitted. The production call in `js/persistentNikDanielPair.js:259` omits `ttlMs`. The note writer copies `result.expiresAtEpochMs` unchanged (`js/persistentNikDanielPair.js:259`, `js/persistentNikDanielPair.js:366`). `js/persistentNikDanielPair.js:406` correctly hides that expired note; `js/onlinePlayerIdentity.js:51` consequently renders WAITING. This is a lifetime mismatch with this job's explicit 30-minute product requirement, not a complaint about rejecting an actually expired capability.

**Reproduction:** actual persistent `startPairing()` plus actual `sparkPrivatePairing.createPairing()`, fixture Firestore transactions and mutual partner records: both stored invite and Nik's mailbox note had **900,000 ms** lifetime, with identical expiry. The provider supports a 30-minute maximum (`js/sparkPrivatePairing.js:17`, `js/sparkPrivatePairing.js:284`). Existing permanent-pair tests supply their own expiry through a stub creator, so they verify copying without catching the production default.

**Suggested fix:** explicitly request the intended lifetime for permanent-pair START and keep the note and redeemable invite synchronized. Account for the deployed Rules' server-time boundary/clock margin when choosing the exact value. Add coverage connecting this caller to the actual writer and checking availability inside the intended window. Extending just the note would advertise an unjoinable game.

### F3 — P2: after a displayed note expires, Nik's open Home stops discovering replacement JOIN notes

**Player steps**

1. Nik opens Home; Daniel presses START. Nik receives JOIN but does not tap it.
2. Leave Nik's Home visible until that note expires (currently 15 minutes; F2's correction would move this to 30).
3. On Daniel's waiting screen, press NEW CODE after expiry, creating a fresh note for the same permanent partner.
4. Nik's unchanged Home keeps WAITING FOR DANIEL. The new JOIN does not appear by itself. Tapping the tile, revisiting Home or changing tab visibility can recover it.

**Cause / file:line:** note delivery detaches the listener as soon as a valid note appears: `js/persistentNikDanielPair.js:391` calls the stop path because `pairJoinNoteWatchWanted()` at `js/persistentNikDanielPair.js:383` returns false when a note exists. The expiry timer at `js/persistentNikDanielPair.js:368` only calls `pairNotifyPartner()`. That publisher (`js/persistentNikDanielPair.js:303`) renders/notifies; its identity listener at `js/onlinePlayerIdentity.js:116` only redraws Home. Nothing starts another watch/read. Watch entry points are Home/tab return (`js/onlinePlayerIdentity.js:115`) or an explicit tap (`js/onlinePlayerIdentity.js:98`), not note expiry. Daniel's new mailbox write cannot notify a detached listener.

**Reproduction:** unchanged persistent-pair module with an actual `onSnapshot` interface double: deliver an empty server snapshot, then Daniel's valid note. Observed one attach and one detach. Advance beyond expiry, run its timer, and supply the replacement mailbox document: watch mode remained `null` and visible note remained `null`. A subsequent explicit fresh read immediately returned the replacement note. This is the Home mailbox lifecycle, separate from JOB-1's private-session offer polling deadline. It does not require an outage or an exhausted initial Home-watch timer.

**Suggested fix:** when a displayed note expires and Nik is still eligible on visible Home, transition back into a bounded mailbox watch. Keep a lightweight invalidation/read alternative if the normal watch budget has elapsed, or clearly expose an explicit retry state. Do not leave WAITING promising automatic discovery with no discovery mechanism. Cover note delivery → detach → expiry → replacement without navigation.

### F4 — P2: an old test-mode tab can continue a real Showdown while labelling it “TEST RUN · NOTHING COUNTS”

**Player steps**

1. Before the first real career, keep Daniel's browser A open after it resolved “no marker / no partner record”; Settings offers START TEST RUN.
2. In browser B, using the same Google account, start the first real career and complete the real pairing with Nik. A real Showdown is now ACTIVE.
3. In browser A, use its still-offered Settings > START TEST RUN. Its fresh pair-link check finds the real active Showdown and continues it instead of creating a test game.
4. The test launch disarms, but browser A still says TEST RUN · NOTHING COUNTS on that real game's badge and reports test mode in Settings. The game counts. A normal `resolve()` on A retains the stale classification; reloading the page recovers it.

**Cause / file:line:** `js/showdownModes.js:62` indefinitely reuses a settled `none` for that account. `smResolve()` (`js/showdownModes.js:68`) has no freshness option; the permanent partner reader likewise memoizes an absent record for the page (`js/persistentNikDanielPair.js:308`). `smStartTestRun()` (`js/showdownModes.js:137`) trusts this view. The canonical START follows an ACTIVE continuation before `beforeCreate` (`js/productionSharedJourneyEntry.js:290`, `js/productionSharedJourneyEntry.js:293`), so the fresh marker safeguard in `js/showdownModes.js:174` never runs. Disarming at `js/showdownModes.js:149` does not repair the mode: `smTestRunShown()` at `js/showdownModes.js:46` still labels a live Showdown when the cached mode is test. The badge consumes that result (`js/onlinePlayerIdentity.js:76`).

**Reproduction:** unchanged modes module and its repository DOM harness, with the neighboring START continuing to dashboard as the real entry code does: first resolve `none`, then make the provider marker `ready` and the pair ACTIVE, then call `startTestRun()`. Result: `armed:false`, `mode:"test"`, badge ` · TEST RUN · NOTHING COUNTS`, **zero fresh marker reads**. Calling `resolve()` again still performed zero marker reads. This is a label/launch-intent defect; no duplicate Showdown or changed counting data was demonstrated. JOB-B's career-screen marker reload findings do not cover this modes/continuation path.

**Suggested fix:** freshly resolve negative marker/partner knowledge at Settings test-run entry and when adopting a live rivalry learned after that classification. If the real career now exists, remove test actions/labels and explicitly continue the real Showdown or refuse the requested test launch. Do not base “nothing counts” on a cached absence once fresh live authority has been discovered. Extend M7d to assert mode and labels, not only that the launch disarmed.

## Requested paths checked without an additional finding

| Path | Result and references |
| --- | --- |
| Popup blocked or closed early | Actual account module maps `auth/popup-blocked` to `sign-in-failed` and `auth/popup-closed-by-user` to `sign-in-cancelled`, clearing busy (`js/sparkConnectedAccount.js:177`). Isolated Chromium with those provider outcomes shows a retryable signed-out gate (`js/onlinePlayerIdentity.js:90`). The 20-second watchdog covers a never-settling attempt. These checks do not exercise a real Google's popup/browser policy. |
| Google sign-in policy | `js/sparkConnectedAccount.js:165` prepares `browserSessionPersistence`; `js/sparkConnectedAccount.js:182` creates the ordinary provider and uses `signInWithPopup`. No redirect flow or added scopes found. Ordinary sign-out implementation preserves Showdowns (`js/sparkConnectedAccount.js:193`); F1 concerns reaching it. |
| Session expires mid-season | Standard-auth adapter forwards all operations to the same protocol with device metadata mode (`js/sparkStandardAuthPrivateSession.js:48`). Expired sessions are marked by read (`js/sparkPrivateSession.js:491`) and cannot authorize automatic entry (`js/productionSharedJourneyEntry.js:389`). Recovery checks exact ACTIVE plus expiry and retains durable progression (`js/productionSharedJourneyReconnect.js:165`, `js/productionSharedJourneyReconnect.js:180`). Existing JOB-1 F1/F2 connection-establishment stalls remain excluded. No literal four-hour browser run was performed. |
| Trusted request expiry | Direct unchanged-module probe returns `PROVIDER_TOKEN_EXPIRED` for `auth/id-token-expired` (`js/trustedRequestAuthentication.js:11`, `js/trustedRequestAuthentication.js:65`). This is explicitly a candidate trusted-server boundary, **not** the live browser sign-in path (`js/trustedRequestAuthentication.js:86`); do not propose wiring a billing-backed server to fix these UI defects. JOB-B B7 already covers the missing identity/account notification wiring. |
| Nik Home before/after START | Within a current Home watch, empty server delivery keeps listening and the subsequent note updates the view immediately (`js/persistentNikDanielPair.js:391`). Fresh Home entry/read accepts an already-written valid note (`js/persistentNikDanielPair.js:371`). An expired note correctly disappears (`js/persistentNikDanielPair.js:406`); F2/F3 concern its duration and subsequent discovery. The initial Home watch deliberately has a ten-minute visit limit (`js/persistentNikDanielPair.js:394`). |
| JOIN tapped twice | Isolated concurrent calls against the unchanged pair module performed **one redeem**, with the second call observing busy and the final state ACTIVE (`js/persistentNikDanielPair.js:264`). A successful already-active pair returns early (`js/persistentNikDanielPair.js:247`); transaction checks reject used invites (`js/sparkPrivatePairing.js:320`). |
| UNPAIR during a Showdown | Settings refuses a locally known ACTIVE game (`js/showdownModes.js:119`); the transaction checks current online rivalry/invite authority before writing (`js/persistentNikDanielPair.js:418`). An ACTIVE game, open pending code, or Nik's waiting mailbox code blocks unpair. The permanent-pair suite also checks races and unreadable authority. |
| Test launch with a known real career/live Showdown | Settled real mode offers no START TEST RUN (`js/showdownModes.js:91`); direct `startTestRun()` refuses non-test mode (`js/showdownModes.js:138`). Canonical START continues the existing ACTIVE rivalry without creating another shell (`js/productionSharedJourneyEntry.js:290`). F4 is the stale negative knowledge case across browsers. |
| Real/test marker and ordinary labels | New Daniel test creation requires Settings arming and a fresh no-marker check (`js/persistentNikDanielPair.js:259`, `js/showdownModes.js:174`). First real START writes the marker before creating; first real Nik join writes his marker before redemption (`js/showdownModes.js:198`, `js/persistentNikDanielPair.js:264`). Real mode suppresses the test suffix; explicit test seasons/Connect Players/gameplay are classified test by `js/showdownModes.js:46`, `js/showdownModes.js:55`, `js/showdownModes.js:162`. No additional state-label error found beyond F4; this is not an exhaustive screenshot proof of every overlay's label visibility. |

## Validation and limits

- PASS: `tests/contracts/permanent-pairing-client-contracts.cjs` — 25 checks.
- PASS: `tests/contracts/r79-modes-settings-contracts.cjs` — 16 checks.
- PASS: `tests/contracts/r80-real-vs-test-contracts.cjs` — 10 checks.
- PASS: `tests/contracts/career-start-marker-contracts.cjs` — 14 checks.
- PASS: `tests/contracts/stage5c-zero-billing-standard-auth-session-contracts.cjs`.
- PASS: `tests/contracts/ten-season-session-contracts.cjs` — 7 checks, including existing expiry/rejoin coverage.
- Additional temporary probes: actual START/writer TTL; listener delivery/expiry/replacement; double JOIN; actual account popup-error mapping; trusted verifier expiry; isolated Chromium product account controls and retry gate; stale-mode real continuation. Temporary scripts remain in `work/`, outside the PR.
- `tests/contracts/private-account-auth-stage2f-contracts.cjs` could not start: it reads the removed `.github/workflows/validate-static-app.yml` and throws ENOENT. Its direct expiry behavior was checked separately; no app change was made to satisfy this historical test.
- POS20 impact route: `POS20_DOC_ONLY`, no product contracts selected, required `V10_FLASH_BROWSER` proof. The first visual attempt had no local static server and failed with `ERR_CONNECTION_REFUSED`; it was rerun after starting the repository server. **Final result: PASS**, portrait 390×844, landscape 844×390, desktop 1920×910, double taps, reduced motion and the additional Club motion/preference checks; zero blocking flash problems. Its landscape tap-feedback observation is report-only and outside this audit.

All six requested modules were read in full. Additional traced paths: `js/onlinePlayerIdentity.js`, `js/sparkConnectedAccount.js`, `js/persistentNikDanielPair.js`, `js/whichShowdownIsLive.js`, `js/connectPlayersScreenV10.js`, `js/sparkPrivateSession.js`, `js/sparkRemoteJoining.js`, `js/productionSharedJourneyReconnect.js`, and the relevant mode/pairing/expiry contracts. No production reproduction, real account switching or end-to-end physical suspension evidence is claimed.
