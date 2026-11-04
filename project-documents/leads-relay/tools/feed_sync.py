#!/usr/bin/env python3
"""Add FEED.md rows for hand-off ticket state changes (CONTRACT.md 2a).

Each team adds rows only for its own moves: `--team V` or `--team G`.
Rows come from each ticket's log (SENT, RECEIVED, DONE, RETURNED; WORKING is left out).
Safe to run again: a row already in FEED.md (same time and message) is never added twice.
The table stays sorted oldest to newest; old rows are never changed.
Run it in the same commit as any handoff.py change.
"""
import argparse, glob, json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAM = {"V": "Team V", "G": "Team G"}
KEEP = {"SENT", "RECEIVED", "DONE", "RETURNED"}
REPLY = {"SENT": "yes (receive it)", "RECEIVED": "no", "DONE": "no", "RETURNED": "yes (see reason)"}


def tickets():
    for path in sorted(glob.glob(os.path.join(HERE, "handoffs", "HO-*.md"))):
        m = re.search(r"```ticket\n(.*?)\n```", open(path, encoding="utf-8").read(), re.S)
        if m:
            yield json.loads(m.group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--team", choices=["V", "G"], required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    feed = os.path.join(HERE, "FEED.md")
    lines = open(feed, encoding="utf-8").read().rstrip("\n").split("\n")
    first = next(i for i, l in enumerate(lines) if l.startswith("| ---"))
    head, rows = lines[: first + 1], [l for l in lines[first + 1:] if l.startswith("|")]
    tail = [l for l in lines[first + 1:] if not l.startswith("|")]
    have = {(r.split("|")[1].strip(), r.split("|")[4].strip()) for r in rows}
    new = []
    for t in tickets():
        title = t["title"].replace("|", "/")
        for e in t.get("log", []):
            if e.get("by") != a.team or e.get("status") not in KEEP:
                continue
            when = e["at"][:16].replace("T", " ")
            msg = f'{t["id"]} {e["status"]}'
            if (when, msg) in have:
                continue
            other = "G" if a.team == "V" else "V"
            new.append(f"| {when} | {TEAM[a.team]} | {TEAM[other]} | {msg} | {title} | {REPLY[e['status']]} |")
            have.add((when, msg))
    rows = sorted(rows + new, key=lambda r: r.split("|")[1].strip())
    print(f"{len(new)} new row(s) for Team {a.team}")
    for r in new:
        print(r)
    if not a.dry_run and new:
        open(feed, "w", encoding="utf-8").write("\n".join(head + rows + tail) + "\n")


if __name__ == "__main__":
    main()
