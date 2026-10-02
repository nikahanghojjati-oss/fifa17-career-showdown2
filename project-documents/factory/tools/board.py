#!/usr/bin/env python3
"""Rebuild BOARD.md from BOARD.json and status/JOB-NNN.md. Run from the repo root:
    python3 project-documents/factory/tools/board.py
Prints the jobs that can start now."""
import json, os, re

F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
board = json.load(open(os.path.join(F, "BOARD.json")))
jobs = board["jobs"]

def read_status(n):
    p = os.path.join(F, "status", f"JOB-{n:03d}.md")
    txt = open(p).read() if os.path.exists(p) else ""
    st = re.search(r"^State:\s*(.+)$", txt, re.M)
    sp = re.search(r"^Step:\s*(\d+)\s*of\s*(\d+)", txt, re.M)
    state = st.group(1).strip() if st else "NOT STARTED"
    k, total = (int(sp.group(1)), int(sp.group(2))) if sp else (0, 1)
    return state, k, total

info = {j["number"]: read_status(j["number"]) for j in jobs}
FINISHED = ("DONE", "SKIPPED")

def pct(n):
    state, k, total = info[n]
    return 100 if state in FINISHED else int(100 * k / max(total, 1))

def bar(p):
    full = p // 10
    return "█" * full + "░" * (10 - full)

def ready(j):
    state = info[j["number"]][0]
    return state == "NOT STARTED" and all(info[d][0] in FINISHED for d in j["depends_on"])

# Lane "team-g" lines only track Team G's jobs (G2V-001R2); they are not Team V work and are not counted.
tracked = [j for j in jobs if j.get("lane") == "team-g"]
vjobs = [j for j in jobs if j.get("lane") != "team-g"]
done = sum(1 for j in vjobs if info[j["number"]][0] in FINISHED)
overall = sum(pct(j["number"]) for j in vjobs) // len(vjobs)
ready_all = [j for j in jobs if ready(j)]
# Capacity (Nik, 2026-10-02 07:31): plain GPT-5.6 Sol chats are unlimited in number but Nik runs about 5 at once,
# at most 2 of them image jobs; Sol Work mode has a couple of workers. Jobs already IN PROGRESS count against the limits.
MAX_CHATS, MAX_IMAGE, MAX_WORK = 5, 2, 2
busy = [j for j in jobs if info[j["number"]][0].startswith("IN PROGRESS")]
# Image jobs (lane IMG) run from tickets in a plain new ChatGPT chat outside the project (Nik, 2026-10-02 14:53);
# one can start only once Claude has written its ticket in tickets/.
IMG = "fresh chat (image)"
TICKETS = os.listdir(os.path.join(F, "tickets")) if os.path.isdir(os.path.join(F, "tickets")) else []
has_ticket = lambda n: any(f.startswith(f"TICKET-{n:03d}_") for f in TICKETS)
slots = max(0, MAX_CHATS - sum(1 for j in busy if j.get("lane") not in ("work", "codex", IMG)))
img_slots = max(0, MAX_IMAGE - sum(1 for j in busy if j.get("lane") == IMG))
work_slots = max(0, MAX_WORK - sum(1 for j in busy if j.get("lane") == "work"))
startable, later, work_now, img_now, img_later, img_noticket = [], [], [], [], [], []
for j in ready_all:
    if j.get("lane") == IMG:
        if not has_ticket(j["number"]):
            img_noticket.append(j["number"])
        elif img_slots > 0:
            img_now.append(j["number"]); img_slots -= 1
        else:
            img_later.append(j["number"])
    elif j.get("lane") == "work":
        (work_now if len(work_now) < work_slots else later).append(j["number"])
    elif j.get("lane") == "codex":
        startable.append(j["number"])
    elif len(startable) < slots:
        startable.append(j["number"])
    else:
        later.append(j["number"])
working = [j["number"] for j in jobs if info[j["number"]][0].startswith("IN PROGRESS")]
blocked = [j["number"] for j in jobs if info[j["number"]][0].startswith("BLOCKED")]
waiting = [j for j in jobs if info[j["number"]][0].startswith("WAITING ON NIK")]
team_g = [j for j in vjobs if info[j["number"]][0].startswith("WAITING ON TEAM G")]

L = ["# Showdown Factory board", "",
     f"Branch `{board['branch']}`. {len(vjobs)} Team V jobs, plus {len(tracked)} lines that track Team G. Two kinds of job. **Project (type number):** open a new chat in the ChatGPT project \"Showdown visual\" and type the number (up to 5 at once). **Fresh chat (image):** run the job's ticket from [tickets/](tickets/README.md) in a plain new ChatGPT chat OUTSIDE any project, then drop the image in Claude's factory thread (up to 2 at once).", "",
     f"**Overall (Team V):** {bar(overall)} {overall} % · {done} of {len(vjobs)} jobs done", "",
     f"**Start now · project (type the number in Showdown visual):** {', '.join(map(str, startable)) or 'nothing (all slots busy or nothing ready)'}" + (f" · queued next: {', '.join(map(str, later))}" if later else ""), "",
     f"**Start now · fresh chat (image ticket, outside the project):** {', '.join(map(str, img_now)) or '-'}" + (f" · queued next: {', '.join(map(str, img_later))}" if img_later else "") + (f" · waiting for Claude to write the ticket: {', '.join(map(str, img_noticket))}" if img_noticket else ""), "",
     f"**Start now (Sol Work mode, press Use Work):** {', '.join(map(str, work_now)) or '-'}", "",
     f"**Working:** {', '.join(map(str, working)) or '-'} · **Blocked:** {', '.join(map(str, blocked)) or '-'}", ""]
if waiting:
    L += ["**Waiting on Nik:**", ""] + [f"- Job {j['number']} ({j['title']}): {j['waits_on_nik']}" for j in waiting] + [""]
if team_g:
    L += ["**Waiting on Team G (gameplay):** " + ", ".join(str(j["number"]) for j in team_g) + ". Do not start these; Claude clears them when Team G delivers.", ""]
if tracked:
    L += ["**Team G tracking (never start these):** " + ", ".join(f"{j['number']} ({'done' if info[j['number']][0] in FINISHED else 'open'})" for j in tracked) + ". Claude marks them done when Team G delivers.", ""]
L += ["| # | Job | Phase | Type | Lane | Depends on | Progress | State | Claude look |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
for j in jobs:
    n = j["number"]
    state, k, total = info[n]
    L.append(f"| {n} | [{j['title']}](jobs/JOB-{n:03d}.md) | {j['phase']} | {j['type']} | {j.get('lane', '')} | {', '.join(map(str, j['depends_on'])) or '-'} | {bar(pct(n))} {pct(n)} % | {state} | {'yes' if j['needs_claude_look'] else ''} |")
L += ["", "Lanes: **project (type number)** = a GPT-5.6 Sol chat inside the ChatGPT project Showdown visual, started by typing the number; **fresh chat (image)** = Nik runs the job's ticket(s) in a plain new ChatGPT chat outside any project and drops each image in Claude's factory thread, then Claude checks, commits and finishes the job (max 2 at once); **codex** = Codex review (job 108 only); **team-g** = tracks a Team G job, never started by Team V.", "", "Generated by `project-documents/factory/tools/board.py` from `BOARD.json`, `status/` and `tickets/`. Workers never edit this file; Claude regenerates it."]
open(os.path.join(F, "BOARD.md"), "w").write("\n".join(L) + "\n")
print("project:", startable, "fresh-chat images:", img_now, "no ticket yet:", img_noticket, "queued:", later + img_later)
print("overall:", overall, "%", done, "done")
