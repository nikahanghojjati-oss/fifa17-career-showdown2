# Fable 5.2 red-team job FJ8: Reload, reconnect and re-entry

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
Then one block per finding: ID (FJ8-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Reopen a tab at each step of a season (Roulette, Prime Pack, Transfer War, results, between the two CONFIRMs, after the last CONFIRM, during Terminal Close): does it land on the right screen within ~10 s?
2. Can re-entry ever invent the other manager's action, or skip or reorder a needed screen?
3. Can a stale cached state (old tab, old version) win over the shared state?
4. Can two tabs of the same manager on one phone corrupt progress?
5. Any re-entry path that loops, polls without end, or costs many reads in normal play (give the count)?

## Known (do not report)
Home auto-JOIN polls every 20 s for at most 10 min (by design).

## Files

## FILE: js/productionSharedJourneyEntry.js (690 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedJourneyEntry=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
9:   const PANEL_ID="productionSharedJourneyEntryOverlay";
10:   const SHARED_START_ID="startSharedShowdown";
11:   const SHARED_CONTINUE_ID="continueSharedSetupGate";
12:   const LOCAL_SPIN_ID="spinLeague";
13:   const LOCAL_CLUB_ID="openClubPack";
14:   let installed=false,busy=false,remoteUnsubscribe=null,identityUnsubscribe=null,remoteReturnBusy=false,renderGeneration=0;
15: 
16:   function activeSavedShowdown(){
17:     try{
18:       const runtime=root.CareerModeSaveLibraryRuntime;
19:       if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return null;
20:       const library=runtime.getLibrarySnapshot();
21:       if(!library||!library.activeSaveId||!Array.isArray(library.saves))return null;
22:       const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
23:       return entry&&entry.showdown||null;
24:     }catch(_error){return null;}
25:   }
26:   function persistedPending(){const showdown=activeSavedShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared"&&showdown.sharedJourney.setupPending===true);}
27:   function pending(){if(activeSavedShowdown())return persistedPending();try{return root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1";}catch(_error){return false;}}
28:   function presentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
29:   function setPending(value){try{if(root.sessionStorage){if(value)root.sessionStorage.setItem(PENDING_KEY,"1");else root.sessionStorage.removeItem(PENDING_KEY);}}catch(_error){}applyLocalDrawLock();}
30:   function currentSaveShell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
31:   function normalizeCanonicalPlayers(){const showdown=currentSaveShell();if(!showdown)throw new Error("The prepared Showdown is unavailable.");showdown.name="Daniel vs Nik";showdown.managers={...(showdown.managers&&typeof showdown.managers==="object"?showdown.managers:{}),playerOne:"Daniel",playerTwo:"Nik"};return showdown;}
32:   function persistPendingMarker(){
33:     const showdown=currentSaveShell();
34:     if(!showdown||showdown.selectedLeague||showdown.clubs&&((showdown.clubs.playerOne)||(showdown.clubs.playerTwo))||Array.isArray(showdown.rounds)&&showdown.rounds.length)throw new Error("Career setup can be attached only before league and club selection.");
35:     const runtime=root.CareerModeSaveLibraryRuntime;
36:     if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.saveCurrentShowdown!=="function")throw new Error("Career storage is unavailable.");
37:     const previous=showdown.sharedJourney;showdown.sharedJourney={contractVersion:1,mode:"shared",setupPending:true};
38:     if(runtime.saveCurrentShowdown()!==true){showdown.sharedJourney=previous;throw new Error("Career setup could not be saved.");}
39:     if(!persistedPending()){showdown.sharedJourney=previous;runtime.saveCurrentShowdown();throw new Error("Career setup could not be verified.");}
40:     return true;
41:   }
42:   function discardUnmarkedShell(){try{const runtime=root.CareerModeSaveLibraryRuntime;if(runtime&&typeof runtime.isReady==="function"&&runtime.isReady()&&typeof runtime.clearActiveShowdown==="function")runtime.clearActiveShowdown();}catch(_error){}}
43:   function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
44:   function report(context,error){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota){context="Online play is paused for today";error=Object.assign(new Error(quota),{code:"resource-exhausted"});}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else console.error(context,error);}
45:   function entryIdentity(){return root.CareerModeOnlinePlayerIdentity||null;}
46:   function entryIdentityState(){try{return entryIdentity()?.getState?.()||null;}catch(_error){return null;}}
47:   function entryIdentityReady(){const current=entryIdentityState();return Boolean(current&&current.status==="ready"&&current.managerId&&current.registered);}
48:   function syncStartButtonIdentity(){
49:     const start=root.document&&root.document.getElementById("startShowdown");if(!start)return false;const current=entryIdentityState(),ready=entryIdentityReady();
50:     const label=ready?"START A SHOWDOWN":current?.status==="choose-manager"?"CHOOSE PLAYER TO START":current?.status==="offline"?"RECONNECT TO START":current?.status==="signed-out"?"SIGN IN TO START":"CONNECT TO START";
51:     if(start.textContent!==label)start.textContent=label;start.title=ready?"":"Sign in and choose Daniel or Nik before starting a Showdown.";return ready;
52:   }
53:   async function loadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Required runtime is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
54:   async function loadStyle(){if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-entry","css/remoteJoining.css");}
55:   function applyLocalDrawLock(){
56:     const locked=pending(),presentationOwns=locked&&presentationActive();
57:     for(const id of [LOCAL_SPIN_ID,LOCAL_CLUB_ID]){
58:       const button=root.document&&root.document.getElementById(id);if(!button)continue;
59:       if(locked&&!presentationOwns){button.disabled=true;button.dataset.sharedJourneyLocked="true";button.setAttribute("aria-disabled","true");button.title="Both players must be connected before this step.";}
60:       else if(button.dataset.sharedJourneyLocked==="true"){button.disabled=false;delete button.dataset.sharedJourneyLocked;button.removeAttribute("aria-disabled");button.removeAttribute("title");}
61:     }
62:     const wheel=root.document&&root.document.querySelector("#leagueWheelScreen .wheelContainer");
63:     if(wheel){
64:       let resume=root.document.getElementById(SHARED_CONTINUE_ID);
65:       if(locked&&!presentationOwns&&!resume){resume=create("button","menuButton","CONTINUE CAREER");resume.id=SHARED_CONTINUE_ID;resume.type="button";resume.addEventListener("click",()=>void continueFromLockedWheel());wheel.insertBefore(resume,wheel.querySelector(".backButton")||null);}
66:       if((!locked||presentationOwns)&&resume)resume.remove();
67:       let note=root.document.getElementById("sharedJourneyLeagueLockNote");
68:       if(locked&&!presentationOwns&&!note){note=create("p","stateNote","Connect Daniel and Nik to pick the league.");note.id="sharedJourneyLeagueLockNote";wheel.insertBefore(note,wheel.firstChild);}
69:       if((!locked||presentationOwns)&&note)note.remove();
70:     }
71:   }
72:   async function ensureSaveAuthority(){
73:     await loadScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");
74:     await root.ensureSaveLibraryRuntimeAuthority();
75:     if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay runtime is unavailable.");
76:     await root.ensureGameplayModules();
77:   }
78:   // r79: the pair names the Showdown it last saw CLOSED (finished, or deleted on Daniel's phone) and that Showdown's save.
79:   function activeSaveIsClosedShowdown(runtime){
80:     try{
81:       const pair=root.CareerModePersistentNikDanielPair?.getState?.(),closed=pair&&pair.closedProviderSaveId;
82:       if(!pair||pair.rivalryId||!/^pair_[0-9a-f]{64}$/.test(String(pair.closedRivalryId||""))||typeof closed!=="string"||!/^save_[0-9a-f]{24}$/.test(closed))return false;
83:       return runtime.getLibrarySnapshot?.()?.activeSaveId===closed;
84:     }catch(_error){return false;}
85:   }
86:   async function provisionJoinerShell(totalRounds){
87:     const rounds=Number(totalRounds);
88:     if(![1,3,5,10].includes(rounds))throw new Error("Daniel's connection code does not contain a valid season length.");
89:     await ensureSaveAuthority();
90:     const runtime=root.CareerModeSaveLibraryRuntime;
91:     if(!runtime?.isReady?.())throw new Error("Career storage is unavailable.");
92: 
93:     const existing=activeSavedShowdown();
94:     const existingIsEmptyShared=Boolean(
95:       existing
96:       && existing.sharedJourney?.mode==="shared"
97:       && existing.sharedJourney?.setupPending===true
98:       && !existing.selectedLeague
99:       && !existing.clubs?.playerOne
100:       && !existing.clubs?.playerTwo
101:       && (!Array.isArray(existing.rounds)||existing.rounds.length===0)
102:     );
103:     if(existingIsEmptyShared&&Number(existing.totalRounds)===rounds){
104:       setPending(true);
105:       applyLocalDrawLock();
106:       return true;
107:     }
108:     // r79: the save of a Showdown that is already closed (the pair names it: finished, or deleted on Daniel's phone) never blocks
109:     // Nik's next JOIN. The new shell is made beside it, exactly as Daniel's next START does; that save is kept, never rewritten.
110:     if(existing&&!activeSaveIsClosedShowdown(runtime)){
111:       throw new Error("You already have a different current Showdown. End it in Settings (END SHOWDOWN), then paste Daniel's code again.");
112:     }
113: 
114:     const round=root.document?.getElementById("roundAmount");
115:     if(!round)throw new Error("Season setup is unavailable.");
116:     const prior=round.value;
117:     let created=false,marked=false;
118:     try{
119:       round.value=String(rounds);
120:       setPending(true);
121:       if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
122:       created=Boolean(await root.createShowdown());
123:       if(!created)throw new Error("Nik's career could not be prepared.");
124:       normalizeCanonicalPlayers();
125:       persistPendingMarker();
126:       marked=true;
127:       if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);
128:       applyLocalDrawLock();
129:       return true;
130:     }catch(error){
131:       if(created&&!marked)discardUnmarkedShell();
132:       setPending(false);
133:       throw error;
134:     }finally{
135:       round.value=prior;
136:     }
137:   }
138: 
139:   async function currentPairStateForFreshStart(){
140:     const identity=root.CareerModeOnlinePlayerIdentity;
141:     if(!identity||typeof identity.syncPair!=="function")throw new Error("The current Showdown connection service is unavailable.");
142:     const first=await identity.syncPair();
143:     const next=!first||first.status==="unavailable"?await identity.syncPair():first;
144:     if(!next)throw new Error("The current Showdown connection could not be verified.");
145:     return next;
146:   }
147:   // r79: START never offers to close a live Showdown (closing stays in Settings). It asks whichShowdownIsLive instead: a live
148:   // game continues, Daniel's code already out (or his seasons chosen with no code yet) reopens WAITING, a fresh start creates the
149:   // shell, and Nik is never given a shell of his own here (he JOINs). Pair authority that cannot be read fails closed.
150:   async function whichShowdownIsLive(pairState=null){
151:     const which=await loadScript("which-showdown","js/whichShowdownIsLive.js",()=>root.CareerModeWhichShowdownIsLive);
152:     if(!which||typeof which.read!=="function")throw new Error("Showdown start is unavailable.");
153:     const decision=await which.read(root,pairState?{pair:pairState}:{});
154:     if(decision.reason==="pair-unknown")throw new Error("The current Showdown connection could not be verified. Try again before starting a new Showdown.");
155:     return decision;
156:   }
157:   // Codex #904 (P1): createShowdown() shows the locked league wheel at once, so on a cold cache WAITING's script, stylesheet and
158:   // plate are made ready first (alongside START's own checks, while the seasons screen and its disabled START stay up); openWaiting
159:   // then covers the wheel in the same task as the route change. Files only, no Firestore read. A failure here is left to
160:   // openWaiting, which reports it as before.
161:   function prepareWaiting(){
162:     return (async()=>{
163:       await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
164:       const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);
165:       if(layer&&typeof layer.prepare==="function")await layer.prepare();
166:       return true;
167:     })().catch(()=>false);
168:   }
169:   // WAITING: the Connect Players layer over the locked league wheel (no trip back to Home). With createCode the pair code is made
170:   // here, once, from the shell START just prepared; Daniel no longer taps CREATE CODE FOR NIK. A layer that cannot open falls back
171:   // to GET READY.
172:   async function openWaiting(options={}){
173:     closePanel();
174:     try{
175:       const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
176:       const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);
177:       if(!pair||typeof pair.startPairing!=="function"||!layer||typeof layer.open!=="function")throw new Error("Player connection is unavailable.");
178:       // A new code that replaces an older open one is begun while the layer
179:       // opens, so WAITING shows "Preparing your Showdown…" and then the new code, never the old code in between.
180:       const opening=layer.open({sync:false,stayOnScreen:true});Promise.resolve(opening).catch(()=>{});
181:       if(!(options.createCode===true&&pair.getState?.()?.connectionState==="pending-pair"))await opening;
182:       if(options.createCode===true)await pair.startPairing({managerRole:"playerOne"});
183:       await opening;
184:       pair.render?.();
185:       return true;
186:     }catch(error){report("Could not open the waiting screen",error);await openPanel({routeToRemote:false});return false;}
187:   }
188:   // PR #901 P2: CONTINUE CAREER on the locked league wheel (shown once WAITING is closed with BACK or Escape) asks the same
189:   // question START asks, so it reopens WAITING over the wheel (same stayOnScreen path) instead of the old GET READY overlay.
190:   let lockedWheelContinuePromise=null;
191:   function continueFromLockedWheel(){
192:     if(lockedWheelContinuePromise)return lockedWheelContinuePromise;
193:     lockedWheelContinuePromise=(async()=>{
194:       try{const decision=await whichShowdownIsLive();if(decision.action==="new")return openWaiting({createCode:false});return await followStartDecision(decision);}
195:       catch(error){report("Could not continue the Showdown",error);return openWaiting({createCode:false});}
196:     })().finally(()=>{lockedWheelContinuePromise=null;});
197:     return lockedWheelContinuePromise;
198:   }
199:   // Nik's call (2026-10-17): Daniel's START on a Showdown that has ENDED but was never CLOSED closes it for both managers through
200:   // exactly the final-screen terminal close (it requires the final reconciliation, i.e. history saved first, and one exact ACTIVE
201:   // private session; same writes, same guards), then opens the seasons screen. Nothing is created unless the close succeeded; a
202:   // close that cannot happen stops on the existing Connect Players / CHECK STATUS path with the reason.
203:   // r87 Rematch (js/onlinePlayerIdentity.js openRematch): followStartDecision(decision,{openSeasons:false}) does everything up to the
204:   // seasons screen and answers "seasons" instead of opening it; the caller then opens that screen with the length preset.
205:   let seasonsHandOff=false;
206:   let closeEndedPromise=null;
207:   function closeEndedThenNew(){
208:     if(closeEndedPromise)return closeEndedPromise;
209:     closeEndedPromise=(async()=>{
210:       let state=null,result=null;
211:       let pair=null;
212:       try{
213:         // Loaded first so its CLOSED listener hears this close (Codex #904: it is let go right after, below).
214:         pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
215:         const close=await loadScript("ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose);
216:         if(!close||typeof close.refresh!=="function"||typeof close.close!=="function")throw new Error("Showdown close is unavailable.");
217:         close.install?.();
218:         state=close.getState?.()||null;
219:         if(!state||state.phase!=="CLOSED")state=await close.refresh();
220:         if(state&&state.phase==="READY")result=await close.close();
221:         else if(state&&state.phase==="RECOVERY_PENDING"&&typeof close.retry==="function")result=await close.retry();
222:         if(close.getState?.()?.phase!=="CLOSED"&&result?.ok!==true){
223:           throw new Error(state&&state.phase==="BLOCKED"
224:             ?"This Showdown has ended. It closes when Daniel and Nik are both connected; nothing new was started."
225:             :(result&&result.message)||"This Showdown has ended but could not be closed. Nothing new was started.");
226:         }
227:       }catch(error){report("Could not close the ended Showdown",error);await openPersistentPairControls();return false;}
228:       // Codex #904 (P2): the pair keeps a CLOSED rivalry until Home is shown (the final screen still runs on it). This path leaves
229:       // for the seasons screen instead, so it lets the closed Showdown go now; otherwise START there would find it live again and
230:       // reopen the same screen. No read, no write.
231:       try{pair?.settleOnHome?.();}catch(_error){}
232:       const opened=seasonsHandOff?"seasons":typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");
233:       return opened==="seasons"?opened:opened!==false;
234:     })().finally(()=>{closeEndedPromise=null;});
235:     return closeEndedPromise;
236:   }
237:   // Markerless waiting codes belong to the retired path. A real START closes them before writing the boundary.
238:   async function needsCareerStart(decision){
239:     if(!decision||decision.action!=="resume-waiting"||entryIdentityState()?.managerId!=="daniel")return false;
240:     try{
241:       const modes=await loadScript("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);
242:       modes?.install?.();return (await modes?.resolve?.())?.careerStarted===false;
243:     }catch(_error){return false;}
244:   }
245:   async function openSeasonsForRealStart(){
246:     closePanel();
247:     const opened=seasonsHandOff?"seasons":typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");
248:     return opened==="seasons"?opened:opened!==false;
249:   }
250:   async function followStartDecision(decision,options){
251:     if(options&&options.openSeasons===false){seasonsHandOff=true;try{return await followStartDecision(decision);}finally{seasonsHandOff=false;}}
252:     if(!decision)return false;
253:     if(decision.action==="resume-waiting"&&await needsCareerStart(decision))return openSeasonsForRealStart();
254:     if(decision.action==="close-then-new")return closeEndedThenNew();
255:     if(decision.action==="continue"){
256:       const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
257:       if(!pair||typeof pair.continuePair!=="function")throw new Error("Career continue is unavailable.");
258:       // PR #901: continuePair() reports a failure in its returned state (error / recovery-required) instead of rejecting, so a
259:       // failed continue reopens Connect Players with that state (TRY CONTINUE AGAIN) like the auto-continue
260:       // fallback does, instead of rendering into a hidden panel. Nothing is created.
261:       const next=await pair.continuePair();
262:       if(next&&next.busy!==true&&next.status!=="paired"){
263:         report("Could not continue the Showdown",Object.assign(new Error(next.message||"The career could not be opened."),{code:next.status}));
264:         try{const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer?.open?.({sync:false,stayOnScreen:true});pair.render?.();}
265:         catch(_error){await openPersistentPairControls();}
266:         return false;
267:       }
268:       return true;
269:     }
270:     if(decision.action==="resume-waiting")return openWaiting({createCode:!decision.rivalryId});
271:     const identity=entryIdentity();
272:     if(identity&&typeof identity.openJoin==="function"){await identity.openJoin({pair:decision.pair||null,decision});return true;}
273:     await openPersistentPairControls();return true;
274:   }
275:   async function startShared(options={}){
276:     if(busy)return false;
277:     if(!entryIdentityReady()){
278:       const identity=entryIdentity();syncStartButtonIdentity();
279:       if(identity&&typeof identity.openGate==="function"){identity.openGate();return false;}
280:       root.showAppNotice?.("Sign in and choose Daniel or Nik before starting a Showdown.","error",6000);return false;
281:     }
282:     busy=true;const button=root.document.getElementById(SHARED_START_ID)||root.document.getElementById("startShowdown");if(button)button.disabled=true;
283:     const round=root.document.getElementById("roundAmount"),priorRound=round?round.value:null;let shellCreated=false,markerPersisted=false;
284:     try{
285:       const waitingReady=prepareWaiting();await ensureSaveAuthority();
286:       const decision=await whichShowdownIsLive(),realStart=await needsCareerStart(decision);
287:       if(decision.action!=="new"&&!realStart){await followStartDecision(decision);return false;}
288:       // Persist the career boundary before a new Showdown; a refusal creates nothing.
289:       if(options&&typeof options.beforeCreate==="function"&&await options.beforeCreate()!==true)return false;
290:       setPending(true);
291:       if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
292:       await waitingReady;const created=await root.createShowdown();shellCreated=Boolean(created);if(!created)throw new Error("The Showdown could not be prepared.");
293:       normalizeCanonicalPlayers();persistPendingMarker();markerPersisted=true;applyLocalDrawLock();await openWaiting({createCode:true});return true;
294:     }catch(error){if(shellCreated&&!markerPersisted)discardUnmarkedShell();setPending(false);report("Could not prepare the Showdown",error);return false;}
295:     finally{if(round&&priorRound!==null)round.value=priorRound;if(button)button.disabled=false;busy=false;syncStartButtonIdentity();}
296:   }
297:   async function openPersistentPairControls(){
298:     closePanel();
299:     try{
300:       const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair),identity=root.CareerModeOnlinePlayerIdentity;
301:       if(!pair||typeof pair.render!=="function"||!identity||typeof identity.syncPair!=="function")throw new Error("Player connection controls are unavailable.");
302:       const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer.open({sync:false});
303:       const first=await identity.syncPair(),next=!first||first.status==="unavailable"?await identity.syncPair():first;
304:       if(!next||next.status==="unavailable")throw new Error("Player connection controls are temporarily unavailable.");
305:       pair.render();
306:       const panel=root.document.getElementById("persistentNikDanielPairPanel");if(!panel)throw new Error("Player connection controls could not be opened.");
307:       panel.scrollIntoView?.({block:"center"});panel.querySelector("button,input")?.focus?.();
308:     }catch(error){report("Could not open connection setup",error);}
309:   }
310:   async function remoteState(){
311:     try{await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);const remote=root.CareerModeSparkRemoteJoining;return remote&&typeof remote.getState==="function"?remote.getState():null;}catch(_error){return null;}
312:   }
313:   function disarmRemoteReturn(){if(typeof remoteUnsubscribe==="function")remoteUnsubscribe();remoteUnsubscribe=null;}
314:   function armRemoteReturn(remote){
315:     disarmRemoteReturn();if(!remote||typeof remote.subscribe!=="function"||!pending())return false;
316:     const onState=next=>{
317:       if(!pending()||remoteReturnBusy||!next||next.sessionState!=="active"||next.pendingAction!=null)return;
318:       // Job 33 (R6): an ACTIVE private session continues straight into the Showdown (league wheel, Career Start or the
319:       // current season); openSharedExperience shows GET READY again if that fails. An expired session never auto-continues.
320:       // Codex P1 on #358: Remote Joining keeps its last ACTIVE session in page memory, so after a new Showdown (no reload) it can
321:       // still belong to the previous rivalry. Only a session bound to the current account, device and rivalry auto-continues.
322:       if(!remoteBoundToAuthority(next,root.CareerModeSparkConnectedAccount?.getState?.(),root.CareerModeSparkPrivatePairing?.getState?.(),root.CareerModeSparkConnectedRivalry?.getState?.()))return;
323:       remoteReturnBusy=true;disarmRemoteReturn();
324:       Promise.resolve().then(async()=>{if(typeof remote.closePanel==="function")remote.closePanel();await openSharedExperience();}).catch(error=>report("Could not continue the Showdown after connecting",error)).finally(()=>{remoteReturnBusy=false;});
325:     };
326:     remoteUnsubscribe=remote.subscribe(onState);if(typeof remote.getState==="function")onState(remote.getState());return true;
327:   }
328:   // Studio Z3: a one-bit "this tab is in a game" flag (never the session itself). After a refresh the identity module sees
329:   // it and taps CONTINUE CAREER for the player, which re-attaches through the pair's session pointer.
330:   const LIVE_GAME_KEY="careerModeShowdown.liveGame.v1";let liveGameWatch=null;
331:   function markLiveGame(remote){
332:     if(liveGameWatch||!remote||typeof remote.subscribe!=="function")return;
333:     const apply=next=>{try{if(!root.sessionStorage||!next)return;if(["open","active"].includes(next.sessionState))root.sessionStorage.setItem(LIVE_GAME_KEY,"1");else if(["closed","revoked","expired"].includes(next.sessionState)&&!(next.sessionState==="closed"&&championPending()))root.sessionStorage.removeItem(LIVE_GAME_KEY);}catch(_error){}};
334:     liveGameWatch=remote.subscribe(apply);apply(typeof remote.getState==="function"?remote.getState():null);
335:   }
336:   async function openRemote(){
337:     closePanel();
338:     try{
339:       await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);
340:       const remote=root.CareerModeSparkRemoteJoining;if(!remote||typeof remote.openPanel!=="function")throw new Error("Player connection is unavailable.");
341:       // Studio Z3/Z4: connect by itself (this tab's session after a refresh, else the pair's shared session); no typed code.
342:       const auto=typeof remote.autoConnect==="function"?remote.autoConnect():null;await remote.openPanel();armRemoteReturn(remote);markLiveGame(remote);if(auto)void auto;
343:     }catch(error){disarmRemoteReturn();report("Could not connect the players",error);}
344:   }
345:   async function confirmedSetupSnapshot(){
346:     try{
347:       await loadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
348:       const setup=root.CareerModeProductionSharedShowdownSetup;
349:       if(!setup||typeof setup.refresh!=="function"||typeof setup.getState!=="function")return null;
350:       await setup.refresh();const snapshot=setup.getState();
351:       return snapshot&&snapshot.ready===true&&snapshot.setup&&snapshot.setup.phase==="SHOWDOWN_CONFIRMED"&&snapshot.setup.revision===6?snapshot:null;
352:     }catch(_error){return null;}
353:   }
354:   async function openCareerStart(){
355:     await loadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
356:     const career=root.CareerModeProductionSharedCareerStart;if(!career||typeof career.openPanel!=="function")throw new Error("Career Start is unavailable.");
357:     await career.openPanel();return true;
358:   }
359:   // Job 19: a fresh runtime (reload) re-establishes the exact ACTIVE session and then resumes at the
360:   // provider-authoritative active season instead of replaying Career Start and season 1.
361:   async function resumeSeasonResults(resumed){
362:     const confirmed=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(!confirmed||confirmed.ready!==true)return false;
363:     const season=Number(resumed.season),role=confirmed.managerRole,rivalryId=confirmed.rivalryId;
364:     // F1: a Showdown whose seasons are all accepted resumes on its final season's results too: Final Winner and the automatic
365:     // close follow there, as on a phone that never reloaded (it used to land on a SHOWDOWN COMPLETE dashboard with a dead button).
366:     if(!rivalryId||!role||!Number.isInteger(season)||season<1)return false;
367:     // A hint selects a possible route, never gameplay authority. Missing/unavailable storage keeps the full-screen fallback.
368:     let hint=null;try{hint=root.readStorageValue?.(`cms.transferViews.v1:${rivalryId}:${season}:${role}`);}catch(_error){}
369:     if(!hint)return false;
370:     await loadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
371:     const transfer=root.CareerModeProductionSharedTransferChallenge;await transfer.refresh();
372:     if(!transfer.canResumeResults())return false;
373:     transfer.install();
374:     await loadScript("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js",()=>root.CareerModeProductionSharedSeasonResultsRoute);
375:     const route=root.CareerModeProductionSharedSeasonResultsRoute;route.install();return route.open();
376:   }
377:   function localSeasonPlayed(){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;return Boolean(showdown&&(Array.isArray(showdown.rounds)&&showdown.rounds.length>0||Number(showdown.currentRound)>1));}catch(_error){return false;}}
378:   async function resumeAcceptedSeason(){
379:     await loadScript("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
380:     const progression=root.CareerModeProductionSharedMultiSeasonProgression;
381:     if(!progression||typeof progression.resumeFromAuthority!=="function")return false;
382:     progression.install?.();
383:     // F1: a season this phone accepted but never continued from reopens on its results (Shared History, CONTINUE, Gazette).
384:     const resumed=await progression.resumeFromAuthority({holdForReview:true});
385:     // r87 arch S-01: an unread season count is not "no season played". When the reads failed and this phone's own save
386:     // already holds a played season, Career Start (season 1) is the wrong landing: fail into the retryable entry instead.
387:     if(!resumed&&progression.lastError?.()&&localSeasonPlayed()){const error=new Error("Your season could not be checked. Check your internet, then press START again.");error.code="MULTI_SEASON_RESUME_UNREAD";throw error;}
388:     if(!resumed||!Number.isInteger(resumed.acceptedSeasons)||resumed.acceptedSeasons<0)return false;
389:     // The Results route is a nicer landing, never a new way to fail: any error here keeps the existing fallback.
390:     let routed=false;try{routed=await resumeSeasonResults(resumed);}catch(_error){}
391:     if(routed)return true;
392:     if(resumed.heldForReview===true)progression.releaseHeldSeason?.();
393:     // F1: every season accepted and the final results could not open: a closed Showdown shows its Champion screen (or Home),
394:     // never the SHOWDOWN COMPLETE dashboard.
395:     if(resumed.terminal===true&&await showdownClosedNow()){await openClosedShowdown();return true;}
396:     if(resumed.acceptedSeasons<1)return false;
397:     if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false,allowCanonicalFallback:true});else if(typeof root.showScreen==="function")await root.showScreen("dashboard",false);
398:     progression.decorateDashboard?.();
399:     return true;
400:   }
401:   // F1 (fault suite, a stale tab or a reload at the close): a Showdown that has already closed must never open its Season 1
402:   // screens (the wheel, GET READY, Career Start) or a SHOWDOWN COMPLETE dashboard. Before any of those, the close is checked:
403:   // first what this page already holds (Terminal Close, the pair, the season count; no read), and only when this entry's own
404:   // reads came back without a usable session (which is what a close leaves) one Terminal Close read. A normal entry reads nothing more.
405:   const CHAMPION_KEY="cms.championPending.v1";
406:   function validRivalry(id){return /^pair_[0-9a-f]{64}$/.test(String(id||""));}
407:   function championPending(){try{const id=String(root.readStorageValue?.(CHAMPION_KEY)||"");return validRivalry(id)?id:"";}catch(_error){return "";}}
408:   function clearChampionPending(rivalryId){try{if(rivalryId&&championPending()===rivalryId)root.removeStorageValue?.(CHAMPION_KEY);}catch(_error){}}
409:   function closedHere(){
410:     try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();if(t&&t.phase==="CLOSED"&&t.terminal===true&&validRivalry(t.rivalryId))return t.rivalryId;}catch(_error){}
411:     return "";
412:   }
413:   async function showdownClosedNow(){
414:     if(closedHere())return true;
415:     let setupReady=false;try{setupReady=root.CareerModeProductionSharedShowdownSetup?.getState?.()?.ready===true;}catch(_error){}
416:     const unread=Boolean(root.CareerModeProductionSharedMultiSeasonProgression?.lastError?.());
417:     if(setupReady&&!unread)return false;
418:     try{
419:       const close=await loadScript("ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose);
420:       close.install?.();const state=close.getState?.()?.phase==="CLOSED"?close.getState():await close.refresh();
421:       return Boolean(state&&state.phase==="CLOSED"&&state.terminal===true);
422:     }catch(_error){return false;}
423:   }
424:   // The Showdown Champion screen of a closed Showdown: Season Results' host draws Final Winner from Terminal Close's verified
425:   // witness (js/seasonFinalV10.js) and fetches the finished history itself. When it cannot be shown, Home (the pair lets the
426:   // closed Showdown go there). Never a Season 1 screen.
427:   let championPromise=null;
428:   function openClosedShowdown(){
429:     if(championPromise)return championPromise;
430:     championPromise=(async()=>{
431:       closePanel();try{root.CareerModeProductionSharedCareerStart?.closePanel?.();}catch(_error){}
432:       let shown=false;
433:       try{if(closedHere()&&typeof root.navigateTo==="function"){await loadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);shown=await root.navigateTo("seasonEntry",{addToHistory:false,allowCanonicalFallback:false})===true;}}catch(_error){shown=false;}
434:       if(!shown&&typeof root.navigateTo==="function")await root.navigateTo("mainMenu",{addToHistory:false});
435:       return shown;
436:     })().finally(()=>{championPromise=null;});
437:     return championPromise;
438:   }
439:   // F1: VIEW FINAL RESULT on a complete Showdown's dashboard: the Champion screen once closed, else the final season's results.
440:   function openFinalResult(){return closedHere()?openClosedShowdown():openSharedExperience();}
441:   // F1 item 3: a reload at the close found the pair already let the Showdown go, so Home opened instead of the Champion screen
442:   // this phone was due to show (js/onlinePlayerIdentity.js asks here instead of dropping the live-game flag; true means this
443:   // takes it over). Only the closed Showdown this phone saw finish (cms.championPending.v1), on its own save; one Terminal
444:   // Close read, then Season Results' host draws Final Winner. The flag, and with it js/ssjr.js's loading screen, stays until
445:   // the Champion screen (or Home) is up. Any other pair state forgets the note.
446:   function championAfterClose(pair){
447:     const run=championAfterCloseRun(pair);if(!run)return false;
448:     void run.catch(()=>false).then(shown=>{if(!shown)root.careerModeTabResumeLetGo=true;try{root.sessionStorage?.removeItem(LIVE_GAME_KEY);}catch(_error){}});
449:     return true;
450:   }
451:   function championAfterCloseRun(pair){
452:     const rivalryId=championPending();if(!rivalryId||!pair)return null;
453:     if(pair.rivalryId&&pair.rivalryId!==rivalryId){clearChampionPending(rivalryId);return null;}
454:     if(!pairSaysClosed(pair,rivalryId))return null;
455:     return championForClosedRivalry(rivalryId,pair);
456:   }
457:   function pairSaysClosed(pair,rivalryId){return Boolean(pair&&validRivalry(rivalryId)&&((!pair.rivalryId&&pair.closedRivalryId===rivalryId)||(pair.rivalryId===rivalryId&&pair.connectionState==="closed")));}
458:   // The Champion screen of one closed Showdown on this phone's own save: one Terminal Close read (none when this page already
459:   // holds it CLOSED), then Season Results' host draws Final Winner. False (Home stays) when it is not this save's, not CLOSED
460:   // with its finish witness (DELETED: ended early), or anything fails.
461:   async function championForClosedRivalry(rivalryId,pair){
462:     try{
463:       await ensureSaveAuthority();
464:       const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();
465:       if(pair?.closedProviderSaveId&&library?.activeSaveId!==pair.closedProviderSaveId){clearChampionPending(rivalryId);return false;}
466:       // The closed Showdown's own save is put back in memory (as Home's CONTINUE does, without its navigation): Terminal Close
467:       // and Season Results work on the loaded save.
468:       if(!loadedShowdown()&&typeof root.loadSavedShowdown==="function"){const saved=root.loadSavedShowdown();if(!saved)return false;currentShowdown=typeof normalizeShowdown==="function"?normalizeShowdown(saved):saved;}
469:       // Terminal Close names the rivalry from this save's Connected Rivalry binding, which a fresh page has not read yet.
470:       const rivalry=await loadScript("rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry);await rivalry?.initialize?.();
471:       const close=await loadScript("ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose);
472:       close.install?.();const state=close.getState?.()?.phase==="CLOSED"?close.getState():await close.refresh();
473:       if(!state||state.phase!=="CLOSED"||state.terminal!==true||state.rivalryId!==rivalryId){if(state?.phase==="DELETED")clearChampionPending(rivalryId);return false;}
474:       return await openClosedShowdown();
475:     }catch(error){report("Could not open the Showdown Champion",error);return false;}
476:   }
477:   // r96 F3 (hunt 2.8.0, also 2.7.0): a phone opened again right after its final CONFIRM SEASON resumes into the still-live
478:   // Showdown (the reload resume or Home's CONTINUE SHOWDOWN: the pair's "continuing"). When the other phone's automatic close
479:   // lands during that entry, the entry's session is gone under it, so the page stayed on Home (WAITING FOR DANIEL) or on Remote
480:   // Joining's "Waiting for Daniel" for good: the close was only followed on game screens. Once this page learns the Showdown it
481:   // was entering has closed (the pair lets it go, or Terminal Close holds it CLOSED), it opens the Showdown Champion instead,
482:   // exactly as a reload after the close does. Only while that entry never got past Home (any game screen shown ends it), within
483:   // ENTRY_CLOSE_WINDOW_MS of it, once per Showdown on this page. One Terminal Close read on this path only (none when already
484:   // CLOSED here); ended early (DELETED) or any failure keeps Home. Nothing is written, nothing of the other phone is assumed.
485:   const ENTRY_CLOSE_WINDOW_MS=180000;
486:   let enteringRivalryId="",enteringAt=0,entryPairUnsubscribe=null,entryChampionRun=null;const entryCloseTried=new Set();
487:   function watchEntryPair(){
488:     if(entryPairUnsubscribe)return;const pair=root.CareerModePersistentNikDanielPair;if(!pair||typeof pair.subscribe!=="function")return;
489:     entryPairUnsubscribe=pair.subscribe(followEntryPair);followEntryPair(pair.getState?.());
490:   }
491:   // r96 F3b (Sol 6.2 SS-01): a same-tab refresh right after the final CONFIRM SEASON can read the pair as still live and then
492:   // see it close straight away, with no "continuing" between (the reload resume's own pair read already came back closed, or
493:   // the pair's listener let it go first), so the entry above was never armed. On a fresh page that has not left Home yet, a
494:   // live pair naming the Showdown this phone is due to crown (cms.championPending.v1, written at its final tap) arms the same
495:   // follow. Nothing else changes: the same window, once per Showdown, Home only, the same CLOSED-with-witness check (DELETED
496:   // or another save keeps Home). No read here.
497:   let pageLeftHome=false;
498:   function followEntryPair(next){
499:     if(!next)return;
500:     if(next.status==="continuing"&&validRivalry(next.rivalryId)){enteringRivalryId=next.rivalryId;enteringAt=Date.now();return;}
501:     if(!enteringRivalryId&&!pageLeftHome&&next.connectionState==="active"&&validRivalry(next.rivalryId)&&next.rivalryId===championPending()&&!entryCloseTried.has(next.rivalryId)){enteringRivalryId=next.rivalryId;enteringAt=Date.now();return;}
502:     if(pairSaysClosed(next,enteringRivalryId))championAfterEntryClosed(enteringRivalryId,next);
503:   }
504:   // r96 F3b: the reload resume (js/onlinePlayerIdentity.js openCanonicalCareerContinue) asks here before its START decision
505:   // when its fresh pair read says the Showdown is no longer live: true means the Champion screen of the Showdown this page
506:   // was entering, or due to crown, takes over (so START's "Waiting for Daniel" never opens over it).
507:   // It answers with that Champion run (a promise of whether Final Winner opened), or null when nothing takes over.
508:   function championTakingOver(pair){
509:     const id=enteringRivalryId||(!pageLeftHome?championPending():"");
510:     if(!validRivalry(id)||!pairSaysClosed(pair,id))return null;
511:     if(entryChampionRun&&entryChampionRun.rivalryId===id)return entryChampionRun.promise;
512:     if(!enteringRivalryId){enteringRivalryId=id;enteringAt=Date.now();}
513:     return championAfterEntryClosed(id,pair)&&entryChampionRun?entryChampionRun.promise:null;
514:   }
515:   function championAfterEntryClosed(rivalryId,pair){
516:     if(!validRivalry(rivalryId)||rivalryId!==enteringRivalryId||Date.now()-enteringAt>ENTRY_CLOSE_WINDOW_MS||entryCloseTried.has(rivalryId))return false;
517:     if(root.getActiveScreenName?.()!=="mainMenu")return false;
518:     entryCloseTried.add(rivalryId);enteringRivalryId="";
519:     // The entry's own layers over Home (GET READY, Remote Joining waiting for a session that is now closed) go first.
520:     disarmRemoteReturn();closePanel();try{root.CareerModeSparkRemoteJoining?.closePanel?.();}catch(_error){}try{root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});}catch(_error){}
521:     // As after a reload at the close (championAfterClose): the live-game flag, and with it js/ssjr.js's loading screen, stays
522:     // until the Champion screen is up; when it cannot open, the resume lets go and Home shows.
523:     const promise=championForClosedRivalry(rivalryId,pair).catch(()=>false).then(shown=>{if(!shown)root.careerModeTabResumeLetGo=true;try{root.sessionStorage?.removeItem(LIVE_GAME_KEY);}catch(_error){}return shown;});
524:     entryChampionRun={rivalryId,promise};
525:     return true;
526:   }
527:   // Leaving the Champion screen of a closed Showdown (BACK TO SHOWDOWN HOME, REMATCH, any route) forgets the note. The close
528:   // usually lands while Season Results is already open (no new screen event), so the closed state is read on leaving it.
529:   let lastScreen="";
530:   function followChampionScreen(){
531:     const screen=root.getActiveScreenName?.()||"",closed=closedHere();
532:     if(lastScreen==="seasonEntry"&&screen&&screen!=="seasonEntry"&&closed)clearChampionPending(closed);
533:     // r96 F3: the entry reached a game screen, so the followers there own the close from now on.
534:     if(screen&&screen!=="mainMenu"){enteringRivalryId="";pageLeftHome=true;}
535:     lastScreen=screen;
536:   }
537:   // F1: a page left on a game screen that is not the Champion screen (a stale tab's dashboard or Season 1 wheel, Career
538:   // Start) when the close lands there goes to the Champion screen. Terminal Close's own event; no read.
539:   const NOT_CHAMPION_SCREENS=new Set(["dashboard","leagueWheelScreen","clubWheelScreen"]);
540:   function followClose(){
541:     watchEntryPair();const closed=closedHere();if(!closed)return;
542:     const careerStart=root.document?.getElementById("productionSharedCareerStartOverlay");
543:     if(NOT_CHAMPION_SCREENS.has(root.getActiveScreenName?.())||(careerStart&&!careerStart.classList.contains("hidden")))void openClosedShowdown();
544:     else if(closed===enteringRivalryId)championAfterEntryClosed(closed,root.CareerModePersistentNikDanielPair?.getState?.()||null);
545:   }
546:   async function openSharedExperience(){
547:     closePanel();
548:     try{
549:       await ensureSaveAuthority();
550:       const confirmed=await confirmedSetupSnapshot();
551:       if(confirmed&&await resumeAcceptedSeason()){applyLocalDrawLock();return true;}
552:       if(await showdownClosedNow()){await openClosedShowdown();return true;}
553:       if(confirmed){await openCareerStart();applyLocalDrawLock();return true;}
554:       await loadScript("ssjr-polished-presentation","js/productionSharedShowdownPresentation.js",()=>root.CareerModeProductionSharedShowdownPresentation);
555:       const presentation=root.CareerModeProductionSharedShowdownPresentation;if(!presentation||typeof presentation.activate!=="function")throw new Error("Showdown presentation is unavailable.");
556:       await presentation.activate();applyLocalDrawLock();return true;
557:     }catch(error){report("Could not enter the Showdown",error);await openPanel({routeToRemote:false});return false;}
558:   }
559:   function remoteBoundToAuthority(remote,account,pairing,rivalry){return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&rivalry.rivalryId&&remote.rivalryId===rivalry.rivalryId&&account&&account.accountId&&remote.accountId===account.accountId&&pairing&&pairing.deviceId&&remote.deviceId===pairing.deviceId&&Number.isFinite(remote.expiresAtEpochMs)&&Date.now()<remote.expiresAtEpochMs);}
560:   async function statusSnapshot(){
561:     let account=null,pairing=null,rivalry=null,remote=null;
562:     try{
563:       await Promise.all([loadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),loadScript("spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount)]);
564:       const connected=root.CareerModeSparkConnectedAccount;if(connected&&typeof connected.initialize==="function")await connected.initialize();account=connected&&connected.getState?connected.getState():null;
565:       if(account&&account.connected){
566:         await Promise.all([loadScript("pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing),loadScript("rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry)]);
567:         const pairingApi=root.CareerModeSparkPrivatePairing;if(pairingApi&&pairingApi.initialize)await pairingApi.initialize();pairing=pairingApi&&pairingApi.getState?pairingApi.getState():null;
568:         const rivalryApi=root.CareerModeSparkConnectedRivalry;if(rivalryApi&&rivalryApi.initialize)await rivalryApi.initialize();rivalry=rivalryApi&&rivalryApi.getState?rivalryApi.getState():null;
569:       }
570:       remote=await remoteState();
571:     }catch(_error){}
572:     const active=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&remote.rivalryId===rivalry.rivalryId&&account&&remote.accountId===account.accountId&&pairing&&remote.deviceId===pairing.deviceId&&Number.isFinite(remote.expiresAtEpochMs)&&Date.now()<remote.expiresAtEpochMs);
573:     return Object.freeze({accountReady:Boolean(account&&account.connected),deviceReady:Boolean(pairing&&pairing.registered),rivalryReady:Boolean(rivalry&&rivalry.attached&&rivalry.rivalryId),active});
574:   }
575:   function row(label,value){const item=create("div","settingsInfoRow");item.append(create("span","",label),create("strong","",value));return item;}
576:   async function renderPanel(options={}){
577:     const generation=++renderGeneration,overlay=root.document.getElementById(PANEL_ID);if(!overlay)return false;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return false;
578:     const status=options.status||await statusSnapshot();if(generation!==renderGeneration)return false;
579:     if(routesToRemote(status,options)){await openRemote();return false;}
580:     const confirmed=status.active?await confirmedSetupSnapshot():null;if(generation!==renderGeneration)return false;
581:     body.replaceChildren();body.append(create("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),create("h2","","GET READY"),create("p","","Connect Daniel and Nik before the career starts."));
582:     const grid=create("div","settingsInfoGrid");
583:     grid.append(row("ACCOUNT",status.accountReady?"READY":"REQUIRED"),row("THIS BROWSER",status.deviceReady?"READY":"REQUIRED"),row("DANIEL + NIK",status.rivalryReady?"CONNECTED":"CONNECT"),row("CAREER",status.active?"READY":"WAITING"));body.append(grid);
584:     const actions=create("div","remoteJoiningActions");
585:     const save=create("button","compactButton",status.rivalryReady?"REVIEW CONNECTION":"CONNECT PLAYERS");save.type="button";save.addEventListener("click",()=>void openPersistentPairControls());actions.append(save);
586:     const remote=create("button","compactButton",status.active?"CONNECTED":"CONTINUE");remote.type="button";remote.disabled=!status.rivalryReady;remote.addEventListener("click",()=>void openRemote());actions.append(remote);
587:     const setup=create("button","compactButton",status.active?"START CAREER":"WAITING FOR BOTH PLAYERS");setup.type="button";setup.disabled=!status.active;setup.addEventListener("click",()=>void openSharedExperience());actions.append(setup);
588:     const refresh=create("button","compactButton","REFRESH");refresh.type="button";refresh.addEventListener("click",()=>void renderPanel());actions.append(refresh);body.append(actions);
589:     const note=create("p","remoteJoiningStatus",status.active?(confirmed?"Ready. Continue to Career Start.":"Ready. Continue when both players are set."):"Both players must be connected before league and club selection.");note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);return true;
590:   }
591:   // Job 33 (R5b): connected players without an ACTIVE private session go straight to Remote Joining instead of
592:   // waiting on GET READY for a CONTINUE tap. GET READY still shows before pairing, once the session is ACTIVE, and
593:   // after a failed Showdown entry (routeToRemote:false), so it never bounces between the two overlays.
594:   function routesToRemote(status,options){return Boolean(options.routeToRemote!==false&&status&&status.rivalryReady&&!status.active);}
595:   async function openPanel(options={}){
596:     await loadStyle();applyLocalDrawLock();
597:     const status=options.routeToRemote===false?null:await statusSnapshot();
598:     if(routesToRemote(status,options)){await openRemote();return true;}
599:     // r80 resume (G7): continuing a Showdown whose private session this page already holds ACTIVE (Home START / CONTINUE CAREER
600:     // after going Home from the game) enters the game exactly as a reload does once Remote Joining is ACTIVE again
601:     // (armRemoteReturn: openSharedExperience), instead of GET READY, whose START CAREER replayed Career Start. GET READY stays
602:     // the fallback when that entry fails (routeToRemote:false) and for every other caller.
603:     if(options.resumeActive===true&&status&&status.active){closePanel();await openSharedExperience();return true;}
604:     let overlay=root.document.getElementById(PANEL_ID);
605:     if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Career Mode Showdown entry");const shell=create("div","remoteJoiningShell"),header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close career entry");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
606:     // JOB-1015: the entry card replaces an open Connect Players layer instead of opening underneath it.
607:     root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});
608:     overlay.classList.remove("hidden");await renderPanel({...options,status});return true;
609:   }
610:   function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
611:   async function seasonsStartGate(){
612:     try{
613:       const modes=await loadScript("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);
614:       if(modes&&typeof modes.beforeSeasonsStart==="function"){modes.install?.();return await modes.beforeSeasonsStart()===true;}
615:     }catch(_error){}
616:     report("Could not start the Showdown",new Error("Your career could not be checked, so nothing was started. Check your internet, then press START again."));
617:     return false;
618:   }
619:   function installStartButton(){
620:     const start=root.document.getElementById("startShowdown");if(!start)return false;
621:     syncStartButtonIdentity();
622:     if(start.dataset.canonicalShowdownStart==="true")return true;
623:     start.dataset.canonicalShowdownStart="true";
624:     // The fallback START uses the same real-career gate as the identity entry.
625:     start.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();void startShared({beforeCreate:seasonsStartGate});},true);
626:     const duplicate=root.document.getElementById(SHARED_START_ID);if(duplicate)duplicate.remove();
627:     const note=root.document.getElementById("sharedShowdownOrderingNote");if(note)note.remove();
628:     return true;
629:   }
630:   // Job 19: the shared marker is a permanent local-draw lock, so it cannot decide alone whether GET READY
631:   // should open after a reload. Durable pair authority decides: a pre-pair shell still opens GET READY;
632:   // an ACTIVE pair resumes through the single CONTINUE CAREER action; a CLOSED Showdown never re-opens it.
633:   const AUTO_OPEN_IDENTITY_WAIT_MS=15000;
634:   function settledIdentity(){
635:     if(entryIdentityReady())return Promise.resolve(true);
636:     const identity=entryIdentity();if(!identity||typeof identity.subscribe!=="function")return Promise.resolve(false);
637:     return new Promise(resolve=>{let done=false,unsubscribe=null;const finish=value=>{if(done)return;done=true;try{unsubscribe?.();}catch(_error){}resolve(value);};unsubscribe=identity.subscribe(()=>{if(entryIdentityReady())finish(true);});setTimeout(()=>finish(entryIdentityReady()),AUTO_OPEN_IDENTITY_WAIT_MS);if(entryIdentityReady())finish(true);});
638:   }
639:   function pairAlreadyEstablished(pairState){if(!pairState)return false;if(pairState.rivalryId&&(pairState.connectionState==="active"||pairState.connectionState==="closed"))return true;return Boolean(pairState.status==="unpaired"&&!pairState.rivalryId&&/^pair_[0-9a-f]{64}$/.test(String(pairState.closedRivalryId||""))&&closedRivalryOwnsActiveShell(pairState));}
640:   // PR #901 (as whichShowdownIsLive): a closed rivalry only counts against the save it was bound to, so a fresh shell made after an
641:   // older closed Showdown still reopens WAITING over the wheel on reload; only the closed Showdown's own shell stays shut.
642:   function closedRivalryOwnsActiveShell(pairState){
643:     const closed=pairState&&pairState.closedProviderSaveId;if(typeof closed!=="string"||!/^save_[0-9a-f]{24}$/.test(closed))return false;
644:     try{const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return Boolean(library&&library.activeSaveId===closed);}catch(_error){return false;}
645:   }
646:   async function autoOpenAfterLoad(){
647:     if(!pending())return false;
648:     let pairState=null;
649:     try{if(await settledIdentity()){const known=root.CareerModePersistentNikDanielPair?.getState?.();pairState=known&&known.initialized===true&&known.busy!==true&&(known.rivalryId||known.closedRivalryId)?known:await currentPairStateForFreshStart();}}catch(_error){pairState=null;}
650:     // Only a positively observed pre-pair state reopens anything; unresolved authority (offline, timeout, error) keeps it closed.
651:     if(!pairState||!["unpaired","waiting"].includes(pairState.status)||pairAlreadyEstablished(pairState))return false;
652:     if(!pending())return false;
653:     // r79: a pending pre-pair shell reopens WAITING for Daniel (his code, or the code made now from his chosen seasons) and JOIN
654:     // for Nik. GET READY stays only as the fallback when neither applies or the decision cannot be made.
655:     let decision=null;try{decision=await whichShowdownIsLive(pairState);}catch(_error){decision=null;}
656:     // An older closed Showdown is remembered: only Daniel's fresh code-less shell (resume-waiting) reopens; nothing else (no GET READY).
657:     if(/^pair_[0-9a-f]{64}$/.test(String(pairState.closedRivalryId||""))&&!pairState.rivalryId&&!(decision&&decision.action==="resume-waiting"))return false;
658:     // PR #901: reload recovery puts Daniel's WAITING back over the locked league wheel (startup leaves Home active), so closing it
659:     // shows the wheel and its CONTINUE CAREER, not Home. The loading screen is held until this settles (js/ssjr.js, Reus Gate).
660:     // A markerless old code waits for an explicit real START.
661:     if(decision&&decision.action==="resume-waiting"&&await needsCareerStart(decision))return false;
662:     if(decision&&decision.action==="resume-waiting")await showLockedWheel();
663:     if(decision&&["resume-waiting","join","wait-for-daniel"].includes(decision.action))return followStartDecision(decision);
664:     return openPanel();
665:   }
666:   // Right after a reload the saved shell is not loaded yet (currentShowdown is null) and the wheel route falls back to Home (seen
667:   // in a real browser), so the saved shell is resumed first, exactly as Home's CONTINUE does: its canonical route is the wheel.
668:   function loadedShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
669:   async function showLockedWheel(){
670:     try{
671:       if(!loadedShowdown()&&typeof root.resumeSavedShowdown==="function"){await ensureSaveAuthority();if(typeof root.loadSavedShowdown==="function"&&root.loadSavedShowdown())await root.resumeSavedShowdown();}
672:       if(root.getActiveScreenName?.()!=="leagueWheelScreen"){if(typeof root.navigateTo==="function")await root.navigateTo("leagueWheelScreen",{addToHistory:false});else root.showScreen?.("leagueWheelScreen");}
673:     }catch(error){report("Could not reopen the league screen",error);}
674:     applyLocalDrawLock();
675:   }
676:   // The startup hold is kept only while this recovery can still end on the wheel: a player who is signed out, offline or still
677:   // choosing (anything but a restoring or ready identity) releases it at once, and js/ssjr.js bounds it anyway.
678:   let startupResumePromise=null,releaseStartupHold=null;
679:   function startupHoldWorthKeeping(){const current=entryIdentityState();return !current||entryIdentityReady()||["idle","connecting","signing-in","saving-manager"].includes(current.status);}
680:   function startStartupResume(){
681:     startupResumePromise=new Promise(resolve=>{releaseStartupHold=()=>resolve(true);});
682:     const identity=entryIdentity();let unsubscribe=null;const watch=()=>{if(!startupHoldWorthKeeping())releaseStartupHold();};
683:     try{unsubscribe=typeof identity?.subscribe==="function"?identity.subscribe(watch):null;}catch(_error){unsubscribe=null;}watch();
684:     setTimeout(()=>void autoOpenAfterLoad().catch(error=>report("Could not open career entry",error)).finally(()=>{releaseStartupHold();try{unsubscribe?.();}catch(_error){}}),0);
685:   }
686:   function install(){if(installed)return true;installed=true;root.document?.addEventListener?.("career-mode-screen-shown",followChampionScreen);root.addEventListener?.("career-mode-shared-terminal-close-state-change",followClose);/* F1: a due Champion screen is a live game for the reload resume (and its loading screen) */if(championPending())try{root.sessionStorage?.setItem(LIVE_GAME_KEY,"1");}catch(_error){}installStartButton();applyLocalDrawLock();watchEntryPair();const identity=entryIdentity();if(identity&&typeof identity.subscribe==="function")identityUnsubscribe=identity.subscribe(()=>syncStartButtonIdentity());const observer=new MutationObserver(()=>{installStartButton();applyLocalDrawLock();watchEntryPair();});observer.observe(root.document.documentElement,{childList:true,subtree:true});if(pending())startStartupResume();return true;}
687: 
688:   return Object.freeze({contractVersion:7,feature:"ssjr-production-paired-first-entry",startOpensWaitingOverLeagueWheel:true,startNeverOffersToCloseLiveShowdown:true,connectedPairOpensRemoteJoiningDirectly:true,activeSessionContinuesIntoShowdown:true,productionEnabled:true,singleProductEntry:true,pairingBeforeLeagueClub:true,activeSessionBeforeLeagueClub:true,peerActiveReturnToSharedEntry:true,bothDevicesPrepareSharedShell:true,joinerShellProvisionedAutomatically:true,continueCareerUsesPairedAuthority:true,polishedLeagueWheelAfterAuthority:true,polishedClubPacksAfterAuthority:true,confirmedSetupResumesAtCareerStart:true,acceptedSeasonResumesAtActiveSeason:true,establishedPairNeverAutoOpensEntry:true,closedShowdownNeverReopensEntry:true,engineeringSetupPanelPlayerFacing:false,persistedSaveMarker:true,canonicalLocalSaveMutationDuringSharedSetup:false,billingRequired:false,install,preparePairingShell:startShared,provisionJoinerShell,openWaiting,followStartDecision,closeEndedThenNew,continueFromLockedWheel,startupResume:()=>startupResumePromise,openPanel,closePanel,openSharedExperience,openClosedShowdown,openFinalResult,championAfterClose,championTakingOver,isPending:pending});
689: });
690: 
```

## FILE: js/productionSharedJourneyReconnect.js (237 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedJourneyReconnect=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const POLL_MS=15000;
9:   const STATUS_ID="sharedJourneyReconnectStatus";
10:   const ACTION_ID="sharedJourneyReconnectAction";
11:   const NEW_CODE_ACTION_ID="sharedJourneyReconnectNewCode";
12:   const DEPENDENCIES=Object.freeze([
13:     ["ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression],
14:     ["ssjr-journey-reconnect-protocol","js/sharedJourneyReconnect.js",()=>root.CareerModeSharedJourneyReconnect],
15:     ["ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup],
16:     ["ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression],
17:     ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining],
18:     ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
19:     ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
20:     ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry]
21:   ]);
22:   let installed=false,busy=false,state=null,protocol=null,setupApi=null,multiApi=null,remoteApi=null,accountApi=null,pairingApi=null,rivalryApi=null,unsubscribeRemote=null,refreshPromise=null,contextKey="";
23:   let lastReportedCode="";
24:   // A progression read can be denied for one poll right after a fresh session or a close while the
25:   // rivalry catches up; that check retries itself, so it is reported only if the same failure repeats.
26:   let heldTransientCode="";
27:   // Hunt 1018 (H1018-4): going offline bumps the generation, so a refresh still awaiting its reads cannot publish over OFFLINE_HOLD.
28:   let pjrGeneration=0,wakePending=false;
29: 
30:   function pjrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
31:   function pjrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
32:   function pjrSharedMarker(){const showdown=pjrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
33:   function pjrMarkerRivalry(){return String(pjrShowdown()?.sharedJourney?.rivalryId||"").trim();}
34:   function pjrSetupPending(){const journey=pjrShowdown()?.sharedJourney;return Boolean(journey&&journey.mode==="shared"&&journey.setupPending===true);}
35:   function pjrPrePairShell(){return Boolean(pjrSetupPending()&&!pjrMarkerRivalry());}
36:   function pjrSetupPresentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
37:   function pjrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
38:   function pjrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)pjrFail("JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
39:   async function pjrEnsureDependencies(){
40:     const resolved={};for(const [key,path,ready] of DEPENDENCIES)resolved[key]=await pjrLoad(key,path,ready);
41:     const factory=resolved["ssjr-journey-reconnect-protocol"];
42:     if(!factory||typeof factory.createProtocol!=="function")pjrFail("JOURNEY_RECONNECT_PROTOCOL_UNAVAILABLE");
43:     protocol=protocol||factory.createProtocol({multiSeasonModule:resolved["ssjr-multi-season-protocol"]});
44:     setupApi=resolved["ssjr-production-setup"];multiApi=resolved["ssjr-production-multi-season"];remoteApi=resolved.rj;accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;
45:     if(typeof setupApi?.refresh!=="function"||typeof setupApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SETUP_UNAVAILABLE");
46:     if(typeof multiApi?.refresh!=="function"||typeof multiApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_PROGRESSION_UNAVAILABLE");
47:     if(typeof remoteApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UNAVAILABLE");
48:     return true;
49:   }
50:   function pjrCurrentIdentity(){
51:     const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
52:     const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),rivalryId=String(rivalry?.rivalryId||"").trim(),managerRole=rivalry?.binding?.managerRole;
53:     if(!account?.connected||!accountId)pjrFail("JOURNEY_RECONNECT_AUTH_REQUIRED");
54:     if(!device?.registered||!deviceId)pjrFail("JOURNEY_RECONNECT_DEVICE_REQUIRED");
55:     if(!rivalry?.attached||!rivalryId||!rivalry?.binding)pjrFail("JOURNEY_RECONNECT_RIVALRY_REQUIRED");
56:     if(managerRole!=="playerOne"&&managerRole!=="playerTwo")pjrFail("JOURNEY_RECONNECT_ROLE_INVALID");
57:     const marker=pjrMarkerRivalry();if(marker&&marker!==rivalryId)pjrFail("JOURNEY_RECONNECT_RIVALRY_MISMATCH");
58:     return Object.freeze({rivalryId,accountId,deviceId,managerRole});
59:   }
60:   async function pjrResolveIdentity(){
61:     if(typeof accountApi?.initialize==="function")await accountApi.initialize();
62:     if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
63:     if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
64:     if(pjrPrePairShell()&&!rivalryApi?.getState?.()?.attached)return null;
65:     return pjrCurrentIdentity();
66:   }
67:   function pjrSameAuthority(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.accountId===b.accountId&&a.deviceId===b.deviceId&&a.managerRole===b.managerRole);}
68:   function pjrExactActive(remote,authority,now){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&now<expiry);}
69:   // Hunt 1018 (H1018-4): after each awaited read, a refresh that went offline or whose account, device or rivalry changed stops.
70:   function pjrAssertCurrent(generation,authority){if(generation!==pjrGeneration||!pjrOnline())pjrFail("JOURNEY_RECONNECT_SUPERSEDED");if(!pjrSameAuthority(pjrCurrentIdentity(),authority))pjrFail("JOURNEY_RECONNECT_CONTEXT_CHANGED");}
71:   function pjrPreviousFor(authority){
72:     if(!state)return null;
73:     if(state.rivalryId!==authority.rivalryId||state.accountId!==authority.accountId||state.deviceId!==authority.deviceId||state.managerRole!==authority.managerRole){state=null;contextKey="";return null;}
74:     return state;
75:   }
76:   function pjrRemoteSnapshot(){const remote=remoteApi?.getState?.();return remote&&typeof remote==="object"?remote:null;}
77:   function pjrStatusElement(){
78:     if(!root.document)return null;let node=root.document.getElementById(STATUS_ID);if(node)return node;
79:     const app=root.document.getElementById("app");if(!app)return null;
80:     node=root.document.createElement("div");node.id=STATUS_ID;node.className="stateNote hidden";node.setAttribute("role","status");node.setAttribute("aria-live","polite");node.dataset.sharedJourneyReconnect="true";
81:     const header=root.document.getElementById("topHeader");if(header?.parentNode===app)header.insertAdjacentElement("afterend",node);else app.prepend(node);return node;
82:   }
83:   // Permanent pairs reuse the same automatic connection as Home > CONTINUE CAREER.
84:   function pjrPermanentlyPaired(){try{const partner=root.CareerModePersistentNikDanielPair?.getPartnerState?.(),account=accountApi?.getState?.();return Boolean(partner?.status==="ready"&&partner.record?.active===true&&account&&partner.accountId===account.accountId);}catch(_error){return false;}}
85:   function pjrAutomaticStep(){return "Tap RECONNECT to connect Daniel and Nik again.";}
86:   // Accounts without a permanent partner retain the existing manual recovery instructions.
87:   function pjrManagerName(role){const name=pjrShowdown()?.managers?.[role];return String(name||(role==="playerOne"?"Manager 1":"Manager 2"));}
88:   function pjrReconnectStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();return role==="playerTwo"?`Tap RECONNECT, paste the new code from ${pjrManagerName("playerOne")} and tap JOIN PRIVATE SESSION.`:`Tap RECONNECT, then HOST PRIVATE SESSION and send the new code to ${pjrManagerName("playerTwo")}.`;}
89:   // BH-11 (#1): a reload drops the page-memory session code, so this phone simply has no session. That is not an ended
90:   // session; say so plainly. Kept about as short as the ended-session line so the banner does not reflow the game screens;
91:   // where the other phone takes the new code is said in the Remote Joining panel.
92:   function pjrNotConnectedStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();const other=pjrManagerName(role==="playerTwo"?"playerOne":"playerTwo");return `Tap RECONNECT, then HOST and send the code to ${other}, or JOIN ${other}'s new code.`;}
93:   function pjrShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_){return false;}}
94:   // r80 END SHOWDOWN: the other phone ended this Showdown (Terminal Close holds it DELETED: closed, no finish witness). This
95:   // page has already left it for Home with the ended-early notice, and a closed rivalry never reopens, so there is no session
96:   // to reconnect: no banner, no RECONNECT SESSION (the gallery saw both over Nik's Home and History right after Daniel's END).
97:   function pjrShowdownEnded(){try{return root.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED";}catch(_){return false;}}
98:   function pjrMessage(value){
99:     if(!value)return "";
100:     if(value.phase==="FRESH_SESSION_REQUIRED"&&pjrShowdownClosed())return "SHOWDOWN COMPLETE · Open the Final Winner or Legacy from Home.";
101:     if(value.phase==="OFFLINE_HOLD")return "OFFLINE · Reconnect to carry on.";
102:     if(value.phase==="RECOVERY_PENDING")return "RECONNECTING · Finish reconnecting both players before continuing.";
103:     if(value.phase==="FRESH_SESSION_REQUIRED"&&!value.sessionId)return `NOT CONNECTED ON THIS PHONE · Reloading drops the connection. ${pjrNotConnectedStep(value.managerRole)}`;
104:     if(value.phase==="FRESH_SESSION_REQUIRED")return `NEW CONNECTION NEEDED · ${value.resumable?"Your Showdown is saved; the connection ended":"The connection ended"} (a connection lasts up to 4 hours). ${pjrReconnectStep(value.managerRole)}`;
105:     if(value.phase==="TERMINAL_RECOVERED")return `RECONNECTED · ALL ${value.totalSeasons} SEASONS COMPLETE · No new season can be added.`;
106:     if(value.phase==="ACTIVE_RECOVERED")return `RECONNECTED · SEASON ${value.activeSeason} OF ${value.totalSeasons} · League, clubs and history pick up where you left off.`;
107:     return "RECONNECT STATUS UNAVAILABLE";
108:   }
109:   // Job 31: after RECONNECT SESSION the Remote Joining panel stayed open over the game once the fresh session was ACTIVE.
110:   // It now closes itself as soon as this page holds an exact unexpired ACTIVE session, and the banner re-checks at once.
111:   let recoveryReturnUnsubscribe=null;
112:   function pjrRemoteExactActive(remote){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry);}
113:   function pjrArmRecoveryReturn(exceptSessionId=null,authority=pjrCurrentIdentity()){
114:     if(typeof recoveryReturnUnsubscribe==="function")recoveryReturnUnsubscribe();recoveryReturnUnsubscribe=null;
115:     if(typeof remoteApi?.subscribe!=="function")return false;
116:     const onState=next=>{
117:       if(!pjrSharedMarker()||pjrShowdownEnded()||!pjrExactActive(next,authority,Date.now())||(exceptSessionId&&next.sessionId===exceptSessionId))return;
118:       try{if(!pjrSameAuthority(pjrCurrentIdentity(),authority))return;}catch(_error){return;}
119:       const stop=recoveryReturnUnsubscribe;recoveryReturnUnsubscribe=null;if(typeof stop==="function")stop();
120:       try{remoteApi.closePanel?.();}catch(_error){}
121:       void pjrRefresh();
122:     };
123:     recoveryReturnUnsubscribe=remoteApi.subscribe(onState);
124:     // Adoption can finish while openPanel awaits; include that already-delivered ACTIVE result.
125:     onState(pjrRemoteSnapshot());
126:     return true;
127:   }
128:   async function pjrOpenRecovery(fresh=false){
129:     try{
130:       await pjrEnsureDependencies();
131:       if(typeof remoteApi?.openPanel!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Reconnecting is unavailable right now.");
132:       const authority=pjrCurrentIdentity(),held=pjrRemoteSnapshot(),automatic=pjrPermanentlyPaired();
133:       if(automatic&&typeof remoteApi.autoConnect!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Reconnecting is unavailable right now.");
134:       const auto=automatic?remoteApi.autoConnect():null;
135:       await remoteApi.openPanel();
136:       if(automatic||fresh||!pjrRemoteExactActive(held))pjrArmRecoveryReturn(!automatic&&fresh&&pjrRemoteExactActive(held)?held.sessionId:null,authority);
137:       if(auto)void auto;
138:       return true;
139:     }catch(error){pjrReport("Could not open connection recovery",error);return false;}
140:   }
141:   async function pjrOpenSessionRecovery(){return pjrOpenRecovery();}
142:   // A paired phone reuses its exact ACTIVE session; manual recovery waits for a different session.
143:   async function pjrOpenFreshSessionCode(){return pjrOpenRecovery(true);}
144:   function pjrRender(){
145:     const node=pjrStatusElement();if(!node)return false;const visible=pjrSharedMarker()&&Boolean(state)&&!pjrShowdownEnded();node.classList.toggle("hidden",!visible);if(!visible){node.replaceChildren();return false;}const text=pjrMessage(state);node.replaceChildren(root.document.createTextNode(text));if((state.phase==="FRESH_SESSION_REQUIRED"&&!pjrShowdownClosed())||state.phase==="RECOVERY_PENDING"){const action=root.document.createElement("button");action.id=ACTION_ID;action.type="button";action.className="compactButton";action.textContent=state.phase==="FRESH_SESSION_REQUIRED"?"RECONNECT":"CHECK CONNECTION";action.disabled=busy;action.addEventListener("click",()=>{void pjrOpenSessionRecovery();});node.append(root.document.createTextNode(" "),action);}else if(state.phase==="ACTIVE_RECOVERED"){/* BH-11 (#1): this phone may still hold the session the other phone lost; let it take the other phone's new code. */const fresh=root.document.createElement("button");fresh.id=NEW_CODE_ACTION_ID;fresh.type="button";fresh.className="compactButton";fresh.textContent=pjrPermanentlyPaired()?"RECONNECT":"NEW CODE";fresh.disabled=busy;fresh.addEventListener("click",()=>{void pjrOpenFreshSessionCode();});node.append(root.document.createTextNode(" "),fresh);}node.dataset.recoveryPhase=state.phase;/* r87 sweep P-01: Home leaves the finished-Showdown note out (css/v10Shell.css) */node.dataset.closedNotice=state.phase==="FRESH_SESSION_REQUIRED"&&pjrShowdownClosed()?"true":"false";node.dataset.authoritative=state.activeAuthorization?"true":"false";return true;
146:   }
147:   function pjrPublish(next){
148:     state=next||null;contextKey=state?`${state.accountId}|${state.deviceId}|${state.rivalryId}`:"";pjrRender();
149:     try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-journey-reconnect-state-change",{detail:state?{phase:state.phase,rivalryId:state.rivalryId,managerRole:state.managerRole,activeAuthorization:state.activeAuthorization,resumable:state.resumable,recovered:state.recovered,acceptedSeasons:state.acceptedSeasons,activeSeason:state.activeSeason,totalSeasons:state.totalSeasons,terminal:state.terminal,sessionChanged:state.sessionChanged}:null}));}catch(_error){}
150:     return state;
151:   }
152:   function pjrOnline(){return !root.navigator||root.navigator.onLine!==false;}
153:   function pjrOfflineHold(){
154:     pjrGeneration+=1;
155:     if(!state||!protocol)return pjrPublish(null);
156:     try{
157:       const authority={rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole};
158:       return pjrPublish(protocol.observe({authority,previous:state,nowEpochMs:Date.now(),networkOnline:false,remote:null}));
159:     }catch(error){pjrReport("Could not hold the Showdown while offline",error);return pjrPublish(null);}
160:   }
161:   // Hunt 1018 (H1018-3): losing account, device or rivalry authority after recovery keeps the durable plan and history but
162:   // publishes a non-authoritative state (recovered and activeAuthorization false) until the identity is verified again.
163:   function pjrDropAuthority(){
164:     if(!state?.activeAuthorization||!protocol)return state;
165:     try{return pjrPublish(protocol.observe({authority:{rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole},previous:state,nowEpochMs:Date.now(),networkOnline:pjrOnline(),remote:null}));}
166:     catch(error){pjrReport("Could not drop the Showdown connection",error);return pjrPublish(null);}
167:   }
168:   function pjrBootstrap(){return pjrEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>pjrWake());});}
169:   async function pjrRefreshNow(){
170:     const generation=pjrGeneration;
171:     // Codex #942: a refresh superseded while it awaited (END landed: DELETED, or offline) never publishes a banner state over the newer one.
172:     const publish=next=>generation===pjrGeneration?pjrPublish(next):state;
173:     if(!pjrSharedMarker()||pjrShowdownEnded())return pjrPublish(null);
174:     if(pjrSetupPending()&&pjrSetupPresentationActive())return pjrPublish(null);
175:     await pjrBootstrap();
176:     if(!pjrOnline())return pjrOfflineHold();
177:     const authority=await pjrResolveIdentity();if(!authority)return pjrPublish(null);const previous=pjrPreviousFor(authority),remote=pjrRemoteSnapshot();
178:     const now=Date.now(),base={authority,previous,nowEpochMs:now,networkOnline:true,remote};
179:     const remoteExpiry=Number(remote?.expiresAtEpochMs);
180:     const exactActive=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(remoteExpiry)&&now<remoteExpiry);
181:     if(!exactActive)return publish(protocol.observe(base));
182:     if(!previous)return pjrPublish(null);
183:     const setupResult=await setupApi.refresh(),setupState=setupApi.getState();
184:     pjrAssertCurrent(generation,authority);
185:     const sameSetupContext=Boolean(setupResult&&setupState&&setupState.ready===true&&setupState.rivalryId===authority.rivalryId&&setupState.sessionId===remote.sessionId);
186:     if(sameSetupContext&&pjrSetupPending()&&(!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"))return pjrPublish(null);
187:     if(!sameSetupContext||!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"||setupState.setup.revision!==6)pjrFail("JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED");
188:     const progressionResult=await multiApi.refresh(),progressionView=multiApi.getState();
189:     pjrAssertCurrent(generation,authority);
190:     if(!progressionResult||!progressionView||progressionView.authoritative!==true||progressionView.rivalryId!==authority.rivalryId||!progressionView.state){const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now(),latestExpiry=Number(latestRemote?.expiresAtEpochMs),latestExactActive=Boolean(latestRemote&&latestRemote.sessionState==="active"&&latestRemote.sessionId&&latestRemote.rivalryId===authority.rivalryId&&latestRemote.accountId===authority.accountId&&latestRemote.deviceId===authority.deviceId&&latestRemote.pendingAction==null&&Number.isFinite(latestExpiry)&&latestNow<latestExpiry);if(!latestExactActive)return publish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));pjrFail("JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE",`Season progress could not be checked (${String(multiApi?.lastError?.()||"NO_PROGRESSION_VIEW")}). You are connected; this retries by itself.`);}
191:     // Hunt 1018 (H1018-5): recovered authority is claimed only for the same exact session, still unexpired after the reads.
192:     const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now();
193:     if(!pjrExactActive(latestRemote,authority,latestNow))return publish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));
194:     if(latestRemote.sessionId!==remote.sessionId)return state;
195:     return publish(protocol.observe({...base,nowEpochMs:latestNow,remote:latestRemote,setup:setupState.setup,progression:progressionView.state}));
196:   }
197:   // A new Showdown setup or a lagging progression read can fail for one poll; report only when the same failure repeats.
198:   const PJR_HELD_CODES=Object.freeze(["JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE","JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED"]);
199:   // Account, device or rivalry authority not resolved yet (reload, startup, provider transition) is a quiet pending state:
200:   // the banner cannot speak for an unresolved identity, and the next poll or wake re-checks. Role/rivalry mismatches still report.
201:   const PJR_PENDING_AUTHORITY_CODES=Object.freeze(["JOURNEY_RECONNECT_AUTH_REQUIRED","JOURNEY_RECONNECT_DEVICE_REQUIRED","JOURNEY_RECONNECT_RIVALRY_REQUIRED"]);
202:   function pjrRefresh(){
203:     if(refreshPromise)return refreshPromise;busy=true;
204:     const run=pjrRefreshNow().then(value=>{lastReportedCode="";heldTransientCode="";return value;},error=>{if(pjrShowdownEnded()){heldTransientCode="";return state;}if(error?.code==="JOURNEY_RECONNECT_SUPERSEDED"){heldTransientCode="";return pjrOnline()?state:pjrOfflineHold();}if(PJR_PENDING_AUTHORITY_CODES.includes(error?.code)||error?.code==="JOURNEY_RECONNECT_CONTEXT_CHANGED"){heldTransientCode="";return pjrDropAuthority();}const code=`${String(accountApi?.getState?.()?.accountId||"")}|${String(pairingApi?.getState?.()?.deviceId||"")}|${String(pjrMarkerRivalry()||"")}|${String(error?.code||"JOURNEY_RECONNECT_FAILED")}|${String(multiApi?.lastError?.()||"")}`;if(PJR_HELD_CODES.includes(error?.code)&&code!==heldTransientCode&&code!==lastReportedCode){heldTransientCode=code;return state;}heldTransientCode="";if(code!==lastReportedCode)pjrReport("Could not refresh connection recovery",error);lastReportedCode=code;return state;}).finally(()=>{busy=false;if(refreshPromise===run)refreshPromise=null;pjrRender();if(wakePending){wakePending=false;pjrWake();}});refreshPromise=run;return run;
205:   }
206:   // Codex #942: END landing while a refresh is in flight (busy) must not wait for that refresh: the banner and its action are
207:   // cleared at once and the in-flight refresh is superseded (it can no longer publish), then the usual wake follows.
208:   function pjrOnTerminalClose(){if(pjrShowdownEnded()){pjrGeneration+=1;pjrPublish(null);}pjrWake();}
209:   function pjrWake(){if(!pjrSharedMarker()||root.document?.visibilityState==="hidden")return;if(busy){wakePending=true;return;}void pjrRefresh();}
210:   function pjrInstall(){
211:     // r75: an ordinary startup with no Shared Journey loads none of the recovery runtime (Remote Joining stays unloaded);
212:     // the first wake that finds the shared marker loads it through pjrRefreshNow.
213:     if(installed)return true;installed=true;if(pjrSharedMarker())void pjrBootstrap().then(()=>pjrWake()).catch(error=>pjrReport("Connection recovery could not start",error));
214:     root.addEventListener?.("career-mode-shared-wait-context-change",pjrWake);
215:     root.addEventListener?.("online",pjrWake);
216:     root.addEventListener?.("offline",()=>pjrOfflineHold());
217:     root.addEventListener?.("career-mode-shared-setup-state-change",pjrWake);
218:     root.addEventListener?.("career-mode-shared-season-cursor-change",pjrWake);
219:     root.addEventListener?.("career-mode-connected-account-state-change",pjrWake);
220:     root.addEventListener?.("career-mode-shared-terminal-close-state-change",pjrOnTerminalClose);
221:     root.document?.addEventListener?.("visibilitychange",pjrWake);
222:     // S6 (Fable job 2): the routine 15 s check re-reads Setup and the season progression (with its history) whenever the commit
223:     // listener is not watching, about once a minute once the budget layer's quiet copies age. While the full-screen roulette is
224:     // up nothing of the banner is visible and no shared state can change under it, so the check waits for the roulette to end
225:     // (a session that is expiring still wakes it, and every event wake still runs).
226:     if(typeof root.setInterval==="function")root.setInterval(()=>{const expiring=Date.now()>=Number(root.CareerModeSparkRemoteJoining?.getState?.()?.expiresAtEpochMs);if(!expiring&&root.CareerModeRosterRouletteStep?.active?.()===true)return;if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.()||expiring)pjrWake();},POLL_MS);
227:     if(typeof root.setTimeout==="function")root.setTimeout(pjrWake,0);
228:     return true;
229:   }
230: 
231:   return Object.freeze({
232:     contractVersion:1,feature:"ssjr-production-shared-journey-reconnect",productionEnabled:true,runtimeRevision:"1.9.1-r14",pollIntervalMs:POLL_MS,
233:     sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,freshRuntimeRequiresReauthorization:true,
234:     dualManagerStatusVisible:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
235:     install:pjrInstall,refresh:pjrRefresh,openSessionRecovery:pjrOpenSessionRecovery,openFreshSessionCode:pjrOpenFreshSessionCode,getState:()=>state,isRecovered:()=>Boolean(state?.recovered&&state?.activeAuthorization),isBusy:()=>busy
236:   });
237: });
```

## FILE: js/productionSharedJourneyGuard.js (138 lines)
```javascript
1: (function(root){
2:   "use strict";
3: 
4:   const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
5:   const GUARDED=Object.freeze([
6:     "handleLeagueWheelAction",
7:     "spinLeagueWheel",
8:     "confirmLeagueSelectionAndContinue",
9:     "prepareClubAssignment",
10:     "assignClubs",
11:     "continueToShowdownHome"
12:   ]);
13:   const CLICK_TARGETS=Object.freeze({spinLeague:"league selection",openClubPack:"ball game",continueClubAssignment:"Showdown confirmation"});
14:   const WRAPPED=Symbol("ssjrSharedJourneyGuard");
15:   const LOADER_WRAPPED=Symbol("ssjrSharedJourneyGuardLoader");
16:   let timer=null,eventGateInstalled=false;
17: 
18:   function persistedPending(){
19:     try{
20:       const runtime=root.CareerModeSaveLibraryRuntime;
21:       if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return null;
22:       const library=runtime.getLibrarySnapshot();
23:       if(!library||!library.activeSaveId||!Array.isArray(library.saves))return null;
24:       const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
25:       if(!entry||!entry.showdown)return null;
26:       const marker=entry.showdown.sharedJourney;
27:       return Boolean(marker&&marker.mode==="shared"&&marker.setupPending===true);
28:     }catch(_error){return null;}
29:   }
30:   function pending(){
31:     // A verified active save owns either verdict; no shell yet retains the transient lock.
32:     const saved=persistedPending();if(saved!==null)return saved;
33:     try{return Boolean(root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1");}
34:     catch(_error){return false;}
35:   }
36:   function deny(name){
37:     if(typeof root.showAppNotice==="function"){
38:       root.showAppNotice(
39:         `In an online Showdown, ${name} happens only in setup, with both players connected.`,
40:         "error",
41:         9000
42:       );
43:     }
44:     return false;
45:   }
46:   function blockLocalDraw(name){if(!pending())return false;deny(name);return true;}
47:   function wrap(name){
48:     const original=root[name];
49:     if(typeof original!=="function"||original[WRAPPED])return false;
50:     function guarded(...args){
51:       if(blockLocalDraw(name))return false;
52:       return original.apply(this,args);
53:     }
54:     Object.defineProperty(guarded,WRAPPED,{value:true});
55:     Object.defineProperty(guarded,"ssjrOriginal",{value:original});
56:     root[name]=guarded;
57:     return true;
58:   }
59:   function routeCareerStartClick(target){
60:     if(target.id!=="continueClubAssignment"||target.dataset.sharedCareerStart!=="true")return false;
61:     const careerStart=root.CareerModeProductionSharedCareerStart;
62:     if(!careerStart||typeof careerStart.openPanel!=="function")return false;
63:     Promise.resolve(careerStart.openPanel()).catch(error=>{
64:       if(typeof root.reportApplicationError==="function")root.reportApplicationError("Career Start did not finish",error);
65:       else console.error(error);
66:     });
67:     return true;
68:   }
69:   function routePresentationClick(target){
70:     const presentation=root.CareerModeProductionSharedShowdownPresentation;
71:     if(!presentation||typeof presentation.handlesControl!=="function"||typeof presentation.handleControlClick!=="function")return false;
72:     if(!presentation.handlesControl(target.id))return false;
73:     Promise.resolve(presentation.handleControlClick(target.id)).catch(error=>{
74:       if(typeof root.reportApplicationError==="function")root.reportApplicationError("That step did not finish",error);
75:       else console.error(error);
76:     });
77:     return true;
78:   }
79:   function installEventGate(){
80:     if(eventGateInstalled||!root.document||typeof root.document.addEventListener!=="function")return false;
81:     root.document.addEventListener("click",event=>{
82:       const source=event&&event.target;
83:       const target=source&&typeof source.closest==="function"?source.closest("#spinLeague,#openClubPack,#continueClubAssignment"):null;
84:       if(!target||!pending())return;
85:       event.preventDefault();
86:       event.stopImmediatePropagation();
87:       if(routeCareerStartClick(target))return;
88:       if(routePresentationClick(target))return;
89:       deny(CLICK_TARGETS[target.id]||target.id);
90:     },true);
91:     eventGateInstalled=true;return true;
92:   }
93:   function hookRuntimeLoader(){
94:     const original=root.loadRuntimeScript;
95:     if(typeof original!=="function"||original[LOADER_WRAPPED])return false;
96:     function guardedRuntimeLoader(...args){
97:       return Promise.resolve(original.apply(this,args)).then(value=>{
98:         install();
99:         return value;
100:       });
101:     }
102:     Object.defineProperty(guardedRuntimeLoader,LOADER_WRAPPED,{value:true});
103:     Object.defineProperty(guardedRuntimeLoader,"ssjrOriginal",{value:original});
104:     root.loadRuntimeScript=guardedRuntimeLoader;
105:     return true;
106:   }
107:   function install(){
108:     installEventGate();hookRuntimeLoader();GUARDED.forEach(wrap);
109:     if(timer===null&&typeof root.setInterval==="function"){
110:       let attempts=0;
111:       timer=root.setInterval(()=>{
112:         installEventGate();hookRuntimeLoader();GUARDED.forEach(wrap);
113:         attempts+=1;
114:         if(attempts>=120){root.clearInterval(timer);timer=null;}
115:       },250);
116:     }
117:     return true;
118:   }
119: 
120:   const api=Object.freeze({
121:     contractVersion:2,
122:     feature:"ssjr-local-random-authority-guard",
123:     guardedFunctions:GUARDED,
124:     hooksLazyRuntimeLoader:true,
125:     capturesActualDrawClicks:true,
126:     routesPolishedPresentationClicks:true,
127:     routesCareerStartAfterConfirmedSetup:true,
128:     usesPersistedSaveMarker:true,
129:     canonicalLocalStorageMutation:false,
130:     billingRequired:false,
131:     isSharedJourneyPending:pending,
132:     blockLocalDraw,
133:     install
134:   });
135:   root.CareerModeProductionSharedJourneyGuard=api;
136:   install();
137: })(typeof globalThis!=="undefined"?globalThis:this);
138: 
```

## FILE: js/productionSharedJourneyConflicts.js (54 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeProductionSharedJourneyConflicts=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const RUNTIME_REVISION="1.9.1-r15";
9:   let guard=null,guardPromise=null,lastReceipt=null,installed=false;
10:   const listeners=new Set();
11: 
12:   function pjcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
13:   function pjcLoad(){
14:     if(root.CareerModeSharedJourneyConflicts)return Promise.resolve(root.CareerModeSharedJourneyConflicts);
15:     if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"JOURNEY_CONFLICT_DEPENDENCY_UNAVAILABLE"}));
16:     return root.loadRuntimeScript("ssjr-journey-conflicts-protocol","js/sharedJourneyConflicts.js",()=>root.CareerModeSharedJourneyConflicts).then(()=>root.CareerModeSharedJourneyConflicts);
17:   }
18:   async function pjcEnsure(){
19:     if(guard)return guard;
20:     if(guardPromise)return guardPromise;
21:     guardPromise=pjcLoad().then(factory=>{
22:       if(!factory||typeof factory.createGuard!=="function")pjcFail("JOURNEY_CONFLICT_PROTOCOL_UNAVAILABLE");
23:       const created=factory.createGuard({cryptoImpl:root.crypto});
24:       if(!created||typeof created.execute!=="function")pjcFail("JOURNEY_CONFLICT_PROTOCOL_UNAVAILABLE");
25:       guard=created;return guard;
26:     }).finally(()=>{guardPromise=null;});
27:     return guardPromise;
28:   }
29:   function pjcPublish(receipt){
30:     lastReceipt=receipt||null;
31:     for(const listener of listeners){try{listener(lastReceipt);}catch(_error){}}
32:     try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-journey-conflict-state-change",{detail:lastReceipt}));}catch(_error){}
33:     return lastReceipt;
34:   }
35:   async function pjcExecute(options,invoke){
36:     const current=await pjcEnsure();
37:     try{
38:       const result=await current.execute(options,invoke);pjcPublish(current.getLastReceipt());return result;
39:     }catch(error){pjcPublish(current.getLastReceipt());throw error;}
40:   }
41:   async function pjcPreflight(options){const current=await pjcEnsure();try{return await current.preflight(options);}catch(error){pjcPublish(current.getLastReceipt());throw error;}}
42:   async function pjcClearExpired(nowEpochMs){const current=await pjcEnsure();const removed=current.clearExpired(nowEpochMs);pjcPublish(current.getLastReceipt());return removed;}
43:   async function pjcReset(){const current=await pjcEnsure();current.reset();pjcPublish(null);return true;}
44:   function pjcSubscribe(listener){if(typeof listener!=="function")return ()=>{};listeners.add(listener);return ()=>listeners.delete(listener);}
45:   function pjcInstall(){if(installed)return true;installed=true;void pjcEnsure().catch(error=>root.console?.warn?.("[Career Mode Showdown] Journey Conflicts guard unavailable.",error));return true;}
46: 
47:   return Object.freeze({
48:     contractVersion:1,feature:"ssjr-production-shared-journey-conflicts",productionEnabled:true,runtimeRevision:RUNTIME_REVISION,
49:     providerAuthorityPreserved:true,nonAuthorizingReceipts:true,boundedStaleRetry:true,alteredReplayPreProviderDenied:true,
50:     canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
51:     install:pjcInstall,execute:pjcExecute,preflight:pjcPreflight,clearExpired:pjcClearExpired,reset:pjcReset,getState:()=>lastReceipt,subscribe:pjcSubscribe
52:   });
53: });
54: 
```

(End of packet FJ8. Answer with the report only.)
