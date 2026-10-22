# JOB-2 — new sign-in, pairing and real/test findings

## Summary

Audited `main` **9230e33455eae93040317e7553131be34c20da9b**, release **1.9.5-r81**, on **2026-10-22** (America/New_York). **Three new P2 findings; no substantiated P1 or P3 findings.** Scope is ordinary two-manager play, including a connection interruption, an ordinary code-selection mistake and phone presentation. No app code, repository tests, Rules, accounts or production data were changed.

`codex-findings/` was absent on main. Before selecting findings, fetched and read the complete report files in open draft PRs **#958–#967**, including the updated [previous JOB-2, #961](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/961). Their findings are excluded. In particular, this report does not repeat missing sign-out/account switching, the 15-minute rather than 30-minute JOIN lifetime, stopped mailbox discovery, manual-code session-expiry recovery, or stale-browser real/test labels. The completed-reader repair in #957 is also excluded. Live main and the open audit PR list were rechecked before publication.

The new investigation starts at **the first real JOIN's commit and permanent-pair recovery boundary**, rather than the previous JOB-2's Settings/account-recovery entry or the latest report's completed-career reader. All six requested modules and their relevant Home, identity, partner, entry and label callers were reviewed.

## Evidence and limits

Reproductions execute unchanged app modules. Pairing probes extend the existing permanent-pair client contract fixtures: an in-memory transaction SDK, Save Library and fixture pairing/marker providers. These prove client decisions and ordering, not deployed Rules or production-account acceptance. A separate integration probe composes the unchanged modes and permanent-pair modules and clicks the actual rendered Settings button. The phone probe uses Chromium, actual Season Results renderer/styles and unchanged identity/modes with fixture account/provider state; it is not a full two-player test-run recording.

Fault injection, fixture setup and clock controls are test instrumentation, never player steps or tampering findings. No live Google popup, private account, production database or physical phone was used. Scratch probes, logs and screenshots stay under `work/` and are excluded from the PR. Only this report is proposed.

## Findings

### F1 — P2: an interrupted first pairing can leave neither account able to restore permanent pairing

**Player steps**

1. Daniel uses his first real START, sends Nik the `CMS17R-` code and closes his page before Nik joins.
2. Nik joins successfully. A connection interruption occurs after the pairing activation commits but before his permanent partner record can be saved; both automatic attempts fail.
3. Nik reloads. Both managers subsequently reopen with healthy connections and continue the same ACTIVE Showdown.
4. Finish that Showdown and start the next one. Daniel gets another manual `CMS17R-` pairing code. Nik receives no permanent-pair Home JOIN note, although they already completed their first real pairing.

**Cause / file:line:** activation and durable pair-link/index redemption precede the separate permanent partner write at `js/persistentNikDanielPair.js:264` (the activation transaction is `js/sparkPrivatePairing.js:350–370`). `pairRecordRealPairing` retries twice, then silently returns `null` at `js/persistentNikDanielPair.js:328`; JOIN still returns `paired`/ACTIVE. Daniel's closed page has not written his record either. On fresh pages, Daniel's recovery at `:333` and Nik's recovery at `:335` both pass `requirePartnerRecord:true`. The shared writer at `:318` rejects unless the other account's record already exists and names this account. Neither side can create the first missing record. The once-per-page recovery flag limits retries further; even another healthy reload cannot satisfy the circular prerequisite.

Without an active partner record, `pairDanielNeedsRealPairing` at `js/persistentNikDanielPair.js:342` again classifies Daniel as needing first real pairing. START at `:259` makes an R-prefixed code and skips the permanent-pair mailbox branch.

**Reproduction:** `work/missing-partner-recovery-repro.cjs` / `work/job2/missing-partner-recovery-repro.log`:

| Boundary | Observed result |
| --- | --- |
| Initial real JOIN, two interrupted partner-record attempts | `paired`, `active`, Nik marker `ready`; both partner documents absent |
| Healthy fresh Daniel page | ACTIVE pair; partner `none`; recovery `null`; zero writes |
| Healthy fresh Nik page | ACTIVE pair; partner `none`; recovery `null`; zero writes |
| Next START after closure | `CMS17R-`; mailbox writes `[]`; “Send this code to Nik. It is needed only once.” |

This does not require failures on both devices: Daniel simply leaves before redemption, and only Nik's post-redemption operation fails. Accepted gameplay remains available; the defect is loss of the promised permanent pairing and automatic next JOIN, not a lost season. Existing recovery contracts cover one missing record with the other present, which cannot expose this case.

**Suggested fix:** persist enough real-pair completion intent/proof with the durable first-pairing witness to recover either own record when both are missing. Keep incomplete permanent setup pending and retriable instead of silently treating it as complete. Preserve explicit UNPAIR (`active:false`), exact manager membership and marker checks; do not repair an intentional unpair or infer real pairing from an arbitrary ACTIVE test game. Add a two-page reload case with no partner records after a successful first real redemption, then require the next START/Home JOIN to use permanent pairing.

### F2 — P2: JOIN TEST RUN silently starts a real career when given a real pairing code

**Player steps**

