#!/usr/bin/env python3
"""Claude's intake quality check. Writes the verdict into a job's status file; the board reads it.

  python3 project-documents/factory/tools/check.py 62 PASS 4.3 "one-line evidence"
  python3 project-documents/factory/tools/check.py 67 FIX 3.9 "fix item 1" "fix item 2"
  python3 project-documents/factory/tools/check.py 12 PASS - "accepted (text job)"

PASS needs a QUALITY_BAR average >= 4.2, nothing under 3 and the hard gates passing (score "-" for jobs
that make no screen). FIX sets the job back to "IN PROGRESS · FIX" with a numbered fix list; the board then
lists it under Type next as "N (fix)" and the next chat does only that list (WORKER_HANDBOOK §5b)."""
import re, sys, datetime, os

F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
n, verdict, score, notes = int(sys.argv[1]), sys.argv[2].upper(), sys.argv[3], sys.argv[4:]
assert verdict in ("PASS", "FIX")
p = os.path.join(F, "status", f"JOB-{n:03d}.md")
t = open(p).read()
now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
line = f"Claude check: {verdict}" + (f" {score}" if score != "-" else "") + f" · {now}"
t = re.sub(r"^Claude check:.*\n", "", t, flags=re.M)
t = re.sub(r"\n## Claude fix list\n(?:.*\n)*?(?=\n## |\Z)", "\n", t)
t = re.sub(r"^(Chat:.*)$", r"\1\n" + line, t, count=1, flags=re.M)
if verdict == "FIX":
    t = re.sub(r"^State:.*$", "State: IN PROGRESS · FIX", t, count=1, flags=re.M)
    fix = "\n## Claude fix list\n\nDo ONLY these items (handbook §5b), save after each, then set State: DONE again.\n\n" + "".join(f"{i}. {x}\n" for i, x in enumerate(notes, 1))
    t = t.replace("\n## Self-check", fix + "\n## Self-check", 1) if "\n## Self-check" in t else t + fix
elif notes:
    t = t.replace("\n## Self-check", f"\n- Claude check ({now}): {' '.join(notes)}\n\n## Self-check", 1)
open(p, "w").write(t)
print(f"JOB-{n:03d}: {line}")
