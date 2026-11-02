#!/usr/bin/env python3
"""Showdown fixture checker. Every truth sheet and fix job runs it before finishing.

Usage:
    python3 visual-assets/v10_1/shared/tools/check_fixtures.py <fixtures.json> [more.json ...]

It reads the top-level key "checkSource" of each file: the plain season inputs that every number on the
screen is derived from, in this shape (managers are always "daniel" and "nik"):

    "checkSource": [
      {"ref": "preview-showdown-1", "totalSeasons": 3, "leagueId": "laliga", "state": "completed",
       "seasons": [
         {"daniel": {"leaguePosition": 1, "leaguePoints": 88, "leagueGoals": 91, "domesticCup": false,
                     "championsLeague": true, "topScorer": false, "topAssist": true},
          "nik":    {"leaguePosition": 3, ...}},
         ...]}
    ]

"state" is optional: completed (default when every season is played), active, completion-pending or abandoned.
It prints, per Showdown and season, the computed scores and winners, then the career totals the screens
must show, and every rule violation. Exit code 1 when anything is wrong. Fix the fixtures until it prints
"0 errors", then paste the output into your status notes.
"""
import json, sys

TEAMS = {"premier_league": 20, "laliga": 20, "bundesliga": 18, "serie_a": 20, "ligue_1": 20}
FLAGS = ("domesticCup", "championsLeague", "topScorer", "topAssist")
M = ("daniel", "nik")


def score(r):
    b = {"championsLeague": 5 if r["championsLeague"] else 0,
         "leagueTitle": 3 if r["leaguePosition"] == 1 else 0,
         "domesticCup": 1 if r["domesticCup"] else 0,
         "performanceBonus": 1 if (r["leaguePoints"] >= 100 or r["leagueGoals"] >= 100) else 0,
         "awardsBonus": 1 if (r["topScorer"] or r["topAssist"]) else 0}
    b["total"] = sum(b.values())
    return b


def season_winner(d, n, bd, bn):
    if bd["total"] != bn["total"]:
        return ("daniel" if bd["total"] > bn["total"] else "nik"), "none"
    if d["leaguePosition"] != n["leaguePosition"]:
        return ("daniel" if d["leaguePosition"] < n["leaguePosition"] else "nik"), "league-position"
    if d["leaguePoints"] != n["leaguePoints"]:
        return ("daniel" if d["leaguePoints"] > n["leaguePoints"] else "nik"), "league-points"
    return "draw", "draw"


