# Bug hunt on r52 (read-only), 2026-10-04

Repo `nikahanghojjati-oss/fifa17-career-showdown2`, main `0979a00` (merge of #342, release r52).
Method: read the shared-journey code, the Rules fragments and the scoring code, plus a few small local node runs. No browser run, no emulator run, nothing pushed. Where I only inferred something from code and earlier fixes, I say so.

Ranked by how likely it is to show up in a real two-phone game.

---

## 1. The "lost race" fix from #333/#339 was applied to only two of the five two-writer ledgers  (likely to hit, small fix)

**Where:** `js/sparkSharedCareerStart.js:68-72`, `js/sparkSharedTransferChallenge.js:143-165` (`stspMutate`), `js/sparkSharedShowdownSetup.js` (confirm), plus their UI wrappers `js/productionSharedCareerStart.js:72-83`, `js/productionSharedTransferChallenge.js:112-127` (`pstcMutate`), `js/productionSharedShowdownSetup.js` (`mutateNow`).

`grep -c permission-denied` over `js/spark*.js` and `js/production*.js` finds the "re-read and treat as STALE" handling only in `sparkSharedSeasonResults.js` (#333) and `sparkSharedSeasonCommit.js` (#339). Evidence for the shape (from the lead's own job-20 note): when two managers write the same ledger at once, the loser's transaction is rejected by the Rules with `permission-denied`, not by the app's own STALE check.

Steps that should hit it (inferred, not run):
- **Career Start:** both managers tap START at the same moment. Both see no doc and both try to create revision 1. The loser's write is an update with `revision==1`, which the Rules (`firestore.career-start-production.fragment.rules`, revision must go 1 to 2) reject. The client only retries on three CAREER_START_* codes, so the loser sees `NOT RECORDED · permission-denied` plus a red toast and has to tap again.
- **Transfer window at 15:00:** both phones reach `00:00` within about a second and both call `advanceExpiredWindow` (`productionSharedTransferChallenge.js:192`). One wins. The other gets `permission-denied` or `TRANSFER_PHASE_INVALID`, shows the raw code in `#transferChallengeError` and a 10 second red toast ("Missing or insufficient permissions" or "update was rejected"). `pstcMutate`'s catch does not re-read, so that phone keeps showing WINDOW_OPEN at 00:00 until the next 15 second poll.
- **Same thing** for both managers tapping REQUEST EARLY END together, LOCK MY GUESSES together, LOCK MY SIGNINGS together, and both tapping CONFIRM in Shared Setup together (`mutateNow` has no stale retry at all and shows "SETUP STALE BASE REVISION").

**Why it matters:** two people on a call saying "ready, go" is exactly how these taps happen. Nothing is corrupted (the Rules protect the data), but the loser sees an alarming error and, for the lock buttons, their input is not saved until they tap again.

**Suggested small fix:** one shared helper, copied from the `sparkSharedSeasonResults.js` catch block: on `permission-denied`, re-read the doc with `getDoc`; if the operation id is already in the ledger, return success (replay); if the revision moved past `baseRevision`, return the STALE code. Then in the three UI wrappers, treat STALE / PHASE_INVALID / ALREADY_* as "refresh and retry once silently" instead of showing an error. For `advanceExpiredWindow` specifically, on any failure just call `pstcRefresh()` and say nothing.

---

## 2. Season winner on a non-zero tie: code and documented rule disagree  (needs Nik's call, likely to hit)

**Where:** `js/sharedCanonicalScoring.js:30` (`scWinner`) and `js/scoring.js:41` (`determineSeasonWinner`).

The release notes and roadmap say: "Equal non-zero scores are Draws. Only 0-0 uses league position, then league points" (`RELEASE_V1.9.1_R11.md:27`, `POST_V1_ROADMAP_EXECUTION.md:258`, `ROADMAP_AMENDMENTS.md:411` "Do not change the 0-0-only tiebreak").

The code breaks *any* equal total by league position. I ran it: P1 total 5, P2 total 5 gives `winner: "playerTwo"` (better league position), and the local `determineSeasonWinner` with totals 1 and 1 gives `playerOne`. The Team G data-contract fixture `tests/fixtures/data-contract-v1/tiebreak-finish.json` also treats a 1-1 season as decided by position, so the fixtures follow the code, not the docs.

Ties are common (1-1, 3-3, 4-4 all happen), so this decides who is credited with a season win on real games. It feeds `seasonWins/seasonDraws` records in `sharedHistoryConvergence.js:90`. It does not change the final result (the final uses totals only).

**Suggested fix:** ask Nik which is intended. If the docs are right, change both functions to apply the tiebreak only when both totals are 0, and fix the fixture. If the code is right, correct the docs. A "draw" can currently only occur if two clubs in the same league report the same position and points, which is impossible in real play.

---

## 3. Nothing checks the two managers' results against each other, and a published result can never be corrected  (medium)

**Where:** `js/sharedSeasonResults.js:44-52` and `ssrNormalizeResult`, `js/productionSharedSeasonResults.js:127-149`; Rules `firestore.season-results-production.fragment.rules:138-150`.

Both managers play in the same league (`catalog[setup.leagueId]` holds both clubs). Each side is validated alone (position 1..teamCount, points up to (n-1)*6, goals up to 300). Nothing checks the pair:
- Both can publish `leaguePosition: 1` and both get the +3 league title, or both can report the same position.
- Both can tick Champions League (+5 each) or both Domestic Cup, which is impossible in one season.
- A typo like points 28 for 82, or 102 for 82 (that one wrongly adds the +1 performance bonus), is accepted.

Publishing is immutable per manager, and once both publish, the season commit snapshots whatever was entered. There is no dispute or redo path (the only guard is the review screen before publishing).

**Suggested fix (small):** add the pair check where both results are visible, i.e. in `sscApply` (commit) and in the commit panel: if both positions are equal, or both Champions League / both Domestic Cup are true, block COMMIT SHARED SEASON and show "Results conflict, check position / cup entries". Top Scorer and Top Assist may legitimately be true for both, so leave those. The harder part is the redo path: results are immutable once published, so a block with no way to re-enter would stall the game. If a reset is too big for now, at least warn the coordinator before committing.

---

## 4. Irreversible lock buttons with no confirmation, and the helpful validation message is never shown  (medium-low)

**Where:** `js/productionSharedTransferChallenge.js:149-158` (`pstcBuildGuesses`, `pstcBuildSignings`), `:234-236` (`completeTransferChallenge`), `:240` (`pstcCapture`), `:125`.

- LOCK MY GUESSES and LOCK MY SIGNINGS fire the lock immediately. Blank forms are accepted (`pstcBuildGuesses` returns `[]`, the provider accepts `[]`), so one stray tap locks "no guesses" or "no signings" for the whole season with no undo (Rules forbid any later change).
- `pstcBuildGuesses`/`pstcBuildSignings` throw helpful messages ("Complete guess 2 with a FIFA 17 league or nationality."), but `pstcCapture` and `pstcMutate` show `error.code` first (`pstcSetError(error.code||error.message...)`), so the inline error reads `TRANSFER_GUESSES_INVALID` and the useful text only appears in the 10 second toast.
- Signing names longer than 80 characters pass the form but fail the provider with only a code (`TRANSFER_SIGNINGS_INVALID`).

**Suggested fix:** one `confirm()`-style step ("Lock 0 of 3 guesses? This can't be undone") when fewer than 3 rows are filled; show `error.message` before `error.code` in those two catch blocks; add `maxlength="80"` to the signing name inputs.

---

## 5. Five-season and ten-season games will outlive the 4 hour private session  (low for the current one-season test, inferred)

**Where:** `js/sparkPrivateSession.js:9-10` (`MAX_SESSION_TTL_MS = 4h`), `firestore.spark.rules:753` (`expiresAt` cannot change after creation), `js/productionSharedShowdownSetup.js:107`, `js/productionSharedJourneyReconnect.js:80`.

A session cannot be extended. A 10-season Showdown (or any game left overnight) hits "FRESH PRIVATE SESSION REQUIRED" and both managers must open or join a new session. The recovery is designed, so this is not a data-loss bug, but I did not verify that the fresh-session path is easy to follow mid-season (for example while a transfer window is open, because `activeSessionId` is stamped into every ledger write and the Setup refresh fails with SHARED_SETUP_ACTIVE_SESSION_REQUIRED). Worth one targeted retest before Nik and Daniel try 5 or 10 seasons.

---

## Small extras (cheap, optional)

- **Stale copy after season commit:** `js/productionSharedSeasonCommit.js:87` still says "SCORING REMAINS LOCKED FOR THE NEXT CAPABILITY" after both acknowledge, while the canonical score panel (`productionSharedCanonicalScoring.js`) is showing the score right under it. Change the text to something like "SEASON COMMITTED · SCORE BELOW".
- **Hard-coded names as fallbacks:** `productionSharedMultiSeasonProgression.js:66` and `:80` fall back to playerOne = "Daniel", playerTwo = "Nik" and "Daniel vs Nik". It only shows if `currentShowdown.managers` is missing, but if the real role assignment is the other way round the fallback would be wrong. Safer fallback: "Manager 1 / Manager 2" like the other modules.
- **Setup settle error text:** `productionSharedShowdownSetup.js` shows `String(code).replace(/_/g," ")` for failures ("SETUP STALE BASE REVISION"). Same raw-code issue as item 4.

## Checked and found fine (so you can skip them)

- Transfer timer uses the Firebase ID-token `issuedAtTime` plus a monotonic clock, so a wrong phone clock cannot start or end the 15 minute window early; the Rules also check `request.time`. It lags the real clock by at most about a second, so expiry is never early.
- All 200 catalog league and nationality ids match the Rules' option-id regex; no valid pick can be rejected by the Rules.
- Season results limits (position 1..teamCount, points up to (teamCount-1)*6, goals up to 300) match between client, protocol and Rules for both 18 and 20 team leagues.
- Every `js/...` file the app loads at runtime is in the service worker shell list (97 listed vs 86 referenced, none missing).
- The final close, simultaneous publish, and acknowledge races fixed in r52 look right in the code; the known open item (`productionSharedShowdownSetup.js:158` dropping `ready` on a transient read failure) is real: any failed setup read sets `ready:false` and every module gated on `pstcConfirmedShared()`-style checks goes quiet until the next successful 15 second refresh. I have nothing new to add on it.

## Not checked

The pairing flow, `persistentNikDanielPair.js`, the terminal close provider internals, the service-worker update path when a new release lands while two phones are mid-game, and any UI layout. No browser or emulator was run.
