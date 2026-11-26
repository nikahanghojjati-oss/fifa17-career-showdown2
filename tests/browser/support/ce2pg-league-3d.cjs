"use strict";
// r100 (Nik 2026-11-26: "League Roulette always the 3D board, never the old wheel, in every clubhouse"). A real-Chrome WebGL
// check of League Roulette in a real two-manager Showdown. CE2PG's own Chromium starts with --disable-webgl, so every Gate and
// CE2PG journey only ever played the 2D fallback (the audit in gameplay/r100/threads/lr-audit). Loaded with NODE_OPTIONS beside
// the journey (no edit to the harness), opt-in, never in the Gate:
//   CE2PG_LR3D=1 LR_THEME=matte CE2PG_PLAN=single CE2PG_SEASONS=1 \
//   CMS_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome \
//   NODE_OPTIONS="--require ./tests/browser/support/ce2pg-league-3d.cjs" node tests/browser/ce2pg-journey.cjs
// LR_THEME: wooden | silver (Platinum) | black (Black Steel) | matte (Graphite). LR_SWAP=1 gives Daniel the phone (390x844,
// touch) and Nik the desktop (1920x866); by default Daniel is on the desktop and Nik on the phone.
// Every frame either manager's page paints while League Roulette is up is sampled (requestAnimationFrame), from the page's first
// frame: Daniel's "Waiting for Nik", both first entries, a reload mid-roulette on each phone, a late join in a new tab, a lost
// WebGL context, and all four balls. At exit:
//   L1 every frame not fully under the loading screen shows the 3D board in its clubhouse's V4 room: board on (lr3d-on, a canvas,
//      shown), html.lr3d-room, html[data-v10-setup=league], the room's own V4 plate, no 2D wheel part visible, nothing pending
//   L2 the loading screen never comes back once the board has shown (per visit of the screen)
//   L3 Daniel's waiting screen (before Nik joined) was really sampled, and was the 3D board (L1)
//   L4 a page reloaded mid-roulette, or joining late, shows the balls already dropped at once: the board opens on the ledger's
//      stage and no ball rolls again
//   L5 a lost WebGL context leaves no dead screen: within 8 s the board is drawn again, on the same stage
//   L6 the result is the same on both phones: four balls on both boards, the same league named, the ledger's league
//   L7 no old-wheel picture is ever asked for (WHEEL_RIM, the V3 League room)
// Output: "LR3D" lines and test-results/<tag>-league-3d.json. Stops the journey after the roulette (CE2PG_LR3D_STOP=0 plays on).
const fs=require("node:fs");
const path=require("node:path");
const isCe2pg=Boolean(process.env.FIRESTORE_EMULATOR_HOST)&&/ce2pg-journey\.cjs$/.test(process.argv[1]||"");
if(isCe2pg&&process.env.CE2PG_LR3D==="1")install();

