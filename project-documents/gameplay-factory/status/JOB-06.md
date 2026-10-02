# Status · JOB-06 · Start/Join view model + nav.locked

State: IN PROGRESS
Step: 6 of 7
Updated: 2026-10-02 19:45 UTC
Chat: Sol chat
Code branch: gameplay/job-06-start-join-model
Head commit: 7bca7253845b59c7d7c2d0ec48023306c1934cb9
PR: #320 https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/320
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37055716278

## Notes
- Step 1: baseline on recovery head `4491e36378446b3a06ff2d28aa861bb892d87357`; `js/sharedCareerAnalytics.js` exists; Product contracts passed `97/97`; Operations audit ended `ℹ pass 73`. Validate Gameplay Fast has only the lead-approved known JOB-02 race at `two-manager-journey-emulator.cjs:220`.
- Step 2 pair: functions `normalizeRivalryId, parsePairLink, readPairLink, persistPairLink, initialize, startPairing, joinPairing, retryPairLink, abandonCurrentShowdown, discardStalePendingConnection, continuePair, openRecovery, startOver, render, subscribe, getState`; initial state verified.
- Step 2 session: functions `hostSession, joinSession, retryPendingOperation, refreshSession, revokeSession, closeSession, forgetSession, openPanel, closePanel, subscribe, getState`; initial state verified.
- Step 2 identity: functions `initialize, signIn, chooseManager, openGate, forgetThisDevice, readRole, clearRole, syncPair, subscribe, getState`; initial state verified. All Job 6 provider methods exist.
- Step 3: all 20 contract cases saved first at `431bcc9c275dca446555f0c6c80599223dc623e1`; unimplemented wrapper saved at `0a9787067c79d4f28211e7239f1e5c7c1f90fadf`. Direct Node witness: `EXPECTED FAIL: not implemented`.
- Step 4: `navLockState`, `LOCKED_SCREENS`, and `NAV_LOCK_TEXT` implemented at `d00b7547140937fa5dfaecb7601d7b5294917bcc`; four locked ids map to the contract reasons, known other screens/null unlock, unknown strings throw `NAV_SCREEN_UNKNOWN`.

- Step 5: full pure Start/Join view model implemented at `7354601b08ec3bc616784b63fe585b37c2677979`; direct execution of current branch source passed `PASS Start/Join view model contracts (20/20 cases)`.

- Step 6: registered the contract in POS20 and wired the ops census; exact head `7bca7253845b59c7d7c2d0ec48023306c1934cb9` passed `20/20`, full contracts `98/98`, ops `73/73`, and all emulator lanes. PR #320 is open into `gameplay/recovery-v1`.

## Self-check

## Blocked question

## Lead answer (2026-10-02 19:40 UTC)
Don't wait on the known JOB-02 race. If it is the only red item on Job 6's exact head, record it as `PASS except known JOB-02 race (lead fixing)` and continue.
