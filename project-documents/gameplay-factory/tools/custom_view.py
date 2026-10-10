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
import json, math, os, re, sys, datetime, html, subprocess
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
LIMIT = 9800  # the coordinator's Custom view tab (took 9 KB whole, so stay near that on 2026-10-09 22:26 UTC; was 7000)
RAW = "https://raw.githubusercontent.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/"

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
JOB = re.compile(r"^(?:Job |V-)?(\d{4}|Z\d+)$")  # Z1, Z2 ...: Studio Z jobs
LANE_PLACE = {"green": "the gameplay project (Work mode)", "sol-work": "the gameplay project (Work mode)", "blue": "the gameplay project (chat)", "sol-chat": "the gameplay project (chat)"}
rowmap = {str(y["id"]): y for t in ("G", "V") for y in BJ["factories"][t]["future"]}
# emergency studios inside the factory (Nik 2026-10-09: Studio Z). BOARD.json "studios": [{id, title, scope, state}]; a closed one
# is set to state "archived" (never deleted) and leaves the board. Rows join a studio with "studio": "<id>".
STUDIO = {str(x["id"]): x for x in BJ.get("studios") or [] if str(x.get("state", "open")).lower() != "archived"}
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
        if pr.get("merged_at") and str((pr.get("base") or {}).get("ref", "")).startswith("gameplay/") and re.match(r"\s*JOB-?\d{4}\b", pr.get("title") or ""):
            for m in re.finditer(r"\bJOB-?(\d{4})\b", pr.get("title") or ""):  # one PR can carry two jobs ("JOB-1051 + JOB-1052")
                out.setdefault(m.group(1), pr["number"])
    return out


MERGED = _merged_jobs()


def _ci_stage(gh, repo, sha):
    """What GitHub's checks say about a PR head: running, failed, green or not started (never guessed)."""
    try:
        runs = (gh(f"repos/{repo}/commits/{sha}/check-runs?per_page=100") or {}).get("check_runs") or []
    except Exception:
        return "CI unknown"
    if not runs:
        return "CI not started"
    if any(r.get("status") != "completed" for r in runs):
        return "CI running"
    bad = [r for r in runs if r.get("conclusion") not in ("success", "neutral", "skipped")]
    return f"CI failed ({len(bad)} check{'s' if len(bad) > 1 else ''})" if bad else "CI green"


def _open_job_prs():
    """job -> (open PR number, CI stage): each stage shows only once GitHub proves it (Nik, 2026-10-09 23:30 UTC: accurate, never finished early)."""
    import subprocess
    repo = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
    gh = lambda path: json.loads(subprocess.run(["gh", "api", path], capture_output=True, text=True, timeout=30).stdout or "null")
    try:
        prs = gh(f"repos/{repo}/pulls?state=open&per_page=60") or []
    except Exception:
        prs = []
    out = {}
    for pr in prs if isinstance(prs, list) else []:
        for m in re.finditer(r"\bJOB-?(\d{4})\b", pr.get("title") or "", re.I):
            if m.group(1) not in out:
                out[m.group(1)] = (pr["number"], "draft" if pr.get("draft") else _ci_stage(gh, repo, pr["head"]["sha"]))
                LIVE_PR[m.group(1)] = _pr_live(gh, repo, pr)
    return out


LIVE_PR = {}


def _pr_live(gh, repo, pr):
    """Live detail for a running job's PR (Haiku G, 2026-10-10): checks passed of total and when the PR last moved. Free REST reads, no Claude usage."""
    try:
        runs = (gh(f"repos/{repo}/commits/{pr['head']['sha']}/check-runs?per_page=100") or {}).get("check_runs") or []
    except Exception:
        runs = []
    ok = sum(1 for r in runs if r.get("conclusion") in ("success", "neutral", "skipped"))
    stamps = [r.get("completed_at") or r.get("started_at") or "" for r in runs] + [pr.get("updated_at") or ""]
    last = max(stamps) if stamps else ""
    mins = None
    if last:
        mins = int((datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(last.replace("Z", "+00:00"))).total_seconds() // 60)
    return {"ok": ok, "total": len(runs), "ago": "" if mins is None else (f"{mins} min ago" if mins < 120 else f"{mins // 60} h ago")}


_REPORT = {}


def report_saved(n):
    """A no-PR job (e.g. a recheck report): its ticket's "## Done" names a branch and a file; the file existing there on GitHub is the proof the worker finished."""
    if n in _REPORT:
        return _REPORT[n]
    import subprocess
    _REPORT[n] = ""
    try:
        t = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "jobs", f"JOB-{n}.md")).read()
    except OSError:
        return ""
    d = re.search(r"^## Done\s*$(.*?)(?=^## |\Z)", t, re.M | re.S)
    if not d or not re.search(r"no PR", d.group(1), re.I):
        return ""
    b = re.search(r"branch `([^`]+)`", d.group(1))
    f = re.search(r"`(project-documents/[^`]+\.md)`", d.group(1))
    if not (b and f):
        return ""
    repo = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
    try:
        r = subprocess.run(["gh", "api", f"repos/{repo}/contents/{f.group(1)}?ref={b.group(1)}", "--jq", ".sha"], capture_output=True, text=True, timeout=30)
    except Exception:
        return ""
    if r.returncode == 0 and r.stdout.strip():
        _REPORT[n] = f"worker done, report saved on {b.group(1)}, waiting for the lead"
    return _REPORT[n]


def pr_state(n, st):
    """The card's state from GitHub: worker done with its PR open, then CI running / failed / green, then lead checking."""
    num, ci = OPEN_PR[n]
    if ci == "draft":
        return f"worker working, draft PR #{num}"
    if ci == "CI green" and re.match(r"(with (the )?lead|verifying|lead checking|(in )?review)", st, re.I):
        return f"PR #{num} open, CI green, lead checking"
    if ci == "CI green":
        return f"worker done, PR #{num} open, CI green, waiting for the lead"
    return f"worker done, PR #{num} open, {ci}"


def stage_pct(st):
    """Bar for a running job without step data: only GitHub-proven stages fill it, and nothing open reads 100 %."""
    for pat, v in (("lead checking", 90), ("CI green|report saved", 80), ("CI running|CI not started|CI unknown", 70), ("CI failed", 60), ("draft PR", 40), ("worker says done", 50)):
        if re.search(pat, st or "", re.I):
            return float(v)
    return 0.0


OPEN_PR = _open_job_prs()


def status_step(n):
    """status/JOB-NNNN.md "State: IN PROGRESS" + "Step: k of t": the worker has started, so the job is Running."""
    try:
        t = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "status", f"JOB-{n}.md")).read()
    except OSError:
        return ""
    m = re.search(r"^State:\s*(.+)$", t, re.M)
    if not (m and re.match(r"IN PROGRESS\b", m.group(1).strip(), re.I)):
        return ""
    k = re.search(r"^Step:\s*(\d+)\s*of\s*(\d+)", t, re.M)
    return f"with the worker, step {k.group(1)} of {k.group(2)}" if k else "with the worker"


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


