#!/usr/bin/env python3
"""Summarise the r87 accessibility sweep (tests/browser/support/a11y-watch-hook.cjs) into one row per distinct finding.

Usage: python3 -I tools/r87_a11y_summary.py <run dir> [<run dir> ...]
Prints a Markdown table grouped by finding type, with the screens and viewports each finding was seen on and one example shot.
"""
import collections
import json
import os
import sys

SKIP = {"focus-order", "undermodal"}
ORDER = ["covered", "focus-behind", "focus-invisible", "focus-noring", "nofocus", "contrast", "smalltap", "tinytext",
         "clipped", "offscreen", "hscroll", "motion"]


def screen(key):
    parts = key.split("|")
    head = parts[3] if len(parts) > 3 else ""
    return (parts[0] or parts[1] or "?") + (f" ({head})" if head else "") + (" LOADING" if key.endswith("LOADING") else "")


def main(dirs):
    groups = collections.OrderedDict()
    for d in dirs:
        path = os.path.join(d, "audit.jsonl")
        if not os.path.exists(path):
            continue
        for line in open(path):
            row = json.loads(line)
            for a in row["audit"]:
                t = a["t"]
                if t in SKIP:
                    continue
                key = (t, a.get("s", ""), a.get("txt", "")[:40])
                g = groups.setdefault(key, {"where": set(), "vps": set(), "d": a.get("d", ""), "shot": os.path.join(os.path.basename(d), row["file"])})
                g["where"].add(screen(row["key"]))
                g["vps"].add(row["vp"])
    def rank(item):
        t = item[0][0]
        return (ORDER.index(t) if t in ORDER else 99 if not t.startswith("axe") else 1, item[0])
    last = None
    for (t, s, txt), g in sorted(groups.items(), key=rank):
        if t != last:
            print(f"\n### {t}\n\n| element | text | detail | screens | viewports | shot |\n|---|---|---|---|---|---|")
            last = t
        print(f"| `{s}` | {txt} | {g['d'][:80]} | {'; '.join(sorted(g['where']))[:160]} | {', '.join(sorted(g['vps']))} | {g['shot']} |")


if __name__ == "__main__":
    main(sys.argv[1:])
