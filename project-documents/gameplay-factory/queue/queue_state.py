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
        retired = set(json.loads((HERE / "RETIRED.json").read_text()).get("items", [])) if (HERE / "RETIRED.json").exists() else set()
        for k in retired:
            if str(k) in o and state[str(o[str(k)]["job"])]["state"] == "waiting":
                state[str(o[str(k)]["job"])]["state"] = "retired"
        pics = json.loads((HERE / "PICTURES.json").read_text()) if (HERE / "PICTURES.json").exists() else {"keys": {}, "approved": {}}
        def held(t):
            if t["mode"] != "study" or t["screen"] not in pics["keys"]: return False
            return pics["keys"][t["screen"]] not in pics["approved"].get("PHONE" if t["stage"] == 4 else "NEXT", [])
        cl = json.loads((HERE / "CLAUDE_LANE.json").read_text()) if (HERE / "CLAUDE_LANE.json").exists() else {}
        claude_items = set(cl.get("haiku", []) + cl.get("sonnet", []))
        held_items = [int(k) for k in o if held(tk[str(o[k]["job"])])]
        ready_chat, ready_work, batches, audits, seen_group = [], [], [], [], set(locked)
        keys = sorted(o, key=int)
        # priority (Nik 2026-10-12): finish started trains first, then stage 3 (match the desktop mockup), then the rest by number
        def _prio(k):
            t = tk[str(o[k]["job"])]
            started = t["mode"] == "code" and len(train_done.get(t["train"]["branch"], ())) > 0
            return (0 if started else 1 if t["stage"] == 3 else 2, int(k))
        keys = sorted(keys, key=_prio)
        s3 = []
        for idx, k in enumerate(keys):
            j = str(o[k]["job"]); t = tk[j]
            if state[j]["state"] != "waiting": continue
            if held(t): continue
            if int(k) in claude_items:
                if t["mode"] == "code": seen_group.add(t["train"]["group"])
                continue
            if t["mode"] == "study":
                ready_work.append(int(k))  # picture studies: Work mode, Sol 6.1 High, one number per message, no cap
                continue
            if t["mode"] == "code":
                g = t["train"]["group"]
                if g in seen_group or ready_open >= 8: continue
                seen_group.add(g)
                if t["stage"] == 3 and not len(train_done.get(t["train"]["branch"], ())):
                    s3.append(int(k)); continue  # stage 3 needs the picture: Work mode, one number per message
                # same-train batch: this item plus the next consecutive waiting items of the SAME train, 3 at most
                b, br = [int(k)], t["train"]["branch"]
                for k2 in sorted(keys[idx + 1:], key=int):
                    t2 = tk[str(o[k2]["job"])]
                    if len(b) >= 3 or t2["mode"] != "code" or t2["train"]["branch"] != br: continue
                    if state[str(o[k2]["job"])]["state"] != "waiting" or int(k2) in claude_items: break
                    b.append(int(k2))
                ready_chat.extend(b); batches.append(b)
            else:  # picture-free audits: chat
                ready_chat.append(int(k)); audits.append(int(k))
        batches += [audits[i:i + 3] for i in range(0, len(audits), 3)]  # picture-free audits: 3 per message
        # one priority order (lead, 2026-10-12): finish trains that one batch completes, then other started trains,
        # then fresh trains, then picture-free audits; Work mode: stage 4 phone studies before stage 5, then screen by screen
        def tier(bt):
            t0 = tk[str(o[str(bt[0])]["job"])]
            if t0["mode"] != "code": return 4
            tr = t0["train"]; started = len(train_done.get(tr["branch"], ())) > 0
            ends = any(tk[str(o[str(n)]["job"])]["train"]["last"] for n in bt)
            return 1 if (started and ends) else 2 if started else 3
        batches.sort(key=lambda bt: (tier(bt), bt[0]))
        ready_chat = [n for bt in batches for n in bt]
        # Nik 2026-10-12: stage 4 and 5 study items are no longer handed out (screen jobs 1695-1708 build straight to the approved pictures); they stay 'waiting'
        ready_work = [n for n in ready_work if tk[str(o[str(n)]["job"])]["stage"] not in (4, 5)]
        scr_rank = {}
        for n in sorted(ready_work):
            scr_rank.setdefault(tk[str(o[str(n)]["job"])]["screen"], len(scr_rank))
        ready_work.sort(key=lambda n: (tk[str(o[str(n)]["job"])]["stage"], scr_rank[tk[str(o[str(n)]["job"])]["screen"]], n))
        # optional Work mode batches: 3 independent studies per message (different screens), in number order
        wb, pool = [], list(ready_work)
        while pool:
            cur, scr = [], set()
            for n in list(pool):
                sc = tk[str(o[str(n)]["job"])]["screen"]
                if sc in scr: continue
                cur.append(n); scr.add(sc); pool.remove(n)
                if len(cur) == 3: break
            wb.append(cur)
        ready_work = s3 + ready_work
        ready = ready_chat + ready_work
        mode = lambda r: tk[str(o[str(r)]["job"])]["mode"]
        taken = [int(k) for k, v in o.items() if state[str(v["job"])]["state"] != "waiting"]
        seq = {"ready": ready,
               "ready_chat": ready_chat, "ready_chat_batches": batches,  # ChatGPT chat: up to 3 consecutive same-train items per message
               "ready_work": ready_work, "ready_work_batches": wb, "ready_work_label": "Sol 6.1 · High",  # Work mode studies, no cap
               "ready_sol": ready_chat,
               "ready_codex": [],
               "held_until_picture": len(held_items),
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
    L += ["", f"Type now, ChatGPT chat (batches of up to 3, in order): {seq.get('ready_chat_batches')}",
          f"Type now, Work mode ({seq.get('ready_work_label')}, one number per message): {seq.get('ready_work')}",
          f"Optional Work mode batches (3 per message): {seq.get('ready_work_batches')}",
          f"Type now, Codex: {seq.get('ready_codex')}"]
    (od / "QUEUE.md").write_text("\n".join(L) + "\n")
    # RUN_REPORT.md: the one file Nik points Claude at when back (generated, free)
    R = [f"# Mega factory run report · {now}", "",
         f"Taken {sum(v['state'] != 'waiting' for v in state.values())} of {len(state)} jobs. By state: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())), "",
         "## By stage", "Stage | name | total | picked up | merged", "--- | --- | --- | --- | ---"]
    names = {"1": "audits", "2": "screen fixes", "3": "mockup match", "4": "phone studies", "5": "desktop studies"}
    for k in sorted(stages): R.append(f"{k} | {names.get(k, '')} | {stages[k]['total']} | {stages[k]['taken']} | {stages[k]['merged']}")
    R += ["", "## Code trains (5 fixes per pull request)", "Train | jobs done | PR | state", "--- | --- | --- | ---"]
    for br, tr in trains.items():
        pr = train_pr[br]
        if train_done[br] or pr:
            R.append(f"{br} | {len(train_done[br]) or len(tr['jobs'])} of {len(tr['jobs'])} | " + (f"[#{pr['number']}]({pr['html_url']})" if pr else "-") + f" | {pstate(pr) if pr else 'on train, no PR yet'}")
    o_items = json.loads(order.read_text())["items"] if order.exists() else {}
    R += ["", "## Finished study and audit jobs", "Number | job | title | state | link", "--- | --- | --- | --- | ---"]
    for k in sorted(o_items, key=int):
        j = str(o_items[k]["job"]); t = tk[j]; v = state[j]
        if t["mode"] != "code" and v["state"] != "waiting":
            R.append(f"{k} | {j} | {t['title']} | {v['state']} | " + (f"[PR #{v['pr']}]({v['pr_url']})" if v["pr"] else (v["branch"] or "")))
    stuck = [(k, o_items[k]["job"]) for k in sorted(o_items, key=int) if state[str(o_items[k]["job"])]["state"] in ("blocked", "branch_only")]
    R += ["", "## Needs a look (blocked, no change needed, needs Team V or mockup)", *(f"- number {k}, job {j}: {state[str(j)]['state']} ({state[str(j)]['branch']})" for k, j in stuck), ""]
    (od / "RUN_REPORT.md").write_text("\n".join(R) + "\n")
    print(json.dumps(counts))

if __name__ == "__main__":
    main()
