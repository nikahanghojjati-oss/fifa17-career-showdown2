# JOB-19 · Resume a Shared Showdown after reload; closed Showdowns stay on Home

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **lead** (built and tested by the lead; no worker chat needed) | none | 3 | `gameplay/job-19-reload-resume` | `gameplay/recovery-v1` | no |

## 1. Problem

Found by the JOB-16 browser journey (J9 skipped, J12 workaround).

- After a reload mid-Showdown, the GET READY overlay reopened over CAREER READY · CONTINUE CAREER (`js/productionSharedJourneyEntry.js:283` opened it whenever the permanent shared marker existed).
- After rejoining a session, the app replayed Career Start and season 1: the season cursor lives in page memory and restarts at 1 (`js/productionSharedMultiSeasonProgression.js:38-44`).
- After a closed Showdown, the overlay also reopened, because `js/persistentNikDanielPair.js:76` reports a closed rivalry as plain "unpaired".
- The private session code is page-memory only by contract (stage5e/5g), so resuming always needs a fresh session: Daniel hosts, Nik joins. That stays.

## 2. Fix (lazy files only, no Rules change)

- GET READY auto-open is decided by the saved pair state: it opens only for a never-paired shell.
- The pair state records `closedRivalryId` for a remembered closed rivalry.
- `resumeFromAuthority()` moves the cursor forward to the provider's next unplayed season (or the final one when terminal), never past authority; CONTINUE CAREER then lands on the dashboard.

## 3. Proof

- New `tests/contracts/shared-journey-reload-resume-contracts.cjs`: fails on the old code (`A1 a CLOSED Showdown must not re-open the GET READY overlay after reload`), passes with the fix. Registered last.
- Browser journey: J9 is now a real reload and resume (J9.1-J9.3); J12 asserts the closed overlay stays shut (workaround removed). Two local runs passed 35/35.
- `npm run test:contracts` 112/112, `npm run test:ops` 73/0.
- Exact-head "Validate Gameplay Fast" on the PR decides the merge.

## 4. Follow-up (not in this job)

A rare J10 flake (Nik's final reconciliation stays hidden after all three seasons) was seen in local runs before and after this fix. Likely cause: any brief setup-read failure drops season authority (`js/productionSharedShowdownSetup.js:158`). The lead will write a separate hardening job.
