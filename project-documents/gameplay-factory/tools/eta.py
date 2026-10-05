"""Weighted percentage and finish-time estimate for one job's progress record. Shared by board.py, bug_board.py, custom_view.py.
Weights are minutes per step type from ETA_MODEL.json (built by eta_study.py from finished PRs and CI runs); see ETA_STUDY.md.
Deterministic: depends only on the progress record (never on the clock), so the 3-minute poller commits only when a job reports."""
import json, os, re, datetime, statistics
from zoneinfo import ZoneInfo
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BOS = ZoneInfo("America/New_York")
try:
    MODEL = json.load(open(os.path.join(F, "ETA_MODEL.json")))
except Exception:
    MODEL = None
LEARNED = ("opus", "sonnet")  # lanes with finished PRs to learn from; Sol, Codex and Haiku jobs get exact percentages but no time estimate


def kind(name):
    n = name.lower()
    if re.search(r"\bci\b|checks|green", n):
        return "ci"
    if re.search(r"merge (recovery|job|main)|sync|\bmerge\b.*\b(recovery|job \d+)", n):
        return "sync"
    if re.search(r"review|lead merge|report|codex|hand ?off", n):
        return "review"
    return "work"


def parse(iso):
    try:
        return datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    except Exception:
        return None


def clock(t):
    return f"{t.astimezone(BOS):%-I:%M %p}"


def describe(r):
    """Returns dict(pct, eta, basis). pct is a float, to be printed with 4 decimals. eta is text or None."""
    steps = r["steps"]
    worker = str(r.get("worker", "")).lower()
    done = [bool(s.get("done")) for s in steps]
    kinds = [kind(s["name"]) for s in steps]
    learned = MODEL and worker in LEARNED
    if not learned:
        k = sum(done)
        return {"pct": 100 * k / max(len(steps), 1), "eta": "not enough data", "basis": "equal steps; no finished jobs by this worker to learn from"}
    jid = str(r.get("job", ""))
    c = MODEL["classes"]["job" if jid.isdigit() and not str(r.get("title", "")).lower().startswith("fix") else "fix"]
    cnt = lambda ks: max(sum(1 for x in kinds if x in ks), 1)
    unit = lambda key, ks, i: c[key][i] / cnt(ks)  # i: 0 = fast (p25), 1 = typical (median), 2 = slow (p75)
    # slow case for review/merge: waiting behind other jobs' merges took up to 20+ minutes
    wait = lambda i: (max(c["wait"][2], 20) if i == 2 else c["wait"][i]) / cnt(("review",))
    w = [[unit("ci", ("ci",), i) if k == "ci" else wait(i) if k == "review" else unit("work", ("work", "sync"), i) for k in kinds] for i in range(3)]
    # Pace: when steps carry done_at, the job's own measured minutes per work step replace the history for its work steps.
    stamps = [parse(s.get("done_at")) for s in steps]
    obs = []
    prev = None
    for s_, t, kd in zip(steps, stamps, kinds):
        if t and prev and kd in ("work", "sync"):
            obs.append((t - prev).total_seconds() / 60)
        if t:
            prev = t
    basis = "history"
    if len(obs) >= 2:
        m = statistics.median(obs)
        for i, f in enumerate((0.7, 1.0, 1.5)):
            w[i] = [m * f if kd in ("work", "sync") else x for x, kd in zip(w[i], kinds)]
        basis = f"history + this job's own pace ({len(obs)} timed steps)"
    tot = w[1]
    pct = 100 * sum(x for x, d in zip(tot, done) if d) / sum(tot)
    left = [sum(x for x, d in zip(w[i], done) if not d) for i in range(3)]
    if not any(not d for d in done):
        return {"pct": 100.0, "eta": "done", "basis": basis}
    anchor = max([t for t in stamps if t] or [parse(r.get("updated")) or datetime.datetime.now(datetime.timezone.utc)])
    at = [anchor + datetime.timedelta(minutes=m) for m in left]
    now = datetime.datetime.now(datetime.timezone.utc)
    if at[2] < now:
        return {"pct": pct, "eta": "past the estimate; the next report will move it", "basis": basis}
    return {"pct": pct, "end": at[1], "eta": f"about {clock(at[1])} (likely {clock(at[0])} to {clock(at[2])}) Boston time", "basis": basis}


def whistle(descs):
    """Full-time line: when the last running job is likely done (needs a numeric estimate on at least one job)."""
    ends = [d["end"] for d in descs if d.get("end")]
    return f"🏁 last running job likely done about {clock(max(ends))} Boston time" if ends else "🏁 no finish time yet (not enough data)"


MOOD = {"calm": "😌", "watchful": "🧐", "busy": "😅", "tight": "😬", "strained": "🥵"}


def gaffer():
    """Gaffer (the usage manager) from GAFFER.json: returns dict or None."""
    try:
        g = json.load(open(os.path.join(F, "GAFFER.json")))
        g["emoji"] = MOOD.get(g.get("mood"), "🧑‍💼")
        g["pct"] = round(100 * float(g.get("five_hour", 0)))
        u = parse(g.get("updated"))
        g["age_min"] = int((datetime.datetime.now(datetime.timezone.utc) - u).total_seconds() / 60) if u else None
        g["stale"] = g["age_min"] is None or g["age_min"] > 90
        return g
    except Exception:
        return None
