# HO-037 · Team V → Team G · Rebuild 200 Special Players from FIFA 17 launch data (Nik decision)

```ticket
{
 "id": "HO-037",
 "from": "V",
 "to": "G",
 "title": "Rebuild 200 Special Players from FIFA 17 launch data (Nik decision)",
 "kind": "build",
 "priority": "top",
 "worker": "",
 "parent": null,
 "job": null,
 "status": "SENT",
 "steps": [],
 "evidence": [],
 "log": [{"at": "2026-10-28T17:49:16Z", "by": "V", "status": "SENT", "note": ""}]
}
```

# Rebuild the 200 Special Players from the FIFA 17 LAUNCH database

**Nik's decision (28 Oct 2026, 1:48 p.m. Eastern, decision card in the Team V Special Player thread):** "Launch data, re-rank all 200". Team G owns `data/marqueePlayers.js`, so this is yours.

## Why
Team V ran GPT-5.6 Terra job 1851 to check every card against FIFA 17 cards. Result: the current list was built from a LATER FIFA 17 squad update (Jan to spring 2017), not the September 2016 launch database.
- 112 of 200 overalls differ from launch (Mbappé 79 in file, 71 at launch; Belotti 82 vs 77; Donnarumma 80 vs 76).
- Some clubs are post-January moves (Deulofeu at Milan, launch club Everton; Halilović at Las Palmas, launch club Hamburg; Draxler at PSG, launch club Wolfsburg).
- Only 21 of about 660 checked values matched. The 6 face stats were computed from sub-attributes, not taken from the cards.
- **Gabriel Jesus is not in the launch database** (he was added later at Man City). Nik: remove him.

## What to do
1. Rebuild the list from the FIFA 17 launch roster (SoFIFA roster 170002 / FUT base cards as of the September 2016 release), using your same ranking rule. Some players will drop out and others come in. That is expected.
2. For every player use the launch values: overall, potential, club, position, shirt number, nation, and the **six face stats exactly as printed on the base card** (PAC SHO PAS DRI DEF PHY; goalkeepers DIV HAN KIC REF SPD POS). Do not compute stats from sub-attributes.
3. Keep the row shape the Big Jump preview reads: `[rank,name,club,ovr,pot,number,nationCode,position,statsEntries]`.
4. Tier colours stay by rank: 1-3 black, 4-10 blue, 11-20 gold, 21-50 silver, 51-200 bronze.
5. When done, send Team V the SHA. Team V re-inlines the list into the Big Jump preview and re-checks crests for any new clubs.

## Evidence (Terra 1851, on factory/v1-wtt5ye)
- Per-field check of all 200: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HO-035/stats-1851/stats_check_1851.csv (columns: rank, name, club, field, file_value, real_value, status, source_url; most sources FUTWIZ FIFA 17 base cards).
- The 9 players Terra could not find as FUT cards, with launch Career Mode values: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HO-035/stats-1851/missing_player_stats_1851.csv
- All 200 rows with sources: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HO-035/stats-1851/marquee_200_with_career_fallbacks.json
- Notes: https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HO-035/stats-1851/README.md and https://github.com/nikahanghojjati-oss/fifa17-career-showdown2/blob/factory/v1-wtt5ye/project-documents/factory/reviews/HO-035/stats-1851/remaining10.json

Terra's caveat: FUTWIZ/FUTBIN card values are the best public source for launch cards; the community roster export has no verified calendar date. Prefer the FUT base card where both exist.