def run_state(q):
    # a running job whose row still says "ready" shows the worker's own step instead (e.g. 1028 started before the factory updated its row)
    st = short_state(q.get("state", ""))
    if (not st or re.match(r"(ready|next|queued)\b", st, re.I)) and q.get("progress"):
        p = q["progress"]
        return str((p[1] if isinstance(p[1], dict) else {}).get("current") or p[0].get("current") or "running")
    return st or "running"


def status_blocked(n):
    """status/JOB-NNNN.md "State: BLOCKED": the worker stopped on a question; the card waits on the lead and keeps its step."""
    try:
        t = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "status", f"JOB-{n}.md")).read()
    except OSError:
        return ""
    m = re.search(r"^State:\s*(.+)$", t, re.M)
    if not (m and re.match(r"BLOCKED\b", m.group(1).strip(), re.I)):
        return ""
    k = re.search(r"^Step:\s*(\d+)\s*of\s*(\d+)", t, re.M)
    return f"blocked at step {k.group(1)} of {k.group(2)}: the worker asked the lead a question" if k else "blocked: the worker asked the lead a question"


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
    if row.get("studio") in STUDIO:  # an open studio's job (e.g. Studio Z) is named on every line and sorts above the other jobs
        q["studio"] = row["studio"]
        if not n.startswith(row["studio"]):
            q["title"] = f'Studio {row["studio"]} · ' + str(q.get("title", ""))
    if re.match(r"(in release|verified|in r\d|merged|done \(merged)", st, re.I) or n in MERGED:
        Q["release"].append(q)
    elif re.match(r"held\b", st, re.I):  # held for Nik wins over every other signal, an open PR included (lead, 2026-10-09 22:26 UTC)
        q["after"] = st  # in full: it says what Nik is asked
        Q["wait"].append(q)
    elif status_blocked(n) and not re.match(r"with (the )?worker", st, re.I):  # a stopped worker is not "Next for you"; the lead's "with the worker" means it was unblocked
        q["after"] = q["state"] = status_blocked(n)
        Q["wait"].append(q)
    elif n in OPEN_PR and re.match(r"(ready|next|queued|with (the )?(worker|lead)|worker done|verifying|(in )?review|lead checking)\b", st, re.I):  # the worker's open PR: its stage comes from GitHub, nothing for Nik
        q["state"] = pr_state(n, st)
        Q["run"].append(q)
    elif re.match(r"(ready|next|queued|with (the )?worker)\b", st, re.I) and report_saved(n):  # a no-PR job's report file is on GitHub
        q["state"] = report_saved(n)
        Q["run"].append(q)
    elif status_done(n):
        q["state"] = "worker says done, no PR yet"
        Q["run"].append(q)
    elif status_step(n) and re.match(r"(ready|next|queued)\b", st, re.I):
        q["state"] = status_step(n)
        Q["run"].append(q)
    elif re.match(r"(with (the )?(worker|lead)|worker done|verifying|building|running|in progress|(in )?review|checks|ci )", st, re.I) or re.match(r"nothing to type", str(row.get("place") or ""), re.I):
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
nik = [x for x in _nk if not re.search(r"nothing to do until", str(x.get("decision", "")), re.I)]  # an ask with nothing to do yet is not an ask (Nik, 2026-10-09 22:49 UTC)
# Every job ticket counts (Nik, 2026-10-09): a jobs/JOB-NNNN.md written by any thread shows up even before a BOARD.json row exists.
def ticket_rows():
    out = []
    jd = os.path.join(F, "jobs")
    for fn in sorted(os.listdir(jd)) if os.path.isdir(jd) else []:
        m = re.match(r"JOB-(\d{4})\.md$", fn)
        if not m or int(m.group(1)) < 1001 or m.group(1) in rowmap:
            continue
        n = m.group(1)
        t = open(os.path.join(jd, fn)).read()
        h = re.search(r"^#\s*JOB-\d+\s*·\s*(.+)$", t, re.M)
        tl = [x for x in t.splitlines() if x.startswith("|")]
        cell = tl[2].split("|")[1].strip() if len(tl) > 2 else ""  # first column of the ticket's lane table
        try:
            stt = open(os.path.join(F, "status", f"JOB-{n}.md")).read()
        except OSError:
            stt = ""
        st = (re.search(r"^State:\s*(.+)$", stt, re.M) or [None, "READY"])[1].strip()
        if re.match(r"(MERGED|VERIFIED|LIVE|CLOSED|ARCHIVED)", st, re.I) or n in MERGED:
            continue
        title = h.group(1).strip() if h else f"Job {n}"
        c = cell.lower()
        lane = next((k for k in ("codex", "opus", "sonnet", "haiku") if k in c), None) or ("sol-work" if "work mode" in c else "sol-chat" if "chat" in c else "")
        team = "V" if re.search(r"\bvisual\b|· V\b", title + " " + cell, re.I) else "G"
        where = re.sub(r"\s*\(.*$", "", cell) or lane_name(lane)
        acct = re.search(r"GPT account \d", cell)
        proj = re.search(r"the (gameplay|visual) project", cell)
        place = ("GPT chat" if lane == "sol-chat" else "GPT Work mode" if lane == "sol-work" else "Codex cloud" if lane == "codex" else where) \
            + (f" ({acct.group(0)})" if acct else "") + (f", {proj.group(1)} project" if proj else "") + f": type 'Job {n}'"
        row = {"id": n, "title": title, "lane": lane, "state": {"READY": "ready", "DONE": "worker done"}.get(st.upper(), st.lower()), "place": place, "team": team, "ticket_only": True}
        pm = re.search(r"^(?:Prompt|Starter line):\s*`?(.+?)`?\s*$", t, re.M)  # a ticket may name its own starter line
        if pm:
            row["prompt"] = pm.group(1)
        elif team == "V":  # Team V's GPT worker looks in Team V's factory folder, so a V ticket kept here needs its full link (Job 1047, 2026-10-09)
            row["prompt"] = f"Job {n}. Read {RAW}jobs/JOB-{n}.md and do it."
        rowmap[n] = row
        out.append(row)
    return out


for _r in ticket_rows():
    _have = [q for v in Q.values() for q in v if str(q["n"]) == _r["id"]]
    for q in _have:  # already listed from its status file: fill in what the ticket knows
        q["lane"] = q.get("lane") or _r["lane"]
        q["team"] = _r["team"]
        q["title"] = _r["title"]
    if not _have:
        q_add({"id": _r["id"], "title": _r["title"], "state": _r["state"], "lane": _r["lane"]}, _r["team"])


