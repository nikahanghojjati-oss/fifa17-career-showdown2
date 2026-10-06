#!/usr/bin/env python3
"""Team V board: the shared data, with Team V featured.

Reads the same shared data as Team G's board and writes project-documents/factory/BOARD.md:
  * Team V jobs (big, first): open and recently closed PRs whose title starts with "V-",
    each carrying one fenced ```progress JSON block in its description (Team G's format).
  * Team G (small, below): TEAM_G_PROGRESS.json from factory/gameplay-v1 (read-only, same blocks, same maths).
  * The last relay messages from leads/relay FEED.md.
Never writes anything on Team G's branch. Needs `gh` with GH_TOKEN (or a logged-in gh).
Prints how many jobs are running on either side (the workflow stops polling when it is 0).
"""
import json, os, re, subprocess, datetime as dt

REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "BOARD_ARCHIVE.md")  # HO-012: archived; the one board is Team G's CUSTOM_VIEW_V.html
BLOB = f"https://github.com/{REPO}/blob"
G_BOARD = f"{BLOB}/factory/gameplay-v1/project-documents/gameplay-factory/BOARD.md"
FEED_URL = f"{BLOB}/leads/relay/project-documents/leads-relay/FEED.md"
LIVE_SITE = "https://nikahanghojjati-oss.github.io/fifa17-career-showdown2/"
# Board 1 is finished and frozen; its jobs had no PRs, so it stays as one line.
BOARD1 = "**Board 1 (visual package): 238 of 238 jobs done and checked**, shipped in version 2.0 on 5 Oct 2026."

LANES = {  # same squares as Team G's board
    "sol-chat": ("🟦", "Sol chat"), "sol-work": ("🟩", "Sol Work mode"), "codex": ("⬜", "Codex"),
    "opus": ("🟧", "Opus"), "sonnet": ("🟪", "Sonnet"), "haiku": ("🟨", "Haiku"),
}


