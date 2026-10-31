"use strict";
// JOB-1810: open the visible MORE control, then compare player-visible career details
// against the real desktop renderer and the verified completed-Showdown model.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
process.env.CMS_CHROMIUM_MULTI_CONTEXT??="1";
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
const {projection,result,finalFor}=require("../support/career-fixture-helpers.cjs");
const Career=require("../../js/sharedCareerAnalytics.js");
const V10=require("../../js/careerScreensV10.js");
const baseUrl=process.env.CMS_BASE_URL||"http://127.0.0.1:4511/";
const output=path.resolve(process.env.CMS_TEST_RESULTS||"test-results/phone-trophy-room-data");
const label=process.env.CMS_AUDIT_RUN||"after";
fs.mkdirSync(output,{recursive:true});
const p=projection({totalSeasons:3,seasons:[
  [result({leaguePosition:1,leaguePoints:101,leagueGoals:102,championsLeague:true,domesticCup:true,topScorer:true}),result()],
  [result(),result({leaguePosition:1,leaguePoints:94,leagueGoals:105,championsLeague:true})],
  [result({leaguePosition:1,leaguePoints:98,domesticCup:true}),result({leaguePosition:2,leaguePoints:86})]
]});
const model=Career.buildCareerModel({indexStatus:"ready",showdowns:[{rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)}]});
const frame=V10.toV10Frame(model,"trophyRoom");
const canonicalKeys=["careerModeShowdown.saveLibrary","careerModeShowdown.legacyShowdowns","careerModeShowdown.preferences"];
async function facts(page){
  return page.evaluate(()=>{
    const text=el=>el?.textContent.trim()||"";
    const visible=el=>{
      if(!el||!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))return false;
      const r=el.getBoundingClientRect();
      return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight;
    };
    const ranks=[...document.querySelectorAll("#trophyRoom .careerRank")].map(el=>({manager:el.dataset.rankManager,rank:text(el.querySelector("strong")),name:text(el.querySelector("span")),points:Number(text(el.querySelector("b"))),detail:text(el.querySelector("small")),visible:visible(el)}));
    const records=[...document.querySelectorAll("#trophyRoom .recordItem")].map(el=>({label:text(el.querySelector("small")),value:Number(text(el.querySelector("strong"))),manager:text(el.querySelector("span")),visible:visible(el)}));
    return {ranks,records,heading:text(document.querySelector("#trophyRoom .recordRibbonHeading")),sheetTitle:text(document.getElementById("trophyPhoneSheetTitle")),sheetVisible:visible(document.getElementById("trophyPhoneSheet"))};
  });
}
const figures=f=>({ranks:f.ranks.map(({visible,...row})=>row),records:f.records.map(({visible,...row})=>row),heading:f.heading});
(async()=>{
  const browser=await chromium.launch({headless:true,...await resolveChromiumRuntime()});
  const errors=[],failures=[];let desktop;
  try{
    for(const viewport of [{width:1920,height:1080},{width:393,height:660},{width:393,height:852}]){
      const size=`${viewport.width}x${viewport.height}`,phone=viewport.width<900;
      const context=await browser.newContext({viewport,isMobile:phone,hasTouch:phone});
      const page=await context.newPage();page.on("pageerror",e=>errors.push(`${size}: ${e.message}`));
      try{
        // Keep this browser proof local: the real screen/renderer receives an already verified
        // model, as supported by the career seam; no Firebase service or production account runs.
        await page.route("**/*",route=>new URL(route.request().url()).origin===new URL(baseUrl).origin?route.continue():route.abort());
        await page.goto(baseUrl);
        await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:30000});
        await page.evaluate(async model=>{
          await ensureGameplayModules();
          await loadRuntimeScript("career-screen-seam","js/careerScreenSeam.js",()=>Boolean(window.CareerModeCareerScreenSeam));
          await window.openOptionalModule("trophyRoom");
          window.openTrophyRoom({model});
        },model);
        await page.waitForFunction(()=>document.querySelector("#trophyRoom .careerRank")&&document.getElementById("trophyRoom")?.dataset.careerV10==="1"&&!document.getElementById("trophyRoom").hasAttribute("data-v10-pending"));
        await page.waitForFunction(()=>!document.querySelector("#trophyRoom[data-v10-reveal]")&&[...document.querySelectorAll("#trophyRoom img")].every(i=>i.complete));
        await page.waitForTimeout(1500); // Wait for the existing Team V entrance motion.
        const storage=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),canonicalKeys);
        if(phone){
          await page.screenshot({path:path.join(output,`${label}-${size}-closed.png`)});
          try{await page.locator("#trophyRoom label.trophyPhoneMoreButton").click({timeout:3000});}
          catch(error){throw new Error(`${size}: visible MORE label cannot open CAREER DETAILS (${error.message})`);}
          await page.locator("#trophyPhoneMoreToggle").isChecked().then(checked=>assert.equal(checked,true,"MORE must open the career details"));
        }
        const actual=await facts(page);
        console.log(`${size}: ${JSON.stringify(actual)}`);
        if(!phone){
          desktop=figures(actual);
          assert.equal(actual.ranks.length,2);assert.equal(actual.records.length,frame.records.length);
          for(const row of frame.standings){const rank=actual.ranks.find(r=>r.manager===row.manager);assert.equal(rank.rank,row.rank);assert.equal(rank.points,row.careerPoints);assert.equal(rank.detail,`CAREER POINTS · ${row.seasonWins} SEASON ${row.seasonWins===1?"WIN":"WINS"}`);}
          assert.deepEqual(actual.records.map(r=>[r.label,r.value,r.manager]),frame.records.map(r=>[r.label,r.value,r.manager==="shared"?"Shared":frame.managers[r.manager].displayName]));
        }else{
          assert.equal(actual.sheetTitle,"CAREER DETAILS");assert.equal(actual.sheetVisible,true);
          assert.deepEqual(figures(actual),desktop,`${size}: CAREER DETAILS must show desktop ranks and all-time records`);
        }
        for(const row of [...actual.ranks,...actual.records])assert.equal(row.visible,true,`${size}: ${row.manager||row.label} must be visible to the player`);
        await page.screenshot({path:path.join(output,`${label}-${size}-details.png`)});
        if(phone){
          await page.locator("#trophyRoom label.trophyPhoneMoreButton").click();
          assert.equal(await page.locator("#trophyPhoneMoreToggle").isChecked(),false,"CLOSE must dismiss details");
          await page.locator("#trophyRoom label.trophyPhoneMoreButton").click();
          assert.deepEqual(figures(await facts(page)),desktop,"reopening MORE must retain all figures");
        }
        assert.deepEqual(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),canonicalKeys),storage,"reading Trophy Room must leave canonical storage unchanged");
        console.log(`PASS ${size}: ${actual.ranks.length} manager ranks and ${actual.records.length} all-time records match the completed three-season career`);
      }catch(error){failures.push(error.message);console.error(`FAIL ${error.message}`);}
      finally{await context.close();}
    }
    assert.deepEqual(errors,[],"Trophy Room must emit no page errors");
    assert.deepEqual(failures,[],"phone Trophy Room data audit failures");
    console.log("PASS Phone Trophy Room data audit: desktop 1920x1080 and phone 393x660/393x852 show identical completed-career figures; visible MORE/CLOSE works and canonical storage is unchanged.");
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
