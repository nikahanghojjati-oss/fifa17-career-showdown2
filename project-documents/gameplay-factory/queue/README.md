# Mega factory queue

20 standing GPT-6 Sol chat slots (account A: A1-A10, account B: B1-B10) that push stages 2 to 5 forward.
- `PASTE_HERE.md`: the one line Nik pastes per slot.
- `slots/<slot>.md`: the slot's ordered job list and its rules; the chat picks the first job whose branch does not exist yet, so "next" always works and a worker that hits a limit loses nothing.
- `QUEUE.json`: slots, tickets (jobs/JOB-1061..1142) and base branches. `make_queue.py` regenerates the tickets and slot files.
- `QUEUE_STATE.json` / `QUEUE.md`: live state, derived from GitHub branches and PRs by `queue_state.py` (needs GH_TOKEN; free in Actions). Never hand-written.
- Code tickets (stages 2 and 3) PR into `gameplay/bug-list-1`; study tickets (stages 4 and 5, new HTML files only) PR into `study/mega-queue` and need Team V's decision.
- Reviewer slots B9/B10 post a `Sol review` comment on open JOB- PRs so the Team G lead reads a verdict before merging.

## Job families (518 tickets, jobs 1061-1578)
- Per screen (14 screens, 29 jobs each, in one slot): 10 single-size layout fixes, match-the-mockup, 9 aspect fixes (long names, tap targets, focus/motion, contrast, alt text, loading/empty/error states, hover) = code PRs into `gameplay/bug-list-1`; then 9 studies (3 phone, sideways, tablet, 3 desktop, states sheet) = new HTML only into `study/mega-queue`.
- B5-B9: 12 shared CSS checks plus 100 reading audits of gameplay modules (first and second half of 50 modules), findings only into `qa/mega-audits`; the lead turns real findings into fix jobs.
- Refill: add families in make_queue.py, claim new numbers on leads/relay, regenerate with the new --first for the new tickets only (do not renumber published ones).

## Review-pace rules (Team G lead, 2026-10-10)
- Code items (into `gameplay/bug-list-1`) have a **lock group** (screen, or shared files: season-final, rivalry-legacy, rules-settings): one open code PR per group, strict job order inside a group, at most 8 open code PRs overall. The item file carries these guards, so a chat refuses politely; `QUEUE_STATE.json` `sequence.ready` lists the numbers that pass them.
- Audits (findings files into `qa/mega-audits`) and studies (new HTML into `study/mega-queue`) are never locked. The sequence alternates one code item with one free item so there is always a number to type.
- PR titles carry the group, e.g. `JOB-1061 [home] Home: fix the 360x640 view`. Every code ticket names its Done check.

## Trains (Team G lead, 2026-10-10)
Code items commit onto `gameplay/train-<group>-<k>` (5 per train); status files `status/JOB-N.md` on the train mark items finished; the 5th item opens one draft train PR titled `JOB-a JOB-b ... [group] train k`. `queue_state.py` reads trains via the compare API and PRs by head branch. Study/audit items keep one branch and one draft PR each.
