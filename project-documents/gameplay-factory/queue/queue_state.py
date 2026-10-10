#!/usr/bin/env python3
"""Derives live mega-factory queue state from GitHub (branches and PRs). No Claude usage, no hand-written numbers.

  GH_TOKEN=... python3 queue_state.py [--repo owner/name] [--out-dir DIR]

Writes QUEUE_STATE.json and QUEUE.md next to QUEUE.json. A ticket is
  waiting   no branch with its prefix yet
  current   it is the first waiting ticket of its slot (what the slot's chat will pick next)
  pr_open / merged / closed / blocked / branch_only  from the PR titled "JOB-NNNN ..." or the branch name.
"""
import argparse, json, pathlib, subprocess, datetime, re

HERE = pathlib.Path(__file__).resolve().parent

def gh(path, pages=5):
    out = []
    for pg in range(1, pages + 1):
        r = subprocess.run(["gh", "api", f"{path}&page={pg}"], capture_output=True, text=True)
        if r.returncode:
            raise SystemExit("gh failed: " + r.stderr[:300])
        chunk = json.loads(r.stdout or "[]")
        out.extend(chunk)
        if len(chunk) < 100:
            break
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="nikahanghojjati-oss/fifa17-career-showdown2")
    ap.add_argument("--out-dir", default=str(HERE))
    a = ap.parse_args()
    q = json.loads((HERE / "QUEUE.json").read_text())
    branches = [b["name"] for b in gh(f"repos/{a.repo}/branches?per_page=100")]
    prs = gh(f"repos/{a.repo}/pulls?state=all&per_page=100&sort=updated&direction=desc")
    by_job = {}
    for p in prs:
        m = re.match(r"\s*JOB-(\d{4})\b", p["title"])
        if m:
            cur = by_job.get(m.group(1))
            if not cur or p["updated_at"] > cur["updated_at"]:
                by_job[m.group(1)] = p
    state = {}
    for num, t in q["tickets"].items():
        pre = t["prefix"]
        bs = [b for b in branches if b.startswith(pre)]
        pr = by_job.get(num)
        if pr:
            st = "merged" if pr.get("merged_at") else ("pr_open" if pr["state"] == "open" else "closed")
        elif any(b.endswith("-blocked") for b in bs):
            st = "blocked"
        elif bs:
            st = "branch_only"
        else:
            st = "waiting"
        state[num] = {"state": st, "pr": pr["number"] if pr else None, "pr_url": pr["html_url"] if pr else None,
                      "branch": bs[0] if bs else None}
    slots = {}
    for s, sl in q["slots"].items():
        jobs = [str(j) for j in sl["jobs"]]
        nxt = next((j for j in jobs if state[j]["state"] == "waiting"), None)
        done = sum(1 for j in jobs if state[j]["state"] != "waiting")
        slots[s] = {"kind": sl["kind"], "next_job": nxt, "taken": done, "total": len(jobs)}
    if q["slots"]:
        rev = {s: sl for s, sl in slots.items() if sl["kind"] == "reviewer"}
        open_prs = [n for n, v in state.items() if v["state"] == "pr_open"]
        for s in rev: slots[s]["reviews_waiting"] = len(open_prs)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    counts = {}
    for v in state.values(): counts[v["state"]] = counts.get(v["state"], 0) + 1
    stages = {}
    for num, t in q["tickets"].items():
        st = stages.setdefault(str(t["stage"]), {"total": 0, "taken": 0, "merged": 0})
        st["total"] += 1
        if state[num]["state"] != "waiting": st["taken"] += 1
        if state[num]["state"] == "merged": st["merged"] += 1
    out = {"updated": now, "counts": counts, "stages": stages, "slots": slots, "tickets": state}
    od = pathlib.Path(a.out_dir)
    (od / "QUEUE_STATE.json").write_text(json.dumps(out, indent=1) + "\n")
    L = [f"# Mega factory queue · updated {now}", "",
         "Stage | tickets | picked up | merged", "--- | --- | --- | ---"]
    for k in sorted(stages): L.append(f"{k} | {stages[k]['total']} | {stages[k]['taken']} | {stages[k]['merged']}")
    L += ["", "Slot | next job | picked up", "--- | --- | ---"]
    for s, v in slots.items():
        L.append(f"{s} | {v['next_job'] or ('reviewer' if v['kind']=='reviewer' else 'empty')} | {v['taken']}/{v['total']}")
    (od / "QUEUE.md").write_text("\n".join(L) + "\n")
    print(json.dumps(counts))

if __name__ == "__main__":
    main()
