# Sol 3.0.0 job S2: swapped phone and lost taps (W2 + W3), the riskiest Phoenix changes (High)

Read `r100-sol/_HOUSE_RULES_R100.md` on this branch first. IDs: `S2-NN`.

## Pins (open PRs into gameplay/r100; review each at its head)
- **#1590 W2** `claude-gameplay/r100-w2-fresh-device` head `8758f3b00903a6a9e506f931872fb2e175730936`: a swapped (brand-new) phone lands on the step the SHARED record says, not on a device-only "done" note. File: `js/productionSharedTransferChallenge.js` (+21/-3), plus the steps that hold device-only notes (`js/rosterRouletteStep.js`, `js/squadSheetStep.js`).
- **#1592 W3** `claude-gameplay/r100-w3-tap-memory` head `31a7c231fdca8c373935868dcc589ca6b4a603fd`: one shared tap memory (`js/sharedTapMemory.js`, new, 92 lines) so a shared tap whose answer was lost lands by itself after a reload, exactly once. Wired into Season Results publish, Season Commit (LOCK & CONFIRM / CONFIRM), Transfer War locks, Career Start; Terminal Close forgets a closed Showdown's notes; `service-worker.js` precache.
- Diffs: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/1590/files and /pull/1592/files

## Known limit (do not report): a phone swapped right after the LAST CONFIRM of the Showdown opens on Home, and History holds the finished Showdown (F3 is out of 3.0).

## Sharp questions
- W2: swap a phone (new browser profile, same Google account) at every step of a season. Does it always land on the step the shared record says, never one behind (repeating a step) or one ahead (skipping one)? Hardest points: between the two Transfer War locks, between publish and commit, right after the rival's LOCK & CONFIRM, during Roster Roulette and Squad LOCK.
- W3: tap a shared action, lose the network or kill the tab before the answer arrives, reopen. Does the tap land by itself exactly once? Can it land TWICE (once from the original request that actually reached the server, once from the resend)? Can it land in the WRONG season or the WRONG Showdown (resend after the season moved on, after END SHOWDOWN, after a REMATCH)?
- W3: the user edits what was tapped (EDIT MY RESULT, a result field, a guess, a signing) after the lost tap. Is the stale note always dropped, so the OLD values can never be sent?
- W3 + two tabs: the same phone with two tabs open. Can both tabs resend the same note?
- Privacy: does the tap memory store any private value (a result, a guess, a signing) somewhere the OTHER manager's phone could read, or show it on screen before the reveal?
- W2 + W3 together: a lost tap on phone A, then the manager continues on a NEW phone B. Can phone A, reopened later, resend an old tap over what phone B already did?

## Already proven (challenge only with a concrete hole)
- W2: swap fault 15/15, CE2PG 81/81. W3: tapkill 15/15, same-tab reload 15/15, network 15/15, 116/116 contracts that load the changed files.
