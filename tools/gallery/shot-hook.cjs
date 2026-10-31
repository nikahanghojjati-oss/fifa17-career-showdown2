"use strict";
// Gallery capture hook (r87, docs/tools only). Preload it into any Playwright harness:
//   GALLERY_OUT=$PWD/test-results/gallery-r87 NODE_OPTIONS="--require $PWD/tools/gallery/shot-hook.cjs" \
//     CE2PG_RUN=3 CE2PG_PLAN=single CE2PG_SEASONS=1 node tests/browser/ce2pg-journey.cjs
// (NODE_OPTIONS, not -r: CE2PG re-runs itself under firebase emulators:exec, and only NODE_OPTIONS reaches that child.)
// It patches chromium.launch so every new browser context gets a watcher. Whenever the visible screen settles on a new
// "signature" (visible top-level screen id + its first heading + any open dialog/overlay heading), it saves ONE screenshot:
//   <GALLERY_OUT>/<device>/<NNN>-<slug>.png  plus a line in <GALLERY_OUT>/shots.jsonl
// device = "desktop" for a context at least 1000 px wide, else "phone".
// GALLERY_DESKTOP / GALLERY_PHONE (e.g. 1440x900 / 390x844) override the harness viewports so shots match the gallery sizes.
// It never taps or types: it only watches, so the harness's own checks stay the source of truth.
const fs=require("node:fs");
const path=require("node:path");
const pw=require("playwright");

const OUT=path.resolve(process.env.GALLERY_OUT||"test-results/gallery");
const SETTLE_MS=Number(process.env.GALLERY_SETTLE_MS||1000);
const MAX_PER_SIG=Number(process.env.GALLERY_MAX_PER_SIG||2);
fs.mkdirSync(OUT,{recursive:true});
const LOG=path.join(OUT,"shots.jsonl");
let counter=0;
const parseSize=s=>{const m=/^(\d+)x(\d+)$/.exec(s||"");return m?{width:+m[1],height:+m[2]}:null;};

function watcher(settleMs){
  // Runs in the page. Reports a signature once it has been stable for settleMs and the loading screen is hidden.
  let frameEl=null,frameAt=0;
  const norm=s=>String(s||"").replace(/\s+/g," ").trim().slice(0,60);
  const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);return r.width>40&&r.height>40&&cs.visibility!=="hidden"&&cs.display!=="none"&&+cs.opacity>0.05;};
  const sig=()=>{
    const load=document.getElementById("loadingScreen");
    if(load&&visible(load))return null;
    const screens=[...document.querySelectorAll(".screen:not(.hidden)")].filter(visible);
    const top=screens[screens.length-1];
    const parts=[];
    // Full-screen layers that are not .screen sections: the Gazette page and the 3D iframes (roulette, Special Player).
    const gz=document.getElementById("touchlineGazette");
    if(gz&&visible(gz)){const h=gz.querySelector("h1,h2,.masthead,[class*=headline]");return "gazette | "+norm(h?h.innerText:"")+(gz.dataset.edition?" | "+gz.dataset.edition:"");}
    const big=[...document.querySelectorAll("iframe")].filter(f=>{if(!visible(f))return false;const r=f.getBoundingClientRect();return r.width*r.height>0.5*innerWidth*innerHeight;}).pop();
    if(big){
      // A 3D scene keeps one signature while it plays, so take a frame every 4 s (up to 4) to show it moving.
      if(big!==frameEl){frameEl=big;frameAt=Date.now();}
      return "frame | "+norm(big.title||big.getAttribute("src")||"iframe")+" | t"+Math.min(3,Math.floor((Date.now()-frameAt)/4000));
    }
    frameEl=null;
    if(top){parts.push(top.id||top.className.split(" ").join("."));const h=top.querySelector("h1,h2,[role=heading]");if(h&&visible(h))parts.push(norm(h.innerText));}
    const over=[...document.querySelectorAll("dialog[open],[role=dialog],[aria-modal=true],.modal:not(.hidden),.overlay:not(.hidden)")].filter(visible).pop();
    if(over){const h=over.querySelector("h1,h2,h3,[role=heading]");parts.push("over:"+(over.id||"")+":"+norm(h?h.innerText:over.innerText.slice(0,40)));}
    if(!parts.length){const h=[...document.querySelectorAll("h1,h2")].find(visible);if(h)parts.push("page:"+norm(h.innerText));}
    return parts.join(" | ")||null;
  };
  window.__gallerySig=()=>{try{return sig();}catch(_e){return null;}};
  let last=null,since=0,sent=null;
  setInterval(()=>{
    let s=null;try{s=sig();}catch(_e){}
    const now=Date.now();
    if(s!==last){last=s;since=now;return;}
    if(s&&s!==sent&&now-since>=settleMs){sent=s;if(typeof window.__galleryShot==="function")void window.__galleryShot(s).catch(()=>{});}
  },250);
}

