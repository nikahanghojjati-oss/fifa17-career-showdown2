import os,sys
REPO=sys.argv[1]; OUT=sys.argv[2]; PIN=sys.argv[3]
COMMON=f"""You are an independent red-team reviewer. Read only the code in this file. Change nothing, write no patches longer than 5 lines.

## The game in 8 lines
A private two-player FIFA 17 career "Showdown" between exactly two managers, Nik and Daniel, each on his own phone or Chromebook, sharing one Firebase Firestore database (Spark free tier: every read and write counts). A Showdown is 1, 3, 5 or 10 seasons. Each season runs in a fixed order that is never skipped: Roulette (squad shot) -> Prime Pack (guess a masked player, 4/3/2/1 points, one winner or none) -> Transfer War (15-minute shared window on the server clock, private signings) -> season played in FIFA -> each manager enters and publishes his own result -> both tap CONFIRM SEASON -> ONE shared season commit -> next season, or Terminal Close and Final Winner after the last season. Sacked: either manager ticks it on Season Results and the Showdown ends after that season; points so far decide. Equal points are a DRAW: there is no tiebreak anywhere. Golden Showdown = 150 points over 10 seasons; perfect season = 15. Finished Showdowns feed History and career totals; unfinished or ended-early ones that never finished stay out.

## Code
Repo nikahanghojjati-oss/fifa17-career-showdown2, commit {PIN} (main: release 2.11.0, live since 2026-11-23, with the 3D League Roulette). Every file below is the exact file at that commit, each line prefixed with its line number. Rules files are Firestore security rules fragments that are composed into the deployed rules.

## Threat model (important)
This is a private two-player tool. Out of scope: anything that needs a modified app, hand-made Firestore requests, a third person, a stolen account, or "an attacker". In scope: anything that can happen in NORMAL play on the real app: two phones acting at the same instant, double taps, retries after a network error, a phone offline or asleep, a tab killed or reloaded at any moment, a phone joining late, a phone clock that is minutes off, a slow network, an older app version on one phone.

## What counts as a finding
A finding must give: (1) what the player sees, (2) an exact sequence of normal actions that causes it, (3) the file:line(s) in THIS packet that cause it, with a short quote, (4) severity, (5) a one-line fix idea. You cannot run the code, so label each finding TRACED (you followed every step through the quoted code and are sure) or UNSURE (it depends on code not in this packet, or timing you could not settle; say exactly what). Never present a guess as a bug. Before reporting, try to refute each finding yourself by looking for the guard that would stop it; drop it if you find one.
Severity: P0 = the game cannot continue, for good, or data is lost; P1 = a step is blocked, or a wrong result/score/winner sticks; P2 = wrong but recoverable (a reload fixes it); P3 = cosmetic or wording.

## Do not report
Style, naming, refactors, performance unless it costs Firebase reads in normal play (then give the count), looks/fonts/layout, missing comments, tests, and anything in "Known" below. At most 8 findings; stop when you have 3 TRACED P0/P1.

## Report format (plain words, one markdown answer)
First line: VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
Then one block per finding: ID ({{JOB}}-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.
"""
JOBS=[
 ("FJ1","Prime Pack: one award, server time",["js/iconGuessStep.js","js/iconGuess.js","firestore.season-results-production.fragment.rules"],
  ["Can both managers get Prime Pack points in one season, or neither when one guessed right first, or the wrong stage's points (4/3/2/1)? Cover both right at the same instant, a guess sent just as a stage ends, a retry after a network error, a double tap, a phone whose clock is minutes off.",
   "Can a manager use more than 2 guesses, or lose a guess he never sent?",
   "Does a reload or late join land on the right stage with the right guesses left, on both phones?",
   "Does the Rules fragment ever refuse a normal guess or arrival (permission-denied), or accept one that gives the wrong points?",
   "Is there any 11 or 110 score, tiebreak, or a stage 5 that still accepts guesses (stage 5 is full reveal, no guessing)?"],
  "Older Showdowns before Prime Pack shipped never play it (by design)."),
 ("FJ2","Transfer War: shared window, timers, closing once",["js/productionSharedTransferChallenge.js"],
  ["Does the 15-minute window open, run and close on the server clock so both phones agree, including a phone whose own clock is wrong and one that joins late?",
   "Can the window close twice, never close, or close for one phone only? Cover expiry racing with a manager's last signing.",
   "After a reload or reconnect at any moment of the window, does the phone land in the right phase with nothing lost or doubled?",
   "Can a Rules refusal (permission-denied) in normal play leave a phone stuck with no way forward?",
   "Is any Transfer War state shown to one manager that reveals the other's private signings before the game reveals them?"],
  "A phone on an older version is refused a newer Showdown until it opens Home (by design)."),
 ("FJ3","Transfer War: private ledgers and verdicts",["js/sparkSharedTransferChallenge.js","js/sharedTransferChallenge.js","firestore.transfer-challenge-production.fragment.rules"],
  ["Can one manager's private signings or guesses be read or shown to the other before the reveal, in normal play?",
   "Can a verdict be lost, written twice, or counted twice? Cover both managers finishing at the same instant and a retry after an error.",
   "Can a shot (guessed) player from this season's Roulette be signed in the Transfer War? Can the Special Player come from the manager's own club?",
   "Do transactions and Rules agree: is any normal write refused, or any wrong write accepted?",
   "Any normal path that costs many extra Firestore reads (give the count)?"],
  "None."),
 ("FJ4","Roulette squads: the shot counts once, boards stay right",["js/rosterRouletteStep.js","js/rosterRoulette.js"],
  ["Is each season's shot recorded exactly once and shown the same on both phones, including a reload or lost graphics mid-turn?",
   "Do the boards build correctly over 1-10 seasons: 11 starters + 4 bench from the manager's own club pool, the shot player out, kept signings in, hidden reserves coming back when better players are lost, shrinking to 14 by season 10 only when the club runs out?",
   "Can the shot (guessed) player ever rejoin a board or be signed again? Can the Special Player ever appear on a board?",
   "Can namesakes (two players with the same name) bar or admit the wrong man?",
   "Does a missing or unreadable season (network error) build a wrong board silently instead of showing a recoverable error?"],
  "The Roulette cylinder lands uniformly on 7 holes, never back to the start hole (by design)."),
 ("FJ5","Season results: entering and publishing",["js/productionSharedSeasonResults.js","js/productionSharedSeasonResultsRoute.js","firestore.season-results-production.fragment.rules"],
  ["Can a manager's published result be changed, lost or overwritten by the other phone, or by his own second tap or retry?",
   "When both have published, does each phone reliably show CONFIRM SEASON, including after a reload, a failed read, or one phone offline at the moment the other published?",
   "Is the Sacked tick carried correctly into what is published, from either manager?",
   "Europa League +3 and Champions League +5, never both: can both be applied, or the wrong one?",
   "Does any normal step get permission-denied from the Rules, or pass a value the Rules should have refused?"],
  "None."),
 ("FJ6","Season commit: exactly once",["js/productionSharedSeasonCommit.js","firestore.season-commit-production.fragment.rules","js/productionSharedLocalReconciliation.js"],
  ["Can a season get zero commits (stuck for good) or two (double count)? Cover both CONFIRMs at the same instant, a double tap, a retry after a network error, and one phone offline during the other's CONFIRM.",
   "Can local reconciliation make one phone believe a season is committed when the shared record says otherwise, or the reverse, for longer than one refresh?",
   "Does a commit ever use one phone's local numbers instead of the shared published results?",
   "Do the Rules refuse any normal commit, or come near the 1,000 expressions per document limit at season 10?",
   "After the commit, is the next season (or the end) reached on both phones?"],
  "None."),
 ("FJ7","Next season, Sacked and the end",["js/productionSharedMultiSeasonProgression.js","js/productionSharedTerminalClose.js","firestore.terminal-close-production.fragment.rules"],
  ["After a commit, can the next season start twice, never start, or start on one phone only?",
   "Sacked in season 1, a middle season and the last season, by either manager or both: does the Showdown end after that season on both phones with the right points?",
   "Terminal Close: can it run twice, never run, or name a different winner (or draw) on the two phones? Equal points must be a draw.",
   "Reload or kill the tab during Terminal Close: does each phone land on Final Winner with the right numbers?",
   "Can a Showdown that ended early or never finished be counted as finished?"],
  "Under very slow Firestore there is a wait of ~11 s on Remote Joining before Final Winner (known)."),
 ("FJ8","Reload, reconnect and re-entry",["js/productionSharedJourneyEntry.js","js/productionSharedJourneyReconnect.js","js/productionSharedJourneyGuard.js","js/productionSharedJourneyConflicts.js"],
  ["Reopen a tab at each step of a season (Roulette, Prime Pack, Transfer War, results, between the two CONFIRMs, after the last CONFIRM, during Terminal Close): does it land on the right screen within ~10 s?",
   "Can re-entry ever invent the other manager's action, or skip or reorder a needed screen?",
   "Can a stale cached state (old tab, old version) win over the shared state?",
   "Can two tabs of the same manager on one phone corrupt progress?",
   "Any re-entry path that loops, polls without end, or costs many reads in normal play (give the count)?"],
  "Home auto-JOIN polls every 20 s for at most 10 min (by design)."),
 ("FJ9","Scoring, Final Winner and History",["js/productionSharedCanonicalScoring.js","js/productionSharedHistoryConvergence.js","js/productionSharedFinalReconciliation.js"],
  ["Do season points, totals, winner or draw, Golden Showdown (150 over 10 seasons) and perfect season (15) come out the same on both phones from the same results?",
   "Is there any tiebreak anywhere (equal points must always be a DRAW)?",
   "Can History or career totals count an unfinished, ended-early-unfinished or unjoined Showdown, or miss a finished one from r79 onward?",
   "Can the two phones' History disagree for longer than one refresh?",
   "Any rounding or missing-value case (a season with no result, Sacked season) that gives a wrong total?"],
  "Showdowns finished before r79 are hidden on purpose."),
 ("FJ10","3D quality: per-screen holds and the Device check",["js/gfxTier.js","device-check.html"],
  ["Since 2.10.0: a tab crash or lost graphics context on one 3D screen should lower ONLY that screen (a hold), for 7 days, 3 clean plays of that screen, a Settings pick, or a new build. Can a hold leak to other screens, never end, or end too early? Can calibration of a held screen change the device level or other screens?",
   "Device check: the run is saved for 30 minutes so a closed tab resumes it. Can a resumed run write a wrong level, run twice, or leave a run that never ends? Two tabs at once?",
   "Can a hand-picked level in Settings be exceeded, or ignored?",
   "Can any path here stop the game from moving on (a screen that never starts or never reports done)?",
   "Old saved caps (one object, no screen) must still hold every screen: is that kept?",
   "New in 2.11.0: the League Roulette board (scene league) draws sharper than its level (gfxSharpBoard). Can that undo a hold on the league, change the device level or another screen, or make calibration step the wrong way?"],
  "Phones free Roulette's painted canvases after upload (by design); a lost context on such a phone hands over to the result card instead of rebuilding."),
 ("FJ11","Pairing and joining",["js/sparkRemoteJoining.js","firestore.persistent-pair-production.fragment.rules"],
  ["Permanent pairing: can the two managers end up paired to different Showdowns, or one paired and one not, after JOIN races, a retry, or one phone offline?",
   "Only Daniel starts a Showdown and picks the season count: can Nik's phone start one, or both phones start two?",
   "JOIN on Home and UNPAIR in Settings: can UNPAIR on one phone leave the other stuck?",
   "Does any normal join step get permission-denied, or does the Rules fragment come near its expression limits?",
   "Any join path that costs many reads while waiting (give the count per minute)?"],
  "Home auto-JOIN polls every 20 s for at most 10 min (by design)."),
 ("FJ12","Career start and shared setup",["js/productionSharedCareerStart.js","firestore.career-start-production.fragment.rules","firestore.shared-setup-production.fragment.rules"],
  ["Can the two phones start the Showdown with different leagues, clubs, season count or Special Player?",
   "Can the Special Player come from the manager's own club, or fall outside the top-300 high-potential list?",
   "Reload or late join during setup: does each phone land on the right step with the right choices?",
   "Can a failed write leave setup half-done with no way forward?",
   "Does any normal setup step get permission-denied from the Rules?"],
  "None."),
 ("FJ13","League Roulette: four balls, one league",["js/leagueRouletteStep.js","js/sparkSharedShowdownSetup.js","js/sharedShowdownSetup.js","firestore.shared-setup-production.fragment.rules"],
  ["New in r98: the league is chosen on a 3D roulette. Daniel drops ball 1 (this also commits the league from the shared draw), then Nik ball 2, Daniel ball 3, Nik ball 4; each ball removes one of the 5 leagues; clubs (Ball Game) may start only after ball 4. Can a ball be dropped twice, out of turn, by the wrong manager, or skipped? Cover a double tap, a retry after a network error, and both phones tapping at the same instant.",
   "Can the two phones ever show different eliminated leagues, a different order, or a different final league? Is the final league always the one the shared draw gives, after reload and late join?",
   "Reload, kill the tab or go offline between any two balls: does each phone land on the right ball with the right leagues already removed, and can play always continue?",
   "Can the Rules refuse a normal drop or clubs step (permission-denied), accept a drop count that is wrong (for example jumping from 1 to 3, or going backwards), or let clubs start before 4 balls? Do older Setups (draw 1, 2 or 3 without the roulette) still work unchanged?",
   "Any normal path here that costs extra Firestore reads beyond 3 small writes per Showdown (give the count)?"],
  "When WebGL is missing, the old 2D wheel is shown instead of the 3D board (by design). The look of the board is out of scope."),
]
os.makedirs(OUT,exist_ok=True)
index=[]
for code,title,files,qs,known in [j for j in JOBS if j[0] not in ("FJ12","FJ13")]:
    body=f"# Fable 5.2 red-team job {code}: {title}\n\n"+COMMON.replace("{JOB}",code)
    body+="\n## The questions, in priority order\n"+"\n".join(f"{i+1}. {q}" for i,q in enumerate(qs))
    body+=f"\n\n## Known (do not report)\n{known}\n\n## Files\n"
    for f in files:
        src=open(os.path.join(REPO,f),encoding="utf-8").read().split("\n")
        lang="javascript" if f.endswith(".js") else ("html" if f.endswith(".html") else "")
        body+=f"\n## FILE: {f} ({len(src)} lines)\n```{lang}\n"+"\n".join(f"{n+1}: {l}" for n,l in enumerate(src))+"\n```\n"
    body+=f"\n(End of packet {code}. Answer with the report only.)\n"
    name=f"FABLE_{code}_R99.md"
    open(os.path.join(OUT,name),"w",encoding="utf-8").write(body)
    index.append((code,title,name,len(body.encode())))
for c,t,n,b in index: print(c,b//1024,"KB",n,"|",t)
