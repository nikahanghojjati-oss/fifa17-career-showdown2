# HO-009 · Team V → Team G · GPT workers: CI gates and the Physio are expected, never removed

```ticket
{
 "id": "HO-009",
 "from": "V",
 "to": "G",
 "title": "GPT workers: CI gates and the Physio are expected, never removed",
 "kind": "protocol",
 "priority": "top",
 "worker": "sol-chat",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-05T23:41:08Z", "by": "V", "status": "SENT", "note": ""}]
}
```

## What
Nik (2026-10-05, 7:39 PM Boston) saw the GPT chat on job 1001 (career mode project) call the Physio and gate files "branch contamination" and isolate its CSS onto a clean branch (PR #388). Nothing was deleted, but Nik wants every GPT worker to know the CI gates and the Showdown Gate Physio exist and to treat them as expected, never delete, revert or bypass them.

Cause on 1001: `gameplay/job-1001-home-tile-icons` was cut from main after #385 (Physio), while the PR base `gameplay/bug-list-1` is at 61489dd, so the PR diff showed 11 Physio files next to the CSS.

## Please do in Team G
1. Add the block below to your GPT worker instructions (your handbook and job template). Nik will also paste it into the ChatGPT project instructions of both "career mode" and "Showdown visual" himself.
2. Optional: cut future GPT job branches from the PR base (`gameplay/bug-list-N`), or bring main into the base first, so PRs only show the worker's change.
3. Mark this DONE with where you put it.

Team V already did the same: boot box in project-documents/factory/FACTORY_RULES.md and WORKER_HANDBOOK.md section 9b on factory/v1-wtt5ye (ece140f8). Please correct anything inaccurate about your gates.

## The block
```
CHECKS AND THE PHYSIO (5 Oct 2026). The repo has automatic CI checks ("gates") and a check watchdog called Showdown Gate Physio. Both belong to the project. They are not contamination, not part of your job, and not yours to fix.
- The gates: Validate POS20 (its last step is "POS20 exact-head cognitive seal"), Validate Gameplay Fast, and the new Showdown Gate (six lanes, L1 to L6). The Physio re-runs a check only when GitHub gave it no machine, at most twice. It reports ALL_CLEAR, BARKING or STUCK, and BARKING is normal. It never edits your branch.
- Their files: .github/workflows/, scripts/gate-watchdog.mjs, scripts/gate-preempt.mjs, scripts/physio-status.mjs, POS20_*.json, tests/contracts/, tests/support/, tests/operations/. Never delete, revert, edit, rename, disable or skip any of them, and never re-run, trigger or wait on a check.
- If your branch or PR shows files you did not write, they came from a newer main than the PR base. Leave them alone. Either open the PR anyway and name those files in your status note ("from main, not mine, untouched"), or make a new branch from the PR base and re-apply only your own change. Never delete a branch.
- A red or missing check is the lead's job. Finish your job and end with "the lead checks CI".
```
