# Fable 5.2 red-team job FJ9: Scoring, Final Winner and History

You are an independent red-team reviewer. Read only the code in this file. Change nothing, write no patches longer than 5 lines.

## The game in 8 lines
A private two-player FIFA 17 career "Showdown" between exactly two managers, Nik and Daniel, each on his own phone or Chromebook, sharing one Firebase Firestore database (Spark free tier: every read and write counts). A Showdown is 1, 3, 5 or 10 seasons. Each season runs in a fixed order that is never skipped: Roulette (squad shot) -> Prime Pack (guess a masked player, 4/3/2/1 points, one winner or none) -> Transfer War (15-minute shared window on the server clock, private signings) -> season played in FIFA -> each manager enters and publishes his own result -> both tap CONFIRM SEASON -> ONE shared season commit -> next season, or Terminal Close and Final Winner after the last season. Sacked: either manager ticks it on Season Results and the Showdown ends after that season; points so far decide. Equal points are a DRAW: there is no tiebreak anywhere. Golden Showdown = 150 points over 10 seasons; perfect season = 15. Finished Showdowns feed History and career totals; unfinished or ended-early ones that never finished stay out.

## Code
Repo nikahanghojjati-oss/fifa17-career-showdown2, commit fec8af69 (main: release 2.11.0, live since 2026-11-23, with the 3D League Roulette). Every file below is the exact file at that commit, each line prefixed with its line number. Rules files are Firestore security rules fragments that are composed into the deployed rules.

## Threat model (important)
This is a private two-player tool. Out of scope: anything that needs a modified app, hand-made Firestore requests, a third person, a stolen account, or "an attacker". In scope: anything that can happen in NORMAL play on the real app: two phones acting at the same instant, double taps, retries after a network error, a phone offline or asleep, a tab killed or reloaded at any moment, a phone joining late, a phone clock that is minutes off, a slow network, an older app version on one phone.

## What counts as a finding
A finding must give: (1) what the player sees, (2) an exact sequence of normal actions that causes it, (3) the file:line(s) in THIS packet that cause it, with a short quote, (4) severity, (5) a one-line fix idea. You cannot run the code, so label each finding TRACED (you followed every step through the quoted code and are sure) or UNSURE (it depends on code not in this packet, or timing you could not settle; say exactly what). Never present a guess as a bug. Before reporting, try to refute each finding yourself by looking for the guard that would stop it; drop it if you find one.
Severity: P0 = the game cannot continue, for good, or data is lost; P1 = a step is blocked, or a wrong result/score/winner sticks; P2 = wrong but recoverable (a reload fixes it); P3 = cosmetic or wording.

## Do not report
Style, naming, refactors, performance unless it costs Firebase reads in normal play (then give the count), looks/fonts/layout, missing comments, tests, and anything in "Known" below. At most 8 findings; stop when you have 3 TRACED P0/P1.

