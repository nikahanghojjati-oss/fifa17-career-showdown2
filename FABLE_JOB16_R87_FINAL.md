# Fable job 16: last check before "merge r87" (Career Mode Showdown 2.0.0)

Code snapshot: repo nikahanghojjati-oss/fifa17-career-showdown2. Final 2.0.0 candidate = release PR #1156 head ae3f3c473107b4156770e3448209216b553063eb (base gameplay/r87 e0b7eb85). Live production is 1.9.10-r86. The merge happens in about 40 minutes, so **report only P0 and P1**: each with exact file:line at ae3f3c47, the code quoted, a concrete proof scenario (steps, data, timeline), expected vs actual, and the smallest fix as a unified diff. Do not report P2, style, wording or hardening against a modified app. If you find nothing at P0/P1 in an area, say "none found" for it with one line on what you checked.

Earlier reviews (jobs 13-15) read the older build 258f3f3e. This job covers only the code changed since then:
1. **PR #1184, 15/150 on every screen.** Perfect season = 15, Golden Showdown = 150 everywhere. `perfectSeasons` inside js/sharedHistoryConvergence.js projections deliberately stays `score >= 11` (projections are rebuilt and compared byte for byte by `verifyProjection`, and stored as create-only Firebase careerSummary payloads); screens count 15s themselves through sharedCareerAnalytics and sharedActiveShowdownAdapter. #1184 adds a tolerance in verification for `perfectSeasons` only. **Hunt:** can that tolerance let a projection with any other wrong field (totals, winner, seasons) pass as valid? Can it mark a good stored summary "tampered/unavailable"? Does any screen still show 110, 11-point perfect, or count an 11 as perfect? Is any 150-150 or equal total ever shown with a winner (no tiebreak anywhere)?
2. **Ending an old Showdown on 2.0.0.** Nik has a pre-2.0.0 Showdown that may still be mid-season when the phones update. He must be able to END SHOWDOWN in Settings on 2.0.0 and then start a fresh 2.0.0 Showdown. **Hunt:** any path where END on 2.0.0 of a 1.9.10-era Showdown is refused, gets stuck, leaves the partner's phone stuck, or where the next Showdown inherits the old one's Setup, confirm time, Special Player, or 11-point maths. Excerpts of the END path and its Rules are below.
3. **PR #1185, Prime Pack fixes:** a failed screen withdraws this manager's arrival (leave in fail), re-arrive every 3 s while on screen and waiting, the roulette panel closes only when the pack page is ready, unknown confirm time fails closed (TRY AGAIN) at the transfer gate and at publish, the draw verdict waits until 97 s (the Rules accept a winning write until 97 s after the later arrival). **Hunt:** can the re-arrive loop fight a deliberate leave (BACK) or the other tab, burn reads, or restart a decided round? Can fail-closed block a legitimate 2.0.0 or old Showdown forever (stuck)? Can a point still be dropped, doubled, or given to the wrong manager? Can the new 97 s draw wait leave both phones hanging?
4. **PR #1187, Trophy Room tap:** one delegated click handler that survives redraws. Hunt: double navigation, a dead tap, or a handler leak across screens.
5. **Release items (commit 6a575de1 in #1156):** set-release-time.cjs refuses a time earlier than 90 min from now; the Pages rules-first job now waits up to 45 min. Hunt: can the guard or the wait break the release itself (tool can't be run at merge, Pages never deploys, site ships ahead of Rules)?

## Scoring truth for 2.0.0 (owner rules; the code must match)
- A season is worth **0 to 15** points (it was 0 to 11). Europa League +3 or Champions League +5, never both. Prime Pack adds 4, 3, 2 or 1 to exactly one manager, or to nobody. **Both managers never score Prime Pack in the same season.**
- **Golden Showdown = 150** in a 10-season Showdown (15 x 10). The owner said on 1 Nov 2026: no real 10-season Showdown was ever played, so there is no 110 record to preserve; every screen, note, Gazette line and record book must say 15 / 150 only. Showdowns started before 2.0.0 never play Prime Pack, and breaking a pre-2.0.0 game is acceptable; a new 2.0.0 game must fully work.
- **No tiebreak anywhere.** Equal totals = DRAW (a 150-150 is a draw); equal career points = LEVEL. League position never decides anything.
- Lengths 1, 3, 5, 10 only. Reus Gate: the loading screen stays until the next screen is ready. No dimming ever. Nothing covers anything at any size. No flash of an old design.

## Prime Pack rules
- Once per season on both phones, after both roulette spins and before the transfer window opens. Only Showdowns confirmed at or after `ICON_FROM_MS` (equal to the roulette's `RRR_FROM_MS`; the release PR pins both to the release time) play it. Kill switch `CMS_PRIME_PACK = "off"`.
- One masked card of a real player (data/icons.js), seeded from the Showdown id, never the same player twice in one Showdown. The answer is never stored; both phones derive it.
- Stages (one table, `STAGES` in js/iconGuess.js): 3 s count-in after the later arrival; S1 = 4 pts (position + 1 real stat; 2.5 s reveal + 25 s guessing); S2 = 3 pts (+1 stat; 1.5 s + 20 s); S3 = 2 pts (+1 stat; 1.5 s + 20 s); S4 = 1 pt (+1 stat; 1.5 s + 20 s); S5 = no guessing, reveals the last 2 stats, name, nationality, overall. A right guess at any stage jumps to S5.
- Each manager has 2 guesses (tokens) per round; wrong guesses spend a token and are never stored. Name matching: `typoRule` in js/iconNames.js.
- The first right guess **by server time** wins; points come from the server time of the winning write at the stage edges (Rules `ssjrPackStagePoints`). The point lands as a sparse `primePack` key on the winner's Season Result; the round record is `rivalries/{rid}/primePackRounds/season_N`.

## Trust model
Normal play only: two real phones, reloads, phone locks, app switching, offline/online, slow networks, clock skew, one phone far behind, cleared storage, two tabs, a service-worker update mid-Showdown, one phone on 1.9.10 and one on 2.0.0. A deliberately modified app is out of scope, EXCEPT where the Firestore Rules are the only guard on points: report a crafted write that gives a manager points he did not win as P1 "hardening".


Finding IDs: F16-NN. Keep the visible reply under about 25,000 characters.


## FILE: PR #1184 diff (code only)
```text
diff --git a/data/commentarySituations.json b/data/commentarySituations.json
index e1e9386386..5d10f49a3b 100644
--- a/data/commentarySituations.json
+++ b/data/commentarySituations.json
@@ -130,7 +130,7 @@
    ]
   },
   "season-perfect": {
-   "when": "a manager scored the maximum 11 points this season (league, Champions League, cup, 100+ points or goals, an award)",
+   "when": "a manager scored the season maximum, 15 points (league, Champions League, cup, 100+ points or goals, an award, a 4-point Prime Pack)",
    "count": 60,
    "slots": [
     "club",
@@ -720,7 +720,7 @@
    ]
   },
   "clock-clinched": {
-   "when": "the leader can no longer be caught (the gap is bigger than 11 points per season left), but seasons remain",
+   "when": "the leader can no longer be caught (the gap is bigger than 15 points per season left), but seasons remain",
    "count": 60,
    "slots": [
     "gap",
diff --git a/index.html b/index.html
index 3303054525..8d9538d278 100644
--- a/index.html
+++ b/index.html
@@ -322,7 +322,7 @@ <h3>TRANSFER VERDICTS</h3>
 
 <section id="seasonEntry" class="screen hidden">
 <h2 id="seasonEntryTitle">SEASON RESULTS</h2>
-<p class="seasonEntryHint">Scoring: Champions League +5 or Europa League +3 (never both in the same season), league title +3, domestic cup +1. 100 league points and/or 100 league goals share one +1 performance bonus. Top Scorer and/or Top Assist share one +1 awards bonus. Maximum season score: 11.</p>
+<p class="seasonEntryHint">Scoring: Champions League +5 or Europa League +3 (never both in the same season), league title +3, domestic cup +1. 100 league points and/or 100 league goals share one +1 performance bonus. Top Scorer and/or Top Assist share one +1 awards bonus. Prime Pack +4, +3, +2 or +1. Maximum season score: 15.</p>
 <div class="seasonEntryGrid">
 <div class="seasonResultCard">
 <div class="seasonManagerHeader"><h3 id="seasonManagerOne">DANIEL</h3><p id="seasonClubOne">Club</p></div>
diff --git a/js/analytics.js b/js/analytics.js
index 0197722d72..9a6ad2e94b 100644
--- a/js/analytics.js
+++ b/js/analytics.js
@@ -259,7 +259,7 @@ function accumulateRoundStats(stats, showdown, round, playerKey){
     if(leagueGoals >= 100){ stats.hundredGoalSeasons += 1; }
     if(player.topScorer){ stats.topScorerSeasons += 1; }
     if(player.topAssist){ stats.topAssistSeasons += 1; }
-    if(score >= 11){ stats.perfectSeasons += 1; }
+    if(score >= 15){ stats.perfectSeasons += 1; }
 
     if(Number.isFinite(leaguePosition) && leaguePosition > 0){
         stats.bestLeaguePosition = stats.bestLeaguePosition === null
diff --git a/js/careerScreenSeam.js b/js/careerScreenSeam.js
index e5b65db395..4c6fb436fb 100644
--- a/js/careerScreenSeam.js
+++ b/js/careerScreenSeam.js
@@ -60,10 +60,10 @@
   // Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An ended-early, unfinished or
   // shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
   // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so its
-  // Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 a season and 110. PRIME_PACK_FROM_MS is
+  // Golden Showdown is 150 in every Showdown (Nik 2026-11-01: no 11 or 110 anywhere). PRIME_PACK_FROM_MS is
   // js/iconGuess.js fromMs (the Roster Roulette boundary; tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
-  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110,primePackPoints:150});
-  const SEASON_MAX=Object.freeze({before:11,primePack:15});
+  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:150,primePackPoints:150});
+  const SEASON_MAX=Object.freeze({primePack:15});
   const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
   const PAIR_ID=/^pair_[0-9a-f]{64}$/;
   function csSeasonScores(row){
@@ -74,15 +74,12 @@
   function csLiveSetup(){try{const state=root.CareerModeProductionSharedShowdownSetup?.getState?.();return state&&state.ready===true&&state.setup?.phase==="SHOWDOWN_CONFIRMED"&&PAIR_ID.test(String(state.rivalryId))&&Number.isFinite(state.setupUpdatedAtMs)?state:null;}catch(_error){return null;}}
   // The most one season of this Showdown can score: 15 with Prime Pack, 11 before. Known from the Showdown's confirm time;
   // without one, a season over 11 can only be Prime Pack, and the live Showdown's Setup (when it is this Showdown) decides.
-  function seasonMaxFor(row){
-    const pack=SEASON_MAX.primePack,before=SEASON_MAX.before;
-    if(row&&PAIR_ID.test(String(row.rivalryId))&&Number.isFinite(row.setupConfirmedAt))return row.setupConfirmedAt>=PRIME_PACK_FROM_MS?pack:before;
-    if(csSeasonScores(row).some(score=>score>before))return pack;
-    const live=csLiveSetup();
-    if(live&&(row?.rivalryId==null||row.rivalryId===live.rivalryId))return live.setupUpdatedAtMs>=PRIME_PACK_FROM_MS?pack:before;
-    return before;
-  }
-  function goldenShowdownPoints(row){return GOLDEN_SHOWDOWN.seasons*seasonMaxFor(row);}
+  // Nik 2026-11-01 18:32 UTC: there is no 11 anywhere. A season is worth at most 15 in every Showdown (one max for the
+  // race maths, perfect seasons and Golden); a Showdown from before 2.0.0 is not kept on its own scale.
+  function seasonMaxFor(_row){return SEASON_MAX.primePack;}
+  // Nik 2026-11-01 17:35 UTC: there was never a real 10-season Showdown before Prime Pack, so no old record to keep. The
+  // Golden Showdown is 150 in every Showdown (seasonMaxFor still gives the race maths each Showdown's own season maximum).
+  function goldenShowdownPoints(_row){return GOLDEN_SHOWDOWN.primePackPoints;}
   function goldenShowdownManagers(row){
     if(!row||row.status!=="completed"||row.totalSeasons!==GOLDEN_SHOWDOWN.seasons||row.seasonsPlayed!==GOLDEN_SHOWDOWN.seasons||!row.totals)return [];
     const points=goldenShowdownPoints(row);
diff --git a/js/careerScreensV10.js b/js/careerScreensV10.js
index 396f355f5e..13c29d2d07 100644
--- a/js/careerScreensV10.js
+++ b/js/careerScreensV10.js
@@ -38,7 +38,7 @@
       return {manager,rank:index<0?null:standings[index].level===true?1:index+1};
     });
   }
-  // r84 Golden Showdown: how many finished 10-season Showdowns each manager closed on the Golden total (110, or 150 with Prime Pack), counted from the completed
+  // r84 Golden Showdown: how many finished 10-season Showdowns each manager closed on the Golden total (150), counted from the completed
   // rows this model already holds (the seam owns the rule). Only a career with one carries the field.
   function v10GoldenShowdowns(model,frame){
     const counts=v10Seam().goldenShowdownCounts(model.history&&model.history.showdowns);
diff --git a/js/commentaryEngine.js b/js/commentaryEngine.js
index 550af1bbda..56f3397560 100644
--- a/js/commentaryEngine.js
+++ b/js/commentaryEngine.js
@@ -70,12 +70,9 @@
   // The most one season can score: 11, or 15 in a Showdown that plays r87 Prime Pack (11 + up to 4; G Lead and Nik
   // 2026-11-01). facts.primePack (true/false) says which; without it, a Prime Pack point or a season over 11 can only be Prime Pack. A season is
   // checked against the larger maximum; every "maximum", "clinched" and Golden line uses this Showdown's own.
-  const MAX_SEASON_POINTS=11,MAX_PRIME_PACK_SEASON_POINTS=15;
-  function ceSeasonMax(facts,sd){
-    if(facts&&facts.primePack===true)return MAX_PRIME_PACK_SEASON_POINTS;
-    if(facts&&facts.primePack===false)return MAX_SEASON_POINTS;
-    return sd.seasons.some(row=>ROLES.some(role=>row.primePack[role]||row.points[role]>MAX_SEASON_POINTS))?MAX_PRIME_PACK_SEASON_POINTS:MAX_SEASON_POINTS;
-  }
+  const MAX_PRIME_PACK_SEASON_POINTS=15;
+  // Nik 2026-11-01 18:32 UTC: one season maximum, 15, in every Showdown (no 11 anywhere): the clock, season-perfect and Golden.
+  function ceSeasonMax(_facts,_sd){return MAX_PRIME_PACK_SEASON_POINTS;}
   // {mpPosition} is read aloud, so it is the spoken position, never the list's code (Nik 2026-10-29). A code not listed here
   // leaves the slot out rather than reading a code.
   const POSITION_WORDS=Object.freeze({LW:"left winger",RW:"right winger",LM:"left midfielder",RM:"right midfielder",CM:"central midfielder",
@@ -317,9 +314,9 @@
       out.push(ceEntry(margin===1?"final-won-by-1":margin<=5?"final-won-by-2-5":margin<=15?"final-won-by-6-15":"final-won-by-16-plus",values));
       if(sd.totals.slice(0,N-1).some(pair=>pair[W]<pair[L]))out.push(ceEntry("final-comeback",values));
       if(sd.totals.every(pair=>pair[W]>pair[L]))out.push(ceEntry("final-wire-to-wire",values));
-      // r86 (red team #12): the Golden Showdown is the Rule Book's 110 (11 in every season of a 10-season Showdown), not any
-      // 10-season win; 150 (15 in every season) in a Showdown with Prime Pack.
-      if(N===10&&totals[W]===ceSeasonMax(facts,sd)*N)out.push(ceEntry("final-golden",values));
+      // r86 (red team #12): the Golden Showdown is the Rule Book's total, not any 10-season win. r87 (Nik 2026-11-01 17:35
+      // UTC): it is 150 (15 in every season) in every Showdown; no other total is Golden.
+      if(N===10&&totals[W]===MAX_PRIME_PACK_SEASON_POINTS*N)out.push(ceEntry("final-golden",values));
       if(N===1)out.push(ceEntry("final-sprint",values));
       if(N>=2&&ceLeaderOf(sd.totals[N-2])===L)out.push(ceEntry("final-last-season-swing",values));
     }else{
diff --git a/js/commentaryV3.js b/js/commentaryV3.js
index b1d68c05b2..ebc977c2f8 100644
--- a/js/commentaryV3.js
+++ b/js/commentaryV3.js
@@ -30,7 +30,7 @@
   const ROLES=Object.freeze(["playerOne","playerTwo"]);
   const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
   const LENGTHS=Object.freeze([1,3,5,10]);
-  const MAX=11,PACK_MAX=15;
+  const PACK_MAX=15;
   // The Prime Pack boundary is js/iconGuess.js fromMs: a Showdown confirmed on or after it plays Prime Pack.
   const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
   const node=typeof module!=="undefined"&&module.exports;
@@ -51,14 +51,8 @@
   // uses this Showdown's own season maximum, the same rule as js/commentaryEngine.js and js/careerScreenSeam.js: 15 in a
   // Showdown that plays Prime Pack, 11 before it. facts.primePack (true/false) decides when given; otherwise a season over 11
   // or with Prime Pack points can only be Prime Pack, and the career seam (when loaded) knows the live Showdown's boundary.
-  function cvSeasonMax(facts){
-    if(facts&&facts.primePack===true)return PACK_MAX;
-    if(facts&&facts.primePack===false)return MAX;
-    const rows=Array.isArray(facts&&facts.history)?facts.history:[];
-    if(rows.some(row=>plain(row)&&ROLES.some(role=>{const r=row[role];return plain(r)&&((Number.isInteger(r.scoring?.total)&&r.scoring.total>MAX)||int(r.primePack,1,4)||int(r.scoring?.primePack,1,4));})))return PACK_MAX;
-    try{if(facts&&facts.showdownId&&root.CareerModeCareerScreenSeam?.seasonMaxFor?.({rivalryId:String(facts.showdownId)})===PACK_MAX)return PACK_MAX;}catch(_){}
-    return MAX;
-  }
+  // Nik 2026-11-01 18:32 UTC: one season maximum, 15, in every Showdown (no 11 anywhere).
+  function cvSeasonMax(_facts){return PACK_MAX;}
 
   // ---------- facts ----------
   // facts = {showdownId, seasons (1|3|5|10), clubs:{playerOne,playerTwo}, league, teamCount, history:[row...]}
@@ -149,7 +143,7 @@
   function finalNumbers(rows,N,MAX){
     const totals=cvTotals(rows),end=totals[N-1],W=leaderOf(end),tally=cvTally(rows),out=[],add=(id,topic,text)=>out.push({id,topic,text});
     if(!W){
-      // 110 (150 with Prime Pack) each in a 10-season Showdown: level, and a Golden Showdown for both (the Rule Book's total is per manager).
+      // 150 each in a 10-season Showdown: level, and a Golden Showdown for both (the Rule Book's total is per manager).
       if(N===10&&end.playerOne===MAX*N)add("final-golden-both","golden",`${MAX*N} each: both managers won ${MAX} points in every season, a Golden Showdown for both, and the Showdown is drawn.`);
       add("final-level","level",`Level on ${end.playerOne} after ${count(N,"season","seasons")}, so the Showdown is drawn.`);
       return out;
diff --git a/js/rivalryLegacyV10.js b/js/rivalryLegacyV10.js
index fae6375f30..b82fd47c49 100644
--- a/js/rivalryLegacyV10.js
+++ b/js/rivalryLegacyV10.js
@@ -18,8 +18,8 @@
   function bare(status){return {status,managerOrder:ORDER.slice()};}
   function validSeason(s){return s&&Number.isInteger(s.season)&&["daniel","nik","draw"].includes(s.winner)&&["score","leaguePosition","leaguePoints","leagueGoals"].every(k=>pair(s[k]));}
   function validRow(r){return r&&Number.isInteger(r.number)&&typeof r.leagueId==="string"&&r.clubs&&ORDER.every(k=>typeof r.clubs[k]==="string")&&finite(r.seasonsPlayed)&&finite(r.totalSeasons)&&pair(r.totals)&&["daniel","nik","draw"].includes(r.winner)&&Array.isArray(r.seasons)&&r.seasons.every(validSeason);}
-  // r84 Golden Showdown: the managers who closed this finished 10-season Showdown on the most every season can score (110, or
-  // 150 with Prime Pack; the seam owns the rule). Only a
+  // r84 Golden Showdown: the managers who closed this finished 10-season Showdown on the most every season can score (150;
+  // the seam owns the rule). Only a
   // Showdown that has one carries the field.
   function golden(row){const managers=seam().goldenShowdownManagers(row);return managers.length?{goldenShowdown:managers}:{};}
   // r86 Special Player chip (js/specialPlayerChip.js): a Showdown confirmed on r86 or later carries each manager's Special
@@ -148,7 +148,7 @@
         const selected=root.LegacyFixture?.selectedShowdown;
         const current=cards.find(card=>Number(card.dataset.showdown)===Number(selected))||cards[0];
         cards.forEach(card=>card.classList.toggle("legacyVisibleCard",card===current));
-        // r87 career fixes (A-01): a 3-digit total ("110 – 110") is wider than the score's third of a desktop card, so that
+        // r87 career fixes (A-01): a 3-digit total ("150 – 150") is wider than the score's third of a desktop card, so that
         // card puts the score on its own line above the two managers (css/rivalryLegacyV10.css). Nothing else changes.
         for(const card of cards){const row=Array.isArray(frame.showdowns)?frame.showdowns.find(item=>item&&item.number===Number(card.dataset.showdown)):null;const wide=Boolean(row?.totals&&Math.max(row.totals.daniel,row.totals.nik)>=100);if(wide!==(card.dataset.wideScore==="true")){if(wide)card.dataset.wideScore="true";else delete card.dataset.wideScore;}}
       };
diff --git a/js/ruleBook.js b/js/ruleBook.js
index 855e3c5998..675ddd461e 100644
--- a/js/ruleBook.js
+++ b/js/ruleBook.js
@@ -179,7 +179,7 @@ function createScoringRuleSection(){
     const goldenLabel = document.createElement("strong");
     goldenLabel.textContent = "GOLDEN SHOWDOWN";
     const goldenText = document.createElement("span");
-    // r87 Prime Pack (G Lead and Nik 2026-11-01): 15 a season with Prime Pack, so 150; older Showdowns keep 110.
+    // r87 Prime Pack (G Lead and Nik 2026-11-01): 15 a season, so 150 (no other Golden total).
     goldenText.textContent = "Score 150 points in a 10-season Showdown (15 in every season) to win the gold trophy.";
     golden.append(goldenLabel, goldenText);
 
diff --git a/js/sharedActiveShowdownAdapter.js b/js/sharedActiveShowdownAdapter.js
index 1bc42bbbe9..f3b1d80161 100644
--- a/js/sharedActiveShowdownAdapter.js
+++ b/js/sharedActiveShowdownAdapter.js
@@ -16,6 +16,8 @@
   function manager(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
   function managerId(id){return MANAGERS.includes(id)?id:null;}
   function pairValues(a,b){return {daniel:a,nik:b};}
+  const PERFECT_SEASON=15;
+  function perfectSeasons(p,role){return p.seasonHistory.filter(item=>item?.[role]?.scoring?.total===PERFECT_SEASON).length;}
   function finalFor(p){const playerOne=p.managerRecords.playerOne.totalPoints,playerTwo=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne,playerTwo},winner:playerOne>playerTwo?"playerOne":playerTwo>playerOne?"playerTwo":"draw"};}
   function inspect(snapshot){
     const s=asdPlain(snapshot)?snapshot:{},pair=asdPlain(s.pair)?s.pair:null,identity=asdPlain(s.identity)?s.identity:null;
@@ -94,7 +96,9 @@
       v.leagueId=p.leagueId;v.clubs=pairValues(p.managerRecords.playerOne.club,p.managerRecords.playerTwo.club);v.totalSeasons=p.totalSeasons;
       v.season=classification==="completed"||p.acceptedSeasons===p.totalSeasons?p.totalSeasons:multi?.state.activeSeason??p.acceptedSeasons+1;
       v.score=pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints);
-      v.managers=Object.fromEntries(ROLES.map((role,i)=>[MANAGERS[i],Object.fromEntries(COUNTERS.map(key=>[key,p.managerRecords[role][key]]))]));
+      // r87 (Nik 2026-11-01): a perfect season is 15. The History projection still counts 11 or more (its records are
+      // rebuilt and compared byte for byte, and older Firebase summaries hold them), so this view counts the 15s itself.
+      v.managers=Object.fromEntries(ROLES.map((role,i)=>[MANAGERS[i],Object.fromEntries(COUNTERS.map(key=>[key,key==="perfectSeasons"?perfectSeasons(p,role):p.managerRecords[role][key]]))]));
       v.seasons=p.seasonHistory.map(item=>({season:item.roundNumber,score:pairValues(item.playerOne.scoring.total,item.playerTwo.scoring.total),winner:manager(item.winner),leaguePosition:pairValues(item.playerOne.leaguePosition,item.playerTwo.leaguePosition),leaguePoints:pairValues(item.playerOne.leaguePoints,item.playerTwo.leaguePoints),leagueGoals:pairValues(item.playerOne.leagueGoals,item.playerTwo.leagueGoals)}));
     }else if(empty){
       v.managers=Object.fromEntries(MANAGERS.map(id=>[id,Object.fromEntries(COUNTERS.map(key=>[key,key==="bestSeasonScore"?null:0]))]));
diff --git a/js/sharedCareerAnalytics.js b/js/sharedCareerAnalytics.js
index 689b29238b..9415020905 100644
--- a/js/sharedCareerAnalytics.js
+++ b/js/sharedCareerAnalytics.js
@@ -72,14 +72,13 @@
     const europaLeague=season.playerOne.europaLeague===true||season.playerTwo.europaLeague===true?{europaLeague:{daniel:season.playerOne.europaLeague===true,nik:season.playerTwo.europaLeague===true}}:{};
     return {season:season.roundNumber,score:{daniel:season.playerOne.scoring.total,nik:season.playerTwo.scoring.total},winner:managerFor(season.winner),tiebreak:seasonTiebreak(season),leaguePosition:pair("leaguePosition"),leaguePoints:pair("leaguePoints"),leagueGoals:pair("leagueGoals"),...europaLeague};
   }
-  // r87 Prime Pack: a perfect season is the Showdown's own maximum, 15 for a Showdown confirmed on or after the Prime Pack
-  // boundary (js/iconGuess.js fromMs) and 11 before it; with no confirm time, a season with Prime Pack or above 11 means 15.
+  // r87 Prime Pack (Nik 2026-11-01 17:35 UTC): a perfect season is 15 points (11 + a 4-point Prime Pack), in every
+  // Showdown. An older Showdown's 11 stays in its History but is not a perfect season: one meaning on every screen.
+  // PRIME_PACK_FROM_MS stays on the release-time list (tools/set-release-time.cjs) with the other Prime Pack boundaries.
   const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
-  function seasonMaxOf(entry,seasons){
-    if(Number.isFinite(entry.setupConfirmedAt))return entry.setupConfirmedAt>=PRIME_PACK_FROM_MS?15:11;
-    return seasons.some(season=>ROLES.some(role=>season[role]&&(season[role].primePack!==undefined||season[role].scoring.total>11)))?15:11;
-  }
-  function accumulate(record,season,role,sums,max=11){
+  const PERFECT_SEASON=15;
+  function seasonMaxOf(_entry,_seasons){return PERFECT_SEASON;}
+  function accumulate(record,season,role,sums,max=PERFECT_SEASON){
     const r=season[role],score=r.scoring.total;
     record.seasons+=1;record.careerPoints+=score;
     sums.points+=r.leaguePoints;sums.goals+=r.leagueGoals;
diff --git a/js/sharedHistoryConvergence.js b/js/sharedHistoryConvergence.js
index 102388b04a..9752072887 100644
--- a/js/sharedHistoryConvergence.js
+++ b/js/sharedHistoryConvergence.js
@@ -97,10 +97,12 @@
     return {scoring,winner:expected};
   }
   function hcManagerBase(slot,club){return {role:slot.slotId,profileId:slot.profileId,saveId:slot.saveId,club,seasons:0,seasonWins:0,seasonLosses:0,seasonDraws:0,totalPoints:0,leagueTitles:0,domesticCups:0,championsLeagues:0,europaLeagues:0,totalTrophies:0,hundredPointSeasons:0,hundredGoalSeasons:0,topScorerSeasons:0,topAssistSeasons:0,perfectSeasons:0,bestLeaguePosition:null,bestLeaguePoints:null,bestLeagueGoals:null,bestSeasonScore:null,averageSeasonScore:0,averageLeaguePoints:0,averageLeagueGoals:0,totalLeaguePoints:0,totalLeagueGoals:0};}
+  // Nik 2026-11-01 18:32 UTC: a perfect season is 15, the season maximum, in every Showdown (no 11 anywhere).
+  const PERFECT_SEASON=15;
   function hcAccumulate(record,season,role){
     const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
     if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
-    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score>=11)record.perfectSeasons+=1;
+    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score===PERFECT_SEASON)record.perfectSeasons+=1;
     record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
   }
   function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues+record.europaLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
@@ -123,7 +125,14 @@
   function hcVerify(projection){
     if(!hcPlain(projection)||projection.schemaVersion!==1||projection.runtimeRevision!==RUNTIME_REVISION||projection.phase!=="HISTORY_CONVERGED"||projection.revision!==1||projection.canonicalStorageMutation!==false||projection.providerWriteRequired!==false)hcFail("HISTORY_CONVERGENCE_PROJECTION_INVALID");
     const rebuilt=hcBuild({rivalryId:projection.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:projection.totalSeasons,leagueId:projection.leagueId,clubs:{playerOne:projection.managerRecords?.playerOne?.club,playerTwo:projection.managerRecords?.playerTwo?.club}},managerSlots:projection.managerSlots.map(slot=>({...slot,entitlementState:"active"})),seasons:projection.seasonHistory.map(season=>({commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,results:{playerOne:Object.fromEntries(hcResultKeys(season.playerOne).map(key=>[key,season.playerOne[key]])),playerTwo:Object.fromEntries(hcResultKeys(season.playerTwo).map(key=>[key,season.playerTwo[key]]))}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,scoring:{playerOne:season.playerOne.scoring,playerTwo:season.playerTwo.scoring},winner:season.winner}}))});
-    if(JSON.stringify(rebuilt)!==JSON.stringify(projection))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");return projection;
+    if(JSON.stringify(rebuilt)===JSON.stringify(projection))return projection;
+    // A projection saved before 2.0.0 (a Firebase careerSummary is create-only, and a phone keeps a copy) counted any season
+    // of 11 or more as perfect. That counter is derived from the seasons, so a projection that differs from its rebuild in
+    // the two perfectSeasons counters and nothing else is the same verified history: the rebuild, which counts 15s, is
+    // returned. Any other difference is still tampering.
+    const recounted={...projection,managerRecords:Object.fromEntries(Object.entries(hcPlain(projection.managerRecords)?projection.managerRecords:{}).map(([role,record])=>[role,hcPlain(record)&&Object.hasOwn(record,"perfectSeasons")&&hcPlain(rebuilt.managerRecords[role])?{...record,perfectSeasons:rebuilt.managerRecords[role].perfectSeasons}:record]))};
+    if(JSON.stringify(rebuilt)!==JSON.stringify(recounted))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");
+    return rebuilt;
   }
 
   return Object.freeze({contractVersion:1,feature:"ssjr-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,buildProjection:hcBuild,verifyProjection:hcVerify,canonicalStorageMutation:false,providerWriteRequired:false,requiresCanonicalScoring:true,exactSeasonAddressing:true,identitySafe:true});
diff --git a/js/statistics.js b/js/statistics.js
index f2ebf63218..8dc26b7538 100644
--- a/js/statistics.js
+++ b/js/statistics.js
@@ -486,7 +486,7 @@ function createSeasonBar(name, score, alignRight = false){
     track.className = "seasonPointTrack";
     const fill = document.createElement("div");
     fill.className = "seasonPointFill";
-    fill.style.width = `${Math.min(100, Math.max(0, (Number(score) / 11) * 100))}%`;
+    fill.style.width = `${Math.min(100, Math.max(0, (Number(score) / 15) * 100))}%`;
     track.appendChild(fill);
     wrap.append(top, track);
     return wrap;
diff --git a/js/touchlineGazette.js b/js/touchlineGazette.js
index e8fa0fe7b9..21cc31b0e4 100644
--- a/js/touchlineGazette.js
+++ b/js/touchlineGazette.js
@@ -30,11 +30,13 @@
   const ROLES=Object.freeze(["playerOne","playerTwo"]);
   const OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
   const LENGTHS=Object.freeze([1,3,5,10]);
-  const GOLDEN=Object.freeze({seasons:10,points:110});
+  // Nik 2026-11-01 17:35 UTC: a perfect season is 15 and the Golden Showdown is 150 in every Showdown (there was never a
+  // real 10-season Showdown before Prime Pack, so no old record to keep). One season maximum, 15, everywhere.
+  const GOLDEN=Object.freeze({seasons:10,points:150}),PERFECT=15;
   // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so
-  // its race counts 15 a season left and its Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 and 110.
+  // its race counts 15 a season left (every Showdown, Nik 2026-11-01 18:32 UTC).
   // PRIME_PACK_FROM_MS is js/iconGuess.js fromMs (tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
-  const SEASON_MAX=Object.freeze({before:11,primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const SEASON_MAX=Object.freeze({primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
   // true/false when this Showdown's confirm time is known (given, or the live Setup when it is this Showdown), else null.
   function tgPrimePack(rivalryId,confirmedAt){
     if(Number.isFinite(confirmedAt))return confirmedAt>=PRIME_PACK_FROM_MS;
@@ -143,10 +145,8 @@
       const winner=a>b?"playerOne":b>a?"playerTwo":"draw";if(row.winner!==winner)return null;
       seasons.push({number:i+1,score:{playerOne:a,playerTwo:b},winner,items:{playerOne:seasonItems(row.playerOne),playerTwo:seasonItems(row.playerTwo)}});
     }
-    // unknown confirm time: a Prime Pack point, or a season over 11, can only come from a Showdown that plays Prime Pack
-    const sides=projection.seasonHistory.flatMap(row=>plain(row)?[row.playerOne,row.playerTwo].filter(plain):[]);
-    const pack=primePack===true||primePack===false?primePack:sides.some(side=>Number.isInteger(side.primePack)||Number.isInteger(side.scoring?.primePack)||(Number.isInteger(side.scoring?.total)&&side.scoring.total>SEASON_MAX.before));
-    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons,max:pack?SEASON_MAX.primePack:SEASON_MAX.before};
+    // Nik 2026-11-01 18:32 UTC: one season maximum, 15, in every Showdown (no 11 anywhere).
+    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons,max:SEASON_MAX.primePack};
   }
   const totalsOf=seasons=>seasons.reduce((t,s)=>({playerOne:t.playerOne+s.score.playerOne,playerTwo:t.playerTwo+s.score.playerTwo}),{playerOne:0,playerTwo:0});
   function spOf(sp){return plain(sp)&&plain(sp.daniel)&&plain(sp.nik)&&typeof sp.daniel.name==="string"&&sp.daniel.name&&typeof sp.nik.name==="string"&&sp.nik.name?{daniel:sp.daniel.name,nik:sp.nik.name}:null;}
@@ -157,7 +157,7 @@
   // levelled, and level is a draw: no tiebreak). The RECORD BOOK: seasons won, trophies, best season, streaks, perfect seasons.
   const plural=(n,word)=>`${n} ${word}${n===1?"":"s"}`;
   const both=list=>list.length===2?`${list[0]} and ${list[1]}`:list[0];
-  function recordsOf(seasons,max=SEASON_MAX.before){
+  function recordsOf(seasons,max=PERFECT){
     const rec={};
     for(const role of ROLES){
       const r={wins:0,trophies:0,perfect:0,best:0};
@@ -174,7 +174,7 @@
   function raceFor(facts,N,final){
     const T=facts.totalSeasons,seasons=facts.seasons.slice(0,N),totals=totalsOf(seasons);
     const gap=Math.abs(totals.playerOne-totals.playerTwo),leader=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":null;
-    const left=T-N,pointsLeft=left*facts.max,goldenPoints=GOLDEN.seasons*facts.max;
+    const left=T-N,pointsLeft=left*facts.max,goldenPoints=GOLDEN.points;
     let line;
     if(final){
       line=leader?`${NAMES[leader]} wins the Showdown ${totals[leader]} to ${totals[OTHER[leader]]}, by ${plural(gap,"point")}.`
@@ -194,7 +194,7 @@
   }
   // One line each, most telling first; only facts that are true for this Showdown so far are printed.
   function recordBook(facts,N,final){
-    const seasons=facts.seasons.slice(0,N),r=recordsOf(seasons,facts.max),out=[];
+    const seasons=facts.seasons.slice(0,N),r=recordsOf(seasons),out=[];
     // (never beside level totals, where a seasons-won count could read as a tiebreak: level is a draw)
     const lvl=totalsOf(seasons);
     if(N>=2&&lvl.playerOne!==lvl.playerTwo)out.push(`Seasons won: ${NAMES.playerOne} ${r.playerOne.wins} · ${NAMES.playerTwo} ${r.playerTwo.wins}${r.draws?` · drawn ${r.draws}`:""}`);
@@ -203,8 +203,8 @@
     if(N>=2){const best=Math.max(r.playerOne.best,r.playerTwo.best);if(best>0)out.push(`Best season${final?"":" so far"}: ${plural(best,"point")}, ${both(ROLES.filter(x=>r[x].best===best).map(x=>NAMES[x]))}`);}
     if(N>=2&&r.biggest&&r.biggest.margin>=3)out.push(`Biggest season win: ${NAMES[r.biggest.role]} ${r.biggest.score[r.biggest.role]}–${r.biggest.score[OTHER[r.biggest.role]]} in season ${r.biggest.season}`);
     const perfect=ROLES.filter(x=>r[x].perfect>0);
-    if(perfect.length)out.push(`Perfect ${facts.max}s: ${perfect.map(x=>`${NAMES[x]} ${r[x].perfect}`).join(" · ")}`);
-    // the Golden Showdown (110 over ten seasons, 150 with Prime Pack) needs the maximum in every season: it is "on" only while a manager has dropped nothing
+    if(perfect.length)out.push(`Perfect ${PERFECT}s: ${perfect.map(x=>`${NAMES[x]} ${r[x].perfect}`).join(" · ")}`);
+    // the Golden Showdown (150 over ten seasons) needs a perfect 15 in every season: it is "on" only while a manager has dropped nothing
     if(!final&&facts.totalSeasons===GOLDEN.seasons){const alive=ROLES.filter(x=>r[x].perfect===N);if(alive.length)out.push(`Golden watch: ${both(alive.map(x=>NAMES[x]))} still perfect`);}
     return out;
   }
@@ -340,9 +340,9 @@
     // The Final Winner frame, when given, must say the same (it reads the reconciled winner; the paper never disagrees with it).
     if(final){const fw={daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner];if(fw!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
     const draw=W==="draw",L=draw?null:OTHER[W],margin=Math.abs(totals.playerOne-totals.playerTwo);
-    // A Golden Showdown is a manager on 110 over ten seasons (150 with Prime Pack): the winner, or both managers on a 110-110
-    // (150-150) draw (still a draw, no tiebreak; the paper is the gold edition with the drawn copy).
-    const goldenPoints=GOLDEN.seasons*facts.max;
+    // A Golden Showdown is a manager on 150 over ten seasons: the winner, or both managers on a 150-150 draw (still a
+    // draw, no tiebreak; the paper is the gold edition with the drawn copy).
+    const goldenPoints=GOLDEN.points;
     const goldenRoles=T===GOLDEN.seasons?ROLES.filter(role=>totals[role]>=goldenPoints):[];
     const golden=goldenRoles.length>0;
     const used=new Set();for(let k=1;k<T;k+=1)buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,null,used);
@@ -352,10 +352,10 @@
     else Object.assign(vals,{winner:NAMES[W],loser:NAMES[L],winnerClub:facts.clubs[W],loserClub:facts.clubs[L],winnerPoints:totals[W],loserPoints:totals[L],margin,leader:NAMES[W],trailer:NAMES[L]});
     const rec=role=>{const r={cl:0,el:0,league:0,cup:0,wins:0,best:0};for(const s of facts.seasons){const it=s.items[role];r.cl+=it["champions-league"]?1:0;r.el+=it["europa-league"]?1:0;r.league+=it["league-title"]?1:0;r.cup+=it["domestic-cup"]?1:0;r.wins+=s.winner===role?1:0;r.best=Math.max(r.best,s.score[role]);}return r;};
     const r1=rec("playerOne"),r2=rec("playerTwo");
-    // Situations: a draw only the drawn pages; the Golden Showdown (first to 110 over ten seasons); otherwise the Showdown's
+    // Situations: a draw only the drawn pages; the Golden Showdown (first to 150 over ten seasons); otherwise the Showdown's
     // length (ten seasons read as the long, five-season pages), decided in its last season (the winner did not lead before
     // it), or a dominant win: the winner was ahead after every season, out of reach before the last one (a season is worth
-    // at most 11 points) and still more than a season clear at the end, so the dominant pages' landslides and wire-to-wire
+    // at most 15 points) and still more than a season clear at the end, so the dominant pages' landslides and wire-to-wire
     // leads are true as printed.
     let situations;
     if(draw)situations=["showdown-drawn"];
@@ -370,7 +370,7 @@
     }
     // A drawn Showdown in which neither manager won a trophy prints no silverware talk (a won one has the Showdown trophy).
     const noSilver=draw&&r1.cl+r1.el+r1.league+r1.cup+r2.cl+r2.el+r2.league+r2.cup===0;
-    // A 110-110 Golden draw: both managers lifted everything, so no "no trophy" consolation row. A Showdown level after every
+    // A 150-150 Golden draw: both managers lifted everything, so no "no trophy" consolation row. A Showdown level after every
     // season never "pointed toward a winner".
     const neverLed=draw&&facts.seasons.every((s,i)=>{const t=totalsOf(facts.seasons.slice(0,i+1));return t.playerOne===t.playerTwo;});
     const keep=row=>!FUTURE.test(words(row))&&!(noSilver&&SILVER.test(words(row)))&&!(draw&&golden&&GOLDEN_DRAW_OFF.test(words(row)))&&!(neverLed&&NEVER_LED_OFF.test(words(row)));
diff --git a/js/trophyRoom.js b/js/trophyRoom.js
index 77b87f33ab..b8aa28253d 100644
--- a/js/trophyRoom.js
+++ b/js/trophyRoom.js
@@ -170,7 +170,7 @@ function renderAllTimeRecords(container, analytics){
         createRecordCard("MOST CHAMPIONS LEAGUES", managerLeaderText(records.championsLeagues)),
         createRecordCard("MOST LEAGUE TITLES", managerLeaderText(records.leagueTitles)),
         createRecordCard("MOST DOMESTIC CUPS", managerLeaderText(records.domesticCups)),
-        createRecordCard("PERFECT 11-POINT SEASONS", managerLeaderText(records.perfectSeasons)),
+        createRecordCard("PERFECT 15-POINT SEASONS", managerLeaderText(records.perfectSeasons)),
         createRecordCard("HIGHEST SEASON SCORE", seasonRecordText(records.highestSeasonScore, " pts")),
         createRecordCard("HIGHEST LEAGUE POINTS", seasonRecordText(records.highestLeaguePoints, " pts")),
         createRecordCard("MOST LEAGUE GOALS", seasonRecordText(records.highestLeagueGoals, " goals"))
diff --git a/package.json b/package.json
index 8f93920e81..ba750e94f8 100644
--- a/package.json
+++ b/package.json
@@ -17,6 +17,7 @@
     "test:ops": "node tests/support/run-operations-audit.cjs",
     "test:contracts:all": "npm run test:contracts && npm run test:ops",
     "test:saved-showdowns-still-open": "npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-saved-showdowns-open \"node tests/firebase/saved-showdowns-still-open-emulator.cjs\"",
+    "test:r87-old-showdown-end": "npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r87-old-end \"node tests/firebase/r87-old-showdown-end-emulator.cjs\"",
     "test:r79-showdown-continues": "npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r79-continues \"node tests/firebase/r79-showdown-continues-emulator.cjs\"",
     "test:browser": "node tests/contracts/full-gameplay-lifecycle-contracts.cjs && node tests/browser/persistent-pair-user-facing-routing-audit.cjs && node tests/browser/production-shared-setup-overlay-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-showdown-polished-presentation-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-career-start-r33-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-transfer-challenge-replay-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-season-results-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-season-commit-audit.cjs && node tests/browser/shared-season-commit-second-publisher-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-canonical-scoring-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-history-convergence-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-multi-season-progression-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-journey-reconnect-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/ssjr-production-acceptance-recorder-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/ssjr-production-actor-evidence-v2-audit.cjs && node tests/browser/stability-audit.cjs && node tests/browser/connected-account-settings-audit.cjs && node tests/browser/settings-offline-save-library-editor-audit.cjs && node tests/browser/stage3-private-pairing-audit.cjs && node tests/browser/pairing-four-code-automation-audit.cjs && node tests/browser/stage4-remote-local-reconciliation-audit.cjs && node tests/browser/stage5e-remote-joining-audit.cjs && node tests/browser/stage5g-remote-joining-reconnect-audit.cjs && node tests/browser/stage5h-remote-joining-adverse-network-audit.cjs && node tests/browser/stage5i-remote-joining-acceptance-recorder-audit.cjs && node tests/browser/shared-showdown-setup-audit.cjs && node tests/browser/shared-showdown-paired-first-entry-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/shared-journey-conflicts-audit.cjs && node tests/browser/shared-local-reconciliation-audit.cjs && node tests/browser/shared-final-reconciliation-audit.cjs && node tests/browser/shared-terminal-close-audit.cjs && node tests/browser/career-start-settings-audit.cjs  &&  node tests/browser/r78-small-fixes-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/r79-waiting-cold-cache-audit.cjs && CMS_CHROMIUM_MULTI_CONTEXT=1 node tests/browser/r79-reload-hold-audit.cjs && CMS_SHORT_SIZES=1366x768 node tests/browser/r80-short-screens-audit.cjs && CMS_SHORT_SIZES=1100x600 node tests/browser/r80-short-screens-audit.cjs && CMS_SHORT_SIZES=1024x768 node tests/browser/r80-short-screens-audit.cjs && CMS_SHORT_SIZES=844x390 node tests/browser/r80-short-screens-audit.cjs && CMS_SHORT_SIZES=393x660 node tests/browser/r80-short-screens-audit.cjs && node tests/browser/r83-gallery-layout-audit.cjs",
     "test:short-screens": "node tests/browser/r80-short-screens-audit.cjs",
diff --git a/visual-assets/v10_1/career-statistics/career-statistics.js b/visual-assets/v10_1/career-statistics/career-statistics.js
index d143b8b8b8..8adf71490f 100644
--- a/visual-assets/v10_1/career-statistics/career-statistics.js
+++ b/visual-assets/v10_1/career-statistics/career-statistics.js
@@ -103,7 +103,7 @@
       tr.innerHTML=`<td>${rr.rank}</td><td><span class="managerName">${rr.rank===1?'<span class="rankCrown" aria-label="Career leader">♛</span>':''}${NAMES[role]}</span>${spChip(frame, role)}</td><td>${s.completed}</td><td>${m.seasonWins}-${m.seasonDraws}-${m.seasonLosses}</td><td>${m.careerPoints}</td><td>${m.totalTrophies}</td>`;
       body.appendChild(tr);
     }); t.appendChild(body); panel.appendChild(t);
-    // r84 Golden Showdown: a gold line names each manager who closed a 10-season Showdown on 110 points.
+    // r84 Golden Showdown: a gold line names each manager who closed a 10-season Showdown on 150 points (r87: 15 a season).
     const golden=frame.goldenShowdowns;
     if (golden && (golden.daniel>0 || golden.nik>0)) {
       const note=document.createElement("p"); note.className="goldenShowdownNote"; note.dataset.goldenShowdown="true";
diff --git a/visual-assets/v10_1/legacy/legacy.js b/visual-assets/v10_1/legacy/legacy.js
index a7ab0a75f6..4729d41299 100644
--- a/visual-assets/v10_1/legacy/legacy.js
+++ b/visual-assets/v10_1/legacy/legacy.js
@@ -252,7 +252,7 @@ window.ShowdownLegacyBoot = function () {
       chips.forEach((chip, index) => { chip.dataset.manager = index ? "nik" : "daniel"; special.appendChild(chip); });
     }
     card.append(title, body, ...(special ? [special] : []), footer);
-    // r84 Golden Showdown: a gold line names each manager who closed this 10-season Showdown on 110 points.
+    // r84 Golden Showdown: a gold line names each manager who closed this 10-season Showdown on 150 points (r87: 15 a season).
     const golden = Array.isArray(showdown.goldenShowdown) ? showdown.goldenShowdown.filter((manager) => manager === "daniel" || manager === "nik") : [];
     if (golden.length) {
       card.dataset.golden = "true";
diff --git a/visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js b/visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js
index 25f560a0a7..7871d55245 100644
--- a/visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js
+++ b/visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js
@@ -17,7 +17,7 @@ function mount(map){if(window.ShowdownStage)window.rvStage=window.ShowdownStage.
 function value(f,l,s){if(l==="Showdown Points")return f.score?.[s];const r=f.managerRecords?.[s]||{},m={"Season Wins":"seasonWins","Total Trophies":"totalTrophies","Champions Leagues":"championsLeagues","Europa Leagues":"europaLeagues","League Titles":"leagueTitles","Domestic Cups":"domesticCups"};if(m[l])return r[m[l]];return"—"}
 function rows(d,f){document.getElementById("rvRows").innerHTML=(d.strings?.comparisonRows||fallback.strings.comparisonRows).map((l,i)=>{const a=value(f,l,"daniel"),b=value(f,l,"nik"),an=typeof a==="number"&&typeof b==="number"&&a>b,bn=typeof a==="number"&&typeof b==="number"&&b>a;return '<div class="rv-row"><span class="rv-value left '+(an?"is-leader":"")+'">'+(a??"—")+'</span><span class="rv-icon" aria-hidden="true">'+icons[i]+'</span><span class="rv-label">'+l+'</span><span class="rv-value right '+(bn?"is-leader":"")+'">'+(b??"—")+"</span></div>"}).join("")}
 function head(f){const d=f.managerRecords?.daniel,n=f.managerRecords?.nik;document.getElementById("rvHeadBody").innerHTML='<div class="rv-headGrid"><div class="rv-headStat"><span>DANIEL WINS</span><strong>'+(d?.seasonWins??"—")+'</strong></div><div class="rv-headStat"><span>NIK WINS</span><strong>'+(n?.seasonWins??"—")+'</strong></div><div class="rv-headStat"><span>DRAWS</span><strong>'+(d?.seasonDraws??"—")+"</strong></div>"+golden(f)+"</div>"}
-/* r84 Golden Showdown: a gold line names each manager who closed this 10-season Showdown on 110 points. */
+/* r84 Golden Showdown: a gold line names each manager who closed this 10-season Showdown on 150 points (r87: 15 a season). */
 function golden(f){const g=Array.isArray(f.goldenShowdown)?f.goldenShowdown.filter(m=>m==="daniel"||m==="nik"):[];if(!g.length)return"";return'<p class="rv-goldenShowdown" data-golden-showdown="true"><img src="'+arts[0]+'" alt="" aria-hidden="true"><strong>GOLDEN SHOWDOWN</strong><span>'+g.map(m=>m==="daniel"?"Daniel":"Nik").join(" & ")+"</span></p>"}
 function win(f,s){if(s.winner==="draw")return'<span class="rv-seasonWinner"><b class="rv-drawMark">—</b> Draw</span>';const side=s.winner==="nik"?"nik":"daniel",name=side==="daniel"?"Daniel":"Nik";return'<span class="rv-seasonWinner"><span class="rv-seasonCrest" aria-hidden="true">'+crest(f.clubs?.[side])+"</span>"+name+"</span>"}
 function seasons(d,f){const e=document.getElementById("rvSeasonBody");if(!f.seasons?.length){e.innerHTML='<div class="rv-emptyInline">'+(d.strings?.emptySeasonHistory||"No season has been completed yet. Statistics will build automatically as seasons are finished.")+"</div>";return}e.innerHTML='<table class="rv-seasonTable"><thead><tr><th>SEASON</th><th>DANIEL</th><th>NIK</th><th>WINNER</th></tr></thead><tbody>'+f.seasons.map(s=>"<tr><td>"+s.season+"</td><td>"+s.score.daniel+"</td><td>"+s.score.nik+"</td><td>"+win(f,s)+"</td></tr>").join("")+"</tbody></table>"}
diff --git a/visual-assets/v10_1/trophy-room/trophy-room.js b/visual-assets/v10_1/trophy-room/trophy-room.js
index 88a1787de2..d2381d9eb0 100644
--- a/visual-assets/v10_1/trophy-room/trophy-room.js
+++ b/visual-assets/v10_1/trophy-room/trophy-room.js
@@ -11,7 +11,7 @@
     { key: "championsLeague", category: "CHAMPIONS LEAGUE", asset: BASE + "../shared/trophies/TRO_CONTINENTAL_V1_512.webp", value: f => f.managers && ({daniel:f.managers.daniel.championsLeagues, nik:f.managers.nik.championsLeagues}) },
     { key: "europaLeague", category: "EUROPA LEAGUE", asset: BASE + "../shared/trophies/TRO_EUROPA_V1_512.webp", value: f => f.managers && ({daniel:f.managers.daniel.europaLeagues, nik:f.managers.nik.europaLeagues}) }
   ];
-  // r84 Golden Showdown: 110 points in a finished 10-season Showdown. Its gold case joins the ALL shelf only once a manager
+  // r84 Golden Showdown: 150 points (r87: 15 a season) in a finished 10-season Showdown. Its gold case joins the ALL shelf only once a manager
   // has earned it (frame.goldenShowdowns is present only then).
   const GOLDEN = { key: "goldenShowdown", category: "ALL", asset: BASE + "../shared/trophies/TRO_SHOWDOWN_CHAMPION_V1_512.webp", value: f => f.goldenShowdowns };
   // r86 Special Player chip next to the manager's name (only when the frame carries one: js/specialPlayerChip.js).

```


## FILE: PR #1185 diff (code only)
```text
diff --git a/js/iconGuess.js b/js/iconGuess.js
index 2356a16623..50ad19a022 100644
--- a/js/iconGuess.js
+++ b/js/iconGuess.js
@@ -46,6 +46,7 @@
   // Each stage's start, relative to the round start, and the round's end (the last moment a guess counts).
   const STAGE_STARTS=Object.freeze(STAGES.reduce((out,stage,i)=>[...out,i?out[i-1]+STAGES[i-1].revealMs+STAGES[i-1].guessMs:0],[]));
   const ROUND_MS=STAGE_STARTS[LAST_BEAT]+STAGES[LAST_BEAT].revealMs+STAGES[LAST_BEAT].guessMs;
+  const DRAW_SLACK_MS=2000; // the Rules' guess window ends at L+97 s, 2 s after the stage 4 window (L+95 s)
   const LEAD_MS=3000;   // after the second manager arrives, both phones count in together before the card rises
   const RECORD_VERSION=1;
   // Nik 2026-10-31 (N1), moved to r87 on 2026-11-01: the game runs only in Showdowns confirmed on the release that ships it,
@@ -189,7 +190,9 @@
     const startMs=igStartMs(record);
     if(startMs===null)return Object.freeze({state:"waiting",winner:null,beat:null,chips});
     if(chips.playerOne===0&&chips.playerTwo===0)return Object.freeze({state:"draw",winner:null,beat:null,chips});
-    if(Number.isFinite(nowMs)&&nowMs>=igEndsAt(startMs))return Object.freeze({state:"draw",winner:null,beat:null,chips});
+    // Fable F13-06: the Rules take a right guess until 97 s after the later arrival (the end of stage 4 plus DRAW_SLACK_MS),
+    // so a time draw shows only once that has passed; a guess from 95 s is still refused here (igApplyGuess).
+    if(Number.isFinite(nowMs)&&nowMs>igEndsAt(startMs)+DRAW_SLACK_MS)return Object.freeze({state:"draw",winner:null,beat:null,chips});
     return Object.freeze({state:"live",winner:null,beat:null,chips});
   }
   // One accepted guess (a name already matched to an icon in the list; text that matched nothing never gets here and
@@ -222,7 +225,7 @@
     contractVersion:1,feature:"cms-icon-guess",roles:ROLES,stats:STATS,maxSeasons:MAX_SEASONS,chips:CHIPS,
     beats:BEATS,lastBeat:LAST_BEAT,stagePoints:STAGE_POINTS,maxPoints:MAX_POINTS,stages:STAGES,stageStarts:STAGE_STARTS,roundMs:ROUND_MS,leadMs:LEAD_MS,
     fromMs:ICON_FROM_MS,eligible:igEligible,order:igOrder,statOrder:igStatOrder,draw:igDraw,
-    endsAt:igEndsAt,beatAt:igBeatAt,revealed:igRevealed,stagePointsAt:igStagePoints,resultView:igResultView,
+    endsAt:igEndsAt,drawSlackMs:DRAW_SLACK_MS,beatAt:igBeatAt,revealed:igRevealed,stagePointsAt:igStagePoints,resultView:igResultView,
     newRecord:igNewRecord,validRecord:igValid,startMs:igStartMs,arrive:igArrive,outcome:igOutcome,applyGuess:igApplyGuess,points:igPoints
   });
 });
diff --git a/js/iconGuessStep.js b/js/iconGuessStep.js
index 81f5c314b9..af848e3878 100644
--- a/js/iconGuessStep.js
+++ b/js/iconGuessStep.js
@@ -30,7 +30,7 @@
   const PAGE="visual-assets/v10_1/icon-guess/index.html";
   const STAGE_ID="igStage",PANEL_ID="igStepPanel",COLLECTION="primePackRounds";
   const DONE_KEY="careerModeShowdown.primePackDone.v1",KEYS_MAX=60;
-  const LOAD_WAIT_MS=10000,READY_WAIT_MS=10000,TICK_MS=200,POLL_MS=2500;
+  const LOAD_WAIT_MS=10000,READY_WAIT_MS=10000,TICK_MS=200,POLL_MS=2500,REJOIN_MS=3000;
   const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
   const wonMemo=new Map();
   // wentHome: the last run ended because the manager chose Showdown Home (not a fault), so the caller shows no error.
@@ -57,8 +57,9 @@
 
   // ctx = {rivalryId, managerRole, season, confirmedAtMs}. Does this Showdown play Prime Pack this season? It needs
   // js/iconGuess.js: a browser caller awaits ensure() first (before it, the answer is always false).
-  function igsApplies(ctx){
-    if(root.CMS_PRIME_PACK==="off"||!ctx)return false;
+  // ignoreSwitch: the season results attach a point already won even when the kill switch is on (Fable F14-02).
+  function igsApplies(ctx,{ignoreSwitch=false}={}){
+    if((root.CMS_PRIME_PACK==="off"&&!ignoreSwitch)||!ctx)return false;
     if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
     if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
     const guess=igsGuess();
@@ -147,8 +148,8 @@
   // How many Prime Pack points this manager won this season (0, or 4 to 1 by stage). Read by the season results before they
   // are published, so the points go in as primePack:N (the Rules check N against the round record). io = {firestore, sdk,
   // rivalryId}. One read, once per season, only for a Showdown the game applies to.
-  async function igsPointsFor(io,ctx){
-    if(!igsApplies(ctx))return 0;
+  async function igsPointsFor(io,ctx,{ignoreSwitch=false}={}){
+    if(!igsApplies(ctx,{ignoreSwitch}))return 0;
     const key=igsKey(ctx);if(wonMemo.has(key))return wonMemo.get(key);
     const ref=igsRef(io,ctx.season);
     const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
@@ -188,8 +189,8 @@
     const back=doc.createElement("button");back.type="button";back.className="backButton";back.textContent="BACK TO SHOWDOWN HOME";back.hidden=true;
     back.style.cssText="position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2";
     stage.append(frame,back);doc.body.append(stage);
-    // The roulette's result panel (z-index 96) would stand over this stage and take its taps: it goes once this stage is up.
-    try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}
+    // The roulette's result panel (z-index 96) stays over this stage until the Prime Pack page is ready (Reus Gate, Fable
+    // F13-07: a slow page never shows a plain dark screen); igsPlay closes it on cms-ig-ready, or when the step fails.
     return {stage,frame,back};
   }
   function igsPost(frame,type,data={}){try{frame.contentWindow?.postMessage({type,...data},root.location?.origin||"*");}catch(_error){}}
@@ -248,14 +249,22 @@
       const readBack=()=>io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(igsRef(io,ctx.season));return snap.exists()?snap.data():null;}).then(data=>onData(data),()=>{});
       const end=value=>{if(finished)return;finished=true;root.clearInterval(timer);root.removeEventListener("message",onMessage);igsDoc().removeEventListener?.("visibilitychange",onVisibility);try{stop&&stop();}catch(_error){}resolve(value);};
       // Away while the other manager has not arrived: withdraw (igsLeave); back on screen: arrive again.
-      let away=false;
+      // rejoinedAt: when this phone last sent its arrival again (Fable F13-02), at most once every REJOIN_MS.
+      let away=false,rejoinedAt=-Infinity;
       const leave=()=>igsPresence(()=>igsLeave(io,ctx)).catch(error=>{root.CareerModeFirestoreBudget?.noteError?.(error);});
+      const closeRoulette=()=>{try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}};
+      // Fable F13-03: back on screen after a lock, the phone's clock may have stood still: take a fresh server time and send
+      // the current stage and chips again, so the page never shows stage 2 while the server scores stage 3.
+      const resend=()=>{shownBeat=-2;sentChips={playerOne:null,playerTwo:null};render();};
       const onVisibility=()=>{
         if(finished)return;
-        if(igsDoc().visibilityState==="hidden"){if(record&&!record.winner&&record.arrived[other]===null){away=true;leave();}}
-        else if(away){away=false;igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
+        if(igsDoc().visibilityState==="hidden"){if(record&&!record.winner&&record.arrived[other]===null){away=true;leave();}return;}
+        resend();
+        Promise.resolve().then(()=>io.resync?.()).catch(()=>{}).then(()=>{if(!finished)resend();});
+        if(away){away=false;rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
       };
-      const fail=error=>{root.CareerModeFirestoreBudget?.noteError?.(error);end(error||{code:"PRIME_PACK_FAILED"});};
+      // Fable F13-01: a fault withdraws this manager's arrival (if the other has not arrived), so nobody plays alone for 4.
+      const fail=error=>{if(finished)return;root.CareerModeFirestoreBudget?.noteError?.(error);closeRoulette();if(ready&&!(record&&record.arrived[other]!==null))leave();end(error||{code:"PRIME_PACK_FAILED"});};
       const render=()=>{
         if(!ready||!record||finished)return;
         let now;try{now=io.now();}catch(error){return fail(error);}
@@ -270,7 +279,14 @@
           }
           return;
         }
-        if(out.state==="waiting"){const waitingFor=record.arrived[other]===null?other:me;back.hidden=waitingFor!==other;if(shownBeat!==-1){shownBeat=-1;igsPost(frame,"cms-ig-waiting",{role:waitingFor});}return;}
+        if(out.state==="waiting"){
+          // Fable F13-02: BACK always shows while waiting. This phone is on screen but its arrival is missing (a withdraw that
+          // landed late, a lost write): it arrives again, at most once every REJOIN_MS.
+          const waitingFor=record.arrived[other]===null?other:me;back.hidden=false;
+          if(record.arrived[me]===null&&!away&&igsDoc().visibilityState!=="hidden"&&Date.now()-rejoinedAt>=REJOIN_MS){rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
+          if(shownBeat!==-1){shownBeat=-1;igsPost(frame,"cms-ig-waiting",{role:waitingFor});}
+          return;
+        }
         back.hidden=true;
         const at=guess.beatAt(guess.startMs(record),now);
         if(at.phase==="waiting"){if(shownBeat!==-1.5){shownBeat=-1.5;igsPost(frame,"cms-ig-waiting",{role:null});}return;}
@@ -287,6 +303,9 @@
         if(m.type==="cms-ig-ready"){
           if(ready)return;ready=true;
           igsPost(frame,"cms-ig-start",{round:pick.round,waitingFor:other});shownBeat=-2;sentChips={playerOne:null,playerTwo:null};
+          // The page is up: the roulette panel goes (F13-07), and only now does this manager arrive, so a slow page never
+          // spends its own stage 1 (Fable F13-01).
+          closeRoulette();join();
           render();
         }else if(m.type==="cms-ig-input"){
           igsPost(frame,"cms-ig-suggestions",{names:igsSuggestions(index,String(m.text||""))});
@@ -314,7 +333,8 @@
       root.addEventListener("message",onMessage);
       timer=root.setInterval(render,TICK_MS);
       root.setTimeout(()=>{if(!ready&&!finished)fail({code:"PRIME_PACK_PAGE_TIMEOUT"});},READY_WAIT_MS);
-      Promise.resolve().then(async()=>{
+      const join=()=>Promise.resolve().then(async()=>{
+        rejoinedAt=Date.now();
         await igsPresence(()=>igsArrive(io,ctx));
         if(finished)return;
         const unsubscribe=await igsWatch(io,ctx,onData,fail);
diff --git a/js/productionSharedSeasonResults.js b/js/productionSharedSeasonResults.js
index a75908bfb5..043aebdfcf 100644
--- a/js/productionSharedSeasonResults.js
+++ b/js/productionSharedSeasonResults.js
@@ -183,15 +183,20 @@
   // so a won point is never dropped by a bad connection.
   const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
   async function pssrWithPrimePack(ctx,request,result){
-    const confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
+    if(!result||typeof result!=="object")return result;
+    let confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
+    if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;}
+    // Fable F13-04: an unknown confirm time never publishes without the Prime Pack point (it could drop a won point): TRY AGAIN.
+    if(!Number.isFinite(confirmedAtMs))pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","The Showdown's confirm time could not be read. Check the connection and try again.");
     // Old Showdowns never load the step (the same boundary as js/iconGuess.js fromMs; a contract keeps them equal).
-    if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off"||!result||typeof result!=="object")return result;
+    if(confirmedAtMs<PRIME_PACK_FROM_MS)return result;
     const step=root.CareerModeIconGuessStep||await (typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep).then(()=>root.CareerModeIconGuessStep,()=>null):null);
     // applies() needs the round engine (js/iconGuess.js): load it first, or a won Prime Pack point would be dropped.
     if(!step||!await step.ensure())pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","Prime Pack could not load. Check the connection and try again.");
     const gameCtx={rivalryId:ctx.options.rivalryId,managerRole:ctx.setup.managerRole,season:request.seasonNumber,confirmedAtMs};
-    if(!step.applies(gameCtx))return result;
-    const points=await step.pointsFor({firestore:ctx.options.firestore,sdk:ctx.options.firebaseSdk,rivalryId:ctx.options.rivalryId},gameCtx);
+    // Fable F14-02: the kill switch never drops a point already won: the round record is still read (no record is 0 points).
+    if(!step.applies(gameCtx,{ignoreSwitch:true}))return result;
+    const points=await step.pointsFor({firestore:ctx.options.firestore,sdk:ctx.options.firebaseSdk,rivalryId:ctx.options.rivalryId},gameCtx,{ignoreSwitch:true});
     const{primePack:_drop,...rest}=result;
     return Number.isInteger(points)&&points>=1&&points<=4?{...rest,primePack:points}:rest;
   }
diff --git a/js/productionSharedTransferChallenge.js b/js/productionSharedTransferChallenge.js
index 6a609de979..01fb937d0f 100644
--- a/js/productionSharedTransferChallenge.js
+++ b/js/productionSharedTransferChallenge.js
@@ -516,9 +516,13 @@
     primePackLoadError=false;
     try{
       if(!view||!view.managerRole||!request)return true;
-      const confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
+      if(root.CMS_PRIME_PACK==="off")return true;
+      let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
+      if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
+      // Fable F13-04: an unknown confirm time keeps the window shut (TRY AGAIN) instead of skipping a Prime Pack that may apply.
+      if(!Number.isFinite(confirmedAtMs)){primePackLoadError=true;return false;}
       // Old Showdowns never load the Prime Pack step (the boundary is js/iconGuess.js fromMs).
-      if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off")return true;
+      if(confirmedAtMs<PRIME_PACK_FROM_MS)return true;
       let timer;const step=await Promise.race([pstcLoadScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
       if(!step){primePackLoadError=true;return false;}
       // applies() needs the round engine (js/iconGuess.js): load it first, or an r87 Showdown would skip the Prime Pack.
@@ -529,7 +533,9 @@
       if(!provided){primePackLoadError=true;return false;}
       if(!pstcRequestMatches(request))return false;
       const options=provided.options;
-      const go=await step.run(ctx,{firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,now:()=>pstcAuthoritativeNow(request)});
+      const go=await step.run(ctx,{firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,now:()=>pstcAuthoritativeNow(request),
+        // Fable F13-03: back from a locked screen the monotonic clock may have stood still; take a fresh server anchor.
+        resync:()=>{clockRefreshPerformanceMs=Number.NaN;return pstcEnsureServerClock(options.user,request);}});
       // false without the manager choosing Showdown Home is a fault: the caller says so instead of a generic error.
       if(go!==true&&!step.wentHome?.())primePackLoadError=true;
       return go===true;

```


## FILE: PR #1187 diff
```text
diff --git a/js/careerScreensV10.js b/js/careerScreensV10.js
index 13c29d2d07..c1f10634b4 100644
--- a/js/careerScreensV10.js
+++ b/js/careerScreensV10.js
@@ -1644,8 +1644,8 @@
     if(screen==="careerStatistics"){
       const rivalry=host.querySelector("#careerStatisticsRivalryButton");
       if(rivalry){const available=(typeof currentShowdown!=="undefined"&&currentShowdown)||v10Source(screen)?.history?.showdowns?.some(r=>r.status==="completed");rivalry.classList.toggle("hidden",!available);rivalry.addEventListener("click",()=>{if(available&&typeof root.openRivalryStatistics==="function")root.openRivalryStatistics();});}
-      const trophy=host.querySelector("#trophyRoomButton");
-      if(trophy)trophy.addEventListener("click",()=>{if(typeof root.openOptionalModule==="function")root.openOptionalModule("trophyRoom");});
+      // One delegated listener on the document: a redraw replaces this button, and a tap on a node that is mid-replace must still open.
+      if(!v10Wire.tapBound){v10Wire.tapBound=true;root.document?.addEventListener?.("click",event=>{if(event.target?.closest?.("#trophyRoomButton")&&typeof root.openOptionalModule==="function")root.openOptionalModule("trophyRoom");});}
     }
   }
   function v10Identity(){

```


## FILE: commit 6a575de1 diff (release items)
```text
diff --git a/.github/workflows/deploy-github-pages.yml b/.github/workflows/deploy-github-pages.yml
index 899f1789a1..1d72ac3541 100644
--- a/.github/workflows/deploy-github-pages.yml
+++ b/.github/workflows/deploy-github-pages.yml
@@ -21,7 +21,7 @@ jobs:
   # change starts no Rules run, so after 90 s with none the site goes ahead only if the last Rules deploy on main succeeded.
   rules-first:
     runs-on: ubuntu-latest
-    timeout-minutes: 20
+    timeout-minutes: 50
     permissions:
       actions: read
       contents: read
@@ -35,7 +35,8 @@ jobs:
         shell: bash
         run: |
           set -euo pipefail
-          for attempt in $(seq 1 110); do
+          # Up to 45 min (270 x 10 s): a slow but good Rules deploy still ships the site (Opus job 15 O15-04).
+          for attempt in $(seq 1 270); do
             runs="$(gh api "repos/$REPO/actions/workflows/deploy-firestore-rules-zero-billing.yml/runs?head_sha=$SHA&event=push&per_page=5" --jq '[.workflow_runs[] | {status, conclusion}]')"
             count="$(jq 'length' <<<"$runs")"
             if [[ "$count" == "0" ]]; then
diff --git a/RELEASE_V2.0.0_R87.md b/RELEASE_V2.0.0_R87.md
index 7a5d204220..1c1d90fa8f 100644
--- a/RELEASE_V2.0.0_R87.md
+++ b/RELEASE_V2.0.0_R87.md
@@ -1,4 +1,4 @@
-# Career Mode Showdown 2.0.0 (r87): Russian Roster Roulette, the Touchline Gazette, Commentary v3 and a full polish (v2.0.0 runtime r87)
+# Career Mode Showdown 2.0.0 (r87): Prime Pack, Russian Roster Roulette, the Touchline Gazette, Commentary v3 and a full polish (v2.0.0 runtime r87)
 
 Application version: `v2.0.0`  
 Runtime asset revision: `2.0.0-r87`  
@@ -12,7 +12,13 @@ this file is the release record.
 
 - Russian Roster Roulette before every season's transfer window, the same spin on both phones, saved online; the window opens
   only after both managers spun (#1069, #1080, #1101, #1107, #1112, #1147, #1148). It runs for Showdowns confirmed at or after
-  the 2.0.0 release time (`RRR_FROM_MS` = `ROULETTE_FROM_MS`, set by `tools/set-release-time.cjs`).
+  the 2.0.0 release time. `tools/set-release-time.cjs` sets that one time in all ten start constants (roulette, Prime Pack,
+  15-a-season totals and own-club Special Player); contract r86-release RR5 checks they match. The time is the next whole
+  hour at or after the merge + 90 min, so 2.0.0 is live on both phones first.
+- Prime Pack before every season's transfer window: one masked Icon, four timed stages (25/20/20/20 s), two guesses each;
+  the manager who names it first earns 4, 3, 2 or 1 points by stage, or nobody does, never both (#1149, Team V art #1163).
+  A season is now worth up to 15 points and a 10-season Golden Showdown 150 (11 and 110 for Showdowns confirmed before
+  2.0.0). The Special Player now comes from the manager's own club (#1173). All of these start at the release time below.
 - Transfer window: signing overall and position, official 2016-17 league names, Deadline Day finish.
 - The Touchline Gazette after each season and a final edition (#1094, #1110, #1116).
 - Commentary v3 on Season Results and below the Final Winner stage (#1126).
@@ -35,7 +41,7 @@ this file is the release record.
 ## Deploy order
 
 - Rules first, then the site. The Pages workflow's `rules-first` job holds the site until this commit's Rules deploy
-  succeeded. Old Rules refuse the new spin marks, the roulette/spins record and Prime Pack rounds.
+  succeeded (it waits up to 45 min). Old Rules refuse the new spin marks, the roulette/spins record and Prime Pack rounds.
 
 ## What did not change
 
@@ -46,8 +52,9 @@ this file is the release record.
 
 ## Firestore Rules
 
-- Composed production Rules: filled in on the release PR from the exact release head (re-pin of #1097, #1101, #1148,
-  #1147 and Prime Pack).
+- Composed production Rules SHA-256 `4520bfdafe645a28ae742fec770ca00548f24a1b5e1480050cecda1ea82ab432` (172,840 bytes):
+  r86's Rules plus #1097, #1101, #1147, #1148 and Prime Pack's rounds (#1149, with ssjrPackLeave F12-02). Pinned in
+  `js/sparkPrivatePairing.js`, `tests/fixtures/composed-production-rules/main-delta.json` and the billed-reads table.
 
 ## Checks
 
diff --git a/js/rosterRouletteStep.js b/js/rosterRouletteStep.js
index 645c68864f..1a55465144 100644
--- a/js/rosterRouletteStep.js
+++ b/js/rosterRouletteStep.js
@@ -21,7 +21,7 @@
   const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
   // RRR_FROM_MS is the 2.0.0 release time (red team R87-C-07): a Showdown confirmed before it (played on 1.9.10) gets no
   // roulette. It and js/sparkSharedTransferChallenge.js ROULETTE_FROM_MS are one value, set only by
-  // `node tools/set-release-time.cjs <UTC time>` (release contract RX2 checks they match).
+  // `node tools/set-release-time.cjs <UTC time>` (release contract r86-release RR5 checks they match).
   const RRR_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
   const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
   const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
diff --git a/tools/set-release-time.cjs b/tools/set-release-time.cjs
index f409eeb29e..c90c8b68e2 100644
--- a/tools/set-release-time.cjs
+++ b/tools/set-release-time.cjs
@@ -3,6 +3,8 @@
 // 2.0.0 release time: the one place the lead sets it at freeze. Every start constant that must equal the release time is
 // listed here; the release contract (tests/contracts/r86-release-contracts.cjs RR5) fails if any of them differ.
 //   node tools/set-release-time.cjs 2026-11-01T17:00:00Z   (sets them all)
+// The release time is the next whole hour at or after the merge + 90 min, so 2.0.0 is live on both phones before any
+// Showdown can start on its features (Opus job 15 O15-01). An earlier time is refused unless --allow-early is passed.
 //   node tools/set-release-time.cjs                        (prints them)
 const fs=require("node:fs");
 const path=require("node:path");
@@ -26,9 +28,14 @@ const NOT_RELEASE_TIME=Object.freeze(["MARQUEE_FROM_MS"]);
 const pattern=name=>new RegExp(`(\\b${name}=Date\\.parse\\(")([^"]+)("\\);)`);
 function read(){return RELEASE_TIME_CONSTANTS.map(c=>{const source=fs.readFileSync(path.join(ROOT,c.file),"utf8"),m=pattern(c.name).exec(source);if(!m)throw new Error(`${c.file}: no ${c.name}=Date.parse("...") literal`);return {...c,value:m[2]};});}
 if(require.main===module){
-  const at=process.argv[2];
+  const args=process.argv.slice(2),allowEarly=args.includes("--allow-early"),at=args.find(a=>a!=="--allow-early");
   if(at){
     if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)||!Number.isFinite(Date.parse(at))){console.error(`not a UTC time like 2026-11-01T17:00:00Z: ${at}`);process.exit(1);}
+    const earliest=Date.now()+90*60*1000;
+    if(Date.parse(at)<earliest&&!allowEarly){
+      const next=new Date(Math.ceil(earliest/3600000)*3600000).toISOString().replace(".000Z","Z");
+      console.error(`${at} is less than 90 min from now: 2.0.0 must be live on both phones first. Use ${next} (the next whole hour at or after now + 90 min), or pass --allow-early.`);process.exit(1);
+    }
     for(const c of RELEASE_TIME_CONSTANTS){const file=path.join(ROOT,c.file),source=fs.readFileSync(file,"utf8");if(!pattern(c.name).test(source))throw new Error(`${c.file}: no ${c.name} literal`);fs.writeFileSync(file,source.replace(pattern(c.name),`$1${at}$3`));}
   }
   for(const c of read())console.log(`${c.value}  ${c.name}  ${c.file}`);

```


## FILE: js/iconGuessStep.js (at ae3f3c473107b4156770e3448209216b553063eb)
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconGuessStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Prime Pack, the season step (Nik 2026-10-31, renamed and moved to r87 on 2026-11-01; spec
  // project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md). Once a season, right after Roster Roulette and before the
  // Transfer Challenge opens, both phones show one masked Icon card (the stand-in page visual-assets/v10_1/icon-guess, Team V's
  // art later) and reveal it in four stages (Nik 2026-11-01): the position and one seeded stat, then one more stat per stage.
  // Each manager has two guesses; the first right one the server records wins 4, 3, 2 or 1 Showdown points by its stage (the
  // sparse primePack result key, season maximum 15). Nobody by the end of stage 4 is a draw and the whole card is shown.
  // Old Showdowns never play it (js/iconGuess.js eligible, the same boundary as Roster Roulette).
  //
  // What the phones share is one small record, rivalries/{rid}/primePackRounds/season_N (Rules: the season-results fragment):
  // each arrival (server time), each manager's used guesses and namedBy (the winner). The start is the later arrival + 3 s, so both
  // phones count in together and every stage follows from the server clock the Transfer Challenge already keeps (a reload
  // lands on the current stage). Fair first guess: guesses are transactions on this one record, so the server orders them;
  // the first right one to commit sets namedBy and every later write is refused. Its stage, and so its points, comes from
  // that write's server time (updatedAt), never from a phone clock, and the Rules check the result against it. Which icon it is comes from the Showdown id (no read, never stored); whether a guess is
  // right is decided here, and the record only says who won. Wrong guesses are never stored: the other phone sees only
  // the chip count drop.
  //
  // Reads: one listener on the round record while the screen is open (each change is one read: two arrivals, up to four
  // guesses), one transaction read per write. A Showdown the game does not apply to costs nothing.
  //
  // The file names keep the working name (iconGuess*, icon-guess) so the three reviewed parts stay where they were reviewed;
  // everything a player sees says Prime Pack.
  const PAGE="visual-assets/v10_1/icon-guess/index.html";
  const STAGE_ID="igStage",PANEL_ID="igStepPanel",COLLECTION="primePackRounds";
  const DONE_KEY="careerModeShowdown.primePackDone.v1",KEYS_MAX=60;
  const LOAD_WAIT_MS=10000,READY_WAIT_MS=10000,TICK_MS=200,POLL_MS=2500,REJOIN_MS=3000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const wonMemo=new Map();
  // wentHome: the last run ended because the manager chose Showdown Home (not a fault), so the caller shows no error.
  let running=null,wentHome=false;

  function igsDoc(){return root.document||null;}
  function igsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function igsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function igsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  function igsSeasonId(season){return `season_${season}`;}
  function igsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function igsMark(key,item){try{const list=igsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function igsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The round logic, the matcher and the list. false when any of them cannot load in time.
  async function igsEnsure(){
    const loads=Promise.all([
      igsLoad("icon-guess","js/iconGuess.js",()=>Boolean(root.CareerModeIconGuess)),
      igsLoad("icon-list","data/icons.js",()=>Boolean(root.CareerModeIcons)),
      igsLoad("icon-names","js/iconNames.js",()=>Boolean(root.CareerModeIconNames))
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,igsWait(LOAD_WAIT_MS).then(()=>false)]);
  }
  function igsGuess(){return root.CareerModeIconGuess||(typeof require==="function"?require("./iconGuess.js"):null);}

  // ctx = {rivalryId, managerRole, season, confirmedAtMs}. Does this Showdown play Prime Pack this season? It needs
  // js/iconGuess.js: a browser caller awaits ensure() first (before it, the answer is always false).
  // ignoreSwitch: the season results attach a point already won even when the kill switch is on (Fable F14-02).
  function igsApplies(ctx,{ignoreSwitch=false}={}){
    if((root.CMS_PRIME_PACK==="off"&&!ignoreSwitch)||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    const guess=igsGuess();
    return Boolean(guess&&guess.eligible(ctx.rivalryId,ctx.confirmedAtMs));
  }

  // ---------- the record: Firestore <-> js/iconGuess.js ----------
  function igsMillis(value){if(value&&typeof value.toMillis==="function"){const ms=value.toMillis();return Number.isFinite(ms)?ms:null;}return null;}
  // The stored document as the round logic's record. The winner's beat and time come from the winning write (no later write
  // is allowed once there is a winner, so updatedAt is that write's server time).
  function igsRecord(data,season){
    const guess=igsGuess();
    if(!data||data.objectType!=="sharedPrimePackRound"||data.seasonNumber!==season)return null;
    const arrived={playerOne:igsMillis(data.arrived?.playerOne),playerTwo:igsMillis(data.arrived?.playerTwo)};
    let winner=null;
    if(ROLES.includes(data.namedBy)){
      const atMs=igsMillis(data.updatedAt),startMs=arrived.playerOne&&arrived.playerTwo?Math.max(arrived.playerOne,arrived.playerTwo)+guess.leadMs:null;
      const at=startMs&&atMs?guess.beatAt(startMs,atMs):null;
      winner={role:data.namedBy,beat:at&&at.beat>=0?Math.min(at.beat,guess.lastBeat):0,atMs:atMs||1};
    }
    const record={v:1,season,arrived,chipsUsed:{playerOne:data.chipsUsed?.playerOne,playerTwo:data.chipsUsed?.playerTwo},winner};
    return guess.outcome(record,0)?record:null;
  }
  function igsRef(io,season){return io.sdk.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(season));}
  function igsStamp(io){return {activeSessionId:io.sessionId,updatedByDeviceId:io.deviceId,updatedAt:io.sdk.serverTimestamp()};}
  // This manager is on the screen: his arrival is written once (the first one stands; a reload never moves the start).
  async function igsArrive(io,ctx){
    const ref=igsRef(io,ctx.season),me=ctx.managerRole;
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(!data){
        tx.set(ref,{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:io.rivalryId,seasonNumber:ctx.season,
          arrived:{[me]:io.sdk.serverTimestamp(),[igsOther(me)]:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...igsStamp(io)});
        return "created";
      }
      if(data.arrived&&data.arrived[me]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:io.sdk.serverTimestamp(),revision:data.revision+1,...igsStamp(io)});return "arrived";}
      return "already";
    });
  }
  // Leaving (BACK, or the phone hidden) before the other manager has arrived withdraws this arrival (Fable F12-02), so the
  // round can never start while this manager is away; coming back arrives again. Once both have arrived it stays.
  async function igsLeave(io,ctx){
    const ref=igsRef(io,ctx.season),me=ctx.managerRole;
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(data&&data.arrived&&data.arrived[me]!=null&&data.arrived[igsOther(me)]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:null,revision:data.revision+1,...igsStamp(io)});return "left";}
      return "stays";
    });
  }
  // Arrive and leave run one after the other, in the order they were asked for (a quick hide and show never leaves a
  // withdrawn arrival behind).
  let igsPresenceChain=Promise.resolve();
  function igsPresence(task){const run=igsPresenceChain.then(task,task);igsPresenceChain=run.catch(()=>{});return run;}
  // One matched guess: this manager's used guesses +1, and the winner when it is right, on the latest record.
  async function igsApplyGuess(io,ctx,correct){
    const ref=igsRef(io,ctx.season),guess=igsGuess();
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null,record=igsRecord(data,ctx.season);
      if(!record)return {ok:false,reason:"BAD_RECORD"};
      const next=guess.applyGuess(record,{role:ctx.managerRole,correct,atMs:io.now()});
      if(!next.ok)return next;
      tx.update(ref,{[`chipsUsed.${ctx.managerRole}`]:next.record.chipsUsed[ctx.managerRole],namedBy:correct?ctx.managerRole:null,revision:data.revision+1,...igsStamp(io)});
      return next;
    });
  }
  // The listener on the round record (counted by the read meter); a timed transaction read when no listener is available.
  async function igsSnapshotApi(io){
    const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);
    if(typeof io.sdk.onSnapshot==="function")return meter(io.sdk);
    const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
    try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
  }
  async function igsWatch(io,ctx,onData,onError){
    const api=await igsSnapshotApi(io),ref=igsRef(io,ctx.season);
    if(api){
      const listenRef=api===io.sdk?ref:api.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(ctx.season));
      return api.onSnapshot(listenRef,{includeMetadataChanges:true},snap=>{if(snap.metadata?.hasPendingWrites||snap.metadata?.fromCache)return;onData(snap.exists()?snap.data():null);},onError);
    }
    let stopped=false;
    const poll=async()=>{while(!stopped){try{const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});if(!stopped)onData(data);}catch(error){if(!stopped)onError(error);return;}await igsWait(POLL_MS);}};
    void poll();
    return ()=>{stopped=true;};
  }

  // How many Prime Pack points this manager won this season (0, or 4 to 1 by stage). Read by the season results before they
  // are published, so the points go in as primePack:N (the Rules check N against the round record). io = {firestore, sdk,
  // rivalryId}. One read, once per season, only for a Showdown the game applies to.
  async function igsPointsFor(io,ctx,{ignoreSwitch=false}={}){
    if(!igsApplies(ctx,{ignoreSwitch}))return 0;
    const key=igsKey(ctx);if(wonMemo.has(key))return wonMemo.get(key);
    const ref=igsRef(io,ctx.season);
    const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
    const record=igsRecord(data,ctx.season);
    const points=record&&record.winner?igsGuess().points(record)[ctx.managerRole]:0;
    if(record&&record.winner)wonMemo.set(key,points);
    return points;
  }

  // ---------- the screen ----------
  function igsEl(tag,className,text){const node=igsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function igsRemove(id){const node=igsDoc()?.getElementById(id);if(node)node.remove();}
  function igsClose(){igsRemove(PANEL_ID);igsRemove(STAGE_ID);}
  // A plain choice card over the stage (the same look as the roulette's step panel when its styles are loaded).
  function igsAsk({heading,lines=[],buttons}){
    return new Promise(resolve=>{
      igsRemove(PANEL_ID);
      const overlay=igsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",heading);
      overlay.style.cssText="position:fixed;inset:0;z-index:96;display:flex;align-items:center;justify-content:center;background:#050403;padding:16px";
      const shell=igsEl("div","remoteJoiningShell rrStepShell");shell.style.cssText="max-width:420px;width:100%;background:#15130f;color:#f3ead7;border:1px solid #6b5a33;border-radius:12px;padding:20px";
      shell.append(igsEl("strong","","PRIME PACK"),igsEl("h2","rrStepTitle",heading));
      for(const line of lines)shell.append(igsEl("p","rrStepLine",line));
      const row=igsEl("div","rrStepActions");row.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px";
      for(const b of buttons){const button=igsEl("button",b.primary?"menuButton rrStepPrimary":"backButton",b.label);button.type="button";button.addEventListener("click",()=>{igsRemove(PANEL_ID);resolve(b.id);});row.append(button);}
      shell.append(row);overlay.append(shell);igsDoc().body.append(overlay);row.querySelector("button")?.focus();
    });
  }
  function igsStage(){
    const doc=igsDoc();igsRemove(STAGE_ID);
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Prime Pack");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403";
    const frame=doc.createElement("iframe");frame.title="Prime Pack";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    // Leaving while the other manager has not arrived (the window then stays shut; tapping the button again comes back here).
    const back=doc.createElement("button");back.type="button";back.className="backButton";back.textContent="BACK TO SHOWDOWN HOME";back.hidden=true;
    back.style.cssText="position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2";
    stage.append(frame,back);doc.body.append(stage);
    // The roulette's result panel (z-index 96) stays over this stage until the Prime Pack page is ready (Reus Gate, Fable
    // F13-07: a slow page never shows a plain dark screen); igsPlay closes it on cms-ig-ready, or when the step fails.
    return {stage,frame,back};
  }
  function igsPost(frame,type,data={}){try{frame.contentWindow?.postMessage({type,...data},root.location?.origin||"*");}catch(_error){}}
  // What the page needs for this season's card. The name and overall go with it (the page never shows them before the
  // result: N2); the manager names are fixed, Daniel is playerOne.
  function igsRound(ctx){
    const guess=igsGuess(),list=root.CareerModeIcons,players=list&&list.players;
    const draw=players&&guess.draw(ctx.rivalryId,ctx.season,players.length,list.listVersion);
    const icon=draw&&players[draw.index];
    if(!icon)return null;
    const source=`${String(icon.cardVersion||"").toUpperCase()} · ${icon.game}`;
    return {answerId:icon.id,round:{me:ctx.managerRole,names:{...NAMES},stages:guess.stages,position:icon.position,overall:icon.overall,name:icon.name,
      stats:{...icon.stats},statOrder:[...draw.statOrder],stagePoints:[...guess.stagePoints],nation:icon.nationCode,source}};
  }
  // A suggestion shows the card name, or the full name when two icons share that card name (typing it alone is ambiguous).
  function igsSuggestions(index,text){
    const names=root.CareerModeIconNames;
    return names.suggest(index,text).map(s=>{const m=names.match(index,s.name);return m.status==="ambiguous"?s.fullName:s.name;});
  }

  // Runs this season's Prime Pack for this manager. io = {firestore, sdk (doc, runTransaction, serverTimestamp, onSnapshot?),
  // rivalryId, sessionId, deviceId, now() (server time)}. Resolves true when the Transfer Challenge may open (the round is over
  // and this manager pressed Continue, or the game does not apply), false when he went back to Showdown Home or the step
  // could not run (the window then stays shut and the dashboard says why; tapping again retries).
  async function igsRun(ctx,io){
    if(running)return running;
    wentHome=false;
    // On true the stage stays up until the Transfer Challenge is on screen (the caller closes it), so nothing flashes between.
    running=igsRunNow(ctx,io).then(go=>{if(!go)igsClose();return go;},error=>{igsClose();throw error;}).finally(()=>{running=null;});
    return running;
  }
  async function igsRunNow(ctx,io){
    if(!igsApplies(ctx))return true;
    if(!await igsEnsure())return false;
    // This phone already saw this season's result and pressed Continue: straight on to the Transfer Challenge.
    if(igsList(DONE_KEY).includes(igsKey(ctx)))return true;
    const index=root.CareerModeIconNames.defaultIndex(),pick=igsRound(ctx),guess=igsGuess();
    if(!index||!pick)return false;
    for(;;){
      const result=await igsPlay(ctx,io,{index,pick,guess});
      if(result==="continue"){igsMark(DONE_KEY,igsKey(ctx));return true;}
      if(result==="back"){wentHome=true;return false;}
      const choice=await igsAsk({heading:"Prime Pack could not load",lines:[root.CareerModeFirestoreBudget?.quotaMessage?.(result)||"Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back"){wentHome=true;return false;}
    }
  }
  // One screen session: "continue", "back", or an error object.
  function igsPlay(ctx,io,{index,pick,guess}){
    return new Promise(resolve=>{
      const me=ctx.managerRole,other=igsOther(me);
      const {frame,back}=igsStage();
      // resultShown: the result on screen as "winner:points" (or "draw:0"); it follows the server's record, so a winner that
      // lands after a shown draw (the Rules' 2 s slack) replaces it (Fable F12-03).
      let record=null,ready=false,stop=null,timer=null,shownBeat=-2,finished=false,resultShown="",sentChips={playerOne:null,playerTwo:null};
      // After this phone's right guess: the round record as the server stamped it (its updatedAt gives the stage and points).
      const readBack=()=>io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(igsRef(io,ctx.season));return snap.exists()?snap.data():null;}).then(data=>onData(data),()=>{});
      const end=value=>{if(finished)return;finished=true;root.clearInterval(timer);root.removeEventListener("message",onMessage);igsDoc().removeEventListener?.("visibilitychange",onVisibility);try{stop&&stop();}catch(_error){}resolve(value);};
      // Away while the other manager has not arrived: withdraw (igsLeave); back on screen: arrive again.
      // rejoinedAt: when this phone last sent its arrival again (Fable F13-02), at most once every REJOIN_MS.
      let away=false,rejoinedAt=-Infinity;
      const leave=()=>igsPresence(()=>igsLeave(io,ctx)).catch(error=>{root.CareerModeFirestoreBudget?.noteError?.(error);});
      const closeRoulette=()=>{try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}};
      // Fable F13-03: back on screen after a lock, the phone's clock may have stood still: take a fresh server time and send
      // the current stage and chips again, so the page never shows stage 2 while the server scores stage 3.
      const resend=()=>{shownBeat=-2;sentChips={playerOne:null,playerTwo:null};render();};
      const onVisibility=()=>{
        if(finished)return;
        if(igsDoc().visibilityState==="hidden"){if(record&&!record.winner&&record.arrived[other]===null){away=true;leave();}return;}
        resend();
        Promise.resolve().then(()=>io.resync?.()).catch(()=>{}).then(()=>{if(!finished)resend();});
        if(away){away=false;rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
      };
      // Fable F13-01: a fault withdraws this manager's arrival (if the other has not arrived), so nobody plays alone for 4.
      const fail=error=>{if(finished)return;root.CareerModeFirestoreBudget?.noteError?.(error);closeRoulette();if(ready&&!(record&&record.arrived[other]!==null))leave();end(error||{code:"PRIME_PACK_FAILED"});};
      const render=()=>{
        if(!ready||!record||finished)return;
        let now;try{now=io.now();}catch(error){return fail(error);}
        const out=guess.outcome(record,now);if(!out)return;
        for(const role of ROLES){if(sentChips[role]!==out.chips[role]){sentChips[role]=out.chips[role];igsPost(frame,"cms-ig-chips",{role,count:out.chips[role]});}}
        if(out.state==="won"||out.state==="draw"){
          const points=out.winner?guess.points(record)[out.winner]:0,shown=`${out.winner||"draw"}:${points}`;
          if(resultShown!==shown&&!(out.state==="draw"&&resultShown)){
            resultShown=shown;back.hidden=true;
            igsPost(frame,"cms-ig-result",{winner:out.winner||"draw",points});
            if(out.winner)for(const role of ROLES)wonMemo.set(igsKey({...ctx,managerRole:role}),role===out.winner?points:0);
          }
          return;
        }
        if(out.state==="waiting"){
          // Fable F13-02: BACK always shows while waiting. This phone is on screen but its arrival is missing (a withdraw that
          // landed late, a lost write): it arrives again, at most once every REJOIN_MS.
          const waitingFor=record.arrived[other]===null?other:me;back.hidden=false;
          if(record.arrived[me]===null&&!away&&igsDoc().visibilityState!=="hidden"&&Date.now()-rejoinedAt>=REJOIN_MS){rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
          if(shownBeat!==-1){shownBeat=-1;igsPost(frame,"cms-ig-waiting",{role:waitingFor});}
          return;
        }
        back.hidden=true;
        const at=guess.beatAt(guess.startMs(record),now);
        if(at.phase==="waiting"){if(shownBeat!==-1.5){shownBeat=-1.5;igsPost(frame,"cms-ig-waiting",{role:null});}return;}
        if(at.beat!==shownBeat){shownBeat=at.beat;igsPost(frame,"cms-ig-reveal",{index:at.beat,phase:at.phase,remainingMs:at.stageMsLeft,revealMsLeft:at.phase==="reveal"?at.msLeft:0});}
      };
      const onData=data=>{
        const next=igsRecord(data,ctx.season);
        if(!next)return;
        record=next;render();
      };
      const onMessage=event=>{
        if(event.source!==frame.contentWindow||!event.data||typeof event.data.type!=="string")return;
        const m=event.data;
        if(m.type==="cms-ig-ready"){
          if(ready)return;ready=true;
          igsPost(frame,"cms-ig-start",{round:pick.round,waitingFor:other});shownBeat=-2;sentChips={playerOne:null,playerTwo:null};
          // The page is up: the roulette panel goes (F13-07), and only now does this manager arrive, so a slow page never
          // spends its own stage 1 (Fable F13-01).
          closeRoulette();join();
          render();
        }else if(m.type==="cms-ig-input"){
          igsPost(frame,"cms-ig-suggestions",{names:igsSuggestions(index,String(m.text||""))});
        }else if(m.type==="cms-ig-guess"){
          const check=root.CareerModeIconNames.check(index,String(m.text||""),pick.answerId);
          if(check.status==="empty"||check.status==="not-in-list")return igsPost(frame,"cms-ig-feedback",{kind:"not-in-list"});
          if(check.status==="ambiguous")return igsPost(frame,"cms-ig-feedback",{kind:"ambiguous"});
          igsApplyGuess(io,ctx,check.correct).then(next=>{
            if(!next.ok)return igsPost(frame,"cms-ig-feedback",{kind:next.reason==="NO_CHIPS"?"used":"late"});
            // A right guess: its stage, and so its points, is the SERVER time of the write (updatedAt), never this phone's clock
            // when the transaction read ran (Fable F12-01: a commit landing past a stage edge scores the later stage). Only the
            // stamped record is shown or remembered, so both phones and the season result agree with the Rules.
            if(check.correct)return readBack();
            record=next.record;igsPost(frame,"cms-ig-feedback",{kind:"wrong"});render();
          },error=>{root.CareerModeFirestoreBudget?.noteError?.(error);igsPost(frame,"cms-ig-feedback",{kind:/permission/.test(String(error&&error.code))?"late":"error"});});
        }else if(m.type==="cms-ig-continue"){
          if(resultShown)end("continue");
        }else if(m.type==="cms-ig-error"){
          // A page fault never decides the round: it is reported and the round carries on with the server's record.
          root.CareerModeFirestoreBudget?.noteError?.({code:"PRIME_PACK_PAGE",message:String(m.message||"")});
        }
      };
      back.addEventListener("click",()=>{if(finished)return;leave();end("back");});
      igsDoc().addEventListener?.("visibilitychange",onVisibility);
      root.addEventListener("message",onMessage);
      timer=root.setInterval(render,TICK_MS);
      root.setTimeout(()=>{if(!ready&&!finished)fail({code:"PRIME_PACK_PAGE_TIMEOUT"});},READY_WAIT_MS);
      const join=()=>Promise.resolve().then(async()=>{
        rejoinedAt=Date.now();
        await igsPresence(()=>igsArrive(io,ctx));
        if(finished)return;
        const unsubscribe=await igsWatch(io,ctx,onData,fail);
        if(finished){try{unsubscribe();}catch(_error){}return;}
        stop=unsubscribe;
      }).catch(fail);
    });
  }

  return Object.freeze({contractVersion:1,feature:"cms-prime-pack-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,collection:COLLECTION,doneKey:DONE_KEY,
    applies:igsApplies,record:igsRecord,round:igsRound,suggestions:igsSuggestions,pointsFor:igsPointsFor,arrive:igsArrive,leave:igsLeave,applyGuess:igsApplyGuess,run:igsRun,close:igsClose,wentHome:()=>wentHome,ensure:igsEnsure});
});

```


## FILE: js/sharedHistoryConvergence.js (at ae3f3c473107b4156770e3448209216b553063eb)
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedHistoryConvergence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r12";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PROFILE_ID=/^profile_[0-9a-f]{24}$/;
  const SAVE_ID=/^save_[0-9a-f]{24}$/;
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const SCORE_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]);
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  // r80 Europa League: a result may carry the sparse 8th key europaLeague (exactly true, never with championsLeague true; checked per
  // manager only), and its score then carries europaLeague:3. A result without it is the unchanged r79 shape and scores as before.
  const EUROPA_LEAGUE="europaLeague";
  const LEAGUE_TEAM_COUNTS=Object.freeze({premier_league:20,laliga:20,bundesliga:18,serie_a:20,ligue_1:20});

  function hcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function hcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function hcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcFreeze);Object.freeze(value);}return value;}
  function hcExact(value,keys,code){if(!hcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))hcFail(code);return value;}
  function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
  function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
  function hcTeamCount(leagueId){const n=LEAGUE_TEAM_COUNTS[String(leagueId||"").trim()];if(!Number.isInteger(n))hcFail("HISTORY_CONVERGENCE_LEAGUE_INVALID");return n;}
  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,hcResultKeys(value),"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");return won;}
  function hcResultKeys(value){return [...RESULT_KEYS,...(Object.hasOwn(value,EUROPA_LEAGUE)?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])];}
  function hcResult(value,teamCount){
    hcEuropaLeague(value);
    const maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");}
    // The 7 keys in their fixed order, then europaLeague only when present (the order every normalizer writes), so the tamper rebuild matches.
    return Object.fromEntries(hcResultKeys(value).map(key=>[key,value[key]]));
  }
  function hcExpectedScore(result){
    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0,primePack=Number.isInteger(result.primePack)?result.primePack:0;
    const leagueTitle=result.leaguePosition===1?3:0;
    const domesticCup=result.domesticCup?1:0;
    const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
    const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
    return {championsLeague,...(europaLeague?{europaLeague}:{}),...(primePack?{primePack}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+primePack+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
  }
  function hcScore(value,result){
    if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE),hasPrimePack=Object.hasOwn(value,"primePack");
    // r87 Prime Pack: the sparse primePack breakdown key (1 to 4) sits beside the others exactly when the result carries it.
    const scoreKeys=[...SCORE_KEYS,...(hasEuropaLeague?[EUROPA_LEAGUE]:[]),...(hasPrimePack?["primePack"]:[])],allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
    if(keys.length!==allowed.length||allowed.some(key=>!Object.hasOwn(value,key)))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const expected=hcExpectedScore(result);
    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE)||hasPrimePack!==Object.hasOwn(expected,"primePack"))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
    for(const key of scoreKeys){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    if(hasTriggers){
      hcExact(value.triggers,TRIGGER_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
      const expectedTriggers={
        hundredLeaguePoints:result.leaguePoints>=100,
        hundredLeagueGoals:result.leagueGoals>=100,
        topScorer:result.topScorer,
        topAssist:result.topAssist
      };
      for(const key of TRIGGER_KEYS){if(value.triggers[key]!==expectedTriggers[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    }
    return Object.fromEntries(Object.keys(expected).map(key=>[key,value[key]]));
  }
  function hcSlots(value){
    if(!Array.isArray(value)||value.length!==2)hcFail("HISTORY_CONVERGENCE_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>value.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||!PROFILE_ID.test(String(slot.profileId||""))||!SAVE_ID.test(String(slot.saveId||""))||typeof slot.accountId!=="string"||!slot.accountId.trim()||slot.entitlementState!=="active"))hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId)hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    return ordered.map(slot=>({slotId:slot.slotId,accountId:slot.accountId,profileId:slot.profileId,saveId:slot.saveId}));
  }
  function hcSetup(value,rivalryId){
    if(!hcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!hcPlain(value.clubs)||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)hcFail("HISTORY_CONVERGENCE_SETUP_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return value;
  }
  function hcCommit(value,rivalryId,seasonNumber,teamCount){
    if(!hcPlain(value)||value.ok!==true||value.committed!==true||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2||value.seasonNumber!==seasonNumber||!HASH.test(String(value.resultsContentHash||""))||!hcPlain(value.results))hcFail("HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return {results:{playerOne:hcResult(value.results.playerOne,teamCount),playerTwo:hcResult(value.results.playerTwo,teamCount)},resultsRevision:value.resultsRevision,resultsContentHash:value.resultsContentHash};
  }
  function hcScoring(value,rivalryId,seasonNumber,commit){
    if(!hcPlain(value)||value.ok!==true||value.authoritative!==true||value.phase!=="SCORING_RECONCILED"||value.revision!==1||value.seasonCommitRevision!==3||value.resultsRevision!==commit.resultsRevision||value.resultsContentHash!==commit.resultsContentHash||value.seasonNumber!==seasonNumber||!hcPlain(value.scoring)||!ROLES.includes(value.winner)&&value.winner!=="draw")hcFail("HISTORY_CONVERGENCE_SCORING_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    const scoring={playerOne:hcScore(value.scoring.playerOne,commit.results.playerOne),playerTwo:hcScore(value.scoring.playerTwo,commit.results.playerTwo)};
    const a=scoring.playerOne.total,b=scoring.playerTwo.total;
    // r83: no tiebreak. Equal Showdown points is a draw.
    const expected=a>b?"playerOne":b>a?"playerTwo":"draw";
    // r87 Fable F7-01: a season scored before r83 could name a league-position winner on equal points. Equal points is a
    // draw, so such a winner is read as "draw" (the stored results and their hashes are untouched). A winner that
    // disagrees with unequal points is still an integrity failure, and a projection whose seasonHistory keeps the old
    // winner still fails verifyProjection (its rebuild says "draw").
    if(value.winner!==expected&&a!==b)hcFail("HISTORY_CONVERGENCE_WINNER_MISMATCH");
    return {scoring,winner:expected};
  }
  function hcManagerBase(slot,club){return {role:slot.slotId,profileId:slot.profileId,saveId:slot.saveId,club,seasons:0,seasonWins:0,seasonLosses:0,seasonDraws:0,totalPoints:0,leagueTitles:0,domesticCups:0,championsLeagues:0,europaLeagues:0,totalTrophies:0,hundredPointSeasons:0,hundredGoalSeasons:0,topScorerSeasons:0,topAssistSeasons:0,perfectSeasons:0,bestLeaguePosition:null,bestLeaguePoints:null,bestLeagueGoals:null,bestSeasonScore:null,averageSeasonScore:0,averageLeaguePoints:0,averageLeagueGoals:0,totalLeaguePoints:0,totalLeagueGoals:0};}
  // Nik 2026-11-01 18:32 UTC: a perfect season is 15, the season maximum, in every Showdown (no 11 anywhere).
  const PERFECT_SEASON=15;
  function hcAccumulate(record,season,role){
    const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score===PERFECT_SEASON)record.perfectSeasons+=1;
    record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
  }
  function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues+record.europaLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
  function hcBuild({rivalryId,setup,managerSlots,seasons}={}){
    const id=hcRivalry(rivalryId),finalSetup=hcSetup(setup,id),teamCount=hcTeamCount(finalSetup.leagueId),slots=hcSlots(managerSlots);
    if(!Array.isArray(seasons)||seasons.length<1||seasons.length>finalSetup.totalSeasons)hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
    const history=[];
    for(let index=0;index<seasons.length;index+=1){
      const seasonNumber=index+1,source=seasons[index];if(!hcPlain(source))hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
      const commit=hcCommit(source.commit,id,seasonNumber,teamCount),canonical=hcScoring(source.scoring,id,seasonNumber,commit);
      history.push({roundNumber:seasonNumber,acceptedResultRevision:commit.resultsRevision,acceptedResultContentHash:commit.resultsContentHash,seasonCommitRevision:3,canonicalScoringRevision:1,playerOne:{...commit.results.playerOne,scoring:canonical.scoring.playerOne},playerTwo:{...commit.results.playerTwo,scoring:canonical.scoring.playerTwo},winner:canonical.winner});
    }
    const managerRecords={playerOne:hcManagerBase(slots[0],finalSetup.clubs.playerOne),playerTwo:hcManagerBase(slots[1],finalSetup.clubs.playerTwo)};
    for(const season of history){for(const role of ROLES)hcAccumulate(managerRecords[role],season,role);}
    for(const role of ROLES)hcFinalize(managerRecords[role]);
    const trophyAttribution={playerOne:{profileId:managerRecords.playerOne.profileId,leagueTitles:managerRecords.playerOne.leagueTitles,domesticCups:managerRecords.playerOne.domesticCups,championsLeagues:managerRecords.playerOne.championsLeagues,europaLeagues:managerRecords.playerOne.europaLeagues,totalTrophies:managerRecords.playerOne.totalTrophies},playerTwo:{profileId:managerRecords.playerTwo.profileId,leagueTitles:managerRecords.playerTwo.leagueTitles,domesticCups:managerRecords.playerTwo.domesticCups,championsLeagues:managerRecords.playerTwo.championsLeagues,europaLeagues:managerRecords.playerTwo.europaLeagues,totalTrophies:managerRecords.playerTwo.totalTrophies}};
    const acceptedRevisionKey=history.map(item=>`${item.roundNumber}:${item.acceptedResultRevision}:${item.acceptedResultContentHash}`).join("|");
    return hcFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:"HISTORY_CONVERGED",revision:1,rivalryId:id,setupRevision:6,leagueId:finalSetup.leagueId,totalSeasons:finalSetup.totalSeasons,acceptedSeasons:history.length,acceptedRevisionKey,managerSlots:slots,seasonHistory:history,managerRecords,trophyAttribution,canonicalStorageMutation:false,providerWriteRequired:false});
  }
  function hcVerify(projection){
    if(!hcPlain(projection)||projection.schemaVersion!==1||projection.runtimeRevision!==RUNTIME_REVISION||projection.phase!=="HISTORY_CONVERGED"||projection.revision!==1||projection.canonicalStorageMutation!==false||projection.providerWriteRequired!==false)hcFail("HISTORY_CONVERGENCE_PROJECTION_INVALID");
    const rebuilt=hcBuild({rivalryId:projection.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:projection.totalSeasons,leagueId:projection.leagueId,clubs:{playerOne:projection.managerRecords?.playerOne?.club,playerTwo:projection.managerRecords?.playerTwo?.club}},managerSlots:projection.managerSlots.map(slot=>({...slot,entitlementState:"active"})),seasons:projection.seasonHistory.map(season=>({commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,results:{playerOne:Object.fromEntries(hcResultKeys(season.playerOne).map(key=>[key,season.playerOne[key]])),playerTwo:Object.fromEntries(hcResultKeys(season.playerTwo).map(key=>[key,season.playerTwo[key]]))}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,scoring:{playerOne:season.playerOne.scoring,playerTwo:season.playerTwo.scoring},winner:season.winner}}))});
    if(JSON.stringify(rebuilt)===JSON.stringify(projection))return projection;
    // A projection saved before 2.0.0 (a Firebase careerSummary is create-only, and a phone keeps a copy) counted any season
    // of 11 or more as perfect. That counter is derived from the seasons, so a projection that differs from its rebuild in
    // the two perfectSeasons counters and nothing else is the same verified history: the rebuild, which counts 15s, is
    // returned. Any other difference is still tampering.
    const recounted={...projection,managerRecords:Object.fromEntries(Object.entries(hcPlain(projection.managerRecords)?projection.managerRecords:{}).map(([role,record])=>[role,hcPlain(record)&&Object.hasOwn(record,"perfectSeasons")&&hcPlain(rebuilt.managerRecords[role])?{...record,perfectSeasons:rebuilt.managerRecords[role].perfectSeasons}:record]))};
    if(JSON.stringify(rebuilt)!==JSON.stringify(recounted))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");
    return rebuilt;
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,buildProjection:hcBuild,verifyProjection:hcVerify,canonicalStorageMutation:false,providerWriteRequired:false,requiresCanonicalScoring:true,exactSeasonAddressing:true,identitySafe:true});
});
```


## FILE: js/sharedCareerAnalytics.js (at ae3f3c473107b4156770e3448209216b553063eb)
```
(function(root,factory){
  const api=factory(typeof module!=="undefined"&&module.exports?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCareerAnalytics=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History){
  "use strict";

  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const COUNTERS=Object.freeze(["careerPoints","seasons","seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","performanceBonuses","awardsBonuses"]);
  const BESTS=Object.freeze(["bestSeasonScore","bestLeaguePoints","bestLeagueGoals","bestLeaguePosition"]);
  const AVERAGES=Object.freeze(["averageSeasonScore","averageLeaguePoints","averageLeagueGoals"]);
  const CABINET=Object.freeze(["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"]);
  const LABELS=Object.freeze(["Highest season score","Highest league points","Highest league goals","Biggest Showdown win","Most perfect seasons"]);

  function caFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(caFreeze);Object.freeze(value);}return value;}
  function managerBase(unknown){
    return {...Object.fromEntries(COUNTERS.map(key=>[key,unknown?null:0])),...Object.fromEntries([...BESTS,...AVERAGES].map(key=>[key,null])),showdowns:{completed:unknown?null:0,wins:unknown?null:0,draws:unknown?null:0,losses:unknown?null:0}};
  }
  function managerFor(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
  function seasonTiebreak(season){
    const a=season.playerOne,b=season.playerTwo;
    // r83: no tiebreak. Equal Showdown points is a draw, whatever the league table says.
    return a.scoring.total!==b.scoring.total?"none":"draw";
  }
  function caCanonical(value){
    if(Array.isArray(value))return "["+value.map(caCanonical).join(",")+"]";
    if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+caCanonical(value[key])).join(",")+"}";
    return JSON.stringify(value);
  }
  function verified(entry){
    const classification=entry.classification;
    if(classification==="abandoned"||classification==="unavailable")return {rivalryId:entry.rivalryId,classification,projection:null,final:null,...(classification==="abandoned"&&entry.ended&&typeof entry.ended==="object"?{ended:endedOf(entry.ended)}:{})};
    if(!["active","completion-pending","completed"].includes(classification))return {rivalryId:entry.rivalryId,classification:"unavailable",projection:null,final:null};
    try{
      const p=History.verifyProjection(entry.projection);
      if(p.rivalryId!==entry.rivalryId)throw new Error("CAREER_RIVALRY_MISMATCH");
      let final=null;
      if(classification!=="active"){
        const a=p.managerRecords.playerOne.totalPoints,b=p.managerRecords.playerTwo.totalPoints;
        const winner=a>b?"playerOne":b>a?"playerTwo":"draw";
        // r87 Fable F7-01: equal career points is a draw even when an older final named a winner; unequal must agree.
        if(entry.final?.totals?.playerOne!==a||entry.final?.totals?.playerTwo!==b||entry.final?.winner!==winner&&!(a===b&&["playerOne","playerTwo"].includes(entry.final?.winner)))throw new Error("CAREER_FINAL_MISMATCH");
        final={totals:{playerOne:a,playerTwo:b},winner};
      }
      // r86 (red team #13): the Setup confirm time rides along, so a row can say whether this Showdown has Special Players.
      return {rivalryId:entry.rivalryId,classification,projection:p,final,setupConfirmedAt:Number.isFinite(entry.setupConfirmedAt)?entry.setupConfirmedAt:null};
    }catch(_error){return {rivalryId:entry.rivalryId,classification:"unavailable",projection:null,final:null};}
  }
  function uniqueEntries(showdowns){
    const entries=[],positions=new Map(),fingerprints=new Map();
    for(const source of showdowns){
      if(source.classification==="pending")continue;
      const entry=verified(source),id=entry.rivalryId;
      // Lifecycle and setup disagreements are also integrity failures; never choose a side.
      const fingerprint=caCanonical({classification:source.classification,projection:source.projection??null,final:source.final??null});
      if(!positions.has(id)){
        positions.set(id,entries.length);fingerprints.set(id,fingerprint);entries.push(entry);
      }else if(fingerprints.get(id)!==fingerprint||entry.classification==="unavailable"){
        entries[positions.get(id)]={rivalryId:id,classification:"unavailable",projection:null,final:null};
      }
    }
    return entries;
  }
  // r80 Ended early: an abandoned row read from its closed root also carries its close time and seasons played (null when
  // unknown); it never counts.
  function endedOf(ended){const at=ended?.endedAt,played=ended?.seasonsPlayed;return {endedAt:Number.isFinite(at)&&at>0?at:null,seasonsPlayed:Number.isInteger(played)&&played>=0&&played<=10?played:null};}
  function statusRow(entry,number){const ended=entry.ended||null;return {number,rivalryId:entry.rivalryId,status:entry.classification,leagueId:null,clubs:null,seasonsPlayed:ended?ended.seasonsPlayed:null,totalSeasons:null,totals:null,winner:null,seasons:[],setupConfirmedAt:null,...(ended?{endedAt:ended.endedAt}:{})};}
  function seasonRow(season){
    const pair=field=>({daniel:season.playerOne[field],nik:season.playerTwo[field]});
    // r80: a season with a Europa League win also names who won it (History shows it); other seasons keep the r79 row shape.
    const europaLeague=season.playerOne.europaLeague===true||season.playerTwo.europaLeague===true?{europaLeague:{daniel:season.playerOne.europaLeague===true,nik:season.playerTwo.europaLeague===true}}:{};
    return {season:season.roundNumber,score:{daniel:season.playerOne.scoring.total,nik:season.playerTwo.scoring.total},winner:managerFor(season.winner),tiebreak:seasonTiebreak(season),leaguePosition:pair("leaguePosition"),leaguePoints:pair("leaguePoints"),leagueGoals:pair("leagueGoals"),...europaLeague};
  }
  // r87 Prime Pack (Nik 2026-11-01 17:35 UTC): a perfect season is 15 points (11 + a 4-point Prime Pack), in every
  // Showdown. An older Showdown's 11 stays in its History but is not a perfect season: one meaning on every screen.
  // PRIME_PACK_FROM_MS stays on the release-time list (tools/set-release-time.cjs) with the other Prime Pack boundaries.
  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
  const PERFECT_SEASON=15;
  function seasonMaxOf(_entry,_seasons){return PERFECT_SEASON;}
  function accumulate(record,season,role,sums,max=PERFECT_SEASON){
    const r=season[role],score=r.scoring.total;
    record.seasons+=1;record.careerPoints+=score;
    sums.points+=r.leaguePoints;sums.goals+=r.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(r.championsLeague)record.championsLeagues+=1;
    if(r.europaLeague===true)record.europaLeagues+=1;
    if(r.leaguePosition===1)record.leagueTitles+=1;
    if(r.domesticCup)record.domesticCups+=1;
    if(r.leaguePoints>=100)record.hundredPointSeasons+=1;
    if(r.leagueGoals>=100)record.hundredGoalSeasons+=1;
    if(r.topScorer)record.topScorerSeasons+=1;
    if(r.topAssist)record.topAssistSeasons+=1;
    if(score===max)record.perfectSeasons+=1;
    record.performanceBonuses+=r.scoring.performanceBonus;
    record.awardsBonuses+=r.scoring.individualAwardsBonus;
    for(const [key,value] of [["bestSeasonScore",score],["bestLeaguePoints",r.leaguePoints],["bestLeagueGoals",r.leagueGoals],["bestLeaguePosition",r.leaguePosition]]){
      record[key]=record[key]===null?value:key==="bestLeaguePosition"?Math.min(record[key],value):Math.max(record[key],value);
    }
  }
  function bestRecord(label,candidates){
    if(!candidates.length)return {label,manager:"shared",value:null,ref:null};
    const value=Math.max(...candidates.map(candidate=>candidate.value));
    // r87 career fixes (B5): a best of 0 (no perfect season, a 0-0 season) is a record nobody holds, never "0 Shared".
    if(!(value>0))return {label,manager:"shared",value:null,ref:null};
    const tied=candidates.filter(candidate=>candidate.value===value);
    const managers=new Set(tied.map(candidate=>candidate.manager));
    const places=new Set(tied.map(candidate=>caCanonical(candidate.ref)));
    return {label,manager:managers.size===1?tied[0].manager:"shared",value,ref:places.size===1&&tied[0].ref?{...tied[0].ref}:null};
  }
  function trophyRoom(managers,records,unknown){
    const cabinet=Object.fromEntries(MANAGERS.map(manager=>[manager,Object.fromEntries(CABINET.map(key=>[key,managers[manager][key]]))]));
    const standings=unknown?[]:MANAGERS.map(manager=>({manager,careerPoints:managers[manager].careerPoints,seasonWins:managers[manager].seasonWins}));
    // r83 (Nik 2026-10-23): equal career points are level, as a tied Showdown total is a DRAW. Season wins are a stat, never
    // a tiebreak for the crown or #1, so Legacy's DRAW and the career ranks always tell the same story.
    standings.sort((a,b)=>b.careerPoints-a.careerPoints);
    if(standings.length&&standings[0].careerPoints===standings[1].careerPoints)standings.forEach(row=>{row.level=true;});
    return {cabinet,standings,records};
  }
  function buildCareerModel({indexStatus,showdowns=[],...options}={}){
    const interimLabel=options["current"+"ShowdownOnly"]===true?"Current Showdown only. Career history is not yet available.":null;
    const unknown=indexStatus!=="ready";
    const managers={daniel:managerBase(unknown),nik:managerBase(unknown)};
    if(unknown)return caFreeze({status:indexStatus==="loading"?"loading":"unavailable",interimLabel,coverage:{readable:null,indexed:null},managers,biggestShowdownWin:null,trophyRoom:trophyRoom(managers,[],true),history:{showdowns:[]}});

    const entries=uniqueEntries(showdowns),rows=[],sums={daniel:{points:0,goals:0},nik:{points:0,goals:0}};
    const candidates=[[],[],[],[],[]];
    let readable=0,biggestShowdownWin=null;
    for(const entry of entries){
      const {projection:p,classification}=entry;
      if(classification==="unavailable"||classification==="abandoned"){
        if(classification==="abandoned")readable+=1;
        rows.push(statusRow(entry,rows.length+1));continue;
      }
      readable+=1;
      // r83 (JOB-4 F1): career totals, cabinets, ranks and records count finished Showdowns only, so every career screen
      // agrees with History/Legacy and never depends on whether this page holds the live History. An unfinished Showdown
      // keeps its row and shows on THIS SHOWDOWN / Rivalry Statistics. The labelled current-only view (interimLabel) is that
      // live Showdown on its own, so it still counts it.
      const seasonMax=seasonMaxOf(entry,p.seasonHistory);
      if(classification==="completed"||interimLabel!==null)for(const season of p.seasonHistory){
        for(let i=0;i<ROLES.length;i+=1){
          const role=ROLES[i],manager=MANAGERS[i],r=season[role];
          accumulate(managers[manager],season,role,sums[manager],seasonMax);
          const ref={rivalryId:entry.rivalryId,season:season.roundNumber};
          for(const [index,value] of [r.scoring.total,r.leaguePoints,r.leagueGoals].entries())candidates[index].push({manager,value,ref});
        }
      }
      const totals={daniel:p.managerRecords.playerOne.totalPoints,nik:p.managerRecords.playerTwo.totalPoints};
      const finalWinner=classification==="active"?null:managerFor(entry.final.winner);
      rows.push({number:rows.length+1,rivalryId:entry.rivalryId,status:classification==="active"?"in-progress":classification,leagueId:p.leagueId,clubs:{daniel:p.managerRecords.playerOne.club,nik:p.managerRecords.playerTwo.club},seasonsPlayed:p.acceptedSeasons,totalSeasons:p.totalSeasons,totals,winner:finalWinner,seasons:p.seasonHistory.map(seasonRow),setupConfirmedAt:Number.isFinite(entry.setupConfirmedAt)?entry.setupConfirmedAt:null});
      if(classification==="completed"){
        for(const manager of MANAGERS){
          const outcomes=managers[manager].showdowns;outcomes.completed+=1;
          if(finalWinner==="draw")outcomes.draws+=1;else if(finalWinner===manager)outcomes.wins+=1;else outcomes.losses+=1;
        }
        if(finalWinner!=="draw"){
          const margin=Math.abs(totals.daniel-totals.nik);
          const win={manager:finalWinner,margin,showdownRef:entry.rivalryId};
          // Equal biggest wins keep the first career-order witness; the record reports shared ties.
          if(biggestShowdownWin===null||margin>biggestShowdownWin.margin)biggestShowdownWin=win;
          candidates[3].push({manager:finalWinner,value:margin,ref:{rivalryId:entry.rivalryId}});
        }
      }
    }
    for(const manager of MANAGERS){
      const record=managers[manager];record.totalTrophies=record.championsLeagues+record.europaLeagues+record.leagueTitles+record.domesticCups;
      if(record.seasons){
        record.averageSeasonScore=record.careerPoints/record.seasons;
        record.averageLeaguePoints=sums[manager].points/record.seasons;
        record.averageLeagueGoals=sums[manager].goals/record.seasons;
        candidates[4].push({manager,value:record.perfectSeasons,ref:null});
      }
    }
    const records=LABELS.map((label,index)=>bestRecord(label,candidates[index]));
    // A cross-manager tie for the biggest win is shared, as in the Trophy Room record.
    if(biggestShowdownWin&&records[3].manager==="shared")biggestShowdownWin={manager:"shared",margin:biggestShowdownWin.margin,showdownRef:null};
    // r87 career fixes (A-05): the coverage line counts finished Showdowns only. The live (or completion-pending) Showdown is
    // read but History never lists it, so "Showing 3 of 4" above 2 cards counted a game that is not there. The labelled
    // current-only view is that live Showdown, so it keeps counting it. The status is unchanged (the same entry leaves both).
    const live=interimLabel!==null?0:rows.filter(row=>!["completed","abandoned","unavailable"].includes(row.status)).length;
    return caFreeze({status:entries.length===0?"empty":readable<entries.length?"partial":"ready",interimLabel,coverage:{readable:readable-live,indexed:entries.length-live},managers,biggestShowdownWin,trophyRoom:trophyRoom(managers,records,false),history:{showdowns:rows}});
  }
  return Object.freeze({buildCareerModel,seasonTiebreak});
});

