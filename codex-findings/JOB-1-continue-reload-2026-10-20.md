Two P1 connection-recovery stalls and two P2 resume/draft defects remain on main 1.9.5-r81; acknowledged season data and r79-to-r80 compatibility survived the checks.

## Scope and evidence

Audited `main` at `9230e33455eae93040317e7553131be34c20da9b`, release 1.9.5-r81, on 2026-10-20. Daniel is `playerOne`; Nik is `playerTwo`. Only ordinary play, network interruption, reload, tab closure/suspension and another browser are considered. No production account or production database was changed.

There was no `codex-findings/` directory in the checkout. I started with second-device adoption and session offers, then worked backwards through stage restoration. Open PRs were also inspected: the finished-career reader/key-order issue in #957/#959 and the career-screen loading issues in #958 are excluded from the findings below.

Read all seven requested implementation files and all four requested tests. Followed their callers into the persistent pair, session-offer, transfer, results, commit, progression and terminal-close adapters. App code and repository tests are unchanged. Browser probes use Chromium, emulator Google sign-in, two manager accounts and the composed production Rules; isolated fault/clock probes use unchanged application modules with provider doubles. The latter are deterministic reproductions, not physical-device or production acceptance evidence.

## F1 — P1: a transient read failure creates another session and strands the resuming host

**Player steps**

1. Daniel and Nik have an ACTIVE Showdown and private session, with substantial session lifetime remaining. Nik keeps the game open.
2. Daniel reloads, reopens his tab, or continues on another browser while his connection is recovering.
3. The first read of the remembered session offer fails, but the network recovers before the subsequent host/write operations. The same failure occurs if the offer is read successfully but reading its live session fails.
4. Daniel sees WAITING FOR NIK even though Nik is already in the game. Reopening CONTINUE on Nik's still-active page continues holding his original session; it does not join Daniel's replacement.

**Cause and references:** `js/sparkRemoteJoining.js:350` turns every offer-read exception into the same `null` as a missing offer. `js/sparkRemoteJoining.js:364` similarly converts a failed session read to a failed adoption. The default-host fall-through at `js/sparkRemoteJoining.js:469` and `js/sparkRemoteJoining.js:475` then creates a fresh OPEN session; `js/sparkRemoteJoining.js:478` publishes it using the unconditional write at `js/sparkRemoteJoining.js:356`. Nik's existing ACTIVE session takes the early return at `js/sparkRemoteJoining.js:463`. The entry is waiting for Daniel's exact session to become ACTIVE before it can resume (`js/productionSharedJourneyEntry.js:322`, `js/productionSharedJourneyEntry.js:347`).

**Reproduction:** an isolated two-page-state probe first attached Nik to the existing ACTIVE session, rejected exactly Daniel's offer-read transaction with `unavailable`, and allowed subsequent operations. Result: Daniel `open`, Nik `active`, different session IDs, one replacement offer write. Calling Nik's `autoConnect()` again kept his old session. This is a duplicate session/offer write, not a duplicate season result. The provider opens by the new session ID without checking for another live session (`js/sparkPrivateSession.js:384`); the Rules validate the new offer target, not the old offer it replaces (`firestore.spark.rules:855`, `firestore.spark.rules:872`). Permanently paired players have no manual-code fallback on the automatic waiting card (`js/sparkRemoteJoining.js:505`). Nik reloading can recover it, but Daniel's visible instruction falsely says the other player only needs to open/continue the game.

**Suggested fix:** distinguish missing/positively expired offers from unreadable offers and unreadable sessions. Retry the latter without hosting. For initial publication, use the same compare-and-set/positive live-session checks already used by `srjPublishIfStillOurs` at `js/sparkRemoteJoining.js:406`; do not blindly replace a healthy offer after an uncertain read. Add a two-client test in which the rival retains its ACTIVE session during the host's one failed resume read.

## F2 — P1: ten minutes asleep/offline can leave connection recovery waiting forever

**Player steps**

1. Continue an unfinished Showdown after the old private session has expired. Nik opens/continues first, while Daniel is unavailable; Nik sees WAITING FOR DANIEL.
2. Nik's phone sleeps or loses connectivity for ten minutes, spanning the waiting timer's deadline. Leave the tab open.
3. Daniel opens the game and hosts the new connection. Nik wakes/reconnects after the deadline.
4. Nik still sees WAITING FOR DANIEL and never joins, despite Daniel now being available. Neither waiting card explains that polling stopped or supplies a retry action. A reload or closing/reopening the connection flow is needed.

