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
    ck = re.search(r"^Claude check:\s*(PASS|FIX)\b\s*([0-9]+(?:\.[0-9]+)?)?", txt, re.M)
    CHECK[n] = (ck.group(1), float(ck.group(2)) if ck.group(2) else None) if ck else None
    return state, k, total

# Quality gate (Nik, 2026-10-03): a job counts as done on the board only after Claude's intake check
# writes "Claude check: PASS <score>" into its status file. "Claude check: FIX" sends it back with a fix list
# (state "IN PROGRESS · FIX"); it then shows under Type next as "N (fix)". DONE jobs keep unblocking their
# dependents while they wait for the check, so work never stalls on Claude.
CHECK = {}
info = {j["number"]: read_status(j["number"]) for j in jobs}

# Early "Working" (Nik, 2026-10-04): a worker saves its status file only at the end of its turn, but it commits
# "Job N step k/n: ..." as each step lands. A NOT STARTED job with a step commit newer than its status file
# shows as IN PROGRESS at step k, so the board flips within a minute of the first saved step (no extra writes).
import subprocess as _sp
def _git(*a):
    try:
        return _sp.run(["git", *a], cwd=F, capture_output=True, text=True, timeout=20).stdout
    except Exception:
        return ""
for _line in _git("log", "-150", "--format=%ct\t%s").splitlines():
    _m = re.match(r"(\d+)\tJob (\d+) (?:step|fix) (\d+)\w*/(\d+)", _line)
    if not _m:
        continue
    _ts, _n, _k, _tot = int(_m.group(1)), int(_m.group(2)), int(_m.group(3)), int(_m.group(4))
    if _n not in info or info[_n][0] != "NOT STARTED":
        continue
    _st = _git("log", "-1", "--format=%ct", "--", f"status/JOB-{_n:03d}.md").strip()
    if _st and int(_st) >= _ts:
        continue
    info[_n] = ("IN PROGRESS", max(_k, 0), max(_tot, 1))
FINISHED = ("DONE", "SKIPPED")
passed = lambda n: info[n][0] == "SKIPPED" or (info[n][0] == "DONE" and CHECK.get(n) is not None and CHECK[n][0] == "PASS")

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
done = sum(1 for j in vjobs if passed(j["number"]))
awaiting = [j["number"] for j in vjobs if info[j["number"]][0] == "DONE" and not passed(j["number"])]
scored = [(j["number"], CHECK[j["number"]][1]) for j in vjobs if passed(j["number"]) and CHECK.get(j["number"]) and CHECK[j["number"]][1] is not None]
avg_score = round(sum(v for _, v in scored) / len(scored), 2) if scored else None
overall = sum(pct(j["number"]) for j in vjobs) // len(vjobs)
ready_all = [j for j in jobs if ready(j)]
# Capacity (Nik, 2026-10-02 07:31): plain GPT-5.6 Sol chats are unlimited in number but Nik runs about 5 at once,
# at most 2 of them image jobs; Sol Work mode has a couple of workers. Jobs already IN PROGRESS count against the limits.
MAX_CHATS, MAX_IMAGE, MAX_WORK = 5, 2, 2
# "IN PROGRESS · RESUME" = work started but no chat is on it now (Claude answered a block or ran a fix);
# Nik types the number in a new chat, which carries on from the status file. Listed first under Type next.
resume = lambda n: info[n][0].startswith("IN PROGRESS") and ("RESUME" in info[n][0].upper() or "FIX" in info[n][0].upper())
fixing = lambda n: info[n][0].startswith("IN PROGRESS") and "FIX" in info[n][0].upper()
busy = [j for j in jobs if info[j["number"]][0].startswith("IN PROGRESS") and not resume(j["number"])]
# Image jobs (lane IMG) run from tickets in a plain new ChatGPT chat outside the project (Nik, 2026-10-02 14:53);
# one can start only once Claude has written its ticket in tickets/.
IMG = "fresh chat (image)"
TICKETS = os.listdir(os.path.join(F, "tickets")) if os.path.isdir(os.path.join(F, "tickets")) else []
has_ticket = lambda n: any(f.startswith(f"TICKET-{n:03d}_") for f in TICKETS)
# Jobs reserved for an Astra bundle (State "IN PROGRESS · ASTRA") run in one Astra chat, not in Nik's GPT chats.
slots = max(0, MAX_CHATS - sum(1 for j in busy if j.get("lane") not in ("work", "codex", IMG) and "ASTRA" not in info[j["number"]][0].upper()))
img_slots = max(0, MAX_IMAGE - sum(1 for j in busy if j.get("lane") == IMG))
work_slots = max(0, MAX_WORK - sum(1 for j in busy if j.get("lane") == "work"))
startable, later, work_now, img_now, img_later, img_noticket = [], [], [], [], [], []
resumable = [j["number"] for j in jobs if resume(j["number"])]
slots = max(0, slots - len(resumable))
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
working = [j["number"] for j in busy]
blocked = [j["number"] for j in jobs if info[j["number"]][0].startswith("BLOCKED")]
waiting = [j for j in jobs if info[j["number"]][0].startswith("WAITING ON NIK")]
team_g = [j for j in vjobs if info[j["number"]][0].startswith("WAITING ON TEAM G")]

