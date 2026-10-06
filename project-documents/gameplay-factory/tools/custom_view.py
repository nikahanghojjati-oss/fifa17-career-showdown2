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
        if str(x["id"]) in running:  # already started (its status file shows a step), so it is no longer Nik's move
            r, k, t = running.pop(str(x["id"]))
            items[team]["fix"].append({"id": x["id"], "title": re.sub(r"^\d+ · [GV] ", "", x["title"]), "state": r.get("current") or "in progress", "lane": x.get("lane", ""), "progress": (ETA.describe(r), r)})
            seen.add(str(x["id"]))
            continue
        full = next((y for y in BJ["factories"][team]["future"] if y["id"] == x["id"]), x)
        ttl = re.sub(r"^\d+ · [GV] ", "", x["title"])
        w = str(full.get("waits_on") or "")
        ask = re.sub(r"^Nik types( it)?", lambda m: f"Type {x['id']}" if m.group(1) else "Type", w) + "." if w.lower().startswith("nik types") else f"({short_state(x['state'])})"
        pm = re.match(r"^Nik types it (in .*)$", w)
        place = pm.group(1) if pm and not full.get("decision") else None
        nik.append({"id": x["id"], "title": ttl, "decision": full.get("decision") or f"{ttl}. {ask}", "place": place})
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
            m = re.match(r"type \S+ (.*)$", act, re.I)
            nik.append({"id": it["id"], "title": it["title"], "decision": f'{it["title"]}. {act[0].upper()}{act[1:]} to start it.', "place": m.group(1) if m else None})

# ---------- the job queue (Nik, 2026-10-06 01:53 UTC): every numbered job, ongoing and upcoming, with what to type and where ----------
JOB = re.compile(r"^(?:Job |V-)?(\d{4})$")
LANE_PLACE = {"green": "the gameplay project (Work mode)", "sol-work": "the gameplay project (Work mode)", "blue": "the gameplay project (chat)", "sol-chat": "the gameplay project (chat)"}
rowmap = {str(y["id"]): y for t in ("G", "V") for y in BJ["factories"][t]["future"]}
Q = {"run": [], "next": [], "wait": [], "release": []}


def where(text, lane):
    m = re.search(r"\b(in (?:the|a new) [^.;]+)", text or "")
    return m.group(1).strip() if m else ("in " + LANE_PLACE[lane] if lane in LANE_PLACE else "")


def _merged_jobs():
    # job PRs ("JOB-NNNN ...") already merged into the bug-list branch: done, riding the next release (coordinator, 2026-10-06 02:41 UTC)
    import subprocess
    repo = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
    try:
        r = subprocess.run(["gh", "api", f"repos/{repo}/pulls?state=closed&per_page=60&sort=updated&direction=desc"], capture_output=True, text=True, timeout=30)
        prs = json.loads(r.stdout) if r.returncode == 0 else []
    except Exception:
        prs = []
    out = {}
    for pr in prs if isinstance(prs, list) else []:
        m = re.match(r"\s*JOB-?(\d{4})\b", pr.get("title") or "")
        if m and pr.get("merged_at") and str((pr.get("base") or {}).get("ref", "")).startswith("gameplay/"):
            out.setdefault(m.group(1), pr["number"])
    return out


MERGED = _merged_jobs()


import goals as GOALS
GL = GOALS.load(MERGED.keys())


