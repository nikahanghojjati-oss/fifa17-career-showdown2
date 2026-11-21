#!/usr/bin/env python3
"""Job preflight (Team G lead, 2026-10-17): run before any job number goes to Nik or to Codex.

Turns the written "job preflight" rule into a check. Jobs 1840 and 1841 blocked because their steps were never checked
against the code (a banned test edit the steps needed, a 2-season Showdown the game doesn't have).

  python3 tools/check_job.py 1844 [--repo /path/to/clone] [--file jobs/JOB-1844.md]

Reads the job file (default: origin/factory/gameplay-v1), finds its base branch, and checks:
  FAIL  a season count the game doesn't allow (only 1, 3, 5 or 10)
  FAIL  a path the job edits that doesn't exist on the base branch
  FAIL  a step that needs an existing-test or registration edit while "Never" bans editing existing tests
  WARN  a named path that doesn't exist (fine if the job creates it)
  WARN  "@codex" in the job file (harmless there, but it must never be copied into a PR body or comment)
  WARN  no "closest safe thing" line (small mismatches then stop the worker)
Exit code 1 on any FAIL.
"""
import argparse, pathlib, re, subprocess, sys

ALLOWED_SEASONS = {1, 3, 5, 10}
FACTORY = "origin/factory/gameplay-v1"
JOBS = "project-documents/gameplay-factory/jobs"
PATH_RE = re.compile(r"`((?:js|css|tests|scripts|\.github|visual-assets|project-documents)/[^`\s]+|[\w.-]+\.(?:rules|json|html|js|cjs|mjs|md|yml))`")
NEW_WORDS = re.compile(r"\b(new|create|creates|write|writes|make|makes|add|adds|save them|copy|copied)\b", re.I)
EDIT_WORDS = re.compile(r"\b(edit|change|modify|fix|update|bump|patch|in `)\b", re.I)
REGISTRATION = re.compile(r"\b(register|registration|runner list|add (?:it|one line) to)\b", re.I)


def git(repo, *args):
    return subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("job", type=int)
    ap.add_argument("--repo", default="/home/claude/repo")
    ap.add_argument("--file", help="a local job file instead of the one on factory/gameplay-v1")
    a = ap.parse_args()
    git(a.repo, "fetch", "-q", "origin", "factory/gameplay-v1")
    text = pathlib.Path(a.file).read_text() if a.file else git(a.repo, "show", f"{FACTORY}:{JOBS}/JOB-{a.job}.md").stdout
    if not text:
        print(f"FAIL JOB-{a.job}.md not found on factory/gameplay-v1"); return 1
    fails, warns = [], []

    # Base branch: an explicit "Base: `x`" line, else the PR-into cell, else the first branch named after "from".
    m = (re.search(r"^Base: `([^`]+)`", text, re.M) or re.search(r"\| `([\w./-]+)` \(draft\) \|", text)
         or re.search(r"from `((?:gameplay|codex|main|factory)[^`]*)`", text) or re.search(r"origin (gameplay/[\w./-]+)", text))
    base = m.group(1) if m else "main"
    git(a.repo, "fetch", "-q", "origin", base)
    tree = set(git(a.repo, "ls-tree", "-r", "--name-only", f"origin/{base}").stdout.split())

    for n in re.findall(r"CE2PG_SEASONS=(\d+)", text) + re.findall(r"\b(\d+)-season\b", text):
        if int(n) not in ALLOWED_SEASONS:
            fails.append(f"{n} seasons: the game allows only 1, 3, 5 or 10")
    if "@codex" in text:
        warns.append('"@codex" appears in the job file; never copy that text into a PR body or comment (a mention there starts a task)')

    never = text.split("## Never", 1)[1] if "## Never" in text else ""
    steps = text.split("## Never", 1)[0]
    for line in steps.splitlines():
        for p in PATH_RE.findall(line):
            if p in tree or any(t.startswith(p.rstrip("/") + "/") for t in tree):
                continue
            if "/" not in p and any(t.endswith("/" + p) or t == p for t in tree):
                continue
            if EDIT_WORDS.search(line) and not NEW_WORDS.search(line):
                fails.append(f"edits `{p}`, which is not on origin/{base}")
            else:
                warns.append(f"`{p}` is not on origin/{base} (fine if the job creates it)")
    if re.search(r"never edit an existing test", never, re.I) and REGISTRATION.search(steps) and "Nik's OK" not in text:
        fails.append("a step registers a test, which edits an existing runner or test file, but Never bans editing existing tests; allow that exact edit or move the job to Claude")
    if re.search(r"no product code", never, re.I) and re.search(r"\b(change|edit|fix) [^.\n]*`(js|css)/", steps, re.I):
        fails.append("a step changes js/ or css/ but Never bans product code")
    if not re.search(r"closest safe", text, re.I):
        warns.append('no "closest safe thing" line: small mismatches will stop the worker')

    print(f"JOB-{a.job} preflight on origin/{base}")
    for f in fails: print("  FAIL", f)
    for w in sorted(set(warns)): print("  WARN", w)
    print("  PASS" if not fails else f"  {len(fails)} failure(s): fix the job file before giving out the number")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
