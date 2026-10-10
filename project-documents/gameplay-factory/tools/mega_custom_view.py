#!/usr/bin/env python3
"""Mega-first Custom view (static HTML, under 9000 bytes) from mega/MEGA_TRACKER.json. No hand-written numbers.
  python3 tools/mega_custom_view.py   ->  mega/CUSTOM_VIEW_MEGA.html"""
import json, pathlib, html, datetime
GF = pathlib.Path(__file__).resolve().parent.parent
LIMIT = 9000
COL = {"live": "#0f9d58", "merged": "#34c76b", "reviewed": "#a78bfa", "ready": "#2dd4bf", "ci_running": "#f5a524", "draft": "#94a3b8", "queued": "#eab308",
       "ci_failed": "#ef4444", "blocked": "#f97316", "started": "#3b82f6", "closed": "#6b7280", "waiting": "#3b4a56"}
LAB = {"live": "Live", "merged": "Merged", "reviewed": "Reviewed", "ready": "Checks green", "ci_running": "Checks running", "draft": "Draft PR open", "queued": "Ready for checks",
       "ci_failed": "Checks FAILED", "blocked": "Blocked", "started": "Started", "closed": "Closed", "waiting": "Waiting"}
ORDER = ["live", "merged", "reviewed", "ready", "queued", "ci_running", "draft", "ci_failed", "blocked", "started", "closed", "waiting"]
PAGE = "https://raw.githack.com/nikahanghojjati-oss/fifa17-career-showdown2/factory/gameplay-v1/project-documents/gameplay-factory/mega/index.html"
MD = "https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/gameplay-v1/project-documents/gameplay-factory/mega/MEGA_TRACKER.md"
CSS = ("<style>.cv{font:14px/1.4 'Segoe UI',system-ui,sans-serif;max-width:720px;color:#fbfcfc;background:#20272d;border-radius:14px;padding:0 0 12px;overflow:hidden}"
       ".cv .ban{background:#2c7399;border-bottom:4px solid #f0d900;padding:8px 14px 6px}.cv .ban b{display:block;font:italic 800 19px/1.1 Impact,sans-serif;letter-spacing:.04em;text-transform:uppercase}"
       ".cv .ban span{font-size:12px;color:#dce5e8}.cv a{color:#f0d900}.cv .tiles{display:flex;gap:6px;padding:8px 10px 0}"
       ".cv .tile{flex:1;background:#2c353c;border:1px solid #43515b;border-top:3px solid #f0d900;border-radius:8px;padding:3px 4px;text-align:center}"
       ".cv .tile b{display:block;font:italic 800 21px/1.1 Impact,sans-serif;color:#f0d900}.cv .tile span{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8ea2ac}"
       ".cv h2{font:italic 800 14px/1 Impact,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#42b9da;margin:12px 12px 4px;padding-left:8px;border-left:4px solid #f0d900}"
       ".cv .card{background:#2c353c;border:1px solid #43515b;border-radius:10px;padding:8px 10px;margin:6px 10px}.cv .warn{background:#3d2216;border-color:#f97316}"
       ".cv .m{color:#8ea2ac;font-size:12px}.cv .bar{display:flex;height:14px;border-radius:7px;overflow:hidden;background:#3b4a56;margin:4px 0}.cv .bar i{display:block;height:100%}"
       ".cv .cp{display:inline-block;user-select:all;-webkit-user-select:all;background:#111820;border:1px dashed #f0d900;border-radius:6px;padding:4px 10px;margin:2px 4px 2px 0;font:700 18px monospace}"
       ".cv .r{display:flex;justify-content:space-between;gap:8px;font-size:13px;margin-top:4px}.cv .sw{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px}</style>")

def bar(states, total):
    return '<div class="bar">' + "".join(f'<i style="width:{states[s]/total*100:.2f}%;background:{COL[s]}"></i>' for s in ORDER if states.get(s)) + "</div>"

def build(d):
    c, g, r, n = d["counts"], d["gates"], d["rate"], d["total"]
    fin = c.get("merged", 0) + c.get("live", 0)
    fly = sum(c.get(s, 0) for s in ("started", "draft", "queued", "ci_running", "ci_failed", "ready", "reviewed", "blocked"))
    upd = datetime.datetime.fromisoformat(d["updated"].replace("Z", "+00:00")) - datetime.timedelta(hours=4)
    o = [CSS, '<div class="cv"><div class="ban"><b>Mega factory</b><span>Updated ' + upd.strftime("%-I:%M %p") +
         ' Boston · <a href="' + PAGE + '">live tracker</a> · <a href="' + MD + '">GitHub view</a></span></div>']
    o.append('<div class="tiles">' + "".join(f'<div class="tile"><b>{k}</b><span>{v}</span></div>' for k, v in
             [(f"{fin}/{n}", "finished"), (fly, "in flight"), (r["claimed_last_hour"], "claimed /h"), (r["merged_last_hour"], "merged /h")]) + '</div>')
    o.append('<h2>Type one of these now</h2><div class="card">' + (" ".join(f'<span class="cp">{x}</span>' for x in g["ready"]) or "Nothing free: wait for a PR to merge.") +
             f'<div class="m">Next free number {d["next_free"]}. Tap, hold and copy a number. Any other number has to wait.</div></div>')
    o.append('<h2>All numbers</h2><div class="card">' + bar(c, n) + '<div class="m">' + " · ".join(
        f'<span class="sw" style="background:{COL[s]}"></span>{LAB[s]} {c[s]}' for s in ORDER if c.get(s)) + "</div></div>")
    lk = ", ".join(f"{html.escape(a)} #{k}" for a, k in g["area_locks"].items()) or "none"
    o.append(f'<h2>Gates</h2><div class="card">Code PRs marked ready <b>{g["open_code_prs"]}</b> of {g["cap"]} ({g.get("draft_code_prs", 0)} drafts){bar({"started": g["open_code_prs"], "waiting": max(g["cap"] - g["open_code_prs"], 0)}, g["cap"])}<div class="m">Locked screen areas: {lk}</div></div>')
    o.append("<h2>By stage</h2><div class=\"card\">")
    for k in sorted(d["stages"]):
        s = d["stages"][k]; v = s["states"]; f = v.get("merged", 0) + v.get("live", 0)
        o.append(f'<div class="r"><span>{k} {html.escape(s["name"])}</span><span class="m">{f}/{s["total"]} done · {v.get("waiting", 0)} waiting</span></div>' + bar(v, s["total"]))
    o.append("</div>")
    bad = [(k, v) for k, v in sorted(d["items"].items(), key=lambda x: int(x[0])) if v["state"] in ("ci_failed", "blocked")]
    stale = [str(x) for x in d["stale_started"]]
    if bad or stale:
        o.append('<h2>Needs attention</h2><div class="card warn">')
        for k, v in bad[:8]:
            o.append(f'<div class="r"><span><b>{k}</b> {html.escape(v["title"][:48])}</span><span>{LAB[v["state"]]}</span></div>')
        if len(bad) > 8: o.append(f'<div class="m">+ {len(bad) - 8} more on the tracker</div>')
        if stale: o.append('<div class="m">Claimed 45+ min ago, no PR yet: ' + ", ".join(stale[:15]) + "</div>")
        o.append("</div>")
    o.append("</div>")
    return "".join(o)

if __name__ == "__main__":
    d = json.loads((GF / "mega" / "MEGA_TRACKER.json").read_text())
    out = build(d)
    assert len(out.encode()) < LIMIT, len(out.encode())
    (GF / "mega" / "CUSTOM_VIEW_MEGA.html").write_text(out)
    print(len(out.encode()), "bytes")
