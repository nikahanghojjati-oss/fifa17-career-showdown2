# Fable 5.2 red-team job FJ10: 3D quality: per-screen holds and the Device check

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
Then one block per finding: ID (FJ10-NN), severity, TRACED/UNSURE, what the player sees, the sequence, file:line + quote, fix idea.
Close with: the questions below you checked and found clean (one line each), and what you could not check because it lives outside this packet.

## The questions, in priority order
1. New in 2.10.0: a tab crash or lost graphics context on one 3D screen should lower ONLY that screen (a hold), for 7 days, 3 clean plays of that screen, a Settings pick, or a new build. Can a hold leak to other screens, never end, or end too early? Can calibration of a held screen change the device level or other screens?
2. Device check: the run is saved for 30 minutes so a closed tab resumes it. Can a resumed run write a wrong level, run twice, or leave a run that never ends? Two tabs at once?
3. Can a hand-picked level in Settings be exceeded, or ignored?
4. Can any path here stop the game from moving on (a screen that never starts or never reports done)?
5. Old saved caps (one object, no screen) must still hold every screen: is that kept?

## Known (do not report)
Phones free Roulette's painted canvases after upload (by design); a lost context on such a phone hands over to the result card instead of rebuilding.

## Files

## FILE: js/gfxTier.js (987 lines)
```javascript
1: (function(root){
2:   "use strict";
3: 
4:   // One quality system for every 3D screen (r90): adapt to the device, so a Chromebook runs smooth and a high-end PC gets up to 4K. Plain script, no imports: the root page and the roulette page (../../../js/gfxTier.js) load the same file.
5:   // Use: p=profile() before the WebGLRenderer (antialias is fixed at context creation), then setPixelRatio(p.pixelRatio); await calibrate(renderer,draw) behind the loading screen (skipped on software GL); gov=governor(renderer,{key,draw,onChange}) (without draw it only steps down), then gov.frame(now) each frame, gov.hold(false) between beats, gov.end() on dispose; overlay(()=>({calls,tris})) shows only with ?fps=1.
6:   // Levels: 0 light (Chromebook class), 1 medium, 2 high, 3 extra, 4 ultra (native size, up to 2x past it within 3840x2160), 5 8k (only on a GPU with a 7680 px buffer, never a phone: up to 4x past native within 7680x4320; a lost context or refused buffer falls back to ultra, said in the ?fps=1 overlay).
7:   // r91 (Nik 2026-11-11: "Auto should allow all qualities based on device real test ... from light to 8k"): Auto covers every level. Its guess from the GPU name stays conservative (never past extra); the Device check (device-check.html) replaces the guess with the best level Chamber Men, Russian Roulette and the Special Player pack all held, up to ultra and, where the GPU can hold it, 8k. Below ultra, Auto never renders above devicePixelRatio.
8:   // r96 (Nik 2026-11-17 21:44 UTC, "Step down when slow, back up"): a picked level is a ceiling, not a promise. The governor
9:   // walks a picked level's ladder exactly as it walks Auto's (pixel ratio, then the scene's heavy parts, between beats only,
10:   // back up toward the pick when smooth); the level itself, its files and Settings stay the pick. ?gfx=N stays as forced.
11:   // r96 (Nik 2026-11-17 21:43 UTC: "lighter screens ... quality can be higher"): on Auto each 3D screen draws the highest
12:   // level the Device check passed on that screen (profile(scene)); the lowest of them stays the device's level (2D, Settings).
13:   // Scene knobs (crowd, bloom, shadow size) read the profile; the governor only moves the pixel ratio: down when frames run long, up only after a timed frame shows room, a step that ran slow is tried once more after a smooth stretch (r96), never twice in a visit (no see-saw).
14:   const KEY="careerModeShowdown.gfxQuality.v1";
15:   const CHOICES=["auto","light","medium","high","extra","ultra","8k"];
16:   const NAMES=["light","medium","high","extra","ultra","8k"];
17:   // r90 (Nik 2026-11-08: "unified levels for our screens"): the one list of level names a player ever reads (Settings, the
18:   // Device check, the ?fps=1 overlay). docs/QUALITY_LEVELS.md; tests/contracts/r90-quality-levels-contracts.cjs.
19:   const LABELS=["Light","Balanced","High","Extra","Ultra (4K)","8K"];
20:   // Per level: the pixel ratio it starts at and may reach (both capped by the screen), shadow map size, crowd density, bloom.
21:   const LEVELS=[
22:     {pr:1,max:1,shadowSize:1024,density:.45,bloom:false},
23:     {pr:1.25,max:1.5,shadowSize:1024,density:.7,bloom:true},
24:     {pr:1.5,max:2,shadowSize:2048,density:1,bloom:true},
25:     {pr:2,max:3,shadowSize:2048,density:1,bloom:true},
26:     {pr:2,max:4,shadowSize:4096,density:1,bloom:true},
27:     // r90 (Nik 2026-11-07, "8K as well as 4K"): on a GPU that can hold a 7680 px buffer, never on a phone; picked, or (r91) measured by the Device check.
28:     {pr:2,max:8,shadowSize:4096,density:1,bloom:true}
29:   ];
30:   const BUDGET_MS=16.7,BUFFER_CAP=3840*2160,BUFFER_CAP_8K=7680*4320,PHONE_MAX_PR=3,PHONE_TEX_MAX=1,PHONE_MSAA_MAX=4,PHONE_EXTRA_PR=2.25;
31:   // r96: on a phone a 3D screen's own Auto level (per screen, after a Device check) stops at Extra: the phone memory budget
32:   // measures every screen at High and Extra (tests/browser/phone-memory-budget.cjs); Ultra there is over 300 MB.
33:   const PHONE_SCENE_TOP=3;
34:   // "Never crash" first (Nik 2026-11-08): a lost context, an out-of-memory error, or (8K) a buffer or target the GPU would
35:   // not give drops this device one level below the one that failed and remembers it (any level, Auto or picked) until the
36:   // player picks a level again in Settings.
37:   const CAP_KEY="careerModeShowdown.gfxCap.v1";
38:   // r93 (Nik's iPhone 17, 2026-11-15): every cap, and every opening mark, carries the build that wrote it. A cap from an older
39:   // build is dropped on load: the update may have fixed what failed (2.4.0 closed the tab at High; 2.5.0 fixed its memory, yet
40:   // 2.4.0's cap kept the Device check off High for 7 days). The level gets one fresh try per build: if it fails again, this
41:   // build writes its own cap, kept as before. BUILD is the service worker's RUNTIME_REVISION (the release bump moves both).
42:   const BUILD="2.10.0-r97";
43:   const MEMORY_KEY=key=>`careerModeShowdown.gfxSettled.v1.${key}`;
44:   // r91: where a scene's heavy parts settled (its detail step, for the level it was built at), read on its next visit.
45:   const DETAIL_KEY=key=>`careerModeShowdown.gfxDetail.v1.${key}`,DETAIL_DAYS_MS=7*864e5;
46:   // The Device check (device-check.html) saves the best level this device held at 60 fps; Auto starts there.
47:   // r91: a new key. A 2.3.0 result (…gfxMeasured.v1) came from a check that timed two scenes and could save a level one of
48:   // them never drew, so it is not read; Auto goes back to its guess until the check is run again.
49:   const MEASURED_KEY="careerModeShowdown.gfxMeasured.v2";
50:   // r96 per screen: the Device check also saves each 3D screen's own best level in the same record (scenes:{key:level});
51:   // `level` stays the lowest of them, so a 2.8.0 copy of this file reads the record as before. A record without a screen's
52:   // own level (a 2.8.0 check, or a screen it did not time) gives that screen the record's level: an old result still
53:   // applies to every screen. Keys are the scenes' governor keys.
54:   const SCENE_KEYS=["chamber-men","rrr","sp","club-draw"];
55:   // ?bench=1 (Device check frames): no adapting. Frame times are recorded after BENCH_SETTLE_MS for at least BENCH_MS and until
56:   // the scene has played one whole beat (a kick, a turn, a reveal: one gov.hold(true) .. gov.hold(false)); a scene that has not
57:   // finished one by BENCH_MAX_MS posts what it has, marked incomplete. Posted once.
58:   const BENCH_SETTLE_MS=500,BENCH_MS=10000,BENCH_MAX_MS=60000;
59:   let cached=null,active=null;
60: 
61:   // Saved through the app's own storage helpers (js/storage.js); the roulette page is a same-origin frame and uses its parent's.
62:   function gfxStore(name){
63:     if(typeof root[name]==="function")return root[name];
64:     try{if(root.parent&&root.parent!==root&&typeof root.parent[name]==="function")return root.parent[name];}catch(_error){}
65:     return null;
66:   }
67:   function gfxRead(k){try{const f=gfxStore("readStorageValue");return f?f(k):null;}catch(_error){return null;}}
68:   function gfxWrite(k,v){try{gfxStore("writeStorageValue")?.(k,String(v));}catch(_error){}}
69:   function gfxQuery(name){
70:     const get=w=>{try{return new URLSearchParams(w.location.search).get(name);}catch(_error){return null;}};
71:     const own=get(root);if(own!==null)return own;
72:     try{if(root.parent&&root.parent!==root)return get(root.parent);}catch(_error){}
73:     return null;
74:   }
75:   function gfxChoice(){const c=String(gfxRead(KEY)||"auto").toLowerCase();return CHOICES.includes(c)?c:"auto";}
76:   // A picked choice is its level: light 0 .. ultra 4, 8k 5.
77:   function gfxChoiceLevel(c){return CHOICES.indexOf(c)-1;}
78:   // r92 (Nik 2026-11-14, iPhone 17): a 2.4.0 check where even Light was not smooth saved Light "not held", and that
79:   // replaced a High guess for good. A stall at Light says nothing about which level the device can hold (there is no level
80:   // below), so such a result is not read: Auto goes back to its guess. A check never saves one now (device-check.html).
81:   // r92 (Nik 2026-11-14, "Go" on the simple plan): the check only ever raises Auto. Auto is the higher of the check's
82:   // result and the level the graphics chip starts at, so a result below the chip's level (one saved by 2.4.0) is not read.
83:   function gfxMeasured(){
84:     try{const m=JSON.parse(gfxRead(MEASURED_KEY)||"null");if(!(m&&Number.isInteger(m.level)&&m.level>=0&&m.level<=5&&!(m.detail&&m.detail.held===false)))return null;
85:       return m.level>=gfxChipLevel()?m:null;}catch(_error){return null;}
86:   }
87:   // The level the Device check passed on one screen: its own, never below the record's level (which is the lowest of them).
88:   function gfxSceneMeasured(m,scene){
89:     if(!m)return null;const v=m.scenes&&typeof m.scenes==="object"?m.scenes[scene]:undefined;
90:     return Number.isInteger(v)&&v>=m.level&&v<=5?v:m.level;
91:   }
92:   // The level Auto starts at from the graphics chip and the device (memory, threads, phone): the check's floor.
93:   function gfxChipLevel(){try{return gfxClassify(gfxGpuInfo().name,gfxScreenEnv()).level;}catch(_error){return 0;}}
94: 
95:   // The GPU's own name and its largest buffer and texture, from a throwaway context (released at once). r90 MOTION round 2:
96:   // the first WebGL context of a page starts the GPU side (735-887 ms on a Chromebook, one long task), so the answer is kept
97:   // per browser (same user agent) and later opens read it back; Auto picks exactly what a fresh probe would.
98:   const GPU_KEY="careerModeShowdown.gfxGpu.v1";
99:   function gfxGpuInfo(){
100:     const ua=String(root.navigator?.userAgent||"");
101:     try{const k=JSON.parse(gfxRead(GPU_KEY)||"null");if(k&&k.ua===ua&&typeof k.name==="string")return {name:k.name,maxBuffer:Number(k.maxBuffer)||0,maxTexture:Number(k.maxTexture)||0};}catch(_error){}
102:     try{
103:       const c=root.document.createElement("canvas"),gl=c.getContext("webgl2")||c.getContext("webgl");if(!gl)return {name:"",maxBuffer:0,maxTexture:0};
104:       const ext=gl.getExtension("WEBGL_debug_renderer_info");
105:       const name=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||"");
106:       const maxBuffer=Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))||0,maxTexture=Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||0;
107:       gl.getExtension("WEBGL_lose_context")?.loseContext();
108:       gfxWrite(GPU_KEY,JSON.stringify({ua,name,maxBuffer,maxTexture}));
109:       return {name,maxBuffer,maxTexture};
110:     }catch(_error){return {name:"",maxBuffer:0,maxTexture:0};}
111:   }
112:   // Auto level from the GPU name, then held down by a small memory or few cores. r90 (Nik 2026-11-07: an iPhone 17 runs
113:   // the best it can hold; only weak phones get Light): a phone is not capped by being a phone. A strong phone GPU (Apple GPU,
114:   // Adreno 7xx and up, Mali-G7xx / Immortalis) starts at High and calibrate moves it from there; older Mali, PowerVR and
115:   // Adreno 5xx and below start at Light.
116:   function gfxClassify(gpu,env){
117:     const g=String(gpu||"").toLowerCase(),e=env||{};
118:     const software=/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(g);
119:     const strongPhone=/apple gpu|adreno (\(tm\) )?([7-9]\d\d|\d{4})\b|immortalis|mali-g7\d\d/.test(g);
120:     let level=1;
121:     if(software)level=0;
122:     else if(strongPhone)level=2;
123:     // Mali-G76/G77/G78 and G610/G615 (2019-2022 flagships, two-digit or 6x0 names) start Balanced; calibrate can lift them.
124:     else if(/mali-g7[6-9]\b|mali-g6[1-9]\d\b/.test(g))level=1;
125:     else if(/mali|powervr|adreno \(tm\) [1-5]\d\d\b|adreno [1-5]\d\d\b|intel.*\b(hd|uhd) graphics( [2-6]\d\d)?\b|apple a(9|1[0-2])\b/.test(g))level=0;
126:     else if(/rtx [2-9]0[6-9]0|rtx [4-9]0\d0|radeon rx [6-9]\d{3}|apple m[1-9] (pro|max|ultra)/.test(g))level=3;
127:     else if(/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|apple m[1-9]|apple gpu/.test(g))level=2;
128:     else if(/iris|adreno [6-9]\d\d|adreno \(tm\) [6-9]\d\d|radeon/.test(g))level=1;
129:     const mem=Number(e.deviceMemory)||0,cores=Number(e.cores)||0,phone=Boolean(e.phone);
130:     if(mem&&mem<=2)level=0;else if(mem&&mem<=4)level=Math.min(level,1);
131:     // Phones report few cores (or a capped count); on a phone the GPU name and calibrate decide.
132:     if(!phone&&cores&&cores<=4)level=Math.min(level,1);
133:     return {level,software,strongPhone};
134:   }
135:   function gfxScreenEnv(){
136:     const s=root.screen||{};
137:     return {dpr:Math.max(.5,Number(root.devicePixelRatio)||1),deviceMemory:root.navigator?.deviceMemory,cores:root.navigator?.hardwareConcurrency,
138:       phone:Math.min(s.width||1e4,s.height||1e4)<700};
139:   }
140:   // The largest a canvas can be on this page, in CSS pixels. A page with no size yet (a frame built before it is shown)
141:   // is taken to be as large as the screen, the most it can become; 0 only when neither is known.
142:   function gfxViewPx(){
143:     try{const w=Number(root.innerWidth)||0,h=Number(root.innerHeight)||0;if(w>0&&h>0)return w*h;
144:       const s=root.screen||{},sw=Number(s.width)||0,sh=Number(s.height)||0;return sw>0&&sh>0?sw*sh:0;}catch(_error){return 0;}
145:   }
146:   // 8K needs a GPU that can hold a 7680 px buffer and texture; never software GL, never a phone.
147:   function gfxCan8k(info,env){return Boolean(info&&!info.software&&!(env&&env.phone)&&info.maxBuffer>=7680&&info.maxTexture>=7680);}
148:   // r91 (Nik 2026-11-12, after the device lab found Settings offering Ultra and 8K on a 2-thread 4 GB Chromebook): on a weak
149:   // device, Ultra (4K) and 8K are offered only once the Device check has passed them there. Weak: 2 processor threads or
150:   // fewer, or 4 GB of memory or less, as the browser reports them (a browser that reports no memory is judged by its
151:   // threads). Every other device keeps the full list. A level the check passed is the measured level or one below it.
152:   function gfxWeak(env){
153:     const c=Number(env&&env.cores),m=Number(env&&env.deviceMemory);
154:     return (Number.isFinite(c)&&c>0&&c<=2)||(Number.isFinite(m)&&m>0&&m<=4);
155:   }
156:   // r91 (Nik 2026-11-12: "based on your graphic card, this is what we suggest, or based on your CPU ... so everyone can look
157:   // at that table and understand what is recommended for them"): the level guide, shown on the Device check page.
158:   // GUIDE says in plain words what gfxClassify above does, so the two change together
159:   // (tests/contracts/r91-level-guide-contracts.cjs runs named chips through gfxClassify against these rows).
160:   // who = the graphics chips that start at the level; draws = what the level draws. It promises no frame rate: only the
161:   // Device check measures one.
162:   const GUIDE=[
163:     {who:"Intel HD and UHD Graphics. Older phone chips: most Mali, PowerVR, Adreno 5xx and below, Apple A9 to A12. A device with no graphics chip.",
164:       draws:"The lightest picture: a dark room, a smaller crowd, no glow."},
165:     {who:"Intel Iris. Built-in AMD Radeon. Adreno 6xx. Mali-G76 to G78, G610 and G615. Any chip this table does not name.",
166:       draws:"Adds glow and a slightly larger crowd."},
167:     {who:"NVIDIA GeForce GTX and RTX. AMD Radeon RX and Radeon Pro. Apple M1 and later. Strong phones: iPhone and iPad, Adreno 7xx and up, Mali-G7xx, Immortalis.",
168:       draws:"A full crowd, sharper shadows and a first hint of the marble caf\u00e9."},
169:     {who:"NVIDIA RTX 2060 to 2090, 3060 to 3090, and every RTX 40 or later. AMD Radeon RX 6000 and later. Apple M Pro, Max and Ultra.",
170:       draws:"The whole marble caf\u00e9, and up to 3x sharpness on a sharp computer screen (2.25x on a phone)."},
171:     {who:"No chip starts here. The Device check gives it to a device that keeps all three 3D screens smooth at this level.",
172:       draws:"Draws past the screen\u2019s own sharpness, up to a 4K picture, with the sharpest shadows."},
173:     {who:"The same, on a graphics chip that can hold a 7680 px picture. Never a phone.",
174:       draws:"Draws up to an 8K picture."}
175:   ];
176:   // The two limits of gfxClassify in words (the contract runs them too).
177:   const GUIDE_LIMITS="Memory and processor can hold a device below its chip\u2019s row. 2 GB of memory or less starts at Light. 4 GB or less, or a computer with 4 processor threads or fewer, starts no higher than Balanced. Threads are not counted on a phone.";
178:   // A chip's name as a person reads it: "ANGLE (Intel, Vulkan 1.3.0 (Intel(R) UHD Graphics (JSL) (0x00004E55)), Mesa 25.0.7)"
179:   // is "Intel UHD Graphics (JSL)". Empty when the browser names none.
180:   function gfxChipName(raw){
181:     let s=String(raw||"").trim();
182:     const angle=s.match(/^ANGLE \((.*)\)$/);
183:     if(angle){const parts=angle[1].split(/,\s+/);s=parts[1]||parts[0]||"";}
184:     s=s.replace(/^ANGLE Metal Renderer:\s*/i,"").replace(/^Vulkan [\d.]+ \((.*)\)$/,"$1").replace(/\((r|tm|c)\)/ig," ")
185:       .replace(/\s*\(0x[0-9a-f]+\)/ig,"").replace(/\s+(Direct3D|OpenGL|D3D\d|Metal\b).*$/i,"").replace(/\/PCIe.*$/i,"").replace(/\s+/g," ").trim();
186:     return s.length>64?`${s.slice(0,63).trim()}\u2026`:s;
187:   }
188:   // What each part of this device says on its own. chip = the level its graphics chip starts at; memoryCap and threadCap =
189:   // the level memory and processor threads hold it to (null: no limit; threads are not counted on a phone). level = Auto's
190:   // starting level, the lowest of the three. measured = the level the Device check saved here (null before a check).
191:   // The one row marked mine is the measured level, or the starting level before a check.
192:   function gfxGuide(){
193:     const p=gfxProfile(),env=gfxScreenEnv(),phone=Boolean(env.phone),mem=Number(env.deviceMemory)||0,cores=Number(env.cores)||0;
194:     const chip=gfxClassify(p.gpu,{phone}).level,m=gfxMeasured(),mine=m?m.level:p.guessLevel;
195:     return {limits:GUIDE_LIMITS,rows:GUIDE.map((r,level)=>({level,label:LABELS[level],who:r.who,draws:r.draws,mine:level===mine})),
196:       device:{phone,software:Boolean(p.software),chipName:gfxChipName(p.gpu),chip,memory:mem||null,memoryCap:mem&&mem<=2?0:mem&&mem<=4?1:null,
197:         threads:cores||null,threadCap:!phone&&cores&&cores<=4?1:null,level:p.guessLevel,measured:m?m.level:null,weak:gfxWeak(env),can8k:Boolean(p.can8k)}};
198:   }
199:   // The highest level at or under `level` that may be picked by hand here (4 and 5 are the gated ones).
200:   function gfxPickable(level,env,can8k,measured){
201:     let l=level===5&&!can8k?4:level;
202:     if(l>=4&&gfxWeak(env)){const held=measured?measured.level:-1;l=Math.min(l,Math.max(3,held));}
203:     return l;
204:   }
205:   // The cap is not for ever (lead review on #1271): one stray driver reset must not cost a level for good. It expires after
206:   // 7 days, or after 3 clean scenes (20 s or more, no failure) at the capped level.
207:   const CAP_DAYS_MS=7*864e5,CAP_CLEAN=3,CAP_CLEAN_MS=20000;
208:   // r97 (Nik 2026-11-18, option A): a cap holds only the 3D screen that failed. A tab that closed, or a context that was lost,
209:   // on Russian Roulette keeps Roulette one level down; Chamber Men, the Ball Game and the Special Player keep their own level.
210:   // The cap is a list of holds {scene,level,reason,at,build,tab,from,bench,clean}, one per screen ("rrr", "sp", "chamber-men",
211:   // "club-draw"); a hold whose screen cannot be named (scene "") holds every screen, as every cap did before, and so does a
212:   // cap saved in the old one-object form without screens. Each hold ends on its own: 7 days, 3 clean scenes of its screen
213:   // at its level (not a closed tab's), the next build; a pick in Settings ends them all.
214:   // r98 (R98-01): the League Roulette is its own screen ("league"). Its entry comes first, so its name never falls into
215:   // Russian Roulette's /roulette/ below; every other name keeps the mapping it had.
216:   const CAP_SCENES=[[/^league(-roulette)?$/,"league"],[/roulette|^rrr$/,"rrr"],[/special-player|^sp$/,"sp"],[/chamber/,"chamber-men"],[/ball|club-draw/,"club-draw"]];
217:   function gfxCapScene(name){const n=String(name||"");for(const [re,k] of CAP_SCENES)if(re.test(n))return k;return "";}
218:   function gfxCapOk(e){return Boolean(e&&e.reason&&Number.isInteger(e.level)&&e.level>=0&&e.level<=4&&e.build===BUILD&&Date.now()-Number(e.at||0)<=CAP_DAYS_MS&&(e.clean|0)<CAP_CLEAN);}
219:   function gfxCapList(){
220:     let v=null;try{v=JSON.parse(gfxRead(CAP_KEY)||"null");}catch(_error){v=null;}if(!v)return [];
221:     let all;
222:     if(Array.isArray(v.caps))all=v.caps.filter(e=>e&&typeof e==="object").map(e=>({...e,scene:gfxCapScene(e.scene)}));
223:     else{// the one-object form (2.9.0 and #1553): its screens, or every screen when it names none
224:       const names=Array.isArray(v.scenes)&&v.scenes.length?v.scenes:v.tab&&v.scene?[v.scene]:[""];
225:       all=[...new Set(names.map(gfxCapScene))].map(scene=>({...v,scene,scenes:undefined}));}
226:     const ok=all.filter(gfxCapOk);
227:     if(ok.length!==all.length)gfxCapSave(ok);
228:     return ok;
229:   }
230:   function gfxCapSave(list){gfxWrite(CAP_KEY,list.length?JSON.stringify({caps:list}):"null");}
231:   // The hold on one screen: its own and any that holds every screen, the lowest level. No scene: the device's own level
232:   // (2D, Settings, a page with no 3D screen open), held only by holds on every screen.
233:   function gfxCap(scene){
234:     const key=gfxCapScene(scene),list=gfxCapList().filter(e=>e.scene===""||(key&&e.scene===key));if(!list.length)return null;
235:     const low=list.reduce((a,e)=>e.level<a.level?e:a);return {...low,scenes:list.map(e=>e.scene)};
236:   }
237:   // A new hold on one screen ("" every screen): never above the hold it already has.
238:   function gfxCapPut(scene,level,fields){
239:     const key=gfxCapScene(scene),list=gfxCapList(),old=list.find(e=>e.scene===key),rest=list.filter(e=>e!==old);
240:     const l=Math.max(0,Math.min(level,old?old.level:4));
241:     // (Codex on #1553) a hold that came from a closed tab stays one: a later context loss on the same screen keeps its stops.
242:     const tab=old&&old.tab&&!fields.tab?{tab:true,from:old.from,bench:Boolean(old.bench),tabReason:old.reason}:{};
243:     gfxCapSave(rest.concat({...fields,...tab,scene:key,level:l,at:Date.now(),build:BUILD}));cached=null;return l;
244:   }
245:   function gfxCapClean(level,scene){
246:     const key=gfxCapScene(scene),list=gfxCapList(),e=list.filter(x=>(x.scene===""||(key&&x.scene===key))&&x.level===level&&!x.tab)[0];if(!e)return;
247:     e.clean=(e.clean|0)+1;gfxCapSave(e.clean>=CAP_CLEAN?list.filter(x=>x!==e):list);if(e.clean>=CAP_CLEAN)cached=null;
248:   }
249:   // r91: a tab that dies while a 3D screen opens. A lost WebGL context is caught (gfxFail); a tab the browser kills for
250:   // memory, or one the player has to reload because it hung, is not: nothing runs, the level stays, and the next open dies
251:   // the same way (2.3.0: Roulette on the Chromebook, first open). So a scene leaves a mark while it opens and takes it
252:   // away once it is running (its first beat played, or 20 s of frames), when it ends, and when its page is hidden or left
253:   // (a reload, a closed tab and a removed frame all say goodbye first). A mark still there when the same tab loads the
254:   // game again was left by a page that died: the level that was opening is capped one down, like a GPU failure. That
255:   // cap does not lift after clean scenes (the level would only kill the tab again); it ends after 7 days, with a pick
256:   // in Settings, or (r93) with the next build. Only that one case counts: a mark from another tab proves nothing and is left to go stale. Where the
257:   // tab cannot be told apart (no sessionStorage, no page load time) there is no guard.
258:   // Chamber Men, on the game's own page, marks before it builds (sceneOpening): its heaviest moment is the load and the
259:   // texture upload, before any governor exists (review P3 on #1409). A mount that ends without a scene takes the mark off.
260:   // Known and accepted: the browser's "Duplicate tab" copies sessionStorage, so a duplicate made in the seconds a 3D
261:   // screen is opening reads as that tab reloaded after a death and caps one level. It only ever lowers, by one level,
262:   // for at most 7 days or until a pick in Settings.
263:   const OPEN_KEY="careerModeShowdown.gfxOpening.v1",TAB_KEY="careerModeShowdown.gfxTab.v1",OPEN_RUN_MS=20000,OPEN_STALE_MS=864e5;
264:   const TAB_CRASH="the tab closed while this 3D screen was opening";
265:   let opening=null,openedHere=false;
266:   const gfxFramed=()=>{try{return Boolean(root.parent&&root.parent!==root);}catch(_error){return false;}};
267:   // This tab (kept by the browser across a reload, and across a crash and reload) and this load of the game's page.
268:   function gfxTabId(){
269:     try{const ss=root.sessionStorage;if(!ss)return "";let id=ss.getItem(TAB_KEY);
270:       if(!id){id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;ss.setItem(TAB_KEY,id);id=ss.getItem(TAB_KEY);}return id||"";}catch(_error){return "";}
271:   }
272:   function gfxTopLoad(){
273:     let v;try{v=root.top&&root.top.performance&&root.top.performance.timeOrigin;}catch(_error){v=undefined;}
274:     if(typeof v!=="number"){try{v=gfxFramed()?undefined:root.performance&&root.performance.timeOrigin;}catch(_error){v=undefined;}}
275:     return typeof v==="number"&&v>0?String(v):"";
276:   }
277:   function gfxOpenList(){try{const v=JSON.parse(gfxRead(OPEN_KEY)||"[]");return Array.isArray(v)?v.filter(m=>m&&typeof m.id==="string"&&Number.isInteger(m.level)):[];}catch(_error){return [];}}
278:   // Read the marks: one this tab left on an earlier load is a death; stale ones go. Runs once, when the module loads
279:   // (before any profile is built, so the scene that is about to open already gets the lower level).
280:   function gfxOpenSweep(){
281:     const tab=gfxTabId(),top=gfxTopLoad();if(!tab||!top)return null;
282:     const all=gfxOpenList();if(!all.length)return null;
283:     const keep=[];let died=null;
284:     for(const m of all){
285:       if(!(Date.now()-Number(m.at||0)<=OPEN_STALE_MS)||m.build!==BUILD)continue;
286:       if(m.tab===tab&&m.top&&m.top!==top){if(!died||m.level<died.level)died=m;continue;}
287:       keep.push(m);
288:     }
289:     if(keep.length!==all.length)gfxWrite(OPEN_KEY,JSON.stringify(keep));
290:     if(!died)return null;
291:     // r97: the screen that was opening is held, the others keep their level.
292:     gfxCapPut(died.scene,died.level>=5?4:died.level-1,{reason:TAB_CRASH,tab:true,from:died.level,bench:Boolean(died.bench)});
293:     return died;
294:   }
295:   function gfxOpenArm(level,scene){
296:     if(opening||!(level>0))return;
297:     try{if(root.document&&root.document.visibilityState==="hidden")return;}catch(_error){}
298:     const tab=gfxTabId(),top=gfxTopLoad();if(!tab||!top)return;
299:     const id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
300:     opening={id,first:0};
301:     gfxWrite(OPEN_KEY,JSON.stringify(gfxOpenList().slice(-5).concat({id,tab,top,level,scene:String(scene||""),bench:gfxQuery("bench")==="1",at:Date.now(),build:BUILD})));
302:   }
303:   function gfxOpenDone(){
304:     if(!opening)return;const id=opening.id;opening=null;
305:     const all=gfxOpenList(),keep=all.filter(m=>m.id!==id);if(keep.length!==all.length)gfxWrite(OPEN_KEY,JSON.stringify(keep));
306:   }
307:   // A scene that has drawn for 20 s is open.
308:   function gfxOpenFrame(t){if(!opening)return;if(!opening.first)opening.first=t;else if(t-opening.first>=OPEN_RUN_MS)gfxOpenDone();}
309:   try{root.addEventListener?.("pagehide",gfxOpenDone);root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")gfxOpenDone();});}catch(_error){}
310:   // Downloads follow the connection as well as the device (Nik 2026-11-08): Save-Data, or a 2g/3g connection, loads one
311:   // size down; the drawing level stays.
312:   function gfxSlowNet(){
313:     try{const c=root.navigator&&root.navigator.connection;if(!c)return false;return Boolean(c.saveData)||/^(slow-2g|2g|3g)$/.test(String(c.effectiveType||""));}catch(_error){return false;}
314:   }
315:   function gfxBuild(level,base){
316:     let fellBack=null;
317:     if(level===5&&!base.can8k)level=4;
318:     // The Device check asks for one exact level and reports what was drawn; an older crash cap does not stand in for it (a
319:     // failure during the check writes the cap as always, and from then on this frame honours it and reports the failure).
320:     const cap=base.bench&&!benchFailed?null:gfxCap(base.scene);if(cap&&level>cap.level){fellBack={...cap,from:level};level=cap.level;}
321:     const L=LEVELS[level],dpr=base.dpr,phone=Boolean(base.phone);
322:     // Auto and the named levels stay at or under the screen's own ratio; ultra and 8K always reach it (a 4K or 8K screen
323:     // draws at native size) and may draw past it (2x, 4x) while the buffer stays within 3840x2160 (8K: 7680x4320; the
324:     // governor checks). A phone never draws past 3x its CSS size, nor past a 4K buffer (iOS memory).
325:     let max=level>=4?Math.max(dpr,(level===5?4:2)*dpr):Math.min(L.max,dpr);
326:     if(phone)max=Math.min(max,Math.max(1,Math.min(PHONE_MAX_PR,dpr)));
327:     // r92 phone memory budget (tests/browser/phone-memory-budget.cjs): at Extra a phone stops at 2.25x. At 3x Special
328:     // Player's targets took it to about 370 MB on the iPhone 17 profile, over the 300 MB a phone screen may use.
329:     if(phone&&level===3)max=Math.min(max,PHONE_EXTRA_PR);
330:     const min=Math.min(1,dpr,max),assetLevel=Math.max(0,Math.min(4,phone&&level<2?level-1:level)-(base.slowNet?1:0));
331:     // r91 (device lab, 2026-11-11): the buffer cap holds from the very first allocation. A scene sizes its first buffer from
332:     // pixelRatio before its governor exists, and 2.3.0 capped only in the governor: 8K picked on a 4K monitor first asked for
333:     // 15360x8640, on an 8K screen for 30720x17280; Ultra on a 4K monitor for 7680x4320. The starting
334:     // ratio is now what the governor would allow a canvas the size of the window: native at least, past it only within the
335:     // level's buffer (3840x2160; 8K: 7680x4320); a phone within 3840x2160 at any level. A page with no size yet counts as
336:     // large as the screen; with neither known the start is native.
337:     let start=Math.max(min,Math.min(level===5?max:level===4?Math.max(L.pr,dpr):L.pr,max));
338:     const view=gfxViewPx();
339:     if(view){
340:       if(level>=4)start=Math.min(start,Math.max(dpr,Math.sqrt((level===5?BUFFER_CAP_8K:BUFFER_CAP)/view)));
341:       if(phone)start=Math.min(start,Math.sqrt(BUFFER_CAP/view));
342:       start=Math.max(min,start);
343:     }
344:     // No size known at all (review on #1399): never past native until the governor has the canvas size.
345:     else start=Math.max(min,Math.min(start,dpr));
346:     // r92 memory proof (tests/browser/phone-memory-budget.cjs): ?gfx=N&gfxpr=top starts at the level's ceiling, the most the
347:     // governor may reach in play, so the memory measured is the most that level can hold (a phone within its 4K buffer).
348:     if(base.top)start=Math.max(start,Math.min(max,phone&&view?Math.sqrt(BUFFER_CAP/view):max));
349:     return {level,name:NAMES[level],choice:base.choice,gpu:base.gpu,software:base.software,dpr,phone,can8k:Boolean(base.can8k),fellBack,
350:       // Ultra starts at native at least (a 3x phone or 8K screen); 8K starts at its ceiling, which the governor holds to a
351:       // 7680x4320 buffer for the live canvas (a 1080p screen draws 4x). Past native always stays within the buffer cap.
352:       pixelRatio:start,maxPixelRatio:max,minPixelRatio:min,
353:       bufferCap:level===5?BUFFER_CAP_8K:BUFFER_CAP,
354:       // Textures and models by level; a phone below High loads one size down (iOS memory), and so does a slow or Save-Data
355:       // connection. 8K uses Ultra's assets. assetLevel is what screens download (the 2D plates too).
356:       // textureLevel is what the 3D scenes load. r92 (Nik's iPhone 17, 2026-11-14: the Safari tab closed while Chamber Men
357:       // was opening at High): on a phone it stops at PHONE_TEX_MAX, the phone file set. Chamber Men at High loaded about
358:       // 427 MB of textures on the iPhone profile (95 MB at Balanced) for a picture about 590x390 pixels, where the larger
359:       // files cannot be seen; iOS closes a tab well before the phone's memory is full.
360:       assetLevel,textureLevel:phone?Math.min(assetLevel,PHONE_TEX_MAX):assetLevel,slowNet:Boolean(base.slowNet),
361:       antialias:!base.software,shadowSize:L.shadowSize,density:L.density,bloom:L.bloom};
362:   }
363:   function gfxBaseProfile(){
364:     if(cached)return cached;
365:     const env=gfxScreenEnv(),info=gfxGpuInfo(),gpu=info.name,c=gfxChoice(),auto=gfxClassify(gpu,env);
366:     const can8k=gfxCan8k({...info,software:auto.software},env);
367:     const forced=gfxQuery("gfx"),forcedLevel=forced!==null&&/^[0-5]$/.test(forced)?Number(forced):null;
368:     const measured=gfxMeasured(),autoLevel=measured?measured.level:auto.level;
369:     let level=forcedLevel!==null?forcedLevel:c==="auto"?autoLevel:gfxChoiceLevel(c);
370:     // A pick saved before the gate (or on another day's result) that this device may not pick now draws the highest level
371:     // it may; the pick itself stays saved, and Settings says so. ?gfx=N (the Device check's frames) is never gated.
372:     let gated=null;
373:     if(forcedLevel===null&&c!=="auto"&&level>=4){
374:       // (8K picked where the GPU cannot hold it draws Ultra as it always did: that is gfxBuild's fallback, not the gate.)
375:       const want=level===5&&!can8k?4:level,ok=gfxPickable(level,env,can8k,measured);
376:       if(ok<want){gated=level;level=ok;}
377:     }
378:     const bench=forcedLevel!==null&&gfxQuery("bench")==="1",top=forcedLevel!==null&&gfxQuery("gfxpr")==="top";
379:     cached=gfxBuild(level,{dpr:env.dpr,gpu,software:auto.software,phone:env.phone,can8k,slowNet:gfxSlowNet(),choice:forcedLevel!==null?`gfx=${forcedLevel}`:c,bench,top});
380:     cached.auto=c==="auto"&&forcedLevel===null;cached.picked=c!=="auto"&&forcedLevel===null;cached.autoLevel=autoLevel;cached.measured=Boolean(measured);cached.guessLevel=auto.level;cached.strongPhone=Boolean(auto.strongPhone);
381:     // What was asked for by ?gfx=N (null otherwise): the Device check compares it with what was drawn.
382:     cached.asked=forcedLevel;
383:     // The level that was picked, where the gate drew a lower one (null otherwise).
384:     cached.gated=gated;
385:     gfxMarkRoot(cached.level,cached.assetLevel);
386:     return cached;
387:   }
388:   // r96 per screen. profile(scene) is the profile of one 3D screen (its governor key: "chamber-men", "club-draw", "rrr",
389:   // "sp"), for the files it loads ahead and the picture it builds. sceneOpening(scene) and the governor make it this page's
390:   // screen: from then on profile(), calibrate and the never-crash cap read that screen's profile, until its governor ends
391:   // (or its mount ends without one). A screen in its own frame (Roulette, the Special Player pack) is known by its page.
392:   // Only Auto with a Device check result differs by screen: a screen the check passed higher than the device's level draws
393:   // its own level (the crash cap still holds it). A pick, ?gfx=N and Auto before a check are one level for every screen.
394:   // The page's html[data-gfx] keeps the device's level: 2D screens never follow one 3D screen.
395:   let sceneKey="",sceneCached=null;
396:   const FRAME_SCENES=[[/(^|\/)roulette\/index\.html$/,"rrr"],[/(^|\/)special-player\/index\.html$/,"sp"]];
397:   function gfxSceneKey(){
398:     if(sceneKey)return sceneKey;if(!gfxFramed())return "";
399:     try{const path=String(root.location.pathname||"");for(const [re,k] of FRAME_SCENES)if(re.test(path))return k;}catch(_error){}
400:     return "";
401:   }
402:   // The level a screen draws on Auto from a Device check result: its own, never below the device's, on a phone at most Extra.
403:   // No result (cleared in another tab since the profile was cached): no screen of its own (review on #1548).
404:   function gfxSceneLevel(base,m,key){if(!m)return null;const lv=gfxSceneMeasured(m,key);return base.phone?Math.min(lv,Math.max(m.level,PHONE_SCENE_TOP)):lv;}
405:   function gfxProfile(scene){
406:     const base=gfxBaseProfile(),key=typeof scene==="string"&&scene?scene:gfxSceneKey();let p=base;
407:     if(key&&base.auto&&base.measured){
408:       // On a phone a screen's own level stops at Extra, the highest level the phone memory budget measures every screen at
409:       // (tests/browser/phone-memory-budget.cjs, 300 MB; at Ultra the iPhone profile's Chamber Men holds about 396 MB).
410:       const lv=gfxSceneLevel(base,gfxMeasured(),key);
411:       if(Number.isInteger(lv)&&lv>base.autoLevel){
412:         if(sceneCached&&sceneCached.base===base&&sceneCached.key===key)p=sceneCached.p;
413:         else{
414:           p=gfxBuild(lv,{dpr:base.dpr,gpu:base.gpu,software:base.software,phone:base.phone,can8k:base.can8k,slowNet:base.slowNet,choice:base.choice,scene:key});
415:           p.auto=true;p.picked=false;p.autoLevel=lv;p.measured=true;p.guessLevel=base.guessLevel;p.strongPhone=base.strongPhone;p.asked=null;p.gated=null;
416:           p.deviceLevel=base.autoLevel;
417:           sceneCached={base,key,p};
418:         }
419:       }
420:     }
421:     // r97: a hold on this screen alone (a closed tab or a lost context here) draws this screen lower; the device's level and
422:     // the other screens stay. (The Device check's ?bench=1 frames draw the level they ask for, as before.)
423:     if(key&&p===base&&!(gfxBenchFrame()&&!benchFailed)){const held=gfxCap(key),want=base.fellBack?base.fellBack.from:base.level;
424:       if(held&&held.level<base.level){
425:         if(sceneCached&&sceneCached.base===base&&sceneCached.key===key&&sceneCached.held===held.level)p=sceneCached.p;
426:         else{
427:           p=gfxBuild(want,{dpr:base.dpr,gpu:base.gpu,software:base.software,phone:base.phone,can8k:base.can8k,slowNet:base.slowNet,choice:base.choice,scene:key});
428:           p.auto=base.auto;p.picked=base.picked;p.autoLevel=base.autoLevel;p.measured=base.measured;p.guessLevel=base.guessLevel;p.strongPhone=base.strongPhone;p.asked=base.asked;p.gated=base.gated;
429:           p.deviceLevel=base.level;
430:           sceneCached={base,key,p,held:held.level};
431:         }
432:       }}
433:     // A 3D screen in its own frame (Roulette, the pack, the Device check's frames) is opening from here on, at its own level.
434:     if(!openedHere&&gfxFramed()){openedHere=true;gfxOpenArm(p.level,gfxSceneName());}
435:     return p;
436:   }
437:   // A Device check frame (?gfx=N&bench=1) measures the level it asks for; a hold does not stand in for it (see gfxBuild).
438:   function gfxBenchFrame(){const f=gfxQuery("gfx");return f!==null&&/^[0-5]$/.test(f)&&gfxQuery("bench")==="1";}
439:   function gfxSceneName(){try{return String(root.location.pathname||"").split("/").filter(Boolean).slice(-2).join("/");}catch(_error){return "";}}
440:   // r90 (Nik 2026-11-08, "the best quality it can hold, on every screen"): the resolved level on the root element as
441:   // html[data-gfx="0".."5"], here and on the app page around the roulette frame, so 2D screens (marble plates, blurs,
442:   // shadows, CSS animations) can lighten heavy effects at Light. Set when the module loads and whenever the level changes
443:   // (calibrate, a new pick, a Device check result, an 8K fallback).
444:   // html[data-assets="0".."4"] is the download size (image pickers follow it).
445:   function gfxMarkRoot(level,assets,ownOnly){
446:     const v=String(level),a=assets===undefined?null:String(assets);
447:     for(const w of ownOnly?[root]:[root,gfxParent()]){try{const el=w&&w.document&&w.document.documentElement;if(!el||!el.dataset)continue;
448:       if(el.dataset.gfx!==v)el.dataset.gfx=v;if(a!==null&&el.dataset.assets!==a)el.dataset.assets=a;}catch(_error){}}
449:     // Settings listens for this and reads the saved state again (a crash cap or a Device check result moves Auto).
450:     if(v!==lastMark){lastMark=v;try{root.dispatchEvent?.(new root.CustomEvent("cms-gfx-level",{detail:{level}}));}catch(_error){}}
451:   }
452:   let lastMark=null;
453:   function gfxParent(){try{return root.parent&&root.parent!==root&&root.parent.document?root.parent:null;}catch(_error){return null;}}
454:   function gfxRemark(){try{const p=gfxBaseProfile();gfxMarkRoot(p.level,p.assetLevel);}catch(_error){}}
455:   // r97 (review on #1555): the device's profile is built with the device's holds only; a hold on this screen alone is laid
456:   // over it by gfxProfile, so calibrating a held screen never moves the other screens.
457:   function gfxSetLevel(level,ownOnly){const p=gfxProfile();const next=gfxBuild(Math.max(0,Math.min(4,level)),{dpr:p.dpr,gpu:p.gpu,software:p.software,phone:p.phone,can8k:p.can8k,slowNet:p.slowNet,choice:p.choice,scene:""});
458:     next.auto=p.auto;next.picked=p.picked;next.autoLevel=p.autoLevel;next.measured=p.measured;next.guessLevel=p.guessLevel;next.strongPhone=p.strongPhone;cached=next;
459:     const here=gfxProfile();gfxMarkRoot(here.level,here.assetLevel,ownOnly);return here;}
460:   // The device could not hold this level (a lost context, an out-of-memory error, an 8K buffer or target refused): one
461:   // level down, remembered, the live governor moved at once. Scenes call gov.end() before forceContextLoss() on dispose,
462:   // so their own clean-up never counts; neither does a context lost while the page is hidden (the browser reclaiming it).
463:   let failCount=0,benchFailed="";
464:   function gfxFail(reason){
465:     if(root.document&&root.document.visibilityState==="hidden")return gfxProfile();
466:     failCount+=1;
467:     // The level that failed is the one this screen draws (r96: its own level on Auto after a Device check).
468:     // r97: the screen that failed is held one level down (its own hold, see gfxCapPut); a page with no screen named holds all.
469:     const cur=gfxProfile().level;
470:     gfxCapPut(gfxSceneKey(),cur>=5?4:cur-1,{reason:String(reason||"failed")});benchFailed=String(reason||"failed");
471:     try{active?.sync();}catch(_error){}
472:     const b=gfxBaseProfile();gfxMarkRoot(b.level,b.assetLevel);return gfxProfile();
473:   }
474:   // MSAA for a render target: the highest sample count at or under the wish that the GPU supports for both the colour format
475:   // (RGBA16F with hdr, else RGBA8) and DEPTH_COMPONENT24 (W3's fix on #1265; MAX_SAMPLES alone is not enough). Without the
476:   // query: 4, then 0.
477:   const sampleLists=new WeakMap();
478:   // r92: a phone never asks for more than PHONE_MSAA_MAX (4) samples. At Extra an 8-sample half-float target with its depth
479:   // buffer is about twice the memory of a 4-sample one (Special Player on an iPhone: ~146 MB of targets against ~78 MB),
480:   // and iOS closes a tab long before the phone's memory is full.
481:   function gfxSamples(renderer,want,hdr){
482:     let w=Math.max(0,Math.floor(Number(want)||0));if(!w)return 0;
483:     try{if(gfxProfile().phone)w=Math.min(w,PHONE_MSAA_MAX);}catch(_error){}
484:     let byFormat=sampleLists.get(renderer);if(!byFormat){byFormat={};try{sampleLists.set(renderer,byFormat);}catch(_error){}}
485:     const k=hdr?"hdr":"ldr";
486:     if(!(k in byFormat)){
487:       try{const gl=renderer.getContext(),q=f=>Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,f,gl.SAMPLES)||[]);
488:         const c=q(hdr?gl.RGBA16F:gl.RGBA8),d=q(gl.DEPTH_COMPONENT24),both=c.filter(n=>d.includes(n)).sort((a,b)=>b-a);byFormat[k]=both.length?both:null;}
489:       catch(_error){byFormat[k]=null;}
490:     }
491:     const list=byFormat[k]||[4];
492:     // Never more than asked: a GPU that lists only bigger counts gets none.
493:     return list.find(n=>n<=w)??0;
494:   }
495:   // After a target is (re)made: bind it once; an incomplete framebuffer steps its samples 8+ -> 4 -> 0. Returns whether it is
496:   // complete. On 8K, a target that is incomplete even without MSAA sends the device back to Ultra.
497:   function gfxCheckTarget(renderer,target){
498:     let ok=false;
499:     try{const gl=renderer.getContext();
500:       for(let k=0;k<3;k+=1){
501:         try{renderer.setRenderTarget(target);ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;}catch(_error){ok=false;}
502:         renderer.setRenderTarget(null);
503:         if(ok||!target.samples)break;
504:         target.samples=target.samples>4?4:0;target.dispose();
505:       }
506:     }catch(_error){ok=false;}
507:     if(!ok&&cached&&gfxProfile().level===5)gfxFail("a render target the GPU would not complete");
508:     return ok;
509:   }
510: 
511:   function gfxNow(){return root.performance?.now?.()??Date.now();}
512:   // One frame drawn and waited for: a 1 px read makes the GPU finish, so the time is the real cost of the frame.
513:   const oomSeen=new WeakSet();
514:   function gfxTimedDraw(renderer,draw){
515:     const gl=renderer.getContext(),px=new Uint8Array(4);
516:     const t=gfxNow();draw();try{gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}catch(_error){}
517:     const ms=gfxNow()-t;
518:     // Out of GPU memory while drawing this level: never crash, one level down (once per renderer, so one bad moment is
519:     // one step, not a slide to Light).
520:     try{if(gl.OUT_OF_MEMORY&&!oomSeen.has(renderer)&&gl.getError()===gl.OUT_OF_MEMORY){oomSeen.add(renderer);gfxFail("the GPU ran out of memory");}}catch(_error){}
521:     return ms;
522:   }
523:   // Behind the loading screen: a few timed frames (the first ones also compile every shader). On auto, a level whose
524:   // frames cost more than ~80% of a 60 Hz frame steps down one; one under a quarter of it steps up one (never past what the
525:   // GPU name allows plus one, never to ultra). Returns the profile the scene should use.
526:   // r91 (Sol 6.1 review of 2.3.0: "a warm-up tier change can leave the original render costs in place"). The scene in front
527:   // of these frames is already built, so the move is for what comes next and for this scene's pixel ratio. What is true of
528:   // the scene in front is kept apart:
529:   //   - builtLevel(renderer) and the governor's level() stay the level the scene was built at;
530:   //   - a move down also starts the governor one step down the scene's heavy parts (its detail ladder), so the costs that
531:   //     were built do come down; at Light, where there is no level below, that step is the whole answer;
532:   //   - a level found slow on this page is not tried again on it (no Light, Balanced, Light from season to season);
533:   //   - a scene in a frame marks its own page only: the game page's html[data-gfx] follows the game page's own level.
534:   const builtBy=new WeakMap(),calBad=new Set();
535:   function gfxBuiltLevel(renderer){
536:     try{if(renderer&&builtBy.has(renderer))return builtBy.get(renderer);const level=gfxProfile().level;if(renderer)builtBy.set(renderer,level);return level;}catch(_error){return gfxProfile().level;}
537:   }
538:   async function gfxCalibrate(renderer,draw,opts){
539:     const p=gfxProfile(),frames=Math.max(3,(opts&&opts.frames)||5);
540:     // Software GL is already the lightest level and never goes up: no timed frames to wait for.
541:     if(!renderer||typeof draw!=="function"||p.software)return p;
542:     // A level the Device check measured on this device is not second-guessed by five frames.
543:     if(p.auto&&p.measured)return p;
544:     gfxBuiltLevel(renderer);
545:     const times=[];
546:     for(let i=0;i<frames;i+=1){times.push(gfxTimedDraw(renderer,draw));if(i<frames-1)await new Promise(r=>root.setTimeout(r,0));}
547:     const settle=times.slice(2).sort((a,b)=>a-b),ms=settle[Math.floor(settle.length/2)]??times[times.length-1];
548:     p.calibratedMs=+ms.toFixed(2);p.calSlow=false;
549:     if(!p.auto)return p;
550:     // r97 (Nik's option A; review on #1559): a screen held below the device draws its hold. Five frames on it say nothing
551:     // about the device's level or the other screens, so neither moves; the hold ends as it always does (gfxCapClean).
552:     // A frame of its own (the pack, Roulette) marks its own page with what it draws, as a calibration there always has.
553:     if(p.deviceLevel!==undefined&&p!==gfxBaseProfile()){if(gfxFramed())gfxMarkRoot(p.level,p.assetLevel,true);return p;}
554:     let level=p.level;const slow=ms>BUDGET_MS*.8;
555:     if(slow){calBad.add(level);if(level>0)level-=1;}
556:     else if(ms<BUDGET_MS*.25&&level<Math.min(3,p.autoLevel+1)&&!calBad.has(level+1))level+=1;
557:     if(level===p.level&&!slow)return p;
558:     const next=level===p.level?p:gfxSetLevel(level,true);next.calibratedMs=p.calibratedMs;next.calSlow=slow;
559:     renderer.setPixelRatio(next.pixelRatio);
560:     if(active&&active.renderer===renderer)active.sync();
561:     return next;
562:   }
563: 
564:   // The pixel-ratio steps between the profile's floor and ceiling, a quarter apart, highest first.
565:   function gfxSteps(p,cap){
566:     const hi=Math.min(p.maxPixelRatio,cap),out=[];
567:     for(let v=hi;v>p.minPixelRatio+.01;v-=.25)out.push(+v.toFixed(2));
568:     out.push(p.minPixelRatio);
569:     return [...new Set(out)];
570:   }
571:   // r91 governor (Sol 6.1 review of 2.3.0; Nik 2026-11-11: "heavy parts like crowd, shadows and glow are fixed when the
572:   // scene loads, so a slow device keeps paying for them"). One ladder per scene, walked by this governor only:
573:   //   pixel ratio, a quarter at a time, down to the level's floor; then the scene's own heavy parts ("detail" steps).
574:   // A scene offers its heavy parts as  detail:{steps:N, apply(step,why)}  (0 = as built, N = its lightest): apply() is the
575:   // only place those knobs move, and it is called at the start (the step remembered from the last visit, behind the loading
576:   // screen) and afterwards only between beats, never while the scene holds (a kick, a spin, a reveal).
577:   // A scene that can fade one picture into the next gives  before()  : it is called once ahead of every change in play
578:   // (pixel ratio or heavy parts, down, up or put back), while the old picture is still the one drawn.
579:   // What changed from 2.3.0:
580:   //   - Slow frames seen during a beat are kept: the step is taken when the beat ends. (2.3.0 threw them away at
581:   //     hold(false), so a scene that was only slow in action never stepped down, and Roulette holds for its whole turn.)
582:   //   - Slow frames still step down whatever the cause, as in 2.3.0. But steps taken while the scene does not look like the
583:   //     cost (an idle frame callback, a cheap timed draw) must buy frame time: two that buy nothing are undone, and the
584:   //     screen's own pace (a 30 fps power mode, a 50 Hz screen) is what slow is judged against from there on. Steps up
585:   //     keep the absolute bar (frames under 17.6 ms), as in 2.3.0.
586:   //   - A step back up needs a smooth beat first when this visit started low or a beat ran slow, so it never see-saws
587:   //     between a calm table and a busy shot.
588:   const SLOW_MS=20.5,SMOOTH_MS=17.6,BEAT_SLOW_MS=700;
589:   function gfxDetailRead(key,level,steps){
590:     try{const v=JSON.parse(gfxRead(DETAIL_KEY(key))||"null");if(!v||v.level!==level||!Number.isInteger(v.at))return {at:0,floor:0};
591:       const fresh=Date.now()-Number(v.t||0)<=DETAIL_DAYS_MS;
592:       return {at:Math.max(0,Math.min(steps,v.at)),floor:fresh&&Number.isInteger(v.floor)?Math.max(0,Math.min(steps,v.floor)):0};}catch(_error){return {at:0,floor:0};}
593:   }
594:   // r96: where a picked level settled on a screen, for the level it was picked at (another pick starts as built).
595:   function gfxPickRatio(k,level){try{const v=JSON.parse(gfxRead(MEMORY_KEY(k))||"null");return v&&v.level===level&&Number.isFinite(v.pr)?Number(v.pr):NaN;}catch(_error){return NaN;}}
596:   function gfxGovernor(renderer,opts){
597:     // The scene's key names the screen (r96: on Auto after a Device check, each screen draws its own level).
598:     const o=opts||{},key=o.key?String(o.key):"";if(key)sceneKey=key;let p=gfxProfile();
599:     // The level this scene was built at (calibrate may since have moved the level for what comes next).
600:     const built=gfxBuiltLevel(renderer);
601:     // A 3D screen on the game's own page (Chamber Men) is opening from here on; a framed one marked itself already.
602:     if(!gfxFramed())gfxOpenArm(built,key);
603:     const size=()=>{const c=renderer.domElement;return {w:c?.clientWidth||0,h:c?.clientHeight||0};};
604:     // Ultra's buffer cap comes from the live canvas size.
605:     const capOf=()=>{const s=size();if(!s.w||!s.h)return p.picked&&!p.auto?Math.max(p.minPixelRatio,Math.min(p.maxPixelRatio,p.pixelRatio)):p.maxPixelRatio;
606:       let cap=p.level>=4?Math.max(p.dpr,Math.sqrt(p.bufferCap/(s.w*s.h))):p.maxPixelRatio;
607:       if(p.phone)cap=Math.min(cap,Math.sqrt(BUFFER_CAP/(s.w*s.h)));
608:       // r96: a pick's ceiling is the picture it draws as picked (its starting ratio): the steps come back up to it, never past.
609:       if(p.picked&&!p.auto)cap=Math.min(cap,p.pixelRatio);
610:       return Math.max(p.minPixelRatio,cap);};
611:     let list=gfxSteps(p,capOf());
612:     const nearest=v=>{let i=0,d=1e9;list.forEach((x,k)=>{const e=Math.abs(x-v);if(e<d){d=e;i=k;}});return i;};
613:     let at=nearest(p.pixelRatio);
614:     // A level that ran slow last time on this screen is where the next visit starts.
615:     // r96: a picked level keeps its own memory, beside Auto's (key.pick: the ratio with the level it was for, and the heavy
616:     // parts with theirs), so moving between Auto and a pick never starts one from where the other settled.
617:     const pickKey=key?`${key}.pick`:"",picked=()=>Boolean(p.picked)&&!p.auto;
618:     const settled=key?(picked()?gfxPickRatio(pickKey,built):Number(gfxRead(MEMORY_KEY(key)))):NaN;
619:     const bench=gfxQuery("bench")==="1"?gfxBench(renderer,o.draw,key,()=>p,()=>list[at],o.info):null;
620:     // The scene's heavy parts: detail step 0 (as built) .. steps (lightest). Auto and (r96) a picked level walk them; ?gfx=N
621:     // and the Device check draw the level as built.
622:     const detail=o.detail&&Number.isInteger(o.detail.steps)&&o.detail.steps>0&&typeof o.detail.apply==="function"?o.detail:null;
623:     const adapts=()=>Boolean(p.auto||p.picked)&&!bench;
624:     const memKey=()=>picked()?pickKey:key;
625:     let dAt=0,dFloor=0,fromMemory=false;
626:     if(adapts()&&Number.isFinite(settled)&&settled>0){const i=nearest(settled);if(i>at){at=i;fromMemory=true;}}
627:     if(detail&&key&&adapts()){const m=gfxDetailRead(memKey(),built,detail.steps);dAt=Math.max(m.at,m.floor);dFloor=m.floor;if(dAt>0)fromMemory=true;}
628:     const bad=new Set(),badD=new Set(),born=gfxNow(),fails0=failCount;
629:     let held=false,last=0,avg=BUDGET_MS,slowFor=0,smoothFor=0,ended=false;
630:     // beat: the frames of the hold under way. due: a step down owed since a beat ran slow. upOk: a step up is allowed.
631:     // pace: the frame time this screen runs at when the scene is not the cost (a 50 Hz screen, a 30 fps power mode).
632:     // due: 1 = owed now, 2 = owed unless the calm scene turns out as slow as the beat (then the pace check decides).
633:     // usesBeats: the scene plays in beats (it says so with beats:true, or it has held once). Such a scene that starts low
634:     // from memory steps up only after a beat ran smooth; one without beats steps up as it always did.
635:     let usesBeats=Boolean(o.beats);
636:     let beat=null,due=0,upOk=!(usesBeats&&fromMemory),calmFor=0,idleFor=0,pace=0,busy=0,busyKnown=false,timing=false,trial=-1;
637:     // slowN: frames in the slow second under way. probe: steps being tried while the scene does not look like the cost.
638:     let slowN=0,probe=null,probed=false;
639:     // r96 (Nik 2026-11-17: "step down when slow, back up"): a step that ran slow is not lost for the whole visit. Once the
640:     // screen has run smooth for a while (three smooth beats in a row; 10 s, or 15 s for heavy parts, where there are no
641:     // beats) and a timed frame shows room, it is tried once more. Slow again, it stays off until the next visit: at most one
642:     // retry per step, so the picture never see-saws.
643:     const retried=new Set(),retriedD=new Set();let smoothBeats=0;
644:     const ripe=(isBad,wasRetried,quietMs)=>!isBad||(!wasRetried&&(usesBeats?smoothBeats>=3:smoothFor>=quietMs));
645:     const lost=()=>{if(!ended)gfxFail("the GPU dropped the picture (context lost)");};
646:     try{renderer.domElement?.addEventListener?.("webglcontextlost",lost);}catch(_error){}
647:     const apply=i=>{at=i;try{renderer.setPixelRatio(list[at]);}catch(_error){}
648:       // 8K: a browser that quietly gives a smaller drawing buffer than asked (its own limit) means 8K cannot hold here.
649:       if(p.level===5){try{const gl=renderer.getContext(),c=renderer.domElement,s=size();
650:         if(gl&&c&&s.w&&gl.drawingBufferWidth&&c.width&&gl.drawingBufferWidth<c.width-2){gfxFail("the browser capped the 8K buffer");return;}}catch(_error){}}
651:       try{o.onChange?.({...p,pixelRatio:list[at]});}catch(_error){}};
652:     const setDetail=(i,why)=>{dAt=i;try{detail.apply(dAt,why);}catch(_error){}};
653:     const forget=()=>{slowFor=0;slowN=0;smoothFor=0;calmFor=0;due=0;avg=pace||BUDGET_MS;};
654:     // Only the slow test follows the pace. Smooth keeps 2.3.0's absolute bar (17.6 ms): a screen that runs at 30 or 50 fps
655:     // never steps up, so a phone in a power-saving mode does not climb above where it began (review on #1398).
656:     const slowLimit=()=>pace?Math.max(SLOW_MS,pace*1.25):SLOW_MS,smoothLimit=()=>SMOOTH_MS;
657:     // One step down the ladder: pixel ratio first, then the heavy parts. The step left is never tried again in this visit;
658:     // a heavy part that was put back and ran slow stays off for a week of visits.
659:     // before: the scene's last word ahead of a change in play (a step down, a step up, steps put back), so it can let the
660:     // picture on screen fade into the next one. Never called for the start (behind the loading screen) or a resize.
661:     const before=()=>{try{o.before?.();}catch(_error){}};
662:     // blind: taken while neither the callback nor a timed draw showed the cost (see slowStep). A timed frame cannot tell
663:     // whether such a step would fit again, so it is not retried this visit (r96).
664:     const stepDown=(why,blind)=>{
665:       if(at<list.length-1){before();bad.add(at);if(blind)retried.add(at);apply(at+1);}
666:       else if(detail&&dAt<detail.steps){before();badD.add(dAt);if(blind)retriedD.add(dAt);if(trial===dAt)dFloor=Math.max(dFloor,dAt+1);trial=-1;setDetail(dAt+1,why||"slow");}
667:       else return false;
668:       forget();upOk=false;smoothBeats=0;return true;
669:     };
670:     // Is the scene the cost? Its frame callback keeps the main thread busy, or one timed draw (which waits for the GPU) is
671:     // dear. Where the callback cannot be timed, or there is no draw to time, there is no telling: slow frames count as
672:     // they always did.
673:     const loaded=()=>{
674:       if(!busyKnown||busy>BUDGET_MS*.45||typeof o.draw!=="function")return true;
675:       let ms=0;try{ms=gfxTimedDraw(renderer,o.draw);}catch(_error){return true;}
676:       return ms>BUDGET_MS*.5;
677:     };
678:     // Slow for a second. 2.3.0 stepped down whatever the cause, and that stays (review on #1398): a weak GPU's cost of
679:     // putting the canvas on the page shows neither in the frame callback nor in a timed draw, and a real Chromebook cannot
680:     // be timed from a test machine. What is new: steps taken while the scene does not look like the cost have to buy frame
681:     // time. Two of them (or the ladder's end) that leave the frames within 10% of where they began are undone, and that
682:     // frame time is taken as the pace this screen runs at (a 30 fps power mode, a 50 Hz screen): slow is judged against
683:     // it from there on (smooth is not: see smoothLimit). One such probe a visit.
684:     const paceHere=ms=>{pace=Math.max(BUDGET_MS,Math.min(50,ms));slowFor=0;slowN=0;smoothFor=0;};
685:     const undo=ms=>{const b=probe;probe=null;probed=true;
686:       for(let i=b.at;i<at;i+=1){bad.delete(i);retried.delete(i);}for(let i=b.dAt;i<dAt;i+=1){badD.delete(i);retriedD.delete(i);}
687:       if((detail&&dAt!==b.dAt)||at!==b.at)before();
688:       if(detail&&dAt!==b.dAt)setDetail(b.dAt,"restore");if(at!==b.at)apply(b.at);
689:       forget();upOk=b.upOk;paceHere(ms);avg=pace;};
690:     const slowStep=seen=>{
691:       if(loaded()){probe=null;stepDown("slow");return;}
692:       if(probed){paceHere(seen);return;}
693:       if(!probe)probe={at,dAt,ms:seen,n:0,upOk};
694:       else if(seen<probe.ms*.9){probe=null;stepDown("slow",true);return;}
695:       else if(probe.n>=2){undo(seen);return;}
696:       if(stepDown("slow",true))probe.n+=1;
697:       else if(probe.n>0)undo(seen);
698:       else{probe=null;probed=true;paceHere(seen);}
699:     };
700:     // The time this frame's callback kept the main thread, from the frame's own start to the end of the callback.
701:     const frameStart=()=>{try{const v=root.document?.timeline?.currentTime;return typeof v==="number"?v:null;}catch(_error){return null;}};
702:     const timeWork=()=>{if(timing)return;const f0=frameStart();if(f0===null)return;timing=true;
703:       try{root.Promise.resolve().then(()=>{timing=false;const w=gfxNow()-f0;if(w>=0){busy=busyKnown?busy+(Math.min(100,w)-busy)*.1:Math.min(100,w);busyKnown=true;}});}catch(_error){timing=false;}};
704:     apply(at);
705:     if(detail&&dAt>0)setDetail(dAt,"start");
706:     // The timed frames behind the loading screen ran slow: the heavy parts start one step down (the pixel ratio already
707:     // follows the level calibrate moved to).
708:     const startSlow=()=>{if(!adapts()||!p.calSlow)return;p.calSlow=false;
709:       if(detail&&dAt<detail.steps){badD.add(dAt);setDetail(dAt+1,"start");forget();upOk=false;}};
710:     startSlow();
711:     const api={
712:       renderer,
713:       frame(t){
714:         if(ended)return;
715:         gfxOpenFrame(t);
716:         // Device check: the level stays as forced and every frame counts, held or not.
717:         if(bench){bench.frame(t);return;}
718:         const dt=last?Math.min(100,t-last):BUDGET_MS;last=t;avg+=(dt-avg)*.08;
719:         // ?gfx=N (tests, the memory proof) stays as forced: no steps either way. r96: Auto and a picked level adapt; a pick
720:         // is the ceiling the steps come back up to.
721:         if(!adapts())return;
722:         timeWork();
723:         // The screen turned out faster than the pace taken for it (a power mode ended): judge against the new one.
724:         if(pace&&avg<pace*.8)pace=avg<=SMOOTH_MS?0:avg;
725:         const slow=avg>slowLimit();
726:         if(held){if(beat){beat.ms+=dt;if(slow)beat.slow+=dt;}return;}
727:         idleFor+=dt;
728:         if(slow){slowFor+=dt;slowN+=1;smoothFor=0;calmFor=0;}else{slowFor=0;slowN=0;const smooth=avg<smoothLimit();smoothFor=smooth?smoothFor+dt:0;calmFor=smooth?calmFor+dt:0;}
729:         // A scene that never holds, running calm for 15 s, may step up without a beat.
730:         if(!upOk&&!usesBeats&&calmFor>=15000)upOk=true;
731:         // A beat ran slow while the calm scene before it did not: the scene's action is the cost. The step is taken now,
732:         // between beats. (Not known how the calm scene runs: wait until it shows; as slow as the beat means the check below.)
733:         if(due===1||(due===2&&!slow)){stepDown("slow");return;}
734:         // Too slow for a second: one step down (see slowStep).
735:         if(slowFor>=1000){const seen=slowFor/Math.max(1,slowN);slowFor=0;slowN=0;due=0;slowStep(seen);return;}
736:         if(!upOk||typeof o.draw!=="function")return;
737:         // Heavy parts come back first (they went last): smooth for 6 s and a timed frame under 40% of the budget.
738:         if(detail&&dAt>dFloor){
739:           if(smoothFor>=6000){const again=badD.has(dAt-1);if(!ripe(again,retriedD.has(dAt-1),15000))return;
740:             smoothFor=0;if(again){retriedD.add(dAt-1);badD.delete(dAt-1);smoothBeats=0;}
741:             // A retry that runs slow again is off for this visit only; it never sets the lasting floor a first climb does.
742:             if(gfxTimedDraw(renderer,o.draw)<BUDGET_MS*.4){before();trial=again?-1:dAt-1;setDetail(dAt-1,"smooth");forget();}else badD.add(dAt-1);}
743:           return;
744:         }
745:         if(dAt>0)return;
746:         // Smooth for 3 s: time one real frame; step up only if the next step would still leave a third of the frame free.
747:         if(smoothFor>=3000&&at>0&&ripe(bad.has(at-1),retried.has(at-1),10000)){
748:           if(bad.has(at-1)){retried.add(at-1);bad.delete(at-1);smoothBeats=0;}
749:           smoothFor=0;const ms=gfxTimedDraw(renderer,o.draw),scale=Math.pow(list[at-1]/list[at],2);
750:           if(ms*scale<BUDGET_MS*.66){before();apply(at-1);}else bad.add(at-1);
751:         }
752:       },
753:       // Between beats only: a held governor never changes the picture mid-shot. What the beat showed is kept: a beat that
754:       // ran slow for 0.7 s, or for half of a short one, owes a step down at its end; a smooth one allows steps up again.
755:       hold(v){
756:         const next=Boolean(v);if(next===held){bench?.hold(held);return;}
757:         held=next;
758:         // Its first beat played to the end: the scene is open.
759:         if(!held)gfxOpenDone();
760:         // calm: how the scene ran just before the beat (true smooth enough, false slow, null not seen for half a second).
761:         // A slow beat owes its step at once when the calm scene was fine, or when the frame callback itself is busy.
762:         if(held)beat={ms:0,slow:0,calm:idleFor>=500?!(avg>slowLimit()):null};
763:         else{const b=beat;beat=null;slowFor=0;smoothFor=0;calmFor=0;idleFor=0;
764:           if(b&&adapts()&&b.ms>0){usesBeats=true;
765:             if(b.slow>=BEAT_SLOW_MS||(b.ms>=400&&b.slow>=b.ms*.5)){smoothBeats=0;if(b.calm===true||(busyKnown&&busy>BUDGET_MS*.45))due=1;else if(b.calm===null)due=Math.max(due,2);}
766:             else if(b.slow===0&&b.ms>=400){upOk=true;smoothBeats+=1;}else if(b.slow>0)smoothBeats=0;}}
767:         bench?.hold(held);
768:       },
769:       resize(){const cur=list[at];p=gfxProfile();list=gfxSteps(p,capOf());at=nearest(cur);bad.clear();if(list[at]!==cur)apply(at);},
770:       // Codex on #1263: calibrate() may move the pixel-ratio range after the governor was made. Take the new profile's steps
771:       // and ratio, so a step down never comes back as a higher ratio (calibrate calls this itself; scenes need not).
772:       sync(){if(ended)return;p=gfxProfile();list=gfxSteps(p,capOf());bad.clear();forget();apply(nearest(p.pixelRatio));startSlow();},
773:       // The level the scene was built at, which is what it draws (r91: not the level calibrate moved to for what comes next).
774:       level(){return built;},
775:       name(){return NAMES[built];},
776:       pixelRatio(){return list[at];},
777:       // The scene's heavy parts: 0 as built .. steps lightest (0 without a detail ladder).
778:       detail(){return dAt;},
779:       frameMs(){return +avg.toFixed(1);},
780:       // The frame callback's main-thread time, smoothed (null where it cannot be timed).
781:       workMs(){return busyKnown?+busy.toFixed(1):null;},
782:       end(){if(ended)return;ended=true;gfxOpenDone();if(failCount===fails0&&p.fellBack&&gfxNow()-born>=CAP_CLEAN_MS)gfxCapClean(p.level,key);try{renderer.domElement?.removeEventListener?.("webglcontextlost",lost);}catch(_error){}
783:         // Steps still on probe are not what the scene settled at: the place the probe began is.
784:         if(key&&adapts()){const sAt=probe?probe.at:at,sD=probe?probe.dAt:dAt;
785:           if(picked())gfxWrite(MEMORY_KEY(pickKey),JSON.stringify({pr:list[sAt],level:built}));else gfxWrite(MEMORY_KEY(key),list[sAt]);
786:           if(detail)gfxWrite(DETAIL_KEY(memKey()),JSON.stringify({level:built,at:sD,floor:dFloor,t:Date.now()}));}
787:         if(active===api)active=null;
788:         // The screen is over: this page reads the device's level again (r96 per screen) until the next one names itself.
789:         if(key&&sceneKey===key)sceneKey="";}
790:     };
791:     active=api;
792:     return api;
793:   }
794: 
795:   // Device check recorder: frame-to-frame times from the scene's own loop for BENCH_MS (after a short settle), then a few
796:   // timed draws (the GPU cost, which a 60 Hz screen hides), posted once to the parent page and fired as an event here.
797:   // r92: ats (optional, ms since the screen began to play, one per frame) names when the slowest frame came, so a Device check
798:   // result on a real phone says which moment of the kick, turn or reveal stalled.
799:   function gfxBenchStats(dts,ats){
800:     const n=dts.length;if(!n)return {frames:0,avg:0,p1low:0,ms:0};
801:     const total=dts.reduce((a,b)=>a+b,0),sorted=dts.slice().sort((a,b)=>b-a),worst=sorted.slice(0,Math.max(1,Math.ceil(n/100)));
802:     const ms=total/n,worstMs=worst.reduce((a,b)=>a+b,0)/worst.length;
803:     const out={frames:n,avg:+(1000/ms).toFixed(1),p1low:+(1000/worstMs).toFixed(1),ms:+ms.toFixed(2)};
804:     // late: frames that took over 25 ms (a missed refresh at 60 Hz). Many late frames is a level too heavy; one or two slow
805:     // ones is a hitch (a first upload, a pause in the browser).
806:     if(Array.isArray(ats)&&ats.length===n){let at=0;for(let i=1;i<n;i+=1)if(dts[i]>dts[at])at=i;
807:       out.slowest=[+dts[at].toFixed(1),+(ats[at]/1000).toFixed(1)];out.late=dts.filter(d=>d>25).length;}
808:     return out;
809:   }
810:   // What the canvas really is: its CSS box and the drawing buffer the browser gave (8K: a browser may give less than asked).
811:   function gfxBenchSize(renderer){
812:     try{const c=renderer.domElement,gl=renderer.getContext();
813:       return {css:[c?.clientWidth||0,c?.clientHeight||0],size:[gl?.drawingBufferWidth||c?.width||0,gl?.drawingBufferHeight||c?.height||0],
814:         bufferOk:!(gl&&c&&gl.drawingBufferWidth&&c.width&&gl.drawingBufferWidth<c.width-2)};}
815:     catch(_error){return {css:[0,0],size:[0,0],bufferOk:true};}
816:   }
817:   // r91 (Sol 6.1 review of 2.3.0): the result says what was asked (?gfx=N), what was drawn (level, pixel ratio, buffer size),
818:   // whether a whole beat was played and whether the GPU gave up on the way, so the Device check can refuse a result that is
819:   // not a clean measurement of the level it asked for. "started" is posted when the scene is built and about to draw.
820:   function gfxBench(renderer,draw,key,prof,pr,info){
821:     let start=0,last=0,done=false,beats=0,heldAt=0,holding=false;const dts=[],ats=[],scene=key||"scene",first=prof();
822:     const post=m=>{try{root.dispatchEvent?.(new root.CustomEvent("cms-gfx-bench",{detail:m}));}catch(_error){}
823:       try{if(root.parent&&root.parent!==root)root.parent.postMessage(m,root.location.origin);}catch(_error){}};
824:     const finish=complete=>{
825:       if(done)return;done=true;
826:       const p=prof(),draws=[];if(typeof draw==="function"&&!benchFailed)for(let i=0;i<5;i+=1){try{draws.push(gfxTimedDraw(renderer,draw));}catch(_error){}}
827:       draws.sort((a,b)=>a-b);
828:       let extra=null;try{extra=typeof info==="function"?info():null;}catch(_error){extra=null;}
829:       post({type:"cms-gfx-bench",phase:"result",scene,asked:first.asked,level:p.level,name:p.name,label:LABELS[p.level],pixelRatio:pr(),...gfxBenchSize(renderer),
830:         beats,complete:Boolean(complete),failed:benchFailed||null,software:Boolean(p.software),gpu:p.gpu,
831:         ...gfxBenchStats(dts,ats),drawMs:draws.length?+draws[Math.floor(draws.length/2)].toFixed(2):null,...(extra&&typeof extra==="object"?{info:extra}:{})});
832:     };
833:     post({type:"cms-gfx-bench",phase:"started",scene,asked:first.asked,level:first.level});
834:     return {
835:       frame(t){
836:         if(done)return;
837:         // The GPU gave up at this level (a lost context, out of memory, a refused 8K buffer): that is the result.
838:         if(benchFailed){finish(false);return;}
839:         if(!start){start=t;last=t;return;}
840:         const dt=t-last;last=t;
841:         if(t-start<BENCH_SETTLE_MS)return;
842:         dts.push(dt);ats.push(t-start);
843:         if(t-start>=BENCH_SETTLE_MS+BENCH_MAX_MS){finish(false);return;}
844:         if(t-start>=BENCH_SETTLE_MS+BENCH_MS&&beats>=1)finish(true);
845:       },
846:       // One beat is one hold(true) .. hold(false) that lasted (a kick, a turn, a reveal).
847:       hold(v){const now=gfxNow();if(v&&!holding){holding=true;heldAt=now;}else if(!v&&holding){holding=false;if(now-heldAt>=500)beats+=1;}}
848:     };
849:   }
850: 
851:   // ?fps=1 only: a small corner readout, four times a second, with its own frame clock.
852:   // softCut(canvas, draw): a step taken in play, shown softly. The frame as it stands is copied over the canvas and fades
853:   // out over the scene as it is drawn from the next frame on (a scene passes this to its governor as before()). For a
854:   // scene whose canvas fills its own positioned box (the Roulette and Special Player pages; Chamber Men fades inside its
855:   // own picture). The copy lies in that box right over the canvas, so nothing above the scene is covered, takes no
856:   // pointer, is at most 2560 px on its long side and is gone after the fade. Under Reduce Motion, or where the box is not
857:   // positioned, the step is a plain cut as before. Never throws.
858:   function gfxSoftCut(canvas,draw,ms){
859:     try{
860:       const box=canvas?.parentElement,doc=canvas?.ownerDocument,win=doc?.defaultView||root,fade=Number.isFinite(ms)&&ms>0?ms:420;
861:       if(!box||!doc||!canvas.width||!canvas.height)return false;
862:       if(win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)return false;
863:       if((win.getComputedStyle?.(box)?.position||"static")==="static")return false;
864:       for(const old of box.querySelectorAll?.("canvas[data-gfx-cut]")||[])old.remove();
865:       const k=Math.min(1,2560/Math.max(canvas.width,canvas.height)),copy=doc.createElement("canvas");
866:       copy.width=Math.max(1,Math.round(canvas.width*k));copy.height=Math.max(1,Math.round(canvas.height*k));
867:       // A WebGL canvas holds its frame only in the task that drew it: draw, then copy.
868:       if(typeof draw==="function")draw();
869:       copy.getContext("2d").drawImage(canvas,0,0,copy.width,copy.height);
870:       copy.setAttribute("data-gfx-cut","1");copy.setAttribute("aria-hidden","true");
871:       copy.style.cssText=`position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:1;transition:opacity ${fade}ms ease-out`;
872:       box.appendChild(copy);
873:       const frame=win.requestAnimationFrame||(f=>win.setTimeout(f,16));
874:       frame(()=>frame(()=>{copy.style.opacity="0";}));
875:       win.setTimeout(()=>copy.remove(),fade+300);
876:       return true;
877:     }catch(_error){return false;}
878:   }
879:   function gfxOverlay(info,parent){
880:     if(gfxQuery("fps")!=="1")return {stop(){}};
881:     const d=root.document;if(!d||!d.body)return {stop(){}};
882:     const box=d.createElement("div");box.setAttribute("aria-hidden","true");box.className="cmsGfxFps";
883:     box.style.cssText="position:fixed;left:6px;top:6px;z-index:2147483647;pointer-events:none;font:600 11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#9fff9f;background:rgba(0,0,0,.72);padding:4px 6px;border-radius:3px;white-space:pre";
884:     (parent||d.body).append(box);
885:     let raf=0,last=0,n=0,acc=0,shown=0,stopped=false;
886:     const tick=t=>{
887:       if(stopped)return;
888:       if(last){acc+=t-last;n+=1;}last=t;
889:       if(t-shown>=250&&n){
890:         const ms=acc/n,p=gfxProfile(),gov=active,built=gov?gov.level():p.level,extra=(()=>{try{return info?info()||{}:{};}catch(_error){return {};}})();
891:         const lines=[`${Math.round(1000/ms)} fps  ${ms.toFixed(1)} ms  pr ${(gov?gov.pixelRatio():p.pixelRatio).toFixed(2)}`,
892:           `${LABELS[built]} (${p.auto?"Auto":"picked"}${p.auto&&p.level!==built?`, next scene ${LABELS[p.level]}`:""}${p.auto&&built!==p.autoLevel?`, device says ${LABELS[p.autoLevel]}`:""})${gov&&gov.detail()?`  detail -${gov.detail()}`:""}${gov&&gov.workMs()!=null?`  work ${gov.workMs()} ms`:""}${p.calibratedMs!=null?`  cal ${p.calibratedMs} ms`:""}`,
893:           ...(p.fellBack?[`fell back from ${LABELS[p.fellBack.from]} to ${LABELS[p.level]}: ${p.fellBack.reason}`]:[]),
894:           p.gpu?p.gpu.slice(0,60):"gpu ?"];
895:         if(extra.calls!=null||extra.tris!=null)lines.push(`${extra.calls??"?"} calls  ${extra.tris!=null?(extra.tris/1000).toFixed(0)+"k":"?"} tris`);
896:         if(extra.extra)lines.push(String(extra.extra));
897:         box.textContent=lines.join("\n");shown=t;n=0;acc=0;
898:       }
899:       if(!box.isConnected){stopped=true;return;}
900:       raf=root.requestAnimationFrame(tick);
901:     };
902:     raf=root.requestAnimationFrame(tick);
903:     return {stop(){stopped=true;if(raf)root.cancelAnimationFrame(raf);box.remove();}};
904:   }
905: 
906:   root.CareerModeGfxTier={contractVersion:1,storageKey:KEY,build:BUILD,choices:CHOICES.slice(),names:NAMES.slice(),labels:LABELS.slice(),
907:     label(level){return LABELS[Math.max(0,Math.min(5,Math.round(Number(level))||0))];},
908:     profile:gfxProfile,calibrate:gfxCalibrate,governor:gfxGovernor,softCut:gfxSoftCut,builtLevel:gfxBuiltLevel,overlay:gfxOverlay,classify:gfxClassify,
909:     // Settings: suggested() is what Auto would pick on this device, choice() the saved pick ("auto" by default), setChoice()
910:     // saves a pick for this device; it takes effect on the next 3D screen.
911:     // "now" is the level Auto starts at on this device, read fresh from storage each call (Codex on #1284): the Device check
912:     // result and a crash cap may have been saved by the roulette or SP frame's own copy of this module. A scene's five-frame
913:     // calibration is not saved (each scene calibrates again), so it is not part of what Settings shows.
914:     // r96: level is the device's level, the lowest of the 3D screens (measuredScenes() has each screen's own).
915:     // r97: held = the screens a hold keeps lower than the device ({"rrr":1}); now and lowered are the device's own level.
916:     suggested(){const p=gfxBaseProfile(),m=gfxMeasured(),level=m?m.level:p.guessLevel,cap=gfxCap(),now=cap?Math.min(level,cap.level):level,held={};
917:       for(const e of gfxCapList())if(e.scene&&(held[e.scene]===undefined||e.level<held[e.scene]))held[e.scene]=e.level;
918:       return {level,name:NAMES[level],measured:Boolean(m),now,nowName:NAMES[now],lowered:now<level,held};},
919:     // Device check: what this device is taken for before any check (phone or computer, GPU, the level Auto starts at).
920:     device(){const p=gfxProfile();return {phone:Boolean(p.phone),gpu:p.gpu,software:Boolean(p.software),strongPhone:Boolean(p.strongPhone),
921:       guessLevel:p.guessLevel,guessName:NAMES[p.guessLevel],can8k:Boolean(p.can8k),dpr:p.dpr};},
922:     // Device check page: the level guide (which chips start at which level, what each level draws) and what this device's
923:     // chip, memory and processor threads each say.
924:     guide:gfxGuide,
925:     // Device check: the best level this device held, saved as its Auto; clearMeasured() goes back to the GPU-name guess.
926:     // r91 (Nik 2026-11-11): any level, Light to 8K (8K only where the GPU can hold it). A crash cap is left alone (review
927:     // on #1389): a device whose GPU gave up at a level in play keeps that cap even when the check then holds the level;
928:     // the cap ends by its own rules (7 days, 3 clean scenes, or a pick in Settings).
929:     measured:gfxMeasured,benchStats:gfxBenchStats,
930:     // r96: scenes = each 3D screen's own best level ({"chamber-men":1,"club-draw":3,...}); none lower than `level`, which
931:     // stays the lowest (what 2D, Settings' gate and a 2.8.0 copy of this file read).
932:     setMeasured(level,detail,scenes){const n=Math.round(Number(level));if(!Number.isFinite(n))return null;
933:       const b=gfxBaseProfile(),top=b.can8k?5:4,l=Math.max(0,Math.min(top,n)),own={},sTop=b.phone?Math.min(top,PHONE_SCENE_TOP):top;
934:       if(scenes&&typeof scenes==="object")for(const k of SCENE_KEYS){const v=Math.round(Number(scenes[k]));if(Number.isFinite(v))own[k]=Math.max(l,Math.min(sTop,v));}
935:       gfxWrite(MEASURED_KEY,JSON.stringify({level:l,at:Date.now(),...(Object.keys(own).length?{scenes:own}:{}),...(detail&&typeof detail==="object"?{detail}:{})}));cached=null;gfxRemark();return l;},
936:     // r96: the level Auto draws on each 3D screen after a Device check ({key: level}, the crash cap not counted); null before
937:     // a check. A screen the check did not time on its own draws the check's level.
938:     measuredScenes(){const m=gfxMeasured();if(!m)return null;const b=gfxBaseProfile(),out={};for(const k of SCENE_KEYS)out[k]=gfxSceneLevel(b,m,k);return out;},
939:     sceneKeys:SCENE_KEYS.slice(),
940:     clearMeasured(){gfxWrite(MEASURED_KEY,"null");cached=null;gfxRemark();},
941:     choice:gfxChoice,setChoice(c){const v=CHOICES.includes(String(c))?String(c):"auto";gfxWrite(KEY,v);gfxWrite(CAP_KEY,"null");cached=null;gfxRemark();return v;},
942:     // offers(choice): may Settings offer this choice on this device? Everything, except: 8K only where the GPU can hold it,
943:     // and on a weak device Ultra (4K) and 8K only once the Device check has passed them. needsCheck(): the labels held
944:     // back for want of that check (empty on every other device).
945:     offers(choice){const c=String(choice),i=CHOICES.indexOf(c);if(i<0)return false;if(i<5)return true;
946:       const p=gfxProfile(),l=i-1;return gfxPickable(l,gfxScreenEnv(),p.can8k,gfxMeasured())===l;},
947:     needsCheck(){const p=gfxProfile(),env=gfxScreenEnv(),m=gfxMeasured(),out=[];
948:       for(const l of [4,5]){if(l===5&&!p.can8k)continue;if(gfxPickable(l,env,p.can8k,m)<l)out.push(LABELS[l]);}return out;},
949:     // 8K is offered only where it can run (Settings shows it only then); samples()/checkTarget() size MSAA for render targets.
950:     can8k(){return Boolean(gfxProfile().can8k);},samples:gfxSamples,checkTarget:gfxCheckTarget,
951:     // tabCrash(): the cap left by a tab that died while a 3D screen was opening (null when there is none). The Device
952:     // check does not open a level above it again.
953:     // r97: scenes lists every screen that closed the tab while its hold lasts (scene is the latest), levels each one's held
954:     // level ({"rrr":1}; "" for a screen that could not be named, which holds every screen); level is the lowest of them.
955:     tabCrash(){const tabs=gfxCapList().filter(e=>e.tab);if(!tabs.length)return null;
956:       const last=tabs.reduce((a,e)=>Number(e.at||0)>=Number(a.at||0)?e:a),low=tabs.reduce((a,e)=>e.level<a.level?e:a),levels={};for(const e of tabs)levels[e.scene]=e.level;
957:       return {level:low.level,from:Number.isInteger(last.from)?last.from:last.level+1,scene:last.scene,scenes:tabs.map(e=>e.scene),levels,bench:Boolean(last.bench),at:last.at,until:Number(last.at||0)+CAP_DAYS_MS};},
958:     // tabDied(level, scene): r93, the Device check saw its page die while one of its screens was playing (the page came back
959:     // with that screen still open). The same cap as a tab that died while a screen was opening: one level below, until 7 days,
960:     // a pick in Settings or the next build.
961:     tabDied(level,scene){const l=Math.round(Number(level));if(!(l>0&&l<=5))return null;
962:       return gfxCapPut(scene,l>=5?4:l-1,{reason:"the tab closed while this 3D screen was playing",tab:true,from:l,bench:true});},
963:     // fallback(reason): a scene that hit an out-of-memory sign of its own drops the device one level (remembered).
964:     fallback:gfxFail,fallback8k:gfxFail,
965:     // sceneOpening(scene): a 3D screen on the game's own page says it is about to load and build (the tab-crash guard's
966:     // mark; a framed screen marks itself). sceneOpened(): the mount ended without a scene. The governor ends the mark of
967:     // one that did open.
968:     // r96: the screen that opens is this page's screen (its own level on Auto after a Device check) until it ends.
969:     sceneOpening(scene){try{if(scene)sceneKey=String(scene);if(!gfxFramed())gfxOpenArm(gfxProfile().level,scene);}catch(_error){}},sceneOpened(){try{gfxOpenDone();sceneKey="";}catch(_error){}},
970:     reset(){cached=null;}};
971:   // On load, first: did this tab die while a 3D screen was opening? (The cap it writes is read by everything below.)
972:   try{gfxOpenSweep();}catch(_error){}
973:   // On load: a level the player picked or the Device check measured is marked at once (no GPU probe); the full profile
974:   // follows when the page is idle (the GPU name from the kept answer, or, the first time in this browser, from one throwaway
975:   // context in a truly idle moment: no 2 s deadline that could land it in the middle of Home's first taps).
976:   try{const c=gfxChoice(),m=gfxMeasured(),l=c!=="auto"&&c!=="8k"?gfxChoiceLevel(c):c==="auto"&&m?m.level:null,cap=gfxCap();
977:     if(l!==null){const lv=cap?Math.min(l,cap.level):l,phone=gfxScreenEnv().phone;gfxMarkRoot(lv,Math.max(0,Math.min(4,phone&&lv<2?lv-1:lv)-(gfxSlowNet()?1:0)));}}catch(_error){}
978:   // r90 MOTION M32: the first probe in a browser also waits until the loading screen has handed over to Home (the same
979:   // test js/ssjr.js uses), so its long task never lands under the loading screen or Home's first frame; with a kept answer
980:   // the remark costs nothing and follows at the first idle moment.
981:   const gfxKept=()=>{try{const k=JSON.parse(gfxRead(GPU_KEY)||"null");return Boolean(k&&k.ua===String(root.navigator?.userAgent||""));}catch(_error){return false;}};
982:   const gfxHandedOver=()=>{try{const el=root.document?.getElementById?.("loadingScreen");return !root.careerModeHomeHold&&(!el||el.hidden||el.classList?.contains("hidden"));}catch(_error){return true;}};
983:   const gfxIdle=f=>(root.requestIdleCallback||(g=>root.setTimeout(g,200)))(f,{timeout:10000});
984:   try{if(gfxKept())gfxIdle(()=>gfxRemark());
985:     else{let n=0;const wait=()=>{if(gfxHandedOver()||++n>120)gfxIdle(()=>gfxRemark());else root.setTimeout(wait,250);};wait();}}catch(_error){}
986: })(typeof globalThis!=="undefined"?globalThis:this);
987: 
```

