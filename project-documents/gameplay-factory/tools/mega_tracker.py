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

class Ctx:
    """Caches kept for the life of one process, so a looping run re-asks GitHub cheaply (a 304 is free)."""
    def __init__(self, repo):
        self.repo = repo
        self.et = {}          # path -> (etag, data)
        self.prs = {}         # number -> PR object from the list endpoint
        self.last_pr_scan = None
        self.reviewed = set()
        self.verdicts = {}    # PR number -> ok / ok_notes / needs_changes (from the "Sol review" comment)
        self.last_comment_scan = None
        self.ci = {}          # head sha -> (ci, total, extra, fetched_at)
        self.train_done = {}  # train branch -> (sha, set of job numbers with a status file)
        self.rounds = 0

def api(ctx, path):
    """GET with If-None-Match. Returns (changed, data); a 304 returns (False, cached data)."""
    et, data = ctx.et.get(path, (None, None))
    cmd = ["gh", "api", "-i", path] + (["-H", f"If-None-Match: {et}"] if et else [])
    r = subprocess.run(cmd, capture_output=True, text=True)
    head, _, body = r.stdout.replace("\r\n", "\n").partition("\n\n")
    status = head.split("\n", 1)[0] if head else ""
    if " 304 " in status + " " and data is not None:
        return False, data
    if r.returncode or " 200 " not in status + " ":
        raise SystemExit("gh failed: " + (r.stderr or status)[:300])
    m = re.search(r"(?im)^etag:\s*(.+)$", head)
    data = json.loads(body or "[]")
    if m:
        ctx.et[path] = (m.group(1).strip(), data)
    return True, data

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
         f"**Type now ({g.get('ready_total', len(g['ready']))} free):** {', '.join(str(n) for n in (g.get('ready_all') or g['ready'])[:100]) or 'none free (wait for a PR to merge)'}",
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

LANE_NAMES = {"gpt1": "ChatGPT account 1 (odd numbers)", "gpt2": "ChatGPT account 2 (even numbers)", "chat_jobs": "ChatGPT chat (job numbers 1000+)",
              "codex": "Codex", "work": "ChatGPT Work mode", "claude": "Claude (Haiku, Sonnet, Opus)", "other": "Other"}
LANE_ORDER = ["gpt1", "gpt2", "chat_jobs", "codex", "work", "claude", "other"]
DONE_STATES = ("merged", "live", "no_pr")
LEAD_STATES = ("draft", "queued", "ready", "reviewed", "on_train")
WORKER_DONE = ("wait_v", "audit_batch", "on_train", "draft", "queued", "ci_running", "ci_failed", "ready", "reviewed")

def lane_of_text(t):
    t = t.lower()
    if "codex" in t: return "codex"
    if "claude" in t or "haiku" in t or "opus" in t: return "claude"
    if "blue team" in t or "**blue**" in t: return "chat_jobs"
    if "work mode" in t or "green" in t or "yellow" in t or "luna" in t or "astra" in t or "**work**" in t: return "work"
    if "chat" in t: return "chat_jobs"
    return "other"

def load_direct():
    """Numbered job files 1000+ that are not queue items: lane from the ticket's Lane row, dependencies from its Depends-on cell."""
    order = json.loads((GF / "queue" / "ORDER.json").read_text())["items"]
    qj = {str(v["job"]) for v in order.values()}
    out = {}
    for f in sorted((GF / "jobs").glob("JOB-*.md")):
        m = re.search(r"JOB-(\d+)\.md$", f.name)
        if not m or int(m.group(1)) < 1000 or m.group(1) in qj:
            continue
        t = f.read_text(errors="replace")[:3500]
        row = re.search(r"\| Lane \|[^\n]*\n\|[ \-|]*\n\| (.*?) \| (.*?) \|", t)
        title = (re.search(r"^#\s*JOB-\d+\s*[·\-:]\s*(.+)$", t, re.M) or [None, ""])[1].strip()
        lane_text = row.group(1) if row else t[:300]
        dep = row.group(2) if row else "none"
        out[m.group(1)] = {"job": int(m.group(1)), "title": title[:90], "lane": lane_of_text(lane_text),
                           "deps": re.findall(r"\b(1\d{3})\b", dep) if dep.strip().lower() != "none" else []}
    return out

def status_state(job):
    f = GF / "status" / f"JOB-{job}.md"
    try: m = re.search(r"^State:\s*(.+)$", f.read_text(errors="replace"), re.M)
    except OSError: return ""
    return m.group(1).strip().upper() if m else ""

def jload_claude():
    try:
        l = json.loads((GF / "queue" / "CLAUDE_LANE.json").read_text())
        return l.get("haiku", []) + l.get("sonnet", [])
    except Exception:
        return []

