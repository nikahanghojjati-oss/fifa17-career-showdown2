#!/usr/bin/env python3
"""The one board (Nik, 2026-10-06: bug hunting only, one board, accurate and current first, light second).
Writes, from the same data:
  CUSTOM_VIEW.html    Team G lead's Custom view (Team G first)
  CUSTOM_VIEW_V.html  Team V lead's view (Team V first, same facts)
  BOARD.md            the same board on GitHub
  BUG_BOARD.md        a pointer to BOARD.md (the bug board folded into the one board)
  TEAM_G_PROGRESS.json  snapshot Team V reads from the repo
Reads BOARD_STATE.json (run board.py first), progress/ (run collect_progress.py first), BOARD.json and BUGS.json.
Anything that keeps a fact from being current is shown on the board itself as a ⚠ line.
Run from the repo root: python3 project-documents/gameplay-factory/tools/custom_view.py"""
import json, os, re, sys, datetime, html
from zoneinfo import ZoneInfo
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eta as ETA
from factory_common import F, running_jobs, lane_of, all_bugs, OPEN_BUG, ALL_LANES, HEX
import two_factories as TF

BOS = ZoneInfo("America/New_York")
REPO = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2"
BLOB = f"{REPO}/blob/factory/gameplay-v1/project-documents/gameplay-factory/"
PR = f"{REPO}/pull/"
QI = {l: i for i, l in enumerate(HEX)}
e = html.escape
LIMIT = 7000  # the coordinator's Custom view tab

st = json.load(open(os.path.join(F, "BOARD_STATE.json")))
BJ = json.load(open(os.path.join(F, "BOARD.json")))
NOW = st.get("now") or {}
TWO = st.get("two") or {}
now = datetime.datetime.now(BOS)
warn = []  # anything that keeps the board from showing current facts


def bos_t(iso, fmt="%-I:%M %p"):
    try:
        return datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(BOS).strftime(fmt)
    except Exception:
        return ""


