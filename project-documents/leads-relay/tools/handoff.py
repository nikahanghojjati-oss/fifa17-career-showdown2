#!/usr/bin/env python3
"""Hand-off tickets: pass a whole job (or one part of a split job) from one factory to the other.

A ticket is one file, handoffs/HO-NNN_<slug>.md: a ```ticket JSON header (machine state) and a Markdown brief that holds
EVERYTHING the receiving team needs (what, why, where, done-when, evidence). The relay Action posts the whole ticket as a
wake comment on PR #312, so the receiver gets it in full without opening anything; the boards read the header.

  new   --from G --to V --title "..." --brief FILE [--kind design] [--worker sonnet] [--priority normal] [--parent HO-003]
        [--step "name" ...]           writes handoffs/HO-NNN_<slug>.md with status SENT
  register --team V --session session_... [--thread "..."] [--state active|rotating]
                                sets your own INBOX.json entry (CONTRACT.md §11); a new lead runs this first
  wake  --to V --text "..."     prints the one send_message call that wakes the other team now (CONTRACT.md §9)
  set   HO-NNN STATUS --by V [--note "..."] [--job V-012] [--evidence "branch @ sha - what"] [--done-step N ...]
        STATUS: RECEIVED (acknowledged), WORKING, DONE, RETURNED (with --note why)

The script only writes the file. Commit it with a clear message and push leads/relay (fast-forward only).
Run from the repo root: python3 project-documents/leads-relay/tools/handoff.py ..."""
import argparse, datetime, glob, json, os, re, sys

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "handoffs")
STATUSES = ("SENT", "RECEIVED", "WORKING", "DONE", "RETURNED")
TEAMS = ("G", "V")


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load(tid):
    fs = glob.glob(os.path.join(D, f"{tid}_*.md"))
    if not fs:
        sys.exit(f"no ticket {tid}")
    txt = open(fs[0]).read()
    m = re.search(r"```ticket\s*\n(.*?)```", txt, re.S)
    return fs[0], txt, m, json.loads(m.group(1))


