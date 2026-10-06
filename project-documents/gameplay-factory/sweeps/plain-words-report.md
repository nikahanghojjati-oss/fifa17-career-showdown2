# JOB-1011 plain-words sweep report

Scope: player-visible gameplay, connection, settings, and recovery copy on `gameplay/job-1011-plain-words`. Console-only messages, error codes, data keys, comments, and acceptance/recorder-only tooling are excluded. Exact strings found in the relevant tests are marked `yes` and must remain unchanged.

| file:line | current text | proposed plain text | asserted by test |
| --- | --- | --- | --- |
| js/productionSharedCanonicalScoring.js:47 | SHARED CANONICAL SCORE | SHARED SEASON SCORE | yes |
| js/productionSharedFinalReconciliation.js:49 | SHOWDOWN FINAL RECONCILED | SHOWDOWN FINAL RESULT | no |
| js/productionSharedFinalReconciliation.js:53 | FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP | FINAL RESULTS ARE LOCKED · CLOSE THE SHOWDOWN WHEN READY | no |
| js/productionSharedHistoryConvergence.js:80 | SHARED HISTORY CONVERGED | SHARED HISTORY READY | yes |
| js/productionSharedLocalReconciliation.js:30 | Waiting for authoritative Shared History. | Waiting for shared history. | no |
| js/productionSharedLocalReconciliation.js:30 | Offline: the read-only preview can use the last observed remote snapshot. | Offline: you can preview the last shared result saved on this device. | no |
| js/productionSharedLocalReconciliation.js:30 | Offline with no observed remote snapshot yet. | Offline: no shared result has been saved on this device yet. | no |
| js/productionSharedLocalReconciliation.js:30 | Local Reconciliation is preparing. | Local save check is getting ready. | no |
| js/productionSharedLocalReconciliation.js:33 | LOCAL RECONCILIATION | LOCAL SAVE CHECK | yes |
| js/productionSharedLocalReconciliation.js:34 | Preview the exact remote snapshot against this device without changing the canonical local Save. Candidate C Apply is intentionally not exposed in this gameplay flow. | Compare the shared result with this device without changing your local Save. Apply is available only in advanced recovery. | no |
| js/productionSharedLocalReconciliation.js:36 | PREVIEW READY ✓ · CANONICAL LOCAL SAVE REMAINS UNCHANGED | PREVIEW READY ✓ · YOUR LOCAL SAVE IS UNCHANGED | no |
| js/productionSharedLocalReconciliation.js:36 | LOCAL RECONCILIATION WAS ALREADY APPLIED THROUGH ADVANCED RECOVERY | THIS RESULT WAS ALREADY APPLIED IN ADVANCED RECOVERY | no |
| js/productionSharedLocalReconciliation.js:38 | CHECKING LOCAL RECONCILIATION… | CHECKING LOCAL SAVE… | no |
| js/productionSharedLocalReconciliation.js:38 | PREVIEW LOCAL RECONCILIATION | PREVIEW SHARED RESULT | yes |
| js/productionSharedLocalReconciliation.js:116 | LOCAL RECONCILIATION PREVIEW NOT READY | PREVIEW NOT READY | no |
| js/productionSharedLocalReconciliation.js:117 | LOCAL RECONCILIATION PREVIEW FAILED | PREVIEW FAILED | no |
| js/productionSharedMultiSeasonProgression.js:127 | ALL … SEASONS ARE AUTHORITIVELY ACCEPTED · FINAL RECONCILIATION REMAINS A SEPARATE STEP | ALL … SEASONS ARE ACCEPTED · FINAL RESULT IS NEXT | no |
| js/productionSharedMultiSeasonProgression.js:130 | SEASON … HISTORY IS CONVERGED ON THIS DEVICE · CONTINUE ONCE TO SEASON … | SEASON … HISTORY IS READY ON THIS DEVICE · CONTINUE ONCE TO SEASON … | no |
| js/productionSharedSeasonCommit.js:110 | THE SHARED RESULT SNAPSHOT IS COMMITTED · BOTH MANAGERS MUST ACKNOWLEDGE BEFORE SCORING CAN BEGIN | THE SHARED SEASON RESULT IS LOCKED · BOTH MANAGERS MUST CONFIRM BEFORE SCORING CAN BEGIN | no |
| js/productionSharedSeasonCommit.js:113 | BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT… | BOTH RESULTS ARE READY · LOCK THE SHARED SEASON RESULT… | yes |
| js/productionSharedSeasonResults.js:114 | Check your seven season facts carefully. Publishing is immutable for this manager and season. | Check your seven season facts carefully. Publishing is final for this manager and season. | no |
| js/productionSharedSeasonResults.js:116 | PUBLISHING IS FINAL FOR YOUR MANAGER · CANONICAL LOCAL SAVE IS NOT MODIFIED | PUBLISHING IS FINAL FOR YOUR MANAGER · YOUR LOCAL SAVE IS NOT CHANGED | no |
| js/productionSharedSeasonResults.js:126 | …Nothing on this screen writes to the canonical local Save. | …Nothing on this screen changes your local Save. | no |
| js/productionSharedTerminalClose.js:103 | TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY | CLOSED · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS STAY READ-ONLY | no |
| js/productionSharedTerminalClose.js:107 | TERMINAL CLOSE OUTCOME PENDING | SHOWDOWN CLOSE STILL PENDING | no |
| js/productionSharedTerminalClose.js:107 | Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability. | The close may have finished online. Retry checks the same close request. | no |
| js/productionSharedTerminalClose.js:107 | RETRY SAME TERMINAL CLOSE | RETRY SAME SHOWDOWN CLOSE | yes |
| js/productionSharedTerminalClose.js:110 | TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS | SHOWDOWN CAN CLOSE WHEN BOTH PLAYERS RECONNECT | no |
| js/productionSharedTerminalClose.js:110 | Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close. | Final results are safe. Reconnect both players to this Showdown, then refresh. | no |
| js/productionSharedTerminalClose.js:112 | FINAL RESULT READY FOR TERMINAL CLOSE | FINAL RESULT READY TO CLOSE | no |
| js/productionSharedTerminalClose.js:112 | This permanently closes the shared rivalry and exact active private session. Final results remain readable; another season or replacement session cannot resurrect this Showdown. | This closes the shared Showdown and current connection for good. Final results stay available, and no new season can be added. | no |
| js/productionSharedShowdownPresentation.js:99 | Exact pairing and an ACTIVE private session are required before the wheel can spin. | Both players must be connected before the wheel can spin. | no |
| js/productionSharedShowdownPresentation.js:100 | PAIRING + ACTIVE SESSION VERIFIED · Spin the league wheel. The provider owns the result. | BOTH PLAYERS CONNECTED · Spin the league wheel. | no |
| js/productionSharedShowdownPresentation.js:101 | AUTHORITATIVE SHARED SETUP OPEN · Spin the real league wheel. | SHARED SETUP OPEN · Spin the league wheel. | no |
| js/productionSharedShowdownPresentation.js:108 | …is authoritative and locked for both managers. | …is locked for both managers. | no |
| js/productionSharedShowdownPresentation.js:143 | AUTHORITATIVE CLUB DRAW LOCKED · OPENING PACK 01 | CLUB DRAW LOCKED · OPENING PACK 01 | no |
| js/productionSharedShowdownPresentation.js:165 | Daniel's original season choice is authoritative and identical on this device. | Daniel's original season choice is locked and matches this device. | no |
| js/productionSharedShowdownPresentation.js:165 | This device does not match the authoritative season plan. Use Showdown recovery before confirming. | This device does not match the shared season plan. Use Showdown recovery before confirming. | no |
| js/productionSharedShowdownPresentation.js:174 | AUTHORITATIVE CLUB PACKS · Open the original two-pack reveal. | SHARED CLUB PACKS · Open the original two-pack reveal. | no |
| js/productionSharedShowdownPresentation.js:174 | AUTHORITATIVE CLUB PACKS · Waiting for the host. These packs will open automatically when the provider commits the clubs. | SHARED CLUB PACKS · Waiting for the host. These packs will open automatically when the clubs are locked. | no |
| js/productionSharedShowdownPresentation.js:175 | SHARED SETUP COMPLETE · Both managers witnessed the league wheel and club packs on this device. | SHARED SETUP COMPLETE · Both managers saw the league wheel and club packs on this device. | no |
| js/productionSharedShowdownPresentation.js:175 | WATCH BOTH CLUB PACK REVEALS · Confirmation unlocks after this device witnesses them. | WATCH BOTH CLUB PACK REVEALS · Confirmation unlocks after both packs open on this device. | no |
| js/productionSharedShowdownPresentation.js:175 | OPENING AUTHORITATIVE CLUB PACKS · Both managers see the same two reveals. | OPENING SHARED CLUB PACKS · Both managers see the same two reveals. | no |
| js/productionSharedShowdownSetup.js:173 | Reading the authoritative Shared Setup for this exact ACTIVE session… | Checking the shared setup for this Showdown… | no |
| js/productionSharedShowdownSetup.js:181 | Authoritative Shared Setup resumed without reset or redraw. | Shared setup restored without a reset or redraw. | no |
| js/productionSharedShowdownSetup.js:216 | Submitting one authoritative Shared Setup transition… | Saving this shared setup step… | no |
| js/productionSharedShowdownSetup.js:223 | Both managers can now read the same authoritative Shared Setup state. | Both managers now have the same shared setup. | no |
| js/productionSharedShowdownSetup.js:245 | AUTHORITATIVE SHARED SETUP | SHARED SETUP | no |
| js/productionSharedShowdownSetup.js:250 | Waiting for the ACTIVE session host to open this authoritative setup. No local draw is available. | Waiting for the host to open the shared setup. | no |
| js/productionSharedShowdownSetup.js:266 | DRAW AUTHORITATIVE LEAGUE | DRAW SHARED LEAGUE | no |
| js/productionSharedShowdownSetup.js:277 | One authoritative league, two distinct permanent clubs from that league, and one 1 / 3 / 5 / 10 season length. A fresh ACTIVE session for the same rivalry resumes this state and never redraws it. | One shared league, two different permanent clubs from that league, and a 1 / 3 / 5 / 10 season length. Reconnecting resumes the same setup without a redraw. | no |
| js/sparkConnectedRivalry.js:939 | Reading authoritative shared gameplay state… | Reading shared gameplay… | no |
| js/sparkConnectedRivalry.js:965 | Authoritative shared state refreshed at revision … No local save was overwritten. | Shared game updated. Your local save was not changed. | no |
| js/sparkConnectedRivalry.js:966 | No authoritative shared state exists yet. The first publish will create revision 0. | No shared game is online yet. Your first publish will create it. | no |
| js/sparkConnectedRivalry.js:975 | Publishing this local Showdown projection with deterministic revision and replay protection… | Publishing this Showdown online… | no |
| js/sparkConnectedRivalry.js:1003 | The accepted mutation was replayed safely at revision …; no duplicate revision was created. | Your previous publish was confirmed. No duplicate was created. | no |
| js/sparkConnectedRivalry.js:1004 | Shared gameplay projection published at revision … Local Save Library remains unchanged. | Shared game published. Your local Save Library is unchanged. | no |
| js/sparkConnectedRivalry.js:1013 | Building a non-mutating preview for this exact remote revision and local Save target… | Building a read-only preview for this shared result and local Save… | no |
| js/sparkConnectedRivalry.js:1049 | Candidate C is verifying the remote base, completing a canonical backup and guarding the exact local commit… | Checking the shared result, backing up your local Save, and preparing Apply… | no |
| js/sparkConnectedRivalry.js:1080 | Local commit complete: remote revision … was applied… after a verified backup and exact Candidate C transaction. | Apply complete: the shared result was applied… after a verified backup. | no |
| js/sparkConnectedRivalry.js:1105 | Refresh and preview are read-only. Local gameplay changes only after exact confirmation, a verified backup and Candidate C Apply… | Refresh and preview do not change your local game. Your local Save changes only after confirmation, a verified backup, and Apply. | no |
| js/sparkConnectedRivalry.js:1129 | Immutable base revision · no silent rebase | Publishes only from the version you reviewed | no |
| js/sparkConnectedRivalry.js:1130 | Available from Showdown Home · exact private session | Available from Showdown Home · both players connected | yes |
| js/sparkConnectedRivalry.js:1293 | BACK UP + APPLY EXACT REVISION | BACK UP + APPLY | yes |
| js/sparkRemoteJoining.js:335 | PRIVATE SESSION · EXACT CAPABILITY ONLY | PRIVATE CONNECTION | no |
| js/sparkRemoteJoining.js:335 | REMOTE JOINING | CONNECT PLAYERS | yes |
| js/sparkRemoteJoining.js:335 | No lobby, listing or public discovery… exact page-memory capability… | This connection is only for Daniel and Nik. If the network drops, retry the same code instead of creating another one. | no |
| js/sparkRemoteJoining.js:339 | OPEN PRIVATE SESSION | CREATE CONNECTION CODE | no |
| js/sparkRemoteJoining.js:339 | Creates one fresh 256-bit capability for the currently attached two-manager Connected Rivalry. | Creates one fresh code for this Showdown. | no |
| js/sparkRemoteJoining.js:341 | HOST PRIVATE SESSION | HOST PRIVATE SESSION | yes |
| js/sparkRemoteJoining.js:344 | Exact private session code | Connection code | no |
| js/sparkRemoteJoining.js:345 | JOIN PRIVATE SESSION | JOIN PRIVATE SESSION | yes |
| js/sparkRemoteJoining.js:348 | CURRENT PAGE-MEMORY SESSION | CURRENT CONNECTION | no |
| js/productionSharedJourneyReconnect.js:94 | SHARED JOURNEY HELD OFFLINE · Provider authority is not being claimed… | OFFLINE · Reconnect before continuing this shared Showdown. | no |
| js/productionSharedJourneyReconnect.js:95 | SHARED JOURNEY RECOVERY PENDING · Resolve the exact private-session operation… | RECONNECTING · Finish reconnecting both players before continuing. | no |
| js/productionSharedJourneyReconnect.js:97 | FRESH PRIVATE SESSION REQUIRED · … | NEW CONNECTION NEEDED · … | no |
| js/productionSharedJourneyReconnect.js:98 | …ALL … SEASONS REMAIN TERMINAL · A new session cannot resurrect another season. | …ALL … SEASONS STAY COMPLETE · Reconnecting cannot add another season. | no |
| js/productionSharedTransferChallenge.js:220 | Shared Transfer Window · the coordinator starts one server-authoritative 15-minute window. | Shared Transfer Window · the coordinator starts one shared 15-minute window. | no |
| js/productionSharedTransferChallenge.js:253 | …opponent payload that provider authority has not already made available. | …opponent information that has not already been revealed. | no |
| js/productionSharedTransferChallenge.js:255 | …cannot mutate provider or local save authority. | …cannot change the shared game or your local save. | no |
| js/restoreUI.js:99 | EXACT STORAGE SNAPSHOT UNAVAILABLE | BROWSER DATA CHECK UNAVAILABLE | no |
| js/restoreUI.js:99 | Browser storage could not be read without ambiguity. Nothing can be applied until a complete exact snapshot succeeds. | Browser data could not be checked safely. Nothing can be applied until the check succeeds. | no |
| js/restoreUI.js:202 | Restore committed and verified. Refreshing the application from canonical state… | Restore verified. Refreshing the application from your saved data… | no |
| js/restoreUI.js:255 | CANDIDATE C · VERIFIED APPLY | VERIFIED RESTORE | no |
| js/saveLibraryUI.js:390 | …before its first authoritative save. | …before its first save. | no |
| js/saveLibraryUI.js:657 | …before the Showdown receives its first authoritative write. | …before the Showdown is saved for the first time. | no |
| js/settings.js:411 | …kept separate from your three canonical Showdown data keys. | …kept separate from your saved Showdown data. | no |
| js/transferChallenge.js:876 | …using the canonical FIFA 17 former-league and nationality lists. | …using the FIFA 17 former-league and nationality lists. | no |
| js/seasonFinalV10.js:29 | SHOWDOWN FINAL RECONCILED | SHOWDOWN FINAL RESULT | no |
| visual-assets/v10_1/final-winner/app-strings.json:34 | SHOWDOWN FINAL RECONCILED | SHOWDOWN FINAL RESULT | no |
| visual-assets/v10_1/final-winner/app-strings.json:37 | FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP | FINAL RESULTS ARE LOCKED · CLOSE THE SHOWDOWN WHEN READY | no |
| visual-assets/v10_1/final-winner/app-strings.json:40 | FINAL RESULT READY FOR TERMINAL CLOSE | FINAL RESULT READY TO CLOSE | no |
| visual-assets/v10_1/final-winner/app-strings.json:41 | This permanently closes the shared rivalry and exact active private session… | This closes the shared Showdown and current connection for good… | no |
| visual-assets/v10_1/final-winner/app-strings.json:43 | TERMINAL CLOSE OUTCOME PENDING | SHOWDOWN CLOSE STILL PENDING | no |
| visual-assets/v10_1/final-winner/app-strings.json:44 | Provider acknowledgement was not received… | The close may have finished online. Retry checks the same close request. | no |
| visual-assets/v10_1/final-winner/app-strings.json:46 | TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS | SHOWDOWN CAN CLOSE WHEN BOTH PLAYERS RECONNECT | no |
| visual-assets/v10_1/final-winner/app-strings.json:47 | Final results are preserved… exact private session… | Final results are safe. Reconnect both players to this Showdown, then refresh. | no |

## Notes

- `yes` rows are intentionally left unchanged by this job.
- The sweep preserves `Apply` as the action word.
- No ids, classes, data keys, error codes, logic, or tests are proposed for change.