**Cause and references:** `js/sparkRemoteJoining.js:336` limits offer polling to ten minutes. The first late timer callback exits at `js/sparkRemoteJoining.js:379` before checking the new offer and without changing the `auto:"waiting"` state or scheduling another callback. The online handler at `js/sparkRemoteJoining.js:575` restarts only pending operations and offer-publication retries; there is no visibility-return handler in this module. The automatic waiting card still promises self-continuation (`js/sparkRemoteJoining.js:500`). Journey Reconnect's visibility wake refreshes recovery status, not offer discovery (`js/productionSharedJourneyReconnect.js:194`, `js/productionSharedJourneyReconnect.js:206`).

The host side has the equivalent late-join problem: its join watch exits after ten minutes at `js/sparkRemoteJoining.js:196`; reentering `autoConnect` with an already-published OPEN session returns `held` without rearming that watch (`js/sparkRemoteJoining.js:465`). The existing test explicitly checks that the watch stops, but does not test a subsequent return/join (`tests/contracts/ten-season-session-contracts.cjs:85`).

**Reproduction:** an isolated clock/timer probe started Nik waiting with no offer, advanced elapsed wall time to ten minutes plus 1 ms, and ran the queued callback. It then supplied Daniel's valid OPEN offer and dispatched `online`. Nik retained `auto:"waiting"`, `sessionId:null`, and zero scheduled callbacks. No real ten-minute browser outage was claimed.

**Suggested fix:** retain bounded background polling, but perform one immediate status read and start a fresh bounded wait on visible/online return. Rearm an OPEN host's join watch on reentry as well. At the deadline, expose an honest paused/retry state instead of promising automatic connection indefinitely. Test both roles returning after the deadline, including a join that occurred during suspension.

## F3 — P2: a pasted signing correction silently reverts after reload

**Player steps (either manager)**

1. Reach Transfer Challenge → Signing Entry and enter a signing, previous league and nationality, initially France.
2. Select the nationality text and paste England over it. The field now correctly displays England. Do not leave the field or select a suggestion.
3. Immediately reload using the keyboard/browser, then return through the transfer replay to Signing Entry.
4. The restored nationality is France. The last edit was discarded; locking without noticing records the wrong signing fact. The same event ordering affects the previous-league selector.

**Cause and references:** the draft input handler is registered in the document's capture phase (`js/productionSharedTransferChallenge.js:379`). It saves immediately (`js/productionSharedTransferChallenge.js:376`), before the selector's target input handler clears/recomputes the canonical ID (`js/transferSelector.js:189`). Thus `js/productionSharedTransferChallenge.js:226` stores the new text together with the old canonical ID. Restore prefers that old ID over the saved text (`js/productionSharedTransferChallenge.js:237`). The guess-draft handler already accounts for this ordering by saving again after the selector runs (`js/productionSharedTransferChallenge.js:276`); the signing handler does not.

**Reproduction:** isolated Chromium runs using the real selector and signing-draft adapter reproduced this for both roles across fresh page loads. Before reload: visible `England`, field canonical ID `england`, persisted draft `nationality:"England"` plus `nationalityId:"france"`. After reload: visible `France`. The provider phase was held at unlocked SIGNING_ENTRY; no player data was published.

**Suggested fix:** save signing drafts after selector normalization, with a context/role check, and/or consume the selector's selection-change event. Reject an ID/text mismatch when restoring rather than privileging the stale ID. Add behavioral paste-and-reload coverage; the current signing-draft contracts only check source strings (`tests/contracts/job-1050-signing-draft-contracts.cjs:16`).

## F4 — P2: Results, published-wait and acknowledgement reloads return to the completed transfer window

**Player steps (both Daniel and Nik)**

1. Finish the season's Transfer Challenge and enter Season Results. Optionally publish your result and wait for the rival, or reach COMMIT/ACKNOWLEDGE.
2. Reload the same browser, or close/reopen and continue the Showdown.
3. In season 1, the player lands on the historical transfer-window screen, then must tap through the already-completed window, guesses and signings before opening Results again. The published result/acknowledgement is still stored, but the visible stage went backwards.

**Cause and references:** `js/productionSharedJourneyEntry.js:372` treats zero accepted seasons as Career Start, regardless of transfer/results/commit progress. A ready Career Start opens Transfer Challenge (`js/productionSharedCareerStart.js:63`, `js/productionSharedCareerStart.js:118`). Transfer witnesses are page-memory only (`js/productionSharedTransferChallenge.js:19`); `js/productionSharedTransferChallenge.js:83` consequently treats every earlier phase as unseen after reload, and opening prepares that replay (`js/productionSharedTransferChallenge.js:337`). After an earlier season has been accepted, entry instead unconditionally chooses the dashboard (`js/productionSharedJourneyEntry.js:373`), again without restoring the active results/commit stage.