# rows the lead marks "done (...)" leave BOARD_STATE's open buckets; list them under Done too
_inq = {str(q["n"]) for v in Q.values() for q in v}
for _id, _r in rowmap.items():
    _m = JOB.match(_id)
    if _m and _m.group(1) not in _inq and not _r.get("archived") and re.match(r"(done|live)\b", str(_r.get("state") or ""), re.I):
        Q["release"].append({"id": _id, "n": _m.group(1), "title": _r.get("title", ""), "lane": _r.get("lane", ""), "team": "G", "studio": _r.get("studio")})


def nkey(n):
    return (0, int(n)) if n.isdigit() else (1, int(re.sub(r"\D", "", n) or 0))


# the bug factory sets `order` on BOARD.json rows (its priority for Nik); unordered jobs follow by number
for v in Q.values():
    v.sort(key=lambda q: (0 if q.get("studio") else 1, float((rowmap.get(str(q["id"])) or {}).get("order") or 9999), nkey(q["n"])))
Q["release"].sort(key=lambda q: nkey(q["n"]))


def _released():
    """job -> "rNN" for finished jobs already on main (RELEASED.json, plus a GitHub check for jobs not known yet)."""
    import subprocess
    p = os.path.join(F, "RELEASED.json")
    try:
        R = json.load(open(p))
    except Exception:
        R = {"jobs": {}, "no_game_code": []}
    known, ngc = R.setdefault("jobs", {}), set(R.get("no_game_code") or [])
    todo = [q["n"] for q in Q["release"] if q["n"] not in known and q["n"] not in ngc]
    for q in Q["release"]:  # a row that says "in rNN" is already live
        m = re.search(r"\bin (r\d+)\b", str((rowmap.get(str(q["id"])) or {}).get("state") or ""))
        if m and q["n"] not in known:
            known[q["n"]] = m.group(1)
    todo = [n for n in todo if n not in known and n in MERGED]
    if todo:
        repo = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
        gh = lambda path: json.loads(subprocess.run(["gh", "api", path], capture_output=True, text=True, timeout=30).stdout or "null")
        try:
            rel = sorted([(x["merged_at"], re.match(r"Release (r\d+)", x["title"]).group(1), x["head"]["sha"]) for x in gh(f"repos/{repo}/pulls?state=closed&base=main&per_page=40") or []
                          if x.get("merged_at") and re.match(r"Release r\d+", x.get("title") or "")])
            for n in todo:
                sha = (gh(f"repos/{repo}/pulls/{MERGED[n]}") or {}).get("merge_commit_sha")
                for _, rv, head in rel:
                    if sha and (gh(f"repos/{repo}/compare/{sha}...{head}") or {}).get("status") in ("ahead", "identical"):
                        known[n] = rv
                        break
        except Exception:
            pass
        json.dump(R, open(p, "w"), indent=1)
    return known, ngc


LIVE_IN, NO_CODE = _released()
LIVE_Q = [q for q in Q["release"] if q["n"] in LIVE_IN]
NOCODE_Q = [q for q in Q["release"] if q["n"] in NO_CODE and q["n"] not in LIVE_IN]
WAIT_REL_Q = [q for q in Q["release"] if q["n"] not in LIVE_IN and q["n"] not in NO_CODE]


def live_groups():
    g = {}
    for q in LIVE_Q:
        g.setdefault(LIVE_IN[q["n"]], []).append(q["n"])
    return sorted(g.items(), key=lambda kv: int(kv[0][1:]), reverse=True)

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


def job_prog(q):
    """(worker, progress text, finish text) for a job card (Nik, 2026-10-09: every job shows its worker, progress and finish estimate)."""
    worker = lane_name(q.get("lane", "")) or "worker not set"
    if q.get("progress"):
        d, r = q["progress"]
        st = r.get("steps") or []
        prog = f"{d['pct']:.4f} % done" + ("" if re.match(r"step \d", run_state(q)) or not st else f" ({sum(1 for x in st if x.get('done'))} of {len(st)} steps)")
        eta = d.get("eta")
        fin = f"finish ~{eta}" if eta and eta != "not enough data" else "finish: no estimate yet (this worker has no finished jobs to learn from)"
        return worker, prog, fin
    return worker, "not started", ""


TEAM = {"Sol chat": "Team blue · GPT chat", "Sol Work mode": "Team green · GPT Work mode", "Codex": "Team white · Codex",
        "Opus": "Team orange · Claude Opus", "Sonnet": "Team purple · Claude Sonnet", "Haiku": "Team yellow · Claude Haiku"}  # Nik 2026-10-09 22:22 UTC
MODEL_HEX = (("astra", "#f43f5e"), ("luna", "#e879f9"), ("6.1", "#2dd4bf"), ("sol", "#67e8f9"), ("opus", "#f97316"), ("sonnet", "#8b5cf6"), ("haiku", "#facc15"), ("codex", "#ffffff"))


BADGE = {"blue": ("🔵", "#7dd3fc"), "green": ("🟢", "#22c55e"), "yellow": ("🟡", "#facc15"), "orange": ("🟠", "#f97316"), "white": ("⚪", "#ffffff"), "purple": ("🟣", "#a78bfa"), "brown": ("🟤", "#b45309"), "black": ("⚫", "#d1d5db")}  # Claude: purple Opus, brown Sonnet, black Haiku (lead, 2026-10-09 22:32 UTC)
LANE_COLOUR = {"Sol chat": "blue", "Sol Work mode": "green", "Codex": "white", "Opus": "purple", "Sonnet": "brown", "Haiku": "black"}


def team_badge(q, worker):
    """The lead's team colour for the job (BOARD.json row "team": blue chat, green Work mode Sol, yellow Work mode Luna, orange Astra, white Codex, purple Claude)."""
    c = ((rowmap.get(str(q["id"])) or {}).get("team") or "").lower()
    c = c if c in BADGE else LANE_COLOUR.get(worker, "")
    if not c:
        return f"<b>{e(worker)}</b>"
    return f'<b style="color:{BADGE[c][1]}">{BADGE[c][0]} Team {c}</b>'


def model_chip(q):
    """The exact model and effort from the job's BOARD.json row ("model", "effort"); each GPT model has its own colour (Astra red: the expensive one)."""
    r = rowmap.get(str(q["id"])) or {}
    mdl, eff = (r.get("model") or "").strip(), (r.get("effort") or "").strip()
    if not mdl:
        return '<span class="m">model not set</span>'
    tc = (r.get("team") or "").lower()
    col = BADGE[tc][1] if tc in BADGE else next((c for k, c in MODEL_HEX if k in mdl.lower()), "#9ca3af")  # the lead's legend wins (2026-10-09 22:24 UTC)
    where = (r.get("place") or "").strip()
    return (f'<b style="color:{col}">● {e(mdl)}' + (f" · {e(eff)} effort" if eff else "") + "</b>"
            + (f' <span class="m">· {e(where)}</span>' if where and q.get("_kind") == "next" else ""))


