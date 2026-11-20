# Fable 5.2 red-team job FJ4: Roulette squads: the shot counts once, boards stay right

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
Then one block per finding: ID (FJ4-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Is each season's shot recorded exactly once and shown the same on both phones, including a reload or lost graphics mid-turn?
2. Do the boards build correctly over 1-10 seasons: 11 starters + 4 bench from the manager's own club pool, the shot player out, kept signings in, hidden reserves coming back when better players are lost, shrinking to 14 by season 10 only when the club runs out?
3. Can the shot (guessed) player ever rejoin a board or be signed again? Can the Special Player ever appear on a board?
4. Can namesakes (two players with the same name) bar or admit the wrong man?
5. Does a missing or unreadable season (network error) build a wrong board silently instead of showing a recoverable error?

## Known (do not report)
The Roulette cylinder lands uniformly on 7 holes, never back to the start hole (by design).

## Files

## FILE: js/rosterRouletteStep.js (509 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeRosterRouletteStep=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   // r87 Roster Russian Roulette season step (Nik 2026-10-28/30; look Team V HO-040): before each manager's Transfer Challenge both spins play full-screen, Daniel first, outcome from js/rosterRoulette.js (the Showdown id decides, so both phones agree; HO040-M1); he then confirms the release in his FIFA 17 save. The app never releases anyone itself.
9:   // Boards build themselves, never saved or typed (Nik 2026-10-30): FIFA 17 launch board minus the Special Player, then each season's shot player out and kept signings in by position and overall, from Transfer War verdicts and saved shots (kept on this phone when shown, else plain reads of both verdict documents and the saved spins for every missing season at once; F2-12).
10:   // Shown once per manager per season on this browser (a watched spin is not replayed); never for a Showdown confirmed before r87. A page that fails to load skips only the animation: the result and the release still show.
11:   // Any other failure (engine, data, error) keeps the Transfer Challenge closed behind TRY AGAIN / BACK (red team R87-B-02): the seeded shot still counts on later boards, so a manager must never reach the window untold.
12:   const PAGE="visual-assets/v10_1/roulette/index.html";
13:   const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
14:   const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
15:   // r90 BUG-02: the page now answers "armed" once it has drawn a frame with this Showdown's boards, so on a slow Chromebook
16:   // that can take a few seconds. The loading screen stays up meanwhile (Reus Gate).
17:   // r90 MOTION M9: MAX_LOADING_MS is the wait since the page last said it is still busy ("cms-rr-loading", sent as it builds
18:   // and after every batch of shaders); COLD_LOADING_MS caps the whole start (on-screen time only).
19:   // r90 Light (Nik 2026-11-08: "3D light for Chamber Men and RRR is a guarantee"): a device with WebGL 2 always gets the 3D
20:   // scene. The old 15 s and 20 s give-ups are gone: the page has 45 s of silence (on screen) before it counts as stuck, the
21:   // whole start may take 4 minutes, and a page that broke, hung or loaded without its 3D library is built again once in a
22:   // fresh frame (SCENE_TRIES) before the result card stands in. Only a page that says WebGL is missing (webgl:false) goes
23:   // straight to the card, and only that is remembered for the rest of the visit.
24:   const MIN_LOADING_MS=1000,MAX_LOADING_MS=45000,COLD_LOADING_MS=240000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=45000,SCENE_TRIES=2,RETRY_MIN_MS=30000;
25:   const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
26:   const sceneFailedHere=new Set();
27:   // holding (Fable F2-17): from START until close() (or the way back to Home), so the screens that open the Transfer Challenge
28:   // keep counting the roulette as on screen while its release is saved and the window is navigated to. loading: the Reus Gate
29:   // loading screen, held from START until a card or the scene is ready (Fable F2-13).
30:   let running=null,leftForHome=false,holding=false,loading=null,loadingShows=0,loadingPrior=null;
31:   // E1 (2.4.0, Fable re-check 2): the partner's END SHOWDOWN (js/productionSharedTerminalClose.js) ends the run on screen at
32:   // once (end()): its card answers BACK by itself, a scene being loaded or played stops waiting, and nothing more is drawn,
33:   // saved or navigated by it. runGen is the end generation the run started in; endWake wakes the waits of that run.
34:   let endGen=0,runGen=0,runRivalry="",askEnd=null,endWake=null,endSignal=new Promise(()=>{});
35:   function rrsEnded(){return runGen!==endGen;}
36: 
37:   function rrsDoc(){return root.document||null;}
38:   function rrsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
39:   function rrsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
40:   function rrsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
41:   // Both lists go through the app's storage helpers (js/storage.js), like every other browser-kept value.
42:   function rrsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
43:   function rrsHas(key,item){return rrsList(key).includes(item);}
44:   function rrsMark(key,item){try{const list=rrsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
45:   async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
46:   // The Special Player draw (data/marqueePlayers.js + js/marqueePlayer.js), also wanted by the Transfer War signing form
47:   // (R87-SP-02) when this season's roulette is already done on this browser (Fable F2-06).
48:   // Fable F6-05: the load wait counts only time the page is on screen (rrsVisibleWait), so a phone locked on a cold cache
49:   // does not come back to "The roulette could not load".
50:   function rrsLoadWait(loads){let stop=()=>{};const timeout=new Promise(resolve=>{stop=rrsVisibleWait(LOAD_WAIT_MS,()=>resolve(false));});return Promise.race([loads,timeout]).finally(()=>stop());}
51:   function rrsEnsureDraw(){
52:     const loads=Promise.all([
53:       rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
54:       rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer))
55:     ]).then(list=>list.every(Boolean),()=>false);
56:     return rrsLoadWait(loads);
57:   }
58:   async function rrsEnsure(){
59:     const loads=Promise.all([
60:       rrsLoad("fifa17-players","data/fifa17Players.js",()=>Boolean(root.CareerModeFifa17Players)),
61:       rrsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
62:       rrsLoad("roster-roulette","js/rosterRoulette.js",()=>Boolean(root.CareerModeRosterRoulette)),
63:       rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
64:       rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)),
65:       typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
66:     ]).then(list=>list.every(Boolean),()=>false);
67:     return rrsLoadWait(loads);
68:   }
69: 
70:   // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, verdicts(k)} from the Transfer
71:   // Challenge. True when this manager still has this season's roulette to do on this browser.
72:   function rrsDecide(ctx){
73:     if(!ctx)return false;
74:     if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
75:     if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
76:     if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
77:     if(!Number.isFinite(ctx.confirmedAtMs))return false;
78:     const key=rrsKey(ctx);
79:     return !rrsHas(DONE_KEY,key);
80:   }
81: 
82:   // ---------- the panel (marble, like Career Start; no scrim: it sits on the scene or the page as an opaque card) ----------
83:   function rrsEl(tag,className,text){const node=rrsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
84:   function rrsButton(label,className,onClick){const button=rrsEl("button",className,label);button.type="button";button.addEventListener("click",onClick);return button;}
85:   function rrsRemovePanel(){const panel=rrsDoc()?.getElementById(PANEL_ID);if(panel)panel.remove();}
86:   function rrsPanel(ctx,heading,label){
87:     rrsRemovePanel();
88:     const overlay=rrsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",label);
89:     const shell=rrsEl("div","remoteJoiningShell rrStepShell"),header=rrsEl("div","remoteJoiningHeader");
90:     header.append(rrsEl("strong","",`SEASON ${ctx.season} · ROSTER RUSSIAN ROULETTE`));
91:     const body=rrsEl("div","rrStepBody");body.append(rrsEl("h2","rrStepTitle",heading));
92:     // No finished scene behind the card (WebGL missing, scene seen before a reload, history retry): stand it in the room, never on the page below.
93:     if(!rrsDoc().getElementById(STAGE_ID))overlay.classList.add("rrStepRoom");
94:     shell.append(header,body);overlay.append(shell);rrsDoc().body.append(overlay);
95:     return {overlay,body};
96:   }
97:   // A choice panel: resolves with the id of the button pressed. The card takes over from the loading screen; TRY AGAIN brings
98:   // the loading screen back over the card until the next card or the scene is ready (Reus Gate, Fable F2-13).
99:   // The other buttons are .compactButton.rrStepBack (the .backButton look), never .backButton: the app's smart back
100:   // (js/screens.js) takes every .backButton click before the button hears it, so BACK and CONTINUE WITH X'S SAVED SPIN never
101:   // answered the card (2.0.1).
102:   function rrsAsk(ctx,{heading,label,lines=[],note="",buttons}){
103:     if(rrsEnded())return Promise.resolve("back");
104:     return new Promise(resolve=>{
105:       askEnd=()=>{askEnd=null;rrsRemovePanel();resolve("back");};
106:       const {body}=rrsPanel(ctx,heading,label);rrsLoadingOff();
107:       for(const line of lines)body.append(rrsEl("p","rrStepLine",line));
108:       if(note)body.append(rrsEl("p","rrStepNote",note));
109:       const row=rrsEl("div","rrStepActions");
110:       // Fable F11-12: one answer per card; the buttons go quiet at once (saving the spin can take a few seconds after GO).
111:       const pressed=[];
112:       for(const b of buttons){const button=rrsButton(b.label,b.primary?"menuButton rrStepPrimary":"compactButton rrStepBack",()=>{askEnd=null;for(const other of pressed)other.disabled=true;if(b.id==="retry")rrsLoadingOn();resolve(b.id);});pressed.push(button);row.append(button);}
113:       body.append(row);row.querySelector("button")?.focus();
114:     });
115:   }
116: 
117:   // ---------- season 2+: this manager's board ----------
118:   // The same rules as the engine and the Rules (js/rosterRoulette.js normalizeBoard), with a reason a person can act on.
119:   // Fable F2-09: the true reason for each answer; "the connection" only when it was the connection.
120:   function rrsReadError(result,season){
121:     const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result);if(quota)return quota;
122:     const code=String(result&&result.code||"");
123:     if(/permission/i.test(code))return `Season ${season}'s Transfer War could not be read because this Showdown is not open here. Go back to Showdown Home and open it again.`;
124:     if(code==="TRANSFER_NOT_COMPLETED")return `Season ${season}'s Transfer War never reached its verdicts, and this season's boards are built from them. Nothing was spun or saved.`;
125:     if(/STALE|MISMATCH/.test(code))return `This Showdown moved on while this screen was open, so Season ${season}'s Transfer War no longer matches it. Go back to Showdown Home and open it again.`;
126:     if(!code||/unavailable|deadline|offline|network|aborted|timeout|PROVIDER_FAILED/i.test(code))return `Season ${season}'s Transfer War could not be reached because the connection dropped. Try again once it is back.`;
127:     return `Season ${season}'s Transfer War could not be read (${code}). Nothing was spun or saved.`;
128:   }
129:   // The Special Players both phones drew for this Showdown (js/marqueePlayer.js): {role:{name, overall, number,
130:   // sourceName}}, or null for a Showdown confirmed before the Special Player. The engine excludes BOTH from both boards
131:   // (red team R87-C-01) by his own squad database row: name + shirt number (R87-C-05), under the database name when it
132:   // differs from the display name (R87-D-01, data/marqueePlayers.js sourceNames).
133:   function rrsSpecial(ctx){
134:     const draw=root.CareerModeMarqueePlayer,picks=draw&&draw.forShowdown(ctx.rivalryId,ctx.confirmedAtMs,{clubs:ctx.clubs});
135:     const sourceNames=(root.CareerModeMarqueePlayers&&root.CareerModeMarqueePlayers.sourceNames)||{};
136:     return picks?Object.fromEntries(ROLES.map(role=>[role,{name:picks[role].name,overall:picks[role].overall,number:picks[role].number,
137:       sourceName:Object.prototype.hasOwnProperty.call(sourceNames,picks[role].name)?sourceNames[picks[role].name]:null}])):null;
138:   }
139:   /* rrsSpecial end */
140:   // A cosmetic seed for the scene (red team R87-C-06): from the Showdown id and the season, the same on both phones.
141:   function rrsSeed(ctx){return (parseInt(String(ctx.rivalryId).slice(-8),16)^Math.imul(ctx.season,0x9E3779B1))>>>0;}
142:   // history[k] = both managers' Transfer War verdicts of season k, for every season before this one; null when the
143:   // manager leaves.
144:   // F2-02: also the outcomes each season's spin marks saved (hits[k], or null when that season has none): the engine replays
145:   // them as the authority. F2-12: all missing seasons are asked for at once; TRY AGAIN asks again only for those that failed.
146:   async function rrsHistory(ctx,hits){
147:     const history=[null];
148:     const first=new Map();for(let k=1;k<ctx.season;k+=1)first.set(k,Promise.resolve(ctx.verdicts(k)).catch(()=>null));
149:     for(let k=1;k<ctx.season;k+=1){
150:       for(let attempt=0;;attempt+=1){
151:         const result=attempt===0?await first.get(k):await ctx.verdicts(k);
152:         if(result&&result.ok){history.push(result.verdicts);hits[k]=result.hits||null;break;}
153:         const choice=await rrsAsk(ctx,{heading:"Building the boards",label:"Building the boards",lines:[rrsReadError(result,k)],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
154:         if(choice==="back")return null;
155:       }
156:     }
157:     return history;
158:   }
159: 
160:   // ---------- the spins (Team V's page in a frame) ----------
161:   function rrsShowLoading(){
162:     const doc=rrsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
163:     // A show during the previous fade keeps the words from before the roulette, not its own.
164:     const text=doc.getElementById("loadingText"),fading=Boolean(loadingPrior&&el.classList.contains("is-exiting")&&!el.hidden);
165:     const priorText=fading?loadingPrior.text:text?text.textContent:"",priorLabel=fading?loadingPrior.label:el.getAttribute("aria-label");loadingPrior={text:priorText,label:priorLabel};
166:     el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Loading the revolver");
167:     if(text)text.textContent="LOADING THE REVOLVER";
168:     void el.offsetWidth;el.style.transition="";
169:     const shows=++loadingShows;let hidden=false;
170:     return {hide(){
171:       if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
172:       root.setTimeout(()=>{if(shows!==loadingShows)return;/* shown again (TRY AGAIN) during the fade */el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
173:     }};
174:   }
175:   function rrsLoadingOn(){if(!loading)loading=rrsShowLoading();}
176:   function rrsLoadingOff(){const shown=loading;loading=null;if(shown)shown.hide();}
177:   // A wait that only counts time the page was on screen (Fable F2-07): a phone locked or switched away while the scene loads
178:   // does not use up the wait, so a scene that would have worked is not skipped the moment the manager comes back.
179:   function rrsVisibleWait(ms,onTimeout){
180:     const doc=rrsDoc();let timer=null,stopped=false,away=false;
181:     const hidden=()=>Boolean(doc&&doc.visibilityState==="hidden");
182:     const onVisibility=()=>{if(hidden())away=true;};
183:     // r90 MOTION M9: a timer that fires much later than asked means the main thread was held (the frame shares it while the
184:     // scene builds its shaders); the page's messages from that moment are still queued behind it, so it looks again shortly
185:     // after instead of failing a page that was busy, not stuck.
186:     let due=0,graced=false;
187:     const arm=(wait=ms)=>{due=Date.now()+wait;timer=root.setTimeout(()=>{if(stopped)return;if(away||hidden()){away=hidden();arm();return;}if(!graced&&Date.now()-due>1000){graced=true;arm(2000);return;}stop();onTimeout();},wait);};
188:     const stop=()=>{stopped=true;root.clearTimeout(timer);doc?.removeEventListener?.("visibilitychange",onVisibility);};
189:     doc?.addEventListener?.("visibilitychange",onVisibility);arm();
190:     return stop;
191:   }
192:   // r91 B23-02: on-screen time since a start began (a locked or switched-away phone does not use it up), so the start's one
193:   // cold budget can be shared by both tries.
194:   function rrsVisibleClock(){
195:     const doc=rrsDoc(),hidden=()=>Boolean(doc&&doc.visibilityState==="hidden");let spent=0,since=Date.now(),away=hidden();
196:     const on=()=>{const h=hidden();if(h&&!away){spent+=Date.now()-since;away=true;}else if(!h&&away){since=Date.now();away=false;}};
197:     doc?.addEventListener?.("visibilitychange",on);
198:     return {ms(){return spent+(away?0:Date.now()-since);},stop(){doc?.removeEventListener?.("visibilitychange",on);}};
199:   }
200:   // r91 B23-02 (Codex P2 on #1353): the start's cap reads that clock every time it wakes, so a phone hidden part-way through a try
201:   // neither restarts the budget nor uses it up. Like rrsVisibleWait, a timer that fires much later than asked (the main thread was
202:   // held by the scene's shader build) looks again shortly after instead of failing a page that was busy, not stuck.
203:   function rrsBudgetWait(clock,budget,onTimeout){
204:     const doc=rrsDoc();let timer=null,stopped=false,due=0,graced=false;
205:     const arm=wait=>{due=Date.now()+wait;timer=root.setTimeout(check,wait);};
206:     const check=()=>{if(stopped)return;const left=budget-clock.ms();
207:       const away=Boolean(doc&&doc.visibilityState==="hidden");if(left>250||away){arm(away?1000:left);return;}
208:       if(!graced&&Date.now()-due>1000){graced=true;arm(2000);return;}
209:       stop();onTimeout();};
210:     const stop=()=>{stopped=true;root.clearTimeout(timer);};
211:     arm(Math.max(250,budget-clock.ms()));
212:     return stop;
213:   }
214:   function rrsRemoveStage(){const stage=rrsDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
215:   function rrsCreateStage(ctx){
216:     const doc=rrsDoc();rrsRemoveStage();
217:     const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Roster Russian Roulette");
218:     stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
219:     const frame=doc.createElement("iframe");frame.title="Roster Russian Roulette";
220:     const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
221:     frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${encodeURIComponent(ctx.clubs.playerOne)}&n=${encodeURIComponent(ctx.clubs.playerTwo)}`;
222:     frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
223:     stage.append(frame);doc.body.append(stage);
224:     return {stage,frame};
225:   }
226:   function rrsListen(frame,clock){
227:     const origin=root.location&&root.location.origin;let onReady,onDone,onArmed;
228:     const ready=new Promise(resolve=>{onReady=resolve;}),done=new Promise(resolve=>{onDone=resolve;}),armed=new Promise(resolve=>{onArmed=resolve;});
229:     const handler=event=>{
230:       if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
231:       if(event.data.type==="cms-rr-loading")renew();
232:       else if(event.data.type==="cms-rr-ready")onReady("ready");
233:       else if(event.data.type==="cms-rr-armed")onArmed("armed");
234:       else if(event.data.type==="cms-rr-error"){const why=event.data.webgl===false?"nowebgl":"error";onReady(why);onArmed(why);onDone(why);}
235:       else if(event.data.type==="cms-rr-continue")onDone("continue");
236:     };
237:     root.addEventListener("message",handler);
238:     // A page that loads without its 3D library, or not at all, is dropped at once instead of after the full wait.
239:     frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
240:     frame.addEventListener("error",()=>onReady("error"));
241:     let stopWait=rrsVisibleWait(MAX_LOADING_MS,()=>onReady("timeout")),started=false;
242:     const stopCap=rrsBudgetWait(clock,COLD_LOADING_MS,()=>onReady("timeout"));
243:     // r90 Light: the "still busy" pings also keep the wait for "armed" open (the page draws the boards and its first frame)
244:     let armedWait=null;
245:     function renew(){if(armedWait){armedWait.renew();return;}if(started)return;stopWait();stopWait=rrsVisibleWait(MAX_LOADING_MS,()=>onReady("timeout"));}
246:     const stopAll=()=>{started=true;stopWait();stopCap();};
247:     function waitArmed(){let stop=()=>{};const timedOut=new Promise(resolve=>{const arm=()=>{stop();stop=rrsVisibleWait(ARMED_WAIT_MS,()=>resolve("timeout"));};armedWait={renew:arm};arm();});
248:       return Promise.race([armed,timedOut]).finally(()=>{stop();armedWait=null;});}
249:     return {ready:ready.finally(stopAll),armed:waitArmed,done,stop(){root.removeEventListener("message",handler);stopAll();if(armedWait)armedWait.renew=()=>{};}};
250:   }
251:   // "watched" when both spins played to the end, "skipped" when the page could not run (the result still shows).
252:   // One try: a fresh frame, its page loaded, ready and armed with this season's spins. Resolves to the frame, or to why not.
253:   async function rrsSceneTry(ctx,plan,clock){
254:     let channel=null,stage=null,frame=null;
255:     try{
256:       ({stage,frame}=rrsCreateStage(ctx));channel=rrsListen(frame,clock);
257:       const started=await Promise.race([channel.ready,endSignal]);
258:       if(started!=="ready")throw new Error(started);
259:       const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,position:p.positions[0]||null,name:p.name||"EMPTY SLOT",special:p.special===true,rating:p.name&&p.rating>0?p.rating:null,number:p.name&&Number.isInteger(p.number)?p.number:null}));
260:       // The whole spin plan (red team R87-C-06): the scene loads bulletChamber, stops on stopChamber and aims at hitSlot
261:       // (a safe turn at aimSlot), so both phones show the same chambers and the same player.
262:       const turns=plan.turns.map(turn=>({fire:turn.fired,target:turn.player?turn.player.name:null,targetLabel:turn.player?rrsPlayerLabel(turn.player):null,targetNumber:turn.player?rrsPlayerFacts(turn.player).number:null,targetPosition:turn.player?rrsPlayerFacts(turn.player).position:null,targetRating:turn.player?rrsPlayerFacts(turn.player).rating:null,bulletChamber:turn.bulletChamber,stopChamber:turn.stopChamber,hitSlot:turn.hitSlot,aimSlot:turn.aimSlot,loadedChambers:Array.isArray(turn.loadedChambers)?[...turn.loadedChambers]:null}));
263:       frame.contentWindow.postMessage({type:"cms-rr-setup",d:ctx.clubs.playerOne,n:ctx.clubs.playerTwo,boards:{D:boardOf("playerOne"),N:boardOf("playerTwo")},formations:{D:plan.formations.playerOne,N:plan.formations.playerTwo},turns,seed:rrsSeed(ctx)},root.location.origin);
264:       // Red team RT5-FLOW-01: the stage stays hidden until the page says it took the setup ("cms-rr-armed"). A page that
265:       // drops it (its squads file failed) or goes quiet for ARMED_WAIT_MS is removed and built again (or the result panel shows).
266:       const armed=await Promise.race([channel.armed(),endSignal]);
267:       if(armed!=="armed")throw new Error(armed);
268:       return {channel,stage,frame};
269:     }catch(error){if(channel)channel.stop();rrsRemoveStage();return {failed:String(error&&error.message||"error")};}
270:   }
271:   async function rrsScene(ctx,plan){
272:     // The loading screen (held since START) covers a card left from a TRY AGAIN; the card goes now, so it can never stand over
273:     // the scene with dead buttons (Fable F2-03).
274:     if(rrsEnded())return "skipped";
275:     rrsLoadingOn();rrsRemovePanel();
276:     // r90 Light: a page that broke, hung or loaded without three.js is built once more in a fresh frame (a cold Chromebook's
277:     // second start is warm: files and shaders are cached); only a device without WebGL 2 is skipped for the rest of this visit.
278:     // r91 B23-02: COLD_LOADING_MS is the budget of the whole start, both tries together. Each try used to get its own 4 minutes,
279:     // so a page that was slow but still reporting progress (software GL after a GPU crash) held the loading screen about 8 minutes
280:     // before the card. A fresh frame is built only while at least RETRY_MIN_MS of the budget is left, and it gets what is left.
281:     const shownAt=Date.now(),clock=rrsVisibleClock();let run=null;
282:     for(let attempt=1;attempt<=SCENE_TRIES;attempt++){
283:       const budget=COLD_LOADING_MS-clock.ms();if(attempt>1&&budget<RETRY_MIN_MS)break;
284:       run=await rrsSceneTry(ctx,plan,clock);
285:       if(!run.failed)break;
286:       if(run.failed==="nowebgl"){clock.stop();sceneFailedHere.add(rrsKey(ctx));return "skipped";}// the result card takes over from the loading screen
287:       if(rrsEnded()){clock.stop();return "skipped";}
288:     }
289:     clock.stop();
290:     if(run.failed)return "skipped";
291:     const {channel,stage,frame}=run;
292:     const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await rrsWait(left);
293:     if(rrsEnded()){channel.stop();rrsRemoveStage();return "skipped";}
294:     stage.style.visibility="visible";
295:     rrsLoadingOff();
296:     try{frame.focus();}catch(_error){}
297:     // r90 Light: a lost GPU context no longer ends the scene; the page rebuilds itself when the context comes back and says
298:     // cms-rr-error only if it never does (then the card, never a dead frame: F11-11).
299:     const end=await Promise.race([channel.done,endSignal]);channel.stop();
300:     if(rrsEnded()){rrsRemoveStage();return "skipped";}
301:     if(end!=="continue"){if(end==="nowebgl")sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();return "skipped";}
302:     return "watched";
303:   }
304: 
305:   // ---------- the result and the release ----------
306:   // Codex C2-01: a name alone does not tell namesakes apart (Alavés has a Manu García #19 and #26), so the release names the
307:   // shirt number (when the squad lists one), the position and the overall.
308:   function rrsPlayerFacts(p){
309:     const number=Number.isInteger(p&&p.number)?p.number:null,position=(p&&Array.isArray(p.positions)&&p.positions[0])||(p&&p.pos&&p.pos!=="SUB"?p.pos:null),rating=p&&Number.isInteger(p.rating)&&p.rating>0?p.rating:null;
310:     return {number,position,rating};
311:   }
312:   function rrsPlayerLabel(p){
313:     const f=rrsPlayerFacts(p),parts=[f.number!==null?`#${f.number}`:null,f.position,f.rating!==null?`${f.rating} overall`:null].filter(Boolean);
314:     return parts.length?`${p.name} (${parts.join(", ")})`:String(p.name);
315:   }
316:   function rrsOutcomeLine(turn){return turn.fired?`${NAMES[turn.role]} lost ${rrsPlayerLabel(turn.player)}.`:`${NAMES[turn.role]}: empty chamber. Squad safe.`;}
317:   // r88 Chamber Men: how many live rounds each cylinder held, and whose goals loaded them.
318:   function rrsChamberLine(turn){
319:     const live=Array.isArray(turn.loadedChambers)?turn.loadedChambers.length:null;if(live===null)return null;
320:     return `${NAMES[turn.role]}'s cylinder held ${live} live ${live===1?"round":"rounds"} of 7 (${NAMES[rrsOther(turn.role)]}'s Chamber Men goals).`;
321:   }
322:   // F2-19 (Fable job 2): a kept signing the board rules keep off is said in one line, never dropped silently. Signings are known
323:   // by name only, so a name the roulette shot, a Special Player's, or a guessed and released signing's keeps him off the board.
324:   const RRS_SKIP_WHY=Object.freeze({
325:     shot:name=>`the roulette shot a ${name}, and a shot player never comes back.`,
326:     special:name=>`${name} is a Special Player's name, and a Special Player is never on a board.`,
327:     guessed:name=>`a ${name} was guessed and released in the Transfer War, and a released player stays off the board.`,
328:     reserve:name=>`${name} waits in your reserves: every starter in his line and every sub has a higher overall.`});
329:   function rrsSkippedLines(plan,role){
330:     const list=plan&&plan.skipped&&Array.isArray(plan.skipped[role])?plan.skipped[role]:[];
331:     return list.filter(item=>item&&typeof item.name==="string"&&RRS_SKIP_WHY[item.reason]).map(item=>`${item.name} (signed in season ${item.season}) is not on your board: ${RRS_SKIP_WHY[item.reason](item.name)}`);
332:   }
333:   async function rrsResult(ctx,plan){
334:     const mine=plan.turns.find(turn=>turn.role===ctx.managerRole);
335:     const lines=[...plan.turns.map(rrsChamberLine).filter(Boolean),...plan.turns.map(rrsOutcomeLine),...rrsSkippedLines(plan,ctx.managerRole)];
336:     const choice=mine.fired
337:       ?await rrsAsk(ctx,{heading:`Release ${mine.player.name}${Number.isInteger(mine.player.number)?` #${mine.player.number}`:""}`,label:"Release your player",lines,
338:         note:`Release ${rrsPlayerLabel(mine.player)} in your FIFA 17 save now, before the Transfer War. The game cannot do it for you.`,
339:         buttons:[{id:"go",label:"I HAVE RELEASED HIM",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]})
340:       :await rrsAsk(ctx,{heading:"Your squad is safe",label:"Your squad is safe",lines,note:"Your squad stays as it is this season.",
341:         buttons:[{id:"go",label:rrsNextLabel(ctx),primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
342:     return choice==="go";
343:   }
344: 
345:   // Nik 2026-11-02: the button names the screen that really comes next: this season's Prime Pack when it applies here (the
346:   // Transfer Challenge's own gate, ctx.primePackNext), else the Transfer War.
347:   function rrsNextLabel(ctx){let prime=false;try{prime=typeof ctx.primePackNext==="function"&&ctx.primePackNext()===true;}catch(_error){}return prime?"GO TO THE PRIME PACK":"GO TO THE TRANSFER WAR";}
348: 
349:   // ---------- F2-02 / F2-10: the spin marks on the server ----------
350:   // ctx.marks = this season's marks as the Transfer Challenge read them ({playerOne, playerTwo}: true, an outcome, or null), or
351:   // null once the window opened (both managers had spun: START needs both marks). An outcome is {fired, hitName, hitNumber,
352:   // hitSlot, hitSignedSeason, version}.
353:   function rrsOutcomeOf(entry){return entry&&typeof entry==="object"&&typeof entry.fired==="boolean"&&typeof entry.version==="string"?entry:null;}
354:   function rrsSpunOnServer(ctx){return ctx.windowStarted===true||Boolean(ctx.marks&&ctx.marks[ctx.managerRole]);}
355:   // F2-02: the partner spun this season on a different version of the game (another build, or other squad data), so the two
356:   // phones could show different players. Said plainly, never a silent desync. TRY AGAIN reads the marks again (after either
357:   // phone was updated); the partner's saved spin stands for him either way, so CONTINUE goes on with it as the authority.
358:   async function rrsVersionStop(ctx,version){
359:     for(;;){
360:       const partner=rrsOutcomeOf(ctx.marks&&ctx.marks[rrsOther(ctx.managerRole)]);
361:       if(!version||!partner||partner.version===version||rrsSpunOnServer(ctx)&&ctx.marks&&ctx.marks[ctx.managerRole])return true;
362:       const name=NAMES[rrsOther(ctx.managerRole)];
363:       const choice=await rrsAsk(ctx,{heading:"Update the game on the other phone",label:"Update the game on the other phone",
364:         lines:[`${name} spun this season's roulette on a different version of the game, so the two phones could show different players.`,`Update the game on ${name}'s phone: close it fully and open it again. If yours is the one behind, do the same on yours. Then tap TRY AGAIN.`],
365:         note:`Your version: ${version} · ${name}'s spin: ${partner.version}. ${name}'s saved spin stands for him either way.`,
366:         buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"continue",label:`CONTINUE WITH ${name.toUpperCase()}'S SAVED SPIN`},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
367:       if(choice==="back")return false;
368:       if(choice==="continue")return true;
369:       if(typeof ctx.refreshMarks==="function"){try{const next=await ctx.refreshMarks();if(next&&typeof next==="object"){ctx.marks=next.marks===undefined?ctx.marks:next.marks;ctx.windowStarted=next.windowStarted===true;}}catch(_error){}}
370:     }
371:   }
372: 
373:   // Fable F17-01: an earlier season of a Chamber Men Showdown whose spin marks hold no saved outcome for a manager (the roulette
374:   // was switched off that day, or the outcome was lost before the mark went in) replays from that season's own shootout: its
375:   // cylinders (this phone's kept copy, else one read), or one bullet when that season has no finished shootout (Chamber Men was
376:   // switched off then, so its roulette spun one bullet). Seasons with both outcomes saved read nothing. Returns the chambers for
377:   // the engine; null when he went back to Showdown Home from a failed read.
378:   async function rrsEarlierChambers(ctx,engine,hits,chamber){
379:     const chambers={...(chamber.chambers||{})};
380:     for(let k=1;k<ctx.season;k+=1){
381:       if(chambers[k]||ROLES.every(role=>engine.savedHit(hits,k,role))||typeof chamber.earlier!=="function")continue;
382:       for(;;){
383:         let result=null;try{result=await chamber.earlier(k);}catch(_error){result=null;}
384:         if(result&&result.ok===true&&result.chambers){chambers[k]=result.chambers;break;}
385:         if(result&&result.reason==="NOT_FINISHED"){chambers[k]=Object.freeze({oneBullet:true});break;}
386:         if(result&&result.reason==="BAD_RECORD")break;// no plan: the card names the season
387:         const choice=await rrsAsk(ctx,{heading:"Building the boards",label:"Building the boards",lines:[`Season ${k}'s Chamber Men result could not be read, and this season's boards replay Season ${k}'s spin from it. Try again when the connection is back.`],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
388:         if(choice==="back")return null;
389:       }
390:     }
391:     return chambers;
392:   }
393:   // Fable F2-04: why no plan could be built, in words a manager can act on (the engine only answers null).
394:   function rrsNoPlanReason(ctx,engine,history,earlier){
395:     for(const role of ROLES){
396:       const club=ctx.clubs[role];
397:       if(!engine.board(club)||!root.CareerModeFifa17Players?.clubs?.[club])return `There is no FIFA 17 squad for ${club} in this version of the app, so this season's boards cannot be built. Nothing was spun or saved.`;
398:     }
399:     for(let k=1;k<ctx.season;k+=1)if(!history[k]||!ROLES.every(role=>Array.isArray(history[k][role])))return `Season ${k}'s Transfer War verdicts could not be used to build this season's boards. Nothing was spun or saved.`;
400:     // Fable F17-01: a Chamber Men season with neither a saved spin nor a usable shootout.
401:     if(earlier)for(let k=1;k<ctx.season;k+=1)if(!earlier.chambers[k]&&!ROLES.every(role=>engine.savedHit(earlier.hits,k,role)))return `Season ${k}'s roulette spin was not saved and its Chamber Men result could not be used to replay it, so this season's boards cannot be built. Nothing was spun or saved.`;
402:     return "This season's boards could not be built. Nothing was spun or saved.";
403:   }
404:   async function rrsRun(ctx){
405:     if(!rrsDecide(ctx)||!rrsDoc())return true;
406:     // Nik 2026-11-02 (order audit): the Transfer War already started after this season's Prime Pack, so this roulette was
407:     // finished before it (both phones pass it to reach the Prime Pack): a fresh browser never shows its finished card again.
408:     if(ctx.passed===true){rrsMark(DONE_KEY,rrsKey(ctx));return true;}
409:     rrsLoadingOn();
410:     while(!await rrsEnsure()){
411:       const choice=await rrsAsk(ctx,{heading:"Loading the roulette",label:"Loading the roulette",lines:["The roulette could not load. Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
412:       if(choice==="back")return false;
413:     }
414:     if(rrsEnded())return false;
415:     const engine=root.CareerModeRosterRoulette,key=rrsKey(ctx),special=rrsSpecial(ctx);
416:     const version=typeof engine.version==="function"?engine.version(ctx.clubs,{special,sheets:ctx.squads||null}):null;
417:     if(!await rrsVersionStop(ctx,version)||rrsEnded())return false;
418:     const hits={};
419:     // r91 Squad Management: with both locked squads as this season's boards, nothing earlier is replayed, so the earlier
420:     // seasons' verdicts and shootouts are not read.
421:     const squads=ctx.squads&&typeof ctx.squads==="object"?ctx.squads:null;
422:     const history=ctx.season>1&&!squads?await rrsHistory(ctx,hits):[null];if(!history||rrsEnded())return false;
423:     // This season: a saved mark (this manager's own on a second browser, the partner's always) is the authority for that turn.
424:     hits[ctx.season]=Object.fromEntries(ROLES.map(role=>[role,rrsOutcomeOf(ctx.marks&&ctx.marks[role])]));
425:     // Never skipped (Nik 2026-10-31): a short squad shows empty slots and the bullet only hits a real player. A club the data
426:     // does not know is named before the engine runs (Fable S4); no plan is never marked done (Fable F2-04): the window stays
427:     // shut and the card says why, with the way back to Showdown Home.
428:     const known=ROLES.every(role=>engine.board(ctx.clubs[role])&&root.CareerModeFifa17Players?.clubs?.[ctx.clubs[role]]);
429:     // r88 Chamber Men: this season's two cylinders from the shootout (ctx.chamberMen), never one bullet in such a Showdown.
430:     const chamber=ctx.chamberMen&&ctx.chamberMen.active===true?ctx.chamberMen:null;
431:     const chambers=chamber&&known?(squads?{...(chamber.chambers||{})}:await rrsEarlierChambers(ctx,engine,hits,chamber)):null;if(chamber&&known&&!chambers)return false;if(rrsEnded())return false;
432:     const plan=known?engine.forSeason(ctx.rivalryId,ctx.clubs,ctx.season,{special,history,hits,chamberMen:Boolean(chamber),chambers:chamber?chambers:null,sheets:squads}):null;
433:     if(!plan||plan.turns.some(turn=>turn.fired&&!turn.player)){
434:       const reason=plan?"This season's spin could not find the player it hit. Nothing was spun or saved.":rrsNoPlanReason(ctx,engine,history,chamber?{chambers,hits}:null);
435:       await rrsAsk(ctx,{heading:"No roulette board",label:"No roulette board",lines:[reason],note:"The Transfer War stays shut until this season's roulette can run.",buttons:[{id:"back",label:"BACK TO SHOWDOWN HOME",primary:true}]});
436:       return false;
437:     }
438:     // F2-10: the server already holds this manager's spin for this season (another browser or tab, or cleared storage): the
439:     // result card shows it at once, with no second spin.
440:     const spun=rrsSpunOnServer(ctx);
441:     if(spun)rrsMark(WATCHED_KEY,key);
442:     if(!spun&&!rrsHas(WATCHED_KEY,key)&&!sceneFailedHere.has(key)){
443:       const scene=await rrsScene(ctx,plan);
444:       if(rrsEnded())return false;
445:       if(scene==="watched")rrsMark(WATCHED_KEY,key);
446:     }
447:     const go=await rrsResult(ctx,plan);
448:     if(!go||rrsEnded())return false;
449:     // F2-02: the outcome this manager's mark records (only while the server has none for him this season).
450:     if(!spun&&typeof ctx.remember==="function"&&typeof engine.outcome==="function"){try{ctx.remember(engine.outcome(plan,ctx.managerRole,version));}catch(_error){}}
451:     rrsMark(DONE_KEY,key);
452:     return true;
453:   }
454:   // An unexpected error asks TRY AGAIN / BACK; the same seeded plan is rebuilt on retry and nothing is marked done.
455:   async function rrsRunGuarded(ctx){
456:     for(;;){
457:       try{return await rrsRun(ctx);}
458:       catch(_error){
459:         rrsRemoveStage();if(rrsEnded())return false;
460:         const choice=await rrsAsk(ctx,{heading:"The roulette hit a problem",label:"The roulette hit a problem",lines:["This season's spins could not be built. Nothing was spun or saved."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
461:         if(choice==="back")return false;
462:       }
463:     }
464:   }
465:   // Resolves true when the Transfer Challenge may open, false when the manager went back to Showdown Home (or the step could
466:   // not even show its panel). Never rejects, and never opens the Transfer Challenge without this season's result.
467:   // The panel and the stage stay up until close() so nothing shows between them and the next screen.
468:   function rrsRunBeforeTransfers(ctx){
469:     if(running)return running;
470:     leftForHome=false;holding=true;runGen=endGen;runRivalry=String(ctx&&ctx.rivalryId||"").trim().toLowerCase();
471:     endSignal=new Promise(resolve=>{endWake=()=>resolve("ended");});
472:     const gen=runGen;
473:     const run=Promise.resolve().then(()=>rrsRunGuarded(ctx)).catch(()=>false).then(go=>{
474:       // E1: ended by the partner's END SHOWDOWN: end() already took the card and the stage down and Terminal Close shows Home
475:       // with its notice; nothing here navigates or shows the loading screen over it.
476:       if(gen!==endGen){leftForHome=true;holding=false;return false;}
477:       // Fable F11-08 (Reus Gate): the roulette and the loading screen stay up until Showdown Home is on screen, so Career Start
478:       // or the Club screen never flashes in between. A new run started meanwhile keeps its own panel and stage.
479:       if(go===false){leftForHome=true;holding=false;rrsLoadingOn();const tear=()=>{if((running&&running!==run)||holding)return;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();};
480:         if(typeof root.navigateTo==="function")void Promise.resolve().then(()=>root.navigateTo("mainMenu")).catch(()=>{}).finally(tear);else tear();}
481:       return go!==false;
482:     }).finally(()=>{if(running===run)running=null;});
483:     running=run;return run;
484:   }
485:   function rrsClose(){holding=false;rrsRemovePanel();rrsRemoveStage();rrsLoadingOff();return true;}
486:   // E1: the partner ended this Showdown (Terminal Close). A run for another Showdown is left alone (false).
487:   function rrsEnd(rivalryId){
488:     const id=String(rivalryId||"").trim().toLowerCase();if(running&&id&&runRivalry&&id!==runRivalry)return false;
489:     endGen+=1;const ask=askEnd,wake=endWake;askEnd=null;endWake=null;
490:     try{ask?.();}catch(_error){}try{wake?.();}catch(_error){}
491:     rrsClose();return true;
492:   }
493:   // Red team R87-SP-02: for the Transfer War signing form, is a typed name this manager's own Special Player? The draw is
494:   // loaded before every window opens (ensureDraw, also when the roulette is already done here: Fable F2-06); false when the
495:   // Showdown has none.
496:   function rrsIsOwnSpecial(rivalryId,confirmedAtMs,role,name,clubs){
497:     const draw=root.CareerModeMarqueePlayer;
498:     try{return Boolean(draw&&typeof draw.isOwnSpecial==="function"&&draw.isOwnSpecial(rivalryId,confirmedAtMs,role,name,clubs));}catch(_error){return false;}
499:   }
500:   // For the screens that open the Transfer Challenge: a roulette is on screen (its pace is the manager's, so no load timeout
501:   // may end it), and whether the last one ended with the manager going back to Showdown Home (not a failure).
502:   function rrsActive(){return Boolean(running)||holding;}
503:   function rrsWentHome(){return leftForHome;}
504:   // Fable F2-11: a new open forgets an earlier BACK, so a later failure that never reached the roulette is not read as one.
505:   function rrsForgetHome(){leftForHome=false;return true;}
506: 
507:   return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,decide:rrsDecide,nextLabel:rrsNextLabel,special:rrsSpecial,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,end:rrsEnd,active:rrsActive,wentHome:rrsWentHome,forgetHome:rrsForgetHome,ensureDraw:rrsEnsureDraw,isOwnSpecial:rrsIsOwnSpecial,earlierChambers:rrsEarlierChambers});
508: });
509: 
```

## FILE: js/rosterRoulette.js (512 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeRosterRoulette=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   // r87 Roster Russian Roulette (Nik 2026-10-28/29/30): every season, after Career Start and before the transfer window,
9:   // each manager spins a seven-chamber revolver (six empty, one bullet). Daniel spins first, then Nik. It fires exactly
10:   // when the cylinder stops on the bullet (1 in 7), and a fired shot always hits one player on that manager's board
11:   // (starting XI + 4 subs); he releases that player in FIFA 17. Like the Special Player draw, every result is read from
12:   // the Showdown's own Firebase id (64 random hex digits, the same on both phones): no read, no Rules lookup, and a refresh
13:   // or a second tap can never re-spin.
14:   // Contract v4: always a full formation XI + 4 subs, with hidden local reserves. Shots permanently
15:   // remove a player; kept signings, the bench and reserves replace him before the next board is returned.
16:   // Both managers' Special Players are excluded from both boards and both reserve pools (red team R87-C-01), and all 15
17:   // slots keep the same target chance.
18:   const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
19:   const ROLES=Object.freeze(["playerOne","playerTwo"]); // turn order: Daniel (Player One) first
20:   const CHAMBERS=7;
21:   const XI_SIZE=11;
22:   const BOARD_SIZE=15;
23:   const MAX_SEASONS=10;
24:   const OVERALL_MIN=30,OVERALL_MAX=99;
25:   // F2-02 (Fable job 2): the engine revision. Bump it whenever a board or a shot can come out differently for the same
26:   // Showdown, season and history (tests/contracts/r87-roulette-hits-contracts.cjs pins it to this file's text). It is part of
27:   // the version string each manager's spin mark carries (rrVersion), so two phones on different builds are told so.
28:   const ENGINE_REVISION=3;
29:   const POSITIONS=Object.freeze(["GK","SW","RWB","RB","RCB","CB","LCB","LB","LWB","RDM","CDM","LDM","RM","RCM","CM","LCM","LM","RAM","CAM","LAM","RF","CF","LF","RW","RS","ST","LS","LW","SUB"]);
30: 
31:   function rrSquads(){
32:     const data=root.CareerModeRosterSquads||(typeof module!=="undefined"&&module.exports?require("../data/rosterSquads.js"):null);
33:     return data&&data.squads?data:null;
34:   }
35:   function rrPlayers(){
36:     return root.CareerModeFifa17Players||(typeof module!=="undefined"&&module.exports?require("../data/fifa17Players.js"):null);
37:   }
38:   const rrRow=(slot,pos,name,extra)=>Object.freeze({slot,bench:slot>=XI_SIZE,pos,name,...extra});
39:   // The launch board as the club's FIFA 17 squad lists it: XI first (slots 0-10), then the 4 subs (slots 11-14).
40:   function rrBoard(club){
41:     const data=rrSquads(),squad=data&&Object.prototype.hasOwnProperty.call(data.squads,club)?data.squads[club]:null;
42:     if(!squad||!rrPlayers())return null;
43:     return Object.freeze([...squad.xi,...squad.subs].map(([pos,name,number,rating],i)=>rrRow(i,i<XI_SIZE?pos:"SUB",name,{number,rating,positions:rrPlayerPositions(name,club,number),special:false,signedSeason:null})));
44:   }
45:   const rrOverall=value=>Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;
46:   // Identity (red team R87-C-05, Sol SQ-4-01): names compare with accents folded, trimmed and lower-cased ("M. Ozil" =
47:   // "M. Özil"; no initials guessing). There are two kinds of people and they never match each other:
48:   // - a club player (a database row of the manager's own club, signedSeason null) is one person by (name, shirt number),
49:   //   so Alavés' two Manu García rows stay two people;
50:   // - a Transfer War signing (signedSeason set, no shirt number) is one person by name among that manager's signings.
51:   // A manager never buys his own player, so a signing who shares a name with a club player is a namesake from another
52:   // club (WBA's J. Ward is not Palace's J. Ward). Guessing, shooting or re-entering a signing never touches a club player.
53:   const rrKeys=new Map();
54:   function rrKey(name){
55:     const text=String(name||"");let key=rrKeys.get(text);
56:     if(key===undefined){key=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();if(rrKeys.size<20000)rrKeys.set(text,key);}
57:     return key;
58:   }
59:   const rrNumber=p=>Number.isInteger(p&&p.number)?p.number:null;
60:   const rrSigning=p=>Boolean(p)&&p.signedSeason!==null&&p.signedSeason!==undefined;
61:   // One identity string per person: "s|name" for a signing, "c|name#shirt" for a club player.
62:   const rrId=p=>rrSigning(p)?`s|${rrKey(p.name)}`:`c|${rrKey(p.name)}#${rrNumber(p)}`;
63:   const rrSame=(a,b)=>rrId(a)===rrId(b);
64:   // Plain code-point order: identical on every phone (localeCompare depends on the browser's ICU data).
65:   const rrCmp=(a,b)=>a<b?-1:a>b?1:0;
66:   // Equal overalls rank by a stable identity, never by the Transfer War entry slot (red team R87-C-04).
67:   const rrOrder=(a,b)=>b.rating-a.rating||rrCmp(rrKey(a.name),rrKey(b.name))||rrCmp(a.positions[0]||"",b.positions[0]||"")||rrCmp(a.name,b.name);
68:   // A 32-bit stream seeded from the id, the season and the role (xmur3 + mulberry32). Synchronous, so the screen
69:   // can show the result the moment the trigger is pulled; the id itself is the randomness.
70:   function rrStream(hex,season,role){
71:     const text=`rrr-v1|${hex}|${season}|${role}`;
72:     let h=1779033703^text.length;
73:     for(let i=0;i<text.length;i+=1){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
74:     let a=(()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;})();
75:     return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0);};
76:   }
77:   // Who can be hit: every filled slot except the Special Player, each with the same chance.
78:   const rrTargets=board=>board.filter(p=>p.name&&!p.special).map(p=>p.slot);
79:   // One manager's turn in one season. The bullet sits in one chamber, the cylinder stops on one chamber; it fires only
80:   // when they match (exactly 1 in 7). The animation must settle on stopChamber. A fired turn hits one target slot.
81:   // aimSlot is where the barrel points when it stops (red team R87-C-06): the hit slot, or for a safe turn the same
82:   // third draw on the same target list, so both phones aim at the same player with no extra randomness.
83:   // r88 Chamber Men (js/chamberMen.js): in a Showdown that plays it, loaded is this manager's own cylinder for the season,
84:   // 7 booleans (chamber k live when the rival's kick k went in). The stream is drawn exactly as before (so aimSlot never
85:   // changes); the bullet chamber is then unused and it fires when the cylinder stops on any live chamber: rival's goals
86:   // out of 7. loadedChambers lists the live chambers for the scene (null in a one-bullet Showdown).
87:   function rrTurn(hex,season,role,board,loaded=null){
88:     const next=rrStream(hex,season,role);
89:     const seededBullet=next()%CHAMBERS,stopChamber=next()%CHAMBERS,pick=next(),targets=rrTargets(board);
90:     const live=rrLoaded(loaded),loadedChambers=live?live.map((on,i)=>on?i:-1).filter(i=>i>=0):null;
91:     const bulletChamber=live?(live[stopChamber]?stopChamber:(loadedChambers.length?loadedChambers[0]:seededBullet)):seededBullet;
92:     const fired=(live?live[stopChamber]:seededBullet===stopChamber)&&targets.length>0,aimSlot=targets.length?targets[pick%targets.length]:null;
93:     return {role,season,bulletChamber,stopChamber,fired,hitSlot:fired?aimSlot:null,aimSlot,loadedChambers:loadedChambers?Object.freeze(loadedChambers):null};
94:   }
95:   // A Chamber Men cylinder: exactly 7 booleans, else null.
96:   function rrLoaded(value){return Array.isArray(value)&&value.length===CHAMBERS&&value.every(item=>typeof item==="boolean")?value:null;}
97:   // options.chambers[k][role] for season k (a Chamber Men Showdown), or null.
98:   function rrCylinder(chambers,season,role){const c=chambers&&chambers[season];return c?rrLoaded(c[role]):null;}
99:   // Fable F17-01: options.chambers[k] = {oneBullet:true} for an earlier season of a Chamber Men Showdown that has no finished
100:   // shootout (the screen was switched off that season), so its roulette spun one bullet and replays from the seed.
101:   function rrOneBullet(chambers,season){const c=chambers&&chambers[season];return Boolean(c&&c.oneBullet===true);}
102:   // Player positions travel with the player; pos remains the formation slot even after a substitution.
103:   // Name ambiguity: prefer the same shirt at the manager's launch club, then the club, then catalog/source order.
104:   // Preserve the source's short_name.
105:   const byName=new Map();
106:   let indexed=false;
107:   function rrPlayerPositions(name,club,number=null){
108:     const database=rrPlayers();
109:     if(!indexed&&database){
110:       for(const [sourceClub,data] of Object.entries(database.clubs))for(const row of data.players){
111:         const key=rrKey(row[0]),matches=byName.get(key)||[];
112:         matches.push({club:sourceClub,number:row[4],positions:row[2]});byName.set(key,matches);
113:       }
114:       indexed=true;
115:     }
116:     const matches=byName.get(rrKey(name));
117:     return matches?(matches.find(p=>p.club===club&&p.number===number)||matches.find(p=>p.club===club)||matches[0]).positions:Object.freeze([]);
118:   }
119:   // A signing comes from another club, so a namesake elsewhere wins over the manager's own player.
120:   function rrSigningPositions(name,club){
121:     rrPlayerPositions(name,club);
122:     const matches=byName.get(rrKey(name));
123:     return matches?(matches.find(p=>p.club!==club)||matches[0]).positions:Object.freeze([]);
124:   }
125:   const SIGNING_POSITIONS=new Set(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
126:   function rrLine(pos){
127:     if(pos==="GK")return "GK";
128:     if(["CB","LCB","RCB","SW"].includes(pos))return "CB";
129:     if(["RB","RWB"].includes(pos))return "RB";
130:     if(["LB","LWB"].includes(pos))return "LB";
131:     if(["CDM","RDM","LDM","CM","RCM","LCM","CAM","RAM","LAM"].includes(pos))return "CM";
132:     if(["RM","RW"].includes(pos))return "RW";
133:     if(["LM","LW"].includes(pos))return "LW";
134:     if(["ST","CF","RS","LS","RF","LF"].includes(pos))return "ST";
135:     return null;
136:   }
137:   // Positional fit only decides eligibility (red team R87-C-03): 1 = one of his positions is in the slot's line, 0 = not
138:   // (or a sub-only player with no known position). Among eligible players the overall decides.
139:   function rrFit(player,pos){
140:     const line=rrLine(pos);
141:     return line&&player.positions.some(position=>rrLine(position)===line)?1:0;
142:   }
143:   // Nik 2026-10-31: a club that has run out of players keeps an EMPTY slot (no name, rating 0); the roulette still runs
144:   // and the bullet only ever hits a filled slot (rrTargets).
145:   const rrEmpty=slot=>rrRow(slot.slot,slot.pos,null,{number:null,rating:0,positions:Object.freeze([]),special:false,signedSeason:null});
146:   const rrPlace=(slot,player)=>player?rrRow(slot.slot,slot.pos,player.name,{number:player.number??null,rating:player.rating,positions:player.positions,special:false,signedSeason:player.signedSeason??null}):rrEmpty(slot);
147:   const rrRank=(a,b)=>b.rating-a.rating||(a.number??100)-(b.number??100);
148:   const rrDatabasePlayer=p=>({name:p[0],rating:p[1],positions:p[2],number:p[4],signedSeason:null});
149:   const rrOnBoard=(state,player)=>state.board.some(p=>p.name&&rrSame(p,player));
150:   // Who may never come back: shot players, guessed signings and both Special Players. One identity set holds them all
151:   // (rrId), and every path that puts a player on the board, the bench or the reserves asks rrExcluded, so a blocked
152:   // person can never return by any route. A guessed or shot signing blocks only that signing: his club namesake stays.
153:   // A shot club player blocks his own row and any later signing with his name (a released player could be bought back,
154:   // and a shot player never returns). A Special Player blocks his own club row (every row with his name when the draw has
155:   // no shirt number) and any signing with his name.
156:   function rrExclude(state,player){
157:     state.excluded.add(rrId(player));
158:     if(!rrSigning(player))state.excluded.add(`s|${rrKey(player.name)}`);
159:   }
160:   function rrExcludeSpecial(state,sp){
161:     const key=rrKey(sp.name);
162:     state.excluded.add(`s|${key}`);
163:     if(rrNumber(sp)===null)state.excludedClubNames.add(key);else state.excluded.add(`c|${key}#${rrNumber(sp)}`);
164:   }
165:   function rrExcluded(state,player){
166:     return state.excluded.has(rrId(player))||(!rrSigning(player)&&state.excludedClubNames.has(rrKey(player.name)));
167:   }
168:   function rrReserve(state,player){
169:     if(rrExcluded(state,player)||rrOnBoard(state,player)||state.reserves.some(p=>rrSame(p,player)))return;
170:     state.reserves.push(player);
171:   }
172:   // Database replacements use bundled data only. Never resurrect a shot player or a Special Player, and never pick a
173:   // row already on the board or in the reserves (one person = name + shirt number).
174:   function rrBestDatabase(state,predicate){
175:     const eligible=p=>
176:       predicate(p)&&!rrExcluded(state,p)&&!rrOnBoard(state,p)&&!state.reserves.some(r=>rrSame(r,p));
177:     return rrPlayers().clubs[state.club].players.map(rrDatabasePlayer).sort(rrRank).find(eligible)||null;
178:   }
179:   function rrNextReserve(state,predicate=()=>true){
180:     const next=rrBestDatabase(state,predicate);
181:     if(next)state.reserves.push(next);
182:     return next;
183:   }
184:   // Every refill takes the best available club player (red team RT5 Q2): the best of the reserves (hidden three, dropped
185:   // starters, parked signings) and the club's unused database players, by overall then lower shirt number, the build
186:   // script's tie rule. A weak player in the reserves never blocks a better unused club player.
187:   function rrTakeReserve(state,predicate=()=>true){
188:     let at=-1;
189:     // Fable F11-04: the reserves can still hold a person excluded after they were last filtered (a saved shot this build keeps
190:     // in the reserves); like every other route, this one never hands an excluded person back.
191:     for(let i=0;i<state.reserves.length;i+=1)if(!rrExcluded(state,state.reserves[i])&&predicate(state.reserves[i])&&(at<0||rrRank(state.reserves[i],state.reserves[at])<0))at=i;
192:     const next=rrBestDatabase(state,predicate);
193:     if(next&&(at<0||rrRank(next,state.reserves[at])<0))return next;
194:     // Replacements stay club-only: a club with no player left gets an empty slot (null), never a revived loss or an import.
195:     if(at<0)return null;
196:     const [player]=state.reserves.splice(at,1);
197:     return player;
198:   }
199:   // Strict improvements retain incumbents on ties. A displaced player stays in the local squad.
200:   // A shot sub's place goes to a kept signing of this window; a starter a signing displaced only goes to the bench when
201:   // he beats the weakest remaining sub (red team RT5 Q1), otherwise he joins the reserves, and the shot sub's place is
202:   // refilled afterwards with the best available club player (who may be him).
203:   function rrBench(state,player,signing=false){
204:     const board=state.board,benchVacancy=state.vacant!==null&&state.vacant>=XI_SIZE;
205:     const fillVacancy=()=>{board[state.vacant]=rrPlace(board[state.vacant],player);state.vacant=null;return true;};
206:     if(signing&&benchVacancy)return fillVacancy();
207:     let at=-1;
208:     for(let i=XI_SIZE;i<BOARD_SIZE;i+=1)if(i!==state.vacant&&(at<0||board[i].rating<board[at].rating))at=i;
209:     if(at<0&&benchVacancy)return fillVacancy();
210:     if(at<0||!(player.rating>board[at].rating)){rrReserve(state,player);return false;}
211:     if(benchVacancy)return fillVacancy();
212:     const replaced=board[at];board[at]=rrPlace(replaced,player);rrReserve(state,replaced);
213:     return true;
214:   }
215:   // A stopgap (Sol SQ-2-01): an XI player standing in a slot outside his line because nobody fitting was left, unless
216:   // he is the club's own FIFA 17 launch pick for that slot (the source puts some starters out of position on purpose).
217:   function rrStopgap(state,i){
218:     const current=state.board[i];
219:     if(i>=XI_SIZE||!current.name||rrFit(current,current.pos))return false;
220:     const launch=state.launch&&state.launch[i];
221:     return !(launch&&launch.name&&rrSame(launch,current));
222:   }
223:   // A kept signing starts only in a slot of his line: the shot player's slot, else the weakest compatible starter when
224:   // he is strictly better (equal weakest: the lower board slot). Otherwise the bench rule below.
225:   function rrJoin(state,player){
226:     if(rrExcluded(state,player)||rrOnBoard(state,player))return false;
227:     state.reserves=state.reserves.filter(p=>!rrSame(p,player));
228:     let at=state.vacant!==null&&state.vacant<XI_SIZE&&rrFit(player,state.board[state.vacant].pos)>0?state.vacant:-1;
229:     if(at<0){
230:       for(let i=0;i<XI_SIZE;i+=1){
231:         const current=state.board[i];
232:         if(i===state.vacant||!rrFit(player,current.pos))continue;
233:         // A stopgap (an outfielder in goal, R87-E-02, or any player outside his line, Sol SQ-2-01) gives way to any
234:         // fitting signing.
235:         const stopgap=rrStopgap(state,i);
236:         if(!stopgap&&!(player.rating>current.rating))continue;
237:         if(at<0||stopgap||current.rating<state.board[at].rating)at=i;
238:       }
239:     }
240:     if(at<0)return rrBench(state,player,true);
241:     const replaced=state.board[at];state.board[at]=rrPlace(replaced,player);
242:     if(at===state.vacant)state.vacant=null;
243:     else rrBench(state,replaced);
244:     return true;
245:   }
246:   // Replace directly: no intermediate empty row is ever written to a board. Kept signings get first refusal, even below
247:   // the lost player's rating. Otherwise (red team R87-C-02) the best sub who FITS the slot moves up and the best reserve
248:   // refills the bench; with no fitting sub, the best fitting reserve or club database player goes straight into the slot.
249:   // Only when nobody left at the club fits does the best available player of the same kind (keeper / outfielder) take
250:   // it, and only a club that has run out entirely leaves the slot empty.
251:   // Only signings of the window being processed (season) get first refusal (red team R87-E-01): one from an earlier
252:   // window who never made the board is an ordinary reserve.
253:   function rrReplace(state,at,kept,season=null){
254:     const slot=state.board[at];
255:     const candidates=[...kept,...state.reserves.filter(p=>season!==null&&p.signedSeason===season)].filter(p=>
256:       !rrExcluded(state,p)&&!rrOnBoard(state,p)&&(slot.bench||rrFit(p,slot.pos)>0));
257:     candidates.sort(rrOrder);
258:     if(candidates.length){
259:       const player=candidates[0];state.board[at]=rrPlace(slot,player);
260:       state.reserves=state.reserves.filter(p=>!rrSame(p,player));
261:       return;
262:     }
263:     if(slot.bench){state.board[at]=rrPlace(slot,rrTakeReserve(state));return;}
264:     const keeper=slot.pos==='GK';
265:     const fits=p=>rrFit(p,slot.pos)>0;
266:     const sameKind=p=>p.positions.length>0&&(p.positions[0]==='GK')===keeper;
267:     const bestBench=predicate=>{
268:       let bench=-1;
269:       for(let i=XI_SIZE;i<BOARD_SIZE;i+=1){
270:         const player=state.board[i];
271:         if(!player.name||rrExcluded(state,player)||!predicate(player))continue;
272:         if(bench<0||rrRank(player,state.board[bench])<0)bench=i;
273:       }
274:       return bench;
275:     };
276:     const promote=bench=>{
277:       const player=state.board[bench],replacement=rrTakeReserve(state);// null = the bench slot stays empty
278:       state.board[at]=rrPlace(slot,player);state.board[bench]=rrPlace(state.board[bench],replacement);
279:     };
280:     let bench=bestBench(fits);
281:     if(bench>=0){promote(bench);return;}
282:     const direct=rrTakeReserve(state,fits);
283:     if(direct){state.board[at]=rrPlace(slot,direct);return;}
284:     bench=bestBench(sameKind);
285:     if(bench>=0){promote(bench);return;}
286:     // A club need not carry a keeper among its four subs; unknown-position signings remain bench-only.
287:     const last=rrTakeReserve(state,sameKind);
288:     if(last||!keeper){state.board[at]=rrPlace(slot,last);return;}
289:     // No keeper left at the club at all (red team R87-E-02, rare): the best remaining outfielder goes in goal; the slot is
290:     // empty only when the club has nobody left.
291:     bench=bestBench(p=>p.positions.length>0);
292:     if(bench>=0){promote(bench);return;}
293:     state.board[at]=rrPlace(slot,rrTakeReserve(state,p=>p.positions.length>0));
294:   }
295:   // Sol SQ-2-01: once a fitting club player or signing is available again, a stopgap hands his slot back (best fitting
296:   // player by the normal refill order) and returns to the bench or the reserves.
297:   function rrRepairStopgaps(state,season){
298:     for(let i=0;i<XI_SIZE;i+=1){
299:       if(!rrStopgap(state,i))continue;
300:       const slot=state.board[i],fits=p=>p.name&&!rrExcluded(state,p)&&rrFit(p,slot.pos)>0;
301:       let available=false;
302:       for(let b=XI_SIZE;b<BOARD_SIZE&&!available;b+=1)available=fits(state.board[b]);
303:       if(!available)available=state.reserves.some(fits)||Boolean(rrBestDatabase(state,p=>rrFit(p,slot.pos)>0));
304:       if(!available)continue;
305:       const stopgap=slot;
306:       rrReplace(state,i,[],season);
307:       rrBench(state,stopgap);
308:     }
309:   }
310:   // Sol SQ-2-02: a player the rival guessed must be released, so he leaves the board too (not only the reserves); his
311:   // slot is refilled the normal way. Runs after that season's shot, so the shot already shown never changes.
312:   function rrEvictExcluded(state,season){
313:     for(let i=0;i<BOARD_SIZE;i+=1)if(state.board[i].name&&rrExcluded(state,state.board[i]))rrReplace(state,i,[],season);
314:   }
315:   // special = {playerOne:{name, overall, number?, sourceName?}, playerTwo:{...}} from the Special Player draw, or null for
316:   // an older Showdown. With his shirt number only his own database row is excluded (red team R87-C-05: Empoli's other
317:   // Matheus Pereira stays); sourceName is his squad database name when it differs (R87-D-01: "K. Mbappe Lottin").
318:   // Without a number, every row with his name.
319:   function rrSpecial(special,role){
320:     const p=special&&special[role];
321:     if(!(p&&typeof p.name==="string"&&p.name.trim()&&rrOverall(p.overall)))return null;
322:     const number=rrNumber(p),names=[p.name.trim()];
323:     if(typeof p.sourceName==="string"&&p.sourceName.trim())names.push(p.sourceName.trim());
324:     return names.map(name=>({name,rating:p.overall,number}));
325:   }
326:   // Kept signings of one season for one manager: Transfer War verdict rows with a valid overall that were not released
327:   // by the rival's guess, best overall first; equal overalls by identity (name, then position), never by entry slot.
328:   function rrKept(rows,season,club){
329:     if(!Array.isArray(rows))return null;
330:     return rows.filter(r=>r&&r.release===false&&typeof r.name==="string"&&r.name.trim()&&rrOverall(r.overall))
331:       .map(r=>({name:r.name.trim(),rating:r.overall,positions:Object.freeze(SIGNING_POSITIONS.has(r.position)?[r.position]:rrSigningPositions(r.name.trim(),club).slice(0,1)),signedSeason:season}))
332:       .sort(rrOrder);
333:   }
334:   // ---------- F2-02: persisted hits and the version pin ----------
335:   // A spin mark (js/sparkSharedTransferChallenge.js markSpun) records that season's outcome for that manager: fired, hitName,
336:   // hitNumber, hitSlot and this version. The version names the engine revision and a hash of exactly the data this Showdown's
337:   // boards are built from (both clubs' squad rows and database rows, and both Special Players), so a data fix for another club
338:   // never stops a running Showdown, and any change that can move a board or a shot here does.
339:   function rrHash(text){let h=0x811c9dc5;for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,"0");}
340:   function rrVersion(clubs,options){
341:     const squads=rrSquads(),players=rrPlayers();
342:     if(!squads||!players||!clubs)return null;
343:     const parts=[];
344:     for(const role of ROLES){
345:       const club=clubs[role];
346:       if(!Object.prototype.hasOwnProperty.call(squads.squads,club)||!players.clubs||!Object.prototype.hasOwnProperty.call(players.clubs,club))return null;
347:       parts.push(club,squads.squads[club],players.clubs[club]);
348:     }
349:     const special=options&&options.special;
350:     parts.push(ROLES.map(role=>rrSpecial(special,role)));
351:     // r91: with squad sheets the boards are the sheets, so they are part of what both phones must agree on.
352:     const sheets=rrSheets(options&&options.sheets);
353:     if(sheets)parts.push(ROLES.map(role=>[sheets[role].formation,sheets[role].board.map(row=>[row.name,row.number,row.signedSeason])]));
354:     return `rr${4}.${ENGINE_REVISION}.${rrHash(JSON.stringify(parts))}`;
355:   }
356:   // A persisted outcome is used only when it is whole: fired true with a name and a board slot 0-14, or fired false with none.
357:   // hitSignedSeason names which kind of person was shot (Sol SQ-4-01 identities): the season a signing was signed, or null for
358:   // a club player, so the saved player is found by the same rrId the engine uses and never his namesake of the other kind.
359:   function rrSavedHit(hits,season,role){
360:     const h=hits&&hits[season]&&hits[season][role];
361:     if(!h||typeof h!=="object"||typeof h.fired!=="boolean")return null;
362:     if(!h.fired)return {fired:false};
363:     if(typeof h.hitName!=="string"||!h.hitName.trim()||!Number.isInteger(h.hitSlot)||h.hitSlot<0||h.hitSlot>=BOARD_SIZE)return null;
364:     const signedSeason=Number.isInteger(h.hitSignedSeason)&&h.hitSignedSeason>=1&&h.hitSignedSeason<=MAX_SEASONS?h.hitSignedSeason:null;
365:     return {fired:true,hitName:h.hitName.trim(),hitNumber:Number.isInteger(h.hitNumber)?h.hitNumber:null,hitSlot:h.hitSlot,signedSeason};
366:   }
367:   // Where the saved shot player stands on this phone's board: his saved slot when that slot still holds him, else wherever he
368:   // is (a later build may have moved him), else -1 (not on this board at all: he is still out, nobody else is).
369:   function rrSavedAt(board,saved){
370:     const shot={name:saved.hitName,number:saved.hitNumber,signedSeason:saved.signedSeason};
371:     const row=board[saved.hitSlot];
372:     if(row&&row.name&&rrSame(row,shot))return {shot,at:saved.hitSlot};
373:     return {shot,at:board.findIndex(p=>p.name&&rrSame(p,shot))};
374:   }
375:   // This season's turn with a saved outcome as the authority. The chambers stay the seeded ones (they never depend on a board);
376:   // the stop chamber follows the saved result so the animation agrees with it.
377:   // Chamber Men: a safe saved turn stops on the next empty chamber, a fired one on a live chamber (when the cylinder has none,
378:   // the saved result still stands and the drum stops where it was drawn).
379:   function rrSavedTurn(turn,saved,board){
380:     const live=turn.loadedChambers?new Set(turn.loadedChambers):null;
381:     if(!saved.fired){
382:       let stop=turn.stopChamber;
383:       if(live){for(let i=0;i<CHAMBERS&&live.has(stop);i+=1)stop=(stop+1)%CHAMBERS;}
384:       else if(turn.bulletChamber===stop)stop=(stop+1)%CHAMBERS;
385:       return {...turn,fired:false,hitSlot:null,stopChamber:stop,authority:"saved",shot:null};
386:     }
387:     const {shot,at}=rrSavedAt(board,saved),slot=at>=0?at:saved.hitSlot;
388:     const stop=live?(live.has(turn.stopChamber)||!live.size?turn.stopChamber:turn.loadedChambers[0]):turn.bulletChamber;
389:     return {...turn,fired:true,hitSlot:slot,aimSlot:slot,stopChamber:stop,bulletChamber:live&&live.size?stop:turn.bulletChamber,authority:"saved",shot:at>=0?null:shot};
390:   }
391:   // The outcome a manager's spin mark records for his own turn of this plan.
392:   function rrOutcome(plan,role,version){
393:     const turn=plan&&Array.isArray(plan.turns)?plan.turns.find(item=>item.role===role):null;
394:     if(!turn||typeof version!=="string"||!version)return null;
395:     if(!turn.fired||!turn.player||!turn.player.name)return Object.freeze({fired:false,hitName:null,hitNumber:null,hitSlot:null,hitSignedSeason:null,version});
396:     const signed=turn.player.signedSeason;
397:     return Object.freeze({fired:true,hitName:String(turn.player.name).trim(),hitNumber:Number.isInteger(turn.player.number)?turn.player.number:null,hitSlot:turn.hitSlot,hitSignedSeason:Number.isInteger(signed)&&signed>=1&&signed<=MAX_SEASONS?signed:null,version});
398:   }
399:   // options.sheets = {playerOne:{formation, board}, playerTwo:{...}}: each board 15 rows (11 XI slots, then 4 subs) as
400:   // js/squadSheet.js board() writes them. Anything else is null (the replay from launch is used).
401:   function rrSheets(value){
402:     if(!value||typeof value!=="object")return null;
403:     const out={};
404:     for(const role of ROLES){
405:       const s=value[role];
406:       if(!s||typeof s.formation!=="string"||!Array.isArray(s.board)||s.board.length!==BOARD_SIZE)return null;
407:       if(!s.board.every((row,i)=>row&&row.slot===i&&row.bench===(i>=XI_SIZE)&&typeof row.pos==="string"&&(row.name===null||typeof row.name==="string")&&Array.isArray(row.positions)))return null;
408:       out[role]=Object.freeze({formation:s.formation,board:Object.freeze(s.board.map(row=>Object.freeze({...row,special:false})))});
409:     }
410:     return Object.freeze(out);
411:   }
412:   function rrArgs(rivalryId,clubs,season){
413:     const match=RIVALRY_ID.exec(String(rivalryId||""));
414:     if(!match||!Number.isInteger(season)||season<1||season>MAX_SEASONS||!clubs)return null;
415:     const launch={};
416:     for(const role of ROLES){launch[role]=rrBoard(clubs[role]);if(!launch[role])return null;}
417:     return {hex:match[1],launch};
418:   }
419:   // What the screen shows for one season. clubs = {playerOne, playerTwo} club names; options.special = the Special
420:   // Players; options.history[k] = {playerOne:[verdict rows], playerTwo:[verdict rows]} for every season k before this
421:   // one (index 1..season-1). options.hits[k] = {playerOne:outcome|null, playerTwo:outcome|null}: the outcomes the spin marks
422:   // saved (F2-02). A saved outcome is the authority for that season and manager: the saved player is out even if this build's
423:   // board would have aimed elsewhere; a season or manager without one is computed as before. Returns null for a malformed id,
424:   // an unknown club, a season outside 1..10 or a missing season of history (the screen then shows no roulette).
425:   function rrForSeason(rivalryId,clubs,season,options){
426:     const args=rrArgs(rivalryId,clubs,season);
427:     if(!args)return null;
428:     const history=options&&options.history,special=options&&options.special,hits=options&&options.hits;
429:     // r88 Chamber Men: options.chamberMen marks a Showdown that plays it; options.chambers[k] = {playerOne, playerTwo} its
430:     // cylinders per season. Such a Showdown never falls back to one bullet: a season with neither a saved outcome nor its
431:     // cylinders gives no plan (the screen says so and nothing is spun).
432:     const chamberMen=Boolean(options&&options.chamberMen),chambers=options&&options.chambers;
433:     const boards={},turns={},skipped={};
434:     // r91 Squad Management (2.4.0): the board is each manager's locked squad sheet for this season (XI in his formation, then
435:     // subs 1-4), read from rivalries/{rid}/squadSheets on both phones, so nothing is replayed here. Both or neither.
436:     const sheets=rrSheets(options&&options.sheets);
437:     const formations=Object.freeze(Object.fromEntries(ROLES.map(role=>[role,sheets?sheets[role].formation:rrPlayers().clubs[clubs[role]].formation])));
438:     // The Special Player is never on any board, bench or reserve list anywhere: both managers' draws are excluded from
439:     // both clubs (red team R87-C-01). One in the club's launch board is skipped and the next player takes his place.
440:     const specials=ROLES.flatMap(role=>rrSpecial(special,role)||[]);
441:     for(const role of ROLES){
442:       if(sheets){
443:         boards[role]=sheets[role].board;skipped[role]=Object.freeze([]);
444:         const turn=rrTurn(args.hex,season,role,boards[role],chamberMen?rrCylinder(chambers,season,role):null),saved=rrSavedHit(hits,season,role);
445:         if(chamberMen&&!saved&&!turn.loadedChambers)return null;
446:         turns[role]=saved?rrSavedTurn(turn,saved,boards[role]):{...turn,authority:"computed",shot:null};
447:         continue;
448:       }
449:       const state={club:clubs[role],launch:args.launch[role],board:args.launch[role].slice(),reserves:[],vacant:null,excluded:new Set(),excludedClubNames:new Set()};
450:       for(const sp of specials)rrExcludeSpecial(state,sp);
451:       for(const [,name,number,rating] of rrSquads().squads[state.club].reserves)
452:         rrReserve(state,{name,number,rating,positions:rrPlayerPositions(name,state.club,number),signedSeason:null});
453:       for(let i=0;i<BOARD_SIZE;i+=1)if(rrExcluded(state,state.board[i]))rrReplace(state,i,[]);
454:       while(state.reserves.length<3&&rrNextReserve(state)){} // skip him in the hidden three too
455:       // F2-19 (Fable job 2): names the roulette shot, for saying why a kept signing of the same name stays off the board.
456:       const shotNames=new Set();skipped[role]=[];
457:       for(let k=1;k<season;k+=1){
458:         const allKept=rrKept(history&&history[k]&&history[k][role],k,state.club);
459:         if(!allKept)return null;
460:         const turn=rrTurn(args.hex,k,role,state.board,chamberMen?rrCylinder(chambers,k,role):null);
461:         // A guessed signing must not sneak in later through the club database refill. Applied after this season's turn
462:         // was drawn (the board it aimed at is the one the screen showed); a guessed player already on the board is
463:         // evicted below (Sol SQ-2-02).
464:         for(const row of history[k][role])if(row&&row.release===true&&typeof row.name==='string'&&row.name.trim())rrExclude(state,{name:row.name.trim(),number:null,signedSeason:k});
465:         state.reserves=state.reserves.filter(p=>!rrExcluded(state,p));
466:         // Sol SQ-2-03: a player this manager already signed in an earlier window is not a new signing when entered again;
467:         // he keeps his first window and his place (board or reserves).
468:         const kept=allKept.filter(p=>!state.reserves.some(r=>r.signedSeason!==null&&rrSame(r,p)));
469:         const saved=rrSavedHit(hits,k,role);
470:         if(chamberMen&&!saved&&!turn.loadedChambers&&!rrOneBullet(chambers,k))return null;
471:         let shot=null,at=-1;
472:         if(saved){if(saved.fired)({shot,at}=rrSavedAt(state.board,saved));}
473:         else if(turn.fired){shot=state.board[turn.hitSlot];at=turn.hitSlot;}
474:         if(shot){
475:           shotNames.add(rrKey(shot.name));
476:           rrExclude(state,at>=0?state.board[at]:shot);
477:           state.reserves=state.reserves.filter(p=>!rrExcluded(state,p));// F11-04: a shot person found in the reserves leaves them too
478:           // Keep the old row until it can be overwritten directly. Vacancy metadata lets
479:           // R87-2's XI/bench signing placement run first without ever writing a blank row.
480:           if(at>=0)state.vacant=at;
481:         }
482:         // F2-19: a kept signing the rules keep off (signings are known by name only, so his name is one the roulette shot, a
483:         // Special Player's, or a guessed and released signing's) is listed for the season right after his window, with why.
484:         if(k===season-1)for(const player of kept)if(rrExcluded(state,player)){
485:           const key=rrKey(player.name);
486:           skipped[role].push(Object.freeze({name:player.name,season:k,reason:specials.some(sp=>rrKey(sp.name)===key)?"special":shotNames.has(key)?"shot":"guessed"}));
487:         }
488:         for(const player of kept)rrJoin(state,player);
489:         if(state.vacant!==null){rrReplace(state,state.vacant,[],k);state.vacant=null;}
490:         rrEvictExcluded(state,k);
491:         rrRepairStopgaps(state,k);
492:         // Fable F11-07: a kept signing weaker than every fitting starter and every sub waits in the reserves; the card says so
493:         // instead of dropping him silently.
494:         if(k===season-1)for(const player of kept)if(!rrExcluded(state,player)&&!rrOnBoard(state,player))skipped[role].push(Object.freeze({name:player.name,season:k,reason:"reserve"}));
495:       }
496:       const board=state.board;
497:       boards[role]=Object.freeze(board);skipped[role]=Object.freeze(skipped[role]);
498:       const turn=rrTurn(args.hex,season,role,board,chamberMen?rrCylinder(chambers,season,role):null),saved=rrSavedHit(hits,season,role);
499:       if(chamberMen&&!saved&&!turn.loadedChambers)return null;
500:       turns[role]=saved?rrSavedTurn(turn,saved,board):{...turn,authority:"computed",shot:null};
501:     }
502:     const order=ROLES.map(role=>{
503:       const {shot,...turn}=turns[role],board=boards[role];
504:       const player=turn.hitSlot===null?null:shot?rrRow(turn.hitSlot,board[turn.hitSlot].pos,shot.name,{number:shot.number,rating:0,positions:Object.freeze([]),special:false,signedSeason:shot.signedSeason}):board[turn.hitSlot];
505:       return Object.freeze({...turn,player});
506:     });
507:     return Object.freeze({contractVersion:4,season,chambers:CHAMBERS,order:ROLES,formations,boards:Object.freeze(boards),turns:Object.freeze(order),skipped:Object.freeze(skipped)});
508:   }
509: 
510:   return Object.freeze({contractVersion:4,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,overallMin:OVERALL_MIN,overallMax:OVERALL_MAX,positions:POSITIONS,roles:ROLES,engineRevision:ENGINE_REVISION,board:rrBoard,forSeason:rrForSeason,version:rrVersion,outcome:rrOutcome,savedHit:rrSavedHit});
511: });
512: 
```

(End of packet FJ4. Answer with the report only.)
