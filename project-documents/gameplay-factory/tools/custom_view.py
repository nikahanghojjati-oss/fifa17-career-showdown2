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
from factory_common import F, running_jobs, lane_of, all_bugs, OPEN_BUG, pitch, ALL_LANES, HEX as LANE_HEX
import two_factories as TF

BOS = ZoneInfo("America/New_York")
BLOB = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/"
PR = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/pull/"
# Lane colours Nik picked (2026-10-05): Sol chat light blue, Sol Work green, Codex white, Opus orange, Sonnet violet, Haiku yellow.
HEX = LANE_HEX
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
NOW = st.get("now") or {}

H = ["<style>"
     ".cv{--h:'Arial Narrow',Impact,sans-serif;font:14px/1.45 'Segoe UI',system-ui,sans-serif;max-width:720px;color:#fbfcfc;background:#20272d;border-radius:14px;padding:0 0 14px;overflow:hidden}"
     ".cv .ban{background:#2c7399;background:repeating-linear-gradient(90deg,#2a6e93 0 48px,#2c7399 48px 96px);border-bottom:4px solid #f0d900;padding:8px 14px 6px}"
     ".cv .ban b{display:block;font:italic 800 19px/1.1 var(--h);letter-spacing:.04em;text-transform:uppercase}"
     ".cv .ban span{font-size:12px;color:#dce5e8}.cv .ban a{color:#f0d900}"
     ".cv .tiles{display:flex;gap:6px;padding:8px 10px 0}.cv .tile{flex:1;background:#2c353c;border:1px solid #43515b;border-top:3px solid #f0d900;border-radius:8px;padding:3px 4px;text-align:center}"
     ".cv .tile b{display:block;font:italic 800 22px/1.1 var(--h);color:#f0d900}.cv .tile span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8ea2ac}"
     ".cv h2{font:italic 800 15px/1 var(--h);letter-spacing:.08em;text-transform:uppercase;color:#42b9da;margin:12px 12px 4px;padding-left:8px;border-left:4px solid #f0d900}"
     ".cv .card{background:#2c353c;border:1px solid #43515b;border-radius:10px;padding:8px 10px;margin:6px 10px}.cv .move{background:#3a3a1c;border-color:#f0d900}"
     ".cv .m{color:#8ea2ac;font-size:12px}.cv .pc{font:italic 800 20px var(--h);color:#f0d900;margin-left:8px}"
     ".cv table{border-collapse:collapse;width:calc(100% - 24px);margin:0 12px}.cv td,.cv th{color:#fbfcfc;border-bottom:1px solid #43515b;padding:5px 6px;text-align:left;font-size:13px}.cv th{color:#8ea2ac !important;font-size:11px;text-transform:uppercase;letter-spacing:.08em}"
     ".cv a{color:#fbfcfc;text-decoration:underline}.cv code{background:#20272d;padding:0 4px;border-radius:3px}.cv .foot{margin:10px 14px 0}</style>",
     '<div class="cv">',
     f'<div class="ban"><b>Showdown · G Factory + V Factory</b><span>Updated {now:%a %-d %b, %-I:%M %p} Boston time · <a href="{BLOB}BOARD.md">Job board</a> · <a href="{BLOB}BUG_BOARD.md">Bug board</a> · <a href="{BLOB}RELAY.md">Relay</a></span></div>',
     f'<div class="tiles"><div class="tile"><b>{e(((st.get("two") or {}).get("live") or {}).get("revision", "?").split("-")[-1])}</b><span>Live</span></div><div class="tile"><b>{NOW.get("moving", 0)}</b><span>Moving</span></div><div class="tile"><b>{NOW.get("next", 0)}</b><span>Up next</span></div><div class="tile"><b>{NOW.get("nik", 0)}</b><span>Waits on Nik</span></div></div>',
     "<h2>Your next move</h2>", '<div class="card move">' + "<br>".join(md(m) for m in st.get("next_move") or ["Nothing for you to start right now."]) + "</div>",
     "<h2>Moving now</h2>"]