```


## FILE: js/sharedActiveShowdownAdapter.js (at ae3f3c473107b4156770e3448209216b553063eb)
```
(function(root,factory){
  const node=typeof module!=="undefined"&&module.exports;
  const api=factory(node?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence,node?require("./sharedCareerAnalytics.js"):root.CareerModeSharedCareerAnalytics,node?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose,node?require("./sharedFinalReconciliation.js"):root.CareerModeSharedFinalReconciliation);
  if(node)module.exports=api;else root.CareerModeSharedActiveShowdownAdapter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(History,Career,Terminal,Final){
  "use strict";
  const ROLES=Object.freeze(["playerOne","playerTwo"]),MANAGERS=Object.freeze(["daniel","nik"]);
  const COUNTERS=Object.freeze(["seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"]);
  const INPUTS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const TRANSIENT=Object.freeze(["idle","starting","joining","continuing","retrying-link","abandoning","pair-link-retry"]);
  const FAILED=Object.freeze(["signed-out","unavailable","error","save-required"]);
  const COUNTED=Object.freeze(["active","completion-pending","completed"]);
  function asdPlain(x){return Boolean(x)&&typeof x==="object"&&!Array.isArray(x);}
  // The projection is borrowed by identity. Freeze only objects this adapter owns.
  function asdFreeze(value,borrowed=null){if(value===borrowed)return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(v=>asdFreeze(v,borrowed));Object.freeze(value);}return value;}
  function manager(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
  function managerId(id){return MANAGERS.includes(id)?id:null;}
  function pairValues(a,b){return {daniel:a,nik:b};}
  const PERFECT_SEASON=15;
  function perfectSeasons(p,role){return p.seasonHistory.filter(item=>item?.[role]?.scoring?.total===PERFECT_SEASON).length;}
  function finalFor(p){const playerOne=p.managerRecords.playerOne.totalPoints,playerTwo=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne,playerTwo},winner:playerOne>playerTwo?"playerOne":playerTwo>playerOne?"playerTwo":"draw"};}
  function inspect(snapshot){
    const s=asdPlain(snapshot)?snapshot:{},pair=asdPlain(s.pair)?s.pair:null,identity=asdPlain(s.identity)?s.identity:null;
    const close=asdPlain(s.terminalClose)?s.terminalClose:null;
    const rid=typeof pair?.rivalryId==="string"?pair.rivalryId:close?.phase==="CLOSED"&&typeof close.rivalryId==="string"?close.rivalryId:null;
    const viewer=identity?.status==="ready"&&managerId(identity.managerId)||managerId(pair?.managerId);
    const multi=asdPlain(s.multiSeason)&&s.multiSeason.ok===true&&s.multiSeason.authoritative===true&&s.multiSeason.rivalryId===rid&&asdPlain(s.multiSeason.state)?s.multiSeason:null;
    const history=asdPlain(s.history)&&s.history.rivalryId===rid?s.history:null;
    let p=null,invalid=false,witness=null,zero=false,fromProgression=false,historyAhead=false;
    if(history){
      try{
        if(history.ok!==true||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED")throw new Error("HISTORY_NOT_AUTHORITATIVE");
        const candidate=History.verifyProjection(history.projection);
        if(candidate.rivalryId!==rid)throw new Error("HISTORY_RIVALRY_MISMATCH");
        historyAhead=Boolean(multi&&candidate.acceptedSeasons>multi.state.acceptedSeasons);
        if(!multi||candidate.acceptedSeasons===multi.state.acceptedSeasons){
          if(multi&&(candidate.acceptedRevisionKey!==multi.state.acceptedRevisionKey||candidate.leagueId!==multi.state.leagueId||candidate.totalSeasons!==multi.state.totalSeasons||candidate.managerRecords.playerOne.club!==multi.state.fixedClubs?.playerOne||candidate.managerRecords.playerTwo.club!==multi.state.fixedClubs?.playerTwo))throw new Error("HISTORY_AUTHORITY_MISMATCH");
          p=candidate;
        }
      }catch(_error){invalid=true;}
    }
    // Progression already read the accepted commits, even when the History screen
    // cache is absent or lags. Reuse that verified projection without another read.
    // Only when History is absent or behind: a newer History waits for progression to catch up.
    if(!p&&!invalid&&!historyAhead&&multi?.projection){
      try{
        const candidate=History.verifyProjection(multi.projection);
        if(candidate.rivalryId!==rid||candidate.acceptedSeasons!==multi.state.acceptedSeasons||candidate.acceptedRevisionKey!==multi.state.acceptedRevisionKey||candidate.leagueId!==multi.state.leagueId||candidate.totalSeasons!==multi.state.totalSeasons||candidate.managerRecords.playerOne.club!==multi.state.fixedClubs?.playerOne||candidate.managerRecords.playerTwo.club!==multi.state.fixedClubs?.playerTwo)throw new Error("HISTORY_AUTHORITY_MISMATCH");
        p=candidate;fromProgression=true;
      }catch(_error){invalid=true;}
    }
    let classification;
    if(close?.phase==="CLOSED"&&close.rivalryId===rid){
      try{
        if(close.terminal!==true||invalid)throw new Error("CLOSE_INVALID");
        witness=Terminal.verifyIntent(close.terminalWitness);
        if(witness.rivalryId!==rid||(p&&(p.acceptedSeasons!==witness.totalSeasons||p.totalSeasons!==witness.totalSeasons||p.managerRecords.playerOne.totalPoints!==witness.managerTotals.playerOne||p.managerRecords.playerTwo.totalPoints!==witness.managerTotals.playerTwo)))throw new Error("CLOSE_AUTHORITY_MISMATCH");
        classification="completed";
      }catch(_error){witness=null;classification="unavailable";}
    }else if(!pair||pair.initialized!==true||TRANSIENT.includes(pair.status))classification="loading";
    else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&pair.managerId!=null&&identity.managerId!==pair.managerId))classification="unavailable";
    else if(pair.rivalryId!=null&&typeof pair.rivalryId!=="string")classification="unavailable";
    else if(pair.status==="unpaired"||rid===null)classification="none";
    else if(pair.connectionState==="pending-pair")classification="pending";
    else if(pair.connectionState==="closed")classification="abandoned";
    else if(pair.connectionState!=="active")classification="unavailable";
    else if(invalid)classification="unavailable";
    else if(p&&p.acceptedSeasons===p.totalSeasons&&(!multi||multi.phase==="SHOWDOWN_COMPLETE")){
      classification="completion-pending";
      const final=s.finalReconciliation;
      if(asdPlain(final)&&final.rivalryId===rid&&final.phase==="FINAL_SEASON_RECONCILED"){
        try{
          const verified=Final.verifyProjection(final),expected=finalFor(p);
          if(verified.acceptedRevisionKey!==p.acceptedRevisionKey||verified.managerTotals.playerOne!==expected.totals.playerOne||verified.managerTotals.playerTwo!==expected.totals.playerTwo||verified.winner!==expected.winner)throw new Error("FINAL_AUTHORITY_MISMATCH");
        }catch(_error){classification="unavailable";}
      }
    }else if(p)classification="active";
    else if(!history&&multi?.state.acceptedSeasons===0){classification="active";zero=true;}
    else classification="loading";
    return {s,pair,rid,viewer,multi,p,witness,classification,zero,fromProgression};
  }
  function home(c){
    const {pair,viewer,multi,p,classification,zero}=c;
    // A closed rivalry is no live pair (live pairReadPairLink returns null for it, so Home offers a fresh start).
    const state=pair?.connectionState==="closed"?"unpaired":["paired","waiting","recovery-required","unpaired"].includes(pair?.status)?pair.status:null;
    const m=["paired","recovery-required"].includes(state)?multi?.state:null;
    const text=x=>typeof x==="string"?x:null,num=x=>Number.isInteger(x)?x:null;
    return {status:classification==="loading"?"loading":classification==="unavailable"?"unavailable":"ready",viewerRole:viewer,continue:{state,leagueId:text(m?.leagueId),clubs:m&&typeof m.fixedClubs?.playerOne==="string"&&typeof m.fixedClubs?.playerTwo==="string"?pairValues(m.fixedClubs.playerOne,m.fixedClubs.playerTwo):null,season:num(m?.activeSeason??(m?.terminal?m.totalSeasons:null)),totalSeasons:num(m?.totalSeasons),score:COUNTED.includes(classification)&&p?pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints):zero?pairValues(0,0):null}};
  }
  function rivalry(c){
    const {classification,p,multi,zero}=c;
    const ready=COUNTED.includes(classification)&&p,empty=["none","pending","abandoned"].includes(classification)||zero;
    const status=ready?"ready":empty?"empty":classification==="loading"?"loading":"unavailable";
    const v={status,leagueId:null,clubs:null,season:null,totalSeasons:null,score:null,managers:null,seasons:[],transfers:{status:"unavailable"}};
    if(ready){
      v.leagueId=p.leagueId;v.clubs=pairValues(p.managerRecords.playerOne.club,p.managerRecords.playerTwo.club);v.totalSeasons=p.totalSeasons;
      v.season=classification==="completed"||p.acceptedSeasons===p.totalSeasons?p.totalSeasons:multi?.state.activeSeason??p.acceptedSeasons+1;
      v.score=pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints);
      // r87 (Nik 2026-11-01): a perfect season is 15. The History projection still counts 11 or more (its records are
      // rebuilt and compared byte for byte, and older Firebase summaries hold them), so this view counts the 15s itself.
      v.managers=Object.fromEntries(ROLES.map((role,i)=>[MANAGERS[i],Object.fromEntries(COUNTERS.map(key=>[key,key==="perfectSeasons"?perfectSeasons(p,role):p.managerRecords[role][key]]))]));
      v.seasons=p.seasonHistory.map(item=>({season:item.roundNumber,score:pairValues(item.playerOne.scoring.total,item.playerTwo.scoring.total),winner:manager(item.winner),leaguePosition:pairValues(item.playerOne.leaguePosition,item.playerTwo.leaguePosition),leaguePoints:pairValues(item.playerOne.leaguePoints,item.playerTwo.leaguePoints),leagueGoals:pairValues(item.playerOne.leagueGoals,item.playerTwo.leagueGoals)}));
    }else if(empty){
      v.managers=Object.fromEntries(MANAGERS.map(id=>[id,Object.fromEntries(COUNTERS.map(key=>[key,key==="bestSeasonScore"?null:0]))]));
      if(zero){const m=multi.state;v.leagueId=typeof m.leagueId==="string"?m.leagueId:null;v.clubs=typeof m.fixedClubs?.playerOne==="string"&&typeof m.fixedClubs?.playerTwo==="string"?pairValues(m.fixedClubs.playerOne,m.fixedClubs.playerTwo):null;v.season=Number.isInteger(m.activeSeason)?m.activeSeason:null;v.totalSeasons=Number.isInteger(m.totalSeasons)?m.totalSeasons:null;v.score=pairValues(0,0);}
    }
    return v;
  }
  function inputs(result){
    if(!asdPlain(result))return null;
    if(INPUTS.slice(0,3).some(key=>!Number.isInteger(result[key]))||INPUTS.slice(3).some(key=>typeof result[key]!=="boolean"))return null;
    // r80 Europa League: the stored result carries europaLeague only when that manager won it; this view (never hashed) always shows it.
    return {...Object.fromEntries(INPUTS.map(key=>[key,result[key]])),europaLeague:result.europaLeague===true};
  }
  function breakdown(result){const s=result.scoring;return {championsLeague:s.championsLeague,europaLeague:s.europaLeague||0,leagueTitle:s.leagueTitle,domesticCup:s.domesticCup,performanceBonus:s.performanceBonus,awardsBonus:s.individualAwardsBonus,total:s.total};}
  function results(c,options){
    const source=asdPlain(c.s.seasonResults)&&c.s.seasonResults.rivalryId===c.rid?c.s.seasonResults:null;
    const requested=asdPlain(options)?options.season:null;
    const season=requested??source?.seasonNumber??c.multi?.state.activeSeason??null;
    const v={status:"loading",season:Number.isInteger(season)?season:null,phase:null,viewerRole:c.viewer,inputs:{daniel:null,nik:null},breakdown:null,winner:null,tiebreak:null};
    const role=c.pair?.managerRole;
    if(c.classification==="unavailable"||(source&&(!ROLES.includes(role)||source.managerRole!==role))){return {status:"unavailable",season:null,phase:null,viewerRole:null,inputs:null,breakdown:null,winner:null,tiebreak:null};}
    if(!COUNTED.includes(c.classification)&&c.classification!=="loading")return v;
    if(c.classification==="loading"&&c.pair?.connectionState!=="active")return v;
    const committed=c.p?.seasonHistory.find(item=>item.roundNumber===season);
    if(committed){v.phase="committed";v.inputs=pairValues(inputs(committed.playerOne),inputs(committed.playerTwo));v.breakdown=pairValues(breakdown(committed.playerOne),breakdown(committed.playerTwo));v.winner=manager(committed.winner);v.tiebreak=Career.seasonTiebreak(committed);}
    else if(source&&source.seasonNumber===season&&source.ok===true&&ROLES.includes(role)){
      const state=source.state;
      if(state?.phase==="RESULTS_READY"&&inputs(source.allResults?.playerOne)&&inputs(source.allResults?.playerTwo)){
        v.phase="results-ready";v.inputs=pairValues(inputs(source.allResults.playerOne),inputs(source.allResults.playerTwo));
      }else if(state?.phase==="COLLECTING"&&Array.isArray(state.publishedRoles)&&state.publishedRoles.includes(role)){
        v.phase="waiting-for-rival";v.inputs[manager(role)]=inputs(source.ownResult);
      }else v.phase="entering";
    }
    if(v.phase)v.status="ready";
    return v;
  }
  function winner(c){
    const {classification,p,witness}=c;
    const v={status:["none","pending","active","abandoned"].includes(classification)?"empty":classification==="loading"?"loading":"unavailable",state:null,totals:null,winner:null,margin:null,seasonsPlayed:null,trophies:null};
    if(!["completion-pending","completed"].includes(classification))return v;
    const totals=classification==="completed"?witness.managerTotals:finalFor(p).totals;
    v.status=p?"ready":"partial";v.state=classification;v.totals=pairValues(totals.playerOne,totals.playerTwo);v.winner=totals.playerOne>totals.playerTwo?"daniel":totals.playerTwo>totals.playerOne?"nik":"draw";v.margin=Math.abs(totals.playerOne-totals.playerTwo);v.seasonsPlayed=p?p.acceptedSeasons:witness.totalSeasons;
    if(p)v.trophies=Object.fromEntries(ROLES.map((role,i)=>{const r=p.managerRecords[role];return [MANAGERS[i],{championsLeague:r.championsLeagues,europaLeague:r.europaLeagues,leagueTitles:r.leagueTitles,domesticCups:r.domesticCups,total:r.totalTrophies}];}));
    return v;
  }
  function career(c){
    // The progression fallback feeds live standings only. Career screens see what r75 saw
    // without it: no projection, so a live Showdown stays loading and other states keep theirs.
    if(c.fromProgression)c={...c,p:null,classification:["active","completion-pending"].includes(c.classification)?"loading":c.classification};
    const {classification,rid,p,zero}=c;
    const indexStatus=["loading","unavailable"].includes(classification)?classification:"ready",showdowns=[];
    if(indexStatus==="ready"&&classification!=="none"&&!zero){
      if(classification==="completed"&&!p)showdowns.push({rivalryId:rid,classification:"unavailable",projection:null,final:null});
      else showdowns.push({rivalryId:rid,classification,projection:COUNTED.includes(classification)?p:null,final:["completion-pending","completed"].includes(classification)?finalFor(p):null});
    }
    // Keep the current identity even when its projection has not loaded, so career
    // history can isolate that uncertainty from other indexed Showdowns.
    return {indexStatus,showdowns,currentShowdownOnly:true,...(indexStatus!=="ready"&&rid?{currentRivalryId:rid}:{})};
  }
  function fallback(){return {s:{},pair:null,rid:null,viewer:null,multi:null,p:null,witness:null,classification:"unavailable",zero:false};}
  function asdContext(s){try{return inspect(s);}catch(_error){return fallback();}}
  function buildActiveShowdownViews(s){const c=asdContext(s);try{return asdFreeze({classification:c.classification,home:home(c),rivalry:rivalry(c),seasonResults:results(c),finalWinner:winner(c),careerInput:career(c)},c.p);}catch(_error){const f=fallback();return asdFreeze({classification:f.classification,home:home(f),rivalry:rivalry(f),seasonResults:results(f),finalWinner:winner(f),careerInput:career(f)});}}
  function classifyCurrentShowdown(s){return asdContext(s).classification;}
  function homeView(s){return buildActiveShowdownViews(s).home;}
  function rivalryView(s){return buildActiveShowdownViews(s).rivalry;}
  function finalWinnerView(s){return buildActiveShowdownViews(s).finalWinner;}
  function careerInput(s){return buildActiveShowdownViews(s).careerInput;}
  function seasonResultsView(s,options={}){const c=asdContext(s);try{return asdFreeze(results(c,options));}catch(_error){return asdFreeze(results(fallback()));}}
  return Object.freeze({buildActiveShowdownViews,classifyCurrentShowdown,homeView,rivalryView,seasonResultsView,finalWinnerView,careerInput});
});

