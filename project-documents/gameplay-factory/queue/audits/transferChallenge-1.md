# JOB-1481 — Transfer Challenge first-half audit

Scope: `js/transferChallenge.js`, lines 1–514, on `qa/mega-audits`. Reading audit only; no gameplay files modified.

## Finding 1 — PROBABLE: stale saved option ID hides an otherwise valid label

- **File and line:** `js/transferChallenge.js:190–196` (affects migrations at lines 220–239).
- **What the player sees:** After reopening a transfer challenge saved with an outdated league or nationality ID but a still-valid text label, the displayed value can remain recognizable while its canonical ID is cleared. A guess or signing that had been entered cannot be locked without reselecting that option; the existing selection appears filled in but fails validation.
- **Why:** The canonical-ID lookup tries the stored ID *instead of* the saved label when both are present, with no fallback on a failed lookup:

  ```js
  const option = window.resolveFifa17TransferOption(kind, idValue || labelValue);
  return option ? option.id : "";
  ```

  `migrateSigning` and `migrateGuess` then store the empty ID, even though the original label can be retained in `league`, `nationality`, or `value`.
- **Smallest change:** Resolve `idValue` first; if it does not resolve and `labelValue` is present, retry with the saved label before assigning an empty ID. Keep the already-valid-ID path unchanged. Add a focused regression case for stale ID + valid label when the implementation is fixed.

## Other high-risk paths checked, without a further defensible finding

- **Season primary action and reopen** (`315–334`, `377–401`): complete/current-round routing and persisted-state restore.
- **Window start and deadline handling** (`355–375`, `404–438`): one challenge per season, explicit save rollback, and expiry on reopen.
- **Timer/update loop** (`440–493`): deadline-based remaining time, repeated taps, and hidden-screen shutdown. The timer-restart contract with other modules cannot be determined from this file alone, so it is **not** reported as a finding.

No test or runtime execution was requested for this reading-only audit.
