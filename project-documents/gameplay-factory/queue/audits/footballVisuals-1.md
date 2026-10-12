# JOB-1668 — `js/footballVisuals.js` first-half gameplay audit

Reviewed lines 1–151 of `js/footballVisuals.js` on `qa/mega-audits`. Only actionable player-facing behavior is listed.

## Finding 1 — A failed photo preload cannot be retried during the same session — PROBABLE

- **File/line:** `js/footballVisuals.js:20–22, 35–38`
- **What the player sees:** If an image preload fails briefly (for example, during a lost connection), returning to the same screen or retrying after connectivity recovers can still fail immediately. The asset will not be fetched again until the page is reloaded.
- **Why:** A rejected Promise is retained indefinitely in the global preload map, and every subsequent request for that asset returns that same rejected Promise:

  ```js
  if(footballVisualPreloads.has(asset.id)){
      return footballVisualPreloads.get(asset.id);
  }
  ```

  ```js
  footballVisualPreloads.set(asset.id, promise);
  ```

- **Smallest change:** Evict the cached entry when its preload rejects (only if that entry still refers to the failing Promise), then rethrow the error so current error handling is preserved. Successful preloads should remain cached. This allows the next retry to make a fresh network request.
- **Confidence:** **PROBABLE** player impact; the never-retry behavior in this function is certain, but how the player is shown the failure depends on its caller.

No game files were changed.
