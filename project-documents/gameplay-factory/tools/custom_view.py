#!/usr/bin/env python3
"""Write CUSTOM_VIEW.html: the whole Custom view tab as one HTML fragment (no scripts, no images, under 7 KB).
Reads BOARD_STATE.json (run board.py first), progress/ (run collect_progress.py first) and BUGS.json.
The coordinator only copies this file onto the tab, so a refresh costs no Claude reasoning.
Also writes TEAM_G_PROGRESS.json, the snapshot Team V reads from the repo for its own tab.
Run from the repo root: python3 project-documents/gameplay-factory/tools/custom_view.py"""
import json, os, re, sys, datetime, html
from zoneinfo import ZoneInfo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eta as ETA
from factory_common import F, running_jobs, lane_of, all_bugs, OPEN_BUG, pitch

BOS = ZoneInfo("America/New_York")
BLOB = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/"
PR = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/"
# Lane colours Nik picked (2026-10-05): Sol chat light blue, Sol Work green, Codex white, Opus orange, Sonnet violet, Haiku yellow.
HEX = {"Sol chat": "#7dd3fc", "Sol Work mode": "#22c55e", "Codex": "#ffffff", "Opus": "#f97316", "Sonnet": "#8b5cf6", "Haiku": "#facc15"}
e = html.escape


