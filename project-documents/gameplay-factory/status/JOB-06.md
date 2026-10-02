# Status · JOB-06 · Start/Join view model + nav.locked

State: IN PROGRESS
Step: 2 of 7
Updated: 2026-10-02 19:43 UTC
Chat: Sol chat
Code branch: gameplay/job-06-start-join-model
Head commit: 4491e36378446b3a06ff2d28aa861bb892d87357
PR:
CI run: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/actions/runs/37054023600

## Notes
- Step 1: baseline on recovery head `4491e36378446b3a06ff2d28aa861bb892d87357`; `js/sharedCareerAnalytics.js` exists; Product contracts passed `97/97`; Operations audit ended `ℹ pass 73`. Validate Gameplay Fast has only the lead-approved known JOB-02 race at `two-manager-journey-emulator.cjs:220`.
- Step 2 pair: functions `normalizeRivalryId, parsePairLink, readPairLink, persistPairLink, initialize, startPairing, joinPairing, retryPairLink, abandonCurrentShowdown, discardStalePendingConnection, continuePair, openRecovery, startOver, render, subscribe, getState`; getState `{"status":"idle","initialized":false,"busy":false,"accountId":null,"deviceId":null,"managerRole":null,"managerId":null,"rivalryId":null,"connectionState":null,"providerSaveId":null,"providerProfileId":null,"capability":null,"message":"Getting your Showdown ready…"}`.
- Step 2 session: functions `hostSession, joinSession, retryPendingOperation, refreshSession, revokeSession, closeSession, forgetSession, openPanel, closePanel, subscribe, getState`; getState `{"status":"idle","open":false,"busy":false,"sessionId":null,"rivalryId":null,"accountId":null,"deviceId":null,"role":null,"sessionState":null,"revision":null,"expiresAtEpochMs":null,"pendingAction":null,"capabilityCopyAllowed":false,"message":"Remote Joining is private and action-only. No session request has been sent."}`.
- Step 2 identity: functions `initialize, signIn, chooseManager, openGate, forgetThisDevice, readRole, clearRole, syncPair, subscribe, getState`; getState `{"status":"idle","initialized":false,"busy":false,"online":true,"accountId":null,"managerId":null,"managerLabel":null,"deviceId":null,"registered":false,"message":"Preparing your player…"}`. All provider methods required by Job 6 are present.

## Self-check

## Blocked question

## Lead answer (2026-10-02 19:40 UTC)
Don't wait on the known JOB-02 race. If it is the only red item on Job 6's exact head, record it as `PASS except known JOB-02 race (lead fixing)` and continue.