rj = sorted(running_jobs())
G_W = lambda g: ("checks unknown" if not g else ("🔴 " if g["failed"] else "🟠 " if g["cancelled"] else "⏳ " if g["running"] else "🟢 ") + ", ".join([f'{g["passed"]} passed'] + [f'{g[k]} {k}' for k in ("running", "failed", "cancelled") if g[k]]))
_mv = [f'<a href="{PR}{x["pr"]}">PR #{x["pr"]}</a> {e(x["title"][:70])} <span class="m">{e(G_W(x.get("gates")))}</span>' for x in NOW.get("fixes", [])]
_mv += [f'<b>{e(k)} {e(x["id"])}</b> {e(x["title"][:58])} <span class="m">{e(x["state"].split(" (")[0][:40])}</span>' for k in ("G", "V") for x in (NOW.get("rows", {}).get(k, {}).get("moving") or [])]
if _mv:
    H.append('<div class="card">' + "<br>".join(_mv) + "</div>")
elif not rj:
    H.append('<div class="card m">Nothing is moving right now.</div>')
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
GF = ETA.gaffer()
if GF:
    if GF["stale"]:
        GF = None
if GF:
    gc = "#f0d900" if GF["pct"] < 80 else "#f97316" if GF["pct"] < 95 else "#ef4444"
    H.append(f'<div class="card"><b>{GF["emoji"]} Gaffer · {e(GF.get("level_name", ""))} · {e(GF.get("mood", ""))}</b> <span class="m">updated {e(GF.get("updated_boston", ""))} Boston time</span><br>'
             f'<svg width="300" height="12" viewBox="0 0 300 12"><rect width="300" height="12" rx="6" fill="#12191f" stroke="#43515b"/><rect width="{3 * GF["pct"]}" height="12" rx="6" fill="{gc}"/></svg>'
             f'<span class="pc" style="font-size:16px">{GF["pct"]} %</span> <span class="m">5-hour usage · resets {boston(GF.get("resets_at"))}</span><br>'
             f'<b>Last call:</b> {e(GF.get("last_decision", ""))}<br><a href="{e(GF.get("page", ""))}">Gaffer page</a></div>')
REL = json.load(open(os.path.join(F, "BOARD.json"))).get("release") or {}
liveprs = {}
try:
    liveprs = {int(k): v for k, v in json.load(open(os.path.join(F, "progress", "prs.json"))).items()}
except Exception:
    pass
TWO = st.get("two") or {}
LV = TWO.get("live")
H.append("<h2>Live now</h2>")
if LV:
    H.append(f'<div class="card">🌐 <b>main <code>{e(LV["sha"])}</code> · {e(LV["revision"])}</b> <span class="m">{e(TF.bos(LV["when"]))}</span><br>{e(LV["subject"][:80])}' +
             (f'<br><b>Shipped today:</b>' + "".join(f'<br>✅ <span class="m">{e(TF.bos(x["merged"], "%-I:%M %p"))}</span> #{x["pr"]} {e(x["title"][:48])}' for x in LV.get("today", [])[:4]) if LV.get("today") and not COMPACT else "") + "</div>")
else:
    H.append('<div class="card m">Could not read main this run.</div>')
FAC = json.load(open(os.path.join(F, "BOARD.json"))).get("factories", {})
def sq(lane):
    return f'<span style="color:{HEX.get(ALL_LANES.get(lane, ("", lane))[1], "#9ca3af")}">■</span>'
for key, colour in (("G", "#22c55e"), ("V", "#42b9da")):
    f = FAC.get(key)
    if not f:
        continue
    _b = NOW.get("rows", {}).get(key, {})
    fut = (_b.get("next") or []) + (_b.get("nik") or []) + (_b.get("later") or []) if _b else [x for x in f["future"] if not str(x["state"]).lower().startswith("done")]
    rows = "".join(f'<br>{sq(x["lane"])} <b>{e(x["id"])}</b> {e(x["title"][:56])} <span class="m">{e(x["state"])}</span>' for x in fut[:3])
    extra = ""
    if key == "V":
        vj = TWO.get("v_jobs") or []
        extra = "".join(f'<br>{sq("opus")} <b>{e(j["job"])}</b> {e(j["title"][:60])} <span class="pc" style="font-size:15px">{100 * j["done"] / max(j["total"], 1):.0f} %</span>' for j in vj if j["done"] < j["total"]) or '<br><span class="m">No Team V job running right now.</span>'
    H.append(f'<h2 style="border-left-color:{colour}">{e(f["name"])}</h2><div class="card"><span class="m">' + " ".join(sq(w["lane"]) for w in f["workers"]) + f' {len(f["workers"])} workers</span>{extra}{rows}' +
             (f'<br><span class="m">and {len(fut) - 3} more on the board</span>' if len(fut) > 3 else "") + "</div>")
