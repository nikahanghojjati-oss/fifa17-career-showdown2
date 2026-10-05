"""Shared by board.py and bug_board.py: progress files, worker lanes, two-decimal football bars."""
import glob, json, os, re

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
    # Jobs from 1001 that report only through status/JOB-NNNN.md (no PR progress block yet, e.g. job 1001 in a Sol chat): "State: IN PROGRESS" + "Step: k of n".
    have = {n for n, *_ in out}
    for p in sorted(glob.glob(os.path.join(F, "status", "JOB-*.md"))):
        try:
            t = open(p).read()
            n = int(re.search(r"JOB-(\d+)", os.path.basename(p)).group(1))
            st = re.search(r"^State:\s*(.+)$", t, re.M)
            step = re.search(r"^Step:\s*(\d+)\s+of\s+(\d+)", t, re.M)
            if n < 1001 or n in have or not st or "PROGRESS" not in st.group(1).upper() or not step:  # shared numbering from 1001 (HO-007); older status files are history
                continue
            chat = (re.search(r"^Chat:\s*(.+)$", t, re.M) or [None, ""])[1] if re.search(r"^Chat:", t, re.M) else ""
            worker = "sol-work" if "work" in chat.lower() else "sol-chat" if "sol" in chat.lower() else ""
            if not worker:  # between chats (e.g. "Chat: none, lead review"): the job's lane on BOARD.json
                try:
                    rows = [r for f in json.load(open(os.path.join(F, "BOARD.json"))).get("factories", {}).values() for r in f.get("future", [])]
                    worker = next((r["lane"] for r in rows if str(r.get("id")) == str(n)), "")
                except Exception:
                    pass
            title = re.sub(r"^#\s*Status\s*·\s*JOB-\d+\s*·\s*", "", t.splitlines()[0]).strip()
            k, total = int(step.group(1)) - 1, int(step.group(2))  # "Step 2 of 3" = working on step 2, one done
            up = re.search(r"^Updated:\s*(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d)", t, re.M)
            out.append((n, {"job": n, "title": title, "worker": worker, "current": f"step {step.group(1)} of {total}",
                            "updated": f"{up.group(1)}T{up.group(2)}:00Z" if up else None,
                            "steps": [{"name": f"step {i + 1}", "done": i < k} for i in range(total)]}, k, total))
        except Exception:
            continue
    return out


LANES = {"sol-chat": ("🟦", "Sol chat"), "sol-work": ("🟩", "Sol Work mode"), "codex": ("⬜", "Codex"),
         "opus": ("🟧", "Opus"), "sonnet": ("🟪", "Sonnet"), "haiku": ("🟨", "Haiku")}
# Lanes outside Nik's six colours (2026-10-05): Team V's senior reviewer, image tickets, and Nik on real phones.
EXTRA_LANES = {"astra": ("🟫", "Astra"), "images": ("🟥", "Image tickets"), "nik": ("👤", "Nik and Daniel")}
# Bug list factory names (2026-10-05): blue = GPT 5.6 Sol chat, green = ChatGPT Sol 6.1 Work mode, same colours as the Sol lanes.
ALIAS_LANES = {"blue": LANES["sol-chat"], "green": LANES["sol-work"], "lead": ("🟧", "Team G lead"), "V": ("🔵", "Team V")}
ALL_LANES = {**LANES, **EXTRA_LANES, **ALIAS_LANES}
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
