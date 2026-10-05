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
FINISHED = ("DONE", "SKIPPED")


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


info = {j["number"]: read_status(j) for j in jobs}


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


# ---- Your next move: the first thing Nik reads. Plain, short, in priority order.
move = list(board.get("next_move") or [])  # the lead can set BOARD.json "next_move" for a real question waiting for Nik
if start["work"]:
    move.append(f"**Start job {names(start['work'])} in Sol Work mode.** Press Use Work, paste the starter line below, change both `NN`.")
if start["chat"]:
    move.append(f"**Start job {names(start['chat'])} in a normal Sol chat.** Press Stay in Chat.")
for b in bh_nik:
    move.append(f"**Decide bug hunt {b['id']}:** {b['needs_nik']}")
if relay and relay["open_for_g"]:
    owed = [m for m in relay["open_for_g"] if m["reply"].lower().startswith("yes")]
    if owed:
        move.append("**Team G lead owes Team V a reply:** " + ", ".join(m["id"] for m in owed) + " (no action for you).")
if not move:
    move.append("**Nothing for you to start right now.**")
who_busy = []
for j in lead_jobs:
    who_busy.append(f"{job_ref(j)}")
if working:
    who_busy.append("workers on jobs " + names(working))
for b in bug_hunt:
    if b["status"].upper().startswith("IN PROGRESS"):
        who_busy.append(f"bug hunt {b['id'].replace('BH-', '')} ({b.get('note') or b['title']})")
moving = "; ".join(who_busy) if who_busy else "no job is running right now"

L = ["# Team G gameplay board", "",
     f"{done} of {len(jobs)} jobs done ({overall} %) {bar(overall)} · branch `{board['branch']}` · code PRs into `{board['integration_branch']}` · generated {boston_now()}", "",
     "## Scoreboard", "",
     f"⚽ **{done} of {len(jobs)} jobs done** · {len(working)} in play · 🐞 see [BUG_BOARD.md](BUG_BOARD.md) · {ETA.whistle([ETA.describe(r) for _, r, _, _ in __import__('factory_common').running_jobs()])}", "",
     "## Your next move", ""]
_g = ETA.gaffer()
if _g:
    L[L.index("## Your next move"):L.index("## Your next move")] = [f"{_g['emoji']} **Gaffer ({_g.get('level_name', '')}, {_g.get('mood', '')})** · usage {_g['pct']} % of the 5-hour window · resets {_g.get('resets_at', '')[11:16]} UTC · last call: {_g.get('last_decision', '')} · [Gaffer page]({_g.get('page', '')})", ""]
L += [f"{n}. {m}" for n, m in enumerate(move, 1)]
nxt = next((j for j in open_jobs if j["lane"] != "lead"), None)
L += ["", f"_Moving now:_ {moving}." + (f" _Next up:_ {nxt['key']} {nxt['title']}, waits on {(nxt.get('waits_on') or ', '.join('job %d' % d for d in nxt['depends_on'] if info[d][0] not in FINISHED) or 'nothing')}." if nxt else ""), "",
      "**Sol Work mode starter line** (copy it, change both `NN` to the job number, paste it as the first message):", "", "```", starter, "```", ""]

from factory_common import running_jobs, LANES, lane_of, pitch

rj = running_jobs()
L += ["## Running now", "", "Bug hunting factory: [BUG_BOARD.md](BUG_BOARD.md).", ""]
if rj:
    L += ["Each bar is the share of the job done, to four decimals: finished steps weighted by how long that kind of step usually takes ([ETA_STUDY.md](ETA_STUDY.md)). Finish times are estimates with a likely range. Lanes: " +
          " · ".join(f"{sq} {name}" for sq, name in LANES.values()) + ".", ""]
    for n, r, k, t in rj:
        sq, who = lane_of(r)
        pc = 100 * k / max(t, 1)
        try:
            upd = boston_from_utc(r["updated"][:16].replace("T", " "))
        except Exception:
            upd = "unknown"
        left = [s_["name"] for s_ in r["steps"] if not s_.get("done")]
        d = ETA.describe(r)
        L += [f"### {sq} Job {n} · {r['title']}", "", f"{who} · {r.get('owner', '')}" + (f" · PR #{r['pr']}" if r.get("pr") else ""), "",
              f"{pitch(d['pct'] / 100, sq)} **{d['pct']:.4f} %** ({k} of {t} steps)", "",
              f"**Likely finish:** {d['eta']}", "",
              f"**Going on now:** {r.get('current', '')}", ""]
        if left:
            L += ["**Still to do:** " + " → ".join(left), ""]
        L += [f"_Updated {upd} Boston time_", ""]
    ids = {n for n, *_ in rj}
    missing = [f"job {j['number']}" for j in jobs if info[j["number"]][0] == "WORKING" and j["number"] not in ids]
    if missing:
        L += ["Not reported: " + ", ".join(missing) + ".", ""]
else:
    L += ["No job is reporting progress right now (jobs show here once their PR description carries a progress block).", ""]

