#!/usr/bin/env python3
"""Rebuild BOARD.md from BOARD.json and status/JOB-NN.md. Run from the repo root:
    python3 project-documents/gameplay-factory/tools/board.py
Prints what can start now in each lane.
On GitHub, .github/workflows/gameplay-factory-board.yml runs this on every job move."""
import json, os, re, sys, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zoneinfo import ZoneInfo
import eta as ETA


def boston_now():
    """Nik reads the board in Boston time (US Eastern, EDT/EST)."""
    t = datetime.datetime.now(ZoneInfo("America/New_York"))
    return f"{t:%Y-%m-%d %-I:%M %p} Boston time ({t:%Z})"

def boston_from_utc(t, fmt="%a %-d %b %-I:%M %p"):
    u = datetime.datetime.strptime(t, "%Y-%m-%d %H:%M").replace(tzinfo=datetime.timezone.utc)
    return f"{u.astimezone(ZoneInfo('America/New_York')):{fmt}}"


def relay_status():
    """Team V relay (branch leads/relay, FEED.md): every message, who owes whom a reply, and proof of the sync
    (head commit of leads/relay and the id in LATEST.md). Times in Boston time."""
    import subprocess
    ref = "refs/remotes/origin/leads/relay"
    subprocess.run(["git", "fetch", "-q", "origin", f"+refs/heads/leads/relay:{ref}"], capture_output=True)
    def show(path):
        r = subprocess.run(["git", "show", f"{ref}:project-documents/leads-relay/{path}"], capture_output=True, text=True)
        return r.stdout if r.returncode == 0 else None
    feed = show("FEED.md")
    if feed is None:
        return None
    rows = []
    for line in feed.splitlines():
        c = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(c) == 6 and re.match(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}$", c[0]):
            rows.append(dict(zip(["time", "from", "to", "id", "subject", "reply"], c), boston=boston_from_utc(c[0])))
    if not rows:
        return None
    head = subprocess.run(["git", "log", "-1", "--format=%h|%ct", ref], capture_output=True, text=True).stdout.strip().split("|")
    head_time = datetime.datetime.fromtimestamp(int(head[1]), datetime.timezone.utc).astimezone(ZoneInfo("America/New_York"))
    latest = re.search(r"^Message-ID:\s*(\S+)", show("LATEST.md") or "", re.M)
    latest_id = latest.group(1).split("_")[0] if latest else None
    last = {k: next((x for x in reversed(rows) if x["id"].startswith(k)), None) for k in ("G2V", "V2G")}
    # Messages still open: everything a team sent after the other team's last message that asks for a reply.
    def open_after(sender, other):
        idx = max([i for i, x in enumerate(rows) if x["id"].startswith(other)] or [-1])
        return [x for x in rows[idx + 1:] if x["id"].startswith(sender) and not x["reply"].lower().startswith("no")]
    return {"live": True, "count": len(rows), "rows": rows,
            "g2v": last["G2V"], "v2g": last["V2G"],
            "head": head[0], "head_boston": f"{head_time:%a %-d %b %-I:%M %p}",
            "latest_id": latest_id, "feed_matches_latest": latest_id == rows[-1]["id"],
            "open_for_g": open_after("V2G", "G2V"), "open_for_v": open_after("G2V", "V2G")}


F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
board = json.load(open(os.path.join(F, "BOARD.json")))
jobs = board["jobs"]
by_num = {j["number"]: j for j in jobs}
FINISHED = ("DONE", "SKIPPED", "MERGED")


def read_status(j):
    p = os.path.join(F, "status", f"JOB-{j['number']:02d}.md")
    if not j.get("written") or not os.path.exists(p):
        return "NOT WRITTEN", 0, j.get("steps") or 1
    txt = open(p).read()
    st = re.search(r"^State:\s*(.+)$", txt, re.M)
    sp = re.search(r"^Step:\s*(\d+)\s*of\s*(\d+)", txt, re.M)
    state = st.group(1).strip().upper() if st else "NOT STARTED"
    if state == "READY":
        state = "NOT STARTED"
    k, total = (int(sp.group(1)), int(sp.group(2))) if sp else (0, j.get("steps") or 1)
    return state, k, total


# GitHub is the truth: a job whose PR is merged is MERGED whatever the status file says; a stale status file gets a flag, not its old text.
try:
    LIVE = {int(k): v for k, v in json.load(open(os.path.join(F, "progress", "prs.json"))).items()}
