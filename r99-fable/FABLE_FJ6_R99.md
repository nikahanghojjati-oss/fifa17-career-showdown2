# Fable 5.2 red-team job FJ6: Season commit: exactly once

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
Then one block per finding: ID (FJ6-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Can a season get zero commits (stuck for good) or two (double count)? Cover both CONFIRMs at the same instant, a double tap, a retry after a network error, and one phone offline during the other's CONFIRM.
2. Can local reconciliation make one phone believe a season is committed when the shared record says otherwise, or the reverse, for longer than one refresh?
3. Does a commit ever use one phone's local numbers instead of the shared published results?
4. Do the Rules refuse any normal commit, or come near the 1,000 expressions per document limit at season 10?
5. After the commit, is the next season (or the end) reached on both phones?

## Known (do not report)
None.

## Files

## FILE: js/productionSharedSeasonCommit.js (312 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedSeasonCommit=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   // Job 33 (R1): read every 3 s for at most 3 minutes while waiting for the coordinator's commit or the rival's acknowledge.
10:   const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
11:   let fastWaitKey="",fastWaitSince=0;
12:   function psscReadTimeoutMs(){const value=Number(root.CMS_COMMIT_READ_TIMEOUT_MS);return Number.isFinite(value)&&value>=1000&&value<=25000?value:25000;}
13:   const ACTION_ID="sharedSeasonCommitAction";
14:   let installed=false,busy=false,provider=null,conflictGuard=null,setupApi=null,resultsApi=null,view=null,contextKey="",providerChain=Promise.resolve(),refreshPromise=null,refreshRequestKey="",headingObserver=null,bootstrapObserver=null,errorMessage="",pendingErrorKind="",readError="",readErrorKey="",readGeneration=0,heldReportKey="";
15: 
16:   function psscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
17:   function psscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
18:   function psscSharedMarker(){const showdown=psscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
19:   function psscField(id){return root.document&&root.document.getElementById(id);}
20:   function psscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
21:   function psscDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
22:   function psscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
23:   function psscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
24:   function psscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
25:   async function psscEnsureDependencies(){
26:     if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
27:     else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
28:     await psscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
29:     await psscLoadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
30:     await psscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
31:     await psscLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
32:     await psscLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
33:     await psscLoadScript("ssjr-season-commit-protocol","js/sharedSeasonCommit.js",()=>root.CareerModeSharedSeasonCommit);
34:     await psscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
35:     await psscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
36:     await psscLoadScript("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js",()=>root.CareerModeProductionSharedJourneyConflicts);
37:     setupApi=root.CareerModeProductionSharedShowdownSetup;resultsApi=root.CareerModeProductionSharedSeasonResults;provider=root.CareerModeSparkSharedSeasonCommit;conflictGuard=root.CareerModeProductionSharedJourneyConflicts;
38:     if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")psscFail("SEASON_COMMIT_SETUP_UNAVAILABLE");
39:     if(!resultsApi||typeof resultsApi.refresh!=="function"||typeof resultsApi.getState!=="function")psscFail("SEASON_COMMIT_RESULTS_UNAVAILABLE");
40:     if(!provider||typeof provider.read!=="function"||typeof provider.commitSeason!=="function"||typeof provider.acknowledgeSeason!=="function")psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");
41:     if(!conflictGuard||typeof conflictGuard.execute!=="function")psscFail("JOURNEY_CONFLICT_GUARD_UNAVAILABLE");
42:   }
43:   function psscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=psscShowdown()?.currentRound,season=Number(psscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)psscFail("SEASON_COMMIT_SEASON_INVALID");return season;}
44:   function psscSetupState(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
45:   function psscResultsState(){try{return (resultsApi||root.CareerModeProductionSharedSeasonResults)?.getState?.()||null;}catch(_error){return null;}}
46:   function psscRequestContext(){const showdown=psscShowdown(),setup=psscSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=psscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
47:   function psscContextMatches(request){const current=psscRequestContext();return Boolean(request&&current&&request.key===current.key);}
48:   function psscResultsPublished(request=psscRequestContext()){const results=psscResultsState();return Boolean(request&&results&&results.state?.phase==="RESULTS_READY"&&results.state?.revision===2&&Number(results.seasonNumber)===request.seasonNumber&&String(results.rivalryId||"")===request.rivalryId);}
49:   function psscResultsReady(request=psscRequestContext()){const results=psscResultsState();return Boolean(psscResultsPublished(request)&&results.allResults?.playerOne&&results.allResults?.playerTwo);}
50:   function psscResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The season request was rejected.");error.code=result&&result.code||"SEASON_COMMIT_PROVIDER_FAILED";throw error;}
51:   function psscWithTimeout(promise,ms,code){let timer=null;const timeout=new Promise((_,reject)=>{timer=root.setTimeout?.(()=>{const error=new Error("The Shared Season Commit check took too long. Check your connection and retry.");error.code=code;reject(error);},ms);});return Promise.race([promise,timeout]).finally(()=>{if(timer!==null)root.clearTimeout?.(timer);});}
52:   function psscQueue(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
53:   function psscRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")psscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_commit_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
54:   // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the RESULTS_READY Season Results.
55:   async function psscProviderContext(request=psscRequestContext(),light=false){
56:     if(!psscSharedMarker())psscFail("SEASON_COMMIT_SHARED_MODE_REQUIRED");
57:     if(!request||!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
58:     await psscEnsureDependencies();
59:     if(!psscResultsPublished(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must confirm their Season Results first.");
60:     if(!(light===true&&psscSetupState()?.ready===true&&psscResultsReady(request))){
61:       await setupApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
62:       await resultsApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
63:     }
64:     if(!psscResultsReady(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must confirm their Season Results first.");
65:     const setup=psscSetupState();
66:     if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)psscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");
67:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
68:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE","The online service is unavailable.");
69:     return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
70:   }
71:   function psscEnsureUi(){
72:     const panel=psscField("seasonReviewPanel"),actions=panel?.querySelector?.(".seasonReviewActions");if(!panel||!actions)return null;
73:     let status=psscField("sharedSeasonCommitStatus");if(!status){status=root.document.createElement("p");status.id="sharedSeasonCommitStatus";status.className="seasonReviewWarning sharedSeasonCommitStatus";actions.parentNode.insertBefore(status,actions);}
74:     let action=psscField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton";action.type="button";actions.prepend(action);}
75:     return {panel,actions,status,action};
76:   }
77:   function psscSetError(message=""){
78:     const node=psscField("seasonReviewError"),value=String(message||"");
79:     if(!value){if(node&&errorMessage&&node.textContent===errorMessage)node.textContent="";errorMessage="";return;}
80:     if(node){node.textContent=value;errorMessage=value;}
81:   }
82:   // r80 (Nik, 2026-10-19): the two managers play different FIFA saves, so both winning the league (same position), the
83:   // Champions League or the domestic cup in the same season is normal and is never a clash. Only a same-manager
84:   // impossibility (one save winning both the Champions League and the Europa League) may ever be listed here; none is yet.
85:   function psscSeasonResultClash(_results){
86:     const lines=[];
87:     return lines;
88:   }
89:   function psscClashWarning(who){
90:     const lines=psscSeasonResultClash(psscResultsState()?.allResults);
91:     return lines.length?` · CHECK RESULTS: ${lines.join(" ")} ${who} can still lock the season; scores use what was entered.`:"";
92:   }
93:   function psscManagerName(role){return psscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
94:   // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
95:   // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
96:   let psscWatchedKey=null;
97:   function psscWatchSync(){let key="";try{key=psscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===psscWatchedKey)return;psscWatchedKey=key;try{psscWatchWait();}catch(_error){}}
98:   function psscRender(){psscWatchSync();
99:     const ui=psscEnsureUi();if(!ui)return false;
100:     const request=psscRequestContext(),ready=Boolean(psscSharedMarker()&&request&&psscResultsPublished(request)),eligible=Boolean(ready&&psscResultsReady(request)&&contextKey===request.key&&view);
101:     psscHidden(ui.status,!ready);psscHidden(ui.action,!ready);if(!ready)return false;
102:     if(!eligible){
103:       psscText(ui.status,readError?`SEASON CHECK FAILED · ${readError} · YOUR RESULTS ARE SAVED`:'CHECKING THE SEASON · YOUR RESULTS ARE SAVED');
104:       psscText(ui.action,readError?'CHECK AGAIN':'CHECK SEASON');psscDisable(ui.action,busy||Boolean(refreshPromise));return false;
105:     }
106:     const role=view.managerRole,coordinator=view.coordinatorRole,phase=view.phase||"RESULTS_READY";
107:     // r89 Sacked (Codex C3): while this phone's own sacked result waits on the rival, the wait line says how a 2.1.0 rival phone
108:     // (which cannot read a sacked result) gets going again. Only a 2.2.0 phone can publish a sacking.
109:     const rivalName=String(psscManagerName(role==="playerOne"?"playerTwo":"playerOne")).toUpperCase(),sackedHint=psscResultsState()?.ownResult?.sacked===true?` · IF ${rivalName}'S PHONE SHOWS AN ERROR: SETTINGS › UPDATE TO LATEST VERSION`:"";
110:     if(phase==="ACKNOWLEDGED"){
111:       psscText(ui.status,"SEASON CONFIRMED BY BOTH MANAGERS");psscText(ui.action,"SEASON CONFIRMED ✓");psscDisable(ui.action,true);return true;
112:     }
113:     if(view.committed){
114:       if(view.ownAcknowledged){psscText(ui.status,`YOU CONFIRMED THIS SEASON · WAITING FOR YOUR RIVAL${sackedHint}`);psscText(ui.action,"CONFIRMED ✓ · WAITING FOR RIVAL");psscDisable(ui.action,true);}
115:       else{psscText(ui.status,"SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT");psscText(ui.action,"CONFIRM SEASON");psscDisable(ui.action,busy);}
116:       return true;
117:     }
118:     if(role===coordinator){psscText(ui.status,`BOTH RESULTS ARE IN · LOCK THE SEASON${psscClashWarning("You")}`);psscText(ui.action,"LOCK & CONFIRM SEASON");psscDisable(ui.action,busy);}
119:     else{psscText(ui.status,`BOTH RESULTS ARE IN · WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()} TO LOCK THE SEASON${psscClashWarning(psscManagerName(coordinator))}${sackedHint}`);psscText(ui.action,`WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()}`);psscDisable(ui.action,true);}
120:     return true;
121:   }
122:   // r87 shared reads meter: the season's ACKNOWLEDGED also tells the reads meter this phone's role and Firestore, so it writes this
123:   // phone's meter document once and reads the partner's (js/sparkPrivatePairing.js, fsbShareSeason). Season 1 is measured from
124:   // its Career Start (noteSeasonStart), never from the setup before it.
125:   function psscBind(result,ctx,request){if(!psscContextMatches(request))return false;const before=view&&contextKey===request.key?view.phase:null;view={...result,rivalryId:ctx.setup.rivalryId,coordinatorRole:result.coordinatorRole||ctx.setup.setup.coordinatorRole};contextKey=request.key;readError="";readErrorKey="";psscRender();if(before&&before!=="ACKNOWLEDGED"&&view.phase==="ACKNOWLEDGED")psscNudgeHistory();if(view.phase==="ACKNOWLEDGED"){try{root.CareerModeFirestoreBudget?.noteSeasonDone?.(`${view.rivalryId}|${request.seasonNumber}`,Boolean(before&&before!=="ACKNOWLEDGED"),{role:ctx.setup.managerRole,season:request.seasonNumber,rivalryId:view.rivalryId,firestore:ctx.options?.firestore||null});}catch(_error){}}return true;}
126:   // r75: the moment this page sees the season commit become ACKNOWLEDGED, Canonical Scoring and then Shared History check
127:   // once, in that order (History needs the reconciled score), instead of each waiting for its next 3 s check: nothing else
128:   // announces the commit change to them. The next season, the history screens and Final Winner follow from History's event.
129:   function psscNudgeHistory(){if(typeof root.setTimeout!=="function"||root.document?.visibilityState==="hidden")return;root.setTimeout(()=>{void (async()=>{
130:     const scoring=root.CareerModeProductionSharedCanonicalScoring,history=root.CareerModeProductionSharedHistoryConvergence;
131:     try{if(scoring&&typeof scoring.refresh==="function"){let state=await scoring.refresh(true);if(state?.phase!=="SCORING_RECONCILED")state=await scoring.refresh(true);}}catch(_error){}
132:     try{if(history&&typeof history.refresh==="function"){const state=await history.refresh(true);if(state?.phase!=="HISTORY_CONVERGED")await history.refresh(true);}}catch(_error){}
133:   })();},0);}
134:   async function psscRefreshNow(request=psscRequestContext(),generation=0,light=false){
135:     if(!request)return null;
136:     if(contextKey&&contextKey!==request.key){psscSetError("");pendingErrorKind="";}
137:     const ctx=await psscProviderContext(request,light);if(!psscContextMatches(request))return null;const result=psscResultError(await provider.read(ctx.options),"The season could not be checked.");if(!psscContextMatches(request))return null;
138:     if(generation&&generation!==readGeneration)return null;
139:     if(pendingErrorKind&&psscSatisfied(pendingErrorKind,result)){psscSetError("");pendingErrorKind="";}
140:     psscBind(result,ctx,request);return view;
141:   }
142:   function psscRefresh(light=false){
143:     const request=psscRequestContext();if(!request)return Promise.resolve(null);
144:     // Job 33: an ACKNOWLEDGED commit is immutable (Rules cap it at revision 3), so later callers reuse it instead of re-reading it.
145:     if(view&&contextKey===request.key&&view.phase==="ACKNOWLEDGED"&&!refreshPromise)return Promise.resolve(view);
146:     if(refreshPromise&&refreshRequestKey===request.key)return refreshPromise;
147:     if(contextKey!==request.key){view=null;contextKey="";if(readErrorKey!==request.key){readError="";readErrorKey="";}}
148:     refreshRequestKey=request.key;
149:     const generation=++readGeneration;
150:     const current=psscQueue(()=>psscWithTimeout(psscRefreshNow(request,generation,light===true),psscReadTimeoutMs(),"SEASON_COMMIT_CHECK_TIMEOUT"));refreshPromise=current;psscRender();
151:     // Job 33: the check failure shows at once (CHECK AGAIN), but it is reported only when the same failure repeats on the
152:     // next poll, like Shared History and Multi Season; a single aborted read under contention is not an application error.
153:     current.then(()=>{heldReportKey="";if(refreshPromise===current){refreshPromise=null;psscRender();}},error=>{
154:       if(error?.code==="SEASON_COMMIT_CHECK_TIMEOUT"&&readGeneration===generation)readGeneration+=1;
155:       // Job 33: a failed fast (3 s) read keeps the current view and is retried by the next poll; the 15 s poll still reports a real failure.
156:       if(light===true&&refreshPromise===current&&view&&contextKey===request.key){refreshPromise=null;psscRender();return;}
157:       if(refreshPromise===current){refreshPromise=null;if(psscContextMatches(request)&&psscResultsPublished(request)&&!/_CONTEXT_STALE$/.test(String(error?.code||""))){const previous=readErrorKey===request.key?readError:"";view=null;contextKey="";readErrorKey=request.key;readError=String(error?.code||"SEASON_COMMIT_CHECK_FAILED").replace(/[^A-Za-z0-9_-]/g,"").slice(0,80);psscRender();const reportKey=request.key+"|"+readError;if(readError!==previous)heldReportKey=reportKey;else if(heldReportKey===reportKey){heldReportKey="";psscReport("Could not check the season",error);}}}
158:     });
159:     return current;
160:   }
161:   function psscSatisfied(kind,current){if(kind==="commit")return Boolean(current.committed);return Boolean(current.ownAcknowledged||current.phase==="ACKNOWLEDGED");}
162:   async function psscWrite(kind,ctx,request,current){
163:     const operationId=psscRandomOperationId(),method=kind==="commit"?"commitSeason":"acknowledgeSeason";
164:     if(kind==="commit"&&current.managerRole!==current.coordinatorRole)psscFail("SEASON_COMMIT_COORDINATOR_REQUIRED",`Only ${psscManagerName(current.coordinatorRole)} can lock the season.`);
165:     for(let attempt=0;attempt<2;attempt+=1){
166:       const baseRevision=Number(current.revision||0);
167:       const providerRequest={...ctx.options,operationId,baseRevision};
168:       const result=await conflictGuard.execute({surface:"season-commit",action:kind==="commit"?"commit-season":"acknowledge-season",operationId,baseRevision,authority:{accountId:ctx.options.user.uid,deviceId:ctx.setup.deviceId,rivalryId:ctx.setup.rivalryId,sessionId:ctx.setup.sessionId,managerRole:ctx.setup.managerRole},intent:{seasonNumber:request.seasonNumber}},()=>provider[method](providerRequest));
169:       if(result&&result.ok===true)return true;
170:       if(result?.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0){current=psscResultError(await provider.read(ctx.options));if(psscSatisfied(kind,current))return true;continue;}
171:       psscResultError(result,kind==="commit"?"The season could not be locked.":"Your season confirmation could not be saved.");
172:     }
173:     return false;
174:   }
175:   // r96 F3: the final season's own LOCK & CONFIRM / CONFIRM SEASON tap notes, before any write, that this phone is due its
176:   // Showdown Champion (the same storage note js/productionSharedMultiSeasonProgression.js writes once the season is accepted).
177:   // A tab killed right after the tap often died before that later note, so the reopened tab never looked for the Champion
178:   // screen and stayed on Home. The note only steers the reopened tab's resume (js/productionSharedJourneyEntry.js); it is
179:   // forgotten when the Champion screen is left or the Showdown was ended early. Final = the last season, or a sacking in it.
180:   function psscMarkChampionDueIfFinal(request){
181:     try{
182:       const total=Number(psscSetupState()?.setup?.totalSeasons),results=psscResultsState(),sacked=results?.ownResult?.sacked===true||results?.opponentResult?.sacked===true;
183:       if(request.seasonNumber!==total&&!sacked)return false;
184:       if(!/^pair_[0-9a-f]{64}$/.test(String(request.rivalryId||""))||typeof root.writeStorageValue!=="function")return false;
185:       if(root.readStorageValue?.("cms.championPending.v1")!==request.rivalryId)root.writeStorageValue("cms.championPending.v1",request.rivalryId);
186:       return true;
187:     }catch(_error){return false;}
188:   }
189:   async function psscMutate(kind){
190:     if(busy)return false;const request=psscRequestContext();if(!request)return false;psscMarkChampionDueIfFinal(request);busy=true;readGeneration+=1;psscSetError("");pendingErrorKind="";psscRender();
191:     let stage=kind;
192:     try{
193:       return await psscQueue(async()=>{
194:         const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return false;let current=psscResultError(await provider.read(ctx.options));
195:         if(!psscContextMatches(request))return false;
196:         if(!psscSatisfied(kind,current)){if(!await psscWrite(kind,ctx,request,current))return false;if(kind==="commit")stage="acknowledge";current=psscResultError(await provider.read(ctx.options));if(!psscContextMatches(request))return false;}
197:         psscBind(current,ctx,request);
198:         // One tap for the coordinator: COMMIT & ACKNOWLEDGE records his own acknowledgement right after the commit (each write keeps its own operationId and stale retry).
199:         // If this second half fails, the committed view shows the existing CONFIRM SEASON button (only this R7 case re-reads
200:         // at once; a manager's own ACKNOWLEDGE failure keeps its error until the next read, exactly as before).
201:         if(kind!=="commit"||current.managerRole!==current.coordinatorRole||psscSatisfied("acknowledge",current))return true;
202:         stage="acknowledge";
203:         if(!await psscWrite("acknowledge",ctx,request,current))return false;
204:         try{await psscRefreshNow(request);}catch(_error){psscRefresh().catch(()=>{});}return true;
205:       });
206:     }catch(error){if(psscContextMatches(request)){pendingErrorKind=stage;if(stage==="acknowledge"&&view&&contextKey===request.key&&!view.committed)view={...view,committed:true};psscSetError(error.message||error.code||"Confirming the season failed.");psscReport("Could not confirm the season",error);if(kind==="commit"&&stage==="acknowledge")void psscRefresh().catch(()=>{});}return false;}
207:     finally{busy=false;if(psscContextMatches(request))psscRender();}
208:   }
209:   function psscCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!psscSharedMarker())return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;const request=psscRequestContext();if(!request||contextKey!==request.key||!view||!psscResultsReady(request)){void psscRefresh().catch(()=>{});return;}void psscMutate(view.committed?"acknowledge":"commit");}
210:   // All three waiting screens share the same season authority; navigation does not end the partner wait.
211:   function psscWaitScreen(){return ["seasonEntry","mainMenu","standings"].some(id=>{const node=psscField(id);return node&&!node.classList.contains("hidden");});}
212:   // A Results/Commit listener alone cannot cover Setup, session, later commits or terminal authority.
213:   // These listeners live only for the wait, share its existing health/fallback cadence, and never poll.
214:   // A hidden page stops them (keep=true) and the same wait attaches them again when it returns (psscWaitReturn); their first
215:   // server delivery is the new baseline and answers the return check's reads of the same documents (one read each).
216:   // An ACKNOWLEDGED revision-3 commit can never change again (Rules), so the next attach leaves it out.
217:   // Fable job 3 F3-02: only the waited season's commit and the next one are watched. An earlier season is ACKNOWLEDGED before
218:   // this one starts, and a commit after the next cannot exist before the next is ACKNOWLEDGED, which needs this phone. Before,
219:   // a 10-season Showdown attached one listener per season on each new wait (measured on season 1: 58 billed to 42).
220:   // The season is part of the key, so a wait on the next season attaches its own pair.
221:   let waitContext=null,waitReturn=null;const waitSettled=new Set(),WAIT_PENDING_GRACE_MS=10000;
222:   function psscDropWaitContext(keep=false){const held=waitContext,budget=root.CareerModeFirestoreBudget;waitContext=null;if(keep===true&&held&&!held.failed)waitReturn={key:held.key,watching:held.watching};else if(keep!==true||held){waitReturn=null;budget?.returnListen?.([]);}if(!held)return;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();budget?.listened?.();}
223:   function psscWaitReturn(){const back=waitReturn,request=psscRequestContext();waitReturn=null;if(back&&request&&psscWaitScreen()&&!root.CareerModeFirestoreBudget?.paused?.())psscWaitContext(request,back.watching,back.key);else root.CareerModeFirestoreBudget?.returnListen?.([]);}
224:   function psscContextWake(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-wait-context-change"));}catch(_error){}}
225:   function psscWaitContext(request,watching,returnKey){
226:     const setup=psscSetupState(),runtime=root.CareerModeProductionFirebaseRuntime,budget=root.CareerModeFirestoreBudget;
227:     const key=`${request.rivalryId}|${setup?.accountId}|${setup?.deviceId}|${setup?.sessionId}|season_${request.seasonNumber}`;
228:     if(returnKey!==undefined&&returnKey!==key){budget?.returnListen?.([]);return false;}
229:     if(waitContext?.key===key){
230:       const held=waitContext;
231:       if(held.failed&&Date.now()>=held.retryAt)psscDropWaitContext();
232:       else if(watching!==held.watching){
233:         // One listener per document: the wait listener now watches this one, so its authority listener stops. A document
234:         // the wait listener stops watching gets its authority listener back (rebuild).
235:         const old=held.watching;held.watching=watching;
236:         if(held.paths?.includes(old)&&!waitSettled.has(old))psscDropWaitContext();
237:         else{const stop=held.stops.get(watching);held.stops.delete(watching);if(stop)try{stop();}catch(_error){}if(held.pending?.delete(watching))held.ready=!held.failed&&held.pending.size===0;return held.ready&&!held.failed;}
238:       }else return held.ready&&!held.failed;
239:     }
240:     if(waitContext)psscDropWaitContext();
241:     const held={key,watching,stops:new Map(),ready:false,failed:false,retryAt:0,returnUntil:returnKey===undefined?0:Date.now()+10000};waitContext=held;
242:     const fail=error=>{if(waitContext!==held)return;held.failed=true;held.ready=false;held.retryAt=Date.now()+60000;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();/* r86 red team #19: the context listeners take the rivalry and Session back while these wait to retry. */budget?.returnListen?.([]);budget?.listened?.();budget?.noteError?.(error);};
243:     Promise.resolve().then(async()=>{
244:       const services=await runtime?.ensureAccountServices?.();if(waitContext!==held)return;
245:       if(!services?.ok||!setup?.sessionId||services.auth?.currentUser?.uid!==setup.accountId)throw new Error("Waiting context is unresolved.");
246:       let sdk=services.firestoreSdk;
247:       if(typeof sdk?.onSnapshot!=="function"){
248:         const url=runtime?.firebaseFirestoreModule;
249:         if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))throw new Error("Waiting listener SDK is unavailable.");
250:         sdk=await import(url);
251:       }
252:       // r85: every delivery of these listeners is counted once by the budget layer's read meter.
253:       sdk=(budget?.meterSdk||(s=>s))(sdk);
254:       if(waitContext!==held)return;
255:       const base=`rivalries/${request.rivalryId}`,paths=[base,`${base}/sharedSetup/authoritative`,`${base}/sessions/${setup.sessionId}`];
256:       const total=Number(setup.setup?.totalSeasons);
257:       if([1,3,5,10].includes(total))for(let n=request.seasonNumber;n<=Math.min(total,request.seasonNumber+1);n++)paths.push(`${base}/seasonCommits/season_${n}`);
258:       held.paths=paths;
259:       const pending=held.pending=new Set(paths.filter(path=>path!==held.watching&&!waitSettled.has(path)));let queued=false,sessionChanged=false,dirty=false,notified=false;
260:       budget?.returnListen?.([...pending]);
261:       const wake=(changed=false)=>{dirty=dirty||changed;if(queued)return;queued=true;Promise.resolve().then(async()=>{queued=false;if(waitContext!==held||held.failed)return;if(dirty){dirty=false;root.CareerModeFirestoreBudget?.forgetContext?.();}if(sessionChanged){sessionChanged=false;try{await root.CareerModeSparkRemoteJoining?.refreshSession?.();}catch(_error){}}if(waitContext===held&&!held.failed)psscContextWake();});};
262:       for(const path of pending){
263:         let serial;
264:         const stop=sdk.onSnapshot(sdk.doc(services.firestore,path),{includeMetadataChanges:true},snapshot=>{
265:           if(waitContext!==held||held.failed)return;
266:           /* r86 red team #18: a cached copy (the SDK delivers one first on a return) no longer hands the waiting reads back to the server: they wait for this listener's server copy (the budget layer gives up after 5 s). */if(snapshot.metadata?.fromCache||snapshot.metadata?.hasPendingWrites){held.ready=false;pending.add(path);return;}
267:           const value=snapshot.exists()?snapshot.data():null,next=JSON.stringify(value),changed=serial!==undefined&&serial!==next;
268:           if(serial===undefined)budget?.listened?.(path,snapshot);
269:           if(/\/seasonCommits\/season_\d+$/.test(path)&&value?.phase==="ACKNOWLEDGED"&&value.revision===3)waitSettled.add(path);/* r86: a confirmed Setup (revision 6) never changes again either, and the budget layer keeps it. */if(/\/sharedSetup\/authoritative$/.test(path)&&value?.revision===6&&value?.phase==="SHOWDOWN_CONFIRMED")waitSettled.add(path);
270:           if(serial!==undefined&&changed&&(path===base||path===`${base}/sessions/${setup.sessionId}`))sessionChanged=true;
271:           serial=next;pending.delete(path);held.ready=pending.size===0;
272:           if(changed)wake(true);
273:           if(held.ready&&!notified){notified=true;wake();}
274:         },fail);
275:         if(held.failed)stop();else held.stops.set(path,stop);
276:       }
277:       held.ready=pending.size===0;
278:     }).catch(fail);
279:     return false;
280:   }
281:   // Fable job 3 F3-12: this phone's own write of the watched document leaves the same wait listener attached but not live
282:   // (pending writes, dirty) until the server's copy arrives. For up to WAIT_PENDING_GRACE_MS the authority listeners are kept
283:   // (the wait still reports not healthy, so every fallback check runs as before); a lost or replaced wait listener drops them at once.
284:   function psscWaitHealthy(){const request=psscRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();const waited=Boolean(request&&["seasonResults","seasonCommits"].some(collection=>live?.watching===`rivalries/${request.rivalryId}/${collection}/season_${request.seasonNumber}`));const healthy=Boolean(request&&root.document?.visibilityState!=="hidden"&&!root.CareerModeFirestoreBudget?.paused?.()&&live?.watchHealthy&&waited);if(!healthy){const hidden=root.document?.visibilityState==="hidden",now=Date.now(),held=waitContext,usable=Boolean(request&&!hidden&&!root.CareerModeFirestoreBudget?.paused?.());if(held&&usable&&waited&&held.watching===live.watching&&!held.failed&&!held.pendingSince)held.pendingSince=now;if(!(usable&&held&&(held.returnUntil>now||waited&&held.watching===live.watching&&!held.failed&&now-held.pendingSince<WAIT_PENDING_GRACE_MS)))psscDropWaitContext(hidden);return false;}if(waitContext)waitContext.pendingSince=0;return ![root.CareerModeProductionSharedMultiSeasonProgression,root.CareerModeProductionSharedFinalReconciliation,root.CareerModeProductionSharedJourneyReconnect,root.CareerModeProductionSharedTerminalClose].some(api=>api?.productionEnabled===true)||psscWaitContext(request,live.watching);}
285: 
286:   function psscWaitingKey(){
287:     const screen=psscField("seasonEntry"),request=psscRequestContext();if(!psscWaitScreen()||!view||!request||contextKey!==request.key||!psscResultsReady(request))return "";
288:     if(!view.committed&&view.managerRole!==view.coordinatorRole)return `${contextKey}|commit`;
289:     if(view.committed&&view.ownAcknowledged&&view.phase!=="ACKNOWLEDGED")return `${contextKey}|acknowledge`;
290:     return "";
291:   }
292:   function psscFastPollDue(){const key=psscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
293:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
294:   // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
295:   function psscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(psscWaitScreen()&&psscResultsReady()&&view?.phase!=="ACKNOWLEDGED"?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(psscRequestContext()):null);}catch(_error){path=null;}return budget.watchWaitPoint("season-commit",path,psscWaitWake);}
296:   function psscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void psscTick(true);};inflight.then(again,again);return;}if(!busy){void psscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void psscTick(true);},400);}
297:   function psscFastTick(){psscWatchWait();if(psscWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!psscFastPollDue())return;void psscTick(true);}
298:   // r75: the 15 s check of the visible Season Commit screen reads the shared commit from the server (see Transfer).
299:   // r84: no commit exists before both results are published, so the fresh read starts then (before, it ran every check of the
300:   // results wait: ~37 billed reads/min for both phones); a healthy listener on the commit replaces it.
301:   function psscScreenFresh(){try{const request=psscRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)&&psscResultsReady(request)){const path=`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
302:   async function psscTick(light=false){if(!psscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=psscField("seasonEntry");if(!psscWaitScreen())return;psscRender();if(view?.phase==="ACKNOWLEDGED"&&contextKey===psscRequestContext()?.key)return;if(light!==true)psscScreenFresh();try{await psscRefresh(light===true);}catch(_error){}}
303:   function psscAttachHeadingObserver(){
304:     if(!root.MutationObserver||!root.document)return false;const heading=psscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;
305:     headingObserver=new root.MutationObserver(()=>void psscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;
306:   }
307:   function psscInstallObservers(){if(psscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(psscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
308:   function psscInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-connected-account-state-change","career-mode-firestore-quota"])root.addEventListener?.(event,()=>psscDropWaitContext());root.addEventListener?.("career-mode-shared-wait-context-change",()=>void psscTick());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")psscDropWaitContext(true);else psscWaitReturn();});if(root.document)root.document.addEventListener("click",psscCapture,true);psscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void psscTick());if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!psscWaitHealthy())void psscTick();},POLL_MS);root.setInterval(psscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void psscTick(),0);return true;}
309: 
310:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-commit",productionEnabled:true,runtimeRevision:"1.9.1-r10",requiresResultsReady:true,requiresCoordinatorCommit:true,requiresBothAcknowledgements:true,coordinatorCommitAlsoAcknowledges:true,reusesSeasonReview:true,distinctFromLocalConfirm:true,boundedStaleRetry:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,waitingListenerHealthy:psscWaitHealthy,isWaitingForRival:()=>Boolean(psscWaitingKey()),install:psscInstall,refresh:psscRefresh,seasonResultClash:psscSeasonResultClash,getState:()=>view,isActive:psscSharedMarker});
311: });
312: 
```

## FILE: firestore.season-commit-production.fragment.rules (211 lines)
```
1: // SSJR_SEASON_COMMIT_FUNCTIONS_BEGIN
2:     function ssjrCommitValidOperationId(value) { return value is string && value.matches('^season_commit_op_[0-9a-f]{32}$'); }
3:     function ssjrCommitValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
4:     function ssjrCommitValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
5:     function ssjrCommitSeasonMatches(seasonId, seasonNumber) {
6:       return seasonNumber is int
7:         && seasonNumber >= 1
8:         && seasonNumber <= 10
9:         && seasonId == 'season_' + string(seasonNumber);
10:     }
11:     function ssjrCommitSetup(rivalryId) {
12:       return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
13:     }
14:     function ssjrCommitPublicResults(rivalryId, seasonId) {
15:       return get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
16:     }
17:     function ssjrCommitPrivateResult(rivalryId, seasonId, managerRole) {
18:       return get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole)).data;
19:     }
20:     // r80 Europa League: 'europaLeague' is present only when that manager won the EL, and then it is exactly true
21:     // (false is refused, so there is one encoding per fact and old 7-key results are unchanged). One manager's season
22:     // never has CL and EL both true. Nothing compares the two managers' results: both may win the same trophy.
23:     function ssjrCommitResultShape(value, teamCount) {
24:       return teamCount >= 2
25:         && value is map
26:         && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague','primePack','sacked'])
27:         && value.leaguePosition is int
28:         && value.leaguePosition >= 1
29:         && value.leaguePosition <= teamCount
30:         && value.leaguePoints is int
31:         && value.leaguePoints >= 0
32:         && value.leaguePoints <= (teamCount - 1) * 6
33:         && value.leagueGoals is int
34:         && value.leagueGoals >= 0
35:         && value.leagueGoals <= 300
36:         && value.domesticCup is bool
37:         && value.championsLeague is bool
38:         && value.topScorer is bool
39:         && value.topAssist is bool
40:         && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false))
41:         && (!('primePack' in value) || (value.primePack is int && value.primePack >= 1 && value.primePack <= 4))
42:         // r89 Sacked: present only when that manager was sacked this season, and then exactly true (one encoding).
43:         && (!('sacked' in value) || value.sacked == true);
44:     }
45:     function ssjrCommitExactKeys(root) {
46:       return root.keys().hasOnly([
47:         'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','phase','revision','resultsRevision','results',
48:         'acknowledgedRoles','operationIds','operationHashes','baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
49:       ]);
50:     }
51:     // Audit R84 F02 (r85): create and acknowledge both require the shared actor write authority (rivalry live and active
52:     // with the actor as a member, the named Session in this rivalry, state 'active' with both members, the acting account
53:     // active, the acting device registered to that account and active). It replaces ssjrEntitled here (same rivalry
54:     // document) to stay under the 1,000-expression ceiling. A Session still 'active' past its old expiresAt stays allowed:
55:     // ten-season play keeps one ACTIVE Session. The never-called ssjrCommitShape and its three helpers were removed.
56:     function ssjrCommitValidCreate(rivalryId, seasonId) {
57:       let after = request.resource.data;
58:       let setup = ssjrCommitSetup(rivalryId);
59:       let public = ssjrCommitPublicResults(rivalryId, seasonId);
60:       let p1 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerOne');
61:       let p2 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerTwo');
62:       let role = ssjrActorRole(rivalryId);
63:       return ssjrCommitExactKeys(after)
64:         && after.schemaVersion == 1
65:         && after.objectType == 'sharedSeasonCommit'
66:         && after.rivalryId == rivalryId
67:         && ssjrCommitSeasonMatches(seasonId, after.seasonNumber)
68:         && setup.schemaVersion == 1
69:         && setup.objectType == 'sharedSetupLedger'
70:         && setup.rivalryId == rivalryId
71:         && setup.revision == 6
72:         && setup.phase == 'SHOWDOWN_CONFIRMED'
73:         && after.seasonNumber <= setup.totalSeasons
74:         && public.schemaVersion == 1
75:         && public.objectType == 'sharedSeasonResults'
76:         && public.rivalryId == rivalryId
77:         && public.seasonNumber == after.seasonNumber
78:         && public.runtimeRevision == '1.9.1-r9'
79:         && public.phase == 'RESULTS_READY'
80:         && public.revision == 2
81:         && public.teamCount in [18,20]
82:         && after.runtimeRevision == '1.9.1-r10'
83:         && after.revision == 1
84:         && after.phase == 'COMMITTED'
85:         && after.resultsRevision == 2
86:         && after.results.keys().hasOnly(['playerOne','playerTwo'])
87:         && ssjrCommitResultShape(after.results.playerOne, public.teamCount)
88:         && ssjrCommitResultShape(after.results.playerTwo, public.teamCount)
89:         && after.results.playerOne == p1.result
90:         && after.results.playerTwo == p2.result
91:         && after.acknowledgedRoles == []
92:         && after.operationIds is list
93:         && after.operationIds.size() == 1
94:         && after.operationHashes is list
95:         && after.operationHashes.size() == 1
96:         && after.baseRevisions is list
97:         && after.baseRevisions.size() == 1
98:         && after.actorRoles is list
99:         && after.actorRoles.size() == 1
100:         && ssjrCommitValidOperationId(after.operationIds[0])
101:         && ssjrCommitValidHash(after.operationHashes[0])
102:         && after.baseRevisions[0] == 0
103:         && role == setup.coordinatorRole
104:         && after.actorRoles[0] == role
105:         && after.updatedAt == request.time
106:         && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
107:     }
108:     function ssjrCommitPrefixPreserved(before, after) {
109:       let i = before.revision;
110:       return after.operationIds == before.operationIds.concat([after.operationIds[i]])
111:         && after.operationHashes == before.operationHashes.concat([after.operationHashes[i]])
112:         && after.baseRevisions == before.baseRevisions.concat([after.baseRevisions[i]])
113:         && after.actorRoles == before.actorRoles.concat([after.actorRoles[i]])
114:         && after.acknowledgedRoles == before.acknowledgedRoles.concat([after.acknowledgedRoles[i - 1]]);
115:     }
116:     function ssjrCommitValidUpdate(rivalryId, seasonId) {
117:       let before = resource.data;
118:       let after = request.resource.data;
119:       let role = ssjrActorRole(rivalryId);
120:       let i = before.revision;
121:       return ssjrCommitExactKeys(after)
122:         && before.schemaVersion == 1
123:         && before.objectType == 'sharedSeasonCommit'
124:         && before.rivalryId == rivalryId
125:         && before.runtimeRevision == '1.9.1-r10'
126:         && before.phase == 'COMMITTED'
127:         && before.revision >= 1
128:         && before.revision <= 2
129:         && after.schemaVersion == 1
130:         && after.objectType == 'sharedSeasonCommit'
131:         && after.rivalryId == rivalryId
132:         && after.runtimeRevision == '1.9.1-r10'
133:         && after.seasonNumber == before.seasonNumber
134:         && ssjrCommitSeasonMatches(seasonId, after.seasonNumber)
135:         && after.resultsRevision == before.resultsRevision
136:         && after.results == before.results
137:         && after.revision == before.revision + 1
138:         && ((after.revision < 3 && after.phase == 'COMMITTED') || (after.revision == 3 && after.phase == 'ACKNOWLEDGED'))
139:         && after.operationIds is list
140:         && after.operationIds.size() == after.revision
141:         && after.operationHashes is list
142:         && after.operationHashes.size() == after.revision
143:         && after.baseRevisions is list
144:         && after.baseRevisions.size() == after.revision
145:         && after.actorRoles is list
146:         && after.actorRoles.size() == after.revision
147:         && after.acknowledgedRoles is list
148:         && after.acknowledgedRoles.size() == after.revision - 1
149:         && ssjrCommitPrefixPreserved(before, after)
150:         && !(role in before.acknowledgedRoles)
151:         && ssjrCommitValidOperationId(after.operationIds[i])
152:         && after.operationIds[i] != before.operationIds[0]
153:         && (i < 2 || after.operationIds[i] != before.operationIds[1])
154:         && ssjrCommitValidHash(after.operationHashes[i])
155:         && after.baseRevisions[i] == before.revision
156:         && after.actorRoles[i] == role
157:         && after.acknowledgedRoles[i - 1] == role
158:         && after.acknowledgedRoles.toSet().size() == after.acknowledgedRoles.size()
159:         && after.acknowledgedRoles.toSet().hasOnly(['playerOne','playerTwo'])
160:         && after.updatedAt == request.time
161:         && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
162:     }
163:     // R87 shared reads meter (B2): each phone keeps ONE small document per rivalry, rivalries/{rid}/meters/{its role}, with the
164:     // Firebase reads it was billed today (documents + Rules lookups), written once a season when it sees the season commit
165:     // ACKNOWLEDGED; the partner phone reads it once, so both phones show the same "both phones" total and seasons left.
166:     // Members of the live paired rivalry only (one lookup: the rivalry, the same as every shared read), each phone writes only
167:     // its own role's document, exact keys, bounded whole numbers (at most three season costs), no list and no delete.
168:     // A phone on an older build never writes it; nothing else reads it.
169:     function ssjrMeterCount(value, max) { return value is int && value >= 0 && value <= max; }
170:     function ssjrMeterCost(costs, index) { return costs.size() <= index || (costs[index] is int && costs[index] > 0 && costs[index] <= 100000); }
171:     function ssjrMeterValidWrite(rivalryId, managerRole) {
172:       let meter = request.resource.data;
173:       return ssjrEntitled(rivalryId)
174:         && managerRole in ['playerOne', 'playerTwo']
175:         && ssjrRivalryData(rivalryId).managerSlots[managerRole == 'playerOne' ? 0 : 1].accountId == request.auth.uid
176:         && meter.keys().hasAll(['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'])
177:         && meter.keys().hasOnly(['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'])
178:         && meter.schemaVersion == 1
179:         && meter.objectType == 'readsMeter'
180:         && meter.rivalryId == rivalryId
181:         && meter.role == managerRole
182:         && meter.day is string
183:         && meter.day.matches('^20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')
184:         && meter.season is int
185:         && meter.season >= 1
186:         && meter.season <= 10
187:         && ssjrMeterCount(meter.game, 1000000)
188:         && ssjrMeterCount(meter.career, 1000000)
189:         && meter.costs is list
190:         && meter.costs.size() <= 3
191:         && ssjrMeterCost(meter.costs, 0)
192:         && ssjrMeterCost(meter.costs, 1)
193:         && ssjrMeterCost(meter.costs, 2)
194:         && meter.updatedAt == request.time;
195:     }
196: // SSJR_SEASON_COMMIT_FUNCTIONS_END
197: 
198: // SSJR_SEASON_COMMIT_MATCH_BEGIN
199:       match /seasonCommits/{seasonId} {
200:         allow get: if ssjrEntitled(rivalryId);
201:         allow list, delete: if false;
202:         allow create: if ssjrCommitValidCreate(rivalryId, seasonId);
203:         allow update: if ssjrCommitValidUpdate(rivalryId, seasonId);
204:       }
205:       match /meters/{managerRole} {
206:         allow get: if ssjrEntitled(rivalryId);
207:         allow list, delete: if false;
208:         allow create, update: if ssjrMeterValidWrite(rivalryId, managerRole);
209:       }
210: // SSJR_SEASON_COMMIT_MATCH_END
211: 
```

## FILE: js/productionSharedLocalReconciliation.js (141 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedLocalReconciliation=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7:   const POLL_MS=15000,PANEL_ID="sharedLocalReconciliationPanel",ACTION_ID="sharedLocalReconciliationPreview";
8:   // BH-8: once the last season is committed each phone runs the same read-only observe/preview by itself, at most once per poll (never Apply).
9:   const AUTO_GAP_MS=POLL_MS-1000;
10:   let installed=false,state=null,unsubscribe=null,timer=null,uiBusy=false,uiError="",uiContextKey="",previewInFlight=null,autoLastAt=-Infinity;
11:   function lrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
12:   function lrSharedActive(){const s=lrShowdown();return Boolean(s&&s.sharedJourney&&s.sharedJourney.mode==="shared");}
13:   function lrOnline(){return !(root.navigator&&root.navigator.onLine===false);}
14:   function lrProtocol(){return root.CareerModeSharedLocalReconciliation||null;}
15:   function lrHistory(){try{return root.CareerModeProductionSharedHistoryConvergence?.getState?.()||null;}catch(_error){return null;}}
16:   function lrConnected(){return root.CareerModeSparkConnectedRivalry||null;}
17:   function lrField(id){return root.document&&root.document.getElementById(id);}
18:   function lrText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
19:   function lrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
20:   function lrHistoryReady(){const history=lrHistory();return Boolean(history&&history.authoritative===true&&history.phase==="HISTORY_CONVERGED");}
21:   function lrEnsureUi(){
22:     if(!root.document)return null;const review=lrField("seasonReviewPanel");if(!review)return null;
23:     let panel=lrField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedLocalReconciliationPanel hidden";review.appendChild(panel);}
24:     const ensure=(id,tag,className="")=>{let node=lrField(id);if(!node){node=root.document.createElement(tag);node.id=id;if(className)node.className=className;panel.appendChild(node);}return node;};
25:     const heading=ensure("sharedLocalReconciliationHeading","h3"),summary=ensure("sharedLocalReconciliationSummary","p"),status=ensure("sharedLocalReconciliationStatus","p","stateNote"),actions=ensure("sharedLocalReconciliationActions","div","seasonReviewActions");
26:     status.setAttribute("role","status");status.setAttribute("aria-live","polite");
27:     let preview=lrField(ACTION_ID);if(!preview){preview=root.document.createElement("button");preview.id=ACTION_ID;preview.className="menuButton";preview.type="button";preview.addEventListener("click",()=>{void lrPreviewFromUi();});actions.appendChild(preview);}
28:     return {panel,heading,summary,status,actions,preview};
29:   }
30:   function lrReason(reason){return ({["history-not-authoritative"]:"Waiting for the season history to load.",["connected-rivalry-not-exact"]:"Checking your saved Showdown.",["remote-not-observed"]:lrMultiTerminal()?"Last season saved. The final result appears here by itself.":"Waiting for your rival's result. It appears here by itself.",["offline-preview-only"]:"Offline: you can check the last shared result already loaded.",["offline-no-observed-remote"]:"Offline: no shared result has been loaded yet."})[reason]||"Getting the save check ready.";}
31:   function lrRender(){
32:     const ui=lrEnsureUi();if(!ui)return false;const visible=Boolean(lrSharedActive()&&lrHistoryReady()&&state);lrHidden(ui.panel,!visible);if(!visible)return false;
33:     lrText(ui.heading,"SAVE CHECK");
34:     lrText(ui.summary,"Optional: check that your saved Showdown matches the shared result. Nothing is changed.");
35:     const ready=state.phase==="PREVIEW_READY",applied=state.phase==="APPLIED";
36:     const message=uiError||(ready?"CHECK READY ✓ · NOTHING WAS CHANGED":applied?"ALREADY UP TO DATE":state.phase==="OFFLINE_FALLBACK"&&state.previewAllowed?"OFFLINE · YOU CAN CHECK, NOT SAVE":lrReason(state.reason));
37:     lrText(ui.status,message);
38:     lrHidden(ui.preview,ready||applied);ui.preview.disabled=uiBusy;lrText(ui.preview,uiBusy?"CHECKING…":"CHECK MY SAVE");
39:     return true;
40:   }
41:   function lrDispatch(){lrRender();try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-local-reconciliation-state-change",{detail:state}));}catch(_error){}return state;}
42:   function lrContextKey(){const showdown=lrShowdown(),binding=state?.binding;return [showdown?.id||"",showdown?.sharedJourney?.rivalryId||"",binding?.saveId||"",binding?.profileId||"",binding?.managerRole||""].join("|");}
43:   function lrRefresh(){
44:     const p=lrProtocol();if(!p||typeof p.project!=="function"){state=null;return null;}
45:     let c=null;try{c=lrConnected()?.getState?.()||null;}catch(_error){}
46:     state=p.project({sharedActive:lrSharedActive(),history:lrHistory(),connected:c,online:lrOnline()});
47:     const nextContextKey=lrContextKey();
48:     if(nextContextKey!==uiContextKey||state.phase==="PREVIEW_READY"||state.phase==="APPLIED")uiError="";
49:     uiContextKey=nextContextKey;
50:     return lrDispatch();
51:   }
52:   async function lrEnsureConnected(){
53:     if(!lrConnected()&&typeof root.loadRuntimeScript==="function")await root.loadRuntimeScript("spark-connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry);
54:     const api=lrConnected();
55:     if(!api||typeof api.getState!=="function"||typeof api.previewLocalReconciliation!=="function"||typeof api.applyLocalReconciliation!=="function")throw Object.assign(new Error("Connected Rivalry reconciliation authority is unavailable."),{code:"LOCAL_RECONCILIATION_AUTHORITY_UNAVAILABLE"});
56:     if(typeof api.initialize==="function")await api.initialize();
57:     return api;
58:   }
59:   function lrMultiTerminal(){try{const m=root.CareerModeProductionSharedMultiSeasonProgression?.getState?.()||null;return Boolean(m&&m.ok===true&&m.authoritative===true&&m.phase==="SHOWDOWN_COMPLETE"&&m.state&&m.state.terminal===true);}catch(_error){return false;}}
60:   async function lrObserveRemote(api,before){
61:     // Online Preview always re-reads (a cached snapshot is only the offline fallback); publish through the existing Connected Rivalry authority only when the read proves no snapshot and the Showdown is terminal.
62:     if(!before||!(before.phase==="WAITING_REMOTE"||before.phase==="REMOTE_OBSERVED")||!before.binding||!lrOnline())return before;
63:     if(typeof api.refreshAttachedSharedState!=="function")return before;
64:     await api.refreshAttachedSharedState(before.binding);
65:     const read=api.getState?.()||null;
66:     if(!read||!(read.status==="refreshed"||read.status==="tombstoned"))return null;
67:     // Faster season hand-offs (job 33) can leave Multi Season one poll behind here; refresh it before the terminal check.
68:     if(read.status==="refreshed"&&read.observedExists===false&&read.observedTombstone!==true&&!lrMultiTerminal()){try{await root.CareerModeProductionSharedMultiSeasonProgression?.refresh?.();}catch(_error){}}
69:     if(read.status==="refreshed"&&read.observedExists===false&&read.observedTombstone!==true&&lrMultiTerminal()&&typeof api.publishAttachedSharedState==="function"){
70:       await api.publishAttachedSharedState(before.binding);
71:       await api.refreshAttachedSharedState(before.binding);
72:     }
73:     return lrRefresh();
74:   }
75:   async function lrPreview(){
76:     const api=await lrEnsureConnected();let before=lrRefresh();
77:     const observed=await lrObserveRemote(api,before);if(observed===null)return {ok:false,code:"LOCAL_RECONCILIATION_REMOTE_READ_FAILED",state:lrRefresh()};before=observed;
78:     if(!before||before.previewAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_BLOCKED",state:before};
79:     const acceptance=root.CareerModeSSJRPhysicalJourneyAcceptance;
80:     const acceptanceEnabled=Boolean(acceptance&&acceptance.enabled===true&&typeof acceptance.captureLocalReconciliationBaseline==="function"&&typeof acceptance.verifyLocalReconciliationPreview==="function");
81:     let proofArmed=false;
82:     if(acceptanceEnabled)proofArmed=await acceptance.captureLocalReconciliationBaseline();
83:     try{await api.previewLocalReconciliation(before.binding);}
84:     finally{if(proofArmed)await acceptance.verifyLocalReconciliationPreview();}
85:     const after=lrRefresh();
86:     if(!after||!(after.phase==="PREVIEW_READY"||after.phase==="OFFLINE_FALLBACK"))return {ok:false,code:"LOCAL_RECONCILIATION_PREVIEW_FAILED",state:after};
87:     return {ok:true,state:after};
88:   }
89:   function lrPreviewOnce(){
90:     // Single flight: a manual tap during an automatic check shares the same observe/preview instead of starting a second one.
91:     if(previewInFlight)return previewInFlight;
92:     const current=Promise.resolve().then(lrPreview).finally(()=>{if(previewInFlight===current)previewInFlight=null;});
93:     previewInFlight=current;return current;
94:   }
95:   function lrClosed(){
96:     try{if(root.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="CLOSED")return true;}catch(_error){}
97:     try{if(lrConnected()?.getState?.()?.observedTombstone===true)return true;}catch(_error){}
98:     return false;
99:   }
100:   function lrAutoEligible(){
101:     if(!state||!lrSharedActive()||!lrOnline()||!lrHistoryReady()||!lrMultiTerminal()||lrClosed())return false;
102:     if(root.document&&root.document.visibilityState==="hidden")return false;
103:     return state.phase==="WAITING_REMOTE"||state.phase==="REMOTE_OBSERVED"||(state.phase==="BLOCKED"&&state.reason==="connected-rivalry-not-exact");
104:   }
105:   function lrAutoCheck(){
106:     // Only after Multi Season is authoritatively SHOWDOWN_COMPLETE; stops at PREVIEW_READY/APPLIED or CLOSED. Not woken by Connected Rivalry
107:     // state changes (its own writes), so it cannot loop; throttled to the poll cadence so it never crowds other modules' reads and publishes.
108:     if(previewInFlight||uiBusy||!lrAutoEligible())return null;
109:     const now=Date.now();if(now-autoLastAt<AUTO_GAP_MS)return null;autoLastAt=now;
110:     // Quiet: a transient failure leaves the status as is and is retried on the next poll.
111:     return lrPreviewOnce().catch(()=>null);
112:   }
113:   function lrPoll(){lrRefresh();lrAutoCheck();}
114:   async function lrPreviewFromUi(){
115:     if(uiBusy)return false;uiBusy=true;uiError="";lrRender();
116:     try{const result=await lrPreviewOnce();if(!result||result.ok!==true){uiError=`PREVIEW NOT READY · ${result?.code||"TRY AGAIN WHEN THE CONNECTION IS BACK"}`;return false;}return true;}
117:     catch(error){uiError=`PREVIEW FAILED · ${error?.code||error?.message||"TRY AGAIN"}`;return false;}
118:     finally{uiBusy=false;lrRender();}
119:   }
120:   async function lrApply({confirmed=false}={}){
121:     if(confirmed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_CONFIRMATION_REQUIRED",state:lrRefresh()};
122:     if(!lrOnline())return {ok:false,code:"LOCAL_RECONCILIATION_OFFLINE_APPLY_DENIED",state:lrRefresh()};
123:     const api=await lrEnsureConnected();const before=lrRefresh();
124:     if(!before||before.phase!=="PREVIEW_READY"||before.applyAllowed!==true)return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_BLOCKED",state:before};
125:     await api.applyLocalReconciliation(before.binding);
126:     const after=lrRefresh();
127:     if(!after||after.phase!=="APPLIED")return {ok:false,code:"LOCAL_RECONCILIATION_APPLY_FAILED",state:after};
128:     return {ok:true,state:after};
129:   }
130:   function lrInstall(){
131:     if(installed){lrRender();return true;}installed=true;if(root.document)lrEnsureUi();
132:     const c=lrConnected();if(c&&typeof c.subscribe==="function")unsubscribe=c.subscribe(lrRefresh);
133:     root.addEventListener?.("online",lrRefresh);root.addEventListener?.("offline",lrRefresh);
134:     for(const event of ["career-mode-shared-history-convergence-state-change","career-mode-shared-season-cursor-change","career-mode-showdown-state-change"])root.addEventListener?.(event,lrRefresh);
135:     for(const event of ["career-mode-shared-multi-season-state-change","career-mode-shared-history-convergence-state-change","career-mode-showdown-state-change","online"])root.addEventListener?.(event,lrAutoCheck);
136:     if(typeof root.setInterval==="function")timer=root.setInterval(lrPoll,POLL_MS);
137:     lrPoll();return true;
138:   }
139:   return Object.freeze({contractVersion:2,feature:"ssjr-production-shared-local-reconciliation",productionEnabled:true,runtimeRevision:"1.9.1-r20",pollIntervalMs:POLL_MS,autoFinalCheck:true,autoCheckMinGapMs:AUTO_GAP_MS,autoCheck:lrAutoCheck,install:lrInstall,refresh:lrRefresh,preview:lrPreviewOnce,previewFromUi:lrPreviewFromUi,apply:lrApply,getState:()=>state,isActive:lrSharedActive,canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,acceptanceStorageProofScope:"local-reconciliation-preview"});
140: });
141: 
```

(End of packet FJ6. Answer with the report only.)