H.append("<h2>Relay</h2>")
TK = TWO.get("tickets") or []
rel = st.get("relay") or {}
ov = [t["id"] for t in TK if t.get("overdue")]
H.append('<div class="card">' + ("✅ Relay working" + "".join(f" · {k} wake {'✅' if v else '⚠'}" for k, v in (TWO.get("inbox") or {}).items()) if TWO.get("relay_ok") and not ov else "⚠ " + (", ".join(ov) + " not acknowledged" if ov else "wake comments unreadable")) +
         f' <span class="m">{rel.get("count", 0)} messages · {len(TK)} hand-offs</span>')
STEP = ["SENT", "DELIVERED", "RECEIVED", "WORKING", "DONE"]
_open_tk = [t for t in TK if t["stage"] != "DONE"]
H.append(f'<br><span class="m">{len(_open_tk)} open hand-offs, {len(TK) - len(_open_tk)} done</span>')
for t in _open_tk[::-1][:4]:
    k = STEP.index(t["stage"]) if t["stage"] in STEP else 0
    dots = "".join("🟢" if i <= k else "⚪" for i in range(5))
    H.append(f'<br>{dots} <b>{e(t["id"])}</b> {e(t.get("from") or "?")}→{e(t.get("to") or "?")} {e(t["title"][:50])} <span class="m">{e(TF.STAGE_WORD.get(t["stage"], t["stage"]))}' + (f' {t["pct"]:.0f} %' if t["stage"] == "WORKING" else "") + (f' · picked up in {TF.mins(t["pickup_min"])}' if t.get("pickup_min") is not None else f' · waiting {TF.mins(t["waiting_min"])}' if t.get("waiting_min") is not None else "") + "</span>")
for m in (rel.get("rows") or [])[-1:]:
    H.append(f'<br><span class="m">{e(m["id"])} · {e(m["subject"][:60])}</span>')
H.append(f'<br><a href="{BLOB}RELAY.md">Every message in full</a></div>')
if REL.get("jobs") and not REL.get("done"):
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
_open_rows = []
for j in st["jobs"]:
    n = j["number"]
    lv = live.get(n)
    if j["state"] in ("DONE", "SKIPPED", "MERGED") or j.get("phase") in ("DONE", "MERGED") or (lv and lv["state"] == "merged"):
        continue
    if j.get("stale"):
        state = "⚠ stale status: " + (PRSTATE.get(lv["state"], "PR open") if lv else j["state"].capitalize())
    elif lv:
        state = PRSTATE.get(lv["state"], "PR open")
    elif n in rep:
        state = "In progress"
    else:
        state = {"NOT WRITTEN": "Not started", "NOT STARTED": "Not started"}.get(j["state"], j["state"].capitalize())
    _open_rows.append(f'<tr><td>{e(j["key"])}</td><td>{e(j["title"])}</td><td>{e(state)}</td></tr>')
if _open_rows:
    H += ["<h2>G jobs still open</h2><table><tr><th>Job</th><th>What</th><th>State</th></tr>"] + _open_rows + ["</table>"]
landed = sorted([(v.get("merged_at", ""), n, v) for n, v in liveprs.items() if v.get("state") == "merged" and v.get("merged_at")], reverse=True)[:4]
if landed and False:  # "Live now" carries what is on main; recovery merges are history since 2.0
    H.append("<h2>Landed recently</h2><table>")
    for ts, n, v in landed:
        H.append(f'<tr><td>{boston(ts)}</td><td><a href="{PR}{v["pr"]}">{e(v.get("title", ""))}</a></td></tr>')
    H.append("</table>")
if open_bugs and not COMPACT:  # compact (page would pass 7 KB): the bug board link in the banner carries them
    H.append('<h2>Open bugs</h2><div class="card">' + "<br>".join(f'<b>{e(b["id"])}</b> {e(b["title"][:50])} <span class="m">{e(b["status"].title())} · {e(lane_of(b)[1] if b.get("worker") else "no owner")}</span>' for b in open_bugs[:3]) + "</div>")
H.append('<div class="m foot">Lanes: ' +
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