def goal_lines():
    """The Thursday goals (Nik, 2026-10-06 04:01 UTC): {"G": text, "V": text}, plain text."""
    g, v = GL["G"], GL["V"]
    if g["state"] not in ("ok", "missing") and (g["areas"] or g["found"]):  # GitHub unreadable this run: last known numbers, flagged
        warn.append("Couldn't read the Bug Olympiad this run; its numbers are from the last good read.")
        g = dict(g, state="ok")
    if v["state"] not in ("ok", "missing") and v["studied"]:
        warn.append("Couldn't read the Mockup Lab this run; its numbers are from the last good read.")
        v = dict(v, state="ok")
    if g["state"] == "missing" or (g["state"] == "ok" and not g["areas"] and not g["found"]):
        gt = "Bug-free game: no Bug Olympiad run saved yet (it starts Thursday)."
    elif g["state"] != "ok":
        gt = "Bug-free game: couldn't read the Bug Olympiad this run."
    else:
        gt = (f"Bug-free game: {g['pct']:.4f} % · {g['areas']} of {g['of']} areas studied · open S1 {g['s1']}, S2 {g['s2']} · fixed {g['fixed']} of {g['found']} findings"
              + (" · weakest: area " + " and ".join(f"{a:02d}" for _, a in g["weakest"]) if g["weakest"] else ""))
    if v["state"] == "missing":
        vt = "Mockup match: the Mockup Lab hasn't saved a study yet."
    elif v["state"] != "ok":
        vt = "Mockup match: couldn't read the Mockup Lab this run."
    else:
        vt = f"Mockup match: {v['studied']} of {v['screens']} screens studied · {v['diffs']} differences from the mockups to fix"
    if g.get("bad"):
        warn.append(f"{len(g['bad'])} Bug Olympiad file(s) didn't parse: " + ", ".join(g["bad"][:3]) + ".")
    if v.get("bad"):
        warn.append(f"{len(v['bad'])} Mockup Lab file(s) didn't parse: " + ", ".join(v["bad"][:3]) + ".")
    return {"G": gt, "V": vt}


GOAL = goal_lines()


def status_done(n):
    # status/JOB-NNNN.md "State: DONE": the worker finished and the lead hasn't verified yet; still running, not "Next for you"
    try:
        t = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "status", f"JOB-{n}.md")).read()
    except OSError:
        return False
    m = re.search(r"^State:\s*(.+)$", t, re.M)
    return bool(m and re.match(r"DONE\b", m.group(1).strip(), re.I))


def q_add(it, team):
    m = JOB.match(str(it["id"]))
    n = m.group(1)
    row = rowmap.get(str(it["id"])) or {}
    w = str(row.get("waits_on") or it.get("waits") or "")
    st = str(row.get("state") or it.get("state") or "")
    lane = row.get("lane") or it.get("lane", "")
    q = dict(it, n=n, team=team, lane=lane)
    if re.match(r"(in release|verified|in r\d|merged)", st, re.I) or n in MERGED:
        Q["release"].append(q)
    elif status_done(n):
        q["state"] = "worker done, lead checking"
        Q["run"].append(q)
    elif re.match(r"(with (the )?(worker|lead)|worker done|verifying|building|in progress|in review|checks|ci )", st, re.I) or re.match(r"nothing to type", str(row.get("place") or ""), re.I):
        # the row's state says someone already has it (e.g. "with the lead"), so a stale "Nik types it" waits_on must not list it under Next for you
        Q["run"].append(q)
    elif (it.get("progress") or it.get("pct") is not None) and not re.search(r"waiting (for|on) Nik to type", st + " " + str(it.get("state", "")), re.I):
        # the worker's first saved step (status/JOB-NNNN.md "State: IN PROGRESS" or a PR progress block) moves the job to Running now, even before the row's waits_on is updated
        Q["run"].append(q)
    elif w.lower().startswith("nik types") or re.search(r"waiting (for|on) Nik to type", st + " " + str(it.get("state", "")), re.I) or (row.get("place") and re.match(r"(ready|next)", st, re.I)):
        q["type"] = n + (" again" if "again" in w else "")
        q["note"] = re.sub(r"^.*?\bagain\s*", "", w).strip() if "again" in w else ""
        q["where"] = row.get("place") or where(w + " " + str(it.get("state", "")), lane)
        q["note"] = row.get("note") or q["note"]
        if row.get("after") and not all(x in MERGED for x in re.findall(r"\b(\d{4})\b", row["after"]) or ["-"]):  # the wait clears itself once every job it names is merged
            q["note"] = "only after " + re.sub(r"^(only )?after ", "", row["after"]) + (" · " + q["note"] if q["note"] else "")
        Q["next"].append(q)
    elif it.get("progress") or it.get("pct") is not None or re.match(r"(with worker|worker done|verifying|building|in progress)", st, re.I):
        Q["run"].append(q)
    else:
        q["after"] = ("after " + re.sub(r"^after ", "", w)) if w else short_state(st)
        Q["wait"].append(q)


for team in ("G", "V"):
    for b in ("fix", "next", "later"):
        keep = []
        for it in items[team][b]:
            (q_add(it, team) if JOB.match(str(it["id"])) else keep.append(it))
        items[team][b] = keep
