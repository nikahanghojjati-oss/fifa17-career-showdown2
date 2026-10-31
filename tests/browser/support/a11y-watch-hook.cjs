"use strict";
// r87 accessibility sweep hook (W3-11). Loaded with `node --require` around tests/browser/ce2pg-journey.cjs so the journey file
// itself stays untouched. It is inert unless A11Y_OUT is set and only acts once `playwright` is required (the emulator wrapper
// that also inherits NODE_OPTIONS never loads playwright).
//
// What it does: re-sizes the two managers' contexts (A11Y_VP_DANIEL / A11Y_VP_NIK, "WxH"), optionally turns on
// prefers-reduced-motion (A11Y_REDUCED_MOTION=1), watches every page for screen changes, and on each new screen (after the
// page goes quiet) saves a screenshot plus an audit row in A11Y_OUT/audit.jsonl:
//   - axe-core rules (names, labels, roles, color-contrast where axe can decide)
//   - "contrast": text vs. the real rendered pixels behind it (marble, photos): axe cannot judge text on images
//   - "tinytext": visible text under 12 px (phone) / 11 px (desktop)
//   - "smalltap": tap targets under 44x44 on a phone-width page (24x24 on desktop)
//   - "covered": a visible button/link whose centre is hidden under another element
//   - "clipped": text cut by its own box (overflow hidden, no ellipsis)
//   - "nofocus": clickable-looking element (cursor:pointer) that the keyboard cannot reach
//   - "motion": running infinite or long animations while reduced motion is on
const fs=require("fs");
const path=require("path");
const Module=require("module");

