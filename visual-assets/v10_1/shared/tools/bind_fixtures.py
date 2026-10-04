#!/usr/bin/env python3
"""Swap each screen's preview numbers for Team G's G-11 model-true values (JOB-216..218).

  python3 visual-assets/v10_1/shared/tools/bind_fixtures.py home start-join season-results

Reads the frame-map block in project-documents/factory/reviews/BINDING.md. For every mapped frame
it writes the G-11 value into the existing preview key and records the pair in the frame's `bind`
map (frame path -> G-11 path), which check_binding.py verifies. Rules (BINDING.md "js changes"):
- keys keep their preview names (managerRecords, managers, showdowns ...); the adapter renames;
- a G-11 null leaves the preview value (loading / unavailable shells keep their layout);
- teamV frames are untouched; the fixture gets `bindingSource` naming the G-11 folder;
- hub screens get the top-level `nav` block from nav.json (NAV_CONTRACT.md active keys).
Idempotent: running it twice gives the same file.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
G11 = ROOT / "visual-assets/v10_1/shared/fixtures/data-contract-v1"
SCREENS = ROOT / "visual-assets/v10_1"
MD = ROOT / "project-documents/factory/reviews/BINDING.md"
M = ("daniel", "nik")
SOURCE = "visual-assets/v10_1/shared/fixtures/data-contract-v1 (Team G G-11, gameplay/recovery-v1 @ dc78ed7b)"

# screen -> (nav.json screen id, NAV_CONTRACT active key, hub?)
NAV = {
    "home": ("mainMenu", "home"),
    "start-join": ("createShowdown", "career"),
    "season-results": ("seasonEntry", "career"),
    "final-winner": ("dashboard", "career"),
    "rivalry-statistics": ("statistics", "stats"),
    "career-statistics": ("careerStatistics", "stats"),
    "standings": ("statistics", "standings"),
    "legacy": ("legacy", "career"),
    "trophy-room": ("trophyRoom", "career"),
}
RECORD_LABELS = {
    "Highest season score": "HIGHEST SEASON SCORE",
    "Highest league points": "HIGHEST LEAGUE POINTS",
    "Highest league goals": "MOST LEAGUE GOALS",
    "Biggest Showdown win": "BIGGEST SHOWDOWN WIN",
    "Most perfect seasons": "PERFECT 11-POINT SEASONS",
}
RECORDS = ["seasonWins", "seasonDraws", "seasonLosses", "championsLeagues", "leagueTitles", "domesticCups",
           "totalTrophies", "hundredPointSeasons", "hundredGoalSeasons", "topScorerSeasons", "topAssistSeasons",
           "perfectSeasons", "bestSeasonScore"]
SEASON_KEYS = ["leaguePosition", "leaguePoints", "leagueGoals"]


def get(node, path: str):
    for part in re.findall(r"[^.\[\]]+|\[\d+\]", path):
        if part.startswith("["):
            i = int(part[1:-1])
            if not isinstance(node, list) or i >= len(node):
                return None
            node = node[i]
        else:
            if not isinstance(node, dict):
                return None
            node = node.get(part)
    return node


def put(node, path: str, value) -> None:
    parts = re.findall(r"[^.\[\]]+|\[\d+\]", path)
    for part, nxt in zip(parts, parts[1:]):
        key = int(part[1:-1]) if part.startswith("[") else part
        fresh = [] if nxt.startswith("[") else {}
        if isinstance(node, list) and key == len(node):
            node.append(fresh)
        elif isinstance(node, dict) and key not in node:
            node[key] = fresh
        node = node[key]
    last = parts[-1]
    key = int(last[1:-1]) if last.startswith("[") else last
    if isinstance(node, list) and key == len(node):
        node.append(value)
    else:
        node[key] = value


class Frame:
    def __init__(self, frame: dict, doc: dict, base: str = ""):
        self.f, self.doc, self.base = frame, doc, base
        self.bind = {}

    def b(self, fpath: str, gpath: str, force: bool = False) -> None:
        """Copy doc[gpath] to frame[fpath] (skips a G-11 null unless force)."""
        val = get(self.doc, gpath)
        if val is None and not force:
            return
        put(self.f, self.base + fpath, val)
        self.bind[self.base + fpath] = gpath

    def done(self) -> None:
        if self.bind:
            self.f["bind"] = self.bind
        else:
            self.f.pop("bind", None)


def season_rows(fr: Frame, fbase: str, gbase: str, seasons: list, keep_tiebreak=False) -> None:
    put(fr.f, fr.base + fbase, [])
    for i, s in enumerate(seasons):
        fp, gp = f"{fbase}[{i}]", f"{gbase}[{i}]"
        put(fr.f, fr.base + fp, {})
        fr.b(fp + ".season", gp + ".season")
        for m in M:
            fr.b(f"{fp}.score.{m}", f"{gp}.score.{m}")
        fr.b(fp + ".winner", gp + ".winner", force=True)
        if keep_tiebreak and "tiebreak" in s:
            fr.b(fp + ".tiebreak", gp + ".tiebreak", force=True)
        for k in SEASON_KEYS:
            for m in M:
                fr.b(f"{fp}.{k}.{m}", f"{gp}.{k}.{m}")


# ---------- screens ----------------------------------------------------------------

def home(fr: Frame, ref: dict) -> None:
    r = f"viewers.{ref['viewer']}.home"
    fr.b("status", r + ".status")
    fr.b("viewerRole", r + ".viewerRole")
    for k in ("state", "leagueId", "season", "totalSeasons"):
        fr.b("continue." + k, f"{r}.continue.{k}", force=True)
    for m in M:
        fr.b(f"continue.clubs.{m}", f"{r}.continue.clubs.{m}")
        fr.b(f"continue.score.{m}", f"{r}.continue.score.{m}")
    c = get(fr.doc, r + ".continue") or {}
    fr.f["badge"] = (get(fr.doc, r + ".viewerRole") or fr.f.get("badge", "")).upper()
    if c.get("state") == "paired" and c.get("season") and fr.f.get("indicator", "").startswith("Season"):
        fr.f["indicator"] = f"Season {c['season']} / {c['totalSeasons']}"
        fr.f.setdefault("save", {})["meta"] = f"Daniel vs Nik · Season {c['season']} of {c['totalSeasons']}"


def start_join(fr: Frame, ref: dict) -> None:
    r = f"viewers.{ref['viewer']}.startJoin"
    if not ref.get("gap"):
        fr.b("status", r + ".status")
    fr.b("pairing.state", r + ".pairing.state")
    if "session" in fr.f:
        fr.b("session.state", r + ".session.state")
    h = f"viewers.{ref['viewer']}.home.continue"
    if "context" in fr.f:
        for k in ("season", "totalSeasons", "leagueId"):
            fr.b("context." + k, f"{h}.{k}")
        for m in M:
            fr.b(f"context.clubs.{m}", f"{h}.clubs.{m}")


def season_results(fr: Frame, ref: dict) -> None:
    v = ref["viewer"]
    if "season" in ref:
        idx = [s["season"] for s in get(fr.doc, f"viewers.{v}.seasonResultsBySeason")].index(ref["season"])
        r = f"viewers.{v}.seasonResultsBySeason[{idx}]"
    else:
        r = f"viewers.{v}.seasonResults"
    h = f"viewers.{v}.home.continue"
    fr.b("context.season", r + ".season")
    fr.b("context.totalSeasons", h + ".totalSeasons")
    fr.b("context.leagueId", h + ".leagueId")
    for m in M:
        fr.b(f"context.clubs.{m}", f"{h}.clubs.{m}")
    if ref.get("draft"):
        return  # own typed draft: G-11 sends inputs null before publish
    fr.b("status", r + ".status")
    fr.b("phase", r + ".phase")
    for m in M:
        if get(fr.doc, f"{r}.inputs.{m}") is not None and m in (fr.f.get("managers") or {}):
            for k, val in get(fr.doc, f"{r}.inputs.{m}").items():
                fr.b(f"managers.{m}.{k}", f"{r}.inputs.{m}.{k}")
        if get(fr.doc, f"{r}.breakdown.{m}") is not None:
            for k in get(fr.doc, f"{r}.breakdown.{m}"):
                fr.b(f"breakdown.{m}.{k}", f"{r}.breakdown.{m}.{k}")
    for k in ("winner", "tiebreak"):
        fr.b(k, f"{r}.{k}")


def final_winner(fr: Frame, ref: dict) -> None:
    r = f"viewers.{ref['viewer']}.finalWinner"
    fr.b("status", r + ".status")
    if get(fr.doc, r + ".status") != "ready":
        return
    for k in ("state", "winner", "margin", "seasonsPlayed"):
        fr.b(k, f"{r}.{k}")
    for m in M:
        fr.b(f"totals.{m}", f"{r}.totals.{m}")
        for k in ("championsLeague", "leagueTitles", "domesticCups", "total"):
            fr.b(f"trophies.{m}.{k}", f"{r}.trophies.{m}.{k}")
    if "terminalSummary" in fr.f:  # Team V sentence rebuilt from the bound totals, never typed
        tot, win = fr.f["totals"], fr.f["winner"]
        fr.f["terminalSummary"] = f"Daniel {tot['daniel']} · Nik {tot['nik']} · " + ("DRAW" if win == "draw" else win.capitalize() + " WINS")


def rivalry_like(fr: Frame, r: str, rec_keys) -> None:
    fr.b("status", r + ".status")
    for k in ("leagueId", "season", "totalSeasons"):
        fr.b(k, f"{r}.{k}")
    for m in M:
        fr.b(f"clubs.{m}", f"{r}.clubs.{m}")
        fr.b(f"score.{m}", f"{r}.score.{m}")
        box = fr.f["model"] if fr.base else fr.f
        if get(fr.doc, f"{r}.managers.{m}") is not None and "managerRecords" in box:
            for k in rec_keys:
                fr.b(f"managerRecords.{m}.{k}", f"{r}.managers.{m}.{k}")


def rivalry(fr: Frame, ref: dict) -> None:
    r = f"viewers.{ref['viewer']}.rivalry"
    rivalry_like(fr, r, RECORDS)
    seasons = get(fr.doc, r + ".seasons")
    if seasons is not None and "seasons" in fr.f:
        season_rows(fr, "seasons", r + ".seasons", seasons)
        t = fr.f.get("transfers") or {}
        if isinstance(t.get("previewPerSeasonSummary"), list):
            t["previewPerSeasonSummary"] = t["previewPerSeasonSummary"][: len(seasons)]
    fr.b("interimLabel", "careerInterim.interimLabel")


def career_statistics(fr: Frame, ref: dict) -> None:
    r = ref.get("root", "career")
    fr.b("status", r + ".status")
    if "managers" in fr.f:
        for m in M:
            for k in list(fr.f["managers"].get(m, {})):
                if get(fr.doc, f"{r}.managers.{m}.{k}") is not None:
                    fr.b(f"managers.{m}.{k}", f"{r}.managers.{m}.{k}")
            for k in ("completed", "wins", "draws", "losses"):
                fr.b(f"showdowns.{m}.{k}", f"{r}.managers.{m}.showdowns.{k}")
    if "biggestShowdownWin" in fr.f:
        if get(fr.doc, r + ".biggestShowdownWin") is None:
            fr.f["biggestShowdownWin"] = None
        else:
            for k in ("manager", "margin", "showdownRef"):
                fr.b("biggestShowdownWin." + k, f"{r}.biggestShowdownWin.{k}")
    if "coverage" in fr.f:
        for k in ("readable", "indexed"):
            fr.b("coverage." + k, f"{r}.coverage.{k}")
    if "checkSource" in fr.f:
        fr.f["checkSource"] = {"rendered": False, "source": "checkSource of G-11 scenario " + ref["scenario"]}
    if "expectedCareerTableRows" in fr.f and "managers" in fr.f:
        def key(m):
            s, x = fr.f["showdowns"][m], fr.f["managers"][m]
            return (-s["wins"], -x["totalTrophies"], -x["careerPoints"])
        order = sorted(M, key=key)
        fr.f["expectedCareerTableRows"] = [{"manager": m, "rank": order.index(m) + 1} for m in M]


def standings(fr: Frame, ref: dict) -> None:
    fr.base = "model."
    root = ref.get("root", "career")
    if root == "rivalry":
        rivalry_like(fr, f"viewers.{ref['viewer']}.rivalry", RECORDS[:7])
        if ref.get("interim"):
            fr.b("interimLabel", "careerInterim.interimLabel")
        return
    fr.b("status", root + ".status")
    if "coverage" in fr.f["model"]:
        for k in ("readable", "indexed"):
            fr.b("coverage." + k, f"{root}.coverage.{k}")
    rows = get(fr.doc, root + ".trophyRoom.standings") or []
    if "standings" in fr.f["model"] and rows:
        for m in M:
            i = [x["manager"] for x in rows].index(m)
            fr.b(f"standings.{m}.careerPoints", f"{root}.trophyRoom.standings[{i}].careerPoints")
            fr.b(f"standings.{m}.seasonWins", f"{root}.trophyRoom.standings[{i}].seasonWins")
            for k in ("seasonDraws", "seasonLosses", "championsLeagues", "leagueTitles", "domesticCups", "totalTrophies"):
                fr.b(f"standings.{m}.{k}", f"{root}.managers.{m}.{k}")


def legacy(fr: Frame, ref: dict) -> None:
    root = ref.get("root", "career")
    fr.b("status", root + ".status")
    if "coverage" in fr.f:
        for k in ("readable", "indexed"):
            fr.b("coverage." + k, f"{root}.coverage.{k}")
    if root == "careerInterim":
        fr.b("interimLabel", "careerInterim.interimLabel")
    rows = get(fr.doc, root + ".history.showdowns") or []
    g = f"{root}.history.showdowns"
    fr.f["showdowns"] = []
    order = list(range(len(rows)))[::-1]  # Legacy shows newest first; G-11 lists oldest first
    for j, i in enumerate(order):
        s, fp, gp = rows[i], f"showdowns[{j}]", f"{g}[{i}]"
        put(fr.f, fp, {})
        for k in ("number", "status"):
            fr.b(f"{fp}.{k}", f"{gp}.{k}")
        if s.get("status") in ("abandoned", "unavailable"):
            continue  # status-only rows (§8)
        for k in ("leagueId", "seasonsPlayed", "totalSeasons"):
            fr.b(f"{fp}.{k}", f"{gp}.{k}")
        for m in M:
            fr.b(f"{fp}.clubs.{m}", f"{gp}.clubs.{m}")
            fr.b(f"{fp}.totals.{m}", f"{gp}.totals.{m}")
        fr.b(f"{fp}.winner", f"{gp}.winner", force=True)
        season_rows(fr, f"{fp}.seasons", f"{gp}.seasons", s.get("seasons") or [])
    ui = fr.f.get("ui")
    if isinstance(ui, dict):
        ui["page"], ui["totalPages"] = 1, 1
        ui.pop("pageMap", None)
        pick = next((s["number"] for s in fr.f["showdowns"] if s.get("status") not in ("abandoned", "unavailable")), None)
        if pick is None:
            ui.pop("selectedShowdown", None)
        else:
            ui["selectedShowdown"] = pick


def trophy_room(fr: Frame, ref: dict) -> None:
    r = ref.get("root", "career")
    fr.b("status", r + ".status")
    if "coverage" in fr.f:
        for k in ("readable", "indexed"):
            fr.b("coverage." + k, f"{r}.coverage.{k}")
    if "managers" in fr.f:
        for m in M:
            for k in ("championsLeagues", "leagueTitles", "domesticCups", "totalTrophies"):
                fr.b(f"managers.{m}.{k}", f"{r}.trophyRoom.cabinet.{m}.{k}")
            for k in ("careerPoints", "seasonWins"):
                fr.b(f"managers.{m}.{k}", f"{r}.managers.{m}.{k}")
    rows = get(fr.doc, r + ".trophyRoom.standings") or []
    if "standings" in fr.f and rows:
        top = rows[0]
        fr.f["standings"] = []
        for m in M:  # Daniel first; # shows the rank
            i = [x["manager"] for x in rows].index(m)
            j = len(fr.f["standings"])
            put(fr.f, f"standings[{j}]", {})
            for k in ("manager", "careerPoints", "seasonWins"):
                fr.b(f"standings[{j}].{k}", f"{r}.trophyRoom.standings[{i}].{k}")
            level = rows[i].get("level") or (rows[i]["careerPoints"], rows[i]["seasonWins"]) == (top["careerPoints"], top["seasonWins"])
            fr.f["standings"][j]["rank"] = "#1" if level or i == 0 else "#2"
    recs = get(fr.doc, r + ".trophyRoom.records")
    if "records" in fr.f and recs is not None:
        fr.f["records"] = []
        for i, rec in enumerate(recs):
            put(fr.f, f"records[{i}]", {"label": RECORD_LABELS.get(rec["label"], rec["label"].upper())})
            for k in ("manager", "value", "ref"):
                fr.b(f"records[{i}].{k}", f"{r}.trophyRoom.records[{i}].{k}", force=True)
    if "showdowns" in fr.f:
        for m in M:
            fr.b(f"showdowns.{m}.wins", f"{r}.managers.{m}.showdowns.wins")
    if "checkSource" in fr.f:
        fr.f["checkSource"] = {"rendered": False, "source": "checkSource of G-11 scenario " + ref["scenario"]}


SWAP = {"home": home, "start-join": start_join, "season-results": season_results, "final-winner": final_winner,
        "rivalry-statistics": rivalry, "career-statistics": career_statistics, "standings": standings,
        "legacy": legacy, "trophy-room": trophy_room}


def frame_map() -> dict:
    m = re.search(r"## frame-map.*?```json\n(.*?)\n```", MD.read_text(encoding="utf-8"), re.S)
    return json.loads(m.group(1))


def main(screens: list[str]) -> int:
    fmap = frame_map()
    index = json.loads((G11 / "index.json").read_text())
    docs = {s["id"]: json.loads((G11 / s["file"]).read_text()) for s in index["scenarios"]}
    nav = json.loads((G11 / "nav.json").read_text())["screens"]
    for screen in screens:
        path = SCREENS / screen / "fixtures.json"
        fx = json.loads(path.read_text(encoding="utf-8"))
        used = []
        for fid, ref in fmap[screen].items():
            if ref.get("teamV"):
                continue
            fr = Frame(fx["frames"][fid], docs[ref["scenario"]])
            SWAP[screen](fr, ref)
            fr.done()
            fr.f["bindScenario"] = ref["scenario"] + (" · " + ref["viewer"] if ref.get("viewer") else "")
            used.append(ref["scenario"])
        # checkSource: Team G's season inputs for every scenario used, plus the entries of teamV frames
        if "checkSource" in fx:
            team_v = {fid for fid, ref in fmap[screen].items() if ref.get("teamV")}
            keep = [c for c in fx["checkSource"] if c.get("frame") in team_v or str(c.get("ref", "")).startswith("teamV:")]
            if screen == "legacy" and not keep:
                keep = [dict(c, ref="teamV:" + str(c["ref"])) for c in fx["checkSource"]]
            new = []
            for sid in dict.fromkeys(used):
                for c in docs[sid].get("checkSource") or []:
                    new.append(dict(c, ref=sid if len(docs[sid]["checkSource"]) == 1 else f"{sid}:{c['ref']}"))
            fx["checkSource"] = new + keep
        if "checkSourceFrameMap" in fx:
            fx["checkSourceFrameMap"] = {fid: f"checkSource ref {ref['scenario']}" for fid, ref in fmap[screen].items()}
            fx.pop("checkSourceVariants", None)
        sid, active = NAV[screen]
        fx["nav"] = {"active": active, "locked": nav[sid]["locked"], "reason": nav[sid]["reason"],
                     "source": f"nav.json screens.{sid}"}
        fx["bindingSource"] = SOURCE
        path.write_text(json.dumps(fx, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(screen, "bound", len(used), "frames from", sorted(set(used)))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or list(SWAP)))