# ---- phone summary (Nik reads this on his iPhone; mirrors the Custom view) ----
import subprocess, datetime
try:
    from zoneinfo import ZoneInfo
    ET = ZoneInfo("America/New_York")
except Exception:
    ET = None
def eastern(ts):
    d = datetime.datetime.fromtimestamp(ts, ET) if ET else datetime.datetime.utcfromtimestamp(ts)
    h = d.hour % 12 or 12
    return f"{d:%a} {h}:{d:%M} {'a.m.' if d.hour < 12 else 'p.m.'}" + (" Eastern" if ET else " UTC")
def last_change():
    try:
        out = subprocess.run(["git", "log", "-1", "--format=%ct", "--", "status", "BOARD.json"], cwd=F, capture_output=True, text=True).stdout.strip()
        return int(out) if out else None
    except Exception:
        return None
def rng(a, b): return list(range(a, b + 1))
SCREENS = [("Home", rng(31, 36) + [111, 122]), ("League", rng(37, 42) + [112, 123]), ("Club", rng(43, 48) + [113]),
           ("Transfer", rng(49, 53) + [114]), ("Loading", [11] + rng(54, 56)), ("Trophy Room", [2, 23] + rng(57, 61) + [115, 130, 136]),
           ("Career Stats", [3, 24] + rng(62, 66) + [116, 131, 137]), ("Rivalry", [4, 25] + rng(67, 71) + [117, 135]),
           ("Legacy", [5, 26] + rng(72, 76) + [118, 132, 138]), ("Season Results", [6, 27] + rng(77, 81) + [119, 133]),
           ("Final Winner", [7] + rng(82, 86) + [134, 139]), ("Start/Join", [8, 28] + rng(87, 91) + [120]),
           ("Standings", rng(126, 129)), ("Rule Book", [9] + rng(92, 94)), ("Settings", [10] + rng(95, 97)),
           ("Setup", [0, 1]), ("Foundation", rng(12, 18)), ("Art", rng(19, 22) + [29, 30, 121, 124]), ("Top bar", [125]), ("Integration", rng(103, 110))]
# One-turn parts (CC-007, 2026-10-04): a job split into parts carries part_of = the original number in BOARD.json;
# every part counts under the same screen as its original, so new numbers never need adding here by hand.
for j in jobs:
    if j.get("part_of") is not None:
        for name, nums in SCREENS:
            if j["part_of"] in nums and j["number"] not in nums:
                nums.append(j["number"])