**Reproduction:** the unchanged r80 audit logged `G7c-reload daniel landed=transferChallenge:window` and the same for Nik, yet passed. Its Season Results check allows Transfer Challenge/dashboard and compares Home navigation to that reload baseline (`tests/browser/r80-resume-active-audit.cjs:396`). An additional two-account Rules-backed browser run observed this on simultaneous Results reloads, Daniel's published-wait reload, both-published reloads and acknowledgement reloads. Tapping through replay recovered the existing state; no duplicate result was necessary.

The replay is an explicit existing implementation choice, not a newly introduced regression. It is included because this audit specifically asks for wrong-screen resumes, including cases accepted by the existing tests. A first visit on another device can reasonably require viewing missed phases; the same-device player has already witnessed these phases.

**Suggested fix:** select the resume screen from authoritative career/transfer/results/commit state, and retain non-authoritative, context-scoped viewing hints for phases already witnessed in that browser. Continue checking all provider authority before actions. Preserve required full-screen presentation for genuinely unseen steps. Assert the expected stage directly rather than accepting any of three screens as the reload oracle.

## Requested path verdicts and paths checked without an additional defect

“Works” below means the stated persisted state survived; F1/F2 remain exceptions when connection establishment encounters their triggers. It does not imply every screen resumes exactly in place.