LASTNOTE = []
TIGHT = [False]
GPTLANE = {"gpt-chat": "chat", "sol-chat": "chat", "chat": "chat", "blue": "chat", "gpt-work": "work", "sol-work": "work", "work": "work", "green": "work"}
LASTPLACE = [None]  # 'Type this in X' shows once for jobs in a row that go to the same place


def job_html(q, i, kind):
    q["_kind"] = kind
    worker, prog, fin = job_prog(q)
    st = run_state(q) if kind == "run" else short_state(q.get("state", ""))
    head = f'{sq(q["lane"])} <b>#{i} · {e(q["n"])}</b> <span class="tm">{e(q.get("team", "G"))}</span> {e(q["title"])}'
    if prog == "not started":  # the 0 % bar already says it  # already with a worker or the lead: its state says where it is
        prog = ""
    meta = [f"Worker: {worker}"] + ([st] if st and kind != "next" else []) + ([prog] if prog and kind != "wait" else []) + ([fin] if fin and kind == "run" else [])
    if kind == "wait" and (q.get("after") or "") != st:
        meta.append("waits: " + (q.get("after") or "something else"))
    pct = q["progress"][0]["pct"] if q.get("progress") else (stage_pct(st) if kind == "run" else 0.0)
    m0 = re.search(r"step (\d+) of (\d+)", (st or "") + " " + str((rowmap.get(str(q["id"])) or {}).get("state") or q.get("state") or ""))
    if m0 and not q.get("progress"):
        pct = 100.0 * (int(m0.group(1)) - 1) / int(m0.group(2))
    if kind == "run" and q["n"] in LIVE_PR and LIVE_PR[q["n"]]["total"]:  # Haiku G 2026-10-10: each look shows movement
        lv = LIVE_PR[q["n"]]
        meta.append(f"CI {lv['ok']} of {lv['total']} passed" + (f" · last move {lv['ago']}" if lv["ago"] else ""))
        if re.search(r"CI running|CI not started|CI unknown", st or "", re.I):
            pct = 70.0 + 10.0 * lv["ok"] / lv["total"]  # finer bar inside the CI stage
    col = HEX.get(worker, "#6b7280")  # Nik, 2026-10-09 21:57: bring back the bar, the % and the worker's colour on every card
    meta = [x for x in meta if not x.startswith("Worker: ") and not x.endswith("% done") and " % done (" not in x]
    out = (head + f'<br><b class="br"><i class="q{QI.get(worker, 9)}" style="width:{max(pct, 2):.0f}%"></i></b><span class="pc">{pct:.4f} %</span>'
           + ("<span class='m'> worker's part done</span>" if kind == "run" and not q.get("progress") and pct == 100 else "")
           + "<br>" + team_badge(q, worker) + " " + model_chip(q) + ' <span class="m">' + e(" · ".join(meta)) + "</span>")
    r2 = rowmap.get(str(q["id"])) or {}
    tc = (r2.get("team") or "").lower()
    tc = tc if tc in BADGE else LANE_COLOUR.get(worker, "")
    q["_card"] = {"pct": pct, "badge": f"{BADGE[tc][0]} Team {tc}" if tc else worker, "model": r2.get("model") or "", "effort": r2.get("effort") or "",
                  "where": r2.get("place") or "", "meta": " · ".join(meta), "worker_done": kind == "run" and not q.get("progress") and pct == 100}
    q.pop("_copy", None)
    if kind == "run" and q.get("lane") in ("sol-chat", "blue", "chat", "sol-work", "green") and not status_done(q["n"]):
        out += '<br><span class="m">To keep it going, type this in the same chat:</span><code class="cp">next</code>'  # GPT jobs end each reply with NEXT
    if kind == "next":
        pl = q.get("where") or ""
        m = re.search(r"type\s+['‘\"]?([^'’\"]+?)['’\"]?\s*(?:\(|$|·|;)", pl + " ", re.I) if re.search(r"\btype\b", pl, re.I) else None
        prompt = (rowmap.get(str(q["id"])) or {}).get("prompt") or (m.group(1).strip() if m else q.get("type") or f"Job {q['n']}")
        place = re.sub(r":?\s*type\b.*$", "", pl, flags=re.I).strip(" ,:") or "(place not given)"
        note = re.sub(r";?\s*ticket jobs/JOB-\d+\.md;?\s*", "; ", q.get("note") or "").strip("; ")
        parts = [x for x in note.split("; ") if x and x not in LASTNOTE]  # a reason shared with the job above shows once
        LASTNOTE[:] = note.split("; ")
        note = "; ".join(parts)
        place = re.sub(r"^in\s+", "", place)
        r1 = rowmap.get(str(q["id"])) or {}
        if "prompt" in r1 and r1.get("model"):  # the lead's full row: Model · Effort · Where is on the line above, the prompt goes in verbatim
            out += ('<br><span class="m">Paste this:</span><code class="cp">' + e(r1["prompt"]) + "</code>") if (r1.get("prompt") or "").strip() else '<br><span class="m">Nothing for you to type: the lead runs it.</span>'
            q["_copy"] = ("Paste this:", r1["prompt"]) if (r1.get("prompt") or "").strip() else ("Nothing for you to type: the lead runs it.", "")
        elif re.search(r"nothing for (nik|you)", pl, re.I):
            out += '<br><span class="m">Nothing for you to type: the lead starts it.</span>'
            q["_copy"] = ("Nothing for you to type: the lead starts it.", "")
        else:
            lead = {"chat": "New chat inside the ChatGPT project Career Mode Showdown (Stay in Chat), type:",
                    "work": "New chat inside the ChatGPT project Career Mode Showdown, switch to Work mode (cheaper model), type:"}.get(GPTLANE.get(q.get("lane", ""))) or f"Type this in {place}:"  # wording from the lead, 2026-10-09 22:20 UTC
            r0 = rowmap.get(str(q["id"])) or {}
            if GPTLANE.get(q.get("lane", "")) and r0.get("model"):  # name the exact model and effort to pick
                pick = r0["model"] + (f', {r0["effort"]} effort' if r0.get("effort") else "")
                lead = lead.replace("switch to Work mode (cheaper model)", f"switch to Work mode, pick {pick}").replace("(Stay in Chat)", f"(Stay in Chat), pick {pick}")
            if GPTLANE.get(q.get("lane", "")) and re.search(r"account 2|second account", pl, re.I):
                lead = lead.replace("New chat", "On GPT account 2, new chat")
            out += (f'<br><span class="m">{e(lead)}</span>' if lead != LASTPLACE[0] or GPTLANE.get(q.get("lane", "")) else "") + f'<code class="cp">{e(prompt)}</code>'
            LASTPLACE[0] = lead
            q["_copy"] = (lead, prompt)
        out += f'<span class="m">{e(note)}</span>' if note and not TIGHT[0] else ""
    return out


