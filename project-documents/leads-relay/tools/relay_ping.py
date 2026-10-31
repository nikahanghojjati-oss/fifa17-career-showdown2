#!/usr/bin/env python3
"""Run by .github/workflows/leads-relay-ping.yml on every leads/relay push that touches handoffs/.
New ticket   -> one comment on PR #312 carrying the WHOLE ticket (the receiver needs nothing else), marked
                <!-- relay:HO-NNN:delivered --> so the boards can prove delivery.
Status moved -> one short comment (wakes the other lead): RECEIVED, WORKING, DONE or RETURNED, marked <!-- relay:HO-NNN:status:X -->.
Step ticks alone post nothing; the boards show them. Usage: relay_ping.py BEFORE_SHA AFTER_SHA (needs GH_TOKEN)."""
import json, os, re, subprocess, sys

REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
before, after = sys.argv[1], sys.argv[2]
H = "project-documents/leads-relay/handoffs/"
WORD = {"RECEIVED": "received ✋", "WORKING": "in progress ⚙️", "DONE": "done ✅", "RETURNED": "returned ↩️", "SENT": "sent"}


def git(*a):
    r = subprocess.run(["git", *a], capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def header(txt):
    m = re.search(r"```ticket\s*\n(.*?)```", txt or "", re.S)
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def comment(body):
    subprocess.run(["gh", "pr", "comment", "312", "--repo", REPO, "--body-file", "-"], input=body, text=True, check=True)


base = before if before.strip("0") and git("cat-file", "-e", before) is not None else None
changed = (git("diff", "--name-only", base, after, "--", H) if base else git("ls-tree", "-r", "--name-only", after, H)) or ""
posted = 0
for path in sorted(changed.split()):
    if not re.search(r"/HO-\d+[^/]*\.md$", path):
        continue
    new_txt = git("show", f"{after}:{path}")
    if new_txt is None:
        continue
    t = header(new_txt)
    old = header(git("show", f"{base}:{path}")) if base else None
    url = f"https://github.com/{REPO}/blob/leads/relay/{path}"
    if t is None:
        comment(f"⚠ **Hand-off ticket unreadable:** {path} has no valid ```ticket header. Sender: fix it.\n\n<!-- relay:broken -->")
    elif old is None:
        body = new_txt if len(new_txt) < 60000 else new_txt[:60000] + f"\n\n…cut at 60,000 characters; full ticket: {url}"
        comment(f"📦 **Hand-off {t['id']}: Team {t['from']} → Team {t['to']}** · {t['title']}\n\n"
                f"Team {t['to']}: everything you need is below. Acknowledge with `handoff.py set {t['id']} RECEIVED --by {t['to']}`, "
                f"link your job PR with `--job`, finish with `DONE --evidence`. Team {t['from']}: no action.\n\n---\n\n{body}\n\n"
                f"<!-- relay:{t['id']}:delivered -->")
    elif str(old.get("status")) != str(t.get("status")):
        last = (t.get("log") or [{}])[-1]
        other = t["from"] if last.get("by") == t["to"] else t["to"]
        comment(f"**Hand-off {t['id']} is now {WORD.get(t['status'], t['status'])}** (by Team {last.get('by', '?')})"
                + (f": {last['note']}" if last.get("note") else "") + (f" · job {t['job']}" if t.get("job") else "")
                + (f" · evidence: {t['evidence'][-1]}" if t["status"] == "DONE" and t.get("evidence") else "")
                + f"\n\nTeam {other}: " + ("check the evidence and close your side." if t["status"] == "DONE" else "read the note and decide." if t["status"] == "RETURNED" else "no action.")
                + f" Ticket: {url}\n\n<!-- relay:{t['id']}:status:{t['status']} -->")
    else:
        continue
    posted += 1
print(posted)
