# RJR score provenance audit: owner-recalled 81, recovered pre-RJR 82, fixed-ledger 77 and 78

Originally recorded: 2026-08-24 ET

Audit closed: 2026-08-25 ET

Status: provenance recovered and backcast complete; no RJR-1 score mutation

Current numerical authority: `REMOTE_JOINING_READINESS.json`, model `RJR-1`, `78/100`

## Finding

The exact recoverable historical Remote Joining readiness report is `82/100`, not `81/100`.

No exact Remote Joining readiness `81` statement was found in prior-conversation retrieval, current source, all fetched reachable Git refs or the relevant Library artifacts. The owner's recollection of 81 remains preserved as a real discrepancy, but it is not silently substituted for the recovered source value.

The recovered `82` was an intuition-based prerequisite/infrastructure estimate. It had no named model version, fixed domain weights, reproducible evidence ledger or itemized calculation. It is therefore non-comparable with RJR-1 scores `58` through `78`.

The evidence available at the time of the `82` report backcasts to `58/100` under the fixed end-to-end measurement. No capability was lost and no credited evidence was invalidated. The apparent `82 -> 58` movement was a ruler correction, not a legal RJR-1 score decrease.

The only comparable sequence is:

`RJR-1 58 -> 59 -> 61 -> 62 -> 63 -> 69 -> 72 -> 73 -> 74 -> 77 -> 78`

## Recovered conversation provenance

Prior-conversation retrieval produced this timestamped sequence:

| UTC timestamp | Source event | Report or explanation | Classification |
| --- | --- | --- | --- |
| 2026-08-20T01:50:59Z | Assistant status | `Remote Joining readiness: ~58%` after PR #113 production Rules proof, while App Check/reCAPTCHA registration remained next. | End-to-end estimate before formal RJR-1 publication. |
| 2026-08-20T01:57:56Z | Assistant correction after the owner challenged `82 -> 58` | Restored `Remote Joining readiness: ~82%` and described the earlier change as denominator drift, but supplied no fixed weights or calculation. | Unsupported restoration; non-comparable prerequisite estimate. |
| 2026-08-20T02:39:43Z | Owner challenge | The owner correctly said the restored 82 looked artificial/unsupported and requested a truthful explanation of `82 -> 58 -> 82`. | Trigger for a reproducible recalculation. |
| 2026-08-20T02:41:39Z | Assistant methodological correction | Acknowledged the restoration was wrong; calculated `11.5/20 = 57.5%`, rounded to `58%`; stated that 82 measured prerequisite/infrastructure completion rather than end-to-end Remote Joining readiness. | Reproducible end-to-end precursor to the RJR-1 baseline. |
| 2026-08-20T03:25:03Z | Successor assistant status | `Remote Joining readiness: 82/100`. | Reintroduced the unsupported pre-model estimate. |
| 2026-08-20T03:25:23Z | Successor assistant status | Repeated `Remote Joining readiness: 82/100` because the production Rules prerequisite was described qualitatively as high-weight. No denominator construction, fixed domain weights or itemized evidence was provided. | Exact originating report recovered; non-comparable with RJR-1. |

No exact `81/100`, `~81%` or `81%` Remote Joining readiness status line was recovered. The exact `82` reports above are the closest source evidence and resolve the model question without denying the owner's recollection.

## Recovered 20-condition calculation

The 2026-08-20T02:41:39Z correction scored these end-to-end conditions in order. Each full condition was one of 20 equal units:

| # | Condition | Credit |
| --- | --- | ---: |
| 1 | Approved private authentication works conceptually/provider-side | 0.50 |
| 2 | UID to accountId identity boundary | 1.00 |
| 3 | Device registration/revocation | 0.00 |
| 4 | Private pairing/session relationship | 0.00 |
| 5 | Invite/session authorization and abuse controls | 0.25 |
| 6 | Two-owner entitlement/governance | 0.75 |
| 7 | Trusted backend owns privileged mutation | 0.50 |
| 8 | Revision/CAS/idempotency/tombstone model | 1.00 |
| 9 | Two-device convergence proof | 0.75 |
| 10 | Offline/reconnect deterministic behavior | 1.00 |
| 11 | Conflict protection | 1.00 |
| 12 | Local-only outage safety | 1.00 |
| 13 | Candidate A/B/C recovery safety | 1.00 |
| 14 | Actual remote manager joins rivalry | 0.00 |
| 15 | Session/revocation/failure paths | 0.50 |
| 16 | App Check/Auth/application-authorization/IAM trust chain | 0.75 |
| 17 | Browser Firestore writes remain denied | 1.00 |
| 18 | Real-browser first Remote Joining flow | 0.00 |
| 19 | Production rollback/security posture | 0.50 |
| 20 | Hardened/versioned stable Remote Joining release | 0.00 |
|  | Total | 11.50 / 20 |

