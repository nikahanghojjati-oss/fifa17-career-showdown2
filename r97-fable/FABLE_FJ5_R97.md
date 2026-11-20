# Fable 5.2 red-team job FJ5: Season results: entering and publishing

You are an independent red-team reviewer. Read only the code in this file. Change nothing, write no patches longer than 5 lines.

## The game in 8 lines
A private two-player FIFA 17 career "Showdown" between exactly two managers, Nik and Daniel, each on his own phone or Chromebook, sharing one Firebase Firestore database (Spark free tier: every read and write counts). A Showdown is 1, 3, 5 or 10 seasons. Each season runs in a fixed order that is never skipped: Roulette (squad shot) -> Prime Pack (guess a masked player, 4/3/2/1 points, one winner or none) -> Transfer War (15-minute shared window on the server clock, private signings) -> season played in FIFA -> each manager enters and publishes his own result -> both tap CONFIRM SEASON -> ONE shared season commit -> next season, or Terminal Close and Final Winner after the last season. Sacked: either manager ticks it on Season Results and the Showdown ends after that season; points so far decide. Equal points are a DRAW: there is no tiebreak anywhere. Golden Showdown = 150 points over 10 seasons; perfect season = 15. Finished Showdowns feed History and career totals; unfinished or ended-early ones that never finished stay out.

## Code
Repo nikahanghojjati-oss/fifa17-career-showdown2, commit 4b4bde47 (release 2.10.0). Every file below is the exact file at that commit, each line prefixed with its line number. Rules files are Firestore security rules fragments that are composed into the deployed rules.

## Threat model (important)
This is a private two-player tool. Out of scope: anything that needs a modified app, hand-made Firestore requests, a third person, a stolen account, or "an attacker". In scope: anything that can happen in NORMAL play on the real app: two phones acting at the same instant, double taps, retries after a network error, a phone offline or asleep, a tab killed or reloaded at any moment, a phone joining late, a phone clock that is minutes off, a slow network, an older app version on one phone.

## What counts as a finding
A finding must give: (1) what the player sees, (2) an exact sequence of normal actions that causes it, (3) the file:line(s) in THIS packet that cause it, with a short quote, (4) severity, (5) a one-line fix idea. You cannot run the code, so label each finding TRACED (you followed every step through the quoted code and are sure) or UNSURE (it depends on code not in this packet, or timing you could not settle; say exactly what). Never present a guess as a bug. Before reporting, try to refute each finding yourself by looking for the guard that would stop it; drop it if you find one.
Severity: P0 = the game cannot continue, for good, or data is lost; P1 = a step is blocked, or a wrong result/score/winner sticks; P2 = wrong but recoverable (a reload fixes it); P3 = cosmetic or wording.

## Do not report
Style, naming, refactors, performance unless it costs Firebase reads in normal play (then give the count), looks/fonts/layout, missing comments, tests, and anything in "Known" below. At most 8 findings; stop when you have 3 TRACED P0/P1.

