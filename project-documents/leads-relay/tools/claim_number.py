#!/usr/bin/env python3
"""Claim the next shared job number (CONTRACT.md section 10).

Run from a checkout of leads/relay. It pulls, takes `next`, records the claim,
commits and pushes. If someone else pushed first, the push is refused, so it
pulls again and takes the new next number. Two claims can never get one number.
"""
import argparse, datetime, json, pathlib, subprocess, sys

PATH = pathlib.Path(__file__).resolve().parents[1] / "JOB_NUMBERS.json"

def git(*a):
    return subprocess.run(["git", *a], capture_output=True, text=True)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--team", choices=["G", "V"], required=True)
    ap.add_argument("--title", required=True)
    args = ap.parse_args()
    for _ in range(5):
        r = git("pull", "--rebase", "-q", "origin", "leads/relay")
        if r.returncode:
            sys.exit("pull failed: " + r.stderr)
        data = json.loads(PATH.read_text())
        n = data["next"]
        data["claims"].append({"number": n, "team": args.team, "title": args.title,
                               "claimed": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
        data["next"] = n + 1
        PATH.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
        git("add", str(PATH))
        git("commit", "-q", "-m", f"Job number {n} claimed by Team {args.team}: {args.title}")
        if git("push", "-q", "origin", "HEAD:leads/relay").returncode == 0:
            print(n)
            return
        git("reset", "-q", "--hard", "HEAD~1")
    sys.exit("could not claim a number after 5 tries")

if __name__ == "__main__":
    main()
