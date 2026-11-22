# Fable 5.2 red-team job FJ13: League Roulette: four balls, one league

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
Then one block per finding: ID (FJ13-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. New in r98: the league is chosen on a 3D roulette. Daniel drops ball 1 (this also commits the league from the shared draw), then Nik ball 2, Daniel ball 3, Nik ball 4; each ball removes one of the 5 leagues; clubs (Ball Game) may start only after ball 4. Can a ball be dropped twice, out of turn, by the wrong manager, or skipped? Cover a double tap, a retry after a network error, and both phones tapping at the same instant.
2. Can the two phones ever show different eliminated leagues, a different order, or a different final league? Is the final league always the one the shared draw gives, after reload and late join?
3. Reload, kill the tab or go offline between any two balls: does each phone land on the right ball with the right leagues already removed, and can play always continue?
4. Can the Rules refuse a normal drop or clubs step (permission-denied), accept a drop count that is wrong (for example jumping from 1 to 3, or going backwards), or let clubs start before 4 balls? Do older Setups (draw 1, 2 or 3 without the roulette) still work unchanged?
5. Any normal path here that costs extra Firestore reads beyond 3 small writes per Showdown (give the count)?

## Known (do not report)
When WebGL is missing, the old 2D wheel is shown instead of the 3D board (by design). The look of the board is out of scope.

## Files

## FILE: js/leagueRouletteStep.js (170 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   root.CareerModeLeagueRouletteStep=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7:   // R98-01 League Roulette on the live Select League screen (Nik 2026-11-20, option A).
8:   //
9:   // The shared setup decides everything: the league (commit-league, Daniel's first ball) and how many of the four balls
10:   // have dropped (the ledger's `drops`, each ball written by the manager whose turn it is). This module only shows it:
11:   //   - the 3D roulette (js/leagueRouletteScene3d.js) stands on the counter where the 2D wheel stood, in #leagueWheel;
12:   //   - lrsSync({seed, winner, drops}) moves the board to the ledger: a ball the ledger gained while the screen is up rolls,
13:   //     a ball dropped before the screen opened (a reload, a late join, coming back from Home) is shown at once and never
14:   //     rolls again;
15:   //   - Reus Gate: while armed, css/v10 holds Select League (js/v10Setup.js asks lrsHolding()) until the board has drawn its
16:   //     first frame; where 3D cannot run (no WebGL, a crash) the screen opens on the plain wheel and the text steps.
17:   // No Firestore here: no read, no write, no listener.
18:   const SCREEN_ID="leagueWheelScreen";
19:   const SCENE=Object.freeze(["league-roulette-3d","js/leagueRouletteScene3d.js",()=>Boolean(root.CareerModeLeagueRoulette3d)]);
20:   const STYLE_ID="leagueRouletteStepStyle";
21:   // The bowl's rim is as wide as the 2D wheel was (--lr-scale of it; wider on a phone, where the counter has the room),
22:   // and the bowl's foot sits where the wheel's bottom edge was (--lr-lift keeps it clear of the buttons on a wide screen and
23:   // under the counter lip, below the heroes' hands, on a phone), so js/v10Setup.js still lays the counter lip under it.
24:   // Scene geometry (js/leagueRouletteScene3d.js): rim width .917 of the host, foot at .91 of the host.
25:   const CSS=`
26: #leagueWheel.lr3d-on{--lr-scale:1;background:none!important;border-color:transparent!important;box-shadow:none!important;overflow:visible!important}
27: #leagueWheel.lr3d-on::before,#leagueWheel.lr3d-on::after{display:none!important}
28: #leagueWheel.lr3d-on>:not(.lr3dHost),#leagueWheelScreen.lr3d-on .wheelPointer{visibility:hidden!important}
29: #leagueWheel>.lr3dHost{position:absolute;z-index:1;pointer-events:none;
30:   width:calc(100% * var(--lr-scale,1) / .917);height:calc(100% * var(--lr-scale,1) / .917);
31:   left:calc(50% - 50% * var(--lr-scale,1) / .917);top:calc(100% - 91% * var(--lr-scale,1) / .917 - var(--lr-lift,0px))}
32: #leagueWheel.lr3d-on{--lr-lift:14px}
33: @media (max-width:700px) and (orientation:portrait){#leagueWheel.lr3d-on{--lr-scale:1.3;--lr-lift:-14px}}
34: `;
35:   let armed=false,failed=false,scene=null,host=null,mountPromise=null,generation=0,playing=null,planKey="",screenObserver=null;
36:   let target={seed:"",winner:null,drops:0,instant:false};
37:   // The board mounts on the ledger as the screen first renders it (never on a guess), so a ball dropped before the screen
38:   // opened is shown at once instead of rolling again.
39:   let synced=null,markSynced=()=>{};
40:   function lrsFreshSync(){synced=new Promise(resolve=>{markSynced=resolve;});}
41:   lrsFreshSync();
42:   const listeners=new Set();
43: 
44:   function lrsEmit(type,data){for(const fn of [...listeners]){try{fn(type,data||{});}catch(_error){}}}
45:   function lrsDoc(){return root.document||null;}
46:   function lrsById(id){const d=lrsDoc();return d&&typeof d.getElementById==="function"?d.getElementById(id):null;}
47:   function lrsAlive(){return Boolean(scene&&scene.alive);}
48:   function lrsShown(){const el=lrsById(SCREEN_ID);return Boolean(el&&!el.classList.contains("hidden"));}
49:   function lrsStyle(){
50:     const d=lrsDoc();if(!d||lrsById(STYLE_ID))return;
51:     const el=d.createElement("style");el.id=STYLE_ID;el.textContent=CSS;(d.head||d.documentElement).appendChild(el);
52:   }
53:   async function lrsLoad(){
54:     const [key,path,ready]=SCENE;if(ready())return true;
55:     if(typeof root.loadRuntimeScript!=="function")return false;
56:     await root.loadRuntimeScript(key,path,ready);return ready();
57:   }
58:   // The held screen opens: js/v10Screens.js draws it now that frame() no longer answers HOLD.
59:   function lrsRelease(){try{const screens=root.CareerModeV10Screens;if(screens&&typeof screens.show==="function")void screens.show(SCREEN_ID).catch(()=>{});}catch(_error){}}
60:   function lrsSetOn(on){
61:     const wheel=lrsById("leagueWheel"),screen=lrsById(SCREEN_ID);
62:     if(wheel)wheel.classList.toggle("lr3d-on",on);if(screen)screen.classList.toggle("lr3d-on",on);
63:   }
64:   function lrsTeardown(){
65:     generation+=1;
66:     const was=scene;scene=null;mountPromise=null;playing=null;planKey="";
67:     if(was){try{was.dispose();}catch(_error){}}
68:     if(host){host.remove();host=null;}
69:     lrsSetOn(false);
70:   }
71:   // Leaving Select League frees the board (its GPU memory counts against the iPhone budget); coming back mounts it again
72:   // on the ledger as it stands.
73:   function lrsWatchScreen(){
74:     if(screenObserver||typeof root.MutationObserver!=="function")return;
75:     const screen=lrsById(SCREEN_ID);if(!screen)return;
76:     screenObserver=new root.MutationObserver(()=>{if(!lrsShown()&&(scene||mountPromise))lrsTeardown();});
77:     screenObserver.observe(screen,{attributes:true,attributeFilter:["class"]});
78:   }
79: 
80:   function lrsArm(on){
81:     if(!on){lrsTeardown();failed=false;target={seed:"",winner:null,drops:0,instant:false};lrsFreshSync();}
82:     armed=Boolean(on);
83:     return armed;
84:   }
85:   // js/v10Setup.js: hold Select League (the loading screen stays) while the armed board is not drawn yet.
86:   function lrsHolding(){return armed&&!failed&&!lrsAlive();}
87: 
88:   function lrsEnsure(){
89:     if(!armed||failed)return Promise.resolve(null);
90:     const wheel=lrsById("leagueWheel");if(!wheel)return Promise.resolve(null);
91:     if(lrsAlive()&&host&&host.parentNode===wheel)return Promise.resolve(scene);
92:     if(mountPromise)return mountPromise;
93:     lrsTeardown();
94:     const gen=generation;
95:     lrsStyle();lrsWatchScreen();
96:     const box=lrsDoc().createElement("div");box.className="lr3dHost";box.setAttribute("aria-hidden","true");
97:     host=box;wheel.classList.add("lr3d-on");wheel.appendChild(box);
98:     const run=(async()=>{
99:       let made=null;
100:       try{
101:         if(await lrsLoad()){
102:           await synced;if(gen!==generation||!armed)return null;
103:           const R=root.CareerModeLeagueRoulette3d,first=target;
104:           made=await R.mount(box,{seed:first.seed,winner:first.winner||undefined,stage:first.winner?first.drops:0});
105:           if(made&&first.winner)planKey=`${first.seed}|${first.winner}`;
106:         }
107:       }catch(_error){made=null;}
108:       if(gen!==generation||!armed){if(made){try{made.dispose();}catch(_error){}}return null;}
109:       if(!made){failed=true;box.remove();if(host===box)host=null;lrsSetOn(false);lrsRelease();lrsEmit("failed");return null;}
110:       scene=made;lrsSetOn(true);
111:       made.on((type,data)=>lrsEmit(type,data));
112:       lrsRelease();lrsEmit("ready",{stage:made.stage});
113:       void lrsCatchUp();
114:       return made;
115:     })();
116:     mountPromise=run;
117:     run.finally(()=>{if(mountPromise===run)mountPromise=null;});
118:     return run;
119:   }
120: 
121:   // The board follows the ledger. instant: show it as it stands (a Showdown opened before the roulette).
122:   function lrsSync(next){
123:     const drops=Math.max(0,Math.min(4,Number(next&&next.drops)|0));
124:     target={seed:String(next&&next.seed||""),winner:next&&next.winner||null,drops,instant:Boolean(next&&next.instant)};
125:     markSynced();
126:     if(lrsAlive())void lrsCatchUp();
127:   }
128:   // Something for the board to do: a plan to take (before the first ball) or a ball the ledger holds that it has not shown.
129:   function lrsBehind(){
130:     if(!lrsAlive()||!target.winner)return false;
131:     return planKey!==`${target.seed}|${target.winner}`||scene.stage<target.drops;
132:   }
133:   // "settled" is told only after the board has shown something, so a screen that answers it by syncing again (the
134:   // presentation re-renders on every event) never loops; and the run is the playback guard before any event goes out.
135:   function lrsCatchUp(){
136:     if(playing)return playing;
137:     if(!lrsBehind())return Promise.resolve();
138:     let shown=false;
139:     const run=(async()=>{
140:       await null;
141:       for(let guard=0;guard<8&&lrsAlive();guard+=1){
142:         const s=scene;
143:         if(!target.winner)return;
144:         const key=`${target.seed}|${target.winner}`;
145:         if(planKey!==key){if(s.stage!==0||s.busy||!s.setPlan(target.seed,target.winner))return;planKey=key;}
146:         if(s.stage>=target.drops)return;
147:         shown=true;
148:         if(target.instant){s.showStage(target.drops);lrsEmit("merged",{stage:s.stage});return;}
149:         const index=s.stage;lrsEmit("rolling",{index});
150:         await s.drop(index);
151:         if(scene!==s)return;
152:       }
153:     })();
154:     playing=run;
155:     run.catch(()=>{}).finally(()=>{if(playing===run)playing=null;if(shown)lrsEmit("settled",{stage:lrsStage()});});
156:     return run;
157:   }
158: 
159:   function lrsStage(){return lrsAlive()?scene.stage:0;}
160:   function lrsBusy(){return Boolean(playing)||Boolean(lrsAlive()&&scene.busy);}
161:   // Every ball the ledger holds has been shown (or there is no board to show it on).
162:   function lrsCaughtUp(){return failed||!armed||(lrsAlive()&&!lrsBusy()&&scene.stage>=target.drops);}
163:   // The league name for a ball already rested (the plan both phones share), for the screen's words.
164:   function lrsLeagueOut(index){const p=lrsAlive()?scene.plan:null;return p&&p.drops[index]?p.drops[index].league:null;}
165:   function lrsOn(fn){listeners.add(fn);return()=>listeners.delete(fn);}
166: 
167:   return Object.freeze({contractVersion:1,feature:"cms-league-roulette-step",screenId:SCREEN_ID,
168:     arm:lrsArm,armed:()=>armed,holding:lrsHolding,ensure:lrsEnsure,sync:lrsSync,stage:lrsStage,busy:lrsBusy,caughtUp:lrsCaughtUp,leagueOut:lrsLeagueOut,failed:()=>failed,on:lrsOn,dispose:lrsTeardown});
169: });
170: 
```

## FILE: js/sparkSharedShowdownSetup.js (353 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeSparkSharedShowdownSetup=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   function ssrpProtocolModule(){return typeof require==="function"?require("./sharedShowdownSetup.js"):root.CareerModeSharedShowdownSetup;}
9:   function ssrpCatalogModule(){return typeof require==="function"?require("./sharedShowdownCatalog.js"):root.CareerModeSharedShowdownCatalog;}
10:   const ROLES=Object.freeze(["playerOne","playerTwo"]);
11:   const TYPES=Object.freeze(["open","commit-league","commit-clubs","commit-length","confirm","confirm"]);
12:   const PHASES=Object.freeze(["SHARED_SETUP_OPEN","LEAGUE_WHEEL_COMMITTED","CLUB_ASSIGNMENTS_COMMITTED","SEASON_LENGTH_COMMITTED","SHOWDOWN_CONFIRMED"]);
13:   const LENGTHS=Object.freeze([1,3,5,10]);
14:   const ROULETTE_BALLS=4;
15:   const CANONICAL_KEYS=Object.freeze([
16:     "careerModeShowdown.saveLibrary",
17:     "careerModeShowdown.legacyShowdowns",
18:     "careerModeShowdown.preferences"
19:   ]);
20:   const LEDGER_KEYS=Object.freeze([
21:     "schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole",
22:     "operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons",
23:     "confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"
24:   ]);
25: 
26:   function ssrpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
27:   function resultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SETUP_PROVIDER_FAILED"});}
28:   function ssrpExact(value,keys){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
29:   function ssrpNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))ssrpFail("SETUP_RIVALRY_INVALID");return id;}
30:   function ssrpNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))ssrpFail("SETUP_SESSION_INVALID");return id;}
31:   function ssrpNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))ssrpFail("SETUP_DEVICE_INACTIVE");return id;}
32:   function normalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!/^setup_op_[0-9a-f]{32}$/.test(id))ssrpFail("SETUP_COMMAND_INVALID");return id;}
33:   function accountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)ssrpFail("SETUP_AUTH_REQUIRED");return id;}
34:   function ssrpTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
35:   function ssrpSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
36:   function nowEpochMs(value){const result=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(result)||result<0)ssrpFail("SETUP_CLOCK_INVALID");return result;}
37:   function ssrpValidateSdk(firestore,sdk){
38:     if(!firestore)ssrpFail("SETUP_PROVIDER_UNAVAILABLE");
39:     for(const name of ["doc","runTransaction"]){if(!sdk||typeof sdk[name]!=="function")ssrpFail("SETUP_PROVIDER_UNAVAILABLE");}
40:     if(typeof sdk.serverTimestamp!=="function"&&(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function"))ssrpFail("SETUP_PROVIDER_UNAVAILABLE");
41:   }
42:   async function createCanonicalProtocol(cryptoImpl){
43:     const protocolModule=ssrpProtocolModule(),catalogModule=ssrpCatalogModule();
44:     if(!protocolModule||typeof protocolModule.createProtocol!=="function"||!catalogModule||catalogModule.version!=="shared-showdown-catalog-v1"||!catalogModule.catalog)ssrpFail("SETUP_PROVIDER_UNAVAILABLE");
45:     return protocolModule.createProtocol({catalog:catalogModule.catalog,cryptoImpl});
46:   }
47:   function updatedAt(sdk,epochMs){return typeof sdk.serverTimestamp==="function"?sdk.serverTimestamp():sdk.Timestamp.fromMillis(epochMs);}
48:   function assertAccount(value,id){
49:     if(!value||value.objectType!=="account"||value.objectId!==id||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")ssrpFail("SETUP_MANAGER_INACTIVE");
50:     return value;
51:   }
52:   function assertDevice(value,id){
53:     if(!value||value.objectType!=="device"||value.objectId!==id||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==id||value.data.state!=="active")ssrpFail("SETUP_DEVICE_INACTIVE");
54:     return value;
55:   }
56:   function assertRivalry(value,rivalryId,uid){
57:     if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")ssrpFail("SETUP_RIVALRY_INACTIVE");
58:     const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[];
59:     const authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
60:     if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)ssrpFail("SETUP_TWO_MANAGERS_REQUIRED");
61:     const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
62:     if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string"||!/^profile_[0-9a-f]{24}$/.test(item.profileId||"")||!/^save_[0-9a-f]{24}$/.test(item.saveId||"")))ssrpFail("SETUP_BINDING_INVALID");
63:     if(ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId))||!authorized.every(id=>ordered.some(item=>item.accountId===id)))ssrpFail("SETUP_TWO_MANAGERS_REQUIRED");
64:     const actor=ordered.find(item=>item.accountId===uid);
65:     if(!actor)ssrpFail("SETUP_ACTOR_NOT_ENTITLED");
66:     return Object.freeze({slots:ordered,authorized,actor});
67:   }
68:   function assertSession(value,rivalryId,sessionId,authorized,epochMs){
69:     if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)ssrpFail("SETUP_SESSION_INVALID");
70:     const data=value.data;
71:     const members=Array.isArray(data.memberAccountIds)?data.memberAccountIds:[];
72:     const expiresAt=ssrpTimestampMillis(data.expiresAt);
73:     if(data.rivalryId!==rivalryId||data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id)))ssrpFail("SETUP_ACTIVE_SESSION_REQUIRED");
74:     if(!Number.isFinite(expiresAt))ssrpFail("SETUP_ACTIVE_SESSION_REQUIRED");
75:     if(!authorized.includes(data.hostAccountId))ssrpFail("SETUP_SESSION_MEMBERS_MISMATCH");
76:     return Object.freeze({sessionId,data,expiresAt});
77:   }
78:   function expectedPhase(revision){return revision<=1?PHASES[0]:revision===2?PHASES[1]:revision===3?PHASES[2]:revision<=5?PHASES[3]:PHASES[4];}
79:   // R94-02: a draw 2 setup also stores `stops` (one integer 0..359 per confirmed manager); older setups keep the
80:   // exact 15 keys. The protocol module owns both key lists.
81:   function ledgerKeyList(value){const module=ssrpProtocolModule();return module&&typeof module.ledgerKeys==="function"?module.ledgerKeys(value):LEDGER_KEYS;}
82:   function assertLedger(value,rivalryId){
83:     const module=ssrpProtocolModule();
84:     if(!ssrpExact(value,ledgerKeyList(value))||(module&&typeof module.ledgerStopsValid==="function"&&!module.ledgerStopsValid(value))||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||!Number.isInteger(value.revision)||value.revision<1||value.revision>6||!ROLES.includes(value.coordinatorRole)||value.phase!==expectedPhase(value.revision))ssrpFail("SETUP_PROVIDER_STATE_INVALID");
85:     for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)ssrpFail("SETUP_PROVIDER_STATE_INVALID");}
86:     if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!/^setup_op_[0-9a-f]{32}$/.test(id)))ssrpFail("SETUP_PROVIDER_STATE_INVALID");
87:     if(value.operationTypes.some((type,index)=>type!==TYPES[index])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))ssrpFail("SETUP_PROVIDER_STATE_INVALID");
88:     if(value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))ssrpFail("SETUP_PROVIDER_STATE_INVALID");
89:     if(value.revision<4?value.totalSeasons!==null:!LENGTHS.includes(value.totalSeasons))ssrpFail("SETUP_PROVIDER_STATE_INVALID");
90:     const confirmations=value.revision<=4?[]:value.actorRoles.slice(4);
91:     if(!Array.isArray(value.confirmedRoles)||JSON.stringify(value.confirmedRoles)!==JSON.stringify(confirmations)||new Set(confirmations).size!==confirmations.length)ssrpFail("SETUP_PROVIDER_STATE_INVALID");
92:     if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))ssrpFail("SETUP_PROVIDER_STATE_INVALID");
93:     return value;
94:   }
95:   function roleSnapshot(item){return {slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"};}
96:   function authority({rivalryId,rivalry,session,role,deviceId,epochMs,hostRole}){
97:     const slot=rivalry.slots.find(item=>item.slotId===role);
98:     const host=rivalry.slots.find(item=>item.slotId===hostRole);
99:     if(!slot||!host)ssrpFail("SETUP_SESSION_MEMBERS_MISMATCH");
100:     return {
101:       rivalryId,
102:       connectionState:"active",
103:       managerSlots:rivalry.slots.map(roleSnapshot),
104:       actor:{accountId:slot.accountId,deviceId,deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},
105:       session:{sessionId:session.sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Math.max(epochMs+1,session.expiresAt)},
106:       nowEpochMs:epochMs
107:     };
108:   }
109:   function syntheticSession(rivalryId,rivalry,coordinatorRole,sessionId){
110:     const host=rivalry.slots.find(item=>item.slotId===coordinatorRole);
111:     if(!host)ssrpFail("SETUP_PROVIDER_STATE_INVALID");
112:     return Object.freeze({sessionId,data:{rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized]},expiresAt:2});
113:   }
114:   async function rebuild(protocol,ledger,rivalry,rivalryId,cryptoImpl){
115:     if(!ledger)return null;
116:     assertLedger(ledger,rivalryId);
117:     const session=syntheticSession(rivalryId,rivalry,ledger.coordinatorRole,ledger.activeSessionId);
118:     let state=null;
119:     for(let index=0;index<ledger.revision;index++){
120:       const role=ledger.actorRoles[index];
121:       const auth=authority({rivalryId,rivalry,session,role,deviceId:"device_"+"0".repeat(32),epochMs:0,hostRole:ledger.coordinatorRole});
122:       const command=await protocol.ledgerCommand({state,ledger,index});
123:       const applied=await protocol.apply({state,authority:auth,command});
124:       if(!applied.ok)ssrpFail("SETUP_PROVIDER_STATE_INVALID");
125:       state=applied.state;
126:     }
127:     return state;
128:   }
129:   function ledgerFrom({prior,nextState,rivalryId,operationId,type,baseRevision,actorRole,totalSeasons,stop,draw,roulette,sessionId,deviceId,updatedAtValue}){
130:     const operationIds=prior?[...prior.operationIds,operationId]:[operationId];
131:     const operationTypes=prior?[...prior.operationTypes,type]:[type];
132:     const baseRevisions=prior?[...prior.baseRevisions,baseRevision]:[baseRevision];
133:     const actorRoles=prior?[...prior.actorRoles,actorRole]:[actorRole];
134:     const resolvedSeasons=type==="commit-length"?totalSeasons:(prior?prior.totalSeasons:null);
135:     const confirmedRoles=actorRoles.slice(4);
136:     const ledger={
137:       schemaVersion:1,
138:       objectType:"sharedSetupLedger",
139:       rivalryId,
140:       revision:nextState.revision,
141:       phase:nextState.phase,
142:       coordinatorRole:nextState.coordinatorRole,
143:       operationIds,
144:       operationTypes,
145:       baseRevisions,
146:       actorRoles,
147:       totalSeasons:resolvedSeasons,
148:       confirmedRoles,
149:       activeSessionId:sessionId,
150:       updatedAt:updatedAtValue,
151:       updatedByDeviceId:deviceId
152:     };
153:     // R94-02 draw 2: `stops` exists from open on and gains this manager's stop on his confirm.
154:     if(prior?Object.hasOwn(prior,"stops"):draw===2||draw===3)ledger.stops=prior?(type==="confirm"?[...prior.stops,stop]:[...prior.stops]):[];
155:     // R95-01 draw 3 (six clubs per ball): `draw: 3` is written at open beside `stops` and copied unchanged after.
156:     if(prior?Object.hasOwn(prior,"draw"):draw===3)ledger.draw=3;
157:     // R98-01 League Roulette: `drops` is 0 at open, 1 with commit-league (the coordinator's first ball draws the league),
158:     // then only drop() moves it; every later step copies it.
159:     if(prior?Object.hasOwn(prior,"drops"):roulette===true&&draw===3)ledger.drops=prior?(type==="commit-league"?1:prior.drops):0;
160:     return ledger;
161:   }
162:   // The balls dropped so far on a roulette ledger; null on every other ledger.
163:   function ledgerDrops(ledger){return ledger&&Object.hasOwn(ledger,"drops")&&Number.isInteger(ledger.drops)?ledger.drops:null;}
164:   async function authorityContext(options,transaction){
165:     const uid=accountId(options.user);
166:     const rivalryId=ssrpNormalizeRivalryId(options.rivalryId);
167:     const sessionId=ssrpNormalizeSessionId(options.sessionId);
168:     const deviceId=ssrpNormalizeDeviceId(options.deviceId);
169:     const epochMs=nowEpochMs(options.nowEpochMs);
170:     ssrpValidateSdk(options.firestore,options.firebaseSdk);
171:     const sdk=options.firebaseSdk;
172:     const db=options.firestore;
173:     const refs={
174:       account:sdk.doc(db,"accounts",uid),
175:       device:sdk.doc(db,"accounts",uid,"devices",deviceId),
176:       rivalry:sdk.doc(db,"rivalries",rivalryId),
177:       session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),
178:       setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative")
179:     };
180:     assertAccount(ssrpSnapshot(await transaction.get(refs.account)),uid);
181:     assertDevice(ssrpSnapshot(await transaction.get(refs.device)),deviceId);
182:     const rivalry=assertRivalry(ssrpSnapshot(await transaction.get(refs.rivalry)),rivalryId,uid);
183:     const session=assertSession(ssrpSnapshot(await transaction.get(refs.session)),rivalryId,sessionId,rivalry.authorized,epochMs);
184:     return Object.freeze({uid,rivalryId,sessionId,deviceId,epochMs,rivalry,session,refs});
185:   }
186:   async function context(options,transaction){
187:     const ctx=await authorityContext(options,transaction);
188:     const setupValue=ssrpSnapshot(await transaction.get(ctx.refs.setup));
189:     const ledger=setupValue?assertLedger(setupValue,ctx.rivalryId):null;
190:     return Object.freeze({...ctx,ledger});
191:   }
192:   async function readWriteAuthority(options){
193:     // The app SDK exposes no getDoc. End this read-only preflight before commit
194:     // so authority reads cannot become verify writes in the ledger's request.
195:     // The unchanged Rules independently recheck authority when the ledger writes.
196:     const done={};
197:     try{
198:       await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
199:         done.context=await authorityContext(options,transaction);
200:         throw done;
201:       });
202:     }catch(error){if(error!==done)throw error;}
203:     return done.context;
204:   }
205:   async function mutate(options={}){
206:     try{
207:       const operationId=normalizeOperationId(options.operationId);
208:       const type=String(options.type||"");
209:       if(!["open","commit-league","commit-clubs","commit-length","confirm"].includes(type))ssrpFail("SETUP_COMMAND_INVALID");
210:       const baseRevision=Number(options.baseRevision);
211:       if(!Number.isInteger(baseRevision)||baseRevision<0)ssrpFail("SETUP_COMMAND_INVALID");
212:       if(type==="commit-length"&&!LENGTHS.includes(options.totalSeasons))ssrpFail("SETUP_LENGTH_INVALID");
213:       // R94-02: open may ask for draw 2 (R95-01: or draw 3, six clubs per ball); a draw confirm carries the manager's stop
214:       // (0..359), fixed at his tap.
215:       const draw=options.draw===undefined?null:options.draw;
216:       if(draw!==null&&(type!=="open"||(draw!==2&&draw!==3)))ssrpFail("SETUP_COMMAND_INVALID");
217:       // R98-01: open may ask for the League Roulette (draw 3 only): the ledger then carries `drops`.
218:       const roulette=options.roulette===true;
219:       if(options.roulette!==undefined&&options.roulette!==false&&!(roulette&&type==="open"&&draw===3))ssrpFail("SETUP_COMMAND_INVALID");
220:       const hasStop=options.stop!==undefined&&options.stop!==null;
221:       if(hasStop&&(type!=="confirm"||!Number.isInteger(options.stop)||options.stop<0||options.stop>=360))ssrpFail("SETUP_STOP_INVALID");
222:       ssrpValidateSdk(options.firestore,options.firebaseSdk);
223:       const cryptoImpl=options.cryptoImpl||root.crypto;
224:       const protocol=await createCanonicalProtocol(cryptoImpl);
225:       const validated=await readWriteAuthority(options);
226:       return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
227:         const ctx=validated;
228:         const setupValue=ssrpSnapshot(await transaction.get(ctx.refs.setup));
229:         const prior=setupValue?assertLedger(setupValue,ctx.rivalryId):null;
230:         const priorState=await rebuild(protocol,prior,ctx.rivalry,ctx.rivalryId,cryptoImpl);
231:         const actorRole=ctx.rivalry.actor.slotId;
232:         if(prior){
233:           const existing=prior.operationIds.indexOf(operationId);
234:           if(existing!==-1){
235:             const same=prior.operationTypes[existing]===type
236:               && prior.baseRevisions[existing]===baseRevision
237:               && prior.actorRoles[existing]===actorRole
238:               && (type!=="commit-length"||prior.totalSeasons===options.totalSeasons)
239:               && (type!=="confirm"||(Object.hasOwn(prior,"stops")?hasStop&&prior.stops[existing-4]===options.stop:!hasStop))
240:               && (type!=="open"||(Object.hasOwn(prior,"stops")?(Object.hasOwn(prior,"draw")?3:2):null)===draw)
241:               && (type!=="open"||Object.hasOwn(prior,"drops")===roulette);
242:             if(!same)ssrpFail("SETUP_IDEMPOTENCY_CONFLICT");
243:             return Object.freeze({ok:true,status:"replayed",replayed:true,revision:prior.revision,state:priorState,drops:ledgerDrops(prior)});
244:           }
245:         }
246:         if(baseRevision!==(prior?prior.revision:0))ssrpFail("SETUP_STALE_BASE_REVISION");
247:         // R98-01: the clubs are drawn only once all four roulette balls have dropped.
248:         if(type==="commit-clubs"&&prior&&Object.hasOwn(prior,"drops")&&prior.drops!==ROULETTE_BALLS)ssrpFail("SETUP_ROULETTE_UNFINISHED");
249:         const host=ctx.rivalry.slots.find(item=>item.accountId===ctx.session.data.hostAccountId);
250:         if(!host)ssrpFail("SETUP_SESSION_MEMBERS_MISMATCH");
251:         const auth=authority({rivalryId:ctx.rivalryId,rivalry:ctx.rivalry,session:ctx.session,role:actorRole,deviceId:ctx.deviceId,epochMs:ctx.epochMs,hostRole:host.slotId});
252:         let command;
253:         if(type==="commit-league"||type==="commit-clubs")command=await protocol.prepareDraw({state:priorState,type,operationId});
254:         else if(type==="commit-length")command={type,operationId,baseRevision,totalSeasons:options.totalSeasons};
255:         else if(type==="confirm")command={type,operationId,baseRevision,setupHash:await protocol.confirmationHash(priorState),...(hasStop?{stop:options.stop}:{})};
256:         else command={type,operationId,baseRevision,...(draw===2||draw===3?{draw}:{})};
257:         const applied=await protocol.apply({state:priorState,authority:auth,command});
258:         if(!applied.ok)ssrpFail(applied.code);
259:         const next=ledgerFrom({
260:           prior,
261:           nextState:applied.state,
262:           rivalryId:ctx.rivalryId,
263:           operationId,
264:           type,
265:           baseRevision,
266:           actorRole,
267:           totalSeasons:options.totalSeasons,
268:           stop:hasStop?options.stop:null,
269:           draw,
270:           roulette,
271:           sessionId:ctx.sessionId,
272:           deviceId:ctx.deviceId,
273:           updatedAtValue:updatedAt(options.firebaseSdk,ctx.epochMs)
274:         });
275:         transaction.set(ctx.refs.setup,next);
276:         return Object.freeze({ok:true,status:"accepted",replayed:false,revision:applied.state.revision,state:applied.state,drops:ledgerDrops(next)});
277:       });
278:     }catch(error){return resultError(error);}
279:   }
280:   // R98-01 League Roulette: ball `ball` (2..4; ball 1 is commit-league) dropped by the manager whose turn it is. One small
281:   // write and no read: a plain update of `drops` (plus the stamp every ledger write carries); the Rules check the turn, the
282:   // count and the authority. Only when that update is refused does one transaction read the ledger, to tell a drop that
283:   // already landed (a double tap, a retry, a second tab: "replayed") from one that may not happen (not his turn, not open).
284:   // A ball never drops twice: the Rules take drops only from ball - 1 to ball.
285:   async function ssrpUpdateApi(sdk){
286:     if(typeof sdk.updateDoc==="function")return sdk;
287:     const meter=root.CareerModeFirestoreBudget?.meterSdk||(value=>value);
288:     const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
289:     if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
290:     try{const module=await import(url);return module&&typeof module.updateDoc==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
291:   }
292:   async function drop(options={}){
293:     try{
294:       const ball=options.ball;
295:       if(!Number.isInteger(ball)||ball<2||ball>ROULETTE_BALLS)ssrpFail("SETUP_ROULETTE_BALL_INVALID");
296:       if(!ROLES.includes(options.managerRole))ssrpFail("SETUP_ROULETTE_ROLE_INVALID");
297:       ssrpValidateSdk(options.firestore,options.firebaseSdk);
298:       accountId(options.user);
299:       const rivalryId=ssrpNormalizeRivalryId(options.rivalryId),sessionId=ssrpNormalizeSessionId(options.sessionId),deviceId=ssrpNormalizeDeviceId(options.deviceId);
300:       const epochMs=nowEpochMs(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore,protocol=ssrpProtocolModule();
301:       const fields=()=>({drops:ball,updatedAt:updatedAt(sdk,epochMs),updatedByDeviceId:deviceId,activeSessionId:sessionId});
302:       const known=options.known;
303:       // The plain update, only when the ledger this phone holds says it is this manager's ball now.
304:       if(known&&known.drops===ball-1&&known.revision===2&&protocol.rouletteDropRole(known.coordinatorRole,ball)===options.managerRole){
305:         const api=await ssrpUpdateApi(sdk);
306:         if(api){
307:           try{await api.updateDoc(api.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),fields());return Object.freeze({ok:true,status:"accepted",replayed:false,drops:ball});}
308:           catch(error){if(!/permission/i.test(String(error&&error.code||error&&error.message||"")))throw error;}
309:         }
310:       }
311:       const ref=sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative");
312:       return await sdk.runTransaction(db,async transaction=>{
313:         const value=ssrpSnapshot(await transaction.get(ref));
314:         const ledger=value?assertLedger(value,rivalryId):null;
315:         if(!ledger||!Object.hasOwn(ledger,"drops"))ssrpFail("SETUP_ROULETTE_NOT_OPEN");
316:         if(ledger.drops>=ball)return Object.freeze({ok:true,status:"replayed",replayed:true,drops:ledger.drops});
317:         if(ledger.revision!==2||ledger.drops!==ball-1)ssrpFail("SETUP_ROULETTE_NOT_OPEN");
318:         if(protocol.rouletteDropRole(ledger.coordinatorRole,ball)!==options.managerRole)ssrpFail("SETUP_ROULETTE_NOT_YOUR_BALL");
319:         transaction.update(ref,fields());
320:         return Object.freeze({ok:true,status:"accepted",replayed:false,drops:ball});
321:       });
322:     }catch(error){return resultError(error);}
323:   }
324:   async function read(options={}){
325:     try{
326:       ssrpValidateSdk(options.firestore,options.firebaseSdk);
327:       const cryptoImpl=options.cryptoImpl||root.crypto;
328:       const protocol=await createCanonicalProtocol(cryptoImpl);
329:       return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
330:         const ctx=await context(options,transaction);
331:         if(!ctx.ledger)return Object.freeze({ok:true,status:"empty",revision:0,state:null});
332:         const state=await rebuild(protocol,ctx.ledger,ctx.rivalry,ctx.rivalryId,cryptoImpl);
333:         const updatedAtMs=ssrpTimestampMillis(ctx.ledger.updatedAt);
334:         return Object.freeze({ok:true,status:"live",revision:ctx.ledger.revision,state,updatedAtMs:Number.isFinite(updatedAtMs)?updatedAtMs:null,drops:ledgerDrops(ctx.ledger)});
335:       });
336:     }catch(error){return resultError(error);}
337:   }
338: 
339:   return Object.freeze({
340:     contractVersion:1,
341:     implementationState:"candidate-spark-exact-path",
342:     productionEnabled:false,
343:     billingRequired:false,
344:     canonicalStorageMutation:false,
345:     canonicalStorageKeys:CANONICAL_KEYS,
346:     catalogVersion:(()=>{const catalog=ssrpCatalogModule();return catalog&&catalog.version||null;})(),
347:     setupPath:"rivalries/{rivalryId}/sharedSetup/authoritative",
348:     mutate,
349:     drop,
350:     read
351:   });
352: });
353: 
```

