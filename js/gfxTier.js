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
  // size, so a 4K or 8K screen is sharp, and up to 2x past it while the buffer stays within 3840x2160). Auto never renders
  // above devicePixelRatio. A picked level is held as picked (the governor moves only Auto). Scene knobs (crowd, bloom, shadow
  // size) read the profile; the governor only moves the pixel ratio, steps down when frames run long, steps up only after
  // a timed frame shows room, and never goes back to a step that ran slow (no see-saw).
  const KEY="careerModeShowdown.gfxQuality.v1";
  const CHOICES=["auto","light","medium","high","extra","ultra"];
  const NAMES=["light","medium","high","extra","ultra"];
  // Per level: the pixel ratio it starts at and may reach (both capped by the screen), shadow map size, crowd density, bloom.
  const LEVELS=[
    {pr:1,max:1,shadowSize:1024,density:.45,bloom:false},
    {pr:1.25,max:1.5,shadowSize:1024,density:.7,bloom:true},
    {pr:1.5,max:2,shadowSize:2048,density:1,bloom:true},
    {pr:2,max:3,shadowSize:2048,density:1,bloom:true},
    {pr:2,max:4,shadowSize:4096,density:1,bloom:true}
  ];
  const BUDGET_MS=16.7,BUFFER_CAP=3840*2160;
  const MEMORY_KEY=key=>`careerModeShowdown.gfxSettled.v1.${key}`;
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
  // A picked choice is its level: light 0 .. ultra 4.
  function gfxChoiceLevel(c){return CHOICES.indexOf(c)-1;}

  // The GPU's own name, from a throwaway context (released at once).
  function gfxGpuName(){
    try{
      const c=root.document.createElement("canvas"),gl=c.getContext("webgl2")||c.getContext("webgl");if(!gl)return "";
      const ext=gl.getExtension("WEBGL_debug_renderer_info");
      const name=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||"");
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return name;
    }catch(_error){return "";}
  }
  // Auto level from the GPU name, then held down by a small memory, few cores or a phone screen.
  function gfxClassify(gpu,env){
    const g=String(gpu||"").toLowerCase(),e=env||{};
    const software=/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(g);
    let level=1;
    if(software)level=0;
    else if(/mali|powervr|adreno \(tm\) [1-5]\d\d\b|adreno [1-5]\d\d\b|intel.*\b(hd|uhd) graphics( [2-6]\d\d)?\b|apple a(9|1[0-2])\b/.test(g))level=0;
    else if(/rtx [2-9]0[6-9]0|rtx [4-9]0\d0|radeon rx [6-9]\d{3}|apple m[1-9] (pro|max|ultra)/.test(g))level=3;
    else if(/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|apple m[1-9]|apple gpu/.test(g))level=2;
    else if(/iris|adreno [6-9]\d\d|adreno \(tm\) [6-9]\d\d|radeon/.test(g))level=1;
    const mem=Number(e.deviceMemory)||0,cores=Number(e.cores)||0,phone=Boolean(e.phone);
    if(mem&&mem<=2)level=0;else if(mem&&mem<=4)level=Math.min(level,1);
    if(cores&&cores<=4)level=Math.min(level,1);
    if(phone)level=Math.min(level,2);
    return {level,software};
  }
  function gfxScreenEnv(){
    const s=root.screen||{};
    return {dpr:Math.max(.5,Number(root.devicePixelRatio)||1),deviceMemory:root.navigator?.deviceMemory,cores:root.navigator?.hardwareConcurrency,
      phone:Math.min(s.width||1e4,s.height||1e4)<700};
  }
  function gfxBuild(level,base){
    const L=LEVELS[level],dpr=base.dpr;
    // Auto and the named levels stay at or under the screen's own ratio; ultra always reaches it (a 4K or 8K screen draws
    // at native size) and may draw past it up to 2x, as long as the buffer stays within 3840x2160 (the governor checks).
    const max=level===4?Math.max(dpr,2*dpr):Math.min(L.max,dpr);
    const min=Math.min(1,dpr,max);
    return {level,name:NAMES[level],choice:base.choice,gpu:base.gpu,software:base.software,dpr,
      pixelRatio:Math.max(min,Math.min(L.pr,max)),maxPixelRatio:max,minPixelRatio:min,
      antialias:!base.software,shadowSize:L.shadowSize,density:L.density,bloom:L.bloom};
  }
  function gfxProfile(){
    if(cached)return cached;
    const env=gfxScreenEnv(),gpu=gfxGpuName(),c=gfxChoice(),auto=gfxClassify(gpu,env);
    const forced=gfxQuery("gfx"),forcedLevel=forced!==null&&/^[0-4]$/.test(forced)?Number(forced):null;
    let level=forcedLevel!==null?forcedLevel:c==="auto"?auto.level:gfxChoiceLevel(c);
    cached=gfxBuild(level,{dpr:env.dpr,gpu,software:auto.software,choice:forcedLevel!==null?`gfx=${forcedLevel}`:c});
    cached.auto=c==="auto"&&forcedLevel===null;cached.autoLevel=auto.level;
    return cached;
  }
  function gfxSetLevel(level){const p=gfxProfile();const next=gfxBuild(Math.max(0,Math.min(4,level)),{dpr:p.dpr,gpu:p.gpu,software:p.software,choice:p.choice});
    next.auto=p.auto;next.autoLevel=p.autoLevel;cached=next;return next;}

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
    const o=opts||{},key=o.key?String(o.key):"",p=gfxProfile();
    const size=()=>{const c=renderer.domElement;return {w:c?.clientWidth||0,h:c?.clientHeight||0};};
    // Ultra's buffer cap comes from the live canvas size.
    const capOf=()=>{const s=size();return s.w&&s.h?Math.max(p.minPixelRatio,p.level===4?Math.max(p.dpr,Math.sqrt(BUFFER_CAP/(s.w*s.h))):p.maxPixelRatio):p.maxPixelRatio;};
    let list=gfxSteps(p,capOf());
    const nearest=v=>{let i=0,d=1e9;list.forEach((x,k)=>{const e=Math.abs(x-v);if(e<d){d=e;i=k;}});return i;};
    let at=nearest(p.pixelRatio);
    // A level that ran slow last time on this screen is where the next visit starts.
    const settled=key?Number(gfxRead(MEMORY_KEY(key))):NaN;
    if(p.auto&&Number.isFinite(settled)&&settled>0)at=Math.max(at,nearest(settled));
    const bad=new Set();let held=false,last=0,avg=BUDGET_MS,slowFor=0,smoothFor=0,ended=false;
    const apply=i=>{at=i;try{renderer.setPixelRatio(list[at]);}catch(_error){}try{o.onChange?.({...p,pixelRatio:list[at]});}catch(_error){}};
    apply(at);
    const api={
      frame(t){
        if(ended)return;
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
      resize(){const cur=list[at];list=gfxSteps(p,capOf());at=nearest(cur);bad.clear();if(list[at]!==cur)apply(at);},
      level(){return p.level;},
      name(){return p.name;},
      pixelRatio(){return list[at];},
      frameMs(){return +avg.toFixed(1);},
      end(){if(ended)return;ended=true;if(key&&p.auto)gfxWrite(MEMORY_KEY(key),list[at]);if(active===api)active=null;}
    };
    active=api;
    return api;
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
    suggested(){const p=gfxProfile();return {level:p.autoLevel,name:NAMES[p.autoLevel]};},
    choice:gfxChoice,setChoice(c){const v=CHOICES.includes(String(c))?String(c):"auto";gfxWrite(KEY,v);cached=null;return v;},
    reset(){cached=null;}};
})(typeof globalThis!=="undefined"?globalThis:this);
