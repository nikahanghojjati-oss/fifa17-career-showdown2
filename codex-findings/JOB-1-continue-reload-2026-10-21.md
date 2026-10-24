Two new P2 recovery defects: a replacement-session final save leaves the other page falsely pending, and a slow successful reload exposes START during an active Showdown; no new lost result or duplicate season write established.

## Scope and exclusions

Audited `main` **9230e33455eae93040317e7553131be34c20da9b**, release **1.9.5-r81**, on **2026-10-21** (America/New_York). Daniel is `playerOne`; Nik is `playerTwo`. Only ordinary two-manager play, reload, tab closure, network interruption, phone sleep and browser/device changes are considered. No app code, repository tests, Rules or production data were changed.

There was no `codex-findings/` directory on main. Before investigating, read every findings file in draft PRs **#958–#964**. A later live check found **#965** and an updated **#961**; those reports were also fetched and read before selecting these findings. Their findings are excluded, including the earlier JOB-1 session-offer/wait failures, draft correction, backwards stage restoration, failed-Continue Home labels, and failed Final Winner detail cache. Existing findings are referenced in the path verdicts without being reported again. The separate completed-reader fix in #957 is also excluded.

Started at **pending Final Winner saves and terminal acknowledgements**, rather than #965's Career Start handoffs, #964's archive aggregation, or #960's device/session-offer entry. Read all seven requested implementation files and all four requested audits, then followed their stage, identity, session and final-save callers. The two new findings have independent causes and reproductions.

## F1 — P2: a successful final save through a replacement session never clears the other page's pending save

**Player steps — either manager can be the affected player**

1. Finish the last season and reach Final Winner near the end of the private session's four-hour lifetime. On Daniel's page, the automatic career save loses its connection before the close commits. It shows **SHOWDOWN CLOSE STILL PENDING** / the failed-save retry.
2. Leave that page open while the phone sleeps for ten minutes, crossing the session deadline. The season results and final totals are already accepted.
3. Reconnect both managers through a replacement private session using the existing recovery controls. Nik reloads or opens another browser, continues the same Showdown, and completes its automatic final save through that replacement session.
4. Daniel returns to the original page. Firebase now has a valid CLOSED Showdown, but that page still says the save is pending/failed. Refreshing the shared status repeatedly does not settle it. **RETRY SAME TERMINAL CLOSE** fails again. A page reload clears the stale pending state. Reversing the two managers reproduces the same problem.

**Cause / file:line:** an uncertain close retains an intent bound to its original session (`js/productionSharedTerminalClose.js:287`, `:292`). The normal refresh branch at `:203–208` accepts a verified closed result only when `sameWitness` matches that held intent. The witness contains `sessionId`, and its key compares the entire intent (`js/sharedTerminalClose.js:32–35`). Therefore the rival's valid closure under the replacement session is treated as a conflicting result even when the rivalry, seasons, winner and totals are identical. Retry throws `TERMINAL_CLOSE_REPLAY_CONFLICT` at `js/productionSharedTerminalClose.js:312`, and the catch restores the same pending state at `:319`.

The visible consequence is **“Saving failed. Try CLOSE SHARED SHOWDOWN again.”** (`js/seasonFinalV10.js:29`) or the pending/retry panel (`js/productionSharedTerminalClose.js:136–137`). The retry cannot resolve this already-closed result. This is separate from #965 F2: the failure occurs before adopting CLOSED, not in the later completed-history detail read.

**Reachability:** session recovery remains accessible while terminal recovery is pending (`js/productionSharedJourneyReconnect.js:121–122`). An expired held session does not prevent normal replacement hosting/joining (`js/sparkRemoteJoining.js:119–121`, `:529`, `:533`). A fresh page has no held terminal intent and accepts the stored closure at `js/productionSharedTerminalClose.js:210`. The manual-code recovery UX is already reported in #961 F4 and is not another finding here.

**Reproduction:** separately for Daniel and Nik, executed the unchanged production Terminal Close adapter, actual StandardSession open/join providers and actual terminal provider with an in-memory SDK. Injected one `unavailable` result before the first close wrote anything, then created/joined a replacement session and let the rival close normally:

| Observation | Result |
| --- | --- |
| Replacement session open / join | Both accepted |
| Rival's terminal close | Accepted; root CLOSED with totals **11–9** and replacement session witness |
| Original page's fresh terminal read | Still `RECOVERY_PENDING` |
| Original page's retry | `TERMINAL_CLOSE_REPLAY_CONFLICT`; still pending |
| Fresh page control reading the same closed result | CLOSED |

This reproduction verifies the provider and adapter decisions; it is not a production or physical-phone run, and its SDK does not emulate Rules. The requested Rules-backed r79 continuation independently proves that a replacement session can finish an existing Showdown. **Expiry alone is not the defect:** terminal close can finish using an otherwise ACTIVE persisted old session; the reproduced failure requires the rival to finish with a different valid session witness. Saved results are intact, so this is P2 rather than a data-loss finding.

**Suggested fix:** preserve exact idempotency for resending an unresolved mutation. Separately, when a fresh verified terminal read proves that this same rivalry has already closed with the same final gameplay facts through another session, adopt that stored closed result read-only. Do not resend the old close or overwrite the stored witness. Retain rejection for changed rivalry/final facts. Add both-role coverage for failed pre-write close → replacement session → rival close → original page refresh/retry. The existing recovery test explicitly holds a different-session witness (`tests/contracts/hunt-1017-terminal-close-recovery-contracts.cjs:49–50`), but does not model this legitimate replacement-session completion.

## F2 — P2: a reload taking longer than 15 seconds exposes START while the live game is still resuming

**Player steps**

1. Daniel or Nik is playing an ACTIVE Showdown, for example in the shared Transfer Challenge.
2. Reload the same tab on a slow connection. Loading the Firebase SDK takes about 19 seconds, then succeeds; no request needs to fail.
3. At about 15 seconds the loading cover disappears while the identity/pair are still restoring. Home says **START A SHOWDOWN** for several seconds, despite this tab's saved live-game flag.
4. When initialization completes, the tile changes to CONTINUE and the same Showdown/session resumes. The incorrect new-game affordance was visible during a successful resume.

**Cause / file:line:** `js/ssjr.js:64` bounds startup by time elapsed since navigation, and `:77` stops holding a live-game reload once that cap expires, even if identity/pair authority is unresolved. The app's outer loading cap is also at `js/app.js:1`. Meanwhile `liveHomeTile` only recognizes positively resolved live pair states (`js/onlinePlayerIdentity.js:43`) and otherwise falls through to new-game wording (`:51`, `:57`). The live flag written by `js/productionSharedJourneyEntry.js:335–339` therefore does not protect the fallback Home tile after the deadline.

**Reproduction:** actual Chromium app with two emulator-backed managers, composed production Rules and an already ACTIVE Transfer Challenge. Delayed only successful Firebase SDK module responses by 19 seconds on reload, with reduced motion to expose the startup boundary. Frame capture observed Daniel's loading release at about **15.10 s**, while identity was `connecting` and the pair module had no state:

| Manager | Incorrect visible Home frames | Interval after navigation |
| --- | --- | --- |
| Daniel | **247 START** frames | **15.053–19.235 s** |
| Nik | **239 START + 9 JOIN** frames | **15.056–19.248 s** |

Both then resumed `transferChallenge:window` with their original shared session. Neither needed another join, and no request failed.

This differs from #965 F1: there is no failed CONTINUE tap, no attachment error, and no retained `status:"error"`. The response merely arrives after the startup deadline. #960/#965 mentioned the cap as an evidence limit; neither reported this observed successful-slow-reload failure.

**Suggested fix:** retain a bounded startup cover, but make its timeout reveal an honest **RESUMING / CHECK CONNECTION** state when this tab has an unresolved live game. Suppress START/JOIN until a current pair check positively establishes that no active Showdown exists. Do not derive gameplay authority from the flag; use it only to avoid advertising a new game while authority is unknown. Extend frame coverage beyond the current nine-second fixture, with delayed successful responses for both managers.

## Requested stage verdicts

“State recovers” means durable facts survive on a healthy reauthorization path. It does not mean exact-screen restoration is correct. Existing #960 F4 remains the excluded Results/acknowledgement screen regression; the connection/error/detail exceptions in #960, #961 and #965 also remain applicable. The new F2 affects startup presentation at any active stage whose recovery crosses its deadline.

