# Fable 5.2 red-team job FJ12: Career start and shared setup

You are an independent red-team reviewer. Read only the code in this file. Change nothing, write no patches longer than 5 lines.

## The game in 8 lines
A private two-player FIFA 17 career "Showdown" between exactly two managers, Nik and Daniel, each on his own phone or Chromebook, sharing one Firebase Firestore database (Spark free tier: every read and write counts). A Showdown is 1, 3, 5 or 10 seasons. Each season runs in a fixed order that is never skipped: Roulette (squad shot) -> Prime Pack (guess a masked player, 4/3/2/1 points, one winner or none) -> Transfer War (15-minute shared window on the server clock, private signings) -> season played in FIFA -> each manager enters and publishes his own result -> both tap CONFIRM SEASON -> ONE shared season commit -> next season, or Terminal Close and Final Winner after the last season. Sacked: either manager ticks it on Season Results and the Showdown ends after that season; points so far decide. Equal points are a DRAW: there is no tiebreak anywhere. Golden Showdown = 150 points over 10 seasons; perfect season = 15. Finished Showdowns feed History and career totals; unfinished or ended-early ones that never finished stay out.

## Code
Repo nikahanghojjati-oss/fifa17-career-showdown2, commit 10de3760 (gameplay/r98: release 2.10.0 plus the new League Roulette). Every file below is the exact file at that commit, each line prefixed with its line number. Rules files are Firestore security rules fragments that are composed into the deployed rules.

## Threat model (important)
This is a private two-player tool. Out of scope: anything that needs a modified app, hand-made Firestore requests, a third person, a stolen account, or "an attacker". In scope: anything that can happen in NORMAL play on the real app: two phones acting at the same instant, double taps, retries after a network error, a phone offline or asleep, a tab killed or reloaded at any moment, a phone joining late, a phone clock that is minutes off, a slow network, an older app version on one phone.

## What counts as a finding
A finding must give: (1) what the player sees, (2) an exact sequence of normal actions that causes it, (3) the file:line(s) in THIS packet that cause it, with a short quote, (4) severity, (5) a one-line fix idea. You cannot run the code, so label each finding TRACED (you followed every step through the quoted code and are sure) or UNSURE (it depends on code not in this packet, or timing you could not settle; say exactly what). Never present a guess as a bug. Before reporting, try to refute each finding yourself by looking for the guard that would stop it; drop it if you find one.
Severity: P0 = the game cannot continue, for good, or data is lost; P1 = a step is blocked, or a wrong result/score/winner sticks; P2 = wrong but recoverable (a reload fixes it); P3 = cosmetic or wording.

## Do not report
Style, naming, refactors, performance unless it costs Firebase reads in normal play (then give the count), looks/fonts/layout, missing comments, tests, and anything in "Known" below. At most 8 findings; stop when you have 3 TRACED P0/P1.

