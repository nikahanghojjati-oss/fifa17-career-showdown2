# Fable 5.2 red-team job FS1: Standings, History and the results screens never stuck, never stale, never skipped

You are an independent red-team reviewer. Read only the code in this file. Change nothing, and write no patch longer than 5 lines.

## The game in 8 lines
- A private two-player FIFA 17 career "Showdown" between exactly two managers, Nik and Daniel. Each plays on his own phone or Chromebook, and both share one Firebase Firestore database (Spark free tier: every read and write counts).
- A Showdown is 1, 3, 5 or 10 seasons. Each season runs in a fixed order:
  1. League and club roulette, then Prime Pack, then Transfer War;
  2. the season is played in FIFA;
  3. each manager enters and publishes his own result on **Season Results** (screen `seasonEntry`), and both tap CONFIRM SEASON;
  4. ONE shared season commit;
  5. CONTINUE TO SEASON N+1 (the Touchline Gazette, then the next season), or after the last season Terminal Close and the **Final Winner / Showdown Champion** screen (a Golden Showdown screen comes first when a manager has 150 over 10 seasons).
- Sacked: either manager ticks it on Season Results, and the Showdown ends after that season.
- Equal points are a DRAW; there is no tiebreak.
- **Standings** (nav tab, screen `standings`) has two views:
  - THIS SHOWDOWN: the live Showdown's score, season, clubs and counts;
  - CAREER: all finished Showdowns' totals.
- **History / Rivalry / Career Statistics** (js/rivalryLegacyV10.js) list finished Showdowns and career totals. A finished Showdown must count everywhere at once.

## Code
- Repo nikahanghojjati-oss/fifa17-career-showdown2, commit c61a5137 (gameplay/r100, the 3.0.0 release branch).
- Each block below is an exact excerpt of the file at that commit. Every line is prefixed with its real line number in that file.
- Large files are cut to the functions that decide these paths. Where a block starts or stops, the rest of the file is not shown.
- Listener and provider internals (js/productionSharedHistoryConvergence.js, sharedHistoryConvergence.js, the season-results provider, js/v10Screens.js beyond the pending cap) are not included. Treat what they publish (`getState()` phases) as given.

## Threat model (important)
This is a private two-player tool.
- **Out of scope:** anything that needs a modified app, hand-made Firestore requests, a third person, a stolen account, or "an attacker". Old saves, old app versions and in-progress games from older releases are out of scope too: the game has not launched, and only the one finished Showdown in History must keep working.
- **In scope:** anything that can happen in NORMAL play on the real app:
  - two phones acting at the same instant;
  - double taps;
  - retries after a network error;
  - a phone offline or asleep (tab hidden), or a tab killed or reloaded at any moment;
  - a phone joining late;
  - a slow network or a slow phone;
  - opening Standings, History or Career from the nav bar at ANY moment: before a Showdown, in every step of every season, on Season Results before and after either confirm, during the commit, on Final Winner, and after the Showdown has closed and Home has let it go.

## Why this job
Nik often sees **Standings stuck on loading** in real play, and wants proof of the following:
- Both Standings views (THIS SHOWDOWN and CAREER), History and Career Statistics always settle: they show the right data, or a clear "unavailable / try again" that recovers by itself or with one tap. They never spin forever.
- They never show a stale (older-season or older-Showdown) standing. CAREER and History must include a just-finished Showdown right away.
- Season Results and the Final Winner / Champion (and Golden) screens always appear when due, stay until the player taps on, and are never skipped, flashed past or navigated away from by a timer or listener.

## What counts as a finding
A finding must give:
1. what the player sees;
2. an exact sequence of normal actions (and timings, if any) that causes it;
3. the file:line(s) in THIS packet that cause it, with a short quote;
4. its severity;
5. a one-line fix idea.

You cannot run the code, so label each finding:
- **TRACED:** you followed every step through the quoted code and are sure;
- **UNSURE:** it depends on code not in this packet, or on timing you could not settle. Say exactly what.

Never present a guess as a bug. Before reporting, try to refute each finding yourself by looking for the guard that would stop it, and drop it if you find one.

**Severity:**
- **P1:** a screen is stuck for good (until a reload or worse), a results screen is skipped or leaves without the tap, or a wrong or stale standing sticks;
- **P2:** wrong or stuck but recovers by itself within about a minute or with one tap;
- **P3:** cosmetic or wording.

(P0 is kept for data loss or a game that cannot continue, which is unlikely here.)

## Do not report
- style, naming, refactors or tests;
- looks, fonts or layout;
- performance, unless it costs Firebase reads in normal play (then give the count);
- anything under "Known" below.

Report at most 8 findings, and stop when you have 3 TRACED P1s.

## Report format (plain words, one markdown answer)
- First line: VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
- Then one block per finding: ID (FS1-01, FS1-02, ...), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, and the fix idea.
- Close with: each question below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. **THIS SHOWDOWN standing stuck on loading:** can `currentRivalry()` (seasonFinalV10.js) or `rivalryView` (sharedActiveShowdownAdapter.js) stay `status:"loading"` for good while a Showdown is live?
   - Cover: opened in each season step, right after a reload, on a late-joined phone, with the tab hidden and shown again, right after CONFIRM SEASON, during the commit, and between the commit and CONTINUE.
   - Does anything re-render Standings when the providers arrive (`wake()`, `signature`, the events in `installResults`)?
   - Can `sfLiveCanArrive()` be true while nothing will ever arrive, or false while it will?
2. **THIS SHOWDOWN standing stale:** after a season commits, can it show the previous season's score, season number or clubs?
   - Cover: on both phones, when one phone has continued and the other has not, after a reload, and after the Showdown closes (Final Winner up, then Home lets it go).
   - Does the "unpaired + CLOSED" rule in `currentRivalry()` ever hide the live Showdown or keep a finished one?
3. **CAREER standing:** can CAREER stay "loading" for good (`standingsCareerLoad`, `refreshStandingsCareer`, `currentCareer`, rivalryLegacyV10.js `rlLoadCareerModel` with its timeouts and retries)? Can it miss the Showdown that just finished, or keep an older career after a newer one closed?
   - Cover: Standings opened first after a reload; opened on Final Winner; opened before the close has landed on this phone; a second open while the first load is still running; a failed read.
   - Note `careerStatisticsModel`, a supplied model that wins over the refresh: can a stale one win?
4. **History / Rivalry / Career Statistics:** in rivalryLegacyV10.js (`refresh`, `LOAD_TIMEOUT`, `scheduleReload`, `rlShowProgress`), can a screen stay on loading for good, show "unavailable" forever when the read would succeed now, or show a career without the just-finished Showdown?
   - Moving through hundreds of Showdowns must stay fast.
5. **Season Results:** can it fail to appear when due (route refused, or Reus Gate cover never lifted: see the v10Screens.js pending cap), or be left without the player's tap?
   - Look for a timer, listener, resume, Terminal Close, journey entry or progression `advance` that navigates away from `seasonEntry` while the player is reading it (before or after CONFIRM SEASON, after the commit, on reload).
6. **Final Winner / Champion / Golden:** can the Final Winner stay "unavailable" or "partial" for good?
   - Look at `finalFrame`, `closedHistoryBound`, `sfClosedHistory` (its 6 attempts and backoff), `retainedHistory`, and the rival closing before this phone's history converged.
   - Can it be skipped, or replaced by Home, the dashboard or a Season 1 screen without the tap (`openClosedShowdown`, `ptcLeaveEndedShowdown`, Home auto-JOIN)?
   - Can a reload or a late join on a closed Showdown miss it?

## Known (do not report)
- Out of the game (no live session), THIS SHOWDOWN says "CONTINUE CAREER to load" (`notice:"continue"`) by design.
- END SHOWDOWN by the partner takes both phones Home with a notice by design (`ptcLeaveEndedShowdown`). Ended-early Showdowns stay out of career totals.
- Only finished Showdowns count in CAREER and History.
- The Reus Gate cover is capped at 15 s by design (LOAD_HOLD_MAX_MS).

## Files

