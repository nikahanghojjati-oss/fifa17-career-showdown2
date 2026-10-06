const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const{chromium}=require("playwright");
const{resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");
const runLabel=process.env.CMS_AUDIT_RUN||"identity-safe-career-analytics";
const resultsDirectory=path.resolve(process.env.CMS_TEST_RESULTS||"test-results");
const productionOrigin="https://nikahanghojjati-oss.github.io";
const productionPathPrefix="/fifa17-career-showdown2/";

function isExpectedProductionAppCheckConsoleNoise(message){
  if(baseUrl.origin!==productionOrigin||!baseUrl.pathname.startsWith(productionPathPrefix))return false;
  const text=message.text();
  if(text.startsWith("Framing 'https://www.google.com/' violates the following report-only Content Security Policy directive: \"frame-ancestors 'self'\"."))return true;
  if(text==="requestStorageAccess: Permission denied."){
    const sourceUrl=message.location()?.url||"";
    return !sourceUrl||!sourceUrl.startsWith(baseUrl.origin);
  }
  return false;
}
const libraryKey="careerModeShowdown.saveLibrary";
const singletonKey="careerModeShowdown.activeShowdown";
const legacyKey="careerModeShowdown.legacyShowdowns";
const preferencesKey="careerModeShowdown.preferences";
fs.mkdirSync(resultsDirectory,{recursive:true});

const ids={
  activeSave:"save_aaaaaaaaaaaaaaaaaaaaaaaa",
  historyA:"save_bbbbbbbbbbbbbbbbbbbbbbbb",
  historyB:"save_cccccccccccccccccccccccc",
  historyUnresolved:"save_dddddddddddddddddddddddd",
  profileA:"profile_111111111111111111111111",
  profileB:"profile_222222222222222222222222",
  profileC:"profile_333333333333333333333333",
  profileD:"profile_444444444444444444444444"
};

function seasonPlayer(score,{league=false,cup=false,ucl=false,points=80,goals=80}={}){
  return {
    leaguePosition:league?1:2,
    leaguePoints:points,
    leagueGoals:goals,
    domesticCup:cup,
    championsLeague:ucl,
    topScorer:false,
    topAssist:false,
    scoring:{total:score,performanceBonus:0,individualAwardsBonus:0}
  };
}

function showdown(id,name,saveId,playerOne,playerTwo,status="Created",oneScore=0,twoScore=0){
  const completed=status==="Completed";
  return {
    schemaVersion:2,
    integrityWarnings:[],
    id,
    name,
    managers:{playerOne:"Same Name",playerTwo:"Same Name"},
    identity:{schemaVersion:1,saveId,managerProfileIds:{playerOne,playerTwo}},
    totalRounds:3,
    currentRound:completed?2:1,
    status,
    selectedLeague:{id:"premier-league",name:"Premier League"},
    clubs:{playerOne:`${name} A`,playerTwo:`${name} B`},
    score:{playerOne:oneScore,playerTwo:twoScore},
    transferChallenges:[],
    rounds:completed?[{
      roundNumber:1,
      seasonId:`season_${saveId.slice(5,29)}`,
      winner:oneScore>twoScore?"playerOne":twoScore>oneScore?"playerTwo":"draw",
      playerOne:seasonPlayer(oneScore,{league:oneScore===11,cup:oneScore>=3,points:oneScore===11?100:88,goals:oneScore===11?101:90}),
      playerTwo:seasonPlayer(twoScore,{ucl:twoScore>=5,points:84,goals:82})
    }]:[],
    createdAt:"2026-08-14T00:00:00.000Z",
    updatedAt:"2026-08-14T01:00:00.000Z",
    completedAt:completed?"2026-08-14T01:00:00.000Z":null,
    archivedAt:completed?"2026-08-14T01:05:00.000Z":null
  };
}

function seededState(){
  const profiles=[
    {schemaVersion:1,profileId:ids.profileA,displayName:"Canonical Manager",source:{kind:"browser-fixture",saveId:ids.activeSave,role:"playerOne"}},
    {schemaVersion:1,profileId:ids.profileB,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.activeSave,role:"playerTwo"}},
    {schemaVersion:1,profileId:ids.profileC,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.historyB,role:"playerTwo"}},
    {schemaVersion:1,profileId:ids.profileD,displayName:"Same Name",source:{kind:"browser-fixture",saveId:ids.historyUnresolved,role:"playerTwo"}}
  ];
  const active=showdown("analytics-active","Analytics Active",ids.activeSave,ids.profileA,ids.profileB,"Created");
  const first=showdown("analytics-history-a","Analytics History A",ids.historyA,ids.profileA,ids.profileB,"Completed",3,1);
  const second=showdown("analytics-history-b","Analytics History B",ids.historyB,ids.profileA,ids.profileC,"Completed",5,2);
  const unresolved=showdown("analytics-history-unresolved","Analytics Unresolved",ids.historyUnresolved,null,ids.profileD,"Completed",11,0);
  return {
    library:{schemaVersion:1,activeSaveId:ids.activeSave,profiles,saves:[{saveId:ids.activeSave,showdown:active}],migration:{source:"browser-fixture",exactLegacyDuplicatesRemoved:0,legacyIdentityMappingRequired:1}},
    legacy:[first,second,unresolved],
    preferences:{schemaVersion:2,reducedMotion:false,menuFeedback:true}
  };
}

