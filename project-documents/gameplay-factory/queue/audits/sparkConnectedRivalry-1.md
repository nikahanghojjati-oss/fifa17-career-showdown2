# JOB-1495 · sparkConnectedRivalry.js first half audit

Read: `js/sparkConnectedRivalry.js` lines 1 to 723 (the first half of 1446 lines). The check of the receiving side uses `js/restore.js` line 482, which is read only to confirm the mismatch; it is not part of the file list for this job.

## Finding 1 · PROBABLE · a publish can succeed with a Season list that the other device later refuses to apply

- **File and line:** `js/sparkConnectedRivalry.js` lines 334-336 (`crBuildProjection`). The `seasonIds` list is filtered, and any round whose `seasonId` is missing or malformed is dropped silently.
- **What the player sees:** the first player publishes a Showdown. Its published `seasonIds` list has one fewer entry than its `rounds`, so the publish is accepted. On the other device, the remote-to-local preview then fails with "The remote Season identities do not match the gameplay payload." The second player cannot preview or apply that remote revision, and nothing in the UI explains that the first player's Showdown was the source of the bad data.
- **Why the code does it:**
  ```
  const seasonIds=rounds
    .map(round=>round&&typeof round.seasonId==="string"?round.seasonId.trim():"")
    .filter(value=>/^season_[0-9a-f]{24}$/.test(value));
  ```
  The receiving check in `js/restore.js` line 482 maps the same `rounds` without filtering and requires `canonical(payloadSeasonIds)===canonical(data.seasonIds)`, so a dropped round can never match.
- **Smallest change:** in `crBuildProjection`, throw a clear error (for example `CONNECTED_RIVALRY_SEASON_IDENTITY_INVALID`) when any round lacks a valid `season_…` ID, so the publish fails on the sending device instead of leaving a remote revision that cannot be applied. Do not filter.
- **Confidence limit:** PROBABLE, not SURE. It needs a local round without a valid `seasonId`. The current save code is expected to always assign one, and this job does not read the code that creates rounds.

## Riskiest places checked (no other real bug found)

1. Lines 533-562 (`crPublishSharedState` replay path): a retry with the same idempotency key and fingerprint returns `replayed`, and a different request under the same key raises `IDEMPOTENCY_CONFLICT`. A double tap with the same key cannot write twice.
2. Lines 564-581 (stale base check): the state existence and the base revision are checked inside the transaction, before any write, so two devices that publish from the same base cannot both succeed.
3. Lines 720-726 (`crNextPairingActivationRetryDelay`): the retry delay is capped at the remaining window, and it returns null once the attempt count or the window is spent, so the retry cannot run forever.

No game file was edited. This job adds one audit file only.