## FILE: js/seasonFinalV10.js (3237 lines in total)
### lines 17-50
```javascript
17:   function closedHistoryBound(p,r){
18:     // r89 Sacked: a sacked Showdown's witness says endedBy 'sacked' and completedSeason = the seasons played (<= totalSeasons).
19:     const played=r.endedBy==="sacked"?r.completedSeason:r.totalSeasons;
20:     if(typeof p.acceptedRevisionKey!=="string"||!p.acceptedRevisionKey||p.rivalryId!==r.rivalryId||p.totalSeasons!==r.totalSeasons||r.completedSeason!==played||p.acceptedSeasons!==played||!Array.isArray(p.seasonHistory)||p.seasonHistory.length!==played)return false;
21:     const api=root.CareerModeSharedHistoryConvergence||(typeof module!=="undefined"&&module.exports&&typeof require==="function"?require("./sharedHistoryConvergence.js"):null);
22:     try{return typeof api?.verifyProjection==="function"&&api.verifyProjection(p)===p;}catch(_){return false;}
23:   }
24:   // Reads an already-authorized reconciliation snapshot. The view never computes a winner.
25:   // After close, its verified terminal witness retains that exact reconciliation winner.
26:   function finalFrame(reconciliation,terminal=null,history=null){
27:     const closed=terminal?.phase==="CLOSED"&&terminal.terminal===true;
28:     const r=reconciliation?.phase==="FINAL_SEASON_RECONCILED"&&reconciliation.finalSeasonReconciled===true?reconciliation:closed?terminal.terminalWitness:null;
29:     if(!r||!ROLES[r.winner]||!number(r.managerTotals?.playerOne)||!number(r.managerTotals?.playerTwo))return freeze({status:"unavailable"});
30:     const completed=closed&&terminal.rivalryId===r.rivalryId&&terminal.terminalWitness?.winner===r.winner;
31:     const frame={status:"partial",state:completed?"completed":"completion-pending",winner:ROLES[r.winner],totals:{daniel:r.managerTotals.playerOne,nik:r.managerTotals.playerTwo},margin:Math.abs(r.managerTotals.playerOne-r.managerTotals.playerTwo),seasonsPlayed:r.acceptedSeasons??r.completedSeason??r.totalSeasons,...(r.endedBy==="sacked"&&r.sacked?{sacked:{season:r.completedSeason,totalSeasons:r.totalSeasons,daniel:r.sacked.playerOne===true,nik:r.sacked.playerTwo===true}}:{}),completionMark:completed?"":terminal?.automaticCloseFailed&&!terminal?.automaticSaving?"Saving failed. Tap CLOSE SHOWDOWN again.":"Saving this Showdown to your career…",presentation:{spotlight:r.winner==="draw"?"neutral":ROLES[r.winner]},heading:completed?"SHOWDOWN CLOSED":"SHOWDOWN FINAL RESULT",outcomeHeadline:r.winner==="draw"?"DRAW":(r.winner==="playerOne"?"Daniel":"Nik")+" WINS",resultText:r.winner==="draw"?"The Showdown is a draw":"",previewLabel:"",message:"Trophy credits are unavailable right now."};
32:     const golden=goldenFrame(r,frame);if(golden)frame.golden=golden;
33:     const p=history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===r.rivalryId?history.projection:null;
34:     if(p&&(r===reconciliation?p.acceptedRevisionKey===r.acceptedRevisionKey:closedHistoryBound(p,r))&&p.acceptedSeasons===frame.seasonsPlayed&&p.managerRecords?.playerOne?.totalPoints===frame.totals.daniel&&p.managerRecords?.playerTwo?.totalPoints===frame.totals.nik){
35:       // r93 Golden Showdown: the verified history draws the season strip, and must agree (every season 15) or the screen is not shown.
36:       if(frame.golden){const strip=goldenStrip(p,frame.golden);if(strip)frame.golden.seasons=strip;else delete frame.golden;}
37:       // JOB-1005: the last accepted season of the verified history. Points and winner are read as the record stores them; nothing is computed.
38:       const last=p.seasonHistory[p.seasonHistory.length-1],lp=last?.playerOne?.scoring?.total,ln=last?.playerTwo?.scoring?.total;
39:       if(last&&last.roundNumber===frame.seasonsPlayed&&number(lp)&&number(ln)&&lp>=0&&lp<=15&&ln>=0&&ln<=15&&ROLES[last.winner])frame.lastSeason={season:last.roundNumber,daniel:lp,nik:ln,winner:ROLES[last.winner]};
40:       const trophies={};
41:       for(const [role,m] of [["playerOne","daniel"],["playerTwo","nik"]]){const rec=p.managerRecords[role];if(!["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"].every(k=>number(rec[k])))return freeze(frame);trophies[m]={championsLeague:rec.championsLeagues,europaLeague:rec.europaLeagues,leagueTitles:rec.leagueTitles,domesticCups:rec.domesticCups,total:rec.totalTrophies};}
42:       frame.trophies=trophies;frame.status="ready";frame.message="";
43:       // r100 Phoenix: Turning Points read the same verified history (no read, no write). Any failure leaves them out.
44:       const turning=sfTurningPoints(p,frame);if(turning)frame.turningPoints=turning;
45:     }
46:     return freeze(frame);
47:   }
48:   // r100 Phoenix (B5): the three moments that decided the Showdown (js/turningPoints.js, a pure function over the verified
49:   // history this frame was checked against). It sits beside the screen, never between two steps: if the module is missing or
50:   // throws, or its record does not add up to the frame's totals, the Final Winner is drawn exactly as before.
```
### lines 352-458
```javascript
352:   function sfEnsureChip(){return Promise.resolve().then(()=>root.loadRuntimeScript("special-player-chip","js/specialPlayerChip.js",()=>Boolean(root.CareerModeSpecialPlayerChip))).then(()=>root.CareerModeSpecialPlayerChip.ensure()).catch(()=>false);}
353:   function sfGoldenCounts(career){
354:     try{const seam=root.CareerModeCareerScreenSeam,rows=career?.history?.showdowns;if(typeof seam?.goldenShowdownCounts!=="function"||!Array.isArray(rows))return null;
355:       const c=seam.goldenShowdownCounts(rows);return Number.isInteger(c?.daniel)&&Number.isInteger(c?.nik)?{daniel:c.daniel,nik:c.nik}:null;}catch(_){return null;}
356:   }
357:   function standingsFrames(rivalry,career){
358:     const scope=rivalry&&["loading","empty","unavailable","partial","ready"].includes(rivalry.status)?rivalry:{status:"unavailable"};
359:     let current={status:scope.status};
360:     if(scope.status==="unavailable"&&scope.notice==="continue")current.notice="continue";
361:     if(["ready","partial","empty"].includes(scope.status)&&scope.score&&scope.managers){
362:       if(!["daniel","nik"].every(m=>number(scope.score[m])&&scope.managers[m]&&COUNT_FIELDS.every(k=>number(scope.managers[m][k]))))current={status:"unavailable"};
363:       else {current.score={...scope.score};current.managerRecords=Object.fromEntries(["daniel","nik"].map(m=>[m,Object.fromEntries(COUNT_FIELDS.map(k=>[k,scope.managers[m][k]]))]));}
364:       for(const k of ["season","totalSeasons","clubs","coverage"])if(scope[k]!=null)current[k]=scope[k];
365:     }
366:     if(["ready","partial"].includes(current.status)&&!current.managerRecords)current={status:"unavailable"};
367:     let all={status:career&&["loading","empty","unavailable","partial","ready"].includes(career.status)&&!career.interimLabel?career.status:"unavailable"};
368:     // H2 (career truth hunt, as Career Statistics B4): with no finished Showdown nothing counts, so CAREER is the empty career
369:     // message, not LEVEL 0-0. A partial career may hold a finished Showdown it could not read: unavailable, never 0-0.
370:     if(["ready","partial"].includes(all.status)&&["daniel","nik"].every(m=>career.managers?.[m]?.showdowns?.completed===0))all={status:all.status==="ready"?"empty":"unavailable"};
371:     if(["ready","partial"].includes(all.status)&&career.managers&&Array.isArray(career.trophyRoom?.standings)){
372:       const standings={};
373:       for(const m of ["daniel","nik"]){const row=career.trophyRoom.standings.find(r=>r.manager===m),rec=career.managers[m];if(!row||!rec||!["careerPoints","seasonWins"].every(k=>number(row[k]))||!COUNT_FIELDS.every(k=>number(rec[k]))){all={status:"unavailable"};break;}standings[m]={...Object.fromEntries(COUNT_FIELDS.map(k=>[k,rec[k]])),careerPoints:row.careerPoints,seasonWins:row.seasonWins};}
374:       if(all.status!=="unavailable"){all.standings=standings;if(all.status==="partial")all.coverage=career.coverage;}
375:     }
376:     if(["ready","partial"].includes(all.status)&&!all.standings)all={status:"unavailable"};
377:     // r86 Special Player chip: THIS SHOWDOWN shows the live Showdown's, CAREER the most recently confirmed one's (none before r86).
378:     if(current.score){const sp=sfSpecial(chip=>chip.live());if(sp)current.specialPlayers=sp;}
379:     if(all.standings){const sp=sfSpecial(chip=>chip.latest(career.history&&career.history.showdowns));if(sp)all.specialPlayers=sp;}
380:     // r93 (Nik 2026-11-14, Golden everywhere it belongs): CAREER gets a gold GOLDEN SHOWDOWNS row once either manager has one,
381:     // counted from the same History rows by the one rule (js/careerScreenSeam.js goldenShowdownCounts), as Career Statistics.
382:     if(all.standings){const counts=sfGoldenCounts(career);if(counts&&(counts.daniel||counts.nik))all.goldenShowdowns=counts;}
383:     return freeze({SHOWDOWN:{view:"this-showdown",previewLabel:"",model:current},CAREER:{view:"career",previewLabel:"",model:all}});
384:   }
385:   // Reparent original nodes, including the entire review shell. No clone, value write,
386:   // button label change, visibility reset or listener replacement happens here.
387:   function skinSeason(host,stage){
388:     if(host.querySelector(".v10SeasonStage"))return host.querySelector(".v10SeasonStage");
389:     const doc=host.ownerDocument,original=[...host.children];
390:     const title=doc.getElementById("seasonEntryTitle"),grid=host.querySelector(".seasonEntryGrid"),review=doc.getElementById("seasonReviewPanel"),actions=doc.getElementById("completeSeason")?.closest(".seasonEntryActions");
391:     if(!grid||!actions||!review)return null;
392:     stage.classList.add("v10SeasonStage");
393:     const cards=grid.querySelectorAll(".seasonResultCard");
394:     cards.forEach((card,i)=>{card.id=i===0?"daniel-entry-panel":"nik-entry-panel";card.classList.add("entry-panel",i===0?"entry-panel--daniel":"entry-panel--nik","sd-panel");card.dataset.manager=i===0?"daniel":"nik";card.querySelector(".seasonManagerHeader")?.classList.add("manager-card-header");card.querySelector(".achievementChecks")?.classList.add("achievement-fields");card.querySelectorAll("label").forEach(label=>label.classList.add("field-row"));});
395:     stage.querySelector("#v10EntrySlot").replaceWith(grid);stage.querySelector("#v10UnusedEntrySlot").remove();
396:     review.classList.add("season-review-panel","sd-panel");stage.querySelector("#v10ReviewSlot").replaceWith(review);
397:     actions.classList.add("season-action-row");stage.querySelector("#v10EntryActionsSlot").replaceWith(actions);
398:     if(title){title.classList.add("sd-visually-hidden");stage.querySelector("#season-semantic-title").replaceWith(title);}
399:     const layout=stage.querySelector(".season-layout");
400:     // Decorative phone composition only; the legacy form and its controls stay intact.
401:     const scene=doc.createElement("div");scene.className="v10SeasonPhoneScene";scene.setAttribute("aria-hidden","true");
402:     layout.prepend(scene);
403:     // JOB-1599: sealed presentation copies existing tab words, never rival fields.
404:     for(const manager of ["daniel","nik"]){
405:       const tab=stage.querySelector('label[for="season-phone-tab-'+manager+'"]');
406:       if(!tab)continue;
407:       const sealed=doc.createElement("div");sealed.className="v10SeasonTabletSealed v10SeasonTabletSealed--"+manager;
408:       sealed.setAttribute("aria-hidden","true");
409:       sealed.textContent=Array.from(tab.childNodes||tab.children||[]).map(node=>String(node.textContent||"").trim()).filter(Boolean).join("\n");
410:       grid.appendChild(sealed);
411:     }
412:     for(const node of original)if(node.parentNode===host)layout.appendChild(node);
413:     host.appendChild(stage);host.classList.add("seasonScreenV10");
414:     return stage;
415:   }
416:   const templates={},strings={};let installed=false,scheduled=false,signature="",finalSeasonReview=false;
417:   const state=name=>{try{return root[name]?.getState?.()||null;}catch(_){return null;}};
418:   function sfSnapshot(){return {identity:state("CareerModeOnlinePlayerIdentity"),pair:state("CareerModePersistentNikDanielPair"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),history:state("CareerModeProductionSharedHistoryConvergence"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
419:   // CE2PG: once the pair has let a finished Showdown go (Home was shown), it is no longer "this Showdown": the closed Terminal
420:   // Close kept in memory for the Final Winner screen made THIS SHOWDOWN show it until a reload, while every reloaded or new
421:   // browser said "No active showdown". Rivalry Statistics keeps showing the newest finished Showdown on every browser.
422:   function currentRivalry(){
423:     const snapshot=sfSnapshot(),pair=snapshot.pair;
424:     if(pair?.initialized===true&&pair.status==="unpaired"&&!pair.rivalryId&&snapshot.terminalClose?.phase==="CLOSED")snapshot.terminalClose=null;
425:     const view=root.CareerModeSharedActiveShowdownAdapter?.rivalryView(snapshot)||{status:"unavailable"};
426:     // r87 career fixes (lane C C-01): out of the game the live providers never run, so THIS SHOWDOWN says how to load it
427:     // instead of "Loading standings." forever (no read is made for this; in the game nothing changes).
428:     return view.status==="loading"&&!sfLiveCanArrive()?{status:"unavailable",notice:"continue"}:view;
429:   }
430:   function sfLiveCanArrive(){
431:     try{return Boolean(root.CareerModeProductionSharedHistoryConvergence?.isActive?.()&&root.CareerModeProductionSharedShowdownSetup?.getState?.()?.sessionId);}catch(_){return false;}
432:   }
433:   // A supplied model first, then the provider-backed career model shared with Stats, Trophy Room and History.
434:   // CE2PG: Standings only reused the model another screen last read, so opened first it said "unavailable" and
435:   // after a newer Showdown closed it kept the older career. Each Standings open now refreshes that model once
436:   // (the same exact gets Career Statistics makes when it opens); Career says Loading until it lands.
437:   let standingsCareerLoad=null;
438:   function sfOnlineCareer(){const id=state("CareerModeOnlinePlayerIdentity");return id?.registered===true&&["daniel","nik"].includes(id.managerId);}
439:   function refreshStandingsCareer(){
440:     if(standingsCareerLoad||!sfOnlineCareer()||typeof root.loadRuntimeScript!=="function")return;
441:     const load=standingsCareerLoad=Promise.resolve().then(async()=>{
442:       if(!root.CareerModeRivalryLegacyV10)await root.loadRuntimeScript("rivalry-legacy-v10","js/rivalryLegacyV10.js",()=>Boolean(root.CareerModeRivalryLegacyV10));
443:       await root.CareerModeRivalryLegacyV10.loadCareerModel();
444:     }).catch(()=>{}).then(()=>{if(standingsCareerLoad===load)standingsCareerLoad=null;signature="";wake();});
445:   }
446:   function currentCareer(){try{const supplied=typeof careerStatisticsModel!=="undefined"?careerStatisticsModel:null;return supplied??(standingsCareerLoad?{status:"loading"}:root.CareerModeRivalryLegacyV10?.cachedCareerModel?.())??null;}catch(_){return null;}}
447:   // HO-068: Team V's markup still names the plates-v2 phone plate; the Final Winner phone picture is the board room now
448:   // (its 590 px copy at the smallest download size, html[data-assets="0"]).
449:   // r100 B7: the old Season Results phone room, phone managers and desktop hands, and the Final Winner near arms, sit in
450:   // layers that are hidden at every size, tier and fallback (the clubhouse rooms paint both men), so their pictures are
451:   // taken out before the markup is used and the browser never downloads them.
452:   function sfRooms(text){
453:     const lean=root.document?.documentElement?.dataset?.assets==="0";
454:     return text.split("plates-v2/ENV_FINAL_WINNER_PHONE_V2.webp").join("plates-hc/ENV_BOARD_PHONE_HC_V3"+(lean?"_590W":"")+".webp")
455:       .replace(/[ \t]*<source[^>]*(?:OVL_SR_(?:DANIEL|NIK)_(?:HAND_V1_[12]X|PHONE_V1)|ENV_SR_PHONE_V1)\.webp[^>]*>\n?/g,"")
456:       .replace(/ (?:src|srcset)="[^"]*OVL_FW_(?:DANIEL|NIK)_NEAR_ARM_V1_[12]X\.webp[^"]*"/g,"");
457:   }
458:   function stageElement(folder){const holder=root.document.createElement("div");holder.innerHTML=templates[folder];return holder.firstElementChild;}
```
### lines 476-500
```javascript
476:   async function prepare(folder){
477:     if(folder==="season-results"||folder==="final-winner")await sfWarmTrophy();
478:     if(!templates[folder]){const r=await root.fetch(assetUrl(BASE+folder+"/app-shell.html"));if(!r.ok)throw new Error("V10_RESULTS_TEMPLATE");templates[folder]=sfRooms(await r.text());}
479:     if(folder!=="season-results"&&!strings[folder]){const r=await root.fetch(assetUrl(BASE+folder+"/app-strings.json"));if(!r.ok)throw new Error("V10_RESULTS_STRINGS");strings[folder]=(await r.json()).strings;strings[folder].previewLabel="";}
480:   }
481:   // The skin mounts after the legacy form is live and reparents it (and the action row). Moving a focused
482:   // field blurs it, so a value typed at that moment would land on <body>; put focus back on the same field.
483:   function sfKeepFocus(work){
484:     const doc=root.document,active=doc?.activeElement;
485:     try{return work();}finally{if(active&&active!==doc.body&&active.isConnected&&doc.activeElement!==active&&typeof active.focus==="function")active.focus({preventScroll:true});}
486:   }
487:   function restoreFinal(host){
488:     host.querySelector(".v10GoldenStage")?.remove();host.classList.remove("v10GoldenMode");
489:     const final=host.querySelector(".v10FinalStage"),review=root.document.getElementById("seasonReviewPanel"),season=host.querySelector(".v10SeasonStage");
490:     if(final){root.document.getElementById(REMATCH_ID)?.remove();for(const id of ["sharedTerminalClosePanel","sharedFinalReconciliationPanel"]){const n=root.document.getElementById(id);if(n&&review)review.appendChild(n);}const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions&&season)season.querySelector(".season-layout").appendChild(actions);final.v10StageHandle?.destroy();final.remove();}
491:     if(season)season.hidden=false;
492:     host.classList.remove("v10FinalMode");
493:   }
494:   // JOB-1807: return to the existing published-results review without changing provider or Save state.
495:   function reviewFinalSeason(){
496:     const host=root.document?.getElementById("seasonEntry");
497:     if(!host?.querySelector(".v10FinalStage"))return false;
498:     finalSeasonReview=true;restoreFinal(host);return true;
499:   }
500:   // r87 Rematch: one more button in the Final Winner's own exit row (same kit, same row, nothing moves or hides). Daniel's
```
### lines 531-545
```javascript
531:   function renderFinal(host,frame,rematch=null){
532:     if(!frame.winner){restoreFinal(host);return;}
533:     if(frame.golden&&!goldenPassed.has(frame.golden.key)){renderGolden(host,frame,rematch);return;}
534:     let final=host.querySelector(".v10FinalStage");
535:     // A changed frame rebuilds supplementary art only. Live protocol panels move intact. r93: a Golden Showdown screen in
536:     // front of it (SEE FINAL WINNER) goes the same way.
537:     if(final||host.querySelector(".v10GoldenStage"))restoreFinal(host);
538:     final=stageElement("final-winner");final.classList.add("v10FinalStage");host.appendChild(final);
539:     for(const [id,slot] of [["sharedTerminalClosePanel","v10TerminalSlot"],["sharedFinalReconciliationPanel","v10ReconciliationSlot"]]){const live=root.document.getElementById(id);if(live)final.querySelector("#"+slot).appendChild(live);}
540:     const actions=root.document.getElementById("completeSeason")?.closest(".seasonEntryActions");if(actions)final.querySelector("#v10ExitSlot").appendChild(actions);
541:     sfRematchButton(actions,rematch);
542:     const season=host.querySelector(".v10SeasonStage");if(season)season.hidden=true;host.classList.add("v10FinalMode");
543:     root.FINAL_WINNER_ROOT=final;root.FINAL_WINNER_FIXTURES={strings:strings["final-winner"],frames:{LIVE:frame}};root.ShowdownFinalWinnerBoot();
544:     sfSackedMarks(final,frame);
545:     sfTurningMount(final,frame);
```
### lines 3004-3014
```javascript
3004:   function renderSeason(frame,host){
3005:     if(typeof root.ensureSeasonReviewUI==="function")root.ensureSeasonReviewUI();
3006:     let stage=host.querySelector(".v10SeasonStage");
3007:     if(!stage)sfCardRule(root.document);
3008:     if(!stage){stage=skinSeason(host,stageElement("season-results"));if(stage){root.ShowdownSeasonResultsBoot(stage);if(typeof root.MutationObserver==="function"){const watch=new root.MutationObserver(()=>{if(stage.dataset.ownerSet)watch.disconnect();else sfOwnerTab(stage);});stage.querySelectorAll("#daniel-entry-panel,#nik-entry-panel").forEach(card=>watch.observe(card,{attributes:true,attributeFilter:["class"]}));}}}
3009:     if(!stage)return;
3010:     sfOwnerTab(stage);
3011:     sfSeasonChips(stage,frame.specialPlayers);
3012:     sfGoldenCourse(stage,frame.goldenCourse);
3013:     renderFinal(host,frame.final,frame.rematch);
3014:   }
```
### lines 3089-3237
```javascript
3089:   // HO-068: the Standings phone art is the tunnel room. The tall plate for upright screens, the wide plate sideways, 590W on
3090:   // Light or Save-Data; the two cut-outs lose their sources (the plate carries both men), so nothing extra is downloaded.
3091:   function sgRooms(stage){
3092:     const doc=root.document,lean=doc?.documentElement?.dataset?.assets==="0",hc=BASE+"plates-hc/";
3093:     const sources=stage?.querySelectorAll?.(".sdg-phoneBg source")||[];
3094:     if(sources[0]){sources[0].setAttribute("media","(max-width: 900px) and (orientation: portrait)");sources[0].setAttribute("srcset",hc+"ENV_TUNNEL_PHONE_HC_V3"+(lean?"_590W":"")+".webp");}
3095:     if(sources[1])sources[1].setAttribute("srcset",hc+"ENV_TUNNEL_PLATE_HC_V3_1X.webp");
3096:     stage?.querySelectorAll?.(".sdg-phoneHero source").forEach(source=>source.remove());
3097:     return stage;
3098:   }
3099:   function renderStandings(frame,host){
3100:     sfStandingsRule(root.document);
3101:     const selected=host.querySelector('#sdgViewCareer')?.getAttribute("aria-selected")==="true"?"CAREER":"SHOWDOWN";
3102:     host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren(sgRooms(stageElement("standings")));host.classList.add("standingsScreenV10");
3103:     root.STANDINGS_ROOT=host.firstElementChild;root.STANDINGS_QS="frame="+selected;root.STANDINGS_FIXTURES={strings:strings.standings,frames:frame};root.ShowdownStandingsBoot();
3104:   }
3105:   // Register the new optional route lazily. Startup files and existing gameplay gates do not change.
3106:   function installStandingsRoute(){
3107:     try{if(typeof screens!=="undefined"&&!screens.includes("standings"))screens.push("standings");}catch(_){}
3108:     const valid=root.isRouteStateValid;
3109:     if(typeof valid==="function"&&!valid.v10Standings){const wrapped=function(id){return id==="standings"||valid.apply(this,arguments);};wrapped.v10Standings=true;wrapped.original=valid;root.isRouteStateValid=wrapped;}
3110:     root.CareerModeV10Screens.setNavRoute("standings",async app=>{let host=root.document.getElementById("standings");if(!host){host=root.document.createElement("section");host.id="standings";host.className="screen hidden";host.setAttribute("aria-label","Standings");root.document.querySelector("#app main").appendChild(host);}return app.navigateTo("standings");});
3111:   }
3112:   // r76: BACK TO SHOWDOWN HOME on the Showdown Champion screen is the shared smart back of #seasonEntry, whose legal
3113:   // targets are dashboard then mainMenu. Once a season was entered from the dashboard (after a reload or a CONTINUE CAREER
3114:   // from Home), the history walk found the dashboard first. In final mode the only target is Showdown Home. The other
3115:   // #seasonEntry modes keep their targets; the startup screens.js stays unchanged (startup byte budget).
3116:   function installChampionBack(app=root){
3117:     const legal=app.getLegalBackTargets;
3118:     if(typeof legal!=="function"||legal.v10Champion)return false;
3119:     // r93: the Golden Showdown screen comes before Final Winner in the same final mode, so its back is the same.
3120:     const wrapped=function(id){const list=id==="seasonEntry"?app.document?.getElementById("seasonEntry")?.classList:null;return list&&(list.contains("v10FinalMode")||list.contains("v10GoldenMode"))?["mainMenu"]:legal.apply(this,arguments);};
3121:     wrapped.v10Champion=true;wrapped.original=legal;app.getLegalBackTargets=wrapped;return true;
3122:   }
3123:   // JOB-1038: Terminal Close forgets the session, which clears the live history view. The last converged view of the same
3124:   // rivalry is kept so the closed Final Winner still shows the final season and trophies; finalFrame re-verifies it.
3125:   let retainedHistory=null;
3126:   function sfRetainHistory(history){if(history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.projection)retainedHistory=history;return history;}
3127:   // JOB-1042: the rival can close before this phone's live history converges. Reuse the session-free,
3128:   // completed-only reader per closed rivalry; the partial Final Winner stays visible during the read.
3129:   const closedHistoryReads=new Map(),CLOSED_HISTORY_MAX_ATTEMPTS=6;
3130:   // JOB-1811: previous-season convergence must not suppress the completed read after the rival closes.
3131:   const sfConverged=(history,closed)=>history?.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&history.rivalryId===closed.rivalryId&&history.projection&&closed.terminalWitness&&closedHistoryBound(history.projection,closed.terminalWitness);
3132:   function sfClosedHistory(rivalryId){
3133:     if(!closedHistoryReads.has(rivalryId))closedHistoryReads.set(rivalryId,{history:null,promise:null,retryAt:0,attempts:0,retryTimer:null});
3134:     const entry=closedHistoryReads.get(rivalryId);
3135:     // r86 (red team #7): a failure stored in the game itself stops the retries, and the rest stop after six attempts (about a
3136:     // minute of backoff); the partial Final Winner stays on screen either way.
3137:     if(!entry.history&&!entry.promise&&!entry.stopped&&Date.now()>=entry.retryAt&&(!entry.attempts||sfDetailsVisible())){
3138:       entry.attempts++;
3139:       entry.promise=Promise.resolve().then(async()=>{
3140:         if(!root.CareerModeSparkCompletedShowdownReader)await root.loadRuntimeScript("career-completed-reader","js/sparkCompletedShowdownReader.js",()=>Boolean(root.CareerModeSparkCompletedShowdownReader));
3141:         const runtime=root.CareerModeProductionFirebaseRuntime,account=state("CareerModeSparkConnectedAccount");
3142:         if(!account?.connected||!runtime)return;
3143:         const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
3144:         if(!services?.ok||!user||user.uid!==account.accountId)return;
3145:         const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
3146:         const result=await root.CareerModeSparkCompletedShowdownReader.readCompletedShowdown({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc},user,rivalryId});
3147:         if(result?.status==="completed"&&result.rivalryId===rivalryId&&result.projection)entry.history={authoritative:true,phase:"HISTORY_CONVERGED",rivalryId,projection:result.projection,setupConfirmedAt:Number.isFinite(result.setupConfirmedAt)?result.setupConfirmedAt:null};
3148:         else if(root.CareerModeSparkCompletedShowdownReader.permanentFailure?.(result)===true)entry.stopped=true;
3149:       }).catch(()=>{}).then(()=>{entry.promise=null;if(!entry.history&&entry.attempts>=CLOSED_HISTORY_MAX_ATTEMPTS)entry.stopped=true;entry.retryAt=Date.now()+Math.min(30000,1000*2**Math.min(entry.attempts-1,5));wake();});
3150:     }
3151:     return closedHistoryReads.get(rivalryId).history;
3152:   }
3153:   // A failed detail read is retryable. Coalesce reconnect/visible events, respect backoff even
3154:   // when recovery arrives during the read, and keep successful immutable history for this page.
3155:   const sfDetailsVisible=()=>root.document?.visibilityState!=="hidden"&&root.navigator?.onLine!==false&&root.getActiveScreenName?.()==="seasonEntry";
3156:   async function sfRetryClosedHistory(){
3157:     if(!sfDetailsVisible())return;
3158:     const closed=state("CareerModeProductionSharedTerminalClose"),entry=closedHistoryReads.get(closed?.rivalryId);
3159:     if(closed?.phase!=="CLOSED"||!entry)return;
3160:     await entry.promise;
3161:     if(entry.history||entry.stopped||entry.retryTimer!==null||!sfDetailsVisible())return;
3162:     entry.retryTimer=root.setTimeout(()=>{entry.retryTimer=null;if(sfDetailsVisible()&&state("CareerModeProductionSharedTerminalClose")?.rivalryId===closed.rivalryId)wake();},Math.max(0,entry.retryAt-Date.now()));
3163:   }
3164:   let sfGazetteHistory=null;
3165:   function seasonSource(){
3166:     const s=sfSnapshot(),live=sfRetainHistory(s.history),closed=s.terminalClose?.phase==="CLOSED"?s.terminalClose:null;
3167:     const history=closed?.terminal===true?(sfConverged(live,closed)?live:sfConverged(retainedHistory,closed)?retainedHistory:sfClosedHistory(closed.rivalryId)):live;
3168:     const final=finalSeasonReview?{status:"unavailable"}:finalFrame(s.finalReconciliation,s.terminalClose,history);
3169:     // r87 Touchline Gazette: the FINAL edition prints from the same verified history this Final Winner was drawn from.
3170:     sfGazetteHistory=final.status==="ready"?history:null;
3171:     const rematch=rematchFrame(final,closed,s.identity);
3172:     // r86 Special Player chip: the live Setup's confirm time, or after close the finished Showdown's own (kept by its read).
3173:     const rid=s.finalReconciliation?.rivalryId||closed?.rivalryId||null,read=closed?closedHistoryReads.get(closed.rivalryId)?.history:null;
3174:     const sp=sfSpecial(chip=>chip.liveFor(rid)||(rid&&read&&Number.isFinite(read.setupConfirmedAt)?chip.forShowdown(rid,read.setupConfirmedAt,{playerOne:read.projection?.managerRecords?.playerOne?.club,playerTwo:read.projection?.managerRecords?.playerTwo?.club}):null));
3175:     if(!sp)return {final,rematch};
3176:     return {final:final.winner?freeze({...final,specialPlayers:sp}):final,specialPlayers:sp,rematch};
3177:   }
3178:   // r93 part C: Season Results also carries the ON COURSE FOR GOLDEN chip, from the live Showdown's verified history only
3179:   // (never a closed Showdown's; the kept one only for the same live Showdown at the same accepted season, below).
3180:   // r93 hunt C1: once a season is saved the history view is cleared as the cursor moves on, so the next season's entry form
3181:   // has no live history. It keeps the last converged history of the same Showdown (sfRetainHistory, this page's memory), but
3182:   // only while the shared progression still counts exactly the seasons it covers: nothing new is told, nothing stale is kept.
3183:   function sfCourseHistory(s){
3184:     const live=s.history;if(live?.authoritative===true&&live.phase==="HISTORY_CONVERGED")return live;
3185:     const kept=retainedHistory,multi=s.multiSeason,rid=String(multi?.rivalryId||"");
3186:     if(!kept||!rid||multi?.authoritative!==true||multi.phase!=="SEASON_READY"||multi.state?.rivalryId!==rid||String(kept.rivalryId||"")!==rid)return null;
3187:     return Number(multi.state.acceptedSeasons)===Number(kept.throughSeason)?kept:null;
3188:   }
3189:   function seasonScreenSource(){
3190:     const source=seasonSource(),s=sfSnapshot(),course=s.terminalClose?.phase==="CLOSED"?null:goldenCourse(sfCourseHistory(s));
3191:     return course?{...source,goldenCourse:course}:source;
3192:   }
3193:   // The pair module notifies only its own subscribers (no window event), so Standings follows pairing
3194:   // and closure through it. It may load after this file, so each screen change retries once until bound.
3195:   let pairBound=false;
3196:   function followPair(){if(pairBound)return;try{const api=root.CareerModePersistentNikDanielPair;if(typeof api?.subscribe==="function"){api.subscribe(()=>wake());pairBound=true;}}catch(_){}}
3197:   function wake(){
3198:     if(scheduled)return;scheduled=true;root.setTimeout(()=>{scheduled=false;const screen=root.getActiveScreenName?.();if(!["seasonEntry","standings"].includes(screen))return;
3199:       const source=screen==="seasonEntry"?seasonScreenSource():standingsFrames(currentRivalry(),currentCareer());
3200:       const next=screen+JSON.stringify(source);if(next===signature)return;signature=next;root.CareerModeV10Screens.invalidate(screen);root.CareerModeV10Screens.show(screen).catch(fail);
3201:     },0);
3202:   }
3203:   // Use the existing active adapter for acknowledged public counters. No provider read is added.
3204:   // Loaded only when Standings opens: these files are not in the offline shell, and a failed load at
3205:   // install would also leave Season Results without its listeners.
3206:   // r93: the career seam too, so the CAREER Golden Showdowns row is there when Standings is the first career screen after a reload.
3207:   async function standingsModules(){
3208:     const load=root.loadRuntimeScript;
3209:     for(const [key,p,api] of [["career-history","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],["career-analytics","js/sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics"],["career-terminal","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],["career-final","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"],["career-active-adapter","js/sharedActiveShowdownAdapter.js","CareerModeSharedActiveShowdownAdapter"],["visual-identity","js/visualIdentity.js","getClubCrestSvg"],["career-screen-seam","js/careerScreenSeam.js","CareerModeCareerScreenSeam"]])await load(key,p,()=>Boolean(root[api]));
3210:   }
3211:   async function installResults(){
3212:     if(installed)return true;installed=true;
3213:     root.SEASON_RESULTS_APP=true;root.FINAL_WINNER_APP=true;root.STANDINGS_APP=true;
3214:     const loader=root.CareerModeV10Screens.install();
3215:     loader.register("seasonEntry",{auto:false,hold:true,css:["season-results/season-results.css","final-winner/final-winner.css","season-results/app.css"],js:[["v10-season-results","season-results/season-results.js",()=>typeof root.ShowdownSeasonResultsBoot==="function"],["v10-final-winner","final-winner/final-winner.js",()=>typeof root.ShowdownFinalWinnerBoot==="function"]],prepare:()=>Promise.all([prepare("season-results"),prepare("final-winner"),sfEnsureChip(),sfEnsureTurning()]),frame:seasonScreenSource,mount:(frame,host)=>sfKeepFocus(()=>renderSeason(frame,host)),unmount:host=>sfKeepFocus(()=>{finalSeasonReview=false;restoreFinal(host);})});
3216:     loader.register("standings",{auto:false,hold:true,css:["standings/standings.css","season-results/app.css"],js:[["v10-standings","standings/standings.js",()=>typeof root.ShowdownStandingsBoot==="function"]],prepare:()=>Promise.all([prepare("standings"),standingsModules(),sfEnsureChip()]),frame:()=>standingsFrames(currentRivalry(),currentCareer()),mount:renderStandings,unmount(host){host.firstElementChild?.v10StageHandle?.destroy();host.replaceChildren();}});
3217:     installStandingsRoute();installChampionBack();
3218:     // r87 Touchline Gazette: its own page after Season Results (CONTINUE TO SEASON N+1) and after Final Winner (its exits).
3219:     // Small and loaded here with the screens it follows; its paper, sheet and copy load only when a paper is due.
3220:     // r91: Commentary v3's lines print in the Touchline Gazette ("From the commentary box"), which loads the booth itself;
3221:     // Season Results and Final Winner no longer carry a commentary bar (Nik 2026-11-11 picked the paper).
3222:     Promise.resolve().then(()=>root.loadRuntimeScript("touchline-gazette","js/touchlineGazette.js",()=>Boolean(root.CareerModeTouchlineGazette))).then(()=>root.CareerModeTouchlineGazette?.install?.()).catch(error=>root.console?.warn?.("[Career Mode Showdown] Touchline Gazette unavailable.",error));
3223:     // Warm Season Results' kit, scripts and templates now (show() loads, then returns false while the screen is hidden),
3224:     // so the skin mounts in the same tick the screen opens instead of after the form is already being filled in.
3225:     if(typeof loader.show==="function")Promise.resolve(loader.show("seasonEntry")).catch(fail);
3226:     for(const e of ["career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-multi-season-state-change","career-mode-online-identity-change","career-mode-active-save-changed","career-mode-showdown-state-change","career-mode-online-career-model-change"])root.addEventListener?.(e,wake);
3227:     root.addEventListener?.("career-mode-shared-history-convergence-state-change",()=>sfRetainHistory(state("CareerModeProductionSharedHistoryConvergence")));
3228:     root.addEventListener?.("online",sfRetryClosedHistory);
3229:     root.document.addEventListener("visibilitychange",sfRetryClosedHistory);
3230:     root.document.addEventListener("career-mode-screen-shown",()=>{signature="";followPair();if(root.getActiveScreenName?.()==="standings")refreshStandingsCareer();wake();});
3231:     followPair();
3232:     wake();return true;
3233:   }
3234:   // Phoenix W5: a new Showdown (or the ended one let go on Home) puts this module's Showdown data back to a fresh page's (the reset in js/persistentNikDanielPair.js).
3235:   try{(root.CareerModeShowdownClears||(root.CareerModeShowdownClears={}))["showdown-champion"]=()=>{retainedHistory=null;sfGazetteHistory=null;};}catch(_error){}
3236:   return Object.freeze({finalFrame,goldenCourse,goldenCourseChips:sfGoldenCourse,goldenScreenMarkup:goldenMarkup,seasonScreenSource,rematchFrame,standingsFrames,skinSeason,reviewFinalSeason,installChampionBack,gazetteHistory:()=>sfGazetteHistory,install:installResults});
3237: });
```