| Reload stage | Daniel (`playerOne`) | Nik (`playerTwo`) | Evidence / file:line |
| --- | --- | --- | --- |
| Career Start, before own acknowledgement | State recovers: assigned club and own confirmation action. | Same, using Nik's role/club. | Entry selects confirmed setup at `js/productionSharedJourneyEntry.js:381–383`; role rendering at `js/productionSharedCareerStart.js:154–160`. |
| Career Start, after own acknowledgement | Own acknowledgement is recognized; no repeat write needed. | Same role-scoped recovery. | Read-before-write and own-ack check at `js/productionSharedCareerStart.js:89–103`; both-ready navigation at `:63–65`. |
| Transfer Challenge | Phase, absolute deadline and locked inputs recover. Same-browser unlocked drafts are restored, subject to the already reported signing correction defect. | Same protocol and role-scoped recovery. | Open/read at `js/productionSharedTransferChallenge.js:111–117`, `:337`; locked outcome detection at `:122–128`; draft restore at `:229–238`, `:255–269`. Healthy r80 G7a covers both; G7b live-window reload directly covers Daniel. F2 adds the slow-reload exception. |
| Season Results entry/review | Numeric/check drafts recover on this browser; review intent must be repeated. Exact-screen resume already fails under excluded #960 F4. | Same. | `js/productionSharedSeasonResults.js:110–128`, `:169–171`; current r80 G7c again landed on the completed transfer replay for both. |
| Published result, waiting for rival | Stored own result recovers; read-before-publish avoids another publication. Existing #960 F4 affects landing screen. | Same. | `js/productionSharedSeasonResults.js:154–157`, `:183–196`. No new lost/duplicate published result established. |
| Commit / acknowledge | Existing commit and own ack recover; an interrupted coordinator acknowledgement remains available to complete. Existing #960 F4 affects landing screen. | Existing commit exposes Nik's outstanding ack or recognizes the stored ack. Same screen caveat. | `js/productionSharedSeasonCommit.js:155–184`; acknowledged seasons feed authoritative progression at `js/productionSharedMultiSeasonProgression.js:177–190`. |
| Final Winner / final career save | A normal closed result reload returns Home, with the stored result retained. **F1 fails to settle an old pending page after rival closure under a replacement session.** | Same; F1 reproduced with Nik as pending manager too. | Terminal read/adoption at `js/productionSharedTerminalClose.js:196–210`; reload guard at `js/onlinePlayerIdentity.js:14`, `js/productionSharedJourneyEntry.js:483`. Existing #965 F2 details and archive-reader findings remain excluded. |

## Other requested paths and paths checked without another new defect

| Path | Verdict and references |
| --- | --- |
| 30-second outage, established unexpired session | No new duration-specific data-loss or duplicate-write defect found. Offline supersedes an in-flight recovery observation (`js/productionSharedJourneyReconnect.js:138–143`); awaited setup/progression reads recheck generation and exact session (`:168–180`); online/visible return wakes recovery (`:200`, `:206`). Existing failed-resume exceptions remain excluded. |
| Ten-minute outage/sleep, session still valid | No ten-minute gameplay expiry; session lifetime is about four hours (`js/sparkRemoteJoining.js:19–25`). Durable accepted history is separate from connection authority (`js/sharedJourneyReconnect.js:84–93`, `:154–163`). Visible Transfer return clears the old clock anchor and reads a fresh one (`js/productionSharedTransferChallenge.js:378`, `:58–72`). Waiting/continuity contracts passed simulated ten-minute returns. If the interval crosses session expiry and rival final closure, F1 applies; known discovery/manual-reconnect findings remain excluded. |
| Both reload together | With readable unexpired offer/session authority, both adopt the same ACTIVE session without another join or season write (`js/sparkRemoteJoining.js:362–366`, `:469–473`). No new simultaneous-reload duplication found. F2 can expose Home independently on each slow page; existing offer-read/stage exceptions are not called fine. |
| r79 season 1 completed, continued on r80 | Provider/data-format continuation works: fresh session, seasons 2–3, final close and both-role completed reads passed; all **seven** old season-1 documents stayed byte-identical (`tests/firebase/r79-showdown-continues-emulator.cjs:126–139`, `:142–176`, `:179–196`). Relevant provider/protocol files and composed Rules are unchanged between r80 release `f4481e15` and this main. This is a current-provider run against an actual r79 fixture, not a historical r80 browser-asset run. |
| Second device/browser during a season | Provider save/profile/role adoption and exact account/device attachment work on readable authority (`js/persistentNikDanielPair.js:211–214`, `:228`, `:275`; `js/sparkConnectedRivalry.js:438–467`). Unpublished drafts remain on their original browser (`js/productionSharedSeasonResults.js:110–128`); published/locked facts stay shared. No new binding/data-loss defect established. A second clean page can participate in F1's replacement-session final close. |
| Cache/listener recovery on return | Mutable read cache is invalidated on online/pageshow/visibility return (`js/sparkPrivatePairing.js:734–742`). Cached/pending listener deliveries are not authoritative (`:867–869`); listener failures restore fallback behavior (`:878–895`); a return waiting for initial listener delivery falls back to a server read after five seconds (`:903–908`). Targeted contracts passed. |
| Real/test marker during continuation | Existing ACTIVE continuation precedes new-career creation (`js/productionSharedJourneyEntry.js:259–275`, `:290–294`). Only a new creation invokes the modes gate (`js/showdownModes.js:167–201`); marker creation refuses an unfinished rivalry (`js/careerStartMarker.js:165–199`). No new marker write/reset or accepted-season loss found. Previously reported stale mode/filter/read defects remain excluded. |
| START/JOIN while resuming | Healthy bounded cases pass the r80 frame audit; **F2 proves the longer successful reload gap**. The existing reload-hold test restores identity at nine seconds (`tests/browser/r79-reload-hold-audit.cjs:13`, `:79–83`), below the 15-second cap. The separate failed-Continue label defect is already #965 F1. |

