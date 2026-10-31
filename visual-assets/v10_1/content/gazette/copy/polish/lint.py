#!/usr/bin/env python3
"""Lint a polish done_*.json against its todo file and the Gazette rules."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build_copy as b
done = json.load(open(sys.argv[1]))
todo = json.load(open(sys.argv[1].replace("done_", "todo_")))
errs = []
if [r["id"] for r in done] != [r["id"] for r in todo]:
    errs.append("ids/order differ from todo")
SLOTS = set("winner loser winnerClub loserClub margin winnerPoints loserPoints seasonNo seasonsTotal leader trailer managerA managerB clubA clubB points".split())
openers = {}
for r in done:
    text = json.dumps({k: v for k, v in r.items() if k in ("headline", "subhead", "text", "lead", "co", "standfirst", "paragraphs", "pullquote", "head", "byline")}, ensure_ascii=False)
    plain = " ".join(v if isinstance(v, str) else " ".join(v) if isinstance(v, list) else v.get("text", "") for k, v in r.items() if k in ("headline", "subhead", "text", "lead", "co", "standfirst", "paragraphs", "pullquote", "head"))
    why = []
    if b.NAMES.search(plain): why.append("real name")
    if b.DASH.search(plain): why.append("dash")
    if ";" in plain: why.append("semicolon")
    if b.DIGIT.search(b.strip_slots(plain)): why.append("digit")
    if b.SPLICE.search(plain) and "paragraphs" not in r: why.append("comma splice")
    bad = set(re.findall(r"\{(\w+)\}", plain)) - SLOTS
    if bad: why.append("unknown slot " + ",".join(bad))
    if "{margin} points points" in plain: why.append("points points")
    if r.get("headline") and (len(r["headline"].split()) > 6 or r["headline"] != r["headline"].upper()): why.append("headline caps/length")
    if r.get("situation") in ("draw", "level-overall", "showdown-drawn") and "{winner}" in plain: why.append("winner in a draw")
    op = " ".join(b.norm(r.get("text") or r.get("lead") or r.get("headline") or r.get("standfirst") or r.get("head") or "")[:3])
    if op and op in openers: why.append("same opener as " + openers[op])
    openers.setdefault(op, r["id"])
    if why: errs.append(r["id"] + ": " + ", ".join(why))
print("\n".join(errs) or "LINT OK (%d items)" % len(done))
