#!/usr/bin/env python3
"""Rebuild BUG_BOARD.md (Team G bug hunting factory board) from BUGS.json, BOARD.json (earlier bug hunt) and progress/.
Run from the repo root: python3 project-documents/gameplay-factory/tools/bug_board.py
The workflows gameplay-factory-board.yml and gameplay-factory-progress.yml run it on every refresh."""
import json, os, sys, datetime
from zoneinfo import ZoneInfo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from factory_common import F, running_jobs, LANES, lane_of, pitch

REPO = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2"
OPEN = ("NEW", "TRIAGED", "FIXING", "REVIEW", "MERGED")
ORDER = {s: i for i, s in enumerate(["FIXING", "REVIEW", "TRIAGED", "NEW", "MERGED", "LIVE", "DUPLICATE", "NOT A BUG"])}
now = datetime.datetime.now(ZoneInfo("America/New_York"))
bugs = json.load(open(os.path.join(F, "BUGS.json")))["bugs"]
board = json.load(open(os.path.join(F, "BOARD.json")))
old = [dict(id=b["id"], title=b["title"], where="", type="gameplay", priority="normal", worker="", job="", note=b.get("note", ""),
            status={"DONE": "LIVE"}.get(b["status"].upper(), b["status"].upper())) for b in board.get("bug_hunt", [])]
rj = {str(n): (r, k, t) for n, r, k, t in running_jobs()}


def owner(b):
    w = b.get("worker", "")
    return " ".join(LANES[w]) if w in LANES else "unassigned"


def row(b):
    bar = ""
    j = str(b.get("job", ""))
    if j in rj:
        r, k, t = rj[j]
        bar = f"job {j}: {100 * k / max(t, 1):.2f} %"
    return f"| {b['id']} | {'**top** ' if b.get('priority') == 'top' else ''}{b['title']} | {b.get('where', '')} | {b.get('type', '')} | {owner(b)} | {b['status']} | {bar or b.get('note', '')} |"


opn = sorted([b for b in bugs if b["status"] in OPEN], key=lambda b: (b.get("priority") != "top", ORDER.get(b["status"], 9)))
closed = [b for b in bugs if b["status"] not in OPEN] + old
L = ["# Team G bug hunting factory board", "",
     f"{len(opn)} open ({sum(b.get('priority') == 'top' for b in opn)} top) · {len(closed)} closed · generated {now:%Y-%m-%d %-I:%M %p} Boston time ({now:%Z}) · [job board](BOARD.md)", "",
     "## Fix jobs running now", ""]
if rj:
    for lane_key, (sq, name) in LANES.items():
        mine = [(n, v) for n, v in sorted(rj.items(), key=lambda x: int(x[0])) if lane_of(v[0])[1] == name]
        if not mine:
            continue
        L += [f"### {sq} {name}", ""]
        for n, (r, k, t) in mine:
            left = [s["name"] for s in r["steps"] if not s.get("done")]
            L += [f"**Job {n} · {r['title']}**  ", f"{pitch(k / max(t, 1), sq)} **{100 * k / max(t, 1):.2f} %** ({k} of {t} steps)  ",
                  f"Going on now: {r.get('current', '')}  ", "Still to do: " + (" → ".join(left) or "nothing"), ""]
    other = [(n, v) for n, v in rj.items() if lane_of(v[0])[0] == "⬛"]
    for n, (r, k, t) in other:
        L += ["### ⬛ worker not set", "", f"**Job {n} · {r['title']}** {100 * k / max(t, 1):.2f} % ({k} of {t} steps)", ""]
else:
    L += ["No fix job is reporting progress right now.", ""]
L += ["## Open bugs", ""]
hdr = ["| ID | What happened | Where | Type | Lane | Status | Progress / note |", "| --- | --- | --- | --- | --- | --- | --- |"]
L += (hdr + [row(b) for b in opn]) if opn else ["No open bug reports."]
L += ["", "<details>", f"<summary><b>Closed: {len(closed)}</b> (click to open)</summary>", ""] + hdr + [row(b) for b in closed] + ["", "</details>", "",
      "Lane colors: " + " · ".join(f"{sq} {n}" for sq, n in LANES.values()) + ". Percentages are finished steps / all steps from the job's progress block, never estimated.", "",
      "Bug list lives in `BUGS.json` (kept by the Bug reports thread). This page rebuilds itself on GitHub with no Claude turn. Made by `tools/bug_board.py`."]
open(os.path.join(F, "BUG_BOARD.md"), "w").write("\n".join(L) + "\n")
print("open", len(opn), "closed", len(closed))
