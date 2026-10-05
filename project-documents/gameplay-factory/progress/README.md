# Job progress

Each job owner keeps one fenced block in its PR description (edit the PR body with the GitHub MCP `update_pull_request` tool; no push, no CI):

````
```progress
{"job":"28","title":"Rivalry Stats and Legacy","worker":"sonnet","owner":"Sonnet thread","steps":[{"name":"Build","done":true},{"name":"CI green","done":false}],"current":"what is happening now","updated":"2026-10-05T00:24:00Z"}
```
````

`worker` is one of `sol-chat`, `sol-work`, `codex`, `opus`, `sonnet`, `haiku` (sets the lane colour). The board shows percent = done steps / total steps, to two decimals.
`tools/collect_progress.py` reads the block from every open PR; no block = "not reported". The workflows `gameplay-factory-progress.yml` and `gameplay-factory-board.yml` refresh the board.
