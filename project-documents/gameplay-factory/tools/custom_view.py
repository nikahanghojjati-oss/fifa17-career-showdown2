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
    f = min(max(frac, 0), 1)
    w = round(10 + 280 * f, 1)
    return (f'<svg width="300" height="22" viewBox="0 0 300 22"><rect y="4" width="300" height="14" rx="7" fill="#12191f" stroke="#43515b"/>'
            f'<rect y="4" width="{w}" height="14" rx="7" fill="{colour}"/><rect y="4" width="{w}" height="4" rx="2" fill="#ffffff" fill-opacity=".25"/>'
            f'<circle cx="{w}" cy="11" r="9" fill="#fbfcfc" stroke="#f0d900" stroke-width="2"/><circle cx="{w}" cy="11" r="3.5" fill="#20272d"/></svg>')


st = json.load(open(os.path.join(F, "BOARD_STATE.json")))
open_bugs = [b for b in all_bugs() if b["status"] in OPEN_BUG]
now = datetime.datetime.now(BOS)
rj0 = running_jobs()

H = ["<style>"
     ".cv{font:14px/1.45 'Segoe UI',system-ui,sans-serif;max-width:720px;color:#fbfcfc;background:#20272d;border-radius:14px;padding:0 0 14px;overflow:hidden}"
     ".cv .ban{background:#2c7399;background:repeating-linear-gradient(90deg,#2a6e93 0 48px,#2c7399 48px 96px);border-bottom:4px solid #f0d900;padding:14px 16px 10px}"
     ".cv .ban b{display:block;font:italic 800 22px/1.1 'Arial Narrow','Oswald',Impact,sans-serif;letter-spacing:.04em;text-transform:uppercase}"
     ".cv .ban span{font-size:12px;color:#dce5e8}.cv .ban a{color:#f0d900}"
     ".cv .tiles{display:flex;gap:8px;padding:12px 12px 0}.cv .tile{flex:1;background:#2c353c;border:1px solid #43515b;border-top:3px solid #f0d900;border-radius:8px;padding:6px 4px;text-align:center}"
     ".cv .tile b{display:block;font:italic 800 26px/1.1 'Arial Narrow',Impact,sans-serif;color:#f0d900}.cv .tile span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8ea2ac}"
     ".cv h2{font:italic 800 15px/1 'Arial Narrow',Impact,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#42b9da;margin:18px 14px 6px;padding-left:8px;border-left:4px solid #f0d900}"
     ".cv .card{background:#2c353c;border:1px solid #43515b;border-radius:10px;padding:10px 12px;margin:8px 12px}.cv .move{background:#3a3a1c;border-color:#f0d900}"
     ".cv .m{color:#8ea2ac;font-size:12px}.cv .pc{font:italic 800 20px 'Arial Narrow',Impact,sans-serif;color:#f0d900;margin-left:8px}"
     ".cv table{border-collapse:collapse;width:calc(100% - 24px);margin:0 12px}.cv td,.cv th{color:#fbfcfc;border-bottom:1px solid #43515b;padding:5px 6px;text-align:left;font-size:13px}.cv th{color:#8ea2ac !important;font-size:11px;text-transform:uppercase;letter-spacing:.08em}"
     ".cv a{color:#fbfcfc;text-decoration:underline}.cv code{background:#20272d;padding:0 4px;border-radius:3px}.cv .foot{margin:10px 14px 0}</style>",
     '<div class="cv">',
     f'<div class="ban"><b>Team G · Career Mode Showdown tracker</b><span>Updated {now:%a %-d %b, %-I:%M %p} Boston time · <a href="{BLOB}BOARD.md">Job board</a> · <a href="{BLOB}BUG_BOARD.md">Bug board</a></span></div>',
     f'<div class="tiles"><div class="tile"><b>{st["done"]}/{st["total"]}</b><span>Jobs done</span></div><div class="tile"><b>{len(rj0)}</b><span>In play</span></div><div class="tile"><b>{len(open_bugs)}</b><span>Open bugs</span></div></div>',
     f'<div class="m" style="margin:6px 14px 0;text-align:center">{ETA.whistle([ETA.describe(r) for _, r, _, _ in rj0])}</div>',
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
H.append('<div class="m foot">Bars are the share done, weighted by how long each kind of step usually takes (ETA_STUDY.md). Lanes: ' +
         " · ".join(f'<span style="color:{c}">■</span> {l}' for l, c in HEX.items()) + "</div></div>")
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