const THEME=process.env.LR_THEME||"wooden";
const SWAP=process.env.LR_SWAP==="1";
const DESKTOP={viewport:{width:1920,height:866}};
const PHONE={viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// One line per change of what the League Roulette screen shows (only while it is the active screen).
const FRAMES_INIT=`(()=>{const F=window.__lr3dFrames=[];let last="";
const op=e=>{let o=1;while(e&&e.nodeType===1){const s=getComputedStyle(e);o*=Number(s.opacity);if(s.visibility==="hidden"||s.display==="none")return 0;e=e.parentElement;}return o;};
const tick=()=>{try{const s=document.getElementById("leagueWheelScreen");
if(s&&!s.classList.contains("hidden")){const L=document.getElementById("loadingScreen"),lc=L&&getComputedStyle(L);
const lo=L&&!L.hidden&&!L.classList.contains("hidden")&&lc.display!=="none"&&lc.visibility!=="hidden"?Number(lc.opacity):0;
const w=document.getElementById("leagueWheel"),h=w&&w.querySelector(".lr3dHost"),c=h&&h.querySelector("canvas"),b=document.getElementById("background");
const bg=b?getComputedStyle(b).backgroundImage.replace(/https?:\\/\\/[^/]+\\//g,"").replace(/visual-assets\\/v10_1\\//g,""):"";
const v2=w?[...w.children].filter(e=>!e.classList.contains("lr3dHost")&&getComputedStyle(e).visibility!=="hidden"&&e.getClientRects().length).length:0;
const st=window.CareerModeLeagueRouletteStep,P=window.CareerModeProductionSharedShowdownPresentation;
const f={lo:Math.round(lo*100)/100,lx:Boolean(L&&L.classList.contains("is-exiting")),on:Boolean(w&&w.classList.contains("lr3d-on")),cv:Boolean(c),hv:h?getComputedStyle(h).visibility:"-",
room:document.documentElement.classList.contains("lr3d-room"),setup:document.documentElement.getAttribute("data-v10-setup")||"",
v4:/ENV_BOX_[A-Z_]*V4/.test(bg),v3:/ENV_BOX_[A-Z_]*V3/.test(bg),bg:(bg.match(/ENV_BOX_[A-Z0-9_]+/)||[bg.slice(0,40)])[0],ch:(bg.match(/plates-hc\\/([a-z]+)\\//)||[0,""])[1],
v2,pend:s.hasAttribute("data-v10-pending"),wo:w?Math.round(op(w)*100)/100:0,stage:st?st.stage():null,
failed:st?st.failed():null,armed:st?st.armed():null,act:Boolean(P&&P.isPresentationActive&&P.isPresentationActive())};
const k=JSON.stringify(f);if(k!==last){last=k;F.push({t:Math.round(performance.now()),...f});}}
else if(last!=="off"){last="off";F.push({t:Math.round(performance.now()),off:true});}}catch(e){}requestAnimationFrame(tick);};requestAnimationFrame(tick);})();`;

// L4: every ball this page's board rolls (a page opened on a ledger with balls already in must roll none of them).
const ROLLS_INIT=`(()=>{window.__lr3dRolls=[];window.__lr3dBeats=[];const hook=()=>{const st=window.CareerModeLeagueRouletteStep;if(!st){setTimeout(hook,5);return;}st.on((type,data)=>{const t=Math.round(performance.now());if(type==="rolling"||type==="drop")window.__lr3dRolls.push({type,index:data&&data.index,t});if(type==="rolling"||type==="settled")window.__lr3dBeats.push({type,index:data&&data.index,stage:data&&data.stage,t});});};hook();})();`;


// Verify on #1633 (Daniel's board crawling at ~1.5 fps after a ball): every second, on both pages, how many WebGL contexts are
// alive, how many rAF loops run (a callback scheduled 3+ times in the second) and what each costs, the frame times, the
// long tasks, and the board's own probe (pixel ratio, governor frame time, draws, canvas size).
const PERF_INIT=`(()=>{const P=window.__lrPerf=[];const gls=[];const oc=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(t,...a){const c=oc.call(this,t,...a);if(c&&/webgl/i.test(String(t))&&!gls.some(g=>g.c===c))gls.push({c,cv:this,t:Math.round(performance.now())});return c;};
const raf=window.requestAnimationFrame.bind(window);let calls=new Map();
const label=f=>{let s="";try{s=Function.prototype.toString.call(f).replace(/\\s+/g," ").slice(0,48);}catch(e){}return s;};
window.requestAnimationFrame=function(f){const k=f;return raf(now=>{const t0=performance.now();try{f(now);}finally{const e=calls.get(k)||{n:0,ms:0,l:""};e.n+=1;e.ms+=performance.now()-t0;if(!e.l)e.l=label(f);calls.set(k,e);}});};
let long=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())long+=e.duration;}).observe({type:"longtask",buffered:false});}catch(e){}
const dts=[];let lastT=0;const ft=now=>{if(lastT)dts.push(now-lastT);lastT=now;raf(ft);};raf(ft);
setInterval(()=>{try{const loops=[...calls.values()].filter(e=>e.n>=3).map(e=>({n:e.n,ms:Math.round(e.ms),l:e.l}));calls=new Map();
const live=gls.filter(g=>{try{return !g.c.isContextLost()&&g.cv.isConnected;}catch(e){return false;}}).length;
const board=gls.filter(g=>{try{return !g.c.isContextLost()&&g.cv.isConnected&&Boolean(g.cv.closest("#leagueWheel"));}catch(e){return false;}}).length;
const orphan=gls.filter(g=>{try{return !g.c.isContextLost()&&!g.cv.isConnected;}catch(e){return false;}}).length;
const d=dts.splice(0).sort((a,b)=>a-b),q=x=>d.length?Math.round(d[Math.min(d.length-1,Math.floor(d.length*x))]):null;
const sc=window.CareerModeLeagueRoulette3d?.mount?.last,pr=sc&&sc.alive?sc.probe():null,cv=document.querySelector("#leagueWheel .lr3dHost canvas");
const st=window.CareerModeLeagueRouletteStep;
P.push({t:Math.round(performance.now()),scr:window.getActiveScreenName?.()||"",glMade:gls.length,glLive:live,glBoard:board,glOrphan:orphan,canvases:document.querySelectorAll("canvas").length,
loops:loops.length,loopMs:loops.reduce((a,e)=>a+e.ms,0),top:loops.sort((a,b)=>b.ms-a.ms).slice(0,3),fps:d.length,p50:q(.5),p95:q(.95),long:Math.round(long),
pr:pr&&pr.pixelRatio,fms:pr&&pr.frameMs,draws:pr&&pr.draws,lvl:pr&&pr.level,busy:pr&&pr.busy,stage:pr&&pr.stage,cw:cv&&cv.width,ch:cv&&cv.height,
armed:st?.armed?.(),hold:st?.holding?.()});long=0;if(P.length>900)P.splice(0,P.length-900);}catch(e){}},1000);})();`;
async function perf(m,label){const p=await m.page.evaluate(()=>(window.__lrPerf||[]).splice(0)).catch(()=>[]);(report.perf[m.user]||(report.perf[m.user]=[])).push({label,samples:p});
  const live=Math.max(0,...p.map(x=>x.glLive)),loops=Math.max(0,...p.map(x=>x.loops)),orphan=Math.max(0,...p.map(x=>x.glOrphan)),fps=p.filter(x=>x.scr==="leagueWheelScreen").map(x=>x.fps),
    lo=fps.length?Math.min(...fps):null,p95=Math.max(0,...p.map(x=>x.p95||0));
  console.log(`LR3D PERF ${m.user} ${label}: glLive max ${live}, orphan max ${orphan}, rAF loops max ${loops}, fps min ${lo}, frame p95 max ${p95} ms, pr ${[...new Set(p.map(x=>x.pr).filter(v=>v!=null))].join("/")}`);
  return {live,loops,orphan,lo,p95};}

function install(){
  const pw=require("playwright");
  const launch=pw.chromium.launch.bind(pw.chromium);
  const order=[];
  pw.chromium.launch=async(opts={},...rest)=>{
    // WebGL on (CE2PG's bundle turns it off): SwiftShader through ANGLE, as the audit ran it.
    const args=(opts.args||[]).filter(a=>a!=="--disable-webgl").concat(["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]);
    const browser=await launch({...opts,args},...rest);
    const newContext=browser.newContext.bind(browser);
    browser.newContext=async(copts={},...crest)=>{
      const who=order.length===0?"daniel":order.length===1?"nik":"";
      const size=who?((who==="daniel")!==SWAP?DESKTOP:PHONE):null;
      const ctx=await newContext(size?{...copts,...size}:copts,...crest);order.push(ctx);
      if(who){
        ctx.__lr3dWho=who;ctx.__lr3dReq=[];
        await ctx.addInitScript(t=>{try{if(t==="wooden")localStorage.removeItem("cmsClubhouseTheme");else localStorage.setItem("cmsClubhouseTheme",t);}catch(_e){}},THEME);
        await ctx.addInitScript(PERF_INIT);await ctx.addInitScript(FRAMES_INIT);await ctx.addInitScript(ROLLS_INIT);
        ctx.on("request",r=>{const u=r.url();if(/WHEEL_RIM|ENV_BOX_[A-Z_]*V3|ENV_BOX_[A-Z_]*V4/.test(u))ctx.__lr3dReq.push(u.replace(/^.*visual-assets\/v10_1\//,""));});
      }
      return ctx;
    };
    return browser;
  };
  const clubDraw=require("./club-draw.cjs");
  const original=clubDraw.playLeagueRoulette;
  clubDraw.playLeagueRoulette=async(daniel,nik,...rest)=>{
    const done=await run(daniel,nik).catch(error=>{report.errors.push(String(error&&error.stack||error).slice(0,800));return false;});
    finish();
    if(process.env.CE2PG_LR3D_STOP!=="0")process.exit(report.ok?0:1);
    if(!done)return original(daniel,nik,...rest);
  };
}

const report={theme:THEME,swap:SWAP,perf:{},checks:[],visits:[],requests:[],errors:[],ok:false};
function check(id,label,ok,detail){report.checks.push({id,label,ok:Boolean(ok),detail});console.log(`LR3D ${ok?"PASS":"FAIL"} ${id} ${label}${ok?"":` :: ${typeof detail==="string"?detail:JSON.stringify(detail).slice(0,900)}`}`);}
function finish(){
  report.ok=report.checks.length>0&&report.checks.every(c=>c.ok)&&!report.errors.length;
  const out=path.join(process.cwd(),"test-results",`${TAG}-league-3d.json`);
  try{fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,1));}catch(_e){}
  console.log(`LR3D ${report.ok?"PASS":"FAIL"} ${THEME}${SWAP?" (Daniel on the phone)":""}: ${report.checks.filter(c=>c.ok).length}/${report.checks.length} checks${report.errors.length?`, ${report.errors.length} error(s)`:""} -> ${out}`);
}

// A frame not fully under the loading screen must be the drawn 3D board in its room.
function frameFault(f){
  if(f.off)return null;
  const covered=f.lo>=0.99&&!f.lx;
  if(covered)return null;
  const why=[];
  if(!f.on)why.push("2D wheel (no lr3d-on)");
  if(f.v2)why.push(`${f.v2} 2D wheel part(s) visible`);
  if(!f.cv||f.hv==="hidden")why.push("no board drawn");
  if(f.pend||f.wo<=0.01)why.push("screen still pending (nothing shown)");
  if(!f.room)why.push("no lr3d-room");
  if(f.setup!=="league")why.push("no data-v10-setup=league (no room skin)");
  if(!f.v4)why.push(`room is not the V4 plate (${f.bg||"none"})`);
  const want=THEME==="wooden"?"":THEME;
  if(f.v4&&f.ch!==want)why.push(`room from clubhouse "${f.ch||"wooden"}" not "${want||"wooden"}"`);
  return why.length?why.join(", "):null;
}
// Splits a page's frames into visits of the screen and judges each visit (L1, L2).
// rebuild: the board is being built again after a context the browser never gave back; the room stays and the board is
// missing until the new one has drawn (a lost context shows nothing either way). That gap is measured, not a fault.
function judge(frames,label,who,{rebuild=false}={}){
  const visits=[];let cur=null;
  for(const f of frames){if(f.off){if(cur){visits.push(cur);cur=null;}continue;}if(!cur)cur={frames:[]};cur.frames.push(f);}
  if(cur)visits.push(cur);
  const faults=[],flashes=[];let waiting=0,gap=0;
  for(const v of visits){
    let shown=false;
    v.frames.forEach((f,i)=>{
      const next=v.frames[i+1],ms=next?next.t-f.t:0,bad=frameFault(f);
      if(bad&&rebuild&&bad==="no board drawn")gap+=ms;
      else if(bad)faults.push({t:f.t,ms,why:bad,lo:f.lo,stage:f.stage});
      const uncovered=!(f.lo>=0.99&&!f.lx);
      if(!bad&&uncovered){shown=true;if(!f.act)waiting+=ms;}
      if(shown&&f.lo>0.01&&!f.lx)flashes.push({t:f.t,ms,lo:f.lo});
    });
  }
  report.visits.push({who,label,visits:visits.length,frames:frames.length,faults:faults.slice(0,40),flashes:flashes.slice(0,40),waitingMs:waiting,rebuildGapMs:gap});
  if(rebuild)console.log(`LR3D note ${who} ${label}: board missing ${gap} ms while it was built again (room kept, nothing else shown)`);
  check(`L1.${who}.${label}`,`${who} ${label}: every frame off the loading screen is the 3D board in the ${THEME} V4 room`,faults.length===0,faults.slice(0,6));
  check(`L2.${who}.${label}`,`${who} ${label}: the loading screen never comes back once the board has shown`,flashes.length===0,flashes.slice(0,6));
  return {faults,flashes,waiting,visits};
}
const TAG=process.env.CE2PG_TAG||`ce2pg-lr3d-${THEME}${SWAP?"-swap":""}`;
async function shot(m,name){const dir=path.join(process.cwd(),"test-results",`${TAG}-league-3d`);try{fs.mkdirSync(dir,{recursive:true});await m.page.screenshot({path:path.join(dir,`${m.user}-${name.replace(/[^a-z0-9]+/gi,"-")}.png`)});}catch(_e){}}
async function frames(m){return m.page.evaluate(()=>(window.__lr3dFrames||[]).splice(0)).catch(()=>[]);}
async function settle(m,timeout=90000){
  await m.page.locator("#leagueWheelScreen").waitFor({state:"visible",timeout});
  await m.page.waitForFunction(()=>{const L=document.getElementById("loadingScreen"),st=window.CareerModeLeagueRouletteStep,P=window.CareerModeProductionSharedShowdownPresentation;
    const gone=!L||L.hidden||L.classList.contains("hidden")||getComputedStyle(L).display==="none";
    return gone&&P&&P.isPresentationActive&&P.isPresentationActive()&&st&&(st.failed()||document.querySelector("#leagueWheel .lr3dHost canvas"))&&st.caughtUp();},null,{timeout});
  await sleep(1500);
}
async function view(m){return m.page.evaluate(()=>{const st=window.CareerModeLeagueRouletteStep,S=window.CareerModeProductionSharedShowdownSetup?.getState?.();
  return {stage:st?st.stage():null,failed:st?st.failed():null,busy:st?st.busy():null,drops:S?.setupDrops??null,league:S?.setup?.leagueId||null,
    shown:(document.getElementById("selectedLeague")?.textContent||"").trim(),button:(document.getElementById("spinLeague")?.textContent||"").trim()};}).catch(e=>({error:String(e.message).slice(0,200)}));}
async function drops(m){return (await view(m)).drops||0;}
async function rolls(m){return m.page.evaluate(()=>window.__lr3dRolls||[]).catch(()=>null);}
async function reopened(m,label,before){
  await settle(m);await shot(m,label);
  const v=await view(m),r=await rolls(m);
  check(`L4.${m.user}.${label}`,`${m.user} ${label}: the board opens on the ledger's ${before} ball(s) at once, no ball rolls again`,v.stage===before&&v.drops===before&&!v.failed&&Array.isArray(r)&&r.length===0,{view:v,rolls:r});
  judge(await frames(m),label,m.user);
}
async function reload(m,label){
  const before=await drops(m);
  await m.page.reload({waitUntil:"domcontentloaded"});
  await reopened(m,label,before);
}
async function lateJoin(m,label){
  const before=await drops(m);
  const ctx=m.page.context(),old=m.page,url=old.url(),np=await ctx.newPage();
  m.page=np;await old.close().catch(()=>{});
  await np.goto(url,{waitUntil:"domcontentloaded"});
  const until=Date.now()+90000;
  while(Date.now()<until&&!(await np.locator("#leagueWheelScreen").isVisible().catch(()=>false))){
    for(const re of [/^\s*(DANIEL|NIK) · PLAYER/i,/^\s*SIGN IN WITH GOOGLE\s*$/i,/^\s*CONTINUE SHOWDOWN\s*$/i,/^\s*CONTINUE\b/i]){const b=np.locator("button:visible").filter({hasText:re}).first();if(await b.count()){await b.click({timeout:3000}).catch(()=>{});break;}}
    const tile=np.locator("#newShowdown:visible");if(await tile.count()&&/CONTINUE|JOIN|RETURN/i.test(await tile.innerText().catch(()=>"")))await tile.click({timeout:3000}).catch(()=>{});
    await sleep(1000);
  }
  await reopened(m,label,before);
}
const beats=[];
async function m8(m){const list=await m.page.evaluate(()=>window.__lr3dBeats||[]).catch(()=>[]);const out=[];let open=null;
  for(const e of list){if(e.type==="rolling")open=e;else if(e.type==="settled"&&open){out.push({index:open.index+1,ms:e.t-open.t});open=null;}}return out;}
async function dropNext(daniel,nik){
  const want=(await drops(daniel))+1;
  for(let i=0;i<120;i+=1){
    for(const m of [daniel,nik]){
      const ready=await m.page.evaluate(()=>{const b=document.getElementById("spinLeague");return Boolean(b&&!b.disabled&&!b.classList.contains("hidden")&&/^DROP BALL$/.test(b.textContent.trim()));}).catch(()=>false);
      if(ready){await m.page.locator("#spinLeague").click({timeout:30000});
        for(const p of [daniel,nik])await p.page.waitForFunction(b=>(window.CareerModeProductionSharedShowdownSetup?.getState?.()?.setupDrops||0)>=b,want,{timeout:45000});
        // Both pages at once (Verify on #1633: one after the other, a slow board on the first page hid the second's).
        const t0=Date.now();
        await Promise.all([daniel,nik].map(p=>p.page.waitForFunction(()=>window.CareerModeLeagueRouletteStep?.caughtUp?.(),null,{timeout:60000}).then(()=>{beats.push({ball:want,who:p.user,ms:Date.now()-t0});},async error=>{
          const why=await p.page.evaluate(()=>{const st=window.CareerModeLeagueRouletteStep,sc=window.CareerModeLeagueRoulette3d?.mount?.last,c=document.querySelector("#leagueWheel .lr3dHost canvas");
            return {armed:st?.armed(),failed:st?.failed(),stage:st?.stage(),busy:st?.busy(),caughtUp:st?.caughtUp(),probe:sc?.probe?.()||null,alive:sc?.alive,lost:c?c.getContext("webgl2")?.isContextLost():null,hosts:document.querySelectorAll("#leagueWheel .lr3dHost").length,
              vis:document.visibilityState,frames:(window.__lr3dFrames||[]).slice(-5),rolls:window.__lr3dRolls||[],perf:(window.__lrPerf||[]).slice(-12)};}).catch(e=>String(e.message));
          report.errors.push(`${p.user} board never caught up on ball ${want}: ${JSON.stringify(why).slice(0,6000)}`);throw error;})));
        return m.user;}
    }
    await sleep(500);
  }
  throw new Error(`nobody could drop ball ${want}`);
}
// L5: the board's WebGL context is lost (the GPU dropped it) and given back 1.5 s later; then lost for good on the other phone.
async function loseContext(m,label,{restore}){
  const before=await view(m);
  const lost=await m.page.evaluate(r=>{const c=document.querySelector("#leagueWheel .lr3dHost canvas");if(!c)return "no canvas";const gl=c.getContext("webgl2");const ext=gl&&gl.getExtension("WEBGL_lose_context");if(!ext)return "no WEBGL_lose_context";window.__lr3dLostCanvas=c;ext.loseContext();if(r)setTimeout(()=>{try{ext.restoreContext();}catch(_e){}},1500);return "lost";},restore).catch(e=>String(e.message));
  if(lost!=="lost"){check(`L5.${m.user}.${label}`,`${m.user} ${label}: lose the board's context`,false,lost);return;}
  const ok=await m.page.waitForFunction(stage=>{const st=window.CareerModeLeagueRouletteStep,c=document.querySelector("#leagueWheel .lr3dHost canvas");if(!st||st.failed()||!c)return false;
    const gl=c.getContext("webgl2");if(!gl||gl.isContextLost())return false;
    const p=window.CareerModeLeagueRoulette3d?.mount?.last?.probe?.();return st.stage()===stage&&p&&p.draws>0;},before.stage,{timeout:15000}).then(()=>true,()=>false);
  await sleep(1500);await shot(m,label);
  const after=await view(m);
  check(`L5.${m.user}.${label}`,`${m.user} ${label}: a lost WebGL context leaves no dead screen; the board is drawn again on the same ball within 15 s`,ok&&after.stage===before.stage&&!after.failed,{before,after});
  judge(await frames(m),label,m.user,{rebuild:!restore});
}

async function run(daniel,nik){
  for(const m of [daniel,nik])m.user=m.user||(m===daniel?"daniel":"nik");
  // First entries: Daniel's frames start on his "Waiting for Nik" screen.
  for(const m of [daniel,nik])await settle(m);
  const d0=judge(await frames(daniel),"first entry (waiting for Nik, then both connected)","daniel");
  check("L3.daniel.waiting",`Daniel's waiting screen (before Nik joined) was sampled: ${Math.round(d0.waiting)} ms of it uncovered and on the 3D board`,d0.waiting>0&&d0.faults.length===0,{waitingMs:d0.waiting,faults:d0.faults.slice(0,4)});
  judge(await frames(nik),"first entry","nik");
  for(const m of [daniel,nik])await perf(m,"first entry");
  for(const m of [daniel,nik])await shot(m,"first entry");
  // Ball 1, then a reload on each phone mid-roulette.
  await dropNext(daniel,nik);
  for(const m of [daniel,nik])judge(await frames(m),"ball 1",m.user);
  for(const m of [daniel,nik])await perf(m,"ball 1");
  await reload(nik,"reload after ball 1");
  await reload(daniel,"reload after ball 1");
  // Ball 2, then a late join (the tab closed, a new tab of the same browser opens the game).
  await dropNext(daniel,nik);
  for(const m of [daniel,nik])judge(await frames(m),"ball 2",m.user);
  for(const m of [daniel,nik])await perf(m,"ball 2 (after reloads)");
  await lateJoin(nik,"late join in a new tab after ball 2");
  // A lost WebGL context on each phone: given back on one, never given back on the other.
  await loseContext(daniel,"context lost and given back",{restore:true});
  await loseContext(nik,"context lost for good",{restore:false});
  // Balls 3 and 4: the result.
  for(const m of [daniel,nik])await perf(m,"late join and lost contexts");
  await dropNext(daniel,nik);await dropNext(daniel,nik);
  for(const m of [daniel,nik])judge(await frames(m),"balls 3 and 4",m.user);
  for(const m of [daniel,nik])await perf(m,"balls 3 and 4");
  const v={daniel:await view(daniel),nik:await view(nik)};
  check("L6.result","four balls on both boards, the same league named on both phones, the ledger's league",
    v.daniel.stage===4&&v.nik.stage===4&&v.daniel.drops===4&&v.nik.drops===4&&v.daniel.league&&v.daniel.league===v.nik.league&&v.daniel.shown&&v.daniel.shown===v.nik.shown,v);
  const reqs={daniel:[...new Set(daniel.page.context().__lr3dReq||[])],nik:[...new Set(nik.page.context().__lr3dReq||[])]};report.requests=reqs;
  const old=[...reqs.daniel,...reqs.nik].filter(u=>/WHEEL_RIM|ENV_BOX_[A-Z_]*V3/.test(u));
  check("L7.requests","no old-wheel picture asked for (WHEEL_RIM, the V3 League room)",old.length===0,old);
  // L8 (Verify on #1633): each ball's drop runs in real time on both pages, however slow the picture: from the tap to both
  // boards resting, and on each page from its roll to its settle. A drop is about 10 s; slow motion took 45 s to 2 minutes.
  const own={daniel:await m8(daniel),nik:await m8(nik)};report.beats={wait:beats,own};
  const slowest=Math.max(0,...beats.map(b=>b.ms)),ownMax=Math.max(0,...Object.values(own).flat().map(b=>b.ms));
  console.log(`LR3D BEATS tap->both rested: ${beats.map(b=>`${b.who[0]}${b.ball}=${(b.ms/1000).toFixed(1)}s`).join(" ")}; own roll->settle: ${Object.entries(own).map(([w,l])=>l.map(b=>`${w[0]}${b.index}=${(b.ms/1000).toFixed(1)}s`).join(" ")).join(" ")}`);
  check("L8.realtime",`every drop plays in real time on both pages (tap to both rested ${(slowest/1000).toFixed(1)} s at most, a page's own roll to settle ${(ownMax/1000).toFixed(1)} s at most; under 25 s)`,beats.length>=8&&slowest<25000&&ownMax<25000,{beats,own});
  const perfAll=Object.values(report.perf).flat().flatMap(s=>s.samples).filter(x=>x.scr==="leagueWheelScreen");
  // The Ball Game's scene (js/clubDrawScene3d.js, the same loop shape) is built behind the last ball: loops are counted while
  // the board's canvas is the page's only one, contexts by where their canvas is.
  const board=Math.max(0,...perfAll.map(x=>x.glBoard||0)),live=Math.max(0,...perfAll.map(x=>x.glLive)),
    boardLoops=Math.max(0,...perfAll.filter(x=>x.canvases<=1).map(x=>(x.top||[]).filter(t=>/raf=0;if\(disposed\)/.test(t.l)).length));
  check("L9.one-board",`one board on each page: at most one live WebGL context in the board (seen ${board}) and one board render loop at any second (seen ${boardLoops}); ${live} live on the page at most (the Ball Game's scene built behind the last ball)`,board<=1&&boardLoops<=1,{board,boardLoops,live});
  return true;
}
module.exports={FRAMES_INIT,frameFault};
