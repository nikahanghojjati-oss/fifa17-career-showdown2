# Fable 5.2 red-team job FJ2: Transfer War: shared window, timers, closing once

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
Then one block per finding: ID (FJ2-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Does the 15-minute window open, run and close on the server clock so both phones agree, including a phone whose own clock is wrong and one that joins late?
2. Can the window close twice, never close, or close for one phone only? Cover expiry racing with a manager's last signing.
3. After a reload or reconnect at any moment of the window, does the phone land in the right phase with nothing lost or doubled?
4. Can a Rules refusal (permission-denied) in normal play leave a phone stuck with no way forward?
5. Is any Transfer War state shown to one manager that reveals the other's private signings before the game reveals them?

## Known (do not report)
A phone on an older version is refused a newer Showdown until it opens Home (by design).

## Files

## FILE: js/productionSharedTransferChallenge.js (1087 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedTransferChallenge=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   // Job 33 (R1): while this manager waits on the rival, read every 3 s for at most 3 minutes, then the normal 15 s.
10:   const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
11:   const TIMER_MS=1000;
12:   const EXPIRY_RETRY_MS=30000,EXPIRY_MAX_ATTEMPTS=3;
13:   const CLOCK_REFRESH_MS=5*60*1000;
14:   const CONTROL_IDS=Object.freeze(["seasonPrimaryAction","startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"]);
15:   const PHASE_PROGRESS=Object.freeze({NOT_STARTED:"window",WINDOW_OPEN:"window",GUESS_ENTRY:"guess_entry",SIGNING_ENTRY:"signing_entry",COMPLETED:"completed"});
16:   const REPLAY_PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
17:   // r87 (Nik 2026-10-30): each signing's FIFA 17 position, chosen by his own manager and never guessed (roulette boards).
18:   const SIGNING_POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
19:   let installed=false,busy=false,provider=null,setupApi=null,careerApi=null,view=null,pollTimer=null,timerLoop=null,openedKey="",expiryAttemptRevision=-1,expiryAttemptAt=0,providerChain=Promise.resolve(),refreshPromise=null,refreshContextKey="",viewContextKey="",replayContextKey="",replayQueue=[],openPromise=null;
20:   let expiryAttemptContextKey="",expiryAttemptCount=0,expiryPermissionDenied=false,expiryNeedsAuthority=false,refreshExpiryRequest=null;
21:   let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;
22:   const witnessedByContext=new Map();
23:   let fastWaitKey="",fastWaitSince=0;
24:   // The reason the roulette could not start on this phone (shown on the dashboard and on Career Start), or "" (Fable F2-05).
25:   let rouletteError="",primePackLoadError=false;
26:   const PSTC_PRIME_PACK_TEXT="Prime Pack could not load. Check the connection and tap again.";
27:   const PSTC_ROULETTE_TEXT=Object.freeze({
28:     load:"The roulette could not load. Check the connection and tap again.",
29:     setup:"The roulette needs this Showdown's confirmed Setup, and it could not be read just now. Tap again.",
30:     draw:"The Special Player list could not load, so the Transfer War stays shut. Tap again to retry.",
31:     error:"The roulette hit an error before it could start. Nothing was spun or saved. Tap again to retry.",
32:     // r88 Chamber Men: the roulette's cylinders come from this season's shootout, so the roulette never runs without it.
33:     chamberLoad:"Chamber Men could not load. Check the connection and tap again. Every pick already sent is kept.",
34:     chamberCylinders:"This season's Chamber Men result could not be read, and the roulette's bullets come from it. Nothing was spun. Tap again to retry.",
35:     // r91 Squad Management: the roulette's boards are the two locked squads, so it never runs without them.
36:     squadLoad:"Squad Management could not load. Check the connection and tap again. A squad already locked is kept.",
37:     squadBoards:"The two locked squads could not be read for the roulette board. Nothing was spun. Tap again to retry."
38:   });
39:   // r88 Chamber Men (js/chamberMenStep.js): the request whose shootout is finished on this phone and its two cylinders, for
40:   // the roulette ({key, season, chambers}); null until then. (Every Showdown plays the step.)
41:   let chamberGate=null;
42:   // r91 Squad Management (js/squadSheetStep.js): this season's two locked "pre" squads for the roulette's boards
43:   // ({key, season, sheets}); null until both are locked.
44:   let squadGate=null;
45:   // r87 RT5-FLOW-02 (Nik 2026-10-31): the shared window waits until both managers have spun this season's roulette. The gate is
46:   // known where the roulette runs (pstcRouletteFirst): does the roulette apply to this Showdown (its confirm time is readable)? spinPendingKey: this manager has spun (or his roulette is done on this browser) and his own mark is not on the
47:   // server yet; the next check writes it again until it lands.
48:   // rouletteClearedKey (Codex P1 #1101): the request whose roulette this phone has finished, or that the roulette does not apply to
49:   // on this phone (no confirm time, decide() false). Only then may his own mark be written; a partner's mark never counts.
50:   let rouletteGate={key:"",applies:false},spinPendingKey="",spinRefusedKey="",spinWriting=null,rouletteClearedKey="";
51: 
52:   function pstcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
53:   function pstcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
54:   function pstcSharedMarker(){const showdown=pstcShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
55:   function pstcReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
56:   function pstcText(id,value){const node=root.document&&root.document.getElementById(id);if(node)node.textContent=String(value??"");return node;}
57:   function pstcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
58:   function pstcDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
59:   function pstcLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
60:   async function pstcEnsureDependencies(){
61:     if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
62:     else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
63:     await pstcLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
64:     await pstcLoadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
65:     await pstcLoadScript("ssjr-transfer-protocol","js/sharedTransferChallenge.js",()=>root.CareerModeSharedTransferChallenge);
66:     await pstcLoadScript("ssjr-transfer-provider","js/sparkSharedTransferChallenge.js",()=>root.CareerModeSparkSharedTransferChallenge);
67:     await pstcLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
68:     setupApi=root.CareerModeProductionSharedShowdownSetup;careerApi=root.CareerModeProductionSharedCareerStart;provider=root.CareerModeSparkSharedTransferChallenge;
69:     if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pstcFail("TRANSFER_SETUP_UNAVAILABLE");
70:     if(!careerApi||typeof careerApi.refresh!=="function"||typeof careerApi.getState!=="function")pstcFail("TRANSFER_CAREER_START_UNAVAILABLE");
71:     if(!provider||typeof provider.read!=="function"||typeof provider.startWindow!=="function"||typeof provider.requestEndWindow!=="function"||typeof provider.advanceExpiredWindow!=="function"||typeof provider.lockGuesses!=="function"||typeof provider.lockSignings!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
72:   }
73:   // A restored local shell may have no rivalry id. Shared Setup has already verified it before entry resumes;
74:   // use that snapshot while this module's dependencies are still cold so the first refresh can bind its request.
75:   function pstcSetupState(){try{return setupApi?.getState?.()||root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
76:   function pstcCareerReady(){try{const career=careerApi?.getState?.();return Boolean(career&&career.state&&career.state.phase==="CAREER_START_READY"&&career.state.revision===2);}catch(_error){return false;}}
77:   function pstcConfirmedShared(){const state=pstcSetupState();return Boolean(pstcSharedMarker()&&state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
78:   function pstcSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pstcShowdown()?.currentRound,season=Number(pstcSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pstcFail("TRANSFER_SEASON_INVALID");return season;}
79:   function pstcLocalContextKey(){const showdown=pstcShowdown(),id=String(showdown?.id||showdown?.saveId||"").trim();let season;try{season=pstcSeason();}catch(_error){return "";}return id&&Number.isInteger(season)&&season>0?`${id}:${season}`:"";}
80:   function pstcBoundContextKey(rivalryId,season,localContextKey=pstcLocalContextKey()){const local=String(localContextKey||"").trim(),remote=String(rivalryId||"").trim(),round=Number(season);return local&&remote&&Number.isInteger(round)&&round>0?`${local}|${remote}:${round}`:"";}
81:   function pstcCurrentContextKey(){const showdown=pstcShowdown(),setup=pstcSetupState(),rivalry=showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"";let season;try{season=pstcSeason();}catch(_error){return "";}return pstcBoundContextKey(rivalry,season);}
82:   function pstcRequestContext(){const showdown=pstcShowdown(),localKey=pstcLocalContextKey(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=pstcSeason();}catch(_error){return null;}const key=pstcBoundContextKey(rivalryId,seasonNumber,localKey);return key?Object.freeze({key,localKey,rivalryId,seasonNumber}):null;}
83:   function pstcRequestMatches(request,ctx=null){if(!request||pstcCurrentContextKey()!==request.key)return false;if(!ctx)return true;return String(ctx.state?.rivalryId||"").trim()===request.rivalryId&&Number(ctx.options?.seasonNumber)===request.seasonNumber;}
84:   function pstcBindView(result,ctx,request){if(!pstcRequestMatches(request,ctx))return false;view={...result,setup:ctx.state.setup,rivalryId:ctx.state.rivalryId};viewContextKey=request.key;if(view.state?.phase==="COMPLETED"&&view.verdicts){pstcKeepVerdicts(request.rivalryId,request.seasonNumber,view.verdicts);pstcSavedClear(request.key);}if(!view.state&&view.spinMarks)pstcKeepMarks(request.rivalryId,request.seasonNumber,view.spinMarks);return true;}
85:   function pstcResetExpiryAttempts(){expiryAttemptContextKey="";expiryAttemptRevision=-1;expiryAttemptAt=0;expiryAttemptCount=0;expiryPermissionDenied=false;}
86:   function pstcExpiryPaused(){return root.document?.visibilityState==="hidden"||expiryNeedsAuthority;}
87:   function pstcExpiryPermissionRefused(error,request){if(["permission-denied","firestore/permission-denied","permission_denied"].includes(error?.code)&&pstcRequestMatches(request)&&view?.state?.phase==="WINDOW_OPEN"){expiryAttemptContextKey=request.key;expiryAttemptRevision=Number(view.revision);expiryPermissionDenied=true;}}
88:   function pstcClearClock(){clockContextKey="";clockServerEpochMs=0;clockPerformanceMs=0;clockRefreshPerformanceMs=0;}
89:   function pstcClearCachedContext(){view=null;viewContextKey="";openedKey="";replayContextKey="";replayQueue=[];pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcClearClock();}
90:   function pstcMonotonicNow(){const value=Number(root.performance&&typeof root.performance.now==="function"?root.performance.now():Number.NaN);if(!Number.isFinite(value)||value<0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","A steady clock is not available here, and the Transfer War needs one.");return value;}
91:   function pstcClockReady(request){return Boolean(request&&clockContextKey===request.key&&Number.isFinite(clockServerEpochMs)&&clockServerEpochMs>0&&Number.isFinite(clockPerformanceMs));}
92:   function pstcAuthoritativeNow(request=pstcRequestContext()){if(!pstcClockReady(request))pstcFail("TRANSFER_CLOCK_UNAVAILABLE","The Transfer War has no server time yet. Try again in a moment.");return Math.floor(clockServerEpochMs+Math.max(0,pstcMonotonicNow()-clockPerformanceMs));}
93:   async function pstcEnsureServerClock(user,request){
94:     if(!request||!pstcRequestMatches(request))return false;
95:     const monotonicNow=pstcMonotonicNow();
96:     if(pstcClockReady(request)&&Number.isFinite(clockRefreshPerformanceMs)&&monotonicNow-clockRefreshPerformanceMs<CLOCK_REFRESH_MS)return true;
97:     if(!user||typeof user.getIdTokenResult!=="function")pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Server time is not available right now.");
98:     const requestPerformanceMs=pstcMonotonicNow();
99:     const token=await user.getIdTokenResult(true);
100:     if(!pstcRequestMatches(request))return false;
101:     const issuedAtEpochMs=Date.parse(String(token?.issuedAtTime||""));
102:     if(!Number.isFinite(issuedAtEpochMs)||issuedAtEpochMs<=0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","The server sent a time the game cannot use.");
103:     const receiptPerformanceMs=pstcMonotonicNow();
104:     clockContextKey=request.key;
105:     clockServerEpochMs=issuedAtEpochMs+(issuedAtEpochMs%1000===0?500:0);
106:     clockPerformanceMs=(requestPerformanceMs+receiptPerformanceMs)/2;
107:     clockRefreshPerformanceMs=receiptPerformanceMs;
108:     return true;
109:   }
110:   function pstcCanRoute(){const request=pstcRequestContext();return Boolean(request&&view&&viewContextKey===request.key&&pstcRequestMatches(request)&&pstcConfirmedShared()&&pstcCareerReady()&&String(view.rivalryId||"")===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber);}
111:   // Browser-only viewing hints. Provider state still owns the phase, private inputs and every action.
112:   function pstcViewingStorageKey(){const request=pstcRequestContext(),role=view?.managerRole;return request&&viewContextKey===request.key&&role?`cms.transferViews.v1:${request.rivalryId}:${request.seasonNumber}:${role}`:"";}
113:   function pstcWitnessSet(key){
114:     const scope=`${key}|${view?.managerRole||""}`;
115:     if(!witnessedByContext.has(scope)){
116:       let saved=null;try{const storageKey=pstcViewingStorageKey();if(storageKey)saved=JSON.parse(root.readStorageValue?.(storageKey)||"null");}catch(_error){}
117:       witnessedByContext.set(scope,new Set(Array.isArray(saved)?saved.filter(phase=>REPLAY_PHASES.includes(phase)||phase==="RESULTS_VIEWED"):[]));
118:     }
119:     return witnessedByContext.get(scope);
120:   }
121:   function pstcCanResumeResults(){return Boolean(pstcCanRoute()&&view.state?.phase==="COMPLETED"&&!pstcReplayPhase()&&REPLAY_PHASES.every(phase=>pstcWitnessSet(viewContextKey).has(phase))&&pstcWitnessSet(viewContextKey).has("RESULTS_VIEWED"));}
122:   // r93 O1 (HUNT_AREAS_1_2, Nik's pick 2026-11-15): this phone has not shown this manager the completed Transfer War yet (a
123:   // reload or app reopen right after the lock that completed it, or a tab away when the rival locked). Its dashboard then
124:   // offers VIEW TRANSFER VERDICTS first, and the Season Results route takes the button only once the verdicts were on screen.
125:   // The same browser-only viewing hint as the replay (pstcMarkWitness): no read, no write, nothing shared with the rival.
126:   function pstcVerdictsUnseen(){return Boolean(pstcCanRoute()&&view.state?.phase==="COMPLETED"&&!pstcWitnessSet(viewContextKey).has("COMPLETED"));}
127:   // Seeing completed verdicts does not mean Results was opened. Keep that navigation hint separate so a
128:   // reload before the Results tap still follows the normal season dashboard / transfer recovery route.
129:   function pstcRememberResultsView(){
130:     if(!pstcCanRoute()||view.state?.phase!=="COMPLETED"||pstcReplayPhase())return false;
131:     const witnessed=pstcWitnessSet(viewContextKey);if(!REPLAY_PHASES.every(phase=>witnessed.has(phase)))return false;
132:     if(witnessed.has("RESULTS_VIEWED"))return true;witnessed.add("RESULTS_VIEWED");
133:     try{const key=pstcViewingStorageKey();if(key)root.writeStorageValue?.(key,JSON.stringify([...witnessed]));}catch(_error){}
134:     return true;
135:   }
136:   function pstcTransferScreenVisible(){const screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(screen&&!screen.classList.contains("hidden"));}
137:   function pstcReplayPhase(key=viewContextKey){return replayContextKey===key&&replayQueue.length?replayQueue[0]:null;}
138:   function pstcPrepareReplay(){
139:     const key=viewContextKey,actual=view?.state?.phase;
140:     if(!key||!REPLAY_PHASES.includes(actual)){replayContextKey="";replayQueue=[];return false;}
141:     if(replayContextKey===key&&replayQueue.length)return true;
142:     const actualIndex=REPLAY_PHASES.indexOf(actual),witnessed=pstcWitnessSet(key),missing=REPLAY_PHASES.slice(0,actualIndex).filter(phase=>!witnessed.has(phase));
143:     replayContextKey=missing.length?key:"";replayQueue=missing;return missing.length>0;
144:   }
145:   function pstcMarkWitness(key,phase){
146:     if(!key||!REPLAY_PHASES.includes(phase)||!pstcTransferScreenVisible())return;
147:     const witnessed=pstcWitnessSet(key);if(witnessed.has(phase))return;witnessed.add(phase);
148:     try{const storageKey=pstcViewingStorageKey();if(storageKey)root.writeStorageValue?.(storageKey,JSON.stringify([...witnessed]));}catch(_error){}
149:   }
150:   function pstcAdvanceReplay(){if(!pstcReplayPhase())return false;replayQueue.shift();if(!replayQueue.length){replayContextKey="";pstcPrepareReplay();}pstcRender();return true;}
151:   function pstcRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pstcFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `transfer_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
152:   // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and Career Start instead of re-reading them.
153:   async function pstcProviderOptions(request=pstcRequestContext(),light=false,expiryOnly=false){
154:     if(!pstcSharedMarker())pstcFail("TRANSFER_SHARED_MODE_REQUIRED");
155:     if(!request||!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
156:     await pstcEnsureDependencies();
157:     if(expiryOnly&&pstcExpiryPaused())return null;
158:     const reuse=light===true&&pstcConfirmedShared()&&pstcCareerReady();
159:     if(!reuse)await setupApi.refresh();
160:     if(expiryOnly&&pstcExpiryPaused())return null;
161:     if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
162:     const state=setupApi.getState();
163:     if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)pstcFail("TRANSFER_SETUP_NOT_CONFIRMED","Both managers must finish setup before the Transfer War.");
164:     if(!reuse)await careerApi.refresh();
165:     if(expiryOnly&&pstcExpiryPaused())return null;
166:     if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
167:     const career=careerApi.getState();
168:     if(!career||!career.state||career.state.phase!=="CAREER_START_READY"||career.state.revision!==2)pstcFail("TRANSFER_CAREER_START_NOT_READY","Both managers must finish Career Start before the Transfer War.");
169:     const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
170:     if(expiryOnly&&pstcExpiryPaused())return null;
171:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE","The online service is unavailable.");
172:     if(!await pstcEnsureServerClock(services.auth.currentUser,request))pstcFail("TRANSFER_CONTEXT_STALE");
173:     if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
174:     return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:pstcAuthoritativeNow(request)}};
175:   }
176:   function pstcResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Transfer War request was rejected.");error.code=result&&result.code||"TRANSFER_PROVIDER_FAILED";error.providerResult=true;throw error;}
177:   function pstcQueueProvider(task){const queued=providerChain.then(task,task);providerChain=queued.catch(()=>{});return queued;}
178:   async function pstcRefreshNow(request=pstcRequestContext(),light=false,expiryOnly=false){
179:     if(!request)return null;
180:     const ctx=await pstcProviderOptions(request,light,expiryOnly);if(!ctx||!pstcRequestMatches(request,ctx)||(expiryOnly&&pstcExpiryPaused()))return null;
181:     const result=pstcResultError(await provider.read(ctx.options),"The Transfer War could not load.");if(!pstcRequestMatches(request,ctx))return null;
182:     if(!pstcBindView(result,ctx,request))return null;if(pstcTransferScreenVisible())pstcPrepareReplay();pstcSetError("");pstcRender();pstcDecorateDashboard();return view;
183:   }
184:   // Routine polls and concurrent-expiry reconciliation must not replenish the automatic retry budget. A poll that lands while
185:   // a wake refresh failed still counts as the fresh authority that wake was waiting for, so expiry cannot stay paused forever.
186:   function pstcRefresh(light=false,rearmExpiry=true){
187:     const request=pstcRequestContext();if(!request)return Promise.resolve(null);
188:     if(viewContextKey&&viewContextKey!==request.key)pstcClearCachedContext();
189:     if(rearmExpiry)expiryNeedsAuthority=true;
190:     if(refreshPromise&&refreshContextKey===request.key){refreshExpiryRequest.rearm=refreshExpiryRequest.rearm||rearmExpiry;return refreshPromise;}
191:     const expiryRefresh={rearm:rearmExpiry};refreshExpiryRequest=expiryRefresh;
192:     const current=pstcQueueProvider(async()=>{
193:       const fresh=await pstcRefreshNow(request,light===true);
194:       if(fresh&&pstcRequestMatches(request)&&(expiryRefresh.rearm||expiryNeedsAuthority)){pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcRender();}
195:       return fresh;
196:     });
197:     refreshPromise=current;refreshContextKey=request.key;
198:     const clear=()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";refreshExpiryRequest=null;}};
199:     current.then(clear,clear);return current;
200:   }
201:   // Job 21: when both managers tap at once the loser's write is rejected by the Rules (permission-denied) or by the provider
202:   // (stale revision / phase already moved). Re-read once; if the refreshed state already shows the outcome, finish silently,
203:   // otherwise retry the same method once with a fresh revision and operation id. A real denial surfaces after that one retry.
204:   const PSTC_RACE_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied","TRANSFER_STALE_BASE_REVISION","TRANSFER_PHASE_INVALID","TRANSFER_END_ALREADY_REQUESTED","TRANSFER_ALREADY_STARTED","TRANSFER_GUESSES_ALREADY_LOCKED","TRANSFER_SIGNINGS_ALREADY_LOCKED"]);
205:   function pstcOutcomeShown(method,fresh){
206:     const state=fresh&&fresh.state,role=fresh&&fresh.managerRole;if(!state)return false;
207:     if(method==="startWindow")return state.phase!=="NOT_STARTED";
208:     if(method==="requestEndWindow")return state.phase!=="WINDOW_OPEN"||Boolean(state.endRequestedRoles?.includes(role));
209:     if(method==="advanceExpiredWindow")return state.phase!=="WINDOW_OPEN";
210:     if(method==="lockGuesses")return state.phase!=="GUESS_ENTRY"||Boolean(state.guessLockedRoles?.includes(role));
211:     if(method==="lockSignings")return state.phase==="COMPLETED"||Boolean(state.signingLockedRoles?.includes(role));
212:     return false;
213:   }
214:   // BUG-3: the provider rejects a signing name over 80 characters with only a code, so the inputs are capped to the same limit and the known codes read as plain sentences.
215:   const SIGNING_NAME_MAX=80;
216:   // Red team R87-B-05: a dropped connection or an expired session reads as what to do next, never as a raw code.
217:   const PSTC_CONNECTION_TEXT="That step did not confirm. Check the connection, tap REFRESH to see if it saved, then try again if it did not.";
218:   const PSTC_SESSION_TEXT="Your Showdown session expired. Go back to Showdown Home and open the Showdown again. Nothing saved is lost.";
219:   // R93-07 (hunt T2-1): a write the Rules refuse again after the one retry is not an expired session (the read just before it
220:   // worked), so the screen says what happened and what to do, never "session expired".
221:   const PSTC_REFUSED_TEXT="This step was refused twice, so nothing was saved. Tap REFRESH, check what you entered and try again.";
222:   function pstcRepeatedRefusal(error){const refused=new Error(PSTC_REFUSED_TEXT);refused.code=String(error?.code||"permission-denied");refused.repeatedRefusal=true;refused.cause=error;return refused;}
223:   const PLAIN_PROVIDER_CODES=Object.freeze({TRANSFER_ROULETTE_PENDING:"Both managers spin the roulette before the Transfer War opens.",TRANSFER_SIGNINGS_INVALID:"Check each signing: a player name (80 characters at most), a previous league and a nationality.",TRANSFER_GUESSES_INVALID:"Check each guess: choose a FIFA 17 league or nationality."});
224:   function pstcCapSigningNames(){if(!root.document)return;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const input=pstcField(`${prefix}Signing${i}Name`);if(input&&typeof input.setAttribute==="function")input.setAttribute("maxlength",String(SIGNING_NAME_MAX));}}
225:   function pstcErrorText(error,fallback){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;if(error&&error.repeatedRefusal===true)return PSTC_REFUSED_TEXT;const code=String(error?.code||""),message=String(error?.message||"");if(error&&error.plain===true&&message)return message;if(error&&error.providerResult!==true&&message&&message!==code&&!/\b\w+(?:[-_/]\w+)+\b|[(){}]|undefined|null/.test(message))return message;if(PLAIN_PROVIDER_CODES[code])return PLAIN_PROVIDER_CODES[code];if(/unavailable|deadline|offline|network|aborted/i.test(code))return PSTC_CONNECTION_TEXT;if(/permission/i.test(code))return PSTC_SESSION_TEXT;/* r87: never a raw code on screen */return fallback;}
226:   async function pstcMutate(method,payload={}){
227:     const request=pstcRequestContext();if(!request||busy||pstcReplayPhase()||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;busy=true;pstcSetError("");pstcRender();
228:     try{
229:       return await pstcQueueProvider(async()=>{
230:         for(let attempt=0;;attempt+=1){
231:           if(!pstcRequestMatches(request)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
232:           const ctx=await pstcProviderOptions(request,false,method==="advanceExpiredWindow");if(!ctx||!pstcRequestMatches(request,ctx)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
233:           const current=pstcResultError(await provider.read(ctx.options),"The Transfer War did not refresh. Try again.");if(!pstcRequestMatches(request,ctx))return false;
234:           if(method==="advanceExpiredWindow"&&pstcExpiryPaused())return false;
235:           if(attempt>0&&pstcOutcomeShown(method,current)){if(pstcBindView(current,ctx,request)){pstcSetError("");if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}return true;}
236:           const options={...ctx.options,nowEpochMs:pstcAuthoritativeNow(request),operationId:pstcRandomOperationId(),baseRevision:Number(current.revision||0),...payload};
237:           let result;
238:           try{result=pstcResultError(await provider[method](options),"The Transfer War update was rejected.");}
239:           catch(error){
240:             if(attempt>0&&/permission/i.test(String(error&&error.code||"")))throw pstcRepeatedRefusal(error);
241:             if(!PSTC_RACE_CODES.includes(error&&error.code)||attempt>0)throw error;
242:             if(method==="advanceExpiredWindow"){try{if(!pstcExpiryPaused())await pstcRefreshNow(request,false,true);}catch(_refreshError){}pstcExpiryPermissionRefused(error,request);return true;}
243:             continue;
244:           }
245:           if(!pstcRequestMatches(request,ctx))return true;
246:           // F2-08 (Fable job 2): the write result carries the public state only. Keep this manager's own inputs (the read at the
247:           // top plus what was just locked) so the sealed rows stay on screen, and the rival's as last read.
248:           if(!pstcBindView(pstcLockedView(result,current,method,payload),ctx,request))return true;if(method==="lockSignings")pstcClearSigningDraft(view.managerRole);if(method==="lockGuesses")pstcClearGuessDraft(view.managerRole);pstcSetError("");
249:           if(result.needsRefresh||result.state?.phase==="COMPLETED"){
250:             // F2-08: the lock is saved. A failed follow-up read is not an error and never shows an empty verdict screen or "did
251:             // it save?": the screen says saved, loading verdicts, and reads again by itself.
252:             if(method==="lockSignings"||method==="lockGuesses")pstcSavedPending(request);
253:             try{await pstcRefreshNow(request);}catch(_error){if(pstcSavedPendingFor(request)){pstcRender();pstcDecorateDashboard();pstcSavedRetry(request);}else throw _error;}
254:           }else{if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}
255:           return true;
256:         }
257:       });
258:     }catch(error){if(method==="advanceExpiredWindow")pstcExpiryPermissionRefused(error,request);if(pstcRequestMatches(request)){pstcSetError(pstcErrorText(error,"The Transfer War did not update. Try again."));pstcReport("Could not update the Transfer War",error);}return false;}
259:     finally{busy=false;if(pstcRequestMatches(request))pstcRender();}
260:   }
261:   // ---- F2-08: a lock that is saved while its verdicts are still loading ----
262:   let savedPendingKey="",savedRetryTimer=null,savedRetryCount=0;
263:   const SAVED_RETRY_MS=Object.freeze([1500,4000,8000,15000]);
264:   function pstcLockedView(result,current,method,payload){
265:     const own=current&&current.ownInputs?{guesses:current.ownInputs.guesses??null,signings:current.ownInputs.signings??null}:{guesses:null,signings:null};
266:     if(method==="lockGuesses"&&Array.isArray(payload?.guesses))own.guesses=JSON.parse(JSON.stringify(payload.guesses));
267:     if(method==="lockSignings"&&Array.isArray(payload?.signings))own.signings=JSON.parse(JSON.stringify(payload.signings));
268:     return {...result,ownInputs:own,opponentInputs:current?.opponentInputs||null,verdicts:null,spinMarks:null,spunRoles:null};
269:   }
270:   function pstcSavedPending(request){savedPendingKey=request.key;savedRetryCount=0;}
271:   function pstcSavedPendingFor(request){return Boolean(request&&savedPendingKey===request.key&&view&&viewContextKey===request.key&&!view.verdicts);}
272:   function pstcSavedClear(key){if(!key||savedPendingKey===key){savedPendingKey="";savedRetryCount=0;if(savedRetryTimer){root.clearTimeout?.(savedRetryTimer);savedRetryTimer=null;}}}
273:   function pstcSavedRetry(request){
274:     if(savedRetryTimer||typeof root.setTimeout!=="function")return;
275:     const wait=SAVED_RETRY_MS[Math.min(savedRetryCount,SAVED_RETRY_MS.length-1)];savedRetryCount+=1;
276:     savedRetryTimer=root.setTimeout(()=>{savedRetryTimer=null;if(!pstcSavedPendingFor(request)||!pstcRequestMatches(request))return;
277:       pstcRefresh(false,false).then(fresh=>{if(!fresh&&pstcSavedPendingFor(request))pstcSavedRetry(request);},()=>{if(pstcSavedPendingFor(request))pstcSavedRetry(request);});},wait);
278:   }
279:   function pstcSetError(message=""){const node=root.document&&root.document.getElementById("transferChallengeError");if(node)node.textContent=String(message||"");}
280:   function pstcRolePrefix(role){return role==="playerOne"?"p1":"p2";}
281:   function pstcGuessPrefix(role){return role==="playerOne"?"p2":"p1";}
282:   function pstcManagerName(role){const showdown=pstcShowdown();return showdown?.managers?.[role]|| (role==="playerOne"?"Manager 1":"Manager 2");}
283:   function pstcClubName(role){const showdown=pstcShowdown();return showdown?.clubs?.[role]||view?.setup?.clubs?.[role]||"Club";}
284:   function pstcCardFor(id,selector){const node=root.document&&root.document.getElementById(id);return node&&node.closest?node.closest(selector):null;}
285:   function pstcOwnGuessCard(role){return pstcCardFor(`${pstcGuessPrefix(role)}Guess1Type`,".transferGuessCard");}
286:   function pstcOtherGuessCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnGuessCard(other);}
287:   function pstcOwnSigningCard(role){return pstcCardFor(`${pstcRolePrefix(role)}Signing1Name`,".transferManagerCard");}
288:   function pstcOtherSigningCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnSigningCard(other);}
289:   function pstcField(id){return root.document&&root.document.getElementById(id);}
290:   function pstcSetSelector(input,kind,id){if(!input)return;if(typeof root.setTransferSelectorValue==="function")root.setTransferSelectorValue(input,kind,id||"");else input.value=String(id||"");}
291:   function pstcCanonical(input){return typeof root.getTransferSelectorCanonicalValue==="function"?root.getTransferSelectorCanonicalValue(input):String(input?.dataset?.canonicalId||"");}
292:   function pstcClearRole(role){
293:     const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);
294:     for(let i=1;i<=3;i+=1){
295:       const name=pstcField(`${signing}Signing${i}Name`),overall=pstcField(`${signing}Signing${i}Overall`),position=pstcField(`${signing}Signing${i}Position`),league=pstcField(`${signing}Signing${i}League`),nationality=pstcField(`${signing}Signing${i}Nationality`),type=pstcField(`${guess}Guess${i}Type`),value=pstcField(`${guess}Guess${i}Value`);
296:       if(name){name.value="";delete name.dataset.playerId;}if(overall)overall.value="";if(position)position.value="";pstcSetSelector(league,"league","");pstcSetSelector(nationality,"nationality","");if(type)type.value="";if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.disabled=true;}
297:     }
298:   }
299:   function pstcResetForContext(key,role){const guessRef=pstcGuessDraftRef(role);if(guessDraftRef&&guessRef&&!pstcSameGuessDraftRef(guessDraftRef,guessRef))pstcRemoveGuessDraft(guessDraftRef);if(guessRef)guessDraftRef=guessRef;const draftKey=pstcSigningDraftKey(role);if(signingDraftKey&&draftKey&&signingDraftKey!==draftKey)pstcRemoveSigningDraft(signingDraftKey);if(draftKey)signingDraftKey=draftKey;if(openedKey===key)return;openedKey=key;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`);if(name&&typeof name.setAttribute==="function")name.setAttribute("maxlength","80");}pstcResetExpiryAttempts();pstcClearRole("playerOne");pstcClearRole("playerTwo");pstcSetError("");}
300:   const PSTC_MAX_ROWS=3;
301:   // r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
302:   // It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
303:   function pstcAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
304:   // A lock cannot be undone, so a partly filled form asks first. Cancel (or any confirm failure) means do nothing; no confirm box at all means lock as before.
305:   async function pstcConfirmPartialLock(filled,noun){
306:     if(filled>=PSTC_MAX_ROWS)return true;
307:     return (await pstcAskConfirm(`Lock ${filled} of ${PSTC_MAX_ROWS} ${noun}? You cannot change them after locking.`,"primary"))!==false;
308:   }
309:   function pstcBuildGuesses(role){
310:     const prefix=pstcGuessPrefix(role),rows=[];
311:     for(let i=1;i<=3;i+=1){const type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`),kind=String(type?.value||""),id=pstcCanonical(value),display=String(value?.value||"").trim();if(!kind&&!display)continue;if((kind!=="league"&&kind!=="nationality")||!display||!id)pstcFail("TRANSFER_GUESSES_INVALID",`Complete guess ${i} with a FIFA 17 league or nationality.`);rows.push({slot:i,type:kind,valueId:id});}
312:     return rows;
313:   }
314:   // Red team R87-SP-02 (Rule Book cards 03 and 06): the manager's own Special Player is a free extra signing that a rival's
315:   // guess can never release, so he is refused as one of the three Transfer War signings. Asked of the season step (which
316:   // loaded the draw before the window opened), with the Setup confirm time this page already holds: no read, nothing in
317:   // any protocol document. Without them (older Showdown, draw not loaded) nothing is refused.
318:   function pstcIsOwnSpecial(role,name){
319:     try{const step=root.CareerModeRosterRouletteStep,request=pstcRequestContext(),setup=pstcSetupState(),at=setup?.setupUpdatedAtMs;
320:       return Boolean(step&&typeof step.isOwnSpecial==="function"&&request&&Number.isFinite(at)&&step.isOwnSpecial(request.rivalryId,at,role,name,setup?.setup?.clubs));}
321:     catch(_error){return false;}
322:   }
323:   // Hunt C3 (2.4.0): the rival's Special Player is never on any squad board either (#1173, R87-C-01: js/squadSheet.js keeps
324:   // both draws out of both squads), so LOCK refuses him too instead of letting him be scored and then vanish from the
325:   // Squad screen. The same draw both phones hold: no read, nothing stored.
326:   const pstcOtherRole=role=>role==="playerOne"?"playerTwo":"playerOne";
327:   function pstcIsRivalSpecial(role,name){return (role==="playerOne"||role==="playerTwo")&&pstcIsOwnSpecial(pstcOtherRole(role),name);}
328:   function pstcRivalSpecialText(role,name){return `${name} is ${pstcManagerName(pstcOtherRole(role))}'s Special Player. He cannot join your squad.`;}
329:   // r88 LOCK refusals (Nik 2026-11-03): LOCK refuses every signing the squad engine (js/squadSheet.js barred) keeps out of
330:   // this manager's later squads because of the Transfer War or the roulette, so a refusal is exactly an engine bar:
331:   //  - guessed: his own signing the rival guessed in an earlier season (release:true). Only that manager: the rival may sign him,
332:   //    and a club player with the same name is not blocked (the engine's guess exclusion is the signing's only).
333:   //  - shot: anyone the roulette shot on this manager's board in any season up to this one, club player or signing.
334:   // R92-01 (Nik 2026-11-13 19:26 UTC, "Yes, check the exact player"): the man is matched by his SoFIFA playerId first, the
335:   // folded name (rrKey) only when an id is missing on either side. A guessed row with an id bars that id; a shot signing bars
336:   // the ids of every kept signing of his name this manager had before that season (the board names a signing by name only).
337:   // A shot club player, or any row of the name without an id, bars the whole name too, as before. So the man himself is
338:   // refused under any spelling, and a different man who only shares the name may come in.
339:   // Pure: earlier[k] = {playerOne, playerTwo} verdict rows of season k (1..season-1); hits[k] = {playerOne, playerTwo} saved
340:   // spin outcomes (or null) of season k (1..season), as the engine replays them. Returns Map nameKey -> {name,
341:   // reason:"shot"|"guessed", season, ids, whole}: ids = the barred playerIds (sorted, under any name), whole = the whole name
342:   // is barred too. Shot wins the reason when both apply (the engine's own order); ids join and are never forgotten.
343:   function pstcNameKey(name){return String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();}
344:   const pstcPlayerId=value=>Number.isInteger(value)&&value>=1&&value<=999999?value:null;
345:   function pstcSavedShot(hits,k,role){const h=hits&&hits[k]&&hits[k][role];if(!h||typeof h!=="object"||h.fired!==true||typeof h.hitName!=="string"||!h.hitName.trim()||!Number.isInteger(h.hitSlot)||h.hitSlot<0||h.hitSlot>14)return null;const signing=Number.isInteger(h.hitSignedSeason)&&h.hitSignedSeason>=1&&h.hitSignedSeason<=10;return {name:h.hitName.trim(),signing,window:signing?h.hitSignedSeason:null};}
346:   // A shot signing's bar: the ids of this manager's kept signings named key in seasons 1..last, and the whole name when one
347:   // of them has no id (or none is found).
348:   // R96 (Nik 2026-11-17, item 6): only the man the roulette shot. The hit names him by name and window, so when every kept row
349:   // of the name has an id and the rows of that window name one man, only his id is barred: a namesake kept in another window
350:   // can be signed again. Two men of the name in that window: every kept id of the name, as before. The squad engine reads
351:   // the same rows the same way (js/squadSheet.js shotBar).
352:   function pstcSignedIds(earlier,last,role,key,window){
353:     const ids=[],inWindow=new Set();let found=false,whole=false;
354:     for(let j=1;j<=last;j+=1){const rows=Array.isArray(earlier)&&earlier[j]&&earlier[j][role];if(Array.isArray(rows))for(const row of rows){if(!row||row.release===true||typeof row.name!=="string"||pstcNameKey(row.name)!==key)continue;found=true;const id=pstcPlayerId(row.playerId);if(id===null)whole=true;else ids.push(id);if(j===window)inWindow.add(id);}}
355:     if(whole||!found)return {ids,whole:true};
356:     return inWindow.size===1&&!inWindow.has(null)?{ids:[...inWindow],whole:false}:{ids,whole:false};
357:   }
358:   function pstcRouletteBlocked(earlier,hits,season,role){
359:     const out=new Map();if((role!=="playerOne"&&role!=="playerTwo")||!Number.isInteger(season)||season<1)return out;
360:     const bars=new Map();
361:     const bar=(name,reason,k,{ids,whole})=>{const key=pstcNameKey(name);if(!key)return;const was=bars.get(key)||{name,reason,season:k,ids:new Set(),whole:false};
362:       for(const id of ids)was.ids.add(id);was.whole=was.whole||whole;bars.set(key,was);};
363:     for(let k=1;k<=season;k+=1){const shot=pstcSavedShot(hits,k,role);if(shot)bar(shot.name,"shot",k,shot.signing?pstcSignedIds(earlier,k-1,role,pstcNameKey(shot.name),shot.window):{ids:[],whole:true});}
364:     for(let k=1;k<season;k+=1){const rows=Array.isArray(earlier)&&earlier[k]&&earlier[k][role];if(Array.isArray(rows))for(const row of rows){const name=row&&row.release===true&&typeof row.name==="string"?row.name.trim():"";if(name){const id=pstcPlayerId(row.playerId);bar(name,"guessed",k,id===null?{ids:[],whole:true}:{ids:[id],whole:false});}}}
365:     for(const [key,b] of bars)out.set(key,Object.freeze({name:b.name,reason:b.reason,season:b.season,ids:Object.freeze([...b.ids].sort((x,y)=>x-y)),whole:b.whole}));
366:     return out;
367:   }
368:   // The bar a signing (name, optional playerId) meets, or null: an id barred under any name first, then his name when it is
369:   // barred as a whole or he has no id. The squad engine asks the same question (js/squadSheet.js barFor).
370:   function pstcBlockedFor(map,name,playerId){
371:     if(!(map instanceof Map))return null;const id=pstcPlayerId(playerId),key=pstcNameKey(name);
372:     if(id!==null)for(const entry of map.values())if(Array.isArray(entry.ids)&&entry.ids.includes(id))return entry;
373:     const entry=key?map.get(key):null;
374:     return entry&&(entry.whole!==false||id===null)?entry:null;
375:   }
376:   // The data for it, from this phone first: the verdicts and saved spins the roulette kept here, and this manager's own outcome
377:   // of this season's spin. A phone that never ran this Showdown's roulette (a fresh browser after the window opened) reads what
378:   // it misses with the roulette's own plain gets (pstcRouletteVerdicts; for this season the spin record only) and keeps it, so
379:   // the next LOCK reads nothing. A Showdown from before Roster Roulette refuses nothing and reads nothing.
380:   const PSTC_BLOCKED_CHECK_TEXT="Your signings could not be checked against the roulette. Check the connection and tap LOCK again.";
381:   let blockedMemo=null;
382:   async function pstcCurrentHits(request,role){
383:     const kept=pstcKeptHits(request.rivalryId,request.seasonNumber);if(kept)return kept;
384:     const own=pstcPendingOutcome(request,role);if(own)return {[role]:own};
385:     if(typeof provider?.readRouletteSeason!=="function")pstcFail("TRANSFER_ROULETTE_CHECK_FAILED",PSTC_BLOCKED_CHECK_TEXT);
386:     const result=await provider.readRouletteSeason({...await pstcRouletteServices(),rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,managerRole:role,verdicts:false});
387:     if(!result||result.ok!==true)pstcFail("TRANSFER_ROULETTE_CHECK_FAILED",PSTC_BLOCKED_CHECK_TEXT);
388:     return pstcKeepHits(request.rivalryId,request.seasonNumber,result.hits);
389:   }
390:   async function pstcLoadBlocked(request,role){
391:     const earlier=[null],hits=[null];
392:     const results=await Promise.all(Array.from({length:request.seasonNumber-1},(_,i)=>pstcRouletteVerdicts(request,i+1)));
393:     for(const result of results){if(!result||result.ok!==true)pstcFail("TRANSFER_ROULETTE_CHECK_FAILED",PSTC_BLOCKED_CHECK_TEXT);earlier.push(result.verdicts);hits.push(result.hits||null);}
394:     hits[request.seasonNumber]=await pstcCurrentHits(request,role);
395:     return pstcRouletteBlocked(earlier,hits,request.seasonNumber,role);
396:   }
397:   function pstcBlockedNow(request=pstcRequestContext(),role=view?.managerRole){
398:     // r91 cut fix: every Showdown with a readable confirm time plays the roulette (step 2 removed the provider's old
399:     // rouletteFromMs boundary, which left this check always empty, so LOCK let a shot or guessed player be signed again).
400:     const at=pstcSetupState()?.setupUpdatedAtMs;
401:     if(!request||!role||!Number.isInteger(request.seasonNumber)||!Number.isFinite(at)||!provider?.rouletteEligible?.(at))return Promise.resolve(new Map());
402:     const key=`${request.key}|${role}`;if(blockedMemo&&blockedMemo.key===key)return blockedMemo.run;
403:     const run=pstcLoadBlocked(request,role);blockedMemo={key,run};
404:     run.catch(()=>{if(blockedMemo&&blockedMemo.run===run)blockedMemo=null;});
405:     return run;
406:   }
407:   // r91 (2.4.0) Transfer War name autocomplete (js/playerSearch.js + the "player" kind of js/transferSelector.js).
408:   // - The list file is fetched at idle once the Transfer War screen shows, never on Home, and no screen waits on it.
409:   // - A pick fills POS (his first FIFA position) and nationality in every season, and OVR and previous league in season 1
410:   //   only: ratings and clubs move in every save from season 2 (Nik 2026-11-11 00:07 UTC). Every field stays editable.
411:   // - The list marks a player LOCK would refuse (guessed before, shot, own Special Player) with LOCK's own words. It asks
412:   //   only what this page already holds: the blocked map once LOCK's check has run here (warmed on the first name-box focus,
413:   //   the same reads LOCK would make, memoised so LOCK then reads nothing). LOCK stays the authority either way.
414:   // - The SoFIFA id of a picked player rides on the box, in this phone's draft and, from the r91 Rules deploy, on the locked
415:   //   signing row as the optional playerId (1..999999). A typed name, or a picked name edited afterwards, has none.
416:   let playerListAsked=false,blockedSeen=null;
417:   function pstcWarmPlayerList(){
418:     if(playerListAsked||!pstcTransferScreenVisible()||typeof root.ensureTransferPlayerList!=="function")return;playerListAsked=true;root.ensureTransferPlayerList(null);
419:   }
420:   function pstcEnhancePlayerNames(role,enabled){
421:     if(typeof root.enhanceTransferSelector!=="function")return;const prefix=pstcRolePrefix(role);
422:     for(let i=1;i<=3;i+=1){const input=pstcField(`${prefix}Signing${i}Name`);if(!input)continue;if(enabled)root.enhanceTransferSelector(input,"player");}
423:   }
424:   function pstcPlayerSlot(input){const match=/^(p1|p2)Signing([1-3])Name$/.exec(input?.id||"");return match?{prefix:match[1],slot:Number(match[2]),role:match[1]==="p1"?"playerOne":"playerTwo"}:null;}
425:   function pstcBlockedText(role,name,playerId){
426:     const out=blockedSeen&&blockedSeen.key===`${pstcRequestContext()?.key}|${role}`?pstcBlockedFor(blockedSeen.map,name,playerId):null;
427:     if(out)return out.reason==="shot"?`${name} was shot in the roulette. He cannot come back.`:`${name} was guessed by ${pstcManagerName(role==="playerOne"?"playerTwo":"playerOne")}. You cannot sign him again.`;
428:     if(pstcIsOwnSpecial(role,name))return `${name} is your Special Player. He is a free extra signing, so do not enter him here.`;
429:     if(pstcIsRivalSpecial(role,name))return pstcRivalSpecialText(role,name);
430:     return "";
431:   }
432:   root.CareerModeTransferPlayerBlocked=(input,name,playerId)=>{const where=pstcPlayerSlot(input);return where&&where.role===view?.managerRole?pstcBlockedText(where.role,name,playerId):"";};
433:   function pstcPlayerFocus(event){
434:     const where=pstcPlayerSlot(event?.target);if(!where||where.role!==view?.managerRole||view?.state?.phase!=="SIGNING_ENTRY"||pstcReplayPhase())return;
435:     const request=pstcRequestContext(),role=where.role,key=request?`${request.key}|${role}`:"";if(!key||(blockedSeen&&blockedSeen.key===key))return;
436:     pstcBlockedNow(request,role).then(map=>{if(map instanceof Map)blockedSeen={key,map};},()=>{});
437:   }
438:   function pstcPlayerPick(event){
439:     const where=pstcPlayerSlot(event?.target),player=event?.detail?.player;if(!where||!player||where.role!==view?.managerRole)return;
440:     const base=`${where.prefix}Signing${where.slot}`,pos=pstcField(`${base}Position`),ovr=pstcField(`${base}Overall`),league=pstcField(`${base}League`),nationality=pstcField(`${base}Nationality`);
441:     const season=Number(view?.seasonNumber||pstcRequestContext()?.seasonNumber||0);
442:     if(pos&&SIGNING_POSITIONS.includes(player.position))pos.value=player.position;
443:     const nationalityId=player.nationalityId||(typeof root.resolveFifa17TransferOption==="function"?root.resolveFifa17TransferOption("nationality",player.nationality)?.id:"")||"";
444:     if(nationality&&nationalityId)pstcSetSelector(nationality,"nationality",nationalityId);
445:     if(season===1){if(ovr&&Number.isInteger(player.overall))ovr.value=String(player.overall);if(league&&player.leagueId)pstcSetSelector(league,"league",player.leagueId);}
446:     // No save here: the selector sends "change" on the name box right after this event, and the draft save reads every field.
447:   }
448:   // A refusal the manager can act on: shown word for word (a hyphenated name never turns it into the generic error).
449:   function pstcRefuse(code,message){const error=new Error(message);error.code=code;error.plain=true;throw error;}
450:   function pstcBuildSignings(role,blocked=null){
451:     const prefix=pstcRolePrefix(role),rows=[];
452:     for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`),league=pstcField(`${prefix}Signing${i}League`),nationality=pstcField(`${prefix}Signing${i}Nationality`),player=String(name?.value||"").trim(),ovrText=String(ovr?.value||"").trim(),posText=String(pos?.value||"").trim(),leagueId=pstcCanonical(league),nationalityId=pstcCanonical(nationality),hasAny=Boolean(player||ovrText||posText||String(league?.value||"").trim()||String(nationality?.value||"").trim());if(!hasAny)continue;const pickedId=/^[1-9][0-9]{0,5}$/.test(String(name?.dataset?.playerId||""))?Number(name.dataset.playerId):null,out=player&&blocked&&pstcBlockedFor(blocked,player,pickedId);if(out)pstcRefuse(out.reason==="shot"?"TRANSFER_SIGNING_SHOT":"TRANSFER_SIGNING_GUESSED_BEFORE",out.reason==="shot"?`${player} was shot in the roulette. He cannot come back.`:`${player} was guessed by ${pstcManagerName(role==="playerOne"?"playerTwo":"playerOne")}. You cannot sign him again.`);if(!player||!leagueId||!nationalityId||(ovr&&!/^[3-9][0-9]$/.test(ovrText))||(pos&&!SIGNING_POSITIONS.includes(posText)))pstcFail("TRANSFER_SIGNINGS_INVALID",`Complete signing ${i} with player name, position, overall (30-99), previous league and nationality.`);if(pstcIsOwnSpecial(role,player))pstcFail("TRANSFER_SIGNING_SPECIAL_PLAYER",`Signing ${i} is your Special Player, a free extra signing that no guess can release. Do not enter him here.`);if(pstcIsRivalSpecial(role,player))pstcRefuse("TRANSFER_SIGNING_RIVAL_SPECIAL_PLAYER",pstcRivalSpecialText(role,player));const row={slot:i,name:player,leagueId,nationalityId};if(ovr)row.overall=Number(ovrText);if(pos)row.position=posText;const playerId=String(name?.dataset?.playerId||"");if(/^[1-9][0-9]{0,5}$/.test(playerId))row.playerId=Number(playerId);rows.push(row);}
453:     return rows;
454:   }
455:   function pstcSyncGuessValue(type,value,editable){
456:     if(!value)return;const kind=String(type?.value||""),valid=kind==="league"||kind==="nationality";
457:     if(valid){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,kind);value.placeholder=kind==="league"?"Search FIFA 17 league":"Search nationality";pstcDisable(value,!editable);return;}
458:     value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.placeholder="Pick League or Nationality first";pstcDisable(value,true);
459:   }
460:   function pstcSyncOwnGuessControls(role,editable){
461:     const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1)pstcSyncGuessValue(pstcField(`${prefix}Guess${i}Type`),pstcField(`${prefix}Guess${i}Value`),editable);
462:   }
463:   function pstcGuessTypeChange(event){
464:     if(!pstcSharedMarker()||view?.state?.phase!=="GUESS_ENTRY")return;const role=view?.managerRole,target=event.target;if(!role||!target?.id)return;
465:     const prefix=pstcGuessPrefix(role),match=target.id.match(new RegExp(`^${prefix}Guess([1-3])Type$`));if(!match)return;
466:     pstcSyncGuessValue(target,pstcField(`${prefix}Guess${match[1]}Value`),!busy&&!view?.state?.guessLockedRoles?.includes(role));
467:   }
468:   function pstcPopulateGuesses(role,guesses){const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){const row=(guesses||[]).find(item=>item.slot===i),type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`);if(type)type.value=row?.type||"";if(value&&row){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,row.type);pstcSetSelector(value,row.type,row.valueId);}else if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;}}}
469:   function pstcPopulateSignings(role,signings){const prefix=pstcRolePrefix(role);for(let i=1;i<=3;i+=1){const row=(signings||[]).find(item=>item.slot===i),name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`);if(name){name.value=row?.name||"";if(Number.isInteger(row?.playerId)&&row.playerId>0)name.dataset.playerId=String(row.playerId);else delete name.dataset.playerId;}if(ovr)ovr.value=Number.isInteger(row?.overall)?String(row.overall):"";if(pos)pos.value=SIGNING_POSITIONS.includes(row?.position)?row.position:"";pstcSetSelector(pstcField(`${prefix}Signing${i}League`),"league",row?.leagueId||"");pstcSetSelector(pstcField(`${prefix}Signing${i}Nationality`),"nationality",row?.nationalityId||"");}}
470:   function pstcPopulateRole(role,inputs){if(!inputs)return;if(inputs.guesses)pstcPopulateGuesses(role,inputs.guesses);if(inputs.signings)pstcPopulateSignings(role,inputs.signings);}
471:   let signingDraftKey="";
472:   function pstcSigningDraftKey(role){const request=pstcRequestContext();return request&&role?(`cms.signingDraft.v1:${request.rivalryId}:${request.seasonNumber}:${role}`):"";}
473:   function pstcRemoveSigningDraft(key){if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
474:   function pstcClearSigningDraft(role){const key=pstcSigningDraftKey(role);pstcRemoveSigningDraft(key);if(signingDraftKey===key)signingDraftKey="";}
475:   function pstcSaveSigningDraft(role){
476:     const request=pstcRequestContext(),state=view?.state;
477:     if(!request||!state||state.phase!=="SIGNING_ENTRY"||state.signingLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase())return false;
478:     const prefix=pstcRolePrefix(role),rows=[];
479:     for(let slot=1;slot<=3;slot+=1){const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);rows.push({slot,name:String(name?.value||""),...(/^[1-9][0-9]{0,5}$/.test(name?.dataset?.playerId||"")?{playerId:Number(name.dataset.playerId)}:{}),overall:String(ovr?.value||""),position:String(pos?.value||""),leagueId:pstcCanonical(league),league:String(league?.value||""),nationalityId:pstcCanonical(nationality),nationality:String(nationality?.value||"")});}
480:     const key=pstcSigningDraftKey(role);if(!key||typeof root.writeStorageValue!=="function")return false;if(!root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows})))return false;signingDraftKey=key;return true;
481:   }
482:   function pstcRestoreSigningDraft(role,own,force=false){
483:     const key=pstcSigningDraftKey(role),request=pstcRequestContext(),state=view?.state;
484:     if(!key||!request||!state||state.phase!=="SIGNING_ENTRY")return false;
485:     const shared=Array.isArray(own?.signings)?own.signings:[];
486:     if(state.signingLockedRoles?.includes(role)||shared.length){pstcRemoveSigningDraft(key);return false;}
487:     let draft;try{draft=JSON.parse((typeof root.readStorageValue==="function"?root.readStorageValue(key):null)||"null");}catch(_error){return false;}
488:     if(!draft||draft.version!==1||draft.rivalryId!==request.rivalryId||Number(draft.seasonNumber)!==request.seasonNumber||draft.role!==role||!Array.isArray(draft.rows))return false;
489:     const prefix=pstcRolePrefix(role);
490:     for(let slot=1;slot<=3;slot+=1){if(shared.some(row=>Number(row.slot)===slot))continue;const row=draft.rows.find(item=>Number(item.slot)===slot);if(!row)continue;const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);const fill=node=>node&&(force||!String(node.value||""));if(fill(name)){name.value=String(row.name||"");if(Number.isInteger(row.playerId)&&row.playerId>0)name.dataset.playerId=String(row.playerId);else delete name.dataset.playerId;}if(fill(ovr))ovr.value=String(row.overall||"").replace(/\D/g,"").slice(0,2);if(fill(pos)&&(force||SIGNING_POSITIONS.includes(row.position)))pos.value=SIGNING_POSITIONS.includes(row.position)?row.position:"";if(fill(league)){if(row.leagueId)pstcSetSelector(league,"league",row.leagueId);else{league.value=String(row.league||"");delete league.dataset.canonicalId;delete league.dataset.canonicalLabel;}}if(fill(nationality)){if(row.nationalityId)pstcSetSelector(nationality,"nationality",row.nationalityId);else{nationality.value=String(row.nationality||"");delete nationality.dataset.canonicalId;delete nationality.dataset.canonicalLabel;}}}
491:     signingDraftKey=key;return true;
492:   }
493:   // QoL 6: half-typed guesses against the rival survive a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on lock.
494:   let guessDraftRef=null;
495:   function pstcGuessDraftRef(role){const request=pstcRequestContext();return request&&role?{rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role}:null;}
496:   function pstcSameGuessDraftRef(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.seasonNumber===b.seasonNumber&&a.role===b.role);}
497:   function pstcGuessDraftKey(ref){return ref?`cms.draft.v1:${ref.rivalryId}:${ref.seasonNumber}:${ref.role}:transferGuess`:"";}
498:   function pstcRemoveGuessDraft(ref){const key=pstcGuessDraftKey(ref);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
499:   function pstcClearGuessDraft(role){const ref=pstcGuessDraftRef(role);pstcRemoveGuessDraft(ref);if(pstcSameGuessDraftRef(guessDraftRef,ref))guessDraftRef=null;}
500:   function pstcSaveGuessDraft(role){
501:     const request=pstcRequestContext(),state=view?.state;
502:     if(!request||!state||state.phase!=="GUESS_ENTRY"||state.guessLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase()||typeof root.writeStorageValue!=="function")return false;
503:     const prefix=pstcGuessPrefix(role),rows=[];
504:     for(let slot=1;slot<=3;slot+=1){const type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`),kind=String(type?.value||""),text=String(value?.value||"");if(!kind&&!text)continue;rows.push({slot,type:kind,valueId:pstcCanonical(value),value:text});}
505:     if(!rows.length){pstcClearGuessDraft(role);return true;}
506:     const ref=pstcGuessDraftRef(role);if(root.writeStorageValue(pstcGuessDraftKey(ref),JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows}))!==true)return false;guessDraftRef=ref;return true;
507:   }
508:   function pstcRestoreGuessDraft(role,own){
509:     const request=pstcRequestContext(),state=view?.state;
510:     if(!request||!state||state.phase!=="GUESS_ENTRY"||typeof root.readStorageValue!=="function")return false;
511:     if(state.guessLockedRoles?.includes(role)||(Array.isArray(own?.guesses)&&own.guesses.length)){pstcClearGuessDraft(role);return false;}
512:     let saved;try{saved=JSON.parse(root.readStorageValue(pstcGuessDraftKey(pstcGuessDraftRef(role)))||"null");}catch(_error){return false;}
513:     if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role||!Array.isArray(saved.rows))return false;
514:     const prefix=pstcGuessPrefix(role);
515:     for(let slot=1;slot<=3;slot+=1){
516:       const row=saved.rows.find(item=>Number(item?.slot)===slot),type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`);
517:       if(!row||!type||!value||String(type.value||"")||String(value.value||""))continue;
518:       const kind=String(row.type||"");if(kind!=="league"&&kind!=="nationality")continue;
519:       type.value=kind;pstcSyncGuessValue(type,value,true);
520:       const text=String(row.value||"").slice(0,120);if(row.valueId||text)pstcSetSelector(value,kind,String(row.valueId||text));
521:     }
522:     guessDraftRef=pstcGuessDraftRef(role);return true;
523:   }
524:   function pstcGuessDraftChange(event){
525:     const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!pstcSharedMarker())return;
526:     const prefix=pstcGuessPrefix(role);if(!new RegExp(`^${prefix}Guess[1-3](Type|Value)$`).test(target.id))return;
527:     if(view?.state?.phase!=="GUESS_ENTRY"||view.state.guessLockedRoles?.includes(role))return;
528:     pstcSaveGuessDraft(role);
529:     // The selector fills its canonical id in its own input handler, which runs after this capture handler; save once more when it has.
530:     if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(view?.managerRole===role)pstcSaveGuessDraft(role);},0);
531:   }
532:   function pstcDisableRole(role,disabled){const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){[`${signing}Signing${i}Name`,`${signing}Signing${i}Overall`,`${signing}Signing${i}Position`,`${signing}Signing${i}League`,`${signing}Signing${i}Nationality`,`${guess}Guess${i}Type`,`${guess}Guess${i}Value`].forEach(id=>pstcDisable(pstcField(id),disabled));}}
533:   function pstcRenderVerdictCard(role,rows){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;target.append(heading);if(!rows||!rows.length){const empty=root.document.createElement("p");empty.textContent="No signings were entered.";target.append(empty);return;}rows.forEach(row=>{const item=root.document.createElement("p"),name=root.document.createElement("strong"),status=root.document.createElement("span");name.textContent=row.name;status.textContent=row.release?"RELEASE · MATCHED BY RIVAL GUESS":"KEEP · NO RIVAL GUESS MATCH";item.append(name,root.document.createTextNode(" — "),status);target.append(item);});}
534:   function pstcRenderVerdictLoading(role){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;const line=root.document.createElement("p");line.textContent="Saved. Loading the verdicts…";target.append(heading,line);}
535:   function pstcRenderProgress(phase){
536:     const localPhase=PHASE_PROGRESS[phase]||"window",order=["window","guess_entry","signing_entry","completed"],index=order.indexOf(localPhase),screen=pstcField("transferChallenge");
537:     if(screen)screen.dataset.transferPhase=localPhase;
538:     root.document?.querySelectorAll?.("#transferPhaseNavigator [data-transfer-phase-step]").forEach(step=>{const stepIndex=order.indexOf(step.dataset.transferPhaseStep);step.classList.toggle("active",stepIndex===index);step.classList.toggle("done",stepIndex>=0&&stepIndex<index);});
539:     const copy={NOT_STARTED:`Transfer Window · ${pstcManagerName(view?.setup?.coordinatorRole||"playerOne")} starts the 15-minute window.`,WINDOW_OPEN:"Transfer Window · you both see the same clock and can agree to end it early.",GUESS_ENTRY:"Guesses · enter your guesses. Your rival cannot see them yet.",SIGNING_ENTRY:"Signings · guesses are locked. Enter the signings you made in FIFA 17.",COMPLETED:"Verdicts · both sides are revealed and checked the same way."};
540:     pstcText("transferPhaseIntro",copy[phase]||copy.NOT_STARTED);
541:   }
542:   function pstcRenderTimer(){
543:     if(pstcExpiryPaused())return;
544:     const timer=pstcField("transferTimerDisplay"),state=view?.state;if(!timer)return;
545:     if(pstcReplayPhase()){timer.textContent="REPLAY";return;}
546:     if(!state||state.phase!=="WINDOW_OPEN"){timer.textContent=state?"00:00":"15:00";return;}
547:     const request=pstcRequestContext();
548:     if(!request||!pstcClockReady(request)){timer.textContent="SYNC";return;}
549:     const now=pstcAuthoritativeNow(request),deadline=Number(state.startedAtEpochMs)+15*60*1000,remaining=Math.max(0,Math.ceil((deadline-now)/1000)),minutes=Math.floor(remaining/60),seconds=remaining%60;timer.textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
550:     const revision=Number(view.revision);
551:     if(expiryAttemptContextKey!==request.key||expiryAttemptRevision!==revision){pstcResetExpiryAttempts();expiryAttemptContextKey=request.key;expiryAttemptRevision=revision;}
552:     const retryAllowed=!expiryPermissionDenied&&expiryAttemptCount<EXPIRY_MAX_ATTEMPTS&&(expiryAttemptCount===0||now-expiryAttemptAt>=EXPIRY_RETRY_MS);
553:     if(remaining===0&&!busy&&retryAllowed){expiryAttemptCount+=1;expiryAttemptAt=now;void pstcMutate("advanceExpiredWindow");}
554:   }
555:   // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
556:   // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
557:   let pstcWatchedKey=null;
558:   function pstcWatchSync(){let key="";try{key=pstcWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pstcWatchedKey)return;pstcWatchedKey=key;try{pstcWatchWait();}catch(_error){}}
559:   // r91: every render disables both cards' fields and enables this manager's own again, and disabling a focused box blurs it.
560:   // A render comes on every poll and every rival move, so the box being typed in gets its focus, caret and list back when it
561:   // is still enabled after the render (a lock or phase change leaves it disabled, and then it stays blurred).
562:   function pstcRender(){
563:     const doc=root.document,node=doc&&doc.activeElement,screen=pstcField("transferChallenge");
564:     const keep=node&&screen&&screen.contains(node)&&/^(INPUT|SELECT|TEXTAREA)$/.test(node.tagName)?node:null;
565:     let sel=null,listOpen=false;if(keep){try{if(typeof keep.selectionStart==="number")sel=[keep.selectionStart,keep.selectionEnd,keep.selectionDirection||"none"];}catch(_error){sel=null;}listOpen=keep.getAttribute("aria-expanded")==="true";}
566:     try{return pstcRenderNow();}
567:     finally{
568:       if(keep&&keep.isConnected&&!keep.disabled&&doc.activeElement!==keep){
569:         try{keep.focus({preventScroll:true});if(sel)keep.setSelectionRange(sel[0],sel[1],sel[2]);}catch(_error){}
570:         if(!listOpen&&keep.getAttribute("aria-expanded")==="true"&&typeof root.closeAllTransferSelectors==="function")root.closeAllTransferSelectors();
571:       }
572:     }
573:   }
574:   function pstcRenderNow(){
575:     if(!root.document||!pstcSharedMarker())return false;
576:     pstcCapSigningNames();pstcWatchSync();pstcWarmPlayerList();
577:     const state=view?.state||null,role=view?.managerRole||pstcSetupState()?.managerRole||null;
578:     if(!role)return false;
579:     const key=viewContextKey||pstcBoundContextKey(view?.rivalryId||pstcSetupState()?.rivalryId||"",view?.seasonNumber||pstcSeason());pstcResetForContext(key,role);
580:     const other=role==="playerOne"?"playerTwo":"playerOne",actualPhase=state?.phase||"NOT_STARTED",replayPhase=pstcReplayPhase(key),phase=replayPhase||actualPhase,isReplay=Boolean(replayPhase),own=view?.ownInputs||null,opponent=view?.opponentInputs||null,screen=pstcField("transferChallenge");
581:     if(screen){if(isReplay)screen.dataset.sharedTransferReplay=phase;else delete screen.dataset.sharedTransferReplay;}
582:     pstcRenderProgress(phase);
583:     pstcText("transferChallengeTitle",`SEASON ${view?.seasonNumber||pstcSeason()} TRANSFER WAR`);pstcText("transferManagerOne",pstcManagerName("playerOne"));pstcText("transferManagerTwo",pstcManagerName("playerTwo"));pstcText("transferClubOne",pstcClubName("playerOne"));pstcText("transferClubTwo",pstcClubName("playerTwo"));pstcText("guessAgainstOneHeading",`${pstcManagerName("playerTwo")} guesses ${pstcManagerName("playerOne")}'s signings`);pstcText("guessAgainstTwoHeading",`${pstcManagerName("playerOne")} guesses ${pstcManagerName("playerTwo")}'s signings`);
584:     const start=pstcField("startTransferTimer"),end=pstcField("endTransferTimer"),complete=pstcField("completeTransferChallenge"),continueButton=pstcField("continueFromTransfers"),results=pstcField("transferChallengeResults"),actionBar=pstcField("transferPhaseActionBar"),signingGrid=root.document.querySelector("#transferChallenge .transferManagersGrid"),guessGrid=root.document.querySelector("#transferChallenge .transferGuessesGrid"),privacy=pstcField("transferGuessPrivacyNote"),summary=pstcField("transferPhaseLockSummary");
585:     if(start)delete start.dataset.rouletteWait;pstcHidden(start,true);pstcHidden(end,true);pstcHidden(complete,true);pstcHidden(actionBar,true);pstcHidden(continueButton,true);pstcHidden(results,true);pstcHidden(signingGrid,true);pstcHidden(guessGrid,true);pstcHidden(privacy,true);pstcHidden(summary,true);pstcHidden(pstcOwnSigningCard(role),false);pstcHidden(pstcOtherSigningCard(role),true);pstcHidden(pstcOwnGuessCard(role),false);pstcHidden(pstcOtherGuessCard(role),true);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);
586:     if(own)pstcPopulateRole(role,own);if(actualPhase==="SIGNING_ENTRY"&&state?.signingLockedRoles?.includes(role))pstcClearSigningDraft(role);if(actualPhase==="SIGNING_ENTRY"&&!isReplay&&!state?.signingLockedRoles?.includes(role))pstcRestoreSigningDraft(role,own);
587:     if(actualPhase==="SIGNING_ENTRY"||actualPhase==="COMPLETED"||(actualPhase==="GUESS_ENTRY"&&state?.guessLockedRoles?.includes(role)))pstcClearGuessDraft(role);else if(actualPhase==="GUESS_ENTRY"&&!isReplay)pstcRestoreGuessDraft(role,own);
588:     if(phase==="NOT_STARTED"){
589:       // Codex C2-02: this manager's own refused spin mark (the window cannot open without it) is shown on either phone, never
590:       // hidden behind the partner's "waiting for Daniel" line.
591:       // Fable F6-03: the missing marks are worked out for both roles (no read), so the partner whose own mark is still being
592:       // saved sees that, not "waiting for the coordinator to start" while the coordinator's phone waits for his spin.
593:       const missing=isReplay?[]:pstcSpinsMissing(),ownMissing=missing.includes(role);
594:       const ownRefused=!isReplay&&Boolean(spinRefusedKey&&spinRefusedKey===pstcRequestContext()?.key&&ownMissing);
595:       pstcText("transferPhaseStatus",ownRefused?"READY · YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY":role===view?.setup?.coordinatorRole?"READY · YOU START THE WINDOW":ownMissing?"READY · SAVING YOUR ROULETTE SPIN…":`READY · WAITING FOR ${String(pstcManagerName(view?.setup?.coordinatorRole||"playerOne")).toUpperCase()} TO START`);
596:       if(role===view?.setup?.coordinatorRole){
597:         pstcHidden(start,false);
598:         // RT5-FLOW-02: until both marks are on the server the button is the waiting line: full gold edge and words (HO-027,
599:         // never dimmed; css/transfer.css), not tappable, and it turns into START by itself when the partner's mark arrives.
600:         if(missing.length){const refusedHere=Boolean(spinRefusedKey&&spinRefusedKey===pstcRequestContext()?.key&&missing.includes(view.managerRole));const label=refusedHere?"YOUR SPIN WAS NOT SAVED · RELOAD TO RETRY":missing.includes(other)?`WAITING FOR ${String(pstcManagerName(other)).toUpperCase()} TO SPIN THE ROULETTE`:"SAVING YOUR ROULETTE SPIN…";start.textContent=label;start.dataset.rouletteWait="true";pstcDisable(start,true);pstcText("transferPhaseStatus",`READY · ${label}`);}
601:         else{delete start.dataset.rouletteWait;start.textContent="START 15-MINUTE WINDOW";pstcDisable(start,busy);}
602:       }
603:     }else if(phase==="WINDOW_OPEN"){
604:       if(isReplay){pstcText("transferPhaseStatus","REPLAY · TRANSFER WINDOW");pstcText("transferTimerDisplay","REPLAY");}
605:       else{const requested=state.endRequestedRoles?.includes(role);pstcText("transferPhaseStatus",requested?"TRANSFER WINDOW LIVE · YOU ASKED TO END EARLY":"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD");pstcHidden(end,false);end.textContent=requested?"EARLY END REQUESTED ✓":"REQUEST EARLY END";pstcDisable(end,busy||requested);pstcRenderTimer();}
606:     }else if(phase==="GUESS_ENTRY"){
607:       const locked=state.guessLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · GUESSES":locked?"GUESSES LOCKED · WAITING FOR YOUR RIVAL":"GUESSES · HIDDEN FROM YOUR RIVAL UNTIL YOU BOTH LOCK");pstcHidden(guessGrid,false);pstcHidden(privacy,false);if(privacy)privacy.textContent=isReplay?"Replay: read-only. Nothing new about your rival is shown.":"Enter your guesses. Your rival cannot see them until you both lock.";if(!isReplay&&!locked){const card=pstcOwnGuessCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcSyncOwnGuessControls(role,true);pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY GUESSES";pstcDisable(complete,busy);}
608:     }else if(phase==="SIGNING_ENTRY"){
609:       const locked=state.signingLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · SIGNINGS":locked?"SIGNINGS LOCKED · WAITING FOR YOUR RIVAL":"SIGNINGS · ENTER YOUR FIFA 17 TRANSFERS");pstcHidden(signingGrid,false);pstcHidden(summary,false);if(summary)summary.textContent=isReplay?"Replay: your signings are read-only. Nothing here changes the game or your save.":locked?"Your signings are locked. They stay hidden from your rival until they lock theirs.":"Both sets of guesses are locked. Enter your own signings; your rival still cannot see them.";if(!isReplay&&!locked){pstcEnhancePlayerNames(role,true);const card=pstcOwnSigningCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY SIGNINGS";pstcDisable(complete,busy);}
610:     }else if(phase==="COMPLETED"){
611:       // F2-08: COMPLETED without its verdicts yet (the follow-up read after the lock failed): saved, loading, never "No signings".
612:       const loadingVerdicts=!view?.verdicts;
613:       pstcText("transferPhaseStatus",loadingVerdicts?"SAVED · LOADING VERDICTS":"TRANSFER WAR COMPLETE · VERDICTS REVEALED");pstcHidden(signingGrid,false);pstcHidden(guessGrid,false);pstcHidden(results,false);pstcHidden(pstcOtherSigningCard(role),false);pstcHidden(pstcOtherGuessCard(role),false);pstcPopulateRole(role,own);pstcPopulateRole(other,opponent);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);if(loadingVerdicts){pstcRenderVerdictLoading("playerOne");pstcRenderVerdictLoading("playerTwo");}else{pstcRenderVerdictCard("playerOne",view.verdicts.playerOne||[]);pstcRenderVerdictCard("playerTwo",view.verdicts.playerTwo||[]);}if(continueButton){continueButton.textContent="SEASON RESULTS NEXT";pstcHidden(continueButton,false);pstcDisable(continueButton,true);}
614:     }
615:     if(isReplay&&continueButton){continueButton.textContent=`CONTINUE REPLAY · ${phase.replaceAll("_"," ")}`;pstcHidden(actionBar,false);pstcHidden(continueButton,false);pstcDisable(continueButton,false);}
616:     pstcMarkWitness(key,phase);
617:     const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
618:   }
619:   function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButton";button.type="button";button.textContent="REFRESH";button.addEventListener("click",event=>{event.preventDefault();if(pstcReplayPhase())return;void pstcRefresh().catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer War did not refresh. Try again."));pstcReport("Unable to refresh Shared Transfer Challenge",error);});});actions.append(button);return button;}
620:   function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER WAR…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} TRANSFER WAR`;status.textContent="Transfer War: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN TRANSFER WAR";status.textContent="Transfer War: window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="ENTER GUESSES";status.textContent="Transfer War: guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="ENTER SIGNINGS";status.textContent="Transfer War: signings";}else{button.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer War: complete";}if(rouletteError)status.textContent=rouletteError;else if(primePackLoadError)status.textContent=PSTC_PRIME_PACK_TEXT;return true;}
621:   // r88 Chamber Men (Nik 2026-11-02): before this season's roulette, both managers play a 7-round shootout; each goal loads one
622:   // live round in the rival's cylinder (js/chamberMen.js). false keeps the window shut: he went back to Showdown Home, or the step or its result could
623:   // not load (the dashboard says so; tapping again comes back). On true, chamberGate holds this season's two cylinders.
624:   async function pstcChamberMenFirst(request){
625:     chamberGate=null;rouletteError="";
626:     try{
627:       if(!view||!view.managerRole||!request)return true;
628:       let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
629:       if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
630:       if(!Number.isFinite(confirmedAtMs)){rouletteError=PSTC_ROULETTE_TEXT.setup;return false;}
631:       let timer;const step=await Promise.race([pstcLoadScript("chamber-men-step","js/chamberMenStep.js",()=>root.CareerModeChamberMenStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
632:       if(!step||!await step.ensure()){rouletteError=PSTC_ROULETTE_TEXT.chamberLoad;return false;}
633:       const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,confirmedAtMs,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")}};
634:       if(!step.applies(ctx))return true;
635:       const provided=await pstcProviderOptions(request,true);
636:       if(!provided){rouletteError=PSTC_ROULETTE_TEXT.chamberLoad;return false;}
637:       if(!pstcRequestMatches(request))return false;
638:       const options=provided.options,io={firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,now:()=>pstcAuthoritativeNow(request),
639:         resync:()=>{clockRefreshPerformanceMs=Number.NaN;return pstcEnsureServerClock(options.user,request);}};
640:       // The Transfer War started, so both managers spun with this season's cylinders already (their marks hold the outcome):
641:       // nothing finished is shown again and the roulette is passed too.
642:       if(view.state){step.markDone(ctx);return true;}
643:       const go=await step.run(ctx,io);
644:       if(go!==true){if(!step.wentHome?.())rouletteError=PSTC_ROULETTE_TEXT.chamberLoad;return false;}
645:       const cylinders=await step.cylinders(ctx,io);
646:       if(!cylinders||cylinders.ok!==true){rouletteError=PSTC_ROULETTE_TEXT.chamberCylinders;return false;}
647:       // Fable F17-01: an earlier season's cylinders, only for a season whose spin marks lost an outcome (kept copy, else one read).
648:       chamberGate={key:request.key,season:request.seasonNumber,chambers:cylinders.chambers,score:cylinders.score,earlier:k=>step.cylinders({...ctx,season:k},io)};
649:       return true;
650:     }catch(_error){rouletteError=PSTC_ROULETTE_TEXT.chamberLoad;return false;}
651:   }
652:   // r91 Squad Management (Nik 2026-11-11): after Chamber Men and before the roulette, each manager sets and locks his squad
653:   // for the season; his XI and subs 1-4 are his roulette board. The roulette waits until both are locked. false keeps the
654:   // window shut: he went back to Showdown Home, or the step or a squad could not load (the dashboard says so; tapping again
655:   // comes back, and a locked squad is never asked again). The same screen runs after the Transfer War (pstcSquadAfterTransfers).
656:   function pstcSquadContext(request,stage,special){
657:     const seasons=Number(pstcShowdown()?.totalRounds),rival=view.managerRole==="playerOne"?"playerTwo":"playerOne";
658:     return {rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,stage,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")},special,seasons:Number.isInteger(seasons)?seasons:null,
659:       verdicts:season=>pstcRouletteVerdicts(request,season),
660:       // M1 (2.4.0 hunt): the rival's phone spun this season's roulette on a version before squads, so it never shows him a
661:       // squad screen: the wait says to update that phone (the roulette's own signal, the version on his spin mark).
662:       rivalBehind:stage==="pre"&&!view.state&&pstcSpunBeforeSquads(view.spinMarks?.[rival])};
663:   }
664:   // M1 (2.4.0 hunt): a spin mark saved by a roulette engine before squad sheets (js/rosterRoulette.js ENGINE_REVISION 3 is the
665:   // first that spins on the two locked "pre" squads; a version reads rr4.<revision>.<hash>). Only a whole outcome counts; a
666:   // bare mark (true) or anything unreadable is not taken as "before squads".
667:   const PSTC_SQUAD_ROULETTE_REVISION=3;
668:   function pstcSpunBeforeSquads(mark){
669:     const revision=mark&&typeof mark==="object"&&typeof mark.fired==="boolean"&&typeof mark.version==="string"?/^rr\d+\.(\d+)\./.exec(mark.version):null;
670:     return Boolean(revision)&&Number(revision[1])<PSTC_SQUAD_ROULETTE_REVISION;
671:   }
672:   // The roulette step (the Special Player draw lives there) and the squad step, loaded; null when either cannot load.
673:   async function pstcSquadSteps(){
674:     let timer;const loaded=await Promise.race([Promise.all([
675:       pstcLoadScript("squad-sheet-step","js/squadSheetStep.js",()=>root.CareerModeSquadSheetStep),
676:       pstcLoadScript("roster-roulette-step","js/rosterRouletteStep.js",()=>root.CareerModeRosterRouletteStep)
677:     ]).then(()=>true,()=>false),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(false),10000);})]).finally(()=>root.clearTimeout(timer));
678:     const step=root.CareerModeSquadSheetStep,rr=root.CareerModeRosterRouletteStep;
679:     if(!loaded||!step||!rr)return null;
680:     return {step,rr};
681:   }
682:   // The season's Special Player (never on a squad), drawn once the screen applies; undefined when the draw cannot load.
683:   async function pstcSquadSpecial(steps,request,confirmedAtMs,clubs){
684:     if(typeof steps.rr.ensureDraw==="function"&&!await steps.rr.ensureDraw())return undefined;
685:     return typeof steps.rr.special==="function"?steps.rr.special({rivalryId:request.rivalryId,confirmedAtMs,clubs}):null;
686:   }
687:   async function pstcSquadFirst(request){
688:     squadGate=null;rouletteError="";
689:     try{
690:       if(!view||!view.managerRole||!request)return true;
691:       // The Transfer War started: both squads were locked and the roulette spun on them (nothing finished is shown again).
692:       if(view.state)return true;
693:       // M1 (2.4.0 hunt): both managers already spun this season's roulette on a version before squads (an update in the middle
694:       // of the Showdown): that roulette is settled without squads, so no squad is asked for it. From the marks the Transfer
695:       // Challenge read just made; a season spun on squads (or not spun yet) still asks as before.
696:       const marks=view.spinMarks;
697:       if(marks&&["playerOne","playerTwo"].every(role=>pstcSpunBeforeSquads(marks[role])))return true;
698:       let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
699:       if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
700:       if(!Number.isFinite(confirmedAtMs)){rouletteError=PSTC_ROULETTE_TEXT.setup;return false;}
701:       const steps=await pstcSquadSteps();
702:       if(!steps){rouletteError=PSTC_ROULETTE_TEXT.squadLoad;return false;}
703:       const clubs={playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")};
704:       const ctx=pstcSquadContext(request,"pre",null);
705:       if(!steps.step.applies(ctx))return true;
706:       ctx.special=await pstcSquadSpecial(steps,request,confirmedAtMs,clubs);
707:       if(ctx.special===undefined){rouletteError=PSTC_ROULETTE_TEXT.squadLoad;return false;}
708:       const provided=await pstcProviderOptions(request,true);
709:       if(!provided){rouletteError=PSTC_ROULETTE_TEXT.squadLoad;return false;}
710:       if(!pstcRequestMatches(request))return false;
711:       const options=provided.options,io={firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId};
712:       ctx.replayHits=k=>pstcSquadReplayHits(request,ctx,io,steps,confirmedAtMs,k);
713:       const go=await steps.step.run(ctx,io);
714:       if(go!==true){if(!steps.step.wentHome?.())rouletteError=PSTC_ROULETTE_TEXT.squadLoad;return false;}
715:       const boards=await steps.step.boards(ctx,io);
716:       if(!boards||boards.ok!==true){rouletteError=PSTC_ROULETTE_TEXT.squadBoards;return false;}
717:       squadGate={key:request.key,season:request.seasonNumber,sheets:boards.sheets};
718:       // the Touchline Gazette's squad news: last season's two "pre" sheets kept too (no read when this phone has them)
719:       Promise.resolve(steps.step.gazetteWarm?.(ctx,io)).catch(()=>null);
720:       return true;
721:     }catch(_error){rouletteError=PSTC_ROULETTE_TEXT.squadLoad;return false;}
722:   }
723:   // After the Transfer War (verdicts revealed) and before Season Results: this manager's squad with his kept signings in and
724:   // the roulette's shot gone. He does not wait for the rival here. true = Season Results may open; false = he went back to
725:   // Showdown Home, or the screen could not load (he taps again; nothing is lost). Not in the Showdown's last season.
726:   // P3 (review of #1358): a screen that cannot load says why, on the Transfer War screen and on the dashboard; never a silent tap.
727:   let squadError="";
728:   function pstcSquadFail(steps){
729:     if(steps?.step?.wentHome?.())return false;
730:     squadError=PSTC_ROULETTE_TEXT.squadLoad;pstcSetError(squadError);try{pstcDecorateDashboard();}catch(_error){}
731:     return false;
732:   }
733:   async function pstcSquadAfterTransfers(){
734:     squadError="";
735:     let steps=null;
736:     try{
737:       const request=pstcRequestContext();
738:       if(!view||!view.managerRole||!request||view.state?.phase!=="COMPLETED"||viewContextKey!==request.key)return true;
739:       const confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
740:       if(!Number.isFinite(confirmedAtMs))return pstcSquadFail(null);
741:       steps=await pstcSquadSteps();if(!steps)return pstcSquadFail(null);
742:       const clubs={playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")};
743:       const ctx=pstcSquadContext(request,"post",null);
744:       if(!steps.step.applies(ctx)||steps.step.isDone(ctx))return true;
745:       ctx.special=await pstcSquadSpecial(steps,request,confirmedAtMs,clubs);
746:       if(ctx.special===undefined)return pstcSquadFail(steps);
747:       const provided=await pstcProviderOptions(request,true);
748:       if(!provided)return pstcSquadFail(steps);
749:       if(!pstcRequestMatches(request))return false;
750:       const options=provided.options,io={firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId};
751:       ctx.replayHits=k=>pstcSquadReplayHits(request,ctx,io,steps,confirmedAtMs,k);
752:       Promise.resolve(steps.step.gazetteWarm?.(ctx,io)).catch(()=>null);
753:       const go=await steps.step.run(ctx,io);
754:       return go===true?true:pstcSquadFail(steps);
755:     }catch(_error){return pstcSquadFail(steps);}
756:   }
757:   // A season whose spin mark lost its outcome: both managers' shots replayed with the roulette engine from that season's two
758:   // locked squads and its Chamber Men cylinders (as the roulette did before squads, Fable F17-01). {playerOne, playerTwo} or null.
759:   async function pstcSquadReplayHits(request,ctx,io,steps,confirmedAtMs,k){
760:     const loaded=await Promise.all([
761:       pstcLoadScript("roster-roulette","js/rosterRoulette.js",()=>root.CareerModeRosterRoulette),
762:       pstcLoadScript("chamber-men-step","js/chamberMenStep.js",()=>root.CareerModeChamberMenStep)
763:     ]).then(()=>true,()=>false);
764:     const engine=root.CareerModeRosterRoulette,chamber=root.CareerModeChamberMenStep;
765:     if(!loaded||!engine||typeof engine.forSeason!=="function"||typeof engine.outcome!=="function"||!chamber||!await chamber.ensure())return null;
766:     const cyl=await chamber.cylinders({rivalryId:ctx.rivalryId,managerRole:ctx.managerRole,season:k,confirmedAtMs,clubs:ctx.clubs},io);
767:     const chambers=cyl&&cyl.ok===true&&cyl.chambers?cyl.chambers:cyl&&cyl.reason==="NOT_FINISHED"?Object.freeze({oneBullet:true}):null;
768:     if(!chambers)return null;
769:     const boards=await steps.step.boards({...ctx,season:k,stage:"pre"},io);
770:     if(!boards||boards.ok!==true)return null;
771:     const plan=engine.forSeason(ctx.rivalryId,ctx.clubs,k,{special:ctx.special,history:[null],hits:{},chamberMen:true,chambers:{[k]:chambers},sheets:boards.sheets});
772:     if(!plan)return null;
773:     const out={playerOne:engine.outcome(plan,"playerOne","replay"),playerTwo:engine.outcome(plan,"playerTwo","replay")};
774:     return out.playerOne&&out.playerTwo?out:null;
775:   }
776:   // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
777:   // r87 Russian Roster Roulette (js/rosterRouletteStep.js): before this season's Transfer Challenge opens, this manager does
778:   // the season's roulette once (board from season 2, both spins, the release). It decides for itself whether it applies (a
779:   // Showdown confirmed on r87 or later, not done yet on this browser) and never rejects. false = he went back to Home, or the
780:   // step itself could not load: the window then stays shut with a TRY AGAIN line on the dashboard (red team R87-B-02).
781:   // The confirm time comes with the Setup read; only a manager whose Setup state came from his own confirm tap reads it once.
782:   async function pstcRouletteFirst(request){
783:     rouletteError="";
784:     try{
785:       if(!view||!view.managerRole||!request)return true;
786:       let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
787:       if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
788:       // Every Setup read carries the confirm time (the ledger's updatedAt is a required field), so a missing one means the
789:       // Setup could not be read just now: the window stays shut with the reason, never opened without the roulette (Fable F2-05).
790:       if(!Number.isFinite(confirmedAtMs)){rouletteError=PSTC_ROULETTE_TEXT.setup;return false;}
791:       // F2-02 / F2-10: this season's marks from the read just made (no new read), whether the window already opened (both
792:       // managers spun), where this manager's outcome goes, and a fresh look at the marks for the version stop's TRY AGAIN.
793:       const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")},confirmedAtMs,phase:view.state?.phase||"NOT_STARTED",
794:         marks:view.state?null:(view.spinMarks||null),windowStarted:Boolean(view.state),
795:         remember:outcome=>pstcRememberOutcome(request,view?.managerRole,outcome),
796:         refreshMarks:async()=>{const fresh=await pstcRefresh(true,false);return fresh&&viewContextKey===request.key?{marks:view.state?null:(view.spinMarks||null),windowStarted:Boolean(view.state)}:null;},
797:         verdicts:season=>pstcRouletteVerdicts(request,season),
798:         // Nik 2026-11-02: the roulette's button names the next screen; and once the Transfer War has started after a Prime Pack,
799:         // this season's roulette and Prime Pack are both finished (nothing finished is shown again).
800:         primePackNext:()=>pstcPrimePackNext(request,confirmedAtMs),passed:Boolean(view.state)&&pstcPrimePackApplies(request,confirmedAtMs),
801:         // r88 Chamber Men: this season's cylinders (a Showdown that plays it never spins one bullet; earlier seasons replay
802:         // their saved spin marks).
803:         chamberMen:chamberGate&&chamberGate.key===request.key?{active:true,chambers:{[chamberGate.season]:chamberGate.chambers},score:chamberGate.score,earlier:chamberGate.earlier}:null,
804:         // r91 Squad Management: the two locked squads are this season's boards.
805:         squads:squadGate&&squadGate.key===request.key?squadGate.sheets:null};
806:       let timer;const step=await Promise.race([pstcLoadScript("roster-roulette-step","js/rosterRouletteStep.js",()=>root.CareerModeRosterRouletteStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
807:       if(!step){rouletteError=PSTC_ROULETTE_TEXT.load;return false;}
808:       // The Special Player draw for the signing form (R87-SP-02), also when the roulette is already done here (Fable F2-06).
809:       if(typeof step.ensureDraw==="function"&&!await step.ensureDraw()){rouletteError=PSTC_ROULETTE_TEXT.draw;return false;}
810:       rouletteGate={key:request.key,applies:pstcRouletteAppliesTo(confirmedAtMs,step)};
811:       // Done on this browser before (or the step does not run for this manager): his mark still goes to the server once.
812:       if(!step.decide(ctx)){rouletteClearedKey=request.key;await pstcAfterSpin(request);return true;}
813:       const go=await step.runBeforeTransfers(ctx);
814:       if(go){rouletteClearedKey=request.key;await pstcAfterSpin(request);}
815:       return go;
816:     }catch(_error){rouletteError=PSTC_ROULETTE_TEXT.error;return false;}
817:   }
818:   // r87 Prime Pack (Nik 2026-10-31/11-01): after the roulette and before the window, both managers name one masked Icon
819:   // (js/iconGuessStep.js). Only Showdowns confirmed on r87 or later play it (the same boundary as the roulette); for the
820:   // rest nothing is loaded. false keeps the window shut: he went back to Showdown Home, or the step could not load (the
821:   // dashboard then says so and tapping again retries). The round runs on the Transfer Challenge's server clock.
822:   // The Prime Pack's own gate (pstcPrimePackFirst + js/iconGuess.js eligible), without loading it: seasons 1 to 10 with a
823:   // readable confirm time. Next: also not yet passed on this phone (its done key) and the Transfer War not started.
824:   const PRIME_PACK_DONE_KEY="careerModeShowdown.primePackDone.v1";
825:   function pstcPrimePackApplies(request,confirmedAtMs){return Number.isFinite(confirmedAtMs)&&Number.isInteger(request?.seasonNumber)&&request.seasonNumber>=1&&request.seasonNumber<=10;}
826:   function pstcPrimePackNext(request,confirmedAtMs){
827:     if(!pstcPrimePackApplies(request,confirmedAtMs)||view?.state)return false;
828:     try{const list=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PRIME_PACK_DONE_KEY)||"[]");return !(Array.isArray(list)&&list.includes(`${request.rivalryId}|${request.seasonNumber}|${view?.managerRole}`));}catch(_error){return true;}
829:   }
830:   async function pstcPrimePackFirst(request){
831:     primePackLoadError=false;
832:     try{
833:       if(!view||!view.managerRole||!request)return true;
834:       let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
835:       if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
836:       // Fable F13-04: an unknown confirm time keeps the window shut (TRY AGAIN) instead of skipping a Prime Pack that may apply.
837:       if(!Number.isFinite(confirmedAtMs)){primePackLoadError=true;return false;}
838:       let timer;const step=await Promise.race([pstcLoadScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
839:       if(!step){primePackLoadError=true;return false;}
840:       // applies() needs the round engine (js/iconGuess.js): load it first, or an r87 Showdown would skip the Prime Pack.
841:       if(!await step.ensure()){primePackLoadError=true;return false;}
842:       const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,confirmedAtMs};
843:       if(!step.applies(ctx))return true;
844:       // Nik 2026-11-02 (order audit): the Transfer War started, so this round is over (a manager starts it only after his
845:       // Prime Pack result): a fresh browser goes on without showing the finished round again.
846:       if(view.state){step.markDone?.(ctx);return true;}
847:       const provided=await pstcProviderOptions(request,true);
848:       if(!provided){primePackLoadError=true;return false;}
849:       if(!pstcRequestMatches(request))return false;
850:       const options=provided.options;
851:       const go=await step.run(ctx,{firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,now:()=>pstcAuthoritativeNow(request),
852:         // Fable F13-03: back from a locked screen the monotonic clock may have stood still; take a fresh server anchor.
853:         resync:()=>{clockRefreshPerformanceMs=Number.NaN;return pstcEnsureServerClock(options.user,request);}});
854:       // false without the manager choosing Showdown Home is a fault: the caller says so instead of a generic error.
855:       if(go!==true&&!step.wentHome?.())primePackLoadError=true;
856:       return go===true;
857:     }catch(_error){primePackLoadError=true;return false;}
858:   }
859:   // r87 roulette boards: each finished season's verdicts (both managers' signings, overall and release) are kept on this
860:   // phone when the Transfer Challenge shows them, so the next spins build their boards with no read. A season not kept
861:   // here (another phone, cleared storage) costs one Transfer Challenge read, once.
862:   // R92-01: v2 keeps each row's playerId (the LOCK refusals and the squad engine match the exact man by it), so a v1 row,
863:   // which never kept one, is not trusted: that season is read again once.
864:   const PSTC_ROULETTE_VERDICTS_KEY="careerModeShowdown.rouletteVerdicts.v2",PSTC_ROULETTE_VERDICTS_MAX=40;
865:   function pstcVerdictRows(rows){return Array.isArray(rows)?rows.map(row=>{const out={slot:row.slot,name:row.name,overall:Number.isInteger(row.overall)?row.overall:null,position:SIGNING_POSITIONS.includes(row.position)?row.position:null,release:row.release===true};if(Number.isInteger(row.playerId)&&row.playerId>=1&&row.playerId<=999999)out.playerId=row.playerId;return out;}):null;}
866:   function pstcVerdictList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_VERDICTS_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
867:   function pstcKeptVerdicts(rivalryId,season){const found=pstcVerdictList().find(item=>item[0]===`${rivalryId}|${season}`),value=found&&found[1];return value&&Array.isArray(value.playerOne)&&Array.isArray(value.playerTwo)?value:null;}
868:   function pstcKeepVerdicts(rivalryId,season,verdicts){
869:     const value={playerOne:pstcVerdictRows(verdicts?.playerOne),playerTwo:pstcVerdictRows(verdicts?.playerTwo)};if(!rivalryId||!value.playerOne||!value.playerTwo)return null;
870:     try{const key=`${rivalryId}|${season}`,list=pstcVerdictList().filter(item=>item[0]!==key);list.push([key,value]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_VERDICTS_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
871:     return value;
872:   }
873:   // F2-02: each season's saved outcomes ({playerOne, playerTwo}: an outcome or null) once both are known for good: from the
874:   // durable record, or from the pre-window marks once both managers have one (the record START writes is their exact copy).
875:   const PSTC_ROULETTE_HITS_KEY="careerModeShowdown.rouletteHits.v1";
876:   function pstcHitList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_HITS_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
877:   function pstcOutcomeCopy(entry){return entry&&typeof entry==="object"&&provider?.outcomeValid?.(entry)?{fired:entry.fired,hitName:entry.hitName,hitNumber:entry.hitNumber,hitSlot:entry.hitSlot,hitSignedSeason:entry.hitSignedSeason,version:entry.version}:null;}
878:   function pstcKeptHits(rivalryId,season){const found=pstcHitList().find(item=>item[0]===`${rivalryId}|${season}`),value=found&&found[1];return value&&typeof value==="object"&&Object.hasOwn(value,"playerOne")&&Object.hasOwn(value,"playerTwo")?value:null;}
879:   function pstcKeepHits(rivalryId,season,hits){
880:     const value={playerOne:pstcOutcomeCopy(hits?.playerOne),playerTwo:pstcOutcomeCopy(hits?.playerTwo)};if(!rivalryId)return value;
881:     try{const key=`${rivalryId}|${season}`,list=pstcHitList().filter(item=>item[0]!==key);list.push([key,value]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_HITS_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
882:     return value;
883:   }
884:   function pstcKeepMarks(rivalryId,season,marks){if(marks&&marks.playerOne&&marks.playerTwo)pstcKeepHits(rivalryId,season,marks);}
885:   // F2-12 (Fable job 2): a season missing here is read with plain document gets (both role documents and the spin record; one
886:   // record get when the verdicts are already kept), not the full prerequisite transaction with a forced token refresh.
887:   async function pstcRouletteServices(){
888:     const runtime=root.CareerModeProductionFirebaseRuntime;if(!runtime||typeof runtime.ensureAccountServices!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
889:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
890:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
891:     const base=services.firestoreSdk;
892:     const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(typeof base.getDoc==="function"?base:{...base,getDoc:(await import(runtime.firebaseFirestoreModule)).getDoc});
893:     return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:sdk};
894:   }
895:   async function pstcRouletteVerdicts(request,season){
896:     try{
897:       const kept=pstcKeptVerdicts(request.rivalryId,season),keptHits=pstcKeptHits(request.rivalryId,season);
898:       if(kept&&keptHits)return {ok:true,verdicts:kept,hits:keptHits};
899:       await pstcEnsureDependencies();
900:       const role=view?.managerRole||pstcSetupState()?.managerRole;if(!role)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
901:       if(typeof provider.readRouletteSeason!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
902:       const result=await provider.readRouletteSeason({...await pstcRouletteServices(),rivalryId:request.rivalryId,seasonNumber:season,managerRole:role,verdicts:!kept});
903:       if(!result||result.ok!==true)return {ok:false,code:result?.code||"TRANSFER_PROVIDER_FAILED"};
904:       const value=kept||pstcKeepVerdicts(request.rivalryId,season,result.verdicts);
905:       if(!value)return {ok:false,code:"TRANSFER_PROVIDER_STATE_INVALID"};
906:       return {ok:true,verdicts:value,hits:pstcKeepHits(request.rivalryId,season,result.hits)};
907:     }catch(error){return {ok:false,code:error?.code||"TRANSFER_PROVIDER_FAILED"};}
908:   }
909:   // F2-02: the outcome this manager's own mark records, kept on this phone until the mark is on the server (a reload re-sends
910:   // exactly the same one; the Rules accept one write per role and season).
911:   const PSTC_ROULETTE_OUTCOME_KEY="careerModeShowdown.rouletteOutcome.v1";
912:   function pstcOutcomeList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_OUTCOME_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
913:   const pstcOutcomeKey=(request,role)=>`${request.rivalryId}|${request.seasonNumber}|${role}`;
914:   function pstcRememberOutcome(request,role,outcome){
915:     const copy=pstcOutcomeCopy(outcome);if(!request||!role||!copy)return false;
916:     try{const key=pstcOutcomeKey(request,role),list=pstcOutcomeList().filter(item=>item[0]!==key);list.push([key,copy]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_OUTCOME_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
917:     pendingOutcome={key:pstcOutcomeKey(request,role),outcome:copy};return true;
918:   }
919:   let pendingOutcome=null;
920:   function pstcPendingOutcome(request,role){const key=pstcOutcomeKey(request,role);if(pendingOutcome&&pendingOutcome.key===key)return pendingOutcome.outcome;const found=pstcOutcomeList().find(item=>item[0]===key);return found?pstcOutcomeCopy(found[1]):null;}
921:   // ---- RT5-FLOW-02: both spins before the shared window ----
922:   // The roulette applies to every Showdown whose confirm time is readable; any other season passes by itself and never
923:   // writes or waits for a mark.
924:   // The provider's own eligibility rule (it enforces START with it), so the screen and the provider can never disagree.
925:   function pstcRouletteAppliesTo(confirmedAtMs,step){return Boolean(step&&typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(confirmedAtMs));}
926:   // The same answer START gets from the provider: the season is roulette-eligible, or any mark is already stored. The second
927:   // case covers the roulette being switched off (or the season otherwise turning ineligible) after one manager's mark was
928:   // saved: the provider still waits for both, so the missing manager's phone writes his own mark when it reaches this step,
929:   // with no roulette shown (pstcAfterSpin), and the coordinator's START flips through the listener as usual (Codex P2 #1101).
930:   function pstcRouletteApplies(request=pstcRequestContext()){if(pstcSpunRoles().length>0)return true;if(request&&rouletteGate.key===request.key)return rouletteGate.applies;return Boolean(typeof provider?.rouletteEligible==="function"&&provider.rouletteEligible(pstcSetupState()?.setupUpdatedAtMs));}
931:   function pstcSpunRoles(){return Array.isArray(view?.spunRoles)?view.spunRoles.filter(role=>role==="playerOne"||role==="playerTwo"):[];}
932:   // The roles whose mark is still missing for this season's window (empty once it opened, or when the roulette does not apply).
933:   function pstcSpinsMissing(){
934:     const request=pstcRequestContext();if(!view||view.state||!request||viewContextKey!==request.key||!pstcRouletteApplies(request))return [];
935:     const spun=pstcSpunRoles();return ["playerOne","playerTwo"].filter(role=>!spun.includes(role));
936:   }
937:   const SPIN_WRITE_WAIT_MS=8000;
938:   async function pstcAfterSpin(request){
939:     if(!request||rouletteClearedKey!==request.key||!pstcRouletteApplies(request)||view?.state)return;
940:     spinPendingKey=request.key;
941:     let timer;await Promise.race([pstcMarkSpun(request),new Promise(resolve=>{timer=root.setTimeout(resolve,SPIN_WRITE_WAIT_MS);})]).finally(()=>root.clearTimeout(timer));
942:   }
943:   // One merge write of this manager's own mark (no read); idempotent. On success the view shows it at once. A refused write
944:   // (Rules on the server that do not know the marks: they must be deployed with or before this client) is not retried on every
945:   // check; the screen keeps waiting and says to reload, which writes it once more. Any other failure stays pending.
946:   function pstcMarkSpun(request){
947:     if(spinWriting)return spinWriting;
948:     const role=view?.managerRole;
949:     if(!request||spinPendingKey!==request.key||!role||viewContextKey!==request.key||view.state||pstcSpunRoles().includes(role)){if(view?.state||pstcSpunRoles().includes(role))spinPendingKey="";return Promise.resolve(false);}
950:     const run=(async()=>{
951:       const provided=await pstcProviderOptions(request,true);if(!provided?.options||!pstcRequestMatches(request))return false;
952:       const outcome=pstcPendingOutcome(request,role);
953:       let result=await provider.markSpun({...provided.options,managerRole:role,...(outcome?{outcome}:{})});
954:       if(!pstcRequestMatches(request))return false;
955:       // F2-02: a mark is written once. A refusal after an earlier write whose answer was lost: the server already holds it.
956:       if(/permission/i.test(String(result?.code||""))){try{const fresh=await pstcRefreshNow(request,true);if(fresh&&!fresh.state&&pstcSpunRoles().includes(role))result={ok:true};}catch(_error){}}
957:       if(result&&result.ok===true){
958:         spinPendingKey="";spinRefusedKey="";
959:         if(view&&viewContextKey===request.key&&!view.state){const spun=pstcSpunRoles();view={...view,spunRoles:["playerOne","playerTwo"].filter(item=>item===role||spun.includes(item))};}
960:         pstcRender();return true;
961:       }
962:       if(/permission/i.test(String(result?.code||""))&&view&&!view.state){spinPendingKey="";spinRefusedKey=request.key;pstcRender();}
963:       return false;
964:     })().catch(()=>false).finally(()=>{if(spinWriting===run)spinWriting=null;});
965:     spinWriting=run;return run;
966:   }
967:   function pstcCloseRoulette(){try{root.CareerModeChamberMenStep?.close?.();}catch(_error){}try{root.CareerModeSquadSheetStep?.close?.();}catch(_error){}try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}try{root.CareerModeIconGuessStep?.close?.();}catch(_error){}}
968:   function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
969:   // Fable F2-11: an earlier BACK from the roulette is forgotten first. Fable F2-14: the replay of phases this phone did not see
970:   // is set before the screen shows, so it never mounts the live phase first. Fable F2-01: the roulette's card and stage come
971:   // down on every way out, a navigation that fails included.
972:   async function pstcOpenNow(){if(!pstcSharedMarker())return false;try{root.CareerModeRosterRouletteStep?.forgetHome?.();}catch(_error){}await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");if(!await pstcChamberMenFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}if(!await pstcSquadFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}const rouletteGo=await pstcRouletteFirst(request);try{root.CareerModeChamberMenStep?.close?.();}catch(_error){}try{root.CareerModeSquadSheetStep?.close?.();}catch(_error){}if(!rouletteGo||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}if(!await pstcPrimePackFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}let shown=false;try{pstcPrepareReplay();pstcRender();shown=await root.navigateTo("transferChallenge");}finally{pstcCloseRoulette();}if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
973:   async function pstcHandleAction(id){
974:     if(id==="seasonPrimaryAction")return pstcOpen();
975:     if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
976:     if(pstcReplayPhase())return false;
977:     if(id==="startTransferTimer"){if(pstcSpinsMissing().length)return false;return pstcMutate("startWindow");}
978:     if(id==="endTransferTimer")return pstcMutate("requestEndWindow");
979:     if(id==="completeTransferChallenge"){
980:       const phase=view?.state?.phase,role=view?.managerRole;if(phase==="GUESS_ENTRY"){const guesses=pstcBuildGuesses(role);if(!await pstcConfirmPartialLock(guesses.length,"guesses"))return false;return pstcMutate("lockGuesses",{guesses});}if(phase==="SIGNING_ENTRY"){const signings=pstcBuildSignings(role,await pstcBlockedNow(pstcRequestContext(),role));if(!await pstcConfirmPartialLock(signings.length,"signings"))return false;return pstcMutate("lockSignings",{signings});}pstcFail("TRANSFER_PHASE_INVALID");
981:     }
982:     if(id==="continueFromTransfers"){pstcSetError("Season results are not open yet. Tap REFRESH, then try again.");return false;}
983:     return false;
984:   }
985:   function pstcCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pstcSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="seasonPrimaryAction"&&pstcShowdownComplete()){void pstcOpenFinalResult();return;}void pstcHandleAction(target.id).catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer War did not load. Try again."));if(!pstcFormMistake(error))pstcReport("Could not complete that Transfer War action",error);});}
986:   // F1 (fault suite): every season of this Showdown is accepted (or it is closed), so there is no Transfer Challenge left to
987:   // start. With no view of its own the dashboard fell back to "START SEASON 1 TRANSFER CHALLENGE", a button that did nothing.
988:   // It now says VIEW FINAL RESULT and opens the final season's results (Final Winner follows there), or the closed Showdown's
989:   // Champion screen. Decided from what this page already holds (the season count, Terminal Close); no read.
990:   function pstcShowdownComplete(){
991:     try{
992:       const closed=root.CareerModeProductionSharedTerminalClose?.getState?.();if(closed&&closed.phase==="CLOSED"&&closed.terminal===true)return true;
993:       const rivalryId=String(pstcShowdown()?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||""),progression=root.CareerModeProductionSharedMultiSeasonProgression?.getState?.();
994:       return Boolean(rivalryId&&progression?.authoritative===true&&String(progression.rivalryId||"")===rivalryId&&progression.state?.terminal===true);
995:     }catch(_error){return false;}
996:   }
997:   function pstcOpenFinalResult(){const entry=root.CareerModeProductionSharedJourneyEntry;return typeof entry?.openFinalResult==="function"?Promise.resolve(entry.openFinalResult()).catch(error=>{pstcReport("Could not open the final result",error);return false;}):Promise.resolve(false);}
998:   // r90 M1 (MOTION hunt): this season's Chamber Men opens on the next tap, so its 3D files (players, clips, stadium) come
999:   // down now, 1.5 s after the season page shows and at an idle moment (js/chamberMenScene3d.js warm(): fetched only,
1000:   // nothing parsed or drawn). The browser and the app's worker keep them, so a first open on a slow line mounts the 3D pitch
1001:   // inside its wait instead of the drawn goal. Once per season on this page; a fault only skips it.
1002:   let chamberWarmKey="";
1003:   function pstcWarmChamberMen(){
1004:     try{
1005:       if(!view||view.state||!view.managerRole||root.CMS_CHAMBER_MEN_3D==="off"||!root.WebGL2RenderingContext)return;
1006:       const key=pstcCurrentContextKey(),confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
1007:       if(!key||chamberWarmKey===key||!Number.isFinite(confirmedAtMs))return;
1008:       chamberWarmKey=key;
1009:       const clubs={playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")};
1010:       const go=()=>{if(chamberWarmKey!==key||root.document?.visibilityState==="hidden")return;
1011:         pstcLoadScript("chamber-men-3d","js/chamberMenScene3d.js",()=>Boolean(root.CareerModeChamberMen3d)).then(()=>root.CareerModeChamberMen3d?.warm?.({clubs})).catch(()=>{});};
1012:       root.setTimeout(()=>{if(typeof root.requestIdleCallback==="function")root.requestIdleCallback(go,{timeout:2500});else go();},1500);
1013:     }catch(_error){}
1014:   }
1015:   const pstcDecorateLiveDashboard=pstcDecorateDashboard;
1016:   // The live decoration stays exactly as it is; only a complete Showdown's button and status are replaced after it.
1017:   pstcDecorateDashboard=function(){
1018:     const decorated=pstcDecorateLiveDashboard();if(decorated&&!openPromise&&!pstcShowdownComplete())pstcWarmChamberMen();
1019:     if(!decorated||openPromise||!pstcShowdownComplete())return decorated;
1020:     const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus");
1021:     if(button){button.textContent="VIEW FINAL RESULT";button.disabled=false;}
1022:     if(status)status.textContent="Showdown complete";
1023:     return true;
1024:   };
1025:   // r87: a form mistake caught on this phone is shown on the card only; a second toast covered the signing rows on phones.
1026:   function pstcFormMistake(error){return Boolean(error)&&error.providerResult!==true&&(error.code==="TRANSFER_SIGNINGS_INVALID"||error.code==="TRANSFER_GUESSES_INVALID"||error.plain===true);}
1027:   async function pstcTick(light=false){
1028:     if(!pstcSharedMarker()||root.document?.visibilityState==="hidden")return;
1029:     const currentKey=pstcCurrentContextKey();if(viewContextKey&&(!currentKey||viewContextKey!==currentKey))pstcClearCachedContext();
1030:     // RS-04 (r87): a COMPLETED view is final, except while this page has neither its verdicts nor a kept copy (a post-lock refresh
1031:     // that failed): then the next check reads it once more, while both managers are still on this screen, instead of the roulette
1032:     // paying a slower read of it next season on one phone only.
1033:     if(view?.state?.phase==="COMPLETED"&&viewContextKey&&currentKey&&viewContextKey===currentKey&&(view.verdicts||pstcKeptVerdicts(view.rivalryId,view.seasonNumber))){pstcDecorateDashboard();return;}
1034:     try{if(!pstcConfirmedShared()||!pstcCareerReady()){await pstcEnsureDependencies();await setupApi.refresh();await careerApi.refresh();}if(pstcConfirmedShared()&&pstcCareerReady()&&!busy){const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden")){if(light!==true)pstcScreenFresh();await pstcRefresh(light===true,false);}else if(!view)await pstcRefresh(false,false);else pstcDecorateDashboard();}
1035:       // RT5-FLOW-02: a mark that did not reach the server is written again (one write, no read) while the window is still shut.
1036:       // Once this phone's own roulette is finished or does not apply (rouletteClearedKey, never the partner's mark alone), a
1037:       // partner's mark arriving while his own is missing arms his own one write, unless the server refused it on this page.
1038:       const request=pstcRequestContext();if(request&&rouletteClearedKey===request.key&&!busy&&view&&!view.state&&viewContextKey===request.key&&spinPendingKey!==request.key&&spinRefusedKey!==request.key&&view.managerRole&&pstcSpunRoles().length&&!pstcSpunRoles().includes(view.managerRole))spinPendingKey=request.key;
1039:       if(request&&spinPendingKey===request.key&&!busy&&view&&!view.state)void pstcMarkSpun(request);
1040:     }catch(_error){}
1041:   }
1042:   // Read-only: the fast lane only calls pstcTick (the same provider read as REFRESH), never a write.
1043:   function pstcWaitingKey(){
1044:     if(!view||!view.managerRole||!pstcTransferScreenVisible()||pstcReplayPhase())return "";
1045:     const state=view.state||{phase:"NOT_STARTED"},role=view.managerRole,other=role==="playerOne"?"playerTwo":"playerOne",has=(list,item)=>Array.isArray(list)&&list.includes(item);
1046:     if((state.phase||"NOT_STARTED")==="NOT_STARTED"&&view.setup?.coordinatorRole&&role!==view.setup.coordinatorRole)return `${viewContextKey}|start`;
1047:     if(state.phase==="WINDOW_OPEN"&&has(state.endRequestedRoles,role)&&!has(state.endRequestedRoles,other))return `${viewContextKey}|end`;
1048:     if(state.phase==="GUESS_ENTRY"&&has(state.guessLockedRoles,role))return `${viewContextKey}|guesses`;
1049:     if(state.phase==="SIGNING_ENTRY"&&has(state.signingLockedRoles,role))return `${viewContextKey}|signings`;
1050:     return "";
1051:   }
1052:   function pstcFastPollDue(){const key=pstcWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
1053:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
1054:   // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
1055:   function pstcWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pstcWaitingKey()||pstcLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`:null)(pstcRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pstcWaitingKey()&&pstcLiveScreen());}catch(_error){relaxed=false;}budget.watchWaitPoint("transfer",path,pstcWaitWake,{relaxed});}
1056:   // r75: the 15 s check of the visible Transfer screen always reads the shared challenge from the server, so a partner's
1057:   // lock still shows within one poll on the screen the manager is looking at; checks from other screens reuse recent reads.
1058:   // r84: the listener also watches while the window, guesses or signings are open on screen (not only after this manager's own
1059:   // move): 15 s fresh reads of this document were ~32 billed reads/min for both phones over a 25-40 minute transfer window.
1060:   // r84 trim: also before the window starts (no challenge yet), the most expensive idle: the coordinator's own START screen
1061:   // re-read the context every 15 s; the listener now watches the (still missing) challenge document instead.
1062:   function pstcLiveScreen(){try{return Boolean(view&&view.managerRole&&pstcTransferScreenVisible()&&!pstcReplayPhase()&&(!view.state||["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"].includes(view.state.phase)));}catch(_error){return false;}}
1063:   function pstcScreenFresh(){try{const request=pstcRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
1064:   function pstcWaitWake(){if(!busy){void pstcTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pstcTick(true);},400);}
1065:   // r84 trim: like Results and Commit, the 3 s fallback check stands down while the wait listener on this exact challenge is
1066:   // healthy; the listener's delivery wakes pstcTick at once and the 15 s check still runs. Each fallback check re-ran the
1067:   // read-only transaction (challenge, rivalry, session, own role) about 20 times a minute on the waiting phone.
1068:   function pstcWaitHealthy(){const request=pstcRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`);}
1069:   function pstcFastTick(){pstcWatchWait();if(pstcWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pstcFastPollDue())return;void pstcTick(true);}
1070:   // Listen during bubbling so selector target handlers normalize the ID before the synchronous draft save.
1071:   // Red team R87-B-04: a second tab of the same signing entry saved a newer draft. This tab takes it over before its next
1072:   // autosave, so a stale form never writes over the newer signings (the browser sends this event only to the other tabs).
1073:   function pstcSigningDraftStorage(event){const role=view?.managerRole,key=role&&pstcSigningDraftKey(role);if(!key||event?.key!==key||!event.newValue)return;if(view?.state?.phase!=="SIGNING_ENTRY"||view.state.signingLockedRoles?.includes(role)||pstcReplayPhase())return;pstcRestoreSigningDraft(role,view.ownInputs||null,true);}
1074:   function pstcSigningDraftChange(event){const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!target.id.startsWith(`${pstcRolePrefix(role)}Signing`))return;if(view?.state?.phase==="SIGNING_ENTRY"&&!view.state.signingLockedRoles?.includes(role))pstcSaveSigningDraft(role);}
1075:   function pstcTimerTick(){if(!pstcSharedMarker()||pstcReplayPhase()||pstcExpiryPaused())return;const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden"))pstcRenderTimer();}
1076:   function pstcVisibilityChange(){
1077:     if(!pstcSharedMarker())return;
1078:     if(root.document?.visibilityState==="hidden"){if(view?.state?.phase==="WINDOW_OPEN")expiryNeedsAuthority=true;return;}
1079:     if(view?.state?.phase!=="WINDOW_OPEN"||pstcReplayPhase()){expiryNeedsAuthority=false;void pstcTick();return;}
1080:     // Keep the shared deadline; refresh its clock and authority before expiry may act again.
1081:     pstcClearClock();expiryNeedsAuthority=true;pstcScreenFresh();void pstcRefresh().catch(()=>{});
1082:   }
1083:   function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("transfer-player-pick",pstcPlayerPick);root.document.addEventListener("focusin",pstcPlayerFocus);root.document.addEventListener("input",pstcSigningDraftChange);root.document.addEventListener("change",pstcSigningDraftChange);if(typeof root.addEventListener==="function")root.addEventListener("storage",pstcSigningDraftStorage);root.document.addEventListener("input",pstcGuessDraftChange,true);root.document.addEventListener("change",pstcGuessDraftChange,true);root.document.addEventListener("visibilitychange",pstcVisibilityChange);}root.addEventListener?.("online",pstcVisibilityChange);root.addEventListener?.("career-mode-shared-season-cursor-change",()=>{pstcClearCachedContext();void pstcTick();});if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pstcTick(),POLL_MS);timerLoop=root.setInterval(pstcTimerTick,TIMER_MS);root.setInterval(pstcFastTick,FAST_POLL_MS);}if(pstcSharedMarker())void pstcTick();return true;}
1084: 
1085:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",rouletteBlocked:pstcRouletteBlocked,blockedFor:pstcBlockedFor,nameKey:pstcNameKey,blockedSignings:async()=>[...(await pstcBlockedNow()).values()],productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),spinsMissing:()=>[...pstcSpinsMissing()],rouletteError:()=>rouletteError||(primePackLoadError?PSTC_PRIME_PACK_TEXT:""),rouletteAppliesTo:pstcRouletteAppliesTo,install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute,canResumeResults:pstcCanResumeResults,rememberResultsView:pstcRememberResultsView,verdictsUnseen:pstcVerdictsUnseen,squadError:()=>squadError,squadAfterTransfers:pstcSquadAfterTransfers});
1086: });
1087: 
```

(End of packet FJ2. Answer with the report only.)
