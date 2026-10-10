#!/usr/bin/env python3
"""Mega factory tracker data. Zero Claude usage; run by the factory poller every round.

  GH_TOKEN=... python3 tools/mega_tracker.py [--repo owner/name] [--out mega/MEGA_TRACKER.json]

Reads queue/ORDER.json (item number -> job) and derives each item's exact stage from GitHub only:
  waiting      no branch qa/job-NNNN-* and no PR
  no_pr        branch whose status/JOB-N.md says "no change needed", "needs mockup" or "needs Team V" (finished, no PR)
  on_train     code job finished on its train branch (status file there), the train PR is not open yet
  started      branch exists (a chat claimed the number), no PR yet
  blocked      branch qa/job-NNNN-blocked (the worker could not finish)
  draft        PR open as a draft (worker done; the Gate skips drafts)
  queued       code PR marked ready, checks not reported yet
  ci_running   PR open, checks running/queued (or PR just opened, checks not reported yet)
  ci_failed    PR open, a check failed
  ready        PR open, checks green or the PR has no checks, no "Sol review" comment yet
  reviewed     PR open with a "Sol review" comment
  merged       PR merged into a staging branch (not main)
  live         merged into main; "live_in" is the release from RELEASED.json when known
  closed       PR closed unmerged
Keeps first-seen times and a rolling event log between runs, so jobs/hour is exact to the poll interval.
"""
import argparse, json, pathlib, subprocess, datetime, re, time

HERE = pathlib.Path(__file__).resolve().parent
GF = HERE.parent
STAGE_NAMES = {"1": "Gameplay audits", "2": "Screen fixes", "3": "Match desktop to mockups",
               "4": "Phone mockup studies", "5": "Improved desktop studies"}

def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def gh(path, paginate=False, pages=12):
    out = []
    for pg in range(1, pages + 1):
        sep = "&" if "?" in path else "?"
        r = subprocess.run(["gh", "api", f"{path}{sep}page={pg}" if paginate else path],
                           capture_output=True, text=True)
        if r.returncode:
            raise SystemExit("gh failed: " + r.stderr[:300])
        data = json.loads(r.stdout or "[]")
        if not paginate:
            return data
        out.extend(data)
        if len(data) < 100:
            break
    return out

def gh_try(path):
    r = subprocess.run(["gh", "api", path], capture_output=True, text=True)
    return json.loads(r.stdout) if r.returncode == 0 and r.stdout.strip() else None

def no_pr_status(repo, job, branch):
    """Text of status/JOB-N.md on the branch when it says the job is finished without a PR, else None."""
    d = gh_try(f"repos/{repo}/contents/project-documents/gameplay-factory/status/JOB-{job}.md?ref={branch}")
    if not d or not d.get("content"):
        return None
    import base64
    t = base64.b64decode(d["content"]).decode("utf8", "replace").lower()
    for key, label in (("no change needed", "no change needed"), ("needs mockup", "needs a mockup"), ("needs team v", "needs Team V")):
        if key in t:
            return label
    return None

def ci_for(repo, sha):
    d = gh(f"repos/{repo}/commits/{sha}/check-runs?per_page=100")
    runs = d.get("check_runs", [])
    if not runs:
        return "none", 0, 0
    bad = sum(1 for r in runs if r["status"] == "completed" and r["conclusion"] in ("failure", "timed_out", "cancelled", "action_required", "startup_failure"))
    pend = sum(1 for r in runs if r["status"] != "completed")
    if bad:
        return "failed", len(runs), bad
    if pend:
        return "running", len(runs), pend
    return "green", len(runs), 0

BAR = 24
ICON = {"on_train": "🚂", "no_pr": "🏁", "draft": "📝", "queued": "⏳", "waiting": "⬜", "started": "🟦", "ci_running": "🟨", "ci_failed": "🟥", "ready": "🟩", "reviewed": "🟪",
        "merged": "✅", "live": "🚀", "blocked": "🟧", "closed": "⚫"}
LABEL = {"on_train": "done, on the train branch, no PR yet", "no_pr": "done, no PR (no change / needs Team V)", "draft": "worker done, draft PR open", "queued": "ready for checks, not started", "waiting": "waiting", "started": "started, no PR yet", "ci_running": "PR open, checks running",
         "ci_failed": "PR open, checks FAILED", "ready": "PR open, checks green, waiting for review",
         "reviewed": "reviewed by Sol, waiting for the lead", "merged": "merged to staging branch",
         "live": "live in a release", "blocked": "blocked", "closed": "closed without merge"}
