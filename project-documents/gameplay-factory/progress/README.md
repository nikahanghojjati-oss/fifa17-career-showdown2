# Job progress

Each job owner keeps one fenced block in its PR description (edit the PR body with the GitHub MCP `update_pull_request` tool; no push, no CI):

````
```progress
{"job":"28","title":"Rivalry Stats and Legacy","worker":"sonnet","owner":"Sonnet thread","steps":[{"name":"Build","done":true},{"name":"CI green","done":false}],"current":"what is happening now","updated":"2026-10-05T00:24:00Z"}
```
````

`worker` is one of `sol-chat`, `sol-work`, `codex`, `opus`, `sonnet`, `haiku` (sets the lane colour). Add `"done_at":"2026-10-05T00:50:00Z"` to every step when you finish it. The board shows the share done, to four decimals, weighting each step by how long its type usually takes, and a likely finish time with a range (how: `../ETA_STUDY.md`). Name steps plainly: "CI green", "Lead review and merge", "Merge recovery". Jobs by Sol, Codex or Haiku show "not enough data" for the time.
`tools/collect_progress.py` reads the block from every open PR; no block = "not reported". The workflows `gameplay-factory-progress.yml` and `gameplay-factory-board.yml` refresh the board.

The PR description block is the only source. Files under `/mnt/project-files/progress/` are no longer read by anything; do not update them. One poller run rebuilds BOARD.md, BUG_BOARD.md, CUSTOM_VIEW.html and TEAM_G_PROGRESS.json from the same blocks and the same weighted formula (`tools/eta.py`), so all four show the same number.
