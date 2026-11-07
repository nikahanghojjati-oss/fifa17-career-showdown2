#!/usr/bin/env python3
"""Rebuild ETA_MODEL.json + the backtest numbers from PR / CI history (needs gh). Run: python3 eta_study.py [out_dir]
Model: a job's time = work + CI + lead-review/merge wait. Medians and p25/p75 per class come from finished Claude-lane PRs."""
import json, subprocess, statistics as S, sys, os
from datetime import datetime as D
R = "nikahanghojjati-oss/fifa17-career-showdown2"
P = lambda s: D.strptime(s, "%Y-%m-%dT%H:%M:%SZ")
def gh(path, jq):
    r = subprocess.run(["gh", "api", path, "--jq", jq], capture_output=True, text=True)
    return [json.loads(l) for l in r.stdout.splitlines() if l.strip()] if r.returncode == 0 else []
prs = []
for p in (1, 2):
    prs += gh(f"repos/{R}/pulls?state=all&base=gameplay/recovery-v1&per_page=100&page={p}", ".[]|{n:.number,c:.created_at,m:.merged_at,ref:.head.ref,t:.title}")
runs = []
for p in range(1, 11):
    runs += gh(f"repos/{R}/actions/runs?event=pull_request&per_page=100&page={p}", ".workflow_runs[]|{br:.head_branch,s:.run_started_at,u:.updated_at,c:.conclusion}")
FIX = {339, 345, 346, 353, 356, 359, 361}      # small live-fix PRs
JOB = {340, 344, 347, 349, 350, 354, 355, 358}  # Claude-lane screen/feature jobs with a real PR lifetime
rows = []
for p in prs:
    if not p["m"] or p["n"] not in FIX | JOB: continue
    rs = [r for r in runs if r["br"] == p["ref"] and r["c"] in ("success", "failure")]
    if not rs: continue
    ci = sum((P(r["u"]) - P(r["s"])).total_seconds() / 60 for r in rs)
    ok = [P(r["u"]) for r in rs if r["c"] == "success"]
    wait = (P(p["m"]) - max(ok)).total_seconds() / 60 if ok else 0
    T = (P(p["m"]) - P(p["c"])).total_seconds() / 60
    rows.append(dict(n=p["n"], cls="fix" if p["n"] in FIX else "job", T=T, ci=ci, wait=wait, work=max(T - ci - wait, 1)))
# late-stage backtest: at each job's last real (non-merge) commit, predict merge = commit + typical CI + typical wait
for r in rows:
    cs = gh(f"repos/{R}/pulls/{r['n']}/commits?per_page=100", ".[]|{t:.commit.committer.date,m:(.commit.message|split(\"\\n\")[0])}")
    real = [P(c["t"]) for c in cs if not c["m"].startswith("Merge")]
    mg = [p for p in prs if p["n"] == r["n"]][0]["m"]
    if real: r["late_actual"] = (P(mg) - max(real)).total_seconds() / 60
allruns = [(P(r["u"]) - P(r["s"])).total_seconds() / 60 for r in runs if r["c"] in ("success", "failure")]
q = lambda v: [round(x, 1) for x in S.quantiles(v, n=4)] if len(v) >= 4 else [round(min(v), 1), round(S.median(v), 1), round(max(v), 1)]
model = {"ci_run_min": q(allruns), "ci_runs_seen": len(allruns), "classes": {}}
for c in ("fix", "job"):
    rr = [r for r in rows if r["cls"] == c]
    model["classes"][c] = {"n": len(rr), **{k: q([r[k] for r in rr]) for k in ("T", "ci", "wait", "work")}}
# leave-one-out backtest: predict each job's whole lifetime (open -> merge) from the other jobs of its class
bt = []
for r in rows:
    o = [x["T"] for x in rows if x["cls"] == r["cls"] and x["n"] != r["n"]]
    if len(o) < 3: continue
    lo, med, hi = q(o)[0], S.median(o), q(o)[2]
    bt.append(dict(n=r["n"], cls=r["cls"], actual=round(r["T"]), pred=round(med), lo=round(lo), hi=round(hi), err=round(abs(med - r["T"]) / r["T"] * 100), inside=lo <= r["T"] <= hi))
model["backtest"] = {"rows": bt, "median_abs_pct_err": S.median(b["err"] for b in bt), "inside_range": sum(b["inside"] for b in bt), "of": len(bt)}
lt = [r for r in rows if "late_actual" in r]
pred_late = model["ci_run_min"][1] + S.median(r["wait"] for r in rows)
lo_late, hi_late = model["ci_run_min"][0] + 1, model["ci_run_min"][2] * 2 + 4
late = [dict(n=r["n"], actual=round(r["late_actual"]), pred=round(pred_late), err=round(abs(pred_late - r["late_actual"]) / max(r["late_actual"], 1) * 100), abs_min=round(abs(pred_late - r["late_actual"]), 1), inside=lo_late <= r["late_actual"] <= hi_late) for r in lt if r["late_actual"] > 0]
model["late_backtest"] = {"pred_min": round(pred_late, 1), "range_min": [round(lo_late, 1), round(hi_late, 1)], "rows": late, "median_abs_min_err": S.median(x["abs_min"] for x in late), "inside_range": sum(x["inside"] for x in late), "of": len(late)}
out = sys.argv[1] if len(sys.argv) > 1 else "."
json.dump(model, open(os.path.join(out, "ETA_MODEL.json"), "w"), indent=1)
print(json.dumps(model, indent=1))
