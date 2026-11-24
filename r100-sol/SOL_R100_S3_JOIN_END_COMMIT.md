# Sol 3.0.0 job S3: JOIN, END SHOWDOWN and the Season Commit wait (High)

Read `r100-sol/_HOUSE_RULES_R100.md` on this branch first. IDs: `S3-NN`.

## Pins (open PRs into gameplay/r100; review each at its head)
- **#1591** `claude-gameplay/r100-b6-join-offline` head `49bc3fc8c2f2c3b30e1e112f9045c247b1dce82c`: a JOIN tap the network cut keeps Home and lands once when the network is back (same Showdown only; forgotten off Home; expires with the note or 10 min). Files: `js/onlinePlayerIdentity.js`, `js/persistentNikDanielPair.js`.
- **#1598** `claude-gameplay/r100-b6-reload-join` head `1956814f68827360e14d9347b49571e530e6c24a` (contains #1591): Daniel reloads while Nik JOINs; a closed code read as "expired" used to stop Daniel's wait for good. Fix: one last look before the wait stops. File: `js/persistentNikDanielPair.js`.
- **#1603** `claude-gameplay/r100-ended-entry` head `6e410bef0f13b310a179aaa65e60fe80c60076b8`: END SHOWDOWN landing while the other phone presses CONTINUE used to open a stuck Career Start; now the page goes Home only when Terminal Close holds THIS rivalry DELETED from its own server read. Files: `js/productionSharedJourneyEntry.js`, `js/productionSharedTerminalClose.js`.
- **#1596** `claude-gameplay/r100-season-commit-wait` head `f9387a3f0bf99d4eb475458655f6be53aa2ee4ab`: a silent commit listener can no longer hold CONFIRM SEASON back. File: `js/productionSharedSeasonCommit.js`.
- **#1588** `claude-gameplay/r100-w8-step-listeners` head `df54ff91df2d964ae02643f65741d07e28289741`: step listeners (Chamber Men, Prime Pack, Squad sheet, pair) rebuild when their stream is down.

## Sharp questions
- JOIN: Nik taps JOIN offline, leaves Home, comes back, goes online. Can it ever join twice, join a different (newer) code, or join after Daniel cancelled or made a NEW CODE? Daniel reloads at every moment of Nik's JOIN: does either phone end stuck on WAITING?
- END SHOWDOWN: one phone ends the Showdown while the other is on CONTINUE, Career Start, a season step, or the Final Winner. Does the other phone always land on Home (ENDED) or on the Champion path (CLOSED) as the record says, never stuck, never on a live step of a dead Showdown? Can a LIVE Showdown ever be sent Home by mistake (a false "deleted")?
- Season Commit: both phones at LOCK & CONFIRM / CONFIRM with one phone's listener silently dead, one phone asleep, or both tapping at the same moment. Is there exactly one commit, both acknowledgements, and the next season on both, with no extra tap and no stall?
- Reads: do any of these fixes add polling that keeps running after its screen is gone?

## Already proven (challenge only with a concrete hole)
- #1598 replay at seed 2540913475: PASS 3/3. #1603: Opus review clean, contract 8/8 fails on base. #1591: contracts B6-1..16.