1. Before Nik's first real pairing, Daniel opens a real first Showdown and shares its valid `CMS17R-` code.
2. Nik deliberately chooses **Settings → JOIN TEST RUN**. The code box displays **“TEST RUN · nothing counts.”**
3. Paste Daniel's code and tap JOIN.
4. The app starts Nik's real career, redeems the real Showdown and creates his permanent partner record without warning or confirmation that this will count. Settings changes to real mode/UNPAIR, and the test-run actions disappear.

**Cause / file:line:** `js/showdownModes.js:137–143` records explicit test intent (`armed=true`) and opens Nik's JOIN layer; `:49–55` displays the test promise. Both entry surfaces submit the generic JOIN at `js/persistentNikDanielPair.js:533`. Its authorization at `:348` permits a first-real code without checking test intent. JOIN at `:264` then starts Nik's career marker and redeems solely because `parsed.real` is true. No launch-intent check precedes marker creation, shell provisioning or redemption. The actual mode correctly changes to real afterward; this is not #961 F5's stale test-mode cache after another browser started a career.

**Reproduction:** `work/join-mode-settings-probe.cjs` clicks the actual Settings action with unchanged modes and pairing modules:

| Moment | Observed result |
| --- | --- |
| Before the Settings tap | Mode `test`; JOIN TEST RUN / FORGET THIS DEVICE |
| At the code box | `armed:true`; visible “TEST RUN · nothing counts” |
| After joining the real code | Marker `ready`; pair ACTIVE; mode `real`; Settings offers UNPAIR |

The same fixture probe also accepts a plain test code with test arming false and leaves the marker absent. Source inspection shows Home's generic code box uses that same submit path. The primary finding above does not depend on that reverse-direction control, a second browser or stale evidence.

**Suggested fix:** carry explicit real/test JOIN intent through validation. Refuse a real first-pairing code in JOIN TEST RUN before any marker, shell or redemption change, with a clear route to ordinary real JOIN. Apply the corresponding test-only entry check for a markerless test code. Preserve permanent-partner Home JOIN's existing real authorization; a permanent pair legitimately uses a plain code internally. Test both intentions against both code types using the actual Settings/Home entry surfaces.

### F3 — P2: phone Season Results clips away the only gameplay TEST RUN warning

**Player steps**

1. Start a deliberate test through Settings; Nik joins that test through Settings.
2. Play to Season Results on a phone, for example a 393×852 viewport, using touch normally.
3. The populated results screen has no visible TEST RUN / nothing-counts warning. A desktop presents that warning for the same test-mode state.

**Cause / file:line:** `js/showdownModes.js:42–57` relies on the identity header badge for the gameplay warning. Separate strips cover only Connect Players (`:49–55`) and seasons selection (`:162`). `js/onlinePlayerIdentity.js:76` places the correctly labeled badge inside `#topHeader` and sets `data-test-run=true`. However, `css/v10Shell.css:75–79` clips the entire header to 1×1, with `overflow:hidden` and `clip-path:inset(50%)`, on non-setup gameplay screens at widths up to 900px unless the header has keyboard focus. There is no test-label exception or visible Season Results replacement. The real Season Results renderer is registered at `js/seasonFinalV10.js:2068`.

**Reproduction:** `work/entry-modes/label-probe.cjs` rendered actual `seasonEntry`, with `data-v10-screen="seasonEntry"`, mode `test` and `isTestRunShown:true`. The badge text was correct in both controls:

| Viewport | Header / visible warning |
| --- | --- |
| 393×852 touch | 1×1, clipped; screenshot shows no test warning |
| 1366×768 desktop | 366.875×28, not clipped; warning visible |

Inspected `work/entry-modes/phone-test-season-results.png` and its desktop control. The only TEST RUN text nodes were the clipped badge and the hidden seasons-selection note. This confirms a presentation defect with correctly resolved mode, distinct from #961 F5. Other gameplay screens matching the selector are at risk; only Season Results received this dedicated screenshot comparison.

**Suggested fix:** retain a visible test warning in the gameplay stage or preserve a visible badge when `data-test-run="true"`. It must remain visible without keyboard focus on phones. Add a computed-visibility/screenshot check after a real Settings test launch through Season Results, plus a real-mode control. Checking only the badge string or `isTestRunShown()` misses this failure.

## Requested paths checked without another new finding

“No additional finding” below excludes earlier reports; it does not declare their known defects fixed.