# ---- Live fixes and bug hunt
L += ["## Live fixes and bug hunt", ""]
if bug_hunt:
    L += [f"From the read-only bug hunt on r52 (4 Oct; [report]({REPO}/blob/{board['branch']}/project-documents/gameplay-factory/reports/SONNET_BUG_HUNT_2026-10-04.md)). Most likely to hit a real game first.", "",
          "| # | Problem in plain words | How likely | Status | Who |", "| --- | --- | --- | --- | --- |"]
    for b in bug_hunt:
        L.append(f"| {b['id'].replace('BH-', '')} | **{b['title']}.** {b['plain']} | {b.get('likelihood', '')} | {b['status']}{(' · ' + b['note']) if b.get('note') else ''} | {b.get('owner', '')} |")
    if board.get("bug_hunt_extras"):
        L += ["", "Small extras (cheap, optional): " + "; ".join(board["bug_hunt_extras"]) + "."]
    L.append("")
if lead_jobs:
    L += ["Live fix jobs open: " + ", ".join(f"[{job_ref(j)}](jobs/JOB-{j['number']:02d}.md) ({info[j['number']][0].lower()})" for j in lead_jobs), ""]

# ---- Team V relay
L += ["## Team V relay", ""]
if relay:
    synced = "synced" if relay["feed_matches_latest"] else f"CHECK: feed ends at {relay['rows'][-1]['id']} but LATEST.md says {relay['latest_id']}"
    L += [f"{relay['count']} messages in the [feed]({REPO}/blob/leads/relay/project-documents/leads-relay/FEED.md) · relay branch head `{relay['head']}`, last push {relay['head_boston']} Boston time · {synced}.", ""]
    for k, who in (("g2v", "Latest from Team G"), ("v2g", "Latest from Team V")):
        m = relay[k]
        if m:
            L.append(f"- **{who}:** {m['id']} · {m['boston']} Boston time · {short(m['subject'])}")
    L.append("")
    if relay["open_for_g"]:
        L.append("**Open for the Team G lead to answer:**")
        for m in relay["open_for_g"]:
            kind = "reply owed" if m["reply"].lower().startswith("yes") else "reply only if: " + re.sub(r"^only if\s*", "", m["reply"])
            L.append(f"- {m['id']} · {m['boston']} · {short(m['subject'], 90)} ({kind})")
    else:
        L.append("**Open for the Team G lead to answer:** nothing.")
    L.append("")
    L.append("Waiting on Team V: " + (", ".join(m["id"] for m in relay["open_for_v"]) if relay["open_for_v"] else "nothing") + ".")
else:
    L.append("Could not read the relay branch this run. Do not trust the lines above about Team V.")
L.append("")

# ---- Jobs still open (short)
L += ["## Jobs still open", ""]
if open_jobs:
    L += ["| Job | What | Lane | Waits on | State |", "| --- | --- | --- | --- | --- |"]
    for j in open_jobs:
        n = j["number"]
        title = f"[{j['title']}](jobs/JOB-{n:02d}.md)" if j.get("written") else j["title"]
        dep = [f"job {d}" for d in j["depends_on"] if info[d][0] not in FINISHED]
        if j.get("waits_on"):
            dep.append(j["waits_on"])
        L.append(f"| {j['key']} | {title} | {j['lane']} | {', '.join(dep) or '-'} | {info[n][0]} |")
else:
    L.append("None. Every job is done.")
L.append("")

# ---- Finished work: collapsed, full table in BOARD_ARCHIVE.md
phases = {}
for j in jobs:
    p = phases.setdefault(j.get("phase", "?"), [0, 0])
    p[1] += 1
    p[0] += info[j["number"]][0] in FINISHED
L += ["<details>", f"<summary><b>Finished work: {done} jobs</b> (click to open)</summary>", ""]
L += [f"- {name}: {d} of {t} done" for name, (d, t) in sorted(phases.items()) if d]
L += ["", f"Full list of every job with its state: [BOARD_ARCHIVE.md](BOARD_ARCHIVE.md).", "", "</details>", "",
      f"Lanes: **chat** = normal Sol chat (text and PRs only); **work** = Sol Work mode (terminal and npm; emulator proofs run on CI); **lead** = the Team G lead does it; **nik** = Nik on his real devices. NOT WRITTEN = job file not written yet, never start it. Capacity: {cap.get('chat')} chats and {cap.get('work')} Work-mode chat at once.", "",
      "This page rebuilds itself on GitHub when a job moves or Team V posts to the relay (workflows `gameplay-factory-board.yml` and `leads-relay-ping.yml`). Made by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json`, `status/` and the relay feed. Workers never edit it."]
open(os.path.join(F, "BOARD.md"), "w").write("\n".join(L) + "\n")

# ---- Archive: every job, full table
A = ["# Team G gameplay board: all jobs", "", f"[Back to the board](BOARD.md) · generated {boston_now()}", "",
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
state = {"generated": boston_now(), "relay": relay, "branch": board["branch"],
         "integration_branch": board["integration_branch"], "capacity": cap, "overall": overall, "done": done,
         "total": len(jobs), "start": start, "queued": queued, "working": working, "blocked": blocked,
         "bug_hunt": bug_hunt, "next_move": move,
         "jobs": [dict(j, state=info[j["number"]][0], step=info[j["number"]][1], steps_total=info[j["number"]][2],
                       pct=pct(j["number"]), ready=ready(j)) for j in jobs]}
json.dump(state, open(os.path.join(F, "BOARD_STATE.json"), "w"), indent=1, ensure_ascii=False)
print("start chat:", start["chat"], "start work:", start["work"], "queued:", queued, "overall:", overall, "%")