def dump(t):  # compact: one field per line, each value on one line
    return "```ticket\n{\n" + ",\n".join(f" {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in t.items()) + "\n}\n```"


def save(path, txt, m, t):
    head = dump(t)
    open(path, "w").write(txt[:m.start()] + head + txt[m.end():] if m else txt)


def inbox():
    return os.path.join(D, "..", "INBOX.json")


def coordinator_line(to, text):
    """Nik 2026-10-29: leads rotate, coordinators stay. Every wake also goes to the other team's coordinator."""
    try:
        c = json.load(open(inbox())).get("coordinators", {}).get(to, {})
    except Exception:
        c = {}
    if c.get("session_id"):
        print(f"ALSO WAKE Team {to}'s coordinator: same create_trigger call with persistent_session_id={c['session_id']} and prompt:")
        print(f"  For Team {to}'s coordinator: {text} Make sure your current lead picks this up; start a lead thread if none is active.")
    else:
        print(f"Team {to}'s coordinator id is missing from INBOX.json 'coordinators'. Ask your own coordinator (message_coordinator) to reach it, and tell Nik in one line.")


def wake_line(to, text, session=None):
    """The other team's session is woken directly (seconds, no polling). The GitHub comment stays as the record and backup.
    session: a ticket's own lead session (two leads of one team can run at once, e.g. r86 and r87); it wins over INBOX.json."""
    try:
        e = json.load(open(inbox()))[to]
    except Exception:
        e = {}
    sid, state = e.get("session_id"), e.get("state", "active")
    if session:
        sid, state = session, "active"
    if not sid or state != "active":
        # CONTRACT.md §11: a lead between threads never acknowledges work. Nothing will happen until the new lead registers.
        print(f"WAKE BLOCKED: Team {to}'s lead is '{state if sid else 'unregistered'}' in INBOX.json, so nobody will act on this.")
        print(f"  Tell Nik now, in one line, to paste project-documents/leads-relay/NEW_LEAD_START.md's box into the new Team {to} lead thread.")
        coordinator_line(to, text)
        return
    print(f"WAKE NOW (CONTRACT.md §9): call claude-code-remote create_trigger with persistent_session_id={sid},")
    print(f"  run_once_at = 1-2 minutes from now, initiation human_request, and prompt:")
    print(f"  Relay for Team {to}: {text} Fetch leads/relay (+refs/heads/leads/relay:refs/remotes/origin/leads/relay) and act per CONTRACT.md.")
    print(f"  (create_trigger works from every lead thread; send_message with session_id={sid} also works where that tool exists.)")
    coordinator_line(to, text)
    print(f"  Then (CONTRACT.md §11) call get_session on {sid}: if it is idle asking for a new lead, or archived, tell Nik the same paste line.")


def register(a):
    """CONTRACT.md §11: the outgoing lead marks itself rotating; the new lead's first act is to register itself active."""
    p = inbox()
    j = json.load(open(p))
    e = j.setdefault(a.team, {})
    if a.session:
        e["session_id"] = a.session
    if a.thread:
        e["thread"] = a.thread
    e["state"] = a.state
    e["updated"] = now()
    json.dump(j, open(p, "w"), indent=1, ensure_ascii=False)
    open(p, "a").write("\n")
    print(f"INBOX {a.team} = {e.get('session_id')} ({a.state}). Commit and push leads/relay.")
    if a.state == "active":
        mine = []
        for f in sorted(glob.glob(os.path.join(D, "HO-*.md"))):
            m = re.search(r"```ticket\s*\n(.*?)```", open(f).read(), re.S)
            t = json.loads(m.group(1)) if m else {}
            if t.get("to") == a.team and t.get("status") in ("SENT", "RECEIVED", "WORKING"):
                mine.append(os.path.basename(f))
        print("Open tickets for you (pick these up now):", *mine or ["none"], sep="\n  ")


def new(a):
    nums = [int(re.search(r"HO-(\d+)", f).group(1)) for f in glob.glob(os.path.join(D, "HO-*.md"))]
    tid = f"HO-{max(nums + [0]) + 1:03d}"
    slug = re.sub(r"[^a-z0-9]+", "-", a.title.lower()).strip("-")[:40]
    brief = open(a.brief).read().strip()
    t = {"id": tid, "from": a.frm, "to": a.to, "title": a.title, "kind": a.kind, "priority": a.priority, "worker": a.worker,
         "parent": a.parent, "job": None, "status": "SENT", "steps": [{"name": s, "done": False} for s in a.step],
         "evidence": [], "log": [{"at": now(), "by": a.frm, "status": "SENT", "note": ""}]}
    if a.session:
        t["from_session"] = a.session
    path = os.path.join(D, f"{tid}_{slug}.md")
    head = dump(t)
    open(path, "w").write(f"# {tid} · Team {a.frm} → Team {a.to} · {a.title}\n\n{head}\n\n{brief}\n")
    if a.parent:
        pp, ptxt, pm, pt = load(a.parent)
        pt.setdefault("parts", []).append(tid)
        save(pp, ptxt, pm, pt)
    print(path)
    print("Commit and push leads/relay first, then:")
    wake_line(a.to, f"new hand-off {tid} from Team {a.frm}: {a.title}. Acknowledge with handoff.py set {tid} RECEIVED --by {a.to}."
              + (f" Wake the sender's lead at session {a.session} (in the ticket as from_session), not INBOX.json." if a.session else ""))


def set_(a):
    path, txt, m, t = load(a.id)
    st = a.status.upper()
    if st not in STATUSES:
        sys.exit(f"status must be one of {STATUSES}")
    if st == "RETURNED" and not a.note:
        sys.exit("RETURNED needs --note saying why")
    for n in a.done_step:
        t["steps"][n - 1]["done"] = True
    if a.job:
        t["job"] = a.job
    if a.evidence:
        t["evidence"].append(a.evidence)
    if st == "DONE":
        if not t["evidence"]:
            sys.exit("DONE needs --evidence (branch @ sha - what, or a merged PR)")
        for s in t["steps"]:
            s["done"] = True
    t["status"] = st
    t["log"].append({"at": now(), "by": a.by, "status": st, "note": a.note or ""})
    save(path, txt, m, t)
    print(path, st)
    print("Commit and push leads/relay first, then:")
    back = a.by == t["to"]
    wake_line(t["from"] if back else t["to"], session=t.get("from_session") if back else None, text=f"hand-off {a.id} is now {st} (by Team {a.by}){': ' + a.note if a.note else ''}.")


p = argparse.ArgumentParser()
sp = p.add_subparsers(dest="cmd", required=True)
n = sp.add_parser("new")
n.add_argument("--from", dest="frm", choices=TEAMS, required=True)
n.add_argument("--to", choices=TEAMS, required=True)
n.add_argument("--title", required=True)
n.add_argument("--brief", required=True, help="Markdown file with the full brief")
n.add_argument("--kind", default="build", choices=("bug", "design", "build", "check", "protocol"))
n.add_argument("--worker", default="", help="suggested lane: opus, sonnet, haiku, sol-chat, sol-work, codex, astra, images")
n.add_argument("--priority", default="normal", choices=("top", "normal", "later"))
n.add_argument("--parent", default=None, help="split: this ticket is one part of HO-NNN")
n.add_argument("--step", action="append", default=[])
n.add_argument("--session", default=None, help="your own lead session id; replies wake it instead of INBOX.json (needed when two leads of one team run at once)")
w = sp.add_parser("wake")
w.add_argument("--to", choices=TEAMS, required=True)
w.add_argument("--text", required=True)
w.add_argument("--session", default=None, help="wake this session instead of the INBOX.json one")
s = sp.add_parser("set")
s.add_argument("id")
s.add_argument("status")
s.add_argument("--by", choices=TEAMS, required=True)
s.add_argument("--note", default="")
s.add_argument("--job", default=None, help="the job PR id that does the work, e.g. V-012 or 41; its progress block then drives the bar")
s.add_argument("--evidence", default=None)
s.add_argument("--done-step", type=int, action="append", default=[])
r = sp.add_parser("register", help="CONTRACT.md §11 lead rotation: set your own INBOX.json entry")
r.add_argument("--team", choices=TEAMS, required=True)
r.add_argument("--session", default=None, help="this thread's session id (new lead)")
r.add_argument("--thread", default=None, help="short thread name")
r.add_argument("--state", choices=("active", "rotating"), default="active")
a = p.parse_args()
if a.cmd == "new":
    new(a)
elif a.cmd == "set":
    set_(a)
elif a.cmd == "register":
    register(a)
else:
    wake_line(a.to, a.text, session=a.session)