// The harness taps through fast screens (3D scenes, Gazette, Season Results) in under a second, before they settle.
// So before every tap, if the screen on show is one we have no picture of yet, take one first ("tap:" signature).
const shooters=new WeakMap();
let locatorPatched=false;
function patchLocator(page){
  if(locatorPatched)return;locatorPatched=true;
  const proto=Object.getPrototypeOf(page.locator("body"));
  const origClick=proto.click;
  proto.click=async function(...args){
    try{
      const pg=this.page();const shoot=shooters.get(pg.context());
      const sig=await pg.evaluate(()=>window.__gallerySig&&window.__gallerySig()).catch(()=>null);
      if(shoot&&sig)await shoot(pg,"tap:"+sig.replace(/ \| t\d$/,""));
    }catch(_e){}
    return origClick.apply(this,args);
  };
}

async function install(context,opts){
  const width=(opts&&opts.viewport&&opts.viewport.width)||1280;
  const device=width>=1000?"desktop":"phone";
  const dir=path.join(OUT,device);fs.mkdirSync(dir,{recursive:true});
  const seen=new Map();
  const shoot=async(page,sig)=>{
    const n=(seen.get(sig)||0)+1;if(n>MAX_PER_SIG)return;seen.set(sig,n);
    const id=String(++counter).padStart(3,"0");
    const slug=sig.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);
    const file=path.join(dir,`${id}-${slug}.png`);
    try{await page.screenshot({path:file,timeout:15000});
      fs.appendFileSync(LOG,JSON.stringify({id,device,sig,file:path.relative(OUT,file),url:page.url(),at:new Date().toISOString()})+"\n");}
    catch(error){fs.appendFileSync(LOG,JSON.stringify({id,device,sig,error:String(error.message).split("\n")[0]})+"\n");}
  };
  shooters.set(context,shoot);
  await context.exposeBinding("__galleryShot",async(source,sig)=>shoot(source.page,sig));
  context.on("page",page=>patchLocator(page));
  await context.addInitScript(watcher,SETTLE_MS);
}

const origLaunch=pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch=async(opts={},...rest)=>{
  // WebGL for the 3D scenes in headless Chromium (as in #1075). Off with GALLERY_GL=0.
  if(process.env.GALLERY_GL!=="0"){const a=(opts.args||[]).filter(x=>!/^--use-angle=|^--use-gl=|^--disable-gpu$/.test(x));opts={...opts,args:[...a,"--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]};}
  const browser=await origLaunch(opts,...rest);
  const origNew=browser.newContext.bind(browser);
  browser.newContext=async(opts={})=>{
    const o={...opts};
    if(o.viewport){const want=o.viewport.width>=1000?parseSize(process.env.GALLERY_DESKTOP):parseSize(process.env.GALLERY_PHONE);if(want)o.viewport=want;}
    const context=await origNew(o);
    await install(context,o);
    return context;
  };
  return browser;
};
console.log(`[gallery] capturing settled screens to ${OUT}`);
