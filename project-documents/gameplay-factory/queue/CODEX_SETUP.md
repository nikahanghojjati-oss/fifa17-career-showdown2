# Codex: one-time setup (Nik), then type just a number

Codex on the web works from `main` and cannot pick a branch, so the environment's **setup script** (Codex settings > Environment > Setup script, paste once) copies the factory files next to the repo and tells Codex what a bare number means. Only the Team G lead touches `main`; nothing here changes the repo.

## Simplest option: Custom instructions (no script)
Paste this once into Codex Settings > Custom instructions (or the environment's instructions field):

```text
This repo is Career Mode Showdown. If my task is only a number N: run git fetch origin factory/gameplay-v1. If N is 1000 or less, read git show FETCH_HEAD:project-documents/gameplay-factory/queue/items/NNNN.md (N padded to 4 digits). If N is 1001 or more, read git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-N.md (else project-documents/factory/jobs/JOB-N.md on factory/v1-wtt5ye). Do exactly what it says. Start from gameplay/bug-list-1 (git fetch origin gameplay/bug-list-1 && git checkout -B work FETCH_HEAD) unless the ticket says otherwise. Open PRs as drafts; if you cannot pick the base, put RETARGET TO gameplay/bug-list-1 on the PR body's first line. Never push to main, never merge.
```

The setup script below is the alternative if you prefer files copied locally; use one or the other.

```bash
set -e
mkdir -p /tmp/factory
git fetch --depth 1 origin factory/gameplay-v1
git archive FETCH_HEAD project-documents/gameplay-factory | tar -x -C /tmp/factory
git fetch --depth 1 origin factory/v1-wtt5ye && git archive FETCH_HEAD project-documents/factory/jobs | tar -x -C /tmp/factory || true
cat >> AGENTS.md <<'EOF'

## Factory numbers (local note, never commit this file)
If the task is only a number N: find its job file and do exactly what it says.
- N from 1 to 1000: /tmp/factory/project-documents/gameplay-factory/queue/items/NNNN.md (N padded to four digits).
- N of 1001 or more: /tmp/factory/project-documents/gameplay-factory/jobs/JOB-N.md, else /tmp/factory/project-documents/factory/jobs/JOB-N.md.
If the file is missing (the copy is up to half a day old), run `git fetch origin factory/gameplay-v1` and read it with `git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-N.md`.
The file names its branch, files and tests; follow it. Work on a branch named codex/job-N-<slug>, open the pull request as a draft, and never push to main. You cannot choose the base branch; the Team G lead retargets it to gameplay/bug-list-1. Never commit AGENTS.md.
EOF
git update-index --skip-worktree AGENTS.md
```

After that, a new Codex task is just the number, for example `1580`.

If a task ever says it cannot find the file, paste this longer line once: `Do git fetch origin factory/gameplay-v1, read git show FETCH_HEAD:project-documents/gameplay-factory/jobs/JOB-N.md, and do exactly what it says.`