## Validation and limits

- PASS: `tests/browser/r80-resume-active-audit.cjs` — **11 checks**, fresh two-manager Chromium/Auth/Firestore emulator run. G7c again reports `transferChallenge:window` for both roles. Its accepted baseline includes three screens (`:394–402`), so a pass is not correct Results-stage restoration proof.
- PASS: `tests/browser/shared-journey-reconnect-audit.cjs` — desktop/mobile fixture-backed recovery, replacement authority and terminal non-resurrection. It does not exercise automatic offer discovery or a literal timed physical outage.
- PASS: `tests/browser/r79-reload-hold-audit.cjs` — identity ready at 9,000 ms; loading released at about **9,599 ms**; **36** subsequent frames all WAITING.
- PASS: `tests/firebase/r79-showdown-continues-emulator.cjs` — **11 checks**, mixed three-season total **9–15**, both managers re-read the final history, seven season-1 documents unchanged.
- PASS: Results/guess draft contracts (**10**), career-start-marker (**14**), real-vs-test (**10**), waiting-continuity, Firestore budget (**25**), Journey Reconnect protocol/production, Transfer clock, terminal provider and Hunt1017 terminal-recovery contracts.
- PASS: both-role F1 unchanged-module provider probes, plus fresh-page recovery control. The deliberate retry conflict is the expected reproduced defect, not a passing retry.
- PASS: F2 actual two-manager slow-reload browser probe — both-role frame evidence above; successful same-session continuation after the incorrect Home frames.
- PASS: required `V10_FLASH_BROWSER` / `tests/browser/v10-screen-flash-audit.cjs` — all ten journeys at portrait 390×844, landscape 844×390 and desktop 1920×910, double taps, reduced motion, and additional Club resize/live-preference checks; zero blocking problems. Its ordinary fixtures do not inject the 19-second SDK delay from F2.

All time/fault fixtures are local test instrumentation. No player console use, tampering, production-account operation, billing change or physical-phone suspension is part of these findings. No new duplicate season commit, lost published result or r79 format regression was substantiated. No new P1 or P3 finding is assigned.

The emulator suites ran sequentially against demo projects and the composed production Rules (unchanged blob `13cab80a76979299fcac195da925fa984c51d8a5`). Local dependencies include Firebase SDK 12.17.0, Rules unit testing 5.0.1, Firebase CLI 15.28.1, Playwright 1.62.1 and Chromium bundle 149.0.0. The F1 SDK probe does not supply Rules/physical acceptance evidence. Scratch scripts/logs stay under `work/job1-new/` and are excluded from the PR.

POS20 route: **`POS20_DOC_ONLY`**, zero selected product contracts, required `V10_FLASH_BROWSER`. Only this report belongs in the draft PR.
