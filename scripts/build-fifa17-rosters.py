#!/usr/bin/env python3
"""Rebuild the compact FIFA 17 launch database and boards; Python standard library only.
Usage: python3 scripts/build-fifa17-rosters.py path/to/players_17.csv
Source: https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv
The source uses SoFIFA roster 170002. Input order breaks equal-rating ties.
"""
import collections
import csv
import hashlib
import json
from pathlib import Path
import sys
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv"
ALIASES = {
    'Alavés': 'Deportivo Alavés',
    'Athletic Club': 'Athletic Club de Bilbao',
    'Barcelona': 'FC Barcelona',
    'Celta Vigo': 'RC Celta',
    'Deportivo La Coruña': 'Deportivo de La Coruña',
    'Eibar': 'SD Eibar',
    'Espanyol': 'RCD Espanyol',
    'Granada': 'Granada CF',
    'Las Palmas': 'UD Las Palmas',
    'Leganés': 'CD Leganés',
    'Málaga': 'Málaga CF',
    'Osasuna': 'CA Osasuna',
    'Sevilla': 'Sevilla FC',
    'Sporting Gijón': 'Real Sporting de Gijón',
    'Valencia': 'Valencia CF',
    'Villarreal': 'Villarreal CF',
    'Bayern Munich': 'FC Bayern München',
    'Bayer Leverkusen': 'Bayer 04 Leverkusen',
    'Schalke 04': 'FC Schalke 04',
    'Mainz 05': '1. FSV Mainz 05',
    'Wolfsburg': 'VfL Wolfsburg',
    'Hoffenheim': 'TSG 1899 Hoffenheim',
    'Werder Bremen': 'SV Werder Bremen',
    'Hamburg': 'Hamburger SV',
    'FC Ingolstadt': 'FC Ingolstadt 04',
    'Darmstadt 98': 'SV Darmstadt 98',
    'Chievo': 'Chievo Verona',
    'Inter Milan': 'Inter',
    'Angers': 'Angers SCO',
    'Bastia': 'Sporting Club de Bastia',
    'Bordeaux': 'FC Girondins de Bordeaux',
    'Caen': 'Stade Malherbe Caen',
    'Dijon': 'Dijon FCO',
    'Guingamp': 'En Avant de Guingamp',
    'Lille': 'LOSC Lille',
    'Lorient': 'FC Lorient',
    'Lyon': 'Olympique Lyonnais',
    'Marseille': 'Olympique de Marseille',
    'Metz': 'FC Metz',
    'Monaco': 'AS Monaco',
    'Montpellier': 'Montpellier HSC',
    'Nancy': 'AS Nancy Lorraine',
    'Nantes': 'FC Nantes',
    'Nice': 'OGC Nice',
    'Rennes': 'Stade Rennais FC',
    'Saint-Étienne': 'AS Saint-Étienne',
    'Toulouse': 'Toulouse Football Club',
}