## Report format (plain words, one markdown answer)
First line: VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
Then one block per finding: ID (FJ5-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Can a manager's published result be changed, lost or overwritten by the other phone, or by his own second tap or retry?
2. When both have published, does each phone reliably show CONFIRM SEASON, including after a reload, a failed read, or one phone offline at the moment the other published?
3. Is the Sacked tick carried correctly into what is published, from either manager?
4. Europa League +3 and Champions League +5, never both: can both be applied, or the wrong one?
5. Does any normal step get permission-denied from the Rules, or pass a value the Rules should have refused?

## Known (do not report)
None.

## Files

## FILE: js/productionSharedSeasonResults.js (309 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedSeasonResults=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   // Job 33 (R1): after publishing, read every 3 s for at most 3 minutes while the rival has not published yet.
10:   const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
11:   let fastWaitKey="",fastWaitSince=0;
12:   const CONTROL_IDS=Object.freeze(["completeSeason","confirmSeasonCompletion","editSeasonResults"]);
13:   // r80: EuropaLeague is a check like the others (index >= 3). One manager plays the Champions League or the Europa League in a
14:   // season, never both: ticking one unticks the other (pssrContinental), and the read refuses both. The two managers play different
15:   // FIFA saves, so nothing is ever compared across them.
16:   // r89 Sacked (Nik 2026-11-03): each manager ticks only his own "I was sacked" (his card is the only one he can edit). Any
17:   // sacking ends the Showdown after this season; the points so far decide. Stored as the sparse result key sacked:true (an
18:   // unticked box leaves the result unchanged), shown once the Showdown's confirm time is known,
19:   // and PUBLISH asks once more before a sacked result goes in (it is final).
20:   const RESULT_SUFFIXES=Object.freeze(["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","EuropaLeague","TopScorer","TopAssist","Sacked"]);
21:   const SPARSE_CHECKS=Object.freeze(["EuropaLeague","Sacked"]);
22:   let formContextKey="",installed=false,busy=false,provider=null,setupApi=null,transferApi=null,catalogApi=null,view=null,draft=null,pollTimer=null,providerChain=Promise.resolve(),refreshPromise=null,contextKey="",renderedContextKey="",errorNode=null,errorMessage="";
23: 
24:   function pssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
25:   function pssrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
26:   function pssrSharedMarker(){const showdown=pssrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
27:   function pssrReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
28:   function pssrField(id){return root.document&&root.document.getElementById(id);}
29:   function pssrText(id,value){const node=pssrField(id);if(node)node.textContent=String(value??"");return node;}
30:   function pssrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
31:   function pssrDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
32:   function pssrLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
33:   async function pssrEnsureDependencies(){
34:     if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
35:     else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
36:     await pssrLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
37:     await pssrLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
38:     await pssrLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
39:     await pssrLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
40:     await pssrLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
41:     await pssrLoadScript("ssjr-season-results-provider","js/sparkSharedSeasonResults.js",()=>root.CareerModeSparkSharedSeasonResults);
42:     await pssrLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
43:     setupApi=root.CareerModeProductionSharedShowdownSetup;transferApi=root.CareerModeProductionSharedTransferChallenge;provider=root.CareerModeSparkSharedSeasonResults;catalogApi=root.CareerModeSharedShowdownCatalog;
44:     if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pssrFail("SEASON_RESULTS_SETUP_UNAVAILABLE");
45:     if(!transferApi||typeof transferApi.refresh!=="function"||typeof transferApi.getState!=="function")pssrFail("SEASON_RESULTS_TRANSFER_UNAVAILABLE");
46:     if(!provider||typeof provider.read!=="function"||typeof provider.publishResult!=="function")pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
47:   }
48:   function pssrSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pssrShowdown()?.currentRound,season=Number(pssrSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pssrFail("SEASON_RESULTS_SEASON_INVALID");return season;}
49:   function pssrRolePrefix(role){return role==="playerOne"?"p1":"p2";}
50:   function pssrOtherRole(role){return role==="playerOne"?"playerTwo":"playerOne";}
51:   function pssrManagerName(role){const showdown=pssrShowdown();return showdown?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
52:   function pssrSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
53:   // r89 Sacked: the tick shows once the Showdown's confirm time is known.
54:   function pssrSackedApplies(){return Number.isFinite(pssrSetupState()?.setupUpdatedAtMs);}
55:   // r89 Sacked (Codex C3): a 2.1.0 phone cannot read a sacked result (it stops with its own error until it updates; nothing is
56:   // lost). Only a 2.2.0 phone can tick, so the phone that published the sacking says what the rival must do while it waits.
57:   // The running build's version (APP_VERSION from js/app.js), so this text never goes stale at a version bump.
58:   function pssrAppVersion(){return typeof APP_VERSION==="string"&&APP_VERSION.trim()?APP_VERSION.trim():"2.2.0";}
59:   function pssrSackedUpdateHint(rivalRole){return ` If ${pssrManagerName(rivalRole)}'s phone shows an error, ${pssrManagerName(rivalRole)} opens Settings and taps UPDATE TO LATEST VERSION (${pssrAppVersion()}); play then carries on.`;}
60:   function pssrShowSackedChecks(){const show=pssrSackedApplies();root.document?.querySelectorAll?.("#seasonEntry .sackedCheck")?.forEach?.(label=>pssrHidden(label,!show));if(!show)for(const prefix of ["p1","p2"]){const input=pssrField(`${prefix}Sacked`);if(input)input.checked=false;}return show;}
61:   function pssrTransferState(){try{return transferApi?.getState?.()||null;}catch(_error){return null;}}
62:   function pssrClubName(role){const setup=pssrSetupState()?.setup||pssrTransferState()?.setup;return setup?.clubs?.[role]||pssrShowdown()?.clubs?.[role]||"Club";}
63:   function pssrRequestContext(){
64:     const showdown=pssrShowdown(),setup=pssrSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;
65:     try{seasonNumber=pssrSeason();}catch(_error){return null;}
66:     const saveId=String(showdown?.id||showdown?.saveId||"").trim();
67:     const key=rivalryId&&seasonNumber?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";
68:     return key?Object.freeze({key,rivalryId,seasonNumber}):null;
69:   }
70:   function pssrContextMatches(request){const current=pssrRequestContext();return Boolean(request&&current&&request.key===current.key);}
71:   function pssrTransferComplete(request){const transfer=pssrTransferState();return Boolean(request&&transfer&&Number(transfer.seasonNumber)===request.seasonNumber&&transfer.state&&transfer.state.phase==="COMPLETED");}
72:   // F1 (fault suite): after a reload or in a stale tab, a closed Showdown's Champion screen is this screen (js/seasonFinalV10.js
73:   // draws Final Winner from Terminal Close's verified witness), so the route allows it while Terminal Close holds it CLOSED.
74:   function pssrClosedChampion(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(pssrSharedMarker()&&t&&t.phase==="CLOSED"&&t.terminal===true&&t.terminalWitness);}catch(_error){return false;}}
75:   function pssrCanRoute(){if(pssrClosedChampion())return true;const request=pssrRequestContext();return Boolean(pssrSharedMarker()&&request&&contextKey===request.key&&view&&view.managerRole&&view.rivalryId===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber&&pssrTransferComplete(request));}
76:   function pssrResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Season Results request was rejected.");error.code=result&&result.code||"SEASON_RESULTS_PROVIDER_FAILED";throw error;}
77:   // JOB-1611: provider codes that mean "contended", not "refused": Firestore lock contention after the SDK's own retries.
78:   const PSSR_CONTENTION_CODES=Object.freeze(["aborted","failed-precondition","permission-denied","firestore/permission-denied","permission_denied"]);
79:   const PSSR_CONTENTION_RETRY_MS=Object.freeze([500,1000,1500]);
80:   const PSSR_BACK_MS=1000,PSSR_BACK_TRIES=600,PSSR_BACK_FAILED="Your result was not confirmed. Check the connection and tap CONFIRM MY RESULT again.";
81:   const PSSR_DENIED_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied"]),PSSR_READ_RETRY_CODES=Object.freeze([...PSSR_CONTENTION_CODES,"unavailable","deadline-exceeded","SEASON_RESULTS_PROVIDER_UNAVAILABLE","SEASON_RESULTS_PROVIDER_FAILED"]);
82:   function pssrWait(ms){return new Promise(resolve=>{const timer=typeof root.setTimeout==="function"?root.setTimeout:setTimeout;timer(resolve,ms);});}
83:   // JOB-1611: the reads inside a publish meet the same contention; they get the same bounded wait before failing as before.
84:   async function pssrPublishRead(ctx,request){let read=await provider.read(ctx.options);for(let retry=0;read?.ok!==true&&PSSR_CONTENTION_CODES.includes(read?.code)&&retry<PSSR_CONTENTION_RETRY_MS.length&&pssrContextMatches(request);retry+=1){await pssrWait(PSSR_CONTENTION_RETRY_MS[retry]);read=await provider.read(ctx.options);}return pssrResultError(read,"Season Results could not be refreshed before confirming.");}
85:   function pssrQueueProvider(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
86:   // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the COMPLETED Transfer Challenge.
87:   async function pssrProviderContext(request=pssrRequestContext(),light=false){
88:     if(!pssrSharedMarker())pssrFail("SEASON_RESULTS_SHARED_MODE_REQUIRED");
89:     if(!request||!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
90:     await pssrEnsureDependencies();
91:     if(!(light===true&&pssrSetupState()?.ready===true&&pssrTransferComplete(request))){
92:       await setupApi.refresh();if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
93:       try{await transferApi.refresh();}catch(error){if(!(pssrContextMatches(request)&&pssrTransferComplete(request)))throw error;}if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
94:     }
95:     if(!pssrTransferComplete(request))pssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE","Finish the Transfer War before confirming Season Results.");
96:     const setup=pssrSetupState();
97:     if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
98:     const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
99:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE","The online service is unavailable.");
100:     return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
101:   }
102:   async function pssrRefreshNow(request=pssrRequestContext(),light=false){
103:     if(!request)return null;
104:     const ctx=await pssrProviderContext(request,light);if(!pssrContextMatches(request))return null;
105:     const result=pssrResultError(await provider.read(ctx.options),"Season Results could not be loaded.");if(!pssrContextMatches(request))return null;
106:     view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;pssrRender();
107:     if(result.ownResult||result.state?.phase==="RESULTS_READY")pssrSetError("");
108:     return view;
109:   }
110:   function pssrRefresh(light=false){const request=pssrRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pssrQueueProvider(()=>pssrRefreshNow(request,light===true));refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
111:   function pssrRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_result_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
112:   function pssrTeamCount(){const stateCount=view?.state?.teamCount;if(Number.isInteger(stateCount)&&stateCount>=2&&stateCount<=20)return stateCount;const leagueId=view?.setup?.leagueId||pssrSetupState()?.setup?.leagueId,catalog=catalogApi?.catalog;const clubs=catalog&&leagueId?catalog[leagueId]:null;return Array.isArray(clubs)&&clubs.length>=2&&clubs.length<=20?clubs.length:20;}
113:   function pssrReadForm(role){
114:     const prefix=pssrRolePrefix(role),position=pssrField(`${prefix}LeaguePosition`),points=pssrField(`${prefix}LeaguePoints`),goals=pssrField(`${prefix}LeagueGoals`);
115:     if(!position||!points||!goals||position.value===""||points.value===""||goals.value==="")pssrFail("SEASON_RESULTS_FORM_INCOMPLETE",`Enter league position, league points and league goals for ${pssrManagerName(role)}.`);
116:     const result={leaguePosition:Number(position.value),leaguePoints:Number(points.value),leagueGoals:Number(goals.value),domesticCup:Boolean(pssrField(`${prefix}DomesticCup`)?.checked),championsLeague:Boolean(pssrField(`${prefix}ChampionsLeague`)?.checked),topScorer:Boolean(pssrField(`${prefix}TopScorer`)?.checked),topAssist:Boolean(pssrField(`${prefix}TopAssist`)?.checked)};
117:     // The stored result carries europaLeague only when it is true (the sparse key; an unticked box leaves the 7-key r79 shape).
118:     if(pssrField(`${prefix}EuropaLeague`)?.checked===true){if(result.championsLeague)pssrFail("SEASON_RESULTS_CONTINENTAL_CONFLICT",`${pssrManagerName(role)}: pick Champions League or Europa League, not both.`);result.europaLeague=true;}
119:     if(pssrSackedApplies()&&pssrField(`${prefix}Sacked`)?.checked===true)result.sacked=true;
120:     const teamCount=pssrTeamCount(),maxPoints=(teamCount-1)*2*3;
121:     if(!Number.isInteger(result.leaguePosition)||result.leaguePosition<1||result.leaguePosition>teamCount)pssrFail("SEASON_RESULTS_POSITION_INVALID",`${pssrManagerName(role)}'s league position must be a whole number from 1 to ${teamCount}.`);
122:     if(!Number.isInteger(result.leaguePoints)||result.leaguePoints<0||result.leaguePoints>maxPoints)pssrFail("SEASON_RESULTS_POINTS_INVALID",`${pssrManagerName(role)}'s league points must be a whole number from 0 to ${maxPoints}.`);
123:     if(!Number.isInteger(result.leagueGoals)||result.leagueGoals<0||result.leagueGoals>300)pssrFail("SEASON_RESULTS_GOALS_INVALID",`${pssrManagerName(role)}'s league goals must be a whole number from 0 to 300.`);
124:     return Object.freeze(result);
125:   }
126:   function pssrFingerprint(result){return JSON.stringify({leaguePosition:Number(result.leaguePosition),leaguePoints:Number(result.leaguePoints),leagueGoals:Number(result.leagueGoals),domesticCup:Boolean(result.domesticCup),championsLeague:Boolean(result.championsLeague),topScorer:Boolean(result.topScorer),topAssist:Boolean(result.topAssist),europaLeague:result.europaLeague===true,sacked:result.sacked===true});}
127:   function pssrPopulate(role,result){if(!result)return;const prefix=pssrRolePrefix(role);pssrField(`${prefix}LeaguePosition`).value=String(result.leaguePosition);pssrField(`${prefix}LeaguePoints`).value=String(result.leaguePoints);pssrField(`${prefix}LeagueGoals`).value=String(result.leagueGoals);for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["EuropaLeague","europaLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"],["Sacked","sacked"]]){const input=pssrField(`${prefix}${suffix}`);if(input)input.checked=result[key]===true;}}
128:   function pssrDisableRole(role,disabled){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach(suffix=>pssrDisable(pssrField(`${prefix}${suffix}`),disabled));}
129:   // QoL 3: a half-typed result survives a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on publish.
130:   function pssrDraftFieldIds(role){const prefix=pssrRolePrefix(role);return RESULT_SUFFIXES.map(suffix=>`${prefix}${suffix}`);}
131:   function pssrDraftKey(role,request=pssrRequestContext()){return request&&(role==="playerOne"||role==="playerTwo")?`cms.draft.v1:${request.rivalryId}:${request.seasonNumber}:${role}:seasonResult`:"";}
132:   function pssrDraftClear(role,request=pssrRequestContext()){const key=pssrDraftKey(role,request);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
133:   function pssrDraftSave(){
134:     const request=pssrRequestContext(),role=view?.managerRole;
135:     const key=pssrDraftKey(role,request);if(!key||contextKey!==request.key||view.ownResult||view.state?.phase==="RESULTS_READY"||typeof root.writeStorageValue!=="function")return false;
136:     const prefix=pssrRolePrefix(role),values={},checks={};let any=false;
137:     RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){values[suffix]=String(input.value||"");if(values[suffix])any=true;}else if(!SPARSE_CHECKS.includes(suffix)||input.checked){checks[suffix]=Boolean(input.checked);if(checks[suffix])any=true;}});
138:     if(!any){pssrDraftClear(role,request);return true;}
139:     return root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,values,checks}))===true;
140:   }
141:   function pssrDraftRestore(role){
142:     const request=pssrRequestContext(),key=pssrDraftKey(role,request);if(!key||typeof root.readStorageValue!=="function")return false;
143:     let saved;try{saved=JSON.parse(root.readStorageValue(key)||"null");}catch(_error){return false;}
144:     if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role)return false;
145:     const prefix=pssrRolePrefix(role),values=saved.values&&typeof saved.values==="object"?saved.values:{},checks=saved.checks&&typeof saved.checks==="object"?saved.checks:{};
146:     RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){if(input.value===""&&typeof values[suffix]==="string")input.value=values[suffix].slice(0,12);}else if(!input.checked&&checks[suffix]===true)input.checked=true;});
147:     return true;
148:   }
149:   function pssrContinental(id){const match=/^(p[12])(ChampionsLeague|EuropaLeague)$/.exec(String(id||""));if(!match||pssrField(id)?.checked!==true)return;const other=pssrField(`${match[1]}${match[2]==="ChampionsLeague"?"EuropaLeague":"ChampionsLeague"}`);if(other?.checked)other.checked=false;}
150:   function pssrDraftChange(event){const role=view?.managerRole,id=event?.target?.id;pssrContinental(id);if(!role||!id||!pssrSharedMarker()||!pssrDraftFieldIds(role).includes(id))return;pssrDraftSave();}
151:   function pssrCard(role){const input=pssrField(`${pssrRolePrefix(role)}LeaguePosition`);return input&&input.closest?input.closest(".seasonResultCard"):null;}
152:   function pssrSetError(message=""){
153:     const value=String(message||"");
154:     if(!value){if(errorNode&&errorNode.textContent===errorMessage)errorNode.textContent="";errorNode=null;errorMessage="";return;}
155:     const panel=pssrField("seasonReviewPanel"),target=panel&&!panel.classList.contains("hidden")?pssrField("seasonReviewError"):pssrField("seasonEntryError");
156:     if(target){target.textContent=value;errorNode=target;errorMessage=value;}
157:   }
158:   function pssrAppendLine(container,label,value){const row=root.document.createElement("div"),name=root.document.createElement("span"),data=root.document.createElement("strong");row.className="summaryLine seasonReviewLine";name.textContent=label;data.textContent=String(value);row.append(name,data);container.append(row);}
159:   // r86: the published card shows the manager's Special Player under the name, as the entry card does (none before r86).
160:   function pssrSpecialPlayerSlot(role){try{const api=root.CareerModeSpecialPlayerChip,sp=api?.live?.(),chip=sp?api.element(root.document,sp[role==="playerOne"?"daniel":"nik"]):null;if(!chip)return null;const slot=root.document.createElement("span");slot.className="seasonSpecialPlayer";slot.appendChild(chip);return slot;}catch(_error){return null;}}
161:   function pssrRenderReviewCard(container,role,result){if(!container||!result)return;const fragment=root.document.createDocumentFragment(),heading=root.document.createElement("h3"),club=root.document.createElement("p"),special=pssrSpecialPlayerSlot(role);heading.textContent=pssrManagerName(role);club.className="summaryClub";club.textContent=pssrClubName(role);fragment.append(heading);if(special)fragment.append(special);fragment.append(club);pssrAppendLine(fragment,"League Position",result.leaguePosition);pssrAppendLine(fragment,"League Points",result.leaguePoints);pssrAppendLine(fragment,"League Goals",result.leagueGoals);const achievements=root.document.createElement("div");achievements.className="seasonReviewAchievements";[["Champions League",result.championsLeague],["Europa League",result.europaLeague===true],["Domestic Cup",result.domesticCup],["Top Scorer",result.topScorer],["Top Assist",result.topAssist]].forEach(([label,active])=>{const item=root.document.createElement("span");item.className=active?"isEarned":"isNotEarned";item.textContent=`${active?"✓":"—"} ${label}`;achievements.append(item);});fragment.append(achievements);if(result.sacked===true){const stamp=root.document.createElement("p");stamp.className="seasonReviewSacked";stamp.textContent="SACKED THIS SEASON";fragment.append(stamp);}container.replaceChildren(fragment);}
162:   function pssrEntryMode(reviewing){const panel=pssrField("seasonReviewPanel"),grid=root.document?.querySelector?.("#seasonEntry .seasonEntryGrid"),hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint"),actions=pssrField("completeSeason")?.closest?.(".seasonEntryActions");pssrHidden(panel,!reviewing);pssrHidden(grid,reviewing);pssrHidden(hint,reviewing);pssrHidden(actions,reviewing);if(pssrField("seasonEntry"))pssrField("seasonEntry").dataset.sharedSeasonResults=reviewing?"review":"entry";}
163:   function pssrRenderReview(result,{waiting=false,ready=false}={}){
164:     const role=view?.managerRole,other=pssrOtherRole(role),one=pssrField("seasonReviewOne"),two=pssrField("seasonReviewTwo"),ownCard=role==="playerOne"?one:two,otherCard=role==="playerOne"?two:one,confirm=pssrField("confirmSeasonCompletion"),edit=pssrField("editSeasonResults"),overall=pssrField("seasonReviewOverallScore")?.closest?.(".seasonReviewOverall"),warning=root.document?.querySelector?.("#seasonReviewPanel .seasonReviewWarning");
165:     pssrEntryMode(true);pssrHidden(overall,true);pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonReviewHeading",ready?"BOTH MANAGERS CONFIRMED":waiting?"YOUR RESULT IS CONFIRMED":"REVIEW YOUR SEASON RESULT");pssrText("seasonReviewStatusMeta",ready?"":waiting?"CONFIRMED · WAITING FOR YOUR RIVAL":"NOT CONFIRMED YET");pssrHidden(pssrField("seasonReviewStatusMeta")?.closest?.(".seasonReviewStatus"),ready);
166:     pssrRenderReviewCard(ownCard,role,result);pssrHidden(ownCard,false);
167:     if(ready&&view?.opponentResult){pssrRenderReviewCard(otherCard,other,view.opponentResult);pssrHidden(otherCard,false);pssrText("seasonReviewResult","Both managers confirmed their FIFA 17 season results.");}
168:     else{pssrHidden(otherCard,true);pssrText("seasonReviewResult",waiting?`Your rival sees this only after confirming theirs. This screen updates by itself.${result?.sacked===true?pssrSackedUpdateHint(other):""}`:"Check your results. Once confirmed, they are final.");}
169:     // Job 33 (R8): once both published, the Shared Season Commit status below is the one banner that says what to tap next.
170:     const sacked=!waiting&&!ready&&result?.sacked===true,armed=sacked&&draft?.sackedConfirmed===true,total=Number(view?.setup?.totalSeasons||pssrSetupState()?.setup?.totalSeasons)||null,season=view?.seasonNumber||pssrSeason();
171:     if(warning){pssrHidden(warning,ready);if(!ready)warning.textContent=sacked?`SACKED: THIS SHOWDOWN ENDS AFTER SEASON ${season}${total?` OF ${total}`:""} · THE POINTS SO FAR DECIDE · BOTH PHONES NEED VERSION ${pssrAppVersion()} · CONFIRMING IS FINAL`:"CONFIRMING IS FINAL";}
172:     if(confirm){pssrHidden(confirm,ready);pssrDisable(confirm,busy||waiting);confirm.textContent=waiting?"RESULT CONFIRMED ✓":armed?"YES, I WAS SACKED · CONFIRM":sacked?"CONFIRM · I WAS SACKED":"CONFIRM MY RESULT";confirm.classList.toggle("isSackedConfirm",armed);}
173:     if(edit){pssrHidden(edit,ready||waiting);pssrDisable(edit,busy);edit.textContent="EDIT MY RESULT";}
174:   }
175:   function pssrRenderEntry(){
176:     const role=view?.managerRole;if(!role)return;const other=pssrOtherRole(role),own=view?.ownResult||null,ready=view?.state?.phase==="RESULTS_READY";
177:     pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonManagerOne",pssrManagerName("playerOne"));pssrText("seasonManagerTwo",pssrManagerName("playerTwo"));pssrText("seasonClubOne",pssrClubName("playerOne"));pssrText("seasonClubTwo",pssrClubName("playerTwo"));
178:     if(own)pssrPopulate(role,own);if(ready&&view?.opponentResult)pssrPopulate(other,view.opponentResult);
179:     if(own||ready){pssrDraftClear(role);pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(own||view?.allResults?.[role],{waiting:!ready,ready});return;}
180:     if(draft&&draft.contextKey===contextKey&&draft.seasonNumber===view.seasonNumber&&draft.managerRole===role){pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(draft.result);return;}
181:     pssrEntryMode(false);pssrHidden(pssrCard(role),false);pssrHidden(pssrCard(other),true);pssrShowSackedChecks();pssrDraftRestore(role);if(!pssrSackedApplies()){const input=pssrField(`${pssrRolePrefix(role)}Sacked`);if(input)input.checked=false;}pssrDisableRole(role,false);pssrDisableRole(other,true);const complete=pssrField("completeSeason");if(complete){complete.textContent="REVIEW MY SEASON RESULT";pssrDisable(complete,busy);}const hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint");if(hint)hint.textContent=`Enter ${pssrManagerName(role)}'s FIFA 17 season result. Your rival enters theirs on their own device.`;
182:   }
183:   // H1017-4: a new shared season or manager role starts from an empty form for both managers. Same-context polls keep typed input.
184:   // formContextKey is the last context the form was rendered for; the tick's context reset leaves it alone so the change is still seen.
185:   function pssrClearForm(){for(const role of ["playerOne","playerTwo"]){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3)input.value="";else input.checked=false;});}}
186:   // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
187:   // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
188:   let pssrWatchedKey=null;
189:   function pssrWatchSync(){let key="";try{key=pssrWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pssrWatchedKey)return;pssrWatchedKey=key;try{pssrWatchWait();}catch(_error){}}
190:   function pssrRender(){pssrWatchSync();if(!root.document||!pssrSharedMarker()||!view)return false;const request=pssrRequestContext();if(!request||contextKey!==request.key)return false;if(renderedContextKey!==request.key){renderedContextKey=request.key;draft=null;}const formKey=`${request.key}|${view.managerRole||""}`;if(formContextKey&&formContextKey!==formKey){draft=null;pssrClearForm();}formContextKey=formKey;pssrRenderEntry();return true;}
191:   function pssrBeginReview(){
192:     if(!view||!view.managerRole)return false;if(view.ownResult){root.CareerModeSeasonFinalV10?.reviewFinalSeason?.();pssrRender();return true;}
193:     try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrSetError("");pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
194:   }
195:   function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrSetError("");pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
196:   // Prime Pack: the manager who named this season's masked Icon first publishes his result with primePack:N, N = 4, 3, 2 or 1
197:   // by the stage of his right guess (the Rules accept it only when the round record names him and its server time gives N). Read once from the round record. A read that fails stops the publish (TRY AGAIN),
198:   // so a won point is never dropped by a bad connection.
199:   async function pssrWithPrimePack(ctx,request,result){
200:     if(!result||typeof result!=="object")return result;
201:     let confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
202:     if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;}
203:     // Fable F13-04: an unknown confirm time never publishes without the Prime Pack point (it could drop a won point): TRY AGAIN.
204:     if(!Number.isFinite(confirmedAtMs))pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","The Showdown's confirm time could not be read. Check the connection and try again.");
205:     const gameCtx={rivalryId:ctx.options.rivalryId,managerRole:ctx.setup.managerRole,season:request.seasonNumber,confirmedAtMs};
206:     const{primePack:_drop,...rest}=result;
207:     const withPoints=points=>Number.isInteger(points)&&points>=1&&points<=4?{...rest,primePack:points}:rest;
208:     const loaded=root.CareerModeIconGuessStep||await (typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep).then(()=>root.CareerModeIconGuessStep,()=>null):null);
209:     // applies() needs the round engine (js/iconGuess.js): load it first, or a won Prime Pack point would be dropped.
210:     const step=loaded&&await Promise.resolve(loaded.ensure()).catch(()=>false)?loaded:null;
211:     if(!step){pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","Prime Pack could not load. Check the connection and try again.");}
212:     // The round record is always read (no record is 0 points).
213:     if(!step.applies(gameCtx))return result;
214:     const points=await step.pointsFor({firestore:ctx.options.firestore,sdk:ctx.options.firebaseSdk,rivalryId:ctx.options.rivalryId},gameCtx);
215:     return withPoints(points);
216:   }
217:   async function pssrPublish(){
218:     if(busy||!draft||!view?.managerRole)return false;
219:     // r89 Sacked: the confirm step. A sacked result ends the Showdown and is final, so the first PUBLISH tap only asks again.
220:     if(draft.result?.sacked===true&&draft.sackedConfirmed!==true){draft.sackedConfirmed=true;pssrSetError("");pssrRenderReview(draft.result);return false;}
221:     if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("This Showdown's season changed while you were reviewing. Review your result again.");draft=null;return false;}
222:     let currentResult;try{currentResult=pssrReadForm(view.managerRole);}catch(error){pssrSetError(error.message||error.code);return false;}
223:     if(pssrFingerprint(currentResult)!==draft.fingerprint){pssrSetError("Your result changed after you reviewed it. Tap EDIT MY RESULT, review it again, then publish.");return false;}
224:     const request=pssrRequestContext();if(!request||!pssrContextMatches(request))return false;backGen+=1;if(backTimer!==null){try{root.clearTimeout?.(backTimer);}catch(_error){}backTimer=null;}busy=true;pssrSetError("");const publishRole=view.managerRole;let failed="";pssrRender();
225:     try{
226:       return await pssrQueueProvider(async()=>{
227:         const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return false;
228:         let current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;
229:         let staleRetried=false,contentionRetries=0;
230:         for(;;){
231:           if(current.ownResult){pssrDraftClear(publishRole,request);view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
232:           draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
233:           const publishedResult=await pssrWithPrimePack(ctx,request,draft.result);if(!pssrContextMatches(request))return false;
234:           const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:publishedResult});
235:           if(published?.code==="SEASON_RESULTS_STALE_BASE_REVISION"&&!staleRetried){staleRetried=true;current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;continue;}
236:           // JOB-1611: two same-moment publishes can both lose to lock contention instead of one losing to the other's write.
237:           // One manager then gets aborted (SDK retries spent) or permission-denied (the rival's retried write had not landed
238:           // by the provider's last re-read) while the rival quietly retries and wins. Wait, re-read and publish again with
239:           // the same operationId (an own write that did land is bound, never written twice); bounded, then surfaced as before.
240:           // Fable job 3 F3-11: a denied publish whose re-read is refused outright (the partner ENDed the Showdown: RIVALRY_INACTIVE;
241:           // the Session closed) is a refusal, not contention: it stops at once with the same message instead of three more
242:           // publishes and re-reads. A re-read that is itself contended, denied or offline keeps the bounded JOB-1611 retry.
243:           if(PSSR_CONTENTION_CODES.includes(published?.code)&&contentionRetries<PSSR_CONTENTION_RETRY_MS.length){await pssrWait(PSSR_CONTENTION_RETRY_MS[contentionRetries]);contentionRetries+=1;if(!pssrContextMatches(request))return false;const fresh=await provider.read(ctx.options);if(!pssrContextMatches(request))return false;if(!(fresh?.ok!==true&&PSSR_DENIED_CODES.includes(published.code)&&!PSSR_READ_RETRY_CODES.includes(fresh?.code))){if(fresh?.ok===true)current=fresh;continue;}}
244:           const result=pssrResultError(published,"Your season result could not be confirmed.");if(!pssrContextMatches(request))return true;
245:           pssrDraftClear(publishRole,request);view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;try{await pssrRefreshNow(request);}catch(_error){pssrRefresh().catch(()=>{});}return true;
246:         }
247:       });
248:     }catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Confirming your season result failed.");pssrReport("Could not confirm your season result",error);}else failed=PSSR_BACK_FAILED;return false;}
249:     finally{busy=false;if(pssrContextMatches(request))pssrRender();else pssrRenderWhenBack(request,failed);}
250:   }
251:   // W1 (2.4.0): a publish can end while this phone has no connection and its Season Results context is not readable (the
252:   // Showdown's setup is unavailable offline). It then had nothing to draw on: the screen kept the CONFIRM button it drew as
253:   // busy (disabled) and, before this manager confirms, no poll redraws it, so the button stayed off after the signal came back.
254:   // Once the same context is back, the screen is drawn again (button on, the failure said); no read, a local check each second.
255:   // W1b (2.4.0, Fable re-check 2): a Season Results poll tick that runs while the context still reads as another season
256:   // empties view and draft, so a plain redraw drew nothing and CONFIRM MY RESULT stayed off under "tap ... again". Then the
257:   // screen is read once (light) and the review is opened again from the typed form before the line is shown.
258:   let backTimer=null,backGen=0;
259:   function pssrRenderWhenBack(request,message){
260:     const timer=typeof root.setTimeout==="function"?root.setTimeout:null;if(!timer||!request)return;
261:     if(backTimer!==null)try{root.clearTimeout?.(backTimer);}catch(_error){}
262:     const gen=backGen+=1;let tries=0;
263:     const live=()=>{const entry=pssrField("seasonEntry");return gen===backGen&&!busy&&Boolean(entry)&&!entry.classList.contains("hidden");};
264:     const again=ms=>{if((tries+=1)<PSSR_BACK_TRIES)backTimer=timer(check,ms);};
265:     // The redraw with the line: the review is on (the reviewed draft, or a new one from the typed form) before the line is
266:     // written into it, so the line never sits under a CONFIRM MY RESULT that is off. A confirmed result shows as confirmed.
267:     const show=()=>{
268:       if(view.ownResult||view.state?.phase==="RESULTS_READY"){pssrRender();return;}
269:       const kept=draft&&draft.contextKey===contextKey&&draft.seasonNumber===view.seasonNumber&&draft.managerRole===view.managerRole;
270:       if(kept?pssrRender():pssrBeginReview()){if(message)pssrSetError(message);}
271:     };
272:     // It stops for good the moment a new publish starts or the Season Results screen is not on (Home after END SHOWDOWN, any
273:     // other screen), so it never draws over another screen.
274:     const check=()=>{
275:       backTimer=null;if(!live())return;
276:       const current=pssrRequestContext();
277:       // Only the same context is drawn; another save or season (offline the season can read differently) is left to its own
278:       // screen, and the check goes on until the same one is back or the time is up.
279:       if(!current||current.key!==request.key){again(PSSR_BACK_MS);return;}
280:       if(view&&contextKey===request.key){show();return;}
281:       // W1b: nothing to draw (a tick emptied it). One light read; if it fails (still offline) try again in 5 s.
282:       pssrRefresh(true).then(read=>{if(!live())return;if(read&&view&&contextKey===request.key&&pssrContextMatches(request))show();else again(PSSR_BACK_MS*5);},()=>{if(live())again(PSSR_BACK_MS*5);});
283:     };
284:     backTimer=timer(check,PSSR_BACK_MS);
285:   }
286:   async function pssrOpen(){
287:     const navAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;
288:     if(!pssrSharedMarker())return false;await pssrEnsureDependencies();const request=pssrRequestContext();if(!request)return false;const result=await pssrRefresh();if(!result||!pssrContextMatches(request)||contextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pssrFail("SEASON_RESULTS_NAVIGATION_UNAVAILABLE");if(navAtTap!==null&&root.getNavigationRevision()!==navAtTap)return false;const shown=await root.navigateTo("seasonEntry");if(shown===false||!pssrContextMatches(request))return false;pssrRender();return true;
289:   }
290:   function pssrCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pssrSharedMarker())return;const active=pssrField("seasonEntry");if(!active||active.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="completeSeason")pssrBeginReview();else if(target.id==="editSeasonResults")pssrEdit();else void pssrPublish();}
291:   function pssrWaitingKey(){const active=["seasonEntry","mainMenu","standings"].some(id=>{const node=pssrField(id);return node&&!node.classList.contains("hidden");});if(!view||contextKey!==pssrRequestContext()?.key||!view.ownResult||view.state?.phase==="RESULTS_READY"||!active)return "";return `${contextKey}|publish`;}
292:   function pssrFastPollDue(){const key=pssrWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
293:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
294:   // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
295:   function pssrWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pssrWaitingKey()||pssrLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`:null)(pssrRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pssrWaitingKey()&&pssrLiveScreen());}catch(_error){relaxed=false;}return budget.watchWaitPoint("season-results",path,pssrWaitWake,{relaxed});}
296:   function pssrWaitWake(){if(!busy){void pssrTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pssrTick(true);},400);}
297:   function pssrWaitHealthy(){const request=pssrRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`);}
298:   function pssrFastTick(){pssrWatchWait();if(pssrWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pssrFastPollDue())return;void pssrTick(true);}
299:   // r75: the 15 s check of the visible Season Results screen reads the shared results from the server (see Transfer).
300:   // r84: the listener also watches while Season Results is open and not yet RESULTS_READY (not only after this manager publishes):
301:   // 15 s fresh reads here were ~32 billed reads/min for both phones over a 30-90 minute results wait.
302:   function pssrLiveScreen(){const active=pssrField("seasonEntry");return Boolean(view&&contextKey===pssrRequestContext()?.key&&view.state?.phase!=="RESULTS_READY"&&active&&!active.classList.contains("hidden"));}
303:   function pssrScreenFresh(request){if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}
304:   async function pssrTick(light=false){if(!pssrSharedMarker()||root.document?.visibilityState==="hidden"||busy)return;const request=pssrRequestContext();if(!request)return;if(contextKey&&contextKey!==request.key){view=null;draft=null;contextKey="";renderedContextKey="";}if(view?.state?.phase==="RESULTS_READY"&&view.allResults?.playerOne&&view.allResults?.playerTwo)return;const active=pssrField("seasonEntry");if(view||active&&!active.classList.contains("hidden")){if(light!==true&&active&&!active.classList.contains("hidden"))pssrScreenFresh(request);try{await pssrRefresh(light===true);}catch(_error){}}}
305:   function pssrInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pssrCapture,true);root.document.addEventListener("input",pssrDraftChange,true);root.document.addEventListener("change",pssrDraftChange,true);}root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pssrTick());if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pssrTick();},POLL_MS);root.setInterval(pssrFastTick,FAST_POLL_MS);}return true;}
306: 
307:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results",productionEnabled:true,requiresCompletedSharedTransfer:true,privateUntilBothPublished:true,reusesSeasonEntry:true,interceptsLocalSeasonPersistence:true,authoritativeScoring:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pssrWaitingKey()),install:pssrInstall,open:pssrOpen,refresh:pssrRefresh,getState:()=>view,isActive:pssrSharedMarker,canRoute:pssrCanRoute});
308: });
309: 
```

## FILE: js/productionSharedSeasonResultsRoute.js (119 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedSeasonResultsRoute=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const CONTROL_IDS=Object.freeze(["continueFromTransfers","seasonPrimaryAction"]);
9:   const POST_RESULTS_MODULES=Object.freeze([
10:     ["ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit],
11:     ["ssjr-production-canonical-scoring","js/productionSharedCanonicalScoring.js",()=>root.CareerModeProductionSharedCanonicalScoring],
12:     ["ssjr-production-history-convergence","js/productionSharedHistoryConvergence.js",()=>root.CareerModeProductionSharedHistoryConvergence],
13:     ["ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression],
14:     ["ssjr-production-journey-reconnect","js/productionSharedJourneyReconnect.js",()=>root.CareerModeProductionSharedJourneyReconnect],
15:     ["ssjr-production-local-reconciliation","js/productionSharedLocalReconciliation.js",()=>root.CareerModeProductionSharedLocalReconciliation],
16:     ["ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js",()=>root.CareerModeProductionSharedFinalReconciliation],
17:     ["ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose]
18:   ]);
19:   let installed=false,observer=null,postResultsBootstrapPromise=null,openPromise=null;
20:   function routeShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
21:   function routeShared(){const showdown=routeShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
22:   function routeButton(id){return root.document&&root.document.getElementById(id);}
23:   function routeTransfer(){return root.CareerModeProductionSharedTransferChallenge||null;}
24:   function routeResults(){return root.CareerModeProductionSharedSeasonResults||null;}
25:   async function routeBootstrapPostResults(){
26:     if(postResultsBootstrapPromise)return postResultsBootstrapPromise;
27:     if(typeof root.loadRuntimeScript!=="function")throw new Error("Shared post-results runtime loader is unavailable.");
28:     postResultsBootstrapPromise=(async()=>{
29:       await root.loadRuntimeScript("ssjr-shared-local-reconciliation-protocol","js/sharedLocalReconciliation.js",()=>root.CareerModeSharedLocalReconciliation);
30:       for(const [key,path,ready] of POST_RESULTS_MODULES){
31:         await root.loadRuntimeScript(key,path,ready);
32:         const api=ready();
33:         if(!api||typeof api.install!=="function")throw new Error(`${path} loaded without its production install API.`);
34:         api.install();
35:       }
36:       return true;
37:     })().catch(error=>{postResultsBootstrapPromise=null;throw error;});
38:     return postResultsBootstrapPromise;
39:   }
40:   function routeReady(){const transfer=routeTransfer(),view=transfer&&typeof transfer.getState==="function"?transfer.getState():null,screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(routeShared()&&view&&view.state&&view.state.phase==="COMPLETED"&&screen&&!screen.dataset.sharedTransferReplay);}
41:   // r93 O1: the dashboard button stays VIEW TRANSFER VERDICTS (the Transfer War's own) while this phone has not shown the
42:   // completed Transfer War to this manager; once it has, the button is Season Results as before. CONTINUE TO SEASON RESULTS on
43:   // the Transfer War screen is unchanged (that screen is the verdicts).
44:   function routeVerdictsFirst(){try{return routeTransfer()?.verdictsUnseen?.()===true;}catch(_error){return false;}}
45:   function routeInstallEscapeStyle(){
46:     if(!root.document||root.document.getElementById("sharedSeasonResultsRouteStyle"))return false;
47:     const style=root.document.createElement("style");style.id="sharedSeasonResultsRouteStyle";
48:     style.textContent='#seasonEntry[data-shared-season-results="review"] .seasonEntryActions{display:flex!important}#seasonEntry[data-shared-season-results="review"] #completeSeason:not(#v10ExitSlot #completeSeason){display:none!important}';
49:     root.document.head.appendChild(style);return true;
50:   }
51:   function routeSetText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
52:   function routeEnable(node){if(!node)return;if(node.disabled)node.disabled=false;if(node.getAttribute("aria-disabled")==="true")node.setAttribute("aria-disabled","false");}
53:   function routeDecorate(){
54:     if(!routeReady())return false;
55:     const continueButton=routeButton("continueFromTransfers");
56:     if(continueButton&&openPromise){routeSetText(continueButton,"OPENING SEASON RESULTS…");if(!continueButton.disabled)continueButton.disabled=true;continueButton.dataset.sharedSeasonResultsRoute="true";}
57:     else if(continueButton){routeSetText(continueButton,"CONTINUE TO SEASON RESULTS");routeEnable(continueButton);if(continueButton.classList.contains("hidden"))continueButton.classList.remove("hidden");continueButton.dataset.sharedSeasonResultsRoute="true";}
58:     if(routeVerdictsFirst())return true;
59:     const dashboardButton=routeButton("seasonPrimaryAction"),status=routeButton("dashboardTransferStatus"),results=routeResults(),resultView=results&&typeof results.getState==="function"?results.getState():null;
60:     if(dashboardButton&&openPromise){routeSetText(dashboardButton,"OPENING SEASON RESULTS…");if(!dashboardButton.disabled)dashboardButton.disabled=true;dashboardButton.setAttribute("aria-busy","true");dashboardButton.dataset.sharedSeasonResultsRoute="true";}
61:     else if(dashboardButton){if(dashboardButton.hasAttribute("aria-busy"))dashboardButton.removeAttribute("aria-busy");const label=resultView?.state?.phase==="RESULTS_READY"?"VIEW SEASON RESULTS":resultView?.ownResult?"VIEW MY CONFIRMED RESULT":"ENTER SEASON RESULTS";routeSetText(dashboardButton,label);routeEnable(dashboardButton);dashboardButton.dataset.sharedSeasonResultsRoute="true";}
62:     if(status){const label=resultView?.state?.phase==="RESULTS_READY"?"Season Results: both confirmed":resultView?.ownResult?"Season Results: waiting for your rival":"Transfer War complete · Season Results ready";const squad=routeTransfer()?.squadError?.()||"";routeSetText(status,squad||label);}
63:     return true;
64:   }
65:   // r50: opening Results loads the Results, Commit and Scoring runtime and may wait on the Commit
66:   // check. The tapped control shows OPENING… and overlapping taps share one open.
67:   function routeOpen(){
68:     if(openPromise)return openPromise;if(!routeReady())return Promise.resolve(false);
69:     const run=Promise.resolve().then(routeOpenNow);openPromise=run;
70:     run.finally(()=>{if(openPromise===run)openPromise=null;routeDecorate();}).catch(()=>{});
71:     try{routeDecorate();}catch(_error){}
72:     return run;
73:   }
74:   async function routeOpenNow(){
75:     if(!routeReady())return false;
76:     if(typeof root.loadRuntimeScript!=="function")throw new Error("Shared Season Results runtime loader is unavailable.");
77:     // r91 Squad Management: before Season Results, this manager sets his squad for next season (kept signings in, the
78:     // roulette's shot gone). Its stage stays up until Season Results is on screen, so the Transfer War never flashes between.
79:     const transfer=routeTransfer(),closeSquad=()=>{try{root.CareerModeSquadSheetStep?.close?.();}catch(_error){}};
80:     if(transfer&&typeof transfer.squadAfterTransfers==="function"&&!await transfer.squadAfterTransfers()){closeSquad();return false;}
81:     const navigationAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;
82:     let opened=false;
83:     try{
84:       await root.loadRuntimeScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
85:       if(navigationAtTap!==null&&root.getNavigationRevision()!==navigationAtTap)return false;
86:       const api=root.CareerModeProductionSharedSeasonResults;if(!api||typeof api.install!=="function"||typeof api.open!=="function")throw new Error("Shared Season Results production adapter is unavailable.");
87:       api.install();opened=await api.open();
88:     }finally{closeSquad();}
89:     const api=root.CareerModeProductionSharedSeasonResults;if(!opened)return false;routeTransfer()?.rememberResultsView?.();await routeBootstrapPostResults();
90:     if(api.getState?.()?.state?.phase==="RESULTS_READY"){
91:       const commit=root.CareerModeProductionSharedSeasonCommit;
92:       if(!commit||typeof commit.refresh!=="function")throw new Error("Shared Season Commit refresh API is unavailable.");
93:       await commit.refresh();
94:     }
95:     routeDecorate();return true;
96:   }
97:   function routeCapture(event){
98:     const target=event.target&&event.target.closest&&event.target.closest("button");
99:     if(!target||!CONTROL_IDS.includes(target.id)||!routeReady())return;
100:     if(target.id==="seasonPrimaryAction"&&routeVerdictsFirst())return;
101:     event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();
102:     void routeOpen().catch(error=>{if(typeof root.reportApplicationError==="function")root.reportApplicationError("Season Results did not open",error);else root.console?.error?.(error);});
103:   }
104:   function routeInstall(){
105:     if(installed){routeDecorate();return true;}
106:     installed=true;
107:     if(root.document){
108:       routeInstallEscapeStyle();root.document.addEventListener("click",routeCapture,true);
109:       if(typeof root.MutationObserver==="function"){
110:         observer=new root.MutationObserver(()=>routeDecorate());
111:         for(const id of CONTROL_IDS){const button=routeButton(id);if(button)observer.observe(button,{attributes:true,childList:true,subtree:true,attributeFilter:["disabled","class","aria-disabled"]});}
112:       }
113:       routeDecorate();
114:     }
115:     return true;
116:   }
117:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results-route",productionEnabled:true,preservesTransferRuntime:true,requiresCompletedSharedTransfer:true,directDashboardRoute:true,sharedReviewEscape:true,sharedRouteAuthority:true,coreNavigationAuthority:true,idempotentDecoration:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,install:routeInstall,decorate:routeDecorate,open:routeOpen,canRoute:routeReady,bootstrapPostResults:routeBootstrapPostResults});
118: });
119: 
```