_nk = []
for x in nik:
    if JOB.match(str(x["id"])):
        if not any(q["id"] == x["id"] for v in Q.values() for q in v):
            q_add({"id": x["id"], "title": x["title"], "state": "", "lane": ""}, "G")
    else:
        _nk.append(x)
nik = _nk
# the bug factory sets `order` on BOARD.json rows (its priority for Nik); unordered jobs follow by number
for v in Q.values():
    v.sort(key=lambda q: (float((rowmap.get(str(q["id"])) or {}).get("order") or 9999), int(q["n"])))
Q["release"].sort(key=lambda q: int(q["n"]))

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


def team_html(team, emph, cut, compact=False):
    T = items[team]
    name = {"G": "Other Team G work", "V": "Other Team V work"}[team]
    out = [f'<h2 style="border-left-color:{"#f0d900" if emph else "#43515b"}">{name}</h2><div class="card">']
    lines = []
    if T["fix"]:
        lines.append('<span class="k">Fixing now</span>')
        lines += [item_html(x, cut) for x in T["fix"]]
    if (T["next"] or T["later"]) and compact:  # tight on space: the jobs card comes first, so other work is listed by id
        lines.append('<span class="k">Up next</span> ' + ", ".join(e(str(x["id"])) for x in T["next"] + T["later"]))
    elif T["next"] or T["later"]:
        lines.append('<span class="k">Up next</span>')
        lines += [item_html(x, cut) for x in T["next"]]
        lines += [item_html(dict(x, state="queued" + (f' · after {re.sub(r"^after ", "", x["waits"])[:30]}' if x.get("waits") else "")), cut) for x in T["later"]]
    if not lines:
        lines.append('<span class="m">Nothing open for this team.</span>')
    return "".join(out) + "<br>".join(lines) + "</div>"


