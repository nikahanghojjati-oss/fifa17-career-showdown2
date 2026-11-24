One new P2: a healthy ACTIVE session becomes unavailable to a resuming player during its final minute; no new lost season result or duplicate season commit established.

## Scope and exclusions

Audited `main` **9230e33455eae93040317e7553131be34c20da9b**, release **1.9.5-r81**, on **2026-10-22** (America/New_York). Daniel = `playerOne`; Nik = `playerTwo`. Only normal two-manager play, reload, closed tabs, connectivity loss, phone sleep and another browser/device are considered. No production accounts or data were accessed. App code, repository tests and Rules are unchanged.

There was no `codex-findings/` directory on main. Also fetched the complete findings files from open draft PRs **#958–#967** before selecting the new finding. Their issues are excluded: career reader/schema/dependency failures; career-screen loading/remounting; failed offer reads replacing sessions; ten-minute discovery waits; signing correction drafts; backwards Results/acknowledgement resumes; account/pairing/mode problems; usage/Rules observations; cached failed history/reveal reads; failed-Continue START/JOIN labels; replacement-session terminal-save recovery; and slow-reload START/JOIN flashes. #957's existing reader repair is excluded too.

This pass focuses on the **last minute of an already ACTIVE private session**, rather than the latest report's completed-writer/reader boundary or the preceding JOB-1's pending terminal save. Read all seven requested implementation files and all four requested audits, then followed their identity, persistent-pair, private-session and stage callers.

## F1 — P2: resume refuses a still-valid ACTIVE session for its last minute

**Exact player steps**

1. Daniel and Nik play an unfinished Showdown long enough that its roughly four-hour private session has less than one minute remaining. Keep the rival's existing game page open.
2. During that final minute, reload your tab, reopen it and continue, or sign into the same account in another browser and tap CONTINUE CAREER. A short outage or phone sleep that ends in this interval can lead to the same entry path. The connection is now healthy; no failed request is required.
3. As **Nik**, the resumed page shows WAITING FOR DANIEL instead of reattaching to their still-ACTIVE session, even though Daniel already has the game open.
4. As **Daniel**, the resumed page creates a different OPEN session and shows WAITING FOR NIK. Nik's already-open page stays ACTIVE on the original session. Tapping Continue on that page retains the old session rather than joining Daniel's new one.

The existing connection remains valid during this interval. This is premature loss of continuation, not ordinary enforcement of expiry. Opening/continuing the other manager's fresh page can establish a replacement; existing expired-session recovery is also available afterward. Saved results remain intact, so this is P2 rather than a demonstrated P1/data-loss finding.

**Cause / file:line**

- `js/sparkRemoteJoining.js:336` defines `SRJ_OFFER_MIN_LIFE_MS = 60 * 1000`.
- The normal entry starts automatic connection at `js/productionSharedJourneyEntry.js:347`; returning to an existing pair reaches it through `js/persistentNikDanielPair.js:275` and `js/productionSharedJourneyEntry.js:428`.
- `srjAutoConnectOnce` tests the offer's remaining lifetime **before reading the session**, at `js/sparkRemoteJoining.js:470`. An offer with 30 seconds remaining is skipped even if its session is already ACTIVE with both managers. The code therefore never reaches ACTIVE adoption at `:362–366`.
- Daniel falls through to hosting and publishing at `js/sparkRemoteJoining.js:475–483`. Nik falls through to waiting at `:491–493`; his offer-watch callback applies the same one-minute filter at `:383`.
- The rival's existing ACTIVE page takes the held-session return at `js/sparkRemoteJoining.js:463–466`, leaving the pages on different sessions in Daniel's case. The waiting UI at `:500–501` promises continuation when the rival opens/continues, although that rival is already playing.
- The actual session provider correctly considers the original session unexpired until its real deadline: `js/sparkPrivateSession.js:478–492`. The adoption function itself also correctly accepts an ACTIVE session with any positive remaining lifetime (`js/sparkRemoteJoining.js:365–366`). The outer offer filter prevents it from doing so.

**Reproduction and control**

A scratch Node/VM probe executes the unchanged `sparkRemoteJoining.js`, the real `sparkStandardAuthPrivateSession.js` and `sparkPrivateSession.js`, with decoded account/device/rivalry/session documents from `tests/fixtures/saved-showdowns-in-progress/r79-3season-inprogress.json`. The session envelope is resealed for a controlled current clock. An in-memory transaction SDK supplies normal successful reads/writes; nothing throws or returns unavailable. This is an adapter/provider reproduction, not a Rules-backed browser or physical-device timing measurement.

First, a fresh page with two minutes remaining adopts the existing ACTIVE session for each role. A second page representing the rival also adopts it. After advancing the clock to 30 seconds remaining:

