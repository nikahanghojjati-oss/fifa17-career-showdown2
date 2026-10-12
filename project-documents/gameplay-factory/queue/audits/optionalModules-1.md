# JOB-1671 · `js/optionalModules.js` first-half gameplay audit

Reviewed `js/optionalModules.js` lines 1–292 of 585 on `qa/mega-audits`. This is a read-only gameplay audit; no runtime code was changed.

## 1. PROBABLE — Retrying a partially initialized gameplay runtime can duplicate prior initializers

- **File and lines:** `js/optionalModules.js:156–175` and `js/optionalModules.js:259–274`.
- **Player-visible behavior:** If one of the gameplay initializers fails partway through opening the game, a subsequent attempt can re-run initializers that had already completed. If those earlier initializers register click listeners, a single tap may trigger its action twice or leave the screen in a confusing state. This requires an initialization failure; the supplied file does not establish whether every initializer is independently idempotent.
- **Why (code excerpt):**
  ```js
  initializer();
  });
  gameplayRuntimeInitialized = true;
  ```
  The initialized flag is set only after the whole loop; `ensureGameplayModules()` clears its in-flight promise after an error and allows the next call to attempt initialization again, including already-successful initializers.
- **Smallest change:** Make initializer calls idempotent across retry paths (or track successfully completed initializers and skip them on retry, with a safe retry strategy for the initializer that failed). Keep the existing screen and tap sequence unchanged.

## Other high-risk paths examined

- `loadRuntimeStyle` (lines 23–90): existing-link detection, load/error/timeout cleanup, and retryable CSS failure.
- `loadRuntimeScript` (lines 92–154): readiness checks, retryable network failure, and intentional non-retry when a script executed without its expected API.
- `loadGameplayRuntimeFiles` / `ensureGameplayModules` (lines 177–275): ordered module dependencies, CSS waits, and the shared in-flight promise.

No additional player-visible bug was substantiated from the permitted first-half source.