def render(first, compact=False):
    cut = 40 if compact else 70
    n_run, n_next, n_nik = len(Q["run"]), len(Q["next"]), len([x for x in nik if not x.get("md")])
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
         f'<div class="tiles"><div class="tile"><b>{e((LV or {}).get("revision", "?").split("-")[-1])}</b><span>Live</span></div><div class="tile"><b>{n_run}</b><span>Jobs running</span></div><div class="tile"><b>{n_next}</b><span>Jobs to start</span></div><div class="tile"><b>{n_nik}</b><span>Other asks</span></div></div>']
    H.append("<h2>Jobs</h2>")
    J = []
    if Q["run"]:
        J.append('<span class="k">Running now</span>')
        J += [item_html(dict(q, id=q["n"], state=short_state(q.get("state", "")) or "running"), cut) for q in Q["run"]]
    if Q["next"]:
        J.append('<span class="k">Next for you, in this order</span>')
        J += [f'{sq(q["lane"])} <b>{e(q["n"])}</b> {e(q["title"][:cut])}<br>&nbsp;&nbsp;&nbsp;→ ' + (e(q["where"]) if re.search(r"\btype\b", q["where"] or "", re.I) else f'type <b>{e(q["type"])}</b> {e(q["where"] or "(place not given)")}') + '' + (f' <span class="m">· {e(q["note"])}</span>' if q.get("note") else "") for q in Q["next"]]
    if Q["wait"]:
        J.append('<span class="k">Waiting on something else</span>')
        J += [f'{sq(q["lane"])} <b>{e(q["n"])}</b> {e(q["title"][:cut])} <span class="m">{e(q.get("after", "")[:56])}</span>' for q in Q["wait"]]
    if Q["release"]:
        J.append('<span class="k">Done, in the next release</span> ' + ", ".join(e(q["n"]) for q in Q["release"]))
    H.append('<div class="card move">' + ("<br>".join(J) or "No numbered job is open.") + "</div>")
    order = ("G", "V") if first == "G" else ("V", "G")
    H.append("<h2>Goals for Thursday</h2>")
    H.append('<div class="card">' + "<br>".join(("🐞 " if t == "G" else "🎨 ") + (f"<b>{e(GOAL[t])}</b>" if t == first else e(GOAL[t])) for t in order) + "</div>")
    if nik:
        H.append("<h2>Other asks</h2>")
        H.append('<div class="card">' + "<br>".join((md(x["decision"]) if x.get("md") else f'<b>{e(x["id"])}</b> {e(x["decision"])}') for x in nik) + "</div>")
    GF = ETA.gaffer()
    if GF and not GF.get("stale"):
        H.append(f'<div class="card">{GF["emoji"]} <b>Gaffer: {GF["pct"]} % of 5-hour usage</b> <span class="m">{e(GF.get("mood", ""))} · updated {e(GF.get("updated_boston", ""))}</span>' + (f'<br><span class="m">{e(str(GF.get("last_decision", ""))[:110])}</span>' if not compact else "") + "</div>")
    elif GF:
        _a = GF.get("age_min")
        H.append(f'<div class="card m">Gaffer: no report for {f"{round(_a / 60)} h" if isinstance(_a, (int, float)) and _a >= 90 else f"{_a or chr(63)} min"}.</div>')
    H.append(f'<div class="card">{TF.PHYSIO_ICON.get(ph.get("state"), "🩺")} <b>{e(ph.get("line", "Physio: no report yet."))}</b>' + (f'<br><span class="m">{e(ph["gate"])}</span>' if ph.get("gate") else "") + "</div>")
    if warn:
        H.append('<div class="card warn">⚠ <b>Not fully current:</b> ' + " ".join(e(w) for w in warn) + "</div>")
    for t in (first, "V" if first == "G" else "G"):
        H.append(team_html(t, t == first, cut, compact))
    H.append("<h2>Live now</h2>")
    if LV:
        H.append(f'<div class="card">🌐 <b>{e(LV["revision"])}</b> <span class="m">main <code>{e(LV["sha"])}</code> · {e(TF.bos(LV["when"]))}</span><br>{e(LV["subject"][:90])}'
                 + "".join(f'<br>✅ <span class="m">{e(TF.bos(x["merged"], "%-I:%M %p"))}</span> #{x["pr"]} {e(x["title"][:cut])}' for x in (LV.get("today") or [])[:2 if compact else 4]) + "</div>")
    TK = TWO.get("tickets") or []
    open_tk = [x for x in TK if x["stage"] != "DONE"]
    H.append("<h2>Relay</h2>")
    H.append('<div class="card">' + ("✅ working" if TWO.get("relay_ok") else "⚠ unreadable") + f' <span class="m">{len(open_tk)} open hand-offs, {len(TK) - len(open_tk)} done</span>'
             + "".join(f'<br><b>{e(x["id"])}</b> {e(x.get("from") or "?")}→{e(x.get("to") or "?")} {e(x["title"][:cut])} <span class="m">{e(TF.STAGE_WORD.get(x["stage"], x["stage"]))}</span>' for x in open_tk[::-1][:3]) + "</div>")
    H.append(("" if compact else '<div class="m foot">Lanes: ' + " · ".join(f'<i class="q{QI[l]}">■</i> {l}' for l in HEX) + "</div>") + "</div>")
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
      "## Jobs", ""]
if Q["run"]:
    L += ["**Running now**", ""] + [f"- **{q['n']}** {q['title']} · {short_state(q.get('state', '')) or 'running'}" + (f" · {q['progress'][0]['pct']:.4f} %" if q.get("progress") else f" · {q['pct']:.0f} %" if q.get("pct") is not None else "") for q in Q["run"]] + [""]
if Q["next"]:
    L += ["**Next for you, in this order**", ""] + [f"{i}. **{q['n']}** {q['title']}: " + (q['where'] if re.search(r"\btype\b", q['where'] or "", re.I) else f"type **{q['type']}** {q['where'] or '(place not given)'}") + (f" · {q['note']}" if q.get("note") else "") for i, q in enumerate(Q["next"], 1)] + [""]
if Q["wait"]:
    L += ["**Waiting on something else**", ""] + [f"- **{q['n']}** {q['title']} · {q.get('after', '')}" for q in Q["wait"]] + [""]
if Q["release"]:
    L += ["**Done, in the next release:** " + ", ".join(q["n"] for q in Q["release"]), ""]
L += ["## Goals for Thursday", "", f"- 🐞 {GOAL['G']}", f"- 🎨 {GOAL['V']}", ""]
L += ["## Other asks", ""]
L += [f"- {x['decision']}" if x.get("md") else f"- **{x['id']}** {x['decision']}" for x in nik] or ["- Nothing else needs you right now."]
for t in ("G", "V"):
    T = items[t]
    L += ["", f"## Other Team {t} work", ""]
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
