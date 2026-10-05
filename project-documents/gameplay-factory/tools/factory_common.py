"""Shared by board.py and bug_board.py: progress files, worker lanes, two-decimal football bars."""
import json, os, re

F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def running_jobs():
    d = os.path.join(F, "progress")
    out = []
    for fn in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if not re.match(r"job-\d+\.json$", fn):
            continue
        try:
            r = json.load(open(os.path.join(d, fn)))
            steps = r["steps"]
            k = sum(1 for s_ in steps if s_.get("done"))
            out.append((int(r["job"]), r, k, len(steps)))
        except Exception:
            continue
    return out


LANES = {"sol-chat": ("🟦", "Sol chat"), "sol-work": ("🟩", "Sol Work mode"), "codex": ("⬜", "Codex"),
         "opus": ("🟧", "Opus"), "sonnet": ("🟪", "Sonnet"), "haiku": ("🟨", "Haiku")}


def lane_of(r):
    w = str(r.get("worker", "")).lower().replace(" ", "-")
    if w in LANES:
        return LANES[w]
    o = str(r.get("owner", "")).lower()
    for k in ("sonnet", "opus", "haiku", "codex"):
        if k in o:
            return LANES[k]
    return ("⬛", "worker not set")


def pitch(frac, sq, width=20):
    if frac >= 1:
        return sq * width + " 🥅 GOAL"
    k = int(frac * width)
    return sq * k + "⚽" + "▫️" * (width - k - 1) + " 🥅"


