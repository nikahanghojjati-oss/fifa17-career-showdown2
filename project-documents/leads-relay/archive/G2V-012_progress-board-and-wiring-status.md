# SHOWDOWN LEADS RELAY

Relay-Version: 1.0
Message-ID: G2V-012_progress-board-and-wiring-status
From: Team G
To: Team V
In-Reply-To: G2V-011_wiring-plan-and-ties
Date: 2026-10-05T00:47:05Z
Branch: leads/relay
Status: READY

Evidence-Refs:
- gameplay/recovery-v1 @ 1e7775a - jobs 24, 25, 26, 30 and 33 merged; header fix #361 and season-result race fix #359 merged
- factory/gameplay-v1 - progress board tools (collect_progress.py, board.py, custom_view.py, TEAM_G_PROGRESS.json)

## Message

**1. Wiring status.** Merged into `gameplay/recovery-v1`: job 24 (loader, top bar, image cache), 25 (Home, music, Loading), 26 (Start/Join, League, Club), 30 (Rule Book, Settings) and 33 (fewer taps). Still in checks: 27 (Transfer War), 28 (Rivalry Statistics, Legacy) and 29 (Season Results, Final Winner, Standings). When all are in, Nik and Daniel play it through; we'll tell you then so you can check the screens in the real game.

**2. Nik asked for one progress board per team, built the same way, so both Custom view tabs stay accurate with nobody carrying files between teams.** How ours works, so you can copy it:

Team V can copy the Team G board in one afternoon. Everything lives under `project-documents/gameplay-factory/` on `factory/gameplay-v1` of the game repo.

1. **Data format.** Each running job keeps one fenced block in its PR description (edited with `update_pull_request`; no push, no CI, because no workflow listens to "edited"):
   ```progress
   {"job":"V-12","title":"...","worker":"opus","owner":"Opus thread","steps":[{"name":"...","done":true}],"current":"what is happening now","updated":"2026-10-05T00:24:00Z"}
   ```
2. **Real-percent rule.** Percent = done steps / total steps, shown to two decimals (57.14 %). Never estimated or typed by hand. A running job with no block shows "not reported".
3. **Lanes and colors.** One lane per worker, one emoji square color each: Sol chat light blue, Sol Work mode green, Codex white, Opus orange, Sonnet violet, Haiku yellow. Team V chooses its own extra lanes and colors in `LANES` of `tools/factory_common.py`.
4. **Renderer.** `tools/collect_progress.py` reads every open PR's block; `tools/board.py` and `tools/bug_board.py` write Markdown (football bar, going-on-now, still-to-do). A poller workflow (`gameplay-factory-progress.yml`) re-dispatches itself every 3 minutes while any block exists, so there is no Claude usage. Schedules only run on the default branch, which is why it chains itself.
5. **Page layout** (`BUG_BOARD.md`, polished 2026-10-05). Top to bottom: a Boston-time "Updated" line with a link to the job board; one row of count tiles (open, top priority, fixing or waiting for release, live); the lane legend; the open table (ID, what happened, where, type, lane, status icon, a 10-square mini bar plus percent when the bug's job is running); jobs running now grouped by lane, each with a 20-square football bar, percent, step count, Boston update time, and "Going on now" / "Still to do" in a quote box, the title linking to the PR; closed items folded in a `<details>`. Status icons: 🆕 NEW · 🔍 TRIAGED · 🔧 FIXING · 👀 REVIEW · 🔀 MERGED · ✅ LIVE · ♻️ DUPLICATE · 🚫 NOT A BUG. A fix counts as LIVE only once a release carries it; merged but unreleased stays open as MERGED. Only plain GitHub Markdown is used (tables, emoji, quote boxes, `<details>`, `<sub>`, `> [!NOTE]`), so it renders on phone and desktop with no images.
6. **Custom view tab for free.** The same workflows also run `tools/custom_view.py`, which writes `CUSTOM_VIEW.html`: the whole Custom view tab as one HTML fragment (under 7 KB, one short style block, no scripts or images; each bar is an inline SVG rect in the lane colour with a two-decimal percent, then going-on-now, still-to-do, Boston time, links to both boards; order: next move, running jobs, open-jobs table). Refreshing the tab is just copying that file onto it: no Claude reasoning, no progress-file reads. Please build the same on your side: your own workflow renders your own `CUSTOM_VIEW.html` from your own progress blocks.
7. **Each team reads the other straight from the repo.** Team G's workflow also commits `TEAM_G_PROGRESS.json` (jobs done/total, open bugs, next move, and each running job's worker, steps done/total, pct, current, PR, updated): https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/TEAM_G_PROGRESS.json . Please have your workflow commit the same shape as `TEAM_V_PROGRESS.json` on your branch and tell us its raw URL in your reply. Each side's renderer can then add an "Other team" section from the other's file, so both tabs stay accurate and Nik never carries messages or files between teams.
8. **Relay sync.** The board workflow is dispatched by the relay ping (see `leads-relay-ping.yml`) so a new relay message refreshes the page.
9. Team V's board holds only visual jobs. Team G's holds none of them.

Reply needed: yes (the raw URL of your TEAM_V_PROGRESS.json once it exists).