## FILE: js/sharedActiveShowdownAdapter.js (181 lines in total)
### lines 1-181
```javascript
1: (function(root,factory){
2:   const node=typeof module!=="undefined"&&module.exports;
3:   const api=factory(node?require("./sharedHistoryConvergence.js"):root.CareerModeSharedHistoryConvergence,node?require("./sharedCareerAnalytics.js"):root.CareerModeSharedCareerAnalytics,node?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose,node?require("./sharedFinalReconciliation.js"):root.CareerModeSharedFinalReconciliation);
4:   if(node)module.exports=api;else root.CareerModeSharedActiveShowdownAdapter=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(History,Career,Terminal,Final){
6:   "use strict";
7:   const ROLES=Object.freeze(["playerOne","playerTwo"]),MANAGERS=Object.freeze(["daniel","nik"]);
8:   const COUNTERS=Object.freeze(["seasonWins","seasonDraws","seasonLosses","championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"]);
9:   const INPUTS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
10:   const TRANSIENT=Object.freeze(["idle","starting","joining","continuing","retrying-link","abandoning","pair-link-retry"]);
11:   const FAILED=Object.freeze(["signed-out","unavailable","error","save-required"]);
12:   const COUNTED=Object.freeze(["active","completion-pending","completed"]);
13:   function asdPlain(x){return Boolean(x)&&typeof x==="object"&&!Array.isArray(x);}
14:   // The projection is borrowed by identity. Freeze only objects this adapter owns.
15:   function asdFreeze(value,borrowed=null){if(value===borrowed)return value;if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(v=>asdFreeze(v,borrowed));Object.freeze(value);}return value;}
16:   function manager(role){return role==="playerOne"?"daniel":role==="playerTwo"?"nik":role==="draw"?"draw":null;}
17:   function managerId(id){return MANAGERS.includes(id)?id:null;}
18:   function pairValues(a,b){return {daniel:a,nik:b};}
19:   const PERFECT_SEASON=15;
20:   function perfectSeasons(p,role){return p.seasonHistory.filter(item=>item?.[role]?.scoring?.total===PERFECT_SEASON).length;}
21:   function finalFor(p){const playerOne=p.managerRecords.playerOne.totalPoints,playerTwo=p.managerRecords.playerTwo.totalPoints;return {totals:{playerOne,playerTwo},winner:playerOne>playerTwo?"playerOne":playerTwo>playerOne?"playerTwo":"draw"};}
22:   function inspect(snapshot){
23:     const s=asdPlain(snapshot)?snapshot:{},pair=asdPlain(s.pair)?s.pair:null,identity=asdPlain(s.identity)?s.identity:null;
24:     const close=asdPlain(s.terminalClose)?s.terminalClose:null;
25:     const rid=typeof pair?.rivalryId==="string"?pair.rivalryId:close?.phase==="CLOSED"&&typeof close.rivalryId==="string"?close.rivalryId:null;
26:     const viewer=identity?.status==="ready"&&managerId(identity.managerId)||managerId(pair?.managerId);
27:     let multi=asdPlain(s.multiSeason)&&s.multiSeason.ok===true&&s.multiSeason.authoritative===true&&s.multiSeason.rivalryId===rid&&asdPlain(s.multiSeason.state)?s.multiSeason:null;
28:     const history=asdPlain(s.history)&&s.history.rivalryId===rid?s.history:null;
29:     let p=null,invalid=false,witness=null,zero=false,fromProgression=false,historyAhead=false;
30:     if(history){
31:       try{
32:         if(history.ok!==true||history.authoritative!==true||history.phase!=="HISTORY_CONVERGED")throw new Error("HISTORY_NOT_AUTHORITATIVE");
33:         const candidate=History.verifyProjection(history.projection);
34:         if(candidate.rivalryId!==rid)throw new Error("HISTORY_RIVALRY_MISMATCH");
35:         historyAhead=Boolean(multi&&candidate.acceptedSeasons>multi.state.acceptedSeasons);
36:         if(!multi||candidate.acceptedSeasons===multi.state.acceptedSeasons){
37:           if(multi&&(candidate.acceptedRevisionKey!==multi.state.acceptedRevisionKey||candidate.leagueId!==multi.state.leagueId||candidate.totalSeasons!==multi.state.totalSeasons||candidate.managerRecords.playerOne.club!==multi.state.fixedClubs?.playerOne||candidate.managerRecords.playerTwo.club!==multi.state.fixedClubs?.playerTwo))throw new Error("HISTORY_AUTHORITY_MISMATCH");
38:           p=candidate;
39:         }
40:       }catch(_error){invalid=true;}
41:     }
42:     // Progression already read the accepted commits, even when the History screen
43:     // cache is absent or lags. Reuse that verified projection without another read.
44:     // Only when History is absent or behind: a newer History waits for progression to catch up.
45:     if(!p&&!invalid&&!historyAhead&&multi?.projection){
46:       try{
47:         const candidate=History.verifyProjection(multi.projection);
48:         if(candidate.rivalryId!==rid||candidate.acceptedSeasons!==multi.state.acceptedSeasons||candidate.acceptedRevisionKey!==multi.state.acceptedRevisionKey||candidate.leagueId!==multi.state.leagueId||candidate.totalSeasons!==multi.state.totalSeasons||candidate.managerRecords.playerOne.club!==multi.state.fixedClubs?.playerOne||candidate.managerRecords.playerTwo.club!==multi.state.fixedClubs?.playerTwo)throw new Error("HISTORY_AUTHORITY_MISMATCH");
49:         p=candidate;fromProgression=true;
50:       }catch(_error){invalid=true;}
51:     }
52:     let classification;
53:     if(close?.phase==="CLOSED"&&close.rivalryId===rid){
54:       try{
55:         if(close.terminal!==true||invalid)throw new Error("CLOSE_INVALID");
56:         witness=Terminal.verifyIntent(close.terminalWitness);
57:         if(witness.rivalryId!==rid)throw new Error("CLOSE_AUTHORITY_MISMATCH");
58:         // r93 U1 (HUNT_AREAS_3_5): a phone hidden when the final season is locked keeps its season view one season behind (no
59:         // refresh while hidden, and none can run once the Showdown is closed), so its projection stops short of the witness.
60:         // Only that case drops the projection and the stale season view: the same Showdown, the same length, a Showdown the
61:         // projection itself says is still running, and no total above the witness's (points never go down). The page then
62:         // stands exactly where an app reopen puts it: completed from the witness, the finished career read for the rest.
63:         // A projection level with or AHEAD of the witness, or any other difference, still fails closed below.
64:         if(p&&p.acceptedSeasons<witness.completedSeason&&p.totalSeasons===witness.totalSeasons&&p.acceptedSeasons<History.showdownEnd.ofProjection(p).finalSeason&&p.managerRecords.playerOne.totalPoints<=witness.managerTotals.playerOne&&p.managerRecords.playerTwo.totalPoints<=witness.managerTotals.playerTwo&&(!multi||multi.state.acceptedSeasons===p.acceptedSeasons)){p=null;multi=null;fromProgression=false;}
65:         if((p&&(p.acceptedSeasons!==witness.completedSeason||p.totalSeasons!==witness.totalSeasons||p.managerRecords.playerOne.totalPoints!==witness.managerTotals.playerOne||p.managerRecords.playerTwo.totalPoints!==witness.managerTotals.playerTwo)))throw new Error("CLOSE_AUTHORITY_MISMATCH");
66:         classification="completed";
67:       }catch(_error){witness=null;classification="unavailable";}
68:     }else if(!pair||pair.initialized!==true||TRANSIENT.includes(pair.status))classification="loading";
69:     else if(FAILED.includes(pair.status)||(identity?.status==="ready"&&pair.managerId!=null&&identity.managerId!==pair.managerId))classification="unavailable";
70:     else if(pair.rivalryId!=null&&typeof pair.rivalryId!=="string")classification="unavailable";
71:     else if(pair.status==="unpaired"||rid===null)classification="none";
72:     else if(pair.connectionState==="pending-pair")classification="pending";
73:     else if(pair.connectionState==="closed")classification="abandoned";
74:     else if(pair.connectionState!=="active")classification="unavailable";
75:     else if(invalid)classification="unavailable";
76:     // r89 Sacked: the history's final season is the sacked one when a manager was sacked, else the planned length.
77:     else if(p&&p.acceptedSeasons===History.showdownEnd.ofProjection(p).finalSeason&&(!multi||multi.phase==="SHOWDOWN_COMPLETE")){
78:       classification="completion-pending";
79:       const final=s.finalReconciliation;
80:       if(asdPlain(final)&&final.rivalryId===rid&&final.phase==="FINAL_SEASON_RECONCILED"){
81:         try{
82:           const verified=Final.verifyProjection(final),expected=finalFor(p);
83:           if(verified.acceptedRevisionKey!==p.acceptedRevisionKey||verified.managerTotals.playerOne!==expected.totals.playerOne||verified.managerTotals.playerTwo!==expected.totals.playerTwo||verified.winner!==expected.winner)throw new Error("FINAL_AUTHORITY_MISMATCH");
84:         }catch(_error){classification="unavailable";}
85:       }
86:     }else if(p)classification="active";
87:     else if(!history&&multi?.state.acceptedSeasons===0){classification="active";zero=true;}
88:     else classification="loading";
89:     return {s,pair,rid,viewer,multi,p,witness,classification,zero,fromProgression};
90:   }
91:   function home(c){
92:     const {pair,viewer,multi,p,classification,zero}=c;
93:     // A closed rivalry is no live pair (live pairReadPairLink returns null for it, so Home offers a fresh start).
94:     const state=pair?.connectionState==="closed"?"unpaired":["paired","waiting","recovery-required","unpaired"].includes(pair?.status)?pair.status:null;
95:     const m=["paired","recovery-required"].includes(state)?multi?.state:null;
96:     const text=x=>typeof x==="string"?x:null,num=x=>Number.isInteger(x)?x:null;
97:     return {status:classification==="loading"?"loading":classification==="unavailable"?"unavailable":"ready",viewerRole:viewer,continue:{state,leagueId:text(m?.leagueId),clubs:m&&typeof m.fixedClubs?.playerOne==="string"&&typeof m.fixedClubs?.playerTwo==="string"?pairValues(m.fixedClubs.playerOne,m.fixedClubs.playerTwo):null,season:num(m?.activeSeason??(m?.terminal?m.completedSeason:null)),totalSeasons:num(m?.totalSeasons),score:COUNTED.includes(classification)&&p?pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints):zero?pairValues(0,0):null}};
98:   }
99:   function rivalry(c){
100:     const {classification,p,multi,zero}=c;
101:     const ready=COUNTED.includes(classification)&&p,empty=["none","pending","abandoned"].includes(classification)||zero;
102:     const status=ready?"ready":empty?"empty":classification==="loading"?"loading":"unavailable";
103:     const v={status,leagueId:null,clubs:null,season:null,totalSeasons:null,score:null,managers:null,seasons:[],transfers:{status:"unavailable"}};
104:     if(ready){
105:       v.leagueId=p.leagueId;v.clubs=pairValues(p.managerRecords.playerOne.club,p.managerRecords.playerTwo.club);v.totalSeasons=p.totalSeasons;
106:       const end=History.showdownEnd.ofProjection(p);
107:       v.season=classification==="completed"||p.acceptedSeasons===end.finalSeason?end.finalSeason:multi?.state.activeSeason??p.acceptedSeasons+1;
108:       v.score=pairValues(p.managerRecords.playerOne.totalPoints,p.managerRecords.playerTwo.totalPoints);
109:       // r87 (Nik 2026-11-01): a perfect season is 15. The History projection still counts 11 or more (its records are
110:       // rebuilt and compared byte for byte, and older Firebase summaries hold them), so this view counts the 15s itself.
111:       v.managers=Object.fromEntries(ROLES.map((role,i)=>[MANAGERS[i],Object.fromEntries(COUNTERS.map(key=>[key,key==="perfectSeasons"?perfectSeasons(p,role):p.managerRecords[role][key]]))]));
112:       v.seasons=p.seasonHistory.map(item=>({season:item.roundNumber,score:pairValues(item.playerOne.scoring.total,item.playerTwo.scoring.total),winner:manager(item.winner),leaguePosition:pairValues(item.playerOne.leaguePosition,item.playerTwo.leaguePosition),leaguePoints:pairValues(item.playerOne.leaguePoints,item.playerTwo.leaguePoints),leagueGoals:pairValues(item.playerOne.leagueGoals,item.playerTwo.leagueGoals)}));
113:     }else if(empty){
114:       v.managers=Object.fromEntries(MANAGERS.map(id=>[id,Object.fromEntries(COUNTERS.map(key=>[key,key==="bestSeasonScore"?null:0]))]));
115:       if(zero){const m=multi.state;v.leagueId=typeof m.leagueId==="string"?m.leagueId:null;v.clubs=typeof m.fixedClubs?.playerOne==="string"&&typeof m.fixedClubs?.playerTwo==="string"?pairValues(m.fixedClubs.playerOne,m.fixedClubs.playerTwo):null;v.season=Number.isInteger(m.activeSeason)?m.activeSeason:null;v.totalSeasons=Number.isInteger(m.totalSeasons)?m.totalSeasons:null;v.score=pairValues(0,0);}
116:     }
117:     return v;
118:   }
119:   function inputs(result){
120:     if(!asdPlain(result))return null;
121:     if(INPUTS.slice(0,3).some(key=>!Number.isInteger(result[key]))||INPUTS.slice(3).some(key=>typeof result[key]!=="boolean"))return null;
122:     // r80 Europa League: the stored result carries europaLeague only when that manager won it; this view (never hashed) always shows it.
123:     return {...Object.fromEntries(INPUTS.map(key=>[key,result[key]])),europaLeague:result.europaLeague===true};
124:   }
125:   function breakdown(result){const s=result.scoring;return {championsLeague:s.championsLeague,europaLeague:s.europaLeague||0,leagueTitle:s.leagueTitle,domesticCup:s.domesticCup,performanceBonus:s.performanceBonus,awardsBonus:s.individualAwardsBonus,total:s.total};}
126:   function results(c,options){
127:     const source=asdPlain(c.s.seasonResults)&&c.s.seasonResults.rivalryId===c.rid?c.s.seasonResults:null;
128:     const requested=asdPlain(options)?options.season:null;
129:     const season=requested??source?.seasonNumber??c.multi?.state.activeSeason??null;
130:     const v={status:"loading",season:Number.isInteger(season)?season:null,phase:null,viewerRole:c.viewer,inputs:{daniel:null,nik:null},breakdown:null,winner:null,tiebreak:null};
131:     const role=c.pair?.managerRole;
132:     if(c.classification==="unavailable"||(source&&(!ROLES.includes(role)||source.managerRole!==role))){return {status:"unavailable",season:null,phase:null,viewerRole:null,inputs:null,breakdown:null,winner:null,tiebreak:null};}
133:     if(!COUNTED.includes(c.classification)&&c.classification!=="loading")return v;
134:     if(c.classification==="loading"&&c.pair?.connectionState!=="active")return v;
135:     const committed=c.p?.seasonHistory.find(item=>item.roundNumber===season);
136:     if(committed){v.phase="committed";v.inputs=pairValues(inputs(committed.playerOne),inputs(committed.playerTwo));v.breakdown=pairValues(breakdown(committed.playerOne),breakdown(committed.playerTwo));v.winner=manager(committed.winner);v.tiebreak=Career.seasonTiebreak(committed);}
137:     else if(source&&source.seasonNumber===season&&source.ok===true&&ROLES.includes(role)){
138:       const state=source.state;
139:       if(state?.phase==="RESULTS_READY"&&inputs(source.allResults?.playerOne)&&inputs(source.allResults?.playerTwo)){
140:         v.phase="results-ready";v.inputs=pairValues(inputs(source.allResults.playerOne),inputs(source.allResults.playerTwo));
141:       }else if(state?.phase==="COLLECTING"&&Array.isArray(state.publishedRoles)&&state.publishedRoles.includes(role)){
142:         v.phase="waiting-for-rival";v.inputs[manager(role)]=inputs(source.ownResult);
143:       }else v.phase="entering";
144:     }
145:     if(v.phase)v.status="ready";
146:     return v;
147:   }
148:   function winner(c){
149:     const {classification,p,witness}=c;
150:     const v={status:["none","pending","active","abandoned"].includes(classification)?"empty":classification==="loading"?"loading":"unavailable",state:null,totals:null,winner:null,margin:null,seasonsPlayed:null,trophies:null};
151:     if(!["completion-pending","completed"].includes(classification))return v;
152:     const totals=classification==="completed"?witness.managerTotals:finalFor(p).totals;
153:     v.status=p?"ready":"partial";v.state=classification;v.totals=pairValues(totals.playerOne,totals.playerTwo);v.winner=totals.playerOne>totals.playerTwo?"daniel":totals.playerTwo>totals.playerOne?"nik":"draw";v.margin=Math.abs(totals.playerOne-totals.playerTwo);v.seasonsPlayed=p?p.acceptedSeasons:witness.completedSeason;
154:     if(p)v.trophies=Object.fromEntries(ROLES.map((role,i)=>{const r=p.managerRecords[role];return [MANAGERS[i],{championsLeague:r.championsLeagues,europaLeague:r.europaLeagues,leagueTitles:r.leagueTitles,domesticCups:r.domesticCups,total:r.totalTrophies}];}));
155:     return v;
156:   }
157:   function career(c){
158:     // The progression fallback feeds live standings only. Career screens see what r75 saw
159:     // without it: no projection, so a live Showdown stays loading and other states keep theirs.
160:     if(c.fromProgression)c={...c,p:null,classification:["active","completion-pending"].includes(c.classification)?"loading":c.classification};
161:     const {classification,rid,p,zero}=c;
162:     const indexStatus=["loading","unavailable"].includes(classification)?classification:"ready",showdowns=[];
163:     if(indexStatus==="ready"&&classification!=="none"&&!zero){
164:       if(classification==="completed"&&!p)showdowns.push({rivalryId:rid,classification:"unavailable",projection:null,final:null});
165:       else showdowns.push({rivalryId:rid,classification,projection:COUNTED.includes(classification)?p:null,final:["completion-pending","completed"].includes(classification)?finalFor(p):null});
166:     }
167:     // Keep the current identity even when its projection has not loaded, so career
168:     // history can isolate that uncertainty from other indexed Showdowns.
169:     return {indexStatus,showdowns,currentShowdownOnly:true,...(indexStatus!=="ready"&&rid?{currentRivalryId:rid}:{})};
170:   }
171:   function fallback(){return {s:{},pair:null,rid:null,viewer:null,multi:null,p:null,witness:null,classification:"unavailable",zero:false};}
172:   function asdContext(s){try{return inspect(s);}catch(_error){return fallback();}}
173:   function buildActiveShowdownViews(s){const c=asdContext(s);try{return asdFreeze({classification:c.classification,home:home(c),rivalry:rivalry(c),seasonResults:results(c),finalWinner:winner(c),careerInput:career(c)},c.p);}catch(_error){const f=fallback();return asdFreeze({classification:f.classification,home:home(f),rivalry:rivalry(f),seasonResults:results(f),finalWinner:winner(f),careerInput:career(f)});}}
174:   function classifyCurrentShowdown(s){return asdContext(s).classification;}
175:   function homeView(s){return buildActiveShowdownViews(s).home;}
176:   function rivalryView(s){return buildActiveShowdownViews(s).rivalry;}
177:   function finalWinnerView(s){return buildActiveShowdownViews(s).finalWinner;}
178:   function careerInput(s){return buildActiveShowdownViews(s).careerInput;}
179:   function seasonResultsView(s,options={}){const c=asdContext(s);try{return asdFreeze(results(c,options));}catch(_error){return asdFreeze(results(fallback()));}}
180:   return Object.freeze({buildActiveShowdownViews,classifyCurrentShowdown,homeView,rivalryView,seasonResultsView,finalWinnerView,careerInput});
181: });
```

