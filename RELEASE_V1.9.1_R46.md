# Career Mode Showdown v1.9.1 — Runtime r46

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r46`  
Previous known-good runtime: `1.9.1-r45`

r46 fixes a cross-module error presentation defect found in a focused post-results bug hunt. Season Results and Shared Season Commit display errors in the same review panel. Once both results were ready, a routine Results refresh cleared that panel's error even when a Commit attempt had genuinely failed and the provider state had not advanced. This could remove the only actionable explanation before the player retried.

Results now clears only an error that Results itself placed in the panel. Commit preserves its own failed action message while the provider remains unchanged and clears it when an authoritative read confirms that the attempted commit or acknowledgement succeeded. A browser regression covers a rejected commit, an accepted commit whose response was lost, and an accepted peer acknowledgement whose response was lost. It failed on r45 for the genuine rejection and passed after the repair. Results and Commit desktop/mobile audits and their production contracts pass on this candidate.

No Firestore Rules, session authority, pairing, scoring formulas, canonical storage writes or billing configuration change. Firebase remains Spark-only with billing permanently OFF and App Check enforcement OFF.

The entry assets, lazy visuals, manifest, and service worker advance to r46; the service worker retains r45 as its previous shell. The physical acceptance guide and validator expect exact deployed r46 evidence only after this candidate passes POS20 and publishes. Until publication, production r45 remains the active test target.

SSJR-1.1 remains `0/100`. This bug fix and all automated proof earn zero physical acceptance credit. Nik and Daniel still need one genuine two-account, two-device, two-network run through CLOSED AFTER RELOAD with both sanitized evidence exports.
