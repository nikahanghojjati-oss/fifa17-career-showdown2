# WEC closure provenance — PR #115 production App Check runtime — 2026-08-20

This file is an append-safe closure record for `we-2026-08-20-production-app-check-runtime`. Current source and live GitHub state override recorded facts. It exists because the central `WORK_ENVIRONMENT_HISTORY.md` is large enough that replacing the entire file through the connector would create unnecessary append-only rewrite risk; the complete transition facts are therefore preserved here and in the canonical successor handoff without rewriting prior history.

## Environment

Environment ID: `we-2026-08-20-production-app-check-runtime`
Starting independently verified live main: `7944b87a20cf793c659077d7518c4446f178e32c`
PR: #115 `Connect production App Check runtime safely`
Branch: `agent/production-app-check-runtime`
Application: `1.4.0`
Production runtime at packaging: `1.4.0-r1`
Candidate runtime: `1.4.0-r2`

Bounded owner-authorized task: connect only Firebase App + Firebase App Check to the production-origin shipped client through controlled browser-public runtime configuration while preserving local/offline-first behavior, App Check enforcement OFF, application-client Firestore writes deny-all, no Firestore/Auth/Storage/Functions client initialization, no trusted mutation authority, no IAM expansion and no Stage 3/Connected Rivalry/Remote Joining UX.

## Clean pre-packaging checkpoint

Exact pre-packaging validated head: `36debe7511bd4001a17be03b5e3d787559fd032a`

All 13 normal PR workflow families completed successfully on that unchanged head. Chromium Stability and Candidate C browser restore/recovery also completed successfully. Submitted reviews were empty, inline review threads were empty and PR mergeability was true.

This head is evidence only. SLE packaging and the final transition-prepared WEC seal intentionally move the branch; the successor must validate the final sealed exact head before publication.

## WEC signals at mandatory-transition decision

These counters describe only this environment and are intentionally conservative. Unknown account/model usage remains unavailable and is not estimated.

- `contextComplexity`: `very-high`
- `projectComplexity`: `very-high`
- `compactionCount`: `1`
- `majorPhasesCompleted`: `3`
- `largeEvidenceEvents`: `8`
- `toolRoutingErrors`: `2`
- `correctedFailures`: `16`
- `repeatedMistakes`: `1`
- `staleFactCorrections`: `1`
- `unresolvedFailures`: `0`
- `newMilestoneNext`: `false` because the successor first continues publication of the same PR #115 checkpoint
- `usageRemainingPercent`: `null`
- `usageSource`: `unavailable`
- `usageWarning`: `false`
- `handoffCompleteness`: `100` after the root/mirror handoff, starter, capsule and this closure record are complete
- `unrecordedDecisions`: `0`
- `atomicOperation`: `false`

Under the repository WEC formula, quality risk clamps to `100` (`2×6 + 16×4 + 1×18 + 1×12 = 106`). That independently triggers `HANDOFF_NOW`. Context pressure also clamps to `100`; continuation risk is high even with usage omitted. The environment therefore must package and transition at the current coherent PR #115 checkpoint rather than continue into publication/deployment or another milestone.

## Material corrections and classification

The corrected-failure count covers source-grounded validation defects encountered while reconciling historical Stage 2 boundaries with the authorized r2 App Check runtime. Major correction classes were:

- Stage 2A through 2I historical/current-authority contract separation without weakening emulator, Auth, revocation, App Check, IAM or deny-write protections;
- connected-data export boundary authority reconciliation;
- App Check bootstrap contract correction to the actual lazy architecture where the production runtime loader is shell-cached but mutable config/bootstrap are not offline startup dependencies;
- r2 runtime fallback contracts changed from brittle prose-only checks to behavioral offline/provider-failure proof;
- release-authority Markdown/provenance normalization without changing project state;
- `NEXT_TASK.md` restoration of former clean-stop provenance and the permanent validation topology: 14 permanent workflow families and 27 protected workflow blocks.

No unresolved product/security defect remains at the pre-packaging checkpoint. RJR-1 remains `59/100`; process/contract cleanup does not increase it.

## Security/recovery locks at closure

App Check enforcement remains OFF.

Every application-client Firestore create/update/delete remains deny-all.

PR #115 initializes no Firestore, Firebase Authentication, Storage or Functions client service and grants no trusted mutation authority or IAM permission.

Stage 2H least-privilege account-bootstrap IAM proof remains exactly `firebaseauth.users.get`, `datastore.databases.get`, `datastore.entities.get`, `datastore.entities.create` and is not activated/broadened by PR #115.

Canonical storage remains exactly `careerModeShowdown.saveLibrary`, `careerModeShowdown.legacyShowdowns`, `careerModeShowdown.preferences`; `activeShowdown` is not canonical.

Candidate A remains non-mutating export, Candidate B remains read-only import analysis and Candidate C remains the sole destructive Apply authority.

Public discovery/community/matchmaking/invitation directories/lobbies/rankings/global leaderboards remain prohibited/eliminated.

## Exact successor action

Use `START_NEXT_SESSION_V1.3.1_PR115.md` first and `SUCCESSOR_HANDOFF_PR115_APP_CHECK_RUNTIME_SLE_2026-08-20.md` as deep fallback.

The successor must initialize a fresh WEC, fetch live PR #115, verify the final WEC seal is the last branch mutation, require all 13 normal workflow families green on that exact sealed head, re-check reviews/threads/mergeability, then use standing owner authorization to expected-head squash-merge/deploy. Afterward independently verify live `1.4.0-r2`, deliver controlled browser-public Firebase/App Check runtime configuration, prove legitimate production App Check traffic while enforcement remains OFF, preserve local/offline behavior and deny-all browser writes, and update RJR only if new production capability evidence satisfies RJR-1.

Do not begin Stage 3 Registered Devices / Private Pairing until remaining genuine Stage 2 production/account/operational trust and IAM activation/hardening prerequisites are DONE / MERGED / PROVEN.
