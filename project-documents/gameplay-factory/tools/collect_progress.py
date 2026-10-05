#!/usr/bin/env python3
"""Collect progress/job-NN.json from the head branch of every open PR into progress/ (untracked), newest `updated` wins.
Needs GH_TOKEN and GITHUB_REPOSITORY. Job owners only commit the file on their own job branch; nobody pushes to the factory branch.
Prints the number of progress files found (the poller stops when it is 0)."""
import json, os, subprocess, sys, base64, glob
REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "progress")
PATH = "project-documents/gameplay-factory/progress"


def api(p):
    r = subprocess.run(["gh", "api", p], capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None


os.makedirs(D, exist_ok=True)
for f in glob.glob(os.path.join(D, "job-*.json")):
    os.remove(f)
best = {}
for pr in api(f"repos/{REPO}/pulls?state=open&per_page=100") or []:
    ref = pr["head"]["ref"]
    if ref == "factory/gameplay-v1":
        continue
    if pr["head"]["repo"] is None or pr["head"]["repo"]["full_name"] != REPO:
        continue
    for e in api(f"repos/{REPO}/contents/{PATH}?ref={ref}") or []:
        if not (isinstance(e, dict) and e["name"].startswith("job-") and e["name"].endswith(".json")):
            continue
        c = api(f"repos/{REPO}/contents/{PATH}/{e['name']}?ref={ref}")
        try:
            data = json.loads(base64.b64decode(c["content"]))
            if e["name"] not in best or data.get("updated", "") > best[e["name"]].get("updated", ""):
                best[e["name"]] = data
        except Exception:
            pass
for n, d in best.items():
    json.dump(d, open(os.path.join(D, n), "w"), indent=1)
print(len(best))