def md(t):  # the tiny bit of Markdown the board uses: **bold** and `code`
    t = e(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    return re.sub(r"`(.+?)`", r"<code>\1</code>", t)


def boston(iso):
    try:
        return f"{datetime.datetime.fromisoformat(str(iso).replace('Z', '+00:00')).astimezone(BOS):%-I:%M %p}"
    except Exception:
        return "unknown"


def bar(frac, colour):
    w = round(300 * min(max(frac, 0), 1), 1)
    return (f'<svg width="300" height="14" viewBox="0 0 300 14"><rect width="300" height="14" rx="7" fill="rgba(128,128,128,.35)"/>'
            f'<rect width="{w}" height="14" rx="7" fill="{colour}" stroke="#9ca3af" stroke-width="1"/></svg>')


st = json.load(open(os.path.join(F, "BOARD_STATE.json")))
open_bugs = [b for b in all_bugs() if b["status"] in OPEN_BUG]
now = datetime.datetime.now(BOS)
rj0 = running_jobs()

H = ["<style>.cv{font:14px/1.45 system-ui,sans-serif;max-width:720px}.cv h2{font-size:16px;margin:18px 0 6px}"
     ".cv .card{border:1px solid rgba(128,128,128,.45);border-radius:10px;padding:10px 12px;margin:8px 0}.cv .move{background:rgba(249,115,22,.14);border-color:#f97316}"
     ".cv .m{color:rgba(128,128,128,1);font-size:12px}.cv .pc{font-weight:700;margin-left:8px}.cv table{border-collapse:collapse;width:100%}"
     ".cv td,.cv th{border-bottom:1px solid rgba(128,128,128,.35);padding:4px 6px;text-align:left;font-size:13px}.cv a{color:inherit;text-decoration:underline}</style>",
     '<div class="cv">',
     f'<div class="m">Updated {now:%a %-d %b, %-I:%M %p} Boston time · {st["done"]} of {st["total"]} jobs done · {len(open_bugs)} open bug{"s" if len(open_bugs) != 1 else ""} · '
     f'<a href="{BLOB}BOARD.md">Job board</a> · <a href="{BLOB}BUG_BOARD.md">Bug board</a></div>',
     f'<div class="card" style="text-align:center;font-size:16px"><b>⚽ Team G {st["done"]} of {st["total"]} jobs done · {len(rj0)} in play · 🐞 {len(open_bugs)} open</b><br><span class="m">{ETA.whistle([ETA.describe(r) for _, r, _, _ in rj0])}</span></div>',
     "<h2>Your next move</h2>", '<div class="card move">' + "<br>".join(md(m) for m in st.get("next_move") or ["Nothing for you to start right now."]) + "</div>",
     "<h2>Running now</h2>"]
rj = sorted(running_jobs())
if not rj:
    H.append('<div class="card m">No job is reporting progress right now.</div>')
COMPACT = "--compact" in sys.argv  # only if the page would pass 7 KB: show the next three steps instead of all
for n, r, k, t in rj:
    sq, who = lane_of(r)
    d = ETA.describe(r)
    left = [x["name"] for x in r["steps"] if not x.get("done")]
    if COMPACT and len(left) > 3:
        left = left[:3] + [f"and {len(left) - 3} more"]
    title = f'Job {n} · {e(r.get("title", ""))}'
    title = f'<a href="{PR}{r["pr"]}">{title}</a>' if r.get("pr") else title
    H.append(f'<div class="card"><b>{title}</b> <span class="m">{e(who)} · {k} of {t} steps · {boston(r.get("updated"))}</span><br>'
             f'{bar(d["pct"] / 100, HEX.get(who, "#6b7280"))}<span class="pc">{d["pct"]:.4f} %</span><br>{pitch(d["pct"] / 100, {"Sol chat": "🟦", "Sol Work mode": "🟩", "Codex": "⬜", "Opus": "🟧", "Sonnet": "🟪", "Haiku": "🟨"}.get(who, "⬛"), 16)}<br>'
             f'<b>Likely finish:</b> {e(d["eta"])}<br>'
             f'<b>Going on now:</b> {e(r.get("current") or "not reported")}<br>'
             f'<b>Still to do:</b> {e(" → ".join(left) or "nothing")}</div>')
REL = json.load(open(os.path.join(F, "BOARD.json"))).get("release") or {}
liveprs = {}
try:
    liveprs = {int(k): v for k, v in json.load(open(os.path.join(F, "progress", "prs.json"))).items()}
except Exception:
    pass
if REL.get("jobs"):
    rn = len(REL["jobs"])
    rd = sum(1 for j in REL["jobs"] if liveprs.get(j, {}).get("state") == "merged" or any(x["number"] == j and (x["state"] in ("DONE", "MERGED") or x.get("phase") in ("DONE", "MERGED")) for x in st["jobs"]))
    H.append(f'<div class="card"><b>🏆 Road to {e(REL.get("name", "the release"))}: {rd} of {rn} jobs in recovery</b><br>'
             f'{"🟩" * rd}{"⬜" * (rn - rd)}<br><span class="m">Then: {e(" → ".join(REL.get("after", [])))}</span></div>')
live = {}
try:
    live = {int(k): v for k, v in json.load(open(os.path.join(F, "progress", "prs.json"))).items()}
except Exception:
    pass
PRSTATE = {"merged": None, "green": "Checks green, waiting for the lead to merge", "running": "Checks running", "failing": "Fixing failing checks", "draft": "Draft PR", "open": "PR open"}
rep = {n for n, *_ in rj}
H.append("<h2>Jobs still open</h2><table><tr><th>Job</th><th>What</th><th>State</th></tr>")
for j in st["jobs"]:
    n = j["number"]
    lv = live.get(n)
    if j["state"] in ("DONE", "SKIPPED", "MERGED") or j.get("phase") in ("DONE", "MERGED") or (lv and lv["state"] == "merged"):
        continue
    if lv:
        state = PRSTATE.get(lv["state"], "PR open")
    elif n in rep:
        state = "In progress"
    else:
        state = {"NOT WRITTEN": "Not started", "NOT STARTED": "Not started"}.get(j["state"], j["state"].capitalize())
    H.append(f'<tr><td>{e(j["key"])}</td><td>{e(j["title"])}</td><td>{e(state)}</td></tr>')
H.append("</table>")
landed = sorted([(v.get("merged_at", ""), n, v) for n, v in liveprs.items() if v.get("state") == "merged" and v.get("merged_at")], reverse=True)[:4]
if landed:
    H.append("<h2>Landed recently</h2><table>")
    for ts, n, v in landed:
        H.append(f'<tr><td>{boston(ts)}</td><td><a href="{PR}{v["pr"]}">{e(v.get("title", ""))}</a></td></tr>')
    H.append("</table>")
if open_bugs:
    H.append("<h2>Open bugs</h2><table>")
    for b in open_bugs:
        H.append(f'<tr><td>{e(b["id"])}</td><td>{e(b["title"])}</td><td>{e(b["status"].title())}</td></tr>')
    H.append("</table>")
H.append('<div class="m" style="margin-top:8px">Bars are the share done, weighted by how long each kind of step usually takes (ETA_STUDY.md). Lanes: ' +
         " · ".join(f'<span style="color:{c if c != "#ffffff" else "#6b7280"}">■</span> {l}' for l, c in HEX.items()) + "</div></div>")
out = "\n".join(H) + "\n"
open(os.path.join(F, "CUSTOM_VIEW.html"), "w").write(out)
# Snapshot the other team reads straight from the repo (raw URL), so its own Custom view can show Team G's jobs without a relay hop.
snap = {"team": "G", "updated": now.isoformat(timespec="minutes"), "jobs_done": st["done"], "jobs_total": st["total"], "open_bugs": len(open_bugs),
        "next_move": st.get("next_move") or [],
        "running": [{"job": n, "title": r.get("title", ""), "worker": lane_of(r)[1], "done": k, "total": t, "pct": round(ETA.describe(r)["pct"], 4), "eta": ETA.describe(r)["eta"],
                     "current": r.get("current", ""), "pr": r.get("pr"), "updated": r.get("updated", "")} for n, r, k, t in rj]}
json.dump(snap, open(os.path.join(F, "TEAM_G_PROGRESS.json"), "w"), indent=1, ensure_ascii=False)
print("custom view bytes", len(out.encode()))
if len(out.encode()) > 7000 and not COMPACT:
    os.execv(sys.executable, [sys.executable, os.path.abspath(__file__), "--compact"])