```


## FILE: js/careerScreenSeam.js (at ae3f3c473107b4156770e3448209216b553063eb)
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerScreenSeam=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const SCREENS=["careerStatistics","trophyRoom","legacy","rivalryStatistics"];
  const STATUSES=["loading","empty","unavailable","partial","ready"];
  const TEXT={
    loading:"Loading career history.",
    unavailable:"Career history is unavailable right now. Nothing is lost. Try again when you are reconnected.",
    partial:"Showing {readable} of {indexed} Showdowns. Some Showdowns could not be read, so these are not complete career totals.",
    empty:{
      careerStatistics:"Career Statistics appear after your first completed Showdown. Stats for the current Showdown are on Showdown Home.",
      trophyRoom:"The Trophy Room is empty. Finish a Showdown and its trophies and records appear here.",
      legacy:"No completed Showdowns yet. Finish one and it appears here.",
      rivalryStatistics:"No season completed yet. Stats appear as seasons finish."
    },
    historyStatus:{completed:"Completed","in-progress":"In progress","completion-pending":"Final result, completion pending",abandoned:"Ended early",unavailable:"Unavailable"},
    winner:{daniel:"Daniel won",nik:"Nik won",draw:"Draw"}
  };
  const csNames={daniel:"Daniel",nik:"Nik",shared:"LEVEL"};
  const csCareerFields=[["Career points","careerPoints"],["Seasons played","seasons"],["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"]];
  const csShowdownFields=[["Showdowns completed","completed"],["Showdown wins","wins"],["Showdown draws","draws"],["Showdown losses","losses"]];
  const csRecordFields=[["Best season score","bestSeasonScore"],["Best league points","bestLeaguePoints"],["Best league goals","bestLeagueGoals"],["Best league position","bestLeaguePosition"],["Average season score","averageSeasonScore"],["Average league points","averageLeaguePoints"],["Average league goals","averageLeagueGoals"],["Perfect seasons","perfectSeasons"],["100-point seasons","hundredPointSeasons"],["100-goal seasons","hundredGoalSeasons"],["Top scorer seasons","topScorerSeasons"],["Top assist seasons","topAssistSeasons"],["Performance bonuses","performanceBonuses"],["Awards bonuses","awardsBonuses"]];
  const csCabinetFields=[["Champions Leagues","championsLeagues"],["Europa Leagues","europaLeagues"],["League titles","leagueTitles"],["Domestic cups","domesticCups"],["Total trophies","totalTrophies"]];
  const csRivalryFields=[["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"],...csCabinetFields,["Perfect seasons","perfectSeasons"],["Best season score","bestSeasonScore"]];

  function csFreeze(value){
    if(value&&typeof value==="object"&&!Object.isFrozen(value)){
      Object.values(value).forEach(csFreeze);Object.freeze(value);
    }
    return value;
  }
  function normalizeRenderRequest(arg){
    if(arg===undefined||arg===null||arg===false)return Object.freeze({force:false,hasModel:false,model:null});
    if(arg===true)return Object.freeze({force:true,hasModel:false,model:null});
    if(typeof arg!=="object"||Array.isArray(arg))throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
    const proto=Object.getPrototypeOf(arg);
    if(proto!==null&&Object.getPrototypeOf(proto)!==null)throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
    return Object.freeze({force:arg.force===true,hasModel:Object.prototype.hasOwnProperty.call(arg,"model"),model:arg.model??null});
  }
  function isOnlineCareerRoute(identityState){
    return Boolean(identityState&&identityState.registered===true&&["daniel","nik"].includes(identityState.managerId));
  }
  // The game is online only, so every career screen is Team V's (r61): with no model it shows the unavailable state,
  // signed in or not. The old local page runs only when Legacy's data tools (backup, restore, reset) are asked for.
  function selectCareerScreenSource({identityState,model,dataTools=false}){
    if(model!==undefined&&model!==null)return model&&STATUSES.includes(model.status)?"model":"unavailable";
    return dataTools===true?"local":"unavailable";
  }
  // r80 Ended early row: "Ended early · 18 Oct 2026 · 1 season"; an unknown date or count (closes before the mark) is a dash.
  // r87 career fixes (A-04): the date is the UTC day, so Daniel's and Nik's phones print the same date in any time zone.
  function endedEarlyText(row){
    const at=row&&Number.isFinite(row.endedAt)&&row.endedAt>0?new Date(row.endedAt):null,played=row&&Number.isInteger(row.seasonsPlayed)?row.seasonsPlayed:null;
    let date="-";if(at){try{date=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(at);}catch(_error){date="-";}}
    return TEXT.historyStatus.abandoned+" · "+date+" · "+(played===null?"- seasons":played+(played===1?" season":" seasons"));
  }
  // r84 Golden Showdown (Nik): a manager who scores the most a season can score in every season of a finished 10-season
  // Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An ended-early, unfinished or
  // shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so its
  // Golden Showdown is 150 in every Showdown (Nik 2026-11-01: no 11 or 110 anywhere). PRIME_PACK_FROM_MS is
  // js/iconGuess.js fromMs (the Roster Roulette boundary; tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:150,primePackPoints:150});
  const SEASON_MAX=Object.freeze({primePack:15});
  const PRIME_PACK_FROM_MS=Date.parse("2026-11-01T17:00:00Z");
  const PAIR_ID=/^pair_[0-9a-f]{64}$/;
  function csSeasonScores(row){
    const out=[];
    for(const season of Array.isArray(row&&row.seasons)?row.seasons:[]){const score=season&&season.score;if(score)for(const key of ["daniel","nik","playerOne","playerTwo"])if(Number.isInteger(score[key]))out.push(score[key]);}
    return out;
  }
  function csLiveSetup(){try{const state=root.CareerModeProductionSharedShowdownSetup?.getState?.();return state&&state.ready===true&&state.setup?.phase==="SHOWDOWN_CONFIRMED"&&PAIR_ID.test(String(state.rivalryId))&&Number.isFinite(state.setupUpdatedAtMs)?state:null;}catch(_error){return null;}}
  // The most one season of this Showdown can score: 15 with Prime Pack, 11 before. Known from the Showdown's confirm time;
  // without one, a season over 11 can only be Prime Pack, and the live Showdown's Setup (when it is this Showdown) decides.
  // Nik 2026-11-01 18:32 UTC: there is no 11 anywhere. A season is worth at most 15 in every Showdown (one max for the
  // race maths, perfect seasons and Golden); a Showdown from before 2.0.0 is not kept on its own scale.
  function seasonMaxFor(_row){return SEASON_MAX.primePack;}
  // Nik 2026-11-01 17:35 UTC: there was never a real 10-season Showdown before Prime Pack, so no old record to keep. The
  // Golden Showdown is 150 in every Showdown (seasonMaxFor still gives the race maths each Showdown's own season maximum).
  function goldenShowdownPoints(_row){return GOLDEN_SHOWDOWN.primePackPoints;}
  function goldenShowdownManagers(row){
    if(!row||row.status!=="completed"||row.totalSeasons!==GOLDEN_SHOWDOWN.seasons||row.seasonsPlayed!==GOLDEN_SHOWDOWN.seasons||!row.totals)return [];
    const points=goldenShowdownPoints(row);
    return ["daniel","nik"].filter(manager=>Number.isInteger(row.totals[manager])&&row.totals[manager]>=points);
  }
  function goldenShowdownCounts(rows){
    const counts={daniel:0,nik:0};
    for(const row of Array.isArray(rows)?rows:[])for(const manager of goldenShowdownManagers(row))counts[manager]+=1;
    return counts;
  }
  function csNumber(value){return value===null?"-":Number.isInteger(value)?String(value):value.toFixed(1);}
  function csNumeric(value){return value===null||typeof value==="number"&&Number.isFinite(value);}
  function csFieldsValid(fields,record){return Boolean(record&&fields.every(([,key])=>csNumeric(record[key])));}
  function csModelValid(model){
    if(!model||typeof model!=="object"||!STATUSES.includes(model.status))return false;
    if(model.status!=="ready"&&model.status!=="partial")return true;
    const managers=model.managers,room=model.trophyRoom,history=model.history;
    if(!managers||!room||!history||!Array.isArray(history.showdowns))return false;
    for(const manager of ["daniel","nik"]){
      const record=managers[manager];
      if(!csFieldsValid([...csCareerFields,...csRecordFields,...csCabinetFields],record)||!csFieldsValid(csShowdownFields,record.showdowns)||!csFieldsValid(csCabinetFields,room.cabinet?.[manager]))return false;
    }
    if(!Array.isArray(room.standings)||!Array.isArray(room.records))return false;
    if(!room.standings.every(row=>row&&["daniel","nik"].includes(row.manager)&&csNumeric(row.careerPoints)&&csNumeric(row.seasonWins)))return false;
    if(!room.records.every(row=>row&&typeof row.label==="string"&&["daniel","nik","shared"].includes(row.manager)&&csNumeric(row.value)))return false;
    if(!history.showdowns.every(row=>row&&Number.isInteger(row.number)&&Object.prototype.hasOwnProperty.call(TEXT.historyStatus,row.status)&&Array.isArray(row.seasons)&&(row.status==="abandoned"||row.status==="unavailable"||((!row.totals||csNumeric(row.totals.daniel)&&csNumeric(row.totals.nik))&&row.seasons.every(season=>season&&Number.isInteger(season.season)&&season.score&&csNumeric(season.score.daniel)&&csNumeric(season.score.nik))))))return false;
    return model.status!=="partial"||Boolean(model.coverage&&Number.isInteger(model.coverage.readable)&&Number.isInteger(model.coverage.indexed));
  }
  function csCompare(fields,records){
    return fields.map(([label,key])=>({label,daniel:csNumber(records.daniel[key]),nik:csNumber(records.nik[key])}));
  }
  function csCareerSections(model){
    const win=model.biggestShowdownWin;
    const value=win&&csNames[win.manager]&&csNumeric(win.margin)?csNames[win.manager]+(win.manager==="shared"?" · ":" by ")+csNumber(win.margin):"-";
    return [
      {heading:"CAREER TABLE",rows:[...csCompare(csCareerFields,model.managers),...csCompare(csShowdownFields,{daniel:model.managers.daniel.showdowns,nik:model.managers.nik.showdowns}),{label:"Biggest Showdown win",value}]},
      {heading:"SEASON RECORDS",rows:csCompare(csRecordFields,model.managers)}
    ];
  }
  function csTrophySections(model){
    const room=model.trophyRoom;
    return [
      {heading:"MANAGER CABINETS",rows:csCompare(csCabinetFields,room.cabinet)},
      {heading:"CAREER TABLE",rows:room.standings.map((row,index)=>({label:(row.level?1:index+1)+". "+csNames[row.manager]+(row.level?" (level)":""),value:csNumber(row.careerPoints)+" points, "+csNumber(row.seasonWins)+" season wins"}))},
      {heading:"ALL-TIME RECORDS",rows:room.records.map(row=>({label:row.label,value:row.value===null?"-":csNames[row.manager]+" · "+csNumber(row.value)}))}
    ];
  }
  function csLegacySections(model){
    return [{heading:"SHOWDOWNS",rows:model.history.showdowns.map(row=>{
      let value=row.status==="abandoned"?endedEarlyText(row):TEXT.historyStatus[row.status];
      if(row.status!=="abandoned"&&row.status!=="unavailable"){
        if(row.totals)value+=" · Daniel "+csNumber(row.totals.daniel)+" - Nik "+csNumber(row.totals.nik);
        if(Object.prototype.hasOwnProperty.call(TEXT.winner,row.winner))value+=" · "+TEXT.winner[row.winner];
      }
      return {label:"SHOWDOWN "+row.number,value};
    })}];
  }
  function csRivalrySections(model){
    const row=model.history.showdowns[0],totals=row.totals||{daniel:null,nik:null};
    return [
      {heading:"HEAD TO HEAD",rows:[{label:"Showdown points",daniel:csNumber(totals.daniel),nik:csNumber(totals.nik)},...csCompare(csRivalryFields,model.managers)]},
      {heading:"SEASONS",rows:row.seasons.map(season=>({label:"Season "+season.season,daniel:csNumber(season.score.daniel),nik:csNumber(season.score.nik)}))}
    ];
  }
  function careerScreenView(screen,model){
    if(!SCREENS.includes(screen))throw new TypeError("CAREER_SCREEN_UNKNOWN");
    let status=csModelValid(model)?model.status:"unavailable";
    if(screen==="rivalryStatistics"&&["ready","partial"].includes(status)&&model.history.showdowns.length!==1)status="unavailable";
    const interimLabel=status!=="unavailable"&&typeof model.interimLabel==="string"?model.interimLabel:null;
    let message=null,sections=[];
    if(status==="loading")message=TEXT.loading;
    else if(status==="unavailable")message=TEXT.unavailable;
    else if(status==="empty")message=TEXT.empty[screen];
    else{
      if(status==="partial")message=TEXT.partial.replace("{readable}",String(model.coverage.readable)).replace("{indexed}",String(model.coverage.indexed));
      sections=screen==="careerStatistics"?csCareerSections(model):screen==="trophyRoom"?csTrophySections(model):screen==="legacy"?csLegacySections(model):csRivalrySections(model);
    }
    return csFreeze({screen,status,message,interimLabel,sections});
  }
  function csElement(doc,tag,className,text){
    const node=doc.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function paintCareerScreenView(doc,view){
    const fragment=doc.createDocumentFragment(),root=csElement(doc,"div","careerScreenView");
    root.setAttribute("data-career-screen",view.screen);root.setAttribute("data-career-status",view.status);
    if(view.interimLabel)root.appendChild(csElement(doc,"p","careerScreenInterim",view.interimLabel));
    if(view.message){
      const message=csElement(doc,"div","analyticsEmpty",view.message);message.setAttribute("role","status");root.appendChild(message);
    }
    for(const section of view.sections){
      root.appendChild(csElement(doc,"h3","analyticsSectionHeading",section.heading));
      const holder=csElement(doc,"div","careerScreenSection");
      if(section.rows.some(row=>Object.prototype.hasOwnProperty.call(row,"daniel"))){
        const names=csElement(doc,"div","comparisonRow careerScreenNames");
        names.append(csElement(doc,"strong","","DANIEL"),csElement(doc,"span","",""),csElement(doc,"strong","","NIK"));holder.appendChild(names);
      }
      for(const row of section.rows){
        if(Object.prototype.hasOwnProperty.call(row,"daniel")){
          const comparison=csElement(doc,"div","comparisonRow");
          comparison.append(csElement(doc,"strong","",row.daniel),csElement(doc,"span","",row.label),csElement(doc,"strong","",row.nik));holder.appendChild(comparison);
        }else{
          const single=csElement(doc,"div","careerScreenRow");
          single.append(csElement(doc,"span","",row.label),csElement(doc,"strong","",row.value));holder.appendChild(single);
        }
      }
      root.appendChild(holder);
    }
    fragment.appendChild(root);return fragment;
  }
  return csFreeze({contractVersion:1,SCREENS,STATUSES,TEXT,GOLDEN_SHOWDOWN,SEASON_MAX,PRIME_PACK_FROM_MS,seasonMaxFor,goldenShowdownPoints,endedEarlyText,goldenShowdownManagers,goldenShowdownCounts,normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
});

```


