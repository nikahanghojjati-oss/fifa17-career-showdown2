#!/usr/bin/env python3
"""Rebuild BOARD.md from BOARD.json and status/JOB-NN.md. Run from the repo root:
    python3 project-documents/gameplay-factory/tools/board.py
Prints what can start now in each lane.
On GitHub, .github/workflows/gameplay-factory-board.yml runs this on every job move."""
import json, os, re, datetime
from zoneinfo import ZoneInfo


def boston_now():
    """Nik reads the board in Boston time (US Eastern, EDT/EST)."""
    t = datetime.datetime.now(ZoneInfo("America/New_York"))
    return f"{t:%Y-%m-%d %-I:%M %p} Boston time ({t:%Z})"

def relay_status():
    """Team V relay (branch leads/relay, FEED.md): latest G2V and V2G messages, times in Boston time."""
    import subprocess
    ref = "refs/remotes/origin/leads/relay"
    subprocess.run(["git", "fetch", "-q", "origin", f"+refs/heads/leads/relay:{ref}"], capture_output=True)
    r = subprocess.run(["git", "show", f"{ref}:project-documents/leads-relay/FEED.md"], capture_output=True, text=True)
    if r.returncode != 0:
        return None
    rows = []
    for line in r.stdout.splitlines():
        c = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(c) == 6 and re.match(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}$", c[0]):
            rows.append(dict(zip(["time", "from", "to", "id", "subject", "reply"], c)))
    if not rows:
        return None
    def boston(t):
        u = datetime.datetime.strptime(t, "%Y-%m-%d %H:%M").replace(tzinfo=datetime.timezone.utc)
        b = u.astimezone(ZoneInfo("America/New_York"))
        return f"{b:%a %-d %b %-I:%M %p}"
    last = {k: next((x for x in reversed(rows) if x["id"].startswith(k)), None) for k in ("G2V", "V2G")}
    top = rows[-1]
    waiting = None if top["reply"].lower().startswith("no") else f"{top['to']} ({top['id']}: reply {top['reply']})"
    return {"live": True, "count": len(rows),
            "g2v": last["G2V"] and dict(last["G2V"], boston=boston(last["G2V"]["time"])),
            "v2g": last["V2G"] and dict(last["V2G"], boston=boston(last["V2G"]["time"])),
            "waiting": waiting}


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

L = ["# Team G gameplay factory board", ""]
if starter:
    L += ["**Sol Work mode starter line.** Copy it, change both `NN` to the job number, and paste it as the first message:", "",
          "```", starter, "```", ""]
L += [
     f"Branch `{board['branch']}` · code PRs into `{board['integration_branch']}` · generated {boston_now()}", "",
     f"**Overall:** {bar(overall)} {overall} % · {done} of {len(jobs)} jobs done", "",
     f"**Start now in a normal chat (press Stay in Chat):** {names(start['chat'])}", "",
     f"**Start now in Sol Work mode (press Use Work, paste the starter line from RULES.md):** {names(start['work'])}", ""]
if queued:
    L += [f"**Ready but no free slot yet:** {names(queued)}", ""]
L += [f"**Working:** {names(working)} · **Blocked:** {names(blocked)}", ""]
if waiting:
    L += ["**Waiting:** " + "; ".join(f"{j['number']} ({info[j['number']][0].lower()})" for j in waiting), ""]
relay = relay_status()
if relay:
    L += ["## Team V relay", "",
          f"**Live** on branch `leads/relay` ({relay['count']} messages, [feed](https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/leads/relay/project-documents/leads-relay/FEED.md)).", ""]
    for k, who in (("g2v", "Latest from Team G"), ("v2g", "Latest from Team V")):
        m = relay[k]
        if m:
            L.append(f"- {who}: **{m['id']}** · {m['boston']} Boston time · {m['subject']}")
    L += ["", f"Waiting on: {relay['waiting'] or 'nobody (no reply owed)'}", "", "## Jobs", ""]
L += ["| # | G id | Job | Phase | Type | Lane | Depends on | Codex | Progress | State |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
for j in jobs:
    n = j["number"]
    title = f"[{j['title']}](jobs/JOB-{n:02d}.md)" if j.get("written") else j["title"]
    dep = names(j["depends_on"]) + (f"; {j['waits_on']}" if j.get("waits_on") else "")
    L.append(f"| {n} | {j['key']} | {title} | {j.get('phase', '')} | {j.get('type', '')} | {j['lane']} | {dep} | {'yes' if j['codex_review'] else ''} | {bar(pct(n))} {pct(n)} % | {info[n][0]} |")
L += ["", "Lanes: **chat** = normal GPT-5.6 Sol chat (text and PRs only: no npm, no screenshots); **work** = Sol Work mode (terminal and npm; emulator proofs run on GitHub CI); **nik** = Nik on his real devices. NOT WRITTEN = the lead has not written the job file yet; never start it.",
      "", f"Capacity: {cap.get('chat')} normal chats and {cap.get('work')} Work-mode chat at once for Team G.",
      "", "This page rebuilds itself on GitHub every time a job moves (workflow `gameplay-factory-board.yml`), so it is always current. Generated by `project-documents/gameplay-factory/tools/board.py` from `BOARD.json` and `status/`. Workers never edit this file."]
open(os.path.join(F, "BOARD.md"), "w").write("\n".join(L) + "\n")
# Machine-readable snapshot for the board page (tools/board_page.py).
state = {"generated": boston_now(), "relay": relay, "branch": board["branch"],
         "integration_branch": board["integration_branch"], "capacity": cap, "overall": overall, "done": done,
         "total": len(jobs), "start": start, "queued": queued, "working": working, "blocked": blocked,
         "jobs": [dict(j, state=info[j["number"]][0], step=info[j["number"]][1], steps_total=info[j["number"]][2],
                       pct=pct(j["number"]), ready=ready(j)) for j in jobs]}
json.dump(state, open(os.path.join(F, "BOARD_STATE.json"), "w"), indent=1, ensure_ascii=False)
print("start chat:", start["chat"], "start work:", start["work"], "queued:", queued, "overall:", overall, "%")
