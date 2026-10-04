#!/usr/bin/env python3
"""Check Team V's screen fixtures against Team G's G-11 model-true fixtures.

Reads project-documents/factory/reviews/BINDING.md (its tables and its
`frame-map` json block) and visual-assets/v10_1/shared/fixtures/data-contract-v1/.

1. keys:   every G-11 key cited in a BINDING.md table exists in at least one scenario.
2. frames: every mapped frame exists, its scenario exists, and the frame's
           status matches the model the scenario sends that viewer.
3. values: screens whose fixtures.json carries `bindingSource` (swapped by
           JOB-216..218) show the same numbers as their scenario.
4. shared: the same number is identical on every screen fed by one scenario
           (JOB-220).

Standard library only. Prints one line per error and ends with "N errors".
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
G11 = ROOT / "visual-assets/v10_1/shared/fixtures/data-contract-v1"
BINDING = ROOT / "project-documents/factory/reviews/BINDING.md"
SCREENS = ROOT / "visual-assets/v10_1"
MANAGERS = ("daniel", "nik")
INTERIM = "Current Showdown only. Career history is not yet available."
PREVIEW = "Preview data"

errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def load(path: Path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def scenarios() -> dict:
    index = load(G11 / "index.json")
    return {s["id"]: load(G11 / s["file"]) for s in index["scenarios"]}


# ---------- 1. keys ----------------------------------------------------------

def expand(cell: str) -> list[str]:
    """'viewers.<viewer>.home.continue.state / season / totalSeasons' -> three paths."""
    parts = [p.strip(" `") for p in cell.split(" / ")]
    if not parts[0].startswith(("viewers.", "career.", "careerInterim.")):
        return []
    out = [parts[0]]
    head = parts[0].split(".")
    for p in parts[1:]:
        if not re.fullmatch(r"[A-Za-z.<>\[\]]+", p):
            continue
        if p.startswith(("viewers.", "career.", "careerInterim.")):
            out.append(p)
        else:  # a suffix replaces the first path's field (its last segment, plus <manager> after it)
            k = 2 if head[-1] in ("<manager>", "<viewer>") else 1
            out.append(".".join(head[:-k] + p.split(".")))
    return out


def resolve(node, parts: list[str]) -> bool:
    if not parts:
        return True
    head, rest = parts[0], parts[1:]
    if head.endswith("[]"):
        key = head[:-2]
        if not isinstance(node, dict) or not isinstance(node.get(key), list):
            return False
        return any(resolve(item, rest) for item in node[key]) or (not node[key] and not rest)
    if head in ("<viewer>", "<manager>"):
        return any(resolve(node, [m] + rest) for m in MANAGERS)
    if not isinstance(node, dict) or head not in node:
        return False
    if node[head] is None:
        return True  # key present; the model sends null in this state
    return resolve(node[head], rest)


def check_keys(md: str, scen: dict) -> int:
    seen = 0
    for line in md.splitlines():
        if not line.startswith("|") or "---" in line:
            continue
        for cell in line.strip("|").split("|"):
            for path in expand(cell.strip()):
                seen += 1
                if not any(resolve(s, path.split(".")) for s in scen.values()):
                    err(f"keys: {path} is in no G-11 scenario")
    return seen


# ---------- 2. frames --------------------------------------------------------

ROOTS = {
    "home": "home",
    "start-join": "startJoin",
    "season-results": "seasonResults",
    "final-winner": "finalWinner",
    "rivalry-statistics": "rivalry",
}


def frame_map(md: str) -> dict:
    m = re.search(r"## frame-map.*?```json\n(.*?)\n```", md, re.S)
    if not m:
        err("frames: BINDING.md has no frame-map json block")
        return {}
    return json.loads(m.group(1))


def model_for(scen: dict, screen: str, ref: dict):
    """The view model a frame binds to."""
    doc = scen[ref["scenario"]]
    viewer = ref.get("viewer", "daniel")
    if screen in ROOTS:
        v = doc["viewers"][viewer]
        if screen == "season-results" and "season" in ref:
            return next((s for s in v["seasonResultsBySeason"] if s["season"] == ref["season"]), None)
        return v[ROOTS[screen]]
    root = ref.get("root", "career")
    if root in ("career", "careerInterim"):
        return doc[root]
    return doc["viewers"][ref.get("viewer", "daniel")][root]


def check_frames(fmap: dict, scen: dict) -> int:
    n = 0
    for screen, frames in fmap.items():
        fx = load(SCREENS / screen / "fixtures.json")
        for fid, ref in frames.items():
            n += 1
            if fid not in fx["frames"]:
                err(f"frames: {screen} {fid} is not in fixtures.json")
                continue
            if ref.get("teamV"):
                if not ref.get("reason"):
                    err(f"frames: {screen} {fid} is teamV without a reason")
                continue
            if ref.get("scenario") not in scen:
                err(f"frames: {screen} {fid} names unknown scenario {ref.get('scenario')}")
                continue
            model = model_for(scen, screen, ref)
            if model is None:
                err(f"frames: {screen} {fid} season {ref.get('season')} not in {ref['scenario']}")
                continue
            frame = fx["frames"][fid]
            if "status" not in frame and isinstance(frame.get("model"), dict):
                frame = frame["model"]
            want = model.get("status") if isinstance(model, dict) else None
            if "status" in frame and want and frame["status"] != want and not ref.get("gap"):
                err(f"frames: {screen} {fid} status {frame['status']} but {ref['scenario']} sends {want}")
    return n


# ---------- 3. values ------------------------------------------------------------

def leaves(node, prefix=""):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from leaves(v, f"{prefix}.{k}" if prefix else k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from leaves(v, f"{prefix}[{i}]")
    else:
        yield prefix, node


def get(node, path: str):
    for part in re.findall(r"[^.\[\]]+|\[\d+\]", path):
        if part.startswith("["):
            idx = int(part[1:-1])
            if not isinstance(node, list) or idx >= len(node):
                return KeyError
            node = node[idx]
        else:
            if not isinstance(node, dict) or part not in node:
                return KeyError
            node = node[part]
    return node


def check_values(fmap: dict, scen: dict) -> int:
    """A swapped frame records `bind` = {frame path: G-11 path}; both must agree."""
    n = 0
    for screen, frames in fmap.items():
        fx = load(SCREENS / screen / "fixtures.json")
        if "bindingSource" not in fx:
            continue
        for fid, ref in frames.items():
            frame = fx["frames"].get(fid)
            if not frame or ref.get("teamV"):
                continue
            if frame.get("previewLabel", PREVIEW) != PREVIEW:
                err(f"values: {screen} {fid} lost the '{PREVIEW}' tag")
            if "managerOrder" in frame and frame["managerOrder"] != list(MANAGERS):
                err(f"values: {screen} {fid} managerOrder is not [daniel, nik]")
            doc = scen[ref["scenario"]]
            for fpath, gpath in (frame.get("bind") or {}).items():
                n += 1
                a, b = get(frame, fpath), get(doc, gpath)
                if a is KeyError or b is KeyError:
                    err(f"values: {screen} {fid} {fpath} <- {gpath}: path missing")
                elif a != b:
                    err(f"values: {screen} {fid} {fpath}={a!r} but {ref['scenario']} {gpath}={b!r}")
    return n


# ---------- 4. shared ---------------------------------------------------------------

def check_shared(fmap: dict, scen: dict) -> int:
    """Every bound G-11 path read by two screens must show one value."""
    seen: dict[tuple[str, str], tuple[str, object]] = {}
    n = 0
    for screen, frames in fmap.items():
        fx = load(SCREENS / screen / "fixtures.json")
        if "bindingSource" not in fx:
            continue
        for fid, ref in frames.items():
            frame = fx["frames"].get(fid)
            if not frame or ref.get("teamV"):
                continue
            for fpath, gpath in (frame.get("bind") or {}).items():
                val = get(frame, fpath)
                key = (ref["scenario"], gpath)
                if key in seen and seen[key][1] != val:
                    err(f"shared: {ref['scenario']} {gpath}: {seen[key][0]} shows {seen[key][1]!r}, {screen} {fid} shows {val!r}")
                seen.setdefault(key, (f"{screen} {fid}", val))
                n += 1
    return n


def main() -> int:
    md = BINDING.read_text(encoding="utf-8")
    scen = scenarios()
    nav = load(G11 / "nav.json")
    if nav.get("lockText") != "Finish this step first":
        err("nav: nav.json lockText is not 'Finish this step first'")
    k = check_keys(md, scen)
    fmap = frame_map(md)
    f = check_frames(fmap, scen)
    v = check_values(fmap, scen)
    s = check_shared(fmap, scen)
    for e in errors:
        print("ERROR", e)
    print(f"{len(scen)} scenarios · {k} keys · {f} frames · {v} values · {s} shared reads")
    print(f"{len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
