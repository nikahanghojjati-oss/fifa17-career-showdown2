#!/usr/bin/env python3
"""Collect job progress from the ```progress fenced JSON block in the body of every open PR into progress/ (untracked).
Job owners edit their PR description (GitHub MCP update_pull_request): no push, no CI run. Newest `updated` wins per job.
Needs GH_TOKEN and GITHUB_REPOSITORY. Prints how many jobs reported (the poller stops when it is 0)."""
import json, os, re, subprocess, glob
REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "progress")

r = subprocess.run(["gh", "api", f"repos/{REPO}/pulls?state=open&per_page=100"], capture_output=True, text=True)
prs = json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else []
os.makedirs(D, exist_ok=True)
for f in glob.glob(os.path.join(D, "job-*.json")):
    os.remove(f)
best = {}
for pr in prs:
    m = re.search(r"```progress\s*\n(.*?)```", pr.get("body") or "", re.S)
    if not m:
        continue
    try:
        d = json.loads(m.group(1))
        n = int(d["job"])
        assert isinstance(d["steps"], list) and d["steps"]
    except Exception:
        continue
    d.setdefault("updated", pr["updated_at"])
    d["pr"] = pr["number"]
    if n not in best or d["updated"] > best[n]["updated"]:
        best[n] = d
for n, d in best.items():
    json.dump(d, open(os.path.join(D, f"job-{n}.json"), "w"), indent=1)
# Live state of every job PR (open: draft / checks running / failing / green; merged), for the "Jobs still open" table.
live = {}
def pr_state(pr):
    if pr.get("draft"):
        return "draft"
    cr = subprocess.run(["gh", "api", f"repos/{REPO}/commits/{pr['head']['sha']}/check-runs?per_page=100", "--jq", "[.check_runs[]|.status+\":\"+(.conclusion//\"\")]"], capture_output=True, text=True)
    try:
        runs = json.loads(cr.stdout)
    except Exception:
        return "open"
    if any(x.endswith(":failure") for x in runs):
        return "failing"
    if not runs or any(not x.startswith("completed") for x in runs):
        return "running"
    return "green"
for pr in prs:
    m = re.search(r"job-(\d+)", pr["head"]["ref"])
    if m and pr["base"]["ref"] == "gameplay/recovery-v1":
        live[int(m.group(1))] = {"pr": pr["number"], "state": pr_state(pr)}
r2 = subprocess.run(["gh", "api", f"repos/{REPO}/pulls?state=closed&base=gameplay/recovery-v1&per_page=40"], capture_output=True, text=True)
for pr in (json.loads(r2.stdout) if r2.returncode == 0 and r2.stdout.strip() else []):
    m = re.search(r"job-(\d+)", pr["head"]["ref"])
    if m and pr.get("merged_at") and int(m.group(1)) not in live:
        live[int(m.group(1))] = {"pr": pr["number"], "state": "merged"}
json.dump(live, open(os.path.join(D, "prs.json"), "w"), indent=1)
print(len(best))
