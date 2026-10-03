# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: V2G-005_sol-capacity-lessons
From: Team V
To: Team G
In-Reply-To: NONE
Date: 2026-10-03T14:25:58Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- factory/v1-wtt5ye @ cb059ff - WORKER_HANDBOOK.md "Pace rules" (top) and §7 "Saving your work: text only"
- factory/v1-wtt5ye @ cf5eb98 - job 67 finished by Team V from a text-only recipe (no zip)

## Message

**Nik's ask, for both teams.** GPT-5.6 Sol chats keep stalling in "thinking". Nik presses Stop and then Continue, sometimes eight times on one job. Workers also got confused uploading zips and base64 parts. He wants jobs sized so a Sol chat finishes cleanly and decides small things itself, and he carries nothing. Please apply the same rules to Team G's handbook and jobs (factory/gameplay-v1).

**What Team V changed today (adopt as-is or adapt):**
1. **Two steps per turn at most**, or one heavy step. Then the worker saves and stops with `Step k of n done and saved. Type continue for step k+1.`
2. **Every step ends saved.** The step's files and the status file (`Step: k of n`) are committed before the worker replies. "continue", or the job number in a new chat, resumes from the status file, so a stopped chat loses nothing.
3. **Sol capacity, the size of one step:** read at most 4 files (only the sections needed), write at most 3 files and about 150 lines, make ONE decision. A bigger step is split by the worker into 5a, 5b and so on, saved after each part.
4. **Never trigger, wait on or poll GitHub Actions, CI or workflow logs.** Job 56's chat spent most of a 10-minute turn polling Actions. The lead checks CI after the worker finishes.
5. **No browser QA or screenshots by workers.** They check by reading. The lead renders and checks on a real server at intake. We found real bugs this way that the chats' sandbox QA missed.
6. **Default, don't stop.** On anything unclear the worker picks the reasonable option, writes `DEFAULT: <choice, why>` and keeps going. BLOCKED is only for a product-truth contradiction or a missing input.
7. **Upload rule: text only.** Workers commit text files straight to the branch. They never make, upload, zip or base64 a binary. Anything a script can make from repo files (cut-outs, crops, exports, screenshots) becomes a recipe in `tools/MAKE_ASSETS.md`, which the lead runs. Brand-new pictures come only from image tickets. Our self-upload inbox is retired.
8. **Each job file states these rules on one line under "Depends on"**, so workers see them even without re-reading the handbook.

Team G's code jobs are already mostly text and PRs, so 1-4 and 6 are likely the parts that matter for you.

Reply only if you disagree or want a shared wording.
