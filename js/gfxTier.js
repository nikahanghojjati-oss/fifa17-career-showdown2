(function(root){
  "use strict";

  // r90 one quality system for every 3D screen (Nik 2026-11-07: "you should really adapt to your computer. If I'm running
  // on a Chromebook, it should run great. If someone is on a high-end PC, it should be like much quality, 4K").
  // Plain script, no imports: the root page and the roulette page (../../../js/gfxTier.js) load the same file.
  //
  //   const p=CareerModeGfxTier.profile();                 // before the WebGLRenderer: antialias is fixed at context creation
  //   const renderer=new THREE.WebGLRenderer({antialias:p.antialias,...});renderer.setPixelRatio(p.pixelRatio);
  //   await CareerModeGfxTier.calibrate(renderer,()=>renderer.render(scene,camera));   // behind the loading screen (skipped on software GL)
  //   const gov=CareerModeGfxTier.governor(renderer,{key:"chamber",draw:()=>renderer.render(scene,camera),onChange(p){...}});
  //     (draw is optional: without it the governor only steps down)
  //   each frame: gov.frame(now);  between beats: gov.hold(false);  on dispose: gov.end();
  //   CareerModeGfxTier.overlay(()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles}));  // ?fps=1 only
  //
  // Levels: 0 light (Chromebook class), 1 medium, 2 high, 3 extra, 4 ultra (only when picked: always the screen's native
  // size, so a 4K or 8K screen is sharp, and up to 2x past it while the buffer stays within 3840x2160), 5 8k (only when
  // picked, only on a GPU with a 7680 px buffer, never a phone: up to 4x past native within 7680x4320; a lost context or a
  // refused buffer falls back to ultra, said in the ?fps=1 overlay). Auto never picks ultra or 8k and never renders
  // above devicePixelRatio. A picked level is held as picked (the governor moves only Auto). Scene knobs (crowd, bloom, shadow
  // size) read the profile; the governor only moves the pixel ratio, steps down when frames run long, steps up only after
  // a timed frame shows room, and never goes back to a step that ran slow (no see-saw).
  const KEY="careerModeShowdown.gfxQuality.v1";
  const CHOICES=["auto","light","medium","high","extra","ultra","8k"];
  const NAMES=["light","medium","high","extra","ultra","8k"];
  // Per level: the pixel ratio it starts at and may reach (both capped by the screen), shadow map size, crowd density, bloom.
  const LEVELS=[
    {pr:1,max:1,shadowSize:1024,density:.45,bloom:false},
    {pr:1.25,max:1.5,shadowSize:1024,density:.7,bloom:true},
    {pr:1.5,max:2,shadowSize:2048,density:1,bloom:true},
    {pr:2,max:3,shadowSize:2048,density:1,bloom:true},
    {pr:2,max:4,shadowSize:4096,density:1,bloom:true},
    // r90 (Nik 2026-11-07, "8K as well as 4K"): picked only, on a GPU that can hold a 7680 px buffer, never on a phone.
    {pr:2,max:8,shadowSize:4096,density:1,bloom:true}
  ];
  const BUDGET_MS=16.7,BUFFER_CAP=3840*2160,BUFFER_CAP_8K=7680*4320,PHONE_MAX_PR=3;
  // An 8K pick that failed here (a context lost or a buffer the browser would not give) plays Ultra until 8K is picked again.
  const FALLBACK_8K_KEY="careerModeShowdown.gfx8kFallback.v1";
  const MEMORY_KEY=key=>`careerModeShowdown.gfxSettled.v1.${key}`;
  // The Device check (device-check.html) saves the best level this device held at 60 fps; Auto starts there.
  const MEASURED_KEY="careerModeShowdown.gfxMeasured.v1";
  // ?bench=1 (Device check frames): no adapting; frame times are recorded for BENCH_MS after BENCH_SETTLE_MS and posted once.
  const BENCH_SETTLE_MS=500,BENCH_MS=10000;
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
  function gfxMeasured(){
    try{const m=JSON.parse(gfxRead(MEASURED_KEY)||"null");return m&&Number.isInteger(m.level)&&m.level>=0&&m.level<=4?m:null;}catch(_error){return null;}
  }

  // The GPU's own name and its largest buffer and texture, from a throwaway context (released at once).
  function gfxGpuInfo(){
    try{
      const c=root.document.createElement("canvas"),gl=c.getContext("webgl2")||c.getContext("webgl");if(!gl)return {name:"",maxBuffer:0,maxTexture:0};
      const ext=gl.getExtension("WEBGL_debug_renderer_info");
      const name=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||"");
      const maxBuffer=Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE))||0,maxTexture=Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||0;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
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
  // 8K needs a GPU that can hold a 7680 px buffer and texture; never software GL, never a phone.
  function gfxCan8k(info,env){return Boolean(info&&!info.software&&!(env&&env.phone)&&info.maxBuffer>=7680&&info.maxTexture>=7680);}
  function gfxFallback8k(){try{const v=JSON.parse(gfxRead(FALLBACK_8K_KEY)||"null");return v&&v.reason?v:null;}catch(_error){return null;}}
  function gfxBuild(level,base){
    let fellBack=null;
    if(level===5&&!base.can8k)level=4;
    else if(level===5&&(fellBack=gfxFallback8k()))level=4;
    const L=LEVELS[level],dpr=base.dpr,phone=Boolean(base.phone);
    // Auto and the named levels stay at or under the screen's own ratio; ultra and 8K always reach it (a 4K or 8K screen
    // draws at native size) and may draw past it (2x, 4x) while the buffer stays within 3840x2160 (8K: 7680x4320; the
    // governor checks). A phone never draws past 3x its CSS size, nor past a 4K buffer (iOS memory).
    let max=level>=4?Math.max(dpr,(level===5?4:2)*dpr):Math.min(L.max,dpr);
    if(phone)max=Math.min(max,Math.max(1,Math.min(PHONE_MAX_PR,dpr)));
    const min=Math.min(1,dpr,max);
    return {level,name:NAMES[level],choice:base.choice,gpu:base.gpu,software:base.software,dpr,phone,can8k:Boolean(base.can8k),fellBack,
      // Ultra starts at native at least (a 3x phone or 8K screen); 8K starts at its ceiling, which the governor holds to a
      // 7680x4320 buffer for the live canvas (a 1080p screen draws 4x). Past native always stays within the buffer cap.
      pixelRatio:Math.max(min,Math.min(level===5?max:level===4?Math.max(L.pr,dpr):L.pr,max)),maxPixelRatio:max,minPixelRatio:min,
      bufferCap:level===5?BUFFER_CAP_8K:BUFFER_CAP,
      // Textures and models by level; a phone below High loads one size down (iOS memory). 8K uses Ultra's assets.
      textureLevel:Math.min(4,phone&&level<2?Math.max(0,level-1):level),
      antialias:!base.software,shadowSize:L.shadowSize,density:L.density,bloom:L.bloom};
  }
  function gfxProfile(){
    if(cached)return cached;
    const env=gfxScreenEnv(),info=gfxGpuInfo(),gpu=info.name,c=gfxChoice(),auto=gfxClassify(gpu,env);
    const can8k=gfxCan8k({...info,software:auto.software},env);
    const forced=gfxQuery("gfx"),forcedLevel=forced!==null&&/^[0-5]$/.test(forced)?Number(forced):null;
    const measured=gfxMeasured(),autoLevel=measured?measured.level:auto.level;
    let level=forcedLevel!==null?forcedLevel:c==="auto"?autoLevel:gfxChoiceLevel(c);
    cached=gfxBuild(level,{dpr:env.dpr,gpu,software:auto.software,phone:env.phone,can8k,choice:forcedLevel!==null?`gfx=${forcedLevel}`:c});
    cached.auto=c==="auto"&&forcedLevel===null;cached.autoLevel=autoLevel;cached.measured=Boolean(measured);cached.guessLevel=auto.level;cached.strongPhone=Boolean(auto.strongPhone);
    return cached;
  }
  function gfxSetLevel(level){const p=gfxProfile();const next=gfxBuild(Math.max(0,Math.min(4,level)),{dpr:p.dpr,gpu:p.gpu,software:p.software,phone:p.phone,can8k:p.can8k,choice:p.choice});
    next.auto=p.auto;next.autoLevel=p.autoLevel;next.measured=p.measured;next.guessLevel=p.guessLevel;next.strongPhone=p.strongPhone;cached=next;return next;}
  // 8K could not hold here: remember it (Ultra until 8K is picked again), rebuild the profile and move the live governor.
  function gfx8kFail(reason){
    gfxWrite(FALLBACK_8K_KEY,JSON.stringify({reason:String(reason||"failed"),at:Date.now()}));cached=null;
    try{active?.sync();}catch(_error){}
    return gfxProfile();
  }
  // MSAA for a render target: the highest sample count at or under the wish that the GPU supports for both the colour format
  // (RGBA16F with hdr, else RGBA8) and DEPTH_COMPONENT24 (W3's fix on #1265; MAX_SAMPLES alone is not enough). Without the
  // query: 4, then 0.
  const sampleLists=new WeakMap();
  function gfxSamples(renderer,want,hdr){
    const w=Math.max(0,Math.floor(Number(want)||0));if(!w)return 0;
    let byFormat=sampleLists.get(renderer);if(!byFormat){byFormat={};try{sampleLists.set(renderer,byFormat);}catch(_error){}}
    const k=hdr?"hdr":"ldr";
    if(!(k in byFormat)){
      try{const gl=renderer.getContext(),q=f=>Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,f,gl.SAMPLES)||[]);
        const c=q(hdr?gl.RGBA16F:gl.RGBA8),d=q(gl.DEPTH_COMPONENT24),both=c.filter(n=>d.includes(n)).sort((a,b)=>b-a);byFormat[k]=both.length?both:null;}
      catch(_error){byFormat[k]=null;}
    }
    const list=byFormat[k]||[4];
    return list.find(n=>n<=w)??list[list.length-1];
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
    if(!ok&&cached&&cached.level===5)gfx8kFail("a render target the GPU would not complete");
    return ok;
  }

  function gfxNow(){return root.performance?.now?.()??Date.now();}
  // One frame drawn and waited for: a 1 px read makes the GPU finish, so the time is the real cost of the frame.
  function gfxTimedDraw(renderer,draw){
    const gl=renderer.getContext(),px=new Uint8Array(4);
    const t=gfxNow();draw();try{gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}catch(_error){}
    return gfxNow()-t;
  }
  // Behind the loading screen: a few timed frames (the first ones also compile every shader). On auto, a level whose
  // frames cost more than ~80% of a 60 Hz frame steps down one; one under a quarter of it steps up one (never past what the
  // GPU name allows plus one, never to ultra). Returns the profile the scene should use.
  async function gfxCalibrate(renderer,draw,opts){
    const p=gfxProfile(),frames=Math.max(3,(opts&&opts.frames)||5);
    // Software GL is already the lightest level and never goes up: no timed frames to wait for.
    if(!renderer||typeof draw!=="function"||p.software)return p;
    // A level the Device check measured on this device is not second-guessed by five frames.
    if(p.auto&&p.measured)return p;
    const times=[];
    for(let i=0;i<frames;i+=1){times.push(gfxTimedDraw(renderer,draw));if(i<frames-1)await new Promise(r=>root.setTimeout(r,0));}
    const settle=times.slice(2).sort((a,b)=>a-b),ms=settle[Math.floor(settle.length/2)]??times[times.length-1];
    p.calibratedMs=+ms.toFixed(2);
    if(!p.auto)return p;
    let level=p.level;
    if(ms>BUDGET_MS*.8&&level>0)level-=1;
    else if(ms<BUDGET_MS*.25&&level<Math.min(3,p.autoLevel+1))level+=1;
    if(level===p.level)return p;
    const next=gfxSetLevel(level);next.calibratedMs=p.calibratedMs;
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
  function gfxGovernor(renderer,opts){
    const o=opts||{},key=o.key?String(o.key):"";let p=gfxProfile();
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
    if(p.auto&&Number.isFinite(settled)&&settled>0)at=Math.max(at,nearest(settled));
    const bad=new Set();let held=false,last=0,avg=BUDGET_MS,slowFor=0,smoothFor=0,ended=false;
    const lost=()=>{if(p.level===5)gfx8kFail("the GPU dropped the 8K picture (context lost)");};
    try{renderer.domElement?.addEventListener?.("webglcontextlost",lost);}catch(_error){}
    const bench=gfxQuery("bench")==="1"?gfxBench(renderer,o.draw,key,p,()=>list[at]):null;
    const apply=i=>{at=i;try{renderer.setPixelRatio(list[at]);}catch(_error){}
      // 8K: a browser that quietly gives a smaller drawing buffer than asked (its own limit) means 8K cannot hold here.
      if(p.level===5){try{const gl=renderer.getContext(),c=renderer.domElement,s=size();
        if(gl&&c&&s.w&&gl.drawingBufferWidth&&c.width&&gl.drawingBufferWidth<c.width-2){gfx8kFail("the browser capped the 8K buffer");return;}}catch(_error){}}
      try{o.onChange?.({...p,pixelRatio:list[at]});}catch(_error){}};
    apply(at);
    const api={
      renderer,
      frame(t){
        if(ended)return;
        // Device check: the level stays as forced and every frame counts, held or not.
        if(bench){bench(t);return;}
        const dt=last?Math.min(100,t-last):BUDGET_MS;last=t;avg+=(dt-avg)*.08;
        if(avg>20.5){slowFor+=dt;smoothFor=0;}else{slowFor=0;smoothFor=avg<17.6?smoothFor+dt:0;}
        // A level the player picked stays as picked: no steps either way.
        if(held||!p.auto)return;
        // Too slow for a second: one step down, and that step is never tried again here.
        if(slowFor>=1000&&at<list.length-1){bad.add(at);slowFor=0;avg=BUDGET_MS;apply(at+1);return;}
        // Smooth for 3 s: time one real frame; step up only if the next step would still leave a third of the frame free.
        if(smoothFor>=3000&&at>0&&!bad.has(at-1)&&typeof o.draw==="function"){
          smoothFor=0;const ms=gfxTimedDraw(renderer,o.draw),scale=Math.pow(list[at-1]/list[at],2);
          if(ms*scale<BUDGET_MS*.66)apply(at-1);else bad.add(at-1);
        }
      },
      // Between beats only: a held governor never changes the picture mid-shot.
      hold(v){held=Boolean(v);if(!held){slowFor=0;smoothFor=0;}},
      resize(){const cur=list[at];p=gfxProfile();list=gfxSteps(p,capOf());at=nearest(cur);bad.clear();if(list[at]!==cur)apply(at);},
      // Codex on #1263: calibrate() may move Auto after the governor was made. Take the new profile's steps and ratio, so a
      // step down never comes back as a higher ratio (calibrate calls this itself; scenes need not).
      sync(){if(ended)return;p=gfxProfile();list=gfxSteps(p,capOf());bad.clear();slowFor=0;smoothFor=0;avg=BUDGET_MS;apply(nearest(p.pixelRatio));},
      level(){return p.level;},
      name(){return p.name;},
      pixelRatio(){return list[at];},
      frameMs(){return +avg.toFixed(1);},
      end(){if(ended)return;ended=true;try{renderer.domElement?.removeEventListener?.("webglcontextlost",lost);}catch(_error){}if(key&&p.auto)gfxWrite(MEMORY_KEY(key),list[at]);if(active===api)active=null;}
    };
    active=api;
    return api;
  }

  // Device check recorder: frame-to-frame times from the scene's own loop for BENCH_MS (after a short settle), then a few
  // timed draws (the GPU cost, which a 60 Hz screen hides), posted once to the parent page and fired as an event here.
  function gfxBenchStats(dts){
    const n=dts.length;if(!n)return {frames:0,avg:0,p1low:0,ms:0};
    const total=dts.reduce((a,b)=>a+b,0),sorted=dts.slice().sort((a,b)=>b-a),worst=sorted.slice(0,Math.max(1,Math.ceil(n/100)));
    const ms=total/n,worstMs=worst.reduce((a,b)=>a+b,0)/worst.length;
    return {frames:n,avg:+(1000/ms).toFixed(1),p1low:+(1000/worstMs).toFixed(1),ms:+ms.toFixed(2)};
  }
  function gfxBench(renderer,draw,key,p,pr){
    let start=0,last=0,done=false;const dts=[];
    return t=>{
      if(done)return;
      if(!start){start=t;last=t;return;}
      const dt=t-last;last=t;
      if(t-start<BENCH_SETTLE_MS)return;
      dts.push(dt);
      if(t-start<BENCH_SETTLE_MS+BENCH_MS)return;
      done=true;
      const draws=[];if(typeof draw==="function")for(let i=0;i<5;i+=1){try{draws.push(gfxTimedDraw(renderer,draw));}catch(_error){}}
      draws.sort((a,b)=>a-b);
      const result={type:"cms-gfx-bench",scene:key||"scene",level:p.level,name:p.name,pixelRatio:pr(),software:Boolean(p.software),gpu:p.gpu,
        ...gfxBenchStats(dts),drawMs:draws.length?+draws[Math.floor(draws.length/2)].toFixed(2):null};
      try{root.dispatchEvent?.(new root.CustomEvent("cms-gfx-bench",{detail:result}));}catch(_error){}
      try{if(root.parent&&root.parent!==root)root.parent.postMessage(result,root.location.origin);}catch(_error){}
    };
  }

  // ?fps=1 only: a small corner readout, four times a second, with its own frame clock.
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
        const ms=acc/n,p=gfxProfile(),gov=active,extra=(()=>{try{return info?info()||{}:{};}catch(_error){return {};}})();
        const lines=[`${Math.round(1000/ms)} fps  ${ms.toFixed(1)} ms  pr ${(gov?gov.pixelRatio():p.pixelRatio).toFixed(2)}`,
          `${p.name} (${p.choice}${p.auto&&p.level!==p.autoLevel?`, device says ${NAMES[p.autoLevel]}`:""})${p.calibratedMs!=null?`  cal ${p.calibratedMs} ms`:""}`,
          ...(p.fellBack?[`8K fell back to ultra: ${p.fellBack.reason}`]:[]),
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

  root.CareerModeGfxTier={contractVersion:1,storageKey:KEY,choices:CHOICES.slice(),names:NAMES.slice(),
    profile:gfxProfile,calibrate:gfxCalibrate,governor:gfxGovernor,overlay:gfxOverlay,classify:gfxClassify,
    // Settings: suggested() is what Auto would pick on this device, choice() the saved pick ("auto" by default), setChoice()
    // saves a pick for this device; it takes effect on the next 3D screen.
    suggested(){const p=gfxProfile();return {level:p.autoLevel,name:NAMES[p.autoLevel],measured:Boolean(p.measured)};},
    // Device check: what this device is taken for before any check (phone or computer, GPU, the level Auto starts at).
    device(){const p=gfxProfile();return {phone:Boolean(p.phone),gpu:p.gpu,software:Boolean(p.software),strongPhone:Boolean(p.strongPhone),
      guessLevel:p.guessLevel,guessName:NAMES[p.guessLevel],can8k:Boolean(p.can8k),dpr:p.dpr};},
    // Device check: the best level this device held, saved as its Auto; clearMeasured() goes back to the GPU-name guess.
    measured:gfxMeasured,benchStats:gfxBenchStats,
    setMeasured(level,detail){const l=Math.max(0,Math.min(4,Math.round(Number(level))));if(!Number.isFinite(l))return null;
      gfxWrite(MEASURED_KEY,JSON.stringify({level:l,at:Date.now(),...(detail&&typeof detail==="object"?{detail}:{})}));cached=null;return l;},
    clearMeasured(){gfxWrite(MEASURED_KEY,"null");cached=null;},
    choice:gfxChoice,setChoice(c){const v=CHOICES.includes(String(c))?String(c):"auto";gfxWrite(KEY,v);if(v==="8k")gfxWrite(FALLBACK_8K_KEY,"null");cached=null;return v;},
    // 8K is offered only where it can run (Settings shows it only then); samples()/checkTarget() size MSAA for render targets.
    can8k(){return Boolean(gfxProfile().can8k);},samples:gfxSamples,checkTarget:gfxCheckTarget,fallback8k:gfx8kFail,
    reset(){cached=null;}};
})(typeof globalThis!=="undefined"?globalThis:this);
