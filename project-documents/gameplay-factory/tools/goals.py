#!/usr/bin/env python3
"""The two Thursday goals (Nik, 2026-10-06 04:01 UTC), read from GitHub and cached in GOALS.json:
- Team G, bug-free game: Showdown Bug Olympiad on qa/bug-olympiad, project-documents/gameplay-factory/sweeps/olympiad/
  (format: /mnt/project-files/bug-list-factory/SOLO_HUNT_KIT.md). The meter is the mean over areas 01-12 of
  coverage_pct x clean_confidence_pct from each area's newest runs/*.json; findings/*.json give the open S1/S2 counts.
  A finding counts as fixed with status "fixed" or once its fix_job's JOB PR is merged (custom_view passes those numbers in).
- Team V, mockup match: Mockup Lab studies at study/mockup-lab:project-documents/visual-study/STUDY_NN_*.json (16 screens; diffs per screen).
Blobs are fetched only when their sha changes, so a run costs two tree calls plus one call per new or edited file.
Run from anywhere; needs gh (GH_TOKEN in CI)."""
import base64, json, os, re, subprocess

REPO = os.environ.get("GITHUB_REPOSITORY", "nikahanghojjati-oss/fifa17-career-showdown2")
F = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CACHE = os.path.join(F, "GOALS.json")
SCREENS = 16
G_BRANCH, G_DIR = "qa/bug-olympiad", "project-documents/gameplay-factory/sweeps/olympiad/"
AREAS = 12
V_BRANCH, V_DIR = "study/mockup-lab", "project-documents/visual-study/"


def gh(path):
    try:
        r = subprocess.run(["gh", "api", f"repos/{REPO}/{path}"], capture_output=True, text=True, timeout=30)
    except Exception:
        return None
    if r.returncode != 0:
        return "missing" if "Not Found" in (r.stdout + r.stderr) else None
    try:
        return json.loads(r.stdout)
    except ValueError:
        return None


def files(branch, prefix, pattern):
    """{path: sha} of matching files, "missing" if the branch doesn't exist yet, None if GitHub couldn't be read."""
    t = gh(f"git/trees/{branch}?recursive=1")
    if t in (None, "missing"):
        return t
    return {x["path"]: x["sha"] for x in t.get("tree", []) if x.get("type") == "blob" and x["path"].startswith(prefix) and re.search(pattern, x["path"].rsplit("/", 1)[-1])}


def blob(sha):
    b = gh(f"git/blobs/{sha}")
    if not isinstance(b, dict):
        return None
    try:
        return json.loads(base64.b64decode(b["content"]).decode("utf-8"))
    except Exception:
        return "bad"


def sync(cache, key, listing):
    old = cache.get(key, {}).get("files", {})
    if listing in (None, "missing"):
        cache.setdefault(key, {"files": old})["state"] = listing or "unreadable"
        return
    new = {}
    for path, sha in listing.items():
        if path in old and old[path].get("sha") == sha:
            new[path] = old[path]
            continue
        d = blob(sha)
        if d is None:  # API hiccup: keep the old copy, try again next run
            if path in old:
                new[path] = old[path]
            continue
        new[path] = {"sha": sha, "data": d if isinstance(d, dict) else None}
    cache[key] = {"state": "ok", "files": new}


def load(merged_jobs=()):
    try:
        cache = json.load(open(CACHE))
    except Exception:
        cache = {}
    sync(cache, "olympiad", files(G_BRANCH, G_DIR, r"\.json$"))
    ml = files(V_BRANCH, V_DIR, r"^STUDY_\d+_.*\.json$")
    sync(cache, "mockup", ml)
    if isinstance(ml, dict):
        h = gh(f"contents/MOCKUP_STUDY_001_HOME.json?ref={V_BRANCH}")
        if isinstance(h, dict):
            try:
                cache["mockup"]["home_root"] = {"diffs": len((lambda d: d.get("diffs") or d.get("step9_deltas") or [])(json.loads(base64.b64decode(h["content"]).decode("utf-8"))))}
            except Exception:
                cache["mockup"]["home_root"] = {"diffs": 0}
        elif h == "missing":
            cache["mockup"]["home_root"] = None
    try:
        json.dump(cache, open(CACHE, "w"), indent=1, sort_keys=True, ensure_ascii=False)
        open(CACHE, "a").write("\n")
    except OSError:
        pass

    merged = {str(x) for x in merged_jobs}
    o = cache.get("olympiad", {})
    runs, finds, bad = {}, [], []
    for path, f in sorted(o.get("files", {}).items()):
        d, rel = f.get("data"), path[len(G_DIR):]
        kind = rel.split("/", 1)[0]
        if kind not in ("runs", "findings"):
            continue
        if not isinstance(d, dict):
            bad.append(rel)
            continue
        if kind == "runs":
            try:
                area = int(str(d.get("area", "")).strip()[:2])
            except ValueError:
                continue
            if 1 <= area <= AREAS and str(d.get("date_utc", "")) >= str(runs.get(area, {}).get("date_utc", "")):
                runs[area] = d
        else:
            st = str(d.get("status", "")).lower()
            if st == "fixed" or (d.get("fix_job") and str(d["fix_job"]) in merged):
                st = "fixed"
            finds.append({"id": str(d.get("id") or rel), "title": str(d.get("title", "")), "sev": str(d.get("severity", "")).upper()[:2], "status": st})

    def num(x):
        try:
            return max(0.0, min(100.0, float(x)))
        except (TypeError, ValueError):
            return 0.0
    # bug-free meter: each of the 12 areas scores coverage x clean confidence from its newest run; an area with no run scores 0
    area_score = {a: num(r.get("coverage_pct")) * num(r.get("clean_confidence_pct")) / 100.0 for a, r in runs.items()}
    real = [x for x in finds if x["status"] not in ("not-a-bug", "duplicate", "rejected")]
    opened = [x for x in real if x["status"] != "fixed"]
    g = {"state": o.get("state", "unreadable"), "areas": len(runs), "of": AREAS, "pct": sum(area_score.values()) / AREAS,
         "weakest": sorted(((area_score.get(a, 0.0), a) for a in range(1, AREAS + 1)))[:2],
         "found": len(real), "fixed": len(real) - len(opened), "open": len(opened),
         "s1": sum(1 for x in opened if x["sev"] == "S1"), "s2": sum(1 for x in opened if x["sev"] == "S2"), "bad": bad,
         "top": [x for x in opened if x["sev"] == "S1"][:3]}

    m = cache.get("mockup", {})
    per, vbad = {}, []  # screen -> (measured, diffs); a _MEASURED study replaces the chat study of the same screen
    for path, f in m.get("files", {}).items():
        d, name = f.get("data"), path.rsplit("/", 1)[-1]
        n = re.match(r"STUDY_(\d+)_", name)
        if not isinstance(d, dict) or not n:
            vbad.append(name)
            continue
        k, meas = int(n.group(1)), "_MEASURED" in name
        if k not in per or (meas and not per[k][0]):
            per[k] = (meas, len(d.get("diffs") or []))
    if m.get("home_root") and 1 not in per:  # study 001 (Home) lives at the branch root as MOCKUP_STUDY_001_HOME.json
        per[1] = (False, int((m.get("home_root") or {}).get("diffs", 0)))
    screens, diffs = set(per), sum(x[1] for x in per.values())
    v = {"state": m.get("state", "unreadable"), "studied": len(screens), "screens": SCREENS, "diffs": diffs, "bad": vbad}
    return {"G": g, "V": v}


if __name__ == "__main__":
    print(json.dumps(load(), indent=1))
