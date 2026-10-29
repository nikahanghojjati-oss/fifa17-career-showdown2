# Sol job: FIFA 17 launch squads for Squad Roulette boards (r87)

Branch: research/r87-squads (never merge). Add files only under gameplay/r87/squads/. Edit nothing else.

## Goal
For each of the 98 clubs in gameplay/r87/squads/DRAFT_FULLDATA_EARLY2017.json, record the club's squad
as it was in the FIFA 17 **launch (release) squads**, the roster FIFA 17 shipped with in September 2016
(sofifa.com: the earliest FIFA 17 roster update, "FIFA 17" with the Sep 2016 date). Do NOT use later live squad updates.

The draft file comes from a Kaggle dataset of an early-2017 update, so it is close but not launch:
start from it and correct it to launch.

## Sources (use the first one that loads; sofifa.com returns 403 to ChatGPT, so skip it)
1. **FIFAIndex, FIFA 17 launch version**: https://www.fifaindex.com/teams/fifa17_1/ (the `fifa17_1` part = the first FIFA 17 roster).
   Each club page (e.g. https://www.fifaindex.com/team/11/manchester-united/fifa17_1/) lists the squad; pick the XI and
   bench as the squad screen shows them.
2. **Wayback Machine copies of sofifa** from Sep-Oct 2016: https://web.archive.org/web/2016*/sofifa.com/team/*
3. **FUTHEAD / FUTBIN FIFA 17** club squads for player names, positions and ratings.
4. If none loads for a club: copy that club from the draft file and set note "draft: early-2017 squad, launch not verified".

Check against Nik's screenshots (gameplay/r87/reference/): launch Manchester United = De Gea; Valencia, Bailly, Blind,
Darmian; Herrera, Pogba; Mkhitaryan, Rooney, Martial; Rashford. Subs Mata, Carrick, Fellaini, Young.
Launch Real Madrid XI = Navas; Carvajal, Varane, Ramos, Marcelo; Modrić, Kroos, Rodríguez; Bale, Benzema, Ronaldo.
Subs Morata, Vázquez, Isco, Casemiro. If your source disagrees with these, it is not the launch roster.

## Per club, record
- formation (e.g. "4-3-3")
- startingXI: 11 entries {pos, name, number, rating}. pos uses the FIFA squad-screen labels
  (GK, RB, RCB, LCB, LB, CDM, RCM, LCM, CAM, RW, LW, ST, RM, LM, CF, LS, RS, LDM, RDM, LAM, RAM, LWB, RWB, CB, CM).
- subs: ONLY the first 4 substitutes in the order the FIFA 17 squad screen lists them (Nik's rule: 4 subs, no reserves),
  {pos, name, number, rating}. Example from Nik's screenshot (gameplay/r87/reference/): Manchester United subs = Mata, Carrick, Fellaini, Young.
- source: the sofifa URL you used for that club and roster date.
- note: anything uncertain. Write "unknown" instead of guessing. Never invent a player.

## Order (one league per reply, then stop)
1. premier_league -> gameplay/r87/squads/premier_league.json
2. laliga -> laliga.json
3. bundesliga -> bundesliga.json
4. serie_a -> serie_a.json
5. ligue_1 -> ligue_1.json
Each run: check which of these files already exist on the branch, do the NEXT missing league only,
save and push it, then reply "DONE <league> <club count> <unknown count>". Nik types "next" for the following league.

## Checks before saving
- Club names exactly as in the draft file's "club" field.
- 11 starters and exactly 4 subs per club; one GK in the XI.
- Valid JSON array of {club, formation, startingXI, subs, source, note}.
