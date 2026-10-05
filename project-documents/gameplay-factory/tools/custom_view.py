#!/usr/bin/env python3
"""Write CUSTOM_VIEW.html: the whole Custom view tab as one HTML fragment (no scripts, no images, under 7 KB).
Reads BOARD_STATE.json (run board.py first), progress/ (run collect_progress.py first) and BUGS.json.
The coordinator only copies this file onto the tab, so a refresh costs no Claude reasoning.
Also writes TEAM_G_PROGRESS.json, the snapshot Team V reads from the repo for its own tab.
Run from the repo root: python3 project-documents/gameplay-factory/tools/custom_view.py"""
import json, os, re, sys, datetime, html
from zoneinfo import ZoneInfo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from factory_common import F, running_jobs, lane_of, all_bugs, OPEN_BUG

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


def cut(t, n):
    t = " ".join(str(t).split())
    return t if len(t) <= n else t[: n - 1].rstrip() + "…"


def boston(iso):
    try:
        return f"{datetime.datetime.fromisoformat(str(iso).replace('Z', '+00:00')).astimezone(BOS):%-I:%M %p}"
    except Exception:
        return "unknown"


def bar(frac, colour):
    w = round(300 * min(max(frac, 0), 1), 1)
    return (f'<svg width="300" height="14" viewBox="0 0 300 14"><rect width="300" height="14" rx="7" fill="#e5e7eb"/>'
            f'<rect width="{w}" height="14" rx="7" fill="{colour}" stroke="#9ca3af" stroke-width="1"/></svg>')


st = json.load(open(os.path.join(F, "BOARD_STATE.json")))
open_bugs = [b for b in all_bugs() if b["status"] in OPEN_BUG]
now = datetime.datetime.now(BOS)

H = ["<style>.cv{font:14px/1.45 system-ui,sans-serif;color:#111827;max-width:720px}.cv h2{font-size:16px;margin:18px 0 6px}"
     ".cv .card{border:1px solid #d1d5db;border-radius:10px;padding:10px 12px;margin:8px 0;background:#fff}.cv .move{background:#fff7ed;border-color:#fdba74}"
     ".cv .m{color:#6b7280;font-size:12px}.cv .pc{font-weight:700;margin-left:8px}.cv table{border-collapse:collapse;width:100%}"
     ".cv td,.cv th{border-bottom:1px solid #e5e7eb;padding:4px 6px;text-align:left;font-size:13px}.cv a{color:#2563eb}</style>",
     '<div class="cv">',
     f'<div class="m">Updated {now:%a %-d %b, %-I:%M %p} Boston time · {st["done"]} of {st["total"]} jobs done · {len(open_bugs)} open bug{"s" if len(open_bugs) != 1 else ""} · '
     f'<a href="{BLOB}BOARD.md">Job board</a> · <a href="{BLOB}BUG_BOARD.md">Bug board</a></div>',
     "<h2>Your next move</h2>", '<div class="card move">' + "<br>".join(md(m) for m in st.get("next_move") or ["Nothing for you to start right now."]) + "</div>",
     "<h2>Running now</h2>"]
rj = sorted(running_jobs())
if not rj:
    H.append('<div class="card m">No job is reporting progress right now.</div>')
for n, r, k, t in rj:
    sq, who = lane_of(r)
    frac = k / max(t, 1)
    left = [s["name"] for s in r["steps"] if not s.get("done")]
    title = f'Job {n} · {e(cut(r.get("title", ""), 50))}'
    title = f'<a href="{PR}{r["pr"]}">{title}</a>' if r.get("pr") else title
    H.append(f'<div class="card"><b>{title}</b> <span class="m">{e(who)} · {k} of {t} steps · {boston(r.get("updated"))}</span><br>'
             f'{bar(frac, HEX.get(who, "#6b7280"))}<span class="pc">{100 * frac:.2f} %</span><br>'
             f'<b>Going on now:</b> {e(cut(r.get("current") or "not reported", 150))}<br>'
             f'<b>Still to do:</b> {e(cut(" → ".join(left) or "nothing", 130))}</div>')
H.append("<h2>Jobs still open</h2><table><tr><th>Job</th><th>What</th><th>State</th></tr>")
for j in [j for j in st["jobs"] if j["state"] not in ("DONE", "SKIPPED")][:14]:
    H.append(f'<tr><td>{e(j["key"])}</td><td>{e(cut(j["title"], 60))}</td><td>{e(j["state"].title())}</td></tr>')
H.append("</table>")
H.append('<div class="m" style="margin-top:8px">Bars are finished steps ÷ all steps, never estimated. Lanes: ' +
         " · ".join(f'<span style="color:{c if c != "#ffffff" else "#6b7280"}">■</span> {l}' for l, c in HEX.items()) + "</div></div>")
out = "\n".join(H) + "\n"
open(os.path.join(F, "CUSTOM_VIEW.html"), "w").write(out)
# Snapshot the other team reads straight from the repo (raw URL), so its own Custom view can show Team G's jobs without a relay hop.
snap = {"team": "G", "updated": now.isoformat(timespec="minutes"), "jobs_done": st["done"], "jobs_total": st["total"], "open_bugs": len(open_bugs),
        "next_move": st.get("next_move") or [],
        "running": [{"job": n, "title": r.get("title", ""), "worker": lane_of(r)[1], "done": k, "total": t, "pct": round(100 * k / max(t, 1), 2),
                     "current": r.get("current", ""), "pr": r.get("pr"), "updated": r.get("updated", "")} for n, r, k, t in rj]}
json.dump(snap, open(os.path.join(F, "TEAM_G_PROGRESS.json"), "w"), indent=1, ensure_ascii=False)
print("custom view bytes", len(out.encode()))