| Resuming manager | Real provider reads old session as | Automatic resume | Session reads made by automatic resume | New writes | Rival's existing page |
| --- | --- | --- | ---: | --- | --- |
| Daniel | ACTIVE; `expiredByClock:false` | OPEN, waiting | 0 | One new session + one offer replacement | ACTIVE on old session |
| Nik | ACTIVE; `expiredByClock:false` | No session, waiting | 0 | None | ACTIVE on old session |

No season document is written by this path. The probe is retained locally as `work/minlife-probe.cjs`, outside the PR.

This is additional to #960 F1: **the offer read succeeds, the original session is valid, and no provider failure occurs**. The defect is the explicit pre-expiry filter, not treating an unreadable offer/session as absent. It also precedes #961's already-reported expired-session manual-code recovery.

**Suggested fix:** read and validate the offered session before applying any minimum-lifetime policy. Allow reattachment to the pair's existing ACTIVE, unexpired session. Apply any safety margin specifically to establishing/joining a new OPEN session, or coordinate renewal with both pages; do not silently discard a valid ACTIVE offer and split the pair. Add both-role cases at more than 60 seconds, just below 60 seconds, and actual expiry, with the rival retaining its ACTIVE page. Require no replacement session/offer write for a healthy ACTIVE reattachment.

## Requested reload paths: Daniel and Nik

“State recovers” below describes the healthy authority path. It does not certify exact-screen restoration, nor clear the excluded earlier findings. F1 affects any unfinished stage when re-entry occurs in the final session minute.

| Stage | Daniel (`playerOne`) | Nik (`playerTwo`) | Evidence / file:line |
| --- | --- | --- | --- |
| Career Start, before own acknowledgement | Assigned club and own I STARTED AT action recover. | Same, with Nik's own club/action. | Confirmed entry: `js/productionSharedJourneyEntry.js:381–383`; role-specific rendering: `js/productionSharedCareerStart.js:154–160`. Source trace, not a new timed browser reload at this stage. |
| Career Start, waiting after own acknowledgement | Existing own acknowledgement is recognized; no second write is needed. | Same role-based recovery. | Read/reconciliation and own-ack detection: `js/productionSharedCareerStart.js:89–103`; both-ready handoff: `:63–65`. |
| Transfer Challenge | Shared state/deadline and locked inputs recover. Same-device drafts exist; the previously reported signing correction exception remains. | Same protocol and own-role restoration. | Provider read/open: `js/productionSharedTransferChallenge.js:111–128`, `:337`; drafts: `:229–269`. Fresh r80 browser run covers both initial Transfer reloads and Daniel's live-window reload. Earlier-phase replay is existing behavior. |
| Season Results entry/review | Same-browser numeric/check draft survives, but exact-screen resume goes backwards under #960 F4; review must be repeated. | Same. | Draft save/restore: `js/productionSharedSeasonResults.js:110–128`; review: `:169–171`. Fresh r80 G7c again lands on `transferChallenge:window` for both, rather than Results. |
| Own result published, waiting for rival | Stored own result is read back; another publication is unnecessary. Exact-screen caveat #960 F4 applies. | Same role-based restoration; rival result remains private until both publish. | `js/productionSharedSeasonResults.js:154–157`, `:183–196`; privacy/rendering: `:144–147`. Source/provider trace, not a new published-wait browser recording. |
| Commit / acknowledge | Existing commit and own acknowledgement recover; interrupted COMMIT & ACKNOWLEDGE can leave just the acknowledgement outstanding. #960 F4 affects landing. | Outstanding acknowledgement is offered; an accepted own acknowledgement becomes read-only. Same landing caveat. | Read-before-write/satisfied checks: `js/productionSharedSeasonCommit.js:155–184`; acknowledged rendering: `:107–108`. No new duplicate season write established. |
| Final Winner after terminal close | Reload returns Home; closed rivalry is not reopened and no extra season is created. Archived/detail recovery still has the excluded reader/cache findings. | Same. | Closed pair handling: `js/persistentNikDanielPair.js:143`; tab-resume guard: `js/onlinePlayerIdentity.js:14`; entry auto-open guard: `js/productionSharedJourneyEntry.js:483`. Pending replacement-session save issue remains #966 F1, not a new finding here. |

## Other requested paths and paths checked without another new finding

