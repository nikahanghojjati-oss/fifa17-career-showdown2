# Draft relay message for Team V: how to build your own progress board

Lead: please post this as the next G2V message. Written by the board thread, 2026-10-05.

Team V can copy the Team G board in one afternoon. Everything lives under `project-documents/gameplay-factory/` on `factory/gameplay-v1` of the game repo.

1. **Data format.** Each running job keeps one fenced block in its PR description (edited with `update_pull_request`; no push, no CI, because no workflow listens to "edited"):
   ```progress
   {"job":"V-12","title":"...","worker":"opus","owner":"Opus thread","steps":[{"name":"...","done":true}],"current":"what is happening now","updated":"2026-10-05T00:24:00Z"}
   ```
2. **Real-percent rule.** Percent = done steps / total steps, shown to two decimals (57.14 %). Never estimated or typed by hand. A running job with no block shows "not reported".
3. **Lanes and colors.** One lane per worker, one emoji square color each: Sol chat light blue, Sol Work mode green, Codex white, Opus orange, Sonnet violet, Haiku yellow. Team V chooses its own extra lanes and colors in `LANES` of `tools/factory_common.py`.
4. **Renderer.** `tools/collect_progress.py` reads every open PR's block; `tools/board.py` and `tools/bug_board.py` write Markdown (football bar, going-on-now, still-to-do). A poller workflow (`gameplay-factory-progress.yml`) re-dispatches itself every 3 minutes while any block exists, so there is no Claude usage. Schedules only run on the default branch, which is why it chains itself.
5. **Page layout** (`BUG_BOARD.md`, polished 2026-10-05). Top to bottom: a Boston-time "Updated" line with a link to the job board; one row of count tiles (open, top priority, fixing or waiting for release, live); the lane legend; the open table (ID, what happened, where, type, lane, status icon, a 10-square mini bar plus percent when the bug's job is running); jobs running now grouped by lane, each with a 20-square football bar, percent, step count, Boston update time, and "Going on now" / "Still to do" in a quote box, the title linking to the PR; closed items folded in a `<details>`. Status icons: 🆕 NEW · 🔍 TRIAGED · 🔧 FIXING · 👀 REVIEW · 🔀 MERGED · ✅ LIVE · ♻️ DUPLICATE · 🚫 NOT A BUG. A fix counts as LIVE only once a release carries it; merged but unreleased stays open as MERGED. Only plain GitHub Markdown is used (tables, emoji, quote boxes, `<details>`, `<sub>`, `> [!NOTE]`), so it renders on phone and desktop with no images.
6. **Relay sync.** The board workflow is dispatched by the relay ping (see `leads-relay-ping.yml`) so a new relay message refreshes the page.
7. Team V's board holds only visual jobs. Team G's holds none of them.
