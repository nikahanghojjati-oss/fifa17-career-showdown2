"use strict";
// r87 proof lane (W3-8): screenshot every screen at tablet and sideways-phone sizes during a normal CE2PG run, with layout checks.
// It changes no game or harness file: it is loaded with NODE_OPTIONS=--require and wraps Playwright from the outside.
//
//   PROOF_SIZES="daniel=820x1180,nik=844x390" PROOF_OUT=test-results/proof-sizes/a \
//   NODE_OPTIONS="--require $PWD/tools/proof-sizes-hook.cjs" CE2PG_PLAN=single CE2PG_SEASONS=1 node tests/browser/ce2pg-journey.cjs
//
// Each new screen state (visible .screen ids + open overlays + main heading) is shot once per manager: the top of the viewport, and the
// bottom of `main` when main scrolls. Checks per shot go to <PROOF_OUT>/findings.jsonl:
//   hscroll   the page or main scrolls sideways
//   scroller  something other than `main` scrolls (main is the only scroller)
//   covered   a visible button/input/link in the viewport is covered at its centre by an unrelated element
//   offscreen a button sticks out of the viewport sideways
//   clipped   a button's or heading's text is cut (scrollWidth > clientWidth with overflow hidden)
//   dim       a fixed/absolute layer covering >= 60% of the viewport with a see-through dark fill or backdrop blur
const Module=require("node:module");
const fs=require("node:fs");
const path=require("node:path");

const probe=()=>{
  const vw=innerWidth,vh=innerHeight;
  const vis=el=>{if(!el)return false;const st=getComputedStyle(el);if(st.display==="none"||st.visibility==="hidden"||Number(st.opacity)===0)return false;const r=el.getBoundingClientRect();return r.width>1&&r.height>1;};
  const name=el=>{if(!el)return"";const id=el.id?`#${el.id}`:"";const cls=typeof el.className==="string"&&el.className.trim()?"."+el.className.trim().split(/\s+/).slice(0,2).join("."):"";return `${el.tagName.toLowerCase()}${id}${cls}`;};
  const label=el=>(el.innerText||el.value||el.getAttribute("aria-label")||"").replace(/\s+/g," ").trim().slice(0,50);
  const screens=[...document.querySelectorAll(".screen:not(.hidden)")].filter(vis).map(s=>s.id);
  const overlays=[...document.querySelectorAll("[id$='Overlay'],[role=dialog]")].filter(o=>!o.classList.contains("hidden")&&vis(o)).map(o=>o.id||name(o));
  const loading=vis(document.getElementById("loadingScreen"));
  const main=document.querySelector("main");
  const head=[...document.querySelectorAll(".screen:not(.hidden) h1,.screen:not(.hidden) h2")].filter(vis).map(h=>h.innerText.replace(/\s+/g," ").trim()).slice(0,2).join(" | ").slice(0,90);
  const issues=[];
  const de=document.documentElement;
  if(de.scrollWidth>vw+1||document.body.scrollWidth>vw+1)issues.push({kind:"hscroll",what:"page",detail:`scrollWidth ${Math.max(de.scrollWidth,document.body.scrollWidth)} > ${vw}`});
  if(main&&main.scrollWidth>main.clientWidth+1&&getComputedStyle(main).overflowX!=="hidden")issues.push({kind:"hscroll",what:"main",detail:`${main.scrollWidth} > ${main.clientWidth}`});
  for(const el of document.querySelectorAll("body *")){
    if(el===main||!vis(el))continue;
    const st=getComputedStyle(el);
    if(/(auto|scroll)/.test(st.overflowY)&&el.scrollHeight>el.clientHeight+2&&el.clientHeight>40)issues.push({kind:"scroller",what:name(el),detail:`overflow-y ${st.overflowY}, ${el.scrollHeight}>${el.clientHeight}`});
    if(/(auto|scroll)/.test(st.overflowX)&&el.scrollWidth>el.clientWidth+2&&el.clientWidth>40)issues.push({kind:"scroller",what:name(el),detail:`overflow-x ${st.overflowX}, ${el.scrollWidth}>${el.clientWidth} (sideways)`});
    if(st.position==="fixed"||st.position==="absolute"){
      const r=el.getBoundingClientRect();
      const area=Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0));
      if(area>=0.6*vw*vh){
        const m=st.backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        const a=m?(m[4]===undefined?1:Number(m[4])):0;
        const dark=m&&Number(m[1])+Number(m[2])+Number(m[3])<240;
        const blur=(st.backdropFilter&&st.backdropFilter!=="none")?st.backdropFilter:"";
        if((dark&&a>=0.15&&a<0.95)||blur)issues.push({kind:"dim",what:name(el),detail:`bg ${st.backgroundColor}${blur?`, backdrop ${blur}`:""}`});
      }
    }
  }
  for(const el of document.querySelectorAll("button,input:not([type=hidden]),select,textarea,a[href],[role=button],.menuTile")){
    if(!vis(el))continue;
    const r=el.getBoundingClientRect();
    if(r.right>vw+1||r.left<-1)issues.push({kind:"offscreen",what:name(el),text:label(el),detail:`x ${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`});
    const cx=r.left+r.width/2,cy=r.top+r.height/2;
    if(cx<0||cy<0||cx>=vw||cy>=vh)continue;
    const hit=document.elementFromPoint(cx,cy);
    if(hit&&hit!==el&&!el.contains(hit)&&!hit.contains(el)&&!(el.labels&&[...el.labels].some(l=>l.contains(hit)))){
      const hs=getComputedStyle(hit);
      if(hs.pointerEvents!=="none")issues.push({kind:"covered",what:name(el),text:label(el),detail:`covered by ${name(hit)} "${label(hit).slice(0,30)}"`});
    }
  }
  for(const el of document.querySelectorAll("button,h1,h2,h3,.menuTile")){
    if(!vis(el))continue;const st=getComputedStyle(el);
    if(el.scrollWidth>el.clientWidth+2&&/(hidden|clip)/.test(st.overflowX)&&el.clientWidth>0)issues.push({kind:"clipped",what:name(el),text:label(el),detail:`text ${el.scrollWidth}px in ${el.clientWidth}px`});
  }
  // blank: the screen has words in it but none of them is painted inside the viewport (a black screen the player cannot read)
  let inView=0,total=0;const where=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let t=walker.nextNode();t;t=walker.nextNode()){
    const txt=t.textContent.trim();if(!txt)continue;const el=t.parentElement;if(!el||!vis(el)||el.closest("#loadingScreen"))continue;
    const r=el.getBoundingClientRect();total+=txt.length;
    if(r.bottom>0&&r.right>0&&r.top<vh&&r.left<vw&&r.width>0&&r.height>0){
      const hit=document.elementFromPoint(Math.min(vw-1,Math.max(0,r.left+Math.min(r.width,20)/2)),Math.min(vh-1,Math.max(0,r.top+r.height/2)));
      if(hit&&(hit===el||el.contains(hit)||hit.contains(el)))inView+=txt.length;
    }else if(where.length<4)where.push(`${name(el)} "${txt.slice(0,30)}" at y ${Math.round(r.top)}..${Math.round(r.bottom)} x ${Math.round(r.left)}`);
  }
  if(!loading&&screens.length&&total>40&&inView<15){
    const chain=[];for(let e=document.querySelector(".screen:not(.hidden)");e&&e!==document.documentElement;e=e.parentElement){const st=getComputedStyle(e);const r=e.getBoundingClientRect();chain.push(`${name(e)}[${st.position} ${st.overflowY} op${st.opacity} ${Math.round(r.top)}/${Math.round(r.height)} sh${e.scrollHeight}]`);}
    issues.push({kind:"blank",what:screens.join("+"),detail:`${inView} of ${total} text chars visible; off-view e.g. ${where.join("; ")}; chain ${chain.join(" < ")}`});
  }
  // what is stacked at the middle of the viewport, top first (shows a see-through or click-through layer over the screen)
  const stack=document.elementsFromPoint(vw/2,vh/2).slice(0,8).map(e=>{const st=getComputedStyle(e);return `${name(e)}{op ${st.opacity}${st.pointerEvents==="none"?" pe-none":""}${st.backgroundColor!=="rgba(0, 0, 0, 0)"?" bg "+st.backgroundColor:""}${st.visibility!=="visible"?" "+st.visibility:""}${st.filter!=="none"?" filter "+st.filter:""}}`;});
  return {stack,screens,overlays,loading,head,issues,mainScrolls:Boolean(main&&main.scrollHeight>main.clientHeight+2),mainTop:main?main.scrollTop:0};
};
module.exports={probe};