def check(path):
    data = json.load(open(path))
    src = data.get("checkSource")
    errs = []
    if not src:
        print(f"{path}: no checkSource block. Add one (see the top of this script).")
        return 1
    career = {m: {"careerPoints": 0, "seasons": 0, "seasonWins": 0, "seasonDraws": 0, "seasonLosses": 0,
                  "championsLeagues": 0, "leagueTitles": 0, "domesticCups": 0, "perfectSeasons": 0,
                  "hundredPointSeasons": 0, "hundredGoalSeasons": 0, "topScorerSeasons": 0, "topAssistSeasons": 0,
                  "showdownWins": 0, "showdownDraws": 0, "showdownLosses": 0,
                  "sumPoints": 0, "sumGoals": 0, "bestSeasonScore": None} for m in M}
    biggest = None
    print(f"== {path}")
    for sd in src:
        ref = sd.get("ref", "?")
        ts, lg = sd.get("totalSeasons"), sd.get("leagueId")
        state = sd.get("state", "completed")
        seasons = sd.get("seasons", [])
        if ts not in (1, 3, 5, 10):
            errs.append(f"{ref}: totalSeasons {ts} is not 1, 3, 5 or 10")
        if lg not in TEAMS:
            errs.append(f"{ref}: leagueId {lg!r} is not one of {sorted(TEAMS)}")
        teams = TEAMS.get(lg, 20)
        if len(seasons) > (ts or 0):
            errs.append(f"{ref}: {len(seasons)} seasons played but totalSeasons is {ts}")
        if state == "completed" and len(seasons) != ts:
            errs.append(f"{ref}: state completed but only {len(seasons)} of {ts} seasons")
        tot = {m: 0 for m in M}
        print(f"-- {ref} ({lg}, {len(seasons)}/{ts} seasons, {state})")
        for i, s in enumerate(seasons, 1):
            d, n = s["daniel"], s["nik"]
            for m, r in (("daniel", d), ("nik", n)):
                p = r["leaguePosition"]
                if not (1 <= p <= teams): errs.append(f"{ref} S{i} {m}: position {p} outside 1..{teams}")
                if not (0 <= r["leaguePoints"] <= (teams - 1) * 6): errs.append(f"{ref} S{i} {m}: points {r['leaguePoints']} outside 0..{(teams - 1) * 6}")
                if not (0 <= r["leagueGoals"] <= 300): errs.append(f"{ref} S{i} {m}: goals {r['leagueGoals']} outside 0..300")
                for f in FLAGS:
                    if not isinstance(r.get(f), bool): errs.append(f"{ref} S{i} {m}: {f} must be true or false")
            if d["leaguePosition"] == n["leaguePosition"]:
                errs.append(f"{ref} S{i}: both managers in league position {d['leaguePosition']} (same league)")
            if (d["leaguePosition"] < n["leaguePosition"]) != (d["leaguePoints"] > n["leaguePoints"]) and d["leaguePoints"] != n["leaguePoints"]:
                errs.append(f"{ref} S{i}: higher league position has fewer league points")
            for f, label in (("championsLeague", "Champions League"), ("domesticCup", "domestic cup"), ("topScorer", "top scorer"), ("topAssist", "top assist")):
                if d[f] and n[f]:
                    errs.append(f"{ref} S{i}: both managers have {label} (only one can)")
            bd, bn = score(d), score(n)
            w, tb = season_winner(d, n, bd, bn)
            print(f"   S{i}: daniel {bd['total']} ({bd}) | nik {bn['total']} ({bn}) -> {w} (tiebreak {tb})")
            if state == "abandoned":
                continue
            for m, r, b in (("daniel", d, bd), ("nik", n, bn)):
                c = career[m]
                tot[m] += b["total"]
                c["careerPoints"] += b["total"]; c["seasons"] += 1
                c["seasonWins"] += w == m; c["seasonDraws"] += w == "draw"; c["seasonLosses"] += w not in (m, "draw")
                c["championsLeagues"] += r["championsLeague"]; c["leagueTitles"] += r["leaguePosition"] == 1; c["domesticCups"] += r["domesticCup"]
                c["perfectSeasons"] += b["total"] == 11
                c["hundredPointSeasons"] += r["leaguePoints"] >= 100; c["hundredGoalSeasons"] += r["leagueGoals"] >= 100
                c["topScorerSeasons"] += r["topScorer"]; c["topAssistSeasons"] += r["topAssist"]
                c["sumPoints"] += r["leaguePoints"]; c["sumGoals"] += r["leagueGoals"]
                c["bestSeasonScore"] = max(c["bestSeasonScore"] or 0, b["total"])
        if state == "abandoned":
            print("   abandoned: counts for nothing")
            continue
        sw = "draw" if tot["daniel"] == tot["nik"] else ("daniel" if tot["daniel"] > tot["nik"] else "nik")
        margin = abs(tot["daniel"] - tot["nik"])
        print(f"   totals daniel {tot['daniel']} nik {tot['nik']} -> showdown winner {sw}, margin {margin}")
        if state == "completed":
            for m in M:
                career[m]["showdownWins"] += sw == m; career[m]["showdownDraws"] += sw == "draw"; career[m]["showdownLosses"] += sw not in (m, "draw")
            if sw != "draw" and (biggest is None or margin > biggest[1]):
                biggest = (sw, margin, ref)
    print("-- career (counted Showdowns)")
    for m in M:
        c = dict(career[m])
        n_ = c["seasons"] or 1
        c["averageSeasonScore"] = round(c["careerPoints"] / n_, 2)
        c["averageLeaguePoints"] = round(c.pop("sumPoints") / n_, 2)
        c["averageLeagueGoals"] = round(c.pop("sumGoals") / n_, 2)
        c["totalTrophies"] = c["championsLeagues"] + c["leagueTitles"] + c["domesticCups"]
        print(f"   {m}: {c}")
    print(f"   biggestShowdownWin: {biggest}")
    for e in errs:
        print("ERROR", e)
    print(f"{len(errs)} errors")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(max([check(p) for p in sys.argv[1:]] or [1]))
