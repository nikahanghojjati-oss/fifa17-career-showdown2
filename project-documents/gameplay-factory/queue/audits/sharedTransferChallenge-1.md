# JOB-1487 — Shared transfer challenge, first-half audit

Scope: `js/sharedTransferChallenge.js`, first half (input, catalog, signing, and persisted-state validation). Reading audit only; no gameplay code changed.

## Finding 1 — PROBABLE: leading/trailing whitespace rejects a signing instead of normalizing its name

- **File and lines:** `js/sharedTransferChallenge.js:76-79`.
- **Player impact:** If the signing form passes a player name with an accidental leading or trailing space (for example `" Alex Morgan "`), locking the signings fails with `TRANSFER_SIGNINGS_INVALID`. The manager cannot advance until the spaces are removed. This depends on whether the calling UI already trims the field, which was outside this ticket's read scope.
- **Why:** The function computes a trimmed value but then explicitly rejects any original input that differs from it:
  ```js
  const name=String(item.name||"").trim();
  if(!name||name.length>80||name!==item.name)stcFail("TRANSFER_SIGNINGS_INVALID");
  ```
- **Smallest change:** Accept the trimmed string while preserving the nonempty and length checks: remove `||name!==item.name`; the existing returned `{slot:item.slot,name,...}` then stores the normalized value. Confirm the UI uses the normalized value on display.

Other high-risk areas reviewed without a supported player-facing finding: duplicate/out-of-range guess and signing slots (lines 56-80), catalog membership checks (lines 40-42, 63-65, 78), and receipt/revision/state lock consistency (lines 96-118).