const SPEC=process.env.PROOF_SIZES||"";
if(SPEC&&process.env.FIRESTORE_EMULATOR_HOST){
  const sizes={};
  for(const part of SPEC.split(",")){const [who,wh]=part.split("=");const [w,h]=wh.split("x").map(Number);sizes[who.trim()]={width:w,height:h};}
  const OUT=path.resolve(process.env.PROOF_OUT||"test-results/proof-sizes");
  fs.mkdirSync(OUT,{recursive:true});
  const seen=new Set();let shotNo=0;
  const findingsFile=path.join(OUT,"findings.jsonl");
  const log=o=>fs.appendFileSync(findingsFile,JSON.stringify(o)+"\n");

  async function watch(page,who){
    let busy=false,last="";
    const tick=async()=>{
      if(busy||page.isClosed())return;busy=true;
      try{
        const a=await page.evaluate(probe);
        const key=`${who}|${a.loading?"loading":""}|${a.screens.join(",")}|${a.overlays.join(",")}|${a.head}`;
        if(key!==last){
          last=key;
          // Settle: wait (up to 6 s) until no finite animation is running and every visible picture has loaded, so a shot shows the
          // screen as the player sees it once it has arrived, not a frame of its entrance.
          const t0=Date.now();
          await page.waitForFunction(()=>{
            const busy=document.getAnimations().some(an=>{const t=an.effect&&an.effect.getComputedTiming?an.effect.getComputedTiming():null;return an.playState==="running"&&t&&Number.isFinite(t.endTime);});
            const imgs=[...document.images].some(i=>i.getBoundingClientRect().width>0&&!i.complete);
            return !busy&&!imgs;
          },null,{timeout:6000,polling:150}).catch(()=>{});
          const settleMs=Date.now()-t0;
          await page.waitForTimeout(200);
          const b0=await page.evaluate(probe);
          await page.waitForTimeout(250);
          const b=await page.evaluate(probe);
          // keep only problems seen in both looks (drops frames caught mid-change)
          const sig=i=>`${i.kind}|${i.what}|${i.text||""}`;const firstLook=new Set(b0.issues.map(sig));
          b.issues=b.issues.filter(i=>firstLook.has(sig(i)));
          b.settleMs=settleMs;
          const key2=`${who}|${b.loading?"loading":""}|${b.screens.join(",")}|${b.overlays.join(",")}|${b.head}`;
          if(key2===key&&!seen.has(key)){
            seen.add(key);
            const n=String(++shotNo).padStart(3,"0");
            const vp=page.viewportSize();const size=`${vp.width}x${vp.height}`;
            const slug=`${n}-${who}-${size}-${(b.loading?"loading":(b.screens.join("+")||"none"))}${b.overlays.length?"+"+b.overlays.join("+"):""}`.replace(/[^\w+.-]+/g,"_").slice(0,120);
            const shots=[`${slug}.png`];
            await page.screenshot({path:path.join(OUT,shots[0])});
            const issues=[...b.issues];
            const typing=await page.evaluate(()=>/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||""));
            if(b.mainScrolls&&!typing){
              await page.evaluate(()=>{const m=document.querySelector("main");m.scrollTop=m.scrollHeight;});
              await page.waitForTimeout(150);
              const c=await page.evaluate(probe);
              for(const i of c.issues)if(!issues.some(x=>x.kind===i.kind&&x.what===i.what&&x.text===i.text))issues.push({...i,at:"bottom"});
              shots.push(`${slug}-bottom.png`);
              await page.screenshot({path:path.join(OUT,shots[1])});
              await page.evaluate(top=>{const m=document.querySelector("main");m.scrollTop=top;},b.mainTop);
            }
            log({n:Number(n),who,size,screens:b.screens,overlays:b.overlays,loading:b.loading,head:b.head,mainScrolls:b.mainScrolls,settleMs:b.settleMs,stack:b.stack,shots,issues});
          }
        }
      }catch(_e){/* page navigating or closed */}
      finally{busy=false;}
    };
    const timer=setInterval(tick,600);
    page.on("close",()=>clearInterval(timer));
  }

  const origLoad=Module._load;
  Module._load=function(request,parent,isMain){
    const mod=origLoad.apply(this,arguments);
    if(request==="playwright"&&!mod.__proofSizes){
      mod.__proofSizes=true;
      const proto=Object.getPrototypeOf(mod.chromium);
      const origLaunch=proto.launch;
      proto.launch=async function(...args){
        const browser=await origLaunch.apply(this,args);
        const origNewContext=browser.newContext.bind(browser);
        browser.newContext=async(opts={})=>{
          const ctx=await origNewContext(opts);
          const origNewPage=ctx.newPage.bind(ctx);
          ctx.newPage=async()=>{
            const page=await origNewPage();
            const origGoto=page.goto.bind(page);
            let wired=false;
            page.goto=async(url,o)=>{
              const who=(String(url).match(/cmsEmulatorUser=(\w+)/)||[])[1];
              if(who&&sizes[who]){
                await page.setViewportSize(sizes[who]);
                if(!wired){
                  wired=true;
                  if(process.env.PROOF_SHOTS!=="0")void watch(page,who);
                  // PROOF_TRACE=1: every console line and page error, per manager, to <PROOF_OUT>/trace-<who>.log
                  if(process.env.PROOF_TRACE==="1"){
                    const tf=path.join(OUT,`trace-${who}.log`);
                    page.on("console",msg=>fs.appendFileSync(tf,`${new Date().toISOString()} ${msg.type()} ${msg.text()}\n`));
                    await page.addInitScript(()=>{
                      addEventListener("click",ev=>{if(!ev.isTrusted)return;const t=ev.target;const b=t.closest&&t.closest("button");console.log(`[proof] click ${t.tagName}#${t.id||""}.${String(t.className||"").slice(0,40)} btn="${b?b.textContent.trim().slice(0,40):""}" at ${ev.clientX},${ev.clientY}`);setTimeout(()=>{const c=document.getElementById("showdownConfirm");console.log(`[proof] +1s confirm=${c?(c.className+" hidden="+c.hidden+" "+(c.innerText||"").replace(/\s+/g," ").slice(0,80)):"none"} err="${(document.getElementById("transferError")||document.querySelector("[id*=Error]:not(.hidden)"))?.innerText?.slice(0,120)||""}"`);},1000);},true);
                    });
                    page.on("pageerror",err=>fs.appendFileSync(tf,`${new Date().toISOString()} PAGEERROR ${err.message}\n`));
                  }
                }
              }
              return origGoto(url,o);
            };
            return page;
          };
          return ctx;
        };
        return browser;
      };
    }
    return mod;
  };
}
