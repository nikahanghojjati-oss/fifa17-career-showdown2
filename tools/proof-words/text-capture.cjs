"use strict";
// W3-7 proof-words (r87): read-only text capture for any Playwright harness.
// Use: NODE_OPTIONS="--require ./tools/proof-words/text-capture.cjs" npm run test:ce2pg
// Every page (and its iframes) is sampled every PROOF_WORDS_MS (default 700 ms); each distinct visible line is kept with the
// first screen it appeared on (body[data-screen] / location.hash / title) and the viewport. Written to
// test-results/proof-words/<pid>.json at exit. Changes nothing in the page; adds no Firestore traffic.
const Module=require("node:module");
const fs=require("node:fs");
const path=require("node:path");
const OUT=path.resolve(__dirname,"../../test-results/proof-words");
const EVERY=Number(process.env.PROOF_WORDS_MS||700);
const lines=new Map();// text -> {first, screens:Set, viewports:Set}
let pageNo=0;
function record(list,vp){
  for(const {t,screen} of list){
    let e=lines.get(t);
    if(!e){e={first:new Date().toISOString(),screens:new Set(),viewports:new Set()};lines.set(t,e);}
    e.screens.add(screen);e.viewports.add(vp);
  }
}
const SAMPLE=()=>{
  const out=[];const vis=[...document.querySelectorAll("section.screen:not(.hidden)")].map(e=>e.id).join("+");const screen=(document.documentElement.getAttribute("data-v10-screen")||"")+(vis?"#"+vis:"")||location.pathname.split("/").slice(-2).join("/");
  const walk=(root)=>{
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;while((n=tw.nextNode())){
      const t=n.nodeValue.replace(/\s+/g," ").trim();if(!t||!/[A-Za-z]/.test(t))continue;
      const el=n.parentElement;if(!el)continue;
      const cs=getComputedStyle(el);if(cs.display==="none"||cs.visibility==="hidden"||Number(cs.opacity)===0)continue;
      const r=el.getBoundingClientRect();if(r.width===0&&r.height===0)continue;
      if(el.closest("script,style,noscript,template"))continue;
      out.push({t:(el.closest("[hidden],[aria-hidden=true]")?"[aria-hidden] ":"")+t,screen:String(screen).slice(0,80)});
    }
    for(const el of root.querySelectorAll?root.querySelectorAll("[aria-label],[title],[placeholder],input[value]"):[]){
      for(const a of ["aria-label","title","placeholder"]){const v=el.getAttribute(a);if(v&&/[A-Za-z]/.test(v))out.push({t:`@${a} ${v.trim()}`,screen:String(screen).slice(0,80)});}
    }
  };
  if(document.body)walk(document.body);
  return out;
};
function hookPage(page,vp){
  const id=++pageNo;let stop=false;
  page.on("close",()=>{stop=true;});
  (async()=>{
    while(!stop){
      try{for(const f of page.frames()){const r=await f.evaluate(SAMPLE).catch(()=>null);if(r)record(r,`${vp}${f===page.mainFrame()?"":" frame:"+(f.url().split("/").slice(-2).join("/"))}`);}}catch{}
      await new Promise(r=>setTimeout(r,EVERY));
    }
  })();
}
function wrapContext(ctx,vp){
  const np=ctx.newPage.bind(ctx);
  ctx.newPage=async(...a)=>{const p=await np(...a);hookPage(p,vp);return p;};
  return ctx;
}
const orig=Module._load;
Module._load=function(req,...rest){
  const m=orig.call(this,req,...rest);
  if(req==="playwright"&&m&&m.chromium&&!m.chromium.__pw){
    const launch=m.chromium.launch.bind(m.chromium);
    m.chromium.launch=async(...a)=>{
      const b=await launch(...a);const nc=b.newContext.bind(b);
      b.newContext=async(opts={},...r)=>{const vp=opts.viewport?`${opts.viewport.width}x${opts.viewport.height}`:"default";return wrapContext(await nc(opts,...r),vp);};
      return b;
    };
    m.chromium.__pw=true;
  }
  return m;
};
function dump(){
  try{
    fs.mkdirSync(OUT,{recursive:true});
    const arr=[...lines].map(([t,e])=>({t,first:e.first,screens:[...e.screens],viewports:[...e.viewports]}));
    if(arr.length)fs.writeFileSync(path.join(OUT,`${process.pid}.json`),JSON.stringify(arr,null,1));
  }catch{}
}
setInterval(dump,30000).unref();
process.on("exit",dump);
