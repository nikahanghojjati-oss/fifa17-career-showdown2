# Status · JOB-06 · Start/Join view model + nav.locked

State: IN PROGRESS
Step: 4 of 7
Updated: 2026-10-02 19:48 UTC
Chat: Sol chat
Code branch: gameplay/job-06-start-join-model
Head commit: d00b7547140937fa5dfaecb7601d7b5294917bcc
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37055033109

## Notes
- Step 1: baseline on recovery head `4491e36378446b3a06ff2d28aa861bb892d87357`; `js/sharedCareerAnalytics.js` exists; Product contracts passed `97/97`; Operations audit ended `ℹ pass 73`. Validate Gameplay Fast has only the lead-approved known JOB-02 race at `two-manager-journey-emulator.cjs:220`.
- Step 2 pair: functions `normalizeRivalryId, parsePairLink, readPairLink, persistPairLink, initialize, startPairing, joinPairing, retryPairLink, abandonCurrentShowdown, discardStalePendingConnection, continuePair, openRecovery, startOver, render, subscribe, getState`; initial state verified.
- Step 2 session: functions `hostSession, joinSession, retryPendingOperation, refreshSession, revokeSession, closeSession, forgetSession, openPanel, closePanel, subscribe, getState`; initial state verified.
- Step 2 identity: functions `initialize, signIn, chooseManager, openGate, forgetThisDevice, readRole, clearRole, syncPair, subscribe, getState`; initial state verified. All Job 6 provider methods exist.
- Step 3: all 20 contract cases saved first at `431bcc9c275dca446555f0c6c80599223dc623e1`; unimplemented wrapper saved at `0a9787067c79d4f28211e7239f1e5c7c1f90fadf`. Direct Node witness: `EXPECTED FAIL: not implemented`.
- Step 4: `navLockState`, `LOCKED_SCREENS`, and `NAV_LOCK_TEXT` implemented at `d00b7547140937fa5dfaecb7601d7b5294917bcc`; four locked ids map to the contract reasons, known other screens/null unlock, unknown strings throw `NAV_SCREEN_UNKNOWN`.

## Self-check

## Blocked question

## Lead answer (2026-10-02 19:40 UTC)
Don't wait on the known JOB-02 race. If it is the only red item on Job 6's exact head, record it as `PASS except known JOB-02 race (lead fixing)` and continue.