## Report format (plain words, one markdown answer)
First line: VERDICT: BLOCKER FOUND / REAL BUGS FOUND / NO BUG FOUND.
Then one block per finding: ID (FJ12-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Can the two phones start the Showdown with different leagues, clubs, season count or Special Player?
2. Can the Special Player come from the manager's own club, or fall outside the top-300 high-potential list?
3. Reload or late join during setup: does each phone land on the right step with the right choices?
4. Can a failed write leave setup half-done with no way forward?
5. Does any normal setup step get permission-denied from the Rules?

## Known (do not report)
None.

## Files

## FILE: js/productionSharedCareerStart.js (568 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedCareerStart=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const PANEL_ID="productionSharedCareerStartOverlay";
9:   const CONTROL_ID="continueClubAssignment";
10:   const POLL_MS=15000;
11:   // Job 33 (R1): once this manager has acknowledged, read every 3 s for at most 3 minutes while waiting on the rival.
12:   const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
13:   let transferOpening=false;const TRANSFER_OPEN_LIMIT_MS=120000;
14:   let installed=false,busy=false,revealStage=null,pollTimer=null,setupApi=null,provider=null,view=null,lastError="",operationTail=Promise.resolve(),refreshPromise=null,openPromise=null,readyKey="",fastWaitKey="",fastWaitSince=0,autoContinueKey="";
15: 
16:   function pcstCreate(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
17:   function pcstReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
18:   async function pcstLoadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
19:   async function pcstEnsureDependencies(){
20:     if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-career-start","css/remoteJoining.css");
21:     await pcstLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
22:     await pcstLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
23:     await pcstLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
24:     await pcstLoadScript("ssjr-spark-shared-setup","js/sparkSharedShowdownSetup.js",()=>root.CareerModeSparkSharedShowdownSetup);
25:     await pcstLoadScript("ssjr-career-start-protocol","js/sharedCareerStart.js",()=>root.CareerModeSharedCareerStart);
26:     await pcstLoadScript("ssjr-career-start-provider","js/sparkSharedCareerStart.js",()=>root.CareerModeSparkSharedCareerStart);
27:     await pcstLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
28:     await pcstLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
29:     setupApi=root.CareerModeProductionSharedShowdownSetup;provider=root.CareerModeSparkSharedCareerStart;
30:     if(!setupApi||typeof setupApi.getState!=="function"||typeof setupApi.refresh!=="function")throw new Error("Shared Setup authority is unavailable for Career Start.");
31:     if(!provider||typeof provider.read!=="function"||typeof provider.acknowledge!=="function")throw new Error("Shared Career Start provider is unavailable.");
32:     // r86: the Special Player lines (each player's original club) are drawn with the panel's first frame. Optional: a failure
33:     // only leaves the lines out.
34:     try{await pcstLoadScript("special-player-chip","js/specialPlayerChip.js",()=>root.CareerModeSpecialPlayerChip);await root.CareerModeSpecialPlayerChip.ensure();}catch(_error){}
35:   }
36:   // r86 Special Player: the club he played for in FIFA 17 at launch, so each manager can sign him in-game. Only a Showdown
37:   // confirmed on r86 or later has one (no line otherwise).
38:   function pcstSpecialPlayers(){try{const chip=root.CareerModeSpecialPlayerChip,state=pcstSetupState();return chip&&state&&Number.isFinite(state.setupUpdatedAtMs)?chip.forShowdown(state.rivalryId,state.setupUpdatedAtMs,state.setup?.clubs):null;}catch(_error){return null;}}
39:   function pcstSetupState(){try{return setupApi&&setupApi.getState?setupApi.getState():root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
40:   function pcstConfirmed(){const state=pcstSetupState();return Boolean(state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
41:   function pcstReady(){return Boolean(view&&view.state&&view.state.phase==="CAREER_START_READY");}
42:   function pcstStopPolling(){if(pollTimer!==null&&typeof root.clearInterval==="function"){root.clearInterval(pollTimer);pollTimer=null;}return true;}
43:   function pcstWithTimeout(task,request){
44:     if(request)return task(request);
45:     let timer;const error=Object.assign(new Error("Career Start took too long. Check your connection and tap again."),{code:"CAREER_START_TIMEOUT"});
46:     // r87: the Russian Roster Roulette between Career Start and the Transfer Challenge runs at the manager's pace, so the 25 s
47:     // limit waits while it is on screen (js/rosterRouletteStep.js active()). Fable F6-09: it also waits while the Transfer
48:     // Challenge open is still in flight before the roulette shows (a cold cache loads its files), up to 2 minutes in all.
49:     // r88: Chamber Men, before the roulette, is at the managers' pace too (each kick's clock waits for the rival to lock in).
50:     const began=Date.now();
51:     const timeout=new Promise((_,reject)=>{const fire=()=>{if(root.CareerModeRosterRouletteStep?.active?.()||root.CareerModeChamberMenStep?.active?.()||(transferOpening&&Date.now()-began<TRANSFER_OPEN_LIMIT_MS)){timer=root.setTimeout(fire,25000);return;}reject(error);};timer=root.setTimeout(fire,25000);});
52:     let active=true;request={wait:promise=>Promise.race([promise,timeout]).then(value=>{if(!active)throw error;return value;})};
53:     return Promise.race([Promise.resolve().then(()=>task(request)),timeout]).catch(failure=>{if(failure===error){lastError=error.message;if(task===pcstOpenPanelNow)pcstEnsurePanel();pcstRender();pcstDecorateControl();}throw failure;}).finally(()=>{active=false;root.clearTimeout(timer);});
54:   }
55:   function pcstSerialize(task){const run=operationTail.then(task,task);operationTail=run.then(()=>undefined,()=>undefined);return run;}
56:   function pcstDeactivateSetupPresentation(){const presentation=root.CareerModeProductionSharedShowdownPresentation;if(presentation&&typeof presentation.deactivate==="function")presentation.deactivate();return true;}
57:   function pcstLeagueName(id){try{const item=typeof root.getLeagueById==="function"&&root.getLeagueById(id);if(item&&item.name)return item.name;}catch(_error){}return String(id||"").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());}
58:   function pcstRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `career_start_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
59:   // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup instead of re-reading it.
60:   async function pcstProviderOptions(light=false,request){
61:     await request.wait(pcstEnsureDependencies());if(!(light===true&&pcstConfirmed()))await request.wait(setupApi.refresh());const state=setupApi.getState();if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)throw new Error("Both managers must finish Shared Setup before Career Start.");
62:     const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await request.wait(runtime.ensureAccountServices()));
63:     if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)throw new Error("Connected account services are unavailable.");
64:     return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,cryptoImpl:root.crypto}};
65:   }
66:   function pcstSetupKey(state){return state&&state.ready===true&&state.rivalryId&&state.managerRole&&state.setup?`${state.rivalryId}|${state.managerRole}|${JSON.stringify(state.setup)}`:"";}
67:   function pcstApplyView(result,state){
68:     view={...result,setup:state.setup};readyKey=pcstReady()?pcstSetupKey(state):"";lastError="";pcstRender();pcstDecorateControl();pcstNoteSeasonStart(state);if(pcstReady()){pcstStopPolling();pcstScheduleAutoContinue();}return view;
69:   }
70:   // r87 RE-05: Career Start READY is where season 1 starts for the reads meter; the reads before it (Home, pairing, setup, Special
71:   // Player, this panel) are setup, never part of a season's cost (js/sparkPrivatePairing.js, noteSeasonStart).
72:   function pcstNoteSeasonStart(state){if(!pcstReady()||!state?.rivalryId)return;try{root.CareerModeFirestoreBudget?.noteSeasonStart?.(`${state.rivalryId}|1`);}catch(_error){}}
73:   function pcstPanelOpen(){const overlay=root.document&&root.document.getElementById(PANEL_ID);return Boolean(overlay&&!overlay.classList.contains("hidden"));}
74:   // Job 33 (R4b): once BOTH managers have attested (CAREER_START_READY), an open Career Start moves on to the Transfer
75:   // Challenge by itself. Navigation only: each manager's own I STARTED AT tap is still required, and the button stays as a fallback.
76:   function pcstAutoContinueKey(){return view&&view.state&&view.setup?`${view.setup.rivalryId||pcstSetupState()?.rivalryId||""}|${view.state.revision}`:"";}
77:   function pcstScheduleAutoContinue(){if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcstAutoContinue(),0);else void pcstAutoContinue();}
78:   async function pcstAutoContinue(){
79:     if(busy||!pcstReady()||!pcstPanelOpen())return false;const key=pcstAutoContinueKey();if(!key||key===autoContinueKey)return false;
80:     autoContinueKey=key;return pcstOpenTransferChallenge();
81:   }
82:   function pcstOwnAcknowledged(result){
83:     const role=result?.managerRole,state=result?.state;
84:     return Boolean(role&&state&&Array.isArray(state.acknowledgedRoles)&&state.acknowledgedRoles.includes(role));
85:   }
86:   // CAREER_START_READY is final for one confirmed Shared Setup, and the Transfer and Season Result providers re-check it inside
87:   // their own transactions. Transfer and Season Results call this before every read and publish, so re-reading it there only
88:   // added a request that could fail ("Career Start could not be read.") and block a publish. Reuse it for the same Setup.
89:   function pcstRefresh(light=false,request){
90:     if(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()))return Promise.resolve(view);
91:     if(refreshPromise)return refreshPromise;
92:     const run=pcstSerialize(()=>pcstWithTimeout(async request=>{const ctx=await pcstProviderOptions(light===true,request),result=await request.wait(provider.read(ctx.options));if(!result||result.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:result&&result.code});return pcstApplyView(result,ctx.state);},request));
93:     refreshPromise=run.finally(()=>{if(refreshPromise===wrapped)refreshPromise=null;});
94:     const wrapped=refreshPromise;
95:     return wrapped;
96:   }
97:   async function pcstAcknowledge(){
98:     if(busy)return false;
99:     busy=true;lastError="";pcstRender();
100:     const operationId=pcstRandomOperationId();
101:     try{
102:       return await pcstSerialize(async()=>{
103:         return pcstWithTimeout(async request=>{
104:         const ctx=await pcstProviderOptions(false,request);
105:         let current=await request.wait(provider.read(ctx.options));
106:         if(!current||current.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:current&&current.code});
107:         if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
108:         for(let attempt=0;attempt<2;attempt+=1){
109:           const result=await request.wait(provider.acknowledge({...ctx.options,operationId,baseRevision:current.revision||0}));
110:           if(result&&result.ok===true){pcstApplyView(result,ctx.state);return true;}
111:           const code=result&&result.code||"CAREER_START_PROVIDER_FAILED";
112:           // Job 21: two managers acknowledging at once -> the loser is rejected by the Rules (permission-denied); treat it like a stale revision (re-read, retry once).
113:           if(["CAREER_START_STALE_BASE_REVISION","CAREER_START_ROLE_ALREADY_ACKNOWLEDGED","CAREER_START_ALREADY_READY","permission-denied","firestore/permission-denied","permission_denied"].includes(code)){
114:             const refreshed=await request.wait(provider.read(ctx.options));
115:             if(!refreshed||refreshed.ok!==true)throw Object.assign(new Error("Career Start could not be reconciled after another acknowledgement."),{code:refreshed&&refreshed.code||code});
116:             current=refreshed;
117:             if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
118:             if((code==="CAREER_START_STALE_BASE_REVISION"||code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied")&&attempt===0)continue;
119:           }
120:           throw Object.assign(new Error("Career Start acknowledgement was rejected."),{code});
121:         }
122:         throw Object.assign(new Error("Career Start acknowledgement could not be reconciled."),{code:"CAREER_START_ACK_RETRY_EXHAUSTED"});
123:         });
124:       });
125:     }catch(error){
126:       lastError=pcstErrorText(error,"Your Career Start was not recorded.");
127:       pcstReport("Could not confirm Career Start",error);
128:       return false;
129:     }finally{
130:       busy=false;pcstRender();if(pcstReady())pcstScheduleAutoContinue();
131:     }
132:   }
133:   async function pcstOpenTransferChallenge(){
134:     if(busy||!pcstReady())return false;
135:     busy=true;pcstRender();
136:     try{
137:       await pcstEnsureDependencies();
138:       const transfer=root.CareerModeProductionSharedTransferChallenge;
139:       if(!transfer||typeof transfer.install!=="function"||typeof transfer.open!=="function")throw new Error("Shared Transfer Challenge is unavailable.");
140:       transfer.install();
141:       transferOpening=true;
142:       const opened=await transfer.open();
143:       transferOpening=false;
144:       // r87: the manager left the Russian Roster Roulette or the Prime Pack for Showdown Home; it opens again from there. Not a failure.
145:       if(opened!==true&&(root.CareerModeRosterRouletteStep?.wentHome?.()||root.CareerModeIconGuessStep?.wentHome?.()||root.CareerModeChamberMenStep?.wentHome?.())){pcstClosePanel();return false;}
146:       // The roulette or the Prime Pack could not start (Setup not read, its files not loaded): its own reason, not a generic one (Fable F2-05).
147:       const reason=opened!==true&&typeof transfer.rouletteError==="function"?transfer.rouletteError():"";
148:       if(reason){lastError=reason;return false;}
149:       if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
150:       pcstClosePanel();
151:       return true;
152:     }catch(error){
153:       lastError=pcstErrorText(error,"The Transfer War could not be opened.");
154:       pcstReport("Could not continue to the Transfer War",error);
155:       return false;
156:     }finally{
157:       busy=false;transferOpening=false;pcstRender();
158:     }
159:   }
160:   // Keep provider codes in diagnostics, not in the sentence shown beneath the Career Start button.
161:   function pcstErrorText(error,fallback){
162:     if(error?.code==="CAREER_START_TIMEOUT")return error.message;
163:     const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;
164:     const code=String(error?.code||""),message=String(error?.message||"");
165:     const plain=error&&error.providerResult!==true&&message&&message!==code&&!/\b\w+(?:[-_/]\w+)+\b/.test(message)?message:fallback;
166:     return `${plain} Please try again.`;
167:   }
168:   function pcstManagerLabel(role){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;const name=showdown&&showdown.managers&&showdown.managers[role];if(name)return name;}catch(_error){}return role==="playerOne"?"PLAYER ONE":"PLAYER TWO";}
169:   function pcstRow(label,value,state){const item=pcstCreate("div","settingsInfoRow");item.dataset.careerRow=state||"";item.append(pcstCreate("span","",label),pcstCreate("strong","",value));return item;}
170:   // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
171:   // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
172:   let pcstWatchedKey=null;
173:   function pcstWatchSync(){let key="";try{key=pcstWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcstWatchedKey)return;pcstWatchedKey=key;try{pcstWatchWait();}catch(_error){}}
174:   // HO-049 item 4 · Career Start option B (Nik picked B, 2026-10-31; spec CAREER_START_B_SPEC.md). On the Club Assignment
175:   // screen Career Start is its own stage on the Club plate, never a box over the wordmark or the faces: Daniel (left) and
176:   // Nik (right) each hold his club's crest and name inside his pack face; a narrow marble pillar between them (desktop) or
177:   // one marble panel under the packs (phone) holds the words; the two buttons sit on the lower deck (desktop) or at the
178:   // panel's foot (phone). Layout only: the same nodes, texts, buttons, listeners, status and reads as the card above. Any
179:   // other screen keeps the card. No dim, no scrim, no flash: the stage is set in the same task that shows the panel, and
180:   // its styles arrive with css/remoteJoining.css, which the panel loads before it opens.
181:   // Nik's rule: the crest and the name ALWAYS fit inside the pack frame. Inner box = the frame inset 10% on each side (with
182:   // overflow hidden as a safety net); name clamp(11px, innerH x 0.16, 22px) on one line (a name wider than the box shrinks
183:   // until it fits); crest = square floor(min(innerW, innerH - 1.5 x label)), contain fit.
184:   const STAGE_HOST="clubWheelScreen",STAGE_ATTR="careerStartStage";
185:   // The two painted packs on ENV_CLUB_PHONE_V2 (1179x2096 plate px), drawn centre top at max(100vw, 100svh x 1179/2096).
186:   const PHONE_PLATE=Object.freeze({w:1179,h:2096,packs:Object.freeze([Object.freeze([236,556]),Object.freeze([668,996])]),top:584,bottom:924});
187:   let stageWatch=null;
188:   function pcstFitHold(frame){
189:     const ix=frame.w*.1,iy=frame.h*.1,w=frame.w-2*ix,h=frame.h-2*iy,label=Math.max(11,Math.min(22,h*.16));
190:     return {x:frame.x+ix,y:frame.y+iy,w,h,label,crest:Math.max(0,Math.floor(Math.min(w,h-label*1.5))),gap:label*.2};
191:   }
192:   function pcstStageHost(){
193:     const doc=root.document,host=doc&&typeof doc.getElementById==="function"?doc.getElementById(STAGE_HOST):null;
194:     if(!host||!host.classList||host.classList.contains("hidden")||!host.classList.contains("cl-on"))return null;
195:     return doc.documentElement&&doc.documentElement.dataset&&doc.documentElement.dataset.v10Screen===STAGE_HOST?host:null;
196:   }
197:   // desktop: Team V's Club layout places .clubPackStage on each held pack. phone (upright phone or tablet): the packs are
198:   // painted on the plate behind the screen. band (sideways phone): the plate fills the left band (cover, centre top).
199:   function pcstStageMode(host){
200:     const scene=host.querySelector(".clPhoneScene");
201:     if(scene&&typeof root.getComputedStyle==="function"&&root.getComputedStyle(scene).display!=="none")return root.innerWidth>root.innerHeight?"band":"phone";
202:     return host.querySelectorAll(".clubPackStage").length===2?"desktop":null;
203:   }
204:   // r96: when even the tightest step does not fit (small phones, long names), nothing is hidden: the panel takes the height its
205:   // words need and the page scrolls (main is the only scroller), so the rival line and both buttons stay reachable.
206:   // r97: the grown panel is only reachable if there is scroll room under it (an upright phone clips the Club screen to the window,
207:   // html[data-career-start-stage="phone"] in css/remoteJoining.css): --pcst-need is the height the panel needs, and main scrolls to it.
208:   function pcstReachReset(){try{const root_=root.document&&root.document.documentElement;if(root_){root_.style.removeProperty("--pcst-need");delete root_.dataset.careerStartReach;}}catch(_error){}}
209:   function pcstPillarGrow(pillar){
210:     if(pillar.scrollHeight>pillar.clientHeight+1){pillar.style.bottom="auto";pillar.style.maxHeight="none";}
211:     if(pillar.style.maxHeight==="none"){try{const overlay=pillar.closest("#"+PANEL_ID),top=overlay?overlay.getBoundingClientRect().top:0,need=Math.ceil(pillar.getBoundingClientRect().bottom-top+8);if(need>root.innerHeight){const html=root.document.documentElement;html.style.setProperty("--pcst-need",`${need}px`);html.dataset.careerStartReach="1";}}catch(_error){}}
212:   }
213:   function pcstStageBox(node,origin){const r=node.getBoundingClientRect();return {x:r.left-origin.left,y:r.top-origin.top,w:r.width,h:r.height};}
214:   // The Club screen's box room (plates-hc/ENV_BOX_PHONE_HC_V3) puts the two managers behind a counter with the club packs on
215:   // it, under their chins. js/clubScreenV10.js clBoxLayout says where that plate is drawn (--clb-bg-pos/--clb-bg-size on the
216:   // screen upright, --clb-band-pos/--clb-band-size on the band sideways); the holds stand on the counter in plate units,
217:   // below the chins and clear of the faces at every size. Without those values (box room off) the old plate's numbers apply.
218:   const BOX_PLATE=Object.freeze({packs:Object.freeze([Object.freeze([160,520]),Object.freeze([680,1040])]),top:960,bottom:1219});
219:   function pcstPlateVars(node,posVar,sizeVar){
220:     try{const style=node&&node.style;if(!style)return null;const pos=String(style.getPropertyValue(posVar)).trim().split(/\s+/).map(parseFloat),width=parseFloat(style.getPropertyValue(sizeVar));
221:       return pos.length>=2&&Number.isFinite(pos[0])&&Number.isFinite(pos[1])&&width>0?{x:pos[0],y:pos[1],w:width}:null;}catch(_error){return null;}
222:   }
223:   function pcstStageFrames(overlay,host,mode,origin){
224:     if(mode==="desktop")return [...host.querySelectorAll(".clubPackStage")].slice(0,2).map(node=>pcstStageBox(node,origin));
225:     let k,x0,y0,plate=PHONE_PLATE;
226:     const scene=host.querySelector(".clPhoneScene"),vars=mode==="phone"?pcstPlateVars(host,"--clb-bg-pos","--clb-bg-size"):pcstPlateVars(scene,"--clb-band-pos","--clb-band-size");
227:     if(vars){const box=pcstStageBox(mode==="phone"?host:scene,origin);k=vars.w/PHONE_PLATE.w;x0=box.x+vars.x;y0=box.y+vars.y;plate=BOX_PLATE;}
228:     else if(mode==="phone"){const box=pcstStageBox(host,origin),probe=overlay.querySelector(".pcstPlateProbe"),width=probe?probe.getBoundingClientRect().width:Math.max(box.w,root.innerHeight*PHONE_PLATE.w/PHONE_PLATE.h);k=width/PHONE_PLATE.w;x0=box.x+(box.w-width)/2;y0=box.y;}
229:     else{const band=pcstStageBox(scene,origin);k=Math.max(band.w/PHONE_PLATE.w,band.h/PHONE_PLATE.h);x0=band.x+(band.w-PHONE_PLATE.w*k)/2;y0=band.y;}
230:     return plate.packs.map(([a,b])=>({x:x0+a*k,y:y0+plate.top*k,w:(b-a)*k,h:(plate.bottom-plate.top)*k}));
231:   }
232:   function pcstStageHold(role,club){
233:     const hold=pcstCreate("div","pcstHold");hold.dataset.side=role;hold.setAttribute("aria-hidden","true");
234:     const crest=pcstCreate("div","pcstHoldCrest");try{if(typeof root.getClubCrestMarkup==="function")crest.innerHTML=root.getClubCrestMarkup(club,"big");else if(typeof root.getClubCrestSvg==="function")crest.innerHTML=root.getClubCrestSvg(club);}catch(_error){}
235:     hold.append(crest,pcstCreate("div","pcstHoldName",club));return hold;
236:   }
237:   // stageFailed: the Club screen's visuals could not load (a missing map, script or style), so Career Start shows on its own
238:   // black-and-gold marble plate (mode "fallback") with every control, plus RETRY, instead of waiting behind an invisible panel.
239:   let stageRetry=null,stageRetries=0,stageFailed=false,retryFailed=false;
240:   function pcstStageGiveWay(){
241:     if(stageFailed)return;stageFailed=true;
242:     const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden"))pcstRender();
243:   }
244:   function pcstStageRetry(){
245:     // Where the Club screen exists, for at most 30 s per open; after that (or with no Club screen at all) the marble fallback.
246:     if(stageRetry||typeof root.setTimeout!=="function")return;
247:     if(!root.document?.getElementById?.(STAGE_HOST)||stageRetries>=100){root.setTimeout(pcstStageGiveWay,0);return;}
248:     stageRetries+=1;
249:     stageRetry=root.setTimeout(()=>{stageRetry=null;const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&!overlay.classList.contains("pcstStage"))pcstRender();},300);
250:   }
251:   function pcstStageOff(overlay){
252:     try{
253:       const doc=root.document;pcstStageWatch(false);pcstReachReset();
254:       if(doc&&doc.documentElement&&doc.documentElement.dataset)delete doc.documentElement.dataset[STAGE_ATTR];
255:       if(overlay&&overlay.classList&&overlay.classList.contains("pcstStage")){overlay.classList.remove("pcstStage");delete overlay.dataset.stageMode;overlay.style.removeProperty("top");if(doc.body&&overlay.parentNode!==doc.body)doc.body.append(overlay);}
256:     }catch(_error){}
257:     return false;
258:   }
259:   // Re-lays the stage on a resize (the Club layout moves the packs with the window); a turn of the phone rebuilds it.
260:   function pcstStageWatch(on){
261:     if(!on){if(stageWatch){root.removeEventListener?.("resize",stageWatch.schedule);root.document?.removeEventListener?.("keydown",stageWatch.escape);stageWatch.observer?.disconnect?.();stageWatch.mutations?.disconnect?.();if(stageWatch.frame)root.cancelAnimationFrame?.(stageWatch.frame);stageWatch=null;}return;}
262:     if(stageWatch||typeof root.addEventListener!=="function")return;
263:     const watch={frame:0,observer:null};
264:     watch.schedule=()=>{if(watch.frame||typeof root.requestAnimationFrame!=="function")return;watch.frame=root.requestAnimationFrame(()=>{watch.frame=0;pcstStageLayout();});};
265:     root.addEventListener("resize",watch.schedule);
266:     // Escape never closes Career Start under a running roulette (Fable F2-18).
267:     watch.escape=event=>{if(event.key==="Escape"&&!event.defaultPrevented&&pcstPanelOpen()&&!root.CareerModeRosterRouletteStep?.active?.()){event.preventDefault();pcstClosePanel();}};root.document?.addEventListener?.("keydown",watch.escape);
268:     try{const host=pcstStageHost();if(host&&typeof root.ResizeObserver==="function"){watch.observer=new root.ResizeObserver(watch.schedule);watch.observer.observe(host);host.querySelectorAll(".clubPackStage").forEach(node=>watch.observer.observe(node));}}catch(_error){}
269:     try{const host=pcstStageHost();if(host&&typeof root.MutationObserver==="function"){watch.mutations=new root.MutationObserver(watch.schedule);watch.mutations.observe(host,{attributes:true,attributeFilter:["style"]});const scene=host.querySelector(".clPhoneScene");if(scene)watch.mutations.observe(scene,{attributes:true,attributeFilter:["style"]});}}catch(_error){}
270:     stageWatch=watch;
271:   }
272:   // Every way into Career Start (the Club screen's own button, the first confirmer's automatic open, resume from Home, a
273:   // reload) shows option B, never the old card: when the Club screen is not up, it opens behind Career Start first with the
274:   // confirmed Setup's clubs, drawn as the shared presentation draws them (no draw, no write, no save change). The Club
275:   // screen's own parts already step aside (html[data-career-start-stage]) and the v10 loader keeps its content invisible
276:   // until it is ready (Reus Gate), so neither the wheel nor the packs ever show; the panel goes up the moment the screen is.
277:   function pcstForceScreen(host){
278:     const doc=root.document;for(const el of doc.querySelectorAll(".screen")){const show=el===host;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");}
279:   }
280:   function pcstPaintClubBackdrop(host,state){
281:     const doc=root.document,setup=state.setup,text=(id,value)=>{const node=doc.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;};
282:     host.dataset.sharedPresentationRole=state.managerRole||"unresolved";
283:     text("clubAssignmentLeague",pcstLeagueName(setup.leagueId));text("clubPlayerOne",pcstManagerLabel("playerOne"));text("clubPlayerTwo",pcstManagerLabel("playerTwo"));
284:     if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");else host.dataset.clubRevealStage="confirmation";
285:     for(const [suffix,role] of [["One","playerOne"],["Two","playerTwo"]]){
286:       const card=doc.getElementById(`clubCard${suffix}`),name=doc.getElementById(`clubName${suffix}`),stateNode=doc.getElementById(`clubCardState${suffix}`),club=String(setup.clubs[role]||"");
287:       if(typeof root.applyClubRevealCard==="function")root.applyClubRevealCard(card,name,stateNode,club);else{if(name)name.textContent=club;if(card)card.classList.add("is-revealed");}
288:     }
289:   }
290:   function pcstWaitForStageHost(host,ms){
291:     return new Promise(resolve=>{
292:       if(pcstStageHost())return resolve(true);
293:       let done=false,observer=null,timer=null;
294:       const finish=ok=>{if(done)return;done=true;try{observer&&observer.disconnect();}catch(_error){}if(timer)root.clearTimeout(timer);resolve(ok);};
295:       try{observer=new root.MutationObserver(()=>{if(pcstStageHost())finish(true);});observer.observe(root.document.documentElement,{attributes:true,attributeFilter:["data-v10-screen"]});observer.observe(host,{attributes:true,attributeFilter:["class"]});}catch(_error){}
296:       timer=root.setTimeout(()=>finish(Boolean(pcstStageHost())),ms);
297:     });
298:   }
299:   // Loads (or reloads) the Club screen's visuals through the v10 loader: a load that failed before (its maps, script or styles)
300:   // is tried again, because the loader forgets a failed load. false only when they cannot load.
301:   async function pcstShowClubVisuals(){
302:     const screens=root.CareerModeV10Screens;
303:     if(!screens||typeof screens.show!=="function")return false;
304:     // No toast: the fallback panel says it once, and a toast would cover its buttons.
305:     try{await screens.show(STAGE_HOST);return true;}catch(error){try{root.console?.warn?.("[Career Mode Showdown] Club visuals unavailable for Career Start.",error);}catch(_error){}return false;}
306:   }
307:   async function pcstClubBackdrop(){
308:     if(pcstStageHost())return true;
309:     const doc=root.document,host=doc&&typeof doc.getElementById==="function"?doc.getElementById(STAGE_HOST):null,state=pcstSetupState();
310:     if(!host||!doc.documentElement||!doc.documentElement.dataset||!state||!state.setup||!state.setup.clubs)return false;
311:     try{if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();}catch(_error){}
312:     try{if(root.CareerModeClubScreenV10&&typeof root.CareerModeClubScreenV10.install==="function")await root.CareerModeClubScreenV10.install();}catch(_error){}
313:     if(pcstStageHost())return true;
314:     doc.documentElement.dataset[STAGE_ATTR]="opening";
315:     let shown=false;
316:     try{shown=typeof root.showScreen==="function"&&root.showScreen(STAGE_HOST,false)===true;}catch(_error){shown=false;}
317:     if(!shown)pcstForceScreen(host);
318:     pcstPaintClubBackdrop(host,state);
319:     const ready=await pcstShowClubVisuals()&&await pcstWaitForStageHost(host,10000);
320:     if(!ready&&doc.documentElement.dataset[STAGE_ATTR]==="opening")delete doc.documentElement.dataset[STAGE_ATTR];
321:     return ready;
322:   }
323:   function pcstStageTarget(){
324:     const host=pcstStageHost(),mode=host&&pcstStageMode(host);
325:     if(mode)return {host,mode};
326:     return stageFailed&&root.document&&root.document.body?{host:root.document.body,mode:"fallback"}:null;
327:   }
328:   function pcstStage(overlay,body,ctx){
329:     try{
330:       const target=overlay.classList.contains("hidden")?null:pcstStageTarget(),host=target&&target.host,mode=target&&target.mode;
331:       if(!mode){if(!overlay.classList.contains("hidden"))pcstStageRetry();return pcstStageOff(overlay);}
332:       const doc=root.document,fallback=mode==="fallback";
333:       if(!fallback){stageRetries=0;stageFailed=false;retryFailed=false;}
334:       if(overlay.parentNode!==host)host.append(overlay);overlay.style.removeProperty("top");
335:       overlay.classList.add("pcstStage");overlay.dataset.stageMode=mode;if(fallback)delete doc.documentElement.dataset[STAGE_ATTR];else doc.documentElement.dataset[STAGE_ATTR]=mode;
336:       const title=pcstCreate("div","pcstTitle");title.append(pcstCreate("span","pcstTitleKicker","CAREER MODE SHOWDOWN 17"));
337:       const eyebrow=body.querySelector(".remoteJoiningEyebrow");title.append(eyebrow||pcstCreate("span","remoteJoiningEyebrow","CAREER START"));title.lastChild.classList.add("pcstTitleWord");
338:       const pillar=pcstCreate("div","pcstPillar"),heading=body.querySelector("h2"),note=body.querySelector(":scope > p:not(.remoteJoiningStatus)");
339:       if(heading){heading.classList.add(ctx?"pcstKicker":"pcstSrOnly");pillar.append(heading);}
340:       const holds=[];
341:       if(ctx){
342:         const grid=body.querySelector(".settingsInfoGrid"),rows=grid?[...grid.children]:[],row=label=>rows.find(item=>item.firstChild&&item.firstChild.textContent===label);
343:         const chips=pcstCreate("div","pcstChips");for(const label of ["LEAGUE","SHOWDOWN LENGTH"]){const item=row(label);if(item)chips.append(item);}pillar.append(chips);
344:         // The product's own message. Its idle status ("…confirm below") is folded into it, so the stage says it once.
345:         if(note){note.classList.add("pcstNote");note.replaceChildren("Your club is ",pcstCreate("b","",ctx.ownClub),`. Start or load a FIFA 17 Career Mode save with that club${ctx.idle?", then confirm":""}.`);pillar.append(note);}
346:         if(ctx.idle)ctx.status.dataset.stageIdle="true";pillar.append(ctx.status);
347:         const rival=row("RIVAL");if(rival){rival.classList.add("pcstRival");pillar.append(rival);}
348:         // Nik's rule (2026-10-29): each Special Player's original club stays on Career Start.
349:         for(const item of rows)if(item.dataset.careerRow==="special"){item.classList.add("pcstSpecial");pillar.append(item);}
350:         const you=row("YOU");if(you){you.classList.add("pcstSrOnly");pillar.append(you);}
351:         if(grid)grid.remove();
352:         if(!fallback)holds.push(pcstStageHold("playerOne",ctx.setup.clubs.playerOne),pcstStageHold("playerTwo",ctx.setup.clubs.playerTwo));
353:       }else if(note){note.classList.add("pcstNote");pillar.append(note);}
354:       const actions=body.querySelector(".remoteJoiningActions");
355:       if(actions&&mode!=="desktop")pillar.append(actions);
356:       // The card's × and the Club screen's BACK both step aside with the stage, so the stage carries its own way out
357:       // (Escape too): it closes Career Start and gives the Club screen back, where CONTINUE TO CAREER START reopens it.
358:       const back=pcstCreate("button","compactButton pcstBack","BACK");back.type="button";back.setAttribute("aria-label","Close Career Start");back.addEventListener("click",pcstClosePanel);
359:       if(fallback){
360:         // The Club screen did not load: say so once, keep every control, and offer RETRY (it loads the Club visuals again).
361:         const notice=pcstCreate("p","pcstFallbackNote",retryFailed?"The Club screen still did not load. Career Start works here; try RETRY again in a moment.":"The Club screen did not load. Career Start works here; RETRY loads the Club screen again.");notice.setAttribute("role","status");
362:         pillar.insertBefore(notice,pillar.children[heading?1:0]||null);
363:         const retry=pcstCreate("button","compactButton pcstRetry","RETRY");retry.type="button";retry.addEventListener("click",()=>void pcstRetryStage(retry));
364:         if(actions)actions.append(retry);else pillar.append(retry);
365:       }
366:       const probe=pcstCreate("div","pcstPlateProbe");probe.setAttribute("aria-hidden","true");
367:       body.prepend(title,...holds,pillar);if(actions&&mode==="desktop"){actions.append(back);body.append(actions);}else body.append(back);body.append(probe);
368:       pcstStageWatch(true);pcstStageLayout();return true;
369:     }catch(error){pcstReport("Career Start stage could not be drawn; using the marble fallback",error);pcstStageOff(overlay);if(!stageFailed&&typeof root.setTimeout==="function")root.setTimeout(pcstStageGiveWay,0);return false;}
370:   }
371:   function pcstStageLayout(){
372:     const doc=root.document,overlay=doc&&doc.getElementById(PANEL_ID);
373:     if(!overlay||!overlay.classList.contains("pcstStage")||overlay.classList.contains("hidden"))return null;
374:     const target=pcstStageTarget(),host=target&&target.host,mode=target&&target.mode;
375:     if(!mode||mode!==overlay.dataset.stageMode){pcstRender();return null;}
376:     if(mode==="fallback")return pcstFallbackLayout(overlay);
377:     const origin=overlay.getBoundingClientRect(),W=origin.width,H=origin.height,frames=pcstStageFrames(overlay,host,mode,origin);
378:     overlay.querySelectorAll(".pcstHold").forEach((hold,index)=>{
379:       const frame=frames[index];if(!frame)return;const fit=pcstFitHold(frame),crest=hold.querySelector(".pcstHoldCrest"),name=hold.querySelector(".pcstHoldName");
380:       hold.dataset.frame=[frame.x,frame.y,frame.w,frame.h].map(v=>Math.round(v*100)/100).join(",");
381:       Object.assign(hold.style,{left:`${fit.x}px`,top:`${fit.y}px`,width:`${fit.w}px`,height:`${fit.h}px`,gap:`${fit.gap}px`});
382:       // One line at the clamp size; a slightly long name shrinks to fit; a long one ("Borussia Mönchengladbach") takes two
383:       // lines and shrinks until both fit, and the crest gives up the height the name needs.
384:       const setName=(size,wrap)=>{name.style.fontSize=`${size}px`;name.style.whiteSpace=wrap?"normal":"nowrap";};
385:       setName(fit.label,false);
386:       if(name.scrollWidth>fit.w){
387:         const one=Math.floor(fit.label*fit.w/name.scrollWidth*.97*10)/10;
388:         if(one>=fit.label*.8)setName(one,false);
389:         else{let size=fit.label;setName(size,true);for(let step=0;step<12&&size>7&&(name.scrollWidth>fit.w+.5||name.scrollHeight>size*2.3);step++){size=Math.max(7,Math.floor(size*.92*10)/10);setName(size,true);}}
390:       }
391:       crest.style.width=crest.style.height=`${Math.max(0,Math.min(fit.crest,Math.floor(Math.min(fit.w,fit.h-name.offsetHeight-fit.gap))))}px`;
392:     });
393:     const title=overlay.querySelector(".pcstTitle"),pillar=overlay.querySelector(".pcstPillar"),actions=overlay.querySelector(".remoteJoiningActions"),scene=host.querySelector(".clPhoneScene");
394:     if(!title||!pillar)return null;
395:     pillar.removeAttribute("data-room");pillar.removeAttribute("style");title.removeAttribute("style");pcstReachReset();
396:     if(mode==="desktop"){
397:       title.style.top=`${Math.round(H*.09)}px`;title.style.setProperty("--pcst-title",`${Math.round(H*.058)}px`);
398:       const left=frames[0].x+frames[0].w,right=frames[1].x,room=right-left-16,width=Math.round(room>=240?Math.min(380,room):Math.min(380,W*.27));
399:       const below=title.getBoundingClientRect().bottom-origin.top+10;
400:       Object.assign(pillar.style,{left:`${Math.round((left+right)/2-width/2)}px`,width:`${width}px`,top:`${Math.round(Math.max(H*.25,below))}px`});
401:       if(actions){actions.removeAttribute("style");actions.style.top=`${Math.round(Math.max(H*.755,pillar.getBoundingClientRect().bottom-origin.top+12))}px`;}
402:     }else{
403:       const band=scene?pcstStageBox(scene,origin):{x:0,y:0,w:0,h:0},packBottom=Math.max(...frames.map(f=>f.y+f.h));
404:       // Where the site's top bar shows (sideways phones wider than 900px), the stage starts below it.
405:       const top=Math.max(band.y,pcstTopBarBottom(origin));
406:       // Portrait or sideways, the panel is placed first; the BACK is placed on its own after (it never decides the layout).
407:       if(mode==="phone"){title.style.top=`${Math.round(top+12)}px`;pillar.style.top=`${Math.round(Math.max(band.y+band.h,packBottom+6))}px`;}
408:       else{Object.assign(title.style,{top:`${Math.round(top+10)}px`,left:`${Math.round(band.x)}px`,width:`${Math.round(band.w)}px`});Object.assign(pillar.style,{left:`${Math.round(band.x+band.w+8)}px`,top:`${Math.round(top+8)}px`});}
409:       const back=overlay.querySelector(".pcstBack");if(back&&!pillar.contains(back)&&!(actions&&actions.contains(back))){back.removeAttribute("style");back.style.top=`${Math.round(top+(mode==="phone"?10:8))}px`;}
410:       // The panel tightens step by step until nothing overflows; the rival line stays.
411:       const room=pillar.getBoundingClientRect().height;if(room<290)pillar.dataset.room="short";
412:       for(const step of ["tight","tighter","tightest"])if(pillar.scrollHeight>pillar.clientHeight+1)pillar.dataset.room=step;pcstPillarGrow(pillar);
413:     }
414:     return mode;
415:   }
416:   // The app's runtime notice for the same failure ("Team V screen could not load…") says what the fallback panel already says,
417:   // and on a small phone it would cover the panel's buttons: it is dismissed through its own close button. Other notices stay.
418:   function pcstDismissClubNotice(){
419:     try{const notice=root.document.getElementById("appRuntimeNotice");if(notice&&/Team V screen could not (load|update)|Ball Game visuals|Club Assignment visuals|CLUB_V10_MAP/.test(notice.textContent||""))notice.querySelector("button")?.click();}catch(_error){}
420:   }
421:   function pcstFallbackLayout(overlay){
422:     pcstDismissClubNotice();
423:     overlay.style.top=`${Math.round(pcstTopBarBottom({top:0}))}px`;
424:     const title=overlay.querySelector(".pcstTitle"),pillar=overlay.querySelector(".pcstPillar"),back=overlay.querySelector(".pcstBack");
425:     if(!title||!pillar)return null;
426:     pillar.removeAttribute("data-room");pillar.removeAttribute("style");title.removeAttribute("style");pcstReachReset();
427:     const origin=overlay.getBoundingClientRect();
428:     title.style.top="12px";title.style.setProperty("--pcst-title",`${Math.round(Math.max(22,Math.min(34,origin.height*.05)))}px`);
429:     if(back){back.removeAttribute("style");back.style.top="10px";}
430:     const below=Math.max(title.getBoundingClientRect().bottom,back?back.getBoundingClientRect().bottom:0)-origin.top+10;
431:     pillar.style.top=`${Math.round(below)}px`;pillar.style.maxHeight=`${Math.max(0,Math.floor(origin.height-below-8))}px`;
432:     const room=pillar.getBoundingClientRect().height;if(room<290)pillar.dataset.room="short";
433:     for(const step of ["tight","tighter","tightest"])if(pillar.scrollHeight>pillar.clientHeight+1)pillar.dataset.room=step;pcstPillarGrow(pillar);
434:     return "fallback";
435:   }
436:   async function pcstRetryStage(button){
437:     if(button){button.disabled=true;button.textContent="RETRYING…";}
438:     let ok=false;try{ok=await pcstClubBackdrop();}catch(_error){ok=false;}
439:     stageFailed=!ok;retryFailed=!ok;stageRetries=0;
440:     if(pcstPanelOpen())pcstRender();
441:     return ok;
442:   }
443:   function pcstTopBar(){
444:     const doc=root.document,bar=doc&&doc.querySelector(".sd-nav-top");if(!bar||typeof root.getComputedStyle!=="function")return null;
445:     const style=root.getComputedStyle(bar),rect=bar.getBoundingClientRect();
446:     return style.display==="none"||style.visibility==="hidden"||rect.height<1||!/fixed|sticky/.test(style.position)?null:rect;
447:   }
448:   function pcstTopBarBottom(origin){const rect=pcstTopBar();return rect?Math.max(0,rect.bottom-origin.top):0;}
449:   // The audit Nik asked for (HO-049): at every size the crest and the name sit inside the pack frame ("fits"), and nothing
450:   // covers anything (packs, title, pillar or panel, buttons), the words never overflow their panel, and all stays on screen.
451:   function pcstStageAudit(){
452:     const doc=root.document,overlay=doc&&doc.getElementById(PANEL_ID);
453:     if(!overlay||!overlay.classList.contains("pcstStage")||overlay.classList.contains("hidden"))return {stage:false};
454:     const origin=overlay.getBoundingClientRect(),box=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
455:     const inside=(r,f)=>r.left>=f.left-.5&&r.right<=f.right+.5&&r.top>=f.top-.5&&r.bottom<=f.bottom+.5;
456:     const overlap=(a,b)=>a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5;
457:     const frames=[],holds=[...overlay.querySelectorAll(".pcstHold")].map(hold=>{
458:       const [x,y,w,h]=String(hold.dataset.frame||"").split(",").map(Number),frame={left:origin.left+x,top:origin.top+y,right:origin.left+x+w,bottom:origin.top+y+h};frames.push(frame);
459:       const name=hold.querySelector(".pcstHoldName"),crest=box(hold.querySelector(".pcstHoldCrest")),label=box(name);
460:       const fits=[x,y,w,h].every(Number.isFinite)&&crest.right-crest.left>0&&inside(crest,frame)&&inside(label,frame)&&name.scrollWidth<=name.clientWidth+1;
461:       return {side:hold.dataset.side,club:name.textContent,fits:fits?"fits":"OVERFLOW",frame:[x,y,w,h].map(Math.round),crest:Math.round(crest.right-crest.left),label:parseFloat(name.style.fontSize)};
462:     });
463:     const title=box(overlay.querySelector(".pcstTitle")),pillarNode=overlay.querySelector(".pcstPillar"),pillar=box(pillarNode),actionsNode=overlay.querySelector(".remoteJoiningActions"),actions=actionsNode?box(actionsNode):null;
464:     const backNode=overlay.querySelector(".pcstBack"),covers=[],named={title,pillar};if(actions&&!pillarNode.contains(actionsNode))named.buttons=actions;
465:     if(backNode&&!(actionsNode&&actionsNode.contains(backNode))){named.back=box(backNode);if(overlap(named.back,pillar))covers.push("back covers pillar");}
466:     frames.forEach((frame,index)=>{for(const [key,r] of Object.entries(named))if(overlap(r,frame))covers.push(`${key} covers pack ${index+1}`);});
467:     const bar=pcstTopBar();if(bar){const barBox={left:bar.left,top:bar.top,right:bar.right,bottom:bar.bottom};for(const [key,r] of Object.entries(named))if(overlap(barBox,r))covers.push(`top bar covers ${key}`);frames.forEach((frame,index)=>{if(overlap(barBox,frame))covers.push(`top bar covers pack ${index+1}`);});}
468:     if(overlap(title,pillar))covers.push("title covers pillar");if(named.back){const word=box(overlay.querySelector(".pcstTitleWord"));if(overlap(named.back,word))covers.push("back covers title");}if(named.buttons&&overlap(named.buttons,pillar))covers.push("buttons cover pillar");
469:     const viewH=root.innerHeight,viewW=root.innerWidth,onScreen=Object.values(named).every(r=>r.top>=-.5&&r.left>=-.5&&r.bottom<=viewH+.5&&r.right<=viewW+.5);
470:     const overflow=pillarNode.scrollHeight>pillarNode.clientHeight+1||pillarNode.scrollWidth>pillarNode.clientWidth+1;
471:     const retryNode=overlay.querySelector(".pcstRetry");
472:     return {stage:true,back:Boolean(backNode&&backNode.getBoundingClientRect().width>0),retry:Boolean(retryNode&&retryNode.getBoundingClientRect().width>0),mode:overlay.dataset.stageMode,room:pillarNode.dataset.room||"",holds,fits:holds.length===2&&holds.every(item=>item.fits==="fits"),covers,overflow,onScreen,ok:holds.length===2&&holds.every(item=>item.fits==="fits")&&!covers.length&&!overflow&&onScreen};
473:   }
474:   function pcstRender(){pcstWatchSync();
475:     const overlay=root.document&&root.document.getElementById(PANEL_ID);if(!overlay)return;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return;body.replaceChildren();
476:     const setup=view&&view.setup||pcstSetupState()?.setup,role=view&&view.managerRole||pcstSetupState()?.managerRole,career=view&&view.state||null,acknowledged=new Set(career&&career.acknowledgedRoles||[]);if(!setup||!role){body.append(pcstCreate("h2","","CAREER START"),pcstCreate("p","","Loading your Showdown…"));pcstStage(overlay,body,null);return;}
477:     const ownClub=setup.clubs[role],otherRole=role==="playerOne"?"playerTwo":"playerOne",otherClub=setup.clubs[otherRole],ready=career&&career.phase==="CAREER_START_READY",mine=acknowledged.has(role);
478:     body.append(pcstCreate("span","remoteJoiningEyebrow","CAREER START"),pcstCreate("h2","","START YOUR FIFA 17 CAREER"),pcstCreate("p","",`Your club is ${ownClub}. Start or load a FIFA 17 Career Mode save with that club.`));
479:     const grid=pcstCreate("div","settingsInfoGrid");grid.append(pcstRow("YOU",`${pcstManagerLabel(role)} · ${ownClub}`,mine?"ready":"pending"),pcstRow("RIVAL",`${pcstManagerLabel(otherRole)} · ${otherClub}`,acknowledged.has(otherRole)?"ready":"pending"),pcstRow("LEAGUE",pcstLeagueName(setup.leagueId)),pcstRow("SHOWDOWN LENGTH",`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"}`));
480:     const special=pcstSpecialPlayers(),chip=root.CareerModeSpecialPlayerChip,manager=r=>r==="playerOne"?"daniel":"nik";
481:     if(special&&chip)for(const [label,who] of [["YOUR SPECIAL PLAYER",role],["RIVAL'S SPECIAL PLAYER",otherRole]]){const line=chip.clubLine(special[manager(who)]);if(line){const row=pcstRow(label,line,"special");row.dataset.specialPlayer=manager(who);grid.append(row);}}
482:     body.append(grid);
483:     const statusText=lastError||(ready?"BOTH MANAGERS STARTED ✓ · Continue to the Transfer War.":mine?"YOUR CAREER IS CONFIRMED · Waiting for your rival to start theirs.":"Once your FIFA 17 career is set up at your club, confirm below.");
484:     const status=pcstCreate("p","remoteJoiningStatus",statusText);status.dataset.careerStatus="true";status.setAttribute("role","status");status.setAttribute("aria-live","polite");body.append(status);
485:     const actions=pcstCreate("div","remoteJoiningActions");const confirm=pcstCreate("button","compactButton r78-btn--primary",ready?"CONTINUE TO THE TRANSFER WAR":mine?"MY CAREER STARTED ✓":`I STARTED AT ${String(ownClub).toUpperCase()}`);confirm.type="button";confirm.disabled=busy||(!ready&&mine);confirm.addEventListener("click",()=>void (ready?pcstOpenTransferChallenge():pcstAcknowledge()));actions.append(confirm);const refreshButton=pcstCreate("button","compactButton","REFRESH");refreshButton.type="button";refreshButton.disabled=busy;refreshButton.addEventListener("click",()=>void pcstRefresh().catch(error=>pcstReport("Unable to refresh Shared Career Start",error)));actions.append(refreshButton);body.append(actions);
486:     pcstStage(overlay,body,{setup,role,ownClub,status:status,idle:!lastError&&!ready&&!mine});
487:   }
488:   // r50: opening Career Start loads its protocol, provider and styles on first use. The tapped control
489:   // shows OPENING… and stays disabled until the panel is up, and overlapping opens share one attempt,
490:   // so a slow first load never looks like a tap that did nothing.
491:   // r86: a Showdown confirmed on r86 or later first shows this manager's Special Player reveal (js/specialPlayerReveal.js),
492:   // outside the 25 s Career Start timeout. Its full-screen stage stays until Career Start (or the Transfer Challenge) is up
493:   // under it, so nothing in between shows. Any failure means no reveal.
494:   async function pcstSpecialPlayerFirst(){
495:     try{
496:       // The confirmed Setup is already loaded (it is what offers this control), so the reveal waits on no Career Start dependency.
497:       const api=setupApi||root.CareerModeProductionSharedShowdownSetup;
498:       if(!api||!pcstConfirmed()||pcstReadyHere())return null;
499:       let timer;const loaded=await Promise.race([pcstLoadScript("special-player-reveal","js/specialPlayerReveal.js",()=>root.CareerModeSpecialPlayerReveal),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
500:       if(!loaded)return null;
501:       return await root.CareerModeSpecialPlayerReveal.runBeforeCareerStart(api);
502:     }catch(_error){return null;}
503:   }
504:   function pcstCloseReveal(){const stage=revealStage;revealStage=null;if(stage)try{stage.close();}catch(_error){}return true;}
505:   // F1 (fault suite): a stale tab or a reload must never open Career Start for a Showdown this page already holds CLOSED; it
506:   // goes to that Showdown's Champion screen (or Home) instead. In-memory only, no read.
507:   function pcstShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_error){return false;}}
508:   function pcstOpenPanel(){
509:     if(openPromise)return openPromise;
510:     if(pcstShowdownClosed()){const entry=root.CareerModeProductionSharedJourneyEntry;return Promise.resolve(typeof entry?.openClosedShowdown==="function"?entry.openClosedShowdown():false);}
511:     const run=pcstSpecialPlayerFirst().then(stage=>{revealStage=stage;return pcstWithTimeout(pcstOpenPanelNow);}).finally(pcstCloseReveal);openPromise=run;
512:     run.finally(()=>{if(openPromise===run)openPromise=null;pcstDecorateControl();}).catch(()=>{});
513:     try{pcstDecorateControl();}catch(_error){}
514:     return run;
515:   }
516:   function pcstEnsurePanel(){let overlay=root.document.getElementById(PANEL_ID);if(!overlay){overlay=pcstCreate("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Career Start");const shell=pcstCreate("div","remoteJoiningShell"),header=pcstCreate("div","remoteJoiningHeader");header.append(pcstCreate("strong","","CAREER MODE SHOWDOWN // 17"));const close=pcstCreate("button","remoteJoiningDismiss","×");close.type="button";close.setAttribute("aria-label","Close Career Start");close.addEventListener("click",pcstClosePanel);header.append(close);const body=pcstCreate("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}return overlay;}
517:   // r80 resume (G7): a Career Start this page already holds as READY for the current Setup (both managers started) is not
518:   // shown again: it goes straight on to the Transfer Challenge, as its automatic continue does, with no read and no frame of
519:   // this panel. The automatic continue fires once per page, so re-entering the game from Home used to stop here.
520:   function pcstReadyHere(){return Boolean(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()));}
521:   async function pcstOpenPanelNow(request){
522:     pcstDeactivateSetupPresentation();await request.wait(pcstEnsureDependencies());
523:     // Fable F6-01: a BACK TO SHOWDOWN HOME from the roulette opened here (CONTINUE CAREER from Home) stays on Home, as it does
524:     // from the panel; only a roulette that could not start (its own reason) or a failed open shows Career Start below.
525:     if(!pcstPanelOpen()&&pcstReadyHere()&&await request.wait(pcstOpenTransferChallenge()))return pcstCloseReveal();
526:     if(!pcstPanelOpen()&&pcstReadyHere()&&(root.CareerModeRosterRouletteStep?.wentHome?.()||root.CareerModeIconGuessStep?.wentHome?.()||root.CareerModeChamberMenStep?.wentHome?.()))return pcstCloseReveal();
527:     const overlay=pcstEnsurePanel();stageRetries=0;stageFailed=false;retryFailed=false;stageFailed=!(await request.wait(pcstClubBackdrop()));overlay.classList.remove("hidden");pcstRender();pcstCloseReveal();await request.wait(pcstRefresh(false,request));return true;
528:   }
529:   function pcstClosePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay){overlay.classList.add("hidden");pcstStageOff(overlay);}return true;}
530:   function pcstPresentationOwnsControl(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
531:   function pcstClearControlOwnership(button){if(button&&button.dataset.sharedCareerStart==="true")delete button.dataset.sharedCareerStart;return false;}
532:   function pcstDecorateControl(){
533:     const button=root.document&&root.document.getElementById(CONTROL_ID);if(!button)return false;
534:     if(!pcstConfirmed()||pcstPresentationOwnsControl())return pcstClearControlOwnership(button);
535:     const opening=Boolean(openPromise),label=opening?"OPENING CAREER START…":"CONTINUE TO CAREER START";
536:     if(button.textContent!==label)button.textContent=label;
537:     if(button.disabled!==opening)button.disabled=opening;
538:     if(opening)button.setAttribute("aria-busy","true");else if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");
539:     if(button.classList.contains("hidden"))button.classList.remove("hidden");
540:     if(button.getAttribute("aria-disabled")!==String(opening))button.setAttribute("aria-disabled",String(opening));
541:     if(button.dataset.sharedCareerStart!=="true")button.dataset.sharedCareerStart="true";
542:     return true;
543:   }
544:   function pcstCapture(event){const button=event.target&&event.target.closest&&event.target.closest(`#${CONTROL_ID}`);if(!button||button.dataset.sharedCareerStart!=="true"||!pcstConfirmed())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pcstOpenPanel().catch(error=>pcstReport("Could not open Career Start",error));}
545:   function pcstWaitingKey(){if(!view||!view.state||pcstReady()||!pcstOwnAcknowledged(view)||!pcstPanelOpen())return "";return `${view.managerRole}|${view.state.revision}`;}
546:   function pcstFastPollDue(){const key=pcstWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
547:   // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
548:   // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
549:   // RS-01 (r87): the view never carries the rivalry id (neither the Career Start projection nor its setup half), so the path
550:   // comes from the Shared Setup state, as pcstAutoContinueKey does. Before, the listener watched nothing and the first manager
551:   // to tap "I STARTED" read the career document from the server every 3 s for up to 3 minutes.
552:   function pcstWaitPath(){const rivalryId=String(view?.setup?.rivalryId||view?.rivalryId||pcstSetupState()?.rivalryId||"").trim();return rivalryId?`rivalries/${rivalryId}/careerStart/authoritative`:null;}
553:   function pcstWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pcstWaitingKey()?pcstWaitPath():null);}catch(_error){path=null;}budget.watchWaitPoint("career-start",path,pcstWaitWake);}
554:   // While that listener is healthy the partner's acknowledgement wakes this screen through it (pcstWaitWake), so the 3 s check stands
555:   // down, as the Transfer screen's does (pstcWaitHealthy); the 15 s check and the listener's own server confirms keep running.
556:   function pcstWaitHealthy(){const path=pcstWaitPath(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(path&&live?.watchHealthy&&live.watching===path);}
557:   function pcstWaitWake(){if(!busy){void pcstTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pcstTick(true);},400);}
558:   function pcstFastTick(){pcstWatchWait();if(root.document&&root.document.visibilityState==="hidden")return;if(busy||!pcstFastPollDue()||pcstWaitHealthy())return;void pcstTick(true);}
559:   async function pcstTick(light=false){
560:     if(root.document&&root.document.visibilityState==="hidden")return false;
561:     if(pcstReady()){pcstStopPolling();return false;}
562:     try{if(!setupApi&&root.CareerModeProductionSharedShowdownSetup)setupApi=root.CareerModeProductionSharedShowdownSetup;pcstDecorateControl();const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&pcstConfirmed()&&!busy)await pcstRefresh(light===true);return true;}catch(_error){return false;}
563:   }
564:   function pcstInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pcstCapture,true);const observer=new MutationObserver(()=>pcstDecorateControl());observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled","class"]});}if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pcstTick(),POLL_MS);root.setInterval(pcstFastTick,FAST_POLL_MS);}void pcstEnsureDependencies().then(()=>pcstTick()).catch(()=>{});return true;}
565: 
566:   return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-career-start",productionEnabled:true,requiresConfirmedSharedSetup:true,requiresExactActiveSession:true,twoManagerAcknowledgement:true,routesReadyStateToTransferChallenge:true,reconcilesConcurrentAcknowledgement:true,persistentVisibleErrors:true,canonicalStorageMutation:false,billingRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcstWaitingKey()),autoContinuesWhenBothStarted:true,visibilityAwarePolling:true,serializedOperations:true,terminalPollingStops:true,deactivatesSetupPresentation:true,install:pcstInstall,openPanel:pcstOpenPanel,closePanel:pcstClosePanel,refresh:pcstRefresh,openTransferChallenge:pcstOpenTransferChallenge,errorText:pcstErrorText,careerStartStage:"option-b",fitHold:pcstFitHold,layoutAudit:pcstStageAudit,getState:()=>view});
567: });
568: 
```

## FILE: firestore.career-start-production.fragment.rules (99 lines)
```
1: // SSJR_CAREER_START_FUNCTIONS_BEGIN
2:     function ssjrCareerValidOperationId(value) { return value is string && value.matches('^career_start_op_[0-9a-f]{32}$'); }
3:     function ssjrCareerSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative); }
4:     function ssjrCareerSetupConfirmed(rivalryId) {
5:       let setup = ssjrCareerSetup(rivalryId).data;
6:       return setup.schemaVersion == 1
7:         && setup.objectType == 'sharedSetupLedger'
8:         && setup.rivalryId == rivalryId
9:         && setup.revision == 6
10:         && setup.phase == 'SHOWDOWN_CONFIRMED'
11:         && setup.operationIds is list
12:         && setup.operationIds.size() == 6
13:         && setup.confirmedRoles is list
14:         && setup.confirmedRoles.size() == 2
15:         && 'playerOne' in setup.confirmedRoles
16:         && 'playerTwo' in setup.confirmedRoles
17:         && setup.totalSeasons in [1,3,5,10];
18:     }
19:     function ssjrCareerExactKeys(root) {
20:       return root.keys().hasOnly([
21:         'schemaVersion','objectType','rivalryId','revision','phase','setupRevision',
22:         'setupOperationIds','totalSeasons','acknowledgedRoles','operationIds',
23:         'baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
24:       ]);
25:     }
26:     function ssjrCareerShapeValid(root, rivalryId) {
27:       let setup = ssjrCareerSetup(rivalryId).data;
28:       return ssjrCareerExactKeys(root)
29:         && ssjrCareerSetupConfirmed(rivalryId)
30:         && root.schemaVersion == 1
31:         && root.objectType == 'sharedCareerStart'
32:         && root.rivalryId == rivalryId
33:         && root.revision is int
34:         && root.revision >= 1
35:         && root.revision <= 2
36:         && root.setupRevision == 6
37:         && root.setupOperationIds == setup.operationIds
38:         && root.totalSeasons == setup.totalSeasons
39:         && root.acknowledgedRoles is list
40:         && root.acknowledgedRoles.size() == root.revision
41:         && root.operationIds is list
42:         && root.operationIds.size() == root.revision
43:         && root.baseRevisions is list
44:         && root.baseRevisions.size() == root.revision
45:         && root.actorRoles is list
46:         && root.actorRoles.size() == root.revision;
47:     }
48:     function ssjrCareerWriteValid(root, rivalryId) {
49:       return ssjrCareerShapeValid(root, rivalryId)
50:         && root.updatedAt == request.time
51:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
52:     }
53:     function ssjrCareerValidCreate(rivalryId) {
54:       let after = request.resource.data;
55:       let actorRole = ssjrActorRole(rivalryId);
56:       return ssjrCareerWriteValid(after, rivalryId)
57:         && after.revision == 1
58:         && after.phase == 'ONE_MANAGER_ACKNOWLEDGED'
59:         && after.acknowledgedRoles[0] == actorRole
60:         && after.actorRoles[0] == actorRole
61:         && after.baseRevisions[0] == 0
62:         && ssjrCareerValidOperationId(after.operationIds[0]);
63:     }
64:     function ssjrCareerValidUpdate(rivalryId) {
65:       let before = resource.data;
66:       let after = request.resource.data;
67:       let actorRole = ssjrActorRole(rivalryId);
68:       return ssjrCareerExactKeys(after)
69:         && after.schemaVersion == before.schemaVersion
70:         && after.objectType == before.objectType
71:         && after.rivalryId == before.rivalryId
72:         && before.revision == 1
73:         && before.phase == 'ONE_MANAGER_ACKNOWLEDGED'
74:         && after.revision == 2
75:         && after.phase == 'CAREER_START_READY'
76:         && after.setupRevision == before.setupRevision
77:         && after.setupOperationIds == before.setupOperationIds
78:         && after.totalSeasons == before.totalSeasons
79:         && after.acknowledgedRoles == before.acknowledgedRoles.concat([actorRole])
80:         && after.actorRoles == before.actorRoles.concat([actorRole])
81:         && after.operationIds == before.operationIds.concat([after.operationIds[1]])
82:         && after.baseRevisions == before.baseRevisions.concat([1])
83:         && actorRole != before.acknowledgedRoles[0]
84:         && ssjrCareerValidOperationId(after.operationIds[1])
85:         && after.operationIds[1] != before.operationIds[0]
86:         && after.updatedAt == request.time
87:         && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
88:     }
89: // SSJR_CAREER_START_FUNCTIONS_END
90: 
91: // SSJR_CAREER_START_MATCH_BEGIN
92:       match /careerStart/authoritative {
93:         allow get: if ssjrEntitled(rivalryId);
94:         allow list, delete: if false;
95:         allow create: if ssjrCareerValidCreate(rivalryId);
96:         allow update: if ssjrCareerValidUpdate(rivalryId);
97:       }
98: // SSJR_CAREER_START_MATCH_END
99: 
```

## FILE: firestore.shared-setup-production.fragment.rules (338 lines)
```
1: // SSJR_SHARED_SETUP_FUNCTIONS_BEGIN
2:     function ssjrValidRivalryId(value) { return value is string && value.matches('^pair_[0-9a-f]{64}$'); }
3:     function ssjrValidDeviceId(value) { return value is string && value.matches('^device_[0-9a-f]{32}$'); }
4:     function ssjrValidOperationId(value) { return value is string && value.matches('^setup_op_[0-9a-f]{32}$'); }
5:     function ssjrRivalryData(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data; }
6:     function ssjrExactPairedRivalry(rivalryId) {
7:       let root = get(/databases/$(database)/documents/rivalries/$(rivalryId));
8:       let data = root.data.data;
9:       return ssjrValidRivalryId(rivalryId)
10:         && root.data.objectType == 'rivalry'
11:         && root.data.objectId == rivalryId
12:         && root.data.lifecycleState == 'live'
13:         && data.connectionState == 'active'
14:         && data.authorizedAccountIds is list
15:         && data.authorizedAccountIds.size() == 2
16:         && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
17:         && data.managerSlots is list
18:         && data.managerSlots.size() == 2
19:         && data.managerSlots[0].slotId == 'playerOne'
20:         && data.managerSlots[1].slotId == 'playerTwo'
21:         && data.managerSlots[0].accountId != data.managerSlots[1].accountId
22:         && validProfileId(data.managerSlots[0].profileId)
23:         && validProfileId(data.managerSlots[1].profileId)
24:         && validSaveId(data.managerSlots[0].saveId)
25:         && validSaveId(data.managerSlots[1].saveId)
26:         && data.managerSlots[0].entitlementState == 'active'
27:         && data.managerSlots[1].entitlementState == 'active'
28:         && data.managerSlots[0].accountId in data.authorizedAccountIds
29:         && data.managerSlots[1].accountId in data.authorizedAccountIds
30:         && activeAccount(data.managerSlots[0].accountId)
31:         && activeAccount(data.managerSlots[1].accountId);
32:     }
33:     // r84 trim: a shared read needs only the live paired rivalry that lists the signed-in account (one lookup). The two
34:     // account documents are not looked up again: no client can change their status (account update is denied) and the Spark
35:     // app ships no account deletion flow; Session start and Shared Setup open still check both (lazy enforcement).
36:     function ssjrEntitled(rivalryId) {
37:       return ssjrValidRivalryId(rivalryId) && livePairedRivalryMember(rivalryId);
38:     }
39:     function ssjrActorRole(rivalryId) {
40:       return ssjrRivalryData(rivalryId).managerSlots[0].accountId == request.auth.uid ? 'playerOne' : 'playerTwo';
41:     }
42: 
43:     // Shared write authority is evaluated once per write. Only the exact
44:     // account/device/rivalry/session facts required by these namespaced ledgers are
45:     // rechecked so the production Rules remain under Firestore's expression ceiling.
46:     // Audit R84 F01/F02 (r85): every shared write looks up four documents: the rivalry, the named Session, the ACTING account
47:     // and the acting device. The r84 trim (rivalry + session only) let a deletion-pending account, or a revoked or
48:     // unregistered device, keep writing through a direct request. The partner account is not looked up on every write (no
49:     // client can change account status and the app ships no deletion flow; both accounts are checked at Session start and
50:     // Shared Setup open). Reads stay membership-only (ssjrEntitled), by decision: a lookup on every listener read would cost
51:     // hundreds of billed reads a season on the Spark limit.
52:     // ssjrActorWriteAuthorityValid holds the actor/Session/device/account facts. Season Commit calls it directly because its
53:     // create validator already sits near the 1,000-expression ceiling; every other shared write calls ssjrWriteAuthorityValid,
54:     // which adds the manager-pair shape checks on the same rivalry document (no extra lookup).
55:     function ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId) {
56:       let actor = request.auth.uid;
57:       let rivalryRoot = get(/databases/$(database)/documents/rivalries/$(rivalryId));
58:       let rivalry = rivalryRoot.data.data;
59:       let actorAccount = get(/databases/$(database)/documents/accounts/$(actor));
60:       let device = get(/databases/$(database)/documents/accounts/$(actor)/devices/$(deviceId));
61:       let session = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId));
62:       let sessionData = session.data.data;
63:       return signedIn()
64:         && ssjrValidRivalryId(rivalryId)
65:         && ssjrValidDeviceId(deviceId)
66:         && validSessionId(sessionId)
67:         && rivalryRoot.data.lifecycleState == 'live'
68:         && rivalry.connectionState == 'active'
69:         && actor in rivalry.authorizedAccountIds
70:         && actorAccount.data.data.status == 'active'
71:         && device.data.objectId == deviceId
72:         && device.data.data.state == 'active'
73:         && session.data.objectId == sessionId
74:         && sessionData.rivalryId == rivalryId
75:         && sessionData.state == 'active'
76:         && sessionData.memberAccountIds is list
77:         && sessionData.memberAccountIds.size() == 2
78:         && rivalry.authorizedAccountIds[0] in sessionData.memberAccountIds
79:         && rivalry.authorizedAccountIds[1] in sessionData.memberAccountIds
80:         && sessionData.expiresAt is timestamp;
81:     }
82:     function ssjrWriteAuthorityValid(rivalryId, deviceId, sessionId) {
83:       let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
84:       let slot0AccountId = rivalry.managerSlots[0].accountId;
85:       let slot1AccountId = rivalry.managerSlots[1].accountId;
86:       return ssjrActorWriteAuthorityValid(rivalryId, deviceId, sessionId)
87:         && rivalry.authorizedAccountIds is list
88:         && rivalry.authorizedAccountIds.size() == 2
89:         && rivalry.authorizedAccountIds[0] != rivalry.authorizedAccountIds[1]
90:         && rivalry.managerSlots is list
91:         && rivalry.managerSlots.size() == 2
92:         && rivalry.managerSlots[0].slotId == 'playerOne'
93:         && rivalry.managerSlots[1].slotId == 'playerTwo'
94:         && slot0AccountId != slot1AccountId
95:         && rivalry.managerSlots[0].entitlementState == 'active'
96:         && rivalry.managerSlots[1].entitlementState == 'active'
97:         && slot0AccountId in rivalry.authorizedAccountIds
98:         && slot1AccountId in rivalry.authorizedAccountIds;
99:     }
100:     // r84 trim: both manager accounts are checked once per Showdown, when the Shared Setup is opened (plus at every Session
101:     // start), instead of on every save: a deleted or deletion-pending account cannot start a new Showdown.
102:     function ssjrBothAccountsActive(rivalryId) {
103:       let slots = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.managerSlots;
104:       return get(/databases/$(database)/documents/accounts/$(slots[0].accountId)).data.data.status == 'active'
105:         && get(/databases/$(database)/documents/accounts/$(slots[1].accountId)).data.data.status == 'active';
106:     }
107:     function ssjrSessionHostIsActor(rivalryId, sessionId) {
108:       return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(sessionId)).data.data.hostAccountId == request.auth.uid;
109:     }
110:     function ssjrSetupHexMod5(value) {
111:       return value in ['0','5','a','f'] ? 0
112:         : value in ['1','6','b'] ? 1
113:         : value in ['2','7','c'] ? 2
114:         : value in ['3','8','d'] ? 3
115:         : value in ['4','9','e'] ? 4
116:         : -1;
117:     }
118:     function ssjrSetupHex32Mod5(value) {
119:       return (ssjrSetupHexMod5(value[0])
120:         + ssjrSetupHexMod5(value[1])
121:         + ssjrSetupHexMod5(value[2])
122:         + ssjrSetupHexMod5(value[3])
123:         + ssjrSetupHexMod5(value[4])
124:         + ssjrSetupHexMod5(value[5])
125:         + ssjrSetupHexMod5(value[6])
126:         + ssjrSetupHexMod5(value[7])) % 5;
127:     }
128:     function ssjrSetupBindingCanonical(rivalryId) {
129:       let rivalry = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
130:       let slots = rivalry.managerSlots;
131:       return '{"managerSlots":[{"accountId":"' + slots[0].accountId
132:         + '","profileId":"' + slots[0].profileId
133:         + '","saveId":"' + slots[0].saveId
134:         + '","slotId":"' + slots[0].slotId
135:         + '"},{"accountId":"' + slots[1].accountId
136:         + '","profileId":"' + slots[1].profileId
137:         + '","saveId":"' + slots[1].saveId
138:         + '","slotId":"' + slots[1].slotId
139:         + '"}],"rivalryId":"' + rivalryId + '"}';
140:     }
141:     function ssjrSetupBindingHash(rivalryId) {
142:       return 'sha256:' + hashing.sha256(ssjrSetupBindingCanonical(rivalryId)).toHexString().lower();
143:     }
144:     function ssjrSetupLeagueDigest(rivalryId, counter) {
145:       let seed = '{"bindingHash":"' + ssjrSetupBindingHash(rivalryId)
146:         + '","catalogHash":"sha256:f68d0a20f13304ae5af9faa2fee0b731d3491375304f635fb52c68840484d2ce'
147:         + '","counter":' + string(counter)
148:         + ',"domain":"shared-showdown-draw-v1","leagueId":null,"purpose":"league"}';
149:       return hashing.sha256(seed).toHexString().lower();
150:     }
151:     function ssjrSetupLeagueIndex(rivalryId) {
152:       let first = ssjrSetupLeagueDigest(rivalryId, 0);
153:       let selected = first[0:8] == 'ffffffff' ? ssjrSetupLeagueDigest(rivalryId, 1) : first;
154:       return selected[0:8] == 'ffffffff' ? -1 : ssjrSetupHex32Mod5(selected);
155:     }
156:     function ssjrSetupTeamCount(rivalryId) {
157:       let index = ssjrSetupLeagueIndex(rivalryId);
158:       return index == 2 ? 18 : (index >= 0 && index <= 4 ? 20 : 0);
159:     }
160:     function ssjrLeagueProjectionCreateValid(rivalryId) {
161:       let after = request.resource.data;
162:       let setup = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
163:       let rivalry = ssjrRivalryData(rivalryId);
164:       // Audit R84 F01 (r85): the acting account must be active (one lookup, once per Showdown); the team count itself is
165:       // derived by these Rules from the binding, so no device or Session field is carried.
166:       return activeActor()
167:         && after.keys().hasOnly(['schemaVersion','objectType','rivalryId','teamCount','createdAt'])
168:         && after.schemaVersion == 1
169:         && after.objectType == 'sharedLeagueProjection'
170:         && after.rivalryId == rivalryId
171:         && after.teamCount in [18,20]
172:         && after.teamCount == ssjrSetupTeamCount(rivalryId)
173:         && after.createdAt == request.time
174:         && request.auth.uid in rivalry.authorizedAccountIds
175:         && setup.schemaVersion == 1
176:         && setup.objectType == 'sharedSetupLedger'
177:         && setup.rivalryId == rivalryId
178:         && setup.revision == 6
179:         && setup.phase == 'SHOWDOWN_CONFIRMED';
180:     }
181:     // R94-02: a draw 2 ledger also carries 'stops' (one int 0..359 per confirmed manager, in confirmedRoles order: where
182:     // his ball came to rest). The key is fixed at create and never added or dropped later, so every ledger written
183:     // before R94-02 keeps its exact 15-key shape and its replay.
184:     // R95-01 Ball Game: a draw 3 ledger (six clubs per ball) also carries 'draw', always the int 3, beside 'stops'. It is
185:     // written at create and never added, dropped or changed later, so draw 1 and draw 2 ledgers keep their shapes.
186:     // R98-01 League Roulette: a draw 3 ledger may also carry 'drops' (the roulette balls dropped so far): 0 at create, 1 on
187:     // commit-league (the coordinator's first ball), then 2, 3, 4 through ssjrValidDropLedger only, and commit-clubs needs 4.
188:     // It is written at create and never added or dropped later; ledgers without it keep their shapes.
189:     function ssjrExactLedgerKeys(root) {
190:       return root.keys().hasOnly([
191:         'schemaVersion','objectType','rivalryId','revision','phase','coordinatorRole',
192:         'operationIds','operationTypes','baseRevisions','actorRoles','totalSeasons',
193:         'confirmedRoles','activeSessionId','updatedAt','updatedByDeviceId','stops','draw','drops'
194:       ]);
195:     }
196:     function ssjrValidLedgerBase(root, rivalryId) {
197:       let historySize = root.operationIds.size();
198:       return ssjrExactLedgerKeys(root)
199:         && root.schemaVersion == 1
200:         && root.objectType == 'sharedSetupLedger'
201:         && root.rivalryId == rivalryId
202:         && root.revision is int
203:         && root.revision >= 1
204:         && root.revision <= 6
205:         && (root.coordinatorRole == 'playerOne' || root.coordinatorRole == 'playerTwo')
206:         && root.operationIds is list
207:         && root.operationTypes is list
208:         && root.baseRevisions is list
209:         && root.actorRoles is list
210:         && historySize == root.revision
211:         && root.operationTypes.size() == historySize
212:         && root.baseRevisions.size() == historySize
213:         && root.actorRoles.size() == historySize
214:         && root.confirmedRoles is list
215:         && root.updatedAt == request.time
216:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
217:     }
218:     function ssjrValidCreateLedger(rivalryId) {
219:       let after = request.resource.data;
220:       return ssjrValidLedgerBase(after, rivalryId)
221:         && after.revision == 1
222:         && after.phase == 'SHARED_SETUP_OPEN'
223:         && after.coordinatorRole == ssjrActorRole(rivalryId)
224:         && ssjrValidOperationId(after.operationIds[0])
225:         && after.operationTypes[0] == 'open'
226:         && after.baseRevisions[0] == 0
227:         && after.actorRoles[0] == after.coordinatorRole
228:         && after.totalSeasons == null
229:         && after.confirmedRoles.size() == 0
230:         && (!('stops' in after) || after.stops == [])
231:         && (!('draw' in after) || ('stops' in after && after.draw == 3))
232:         && (!('drops' in after) || ('draw' in after && after.drops == 0))
233:         && ssjrSessionHostIsActor(rivalryId, after.activeSessionId)
234:         && ssjrBothAccountsActive(rivalryId);
235:     }
236:     function ssjrPrefixPreserved(before, after) {
237:       let n = before.revision;
238:       return after.operationIds[0:n] == before.operationIds
239:         && after.operationTypes[0:n] == before.operationTypes
240:         && after.baseRevisions[0:n] == before.baseRevisions
241:         && after.actorRoles[0:n] == before.actorRoles;
242:     }
243:     function ssjrNewOperationValid(before, after) {
244:       let index = before.revision;
245:       return ssjrValidOperationId(after.operationIds[index])
246:         && !(after.operationIds[index] in before.operationIds)
247:         && after.baseRevisions[index] == before.revision
248:         && after.actorRoles[index] == ssjrActorRole(after.rivalryId);
249:     }
250:     function ssjrTransitionShapeValid(before, after) {
251:       let i = before.revision;
252:       let nextTypes = ['unused','commit-league','commit-clubs','commit-length','confirm','confirm'];
253:       let nextPhases = ['unused','LEAGUE_WHEEL_COMMITTED','CLUB_ASSIGNMENTS_COMMITTED','SEASON_LENGTH_COMMITTED','SEASON_LENGTH_COMMITTED','SHOWDOWN_CONFIRMED'];
254:       return i >= 1
255:         && i <= 5
256:         && after.operationTypes[i] == nextTypes[i]
257:         && after.phase == nextPhases[i]
258:         && (i >= 4 || after.actorRoles[i] == before.coordinatorRole)
259:         && (
260:           (i <= 2 && before.totalSeasons == null && after.totalSeasons == null)
261:           || (i == 3 && before.totalSeasons == null && after.totalSeasons in [1,3,5,10])
262:           || (i >= 4 && after.totalSeasons == before.totalSeasons)
263:         )
264:         && (
265:           (i <= 3 && after.confirmedRoles.size() == 0)
266:           || (i == 4
267:             && before.confirmedRoles.size() == 0
268:             && after.confirmedRoles.size() == 1
269:             && after.confirmedRoles[0] == after.actorRoles[i])
270:           || (i == 5
271:             && before.confirmedRoles.size() == 1
272:             && after.confirmedRoles.size() == 2
273:             && after.confirmedRoles[0] == before.confirmedRoles[0]
274:             && after.confirmedRoles[1] == after.actorRoles[i]
275:             && after.confirmedRoles[1] != after.confirmedRoles[0])
276:         )
277:         // R94-02 stops: write-once per manager, only on his own confirm, the first one kept by the second confirm.
278:         && ('stops' in before) == ('stops' in after)
279:         // R95-01 + R98-01: 'draw' (always 3, checked at create) and 'drops' (the roulette balls) never appear, go or
280:         // change on a step, except that commit-league moves 'drops' from 0 to 1 (the coordinator's first ball is the league
281:         // draw): the key stays present or absent, and 0 * 2 + 1 makes it 1. commit-clubs needs all four balls.
282:         // One diff for both keys: the R98-01 sweep measured it cheaper than reading each key on both sides.
283:         && !after.diff(before).affectedKeys().hasAny(i == 1 ? ['draw'] : ['draw', 'drops'])
284:         && (i > 2 || (i == 1 ? ('drops' in after) == ('drops' in before) && after.get('drops', -1) == before.get('drops', -1) * 2 + 1 : before.get('drops', 4) == 4))
285:         && (
286:           !('stops' in after)
287:           || (i <= 3 && after.stops == [])
288:           || (i == 4 && after.stops.size() == 1
289:             && after.stops[0] is int && after.stops[0] >= 0 && after.stops[0] < 360)
290:           || (i == 5 && after.stops.size() == 2 && after.stops[0] == before.stops[0]
291:             && after.stops[1] is int && after.stops[1] >= 0 && after.stops[1] < 360)
292:         );
293:     }
294:     // R98-01 League Roulette: one ball (2, 3 or 4) dropped while the league is drawn and the clubs are not. Nothing but
295:     // 'drops' and the write stamp changes, the count moves by exactly one (so a ball never drops twice), and the ball is
296:     // the actor's: the coordinator drops the odd balls, his rival the even ones. The same authority as every ledger write.
297:     // ssjrValidUpdateLedger picks it by the revision alone (a ball keeps it, a step moves it by one), so a step never pays
298:     // for it, a ball never pays for the step checks, and a refused step costs what it cost in 2.10.0 (the qualified
299:     // 1,000-expression gate: a fall-back after the step checks pushed refused steps over the limit, PR #1562 Gate).
300:     function ssjrValidDropLedger(rivalryId) {
301:       let before = resource.data;
302:       let after = request.resource.data;
303:       return after.revision == before.revision
304:         && before.phase == 'LEAGUE_WHEEL_COMMITTED'
305:         && before.get('drops', 0) in [1, 2, 3]
306:         && after.drops == before.drops + 1
307:         && after.diff(before).affectedKeys().hasOnly(['drops', 'updatedAt', 'updatedByDeviceId', 'activeSessionId'])
308:         && (before.drops % 2 == 1) == (ssjrActorRole(rivalryId) != before.coordinatorRole)
309:         && ssjrValidLedgerBase(after, rivalryId);
310:     }
311:     function ssjrValidUpdateLedger(rivalryId) {
312:       let before = resource.data;
313:       let after = request.resource.data;
314:       // R98-01: the revision picks the branch: one more is a step, the same is a roulette ball (ssjrValidDropLedger).
315:       return after.revision == before.revision + 1
316:         ? ssjrValidLedgerBase(after, rivalryId)
317:           && after.coordinatorRole == before.coordinatorRole
318:           && ssjrPrefixPreserved(before, after)
319:           && ssjrNewOperationValid(before, after)
320:           && ssjrTransitionShapeValid(before, after)
321:         : ssjrValidDropLedger(rivalryId);
322:     }
323: // SSJR_SHARED_SETUP_FUNCTIONS_END
324: 
325: // SSJR_SHARED_SETUP_MATCH_BEGIN
326:       match /sharedSetup/authoritative {
327:         allow get: if ssjrEntitled(rivalryId);
328:         allow list, delete: if false;
329:         allow create: if ssjrValidCreateLedger(rivalryId);
330:         allow update: if ssjrValidUpdateLedger(rivalryId);
331:       }
332: 
333:       match /sharedSetup/leagueProjection {
334:         allow get: if ssjrEntitled(rivalryId);
335:         allow list, update, delete: if false;
336:         allow create: if ssjrLeagueProjectionCreateValid(rivalryId);
337:       }
338: // SSJR_SHARED_SETUP_MATCH_END
```

(End of packet FJ12. Answer with the report only.)
