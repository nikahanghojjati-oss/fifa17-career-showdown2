"use strict";
process.env.CMS_CHROMIUM_MULTI_CONTEXT="1";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const {prepare}=require("./shared-canonical-scoring-audit.cjs");
const {openScreen}=require("./r80-short-screens-audit.cjs");
// Range ink, clipping ancestors and hit tests: DOM text alone missed both gallery defects.
async function visibleInk(page,selector){
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page.locator(selector).evaluate(el=>{
    const issues=[],range=document.createRange();range.selectNodeContents(el);
    const r=range.getBoundingClientRect(),cs=getComputedStyle(el);
    if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})||r.width<2||r.height<2)issues.push("no visible ink");
    if(cs.color==="rgba(0, 0, 0, 0)"||cs.color===cs.backgroundColor)issues.push("invisible color");
    for(let n=el;n;n=n.parentElement){const s=getComputedStyle(n),b=n.getBoundingClientRect();
      if(/hidden|clip|auto|scroll/.test(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))issues.push(`vertical clip: ${n.id||n.className}`);
      if(/hidden|clip|auto|scroll/.test(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))issues.push(`horizontal clip: ${n.id||n.className}`);
    }
    if(r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth)issues.push("off viewport");
    const old=el.style.pointerEvents;el.style.pointerEvents="auto";
    const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);el.style.pointerEvents=old;
    if(!hit||!(el.contains(hit)||hit.contains(el)))issues.push(`covered by ${hit?.className}`);
    return issues;
  });
}
(async()=>{
  const browser=await chromium.launch({headless:true,...await resolveChromiumRuntime()}),failures=[];
  const dir=process.env.CMS_GALLERY_SHOTS;if(dir)fs.mkdirSync(dir,{recursive:true});
  try{for(const [width,height] of [[1920,1080],[1366,768],[393,852]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<900});
    await context.route("**/*",r=>new URL(r.request().url()).origin===new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/").origin?r.continue():r.abort());
    const page=await context.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
    for(const screen of ["season-results","trophy-room"]){
      if(screen==="season-results"){
        await prepare(page,{role:"playerOne",saveId:"gallery-layout",draw:true});
        // Read-only post-commit layout fixture: exact progression renderer markup/copy,
        // including the second exit and its status (the original scoring audit omitted these).
        await page.evaluate(()=>{
          const actions=document.querySelector("#seasonReviewPanel .seasonReviewActions");
          const status=document.createElement("p");status.id="sharedMultiSeasonProgressionStatus";
          status.className="seasonReviewWarning sharedMultiSeasonProgressionStatus";
          status.textContent="SEASON 1 SAVED · CONTINUE TO SEASON 2";
          const button=document.createElement("button");button.id="sharedMultiSeasonProgressionAction";
          button.className="menuButton";button.textContent="CONTINUE TO SEASON 2";
          actions.prepend(status,button);
        });
      }
      else await openScreen(page,"TROPHY_ROOM");
      await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2600);
      const selectors=screen==="season-results"?["#sharedCanonicalScoringHeading","#sharedCanonicalScoringTotals","#sharedCanonicalScoringWinner"]:["#trophyRoomBack"];
      for(const selector of selectors){
        const issues=await visibleInk(page,selector);if(issues.length)failures.push(`${screen} ${width}x${height} ${selector}: ${issues.join(", ")}`);
      }
      if(screen==="trophy-room"&&width<900){
        const colors=await page.evaluate(()=>[".trophyBack",".trophyPhoneMoreButton"].map(s=>getComputedStyle(document.querySelector(s)).color));
        if(colors[0]!==colors[1])failures.push(`BACK must share MORE's gold label: ${colors}`);
        assert.equal((await page.locator("#trophyRoomBack").textContent()).trim(),"BACK");
      }
      if(screen==="season-results"){
        assert.match(await page.locator("#sharedCanonicalScoringTotals").textContent(),/Daniel.*Nik/);
        assert.match(await page.locator("#sharedCanonicalScoringWinner").textContent(),/Season (result|winner):/);
        for(const selector of ["#sharedMultiSeasonProgressionAction","#sharedSeasonCommitAction"]){
          assert.deepEqual(await visibleInk(page,selector),[],`${selector} is visible and unobstructed`);
          if(await page.locator(selector).isEnabled())await page.locator(selector).click({trial:true});
        }
      }
      const scrollers=await page.evaluate(()=>[...document.querySelectorAll("#app main *")].filter(n=>n.checkVisibility()&&n.scrollHeight>n.clientHeight+2&&/auto|scroll/.test(getComputedStyle(n).overflowY)).map(n=>n.id||n.className));
      assert.deepEqual(scrollers,[],"main is the only vertical scroller");
      await page.evaluate(()=>document.querySelector("#app main").scrollTop=0);
      if(screen==="season-results"&&width>=1366){
        const bottom=await page.locator("#sharedMultiSeasonProgressionAction").evaluate(n=>n.getBoundingClientRect().bottom);
        assert.ok(bottom<=height,"desktop CONTINUE remains fully on the first view");
      }
      if(screen==="season-results"&&width<900)await page.locator("#sharedCanonicalScoringWinner").scrollIntoViewIfNeeded();
      await page.mouse.move(0,0);await page.waitForTimeout(150);
      assert.deepEqual(errors,[],"no browser errors");
      if(dir)await page.screenshot({path:path.join(dir,`${screen}-${width}x${height}.png`)});
      console.log(`Measured ${screen} ${width}x${height}`);
    }
    await context.close();
  }}finally{await browser.close();}
  assert.deepEqual(failures,[]);console.log("r83 gallery layout audit passed");
})().catch(e=>{console.error(e);process.exitCode=1;});