| Path | Verdict / evidence |
| --- | --- |
| 30-second loss, established session with ample lifetime | No new duration-specific loss/duplicate found. Offline invalidates an in-flight recovery generation; return rechecks setup, progression and the exact session (`js/productionSharedJourneyReconnect.js:138–143`, `:168–180`, `:200`). The fixture-backed reconnect browser audit passes. **A reload/re-entry whose return lands in the session's final minute triggers F1.** Earlier faulty offer-read recovery remains excluded. |
| Ten-minute loss or sleep, session still valid | No ten-minute gameplay expiry: session TTL is about four hours (`js/sparkRemoteJoining.js:19–25`). Mutable caches are forgotten on online/pageshow/visibility return (`js/sparkPrivatePairing.js:734–742`); cached/pending listener snapshots are not accepted as authoritative (`:867–869`). Waiting-continuity contracts pass their long-wait/return cases. This is source/fixture evidence, not a literal new ten-minute outage or physical-phone suspension run. Known ten-minute connection-discovery timeout is #960 F2. Re-entry during the final minute adds F1. |
| Both reload at once | With a readable offer and more than one minute remaining, both adopt the same ACTIVE session without joining/writing again (`js/sparkRemoteJoining.js:362–366`, `:469–473`). No new simultaneous-reload season duplication found. In the final minute, Daniel makes a new offer; Nik can join that replacement, but the old valid session was still unnecessarily skipped. The new F1 reproduction deliberately retains the rival's old page, which exposes the split/wait. No new two-context simultaneous-reload recording is claimed. |
| r79 season 1 done → r80 continuation | Provider/data-format continuation passes the requested actual-r79-fixture test: fresh session, seasons 2–3, final close and both-role completed reads; all seven original season-1 documents unchanged (`tests/firebase/r79-showdown-continues-emulator.cjs:126–139`, `:142–176`, `:179–196`). Relevant entry/session/results/commit/history/progression/terminal files have no diff between r80 release `f4481e15` and this main. This is current-provider compatibility evidence, not a run of historical r80 browser assets. |
| Second browser/device mid-season | The server slot supplies the same save/profile/role; a missing local shell is adopted, and attachment verifies the newly registered device (`js/persistentNikDanielPair.js:214`, `:228`, `:275`; `js/sparkConnectedRivalry.js:438–467`; registration `js/sparkPrivatePairing.js:224–234`). Published facts remain shared. Unpublished drafts are deliberately device-local (`js/productionSharedSeasonResults.js:110`; `js/productionSharedTransferChallenge.js:240`). F1 applies even with successful fresh-device registration/attachment. No new shell-binding failure established. |
| Real/test mode while continuing | ACTIVE continuation precedes new creation/checkmark logic (`js/productionSharedJourneyEntry.js:259–275`, `:290–294`). New creation alone invokes the modes gate (`js/showdownModes.js:167–201`); marker creation checks for an unfinished Showdown (`js/careerStartMarker.js:165–199`). No new marker mutation or accepted-season reset found. Existing stale-mode/filtering issues remain excluded. |
| START/JOIN flashes | None in the healthy r80 Home-resume frame checks; nine-second pre-pair reload hold passes. Existing failed-resume labels (#965 F1) and successful reloads exceeding the 15-second cover (#966 F2) are already reported, not repeated here. Relevant guards: `js/onlinePlayerIdentity.js:43`, `:112`; `js/ssjr.js:64–77`. F1's new wrong screen is the session waiting card. |

## Validation and limits

- Both Rules builders passed; composed generated blob remains `13cab80a76979299fcac195da925fa984c51d8a5`. Firebase remains Spark-only, memory-only; billing and deployments untouched.
- PASS: `tests/browser/r80-resume-active-audit.cjs`, **11 checks**, two real Chromium manager contexts with Auth/Firestore emulators and composed Rules. Its broad Results reload oracle accepts three screens (`:394–402`), so this pass does not prove correct Results landing.
- PASS: `tests/browser/shared-journey-reconnect-audit.cjs`, desktop/mobile fixture-backed recovery, replacement authority and terminal non-resurrection. It supplies session/setup/progression fixtures (`:57–67`), so it does not exercise the automatic offer threshold in F1.
- PASS: `tests/browser/r79-reload-hold-audit.cjs`, delayed identity recovery at nine seconds. This does not test beyond the known 15-second startup limit.
- PASS: `tests/firebase/r79-showdown-continues-emulator.cjs`, **11 checks**, mixed three-season totals **9–15**, both managers re-read the final history, seven original season-1 documents unchanged.
- PASS: waiting-continuity; Journey Reconnect deterministic/production; Firestore budget (**25**); ten-season session (**7**) contracts. The session suite tests hosting/join-watch/expiry recovery but not ACTIVE offer adoption below 60 seconds.
- PASS: both-role F1 adapter/provider probe and healthy two-minute controls, with successful SDK operations throughout. No Rules or physical-device acceptance claim for that probe.
- Required report-only impact route: `POS20_DOC_ONLY`, zero selected product contracts, `V10_FLASH_BROWSER`. The V10 screen-flash audit passed all three viewport journeys, double taps, reduced motion and additional Club checks; it does not inject F1's session-clock boundary.

Initial browser setup attempts are not counted as gameplay evidence: the first used a stale, uncomposed generated Rules artifact; a subsequent attempt retained partial emulator state and stopped before the real game began. The successful r80 run above used a fresh emulator process and composed Rules. A workspace restart interrupted neither a claimed completed test nor a production session. Scratch scripts, prior-report copies, generated logs and artifacts stay under `work/` or ignored test-output locations and are excluded from the PR.

Only this report belongs in the draft PR. No new P1/P3, lost published result, duplicate season commit, r79 format regression, or unconditional physical-device recovery guarantee is claimed.