def stages():
    """The four-stage plan (Nik, 2026-10-09 22:00 UTC): bugs, then visual fixes, then phone mockups, then desktop. Every number is counted from live data."""
    import glob
    try:
        SG = json.load(open(os.path.join(F, "STAGES.json")))
    except Exception:
        SG = {}
    done_n = {str(q["n"]) for q in Q["release"]}
    n_done, n_open = len(Q["release"]), len(Q["run"]) + len(Q["next"]) + len(Q["wait"])
    rep = sorted(glob.glob(os.path.join(F, "reports", "OLYMPIAD_RECHECK_*.md")))
    oly_all, oly_valid = 0, []
    if rep:
        t = open(rep[-1]).read()
        m = re.search(r"\|\s*\*\*Total\*\*\s*\|\s*\*\*\d+\*\*\s*\|\s*\*\*(\d+)\*\*", t)
        oly_all = int(m.group(1)) if m else 0
        oly_valid = re.findall(r"^\|\s*(V\d+)\s*\|", t, re.M)
    oj = SG.get("olympiad_jobs") or {}
    oly_left = [v for v in oly_valid if str(oj.get(v, "")) not in done_n]
    leads = SG.get("sol_leads") or []
    def fix_job(x):  # a recheck job (e.g. 1056, 1057) settles nothing; only a fix job's merge or a "not real" verdict does (lead, 2026-10-09 23:47 UTC)
        j = str(x.get("fix_job") or x.get("job") or "")
        return "" if re.match(r"recheck\b", str((rowmap.get(j) or {}).get("title") or ""), re.I) and not x.get("fix_job") else j
    leads_left = [x for x in leads if not re.match(r"not real\b", str(x.get("state") or ""), re.I) and not (fix_job(x) and fix_job(x) in done_n)]
    mapped = {str(v) for v in oj.values()} | {str(x.get("job")) for x in leads if x.get("job")}
    n_open -= len([q for k in ("run", "next", "wait") for q in Q[k] if str(q["n"]) in mapped])  # counted once, as its Olympiad bug or Sol lead
    s_done = n_done + (oly_all - len(oly_left)) + (len(leads) - len(leads_left))
    s_all = n_done + n_open + oly_all + len(leads)
    TK = TWO.get("tickets") or []
    tk_done = len([x for x in TK if x["stage"] == "DONE"])
    st = [
        ("Finish the remaining bugs", 100.0 * s_done / s_all if s_all else 0.0,
         [f"Numbered jobs: {n_done} done, {n_open} other open",
          f"Olympiad recheck: {oly_all - len(oly_left)} of {oly_all} settled, {len(oly_left)} still to fix" if oly_all else "Olympiad recheck: no report found",
          f"Sol's old leads: {len(leads_left)} open (" + ", ".join(f"{sum(1 for x in leads_left if re.match(k, str(x.get('state') or ''), re.I))} {w}" for k, w in (("confirmed|real", "real"), ("unsure", "unsure"))) + ")"]),
        ("Visual fixes", 100.0 * tk_done / len(TK) if TK else 0.0, [f"Team V hand-offs: {tk_done} of {len(TK)} done"]),
        ("Match current desktop screens to the mockup", 100.0 * GL["V"].get("studied", 0) / (GL["V"].get("screens") or 1),
         [f"Mockup Lab: {GL['V'].get('studied', 0)} of {GL['V'].get('screens', 0)} screens studied, {GL['V'].get('diffs', 0)} differences to fix"]),  # Nik 2026-10-09 22:05: after visual fixes, before phone mockups
        ("Visual mockups for phone", 0.0, ["Not started"]),
        ("Improved desktop versions", 0.0, ["Not started"]),
    ]
    cur = next((i for i, x in enumerate(st) if x[1] < 100), len(st) - 1) if s_done < s_all else 1
    return st, cur


_WOW = {}


def v_live(pr):
    """Live detail for a running Team V job's PR: CI checks passed of total, and when the PR last moved (free REST calls)."""
    if not pr:
        return ""
    repo = "nikahanghojjati-oss/fifa17-career-showdown2"
    gh = lambda path: json.loads(subprocess.run(["gh", "api", path], capture_output=True, text=True, timeout=30).stdout or "null")
    try:
        p = gh(f"repos/{repo}/pulls/{pr}") or {}
        runs = (gh(f"repos/{repo}/commits/{p['head']['sha']}/check-runs?per_page=100") or {}).get("check_runs") or []
    except Exception:
        return "CI unknown"
    ok = sum(1 for r in runs if r.get("conclusion") in ("success", "neutral", "skipped"))
    stamps = [r.get("completed_at") or r.get("started_at") or "" for r in runs] + [p.get("updated_at") or ""]
    last = max(stamps) if stamps else ""
    mins = int((datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(last.replace("Z", "+00:00"))).total_seconds() // 60) if last else None
    ago = "" if mins is None else (f"{mins} min ago" if mins < 120 else f"{mins // 60} h ago")
    return f"CI {ok} of {len(runs)} passed · last move {ago}" if runs else f"no checks yet · last move {ago}"


def v_svg():
    """Team V's visual board as one inline SVG (tools/wow_svg.py). Built once per run from the same lists as the text view."""
    if not _WOW:
        import wow_svg
        SG_, cur_ = stages()
        prs_ = {str(j["job"]): j.get("pr") for j in TWO.get("v_jobs") or []}
        jobs_ = [(x["id"], re.sub(r"^\d+ · [GV] ", "", x["title"]), (x["progress"][0]["pct"] if x.get("progress") else x.get("pct")), v_live(prs_.get(str(x["id"]))))
                 for x in items["V"]["fix"]]
        tiles_ = [((LV or {}).get("revision", "?").split("-")[-1], "Live"), (len(Q["run"]), "Jobs running"), (len(Q["next"]), "Jobs to start"),
                  (len([x for x in nik if not x.get("md")]), "Other asks")]
        _WOW["svg"] = wow_svg.dashboard(SG_, cur_, TWO.get("tickets") or [], jobs_, tiles_, title="Team V board · Haiku V")
    return _WOW["svg"]


def dash_svg(SG, cur):
    """Static SVG dashboard (Haiku G, 2026-10-10): stage ring plus job bars. No scripts or CSS, so it renders in the Custom view and on GitHub."""
    pct = max(0.0, min(100.0, float(SG[cur][1]))) if SG else 0.0
    C = 2 * 3.14159265 * 56
    bars = [(f"Live {rv}", len(ns), "#22c55e") for rv, ns in live_groups()]
    bars += [("Running", len(Q["run"]), "#f0d900"), ("Up next", len(Q["next"]), "#42b9da"),
             ("Waiting", len(Q["wait"]), "#8ea2ac"), ("Awaiting release", len(WAIT_REL_Q), "#a78bfa"),
             ("Asks for Nik", len([x for x in nik if not x.get("md")]), "#f97316")]
    mx = max([v for _, v, _ in bars] + [1])
    H = 46 + 26 * len(bars) + 10
    cy = H // 2
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 {H}" width="100%">',
         f'<rect width="680" height="{H}" rx="14" fill="#20272d"/>',
         f'<g font-family="Arial,sans-serif" font-size="12" fill="#dce5e8"><text x="20" y="26" fill="#f0d900" font-size="15" font-weight="800">PROGRESS · TEAM G</text>',
         f'<circle cx="100" cy="{cy}" r="56" fill="none" stroke="#12191f" stroke-width="16"/>',
         f'<path d="{arc_d(100, cy, 56, pct)}" fill="none" stroke="#f0d900" stroke-width="16" stroke-linecap="round"/>',
         f'<text x="100" y="{cy + 6}" text-anchor="middle" fill="#fbfcfc" font-size="19" font-weight="800">{pct:.0f}%</text>',
         f'<text x="100" y="{cy + 24}" text-anchor="middle" font-size="10">{e(SG[cur][0][:24]) if SG else ""}</text></g>']
    for i, (label, v, col) in enumerate(bars):
        y = 46 + i * 26
        w = round(330 * v / mx)
        o.append(f'<text x="200" y="{y + 13}" font-family="Arial,sans-serif" font-size="12" fill="#dce5e8">{e(label)}</text>'
                 f'<rect x="300" y="{y + 3}" width="330" height="13" rx="6" fill="#12191f"/>'
                 f'<rect x="300" y="{y + 3}" width="{w}" height="13" rx="6" fill="{col}"/>'
                 f'<text x="{300 + max(w, 0) + 6}" y="{y + 14}" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="#fbfcfc">{v}</text>')
    o.append("</svg>")
    return "".join(o)


