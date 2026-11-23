# Fable 5.2 red-team job FJ1: Prime Pack: one award, server time

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
Then one block per finding: ID (FJ1-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Can both managers get Prime Pack points in one season, or neither when one guessed right first, or the wrong stage's points (4/3/2/1)? Cover both right at the same instant, a guess sent just as a stage ends, a retry after a network error, a double tap, a phone whose clock is minutes off.
2. Can a manager use more than 2 guesses, or lose a guess he never sent?
3. Does a reload or late join land on the right stage with the right guesses left, on both phones?
4. Does the Rules fragment ever refuse a normal guess or arrival (permission-denied), or accept one that gives the wrong points?
5. Is there any 11 or 110 score, tiebreak, or a stage 5 that still accepts guesses (stage 5 is full reveal, no guessing)?

## Known (do not report)
Older Showdowns before Prime Pack shipped never play it (by design).

## Files

## FILE: js/iconGuessStep.js (363 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeIconGuessStep=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   // Prime Pack season step (r87; spec project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md). Once a season, after Roster Roulette and before the Transfer Challenge, both phones reveal one masked Icon card in four stages (position + one seeded stat, then one more stat per stage). Two guesses each; the first right one the server records wins 4, 3, 2 or 1 by stage (sparse primePack result key, season maximum 15); nobody by stage 4 is a draw and the whole card shows. Old Showdowns never play it (js/iconGuess.js eligible, the same boundary as Roster Roulette).
9:   // Shared record rivalries/{rid}/primePackRounds/season_N (Rules: season-results fragment): arrivals (server time), each manager's used guesses, namedBy. The start is the later arrival + 3 s and every stage follows the Transfer Challenge server clock, so a reload lands on the current stage. Guesses are transactions on this record: the first right commit sets namedBy, every later write is refused, and its stage (so its points) comes from that write's server updatedAt, never a phone clock; the Rules check it.
10:   // The icon comes from the Showdown id (no read, never stored); rightness is decided here and the record only says who won. Wrong guesses are never stored: the other phone sees only the chip count drop. Reads: one listener while open (two arrivals, up to four guesses) plus one transaction read per write; a Showdown the game does not apply to costs nothing.
11:   // File names keep the working name (iconGuess*, icon-guess) so the reviewed parts stay where they were reviewed; everything a player sees says Prime Pack.
12:   const PAGE="visual-assets/v10_1/icon-guess/index.html";
13:   const STAGE_ID="igStage",PANEL_ID="igStepPanel",COLLECTION="primePackRounds";
14:   const DONE_KEY="careerModeShowdown.primePackDone.v1",KEYS_MAX=60;
15:   const LOAD_WAIT_MS=10000,READY_WAIT_MS=10000,TICK_MS=200,POLL_MS=2500,REJOIN_MS=3000;
16:   const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
17:   const wonMemo=new Map();
18:   // wentHome: the last run ended because the manager chose Showdown Home (not a fault), so the caller shows no error.
19:   let running=null,wentHome=false;
20:   // E1 (2.4.0, Fable re-check 2): the partner's END SHOWDOWN (js/productionSharedTerminalClose.js) ends the round on screen at
21:   // once (end()): the screen session stops (its listener, timer and record watch), no arrival or withdraw is sent after it, a
22:   // card answers by itself, and nothing more is drawn or navigated by this run.
23:   let endGen=0,runGen=0,runRivalry="",playEnd=null,askEnd=null;
24:   function igsEnded(){return runGen!==endGen;}
25: 
26:   function igsDoc(){return root.document||null;}
27:   function igsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
28:   function igsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
29:   function igsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
30:   function igsSeasonId(season){return `season_${season}`;}
31:   function igsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
32:   function igsMark(key,item){try{const list=igsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
33:   async function igsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
34:   // The round logic, the matcher and the list. false when any of them cannot load in time.
35:   async function igsEnsure(){
36:     const loads=Promise.all([
37:       igsLoad("icon-guess","js/iconGuess.js",()=>Boolean(root.CareerModeIconGuess)),
38:       igsLoad("icon-list","data/icons.js",()=>Boolean(root.CareerModeIcons)),
39:       igsLoad("icon-names","js/iconNames.js",()=>Boolean(root.CareerModeIconNames))
40:     ]).then(list=>list.every(Boolean),()=>false);
41:     return Promise.race([loads,igsWait(LOAD_WAIT_MS).then(()=>false)]);
42:   }
43:   function igsGuess(){return root.CareerModeIconGuess||(typeof require==="function"?require("./iconGuess.js"):null);}
44: 
45:   // ctx = {rivalryId, managerRole, season, confirmedAtMs}. Does this Showdown play Prime Pack this season? It needs
46:   // js/iconGuess.js: a browser caller awaits ensure() first (before it, the answer is always false).
47:   function igsApplies(ctx){
48:     if(!ctx)return false;
49:     if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
50:     if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
51:     const guess=igsGuess();
52:     return Boolean(guess&&guess.eligible(ctx.rivalryId,ctx.confirmedAtMs));
53:   }
54: 
55:   // ---------- the record: Firestore <-> js/iconGuess.js ----------
56:   function igsMillis(value){if(value&&typeof value.toMillis==="function"){const ms=value.toMillis();return Number.isFinite(ms)?ms:null;}return null;}
57:   // The stored document as the round logic's record. The winner's beat and time come from the winning write (no later write
58:   // is allowed once there is a winner, so updatedAt is that write's server time).
59:   function igsRecord(data,season){
60:     const guess=igsGuess();
61:     if(!data||data.objectType!=="sharedPrimePackRound"||data.seasonNumber!==season)return null;
62:     const arrived={playerOne:igsMillis(data.arrived?.playerOne),playerTwo:igsMillis(data.arrived?.playerTwo)};
63:     let winner=null;
64:     if(ROLES.includes(data.namedBy)){
65:       const atMs=igsMillis(data.updatedAt),startMs=arrived.playerOne&&arrived.playerTwo?Math.max(arrived.playerOne,arrived.playerTwo)+guess.leadMs:null;
66:       const at=startMs&&atMs?guess.beatAt(startMs,atMs):null;
67:       winner={role:data.namedBy,beat:at&&at.beat>=0?Math.min(at.beat,guess.lastBeat):0,atMs:atMs||1};
68:     }
69:     const record={v:1,season,arrived,chipsUsed:{playerOne:data.chipsUsed?.playerOne,playerTwo:data.chipsUsed?.playerTwo},winner};
70:     return guess.outcome(record,0)?record:null;
71:   }
72:   function igsRef(io,season){return io.sdk.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(season));}
73:   function igsStamp(io){return {activeSessionId:io.sessionId,updatedByDeviceId:io.deviceId,updatedAt:io.sdk.serverTimestamp()};}
74:   // This manager is on the screen: his arrival is written once (the first one stands; a reload never moves the start).
75:   async function igsArrive(io,ctx){
76:     const ref=igsRef(io,ctx.season),me=ctx.managerRole;
77:     return io.sdk.runTransaction(io.firestore,async tx=>{
78:       const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
79:       if(!data){
80:         tx.set(ref,{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:io.rivalryId,seasonNumber:ctx.season,
81:           arrived:{[me]:io.sdk.serverTimestamp(),[igsOther(me)]:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...igsStamp(io)});
82:         return "created";
83:       }
84:       if(data.arrived&&data.arrived[me]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:io.sdk.serverTimestamp(),revision:data.revision+1,...igsStamp(io)});return "arrived";}
85:       return "already";
86:     });
87:   }
88:   // Leaving (BACK, or the phone hidden) before the other manager has arrived withdraws this arrival (Fable F12-02), so the
89:   // round can never start while this manager is away; coming back arrives again. Once both have arrived it stays.
90:   async function igsLeave(io,ctx){
91:     const ref=igsRef(io,ctx.season),me=ctx.managerRole;
92:     return io.sdk.runTransaction(io.firestore,async tx=>{
93:       const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
94:       if(data&&data.arrived&&data.arrived[me]!=null&&data.arrived[igsOther(me)]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:null,revision:data.revision+1,...igsStamp(io)});return "left";}
95:       return "stays";
96:     });
97:   }
98:   // Arrive and leave run one after the other, in the order they were asked for (a quick hide and show never leaves a
99:   // withdrawn arrival behind).
100:   let igsPresenceChain=Promise.resolve();
101:   function igsPresence(task){const run=igsPresenceChain.then(task,task);igsPresenceChain=run.catch(()=>{});return run;}
102:   // One matched guess: this manager's used guesses +1, and the winner when it is right, on the latest record.
103:   async function igsApplyGuess(io,ctx,correct){
104:     const ref=igsRef(io,ctx.season),guess=igsGuess();
105:     return io.sdk.runTransaction(io.firestore,async tx=>{
106:       const snap=await tx.get(ref),data=snap.exists()?snap.data():null,record=igsRecord(data,ctx.season);
107:       if(!record)return {ok:false,reason:"BAD_RECORD"};
108:       const next=guess.applyGuess(record,{role:ctx.managerRole,correct,atMs:io.now()});
109:       if(!next.ok)return next;
110:       tx.update(ref,{[`chipsUsed.${ctx.managerRole}`]:next.record.chipsUsed[ctx.managerRole],namedBy:correct?ctx.managerRole:null,revision:data.revision+1,...igsStamp(io)});
111:       return next;
112:     });
113:   }
114:   // The listener on the round record (counted by the read meter); a timed transaction read when no listener is available.
115:   async function igsSnapshotApi(io){
116:     const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);
117:     if(typeof io.sdk.onSnapshot==="function")return meter(io.sdk);
118:     const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
119:     if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
120:     try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
121:   }
122:   async function igsWatch(io,ctx,onData,onError){
123:     const api=await igsSnapshotApi(io),ref=igsRef(io,ctx.season);
124:     if(api){
125:       const listenRef=api===io.sdk?ref:api.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(ctx.season));
126:       return api.onSnapshot(listenRef,{includeMetadataChanges:true},snap=>{if(snap.metadata?.hasPendingWrites||snap.metadata?.fromCache)return;onData(snap.exists()?snap.data():null);},onError);
127:     }
128:     let stopped=false;
129:     const poll=async()=>{while(!stopped){try{const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});if(!stopped)onData(data);}catch(error){if(!stopped)onError(error);return;}await igsWait(POLL_MS);}};
130:     void poll();
131:     return ()=>{stopped=true;};
132:   }
133: 
134:   // How many Prime Pack points this manager won this season (0, or 4 to 1 by stage). Read by the season results before they
135:   // are published, so the points go in as primePack:N (the Rules check N against the round record). io = {firestore, sdk,
136:   // rivalryId}. One read, once per season, only for a Showdown the game applies to.
137:   async function igsPointsFor(io,ctx){
138:     if(!igsApplies(ctx))return 0;
139:     const key=igsKey(ctx);if(wonMemo.has(key))return wonMemo.get(key);
140:     const ref=igsRef(io,ctx.season);
141:     const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
142:     const record=igsRecord(data,ctx.season);
143:     const points=record&&record.winner?igsGuess().points(record)[ctx.managerRole]:0;
144:     if(record&&record.winner)wonMemo.set(key,points);
145:     return points;
146:   }
147: 
148:   // ---------- the screen ----------
149:   function igsEl(tag,className,text){const node=igsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
150:   function igsRemove(id){const node=igsDoc()?.getElementById(id);if(node)node.remove();}
151:   function igsClose(){igsRemove(PANEL_ID);igsRemove(STAGE_ID);}
152:   // E1: the partner ended this Showdown (Terminal Close). A run for another Showdown is left alone (false).
153:   function igsEnd(rivalryId){
154:     const id=String(rivalryId||"").trim().toLowerCase();if(running&&id&&runRivalry&&id!==runRivalry)return false;
155:     endGen+=1;const play=playEnd,ask=askEnd;playEnd=null;askEnd=null;
156:     try{play?.();}catch(_error){}try{ask?.();}catch(_error){}
157:     igsClose();return true;
158:   }
159:   // A plain choice card over the stage (the same look as the roulette's step panel when its styles are loaded).
160:   function igsAsk({heading,lines=[],buttons}){
161:     if(igsEnded())return Promise.resolve("back");
162:     return new Promise(resolve=>{
163:       igsRemove(PANEL_ID);askEnd=()=>{askEnd=null;igsRemove(PANEL_ID);resolve("back");};
164:       const overlay=igsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",heading);
165:       overlay.style.cssText="position:fixed;inset:0;z-index:96;display:flex;align-items:center;justify-content:center;background:#050403;padding:16px";
166:       const shell=igsEl("div","remoteJoiningShell rrStepShell");shell.style.cssText="max-width:420px;width:100%;background:#15130f;color:#f3ead7;border:1px solid #6b5a33;border-radius:12px;padding:20px";
167:       shell.append(igsEl("strong","","PRIME PACK"),igsEl("h2","rrStepTitle",heading));
168:       for(const line of lines)shell.append(igsEl("p","rrStepLine",line));
169:       const row=igsEl("div","rrStepActions");row.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px";
170:       for(const b of buttons){const button=igsEl("button",b.primary?"menuButton rrStepPrimary":"compactButton rrStepBack",b.label);button.type="button";button.addEventListener("click",()=>{askEnd=null;igsRemove(PANEL_ID);resolve(b.id);});row.append(button);}
171:       shell.append(row);overlay.append(shell);igsDoc().body.append(overlay);row.querySelector("button")?.focus();
172:     });
173:   }
174:   function igsStage(){
175:     const doc=igsDoc();igsRemove(STAGE_ID);
176:     const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Prime Pack");
177:     stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403";
178:     const frame=doc.createElement("iframe");frame.title="Prime Pack";
179:     const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
180:     frame.src=`${base}${base.includes("?")?"&":"?"}embed=1`;
181:     frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
182:     // Leaving: before the other manager has arrived it withdraws this arrival; during the round (r88 continue-career C) it
183:     // shows too, so a manager is never shut in. The round goes on by the server clock and START comes back to it; only the
184:     // result hides it (its CONTINUE is the way on).
185:     const back=doc.createElement("button");back.type="button";back.className="compactButton rrStepBack";back.textContent="BACK TO SHOWDOWN HOME";back.hidden=true;
186:     back.style.cssText="position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2;"
187:       // black-and-gold marble like the roulette step panel's back button (css/v10Roulette.css .rrStepBack): the plain compactButton is white
188:       +"box-sizing:border-box;min-height:44px;padding:10px 22px;color:#ffd34d;background:linear-gradient(180deg,#17140e,#070605);border:1px solid #d4a017;border-radius:3px;"
189:       +"box-shadow:inset 0 1px 0 rgba(242,196,91,.25),0 0 0 1px #000,0 6px 16px rgba(0,0,0,.6);font:700 17px/1.1 var(--r95-font-narrow);letter-spacing:.12em;text-transform:uppercase;text-shadow:none;max-width:calc(100% - 24px);text-align:center";
190:     stage.append(frame,back);doc.body.append(stage);
191:     // The roulette's result panel (z-index 96) stays over this stage until the Prime Pack page is ready (Reus Gate, Fable
192:     // F13-07: a slow page never shows a plain dark screen); igsPlay closes it on cms-ig-ready, or when the step fails.
193:     return {stage,frame,back};
194:   }
195:   function igsPost(frame,type,data={}){try{frame.contentWindow?.postMessage({type,...data},root.location?.origin||"*");}catch(_error){}}
196:   // What the page needs for this season's card. The name and overall go with it (the page never shows them before the
197:   // result: N2); the manager names are fixed, Daniel is playerOne.
198:   function igsRound(ctx){
199:     const guess=igsGuess(),list=root.CareerModeIcons,players=list&&list.players;
200:     const draw=players&&guess.draw(ctx.rivalryId,ctx.season,players.length,list.listVersion);
201:     const icon=draw&&players[draw.index];
202:     if(!icon)return null;
203:     const source=`${String(icon.cardVersion||"").toUpperCase()} · ${icon.game}`;
204:     return {answerId:icon.id,round:{me:ctx.managerRole,names:{...NAMES},stages:guess.stages,position:icon.position,overall:icon.overall,name:icon.name,
205:       stats:{...icon.stats},statOrder:[...draw.statOrder],stagePoints:[...guess.stagePoints],nation:icon.nationCode,source}};
206:   }
207:   // A suggestion shows the card name, or the full name when two icons share that card name (typing it alone is ambiguous).
208:   function igsSuggestions(index,text){
209:     const names=root.CareerModeIconNames;
210:     return names.suggest(index,text).map(s=>{const m=names.match(index,s.name);return m.status==="ambiguous"?s.fullName:s.name;});
211:   }
212: 
213:   // Runs this season's Prime Pack for this manager. io = {firestore, sdk (doc, runTransaction, serverTimestamp, onSnapshot?),
214:   // rivalryId, sessionId, deviceId, now() (server time)}. Resolves true when the Transfer Challenge may open (the round is over
215:   // and this manager pressed Continue, or the game does not apply), false when he went back to Showdown Home or the step
216:   // could not run (the window then stays shut and the dashboard says why; tapping again retries).
217:   async function igsRun(ctx,io){
218:     if(running)return running;
219:     wentHome=false;runGen=endGen;runRivalry=String(ctx&&ctx.rivalryId||"").trim().toLowerCase();const gen=runGen;
220:     // On true the stage stays up until the Transfer Challenge is on screen (the caller closes it), so nothing flashes between.
221:     // BACK TO SHOWDOWN HOME opens Showdown Home, as the roulette's and Chamber Men's do: closing the stage alone left the screen
222:     // underneath (Club Assignment in season 1, the season dashboard later) and the tap seemed to do nothing.
223:     running=igsRunNow(ctx,io).then(go=>{if(!go)igsClose();return go;},error=>{igsClose();throw error;}).then(go=>{if(gen!==endGen){wentHome=true;igsClose();return false;}if(!go&&wentHome&&typeof root.navigateTo==="function")return Promise.resolve().then(()=>root.navigateTo("mainMenu")).catch(()=>{}).then(()=>go);return go;}).finally(()=>{running=null;});
224:     return running;
225:   }
226:   async function igsRunNow(ctx,io){
227:     if(!igsApplies(ctx))return true;
228:     if(!await igsEnsure()||igsEnded())return false;
229:     // This phone already saw this season's result and pressed Continue: straight on to the Transfer Challenge.
230:     if(igsList(DONE_KEY).includes(igsKey(ctx)))return true;
231:     const index=root.CareerModeIconNames.defaultIndex(),pick=igsRound(ctx),guess=igsGuess();
232:     if(!index||!pick)return false;
233:     for(;;){
234:       if(igsEnded())return false;
235:       const result=await igsPlay(ctx,io,{index,pick,guess});
236:       if(result==="ended"||igsEnded())return false;
237:       if(result==="continue"){igsMark(DONE_KEY,igsKey(ctx));return true;}
238:       if(result==="back"){wentHome=true;return false;}
239:       const choice=await igsAsk({heading:"Prime Pack could not load",lines:[root.CareerModeFirestoreBudget?.quotaMessage?.(result)||"Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
240:       if(igsEnded())return false;
241:       if(choice==="back"){wentHome=true;return false;}
242:     }
243:   }
244:   // One screen session: "continue", "back", or an error object.
245:   function igsPlay(ctx,io,{index,pick,guess}){
246:     return new Promise(resolve=>{
247:       const me=ctx.managerRole,other=igsOther(me);
248:       const {frame,back}=igsStage();
249:       // resultShown: the result on screen as "winner:points" (or "draw:0"); it follows the server's record, so a winner that
250:       // lands after a shown draw (the Rules' 2 s slack) replaces it (Fable F12-03).
251:       let record=null,ready=false,stop=null,timer=null,shownBeat=-2,finished=false,resultShown="",sentChips={playerOne:null,playerTwo:null};
252:       // After this phone's right guess: the round record as the server stamped it (its updatedAt gives the stage and points).
253:       const readBack=()=>io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(igsRef(io,ctx.season));return snap.exists()?snap.data():null;}).then(data=>onData(data),()=>{});
254:       const end=value=>{if(finished)return;finished=true;if(playEnd===endNow)playEnd=null;root.clearInterval(timer);root.removeEventListener("message",onMessage);igsDoc().removeEventListener?.("visibilitychange",onVisibility);try{stop&&stop();}catch(_error){}resolve(value);};
255:       const endNow=()=>end("ended");playEnd=endNow;
256:       // Away while the other manager has not arrived: withdraw (igsLeave); back on screen: arrive again.
257:       // rejoinedAt: when this phone last sent its arrival again (Fable F13-02), at most once every REJOIN_MS.
258:       let away=false,rejoinedAt=-Infinity;
259:       const leave=()=>igsPresence(()=>igsLeave(io,ctx)).catch(error=>{root.CareerModeFirestoreBudget?.noteError?.(error);});
260:       const closeRoulette=()=>{try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}};
261:       // Fable F13-03: back on screen after a lock, the phone's clock may have stood still: take a fresh server time and send
262:       // the current stage and chips again, so the page never shows stage 2 while the server scores stage 3.
263:       const resend=()=>{shownBeat=-2;sentChips={playerOne:null,playerTwo:null};render();};
264:       // Sol r5 R5-01: hidden before this phone has seen the round record (its first arrival may still be on its way) counts as
265:       // away too. The withdraw runs on the presence chain, after that arrival, and an arrival that lands while hidden is
266:       // withdrawn when its record arrives (onData), so the other manager can never start the round alone.
267:       const onVisibility=()=>{
268:         if(finished)return;
269:         if(igsDoc().visibilityState==="hidden"){if(ready&&(record?!record.winner&&record.arrived[other]===null:true)){away=true;leave();}return;}
270:         resend();
271:         Promise.resolve().then(()=>io.resync?.()).catch(()=>{}).then(()=>{if(!finished)resend();});
272:         if(away){away=false;rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
273:       };
274:       // Fable F13-01: a fault withdraws this manager's arrival (if the other has not arrived), so nobody plays alone for 4.
275:       const fail=error=>{if(finished)return;root.CareerModeFirestoreBudget?.noteError?.(error);closeRoulette();if(ready&&!(record&&record.arrived[other]!==null))leave();end(error||{code:"PRIME_PACK_FAILED"});};
276:       const render=()=>{
277:         if(!ready||!record||finished)return;
278:         let now;try{now=io.now();}catch(error){return fail(error);}
279:         const out=guess.outcome(record,now);if(!out)return;
280:         for(const role of ROLES){if(sentChips[role]!==out.chips[role]){sentChips[role]=out.chips[role];igsPost(frame,"cms-ig-chips",{role,count:out.chips[role]});}}
281:         if(out.state==="won"||out.state==="draw"){
282:           const points=out.winner?guess.points(record)[out.winner]:0,shown=`${out.winner||"draw"}:${points}`;
283:           if(resultShown!==shown&&!(out.state==="draw"&&resultShown)){
284:             resultShown=shown;back.hidden=true;
285:             igsPost(frame,"cms-ig-result",{winner:out.winner||"draw",points});
286:             if(out.winner)for(const role of ROLES)wonMemo.set(igsKey({...ctx,managerRole:role}),role===out.winner?points:0);
287:           }
288:           return;
289:         }
290:         if(out.state==="waiting"){
291:           // Fable F13-02: BACK always shows while waiting. This phone is on screen but its arrival is missing (a withdraw that
292:           // landed late, a lost write): it arrives again, at most once every REJOIN_MS.
293:           const waitingFor=record.arrived[other]===null?other:me;back.hidden=false;
294:           if(record.arrived[me]===null&&!away&&igsDoc().visibilityState!=="hidden"&&Date.now()-rejoinedAt>=REJOIN_MS){rejoinedAt=Date.now();igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
295:           if(shownBeat!==-1){shownBeat=-1;igsPost(frame,"cms-ig-waiting",{role:waitingFor});}
296:           return;
297:         }
298:         back.hidden=false;
299:         const at=guess.beatAt(guess.startMs(record),now);
300:         if(at.phase==="waiting"){if(shownBeat!==-1.5){shownBeat=-1.5;igsPost(frame,"cms-ig-waiting",{role:null});}return;}
301:         if(at.beat!==shownBeat){shownBeat=at.beat;igsPost(frame,"cms-ig-reveal",{index:at.beat,phase:at.phase,remainingMs:at.stageMsLeft,revealMsLeft:at.phase==="reveal"?at.msLeft:0});}
302:       };
303:       const onData=data=>{
304:         if(finished)return;
305:         const next=igsRecord(data,ctx.season);
306:         if(!next)return;
307:         record=next;
308:         if(away&&igsDoc().visibilityState==="hidden"&&!record.winner&&record.arrived[me]!==null&&record.arrived[other]===null)leave();
309:         render();
310:       };
311:       const onMessage=event=>{
312:         if(event.source!==frame.contentWindow||!event.data||typeof event.data.type!=="string")return;
313:         const m=event.data;
314:         if(m.type==="cms-ig-ready"){
315:           if(ready)return;ready=true;
316:           igsPost(frame,"cms-ig-start",{round:pick.round,waitingFor:other});shownBeat=-2;sentChips={playerOne:null,playerTwo:null};
317:           // The page is up: the roulette panel goes (F13-07), and only now does this manager arrive, so a slow page never
318:           // spends its own stage 1 (Fable F13-01).
319:           closeRoulette();join();
320:           render();
321:         }else if(m.type==="cms-ig-input"){
322:           igsPost(frame,"cms-ig-suggestions",{names:igsSuggestions(index,String(m.text||""))});
323:         }else if(m.type==="cms-ig-guess"){
324:           const check=root.CareerModeIconNames.check(index,String(m.text||""),pick.answerId);
325:           if(check.status==="empty"||check.status==="not-in-list")return igsPost(frame,"cms-ig-feedback",{kind:"not-in-list"});
326:           if(check.status==="ambiguous")return igsPost(frame,"cms-ig-feedback",{kind:"ambiguous"});
327:           igsApplyGuess(io,ctx,check.correct).then(next=>{
328:             if(!next.ok)return igsPost(frame,"cms-ig-feedback",{kind:next.reason==="NO_CHIPS"?"used":"late"});
329:             // A right guess: its stage, and so its points, is the SERVER time of the write (updatedAt), never this phone's clock
330:             // when the transaction read ran (Fable F12-01: a commit landing past a stage edge scores the later stage). Only the
331:             // stamped record is shown or remembered, so both phones and the season result agree with the Rules.
332:             if(check.correct)return readBack();
333:             record=next.record;igsPost(frame,"cms-ig-feedback",{kind:"wrong"});render();
334:           },error=>{root.CareerModeFirestoreBudget?.noteError?.(error);igsPost(frame,"cms-ig-feedback",{kind:/permission/.test(String(error&&error.code))?"late":"error"});});
335:         }else if(m.type==="cms-ig-continue"){
336:           if(resultShown)end("continue");
337:         }else if(m.type==="cms-ig-error"){
338:           // A page fault never decides the round: it is reported and the round carries on with the server's record.
339:           root.CareerModeFirestoreBudget?.noteError?.({code:"PRIME_PACK_PAGE",message:String(m.message||"")});
340:         }
341:       };
342:       back.addEventListener("click",()=>{if(finished)return;leave();end("back");});
343:       igsDoc().addEventListener?.("visibilitychange",onVisibility);
344:       root.addEventListener("message",onMessage);
345:       timer=root.setInterval(render,TICK_MS);
346:       root.setTimeout(()=>{if(!ready&&!finished)fail({code:"PRIME_PACK_PAGE_TIMEOUT"});},READY_WAIT_MS);
347:       const join=()=>Promise.resolve().then(async()=>{
348:         rejoinedAt=Date.now();
349:         await igsPresence(()=>igsArrive(io,ctx));
350:         if(finished)return;
351:         const unsubscribe=await igsWatch(io,ctx,onData,fail);
352:         if(finished){try{unsubscribe();}catch(_error){}return;}
353:         stop=unsubscribe;
354:       }).catch(fail);
355:     });
356:   }
357: 
358:   return Object.freeze({contractVersion:1,feature:"cms-prime-pack-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,collection:COLLECTION,doneKey:DONE_KEY,
359:     applies:igsApplies,wonPoints:ctx=>wonMemo.has(igsKey(ctx))?wonMemo.get(igsKey(ctx)):null,record:igsRecord,round:igsRound,suggestions:igsSuggestions,pointsFor:igsPointsFor,arrive:igsArrive,leave:igsLeave,applyGuess:igsApplyGuess,run:igsRun,close:igsClose,end:igsEnd,markDone:ctx=>igsMark(DONE_KEY,igsKey(ctx)),wentHome:()=>wentHome,ensure:igsEnsure,
360:     // Fable FJ12-03 (r98): the Prime Pack is at the managers' pace; Career Start's open limit waits while it runs.
361:     active:()=>Boolean(running)});
362: });
363: 
```

## FILE: js/iconGuess.js (199 lines)
```javascript
1: (function(root,factory){
2:   const api=factory();
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeIconGuess=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(){
6:   "use strict";
7: 
8:   // Prime Pack round logic (r88; spec project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md): once a season, after Roster Roulette and before the transfer window, both managers race to name a male outfield Legend, Icon, FUT Hero or Hall of FUT player from a card revealed in four stages (stage 1: position and one random face stat; each later stage adds one stat).
9:   // The first right guess the server records wins 4 Showdown points in stage 1, 3 in stage 2, 2 in stage 3 and 1 in stage 4; nobody by the end of stage 4 is a draw and the whole card shows. Each manager has two guesses a card.
10:   // Pure (no IO, clock or randomness of its own): the draw (icon and stat order from the Showdown id, like js/marqueePlayer.js and js/rosterRoulette.js: zero reads or writes, no repeat in a Showdown); the reveal clock (the stage showing at a server time, from the round's server start; a guess counts for the stage its server write time falls in); the round record (arrivals, chips used, winner).
11:   // applyGuess is the pure step the sync layer runs inside its transaction, so the first right guess the server records wins and phone clocks never decide it; wrong guesses are never stored, only the chip count moves. Name matching and the icon list live in js/iconNames.js and data/icons.js; the round speaks in list indexes and icon ids only.
12:   const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
13:   const ROLES=Object.freeze(["playerOne","playerTwo"]); // playerOne = Daniel, playerTwo = Nik (app-wide convention)
14:   const STATS=Object.freeze(["PAC","SHO","PAS","DRI","DEF","PHY"]);
15:   const MAX_SEASONS=10;
16:   const CHIPS=2;
17:   // THE ONE TABLE (Nik's final stage rule via G Lead, 2026-11-01 11:08 UTC; tune here only). Beats are the four guessing
18:   // stages. Each stage is a reveal animation (revealMs) then guessing time with a visible timer (guessMs); a guess at any
19:   // moment of a stage, reveal included, counts for that stage. stats is how many of the six real card stats are face up from
20:   // that stage on (1, 2, 3, 4; which stats is the seeded statOrder; the values are always the player's own). Stage 5 has no
21:   // guessing: when the round ends (a right guess at any stage, both out of guesses, or stage 4's timer) the result reveals
22:   // the last two stats, the name, the flag and the overall. The Rules hold the same stage edges
23:   // (ssjrPackStagePoints and ssjrPackGuessInTime in firestore.season-results-production.fragment.rules); contract G8 fails
24:   // until they match this table.
25:   const STAGES=Object.freeze([
26:     Object.freeze({points:4,revealMs:2500,guessMs:25000,stats:1,position:true,flag:false,overall:false}),
27:     Object.freeze({points:3,revealMs:1500,guessMs:20000,stats:2,position:true,flag:false,overall:false}),
28:     Object.freeze({points:2,revealMs:1500,guessMs:20000,stats:3,position:true,flag:false,overall:false}),
29:     Object.freeze({points:1,revealMs:1500,guessMs:20000,stats:4,position:true,flag:false,overall:false})
30:   ]);
31:   const BEATS=STAGES.length,LAST_BEAT=BEATS-1;
32:   const STAGE_POINTS=Object.freeze(STAGES.map(stage=>stage.points)),MAX_POINTS=STAGE_POINTS[0];
33:   // Each stage's start, relative to the round start, and the round's end (the last moment a guess counts).
34:   const STAGE_STARTS=Object.freeze(STAGES.reduce((out,stage,i)=>[...out,i?out[i-1]+STAGES[i-1].revealMs+STAGES[i-1].guessMs:0],[]));
35:   const ROUND_MS=STAGE_STARTS[LAST_BEAT]+STAGES[LAST_BEAT].revealMs+STAGES[LAST_BEAT].guessMs;
36:   const DRAW_SLACK_MS=2000; // the Rules' guess window ends at L+97 s, 2 s after the stage 4 window (L+95 s)
37:   const LEAD_MS=3000;   // after the second manager arrives, both phones count in together before the card rises
38:   const RECORD_VERSION=1;
39: 
40:   // ---------- the draw ----------
41:   // The id's first hex digit is the season count (js/persistentNikDanielPair.js), so it is left out: a new season must
42:   // never change the order already drawn.
43:   function igHex(rivalryId){const match=RIVALRY_ID.exec(String(rivalryId||""));return match?match[1].slice(1):null;}
44:   // A 32-bit stream seeded from text (xmur3 + mulberry32, as js/rosterRoulette.js): synchronous and the same on every phone.
45:   function igStream(text){
46:     let h=1779033703^text.length;
47:     for(let i=0;i<text.length;i+=1){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
48:     let a=(()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;})();
49:     return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0);};
50:   }
51:   // Unbiased integer in [0, n) from the stream (rejection sampling keeps every icon equally likely).
52:   function igBelow(next,n){const limit=Math.floor(0x100000000/n)*n;let value=next();while(value>=limit)value=next();return value%n;}
53:   function igShuffle(items,next){
54:     const out=items.slice();
55:     for(let i=out.length-1;i>0;i-=1){const j=igBelow(next,i+1);[out[i],out[j]]=[out[j],out[i]];}
56:     return out;
57:   }
58:   // The Showdown's icon order: a seeded shuffle of list indexes; season n takes entry n-1, so no icon repeats. The list
59:   // version is part of the seed: a new list is a new order, never a silent reshuffle of the old one.
60:   function igOrder(rivalryId,size,listVersion=1){
61:     const hex=igHex(rivalryId);
62:     if(!hex||!Number.isInteger(size)||size<MAX_SEASONS)return null;
63:     return Object.freeze(igShuffle(Array.from({length:size},(_,i)=>i),igStream(`icon-v1|order|${listVersion}|${hex}`)));
64:   }
65:   // The six stats in the order they flip this season.
66:   function igStatOrder(rivalryId,season){
67:     const hex=igHex(rivalryId);
68:     if(!hex||!igSeason(season))return null;
69:     return Object.freeze(igShuffle(STATS,igStream(`icon-v1|stats|${hex}|${season}`)));
70:   }
71:   const igSeason=season=>Number.isInteger(season)&&season>=1&&season<=MAX_SEASONS;
72:   // {index, statOrder} for one season, or null for a bad id, season or list.
73:   function igDraw(rivalryId,season,size,listVersion=1){
74:     if(!igSeason(season))return null;
75:     const order=igOrder(rivalryId,size,listVersion),statOrder=igStatOrder(rivalryId,season);
76:     return order&&statOrder?Object.freeze({season,index:order[season-1],statOrder}):null;
77:   }
78: 
79:   // Does this Showdown play the game? confirmedAt is the shared Setup's confirm time (millis, Timestamp or Date), as
80:   // js/marqueePlayer.js reads it. Older Showdowns, and any without a confirm time, never play it: no error, no point.
81:   function igMillis(at){
82:     if(Number.isFinite(at))return at;
83:     if(at&&typeof at.toMillis==="function"){const value=at.toMillis();return Number.isFinite(value)?value:null;}
84:     if(at instanceof Date){const value=at.getTime();return Number.isFinite(value)?value:null;}
85:     return null;
86:   }
87:   function igEligible(rivalryId,confirmedAt){
88:     const at=igMillis(confirmedAt);
89:     return Boolean(igHex(rivalryId))&&at!==null;
90:   }
91: 
92:   // ---------- the reveal clock ----------
93:   // When the stage 4 timer runs out: the last moment a guess counts. (A windowMs argument from older callers is ignored:
94:   // every timing lives in STAGES.)
95:   function igEndsAt(startMs){return Number.isFinite(startMs)?startMs+ROUND_MS:null;}
96:   // What a phone shows at server time nowMs. phase: "waiting" (before the start), "reveal" (a stage animating in),
97:   // "window" (that stage's guessing timer), "over" (the stage 4 timer has run out). msLeft is what is left of the current
98:   // phase; stageMsLeft is what is left of the whole stage (reveal plus timer). A phone that reloads or rejoins calls this
99:   // with the current server time and lands on the current stage; one that missed the whole game gets "over".
100:   function igBeatAt(startMs,nowMs){
101:     if(!Number.isFinite(startMs)||!Number.isFinite(nowMs))return null;
102:     const elapsed=nowMs-startMs;
103:     if(elapsed<0)return Object.freeze({phase:"waiting",beat:-1,msLeft:-elapsed,stageMsLeft:-elapsed});
104:     if(elapsed>=ROUND_MS)return Object.freeze({phase:"over",beat:LAST_BEAT,msLeft:0,stageMsLeft:0});
105:     let beat=LAST_BEAT;
106:     while(beat>0&&elapsed<STAGE_STARTS[beat])beat-=1;
107:     const stage=STAGES[beat],into=elapsed-STAGE_STARTS[beat],stageMsLeft=stage.revealMs+stage.guessMs-into;
108:     return into<stage.revealMs
109:       ?Object.freeze({phase:"reveal",beat,msLeft:stage.revealMs-into,stageMsLeft})
110:       :Object.freeze({phase:"window",beat,msLeft:stageMsLeft,stageMsLeft});
111:   }
112:   // Which parts of the card are face up once stage `beat` has started, straight from STAGES: the position and that stage's
113:   // stat count (in the seeded order). The last two stats, the flag, the overall and the name only show in the stage 5
114:   // reveal.
115:   function igRevealed(beat,statOrder){
116:     const stage=Number.isInteger(beat)&&beat>=0?STAGES[Math.min(beat,LAST_BEAT)]:null;
117:     const stats=stage&&Array.isArray(statOrder)?statOrder.slice(0,stage.stats):[];
118:     return Object.freeze({position:Boolean(stage&&stage.position),stats:Object.freeze(stats),flag:Boolean(stage&&stage.flag),overall:Boolean(stage&&stage.overall),name:false});
119:   }
120:   // What a right guess in beat `beat` is worth (0 outside the four stages).
121:   function igStagePoints(beat){return Number.isInteger(beat)&&beat>=0&&beat<BEATS?STAGE_POINTS[beat]:0;}
122: 
123:   // ---------- the round record ----------
124:   // One record per season round, the only thing the two phones share for this game:
125:   //   {v, season, arrived:{playerOne, playerTwo} (server ms or null), chipsUsed:{playerOne, playerTwo},
126:   //    winner: null | {role, beat, atMs}}
127:   // The start time is never stored: both phones derive it from the two arrival times. Wrong guesses are never stored.
128:   const igMs=value=>Number.isFinite(value)&&value>0;
129:   function igValid(record){
130:     if(!record||record.v!==RECORD_VERSION||!igSeason(record.season))return false;
131:     if(!record.arrived||!record.chipsUsed)return false;
132:     for(const role of ROLES){
133:       const at=record.arrived[role],used=record.chipsUsed[role];
134:       if(at!==null&&!igMs(at))return false;
135:       if(!Number.isInteger(used)||used<0||used>CHIPS)return false;
136:       if(used>0&&at===null)return false;
137:     }
138:     const w=record.winner;
139:     if(w!==null){
140:       if(!w||!ROLES.includes(w.role)||!Number.isInteger(w.beat)||w.beat<0||w.beat>LAST_BEAT||!igMs(w.atMs))return false;
141:       if(record.chipsUsed[w.role]<1)return false;
142:     }
143:     return true;
144:   }
145:   // The round starts LEAD_MS after the later arrival; null until both managers are on the screen.
146:   function igStartMs(record){
147:     if(!record||!record.arrived)return null;
148:     const a=record.arrived.playerOne,b=record.arrived.playerTwo;
149:     return igMs(a)&&igMs(b)?Math.max(a,b)+LEAD_MS:null;
150:   }
151:   // How the round stands at server time nowMs: "waiting" (someone hasn't arrived), "live", or the end:
152:   // "won" (winner set), "draw" (stage 4 window closed, or both managers out of chips, with no winner).
153:   function igOutcome(record,nowMs){
154:     if(!igValid(record))return null;
155:     const chips=Object.freeze({playerOne:CHIPS-record.chipsUsed.playerOne,playerTwo:CHIPS-record.chipsUsed.playerTwo});
156:     if(record.winner)return Object.freeze({state:"won",winner:record.winner.role,beat:record.winner.beat,chips});
157:     const startMs=igStartMs(record);
158:     if(startMs===null)return Object.freeze({state:"waiting",winner:null,beat:null,chips});
159:     if(chips.playerOne===0&&chips.playerTwo===0)return Object.freeze({state:"draw",winner:null,beat:null,chips});
160:     // Fable F13-06: the Rules take a right guess until 97 s after the later arrival (the end of stage 4 plus DRAW_SLACK_MS),
161:     // so a time draw shows only once that has passed; a guess from 95 s is still refused here (igApplyGuess).
162:     if(Number.isFinite(nowMs)&&nowMs>igEndsAt(startMs)+DRAW_SLACK_MS)return Object.freeze({state:"draw",winner:null,beat:null,chips});
163:     return Object.freeze({state:"live",winner:null,beat:null,chips});
164:   }
165:   // One accepted guess (a name already matched to an icon in the list; text that matched nothing never gets here and
166:   // costs no chip). correct is whether that icon is this season's answer. atMs is the SERVER time of the write (the
167:   // transaction's request time), never the phone's clock. Returns the next record, or why the guess doesn't count.
168:   // Run inside a transaction on the latest record: the first right guess to commit wins; a later one sees the winner.
169:   function igApplyGuess(record,{role,correct,atMs}={}){
170:     if(!igValid(record))return {ok:false,reason:"BAD_RECORD"};
171:     if(!ROLES.includes(role)||typeof correct!=="boolean"||!igMs(atMs))return {ok:false,reason:"BAD_GUESS"};
172:     if(record.winner)return {ok:false,reason:"ROUND_OVER"};
173:     const startMs=igStartMs(record);
174:     if(startMs===null)return {ok:false,reason:"NOT_STARTED"};
175:     if(record.chipsUsed[role]>=CHIPS)return {ok:false,reason:"NO_CHIPS"};
176:     const at=igBeatAt(startMs,atMs);
177:     if(at.phase==="waiting")return {ok:false,reason:"NOT_STARTED"};
178:     if(at.phase==="over")return {ok:false,reason:"ROUND_OVER"};
179:     const chipsUsed=Object.freeze({...record.chipsUsed,[role]:record.chipsUsed[role]+1});
180:     const winner=correct?Object.freeze({role,beat:at.beat,atMs}):null;
181:     return {ok:true,correct,record:Object.freeze({...record,chipsUsed,winner})};
182:   }
183:   // The Showdown points this round gives each manager: 4, 3, 2 or 1 to the winner by the stage of the winning write, 0
184:   // otherwise (nothing until the round is over). The points always come from the record, never from a typed value.
185:   function igPoints(record){
186:     if(!igValid(record)||!record.winner)return Object.freeze({playerOne:0,playerTwo:0});
187:     const points=igStagePoints(record.winner.beat);
188:     return Object.freeze({playerOne:record.winner.role==="playerOne"?points:0,playerTwo:record.winner.role==="playerTwo"?points:0});
189:   }
190: 
191:   return Object.freeze({
192:     contractVersion:1,feature:"cms-icon-guess",roles:ROLES,stats:STATS,maxSeasons:MAX_SEASONS,chips:CHIPS,
193:     beats:BEATS,lastBeat:LAST_BEAT,stagePoints:STAGE_POINTS,maxPoints:MAX_POINTS,stages:STAGES,stageStarts:STAGE_STARTS,roundMs:ROUND_MS,leadMs:LEAD_MS,
194:     eligible:igEligible,order:igOrder,statOrder:igStatOrder,draw:igDraw,
195:     endsAt:igEndsAt,drawSlackMs:DRAW_SLACK_MS,beatAt:igBeatAt,revealed:igRevealed,stagePointsAt:igStagePoints,
196:     validRecord:igValid,startMs:igStartMs,outcome:igOutcome,applyGuess:igApplyGuess,points:igPoints
197:   });
198: });
199: 
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

(End of packet FJ1. Answer with the report only.)
