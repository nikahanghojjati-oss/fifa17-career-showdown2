"use strict";
// r87 Commentary v3 layout audit: the TV bar sits inside Season Results' SEASON SCORE box, in flow, at every size.
// It must be fully visible (not clipped, not covered), must not cover any face, button or field, and every control on the
// screen must stay reachable. Season 1 is the real canonical-scoring fixture; season 2 (decider maths) and season 3
// (the Showdown verdict) replay that fixture with richer read-only states. Shots go to CMS_GALLERY_SHOTS when set.
process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const {prepare}=require("./shared-canonical-scoring-audit.cjs");
const base=process.env.CMS_BASE_URL||"http://127.0.0.1:4173/";
const SIZES=[[1920,1080],[1366,768],[1280,650],[844,390],[393,852],[375,667],[360,640]];
const r=(pos,pts,goals,extra={})=>({leaguePosition:pos,leaguePoints:pts,leagueGoals:goals,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...extra});
function sc(x){const hp=x.leaguePoints>=100,hg=x.leagueGoals>=100,b={championsLeague:x.championsLeague?5:0,...(x.europaLeague?{europaLeague:3}:{}),leagueTitle:x.leaguePosition===1?3:0,domesticCup:x.domesticCup?1:0,performanceBonus:hp||hg?1:0,individualAwardsBonus:x.topScorer||x.topAssist?1:0,triggers:{hundredLeaguePoints:hp,hundredLeagueGoals:hg,topScorer:x.topScorer,topAssist:x.topAssist}};b.total=b.championsLeague+(b.europaLeague||0)+b.leagueTitle+b.domesticCup+b.performanceBonus+b.individualAwardsBonus;return b;}
function row(n,a,b){const A={...a,scoring:sc(a)},B={...b,scoring:sc(b)};return {roundNumber:n,playerOne:A,playerTwo:B,winner:A.scoring.total>B.scoring.total?"playerOne":B.scoring.total>A.scoring.total?"playerTwo":"draw"};}
const HISTORY=[row(1,r(2,80,70,{domesticCup:true}),r(4,65,70,{domesticCup:true})),row(2,r(1,91,88,{topScorer:true}),r(3,74,69,{championsLeague:true})),row(3,r(5,62,58),r(1,95,101,{domesticCup:true,topAssist:true}))];
async function season(page,s){
  if(s===1)return;
  await page.evaluate(({s,history})=>{
    const rows=history.slice(0,s),own=rows[s-1],rid=CareerModeProductionSharedShowdownSetup.getState().rivalryId;
    const wrap=(name,patch)=>{const api=window[name],state=api.getState();window[name]={...api,getState:()=>({...state,...patch})};};
    wrap("CareerModeProductionSharedCanonicalScoring",{seasonNumber:s,scoring:{playerOne:own.playerOne.scoring,playerTwo:own.playerTwo.scoring},winner:own.winner});
    wrap("CareerModeProductionSharedSeasonCommit",{seasonNumber:s,results:{playerOne:own.playerOne,playerTwo:own.playerTwo}});
    window.CareerModeProductionSharedHistoryConvergence={getState:()=>({authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:rid,projection:{seasonHistory:rows.slice(0,s-1)}})};
    document.getElementById("sharedCanonicalScoringTotals").textContent=`Daniel: ${own.playerOne.scoring.total} · Nik: ${own.playerTwo.scoring.total}`;
    document.getElementById("sharedCanonicalScoringWinner").textContent=own.winner==="draw"?"Season result: Draw":`Season winner: ${own.winner==="playerOne"?"Daniel":"Nik"}`;
    CareerModeCommentaryV3._render();
  },{s,history:HISTORY});
}
async function inspect(page){
  return page.evaluate(()=>{
    const bar=document.getElementById("commentaryV3Bar"),issues=[];if(!bar)return {issues:["no bar"]};
    const box=bar.getBoundingClientRect(),panel=document.getElementById("sharedCanonicalScoringPanel").getBoundingClientRect();
    if(!bar.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))issues.push("bar not painted");
    for(let n=bar;n;n=n.parentElement){if(Number(getComputedStyle(n).opacity)<1){issues.push(`faded by ${n.id||n.className}`);break;}}
    if(box.width<200||box.height<30)issues.push(`bar too small ${box.width}x${box.height}`);
    if(box.left<panel.left-1||box.right>panel.right+1||box.top<panel.top-1||box.bottom>panel.bottom+1)issues.push("bar outside the SEASON SCORE box");
    if(box.right>innerWidth||box.left<0)issues.push("bar off screen sideways");
    // Nothing the player uses may sit under or over the bar.
    for(const el of document.querySelectorAll("#seasonEntry button, #seasonEntry input, #seasonEntry select, #seasonEntry a, #seasonEntry label, #seasonEntry img, #seasonEntry h2, #seasonEntry h3")){
      if(!el.checkVisibility?.()||bar.contains(el))continue;const b=el.getBoundingClientRect();if(b.width<2||b.height<2)continue;
      const overlap=Math.max(0,Math.min(b.right,box.right)-Math.max(b.left,box.left))*Math.max(0,Math.min(b.bottom,box.bottom)-Math.max(b.top,box.top));
      if(overlap>4&&!el.contains(bar))issues.push(`overlaps ${el.tagName}#${el.id||el.className}`);
    }
    // The bar is in flow (not absolute/fixed) and never catches taps.
    const cs=getComputedStyle(bar);if(cs.position==="absolute"||cs.position==="fixed")issues.push("bar is not in flow");if(cs.pointerEvents!=="none")issues.push("bar catches taps");
    const lead=bar.querySelector(".cmv3-lead"),num=bar.querySelector(".cmv3-numbers");
    for(const el of [lead,num].filter(Boolean)){const t=el.getBoundingClientRect();if(t.right>box.right+1||t.bottom>box.bottom+1)issues.push(`${el.className} clipped`);}
    return {issues,text:bar.textContent.replace(/\s+/g," ").trim(),height:Math.round(box.height)};
  });
}
(async()=>{
  const browser=await chromium.launch({headless:true,...await resolveChromiumRuntime()}),failures=[];
  const dir=process.env.CMS_GALLERY_SHOTS;if(dir)fs.mkdirSync(dir,{recursive:true});
  try{
    for(const [width,height] of SIZES){
      for(const s of [1,2,3]){
        const context=await browser.newContext({viewport:{width,height},isMobile:width<900,hasTouch:width<900,reducedMotion:"reduce"});
        await context.route("**/*",x=>new URL(x.request().url()).origin===new URL(base).origin?x.continue():x.abort());
        const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
        await prepare(page,{role:"playerOne",saveId:"commentary-v3",draw:true});
        await page.waitForFunction(()=>Boolean(window.CareerModeCommentaryV3),null,{timeout:10000});
        await page.waitForSelector("#commentaryV3Bar",{timeout:15000});
        // The post-commit exit exactly as the progression renderer draws it (as in the r83 gallery audit).
        if(s<3)await page.evaluate(s=>{const actions=document.querySelector("#seasonReviewPanel .seasonReviewActions");const status=document.createElement("p");status.id="sharedMultiSeasonProgressionStatus";status.className="seasonReviewWarning sharedMultiSeasonProgressionStatus";status.textContent=`SEASON ${s} SAVED · CONTINUE TO SEASON ${s+1}`;const button=document.createElement("button");button.id="sharedMultiSeasonProgressionAction";button.className="menuButton";button.textContent=`CONTINUE TO SEASON ${s+1}`;actions.prepend(status,button);},s);
        await season(page,s);
        await page.waitForFunction(n=>document.getElementById("commentaryV3Bar")?.dataset.key?.split("|")[1]===String(n),s,{timeout:5000});
        await page.waitForFunction(()=>{const h=document.getElementById("seasonEntry");return h&&!h.hasAttribute("data-v10-pending")&&!h.hasAttribute("data-v10-reveal");},null,{timeout:15000});
        await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2600);
        await page.locator("#commentaryV3Bar").scrollIntoViewIfNeeded();
        const result=await inspect(page);
        if(result.issues.length)failures.push(`${width}x${height} season ${s}: ${result.issues.join("; ")}`);
        if(errors.length)failures.push(`${width}x${height} season ${s}: page errors ${errors.join(" | ")}`);
        // Every action button on the screen is still on top at its centre.
        if(s<3&&width>=1366){await page.evaluate(()=>document.querySelector("#app main").scrollTop=0);const bottom=await page.locator("#sharedMultiSeasonProgressionAction").evaluate(n=>n.getBoundingClientRect().bottom);if(bottom>height)failures.push(`${width}x${height} season ${s}: CONTINUE pushed off the first view (${Math.round(bottom)})`);}
        for(const sel of ["#sharedSeasonCommitAction",...(s<3?["#sharedMultiSeasonProgressionAction"]:[])]){const hit=await page.locator(sel).evaluate(b=>{b.scrollIntoView({block:"center"});const r=b.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return Boolean(h&&(b===h||b.contains(h)));});if(!hit)failures.push(`${width}x${height} season ${s}: ${sel} covered`);}
        // Desktop shots show the first view (CONTINUE included); phone shots centre the bar.
        if(width>=1366)await page.evaluate(()=>document.querySelector("#app main").scrollTop=0);
        else await page.locator("#commentaryV3Bar").evaluate(b=>b.scrollIntoView({block:"center"}));
        await page.mouse.move(0,0);
        if(dir)await page.screenshot({path:path.join(dir,`season-results-s${s}-${width}x${height}.png`)});
        console.log(`${width}x${height} S${s} h=${result.height}: ${result.text}`);
        await context.close();
      }
    }
  }finally{await browser.close();}
  if(failures.length){console.error(failures.join("\n"));process.exit(1);}
  console.log("r87 Commentary v3 layout audit passed");
})().catch(e=>{console.error(e);process.exit(1);});
