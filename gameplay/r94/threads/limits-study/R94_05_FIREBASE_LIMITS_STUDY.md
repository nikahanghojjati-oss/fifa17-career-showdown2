# R94-05 · Firebase limits headroom · STUDY

Read-only study, 2026-11-16. Brief: `R94_05_FIREBASE_LIMITS_STUDY_BRIEF.md`.
Measured on **`gameplay/r94` at `d4ceae69d7f33d677343db724da9d9a0f16123fe`** (2.6.0 main 5c5472f6 + crests + R94-02 PR 1 #1498). Composed Rules 194,269 bytes, sha256 `4cb7b878…` (the same one the client's lookup table is pinned to).
No game code was changed and nothing was committed to `gameplay/r94` or `main`. No production Firestore was read. Scratch tools and raw results are on branch `claude-gameplay/r94-limits-study` under `gameplay/r94/threads/limits-study/`.

---

## 1. Plain answer for Nik

1. **The daily read allowance (50,000 a day) is the only limit you can hit by playing.** Every other limit has room, and none of them gets tighter the longer you play.
2. **The free day holds about 40 to 55 seasons of play**, whatever the Showdown length: about 41 one-season Showdowns, or about 46 seasons in 3-season Showdowns, or about 49 to 58 seasons in 10-season Showdowns. Your aim is 20 to 30, so there is room, but it is the limit with the least room.
3. **A phone left open does not drain it.** Screen off or app in the background: 0 reads. Screen on and waiting for the other manager: 0 on Season Results, 400 reads an hour at most in Transfer War. Unlocking the phone: about 13 reads each time.
4. **Saves (the per-action limits) are tight but fixed.** JOIN sits at 904 of 1,000 and CONFIRM SEASON at 898 of 1,000 and 8 of 10 lookups. They cost the same in season 10 as in season 2, so they can only break when we change the Rules, never by playing.
5. **Our own list caps have room.** The squad lists reach at most 58 of 100 and 60 of 150 after 10 seasons of the heaviest transfer play.
6. **The 500th Showdown is safe.** History turns a page at 500 Showdowns; I replayed START and JOIN at that point with the real game code and both save.
7. **Nothing found needs a fix before the next release.** Section 3 lists small guard jobs for Opus and one number for you to read in the Firebase console.

---

## 2. Table per limit

"Worst" is the highest value I could reach with normal play on the SHA above. Headroom = spare share of the cap.

### 2a. Daily limits (Spark, reset 3 am Boston)

| Limit | Cap | Our worst | Headroom | Screen | Grows with play | Proof |
|---|---|---|---|---|---|---|
| Reads a day (documents + Rules lookups, both phones) | 50,000 | 1,216 for a one-season Showdown; 3,235 for three seasons (1,614 + 987 + 634); about 860 to 1,010 a season at length 10 | 41 to 58 seasons a day against an aim of 20 to 30: **room 1.4 to 2.9 times the aim** | Whole Showdown; START, JOIN and setup are the dear part | Per season played, not per season number | CE2PG budget runs, `results/idle-run-3-seasons.log`, `results/one-season.log` |
| Writes a day | 20,000 | 85 for a one-season Showdown; 203 for three seasons (117 + 58 + 28) | about 235 to 295 seasons a day: 8 times the aim | Whole Showdown | Per season played | same runs |
| Deletes a day | 20,000 | 0 | 100% | none (no Rules path allows a delete) | no | Rules read: no `allow delete` on any play path |
| Stored data | 1 GiB | about 35 to 100 KB per season (estimate) | years (UNSURE, see P3-3) | every save; nothing is ever deleted | yes, slowly | `results/storage-10-season-journey.json` |

### 2b. Per-save limits (Firestore Rules)

| Limit | Cap | Our worst | Headroom | Screen | Grows with play | Proof |
|---|---|---|---|---|---|---|
| Rules checks for one saved document | 1,000 | 904 | 9.6% | JOIN on Home | no | R93-08 baseline; re-measured at a full History page |
|  |  | 898 | 10.2% | CONFIRM SEASON | no (866 in the plain journey, 898 worst across the suites; the same in every season) | baseline + 10-season journey |
|  |  | 857 | 14.3% | season totals after CONFIRM, END SHOWDOWN | steps 829, 845, 851 in the first seasons, then flat; 857 with Sacked | 10-season journey |
|  |  | 848 | 15.2% | reconnect (session back to active) | no | baseline |
|  |  | 839 to 842 | 15.8% | LOCK guesses, LOCK MY SIGNINGS | no | baseline (R93-07 fix holds) |
|  |  | 826 | 17.4% | START of a Transfer War | 804 in season 1, 826 from season 2, then flat | 10-season journey |
|  |  | 811 | 18.9% | Club Assignment, second confirm (new `stops`) | no | club-draw suite |
| Lookups for one saved document | 10 | 8 | 20% (2 spare) | CONFIRM SEASON | no | lookup sweep |
|  |  | 7 | 30% | START of a Transfer War | no | lookup sweep |
|  |  | 5 | 50% | END SHOWDOWN, PUBLISH results, setup open, JOIN | no | lookup sweep |
| Lookups for one whole save (several documents) | 20 | 9 | 55% | JOIN when History turns a page (every 500 Showdowns) | no | page-roll probe |
|  |  | 8 | 60% | JOIN, START of a Transfer War | no | lookup sweep |
| Lookups for one read | 10 | 3 | 70% | any | no | Rules read |
| Rules file size | 256 KB | 194,269 bytes | 26% | deploy only | no (grows per release) | build output |
| Stored rulesets | 2,500 | about 35 (one per Rules deploy; 35 successful deploy runs on GitHub) | 98% | deploy only | no | GitHub Actions run count |

### 2c. Our own caps

| Limit | Cap | Our worst after 10 seasons | Headroom | Screen | Grows with play | Proof |
|---|---|---|---|---|---|---|
| Squad sheet departures (`outNames`) | 100 | 58 measured; hard bound about 63 (33 club men + kept signing rows) | 42% | Squad LOCK | yes, up to the bound | `tools/squad-lists-fuzz.cjs`: 400 careers, 7,600 locked screens, 0 refused |
| Squad sheet ratings (`ovNames`) | 150 | 60 | 60% | Squad LOCK | yes, up to the same bound | same |
| Squad sheet fixed lists (names, numbers, signed) | exactly 18 | 18 | fixed shape | Squad LOCK | no | Rules read |
| Squad sheet document size | 1 MiB | 7,176 bytes | 99% | Squad LOCK | yes, to the bound | same fuzz |
| History index page | 500 Showdowns a page | turns a page, then starts again at 1 | no wall | START, JOIN | yes, one entry per Showdown started | `results/index-roll-*.{txt,jsonl}` |
| Career summary payload | 262,144 characters | about 12,000 for a 10-season Showdown | 95% | end of a Showdown | no (one summary per Showdown, fixed shape) | code read + size of the reader state |
| "Reads today" meter values | 1,000,000 (game, career), 100,000 (one cost), 3 cost rows | below 50,000 by definition (they are daily counts) | 95% | Settings | no (resets daily) | code read |
| Guess rows, signing rows | 3 | 3 by design | fixed shape | Transfer War | no | Rules read |
| Signing name length | 80 characters | typed or picked name | fixed shape | Transfer War | no | Rules read |
| Chamber Men kicks | 14 | 14 by design (7 each) | fixed shape | Chamber Men | no | Rules read |
| Seasons and rounds lists | 10 | 10 (longest Showdown) | fixed shape | whole Showdown | no | Rules read |
| Setup ledger revisions, `stops` | 6 revisions, 2 stops | 6 and 2 by design | fixed shape | Club Assignment | no | Rules read |
| League goals typed | 300 | the client refuses over 300 with its own message before saving | n/a | Season Results | no | `productionSharedSeasonResults.js:123` |
| Prime Pack tokens | 2 each | 2 | fixed shape | Prime Pack | no | Rules read |
| Session life | 4 hours | client asks for 3 h 59 min | fixed | whole Showdown | no | `sparkRemoteJoining.js:23` |

Nothing in 2c can pass 80% of its cap through play. The only two lists that grow (squad departures and ratings) stop at about 63.

---

## 3. Ranked findings

**P1: none. P2: none.** No replay failed and nothing measured over a hard limit on this SHA.

### P3-1 · The lookup limit has no guard (CONFIRM SEASON uses 8 of 10)
- What: the Gate's sweep measures Rules checks (the 1,000 limit) but nothing measures lookups. CONFIRM SEASON (season commit create) reads 8 other documents: setup, public results, both private results, rivalry, account, device, session. Three more lookups in that rule and every CONFIRM SEASON is refused, in every season, for everyone.
- Proof: `tools/lookup-sweep.cjs` on the SHA: `create rivalries/*/seasonCommits/season_N [COMMITTED]` = 8 of 10. `results/probe-caps.txt`: the emulator allows 10 and refuses 11 (single document, transaction and get), allows 20 and refuses 21 (batch and transaction).
- Replay: `npx firebase-tools@15.28.1 emulators:exec --only firestore --project demo-lk "node gameplay/r94/threads/limits-study/tools/lookup-sweep.cjs"` (about 25 minutes; `LK_ONLY=two-manager` for the journey alone, about 4 minutes).
- Suggested fix (Opus, small, tests only): add the lookup measurement to the R93-08 sweep (same recorder, the pad swapped for `exists()` calls, as in `tools/lookup-recorder.cjs`), with a baseline per kind and a bar of 8 per document and 16 per request. No Rules change.

### P3-2 · JOIN at a full History page is not covered by any test
- What: when a manager's History index holds 500 Showdowns, the next START or JOIN also writes a sealed page. The suite covers Daniel's START at that point (G5) and the sweep baseline has it (720). Nik's JOIN at that point is in no test and not in the sweep baseline. It is the dearest save in the game (904) plus one more document.
- Measured here, it is fine: Rules level and the real client code (`sparkPrivatePairing.js` + `persistentNikDanielPair.js`) both save at 499 and at 500 entries for START and JOIN; both managers then read back 501 Showdowns in order. JOIN at the page turn: 904 checks on the worst document (unchanged), index head 720, sealed page 376, 9 of 20 lookups. A 500-entry index head is 36.5 KB.
- Replay: `node gameplay/r94/threads/limits-study/tools/make-index-roll-probe.cjs`, then run `tests/firebase/r94-index-roll-probe.cjs` under the emulator (plain, or with `-r tests/support/rules-budget-recorder.cjs`, or with `-r gameplay/r94/threads/limits-study/tools/lookup-recorder.cjs`).
- Suggested fix (Opus, small, tests only): add "redemption at capacity seals page_1" next to G5 in `career-index-emulator.cjs`, and a provider-level case at a full head, so the sweep baseline gains the kind. Note for later: `careerStartMarker.planCreate` refuses a paged index ("This career is too long to mark from here"); that write happens once per career and already exists for both managers, so it is not a play risk.

### P3-3 · Stored data only grows (UNSURE, far away)
- What: no Rules path allows a delete, so every Showdown stays forever. One season stores about 35 KB of documents (10-season Rules journey: 124 documents, 181 KB as JSON; squad sheets up to 7 KB each on top). With Firestore's automatic indexes the true figure is somewhere between 35 and 100 KB a season, so 1 GiB is 10,000 to 30,000 seasons: years at 20 seasons a day. At 1 GiB Spark refuses every write and the game cannot clean up by itself.
- UNSURE because the index overhead cannot be measured on the emulator and production may not be read by automation. One look by Nik settles it: Firebase console, Firestore, Usage, "Storage". If that number is under 100 MB there is nothing to do this year.
- Suggested fix: none now. If the console number is high: an owner-only archive job (Opus, medium).

### P3-4 · Chamber Men and Prime Pack fallback poll has no hidden-tab stop (UNSURE)
- What: both screens wait on a live listener. If the listener module cannot be loaded they fall back to a transaction read every 2.5 s (`chamberMenStep.js:165`, `iconGuessStep.js:129`). The Squad screen's fallback checks `visibilityState` (`squadSheetStep.js:147`); these two do not. Worst case if ever reached: 1,440 document reads an hour per phone while that screen is open (the browser slows hidden timers, so less in the background).
- UNSURE: I did not reach the fallback in any run (the listener loaded every time; listeners attached 9 to 12 per phone). Not proven reachable in normal play.
- Suggested fix (Opus, small): the same one-line hidden check the Squad fallback has, plus a contract.

---

## 4. Part 1 detail: lookups per save

Method: the R93-08 recorder with the pad changed from expressions to lookups (`tools/lookup-recorder.cjs`). Every write of the sweep's 11 flows (10-season journey, lock budget, Prime Pack 10 seasons, Sacked, Europa League, Chamber Men, squad sheets, pairing provider, Terminal Close, career index, club draw) is replayed on copies of the composed Rules that add k extra `exists()` calls, either on two extra pad documents (whole request, cap 20) or in front of one written document (cap 10). The largest k that still saves gives used = cap minus k. All 45 kinds of the R93-08 baseline were measured; the full table is in the appendix.

What the emulator enforces (`results/probe-caps.txt`):
- one document: 10 distinct lookups allowed, 11 refused; the same path looked up 12 times counts once;
- `exists()`/`get()` and `getAfter()`/`existsAfter()` of the same path count as two;
- batch and transaction: 20 allowed, 21 refused; a path looked up from several documents of one request counts once;
- single get: 10 allowed, 11 refused;
- **instrument gap:** a list (query) with 11 lookups was allowed. The game's play reads are single gets and listeners, so this does not change any number here, but the emulator cannot prove a query cap.
- The 1,000-check limit is per written document, not per request (300 + 300 in one batch saves; 330 alone is refused).

The measured numbers match a hand count of the Rules for the three worst kinds (CONFIRM SEASON 8, START of a Transfer War 7, END SHOWDOWN 5). For documents already near 1,000 checks (JOIN's rivalry document) the per-document figure is an upper bound, because the pad itself costs checks; the whole-request figure is exact.

Run note: under the lookup recorder `career-index-emulator.cjs` stopped at its provider section with an emulator 500 (one REST copy failed); its kinds were measured by the page-roll probe instead, which covers first-ever, append and page-turn for START and JOIN.

## 5. Part 3 detail: daily reads in real life

All numbers are billed reads (documents + Rules lookups) for both phones together, from two emulated phones playing through the real pages (CE2PG budget mode, `tests/browser/support/billed-meter.cjs`). The run passed 80 of 80 checks. Raw log: `results/idle-run-3-seasons.log`.

### 5a. What play costs

| Part of a Showdown | Billed reads | Writes | Note |
|---|---|---|---|
| Season 1 (with START, JOIN, setup, Club Assignment) | 1,614 | 117 | 544 documents + 572 lookups on reads + 498 lookups on writes |
| A middle season | 987 here; 793 in the 2.6.0 release run | 58 | this run added six unlock probes (64 reads) and the harness reloads both phones in season 2 |
| The last season (with END, final screen, career pages) | 634 | 28 | |
| **One-season Showdown, start to Home** | **1,216** | 85 | cheaper than season 1 above because nothing is prepared for a season 2 (no Chamber Men, Russian roulette, Prime Pack or Squad after the results) |

Seasons a day the free 50,000 allows, by how Nik and Daniel play (play only, no margin):

| Pattern | Reads per Showdown | Showdowns a day | Seasons a day |
|---|---|---|---|
| One-season Showdowns | 1,216 | 41 | 41 |
| Three-season Showdowns | 3,235 measured here (2,873 in the 2.6.0 run) | 15 to 17 | 46 to 52 |
| Ten-season Showdowns | about 8,600 to 10,100 (1,614 + 8 middle seasons + 634; not played here) | 5 | 49 to 58 |

With the waits priced at Nik's slowest pace (40 minutes of Transfer War and 90 minutes of results per season, phones on) the same three seasons are 3,723 (1,710 + 1,283 + 730): 40 seasons a day. The Gate's own budget check (`zz.billed`, 45,000 over at most 25 seasons a day) passed at the slow, mid and fast pace.

Writes are never the limit: 203 writes for three seasons is about 295 seasons a day.

### 5b. What an idle phone costs

| State | Billed reads | Per hour, both phones | Measured |
|---|---|---|---|
| Screen off or app in the background, any screen | 0 in 2 minutes, at Transfer War, Season Results, CONTINUE, final screen and Home | **0** | 5 windows |
| Screen on, Season Results (before and after PUBLISH), CONFIRM, CONTINUE waits | 0 a minute once settled (14 to 43 in the first minute after arriving) | **0** | budget samples, 3 seasons |
| Screen on, Transfer War clock | 2.7 a minute | **160** | same |
| Screen on, waiting on the guesses | 4 a minute (Daniel's phone) | **240** | same |
| Screen on, waiting on the signings | 6.7 a minute | **400** (the worst steady rate found) | same |
| Screen on, final screen after the Showdown | 6 in 2 minutes (each phone reads the other's "reads today" meter) | **not a steady rate**: at most 4 such reads per phone per season (8 s, 45 s, 3 min, 10 min), then it stops | 1 window |
| Screen on, Home after a Showdown | 0 in 2 minutes | **0** | 1 window |
| Unlocking a phone (screen back on) | 12 to 26 for both phones (6 to 13 each) at a waiting screen; 1 to 2 on the final screen and Home | per unlock | 5 unlocks |
| Reloading the app on Season Results (season 1) | 44 and 45 for the one phone that reloads | per reload | 2 reloads |
| Phone left open, screen on, past the end of its session | 0, 0, 0 before; 0 across the expiry; then 2, 0, 0 in the 2-minute windows after it (the 2 are each phone's 10-minute device check) | **0 to 60** | 7 windows of 2 minutes on Season Results; the session life was shortened from 3 h 59 min to 16 min for this run only (`results/expiry-run.log`) |

Read as a day: the worst idle screen (signings, screen on, 24 hours) would use 9,600 of the 50,000. A phone that sleeps uses nothing. One hundred unlocks a day use about 1,300.

### 5c. Paths that can read with nobody playing (code read)

| Path | Where | Stops when | Worst an hour |
|---|---|---|---|
| Wait listener + health confirm on the awaited document | budget layer, `sparkPrivatePairing.js` (confirm 30 s, relaxed 120 s; context listeners 180 s) | tab hidden, wait ends | measured above: 0 to 400 |
| Screen pollers (15 s; 3 s for the first 3 minutes of a wait) | 12 `productionShared*.js` modules | tab hidden; skipped while the wait listener is healthy; answers reused for 60 s when nobody taps | inside the measured rates |
| Home JOIN note for Nik | `persistentNikDanielPair.js:480-512`: one live listener, 10-minute window per Home visit; fallback one read per 30 s | JOIN shown, Home left, tab hidden, 10 minutes | 1 read on attach; fallback 20 reads per visit |
| Session reconnect check | `productionSharedJourneyReconnect.js:226`, every 15 s | hidden; when the session has expired it only redraws the RECONNECT banner (no read) | 0 (measured, 5b) |
| Denied read retry | budget layer, steps 15 s, 60 s, then every 5 min per path | never, but 12 an hour per path at most | about 36 per denied path |
| Quota pause | budget layer, pauses 10, 20, 40, 60 min after a real "limit reached" | by design | a handful |
| Runaway brake | 150 server reads in 5 minutes with no tap for 60 s: every repeat check then waits 15 s until the next tap | next tap | caps a runaway at about 1,800 document reads an hour per phone; never tripped in any run (0 trips) |
| Service worker update | `offlineApp.js:267`: static files from GitHub Pages only | n/a | 0 Firestore reads; the reload after an update costs one cold start (about 45 reads per phone, 5b) |
| Chamber Men and Prime Pack listener fallback | 2.5 s transaction read, no hidden check (P3-4) | screen left | 1,440 documents per phone, only if the listener cannot load (UNSURE) |

Note on the expiry run: once the session had run out, the harness's next step timed out at Season Results (it does not tap RECONNECT SESSION). That run priced reads only; I did not examine the reconnect flow itself.

The two real outages (2026-10-12 and 2026-10-25) happened on builds before the r84 trims and the brake. On this SHA I could not make any screen read more than 400 an hour without a person playing. The 2026-10-25 hour (about 170 console reads a minute with no writes) is still not reproduced; the session-expiry row above was the last named suspect that could be tested on the emulator.

## 6. Part 2 detail: what grows with play

- **Squad lists.** `js/squadSheet.js` keeps one departure row per man who left and one rating per man ever at the club. After #1495 (`compactOut`) an ended loan is dropped when the same man leaves again, so the list is bounded by the club's men (pools are 24 to 33 across the 98 clubs) plus the signing rows kept (3 a window). `tools/squad-lists-fuzz.cjs` plays 400 ten-season careers on the real engine with 3 new signings or buy-backs every window, every man rated on every screen and as many departures as the engine allows: worst 58 departures and 60 ratings, largest document 7,176 bytes, 0 engine errors, 0 client refusals. `tests/contracts/r93-loan-records-contracts.cjs` passes (4 checks).
- **Rules checks by season** (`results/journey-10-season-expressions.jsonl`, every write of a 10-season journey measured one by one): 29 of 32 kinds cost exactly the same in season 10 as in season 1. Three step up once and then stay flat: the Transfer War record create (329 in season 1, 382 from season 2), START of a Transfer War (804, then 826) and the season-totals update on the rivalry (829, 845, 851 by the fourth write, 857 in the Sacked suite). None creeps toward 1,000.
- **History index.** One entry per Showdown started, 500 a page, see P3-2. Reading History costs one extra document per sealed page, once per app start (pages are kept in memory).
- **Career summary.** One per finished Showdown, about 12,000 characters for 10 seasons (results, private results and commits per season; no squad sheets), cap 262,144. Fixed by Showdown length.
- **Meters.** The "reads today" document holds daily counts; its 1,000,000 cap is 20 times the Spark day.

## 7. Part 4 detail: the R94-02 `stops` field

- Cost of the field (club-draw suite against the classic journey): setup open 615 to 618, league 699 to 708, clubs 699 to 708, length 708 to 717, first confirm 720 to 761, **second confirm 752 to 811**. 811 is 39 under the sweep's 850 bar and 189 under the limit. Lookups are unchanged (4 of 10; open 5 of 10): the `stops` checks read no other document.
- The list is closed by the Rules: `[]` up to revision 3, exactly 1 entry at the first confirm, exactly 2 at the second, integers 0 to 359, the first entry kept by the second confirm, and the key cannot appear or disappear after create. It cannot grow.
- Replay sites: every later write that reads the setup document (career start, Transfer War, results, CONFIRM SEASON, season totals) reads single fields (`phase`, `revision`, `totalSeasons`, clubs) and never the key list, so a draw 2 ledger costs them nothing extra. Only the setup document's own rule runs `ssjrExactLedgerKeys`. Client readers pick the 15-key or 16-key list by the presence of `stops` (`sharedShowdownSetup.js:68`, `sparkCompletedShowdownReader.js:95`), so finished Showdowns replay as before.
- For PR 3 (wiring) to keep in mind:
  1. The stop must ride inside the manager's own confirm write. A seventh setup write, or the stop in its own document, would add a save and reads to every Showdown.
  2. Do not add checks to the second confirm: it has 39 left under the bar. Anything new belongs in the client or in an earlier, cheaper step.
  3. A retried confirm must resend the same stop (the client's idempotent replay compares `prior.stops[i]` with the pending stop). The pending stop lives in sessionStorage, so a closed tab loses it: on reopen the client must first read the ledger and take the stored stop when its own confirm is already there, never spin again.
  4. When the journeys switch to draw 2, the sweep's setup kinds in the two-manager journey move to the club-draw numbers above. Every other kind must stay on its baseline; if one moves, something new reads `stops`.
  5. The spin screen must wait for the other manager on the existing setup wait listener. A new poll or listener there would add idle reads on a screen people linger on.

## 8. How to replay

All commands from the repository root on the SHA above, after `npm ci`, `npm install --no-save firebase@12.17.0 @firebase/rules-unit-testing@5.0.1 firebase-admin@14.2.0` and both `build-production-firestore-rules` scripts. `T=gameplay/r94/threads/limits-study/tools`.

| What | Command |
|---|---|
| Cap probes | `npx firebase-tools@15.28.1 emulators:exec --only firestore --project demo-p "REPO_ROOT=$PWD node $T/probe-lookup-cap.cjs && node $T/probe-expression-scope.cjs"` |
| Lookup sweep | `npx firebase-tools@15.28.1 emulators:exec --only firestore --project demo-lk "node $T/lookup-sweep.cjs"` |
| Squad lists | `node $T/squad-lists-fuzz.cjs` |
| History page turn | `node $T/make-index-roll-probe.cjs`, then `emulators:exec … "node tests/firebase/r94-index-roll-probe.cjs"` |
| Stored bytes | `emulators:exec … "CMS_SHOWDOWN_LENGTH=10 STORAGE_OUT=out.json node -r ./$T/storage-size-hook.cjs tests/firebase/two-manager-journey-emulator.cjs"` |
| Idle reads | `node $T/make-idle-harness.cjs`, then `CE2PG_BUDGET=1 CE2PG_BUDGET_SAMPLE_MIN=1 CE2PG_BUDGET_SHORT_SAMPLE_MIN=0.5 CE2PG_PLAN=single CE2PG_SEASONS=3 R94_IDLE_MIN=2 R94_IDLE_POINTS=wait:results-entry,wait:transfer-window,wait:continue,end:final,end:home R94_IDLE_SEASONS=2 node tests/browser/ce2pg-r94-idle.cjs` |

A second emulator for probes while a sweep runs: add `--config $T/firebase.probe.json` (port 8181) and run from `$T`. Never rebuild the Rules while any of these run.

## Appendix: every kind of write

Rules checks are the R93-08 baseline (worst of all suites, 10-season flows). Lookups are from this study's sweep. "Not in baseline" marks two kinds only this study produced: JOIN at a History page turn (real, see P3-2) and one write shape that exists only because the probe seeded an index by hand (not a play write).

| Write (kind, as the sweep names it) | Expressions (of 1,000) | Lookups, worst document (of 10) | Lookups, whole request (of 20) |
|---|---|---|---|
| `create accounts/*/careerIndex/current + update accounts/*/pairLinks/current + update rivalries/* + update rivalries/*/invites/* [state:redeemed]` | 904 | 4 | 8 |
| `update accounts/*/careerIndex/current + update accounts/*/pairLinks/current + update rivalries/* + update rivalries/*/invites/* [state:redeemed]` | 904 | 5 | 8 |
| `create accounts/*/careerIndex/current + create accounts/*/pairLinks/current + update rivalries/* + update rivalries/*/invites/* [state:redeemed]` | 904 | 4 | 6 |
| `create accounts/*/pairLinks/current + update rivalries/* + update rivalries/*/invites/* [state:redeemed]` | 904 | 3 | 3 |
| `create rivalries/*/seasonCommits/season_N [COMMITTED]` | 898 | 8 | single document |
| `update rivalries/*` | 857 | 5 | single document |
| `update rivalries/*/sessions/* [state:active]` | 848 | 4 | single document |
| `create rivalries/*/transferChallenges/season_N/roles/playerTwo + update rivalries/*/transferChallenges/season_N [SIGNING_ENTRY] {lock-guesses}` | 842 | 4 | 4 |
| `update rivalries/*/transferChallenges/season_N [COMPLETED] {lock-signings} + update rivalries/*/transferChallenges/season_N/roles/playerTwo` | 842 | 4 | 4 |
| `create rivalries/*/transferChallenges/season_N/roles/playerOne + update rivalries/*/transferChallenges/season_N [GUESS_ENTRY] {lock-guesses}` | 839 | 4 | 4 |
| `update rivalries/*/transferChallenges/season_N [SIGNING_ENTRY] {lock-signings} + update rivalries/*/transferChallenges/season_N/roles/playerOne` | 839 | 4 | 4 |
| `create rivalries/*/transferChallenges/season_N/roulette/* + update rivalries/*/transferChallenges/season_N [WINDOW_OPEN] {start-window}` | 826 | 7 | 8 |
| `update rivalries/*/sharedSetup/authoritative [SHOWDOWN_CONFIRMED] {confirm}` | 811 | 4 | single document |
| `create rivalries/*/seasonResults/season_N [COLLECTING] + create rivalries/*/seasonResults/season_N/roles/playerOne` | 795 | 5 | 5 |
| `create rivalries/*/seasonResults/season_N [COLLECTING] + create rivalries/*/seasonResults/season_N/roles/playerTwo` | 795 | 5 | 6 |
| `update rivalries/*/sessions/* [state:expired]` | 780 | 4 | single document |
| `create accounts/*/careerIndex/current + create accounts/*/pairLinks/current + create rivalries/* + create rivalries/*/invites/* [state:open]` | 780 | 3 | 3 |
| `update rivalries/* + update rivalries/*/sessions/* [state:closed]` | 776 | 2 | 3 |
| `update rivalries/*/sharedSetup/authoritative [SEASON_LENGTH_COMMITTED] {confirm}` | 761 | 4 | single document |
| `update rivalries/*/primePackRounds/season_N` | 727 | 4 | single document |
| `create accounts/*/careerIndex/current + create rivalries/* + create rivalries/*/invites/* [state:open] + update accounts/*/pairLinks/current` | 720 | 3 | 5 |
| `create rivalries/* + create rivalries/*/invites/* [state:open] + update accounts/*/careerIndex/current + update accounts/*/pairLinks/current` | 720 | 4 | 5 |
| `create accounts/*/pairLinks/current + create rivalries/* + create rivalries/*/invites/* [state:open]` | 720 | 2 | 2 |
| `create accounts/*/careerIndex/* + create rivalries/* + create rivalries/*/invites/* [state:open] + update accounts/*/careerIndex/current + update accounts/*/pairLinks/current` | 720 | 3 | 6 |
| `update rivalries/*/sharedSetup/authoritative [SEASON_LENGTH_COMMITTED] {commit-length}` | 717 | 4 | single document |
| `create rivalries/*/seasonResults/season_N/roles/playerTwo + update rivalries/*/seasonResults/season_N [RESULTS_READY]` | 711 | 5 | 6 |
| `create rivalries/*/seasonResults/season_N/roles/playerOne + update rivalries/*/seasonResults/season_N [RESULTS_READY]` | 708 | 5 | 6 |
| `update rivalries/*/sharedSetup/authoritative [LEAGUE_WHEEL_COMMITTED] {commit-league}` | 708 | 4 | single document |
| `update rivalries/*/sharedSetup/authoritative [CLUB_ASSIGNMENTS_COMMITTED] {commit-clubs}` | 708 | 4 | single document |
| `update rivalries/*/transferChallenges/season_N [GUESS_ENTRY] {request-end-window}` | 693 | 4 | single document |
| `update rivalries/*/transferChallenges/season_N [WINDOW_OPEN] {request-end-window}` | 683 | 4 | single document |
| `create rivalries/*/sharedSetup/*` | 674 | 3 | single document |
| `update rivalries/*/seasonCommits/season_N [ACKNOWLEDGED]` | 652 | 4 | single document |
| `update rivalries/*/seasonCommits/season_N [COMMITTED]` | 640 | 4 | single document |
| `create rivalries/*/careerStart/authoritative [ONE_MANAGER_ACKNOWLEDGED]` | 634 | 5 | single document |
| `create rivalries/*/sessions/* [state:open]` | 634 | 4 | single document |
| `create rivalries/*/sharedSetup/authoritative [SHARED_SETUP_OPEN] {open}` | 618 | 5 | single document |
| `update rivalries/*/chamberMenRounds/season_N` | 612 | 4 | single document |
| `create rivalries/*/primePackRounds/season_N` | 565 | 4 | single document |
| `update rivalries/*/careerStart/authoritative [CAREER_START_READY]` | 512 | 4 | single document |
| `update accounts/*/pairLinks/current` | 512 | 3 | single document |
| `create rivalries/*/chamberMenRounds/season_N` | 503 | 4 | single document |
| `create rivalries/*/squadSheets/*` | 450 | 1 | single document |
| `create rivalries/*/transferChallenges/season_N [NOT_STARTED]` | 382 | 3 | single document |
| `update rivalries/*/transferChallenges/season_N [NOT_STARTED]` | 357 | 1 | single document |
| `create accounts/*/pairLinks/current + create rivalries/* + create rivalries/*/invites/* [state:open] + update accounts/*/careerIndex/current` | not in baseline | 2 | 3 |
| `create accounts/*/careerIndex/* + update accounts/*/careerIndex/current + update accounts/*/pairLinks/current + update rivalries/* + update rivalries/*/invites/* [state:redeemed]` | not in baseline | 4 | 9 |

