# Fable 5.2 red-team job FJ7: Next season, Sacked and the end

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
Then one block per finding: ID (FJ7-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. After a commit, can the next season start twice, never start, or start on one phone only?
2. Sacked in season 1, a middle season and the last season, by either manager or both: does the Showdown end after that season on both phones with the right points?
3. Terminal Close: can it run twice, never run, or name a different winner (or draw) on the two phones? Equal points must be a draw.
4. Reload or kill the tab during Terminal Close: does each phone land on Final Winner with the right numbers?
5. Can a Showdown that ended early or never finished be counted as finished?

## Known (do not report)
Under very slow Firestore there is a wait of ~11 s on Remote Joining before Final Winner (known).

## Files

## FILE: js/productionSharedMultiSeasonProgression.js (259 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedMultiSeasonProgression=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   const ACTION_ID="sharedMultiSeasonContinueAction";
10:   const STATUS_ID="sharedMultiSeasonProgressionStatus";
11:   let installed=false,busy=false,provider=null,setupApi=null,historyApi=null,view=null,contextKey="",refreshPromise=null,exposedKey="",exposedSeason=0,dashboardObserver=null,wakePending=false,announcedKey="";
12:   let lastErrorCode="",lastErrorKey="",heldErrorKey="";
13: 
14:   function pmspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
15:   function pmspShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
16:   function pmspSharedMarker(){const showdown=pmspShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
17:   function pmspField(id){return root.document&&root.document.getElementById(id);}
18:   function pmspEmpty(empty){["dashboardPositionOne","dashboardPositionTwo"].forEach(id=>{const node=pmspField(id);node?.toggleAttribute?.("data-sd-empty",empty);});}
19:   function pmspText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
20:   function pmspHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
21:   function pmspDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
22:   function pmspReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
23:   function pmspLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
24:   async function pmspEnsureDependencies(){
25:     if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
26:     await pmspLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
27:     await pmspLoadScript("ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence);
28:     await pmspLoadScript("ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression);
29:     await pmspLoadScript("ssjr-multi-season-provider","js/sparkSharedMultiSeasonProgression.js",()=>root.CareerModeSparkSharedMultiSeasonProgression);
30:     await pmspLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
31:     setupApi=root.CareerModeProductionSharedShowdownSetup;historyApi=root.CareerModeProductionSharedHistoryConvergence;provider=root.CareerModeSparkSharedMultiSeasonProgression;
32:     if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pmspFail("MULTI_SEASON_SETUP_UNAVAILABLE");
33:     if(!historyApi||typeof historyApi.refresh!=="function"||typeof historyApi.getState!=="function")pmspFail("MULTI_SEASON_HISTORY_UNAVAILABLE");
34:     if(!provider||typeof provider.read!=="function")pmspFail("MULTI_SEASON_PROVIDER_UNAVAILABLE");
35:   }
36:   function pmspSetupState(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
37:   function pmspConfirmedSetupRivalry(s){return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}
38:   function pmspRivalryId(){const showdown=pmspShowdown(),setup=pmspSetupState();return String(showdown?.sharedJourney?.rivalryId||pmspConfirmedSetupRivalry(setup)||"").trim();}
39:   function pmspContextKey(rivalryId){const showdown=pmspShowdown(),saveId=String(showdown?.id||showdown?.saveId||"").trim();return `${saveId||"shared"}|${rivalryId}|multi-season`;}
40:   // r80: the season cursor and the provider view belong to one save shell AND one rivalry. Keyed by the rivalry alone, a new
41:   // Showdown's shell (its marker has no rivalry id yet) read the rivalry of the Setup still held in memory: on the phone that
42:   // tapped END SHOWDOWN that is the ended Showdown's confirmed Setup (nothing refreshes it), so the new Showdown got the ended
43:   // one's cursor and view and read "Season 2 / 3" before its first season. A new shell now always starts at season 1.
44:   function pmspEnsureCursor(){
45:     if(!pmspSharedMarker())return null;
46:     const rivalryId=pmspRivalryId();if(!rivalryId)return null;
47:     const key=pmspContextKey(rivalryId);
48:     if(exposedKey!==key){exposedKey=key;exposedSeason=1;view=null;contextKey="";}
49:     if(!Number.isInteger(exposedSeason)||exposedSeason<1)exposedSeason=1;
50:     return exposedSeason;
51:   }
52:   // F1 (fault suite, reload after the season acknowledgement): CONTINUE TO SEASON N+1 only moves this page's cursor, so a reload
53:   // after the acknowledgement but before CONTINUE resumed straight into season N+1 and skipped season N's Shared History, its
54:   // CONTINUE and the Gazette. The page notes here the season its CONTINUE moved into; the entry's resume holds a season that
55:   // this phone accepted but never continued from on its results. Storage only, no read.
56:   function pmspContinuedKey(rivalryId){return `cms.seasonContinued.v1:${rivalryId}`;}
57:   function pmspContinuedInto(rivalryId){try{const n=Number(typeof root.readStorageValue==="function"?root.readStorageValue(pmspContinuedKey(rivalryId)):null);return Number.isInteger(n)&&n>=1&&n<=10?n:0;}catch(_error){return 0;}}
58:   function pmspMarkContinued(rivalryId,season){try{if(season>pmspContinuedInto(rivalryId)&&typeof root.writeStorageValue==="function")root.writeStorageValue(pmspContinuedKey(rivalryId),String(season));}catch(_error){}}
59:   // r87 upgrade (R4): a Showdown carried over from 1.9.10 has no note, because 1.9.10 never wrote one. Its phones tapped CONTINUE
60:   // there, and with no note they would be sent back to the last season's results after the 2.0.0 update. So the hold applies
61:   // only where this phone has a note. 2.0.0 notes season 1 the moment it sees a Showdown with no season accepted yet,
62:   // so every Showdown played on 2.0.0 keeps F1's hold exactly. Storage only, no read.
63:   function pmspNoteLiveSeason(rivalryId,accepted){if(accepted===0)pmspMarkContinued(rivalryId,1);}
64:   function pmspHoldsForReview(rivalryId,accepted,total,terminal){const into=pmspContinuedInto(rivalryId);return terminal!==true&&Number.isInteger(accepted)&&accepted>=1&&accepted<total&&into>=1&&into<accepted+1;}
65:   function pmspFallbackSeason(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=10?n:null;}
66:   function pmspResolveSeason(fallback=null){
67:     const local=pmspFallbackSeason(fallback??pmspShowdown()?.currentRound);if(!pmspSharedMarker())return local;
68:     const rivalryId=pmspRivalryId();pmspEnsureCursor();const authoritative=Boolean(view&&view.ok===true&&view.authoritative===true&&view.state&&String(view.rivalryId||"")===rivalryId);
69:     return authoritative?(pmspEnsureCursor()||local):local;
70:   }
71:   // r87 (lane C C-08): true while a live Showdown's season is unknown on this page. A shared Showdown's local save stays at
72:   // currentRound 1 (its seasons live in the shared modules), so a browser that had not entered the game read "SEASON 1 / 3"
73:   // during season 3. While the pair is active and this page has no authoritative view of that rivalry, js/menuExperience.js
74:   // reads "3-Season Showdown" instead of a season. A code still waiting to be joined (pending-pair) is season 1 for certain,
75:   // and so is a game screen: a page only reaches one by playing this Showdown from its START or by resuming from authority.
76:   const PMSP_GAME_SCREENS=new Set(["createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary"]);
77:   function pmspSeasonUnknown(){if(!pmspSharedMarker())return false;const pair=root.CareerModePersistentNikDanielPair?.getState?.();if(!pair||pair.connectionState!=="active")return false;
78:     const screen=typeof root.getActiveScreenName==="function"?root.getActiveScreenName():null;if(PMSP_GAME_SCREENS.has(screen))return false;const rivalryId=pmspRivalryId();return !(rivalryId&&view&&view.ok===true&&view.authoritative===true&&view.state&&String(view.rivalryId||"")===rivalryId);}
79:   function pmspRequest(){
80:     const rivalryId=pmspRivalryId();
81:     if(!pmspSharedMarker()||!rivalryId)return null;pmspEnsureCursor();return Object.freeze({rivalryId,key:pmspContextKey(rivalryId)});
82:   }
83:   function pmspContextMatches(request){const current=pmspRequest();return Boolean(request&&current&&request.key===current.key);}
84:   async function pmspProviderOptions(request){
85:     if(!request||!pmspContextMatches(request))pmspFail("MULTI_SEASON_CONTEXT_STALE");
86:     const setup=pmspSetupState();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId||!setup.accountId||!setup.managerRole)pmspFail("MULTI_SEASON_SETUP_NOT_CONFIRMED");
87:     if(String(setup.rivalryId)!==request.rivalryId)pmspFail("MULTI_SEASON_RIVALRY_MISMATCH");
88:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
89:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pmspFail("MULTI_SEASON_PROVIDER_UNAVAILABLE","The online service is unavailable.");
90:     if(services.auth.currentUser.uid!==setup.accountId)pmspFail("MULTI_SEASON_AUTHORITY_MISMATCH");
91:     return Object.freeze({user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,nowEpochMs:Date.now()});
92:   }
93:   function pmspResult(result){if(result&&result.ok===true&&result.authoritative===true&&result.state)return result;const error=new Error("Shared Multi Season progression could not be verified.");error.code=result?.code||"MULTI_SEASON_PROVIDER_FAILED";throw error;}
94:   function pmspManagerName(role){const value=pmspShowdown()?.managers?.[role];return String(value||(role==="playerOne"?"Manager 1":"Manager 2"));}
95:   function pmspLeagueName(id){try{const league=typeof root.getLeagueById==="function"?root.getLeagueById(id):null;if(league?.name)return league.name;}catch(_error){}return String(id||"League").replaceAll("_"," ").replaceAll("-"," ").replace(/\b\w/g,char=>char.toUpperCase());}
96:   function pmspDashboardProjection(){
97:     const state=view?.state,dashboard=view?.dashboard;if(!state||!dashboard||!Number.isInteger(dashboard.acceptedSeasons)||dashboard.acceptedSeasons!==state.acceptedSeasons||!dashboard.managerTotals)return null;
98:     const p1=Number(dashboard.managerTotals.playerOne),p2=Number(dashboard.managerTotals.playerTwo);if(!Number.isInteger(p1)||p1<0||!Number.isInteger(p2)||p2<0)return null;
99:     if(dashboard.acceptedSeasons===0&&dashboard.lastSeason!==null)return null;
100:     if(dashboard.acceptedSeasons>0&&Number(dashboard.lastSeason?.seasonNumber)!==dashboard.acceptedSeasons)return null;
101:     return dashboard;
102:   }
103:   // r89 Sacked: the final season is the sacked one when a manager was sacked (state.sackedSeason), else the planned length.
104:   function pmspFinalSeason(state){return Number.isInteger(state?.sackedSeason)?state.sackedSeason:Number(state?.totalSeasons);}
105:   function pmspSackedNames(){const last=view?.projection?.seasonHistory?.[view.projection.seasonHistory.length-1];return ["playerOne","playerTwo"].filter(role=>last?.[role]?.sacked===true).map(role=>pmspManagerName(role).toUpperCase());}
106:   function pmspDecorateDashboard(){
107:     if(!pmspSharedMarker()||!pmspEnsureCursor()||!view?.authoritative||!view?.state)return false;
108:     const setup=pmspSetupState()?.setup,dashboard=pmspDashboardProjection(),state=view.state,screen=pmspField("dashboard");if(!setup||setup.phase!=="SHOWDOWN_CONFIRMED"||!dashboard||!screen)return false;
109:     const total=Number(state.totalSeasons),accepted=Number(state.acceptedSeasons),cursor=pmspEnsureCursor(),n1=pmspManagerName("playerOne"),n2=pmspManagerName("playerTwo"),p1=dashboard.managerTotals.playerOne,p2=dashboard.managerTotals.playerTwo;
110:     screen.dataset.sharedDashboardAuthority="true";
111:     pmspText(pmspField("dashboardShowdownName"),pmspShowdown()?.name||"Showdown");
112:     pmspText(pmspField("dashboardLeague"),pmspLeagueName(setup.leagueId));
113:     const sackedEnd=state.terminal&&Number.isInteger(state.sackedSeason)&&state.sackedSeason<total;
114:     pmspText(pmspField("dashboardRound"),state.terminal?(sackedEnd?`Ended after season ${state.sackedSeason} of ${total}`:Number(total)===1?"Season complete":`All ${total} seasons complete`):`Season ${cursor} of ${total}`);
115:     pmspText(pmspField("seasonIndicator"),state.terminal?"Showdown Complete":`Season ${cursor} / ${total}`);
116:     pmspText(pmspField("dashboardStatus"),state.terminal?"SHOWDOWN COMPLETE":`${accepted} OF ${total} SEASONS PLAYED`);
117:     pmspText(pmspField("dashboardManagerOne"),n1);pmspText(pmspField("dashboardManagerTwo"),n2);
118:     pmspText(pmspField("dashboardClubOne"),setup.clubs?.playerOne||"Club");pmspText(pmspField("dashboardClubTwo"),setup.clubs?.playerTwo||"Club");
119:     try{if(typeof root.applyClubIdentity==="function"){root.applyClubIdentity(pmspField("dashboardClubOne"),setup.clubs?.playerOne);root.applyClubIdentity(pmspField("dashboardClubTwo"),setup.clubs?.playerTwo);}}catch(_error){}
120:     pmspText(pmspField("dashboardScoreOne"),p1);pmspText(pmspField("dashboardScoreTwo"),p2);
121:     const series=pmspField("dashboardSeriesStatus");if(series){series.classList.remove("series-lead-one","series-lead-two");const lead=p1===p2?"LEVEL":p1>p2?`${n1.toUpperCase()} +${p1-p2}`:`${n2.toUpperCase()} +${p2-p1}`;pmspText(series,lead);if(p1>p2)series.classList.add("series-lead-one");else if(p2>p1)series.classList.add("series-lead-two");}
122:     const summary=pmspField("dashboardLastSeasonSummary"),last=dashboard.lastSeason;
123:     if(last&&accepted>0){
124:       const winner=last.winner==="draw"?"DRAW":`${pmspManagerName(last.winner).toUpperCase()} WON`;
125:       pmspText(pmspField("dashboardLastSeasonLabel"),accepted===1?"LAST SEASON":`AFTER ${accepted} SEASONS`);
126:       pmspText(pmspField("dashboardLastSeasonResult"),`Season ${last.seasonNumber} · ${n1} ${last.playerOne.score} - ${n2} ${last.playerTwo.score} · ${winner}`);
127:       pmspText(pmspField("dashboardPositionOne"),`Last league finish: ${last.playerOne.leaguePosition}`);
128:       pmspText(pmspField("dashboardPositionTwo"),`Last league finish: ${last.playerTwo.leaguePosition}`);pmspEmpty(false);
129:       pmspHidden(summary,false);
130:     }else{
131:       pmspText(pmspField("dashboardPositionOne"),"No season completed");pmspText(pmspField("dashboardPositionTwo"),"No season completed");pmspEmpty(true);pmspText(pmspField("dashboardLastSeasonResult"),"—");pmspHidden(summary,true);
132:     }
133:     return true;
134:   }
135:   function pmspObserveDashboard(){
136:     if(dashboardObserver||!root.MutationObserver)return;const dashboard=pmspField("dashboard");if(!dashboard)return;
137:     dashboardObserver=new root.MutationObserver(()=>{if(!dashboard.classList.contains("hidden"))pmspDecorateDashboard();});dashboardObserver.observe(dashboard,{attributes:true,attributeFilter:["class"]});
138:     // r87 C-08: Home leaves the header on "3-Season Showdown" when this page has not read the season. Entering a game screen
139:     // (nothing else rewrites the header there before the dashboard) names the season again: this page is playing it.
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
236:       exposedSeason=target;
237:       try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-season-cursor-change",{detail:{rivalryId:request.rivalryId,previousSeason:previous,activeSeason:exposedSeason,acceptedSeasons:accepted,resumed:true}}));}catch(_error){}
238:     }
239:     pmspRender();pmspDecorateDashboard();
240:     return Object.freeze({rivalryId:request.rivalryId,season:exposedSeason,acceptedSeasons:accepted,totalSeasons:total,terminal:state.terminal===true,heldForReview:held&&exposedSeason===accepted});
241:   }
242:   // F1: the held season's results could not be opened: move on to the active season exactly as an unheld resume does.
243:   function pmspReleaseHeldSeason(){
244:     const held=heldSeason;heldSeason=null;const request=pmspRequest(),state=view?.state;
245:     if(!held||!request||request.key!==held.key||!state||state.terminal===true)return false;
246:     const previous=pmspEnsureCursor(),target=held.season+1;if(previous!==held.season||target>Number(state.totalSeasons)||Number(state.acceptedSeasons)<held.season)return false;
247:     exposedSeason=target;
248:     try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-season-cursor-change",{detail:{rivalryId:request.rivalryId,previousSeason:previous,activeSeason:exposedSeason,acceptedSeasons:state.acceptedSeasons,resumed:true}}));}catch(_error){}
249:     pmspRender();pmspDecorateDashboard();return true;
250:   }
251:   function pmspCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!pmspSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;void pmspAdvance();}
252:   // r75: a wake that arrives while a refresh is running (Shared History converging, setup changing) runs once more right
253:   // after it instead of being dropped until the 15 s poll; the final season reached Final Winner up to 10 s late without it.
254:   function pmspWake(){if(busy){wakePending=true;return;}if(!pmspSharedMarker()||root.document?.visibilityState==="hidden")return;void pmspRefresh();}
255:   function pmspInstall(){if(installed)return true;installed=true;if(root.document)root.document.addEventListener("click",pmspCapture,true);pmspObserveDashboard();for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-history-convergence-state-change","career-mode-shared-setup-state-change","career-mode-connected-account-state-change","career-mode-app-check-state-change"]){root.addEventListener?.(event,pmspWake);}root.document?.addEventListener?.("visibilitychange",pmspWake);if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())pmspWake();},POLL_MS);if(typeof root.setTimeout==="function")root.setTimeout(pmspWake,0);return true;}
256: 
257:   return Object.freeze({upgradeHold:Object.freeze({note:pmspNoteLiveSeason,holds:pmspHoldsForReview,continuedInto:pmspContinuedInto,markContinued:pmspMarkContinued}),lastError:()=>lastErrorCode,contractVersion:1,feature:"ssjr-production-shared-multi-season-progression",productionEnabled:true,runtimeRevision:"1.9.1-r13",supportedLengths:Object.freeze([1,3,5,10]),requiresHistoryConvergence:true,requiresVisibleHistoryWitnessBeforeAdvance:true,exactOnceLocalCursor:true,replaysAcceptedSeasonsFromOneOnFreshRuntime:true,resumesAuthoritativeSeasonAfterFreshSession:true,fixedClubs:true,continueOpensNextTransferChallenge:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,install:pmspInstall,refresh:pmspRefresh,getState:()=>view,resolveSeason:pmspResolveSeason,seasonUnknown:pmspSeasonUnknown,nameSeason:pmspNameSeason,decorateDashboard:pmspDecorateDashboard,canContinue:pmspCanContinue,continueToNextSeason:pmspAdvance,resumeFromAuthority:pmspResumeFromAuthority,releaseHeldSeason:pmspReleaseHeldSeason,isActive:pmspSharedMarker});
258: });
259: 
```

## FILE: js/productionSharedTerminalClose.js (422 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedTerminalClose=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   const PANEL_ID="sharedTerminalClosePanel";
10:   const AMBIGUOUS_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","network-request-failed"]);
11:   let installed=false,busy=false,state=null,stateContextKey="",refreshPromise=null,closePromise=null,unsubscribeRemote=null,wakePending=false;
12:   let heldRefreshFailure="";
13:   let rivalryWakeRequested=false;
14:   // JOB-1038: one automatic attempt per exact Showdown, account and device in this runtime.
15:   // Reloads first read the durable terminal witness; provider idempotency remains the authority.
16:   const automaticAttempts=new Map();
17:   function ptcClearDrafts(id){if(!id||typeof root.removeStorageValue!=="function")return false;for(let season=1;season<=10;season++)for(const role of ["playerOne","playerTwo"])for(const kind of ["seasonResult","transferGuess"])root.removeStorageValue(`cms.draft.v1:${id}:${season}:${role}:${kind}`);return true;}
18:   function ptcAutomaticKey(context){return `${context.request.key}|${context.accountId}|${context.deviceId}`;}
19:   function ptcScheduleAutomaticClose(context){
20:     if(!installed||typeof root.setTimeout!=="function")return;
21:     const key=ptcAutomaticKey(context);if(automaticAttempts.has(key))return;
22:     const request=context.request,generation=stateGeneration;let polls=0;
23:     const attempt=()=>{
24:       if(!ptcStillCurrent(request,generation)||busy||closePromise||ptcCurrentState()?.phase!=="READY"||automaticAttempts.has(key)||!ptcRemoteActive(context,ptcCurrentState().intent.sessionId))return;
25:       // Close forgets the session, which clears Shared History, so the close waits (bounded) for the converged history the
26:       // Final Winner shows as the final season and trophies. Without the history module it closes at once.
27:       if(!ptcHistoryConverged(request.rivalryId)&&polls<HISTORY_WAIT_POLLS){polls++;root.setTimeout(attempt,HISTORY_POLL_MS);return;}
28:       automaticAttempts.set(key,{failed:false});
29:       ptcPublish(request,{...ptcCurrentState(),automaticSaving:true,automaticCloseFailed:false});
30:       // r87 arch S-05: a throw before the close's own try (intent check) is a failed save too, never "Saving..." forever.
31:       void ptcClose(key).catch(error=>{ptcReport("Closing the Showdown failed.",error);return null;}).then(result=>{
32:         if(result?.ok===true)return;
33:         automaticAttempts.set(key,{failed:true});
34:         if(ptcStillCurrent(request,generation)&&ptcCurrentState()?.phase!=="CLOSED")ptcPublish(request,{...ptcCurrentState(),automaticSaving:false,automaticCloseFailed:true});
35:       });
36:     };
37:     root.setTimeout(attempt,0);
38:   }
39:   const HISTORY_POLL_MS=250,HISTORY_WAIT_POLLS=60;
40:   function ptcHistoryConverged(rivalryId){
41:     try{const api=root.CareerModeProductionSharedHistoryConvergence;if(typeof api?.getState!=="function")return true;const h=api.getState();return h?.authoritative===true&&h.phase==="HISTORY_CONVERGED"&&h.rivalryId===rivalryId;}catch(_){return true;}
42:   }
43:   // H1017-2: bumped whenever the held state is dropped, so an awaited retry can tell its context was cleared under it.
44:   let stateGeneration=0;
45:   // BH-7: throttled, single-flight re-ask of Connected Rivalry (see ptcRetryUnavailableRivalry).
46:   const RIVALRY_RETRY_MS=30000;
47:   let rivalryRetryAt=0,rivalryRetryInFlight=false;
48:   const POLL_FRESH_MS=45000;let pollFreshAt=Date.now();
49:   let protocol=null,provider=null,finalApi=null,runtimeApi=null,accountApi=null,pairingApi=null,rivalryApi=null,remoteApi=null;
50: 
51:   function ptcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
52:   function ptcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ptcFreeze);Object.freeze(value);}return value;}
53:   function ptcClone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
54:   function ptcCode(value){return String(value&&value.code||"").split("/").pop().trim().toLowerCase();}
55:   function ptcAmbiguous(value){return AMBIGUOUS_CODES.has(ptcCode(value));}
56:   function ptcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
57:   function ptcConfirmedSetupRivalry(){try{const s=root.CareerModeProductionSharedShowdownSetup?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
58:   function ptcRivalryApi(){return rivalryApi||root.CareerModeSparkConnectedRivalry||null;}
59:   function ptcAttachedRivalry(saveId,playerOneProfileId,playerTwoProfileId){try{const s=ptcRivalryApi()?.getState?.(),b=s&&s.binding;return s&&s.attached===true&&b&&b.saveId===saveId&&((b.managerRole==="playerOne"&&b.profileId===playerOneProfileId)||(b.managerRole==="playerTwo"&&b.profileId===playerTwoProfileId))&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
60:   function ptcRequest(){
61:     const showdown=ptcShowdown();
62:     if(!showdown||showdown.sharedJourney?.mode!=="shared")return null;
63:     const saveId=String(showdown.identity?.saveId||"").trim();
64:     const playerOneProfileId=String(showdown.identity?.managerProfileIds?.playerOne||"").trim();
65:     const playerTwoProfileId=String(showdown.identity?.managerProfileIds?.playerTwo||"").trim();
66:     // Shared Setup stops being ready once the session closes, so fall back to the durable Connected Rivalry binding of this exact save and manager (it survives reloads).
67:     const rivalryId=String(showdown.sharedJourney?.rivalryId||ptcConfirmedSetupRivalry()||ptcAttachedRivalry(saveId,playerOneProfileId,playerTwoProfileId)||"").trim().toLowerCase();
68:     if(!/^pair_[0-9a-f]{64}$/.test(rivalryId)||!/^save_[0-9a-f]{24}$/.test(saveId)||!/^profile_[0-9a-f]{24}$/.test(playerOneProfileId)||!/^profile_[0-9a-f]{24}$/.test(playerTwoProfileId))return null;
69:     // r80: fromSetup marks a rivalry borrowed from the Shared Setup held in page memory (the shell's marker names none).
70:     const fromSetup=!showdown.sharedJourney?.rivalryId&&Boolean(ptcConfirmedSetupRivalry());
71:     return Object.freeze({rivalryId,saveId,playerOneProfileId,playerTwoProfileId,fromSetup,key:`${saveId}|${rivalryId}|${playerOneProfileId}|${playerTwoProfileId}|terminal-close`});
72:   }
73:   function ptcCurrentState(){const request=ptcRequest();return request&&state&&stateContextKey===request.key?state:null;}
74:   function ptcReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
75:   function ptcLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)ptcFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
76:   async function ptcEnsureDependencies(){
77:     const resolved={};
78:     for(const [key,path,ready] of [
79:       ["ssjr-terminal-close-protocol","js/sharedTerminalClose.js",()=>root.CareerModeSharedTerminalClose],
80:       ["ssjr-terminal-close-provider","js/sparkTerminalClose.js",()=>root.CareerModeSparkTerminalClose],
81:       ["ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js",()=>root.CareerModeProductionSharedFinalReconciliation],
82:       ["firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
83:       ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
84:       ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
85:       ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
86:       ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining]
87:     ])resolved[key]=await ptcLoad(key,path,ready);
88:     protocol=resolved["ssjr-terminal-close-protocol"];provider=resolved["ssjr-terminal-close-provider"];finalApi=resolved["ssjr-production-final-reconciliation"];runtimeApi=resolved["firebase-runtime"];accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;remoteApi=resolved.rj;
89:     if(typeof protocol?.prepare!=="function"||typeof protocol?.closeResult!=="function"||typeof provider?.close!=="function"||typeof provider?.read!=="function"||typeof finalApi?.refresh!=="function"||typeof finalApi?.getState!=="function"||typeof runtimeApi?.ensureAccountServices!=="function")ptcFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");
90:     return true;
91:   }
92:   async function ptcResolveContext(request=ptcRequest()){
93:     if(!request)ptcFail("TERMINAL_CLOSE_SHARED_CONTEXT_REQUIRED","No Showdown is open.");
94:     if(typeof accountApi?.initialize==="function")await accountApi.initialize();
95:     if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
96:     if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
97:     const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
98:     const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),attachedRivalry=String(rivalry?.rivalryId||"").trim().toLowerCase();
99:     if(account?.connected!==true||!accountId)ptcFail("TERMINAL_CLOSE_AUTH_REQUIRED","Sign in with the same account before closing this Showdown.");
100:     if(device?.registered!==true||!/^device_[0-9a-f]{32}$/.test(deviceId))ptcFail("TERMINAL_CLOSE_DEVICE_REQUIRED","This device must stay registered to this Showdown.");
101:     if(rivalry?.attached!==true||attachedRivalry!==request.rivalryId)ptcFail("TERMINAL_CLOSE_RIVALRY_REQUIRED","Reconnect this Showdown before closing it.");
102:     if(rivalry.accountId&&rivalry.accountId!==accountId)ptcFail("TERMINAL_CLOSE_RIVALRY_ACCOUNT_MISMATCH");
103:     if(rivalry.deviceId&&rivalry.deviceId!==deviceId)ptcFail("TERMINAL_CLOSE_RIVALRY_DEVICE_MISMATCH");
104:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtimeApi.ensureAccountServices());
105:     if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)ptcFail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE","The online service is unavailable. Nothing was closed or changed.");
106:     const user=services.auth.currentUser;if(!user||user.uid!==accountId)ptcFail("TERMINAL_CLOSE_AUTH_MISMATCH","The signed-in account no longer matches the one connected to this Showdown.");
107:     return Object.freeze({request,accountId,deviceId,user,services});
108:   }
109:   function ptcRemoteActive(context,exactSessionId=null){
110:     const remote=remoteApi?.getState?.();
111:     const expiry=Number(remote?.expiresAtEpochMs);
112:     return Boolean(remote&&remote.sessionState==="active"&&/^session_[0-9a-f]{64}$/.test(String(remote.sessionId||""))&&remote.rivalryId===context.request.rivalryId&&remote.accountId===context.accountId&&remote.deviceId===context.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&(!exactSessionId||remote.sessionId===exactSessionId))?remote:null;
113:   }
114:   function ptcField(id){return root.document&&root.document.getElementById(id);}
115:   function ptcText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
116:   function ptcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
117:   function ptcManagerName(role){return String(ptcShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
118:   function ptcEnsureUi(){
119:     if(!root.document)return null;const review=ptcField("seasonReviewPanel");if(!review)return null;
120:     let panel=ptcField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedTerminalClosePanel hidden";panel.dataset.sharedTerminalClose="true";review.appendChild(panel);}
121:     const ensure=(id,tag,className="")=>{let node=ptcField(id);if(!node){node=root.document.createElement(tag);node.id=id;if(className)node.className=className;panel.appendChild(node);}return node;};
122:     const heading=ensure("sharedTerminalCloseHeading","h3");
123:     const summary=ensure("sharedTerminalCloseSummary","p");
124:     const status=ensure("sharedTerminalCloseStatus","p","stateNote");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
125:     const actions=ensure("sharedTerminalCloseActions","div","seasonReviewActions");
126:     let close=ptcField("sharedTerminalCloseAction");if(!close){close=root.document.createElement("button");close.id="sharedTerminalCloseAction";close.className="menuButton";close.type="button";close.addEventListener("click",()=>{void (ptcCurrentState()?.phase==="RECOVERY_PENDING"?ptcRetry():ptcClose());});actions.appendChild(close);}
127:     let retry=ptcField("sharedTerminalCloseRetry");if(!retry){retry=root.document.createElement("button");retry.id="sharedTerminalCloseRetry";retry.className="compactButton hidden";retry.type="button";retry.addEventListener("click",()=>{void ptcRetry();});actions.appendChild(retry);}
128:     return {panel,heading,summary,status,actions,close,retry};
129:   }
130:   function ptcWinnerText(witness){if(!witness)return "";const winner=witness.winner==="draw"?"DRAW":`${ptcManagerName(witness.winner)} WINS`;return `${ptcManagerName("playerOne")} ${witness.managerTotals.playerOne} · ${ptcManagerName("playerTwo")} ${witness.managerTotals.playerTwo} · ${winner}`;}
131:   function ptcRender(){
132:     const ui=ptcEnsureUi();if(!ui)return false;const current=ptcCurrentState();
133:     const visible=Boolean(current&&["READY","RECOVERY_PENDING","CLOSED","BLOCKED"].includes(current.phase));ptcHidden(ui.panel,!visible);if(!visible)return false;
134:     const witness=current.terminalWitness||current.intent||current.finalReconciliation||null;
135:     if(current.phase==="CLOSED"){
136:       ptcText(ui.heading,"SHOWDOWN CLOSED");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,"CLOSED · FINAL RESULTS ARE LOCKED");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);ui.panel.dataset.terminal="true";return true;
137:     }
138:     ui.panel.dataset.terminal="false";
139:     if(current.phase==="RECOVERY_PENDING"){
140:       ptcText(ui.heading,"SHOWDOWN NOT CLOSED YET");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.automaticSaving?"Saving this Showdown to your career…":current.message||"It may have closed already. TRY CLOSING AGAIN will check.");ptcHidden(ui.close,!current.automaticCloseFailed);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHOWDOWN");ptcHidden(ui.retry,false);ui.retry.disabled=busy;ptcText(ui.retry,"TRY CLOSING AGAIN");return true;
141:     }
142:     if(current.phase==="BLOCKED"){
143:       ptcText(ui.heading,"BOTH PLAYERS MUST RECONNECT TO CLOSE");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.message||"Final results are safe. Reconnect both players to this Showdown, then refresh.");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);return true;
144:     }
145:     ptcText(ui.heading,"FINAL RESULT READY TO CLOSE");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.automaticCloseFailed?"This Showdown could not be saved. Tap CLOSE SHOWDOWN to try again.":"Saving this Showdown to your career…");ptcHidden(ui.close,!current.automaticCloseFailed);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHOWDOWN");ptcHidden(ui.retry,true);return true;
146:   }
147:   function ptcPublish(request,next){
148:     if(!request||!next){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
149:     const current=ptcRequest();if(!current||current.key!==request.key)return null;
150:     const previousPhase=stateContextKey===request.key?state?.phase:null;
151:     state=ptcFreeze(next);stateContextKey=request.key;ptcRender();
152:     // QoL 3+6: the Showdown has ended, so no unsent season result or guess draft for this rivalry stays on this device.
153:     // Swept here through the generic js/storage.js remove helper (a Showdown has at most 10 seasons) so the startup budget stays put.
154:     if(state.phase==="CLOSED")ptcClearDrafts(state.rivalryId||request.rivalryId);
155:     if(state.phase==="DELETED")ptcClearDrafts(state.rivalryId||request.rivalryId);
156:     if(state.phase==="CLOSED"||state.phase==="DELETED")ptcNoteEnded(state.rivalryId||request.rivalryId);
157:     try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:state.phase,rivalryId:state.rivalryId||request.rivalryId,terminal:state.phase==="CLOSED"}}));}catch(_error){}
158:     if(state.phase==="DELETED"&&previousPhase!=="DELETED")ptcLeaveEndedShowdown(state.rivalryId||request.rivalryId);
159:     return state;
160:   }
161:   // r80 END SHOWDOWN: the Showdown was ended (this page's own terminal read saw it closed with no finish witness). This phone
162:   // leaves it for Home once and says so; History keeps it as Ended early. Phase names stay (DELETED).
163:   // 2.4.0: the Squad Management stage (#sqStage) sits over the game screens, so it is taken down first, also when Home already
164:   // shows under it; its open screen ends with no write (js/squadSheetStep.js end()).
165:   function ptcLeaveEndedShowdown(rivalryId){
166:     // #1449 the Squad stage; E1 (2.4.0, Fable re-check 2) the Chamber Men stage, the roulette's panel and stage and the Prime
167:     // Pack takeover: each run on screen for this Showdown ends at once (no write after it) and its stage goes, so the notice
168:     // below and Home are never covered.
169:     for(const step of ["CareerModeSquadSheetStep","CareerModeChamberMenStep","CareerModeRosterRouletteStep","CareerModeIconGuessStep"])try{root[step]?.end?.(rivalryId);}catch(_error){}
170:     try{
171:       const home=root.document?.getElementById("mainMenu");
172:       if(home&&!home.classList.contains("hidden"))return;
173:       root.stopTransferTimerLoop?.();root.resetTransientSelectionOperations?.();root.resetNavigationState?.();
174:       if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);else void root.navigateTo?.("mainMenu",{addToHistory:false});
175:       root.refreshMainMenuExperience?.();
176:       root.showAppNotice?.("This Showdown was ended for both players. Legacy keeps it as Ended early.","info",8000);
177:     }catch(_error){}
178:   }
179:   function ptcClear(){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
180:   function ptcStillCurrent(request,generation){return ptcRequest()?.key===request.key&&stateGeneration===generation;}
181:   // A verified stored closure can finish the same gameplay through a replacement session. This comparison is read-only;
182:   // unresolved writes still resend the original intent, and the protocol/provider keep exact session-bound idempotency.
183:   function ptcSameFinalResult(terminalRead,intent){
184:     if(protocol.sameWitness(terminalRead.terminalWitness,intent))return true;
185:     try{const witness=protocol.verifyIntent(terminalRead.terminalWitness),held=protocol.verifyIntent(intent);return protocol.sameWitness({...witness,sessionId:held.sessionId},held);}catch(_error){return false;}
186:   }
187:   function ptcClosedState(request,terminalRead){const witness=protocol.verifyIntent(terminalRead.terminalWitness);return {phase:"CLOSED",rivalryId:request.rivalryId,sessionId:witness.sessionId,rivalryRevision:terminalRead.rivalryRevision,terminal:true,terminalWitness:ptcClone(witness),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
188:   function ptcBootstrap(){return ptcEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>ptcWake());});}
189:   function ptcOnOtherRivalry(request){try{const s=ptcRivalryApi()?.getState?.(),id=String(s?.rivalryId||"").trim().toLowerCase();return s?.attached===true&&/^pair_[0-9a-f]{64}$/.test(id)&&id!==request.rivalryId;}catch(_error){return false;}}
190:   // r80: right after END SHOWDOWN on this phone, START (or Nik's JOIN) opens a new save shell before its rivalry is attached.
191:   // The shell's marker names no rivalry, so the request borrows the ended Showdown's Shared Setup still held in page memory,
192:   // and Connected Rivalry, now read for the new shell, has no rivalry attached at all. That ended rivalry is not this shell's
193:   // Showdown, so there is nothing to close here and nothing to report. Quiet only when all of these hold: the rivalry was
194:   // borrowed from that Setup, this page saw that exact rivalry end (it held it CLOSED or DELETED, or the pair let it go as
195:   // closed: END on this phone or on the other one), and Connected Rivalry answered for this exact save with nothing attached.
196:   // A live Showdown whose pointer is missing on this device (a new browser continuing) has not ended, so it still reports.
197:   const endedRivalryIds=new Set();let unsubscribePair=null;
198:   function ptcNoteEnded(rivalryId){const id=String(rivalryId||"").trim().toLowerCase();if(/^pair_[0-9a-f]{64}$/.test(id))endedRivalryIds.add(id);}
199:   function ptcWatchPair(){try{const pair=root.CareerModePersistentNikDanielPair;if(!pair)return;if(!unsubscribePair&&typeof pair.subscribe==="function")unsubscribePair=pair.subscribe(next=>ptcNoteEnded(next?.closedRivalryId));ptcNoteEnded(pair.getState?.()?.closedRivalryId);}catch(_error){}}
200:   function ptcShellHasNoRivalry(request){try{ptcWatchPair();const s=ptcRivalryApi()?.getState?.(),b=s?.binding;return request.fromSetup===true&&endedRivalryIds.has(request.rivalryId)&&s?.connected===true&&s.attached!==true&&!s.rivalryId&&b?.saveId===request.saveId;}catch(_error){return false;}}
201:   async function ptcRefreshNow(){
202:     const request=ptcRequest();if(!request)return ptcClear();
203:     // r79: a Showdown ended by the other manager (END SHOWDOWN) stays ended (a closed rivalry never reopens): no further read for it.
204:     // r86 (red team #6): the same holds for a verified CLOSED one. The Champion screen's 45 s timer wake re-read it (~320 billed/hour).
205:     const ended=ptcCurrentState();if(ended?.phase==="DELETED"||(ended?.phase==="CLOSED"&&ended.terminal===true&&ended.rivalryId===request.rivalryId))return ended;
206:     await ptcBootstrap();
207:     // r79: right after a delete and a new JOIN, the page's rivalry can already be the new Showdown while this Showdown's request
208:     // (the old one) is still on screen for a moment. That is not a failure to report: this page has moved on, and the next wake
209:     // (the save or rivalry change) refreshes the new one. A held RECOVERY_PENDING close keeps its witness.
210:     let context;try{context=await ptcResolveContext(request);}catch(error){if(error?.code==="TERMINAL_CLOSE_RIVALRY_REQUIRED"&&(ptcOnOtherRivalry(request)||ptcShellHasNoRivalry(request))){const held=ptcCurrentState();return held?.phase==="RECOVERY_PENDING"?held:ptcClear();}throw error;}
211:     if(ptcRequest()?.key!==request.key)return null;
212:     const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
213:     if(ptcRequest()?.key!==request.key)return null;
214:     // H1017-1: an unresolved close holds its exact witness. A verified closed read of the same final facts resolves it here;
215:     // an open, mismatched or failed read keeps RECOVERY_PENDING so TRY CLOSING AGAIN stays bound to that witness.
216:     const held=ptcCurrentState();
217:     const deletedRead=terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed";
218:     const publishDeleted=()=>{try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcDeletedState(request,terminalRead));};
219:     if(held?.phase==="RECOVERY_PENDING"&&held.intent){
220:       // Codex #910: a pending close whose rivalry the other phone has since deleted (closed, no witness, so this close never
221:       // landed) is resolved as DELETED instead of being held and retried against a closed rivalry.
222:       if(deletedRead)return publishDeleted();
223:       if(terminalRead?.ok===true&&terminalRead.terminal===true&&ptcSameFinalResult(terminalRead,held.intent)){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
224:       return held;
225:     }
226:     if(terminalRead?.ok===true&&terminalRead.terminal===true){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
227:     // r79: DELETE CURRENT SHOWDOWN on the other phone closed this rivalry without a terminal witness. This same read (no extra one)
228:     // says so; this page then lets the dead Showdown go like the CLOSE path does (session forgotten, drafts swept) and announces
229:     // DELETED, so the pair holds the rivalry as closed and the next JOIN is not blocked by the deleted Showdown.
230:     if(deletedRead)return publishDeleted();
231:     if(!terminalRead||terminalRead.ok!==true)ptcFail(terminalRead?.code||"TERMINAL_CLOSE_READ_FAILED",terminalRead?.message||"The Showdown's closed status could not be checked.");
232:     let final=finalApi.getState();if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.rivalryId!==request.rivalryId)final=await finalApi.refresh();
233:     if(ptcRequest()?.key!==request.key)return null;
234:     if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.finalSeasonReconciled!==true||final.rivalryId!==request.rivalryId)return ptcClear();
235:     const remote=ptcRemoteActive(context);
236:     if(!remote)return ptcPublish(request,{phase:"BLOCKED",rivalryId:request.rivalryId,terminal:false,finalReconciliation:ptcClone(final),message:"Final results are safe. Reconnect both players to close the Showdown.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
237:     const intent=protocol.prepare(final,{sessionId:remote.sessionId});
238:     const failed=automaticAttempts.get(ptcAutomaticKey(context))?.failed===true;
239:     const ready=ptcPublish(request,{phase:"READY",rivalryId:request.rivalryId,sessionId:remote.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:!failed,automaticCloseFailed:failed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
240:     ptcScheduleAutomaticClose(context);
241:     return ready;
242:   }
243:   function ptcRefresh(){
244:     if(refreshPromise)return refreshPromise;busy=true;ptcRender();
245:     // r88: a dropped connection (the SDK's UNAVAILABLE "Connection failed.", e.g. a phone offline for a few seconds) is held once,
246:     // like the other shared refreshers: nothing changes (the state stays exactly as it was, never a made-up result) and the next
247:     // wake reads again. While the browser itself says it is offline the hold lasts (the offline notice owns that); once online, the
248:     // same ambiguous failure on the next refresh too is reported. Any other failure is reported at once.
249:     const request=ptcRequest();
250:     const run=ptcRefreshNow().then(value=>{heldRefreshFailure="";return value;},error=>{const key=ptcAmbiguous(error)&&request?`${request.key}|${ptcCode(error)}`:"";if(key&&(key!==heldRefreshFailure||root.navigator?.onLine===false)){heldRefreshFailure=key;root.console?.warn?.("[Career Mode Showdown] Shared Showdown Terminal Close is waiting for the connection.",ptcCode(error));return ptcCurrentState();}heldRefreshFailure="";ptcReport("Could not refresh the close status",error);return ptcCurrentState();}).finally(()=>{if(refreshPromise===run)refreshPromise=null;busy=false;ptcRender();ptcWatchContext(ptcRequest());if(wakePending){wakePending=false;ptcWake();}});refreshPromise=run;return run;
251:   }
252:   // Job 31: when the 4-hour private session ends (or a reload drops it) every shared refresher fails at once. The RECONNECT
253:   // SESSION banner owns that state, so those failures wake the banner instead of stacking red error toasts.
254:   function ptcSessionRecoveryOwnsFailure(){
255:     try{
256:       if(ptcShowdown()?.sharedJourney?.mode!=="shared")return false;
257:       const remote=root.CareerModeSparkRemoteJoining?.getState?.();
258:       // r75: Remote Joining now loads with Journey Reconnect's first shared refresh instead of at startup. Its session lives in
259:       // page memory only, so where Journey Reconnect runs, a Remote Joining not loaded yet holds no session, exactly as a freshly
260:       // loaded one did before: the banner owns the failure and Reconnect's refresh loads it.
261:       if(!remote){if(!root.CareerModeProductionSharedJourneyReconnect)return false;}
262:       else{const expiry=Number(remote.expiresAtEpochMs);
263:       if(remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry)return false;}
264:       root.console?.warn?.("[Career Mode Showdown] Shared refresh paused until the private session is reconnected.");
265:       void root.CareerModeProductionSharedJourneyReconnect?.refresh?.();
266:       return true;
267:     }catch(_error){return false;}
268:   }
269:   async function ptcReportUnlessClosed(context,error){
270:     if(ptcSessionRecoveryOwnsFailure())return false;
271:     // Active-journey refreshers lose read access once the rivalry closes; a verified CLOSED state makes their failure expected, anything else is still reported.
272:     try{let current=ptcCurrentState();if(current?.phase!=="CLOSED"&&ptcRequest())current=await ptcRefresh();if(current&&current.phase==="CLOSED")return false;if(current&&current.phase==="DELETED")return false;}catch(_error){}
273:     ptcReport(context,error);return true;
274:   }
275:   // r87 W3-6: the atomic session close is checked against server time (freshSessionActivity: server - 5 min .. + 1 min), so it
276:   // uses the connection's server-anchored clock (js/sparkRemoteJoining.js clockNow); the phone clock only if that is missing.
277:   function ptcNow(){try{const now=Number(root.CareerModeSparkRemoteJoining?.clockNow?.());if(Number.isFinite(now)&&now>0)return now;}catch(_error){}return Date.now();}
278:   function ptcCloseOptions(context,intent){return {user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:context.request.rivalryId,sessionId:intent.sessionId,deviceId:context.deviceId,intent,nowEpochMs:ptcNow(),cryptoImpl:root.crypto};}
279:   function ptcAccepted(request,intent,result){
280:     const closed=protocol.closeResult(intent,result);if(ptcRequest()?.key!==request.key)return null;try{remoteApi?.forgetSession?.();}catch(_error){}
281:     return ptcPublish(request,{phase:"CLOSED",rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryRevision:closed.rivalryRevision,sessionRevision:closed.sessionRevision,terminal:true,terminalWitness:ptcClone(intent),replayed:closed.replayed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
282:   }
283:   // BH-7: when both managers tap CLOSE together the loser's write is refused (permission-denied once the winner closed the
284:   // session/rivalry). Re-read once, like Season Results does; if the rivalry is already CLOSED with these final facts, show
285:   // CLOSED quietly. Anything else keeps the existing rejection path.
286:   // Codex #910: a rivalry the other phone deleted after READY rejects the close as a replay conflict (closed, no matching
287:   // witness); the same one re-read then shows DELETED instead of a rejected close.
288:   const PTC_RACE_CODES=new Set(["permission-denied","permission_denied","terminal_close_session_not_active","terminal_close_rivalry_not_active","terminal_close_replay_conflict"]);
289:   async function ptcClosedByRival(request,context,intent,result,generation){
290:     if(!PTC_RACE_CODES.has(ptcCode(result)))return null;
291:     try{
292:       const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
293:       if(ptcStillCurrent(request,generation)&&terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed"){try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcDeletedState(request,terminalRead));return {ok:true,status:"deleted",rivalryId:request.rivalryId};}
294:       if(!ptcStillCurrent(request,generation)||terminalRead?.ok!==true||terminalRead.terminal!==true||!ptcSameFinalResult(terminalRead,intent))return null;
295:       try{remoteApi?.forgetSession?.();}catch(_error){}
296:       ptcPublish(request,ptcClosedState(request,terminalRead));
297:       return {ok:true,status:"replayed",replayed:true,closedByRival:true,rivalryId:request.rivalryId,sessionId:terminalRead.terminalWitness.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};
298:     }catch(_error){return null;}
299:   }
300:   async function ptcClose(automaticKey=null){
301:     if(closePromise)return closePromise;
302:     const current=ptcCurrentState();if(!current||current.phase!=="READY"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_NOT_READY",message:"This Showdown is not ready to close yet."};
303:     const request=ptcRequest(),intent=protocol.verifyIntent(current.intent),generation=stateGeneration;busy=true;ptcPublish(request,{...current,automaticSaving:true,automaticCloseFailed:false});
304:     const run=(async()=>{
305:       try{
306:         const context=await ptcResolveContext(request);if(!ptcStillCurrent(request,generation)||(automaticKey&&ptcAutomaticKey(context)!==automaticKey))ptcFail("TERMINAL_CLOSE_CONTEXT_CHANGED");
307:         if(!ptcRemoteActive(context,intent.sessionId))ptcFail("TERMINAL_CLOSE_ACTIVE_SESSION_REQUIRED","The connection ended. Reconnect both players, then close the Showdown.");
308:         const result=await provider.close(ptcCloseOptions(context,intent));
309:         if(!ptcStillCurrent(request,generation))return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
310:         if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
311:         if(ptcAmbiguous(result)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:false,automaticCloseFailed:true,message:"The close is not confirmed yet. Tap TRY CLOSING AGAIN. Nothing new is started.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {...result,recoverable:true};}
312:         const rivalClosed=await ptcClosedByRival(request,context,intent,result,generation);if(rivalClosed)return rivalClosed;
313:         ptcPublish(request,{...current,automaticSaving:false,automaticCloseFailed:true,message:result?.message||"The Showdown could not be closed. Nothing was changed."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
314:       }catch(error){
315:         if(!ptcStillCurrent(request,generation))return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
316:         if(ptcAmbiguous(error)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:false,automaticCloseFailed:true,message:"The close was not confirmed. Tap TRY CLOSING AGAIN.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}
317:         ptcPublish(request,{...current,automaticSaving:false,automaticCloseFailed:true,message:error.message});
318:         ptcReport("Closing the Showdown failed.",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};
319:       }
320:     })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();if(wakePending){wakePending=false;ptcWake();}});closePromise=run;return run;
321:   }
322:   function ptcDeletedState(request,terminalRead){return {phase:"DELETED",rivalryId:request.rivalryId,rivalryRevision:terminalRead.rivalryRevision,terminal:false,deleted:true,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
323:   async function ptcRetry(){
324:     if(closePromise)return closePromise;
325:     const current=ptcCurrentState();if(!current||current.phase!=="RECOVERY_PENDING"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_RECOVERY_REQUIRED",message:"There is nothing to retry."};
326:     const request=ptcRequest(),intent=protocol.verifyIntent(current.intent),generation=stateGeneration;busy=true;ptcPublish(request,{...current,automaticSaving:true});
327:     // H1017-2: the request and state generation are re-checked after every await, before any close call or session cleanup.
328:     const changed={ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
329:     const run=(async()=>{
330:       try{
331:         const context=await ptcResolveContext(request);if(!ptcStillCurrent(request,generation))return changed;
332:         const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
333:         if(!ptcStillCurrent(request,generation))return changed;
334:         // Codex #910: the other phone deleted the rivalry before this RETRY: DELETED at once, no close sent against it.
335:         if(terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed"){try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcDeletedState(request,terminalRead));return {ok:true,status:"deleted",rivalryId:request.rivalryId};}
336:         if(terminalRead?.ok===true&&terminalRead.terminal===true){if(!ptcSameFinalResult(terminalRead,intent))ptcFail("TERMINAL_CLOSE_REPLAY_CONFLICT");try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcClosedState(request,terminalRead));return {ok:true,status:"replayed",replayed:true,rivalryId:request.rivalryId,sessionId:terminalRead.terminalWitness.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};}
337:         const result=await provider.close(ptcCloseOptions(context,intent));
338:         if(!ptcStillCurrent(request,generation))return changed;
339:         if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
340:         if(ptcAmbiguous(result)){ptcPublish(request,current);return {...result,recoverable:true};}
341:         const rivalClosed=await ptcClosedByRival(request,context,intent,result,generation);if(rivalClosed)return rivalClosed;
342:         ptcPublish(request,{...current,message:result?.message||"Closing again did not work. Your final results are kept."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
343:       }catch(error){if(ptcAmbiguous(error)){ptcPublish(request,current);return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}if(ptcStillCurrent(request,generation))ptcPublish(request,current);ptcReport("Closing the Showdown failed again.",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};}
344:     })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();if(wakePending){wakePending=false;ptcWake();}});closePromise=run;return run;
345:   }
346:   // BH-7: the one-shot wake below never asks again when an initialize left Connected Rivalry unattached and "unavailable".
347:   // Re-ask at most once per 30 s, one attempt at a time (flag cleared in finally), only while no request exists and the page is
348:   // visible. r52's unthrottled retry re-ran initialize on every wake; each initialize emits a rivalry state-change event that
349:   // wakes this module again, so it looped and stalled the season-3 publish. The 30 s clock starts before the attempt, so the
350:   // attempt's own state-change event cannot start another one; it is fire-and-forget and nothing else waits on it.
351:   function ptcRivalryRetryDue(api){
352:     if(rivalryRetryInFlight||root.document?.visibilityState==="hidden")return false;
353:     if(ptcShowdown()?.sharedJourney?.mode!=="shared"||!api||typeof api.initialize!=="function")return false;
354:     const s=api.getState?.();if(!s||s.initialized!==true||s.attached===true||s.status!=="unavailable"||s.busy===true)return false;
355:     return !rivalryRetryAt||Date.now()-rivalryRetryAt>=RIVALRY_RETRY_MS;
356:   }
357:   function ptcRetryUnavailableRivalry(api){
358:     if(!ptcRivalryRetryDue(api))return false;
359:     rivalryRetryAt=Date.now();rivalryRetryInFlight=true;
360:     void Promise.resolve().then(()=>{const s=api.getState?.();if(s&&s.attached!==true&&s.status==="unavailable"&&!ptcRequest())return api.initialize();return null;}).catch(()=>{}).finally(()=>{rivalryRetryInFlight=false;});
361:     return true;
362:   }
363:   // r84 trim: while a shared Showdown is open, the budget layer keeps one listener on the rivalry root and one on the Session
364:   // (see CareerModeFirestoreBudget.watchContext); a change to either wakes this module at once.
365:   let contextWatchKey="";
366:   function ptcContextWake(){ptcWake({type:"career-mode-shared-wait-context-change"});}
367:   function ptcWatchContext(request){
368:     const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchContext!=="function")return;
369:     // A verified CLOSED (or deleted) Showdown never changes again: no context watch for it, so a phone unlock on the Champion
370:     // screen restores nothing for it (red team r87 A-03). The watch stays while the close can still be finished.
371:     const ended=request?ptcCurrentState():null,settled=ended?.phase==="DELETED"||(ended?.phase==="CLOSED"&&ended.terminal===true&&ended.rivalryId===request?.rivalryId);
372:     const id=request&&!settled&&root.document?.visibilityState!=="hidden"?request.rivalryId:"";
373:     if(id===contextWatchKey&&!id)return;
374:     contextWatchKey=id;try{budget.watchContext(id||null,ptcContextWake);}catch(_error){}
375:   }
376:   function ptcWake(event){
377:     ptcWatchPair();
378:     if(event?.type==="career-mode-save-library-authority-invalidated")return ptcClear();
379:     const request=ptcRequest();
380:     ptcWatchContext(request);
381:     if(!request){
382:       ptcClear();
383:       // After a reload the durable rivalry binding is only known once Connected Rivalry initializes; its state-change event wakes this module again.
384:       const api=ptcRivalryApi();if(!rivalryWakeRequested&&ptcShowdown()?.sharedJourney?.mode==="shared"&&api&&typeof api.initialize==="function"&&api.getState?.()?.initialized!==true){rivalryWakeRequested=true;rivalryRetryAt=Date.now();void Promise.resolve().then(()=>api.initialize()).catch(()=>{});}
385:       else ptcRetryUnavailableRivalry(api);
386:       return;
387:     }
388:     if(stateContextKey&&stateContextKey!==request.key)ptcClear();
389:     if(root.document?.visibilityState==="hidden")return;if(busy){if(event?.type==="career-mode-shared-wait-context-change")wakePending=true;return;}
390:     // r75: while the close is pending (FINAL RESULT READY TO CLOSE and the pending/blocked states) the partner may close at
391:     // any moment, so this check reads the rivalry root fresh instead of from the budget layer's quiet reuse.
392:     // r84 trim: a healthy context listener on the rivalry root (ptcWatchContext) delivers the partner's close at once, so the
393:     // fresh reads below run only while it is not confirmed (no listener, hidden page, dropped connection).
394:     const rootPath=`rivalries/${request.rivalryId}`,watched=Boolean(root.CareerModeFirestoreBudget?.contextHealthy?.(rootPath));
395:     if(["READY","RECOVERY_PENDING","BLOCKED"].includes(ptcCurrentState()?.phase)){if(!watched)root.CareerModeFirestoreBudget?.wantFresh?.(rootPath);}
396:     // r84: between seasons nothing else re-reads the rivalry now that Final Reconciliation no longer loops, so the 60 s quiet reuse
397:     // could hold a partner's END SHOWDOWN for up to 75 s. A timer wake (no event) reads the rivalry root fresh at most every 45 s:
398:     // one extra read per 3 min per device, and the idle phone goes Home within ~45 s.
399:     else if(!event&&Date.now()-pollFreshAt>=POLL_FRESH_MS){pollFreshAt=Date.now();if(!watched)root.CareerModeFirestoreBudget?.wantFresh?.(rootPath);}
400:     void ptcRefresh();
401:   }
402:   function ptcInstall(){
403:     if(installed)return true;installed=true;
404:     // r75: an ordinary startup with no shared Showdown loads none of the close runtime (Remote Joining stays unloaded);
405:     // the first wake that finds a shared Showdown loads it through ptcRefreshNow.
406:     if(ptcShowdown()?.sharedJourney?.mode==="shared")void ptcBootstrap().then(()=>ptcWake()).catch(error=>ptcReport("Closing the Showdown is unavailable right now.",error));
407:     for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-final-reconciliation-state-change","career-mode-connected-account-state-change","career-mode-connected-rivalry-state-change","career-mode-active-save-changed","career-mode-save-library-authority-invalidated","career-mode-showdown-state-change"]){root.addEventListener?.(event,ptcWake);}
408:     root.document?.addEventListener?.("visibilitychange",ptcWake);
409:     root.addEventListener?.("career-mode-permanent-pair-ended",event=>ptcNoteEnded(event?.detail?.closedRivalryId));
410:     if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())ptcWake();},POLL_MS);
411:     if(typeof root.setTimeout==="function")root.setTimeout(ptcWake,0);
412:     return true;
413:   }
414: 
415:   return Object.freeze({
416:     contractVersion:1,feature:"ssjr-production-shared-terminal-close",productionEnabled:true,runtimeRevision:"1.9.1-r18",pollIntervalMs:POLL_MS,
417:     requiresFinalReconciliation:true,requiresExactActiveSessionToClose:true,sameWitnessRetry:true,terminalReadAfterReload:true,terminalSessionResurrection:false,
418:     canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
419:     install:ptcInstall,refresh:ptcRefresh,reportUnlessClosed:ptcReportUnlessClosed,close:ptcClose,retry:ptcRetry,getState:ptcCurrentState,isBusy:()=>busy
420:   });
421: });
422: 
```

## FILE: firestore.terminal-close-production.fragment.rules (274 lines)
```
1: // SSJR_TERMINAL_CLOSE_FUNCTIONS_BEGIN
2:     function ssjrTerminalValidWinner(intent) {
3:       return (intent.managerTotals.playerOne > intent.managerTotals.playerTwo && intent.winner == 'playerOne')
4:         || (intent.managerTotals.playerTwo > intent.managerTotals.playerOne && intent.winner == 'playerTwo')
5:         || (intent.managerTotals.playerOne == intent.managerTotals.playerTwo && intent.winner == 'draw');
6:     }
7:     function ssjrTerminalValidIntent(rivalryId, intent) {
8:       return intent is map
9:         && intent.keys().hasOnly([
10:           'schemaVersion','runtimeRevision','phase','rivalryId','sessionId','totalSeasons','completedSeason',
11:           'managerTotals','winner','terminal','finalSeasonReconciled','nextSeason','extraSeasonAllowed',
12:           'rivalryConnectionState','sessionTargetState','terminalReadAllowed','canonicalStorageMutation','providerWriteRequired',
13:           'endedBy','sacked',
14:           'listPermissionRequired','billingRequired'
15:         ])
16:         && intent.schemaVersion == 1
17:         && intent.runtimeRevision == '1.9.1-r18'
18:         && intent.phase == 'TERMINAL_CLOSE_READY'
19:         && intent.rivalryId == rivalryId
20:         && validSessionId(intent.sessionId)
21:         && intent.totalSeasons in [1,3,5,10]
22:         // r89 Sacked: a Showdown with a sacking ends after that season (endedBy 'sacked', completedSeason <= totalSeasons);
23:         // the close below ties completedSeason and the sacked map to the Terminal Progress. Without endedBy it is full length.
24:         && intent.completedSeason is int
25:         && (intent.completedSeason == intent.totalSeasons
26:           || (intent.get('endedBy', null) == 'sacked' && intent.completedSeason >= 1 && intent.completedSeason < intent.totalSeasons))
27:         && (!('endedBy' in intent) || (intent.endedBy == 'sacked' && 'sacked' in intent))
28:         && intent.managerTotals is map
29:         && intent.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
30:         && intent.managerTotals.playerOne is int
31:         && intent.managerTotals.playerOne >= 0
32:         && intent.managerTotals.playerTwo is int
33:         && intent.managerTotals.playerTwo >= 0
34:         && ssjrTerminalValidWinner(intent)
35:         && intent.terminal == true
36:         && intent.finalSeasonReconciled == true
37:         && intent.nextSeason == null
38:         && intent.extraSeasonAllowed == false
39:         && intent.rivalryConnectionState == 'closed'
40:         && intent.sessionTargetState == 'closed'
41:         && intent.terminalReadAllowed == true
42:         && intent.canonicalStorageMutation == false
43:         && intent.providerWriteRequired == true
44:         && intent.listPermissionRequired == false
45:         && intent.billingRequired == false;
46:     }
47:     // Canonical season score: CL +5, EL +3 (r80; the key exists only when won), league title +3, cup +1,
48:     // 100 points or 100 goals +1, top scorer or top assist +1, Prime Pack 4, 3, 2 or 1 (the key exists only when won). A season is at most 15.
49:     function ssjrTerminalScore(result) {
50:       return (result.championsLeague == true ? 5 : 0)
51:         + (result.get('europaLeague', false) == true ? 3 : 0)
52:         + result.get('primePack', 0)
53:         + (result.leaguePosition == 1 ? 3 : 0)
54:         + (result.domesticCup == true ? 1 : 0)
55:         + ((result.leaguePoints >= 100 || result.leagueGoals >= 100) ? 1 : 0)
56:         + ((result.topScorer == true || result.topAssist == true) ? 1 : 0);
57:     }
58:     function ssjrTerminalCommitAccepted(root, rivalryId, seasonNumber) {
59:       return root is map
60:         && root.schemaVersion == 1
61:         && root.objectType == 'sharedSeasonCommit'
62:         && root.rivalryId == rivalryId
63:         && root.seasonNumber == seasonNumber
64:         && root.runtimeRevision == '1.9.1-r10'
65:         && root.phase == 'ACKNOWLEDGED'
66:         && root.revision == 3
67:         && root.results is map
68:         && root.results.keys().hasOnly(['playerOne','playerTwo'])
69:         && root.results.playerOne is map
70:         && root.results.playerTwo is map;
71:     }
72:     // r89 Sacked: the Terminal Progress carries sacked:{playerOne,playerTwo} exactly when the season it accepts has a
73:     // sacked result (either manager); its bools equal the commit's. No further season is accepted after it. No extra read:
74:     // the commit is the one the progress step already gets. A committed result holds 'sacked' only as true (the commit
75:     // rules), so 'sacked' in a result is the tick. The progress record's own key is the guard: a Showdown nobody was
76:     // sacked in pays only the two key tests (the 1,000-expression budget of the last progress write).
77:     function ssjrTerminalSackedMatches(progress, commit) {
78:       return ('sacked' in progress)
79:         ? progress.sacked == {'playerOne': 'sacked' in commit.results.playerOne, 'playerTwo': 'sacked' in commit.results.playerTwo}
80:           && progress.sacked != {'playerOne': false, 'playerTwo': false}
81:         : !('sacked' in commit.results.playerOne) && !('sacked' in commit.results.playerTwo);
82:     }
83:     function ssjrTerminalSeasonId(seasonNumber) {
84:       return 'season_' + string(seasonNumber);
85:     }
86:     // The shape of a Terminal Progress record (the new record of every progress write and the closing check in the pair
87:     // fragment both name the seven keys it may hold).
88:     function ssjrTerminalProgressShape(progress, keys) {
89:       return progress is map
90:         && progress.keys().hasOnly(keys)
91:         && progress.schemaVersion == 1
92:         && progress.runtimeRevision == '1.9.1-r18'
93:         && progress.totalSeasons in [1,3,5,10]
94:         && progress.acceptedThroughSeason is int
95:         && progress.acceptedThroughSeason >= 1
96:         && progress.acceptedThroughSeason <= progress.totalSeasons
97:         && progress.managerTotals is map
98:         && progress.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
99:         && progress.managerTotals.playerOne is int
100:         && progress.managerTotals.playerOne >= 0
101:         && progress.managerTotals.playerOne <= progress.acceptedThroughSeason * 15
102:         && progress.managerTotals.playerTwo is int
103:         && progress.managerTotals.playerTwo >= 0
104:         && progress.managerTotals.playerTwo <= progress.acceptedThroughSeason * 15
105:         && (progress.closedSessionRevision == null || (progress.closedSessionRevision is int && progress.closedSessionRevision >= 1));
106:     }
107:     function ssjrTerminalBaseRivalryPreserved(before, after) {
108:       return after.data.connectionStateBeforeDeletion == before.data.connectionStateBeforeDeletion
109:         && after.data.managerSlots == before.data.managerSlots
110:         && after.data.authorizedAccountIds == before.data.authorizedAccountIds
111:         && after.data.createdByAccountId == before.data.createdByAccountId
112:         && after.data.createdAt == before.data.createdAt;
113:     }
114:     function ssjrTerminalProgressActorValid(before, after) {
115:       return signedIn()
116:         && activeDevice(after.updatedByDeviceId)
117:         && after.updatedByAccountId == request.auth.uid
118:         && before.data.authorizedAccountIds is list
119:         && before.data.authorizedAccountIds.size() == 2
120:         && before.data.authorizedAccountIds[0] != before.data.authorizedAccountIds[1]
121:         && request.auth.uid in before.data.authorizedAccountIds;
122:     }
123:     function ssjrTerminalInitialProgress(rivalryId, before, after) {
124:       let progress = after.data.terminalProgress;
125:       let setup = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
126:       let commit = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/season_1).data;
127:       return progress.acceptedThroughSeason == 1
128:         && progress.closedSessionRevision == null
129:         && setup.schemaVersion == 1
130:         && setup.objectType == 'sharedSetupLedger'
131:         && setup.rivalryId == rivalryId
132:         && setup.revision == 6
133:         && setup.phase == 'SHOWDOWN_CONFIRMED'
134:         && setup.totalSeasons == progress.totalSeasons
135:         // r89 Sacked: checked before the commit and score terms, so a wrong or missing map is refused early (a refusal
136:         // at the end of this path runs into the 1,000-expression limit; measured on the emulator).
137:         && (('sacked' in progress) ? ssjrTerminalSackedMatches(progress, commit) : (!('sacked' in commit.results.playerOne) && !('sacked' in commit.results.playerTwo)))
138:         && ssjrTerminalCommitAccepted(commit, rivalryId, 1)
139:         && progress.managerTotals.playerOne == ssjrTerminalScore(commit.results.playerOne)
140:         && progress.managerTotals.playerTwo == ssjrTerminalScore(commit.results.playerTwo);
141:     }
142:     function ssjrTerminalAdvanceProgress(rivalryId, before, after) {
143:       let prior = before.data.terminalProgress;
144:       let progress = after.data.terminalProgress;
145:       let nextSeason = prior.acceptedThroughSeason + 1;
146:       let seasonId = ssjrTerminalSeasonId(nextSeason);
147:       let commit = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$(seasonId)).data;
148:       // Rules headroom (r89): the prior record is the stored Terminal Progress, which these Rules (and every earlier r18 version)
149:       // only ever accept through the full shape check below (ValidProgressUpdate), so its shape is not proven again here.
150:       // What the advance needs from it is tested directly: no season after a sacked one, no close yet, and its numbers
151:       // carry into the new record, whose own shape is checked in full.
152:       return !('sacked' in prior)
153:         && prior.closedSessionRevision == null
154:         && progress.closedSessionRevision == null
155:         && progress.totalSeasons == prior.totalSeasons
156:         && nextSeason <= prior.totalSeasons
157:         && progress.acceptedThroughSeason == nextSeason
158:         && (('sacked' in progress) ? ssjrTerminalSackedMatches(progress, commit) : (!('sacked' in commit.results.playerOne) && !('sacked' in commit.results.playerTwo)))
159:         && ssjrTerminalCommitAccepted(commit, rivalryId, nextSeason)
160:         && progress.managerTotals.playerOne == prior.managerTotals.playerOne + ssjrTerminalScore(commit.results.playerOne)
161:         && progress.managerTotals.playerTwo == prior.managerTotals.playerTwo + ssjrTerminalScore(commit.results.playerTwo);
162:     }
163:     // Stale-write gate (both managers save the same Terminal Close step at once). After the cheap checks that every
164:     // other write path already fails on, the CAS revision step is the condition of a ternary: a write built on a
165:     // revision the document already left is refused right there, and an evaluation pass that cannot read the stored
166:     // document stops there too instead of running the whole check into the 1,000-expression limit. The step stays
167:     // required inside ssjrTerminalFinalEnvelopeCas, so no outcome changes; only the refusal comes sooner.
168:     function ssjrTerminalValidProgressUpdate(rivalryId) {
169:       let before = resource.data;
170:       let after = request.resource.data;
171:       return rivalryId.matches('^pair_[0-9a-f]{64}$')
172:         && before.data.connectionState == 'active'
173:         && after.data.connectionState == 'active'
174:         && ((after.revision == before.revision + 1) ? (ssjrTerminalFinalEnvelopeCas(before, after, 'rivalry', rivalryId)
175:         && after.data.diff(before.data).affectedKeys().hasOnly(['terminalProgress'])
176:         && ssjrTerminalProgressActorValid(before, after)
177:         // r88 Rules slimming: the new progress record's shape is checked once here for both branches (it was the first
178:         // conjunct of each); same conjunction per branch, same writes allowed and denied, one expansion fewer per branch.
179:         && ssjrTerminalProgressShape(after.data.terminalProgress, ['schemaVersion','runtimeRevision','totalSeasons','acceptedThroughSeason','managerTotals','closedSessionRevision','sacked'])
180:         && (
181:           (!('terminalProgress' in before.data) && ssjrTerminalInitialProgress(rivalryId, before, after))
182:           || ('terminalProgress' in before.data && ssjrTerminalAdvanceProgress(rivalryId, before, after))
183:         )) : false);
184:     }
185:     function ssjrTerminalFinalEnvelopeCas(before, after, objectType, objectId) {
186:       return before.objectType == objectType
187:         && before.objectId == objectId
188:         && before.lifecycleState == 'live'
189:         && after.schemaVersion == before.schemaVersion
190:         && after.objectType == objectType
191:         && after.objectId == objectId
192:         && after.lifecycleState == 'live'
193:         && after.revision == before.revision + 1
194:         && after.parentRevision == before.revision
195:         && after.priorContentHash == before.contentHash
196:         && validHash(after.contentHash)
197:         && after.tombstone == null
198:         && after.diff(before).affectedKeys().hasOnly([
199:           'revision','parentRevision','contentHash','priorContentHash','updatedAt','updatedByAccountId','updatedByDeviceId','data'
200:         ]);
201:     }
202:     function ssjrTerminalParentCloseRequested(rivalryId, sessionId) {
203:       let parentAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
204:       return parentAfter.data.connectionState == 'closed'
205:         && parentAfter.data.terminalClose.runtimeRevision == '1.9.1-r18'
206:         && parentAfter.data.terminalClose.sessionId == sessionId;
207:     }
208:     function ssjrTerminalValidAtomicSessionClose(rivalryId, sessionId) {
209:       let before = resource.data;
210:       let after = request.resource.data;
211:       let parentBefore = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
212:       let parentAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
213:       return after.data.state == 'closed'
214:         && ssjrTerminalParentCloseRequested(rivalryId, sessionId)
215:         && ((after.revision == before.revision + 1) ? (signedIn()
216:         && validSessionId(sessionId)
217:         && before.data.rivalryId == rivalryId
218:         && before.data.state == 'active'
219:         && request.auth.uid in before.data.memberAccountIds
220:         && ssjrTerminalFinalEnvelopeCas(before, after, 'session', sessionId)
221:         && after.updatedByAccountId == request.auth.uid
222:         && after.data.diff(before.data).affectedKeys().hasOnly(['state','lastActivityAt'])
223:         && after.data.state == 'closed'
224:         && after.data.lastActivityAt == after.updatedAt
225:         && freshSessionActivity(after.data.lastActivityAt)
226:         && parentBefore.data.connectionState == 'active'
227:         && parentAfter.data.connectionState == 'closed'
228:         && parentAfter.data.terminalClose.sessionId == sessionId
229:         && parentAfter.data.terminalProgress.closedSessionRevision == after.revision
230:         && parentAfter.updatedByAccountId == request.auth.uid
231:         && parentAfter.updatedByDeviceId == after.updatedByDeviceId) : false);
232:     }
233:     function ssjrTerminalValidCloseUpdate(rivalryId) {
234:       let before = resource.data;
235:       let after = request.resource.data;
236:       let priorProgress = before.data.terminalProgress;
237:       let progress = after.data.terminalProgress;
238:       let intent = after.data.terminalClose;
239:       let sessionAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(intent.sessionId)).data;
240:       return rivalryId.matches('^pair_[0-9a-f]{64}$')
241:         && signedIn()
242:         && before.data.connectionState == 'active'
243:         && after.data.connectionState == 'closed'
244:         && ((after.revision == before.revision + 1) ? (ssjrTerminalFinalEnvelopeCas(before, after, 'rivalry', rivalryId)
245:         && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState','terminalProgress','terminalClose'])
246:         && before.data.authorizedAccountIds is list
247:         && before.data.authorizedAccountIds.size() == 2
248:         && before.data.authorizedAccountIds[0] != before.data.authorizedAccountIds[1]
249:         && request.auth.uid in before.data.authorizedAccountIds
250:         && activeDevice(after.updatedByDeviceId)
251:         && after.updatedByAccountId == request.auth.uid
252:         && priorProgress.runtimeRevision == '1.9.1-r18'
253:         && (('sacked' in priorProgress)
254:           ? (intent.get('endedBy', null) == 'sacked' && intent.get('sacked', null) == priorProgress.sacked && intent.completedSeason == priorProgress.acceptedThroughSeason)
255:           : (priorProgress.acceptedThroughSeason == priorProgress.totalSeasons && !('endedBy' in intent) && !('sacked' in intent)))
256:         && priorProgress.closedSessionRevision == null
257:         && progress.diff(priorProgress).affectedKeys().hasOnly(['closedSessionRevision'])
258:         && progress.closedSessionRevision is int
259:         && progress.closedSessionRevision == sessionAfter.revision
260:         && ssjrTerminalValidIntent(rivalryId, intent)
261:         && intent.totalSeasons == priorProgress.totalSeasons
262:         && intent.managerTotals == priorProgress.managerTotals
263:         && sessionAfter.objectType == 'session'
264:         && sessionAfter.objectId == intent.sessionId
265:         && sessionAfter.data.rivalryId == rivalryId
266:         && sessionAfter.data.state == 'closed'
267:         && sessionAfter.updatedByAccountId == request.auth.uid
268:         && sessionAfter.updatedByDeviceId == after.updatedByDeviceId) : false);
269:     }
270:     function ssjrTerminalValidRivalryUpdate(rivalryId) {
271:       return (request.resource.data.data.connectionState == 'active' && ssjrTerminalValidProgressUpdate(rivalryId))
272:         || (request.resource.data.data.connectionState == 'closed' && ssjrTerminalValidCloseUpdate(rivalryId));
273:     }
274: // SSJR_TERMINAL_CLOSE_FUNCTIONS_END
```

(End of packet FJ7. Answer with the report only.)
