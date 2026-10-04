#!/usr/bin/env python3
"""Worker scorecard: who did which factory jobs, how many passed Claude's check first time, fix rounds, scores.

Reads status/*.md plus their git history (Claude check lines are overwritten by check.py, so history is the only
record of FIX rounds). Writes reviews/WORKER_SCORECARD.json. board.py shows a compact version of it.
Run: python3 project-documents/factory/tools/scorecard.py   (needs full git history)"""
import os, re, json, subprocess, statistics as st, collections
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
log = subprocess.run(["git", "log", "--reverse", "--format=C|%aI", "-p", "--", "status"], cwd=F, capture_output=True, text=True).stdout
ev = collections.defaultdict(list); cur = f = None
for l in log.splitlines():
    if l.startswith("C|"): cur = l[2:]; continue
    m = re.match(r"^\+\+\+ b/.*status/JOB-(\d+)\.md", l)
    if m: f = int(m.group(1)); continue
    if f is not None and (l.startswith("+Claude check:") or l.startswith("+Chat:")): ev[f].append(l[1:])
# Jobs not done by a factory worker, or whose Chat line was never filled in
OVERRIDE = {237: "Claude Sonnet 5.5", 238: "Claude Sonnet 5.5", 239: "Claude Sonnet 5.5"}
SKIP = {30, 98, 99, 100, 101, 102}  # old pre-board review, Team G tracking jobs
def worker(n, chat):
    if n in OVERRIDE: return OVERRIDE[n]
    if n in SKIP or not chat: return None
    c = chat.lower()
    for key, name in [("gpt-5.6", "GPT-5.6 Sol (normal chat)"), ("astra", "Astra (Work mode)"), ("sol 6.1", "GPT-6.1 Sol (Work mode)"),
                      ("codex", "Codex"), ("ticket", "Image tickets (ChatGPT)"), ("sonnet", "Claude Sonnet 5.5"), ("claude", "Claude Opus 5.5")]:
        if key in c: return name
    return None
def title(n): return re.match(r"# Status · JOB-\d+ · (.*)", open(os.path.join(F, "status", f"JOB-{n:03d}.md")).read()).group(1)
def kind(t):
    t = t.lower()
    for k, n in [("review", "review"), ("fix", "fix round"), ("motion", "motion"), ("phone", "phone"), ("build", "build"), ("truth", "truth/data")]:
        if k in t: return n
    return "other"
agg = {}; bykind = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0]))
for n, e in sorted(ev.items()):
    chat = None; fixes = 0; first = None; scores = []
    for l in e:
        if l.startswith("Chat:"):
            v = l[5:].strip()
            if v not in ("-", "current", "Nik") and first is None: chat = v
        else:
            m = re.match(r"Claude check: (PASS|FIX)\s*([\d.]+)?", l)
            if not m: continue
            first = first or m.group(1)
            fixes += m.group(1) == "FIX"
            if m.group(2): scores.append(float(m.group(2)))
    w = worker(n, chat)
    if not w or first is None: continue
    a = agg.setdefault(w, dict(jobs=0, first_try=0, fix_rounds=0, first_scores=[], final_scores=[]))
    a["jobs"] += 1; a["first_try"] += fixes == 0; a["fix_rounds"] += fixes
    if scores: a["first_scores"].append(scores[0]); a["final_scores"].append(scores[-1])
    k = kind(title(n)); bykind[w][k][0] += 1; bykind[w][k][1] += fixes == 0
mean = lambda v: round(st.mean(v), 2) if v else None
out = {w: dict(jobs=a["jobs"], first_try=a["first_try"], first_try_pct=round(100 * a["first_try"] / a["jobs"]), fix_rounds=a["fix_rounds"],
               scored=len(a["first_scores"]), avg_first_score=mean(a["first_scores"]), avg_final_score=mean(a["final_scores"]),
               by_kind={k: v for k, v in bykind[w].items()}) for w, a in agg.items()}
json.dump(out, open(os.path.join(F, "reviews", "WORKER_SCORECARD.json"), "w"), indent=1)
for w, o in sorted(out.items(), key=lambda x: -x[1]["jobs"]): print(w, {k: v for k, v in o.items() if k != "by_kind"})