const OUT=process.env.A11Y_OUT;
if(OUT){
  const AXE_SOURCE=fs.readFileSync(require.resolve("axe-core/axe.min.js"),"utf8");
  const parseVp=v=>{const m=/^(\d+)x(\d+)$/.exec(v||"");return m?{width:Number(m[1]),height:Number(m[2])}:null;};
  // ce2pg RUN=1 opens Daniel at 393x660 and Nik at 390x844; that is how the hook tells the two contexts apart.
  const VP={"393x660":{who:"daniel",vp:parseVp(process.env.A11Y_VP_DANIEL)},"390x844":{who:"nik",vp:parseVp(process.env.A11Y_VP_NIK)}};
  const REDUCED=process.env.A11Y_REDUCED_MOTION==="1";
  const PER_KEY=Number(process.env.A11Y_PER_KEY||1);
  const KEYS=process.env.A11Y_KEYS==="1";// desktop only: walk the page with Tab and check each stop is visible and shows focus
  fs.mkdirSync(OUT,{recursive:true});
  let sink=null;// opened in the process that loads playwright (the emulator wrapper processes also inherit this hook)
  let seq=0;
  const seen=new Map();
  const origLoad=Module._load;
  let patched=false;
  Module._load=function(request,parent,isMain){
    const mod=origLoad.apply(this,arguments);
    if(!patched&&request==="playwright"&&mod&&mod.chromium){patched=true;patchChromium(mod.chromium);}
    return mod;
  };

  function patchChromium(chromium){
    // one run per output folder: rows and screenshots are reset together, so no row points at another pass's shot
    for(const f of fs.readdirSync(OUT))if(f==="audit.jsonl"||/\.png$/.test(f))fs.rmSync(path.join(OUT,f),{force:true});
    sink=fs.createWriteStream(path.join(OUT,"audit.jsonl"),{flags:"w"});
    const launch=chromium.launch.bind(chromium);
    chromium.launch=async(...args)=>{
      const browser=await launch(...args);
      const newContext=browser.newContext.bind(browser);
      browser.newContext=async(opts={})=>{
        const key=opts.viewport?`${opts.viewport.width}x${opts.viewport.height}`:"";
        const hit=VP[key]||{who:"other",vp:null};
        const o={...opts};
        if(hit.vp)o.viewport=hit.vp;
        if(REDUCED)o.reducedMotion="reduce";
        const ctx=await newContext(o);
        const vpLabel=`${(o.viewport||{}).width}x${(o.viewport||{}).height}`;
        const newPage=ctx.newPage.bind(ctx);
        ctx.newPage=async(...a)=>{const page=await newPage(...a);watch(page,hit.who,vpLabel);return page;};
        return ctx;
      };
      return browser;
    };
  }

  function watch(page,who,vpLabel){
    let stopped=false,lastKey=null,stableSince=0,busy=false;
    page.on("close",()=>{stopped=true;});
    const tick=async()=>{
      if(stopped)return;
      if(!busy){
        busy=true;
        try{
          const key=await page.evaluate(screenKey).catch(()=>null);
          if(key){
            if(key!==lastKey){lastKey=key;stableSince=Date.now();}
            else if(stableSince&&Date.now()-stableSince>1200){
              stableSince=0;
              const id=`${who}|${vpLabel}|${key}`;
              const n=seen.get(id)||0;
              if(n<PER_KEY){seen.set(id,n+1);await snap(page,who,vpLabel,key);}
            }
          }
        }catch(_e){}
        busy=false;
      }
      setTimeout(tick,350);
    };
    setTimeout(tick,500);
  }

  async function snap(page,who,vpLabel,key){
    const n=String(++seq).padStart(3,"0");
    const safe=key.replace(/[^a-zA-Z0-9]+/g,"_").slice(0,80);
    const file=`${who}-${vpLabel}-${n}-${safe}.png`;
    let png;
    try{png=await page.screenshot({path:path.join(OUT,file)});}catch(_e){return;}
    let audit=[];
    try{
      const hasAxe=await page.evaluate(()=>typeof window.axe!=="undefined");
      if(!hasAxe)await page.evaluate(AXE_SOURCE);
      audit=await page.evaluate(runAudit,{png:png.toString("base64"),reduced:REDUCED});
    }catch(e){audit=[{t:"auditerror",d:String(e&&e.message||e).slice(0,200)}];}
    if(KEYS&&!/LOADING$/.test(key)&&Number(vpLabel.split("x")[0])>700){
      try{audit=audit.concat(await keyWalk(page));}catch(e){audit.push({t:"keyerror",d:String(e&&e.message||e).slice(0,160)});}
    }
    sink.write(JSON.stringify({file,who,vp:vpLabel,key,at:Date.now(),audit})+"\n");
  }

  async function keyWalk(page){
    const out=[],stops=[];
    const saved=await page.evaluate(()=>{const m=document.querySelector("main")||document.scrollingElement;window.__a11yPrevFocus=document.activeElement;return {main:m?m.scrollTop:0,win:scrollY};});
    // start from the top of the document: focusing <body> (tabindex -1 for a moment) moves the sequential focus start point there
    await page.evaluate(()=>{const b=document.body,had=b.hasAttribute("tabindex");b.setAttribute("tabindex","-1");b.focus({preventScroll:true});if(!had)b.removeAttribute("tabindex");});
    let boundary=0;
    for(let i=0;i<60;i++){
      await page.keyboard.press("Tab");
      const st=await page.evaluate(()=>{
        const el=document.activeElement;if(!el||el===document.body)return null;
        const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
        const sel=el.tagName.toLowerCase()+(el.id?"#"+el.id:(el.classList[0]?"."+el.classList[0]:""));
        const ring=(cs.outlineStyle!=="none"&&parseFloat(cs.outlineWidth)>0)||(cs.boxShadow&&cs.boxShadow!=="none");
        const on=r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
        let o=1;for(let e=el;e&&e.nodeType===1;e=e.parentElement){const c=getComputedStyle(e);o*=Number(c.opacity);if(c.visibility==="hidden")o=0;}
        const hiddenBehind=(()=>{if(!on)return false;const t=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));return t&&t!==el&&!el.contains(t)&&!t.contains(el)?(t.id||t.className||t.tagName).toString().slice(0,40):false;})();
        return {sel,txt:(el.innerText||el.getAttribute("aria-label")||"").replace(/\s+/g," ").trim().slice(0,40),on,ring,opacity:o,hiddenBehind,w:Math.round(r.width),h:Math.round(r.height)};
      });
      // focus left the page (browser chrome): one more Tab comes back to the top; a second boundary means a full cycle
      if(!st){if(++boundary>=2||!stops.length)break;continue;}
      if(stops.length&&stops[0].sel===st.sel&&stops[0].txt===st.txt)break;
      stops.push(st);
    }
    for(const s of stops){
      if(!s.on||s.opacity<0.1||s.w<2||s.h<2)out.push({t:"focus-invisible",s:s.sel,d:`Tab stop not visible (on screen ${s.on}, opacity ${s.opacity.toFixed(2)}, ${s.w}x${s.h})`,txt:s.txt});
      else if(s.hiddenBehind)out.push({t:"focus-behind",s:s.sel,d:`Tab stop under ${s.hiddenBehind}`,txt:s.txt});
      else if(!s.ring)out.push({t:"focus-noring",s:s.sel,d:"no outline or box-shadow when focused (check other focus styles)",txt:s.txt});
    }
    out.push({t:"focus-order",d:stops.map(s=>s.txt||s.sel).join(" > ").slice(0,600)});
    await page.evaluate(saved=>{const m=document.querySelector("main")||document.scrollingElement;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();if(m)m.scrollTop=saved.main;scrollTo(0,saved.win);},saved);
    return out;
  }

  // ---- in-page helpers (serialised by page.evaluate) ----
  function screenKey(){
    const html=document.documentElement;
    const v10=(html.dataset&&html.dataset.v10Screen)||"";
    const active=typeof window.getActiveScreenName==="function"?(window.getActiveScreenName()||""):"";
    const W=innerWidth,H=innerHeight,over=[];
    for(const el of document.querySelectorAll("body *[id]")){
      const cs=getComputedStyle(el);
      if(cs.position!=="fixed"||cs.display==="none"||cs.visibility==="hidden"||Number(cs.opacity)<0.05)continue;
      const r=el.getBoundingClientRect();
      if(r.width*r.height<W*H*0.2)continue;
      if(/^(app|topHeader|bottomNav|sdNav|background|overlay)$/i.test(el.id))continue;
      over.push(el.id);
      if(over.length>=3)break;
    }
    const loader=document.querySelector("#loadingScreen:not(.hidden),.sd-loader:not(.hidden)");
    // the first visible heading tells sub-states apart (Season Results entry/review, Final Winner, Gazette, career tabs)
    let head="";
    for(const h of document.querySelectorAll("h1,h2,h3,[role=heading]")){
      const r=h.getBoundingClientRect();if(r.width<2||r.height<2||r.bottom<0||r.top>H)continue;
      const cs=getComputedStyle(h);if(cs.visibility==="hidden"||Number(cs.opacity)<0.2)continue;
      const t=(h.innerText||"").replace(/\s+/g," ").trim();
      if(!t||/^(CAREER MODE|SHOWDOWN)/i.test(t)&&head==="")continue;
      head=t.slice(0,24);break;
    }
    return [v10,active,over.join("+"),head,loader?"LOADING":""].join("|");
  }

  async function runAudit({png,reduced}){
    const out=[];
    const W=innerWidth,H=innerHeight,phone=W<=500;
    const vis=el=>{
      const cs=getComputedStyle(el);
      if(cs.display==="none"||cs.visibility==="hidden")return false;
      let o=1;for(let e=el;e&&e.nodeType===1;e=e.parentElement){const c=getComputedStyle(e);o*=Number(c.opacity);if(c.display==="none"||c.visibility==="hidden")return false;}
      if(o<0.2)return false;
      const r=el.getBoundingClientRect();
      return r.width>1&&r.height>1&&r.bottom>0&&r.right>0&&r.top<H&&r.left<W;
    };
    const label=el=>{
      const t=(el.innerText||el.getAttribute("aria-label")||el.getAttribute("title")||"").replace(/\s+/g," ").trim();
      return t.slice(0,60);
    };
    const sel=el=>{
      let s=el.tagName.toLowerCase();
      if(el.id)return s+"#"+el.id;
      const c=[...el.classList].slice(0,2).join(".");
      return c?s+"."+c:s;
    };
    // axe
    try{
      const res=await window.axe.run(document,{resultTypes:["violations"],runOnly:{type:"rule",values:["button-name","link-name","image-alt","input-button-name","label","select-name","aria-allowed-attr","aria-required-attr","aria-valid-attr-value","aria-hidden-focus","nested-interactive","color-contrast","duplicate-id-aria","frame-title","role-img-alt","scrollable-region-focusable","meta-viewport"]}});
      for(const v of res.violations)for(const n of v.nodes.slice(0,12)){
        out.push({t:"axe:"+v.id,s:String(n.target&&n.target[0]||""),d:(n.failureSummary||"").replace(/\s+/g," ").slice(0,160),txt:(n.html||"").replace(/\s+/g," ").slice(0,90)});
      }
    }catch(e){out.push({t:"axeerror",d:String(e.message||e).slice(0,120)});}

    // decode screenshot for pixel contrast
    let img=null;
    try{
      const blob=await (await fetch("data:image/png;base64,"+png)).blob();
      const bmp=await createImageBitmap(blob);
      const cv=new OffscreenCanvas(bmp.width,bmp.height);const cx=cv.getContext("2d");cx.drawImage(bmp,0,0);
      img={w:bmp.width,h:bmp.height,data:cx.getImageData(0,0,bmp.width,bmp.height).data,scale:bmp.width/W};
    }catch(_e){}
    const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
    const lum=(r,g,b)=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
    const ratio=(a,b)=>(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    const parseRGB=s=>{const m=String(s).match(/[\d.]+/g);return m?m.map(Number):[0,0,0,1];};

    const seenText=new Set();
    // while the loading screen shows, only the loader itself is on screen (what is behind it is not visible yet)
    const loaderEl=[...document.querySelectorAll("#loadingScreen,.sd-loader")].find(e=>!e.classList.contains("hidden")&&vis(e));
    const scope=loaderEl||document.body;
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.trim().length>1?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
    let node,checked=0;
    while((node=walker.nextNode())&&checked<600){
      const el=node.parentElement;if(!el||seenText.has(el))continue;seenText.add(el);
      if(/^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(el.tagName))continue;
      if(el.closest("[aria-hidden=true]"))continue;
      if(!vis(el))continue;
      const range=document.createRange();range.selectNodeContents(node);
      const rects=[...range.getClientRects()].filter(r=>r.width>2&&r.height>2&&r.top<H&&r.bottom>0&&r.left<W&&r.right>0);
      if(!rects.length)continue;
      // the visible text must actually be on top at its centre (skip glint/clone layers under other things)
      const r0=rects[0];const top=document.elementFromPoint(Math.min(W-1,Math.max(0,r0.left+r0.width/2)),Math.min(H-1,Math.max(0,r0.top+r0.height/2)));
      if(top&&top!==el&&!el.contains(top)&&!top.contains(el))continue;
      checked++;
      const cs=getComputedStyle(el);
      const fs=parseFloat(cs.fontSize);
      const text=node.nodeValue.replace(/\s+/g," ").trim().slice(0,50);
      const minFs=phone?12:11;
      if(fs<minFs)out.push({t:"tinytext",s:sel(el),d:`${fs}px`,txt:text});
      if(img&&cs.color){
        const [tr,tg,tb,ta=1]=parseRGB(cs.color);
        const fillCol=cs.webkitTextFillColor&&!/rgba?\(0, 0, 0, 0\)/.test(cs.webkitTextFillColor)?parseRGB(cs.webkitTextFillColor):null;
        if(ta<0.1&&!fillCol)continue;// gradient/clip text: skip
        let col=fillCol?fillCol.slice(0,3):[tr,tg,tb];
        // translucent text (alpha colour or faded ancestors) renders blended with what is behind it: composite it over the
        // median colour of the sampled area (mostly background) before comparing
        let alpha=fillCol?(fillCol[3]===undefined?1:fillCol[3]):ta;
        for(let e=el;e&&e.nodeType===1;e=e.parentElement)alpha*=Number(getComputedStyle(e).opacity);
        if(alpha<0.95){
          const px=[];
          for(const r of rects.slice(0,3)){
            const s=img.scale,x0=Math.max(0,Math.floor((r.left-3)*s)),x1=Math.min(img.w-1,Math.ceil((r.right+3)*s)),y0=Math.max(0,Math.floor((r.top-2)*s)),y1=Math.min(img.h-1,Math.ceil((r.bottom+2)*s));
            const step=Math.max(1,Math.floor((x1-x0)*(y1-y0)/2000));let i=0;
            for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if((i++)%step)continue;const p=(y*img.w+x)*4;px.push([img.data[p],img.data[p+1],img.data[p+2]]);}
          }
          if(px.length){const med=k=>px.map(q=>q[k]).sort((m,n)=>m-n)[px.length>>1];const bg=[med(0),med(1),med(2)];col=col.map((c,k)=>Math.round(alpha*c+(1-alpha)*bg[k]));}
        }
        const Lt=lum(col[0],col[1],col[2]);
        // sample a ring just outside the text box plus the box itself, keep pixels far from the text colour = background
        const bgL=[];let sampled=0;
        for(const r of rects.slice(0,3)){
          const s=img.scale,x0=Math.max(0,Math.floor((r.left-3)*s)),x1=Math.min(img.w-1,Math.ceil((r.right+3)*s)),y0=Math.max(0,Math.floor((r.top-2)*s)),y1=Math.min(img.h-1,Math.ceil((r.bottom+2)*s));
          const step=Math.max(1,Math.floor((x1-x0)*(y1-y0)/4000));
          let i=0;
          for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
            if((i++)%step)continue;
            sampled++;
            const p=(y*img.w+x)*4,d=img.data;
            const dr=d[p]-col[0],dg=d[p+1]-col[1],db=d[p+2]-col[2];
            if(dr*dr+dg*dg+db*db<60*60)continue;// text pixel (or near it)
            bgL.push(lum(d[p],d[p+1],d[p+2]));
          }
        }
        // almost every pixel matches the text colour: the background is (nearly) the text colour, so contrast is very low
        if(bgL.length<12&&sampled>=24)out.push({t:"contrast",s:sel(el),d:`background matches text colour (${sampled-bgL.length}/${sampled} pixels), likely under 1.5:1 ${fs}px`,txt:text});
        if(bgL.length>=12){
          const cr=bgL.map(L=>ratio(L,Lt)).sort((a,b)=>a-b);
          const p10=cr[Math.floor(cr.length*0.1)],med=cr[Math.floor(cr.length/2)];
          const large=fs>=24||(fs>=18.66&&Number(cs.fontWeight)>=700);
          const need=large?3:4.5;
          const shadow=cs.textShadow&&cs.textShadow!=="none";
          if(med<need)out.push({t:"contrast",s:sel(el),d:`median ${med.toFixed(2)} p10 ${p10.toFixed(2)} need ${need}${shadow?" (has text-shadow)":""} ${fs}px`,txt:text});
        }
      }
      // clipped
      if(el.scrollWidth>el.clientWidth+2&&/hidden|clip/.test(cs.overflowX)&&cs.textOverflow!=="ellipsis"&&el.clientWidth>0&&el.children.length===0)out.push({t:"clipped",s:sel(el),d:`scrollW ${el.scrollWidth} > ${el.clientWidth}`,txt:text});
    }

    // tap targets, covered, focus reachability
    const INTER="button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=link],[role=switch],[role=checkbox],[tabindex]:not([tabindex='-1'])";
    const minTap=phone?44:24;
    for(const el of scope.querySelectorAll(INTER)){
      if(!vis(el)||el.disabled)continue;
      if(el.closest("[aria-hidden=true],[inert]"))continue;
      const r=el.getBoundingClientRect();
      if(r.width<minTap||r.height<minTap){
        // inline links inside a sentence are exempt from target size (WCAG 2.5.8)
        const inline=el.tagName==="A"&&getComputedStyle(el).display==="inline";
        out.push({t:"smalltap",s:sel(el),d:`${Math.round(r.width)}x${Math.round(r.height)}${inline?" inline":""}`,txt:label(el)});
      }
      const cx=Math.min(W-1,Math.max(0,r.left+r.width/2)),cy=Math.min(H-1,Math.max(0,r.top+r.height/2));
      if(r.top>=0&&r.bottom<=H&&r.left>=0&&r.right<=W){
        const top=document.elementFromPoint(cx,cy);
        if(top&&top!==el&&!el.contains(top)&&!top.contains(el)){
          const tcs=getComputedStyle(top);
          // a full-window fixed layer above it is a modal sheet: reported apart, not as an overlap
          let modal=null;for(let e=top;e&&e!==document.body;e=e.parentElement){const c=getComputedStyle(e);if(c.position==="fixed"){const rr=e.getBoundingClientRect();if(rr.width*rr.height>=W*H*0.6)modal=e;break;}}
          if(tcs.pointerEvents!=="none")out.push({t:modal?"undermodal":"covered",s:sel(el),d:`under ${sel(top)}${modal&&modal!==top?" in "+sel(modal):""}`,txt:label(el)});
        }
      }else if(r.bottom>H+2||r.right>W+2){
        out.push({t:"offscreen",s:sel(el),d:`box ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} vp ${W}x${H}`,txt:label(el)});
      }
    }
    let nf=0;
    for(const el of scope.querySelectorAll("*")){
      if(nf>=15)break;
      if(el.matches(INTER)||el.closest(INTER))continue;
      if(el.tagName==="LABEL"){
        const c=el.control;
        if(c){const ccs=getComputedStyle(c);const reach=ccs.display!=="none"&&ccs.visibility!=="hidden"&&!c.disabled&&c.tabIndex>=0;if(reach)continue;}
      }
      const cs=getComputedStyle(el);
      if(cs.cursor!=="pointer")continue;
      if(el.parentElement&&getComputedStyle(el.parentElement).cursor==="pointer")continue;
      if(!vis(el))continue;
      const r=el.getBoundingClientRect();if(r.width<8||r.height<8)continue;
      nf++;out.push({t:"nofocus",s:sel(el),d:`${Math.round(r.width)}x${Math.round(r.height)} cursor:pointer, not focusable`,txt:label(el)});
    }
    if(reduced){
      const anims=document.getAnimations().filter(a=>{
        if(a.playState!=="running")return false;
        const t=a.effect&&a.effect.getComputedTiming&&a.effect.getComputedTiming();
        return t&&(t.iterations===Infinity||t.activeDuration>1500);
      });
      for(const a of anims.slice(0,10)){
        const tgt=a.effect&&a.effect.target;const t=a.effect.getComputedTiming();
        out.push({t:"motion",s:tgt?sel(tgt):"?",d:`${a.animationName||a.constructor.name} ${t.iterations===Infinity?"infinite":Math.round(t.activeDuration)+"ms"}`});
      }
      if(anims.length>10)out.push({t:"motion",s:"...",d:`${anims.length} running long/infinite animations`});
    }
    // horizontal scroll
    if(document.documentElement.scrollWidth>W+1)out.push({t:"hscroll",s:"html",d:`scrollWidth ${document.documentElement.scrollWidth} > ${W}`});
    return out;
  }
}
