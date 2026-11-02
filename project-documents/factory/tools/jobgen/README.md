# Job generator (source of truth for jobs/ and BOARD.json)

`python3 project-documents/factory/tools/jobgen/gen_jobs.py` rewrites every `jobs/JOB-NNN.md` and `BOARD.json`, creates missing status files, and keeps worker progress in existing ones (only the title and the step total are synced).

Edit job text HERE, not in jobs/*.md: a hand edit to a job file is lost on the next run.

Hard rules:
- Job numbers come from the order of `job(...)` calls. Never add, remove or reorder jobs; that renumbers every job and breaks status files and the board.
- Changing the number of steps in a job that is IN PROGRESS or DONE breaks its `Step: k of n`. Change step counts only for jobs whose status is NOT STARTED.
- Post-processing blocks (truth lines for specific jobs) go before the line `# ---------------------------------------------------------------- numbering, waves, writing`.
- `screens.py` holds the per-screen data (NEW_SCREENS, SYSTEM_SCREENS).

One-turn jobs (CC-007, 2026-10-04):
- A job is one Sol turn: reads ≤ 5 files beyond the job and status file, writes ≤ 3 work files plus the status file saved last, about 200 lines, one decision. A bigger job is split with `split(key, parts)`.
- `split(...)` calls are APPEND-ONLY, like `job(...)` calls: a new split goes after the last one, so parts 140+ never renumber.
- After any generator change, check that no NOT STARTED job still says "type continue": `grep -l "Type continue" jobs/JOB-*.md` against the NOT STARTED status list (CC-007 missed job 128 this way).