def feed_rows(n=3):
    path = os.environ.get("FEED_MD") or os.path.join(F, "..", "leads-relay", "FEED.md")
    if not os.path.exists(path):
        return []
    rows = [r for r in open(path).read().splitlines() if re.match(r"^\| 20\d\d-", r)]
    out = []
    for r in rows[-n:]:
        c = [x.strip() for x in r.strip("|").split("|")]
        try:
            t = datetime.datetime.strptime(c[0], "%Y-%m-%d %H:%M").replace(tzinfo=datetime.timezone.utc).timestamp()
            when = eastern(t)
        except Exception:
            when = c[0]
        out.append(f"- {when} · {c[1]} → {c[2]} · {c[3]}: {c[4]}")
    return out
def meter_svg(d, t, ov):
    """Static football meter: ball rolls along a pitch bar to done/total; works on light and dark pages."""
    W, x0, x1, y = 640, 40, 560, 78
    frac = d / max(t, 1)
    bx = x0 + (x1 - x0) * frac
    stripes = "".join(f'<rect x="{x0 + i * 52}" y="{y - 16}" width="26" height="32" fill="#000" opacity=".12"/>' for i in range(10))
    pent = "".join(f'<circle cx="{bx + dx}" cy="{y + dy}" r="3.2" fill="#111"/>' for dx, dy in ((0, 0), (0, -9), (8.5, -3), (5.3, 7), (-5.3, 7), (-8.5, -3)))
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="150" viewBox="0 0 {W} 150" role="img" aria-label="{d} of {t} jobs done and checked">
<rect width="{W}" height="150" rx="14" fill="#0e1218"/><rect x="1" y="1" width="{W - 2}" height="148" rx="13" fill="none" stroke="#c9a227" stroke-width="2"/>
<text x="24" y="32" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" fill="#e8c44a" letter-spacing="2">SHOWDOWN FACTORY</text>
<text x="{W - 24}" y="32" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" fill="#fff">{d} / {t} done and checked</text>
<clipPath id="c"><rect x="{x0}" y="{y - 16}" width="{x1 - x0}" height="32" rx="16"/></clipPath>
<rect x="{x0}" y="{y - 16}" width="{x1 - x0}" height="32" rx="16" fill="#143d22"/>
<g clip-path="url(#c)"><rect x="{x0}" y="{y - 16}" width="{bx - x0:.1f}" height="32" fill="#2e9e4f"/>{stripes}</g>
<rect x="{x0}" y="{y - 16}" width="{x1 - x0}" height="32" rx="16" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
<line x1="{(x0 + x1) // 2}" y1="{y - 16}" x2="{(x0 + x1) // 2}" y2="{y + 16}" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
<g stroke="#e8c44a" stroke-width="3" fill="none"><path d="M{x1 + 6} {y - 26}v52h22v-52z"/></g>
<path d="M{x1 + 6} {y - 26}l22 52M{x1 + 28} {y - 26}l-22 52" stroke="#e8c44a" stroke-opacity=".35" stroke-width="1.5"/>
<text x="{x1 + 17}" y="{y + 46}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="700" fill="#e8c44a">GOAL</text>
<circle cx="{bx:.1f}" cy="{y}" r="19" fill="#fff" stroke="#111" stroke-width="2.5"/>
<g transform="translate({bx - bx:.0f},0)">{pent.replace('cx="' + str(bx), 'cx="' + str(bx))}</g>
<text x="{x0}" y="{y + 46}" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#c8cdd6">KICK-OFF</text>
<text x="{W // 2}" y="{y + 46}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" fill="#c8cdd6">{ov} % of all work in progress or done</text>
</svg>
"""
known = {j["number"] for j in vjobs}
open(os.path.join(F, "board-meter.svg"), "w").write(meter_svg(done, len(vjobs), overall))
lc = last_change()
P = ["# Showdown Factory board", "",
     f"**{done} of {len(vjobs)} jobs done and checked · {overall} %** · updated {eastern(lc) if lc else 'now'}", "",
     "✅ **Quality check:** a job counts as done only after Claude checks it against the quality bar (average 4.2 or more, nothing under 3, hard gates pass). " + (f"Average score {avg_score} over {len(scored)} scored jobs. " if scored else "") + (f"🔍 Waiting for Claude's check: {', '.join(map(str, awaiting))}. " if awaiting else "🔍 Nothing waiting for a check. ") + (f"🔧 Sent back with a fix list: {', '.join(str(n) for n in resumable if fixing(n))}." if any(fixing(n) for n in resumable) else ""), "",
     '<img src="board-meter.svg" alt="Football progress meter" width="640">', "",
     "**Where to run:** 🟡 **project job** = new chat in the ChatGPT project \"Showdown visual\", type the number; one number is one turn (no Continue), and a job in parts shows its later parts only when the earlier part is done. 🟣 **image job** = its ticket in a ChatGPT **Temporary Chat** outside any project, then drop the picture in Claude's factory thread.", "",
     f"🟡 **Type next:** {', '.join([f'{n} (fix)' if fixing(n) else f'{n} (resume)' for n in resumable] + list(map(str, startable))) or '-'}" + (f" · then {', '.join(map(str, later))}" if later else ""), "",
     f"🟣 **Image next:** {', '.join(map(str, img_now)) or '-'}" + (f" · then {', '.join(map(str, img_later))}" if img_later else "") + (f" · tickets not written yet: {', '.join(map(str, img_noticket))}" if img_noticket else ""), "",
     f"**Working:** {', '.join(map(str, working)) or '-'} · **Blocked:** {', '.join(map(str, blocked)) or '-'}", "",
     "## Screens", "", "```"]
for name, nums in SCREENS:
    nums = [n for n in nums if n in known]
    if not nums:
        continue
    p_ = sum(pct(n) for n in nums) // len(nums)
    d_ = sum(1 for n in nums if info[n][0] in FINISHED)
    P.append(f"{name:<15}{bar(p_)} {d_}/{len(nums)}")
P += ["```", ""]
fr = feed_rows()
if fr:
    P += ["## Team V ↔ Team G (latest 3)", ""] + fr + [""]
P += ["## Full board", ""]
L = P + [

     f"Branch `{board['branch']}`. {len(vjobs)} Team V jobs, plus {len(tracked)} lines that track Team G. Two kinds of job. **Project (type number):** open a new chat in the ChatGPT project \"Showdown visual\" and type the number (up to 5 at once). **Fresh chat (image):** run the job's ticket from [tickets/](tickets/README.md) in a ChatGPT Temporary Chat (no memory) outside any project, then drop the image in Claude's factory thread (up to 2 at once).", "",
     f"**Overall (Team V):** {bar(overall)} {overall} % · {done} of {len(vjobs)} jobs done", "",
     f"**Start now · project (type the number in Showdown visual):** {', '.join([f'{n} (fix)' if fixing(n) else f'{n} (resume)' for n in resumable] + list(map(str, startable))) or 'nothing (all slots busy or nothing ready)'}" + (f" · queued next: {', '.join(map(str, later))}" if later else ""), "",
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
L += ["", "Lanes: **project (type number)** = a GPT-5.6 Sol chat inside the ChatGPT project Showdown visual, started by typing the number; **fresh chat (image)** = Nik runs the job's ticket(s) in a ChatGPT Temporary Chat outside any project and drops each image in Claude's factory thread, then Claude checks, commits and finishes the job (max 2 at once); **codex** = Codex review (job 108 only); **team-g** = tracks a Team G job, never started by Team V.", "", "Generated by `project-documents/factory/tools/board.py` from `BOARD.json`, `status/` and `tickets/`. Workers never edit this file; Claude regenerates it."]
open(os.path.join(F, "BOARD.md"), "w").write("\n".join(L) + "\n")
print("project:", startable, "fresh-chat images:", img_now, "no ticket yet:", img_noticket, "queued:", later + img_later)
print("overall:", overall, "%", done, "done")
