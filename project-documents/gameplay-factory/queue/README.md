# Mega factory queue

20 standing GPT-6 Sol chat slots (account A: A1-A10, account B: B1-B10) that push stages 2 to 5 forward.
- `PASTE_HERE.md`: the one line Nik pastes per slot.
- `slots/<slot>.md`: the slot's ordered job list and its rules; the chat picks the first job whose branch does not exist yet, so "next" always works and a worker that hits a limit loses nothing.
- `QUEUE.json`: slots, tickets (jobs/JOB-1061..1142) and base branches. `make_queue.py` regenerates the tickets and slot files.
- `QUEUE_STATE.json` / `QUEUE.md`: live state, derived from GitHub branches and PRs by `queue_state.py` (needs GH_TOKEN; free in Actions). Never hand-written.
- Code tickets (stages 2 and 3) PR into `gameplay/bug-list-1`; study tickets (stages 4 and 5, new HTML files only) PR into `study/mega-queue` and need Team V's decision.
- Reviewer slots B9/B10 post a `Sol review` comment on open JOB- PRs so the Team G lead reads a verdict before merging.