`11.5 / 20 = 57.5%`, reported as approximately `58%`.

This checklist is not silently declared to be RJR-1. Its value is corroborating provenance: it shows, before RJR-1 was formalized, why the same known capability boundary was approximately 58 rather than 82.

## Fixed RJR-1 backcast

RJR-1 was formally recorded at 2026-08-20T15:30:00Z with fixed weights `20 + 20 + 20 + 30 + 10 = 100` and a reconstructed baseline of 58 after the same denominator drift was discovered.

The baseline domain vector is deterministically reconstructed by starting from the current earned vector and reversing every append-only domain delta:

| RJR-1 checkpoint | Sync/recovery /20 | Identity/auth/trust /20 | Production cloud/security /20 | Devices/pairing/Connected Rivalry/Remote Join /30 | Real-device/release /10 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Baseline backcast | 20 | 17 | 14 | 4 | 3 | 58 |
| App Check provider registration | 20 | 17 | 15 | 4 | 3 | 59 |
| App Check runtime and token proof | 20 | 17 | 17 | 4 | 3 | 61 |
| Production Google Auth proof | 20 | 18 | 17 | 4 | 3 | 62 |
| Production self-account bootstrap | 20 | 18 | 18 | 4 | 3 | 63 |
| Stage 3 registered-device/private-pairing proof | 20 | 18 | 18 | 10 | 3 | 69 |
| Stage 4 attach/revision-zero/cross-manager read | 20 | 18 | 18 | 13 | 3 | 72 |
| Live stale-base rejection | 20 | 18 | 18 | 14 | 3 | 73 |
| iPhone installed-app/Safari cross-surface hardening | 20 | 18 | 18 | 14 | 4 | 74 |
| Stale recovery/revision-one/cross-manager convergence | 20 | 18 | 18 | 17 | 4 | 77 |
| Chromebook+iPhone two-physical-device hardening | 20 | 18 | 18 | 17 | 5 | 78 |

Every total equals the sum of the five fixed domains. Every movement after 58 matches exactly one or more positive evidence events in `REMOTE_JOINING_READINESS.json`. No negative evidence event exists because no credited capability was invalidated and no proven regression removed capability.

## Why 82, 77 and 78 are not a decrease sequence

`82` and `77` use different rulers:

- `82` was a qualitative prerequisite/infrastructure completion estimate with unspecified weighting;
- `77` was a later fixed RJR-1 capability score after production Stage 3 and Stage 4 evidence;
- `78` was the same fixed RJR-1 model after one additional two-physical-device hardening point.

The defensible chronology is therefore:

1. pre-model estimate 82, rejected as inflated and non-reproducible;
2. end-to-end backcast 58 at the same capability boundary;
3. evidence-backed RJR-1 increases from 58 through 77;
4. evidence-backed RJR-1 increase from 77 to 78.

There is no `81 -> 77` RJR-1 regression to justify. Describing it as a four-point capability loss would be false.

## Search boundary and future evidence

The audit checked:

- exact and regex searches across current source, every fetched remote branch, both repository tags and all reachable commits;
- Git history for the ledger and every official RJR-1 checkpoint;
- prior-conversation retrieval for exact 81 and 82 status lines, nearby owner challenges and the calculation response;
- the relevant Library handoffs and transcripts, including pre-model readiness references of approximately 35, 41, 44 and 45 and later official RJR-1 records.

The Library and Git searches found no exact 81 or itemized 82 calculation. Prior-conversation retrieval found the timestamped 82 reports and the exact 20-condition correction above.

If a later exact 81 artifact appears, preserve it as additional provenance and test it against this fixed-model backcast. Do not overwrite the recovered 82 evidence or recalculate RJR-1 without new comparable capability proof.

## Numerical decision

Official RJR-1 remains `78/100` with current domain vector `20 + 18 + 18 + 17 + 5`.

This audit changes no score, runtime, Firestore Rules, workflow, provider, billing, storage, Candidate C or Stage 5 authority. Source, tests, CI, review, publication and handoff work earn zero RJR points.
