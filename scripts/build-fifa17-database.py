#!/usr/bin/env python3
"""Build the full FIFA 17 launch player list for Transfer War name autocomplete (r91, 2.4.0).

Python standard library only. Usage:
    python3 scripts/build-fifa17-database.py path/to/players_17.csv

Source: the same hash-pinned players_17.csv (SoFIFA roster 170002, FIFA 17 v1.11 "Reset All Squads", checked by Nik
2026-11-11) that scripts/build-fifa17-rosters.py reads. The CSV is not committed; only its URL and sha256 are.

Output:
    data/fifa17/players-170002.<sha8>.json   columnar JSON, all 17,597 players (224 free agents included)
    data/fifa17/players-170002.manifest.json counts and sizes (tests and the Story quote these)
    js/playerSearch.js                       its PLAYERS_FILE constant is rewritten to the new name

Each check below fails the build, so nothing is ever silently wrong.
"""
import collections
import csv
import gzip
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/ifrankandrade/data-visualization/main/datasets/players_17.csv"
SOURCE_SHA256 = "f2d35920e5cddb28d750924281c4e4095fdc485a5d8358497cd579b1b7b5e03a"
ROSTER = 170002
LONG_NAME_MIN_OVERALL = 75
GZIP_BUDGET = 320 * 1024