# Exact sets of FIFA 17 squad-position codes; no inferred or fuzzy formation names.
FORMATION_SLOTS = {
    "4-2-3-1 (2)": "GK RB RCB LCB LB RDM LDM RM CAM LM ST",
    "4-1-4-1": "GK RB RCB LCB LB CDM RM RCM LCM LM ST",
    "4-4-2": "GK RB RCB LCB LB RM RCM LCM LM RS LS",
    "4-3-3 (2)": "GK RB RCB LCB LB CDM RCM LCM RW ST LW",
    "4-1-2-1-2 (2)": "GK RB RCB LCB LB CDM RCM LCM CAM RS LS",
    "5-3-2": "GK RWB RCB CB LCB LWB RCM CM LCM RS LS",
    "4-4-1-1": "GK RB RCB LCB LB RM RCM LCM LM CF ST",
    "4-3-3 (4)": "GK RB RCB LCB LB RCM LCM CAM RW ST LW",
    "4-4-2 (2)": "GK RB RCB LCB LB RM RDM LDM LM RS LS",
    "3-5-2": "GK RCB CB LCB RDM LDM RM CAM LM RS LS",
    "4-3-3": "GK RB RCB LCB LB RCM CM LCM RW ST LW",
    "3-4-1-2": "GK RCB CB LCB RM RCM LCM LM CAM RS LS",
    "4-2-2-2": "GK RB RCB LCB LB RDM LDM RAM LAM RS LS",
    "4-3-1-2": "GK RB RCB LCB LB RCM CM LCM CAM RS LS",
    "4-1-2-1-2": "GK RB RCB LCB LB CDM RM LM CAM RS LS",
    "3-4-3 Flat": "GK RCB CB LCB RM RCM LCM LM RW ST LW",
    "3-4-2-1": "GK RCB CB LCB RM RCM LCM LM RF LF ST",
    "4-2-3-1": "GK RB RCB LCB LB RDM LDM RAM CAM LAM ST",
    "3-1-4-2": "GK RCB CB LCB CDM RM RCM LCM LM RS LS",
    "4-3-2-1": "GK RB RCB LCB LB RCM CM LCM RF LF ST",
}


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def write_module(path, global_name, intro, constants, result):
    text = "(function(root,factory){\n  const api=factory();\n  if(typeof module!==\"undefined\"&&module.exports)module.exports=api;\n  else root." + global_name + "=api;\n})(typeof globalThis!==\"undefined\"?globalThis:this,function(){\n  \"use strict\";\n" + intro + constants + result + "\n});\n"
    path.write_text(text, encoding="utf-8")


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source_path = Path(sys.argv[1])
    raw = source_path.read_bytes()
    rows = list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))
    # Catalog is the single club authority; parse with Node, never from the generated boards.
    catalog = json.loads(subprocess.check_output(["node", "-e", "const vm=require('node:vm'),fs=require('node:fs'),c={};vm.createContext(c);vm.runInContext(fs.readFileSync('data/clubs.js','utf8')+';this.catalog=Object.values(clubsByLeague).flat()',c);console.log(JSON.stringify(c.catalog));"], cwd=ROOT))
    assert len(catalog) == len(set(catalog)) == 98
    by_club = collections.defaultdict(list)
    for r in rows:
        by_club[r["club_name"]].append(r)
    formations = {k: v.split() for k, v in FORMATION_SLOTS.items()}
    clubs, squads, unmatched = {}, {}, []
    for club in catalog:
        source_rows = by_club[ALIASES.get(club, club)]
        assert source_rows, club
        assert all(r["player_url"].endswith("/170002") for r in source_rows), club
        players = [[r["short_name"], int(r["overall"]), r["player_positions"].split(", "), r["team_position"], int(float(r["team_jersey_number"])), r["nationality"]] for r in source_rows]
        assert all(40 <= p[1] <= 99 for p in players), club
        xi = [p for p in players if p[3] not in ("SUB", "RES", "")]
        subs = sorted((p for p in players if p[3] in ("SUB", "RES")), key=lambda p: -p[1])[:4]
        assert len(xi) == 11 and sum(p[3] == "GK" for p in xi) == 1, club
        assert len(subs) == 4 and len({p[0] for p in xi + subs}) == 15, club
        # Keep R87-2's XI/sub selection intact. The next three distinct names are
        # hidden reserves; equal overalls use the lower jersey number first.
        used = {p[0].strip().lower() for p in xi + subs}
        reserves = []
        for p in sorted((p for p in players if p[3] in ("SUB", "RES")), key=lambda p: (-p[1], p[4])):
            if p[0].strip().lower() in used:
                continue
            reserves.append(p)
            used.add(p[0].strip().lower())
            if len(reserves) == 3:
                break
        assert len(reserves) == 3 and len(used) == 18, club
        assert all(40 <= p[1] <= 99 for p in xi + subs + reserves), club
        slots = [p[3] for p in xi]
        formation = next((k for k, v in formations.items() if sorted(v) == sorted(slots)), None)
        if formation is None:
            unmatched.append(club)
        clubs[club] = dict(formation=formation, slots=slots, players=players, reserves=reserves)
        squads[club] = dict(xi=[[p[3], p[0], p[4], p[1]] for p in xi], subs=[[p[2][0], p[0], p[4], p[1]] for p in subs], reserves=[[p[2][0], p[0], p[4], p[1]] for p in reserves])
    count = sum(len(c["players"]) for c in clubs.values())
    sha = hashlib.sha256(raw).hexdigest()
    intro = "  // Generated by scripts/build-fifa17-rosters.py; do not edit rows by hand.\n  // SoFIFA FIFA 17 launch roster 170002, players_17.csv: " + SOURCE + "\n"
    constants = "  const formations=" + compact(formations) + ";\n  const clubs={\n" + ",\n".join("    " + compact(k) + ":" + compact(v) for k, v in clubs.items()) + "\n  };\n"
    result = "  Object.values(formations).forEach(Object.freeze);\n  Object.values(clubs).forEach(c=>{[...c.players,...c.reserves].forEach(p=>{Object.freeze(p[2]);Object.freeze(p);});Object.freeze(c.players);Object.freeze(c.reserves);Object.freeze(c.slots);Object.freeze(c);});\n  return Object.freeze({roster:\"fifa17-launch-170002\",source:" + compact(SOURCE) + ",sourceSha256:" + compact(sha) + ",rowCount:" + str(count) + ",columns:Object.freeze([\"name\",\"overall\",\"player_positions\",\"team_position\",\"team_jersey_number\",\"nationality\"]),formations:Object.freeze(formations),clubs:Object.freeze(clubs)});"
    write_module(ROOT / "data/fifa17Players.js", "CareerModeFifa17Players", intro + "  // Club is the outer key. Player rows follow columns; positions are in source preference order.\n", constants, result)
    constants = "  const squads={\n" + ",\n".join("    " + compact(k) + ":" + compact(v) for k, v in squads.items()) + "\n  };\n"
    result = "  Object.values(squads).forEach(s=>{[s.xi,s.subs,s.reserves].forEach(rows=>{rows.forEach(Object.freeze);Object.freeze(rows);});Object.freeze(s);});\n  return Object.freeze({listVersion:2,roster:\"fifa17-launch-170002\",squads:Object.freeze(squads)});"
    write_module(ROOT / "data/rosterSquads.js", "CareerModeRosterSquads", intro + "  // XI/subs retain R87-2's selection and source-order ties. Hidden reserves are the next 3\n  // highest-rated distinct non-starters, ties by lower shirt number. Rows: [position, name, shirt, overall].\n", constants, result)
    size = (ROOT / "data/fifa17Players.js").stat().st_size
    assert size < 400_000, size
    print(compact(dict(clubs=len(clubs), rows=count, bytes=size, sourceSha256=sha, unmatched=unmatched)))


if __name__ == "__main__":
    main()