## FILE: firestore.season-results-production.fragment.rules (452 lines)
```
1: // SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN
2:     function ssjrResultsValidOperationId(value) { return value is string && value.matches('^season_result_op_[0-9a-f]{32}$'); }
3:     function ssjrResultsValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
4:     function ssjrResultsValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
5:     function ssjrResultsSeasonMatches(seasonId, seasonNumber) {
6:       return seasonNumber is int
7:         && seasonNumber >= 1
8:         && seasonNumber <= 10
9:         && seasonId == 'season_' + string(seasonNumber);
10:     }
11:     function ssjrResultsSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data; }
12:     function ssjrResultsProjectedTeamCount(rivalryId) { return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/leagueProjection).data.teamCount; }
13:     function ssjrResultsCareer(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/careerStart/authoritative).data; }
14:     function ssjrResultsTransfer(rivalryId, seasonId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(seasonId)).data; }
15:     function ssjrResultsPrerequisites(rivalryId, seasonId, seasonNumber) {
16:       let setup = ssjrResultsSetup(rivalryId);
17:       let career = ssjrResultsCareer(rivalryId);
18:       let transfer = ssjrResultsTransfer(rivalryId, seasonId);
19:       return setup.schemaVersion == 1
20:         && setup.objectType == 'sharedSetupLedger'
21:         && setup.rivalryId == rivalryId
22:         && setup.revision == 6
23:         && setup.phase == 'SHOWDOWN_CONFIRMED'
24:         && (setup.coordinatorRole == 'playerOne' || setup.coordinatorRole == 'playerTwo')
25:         && setup.operationIds is list
26:         && setup.operationIds.size() == 6
27:         && setup.totalSeasons in [1,3,5,10]
28:         && seasonNumber >= 1
29:         && seasonNumber <= setup.totalSeasons
30:         && career.schemaVersion == 1
31:         && career.objectType == 'sharedCareerStart'
32:         && career.rivalryId == rivalryId
33:         && career.setupRevision == 6
34:         && career.setupOperationIds is list
35:         && career.setupOperationIds == setup.operationIds
36:         && career.totalSeasons == setup.totalSeasons
37:         && career.revision == 2
38:         && career.phase == 'CAREER_START_READY'
39:         && career.acknowledgedRoles is list
40:         && career.acknowledgedRoles.size() == 2
41:         && 'playerOne' in career.acknowledgedRoles
42:         && 'playerTwo' in career.acknowledgedRoles
43:         && transfer.schemaVersion == 1
44:         && transfer.objectType == 'sharedTransferChallenge'
45:         && transfer.rivalryId == rivalryId
46:         && transfer.seasonNumber == seasonNumber
47:         && transfer.runtimeRevision == '1.9.1-r8'
48:         && transfer.coordinatorRole == setup.coordinatorRole
49:         && transfer.phase == 'COMPLETED'
50:         && (transfer.revision == 6 || transfer.revision == 7)
51:         && transfer.guessLockedRoles is list
52:         && transfer.guessLockedRoles.size() == 2
53:         && 'playerOne' in transfer.guessLockedRoles
54:         && 'playerTwo' in transfer.guessLockedRoles
55:         && transfer.signingLockedRoles is list
56:         && transfer.signingLockedRoles.size() == 2
57:         && 'playerOne' in transfer.signingLockedRoles
58:         && 'playerTwo' in transfer.signingLockedRoles;
59:     }
60:     function ssjrResultsRoleListValid(value) {
61:       return value is list
62:         && value.size() >= 1
63:         && value.size() <= 2
64:         && value.toSet().size() == value.size()
65:         && value.toSet().hasOnly(['playerOne','playerTwo']);
66:     }
67:     function ssjrResultsPublicExactKeys(root) {
68:       return root.keys().hasOnly([
69:         'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','phase','revision','teamCount','publishedRoles',
70:         'operationIds','operationHashes','baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
71:       ]);
72:     }
73:     function ssjrResultsPublicShape(root, rivalryId, seasonId) {
74:       let n = root.revision;
75:       return ssjrResultsPublicExactKeys(root)
76:         && root.schemaVersion == 1
77:         && root.objectType == 'sharedSeasonResults'
78:         && root.rivalryId == rivalryId
79:         && root.seasonNumber is int
80:         && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
81:         && root.teamCount == ssjrResultsProjectedTeamCount(rivalryId)
82:         && ssjrEntitled(rivalryId)
83:         && root.runtimeRevision == '1.9.1-r9'
84:         && (root.phase == 'COLLECTING' || root.phase == 'RESULTS_READY')
85:         && root.revision is int
86:         && root.revision >= 1
87:         && root.revision <= 2
88:         && ssjrResultsRoleListValid(root.publishedRoles)
89:         && root.publishedRoles.size() == n
90:         && root.operationIds is list
91:         && root.operationHashes is list
92:         && root.baseRevisions is list
93:         && root.actorRoles is list
94:         && root.operationIds.size() == n
95:         && root.operationHashes.size() == n
96:         && root.baseRevisions.size() == n
97:         && root.actorRoles.size() == n
98:         && root.updatedAt == request.time
99:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)
100:         && ((root.phase == 'COLLECTING' && n == 1) || (root.phase == 'RESULTS_READY' && n == 2));
101:     }
102:     function ssjrResultsPublicUpdateShape(root, rivalryId, seasonId) {
103:       return ssjrResultsPublicExactKeys(root)
104:         && root.schemaVersion == 1
105:         && root.objectType == 'sharedSeasonResults'
106:         && root.rivalryId == rivalryId
107:         && root.seasonNumber is int
108:         && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
109:         && root.runtimeRevision == '1.9.1-r9'
110:         && root.teamCount is int
111:         && root.teamCount in [18,20]
112:         && root.teamCount == resource.data.teamCount
113:         && root.teamCount == ssjrResultsProjectedTeamCount(rivalryId)
114:         && root.phase == 'RESULTS_READY'
115:         && root.revision == 2
116:         && ssjrResultsRoleListValid(root.publishedRoles)
117:         && root.publishedRoles.size() == 2
118:         && root.operationIds is list
119:         && root.operationIds.size() == 2
120:         && root.operationHashes is list
121:         && root.operationHashes.size() == 2
122:         && root.baseRevisions is list
123:         && root.baseRevisions.size() == 2
124:         && root.actorRoles is list
125:         && root.actorRoles.size() == 2
126:         && root.updatedAt == request.time;
127:     }
128:     function ssjrResultsPublicPrefixPreserved(before, after) {
129:       return after.publishedRoles[0] == before.publishedRoles[0]
130:         && after.operationIds[0] == before.operationIds[0]
131:         && after.operationHashes[0] == before.operationHashes[0]
132:         && after.baseRevisions[0] == before.baseRevisions[0]
133:         && after.actorRoles[0] == before.actorRoles[0];
134:     }
135:     function ssjrResultsPrivateAfter(rivalryId, seasonId, managerRole) {
136:       return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole)).data;
137:     }
138:     // r80 Europa League: 'europaLeague' is present only when that manager won the EL, and then it is exactly true
139:     // (false is refused, so there is one encoding per fact and old 7-key results are unchanged). One manager's season
140:     // never has CL and EL both true. Nothing compares the two managers' results: both may win the same trophy.
141:     function ssjrResultsResultShape(value, teamCount) {
142:       return teamCount >= 2
143:         && value is map
144:         && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague','primePack','sacked'])
145:         && value.leaguePosition is int
146:         && value.leaguePosition >= 1
147:         && value.leaguePosition <= teamCount
148:         && value.leaguePoints is int
149:         && value.leaguePoints >= 0
150:         && value.leaguePoints <= (teamCount - 1) * 6
151:         && value.leagueGoals is int
152:         && value.leagueGoals >= 0
153:         && value.leagueGoals <= 300
154:         && value.domesticCup is bool
155:         && value.championsLeague is bool
156:         && value.topScorer is bool
157:         && value.topAssist is bool
158:         && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false))
159:         && (!('primePack' in value) || (value.primePack is int && value.primePack >= 1 && value.primePack <= 4))
160:         // r89 Sacked: present only when that manager was sacked this season, and then exactly true (one encoding).
161:         && (!('sacked' in value) || value.sacked == true);
162:     }
163:     function ssjrResultsPrivateExactKeys(root) {
164:       return root.keys().hasOnly([
165:         'schemaVersion','objectType','rivalryId','seasonNumber','managerRole','result','operationId','commandHash',
166:         'activeSessionId','publishedAt','updatedByDeviceId'
167:       ]);
168:     }
169:     function ssjrResultsPrivateBase(root, rivalryId, seasonId, managerRole, teamCount) {
170:       return ssjrResultsPrivateExactKeys(root)
171:         && root.schemaVersion == 1
172:         && root.objectType == 'sharedSeasonResultRole'
173:         && root.rivalryId == rivalryId
174:         && root.seasonNumber is int
175:         && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
176:         && root.managerRole == managerRole
177:         && managerRole == ssjrActorRole(rivalryId)
178:         && ssjrResultsResultShape(root.result, teamCount)
179:         && ssjrResultsValidOperationId(root.operationId)
180:         && ssjrResultsValidHash(root.commandHash)
181:         && root.publishedAt == request.time
182:         && ssjrEntitled(rivalryId);
183:     }
184:     function ssjrResultsPrivateLinked(rivalryId, seasonId, publicAfter, managerRole) {
185:       let own = ssjrResultsPrivateAfter(rivalryId, seasonId, managerRole);
186:       let i = publicAfter.revision - 1;
187:       return own.operationId == publicAfter.operationIds[i]
188:         && publicAfter.actorRoles[i] == managerRole
189:         && publicAfter.publishedRoles[i] == managerRole
190:         && own.activeSessionId == publicAfter.activeSessionId
191:         && own.updatedByDeviceId == publicAfter.updatedByDeviceId
192:         && own.publishedAt == request.time;
193:     }
194:     function ssjrResultsValidCreate(rivalryId, seasonId) {
195:       let after = request.resource.data;
196:       let role = ssjrActorRole(rivalryId);
197:       return ssjrResultsPublicShape(after, rivalryId, seasonId)
198:         && after.revision == 1
199:         && ssjrResultsValidOperationId(after.operationIds[0])
200:         && ssjrResultsValidHash(after.operationHashes[0])
201:         && after.baseRevisions[0] == 0
202:         && ssjrResultsPrivateLinked(rivalryId, seasonId, after, role);
203:     }
204:     // Audit R84 F01 (r85): the second publish (revision 1 -> 2) now carries the same write authority as the first. Before,
205:     // it was bound only to rivalry membership (through the role-private document's ssjrEntitled).
206:     function ssjrResultsValidUpdate(rivalryId, seasonId) {
207:       let before = resource.data;
208:       let after = request.resource.data;
209:       let role = ssjrActorRole(rivalryId);
210:       let i = before.revision;
211:       return ssjrResultsPublicUpdateShape(after, rivalryId, seasonId)
212:         && before.revision == 1
213:         && ssjrResultsPublicPrefixPreserved(before, after)
214:         && ssjrResultsPrivateLinked(rivalryId, seasonId, after, role)
215:         && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
216:     }
217:     function ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole) {
218:       let after = request.resource.data;
219:       let public = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
220:       let i = public.revision - 1;
221:       return ssjrResultsPrivateBase(after, rivalryId, seasonId, managerRole, public.teamCount)
222:         && (!('primePack' in after.result) || ssjrPackPoints(rivalryId, seasonId, managerRole, after.result.primePack))
223:         && public.schemaVersion == 1
224:         && public.objectType == 'sharedSeasonResults'
225:         && public.runtimeRevision == '1.9.1-r9'
226:         && public.seasonNumber == after.seasonNumber
227:         && public.operationIds[i] == after.operationId
228:         && (public.revision == 1 || public.operationIds[i] != public.operationIds[0])
229:         && ssjrResultsValidHash(public.operationHashes[i])
230:         && public.baseRevisions[i] == public.revision - 1
231:         && public.actorRoles[i] == managerRole
232:         && public.publishedRoles[i] == managerRole
233:         && public.activeSessionId == after.activeSessionId
234:         && public.updatedByDeviceId == after.updatedByDeviceId
235:         && public.updatedAt == request.time;
236:     }
237:     function ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole) {
238:       let public = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
239:       return ssjrEntitled(rivalryId)
240:         && (managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY');
241:     }
242:     // r87 Prime Pack (Nik 2026-10-31/11-01; feature spec project-documents/r88-icon-guess): once a season, before the transfer
243:     // window, both phones reveal one masked card in four stages and each manager has two guesses. The round record is
244:     // rivalries/{rid}/primePackRounds/season_N. Each manager writes only his own facts: his arrival (the server time, once),
245:     // which he withdraws again only while the other manager has not arrived (he left the screen: ssjrPackLeave), then one
246:     // guess at a time (his own chip count +1, at most 2, and namedBy set to himself when right), only while the round
247:     // runs: the stages start 3 s after the later arrival and their guess timers are 25/20/20/20 s, each after a 1.5 s
248:     // reveal (js/iconGuess.js), so guesses count from 2 s to 97 s after the later arrival (1 s and 2 s of network slack).
249:     // Whether a guess is right is decided on the guessing phone (the answer is not stored, so it is never readable early);
250:     // the Rules bind the order: namedBy is set once, never changed, the other manager's facts never touched, and the record's
251:     // updatedAt is the winning write's server time (no write is allowed after it). A season result may carry primePack:N only
252:     // for the manager this record names, with N the points of the stage that server time falls in: 4 before 30.5 s after the
253:     // later arrival, 3 before 52 s, 2 before 73.5 s, then 1 (ssjrPackPoints). Changing the guess window means changing these.
254:     function ssjrPackOther(role) { return role == 'playerOne' ? 'playerTwo' : 'playerOne'; }
255:     function ssjrPackRoleMap(value) {
256:       return value is map && value.keys().size() == 2 && value.keys().hasOnly(['playerOne','playerTwo']);
257:     }
258:     function ssjrPackShape(root, rivalryId, seasonId) {
259:       return root.keys().size() == 11
260:         && root.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','arrived','chipsUsed','namedBy','revision','activeSessionId','updatedByDeviceId','updatedAt'])
261:         && root.schemaVersion == 1
262:         && root.objectType == 'sharedPrimePackRound'
263:         && root.rivalryId == rivalryId
264:         && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
265:         && ssjrPackRoleMap(root.arrived)
266:         && ssjrPackRoleMap(root.chipsUsed)
267:         && root.chipsUsed.playerOne is int && root.chipsUsed.playerOne >= 0 && root.chipsUsed.playerOne <= 2
268:         && root.chipsUsed.playerTwo is int && root.chipsUsed.playerTwo >= 0 && root.chipsUsed.playerTwo <= 2
269:         && (root.namedBy == null || root.namedBy == 'playerOne' || root.namedBy == 'playerTwo')
270:         && root.revision is int
271:         && root.updatedAt == request.time
272:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
273:     }
274:     function ssjrPackCreateValid(rivalryId, seasonId) {
275:       let after = request.resource.data;
276:       let role = ssjrActorRole(rivalryId);
277:       return ssjrPackShape(after, rivalryId, seasonId)
278:         && after.revision == 1
279:         && after.arrived[role] == request.time
280:         && after.arrived[ssjrPackOther(role)] == null
281:         && after.chipsUsed.playerOne == 0
282:         && after.chipsUsed.playerTwo == 0
283:         && after.namedBy == null;
284:     }
285:     function ssjrPackArrive(before, after, role) {
286:       return before.arrived[role] == null
287:         && after.arrived[role] == request.time
288:         && after.chipsUsed[role] == before.chipsUsed[role]
289:         && after.namedBy == null;
290:     }
291:     function ssjrPackLeave(before, after, role) {
292:       return before.arrived[role] != null
293:         && before.arrived[ssjrPackOther(role)] == null
294:         && after.arrived[role] == null
295:         && after.chipsUsed[role] == before.chipsUsed[role]
296:         && after.namedBy == null;
297:     }
298:     function ssjrPackGuessInTime(a, b) {
299:       return request.time >= (a > b ? a : b) + duration.value(2, 's')
300:         && request.time <= (a > b ? a : b) + duration.value(97, 's');
301:     }
302:     function ssjrPackGuess(before, after, role) {
303:       return before.arrived.playerOne != null
304:         && before.arrived.playerTwo != null
305:         && after.arrived[role] == before.arrived[role]
306:         && after.chipsUsed[role] == before.chipsUsed[role] + 1
307:         && (after.namedBy == null || after.namedBy == role)
308:         && ssjrPackGuessInTime(before.arrived.playerOne, before.arrived.playerTwo);
309:     }
310:     function ssjrPackUpdateValid(rivalryId, seasonId) {
311:       let before = resource.data;
312:       let after = request.resource.data;
313:       let role = ssjrActorRole(rivalryId);
314:       let other = ssjrPackOther(role);
315:       return ssjrPackShape(after, rivalryId, seasonId)
316:         && after.seasonNumber == before.seasonNumber
317:         && after.revision == before.revision + 1
318:         && before.namedBy == null
319:         && after.arrived[other] == before.arrived[other]
320:         && after.chipsUsed[other] == before.chipsUsed[other]
321:         && (ssjrPackArrive(before, after, role) || ssjrPackLeave(before, after, role) || ssjrPackGuess(before, after, role));
322:     }
323:     function ssjrPackStagePoints(at, a, b) {
324:       return at < (a > b ? a : b) + duration.value(30500, 'ms') ? 4
325:         : (at < (a > b ? a : b) + duration.value(52000, 'ms') ? 3
326:         : (at < (a > b ? a : b) + duration.value(73500, 'ms') ? 2 : 1));
327:     }
328:     function ssjrPackPoints(rivalryId, seasonId, managerRole, points) {
329:       let round = get(/databases/$(database)/documents/rivalries/$(rivalryId)/primePackRounds/$(seasonId)).data;
330:       return round.namedBy == managerRole
331:         && points == ssjrPackStagePoints(round.updatedAt, round.arrived.playerOne, round.arrived.playerTwo);
332:     }
333:     // r88 Chamber Men (Nik 2026-11-02, turn by turn 2026-11-03; js/chamberMen.js, js/chamberMenStep.js): once a season,
334:     // before Roster Russian Roulette, a 7-round penalty shootout of 14 kicks: Daniel shoots and Nik keeps, then Nik shoots and
335:     // Daniel keeps, and so on. The round record is rivalries/{rid}/chamberMenRounds/season_N. Each manager owns only his own
336:     // pick string kicks[role]: one letter per kick (his shot on a kick he takes, his dive on a kick he keeps: L, M, R, or -
337:     // when his own clock ran out), 14 at most (7 shots and 7 dives). A write adds exactly one letter to his own string and
338:     // never changes what is there, and only while he is not ahead of the other manager (he sends kick n+1 only once the
339:     // other has sent kick n), so nobody runs ahead, nothing is taken back, and the letter at place n is always his part on
340:     // kick n. The other manager's string never moves. Scoring and the cylinders are worked out on both phones from the two
341:     // strings; no lookup beyond the shared write authority, no list, no delete.
342:     // Codex C2 (2.2.0): a kick's clock runs from the rival's lock-in (the record's updatedAt while the rival is one letter
343:     // ahead): 10 s to pick plus the 4.6 s the last kick is shown, plus 2 s for the network. A letter that lands after that is
344:     // the timeout '-' (a shot misses, a dive stays in the middle), never a side picked late.
345:     function ssjrChamberShape(root, rivalryId, seasonId) {
346:       return root.keys().size() == 9
347:         && root.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','kicks','revision','activeSessionId','updatedByDeviceId','updatedAt'])
348:         && root.schemaVersion == 2
349:         && root.objectType == 'sharedChamberMenRound'
350:         && root.rivalryId == rivalryId
351:         && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
352:         && ssjrPackRoleMap(root.kicks)
353:         && root.kicks.playerOne is string && root.kicks.playerOne.size() <= 14
354:         && root.kicks.playerTwo is string && root.kicks.playerTwo.size() <= 14
355:         && root.revision is int
356:         && root.updatedAt == request.time
357:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
358:     }
359:     function ssjrChamberCreateValid(rivalryId, seasonId) {
360:       let after = request.resource.data;
361:       let role = ssjrActorRole(rivalryId);
362:       return ssjrChamberShape(after, rivalryId, seasonId)
363:         && after.revision == 1
364:         && after.kicks[role].matches('[LMR-]')
365:         && after.kicks[ssjrPackOther(role)] == '';
366:     }
367:     function ssjrChamberUpdateValid(rivalryId, seasonId) {
368:       let before = resource.data;
369:       let after = request.resource.data;
370:       let role = ssjrActorRole(rivalryId);
371:       let other = ssjrPackOther(role);
372:       return ssjrChamberShape(after, rivalryId, seasonId)
373:         && after.seasonNumber == before.seasonNumber
374:         && after.revision == before.revision + 1
375:         && after.kicks[other] == before.kicks[other]
376:         && before.kicks[role].size() <= before.kicks[other].size()
377:         && after.kicks[role].size() == before.kicks[role].size() + 1
378:         && (before.kicks[role] == '' || after.kicks[role][0:before.kicks[role].size()] == before.kicks[role])
379:         && after.kicks[role][before.kicks[role].size():after.kicks[role].size()].matches('[LMR-]')
380:         && (before.kicks[role].size() == before.kicks[other].size()
381:           || request.time <= before.updatedAt + duration.value(16600, 'ms')
382:           || after.kicks[role][before.kicks[role].size():after.kicks[role].size()] == '-');
383:     }
384:     // r91 Squad Management (2.4.0, Nik 2026-11-11; js/squadSheet.js, js/squadSheetStep.js): twice a season each manager locks
385:     // his squad, "pre" after Chamber Men (its XI and subs 1-4 are his Russian Roulette board) and "post" after the Transfer
386:     // War. One create-only document per manager per screen, rivalries/{rid}/squadSheets/season_N_<stage>_<role>, written
387:     // only by that manager: his 18 (XI in slot order, then 7 subs) as flat lists, and his cumulative departures and reported
388:     // overalls (flat lists: a map hit the expression ceiling in r87). The squad rules (lines, flex, nobody better hidden) are
389:     // checked on both phones; the Rules hold the shape, the owner and the season. Lookups: the rivalry only.
390:     function ssjrSquadSheetCreateValid(rivalryId, sheetId) {
391:       let after = request.resource.data;
392:       return after.keys().size() == 21
393:         && after.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','stage','role','formation','names','numbers','signed','outNames','outNumbers','outSigned','outReasons','outSeasons','ovNames','ovNumbers','ovSigned','ovValues','engine','lockedAt'])
394:         && after.schemaVersion == 1
395:         && after.objectType == 'sharedSquadSheet'
396:         && after.rivalryId == rivalryId
397:         && after.seasonNumber is int && after.seasonNumber >= 1 && after.seasonNumber <= 10
398:         && after.stage in ['pre', 'post']
399:         && after.role in ['playerOne', 'playerTwo']
400:         && sheetId == 'season_' + string(after.seasonNumber) + '_' + after.stage + '_' + after.role
401:         && after.formation is string && after.formation.size() >= 3 && after.formation.size() <= 24
402:         && after.names is list && after.names.size() == 18
403:         && after.numbers is list && after.numbers.size() == 18
404:         && after.signed is list && after.signed.size() == 18
405:         && after.outNames is list && after.outNames.size() <= 100
406:         && after.outNumbers is list && after.outNumbers.size() == after.outNames.size()
407:         && after.outSigned is list && after.outSigned.size() == after.outNames.size()
408:         && after.outReasons is list && after.outReasons.size() == after.outNames.size()
409:         && after.outSeasons is list && after.outSeasons.size() == after.outNames.size()
410:         && after.ovNames is list && after.ovNames.size() <= 150
411:         && after.ovNumbers is list && after.ovNumbers.size() == after.ovNames.size()
412:         && after.ovSigned is list && after.ovSigned.size() == after.ovNames.size()
413:         && after.ovValues is list && after.ovValues.size() == after.ovNames.size()
414:         && after.engine is string && after.engine.size() <= 16
415:         && after.lockedAt == request.time
416:         && ssjrEntitled(rivalryId)
417:         && after.role == ssjrActorRole(rivalryId);
418:     }
419: // SSJR_SEASON_RESULTS_FUNCTIONS_END
420: 
421: // SSJR_SEASON_RESULTS_MATCH_BEGIN
422:       match /seasonResults/{seasonId} {
423:         allow get: if ssjrEntitled(rivalryId);
424:         allow list, delete: if false;
425:         allow create: if ssjrResultsValidCreate(rivalryId, seasonId);
426:         allow update: if ssjrResultsValidUpdate(rivalryId, seasonId);
427: 
428:         match /roles/{managerRole} {
429:           allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);
430:           allow list, update, delete: if false;
431:           allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole);
432:         }
433:       }
434:       match /primePackRounds/{seasonId} {
435:         allow get: if ssjrEntitled(rivalryId);
436:         allow list, delete: if false;
437:         allow create: if ssjrPackCreateValid(rivalryId, seasonId);
438:         allow update: if ssjrPackUpdateValid(rivalryId, seasonId);
439:       }
440:       match /chamberMenRounds/{seasonId} {
441:         allow get: if ssjrEntitled(rivalryId);
442:         allow list, delete: if false;
443:         allow create: if ssjrChamberCreateValid(rivalryId, seasonId);
444:         allow update: if ssjrChamberUpdateValid(rivalryId, seasonId);
445:       }
446:       match /squadSheets/{sheetId} {
447:         allow get: if ssjrEntitled(rivalryId);
448:         allow list, update, delete: if false;
449:         allow create: if ssjrSquadSheetCreateValid(rivalryId, sheetId);
450:       }
451: // SSJR_SEASON_RESULTS_MATCH_END
452: 
```

(End of packet FJ5. Answer with the report only.)