except Exception:
    LIVE = {}
stale = {}


def read_status_live(j):
    state, k, total = read_status(j)
    lv = LIVE.get(j["number"])
    if lv and lv["state"] == "merged":
        return "MERGED", total, total  # GitHub wins; an old status file on a merged job is history, not a warning
    if j.get("phase") in FINISHED:  # the lead closed it in BOARD.json (for example a job superseded by a later plan)
        return j["phase"], total, total
    if lv and state in ("NOT WRITTEN", "NOT STARTED"):
        stale[j["number"]] = f"status file says {state.lower()}, but PR #{lv['pr']} is {lv['state']}"
        return "IN PROGRESS", k, total
    return state, k, total


info = {j["number"]: read_status_live(j) for j in jobs}


def pct(n):
    state, k, total = info[n]
    return 100 if state in FINISHED else int(100 * k / max(total, 1))


def bar(p):
    return "█" * (p // 10) + "░" * (10 - p // 10)


def ready(j):
    return info[j["number"]][0] == "NOT STARTED" and all(info[d][0] in FINISHED for d in j["depends_on"])


cap = board.get("capacity", {"chat": 2, "work": 1})
busy = [j for j in jobs if info[j["number"]][0].startswith("IN PROGRESS")]
free = {lane: max(0, cap.get(lane, 0) - sum(1 for j in busy if j["lane"] == lane)) for lane in ("chat", "work")}
start = {"chat": [], "work": []}
queued = []
for j in jobs:
    if not ready(j) or j["lane"] not in start:
        continue
    if len(start[j["lane"]]) < free[j["lane"]]:
        start[j["lane"]].append(j["number"])
    else:
        queued.append(j["number"])

worker_jobs = [j for j in jobs if j["lane"] in ("chat", "work")]
done = sum(1 for j in jobs if info[j["number"]][0] in FINISHED)
overall = sum(pct(j["number"]) for j in jobs) // len(jobs)
names = lambda xs: ", ".join(map(str, xs)) or "-"
working = [j["number"] for j in busy]
blocked = [j["number"] for j in jobs if info[j["number"]][0].startswith("BLOCKED")]
waiting = [j for j in jobs if info[j["number"]][0].startswith("WAITING")]

_rules = open(os.path.join(F, "RULES.md")).read()
_m = re.search(r"## Starter line for Sol Work mode chats.*?```\n(.*?)\n```", _rules, re.S)
starter = _m.group(1).strip().replace("job 90", "job NN") if _m else ""

REPO = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2"
bug_hunt = board.get("bug_hunt", [])
relay = relay_status()
open_jobs = [j for j in jobs if info[j["number"]][0] not in FINISHED]
lead_jobs = [j for j in open_jobs if j["lane"] == "lead" and info[j["number"]][0] != "NOT WRITTEN"]
bh_open = [b for b in bug_hunt if not b["status"].upper().startswith("DONE")]
bh_nik = [b for b in bh_open if b.get("needs_nik")]
short = lambda t, n=120: t if len(t) <= n else t[: n - 1].rstrip() + "…"


def job_ref(j):
    return f"{j['key']} {j['title']}"


# ---- What Nik reads: what is live, what is moving, what is next, what waits on him. Finished work is folded away.
import two_factories as TF
from factory_common import running_jobs, LANES, ALL_LANES, lane_of, pitch

FAC = board.get("factories", {})
TWO = {"live": TF.live(), "v": TF.v_factory(), "relay": TF.relay(), "physio": TF.physio()}
R2, lv, V = TWO["relay"], TWO["live"], TWO["v"]
# A hand-off linked to a job PR ("job": "V-012" or a Team G job number) takes its progress from that PR's progress block.
_jobs = {str(n): (r, k, t) for n, r, k, t in V["jobs"]} | {str(n): (r, k, t) for n, r, k, t in running_jobs()}
for _t in (R2["tickets"] if R2 else []):
    _j = _jobs.get(str(_t.get("job", "")))
    if _j and _t["stage"] in ("RECEIVED", "WORKING", "DELIVERED", "SENT"):
        _t["stage"], _t["pct"], _t["overdue"] = "WORKING", 100.0 * _j[1] / max(_j[2], 1), False


def lane_tag(k):
    sq, name = ALL_LANES.get(k, ("⬛", k))
    return f"{sq} {name}"


def bucket(x):
    """One of: done, moving, nik, next, later. Read from the row's state and waits_on, written by the lead."""
    s, w = str(x.get("state", "")).lower(), str(x.get("waits_on") or "").lower()
    if s.startswith(("done", "live")):
        return "done"
    if s.startswith(("with worker", "worker done", "verifying", "verified", "in release")):  # bug list factory states
        return "moving"
    if any(k in s for k in ("building", "in progress", "in review", "checks", "gates", "running", "with the lead", "in r6")):
        return "moving"
    if x.get("lane") == "nik" or "needs nik" in s or "waiting on nik" in s or w.startswith("nik"):
        return "nik"
    if s.startswith(("next", "ready")) and not w.startswith("after"):
        return "next"
    return "later"


ROWS = {"G": FAC.get("G", {}).get("future", []), "V": FAC.get("V", {}).get("future", [])}
B = {k: {b: [x for x in rows if bucket(x) == b] for b in ("done", "moving", "nik", "next", "later")} for k, rows in ROWS.items()}
open_tickets = [t for t in (R2["tickets"] if R2 else []) if t["stage"] != "DONE"]
v_running = [(n, r, k, t) for n, r, k, t in V["jobs"] if k < t]
v_done = [(n, r, k, t) for n, r, k, t in V["jobs"] if k >= t]
g_running = running_jobs()
fixes = lv["fixes"] if lv else []


def gate_words(g):
    if not g:
        return "checks unknown"
    parts = [f"{g['passed']} passed"] + [f"{g[k]} {k}" for k in ("running", "failed", "cancelled") if g[k]]
    icon = "🔴" if g["failed"] else "🟠" if g["cancelled"] else "⏳" if g["running"] else "🟢"
    return f"{icon} " + ", ".join(parts)


n_moving = len(fixes) + len(B["G"]["moving"]) + len(B["V"]["moving"]) + len(v_running) + len(g_running) + len(open_tickets)
n_next = len(B["G"]["next"]) + len(B["V"]["next"])
n_nik = len(B["G"]["nik"]) + len(B["V"]["nik"])
n_later = len(B["G"]["later"]) + len(B["V"]["later"])

move = list(board.get("next_move") or []) or ["**Nothing for you to do right now.**"]
L = ["# Showdown board: G Factory and V Factory", "",
     (f"🌐 **Live: runtime {lv['revision']}** (main `{lv['sha']}`) · " if lv else "🌐 Live version unknown this run · ") +
     f"🔄 **{n_moving} moving** · ⏭ {n_next} up next · 👤 {n_nik} waiting on Nik · 🗂 {n_later} later · updated {boston_now()}", "",
     f"{TF.PHYSIO_ICON.get(TWO['physio']['state'], '🩺')} **{TWO['physio']['line']}**" + (f" · {TWO['physio']['gate']}" if TWO['physio'].get('gate') else ""), "",
     "## Your next move", ""] + [f"{i}. {m}" for i, m in enumerate(move, 1)] + [""]

# ---- Moving now: open releases into main with their checks, jobs being built, hand-offs not yet done.
L += ["## 🔄 Moving now", ""]
if fixes:
    L += ["| Release / fix | Checks on the latest commit | Updated |", "| --- | --- | --- |"]
    for x in fixes:
        L.append(f"| [PR #{x['pr']}]({REPO}/pull/{x['pr']}) {short(x['title'], 90)}{' (draft)' if x['draft'] else ''} | {gate_words(x.get('gates'))} | {TF.bos(x['updated'], '%-I:%M %p')} |")
    L.append("")
for n, r, k, t in g_running + v_running:
    sq, who = lane_of(r)
    pc = 100.0 * k / max(t, 1)
    left = [s_["name"] for s_ in r.get("steps", []) if not s_.get("done")]
    L += [f"**{sq} {n} · {r.get('title', '')}** · {pc:.0f} % ({k} of {t} steps) · {who}" + (f" · [PR #{r['pr']}]({REPO}/pull/{r['pr']})" if r.get("pr") else ""), "",
          f"{pitch(pc / 100, sq)}  ", f"> **Now:** {r.get('current') or 'not reported'}" + (f"  \n> **Left:** {' → '.join(left)}" if left else ""), ""]
moving_rows = [("G", x) for x in B["G"]["moving"]] + [("V", x) for x in B["V"]["moving"]]
if moving_rows:
    L += ["| Team | Job | What | Worker | Where it is | Details |", "| --- | --- | --- | --- | --- | --- |"]
    L += [f"| {f} | {x['id']} | {('🐞 ' + x['group'] + ': ') if x.get('group') else ''}{x['title']} | {lane_tag(x['lane'])} | {x['state']} | {x.get('details') or x.get('waits_on') or '-'} |" for f, x in moving_rows]
    L.append("")
if open_tickets:
    L += ["| Hand-off | From → To | What | Progress |", "| --- | --- | --- | --- |"]
    L += [f"| [{t['id']}]({REPO}/blob/leads/relay/{t['path']}) | {t.get('from', '?')} → {t.get('to', '?')} | {t['title']}{' ⚠ overdue' if t['overdue'] else ''} | {TF.pipeline(t)} |" for t in open_tickets]
    L.append("")
if not n_moving:
    L += ["Nothing is moving right now.", ""]

# ---- Each factory: up next, waiting on Nik, later. Done rows are folded into "Finished".
def factory(key, icon):
    f = FAC.get(key, {})
    workers = " · ".join(lane_tag(w["lane"]) for w in f.get("workers", []))
    out = [f"## {icon} {f.get('name', key)}", "", f"_{f.get('role', '')}._ Workers: {workers}", ""]
    groups = [None] + sorted({x["group"] for b in ("next", "nik", "later") for x in B[key][b] if x.get("group")})
    for g, (b, head) in [(g, bh) for g in groups for bh in (("next", "⏭ Up next"), ("nik", "👤 Waiting on Nik"), ("later", "🗂 Later"))]:
        rows = [x for x in B[key][b] if x.get("group") == g]
        if g and b == "next":
            out += [f"### 🐞 {g}", ""]
        if rows:
            out += [f"**{head}**", "", "| Job | What | Worker | State | Waits on |", "| --- | --- | --- | --- | --- |"]
            out += [f"| {x['id']} | {x['title']}{(' — ' + x['details']) if x.get('details') else ''} | {lane_tag(x['lane'])} | {x['state']} | {x.get('waits_on') or '-'} |" for x in rows]
            out.append("")
    if not any(B[key][b] for b in ("next", "nik", "later")):
        out += ["Nothing queued.", ""]
    return out


L += factory("G", "🟢")
L += factory("V", "🔵")

# ---- Relay, short: health and the latest messages. Every message in full lives in RELAY.md.
L += ["## 📡 Relay", ""]
if R2:
    ov = [t for t in R2["tickets"] if t["overdue"]]
    wake = ", ".join(f"Team {k} {'✅' if v else '⚠ not registered'}" for k, v in R2.get("inbox", {}).items())
    health = ("✅ working" if R2["comments_read"] and not ov else "⚠ " + (", ".join(t["id"] for t in ov) + f" not acknowledged after {TF.OVERDUE_H} h" if ov else "could not read the wake comments"))
    done_t = len(R2["tickets"]) - len(open_tickets)
    L += [f"**Health:** {health} · direct wake: {wake} · {len(R2['rows'])} messages · {len(open_tickets)} open hand-offs, {done_t} done · **[every message in full: RELAY.md](RELAY.md)**", ""]
    owed_g = [m["id"] for m in (relay or {}).get("open_for_g", []) if m["reply"].lower().startswith("yes")]
    owed_v = [m["id"] for m in (relay or {}).get("open_for_v", []) if m["reply"].lower().startswith("yes")]
    if owed_g or owed_v:
        L += [f"Replies owed: Team G {', '.join(owed_g) or 'none'} · Team V {', '.join(owed_v) or 'none'}.", ""]
    L.append("Latest:")
    L += [f"- {m['id']} · {boston_from_utc(m['time'])} · {m['from']} → {m['to']} · {short(m['subject'], 100)}" for m in R2["rows"][-3:][::-1]]
    L.append("")
else:
    L += ["Could not read the relay branch this run.", ""]

# ---- Finished, folded away.
fin = [("G", x) for x in B["G"]["done"]] + [("V", x) for x in B["V"]["done"]]
today = (lv or {}).get("today") or []
L += ["## ✅ Finished", ""]
if today:
    L += [f"**Shipped to the live game today ({len(today)}):** " + " · ".join(f"[#{x['pr']}]({REPO}/pull/{x['pr']}) {short(x['title'], 60)}" for x in today[:4]) + (f" · and {len(today) - 4} more" if len(today) > 4 else ""), ""]
L += ["<details>", f"<summary>Done jobs ({len(fin)} future-list rows, {len(v_done)} Team V jobs, {len(R2['tickets']) - len(open_tickets) if R2 else 0} hand-offs, {done} factory jobs)</summary>", ""]
L += [f"- {f} {x['id']}: {x['title']} ({x['state']})" for f, x in fin]
L += [f"- V {n}: {r.get('title', '')} ([PR #{r['pr']}]({REPO}/pull/{r['pr']}))" for n, r, k, t in v_done]
L += [f"- {t['id']} ({t.get('from')} → {t.get('to')}): {t['title']}" for t in (R2["tickets"] if R2 else []) if t["stage"] == "DONE"]
if bug_hunt:
    L += [f"- Bug hunt on r52: {sum(1 for b in bug_hunt if b['status'].upper().startswith('DONE'))} of {len(bug_hunt)} fixed ([report]({REPO}/blob/{board['branch']}/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md))"]
L += [f"- The first factory plan: {done} of {len(jobs)} jobs finished ([every job](BOARD_ARCHIVE.md))", "", "</details>", "",
      "<sub>Made by `tools/board.py` from `BOARD.json` (the lead's job list), PR progress blocks, open PRs into main and the relay. It rebuilds itself on GitHub; nobody edits it by hand.</sub>"]

_DETAIL = L  # the old detailed board lives in the archive now; BOARD.md is the one board (custom_view.py)

# ---- Archive: every job, full table
A = ["# Board archive", "", f"[Back to the board](BOARD.md) · generated {boston_now()}. Detail and history behind the one board.", "", "## Old detailed board", ""] + [re.sub(r"\(BOARD_ARCHIVE.md\)", "(#all-jobs)", x) for x in _DETAIL] + ["", "## All jobs", "",
     "| # | G id | Job | Phase | Type | Lane | Depends on | Codex | Progress | State |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
for j in jobs:
    n = j["number"]
    title = f"[{j['title']}](jobs/JOB-{n:02d}.md)" if j.get("written") else j["title"]
    dep = names(j["depends_on"]) + (f"; {j['waits_on']}" if j.get("waits_on") else "")
    A.append(f"| {n} | {j['key']} | {title} | {j.get('phase', '')} | {j.get('type', '')} | {j['lane']} | {dep} | {'yes' if j['codex_review'] else ''} | {bar(pct(n))} {pct(n)} % | {info[n][0]} |")
open(os.path.join(F, "BOARD_ARCHIVE.md"), "w").write("\n".join(A) + "\n")

# Machine-readable snapshot for the board page (tools/board_page.py).
if relay:  # keep the old one-line field for the board page
    relay["waiting"] = ", ".join(m["id"] for m in relay["open_for_v"]) or None
state = {"generated": boston_now(), "relay": relay, "two": {"live": TWO["live"], "physio": TWO["physio"], "v_headline": V["headline"], "v_jobs": [{"job": n, "title": r.get("title", ""), "worker": lane_of(r)[1], "lane": str(r.get("worker", "")).lower().replace(" ", "-"), "done": k, "total": t, "pr": r.get("pr"), "current": r.get("current", "")} for n, r, k, t in V["jobs"]],
         "inbox": R2.get("inbox") if R2 else None, "tickets": [{x: t.get(x) for x in ("id", "from", "to", "title", "stage", "pct", "overdue", "path", "worker", "pickup_min", "waiting_min")} for t in (R2["tickets"] if R2 else [])], "relay_ok": bool(R2 and R2["comments_read"])}, "branch": board["branch"],
         "integration_branch": board["integration_branch"], "capacity": cap, "overall": overall, "done": done,
         "total": len(jobs), "start": start, "queued": queued, "working": working, "blocked": blocked,
         "bug_hunt": bug_hunt, "next_move": move, "now": {"moving": n_moving, "next": n_next, "nik": n_nik, "later": n_later, "rows": {k: {b: v for b, v in d.items() if b != "done"} for k, d in B.items()}, "fixes": fixes},
         "jobs": [dict(j, state=info[j["number"]][0], stale=stale.get(j["number"]), step=info[j["number"]][1], steps_total=info[j["number"]][2],
                       pct=pct(j["number"]), ready=ready(j)) for j in jobs]}
json.dump(state, open(os.path.join(F, "BOARD_STATE.json"), "w"), indent=1, ensure_ascii=False)
print("start chat:", start["chat"], "start work:", start["work"], "queued:", queued, "overall:", overall, "%")