def sh(*args):
    r = subprocess.run(list(args), capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else ""


def gh_json(path):
    out = sh("gh", "api", path)
    try:
        return json.loads(out) if out.strip() else []
    except ValueError:
        return []


def eastern(ts=None):
    """Boston time; the US daylight-saving rule (2nd Sunday of March to 1st Sunday of November)."""
    t = dt.datetime.now(dt.timezone.utc) if ts is None else dt.datetime.fromisoformat(ts.replace("Z", "+00:00"))
    t = t.astimezone(dt.timezone.utc)
    y = t.year
    mar = dt.datetime(y, 3, 8, 7, tzinfo=dt.timezone.utc)
    nov = dt.datetime(y, 11, 1, 6, tzinfo=dt.timezone.utc)
    start = mar + dt.timedelta(days=(6 - mar.weekday()) % 7)
    end = nov + dt.timedelta(days=(6 - nov.weekday()) % 7)
    off = -4 if start <= t < end else -5
    lt = t + dt.timedelta(hours=off)
    return lt.strftime("%a %-d %b %-I:%M %p ") + ("EDT" if off == -4 else "EST")


def block(body):
    m = re.search(r"```progress\s*\n(.*?)```", body or "", re.S)
    if not m:
        return None
    try:
        d = json.loads(m.group(1))
        assert isinstance(d.get("steps"), list) and d["steps"]
        return d
    except Exception:
        return None


def bar(done, total, sq, width=20):
    n = round(width * done / total) if total else 0
    return sq * n + "▫️" * (width - n)


def pct(done, total):
    return f"{100 * done / total:.2f} %" if total else "0.00 %"


def v_jobs():
    is_v = lambda pr: (pr.get("title") or "").strip().upper().startswith("V-")
    running, done = [], []
    for pr in gh_json(f"repos/{REPO}/pulls?state=open&per_page=100"):
        if is_v(pr):
            running.append((pr, block(pr.get("body"))))
    for pr in gh_json(f"repos/{REPO}/pulls?state=closed&per_page=50&sort=updated&direction=desc"):
        if is_v(pr):
            done.append(pr)
    return running, done[:10]


def team_g():
    sh("git", "fetch", "-q", "--depth=1", "origin",
       "factory/gameplay-v1:refs/remotes/origin/factory/gameplay-v1")
    raw = sh("git", "show", "origin/factory/gameplay-v1:project-documents/gameplay-factory/TEAM_G_PROGRESS.json")
    try:
        return json.loads(raw)
    except ValueError:
        return None


HO_ICON = {"SENT": "📤", "DELIVERED": "📬", "RECEIVED": "📥", "WORKING": "🔧", "DONE": "✅", "RETURNED": "↩️"}


def handoffs():
    """Hand-off tickets on leads/relay (CONTRACT.md §8): the fenced ticket header of every handoffs/HO-*.md."""
    sh("git", "fetch", "-q", "--depth=1", "origin", "+leads/relay:refs/remotes/origin/leads/relay")
    names = sh("git", "ls-tree", "--name-only", "origin/leads/relay", "project-documents/leads-relay/handoffs/").split()
    out = []
    for n in sorted(names):
        m = re.search(r"```ticket\s*\n(.*?)```", sh("git", "show", f"origin/leads/relay:{n}"), re.S)
        try:
            t = json.loads(m.group(1))
            t["path"] = n
            out.append(t)
        except Exception:
            continue
    return out


def feed_rows(n=4):
    raw = sh("git", "show", "origin/leads/relay:project-documents/leads-relay/FEED.md")
    rows = [l for l in raw.splitlines() if re.match(r"\|\s*20\d\d-", l)]
    return rows[-n:]


def main():
    running, closed = v_jobs()
    g = team_g()
    L = ["# 🎨 Team V board", "",
         f"Updated {eastern()} · Team V featured, Team G below · one shared data source "
         f"(PR progress blocks + relay) · [Team G's board]({G_BOARD})", ""]

    # ---------- Team V (featured) ----------
    L += ["## Team V: visual jobs", ""]
    reporting = [(pr, d) for pr, d in running if d]
    silent = [pr for pr, d in running if not d]
    if reporting:
        for pr, d in reporting:
            steps = d["steps"]
            k = sum(1 for s in steps if s.get("done"))
            sq, lane = LANES.get(d.get("worker", ""), ("🟫", d.get("worker", "?")))
            nxt = next((s.get("name", "") for s in steps if not s.get("done")), "nothing left")
            L += [f"### {sq} [{d.get('job', '?')} · {d.get('title', pr['title'])}]({pr['html_url']})", "",
                  f"{bar(k, len(steps), sq)} **{pct(k, len(steps))}** · {k} of {len(steps)} steps · "
                  f"{lane} · {d.get('owner', '')} · updated {eastern(d.get('updated', pr['updated_at']))}", "",
                  f"> **Going on now:** {d.get('current', '')}  ", f"> **Next step:** {nxt}", ""]
    for pr in silent:
        L += [f"* [{pr['title']}]({pr['html_url']}): not reported (no progress block yet)"]
    if silent:
        L += [""]
    if not running:
        L += ["No Team V job is running right now.", ""]
    L += [BOARD1, "", '<img src="board-meter.svg" alt="Board 1 football meter, 100 %" width="560">', ""]
    if closed:
        L += ["**Recently finished:**", ""]
        for pr in closed:
            how = "merged" if pr.get("merged_at") else "closed"
            L += [f"* ✅ [{pr['title']}]({pr['html_url']}) · {how} {eastern(pr.get('merged_at') or pr['closed_at'])}"]
        L += [""]
    L += ["<sub>Lanes: " + " · ".join(f"{sq} {name}" for sq, name in LANES.values()) + "</sub>", ""]

    # ---------- Hand-offs between the teams ----------
    tickets = handoffs()
    to_v = [t for t in tickets if t.get("to") == "V"]
    if to_v:
        open_v = [t for t in to_v if t.get("status") not in ("DONE", "RETURNED")]
        L += [f"### Hand-offs to Team V ({len(open_v)} open of {len(to_v)})", "",
              "| Ticket | What | Priority | State | Job |", "|---|---|---|---|---|"]
        for t in sorted(to_v, key=lambda t: (t.get("status") in ("DONE", "RETURNED"), t.get("priority") != "top", t["id"])):
            st = t.get("status", "?")
            pri = "🔥 top" if t.get("priority") == "top" else t.get("priority", "")
            L += [f"| [{t['id']}]({BLOB}/leads/relay/{t['path']}) | {t.get('title', '')} | {pri} | "
                  f"{HO_ICON.get(st, '')} {st.title()} | {t.get('job') or ''} |"]
        L += [""]
    from_v = [t for t in tickets if t.get("from") == "V"]
    if from_v:
        L += ["<sub>Sent to Team G: " + " · ".join(f"{t['id']} {HO_ICON.get(t.get('status'), '')} {t.get('status', '').title()}" for t in from_v) + "</sub>", ""]

    # ---------- Team G (smaller) ----------
    L += ["### Team G: gameplay", ""]
    g_running = 0
    if g:
        tot, dn = g.get("jobs_total", 0), g.get("jobs_done", 0)
        L += [f"<sub>{dn} of {tot} jobs done ({pct(dn, tot)}) · {g.get('open_bugs', 0)} open bugs · "
              f"their update {eastern(g['updated']) if g.get('updated') else '?'} · [full board]({G_BOARD})</sub>", ""]
        for j in g.get("running", []):
            g_running += 1
            w = j.get("worker", "")  # Team G writes the lane name ("Opus") here
            sq = next((q for q, nm in LANES.values() if nm == w), LANES.get(w, ("🟫",))[0])
            p = float(j.get("pct", 0))  # their weighted percent, so both boards show the same number
            sd, st = j.get("done", 0), j.get("total", 0)
            name = f"{j.get('job', '?')} · {j.get('title', '')}"
            link = f"[{name}](https://github.com/{REPO}/pull/{j['pr']})" if j.get("pr") else name
            L += [f"<sub>{sq} {link}: {bar(p, 100, sq, 10)} {p:.2f} % · {sd} of {st} steps · {j.get('current', '')}</sub>  "]
        if not g.get("running"):
            L += ["<sub>No Team G job is running right now.</sub>"]
        L += [""]
    else:
        L += [f"<sub>Team G's progress file could not be read this round; see [their board]({G_BOARD}).</sub>", ""]

    # ---------- Relay ----------
    rows = feed_rows()
    if rows:
        L += ["### Relay (latest)", "", "| When (UTC) | From | To | Id | Subject | Reply needed |",
              "|---|---|---|---|---|---|", *rows, "", f"<sub>[Whole relay feed]({FEED_URL})</sub>", ""]
    L += [f"Live game: {LIVE_SITE}", ""]
    open(OUT, "w").write("\n".join(L))
    print(len(reporting) + g_running)


if __name__ == "__main__":
    main()