## FILE: js/rivalryLegacyV10.js (478 lines in total)
### lines 1-16
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeRivalryLegacyV10=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7:   // JOB-28: pure, read-only frames for Team V's current rivalry and completed History.
8:   const node=typeof module!=="undefined"&&module.exports;
9:   const seam=()=>node?require("./careerScreenSeam.js"):root.CareerModeCareerScreenSeam;
10:   // Shell-cached Team V files live under the runtime ?v= URL, so fetch them the same way (offline first launch).
11:   const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
12:   const BASE="visual-assets/v10_1/",ORDER=["daniel","nik"],STATES=["loading","empty","unavailable","partial","ready"];
13:   const FIELDS=["seasonWins","seasonDraws","seasonLosses","championsLeagues","leagueTitles","domesticCups","totalTrophies","hundredPointSeasons","hundredGoalSeasons","topScorerSeasons","topAssistSeasons","perfectSeasons","bestSeasonScore"];
14:   const finite=x=>typeof x==="number"&&Number.isFinite(x);
15:   const pair=x=>x&&ORDER.every(k=>finite(x[k]));
16:   const copy=x=>JSON.parse(JSON.stringify(x));
```
### lines 96-125
```javascript
96:   function rlTimeoutError(){const error=new Error("The connection was too slow. It tries again by itself when you are back online.");error.code=TIMEOUT_CODE;return error;}
97:   const load=(key,file,global)=>root.loadRuntimeScript(key,file,()=>Boolean(root[global]));
98:   async function modelDependencies(){
99:     for(const [key,file,global] of [
100:       ["career-history-protocol","js/sharedHistoryConvergence.js","CareerModeSharedHistoryConvergence"],
101:       ["career-final-protocol","js/sharedFinalReconciliation.js","CareerModeSharedFinalReconciliation"],
102:       ["career-terminal-protocol","js/sharedTerminalClose.js","CareerModeSharedTerminalClose"],
103:       ["career-analytics","js/sharedCareerAnalytics.js","CareerModeSharedCareerAnalytics"],
104:       ["career-active-adapter","js/sharedActiveShowdownAdapter.js","CareerModeSharedActiveShowdownAdapter"],
105:       ["career-closed-adapter","js/sharedClosedShowdownAdapter.js","CareerModeSharedClosedShowdownAdapter"],
106:       ["career-completed-reader","js/sparkCompletedShowdownReader.js","CareerModeSparkCompletedShowdownReader"],
107:       ["career-summary-store","js/careerSummaryStore.js","CareerModeCareerSummaryStore"],
108:       ["career-closed-loader","js/sparkClosedShowdownCareerLoader.js","CareerModeSparkClosedShowdownCareerLoader"]
109:     ])await load(key,file,global);
110:   }
111:   function rlSnapshot(){return {identity:identity(),pair:state("CareerModePersistentNikDanielPair"),history:state("CareerModeProductionSharedHistoryConvergence"),multiSeason:state("CareerModeProductionSharedMultiSeasonProgression"),finalReconciliation:state("CareerModeProductionSharedFinalReconciliation"),terminalClose:state("CareerModeProductionSharedTerminalClose")};}
112:   function markup(screen){if(node)require("./rivalryLegacyV10Markup.js");return root.CareerModeRivalryLegacyMarkup?.[screen]??"";}
113:   function source(screen){
114:     // r87 H4: covered while its career is read (Reus Gate); see refresh().
115:     if(held.has(screen)&&screens().HOLD)return screens().HOLD;
116:     const model=getters[screen]?.();
117:     if(model!=null)return model;
118:     // Signed in or not, Team V draws the screen.
119:     return sourceKeys[screen]===context()?sources[screen]??UNAVAILABLE:UNAVAILABLE;
120:   }
121:   function clean(screen){
122:     if(screen==="rivalryStatistics"){tabletLayoutCleanup?.();tabletLayoutCleanup=null;}
123:     if(screen==="legacy"){legacyLayoutCleanup?.();legacyLayoutCleanup=null;root.LEGACY_BOOT?.cleanup?.();root.LegacyFixture?.stageController?.destroy?.();}
124:     else{root.rvStage?.destroy?.();root.rvStage=null;}
125:   }
```
### lines 263-478
```javascript
263:   async function rlCareerScope(services,getDoc,user){
264:     await load("career-start-marker","js/careerStartMarker.js","CareerModeCareerStartMarker");
265:     const marker=root.CareerModeCareerStartMarker;
266:     if(typeof marker?.readMarker!=="function")throw new Error("CAREER_START_UNAVAILABLE");
267:     const value=await marker.readMarker({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc},accountId:user.uid,recheckNone:true});
268:     if(value?.status==="ready")return {testOnly:false,hidden:typeof marker.careerHiddenRivalryIds==="function"?await marker.careerHiddenRivalryIds({marker:value,firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc},accountId:user.uid}):marker.hiddenRivalryIds(value)};
269:     if(value?.status==="none")return {testOnly:true,hidden:[]};
270:     throw new Error("CAREER_START_UNKNOWN");
271:   }
272:   // Rivalry Statistics shows a just-finished Showdown from live state. A hidden or test one (or one whose account cannot be
273:   // checked) must not show; the career model below then decides.
274:   async function rlCurrentHidden(rivalryId){
275:     try{
276:       const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
277:       if(typeof rivalryId!=="string"||!account?.connected||!runtime)return false;
278:       const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
279:       if(!services?.ok||!user||user.uid!==account.accountId)return false;
280:       const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
281:       const scope=await rlCareerScope(services,sdk.getDoc,user);
282:       return scope.testOnly||scope.hidden.includes(rivalryId);
283:     }catch(_){return true;}
284:   }
285:   // r87 career fixes (B2): a pair change while the career loads (the other phone ends the live Showdown, or a failed pair
286:   // re-check) changes the context key. The finished read was then dropped with no event, so Career Statistics, Trophy Room
287:   // and Standings stayed on UNAVAILABLE. The read is not published under the new key (after a Showdown completes it would
288:   // miss that Showdown), it is run once more for the same account and manager instead. Finished Showdowns are kept in the
289:   // loader's page cache, so the retry reads only what changed.
290:   // onRetry(key) runs as the retry starts, so a screen waiting on this read moves its own key (and inactivity deadline) to
291:   // the new context first: its progress heartbeats then count for the retry (Codex #1103).
292:   async function rlLoadCareerModel(canPublish=()=>true,rivalry=false,onProgress=null,onRetry=null){
293:     const sequence=++careerLoadSequence;careerLoadsRunning+=1;
294:     try{
295:       let key=context(),result=await rlLoadCareerModelOnce(key,sequence,canPublish,rivalry,onProgress);
296:       const now=context();
297:       if(now!==key&&canPublish()&&sequence===careerLoadSequence&&rlOwner(now)===rlOwner(key)){key=now;if(typeof onRetry==="function")onRetry(key);result=await rlLoadCareerModelOnce(key,sequence,canPublish,rivalry,onProgress);}
298:       return result;
299:     }finally{
300:       careerLoadsRunning-=1;
301:       // Codex #1103: the model-change event fires while this read still counts as running, and a failed read fires none. A
302:       // page that waits on the read (History & Backup) hears this once the count is down, on success and on failure.
303:       if(careerLoadsRunning===0&&typeof root.CustomEvent==="function")root.dispatchEvent?.(new root.CustomEvent("career-mode-online-career-load-settled"));
304:     }
305:   }
306:   // r87 career fixes (B1): History & Backup shows the kept career and says "Loading" while a career read is running.
307:   const rlCareerModelLoading=()=>careerLoadsRunning>0;
308:   async function rlLoadCareerModelOnce(key,sequence,canPublish,rivalry,onProgress){
309:     await modelDependencies();
310:     const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
311:     const account=state("CareerModeSparkConnectedAccount"),runtime=root.CareerModeProductionFirebaseRuntime;
312:     let model,rivalryModel;
313:     if(!account?.connected||!runtime)model=UNAVAILABLE;
314:     else{
315:       const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices()),user=services?.auth?.currentUser;
316:       if(!services?.ok||!user||user.uid!==account.accountId)model=UNAVAILABLE;
317:       else{
318:         // Reuse the configured SDK host and memory-only services. This only adds an exact-get
319:         // function to the reader argument; it changes no auth scope, provider setting or Rules.
320:         const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:await import(runtime.firebaseFirestoreModule));
321:         let scope=null;try{scope=await rlCareerScope(services,sdk.getDoc,user);}catch(_){scope=null;}
322:         if(!scope){model=UNAVAILABLE;rivalryModel=UNAVAILABLE;}
323:         else{
324:           const hidden=scope.hidden,loader=root.CareerModeSparkClosedShowdownCareerLoader;
325:           // U1 (2.4.0 hunt): Rivalry Statistics right after a close. The Showdown that just finished (rivalry.expect, when it
326:           // counts for this career) can still be missing from the career index, or read as unavailable, for a moment. Such an
327:           // answer is never kept: the loader forgets it, it is asked once more after a short wait, and the next visit asks
328:           // again. In the normal case the newest finished entry is that Showdown and nothing more is read.
329:           const expect=typeof rivalry?.expect==="string"&&!scope.testOnly&&!hidden.includes(rivalry.expect)?rivalry.expect:null;
330:           for(let attempt=0;;attempt+=1){
331:             const result=await loader.loadClosedShowdownCareer({firestore:services.firestore,firebaseSdk:{...services.firestoreSdk,getDoc:sdk.getDoc,setDoc:sdk.setDoc},user,current:active.careerInput,...(typeof onProgress==="function"?{onProgress}:{}),...(scope.testOnly?{testRunsOnly:true}:hidden.length?{hiddenRivalryIds:hidden}:{})},()=>canPublish()&&context()===key);
332:             model=result.model??UNAVAILABLE;
333:             if(!rivalry)break;
334:             // Career order is oldest first. Rebuild the latest verified completed entry (r87 Fable job 7 F7-06: a newer live or
335:             // completion-pending Showdown is not finished yet, so it never hides the newest finished one behind "empty"),
336:             // never mix whole-career manager counters into one rivalry's figures.
337:             const input=result.careerInput,entry=input?.showdowns?.filter(item=>!["abandoned","active","completion-pending"].includes(item.classification)).at(-1);
338:             rivalryModel=input?.indexStatus==="ready"?(entry?.classification==="completed"?root.CareerModeSharedCareerAnalytics.buildCareerModel({indexStatus:"ready",showdowns:[entry]}):entry?.classification==="unavailable"?UNAVAILABLE:{status:"empty"}):UNAVAILABLE;
339:             const unavailable=rivalryModel===UNAVAILABLE,notIndexed=Boolean(expect)&&entry?.rivalryId!==expect;
340:             if(!unavailable&&!notIndexed)break;
341:             for(const id of new Set([expect,entry?.rivalryId]))if(id)loader.forgetUnavailableShowdown?.(id);
342:             if(attempt||!expect||!canPublish()||context()!==key)break;
343:             await new Promise(resolve=>root.setTimeout(resolve,RIVALRY_RETRY_MS));
344:           }
345:         }
346:       }
347:     }
348:     if(canPublish()&&context()===key&&sequence===careerLoadSequence){careerCache={key,model};if(typeof root.CustomEvent==="function")root.dispatchEvent?.(new root.CustomEvent("career-mode-online-career-model-change"));}
349:     return rivalry?rivalryModel??UNAVAILABLE:model;
350:   }
351:   // r87 career fixes (lane C C-01): the live Showdown's numbers come from the in-game providers, which only run on a page
352:   // that has entered the game (its shared save and live session). Out of the game they never arrive, so instead of
353:   // "Loading…" forever the screen says how to load them. No read is made or saved for this; in the game nothing changes.
354:   function rlLiveCanArrive(){
355:     try{
356:       const history=root.CareerModeProductionSharedHistoryConvergence,setup=root.CareerModeProductionSharedShowdownSetup?.getState?.();
357:       return Boolean(history?.isActive?.()&&setup?.sessionId);
358:     }catch(_){return false;}
359:   }
360:   function rlLiveOrContinue(rivalry){return rivalry?.status==="loading"&&!rlLiveCanArrive()?{...rivalry,status:"unavailable",notice:"continue"}:rivalry;}
361:   // r87 H4 (Reus Gate, Nik): a first entry, TRY AGAIN, or the connection coming back on "unavailable" keeps the screen covered
362:   // under Reus while its career is read, then reveals it once. Only a read still running after HOLD_MAX_MS shows the loading
363:   // frame with its "n of N" progress (inside js/v10Screens.js's LOAD_HOLD_MAX_MS, so the cover never ends first).
364:   const HOLD_MAX_MS=14000;
365:   const held=new Set();
366:   const rlCachedCareerModel=()=>careerCache&&careerCache.key===context()?careerCache.model:null;
367:   const rlOwner=key=>{try{return JSON.stringify(JSON.parse(key).slice(0,2));}catch(_){return null;}};
368:   function refresh(screen,event=false,retry=false){
369:     let key=context();const reload=reloads[screen]??(reloads[screen]={flight:null,timer:null,dirty:false,lastStarted:-Infinity});
370:     const supplied=getters[screen]?.();
371:     if(supplied!=null){screens().invalidate(APP[screen]);return screens().show(APP[screen]);}
372:     // Never retain another account's frame while its old request finishes. r82 (Nik: Legacy panels show, vanish, then
373:     // load again): the same account and manager keep their frame while the pair or marker settles; the reload replaces it.
374:     if(sourceKeys[screen]!==key){
375:       const sameOwner=sourceKeys[screen]!=null&&rlOwner(sourceKeys[screen])===rlOwner(key);
376:       sourceKeys[screen]=key;
377:       if(!sameOwner){
378:         sources[screen]=LOADING;
379:         if(reload.flight||event&&Date.now()-reload.lastStarted<RELOAD_INTERVAL)void screens().show(APP[screen]).catch(report);
380:       }
381:     }
382:     if(reload.flight){/* a flight the screen left cannot publish; reopening schedules a fresh load after it drains */if(event||reload.flight.key!==key||reload.flight.left)reload.dirty=true;return reload.flight.promise;}
383:     const delay=RELOAD_INTERVAL-(Date.now()-reload.lastStarted);
384:     if(event&&delay>0){reload.dirty=true;scheduleReload(screen,reload,delay);return Promise.resolve(false);}
385:     if(reload.timer!==null){root.clearTimeout(reload.timer);reload.timer=null;}
386:     reload.dirty=false;reload.lastStarted=Date.now();
387:     // r83: opening the screen again retries an earlier "unavailable" read, so it shows loading, not the old card first.
388:     if(!event&&sources[screen]===UNAVAILABLE)sources[screen]=LOADING;
389:     // r87 H4: a retry of a drawn "unavailable" screen is covered first (Reus), so it is redrawn once with what the read says.
390:     let covered=false;
391:     if(retry&&screens().isMounted(APP[screen])&&typeof screens().hide==="function"&&typeof screens().expect==="function"){screens().hide(APP[screen]);covered=screens().expect(APP[screen])===true;}
392:     const flight={key,alive:true,promise:null};reload.flight=flight;
393:     flight.promise=(async()=>{
394:       let timeout,fail;
395:       // r86 (Sol S61-r85-04): an inactivity deadline, not a flat cut. Each Showdown read restarts the 15 s, so a long cold
396:       // career keeps loading while records arrive; first-entry History says how far it got (never partial totals).
397:       const arm=()=>{root.clearTimeout(timeout);timeout=root.setTimeout(()=>{flight.alive=false;fail(rlTimeoutError());},LOAD_TIMEOUT);};
398:       const progress=({done,total}={})=>{
399:         if(!flight.alive||flight.left||context()!==key)return;arm();
400:         if(screen==="legacy"&&sources[screen]===LOADING&&Number.isInteger(done)&&Number.isInteger(total)&&total>0)rlShowProgress(screen,done,total);
401:       };
402:       // r87 career fixes (B2, Codex #1103): the read runs once more under the new pair state; this screen follows it at once.
403:       const retrying=next=>{if(!flight.alive||flight.left||rlOwner(next)!==rlOwner(key))return;key=flight.key=sourceKeys[screen]=next;arm();};
404:       try{
405:         const firstEntry=sources[screen]===LOADING;
406:         const deadline=new Promise((_,reject)=>{fail=reject;arm();});
407:         const loading=(async()=>{
408:           if(screen==="rivalryStatistics"){
409:             await modelDependencies();
410:             const active=root.CareerModeSharedActiveShowdownAdapter.buildActiveShowdownViews(rlSnapshot());
411:             if(["none","abandoned","completed"].includes(active.classification)&&(active.rivalry.status!=="ready"||await rlCurrentHidden(active.careerInput?.showdowns?.[0]?.rivalryId)))return rlLoadCareerModel(()=>flight.alive&&!flight.left,active.classification==="completed"?{expect:active.careerInput?.showdowns?.[0]?.rivalryId}:true,progress,retrying);
412:             return rlLiveOrContinue({...active.rivalry,lifecycle:active.classification});
413:           }
414:           return rlLoadCareerModel(()=>flight.alive&&!flight.left,false,progress,retrying);
415:         })();
416:         // r87 career fixes (lane C C-02, Reus Gate): a first entry stays covered (the screen's pending state) while its career
417:         // arrives, so it is revealed once, with its numbers. Only a read still running after FIRST_HOLD_MS shows the loading
418:         // frame (with its "n of N" progress). Reloads leave the last ready/partial/error frame visible, as before.
419:         // A screen already on show (TRY AGAIN, a retried "unavailable") is redrawn at once, so the press always answers.
420:         if(covered||firstEntry&&!screens().isMounted(APP[screen])&&screens().expect?.(APP[screen])){
421:           covered=true;held.add(screen);
422:           let timer;const settled=await Promise.race([loading.then(()=>true,()=>true),deadline.then(()=>true,()=>true),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(false),HOLD_MAX_MS);})]);
423:           root.clearTimeout(timer);held.delete(screen);screens().expect?.(APP[screen]);
424:           if(!settled&&!flight.left)await screens().show(APP[screen]);
425:         }else await screens().show(APP[screen]);
426:         const model=await Promise.race([loading,deadline]);
427:         if(flight.left)return false;
428:         // r87 career fixes (B2): the pair changed while this screen loaded. The load already ran once more under the new key;
429:         // when that career is the one now kept for this account and manager, show it. Otherwise load again (never strand
430:         // the screen on its old key, which drew UNAVAILABLE with no reload).
431:         if(context()!==key){
432:           if(screen==="legacy"&&rlOwner(context())===rlOwner(key)&&model&&model===rlCachedCareerModel()){key=sourceKeys[screen]=context();}
433:           else{reload.dirty=true;return false;}
434:         }
435:         // r82 (Codex JOB-B B3/B6): a reload that returns the same career keeps the frame already shown (no second boot).
436:         const shown=sources[screen];if(screens().isMounted(APP[screen])&&shown&&shown!==LOADING&&shown!==UNAVAILABLE&&model&&JSON.stringify(shown)===JSON.stringify(model))return true;
437:         sources[screen]=model;return await screens().show(APP[screen]);
438:       }catch(error){if(flight.left)return false;/* F7-09: the pair changed and the read failed: load again, never stay on LOADING */if(context()!==key){reload.dirty=true;return false;}sources[screen]=UNAVAILABLE;await screens().show(APP[screen]);report(error);return false;}
439:       finally{
440:         flight.alive=false;root.clearTimeout(timeout);reload.flight=null;
441:         // r87 H4: a covered screen is never left covered (its cover would end on the app's own page): it shows what it has.
442:         if(covered){held.delete(screen);if(!flight.left&&!screens().isMounted(APP[screen]))void screens().show(APP[screen]).catch(report);}
443:         if(reload.dirty)scheduleReload(screen,reload,Math.max(0,RELOAD_INTERVAL-(Date.now()-reload.lastStarted)));
444:       }
445:     })();
446:     return flight.promise;
447:   }
448:   // Writes only the loading banner's text in place (no new frame, no remount, so nothing flashes).
449:   function rlShowProgress(screen,done,total){
450:     try{
451:       const copy=root.document?.getElementById?.(APP[screen])?.querySelector?.("#legacyStateBanner")?.querySelector?.(".legacyStateCopy");
452:       if(copy)copy.textContent=`Loading your Showdown history… ${Math.min(done,total)} of ${total}`;
453:     }catch(_){}
454:   }
455:   function scheduleReload(screen,reload,delay){
456:     if(reload.timer!==null)return;
457:     reload.timer=root.setTimeout(()=>{
458:       reload.timer=null;const dirty=reload.dirty;reload.dirty=false;
459:       if(dirty&&screens().isMounted(APP[screen]))void refresh(screen,true).catch(report);
460:     },delay);
461:   }
462:   function wrap(screen){
463:     const name=screen==="legacy"?"renderLegacy":"renderRivalryStatistics",original=root[name];
464:     if(typeof original!=="function"||original.rivalryLegacyV10)return;
465:     const wrapped=function(request=false){const result=original(request);const host=root.document.getElementById(APP[screen]);if(host?.dataset.rivalryLegacyV10==="1"){screens().invalidate(APP[screen]);void refresh(screen).catch(report);}return result;};
466:     wrapped.rivalryLegacyV10=true;root[name]=wrapped;
467:   }
468:   async function rlMount(screen,getModel){
469:     if(!Object.hasOwn(APP,screen))throw new TypeError("RIVALRY_LEGACY_V10_UNKNOWN");
470:     getters[screen]=getModel;
471:     const api=await registerRivalryLegacy();wrap(screen);
472:     return refresh(screen);
473:   }
474: 
475:   const RUNTIME_FILES=["visual-assets/v10_1/legacy/legacy.css", "visual-assets/v10_1/legacy/legacy.js", "visual-assets/v10_1/legacy/strings.json", "visual-assets/v10_1/legacy/assets/platemap.json", "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V3.webp", "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PHONE_HC_V3_590W.webp", "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_1X.webp", "visual-assets/v10_1/plates-hc/ENV_ARCHIVE_PLATE_HC_V3_2X.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_1X.webp", "visual-assets/v10_1/legacy/assets/ENV_LG_PLATE_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_DANIEL_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_2X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_1X.webp", "visual-assets/v10_1/legacy/assets/OVL_LG_NIK_FOREGROUND_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css", "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js", "visual-assets/v10_1/rivalry-statistics/strings.json", "visual-assets/v10_1/rivalry-statistics/assets/platemap.json", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_PHONE_V1.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_DANIEL_POINT_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_1X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_ARMS_V1_RIM_2X.webp", "visual-assets/v10_1/rivalry-statistics/assets/OVL_RV_NIK_PHONE_V1.webp", "js/rivalryLegacyV10.js", "js/rivalryLegacyV10Markup.js", "css/rivalryLegacyV10.css"];
476:   return rlFreeze({toV10Frame:rlToV10Frame,mount:rlMount,markup,loadCareerModel:rlLoadCareerModel,cachedCareerModel:rlCachedCareerModel,careerModelLoading:rlCareerModelLoading,RUNTIME_FILES});
477: });
478: 
```

## FILE: visual-assets/v10_1/standings/standings.js (245 lines in total)
### lines 1-75
```javascript
1: // STANDINGS-V1 · fixture-driven screen on the shared registered stage.
2: // ?frame=SD1..SD9 picks a fixture frame; the toggle only changes the projection (no gameplay, no extra reads).
3: (() => {
4:   "use strict";
5:   function bootStandings() {
6: 
7:   const qs = new URLSearchParams(window.STANDINGS_QS || location.search);
8:   const stage = window.STANDINGS_ROOT || document.getElementById("stage-root");
9:   const $ = (id) => document.getElementById(id);
10:   const text = (id, value) => { const el = $(id); if (el) el.textContent = value == null ? "" : String(value); };
11:   const fill = (tpl, values) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (values[k] == null ? m : values[k]));
12:   const crest = (club) => (window.getClubCrestMarkup ? window.getClubCrestMarkup(club || "", "big") : window.getClubCrestSvg ? window.getClubCrestSvg(club || "") : "");
13: 
14:   const SCOPE_ROWS = ["seasonWins", "seasonDraws", "seasonLosses", "championsLeagues", "europaLeagues", "leagueTitles", "domesticCups", "totalTrophies"];
15:   const PLATE = {
16:     width: 1672, height: 941,
17:     src1x: "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_1X.webp",
18:     src2x: "visual-assets/v10_1/rivalry-statistics/assets/ENV_RV_PLATE_V1_2X.webp"
19:   };
20: 
21:   let FX = null, frameId = null, stageHandle = null;
22: 
23:   function mountStage(platemap) {
24:     if (!window.ShowdownStage || stageHandle) return;
25:     stage.v10StageHandle = stageHandle = window.ShowdownStage.mount(stage, {
26:       plate: PLATE,
27:       platemap,
28:       focal: { x: 836, y: 470.5 },
29:       dustCount: 24,
30:       phoneBandRatio: .46
31:     });
32:   }
33: 
34:   // Leader rules (TRUTH.md): This Showdown = higher score only; Career = careerPoints only; otherwise Level
35:   // (r83, Nik 2026-10-23: season wins never break a tie, so a drawn Showdown never shows a leader).
36:   function leaderText(S, view, m, interim) {
37:     if (m.status === "loading" || m.status === "unavailable" || m.status === "partial") return "";
38:     const nameOf = (side) => S.managers[side];
39:     if (view === "this-showdown" || interim) {
40:       const a = m.score && m.score.daniel, b = m.score && m.score.nik;
41:       if (typeof a !== "number" || typeof b !== "number") return "";
42:       if (a === b) return S.level;
43:       return fill(S.leaderTemplate, { manager: nameOf(a > b ? "daniel" : "nik") });
44:     }
45:     const d = m.standings && m.standings.daniel, n = m.standings && m.standings.nik;
46:     if (!d || !n) return "";
47:     if (d.careerPoints !== n.careerPoints) return fill(S.leaderTemplate, { manager: nameOf(d.careerPoints > n.careerPoints ? "daniel" : "nik") });
48:     return S.level;
49:   }
50: 
51:   function leaderSide(m, view, interim) {
52:     if (m.status !== "ready" && m.status !== "empty") return null;
53:     let a, b;
54:     if (view === "this-showdown" || interim) { a = m.score && m.score.daniel; b = m.score && m.score.nik; }
55:     else {
56:       const d = m.standings && m.standings.daniel, n = m.standings && m.standings.nik;
57:       if (!d || !n) return null;
58:       a = d.careerPoints; b = n.careerPoints;
59:     }
60:     if (typeof a !== "number" || typeof b !== "number") return null;
61:     if (a !== b) return a > b ? "daniel" : "nik";
62:     return null;
63:   }
64: 
65:   function recordsFor(view, m, interim) {
66:     if (view === "this-showdown" || interim) return m.managerRecords || null;
67:     return m.standings && m.standings.daniel ? m.standings : null;
68:   }
69: 
70:   function render() {
71:     const S = FX.strings, f = FX.frames[frameId], m = f.model || {};
72:     const interim = !!m.interimLabel && f.view === "career";
73:     const view = f.view;
74:     const hasNumbers = m.status === "ready" || m.status === "partial" || (m.status === "empty" && (m.score || (m.standings && m.standings.daniel)));
75:     const showScope = view === "this-showdown" || interim;
```
### lines 160-245
```javascript
160:         row.append(l, mid, r);
161:         rows.appendChild(row);
162:       });
163:       // r93: the Golden Showdown row (CAREER only, once either manager has one; the frame carries the counts).
164:       const g = view === "career" && !interim ? m.goldenShowdowns : null;
165:       if (g && Number.isInteger(g.daniel) && Number.isInteger(g.nik)) {
166:         const row = document.createElement("div");
167:         row.className = "sdg-row sdg-row--golden";
168:         row.dataset.field = "goldenShowdowns";
169:         const l = document.createElement("span"), mid = document.createElement("span"), r = document.createElement("span");
170:         l.className = "sdg-val sdg-val--daniel"; r.className = "sdg-val sdg-val--nik"; mid.className = "sdg-label";
171:         l.textContent = g.daniel; r.textContent = g.nik; mid.textContent = S.fields.goldenShowdowns || "Golden Showdowns";
172:         row.append(l, mid, r);
173:         rows.appendChild(row);
174:       }
175:     }
176:     rows.hidden = !rows.children.length;
177: 
178:     // Availability copy for states without numbers, and the new-career / first-season messages.
179:     let msg = "";
180:     if (m.status === "loading") msg = S.loading;
181:     else if (m.status === "unavailable") msg = m.notice === "continue" ? (S.continueToLoad || S.unavailable) : S.unavailable;
182:     else if (m.status === "empty") {
183:       if (m.score) msg = S.emptySeason;
184:       else msg = view === "career" ? S.emptyCareer : S.emptyShowdown;
185:     }
186:     const state = $("sdgState");
187:     state.hidden = !msg;
188:     state.textContent = msg;
189:     state.dataset.status = m.status || "";
190:     // r87 polish (P-14): with no Showdown in progress the This Showdown view offers the Career view, which still has numbers.
191:     if (m.status === "empty" && !m.score && view !== "career") {
192:       const go = document.createElement("button");
193:       go.type = "button";
194:       go.className = "sdg-stateAction sd-btn";
195:       go.textContent = S.emptyShowdownAction || "SEE CAREER STANDINGS";
196:       go.addEventListener("click", () => $("sdgViewCareer").click());
197:       state.appendChild(go);
198:     }
199:   }
200: 
201:   function pickFrameFor(view) {
202:     const ids = Object.keys(FX.frames);
203:     if (window.STANDINGS_APP) return ids.find((id) => FX.frames[id].view === view) || ids[0];
204:     return ids.find((id) => FX.frames[id].view === view && FX.frames[id].model.status === "ready" && !FX.frames[id].model.interimLabel) || ids[0];
205:   }
206: 
207:   function bindToggle() {
208:     const tabs = [$("sdgViewShowdown"), $("sdgViewCareer")];
209:     tabs.forEach((tab, i) => {
210:       tab.addEventListener("click", () => {
211:         if (FX.frames[frameId].view === tab.dataset.view) return;
212:         frameId = pickFrameFor(tab.dataset.view);
213:         render();
214:       });
215:       tab.addEventListener("keydown", (e) => {
216:         const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
217:         if (!d) return;
218:         e.preventDefault();
219:         const next = tabs[(i + d + tabs.length) % tabs.length];
220:         next.click();
221:         next.focus();
222:       });
223:     });
224:   }
225: 
226:   function boot(fixtures, platemap) {
227:     FX = fixtures;
228:     window.StandingsFixtures = fixtures;
229:     const ids = Object.keys(FX.frames);
230:     frameId = FX.frames[qs.get("frame")] ? qs.get("frame") : ids[0];
231:     mountStage(platemap);
232:     bindToggle();
233:     render();
234:     if (typeof window.sdEnter === "function") window.sdEnter(stage);
235:   }
236: 
237:   if (window.STANDINGS_APP) { boot(window.STANDINGS_FIXTURES, window.STANDINGS_PLATEMAP || null); return; }
238:   Promise.all([
239:     fetch("fixtures.json").then((r) => r.json()),
240:     fetch("../rivalry-statistics/assets/platemap.json").then((r) => r.json()).catch(() => null)
241:   ]).then((x) => boot(x[0], x[1]));
242:   }
243:   window.ShowdownStandingsBoot = bootStandings;
244:   if (!window.STANDINGS_APP) bootStandings();
245: })();
```

## FILE: js/careerScreenSeam.js (191 lines in total)
### lines 1-60
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeCareerScreenSeam=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7:   const SCREENS=["careerStatistics","trophyRoom","legacy","rivalryStatistics"];
8:   const STATUSES=["loading","empty","unavailable","partial","ready"];
9:   const TEXT={
10:     loading:"Loading career history.",
11:     unavailable:"Career history is unavailable right now. Nothing is lost. Try again when you are reconnected.",
12:     partial:"Showing {readable} of {indexed} Showdowns. Some Showdowns could not be read, so these are not complete career totals.",
13:     empty:{
14:       careerStatistics:"Career Statistics appear after your first completed Showdown. This Showdown's numbers are on Showdown Home.",
15:       trophyRoom:"The Trophy Room is empty. Finish a Showdown and its trophies and records appear here.",
16:       legacy:"No completed Showdowns yet. Finish one and it appears here.",
17:       rivalryStatistics:"No season completed yet. Stats fill in as seasons are played."
18:     },
19:     historyStatus:{completed:"Completed","in-progress":"In progress","completion-pending":"Final result, completion pending",abandoned:"Ended early",unavailable:"Unavailable"},
20:     winner:{daniel:"Daniel won",nik:"Nik won",draw:"Draw"}
21:   };
22:   const csNames={daniel:"Daniel",nik:"Nik",shared:"LEVEL"};
23:   const csCareerFields=[["Career points","careerPoints"],["Seasons played","seasons"],["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"]];
24:   const csShowdownFields=[["Showdowns completed","completed"],["Showdown wins","wins"],["Showdown draws","draws"],["Showdown losses","losses"]];
25:   const csRecordFields=[["Best season score","bestSeasonScore"],["Best league points","bestLeaguePoints"],["Best league goals","bestLeagueGoals"],["Best league position","bestLeaguePosition"],["Average season score","averageSeasonScore"],["Average league points","averageLeaguePoints"],["Average league goals","averageLeagueGoals"],["Perfect seasons","perfectSeasons"],["100-point seasons","hundredPointSeasons"],["100-goal seasons","hundredGoalSeasons"],["Top scorer seasons","topScorerSeasons"],["Top assist seasons","topAssistSeasons"],["Performance bonuses","performanceBonuses"],["Awards bonuses","awardsBonuses"]];
26:   const csCabinetFields=[["Champions League","championsLeagues"],["Europa League","europaLeagues"],["League titles","leagueTitles"],["Domestic cups","domesticCups"],["Total trophies","totalTrophies"]];
27:   const csRivalryFields=[["Season wins","seasonWins"],["Season draws","seasonDraws"],["Season losses","seasonLosses"],...csCabinetFields,["Perfect seasons","perfectSeasons"],["Best season score","bestSeasonScore"]];
28: 
29:   function csFreeze(value){
30:     if(value&&typeof value==="object"&&!Object.isFrozen(value)){
31:       Object.values(value).forEach(csFreeze);Object.freeze(value);
32:     }
33:     return value;
34:   }
35:   function normalizeRenderRequest(arg){
36:     if(arg===undefined||arg===null||arg===false)return Object.freeze({force:false,hasModel:false,model:null});
37:     if(arg===true)return Object.freeze({force:true,hasModel:false,model:null});
38:     if(typeof arg!=="object"||Array.isArray(arg))throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
39:     const proto=Object.getPrototypeOf(arg);
40:     if(proto!==null&&Object.getPrototypeOf(proto)!==null)throw new TypeError("CAREER_SCREEN_REQUEST_INVALID");
41:     return Object.freeze({force:arg.force===true,hasModel:Object.prototype.hasOwnProperty.call(arg,"model"),model:arg.model??null});
42:   }
43:   function isOnlineCareerRoute(identityState){
44:     return Boolean(identityState&&identityState.registered===true&&["daniel","nik"].includes(identityState.managerId));
45:   }
46:   // The game is online only, so every career screen is Team V's (r61): with no model it shows the unavailable state,
47:   // signed in or not (r91: the old local data-tools page was cut).
48:   function selectCareerScreenSource({identityState,model}){
49:     if(model!==undefined&&model!==null)return model&&STATUSES.includes(model.status)?"model":"unavailable";
50:     return "unavailable";
51:   }
52:   // r80 Ended early row: "Ended early · 18 Oct 2026 · 1 season"; an unknown date or count (closes before the mark) is a dash.
53:   // r87 career fixes (A-04): both phones print the same date in any time zone. r96 (Nik 2026-11-18, Sol 6.2 P3): that date is
54:   // Boston's day (America/New_York) on both phones, not UTC's, so a Showdown ended at 8 PM in Boston reads as that day. Display
55:   // only: the stored endedAt is untouched.
56:   // r89 Sacked: "Ended · sacked in season 2 of 3 (Nik)". Never mixed with "Ended early" (END SHOWDOWN, never counted).
57:   function sackedText(row){
58:     if(!row||row.endedBy!=="sacked")return "";const who=["daniel","nik"].filter(m=>row.sacked?.[m]===true).map(m=>csNames[m]);
59:     return "Ended · sacked in season "+row.sackedSeason+" of "+row.totalSeasons+(who.length?" ("+who.join(" and ")+")":"");
60:   }
```