## FILE: device-check.html (536 lines)
```html
1: <!doctype html>
2: <html lang="en">
3: <head>
4: <meta charset="utf-8">
5: <meta name="viewport" content="width=device-width,initial-scale=1">
6: <meta name="robots" content="noindex">
7: <title>Device check · Career Mode Showdown</title>
8: <!-- r90 Device check (Nik 2026-11-07: "very smooth based on each device capability ... choose that as auto"). Plays each 3D
9:      screen on demo data at every quality level (js/gfxTier.js ?gfx=N&bench=1 frames), shows the frame rate, and saves the
10:      best level that holds 60 fps as this device's Auto. It loads no game, no sign-in and no Firestore: only js/storage.js
11:      (the app's own storage helpers) and js/gfxTier.js. Settings > 3D QUALITY can still pick any level.
12:      r91 (Sol 6.1 review of 2.3.0; Nik 2026-11-11: Auto covers every level, Light to 8K, from the real test): all three 3D
13:      screens are timed (Chamber Men: a kick, Russian Roulette: a turn, the Special Player pack: a reveal). A level is saved
14:      only when all three drew exactly that level and stayed smooth. A screen that did not start, did not finish, or drew
15:      another level than asked leaves the level not verified: nothing is saved and the last good result stays.
16:      r96 (Nik 2026-11-17 21:43 UTC: lighter screens should run higher than heavy ones): each screen climbs on its own. A screen
17:      that is not smooth (or failed) at a level stops there; the others go on climbing. Each screen's best level is saved
18:      with the result, Auto draws it on that screen, and the lowest of them stays the device's level. The Ball Game (a spin
19:      and its STOP) is timed too. -->
20: <link rel="stylesheet" href="css/r95-type.css">
21: <style>
22: :root{--gold:#f5c518;--gold-dim:rgba(219,178,94,.55);--ink:#f5f1e8;--mute:#c1b9aa;--bad:#ff8a7a;--good:#9fe39f}
23: *{box-sizing:border-box}
24: html{background:#050505}
25: body{margin:0;min-height:100vh;color:var(--ink);font:400 15px/1.5 var(--r95-font);
26:   background:#050505 url("css/r78-marble-tile.webp") center/480px repeat}
27: main{max-width:1000px;margin:0 auto;padding:28px 16px 40px}
28: /* r93 HO-079: the title is live text in the one title family (Cormorant SC Bold, flat gold ink), at the height every screen title has.
29:    The words stay in the heading for screen readers; the same words are laid over them. */
30: h1{position:relative;margin:0 0 8px;--hc-h:clamp(40px,3.08vw,59px);height:var(--hc-h);overflow:hidden;font:800 28px/1.05 var(--r95-font);letter-spacing:.06em;color:transparent;text-align:center}
31: h1::after{position:absolute;left:0;right:0;top:0;pointer-events:none;content: "DEVICE CHECK"; --hcw: 7.74; display: flex; align-items: center; justify-content: center; box-sizing: border-box; height: var(--hc-h); padding: 0 0 calc(var(--hc-h) * .096) .06em; white-space: nowrap; font: 650 calc(.9 * min(calc(var(--hc-h) * .88), calc((100vw - 28px) / var(--hcw))))/var(--hc-h) var(--r95-font); font-style: normal; font-synthesis: none; font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; letter-spacing: .06em; text-transform: uppercase; color: var(--r95-gold-ink, #F2C45B); -webkit-text-fill-color: var(--r95-gold-ink, #F2C45B); background: none;}
32: .lede{margin:0 auto 18px;max-width:62ch;text-align:center;color:var(--mute)}
33: .card{background:rgba(8,7,5,.88);border:1px solid var(--gold-dim);padding:16px;margin:0 0 14px}
34: .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center}
35: button,.btn{appearance:none;min-height:44px;padding:0 20px;border:1px solid var(--gold);background:rgba(0,0,0,.6);color:var(--ink);
36:   font:700 14px/44px var(--r95-font);letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
37: button.primary{background:var(--gold);color:#15120c}
38: button:disabled{opacity:.5;cursor:default}
39: button:focus-visible,.btn:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
40: #status{min-height:1.5em;margin:10px 0 0;text-align:center;font-weight:600}
41: /* At rest the line is empty and takes no room, so the two buttons sit evenly in their box. Its first words arrive in the
42:    same step that the stage covers the window (run() below), so nothing is seen to move when the check starts. */
43: #status:empty{display:none}
44: #stage{position:relative;width:100%;aspect-ratio:16/9;max-height:60vh;margin:0 auto;background:#000;border:1px solid var(--gold-dim);overflow:hidden}
45: #stage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}
46: /* Codex on #1266: each scene is measured at its real game size, so the stage fills the window while a level runs (RRR is a
47:    full page in the game; the Chamber Men frame sizes its goal as css/chamberMen.css does). */
48: #stage.live{position:fixed;inset:0;z-index:5;width:auto;max-height:none;aspect-ratio:auto;border:0}
49: #stage .liveNote{position:absolute;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom,0px));margin:0 auto;width:max-content;max-width:calc(100% - 32px);
50:   padding:6px 12px;background:rgba(5,5,5,.86);border:1px solid var(--gold-dim);color:var(--ink);font:600 13px/1.3 var(--r95-font);text-align:center;pointer-events:none}
51: #stage .idle{position:absolute;inset:0;display:grid;place-items:center;color:var(--mute);padding:16px;text-align:center}
52: table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
53: th,td{padding:8px 6px;border-bottom:1px solid rgba(219,178,94,.25);text-align:left;vertical-align:top}
54: th{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
55: td small{display:block;color:var(--mute);font-size:12px}
56: .ok{color:var(--good)}.no{color:var(--bad)}.skip{color:var(--mute)}.unsure{color:var(--gold)}
57: #result{text-align:center;font-weight:700;font-size:17px}
58: #result small{display:block;font-weight:400;font-size:14px;color:var(--mute)}
59: td small{overflow-wrap:anywhere}
60: /* r91 level guide (Nik 2026-11-12): what this device's chip, processor and memory each say, and the table of which chips
61:    start at which level. Quiet type, no boxes around the titles, nothing under 12 px, no glow. */
62: h2{margin:0 0 12px;font:800 15px/1.2 var(--r95-font);letter-spacing:.12em;text-transform:uppercase;color:var(--gold);text-align:center}
63: h2 span{color:var(--mute);font-weight:600}
64: .parts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:0}
65: .parts div{padding:2px 16px;border-left:1px solid rgba(219,178,94,.25);text-align:center}
66: .parts div:first-child{border-left:0}
67: .parts dt{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
68: .parts dd{margin:3px 0 0;overflow-wrap:anywhere}
69: .parts dd.val{font-weight:700}
70: .parts dd.says{color:var(--mute);font-size:14px}
71: .suggest{margin:14px 0 0;padding-top:12px;border-top:1px solid rgba(219,178,94,.25);text-align:center;font-weight:700;font-size:17px}
72: .suggest b{color:var(--gold)}
73: .suggest small{display:block;font-weight:400;font-size:14px;color:var(--mute)}
74: .suggest small.shut{margin-top:8px;color:var(--ink)}
75: .note{margin:0 auto 10px;max-width:86ch;text-align:center;color:var(--mute);font-size:14px}
76: #limits{margin-top:14px}
77: .guide th[scope=row],.guide thead th:first-child{padding-left:12px}
78: .note:last-child{margin-bottom:0}
79: .guide th[scope=row]{white-space:nowrap}
80: .guide tr.mine th,.guide tr.mine td{background:rgba(245,197,24,.08)}
81: .guide tr.mine th{box-shadow:inset 3px 0 0 var(--gold)}
82: .guide .tag{display:block;margin-top:3px;font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--ink)}
83: /* Narrow screens: one block per level, each screen on its own line under its name (four columns do not fit a phone). */
84: @media (max-width:720px){
85:   .card{padding:12px}
86:   table,tbody,tr,td,th{display:block}
87:   thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
88:   tbody tr{padding:8px 0;border-bottom:1px solid rgba(219,178,94,.25)}
89:   tbody th,tbody td{border:0;padding:3px 0}
90:   tbody th{font-size:13px}
91:   tbody td::before{content:attr(data-label);display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold-dim)}
92:   .parts{grid-template-columns:1fr}
93:   .parts div{padding:8px 0;border-left:0;border-top:1px solid rgba(219,178,94,.25)}
94:   .parts div:first-child{border-top:0;padding-top:0}
95:   .guide tr.mine{padding-left:10px;padding-right:6px;box-shadow:inset 3px 0 0 var(--gold);background:rgba(245,197,24,.08)}
96:   .guide tr.mine th,.guide tr.mine td{background:none;box-shadow:none}
97:   .guide th[scope=row]{padding-left:0}
98: }
99: </style>
100: </head>
101: <body>
102: <main>
103:   <h1>DEVICE CHECK</h1>
104:   <p class="lede">Plays a Chamber Men kick, a Russian Roulette turn, a Special Player reveal and a Ball Game spin at each 3D quality level, lightest first. Each screen then gets the best level it keeps smooth at 60 fps, with no stutter, so a lighter screen can run higher than a heavier one. A screen that is not smooth is played once more before it counts, and stops climbing at the first level that is still not smooth. It only ever raises Auto above the level your graphics chip starts at. It takes a few minutes. Keep this tab open and in front. Nothing in your Showdown changes.</p>
105:   <section class="card" id="yours" aria-labelledby="yoursTitle" hidden>
106:     <h2 id="yoursTitle">Your device</h2>
107:     <dl id="parts" class="parts"></dl>
108:     <p id="suggest" class="suggest"></p>
109:   </section>
110:   <section class="card">
111:     <div class="row">
112:       <button id="start" class="primary" type="button">Start check</button>
113:       <button id="forget" type="button" hidden>Forget result</button>
114:       <a class="btn" href="./">Back to the game</a>
115:     </div>
116:     <p id="status" role="status" aria-live="polite"></p>
117:   </section>
118:   <section class="card" aria-hidden="true"><div id="stage"><div class="idle">The 3D screens play here during the check.</div></div></section>
119:   <section class="card">
120:     <p id="result" aria-live="polite"></p>
121:     <div class="wrap"><table>
122:       <thead><tr><th scope="col">Level</th><th scope="col">Chamber Men</th><th scope="col">Russian Roulette</th><th scope="col">Special Player</th><th scope="col">Ball Game</th><th scope="col">Result</th></tr></thead>
123:       <tbody id="rows"></tbody>
124:     </table></div>
125:   </section>
126:   <section class="card" id="guide" aria-labelledby="guideTitle" hidden>
127:     <h2 id="guideTitle">Level guide</h2>
128:     <p class="note">Where Auto starts, by graphics chip, before any check.</p>
129:     <div class="wrap"><table class="guide">
130:       <thead><tr><th scope="col">Level</th><th scope="col">Chips that start here</th><th scope="col">What it draws</th></tr></thead>
131:       <tbody id="guideRows"></tbody>
132:     </table></div>
133:     <p class="note" id="limits"></p>
134:     <p class="note">These are starting points, not promises. Only the check on this page measures a device, and Auto then uses the best level it kept smooth. Settings › 3D QUALITY can still pick any level it lists.</p>
135:   </section>
136: </main>
137: <script src="js/storage.js"></script>
138: <script src="js/gfxTier.js"></script>
139: <script>
140: (function(){
141:   "use strict";
142:   const T=window.CareerModeGfxTier;
143:   // The shared level names (js/gfxTier.js). 8K is tried only where the graphics chip can hold a 7680 px picture.
144:   const LEVELS=window.CareerModeGfxTier.labels.slice();
145:   const TOP=(()=>{try{return T&&T.can8k()?5:4;}catch(_error){return 4;}})();
146:   // Every 3D screen of the game, each with the whole beat it must play before its frame times count.
147:   const SCENES=[
148:     {key:"chamber-men",name:"Chamber Men",beat:"kick",path:"device-check-chamber.html"},
149:     {key:"rrr",name:"Russian Roulette",beat:"turn",path:"visual-assets/v10_1/roulette/index.html"},
150:     {key:"sp",name:"Special Player",beat:"reveal",path:"visual-assets/v10_1/special-player/index.html"},
151:     // r96: the Ball Game (Club Assignment), the lightest 3D screen; keys are the screens' governor keys (js/gfxTier.js).
152:     {key:"club-draw",name:"Ball Game",beat:"spin",path:"device-check-ball.html"}
153:   ];
154:   // Holds 60 fps: the average stays within 5% of 60, and the picture does not stutter.
155:   // r92 (Nik's iPhone 17, run 4: Special Player at Light averaged 60 fps with the GPU at 2 ms and failed on a 1% low of 44.3):
156:   // the worst 1% of a 10 s run is about 6 frames, so three refreshes missed in 10 s failed a screen nobody could see stutter.
157:   // Stutter is now: more than 2 frames in 100 late (over 25 ms, a missed refresh at 60 Hz), or any one frame over 100 ms
158:   // (a freeze of about six refreshes). An answer from an older frame without those counts keeps the 1% low rule (45 fps).
159:   const SMOOTH_AVG=57,SMOOTH_LOW=45;
160:   const SMOOTH_LATE=.02,SMOOTH_STALL_MS=100;
161:   // A screen has LOAD_WAIT_MS to load its files and build (a cold cache on a slow line), then MEASURE_WAIT_MS to play.
162:   const LOAD_WAIT_MS=180000,MEASURE_WAIT_MS=120000;
163:   const $=id=>document.getElementById(id);
164:   const stage=$("stage"),status=$("status"),rows=$("rows"),result=$("result"),startBtn=$("start"),forgetBtn=$("forget");
165:   const results=LEVELS.map(()=>({}));
166:   let running=false,aborted="";
167: 
168:   function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));}
169:   function smooth(r){
170:     if(!(r.avg>=SMOOTH_AVG))return false;
171:     if(Number.isFinite(r.late)&&Array.isArray(r.slowest))return r.late<=r.frames*SMOOTH_LATE&&r.slowest[0]<=SMOOTH_STALL_MS;
172:     return r.p1low>=SMOOTH_LOW;
173:   }
174:   // What one screen's answer is worth at one level. "smooth" and "slow" are clean measurements of the asked level; "failed"
175:   // means the graphics chip gave up at it (as final as "slow"); "unverified" means the answer does not prove anything about
176:   // the level either way.
177:   function judge(level,scene,r){
178:     if(!r)return null;
179:     if(r.skipped)return {state:"skipped"};
180:     // The tab died at this level before (js/gfxTier.js tabCrash): as final as a graphics failure, and not opened again.
181:     // r93: the tab closed while this screen was playing in this check (the page reloaded with the screen still open).
182:     if(r.died)return level>0?{state:"failed",why:"The tab closed while this screen was playing, so it was not tried higher."}:{state:"unverified",why:"The tab closed while this screen was playing."};
183:     if(r.crashed)return level>0?{state:"failed",why:"The tab closed at this level last time, so it was not opened again."}:{state:"unverified",why:"The tab closed at this level last time."};
184:     if(r.error)return {state:"unverified",why:r.error};
185:     if(r.failed)return level>0?{state:"failed",why:`The graphics chip gave up at this level: ${r.failed}.`}:{state:"unverified",why:`The graphics chip gave up: ${r.failed}.`};
186:     if(r.asked!==level)return {state:"unverified",why:"The screen did not confirm the level it was asked for. Update the game, then check again."};
187:     if(r.level!==level)return {state:"unverified",why:`It drew ${LEVELS[r.level]||"another level"}, not ${LEVELS[level]}.`};
188:     if(r.bufferOk===false)return {state:"unverified",why:"The browser gave a smaller picture than this level asks for."};
189:     if(r.info&&r.info.lite)return {state:"unverified",why:"It drew the lighter stand-in files, not this level's own."};
190:     if(!(r.frames>0)||!Number.isFinite(r.avg)||!Number.isFinite(r.p1low))return {state:"unverified",why:"No frames were timed."};
191:     // Frames of the asked level that were not smooth settle it, whether or not the beat got to its end (a screen too slow to
192:     // finish its turn in a minute is slow). Smooth frames count only with a whole beat played.
193:     if(!smooth(r))return {state:"slow"};
194:     if(!r.complete||!(r.beats>=1))return {state:"unverified",why:`The ${scene.beat} did not finish in time.`};
195:     return {state:"smooth"};
196:   }
197:   // A level's row: smooth on every screen, smooth on some (r96: each screen climbs on its own, so a lighter screen goes on
198:   // above a level a heavier one could not hold), or on none. One screen that proves nothing leaves the row not verified.
199:   function verdict(level){
200:     const all=SCENES.map(s=>judge(level,s,results[level][s.key]));
201:     if(all.some(j=>j&&j.state==="unverified"))return "unverified";
202:     if(all.some(j=>!j))return null;
203:     const n=all.filter(j=>j.state==="smooth").length;
204:     if(n===all.length)return "smooth";
205:     if(n>0)return {some:n};
206:     if(all.some(j=>j.state==="slow"||j.state==="failed"))return all.some(j=>j.state==="slow")?"slow":"failed";
207:     return "skipped";
208:   }
209:   const VERDICT={smooth:"<span class=\"ok\">Smooth</span>",slow:"<span class=\"no\">Not smooth</span>",failed:"<span class=\"no\">Failed</span>",
210:     unverified:"<span class=\"unsure\">Not verified</span>",skipped:"<span class=\"skip\">Not tried</span>"};
211:   const verdictHtml=v=>v&&typeof v==="object"?`<span class="ok">Smooth on ${v.some} of ${SCENES.length}</span>`:VERDICT[v];
212:   function cell(level,scene){
213:     const r=results[level][scene.key],j=judge(level,scene,r);
214:     if(!j)return "<span class=\"skip\">–</span>";
215:     if(j.state==="skipped")return "<span class=\"skip\">not tried</span>";
216:     if(j.state==="unverified")return `<span class="unsure">not verified</span><small>${esc(j.why)}</small>`;
217:     if(j.state==="failed")return `<span class="no">failed</span><small>${esc(j.why)}</small>`;
218:     const size=Array.isArray(r.size)&&r.size[0]?` · ${r.size[0]}×${r.size[1]}`:"";
219:     return `<span class="${j.state==="smooth"?"ok":"no"}">${r.avg} fps</span><small>1% low ${r.p1low} · ${r.ms} ms${r.drawMs!=null?` · GPU ${r.drawMs} ms`:""}${size} · ×${(+r.pixelRatio).toFixed(2)}</small>${frames(r)}${tryNote(r)}`;
220:   }
221:   // r92 (Nik's iPhone 17): where the time went. The slowest frame and when it came (seconds into the screen), and how many
222:   // frames missed a refresh: one slow frame is a hitch, many are a level too heavy.
223:   function frames(r){
224:     if(!Array.isArray(r.slowest))return "";
225:     return `<small>slowest frame ${r.slowest[0]} ms at ${r.slowest[1]} s · ${r.late} late ${r.late===1?"frame":"frames"}</small>`;
226:   }
227:   // A screen not smooth on its first try is played once more; the table shows the second try and what the first one was.
228:   function tryNote(r){
229:     if(r.retryWhy!=null)return `<small>The second try gave no clean answer: ${esc(r.retryWhy)}</small>`;
230:     const f=r.firstTry;if(!f)return "";
231:     const was=Number.isFinite(f.avg)?`${f.avg} fps, 1% low ${f.p1low}${Array.isArray(f.slowest)?`, slowest frame ${f.slowest[0]} ms at ${f.slowest[1]} s`:""}`:"no clean answer";
232:     return `<small>Second try. First try: ${esc(was)}.</small>`;
233:   }
234:   function draw(){
235:     rows.innerHTML=LEVELS.slice(0,TOP+1).map((name,i)=>{
236:       const v=verdict(i);
237:       return `<tr><th scope="row">${name}</th>${SCENES.map(s=>`<td data-label="${s.name}">${cell(i,s)}</td>`).join("")}<td data-label="Result">${v?verdictHtml(v):"<span class=\"skip\">–</span>"}</td></tr>`;
238:     }).join("");
239:   }
240:   // r91 level guide (Nik 2026-11-12: "based on your graphic card, this is what we suggest, or based on your CPU"). All of it
241:   // comes from js/gfxTier.js guide(): what this device's chip, processor and memory each say, the level we suggest, and
242:   // the table of which chips start at which level. No frame rate is promised: only a finished check of this device says
243:   // "holds 60 fps".
244:   function showGuide(){
245:     let g=null;try{g=T&&T.guide();}catch(_error){g=null;}
246:     $("yours").hidden=$("guide").hidden=!g;if(!g)return;
247:     const d=g.device,kind=d.software?"software graphics":d.phone?"phone":"computer";
248:     $("yoursTitle").innerHTML=`Your device <span>· ${esc(kind)}</span>`;
249:     const cap=l=>l===0?`Starts at ${LEVELS[0]}`:l===null?"No limit":`No higher than ${LEVELS[l]}`;
250:     const parts=[
251:       ["Graphics chip",d.chipName||"Not named by this browser",d.software?`No graphics chip in use: starts at ${LEVELS[0]}`:`Chips like this start at ${LEVELS[d.chip]}`],
252:       ["Processor",d.threads?`${d.threads} ${d.threads===1?"thread":"threads"}`:"Not reported by this browser",d.phone?"Not counted on a phone":cap(d.threadCap)],
253:       ["Memory",d.memory?(d.memory>=8?"8 GB or more":`${d.memory} GB`):"Not reported by this browser",cap(d.memoryCap)]];
254:     $("parts").innerHTML=parts.map(([name,value,says])=>`<div><dt>${esc(name)}</dt><dd class="val">${esc(value)}</dd><dd class="says">${esc(says)}</dd></div>`).join("");
255:     let m=null,held=[];try{m=T.measured();}catch(_error){m=null;}try{held=T.needsCheck?T.needsCheck():[];}catch(_error){held=[];}
256:     const wait=held.length?` ${held.join(" and ")} ${held.length>1?"are":"is"} offered here only after the check passes ${held.length>1?"them":"it"}.`:"";
257:     const level=m?m.level:d.level,name=LEVELS[level]||LEVELS[1];
258:     // r97: a screen that stopped at or below the saved level (the chip's level counts as the floor) did not hold it.
259:     const under=m&&m.detail&&m.detail.stops&&typeof m.detail.stops==="object"&&Object.values(m.detail.stops).some(x=>x&&x.level<=m.level);
260:     const held60=m&&m.detail&&typeof m.detail.held==="boolean"?m.detail.held&&!under:null;
261:     // r96: a screen the check passed higher than the device's level draws its own level on Auto.
262:     const higher=m?ownLevels().filter(x=>x.level>m.level):[];
263:     const own=higher.length?` Lighter screens draw higher on Auto: ${higher.map(x=>`${x.name} ${LEVELS[x.level]}`).join(", ")}.`:"";
264:     const why=!m?`Auto starts there on a device like this. Run the check to measure yours: Auto then gives each 3D screen the best level it kept smooth.`
265:       :held60?`Measured on this device: every 3D screen holds 60 fps at ${name}. Auto uses it.${own}`
266:       :`The check measured ${name} on this device. Auto uses it.${own}`;
267:     // r93 (Nik's iPhone 17, 2026-11-15: "We suggest High", then High failed without being opened): a tab-crash cap that
268:     // keeps a level shut is said on this card too, with the day it ends.
269:     const tc=tabCrash();let shut="";
270:     if(tc){const day=new Date(tc.until).toLocaleDateString(undefined,{day:"numeric",month:"long"});
271:       const who=capName(tc);
272:       shut=`Last time the tab closed at ${LEVELS[tc.from]||"a higher level"}${who?` on ${who}`:""}, so ${capDraws(tc)} at most until ${day}, or until you pick a level in Settings or the game updates. This check stops ${who?`${who} `:""}below ${LEVELS[tc.from]||"that level"} until then.`;}
273:     $("suggest").innerHTML=`We suggest <b>${esc(name)}</b><small>${esc(why+wait)}</small>${shut?`<small class="shut">${esc(shut)}</small>`:""}`;
274:     $("guideRows").innerHTML=g.rows.map(r=>`<tr${r.mine?" class=\"mine\"":""}><th scope="row">${esc(r.label)}${r.mine?"<span class=\"tag\">Your device</span>":""}</th>`
275:       +`<td data-label="Chips that start here">${esc(r.who)}${r.level===5&&!d.can8k?"<small>Not on this device.</small>":""}</td><td data-label="What it draws">${esc(r.draws)}</td></tr>`).join("");
276:     $("limits").textContent=g.limits;
277:   }
278:   function showSaved(note){
279:     showGuide();
280:     const m=T&&T.measured();forgetBtn.hidden=!m;
281:     const extra=note?`${note} `:"";
282:     if(!m){result.innerHTML=note?`No result saved<small>${esc(note)} Auto uses its starting guess until a check finishes.</small>`:"";return;}
283:     // A crash cap from play outlives the check (js/gfxTier.js): say what Auto really draws until it ends.
284:     // r96: each screen's own level, when they differ ("Auto here: Balanced to High", then one line per screen).
285:     const own=ownLevels(),top=Math.max(m.level,...own.map(x=>x.level));
286:     // r97: a tab-crash cap holds every 3D screen in play (js/gfxTier.js); it does not end after clean screens. Said whenever
287:     // it holds any screen below its own level.
288:     let low="";try{const s=T.suggested(),tc=tabCrash();
289:       if(tc&&tc.level<top)low=` For now ${capDraws(tc,true)} at most, because the tab closed at ${LEVELS[tc.from]||"a higher level"}${capName(tc)?` on ${capName(tc)}`:""}. That ends after 7 days, when you pick a level in Settings, or when the game updates.`;
290:       else if(s&&s.lowered&&!tc)low=` Auto draws ${LEVELS[s.now]} for now: a graphics error in play lowered it. That ends after 7 days, after 3 clean 3D screens, when you pick a level in Settings, or when the game updates.`;
291:       // r97: a graphics error on one screen holds only that screen.
292:       else if(s&&s.held&&Object.keys(s.held).length&&!tc)low=` For now ${Object.entries(s.held).map(([k,l])=>`${(SCENES.find(x=>x.key===capScene(k))||{name:"a 3D screen"}).name} draws ${LEVELS[l]}`).join(" and ")}: a graphics error in play lowered it there. That ends after 7 days, after 3 clean plays of that screen, when you pick a level in Settings, or when the game updates.`;}catch(_error){low="";}
293:     const per=top>m.level?`On Auto: ${own.map(x=>`${x.name} ${LEVELS[x.level]}`).join(" · ")}. `:"";
294:     result.innerHTML=`Auto here: ${LEVELS[m.level]}${top>m.level?` to ${LEVELS[top]}`:""}<small>${esc(extra)}${esc(per)}Measured ${new Date(m.at).toLocaleString()} on the game's 3D screens. Settings › 3D QUALITY can still pick any level.${esc(low)}</small>`;
295:   }
296:   // r96: the level Auto draws on each screen this check times (js/gfxTier.js measuredScenes()).
297:   function ownLevels(){let o=null;try{o=T&&T.measuredScenes?T.measuredScenes():null;}catch(_error){o=null;}
298:     return o?SCENES.filter(sc=>Number.isInteger(o[sc.key])).map(sc=>({key:sc.key,name:sc.name,level:o[sc.key]})):[];}
299:   // A level that closed the tab while a 3D screen was opening (in the game or in an earlier check) is not opened again
300:   // while its cap lasts.
301:   function tabCrash(){try{return T&&T.tabCrash?T.tabCrash():null;}catch(_error){return null;}}
302:   // r97: the screen a tab-crash cap names (js/gfxTier.js writes a governor key, or the page of a framed screen), "" when
303:   // it cannot be told. capHolds: the cap keeps this screen below its level in the check: every screen that closed the tab
304:   // while the cap lasts (Codex on #1553), and every screen when one of them cannot be named.
305:   function capScene(name){const n=String(name||"");if(SCENES.some(sc=>sc.key===n))return n;
306:     for(const [re,k] of [[/roulette/,"rrr"],[/special-player/,"sp"],[/chamber/,"chamber-men"],[/ball|club-draw/,"club-draw"]])if(re.test(n))return k;return "";}
307:   function capHolds(tc,key){const all=tc&&Array.isArray(tc.scenes)&&tc.scenes.length?tc.scenes:[tc&&tc.scene];
308:     return all.some(n=>{const k=capScene(n);return !k||k===key;});}
309:   const capName=tc=>{const k=capScene(tc&&tc.scene),sc=SCENES.find(x=>x.key===k);return sc?sc.name:"";};
310:   // r97 (Nik 2026-11-18, option A): a hold keeps only its own screen lower (tc.levels {"rrr":1}; "" holds every screen). The
311:   // level this check may open a screen at, null when nothing holds it. A cap from before r97 (no levels) holds as capHolds says.
312:   function capLevel(tc,key){if(!tc)return null;
313:     if(tc.levels&&typeof tc.levels==="object"){const l=[tc.levels[key],tc.levels[""]].filter(Number.isInteger);return l.length?Math.min(...l):null;}
314:     return capHolds(tc,key)?tc.level:null;}
315:   // What the hold draws, in words: "Russian Roulette draws Balanced", or "the game draws Balanced" when it holds every screen.
316:   function capDraws(tc,every){const lv=tc&&tc.levels&&typeof tc.levels==="object"?tc.levels:null;
317:     if(!lv||Number.isInteger(lv[""]))return `${every?"every 3D screen":"the game"} draws ${LEVELS[tc.level]}`;
318:     return Object.entries(lv).map(([k,l])=>`${(SCENES.find(x=>x.key===capScene(k))||{name:"a 3D screen"}).name} draws ${LEVELS[l]}`).join(" and ");}
319:   // The measurement under way, so a hidden tab can stop it at once (Codex on #1266).
320:   let cancelWait=null;
321:   function wait(scene,level){
322:     return new Promise(resolve=>{
323:       const frame=document.createElement("iframe");
324:       frame.title=`${scene.name} at ${LEVELS[level]}`;frame.setAttribute("tabindex","-1");
325:       let done=false,timer=0;
326:       const note=document.createElement("div");note.className="liveNote";
327:       const say=what=>{note.textContent=`${what} ${scene.name} · ${LEVELS[level]} (${level+1} of ${TOP+1})`;};
328:       const finish=r=>{if(done)return;done=true;cancelWait=null;window.removeEventListener("message",onMsg);clearTimeout(timer);frame.remove();
329:         stage.classList.remove("live");resolve(r);};
330:       cancelWait=()=>finish({aborted:true});
331:       const onMsg=e=>{
332:         if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
333:         const d=e.data;if(!d||d.type!=="cms-gfx-bench"||d.scene!==scene.key)return;
334:         // "started": the screen is built and playing; from here it has MEASURE_WAIT_MS to finish its beat.
335:         if(d.phase==="started"){say("Measuring");clearTimeout(timer);timer=setTimeout(()=>finish({error:`The ${scene.beat} did not finish in 2 minutes.`}),MEASURE_WAIT_MS);return;}
336:         finish(d.error?{error:d.error}:d);
337:       };
338:       timer=setTimeout(()=>finish({error:"It did not start in 3 minutes."}),LOAD_WAIT_MS);
339:       window.addEventListener("message",onMsg);
340:       say("Loading");
341:       stage.replaceChildren(frame,note);stage.classList.add("live");
342:       frame.src=`${scene.path}?gfx=${level}&bench=1`;
343:     });
344:   }
345:   // r93 (Nik's iPhone 17 on 2.5.0, 2026-11-15: Light passed on all three screens, then the tab closed while Chamber Men opened
346:   // at Balanced, a level that had passed in the run before; after it the results were empty). The check played every screen
347:   // in one page, one frame after another, and a removed frame's memory comes back only when the browser chooses. Now one 3D
348:   // screen is in memory at a time: the page saves where the check is (this tab's sessionStorage) and reloads itself before
349:   // each screen, so every screen opens in a fresh page. A screen still open when the page dies is the one that closed the
350:   // tab: the next load keeps the rows already done, marks that screen and says where the check stopped. Without
351:   // sessionStorage the check runs in one page, as before.
352:   // r97 (Nik's iPhone 17 on 2.9.0, 2026-11-18: "closes my screen on rrr on high and doesn't continue the check for rest of
353:   // screens"): the run is kept in the browser's saved data (js/storage.js), not in the tab's sessionStorage, which iOS loses
354:   // when it closes the whole tab or the home-screen app. Opening the check again within RUN_KEEP_MS goes on where it was.
355:   // sessionStorage still names this tab (RUN_TAB_KEY): a run whose tab is still alive (its beat is fresh) is another tab's
356:   // and is left alone, so a second open copy never reads a running screen as one that closed the tab. A check the player
357:   // leaves (hidden tab, Back, a closed tab) clears the run at once, so only a page that died leaves a screen open.
358:   const RUN_KEY="careerModeShowdown.deviceCheckRun.v1",RUN_TAB_KEY="careerModeShowdown.deviceCheckTab.v1";
359:   const RUN_KEEP_MS=30*60000,RUN_LIVE_MS=15000,RUN_BEAT_MS=5000;
360:   // A run saved by another build is not picked up (Codex on #1473): the update may have fixed what closed the tab, so it
361:   // must not write a cap for the new build. It is let go, and the check starts fresh when asked.
362:   const BUILD=T&&T.build||"";
363:   const TAB=(()=>{try{const ss=sessionStorage;let id=ss.getItem(RUN_TAB_KEY);
364:     if(!id){id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;ss.setItem(RUN_TAB_KEY,id);id=ss.getItem(RUN_TAB_KEY);}return id||"";}catch(_error){return "";}})();
365:   // r96: v2 runs keep each screen's own stop (stops), so a lighter screen climbs on past a level a heavier one stopped at.
366:   // A run saved by another build, or by an older copy of this page (v1: one climb for all screens), is let go; so is one
367:   // last saved more than RUN_KEEP_MS ago. {busy:true}: another open tab is running it.
368:   function runRead(){try{const v=JSON.parse(readStorageValue(RUN_KEY)||"null");if(!v||typeof v!=="object")return null;
369:     if(v.build!==BUILD||v.v!==2||!(Array.isArray(v.results)&&Number.isInteger(v.level)&&Number.isInteger(v.scene)&&v.stops&&typeof v.stops==="object")){runSave(null);return null;}
370:     const age=Date.now()-Number(v.beat||v.at||0);
371:     if(!(age>=0&&age<=RUN_KEEP_MS)){runSave(null);return null;}
372:     if(v.tab!==TAB&&age<RUN_LIVE_MS)return {busy:true};
373:     return v;}catch(_error){return null;}}
374:   function runSave(v){try{if(v){v.tab=TAB;v.beat=Date.now();}return writeStorageValue(RUN_KEY,v?JSON.stringify(v):"null")!==false;}catch(_error){return false;}}
375:   function runKeeps(){if(!TAB)return false;try{writeStorageValue(RUN_KEY,"probe");const ok=readStorageValue(RUN_KEY)==="probe";writeStorageValue(RUN_KEY,"null");return ok;}catch(_error){return false;}}
376:   let reloading=false,live=null,beat=0;
377:   function stopBeat(){live=null;if(beat){clearInterval(beat);beat=0;}}
378:   // Why one screen stopped climbing, in a sentence.
379:   function stopText(sc,stop){
380:     const r=results[stop.level][sc.key]||{};
381:     if(r.died)return `The tab closed while ${sc.name} was playing at ${LEVELS[stop.level]}.`;
382:     if(r.crashed)return `${LEVELS[stop.level]} was not tried: the tab closed at that level last time.`;
383:     return `${LEVELS[stop.level]} was not held: ${sc.name} ${stop.state==="failed"?"failed":"was not smooth"} there.`;
384:   }
385:   async function run(resume){
386:     if(running||!T)return;
387:     // A fresh start never writes over a run another live tab is playing (Codex on #1553).
388:     if(!resume&&runRead()){takeOver();return;}
389:     running=true;aborted="";startBtn.disabled=true;forgetBtn.hidden=true;result.innerHTML="";
390:     const keep=resume?true:runKeeps();
391:     const st=resume||{v:2,build:BUILD,at:Date.now(),results:LEVELS.map(()=>({})),level:0,scene:0,first:null,ended:null,stops:{},open:null,played:false};
392:     // r97: while a screen plays, the run's beat says this tab is alive (another tab opening the check leaves it alone).
393:     if(keep){stopBeat();live=st;beat=setInterval(()=>{if(live&&live.open)runSave(live);},RUN_BEAT_MS);}
394:     // r97: the screen that closed the tab, said for the rest of the run.
395:     const closed=st.closed&&SCENES[st.closed.scene]?`The tab closed while ${SCENES[st.closed.scene].name} was playing at ${LEVELS[st.closed.level]}. Going on with the other screens. `:"";
396:     for(let l=0;l<results.length;l+=1){for(const k of Object.keys(results[l]))delete results[l][k];Object.assign(results[l],st.results[l]||{});}
397:     draw();
398:     // r96: every screen climbs on its own. A screen whose first level that is not smooth (or failed) stops there; the
399:     // others go on, so the lightest screen can reach a level the heaviest cannot. r92 (Nik's iPhone 17): a screen that is
400:     // not smooth is played once more at the same level (its files are cached by then) before it counts, so one hitch (a
401:     // first upload, a pause in the browser) does not fail a level. Two slow tries do. Failed answers are not tried again.
402:     // A screen that proves nothing (not verified) still ends the whole check: nothing is saved.
403:     const climbing=k=>!st.stops[k];
404:     while(!aborted&&!st.ended&&st.level<=TOP){
405:       if(!SCENES.some(sc=>climbing(sc.key)))break;
406:       if(st.scene>=SCENES.length){st.scene=0;st.level+=1;continue;}
407:       if(!climbing(SCENES[st.scene].key)){st.scene+=1;continue;}
408:       const level=st.level,scene=SCENES[st.scene],second=Boolean(st.first);
409:       status.textContent=`${closed}${scene.name} · ${LEVELS[level]} (${level+1} of ${TOP+1})${second?", second try":""}…`;
410:       const tc=tabCrash();
411:       let got;
412:       // r97: a level that closed the tab is not opened again on the screen that closed it; the other screens go on climbing
413:       // (each opens in a fresh page, and the check's frames draw the level asked whatever the cap). A cap whose screen is
414:       // not known holds every screen, as before.
415:       const held=capLevel(tc,scene.key);
416:       if(held!==null&&level>held)got={crashed:true};
417:       else{
418:         // A screen already played in this page is let go before the next one opens: a fresh page for each screen.
419:         if(keep&&st.played){st.played=false;if(runSave(st)){reloading=true;location.reload();return;}}
420:         st.open={level,scene:st.scene};if(keep)runSave(st);
421:         got=await wait(scene,level);
422:         if(got&&got.aborted)break;
423:         st.open=null;st.played=true;
424:       }
425:       if(second){
426:         // A second try that gives no clean answer (it did not start, did not finish) does not undo the first, clean one.
427:         const j2=judge(level,scene,got);
428:         got=j2&&j2.state==="unverified"?{...st.first,retryWhy:j2.why||""}:{...got,firstTry:st.first};st.first=null;
429:       }else if(judge(level,scene,got).state==="slow"){
430:         st.first=got;st.results[level][scene.key]=results[level][scene.key]=got;draw();if(keep)runSave(st);continue;
431:       }
432:       st.results[level][scene.key]=results[level][scene.key]=got;draw();
433:       const j=judge(level,scene,got);
434:       if(j.state==="unverified")st.ended={level,scene:st.scene,state:j.state,why:j.why||""};
435:       else if(j.state!=="smooth")st.stops[scene.key]={level,state:j.state};
436:       st.scene+=1;
437:       // A screen not smooth even at Light: nothing can be saved (see below), so the others are not played for it.
438:       if(level===0&&st.stops[scene.key]){if(keep)runSave(st);break;}
439:       if(keep)runSave(st);
440:     }
441:     stopBeat();runSave(null);
442:     // Everything a screen did not reach is not tried.
443:     for(let l=0;l<=TOP;l+=1)for(const sc of SCENES)if(!results[l][sc.key]&&!aborted)results[l][sc.key]={skipped:true};
444:     const ended=st.ended?{...st.ended,scene:SCENES[st.ended.scene]}:null;
445:     draw();
446:     stage.innerHTML="<div class=\"idle\">Done.</div>";
447:     running=false;startBtn.disabled=false;
448:     if(aborted){status.textContent=aborted;showSaved("The check was stopped, so nothing changed.");return;}
449:     // Each screen's best: the level under its stop, or the top.
450:     const best={};for(const sc of SCENES){const stop=st.stops[sc.key];best[sc.key]=stop?stop.level-1:TOP;}
451:     const low=Math.min(...SCENES.map(sc=>best[sc.key]));
452:     // Not verified: the check proves nothing about that level, so the run is not a result. Nothing is saved; the last
453:     // good result (if any) stays as it is.
454:     if(ended&&ended.state==="unverified"){
455:       // What every screen held before the stop (a screen that stopped lower counts at its own best).
456:       const ok=Math.min(ended.level-1,low);
457:       const passed=ok>0?` ${LEVELS[ok]} and below were smooth.`:ok===0?` ${LEVELS[0]} was smooth.`:"";
458:       status.textContent=`Check not finished: ${ended.scene.name} at ${LEVELS[ended.level]} was not verified. ${ended.why}`;
459:       showSaved(`The check did not finish, so nothing changed.${passed}`);
460:       return;
461:     }
462:     // r92 (Nik's iPhone 17, Apple GPU guessed High): even Light not smooth, twice, on a screen. There is no level below
463:     // Light, so this cannot show which level is too heavy here; it must not replace the guess or a good earlier result.
464:     // Nothing is saved.
465:     if(low<0){
466:       const weak=SCENES.find(sc=>best[sc.key]<0);
467:       let keeps=LEVELS[1];try{const m=T.measured();keeps=LEVELS[m?m.level:T.device().guessLevel]||keeps;}catch(_error){}
468:       status.textContent=`${LEVELS[0]} was not smooth on ${weak.name} here, so Auto keeps ${keeps}. Check again later.`;
469:       showSaved("Nothing changed.");
470:       return;
471:     }
472:     const stopped=SCENES.filter(sc=>st.stops[sc.key]).sort((a,b)=>st.stops[a.key].level-st.stops[b.key].level);
473:     // r97: a tab that closed mid-check stops only the screen that was playing; the others climbed on.
474:     const died=stopped.find(sc=>(results[st.stops[sc.key].level][sc.key]||{}).died);
475:     const why=stopped.length?`Check done. ${[...new Set(stopped.map(sc=>stopText(sc,st.stops[sc.key])))].join(" ")}${stopped.length<SCENES.length?` ${SCENES.filter(sc=>!st.stops[sc.key]).map(sc=>sc.name).join(", ")} ${SCENES.length-stopped.length>1?"were":"was"} smooth up to ${LEVELS[TOP]}.`:""}`
476:       :`Check done. Every level up to ${LEVELS[TOP]} was smooth.`;
477:     // r92 (Nik 2026-11-14, "Go" on the simple plan): the check only ever raises Auto above the level the graphics chip
478:     // starts at. r96: per screen too. A screen below it draws the chip's level; a result where no screen is above the
479:     // chip's level and one is below it is not saved, and an earlier result is let go: Auto is the chip's level again.
480:     let chip=0;try{chip=T.device().guessLevel;}catch(_error){chip=0;}
481:     const high=Math.max(...SCENES.map(sc=>best[sc.key]));
482:     if(low<chip&&high<=chip){
483:       T.clearMeasured();
484:       // A tab that closed during this check (or before it) holds Auto below that level for now: say so, so the line and the
485:       // top card agree with what the game draws.
486:       const tc=tabCrash(),lowNote=tc&&tc.level<chip?` For now ${capDraws(tc)} at most, because the tab closed at ${LEVELS[tc.from]||"a higher level"}.`:"";
487:       const done=died?` ${LEVELS[0]}${low>0?` to ${LEVELS[low]}`:""} ${low>0?"were":"was"} smooth.`:"";
488:       status.textContent=`${why}${done} Auto stays on ${LEVELS[chip]}, the level your graphics chip starts at. The check only ever raises Auto.${lowNote}`;
489:       showSaved();
490:       return;
491:     }
492:     const level=Math.max(chip,low),own=Object.fromEntries(SCENES.map(sc=>[sc.key,Math.max(chip,best[sc.key])]));
493:     const pick=r=>r&&Number.isFinite(r.avg)?[r.avg,r.p1low,+(+r.pixelRatio).toFixed(2),...(Array.isArray(r.size)?r.size:[0,0])]:null;
494:     // stop: the lowest screen's stop (what a 2.8.0 reader shows); stops: every screen's.
495:     const first=stopped[0];
496:     T.setMeasured(level,{scenes:SCENES.map(sc=>sc.key),held:true,
497:       stop:first?{level:st.stops[first.key].level,scene:first.key,state:st.stops[first.key].state}:null,
498:       stops:Object.fromEntries(stopped.map(sc=>[sc.key,{level:st.stops[sc.key].level,state:st.stops[sc.key].state}])),
499:       levels:results.slice(0,TOP+1).map(r=>Object.fromEntries(SCENES.map(sc=>[sc.key,pick(r[sc.key])])))},own);
500:     status.textContent=why;
501:     showSaved();
502:   }
503:   // A hidden tab stops drawing, so its numbers would be wrong: stop and say so.
504:   // r97: the run is let go at once (the page may not run again), so only a page that died leaves a screen open.
505:   document.addEventListener("visibilitychange",()=>{if(running&&!reloading&&document.visibilityState==="hidden"){aborted="The tab was hidden, so the check stopped. Start it again and keep the tab in front.";stopBeat();runSave(null);if(cancelWait)cancelWait();stage.replaceChildren();}});
506:   window.addEventListener("pagehide",()=>{if(running&&!reloading){stopBeat();runSave(null);}});
507:   startBtn.addEventListener("click",()=>run());
508:   forgetBtn.addEventListener("click",()=>{T.clearMeasured();showSaved();status.textContent="Auto goes back to its starting guess from this device's graphics chip.";});
509:   if(!T){startBtn.disabled=true;status.textContent="The check could not load. Reload the page.";}
510:   draw();showSaved();
511:   {const tc=tabCrash(),who=capName(tc);if(T&&tc)status.textContent=`Last time the tab closed during ${who||"a 3D screen"} at ${LEVELS[tc.from]||"a level"}. ${(d=>d[0].toUpperCase()+d.slice(1))(capDraws(tc))} at most for now, and this check stops ${who?`${who} `:""}below ${LEVELS[tc.from]||"that level"}.`;}
512:   // r93: a check under way goes on in this fresh page. r97: so does one whose screen was still open when the page died
513:   // (the tab reloaded, or was closed and the check opened again): that screen stops at the level that closed the tab, the
514:   // rows already done are kept, and the other screens go on climbing.
515:   // A run another open tab is playing is left to it; once its beat stops (that tab died too), this page takes it over.
516:   function takeOver(){const st=T&&!running?runRead():null;
517:     // Start waits too (Codex on #1553): a new run would overwrite the one being played, or one this page is about to take over.
518:     if(st&&st.busy){status.textContent="A Device check is running in another tab. Keep one check open at a time.";startBtn.disabled=true;setTimeout(takeOver,RUN_LIVE_MS);return;}
519:     if(T&&!running)startBtn.disabled=false;
520:     if(st){
521:       if(st.open&&SCENES[st.open.scene]&&st.results[st.open.level]){
522:         const lv=st.open.level,key=SCENES[st.open.scene].key;st.results[lv][key]={died:true};
523:         // The level that closed the tab is held below for now in play (js/gfxTier.js tabDied), as after a death while opening.
524:         try{if(lv>0&&T.tabDied)T.tabDied(lv,key);}catch(_error){}
525:         if(lv>0){st.stops[key]={level:lv,state:"failed"};st.scene=st.open.scene+1;st.level=lv;st.closed={level:lv,scene:st.open.scene};}
526:         else st.ended={level:lv,scene:st.open.scene,state:"unverified",why:"The tab closed while this screen was playing."};
527:         st.open=null;st.first=null;st.played=false;
528:       }
529:       run(st);
530:     }}
531:   takeOver();
532: })();
533: </script>
534: </body>
535: </html>
536: 
```

(End of packet FJ10. Answer with the report only.)
