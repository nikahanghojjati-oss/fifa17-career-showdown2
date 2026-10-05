"""Shared by board.py, relay_page.py and custom_view.py: the facts that live outside the factory branch.

- live():      what is on main right now (SHA, runtime revision, last merge) and open PRs into main (live fixes).
- v_factory(): Team V's side. V jobs are PRs whose title starts with "V-" and carry the same ```progress block
               (collect_progress.py writes progress/v-*.json); until Team V retires its own board, its headline is
               read from factory/v1-wtt5ye BOARD.md as a fallback.
- relay():     every relay message (FEED.md rows + full text from archive/) and every hand-off ticket
               (leads-relay/handoffs/HO-NNN_*.md) with its pipeline stage. "Delivered" is proven by the wake
               comment the relay Action posts on PR #312 (marker <!-- relay:HO-NNN:delivered -->).
Everything is read with git and the GitHub REST API, so a run costs no Claude usage. Any read that fails returns
None and the pages say so instead of guessing."""
import datetime, glob, json, os, re, subprocess
from zoneinfo import ZoneInfo

REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
URL = f"https://github.com/{REPO}"
BOS = ZoneInfo("America/New_York")
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
V_BRANCH = "factory/v1-wtt5ye"
TRACKER = 312
STAGES = ["SENT", "DELIVERED", "RECEIVED", "WORKING", "DONE"]
STAGE_WORD = {"SENT": "Sent", "DELIVERED": "Delivered", "RECEIVED": "Received", "WORKING": "In progress", "DONE": "Done"}
OVERDUE_H = 6  # delivered but not acknowledged after this many hours -> warning on every page


