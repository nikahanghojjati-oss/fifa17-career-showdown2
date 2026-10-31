"use strict";
// r87 proof lane (W3-8): the screens a CE2PG Showdown run does not open (Rule Book, Music, Settings and the career pages from
// Home while signed out), shot at the tablet and sideways sizes with the same layout checks as tools/proof-sizes-hook.cjs.
// Every request that is not to this machine is aborted, so nothing reaches production Firebase.
//   node tests/browser/r87-proof-sizes-tour.cjs            (PROOF_OUT=test-results/proof-sizes/tour by default)
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const {probe}=require("../../tools/proof-sizes-hook.cjs");
process.env.CMS_CHROMIUM_MULTI_CONTEXT ??= "1";// a new browser context per stop

const ROOT=path.resolve(__dirname,"../..");
const PORT=Number(process.env.PROOF_TOUR_PORT||4631);
const BASE=`http://127.0.0.1:${PORT}/`;
const OUT=path.resolve(process.env.PROOF_OUT||path.join(ROOT,"test-results/proof-sizes/tour"));
const SIZES=(process.env.PROOF_TOUR_SIZES||"768x1024,820x1180,844x390,740x360,1920x1080").split(",").map(s=>{const [width,height]=s.split("x").map(Number);return {width,height};});
// Home tile or tab -> what to tap. Each stop starts again from Home.
// Wait until no finite animation runs and every visible picture has loaded (as tools/proof-sizes-hook.cjs does).
async function settle(page){
  await page.waitForTimeout(300);
  await page.waitForFunction(()=>{
    const busy=document.getAnimations().some(an=>{const t=an.effect&&an.effect.getComputedTiming?an.effect.getComputedTiming():null;return an.playState==="running"&&t&&Number.isFinite(t.endTime);});
    return !busy&&![...document.images].some(i=>i.getBoundingClientRect().width>0&&!i.complete);
  },null,{timeout:6000,polling:150}).catch(()=>{});
  await page.waitForTimeout(200);
}
const STOPS=[
  {name:"home",tap:null},
  {name:"rulebook",tap:["#ruleBookButton",".sd-nav-tab:has-text('RULES')"]},
  {name:"music",tap:["#cmsMusicTab"]},
  {name:"settings",tap:["#settingsButton",".sd-nav-gear"]},
  {name:"statistics",tap:["#careerStatisticsButton"]},
  {name:"legacy",tap:["#legacyButton"]},
  {name:"trophyroom",tap:["#homeTrophyRoomButton"]}
];

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const findingsFile=path.join(OUT,"findings.jsonl");fs.writeFileSync(findingsFile,"");
  const server=spawn(process.execPath,[path.join(ROOT,"tests/support/static-server.cjs")],{stdio:"ignore",env:{...process.env,CMS_TEST_PORT:String(PORT)}});
  await new Promise(r=>setTimeout(r,800));
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  let n=0;const missing=[];
  try{
    for(const size of SIZES){
      const tag=`${size.width}x${size.height}`;
      for(const stop of STOPS){
        const context=await browser.newContext({viewport:size});
        await context.route(url=>!/^http:\/\/127\.0\.0\.1:/.test(url.href),route=>route.abort());
        const page=await context.newPage();
        await page.goto(BASE,{waitUntil:"domcontentloaded"});
        await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000}).catch(()=>{});
        await settle(page);
        if(stop.tap){
          let tapped=false;
          for(const sel of stop.tap){const el=page.locator(sel).first();if(await el.isVisible().catch(()=>false)){await el.click({timeout:4000}).catch(()=>{});tapped=true;break;}}
          if(!tapped){missing.push(`${tag} ${stop.name}`);await context.close();continue;}
          await settle(page);
        }
        const a=await page.evaluate(probe);
        const slug=`${String(++n).padStart(3,"0")}-tour-${tag}-${stop.name}`;
        const shots=[`${slug}.png`];
        await page.screenshot({path:path.join(OUT,shots[0])});
        const issues=[...a.issues];
        if(a.mainScrolls){
          await page.evaluate(()=>{const m=document.querySelector("main");m.scrollTop=m.scrollHeight;});
          await page.waitForTimeout(200);
          const b=await page.evaluate(probe);
          for(const i of b.issues)if(!issues.some(x=>x.kind===i.kind&&x.what===i.what&&x.text===i.text))issues.push({...i,at:"bottom"});
          shots.push(`${slug}-bottom.png`);await page.screenshot({path:path.join(OUT,shots[1])});
        }
        fs.appendFileSync(findingsFile,JSON.stringify({n,who:`tour:${stop.name}`,size:tag,screens:a.screens,overlays:a.overlays,loading:a.loading,head:a.head,mainScrolls:a.mainScrolls,shots,issues})+"\n");
        await context.close();
      }
    }
  }finally{await browser.close();server.kill();}
  console.log(`tour: ${n} shots in ${OUT}${missing.length?`; not reachable signed out: ${missing.join(", ")}`:""}`);
})().catch(e=>{console.error(e);process.exit(1);});