function collectErrors(page){
  const errors=[];
  page.on("pageerror",error=>errors.push(`page: ${error.message}`));
  page.on("console",message=>{if(message.type()==="error"&&!/^Failed to load resource/.test(message.text())&&!isExpectedProductionAppCheckConsoleNoise(message))errors.push(`console: ${message.text()}`);});
  return errors;
}

async function waitForHome(page){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:15000});
  await page.locator("#careerStatisticsButton").evaluate(button=>button.dataset.testSurface="internal-audit");
  await page.locator("#careerStatisticsButton").waitFor({state:"visible",timeout:15000});
}

// r61: Career Statistics and Trophy Room are always Team V's screens (js/careerScreenSeam.js); the app's old local
// analytics pages no longer ship. Identity safety is checked on the analytics model both screens are built from.
async function openTeamVScreen(page,screen){
  await page.waitForFunction(screen=>document.documentElement.dataset.v10Screen===screen,screen,{timeout:15000});
  assert.equal(await page.locator(`#${screen}Content .analyticsIdentityNotice, #${screen}Content .careerStandingsRow, #${screen}Content .managerCabinet`).count(),0,`${screen} must not paint the old local analytics page.`);
}

// What a player actually sees: Team V's screens draw only the provider-backed career model, so with local history alone
// they show their honest unavailable state, never a local, borrowed or merged manager name and never a made-up total.
const LOCAL_NAMES=["Canonical Manager","Same Name","Analytics Active","Analytics History","Analytics Unresolved"];
async function assertTeamVIdentitySafe(page,screen,stage){
  await page.waitForFunction(screen=>/unavailable/i.test(document.getElementById(screen)?.innerText||""),screen,{timeout:10000});
  const text=await page.locator(`#${screen}`).innerText();
  for(const name of LOCAL_NAMES)assert.ok(!text.toLowerCase().includes(name.toLowerCase()),`${screen} (${stage}) must not show the local name "${name}".`);
  assert.match(text,/unavailable/i,`${screen} (${stage}) must show Team V's unavailable state.`);
  if(screen==="careerStatistics"){
    for(const label of ["COMPLETED SHOWDOWNS","SEASONS PLAYED","CAREER POINTS","TROPHIES WON"])assert.match(text,new RegExp(`${label}\\s*\\n\\s*—`),`${screen} (${stage}) must show no ${label} total.`);
  }
  assert.ok(!/\b(19|11)\b/.test(text.replace(/SHOWDOWN 17/g,"")),`${screen} (${stage}) must not show local totals or records.`);
}

