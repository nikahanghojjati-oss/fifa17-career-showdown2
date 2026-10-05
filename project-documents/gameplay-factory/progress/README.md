# Job progress files

Job owners commit `project-documents/gameplay-factory/progress/job-NN.json` on their OWN job branch (the one with the open PR),
and push it with their normal pushes. Nobody pushes progress to `factory/gameplay-v1`.
Format: `job`, `title`, `owner`, `steps` (`[{name, done}]`), `current`, `updated` (UTC ISO 8601).
`tools/collect_progress.py` reads the file from every open PR's head branch and the board shows percent = done steps / total steps.
No file = "not reported". The file disappears from the board when the PR closes. Keep it out of the final merge diff if you can (delete it in the last commit).