| Path | Verdict / file:line |
| --- | --- |
| Google popup blocked, closed early, or cancelled | Controlled unchanged-account probes returned nonbusy retry states for `auth/popup-blocked`, `auth/popup-closed-by-user` and `auth/cancelled-popup-request` (`js/sparkConnectedAccount.js:177–189`). The public identity failure/cancellation and 20-second watchdog also restore SIGN IN (`js/onlinePlayerIdentity.js:89–90`). No live Google popup test. |
| Popup/session persistence policy | `js/sparkConnectedAccount.js:165–166,182–183` and `js/productionFirebaseRuntime.js:326` preserve popup-only Google sign-in and browserSessionPersistence without extra scopes. No redirect fallback introduced. |
| Wrong Google account / signing out | Creator self-redemption and wrong-role/partner checks remain in `js/sparkPrivatePairing.js:319–325` and `js/persistentNikDanielPair.js:348,356`. Missing visible sign-out/account switching is already #961 F1 and is not reported again. |
| Trusted authentication | `js/trustedRequestAuthentication.js:48–77` calls `verifyIdToken(token,true)` and rejects expired/revoked/disabled identities and mismatched uid/sub. It grants no app authority and declares `productionRuntimeConnected:false` at `:86`; it is not the browser's reauthentication handler. Targeted verifier checks passed. |
| Private session expires mid-season | `js/sparkStandardAuthPrivateSession.js:17–18,55–60` consistently forwards Standard Auth device mode. Base JOIN rejects expired sessions, and reads flag `expiredByClock` (`js/sparkPrivateSession.js:444,491`); entry/reconnect requires current ACTIVE authority while retaining the durable rivalry (`js/productionSharedJourneyEntry.js:341–357`; `js/productionSharedJourneyReconnect.js:164–180`). Existing manual-code recovery and offer/wait defects in #960/#961 remain excluded. |
| Nik opens Home before/after Daniel START | The attached visible-Home listener receives server notes and redraws JOIN (`js/persistentNikDanielPair.js:391–403`; `js/onlinePlayerIdentity.js:33,51`). Explicit taps request fresh checks. Known shortened lifetime/stopped-watch timings are #961 F2/F3, not new findings. F1 here concerns missing permanent records after first pairing. |
| Home after note expiry | Expiry removes the note from the view and redraws (`js/persistentNikDanielPair.js:368,406`; `js/whichShowdownIsLive.js:25`). It does not redeem a stale expired note. The promised 30-minute lifetime remains the earlier #961 finding. |
| JOIN tapped twice | Held the first provider redemption in flight and tapped again: second result `joining/busy`, total redeems **1**; release produced ACTIVE with total redeems **1** (`work/job2/duplicate-join-repro.log`). Busy acquisition precedes awaits (`js/persistentNikDanielPair.js:264`); committed-join recovery handles a lost acknowledgement (`:266`). |
| UNPAIR during an open Showdown | Current ACTIVE state refuses before confirmation (`js/showdownModes.js:117–124`). The transaction independently checks link/rivalry/invite, including Nik's waiting mailbox (`js/persistentNikDanielPair.js:419–432`). Existing permanent-pair and mode contracts passed. No new accidental unpair or season loss found. |
| Settings test launch while a real Showdown is already open | With current real evidence there is no test button (`js/showdownModes.js:91–99`), and `startTestRun` returns false for real mode (`:138`). Live entry continues rather than creates another Showdown (`js/productionSharedJourneyEntry.js:259–275,290–294`). Stale-browser exception is already #961 F5. New F2 instead starts with fresh Nik in explicit test JOIN while Daniel has a pending real code. |
| Ordinary real/test marker/entry guards | Marker precedes first real creation/redemption (`js/showdownModes.js:198`; `js/persistentNikDanielPair.js:264`); unfinished authority blocks first marker creation (`js/careerStartMarker.js:165–199`). Daniel’s unarmed leftover host codes route through real START; unavailable mode refuses creation. Inactive old markers still exclude prior tests. These controls do not prevent F2 or the visually hidden warning in F3. |

## Validation

- PASS: `r79-modes-settings-contracts.cjs` — **16**; `r80-real-vs-test-contracts.cjs` — **10**; `career-start-marker-contracts.cjs` — **14**; `permanent-pairing-client-contracts.cjs` — **25**; `persistent-nik-daniel-pair-contracts.cjs`.
- PASS: `spark-production-connected-account-contracts.cjs`, `studio-z-contracts.cjs`, `stage5c-zero-billing-standard-auth-session-contracts.cjs`, `ten-season-session-contracts.cjs`; **11** targeted unchanged-module popup/identity/verifier checks. No retired Stage 2F suite or live Google test is claimed.
- Reproduced F1 and F2 with unchanged client modules and fixture providers, including fresh healthy both-role recovery and the actual Settings action. Reproduced F3 with actual Chromium renderer/styles and phone/desktop screenshot inspection. Duplicate JOIN control passed.
- POS20 routes the report as **`POS20_DOC_ONLY`**, zero selected product contracts, required **`V10_FLASH_BROWSER`**. `CMS_CHROMIUM_MULTI_CONTEXT=1` screen-flash audit **PASS**: ten journeys at portrait 390×844, landscape 844×390 and desktop 1920×910, double taps, reduced motion and additional Club checks; zero blocking problems. Desktop tap feedback remained a report-only observation outside this audit. That proof does not assert test-warning visibility or permanent-record recovery.

An initial command used a nonexistent shorthand test filename; it was corrected to the actual `r80-real-vs-test-contracts.cjs` suite, which passed. No app/test assertion was altered. No new emulator, production-account or physical-device acceptance run was performed. These limits do not weaken the reproduced client decisions or the observed CSS clipping. Only this report belongs in the draft PR.