# CSV league name -> our league id (data/transferOptions.js). Exact names only: an unknown league fails the build.
# The last five have only 1-5 clubs each in FIFA 17 and sit under Rest of World there (Nik checked in FIFA 17,
# 2026-11-11 00:20 UTC: Shakhtar Donetsk, Olympiacos, PAOK, Panathinaikos, HJK, Kaizer Chiefs, Orlando Pirates, Vasco...).
LEAGUES = {
    "Argentina Primera División": "argentina-primera-division",
    "Australian Hyundai A-League": "australia-a-league",
    "Austrian Football Bundesliga": "austria-bundesliga",
    "Belgian Jupiler Pro League": "belgium-pro-league",
    "Campeonato Brasileiro Série A": "brazil-serie-a",
    "Chilian Campeonato Nacional": "chile-campeonato-nacional",
    "Colombian Liga Postobón": "colombia-liga-dimayor",
    "Danish Superliga": "denmark-superliga",
    "English Premier League": "england-premier-league",
    "English League Championship": "england-championship",
    "English League One": "england-league-one",
    "English League Two": "england-league-two",
    "French Ligue 1": "france-ligue-1",
    "French Ligue 2": "france-ligue-2",
    "German 1. Bundesliga": "germany-bundesliga",
    "German 2. Bundesliga": "germany-2-bundesliga",
    "Holland Eredivisie": "netherlands-eredivisie",
    "Italian Serie A": "italy-serie-a",
    "Italian Serie B": "italy-serie-b",
    "Japanese J. League Division 1": "japan-j1-league",
    "Korean K League Classic": "korea-k-league-classic",
    "Mexican Liga MX": "mexico-liga-mx",
    "Norwegian Eliteserien": "norway-tippeligaen",
    "Polish T-Mobile Ekstraklasa": "poland-ekstraklasa",
    "Portuguese Liga ZON SAGRES": "portugal-liga-nos",
    "Rep. Ireland Airtricity League": "ireland-airtricity-league",
    "Russian Premier League": "russia-premier-league",
    "Saudi Abdul L. Jameel League": "saudi-dawry-jameel",
    "Scottish Premiership": "scotland-premiership",
    "Spain Primera Division": "spain-primera-division",
    "Spanish Segunda División": "spain-segunda-a",
    "Swedish Allsvenskan": "sweden-allsvenskan",
    "Swiss Super League": "switzerland-super-league",
    "Turkish Süper Lig": "turkey-super-lig",
    "USA Major League Soccer": "usa-major-league-soccer",
    "Campeonato Brasileiro Série B": "rest-of-world",
    "Finnish Veikkausliiga": "rest-of-world",
    "Greek Super League": "rest-of-world",
    "South African Premier Division": "rest-of-world",
    "Ukrainian Premier League": "rest-of-world",
}
# Launch nationalities not yet in data/transferOptions.js. Nik (2026-11-11 00:17 UTC) asked for both to be added; that
# changes the Rules' nationality pattern, so it ships with the r91 Squad Management Rules deploy (thread 1). Until then
# their id is null here and the page resolves the stored label at run time, so the day the catalog gains them they map
# with no rebuild. Any OTHER unmapped nationality fails the build.
PENDING_NATIONALITIES = {"Kyrgyzstan", "Sudan"}
POSITIONS = {"GK", "RB", "RWB", "CB", "LB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "ST"}


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def node_json(script):
    return json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT))


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    raw = Path(sys.argv[1]).read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    assert sha == SOURCE_SHA256, f"players_17.csv sha256 {sha} is not the pinned {SOURCE_SHA256}"
    rows = list(csv.DictReader(raw.decode("utf-8-sig").splitlines()))

    # Our catalogs, read with Node from the shipped file (the page's own source of truth).
    opts = node_json(
        "const fs=require('fs'),vm=require('vm'),c={window:{}};vm.createContext(c);"
        "vm.runInContext(fs.readFileSync('data/transferOptions.js','utf8'),c);const w=c.window;"
        "console.log(JSON.stringify({leagues:w.FIFA17_TRANSFER_LEAGUES.map(l=>l.id),"
        "nations:Object.fromEntries(" + compact(sorted({r["nationality"] for r in rows})) + ".map(n=>{const o=w.resolveFifa17TransferOption('nationality',n);return [n,o?o.id:null];}))}));"
    )
    our_leagues = set(opts["leagues"])
    for league_id in set(LEAGUES.values()):
        assert league_id in our_leagues, f"{league_id} is not a league id in data/transferOptions.js"

    # 1. Rows: one roster, unique ids, sane values.
    assert len(rows) == 17597, len(rows)
    assert all(r["player_url"].endswith(f"/{ROSTER}") for r in rows), "a row is not from roster 170002"
    rows.sort(key=lambda r: int(r["sofifa_id"]))
    ids = [int(r["sofifa_id"]) for r in rows]
    assert len(set(ids)) == len(ids), "duplicate SoFIFA id"
    assert all(0 < i <= 300000 for i in ids), "SoFIFA id outside 1..300000"

    # 2. Leagues and clubs.
    unknown = sorted({r["league_name"] for r in rows if r["league_name"] and r["league_name"] not in LEAGUES})
    assert not unknown, f"unmapped leagues: {unknown}"
    league_ids = sorted(set(LEAGUES.values()))
    club_names = sorted({r["club_name"] for r in rows if r["club_name"]})
    club_league = {}
    for r in rows:
        if not r["club_name"]:
            assert not r["league_name"], r["short_name"]
            continue
        lid = LEAGUES[r["league_name"]]
        assert club_league.setdefault(r["club_name"], lid) == lid, f"{r['club_name']} sits in two leagues"
    clubs = [[name, league_ids.index(club_league[name])] for name in club_names]
    club_index = {name: i for i, name in enumerate(club_names)}

    # 3. Nationalities.
    nation_labels = sorted({r["nationality"] for r in rows})
    nation_ids = [opts["nations"][n] for n in nation_labels]
    unmapped = sorted(n for n, i in zip(nation_labels, nation_ids) if i is None)
    assert set(unmapped) <= PENDING_NATIONALITIES, f"unmapped nationalities: {sorted(set(unmapped) - PENDING_NATIONALITIES)}"
    nation_index = {n: i for i, n in enumerate(nation_labels)}

    # 4. Columns.
    cols = collections.OrderedDict((k, []) for k in ("id", "n", "f", "o", "p", "pos", "c", "na", "a", "sh"))
    for r in rows:
        positions = r["player_positions"].split(", ")
        assert positions and all(p in POSITIONS for p in positions), (r["short_name"], positions)
        overall, potential = int(r["overall"]), int(r["potential"])
        assert 40 <= overall <= 99 and overall <= potential <= 99, r["short_name"]
        shirt = r["team_jersey_number"]
        cols["id"].append(int(r["sofifa_id"]))
        cols["n"].append(r["short_name"].strip())
        long_name = r["long_name"].strip()
        cols["f"].append(long_name if overall >= LONG_NAME_MIN_OVERALL and long_name != r["short_name"].strip() else 0)
        cols["o"].append(overall)
        cols["p"].append(potential)
        cols["pos"].append(",".join(positions))
        cols["c"].append(club_index[r["club_name"]] if r["club_name"] else -1)
        cols["na"].append(nation_index[r["nationality"]])
        cols["a"].append(int(r["age"]))
        cols["sh"].append(int(float(shirt)) if shirt else 0)
    free_agents = sum(1 for c in cols["c"] if c == -1)
    assert free_agents == 224, free_agents
    assert len(clubs) == 632, len(clubs)

    data = collections.OrderedDict([
        ("v", 1), ("roster", ROSTER), ("source", {"url": SOURCE, "sha256": SOURCE_SHA256}),
        ("count", len(rows)), ("leagues", league_ids), ("nations", nation_labels), ("nationIds", nation_ids),
        ("clubs", clubs), ("cols", cols),
    ])
    body = (compact(data) + "\n").encode("utf-8")
    gz = len(gzip.compress(body, 9, mtime=0))
    assert gz <= GZIP_BUDGET, f"gzip {gz} over budget {GZIP_BUDGET}"
    name = f"players-{ROSTER}.{hashlib.sha256(body).hexdigest()[:8]}.json"
    out_dir = ROOT / "data/fifa17"
    out_dir.mkdir(exist_ok=True)
    for old in out_dir.glob(f"players-{ROSTER}.*.json"):
        if old.name != name and not old.name.endswith("manifest.json"):
            old.unlink()
    (out_dir / name).write_bytes(body)
    manifest = collections.OrderedDict([
        ("file", f"data/fifa17/{name}"), ("roster", ROSTER), ("sourceSha256", SOURCE_SHA256),
        ("players", len(rows)), ("freeAgents", free_agents), ("clubs", len(clubs)), ("leagues", len(league_ids)),
        ("nationalities", len(nation_labels)), ("pendingNationalities", unmapped),
        ("longNames", sum(1 for f in cols["f"] if f)), ("longNameMinOverall", LONG_NAME_MIN_OVERALL),
        ("bytes", len(body)), ("gzipBytes", gz),
    ])
    (out_dir / f"players-{ROSTER}.manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    search = ROOT / "js/playerSearch.js"
    text = search.read_text(encoding="utf-8")
    new_text, count = re.subn(r'const PLAYERS_FILE="data/fifa17/players-\d+\.[0-9a-f]{8}\.json";',
                              f'const PLAYERS_FILE="data/fifa17/{name}";', text)
    assert count == 1, "js/playerSearch.js has no PLAYERS_FILE constant to update"
    search.write_text(new_text, encoding="utf-8")
    print(compact(manifest))


if __name__ == "__main__":
    main()
