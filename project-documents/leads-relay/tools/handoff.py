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


def my_session(given=None):
    """v1.4 (2026-11-02): the writer's own session id. --session wins; otherwise it is read from the cloud session's
    environment (CLAUDE_CODE_REMOTE_SESSION_ID = cse_<id>, the same id as session_<id>), so no lead can forget it."""
    if given:
        return given
    raw = os.environ.get("CLAUDE_CODE_REMOTE_SESSION_ID", "")
    return ("session_" + raw[4:]) if raw.startswith("cse_") else (raw or None)


def touch(team, sid, thread=None):
    """v1.4 self-healing INBOX: every relay write (new/set/wake/register) makes the writer its team's current lead.
    What broke on 2026-11-02: neither r88 lead registered, so every wake went to retired threads and Nik had to paste."""
    if not sid:
        print(f"NOTE: no session id found, so INBOX {team} was not refreshed. Pass --session session_... next time.")
        return
    p = inbox()
    j = json.load(open(p))
    e = j.setdefault(team, {})
    if e.get("session_id") != sid or e.get("state") != "active":
        same = e.get("session_id") == sid
        e["session_id"], e["state"], e["updated"] = sid, "active", now()
        e["thread"] = thread or (e.get("thread", "") if same else "(auto: last relay writer)")
        json.dump(j, open(p, "w"), indent=1, ensure_ascii=False)
        open(p, "a").write("\n")
        print(f"INBOX {team} = {sid} (auto, this writer). Commit INBOX.json with the ticket.")


def stamp(t, team, sid):
    """Each ticket remembers the last thread of each team that touched it; wakes go there first."""
    if sid:
        t.setdefault("sessions", {})[team] = sid


def coordinator_line(to, text):
    """Nik 2026-10-29: leads rotate, coordinators stay. Every wake also goes to the other team's coordinator.
    v1.4 note: project coordinators are archived between turns (seen 2026-11-02), so this wake is best effort only."""
    try:
        c = json.load(open(inbox())).get("coordinators", {}).get(to, {})
    except Exception:
        c = {}
    if c.get("session_id"):
        print(f"ALSO WAKE (best effort; skip if get_session says archived) Team {to}'s coordinator: same create_trigger + fire_trigger with persistent_session_id={c['session_id']} and prompt:")
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
    targets = []
    if session:
        targets.append(session)
    if sid and state == "active" and sid not in targets:
        targets.append(sid)
    if targets:
        sid, state = targets[0], "active"
    if not sid or state != "active":
        # CONTRACT.md §11: a lead between threads never acknowledges work. Nothing will happen until the new lead registers.
        print(f"WAKE BLOCKED: Team {to}'s lead is '{state if sid else 'unregistered'}' in INBOX.json, so nobody will act on this.")
        print(f"  Tell Nik now, in one line, to paste project-documents/leads-relay/NEW_LEAD_START.md's box into the new Team {to} lead thread.")
        coordinator_line(to, text)
        return
    print(f"WAKE NOW (CONTRACT.md §9): one claude-code-remote create_trigger per session below,")
    for x in targets:
        print(f"  persistent_session_id={x}")
    print(f"  NO schedule (leave cron_expression and run_once_at empty), initiation human_request, and the prompt below;")
    print(f"  THEN call fire_trigger on each new trig_ id at once (2026-11-02: run_once_at wakes sat undelivered; fire_trigger delivers in seconds).")
    print(f"  Prompt:")
    print(f"  Relay for Team {to}: {text} Fetch leads/relay (+refs/heads/leads/relay:refs/remotes/origin/leads/relay) and act per CONTRACT.md.")
    print(f"  (create_trigger works from every lead thread; send_message with session_id={sid} also works where that tool exists.)")
    coordinator_line(to, text)
    print(f"  Then (CONTRACT.md §11) call get_session on each: skip any that is archived; if none is live, tell Nik the paste line.")


def register(a):
    """CONTRACT.md §11: the outgoing lead marks itself rotating; the new lead's first act is to register itself active."""
    a.session = my_session(a.session)
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
    a.session = my_session(a.session)
    if a.session:
        t["from_session"] = a.session
    stamp(t, a.frm, a.session)
    touch(a.frm, a.session)
    path = os.path.join(D, f"{tid}_{slug}.md")
    head = dump(t)
    open(path, "w").write(f"# {tid} · Team {a.frm} → Team {a.to} · {a.title}\n\n{head}\n\n{brief}\n")
    if a.parent:
        pp, ptxt, pm, pt = load(a.parent)
        pt.setdefault("parts", []).append(tid)
        save(pp, ptxt, pm, pt)
    print(path)
    print("Commit and push leads/relay first, then:")
    wake_line(a.to, f"new hand-off {tid} from Team {a.frm}: {a.title}. Acknowledge with handoff.py set {tid} RECEIVED --by {a.to}"
              + " (handoff.py records your session itself and wakes the sender's thread; no paste needed).")


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
    sid = my_session(a.session)
    stamp(t, a.by, sid)
    touch(a.by, sid)
    save(path, txt, m, t)
    print(path, st)
    print("Commit and push leads/relay first, then:")
    back = a.by == t["to"]
    other = t["from"] if back else t["to"]
    wake_line(other, session=t.get("sessions", {}).get(other) or (t.get("from_session") if back else None), text=f"hand-off {a.id} is now {st} (by Team {a.by}){': ' + a.note if a.note else ''}.")


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
w.add_argument("--by", choices=TEAMS, default=None, help="your team: refreshes your own INBOX entry (v1.4)")
s = sp.add_parser("set")
s.add_argument("id")
s.add_argument("status")
s.add_argument("--by", choices=TEAMS, required=True)
s.add_argument("--note", default="")
s.add_argument("--job", default=None, help="the job PR id that does the work, e.g. V-012 or 41; its progress block then drives the bar")
s.add_argument("--evidence", default=None)
s.add_argument("--done-step", type=int, action="append", default=[])
s.add_argument("--session", default=None, help="your session id (default: read from the cloud session environment)")
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
    if a.by:
        touch(a.by, my_session())
    wake_line(a.to, a.text, session=a.session)
