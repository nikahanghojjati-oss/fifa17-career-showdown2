// Dump the elements the face check would consider, per screen and size, in plate fractions (cover, centre top).
const path=require('path');
const G=process.env.G;
process.chdir(G);
const A=require(path.join(G,'tests/browser/phone-marble-facecheck-audit.cjs'));
const {chromium}=require('playwright');
const SIZES=[[393,852],[393,660],[375,667],[360,640]]; const IW=1179,IH=2096;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CMS_CHROMIUM_PATH,args:['--no-sandbox']});
 const out={};
 for(const key of process.argv.slice(2)){ out[key]={};
  for(const [w,h] of SIZES){
   const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const page=await ctx.newPage(); await A.openScreen(page,key);
   const els=await page.evaluate(({w,h})=>{
    const res=[];
    const visible = el => { const cs = getComputedStyle(el); return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05; };
    const drawsSomething = el => { const cs = getComputedStyle(el);
        const bg = cs.backgroundColor && !/rgba\(.*,\s*0\)$|transparent/.test(cs.backgroundColor);
        const bgImg = cs.backgroundImage && cs.backgroundImage !== "none";
        const border = parseFloat(cs.borderTopWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.borderTopColor);
        const text = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        return bg || bgImg || border || text || /^(IMG|SVG|CANVAS|BUTTON|INPUT|VIDEO)$/.test(el.tagName.toUpperCase()); };
    const cls = el => String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || "");
    for(const el of document.querySelectorAll("body *")){
      const r = el.getBoundingClientRect();
      if(r.right<=0||r.bottom<=0||r.left>=w||r.top>=h) continue;
      if(r.width < 2 || r.height < 2 || r.width * r.height > 0.6 * w * h) continue;
      if(!visible(el) || !drawsSomething(el)) continue;
      if(/cutout|manager|portrait|plate|backdrop|stage-art|background/i.test(cls(el))) continue;
      const cx=Math.min(Math.max((r.left+r.right)/2,0),w-1), cy=Math.min(Math.max((r.top+r.bottom)/2,0),h-1);
      const t=document.elementFromPoint(cx,cy); const top=!!(t&&(t===el||el.contains(t)||t.contains(el)));
      const bgi=getComputedStyle(el).backgroundImage; const src=el.tagName==='IMG'?(el.currentSrc||'').split('/').pop():'';
      res.push({tag:el.tagName.toLowerCase(),id:el.id,cls:cls(el).slice(0,50),r:[r.left,r.top,r.right,r.bottom].map(v=>Math.round(v*10)/10),top,src,bg:bgi&&bgi!=='none'?bgi.slice(0,80):''});
    }
    return res;},{w,h});
   out[key][w+'x'+h]=els; await ctx.close();
  }}
 await browser.close();
 require('fs').writeFileSync(process.env.OUT,JSON.stringify(out,null,1));
})();