ORDER = ["live", "merged", "no_pr", "on_train", "reviewed", "ready", "queued", "ci_running", "draft", "ci_failed", "blocked", "started", "closed", "waiting"]

def write_md(d, path):
    """GitHub-rendered fallback of the tracker page (always works, first party)."""
    c, g, r = d["counts"], d["gates"], d["rate"]
    done = c.get("merged", 0) + c.get("live", 0) + c.get("no_pr", 0)
    L = [f"# Mega factory tracker · updated {d['updated']}", "",
         f"**Type now:** {', '.join(str(n) for n in (g.get('ready_sol') or []) + (g.get('ready_codex') or []) or g['ready']) or 'none free (wait for a PR to merge)'}",
         f"**Next free number:** {d['next_free']} · **highest taken:** {d['highest_taken']} of {d['total']}",
         f"**Code PRs open:** {g['open_code_prs']} of {g['cap']} · area locks: {', '.join(g['area_locks']) or 'none'}",
         f"**Rate:** {r['claimed_last_10min']} claimed in 10 min · {r['claimed_last_hour']} in 1 h · {r['merged_last_hour']} merged in 1 h",
         "", f"**Finished (merged or live): {done} of {d['total']}**", "", "State | count", "--- | ---"]
    for s in ORDER:
        if c.get(s): L.append(f"{ICON[s]} {LABEL[s]} | {c[s]}")
    L += ["", "Stage | total | merged/live | in flight | waiting", "--- | --- | --- | --- | ---"]
    for k in sorted(d["stages"]):
        st = d["stages"][k]; sv = st["states"]
        fin = sv.get("merged", 0) + sv.get("live", 0) + sv.get("no_pr", 0); wt = sv.get("waiting", 0)
        L.append(f"{k} {st['name']} | {st['total']} | {fin} | {st['total'] - fin - wt - sv.get('closed', 0)} | {wt}")
    bad = [(k, v) for k, v in d["items"].items() if v["state"] in ("ci_failed", "blocked")]
    if bad:
        L += ["", "## Needs attention", ""]
        for k, v in bad: L.append(f"- {ICON[v['state']]} **{k}** · Job {v['job']} · {v['title']} · {LABEL[v['state']]}" + (f" · [PR #{v['pr']}]({v['pr_url']})" if v.get("pr") else ""))
    if d["stale_started"]:
        L += ["", "Started over 45 min ago with no PR yet: " + ", ".join(str(n) for n in d["stale_started"])]
    L += ["", "## In flight", ""]
    for k in sorted(d["items"], key=int):
        v = d["items"][k]
        if v["state"] in ("started", "on_train", "draft", "queued", "ci_running", "ci_failed", "ready", "reviewed", "blocked"):
            L.append(f"- {ICON[v['state']]} **{k}** · Job {v['job']} · {v['title']} · {LABEL[v['state']]}" + (f" · [PR #{v['pr']}]({v['pr_url']})" if v.get("pr") else ""))
    L += ["", "## Latest changes", ""]
    for e in reversed(d["events"][-20:]):
        L.append(f"- {e['at']} · {e['item']} (Job {e['job']}): {e['from']} → {e['to']}")
    path.write_text("\n".join(L) + "\n")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="nikahanghojjati-oss/fifa17-career-showdown2")
    ap.add_argument("--out", default=str(GF / "mega" / "MEGA_TRACKER.json"))
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    prev = json.loads(out.read_text()) if out.exists() else {}
    prev_items = prev.get("items", {})
    order = json.loads((GF / "queue" / "ORDER.json").read_text())["items"]
    released = {}
    rp = GF / "RELEASED.json"
    if rp.exists():
        released = json.loads(rp.read_text()).get("jobs", {})
    t = now_iso()

    refs = []
    for ns in ("qa", "gameplay", "study"):
        refs += gh(f"repos/{a.repo}/git/matching-refs/heads/{ns}/job-", paginate=True)
    branches = [r["ref"][len("refs/heads/"):] for r in refs]
    shas = {r["ref"][len("refs/heads/"):]: r["object"]["sha"] for r in refs}
    prs = gh(f"repos/{a.repo}/pulls?state=all&per_page=100&sort=updated&direction=desc", paginate=True)
    by_job = {}
    for p in prs:
        m = re.match(r"\s*JOB-(\d{4})\b", p["title"]) or re.match(r"(?:qa|gameplay|study)/job-(\d{4})-", p["head"]["ref"])
        if m:
            cur = by_job.get(m.group(1))
            if not cur or p["updated_at"] > cur["updated_at"]:
                by_job[m.group(1)] = p
    by_head = {}
    for p in prs:
        h = p["head"]["ref"]
        if h not in by_head or p["updated_at"] > by_head[h]["updated_at"]:
            by_head[h] = p
    qs_tickets = {}
    qsp = GF / "queue" / "QUEUE_STATE.json"
    if qsp.exists():
        try: qs_tickets = json.loads(qsp.read_text()).get("tickets", {})
        except Exception: pass
    ci_cache = {}
    # Sol review comments, last 3 days, one call set
    since = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    reviewed_prs = set()
    for c in gh(f"repos/{a.repo}/issues/comments?since={since}&per_page=100", paginate=True):
        if c["body"].lstrip().lower().startswith("sol review"):
            reviewed_prs.add(int(c["issue_url"].rsplit("/", 1)[1]))

    items, events = {}, list(prev.get("events", []))
    for k in sorted(order, key=int):
        o = order[k]
        job = str(o["job"])
        pre = o["prefix"]
        bs = [b for b in branches if b.startswith(pre)]
        # code jobs travel in trains of 5: the train PR (head = train branch) carries all five jobs
        pr = by_head.get(pre) if o.get("mode") == "code" else by_job.get(job)
        old = prev_items.get(k, {})
        it = {"job": o["job"], "stage": o["stage"], "title": o["title"], "mode": o.get("mode"), "group": o.get("group")}
        if pr:
            n = pr["number"]
            it.update(pr=n, pr_url=pr["html_url"], base=pr["base"]["ref"], branch=pr["head"]["ref"])
            if pr.get("merged_at"):
                # code jobs merge into gameplay/bug-list-1 first; they are live once RELEASED.json names their release
                it["state"] = "live" if (pr["base"]["ref"] == "main" or job in released) else "merged"
                if it["state"] == "live":
                    it["live_in"] = released.get(job, "next release")
                it["merged_at"] = pr["merged_at"]
            elif pr["state"] == "closed":
                it["state"] = "closed"
            else:
                sha = pr["head"]["sha"]
                if pr.get("draft"):
                    ci, total, extra = "draft", 0, 0
                elif old.get("ci_sha") == sha and old.get("ci") in ("green", "failed", "none") and old.get("state") != "ci_running":
                    ci, total, extra = old["ci"], old.get("ci_total", 0), old.get("ci_extra", 0)
                else:
                    if sha not in ci_cache:
                        ci_cache[sha] = ci_for(a.repo, sha)
                    ci, total, extra = ci_cache[sha]
                it.update(ci=ci, ci_sha=sha, ci_total=total, ci_extra=extra)
                it["draft"] = bool(pr.get("draft"))
                if it["draft"]:
                    ci, total, extra = "draft", 0, 0
                elif ci == "none" and o.get("mode") == "code":
                    ci = "queued"
                it["ci"] = ci
                if n in reviewed_prs:
                    it["state"] = "reviewed" if ci != "failed" else "ci_failed"
                    it["reviewed"] = True
                elif it["draft"]:
                    it["state"] = "draft"
                elif ci == "failed":
                    it["state"] = "ci_failed"
                elif ci == "queued":
                    it["state"] = "queued"
                elif ci == "running":
                    it["state"] = "ci_running"
                else:
                    it["state"] = "ready"
            it["pr_opened_at"] = pr["created_at"]
        elif o.get("mode") == "code":
            if qs_tickets.get(job, {}).get("state") == "on_train":
                it.update(state="on_train", branch=pre)
            else:
                it["state"] = "waiting"
        elif any(b.endswith("-blocked") for b in bs):
            it.update(state="blocked", branch=[b for b in bs if b.endswith("-blocked")][0])
        elif bs:
            sha = shas.get(bs[0])
            if old.get("branch") == bs[0] and old.get("branch_sha") == sha and "no_pr_reason" in old:
                reason = old["no_pr_reason"]
            else:
                reason = no_pr_status(a.repo, o["job"], bs[0]) or ""
            it.update(state="no_pr" if reason else "started", branch=bs[0], branch_sha=sha, no_pr_reason=reason)
        else:
            it["state"] = "waiting"
        if it["state"] != "waiting":
            it["first_seen"] = old.get("first_seen") or (pr["created_at"] if pr else t)
        if old.get("state") != it["state"] and not (old.get("state") is None and it["state"] == "waiting"):
            events.append({"at": t, "item": int(k), "job": o["job"], "from": old.get("state", "waiting"), "to": it["state"]})
        if old.get("state") == it["state"]:
            it["since"] = old.get("since", t)
        else:
            it["since"] = t
        items[k] = it
    events = events[-300:]

    states = {}
    stages = {}
    for k, it in items.items():
        states[it["state"]] = states.get(it["state"], 0) + 1
        s = stages.setdefault(str(it["stage"]), {"name": STAGE_NAMES.get(str(it["stage"]), ""), "total": 0, "states": {}})
        s["total"] += 1
        s["states"][it["state"]] = s["states"].get(it["state"], 0) + 1
    def started_since(mins):
        cut = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=mins)).strftime("%Y-%m-%dT%H:%M:%SZ")
        return sum(1 for e in events if e["from"] == "waiting" and e["at"] >= cut)
    def merged_since(mins):
        cut = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=mins)).strftime("%Y-%m-%dT%H:%M:%SZ")
        return sum(1 for e in events if e["to"] in ("merged", "live") and e["at"] >= cut)
    next_free = next((int(k) for k in sorted(items, key=int) if items[k]["state"] == "waiting"), None)
    highest = max([int(k) for k, v in items.items() if v["state"] != "waiting"] or [0])
    # Gates: a train PR (5 code jobs) is "ready" when not a draft; at most 8 ready train PRs; one open train PR per group
    CAP = 8
    train_states = ("draft", "queued", "ci_running", "ci_failed", "ready", "reviewed")
    trains_open = {}
    for k, v in items.items():
        if v["mode"] == "code" and v["state"] in train_states:
            trains_open[v["pr"]] = {"group": v["group"], "draft": bool(v.get("draft")), "branch": v.get("branch")}
    open_code = [n for n, t in trains_open.items() if not t["draft"]]
    open_all = list(trains_open)
    locked = {t["group"]: n for n, t in trains_open.items()}
    started_code = [int(k) for k, v in items.items() if v["mode"] == "code" and v["state"] == "on_train"]
    ready = [int(k) for k, v in items.items() if v["state"] == "waiting"][:12]
    qs = GF / "queue" / "QUEUE_STATE.json"  # the queue owner's list wins, so this page never disagrees with the chats
    if qs.exists():
        try:
            sq = json.loads(qs.read_text())["sequence"]
            ready = sq["ready"]
            ready_sol = sq.get("ready_sol", [r for r in ready if items[str(r)]["mode"] != "code"])
            ready_codex = sq.get("ready_codex", [r for r in ready if items[str(r)]["mode"] == "code"])
        except Exception: pass
    ready_sol = locals().get("ready_sol", [r for r in ready if items[str(r)]["mode"] != "code"])[:12]
    ready_codex = locals().get("ready_codex", [r for r in ready if items[str(r)]["mode"] == "code"])[:12]
    gates = {"cap": CAP, "open_code_prs": len(open_code), "open_train_prs": open_all,
             "on_train_no_pr": started_code, "draft_code_prs": len(open_all) - len(open_code), "area_locks": {g: n for g, n in locked.items() if g},
             "ready": ready[:12], "ready_sol": ready_sol, "ready_codex": ready_codex}
    # stale: claimed over 45 minutes ago and still no PR
    stale = [int(k) for k, v in items.items() if v["state"] == "started"
             and (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(v["since"].replace("Z", "+00:00"))).total_seconds() > 2700]
    doc = {"updated": t, "total": len(items), "next_free": next_free, "highest_taken": highest,
           "counts": states, "stages": stages, "stale_started": stale, "gates": gates,
           "rate": {"claimed_last_hour": started_since(60), "claimed_last_10min": started_since(10),
                    "merged_last_hour": merged_since(60)},
           "events": events, "items": items}
    out.parent.mkdir(parents=True, exist_ok=True)
    # Heartbeat: when nothing but the clock moved, keep the old file until it is 10 minutes old (fewer commits)
    def core(d): return {k: v for k, v in d.items() if k != "updated"}
    if prev and core(prev) == core(doc):
        age = (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(prev["updated"].replace("Z", "+00:00"))).total_seconds()
        if age < 600:
            print(json.dumps(states) + " (unchanged)")
            return
    # indent=0 puts "updated" on its own line, so the poller's diff guard can ignore clock-only changes
    out.write_text(json.dumps(doc, indent=0) + "\n")
    write_md(doc, out.with_name("MEGA_TRACKER.md"))
    print(json.dumps(states))

if __name__ == "__main__":
    main()
