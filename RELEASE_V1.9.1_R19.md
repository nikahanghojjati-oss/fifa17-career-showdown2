# Career Mode Showdown v1.9.1 — Runtime r19

Status: RELEASE CANDIDATE

Application version: `v1.9.1`

Runtime asset revision: `1.9.1-r19`

Previous known-good runtime: `1.9.1-r18`

Runtime `1.9.1-r19` adds acceptance-only instrumentation for the MDP Physical Journey milestone while preserving the existing Private Remote Joining product boundary. It does not itself earn Physical Journey credit. MDP remains `95.50/100` until genuine production two-account, two-physical-device, two-network evidence is accepted and the capability completes its full integration/accounting lifecycle. SSJR-1.1 remains exactly `0/100`.

The r19 recorder is loaded only when both `ssjr-acceptance=1` and `ssjr-physical=1` are present. It records privacy-safe SHA-256 fingerprints and ordered journey milestones across Shared Setup, Career Start, Transfer Challenge, results, commit, canonical scoring, history, offline/reconnect recovery, a non-writing conflict-guard self-test, read-only Local Reconciliation, Final Reconciliation, Terminal Close and CLOSED-after-reload proof. The paired validator requires opposite managers, distinct devices and networks, same rivalry/session correlation and unchanged canonical local storage.

There is no Firestore Rules change and no new provider write/list authority in r19. Firebase remains Spark-only with Billing permanently OFF; App Check enforcement remains OFF; no Cloud Run or Cloud Functions dependency is introduced. Exactly two private managers remain the complete supported topology. Candidate C remains the sole destructive local Apply path and the standard Physical Journey acceptance run does not invoke it.

The new acceptance asset is part of the r19 offline shell so a real offline/reload proof can keep the observer available without weakening provider authority. Normal production mode does not load or expose the Physical Journey recorder.