def sh(*a):
    r = subprocess.run(a, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def api(path, paginate=False):
    out = sh("gh", "api", *(["--paginate", "--jq", ".[]"] if paginate else []), f"repos/{REPO}/{path}")
    if out is None:
        return None
    try:
        return json.loads(out) if not paginate else [json.loads(x) for x in out.splitlines() if x.strip()]
    except Exception:
        return None


def fetch(branch, local):
    sh("git", "fetch", "-q", "--depth", "1", "origin", f"+refs/heads/{branch}:refs/remotes/origin/{local}")
    return f"refs/remotes/origin/{local}"


def show(ref, path):
    return sh("git", "show", f"{ref}:{path}")


def bos(iso, fmt="%a %-d %b %-I:%M %p"):
    try:
        t = datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        if t.tzinfo is None:
            t = t.replace(tzinfo=datetime.timezone.utc)
        return f"{t.astimezone(BOS):{fmt}}"
    except Exception:
        return "unknown"


def hours_since(iso):
    try:
        t = datetime.datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        if t.tzinfo is None:
            t = t.replace(tzinfo=datetime.timezone.utc)
        return (datetime.datetime.now(datetime.timezone.utc) - t).total_seconds() / 3600
    except Exception:
        return 0


def gates(sha):
    """Check runs on a PR head, in words: how many passed, are still running, failed or were cancelled."""
    r = api(f"commits/{sha}/check-runs?per_page=100")
    if not r:
        return None
    runs = r.get("check_runs") or []
    c = {"passed": 0, "running": 0, "failed": 0, "cancelled": 0}
    for x in runs:
        if x["status"] != "completed":
            c["running"] += 1
        elif x["conclusion"] in ("success", "skipped", "neutral"):
            c["passed"] += 1
        elif x["conclusion"] == "cancelled":
            c["cancelled"] += 1
        else:
            c["failed"] += 1
    return c


def live():
    ref = fetch("main", "main-live")
    sha = sh("git", "rev-parse", "--short", ref)
    idx = show(ref, "index.html") or ""
    m = re.search(r'name="app-asset-revision" content="([^"]+)"', idx)
    when = (sh("git", "log", "-1", "--format=%cI", ref) or "").strip()
    subj = (sh("git", "log", "-1", "--format=%s", ref) or "").strip()
    prs = api("pulls?state=open&base=main&per_page=50") or []
    fixes = [dict(pr=p["number"], title=p["title"], draft=p.get("draft"), branch=p["head"]["ref"], sha=p["head"]["sha"], updated=p["updated_at"], gates=gates(p["head"]["sha"]))
             for p in prs if hours_since(p["updated_at"]) < 72 and not p["title"].upper().startswith("DO NOT MERGE")]
    # Today's fixes: PRs merged into main since midnight Boston time, newest first (straight from GitHub, nothing hand-written).
    midnight = datetime.datetime.now(BOS).replace(hour=0, minute=0, second=0, microsecond=0)
    closed = api("pulls?state=closed&base=main&per_page=30&sort=updated&direction=desc") or []
    today = sorted([dict(pr=p["number"], title=p["title"], merged=p["merged_at"]) for p in closed if p.get("merged_at")
                    and datetime.datetime.fromisoformat(p["merged_at"].replace("Z", "+00:00")) >= midnight], key=lambda x: x["merged"], reverse=True)
    return {"sha": (sha or "?").strip(), "revision": m.group(1) if m else "?", "when": when, "subject": subj, "fixes": fixes, "today": today} if sha else None


def v_progress():
    out = []
    for fn in sorted(glob.glob(os.path.join(F, "progress", "v-*.json"))):
        try:
            r = json.load(open(fn))
            k = sum(1 for s in r["steps"] if s.get("done"))
            out.append((str(r.get("job")), r, k, len(r["steps"])))
        except Exception:
            continue
    return out


def v_factory():
    """Team V's headline. Jobs reported through V- PRs win; the old Team V board is only a fallback until it retires."""
    ref = fetch(V_BRANCH, "v-factory")
    md = show(ref, "project-documents/factory/BOARD.md") or ""
    head = re.search(r"^\*\*(.+?)\*\*", md, re.M)
    now = re.search(r"## 🔴 Now\s*\n(.*?)\n## ", md, re.S)
    workers = []
    for line in md.splitlines():
        c = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(c) == 5 and c[1].isdigit():
            workers.append({"name": c[0], "jobs": int(c[1]), "first_time": re.sub(r"`.*?`\s*", "", c[2])})
    return {"headline": head.group(1) if head else None, "now": [x.strip("- ").strip() for x in (now.group(1).splitlines() if now else []) if x.strip()],
            "workers": workers, "jobs": v_progress(), "old_board": f"{URL}/blob/{V_BRANCH}/project-documents/factory/BOARD.md"}


def tickets(ref):
    out = []
    names = (sh("git", "ls-tree", "--name-only", ref, "project-documents/leads-relay/handoffs/") or "").split()
    for p in names:
        if not re.search(r"/HO-\d+[^/]*\.md$", p):
            continue
        txt = show(ref, p) or ""
        m = re.search(r"```ticket\s*\n(.*?)```", txt, re.S)
        try:
            t = json.loads(m.group(1))
        except Exception:
            out.append({"id": os.path.basename(p)[:6], "title": "ticket header unreadable", "status": "BROKEN", "path": p, "steps": [], "log": []})
            continue
        t["path"] = p
        t["body"] = txt[m.end():].strip()
        out.append(t)
    return sorted(out, key=lambda t: t["id"])


def stage(t, delivered):
    s = str(t.get("status", "SENT")).upper()
    if s == "SENT" and t["id"] in delivered:
        s = "DELIVERED"
    return s


def relay():
    ref = fetch("leads/relay", "leads/relay")
    feed = show(ref, "project-documents/leads-relay/FEED.md")
    if feed is None:
        return None
    files = (sh("git", "ls-tree", "--name-only", ref, "project-documents/leads-relay/archive/") or "").split()
    rows = []
    for line in feed.splitlines():
        c = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(c) == 6 and re.match(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}$", c[0]):
            f = next((x for x in files if os.path.basename(x).startswith(c[3] + "_")), None)
            rows.append(dict(zip(["time", "from", "to", "id", "subject", "reply"], c), path=f))
    comments = api(f"issues/{TRACKER}/comments?per_page=100", paginate=True)
    flat = comments or []
    delivered = {}
    for c in flat:
        for m in re.finditer(r"<!-- relay:(HO-\d+):delivered -->", c.get("body") or ""):
            delivered.setdefault(m.group(1), c["created_at"])
    ts = tickets(ref)
    for t in ts:
        t["stage"] = stage(t, delivered)
        t["delivered_at"] = delivered.get(t["id"])
        steps = t.get("steps") or []
        t["pct"] = 100.0 if t["stage"] == "DONE" else (100.0 * sum(1 for s in steps if s.get("done")) / len(steps) if steps else 0.0)
        t["overdue"] = t["stage"] == "DELIVERED" and hours_since(t["delivered_at"]) > OVERDUE_H
        rec = next((e.get("at") for e in t.get("log") or [] if str(e.get("status")).upper() == "RECEIVED"), None)
        t["pickup_min"] = round((hours_since(t["delivered_at"]) - hours_since(rec)) * 60) if rec and t["delivered_at"] else None
        t["waiting_min"] = round(hours_since(t["delivered_at"]) * 60) if t["stage"] == "DELIVERED" and t["delivered_at"] else None
    try:
        inbox = json.loads(show(ref, "project-documents/leads-relay/INBOX.json") or "{}")
    except Exception:
        inbox = {}
    head = (sh("git", "log", "-1", "--format=%h|%cI", ref) or "?|").strip().split("|")
    return {"ref": ref, "rows": rows, "tickets": ts, "head": head[0], "head_time": head[1], "comments_read": comments is not None, "inbox": {k: bool((inbox.get(k) or {}).get("session_id")) for k in ("G", "V")},
            "pings": len(flat)}


def text(ref, path):
    return show(ref, path) if path else None


def pipeline(t, md=True):
    """Sent > Delivered > Received > In progress > Done, with the reached stages ticked."""
    if t["stage"] in ("RETURNED", "BROKEN"):
        return ("↩️ Returned" if t["stage"] == "RETURNED" else "⚠ Broken ticket")
    k = STAGES.index(t["stage"]) if t["stage"] in STAGES else 0
    parts = []
    for i, s in enumerate(STAGES):
        w = STAGE_WORD[s] + (f" {t['pct']:.0f} %" if s == "WORKING" and k == i else "")
        parts.append(("✅ " if i <= k else "○ ") + (f"**{w}**" if md and i == k else w))
    return " → ".join(parts)


def mins(m):
    return "-" if m is None else f"{m} min" if m < 90 else f"{m // 60} h {m % 60:02d} min"
