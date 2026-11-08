# JOB-8 — Firebase usage in normal two-player play

## Summary

Audited `main` at `9230e33455eae93040317e7553131be34c20da9b`, release **1.9.5-r81**, on 2026-10-20. **Three new P2 findings:** a hidden Transfer expiry timer can keep attempting a refused transition; cold career loading grows with the entire archive; and the per-season budget gate omits billable Rules reads and post-season career traffic. No app code, repository tests, Firebase data, Rules, configuration or deployment changed.

There was no `codex-findings/` directory on main. Also fetched and read every report in the current audit PRs: [JOB-B #958](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/958), [JOB-A #959](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/959), [JOB-1 #960](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/960), and the latest, [JOB-2 #961](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/961). Started with **completed-Showdown storage and career-index traversal**, rather than JOB-2's Settings/account entry. Their double-loading/concurrent-consumer findings, reader key ordering/dependencies, reconnect stalls, JOIN lifetime/rediscovery and stale mode labels are excluded here. F2 concerns the cost of one successful serialized cold load, even after those defects are repaired.

At the supplied **630 reads / 49 writes per season, both players combined**, the arithmetic is comfortable, but it is not a production billing measurement:

| Seasons/day | Measured-style reads/day | Writes/day | Remaining reads / writes |
| --- | ---: | ---: | ---: |
| 14 | 8,820 | 686 | 41,180 / 19,314 |
| 20 | 12,600 | 980 | 37,400 / 19,020 |
| 30 | 18,900 | 1,470 | 31,100 / 18,530 |

**Writes are not the likely first limit at today's rate.** Reads depend on archive size, ordinary waiting/reloads, and Rules evaluation. Do not double these figures for two players. There is no evidence here that 14 seasons currently exceeds Spark, nor enough billing evidence to guarantee 30 across an arbitrarily long career.

## Evidence and counting convention

Searched `js/` for `getDoc`, `getDocs`, `onSnapshot`, `setDoc`, `updateDoc`, `runTransaction`, and `writeBatch`; traced the normal account/pairing/session, setup, transfer, results, commit, history/progression, terminal and career-reader paths, plus their timer/listener callers. Acceptance-only negative probes are outside normal-play cost. Inspected the per-season wrapper and its measurement boundaries in `tests/browser/r79-two-player-journey-audit.cjs`, and the copied meter usage in the r80 audits.

Numbers below distinguish **SDK document requests**, **provider method invocations**, **committed document writes**, and **modeled additional Rules lookups**. They are not interchangeable. SDK fixtures do not measure production billing. Failed writes contribute zero committed writes; successful reads and Rules dependencies can still cost reads on failed operations. Repeated Rules accesses to the same dependency within one request must be deduplicated, not counted once per source-level `get()`.

Temporary probes in `work/job8/` used unchanged production functions. The expiry probe exposed the existing private timer and seeded its page-memory state, with controlled provider responses and clock progression. The career probe used the actual index reader, completed reader, adapter and loader, cloning the repository's valid r79 one-season fixture under distinct synthetic rivalry IDs and recomputing root hashes. No owner accounts or production databases were used.

## Findings

### F1 — P2: the Transfer expiry timer bypasses the hidden-tab pause and can retry a refused transition indefinitely

**Player steps**

1. Either player leaves the live shared Transfer Window open and switches to another tab/app near its 15-minute deadline.
2. The document becomes hidden, but the Transfer screen still lacks the CSS `hidden` class: it remains the selected app screen.
3. If the browser continues running background timers, expiry invokes the mutation while hidden. If the request fails and the held view remains the same expired `WINDOW_OPEN` revision, another attempt becomes eligible every 30 seconds, with no total retry limit or terminal denial latch.

**Cause / file:line:** `js/productionSharedTransferChallenge.js:377` checks shared mode, replay state and the screen's CSS class, but not `document.visibilityState`. Its one-second interval is installed at line 379. `pstcRenderTimer` at lines 287–296 invokes `pstcMutate("advanceExpiredWindow")` after expiry; `EXPIRY_RETRY_MS` is 30,000 at line 12. Neither mutation entry at line 136 nor provider-option resolution at line 90 refuses hidden work. This bypasses the correct hidden guard on the ordinary poll at line 352.

A permission refusal of this expiry mutation takes the special recovery-read/return path at lines 148–150. It is bounded within that call, but the outer timer can invoke a new call on the unchanged revision. Other failures likewise leave the expiry retry eligible. The budget layer's quota backoff still applies; this is not an uncapped loop of successful writes or a quota-pause bypass.

**Reproduction:** while `visibilityState === "hidden"`, the first expiry tick invoked one mutation and two provider reads when the mutation returned `permission-denied`. Advancing the same clock by twenty 30-second steps produced **21 mutation attempts and 42 provider reads**, still at `WINDOW_OPEN`, with zero successful writes. Allowing the next mutation to succeed advanced to `GUESS_ENTRY` while still hidden. Only presentation nodes/provider outcomes were doubled; production timer, mutation and retry decisions were unchanged. Browser timer throttling/freezing can reduce the rate; no physical-phone background rate is claimed. The sustained refusal is controlled fault evidence, not evidence that ordinary healthy expiry is always refused.

**Estimated cost:** a successful hidden expiry makes the one intended phase write; it should not multiply season writes. A sustained failure permits **2 attempts/minute/page**, or **120/hour/page**, while the same expired context survives. In the production provider, an open-window context reads eight documents (`js/sparkSharedTransferChallenge.js:126–134`): a pre-read, attempted mutation and permission-denial recovery read can therefore request **24 documents per cycle before reuse**, plus Setup/Career Start refresh work. That is **480 requested document gets per ten minutes/page**, or 960 for both pages, before reuse and Rules charges. This is an accounting envelope, not a measured billed total: the budget layer coalesces many reads; a failure before mutation costs less; a rejected server write invalidates cached authority (`js/sparkPrivatePairing.js:697–702`) and can force fresh recovery reads. Failed commits add **0 writes**. The probe's 42 counts are provider reads, not 42 billed documents.

**Suggested fix:** pause the expiry timer's network/mutation work while hidden, retain the shared absolute deadline, and perform one authority refresh on visible return. Bound automatic retries for one context/revision; after a genuine refusal, require refreshed authority/reconnection or an explicit retry. Preserve the existing once-only shared transition and concurrent-expiry reconciliation. Add a behavioral test that expires a shared window while hidden, then repeatedly refuses its mutation: the existing hidden checks principally exercise polling/wait listeners, not this separate timer.

### F2 — P2: one cold career visit replays every completed season, serially, and repeats after each page reload

**Player steps:** accumulate real completed Showdowns, reload/open a new tab, then visit History/Legacy, Career Statistics or Trophy Room. A single normal visit is sufficient; no overlapping navigation or repeated tap is required.

**Cause / file:line:** `js/sparkClosedShowdownCareerLoader.js:58` reads the index and lines 64–65 await each indexed Showdown sequentially. Each terminal reader requests its root and setup, then four documents per season, also sequentially (`js/sparkCompletedShowdownReader.js:162–186`). The terminal-record cache is only module memory (`js/sparkClosedShowdownCareerLoader.js:20–23,34–40`); a page reload loses it, as required by the current memory-only architecture. The transaction budget wrapper does not wrap these direct `getDoc` calls (`js/sparkPrivatePairing.js:1007`).

Index traversal also rereads **all sealed index pages** on each load (`js/persistentNikDanielPair.js:132–134`), even on warm visits when completed records are cached. It does not memoize immutable sealed pages. `never-started` entries are not terminal-cache entries (loader lines 20,39), so an ordinary expired/replaced unused invitation left in the index adds another root read on every load. Completed/abandoned entries are cached; healthy warm visits do **not** normally reread the entire career.

**Reproduction:** actual loader/index/reader against valid, fully verified one-season fixtures:

| Completed one-season Showdowns | First load SDK gets | Same-page next load | After clearing page cache | Writes |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 7 | 1 | 7 | 0 |
| 10 | 61 | 1 | 61 | 0 |
| 100 | 601 | 1 | 601 | 0 |

The actual model was `ready` with all entries readable in each case. Cache clearing models a fresh page; this was not a browser reload timing measurement. This deliberately avoids the already-reported reader failures.

**Estimated cost:** per player, let `P` be sealed index pages, `C` completed Showdowns, `S` total seasons in those Showdowns, and `A` other indexed roots that require a status read. One cold load costs **`1 + P + 2C + 4S + A` SDK reads**, plus one cold career marker and up to ten bounded r79 reveal-scan reads where applicable. Multiply by the number of actual cold loads across the two players, not automatically by every screen visit. Warm cost is **`1 + P`**, plus uncached live/never-started/unavailable entries.

Example: 100 completed ten-season Showdowns means **4,201 reads/player/cold load**, before marker/Rules work; one fresh load by each player is **8,402 SDK reads**. Four such paired reload/visit cycles would add 33,608, exceeding the 31,100 raw-read headroom at 30 seasons/day even before Rules reads. That is a longer-career scenario, not today's observed archive size. At 20–30 seasons/day, 1,000 accumulated seasons takes roughly 34–50 playing days. Serial network latency is also material: 601 dependent gets at an illustrative 100 ms each is about 60 seconds, not a measured connection speed. Legacy's 15-second timeout (`js/rivalryLegacyV10.js:66,297–305`) does not cancel the underlying reader, so the read cost can continue after its unavailable frame appears.

**Suggested fix:** immediately reuse immutable sealed index pages within the account/page boundary and bound/concurrently schedule cold detail reads with navigation-aware cancellation between records. For a durable reduction across reloads, consider a compact, Rules-verified completed summary written atomically with finalization, with separately paged season details. That requires explicit schema/integrity proof and some additional writes; do not replace verified totals with browser-trusted counters or enable persistent Firestore caching. Keep immutable-record verification, private membership and fail-closed career filtering. Add increasing-archive tests, including a slow cold load, warm revisit, unused expired code, and navigation away.

### F3 — P2: the season budget test cannot establish the promised daily capacity

**Trigger:** use the passing per-season meter as evidence that 20–30 seasons plus ordinary career visits/reloads will fit the shared 50,000-read allowance.

**Cause / file:line:** `tests/browser/support/firestore-meter.cjs:5–20` explicitly counts client requests and excludes Rules `get()/exists()` dependencies. The budget layer splits a read-only provider operation into separate one-document server transactions (`js/sparkPrivatePairing.js:914,934–945`); reusing the browser's account snapshot does not remove the server's Rules account lookup on another document request. For example, active-account validation fetches the account (`firestore.spark.rules:74–82`); active gameplay grants additionally consult rivalry/membership (`firestore.shared-setup-production.fragment.rules:5–36`). Closed-child reads consult the closed root and active account (`firestore.persistent-pair-production.fragment.rules:514–547`). Dependencies can also be reevaluated for listener activity and failed writes.

The actual season assertion closes its window at **both CLOSED**, then checks career screens afterward (`tests/browser/r79-two-player-journey-audit.cjs:674,690–706`). Those ordinary post-season career reads are outside the asserted total. It asserts one season in a one-season Showdown, with `800` reads / `600` writes as thresholds (lines 68,699–702); later three-season setup/continuation is not another complete 3/5/10-season cost assertion. The r80 real/test/history audits install/print the same meter but do not add an equivalent full-length daily-capacity assertion.

**Estimated cost / implication:** Rules overhead is **additional reads, zero additional writes**. One successful cold read of a closed Showdown with `L` seasons requests `2 + 4L` documents. Modeling one account dependency for the root and root+account dependencies for each of its `1 + 4L` child requests gives **`3 + 8L` additional dependency reads** (deduplicated within each request), or about **`5 + 12L` total reads**. For a one-season record that is approximately **17 billed-style reads versus 6 SDK reads**; for ten seasons, 125 versus 42. This is a source-based dependency model, not a production invoice; alternative grants/evaluation caching may alter the exact bill. Index, marker, listener and other traffic must be added separately.

For the supplied 630-read baseline, the following are the remaining allowances per season if all day traffic is allocated to those seasons:

| Target/day | Maximum total reads/season | Additional reads beyond 630/season |
| ---: | ---: | ---: |
| 14 | 3,571 | 2,941 |
| 20 | 2,500 | 1,870 |
| 30 | 1,666 | 1,036 |

At 30/day an average total multiplier above **2.65×** consumes the read allowance before any extra archive traffic. The closed-reader example exceeds that multiplier for its own path; it does **not** establish that the whole season has that multiplier. Exact whole-day Rules cost remains evidence debt. The write test threshold also permits 600/season: **18,000/day at 30 seasons**, before traffic outside its window, versus today's much lower measured 1,470/day.

**Suggested fix:** retain the SDK meter and add a deduplicated Rules-dependency model per request/path, clearly labeled as modeled. Meter initial entry through post-close Home/career activity; separately account for pre-existing archive loads, visible waits and tab returns. Assert full 1/3/5/10-season journeys and daily totals with a stated reserve for 14,20,30 seasons, then reconcile with actual project usage over an ordinary two-player day. Keep auth/membership/session Rules intact; reducing required integrity checks to make a client-only number smaller would defeat the goal.

## Requested checks without an additional finding

| Path | Verdict / cost |
| --- | --- |
| Home JOIN note | The brief's 20-second polling description is stale. Current r81 has one visible-Home mailbox listener and a **30-second fallback**, with a ten-minute visit limit (`js/persistentNikDanielPair.js:371–404`). Healthy empty watch: about 1 initial server delivery plus changes, 0 writes. Fallback: about 20 reads per full ten-minute visit, 0 writes. Hidden/off-Home detaches; rapid visibility returns are deferred to the 30-second boundary. Existing JOB-2 expiry/rediscovery finding is excluded. |
| Wait-point/authority listener cleanup | Budget listener detaches on hide, pause, release and error (`js/sparkPrivatePairing.js:858–895`); commit's authority context has matching cleanup (`js/productionSharedSeasonCommit.js:180–218,263,290`). It is **not** one listener for the whole app: commit can also watch root/setup/session and up to ten commit addresses (lines 229–238), including future missing commits. This is bounded by configured Showdown length, not all career seasons. Initial deliveries/tab returns cost reads; healthy idle waits have no recurring writes. |
| Session discovery waits | Host checks every **4 seconds**, at most ten minutes (`js/sparkRemoteJoining.js:25,189–206`); peer offer checks every 3 seconds, at most ten minutes (lines 336,374–390). Both skip hidden network work. A full peer wait is about 200 offer reads; host wait up to 150 session reads plus authority reads (roughly 300 root/session SDK reads with own-account/device reuse). These are bounded connection costs, not an unbounded leak. Existing JOB-1 recovery/deadline defects are excluded. |
| Refused ordinary writes | Setup/Career Start/Results/Commit have bounded stale/contention recovery. Terminal progress has bounded rounds and verifies actual concurrent advancement before treating a denial as a race (`js/sparkTerminalClose.js:55–92`). Automatic terminal close does not blindly resubmit on every poll. No additional endless successful-write loop found. F1 is the separate outer expiry timer. |
| Active seasons/history | Progression scans at most the configured 1/3/5/10 commit addresses; history reconstructs the accepted prefix. The budget memo keeps immutable published results/acknowledged commits (`js/sparkPrivatePairing.js:731–740`), so repeated logical history reads are not automatically repeated billed reads. Fresh runtimes reread the prefix. CPU/hash/projection work grows with accepted seasons but the per-Showdown bound is ten; F2 is the unbounded cross-Showdown archive. |
| Reads on every render | Normal pure career conversions render supplied models without Firestore calls. No new per-render database loop established. JOB-B already covers binder-triggered loads, overlapping consumers and redundant mounts. |
| Account/device reload registration | Existing account/device registration returns without rewriting an existing record (`js/sparkAccountBootstrap.js:110–123`; `js/sparkPrivatePairing.js:224–230`). Roughly two bootstrap document reads, zero registration writes for an already registered browser, before the separate continuation reads. No every-reload `lastSeenAt` write found. |

## Validation and limits

- PASS: `tests/contracts/firestore-budget-contracts.cjs` — 25 checks, including Home JOIN listener/fallback, visibility, coalescing and quota backoff.
- PASS: `tests/contracts/waiting-reads-contracts.cjs` and `tests/contracts/waiting-continuity-contracts.cjs` — actual Results/Commit/background timer controllers with fixture providers; healthy ten-minute waits, listener failures, hidden returns and authority changes. Their passing hidden tests do not cover F1's expired Transfer timer.
- PASS: `tests/contracts/terminal-close-progress-race-denied-contracts.cjs` — plain SDK and budget-wrapped denial recovery, including finalization races.
- PASS: `tests/contracts/closed-showdown-adapter-contracts.cjs` — 25 cases; `completed-showdown-read-contracts.cjs`; `shared-transfer-challenge-provider-contracts.cjs`; `job-1058-transfer-clock-contracts.cjs`.
- PASS: temporary expiry and archive-cost probes described above. Initial expiry-probe attempts needed missing presentation-node doubles; the completed probe passed without changing production functions.
- POS20 impact route: **`POS20_DOC_ONLY`**, zero selected product contracts. Required `V10_FLASH_BROWSER` was attempted twice but **did not complete successfully**. The first run passed portrait journeys, double taps and reduced motion, then Chromium closed before creating the next viewport page. The supported `CMS_CHROMIUM_MULTI_CONTEXT=1` rerun passed the portrait journeys/double taps, then failed `reduced-motion finalWinner: required fixture journey did not open` at `tests/browser/v10-screen-flash-audit.cjs:357`. No test assertions, app behavior or motion settings were weakened to obtain a pass. This leaves visual-proof evidence incomplete; neither run establishes a new Firebase finding. Reports/logs remain in `work/job8/`, outside this PR.

No new full emulator season journey or production billing capture was performed. The supplied 630/49 figure is an input, not a fresh measurement. Modeled read costs are estimates; successful cold-load SDK counts and the isolated timer behavior were reproduced. Firebase remains Spark-only, Billing OFF, App Check enforcement OFF and Firestore memory-only. No integrity or smoothness tradeoff was applied to the app.