## Report format (plain words, one markdown answer)
First line: VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
Then one block per finding: ID (FJ9-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Do season points, totals, winner or draw, Golden Showdown (150 over 10 seasons) and perfect season (15) come out the same on both phones from the same results?
2. Is there any tiebreak anywhere (equal points must always be a DRAW)?
3. Can History or career totals count an unfinished, ended-early-unfinished or unjoined Showdown, or miss a finished one from r79 onward?
4. Can the two phones' History disagree for longer than one refresh?
5. Any rounding or missing-value case (a season with no result, Sacked season) that gives a wrong total?

## Known (do not report)
Showdowns finished before r79 are hidden on purpose.

## Files

## FILE: js/productionSharedCanonicalScoring.js (121 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedCanonicalScoring=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   // Job 33 (R1): after this manager acknowledged, read every 3 s for at most 3 minutes until the canonical score is reconciled.
10:   const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
11:   let fastWaitKey="",fastWaitSince=0;
12:   let installed=false,busy=false,view=null,contextKey="",setupApi=null,commitApi=null,provider=null,catalogApi=null,refreshPromise=null,headingObserver=null,bootstrapObserver=null;
13: 
14:   function pcscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
15:   function pcscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
16:   function pcscSharedMarker(){const showdown=pcscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
17:   function pcscField(id){return root.document&&root.document.getElementById(id);}
18:   function pcscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
19:   function pcscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
20:   function pcscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
21:   function pcscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
22:   async function pcscEnsureDependencies(){
23:     if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
24:     await pcscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
25:     await pcscLoadScript("ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit);
26:     await pcscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
27:     await pcscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
28:     await pcscLoadScript("ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js",()=>root.CareerModeSharedCanonicalScoring);
29:     await pcscLoadScript("ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js",()=>root.CareerModeSparkSharedCanonicalScoring);
30:     await pcscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
31:     setupApi=root.CareerModeProductionSharedShowdownSetup;commitApi=root.CareerModeProductionSharedSeasonCommit;provider=root.CareerModeSparkSharedCanonicalScoring;catalogApi=root.CareerModeSharedShowdownCatalog;
32:     if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pcscFail("CANONICAL_SCORING_SETUP_UNAVAILABLE");
33:     if(!commitApi||typeof commitApi.refresh!=="function"||typeof commitApi.getState!=="function")pcscFail("CANONICAL_SCORING_SEASON_COMMIT_UNAVAILABLE");
34:     if(!provider||typeof provider.read!=="function")pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE");
35:     if(!catalogApi||!catalogApi.catalog)pcscFail("CANONICAL_SCORING_CATALOG_UNAVAILABLE");
36:   }
37:   function pcscTeamCount(){const setup=setupApi?.getState?.()?.setup,clubs=setup?.leagueId?catalogApi?.catalog?.[setup.leagueId]:null;if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)pcscFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return clubs.length;}
38:   function pcscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pcscShowdown()?.currentRound,season=Number(pcscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pcscFail("CANONICAL_SCORING_SEASON_INVALID");return season;}
39:   function pcscConfirmedSetupRivalry(){try{const s=(setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
40:   function pcscRequestContext(){const showdown=pcscShowdown(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pcscConfirmedSetupRivalry()||"").trim();let seasonNumber;try{seasonNumber=pcscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
41:   function pcscContextMatches(request){const current=pcscRequestContext();return Boolean(request&&current&&request.key===current.key);}
42:   function pcscCommitReady(request=pcscRequestContext()){const state=commitApi?.getState?.();return Boolean(request&&state&&state.committed===true&&state.phase==="ACKNOWLEDGED"&&state.revision===3&&Number(state.seasonNumber)===request.seasonNumber&&String(state.rivalryId||"")===request.rivalryId);}
43:   function pcscResult(result){if(result&&result.ok===true)return result;const error=new Error("Shared canonical scoring could not be verified.");error.code=result&&result.code||"CANONICAL_SCORING_PROVIDER_FAILED";throw error;}
44:   function pcscManagerName(role){return pcscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
45:   function pcscEnsureUi(){
46:     const review=pcscField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
47:     let panel=pcscField("sharedCanonicalScoringPanel");if(!panel){panel=root.document.createElement("section");panel.id="sharedCanonicalScoringPanel";panel.className="seasonReviewBreakdown sharedCanonicalScoringPanel hidden";panel.setAttribute("aria-live","polite");panel.innerHTML='<h3 id="sharedCanonicalScoringHeading">SEASON SCORE</h3><p id="sharedCanonicalScoringTotals"></p><p id="sharedCanonicalScoringBreakdown"></p><p id="sharedCanonicalScoringWinner"></p>';actions.parentNode.insertBefore(panel,actions);}
48:     return {panel,totals:pcscField("sharedCanonicalScoringTotals"),breakdown:pcscField("sharedCanonicalScoringBreakdown"),winner:pcscField("sharedCanonicalScoringWinner")};
49:   }
50:   // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
51:   // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
52:   let pcscWatchedKey=null;
53:   function pcscWatchSync(){let key="";try{key=pcscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcscWatchedKey)return;pcscWatchedKey=key;try{pcscWatchWait();}catch(_error){}}
54:   function pcscRender(){pcscWatchSync();
55:     const ui=pcscEnsureUi();if(!ui)return false;const request=pcscRequestContext(),eligible=Boolean(pcscSharedMarker()&&request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="SCORING_RECONCILED");pcscHidden(ui.panel,!eligible);if(!eligible)return false;
56:     const p1=view.scoring.playerOne,p2=view.scoring.playerTwo,n1=pcscManagerName("playerOne"),n2=pcscManagerName("playerTwo");
57:     pcscText(ui.totals,`${n1}: ${p1.total} · ${n2}: ${p2.total}`);
58:     pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague}${p1.europaLeague||p2.europaLeague?` · Europa League ${p1.europaLeague||0}–${p2.europaLeague||0}`:""}${p1.primePack||p2.primePack?` · Prime Pack ${p1.primePack||0}–${p2.primePack||0}`:""} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.domesticCup}–${p2.domesticCup} · Performance Bonus ${p1.performanceBonus}–${p2.performanceBonus} · Awards Bonus ${p1.individualAwardsBonus}–${p2.individualAwardsBonus}`);
59:     pcscText(ui.winner,view.winner==="draw"?"Season result: Draw":`Season winner: ${pcscManagerName(view.winner)}`);pcscBoard(ui.panel,p1,p2,n1,n2,view.winner);return true;
60:   }
61:   // r87 match-day polish: the same numbers drawn as a scoreboard (names, big totals, one row per category with the higher
62:   // number gold, the season verdict). The three text lines above stay for screen readers and the audits; the board is
63:   // aria-hidden. Equal stays level: a row or a season is never split by anything else (no tiebreak).
64:   function pcscBoard(panel,p1,p2,n1,n2,winner){
65:     const doc=root.document;if(!doc||!panel)return;
66:     let board=panel.querySelector(":scope > .pcscBoard");if(!board){board=doc.createElement("div");board.className="pcscBoard";board.setAttribute("aria-hidden","true");panel.appendChild(board);}
67:     const key=JSON.stringify([p1,p2,n1,n2,winner]);if(board.dataset.key===key)return;board.dataset.key=key;
68:     const el=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=String(text);return node;};
69:     const side=(a,b)=>a>b?" is-lead":"";
70:     const head=el("div","pcscBoard__head");
71:     head.append(el("span","pcscBoard__name",n1),el("strong",`pcscBoard__total${side(p1.total,p2.total)}`,p1.total),el("span","pcscBoard__colon",":"),el("strong",`pcscBoard__total${side(p2.total,p1.total)}`,p2.total),el("span","pcscBoard__name",n2));
72:     const rows=el("div","pcscBoard__rows");
73:     const lines=[["Champions League",p1.championsLeague,p2.championsLeague],...(p1.europaLeague||p2.europaLeague?[["Europa League",p1.europaLeague||0,p2.europaLeague||0]]:[]),...(p1.primePack||p2.primePack?[["Prime Pack",p1.primePack||0,p2.primePack||0]]:[]),["League Title",p1.leagueTitle,p2.leagueTitle],["Domestic Cup",p1.domesticCup,p2.domesticCup],["Performance Bonus",p1.performanceBonus,p2.performanceBonus],["Awards Bonus",p1.individualAwardsBonus,p2.individualAwardsBonus]];
74:     for(const [label,a,b] of lines){const one=Number(a)||0,two=Number(b)||0,row=el("div",`pcscBoard__row${one||two?"":" is-zero"}`);row.append(el("span",`pcscBoard__val${side(one,two)}`,`+${one}`),el("span","pcscBoard__label",label),el("span",`pcscBoard__val${side(two,one)}`,`+${two}`));rows.append(row);}
75:     const verdict=el("div",`pcscBoard__verdict${winner==="draw"?" is-draw":""}`,winner==="draw"?"SEASON DRAWN":`SEASON WINNER · ${pcscManagerName(winner)}`);
76:     board.replaceChildren(head,rows,verdict);panel.classList.add("hasPcscBoard");
77:   }
78:   async function pcscProviderOptions(request){
79:     const setup=setupApi?.getState?.();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pcscFail("CANONICAL_SCORING_SETUP_NOT_CONFIRMED");
80:     if(String(setup.rivalryId)!==request.rivalryId)pcscFail("CANONICAL_SCORING_CONTEXT_STALE");
81:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE","The online service is unavailable.");
82:     return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,teamCount:pcscTeamCount(),cryptoImpl:root.crypto,nowEpochMs:Date.now()};
83:   }
84:   // Job 33 (R1): a fast waiting read (light) reuses the already-ACKNOWLEDGED (immutable) Season Commit and confirmed Setup.
85:   async function pcscRefreshNow(request=pcscRequestContext(),light=false){
86:     if(!request||!pcscSharedMarker())return null;await pcscEnsureDependencies();if(!pcscContextMatches(request))return null;
87:     if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
88:     if(light!==true){await setupApi.refresh();if(!pcscContextMatches(request))return null;await commitApi.refresh();if(!pcscContextMatches(request))return null;}
89:     if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
90:     const result=pcscResult(await provider.read(await pcscProviderOptions(request)));if(!pcscContextMatches(request))return null;
91:     if(result.phase!=="SCORING_RECONCILED"||result.revision!==1||result.seasonCommitRevision!==3||Number(result.seasonNumber)!==request.seasonNumber)pcscFail("CANONICAL_SCORING_PROJECTION_INVALID");
92:     view={...result,rivalryId:request.rivalryId};contextKey=request.key;pcscRender();return view;
93:   }
94:   function pcscRefresh(light=false,reread=false){const request=pcscRequestContext();if(!request)return Promise.resolve(null);if(reread!==true&&view&&contextKey===request.key&&view.phase==="SCORING_RECONCILED"&&!refreshPromise)return Promise.resolve(view);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pcscRefreshNow(request,light===true);refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
95:   function pcscWaitingKey(){
96:     const screen=pcscField("seasonEntry"),request=pcscRequestContext(),commit=(commitApi||root.CareerModeProductionSharedSeasonCommit)?.getState?.();if(!screen||screen.classList.contains("hidden")||!request||!commit)return "";
97:     if(commit.committed!==true||!(commit.ownAcknowledged===true||commit.phase==="ACKNOWLEDGED")||Number(commit.seasonNumber)!==request.seasonNumber||String(commit.rivalryId||"")!==request.rivalryId)return "";
98:     if(contextKey===request.key&&view&&view.phase==="SCORING_RECONCILED")return "";
99:     return `${request.key}|score`;
100:   }
101:   function pcscFastPollDue(){const key=pcscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
102:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
103:   // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
104:   function pcscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pcscWaitingKey()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(pcscRequestContext()):null);}catch(_error){path=null;}budget.watchWaitPoint("canonical-scoring",path,pcscWaitWake);}
105:   function pcscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void pcscTick(true);};inflight.then(again,again);return;}if(!busy){void pcscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pcscTick(true);},400);}
106:   function pcscFastTick(){pcscWatchWait();if(root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.()||root.document?.visibilityState==="hidden"||busy||!pcscFastPollDue())return;void pcscTick(true);}
107:   // Job 33: a failed fast (3 s) read is retried by the next poll and is not reported; the 15 s poll still reports a real failure.
108:   // Job 33: a reconciled score is immutable, so the poll stops re-reading it (Spark reads, emulator contention) until the season changes.
109:   // A read that was overtaken by CONTINUE TO SEASON N (the season cursor moved mid-read) is not an error; the next tick reads the new season.
110:   // A season cursor change event still re-reads (reread=true), so a real failure there is reported and clears the view.
111:   // *_CONTEXT_STALE means the season moved on while a nested read ran; the next tick re-reads. Stay quiet and keep the view:
112:   // pcscRender only shows it for its own season key, and a reconciled season score never changes.
113:   function pcscContextStale(error){return /_CONTEXT_STALE$/.test(String(error?.code||""));}
114:   async function pcscTick(light=false,reread=false){if(!pcscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=pcscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;const request=pcscRequestContext();if(reread!==true&&request&&contextKey===request.key&&view?.phase==="SCORING_RECONCILED"){pcscRender();return;}busy=true;try{await pcscRefresh(light===true,reread===true);}catch(error){if(request&&!pcscContextMatches(request))return;if(pcscContextStale(error)){pcscRender();return;}if(light===true)return;view=null;pcscRender();pcscReport("Could not refresh the season score",error);}finally{busy=false;}}
115:   function pcscAttachHeadingObserver(){if(!root.MutationObserver||!root.document)return false;const heading=pcscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;headingObserver=new root.MutationObserver(()=>void pcscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;}
116:   function pcscInstallObservers(){if(pcscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(pcscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
117:   function pcscInstall(){if(installed)return true;installed=true;pcscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pcscTick(false,true));if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pcscTick();},POLL_MS);root.setInterval(pcscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcscTick(),0);return true;}
118: 
119:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-canonical-scoring",scoreBoard:pcscBoard,productionEnabled:true,runtimeRevision:"1.9.1-r11",requiresAcknowledgedSeasonCommit:true,providerEnforcedSource:true,readOnlyDerivedProjection:true,reusesSeasonReview:true,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcscWaitingKey()),install:pcscInstall,refresh:pcscRefresh,getState:()=>view,isActive:pcscSharedMarker});
120: });
121: 
```

## FILE: js/productionSharedHistoryConvergence.js (116 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedHistoryConvergence=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   // Job 33 (R1): once the canonical score is reconciled, read every 3 s for at most 3 minutes until Shared History converges.
10:   const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
11:   let fastWaitKey="",fastWaitSince=0;
12:   const PANEL_ID="sharedHistoryConvergencePanel";
13:   let heldErrorKey="";
14:   let installed=false,busy=false,provider=null,setupApi=null,commitApi=null,scoringApi=null,view=null,contextKey="",refreshPromise=null;
15: 
16:   function phcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
17:   function phcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
18:   function phcSharedMarker(){const showdown=phcShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
19:   function phcField(id){return root.document&&root.document.getElementById(id);}
20:   function phcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
21:   function phcText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
22:   function phcReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
23:   function phcLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
24:   async function phcEnsureDependencies(){
25:     if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
26:     else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
27:     await phcLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
28:     await phcLoadScript("ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit);
29:     await phcLoadScript("ssjr-production-canonical-scoring","js/productionSharedCanonicalScoring.js",()=>root.CareerModeProductionSharedCanonicalScoring);
30:     await phcLoadScript("ssjr-history-convergence-protocol","js/sharedHistoryConvergence.js",()=>root.CareerModeSharedHistoryConvergence);
31:     await phcLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
32:     await phcLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
33:     await phcLoadScript("ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js",()=>root.CareerModeSharedCanonicalScoring);
34:     await phcLoadScript("ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js",()=>root.CareerModeSparkSharedCanonicalScoring);
35:     await phcLoadScript("ssjr-history-convergence-provider","js/sparkSharedHistoryConvergence.js",()=>root.CareerModeSparkSharedHistoryConvergence);
36:     await phcLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
37:     setupApi=root.CareerModeProductionSharedShowdownSetup;commitApi=root.CareerModeProductionSharedSeasonCommit;scoringApi=root.CareerModeProductionSharedCanonicalScoring;provider=root.CareerModeSparkSharedHistoryConvergence;
38:     if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")phcFail("HISTORY_CONVERGENCE_SETUP_UNAVAILABLE");
39:     if(!commitApi||typeof commitApi.refresh!=="function"||typeof commitApi.getState!=="function")phcFail("HISTORY_CONVERGENCE_COMMIT_UNAVAILABLE");
40:     if(!scoringApi||typeof scoringApi.refresh!=="function"||typeof scoringApi.getState!=="function")phcFail("HISTORY_CONVERGENCE_SCORING_UNAVAILABLE");
41:     if(!provider||typeof provider.read!=="function")phcFail("HISTORY_CONVERGENCE_PROVIDER_UNAVAILABLE");
42:   }
43:   function phcSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=phcShowdown()?.currentRound,season=Number(phcSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1||season>10)return null;return season;}
44:   function phcSetup(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
45:   function phcConfirmedSetupRivalry(s){return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}
46:   function phcCommit(){try{return commitApi?.getState?.()||null;}catch(_error){return null;}}
47:   function phcScoring(){try{return scoringApi?.getState?.()||null;}catch(_error){return null;}}
48:   function phcRequest(){
49:     const showdown=phcShowdown(),setup=phcSetup(),throughSeason=phcSeason(),rivalryId=String(showdown?.sharedJourney?.rivalryId||phcConfirmedSetupRivalry(setup)||"").trim(),saveId=String(showdown?.id||showdown?.saveId||"").trim();
50:     if(!rivalryId||!throughSeason)return null;return Object.freeze({rivalryId,throughSeason,key:`${saveId||"shared"}|${rivalryId}|history:${throughSeason}`});
51:   }
52:   function phcContextMatches(request){const current=phcRequest();return Boolean(request&&current&&request.key===current.key);}
53:   // r80: the Commit and Scoring views outlive their Showdown on a page that finished one and started the next without a
54:   // reload, so the cached terminal authority must belong to this request's rivalry as well as its season (a finished
55:   // Showdown's season 1 is not the next Showdown's season 1).
56:   function phcCachedTerminal(request){
57:     const setup=phcSetup(),commit=phcCommit(),scoring=phcScoring();
58:     return Boolean(request&&setup&&setup.ready===true&&setup.setup?.phase==="SHOWDOWN_CONFIRMED"&&setup.setup?.revision===6&&Number(setup.setup?.totalSeasons)>=request.throughSeason&&String(setup.rivalryId||"")===request.rivalryId&&commit&&String(commit.rivalryId||"")===request.rivalryId&&commit.committed===true&&commit.phase==="ACKNOWLEDGED"&&commit.revision===3&&Number(commit.seasonNumber)===request.throughSeason&&scoring&&String(scoring.rivalryId||"")===request.rivalryId&&scoring.authoritative===true&&scoring.phase==="SCORING_RECONCILED"&&scoring.revision===1&&Number(scoring.seasonNumber)===request.throughSeason&&Number(scoring.seasonCommitRevision)===3&&Number(scoring.resultsRevision)===Number(commit.resultsRevision)&&String(scoring.resultsContentHash||"")===String(commit.resultsContentHash||""));
59:   }
60:   async function phcProviderOptions(request){
61:     const setup=phcSetup();if(!request||!setup||!phcContextMatches(request))phcFail("HISTORY_CONVERGENCE_CONTEXT_STALE");
62:     if(!setup.sessionId||!setup.deviceId||!setup.accountId||!setup.managerRole)phcFail("HISTORY_CONVERGENCE_SETUP_AUTHORITY_INVALID");
63:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
64:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)phcFail("HISTORY_CONVERGENCE_PROVIDER_UNAVAILABLE");
65:     if(setup.accountId&&services.auth.currentUser.uid!==setup.accountId)phcFail("HISTORY_CONVERGENCE_AUTHORITY_MISMATCH");
66:     return Object.freeze({user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,throughSeason:request.throughSeason,nowEpochMs:Date.now()});
67:   }
68:   function phcManagerName(role){return String(phcShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
69:   function phcEnsureUi(){
70:     if(!root.document)return null;const review=phcField("seasonReviewPanel");if(!review)return null;
71:     let panel=phcField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedHistoryConvergencePanel hidden";const scoring=phcField("sharedCanonicalScoringPanel");if(scoring?.parentNode)scoring.insertAdjacentElement("afterend",panel);else review.appendChild(panel);}
72:     let heading=phcField("sharedHistoryConvergenceHeading");if(!heading){heading=root.document.createElement("h3");heading.id="sharedHistoryConvergenceHeading";panel.appendChild(heading);}
73:     let summary=phcField("sharedHistoryConvergenceSummary");if(!summary){summary=root.document.createElement("p");summary.id="sharedHistoryConvergenceSummary";panel.appendChild(summary);}
74:     let records=phcField("sharedHistoryConvergenceRecords");if(!records){records=root.document.createElement("p");records.id="sharedHistoryConvergenceRecords";panel.appendChild(records);}
75:     let trophies=phcField("sharedHistoryConvergenceTrophies");if(!trophies){trophies=root.document.createElement("p");trophies.id="sharedHistoryConvergenceTrophies";panel.appendChild(trophies);}
76:     return {panel,heading,summary,records,trophies};
77:   }
78:   function phcRecordLine(role,record){return `${phcManagerName(role)} (${record.club}): ${record.seasonWins} won, ${record.seasonDraws} drawn, ${record.seasonLosses} lost · ${record.totalPoints} pts`;}
79:   function phcTrophyLine(role,item){return `${phcManagerName(role)} ${item.totalTrophies} ${Number(item.totalTrophies)===1?"trophy":"trophies"} (${item.leagueTitles} league, ${item.domesticCups} cup, ${item.championsLeagues} Champions League${item.europaLeagues>0?`, ${item.europaLeagues} Europa League`:""})`;}
80:   function phcRender(){
81:     const ui=phcEnsureUi();if(!ui)return false;const request=phcRequest(),active=Boolean(request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="HISTORY_CONVERGED"&&view.projection);
82:     phcHidden(ui.panel,!active);if(!active)return false;const projection=view.projection;
83:     phcText(ui.heading,"SHOWDOWN SO FAR");
84:     const p1Total=Number(projection.managerRecords?.playerOne?.totalPoints)||0,p2Total=Number(projection.managerRecords?.playerTwo?.totalPoints)||0,n1=phcManagerName("playerOne"),n2=phcManagerName("playerTwo"),lead=p1Total===p2Total?"Level":p1Total>p2Total?`${n1} leads by ${p1Total-p2Total}`:`${n2} leads by ${p2Total-p1Total}`;
85:     phcText(ui.summary,`${projection.acceptedSeasons} of ${projection.totalSeasons} season${projection.totalSeasons===1?"":"s"} played · ${String(projection.leagueId||"").replace(/_/g," ").toUpperCase()} · ${n1} ${p1Total} - ${p2Total} ${n2} · ${lead}`);
86:     phcText(ui.records,`${phcRecordLine("playerOne",projection.managerRecords.playerOne)} · ${phcRecordLine("playerTwo",projection.managerRecords.playerTwo)}`);
87:     phcText(ui.trophies,`${phcTrophyLine("playerOne",projection.trophyAttribution.playerOne)} · ${phcTrophyLine("playerTwo",projection.trophyAttribution.playerTwo)}`);
88:     return true;
89:   }
90:   function phcClear(request=null){view=null;contextKey=request?.key||"";phcRender();return null;}
91:   // Job 33 (R1): a fast waiting read (light) reuses the already-reconciled Commit and Scoring authority (immutable once terminal).
92:   async function phcRefreshNow(request,light=false){
93:     if(!request||!phcSharedMarker())return phcClear(request);await phcEnsureDependencies();if(!phcContextMatches(request))return null;
94:     if(!phcCachedTerminal(request))return phcClear(request);
95:     if(light!==true){
96:       await setupApi.refresh();if(!phcContextMatches(request)||!phcCachedTerminal(request))return phcClear(request);
97:       await commitApi.refresh();if(!phcContextMatches(request)||!phcCachedTerminal(request))return phcClear(request);
98:       await scoringApi.refresh();if(!phcContextMatches(request)||!phcCachedTerminal(request))return phcClear(request);
99:     }
100:     const result=await provider.read(await phcProviderOptions(request));if(!phcContextMatches(request))return null;
101:     if(!result||result.ok!==true||result.authoritative!==true||result.phase!=="HISTORY_CONVERGED"||result.revision!==1||result.throughSeason!==request.throughSeason||String(result.rivalryId||"")!==request.rivalryId||!result.projection||result.projection.phase!=="HISTORY_CONVERGED"||result.projection.acceptedSeasons!==request.throughSeason)phcFail(result?.code||"HISTORY_CONVERGENCE_PROVIDER_INVALID");
102:     view=result;contextKey=request.key;phcRender();try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-history-convergence-state-change",{detail:{phase:view.phase,throughSeason:view.throughSeason,acceptedRevisionKey:view.acceptedRevisionKey||view.projection.acceptedRevisionKey}}));}catch(_error){}return view;
103:   }
104:   function phcRefresh(light=false){
105:     const request=phcRequest();if(!request||!phcSharedMarker())return Promise.resolve(phcClear(request));if(refreshPromise)return refreshPromise;busy=true;const current=phcRefreshNow(request,light===true).then(value=>{heldErrorKey="";return value;},error=>{if(/_CONTEXT_STALE$/.test(String(error?.code||"")))return view&&contextKey===request.key?view:null;if(phcContextMatches(request)){const key=`${request.key}|${String(error?.code||error?.message||"HISTORY_FAILED").slice(0,80)}`;if(key!==heldErrorKey){heldErrorKey=key;if(view&&contextKey===request.key)return view;phcClear(request);return null;}heldErrorKey="";phcClear(request);phcReport("Could not bring History up to date",error);}return null;}).finally(()=>{busy=false;if(refreshPromise===current)refreshPromise=null;});refreshPromise=current;return current;
106:   }
107:   function phcWaitingKey(){const request=phcRequest();if(!request||!phcSharedMarker()||!phcCachedTerminal(request))return "";if(contextKey===request.key&&view&&view.phase==="HISTORY_CONVERGED")return "";return `${request.key}|history`;}
108:   function phcFastPollDue(){const key=phcWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}const due=now-fastWaitSince<FAST_POLL_WINDOW_MS;if(due&&root.document?.visibilityState!=="hidden")root.CareerModeFirestoreBudget?.wantFresh?.();return due;}
109:   function phcFastWake(){if(root.document?.visibilityState==="hidden"||busy||!phcFastPollDue())return;phcWake(true);}
110:   // Job 33: converged history for this season is final, so the poll stops re-reading it until the season changes.
111:   function phcWake(light=false){if(busy||root.document?.visibilityState==="hidden")return;const request=phcRequest();if(request&&contextKey===request.key&&view?.phase==="HISTORY_CONVERGED"){phcRender();return;}void phcRefresh(light===true);}
112:   function phcInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-shared-canonical-scoring-state-change","career-mode-shared-season-commit-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change","career-mode-shared-season-cursor-change"]){root.addEventListener?.(event,phcWake);}root.document?.addEventListener?.("visibilitychange",phcWake);if(typeof root.setInterval==="function"){root.setInterval(phcWake,POLL_MS);root.setInterval(phcFastWake,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(phcWake,0);return true;}
113: 
114:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-history-convergence",productionEnabled:true,runtimeRevision:"1.9.1-r12",requiresAcknowledgedSeasonCommit:true,requiresCanonicalScoring:true,providerEnforcedSource:true,readOnlyDerivedProjection:true,identitySafe:true,exactSeasonAddressing:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(phcWaitingKey()),install:phcInstall,refresh:phcRefresh,getState:()=>view,isActive:phcSharedMarker});
115: });
116: 
```

## FILE: js/productionSharedFinalReconciliation.js (115 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedFinalReconciliation=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7:   const POLL_MS=15000;
8:   const PANEL_ID="sharedFinalReconciliationPanel";
9:   const SAFE_LOCAL_PHASES=new Set(["REMOTE_OBSERVED","PREVIEW_READY","APPLIED"]);
10:   let installed=false,busy=false,protocol=null,multiApi=null,historyApi=null,localApi=null,view=null,viewContextKey="",viewGeneration=-1,refreshPromise=null,refreshContextKey="",refreshGeneration=-1,authorityGeneration=0,observedContextKey="",lastPeerEventKeys=Object.create(null),wakePending=false;
11:   function pfrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
12:   function pfrShared(){const s=pfrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
13:   function pfrConfirmedSetupRivalry(){try{const s=root.CareerModeProductionSharedShowdownSetup?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
14:   function pfrRequest(){const s=pfrShowdown();if(!s||s.sharedJourney?.mode!=="shared")return null;const rivalryId=String(s.sharedJourney?.rivalryId||pfrConfirmedSetupRivalry()||"").trim(),saveId=String(s.identity?.saveId||"").trim(),playerOneProfileId=String(s.identity?.managerProfileIds?.playerOne||"").trim(),playerTwoProfileId=String(s.identity?.managerProfileIds?.playerTwo||"").trim();if(!rivalryId||!/^save_[0-9a-f]{24}$/.test(saveId)||!/^profile_[0-9a-f]{24}$/.test(playerOneProfileId)||!/^profile_[0-9a-f]{24}$/.test(playerTwoProfileId))return null;return Object.freeze({rivalryId,saveId,playerOneProfileId,playerTwoProfileId,key:`${saveId}|${rivalryId}|${playerOneProfileId}|${playerTwoProfileId}|final-reconciliation`});}
15:   function pfrSaveAuthorityReady(){return root.CareerModeSaveLibraryRuntime?.isReady?.()===true;}
16:   function pfrTerminalClosed(){try{const phase=root.CareerModeProductionSharedTerminalClose?.getState?.()?.phase;/* r79: a deleted Showdown has no final reconciliation either */return phase==="CLOSED"||phase==="DELETED";}catch(_error){return false;}}
17:   function pfrContextMatches(request){const current=pfrRequest();return Boolean(request&&current&&request.key===current.key&&pfrSaveAuthorityReady());}
18:   function pfrTrackRequest(request){const key=request?.key||"";if(key===observedContextKey)return false;observedContextKey=key;authorityGeneration+=1;return true;}
19:   function pfrAuthorityMatches(request,generation){return generation===authorityGeneration&&pfrContextMatches(request);}
20:   function pfrClearView({bump=false}={}){if(bump)authorityGeneration+=1;view=null;viewContextKey="";viewGeneration=-1;pfrRender();return null;}
21:   function pfrLocalAuthorityMatches(request,localState){const role=String(localState?.binding?.managerRole||"");const activeProfileId=role==="playerOne"?request?.playerOneProfileId:role==="playerTwo"?request?.playerTwoProfileId:"";return Boolean(request&&localState&&SAFE_LOCAL_PHASES.has(localState.phase)&&localState.canonicalStorageMutation===false&&localState.providerWriteRequired===false&&localState.automaticLocalApply===false&&localState.candidateCOnly===true&&String(localState.binding?.saveId||"")===request.saveId&&activeProfileId&&String(localState.binding?.profileId||"")===activeProfileId);}
22:   function pfrSnapshotsMatch(request,multiState,historyState,localState){return Boolean(request&&multiState&&historyState&&String(multiState.rivalryId||"")===request.rivalryId&&String(historyState.rivalryId||"")===request.rivalryId&&pfrLocalAuthorityMatches(request,localState));}
23:   function pfrField(id){return root.document&&root.document.getElementById(id);}
24:   function pfrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
25:   function pfrText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
26:   function pfrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
27:   function pfrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
28:   async function pfrEnsureDependencies(){
29:     await pfrLoad("ssjr-final-reconciliation-protocol","js/sharedFinalReconciliation.js",()=>root.CareerModeSharedFinalReconciliation);
30:     await pfrLoad("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
31:     await pfrLoad("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence);
32:     await pfrLoad("ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js",()=>root.CareerModeProductionSharedLocalReconciliation);
33:     protocol=root.CareerModeSharedFinalReconciliation;multiApi=root.CareerModeProductionSharedMultiSeasonProgression;historyApi=root.CareerModeProductionSharedHistoryConvergence;localApi=root.CareerModeProductionSharedLocalReconciliation;
34:     if(!protocol||typeof protocol.reconcile!=="function"||!multiApi||typeof multiApi.refresh!=="function"||typeof multiApi.getState!=="function"||!historyApi||typeof historyApi.refresh!=="function"||typeof historyApi.getState!=="function"||!localApi||typeof localApi.refresh!=="function"||typeof localApi.getState!=="function")throw Object.assign(new Error("Final Reconciliation dependencies are unavailable."),{code:"FINAL_RECONCILIATION_DEPENDENCY_UNAVAILABLE"});
35:   }
36:   function pfrManagerName(role){return String(pfrShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
37:   function pfrEnsureUi(){
38:     if(!root.document)return null;const review=pfrField("seasonReviewPanel");if(!review)return null;
39:     let panel=pfrField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedFinalReconciliationPanel hidden";review.appendChild(panel);}
40:     let heading=pfrField("sharedFinalReconciliationHeading");if(!heading){heading=root.document.createElement("h3");heading.id="sharedFinalReconciliationHeading";panel.appendChild(heading);}
41:     let summary=pfrField("sharedFinalReconciliationSummary");if(!summary){summary=root.document.createElement("p");summary.id="sharedFinalReconciliationSummary";panel.appendChild(summary);}
42:     let winner=pfrField("sharedFinalReconciliationWinner");if(!winner){winner=root.document.createElement("p");winner.id="sharedFinalReconciliationWinner";panel.appendChild(winner);}
43:     let close=pfrField("sharedFinalReconciliationClose");if(!close){close=root.document.createElement("p");close.id="sharedFinalReconciliationClose";panel.appendChild(close);}
44:     return {panel,heading,summary,winner,close};
45:   }
46:   function pfrCurrentView(){const request=pfrRequest();pfrTrackRequest(request);let localState=null;try{localState=localApi?.getState?.()||null;}catch(_error){}return pfrSaveAuthorityReady()&&request&&view&&viewContextKey===request.key&&viewGeneration===authorityGeneration&&pfrLocalAuthorityMatches(request,localState)&&!pfrTerminalClosed()?view:null;}
47:   // r76: the partner's Terminal Close now reaches this manager through the waiting listener within a second. Its session
48:   // close also ends Shared Setup readiness, so pfrRequest is null from then on and this module can never reconcile again;
49:   // CLOSED then lands without a reconciled view. The verified close witness Terminal Close holds for this exact save (its
50:   // request falls back to the durable rivalry binding) carries the same locked totals and winner: the (still hidden) final
51:   // result lines are filled from it. No read, no poll.
52:   function pfrClosedText(ui){
53:     let closed=null;try{closed=root.CareerModeProductionSharedTerminalClose?.getState?.()||null;}catch(_error){closed=null;}
54:     const witness=closed?.phase==="CLOSED"?closed.terminalWitness:null,totals=witness?.managerTotals;
55:     if(!pfrShared()||!witness||!closed.rivalryId||String(witness.rivalryId||"")!==String(closed.rivalryId)||!totals||!Number.isInteger(totals.playerOne)||!Number.isInteger(totals.playerTwo)||!["playerOne","playerTwo","draw"].includes(witness.winner))return false;
56:     pfrText(ui.heading,"SHOWDOWN FINAL RESULT");
57:     if(Number.isInteger(witness.totalSeasons))pfrText(ui.summary,pfrPlayedText(witness));
58:     pfrText(ui.winner,`${pfrManagerName("playerOne")} ${totals.playerOne} · ${pfrManagerName("playerTwo")} ${totals.playerTwo} · ${witness.winner==="draw"?"DRAW":`${pfrManagerName(witness.winner)} WINS`}`);
59:     return true;
60:   }
61:   // r89 Sacked: "2 OF 3 SEASONS PLAYED · SACKED" (the seasons played are completedSeason; equal to the length otherwise).
62:   function pfrPlayedText(value){const played=Number.isInteger(value.completedSeason)?value.completedSeason:value.totalSeasons;return `${played} OF ${value.totalSeasons} ${Number(value.totalSeasons)===1?"SEASON PLAYED":"SEASONS PLAYED"}${value.endedBy==="sacked"?" · SACKED":""}`;}
63:   function pfrRender(){
64:     const ui=pfrEnsureUi();if(!ui)return false;const current=pfrCurrentView(),active=Boolean(current&&current.phase==="FINAL_SEASON_RECONCILED"&&current.finalSeasonReconciled===true);
65:     pfrHidden(ui.panel,!active);if(!active){pfrClosedText(ui);return false;}
66:     pfrText(ui.heading,"SHOWDOWN FINAL RESULT");
67:     pfrText(ui.summary,pfrPlayedText(current));
68:     const winner=current.winner==="draw"?"DRAW":`${pfrManagerName(current.winner)} WINS`;
69:     pfrText(ui.winner,`${pfrManagerName("playerOne")} ${current.managerTotals.playerOne} · ${pfrManagerName("playerTwo")} ${current.managerTotals.playerTwo} · ${winner}`);
70:     pfrText(ui.close,"FINAL RESULTS ARE LOCKED · CLOSE THE SHOWDOWN WHEN READY");
71:     return true;
72:   }
73:   function pfrDiscard(request,generation){if(request&&viewContextKey===request.key&&viewGeneration===generation){view=null;viewContextKey="";viewGeneration=-1;}pfrRender();return null;}
74:   async function pfrRefreshNow(request=pfrRequest(),generation=authorityGeneration){
75:     if(!request||!pfrAuthorityMatches(request,generation))return pfrDiscard(request,generation);
76:     await pfrEnsureDependencies();if(!pfrAuthorityMatches(request,generation))return pfrDiscard(request,generation);
77:     const multiState=await multiApi.refresh();if(!pfrAuthorityMatches(request,generation))return pfrDiscard(request,generation);
78:     const historyState=await historyApi.refresh();if(!pfrAuthorityMatches(request,generation))return pfrDiscard(request,generation);
79:     const localState=localApi.refresh();if(!pfrAuthorityMatches(request,generation)||!pfrSnapshotsMatch(request,multiState,historyState,localState))return pfrDiscard(request,generation);
80:     const next=protocol.reconcile({sharedActive:true,multiSeason:multiState,history:historyState,localReconciliation:localState});
81:     if(!pfrAuthorityMatches(request,generation)||!pfrSnapshotsMatch(request,multiState,historyState,localState)||pfrTerminalClosed())return pfrDiscard(request,generation);
82:     view=next;viewContextKey=request.key;viewGeneration=generation;pfrRender();
83:     try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-final-reconciliation-state-change",{detail:view}));}catch(_error){}
84:     return view;
85:   }
86:   function pfrRefresh(){
87:     const request=pfrRequest();pfrTrackRequest(request);const generation=authorityGeneration;if(pfrTerminalClosed())return Promise.resolve(pfrClearView({bump:true}));if(!request)return Promise.resolve(pfrClearView());
88:     if(viewContextKey&&(viewContextKey!==request.key||viewGeneration!==generation))pfrClearView();
89:     if(refreshPromise&&refreshContextKey===request.key&&refreshGeneration===generation)return refreshPromise;
90:     busy=true;const current=pfrRefreshNow(request,generation).catch(error=>{if(pfrAuthorityMatches(request,generation)){pfrDiscard(request,generation);pfrReport("Could not confirm the final result",error);}return null;}).finally(()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";refreshGeneration=-1;busy=false;}if(wakePending&&!busy){wakePending=false;root.setTimeout?.(()=>pfrWake(),0);}});
91:     refreshPromise=current;refreshContextKey=request.key;refreshGeneration=generation;return current;
92:   }
93:   // r75: Terminal Close, Shared History and Local Reconciliation announce every refresh, even when nothing changed, and this
94:   // module's own refresh refreshes them. Reacting to an unchanged announcement re-ran the whole chain several times a second.
95:   // Only a changed Terminal Close phase, history witness or local state wakes the refresh. r84: this now holds while no view
96:   // exists too. Mid-Showdown the local state stays WAITING_REMOTE, so every refresh is discarded and its own unchanged
97:   // announcements used to wake the next one at once: ~145 reads/min per device between seasons (live 2026-10-25 quota hit). Every invalidation check (close,
98:   // lost local authority, Save Library) still runs first for every event, repeated or not. A wake that arrives while a refresh
99:   // runs is no longer dropped: one more refresh follows it. The 15 s poll and every other event stay as they were.
100:   function pfrRepeatedPeerEvent(event){
101:     const type=event?.type,detail=event?.detail||{};
102:     let key=null;
103:     if(type==="career-mode-shared-terminal-close-state-change")key=`${detail.rivalryId||""}|${detail.phase||""}|${detail.terminal===true}`;
104:     else if(type==="career-mode-shared-history-convergence-state-change")key=`${detail.phase||""}|${detail.throughSeason??""}|${detail.acceptedRevisionKey||""}`;
105:     else if(type==="career-mode-shared-local-reconciliation-state-change"&&event?.detail){try{key=JSON.stringify(event.detail);}catch(_error){key=null;}}
106:     if(key===null)return false;
107:     const context=pfrRequest()?.key||"";
108:     if(lastPeerEventKeys[type]===`${context}|${key}`)return true;
109:     lastPeerEventKeys[type]=`${context}|${key}`;return false;
110:   }
111:   function pfrWake(event){const repeated=pfrRepeatedPeerEvent(event);const request=pfrRequest(),contextChanged=pfrTrackRequest(request);if(contextChanged)pfrClearView();if((event?.type==="career-mode-shared-terminal-close-state-change"&&(event.detail?.phase==="CLOSED"||event.detail?.phase==="DELETED"))||pfrTerminalClosed())return pfrClearView({bump:true});if(event?.type==="career-mode-save-library-authority-invalidated")return pfrClearView({bump:true});if(event?.type==="career-mode-shared-local-reconciliation-state-change"){let localState=event.detail||null;if(!localState){try{localState=localApi?.getState?.()||null;}catch(_error){}}if(!pfrLocalAuthorityMatches(request,localState))return pfrClearView({bump:true});}if(root.document?.visibilityState==="hidden")return;if(!request||!pfrSaveAuthorityReady())return pfrClearView({bump:!pfrSaveAuthorityReady()});if(viewContextKey&&(viewContextKey!==request.key||viewGeneration!==authorityGeneration))pfrClearView();if(repeated&&(!view||(viewContextKey===request.key&&viewGeneration===authorityGeneration)))return;if(busy&&refreshPromise&&refreshContextKey===request.key&&refreshGeneration===authorityGeneration){wakePending=true;return;}void pfrRefresh();}
112:   function pfrInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-multi-season-state-change","career-mode-shared-history-convergence-state-change","career-mode-shared-local-reconciliation-state-change","career-mode-connected-account-state-change","career-mode-showdown-state-change","career-mode-active-save-changed","career-mode-save-library-authority-invalidated","career-mode-shared-terminal-close-state-change"]){root.addEventListener?.(event,pfrWake);}root.document?.addEventListener?.("visibilitychange",pfrWake);if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())pfrWake();},POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pfrWake,0);return true;}
113:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-final-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r17",pollIntervalMs:POLL_MS,install:pfrInstall,refresh:pfrRefresh,getState:pfrCurrentView,isActive:pfrShared,usesAccumulatedCanonicalPoints:true,createsAdditionalSeason:false,terminalCloseSeparate:true,saveLibraryAuthorityRequired:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false});
114: });
115: 
```

(End of packet FJ9. Answer with the report only.)
