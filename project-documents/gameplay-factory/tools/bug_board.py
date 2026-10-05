#!/usr/bin/env python3
"""Rebuild BUG_BOARD.md (Team G bug hunting factory board) from BUGS.json, BOARD.json (earlier bug hunt) and progress/.
Run from the repo root: python3 project-documents/gameplay-factory/tools/bug_board.py
The workflows gameplay-factory-board.yml and gameplay-factory-progress.yml run it on every refresh."""
import json, os, sys, datetime
from zoneinfo import ZoneInfo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eta as ETA
from factory_common import F, running_jobs, LANES, lane_of, pitch, all_bugs, OPEN_BUG

REPO = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2"
BOS = ZoneInfo("America/New_York")
OPEN = OPEN_BUG
ORDER = {s: i for i, s in enumerate(["FIXING", "REVIEW", "TRIAGED", "NEW", "MERGED", "LIVE", "DUPLICATE", "NOT A BUG"])}
ICON = {"NEW": "🆕", "TRIAGED": "🔍", "FIXING": "🔧", "REVIEW": "👀", "MERGED": "🔀", "LIVE": "✅", "DUPLICATE": "♻️", "NOT A BUG": "🚫"}
TYPE = {"gameplay": "🎮 gameplay", "visual": "🎨 visual", "data": "📊 data"}
now = datetime.datetime.now(BOS)
bugs = all_bugs()
rj = {str(n): (r, k, t) for n, r, k, t in running_jobs()}


def boston(iso):
    try:
        t = datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(BOS)
        return f"{t:%a %-d %b, %-I:%M %p}"
    except Exception:
        return "unknown"


def job_link(n, r, text):
    return f"[{text}]({REPO}/pull/{r['pr']})" if r.get("pr") else text


def mini(frac, sq, width=10):
    k = min(width, int(frac * width))
    return sq * k + "▫️" * (width - k)


def row(b):
    w = b.get("worker", "")
    lane = " ".join(LANES[w]) if w in LANES else "—"
    j = str(b.get("job", ""))
    if j in rj:
        r, k, t = rj[j]
        prog = f"{mini(k / max(t, 1), lane_of(r)[0])} **{100 * k / max(t, 1):.2f} %** · {job_link(j, r, 'job ' + j)}"
    elif j:
        prog = f"job {j}: not reported" + (f" · {b['note']}" if b.get("note") else "")
    else:
        prog = b.get("note", "") or "—"
    title = ("🔴 **top** · " if b.get("priority") == "top" else "") + b["title"]
    st = b["status"]
    return f"| **{b['id']}** | {title} | {b.get('where') or '—'} | {TYPE.get(b.get('type', ''), b.get('type') or '—')} | {lane} | {ICON.get(st, '')} {st} | {prog} |"


opn = sorted([b for b in bugs if b["status"] in OPEN], key=lambda b: (b.get("priority") != "top", ORDER.get(b["status"], 9)))
closed = sorted([b for b in bugs if b["status"] not in OPEN], key=lambda b: (ORDER.get(b["status"], 9), b["id"]))
fixing = sum(b["status"] in ("FIXING", "REVIEW", "MERGED") for b in opn)
live = sum(b["status"] == "LIVE" for b in closed)
hdr = ["| Bug | What happened | Where | Type | Lane | Status | Progress / note |", "| :-- | :-- | :-- | :-- | :-- | :-- | :-- |"]

L = ["# 🐞 Team G bug hunting factory", "",
     f"> Updated **{now:%a %-d %b, %-I:%M %p} Boston time** · rebuilds itself on GitHub every 3 minutes while jobs run, no Claude usage · [Job board →](BOARD.md)", "",
     "| 🔓 Open | 🔴 Top priority | 🔧 Fixing or waiting for release | ✅ Fixed and live |", "| :---: | :---: | :---: | :---: |",
     f"| **{len(opn)}** | **{sum(b.get('priority') == 'top' for b in opn)}** | **{fixing}** | **{live}** |", "",
     "**Lanes:** " + " · ".join(f"{sq} {n}" for sq, n in LANES.values()), "",
     "## 🔧 Open bugs", ""]
L += (hdr + [row(b) for b in opn]) if opn else ["> [!TIP]", "> No open bug reports. Report one to the coordinator in the project chat.", ""]
L += ["", "## ⚽ Jobs running now", "",
      "<sub>Percent = finished steps weighted by typical step time; finish times are estimates ([how](ETA_STUDY.md)).</sub>", ""]
if rj:
    L += [ETA.whistle([ETA.describe(r) for r, k, t in rj.values()]), ""]
    groups = [(sq, name, [x for x in rj.items() if lane_of(x[1][0]) == (sq, name)]) for sq, name in list(LANES.values()) + [("⬛", "worker not set")]]
    for sq, name, mine in groups:
        if not mine:
            continue
        L += [f"### {sq} {name} · {len(mine)} job{'s' if len(mine) != 1 else ''}", ""]
        for n, (r, k, t) in sorted(mine, key=lambda x: int(x[0])):
            left = [s["name"] for s in r["steps"] if not s.get("done")]
            d = ETA.describe(r)
            L += [f"**{job_link(n, r, f'Job {n} · ' + r['title'])} · {d['pct']:.4f} %** · {k} of {t} steps · updated {boston(r.get('updated'))}  ",
                  f"{pitch(d['pct'] / 100, sq)}  ", f"🏁 **Likely finish:** {d['eta']}  ",
                  f"> **Now:** {r.get('current') or 'not reported'}  ", "> **Left:** " + (" → ".join(left) or "nothing, all steps done"), ""]
else:
    L += ["> [!NOTE]", "> No job is reporting progress right now. A job shows here once its PR description carries a progress block.", ""]
L += ["<details>", f"<summary><b>✅ Closed: {len(closed)}</b> ({live} live in the game) · click to open</summary>", ""] + hdr + [row(b) for b in closed] + ["", "</details>", "",
      "---", "",
      "<sub>Bug list: `BUGS.json` (kept by the Bug reports thread). Progress: the ```` ```progress ```` block in each job's PR description. "
      "Statuses: " + " · ".join(f"{i} {s}" for s, i in ICON.items()) + ". Made by `tools/bug_board.py`.</sub>"]
open(os.path.join(F, "BUG_BOARD.md"), "w").write("\n".join(L) + "\n")
print("open", len(opn), "closed", len(closed))
