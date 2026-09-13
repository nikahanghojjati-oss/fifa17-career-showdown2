# Career Mode Showdown v1.9.1 — Runtime r20

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r20`

Previous known-good runtime: `1.9.1-r19`

Runtime `1.9.1-r20` is a bounded MDP Physical Journey repair derived from the first genuine two-physical-device r19 production attempt. The attempt proved that the Chromebook host could reach an ACTIVE private session while the iPhone peer could be stranded after joining: `CONTINUE CAREER` resumed an unrelated local career and Remote Joining could ask for the private session code again instead of returning the peer to the Shared Showdown journey.

r20 makes the intended ownership explicit. Both manager devices prepare their own new pre-draw Shared Showdown shell before pairing, preserving any older local careers. The exact pairing then binds those two prepared shells. After the peer joins the exact private session once and the provider confirms ACTIVE, Shared Journey Entry automatically reclaims the route. `CONTINUE CAREER` remains local-only and is not used to enter a remote Shared Showdown. `OPEN SHARED SETUP` remains a host-only control inside the authoritative Shared Setup experience rather than a Home-menu command.

r20 also corrects an acceptance-instrumentation defect exposed by the same physical attempt. r19 hashed all canonical Save Library state from recorder startup through export, which incorrectly classified legitimate setup/gameplay save changes as corruption. r20 scopes canonical-storage integrity to the read-only Local Reconciliation preview itself: a sanitized hash is captured immediately before preview and verified immediately after. Candidate C Apply remains sticky and disqualifying; the recorder still performs no recorder-owned network request and never invokes Candidate C.

There is no Firestore Rules change and no provider write/list authority expansion in r20. Firebase remains Spark-only with Billing permanently OFF. App Check enforcement remains OFF. No Cloud Run or Cloud Functions dependency is introduced. Exactly two private managers remain the supported topology.

r20 does not itself earn Physical Journey credit. MDP remains `95.50/100` until new genuine two-account, two-physical-device, two-network r20 production evidence passes the paired oracle and the capability subsequently completes its separate integration/accounting lifecycle. SSJR-1.1 remains exactly `0/100`.