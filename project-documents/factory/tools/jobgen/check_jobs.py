#!/usr/bin/env python3
"""Lint the generated job files (Claude, 2026-10-04, after job 141 stopped on a missing TRUTH.md).

  python3 project-documents/factory/tools/jobgen/check_jobs.py      (gen_jobs.py runs it at the end)

For every job whose status is not DONE/SKIPPED it reports:
  MISSING  a file the job tells the worker to read that is not on the branch and that no job writes
  HOLE     an unfilled placeholder such as {job:...}, {n}, {N}, {navbar}, {folder}
Exit code 1 when anything is found. Run from the repo root.
"""
import glob, os, re, sys

F = "project-documents/factory"
PATH = re.compile(r"`((?:visual-assets|project-documents|assets|src|css|js)/[^`\s]+?\.(?:md|json|js|css|html|py|webp|png|jpg|cjs))`")
HOLE = re.compile(r"\{(?:job:\w+|n|N|navbar|folder|key|code|nm|mock|title)\}")

def section(text, name):
    m = re.search(rf"^## {name}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return m.group(1) if m else ""

jobs = {}
for p in sorted(glob.glob(f"{F}/jobs/JOB-*.md")):
    n = int(p[-6:-3]); t = open(p).read()
    st = open(f"{F}/status/JOB-{n:03d}.md").read() if os.path.exists(f"{F}/status/JOB-{n:03d}.md") else ""
    state = (re.search(r"^State:\s*(.*)$", st, re.M) or [None, ""])[1]
    jobs[n] = (t, state)

written = set()
for t, _ in jobs.values():
    written |= set(PATH.findall(section(t, "Deliverables")))
    for step in re.findall(r"Write:([^.]*(?:\.[a-z]+[^.]*)*)", section(t, "Steps")):
        written |= set(PATH.findall(step))

bad = 0
for n, (t, state) in jobs.items():
    if state.startswith(("DONE", "SKIPPED")):
        continue
    reads = set(PATH.findall(section(t, "Read first")))
    for m in re.finditer(r"Read:(.*?)(?:Write:|Done when|$)", section(t, "Steps"), re.S):
        reads |= set(PATH.findall(m.group(1)))
    optional = set(re.findall(r"`([^`]+)` \((?:if it exists|if present|only if)", t))
    for r in sorted(reads - optional):
        if not os.path.exists(r) and r not in written:
            print(f"MISSING JOB-{n:03d}: {r}"); bad += 1
    for h in sorted(set(HOLE.findall(t))):
        print(f"HOLE    JOB-{n:03d}: {h}"); bad += 1
print(f"check_jobs: {bad} problem(s) in jobs not yet done")
sys.exit(1 if bad else 0)