def arc_d(cx, cy, r, pct):
    """Progress arc as a path (no dasharray, no transform: the Custom view's sanitizer strips those)."""
    if pct >= 99.95:
        return f"M{cx},{cy - r}A{r},{r} 0 1 1 {cx - 0.01:.2f},{cy - r}"
    t = 2 * 3.14159265 * pct / 100
    x, y = cx + r * math.sin(t), cy - r * math.cos(t)
    return f"M{cx},{cy - r}A{r},{r} 0 {1 if t > 3.14159265 else 0} 1 {x:.2f},{y:.2f}" if pct > 0.05 else ""


def dash_tab(SG, cur):
    """The small version for the Custom view (under 2 KB): the stage ring, one stacked bar in distinct colours and a legend."""
    pct = max(0.0, min(100.0, float(SG[cur][1]))) if SG else 0.0
    segs = [(f"Live {rv}", len(ns), c) for (rv, ns), c in zip(live_groups(), ["#22c55e", "#14b8a6", "#38bdf8", "#818cf8", "#c084fc"])]
    segs += [("Running", len(Q["run"]), "#f0d900"), ("Next", len(Q["next"]), "#fb923c"), ("Waiting", len(Q["wait"]), "#94a3b8"),
             ("Awaiting release", len(WAIT_REL_Q), "#f472b6"), ("Asks for Nik", len([x for x in nik if not x.get("md")]), "#f87171")]
    tot = max(1, sum(v for _, v, _ in segs))
    o, x, lg = [], 20.0, []
    for i, (label, v, col) in enumerate(segs):
        if v:
            w = 600 * v / tot
            o.append(f'<rect x="{x:.0f}" y="60" width="{max(w, 2):.0f}" height="14" fill="{col}"/>')
            x += w
        lx = 20 + (i % 4) * 150
        ly = 92 + (i // 4) * 16
        lg.append(f'<rect x="{lx}" y="{ly - 9}" width="10" height="10" rx="2" fill="{col}"/><text x="{lx + 15}" y="{ly}" font-family="Arial,sans-serif" font-size="11" fill="#dce5e8">{e(label)}: {v}</text>')
    ring = arc_d(60, 40, 34, pct)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 124" width="100%">'
            '<rect width="640" height="124" rx="12" fill="#2c353c"/>'
            '<circle cx="60" cy="40" r="34" fill="none" stroke="#12191f" stroke-width="10"/>'
            + (f'<path d="{ring}" fill="none" stroke="#f0d900" stroke-width="10" stroke-linecap="round"/>' if ring else "")
            + f'<text x="60" y="46" text-anchor="middle" fill="#fbfcfc" font-family="Arial,sans-serif" font-size="15" font-weight="800">{pct:.0f}%</text>'
            f'<text x="110" y="24" fill="#8ea2ac" font-family="Arial,sans-serif" font-size="12">{e(SG[cur][0][:44]) if SG else ""}</text>'
            + "".join(o) + "".join(lg) + "</svg>")


