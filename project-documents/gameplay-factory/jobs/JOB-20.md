# JOB-20 · A late season acknowledgement retries instead of failing

| Lane | Depends on | Steps | Code branch | PR into | Codex review |
| --- | --- | --- | --- | --- | --- |
| **lead** (built and tested by the lead; no worker chat needed) | none | 3 | `gameplay/job-20-season-ack-race` | `gameplay/recovery-v1` | no |

## 1. Problem

Nik saw "Your shared season acknowledgement could not be recorded" (a permission error) when both managers acknowledged the committed season at nearly the same time.

Root cause: the Rules check the `revision+1` transition against the document as it is at commit time (`firestore.season-commit-production.fragment.rules:252,264,270`). When the rival's acknowledgement lands inside this manager's transaction, the server answers permission-denied, which the Firestore SDK never retries, so the adapter's stale retry (`js/productionSharedSeasonCommit.js:129-134`) never ran.

## 2. Fix (one lazy file, no Rules change)

`js/sparkSharedSeasonCommit.js`: on permission-denied after a queued write, one fresh, fully authority-checked read. Only if it proves the stored commit advanced past the revision this attempt read, the result becomes the existing `SEASON_COMMIT_STALE_BASE_REVISION`, and the adapter's single bounded retry completes the acknowledgement. Any other denial stays permission-denied.

## 3. Proof

- New `tests/contracts/shared-season-commit-concurrent-acknowledge-contracts.cjs` (7 checks): fails on the old code, passes with the fix. Registered last.
- New `tests/firebase/shared-season-commit-concurrent-acknowledge-emulator.cjs` (4 scenarios on the composed production Rules, deterministic race), wired into "Validate Gameplay Fast" as "Season commit concurrent acknowledge". Old code: `got permission-denied`; fixed: PASS.
- `npm run test:contracts` 112/112, `npm run test:ops` 73/0.
- Exact-head "Validate Gameplay Fast" on the PR decides the merge.

## 4. Note

The same lost-race shape may exist in other two-writer ledgers (Career Start acknowledge, transfer early-end, multi-season progression). Not in this job.
