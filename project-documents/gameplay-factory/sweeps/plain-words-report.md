# JOB-1011 plain-words sweep

Scope: player-visible Shared Showdown gameplay copy on `gameplay/job-1011-plain-words`. The sweep checked all 131 `js/*.js` files and both `visual-assets/v10_1/**/app-strings.json` files. Internal keys, comments, console-only text, diagnostics/acceptance-only tooling and protected gate files are excluded.

"Asserted by test" means the exact current player-facing string was found under `tests/` on this branch. Step 3 must not change those rows.

| File:line | Current text | Proposed plain text | Asserted by test |
| --- | --- | --- | --- |
| js/productionSharedCanonicalScoring.js:47 | SHARED CANONICAL SCORE | SHARED SCORE | yes |
| js/productionSharedFinalReconciliation.js:49 | SHOWDOWN FINAL RECONCILED | FINAL RESULTS MATCH | no |
| js/productionSharedFinalReconciliation.js:53 | FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP | FINAL RESULTS ARE READ-ONLY · ONE FINAL CLOSE STEP REMAINS | no |
| js/productionSharedHistoryConvergence.js:80 | SHARED HISTORY CONVERGED | SHARED HISTORY READY | yes |
| js/productionSharedJourneyReconnect.js:94 | SHARED JOURNEY HELD OFFLINE · Provider authority is not being claimed. Reconnect to verify the preserved journey before continuing. | OFFLINE · Your Showdown is saved. Reconnect to check the shared game before continuing. | no |
| js/productionSharedJourneyReconnect.js:95 | SHARED JOURNEY RECOVERY PENDING · Resolve the exact private-session operation before shared state can be authoritative again. | RECONNECTING · Finish reconnecting before shared play can continue. | no |
| js/productionSharedJourneyReconnect.js:96 | NOT CONNECTED ON THIS PHONE · No private session here (for example after a reload). … | NOT CONNECTED ON THIS PHONE · Reconnect this phone to continue. … | no |
| js/productionSharedJourneyReconnect.js:97 | FRESH PRIVATE SESSION REQUIRED · … the private session has ended … | NEW CONNECTION REQUIRED · … the old connection has ended … | no |
| js/productionSharedJourneyReconnect.js:98 | SHARED JOURNEY RECOVERED · ALL … SEASONS REMAIN TERMINAL · A new session cannot resurrect another season. | CAREER RECOVERED · ALL … SEASONS ARE ALREADY FINISHED · A new connection cannot add another season. | no |
| js/productionSharedLocalReconciliation.js:30 | Waiting for authoritative Shared History. | Waiting for the latest shared history. | no |
| js/productionSharedLocalReconciliation.js:30 | Offline: the read-only preview can use the last observed remote snapshot. | Offline: previewing the last shared version seen on this device. | no |
| js/productionSharedLocalReconciliation.js:30 | Offline with no observed remote snapshot yet. | Offline: no shared version has been loaded on this device yet. | no |
| js/productionSharedLocalReconciliation.js:30 | Local Reconciliation is preparing. | Checking this device against the shared game. | no |
| js/productionSharedLocalReconciliation.js:33 | LOCAL RECONCILIATION | CHECK THIS DEVICE | yes |
| js/productionSharedLocalReconciliation.js:34 | Preview the exact remote snapshot against this device without changing the canonical local Save. Candidate C Apply is intentionally not exposed in this gameplay flow. | Compare the shared game with this device without changing your local Save. Apply is available only in Advanced Recovery. | no |
| js/productionSharedLocalReconciliation.js:36 | PREVIEW READY ✓ · CANONICAL LOCAL SAVE REMAINS UNCHANGED | PREVIEW READY ✓ · YOUR LOCAL SAVE HAS NOT CHANGED | no |
| js/productionSharedLocalReconciliation.js:36 | LOCAL RECONCILIATION WAS ALREADY APPLIED THROUGH ADVANCED RECOVERY | THE SHARED RESULT WAS ALREADY APPLIED IN ADVANCED RECOVERY | no |
| js/productionSharedLocalReconciliation.js:38 | CHECKING LOCAL RECONCILIATION… | CHECKING THIS DEVICE… | no |
| js/productionSharedLocalReconciliation.js:38 | PREVIEW LOCAL RECONCILIATION | PREVIEW DIFFERENCES | yes |
| js/productionSharedLocalReconciliation.js:116 | LOCAL RECONCILIATION PREVIEW NOT READY · … | PREVIEW NOT READY · … | no |
| js/productionSharedLocalReconciliation.js:117 | LOCAL RECONCILIATION PREVIEW FAILED · … | PREVIEW FAILED · … | no |
| js/productionSharedMultiSeasonProgression.js:127 | ALL … SEASONS ARE AUTHORITATIVELY ACCEPTED · FINAL RECONCILIATION REMAINS A SEPARATE STEP | ALL … SEASONS ARE SAVED FOR BOTH PLAYERS · ONE FINAL CHECK REMAINS | no |
| js/productionSharedMultiSeasonProgression.js:130 | SEASON … HISTORY IS CONVERGED ON THIS DEVICE · CONTINUE ONCE TO SEASON … | SEASON … HISTORY MATCHES ON THIS DEVICE · CONTINUE ONCE TO SEASON … | no |
| js/productionSharedSeasonCommit.js:110 | THE SHARED RESULT SNAPSHOT IS COMMITTED · BOTH MANAGERS MUST ACKNOWLEDGE BEFORE SCORING CAN BEGIN | THE SHARED RESULT IS SAVED · BOTH PLAYERS MUST CONFIRM BEFORE SCORING CAN BEGIN | no |
| js/productionSharedSeasonCommit.js:113 | BOTH RESULTS ARE READY · AS COORDINATOR, COMMIT THE IMMUTABLE SHARED SEASON SNAPSHOT… | BOTH RESULTS ARE READY · SAVE THE SHARED SEASON RESULT… | no |
| js/productionSharedSeasonResults.js:114 | Check your seven season facts carefully. Publishing is immutable for this manager and season. | Check your seven season facts carefully. After you publish, you cannot change them. | no |
| js/productionSharedSeasonResults.js:116 | PUBLISHING IS FINAL FOR YOUR MANAGER · CANONICAL LOCAL SAVE IS NOT MODIFIED | PUBLISHING IS FINAL FOR YOUR MANAGER · YOUR LOCAL SAVE WILL NOT CHANGE | no |
| js/productionSharedSeasonResults.js:126 | … Nothing on this screen writes to the canonical local Save. | … Nothing on this screen changes your local Save. | no |
| js/productionSharedShowdownPresentation.js:99 | Exact pairing and an ACTIVE private session are required before the wheel can spin. | Both players must be connected before the wheel can spin. | no |
| js/productionSharedShowdownPresentation.js:100 | PAIRING + ACTIVE SESSION VERIFIED · Spin the league wheel. The provider owns the result. | BOTH PLAYERS CONNECTED · Spin the league wheel. The shared result will be saved for both players. | no |
| js/productionSharedShowdownPresentation.js:101 | AUTHORITATIVE SHARED SETUP OPEN · Spin the real league wheel. | SHARED SETUP READY · Spin the league wheel. | no |
| js/productionSharedShowdownPresentation.js:101 | AUTHORITATIVE SHARED SETUP OPEN · Waiting for the host spin. This screen will update automatically. | SHARED SETUP READY · Waiting for the host to spin. This screen will update automatically. | no |
| js/productionSharedShowdownPresentation.js:108 | … is authoritative and locked for both managers. | … is locked in for both managers. | no |
| js/productionSharedShowdownPresentation.js:143 | AUTHORITATIVE CLUB DRAW LOCKED · OPENING PACK 01 | CLUB DRAW LOCKED · OPENING PACK 01 | no |
| js/productionSharedShowdownPresentation.js:165 | Daniel's original season choice is authoritative and identical on this device. | Daniel's original season choice matches on this device. | no |
| js/productionSharedShowdownPresentation.js:165 | This device does not match the authoritative season plan. Use Showdown recovery before confirming. | This device does not match the shared season plan. Use Showdown recovery before confirming. | no |
| js/productionSharedShowdownPresentation.js:174 | AUTHORITATIVE CLUB PACKS · Open the original two-pack reveal. | SHARED CLUB PACKS · Open the original two-pack reveal. | no |
| js/productionSharedShowdownPresentation.js:174 | AUTHORITATIVE CLUB PACKS · Waiting for the host. These packs will open automatically when the provider commits the clubs. | SHARED CLUB PACKS · Waiting for the host. These packs will open automatically when the clubs are saved. | no |
| js/productionSharedShowdownPresentation.js:175 | SHARED SETUP COMPLETE · Both managers witnessed the league wheel and club packs on this device. | SHARED SETUP COMPLETE · Both managers saw the league wheel and club packs on this device. | no |
| js/productionSharedShowdownPresentation.js:175 | WATCH BOTH CLUB PACK REVEALS · Confirmation unlocks after this device witnesses them. | WATCH BOTH CLUB PACK REVEALS · Confirmation unlocks after this device shows both reveals. | no |
| js/productionSharedShowdownPresentation.js:175 | OPENING AUTHORITATIVE CLUB PACKS · Both managers see the same two reveals. | OPENING SHARED CLUB PACKS · Both managers see the same two reveals. | no |
| js/productionSharedShowdownSetup.js:31 | Shared Setup is locked until the exact paired rivalry has an ACTIVE private session. | Shared Setup is locked until both players reconnect to this Showdown. | no |
| js/productionSharedShowdownSetup.js:126 | An exact ACTIVE private session is required before league or club selection. | Both players must be connected before league or club selection. | no |
| js/productionSharedShowdownSetup.js:127 | The private session has expired. Open a fresh ACTIVE session for this rivalry to resume Shared Setup. | The connection has expired. Start a new connection for this Showdown to resume Shared Setup. | no |
| js/productionSharedShowdownSetup.js:128 | The ACTIVE private session no longer matches the exact account, browser and Connected Rivalry authority. | This connection no longer matches this account, browser and Showdown. Reconnect before continuing. | no |
| js/productionSharedShowdownSetup.js:134 | The ACTIVE private session does not expose a valid host or peer role. | This connection cannot tell which player is host or guest. Reconnect and try again. | no |
| js/productionSharedShowdownSetup.js:173 | Reading the authoritative Shared Setup for this exact ACTIVE session… | Loading the shared setup for this connection… | no |
| js/productionSharedShowdownSetup.js:181 | Authoritative Shared Setup resumed without reset or redraw. | Shared Setup resumed without a reset or redraw. | no |
| js/productionSharedShowdownSetup.js:216 | Submitting one authoritative Shared Setup transition… | Saving the next Shared Setup step… | no |
| js/productionSharedShowdownSetup.js:223 | Both managers can now read the same authoritative Shared Setup state. | Both managers now have the same Shared Setup. | no |
| js/productionSharedShowdownSetup.js:232 | Both managers can now read the same authoritative Shared Setup state. | Both managers now have the same Shared Setup. | no |
| js/productionSharedShowdownSetup.js:245 | AUTHORITATIVE SHARED SETUP | SHARED SETUP | no |
| js/productionSharedShowdownSetup.js:250 | Waiting for the ACTIVE session host to open this authoritative setup. No local draw is available. | Waiting for the host to open Shared Setup. No local draw is available. | no |
| js/productionSharedShowdownSetup.js:266 | DRAW AUTHORITATIVE LEAGUE | DRAW LEAGUE | no |
| js/productionSharedShowdownSetup.js:277 | One authoritative league, two distinct permanent clubs from that league, and one 1 / 3 / 5 / 10 season length. A fresh ACTIVE session for the same rivalry resumes this state and never redraws it. | One shared league, two different permanent clubs, and a 1 / 3 / 5 / 10 season length. Reconnecting to the same Showdown keeps these choices and never redraws them. | no |
| js/productionSharedTerminalClose.js:103 | TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY | CLOSED · NO NEW CONNECTION · NO NEW SEASON · FINAL RESULTS STAY READ-ONLY | no |
| js/productionSharedTerminalClose.js:107 | TERMINAL CLOSE OUTCOME PENDING | FINAL CLOSE PENDING | no |
| js/productionSharedTerminalClose.js:107 | Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability. | The close was not confirmed online. Retry uses the same saved final result. | no |
| js/productionSharedTerminalClose.js:107 | RETRY SAME TERMINAL CLOSE | RETRY FINAL CLOSE | yes |
| js/productionSharedTerminalClose.js:110 | TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS | FINAL CLOSE READY AFTER RECONNECT | no |
| js/productionSharedTerminalClose.js:110 | Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close. | Final results are safe. Reconnect this Showdown, then refresh Final Close. | no |
| js/productionSharedTerminalClose.js:112 | FINAL RESULT READY FOR TERMINAL CLOSE | FINAL RESULT READY TO CLOSE | no |
| js/productionSharedTerminalClose.js:112 | This permanently closes the shared rivalry and exact active private session. Final results remain readable; another season or replacement session cannot resurrect this Showdown. | This permanently closes the shared Showdown and current connection. Final results stay readable, and no new season can be added afterward. | no |
| js/productionSharedTerminalClose.js:137 | Terminal state could not be verified. | The final close could not be checked. | no |
| js/productionSharedTerminalClose.js:142 | Final results are preserved, but Terminal Close requires one exact ACTIVE private session for this rivalry. | Final results are safe, but both players must reconnect before Final Close. | no |
| js/productionSharedTerminalClose.js:148 | Unable to refresh Shared Showdown Terminal Close | Unable to refresh Final Close | no |
| js/productionSharedTerminalClose.js:190 | Terminal Close is not ready for this exact Shared Showdown. | Final Close is not ready for this Showdown. | no |
| js/productionSharedTerminalClose.js:195 | The exact private session used by this terminal witness is no longer ACTIVE. | The connection used for this final close has ended. | no |
| js/productionSharedTerminalClose.js:199 | Terminal Close acknowledgement was not received. The exact same terminal witness is retained in page memory for deterministic retry; no replacement session or local-save mutation will be generated. | The final close was not confirmed online. Retry will use the same saved final result and will not change your local Save. | no |
| js/productionSharedTerminalClose.js:201 | Terminal Close was rejected without changing the completed Showdown. | Final Close was rejected without changing the completed Showdown. | no |
| js/productionSharedTerminalClose.js:203 | Terminal Close acknowledgement was not received. Retry is bound to the exact same witness and session capability. | The final close was not confirmed online. Retry will use the same saved final result. | no |
| js/productionSharedTerminalClose.js:210 | No unresolved Terminal Close is waiting for retry. | No unfinished Final Close is waiting for retry. | no |
| js/productionSharedTerminalClose.js:225 | The same Terminal Close retry was rejected; the exact witness remains held for inspection. | The Final Close retry was rejected; the same saved final result is still ready to retry. | no |
| js/productionSharedTerminalClose.js:226 | Shared Showdown Terminal Close retry failed | Final Close retry failed | no |
| js/productionSharedTerminalClose.js:262 | Shared Showdown Terminal Close bootstrap unavailable | Final Close could not start | no |
| js/productionSharedTransferChallenge.js:220 | Shared Transfer Window · the coordinator starts one server-authoritative 15-minute window. | Shared Transfer Window · the coordinator starts one shared 15-minute window. | no |
| js/productionSharedTransferChallenge.js:253 | Historical replay: this read-only screen does not reveal any opponent payload that provider authority has not already made available. | Historical replay: this read-only screen never reveals opponent information that was not already shared. | no |
| js/productionSharedTransferChallenge.js:255 | Historical replay: your own committed signing view is read-only and cannot mutate provider or local save authority. | Historical replay: your committed signings are read-only and cannot change the shared game or your local Save. | no |
| js/seasonFinalV10.js:29 | SHOWDOWN FINAL RECONCILED | FINAL RESULTS MATCH | no |
| visual-assets/v10_1/final-winner/app-strings.json:34 | SHOWDOWN FINAL RECONCILED | FINAL RESULTS MATCH | no |
| visual-assets/v10_1/final-winner/app-strings.json:37 | FINAL RESULTS ARE READ-ONLY · TERMINAL CLOSE REMAINS A SEPARATE STEP | FINAL RESULTS ARE READ-ONLY · ONE FINAL CLOSE STEP REMAINS | no |
| visual-assets/v10_1/final-winner/app-strings.json:40 | FINAL RESULT READY FOR TERMINAL CLOSE | FINAL RESULT READY TO CLOSE | no |
| visual-assets/v10_1/final-winner/app-strings.json:41 | This permanently closes the shared rivalry and exact active private session. Final results remain readable; another season or replacement session cannot resurrect this Showdown. | This permanently closes the shared Showdown and current connection. Final results stay readable, and no new season can be added afterward. | no |
| visual-assets/v10_1/final-winner/app-strings.json:43 | TERMINAL CLOSE OUTCOME PENDING | FINAL CLOSE PENDING | no |
| visual-assets/v10_1/final-winner/app-strings.json:44 | Provider acknowledgement was not received. Retry uses the exact same terminal witness and session capability. | The close was not confirmed online. Retry uses the same saved final result. | no |
| visual-assets/v10_1/final-winner/app-strings.json:45 | RETRY SAME TERMINAL CLOSE | RETRY FINAL CLOSE | yes |
| visual-assets/v10_1/final-winner/app-strings.json:46 | TERMINAL CLOSE READY WHEN PRIVATE AUTHORITY RETURNS | FINAL CLOSE READY AFTER RECONNECT | no |
| visual-assets/v10_1/final-winner/app-strings.json:47 | Final results are preserved. Open or join one fresh exact private session for this rivalry, then refresh Terminal Close. | Final results are safe. Reconnect this Showdown, then refresh Final Close. | no |
| visual-assets/v10_1/final-winner/app-strings.json:49 | TERMINAL · NO NEW SESSION · NO NEW SEASON · FINAL RESULTS REMAIN READ-ONLY | CLOSED · NO NEW CONNECTION · NO NEW SEASON · FINAL RESULTS STAY READ-ONLY | no |