## FILE: END SHOWDOWN path excerpts at ae3f3c47 (settings, pair, terminal close, reconnect; grep -B8 -A14)
```text
### js/settings.js
41-        return loadLegacyShowdowns();
42-    }catch(error){
43-        return [];
44-    }
45-}
46-
47-/* CE2PG (r80): online, the local save outlives its Showdown (it still reads "Created" after the Final Winner, or after the
48-   other phone ended it) and the local history list is never written. Home's LIVE tile reads the pair state, so Settings
49:   reads it too: CURRENT SHOWDOWN and END SHOWDOWN only while the pair holds a live (active or waiting) Showdown. With no
50-   pair state yet (module not loaded or not initialized) the local save decides, as before. */
51-function getSettingsPairState(){
52-    try{
53-        const pair = window.CareerModePersistentNikDanielPair;
54-        const pairState = pair && typeof pair.getState === "function" ? pair.getState() : null;
55-        // Codex #935: a transient "unavailable" (or idle/signed-out) pair state is unknown, as in js/whichShowdownIsLive.js, so
56:        // the local save decides; only an authoritative pair state can hide the current Showdown and its END SHOWDOWN.
57-        return pairState && pairState.initialized === true && !["idle", "unavailable", "signed-out"].includes(pairState.status) ? pairState : null;
58-    }catch(_error){
59-        return null;
60-    }
61-}
62-
63-function getSettingsLiveShowdown(){
64-    const active = getSettingsActiveShowdown();
65-    if(!active){ return null; }
66-    const pairState = getSettingsPairState();
67-    if(!pairState){ return { showdown: active, status: active.status || "Saved" }; }
68-    if(!pairState.rivalryId){ return null; }
69-    if(pairState.connectionState === "active"){ return { showdown: active, status: "Live" }; }
70-    if(pairState.connectionState === "pending-pair"){ return { showdown: active, status: "Waiting to join" }; }
--
663-    const pair = window.CareerModePersistentNikDanielPair;
664-    if(!pair || typeof pair.initialize !== "function" || typeof pair.getState !== "function"){
665-        throw new Error("The Showdown connection service is unavailable.");
666-    }
667-    await pair.initialize({ force: true });
668-    return pair;
669-}
670-
671:/* r80 END SHOWDOWN: the seasons count is read at END time from the accepted Shared Season Commits of this exact rivalry
672-   (rivalries/{id}/seasonCommits/season_N, ACKNOWLEDGED revision 3): the same documents and the same accepted-prefix rule
673-   the multi-season progression counts from. Both paired players may read them without the private session, so the count
674-   is the same on a fresh browser that opened Settings before CONTINUE (no Shared Setup state, no session) as in the game.
675-   One read-only transaction (no write; the budget layer ends it without a commit), straight from the server, stopping at
676-   the first season not yet accepted: accepted + 1 document reads at most (11). No season commit at all is 0 seasons (the
677-   league wheel). resumeFromAuthority() is not used: it also moves the season cursor. Unknown (offline, the
678-   read denied or a malformed commit) is null: END still closes and History shows a dash. */
679-const SETTINGS_SEASONS_READ_MS = 10000;
680-const SETTINGS_SEASONS_MAX = 10;
681-async function readSettingsAcceptedSeasonCount(rivalryId){
682-    const runtime = window.CareerModeProductionFirebaseRuntime;
683-    if(!runtime || typeof runtime.ensureAccountServices !== "function"){ return null; }
684-    const budget = window.CareerModeFirestoreBudget;
685-    const services = (budget && typeof budget.services === "function" ? budget.services : value => value)(await runtime.ensureAccountServices());
--
743-        // Codex #937: only a refresh that read the pair link ("paired" or "unpaired") may end locally; an outage or error
744-        // state must not turn END for both players into a local-only delete.
745-        if(!pairState || !["paired", "unpaired"].includes(pairState.status)){
746-            throw new Error("The online Showdown could not be checked, so nothing was changed. Try again.");
747-        }
748-        return { ok: true, status: "unpaired" };
749-    }
750-
751:    if(typeof pair.abandonCurrentShowdown !== "function"){
752-        throw new Error("Safe Showdown restart is unavailable in this build.");
753-    }
754-
755-    const rivalryId = expectedRivalryId || pairState.rivalryId;
756-    // Codex #933: a code Nik has not joined yet (pending-pair) has no season commits, and the Rules deny reading them before
757-    // ACTIVE, so its count is 0 without a read (a denied read would record "-" seasons).
758-    const waiting = pairState && pairState.rivalryId === rivalryId && pairState.connectionState === "pending-pair";
759-    const seasonsPlayed = waiting ? 0 : await readSettingsSeasonsPlayed(rivalryId);
760-    // A rivalry already closed (the other phone ended it, or a retry after this one landed) answers "already-closed": success.
761:    const result = await pair.abandonCurrentShowdown({
762-        expectedRivalryId: rivalryId,
763-        expectedSaveId,
764-        seasonsPlayed
765-    });
766-    if(!result || result.ok !== true){
767-        throw new Error("The online Showdown was not ended, so nothing was changed.");
768-    }
769-    return { ...result, endedRivalryId: rivalryId };
770-}
771-
772-// After END has closed the Showdown here too, its private session leaves page memory, as it does on the other phone
773-// (Terminal Close). Only that rivalry's session; a later Showdown's session is never touched.
774-function forgetSettingsEndedSession(rivalryId){
775-    const remote = window.CareerModeSparkRemoteJoining;
--
866-            || (!confirmedSaveId && confirmedLocalId !== authoritativeLocalId)
867-        ){
868-            throw new Error("The active Showdown changed after you confirmed. Nothing was ended. Review the current Showdown and confirm again.");
869-        }
870-
871-        const released = await releaseSettingsCurrentShowdownConnection(authoritative);
872-
873-        if(!runtime.clearActiveShowdown()){
874:            throw new Error("The Showdown was ended, but it could not be closed here. Tap END SHOWDOWN again; nothing new will be created.");
875-        }
876-
877-        await sweepSettingsShowdownDrafts();
878-        finishSettingsCurrentShowdownDeletion();
879-        forgetSettingsEndedSession(released && released.endedRivalryId);
880-        if(typeof window.showAppNotice === "function"){
881-            window.showAppNotice(
882-                `Ended the "${name}" Showdown for both players. History keeps it as Ended early.`,
883-                "success",
884-                6200
885-            );
886-        }
887-        return true;
888-    }catch(error){
--
929-        historyRow
930-    );
931-
932-    const actions = createSettingsElement("div", "settingsOfflineActions settingsDataActions");
933-    if(active){
934-        const endCurrent = createSettingsElement(
935-            "button",
936-            "menuButton dangerButton settingsDeleteCurrentShowdown",
937:            "END SHOWDOWN"
938-        );
939-        endCurrent.type = "button";
940-        endCurrent.addEventListener("click", () => void endSettingsCurrentShowdown(endCurrent));
941-        actions.appendChild(endCurrent);
942-    }
943-
944-    const historyAction = createSettingsElement(
945-        "button",
946-        "menuButton settingsDataButton",
947-        "OPEN HISTORY & BACKUP"
948-    );
949-    historyAction.type = "button";
950-    historyAction.addEventListener("click", openSettingsDataManagement);
951-    actions.appendChild(historyAction);
952-
953-    const note = createSettingsElement(
954-        "p",
955-        "settingsDataNote",
956-        active
957:            ? "END SHOWDOWN ends it for both players. History keeps it as Ended early. Your player, device, history and settings stay."
958-            : "No Showdown in progress. History, backup and reset are under History & Backup."
959-    );
960-
961-    panel.append(info, actions, note);
962-    return panel;
963-}
964-
965-function renderSettings(){
966-    ensureSettingsDialog();
967-    if(!settingsContent){ return; }
968-
969-    const fragment = document.createDocumentFragment();
970-    fragment.append(
971-        createApplicationPanel(),
### js/persistentNikDanielPair.js
114-    pairSyncWaitingPoll();
115-  }
116-
117-  function pairErrorWithCode(code,message){const error=new Error(message||code);error.code=code;return error;}
118-  function pairCanonicalize(value){if(value===null||value===undefined)return value===undefined?null:value;if(value&&typeof value.toMillis==="function")return{$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(pairCanonicalize);if(typeof value==="object"){const result={};for(const key of Object.keys(value).sort())result[key]=pairCanonicalize(value[key]);return result;}return value;}
119-  function pairHexFromBytes(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
120-  async function pairSha256(value,cryptoImpl=root.crypto){if(!cryptoImpl?.subtle||typeof cryptoImpl.subtle.digest!=="function")throw pairErrorWithCode("PERSISTENT_PAIR_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");const bytes=new TextEncoder().encode(JSON.stringify(pairCanonicalize(value)));const digest=await cryptoImpl.subtle.digest("SHA-256",bytes);return`sha256:${pairHexFromBytes(new Uint8Array(digest))}`;}
121-  async function pairBuildEnvelope({objectId=PAIR_DOC_ID,revision,parentRevision,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,cryptoImpl=root.crypto}){const contentHash=await pairSha256({objectType:"pairLink",objectId,revision,data},cryptoImpl);return{schemaVersion:1,objectType:"pairLink",objectId,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt,updatedByAccountId,updatedByDeviceId,data,tombstone:null};}
122:  async function pairBuildRivalryClosureEnvelope(value,context,updatedAt,cryptoImpl=root.crypto,endedEarly=null){const rivalryId=pairNormalizeRivalryId(value?.objectId),revision=value.revision+1,data={...value.data,connectionState:"closed",...(endedEarly?{endedEarly}:{})},contentHash=await pairSha256({objectType:"rivalry",objectId:rivalryId,revision,data},cryptoImpl);return{...value,revision,parentRevision:value.revision,contentHash,priorContentHash:value.contentHash,updatedAt,updatedByAccou
123-
124-  function pairNormalizeRivalryId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!/^pair_[0-9a-f]{64}$/.test(id))throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_INVALID","This Showdown connection is invalid.");return id;}
125-  function pairNormalizeManagerRole(value){const role=typeof value==="string"?value.trim():"";if(!MANAGER_BY_ROLE[role])throw pairErrorWithCode("PERSISTENT_PAIR_ROLE_INVALID","Choose Daniel or Nik before continuing.");return role;}
126-  function pairNormalizeManagerId(value){const id=typeof value==="string"?value.trim().toLowerCase():"";if(!MANAGER_BY_ID[id])throw pairErrorWithCode("PERSISTENT_PAIR_MANAGER_INVALID","Choose Daniel or Nik before continuing.");return id;}
127-  function pairManagerForRole(role){return MANAGER_BY_ROLE[pairNormalizeManagerRole(role)];}
128-  function pairManagerForId(id){return MANAGER_BY_ID[pairNormalizeManagerId(id)];}
129-  function pairAssertCanonicalIdentity(role,managerId){const normalizedRole=pairNormalizeManagerRole(role),normalizedManagerId=pairNormalizeManagerId(managerId),expected=pairManagerForRole(normalizedRole);if(expected.id!==normalizedManagerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_MISMATCH",`${expected.label} must use ${normalizedRole==="playerOne"?"Player One":"Player Two"}.`);return expected;}
130-  function pairCurrentIdentityManagerId(){const identity=root.CareerModeOnlinePlayerIdentity?.getState?.();return identity?.managerId&&MANAGER_BY_ID[identity.managerId]?identity.managerId:null;}
131-  function pairCurrentIdentityRole(){const managerId=pairCurrentIdentityManagerId();return managerId?ROLE_BY_MANAGER[managerId]:null;}
132-  function pairRequireCurrentIdentity(role){const normalizedRole=pairNormalizeManagerRole(role),managerId=pairCurrentIdentityManagerId();if(!managerId)throw pairErrorWithCode("PERSISTENT_PAIR_IDENTITY_REQUIRED","Choose Daniel or Nik before continuing.");pairAssertCanonicalIdentity(normalizedRole,managerId);return pairManagerForRole(normalizedRole);}
133-  function pairValidSaveId(value){return typeof value==="string"&&/^save_[a-f0-9]{24}$/.test(value);}
134-  function pairValidProfileId(value){return typeof value==="string"&&/^profile_[a-f0-9]{24}$/.test(value);}
135-
136-  function pairLocalBindingForRole(pairing,role){const normalized=pairNormalizeManagerRole(role);const bindings=pairing&&typeof pairing.localBindingOptions==="function"?pairing.localBindingOptions():[];return(Array.isArray(bindings)?bindings:[]).find(binding=>binding&&binding.managerRole===normalized)||null;}
--
182-  function pairParsePairLink(value,accountId){if(!pairIsEnvelopeValue(value,"pairLink",PAIR_DOC_ID))throw pairErrorWithCode("PERSISTENT_PAIR_LINK_INVALID","The saved Showdown connection is invalid.");const data=value.data||{},role=pairNormalizeManagerRole(data.managerRole),manager=pairAssertCanonicalIdentity(role,data.managerId),rivalryId=pairNormalizeRivalryId(data.rivalryId);return{accountId,rivalryId,managerRole:role,managerId:manager.id,managerLabel:manager.label,revision:value.revision,
183-
184-  async function pairResolveContext(){const runtime=root.CareerModeProductionFirebaseRuntime,account=root.CareerModeSparkConnectedAccount,pairing=root.CareerModeSparkPrivatePairing;if(!runtime||!account||!pairing)throw pairErrorWithCode("PERSISTENT_PAIR_RUNTIME_UNAVAILABLE","The connection service is unavailable.");await account.initialize();const accountState=account.getState?.();if(!accountState?.connected||!accountState.accountId)throw pairErrorWithCode("PERSISTENT_PAIR_AUTH_REQUIRED","Si
185-  async function pairReadPairLink(context){const sdk=context.services.firestoreSdk,ref=pairLinkReference(context);pairLastClosedRivalryId=null;pairLastClosedProviderSaveId=null;return sdk.runTransaction(context.services.firestore,async transaction=>{pairLastClosedRivalryId=null;pairLastClosedProviderSaveId=null;const pairSnapshot=await transaction.get(ref);if(!pairSnapshot.exists())return null;const link=pairParsePairLink(pairSnapshot.data(),context.accountId),rivalrySnapshot=await transacti
186-  async function pairPersistPairLink(context,rivalryId,managerRole){const sdk=context.services.firestoreSdk,role=pairNormalizeManagerRole(managerRole),manager=pairRequireCurrentIdentity(role),normalizedRivalryId=pairNormalizeRivalryId(rivalryId),pairRef=pairLinkReference(context),rivalryRef=pairRivalryReference(context,normalizedRivalryId),deviceRef=pairDeviceReference(context),now=sdk.Timestamp.fromMillis(Date.now());return sdk.runTransaction(context.services.firestore,async transaction=>{c
187-  const PAIR_LINK_RETRY_WAIT_MS=750;
188-  async function pairPersistPairLinkWithRetry(context,rivalryId,managerRole,attempts=2){let lastError=null;const total=Math.max(1,Number.isInteger(attempts)?attempts:2);for(let attempt=0;attempt<total;attempt+=1){try{return await pairPersistPairLink(context,rivalryId,managerRole);}catch(error){lastError=error;/* r87 Fable F3-10: a refusal (permission-denied, a product error) is final; only a dropped connection is tried again, after a short wait */if(!PAIR_AMBIGUOUS_PROVIDER_CODES.has(pairPro
189-
190:  async function pairAbandonCurrentShowdown(options={}){
191-    if(state.busy)throw pairErrorWithCode("PERSISTENT_PAIR_BUSY","The current Showdown connection is busy. Try again when the current action finishes.");
192-    const expectedRivalryId=options.expectedRivalryId?pairNormalizeRivalryId(options.expectedRivalryId):null;
193-    const expectedSaveId=options.expectedSaveId==null?null:String(options.expectedSaveId);
194-    if(expectedSaveId!==null&&!pairValidSaveId(expectedSaveId))throw pairErrorWithCode("PERSISTENT_PAIR_BINDING_INVALID","The current Showdown identity is invalid.");
195:    // r80 END SHOWDOWN: the ended-early mark rides on this same closure write (seasons finished, or null when unknown).
196:    const endedEarly=Object.hasOwn(options,"seasonsPlayed")?{seasonsPlayed:Number.isInteger(options.seasonsPlayed)&&options.seasonsPlayed>=0&&options.seasonsPlayed<=10?options.seasonsPlayed:null}:null;
197:    pairSetState({status:"abandoning",busy:true,message:"Ending the current Showdown for both players…"});
198-    try{
199-      const context=await pairResolveContext(),sdk=context.services.firestoreSdk,pairRef=pairLinkReference(context),deviceRef=pairDeviceReference(context);
200-      const result=await sdk.runTransaction(context.services.firestore,async transaction=>{
201-        const deviceSnapshot=await transaction.get(deviceRef);pairAssertActiveDevice(deviceSnapshot,context.deviceId);
202-        const pairSnapshot=await transaction.get(pairRef);
203-        if(!pairSnapshot.exists()){
204-          if(expectedRivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_LINK_REQUIRED","The online Showdown connection could not be verified. Nothing was changed.");
205-          return{ok:true,status:"unpaired",rivalryId:null};
206-        }
207-        const link=pairParsePairLink(pairSnapshot.data(),context.accountId);
208-        pairRequireCurrentIdentity(link.managerRole);
209-        if(expectedRivalryId&&link.rivalryId!==expectedRivalryId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown does not match the remembered online Showdown. Nothing was deleted.");
210-        const rivalryRef=pairRivalryReference(context,link.rivalryId),rivalrySnapshot=await transaction.get(rivalryRef);
211-        if(!rivalrySnapshot.exists())throw pairErrorWithCode("PERSISTENT_PAIR_RIVALRY_MISSING","The online Showdown could not be verified. Nothing was changed.");
--
215-        if(!slot||slot.slotId!==link.managerRole)throw pairErrorWithCode("PERSISTENT_PAIR_MEMBERSHIP_MISSING","This account is not part of the remembered Showdown.");
216-        if(expectedSaveId&&slot.saveId!==expectedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown's save does not match the remembered online Showdown. Nothing was deleted.");
217-        if(rivalryValue.data?.connectionState==="closed")return{ok:true,status:"already-closed",rivalryId:link.rivalryId,managerRole:link.managerRole};
218-        // r80 (Codex #936): Daniel's first real START closes his leftover code only while nobody has joined it (read here, in the
219-        // close itself): a code Nik has joined is a Showdown being played and is never ended from that START.
220-        if(options.unjoinedOnly===true&&(link.managerRole!=="playerOne"||rivalryValue.data?.connectionState!=="pending-pair"))throw pairErrorWithCode("PERSISTENT_PAIR_CODE_JOINED","Nik has already joined your earlier code, so that Showdown is being played. Finish or end it first. Nothing was changed.");
221-        const membership=pairAssertRivalryMembership(rivalryValue,link.rivalryId,context.accountId,link.managerRole),providerBinding=pairProviderBindingFromMembership(membership);
222-        if(expectedSaveId&&providerBinding.saveId!==expectedSaveId)throw pairErrorWithCode("PERSISTENT_PAIR_CONTEXT_MISMATCH","This Showdown's save does not match the remembered online Showdown. Nothing was deleted.");
223:        const now=sdk.Timestamp.fromMillis(Date.now()),next=await pairBuildRivalryClosureEnvelope(rivalryValue,context,now,options.cryptoImpl||root.crypto,endedEarly);
224-        transaction.set(rivalryRef,next);
225-        return{ok:true,status:"closed",rivalryId:link.rivalryId,managerRole:link.managerRole,revision:next.revision};
226-      });
227-      await pairInitialize({force:true});
228-      return result;
229-    }catch(error){
230-      pairSetState({status:"error",busy:false,message:"The current Showdown connection was not closed. "+(error?.message||"Nothing was changed.")});
231-      throw error;
232-    }
233-  }
234-  async function pairLoadConnectedRivalry(){if(root.CareerModeSparkConnectedRivalry)return root.CareerModeSparkConnectedRivalry;if(pairConnectedRivalryLoadPromise)return pairConnectedRivalryLoadPromise;if(typeof root.loadRuntimeScript!=="function")return null;pairConnectedRivalryLoadPromise=root.loadRuntimeScript("persistent-pair-connected-rivalry",CONNECTED_RIVALRY_PATH,()=>Boolean(root.CareerModeSparkConnectedRivalry)).then(()=>root.CareerModeSparkConnectedRivalry||null).catch(()=>null).fi
235-  async function pairLoadSharedJourneyEntry(){if(root.CareerModeProductionSharedJourneyEntry)return root.CareerModeProductionSharedJourneyEntry;if(pairSharedEntryLoadPromise)return pairSharedEntryLoadPromise;if(typeof root.loadRuntimeScript!=="function")return null;pairSharedEntryLoadPromise=root.loadRuntimeScript("persistent-pair-shared-entry",SHARED_ENTRY_PATH,()=>Boolean(root.CareerModeProductionSharedJourneyEntry)).then(()=>root.CareerModeProductionSharedJourneyEntry||null).catch(()=>nul
236-  async function pairEnsurePreparedBinding(context,role){const binding=pairPreparedBindingForRole(context.pairing,role);if(binding)return binding;/* r79: no screen change here (that was the reverse bounce); the panel offers CHOOSE SEASONS instead. */throw pairErrorWithCode("PERSISTENT_PAIR_SEASON_SELECTION_REQUIRED","Choose 1, 3, 5, or 10 seasons and press START A SHOWDOWN before connecting players.");}
237-  async function pairAttachRecoveryPointer(context,binding,rivalryId){const connected=await pairLoadConnectedRivalry();if(!connected?.attachRivalry)return{ok:false,connected:null,result:null};const result=await connected.attachRivalry({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,deviceId:context.deviceId,binding,rivalryId,indexedDBImpl:root.indexedDB});if(result?.ok&&typeof connected.initialize==="function")await connected.initialize();ret
--
281-  // BH-11 (#11): a pasted message such as "code: CMS17-pair_…" still joins when it holds exactly one code. Two different
282-  // codes in one paste stay invalid, and the error never echoes the pasted text.
283-  function pairExtractPastedCode(input){const found=new Map(),pattern=/(?:^|[^0-9a-z_])(CMS17(R?)-)?(pair_[0-9a-f]{64})(?![0-9a-z_])/gi;for(const match of input.matchAll(pattern)){const id=match[3].toLowerCase(),prior=found.get(id)||{wrapped:false,real:false};found.set(id,{wrapped:prior.wrapped||Boolean(match[1]),real:prior.real||/^r$/i.test(match[2]||"")});}if(found.size!==1)return null;const [[id,flags]]=[...found];return{id,wrapped:flags.wrapped,real:flags.real};}
284-  function pairParsePlayerJoinCode(value){const input=String(value||"").trim(),anchored=/^CMS17(R?)-(pair_[0-9a-f]{64})$/i.exec(input),extracted=anchored?{id:anchored[2],wrapped:true,real:/^r$/i.test(anchored[1])}:(/^pair_[0-9a-f]{64}$/i.test(input)?{id:input,wrapped:false,real:false}:pairExtractPastedCode(input));if(extracted&&extracted.wrapped){const rivalryId=pairNormalizeRivalryId(extracted.id);return{rivalryId,totalRounds:pairSeasonFromCapability(rivalryId),legacy:false,real:extracted.r
285-  // r79: the active save of a Showdown that is already CLOSED (finished, or deleted on Daniel's phone; the pair-link read or the
286-  // DELETED notice says which rivalry and save) is not "a different unfinished Showdown". Its empty shell of the same length is
287-  // reused as before; otherwise Nik's JOIN makes a new shell beside it and that save stays in the library untouched.
288-  function pairClosedShowdownSaveId(role){return role==="playerTwo"&&!state.rivalryId&&/^pair_[0-9a-f]{64}$/.test(String(state.closedRivalryId||""))&&pairValidSaveId(state.closedProviderSaveId)?state.closedProviderSaveId:null;}
289:  async function pairProvisionJoinerBinding(context,role,totalRounds){let binding=pairPreparedBindingForRole(context.pairing,role);const closedSaveId=pairClosedShowdownSaveId(role);if(binding){const preparedRounds=pairPreparedTotalRounds();if(role==="playerTwo"&&Number(totalRounds)!==preparedRounds){if(binding.saveId!==closedSaveId){/* r87 Fable F4-01: with no pair link at all (state.rivalryId empty) nothing was ever committed for this shell (the pair link is written in the same transaction 
290-  function pairAlreadyActiveState(){if(state.connectionState!=="active"||!state.rivalryId)return null;const recoveryRequired=state.status==="recovery-required";return pairSetState({status:recoveryRequired?"recovery-required":"paired",busy:false,message:recoveryRequired?state.message:"Daniel and Nik are already connected."});}
291-  function pairProviderConflictNeedsRefresh(error){return error?.code==="PERSISTENT_PAIR_PENDING_CONFLICT"||error?.code==="PERSISTENT_PAIR_ACTIVE_CONFLICT";}
292-
293-  // Codex #904 (P1, twice): a permanent pair's code is created only while BOTH partner records, read again INSIDE the
294-  // code-creation transaction, still name each other. An UNPAIR on either side (another Daniel browser, or Nik's Settings) that
295-  // commits after the fresh reads in START then conflicts with this transaction (it retries and stops) instead of leaving an open
296-  // code Nik either could still redeem or can never join. Two more reads, only for a permanent pair's code.
297-  function pairCreationWhilePaired(context,role,real,witness,seen){const mine=role==="playerOne"&&!real?pairPartnerRecordFor(context.accountId):null;if(!mine||mine.active!==true||typeof witness!=="function")return witness;return async args=>{const own=await args.transaction.get(pairPartnerReference(context)),other=await args.transaction.get(pairPartnerReference(context,mine.partnerAccountId));let record=null,theirs=null;try{record=own.exists()?pairParsePartnerRecord(own.data(),context.accoun
298-  // The same on Nik's side: a permanent pair's plain code is redeemed only while Nik's own record, read again INSIDE the redeem
299-  // transaction, still names Daniel, so an UNPAIR from Nik's other browser conflicts with the join. One more read, only here.
300-  function pairRedeemWhilePaired(context,role,parsed,witness,seen){const mine=role==="playerTwo"&&!parsed.real?pairPartnerRecordFor(context.accountId):null;if(!mine||mine.active!==true||typeof witness!=="function")return witness;return async args=>{const own=await args.transaction.get(pairPartnerReference(context));let record=null;try{record=own.exists()?pairParsePartnerRecord(own.data(),context.accountId):null;}catch(_error){record=null;}if(!record||record.active!==true||record.partnerAccou
301-  function pairAdoptUnpairedHere(context,record){partnerState=pairFreezeDeep({status:record?"ready":"none",accountId:context.accountId,record:record?pairFreezeDeep(record):null,code:null,checkedAt:Date.now()});pairSetPartnerSide("not-paired",context.accountId,null);pairRealRivalryId=null;pairNotifyPartner();}
302:  async function pairStartPairing(options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;const action=pairBeginBusyAction();pairSetState({status:"starting",busy:true,message:"Preparing your Showdown…"});try{const context=await pairResolveContext(),role=pairNormalizeManagerRole(options.managerRole||pairSelectedRole()),manager=pairRequireCurrentIdentity(role),binding=await pairEnsurePreparedBinding(context,role),totalRounds=pairPreparedTotalRound
303-  // BH-11 (#7): the Save ids present before Nik's join, so a failed join can tell a shell it just created from an existing one.
304-  async function pairKnownSaveIds(){try{await pairEnsureSaveLibraryAuthority();const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return Array.isArray(library?.saves)?new Set(library.saves.map(entry=>entry&&entry.saveId).filter(Boolean)):null;}catch(_error){return null;}}
305-  // BH-11 (#3): read-only re-check after a failed join. checked=false means the outcome is unknown (keep everything).
306-  async function pairReadCommittedJoin(context,parsed,role){if(!context||!parsed||!role)return{checked:false,link:null};try{const link=await pairReadPairLink(context);return{checked:true,link:link&&link.rivalryId===parsed.rivalryId&&link.managerRole===role&&link.connectionState==="active"?link:null};}catch(_error){return{checked:false,link:null};}}
307-  async function pairJoinPairing(capability,options={}){if(state.busy)return state;const active=pairAlreadyActiveState();if(active)return active;const action=pairBeginBusyAction();pairSetState({status:"joining",busy:true,message:"Joining Daniel's Showdown…"});let parsed=null,context=null,role=null,manager=null,binding=null,createdShell=null;const unpairedHere={seen:false,record:null};try{parsed=pairParsePlayerJoinCode(capability);context=await pairResolveContext();role=pairNormalizeManager
308-    // BH-11 (#3): a lost acknowledgement can hide a join that did commit, and the retry then reads as "already used".
309-    const committed=await pairReadCommittedJoin(context,parsed,role);
310-    if(committed.link){const link=committed.link;if(manager&&binding&&binding.saveId===link.providerSaveId&&binding.profileId===link.providerProfileId){try{await pairAttachRecoveryPointer(context,binding,link.rivalryId);}catch(_error){}if(parsed.real&&role==="playerTwo"){pairRealRivalryId=link.rivalryId;await pairRecordRealPairing(link.rivalryId,role,context);}pairRequestDurableStorage();return pairSetState({status:"paired",initialized:true,busy:false,accountId:context.accountId,deviceId:con
311-    if(pairProviderConflictNeedsRefresh(error)){action.refreshing=true;return await pairInitialize({force:true});}
312-    // r87 Fable F4-08: a code the provider refused as no longer joinable (closed, used, expired, not found) is remembered on this
313-    // page, so Nik's JOIN tile stops pointing at it (no read).
314-    if(parsed&&committed.checked&&pairJoinRefusedCode(error)){pairRefusedJoinRivalryIds.add(parsed.rivalryId);pairNotifyPartner();}
315-    // BH-11 (#7): remove only the empty local copy this attempt created, and only when the join was definitely refused.
316-    if(createdShell&&committed.checked&&pairJoinFailureIsDefinitive(error)){try{await pairDeleteExactPreparedShell(context,role,createdShell.saveId,createdShell.profileId);}catch(_error){}}
--
555-    const confirmed=await pairAskConfirm("Delete this old connection and start fresh? This closes the stale online connection and clears only its unfinished Showdown so Nik can join the new code Daniel creates.","danger");
556-    // BH-11 (#2): only an explicit yes deletes; a missing or blocked confirm box never counts as consent.
557-    if(confirmed!==true)return false;
558-    const rechecked=await pairInitialize({force:true});
559-    if(!rechecked||rechecked.connectionState!=="pending-pair"||rechecked.managerRole!=="playerTwo"||pairCurrentIdentityRole()!=="playerTwo"||rechecked.rivalryId!==rivalryId||rechecked.providerSaveId!==providerSaveId||rechecked.providerProfileId!==providerProfileId){
560-      throw pairErrorWithCode("PERSISTENT_PAIR_STALE_PENDING_STATE_CHANGED","This old connection changed after confirmation. Nothing was deleted. Review the current screen and try again.");
561-    }
562-    const context=await pairResolveContext();
563:    const closed=await pairAbandonCurrentShowdown({expectedRivalryId:rivalryId,expectedSaveId:providerSaveId});
564:    if(!closed||closed.ok!==true)throw pairErrorWithCode("PERSISTENT_PAIR_ABANDON_FAILED","The old connection could not be closed safely.");
565-    remoteClosed=true;
566-    await pairDeleteExactPreparedShell(context,"playerTwo",providerSaveId,providerProfileId);
567-    return pairSetState({...state,status:"unpaired",busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSaveId:null,providerProfileId:null,capability:null,message:"Old connection and unfinished test Showdown deleted. Paste the new code Daniel sends."});
568-  }catch(error){
569-    const prefix=remoteClosed?"The old online connection was closed, but its unfinished Showdown was not cleared yet. ":"Old connection cleanup could not finish. ";
570-    return pairSetState({...state,status:remoteClosed?"save-required":state.status,busy:false,message:prefix+(error?.message||"Nothing else was changed.")});
571-  }
572-}
573-
574-// r79: START OVER goes through the same canonical START as Home (Daniel: seasons; Nik: JOIN, never the seasons screen).
575-async function pairOpenCanonicalStart(){
576-  const identity=root.CareerModeOnlinePlayerIdentity;
577-  if(identity&&typeof identity.openStart==="function"){const decision=await identity.openStart();return decision!==null&&decision!==false;}
578-  return typeof root.navigateTo==="function"
--
601-    const rechecked=await pairInitialize({force:true});
602-    if(rechecked?.connectionState==="active"&&rechecked.status==="paired"){
603-      pairSetState({status:"paired",busy:false,message:"Your restored career is ready. Continue Career instead of deleting it."});
604-      return false;
605-    }
606-    if(!rechecked||rechecked.status!=="recovery-required"||rechecked.connectionState!=="active"||rechecked.rivalryId!==rivalryId){
607-      throw pairErrorWithCode("PERSISTENT_PAIR_RECOVERY_STATE_CHANGED","The old Showdown changed after confirmation. Nothing was deleted. Review the current screen and try again.");
608-    }
609:    const closed=await pairAbandonCurrentShowdown({expectedRivalryId:rivalryId});
610:    if(!closed||closed.ok!==true)throw pairErrorWithCode("PERSISTENT_PAIR_ABANDON_FAILED","The old Showdown could not be closed safely.");
611-    const opened=await pairOpenCanonicalStart();
612-    if(opened===false)throw pairErrorWithCode("PERSISTENT_PAIR_START_OVER_ROUTE_FAILED","The new Showdown screen could not be opened.");
613-    return true;
614-  }catch(error){
615-    pairSetState({status:state.status==="paired"?"paired":"recovery-required",busy:false,message:`Start over could not finish. ${error?.message||"The old Showdown was not changed."}`});
616-    return false;
617-  }
618-}
619-
620-  function pairCreateElement(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined&&text!==null)element.textContent=String(text);return element;}
621-  function pairCopyText(value){if(root.navigator?.clipboard?.writeText)return root.navigator.clipboard.writeText(value).then(()=>true).catch(()=>false);return Promise.resolve(false);}
622-  function pairRoleLabel(role){if(!role)return root.CareerModeOnlinePlayerIdentity?.getState?.().managerLabel||"PLAYER";return pairManagerForRole(role).label;}
623-  function pairClockText(epochMs){try{const text=new Date(epochMs).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});return typeof text==="string"?text:"";}catch(_error){return "";}}
624-  function pairRender(){if(!root.document)return null;const shell=root.document.querySelector("#connectPlayersScreen #connectPlayersPairSlot");if(!shell)return null;let panel=root.document.getElementById(PANEL_ID);if(!panel){panel=pairCreateElement("section","stateNote");panel.id=PANEL_ID;Object.assign(panel.style,{margin:"0 0 14px",padding:"14px 16px",border:"1px solid rgba(255,255,255,.16)",background:"rgba(5,10,17,.7)"});shell.append(panel);}if(panel.parentNode!==shell)shell.append(panel)
--
640-  function pairHeldIfEnded(next){if(!next.busy&&next.rivalryId&&!endedRivalryIds.has(next.rivalryId)&&pairTerminalClosedId()===next.rivalryId&&pairHomeShownNow())endedRivalryIds.add(next.rivalryId);if(next.busy||!next.rivalryId||!endedRivalryIds.has(next.rivalryId)||!["active","pending-pair"].includes(next.connectionState))return next;endedHeldNow=true;return {...next,status:"unpaired",initialized:true,busy:false,managerRole:null,managerId:null,rivalryId:null,connectionState:null,providerSav
641-  // Codex #910: Home may already be showing (its JOIN note watch stopped while the Showdown was live), so the page is told once
642-  // the ended Showdown is let go; Nik's Home then redraws and watches Daniel's next JOIN note without a tap.
643-  function pairAnnounceEnded(){endedHeldNow=false;const closedRivalryId=state.closedRivalryId;/* after this state change has finished, never inside it */void Promise.resolve().then(()=>{try{if(typeof root.dispatchEvent==="function"&&typeof root.CustomEvent==="function")root.dispatchEvent(new root.CustomEvent("career-mode-permanent-pair-ended",{detail:{closedRivalryId}}));}catch(_error){}});}
644-  function pairEndRivalry(rivalryId){endedRivalryIds.add(rivalryId);if(!state.busy&&state.rivalryId===rivalryId)pairSetState({});}
645-  function pairEndClosedOnHome(){const closedNow=pairTerminalClosedId(),rivalryId=closedOnHomeRivalryId||(closedNow&&closedNow===state.rivalryId&&!endedRivalryIds.has(closedNow)?closedNow:null);if(!rivalryId)return;closedOnHomeRivalryId=null;pairEndRivalry(rivalryId);}
646-  function pairOnShowdownDeleted(event){const detail=event?.detail;if(!detail||!/^pair_[0-9a-f]{64}$/.test(String(detail.rivalryId||"")))return;if(detail.phase==="DELETED")pairEndRivalry(detail.rivalryId);else if(detail.phase==="CLOSED"&&!endedRivalryIds.has(detail.rivalryId)){closedOnHomeRivalryId=detail.rivalryId;if(pairHomeShownNow())pairEndClosedOnHome();}}
647-  if(root.addEventListener)root.addEventListener("career-mode-shared-terminal-close-state-change",pairOnShowdownDeleted);
648:  return pairFreezeDeep({contractVersion:5,feature:"persistent-nik-daniel-pair",permanentPartner:true,joinNoteMemoMs:JOIN_NOTE_MEMO_MS,realCodePrefix:REAL_CODE_PREFIX,partnerChangeEvent:PARTNER_EVENT,pairDocumentId:PAIR_DOC_ID,publicDiscovery:false,billingRequired:false,persistentAcrossRegisteredBrowsers:true,pairLinkPersistentAcrossRegisteredBrowsers:true,gameplayCacheHydrationAcrossFreshBrowsers:true,freshBrowserGameplayRequiresVerifiedLocalRecovery:false,legacyPairMigration:false,managerB
649-});
### js/productionSharedTerminalClose.js
152-    // Swept here through the generic js/storage.js remove helper (a Showdown has at most 10 seasons) so the startup budget stays put.
153-    if(state.phase==="CLOSED")ptcClearDrafts(state.rivalryId||request.rivalryId);
154-    if(state.phase==="DELETED")ptcClearDrafts(state.rivalryId||request.rivalryId);
155-    if(state.phase==="CLOSED"||state.phase==="DELETED")ptcNoteEnded(state.rivalryId||request.rivalryId);
156-    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:state.phase,rivalryId:state.rivalryId||request.rivalryId,terminal:state.phase==="CLOSED"}}));}catch(_error){}
157-    if(state.phase==="DELETED"&&previousPhase!=="DELETED")ptcLeaveEndedShowdown();
158-    return state;
159-  }
160:  // r80 END SHOWDOWN: the Showdown was ended (this page's own terminal read saw it closed with no finish witness). This phone
161-  // leaves it for Home once and says so; History keeps it as Ended early. Phase names stay (DELETED).
162-  function ptcLeaveEndedShowdown(){
163-    try{
164-      const home=root.document?.getElementById("mainMenu");
165-      if(home&&!home.classList.contains("hidden"))return;
166-      root.stopTransferTimerLoop?.();root.resetTransientSelectionOperations?.();root.resetNavigationState?.();
167-      if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);else void root.navigateTo?.("mainMenu",{addToHistory:false});
168-      root.refreshMainMenuExperience?.();
169-      root.showAppNotice?.("This Showdown was ended for both players. History keeps it as Ended early.","info",8000);
170-    }catch(_error){}
171-  }
172-  function ptcClear(){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
173-  function ptcStillCurrent(request,generation){return ptcRequest()?.key===request.key&&stateGeneration===generation;}
174-  // A verified stored closure can finish the same gameplay through a replacement session. This comparison is read-only;
175-  // unresolved writes still resend the original intent, and the protocol/provider keep exact session-bound idempotency.
176-  function ptcSameFinalResult(terminalRead,intent){
177-    if(protocol.sameWitness(terminalRead.terminalWitness,intent))return true;
178-    try{const witness=protocol.verifyIntent(terminalRead.terminalWitness),held=protocol.verifyIntent(intent);return protocol.sameWitness({...witness,sessionId:held.sessionId},held);}catch(_error){return false;}
179-  }
180-  function ptcClosedState(request,terminalRead){const witness=protocol.verifyIntent(terminalRead.terminalWitness);return {phase:"CLOSED",rivalryId:request.rivalryId,sessionId:witness.sessionId,rivalryRevision:terminalRead.rivalryRevision,terminal:true,terminalWitness:ptcClone(witness),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
181-  function ptcBootstrap(){return ptcEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>ptcWake());});}
182-  function ptcOnOtherRivalry(request){try{const s=ptcRivalryApi()?.getState?.(),id=String(s?.rivalryId||"").trim().toLowerCase();return s?.attached===true&&/^pair_[0-9a-f]{64}$/.test(id)&&id!==request.rivalryId;}catch(_error){return false;}}
183:  // r80: right after END SHOWDOWN on this phone, START (or Nik's JOIN) opens a new save shell before its rivalry is attached.
184-  // The shell's marker names no rivalry, so the request borrows the ended Showdown's Shared Setup still held in page memory,
185-  // and Connected Rivalry, now read for the new shell, has no rivalry attached at all. That ended rivalry is not this shell's
186-  // Showdown, so there is nothing to close here and nothing to report. Quiet only when all of these hold: the rivalry was
187-  // borrowed from that Setup, this page saw that exact rivalry end (it held it CLOSED or DELETED, or the pair let it go as
188-  // closed: END on this phone or on the other one), and Connected Rivalry answered for this exact save with nothing attached.
189-  // A live Showdown whose pointer is missing on this device (a new browser continuing) has not ended, so it still reports.
190-  const endedRivalryIds=new Set();let unsubscribePair=null;
191-  function ptcNoteEnded(rivalryId){const id=String(rivalryId||"").trim().toLowerCase();if(/^pair_[0-9a-f]{64}$/.test(id))endedRivalryIds.add(id);}
192-  function ptcWatchPair(){try{const pair=root.CareerModePersistentNikDanielPair;if(!pair)return;if(!unsubscribePair&&typeof pair.subscribe==="function")unsubscribePair=pair.subscribe(next=>ptcNoteEnded(next?.closedRivalryId));ptcNoteEnded(pair.getState?.()?.closedRivalryId);}catch(_error){}}
193-  function ptcShellHasNoRivalry(request){try{ptcWatchPair();const s=ptcRivalryApi()?.getState?.(),b=s?.binding;return request.fromSetup===true&&endedRivalryIds.has(request.rivalryId)&&s?.connected===true&&s.attached!==true&&!s.rivalryId&&b?.saveId===request.saveId;}catch(_error){return false;}}
194-  async function ptcRefreshNow(){
195-    const request=ptcRequest();if(!request)return ptcClear();
196:    // r79: a Showdown ended by the other manager (END SHOWDOWN) stays ended (a closed rivalry never reopens): no further read for it.
197-    // r86 (red team #6): the same holds for a verified CLOSED one. The Champion screen's 45 s timer wake re-read it (~320 billed/hour).
198-    const ended=ptcCurrentState();if(ended?.phase==="DELETED"||(ended?.phase==="CLOSED"&&ended.terminal===true&&ended.rivalryId===request.rivalryId))return ended;
199-    await ptcBootstrap();
200-    // r79: right after a delete and a new JOIN, the page's rivalry can already be the new Showdown while this Showdown's request
201-    // (the old one) is still on screen for a moment. That is not a failure to report: this page has moved on, and the next wake
202-    // (the save or rivalry change) refreshes the new one. A held RECOVERY_PENDING close keeps its witness.
203-    let context;try{context=await ptcResolveContext(request);}catch(error){if(error?.code==="TERMINAL_CLOSE_RIVALRY_REQUIRED"&&(ptcOnOtherRivalry(request)||ptcShellHasNoRivalry(request))){const held=ptcCurrentState();return held?.phase==="RECOVERY_PENDING"?held:ptcClear();}throw error;}
204-    if(ptcRequest()?.key!==request.key)return null;
205-    const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
206-    if(ptcRequest()?.key!==request.key)return null;
207-    // H1017-1: an unresolved close holds its exact witness. A verified closed read of the same final facts resolves it here;
208-    // an open, mismatched or failed read keeps RECOVERY_PENDING so TRY CLOSING AGAIN stays bound to that witness.
209-    const held=ptcCurrentState();
210-    const deletedRead=terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed";
--
377-    if(root.document?.visibilityState==="hidden")return;if(busy){if(event?.type==="career-mode-shared-wait-context-change")wakePending=true;return;}
378-    // r75: while the close is pending (FINAL RESULT READY TO CLOSE and the pending/blocked states) the partner may close at
379-    // any moment, so this check reads the rivalry root fresh instead of from the budget layer's quiet reuse.
380-    // r84 trim: a healthy context listener on the rivalry root (ptcWatchContext) delivers the partner's close at once, so the
381-    // fresh reads below run only while it is not confirmed (no listener, hidden page, dropped connection).
382-    const rootPath=`rivalries/${request.rivalryId}`,watched=Boolean(root.CareerModeFirestoreBudget?.contextHealthy?.(rootPath));
383-    if(["READY","RECOVERY_PENDING","BLOCKED"].includes(ptcCurrentState()?.phase)){if(!watched)root.CareerModeFirestoreBudget?.wantFresh?.(rootPath);}
384-    // r84: between seasons nothing else re-reads the rivalry now that Final Reconciliation no longer loops, so the 60 s quiet reuse
385:    // could hold a partner's END SHOWDOWN for up to 75 s. A timer wake (no event) reads the rivalry root fresh at most every 45 s:
386-    // one extra read per 3 min per device, and the idle phone goes Home within ~45 s.
387-    else if(!event&&Date.now()-pollFreshAt>=POLL_FRESH_MS){pollFreshAt=Date.now();if(!watched)root.CareerModeFirestoreBudget?.wantFresh?.(rootPath);}
388-    void ptcRefresh();
389-  }
390-  function ptcInstall(){
391-    if(installed)return true;installed=true;
392-    // r75: an ordinary startup with no shared Showdown loads none of the close runtime (Remote Joining stays unloaded);
393-    // the first wake that finds a shared Showdown loads it through ptcRefreshNow.
394-    if(ptcShowdown()?.sharedJourney?.mode==="shared")void ptcBootstrap().then(()=>ptcWake()).catch(error=>ptcReport("Shared Showdown Terminal Close bootstrap unavailable",error));
395-    for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-final-reconciliation-state-change","career-mode-connected-account-state-change","career-mode-connected-rivalry-state-change","career-mode-active-save-changed","career-mode-save-library-authority-invalidated","career-mode-showdown-state-change"]){root.addEventListener?.(event,ptcWake);}
396-    root.document?.addEventListener?.("visibilitychange",ptcWake);
397-    root.addEventListener?.("career-mode-permanent-pair-ended",event=>ptcNoteEnded(event?.detail?.closedRivalryId));
398-    if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())ptcWake();},POLL_MS);
399-    if(typeof root.setTimeout==="function")root.setTimeout(ptcWake,0);
### js/productionSharedJourneyReconnect.js
86-  // Accounts without a permanent partner retain the existing manual recovery instructions.
87-  function pjrManagerName(role){const name=pjrShowdown()?.managers?.[role];return String(name||(role==="playerOne"?"Manager 1":"Manager 2"));}
88-  function pjrReconnectStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();return role==="playerTwo"?`Tap RECONNECT, paste the new code from ${pjrManagerName("playerOne")} and tap JOIN PRIVATE SESSION.`:`Tap RECONNECT, then HOST PRIVATE SESSION and send the new code to ${pjrManagerName("playerTwo")}.`;}
89-  // BH-11 (#1): a reload drops the page-memory session code, so this phone simply has no session. That is not an ended
90-  // session; say so plainly. Kept about as short as the ended-session line so the banner does not reflow the game screens;
91-  // where the other phone takes the new code is said in the Remote Joining panel.
92-  function pjrNotConnectedStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();const other=pjrManagerName(role==="playerTwo"?"playerOne":"playerTwo");return `Tap RECONNECT, then HOST and send the code to ${other}, or JOIN ${other}'s new code.`;}
93-  function pjrShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_){return false;}}
94:  // r80 END SHOWDOWN: the other phone ended this Showdown (Terminal Close holds it DELETED: closed, no finish witness). This
95:  // page has already left it for Home with the ended-early notice, and a closed rivalry never reopens, so there is no session
96-  // to reconnect: no banner, no RECONNECT SESSION (the gallery saw both over Nik's Home and History right after Daniel's END).
97-  function pjrShowdownEnded(){try{return root.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED";}catch(_){return false;}}
98-  function pjrMessage(value){
99-    if(!value)return "";
100-    if(value.phase==="FRESH_SESSION_REQUIRED"&&pjrShowdownClosed())return "SHOWDOWN COMPLETE · Open the Final Winner or History from Home.";
101-    if(value.phase==="OFFLINE_HOLD")return "OFFLINE · Reconnect to carry on.";
102-    if(value.phase==="RECOVERY_PENDING")return "RECONNECTING · Finish reconnecting both players before continuing.";
103-    if(value.phase==="FRESH_SESSION_REQUIRED"&&!value.sessionId)return `NOT CONNECTED ON THIS PHONE · Reloading drops the connection. ${pjrNotConnectedStep(value.managerRole)}`;
104-    if(value.phase==="FRESH_SESSION_REQUIRED")return `NEW CONNECTION NEEDED · ${value.resumable?"Your Showdown is saved; the connection ended":"The connection ended"} (a connection lasts up to 4 hours). ${pjrReconnectStep(value.managerRole)}`;
105-    if(value.phase==="TERMINAL_RECOVERED")return `RECONNECTED · ALL ${value.totalSeasons} SEASONS COMPLETE · No new season can be added.`;
106-    if(value.phase==="ACTIVE_RECOVERED")return `RECONNECTED · SEASON ${value.activeSeason} OF ${value.totalSeasons} · League, clubs and history pick up where you left off.`;
107-    return "RECONNECT STATUS UNAVAILABLE";
108-  }
109-  // Job 31: after RECONNECT SESSION the Remote Joining panel stayed open over the game once the fresh session was ACTIVE.

```


## FILE: firestore.persistent-pair-production.fragment.rules END/abandon excerpt
```text
90-          )
91-        );
92-    }
93-
94:    function cmsPersistentPairAbandonActorValid(before, rivalryId) {
95-      let pair = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
96-      let pairData = pair.data.data;
97-      let slots = before.data.managerSlots;
98-      return pair.data.objectType == 'pairLink'
99-        && pair.data.objectId == 'current'
100-        && pair.data.lifecycleState == 'live'
101-        && pairData.rivalryId == rivalryId
102-        && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
103-        && slots is list
104-        && slots.size() == 2
105-        && (
106-          (
107-            slots[0].slotId == pairData.managerRole
108-            && slots[0].accountId == request.auth.uid
109-            && slots[0].entitlementState == 'active'
110-          )
111-          ||
112-          (
113-            slots[1].slotId == pairData.managerRole
114-            && slots[1].accountId == request.auth.uid
--
116-          )
117-        );
118-    }
119-
120:    function cmsPersistentPairAbandonValid(rivalryId) {
121-      let before = resource.data;
122-      let after = request.resource.data;
123-      return signedIn()
124-        && rivalryId is string
125-        && rivalryId.matches('^pair_[0-9a-f]{64}$')
126-        && before.objectType == 'rivalry'
127-        && before.objectId == rivalryId
128-        && before.lifecycleState == 'live'
129-        && activeDevice(after.updatedByDeviceId)
130-        && validCasEnvelope(before, after, 'rivalry', rivalryId)
131-        && after.updatedByAccountId == request.auth.uid
132:        && cmsPersistentPairAbandonActorValid(before, rivalryId)
133-        && before.data.authorizedAccountIds is list
134-        && request.auth.uid in before.data.authorizedAccountIds
135-        && (before.data.connectionState == 'pending-pair' || before.data.connectionState == 'active')
136-        && after.data.connectionState == 'closed'
137:        && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState', 'endedEarly'])
138:        && (!('endedEarly' in after.data) || cmsPersistentPairEndedEarlyValid(after.data.endedEarly));
139-    }
140-
141:    // r80 END SHOWDOWN: the abandon write may carry the ended-early mark. seasonsPlayed is the
142-    // number of finished seasons (0..10), or null when the count could not be read.
143:    function cmsPersistentPairEndedEarlyValid(mark) {
144-      return mark is map
145-        && mark.keys().hasOnly(['seasonsPlayed'])
146-        && mark.keys().hasAll(['seasonsPlayed'])
147-        && (
148-          mark.seasonsPlayed == null
149-          || (mark.seasonsPlayed is int && mark.seasonsPlayed >= 0 && mark.seasonsPlayed <= 10)
150-        );
151-    }
152-
153-    function cmsPersistentPairCreateValid(accountId, pairId) {
154-      let root = request.resource.data;
155-      return activeDevice(root.updatedByDeviceId)
156-        && request.auth.uid == accountId
157-        && pairId == 'current'
158-        && validCreateEnvelope(root, 'pairLink', pairId)
159-        && root.updatedByAccountId == accountId
160-        && cmsPersistentPairDataValid(accountId, root.data)
161-        && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId));
162-    }
163-
--
536-              && root.terminalClose.rivalryId == rivalryId
537-              && s.totalSeasons == root.terminalClose.totalSeasons
538-              && s.managerTotals == root.terminalClose.managerTotals
539-              && s.winner == root.terminalClose.winner)
540:          || ((s.status == 'abandoned' || s.status == 'never-started')
541-              && !('terminalClose' in root)
542-              && s.totalSeasons == null
543-              && s.managerTotals == null
544-              && s.winner == null));
545-    }
546-
547-    // CMS_COMPLETED_READ (D2, JOB-08): read-only grant for a Showdown closed by a verified
548-    // Terminal Close. Get only; no write, list or delete rule refers to these functions.
549-    function cmsCompletedShowdownReadable(rivalryId) {
550-      let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
551-      let data = root.data;
552-      let slots = data.managerSlots;
553-      let progress = data.terminalProgress;
554-      return signedIn()
555-        && rivalryId.matches('^pair_[0-9a-f]{64}$')
556-        && root.objectType == 'rivalry'
557-        && root.objectId == rivalryId
558-        && root.lifecycleState == 'live'
559-        && data.connectionState == 'closed'
560-        && data.authorizedAccountIds is list

```