def run_round(a, ctx):
    ctx.rounds += 1
    out = pathlib.Path(a.out)
    prev = json.loads(out.read_text()) if out.exists() else {}
    prev_items = prev.get("items", {})
    order = json.loads((GF / "queue" / "ORDER.json").read_text())["items"]
    released = {}
    rp = GF / "RELEASED.json"
    if rp.exists():
        released = json.loads(rp.read_text()).get("jobs", {})
    t = now_iso()

    branches, shas = [], {}
    for ns in ("qa/job-", "study/job-", "gameplay/job-", "gameplay/train-"):
        _, refs = api(ctx, f"repos/{a.repo}/git/matching-refs/heads/{ns}")
        for r in refs:
            nm = r["ref"][len("refs/heads/"):]
            branches.append(nm); shas[nm] = r["object"]["sha"]
    # pull requests: first round pages through all of them; later rounds only the newest pages (list is sorted by update time)
    scan_start = datetime.datetime.now(datetime.timezone.utc)
    cutoff = ctx.last_pr_scan.strftime("%Y-%m-%dT%H:%M:%SZ") if ctx.last_pr_scan else None
    for pg in range(1, 16):
        changed, page = api(ctx, f"repos/{a.repo}/pulls?state=all&per_page=100&sort=updated&direction=desc&page={pg}")
        if not changed and pg == 1 and cutoff:
            break
        for p in page:
            ctx.prs[p["number"]] = p
        if len(page) < 100 or (cutoff and min(p["updated_at"] for p in page) < cutoff):
            break
    ctx.last_pr_scan = scan_start - datetime.timedelta(seconds=120)
    prs = list(ctx.prs.values())
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
    # code jobs finished on a train branch (status/JOB-N.md committed there), re-compared only when the branch moved
    for br, sha in shas.items():
        if br.startswith("gameplay/train-") and ctx.train_done.get(br, (None,))[0] != sha:
            cmp_ = gh_try(f"repos/{a.repo}/compare/gameplay/bug-list-1...{br}") or {}
            done = set()
            for f in cmp_.get("files", []):
                m = re.search(r"status/JOB-(\d{4})\.md$", f["filename"])
                if m: done.add(m.group(1))
            ctx.train_done[br] = (sha, done)
    # Sol review comments: first round the last 3 days, then only what is new
    since = ctx.last_comment_scan or (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    ctx.last_comment_scan = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
    for c in gh(f"repos/{a.repo}/issues/comments?since={since}&per_page=100", paginate=True):
        if c["body"].lstrip().lower().startswith("sol review"):
            pn = int(c["issue_url"].rsplit("/", 1)[1])
            ctx.reviewed.add(pn)
            head = c["body"][:300].lower()
            ctx.verdicts[pn] = "needs_changes" if "needs changes" in head else ("ok_notes" if "ok with notes" in head else "ok")
    reviewed_prs = ctx.reviewed
    ci_cache = {}

    def apply_pr(it, pr, old, mode, job):
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
                hit = ctx.ci.get(sha)
                if not hit or (hit[0] in ("running", "none") and ctx.rounds - hit[3] >= 2):
                    hit = ctx.ci[sha] = (*ci_for(a.repo, sha), ctx.rounds)
                ci, total, extra = hit[0], hit[1], hit[2]
            it.update(ci=ci, ci_sha=sha, ci_total=total, ci_extra=extra)
            it["draft"] = bool(pr.get("draft"))
            if it["draft"]:
                ci, total, extra = "draft", 0, 0
            elif ci == "none" and mode == "code":
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
            apply_pr(it, pr, old, o.get("mode"), job)
        elif o.get("mode") == "code":
            if job in ctx.train_done.get(pre, (None, set()))[1]:
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

    # numbered jobs outside the queue (Codex, Work mode, Claude and chat job files)
    direct = load_direct()
    dstate = {}
    for job, d in direct.items():
        pr = by_job.get(job)
        it = {"job": d["job"], "title": d["title"], "mode": "direct"}
        if job in released:
            it.update(state="live", live_in=released[job])
        elif pr:
            apply_pr(it, pr, {}, "direct", job)
        else:
            ss = status_state(job)
            it["state"] = ("merged" if ss.startswith(("DONE", "MERGED")) else "started" if ss.startswith("IN PROGRESS") else
                           "blocked" if ss.startswith("BLOCKED") else "waiting")
        d["state"] = it["state"]; d["pr"] = it.get("pr"); d["pr_url"] = it.get("pr_url")
        if it.get("base") == "main" and it["state"] not in ("merged", "live", "closed"):
            d["state"] = "old_main"   # old PR straight into main, not factory work
    # lanes: how much of each is done, what is pending, quality so far
    claude_q = set(jload_claude())
    def lane_of_item(k):
        if int(k) in claude_q: return "claude"
        return "gpt1" if int(k) % 2 else "gpt2"
    lanes = {n: {"name": LANE_NAMES[n], "total": 0, "states": {}, "reviews": {"ok": 0, "ok_notes": 0, "needs_changes": 0}} for n in LANE_ORDER}
    def add_unit(lane, state, pr=None, mode=None):
        if state == "old_main": return
        if state == "closed" and mode == "study": state = "no_pr"   # studies the lead did not adopt are finished, not failures
        if state in LEAD_STATES and mode == "study": state = "wait_v"
        elif state in LEAD_STATES and mode == "audit": state = "audit_batch"
        L = lanes[lane]; L["total"] += 1; L["states"][state] = L["states"].get(state, 0) + 1
        v = ctx.verdicts.get(pr) if pr else None
        if v: L["reviews"][v] += 1
    for k, it in items.items():
        add_unit(lane_of_item(k), it["state"], it.get("pr"), it.get("mode"))
    for job, d in direct.items():
        add_unit(d["lane"], d["state"], d.get("pr"))
    for L in lanes.values():
        tot, sv = L["total"], L["states"]
        L["picked_up"] = tot - sv.get("waiting", 0)
        L["worker_done"] = sum(sv.get(x, 0) for x in WORKER_DONE + DONE_STATES)
        L["finished"] = sum(sv.get(x, 0) for x in DONE_STATES)
        L["pending_lead"] = sum(sv.get(x, 0) for x in LEAD_STATES)
        L["wait_v"] = sv.get("wait_v", 0); L["audit_batch"] = sv.get("audit_batch", 0)
        L["trouble"] = sv.get("ci_failed", 0) + sv.get("blocked", 0)
        L["closed"] = sv.get("closed", 0)
        L["reviews_total"] = sum(L["reviews"].values())
        # quality: of the jobs a worker handed in (or had thrown back), how many came through the first time
        handed = L["worker_done"] + L["closed"]
        L["first_time_ok"] = round(100 * L["worker_done"] / handed) if handed else None
        L["failing_now"] = sv.get("ci_failed", 0)
    # what to type in Codex: waiting Codex jobs whose dependencies are merged
    done_jobs = {j for j, d in direct.items() if d["state"] in DONE_STATES}
    codex_next = [{"job": d["job"], "title": d["title"]} for j, d in sorted(direct.items()) if d["lane"] == "codex" and d["state"] == "waiting"
                  and all(x in done_jobs or x not in direct for x in d["deps"])]
    codex_blocked = [{"job": d["job"], "title": d["title"], "deps": d["deps"]} for j, d in sorted(direct.items()) if d["lane"] == "codex" and d["state"] == "waiting"
                     and not all(x in done_jobs or x not in direct for x in d["deps"])]
    work_waiting = [d["job"] for j, d in sorted(direct.items()) if d["lane"] == "work" and d["state"] == "waiting"]

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
    # Typable now: same rule as queue/queue_state.py, but from this round's live scan and not cut to 12
    def jload(name):
        try: return json.loads((GF / "queue" / name).read_text())
        except Exception: return {}
    pics = jload("PICTURES.json") or {"keys": {}, "approved": {}}
    lane = jload("CLAUDE_LANE.json")
    claude_items = set(lane.get("haiku", []) + lane.get("sonnet", []))
    def held(k):
        o = order[k]
        if o.get("mode") != "study" or o.get("screen") not in pics.get("keys", {}): return False
        return pics["keys"][o["screen"]] not in pics.get("approved", {}).get("PHONE" if o["stage"] == 4 else "NEXT", [])
    open_groups = {t["group"] for t in trains_open.values()}
    ready, seen_group = [], set(open_groups)
    for k in sorted(items, key=int):
        if items[k]["state"] != "waiting" or held(k):
            continue
        if int(k) in claude_items:
            if items[k]["mode"] == "code": seen_group.add(items[k]["group"])
            continue
        if items[k]["mode"] == "code":
            if items[k]["group"] in seen_group or len(open_code) >= CAP: continue
            seen_group.add(items[k]["group"])
        ready.append(int(k))
    held_n = sum(1 for k in items if items[k]["state"] == "waiting" and held(k))
    held_by = {}
    for k in items:
        if items[k]["state"] == "waiting" and held(k):
            key = f'{"phone" if order[k]["stage"] == 4 else "desktop"} {pics["keys"][order[k]["screen"]]}'
            held_by[key] = held_by.get(key, 0) + 1
    ready_sol, ready_codex = ready[:12], []
    gates = {"cap": CAP, "open_code_prs": len(open_code), "open_train_prs": open_all,
             "on_train_no_pr": started_code, "draft_code_prs": len(open_all) - len(open_code), "area_locks": {g: n for g, n in locked.items() if g},
             "ready": ready[:12], "ready_sol": ready_sol, "ready_codex": ready_codex,
             "ready_all": ready[:150], "ready_total": len(ready), "held_until_picture": held_n, "held_by_picture": held_by}
    # stale: claimed over 45 minutes ago and still no PR
    stale = [int(k) for k, v in items.items() if v["state"] == "started"
             and (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(v["since"].replace("Z", "+00:00"))).total_seconds() > 2700]
    # hourly history so the page can show whether each lane is improving
    hist = list(prev.get("history", []))
    if not hist or (datetime.datetime.fromisoformat(t.replace("Z", "+00:00")) - datetime.datetime.fromisoformat(hist[-1]["at"].replace("Z", "+00:00"))).total_seconds() >= 3600:
        hist.append({"at": t, "lanes": {k: {"t": L["total"], "fin": L["finished"], "done": L["worker_done"], "redone": L["closed"], "fail": L["failing_now"]} for k, L in lanes.items() if L["total"]}})
    doc = {"updated": t, "total": len(items), "next_free": next_free, "highest_taken": highest,
           "counts": states, "stages": stages, "stale_started": stale, "gates": gates,
           "rate": {"claimed_last_hour": started_since(60), "claimed_last_10min": started_since(10),
                    "merged_last_hour": merged_since(60)},
           "lanes": lanes, "ready_for_lead": sorted({v["pr"] for v in items.values() if v.get("pr") and v["state"] in ("draft", "queued", "ci_running", "ready", "reviewed") and v.get("mode") == "code"}), "old_main_prs": sum(1 for d in direct.values() if d["state"] == "old_main"), "codex_next": codex_next, "codex_waiting_on_deps": codex_blocked, "work_waiting": work_waiting,
           "history": hist[-200:], "events": events, "items": items}
    out.parent.mkdir(parents=True, exist_ok=True)
    # Heartbeat: when nothing but the clock moved, keep the old file until it is 3 minutes old (fewer commits)
    def core(d): return {k: v for k, v in d.items() if k != "updated"}
    if prev and core(prev) == core(doc):
        age = (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(prev["updated"].replace("Z", "+00:00"))).total_seconds()
        if age < 180:
            print(json.dumps(states) + " (unchanged)")
            return False
    # indent=0 puts "updated" on its own line, so the poller's diff guard can ignore clock-only changes
    out.write_text(json.dumps(doc, indent=0) + "\n")
    write_md(doc, out.with_name("MEGA_TRACKER.md"))
    print(json.dumps(states))
    return True

FLOOR = 350  # keep this many API calls of the repo's hourly 1000 free for the Gate and the Physio

def budget():
    """(calls left this hour, seconds until reset). rate_limit lookups are free."""
    r = subprocess.run(["gh", "api", "rate_limit", "--jq", ".resources.core|[.remaining,.reset]|@tsv"], capture_output=True, text=True)
    try:
        rem, reset = r.stdout.split()
        return int(rem), max(0, int(reset) - int(time.time()))
    except Exception:
        return 9999, 0

def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="nikahanghojjati-oss/fifa17-career-showdown2")
    ap.add_argument("--out", default=str(GF / "mega" / "MEGA_TRACKER.json"))
    ap.add_argument("--loop-minutes", type=float, default=0, help="keep running rounds for this long (0 = one round)")
    ap.add_argument("--interval", type=int, default=60, help="seconds between rounds when looping")
    ap.add_argument("--after-write", default="", help="shell command run after a round that wrote new data")
    ap.add_argument("--yield-cmd", default="", help="shell command run after every round; a non-zero exit stops the loop (exit 3)")
    a = ap.parse_args(argv)
    ctx = Ctx(a.repo)
    end = time.time() + a.loop_minutes * 60
    errors = 0
    while True:
        t0 = time.time()
        rem, secs = budget()
        if rem < FLOOR:
            # the hourly budget is nearly spent: pause so the Gate keeps its share, never hammer
            print(f"budget low ({rem} left, resets in {secs}s): pausing", flush=True)
            time.sleep(min(max(secs, 30), 300))
        else:
            try:
                wrote = run_round(a, ctx)
                errors = 0
                if wrote and a.after_write:
                    subprocess.run(a.after_write, shell=True)
            except (SystemExit, Exception) as e:  # a failed API call must never end the run or restart the chain
                errors += 1
                print(f"round failed ({errors}): {str(e)[:200]}", flush=True)
                if errors >= 5:
                    raise SystemExit(4)
                time.sleep(120 * errors)
        if a.yield_cmd and subprocess.run(a.yield_cmd, shell=True).returncode != 0:
            raise SystemExit(3)
        if time.time() + a.interval > end:
            break
        time.sleep(max(1, a.interval - (time.time() - t0)))

if __name__ == "__main__":
    main()