def render(first, compact=False, tight=False):
    TIGHT[0] = tight
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
         ".cv .cp{display:block;user-select:all;-webkit-user-select:all;background:#111820;border:1px dashed #f0d900;border-radius:6px;padding:4px 8px;margin:2px 0 4px;font:13px monospace;white-space:pre-wrap;overflow-wrap:anywhere}"
         ".cv .br{display:inline-block;vertical-align:middle;width:50%;height:12px;border-radius:6px;background:#12191f;border:1px solid #43515b;overflow:hidden}.cv .br i{display:block;height:100%;border-radius:6px;background:currentColor}.cv .pc{font:italic 800 16px var(--h);color:#f0d900;margin-left:8px}.cv .tm{font-size:11px;border:1px solid #8ea2ac;border-radius:4px;padding:0 3px;color:#dce5e8}"
         + "".join(f".cv .q{i}{{color:{h}}}" for i, h in enumerate(HEX.values())) + ".cv .q9{color:#9ca3af}</style>",
         '<div class="cv">',
         f'<div class="ban"><b>Bug hunt board · {"Haiku G" if first == "G" else "Haiku V"}</b><span>Updated {now:%a %-d %b, %-I:%M %p} Boston time · same board as Team {"V" if first == "G" else "G"}\'s · <a href="{BLOB}BOARD.md">on GitHub</a>' + ("" if tight else f' · <a href="{BLOB}RELAY.md">relay</a>') + '</span></div>',
         f'<div class="tiles"><div class="tile"><b>{e((LV or {}).get("revision", "?").split("-")[-1])}</b><span>Live</span></div><div class="tile"><b>{n_run}</b><span>Jobs running</span></div><div class="tile"><b>{n_next}</b><span>Jobs to start</span></div><div class="tile"><b>{n_nik}</b><span>Other asks</span></div></div>' if not tight else f'<div class="m foot">Live: {e((LV or {}).get("revision", "?").split("-")[-1])}</div>']
    if first == "V" and not tight:  # Nik 2026-10-10: the visual board, one inline SVG
        H.append(f'<div style="margin:6px 10px">{v_svg()}</div>')
    if first == "G" and not tight:  # Haiku G: stage ring and job bar
        H.append('<div style="padding:8px 10px 0">' + dash_tab(*stages()) + "</div>")
    H.append("<h2>Jobs</h2>")
    J = []
    for z in STUDIO.values():
        nz = sum(1 for v in ("run", "next", "wait") for q in Q[v] if q.get("studio") == z["id"])
        J.append(f'<span class="k">🚨 Studio {e(z["id"])} first: {e(z.get("title", ""))}</span>' + (f' <span class="m">{e(z.get("scope", ""))}</span>' if z.get("scope") and not compact else "") + ("" if nz else f' <span class="m">· {zd} done, none open</span>' if (zd := sum(1 for q in Q["release"] if q.get("studio") == z["id"])) else ' <span class="m">· no jobs yet</span>'))
    # every open job, in the factory's order, numbered across the three lists (Nik, 2026-10-09)
    for kind, label in (("run", "Running now"), ("next", "Next for you, in this order"), ("wait", "Waiting on something else")):
        if Q[kind]:
            J.append(f'<span class="k">{label}</span>')
            LASTPLACE[0] = None
            LASTNOTE[:] = []
            J += [job_html(q, i, kind) for i, q in enumerate(Q[kind], 1)]  # #1 is the first job of each list
    if WAIT_REL_Q:  # Nik, 2026-10-09 23:24 UTC: finished but not on main yet, apart from what is already live
        J.append('<span class="k">Done, waiting for the next release</span> ' + ", ".join(e(q["n"]) for q in WAIT_REL_Q))
    if LIVE_Q:
        J.append('<span class="k">Done and live</span> ' + (" · ".join(f"{rv}: " + ", ".join(ns) for rv, ns in live_groups()) if not tight else " · ".join(f"{rv}: {len(ns)} jobs" for rv, ns in live_groups())))
    if NOCODE_Q:
        J.append('<span class="k">Done, no game code</span> ' + ", ".join(e(q["n"]) for q in NOCODE_Q))
    H.append('<div class="card move">' + ("<br>".join(J) or "No numbered job is open.") + "</div>")
    order = ("G", "V") if first == "G" else ("V", "G")
    if not (first == "V" and not tight):  # Team V's inline SVG already draws the goal bars (Nik 2026-10-10)
        H.append("<h2>Goals, in this order</h2>")
        SG, cur = stages()
        gl = []
        for i, (name, pct, lines) in enumerate(SG):
            tag = "now" if i == cur else ("done" if pct >= 100 else "after stage " + str(i))
            gl.append(f'<b>{i + 1}. {e(name)}</b> <span class="tm">{tag}</span><br><b class="br"><i class="q{8 if i == cur else 9}" style="width:{max(pct, 2):.0f}%"></i></b><span class="pc">{pct:.4f} %</span>'
                      + ("<br><span class='m'>" + e(" · ".join(lines)) + "</span>" if (i == cur or not tight) else ""))
        H.append('<div class="card">' + "<br>".join(gl) + "</div>")
    if nik:
        H.append("<h2>Other asks</h2>")
        H.append('<div class="card">' + "<br>".join((md(x["decision"]) if x.get("md") else f'<b>{e(x["id"])}</b> {e(x["decision"])}') for x in nik) + "</div>")
    if tight:  # the Custom view is full: the jobs and goals come first, the rest is on GitHub
        H.append(f'<div class="m foot">Physio, other work, live release and relay: <a href="{BLOB}BOARD.md">on GitHub</a></div></div>')
        H[0] = re.sub(r"\.cv \.tiles?( \w+)?\{[^}]*\}", "", H[0])  # no tiles in this view
        return "\n".join(H) + "\n"
    H.append(f'<div class="card">{TF.PHYSIO_ICON.get(ph.get("state"), "🩺")} <b>{e(ph.get("line", "Physio: no report yet."))}</b>' + (f'<br><span class="m">{e(ph["gate"])}</span>' if ph.get("gate") else "") + "</div>")
    if warn:
        H.append('<div class="card warn">⚠ <b>Not fully current:</b> ' + " ".join(e(w) for w in warn) + "</div>")
    for t in (first, "V" if first == "G" else "G"):
        H.append(team_html(t, t == first, cut, compact))
    H.append("<h2>Live now</h2>")
    if LV:
        H.append(f'<div class="card">🌐 <b>{e(LV["revision"])}</b> <span class="m">main <code>{e(LV["sha"][:7])}</code> · {e(TF.bos(LV["when"]))}</span><br>{e(LV["subject"][:90])}'
                 + "".join(f'<br>✅ <span class="m">{e(TF.bos(x["merged"], "%-I:%M %p"))}</span> #{x["pr"]} {e(x["title"][:cut])}' for x in (LV.get("today") or [])[:2 if compact else 4]) + "</div>")
    TK = TWO.get("tickets") or []
    open_tk = [x for x in TK if x["stage"] != "DONE"]
    H.append("<h2>Relay</h2>")
    H.append('<div class="card">' + ("✅ working" if TWO.get("relay_ok") else "⚠ unreadable") + f' <span class="m">{len(open_tk)} open hand-offs, {len(TK) - len(open_tk)} done</span>'
             + "".join(f'<br><b>{e(x["id"])}</b> {e(x.get("from") or "?")}→{e(x.get("to") or "?")} {e(x["title"][:cut])} <span class="m">{e(TF.STAGE_WORD.get(x["stage"], x["stage"]))}</span>' for x in open_tk[::-1][:3]) + "</div>")
    H.append(("" if compact else '<div class="m foot">Lanes: ' + " · ".join(f'<i class="q{QI[l]}">■</i> {l}' for l in HEX) + "</div>") + "</div>")
    return "\n".join(H) + "\n"


open(os.path.join(F, "CUSTOM_VIEW_V.svg"), "w").write(v_svg())  # GitHub shows this committed SVG inline in RELAY.md
for team, fn in (("G", "CUSTOM_VIEW.html"), ("V", "CUSTOM_VIEW_V.html")):
    out = render(team)  # the jobs card is never cut; the sections below it shrink to fit the Custom view
    if len(out.encode()) > LIMIT:
        out = render(team, compact=True)
    if len(out.encode()) > LIMIT:
        out = render(team, compact=True, tight=True)
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


