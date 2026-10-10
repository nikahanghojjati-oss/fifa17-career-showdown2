#!/usr/bin/env python3
"""Derives live mega-factory queue state from GitHub (branches, PRs, train branches). No Claude usage.

  GH_TOKEN=... python3 queue_state.py [--repo owner/name] [--out-dir DIR]

Writes QUEUE_STATE.json and QUEUE.md. Job states:
  waiting     nothing on GitHub yet
  on_train    code job: its status file is committed on its train branch, no train PR yet
  branch_only study/audit: branch exists, no PR (e.g. "no change needed")
  blocked     study/audit branch ending -blocked
  pr_open / merged / closed   from the PR (code jobs: the train PR; study/audit: the job PR "JOB-N ...")
Code jobs travel in trains of 5 per lock group (branch gameplay/train-<group>-<k>), one draft PR per train.
sequence.ready_sol / ready_codex list the numbers typable now; rule: a group's first waiting item is ready when its
previous train is merged or closed (no open train PR for the group); at most 8 READY (non-draft) open train PRs.
"""
import argparse, json, pathlib, subprocess, datetime, re

HERE = pathlib.Path(__file__).resolve().parent
BASE = "gameplay/bug-list-1"

def api(path):
    r = subprocess.run(["gh", "api", path], capture_output=True, text=True)
    if r.returncode:
        return None
    return json.loads(r.stdout or "null")

def paged(path, pages=15):
    out = []
    for pg in range(1, pages + 1):
        chunk = api(f"{path}&page={pg}")
        if chunk is None:
            raise SystemExit("gh failed: " + path)
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
    tk = q["tickets"]
    branches = [b["name"] for b in paged(f"repos/{a.repo}/branches?per_page=100")]
    prs = paged(f"repos/{a.repo}/pulls?state=all&per_page=100&sort=updated&direction=desc")
    by_job, by_head = {}, {}
    for p in prs:
        m = re.match(r"\s*JOB-(\d{4})\b", p["title"])
        if m:
            cur = by_job.get(m.group(1))
            if not cur or p["updated_at"] > cur["updated_at"]: by_job[m.group(1)] = p
        h = p["head"]["ref"]
        if h not in by_head or p["updated_at"] > by_head[h]["updated_at"]: by_head[h] = p
    def pstate(p):
        return "merged" if p.get("merged_at") else ("pr_open" if p["state"] == "open" else "closed")
    trains = {}
    for t in tk.values():
        if t["mode"] == "code": trains[t["train"]["branch"]] = t["train"]
    train_done, train_pr = {}, {}
    for br in trains:
        pr = by_head.get(br)
        train_pr[br] = pr
        done = set()
        if br in branches:
            cmp_ = api(f"repos/{a.repo}/compare/{BASE}...{br}")
            for f in (cmp_ or {}).get("files", []):
                m = re.search(r"status/JOB-(\d{4})\.md$", f["filename"])
                if m: done.add(m.group(1))
        train_done[br] = done
    state = {}
    for num, t in tk.items():
        if t["mode"] == "code":
            br = t["train"]["branch"]; pr = train_pr[br]
            if pr:
                st = pstate(pr)
            elif num in train_done[br]:
                st = "on_train"
            else:
                st = "waiting"
            state[num] = {"state": st, "pr": pr["number"] if pr else None, "draft": bool(pr and pr.get("draft")),
                          "pr_url": pr["html_url"] if pr else None, "branch": br if br in branches else None}
        else:
            pre = t["prefix"]
            bs = [b for b in branches if b.startswith(pre)]
            pr = by_job.get(num)
            if pr: st = pstate(pr)
            elif any(b.endswith("-blocked") for b in bs): st = "blocked"
            elif bs: st = "branch_only"
            else: st = "waiting"
            state[num] = {"state": st, "pr": pr["number"] if pr else None, "draft": bool(pr and pr.get("draft")),
                          "pr_url": pr["html_url"] if pr else None, "branch": bs[0] if bs else None}
    slots = {}
    # sequence
    seq = {}
    order = HERE / "ORDER.json"
    if order.exists():
        o = json.loads(order.read_text())["items"]
        locked, ready_open = set(), 0
        for br, tr in trains.items():
            pr = train_pr[br]
            if pr and pr["state"] == "open":
                locked.add(tr["group"])
                if not pr.get("draft"): ready_open += 1
        ready, seen_group = [], set(locked)
        for k in sorted(o, key=int):
            j = str(o[k]["job"]); t = tk[j]
            if state[j]["state"] != "waiting": continue
            if t["mode"] == "code":
                g = t["train"]["group"]
                if g in seen_group or ready_open >= 8: continue
                seen_group.add(g)
            ready.append(int(k))
        mode = lambda r: tk[str(o[str(r)]["job"])]["mode"]
        taken = [int(k) for k, v in o.items() if state[str(v["job"])]["state"] != "waiting"]
        seq = {"ready": ready[:12],
               "ready_sol": ready[:12],  # every item runs in a GPT-6 Sol chat (Codex web cannot pick branches)
               "ready_codex": [],
               "open_code_prs": ready_open, "open_train_prs": len(locked),
               "next_free": ready[0] if ready else None, "highest_taken": max(taken or [0]), "total": len(o),
               "states": {k: state[str(v["job"])]["state"] for k, v in o.items()}}
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    counts, stages = {}, {}
    for num, v in state.items():
        counts[v["state"]] = counts.get(v["state"], 0) + 1
        st = stages.setdefault(str(tk[num]["stage"]), {"total": 0, "taken": 0, "merged": 0})
        st["total"] += 1
        if v["state"] != "waiting": st["taken"] += 1
        if v["state"] == "merged": st["merged"] += 1
    out = {"sequence": seq, "updated": now, "counts": counts, "stages": stages, "slots": slots,
           "trains": {br: {"jobs": tr["jobs"], "done": sorted(train_done[br]), "pr": (train_pr[br] or {}).get("number"),
                           "state": pstate(train_pr[br]) if train_pr[br] else None} for br, tr in trains.items()},
           "tickets": state}
    od = pathlib.Path(a.out_dir)
    (od / "QUEUE_STATE.json").write_text(json.dumps(out, indent=1) + "\n")
    L = [f"# Mega factory queue · updated {now}", "", "Stage | tickets | picked up | merged", "--- | --- | --- | ---"]
    for k in sorted(stages): L.append(f"{k} | {stages[k]['total']} | {stages[k]['taken']} | {stages[k]['merged']}")
    L += ["", f"Type now (Sol chat): {seq.get('ready_sol')}", f"Type now (Codex): {seq.get('ready_codex')}"]
    (od / "QUEUE.md").write_text("\n".join(L) + "\n")
    print(json.dumps(counts))

if __name__ == "__main__":
    main()
