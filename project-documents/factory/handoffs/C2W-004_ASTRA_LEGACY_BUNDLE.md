# C2W-004 · Astra bundle: Legacy (History) review, fix round and motion

From Claude (Team V visual lead) to one Astra chat. Written 2026-10-04.

## What this is

Nine factory jobs on one screen, Legacy (History), in one chain. Each job waits for the one before it, so one chat doing them back to back is the fastest path. The jobs are reserved for you on the board (`State: IN PROGRESS · ASTRA`); no other chat will take them.

| Order | Job | What |
| --- | --- | --- |
| 1 | 165 | Legacy: review (part 2 of 4) |
| 2 | 166 | Legacy: review (part 3 of 4) |
| 3 | 167 | Legacy: review (part 4 of 4) |
| 4 | 75 | Legacy: fix round (part 1 of 3) |
| 5 | 168 | Legacy: fix round (part 2 of 3) |
| 6 | 169 | Legacy: fix round (part 3 of 3) |
| 7 | 76 | Legacy: motion (part 1 of 3) |
| 8 | 170 | Legacy: motion (part 2 of 3) |
| 9 | 171 | Legacy: motion (part 3 of 3) |

Screen folder: `visual-assets/v10_1/legacy/`. Repo `nikahanghojjati-oss/fifa17-career-showdown2`, branch `factory/v1-wtt5ye` only.

## Rules

1. Your rules are the box in `project-documents/factory/FACTORY_RULES.md` plus `project-documents/factory/WORKER_HANDBOOK.md`. Read both once at the start.
2. For each job in the order above: read `jobs/JOB-NNN.md` and `status/JOB-NNN.md`, do its steps in order, and save after every step exactly as the job file says (one commit per step, message `Job N step k/n: <name>`). Save the status file last with `State: DONE`. Then go straight to the next job. Do not stop between jobs, do not ask Nik anything, and never ask him to type continue.
3. `State: IN PROGRESS · ASTRA` on these nine status files means "reserved for you". Treat it like NOT STARTED. Your first save on each job replaces it with your normal IN PROGRESS or DONE state.
4. Text only. Never save images or other binary files. If a job wants a picture, write the recipe in `visual-assets/v10_1/legacy/tools/MAKE_ASSETS.md` and Claude runs it.
5. Job 74 (review part 1) was already done by another chat; `visual-assets/v10_1/legacy/review/REVIEW.md` holds its start. You are the reviewer for 165, 166 and 167 because you did not build Legacy. Score honestly from the evidence. Hard gates you cannot measure without a browser are `NOT MEASURED (Claude measures)`, never PASS or FAIL.
6. Legacy facts that already hold. Daniel is LEFT and Nik is RIGHT. The phone layout uses Claude's band fix at the end of `legacy.css` (art layers 55% high, UI layer from the top, title below the managers' faces); keep it. Phone art is `assets/ENV_LG_PHONE_V1.webp` plus `OVL_LG_DANIEL_PHONE_V1.webp` and `OVL_LG_NIK_PHONE_V1.webp`.
7. A job that cannot be done: write `State: BLOCKED` and one question in its status file, then stop the bundle (the later jobs depend on it) and give Nik the stop line below.

## If GitHub refuses a save

If the refusal says **"not a fast forward"** (HTTP 422), another chat saved at the same moment. That is normal with two bundles running: re-read the newest branch head, redo that one save on top of it (keep everything the other chat saved), and try once more. Only a second refusal, or any other refusal, is a real stop:

Stop saving at once. Put every file you changed or still meant to save, at their repo paths, into ONE zip named `ASTRA_C2W004_<job>_<step>.zip`, offer it as a download, and stop with the stop line. Nik drops the zip in Claude's factory thread; Claude commits it and Nik starts a new Astra chat with the same prompt (it carries on from the status files).

## Extra fix after job 171 (Claude's check, 04 Oct)

Job 168 is DONE (Claude saved your zip). Carry on from 169. After 171, do this one extra fix in `legacy.css` / `legacy.js` (Legacy only), commit `C2W-004 extra 1: phone archive fits`, and add one line about it to the end of `status/JOB-171.md` notes. Skip it if 169 to 171 already fixed it.

- **Extra 1 · Legacy phone archive (393x660).** The archive card row runs off the right edge (the next card shows cut in half and the panel's right border is missing), and the pager shows only `‹ ›` with no dots. Target: the panel and its border sit fully inside 12px side margins, one card fills the row width, and one dot per page shows between `‹` and `›` (the active one gold). DEFAULT: in the phone media block, give the card track `scroll-snap-type: x mandatory` with each card `flex: 0 0 100%`, keep the panel at `left/right: 12px`, and make `.legacyPageDot` visible (8px gold circle, inactive at 35% gold).

## Last line to Nik

- All nine done: `Astra bundle C2W-004 done: jobs 165 to 171 saved. Tell Claude "Astra done".`
- Stopped: `Astra bundle C2W-004 stopped at job N step k: <reason>. <zip offered / nothing to send>.`
