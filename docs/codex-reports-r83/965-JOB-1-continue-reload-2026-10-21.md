Two new P2 continuation defects: a failed resume changes Home to START/JOIN, and one interrupted Final Winner detail read never recovers within that page; no new P1/data-loss defect established.

## Scope and prior findings

Audited `main` **9230e33455eae93040317e7553131be34c20da9b**, release **1.9.5-r81**, on **2026-10-21**. Daniel = `playerOne`; Nik = `playerTwo`. Only ordinary play, reload, tab closure, connection interruption, phone sleep and device/browser changes are in scope. App code, repository tests, Rules and production data are unchanged.

`codex-findings/` did not exist on main. Before selecting new findings, also fetched and read all seven findings files in open draft PRs [#958](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/958), [#959](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/959), [#960](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/960), [#961](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/961), [#962](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/962), [#963](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/963) and [#964](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/964). Their reported defects are excluded. This includes the earlier JOB-1's offer-read/session split, ten-minute connection-wait stall, signing-selector draft correction and backwards Results/acknowledgement resume. The completed-reader map-order fix in #957 is also excluded.

Started this pass with **Career Start acknowledgement/readiness and subsequent stage handoffs**, rather than the latest report's completed-career aggregation or the earlier JOB-1's second-device/session-offer entry. Read all seven requested implementation files and all four requested audits; followed production callers into identity, persistent pairing, Transfer, Results, Commit, progression and Final Winner. The two findings below have different causes from the earlier reports.

## F1 — P2: a failed CONTINUE changes an active game's Home tile to START or JOIN

**Player steps**

1. Daniel or Nik has an unfinished, ACTIVE Showdown. Go to Showdown Home; its upper tile correctly says **CONTINUE SHOWDOWN**.
2. Tap **CONTINUE CAREER** while the connection is briefly failing or recovering. The initial pair read can succeed, but the subsequent device/rivalry attachment read fails with `unavailable`.
3. Stay on Home. If continuing through the upper tile instead opened the connection fallback, dismiss that layer to see Home.
4. Daniel now sees **START A SHOWDOWN** / “Choose seasons and create the code”; Nik sees **JOIN DANIEL'S SHOWDOWN** / “Paste Daniel's code”. The same rivalry is still ACTIVE. A later successful recheck can recover the correct wording.

**Cause / exact locations:** `js/onlinePlayerIdentity.js:105` returns `pair.continuePair()` directly from CONTINUE CAREER. The actual attach performs server transaction reads at `js/sparkConnectedRivalry.js:448–452` and returns a read failure at `:466–467`. `js/persistentNikDanielPair.js:275` catches that failure and publishes `status:"error"`, retaining `connectionState:"active"` and `rivalryId`. The Home subscription redraws immediately, but `liveHomeTile()` recognizes only `paired`, `continuing` and `recovery-required` for that active rivalry (`js/onlinePlayerIdentity.js:43`). The error state falls through to Daniel's START default (`:57`) or Nik's JOIN default (`:51`). The season chip still regards the game as current (`:50`), making the screen internally inconsistent.

For CONTINUE CAREER, the internal catch resolves rather than rejecting to the outer error reporter (`js/onlinePlayerIdentity.js:105`). The pair's retry message is rendered into Connect Players (`js/persistentNikDanielPair.js:533`), which need not be open on this path. The upper tile's continuation fallback does open that layer (`js/productionSharedJourneyEntry.js:259–271`); that does not correct the Home label underneath it.

**Reproduction:** an isolated VM runs the unchanged persistent-pair initializer, `continuePair()`, pair subscription and actual identity Home renderer for each manager. Valid active pair/slot fixtures are readable; only the subsequent attach returns a transient network failure. No pair status is manually changed. Observed:

| Manager | Before | During | After attach failure | Rivalry |
| --- | --- | --- | --- | --- |
| Daniel | CONTINUE SHOWDOWN | CONTINUE SHOWDOWN | START A SHOWDOWN | Same ID, ACTIVE |
| Nik | CONTINUE SHOWDOWN | CONTINUE SHOWDOWN | JOIN DANIEL'S SHOWDOWN | Same ID, ACTIVE |

This is a wrong resume affordance, not proof of a second Showdown being created: the eventual tap still checks provider authority. Unlike earlier JOB-1 F1, no offer read fails and no replacement session is hosted.

**Suggested fix:** keep an acknowledged live rivalry's CONTINUE/LOAD wording for retryable continuation errors, and show its retry/reconnect reason on Home. Base that affordance on the retained active rivalry, with an explicit error state, rather than falling through to new-game actions. Continue to reauthorize before entry. Extend the frame audit to fail a real continuation read after the pair was discovered, for both managers.

## F2 — P2: one failed Final Winner history read leaves its details unavailable after reconnection

**Player steps**

1. In the final season of a multi-season Showdown, Nik puts his phone to sleep before its complete final history has arrived. Daniel finishes the shared flow and closes the Showdown automatically. Either manager can be the lagging device.
2. Nik wakes. Reading the closed root succeeds, but the connection drops again during the separate completed-history/detail read.
3. Restore connectivity and remain on Final Winner. Its winner and overall totals are available, but the final-season score and trophy counts stay **—**, with “Trophy attribution is unavailable right now.”
4. Further terminal/history notifications and screen redraws do not retry that read. There is no detail retry control. The saved season results remain intact; this is persistent missing presentation data for that page.

**Cause / exact locations:** the other manager's terminal close is a real supported path: `js/productionSharedTerminalClose.js:210` forgets the session and publishes CLOSED from the terminal read; `js/persistentNikDanielPair.js:542–550` retains the closed rivalry until Home because Final Winner still uses it. The partner-close fallback uses the closed witness even when this phone never reconciled (`js/productionSharedFinalReconciliation.js:47–63`). The adapter specifically handles a partner closing before this phone's final history converges (`js/seasonFinalV10.js:2021–2025`), and renders the final frame on the existing Season Entry route (`:1985–1992`).

`sfClosedHistory()` inserts its entry into `closedHistoryReads` **before** attempting the read (`js/seasonFinalV10.js:2027–2029`). Only a completed result fills `entry.history` (`:2036–2037`); an unavailable result, rejected promise or early service-readiness return leaves it null. Failure is swallowed and wakes the renderer (`:2038`). Every subsequent call finds that existing entry and returns null without another attempt (`:2027`, `:2040`). `seasonSource()` keeps selecting it when neither live nor retained history covers the closed witness (`:2043–2045`). The partial frame preserves winner/totals but lacks season/trophy attribution (`:29–37`). There is no online/visible retry registered for this cache in `:2074–2076`.

**Reproduction:** an isolated probe uses the unchanged registered production frame source and real Final Winner renderer, with a valid three-season projection and an older converged prefix. The completed-reader boundary returns `unavailable` once, then becomes healthy:

| Observation | Completed-reader calls | Frame | Final-season Daniel score | Daniel trophies |
| --- | ---: | --- | --- | --- |
| First detail read fails | 1 | partial | — | — |
| Service restored; ten cycles of online/terminal/screen notifications and frame evaluation | 1 | partial | — | — |
| Fresh module runtime with the same closed witness and healthy service | 1 | ready | 9 | 7 |

The last row is a control proving the valid details can be read, not a claim that an ordinary reload automatically returns to Final Winner. The existing late-data test explicitly expects even `status:"unavailable"` to receive no retry (`tests/contracts/final-cells-late-data-contracts.cjs:114–122`); successful late arrival is tested separately (`:73–87`). It does not test failure followed by connectivity recovery.

This is independent of #964's marker/reveal cache: no career marker scan is involved. It also reproduces with reader protocols available and valid result ordering, independently of #957/#959.

**Suggested fix:** retain successful immutable completed history, but distinguish in-flight, successful and transiently failed attempts. Retry a transient failure with bounded backoff on online/visible return or an explicit RETRY DETAILS action. Keep partial data honest until the full witness-bound history verifies. Update the late-data contract to preserve no-repeat reads after success while requiring eventual recovery after an unavailable read.

## Requested stage paths: Daniel and Nik

“State survives” below means persisted facts can be recovered; it is not a claim of exact screen restoration. Known defects are linked rather than reported again. Findings F1/F2 apply when their specific failure occurs.

| Reload/return stage | Daniel (`playerOne`) | Nik (`playerTwo`) | Evidence / file:line |
| --- | --- | --- | --- |
| Career Start before own acknowledgement | Assigned club and own confirmation recover. | Same, with Nik's assigned club. | Entry selects confirmed setup at `js/productionSharedJourneyEntry.js:381–383`; role-specific rendering at `js/productionSharedCareerStart.js:154–160`. |
| Career Start after own acknowledgement, waiting | Existing own acknowledgement is read; another write is unnecessary. | Same role-scoped check. | `js/productionSharedCareerStart.js:89–103`; after both attest, `:63–65` opens Transfer. |
| Transfer Challenge | Shared phase, timer deadline and locked facts survive. | Same; actions remain role-scoped. | Read/open at `js/productionSharedTransferChallenge.js:337`; waiting-phase selection at `:358–364`; visible-return clock invalidation at `:378`. Earlier replay/signing defects remain excluded under #960. |
| Season Results entry/review | Same-browser draft survives; review must be repeated after a fresh runtime. | Same. | Draft context/storage at `js/productionSharedSeasonResults.js:110–128`; review intent at `:169–171`. Exact-stage restoration has the existing #960 F4 limitation. |
| Own result published, waiting for rival | Provider result survives; read-before-publish avoids resubmission. | Same. | `js/productionSharedSeasonResults.js:183–196`; restored published UI at `:154–157`. Existing #960 F4 screen restoration remains excluded. |
| Commit / acknowledge | Existing commit and own acknowledgement are recognized. Interrupted coordinator second-half acknowledgement can be completed. | Existing commit exposes Nik's remaining acknowledgement, or recognizes it already recorded. | `js/productionSharedSeasonCommit.js:155–184`; no new duplicate commit/acknowledgement established. Existing #960 F4 screen restoration remains excluded. |
| Final Winner | Closed witness preserves winner/overall totals. Normal reload returns Home rather than reopening gameplay; F2 affects a lagging phone's detail recovery while Final Winner remains open. | Same. | Terminal read `js/productionSharedTerminalClose.js:196–210`; frame `js/seasonFinalV10.js:24–39`; reload completion guard `js/onlinePlayerIdentity.js:14` and `js/productionSharedJourneyEntry.js:483`. Archived career-reader defects remain excluded. |

## Other requested paths and paths found fine

| Path | Verdict and exact boundary |
| --- | --- |
| Lose network for 30 seconds, return within an established session | No new duration-specific state-loss defect found. Recovery invalidates an in-flight generation on offline and wakes on online/visible return (`js/productionSharedJourneyReconnect.js:138–145`, `:194–206`); writes still need exact active authority (`:165–168`, `:180–182`). F1 can show incorrect Home labels when a continuation read fails; F2 can retain missing final details. Earlier #960 session-discovery failures remain excluded. |
| Lose network / sleep for ten minutes, return within an established session | Ten minutes alone does not expire the roughly four-hour session (`js/sparkRemoteJoining.js:19–25`). Durable progression is separate from session authority (`js/sharedJourneyReconnect.js:84–105`, `:154–169`). Transfer reanchors its clock on visible return (`js/productionSharedTransferChallenge.js:378`). This source/protocol conclusion is distinct from a literal ten-minute physical-phone run. The previously reported replacement-connection waiting deadline (#960 F2) is not called fine. |
| Both reload simultaneously | With a readable unexpired shared offer, both can adopt the same ACTIVE session through a read, without joining it again or publishing a season (`js/sparkRemoteJoining.js:362–366`, `:469–473`). No new simultaneous-reload write duplication found. Existing #960 screen/offer-read exceptions still apply. |
| r79: season 1 accepted, continue on r80 | No new format/data-loss defect found. Actual r79 fixture resumes season 2 after connection replacement (`tests/firebase/r79-showdown-continues-emulator.cjs:126–139`), completes mixed old/new seasons (`:142–174`), preserves all old season-1 bytes (`:176`), and reopens the completed history (`:179–196`). This exercises providers on today's checkout; it is not a historical r80 browser-asset run. |
| Second device/browser mid-season | Provider slot supplies the same save/profile/role, and a local gameplay shell is adopted (`js/persistentNikDanielPair.js:211–214`, `:228`, `:275`). Account-bound session adoption works (`js/sparkRemoteJoining.js:362–366`); attachment rechecks device and rivalry (`js/sparkConnectedRivalry.js:438–452`). Unpublished drafts remain local to the original browser (`js/productionSharedSeasonResults.js:110–128`); published facts are shared. No new cross-manager binding defect established; F1 can mislabel a failed attempt. |
| Career real/test boundary while continuing | Existing ACTIVE continuation follows the live rivalry before new-career creation (`js/productionSharedJourneyEntry.js:259–275`, `:290–293`); only new creation invokes the real/test gate (`js/showdownModes.js:167–201`), and the marker's creation transaction refuses an unfinished rivalry (`js/careerStartMarker.js:177–199`). No new marker mutation or accepted-season reset found. Earlier stale-mode/reader/filtering findings remain excluded. |
| START/JOIN during resume | Healthy paths retain CONTINUE/CHECKING in the existing r80 frame audit (`tests/browser/r80-resume-active-audit.cjs:252–254`, `:361–402`). **F1 establishes the uncovered error path**, for both managers. The reload-hold audit covers nine-second identity restoration, not arbitrary delays (`tests/browser/r79-reload-hold-audit.cjs:13`, `:79–83`). |

## Validation and limits

Evidence combines source tracing, unchanged-module fault probes and the repository audits. Fault probes use valid fixture state and control network/provider outcomes; they are not production-account or physical-phone recordings. No new duplicate season commit, lost published result or r79 format regression was substantiated. No new P1 or P3 finding is assigned.

- PASS: unchanged persistent-pair → failed attach → identity Home renderer probe, separately for Daniel and Nik; actual subscriptions observed `paired → continuing → error` while preserving the ACTIVE rivalry.
- PASS: unchanged Final Winner frame/renderer failure-then-recovery probe and healthy fresh-runtime control, as recorded under F2.
- PASS: actual progression/reconnect protocols with a valid accepted-season projection, both roles, and controlled 30-second/600-second clock advances: same session, same accepted prefix, active season 2, no provider/local-storage writes. This checks duration boundaries without claiming physical suspension or real-time ten-minute network testing.
- PASS: Results deterministic and production contracts, Commit deterministic contracts, Multi Season deterministic contracts.
- PASS: Journey Reconnect deterministic and production contracts; `final-cells-late-data-contracts.cjs` (its passing unavailable/no-retry expectation is the F2 coverage gap).
- PASS: `tests/browser/r80-resume-active-audit.cjs` — **11 checks**, real two-manager Chromium contexts with Auth/Firestore emulators and composed production Rules. Its Results references were `transferChallenge:window` for both managers, the existing #960 F4 behavior, not proof of correct Results landing.
- PASS: `tests/browser/shared-journey-reconnect-audit.cjs` — desktop/mobile fixture-backed recovery, replacement authority and terminal non-resurrection.
- PASS: `tests/browser/r79-reload-hold-audit.cjs` — identity restored at 9,000 ms; loading released at about **9,635 ms**, with **33** subsequent frames all WAITING over the locked wheel.
- PASS: `tests/firebase/r79-showdown-continues-emulator.cjs` — **11 checks**, all **7** original season-1 documents byte-identical; mixed three-season history reverified for both managers at **9–15**.
- PASS: required `V10_FLASH_BROWSER` / `tests/browser/v10-screen-flash-audit.cjs` — **30** screen journeys across portrait, landscape and desktop, **1,285** frames, plus four Club motion contexts; zero blocking problems. Tap-feedback observations were nonblocking and outside these findings.

The two emulator suites ran sequentially against demo projects. Versions: Node 24.19.0, Firebase SDK 12.17.0, Rules unit testing 5.0.1, Firebase CLI 15.28.1, Firestore emulator 1.22.0, Playwright 1.62.1, Chromium bundle 149.0.0. Dependencies and generated logs/artifacts remained ignored or under `/tmp`; no tracked app/test/package/Rules file changed. All test servers/emulators were stopped afterward.

The r80 audit's Results check accepts `seasonEntry`, `transferChallenge` or `dashboard` as its reload baseline (`tests/browser/r80-resume-active-audit.cjs:394–402`); a pass does not establish correct-stage restoration. The isolated Journey Reconnect browser audit supplies its identity/setup/progression/session fixtures (`tests/browser/shared-journey-reconnect-audit.cjs:57–67`) and tests offline recovery after constructing a recovered state (`:165–180`), rather than real offer discovery or a timed physical outage. These limits do not negate its useful protocol checks.

Compared the r80 release commit `f4481e15` with the audited head: Entry, reconnect, session, Career Start, Transfer, Results, Commit, history/progression/final/terminal providers and the composed Rules used by the continuation test are unchanged. The r81 marker-reveal change is separate. This strengthens the provider compatibility conclusion for r80 without claiming a new historical-browser or production-account run.

POS20 impact route: `POS20_DOC_ONLY`, no selected product contracts, required `V10_FLASH_BROWSER`. Only this report is intended for the draft PR.