async function openCareerStatistics(page){
  await page.locator("#careerStatisticsButton").evaluate(button=>button.click());
  await page.locator("#careerStatistics").waitFor({state:"visible",timeout:15000});
  await openTeamVScreen(page,"careerStatistics");
}

async function readAnalytics(page){
  return page.evaluate(()=>{
    const analytics=window.buildCareerAnalytics();
    return {
      managers:analytics.managers.map(manager=>({profileId:manager.profileId,name:manager.name,showdowns:manager.showdowns,totalPoints:manager.totalPoints,totalTrophies:manager.totalTrophies})),
      identity:analytics.identity,
      totals:analytics.totals,
      highestSeasonScore:analytics.records.highestSeasonScore
    };
  });
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch(runtime);
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const seeded=seededState();
  await context.addInitScript(({libraryKey,singletonKey,legacyKey,preferencesKey,seeded})=>{
    try{
      localStorage.setItem(libraryKey,JSON.stringify(seeded.library));
      localStorage.removeItem(singletonKey);
      localStorage.setItem(legacyKey,JSON.stringify(seeded.legacy));
      localStorage.setItem(preferencesKey,JSON.stringify(seeded.preferences));
    }catch(error){}
  },{libraryKey,singletonKey,legacyKey,preferencesKey,seeded});
  const page=await context.newPage();
  const errors=collectErrors(page);

  try{
    await waitForHome(page);
    await openCareerStatistics(page);

    let analytics=await readAnalytics(page);
    assert.equal(analytics.totals.showdowns,3,"Overall Career Analytics must retain all completed historical Showdowns.");
    assert.equal(analytics.managers.length,4,"Four stable Local Profiles must remain four longitudinal identities despite the same visible name.");
    assert.equal(new Set(analytics.managers.map(manager=>manager.profileId)).size,4,"Browser Career Analytics collapsed distinct profile IDs.");
    const reused=analytics.managers.find(manager=>manager.profileId===ids.profileA);
    assert.ok(reused,"Explicitly reused profile is missing from the career table.");
    assert.equal(reused.showdowns,2,"One explicitly reused profile must aggregate across its two historical Saves.");
    assert.equal(reused.totalPoints,8,"Reused profile points did not aggregate correctly.");
    assert.equal(reused.name,"Canonical Manager","Identified career labels should use the Local Profile display name when available.");
    assert.equal(analytics.identity.unresolvedRoleCount,1,"Unresolved historical role must remain explicit in browser Analytics.");
    assert.equal(analytics.highestSeasonScore.value,11,"Season-scoped records must retain unresolved historical achievements.");
    await assertTeamVIdentitySafe(page,"careerStatistics","one unresolved role");
    await page.evaluate(()=>window.openOptionalModule("trophyRoom"));
    await openTeamVScreen(page,"trophyRoom");
    await assertTeamVIdentitySafe(page,"trophyRoom","one unresolved role");
    await page.evaluate(()=>window.openOptionalModule("careerStatistics"));
    await openTeamVScreen(page,"careerStatistics");

    assert.equal(analytics.managers.filter(manager=>manager.profileId===ids.profileA).length,1,"Explicitly reused profile must be one longitudinal career identity.");
    assert.equal(
      await page.evaluate(()=>Boolean(window.CareerModeSaveLibraryRuntime?.isReady?.())),
      false,
      "Read-only Career Statistics presentation must not require Save Library mutation authority activation."
    );

    const beforeRevision=await page.evaluate(()=>window.getCareerAnalyticsRevisionKey());
    await page.evaluate(async({profileA})=>{
      if(typeof window.loadRuntimeScript!=="function"){
        throw new Error("Optional runtime loader is unavailable during Analytics identity mapping audit.");
      }
      await window.loadRuntimeScript(
        "save-library-cutover",
        "js/saveLibraryCutover.js",
        ()=>typeof window.ensureSaveLibraryRuntimeAuthority==="function"
      );
      await window.ensureSaveLibraryRuntimeAuthority();
      const mapping=await window.CareerModeSaveLibraryRuntime.assignLegacyManagerProfile("analytics-history-unresolved","playerOne",profileA);
      if(!mapping||mapping.ok!==true){
        throw new Error("Canonical Save Library identity mapping failed during Analytics audit.");
      }
    },{profileA:ids.profileA});
    const afterRevision=await page.evaluate(()=>window.getCareerAnalyticsRevisionKey());
    assert.notEqual(afterRevision,beforeRevision,"Explicit historical identity mapping must invalidate the Career Analytics render/cache revision.");

    analytics=await readAnalytics(page);
    assert.equal(analytics.identity.unresolvedRoleCount,0,"Explicit historical mapping must clear the unresolved career role.");
    const remapped=analytics.managers.find(manager=>manager.profileId===ids.profileA);
    assert.equal(remapped.showdowns,3,"Mapped historical role must join the explicitly selected stable profile's longitudinal career.");
    assert.equal(remapped.totalPoints,19,"Mapped historical contribution did not join the selected stable profile.");
    assert.equal(analytics.managers.length,4,"Mapping one unresolved role must not merge any unrelated same-name profiles.");
    await assertTeamVIdentitySafe(page,"careerStatistics","after mapping");

    await page.evaluate(()=>window.openOptionalModule("trophyRoom"));
    await page.locator("#trophyRoom").waitFor({state:"visible",timeout:15000});
    await openTeamVScreen(page,"trophyRoom");
    const trophyRevision=await page.evaluate(()=>({career:window.getCareerAnalyticsRevisionKey(),trophy:typeof getTrophyRoomRenderKey==="function"?getTrophyRoomRenderKey():null}));
    assert.equal(trophyRevision.career,afterRevision,"Career Analytics revision changed unexpectedly before Trophy Room validation.");
    assert.equal(trophyRevision.trophy,afterRevision,"Trophy Room must consume the current Career Analytics revision.");
    const trophyAnalytics=await readAnalytics(page);
    assert.equal(trophyAnalytics.managers.length,4,"Trophy Room must consume the same four stable longitudinal identities.");
    assert.equal(trophyAnalytics.managers.find(manager=>manager.profileId===ids.profileA)?.showdowns,3,"Trophy Room analytics must include the explicitly mapped historical Showdown.");
    assert.equal(trophyAnalytics.identity.unresolvedRoleCount,0,"Resolved historical identity must not leave a stale unresolved role.");
    await assertTeamVIdentitySafe(page,"trophyRoom","after mapping");

    const singleton=await page.evaluate(key=>localStorage.getItem(key),singletonKey);
    assert.equal(singleton,null,"Read-only Analytics and historical identity mapping must not resurrect retired singleton authority.");

    const screenshotPath=path.join(resultsDirectory,`identity-safe-career-analytics-${runLabel}.png`);
    await page.screenshot({path:screenshotPath,fullPage:true});
    const result={
      runLabel,
      baseUrl:baseUrl.href,
      stableManagerCount:analytics.managers.length,
      linkedProfile:ids.profileA,
      linkedShowdowns:remapped.showdowns,
      unresolvedAfterMapping:analytics.identity.unresolvedRoleCount,
      trophyRevision,
      screenshot:screenshotPath
    };
    fs.writeFileSync(path.join(resultsDirectory,`identity-safe-career-analytics-${runLabel}.json`),JSON.stringify(result,null,2));
    assert.deepEqual(errors,[],`Identity-safe Career Analytics emitted page/console errors: ${errors.join(" | ")}`);
    console.log("Identity-safe Career Analytics browser audit passed: same-name profiles remain distinct, explicit profile reuse aggregates across Saves, unresolved history stays honest, mapping refreshes the analytics behind Career Statistics and Trophy Room (both Team V screens), and singleton authority stays retired.");
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