| Reload stage | Daniel (`playerOne`) | Nik (`playerTwo`) | Evidence / source |
| --- | --- | --- | --- |
| Career Start, before own acknowledgement | Works: correct assigned club and I STARTED AT action restored. | Works: correct assigned club and action restored. | Additional two-account browser run; `js/productionSharedJourneyEntry.js:383`, `js/productionSharedCareerStart.js:154`. |
| Career Start, waiting after own acknowledgement | Own attestation is read back; a duplicate tap is unnecessary. | Same role-scoped recovery. | `js/productionSharedCareerStart.js:77`, `js/productionSharedCareerStart.js:92`, `js/productionSharedCareerStart.js:158`; provider-backed stage read plus source trace. |
| Transfer Challenge | Live window resumes with the same session; locked inputs remain provider-owned. Later phases can replay earlier screens. F3 affects an unlocked signing correction. | Same protocol; F3 reproduced separately for Nik too. | Passing r80 G7a/G7b and signing probes; `js/productionSharedTransferChallenge.js:111`, `js/productionSharedTransferChallenge.js:122`, `js/productionSharedTransferChallenge.js:229`. |
| Season Results entry/review before publish | Local numeric/checkbox draft survives on this browser, but F4 returns through transfer replay. | Same; numeric draft restored. | Additional simultaneous-reload run recovered Daniel's 90 and Nik's 80 league points; `js/productionSharedSeasonResults.js:114`, `js/productionSharedSeasonResults.js:122`. The review/publish intent itself is page-memory and must be reviewed again. |
| Own result published, waiting for rival | Published result survives; after F4 replay it shows YOUR RESULT IS PUBLISHED. It is not republished. | Same role-based read/restore; the unpublished rival cannot see the other result yet. | Additional Daniel published-wait run; `js/productionSharedSeasonResults.js:157`, `js/productionSharedSeasonResults.js:186`; provider read/privacy checked by the existing journey tests. |
| Commit/acknowledge | An interrupted COMMIT & ACKNOWLEDGE resumes at its outstanding ACKNOWLEDGE step; F4 adds replay. An already-stored own acknowledgement is rendered read-only by the shared adapter. | Existing commit restores ACKNOWLEDGE SHARED SEASON until Nik acknowledges; F4 adds replay. | Additional two-account acknowledgement reloads; `js/productionSharedSeasonCommit.js:110`, `js/productionSharedSeasonCommit.js:175`. |
| Final Winner after terminal close | Reload returns Home; it does not create another season or reopen Career Start. | Same. | Additional final reloads; `js/onlinePlayerIdentity.js:14`, `js/persistentNikDanielPair.js:143`, `js/productionSharedJourneyEntry.js:483`. Reopening archived history goes through the separately reported completed-reader issue (#957/#959), so that known failure is not called fine here. |

| Other requested path | Verdict and references |
| --- | --- |
| 30-second network loss with an already ACTIVE, unexpired session | Works in the additional real-time browser outage: the same game/session returned and play continued. Offline state drops authority, online return rechecks it: `js/productionSharedJourneyReconnect.js:138`, `js/productionSharedJourneyReconnect.js:168`, `js/productionSharedJourneyReconnect.js:200`. If a reload/connection attempt straddles the outage, F1 can occur. |
| 10-minute loss with an already ACTIVE session | No ten-minute gameplay/session expiry exists: the connection lasts about four hours (`js/sparkRemoteJoining.js:25`). Source/protocol checks preserve the accepted history and reauthorize on return (`js/sharedJourneyReconnect.js:157`, `js/productionSharedJourneyReconnect.js:176`). This is not a claim of a literal ten-minute browser run. When the player is instead waiting to establish the replacement session, F2 is reproduced. If the four-hour boundary is crossed, a fresh session is required; expiry is not ACTIVE authority (`js/sharedJourneyReconnect.js:159`). |
| Both reload simultaneously | Works for identity/session binding and saved Results drafts with a readable live offer; both reattached to the same rivalry/session in the additional browser run. Both see F4's backwards stage. Offer adoption reads ACTIVE rather than joining it again (`js/sparkRemoteJoining.js:366`). There is no season write in that path. |
| r79 Showdown, season 1 accepted, continued on r80 | Works at the provider/data-format boundary: the requested emulator test passed all 11 checks, accepted seasons 2–3 including Europa League, closed and re-read the mixed history, and proved all season-1 documents unchanged. `tests/firebase/r79-showdown-continues-emulator.cjs:138`, `tests/firebase/r79-showdown-continues-emulator.cjs:176`. The test runs today's providers against an actual r79 fixture. A diff against r80 release commit `f4481e15` found no changes in the relevant results/commit/history/progression/terminal providers, protocols or Rules; this was not a run of the historical r80 browser assets. Browser stage restoration still has F4. |
| Second device/browser mid-season | Live save adoption and exact session reattachment work. Additional browser run signed Daniel into a fresh context with empty storage while his original context remained open: both held the same session and the fresh context rebuilt the provider's save ID. Nik uses the same role-parametrized adoption (`js/persistentNikDanielPair.js:214`, `js/persistentNikDanielPair.js:275`; `js/saveLibraryRuntime.js:502`; `js/sparkConnectedRivalry.js:438`). Unpublished drafts are explicitly device-local, not transferred (`js/productionSharedSeasonResults.js:110`, `js/productionSharedTransferChallenge.js:240`); published facts stay online. F1 can split a faulty host resume; F4 can replay the stage. |
| Real/test career marker on resume | No additional defect found: active continuation bypasses new-season creation/checkmark logic (`js/productionSharedJourneyEntry.js:259`, `js/showdownModes.js:167`); creating a first marker refuses a live unfinished rivalry (`js/careerStartMarker.js:177`). The r79 compatibility test also preserved the accepted history. |
| START/JOIN flashes on the covered healthy resume paths | None observed in the unchanged r80 frame audit: G7a/G7b/G7c kept CONTINUE SHOWDOWN or CHECKING during Home resumes. The nine-second delayed-identity reload-hold test also passed without a Home/bare-wheel flash. Guards: `js/onlinePlayerIdentity.js:43`, `js/ssjr.js:76`. This is bounded evidence, not a guarantee for arbitrary network delays: the startup hold has a 15-second safety cap (`js/ssjr.js:64`). |

## Validation record

- `tests/browser/r80-resume-active-audit.cjs`: PASS, 11 checks, Auth/Firestore emulators with composed production Rules. Its passing G7c result also directly reproduces F4.
- `tests/browser/shared-journey-reconnect-audit.cjs`: PASS, isolated desktop/mobile provider fixtures; covers offline hold, replacement authorization and terminal non-resurrection, not session-offer discovery.
- `tests/browser/r79-reload-hold-audit.cjs`: PASS; delayed identity ready at 9 seconds, loading left at about 9.37 seconds, 32 subsequent frames all on the waiting layer.
- `tests/firebase/r79-showdown-continues-emulator.cjs`: PASS, 11 checks against the r79 fixture; season 1 remains byte-identical.
- Additional temporary Chromium/Rules-backed stage probe: Career Start for both managers; fresh Daniel browser while original stays active; 30-second real network loss; simultaneous Results reload with drafts; publication and commit/acknowledgement restoration; terminal close and final reload in a follow-up. The first probe reloaded Daniel between the commit and its second acknowledgement write; it correctly restored ACKNOWLEDGE, then the harness timed out waiting for closure because it had not tapped that outstanding Daniel acknowledgement. The follow-up completed that pending action, reached CLOSED/Final Winner on both managers, and reloaded each to Home. Only harness code in `/tmp` was added, no app source edits.
- Isolated unchanged-module session fault/timer probes: reproduced F1/F2. Isolated real-selector Chromium probe for each manager: reproduced F3.
- POS20 impact route: `POS20_DOC_ONLY`; no deterministic product tests selected. Required visual proof: `tests/browser/v10-screen-flash-audit.cjs` — PASS (desktop, portrait and landscape, including double taps and motion preferences).

No new duplicate season commit, lost published season result, cross-manager binding error, or r79 result-format regression was found in these paths. The remaining evidence limits are production map ordering (already reported elsewhere), physical mobile suspension behavior, and outages whose duration crosses the four-hour session expiry.