## FILE: js/sharedShowdownSetup.js (399 lines)
```javascript
1: (function(root, factory){
2:   const api = factory(root);
3:   if(typeof module !== "undefined" && module.exports) module.exports = api;
4:   else root.CareerModeSharedShowdownSetup = api;
5: })(typeof globalThis !== "undefined" ? globalThis : this, function(root){
6:   "use strict";
7: 
8:   // Candidate protocol only. A provider adapter must derive authority inside the
9:   // same transaction as the write. Caller-supplied authority is not authentication.
10:   const ROLES = Object.freeze(["playerOne", "playerTwo"]);
11:   const LEAGUES = Object.freeze(["premier_league", "laliga", "bundesliga", "serie_a", "ligue_1"]);
12:   const LENGTHS = Object.freeze([1, 3, 5, 10]);
13:   const PHASES = Object.freeze(["SHARED_SETUP_OPEN", "LEAGUE_WHEEL_COMMITTED", "CLUB_ASSIGNMENTS_COMMITTED", "SEASON_LENGTH_COMMITTED", "SHOWDOWN_CONFIRMED"]);
14:   const HASH = /^sha256:[0-9a-f]{64}$/;
15:   const STATE_KEYS = ["schemaVersion", "bindingHash", "catalogHash", "coordinatorRole", "phase", "revision", "leagueId", "clubs", "totalSeasons", "confirmedRoles", "receipts", "contentHash"];
16:   // R94-02 club draw ("spin and stop"). A setup opened with draw 2 deals each manager three candidate clubs
17:   // (six distinct, hash-derived, no write) and his club is the section of his ball where it came to rest:
18:   // one integer 0..359 per manager, carried inside his own confirm. The marker is the ledger key `stops`;
19:   // a ledger without it replays exactly as before R94-02 (same keys, same hashes, same clubs).
20:   const DRAW_STATE_KEYS = [...STATE_KEYS.slice(0, -1), "candidates", "stops", "contentHash"];
21:   const DRAW_CANDIDATES = 3;
22:   const STOP_SECTION_DEGREES = 120;
23:   // R95-01 Ball Game (draw 3, Nik 2026-11-17): the same spin and stop with SIX candidates per ball (twelve distinct
24:   // clubs from the drawn league), so each club holds a 60 degree slice and his club is candidates[floor(stop / 60)].
25:   // The marker is one more ledger key, `draw` (always the integer 3), written at open beside `stops` and never changed.
26:   // Draw 1 ledgers (no `stops`) and draw 2 ledgers (`stops`, no `draw`) keep their exact keys, hashes and clubs.
27:   const DRAW3_STATE_KEYS = [...STATE_KEYS.slice(0, -1), "candidates", "stops", "draw", "contentHash"];
28:   const DRAW3_CANDIDATES = 6;
29:   const DRAW3_SECTION_DEGREES = 60;
30:   const LEDGER_KEYS = Object.freeze(["schemaVersion", "objectType", "rivalryId", "revision", "phase", "coordinatorRole", "operationIds", "operationTypes", "baseRevisions", "actorRoles", "totalSeasons", "confirmedRoles", "activeSessionId", "updatedAt", "updatedByDeviceId"]);
31:   const DRAW_LEDGER_KEYS = Object.freeze([...LEDGER_KEYS, "stops"]);
32:   const DRAW3_LEDGER_KEYS = Object.freeze([...DRAW_LEDGER_KEYS, "draw"]);
33:   // R98-01 League Roulette (Nik 2026-11-20, option A): Daniel and Nik each drop two balls on a 3D roulette, taking turns,
34:   // and every league a ball lands in leaves until one is left. The league is still the one commit-league draws (the
35:   // roulette only shows how the other four leave), so the protocol state, its hashes and every club stay as they were.
36:   // The marker is one more ledger key, `drops` (the balls dropped so far), on a draw 3 ledger only: 0 at open, 1 with
37:   // commit-league (the coordinator's first ball is the tap that draws the league), then one small write per ball,
38:   // coordinator and rival in turn (ball 2 rival, ball 3 coordinator, ball 4 rival), and commit-clubs waits for all 4.
39:   // Ledgers without it keep their exact keys and replay as before.
40:   const ROULETTE_LEDGER_KEYS = Object.freeze([...DRAW3_LEDGER_KEYS, "drops"]);
41:   const ROULETTE_BALLS = 4;
42:   const COMMAND_FIELDS = Object.freeze({
43:     open: [],
44:     "commit-league": ["leagueId"],
45:     "commit-clubs": ["clubs"],
46:     "commit-length": ["totalSeasons"],
47:     confirm: ["setupHash"]
48:   });
49: 
50:   function ssjFail(code){ const error = new Error(code); error.code = code; throw error; }
51:   function plain(value){ return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
52:   function exact(value, keys, code){
53:     if(!plain(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) ssjFail(code);
54:   }
55:   function freeze(value){
56:     if(value && typeof value === "object" && !Object.isFrozen(value)){
57:       Object.values(value).forEach(freeze); Object.freeze(value);
58:     }
59:     return value;
60:   }
61:   function ssjCanonical(value){
62:     if(Array.isArray(value)) return `[${value.map(ssjCanonical).join(",")}]`;
63:     if(plain(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${ssjCanonical(value[key])}`).join(",")}}`;
64:     return JSON.stringify(value);
65:   }
66:   async function hash(value, cryptoImpl){
67:     if(!cryptoImpl || !cryptoImpl.subtle) ssjFail("SETUP_CRYPTO_UNAVAILABLE");
68:     const bytes = await cryptoImpl.subtle.digest("SHA-256", new TextEncoder().encode(ssjCanonical(value)));
69:     return `sha256:${Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("")}`;
70:   }
71:   function validId(value, pattern){ return typeof value === "string" && pattern.test(value); }
72:   function validStop(value){ return Number.isInteger(value) && value >= 0 && value < 360; }
73:   // Stored ledgers can come from another realm (the browser SDK, a test sandbox), so ledger checks only ask for
74:   // a non-array object; protocol state and commands keep the strict plain-object checks.
75:   function record(value){ return !!value && typeof value === "object" && !Array.isArray(value); }
76:   function isDrawState(value){ return plain(value) && Object.hasOwn(value, "stops"); }
77:   // The draw a setup was opened with: 1 (no `stops`), 2 (`stops`) or 3 (`stops` and `draw: 3`).
78:   function drawOf(value){ return !record(value) || !Object.hasOwn(value, "stops") ? 1 : Object.hasOwn(value, "draw") ? value.draw : 2; }
79:   function candidatesFor(draw){ return draw === 3 ? DRAW3_CANDIDATES : DRAW_CANDIDATES; }
80:   // His club is the candidate on the section of his ball facing him at rest: three 120 degree sections on a
81:   // draw 2 ball, six 60 degree slices on a draw 3 ball.
82:   function clubForStop(candidates, stop){
83:     if(!Array.isArray(candidates) || (candidates.length !== DRAW_CANDIDATES && candidates.length !== DRAW3_CANDIDATES) || !validStop(stop)) ssjFail("SETUP_STOP_INVALID");
84:     return candidates[Math.floor(stop / (candidates.length === DRAW3_CANDIDATES ? DRAW3_SECTION_DEGREES : STOP_SECTION_DEGREES))];
85:   }
86:   // The ledger keys a stored setup document must have: the 15 of every Showdown before R94-02, or those plus
87:   // `stops` (one integer 0..359 per confirmed manager, in confirmedRoles order). Used by every reader that
88:   // checks the stored ledger, so old and new Showdowns are recognised in one place.
89:   // R95-01: a draw 3 ledger also carries `draw` (3).
90:   // R98-01: a roulette ledger (draw 3) also carries `drops`.
91:   function ledgerKeys(value){ return record(value) && Object.hasOwn(value, "stops") ? (Object.hasOwn(value, "draw") ? (Object.hasOwn(value, "drops") ? ROULETTE_LEDGER_KEYS : DRAW3_LEDGER_KEYS) : DRAW_LEDGER_KEYS) : LEDGER_KEYS; }
92:   // R98-01 `drops` against the ledger's revision: 0 while only open is written, 1..4 while the league is drawn and the
93:   // balls are dropping, 4 from commit-clubs on.
94:   function dropsValid(value){
95:     if(!record(value) || !Object.hasOwn(value, "drops")) return true;
96:     const drops = value.drops, revision = value.revision;
97:     if(!Object.hasOwn(value, "draw") || !Number.isInteger(drops) || !Number.isInteger(revision)) return false;
98:     return revision <= 1 ? drops === 0 : revision === 2 ? drops >= 1 && drops <= ROULETTE_BALLS : drops === ROULETTE_BALLS;
99:   }
100:   // The manager who drops ball `ball` (1..4): the coordinator the odd balls, his rival the even ones.
101:   function rouletteDropRole(coordinatorRole, ball){
102:     if(!ROLES.includes(coordinatorRole) || !Number.isInteger(ball) || ball < 1 || ball > ROULETTE_BALLS) return null;
103:     return ball % 2 === 1 ? coordinatorRole : ROLES.find(role => role !== coordinatorRole);
104:   }
105:   function ledgerStopsValid(value){
106:     if(!dropsValid(value)) return false;
107:     if(record(value) && Object.hasOwn(value, "draw") && (!Object.hasOwn(value, "stops") || value.draw !== 3)) return false;
108:     if(!record(value) || !Object.hasOwn(value, "stops")) return true;
109:     return Array.isArray(value.stops) && Array.isArray(value.confirmedRoles) && value.stops.length === value.confirmedRoles.length && value.stops.every(validStop);
110:   }
111:   function validAccount(value){ return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value); }
112: 
113:   function authoritySnapshot(value){
114:     exact(value, ["rivalryId", "connectionState", "managerSlots", "actor", "session", "nowEpochMs"], "SETUP_AUTHORITY_INVALID");
115:     if(!validId(value.rivalryId, /^pair_[0-9a-f]{64}$/) || value.connectionState !== "active") ssjFail("SETUP_RIVALRY_INACTIVE");
116:     if(!Number.isSafeInteger(value.nowEpochMs) || value.nowEpochMs < 0) ssjFail("SETUP_CLOCK_INVALID");
117:     if(!Array.isArray(value.managerSlots) || value.managerSlots.length !== 2) ssjFail("SETUP_TWO_MANAGERS_REQUIRED");
118:     const slots = ROLES.map(role => {
119:       const slot = value.managerSlots.find(item => item && item.slotId === role);
120:       exact(slot, ["slotId", "accountId", "profileId", "saveId", "accountState", "entitlementState"], "SETUP_BINDING_INVALID");
121:       if(!validAccount(slot.accountId) || !validId(slot.profileId, /^profile_[0-9a-f]{24}$/) || !validId(slot.saveId, /^save_[0-9a-f]{24}$/)) ssjFail("SETUP_BINDING_INVALID");
122:       if(slot.accountState !== "active" || slot.entitlementState !== "active") ssjFail("SETUP_MANAGER_INACTIVE");
123:       return {...slot};
124:     });
125:     if(slots[0].accountId === slots[1].accountId) ssjFail("SETUP_TWO_MANAGERS_REQUIRED");
126:     const actor = value.actor;
127:     exact(actor, ["accountId", "deviceId", "deviceState", "managerRole", "profileId", "saveId"], "SETUP_ACTOR_INVALID");
128:     if(!validId(actor.deviceId, /^device_[0-9a-f]{32}$/) || actor.deviceState !== "active") ssjFail("SETUP_DEVICE_INACTIVE");
129:     const slot = slots.find(item => item.slotId === actor.managerRole);
130:     if(!slot || ["accountId", "profileId", "saveId"].some(key => slot[key] !== actor[key])) ssjFail("SETUP_ACTOR_NOT_ENTITLED");
131:     const session = value.session;
132:     exact(session, ["sessionId", "rivalryId", "state", "hostAccountId", "memberAccountIds", "expiresAtEpochMs"], "SETUP_SESSION_INVALID");
133:     if(!validId(session.sessionId, /^session_[0-9a-f]{64}$/) || session.rivalryId !== value.rivalryId) ssjFail("SETUP_SESSION_MISMATCH");
134:     if(session.state !== "active" || !Number.isSafeInteger(session.expiresAtEpochMs) || value.nowEpochMs >= session.expiresAtEpochMs) ssjFail("SETUP_ACTIVE_SESSION_REQUIRED");
135:     if(!Array.isArray(session.memberAccountIds) || session.memberAccountIds.length !== 2 || new Set(session.memberAccountIds).size !== 2 || !slots.every(item => session.memberAccountIds.includes(item.accountId))) ssjFail("SETUP_SESSION_MEMBERS_MISMATCH");
136:     const host = slots.find(item => item.accountId === session.hostAccountId);
137:     if(!host) ssjFail("SETUP_SESSION_MEMBERS_MISMATCH");
138:     return freeze({rivalryId:value.rivalryId, slots, role:slot.slotId, hostRole:host.slotId});
139:   }
140: 
141:   function catalogSnapshot(value){
142:     exact(value, LEAGUES, "SETUP_CATALOG_INVALID");
143:     const snapshot = {};
144:     for(const id of LEAGUES){
145:       const clubs = value[id];
146:       if(!Array.isArray(clubs) || clubs.length < 2 || clubs.length > 20 || new Set(clubs).size !== clubs.length || clubs.some(club => typeof club !== "string" || !club.trim() || club !== club.trim() || club.length > 80)) ssjFail("SETUP_CATALOG_INVALID");
147:       snapshot[id] = [...clubs];
148:     }
149:     return freeze(snapshot);
150:   }
151:   // Draw 2 command shapes: open may carry draw:2 (or draw:3, R95-01), commit-clubs carries candidates instead of
152:   // clubs (three or six per manager), and confirm carries the manager's stop. Every older command shape is unchanged.
153:   function commandFields(value){
154:     if(value.type === "open" && Object.hasOwn(value, "draw")) return ["draw"];
155:     if(value.type === "commit-clubs" && Object.hasOwn(value, "candidates")) return ["candidates"];
156:     if(value.type === "confirm" && Object.hasOwn(value, "stop")) return ["setupHash", "stop"];
157:     return COMMAND_FIELDS[value.type];
158:   }
159:   function commandSnapshot(value){
160:     if(!plain(value) || !Object.hasOwn(COMMAND_FIELDS, value.type)) ssjFail("SETUP_COMMAND_INVALID");
161:     exact(value, ["type", "operationId", "baseRevision", ...commandFields(value)], "SETUP_COMMAND_INVALID");
162:     if(!validId(value.operationId, /^setup_op_[0-9a-f]{32}$/) || !Number.isSafeInteger(value.baseRevision) || value.baseRevision < 0) ssjFail("SETUP_COMMAND_INVALID");
163:     if(value.type === "commit-league" && !LEAGUES.includes(value.leagueId)) ssjFail("SETUP_LEAGUE_INVALID");
164:     if(value.type === "open" && Object.hasOwn(value, "draw") && value.draw !== 2 && value.draw !== 3) ssjFail("SETUP_COMMAND_INVALID");
165:     if(value.type === "commit-clubs" && Object.hasOwn(value, "candidates")){
166:       exact(value.candidates, ROLES, "SETUP_CLUBS_INVALID");
167:       const size = Array.isArray(value.candidates.playerOne) ? value.candidates.playerOne.length : -1;
168:       if((size !== DRAW_CANDIDATES && size !== DRAW3_CANDIDATES) || ROLES.some(role => !Array.isArray(value.candidates[role]) || value.candidates[role].length !== size || value.candidates[role].some(club => typeof club !== "string"))) ssjFail("SETUP_CLUBS_INVALID");
169:     }else if(value.type === "commit-clubs"){
170:       exact(value.clubs, ROLES, "SETUP_CLUBS_INVALID");
171:       if(ROLES.some(role => typeof value.clubs[role] !== "string")) ssjFail("SETUP_CLUBS_INVALID");
172:     }
173:     if(value.type === "commit-length" && !LENGTHS.includes(value.totalSeasons)) ssjFail("SETUP_LENGTH_INVALID");
174:     if(value.type === "confirm" && !validId(value.setupHash, HASH)) ssjFail("SETUP_CONFIRMATION_INVALID");
175:     if(value.type === "confirm" && Object.hasOwn(value, "stop") && !validStop(value.stop)) ssjFail("SETUP_STOP_INVALID");
176:     return freeze({...value, ...(value.clubs ? {clubs:{...value.clubs}} : {}), ...(value.candidates ? {candidates:{playerOne:[...value.candidates.playerOne], playerTwo:[...value.candidates.playerTwo]}} : {})});
177:   }
178:   function setupValue(state){
179:     const value = {schemaVersion:1, bindingHash:state.bindingHash, catalogHash:state.catalogHash, coordinatorRole:state.coordinatorRole, leagueId:state.leagueId, clubs:state.clubs, totalSeasons:state.totalSeasons};
180:     // Draw 2: a manager confirms the league, the length and the six candidates; his stop rides on the
181:     // confirm itself. Older setups keep the exact value (and hash) they always had.
182:     return isDrawState(state) ? {...value, drawVersion:drawOf(state), candidates:state.candidates} : value;
183:   }
184:   // R95-01 (Nik 2026-11-17, hard rule): the two balls never share a club. Both managers are dealt from ONE pool of the
185:   // drawn league's clubs, without replacement (each pick is spliced out), alternating playerOne, playerTwo, ... So every
186:   // draw holds count x 2 distinct clubs of that league BY CONSTRUCTION, whatever indices `pick` returns; a pick outside
187:   // the pool fails instead of reusing a club. Draw 2 deals exactly as in 2.7.0 (same picks, same order).
188:   async function dealCandidates(pool, count, pick){
189:     const available = [...pool];
190:     if(available.length < count * ROLES.length) ssjFail("SETUP_DRAW_NOT_AVAILABLE");
191:     const candidates = {playerOne:[], playerTwo:[]};
192:     for(let index = 0; index < count * ROLES.length; index++){
193:       const at = await pick(index, available.length);
194:       if(!Number.isSafeInteger(at) || at < 0 || at >= available.length) ssjFail("SETUP_DRAW_NOT_AVAILABLE");
195:       candidates[ROLES[index % ROLES.length]].push(available.splice(at, 1)[0]);
196:     }
197:     return candidates;
198:   }
199:   function validCandidates(candidates, leagueId, catalog, count){
200:     exact(candidates, ROLES, "SETUP_CLUBS_INVALID");
201:     const all = ROLES.flatMap(role => Array.isArray(candidates[role]) && candidates[role].length === count ? candidates[role] : ssjFail("SETUP_CLUBS_INVALID"));
202:     if(new Set(all).size !== all.length || !catalog[leagueId] || !all.every(club => catalog[leagueId].includes(club))) ssjFail("SETUP_CLUBS_INVALID");
203:   }
204:   function drawnClubs(state){
205:     const clubs = {};
206:     state.confirmedRoles.forEach((role, index) => { clubs[role] = clubForStop(state.candidates[role], state.stops[index]); });
207:     return clubs;
208:   }
209:   function validClubPair(clubs, leagueId, catalog){
210:     exact(clubs, ROLES, "SETUP_CLUBS_INVALID");
211:     if(clubs.playerOne === clubs.playerTwo || !catalog[leagueId] || !ROLES.every(role => catalog[leagueId].includes(clubs[role]))) ssjFail("SETUP_CLUBS_INVALID");
212:   }
213: 
214:   async function createProtocol({catalog, cryptoImpl = root.crypto} = {}){
215:     const clubsByLeague = catalogSnapshot(catalog);
216:     const catalogHash = await hash(clubsByLeague, cryptoImpl);
217:     async function verifyState(value){
218:       const draw = isDrawState(value), version = drawOf(value);
219:       exact(value, version === 3 ? DRAW3_STATE_KEYS : draw ? DRAW_STATE_KEYS : STATE_KEYS, "SETUP_STATE_INVALID");
220:       if(Object.hasOwn(value, "draw") && value.draw !== 3) ssjFail("SETUP_STATE_INVALID");
221:       // Copy before the first await so an async digest cannot validate one value
222:       // and later return a caller-mutated value.
223:       const state = JSON.parse(JSON.stringify(value));
224:       const {contentHash, ...core} = state;
225:       if(state.schemaVersion !== 1 || !validId(contentHash, HASH) || !validId(state.bindingHash, HASH) || state.catalogHash !== catalogHash || !ROLES.includes(state.coordinatorRole) || !PHASES.includes(state.phase)) ssjFail("SETUP_STATE_INVALID");
226:       if(!Number.isInteger(state.revision) || state.revision < 1 || state.revision > 6 || !Array.isArray(state.receipts) || state.receipts.length !== state.revision) ssjFail("SETUP_STATE_INVALID");
227:       if(!Array.isArray(state.confirmedRoles) || state.confirmedRoles.length > 2 || new Set(state.confirmedRoles).size !== state.confirmedRoles.length || state.confirmedRoles.some(role => !ROLES.includes(role))) ssjFail("SETUP_STATE_INVALID");
228:       const phaseIndex = PHASES.indexOf(state.phase);
229:       if(phaseIndex === 0 ? state.leagueId !== null : !LEAGUES.includes(state.leagueId)) ssjFail("SETUP_STATE_INVALID");
230:       if(draw){
231:         // Draw 2: candidates from commit-clubs on; clubs only once both managers have stopped.
232:         if(phaseIndex < 2){ if(state.candidates !== null) ssjFail("SETUP_STATE_INVALID"); }
233:         else validCandidates(state.candidates, state.leagueId, clubsByLeague, candidatesFor(version));
234:         if(!Array.isArray(state.stops) || state.stops.length !== state.confirmedRoles.length || !state.stops.every(validStop)) ssjFail("SETUP_STATE_INVALID");
235:         if(phaseIndex < 4){ if(state.clubs !== null) ssjFail("SETUP_STATE_INVALID"); }
236:         else{
237:           validClubPair(state.clubs, state.leagueId, clubsByLeague);
238:           const expected = drawnClubs(state);
239:           if(ROLES.some(role => state.clubs[role] !== expected[role])) ssjFail("SETUP_STATE_INVALID");
240:         }
241:       }else if(phaseIndex < 2){ if(state.clubs !== null) ssjFail("SETUP_STATE_INVALID"); }
242:       else validClubPair(state.clubs, state.leagueId, clubsByLeague);
243:       if(phaseIndex < 3 ? state.totalSeasons !== null : !LENGTHS.includes(state.totalSeasons)) ssjFail("SETUP_STATE_INVALID");
244:       if(phaseIndex < 3 && state.confirmedRoles.length !== 0) ssjFail("SETUP_STATE_INVALID");
245:       if(phaseIndex === 3 && state.confirmedRoles.length > 1) ssjFail("SETUP_STATE_INVALID");
246:       if(phaseIndex === 4 && state.confirmedRoles.length !== 2) ssjFail("SETUP_STATE_INVALID");
247:       if(state.revision !== Math.min(phaseIndex + 1, 4) + state.confirmedRoles.length) ssjFail("SETUP_STATE_INVALID");
248:       const operations = new Set();
249:       for(const [index, receipt] of state.receipts.entries()){
250:         exact(receipt, ["operationHash", "requestHash", "acceptedRevision", "actorRole", "type"], "SETUP_RECEIPT_INVALID");
251:         if(!validId(receipt.operationHash, HASH) || !validId(receipt.requestHash, HASH) || receipt.acceptedRevision !== index + 1 || !ROLES.includes(receipt.actorRole) || operations.has(receipt.operationHash)) ssjFail("SETUP_RECEIPT_INVALID");
252:         operations.add(receipt.operationHash);
253:         const type = ["open", "commit-league", "commit-clubs", "commit-length", "confirm", "confirm"][index];
254:         if(receipt.type !== type || (index < 4 && receipt.actorRole !== state.coordinatorRole) || (index >= 4 && receipt.actorRole !== state.confirmedRoles[index - 4])) ssjFail("SETUP_RECEIPT_INVALID");
255:       }
256:       if(await hash(core, cryptoImpl) !== contentHash) ssjFail("SETUP_INTEGRITY_FAILED");
257:       return freeze(state);
258:     }
259: 
260:     async function boundIndex(state, purpose, length){
261:       const bound = Math.floor(0x100000000 / length) * length;
262:       for(let counter = 0; counter < 128; counter++){
263:         // The seed is provider-bound state, not caller-selected operation data.
264:         // This makes every valid rivalry state map to one immutable draw outcome.
265:         const digest = await hash({domain:"shared-showdown-draw-v1", bindingHash:state.bindingHash, catalogHash:state.catalogHash, leagueId:state.leagueId, purpose, counter}, cryptoImpl);
266:         const value = Number.parseInt(digest.slice(7, 15), 16);
267:         if(value < bound) return value % length;
268:       }
269:       ssjFail("SETUP_RANDOMNESS_UNAVAILABLE");
270:     }
271:     async function boundDraw(state, type){
272:       if(type === "commit-league" && state.phase === "SHARED_SETUP_OPEN"){
273:         return {leagueId:LEAGUES[await boundIndex(state, "league", LEAGUES.length)]};
274:       }
275:       if(type === "commit-clubs" && state.phase === "LEAGUE_WHEEL_COMMITTED" && isDrawState(state)){
276:         // Six (draw 3: twelve) distinct candidates from the drawn league, dealt playerOne, playerTwo, playerOne, ...
277:         // Section k of a manager's ball carries his candidate k. Draw 3 continues the same purposes (candidate-6..11),
278:         // so its first six candidates are the ones a draw 2 setup of the same rivalry and league would get.
279:         const candidates = await dealCandidates(clubsByLeague[state.leagueId], candidatesFor(drawOf(state)), (index, length) => boundIndex(state, `candidate-${index}`, length));
280:         return {candidates};
281:       }
282:       if(type === "commit-clubs" && state.phase === "LEAGUE_WHEEL_COMMITTED"){
283:         const available = [...clubsByLeague[state.leagueId]];
284:         const playerOne = available.splice(await boundIndex(state, "club-player-one", available.length), 1)[0];
285:         const playerTwo = available[await boundIndex(state, "club-player-two", available.length)];
286:         return {clubs:{playerOne, playerTwo}};
287:       }
288:       ssjFail("SETUP_DRAW_NOT_AVAILABLE");
289:     }
290: 
291:     async function apply({state = null, authority, command} = {}){
292:       try{
293:         // All external snapshots are captured before any asynchronous boundary.
294:         const context = authoritySnapshot(authority);
295:         const request = commandSnapshot(command);
296:         const priorPromise = state === null ? Promise.resolve(null) : verifyState(state);
297:         const [bindingHash, prior] = await Promise.all([
298:           hash({rivalryId:context.rivalryId, managerSlots:context.slots.map(({slotId, accountId, profileId, saveId}) => ({slotId, accountId, profileId, saveId}))}, cryptoImpl),
299:           priorPromise
300:         ]);
301:         if(prior && prior.bindingHash !== bindingHash) ssjFail("SETUP_BINDING_CHANGED");
302:         const operationHash = await hash(request.operationId, cryptoImpl);
303:         const requestHash = await hash({bindingHash, actorRole:context.role, command:request}, cryptoImpl);
304:         const receipt = prior && prior.receipts.find(item => item.operationHash === operationHash);
305:         if(receipt){
306:           if(receipt.requestHash !== requestHash) ssjFail("SETUP_IDEMPOTENCY_CONFLICT");
307:           return freeze({ok:true, status:"replayed", acceptedRevision:receipt.acceptedRevision, state:prior});
308:         }
309:         if(request.baseRevision !== (prior ? prior.revision : 0)) ssjFail("SETUP_STALE_BASE_REVISION");
310:         if(prior && prior.phase === "SHOWDOWN_CONFIRMED") ssjFail("SETUP_ALREADY_CONFIRMED");
311:         if(request.type === "open"){
312:           if(prior) ssjFail("SETUP_ALREADY_OPEN");
313:           if(context.role !== context.hostRole) ssjFail("SETUP_COORDINATOR_REQUIRED");
314:         }else{
315:           if(!prior) ssjFail("SETUP_NOT_OPEN");
316:           if(request.type !== "confirm" && context.role !== prior.coordinatorRole) ssjFail("SETUP_COORDINATOR_REQUIRED");
317:         }
318:         const draw = request.type === "open" ? request.draw === 2 || request.draw === 3 : isDrawState(prior);
319:         const version = request.type === "open" ? (draw ? request.draw : 1) : drawOf(prior);
320:         // A command must use the shapes of the draw its setup was opened with.
321:         if(request.type === "commit-clubs" && Object.hasOwn(request, "candidates") !== draw) ssjFail("SETUP_DRAW_VERSION_MISMATCH");
322:         if(request.type === "confirm" && Object.hasOwn(request, "stop") !== draw) ssjFail("SETUP_DRAW_VERSION_MISMATCH");
323:         const next = prior ? JSON.parse(JSON.stringify(prior)) : {
324:           schemaVersion:1, bindingHash, catalogHash, coordinatorRole:context.role,
325:           phase:"SHARED_SETUP_OPEN", revision:0, leagueId:null, clubs:null,
326:           totalSeasons:null, confirmedRoles:[], receipts:[],
327:           ...(draw ? {candidates:null, stops:[]} : {}),
328:           ...(version === 3 ? {draw:3} : {})
329:         };
330:         if(request.type === "commit-league"){
331:           if(prior.phase !== "SHARED_SETUP_OPEN") ssjFail("SETUP_TRANSITION_INVALID");
332:           const expected = await boundDraw(prior, request.type);
333:           if(request.leagueId !== expected.leagueId) ssjFail("SETUP_DRAW_MISMATCH");
334:           next.leagueId = request.leagueId; next.phase = "LEAGUE_WHEEL_COMMITTED";
335:         }else if(request.type === "commit-clubs" && draw){
336:           if(prior.phase !== "LEAGUE_WHEEL_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
337:           validCandidates(request.candidates, prior.leagueId, clubsByLeague, candidatesFor(version));
338:           const expected = await boundDraw(prior, request.type);
339:           if(ROLES.some(role => expected.candidates[role].some((club, index) => request.candidates[role][index] !== club))) ssjFail("SETUP_DRAW_MISMATCH");
340:           next.candidates = {playerOne:[...request.candidates.playerOne], playerTwo:[...request.candidates.playerTwo]};
341:           next.phase = "CLUB_ASSIGNMENTS_COMMITTED";
342:         }else if(request.type === "commit-clubs"){
343:           if(prior.phase !== "LEAGUE_WHEEL_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
344:           validClubPair(request.clubs, prior.leagueId, clubsByLeague);
345:           const expected = await boundDraw(prior, request.type);
346:           if(ROLES.some(role => request.clubs[role] !== expected.clubs[role])) ssjFail("SETUP_DRAW_MISMATCH");
347:           next.clubs = {...request.clubs}; next.phase = "CLUB_ASSIGNMENTS_COMMITTED";
348:         }else if(request.type === "commit-length"){
349:           if(prior.phase !== "CLUB_ASSIGNMENTS_COMMITTED") ssjFail("SETUP_TRANSITION_INVALID");
350:           next.totalSeasons = request.totalSeasons; next.phase = "SEASON_LENGTH_COMMITTED";
351:         }else if(request.type === "confirm"){
352:           if(prior.phase !== "SEASON_LENGTH_COMMITTED" || prior.confirmedRoles.includes(context.role)) ssjFail("SETUP_CONFIRMATION_NOT_AVAILABLE");
353:           if(request.setupHash !== await hash(setupValue(prior), cryptoImpl)) ssjFail("SETUP_CONFIRMATION_CHANGED");
354:           next.confirmedRoles.push(context.role);
355:           if(draw) next.stops.push(request.stop);
356:           if(next.confirmedRoles.length === 2){
357:             next.phase = "SHOWDOWN_CONFIRMED";
358:             if(draw) next.clubs = drawnClubs(next);
359:           }
360:         }
361:         next.revision += 1;
362:         next.receipts.push({operationHash, requestHash, acceptedRevision:next.revision, actorRole:context.role, type:request.type});
363:         delete next.contentHash;
364:         next.contentHash = await hash(next, cryptoImpl);
365:         return freeze({ok:true, status:"accepted", acceptedRevision:next.revision, state:next});
366:       }catch(error){
367:         // Never echo provider authority, commands or private capabilities.
368:         return freeze({ok:false, code:typeof error.code === "string" && error.code.startsWith("SETUP_") ? error.code : "SETUP_INVALID_INPUT"});
369:       }
370:     }
371: 
372:     async function prepareDraw({state, type, operationId}){
373:       const prior = await verifyState(state);
374:       const payload = await boundDraw(prior, type);
375:       return commandSnapshot({type, operationId, baseRevision:prior.revision, ...payload});
376:     }
377:     async function confirmationHash(state){ return hash(setupValue(await verifyState(state)), cryptoImpl); }
378:     // The one place that turns stored ledger step `index` back into its protocol command. Every reader that
379:     // replays a stored setup (setup screen, Season Results, Season Commit, finished-Showdown History) uses it,
380:     // so old ledgers replay exactly as before and draw 2 ledgers carry their stops.
381:     async function ledgerCommand({state, ledger, index}){
382:       if(!record(ledger) || !Array.isArray(ledger.operationTypes) || !Number.isInteger(index) || index < 0 || index >= ledger.operationTypes.length || !ledgerStopsValid(ledger)) ssjFail("SETUP_STATE_INVALID");
383:       const type = ledger.operationTypes[index], operationId = ledger.operationIds[index], baseRevision = ledger.baseRevisions[index];
384:       const draw = Object.hasOwn(ledger, "stops");
385:       if(type === "open") return draw ? {type, operationId, baseRevision, draw:drawOf(ledger)} : {type, operationId, baseRevision};
386:       if(type === "commit-league" || type === "commit-clubs") return prepareDraw({state, type, operationId});
387:       if(type === "commit-length") return {type, operationId, baseRevision, totalSeasons:ledger.totalSeasons};
388:       if(type === "confirm"){
389:         const command = {type, operationId, baseRevision, setupHash:await confirmationHash(state)};
390:         if(draw) command.stop = ledger.stops[index - 4];
391:         return command;
392:       }
393:       ssjFail("SETUP_STATE_INVALID");
394:     }
395:     return freeze({apply, verifyState, prepareDraw, confirmationHash, ledgerCommand, catalogHash});
396:   }
397:   return freeze({contractVersion:1, implementationState:"candidate-provider-neutral", productionEnabled:false, canonicalStorageMutation:false, billingRequired:false, roles:ROLES, leagueIds:LEAGUES, allowedSeasonLengths:LENGTHS, phases:PHASES, drawCandidates:DRAW_CANDIDATES, stopSectionDegrees:STOP_SECTION_DEGREES, draw3Candidates:DRAW3_CANDIDATES, draw3SectionDegrees:DRAW3_SECTION_DEGREES, drawOf, dealCandidates, ledgerKeys, ledgerStopsValid, clubForStop, rouletteBalls:ROULETTE_BALLS, rouletteDropRole, createProtocol});
398: });
399: 
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

(End of packet FJ13. Answer with the report only.)