## FILE: js/productionSharedSeasonResults.js (347 lines in total)
### lines 280-347
```javascript
280:     }catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Confirming your season result failed.");pssrReport("Could not confirm your season result",error);}else failed=PSSR_BACK_FAILED;return false;}
281:     // Phoenix W3: this attempt got its answer on this page (landed, refused or failed): the note is done. It only ever serves a
282:     // tab that died before the answer, so an edit after a failed publish can never be replaced by the old result.
283:     finally{pssrTapClear(request,publishRole);busy=false;if(pssrContextMatches(request))pssrRender();else pssrRenderWhenBack(request,failed);}
284:   }
285:   // W1 (2.4.0): a publish can end while this phone has no connection and its Season Results context is not readable (the
286:   // Showdown's setup is unavailable offline). It then had nothing to draw on: the screen kept the CONFIRM button it drew as
287:   // busy (disabled) and, before this manager confirms, no poll redraws it, so the button stayed off after the signal came back.
288:   // Once the same context is back, the screen is drawn again (button on, the failure said); no read, a local check each second.
289:   // W1b (2.4.0, Fable re-check 2): a Season Results poll tick that runs while the context still reads as another season
290:   // empties view and draft, so a plain redraw drew nothing and CONFIRM MY RESULT stayed off under "tap ... again". Then the
291:   // screen is read once (light) and the review is opened again from the typed form before the line is shown.
292:   let backTimer=null,backGen=0;
293:   function pssrRenderWhenBack(request,message){
294:     const timer=typeof root.setTimeout==="function"?root.setTimeout:null;if(!timer||!request)return;
295:     if(backTimer!==null)try{root.clearTimeout?.(backTimer);}catch(_error){}
296:     const gen=backGen+=1;let tries=0;
297:     const live=()=>{const entry=pssrField("seasonEntry");return gen===backGen&&!busy&&Boolean(entry)&&!entry.classList.contains("hidden");};
298:     const again=ms=>{if((tries+=1)<PSSR_BACK_TRIES)backTimer=timer(check,ms);};
299:     // The redraw with the line: the review is on (the reviewed draft, or a new one from the typed form) before the line is
300:     // written into it, so the line never sits under a CONFIRM MY RESULT that is off. A confirmed result shows as confirmed.
301:     const show=()=>{
302:       if(view.ownResult||view.state?.phase==="RESULTS_READY"){pssrRender();return;}
303:       const kept=draft&&draft.contextKey===contextKey&&draft.seasonNumber===view.seasonNumber&&draft.managerRole===view.managerRole;
304:       if(kept?pssrRender():pssrBeginReview()){if(message)pssrSetError(message);}
305:     };
306:     // It stops for good the moment a new publish starts or the Season Results screen is not on (Home after END SHOWDOWN, any
307:     // other screen), so it never draws over another screen.
308:     const check=()=>{
309:       backTimer=null;if(!live())return;
310:       const current=pssrRequestContext();
311:       // Only the same context is drawn; another save or season (offline the season can read differently) is left to its own
312:       // screen, and the check goes on until the same one is back or the time is up.
313:       if(!current||current.key!==request.key){again(PSSR_BACK_MS);return;}
314:       if(view&&contextKey===request.key){show();return;}
315:       // W1b: nothing to draw (a tick emptied it). One light read; if it fails (still offline) try again in 5 s.
316:       pssrRefresh(true).then(read=>{if(!live())return;if(read&&view&&contextKey===request.key&&pssrContextMatches(request))show();else again(PSSR_BACK_MS*5);},()=>{if(live())again(PSSR_BACK_MS*5);});
317:     };
318:     backTimer=timer(check,PSSR_BACK_MS);
319:   }
320:   async function pssrOpen(){
321:     const navAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;
322:     if(!pssrSharedMarker())return false;await pssrEnsureDependencies();const request=pssrRequestContext();if(!request)return false;const result=await pssrRefresh();if(!result||!pssrContextMatches(request)||contextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pssrFail("SEASON_RESULTS_NAVIGATION_UNAVAILABLE");if(navAtTap!==null&&root.getNavigationRevision()!==navAtTap)return false;const shown=await root.navigateTo("seasonEntry");if(shown===false||!pssrContextMatches(request))return false;pssrRender();return true;
323:   }
324:   function pssrCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pssrSharedMarker())return;const active=pssrField("seasonEntry");if(!active||active.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="completeSeason")pssrBeginReview();else if(target.id==="editSeasonResults")pssrEdit();else void pssrPublish();}
325:   function pssrWaitingKey(){const active=["seasonEntry","mainMenu","standings"].some(id=>{const node=pssrField(id);return node&&!node.classList.contains("hidden");});if(!view||contextKey!==pssrRequestContext()?.key||!view.ownResult||view.state?.phase==="RESULTS_READY"||!active)return "";return `${contextKey}|publish`;}
326:   function pssrFastPollDue(){const key=pssrWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
327:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
328:   // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
329:   function pssrWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pssrWaitingKey()||pssrLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`:null)(pssrRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pssrWaitingKey()&&pssrLiveScreen());}catch(_error){relaxed=false;}return budget.watchWaitPoint("season-results",path,pssrWaitWake,{relaxed});}
330:   function pssrWaitWake(){if(!busy){void pssrTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pssrTick(true);},400);}
331:   function pssrWaitHealthy(){const request=pssrRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`);}
332:   // Phoenix W8 (r100): the wait line names the rival. (Nik 2026-11-24 15:35 UTC: the W8 "· LIVE" / "· CHECKED h:mm PM" words
333:   // are dropped; Phoenix stays in the background. The W8 listener rebuild is unchanged.)
334:   function pssrWaitLine(role){const rival=String(pssrManagerName(role==="playerOne"?"playerTwo":"playerOne")).toUpperCase();return `CONFIRMED · WAITING FOR ${rival}`;}
335:   function pssrFastTick(){pssrWatchWait();if(pssrWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pssrFastPollDue())return;void pssrTick(true);}
336:   // r75: the 15 s check of the visible Season Results screen reads the shared results from the server (see Transfer).
337:   // r84: the listener also watches while Season Results is open and not yet RESULTS_READY (not only after this manager publishes):
338:   // 15 s fresh reads here were ~32 billed reads/min for both phones over a 30-90 minute results wait.
339:   function pssrLiveScreen(){const active=pssrField("seasonEntry");return Boolean(view&&contextKey===pssrRequestContext()?.key&&view.state?.phase!=="RESULTS_READY"&&active&&!active.classList.contains("hidden"));}
340:   function pssrScreenFresh(request){if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}
341:   async function pssrTick(light=false){if(!pssrSharedMarker()||root.document?.visibilityState==="hidden"||busy)return;const request=pssrRequestContext();if(!request)return;if(contextKey&&contextKey!==request.key){view=null;draft=null;contextKey="";renderedContextKey="";}if(view?.state?.phase==="RESULTS_READY"&&view.allResults?.playerOne&&view.allResults?.playerTwo)return;const active=pssrField("seasonEntry");if(view||active&&!active.classList.contains("hidden")){if(light!==true&&active&&!active.classList.contains("hidden"))pssrScreenFresh(request);try{await pssrRefresh(light===true);}catch(_error){}}}
342:   function pssrInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pssrCapture,true);root.document.addEventListener("input",pssrDraftChange,true);root.document.addEventListener("change",pssrDraftChange,true);}root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pssrTick());if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pssrTick();},POLL_MS);root.setInterval(pssrFastTick,FAST_POLL_MS);}return true;}
343: 
344:   // Phoenix W5: a new Showdown (or the ended one let go on Home) puts this module's Showdown data back to a fresh page's (the reset in js/persistentNikDanielPair.js).
345:   try{(root.CareerModeShowdownClears||(root.CareerModeShowdownClears={}))["season-results"]=()=>{view=null;draft=null;contextKey="";renderedContextKey="";formContextKey="";errorMessage="";fastWaitKey="";fastWaitSince=0;};}catch(_error){}
346:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results",productionEnabled:true,requiresCompletedSharedTransfer:true,privateUntilBothPublished:true,reusesSeasonEntry:true,interceptsLocalSeasonPersistence:true,authoritativeScoring:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pssrWaitingKey()),install:pssrInstall,open:pssrOpen,refresh:pssrRefresh,getState:()=>view,isActive:pssrSharedMarker,canRoute:pssrCanRoute});
347: });
```

## FILE: js/productionSharedSeasonCommit.js (360 lines in total)
### lines 240-260
```javascript
240:   function psscCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!psscSharedMarker())return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;const request=psscRequestContext();if(!request||contextKey!==request.key||!view||!psscResultsReady(request)){void psscRefresh().catch(()=>{});return;}void psscMutate(view.committed?"acknowledge":"commit");}
241:   // All three waiting screens share the same season authority; navigation does not end the partner wait.
242:   function psscWaitScreen(){return ["seasonEntry","mainMenu","standings"].some(id=>{const node=psscField(id);return node&&!node.classList.contains("hidden");});}
243:   // A Results/Commit listener alone cannot cover Setup, session, later commits or terminal authority.
244:   // These listeners live only for the wait, share its existing health/fallback cadence, and never poll.
245:   // A hidden page stops them (keep=true) and the same wait attaches them again when it returns (psscWaitReturn); their first
246:   // server delivery is the new baseline and answers the return check's reads of the same documents (one read each).
247:   // An ACKNOWLEDGED revision-3 commit can never change again (Rules), so the next attach leaves it out.
248:   // Fable job 3 F3-02: only the waited season's commit and the next one are watched. An earlier season is ACKNOWLEDGED before
249:   // this one starts, and a commit after the next cannot exist before the next is ACKNOWLEDGED, which needs this phone. Before,
250:   // a 10-season Showdown attached one listener per season on each new wait (measured on season 1: 58 billed to 42).
251:   // The season is part of the key, so a wait on the next season attaches its own pair.
252:   let waitContext=null,waitReturn=null;const waitSettled=new Set(),WAIT_PENDING_GRACE_MS=10000;
253:   // Phoenix W8 (r100): authority listeners that die on a passing network error are built again after 2 s, then 8 s, then 30 s
254:   // (a Rules refusal or the daily limit keeps the full minute); a healthy set starts the count again.
255:   const WAIT_BACKOFF_MS=Object.freeze([2000,8000,30000]);let waitFailures={key:"",count:0};
256:   function psscWaitRetryMs(key,error){const code=String(error?.code||"").toLowerCase();if(waitFailures.key!==key)waitFailures={key,count:0};waitFailures.count+=1;if(root.CareerModeFirestoreBudget?.isQuotaError?.(error)||/permission|unauthenticated|resource-exhausted/.test(code))return 60000;return WAIT_BACKOFF_MS[waitFailures.count-1]??60000;}
257:   function psscDropWaitContext(keep=false){const held=waitContext,budget=root.CareerModeFirestoreBudget;waitContext=null;if(keep===true&&held&&!held.failed)waitReturn={key:held.key,watching:held.watching};else if(keep!==true||held){waitReturn=null;budget?.returnListen?.([]);}if(!held)return;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();budget?.listened?.();}
258:   function psscWaitReturn(){const back=waitReturn,request=psscRequestContext();waitReturn=null;if(back&&request&&psscWaitScreen()&&!root.CareerModeFirestoreBudget?.paused?.())psscWaitContext(request,back.watching,back.key);else root.CareerModeFirestoreBudget?.returnListen?.([]);}
259:   function psscContextWake(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-wait-context-change"));}catch(_error){}}
260:   function psscWaitContext(request,watching,returnKey){
```
### lines 319-360
```javascript
319:   function psscWaitHealthy(){const request=psscRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();const waited=Boolean(request&&["seasonResults","seasonCommits"].some(collection=>live?.watching===`rivalries/${request.rivalryId}/${collection}/season_${request.seasonNumber}`));const healthy=Boolean(request&&root.document?.visibilityState!=="hidden"&&!root.CareerModeFirestoreBudget?.paused?.()&&live?.watchHealthy&&waited);if(!healthy){const hidden=root.document?.visibilityState==="hidden",now=Date.now(),held=waitContext,usable=Boolean(request&&!hidden&&!root.CareerModeFirestoreBudget?.paused?.());if(held&&usable&&waited&&held.watching===live.watching&&!held.failed&&!held.pendingSince)held.pendingSince=now;if(!(usable&&held&&(held.returnUntil>now||waited&&held.watching===live.watching&&!held.failed&&now-held.pendingSince<WAIT_PENDING_GRACE_MS)))psscDropWaitContext(hidden);return false;}if(waitContext)waitContext.pendingSince=0;return ![root.CareerModeProductionSharedMultiSeasonProgression,root.CareerModeProductionSharedFinalReconciliation,root.CareerModeProductionSharedJourneyReconnect,root.CareerModeProductionSharedTerminalClose].some(api=>api?.productionEnabled===true)||psscWaitContext(request,live.watching);}
320: 
321:   function psscWaitingKey(){
322:     const screen=psscField("seasonEntry"),request=psscRequestContext();if(!psscWaitScreen()||!view||!request||contextKey!==request.key||!psscResultsReady(request))return "";
323:     if(!view.committed&&view.managerRole!==view.coordinatorRole)return `${contextKey}|commit`;
324:     if(view.committed&&view.ownAcknowledged&&view.phase!=="ACKNOWLEDGED")return `${contextKey}|acknowledge`;
325:     return "";
326:   }
327:   function psscFastPollDue(){const key=psscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
328:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
329:   // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
330:   function psscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(psscWaitScreen()&&psscResultsReady()&&view?.phase!=="ACKNOWLEDGED"?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(psscRequestContext()):null);}catch(_error){path=null;}return budget.watchWaitPoint("season-commit",path,psscWaitWake);}
331:   function psscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void psscTick(true);};inflight.then(again,again);return;}if(!busy){void psscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void psscTick(true);},400);}
332:   // Phoenix r100 (B6's one-off stall, lead thread): while this phone waits on the rival's lock or confirm, both timed checks
333:   // stop as long as the wait listener looks healthy, and "healthy" has no confirm window of its own (a cached copy ends it at
334:   // once, silence never does). So one late or lost delivery of the commit could hold CONFIRM SEASON back until the screen was
335:   // touched. During that wait the 15 s check keeps running and reads the commit from the server (readServerNext, so no copy the
336:   // listener left behind is reused); the 3 s check stays held back. One light commit read per 15 s on the waiting phone for the
337:   // first 3 minutes of the wait (FAST_POLL_WINDOW_MS), then one per 60 s (lead: ~19 reads in a 10-minute wait); a delivery still
338:   // wakes the screen at once.
339:   function psscWaitCheckPath(){try{if(!psscWaitingKey())return "";const request=psscRequestContext();return request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:"";}catch(_error){return "";}}
340:   const WAIT_CHECK_SLOW_MS=60000;let waitCheckKey="",waitCheckSince=0,waitCheckLast=0;
341:   function psscWaitCheck(){const path=psscWaitCheckPath();if(!path){waitCheckKey="";return;}if(busy||root.document?.visibilityState==="hidden"||root.navigator?.onLine===false)return;const key=psscWaitingKey(),now=Date.now();if(key!==waitCheckKey){waitCheckKey=key;waitCheckSince=now;waitCheckLast=0;}if(now-waitCheckSince>=FAST_POLL_WINDOW_MS&&now-waitCheckLast<WAIT_CHECK_SLOW_MS-1000)return;waitCheckLast=now;try{root.CareerModeFirestoreBudget?.readServerNext?.(path);}catch(_error){}void psscTick();}
342:   // Phoenix (r100, Nik 2026-11-24 15:35 UTC): the W8 "· LIVE" / "· CHECKED h:mm PM" wait-line words are dropped; Phoenix stays in
343:   // the background. The W8 listener rebuild (back-off) is unchanged.
344:   function psscFastTick(){psscWatchWait();if(psscWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!psscFastPollDue())return;void psscTick(true);}
345:   // r75: the 15 s check of the visible Season Commit screen reads the shared commit from the server (see Transfer).
346:   // r84: no commit exists before both results are published, so the fresh read starts then (before, it ran every check of the
347:   // results wait: ~37 billed reads/min for both phones); a healthy listener on the commit replaces it.
348:   function psscScreenFresh(){try{const request=psscRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)&&psscResultsReady(request)){const path=`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
349:   async function psscTick(light=false){if(!psscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=psscField("seasonEntry");if(!psscWaitScreen())return;psscRender();if(view?.phase==="ACKNOWLEDGED"&&contextKey===psscRequestContext()?.key)return;if(light!==true)psscScreenFresh();try{await psscRefresh(light===true);}catch(_error){}}
350:   function psscAttachHeadingObserver(){
351:     if(!root.MutationObserver||!root.document)return false;const heading=psscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;
352:     headingObserver=new root.MutationObserver(()=>void psscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;
353:   }
354:   function psscInstallObservers(){if(psscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(psscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
355:   function psscInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-connected-account-state-change","career-mode-firestore-quota"])root.addEventListener?.(event,()=>psscDropWaitContext());root.addEventListener?.("career-mode-shared-wait-context-change",()=>void psscTick());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")psscDropWaitContext(true);else psscWaitReturn();});if(root.document)root.document.addEventListener("click",psscCapture,true);psscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void psscTick());if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!psscWaitHealthy())void psscTick();else psscWaitCheck();},POLL_MS);root.setInterval(psscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void psscTick(),0);return true;}
356: 
357:   // Phoenix W5: a new Showdown (or the ended one let go on Home) puts this module's Showdown data back to a fresh page's (the reset in js/persistentNikDanielPair.js).
358:   try{(root.CareerModeShowdownClears||(root.CareerModeShowdownClears={}))["season-commit"]=()=>{psscDropWaitContext();waitSettled.clear();view=null;contextKey="";refreshRequestKey="";errorMessage="";pendingErrorKind="";readError="";readErrorKey="";readGeneration+=1;heldReportKey="";fastWaitKey="";fastWaitSince=0;waitFailures={key:"",count:0};};}catch(_error){}
359:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-commit",productionEnabled:true,runtimeRevision:"1.9.1-r10",requiresResultsReady:true,requiresCoordinatorCommit:true,requiresBothAcknowledgements:true,coordinatorCommitAlsoAcknowledges:true,reusesSeasonReview:true,distinctFromLocalConfirm:true,boundedStaleRetry:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,waitingListenerHealthy:psscWaitHealthy,isWaitingForRival:()=>Boolean(psscWaitingKey()),install:psscInstall,refresh:psscRefresh,seasonResultClash:psscSeasonResultClash,getState:()=>view,isActive:psscSharedMarker});
360: });
```

## FILE: js/productionSharedMultiSeasonProgression.js (282 lines in total)
### lines 140-235
```javascript
140:     const games=new root.MutationObserver(pmspNameSeason);for(const id of PMSP_GAME_SCREENS){const el=pmspField(id);if(el)games.observe(el,{attributes:true,attributeFilter:["class"]});}pmspNameSeason();
141:   }
142:   function pmspNameSeason(){
143:     const chip=pmspField("seasonIndicator"),showdown=pmspShowdown();if(!chip||!showdown||!/-Season Showdown$/.test(chip.textContent||""))return false;
144:     if(![...PMSP_GAME_SCREENS].some(id=>{const el=pmspField(id);return el&&!el.classList.contains("hidden");}))return false;
145:     chip.textContent=`Season ${pmspResolveSeason()} / ${Number(showdown.totalRounds)||1}`;return true;
146:   }
147:   function pmspScreenVisible(){const screen=pmspField("seasonEntry"),review=pmspField("seasonReviewPanel");return Boolean(screen&&!screen.classList.contains("hidden")&&review&&!review.classList.contains("hidden"));}
148:   function pmspHistoryWitnessed(){
149:     if(!pmspScreenVisible())return false;const season=pmspEnsureCursor(),history=historyApi?.getState?.(),panel=pmspField("sharedHistoryConvergencePanel");
150:     return Boolean(season&&history&&history.authoritative===true&&history.phase==="HISTORY_CONVERGED"&&Number(history.throughSeason)===season&&history.projection?.acceptedSeasons===season&&panel&&!panel.classList.contains("hidden"));
151:   }
152:   function pmspCanContinue(){
153:     const season=pmspEnsureCursor(),state=view?.state;if(!season||!state||state.terminal||!pmspHistoryWitnessed())return false;
154:     return Number.isInteger(state.acceptedSeasons)&&state.acceptedSeasons>=season&&season<pmspFinalSeason(state);
155:   }
156:   function pmspTerminalWitnessed(){const season=pmspEnsureCursor(),state=view?.state;return Boolean(season&&state?.terminal===true&&state.acceptedSeasons===pmspFinalSeason(state)&&season===pmspFinalSeason(state)&&pmspHistoryWitnessed());}
157:   function pmspEnsureUi(){
158:     const review=pmspField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
159:     // r80: the status line belongs to CONTINUE, so it sits inside the action row, first: on phones and at 1920x1080 that row
160:     // is the docked band, and a line just above the band was under it wherever the page scrolled. Moved only once.
161:     let status=pmspField(STATUS_ID);if(!status){status=root.document.createElement("p");status.id=STATUS_ID;status.className="seasonReviewWarning sharedMultiSeasonProgressionStatus hidden";}
162:     let action=pmspField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton hidden";action.type="button";actions.prepend(action);}
163:     if(status.parentNode!==actions)actions.prepend(status);
164:     return {status,action};
165:   }
166:   // F1: this phone reached its final season's results (or saw every season accepted), so the Champion screen is due here. A
167:   // reload, a closed tab or a cold start at the close opens it again (js/productionSharedJourneyEntry.js championAfterClose)
168:   // until the player leaves it. Storage only, written once.
169:   const PMSP_CHAMPION_KEY="cms.championPending.v1";
170:   function pmspMarkChampionDue(rivalryId){try{if(rivalryId&&typeof root.writeStorageValue==="function"&&root.readStorageValue?.(PMSP_CHAMPION_KEY)!==rivalryId)root.writeStorageValue(PMSP_CHAMPION_KEY,rivalryId);}catch(_error){}}
171:   function pmspRender(){
172:     {const season=pmspEnsureCursor(),state=view?.state,rivalryId=pmspRivalryId();if(season&&state&&rivalryId&&String(view.rivalryId||"")===rivalryId&&season===pmspFinalSeason(state)&&pmspScreenVisible())pmspMarkChampionDue(rivalryId);}
173:     const ui=pmspEnsureUi();if(!ui)return false;const season=pmspEnsureCursor(),state=view?.state,visible=Boolean(pmspSharedMarker()&&season&&state&&pmspScreenVisible()&&Number.isInteger(state.acceptedSeasons)&&state.acceptedSeasons>=season);
174:     pmspHidden(ui.status,!visible);pmspHidden(ui.action,!visible);if(!visible)return false;
175:     if(pmspTerminalWitnessed()&&Number.isInteger(state.sackedSeason)){
176:       const names=pmspSackedNames();pmspText(ui.status,`SEASON ${state.sackedSeason} PLAYED · ${names.length?names.join(" AND "):"A MANAGER"} SACKED · FINAL RESULT NEXT`);pmspText(ui.action,"SHOWDOWN OVER ✓");pmspDisable(ui.action,true);return true;
177:     }
178:     if(pmspTerminalWitnessed()){
179:       pmspText(ui.status,Number(state.totalSeasons)===1?"SEASON PLAYED · FINAL RESULT NEXT":`ALL ${state.totalSeasons} SEASONS PLAYED · FINAL RESULT NEXT`);pmspText(ui.action,"ALL SEASONS PLAYED ✓");pmspDisable(ui.action,true);return true;
180:     }
181:     if(pmspHistoryWitnessed()){
182:       const next=season+1;pmspText(ui.status,`SEASON ${season} SAVED · CONTINUE TO SEASON ${next}`);pmspText(ui.action,`CONTINUE TO SEASON ${next}`);pmspDisable(ui.action,!pmspCanContinue());return true;
183:     }
184:     // Job 33 (R8): the Shared Season Commit status already says SEASON CONFIRMED BY BOTH MANAGERS; do not repeat it.
185:     const commitStatus=pmspField("sharedSeasonCommitStatus"),duplicate=Boolean(commitStatus&&!commitStatus.classList.contains("hidden")&&commitStatus.textContent==="SEASON CONFIRMED BY BOTH MANAGERS");pmspHidden(ui.status,duplicate);
186:     pmspText(ui.status,`SEASON ${season} LOCKED · REVIEW IT BEFORE MOVING ON`);pmspText(ui.action,"WAITING FOR SEASON REVIEW");pmspDisable(ui.action,true);return true;
187:   }
188:   async function pmspRefreshNow(request=pmspRequest()){
189:     if(!request||!pmspSharedMarker())return null;await pmspEnsureDependencies();if(!pmspContextMatches(request))return null;
190:     await setupApi.refresh();if(!pmspContextMatches(request))return null;
191:     const result=pmspResult(await provider.read(await pmspProviderOptions(request)));if(!pmspContextMatches(request))return null;
192:     if(result.runtimeRevision!=="1.9.1-r13"||String(result.rivalryId)!==request.rivalryId||!["SEASON_READY","SHOWDOWN_COMPLETE"].includes(result.phase)||result.state.runtimeRevision!=="1.9.1-r13"||result.state.rivalryId!==request.rivalryId)pmspFail("MULTI_SEASON_PROJECTION_INVALID");
193:     view=result;contextKey=request.key;pmspNoteLiveSeason(request.rivalryId,Number(result.state.acceptedSeasons));const cursor=pmspEnsureCursor();if(cursor>result.state.acceptedSeasons+1)pmspFail("MULTI_SEASON_CURSOR_AHEAD_OF_AUTHORITY");pmspRender();pmspDecorateDashboard();pmspAnnounce(request);return view;
194:   }
195:   // r75: once the accepted count or terminal state changes, ask Local Reconciliation to run its automatic final check now. It
196:   // used to learn about the last accepted season only from unrelated repeated events, which stopped once those cascades
197:   // were cut, so Final Winner waited for the next 15 s poll. Called once per change, never for an unchanged refresh.
198:   function pmspAnnounce(request){
199:     const state=view?.state;if(!state)return;
200:     const key=`${request.key}|${view.phase}|${state.acceptedSeasons}|${state.totalSeasons}|${state.terminal===true}`;
201:     if(key===announcedKey)return;announcedKey=key;
202:     if(state.terminal===true)pmspMarkChampionDue(request.rivalryId);
203:     const local=root.CareerModeProductionSharedLocalReconciliation;
204:     if(state.terminal===true&&local&&typeof local.autoCheck==="function"&&typeof root.setTimeout==="function")root.setTimeout(()=>{try{void local.autoCheck();}catch(_error){}},0);
205:   }
206:   function pmspRefresh(){const request=pmspRequest();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;contextKey=request.key;busy=true;const current=pmspRefreshNow(request).then(value=>{if(pmspContextMatches(request)){lastErrorCode="";lastErrorKey="";heldErrorKey="";}return value;},error=>{const code=String(error?.code||"MULTI_SEASON_REFRESH_FAILED").replace(/[^A-Za-z0-9_-]/g,"").slice(0,80);if(!pmspContextMatches(request))return null;const key=`${request.key}|${code}`;lastErrorCode=code;if(key!==lastErrorKey&&key!==heldErrorKey){heldErrorKey=key;return null;}heldErrorKey="";if(key!==lastErrorKey)pmspReport("Could not refresh season progress",error);lastErrorCode=code;lastErrorKey=key;return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;pmspRender();if(wakePending){wakePending=false;root.setTimeout?.(pmspWake,0);}});refreshPromise=current;return current;}
207:   async function pmspAdvance(){
208:     if(busy&&refreshPromise){try{await refreshPromise;}catch(_error){}}
209:     if(busy||!pmspCanContinue())return false;const request=pmspRequest();if(!request)return false;const state=view.state,season=pmspEnsureCursor();
210:     if(season>=pmspFinalSeason(state))return false;exposedSeason=season+1;pmspMarkContinued(request.rivalryId,exposedSeason);pmspRender();
211:     try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-season-cursor-change",{detail:{rivalryId:request.rivalryId,previousSeason:season,activeSeason:exposedSeason,acceptedSeasons:state.acceptedSeasons}}));}catch(_error){}
212:     if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false});pmspDecorateDashboard();
213:     // Job 33 (R2): go straight on to the new season's Shared Transfer Challenge (the same open() the dashboard button runs).
214:     // Opening is a read plus navigation; Daniel still taps START SHARED 15-MINUTE WINDOW. On failure the dashboard button stays.
215:     try{const transfer=root.CareerModeProductionSharedTransferChallenge;if(transfer&&typeof transfer.open==="function"){if(typeof transfer.install==="function")transfer.install();await transfer.open();}}catch(_error){}
216:     return true;
217:   }
218:   // Job 19: a fresh runtime starts its page-memory cursor at season 1. After the exact ACTIVE session is
219:   // re-established, the entry resumes at the provider-authoritative active season (acceptedSeasons+1, or the
220:   // final season once all are accepted). The cursor only moves forward and never past provider authority.
221:   // F1: options.holdForReview resumes at the last accepted season instead when this phone never tapped its CONTINUE (see
222:   // pmspContinuedInto); the entry then opens that season's results, or calls releaseHeldSeason when it cannot.
223:   let heldSeason=null;
224:   async function pmspResumeFromAuthority(options={}){
225:     if(!pmspSharedMarker())return null;
226:     let result=await pmspRefresh();if(!result)result=await pmspRefresh();
227:     const request=pmspRequest(),state=view?.state;
228:     if(!result||!request||!view||view.authoritative!==true||!state||String(view.rivalryId||"")!==request.rivalryId)return null;
229:     const total=Number(state.totalSeasons),accepted=Number(state.acceptedSeasons);
230:     const held=options?.holdForReview===true&&pmspHoldsForReview(request.rivalryId,accepted,total,state.terminal);
231:     const target=state.terminal===true?pmspFinalSeason(state):held?accepted:accepted+1;
232:     heldSeason=held?Object.freeze({key:request.key,rivalryId:request.rivalryId,season:accepted}):null;
233:     if(!Number.isInteger(total)||!Number.isInteger(accepted)||accepted<0||!Number.isInteger(target)||target<1||target>total)return null;
234:     const previous=pmspEnsureCursor();
235:     if(target>previous){
```

## FILE: js/productionSharedJourneyEntry.js (825 lines in total)
### lines 380-470
```javascript
380:   }
381:   async function openCareerStart(){
382:     await loadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
383:     const career=root.CareerModeProductionSharedCareerStart;if(!career||typeof career.openPanel!=="function")throw new Error("Career Start is unavailable.");
384:     await career.openPanel();return true;
385:   }
386:   // Job 19: a fresh runtime (reload) re-establishes the exact ACTIVE session and then resumes at the
387:   // provider-authoritative active season instead of replaying Career Start and season 1.
388:   async function resumeSeasonResults(resumed){
389:     const confirmed=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(!confirmed||confirmed.ready!==true)return false;
390:     const season=Number(resumed.season),role=confirmed.managerRole,rivalryId=confirmed.rivalryId;
391:     // F1: a Showdown whose seasons are all accepted resumes on its final season's results too: Final Winner and the automatic
392:     // close follow there, as on a phone that never reloaded (it used to land on a SHOWDOWN COMPLETE dashboard with a dead button).
393:     if(!rivalryId||!role||!Number.isInteger(season)||season<1)return false;
394:     // A hint selects a possible route, never gameplay authority. Missing/unavailable storage keeps the full-screen fallback.
395:     let hint=null;try{hint=root.readStorageValue?.(`cms.transferViews.v1:${rivalryId}:${season}:${role}`);}catch(_error){}
396:     if(!hint)return false;
397:     await loadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
398:     const transfer=root.CareerModeProductionSharedTransferChallenge;await transfer.refresh();
399:     if(!transfer.canResumeResults())return false;
400:     transfer.install();
401:     await loadScript("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js",()=>root.CareerModeProductionSharedSeasonResultsRoute);
402:     const route=root.CareerModeProductionSharedSeasonResultsRoute;route.install();return route.open();
403:   }
404:   function localSeasonPlayed(){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;return Boolean(showdown&&(Array.isArray(showdown.rounds)&&showdown.rounds.length>0||Number(showdown.currentRound)>1));}catch(_error){return false;}}
405:   async function resumeAcceptedSeason(){
406:     await loadScript("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
407:     const progression=root.CareerModeProductionSharedMultiSeasonProgression;
408:     if(!progression||typeof progression.resumeFromAuthority!=="function")return false;
409:     progression.install?.();
410:     // F1: a season this phone accepted but never continued from reopens on its results (Shared History, CONTINUE, Gazette).
411:     const resumed=await progression.resumeFromAuthority({holdForReview:true});
412:     // r87 arch S-01: an unread season count is not "no season played". When the reads failed and this phone's own save
413:     // already holds a played season, Career Start (season 1) is the wrong landing: fail into the retryable entry instead.
414:     if(!resumed&&progression.lastError?.()&&localSeasonPlayed()){const error=new Error("Your season could not be checked. Check your internet, then press START again.");error.code="MULTI_SEASON_RESUME_UNREAD";throw error;}
415:     if(!resumed||!Number.isInteger(resumed.acceptedSeasons)||resumed.acceptedSeasons<0)return false;
416:     // The Results route is a nicer landing, never a new way to fail: any error here keeps the existing fallback.
417:     let routed=false;try{routed=await resumeSeasonResults(resumed);}catch(_error){}
418:     if(routed)return true;
419:     if(resumed.heldForReview===true)progression.releaseHeldSeason?.();
420:     // F1: every season accepted and the final results could not open: a closed Showdown shows its Champion screen (or Home),
421:     // never the SHOWDOWN COMPLETE dashboard.
422:     if(resumed.terminal===true&&await showdownClosedNow()){await openClosedShowdown();return true;}
423:     if(resumed.acceptedSeasons<1)return false;
424:     if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false,allowCanonicalFallback:true});else if(typeof root.showScreen==="function")await root.showScreen("dashboard",false);
425:     progression.decorateDashboard?.();
426:     return true;
427:   }
428:   // F1 (fault suite, a stale tab or a reload at the close): a Showdown that has already closed must never open its Season 1
429:   // screens (the wheel, GET READY, Career Start) or a SHOWDOWN COMPLETE dashboard. Before any of those, the close is checked:
430:   // first what this page already holds (Terminal Close, the pair, the season count; no read), and only when this entry's own
431:   // reads came back without a usable session (which is what a close leaves) one Terminal Close read. A normal entry reads nothing more.
432:   const CHAMPION_KEY="cms.championPending.v1";
433:   function validRivalry(id){return /^pair_[0-9a-f]{64}$/.test(String(id||""));}
434:   function championPending(){try{const id=String(root.readStorageValue?.(CHAMPION_KEY)||"");return validRivalry(id)?id:"";}catch(_error){return "";}}
435:   function clearChampionPending(rivalryId){try{if(rivalryId&&championPending()===rivalryId)root.removeStorageValue?.(CHAMPION_KEY);}catch(_error){}}
436:   // Phoenix W2 F3: the closed Showdown this phone has shown (or settled) its Champion screen for. Only a phone without it, and
437:   // without the due note above, takes the fresh-device path below; a phone that played the Showdown to its end never does.
438:   const CHAMPION_SHOWN_KEY="cms.championShown.v1";
439:   function championShown(){try{const id=String(root.readStorageValue?.(CHAMPION_SHOWN_KEY)||"");return validRivalry(id)?id:"";}catch(_error){return "";}}
440:   function noteChampionShown(rivalryId){try{if(validRivalry(rivalryId)&&championShown()!==rivalryId)root.writeStorageValue?.(CHAMPION_SHOWN_KEY,rivalryId);}catch(_error){}}
441:   function closedHere(){
442:     try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();if(t&&t.phase==="CLOSED"&&t.terminal===true&&validRivalry(t.rivalryId))return t.rivalryId;}catch(_error){}
443:     return "";
444:   }
445:   async function showdownClosedNow(){
446:     if(closedHere())return true;
447:     let setupReady=false;try{setupReady=root.CareerModeProductionSharedShowdownSetup?.getState?.()?.ready===true;}catch(_error){}
448:     const unread=Boolean(root.CareerModeProductionSharedMultiSeasonProgression?.lastError?.());
449:     if(setupReady&&!unread)return false;
450:     try{
451:       const close=await loadScript("ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose);
452:       close.install?.();const state=close.getState?.()?.phase==="CLOSED"?close.getState():await close.refresh();
453:       return Boolean(state&&state.phase==="CLOSED"&&state.terminal===true);
454:     }catch(_error){return false;}
455:   }
456:   // The Showdown Champion screen of a closed Showdown: Season Results' host draws Final Winner from Terminal Close's verified
457:   // witness (js/seasonFinalV10.js) and fetches the finished history itself. When it cannot be shown, Home (the pair lets the
458:   // closed Showdown go there). Never a Season 1 screen.
459:   let championPromise=null;
460:   function openClosedShowdown(){
461:     if(championPromise)return championPromise;
462:     championPromise=(async()=>{
463:       closePanel();try{root.CareerModeProductionSharedCareerStart?.closePanel?.();}catch(_error){}
464:       let shown=false;
465:       try{if(closedHere()&&typeof root.navigateTo==="function"){await loadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);shown=await root.navigateTo("seasonEntry",{addToHistory:false,allowCanonicalFallback:false})===true;if(shown)noteChampionShown(closedHere());}}catch(_error){shown=false;}
466:       if(!shown&&typeof root.navigateTo==="function")await root.navigateTo("mainMenu",{addToHistory:false});
467:       return shown;
468:     })().finally(()=>{championPromise=null;});
469:     return championPromise;
470:   }
```
### lines 620-645
```javascript
620:   }
621:   function championAfterEntryClosed(rivalryId,pair){
622:     if(!validRivalry(rivalryId)||rivalryId!==enteringRivalryId||Date.now()-enteringAt>ENTRY_CLOSE_WINDOW_MS||entryCloseTried.has(rivalryId))return false;
623:     if(root.getActiveScreenName?.()!=="mainMenu")return false;
624:     entryCloseTried.add(rivalryId);enteringRivalryId="";
625:     // The entry's own layers over Home (GET READY, Remote Joining waiting for a session that is now closed) go first.
626:     disarmRemoteReturn();closePanel();try{root.CareerModeSparkRemoteJoining?.closePanel?.();}catch(_error){}try{root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});}catch(_error){}
627:     // As after a reload at the close (championAfterClose): the live-game flag, and with it js/ssjr.js's loading screen, stays
628:     // until the Champion screen is up; when it cannot open, the resume lets go and Home shows.
629:     const promise=championForClosedRivalry(rivalryId,pair).catch(()=>false).then(shown=>{if(!shown)root.careerModeTabResumeLetGo=true;try{root.sessionStorage?.removeItem(LIVE_GAME_KEY);}catch(_error){}return shown;});
630:     entryChampionRun={rivalryId,promise};
631:     return true;
632:   }
633:   // Leaving the Champion screen of a closed Showdown (BACK TO SHOWDOWN HOME, REMATCH, any route) forgets the note. The close
634:   // usually lands while Season Results is already open (no new screen event), so the closed state is read on leaving it.
635:   let lastScreen="";
636:   function followChampionScreen(){
637:     const screen=root.getActiveScreenName?.()||"",closed=closedHere();
638:     if(lastScreen==="seasonEntry"&&screen&&screen!=="seasonEntry"&&closed){clearChampionPending(closed);noteChampionShown(closed);}
639:     // Phoenix W2 F3: the Champion screen of a closed Showdown is up on this phone (it played to the end here).
640:     if(screen==="seasonEntry"&&closed)noteChampionShown(closed);
641:     // r96 F3: the entry reached a game screen, so the followers there own the close from now on.
642:     if(screen&&screen!=="mainMenu"){enteringRivalryId="";pageLeftHome=true;}
643:     lastScreen=screen;
644:   }
645:   // F1: a page left on a game screen that is not the Champion screen (a stale tab's dashboard or Season 1 wheel, Career
```

## FILE: js/productionSharedTerminalClose.js (440 lines in total)
### lines 165-190
```javascript
165:   // 2.4.0: the Squad Management stage (#sqStage) sits over the game screens, so it is taken down first, also when Home already
166:   // shows under it; its open screen ends with no write (js/squadSheetStep.js end()).
167:   // Phoenix r100 (B2, twotabs end-showdown): the notice shows once per ended Showdown on this page, whichever path leaves it.
168:   // leaveEnded(rivalryId) is Journey Entry's path: a CONTINUE tapped on Home as END SHOWDOWN landed had found Home showing at
169:   // that moment (so nothing left it), then opened the ended Showdown's Career Start. Journey Entry calls it only after Terminal
170:   // Close itself holds the rivalry DELETED (a server read); it leaves for Home even when Home shows under the entry's layers.
171:   const endedNoticeShown=new Set();
172:   function ptcEndedNotice(rivalryId){const id=String(rivalryId||"");if(endedNoticeShown.has(id))return;endedNoticeShown.add(id);root.showAppNotice?.("This Showdown was ended for both players. Legacy keeps it as Ended early.","info",8000);}
173:   function ptcLeaveEnded(rivalryId){const held=ptcCurrentState();if(!held||held.phase!=="DELETED"||!rivalryId||held.rivalryId!==rivalryId)return false;ptcLeaveEndedShowdown(rivalryId,true);return true;}
174:   function ptcLeaveEndedShowdown(rivalryId,fromEntry=false){
175:     // #1449 the Squad stage; E1 (2.4.0, Fable re-check 2) the Chamber Men stage, the roulette's panel and stage and the Prime
176:     // Pack takeover: each run on screen for this Showdown ends at once (no write after it) and its stage goes, so the notice
177:     // below and Home are never covered.
178:     for(const step of ["CareerModeSquadSheetStep","CareerModeChamberMenStep","CareerModeRosterRouletteStep","CareerModeIconGuessStep"])try{root[step]?.end?.(rivalryId);}catch(_error){}
179:     try{
180:       const home=root.document?.getElementById("mainMenu");
181:       if(home&&!home.classList.contains("hidden")&&!fromEntry)return;
182:       root.stopTransferTimerLoop?.();root.resetTransientSelectionOperations?.();root.resetNavigationState?.();
183:       if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);else void root.navigateTo?.("mainMenu",{addToHistory:false});
184:       root.refreshMainMenuExperience?.();
185:       ptcEndedNotice(rivalryId);
186:     }catch(_error){}
187:   }
188:   function ptcClear(){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
189:   function ptcStillCurrent(request,generation){return ptcRequest()?.key===request.key&&stateGeneration===generation;}
190:   // A verified stored closure can finish the same gameplay through a replacement session. This comparison is read-only;
```

## FILE: js/v10Screens.js (691 lines in total)
### lines 415-430
```javascript
415:   }
416:   // The cover's own timer: at STYLE_TIMEOUT_MS it ends the hold, unless the screen is shown and its files are still loading.
417:   function vsPendingTimer(id){return root.setTimeout(()=>vsPendingTimeout(id),STYLE_TIMEOUT_MS);}
418:   function vsPendingTimeout(id){
419:     const entry=pending.get(id);
420:     if(!entry)return;
421:     if((loadingNow.has(id)||lateLoading.has(id)||vsHeld(id))&&vsIsShown(id)&&Date.now()-entry.since<LOAD_HOLD_MAX_MS){entry.timer=root.setTimeout(()=>vsPendingTimeout(id),250);return;}
422:     vsSettle(id);
423:   }
424:   function vsHeld(id){try{return !mounted.has(id)&&registry.get(id)?.frame?.()===HOLD;}catch(_error){return false;}}
425:   function vsSettle(id,reveal=false){
426:     const entry=pending.get(id);
427:     if(!entry)return;
428:     pending.delete(id);root.clearTimeout(entry.timer);slowNow.delete(id);
429:     vsGateRelease();
430:     if(entry.host.dataset){
```
