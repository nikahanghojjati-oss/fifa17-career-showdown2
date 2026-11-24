# JOB-2 — sign-in, sign-out, pairing and real/test identity

## Summary

Audited `main` at `9230e33455eae93040317e7553131be34c20da9b`, release **1.9.5-r81**, on 2026-10-20; report finalized on 2026-10-21 after rechecking the unchanged main head. **Five new P2 findings; no substantiated P1 or P3 findings.** Scope is normal two-manager play, including ordinary account mistakes, waiting, expiry and using another browser/device. No app code, tests, Rules, accounts or deployments were changed.

`codex-findings/` did not exist on main. Before auditing, I also read every report file in the three existing audit drafts: [JOB-B, #958](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/f16ca9cbc93af7bf971044d2f2a1456965f0b657/codex-findings/JOB-B-career-double-load-2026-10-20.md), [JOB-A, #959](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/ad8723e91cca256e8a81249265d0c31e9e84ced8/codex-findings/JOB-A-career-zero-root-cause-2026-10-20.md), and [JOB-1, #960](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/5b4d7c0f8db7d2646cbaa33763b5876b35b27754/codex-findings/JOB-1-continue-reload-2026-10-20.md). Started with **Settings/account recovery and test-run controls**, rather than JOB-1's reload/continuation flow. Excluded the already reported completed-reader, career remount/readiness, session-offer replacement, session-wait timeout, signing-draft and wrong-stage resume defects.

## Evidence and limits

Read the six requested modules and their account, permanent-pair, Home note, live-Showdown decision and reconnect callers. Reproductions execute unchanged app modules with provider/identity fixtures, either in isolated JavaScript VMs or Chromium. Time-bound probes advance an isolated clock; they are not literal 11-minute/4-hour production runs. No owner's Google account or production Firebase data was accessed.

Temporary harnesses stayed outside the checkout. The pairing harness reused the existing contract helpers; the expiry probe replaced that harness's supplied-expiry create stub with the **actual `sparkPrivatePairing.createPairing`**. Browser probes used the actual identity/modes renderers and the actual Remote Joining/reconnect renderers. Fixture setup is test instrumentation, not a player step or a tampering finding.

## Findings

### F1 — P2: the visible account UI has no sign-out or account-switch recovery for a real account

**Player steps**

1. On a second/shared browser, select the wrong Google account, for example Daniel's account on Nik's phone. Alternatively, sign in normally to an account whose real career has started and try to sign out.
2. If this browser has no matching saved role, the app asks WHO ARE YOU? It shows neither the Google account/email nor a change-account/sign-out action. Choosing a manager does not change the authenticated Google account.
3. Open Settings after identity preparation. The real-account panel offers pairing actions, with no SIGN OUT or SWITCH ACCOUNT. The player must end the browser session/use another browser to get back to Google's chooser; ordinary reload retains browserSessionPersistence.

**Cause and file:line:** `js/onlinePlayerIdentity.js:78` renders the public Settings account panel with only player/device information and status-dependent sign-in/manager/retry actions. `js/onlinePlayerIdentity.js:75` likewise omits account identification and sign-out from WHO ARE YOU. The underlying working SIGN OUT button exists at `js/sparkConnectedAccount.js:242`, but its whole panel is hidden by `js/onlinePlayerIdentity.js:54` and `js/onlinePlayerIdentity.js:77` (also `css/rulesSettingsV10.css:121`). The only public path calling `account.signOut()` is FORGET THIS DEVICE (`js/onlinePlayerIdentity.js:92`); `js/showdownModes.js:91` and `js/showdownModes.js:97` restrict that control to test mode. Real accounts deliberately lose Forget, but were not given an ordinary sign-out replacement. Pair reconciliation may correctly restore the account's existing manager (`js/onlinePlayerIdentity.js:26`); that still cannot switch Google accounts.

**Reproduction:** Chromium with the unchanged identity and modes modules: WHO ARE YOU contained no email or sign-out; a marker-holding unpaired account's Settings buttons were `["PAIR WITH DANIEL"]`; the existing internal SIGN OUT panel was invisible. Paired real accounts take the corresponding UNPAIR-only branch. The fixture used no real email/account.

**Suggested fix:** Add an ordinary SIGN OUT / CHANGE GOOGLE ACCOUNT action to the public identity gate and Settings, including choose-manager/setup-error states. Show the selected account's display identity so the player can notice the mistake. End the Auth session without revoking the device, unpairing, ending the Showdown or deleting local saves; then offer the existing Google popup. Keep the real-mode prohibition on Forget separate from ordinary sign-out.

### F2 — P2: the promised 30-minute Home JOIN window actually expires after 15 minutes

**Player steps**

1. With Daniel and Nik permanently paired, Daniel selects seasons and presses START.
2. Nik opens Home 16–29 minutes later, still inside the specified 30-minute JOIN window.
3. Home has no usable JOIN note. Pasting Daniel's code also fails because the underlying invite expired. Daniel must issue a replacement before Nik can join.

**Cause and file:line:** `js/sparkPrivatePairing.js:16` defaults pairing expiry to **15 minutes**. The permanent-pair START call at `js/persistentNikDanielPair.js:259` supplies no `ttlMs`, so `js/sparkPrivatePairing.js:283` and `js/sparkPrivatePairing.js:289` apply that default. `js/persistentNikDanielPair.js:366` copies the invite's exact expiry into Nik's note; `js/persistentNikDanielPair.js:406` hides it at that instant. The Rules explicitly require the two expiries to match (`firestore.persistent-pair-production.fragment.rules:504`). The 30-minute constant at `js/sparkPrivatePairing.js:17` is merely a maximum, not the normal duration.

**Reproduction:** A permanent-pair START through the real creation provider wrote an invite and note both expiring in **15 minutes**. A normal redeem at simulated minute 16 returned `PAIRING_CAPABILITY_EXPIRED`. Existing PC2 contracts inject their own expiry and check that it is copied; they do not assert a production 30-minute duration.

**Suggested fix:** Explicitly request the agreed 30-minute invite lifetime in the permanent-pair START path, and keep the note bound to that invite expiry. Test the actual default/caller combination at minutes 16, 29 and after 30; increasing only the mailbox note's time would still leave JOIN unusable.

### F3 — P2: Nik's visible Home silently stops discovering Daniel's next JOIN note

**Player steps — two ordinary timings**

1. Nik opens Home before Daniel starts and leaves the tab visible. Daniel presses START after Nik has waited 11 minutes. Nik's Home stays WAITING FOR DANIEL, even though a fresh, joinable note is now in the mailbox.
2. Alternatively, Nik sees a JOIN but does not tap before it expires. Leave that Home visible. Daniel makes the next code/note after expiry. Nik's Home never discovers the replacement.

Leaving/reopening Home, hiding/showing the tab or explicitly tapping the tile can recover discovery. There is no visible indication that watching stopped, so normal waiting is misleading.

**Cause and file:line:** `js/persistentNikDanielPair.js:291` limits the Home note watch to ten minutes. The window callback stops it at `js/persistentNikDanielPair.js:386`. Separately, delivering a valid JOIN immediately detaches its listener (`js/persistentNikDanielPair.js:391`, through `js/persistentNikDanielPair.js:383`). When that note expires, `js/persistentNikDanielPair.js:368` only notifies renderers; it does not resume discovery. The notification redraws Home (`js/onlinePlayerIdentity.js:116`), but rendering performs no read/watch (`js/onlinePlayerIdentity.js:55`). Actual reattachment occurs through Home/visibility/explicit-START events (`js/onlinePlayerIdentity.js:33`, `js/onlinePlayerIdentity.js:98`, `js/onlinePlayerIdentity.js:115`). Remaining on the same visible Home produces none of those events.

**Reproduction:** Isolated unchanged pair module with one initial Home watch and server-style snapshot delivery. After 11 minutes, a new valid note produced `listeners:0, joinVisible:false`. In the second run the first note did show JOIN; after it expired, a replacement also produced `listeners:0, joinVisible:false`. The probe did not repeatedly call `watchJoinNote` on a timer: that would manufacture Home visits the production caller does not generate.

**Suggested fix:** While Home promises to wait, keep one mailbox listener or provide an explicit, honest paused state with CHECK FOR SHOWDOWN. If detaching once JOIN appears, rearm on expiry and check for a replacement. Preserve no reads while hidden/off Home and avoid adding a render-driven poll. This finding concerns **pairing mailbox discovery**, not JOB-1 F2's separate private-session offer/join timers.

### F4 — P2: in-game session expiry sends permanently paired players back to exchanging manual session codes

**Player steps**

1. Both managers are permanently paired and playing a real Showdown. Keep the game/tab open until the roughly four-hour private session expires, including an overnight pause.
2. Tap the displayed RECONNECT SESSION action in the game.
3. Daniel is told to HOST PRIVATE SESSION and send a new code; Nik is told to paste that code and JOIN PRIVATE SESSION. The panel exposes the manual host/join code workflow even though this pair should connect without another code after its first real pairing.

The game remains saved; the problem is the recovery route. Returning Home and continuing can instead reach the existing automatic session-offer connection path, subject to JOB-1's already reported offer bugs.

**Cause and file:line:** Expiry correctly drops ACTIVE authority (`js/sharedJourneyReconnect.js:59`, `js/productionSharedJourneyReconnect.js:164`). However, the banner instructions explicitly prescribe code exchange (`js/productionSharedJourneyReconnect.js:85`, `js/productionSharedJourneyReconnect.js:101`), and its action invokes only `remoteApi.openPanel()` (`js/productionSharedJourneyReconnect.js:121`, `js/productionSharedJourneyReconnect.js:130`). That method merely opens/renders the panel (`js/sparkRemoteJoining.js:558`). With `auto:null`, rendering falls through to manual host/join (`js/sparkRemoteJoining.js:521`, `js/sparkRemoteJoining.js:529`, `js/sparkRemoteJoining.js:533`), without the permanent-pair restriction used by the automatic card. The normal entry caller explicitly starts `autoConnect()` before opening the same panel (`js/productionSharedJourneyEntry.js:347`); expiry recovery omits that step. NEW SESSION CODE has the same direct-open omission (`js/productionSharedJourneyReconnect.js:126`).

**Reproduction:** Chromium ran the unchanged reconnect protocol, Remote Joining and reconnect UI with a valid permanently paired identity and a provider-returned ACTIVE session. Advancing past its expiry yielded `FRESH_SESSION_REQUIRED`. Clicking the real RECONNECT SESSION button called `autoConnect` **zero times** and displayed HOST PRIVATE SESSION, JOIN PRIVATE SESSION and “Paste the full code shared directly by the other already-paired manager.” This is not JOB-1's replacement-after-failed-read or ten-minute wait failure; no request failure or polling deadline was needed.

**Suggested fix:** Route permanent-pair recovery through the existing automatic offer adoption/host/join operation and its context-bound return handling. Retain exact ACTIVE reauthorization and accepted-season state. Update the banner instructions to match that automatic flow; keep any manual fallback explicitly scoped to accounts that still need it.

### F5 — P2: a previously open test-mode browser labels a real Showdown “nothing counts”

**Player steps**

1. Daniel opens browser A before his first real career START. Its mode/marker reads settle as test/no marker. Leave that page open.
2. On Daniel's other browser/device B, use the normal first real START/checkmark and pair with Nik. The account now has its real marker and a real ACTIVE Showdown.
3. In A, tap CONTINUE CAREER/START to resume that ACTIVE Showdown. The fresh pair read learns the real live game, but its header still says TEST RUN · NOTHING COUNTS. Settings still identifies test mode and offers START TEST RUN.
4. Choosing that test-run action follows the live Showdown's Continue route, rather than starting a separate test. The real game counts despite the displayed promise.

**Cause and file:line:** `js/showdownModes.js:62` reuses its settled `none` marker view indefinitely. Even bypassing that local view would reuse the marker module's settled `none` because the ordinary modes read does not request `recheckNone` (`js/showdownModes.js:64`, `js/careerStartMarker.js:115`). The partner memo likewise preserves its earlier `none` (`js/persistentNikDanielPair.js:308`). After learning an ACTIVE pair, Daniel's record recovery asks the same stale marker (`js/persistentNikDanielPair.js:333`, `js/persistentNikDanielPair.js:342`) and cannot repair the mode. `smResolve` then retains test (`js/showdownModes.js:71`), and `smTestRunShown` treats that account's ACTIVE pair as a test run (`js/showdownModes.js:46`). Settings offers START TEST RUN from this view (`js/showdownModes.js:98`). Fresh marker checking exists before **new test creation** (`js/showdownModes.js:174`), but a live Continue bypasses that gate (`js/productionSharedJourneyEntry.js:259`, `js/productionSharedJourneyEntry.js:291`).

**Reproduction:** Ran the actual marker, permanent-pair and modes modules together. A first read of an absent marker returned test. After the fixture server gained the valid real marker and a legitimate ACTIVE pair, a forced pair initialization plus normal partner recovery and mode resolution produced `learnedPair:"active", mode:"test", badge:" · TEST RUN · NOTHING COUNTS"`, with only the original **one** marker server read. No cached value was modified by the probe. A server-side change stands for the other browser's normal real START.

**Suggested fix:** Revalidate a settled test/no-partner mode when adopting a newly observed live rivalry or returning to an account whose career may have started elsewhere. Resolve the account marker/partner evidence before publishing its real/test labels and Settings actions, sharing the in-flight read. An unresolved answer must not promise that a potentially real game is a test. Preserve the fresh-before-create check too. This is a modes-cache defect, distinct from JOB-B's career-screen marker invalidation/remount findings.

## Requested scenarios and paths checked without an additional defect

| Path | Verdict and evidence |
| --- | --- |
| Popup blocked, closed early or never settling | No new defect reproduced. Actual identity module returned signed-out/non-busy with an actionable retry reason for `sign-in-cancelled`, `sign-in-failed`, and the 20-second watchdog callback (`js/onlinePlayerIdentity.js:89`, `js/onlinePlayerIdentity.js:90`). The account adapter handles Firebase popup cancellation at `js/sparkConnectedAccount.js:186`; blocked-popup errors take its retriable failure branch. This is controlled rejection/timer evidence, not a live Google popup test. |
| Popup/persistence policy | `js/sparkConnectedAccount.js:165`, `js/sparkConnectedAccount.js:182` and `js/productionFirebaseRuntime.js:326`: popup only, browserSessionPersistence, no extra scopes or redirect fallback. Normal Firebase ID-token refresh is distinct from the four-hour private-game-session lifetime. |
| Trusted authentication adapter | `js/trustedRequestAuthentication.js:48`: validates a supplied token through `verifyIdToken(token,true)`, rejects expired/revoked tokens and mismatched uid/sub. It explicitly declares itself disconnected from production browser runtime at line 86; it is not a missing browser reauthentication implementation. Targeted valid/expired/revoked adapter checks passed; the retired Stage 2F suite could not start (see validation). |
| Standard-auth session adapter | `js/sparkStandardAuthPrivateSession.js:17` forwards account-owned device metadata mode consistently into open/join/read/revoke/expire/close. Base expiry is not accepted as ACTIVE (`js/sparkPrivateSession.js:444`, `js/sparkPrivateSession.js:491`); reconnect preserves the durable rivalry. F4 is the UI recovery-path gap; JOB-1's session-offer defects are excluded. |
| Wrong Google account | Creator cannot redeem its own code (`js/sparkPrivatePairing.js:319`, `js/persistentNikDanielPair.js:356`); an established partner must match its role and code creator (`js/persistentNikDanielPair.js:348`). No cross-manager permission failure is claimed. F1 concerns ordinary recovery/account visibility. |
| Nik opens Home shortly before or after START | An attached Home listener receives the note and redraws JOIN, including first server delivery after ignoring cache (`js/persistentNikDanielPair.js:391`, `js/persistentNikDanielPair.js:392`, `js/onlinePlayerIdentity.js:51`). Fresh START/tile taps bypass the note memo where needed (`js/onlinePlayerIdentity.js:98`, `js/persistentNikDanielPair.js:371`). F2/F3 cover the expiry and stopped-watch timings. |
| Home after the note expires | Expired notes are correctly excluded and JOIN is removed (`js/persistentNikDanielPair.js:368`, `js/persistentNikDanielPair.js:406`, `js/whichShowdownIsLive.js:25`). No stale expired note is automatically redeemed. The short duration and failure to watch for the next note are F2/F3. |
| JOIN tapped twice | One redeem: a temporary probe held the first provider redemption in flight, called JOIN again, then released it. Result was ACTIVE with `providerRedeems=1`. Busy locking is acquired before the first await (`js/persistentNikDanielPair.js:264`); an already ACTIVE pair short-circuits (`js/persistentNikDanielPair.js:247`); lost acknowledgements are re-read (`js/persistentNikDanielPair.js:266`). Home also shares the canonical START promise (`js/onlinePlayerIdentity.js:98`, `js/onlinePlayerIdentity.js:113`). |
| UNPAIR during an in-progress Showdown | Refused by the UI before confirmation (`js/showdownModes.js:119`), then independently by the transaction reading the current pair/rivalry (`js/persistentNikDanielPair.js:419`, `js/persistentNikDanielPair.js:421`). Nik's waiting-mailbox case is checked as well (`js/persistentNikDanielPair.js:428`). Existing 25-case permanent-pair and 16-case mode contracts passed; no new unpair loss was found. |
| Settings test run while a real Showdown is open | With current real-mode evidence, no test-run button is rendered; the action also returns false for a real view (`js/showdownModes.js:91`, `js/showdownModes.js:138`). The only reproduced exception is stale browser A in F5. Existing live-game START/Continue does not create another Showdown (`js/productionSharedJourneyEntry.js:259`, `js/productionSharedJourneyEntry.js:291`). |
| First real pairing and ordinary real/test labels | Marker precedes Daniel's creation and Nik's first real redemption (`js/showdownModes.js:198`, `js/persistentNikDanielPair.js:264`); partner records follow ACTIVE. Normal real accounts omit the TEST RUN badge; explicit test runs label the gameplay/header and Connect layer (`js/showdownModes.js:46`, `js/showdownModes.js:49`, `js/showdownModes.js:57`, `js/showdownModes.js:162`). Label methods and source were checked across their gameplay routes; no fresh screenshot run of every real/test screen is claimed. F5 supplies the new incorrect-label timing. |

## Validation record

- Passed `spark-production-connected-account-contracts.cjs`, `permanent-pairing-client-contracts.cjs` (25), `r79-modes-settings-contracts.cjs` (16), `r80-real-vs-test-contracts.cjs` (10), `career-start-marker-contracts.cjs` (14), `stage5c-zero-billing-standard-auth-session-contracts.cjs`, `ten-season-session-contracts.cjs` (7), `studio-z-contracts.cjs` (11), `firestore-budget-contracts.cjs` (25).
- Temporary unchanged-module probes reproduced the 15-minute invite/note and minute-16 rejection, both Home watch gaps, wrong-account/sign-out UI omission, manual expired-session recovery, and stale test-mode labeling. Controls covered popup failure/watchdog recovery and duplicate JOIN.
- Targeted trusted-adapter checks passed. The additional legacy `private-account-auth-stage2f-contracts.cjs` attempt failed before assertions because it reads the absent `.github/workflows/validate-static-app.yml`. No replacement workflow was created and no full Stage 2F suite pass is claimed.
- POS20 impact routing for this report: `POS20_DOC_ONLY`, zero selected product contracts, required `V10_FLASH_BROWSER` proof. The existing tests above were additionally run to check their claims and boundaries. No new production/emulator acceptance credit is claimed.
- Required `npm run test:v10-flash`: completed against the local static server with artifacts outside the checkout. The initial launch had no server and failed with `ERR_CONNECTION_REFUSED`; it was rerun after starting the server. Final result: **PASS**, including portrait, landscape, desktop, double taps, motion preferences and the extra Club stages.

Only this report belongs in the draft PR. Suggested repairs are proposals, not app changes made by this audit.
