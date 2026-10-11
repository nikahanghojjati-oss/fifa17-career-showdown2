# JOB-1480 · `js/seasonEngine.js` second-half gameplay audit

Scope: read-only audit of the season save, confirmation and summary progression logic, especially lines 485–957. No game code changed. Both findings are **PROBABLE** because the behavior depends on an external storage helper throwing, which cannot be established from the one allowed source file.

## 1. PROBABLE — Storage exception leaves a season completed in memory but unsaved

- **File/line:** `js/seasonEngine.js:515–533` (especially 526).
- **What the player sees:** If browser storage throws during **CONFIRM & SAVE SEASON** (for example, a quota/security write error), the screen says season completion failed and stays on Review. But the in-memory showdown has already gained the round and advanced to the next season, or to Completed. Another confirm can then say the season has already been saved even though persistence failed; navigating elsewhere can show a misleading completed season until reload.
- **Why:** The season's rounds, score and status are mutated before saving. The rollback only runs when `saveCurrentShowdown()` **returns falsy**; a thrown exception skips the rollback and reaches the outer error handler.
  ```js
  if(!saveCurrentShowdown()){
      currentShowdown.rounds.length = previousState.roundsLength;
      currentShowdown.currentRound = previousState.currentRound;
  ```
- **Smallest change:** Wrap the save attempt in `try/catch` (or `try/finally`) within `persistCompletedSeason`; restore the snapshot on **both** a false return and a thrown exception, then rethrow a usable error. Preserve the existing scoring and button order.

## 2. PROBABLE — Archive exception is misreported as a failed season save

- **File/line:** `js/seasonEngine.js:535–544` and `791–801`.
- **What the player sees:** If the active save succeeds but the Legacy archive operation throws, the UI reports **Season completion failed** and leaves the player on Review, despite the completed round already being saved. Trying Confirm again is blocked because the showdown is now Completed; the normal Season Summary is not shown.
- **Why:** The code handles a falsy archive result as a recoverable warning but does not handle an exception. The exception propagates through the save call into `confirmCurrentSeason`'s generic failure handler.
  ```js
  const archived = archiveShowdown(currentShowdown);
  if(!archived && typeof window.showAppNotice === "function"){
  ```
- **Smallest change:** Treat thrown archive failures like a false archive result within the already-successful save path: catch them locally, log/show the existing nonfatal Legacy warning, and continue to Season Summary. Do not retry or resave the season automatically.

## Other high-risk paths checked

- `765–832`: The `seasonCompletionInProgress` guard prevents a rapid double confirmation during synchronous persistence; no independent duplicate-save finding.
- `743–763`: Confirmation rejects a different showdown/round or a season already in `rounds`; no proven stale-review overwrite from this file alone.
- `839–949`: Summary scoring, final-season button label and the next-season transfer action were inspected; the dashboard route may be intentional, so it is not reported as a defect.
