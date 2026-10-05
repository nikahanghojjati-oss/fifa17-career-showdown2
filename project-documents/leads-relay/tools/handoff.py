#!/usr/bin/env python3
"""Hand-off tickets: pass a whole job (or one part of a split job) from one factory to the other.

A ticket is one file, handoffs/HO-NNN_<slug>.md: a ```ticket JSON header (machine state) and a Markdown brief that holds
EVERYTHING the receiving team needs (what, why, where, done-when, evidence). The relay Action posts the whole ticket as a
wake comment on PR #312, so the receiver gets it in full without opening anything; the boards read the header.

  new   --from G --to V --title "..." --brief FILE [--kind design] [--worker sonnet] [--priority normal] [--parent HO-003]
        [--step "name" ...]           writes handoffs/HO-NNN_<slug>.md with status SENT
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


def wake_line(to, text):
    """The other team's session is woken directly (seconds, no polling). The GitHub comment stays as the record and backup."""
    try:
        sid = json.load(open(os.path.join(D, "..", "INBOX.json")))[to]["session_id"]
    except Exception:
        sid = None
    if not sid:
        print(f"WAKE: Team {to} has no session_id in INBOX.json yet; the PR #312 comment is the only signal. Ask Team {to} to register.")
        return
    print(f"WAKE NOW (CONTRACT.md §9): call claude-code-remote send_message with session_id={sid} and message:")
    print(f"  Relay for Team {to}: {text} Fetch leads/relay (+refs/heads/leads/relay:refs/remotes/origin/leads/relay) and act per CONTRACT.md.")


def new(a):
    nums = [int(re.search(r"HO-(\d+)", f).group(1)) for f in glob.glob(os.path.join(D, "HO-*.md"))]
    tid = f"HO-{max(nums + [0]) + 1:03d}"
    slug = re.sub(r"[^a-z0-9]+", "-", a.title.lower()).strip("-")[:40]
    brief = open(a.brief).read().strip()
    t = {"id": tid, "from": a.frm, "to": a.to, "title": a.title, "kind": a.kind, "priority": a.priority, "worker": a.worker,
         "parent": a.parent, "job": None, "status": "SENT", "steps": [{"name": s, "done": False} for s in a.step],
         "evidence": [], "log": [{"at": now(), "by": a.frm, "status": "SENT", "note": ""}]}
    path = os.path.join(D, f"{tid}_{slug}.md")
    head = dump(t)
    open(path, "w").write(f"# {tid} · Team {a.frm} → Team {a.to} · {a.title}\n\n{head}\n\n{brief}\n")
    if a.parent:
        pp, ptxt, pm, pt = load(a.parent)
        pt.setdefault("parts", []).append(tid)
        save(pp, ptxt, pm, pt)
    print(path)
    print("Commit and push leads/relay first, then:")
    wake_line(a.to, f"new hand-off {tid} from Team {a.frm}: {a.title}. Acknowledge with handoff.py set {tid} RECEIVED --by {a.to}.")


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
    wake_line(t["from"] if a.by == t["to"] else t["to"], f"hand-off {a.id} is now {st} (by Team {a.by}){': ' + a.note if a.note else ''}.")


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
w = sp.add_parser("wake")
w.add_argument("--to", choices=TEAMS, required=True)
w.add_argument("--text", required=True)
s = sp.add_parser("set")
s.add_argument("id")
s.add_argument("status")
s.add_argument("--by", choices=TEAMS, required=True)
s.add_argument("--note", default="")
s.add_argument("--job", default=None, help="the job PR id that does the work, e.g. V-012 or 41; its progress block then drives the bar")
s.add_argument("--evidence", default=None)
s.add_argument("--done-step", type=int, action="append", default=[])
a = p.parse_args()
new(a) if a.cmd == "new" else set_(a) if a.cmd == "set" else wake_line(a.to, a.text)
