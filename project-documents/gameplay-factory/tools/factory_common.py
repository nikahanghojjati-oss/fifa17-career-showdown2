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
# Lanes outside Nik's six colours (2026-10-05): Team V's senior reviewer, image tickets, and Nik on real phones.
EXTRA_LANES = {"astra": ("🟫", "Astra"), "images": ("🟥", "Image tickets"), "nik": ("👤", "Nik and Daniel")}
ALL_LANES = {**LANES, **EXTRA_LANES}
HEX = {"Sol chat": "#7dd3fc", "Sol Work mode": "#22c55e", "Codex": "#ffffff", "Opus": "#f97316", "Sonnet": "#8b5cf6", "Haiku": "#facc15",
       "Astra": "#a16207", "Image tickets": "#ef4444", "Nik and Daniel": "#f0d900"}


def lane_of(r):
    w = str(r.get("worker", "")).lower().replace(" ", "-")
    if w in ALL_LANES:
        return ALL_LANES[w]
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




OPEN_BUG = ("NEW", "TRIAGED", "FIXING", "REVIEW", "MERGED")


def done_status(b):
    st = b["status"].upper()
    if st != "DONE":
        return st
    # DONE in the old bug hunt means fixed; it is only LIVE once a release carries it ("live since rNN").
    n = b.get("note", "").lower()
    return "LIVE" if "live since" in n or "docs fixed" in n else "MERGED"


def all_bugs():
    """BUGS.json reports plus the 4 Oct bug hunt rows from BOARD.json, in one status vocabulary."""
    bugs = json.load(open(os.path.join(F, "BUGS.json")))["bugs"]
    old = [dict(id=b["id"], title=b["title"], where="", type="gameplay", priority="normal", worker="", job="", note=b.get("note", ""),
                status=done_status(b)) for b in json.load(open(os.path.join(F, "BOARD.json"))).get("bug_hunt", [])]
    return bugs + old