def age_h(iso):
    try:
        return (now - datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00")).astimezone(BOS)).total_seconds() / 3600
    except Exception:
        return None


def md(t):
    t = e(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    return re.sub(r"`(.+?)`", r"<code>\1</code>", t)


def short_state(s):
    return str(s).split(" (")[0].split(";")[0].strip()


def lane_name(lane):
    return ALL_LANES.get(lane, ("", lane))[1]


# ---------- the items, one list per team and bucket ----------
running = {str(n): (r, k, t) for n, r, k, t in running_jobs()}
items = {"G": {"fix": [], "next": [], "later": []}, "V": {"fix": [], "next": [], "later": []}}
nik = []
for x in NOW.get("fixes", []):  # open releases and fixes into main, with their checks
    g = x.get("gates") or {}
    chk = "checks unknown" if not g else ("🔴 " if g["failed"] else "🟠 " if g["cancelled"] else "⏳ " if g["running"] else "🟢 ") + ", ".join([f'{g["passed"]} passed'] + [f'{g[k]} {k}' for k in ("running", "failed", "cancelled") if g[k]])
    items["G"]["fix"].append({"id": f"PR #{x['pr']}", "url": f"{PR}{x['pr']}", "title": x["title"], "state": chk + (" (draft)" if x.get("draft") else ""), "lane": "lead"})
seen = set()
for team in ("G", "V"):
    rows = NOW.get("rows", {}).get(team, {})
    for b, dest in (("moving", "fix"), ("next", "next"), ("later", "later")):
        for x in rows.get(b) or []:
            it = {"id": x["id"], "title": re.sub(r"^\d+ · [GV] ", "", x["title"]), "state": short_state(x["state"]), "lane": x.get("lane", ""), "waits": x.get("waits_on") or ""}
            if str(x["id"]) in running:
                r, k, t = running.pop(str(x["id"]))
                it["progress"] = (ETA.describe(r), r)
            items[team][dest].append(it)
            seen.add(str(x["id"]))
    for x in rows.get("nik") or []:
        full = next((y for y in BJ["factories"][team]["future"] if y["id"] == x["id"]), x)
        nik.append({"id": x["id"], "title": x["title"], "decision": full.get("decision") or f'{x["title"]} ({short_state(x["state"])})'})
        seen.add(str(x["id"]))
for n, (r, k, t) in running.items():  # running jobs with no board row
    items["G"]["fix"].append({"id": f"Job {n}", "title": r.get("title", ""), "state": r.get("current") or "in progress", "lane": str(r.get("worker", "")), "progress": (ETA.describe(r), r)})
for j in TWO.get("v_jobs") or []:  # Team V jobs reported by their PR progress block
    if j["done"] < j["total"]:
        items["V"]["fix"].append({"id": j["job"], "url": f"{PR}{j['pr']}" if j.get("pr") else None, "title": j["title"], "state": j.get("current") or "in progress",
                                  "lane": j.get("lane") or "", "pct": 100.0 * j["done"] / max(j["total"], 1), "steps": f'{j["done"]} of {j["total"]} steps'})
# Open bug reports that no board row carries yet
rowtext = " ".join(f'{y["id"]} {y["title"]}' for t in ("G", "V") for y in BJ["factories"][t]["future"])
for b in all_bugs():
    if b["status"] in OPEN_BUG and b["id"] not in rowtext:
        dest = "fix" if b["status"] in ("FIXING", "REVIEW", "MERGED") else "next"
        items["V" if b.get("type") == "visual" else "G"][dest].append({"id": b["id"], "title": b["title"], "state": b["status"].title(), "lane": b.get("worker") or ""})
for team in ("G", "V"):  # a job that waits for Nik to start it (type its number in a GPT chat) is his move too
    for it in items[team]["fix"]:
        if re.search(r"waiting (for|on) Nik", it["state"], re.I):
            act = re.sub(r"^.*?waiting (for|on) Nik to ", "", it["state"], flags=re.I)
            nik.append({"id": it["id"], "title": it["title"], "decision": f'{it["title"]}. {act[0].upper()}{act[1:]} to start it.'})
for m in BJ.get("next_move") or []:
    nik.insert(0, {"id": "", "title": "", "decision": m, "md": True})

# ---------- facts that may be out of date ----------
LV = TWO.get("live")
if not LV:
    warn.append("Could not read main this run, so the live version may be old.")
ph = TWO.get("physio") or {}
if "(from GitHub)" in str(ph.get("line", "")):
    warn.append("The Physio's own report is missing or older than 15 minutes; the check line comes straight from GitHub.")
if not TWO.get("relay_ok"):
    warn.append("The relay could not be read this run.")
for team in ("G", "V"):
    for it in items[team]["fix"]:
        if it.get("progress"):
            h = age_h(it["progress"][1].get("updated"))
            if h is not None and h > 3:
                it["stale"] = f"no update for {h:.0f} h"


# ---------- HTML ----------
def sq(lane):
    return f'<i class="q{QI.get(lane_name(lane), 9)}">■</i>'


def item_html(it, cut):
    idt = f'<a href="{it["url"]}">{e(it["id"])}</a>' if it.get("url") else f'<b>{e(it["id"])}</b>'
    s = f'{sq(it.get("lane", ""))} {idt} {e(it["title"][:cut])} <span class="m">{e(it["state"][:48])}'
    if it.get("progress"):
        d, r = it["progress"]
        s += f' · {d["pct"]:.4f} %' + (f' · done ~{e(d["eta"])}' if d.get("eta") and d["eta"] != "not enough data" else "")
    elif it.get("pct") is not None:
        s += f' · {it["pct"]:.0f} % ({it["steps"]})'
    if it.get("stale"):
        s += f' · ⚠ {it["stale"]}'
    return s + "</span>"


def team_html(team, emph, cut):
    T = items[team]
    name = {"G": "Team G · gameplay fixes", "V": "Team V · visual fixes"}[team]
    out = [f'<h2 style="border-left-color:{"#f0d900" if emph else "#43515b"}">{name}</h2><div class="card">']
    lines = []
    if T["fix"]:
        lines.append('<span class="k">Fixing now</span>')
        lines += [item_html(x, cut) for x in T["fix"]]
    if T["next"] or T["later"]:
        lines.append('<span class="k">Up next</span>')
        lines += [item_html(x, cut) for x in T["next"]]
        lines += [item_html(dict(x, state="queued" + (f' · after {re.sub(r"^after ", "", x["waits"])[:30]}' if x.get("waits") else "")), cut) for x in T["later"]]
    if not lines:
        lines.append('<span class="m">Nothing open for this team.</span>')
    return "".join(out) + "<br>".join(lines) + "</div>"


def render(first, compact=False):
    cut = 46 if compact else 70
    n_fix = sum(len(items[t]["fix"]) for t in items)
    n_next = sum(len(items[t]["next"]) + len(items[t]["later"]) for t in items)
    n_nik = len([x for x in nik if not x.get("md")])
    H = ["<style>.cv{--h:'Arial Narrow',Impact,sans-serif;font:14px/1.45 'Segoe UI',system-ui,sans-serif;max-width:720px;color:#fbfcfc;background:#20272d;border-radius:14px;padding:0 0 14px;overflow:hidden}"
         ".cv .ban{background:#2c7399;border-bottom:4px solid #f0d900;padding:8px 14px 6px}.cv .ban b{display:block;font:italic 800 19px/1.1 var(--h);letter-spacing:.04em;text-transform:uppercase}"
         ".cv .ban span{font-size:12px;color:#dce5e8}.cv .ban a{color:#f0d900}"
         ".cv .tiles{display:flex;gap:6px;padding:8px 10px 0}.cv .tile{flex:1;background:#2c353c;border:1px solid #43515b;border-top:3px solid #f0d900;border-radius:8px;padding:3px 4px;text-align:center}"
         ".cv .tile b{display:block;font:italic 800 22px/1.1 var(--h);color:#f0d900}.cv .tile span{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8ea2ac}"
         ".cv h2{font:italic 800 15px/1 var(--h);letter-spacing:.08em;text-transform:uppercase;color:#42b9da;margin:12px 12px 4px;padding-left:8px;border-left:4px solid #f0d900}"
         ".cv .card{background:#2c353c;border:1px solid #43515b;border-radius:10px;padding:8px 10px;margin:6px 10px}.cv .move{background:#3a3a1c;border-color:#f0d900}.cv .warn{background:#3d2216;border-color:#f97316}"
         ".cv .m{color:#8ea2ac;font-size:12px}.cv .k{font:italic 800 12px var(--h);letter-spacing:.08em;text-transform:uppercase;color:#f0d900}"
         ".cv a{color:#fbfcfc;text-decoration:underline}.cv code{background:#20272d;padding:0 4px;border-radius:3px}.cv .foot{margin:10px 14px 0}.cv i{font-style:normal}"
         + "".join(f".cv .q{i}{{color:{h}}}" for i, h in enumerate(HEX.values())) + ".cv .q9{color:#9ca3af}</style>",
         '<div class="cv">',
         f'<div class="ban"><b>Bug hunt board · Team {first} lead</b><span>Updated {now:%a %-d %b, %-I:%M %p} Boston time · same board as Team {"V" if first == "G" else "G"}\'s · <a href="{BLOB}BOARD.md">on GitHub</a> · <a href="{BLOB}RELAY.md">relay</a></span></div>',
         f'<div class="tiles"><div class="tile"><b>{e((LV or {}).get("revision", "?").split("-")[-1])}</b><span>Live</span></div><div class="tile"><b>{n_fix}</b><span>Fixing</span></div><div class="tile"><b>{n_next}</b><span>Up next</span></div><div class="tile"><b>{n_nik}</b><span>Needs you</span></div></div>']
    if warn:
        H.append('<div class="card warn">⚠ <b>Not fully current:</b> ' + " ".join(e(w) for w in warn) + "</div>")
    H.append(f'<div class="card">{TF.PHYSIO_ICON.get(ph.get("state"), "🩺")} <b>{e(ph.get("line", "Physio: no report yet."))}</b>' + (f'<br><span class="m">{e(ph["gate"])}</span>' if ph.get("gate") else "") + "</div>")
    H.append("<h2>Needs you</h2>")
    H.append('<div class="card move">' + ("<br>".join((md(x["decision"]) if x.get("md") else f'<b>{e(x["id"])}</b> {e(x["decision"])}') for x in nik) or "Nothing needs you right now.") + "</div>")
    for t in (first, "V" if first == "G" else "G"):
        H.append(team_html(t, t == first, cut))
    H.append("<h2>Live now</h2>")
    if LV:
        H.append(f'<div class="card">🌐 <b>{e(LV["revision"])}</b> <span class="m">main <code>{e(LV["sha"])}</code> · {e(TF.bos(LV["when"]))}</span><br>{e(LV["subject"][:90])}'
                 + "".join(f'<br>✅ <span class="m">{e(TF.bos(x["merged"], "%-I:%M %p"))}</span> #{x["pr"]} {e(x["title"][:cut])}' for x in (LV.get("today") or [])[:2 if compact else 4]) + "</div>")
    TK = TWO.get("tickets") or []
    open_tk = [x for x in TK if x["stage"] != "DONE"]
    H.append("<h2>Relay</h2>")
    H.append('<div class="card">' + ("✅ working" if TWO.get("relay_ok") else "⚠ unreadable") + f' <span class="m">{len(open_tk)} open hand-offs, {len(TK) - len(open_tk)} done</span>'
             + "".join(f'<br><b>{e(x["id"])}</b> {e(x.get("from") or "?")}→{e(x.get("to") or "?")} {e(x["title"][:cut])} <span class="m">{e(TF.STAGE_WORD.get(x["stage"], x["stage"]))}</span>' for x in open_tk[::-1][:3]) + "</div>")
    H.append('<div class="m foot">Lanes: ' + " · ".join(f'<i class="q{QI[l]}">■</i> {l}' for l in HEX) + "</div></div>")
    return "\n".join(H) + "\n"


for team, fn in (("G", "CUSTOM_VIEW.html"), ("V", "CUSTOM_VIEW_V.html")):
    out = render(team)
    if len(out.encode()) > LIMIT:
        out = render(team, compact=True)
    open(os.path.join(F, fn), "w").write(out)
    print(fn, "bytes", len(out.encode()))


# ---------- BOARD.md: the same board on GitHub ----------
def item_md(it):
    idt = f'[{it["id"]}]({it["url"]})' if it.get("url") else f'**{it["id"]}**'
    s = f'| {ALL_LANES.get(it.get("lane", ""), ("⬛", ""))[0]} {lane_name(it.get("lane", "")) or "?"} | {idt} | {it["title"]} | {it["state"]}'
    if it.get("progress"):
        d, _ = it["progress"]
        s += f' · {d["pct"]:.4f} %' + (f' · done ~{d["eta"]}' if d.get("eta") and d["eta"] != "not enough data" else "")
    elif it.get("pct") is not None:
        s += f' · {it["pct"]:.0f} % ({it["steps"]})'
    if it.get("stale"):
        s += f' · ⚠ {it["stale"]}'
    if it.get("waits") and it in sum((items[t]["later"] for t in items), []):
        s += f' · after {re.sub(r"^after ", "", it["waits"])}'
    return s.replace("\n", " ") + " |"


L = ["# Bug hunt board", "",
     f"Updated {now:%a %-d %b, %-I:%M %p} Boston time. Bug hunting only, no new features until further notice. "
     "The Team G and Team V Custom views show this same board. Older detail: [archive](BOARD_ARCHIVE.md) · [relay](RELAY.md).", ""]
if warn:
    L += ["> ⚠ **Not fully current:** " + " ".join(warn), ""]
L += [f"🌐 **Live: {LV['revision']}** (main `{LV['sha']}`, {TF.bos(LV['when'])})" if LV else "🌐 Live version unknown this run", "",
      f"{TF.PHYSIO_ICON.get(ph.get('state'), '🩺')} **{ph.get('line', 'Physio: no report yet.')}**" + (f" · {ph['gate']}" if ph.get("gate") else ""), "",
      "## Needs you", ""]
L += [f"- {x['decision']}" if x.get("md") else f"- **{x['id']}** {x['decision']}" for x in nik] or ["- Nothing needs you right now."]
for t in ("G", "V"):
    T = items[t]
    L += ["", f"## Team {t}", ""]
    for label, rows in (("Fixing now", T["fix"]), ("Up next", T["next"] + T["later"])):
        if rows:
            L += [f"**{label}**", "", "| Lane | Item | What | State |", "| --- | --- | --- | --- |"] + [item_md(x) for x in rows] + [""]
    if not (T["fix"] or T["next"] or T["later"]):
        L += ["Nothing open for this team.", ""]
if LV and LV.get("today"):
    L += ["## Shipped today", ""] + [f"- {TF.bos(x['merged'], '%-I:%M %p')} · #{x['pr']} {x['title']}" for x in LV["today"]] + [""]
open(os.path.join(F, "BOARD.md"), "w").write("\n".join(L) + "\n")
open(os.path.join(F, "BUG_BOARD.md"), "w").write("# Bug board\n\nFolded into the one board on 2026-10-06: see [BOARD.md](BOARD.md). Every bug report, fixed or not, is listed in [the archive](BOARD_ARCHIVE.md).\n")

# Snapshot Team V reads straight from the repo
rj = running_jobs()
snap = {"team": "G", "updated": now.isoformat(timespec="minutes"), "open_bugs": len([b for b in all_bugs() if b["status"] in OPEN_BUG]),
        "next_move": BJ.get("next_move") or [],
        "running": [{"job": n, "title": r.get("title", ""), "worker": lane_of(r)[1], "done": k, "total": t, "pct": round(ETA.describe(r)["pct"], 4), "eta": ETA.describe(r)["eta"],
                     "current": r.get("current", ""), "pr": r.get("pr"), "updated": r.get("updated", "")} for n, r, k, t in rj]}
json.dump(snap, open(os.path.join(F, "TEAM_G_PROGRESS.json"), "w"), indent=1, ensure_ascii=False)