L = ["# Bug hunt board · Haiku G", "",
     f"Updated {now:%a %-d %b, %-I:%M %p} Boston time. Bug hunting only, no new features until further notice. "
     "The Team G and Team V Custom views and the board artifact show this same board. History of every job and bug report: [Board history](BOARD_ARCHIVE.md) · hand-offs between teams: [relay](RELAY.md).", ""]
if warn:
    L += ["> ⚠ **Not fully current:** " + " ".join(warn), ""]
L += [f"🌐 **Live: {LV['revision']}** (main `{LV['sha'][:7]}`, {TF.bos(LV['when'])})" if LV else "🌐 Live version unknown this run", "",
      f"{TF.PHYSIO_ICON.get(ph.get('state'), '🩺')} **{ph.get('line', 'Physio: no report yet.')}**" + (f" · {ph['gate']}" if ph.get("gate") else ""), "",
      "## Jobs", ""]
for z in STUDIO.values():
    L += [f"🚨 **Studio {z['id']} first: {z.get('title', '')}**" + (f" · {z['scope']}" if z.get("scope") else "") + ("" if any(q.get("studio") == z["id"] for v in ("run", "next", "wait") for q in Q[v]) else f" · {zd} done, none open" if (zd := sum(1 for q in Q["release"] if q.get("studio") == z["id"])) else " · no jobs yet"), ""]
def bar_md(pct):
    k = round(pct / 10)
    return "`" + "█" * k + "░" * (10 - k) + f"` **{pct:.4f} %**"


def job_md(q, i, kind):
    """The same job card as the Custom view, in GitHub markdown (Nik, 2026-10-09 22:49 UTC): team colour, model, effort, bar, copy box."""
    c = q.get("_card") or {}
    out = [f"**#{i} · {q['n']}** `{q.get('team', 'G')}` {q['title']}  ",
           bar_md(c.get("pct", 0.0)) + (" worker's part done" if c.get("worker_done") else "") + "  ",
           f"{c.get('badge', '')} · " + (f"**{c['model']}**" + (f" · {c['effort']} effort" if c.get("effort") else "") if c.get("model") else "model not set")
           + (f" · {c['where']}" if c.get("where") and kind == "next" else "") + (f" · {c['meta']}" if c.get("meta") else "")]
    if kind == "next" and q.get("_copy"):
        lead, text = q["_copy"]
        out += ["", lead] + (["", "```text", text, "```"] if text else [])
    return out + [""]


for _k, _label in (("run", "▶️ Running now"), ("next", "👉 Next for you, in this order"), ("wait", "⏸ Waiting on something else")):
    if Q[_k]:
        L += [f"### {_label}", ""]
        for _i, _q in enumerate(Q[_k], 1):
            L += job_md(_q, _i, _k)
if WAIT_REL_Q:
    L += ["**Done, waiting for the next release:** " + ", ".join(q["n"] for q in WAIT_REL_Q), ""]
if LIVE_Q:
    L += ["**Done and live:** " + " · ".join(f"{rv}: " + ", ".join(ns) for rv, ns in live_groups()), ""]
if NOCODE_Q:
    L += ["**Done, no game code** (factory or handoff documents): " + ", ".join(q["n"] for q in NOCODE_Q), ""]
_SG, _cur = stages()
L += ["## Goals, in this order", ""]
for _i, (_n, _p, _ls) in enumerate(_SG):
    L += [f"**{_i + 1}. {_n}** " + ("`now`" if _i == _cur else ("`done`" if _p >= 100 else f"`after stage {_i}`")) + "  ", bar_md(_p) + "  ", " · ".join(_ls), ""]
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
_svg = dash_svg(*stages())
open(os.path.join(F, "board-chart.svg"), "w").write(_svg)
L[2:2] = ["![Team G progress](board-chart.svg)", ""]
# history: jobs live per release, a bar per release (Haiku G, 2026-10-10). Free: built from RELEASED.json.
_rel = {}
for _n, _rv in (json.load(open(os.path.join(F, "RELEASED.json"))).get("jobs") or {}).items():
    _rel[_rv] = _rel.get(_rv, 0) + 1
_rv_sorted = sorted(_rel.items(), key=lambda kv: int(kv[0][1:]))
_mx = max([v for _, v in _rv_sorted] + [1])
_hw, _hh = 680, 60 + 34 * len(_rv_sorted) + 24
_h = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_hw} {_hh}" width="100%">',
      f'<rect width="{_hw}" height="{_hh}" rx="14" fill="#20272d"/>',
      '<text x="20" y="28" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="#f0d900">JOBS LIVE PER RELEASE</text>']
for _i, (_rv, _v) in enumerate(_rv_sorted):
    _y = 50 + _i * 34
    _w = round(440 * _v / _mx)
    _h.append(f'<text x="20" y="{_y + 15}" font-family="Arial,sans-serif" font-size="13" fill="#dce5e8">{_rv}</text>'
              f'<rect x="80" y="{_y + 4}" width="440" height="16" rx="8" fill="#12191f"/>'
              f'<rect x="80" y="{_y + 4}" width="{_w}" height="16" rx="8" fill="#22c55e"/>'
              f'<text x="{80 + _w + 8}" y="{_y + 17}" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#fbfcfc">{_v}</text>')
_h.append("</svg>")
open(os.path.join(F, "history-chart.svg"), "w").write("".join(_h))
L[4:4] = ["![Jobs live per release](history-chart.svg)", ""]
open(os.path.join(F, "BOARD.md"), "w").write("\n".join(L) + "\n")
open(os.path.join(F, "BUG_BOARD.md"), "w").write("# Bug board\n\nFolded into the one board on 2026-10-06: see [BOARD.md](BOARD.md). Every bug report, fixed or not, is listed in [the archive](BOARD_ARCHIVE.md).\n")

# Snapshot Team V reads straight from the repo
rj = running_jobs()
snap = {"team": "G", "updated": now.isoformat(timespec="minutes"), "open_bugs": len([b for b in all_bugs() if b["status"] in OPEN_BUG]),
        "next_move": BJ.get("next_move") or [],
        "running": [{"job": n, "title": r.get("title", ""), "worker": lane_of(r)[1], "done": k, "total": t, "pct": round(ETA.describe(r)["pct"], 4), "eta": ETA.describe(r)["eta"],
                     "current": r.get("current", ""), "pr": r.get("pr"), "updated": r.get("updated", "")} for n, r, k, t in rj]}
json.dump(snap, open(os.path.join(F, "TEAM_G_PROGRESS.json"), "w"), indent=1, ensure_ascii=False)
