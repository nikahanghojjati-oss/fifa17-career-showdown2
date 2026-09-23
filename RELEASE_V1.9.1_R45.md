# Career Mode Showdown v1.9.1 — Runtime r45

Application version: `v1.9.1`  
Runtime asset revision: `1.9.1-r45`  
Previous known-good runtime: `1.9.1-r44`

r45 is a bounded physical-acceptance repair discovered by the first real two-device r44 Nik/Daniel journey on 2026-09-22.

The r44 physical run proved that both managers could pair, complete Shared Setup, Career Start, Transfer Challenge and publish Season Results, but then both production devices stopped on the old r9 `RESULTS_READY` presentation. The UI stated that shared scoring remained a separate capability and exposed no Shared Season Commit action. The downstream production modules already existed and their isolated browser/contracts were green, but the real Results route did not bootstrap them.

r45 fixes the real player continuation. Opening Shared Season Results now bootstraps and installs the bounded post-results production chain: Shared Season Commit, Canonical Scoring, Shared History Convergence, Multi-Season Progression, Journey Reconnect, Local Reconciliation, Final Reconciliation and Terminal Close. The existing authority ordering is unchanged: both Results must be ready before coordinator commit, both managers independently acknowledge before scoring, canonical scoring remains provider-derived, History remains read-only derived authority, and terminal closure remains separate.

r45 also hardens the Shared Season Results presentation defects found during the Astra/source review. An unpublished Review draft now survives ordinary provider polling, render refreshes no longer erase a visible review/publication error, and refresh-promise cleanup no longer creates an ignored rejecting `.finally()` child.

The stale r9 dead-end copy is replaced with current Shared Season Commit guidance.

The physical acceptance guide now explicitly requires sign-in and manager identity before `START A SHOWDOWN`, matching the real production entry dependency discovered during the same physical run.

No scoring weights, manager mapping, club rules, Firestore schema, Firestore Rules, Firebase billing posture, App Check posture or provider write authority are changed by r45. Firebase remains Spark-only, billing remains permanently OFF, Cloud Run and Cloud Functions remain unused, and App Check enforcement remains OFF.

The r45 shell identity advances all cache-busted entry assets and retains r44 as the rollback runtime so Chrome/Safari cannot silently continue the stale r44 player path after deployment.

Remote Joining, private pairing, connected-account identity, ACTIVE-session authority, and the existing two-manager provider boundary remain unchanged by this repair.

SSJR-1.1 remains exactly `0/100`. Source changes, CI, deployment, and this r45 repair earn no SSJR credit. Physical acceptance remains unearned until a fresh two-account, two-device, two-network r45 run reaches CLOSED AFTER RELOAD and both sanitized evidence exports validate. The failed r44 journey is diagnostic evidence only and must not be counted as acceptance.
