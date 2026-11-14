(function(root){
  "use strict";

  // One quality system for every 3D screen (r90): adapt to the device, so a Chromebook runs smooth and a high-end PC gets up to 4K. Plain script, no imports: the root page and the roulette page (../../../js/gfxTier.js) load the same file.
  // Use: p=profile() before the WebGLRenderer (antialias is fixed at context creation), then setPixelRatio(p.pixelRatio); await calibrate(renderer,draw) behind the loading screen (skipped on software GL); gov=governor(renderer,{key,draw,onChange}) (without draw it only steps down), then gov.frame(now) each frame, gov.hold(false) between beats, gov.end() on dispose; overlay(()=>({calls,tris})) shows only with ?fps=1.
  // Levels: 0 light (Chromebook class), 1 medium, 2 high, 3 extra, 4 ultra (native size, up to 2x past it within 3840x2160), 5 8k (only on a GPU with a 7680 px buffer, never a phone: up to 4x past native within 7680x4320; a lost context or refused buffer falls back to ultra, said in the ?fps=1 overlay).
  // r91 (Nik 2026-11-11: "Auto should allow all qualities based on device real test ... from light to 8k"): Auto covers every level. Its guess from the GPU name stays conservative (never past extra); the Device check (device-check.html) replaces the guess with the best level Chamber Men, Russian Roulette and the Special Player pack all held, up to ultra and, where the GPU can hold it, 8k. Below ultra, Auto never renders above devicePixelRatio.
  // A picked level is held as picked (the governor moves only Auto). Scene knobs (crowd, bloom, shadow size) read the profile; the governor only moves the pixel ratio: down when frames run long, up only after a timed frame shows room, never back to a step that ran slow (no see-saw).
  const KEY="careerModeShowdown.gfxQuality.v1";
  const CHOICES=["auto","light","medium","high","extra","ultra","8k"];
  const NAMES=["light","medium","high","extra","ultra","8k"];
  // r90 (Nik 2026-11-08: "unified levels for our screens"): the one list of level names a player ever reads (Settings, the
  // Device check, the ?fps=1 overlay). docs/QUALITY_LEVELS.md; tests/contracts/r90-quality-levels-contracts.cjs.
  const LABELS=["Light","Balanced","High","Extra","Ultra (4K)","8K"];
  // Per level: the pixel ratio it starts at and may reach (both capped by the screen), shadow map size, crowd density, bloom.
  const LEVELS=[
    {pr:1,max:1,shadowSize:1024,density:.45,bloom:false},
    {pr:1.25,max:1.5,shadowSize:1024,density:.7,bloom:true},
    {pr:1.5,max:2,shadowSize:2048,density:1,bloom:true},
    {pr:2,max:3,shadowSize:2048,density:1,bloom:true},
    {pr:2,max:4,shadowSize:4096,density:1,bloom:true},
    // r90 (Nik 2026-11-07, "8K as well as 4K"): on a GPU that can hold a 7680 px buffer, never on a phone; picked, or (r91) measured by the Device check.
    {pr:2,max:8,shadowSize:4096,density:1,bloom:true}
  ];
  const BUDGET_MS=16.7,BUFFER_CAP=3840*2160,BUFFER_CAP_8K=7680*4320,PHONE_MAX_PR=3,PHONE_TEX_MAX=1,PHONE_MSAA_MAX=4,PHONE_EXTRA_PR=2.25;
  // "Never crash" first (Nik 2026-11-08): a lost context, an out-of-memory error, or (8K) a buffer or target the GPU would
  // not give drops this device one level below the one that failed and remembers it (any level, Auto or picked) until the
  // player picks a level again in Settings.
  const CAP_KEY="careerModeShowdown.gfxCap.v1";
  const MEMORY_KEY=key=>`careerModeShowdown.gfxSettled.v1.${key}`;
  // r91: where a scene's heavy parts settled (its detail step, for the level it was built at), read on its next visit.
  const DETAIL_KEY=key=>`careerModeShowdown.gfxDetail.v1.${key}`,DETAIL_DAYS_MS=7*864e5;
  // The Device check (device-check.html) saves the best level this device held at 60 fps; Auto starts there.
  // r91: a new key. A 2.3.0 result (…gfxMeasured.v1) came from a check that timed two scenes and could save a level one of
  // them never drew, so it is not read; Auto goes back to its guess until the check is run again.
  const MEASURED_KEY="careerModeShowdown.gfxMeasured.v2";
  // ?bench=1 (Device check frames): no adapting. Frame times are recorded after BENCH_SETTLE_MS for at least BENCH_MS and until
  // the scene has played one whole beat (a kick, a turn, a reveal: one gov.hold(true) .. gov.hold(false)); a scene that has not
  // finished one by BENCH_MAX_MS posts what it has, marked incomplete. Posted once.
  const BENCH_SETTLE_MS=500,BENCH_MS=10000,BENCH_MAX_MS=60000;
  let cached=null,active=null;

  // Saved through the app's own storage helpers (js/storage.js); the roulette page is a same-origin frame and uses its parent's.
  function gfxStore(name){
    if(typeof root[name]==="function")return root[name];
    try{if(root.parent&&root.parent!==root&&typeof root.parent[name]==="function")return root.parent[name];}catch(_error){}
    return null;
  }
  function gfxRead(k){try{const f=gfxStore("readStorageValue");return f?f(k):null;}catch(_error){return null;}}
  function gfxWrite(k,v){try{gfxStore("writeStorageValue")?.(k,String(v));}catch(_error){}}
  function gfxQuery(name){
    const get=w=>{try{return new URLSearchParams(w.location.search).get(name);}catch(_error){return null;}};
    const own=get(root);if(own!==null)return own;
    try{if(root.parent&&root.parent!==root)return get(root.parent);}catch(_error){}
    return null;
  }
  function gfxChoice(){const c=String(gfxRead(KEY)||"auto").toLowerCase();return CHOICES.includes(c)?c:"auto";}
  // A picked choice is its level: light 0 .. ultra 4, 8k 5.
  function gfxChoiceLevel(c){return CHOICES.indexOf(c)-1;}
  // r92 (Nik 2026-11-14, iPhone 17): a 2.4.0 check where even Light was not smooth saved Light "not held", and that
  // replaced a High guess for good. A stall at Light says nothing about which level the device can hold (there is no level
  // below), so such a result is not read: Auto goes back to its guess. A check never saves one now (device-check.html).
  // r92 (Nik 2026-11-14, "Go" on the simple plan): the check only ever raises Auto. Auto is the higher of the check's
  // result and the level the graphics chip starts at, so a result below the chip's level (one saved by 2.4.0) is not read.
  function gfxMeasured(){
    try{const m=JSON.parse(gfxRead(MEASURED_KEY)||"null");if(!(m&&Number.isInteger(m.level)&&m.level>=0&&m.level<=5&&!(m.detail&&m.detail.held===false)))return null;
      return m.level>=gfxChipLevel()?m:null;}catch(_error){return null;}
  }
  // The level Auto starts at from the graphics chip and the device (memory, threads, phone): the check's floor.
  function gfxChipLevel(){try{return gfxClassify(gfxGpuInfo().name,gfxScreenEnv()).level;}catch(_error){return 0;}}

  // The GPU's own name and its largest buffer and texture, from a throwaway context (released at once). r90 MOTION round 2:
  // the first WebGL context of a page starts the GPU side (735-887 ms on a Chromebook, one long task), so the answer is kept
  // per browser (same user agent) and later opens read it back; Auto picks exactly what a fresh probe would.
  const GPU_KEY="careerModeShowdown.gfxGpu.v1";
  function gfxGpuInfo(){
    const ua=String(root.navigator?.userAgent||"");
    try{const k=JSON.parse(gfxRead(GPU_KEY)||"null");if(k&&k.ua===ua&&typeof k.name==="string")return {name:k.name,maxBuffer:Number(k.maxBuffer)||0,maxTexture:Number(k.maxTexture)||0};}catch(_error){}
    try{
      const c=root.document.createElement("canvas"),gl=c.getContext("webgl2")||c.getContext("webgl");if(!gl)return {name:"",maxBuffer:0,maxTexture:0};
      const ext=gl.getExtension("WEBGL_debug_renderer_info");
      const name=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||"");
      const maxBuffer=Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))||0,maxTexture=Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||0;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gfxWrite(GPU_KEY,JSON.stringify({ua,name,maxBuffer,maxTexture}));
      return {name,maxBuffer,maxTexture};
    }catch(_error){return {name:"",maxBuffer:0,maxTexture:0};}
  }
  // Auto level from the GPU name, then held down by a small memory or few cores. r90 (Nik 2026-11-07: an iPhone 17 runs
  // the best it can hold; only weak phones get Light): a phone is not capped by being a phone. A strong phone GPU (Apple GPU,
  // Adreno 7xx and up, Mali-G7xx / Immortalis) starts at High and calibrate moves it from there; older Mali, PowerVR and
  // Adreno 5xx and below start at Light.
  function gfxClassify(gpu,env){
    const g=String(gpu||"").toLowerCase(),e=env||{};
    const software=/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(g);
    const strongPhone=/apple gpu|adreno (\(tm\) )?([7-9]\d\d|\d{4})\b|immortalis|mali-g7\d\d/.test(g);
    let level=1;
    if(software)level=0;
    else if(strongPhone)level=2;
    // Mali-G76/G77/G78 and G610/G615 (2019-2022 flagships, two-digit or 6x0 names) start Balanced; calibrate can lift them.
    else if(/mali-g7[6-9]\b|mali-g6[1-9]\d\b/.test(g))level=1;
    else if(/mali|powervr|adreno \(tm\) [1-5]\d\d\b|adreno [1-5]\d\d\b|intel.*\b(hd|uhd) graphics( [2-6]\d\d)?\b|apple a(9|1[0-2])\b/.test(g))level=0;
    else if(/rtx [2-9]0[6-9]0|rtx [4-9]0\d0|radeon rx [6-9]\d{3}|apple m[1-9] (pro|max|ultra)/.test(g))level=3;
    else if(/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|apple m[1-9]|apple gpu/.test(g))level=2;
    else if(/iris|adreno [6-9]\d\d|adreno \(tm\) [6-9]\d\d|radeon/.test(g))level=1;
    const mem=Number(e.deviceMemory)||0,cores=Number(e.cores)||0,phone=Boolean(e.phone);
    if(mem&&mem<=2)level=0;else if(mem&&mem<=4)level=Math.min(level,1);
    // Phones report few cores (or a capped count); on a phone the GPU name and calibrate decide.
    if(!phone&&cores&&cores<=4)level=Math.min(level,1);
    return {level,software,strongPhone};
  }
  function gfxScreenEnv(){
    const s=root.screen||{};
    return {dpr:Math.max(.5,Number(root.devicePixelRatio)||1),deviceMemory:root.navigator?.deviceMemory,cores:root.navigator?.hardwareConcurrency,
      phone:Math.min(s.width||1e4,s.height||1e4)<700};
  }
  // The largest a canvas can be on this page, in CSS pixels. A page with no size yet (a frame built before it is shown)
  // is taken to be as large as the screen, the most it can become; 0 only when neither is known.
  function gfxViewPx(){
    try{const w=Number(root.innerWidth)||0,h=Number(root.innerHeight)||0;if(w>0&&h>0)return w*h;
      const s=root.screen||{},sw=Number(s.width)||0,sh=Number(s.height)||0;return sw>0&&sh>0?sw*sh:0;}catch(_error){return 0;}
  }
  // 8K needs a GPU that can hold a 7680 px buffer and texture; never software GL, never a phone.
  function gfxCan8k(info,env){return Boolean(info&&!info.software&&!(env&&env.phone)&&info.maxBuffer>=7680&&info.maxTexture>=7680);}
  // r91 (Nik 2026-11-12, after the device lab found Settings offering Ultra and 8K on a 2-thread 4 GB Chromebook): on a weak
  // device, Ultra (4K) and 8K are offered only once the Device check has passed them there. Weak: 2 processor threads or
  // fewer, or 4 GB of memory or less, as the browser reports them (a browser that reports no memory is judged by its
  // threads). Every other device keeps the full list. A level the check passed is the measured level or one below it.
  function gfxWeak(env){
    const c=Number(env&&env.cores),m=Number(env&&env.deviceMemory);
    return (Number.isFinite(c)&&c>0&&c<=2)||(Number.isFinite(m)&&m>0&&m<=4);
  }
  // r91 (Nik 2026-11-12: "based on your graphic card, this is what we suggest, or based on your CPU ... so everyone can look
  // at that table and understand what is recommended for them"): the level guide, shown on the Device check page.
  // GUIDE says in plain words what gfxClassify above does, so the two change together
  // (tests/contracts/r91-level-guide-contracts.cjs runs named chips through gfxClassify against these rows).
  // who = the graphics chips that start at the level; draws = what the level draws. It promises no frame rate: only the
  // Device check measures one.
  const GUIDE=[
    {who:"Intel HD and UHD Graphics. Older phone chips: most Mali, PowerVR, Adreno 5xx and below, Apple A9 to A12. A device with no graphics chip.",
      draws:"The lightest picture: a dark room, a smaller crowd, no glow."},
    {who:"Intel Iris. Built-in AMD Radeon. Adreno 6xx. Mali-G76 to G78, G610 and G615. Any chip this table does not name.",
      draws:"Adds glow and a slightly larger crowd."},
    {who:"NVIDIA GeForce GTX and RTX. AMD Radeon RX and Radeon Pro. Apple M1 and later. Strong phones: iPhone and iPad, Adreno 7xx and up, Mali-G7xx, Immortalis.",
      draws:"A full crowd, sharper shadows and a first hint of the marble caf\u00e9."},
    {who:"NVIDIA RTX 2060 to 2090, 3060 to 3090, and every RTX 40 or later. AMD Radeon RX 6000 and later. Apple M Pro, Max and Ultra.",
      draws:"The whole marble caf\u00e9, and up to 3x sharpness on a sharp computer screen (2.25x on a phone)."},
    {who:"No chip starts here. The Device check gives it to a device that keeps all three 3D screens smooth at this level.",
      draws:"Draws past the screen\u2019s own sharpness, up to a 4K picture, with the sharpest shadows."},
    {who:"The same, on a graphics chip that can hold a 7680 px picture. Never a phone.",
      draws:"Draws up to an 8K picture."}
  ];
  // The two limits of gfxClassify in words (the contract runs them too).
  const GUIDE_LIMITS="Memory and processor can hold a device below its chip\u2019s row. 2 GB of memory or less starts at Light. 4 GB or less, or a computer with 4 processor threads or fewer, starts no higher than Balanced. Threads are not counted on a phone.";
  // A chip's name as a person reads it: "ANGLE (Intel, Vulkan 1.3.0 (Intel(R) UHD Graphics (JSL) (0x00004E55)), Mesa 25.0.7)"
  // is "Intel UHD Graphics (JSL)". Empty when the browser names none.
  function gfxChipName(raw){
    let s=String(raw||"").trim();
    const angle=s.match(/^ANGLE \((.*)\)$/);
    if(angle){const parts=angle[1].split(/,\s+/);s=parts[1]||parts[0]||"";}
    s=s.replace(/^ANGLE Metal Renderer:\s*/i,"").replace(/^Vulkan [\d.]+ \((.*)\)$/,"$1").replace(/\((r|tm|c)\)/ig," ")
      .replace(/\s*\(0x[0-9a-f]+\)/ig,"").replace(/\s+(Direct3D|OpenGL|D3D\d|Metal\b).*$/i,"").replace(/\/PCIe.*$/i,"").replace(/\s+/g," ").trim();
    return s.length>64?`${s.slice(0,63).trim()}\u2026`:s;
  }
  // What each part of this device says on its own. chip = the level its graphics chip starts at; memoryCap and threadCap =
  // the level memory and processor threads hold it to (null: no limit; threads are not counted on a phone). level = Auto's
  // starting level, the lowest of the three. measured = the level the Device check saved here (null before a check).
  // The one row marked mine is the measured level, or the starting level before a check.
  function gfxGuide(){
    const p=gfxProfile(),env=gfxScreenEnv(),phone=Boolean(env.phone),mem=Number(env.deviceMemory)||0,cores=Number(env.cores)||0;
    const chip=gfxClassify(p.gpu,{phone}).level,m=gfxMeasured(),mine=m?m.level:p.guessLevel;
    return {limits:GUIDE_LIMITS,rows:GUIDE.map((r,level)=>({level,label:LABELS[level],who:r.who,draws:r.draws,mine:level===mine})),
      device:{phone,software:Boolean(p.software),chipName:gfxChipName(p.gpu),chip,memory:mem||null,memoryCap:mem&&mem<=2?0:mem&&mem<=4?1:null,
        threads:cores||null,threadCap:!phone&&cores&&cores<=4?1:null,level:p.guessLevel,measured:m?m.level:null,weak:gfxWeak(env),can8k:Boolean(p.can8k)}};
  }
  // The highest level at or under `level` that may be picked by hand here (4 and 5 are the gated ones).
  function gfxPickable(level,env,can8k,measured){
    let l=level===5&&!can8k?4:level;
    if(l>=4&&gfxWeak(env)){const held=measured?measured.level:-1;l=Math.min(l,Math.max(3,held));}
    return l;
  }
  // The cap is not for ever (lead review on #1271): one stray driver reset must not cost a level for good. It expires after
  // 7 days, or after 3 clean scenes (20 s or more, no failure) at the capped level.
  const CAP_DAYS_MS=7*864e5,CAP_CLEAN=3,CAP_CLEAN_MS=20000;
  function gfxCap(){
    try{const v=JSON.parse(gfxRead(CAP_KEY)||"null");if(!(v&&v.reason&&Number.isInteger(v.level)&&v.level>=0&&v.level<=4))return null;
      if(Date.now()-Number(v.at||0)>CAP_DAYS_MS||(v.clean|0)>=CAP_CLEAN){gfxWrite(CAP_KEY,"null");return null;}return v;}catch(_error){return null;}
  }
  function gfxCapClean(level){const v=gfxCap();if(!v||v.level!==level||v.tab)return;v.clean=(v.clean|0)+1;gfxWrite(CAP_KEY,v.clean>=CAP_CLEAN?"null":JSON.stringify(v));if(v.clean>=CAP_CLEAN)cached=null;}
  // r91: a tab that dies while a 3D screen opens. A lost WebGL context is caught (gfxFail); a tab the browser kills for
  // memory, or one the player has to reload because it hung, is not: nothing runs, the level stays, and the next open dies
  // the same way (2.3.0: Roulette on the Chromebook, first open). So a scene leaves a mark while it opens and takes it
  // away once it is running (its first beat played, or 20 s of frames), when it ends, and when its page is hidden or left
  // (a reload, a closed tab and a removed frame all say goodbye first). A mark still there when the same tab loads the
  // game again was left by a page that died: the level that was opening is capped one down, like a GPU failure. That
  // cap does not lift after clean scenes (the level would only kill the tab again); it ends after 7 days or with a pick
  // in Settings. Only that one case counts: a mark from another tab proves nothing and is left to go stale. Where the
  // tab cannot be told apart (no sessionStorage, no page load time) there is no guard.
  // Chamber Men, on the game's own page, marks before it builds (sceneOpening): its heaviest moment is the load and the
  // texture upload, before any governor exists (review P3 on #1409). A mount that ends without a scene takes the mark off.
  // Known and accepted: the browser's "Duplicate tab" copies sessionStorage, so a duplicate made in the seconds a 3D
  // screen is opening reads as that tab reloaded after a death and caps one level. It only ever lowers, by one level,
  // for at most 7 days or until a pick in Settings.
  const OPEN_KEY="careerModeShowdown.gfxOpening.v1",TAB_KEY="careerModeShowdown.gfxTab.v1",OPEN_RUN_MS=20000,OPEN_STALE_MS=864e5;
  const TAB_CRASH="the tab closed while this 3D screen was opening";
  let opening=null,openedHere=false;
  const gfxFramed=()=>{try{return Boolean(root.parent&&root.parent!==root);}catch(_error){return false;}};
  // This tab (kept by the browser across a reload, and across a crash and reload) and this load of the game's page.
  function gfxTabId(){
    try{const ss=root.sessionStorage;if(!ss)return "";let id=ss.getItem(TAB_KEY);
      if(!id){id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;ss.setItem(TAB_KEY,id);id=ss.getItem(TAB_KEY);}return id||"";}catch(_error){return "";}
  }
  function gfxTopLoad(){
    let v;try{v=root.top&&root.top.performance&&root.top.performance.timeOrigin;}catch(_error){v=undefined;}
    if(typeof v!=="number"){try{v=gfxFramed()?undefined:root.performance&&root.performance.timeOrigin;}catch(_error){v=undefined;}}
    return typeof v==="number"&&v>0?String(v):"";
  }
  function gfxOpenList(){try{const v=JSON.parse(gfxRead(OPEN_KEY)||"[]");return Array.isArray(v)?v.filter(m=>m&&typeof m.id==="string"&&Number.isInteger(m.level)):[];}catch(_error){return [];}}
  // Read the marks: one this tab left on an earlier load is a death; stale ones go. Runs once, when the module loads
  // (before any profile is built, so the scene that is about to open already gets the lower level).
  function gfxOpenSweep(){
    const tab=gfxTabId(),top=gfxTopLoad();if(!tab||!top)return null;
    const all=gfxOpenList();if(!all.length)return null;
    const keep=[];let died=null;
    for(const m of all){
      if(!(Date.now()-Number(m.at||0)<=OPEN_STALE_MS))continue;
      if(m.tab===tab&&m.top&&m.top!==top){if(!died||m.level<died.level)died=m;continue;}
      keep.push(m);
    }
    if(keep.length!==all.length)gfxWrite(OPEN_KEY,JSON.stringify(keep));
    if(!died)return null;
    const old=gfxCap(),level=Math.max(0,Math.min(died.level>=5?4:died.level-1,old?old.level:4));
    gfxWrite(CAP_KEY,JSON.stringify({level,reason:TAB_CRASH,tab:true,from:died.level,scene:String(died.scene||""),bench:Boolean(died.bench),at:Date.now()}));
    cached=null;return died;
  }
  function gfxOpenArm(level,scene){
    if(opening||!(level>0))return;
    try{if(root.document&&root.document.visibilityState==="hidden")return;}catch(_error){}
    const tab=gfxTabId(),top=gfxTopLoad();if(!tab||!top)return;
    const id=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
    opening={id,first:0};
    gfxWrite(OPEN_KEY,JSON.stringify(gfxOpenList().slice(-5).concat({id,tab,top,level,scene:String(scene||""),bench:gfxQuery("bench")==="1",at:Date.now()})));
  }
  function gfxOpenDone(){
    if(!opening)return;const id=opening.id;opening=null;
    const all=gfxOpenList(),keep=all.filter(m=>m.id!==id);if(keep.length!==all.length)gfxWrite(OPEN_KEY,JSON.stringify(keep));
  }
  // A scene that has drawn for 20 s is open.
  function gfxOpenFrame(t){if(!opening)return;if(!opening.first)opening.first=t;else if(t-opening.first>=OPEN_RUN_MS)gfxOpenDone();}
  try{root.addEventListener?.("pagehide",gfxOpenDone);root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")gfxOpenDone();});}catch(_error){}
  // Downloads follow the connection as well as the device (Nik 2026-11-08): Save-Data, or a 2g/3g connection, loads one
  // size down; the drawing level stays.
  function gfxSlowNet(){
    try{const c=root.navigator&&root.navigator.connection;if(!c)return false;return Boolean(c.saveData)||/^(slow-2g|2g|3g)$/.test(String(c.effectiveType||""));}catch(_error){return false;}
  }
  function gfxBuild(level,base){
    let fellBack=null;
    if(level===5&&!base.can8k)level=4;
    // The Device check asks for one exact level and reports what was drawn; an older crash cap does not stand in for it (a
    // failure during the check writes the cap as always, and from then on this frame honours it and reports the failure).
    const cap=base.bench&&!benchFailed?null:gfxCap();if(cap&&level>cap.level){fellBack={...cap,from:level};level=cap.level;}
    const L=LEVELS[level],dpr=base.dpr,phone=Boolean(base.phone);
    // Auto and the named levels stay at or under the screen's own ratio; ultra and 8K always reach it (a 4K or 8K screen
    // draws at native size) and may draw past it (2x, 4x) while the buffer stays within 3840x2160 (8K: 7680x4320; the
    // governor checks). A phone never draws past 3x its CSS size, nor past a 4K buffer (iOS memory).
    let max=level>=4?Math.max(dpr,(level===5?4:2)*dpr):Math.min(L.max,dpr);
    if(phone)max=Math.min(max,Math.max(1,Math.min(PHONE_MAX_PR,dpr)));
    // r92 phone memory budget (tests/browser/phone-memory-budget.cjs): at Extra a phone stops at 2.25x. At 3x Special
    // Player's targets took it to about 370 MB on the iPhone 17 profile, over the 300 MB a phone screen may use.
    if(phone&&level===3)max=Math.min(max,PHONE_EXTRA_PR);
    const min=Math.min(1,dpr,max),assetLevel=Math.max(0,Math.min(4,phone&&level<2?level-1:level)-(base.slowNet?1:0));
    // r91 (device lab, 2026-11-11): the buffer cap holds from the very first allocation. A scene sizes its first buffer from
    // pixelRatio before its governor exists, and 2.3.0 capped only in the governor: 8K picked on a 4K monitor first asked for
    // 15360x8640, on an 8K screen for 30720x17280; Ultra on a 4K monitor for 7680x4320. The starting
    // ratio is now what the governor would allow a canvas the size of the window: native at least, past it only within the
    // level's buffer (3840x2160; 8K: 7680x4320); a phone within 3840x2160 at any level. A page with no size yet counts as
    // large as the screen; with neither known the start is native.
    let start=Math.max(min,Math.min(level===5?max:level===4?Math.max(L.pr,dpr):L.pr,max));
    const view=gfxViewPx();
    if(view){
      if(level>=4)start=Math.min(start,Math.max(dpr,Math.sqrt((level===5?BUFFER_CAP_8K:BUFFER_CAP)/view)));
      if(phone)start=Math.min(start,Math.sqrt(BUFFER_CAP/view));
      start=Math.max(min,start);
    }
    // No size known at all (review on #1399): never past native until the governor has the canvas size.
    else start=Math.max(min,Math.min(start,dpr));
    // r92 memory proof (tests/browser/phone-memory-budget.cjs): ?gfx=N&gfxpr=top starts at the level's ceiling, the most the
    // governor may reach in play, so the memory measured is the most that level can hold (a phone within its 4K buffer).
    if(base.top)start=Math.max(start,Math.min(max,phone&&view?Math.sqrt(BUFFER_CAP/view):max));
    return {level,name:NAMES[level],choice:base.choice,gpu:base.gpu,software:base.software,dpr,phone,can8k:Boolean(base.can8k),fellBack,
      // Ultra starts at native at least (a 3x phone or 8K screen); 8K starts at its ceiling, which the governor holds to a
      // 7680x4320 buffer for the live canvas (a 1080p screen draws 4x). Past native always stays within the buffer cap.
      pixelRatio:start,maxPixelRatio:max,minPixelRatio:min,
      bufferCap:level===5?BUFFER_CAP_8K:BUFFER_CAP,
      // Textures and models by level; a phone below High loads one size down (iOS memory), and so does a slow or Save-Data
      // connection. 8K uses Ultra's assets. assetLevel is what screens download (the 2D plates too).
      // textureLevel is what the 3D scenes load. r92 (Nik's iPhone 17, 2026-11-14: the Safari tab closed while Chamber Men
      // was opening at High): on a phone it stops at PHONE_TEX_MAX, the phone file set. Chamber Men at High loaded about
      // 427 MB of textures on the iPhone profile (95 MB at Balanced) for a picture about 590x390 pixels, where the larger
      // files cannot be seen; iOS closes a tab well before the phone's memory is full.
      assetLevel,textureLevel:phone?Math.min(assetLevel,PHONE_TEX_MAX):assetLevel,slowNet:Boolean(base.slowNet),
      antialias:!base.software,shadowSize:L.shadowSize,density:L.density,bloom:L.bloom};
  }
  function gfxProfile(){
    if(cached)return cached;
    const env=gfxScreenEnv(),info=gfxGpuInfo(),gpu=info.name,c=gfxChoice(),auto=gfxClassify(gpu,env);
    const can8k=gfxCan8k({...info,software:auto.software},env);
    const forced=gfxQuery("gfx"),forcedLevel=forced!==null&&/^[0-5]$/.test(forced)?Number(forced):null;
    const measured=gfxMeasured(),autoLevel=measured?measured.level:auto.level;
    let level=forcedLevel!==null?forcedLevel:c==="auto"?autoLevel:gfxChoiceLevel(c);
    // A pick saved before the gate (or on another day's result) that this device may not pick now draws the highest level
    // it may; the pick itself stays saved, and Settings says so. ?gfx=N (the Device check's frames) is never gated.
    let gated=null;
    if(forcedLevel===null&&c!=="auto"&&level>=4){
      // (8K picked where the GPU cannot hold it draws Ultra as it always did: that is gfxBuild's fallback, not the gate.)
      const want=level===5&&!can8k?4:level,ok=gfxPickable(level,env,can8k,measured);
      if(ok<want){gated=level;level=ok;}
    }
    const bench=forcedLevel!==null&&gfxQuery("bench")==="1",top=forcedLevel!==null&&gfxQuery("gfxpr")==="top";
    cached=gfxBuild(level,{dpr:env.dpr,gpu,software:auto.software,phone:env.phone,can8k,slowNet:gfxSlowNet(),choice:forcedLevel!==null?`gfx=${forcedLevel}`:c,bench,top});
    cached.auto=c==="auto"&&forcedLevel===null;cached.autoLevel=autoLevel;cached.measured=Boolean(measured);cached.guessLevel=auto.level;cached.strongPhone=Boolean(auto.strongPhone);
    // What was asked for by ?gfx=N (null otherwise): the Device check compares it with what was drawn.
    cached.asked=forcedLevel;
    // The level that was picked, where the gate drew a lower one (null otherwise).
    cached.gated=gated;
    gfxMarkRoot(cached.level,cached.assetLevel);
    // A 3D screen in its own frame (Roulette, the pack, the Device check's frames) is opening from here on.
    if(!openedHere&&gfxFramed()){openedHere=true;gfxOpenArm(cached.level,gfxSceneName());}
    return cached;
  }
  function gfxSceneName(){try{return String(root.location.pathname||"").split("/").filter(Boolean).slice(-2).join("/");}catch(_error){return "";}}
  // r90 (Nik 2026-11-08, "the best quality it can hold, on every screen"): the resolved level on the root element as
  // html[data-gfx="0".."5"], here and on the app page around the roulette frame, so 2D screens (marble plates, blurs,
  // shadows, CSS animations) can lighten heavy effects at Light. Set when the module loads and whenever the level changes
  // (calibrate, a new pick, a Device check result, an 8K fallback).
  // html[data-assets="0".."4"] is the download size (image pickers follow it).
  function gfxMarkRoot(level,assets,ownOnly){
    const v=String(level),a=assets===undefined?null:String(assets);
    for(const w of ownOnly?[root]:[root,gfxParent()]){try{const el=w&&w.document&&w.document.documentElement;if(!el||!el.dataset)continue;
      if(el.dataset.gfx!==v)el.dataset.gfx=v;if(a!==null&&el.dataset.assets!==a)el.dataset.assets=a;}catch(_error){}}
    // Settings listens for this and reads the saved state again (a crash cap or a Device check result moves Auto).
    if(v!==lastMark){lastMark=v;try{root.dispatchEvent?.(new root.CustomEvent("cms-gfx-level",{detail:{level}}));}catch(_error){}}
  }
  let lastMark=null;
  function gfxParent(){try{return root.parent&&root.parent!==root&&root.parent.document?root.parent:null;}catch(_error){return null;}}
  function gfxRemark(){try{const p=gfxProfile();gfxMarkRoot(p.level,p.assetLevel);}catch(_error){}}
  function gfxSetLevel(level,ownOnly){const p=gfxProfile();const next=gfxBuild(Math.max(0,Math.min(4,level)),{dpr:p.dpr,gpu:p.gpu,software:p.software,phone:p.phone,can8k:p.can8k,slowNet:p.slowNet,choice:p.choice});
    next.auto=p.auto;next.autoLevel=p.autoLevel;next.measured=p.measured;next.guessLevel=p.guessLevel;next.strongPhone=p.strongPhone;cached=next;gfxMarkRoot(next.level,next.assetLevel,ownOnly);return next;}
  // The device could not hold this level (a lost context, an out-of-memory error, an 8K buffer or target refused): one
  // level down, remembered, the live governor moved at once. Scenes call gov.end() before forceContextLoss() on dispose,
  // so their own clean-up never counts; neither does a context lost while the page is hidden (the browser reclaiming it).
  let failCount=0,benchFailed="";
  function gfxFail(reason){
    if(root.document&&root.document.visibilityState==="hidden")return gfxProfile();
    failCount+=1;
    const cur=(cached||gfxProfile()).level,old=gfxCap();
    const level=Math.max(0,Math.min(cur>=5?4:cur-1,old?old.level:4));
    gfxWrite(CAP_KEY,JSON.stringify({level,reason:String(reason||"failed"),at:Date.now()}));cached=null;benchFailed=String(reason||"failed");
    try{active?.sync();}catch(_error){}
    const p=gfxProfile();gfxMarkRoot(p.level,p.assetLevel);return p;
  }
  // MSAA for a render target: the highest sample count at or under the wish that the GPU supports for both the colour format
  // (RGBA16F with hdr, else RGBA8) and DEPTH_COMPONENT24 (W3's fix on #1265; MAX_SAMPLES alone is not enough). Without the
  // query: 4, then 0.
  const sampleLists=new WeakMap();
  // r92: a phone never asks for more than PHONE_MSAA_MAX (4) samples. At Extra an 8-sample half-float target with its depth
  // buffer is about twice the memory of a 4-sample one (Special Player on an iPhone: ~146 MB of targets against ~78 MB),
  // and iOS closes a tab long before the phone's memory is full.
  function gfxSamples(renderer,want,hdr){
    let w=Math.max(0,Math.floor(Number(want)||0));if(!w)return 0;
    try{if(gfxProfile().phone)w=Math.min(w,PHONE_MSAA_MAX);}catch(_error){}
    let byFormat=sampleLists.get(renderer);if(!byFormat){byFormat={};try{sampleLists.set(renderer,byFormat);}catch(_error){}}
    const k=hdr?"hdr":"ldr";
    if(!(k in byFormat)){
      try{const gl=renderer.getContext(),q=f=>Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,f,gl.SAMPLES)||[]);
        const c=q(hdr?gl.RGBA16F:gl.RGBA8),d=q(gl.DEPTH_COMPONENT24),both=c.filter(n=>d.includes(n)).sort((a,b)=>b-a);byFormat[k]=both.length?both:null;}
      catch(_error){byFormat[k]=null;}
    }
    const list=byFormat[k]||[4];
    // Never more than asked: a GPU that lists only bigger counts gets none.
    return list.find(n=>n<=w)??0;
  }
  // After a target is (re)made: bind it once; an incomplete framebuffer steps its samples 8+ -> 4 -> 0. Returns whether it is
  // complete. On 8K, a target that is incomplete even without MSAA sends the device back to Ultra.
  function gfxCheckTarget(renderer,target){
    let ok=false;
    try{const gl=renderer.getContext();
      for(let k=0;k<3;k+=1){
        try{renderer.setRenderTarget(target);ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;}catch(_error){ok=false;}
        renderer.setRenderTarget(null);
        if(ok||!target.samples)break;
        target.samples=target.samples>4?4:0;target.dispose();
      }
    }catch(_error){ok=false;}
    if(!ok&&cached&&cached.level===5)gfxFail("a render target the GPU would not complete");
    return ok;
  }

  function gfxNow(){return root.performance?.now?.()??Date.now();}
  // One frame drawn and waited for: a 1 px read makes the GPU finish, so the time is the real cost of the frame.
  const oomSeen=new WeakSet();
  function gfxTimedDraw(renderer,draw){
    const gl=renderer.getContext(),px=new Uint8Array(4);
    const t=gfxNow();draw();try{gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}catch(_error){}
    const ms=gfxNow()-t;
    // Out of GPU memory while drawing this level: never crash, one level down (once per renderer, so one bad moment is
    // one step, not a slide to Light).
    try{if(gl.OUT_OF_MEMORY&&!oomSeen.has(renderer)&&gl.getError()===gl.OUT_OF_MEMORY){oomSeen.add(renderer);gfxFail("the GPU ran out of memory");}}catch(_error){}
    return ms;
  }
  // Behind the loading screen: a few timed frames (the first ones also compile every shader). On auto, a level whose
  // frames cost more than ~80% of a 60 Hz frame steps down one; one under a quarter of it steps up one (never past what the
  // GPU name allows plus one, never to ultra). Returns the profile the scene should use.
  // r91 (Sol 6.1 review of 2.3.0: "a warm-up tier change can leave the original render costs in place"). The scene in front
  // of these frames is already built, so the move is for what comes next and for this scene's pixel ratio. What is true of
  // the scene in front is kept apart:
  //   - builtLevel(renderer) and the governor's level() stay the level the scene was built at;
  //   - a move down also starts the governor one step down the scene's heavy parts (its detail ladder), so the costs that
  //     were built do come down; at Light, where there is no level below, that step is the whole answer;
  //   - a level found slow on this page is not tried again on it (no Light, Balanced, Light from season to season);
  //   - a scene in a frame marks its own page only: the game page's html[data-gfx] follows the game page's own level.
  const builtBy=new WeakMap(),calBad=new Set();
  function gfxBuiltLevel(renderer){
    try{if(renderer&&builtBy.has(renderer))return builtBy.get(renderer);const level=gfxProfile().level;if(renderer)builtBy.set(renderer,level);return level;}catch(_error){return gfxProfile().level;}
  }
  async function gfxCalibrate(renderer,draw,opts){
    const p=gfxProfile(),frames=Math.max(3,(opts&&opts.frames)||5);
    // Software GL is already the lightest level and never goes up: no timed frames to wait for.
    if(!renderer||typeof draw!=="function"||p.software)return p;
    // A level the Device check measured on this device is not second-guessed by five frames.
    if(p.auto&&p.measured)return p;
    gfxBuiltLevel(renderer);
    const times=[];
    for(let i=0;i<frames;i+=1){times.push(gfxTimedDraw(renderer,draw));if(i<frames-1)await new Promise(r=>root.setTimeout(r,0));}
    const settle=times.slice(2).sort((a,b)=>a-b),ms=settle[Math.floor(settle.length/2)]??times[times.length-1];
    p.calibratedMs=+ms.toFixed(2);p.calSlow=false;
    if(!p.auto)return p;
    let level=p.level;const slow=ms>BUDGET_MS*.8;
    if(slow){calBad.add(level);if(level>0)level-=1;}
    else if(ms<BUDGET_MS*.25&&level<Math.min(3,p.autoLevel+1)&&!calBad.has(level+1))level+=1;
    if(level===p.level&&!slow)return p;
    const next=level===p.level?p:gfxSetLevel(level,true);next.calibratedMs=p.calibratedMs;next.calSlow=slow;
    renderer.setPixelRatio(next.pixelRatio);
    if(active&&active.renderer===renderer)active.sync();
    return next;
  }

  // The pixel-ratio steps between the profile's floor and ceiling, a quarter apart, highest first.
  function gfxSteps(p,cap){
    const hi=Math.min(p.maxPixelRatio,cap),out=[];
    for(let v=hi;v>p.minPixelRatio+.01;v-=.25)out.push(+v.toFixed(2));
    out.push(p.minPixelRatio);
    return [...new Set(out)];
  }
  // r91 governor (Sol 6.1 review of 2.3.0; Nik 2026-11-11: "heavy parts like crowd, shadows and glow are fixed when the
  // scene loads, so a slow device keeps paying for them"). One ladder per scene, walked by this governor only:
  //   pixel ratio, a quarter at a time, down to the level's floor; then the scene's own heavy parts ("detail" steps).
  // A scene offers its heavy parts as  detail:{steps:N, apply(step,why)}  (0 = as built, N = its lightest): apply() is the
  // only place those knobs move, and it is called at the start (the step remembered from the last visit, behind the loading
  // screen) and afterwards only between beats, never while the scene holds (a kick, a spin, a reveal).
  // A scene that can fade one picture into the next gives  before()  : it is called once ahead of every change in play
  // (pixel ratio or heavy parts, down, up or put back), while the old picture is still the one drawn.
  // What changed from 2.3.0:
  //   - Slow frames seen during a beat are kept: the step is taken when the beat ends. (2.3.0 threw them away at
  //     hold(false), so a scene that was only slow in action never stepped down, and Roulette holds for its whole turn.)
  //   - Slow frames still step down whatever the cause, as in 2.3.0. But steps taken while the scene does not look like the
  //     cost (an idle frame callback, a cheap timed draw) must buy frame time: two that buy nothing are undone, and the
  //     screen's own pace (a 30 fps power mode, a 50 Hz screen) is what slow is judged against from there on. Steps up
  //     keep the absolute bar (frames under 17.6 ms), as in 2.3.0.
  //   - A step back up needs a smooth beat first when this visit started low or a beat ran slow, so it never see-saws
  //     between a calm table and a busy shot.
  const SLOW_MS=20.5,SMOOTH_MS=17.6,BEAT_SLOW_MS=700;
  function gfxDetailRead(key,level,steps){
    try{const v=JSON.parse(gfxRead(DETAIL_KEY(key))||"null");if(!v||v.level!==level||!Number.isInteger(v.at))return {at:0,floor:0};
      const fresh=Date.now()-Number(v.t||0)<=DETAIL_DAYS_MS;
      return {at:Math.max(0,Math.min(steps,v.at)),floor:fresh&&Number.isInteger(v.floor)?Math.max(0,Math.min(steps,v.floor)):0};}catch(_error){return {at:0,floor:0};}
  }
  function gfxGovernor(renderer,opts){
    const o=opts||{},key=o.key?String(o.key):"";let p=gfxProfile();
    // The level this scene was built at (calibrate may since have moved the level for what comes next).
    const built=gfxBuiltLevel(renderer);
    // A 3D screen on the game's own page (Chamber Men) is opening from here on; a framed one marked itself already.
    if(!gfxFramed())gfxOpenArm(built,key);
    const size=()=>{const c=renderer.domElement;return {w:c?.clientWidth||0,h:c?.clientHeight||0};};
    // Ultra's buffer cap comes from the live canvas size.
    const capOf=()=>{const s=size();if(!s.w||!s.h)return p.maxPixelRatio;
      let cap=p.level>=4?Math.max(p.dpr,Math.sqrt(p.bufferCap/(s.w*s.h))):p.maxPixelRatio;
      if(p.phone)cap=Math.min(cap,Math.sqrt(BUFFER_CAP/(s.w*s.h)));
      return Math.max(p.minPixelRatio,cap);};
    let list=gfxSteps(p,capOf());
    const nearest=v=>{let i=0,d=1e9;list.forEach((x,k)=>{const e=Math.abs(x-v);if(e<d){d=e;i=k;}});return i;};
    let at=nearest(p.pixelRatio);
    // A level that ran slow last time on this screen is where the next visit starts.
    const settled=key?Number(gfxRead(MEMORY_KEY(key))):NaN;
    const bench=gfxQuery("bench")==="1"?gfxBench(renderer,o.draw,key,()=>p,()=>list[at],o.info):null;
    // The scene's heavy parts: detail step 0 (as built) .. steps (lightest). Only Auto walks them; a picked level and the
    // Device check draw the level as built.
    const detail=o.detail&&Number.isInteger(o.detail.steps)&&o.detail.steps>0&&typeof o.detail.apply==="function"?o.detail:null;
    const adapts=()=>Boolean(p.auto)&&!bench;
    let dAt=0,dFloor=0,fromMemory=false;
    if(p.auto&&Number.isFinite(settled)&&settled>0){const i=nearest(settled);if(i>at){at=i;fromMemory=true;}}
    if(detail&&key&&adapts()){const m=gfxDetailRead(key,built,detail.steps);dAt=Math.max(m.at,m.floor);dFloor=m.floor;if(dAt>0)fromMemory=true;}
    const bad=new Set(),badD=new Set(),born=gfxNow(),fails0=failCount;
    let held=false,last=0,avg=BUDGET_MS,slowFor=0,smoothFor=0,ended=false;
    // beat: the frames of the hold under way. due: a step down owed since a beat ran slow. upOk: a step up is allowed.
    // pace: the frame time this screen runs at when the scene is not the cost (a 50 Hz screen, a 30 fps power mode).
    // due: 1 = owed now, 2 = owed unless the calm scene turns out as slow as the beat (then the pace check decides).
    // usesBeats: the scene plays in beats (it says so with beats:true, or it has held once). Such a scene that starts low
    // from memory steps up only after a beat ran smooth; one without beats steps up as it always did.
    let usesBeats=Boolean(o.beats);
    let beat=null,due=0,upOk=!(usesBeats&&fromMemory),calmFor=0,idleFor=0,pace=0,busy=0,busyKnown=false,timing=false,trial=-1;
    // slowN: frames in the slow second under way. probe: steps being tried while the scene does not look like the cost.
    let slowN=0,probe=null,probed=false;
    const lost=()=>{if(!ended)gfxFail("the GPU dropped the picture (context lost)");};
    try{renderer.domElement?.addEventListener?.("webglcontextlost",lost);}catch(_error){}
    const apply=i=>{at=i;try{renderer.setPixelRatio(list[at]);}catch(_error){}
      // 8K: a browser that quietly gives a smaller drawing buffer than asked (its own limit) means 8K cannot hold here.
      if(p.level===5){try{const gl=renderer.getContext(),c=renderer.domElement,s=size();
        if(gl&&c&&s.w&&gl.drawingBufferWidth&&c.width&&gl.drawingBufferWidth<c.width-2){gfxFail("the browser capped the 8K buffer");return;}}catch(_error){}}
      try{o.onChange?.({...p,pixelRatio:list[at]});}catch(_error){}};
    const setDetail=(i,why)=>{dAt=i;try{detail.apply(dAt,why);}catch(_error){}};
    const forget=()=>{slowFor=0;slowN=0;smoothFor=0;calmFor=0;due=0;avg=pace||BUDGET_MS;};
    // Only the slow test follows the pace. Smooth keeps 2.3.0's absolute bar (17.6 ms): a screen that runs at 30 or 50 fps
    // never steps up, so a phone in a power-saving mode does not climb above where it began (review on #1398).
    const slowLimit=()=>pace?Math.max(SLOW_MS,pace*1.25):SLOW_MS,smoothLimit=()=>SMOOTH_MS;
    // One step down the ladder: pixel ratio first, then the heavy parts. The step left is never tried again in this visit;
    // a heavy part that was put back and ran slow stays off for a week of visits.
    // before: the scene's last word ahead of a change in play (a step down, a step up, steps put back), so it can let the
    // picture on screen fade into the next one. Never called for the start (behind the loading screen) or a resize.
    const before=()=>{try{o.before?.();}catch(_error){}};
    const stepDown=why=>{
      if(at<list.length-1){before();bad.add(at);apply(at+1);}
      else if(detail&&dAt<detail.steps){before();badD.add(dAt);if(trial===dAt)dFloor=Math.max(dFloor,dAt+1);trial=-1;setDetail(dAt+1,why||"slow");}
      else return false;
      forget();upOk=false;return true;
    };
    // Is the scene the cost? Its frame callback keeps the main thread busy, or one timed draw (which waits for the GPU) is
    // dear. Where the callback cannot be timed, or there is no draw to time, there is no telling: slow frames count as
    // they always did.
    const loaded=()=>{
      if(!busyKnown||busy>BUDGET_MS*.45||typeof o.draw!=="function")return true;
      let ms=0;try{ms=gfxTimedDraw(renderer,o.draw);}catch(_error){return true;}
      return ms>BUDGET_MS*.5;
    };
    // Slow for a second. 2.3.0 stepped down whatever the cause, and that stays (review on #1398): a weak GPU's cost of
    // putting the canvas on the page shows neither in the frame callback nor in a timed draw, and a real Chromebook cannot
    // be timed from a test machine. What is new: steps taken while the scene does not look like the cost have to buy frame
    // time. Two of them (or the ladder's end) that leave the frames within 10% of where they began are undone, and that
    // frame time is taken as the pace this screen runs at (a 30 fps power mode, a 50 Hz screen): slow is judged against
    // it from there on (smooth is not: see smoothLimit). One such probe a visit.
    const paceHere=ms=>{pace=Math.max(BUDGET_MS,Math.min(50,ms));slowFor=0;slowN=0;smoothFor=0;};
    const undo=ms=>{const b=probe;probe=null;probed=true;
      for(let i=b.at;i<at;i+=1)bad.delete(i);for(let i=b.dAt;i<dAt;i+=1)badD.delete(i);
      if((detail&&dAt!==b.dAt)||at!==b.at)before();
      if(detail&&dAt!==b.dAt)setDetail(b.dAt,"restore");if(at!==b.at)apply(b.at);
      forget();upOk=b.upOk;paceHere(ms);avg=pace;};
    const slowStep=seen=>{
      if(loaded()){probe=null;stepDown("slow");return;}
      if(probed){paceHere(seen);return;}
      if(!probe)probe={at,dAt,ms:seen,n:0,upOk};
      else if(seen<probe.ms*.9){probe=null;stepDown("slow");return;}
      else if(probe.n>=2){undo(seen);return;}
      if(stepDown("slow"))probe.n+=1;
      else if(probe.n>0)undo(seen);
      else{probe=null;probed=true;paceHere(seen);}
    };
    // The time this frame's callback kept the main thread, from the frame's own start to the end of the callback.
    const frameStart=()=>{try{const v=root.document?.timeline?.currentTime;return typeof v==="number"?v:null;}catch(_error){return null;}};
    const timeWork=()=>{if(timing)return;const f0=frameStart();if(f0===null)return;timing=true;
      try{root.Promise.resolve().then(()=>{timing=false;const w=gfxNow()-f0;if(w>=0){busy=busyKnown?busy+(Math.min(100,w)-busy)*.1:Math.min(100,w);busyKnown=true;}});}catch(_error){timing=false;}};
    apply(at);
    if(detail&&dAt>0)setDetail(dAt,"start");
    // The timed frames behind the loading screen ran slow: the heavy parts start one step down (the pixel ratio already
    // follows the level calibrate moved to).
    const startSlow=()=>{if(!adapts()||!p.calSlow)return;p.calSlow=false;
      if(detail&&dAt<detail.steps){badD.add(dAt);setDetail(dAt+1,"start");forget();upOk=false;}};
    startSlow();
    const api={
      renderer,
      frame(t){
        if(ended)return;
        gfxOpenFrame(t);
        // Device check: the level stays as forced and every frame counts, held or not.
        if(bench){bench.frame(t);return;}
        const dt=last?Math.min(100,t-last):BUDGET_MS;last=t;avg+=(dt-avg)*.08;
        // A level the player picked stays as picked: no steps either way.
        if(!p.auto)return;
        timeWork();
        // The screen turned out faster than the pace taken for it (a power mode ended): judge against the new one.
        if(pace&&avg<pace*.8)pace=avg<=SMOOTH_MS?0:avg;
        const slow=avg>slowLimit();
        if(held){if(beat){beat.ms+=dt;if(slow)beat.slow+=dt;}return;}
        idleFor+=dt;
        if(slow){slowFor+=dt;slowN+=1;smoothFor=0;calmFor=0;}else{slowFor=0;slowN=0;const smooth=avg<smoothLimit();smoothFor=smooth?smoothFor+dt:0;calmFor=smooth?calmFor+dt:0;}
        // A scene that never holds, running calm for 15 s, may step up without a beat.
        if(!upOk&&!usesBeats&&calmFor>=15000)upOk=true;
        // A beat ran slow while the calm scene before it did not: the scene's action is the cost. The step is taken now,
        // between beats. (Not known how the calm scene runs: wait until it shows; as slow as the beat means the check below.)
        if(due===1||(due===2&&!slow)){stepDown("slow");return;}
        // Too slow for a second: one step down (see slowStep).
        if(slowFor>=1000){const seen=slowFor/Math.max(1,slowN);slowFor=0;slowN=0;due=0;slowStep(seen);return;}
        if(!upOk||typeof o.draw!=="function")return;
        // Heavy parts come back first (they went last): smooth for 6 s and a timed frame under 40% of the budget.
        if(detail&&dAt>dFloor){
          if(smoothFor>=6000){smoothFor=0;if(badD.has(dAt-1))return;
            if(gfxTimedDraw(renderer,o.draw)<BUDGET_MS*.4){before();trial=dAt-1;setDetail(dAt-1,"smooth");forget();}else badD.add(dAt-1);}
          return;
        }
        if(dAt>0)return;
        // Smooth for 3 s: time one real frame; step up only if the next step would still leave a third of the frame free.
        if(smoothFor>=3000&&at>0&&!bad.has(at-1)){
          smoothFor=0;const ms=gfxTimedDraw(renderer,o.draw),scale=Math.pow(list[at-1]/list[at],2);
          if(ms*scale<BUDGET_MS*.66){before();apply(at-1);}else bad.add(at-1);
        }
      },
      // Between beats only: a held governor never changes the picture mid-shot. What the beat showed is kept: a beat that
      // ran slow for 0.7 s, or for half of a short one, owes a step down at its end; a smooth one allows steps up again.
      hold(v){
        const next=Boolean(v);if(next===held){bench?.hold(held);return;}
        held=next;
        // Its first beat played to the end: the scene is open.
        if(!held)gfxOpenDone();
        // calm: how the scene ran just before the beat (true smooth enough, false slow, null not seen for half a second).
        // A slow beat owes its step at once when the calm scene was fine, or when the frame callback itself is busy.
        if(held)beat={ms:0,slow:0,calm:idleFor>=500?!(avg>slowLimit()):null};
        else{const b=beat;beat=null;slowFor=0;smoothFor=0;calmFor=0;idleFor=0;
          if(b&&adapts()&&b.ms>0){usesBeats=true;
            if(b.slow>=BEAT_SLOW_MS||(b.ms>=400&&b.slow>=b.ms*.5)){if(b.calm===true||(busyKnown&&busy>BUDGET_MS*.45))due=1;else if(b.calm===null)due=Math.max(due,2);}
            else if(b.slow===0&&b.ms>=400)upOk=true;}}
        bench?.hold(held);
      },
      resize(){const cur=list[at];p=gfxProfile();list=gfxSteps(p,capOf());at=nearest(cur);bad.clear();if(list[at]!==cur)apply(at);},
      // Codex on #1263: calibrate() may move the pixel-ratio range after the governor was made. Take the new profile's steps
      // and ratio, so a step down never comes back as a higher ratio (calibrate calls this itself; scenes need not).
      sync(){if(ended)return;p=gfxProfile();list=gfxSteps(p,capOf());bad.clear();forget();apply(nearest(p.pixelRatio));startSlow();},
      // The level the scene was built at, which is what it draws (r91: not the level calibrate moved to for what comes next).
      level(){return built;},
      name(){return NAMES[built];},
      pixelRatio(){return list[at];},
      // The scene's heavy parts: 0 as built .. steps lightest (0 without a detail ladder).
      detail(){return dAt;},
      frameMs(){return +avg.toFixed(1);},
      // The frame callback's main-thread time, smoothed (null where it cannot be timed).
      workMs(){return busyKnown?+busy.toFixed(1):null;},
      end(){if(ended)return;ended=true;gfxOpenDone();if(failCount===fails0&&p.fellBack&&gfxNow()-born>=CAP_CLEAN_MS)gfxCapClean(p.level);try{renderer.domElement?.removeEventListener?.("webglcontextlost",lost);}catch(_error){}
        // Steps still on probe are not what the scene settled at: the place the probe began is.
        if(key&&adapts()){const sAt=probe?probe.at:at,sD=probe?probe.dAt:dAt;gfxWrite(MEMORY_KEY(key),list[sAt]);if(detail)gfxWrite(DETAIL_KEY(key),JSON.stringify({level:built,at:sD,floor:dFloor,t:Date.now()}));}
        if(active===api)active=null;}
    };
    active=api;
    return api;
  }

  // Device check recorder: frame-to-frame times from the scene's own loop for BENCH_MS (after a short settle), then a few
  // timed draws (the GPU cost, which a 60 Hz screen hides), posted once to the parent page and fired as an event here.
  // r92: ats (optional, ms since the screen began to play, one per frame) names when the slowest frame came, so a Device check
  // result on a real phone says which moment of the kick, turn or reveal stalled.
  function gfxBenchStats(dts,ats){
    const n=dts.length;if(!n)return {frames:0,avg:0,p1low:0,ms:0};
    const total=dts.reduce((a,b)=>a+b,0),sorted=dts.slice().sort((a,b)=>b-a),worst=sorted.slice(0,Math.max(1,Math.ceil(n/100)));
    const ms=total/n,worstMs=worst.reduce((a,b)=>a+b,0)/worst.length;
    const out={frames:n,avg:+(1000/ms).toFixed(1),p1low:+(1000/worstMs).toFixed(1),ms:+ms.toFixed(2)};
    // late: frames that took over 25 ms (a missed refresh at 60 Hz). Many late frames is a level too heavy; one or two slow
    // ones is a hitch (a first upload, a pause in the browser).
    if(Array.isArray(ats)&&ats.length===n){let at=0;for(let i=1;i<n;i+=1)if(dts[i]>dts[at])at=i;
      out.slowest=[+dts[at].toFixed(1),+(ats[at]/1000).toFixed(1)];out.late=dts.filter(d=>d>25).length;}
    return out;
  }
  // What the canvas really is: its CSS box and the drawing buffer the browser gave (8K: a browser may give less than asked).
  function gfxBenchSize(renderer){
    try{const c=renderer.domElement,gl=renderer.getContext();
      return {css:[c?.clientWidth||0,c?.clientHeight||0],size:[gl?.drawingBufferWidth||c?.width||0,gl?.drawingBufferHeight||c?.height||0],
        bufferOk:!(gl&&c&&gl.drawingBufferWidth&&c.width&&gl.drawingBufferWidth<c.width-2)};}
    catch(_error){return {css:[0,0],size:[0,0],bufferOk:true};}
  }
  // r91 (Sol 6.1 review of 2.3.0): the result says what was asked (?gfx=N), what was drawn (level, pixel ratio, buffer size),
  // whether a whole beat was played and whether the GPU gave up on the way, so the Device check can refuse a result that is
  // not a clean measurement of the level it asked for. "started" is posted when the scene is built and about to draw.
  function gfxBench(renderer,draw,key,prof,pr,info){
    let start=0,last=0,done=false,beats=0,heldAt=0,holding=false;const dts=[],ats=[],scene=key||"scene",first=prof();
    const post=m=>{try{root.dispatchEvent?.(new root.CustomEvent("cms-gfx-bench",{detail:m}));}catch(_error){}
      try{if(root.parent&&root.parent!==root)root.parent.postMessage(m,root.location.origin);}catch(_error){}};
    const finish=complete=>{
      if(done)return;done=true;
      const p=prof(),draws=[];if(typeof draw==="function"&&!benchFailed)for(let i=0;i<5;i+=1){try{draws.push(gfxTimedDraw(renderer,draw));}catch(_error){}}
      draws.sort((a,b)=>a-b);
      let extra=null;try{extra=typeof info==="function"?info():null;}catch(_error){extra=null;}
      post({type:"cms-gfx-bench",phase:"result",scene,asked:first.asked,level:p.level,name:p.name,label:LABELS[p.level],pixelRatio:pr(),...gfxBenchSize(renderer),
        beats,complete:Boolean(complete),failed:benchFailed||null,software:Boolean(p.software),gpu:p.gpu,
        ...gfxBenchStats(dts,ats),drawMs:draws.length?+draws[Math.floor(draws.length/2)].toFixed(2):null,...(extra&&typeof extra==="object"?{info:extra}:{})});
    };
    post({type:"cms-gfx-bench",phase:"started",scene,asked:first.asked,level:first.level});
    return {
      frame(t){
        if(done)return;
        // The GPU gave up at this level (a lost context, out of memory, a refused 8K buffer): that is the result.
        if(benchFailed){finish(false);return;}
        if(!start){start=t;last=t;return;}
        const dt=t-last;last=t;
        if(t-start<BENCH_SETTLE_MS)return;
        dts.push(dt);ats.push(t-start);
        if(t-start>=BENCH_SETTLE_MS+BENCH_MAX_MS){finish(false);return;}
        if(t-start>=BENCH_SETTLE_MS+BENCH_MS&&beats>=1)finish(true);
      },
      // One beat is one hold(true) .. hold(false) that lasted (a kick, a turn, a reveal).
      hold(v){const now=gfxNow();if(v&&!holding){holding=true;heldAt=now;}else if(!v&&holding){holding=false;if(now-heldAt>=500)beats+=1;}}
    };
  }

  // ?fps=1 only: a small corner readout, four times a second, with its own frame clock.
  // softCut(canvas, draw): a step taken in play, shown softly. The frame as it stands is copied over the canvas and fades
  // out over the scene as it is drawn from the next frame on (a scene passes this to its governor as before()). For a
  // scene whose canvas fills its own positioned box (the Roulette and Special Player pages; Chamber Men fades inside its
  // own picture). The copy lies in that box right over the canvas, so nothing above the scene is covered, takes no
  // pointer, is at most 2560 px on its long side and is gone after the fade. Under Reduce Motion, or where the box is not
  // positioned, the step is a plain cut as before. Never throws.
  function gfxSoftCut(canvas,draw,ms){
    try{
      const box=canvas?.parentElement,doc=canvas?.ownerDocument,win=doc?.defaultView||root,fade=Number.isFinite(ms)&&ms>0?ms:420;
      if(!box||!doc||!canvas.width||!canvas.height)return false;
      if(win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)return false;
      if((win.getComputedStyle?.(box)?.position||"static")==="static")return false;
      for(const old of box.querySelectorAll?.("canvas[data-gfx-cut]")||[])old.remove();
      const k=Math.min(1,2560/Math.max(canvas.width,canvas.height)),copy=doc.createElement("canvas");
      copy.width=Math.max(1,Math.round(canvas.width*k));copy.height=Math.max(1,Math.round(canvas.height*k));
      // A WebGL canvas holds its frame only in the task that drew it: draw, then copy.
      if(typeof draw==="function")draw();
      copy.getContext("2d").drawImage(canvas,0,0,copy.width,copy.height);
      copy.setAttribute("data-gfx-cut","1");copy.setAttribute("aria-hidden","true");
      copy.style.cssText=`position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:1;transition:opacity ${fade}ms ease-out`;
      box.appendChild(copy);
      const frame=win.requestAnimationFrame||(f=>win.setTimeout(f,16));
      frame(()=>frame(()=>{copy.style.opacity="0";}));
      win.setTimeout(()=>copy.remove(),fade+300);
      return true;
    }catch(_error){return false;}
  }
  function gfxOverlay(info,parent){
    if(gfxQuery("fps")!=="1")return {stop(){}};
    const d=root.document;if(!d||!d.body)return {stop(){}};
    const box=d.createElement("div");box.setAttribute("aria-hidden","true");box.className="cmsGfxFps";
    box.style.cssText="position:fixed;left:6px;top:6px;z-index:2147483647;pointer-events:none;font:600 11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#9fff9f;background:rgba(0,0,0,.72);padding:4px 6px;border-radius:3px;white-space:pre";
    (parent||d.body).append(box);
    let raf=0,last=0,n=0,acc=0,shown=0,stopped=false;
    const tick=t=>{
      if(stopped)return;
      if(last){acc+=t-last;n+=1;}last=t;
      if(t-shown>=250&&n){
        const ms=acc/n,p=gfxProfile(),gov=active,built=gov?gov.level():p.level,extra=(()=>{try{return info?info()||{}:{};}catch(_error){return {};}})();
        const lines=[`${Math.round(1000/ms)} fps  ${ms.toFixed(1)} ms  pr ${(gov?gov.pixelRatio():p.pixelRatio).toFixed(2)}`,
          `${LABELS[built]} (${p.auto?"Auto":"picked"}${p.auto&&p.level!==built?`, next scene ${LABELS[p.level]}`:""}${p.auto&&built!==p.autoLevel?`, device says ${LABELS[p.autoLevel]}`:""})${gov&&gov.detail()?`  detail -${gov.detail()}`:""}${gov&&gov.workMs()!=null?`  work ${gov.workMs()} ms`:""}${p.calibratedMs!=null?`  cal ${p.calibratedMs} ms`:""}`,
          ...(p.fellBack?[`fell back from ${LABELS[p.fellBack.from]} to ${LABELS[p.level]}: ${p.fellBack.reason}`]:[]),
          p.gpu?p.gpu.slice(0,60):"gpu ?"];
        if(extra.calls!=null||extra.tris!=null)lines.push(`${extra.calls??"?"} calls  ${extra.tris!=null?(extra.tris/1000).toFixed(0)+"k":"?"} tris`);
        if(extra.extra)lines.push(String(extra.extra));
        box.textContent=lines.join("\n");shown=t;n=0;acc=0;
      }
      if(!box.isConnected){stopped=true;return;}
      raf=root.requestAnimationFrame(tick);
    };
    raf=root.requestAnimationFrame(tick);
    return {stop(){stopped=true;if(raf)root.cancelAnimationFrame(raf);box.remove();}};
  }

  root.CareerModeGfxTier={contractVersion:1,storageKey:KEY,choices:CHOICES.slice(),names:NAMES.slice(),labels:LABELS.slice(),
    label(level){return LABELS[Math.max(0,Math.min(5,Math.round(Number(level))||0))];},
    profile:gfxProfile,calibrate:gfxCalibrate,governor:gfxGovernor,softCut:gfxSoftCut,builtLevel:gfxBuiltLevel,overlay:gfxOverlay,classify:gfxClassify,
    // Settings: suggested() is what Auto would pick on this device, choice() the saved pick ("auto" by default), setChoice()
    // saves a pick for this device; it takes effect on the next 3D screen.
    // "now" is the level Auto starts at on this device, read fresh from storage each call (Codex on #1284): the Device check
    // result and a crash cap may have been saved by the roulette or SP frame's own copy of this module. A scene's five-frame
    // calibration is not saved (each scene calibrates again), so it is not part of what Settings shows.
    suggested(){const p=gfxProfile(),m=gfxMeasured(),level=m?m.level:p.guessLevel,cap=gfxCap(),now=cap?Math.min(level,cap.level):level;
      return {level,name:NAMES[level],measured:Boolean(m),now,nowName:NAMES[now],lowered:now<level};},
    // Device check: what this device is taken for before any check (phone or computer, GPU, the level Auto starts at).
    device(){const p=gfxProfile();return {phone:Boolean(p.phone),gpu:p.gpu,software:Boolean(p.software),strongPhone:Boolean(p.strongPhone),
      guessLevel:p.guessLevel,guessName:NAMES[p.guessLevel],can8k:Boolean(p.can8k),dpr:p.dpr};},
    // Device check page: the level guide (which chips start at which level, what each level draws) and what this device's
    // chip, memory and processor threads each say.
    guide:gfxGuide,
    // Device check: the best level this device held, saved as its Auto; clearMeasured() goes back to the GPU-name guess.
    // r91 (Nik 2026-11-11): any level, Light to 8K (8K only where the GPU can hold it). A crash cap is left alone (review
    // on #1389): a device whose GPU gave up at a level in play keeps that cap even when the check then holds the level;
    // the cap ends by its own rules (7 days, 3 clean scenes, or a pick in Settings).
    measured:gfxMeasured,benchStats:gfxBenchStats,
    setMeasured(level,detail){const n=Math.round(Number(level));if(!Number.isFinite(n))return null;
      const l=Math.max(0,Math.min(gfxProfile().can8k?5:4,n));
      gfxWrite(MEASURED_KEY,JSON.stringify({level:l,at:Date.now(),...(detail&&typeof detail==="object"?{detail}:{})}));cached=null;gfxRemark();return l;},
    clearMeasured(){gfxWrite(MEASURED_KEY,"null");cached=null;gfxRemark();},
    choice:gfxChoice,setChoice(c){const v=CHOICES.includes(String(c))?String(c):"auto";gfxWrite(KEY,v);gfxWrite(CAP_KEY,"null");cached=null;gfxRemark();return v;},
    // offers(choice): may Settings offer this choice on this device? Everything, except: 8K only where the GPU can hold it,
    // and on a weak device Ultra (4K) and 8K only once the Device check has passed them. needsCheck(): the labels held
    // back for want of that check (empty on every other device).
    offers(choice){const c=String(choice),i=CHOICES.indexOf(c);if(i<0)return false;if(i<5)return true;
      const p=gfxProfile(),l=i-1;return gfxPickable(l,gfxScreenEnv(),p.can8k,gfxMeasured())===l;},
    needsCheck(){const p=gfxProfile(),env=gfxScreenEnv(),m=gfxMeasured(),out=[];
      for(const l of [4,5]){if(l===5&&!p.can8k)continue;if(gfxPickable(l,env,p.can8k,m)<l)out.push(LABELS[l]);}return out;},
    // 8K is offered only where it can run (Settings shows it only then); samples()/checkTarget() size MSAA for render targets.
    can8k(){return Boolean(gfxProfile().can8k);},samples:gfxSamples,checkTarget:gfxCheckTarget,
    // tabCrash(): the cap left by a tab that died while a 3D screen was opening (null when there is none). The Device
    // check does not open a level above it again.
    tabCrash(){const c=gfxCap();return c&&c.tab?{level:c.level,from:Number.isInteger(c.from)?c.from:c.level+1,scene:String(c.scene||""),bench:Boolean(c.bench),at:c.at}:null;},
    // fallback(reason): a scene that hit an out-of-memory sign of its own drops the device one level (remembered).
    fallback:gfxFail,fallback8k:gfxFail,
    // sceneOpening(scene): a 3D screen on the game's own page says it is about to load and build (the tab-crash guard's
    // mark; a framed screen marks itself). sceneOpened(): the mount ended without a scene. The governor ends the mark of
    // one that did open.
    sceneOpening(scene){try{if(!gfxFramed())gfxOpenArm(gfxProfile().level,scene);}catch(_error){}},sceneOpened(){try{gfxOpenDone();}catch(_error){}},
    reset(){cached=null;}};
  // On load, first: did this tab die while a 3D screen was opening? (The cap it writes is read by everything below.)
  try{gfxOpenSweep();}catch(_error){}
  // On load: a level the player picked or the Device check measured is marked at once (no GPU probe); the full profile
  // follows when the page is idle (the GPU name from the kept answer, or, the first time in this browser, from one throwaway
  // context in a truly idle moment: no 2 s deadline that could land it in the middle of Home's first taps).
  try{const c=gfxChoice(),m=gfxMeasured(),l=c!=="auto"&&c!=="8k"?gfxChoiceLevel(c):c==="auto"&&m?m.level:null,cap=gfxCap();
    if(l!==null){const lv=cap?Math.min(l,cap.level):l,phone=gfxScreenEnv().phone;gfxMarkRoot(lv,Math.max(0,Math.min(4,phone&&lv<2?lv-1:lv)-(gfxSlowNet()?1:0)));}}catch(_error){}
  // r90 MOTION M32: the first probe in a browser also waits until the loading screen has handed over to Home (the same
  // test js/ssjr.js uses), so its long task never lands under the loading screen or Home's first frame; with a kept answer
  // the remark costs nothing and follows at the first idle moment.
  const gfxKept=()=>{try{const k=JSON.parse(gfxRead(GPU_KEY)||"null");return Boolean(k&&k.ua===String(root.navigator?.userAgent||""));}catch(_error){return false;}};
  const gfxHandedOver=()=>{try{const el=root.document?.getElementById?.("loadingScreen");return !root.careerModeHomeHold&&(!el||el.hidden||el.classList?.contains("hidden"));}catch(_error){return true;}};
  const gfxIdle=f=>(root.requestIdleCallback||(g=>root.setTimeout(g,200)))(f,{timeout:10000});
  try{if(gfxKept())gfxIdle(()=>gfxRemark());
    else{let n=0;const wait=()=>{if(gfxHandedOver()||++n>120)gfxIdle(()=>gfxRemark());else root.setTimeout(wait,250);};wait();}}catch(_error){}
})(typeof globalThis!=="undefined"?globalThis:this);
