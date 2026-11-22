# Fable 5.2 red-team job FJ11: Pairing and joining

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
Then one block per finding: ID (FJ11-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Permanent pairing: can the two managers end up paired to different Showdowns, or one paired and one not, after JOIN races, a retry, or one phone offline?
2. Only Daniel starts a Showdown and picks the season count: can Nik's phone start one, or both phones start two?
3. JOIN on Home and UNPAIR in Settings: can UNPAIR on one phone leave the other stuck?
4. Does any normal join step get permission-denied, or does the Rules fragment come near its expression limits?
5. Any join path that costs many reads while waiting (give the count per minute)?

## Known (do not report)
Home auto-JOIN polls every 20 s for at most 10 min (by design).

## Files

## FILE: js/sparkRemoteJoining.js (732 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeSparkRemoteJoining=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7:   // r87 (2.0.0 plain-words sweep): a provider or JS message reaches the connection panel only when it reads as words.
8:   function srjPlain(error,fallback){const m=error&&error.message;return m&&!/\b\w+(?:[-_/]\w+)+\b|[(){}]|undefined|null|Error|Firebase|permission|[a-z][A-Z]/.test(m)?m:fallback;}
9: 
10:   const SRJ_PANEL_ID="sparkRemoteJoiningOverlay";
11:   const SRJ_DEPENDENCIES=Object.freeze([
12:     ["production-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
13:     ["connected-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
14:     ["private-pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
15:     ["connected-rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
16:     ["private-session","js/sparkPrivateSession.js",()=>root.CareerModeSparkPrivateSession],
17:     ["standard-auth-session","js/sparkStandardAuthPrivateSession.js",()=>root.CareerModeSparkStandardAuthPrivateSession]
18:   ]);
19:   const SRJ_CANONICAL_KEYS=Object.freeze(["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"]);
20:   const SRJ_AMBIGUOUS_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","network-request-failed"]);
21:   // Job 31: the Rules cap a session at request.time + 4h with no clock slack, so a host whose clock ran even a second fast was
22:   // refused. Hosting asks for 4h minus one minute (the same one-minute slack the Rules give createdAt).
23:   const SRJ_HOST_TTL_MS=4*60*60*1000-60*1000;
24:   // Job 31: the host page stayed OPEN after the other manager joined until someone tapped REFRESH / READ, so a mid-game
25:   // reconnect looked stuck on the host. While this page holds its own OPEN hosted session it reads it quietly every few
26:   // seconds (for at most ten minutes, never while hidden) and picks up the join by itself.
27:   const SRJ_JOIN_WATCH_MS=4000,SRJ_JOIN_WATCH_LIMIT_MS=10*60*1000;
28:   // Hunt 1018 (H1018-2): the watcher belongs to one sessionId, so hosting a replacement cancels the old session's timer.
29:   let srjJoinWatchTimer=null,srjJoinWatchSessionId=null;
30:   const srjEndedRivalryIds=new Set();
31:   // Hunt 1018 (H1018-1): one replacement (end the held session, then host or join) runs at a time; it is taken before any await.
32:   let srjReplaceAction=null;
33:   const srjScriptPromises=new Map();
34:   const srjListeners=new Set();
35:   let srjState=srjFreeze({status:"idle",open:false,busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,auto:null,waitRetry:false,message:"Not connected yet. Nothing has been sent."});
36: 
37:   function srjFreeze(value){
38:     if(!value||typeof value!=="object"||Object.isFrozen(value))return value;
39:     Object.freeze(value);
40:     Object.values(value).forEach(srjFreeze);
41:     return value;
42:   }
43:   function srjError(code,message){const error=new Error(message||code);error.code=code;return error;}
44:   function srjErrorCode(error){return String(error&&error.code||"").split("/").pop().trim().toLowerCase();}
45:   function srjIsAmbiguousFailure(error){return SRJ_AMBIGUOUS_CODES.has(srjErrorCode(error));}
46:   function srjSetState(next){
47:     srjState=srjFreeze({...srjState,...next});
48:     for(const listener of srjListeners){try{listener(srjState);}catch(_error){}}
49:     srjRenderPanel();
50:     return srjState;
51:   }
52:   function srjRevision(){
53:     if(!root.document)return "1.9.0-r3";
54:     const meta=root.document.querySelector('meta[name="app-asset-revision"]');
55:     return meta&&meta.content?meta.content.trim()||"1.9.0-r3":"1.9.0-r3";
56:   }
57:   function srjVersionedUrl(path){
58:     if(!root.document||!root.location)return path;
59:     const url=new URL(path,root.document.baseURI||root.location.href);
60:     url.searchParams.set("v",srjRevision());
61:     return url.href;
62:   }
63:   function srjLoadScript(key,path,ready){
64:     const current=ready();
65:     if(current)return Promise.resolve(current);
66:     if(srjScriptPromises.has(key))return srjScriptPromises.get(key);
67:     if(!root.document)return Promise.reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`Required private runtime is unavailable: ${path}.`));
68:     const promise=new Promise((resolve,reject)=>{
69:       const script=root.document.createElement("script");
70:       script.src=srjVersionedUrl(path);
71:       script.async=false;
72:       script.dataset.srjDependency=key;
73:       script.addEventListener("load",()=>{const api=ready();api?resolve(api):reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`${path} did not expose its expected API.`));},{once:true});
74:       script.addEventListener("error",()=>reject(srjError("REMOTE_JOINING_DEPENDENCY_UNAVAILABLE",`Unable to load ${path}.`)),{once:true});
75:       root.document.head.appendChild(script);
76:     }).finally(()=>{srjScriptPromises.delete(key);});
77:     srjScriptPromises.set(key,promise);
78:     return promise;
79:   }
80:   async function srjEnsureDependencies(){
81:     const resolved={};
82:     for(const [key,path,ready] of SRJ_DEPENDENCIES)resolved[key]=await srjLoadScript(key,path,ready);
83:     return Object.freeze(resolved);
84:   }
85:   async function srjResolveContext(){
86:     const deps=await srjEnsureDependencies();
87:     const runtime=deps["production-runtime"];
88:     const account=deps["connected-account"];
89:     const pairing=deps["private-pairing"];
90:     const rivalry=deps["connected-rivalry"];
91:     const protocol=deps["standard-auth-session"];
92:     if(!runtime||typeof runtime.ensureAccountServices!=="function")throw srjError("REMOTE_JOINING_RUNTIME_UNAVAILABLE","Private Firebase runtime is unavailable.");
93:     if(!account||typeof account.initialize!=="function"||typeof account.getState!=="function")throw srjError("REMOTE_JOINING_ACCOUNT_UNAVAILABLE","Connected Account is unavailable.");
94:     await account.initialize();
95:     const accountState=account.getState();
96:     if(!accountState||accountState.connected!==true||!accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_REQUIRED","Sign in with Google on Home before starting or joining a private session.");
97:     if(!pairing||typeof pairing.initialize!=="function"||typeof pairing.getState!=="function")throw srjError("REMOTE_JOINING_DEVICE_UNAVAILABLE","Registered device details are unavailable.");
98:     await pairing.initialize();
99:     const pairingState=pairing.getState();
100:     if(!pairingState||pairingState.registered!==true||!pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_REQUIRED","This phone is not set up yet. Go Home, sign in again and choose Daniel or Nik, then try again.");
101:     if(!rivalry||typeof rivalry.initialize!=="function"||typeof rivalry.getState!=="function")throw srjError("REMOTE_JOINING_RIVALRY_UNAVAILABLE","Connected Rivalry details are unavailable.");
102:     await rivalry.initialize();
103:     const rivalryState=rivalry.getState();
104:     if(!rivalryState||rivalryState.attached!==true||!rivalryState.rivalryId)throw srjError("REMOTE_JOINING_RIVALRY_REQUIRED","Daniel and Nik are not connected on this phone yet. Go Home and tap CONTINUE CAREER first.");
105:     const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
106:     if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)throw srjError("REMOTE_JOINING_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable.");
107:     const user=services.auth.currentUser;
108:     if(!user||user.uid!==accountState.accountId)throw srjError("REMOTE_JOINING_AUTH_MISMATCH","The current Google account no longer matches the Connected Account.");
109:     if(rivalryState.accountId&&rivalryState.accountId!==user.uid)throw srjError("REMOTE_JOINING_RIVALRY_ACCOUNT_MISMATCH","The attached Connected Rivalry belongs to a different account.");
110:     if(rivalryState.deviceId&&rivalryState.deviceId!==pairingState.deviceId)throw srjError("REMOTE_JOINING_DEVICE_MISMATCH","The attached Connected Rivalry belongs to a different registered browser identity.");
111:     return Object.freeze({protocol,services,user,accountId:user.uid,deviceId:pairingState.deviceId,rivalryId:rivalryState.rivalryId});
112:   }
113:   // r87 W3-6 (clock proof lane): the Rules take a session's createdAt and lastActivityAt only inside [server - 5 min,
114:   // server + 1 min] and its expiresAt only up to server + 4 h, so a phone whose clock ran 2 minutes fast or 5 minutes slow
115:   // could never host or join (tests/firebase/r87-device-clock-skew-emulator.cjs). Session writes now use server time: this
116:   // phone's offset from a freshly issued ID token (issuedAtTime is the server's clock), measured at the request midpoint.
117:   // Date.now()+offset keeps running while the phone sleeps. Re-measured every 10 minutes; if it cannot be measured (offline,
118:   // no token) the phone's own clock is used, as before. Costs no Firestore read. Reads and expiry checks use the same offset.
119:   const SRJ_CLOCK_REFRESH_MS=10*60*1000;
120:   let srjClock={known:false,offsetMs:0,at:0};
121:   function srjClockNow(){return Date.now()+(srjClock.known?srjClock.offsetMs:0);}
122:   async function srjServerNow(user){
123:     if(srjClock.known&&Math.abs(Date.now()-srjClock.at)<SRJ_CLOCK_REFRESH_MS)return srjClockNow();
124:     try{
125:       if(user&&typeof user.getIdTokenResult==="function"){
126:         const sent=Date.now(),token=await user.getIdTokenResult(true),got=Date.now();
127:         const issued=Date.parse(String(token&&token.issuedAtTime||""));
128:         if(Number.isFinite(issued)&&issued>0&&got>=sent&&got-sent<30000){
129:           const server=issued+(issued%1000===0?500:0);
130:           srjClock={known:true,offsetMs:server-Math.round((sent+got)/2),at:got};
131:         }
132:       }
133:     }catch(_error){}
134:     return srjClockNow();
135:   }
136:   function srjOperationOptions(context,sessionId){
137:     return {firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,user:context.user,deviceId:context.deviceId,rivalryId:context.rivalryId,sessionId,nowEpochMs:srjClockNow(),cryptoImpl:root.crypto};
138:   }
139:   async function srjWriteOptions(context,sessionId){return {...srjOperationOptions(context,sessionId),nowEpochMs:await srjServerNow(context.user)};}
140:   function srjFailureMessage(result,fallback){
141:     if(result&&result.code==="resource-exhausted")return "Firebase Spark quota is temporarily exhausted. No upgrade will be attempted; try again later.";
142:     if(result&&typeof result.message==="string"&&result.message.trim())return result.message.trim();
143:     return fallback;
144:   }
145:   function srjExpiredByClock(){const expiresAt=Number(srjState.expiresAtEpochMs);return Boolean(srjState.sessionId&&Number.isFinite(expiresAt)&&srjClockNow()>=expiresAt);}
146:   function srjHasNonterminalSession(){return !!srjState.sessionId&&["open","active"].includes(srjState.sessionState)&&!srjExpiredByClock();}
147:   function srjSessionBlocksStart(){return srjHasNonterminalSession()||!!srjState.pendingAction||srjState.sessionState==="unresolved";}
148:   // BH-11 (#1): after a reload the other phone loses its page-memory code while this phone still holds the old session, so
149:   // HOST and JOIN were dead here. This page may end its OWN confirmed session (close an ACTIVE one, revoke an OPEN one it
150:   // hosts) and then host or join a fresh one. Unresolved or pending capabilities are never replaced.
151:   function srjHeldSessionReplaceable(){return srjHasNonterminalSession()&&!srjState.pendingAction&&!srjState.busy&&(srjState.sessionState==="active"||(srjState.sessionState==="open"&&srjState.role==="host"));}
152:   async function srjEndHeldSession(){
153:     if(!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"The current connection cannot be replaced right now."};
154:     let context;
155:     try{context=await srjResolveContext();}
156:     catch(error){const message=`${srjPlain(error,"Could not check the connection.")} Your current connection was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REPLACE_FAILED",message};}
157:     if(!srjPendingContextMatches(context)){const message="The current private session belongs to a different Google account, browser or Showdown, so it was not replaced.";srjSetState({status:"error",busy:false,message});return {ok:false,code:"REMOTE_JOINING_REPLACE_CONTEXT_CHANGED",message};}
158:     const result=srjState.sessionState==="active"?await srjCloseSession():await srjRevokeSession();
159:     if(!result||result.ok!==true)return result||{ok:false,code:"REMOTE_JOINING_REPLACE_FAILED",message:"Could not end the connection. Try again."};
160:     return srjSessionBlocksStart()?{ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Could not end the connection. Try again."}:{ok:true};
161:   }
162:   function srjAcceptResult(result,context,role,message){
163:     return srjSetState({status:"ready",busy:false,sessionId:result.sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role,sessionState:result.state,revision:result.revision,expiresAtEpochMs:result.expiresAtEpochMs,pendingAction:null,capabilityCopyAllowed:true,auto:result.state==="open"?srjState.auto:null,message});
164:   }
165:   function srjPendingContextMatches(context){
166:     return !!context&&context.rivalryId===srjState.rivalryId&&context.accountId===srjState.accountId&&context.deviceId===srjState.deviceId;
167:   }
168:   function srjPendingFailure(error,action){
169:     const message=srjPlain(error,"No answer from the online server.");
170:     srjSetState({status:"recovery-pending",busy:false,pendingAction:action,capabilityCopyAllowed:false,message:`${message} Tap the RETRY button below to try again. Your Showdown was not changed.`});
171:     return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_PENDING",message,recoverable:true,pendingAction:action};
172:   }
173:   // BH-11 (#10): a host or join write is refused when the phone clock is minutes off server time (the Rules check createdAt and
174:   // lastActivityAt against request.time), which used to surface as a raw permission error.
175:   const SRJ_CLOCK_HINT=" If the code is right, check that your phone's date and time are set automatically; a phone clock that is several minutes off is refused.";
176:   function srjRejectionMessage(error,action){
177:     if((action==="host"||action==="join")&&srjErrorCode(error)==="permission-denied")return `The connection was refused.${SRJ_CLOCK_HINT}`;
178:     return srjPlain(error,"The connection was refused. Try again.");
179:   }
180:   function srjClearRejectedPending(error,action){
181:     const message=srjRejectionMessage(error,action);
182:     if(action==="close"){
183:       srjSetState({status:"error",busy:false,pendingAction:null,capabilityCopyAllowed:true,message:`${message} You are still connected and your Showdown was not changed.`});
184:     }else{
185:       srjSetState({status:"error",busy:false,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:`${message} Your Showdown was not changed.`});
186:     }
187:     return {ok:false,code:error&&error.code||`REMOTE_JOINING_${String(action).toUpperCase()}_FAILED`,message,recoverable:false};
188:   }
189:   async function srjAttemptPending(context){
190:     const action=srjState.pendingAction;
191:     const sessionId=srjState.sessionId;
192:     if(!action||!sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
193:     if(!srjPendingContextMatches(context)){
194:       srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:"You are signed in differently from the last try. Sign back in with the same Google account on the same device, then tap RETRY. Your Showdown was not changed."});
195:       return {ok:false,code:"REMOTE_JOINING_RECOVERY_CONTEXT_CHANGED",message:"You are signed in differently from the last try. Sign back in with the same Google account on the same device, then tap RETRY. Your Showdown was not changed.",recoverable:true,pendingAction:action};
196:     }
197:     srjSetState({status:`retrying-${action}`,busy:true,capabilityCopyAllowed:false,message:"Connecting again…"});
198:     try{
199:       let result;
200:       if(action==="host")result=await context.protocol.openSession({...await srjWriteOptions(context,sessionId),ttlMs:SRJ_HOST_TTL_MS});
201:       else if(action==="join")result=await context.protocol.joinSession(await srjWriteOptions(context,sessionId));
202:       else if(action==="close")result=await context.protocol.closeSession(await srjWriteOptions(context,sessionId));
203:       else throw srjError("REMOTE_JOINING_RECOVERY_ACTION_INVALID","The unresolved private-session action is invalid.");
204:       if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_RECOVERY_FAILED",srjFailureMessage(result,"Private session recovery could not be confirmed."));
205:       if(action==="host"){srjAcceptResult(result,context,"host",result.replayed?"Private session recovery confirmed your original host code. No duplicate session was created.":"Private session is open. Share the full code directly with the other paired manager. It is kept only in this page's memory.");srjWatchForJoin(result.sessionId);}
206:       else if(action==="join")srjAcceptResult(result,context,"peer",result.replayed?"Private session recovery confirmed the original join with the same code.":"Private session is active with exactly the two paired rivalry accounts.");
207:       else srjAcceptResult(result,context,srjState.role||"member",result.replayed?"Private session recovery confirmed the original close with the same code.":"Private session is closed for good. Its code stays in page memory only until you forget it or reload.");
208:       return result;
209:     }catch(error){
210:       if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,action);
211:       return srjClearRejectedPending(error,action);
212:     }
213:   }
214:   function srjHostWaitingForJoin(sessionId){return Boolean(sessionId&&srjState.sessionId===sessionId&&srjState.role==="host"&&srjState.sessionState==="open"&&!srjState.pendingAction&&!srjExpiredByClock());}
215:   function srjWatchForJoin(sessionId,startedAt=Date.now(),generation=srjWaitGeneration){
216:     if(!root.document||typeof root.setTimeout!=="function"||!srjHostWaitingForJoin(sessionId))return false;
217:     if(srjJoinWatchTimer!==null){if(srjJoinWatchSessionId===sessionId)return false;if(typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);}
218:     srjJoinWatchSessionId=sessionId;
219:     const timer=root.setTimeout(async()=>{
220:       if(srjJoinWatchTimer!==timer)return;
221:       srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
222:       if(generation!==srjWaitGeneration||!srjHostWaitingForJoin(sessionId))return;
223:       if(Date.now()-startedAt>SRJ_JOIN_WATCH_LIMIT_MS){srjPauseWait();return;}
224:       if(!srjState.busy&&root.document.visibilityState!=="hidden"){
225:         await srjCheckForJoin(sessionId,generation);
226:       }
227:       if(generation===srjWaitGeneration)srjWatchForJoin(sessionId,startedAt,generation);
228:     },SRJ_JOIN_WATCH_MS);
229:     srjJoinWatchTimer=timer;
230:     return true;
231:   }
232:   async function srjCheckForJoin(sessionId,generation){
233:     try{
234:       root.CareerModeFirestoreBudget?.wantFresh?.();
235:       const context=await srjResolveContext();
236:       if(generation!==srjWaitGeneration||!srjPendingContextMatches(context)||!srjHostWaitingForJoin(sessionId))return;
237:       const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
238:       if(generation===srjWaitGeneration&&srjHostWaitingForJoin(sessionId)&&!srjState.busy&&result&&result.ok===true&&result.state!=="open")srjAcceptResult(result,context,"host",result.state==="active"?"The other manager joined. Private session is active with exactly the two paired rivalry accounts.":`Private session refreshed at revision ${result.revision}.`);
239:     }catch(_error){}
240:   }
241:   async function srjRetryPendingOperation(){
242:     if(srjRetireEnded())return {ok:false,code:"REMOTE_JOINING_SHOWDOWN_ENDED",message:srjState.message};
243:     if(!srjState.pendingAction||!srjState.sessionId)return {ok:false,code:"REMOTE_JOINING_RECOVERY_REQUIRED",message:"No unresolved private-session operation is waiting for retry."};
244:     if(srjState.busy)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
245:     try{return await srjAttemptPending(await srjResolveContext());}
246:     catch(error){
247:       if(srjIsAmbiguousFailure(error))return srjPendingFailure(error,srjState.pendingAction);
248:       srjSetState({status:"recovery-pending",busy:false,capabilityCopyAllowed:false,message:`${srjPlain(error,"Could not check the connection.")} Try again in a moment.`});
249:       return {ok:false,code:error&&error.code||"REMOTE_JOINING_RECOVERY_CONTEXT_UNAVAILABLE",message:srjPlain(error,"Could not check the connection."),recoverable:true,pendingAction:srjState.pendingAction};
250:     }
251:   }
252:   function srjReplaceBusy(){return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};}
253:   function srjReplaceHeld(start){srjReplaceAction=(async()=>{const ended=await srjEndHeldSession();return ended.ok?await start():ended;})().finally(()=>{srjReplaceAction=null;});return srjReplaceAction;}
254:   async function srjHostSession(options={}){
255:     if(srjReplaceAction)return srjReplaceBusy();
256:     if(srjSessionBlocksStart()){
257:       if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable())return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Finish or end the current connection first."};
258:       return srjReplaceHeld(srjStartHost);
259:     }
260:     return srjStartHost();
261:   }
262:   async function srjStartHost(){
263:     srjSetState({status:"hosting",busy:true,message:"Connecting…"});
264:     try{
265:       const context=await srjResolveContext();
266:       const sessionId=context.protocol.generateSessionId(root.crypto);
267:       srjSetState({status:"hosting",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"host",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"host",capabilityCopyAllowed:false,message:"Connecting…"});
268:       return await srjAttemptPending(context);
269:     }catch(error){
270:       if(srjState.pendingAction==="host"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"host");
271:       if(srjState.pendingAction==="host")return srjClearRejectedPending(error,"host");
272:       srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not connect. Try again.")} Your Showdown was not changed.`});
273:       return {ok:false,code:error&&error.code||"REMOTE_JOINING_HOST_FAILED",message:srjPlain(error,"Could not connect. Try again.")};
274:     }
275:   }
276:   async function srjJoinSession(value,options={}){
277:     if(srjReplaceAction)return srjReplaceBusy();
278:     if(srjSessionBlocksStart()){
279:       // BH-11 (#1): only an ACTIVE session may be ended to join a fresh code; an OPEN hosted one keeps the existing guard.
280:       if(!(options&&options.replaceCurrent===true)||!srjHeldSessionReplaceable()||srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_SESSION_ALREADY_HELD",message:"Finish or end the current connection first."};
281:       srjReplaceAction=(async()=>{
282:         let nextSessionId;
283:         try{const deps=await srjEnsureDependencies();nextSessionId=deps["standard-auth-session"].normalizeSessionId(value);}
284:         catch(error){const message=`${srjPlain(error,"That code does not work. Check it and try again.")} Your current connection was kept.`;srjSetState({status:"error",busy:false,message});return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message};}
285:         if(nextSessionId===srjState.sessionId){const message="This phone is already in that private session.";srjSetState({message});return {ok:false,code:"REMOTE_JOINING_SAME_SESSION",message};}
286:         const ended=await srjEndHeldSession();return ended.ok?await srjStartJoin(value):ended;
287:       })().finally(()=>{srjReplaceAction=null;});
288:       return srjReplaceAction;
289:     }
290:     return srjStartJoin(value);
291:   }
292:   async function srjStartJoin(value){
293:     srjSetState({status:"joining",busy:true,message:"Connecting…"});
294:     try{
295:       const context=await srjResolveContext();
296:       const sessionId=context.protocol.normalizeSessionId(value);
297:       srjSetState({status:"joining",busy:true,sessionId,rivalryId:context.rivalryId,accountId:context.accountId,deviceId:context.deviceId,role:"peer",sessionState:"unresolved",revision:null,expiresAtEpochMs:null,pendingAction:"join",capabilityCopyAllowed:false,message:"Connecting…"});
298:       return await srjAttemptPending(context);
299:     }catch(error){
300:       if(srjState.pendingAction==="join"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"join");
301:       if(srjState.pendingAction==="join")return srjClearRejectedPending(error,"join");
302:       srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not connect. Try again.")} Your Showdown was not changed.`});
303:       return {ok:false,code:error&&error.code||"REMOTE_JOINING_JOIN_FAILED",message:srjPlain(error,"Could not connect. Try again.")};
304:     }
305:   }
306:   async function srjRefreshSession(){
307:     const remembered=srjState.sessionId;
308:     if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"There is no code to use yet."};
309:     if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before reading the session."};
310:     srjSetState({status:"refreshing",busy:true,message:"Checking the connection…"});
311:     try{
312:       const context=await srjResolveContext();
313:       const result=await context.protocol.readSession(srjOperationOptions(context,remembered));
314:       if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_READ_FAILED",srjFailureMessage(result,"Could not check the connection. Try again."));
315:       const clockNote=result.expiredByClock?" The session's expiry time has passed; nothing was changed automatically.":"";
316:       srjAcceptResult(result,context,srjState.role||"member",`Private session refreshed at revision ${result.revision}.${clockNote}`);
317:       return result;
318:     }catch(error){srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not check the connection. Try again.")}`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_READ_FAILED",message:srjPlain(error,"Could not check the connection. Try again.")};}
319:   }
320:   async function srjRevokeSession(){
321:     const remembered=srjState.sessionId;
322:     if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"There is no code to use yet."};
323:     if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before revoking the session."};
324:     if(srjState.sessionState!=="open")return {ok:false,code:"REMOTE_JOINING_REVOKE_NOT_OPEN",message:"Only an open host session can be revoked before peer join."};
325:     srjSetState({status:"revoking",busy:true,message:"Cancelling the code…"});
326:     try{
327:       const context=await srjResolveContext();
328:       const result=await context.protocol.revokeSession(await srjWriteOptions(context,remembered));
329:       if(!result||result.ok!==true)throw srjError(result&&result.code||"REMOTE_JOINING_REVOKE_FAILED",srjFailureMessage(result,"Could not cancel the code. Try again."));
330:       srjAcceptResult(result,context,"host","Private session is revoked for good. It can no longer be joined; forget the code when ready.");
331:       return result;
332:     }catch(error){srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not cancel the code. Try again.")} Try again.`});return {ok:false,code:error&&error.code||"REMOTE_JOINING_REVOKE_FAILED",message:srjPlain(error,"Could not cancel the code. Try again.")};}
333:   }
334:   async function srjCloseSession(){
335:     const remembered=srjState.sessionId;
336:     if(!remembered)return {ok:false,code:"REMOTE_JOINING_SESSION_REQUIRED",message:"There is no code to use yet."};
337:     if(srjState.pendingAction)return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Resolve the pending operation before closing the session."};
338:     if(srjState.sessionState!=="active")return {ok:false,code:"REMOTE_JOINING_CLOSE_NOT_ACTIVE",message:"There is no connection to end."};
339:     try{
340:       const context=await srjResolveContext();
341:       srjSetState({status:"closing",busy:true,accountId:context.accountId,deviceId:context.deviceId,pendingAction:"close",capabilityCopyAllowed:false,message:"Ending the connection…"});
342:       return await srjAttemptPending(context);
343:     }catch(error){
344:       if(srjState.pendingAction==="close"&&srjIsAmbiguousFailure(error))return srjPendingFailure(error,"close");
345:       if(srjState.pendingAction==="close")return srjClearRejectedPending(error,"close");
346:       srjSetState({status:"error",busy:false,message:`${srjPlain(error,"Could not end the connection. Try again.")}`});
347:       return {ok:false,code:error&&error.code||"REMOTE_JOINING_CLOSE_FAILED",message:srjPlain(error,"Could not end the connection. Try again.")};
348:     }
349:   }
350:   function srjForgetSession(){
351:     if(srjState.pendingAction||srjState.sessionState==="unresolved")return {ok:false,code:"REMOTE_JOINING_RECOVERY_PENDING",message:"Wait for the connection to finish first."};
352:     return srjSetState({status:"idle",busy:false,auto:null,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"Code cleared. Your Showdown was not changed."});
353:   }
354:   async function srjCopySessionCode(){
355:     if(!srjState.sessionId||srjState.capabilityCopyAllowed!==true||srjState.pendingAction)return false;
356:     try{if(root.navigator&&root.navigator.clipboard&&typeof root.navigator.clipboard.writeText==="function"){await root.navigator.clipboard.writeText(srjState.sessionId);return true;}}catch(_error){}
357:     return false;
358:   }
359:   // Studio Z3: the exact session lives in page memory only, so a refresh (Transfer, setup, anywhere) used to drop this
360:   // phone on Home and CONTINUE CAREER opened the code screen while the other phone was still in the game. A refreshed or
361:   // reopened tab now re-attaches through the pair's session pointer below; the session itself is still never stored.
362:   // Studio Z4: every new game day Daniel had to host and send Nik a long session code to paste. The two paired accounts now
363:   // share one pointer, rivalries/{rivalryId}/sessionOffers/current, which only they can read (Rules) and only the session's
364:   // host can point at their own open or active session. Daniel's phone hosts and publishes it; Nik's phone reads it and
365:   // joins; either phone re-attaches to it after a closed tab. The manual code controls stay behind USE A SESSION CODE
366:   // for accounts that are not permanently paired (r79 PR3: a paired account has no USE A SESSION CODE path).
367:   const SRJ_OFFER_POLL_MS=3000,SRJ_OFFER_POLL_LIMIT_MS=10*60*1000,SRJ_OFFER_MIN_LIFE_MS=60*1000;
368:   let srjAutoPromise=null,srjOfferTimer=null,srjPublishTimer=null,srjPublishRetry=null;
369:   let srjWaitGeneration=0,srjResumePromise=null;
370:   function srjOfferRef(context){return context.services.firestoreSdk.doc(context.services.firestore,"rivalries",context.rivalryId,"sessionOffers","current");}
371:   // r79 gallery (Nik's JOIN after a deleted Showdown): the pointer is what a waiting phone polls for, so the budget layer must
372:   // not answer it from a copy. With any healthy wait-point listener on the page (the previous Showdown's shared setup kept one)
373:   // a background check reused documents for 60 s, so Nik read "no offer" for a minute after Daniel had published his session.
374:   // wantFresh(path) keeps this one document on the 2 s coalescing window: one read per 3 s poll, the cadence it always had.
375:   function srjOfferFromSnapshot(snapshot){
376:     if(!snapshot||typeof snapshot.exists!=="function")throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
377:     const exists=snapshot.exists();
378:     if(exists===false)return null;
379:     if(exists!==true)throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
380:     const data=snapshot.data(),expiresAt=data?.expiresAt?.toMillis?.();
381:     if(!data||data.schemaVersion!==1||typeof data.sessionId!=="string"||!data.sessionId||typeof data.hostAccountId!=="string"||!data.hostAccountId||!Number.isFinite(expiresAt))throw srjError("REMOTE_JOINING_OFFER_UNREADABLE");
382:     return Object.freeze({sessionId:data.sessionId,hostAccountId:data.hostAccountId,expiresAtEpochMs:expiresAt});
383:   }
384:   async function srjReadOffer(context){
385:     root.CareerModeFirestoreBudget?.wantFresh?.(`rivalries/${context.rivalryId}/sessionOffers/current`);
386:     const sdk=context.services.firestoreSdk;
387:     return sdk.runTransaction(context.services.firestore,async transaction=>srjOfferFromSnapshot(await transaction.get(srjOfferRef(context))));
388:   }
389:   // Absence, a session this account is not a member of (an older pairing's account), and terminal/expired sessions are
390:   // positive answers. All other failures keep the pointer unresolved.
391:   async function srjReadSession(context,sessionId){
392:     const result=await context.protocol.readSession(srjOperationOptions(context,sessionId));
393:     if(result?.ok===false&&["PRIVATE_SESSION_NOT_FOUND","PRIVATE_SESSION_MEMBER_REQUIRED"].includes(result.code))return null;
394:     if(!result||result.ok!==true||result.sessionId!==sessionId||!["open","active","closed","revoked","expired"].includes(result.state))throw srjError("REMOTE_JOINING_SESSION_UNREADABLE");
395:     if(["closed","revoked","expired"].includes(result.state))return null;
396:     if(!Number.isFinite(result.expiresAtEpochMs))throw srjError("REMOTE_JOINING_SESSION_UNREADABLE");
397:     return result.expiredByClock===true||result.expiresAtEpochMs<=srjClockNow()?null:result;
398:   }
399:   let srjConnectReadPending=false;
400:   // JOB-1 F1: retry the exact failed read at 0, 3 and 9 seconds. Hidden pages pause for the existing wake/retry path.
401:   async function srjConnectRead(read){
402:     for(let attempt=0;attempt<3;attempt++){
403:       if(root.document?.visibilityState==="hidden")break;
404:       try{
405:         const result=await read();
406:         if(root.document?.visibilityState==="hidden")break;
407:         return result;
408:       }catch(_error){
409:         if(attempt===2||root.document?.visibilityState==="hidden"||typeof root.setTimeout!=="function")break;
410:         await new Promise(resolve=>root.setTimeout(resolve,3000*(attempt+1)));
411:       }
412:     }
413:     throw srjError("REMOTE_JOINING_READ_UNAVAILABLE");
414:   }
415:   async function srjWriteOffer(context){
416:     if(!srjState.sessionId||srjState.role!=="host"||!["open","active"].includes(srjState.sessionState)||!Number.isFinite(srjState.expiresAtEpochMs))return false;
417:     try{
418:       const sessionId=srjState.sessionId,guard=await srjOfferReplacement(context,sessionId);
419:       return guard.outcome==="ours"||(!guard.outcome&&await srjCommitOffer(context,sessionId,guard.seen)==="written");
420:     }catch(_error){return false;}
421:   }
422:   function srjHostsByDefault(){const identity=root.CareerModeOnlinePlayerIdentity&&typeof root.CareerModeOnlinePlayerIdentity.getState==="function"?root.CareerModeOnlinePlayerIdentity.getState():null;return Boolean(identity&&identity.managerId==="daniel");}
423:   function srjRivalName(){return srjHostsByDefault()?"NIK":"DANIEL";}
424:   async function srjAdopt(context,sessionId,role,joinOpen,generation=srjWaitGeneration,retryRead=false){
425:     const read=()=>srjReadSession(context,sessionId);
426:     const result=await (retryRead?srjConnectRead(read):read());
427:     if(generation!==srjWaitGeneration||!result)return null;
428:     if(result.state==="active"){srjAcceptResult(result,context,role,"Connected to your Showdown again.");return {ok:true,kind:"resumed"};}
429:     if(result.state!=="open")return null;
430:     if(role==="host"){srjOfferConfirmed=sessionId;srjAcceptResult(result,context,"host",`Waiting for ${srjRivalName()==="NIK"?"Nik":"Daniel"} to open the game.`);srjSetState({auto:"waiting"});srjWatchForJoin(sessionId);return {ok:true,kind:"hosting"};}
431:     if(!joinOpen)return null;
432:     const joined=await srjStartJoin(sessionId);
433:     return joined&&joined.ok===true?{ok:true,kind:"joined"}:null;
434:   }
435:   function srjStopOfferWait(){if(srjOfferTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjOfferTimer);srjOfferTimer=null;}
436:   function srjPauseWait(message=srjState.message){
437:     srjSetState({auto:"waiting",waitRetry:true,message});
438:   }
439:   async function srjCheckForOffer(generation){
440:     try{
441:       const context=await srjResolveContext(),offer=await srjReadOffer(context);
442:       if(generation===srjWaitGeneration&&offer&&offer.hostAccountId!==context.accountId&&offer.expiresAtEpochMs>srjClockNow()+SRJ_OFFER_MIN_LIFE_MS&&srjState.auto==="waiting"&&!srjState.busy&&!srjHasNonterminalSession()){
443:         const adopted=await srjAdopt(context,offer.sessionId,"peer",true,generation);
444:         if(adopted){srjSetState({auto:null,waitRetry:false});return;}
445:       }
446:     }catch(_error){}
447:   }
448:   function srjWaitForOffer(startedAt=Date.now(),generation=srjWaitGeneration){
449:     srjStopOfferWait();
450:     if(typeof root.setTimeout!=="function")return;
451:     const timer=root.setTimeout(async()=>{
452:       if(srjOfferTimer!==timer)return;
453:       srjOfferTimer=null;
454:       if(generation!==srjWaitGeneration||srjHasNonterminalSession()||srjState.auto!=="waiting")return;
455:       if(Date.now()-startedAt>SRJ_OFFER_POLL_LIMIT_MS){srjPauseWait();return;}
456:       if(!srjState.busy&&(!root.document||root.document.visibilityState!=="hidden"))await srjCheckForOffer(generation);
457:       if(generation===srjWaitGeneration&&!srjHasNonterminalSession()&&srjState.auto==="waiting")srjWaitForOffer(startedAt,generation);
458:     },SRJ_OFFER_POLL_MS);
459:     srjOfferTimer=timer;
460:   }
461:   // JOB-1 F2: a wake or retry owns one immediate read and a new ten-minute window. Retired callbacks cannot re-arm it.
462:   // Codex #974: an offer publish retry whose own window ran out while asleep gets a fresh window too.
463:   function srjResumeWait(){
464:     if(srjResumePromise)return srjResumePromise;
465:     if(root.document?.visibilityState==="hidden"||srjState.busy||srjState.pendingAction||srjAutoPromise)return Promise.resolve(false);
466:     if(srjConnectReadPending)return srjAutoConnect();
467:     const sessionId=srjHostWaitingForJoin(srjState.sessionId)?srjState.sessionId:null;
468:     if(!sessionId&&(srjState.auto!=="waiting"||srjHasNonterminalSession()))return Promise.resolve(false);
469:     const generation=++srjWaitGeneration,startedAt=Date.now();
470:     srjStopOfferWait();
471:     if(srjJoinWatchTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);
472:     srjJoinWatchTimer=null;srjJoinWatchSessionId=null;
473:     srjSetState({waitRetry:false});
474:     srjResumePromise=(async()=>{
475:       if(sessionId){
476:         await srjCheckForJoin(sessionId,generation);
477:         if(generation===srjWaitGeneration){srjWatchForJoin(sessionId,startedAt,generation);if(srjHostWaitingForJoin(sessionId)&&srjOfferConfirmed!==sessionId&&(!srjPublishRetry||Date.now()-srjPublishRetry.startedAt>SRJ_OFFER_POLL_LIMIT_MS)&&srjPermanentlyPaired())srjRetryOfferPublish(sessionId);}
478:       }else{
479:         await srjCheckForOffer(generation);
480:         if(generation===srjWaitGeneration&&srjState.auto==="waiting"&&!srjHasNonterminalSession())srjWaitForOffer(startedAt,generation);
481:       }
482:       return true;
483:     })().finally(()=>{srjResumePromise=null;});
484:     return srjResumePromise;
485:   }
486:   // Codex #904 (release review): a permanently paired account has no USE A SESSION CODE path, so when Daniel's session is
487:   // open but the pointer write fails, "send Nik this session code" was a dead end: Nik's phone only ever reads the pointer.
488:   // Daniel keeps waiting and this page publishes the pointer again (3 s, doubling to once a minute, visible tab only, 10 min
489:   // like Nik's own wait, sooner when the browser comes back online) until it lands or the session stops waiting for a join.
490:   // Codex #920: each try first reads the pointer. Naming this session ends the retry with no write (a write whose answer
491:   // was lost). Naming another session that the server does not positively report as gone or over
492:   // means no write (a newer screen of Daniel's may own the game, and Nik must not be sent back to this one); the retry
493:   // keeps checking in case that session ends. This session must still read OPEN, and a stale or missing pointer is replaced
494:   // only if it is still the one just read. Reopening the player panel restarts a retry that gave up.
495:   let srjOfferConfirmed=null;
496:   // Codex #920: the host's join watch has its own 10 min limit, so it starts afresh whenever the pointer lands or publishing
497:   // restarts; otherwise Nik could join after it ended and Daniel's screen would stay on WAITING until a reload.
498:   function srjRewatchForJoin(sessionId){if(srjJoinWatchTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjJoinWatchTimer);srjJoinWatchTimer=null;srjJoinWatchSessionId=null;const watching=srjWatchForJoin(sessionId);if(watching)srjSetState({waitRetry:false});return watching;}
499:   function srjStopPublishRetry(){if(srjPublishTimer!==null&&typeof root.clearTimeout==="function")root.clearTimeout(srjPublishTimer);srjPublishTimer=null;srjPublishRetry=null;}
500:   async function srjOfferReplacement(context,sessionId){
501:     const seen=await srjReadOffer(context);
502:     if(seen?.sessionId===sessionId)return {seen,outcome:"ours"};
503:     // Even a short-lived or stale pointer may name a live session. Only a positive session read permits replacement.
504:     if(seen&&await srjReadSession(context,seen.sessionId))return {seen,outcome:"taken"};
505:     return {seen,outcome:null};
506:   }
507:   async function srjCommitOffer(context,sessionId,seen){
508:     if(!srjPendingContextMatches(context)||srjState.sessionId!==sessionId||srjState.role!=="host")return "stop";
509:     const sdk=context.services.firestoreSdk;
510:     const value={schemaVersion:1,sessionId,hostAccountId:context.accountId,expiresAt:sdk.Timestamp.fromMillis(srjState.expiresAtEpochMs),updatedAt:sdk.serverTimestamp()};
511:     root.CareerModeFirestoreBudget?.wantFresh?.(`rivalries/${context.rivalryId}/sessionOffers/current`);
512:     return sdk.runTransaction(context.services.firestore,async transaction=>{
513:       const current=srjOfferFromSnapshot(await transaction.get(srjOfferRef(context)));
514:       if((current?current.sessionId:null)!==(seen?seen.sessionId:null))return "retry";
515:       transaction.set(srjOfferRef(context),value);return "written";
516:     });
517:   }
518:   async function srjPublishIfStillOurs(context,sessionId){
519:     const guard=await srjOfferReplacement(context,sessionId);
520:     if(guard.outcome)return guard.outcome;
521:     // This session itself must still be open on the server before Nik is pointed at it.
522:     const own=await srjReadSession(context,sessionId);
523:     if(!own)return "stop";
524:     if(own.state==="active"){if(srjHostWaitingForJoin(sessionId))srjAcceptResult(own,context,"host","The other manager joined. Private session is active with exactly the two paired rivalry accounts.");return "stop";}
525:     if(!(own.expiresAtEpochMs>srjClockNow()+SRJ_OFFER_MIN_LIFE_MS)||!srjHostWaitingForJoin(sessionId))return "stop";
526:     return srjCommitOffer(context,sessionId,guard.seen);
527:   }
528:   function srjRetryOfferPublish(sessionId,startedAt=Date.now(),attempt=0){
529:     srjStopPublishRetry();
530:     if(typeof root.setTimeout!=="function")return false;
531:     srjPublishRetry={sessionId,startedAt};
532:     const timer=root.setTimeout(async()=>{
533:       if(srjPublishTimer!==timer)return;
534:       srjPublishTimer=null;
535:       if(!srjHostWaitingForJoin(sessionId)){srjPublishRetry=null;return;}
536:       if(Date.now()-startedAt>SRJ_OFFER_POLL_LIMIT_MS){srjPublishRetry=null;if(srjState.message!=="Your game is open on another screen. Carry on there.")srjSetState({message:"Nik's phone could not be reached. Check your connection, then open the game again."});return;}
537:       if(!srjState.busy&&(!root.document||root.document.visibilityState!=="hidden")){
538:         try{
539:           const context=await srjResolveContext();
540:           if(srjPublishTimer!==null)return;  // the browser came back online meanwhile and restarted the retry
541:           if(!srjPendingContextMatches(context)){srjPublishRetry=null;return;}  // another account or Showdown now: not ours to publish
542:           const outcome=await srjPublishIfStillOurs(context,sessionId);
543:           if(outcome==="ours"||outcome==="written"){srjOfferConfirmed=sessionId;srjPublishRetry=null;if(srjState.message==="Your game is open on another screen. Carry on there.")srjSetState({message:"Waiting for Nik to open the game."});srjRewatchForJoin(sessionId);return;}
544:           if(outcome==="taken"){if(srjHostWaitingForJoin(sessionId)&&srjState.message!=="Your game is open on another screen. Carry on there.")srjSetState({message:"Your game is open on another screen. Carry on there."});}
545:           if(outcome==="stop"){srjPublishRetry=null;return;}
546:         }catch(_error){}
547:       }
548:       if(srjPublishTimer===null&&srjPublishRetry&&srjPublishRetry.sessionId===sessionId)srjRetryOfferPublish(sessionId,startedAt,attempt+1);
549:     },Math.min(SRJ_OFFER_POLL_MS*2**attempt,60*1000));
550:     srjPublishTimer=timer;
551:     return true;
552:   }
553:   async function srjAutoConnectOnce(){
554:     srjRetireEnded();
555:     if(srjState.busy||srjState.pendingAction||srjReplaceAction)return {ok:false,code:"REMOTE_JOINING_BUSY",message:"A private-session operation is already in progress."};
556:     let context;
557:     try{context=await srjResolveContext();}catch(error){srjSetState({auto:null});return {ok:false,code:error&&error.code||"REMOTE_JOINING_CONTEXT_UNAVAILABLE",message:srjPlain(error,"Connecting is not available right now. Try again.")};}
558:     if(srjHasNonterminalSession()&&srjPendingContextMatches(context)){
559:       if(srjState.sessionState==="active")srjSetState({auto:null});
560:       else if(srjHostWaitingForJoin(srjState.sessionId)&&srjOfferConfirmed!==srjState.sessionId&&!srjPublishRetry&&srjPermanentlyPaired()){srjSetState({auto:"waiting",message:"Waiting for Nik to open the game."});srjRewatchForJoin(srjState.sessionId);srjRetryOfferPublish(srjState.sessionId);return {ok:true,kind:"held-publishing"};}
561:       if(srjHostWaitingForJoin(srjState.sessionId))srjRewatchForJoin(srjState.sessionId);
562:       return {ok:true,kind:"held"};
563:     }
564:     srjSetState({auto:"connecting",waitRetry:false,message:"Connecting to your Showdown…"});
565:     const offer=await srjConnectRead(()=>srjReadOffer(context));
566:     if(offer){
567:       const mine=offer.hostAccountId===context.accountId;
568:       const adopted=await srjAdopt(context,offer.sessionId,mine?"host":"peer",!mine,srjWaitGeneration,true);
569:       if(adopted){srjConnectReadPending=false;if(adopted.kind!=="hosting")srjSetState({auto:null});return adopted;}
570:     }
571:     srjConnectReadPending=false;
572:     if(srjHostsByDefault()){
573:       const hosted=await srjStartHost();
574:       if(hosted&&hosted.ok===true&&srjState.role==="host"&&srjState.sessionId){
575:         const published=await srjWriteOffer(context);
576:         if(published)srjOfferConfirmed=srjState.sessionId;
577:         if(published||srjPermanentlyPaired()){
578:           srjSetState({auto:"waiting",message:"Waiting for Nik to open the game."});
579:           if(!published)srjRetryOfferPublish(srjState.sessionId);
580:           return {ok:true,kind:published?"hosted":"hosted-publishing"};
581:         }
582:         srjSetState({auto:null,message:"Send Nik this session code to connect."});
583:         return {ok:true,kind:"hosted-manual"};
584:       }
585:       srjSetState({auto:null});
586:       return hosted||{ok:false,code:"REMOTE_JOINING_HOST_FAILED",message:"Could not connect. Try again."};
587:     }
588:     srjSetState({auto:"waiting",message:"Waiting for Daniel to open the game."});
589:     srjWaitForOffer();
590:     return {ok:true,kind:"waiting"};
591:   }
592:   function srjAutoConnect(){
593:     if(srjAutoPromise)return srjAutoPromise;
594:     if(!srjHasNonterminalSession()&&!srjState.busy&&!srjState.pendingAction)srjSetState({auto:"connecting",message:"Connecting to your Showdown…"});
595:     srjAutoPromise=srjAutoConnectOnce().catch(error=>{
596:       if(error?.code==="REMOTE_JOINING_READ_UNAVAILABLE"){srjConnectReadPending=true;srjPauseWait("Could not connect. Try again.");}
597:       else srjSetState({auto:null});
598:       return {ok:false,code:error&&error.code||"REMOTE_JOINING_AUTO_FAILED",message:srjPlain(error,"Could not connect. Try again.")};
599:     }).finally(()=>{srjAutoPromise=null;});
600:     return srjAutoPromise;
601:   }
602:   function srjPermanentlyPaired(){try{const partner=root.CareerModePersistentNikDanielPair?.getPartnerState?.(),account=root.CareerModeSparkConnectedAccount?.getState?.();return Boolean(partner&&partner.status==="ready"&&partner.record&&partner.record.active===true&&account&&partner.accountId===account.accountId);}catch(_error){return false;}}
603:   function srjUseManualCode(){if(srjPermanentlyPaired())return srjState;srjStopOfferWait();return srjSetState({auto:null});}
604:   function srjRenderAuto(body){
605:     const waiting=srjState.auto==="waiting",retry=waiting&&srjState.waitRetry;
606:     const intro=srjCreate("div","remoteJoiningIntro");
607:     intro.append(srjCreate("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),srjCreate("h2","",waiting?`WAITING FOR ${srjRivalName()}`:"CONNECTING"),srjCreate("p","",retry?srjState.message:waiting?`Your game is ready. It continues by itself as soon as ${srjRivalName()==="NIK"?"Nik":"Daniel"} opens Career Mode Showdown and taps CONTINUE CAREER.`:"Connecting Daniel and Nik to the same game. This takes a moment."));
608:     body.appendChild(intro);
609:     if(retry){const actions=srjCreate("div","remoteJoiningActions"),button=srjCreate("button","compactButton","TRY AGAIN");button.type="button";button.disabled=srjState.busy;button.addEventListener("click",()=>{void srjResumeWait();});actions.appendChild(button);body.appendChild(actions);}
610:     // r79 PR3: a permanently paired account connects through the pair's session pointer only, so the manual USE A SESSION CODE
611:     // path is gone for it. An account that is not (yet) permanently paired keeps it as the fallback.
612:     if(!srjPermanentlyPaired()){
613:       const actions=srjCreate("div","remoteJoiningActions");
614:       const manual=srjCreate("button","compactButton","USE A SESSION CODE");manual.type="button";manual.disabled=srjState.busy;manual.addEventListener("click",srjUseManualCode);actions.appendChild(manual);
615:       body.appendChild(actions);
616:     }
617:     const note=srjCreate("p","remoteJoiningStatus",srjState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.appendChild(note);
618:   }
619:   function srjCreate(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined&&text!==null)element.textContent=String(text);return element;}
620:   function srjShort(value){return typeof value!=="string"||!value?"—":value.length<=20?value:`${value.slice(0,12)}…${value.slice(-6)}`;}
621:   function srjRenderPanel(){
622:     if(!root.document||srjState.open!==true)return null;
623:     const overlay=root.document.getElementById(SRJ_PANEL_ID);
624:     if(!overlay)return null;
625:     const body=overlay.querySelector(".remoteJoiningBody");
626:     if(!body)return overlay;
627:     body.replaceChildren();
628:     if(srjState.auto){srjRenderAuto(body);return overlay;}
629:     const intro=srjCreate("div","remoteJoiningIntro");
630:     intro.append(srjCreate("span","remoteJoiningEyebrow","PRIVATE CONNECTION"),srjCreate("h2","","REMOTE JOINING"),srjCreate("p","","This connection is only for Daniel and Nik. If the network drops, retry the same code instead of creating another one."));
631:     body.appendChild(intro);
632:     const grid=srjCreate("div","remoteJoiningGrid");
633:     const host=srjCreate("section","remoteJoiningCard");
634:     host.append(srjCreate("span","remoteJoiningStep","01 · HOST"),srjCreate("h3","","CREATE CONNECTION CODE"),srjCreate("p","","Creates one fresh code for this Showdown."));
635:     const replaceable=srjHeldSessionReplaceable(),joinReplaces=replaceable&&srjState.sessionState==="active";
636:     const hostButton=srjCreate("button","menuButton",replaceable?"HOST NEW SESSION (REPLACES CURRENT)":"HOST PRIVATE SESSION");hostButton.type="button";hostButton.disabled=srjState.busy||(srjSessionBlocksStart()&&!replaceable);hostButton.addEventListener("click",()=>{void srjHostSession(replaceable?{replaceCurrent:true}:{});});host.appendChild(hostButton);
637:     const join=srjCreate("section","remoteJoiningCard");
638:     join.append(srjCreate("span","remoteJoiningStep","02 · JOIN"),srjCreate("h3","","JOIN CONNECTION"),srjCreate("p","","Paste the full code shared directly by the other already-paired manager."));
639:     const input=srjCreate("input","remoteJoiningInput");input.type="text";input.placeholder="session_…";input.autocomplete="off";input.autocapitalize="none";input.spellcheck=false;input.setAttribute("aria-label","Connection code");
640:     const joinButton=srjCreate("button","menuButton",joinReplaces?"JOIN NEW SESSION (ENDS CURRENT)":"JOIN PRIVATE SESSION");joinButton.type="button";joinButton.disabled=srjState.busy||(srjSessionBlocksStart()&&!joinReplaces);joinButton.addEventListener("click",()=>{void srjJoinSession(input.value,joinReplaces?{replaceCurrent:true}:{});});join.append(input,joinButton);grid.append(host,join);body.appendChild(grid);
641:     const current=srjCreate("section","remoteJoiningCurrent");
642:     current.append(srjCreate("span","remoteJoiningEyebrow","CURRENT CONNECTION"));
643:     if(srjState.sessionId){
644:       const expiredByClock=srjExpiredByClock();current.append(srjCreate("strong","remoteJoiningState",`${expiredByClock?"EXPIRED":String(srjState.sessionState||"unknown").toUpperCase()} · REV ${Number.isInteger(srjState.revision)?srjState.revision:"—"} · ${srjState.role||"member"}`));
645:       const visibleCode=srjState.capabilityCopyAllowed===true&&!srjState.pendingAction?srjState.sessionId:srjShort(srjState.sessionId);
646:       const code=srjCreate("code","remoteJoiningCode",visibleCode);current.appendChild(code);
647:       const meta=srjCreate("p","remoteJoiningMeta",`Rivalry ${srjShort(srjState.rivalryId)}${Number.isFinite(srjState.expiresAtEpochMs)?` · expires ${new Date(srjState.expiresAtEpochMs).toLocaleTimeString()}`:""}`);current.appendChild(meta);
648:       if(joinReplaces)current.appendChild(srjCreate("p","remoteJoiningMeta","If the other phone lost this session (for example after a reload), start a fresh one: host a new session here and send the code, or paste their new code above and join it. Either one ends this session first."));
649:       const actions=srjCreate("div","remoteJoiningActions");
650:       if(srjState.pendingAction){const retry=srjCreate("button","compactButton",`RETRY SAME ${srjState.pendingAction.toUpperCase()}`);retry.type="button";retry.disabled=srjState.busy;retry.addEventListener("click",()=>{void srjRetryPendingOperation();});actions.appendChild(retry);}
651:       const copy=srjCreate("button","compactButton","COPY CODE");copy.type="button";copy.disabled=srjState.busy||expiredByClock||srjState.capabilityCopyAllowed!==true||!!srjState.pendingAction;copy.addEventListener("click",async()=>{copy.textContent=await srjCopySessionCode()?"COPIED":"COPY UNAVAILABLE";});
652:       const refresh=srjCreate("button","compactButton","REFRESH / READ");refresh.type="button";refresh.disabled=srjState.busy||!!srjState.pendingAction;refresh.addEventListener("click",()=>{void srjRefreshSession();});
653:       const revoke=srjCreate("button","compactButton","REVOKE OPEN SESSION");revoke.type="button";revoke.disabled=srjState.busy||expiredByClock||!!srjState.pendingAction||srjState.sessionState!=="open";revoke.addEventListener("click",()=>{void srjRevokeSession();});
654:       const close=srjCreate("button","compactButton","CLOSE SESSION");close.type="button";close.disabled=srjState.busy||expiredByClock||!!srjState.pendingAction||srjState.sessionState!=="active";close.addEventListener("click",()=>{void srjCloseSession();});
655:       const forget=srjCreate("button","compactButton","FORGET CODE");forget.type="button";forget.disabled=srjState.busy||!!srjState.pendingAction||srjHasNonterminalSession()||srjState.sessionState==="unresolved";forget.addEventListener("click",srjForgetSession);actions.append(copy,refresh,revoke,close,forget);current.appendChild(actions);
656:     }else{
657:       current.append(srjCreate("p","remoteJoiningEmpty","No session code is held in page memory."));
658:       // BH-11 (#1): after a reload the other phone may still show the game with the old session; say where it takes the new code.
659:       current.append(srjCreate("p","remoteJoiningMeta","If the other phone still shows the game, it takes your new code from NEW CODE on its game banner, or from Home > CONTINUE CAREER > CONNECTED."));
660:     }
661:     body.appendChild(current);
662:     const note=srjCreate("p","remoteJoiningStatus",srjState.message);note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.appendChild(note);
663:     return overlay;
664:   }
665:   function srjOpenPanel(){
666:     if(!root.document)return false;
667:     let overlay=root.document.getElementById(SRJ_PANEL_ID);
668:     if(!overlay){
669:       overlay=srjCreate("div","remoteJoiningOverlay");overlay.id=SRJ_PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Private Remote Joining");
670:       const shell=srjCreate("div","remoteJoiningShell");const header=srjCreate("div","remoteJoiningHeader");header.append(srjCreate("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=srjCreate("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close Private Remote Joining");dismiss.addEventListener("click",srjClosePanel);header.appendChild(dismiss);const body=srjCreate("div","remoteJoiningBody");shell.append(header,body);overlay.appendChild(shell);root.document.body.appendChild(overlay);
671:     }
672:     overlay.classList.remove("hidden");srjSetState({open:true});const focus=overlay.querySelector("button");if(focus)focus.focus();return true;
673:   }
674:   function srjClosePanel(){const overlay=root.document&&root.document.getElementById(SRJ_PANEL_ID);if(overlay)overlay.classList.add("hidden");srjState=srjFreeze({...srjState,open:false});return true;}
675:   function srjSubscribe(listener){if(typeof listener!=="function")return()=>{};srjListeners.add(listener);return()=>srjListeners.delete(listener);}
676:   // Codex #904 (P2): an unresolved request (a host, join or close whose answer was lost) belongs to one Showdown. Once the
677:   // pair layer reports that Showdown ended (deleted on the other phone, or finished and let go on Home), the request is
678:   // moot: it is retired here so the next Showdown's auto-connect is not blocked as busy until a reload. No read, no write.
679:   function srjRetireEnded(){if(srjState.busy||!srjState.rivalryId||!srjEndedRivalryIds.has(srjState.rivalryId)||!(srjState.pendingAction||srjState.sessionState==="unresolved"))return false;srjStopPublishRetry();srjSetState({status:"idle",busy:false,auto:null,sessionId:null,rivalryId:null,accountId:null,deviceId:null,role:null,sessionState:null,revision:null,expiresAtEpochMs:null,pendingAction:null,capabilityCopyAllowed:false,message:"That Showdown has ended, so its unfinished connection was let go. Your Showdown was not changed."});return true;}
680:   function srjOnPairEnded(event){const rivalryId=String(event&&event.detail&&event.detail.closedRivalryId||"");if(!/^pair_[0-9a-f]{64}$/.test(rivalryId))return;srjEndedRivalryIds.add(rivalryId);if(srjRetireEnded())try{srjRenderPanel();}catch(_error){}}
681:   if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-permanent-pair-ended",srjOnPairEnded);
682:   function srjOnOnline(){if(srjState.pendingAction&&!srjState.busy)void srjRetryPendingOperation();if(srjPublishRetry)srjRetryOfferPublish(srjPublishRetry.sessionId,srjPublishRetry.startedAt);void srjResumeWait();}
683:   if(root&&typeof root.addEventListener==="function")root.addEventListener("online",srjOnOnline);
684:   if(root.document&&typeof root.document.addEventListener==="function")root.document.addEventListener("visibilitychange",()=>{if(root.document.visibilityState!=="hidden")void srjResumeWait();});
685:   // r79 PR3: the partner record can land while this panel is open (Daniel records his first real pairing alongside his
686:   // auto-continue), so the open panel re-renders and USE A SESSION CODE goes away. No read: render only.
687:   if(root&&typeof root.addEventListener==="function")root.addEventListener("career-mode-permanent-pair-change",()=>{try{srjRenderPanel();}catch(_error){}});
688: 
689:   return srjFreeze({
690:     contractVersion:1,
691:     feature:"stage5e-production-private-remote-joining-runtime",
692:     productionRulesPublished:true,
693:     providerIdentity:"standard-firebase-request-auth-uid",
694:     authPersistence:"browserSessionPersistence",
695:     registeredDeviceAuthority:"account-owned-mutation-metadata",
696:     exactCapabilityBits:256,
697:     hostSessionTtlMs:SRJ_HOST_TTL_MS,
698:     clockNow:srjClockNow,
699:     serverNow:srjServerNow,
700:     sessionCapabilityStorage:"page-memory-only",
701:     persistentFirestoreCache:false,
702:     publicDiscovery:false,
703:     collectionListing:false,
704:     exactlyTwoAccounts:true,
705:     gameplayMutation:false,
706:     canonicalStorageMutation:false,
707:     canonicalStorageKeys:SRJ_CANONICAL_KEYS,
708:     candidateCInvolved:false,
709:     billingRequired:false,
710:     blazeRequired:false,
711:     cloudRunRequired:false,
712:     cloudFunctionsRequired:false,
713:     appCheckEnforcementRequired:false,
714:     hostJoinUxExposed:true,
715:     sameCapabilityReconnect:true,
716:     unresolvedCapabilityCopyBlocked:true,
717:     onlineRetryBounded:true,
718:     autoConnect:srjAutoConnect,
719:     useManualCode:srjUseManualCode,
720:     hostSession:srjHostSession,
721:     joinSession:srjJoinSession,
722:     retryPendingOperation:srjRetryPendingOperation,
723:     refreshSession:srjRefreshSession,
724:     revokeSession:srjRevokeSession,
725:     closeSession:srjCloseSession,
726:     forgetSession:srjForgetSession,
727:     openPanel:srjOpenPanel,
728:     closePanel:srjClosePanel,
729:     subscribe:srjSubscribe,
730:     getState:()=>srjState
731:   });
732: });
```

## FILE: firestore.persistent-pair-production.fragment.rules (672 lines)
```
1: // r41 production redeploy: authority unchanged; adversarial role-switch fixture corrected.
2: // CMS_PERSISTENT_PAIR_FUNCTIONS_BEGIN
3:     function cmsPersistentPairManagerValid(role, managerId) {
4:       return (role == 'playerOne' && managerId == 'daniel')
5:         || (role == 'playerTwo' && managerId == 'nik');
6:     }
7: 
8:     function cmsPersistentPairRivalryMembership(accountId, rivalryId, role) {
9:       let rivalry = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId));
10:       let data = rivalry.data.data;
11:       return rivalryId is string
12:         && rivalryId.matches('^pair_[0-9a-f]{64}$')
13:         && rivalry.data.objectType == 'rivalry'
14:         && rivalry.data.objectId == rivalryId
15:         && rivalry.data.lifecycleState == 'live'
16:         && (data.connectionState == 'pending-pair' || data.connectionState == 'active')
17:         && data.managerSlots is list
18:         && data.managerSlots.size() == 2
19:         && (
20:           (
21:             data.managerSlots[0].slotId == role
22:             && data.managerSlots[0].accountId == accountId
23:             && data.managerSlots[0].entitlementState == 'active'
24:           )
25:           ||
26:           (
27:             data.managerSlots[1].slotId == role
28:             && data.managerSlots[1].accountId == accountId
29:             && data.managerSlots[1].entitlementState == 'active'
30:           )
31:         );
32:     }
33: 
34:     function cmsPersistentPairCreationWitnessValid(rivalryId) {
35:       let pair = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
36:       let pairData = pair.data.data;
37:       return pair.data.objectType == 'pairLink'
38:         && pair.data.objectId == 'current'
39:         && pair.data.lifecycleState == 'live'
40:         && pair.data.updatedByAccountId == request.auth.uid
41:         && pairData.rivalryId == rivalryId
42:         && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId);
43:     }
44: 
45:     function cmsPersistentPairRedemptionWitnessValid(rivalryId, role) {
46:       let pairData = getAfter(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current).data.data;
47:       return pairData.rivalryId == rivalryId
48:         && pairData.managerRole == role
49:         && cmsPersistentPairManagerValid(role, pairData.managerId);
50:     }
51: 
52:     function cmsPersistentPairDataValid(accountId, pairData) {
53:       return pairData.keys().hasOnly([
54:           'rivalryId',
55:           'managerRole',
56:           'managerId',
57:           'linkedAt',
58:           'lastConfirmedAt'
59:         ])
60:         && pairData.rivalryId is string
61:         && pairData.rivalryId.matches('^pair_[0-9a-f]{64}$')
62:         && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
63:         && pairData.linkedAt is timestamp
64:         && pairData.lastConfirmedAt is timestamp
65:         && pairData.lastConfirmedAt >= pairData.linkedAt
66:         && cmsPersistentPairRivalryMembership(accountId, pairData.rivalryId, pairData.managerRole);
67:     }
68: 
69:     function cmsPersistentPairCanReplace(before, after) {
70:       let priorRivalry = get(/databases/$(database)/documents/rivalries/$(before.data.rivalryId));
71:       let priorInvite = get(/databases/$(database)/documents/rivalries/$(before.data.rivalryId)/invites/$(before.data.rivalryId));
72:       let sameManager = after.data.managerRole == before.data.managerRole
73:         && after.data.managerId == before.data.managerId;
74:       return (
75:           after.data.rivalryId == before.data.rivalryId
76:           && sameManager
77:         )
78:         || (
79:           priorRivalry.data.objectType == 'rivalry'
80:           && priorRivalry.data.data.connectionState == 'closed'
81:         )
82:         || (
83:           sameManager
84:           && priorRivalry.data.objectType == 'rivalry'
85:           && priorRivalry.data.data.connectionState == 'pending-pair'
86:           && priorInvite.data.objectType == 'invite'
87:           && (
88:             priorInvite.data.data.state != 'open'
89:             || priorInvite.data.data.expiresAt <= request.time
90:           )
91:         );
92:     }
93: 
94:     function cmsPersistentPairAbandonActorValid(before, rivalryId) {
95:       let pair = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/pairLinks/current);
96:       let pairData = pair.data.data;
97:       let slots = before.data.managerSlots;
98:       return pair.data.objectType == 'pairLink'
99:         && pair.data.objectId == 'current'
100:         && pair.data.lifecycleState == 'live'
101:         && pairData.rivalryId == rivalryId
102:         && cmsPersistentPairManagerValid(pairData.managerRole, pairData.managerId)
103:         && slots is list
104:         && slots.size() == 2
105:         && (
106:           (
107:             slots[0].slotId == pairData.managerRole
108:             && slots[0].accountId == request.auth.uid
109:             && slots[0].entitlementState == 'active'
110:           )
111:           ||
112:           (
113:             slots[1].slotId == pairData.managerRole
114:             && slots[1].accountId == request.auth.uid
115:             && slots[1].entitlementState == 'active'
116:           )
117:         );
118:     }
119: 
120:     function cmsPersistentPairAbandonValid(rivalryId) {
121:       let before = resource.data;
122:       let after = request.resource.data;
123:       return signedIn()
124:         && rivalryId is string
125:         && rivalryId.matches('^pair_[0-9a-f]{64}$')
126:         && before.objectType == 'rivalry'
127:         && before.objectId == rivalryId
128:         && before.lifecycleState == 'live'
129:         && (before.data.connectionState == 'pending-pair' || before.data.connectionState == 'active')
130:         // r89 Sacked (Codex C3 + re-check): a Showdown whose last accepted season has a sacking has finished. It closes only
131:         // through the proven Terminal Close (completed, sacked), never as Ended early, whether or not Terminal Progress has
132:         // recorded that season yet. Checked early, so a refusal stays far from the 1,000-expression limit. An active Showdown's END names the accepted seasons (seasonsPlayed = k): commit k is
133:         // ACKNOWLEDGED with nobody sacked (k = 0: none), and commit k + 1 is not ACKNOWLEDGED, so k is exactly the accepted
134:         // prefix. Two lookups on this rare write; the season writes are untouched.
135:         && (!('terminalProgress' in before.data) || !('sacked' in before.data.terminalProgress))
136:         && (before.data.connectionState == 'pending-pair'
137:           || (after.data.get('endedEarly', null) is map
138:             && after.data.endedEarly.get('seasonsPlayed', null) is int
139:             && (after.data.endedEarly.seasonsPlayed == 0
140:               || (get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.data.endedEarly.seasonsPlayed))).data.phase == 'ACKNOWLEDGED'
141:                 && !('sacked' in get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.data.endedEarly.seasonsPlayed))).data.results.playerOne)
142:                 && !('sacked' in get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.data.endedEarly.seasonsPlayed))).data.results.playerTwo)))
143:             && (!exists(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.data.endedEarly.seasonsPlayed + 1)))
144:               || get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.data.endedEarly.seasonsPlayed + 1))).data.phase != 'ACKNOWLEDGED')))
145:         && activeDevice(after.updatedByDeviceId)
146:         && validCasEnvelope(before, after, 'rivalry', rivalryId)
147:         && after.updatedByAccountId == request.auth.uid
148:         && cmsPersistentPairAbandonActorValid(before, rivalryId)
149:         && before.data.authorizedAccountIds is list
150:         && request.auth.uid in before.data.authorizedAccountIds
151:         && after.data.connectionState == 'closed'
152:         && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState', 'endedEarly'])
153:         && (!('endedEarly' in after.data) || cmsPersistentPairEndedEarlyValid(after.data.endedEarly));
154:     }
155: 
156:     // r80 END SHOWDOWN: the abandon write may carry the ended-early mark. seasonsPlayed is the
157:     // number of finished seasons (0..10), or null when the count could not be read.
158:     function cmsPersistentPairEndedEarlyValid(mark) {
159:       return mark is map
160:         && mark.keys().hasOnly(['seasonsPlayed'])
161:         && mark.keys().hasAll(['seasonsPlayed'])
162:         && (
163:           mark.seasonsPlayed == null
164:           || (mark.seasonsPlayed is int && mark.seasonsPlayed >= 0 && mark.seasonsPlayed <= 10)
165:         );
166:     }
167: 
168:     function cmsPersistentPairCreateValid(accountId, pairId) {
169:       let root = request.resource.data;
170:       return activeDevice(root.updatedByDeviceId)
171:         && request.auth.uid == accountId
172:         && pairId == 'current'
173:         && validCreateEnvelope(root, 'pairLink', pairId)
174:         && root.updatedByAccountId == accountId
175:         && cmsPersistentPairDataValid(accountId, root.data)
176:         && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, root.data.rivalryId));
177:     }
178: 
179:     function cmsPersistentPairUpdateValid(accountId, pairId) {
180:       let before = resource.data;
181:       let after = request.resource.data;
182:       return activeDevice(after.updatedByDeviceId)
183:         && request.auth.uid == accountId
184:         && pairId == 'current'
185:         && validCasEnvelope(before, after, 'pairLink', pairId)
186:         && after.updatedByAccountId == accountId
187:         && cmsPersistentPairDataValid(accountId, after.data)
188:         && after.data.linkedAt == before.data.linkedAt
189:         && cmsPersistentPairCanReplace(before, after)
190:         && (!cmsCareerIndexEnforced() || cmsCareerIndexPairLinkCoupled(accountId, after.data.rivalryId));
191:     }
192:     // CMS_CAREER_INDEX (D1, JOB-07): own-account, append-only, forward-only career index.
193:     function cmsCareerIndexPageCapacity() {
194:       return 500;
195:     }
196: 
197:     // Phase A admits legacy clients. Enable only after both managers receive the new shell.
198:     function cmsCareerIndexEnforced() {
199:       return false;
200:     }
201: 
202:     function cmsCareerIndexRecordsNewRivalry(accountId, rivalryId) {
203:       let ids = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data.data.rivalryIds;
204:       return ids is list
205:         && ids.size() >= 1
206:         && ids[ids.size() - 1] == rivalryId;
207:     }
208: 
209:     // Pair-link coupling (first creation AND replacement): when this commit makes the account a member of
210:     // the linked rivalry (creation by Daniel, redemption by Nik), the same commit must end the account's
211:     // career index with that rivalry. A link to a rivalry the account already belonged to before this
212:     // commit (reconfirm, Continue, recovery of a pre-deployment link) needs no index write and can never
213:     // add one.
214:     function cmsCareerIndexPairLinkCoupled(accountId, rivalryId) {
215:       let rivalryPath = /databases/$(database)/documents/rivalries/$(rivalryId);
216:       return (exists(rivalryPath) && accountId in get(rivalryPath).data.data.authorizedAccountIds)
217:         || cmsCareerIndexRecordsNewRivalry(accountId, rivalryId);
218:     }
219: 
220:     function cmsCareerIndexHeadDataValid(data) {
221:       return data.keys().hasOnly(['rivalryIds', 'sealedPageCount'])
222:         && data.keys().hasAll(['rivalryIds', 'sealedPageCount'])
223:         && data.rivalryIds is list
224:         && data.rivalryIds.size() >= 1
225:         && data.rivalryIds.size() <= cmsCareerIndexPageCapacity()
226:         && data.sealedPageCount is int
227:         && data.sealedPageCount >= 0;
228:     }
229: 
230:     function cmsCareerIndexCreationEligible(accountId, rivalryId) {
231:       let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
232:       return !exists(/databases/$(database)/documents/rivalries/$(rivalryId))
233:         && after.connectionState == 'pending-pair'
234:         && after.createdByAccountId == accountId
235:         && after.authorizedAccountIds == [accountId];
236:     }
237: 
238:     function cmsCareerIndexRedemptionEligible(accountId, rivalryId) {
239:       let before = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
240:       let after = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
241:       return before.connectionState == 'pending-pair'
242:         && after.connectionState == 'active'
243:         && before.authorizedAccountIds.size() == 1
244:         && !(accountId in before.authorizedAccountIds)
245:         && after.authorizedAccountIds == [before.createdByAccountId, accountId]
246:         && rivalryId in get(/databases/$(database)/documents/accounts/$(before.createdByAccountId)/careerIndex/current).data.data.rivalryIds;
247:     }
248: 
249:     function cmsCareerIndexAppendEligible(accountId, rivalryId) {
250:       let pair = getAfter(/databases/$(database)/documents/accounts/$(accountId)/pairLinks/current);
251:       return rivalryId is string
252:         && rivalryId.matches('^pair_[0-9a-f]{64}$')
253:         && pair != null
254:         && pair.data is map
255:         && pair.data.data is map
256:         && pair.data.data.rivalryId == rivalryId
257:         && cmsPersistentPairManagerValid(pair.data.data.managerRole, pair.data.data.managerId)
258:         && cmsPersistentPairRivalryMembership(accountId, rivalryId, pair.data.data.managerRole)
259:         && (
260:           cmsCareerIndexCreationEligible(accountId, rivalryId)
261:           || (
262:             exists(/databases/$(database)/documents/rivalries/$(rivalryId))
263:             && cmsCareerIndexRedemptionEligible(accountId, rivalryId)
264:           )
265:         );
266:     }
267: 
268:     function cmsCareerIndexPageSealedFrom(accountId, pageNumber, ids) {
269:       let page = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/$('page_' + string(pageNumber))).data;
270:       return page.objectType == 'careerIndexPage'
271:         && page.data.pageNumber == pageNumber
272:         && page.data.rivalryIds == ids;
273:     }
274: 
275:     function cmsCareerIndexHeadCreateValid(accountId) {
276:       let root = request.resource.data;
277:       return signedIn()
278:         && request.auth.uid == accountId
279:         && activeDevice(root.updatedByDeviceId)
280:         && validCreateEnvelope(root, 'careerIndex', 'current')
281:         && root.updatedByAccountId == accountId
282:         && cmsCareerIndexHeadDataValid(root.data)
283:         && root.data.sealedPageCount == 0
284:         && root.data.rivalryIds.size() == 1
285:         && cmsCareerIndexAppendEligible(accountId, root.data.rivalryIds[0]);
286:     }
287: 
288:     function cmsCareerIndexHeadUpdateValid(accountId) {
289:       let before = resource.data;
290:       let after = request.resource.data;
291:       let prior = before.data.rivalryIds;
292:       let next = after.data.rivalryIds;
293:       return signedIn()
294:         && request.auth.uid == accountId
295:         && activeDevice(after.updatedByDeviceId)
296:         && validCasEnvelope(before, after, 'careerIndex', 'current')
297:         && after.updatedByAccountId == accountId
298:         && cmsCareerIndexHeadDataValid(after.data)
299:         && (
300:           (
301:             prior.size() < cmsCareerIndexPageCapacity()
302:             && after.data.sealedPageCount == before.data.sealedPageCount
303:             && next.size() == prior.size() + 1
304:             && next[0:prior.size()] == prior
305:             && !(next[prior.size()] in prior)
306:             && cmsCareerIndexAppendEligible(accountId, next[prior.size()])
307:           )
308:           ||
309:           (
310:             prior.size() == cmsCareerIndexPageCapacity()
311:             && after.data.sealedPageCount == before.data.sealedPageCount + 1
312:             && next.size() == 1
313:             && !(next[0] in prior)
314:             && cmsCareerIndexPageSealedFrom(accountId, after.data.sealedPageCount, prior)
315:             && cmsCareerIndexAppendEligible(accountId, next[0])
316:           )
317:         );
318:     }
319: 
320:     function cmsCareerIndexPageCreateValid(accountId, pageId) {
321:       let root = request.resource.data;
322:       let headBefore = get(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
323:       let headAfter = getAfter(/databases/$(database)/documents/accounts/$(accountId)/careerIndex/current).data;
324:       return signedIn()
325:         && request.auth.uid == accountId
326:         && activeDevice(root.updatedByDeviceId)
327:         && validCreateEnvelope(root, 'careerIndexPage', pageId)
328:         && root.updatedByAccountId == accountId
329:         && root.data.keys().hasOnly(['pageNumber', 'rivalryIds'])
330:         && root.data.keys().hasAll(['pageNumber', 'rivalryIds'])
331:         && root.data.pageNumber is int
332:         && root.data.pageNumber == headBefore.data.sealedPageCount + 1
333:         && pageId == 'page_' + string(root.data.pageNumber)
334:         && headBefore.data.rivalryIds.size() == cmsCareerIndexPageCapacity()
335:         && root.data.rivalryIds == headBefore.data.rivalryIds
336:         && headAfter.revision == headBefore.revision + 1
337:         && headAfter.data.sealedPageCount == root.data.pageNumber;
338:     }
339: 
340:     // CMS_CAREER_START (owner decision): own-account "real career starts here" marker. Created once, active,
341:     // naming exactly the account's career index head ids (none when no index exists; never over sealed pages).
342:     // startedAt is the server time of the press. Afterwards only `active` may change, by CAS (so startedAt and the
343:     // list stay as written). Get, create and update only; no list, no delete.
344:     function cmsCareerStartDataValid(data) {
345:       return data.keys().hasOnly(['hiddenRivalryIds', 'active', 'startedAt'])
346:         && data.keys().hasAll(['hiddenRivalryIds', 'active', 'startedAt'])
347:         && data.hiddenRivalryIds is list
348:         && data.hiddenRivalryIds.size() <= cmsCareerIndexPageCapacity()
349:         && data.active is bool
350:         && data.startedAt is timestamp;
351:     }
352: 
353:     function cmsCareerStartMatchesIndex(accountId, ids) {
354:       let indexPath = /databases/$(database)/documents/accounts/$(accountId)/careerIndex/current;
355:       return (!exists(indexPath) && ids.size() == 0)
356:         || (exists(indexPath)
357:           && get(indexPath).data.data.sealedPageCount == 0
358:           && ids == get(indexPath).data.data.rivalryIds);
359:     }
360: 
361:     function cmsCareerStartCreateValid(accountId, startId) {
362:       let root = request.resource.data;
363:       return signedIn()
364:         && request.auth.uid == accountId
365:         && startId == 'current'
366:         && activeDevice(root.updatedByDeviceId)
367:         && validCreateEnvelope(root, 'careerStart', 'current')
368:         && root.updatedByAccountId == accountId
369:         && cmsCareerStartDataValid(root.data)
370:         && root.data.active == true
371:         && root.data.startedAt == request.time
372:         && cmsCareerStartMatchesIndex(accountId, root.data.hiddenRivalryIds);
373:     }
374: 
375:     function cmsCareerStartUpdateValid(accountId, startId) {
376:       let before = resource.data;
377:       let after = request.resource.data;
378:       return signedIn()
379:         && request.auth.uid == accountId
380:         && startId == 'current'
381:         && activeDevice(after.updatedByDeviceId)
382:         && validCasEnvelope(before, after, 'careerStart', 'current')
383:         && after.updatedByAccountId == accountId
384:         && cmsCareerStartDataValid(after.data)
385:         && after.data.diff(before.data).affectedKeys().hasOnly(['active']);
386:     }
387: 
388:     // CMS_PERMANENT_PARTNER (r79, owner decision 2026-10-17): each real account keeps one partner record naming the
389:     // account it paired with through a real (marker-holding) pairing. Written only by its owner, only while the named
390:     // rivalry has the owner and the partner in their slots. UNPAIR sets active false; re-pair needs active false.
391:     function cmsPartnerDataValid(data) {
392:       return data.keys().hasOnly(['schemaVersion', 'partnerAccountId', 'myRole', 'pairedViaRivalryId', 'pairedAt', 'active', 'updatedAt'])
393:         && data.keys().hasAll(['schemaVersion', 'partnerAccountId', 'myRole', 'pairedViaRivalryId', 'pairedAt', 'active', 'updatedAt'])
394:         && data.schemaVersion == 1
395:         && data.partnerAccountId is string
396:         && data.partnerAccountId != request.auth.uid
397:         && data.myRole in ['playerOne', 'playerTwo']
398:         && data.pairedViaRivalryId is string
399:         && data.pairedViaRivalryId.matches('^pair_[0-9a-f]{64}$')
400:         && data.pairedAt is timestamp
401:         && data.active is bool
402:         && data.updatedAt == request.time;
403:     }
404: 
405:     function cmsPartnerSlotsMatch(slots, myRole, partnerAccountId) {
406:       return slots is list
407:         && slots.size() == 2
408:         && slots[0].slotId == 'playerOne'
409:         && slots[1].slotId == 'playerTwo'
410:         && slots[0].entitlementState == 'active'
411:         && slots[1].entitlementState == 'active'
412:         && (
413:           (myRole == 'playerOne' && slots[0].accountId == request.auth.uid && slots[1].accountId == partnerAccountId)
414:           || (myRole == 'playerTwo' && slots[1].accountId == request.auth.uid && slots[0].accountId == partnerAccountId)
415:         );
416:     }
417: 
418:     // The pairing rivalry must belong to the real career: never one the account's career-start marker hid
419:     // (pre-career test games), and created after the marker (playerOne made it after pressing START REAL
420:     // CAREER; playerTwo writes its marker just before redeeming, so the rivalry is at most one invite
421:     // window, 30 min, older than that marker). rivalry.createdAt is the creating device's clock, so both
422:     // windows allow 5 min of clock skew. The marker's `active` flag only chooses whether test Showdowns are shown,
423:     // so it never affects pairing.
424:     function cmsPartnerPairingValid(accountId, data) {
425:       let rivalry = get(/databases/$(database)/documents/rivalries/$(data.pairedViaRivalryId)).data;
426:       let start = get(/databases/$(database)/documents/accounts/$(accountId)/careerStart/current).data.data;
427:       return cmsPartnerDataValid(data)
428:         && data.active == true
429:         && data.pairedAt == request.time
430:         && rivalry.objectType == 'rivalry'
431:         && rivalry.objectId == data.pairedViaRivalryId
432:         && rivalry.lifecycleState == 'live'
433:         && rivalry.data.connectionState in ['active', 'closed']
434:         && rivalry.data.authorizedAccountIds is list
435:         && rivalry.data.authorizedAccountIds.size() == 2
436:         && cmsPartnerSlotsMatch(rivalry.data.managerSlots, data.myRole, data.partnerAccountId)
437:         && !(data.pairedViaRivalryId in start.hiddenRivalryIds)
438:         && (
439:           (data.myRole == 'playerOne' && rivalry.data.createdAt >= start.startedAt - duration.value(5, 'm'))
440:           || (data.myRole == 'playerTwo' && rivalry.data.createdAt >= start.startedAt - duration.value(35, 'm'))
441:         );
442:     }
443: 
444:     function cmsPartnerCreateValid(accountId, partnerId) {
445:       return signedIn()
446:         && request.auth.uid == accountId
447:         && partnerId == 'current'
448:         && activeActor()
449:         && cmsPartnerPairingValid(accountId, request.resource.data);
450:     }
451: 
452:     function cmsPartnerUpdateValid(accountId, partnerId) {
453:       let before = resource.data;
454:       let after = request.resource.data;
455:       return signedIn()
456:         && request.auth.uid == accountId
457:         && partnerId == 'current'
458:         && activeActor()
459:         && (
460:           (
461:             before.active == true
462:             && cmsPartnerDataValid(after)
463:             && after.active == false
464:             && after.diff(before).affectedKeys().hasOnly(['active', 'updatedAt'])
465:           )
466:           || (
467:             before.active == false
468:             && cmsPartnerPairingValid(accountId, after)
469:           )
470:         );
471:     }
472: 
473:     // CMS_PARTNER_INBOX (r79): the private JOIN note. Daniel's START writes it into Nik's account; only Nik reads it.
474:     // Both partner records must be active and point at each other, the writer must be playerOne, and the note must
475:     // name the writer's own open pending rivalry with the invite's exact expiry and the season count in the id.
476:     // One doc, overwritten on each START, never listed or deleted; an expired note is useless because redeem checks
477:     // the invite's expiry. Re-writing the same rivalry is allowed only after 60 s (a safe client retry), so a retry loop
478:     // cannot burn the Spark quota.
479:     function cmsPartnerInboxSeasonsMatch(rivalryId, totalSeasons) {
480:       return (totalSeasons == 1 && rivalryId.matches('^pair_1[0-9a-f]{63}$'))
481:         || (totalSeasons == 3 && rivalryId.matches('^pair_3[0-9a-f]{63}$'))
482:         || (totalSeasons == 5 && rivalryId.matches('^pair_5[0-9a-f]{63}$'))
483:         || (totalSeasons == 10 && rivalryId.matches('^pair_a[0-9a-f]{63}$'));
484:     }
485: 
486:     function cmsPartnerInboxWriteValid(accountId, noteId) {
487:       let note = request.resource.data;
488:       let mine = get(/databases/$(database)/documents/accounts/$(request.auth.uid)/partner/current).data;
489:       let theirs = get(/databases/$(database)/documents/accounts/$(accountId)/partner/current).data;
490:       let rivalry = get(/databases/$(database)/documents/rivalries/$(note.rivalryId)).data;
491:       let invite = get(/databases/$(database)/documents/rivalries/$(note.rivalryId)/invites/$(note.rivalryId)).data;
492:       return signedIn()
493:         && noteId == 'current'
494:         && accountId != request.auth.uid
495:         && activeActor()
496:         && note.keys().hasOnly(['schemaVersion', 'rivalryId', 'totalSeasons', 'fromAccountId', 'createdAt', 'expiresAt'])
497:         && note.keys().hasAll(['schemaVersion', 'rivalryId', 'totalSeasons', 'fromAccountId', 'createdAt', 'expiresAt'])
498:         && note.schemaVersion == 1
499:         && note.fromAccountId == request.auth.uid
500:         && note.createdAt == request.time
501:         && note.rivalryId is string
502:         && note.rivalryId.matches('^pair_[0-9a-f]{64}$')
503:         && cmsPartnerInboxSeasonsMatch(note.rivalryId, note.totalSeasons)
504:         && mine.active == true
505:         && mine.myRole == 'playerOne'
506:         && mine.partnerAccountId == accountId
507:         && theirs.active == true
508:         && theirs.myRole == 'playerTwo'
509:         && theirs.partnerAccountId == request.auth.uid
510:         && rivalry.objectType == 'rivalry'
511:         && rivalry.lifecycleState == 'live'
512:         && rivalry.data.connectionState == 'pending-pair'
513:         && rivalry.data.createdByAccountId == request.auth.uid
514:         && invite.objectType == 'invite'
515:         && invite.data.purpose == 'rivalry-pairing'
516:         && invite.data.slotId == 'playerTwo'
517:         && invite.data.state == 'open'
518:         && invite.data.createdByAccountId == request.auth.uid
519:         && invite.data.expiresAt == note.expiresAt
520:         && note.expiresAt > request.time
521:         && (
522:           resource == null
523:           || resource.data.rivalryId != note.rivalryId
524:           || request.time > resource.data.createdAt + duration.value(60, 's')
525:         );
526:     }
527:     // r86 reads at scale (Nik 2026-10-27): one create-only career summary per finished Showdown under the reading
528:     // account. Reads are owner-only exact gets (no lookup); the one create checks the closed root and, for a completed
529:     // Showdown, that the summary's totals, winner and length equal the Terminal Close witness. Never updated or deleted.
530:     function cmsCareerSummaryCreateValid(accountId, rivalryId) {
531:       let s = request.resource.data;
532:       let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data;
533:       return signedIn()
534:         && request.auth.uid == accountId
535:         && activeAccount(request.auth.uid)
536:         && rivalryId.matches('^pair_[0-9a-f]{64}$')
537:         && s.keys().hasOnly(['schemaVersion', 'objectType', 'rivalryId', 'status', 'totalSeasons', 'managerTotals', 'winner', 'payload', 'payloadHash'])
538:         && s.keys().hasAll(['schemaVersion', 'objectType', 'rivalryId', 'status', 'totalSeasons', 'managerTotals', 'winner', 'payload', 'payloadHash'])
539:         && s.schemaVersion == 1
540:         && s.objectType == 'careerSummary'
541:         && s.rivalryId == rivalryId
542:         && s.payload is string
543:         && s.payload.size() > 0
544:         && s.payload.size() <= 262144
545:         && s.payloadHash is string
546:         && s.payloadHash.matches('^sha256:[0-9a-f]{64}$')
547:         && root.connectionState == 'closed'
548:         && accountId in root.authorizedAccountIds
549:         && ((s.status == 'completed'
550:               && 'terminalClose' in root
551:               && root.terminalClose.rivalryId == rivalryId
552:               && s.totalSeasons == root.terminalClose.totalSeasons
553:               && s.managerTotals == root.terminalClose.managerTotals
554:               && s.winner == root.terminalClose.winner)
555:           || ((s.status == 'abandoned' || s.status == 'never-started')
556:               && !('terminalClose' in root)
557:               && s.totalSeasons == null
558:               && s.managerTotals == null
559:               && s.winner == null));
560:     }
561: 
562:     // CMS_COMPLETED_READ (D2, JOB-08): read-only grant for a Showdown closed by a verified
563:     // Terminal Close. Get only; no write, list or delete rule refers to these functions.
564:     function cmsCompletedShowdownReadable(rivalryId) {
565:       let root = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
566:       let data = root.data;
567:       let slots = data.managerSlots;
568:       let progress = data.terminalProgress;
569:       return signedIn()
570:         && rivalryId.matches('^pair_[0-9a-f]{64}$')
571:         && root.objectType == 'rivalry'
572:         && root.objectId == rivalryId
573:         && root.lifecycleState == 'live'
574:         && data.connectionState == 'closed'
575:         && data.authorizedAccountIds is list
576:         && data.authorizedAccountIds.size() == 2
577:         && data.authorizedAccountIds[0] != data.authorizedAccountIds[1]
578:         && request.auth.uid in data.authorizedAccountIds
579:         && slots is list
580:         && slots.size() == 2
581:         && slots[0].slotId == 'playerOne'
582:         && slots[1].slotId == 'playerTwo'
583:         && (slots[0].accountId == request.auth.uid || slots[1].accountId == request.auth.uid)
584:         && activeAccount(request.auth.uid)
585:         && 'terminalClose' in data
586:         && ssjrTerminalValidIntent(rivalryId, data.terminalClose)
587:         && ssjrTerminalProgressShape(progress, ['schemaVersion','runtimeRevision','totalSeasons','acceptedThroughSeason','managerTotals','closedSessionRevision','sacked'])
588:         && (progress.acceptedThroughSeason == progress.totalSeasons || 'sacked' in progress)
589:         && progress.closedSessionRevision is int
590:         && data.terminalClose.totalSeasons == progress.totalSeasons
591:         && data.terminalClose.managerTotals == progress.managerTotals;
592:     }
593: 
594:     function cmsCompletedSeasonReadable(rivalryId, seasonId) {
595:       // r89 Sacked: the seasons actually played (equal to totalSeasons for a full-length Showdown).
596:       let total = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data.data.terminalProgress.acceptedThroughSeason;
597:       return cmsCompletedShowdownReadable(rivalryId)
598:         && seasonId in ['season_1','season_2','season_3','season_4','season_5','season_6','season_7','season_8','season_9','season_10'][0:total];
599:     }
600: 
601:     // CMS_COMPLETED_TRANSFER_READ (JOB-10): a transfer role of a Terminal-Closed Showdown, for season_1..season_N,
602:     // only when that season's challenge is publicly COMPLETED (both guesses and both signings locked).
603:     // Keeps the existing role/phase condition of ssjrTransferPrivateReadable. Get only.
604:     function cmsCompletedTransferRoleReadable(rivalryId, transferId) {
605:       let challenge = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
606:       return cmsCompletedSeasonReadable(rivalryId, transferId)
607:         && challenge.schemaVersion == 1
608:         && challenge.objectType == 'sharedTransferChallenge'
609:         && challenge.rivalryId == rivalryId
610:         && ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)
611:         && challenge.phase == 'COMPLETED'
612:         && challenge.guessLockedRoles is list
613:         && challenge.guessLockedRoles.size() == 2
614:         && 'playerOne' in challenge.guessLockedRoles
615:         && 'playerTwo' in challenge.guessLockedRoles
616:         && challenge.signingLockedRoles is list
617:         && challenge.signingLockedRoles.size() == 2
618:         && 'playerOne' in challenge.signingLockedRoles
619:         && 'playerTwo' in challenge.signingLockedRoles;
620:     }
621: 
622: // CMS_PERSISTENT_PAIR_FUNCTIONS_END
623: 
624: // CMS_PERSISTENT_PAIR_MATCH_BEGIN
625:     match /accounts/{accountId}/pairLinks/{pairId} {
626:       allow get: if signedIn() && request.auth.uid == accountId && pairId == 'current';
627:       allow create: if cmsPersistentPairCreateValid(accountId, pairId);
628:       allow update: if cmsPersistentPairUpdateValid(accountId, pairId);
629:       allow list, delete: if false;
630:     }
631: 
632:     match /accounts/{accountId}/careerIndex/{indexId} {
633:       allow get: if signedIn()
634:         && request.auth.uid == accountId
635:         && (indexId == 'current' || indexId.matches('^page_[1-9][0-9]*$'));
636:       allow create: if (indexId == 'current' && cmsCareerIndexHeadCreateValid(accountId))
637:         || (indexId.matches('^page_[1-9][0-9]*$') && cmsCareerIndexPageCreateValid(accountId, indexId));
638:       allow update: if indexId == 'current' && cmsCareerIndexHeadUpdateValid(accountId);
639:       allow list, delete: if false;
640:     }
641: 
642:     match /accounts/{accountId}/careerStart/{startId} {
643:       allow get: if signedIn()
644:         && request.auth.uid == accountId
645:         && startId == 'current'
646:         && activeActor();
647:       allow create: if cmsCareerStartCreateValid(accountId, startId);
648:       allow update: if cmsCareerStartUpdateValid(accountId, startId);
649:       allow list, delete: if false;
650:     }
651:     match /accounts/{accountId}/partner/{partnerId} {
652:       allow get: if signedIn()
653:         && partnerId == 'current'
654:         && (request.auth.uid == accountId || resource.data.partnerAccountId == request.auth.uid);
655:       allow create: if cmsPartnerCreateValid(accountId, partnerId);
656:       allow update: if cmsPartnerUpdateValid(accountId, partnerId);
657:       allow list, delete: if false;
658:     }
659: 
660:     match /accounts/{accountId}/partnerInbox/{noteId} {
661:       allow get: if signedIn() && request.auth.uid == accountId && noteId == 'current';
662:       allow create, update: if cmsPartnerInboxWriteValid(accountId, noteId);
663:       allow list, delete: if false;
664:     }
665:     match /accounts/{accountId}/careerSummary/{rivalryId} {
666:       // A disabled or tombstoned account loses its summaries with the rest of the shared history (same boundary as
667:       // cmsCompletedShowdownReadable).
668:       allow get: if signedIn() && request.auth.uid == accountId && activeAccount(request.auth.uid);
669:       allow create: if cmsCareerSummaryCreateValid(accountId, rivalryId);
670:       allow update, list, delete: if false;
671:     }
672: // CMS_PERSISTENT_PAIR_MATCH_END
```

(End of packet FJ11. Answer with the report only.)
