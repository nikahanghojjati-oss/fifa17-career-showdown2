const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [name,w,h,q] of [['desktop',1920,1080,''],['phone',1179,2096,'?phone']]){
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
await p.goto(`http://localhost:8765/project-documents/factory/r78/HO-030/_bake.html${q}`);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
const r=await p.evaluate(()=>{const o={};for(const s of ['.startupIdentity','.startupRoundel','.startupKicker','.startupIdentity h1','.startupEdition']){const e=document.querySelector(s).getBoundingClientRect();o[s]=[e.left,e.top,e.right,e.bottom].map(Math.round)}return o});
console.log(name,JSON.stringify(r));
await p.screenshot({path:`${process.argv[2]}/identity_${name}.png`,omitBackground:true});await p.close();}
await b.close();})();
