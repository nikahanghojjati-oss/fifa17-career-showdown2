# Fable 5.2 red-team job FJ3: Transfer War: private ledgers and verdicts

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
Then one block per finding: ID (FJ3-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. Can one manager's private signings or guesses be read or shown to the other before the reveal, in normal play?
2. Can a verdict be lost, written twice, or counted twice? Cover both managers finishing at the same instant and a retry after an error.
3. Can a shot (guessed) player from this season's Roulette be signed in the Transfer War? Can the Special Player come from the manager's own club?
4. Do transactions and Rules agree: is any normal write refused, or any wrong write accepted?
5. Any normal path that costs many extra Firestore reads (give the count)?

## Known (do not report)
None.

## Files

## FILE: js/sparkSharedTransferChallenge.js (302 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeSparkSharedTransferChallenge=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const protocol=typeof require==="function"?require("./sharedTransferChallenge.js"):root.CareerModeSharedTransferChallenge;
9:   const ROLES=Object.freeze(["playerOne","playerTwo"]);
10:   const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
11:   const HASH=/^sha256:[0-9a-f]{64}$/;
12:   const PUBLIC_KEYS=Object.freeze([
13:     "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision",
14:     "startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles",
15:     "operationIds","operationTypes","operationHashes","baseRevisions","actorRoles",
16:     "activeSessionId","updatedAt","updatedByDeviceId"
17:   ]);
18:   const PRIVATE_KEYS=Object.freeze([
19:     "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings",
20:     "guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"
21:   ]);
22:   // JOB-1051: a role document written by r66 has exactly PRIVATE_KEYS (no salts); a new one has PRIVATE_KEYS plus both salt keys.
23:   const SALT_KEYS=Object.freeze(["guessSalt","signingSalt"]);
24:   const SALT=/^[0-9a-f]{64}$/;
25:   // r87 (Nik 2026-10-31, red team RT5-FLOW-02): the shared window waits until both managers have spun this season's Russian
26:   // Roster Roulette. Before the window opens, the season's public document may exist as a small pre-window mark document:
27:   // each manager adds his own role to spins (one merge write, no read) when he confirms his release. START needs both;
28:   // starting the window replaces the document with the normal ledger (exactly PUBLIC_KEYS, so no other reader changes).
29:   const SPIN_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","phase","spins","updatedAt"]);
30:   // F2-02 (Fable job 2): a mark records that season's outcome for its manager (js/rosterRoulette.js outcome): fired, hitName,
31:   // hitNumber, hitSlot (0-14), hitSignedSeason (1-10, or null for a club player) and the engine and data version. A mark from a
32:   // phone that ran no roulette (switched off, no confirm time) is plain true. Each manager writes his own entry once (the Rules refuse a second write).
33:   const OUTCOME_KEYS=Object.freeze(["fired","hitName","hitNumber","hitSlot","hitSignedSeason","version"]);
34:   const OUTCOME_VERSION=/^rr[0-9]{1,3}\.[0-9]{1,4}\.[0-9a-f]{8}$/;
35:   // The durable copy START makes of both marks (the mark document itself is replaced by the ledger), so later seasons replay the
36:   // saved shots: rivalries/{rid}/transferChallenges/season_N/roulette/spins, written once, never changed.
37:   const RECORD_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","spins"]);
38:   const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
39:   const CANONICAL_LEAGUE_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES:[]).map(item=>item&&item.id).filter(Boolean));
40:   const CANONICAL_NATIONALITY_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES:[]).map(item=>item&&item.id).filter(Boolean));
41: 
42:   function stspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
43:   function stspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"TRANSFER_PROVIDER_FAILED"});}
44:   function stspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
45:   function stspPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
46:   function stspExact(value,keys,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!stspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stspFail(code);return value;}
47:   function stspClone(value){return JSON.parse(JSON.stringify(value));}
48:   function stspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stspFreeze);Object.freeze(value);}return value;}
49:   function stspCanonical(value){if(Array.isArray(value))return `[${value.map(stspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
50:   async function stspHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stspCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
51:   // JOB-1051: 32 random bytes, hex. Stored only in the actor's own private role document (unreadable by the rival until COMPLETED).
52:   function stspNewSalt(cryptoImpl){if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");return Array.from(cryptoImpl.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,"0")).join("");}
53:   function stspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_RIVALRY_INVALID");return id;}
54:   function stspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_SESSION_INVALID");return id;}
55:   function stspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))stspFail("TRANSFER_DEVICE_INACTIVE");return id;}
56:   function stspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))stspFail("TRANSFER_COMMAND_INVALID");return id;}
57:   function stspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)stspFail("TRANSFER_AUTH_REQUIRED");return id;}
58:   function stspSeason(value,totalSeasons){const season=Number(value);if(!Number.isInteger(season)||season<1||season>totalSeasons)stspFail("TRANSFER_SEASON_INVALID");return season;}
59:   function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
60:   // RT5-FLOW-02 eligibility, shared by this provider and the Transfer Challenge UI: the roulette runs for every Showdown
61:   // whose Setup confirm time is readable.
62:   function stspRouletteEligible(confirmedAtMs){return Number.isFinite(confirmedAtMs);}
63:   function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
64:   function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
65:   function stspServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
66:   function stspValidateSdk(options){if(!options.firestore)stspFail("TRANSFER_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}if(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}
67:   function stspRoleList(value,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stspFail(code);return value;}
68:   function stspCatalog(){
69:     if(CANONICAL_LEAGUE_IDS.length!==36||CANONICAL_NATIONALITY_IDS.length!==166)stspFail("TRANSFER_CATALOG_UNAVAILABLE");
70:     return Object.freeze({leagueIds:new Set(CANONICAL_LEAGUE_IDS),nationalityIds:new Set(CANONICAL_NATIONALITY_IDS)});
71:   }
72:   function stspNormalizeGuesses(value,catalog){
73:     if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_GUESSES_INVALID");const slots=new Set();
74:     return value.map(item=>{stspExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_GUESSES_INVALID");slots.add(item.slot);if(item.type!=="league"&&item.type!=="nationality")stspFail("TRANSFER_GUESSES_INVALID");const allowed=item.type==="league"?catalog.leagueIds:catalog.nationalityIds;if(!allowed.has(item.valueId))stspFail("TRANSFER_GUESSES_INVALID");return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
75:   }
76:   function stspNormalizeSignings(value,catalog){
77:     if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_SIGNINGS_INVALID");const slots=new Set();
78:     return value.map(item=>{const hasOverall=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall")),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position")),hasPlayerId=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"playerId"));/* r87: optional FIFA 17 overall (30-99) and position; r91: optional SoFIFA playerId (1..999999) */stspExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[]),...(hasPlayerId?["playerId"]:[])],"TRANSFER_SIGNINGS_INVALID");if(hasPlayerId&&!(Number.isInteger(item.playerId)&&item.playerId>=1&&item.playerId<=999999))stspFail("TRANSFER_SIGNINGS_INVALID");if(hasPosition&&!["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"].includes(item.position))stspFail("TRANSFER_SIGNINGS_INVALID");if(hasOverall&&!(Number.isInteger(item.overall)&&item.overall>=30&&item.overall<=99))stspFail("TRANSFER_SIGNINGS_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_SIGNINGS_INVALID");slots.add(item.slot);if(typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))stspFail("TRANSFER_SIGNINGS_INVALID");const row={slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;if(hasPlayerId)row.playerId=item.playerId;return row;}).sort((a,b)=>a.slot-b.slot);
79:   }
80:   function stspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")stspFail("TRANSFER_MANAGER_INACTIVE");}
81:   function stspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")stspFail("TRANSFER_DEVICE_INACTIVE");}
82:   function stspAssertRivalry(value,rivalryId,uid){
83:     if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")stspFail("TRANSFER_RIVALRY_INACTIVE");
84:     const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
85:     if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)stspFail("TRANSFER_TWO_MANAGERS_REQUIRED");
86:     const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
87:     if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))stspFail("TRANSFER_BINDING_INVALID");
88:     const actor=ordered.find(item=>item.accountId===uid);if(!actor)stspFail("TRANSFER_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
89:   }
90:   function stspAssertSession(value,rivalryId,sessionId,authorized,now){
91:     if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)stspFail("TRANSFER_SESSION_INVALID");
92:     const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=stspTimestampMillis(value.data.expiresAt);
93:     if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))stspFail("TRANSFER_ACTIVE_SESSION_REQUIRED");
94:   }
95:   function stspAssertSetup(value,rivalryId){
96:     if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");
97:     if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");return value;
98:   }
99:   function stspAssertCareer(value,rivalryId,setup){
100:     if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")stspFail("TRANSFER_CAREER_START_NOT_READY");
101:     if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stspFail("TRANSFER_CAREER_START_NOT_READY");return value;
102:   }
103:   // The pre-window mark document: null when it is absent or the ledger has started, else the roles that have spun (in role order).
104:   function stspIsPreWindow(value){return stspPlain(value)&&value.phase==="NOT_STARTED";}
105:   // A valid outcome (frozen copy), or null.
106:   function stspOutcome(value){
107:     if(!stspPlain(value)||Object.keys(value).length!==OUTCOME_KEYS.length||OUTCOME_KEYS.some(key=>!Object.hasOwn(value,key)))return null;
108:     if(typeof value.fired!=="boolean"||typeof value.version!=="string"||!OUTCOME_VERSION.test(value.version))return null;
109:     if(value.fired){
110:       if(typeof value.hitName!=="string"||!value.hitName||value.hitName!==value.hitName.trim()||value.hitName.length>80||!Number.isInteger(value.hitSlot)||value.hitSlot<0||value.hitSlot>14||!(value.hitNumber===null||(Number.isInteger(value.hitNumber)&&value.hitNumber>=0&&value.hitNumber<=99))||!(value.hitSignedSeason===null||(Number.isInteger(value.hitSignedSeason)&&value.hitSignedSeason>=1&&value.hitSignedSeason<=10)))return null;
111:     }else if(value.hitName!==null||value.hitNumber!==null||value.hitSlot!==null||value.hitSignedSeason!==null)return null;
112:     return Object.freeze({fired:value.fired,hitName:value.hitName,hitNumber:value.hitNumber,hitSlot:value.hitSlot,hitSignedSeason:value.hitSignedSeason,version:value.version});
113:   }
114:   // {playerOne, playerTwo}: each manager's stored entry (true, or his outcome), or null when he has none.
115:   function stspSpinEntries(spins){
116:     if(!stspPlain(spins)||Object.keys(spins).some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
117:     const entries={};
118:     for(const role of ROLES){
119:       if(!Object.hasOwn(spins,role)){entries[role]=null;continue;}
120:       const entry=spins[role]===true?true:stspOutcome(spins[role]);
121:       if(!entry)stspFail("TRANSFER_PROVIDER_STATE_INVALID");entries[role]=entry;
122:     }
123:     return Object.freeze(entries);
124:   }
125:   function stspSpinMarks(value,rivalryId,seasonNumber){
126:     if(!stspIsPreWindow(value))return null;stspExact(value,SPIN_KEYS);
127:     if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
128:     return stspSpinEntries(value.spins);
129:   }
130:   function stspPublicState(value,rivalryId,seasonNumber,setup){
131:     if(!value||stspIsPreWindow(value))return null;stspExact(value,PUBLIC_KEYS);
132:     if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==protocol.runtimeRevision||value.coordinatorRole!==setup.coordinatorRole||!protocol.phases.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>7)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
133:     const startedAtEpochMs=stspTimestampMillis(value.startedAt),endedAtEpochMs=value.endedAt===null?null:stspTimestampMillis(value.endedAt);if(!Number.isFinite(startedAtEpochMs)||(value.endedAt!==null&&!Number.isFinite(endedAtEpochMs)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
134:     stspRoleList(value.endRequestedRoles);stspRoleList(value.guessLockedRoles);stspRoleList(value.signingLockedRoles);
135:     for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)stspFail("TRANSFER_PROVIDER_STATE_INVALID");}
136:     if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
137:     if(value.phase==="WINDOW_OPEN"&&(value.endedAt!==null||value.guessLockedRoles.length||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
138:     if(value.phase==="GUESS_ENTRY"&&(value.endedAt===null||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
139:     if(value.phase==="SIGNING_ENTRY"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
140:     if(value.phase==="COMPLETED"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
141:     if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
142:     return stspFreeze({seasonNumber,coordinatorRole:value.coordinatorRole,phase:value.phase,revision:value.revision,startedAtEpochMs,endedAtEpochMs,endRequestedRoles:[...value.endRequestedRoles],guessLockedRoles:[...value.guessLockedRoles],signingLockedRoles:[...value.signingLockedRoles],operationIds:[...value.operationIds],operationTypes:[...value.operationTypes],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
143:   }
144:   function stspPrivateState(value,rivalryId,seasonNumber,role,catalog){
145:     if(!value)return null;
146:     const salted=stspPlain(value)&&Object.hasOwn(value,SALT_KEYS[0]);stspExact(value,salted?[...PRIVATE_KEYS,...SALT_KEYS]:PRIVATE_KEYS);
147:     if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
148:     const guesses=value.guesses===null?null:stspNormalizeGuesses(value.guesses,catalog),signings=value.signings===null?null:stspNormalizeSignings(value.signings,catalog),guessLockedAtEpochMs=value.guessLockedAt===null?null:stspTimestampMillis(value.guessLockedAt),signingLockedAtEpochMs=value.signingLockedAt===null?null:stspTimestampMillis(value.signingLockedAt);
149:     if((guesses===null)!==(guessLockedAtEpochMs===null)||(signings===null)!==(signingLockedAtEpochMs===null)||(guessLockedAtEpochMs!==null&&!Number.isFinite(guessLockedAtEpochMs))||(signingLockedAtEpochMs!==null&&!Number.isFinite(signingLockedAtEpochMs))||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
150:     const guessSalt=salted?value.guessSalt:null,signingSalt=salted?value.signingSalt:null;
151:     // A salt exists only together with the lock it belongs to, and is exactly 64 lowercase hex characters.
152:     for(const [salt,locked] of [[guessSalt,guesses],[signingSalt,signings]])if(salt!==null&&(typeof salt!=="string"||!SALT.test(salt)||locked===null))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
153:     return stspFreeze({guesses,signings,guessLockedAtEpochMs,signingLockedAtEpochMs,guessSalt,signingSalt});
154:   }
155:   function stspPublicLedger(state,ctx,serverNow,type){
156:     const prior=ctx.publicValue||null,startedAt=type==="start-window"?serverNow:(prior?.startedAt||stspTimestamp(ctx.sdk,state.startedAtEpochMs));let endedAt=null;
157:     if(state.endedAtEpochMs!==null){
158:       const earlyEnd=type==="request-end-window"&&state.phase==="GUESS_ENTRY"&&state.endRequestedRoles.length===2;
159:       if(earlyEnd||type==="advance-expired-window")endedAt=serverNow;
160:       else endedAt=prior?.endedAt||stspTimestamp(ctx.sdk,state.endedAtEpochMs);
161:     }
162:     return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:protocol.runtimeRevision,coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt,endedAt,endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:[...state.operationIds],operationTypes:[...state.operationTypes],operationHashes:[...state.operationHashes],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};
163:   }
164:   function stspPrivateLedger(privateState,ctx,role,serverNow,type){
165:     const prior=ctx.ownValue||null;
166:     const guessLockedAt=type==="lock-guesses"?serverNow:(prior?.guessLockedAt||(privateState.guessLockedAtEpochMs===null||privateState.guessLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.guessLockedAtEpochMs)));
167:     const signingLockedAt=type==="lock-signings"?serverNow:(prior?.signingLockedAt||(privateState.signingLockedAtEpochMs===null||privateState.signingLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.signingLockedAtEpochMs)));
168:     return {schemaVersion:1,objectType:"sharedTransferChallengeRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:role,guesses:privateState.guesses?stspClone(privateState.guesses):null,signings:privateState.signings?stspClone(privateState.signings):null,guessLockedAt,signingLockedAt,activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId,guessSalt:privateState.guessSalt||null,signingSalt:privateState.signingSalt||null};
169:   }
170:   async function stspContext(options,transaction,{readOpponent=false}={}){
171:     stspValidateSdk(options);const catalog=stspCatalog(),uid=stspAccountId(options.user),rivalryId=stspNormalizeRivalryId(options.rivalryId),sessionId=stspNormalizeSessionId(options.sessionId),deviceId=stspNormalizeDeviceId(options.deviceId),now=stspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
172:     const baseRefs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
173:     stspAssertAccount(stspSnapshot(await transaction.get(baseRefs.account)),uid);stspAssertDevice(stspSnapshot(await transaction.get(baseRefs.device)),deviceId);const rivalry=stspAssertRivalry(stspSnapshot(await transaction.get(baseRefs.rivalry)),rivalryId,uid);stspAssertSession(stspSnapshot(await transaction.get(baseRefs.session)),rivalryId,sessionId,rivalry.authorized,now);const setup=stspAssertSetup(stspSnapshot(await transaction.get(baseRefs.setup)),rivalryId);stspAssertCareer(stspSnapshot(await transaction.get(baseRefs.career)),rivalryId,setup);const seasonNumber=stspSeason(options.seasonNumber,setup.totalSeasons),role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${seasonNumber}`;
174:     const refs={...baseRefs,public:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId),own:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",role),opponent:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",opponentRole)};
175:     const publicValue=stspSnapshot(await transaction.get(refs.public)),state=stspPublicState(publicValue,rivalryId,seasonNumber,setup),spinMarks=state?null:(stspSpinMarks(publicValue,rivalryId,seasonNumber)||Object.freeze({playerOne:null,playerTwo:null})),spunRoles=spinMarks?ROLES.filter(item=>spinMarks[item]!==null):null,ownValue=stspSnapshot(await transaction.get(refs.own)),own=stspPrivateState(ownValue,rivalryId,seasonNumber,role,catalog);let opponent=null;
176:     if(readOpponent==="ifCompleted"&&!(state&&state.phase==="COMPLETED"))readOpponent=false;if(readOpponent){if(!state||state.phase!=="COMPLETED")stspFail("TRANSFER_PRIVATE_READ_BLOCKED");opponent=stspPrivateState(stspSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,catalog);if(!opponent)stspFail("TRANSFER_PRIVATE_STATE_INVALID");}
177:     refs.roulette=sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roulette","spins");
178:     return Object.freeze({catalog,uid,rivalryId,sessionId,deviceId,now,sdk,db,rivalry,setup,seasonNumber,role,opponentRole,state,spunRoles,spinMarks,own,publicValue,ownValue,opponent,refs});
179:   }
180:   function stspProjection(ctx){
181:     const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:Object.freeze([...(ctx.spunRoles||[])]),spinMarks:ctx.spinMarks||Object.freeze({playerOne:null,playerTwo:null}),ownInputs:null,opponentInputs:null,verdicts:null});
182:     const ownInputs=ctx.own?{guesses:stspClone(ctx.own.guesses),signings:stspClone(ctx.own.signings)}:{guesses:null,signings:null};
183:     const opponentInputs=state.phase==="COMPLETED"&&ctx.opponent?{guesses:stspClone(ctx.opponent.guesses),signings:stspClone(ctx.opponent.signings)}:null;let verdicts=null;
184:     if(state.phase==="COMPLETED"){
185:       if(!ctx.own||!ctx.opponent||!ctx.own.guesses||!ctx.own.signings||!ctx.opponent.guesses||!ctx.opponent.signings)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
186:       const inputs={};inputs[ctx.role]=ctx.own;inputs[ctx.opponentRole]=ctx.opponent;const evalState={phase:"COMPLETED",inputs};
187:       verdicts={playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)};
188:     }
189:     return stspFreeze({ok:true,revision:state.revision,state:stspClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,spunRoles:null,spinMarks:null,ownInputs,opponentInputs,verdicts});
190:   }
191:   function stspProtocolVerdict(role,state){
192:     const opponent=role==="playerOne"?"playerTwo":"playerOne",guesses=state.inputs[opponent].guesses||[];
193:     return (state.inputs[role].signings||[]).map(signing=>{const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
194:   }
195:   // RS-02 (r87): one pass. The opponent's private document is read only after this same pass has seen the public document
196:   // COMPLETED (the Rules allow it only then); before, a COMPLETED season read the whole context twice (17 gets in one transaction).
197:   async function stspRead(options={}){try{return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{return stspProjection(await stspContext(options,transaction,{readOpponent:"ifCompleted"}));});}catch(error){return stspResultError(error);}}
198:   async function stspMutate(options,type,payload){
199:     try{
200:       stspValidateSdk(options);const operationId=stspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>7)stspFail("TRANSFER_COMMAND_INVALID");const cryptoImpl=options.cryptoImpl||root.crypto;
201:       return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
202:         const ctx=await stspContext(options,transaction),current=ctx.state,revision=current?current.revision:0;let normalizedPayload={};
203:         if(type==="lock-guesses")normalizedPayload={guesses:stspNormalizeGuesses(payload.guesses,ctx.catalog)};else if(type==="lock-signings")normalizedPayload={signings:stspNormalizeSignings(payload.signings,ctx.catalog)};
204:         // JOB-1051: a lock's hash commits to the private payload AND a fresh random salt that only the actor's own private role document holds.
205:         // The rival can read the public ledger but not the role document before COMPLETED, so it cannot brute-force the small guess space.
206:         const privateType=type==="lock-guesses"||type==="lock-signings",saltKey=type==="lock-guesses"?"guessSalt":"signingSalt";
207:         const commit=salt=>stspHash({actorRole:ctx.role,type,operationId,baseRevision,...normalizedPayload,...(salt?{salt}:{})},cryptoImpl);
208:         if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){
209:           // Replays recompute with the salt already stored in the actor's own document; a role document without a salt (written by r66) uses the old unsalted payload hash.
210:           const storedSalt=privateType&&ctx.own?ctx.own[saltKey]:null;
211:           if(current.operationTypes[index]!==type||current.operationHashes[index]!==await commit(storedSalt)||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role)stspFail("TRANSFER_IDEMPOTENCY_CONFLICT");return stspFreeze({ok:true,status:"accepted",replayed:true,revision:current.revision,state:stspClone(current),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:current.phase==="COMPLETED"});}}
212:         const salt=privateType?stspNewSalt(cryptoImpl):null,operationHash=await commit(salt);
213:         if(baseRevision!==revision)stspFail("TRANSFER_STALE_BASE_REVISION");if(!current&&type!=="start-window")stspFail("TRANSFER_NOT_STARTED");if(current&&type==="start-window")stspFail("TRANSFER_ALREADY_STARTED");if(current&&current.phase==="COMPLETED")stspFail("TRANSFER_ALREADY_COMPLETED");
214:         let next=current?stspClone(current):{seasonNumber:ctx.seasonNumber,coordinatorRole:ctx.setup.coordinatorRole,phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:ctx.now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[],operationTypes:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
215:         let own=ctx.own?stspClone(ctx.own):{guesses:null,signings:null,guessLockedAtEpochMs:null,signingLockedAtEpochMs:null,guessSalt:null,signingSalt:null};let writePrivate=false;
216:         if(type==="start-window"){if(ctx.role!==ctx.setup.coordinatorRole)stspFail("TRANSFER_COORDINATOR_REQUIRED");
217:           // RT5-FLOW-02: START needs both marks whenever this Showdown is roulette-eligible (decided here from the Setup ledger
218:           // this transaction already read, the same rule as the UI and the roulette step: no caller opt-in), and whenever any
219:           // mark exists. A Setup with no readable confirm time has no marks and passes.
220:           const spun=ctx.spunRoles||[];if((spun.length||stspRouletteEligible(stspTimestampMillis(ctx.setup.updatedAt)))&&!ROLES.every(role=>spun.includes(role)))stspFail("TRANSFER_ROULETTE_PENDING");
221:           next.startedAtEpochMs=ctx.now;}
222:         else if(type==="request-end-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(next.endRequestedRoles.includes(ctx.role))stspFail("TRANSFER_END_ALREADY_REQUESTED");next.endRequestedRoles.push(ctx.role);if(next.endRequestedRoles.length===2){next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}}
223:         else if(type==="advance-expired-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(ctx.now<next.startedAtEpochMs+protocol.windowMs)stspFail("TRANSFER_WINDOW_STILL_OPEN");next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}
224:         else if(type==="lock-guesses"){if(next.phase!=="GUESS_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(next.guessLockedRoles.includes(ctx.role)||own.guesses!==null)stspFail("TRANSFER_GUESSES_ALREADY_LOCKED");own.guesses=normalizedPayload.guesses;own.guessSalt=salt;next.guessLockedRoles.push(ctx.role);if(next.guessLockedRoles.length===2)next.phase="SIGNING_ENTRY";writePrivate=true;}
225:         else if(type==="lock-signings"){if(next.phase!=="SIGNING_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(!next.guessLockedRoles.includes(ctx.role)||!own.guesses)stspFail("TRANSFER_GUESSES_REQUIRED");if(next.signingLockedRoles.includes(ctx.role)||own.signings!==null)stspFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");own.signings=normalizedPayload.signings;own.signingSalt=salt;next.signingLockedRoles.push(ctx.role);if(next.signingLockedRoles.length===2)next.phase="COMPLETED";writePrivate=true;}
226:         else stspFail("TRANSFER_COMMAND_INVALID");
227:         next.operationIds.push(operationId);next.operationTypes.push(type);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;
228:         const serverNow=stspServerTimestamp(ctx.sdk);transaction.set(ctx.refs.public,stspPublicLedger(next,ctx,serverNow,type));if(writePrivate)transaction.set(ctx.refs.own,stspPrivateLedger(own,ctx,ctx.role,serverNow,type));
229:         // F2-02: START from a document holding both marks keeps them: one durable record, an exact copy (the Rules compare it with
230:         // the marks being replaced), so later seasons replay each saved shot instead of recomputing it.
231:         if(type==="start-window"&&ctx.spinMarks&&ROLES.every(role=>ctx.spinMarks[role]!==null))transaction.set(ctx.refs.roulette,{schemaVersion:1,objectType:"sharedTransferRouletteSpins",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,spins:stspClone(ctx.publicValue.spins)});
232:         return stspFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:stspClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:type==="start-window"||next.phase==="COMPLETED"});
233:       });
234:     }catch(error){return stspResultError(error);}
235:   }
236:   // RT5-FLOW-02: this manager's own "spun" mark for this season, one merge write and no read (the Rules check that the signed-in
237:   // member writes only his own role, never removes a mark, and only before the window opens). Writing it again changes nothing
238:   // but updatedAt, so a retry after a lost answer or a reload is safe. A window that already opened refuses it
239:   // (permission-denied): the mark is not needed any more, so the caller treats that as done.
240:   async function stspMarkSpun(options={}){
241:     try{
242:       if(!options.firestore||!options.firebaseSdk||typeof options.firebaseSdk.doc!=="function"||typeof options.firebaseSdk.runTransaction!=="function"||typeof options.firebaseSdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
243:       stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
244:       // F2-02: with options.outcome (this manager's own turn, js/rosterRoulette.js outcome) the entry records it; without one
245:       // (no roulette ran on this phone) it is true. A malformed outcome is refused here, before any write.
246:       let entry=true;if(options.outcome!==undefined&&options.outcome!==null){entry=stspOutcome(options.outcome);if(!entry)stspFail("TRANSFER_SPIN_OUTCOME_INVALID");entry={...entry};}
247:       const sdk=options.firebaseSdk,ref=sdk.doc(options.firestore,"rivalries",rivalryId,"transferChallenges",`season_${season}`);
248:       try{
249:         await sdk.runTransaction(options.firestore,async transaction=>{transaction.set(ref,{schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId,seasonNumber:season,phase:"NOT_STARTED",spins:{[role]:entry},updatedAt:stspServerTimestamp(sdk)},{merge:true});});
250:       }catch(error){
251:         // The Rules accept one mark per manager and season (F2-02), so marking again (a retry after a lost ack, a reload, a
252:         // second tab, or a caller that marked before an earlier START was refused) is denied. Only then, one read: if this
253:         // manager's mark is already on the document, or the window already opened from both marks, he has spun. The stored
254:         // mark stands (the first outcome is the season's outcome); nothing is written.
255:         if(String(error&&error.code||"").replace(/^firestore\//,"")!=="permission-denied")throw error;
256:         const stored=await sdk.runTransaction(options.firestore,async transaction=>stspSnapshot(await transaction.get(ref)));
257:         const marked=stored&&(stored.phase!=="NOT_STARTED"||(stspPlain(stored.spins)&&Object.hasOwn(stored.spins,role)&&stored.spins[role]!==false));
258:         if(!marked)throw error;
259:         return Object.freeze({ok:true,managerRole:role,seasonNumber:season,alreadyMarked:true});
260:       }
261:       return Object.freeze({ok:true,managerRole:role,seasonNumber:season});
262:     }catch(error){return stspResultError(error);}
263:   }
264:   // F2-12 (Fable job 2): an earlier season for the roulette boards, with plain document gets and no prerequisite transaction:
265:   // this manager's own role document, the partner's (the Rules allow it only once the season's window is COMPLETED) and the
266:   // durable spin record. Verdicts are computed as stspProtocolVerdict does. options.verdicts false reads the record only (the
267:   // verdicts are already kept on this phone). hits is {playerOne, playerTwo} (an outcome or null), or null without a record.
268:   async function stspReadRouletteSeason(options={}){
269:     try{
270:       const sdk=options.firebaseSdk,db=options.firestore;
271:       if(!db||!sdk||typeof sdk.doc!=="function"||typeof sdk.getDoc!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");
272:       stspAccountId(options.user);const rivalryId=stspNormalizeRivalryId(options.rivalryId),season=stspSeason(options.seasonNumber,10),role=options.managerRole;if(!ROLES.includes(role))stspFail("TRANSFER_ROLE_INVALID");
273:       const opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${season}`,wantVerdicts=options.verdicts!==false;
274:       const get=parts=>sdk.getDoc(sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,...parts)).then(stspSnapshot);
275:       const settled=await Promise.allSettled([get(["roulette","spins"]),...(wantVerdicts?[get(["roles",role]),get(["roles",opponentRole])]:[])]);
276:       if(settled[0].status==="rejected")throw settled[0].reason;
277:       let hits=null;const record=settled[0].value;
278:       if(record){
279:         stspExact(record,RECORD_KEYS);
280:         if(record.schemaVersion!==1||record.objectType!=="sharedTransferRouletteSpins"||record.rivalryId!==rivalryId||record.seasonNumber!==season)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
281:         const entries=stspSpinEntries(record.spins);hits=Object.freeze(Object.fromEntries(ROLES.map(item=>[item,entries[item]&&entries[item]!==true?entries[item]:null])));
282:       }
283:       if(!wantVerdicts)return Object.freeze({ok:true,seasonNumber:season,verdicts:null,hits});
284:       const catalog=stspCatalog();
285:       if(settled[1].status==="rejected")throw settled[1].reason;
286:       const own=stspPrivateState(settled[1].value,rivalryId,season,role,catalog);
287:       if(!own||!own.guesses||!own.signings)stspFail("TRANSFER_NOT_COMPLETED");
288:       if(settled[2].status==="rejected")throw settled[2].reason;
289:       const opponent=stspPrivateState(settled[2].value,rivalryId,season,opponentRole,catalog);
290:       if(!opponent||!opponent.guesses||!opponent.signings)stspFail("TRANSFER_NOT_COMPLETED");
291:       const inputs={[role]:own,[opponentRole]:opponent},evalState={phase:"COMPLETED",inputs};
292:       return stspFreeze({ok:true,seasonNumber:season,verdicts:{playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)},hits});
293:     }catch(error){return stspResultError(error);}
294:   }
295:   const stspStartWindow=options=>stspMutate(options,"start-window",{});
296:   const stspRequestEndWindow=options=>stspMutate(options,"request-end-window",{});
297:   const stspAdvanceExpiredWindow=options=>stspMutate(options,"advance-expired-window",{});
298:   const stspLockGuesses=options=>stspMutate(options,"lock-guesses",{guesses:options.guesses});
299:   const stspLockSignings=options=>stspMutate(options,"lock-signings",{signings:options.signings});
300: 
301:   return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-transfer-challenge",runtimeRevision:protocol.runtimeRevision,read:stspRead,markSpun:stspMarkSpun,readRouletteSeason:stspReadRouletteSeason,outcomeValid:value=>Boolean(stspOutcome(value)),rouletteEligible:stspRouletteEligible,startWindow:stspStartWindow,requestEndWindow:stspRequestEndWindow,advanceExpiredWindow:stspAdvanceExpiredWindow,lockGuesses:stspLockGuesses,lockSignings:stspLockSignings,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,privateInputsSplit:true,serverClockAuthoritative:true,repositoryCatalogSnapshot:true,callerCatalogOverride:false});
302: });
```

## FILE: js/sharedTransferChallenge.js (229 lines)
```javascript
1: (function(root,factory){
2:   const api=factory(root);
3:   if(typeof module!=="undefined"&&module.exports)module.exports=api;
4:   else root.CareerModeSharedTransferChallenge=api;
5: })(typeof globalThis!=="undefined"?globalThis:this,function(root){
6:   "use strict";
7: 
8:   const RUNTIME_REVISION="1.9.1-r8";
9:   const WINDOW_MS=15*60*1000;
10:   const ROLES=Object.freeze(["playerOne","playerTwo"]);
11:   const PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
12:   const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
13:   const HASH=/^sha256:[0-9a-f]{64}$/;
14:   const STATE_KEYS=Object.freeze([
15:     "schemaVersion","runtimeRevision","seasonNumber","coordinatorRole","phase","revision",
16:     "startedAtEpochMs","endedAtEpochMs","endRequestedRoles","guessLockedRoles","signingLockedRoles",
17:     "inputs","receipts","contentHash"
18:   ]);
19: 
20:   function stcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
21:   function stcPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
22:   function stcExact(value,keys,code="TRANSFER_VALUE_INVALID"){
23:     if(!stcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stcFail(code);
24:   }
25:   function stcClone(value){return JSON.parse(JSON.stringify(value));}
26:   function stcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stcFreeze);Object.freeze(value);}return value;}
27:   function stcCanonical(value){
28:     if(Array.isArray(value))return `[${value.map(stcCanonical).join(",")}]`;
29:     if(stcPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stcCanonical(value[key])}`).join(",")}}`;
30:     return JSON.stringify(value);
31:   }
32:   async function stcHash(value,cryptoImpl){
33:     if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stcFail("TRANSFER_CRYPTO_UNAVAILABLE");
34:     const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stcCanonical(value)));
35:     return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
36:   }
37:   function stcRole(value){if(!ROLES.includes(value))stcFail("TRANSFER_ROLE_INVALID");return value;}
38:   function stcEpoch(value){if(!Number.isSafeInteger(value)||value<0)stcFail("TRANSFER_CLOCK_INVALID");return value;}
39:   function stcRoleList(value,code){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stcFail(code);return value;}
40:   function stcCatalogIds(values,code){
41:     if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length||values.some(value=>typeof value!=="string"||!value||value!==value.trim()))stcFail(code);
42:     return new Set(values);
43:   }
44:   function stcConfirmedSetup(value){
45:     if(!stcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6)stcFail("TRANSFER_SETUP_NOT_CONFIRMED");
46:     if(!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stcFail("TRANSFER_SETUP_INVALID");
47:     if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stcFail("TRANSFER_SETUP_INVALID");
48:     if(!value.clubs||typeof value.clubs.playerOne!=="string"||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerOne||!value.clubs.playerTwo||value.clubs.playerOne===value.clubs.playerTwo)stcFail("TRANSFER_SETUP_INVALID");
49:     return value;
50:   }
51:   function stcCareerReady(value){
52:     if(!stcPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2)stcFail("TRANSFER_CAREER_START_NOT_READY");
53:     if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stcFail("TRANSFER_CAREER_START_NOT_READY");
54:     return value;
55:   }
56:   function stcNormalizeGuesses(value,leagueIds,nationalityIds){
57:     if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_GUESSES_INVALID");
58:     const seen=new Set();
59:     return value.map(item=>{
60:       stcExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");
61:       if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_GUESSES_INVALID");
62:       seen.add(item.slot);
63:       if(item.type!=="league"&&item.type!=="nationality")stcFail("TRANSFER_GUESSES_INVALID");
64:       const catalog=item.type==="league"?leagueIds:nationalityIds;
65:       if(!catalog.has(item.valueId))stcFail("TRANSFER_GUESSES_INVALID");
66:       return {slot:item.slot,type:item.type,valueId:item.valueId};
67:     }).sort((a,b)=>a.slot-b.slot);
68:   }
69:   const OVERALL_MIN=30,OVERALL_MAX=99;
70:   function stcPlainHasOverall(item){return Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall"));}
71:   function stcOverallValid(value){return Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;}
72:   const POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
73:   function stcNormalizeSignings(value,leagueIds,nationalityIds){
74:     if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_SIGNINGS_INVALID");
75:     const seen=new Set();
76:     return value.map(item=>{
77:       // r87 (Nik 2026-10-30): a signing also carries the player's FIFA 17 overall (30-99), entered by his own manager and never
78:       // guessed; Russian Roster Roulette uses it for the board from season 2. Rows locked before r87 have none.
79:       // r87 (Nik 2026-10-30 16:53 UTC): and his FIFA 17 position (own only, never guessed), so the board can place him.
80:       // r91 (2.4.0): and the SoFIFA id of a player picked from the autocomplete (optional, 1..999999).
81:       const hasOverall=stcPlainHasOverall(item),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position")),hasPlayerId=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"playerId"));
82:       stcExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[]),...(hasPlayerId?["playerId"]:[])],"TRANSFER_SIGNINGS_INVALID");
83:       if(hasOverall&&!stcOverallValid(item.overall))stcFail("TRANSFER_SIGNINGS_INVALID");
84:       if(hasPlayerId&&!(Number.isInteger(item.playerId)&&item.playerId>=1&&item.playerId<=999999))stcFail("TRANSFER_SIGNINGS_INVALID");
85:       if(hasPosition&&!POSITIONS.includes(item.position))stcFail("TRANSFER_SIGNINGS_INVALID");
86:       if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_SIGNINGS_INVALID");
87:       seen.add(item.slot);
88:       const name=String(item.name||"").trim();
89:       if(!name||name.length>80||name!==item.name)stcFail("TRANSFER_SIGNINGS_INVALID");
90:       if(!leagueIds.has(item.leagueId)||!nationalityIds.has(item.nationalityId))stcFail("TRANSFER_SIGNINGS_INVALID");
91:       const row={slot:item.slot,name,leagueId:item.leagueId,nationalityId:item.nationalityId};
92:       if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;if(hasPlayerId)row.playerId=item.playerId;
93:       return row;
94:     }).sort((a,b)=>a.slot-b.slot);
95:   }
96:   function stcInputs(value){
97:     stcExact(value,ROLES,"TRANSFER_STATE_INVALID");
98:     for(const role of ROLES){
99:       stcExact(value[role],["guesses","signings"],"TRANSFER_STATE_INVALID");
100:       if(value[role].guesses!==null&&!Array.isArray(value[role].guesses))stcFail("TRANSFER_STATE_INVALID");
101:       if(value[role].signings!==null&&!Array.isArray(value[role].signings))stcFail("TRANSFER_STATE_INVALID");
102:     }
103:     return value;
104:   }
105:   function stcReceipt(value){
106:     stcExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"TRANSFER_STATE_INVALID");
107:     if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||typeof value.type!=="string"||!HASH.test(value.commandHash))stcFail("TRANSFER_STATE_INVALID");
108:     return value;
109:   }
110:   async function stcVerifyState(value,leagueIds,nationalityIds,cryptoImpl){
111:     stcExact(value,STATE_KEYS,"TRANSFER_STATE_INVALID");
112:     const state=stcClone(value),hash=state.contentHash;delete state.contentHash;
113:     if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!ROLES.includes(value.coordinatorRole)||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||!HASH.test(hash))stcFail("TRANSFER_STATE_INVALID");
114:     stcEpoch(value.startedAtEpochMs);
115:     if(value.endedAtEpochMs!==null)stcEpoch(value.endedAtEpochMs);
116:     stcRoleList(value.endRequestedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.guessLockedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.signingLockedRoles,"TRANSFER_STATE_INVALID");
117:     stcInputs(value.inputs);
118:     if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)stcFail("TRANSFER_STATE_INVALID");
119:     value.receipts.forEach(stcReceipt);
120:     if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length)stcFail("TRANSFER_STATE_INVALID");
121:     if(value.receipts.some((receipt,index)=>receipt.baseRevision!==index))stcFail("TRANSFER_STATE_INVALID");
122:     for(const role of ROLES){
123:       const roleInput=value.inputs[role];
124:       if(roleInput.guesses!==null)stcNormalizeGuesses(roleInput.guesses,leagueIds,nationalityIds);
125:       if(roleInput.signings!==null)stcNormalizeSignings(roleInput.signings,leagueIds,nationalityIds);
126:       if(value.guessLockedRoles.includes(role)!==(roleInput.guesses!==null))stcFail("TRANSFER_STATE_INVALID");
127:       if(value.signingLockedRoles.includes(role)!==(roleInput.signings!==null))stcFail("TRANSFER_STATE_INVALID");
128:     }
129:     if(value.phase==="WINDOW_OPEN"&&(value.guessLockedRoles.length||value.signingLockedRoles.length||value.endedAtEpochMs!==null))stcFail("TRANSFER_STATE_INVALID");
130:     if(value.phase==="GUESS_ENTRY"&&(value.signingLockedRoles.length||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
131:     if(value.phase==="SIGNING_ENTRY"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
132:     if(value.phase==="COMPLETED"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
133:     if(await stcHash(state,cryptoImpl)!==hash)stcFail("TRANSFER_STATE_HASH_MISMATCH");
134:     return stcFreeze(stcClone(value));
135:   }
136:   function stcCommand(value,leagueIds,nationalityIds){
137:     if(!stcPlain(value)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||typeof value.type!=="string")stcFail("TRANSFER_COMMAND_INVALID");
138:     const common=["type","operationId","baseRevision"];
139:     if(value.type==="start-window"||value.type==="request-end-window"||value.type==="advance-expired-window")stcExact(value,common,"TRANSFER_COMMAND_INVALID");
140:     else if(value.type==="lock-guesses"){stcExact(value,[...common,"guesses"],"TRANSFER_COMMAND_INVALID");return {...value,guesses:stcNormalizeGuesses(value.guesses,leagueIds,nationalityIds)};}
141:     else if(value.type==="lock-signings"){stcExact(value,[...common,"signings"],"TRANSFER_COMMAND_INVALID");return {...value,signings:stcNormalizeSignings(value.signings,leagueIds,nationalityIds)};}
142:     else stcFail("TRANSFER_COMMAND_INVALID");
143:     return {...value};
144:   }
145:   function stcEvaluateRole(role,state){
146:     stcRole(role);
147:     if(state.phase!=="COMPLETED")stcFail("TRANSFER_VERDICT_NOT_READY");
148:     const opponent=role==="playerOne"?"playerTwo":"playerOne";
149:     const guesses=state.inputs[opponent].guesses||[];
150:     return (state.inputs[role].signings||[]).map(signing=>{
151:       const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));
152:       return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};
153:     });
154:   }
155: 
156:   async function stcCreateProtocol({leagueIds,nationalityIds,cryptoImpl=root.crypto}={}){
157:     const leagues=stcCatalogIds(leagueIds,"TRANSFER_LEAGUE_CATALOG_INVALID"),nationalities=stcCatalogIds(nationalityIds,"TRANSFER_NATIONALITY_CATALOG_INVALID");
158:     async function stcSeal(core){return stcFreeze({...stcClone(core),contentHash:await stcHash(core,cryptoImpl)});}
159:     async function stcVerifyProtocolState(value){return stcVerifyState(value,leagues,nationalities,cryptoImpl);}
160:     async function stcApply({state=null,setup,careerStart,seasonNumber,actorRole,command,nowEpochMs}){
161:       const confirmed=stcConfirmedSetup(setup);stcCareerReady(careerStart);const role=stcRole(actorRole),now=stcEpoch(nowEpochMs),cmd=stcCommand(command,leagues,nationalities);
162:       if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>confirmed.totalSeasons)stcFail("TRANSFER_SEASON_INVALID");
163:       const current=state?await stcVerifyProtocolState(state):null;
164:       if(current&&current.seasonNumber!==seasonNumber)stcFail("TRANSFER_SEASON_MISMATCH");
165:       if(current&&current.coordinatorRole!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_MISMATCH");
166:       const commandHash=await stcHash({actorRole:role,...cmd},cryptoImpl);
167:       if(current){
168:         const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);
169:         if(prior){
170:           if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)stcFail("TRANSFER_IDEMPOTENCY_CONFLICT");
171:           return stcFreeze({ok:true,idempotent:true,state:current});
172:         }
173:       }
174:       const revision=current?current.revision:0;
175:       if(cmd.baseRevision!==revision)stcFail("TRANSFER_STALE_BASE_REVISION");
176:       if(!current&&cmd.type!=="start-window")stcFail("TRANSFER_NOT_STARTED");
177:       if(current&&cmd.type==="start-window")stcFail("TRANSFER_ALREADY_STARTED");
178:       if(current&&current.phase==="COMPLETED")stcFail("TRANSFER_ALREADY_COMPLETED");
179:       let core=current?stcClone(current):{
180:         schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,coordinatorRole:confirmed.coordinatorRole,
181:         phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],
182:         inputs:{playerOne:{guesses:null,signings:null},playerTwo:{guesses:null,signings:null}},receipts:[]
183:       };
184:       delete core.contentHash;
185:       if(cmd.type==="start-window"){
186:         if(role!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_REQUIRED");
187:         core.startedAtEpochMs=now;
188:       }else if(cmd.type==="request-end-window"){
189:         if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
190:         if(core.endRequestedRoles.includes(role))stcFail("TRANSFER_END_ALREADY_REQUESTED");
191:         core.endRequestedRoles.push(role);
192:         if(core.endRequestedRoles.length===2){core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;}
193:       }else if(cmd.type==="advance-expired-window"){
194:         if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
195:         if(now<core.startedAtEpochMs+WINDOW_MS)stcFail("TRANSFER_WINDOW_STILL_OPEN");
196:         core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;
197:       }else if(cmd.type==="lock-guesses"){
198:         if(core.phase!=="GUESS_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
199:         if(core.guessLockedRoles.includes(role))stcFail("TRANSFER_GUESSES_ALREADY_LOCKED");
200:         core.inputs[role].guesses=cmd.guesses;core.guessLockedRoles.push(role);
201:         if(core.guessLockedRoles.length===2)core.phase="SIGNING_ENTRY";
202:       }else if(cmd.type==="lock-signings"){
203:         if(core.phase!=="SIGNING_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
204:         if(core.signingLockedRoles.includes(role))stcFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");
205:         core.inputs[role].signings=cmd.signings;core.signingLockedRoles.push(role);
206:         if(core.signingLockedRoles.length===2)core.phase="COMPLETED";
207:       }
208:       core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});
209:       core.revision=revision+1;
210:       const next=await stcSeal(core);await stcVerifyProtocolState(next);
211:       return stcFreeze({ok:true,idempotent:false,state:next});
212:     }
213:     function stcProjectForRole(state,role){
214:       stcRole(role);const current=stcClone(state),opponent=role==="playerOne"?"playerTwo":"playerOne";
215:       if(current.phase!=="COMPLETED")current.inputs[opponent]={guesses:null,signings:null};
216:       const projection={
217:         schemaVersion:current.schemaVersion,runtimeRevision:current.runtimeRevision,seasonNumber:current.seasonNumber,coordinatorRole:current.coordinatorRole,
218:         phase:current.phase,revision:current.revision,startedAtEpochMs:current.startedAtEpochMs,endedAtEpochMs:current.endedAtEpochMs,
219:         endRequestedRoles:[...current.endRequestedRoles],guessLockedRoles:[...current.guessLockedRoles],signingLockedRoles:[...current.signingLockedRoles],
220:         managerRole:role,inputs:current.inputs,verdicts:current.phase==="COMPLETED"?{playerOne:stcEvaluateRole("playerOne",current),playerTwo:stcEvaluateRole("playerTwo",current)}:null
221:       };
222:       return stcFreeze(projection);
223:     }
224:     return stcFreeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,apply:stcApply,verifyState:stcVerifyProtocolState,projectForRole:stcProjectForRole,evaluateRole:(role,state)=>stcFreeze(stcEvaluateRole(role,state)),billingRequired:false,canonicalStorageMutation:false});
225:   }
226: 
227:   return Object.freeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge-protocol-factory",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,createProtocol:stcCreateProtocol,billingRequired:false,canonicalStorageMutation:false});
228: });
229: 
```

## FILE: firestore.transfer-challenge-production.fragment.rules (476 lines)
```
1: // SSJR_TRANSFER_CHALLENGE_FUNCTIONS_BEGIN
2:     function ssjrTransferValidOperationId(value) { return value is string && value.matches('^transfer_op_[0-9a-f]{32}$'); }
3:     function ssjrTransferValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
4:     function ssjrTransferValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
5:     // JOB-1052: exactly the repository FIFA 17 catalog the game's reader accepts. One anchored alternation per catalog (and one over both), so each
6:     // id costs one regex match, not a list membership scan: the max-size 3-guess/3-signing transaction stays inside the evaluation budget.
7:     // The build script fills the placeholders from data/transferOptions.js; they are never hand-edited. A non-string value makes matches() error, which denies.
8:     function ssjrTransferValidOptionId(value) { return value.matches('__SSJR_TRANSFER_OPTION_ID_PATTERN__'); }
9:     function ssjrTransferCatalogLeagueId(value) { return value.matches('__SSJR_TRANSFER_LEAGUE_ID_PATTERN__'); }
10:     function ssjrTransferCatalogNationalityId(value) { return value.matches('__SSJR_TRANSFER_NATIONALITY_ID_PATTERN__'); }
11:     // JOB-1052: a signing name the reader accepts: 1 to 80 characters and unchanged by JavaScript String.trim() (no leading or trailing
12:     // white space or line terminator: TAB..CR, space, U+00A0, U+1680, U+2000..U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF).
13:     function ssjrTransferValidSigningName(value) {
14:       return value is string
15:         && value.size() >= 1
16:         && value.size() <= 80
17:         && value.matches('^[^\\t-\\r \\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}]([\\s\\S]*[^\\t-\\r \\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}])?$');
18:     }
19:     // JOB-1051: a lock salt is null (not set yet) or exactly 64 lowercase hex characters.
20:     function ssjrTransferValidSalt(value) { return value == null || (value is string && value.matches('^[0-9a-f]{64}$')); }
21:     function ssjrTransferSeasonMatches(transferId, seasonNumber) {
22:       return seasonNumber is int
23:         && seasonNumber >= 1
24:         && seasonNumber <= 10
25:         && transferId == 'season_' + string(seasonNumber);
26:     }
27:     function ssjrTransferSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data; }
28:     function ssjrTransferCareer(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/careerStart/authoritative).data; }
29:     function ssjrTransferPrerequisites(rivalryId, seasonNumber) {
30:       let setup = ssjrTransferSetup(rivalryId);
31:       let career = ssjrTransferCareer(rivalryId);
32:       return setup.revision == 6
33:         && setup.phase == 'SHOWDOWN_CONFIRMED'
34:         && setup.totalSeasons in [1,3,5,10]
35:         && seasonNumber >= 1
36:         && seasonNumber <= setup.totalSeasons
37:         && career.setupRevision == 6
38:         && career.totalSeasons == setup.totalSeasons
39:         && career.revision == 2
40:         && career.phase == 'CAREER_START_READY'
41:         && career.acknowledgedRoles is list
42:         && career.acknowledgedRoles.size() == 2
43:         && 'playerOne' in career.acknowledgedRoles
44:         && 'playerTwo' in career.acknowledgedRoles;
45:     }
46:     function ssjrTransferPublicExactKeys(root) {
47:       return root.keys().hasOnly([
48:         'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','coordinatorRole','phase','revision',
49:         'startedAt','endedAt','endRequestedRoles','guessLockedRoles','signingLockedRoles',
50:         'operationIds','operationTypes','operationHashes','baseRevisions','actorRoles',
51:         'activeSessionId','updatedAt','updatedByDeviceId'
52:       ]);
53:     }
54:     // R93-08 (Rules budget sweep): START is the costliest ledger write of a season (~975 of the 1,000 expressions for one
55:     // document, from the two roulette marks). This shape is checked only at START (ssjrTransferValidCreate), where the
56:     // ledger is revision 1 with one operation, WINDOW_OPEN, started now, not ended, and every role list empty. Those exact
57:     // values are tested once here instead of a general range check (revision 1..7, any of four phases, a timestamp or null,
58:     // a valid role list) followed by the exact value in ssjrTransferValidCreate. Same documents pass and fail.
59:     function ssjrTransferPublicShape(root, rivalryId, transferId) {
60:       let setup = ssjrTransferSetup(rivalryId);
61:       return ssjrTransferPublicExactKeys(root)
62:         && root.schemaVersion == 1
63:         && root.objectType == 'sharedTransferChallenge'
64:         && root.rivalryId == rivalryId
65:         && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
66:         && ssjrTransferPrerequisites(rivalryId, root.seasonNumber)
67:         && root.runtimeRevision == '1.9.1-r8'
68:         && root.coordinatorRole == setup.coordinatorRole
69:         && root.revision == 1
70:         && root.startedAt == request.time
71:         && root.endedAt == null
72:         && root.endRequestedRoles == []
73:         && root.guessLockedRoles == []
74:         && root.signingLockedRoles == []
75:         && root.operationIds is list
76:         && root.operationTypes is list
77:         && root.operationHashes is list
78:         && root.baseRevisions is list
79:         && root.actorRoles is list
80:         && root.operationIds.size() == 1
81:         && root.operationTypes.size() == 1
82:         && root.operationHashes.size() == 1
83:         && root.baseRevisions.size() == 1
84:         && root.actorRoles.size() == 1
85:         && root.updatedAt == request.time
86:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
87:     }
88:     function ssjrTransferPublicPrefixPreserved(before, after) {
89:       let i = before.revision;
90:       return after.operationIds == before.operationIds.concat([after.operationIds[i]])
91:         && after.operationTypes == before.operationTypes.concat([after.operationTypes[i]])
92:         && after.operationHashes == before.operationHashes.concat([after.operationHashes[i]])
93:         && after.baseRevisions == before.baseRevisions.concat([after.baseRevisions[i]])
94:         && after.actorRoles == before.actorRoles.concat([after.actorRoles[i]]);
95:     }
96:     function ssjrTransferNewOperationValid(before, after) {
97:       let i = before.revision;
98:       return ssjrTransferValidOperationId(after.operationIds[i])
99:         && !(after.operationIds[i] in before.operationIds)
100:         && ssjrTransferValidHash(after.operationHashes[i])
101:         && after.baseRevisions[i] == before.revision
102:         && after.actorRoles[i] == ssjrActorRole(after.rivalryId);
103:     }
104:     function ssjrTransferOwnRoleAfter(rivalryId, transferId) {
105:       let role = ssjrActorRole(rivalryId);
106:       return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)/roles/$(role)).data;
107:     }
108:     function ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, operationType) {
109:       let role = ssjrActorRole(rivalryId);
110:       let own = ssjrTransferOwnRoleAfter(rivalryId, transferId);
111:       return own.managerRole == role
112:         && own.activeSessionId == after.activeSessionId
113:         && own.updatedByDeviceId == after.updatedByDeviceId
114:         && own.updatedAt == request.time
115:         && (
116:           (operationType == 'lock-guesses' && own.guessLockedAt == request.time && own.signingLockedAt == null)
117:           || (operationType == 'lock-signings' && own.signingLockedAt == request.time)
118:         );
119:     }
120:     function ssjrTransferEndRequestTransition(before, after, actorRole) {
121:       let priorSize = before.endRequestedRoles.size();
122:       return before.phase == 'WINDOW_OPEN'
123:         && priorSize <= 1
124:         && !(actorRole in before.endRequestedRoles)
125:         && after.endRequestedRoles == before.endRequestedRoles.concat([actorRole])
126:         && after.guessLockedRoles == before.guessLockedRoles
127:         && after.signingLockedRoles == before.signingLockedRoles
128:         && (
129:           (priorSize == 0 && after.phase == 'WINDOW_OPEN' && after.endedAt == null)
130:           || (priorSize == 1 && after.phase == 'GUESS_ENTRY' && after.endedAt == request.time)
131:         );
132:     }
133:     function ssjrTransferExpiryTransition(before, after) {
134:       return before.phase == 'WINDOW_OPEN'
135:         && request.time >= before.startedAt + duration.value(15, 'm')
136:         && after.phase == 'GUESS_ENTRY'
137:         && after.endedAt == request.time
138:         && after.endRequestedRoles == before.endRequestedRoles
139:         && after.guessLockedRoles == before.guessLockedRoles
140:         && after.signingLockedRoles == before.signingLockedRoles;
141:     }
142:     function ssjrTransferGuessLockTransition(rivalryId, transferId, before, after, actorRole) {
143:       let priorSize = before.guessLockedRoles.size();
144:       return before.phase == 'GUESS_ENTRY'
145:         && priorSize <= 1
146:         && !(actorRole in before.guessLockedRoles)
147:         && after.guessLockedRoles == before.guessLockedRoles.concat([actorRole])
148:         && after.endRequestedRoles == before.endRequestedRoles
149:         && after.signingLockedRoles == before.signingLockedRoles
150:         && after.endedAt == before.endedAt
151:         && ((priorSize == 0 && after.phase == 'GUESS_ENTRY') || (priorSize == 1 && after.phase == 'SIGNING_ENTRY'))
152:         && ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, 'lock-guesses');
153:     }
154:     function ssjrTransferSigningLockTransition(rivalryId, transferId, before, after, actorRole) {
155:       let priorSize = before.signingLockedRoles.size();
156:       return before.phase == 'SIGNING_ENTRY'
157:         && priorSize <= 1
158:         && actorRole in before.guessLockedRoles
159:         && !(actorRole in before.signingLockedRoles)
160:         && after.signingLockedRoles == before.signingLockedRoles.concat([actorRole])
161:         && after.endRequestedRoles == before.endRequestedRoles
162:         && after.guessLockedRoles == before.guessLockedRoles
163:         && after.endedAt == before.endedAt
164:         && ((priorSize == 0 && after.phase == 'SIGNING_ENTRY') || (priorSize == 1 && after.phase == 'COMPLETED'))
165:         && ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, 'lock-signings');
166:     }
167:     function ssjrTransferValidCreate(rivalryId, transferId) {
168:       let after = request.resource.data;
169:       return after.phase == 'WINDOW_OPEN'
170:         && ssjrTransferPublicShape(after, rivalryId, transferId)
171:         && ssjrValidOperationId(after.operationIds[0]) == false
172:         && ssjrTransferValidOperationId(after.operationIds[0])
173:         && after.operationTypes[0] == 'start-window'
174:         && ssjrTransferValidHash(after.operationHashes[0])
175:         && after.baseRevisions[0] == 0
176:         && after.actorRoles[0] == after.coordinatorRole
177:         && after.coordinatorRole == ssjrActorRole(rivalryId)
178:         // Codex R87-E-01: a season's window opens only after the previous season was committed and acknowledged by both
179:         // phones, so a wrong season number from a buggy caller can never create a future season. One lookup per START
180:         // (seasons 2 to 10), never on later ledger writes or listener deliveries.
181:         && (after.seasonNumber == 1
182:           || get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.seasonNumber - 1))).data.phase == 'ACKNOWLEDGED');
183:     }
184:     // R87 roulette marks: a pre-window mark document (phase NOT_STARTED) is never a ledger to update (START from it is
185:     // ssjrTransferStartAfterSpins). The phase is tested before the ledger function's let bindings run: measured on the emulator,
186:     // START from a two-mark document was refused while those bindings ran against it.
187:     function ssjrTransferValidUpdate(rivalryId, transferId) {
188:       return resource.data.phase != 'NOT_STARTED' && ssjrTransferValidLedgerUpdate(rivalryId, transferId);
189:     }
190:     // Updates preserve the secured creation envelope and validate only the append-only transition delta.
191:     function ssjrTransferValidLedgerUpdate(rivalryId, transferId) {
192:       let before = resource.data;
193:       let after = request.resource.data;
194:       let i = before.revision;
195:       let type = after.operationTypes[i];
196:       let role = ssjrActorRole(rivalryId);
197:       return ssjrTransferPublicExactKeys(after)
198:         && after.schemaVersion == before.schemaVersion
199:         && after.objectType == before.objectType
200:         && after.rivalryId == before.rivalryId
201:         && after.seasonNumber == before.seasonNumber
202:         && after.runtimeRevision == before.runtimeRevision
203:         && after.coordinatorRole == before.coordinatorRole
204:         && after.startedAt == before.startedAt
205:         && after.revision == before.revision + 1
206:         && after.updatedAt == request.time
207:         && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)
208:         && ssjrTransferPublicPrefixPreserved(before, after)
209:         && ssjrTransferNewOperationValid(before, after)
210:         && (
211:           (type == 'request-end-window' && ssjrTransferEndRequestTransition(before, after, role))
212:           || (type == 'advance-expired-window' && ssjrTransferExpiryTransition(before, after))
213:           || (type == 'lock-guesses' && ssjrTransferGuessLockTransition(rivalryId, transferId, before, after, role))
214:           || (type == 'lock-signings' && ssjrTransferSigningLockTransition(rivalryId, transferId, before, after, role))
215:         );
216:     }
217:     function ssjrTransferGuessRowValid(value) {
218:       return value is map
219:         && value.keys().hasOnly(['slot','type','valueId'])
220:         && value.slot is int
221:         && value.slot >= 1
222:         && value.slot <= 3
223:         && (value.type == 'league' || value.type == 'nationality')
224:         && ssjrTransferValidOptionId(value.valueId)
225:         && ((value.type == 'league' && ssjrTransferCatalogLeagueId(value.valueId))
226:           || (value.type == 'nationality' && ssjrTransferCatalogNationalityId(value.valueId)));
227:     }
228:     // R93-07 (hunt T2-1): three rows picked from the name list (overall + position + playerId each) took LOCK MY SIGNINGS past the
229:     // 1,000-expression limit. Same checks, cheaper form: an absent optional key reads as an in-range default (one lookup, one let),
230:     // a key that is present still has to be an int in range (overall 30..99, playerId 1..999999) or one of the 15 positions;
231:     // null, a float, a string or an unknown position is refused as before. The position list is one anchored regex (a list
232:     // literal costs one expression per item); the catalog regexes alone check the ids (they are a subset of the option ids).
233:     function ssjrTransferSigningRowValid(value) {
234:       let overall = value.get('overall', 30);
235:       // r91 (2.4.0): the SoFIFA id of a player picked from the Transfer War autocomplete (optional; a typed name has none).
236:       let playerId = value.get('playerId', 1);
237:       let position = value.get('position', 'GK');
238:       return value is map
239:         && value.keys().hasOnly(['slot','name','leagueId','nationalityId','overall','position','playerId'])
240:         && overall is int && overall >= 30 && overall <= 99
241:         && playerId is int && playerId >= 1 && playerId <= 999999
242:         && position.matches('^(GK|RB|RWB|CB|LB|LWB|CDM|CM|CAM|RM|LM|RW|LW|CF|ST)$')
243:         && value.slot is int
244:         && value.slot >= 1
245:         && value.slot <= 3
246:         && ssjrTransferValidSigningName(value.name)
247:         && ssjrTransferCatalogLeagueId(value.leagueId)
248:         && ssjrTransferCatalogNationalityId(value.nationalityId);
249:     }
250:     function ssjrTransferGuessesValid(value) {
251:       return value is list
252:         && value.size() <= 3
253:         && (value.size() < 1 || ssjrTransferGuessRowValid(value[0]))
254:         && (value.size() < 2 || (ssjrTransferGuessRowValid(value[1]) && value[1].slot != value[0].slot))
255:         && (value.size() < 3 || (ssjrTransferGuessRowValid(value[2]) && value[2].slot != value[0].slot && value[2].slot != value[1].slot));
256:     }
257:     function ssjrTransferSigningsValid(value) {
258:       return value is list
259:         && value.size() <= 3
260:         && (value.size() < 1 || ssjrTransferSigningRowValid(value[0]))
261:         && (value.size() < 2 || (ssjrTransferSigningRowValid(value[1]) && value[1].slot != value[0].slot))
262:         && (value.size() < 3 || (ssjrTransferSigningRowValid(value[2]) && value[2].slot != value[0].slot && value[2].slot != value[1].slot));
263:     }
264:     // JOB-1051: a role document written by r66 has no salt keys; a salted one has both (each null or 64 lowercase hex). Never only one.
265:     function ssjrTransferPrivateExactKeys(root) {
266:       return root.keys().hasOnly([
267:         'schemaVersion','objectType','rivalryId','seasonNumber','managerRole','guesses','signings',
268:         'guessLockedAt','signingLockedAt','activeSessionId','updatedAt','updatedByDeviceId',
269:         'guessSalt','signingSalt'
270:       ])
271:         && (root.keys().hasAll(['guessSalt','signingSalt']) || !root.keys().hasAny(['guessSalt','signingSalt']));
272:     }
273:     function ssjrTransferPrivateBase(root, rivalryId, transferId, managerRole) {
274:       return ssjrTransferPrivateExactKeys(root)
275:         && root.schemaVersion == 1
276:         && root.objectType == 'sharedTransferChallengeRole'
277:         && root.rivalryId == rivalryId
278:         && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
279:         && root.managerRole == managerRole
280:         && managerRole == ssjrActorRole(rivalryId)
281:         && ssjrTransferGuessesValid(root.guesses)
282:         && (root.signings == null || ssjrTransferSigningsValid(root.signings))
283:         && root.guessLockedAt is timestamp
284:         && (root.signingLockedAt == null || root.signingLockedAt is timestamp)
285:         && root.updatedAt == request.time
286:         && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
287:     }
288:     function ssjrTransferPublicAfter(rivalryId, transferId) {
289:       return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
290:     }
291:     function ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole) {
292:       let after = request.resource.data;
293:       let public = ssjrTransferPublicAfter(rivalryId, transferId);
294:       let i = public.revision - 1;
295:       return ssjrTransferPrivateBase(after, rivalryId, transferId, managerRole)
296:         && after.signings == null
297:         && after.signingLockedAt == null
298:         && ssjrTransferValidSalt(after.get('guessSalt', null))
299:         && after.get('signingSalt', null) == null
300:         && after.guessLockedAt == request.time
301:         && public.operationTypes[i] == 'lock-guesses'
302:         && public.actorRoles[i] == managerRole
303:         && managerRole in public.guessLockedRoles
304:         && public.activeSessionId == after.activeSessionId
305:         && public.updatedByDeviceId == after.updatedByDeviceId
306:         && public.updatedAt == request.time;
307:     }
308:     // R93-07: one diff instead of an exact key list plus seven equalities. The stored document was created with exact keys
309:     // (ssjrTransferPrivateBase), so a lock may change or add only these keys; schemaVersion, objectType, rivalryId,
310:     // seasonNumber, managerRole, guesses and guessLockedAt stay exactly as stored. guessSalt may only appear as null on an
311:     // r66 document (the equality below), and the salt keys stay both-or-neither.
312:     function ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole) {
313:       let before = resource.data;
314:       let after = request.resource.data;
315:       let public = ssjrTransferPublicAfter(rivalryId, transferId);
316:       let i = public.revision - 1;
317:       return after.diff(before).affectedKeys().hasOnly(['signings','signingLockedAt','signingSalt','guessSalt','updatedAt','updatedByDeviceId','activeSessionId'])
318:         && (after.keys().hasAll(['guessSalt','signingSalt']) || !after.keys().hasAny(['guessSalt','signingSalt']))
319:         && managerRole == before.managerRole
320:         && managerRole == ssjrActorRole(rivalryId)
321:         && after.get('guessSalt', null) == before.get('guessSalt', null)
322:         && before.get('signingSalt', null) == null
323:         && ssjrTransferValidSalt(after.get('signingSalt', null))
324:         && before.signings == null
325:         && before.signingLockedAt == null
326:         && ssjrTransferSigningsValid(after.signings)
327:         && after.signingLockedAt == request.time
328:         && after.updatedAt == request.time
329:         // Codex R87-E-04: three r87 signing rows (overall + position) took the full check past the 1,000-expression limit,
330:         // so a normal three-signing lock was denied. The linked public ledger write in the same transaction (updatedAt ==
331:         // request.time, same session and device, this role as the actor) already runs the full ssjrWriteAuthorityValid pair
332:         // envelope; this private half keeps the actor, account, device and ACTIVE-session checks, as season commits do.
333:         && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)
334:         && public.operationTypes[i] == 'lock-signings'
335:         && public.actorRoles[i] == managerRole
336:         && managerRole in public.signingLockedRoles
337:         && public.activeSessionId == after.activeSessionId
338:         && public.updatedByDeviceId == after.updatedByDeviceId
339:         && public.updatedAt == request.time;
340:     }
341:     // R87 roulette marks (Nik 2026-10-31, red team RT5-FLOW-02): the shared window waits until both managers have spun this season's
342:     // Russian Roster Roulette. Before the window opens, transferChallenges/season_N may hold a small pre-window document whose
343:     // spins map has a true entry per manager who has spun. Each member writes only his own entry (one merge write, one lookup: the
344:     // rivalry, like the reads meter), never removes or changes the partner's, never removes his own, and never once the ledger has
345:     // started. START from that document needs both entries and writes the normal ledger in its place (exact keys as before).
346:     // A season with no marks (a Showdown from before the roulette) still starts by the create rule. Every branch first tests the
347:     // phase of the stored or new document, so a normal ledger write never evaluates these and looks up nothing more.
348:     function ssjrTransferSpinShape(root, rivalryId, transferId) {
349:       return root.keys().hasAll(['schemaVersion','objectType','rivalryId','seasonNumber','phase','spins','updatedAt'])
350:         && root.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','phase','spins','updatedAt'])
351:         && root.schemaVersion == 1
352:         && root.objectType == 'sharedTransferChallenge'
353:         && root.rivalryId == rivalryId
354:         && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
355:         && root.phase == 'NOT_STARTED'
356:         && root.spins is map
357:         && root.spins.keys().hasOnly(['playerOne','playerTwo'])
358:         && (root.spins.get('playerOne', true) == true || ssjrTransferSpinOutcomeValid(root.spins.playerOne))
359:         && (root.spins.get('playerTwo', true) == true || ssjrTransferSpinOutcomeValid(root.spins.playerTwo))
360:         && root.updatedAt == request.time;
361:     }
362:     // F2-02 (Fable job 2): a mark may record its manager's outcome for the season instead of plain true: fired, the shot player's
363:     // name (as a signing name: 1-80 characters, trimmed), shirt number (0-99 or null), board slot 0-14 and the season he was
364:     // signed (1-10, or null for a club player: the two are different people), and the engine and data version. A safe spin has
365:     // no name, number, slot or season. Exact keys; nothing else.
366:     function ssjrTransferSpinOutcomeValid(value) {
367:       return value is map
368:         && value.keys().hasAll(['fired','hitName','hitNumber','hitSlot','hitSignedSeason','version'])
369:         && value.keys().hasOnly(['fired','hitName','hitNumber','hitSlot','hitSignedSeason','version'])
370:         && value.version is string
371:         && value.version.size() <= 24
372:         && value.version.matches('^rr[0-9]{1,3}[.][0-9]{1,4}[.][0-9a-f]{8}$')
373:         && (
374:           (value.fired == true
375:             && ssjrTransferValidSigningName(value.hitName)
376:             && value.hitSlot is int && value.hitSlot >= 0 && value.hitSlot <= 14
377:             && (value.hitNumber == null || (value.hitNumber is int && value.hitNumber >= 0 && value.hitNumber <= 99))
378:             && (value.hitSignedSeason == null || (value.hitSignedSeason is int && value.hitSignedSeason >= 1 && value.hitSignedSeason <= 10)))
379:           || (value.fired == false && value.hitName == null && value.hitNumber == null && value.hitSlot == null && value.hitSignedSeason == null)
380:         );
381:     }
382:     function ssjrTransferSpinCreate(rivalryId, transferId) {
383:       let after = request.resource.data;
384:       return after.phase == 'NOT_STARTED'
385:         // r89 Sacked: no Transfer War after a season in which either manager was sacked. Checked here, on the first mark of
386:         // the next season (one lookup, seasons 2 to 10), because START from the marks has no expression headroom left
387:         // (measured on the emulator: one more term there hits the 1,000-expression limit). The second mark is an update
388:         // of this document and START needs both, so a refused first mark keeps the window shut. Early in the check, so the
389:         // refusal is an ordinary denial.
390:         && after.seasonNumber is int
391:         // A missing previous commit keeps the older behaviour (no sacking can exist without one); the existence check and
392:         // the read of the same document are one lookup.
393:         && (after.seasonNumber == 1
394:           || !exists(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.seasonNumber - 1)))
395:           || ssjrTransferPreviousSeasonOpen(get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$('season_' + string(after.seasonNumber - 1))).data))
396:         && ssjrTransferSpinShape(after, rivalryId, transferId)
397:         && ssjrEntitled(rivalryId)
398:         && after.spins.keys().hasOnly([ssjrActorRole(rivalryId)])
399:         && after.spins[ssjrActorRole(rivalryId)] != false;
400:     }
401:     function ssjrTransferPreviousSeasonOpen(commit) {
402:       return commit.results.playerOne.get('sacked', false) == false
403:         && commit.results.playerTwo.get('sacked', false) == false;
404:     }
405:     function ssjrTransferSpinUpdate(rivalryId, transferId) {
406:       let before = resource.data;
407:       let after = request.resource.data;
408:       return before.phase == 'NOT_STARTED'
409:         && after.phase == 'NOT_STARTED'
410:         && ssjrTransferSpinShape(after, rivalryId, transferId)
411:         && after.seasonNumber == before.seasonNumber
412:         && ssjrEntitled(rivalryId)
413:         && !(ssjrActorRole(rivalryId) in before.spins)
414:         && after.spins.diff(before.spins).affectedKeys().hasOnly([ssjrActorRole(rivalryId)])
415:         && after.spins[ssjrActorRole(rivalryId)] != false;
416:     }
417:     function ssjrTransferStartAfterSpins(rivalryId, transferId) {
418:       let before = resource.data;
419:       return before.phase == 'NOT_STARTED'
420:         && before.spins.get('playerOne', false) != false
421:         && before.spins.get('playerTwo', false) != false
422:         && ssjrTransferValidCreate(rivalryId, transferId);
423:     }
424:     // F2-02 (Fable job 2): START replaces the mark document with the ledger, so it also writes one durable record of both marks:
425:     // transferChallenges/season_N/roulette/spins, an exact copy of the stored spins (both present, so final: each entry is written
426:     // once). Created once, never updated, listed or deleted; members read it to replay earlier seasons' saved shots. One lookup
427:     // more than START itself (the mark document as it stands before this request).
428:     function ssjrTransferRouletteRecordCreate(rivalryId, transferId, docId) {
429:       let after = request.resource.data;
430:       let marks = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
431:       return docId == 'spins'
432:         && after.keys().hasAll(['schemaVersion','objectType','rivalryId','seasonNumber','spins'])
433:         && after.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','spins'])
434:         && after.schemaVersion == 1
435:         && after.objectType == 'sharedTransferRouletteSpins'
436:         && after.rivalryId == rivalryId
437:         && ssjrTransferSeasonMatches(transferId, after.seasonNumber)
438:         && ssjrEntitled(rivalryId)
439:         && marks.phase == 'NOT_STARTED'
440:         && marks.spins.get('playerOne', false) != false
441:         && marks.spins.get('playerTwo', false) != false
442:         && after.spins == marks.spins;
443:     }
444:     function ssjrTransferPrivateReadable(rivalryId, transferId, managerRole) {
445:       let public = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
446:       return ssjrEntitled(rivalryId)
447:         && (managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED');
448:     }
449: // SSJR_TRANSFER_CHALLENGE_FUNCTIONS_END
450: 
451: // SSJR_TRANSFER_CHALLENGE_MATCH_BEGIN
452:       match /transferChallenges/{transferId} {
453:         allow get: if ssjrEntitled(rivalryId);
454:         allow list, delete: if false;
455:         allow create: if ssjrTransferValidCreate(rivalryId, transferId);
456:         allow update: if ssjrTransferValidUpdate(rivalryId, transferId);
457:         // R87 roulette marks (RT5-FLOW-02): a member's own pre-window mark, and START from a document holding both marks.
458:         allow create: if ssjrTransferSpinCreate(rivalryId, transferId);
459:         allow update: if ssjrTransferSpinUpdate(rivalryId, transferId) || ssjrTransferStartAfterSpins(rivalryId, transferId);
460: 
461:         // F2-02: the durable record of both marks, written once by START.
462:         match /roulette/{docId} {
463:           allow get: if ssjrEntitled(rivalryId);
464:           allow list, update, delete: if false;
465:           allow create: if ssjrTransferRouletteRecordCreate(rivalryId, transferId, docId);
466:         }
467: 
468:         match /roles/{managerRole} {
469:           allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole);
470:           allow list, delete: if false;
471:           allow create: if ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole);
472:           allow update: if ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole);
473:         }
474:       }
475: // SSJR_TRANSFER_CHALLENGE_MATCH_END
476: 
```

(End of packet FJ3. Answer with the report only.)
