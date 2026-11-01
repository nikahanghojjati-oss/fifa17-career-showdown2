#!/usr/bin/env node
"use strict";
// G-13 part 1 contract: Team V's Career Statistics and Trophy Room screens read the real career model only.
// toV10Frame maps the model to Team V's frame with the model's own numbers, Daniel first and Nik second;
// loading and unavailable carry no numbers; all Statistics buttons are reachable online; the startup
// shell is untouched and every new lazy file is shell-cached.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let n=0;
function check(name,fn){n+=1;fn();console.log(`ok ${n} ${name}`);}

const V10=require(path.join(ROOT,"js/careerScreensV10.js"));
const DIR="tests/fixtures/data-contract-v1";
const SCENARIOS=["empty-career","loading","unavailable","partial-career","finished-three-seasons","multi-showdown-career","tiebreak-finish"];
const fixture=id=>JSON.parse(read(`${DIR}/${id}.json`));
const SCREENS=["careerStatistics","trophyRoom"];
const MANAGERS=["daniel","nik"];
const numbers=(value,trail="frame",out=[])=>{
  if(typeof value==="number")out.push(trail);
  else if(value&&typeof value==="object")for(const [k,v] of Object.entries(value))numbers(v,trail+"."+k,out);
  return out;
};

check("V1 every fixture maps to the model's status on both screens",()=>{
  for(const id of SCENARIOS){
    const model=fixture(id).career;
    for(const screen of SCREENS){
      const frame=V10.toV10Frame(model,screen);
      assert.equal(frame.status,model.status,`${id} ${screen}`);
      assert.deepEqual(frame.managerOrder,MANAGERS,`${id} ${screen} managerOrder`);
      assert.ok(Object.isFrozen(frame));
    }
  }
  for(const screen of SCREENS){
    assert.equal(V10.toV10Frame(null,screen).status,"unavailable");
    assert.equal(V10.toV10Frame({},screen).status,"unavailable");
  }
  assert.throws(()=>V10.toV10Frame(fixture("loading").career,"legacy"),/CAREER_SCREEN_V10_UNKNOWN/);
  assert.throws(()=>V10.toV10Frame(fixture("loading").career,"rivalryStatistics"),/CAREER_SCREEN_V10_UNKNOWN/);
});

const counted=SCENARIOS.filter(id=>["ready","partial"].includes(fixture(id).career.status));
check("V2 Career Statistics carries exactly the model's numbers",()=>{
  assert.ok(counted.length>=4,counted.join());
  for(const id of counted){
    const model=fixture(id).career,frame=V10.toV10Frame(model,"careerStatistics");
    for(const m of MANAGERS){
      const src=model.managers[m];
      for(const key of ["leagueTitles","domesticCups","championsLeagues","seasonWins","seasonDraws","seasonLosses","careerPoints","seasons","totalTrophies","bestSeasonScore","averageLeaguePoints","averageLeagueGoals"])assert.equal(frame.managers[m][key],src[key],`${id} ${m}.${key}`);
      assert.deepEqual({...frame.showdowns[m]},{...src.showdowns},`${id} ${m}.showdowns`);
    }
  }
});
check("V3 Trophy Room carries exactly the model's numbers",()=>{
  for(const id of counted){
    const model=fixture(id).career,frame=V10.toV10Frame(model,"trophyRoom");
    for(const m of MANAGERS){
      const cab=model.trophyRoom.cabinet[m];
      for(const key of ["leagueTitles","domesticCups","championsLeagues","totalTrophies"])assert.equal(frame.managers[m][key],cab[key],`${id} ${m}.${key}`);
      assert.equal(frame.managers[m].careerPoints,model.managers[m].careerPoints,`${id} ${m} careerPoints`);
      assert.equal(frame.managers[m].seasonWins,model.managers[m].seasonWins,`${id} ${m} seasonWins`);
      assert.equal(frame.showdowns[m].wins,model.managers[m].showdowns.wins,`${id} ${m} Showdown wins`);
    }
    // r87 career fixes (B5): a record nobody holds (no best yet, or a best of 0) is a dash with no holder, never "0 Shared".
    const records=model.trophyRoom.records.map(r=>typeof r.value==="number"&&r.value>0?[r.manager,r.value]:["","\u2014"]);
    assert.deepEqual(frame.records.map(r=>[r.manager,r.value]),records,`${id} records`);
  }
});
check("V4 partial shows the {readable} of {indexed} coverage",()=>{
  const model=fixture("partial-career").career;
  for(const screen of SCREENS){
    const frame=V10.toV10Frame(model,screen);
    assert.equal(frame.status,"partial");
    assert.deepEqual({...frame.coverage},{readable:model.coverage.readable,indexed:model.coverage.indexed});
  }
  assert.match(V10.STRINGS.careerStatistics.coverageTemplate,/\{READABLE\} of \{INDEXED\}/);
  assert.match(V10.STRINGS.trophyRoom.stateCopy.partial.text,/\{READABLE\} of \{INDEXED\}/);
});
check("V5 Daniel first and Nik second in every row, also when Nik leads",()=>{
  const model=fixture("multi-showdown-career").career;
  assert.equal(model.trophyRoom.standings[0].manager,"nik","fixture: Nik leads");
  const cs=V10.toV10Frame(model,"careerStatistics"),tr=V10.toV10Frame(model,"trophyRoom");
  assert.deepEqual(cs.expectedCareerTableRows.map(r=>[r.manager,r.rank]),[["daniel",2],["nik",1]]);
  assert.deepEqual(tr.standings.map(r=>[r.manager,r.rank,r.careerPoints]),[["daniel","#2",model.managers.daniel.careerPoints],["nik","#1",model.managers.nik.careerPoints]]);
  for(const frame of [cs,tr])assert.deepEqual(Object.keys(frame.managers),MANAGERS);
  assert.deepEqual(Object.keys(cs.showdowns),MANAGERS);assert.deepEqual(Object.keys(tr.showdowns),MANAGERS);
  for(const id of counted){
    const f=V10.toV10Frame(fixture(id).career,"careerStatistics");
    assert.deepEqual(f.expectedCareerTableRows.map(r=>r.manager),MANAGERS,id);
  }
});
check("V6 a level table ranks both managers first",()=>{
  const model=fixture("tiebreak-finish").career;
  const level=JSON.parse(JSON.stringify(model));level.trophyRoom.standings=level.trophyRoom.standings.map(r=>({...r,level:true}));
  assert.deepEqual(V10.toV10Frame(level,"careerStatistics").expectedCareerTableRows.map(r=>r.rank),[1,1]);
  assert.deepEqual(V10.toV10Frame(level,"trophyRoom").standings.map(r=>r.rank),["#1","#1"]);
});
check("V7 loading and unavailable carry no numbers; no preview chip with real data",()=>{
  for(const id of ["loading","unavailable"])for(const screen of SCREENS){
    const frame=V10.toV10Frame(fixture(id).career,screen);
    assert.deepEqual(numbers(frame),[],`${id} ${screen}`);
    assert.equal(frame.managers,undefined);assert.equal(frame.showdowns,undefined);
  }
  const broken=JSON.parse(JSON.stringify(fixture("finished-three-seasons").career));broken.managers.nik.careerPoints=null;
  for(const screen of SCREENS)assert.deepEqual(numbers(V10.toV10Frame(broken,screen)),[],`null field ${screen}`);
  for(const id of SCENARIOS)for(const screen of SCREENS){
    const frame=V10.toV10Frame(fixture(id).career,screen);
    assert.ok(!JSON.stringify(frame).includes("Preview data"),`${id} ${screen}`);
    assert.ok(!frame.previewLabel,`${id} ${screen} previewLabel`);
  }
  assert.ok(!JSON.stringify(V10.STRINGS).includes("Preview data"));
  for(const screen of SCREENS)assert.equal(V10.STRINGS[screen].previewLabel,"");
  const interim=V10.toV10Frame(fixture("finished-three-seasons").careerInterim,"careerStatistics");
  assert.equal(interim.previewLabel,"Current Showdown only. Career history is not yet available.");
  const tr=read("visual-assets/v10_1/trophy-room/trophy-room.js");
  assert.ok(tr.includes('${preview ? `<div class="previewPill">'),"Trophy Room draws no empty preview pill");
  assert.match(read("visual-assets/v10_1/career-statistics/career-statistics.js"),/chip\.hidden = !label;/);
});
check("V8 all Statistics buttons are reachable online; Career Statistics is shown",()=>{
  const src=read("js/onlinePlayerIdentity.js");
  const css=/style\.textContent="(.*?)\{display:none!important\}/.exec(src);
  assert.ok(css,"containment stylesheet");
  const selectors=css[1].split(",");
  assert.ok(!selectors.some(s=>s.startsWith("#legacyButton")));
  assert.ok(!selectors.some(s=>s.startsWith("#rivalryStatisticsButton")));
  assert.ok(!selectors.some(s=>s.startsWith("#careerStatisticsButton")),"careerStatisticsButton no longer hidden");
  assert.ok(src.includes('style.id="onlineInternalSurfaceContainment"'));
});
check("V9 startup shell unchanged; every new lazy file is shell-cached (images: revision-keyed runtime cache, job 24); runtime revision untouched",()=>{
  const index=read("index.html"),sw=read("service-worker.js");
  assert.ok(!index.includes("trophyRoomButton"));assert.ok(!index.includes("careerScreensV10"));assert.ok(!index.includes("visual-assets/v10_1"));
  const revision=/const RUNTIME_REVISION = "([^"]+)";/.exec(sw)[1];
  for(const tag of index.match(/\?v=[^"']+/g))assert.equal(tag,"?v="+revision,"index.html and RUNTIME_REVISION agree");
  const shell=new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map(m=>m[1]));
  const lazy=["js/careerScreensV10.js"];
  const walk=dir=>fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true}).forEach(e=>e.isDirectory()?walk(dir+"/"+e.name):lazy.push(dir+"/"+e.name));
  walk("visual-assets/v10_1");
  // Job 24: Team V images moved from the install precache to the SW runtime image cache keyed by RUNTIME_REVISION.
  const imageRule=new RegExp(/const V10_IMAGE_PATH = \/(.+)\/i;/.exec(sw)[1],"i");
  // r87: the roulette's sounds (.wav) follow the same runtime rule as the images.
  const isImage=file=>/\.(webp|png|jpe?g|avif|gif|svg|wav)$/i.test(file);
  for(const file of lazy){
    if(isImage(file)){assert.ok(imageRule.test(file),`runtime image rule covers ${file}`);assert.ok(!shell.has(file),`${file} not precached`);}
    else assert.ok(shell.has(file),`shell lists ${file}`);
  }
  assert.match(sw,/const V10_IMAGE_CACHE_NAME = `\$\{V10_IMAGE_CACHE_PREFIX\}\$\{RUNTIME_REVISION\}`;/);
  const binder=read("js/careerScreensV10.js");
  for(const f of [...V10.FILES.styles,...V10.FILES.scripts.map(s=>s[1]),...SCREENS.flatMap(s=>[V10.FILES[s].style,V10.FILES[s].script[1],V10.FILES[s].platemap])])assert.ok(shell.has(V10.BASE+f),`binder file ${f} is shell-cached`);
  for(const m of binder.matchAll(/\$\{(cs|tr)\}(assets\/[A-Za-z0-9_]+\.webp)/g)){const file=V10.BASE+(m[1]==="cs"?"career-statistics/":"trophy-room/")+m[2];assert.ok(fs.existsSync(path.join(ROOT,file))&&imageRule.test(file),m[0]);}
  const stats=read("js/statistics.js");
  assert.ok(stats.includes('window.loadRuntimeScript("career-screens-v10", "js/careerScreensV10.js"'),"lazy load from statistics.js");
  assert.ok(read("js/trophyRoom.js").includes('openCareerScreensV10("trophyRoom")'));
  for(const banned of ["index.html","preview.html","fixtures.json","evidence","review","tools"])for(const dir of ["trophy-room","career-statistics"])assert.ok(!fs.existsSync(path.join(ROOT,"visual-assets/v10_1",dir,banned)),`${dir}/${banned} not copied`);
  assert.ok(!lazy.some(f=>/\.md$|_SRC\.png$|GUIDE_|PHONE_PROOF/.test(f)),"no docs or review sources copied");
  // Job 27: Transfer War ships three runtime PNGs (alpha overlays Team V delivers only as PNG); none elsewhere.
  const runtimePng=new Set(["DER_TR2_PLATE_G_GLASS_C_V1.png","OVL_NIK_FINGERTIP_V1_1672.png","OVL_NIK_FINGERTIP_V1_3344.png"].map(f=>"visual-assets/v10_1/tr2/slice-02-plate/assets/"+f));
  assert.ok(!lazy.some(f=>/\.png$/.test(f)&&!runtimePng.has(f)),"no png copied");
});
check("V10 production never reads fixtures",()=>{
  const binder=read("js/careerScreensV10.js");
  assert.ok(!binder.includes("fixtures.json"));
  assert.ok(!/\bfetch\(\s*["'`]fixtures/.test(binder));
  assert.ok(!binder.includes("Preview data"));
  assert.ok(!/console\.(error|warn)/.test(binder),"loading is a normal state, never an error log");
});
// r80: the first Career Statistics visit after a reload mounts the screen twice in a row (loading, then the provider
// model; v10Render rewrites the host and boots again each time). Both boots reach the headline count-up for the same
// tiles; the count-up must still land on the career's numbers, never on the 0 the other boot's count-up started from.
// Runs the real career-statistics.js and motion.js in the pinned Chromium with motion on (no Firebase, no network).
async function headlineCountUpAcrossMounts(){
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  const V10=require(path.join(ROOT,"js/careerScreensV10.js"));
  const fmt=n=>Number.isInteger(n)?String(n):Number(n).toFixed(2).replace(/\.00$/,"");
  const loading=V10.toV10Frame(fixture("loading").career,"careerStatistics");
  const MARKUP='<div id="stage-root"><div id="careerScene"></div><h2 id="careerStatisticsScreenTitle"><span class="sd-visually-hidden"></span></h2><div id="previewChip" hidden></div><section id="headlineTiles"></section><section id="careerTablePanel"></section><section id="comparisonPanel"></section><section id="leadersPanel"></section><section id="statePanel" hidden></section></div>';
  const origin="http://career-statistics.test/";
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  try{
    // One context (the pinned Chromium runs single-process unless CMS_CHROMIUM_MULTI_CONTEXT=1); a fresh page per case.
    const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:"no-preference",serviceWorkers:"block"});
    await context.route(`${origin}**`,route=>route.fulfill({status:200,contentType:"text/html",body:'<!doctype html><html><body><section id="careerStatistics"></section></body></html>'}));
    for(const id of ["finished-three-seasons","multi-showdown-career"]){
      const model=V10.toV10Frame(fixture(id).career,"careerStatistics"),D=model.managers.daniel,N=model.managers.nik;
      const expected=[Math.max(model.showdowns.daniel.completed,model.showdowns.nik.completed),D.seasons,N.seasons,D.careerPoints,N.careerPoints,D.totalTrophies,N.totalTrophies].map(fmt);
      // [first frame, gap before the second mount in ms]: both boots pending at once (the reload case), then the second
      // mount landing before, during and after the first boot's count-up.
      for(const [first,gapMs] of [[loading,0],[model,0],[model,300],[model,700],[model,1400]]){
        const page=await context.newPage();
        try{
          const pageErrors=[];page.on("pageerror",error=>pageErrors.push(String(error?.message||error)));
          await page.goto(origin,{waitUntil:"load"});
          await page.evaluate(({markup,strings,first})=>{
            window.ShowdownStage={mount:()=>({})};window.CAREER_STATISTICS_APP=true;window.CAREER_STATISTICS_QS="frame=LIVE";window.CAREER_STATISTICS_PLATEMAP={};
            window.__csMarkup=markup;window.__csStrings=strings;window.__csFirst=first;
          },{markup:MARKUP,strings:V10.STRINGS.careerStatistics,first});
          await page.addScriptTag({path:path.join(ROOT,"visual-assets/v10_1/shared/motion.js")});
          await page.addScriptTag({path:path.join(ROOT,"visual-assets/v10_1/career-statistics/career-statistics.js")});
          assert.equal(await page.evaluate(()=>window.ShowdownMotion.isReducedMotion()),false,"motion is on, so the count-up runs");
          // As v10Render: rewrite the host, set the frame, boot.
          const mount=frame=>page.evaluate(frame=>{document.getElementById("careerStatistics").innerHTML=window.__csMarkup;window.CAREER_STATISTICS_FIXTURES={strings:window.__csStrings,frames:{LIVE:frame}};window.ShowdownCareerStatisticsBoot();},frame);
          if(gapMs===0)await page.evaluate(({first,model})=>{for(const frame of [first,model]){document.getElementById("careerStatistics").innerHTML=window.__csMarkup;window.CAREER_STATISTICS_FIXTURES={strings:window.__csStrings,frames:{LIVE:frame}};window.ShowdownCareerStatisticsBoot();}},{first,model});
          else{await mount(first);await page.waitForTimeout(gapMs);await mount(model);}
          const label=`${id} (${first.status} then ${model.status}, ${gapMs} ms apart)`;
          await page.waitForTimeout(1600);
          const seen=await page.evaluate(()=>[...document.querySelectorAll("#headlineTiles .headlineNumber, #headlineTiles .headlinePair b")].map(el=>({text:el.textContent.trim(),counted:el.classList.contains("sd-count-up")})));
          assert.deepEqual(seen.map(x=>x.text),expected,`${label}: the headline lands on the career's numbers`);
          assert.ok(seen.every(x=>x.counted),`${label}: every headline number counted up`);
          const table=await page.evaluate(()=>[...document.querySelectorAll("#careerTablePanel tbody tr")].map(tr=>tr.children[2]?.textContent.trim()));
          assert.deepEqual(table,[String(model.showdowns.daniel.completed),String(model.showdowns.nik.completed)],`${label}: the table's Showdowns column agrees`);
          assert.deepEqual(pageErrors,[],`${label}: no page errors`);
        }finally{await page.close();}
      }
    }
  }finally{await browser.close();}
}
// Codex P1 on release PR #366: a registered manager opening Stats or Trophy Room with no supplied model must
// get the provider-backed completed-Showdown career (the loader History uses), not a permanent "unavailable".
// A browser that dies mid-check can leave nothing to wait on: Node then exits 0 without the PASS line, so that fails.
let finished=false;
process.on("exit",code=>{if(!finished&&!code){console.error("career screens V10 contracts ended before their last check.");process.exitCode=1;}});
(async()=>{
  const vm=require("node:vm");
  const registrations=new Map(),drawn=new Map(),frames=[];let release,loads=0;
  const shown=new Set(["careerStatistics","trophyRoom"]);
  const career=fixture("multi-showdown-career").career;
  const ctx={console,setTimeout,document:{getElementById:()=>null},
    CareerModeCareerScreenSeam:require(path.join(ROOT,"js/careerScreenSeam.js")),
    CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:"nik"})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:"uid-nik"})},
    CareerModePersistentNikDanielPair:{getState:()=>({rivalryId:"r1"})},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"uid-nik"}},firestore:{},firestoreSdk:{doc(){},getDoc(){}}})},
    // r80 real vs test: a real account (its career-start marker, nothing hidden); career pages show nothing while it is unknown.
    CareerModeCareerStartMarker:{readMarker:async()=>({status:"ready",hiddenRivalryIds:[]}),hiddenRivalryIds:m=>m.hiddenRivalryIds.slice(),epoch:()=>0},
    CareerModeSharedActiveShowdownAdapter:{buildActiveShowdownViews:()=>({careerInput:null})},
    CareerModeSparkClosedShowdownCareerLoader:{loadClosedShowdownCareer:async options=>{loads+=1;assert.equal(options.user.uid,"uid-nik");await new Promise(r=>{release=r;});return {model:career};}},
    addEventListener(){},dispatchEvent(){}};
  for(const g of ["CareerModeSharedHistoryConvergence","CareerModeSharedFinalReconciliation","CareerModeSharedTerminalClose","CareerModeSharedCareerAnalytics","CareerModeSharedClosedShowdownAdapter","CareerModeSparkCompletedShowdownReader"])ctx[g]={};
  ctx.window=ctx;
  ctx.CareerModeV10Screens={install(){return this;},register(id,def){registrations.set(id,def);},isMounted:id=>drawn.has(id),invalidate:id=>drawn.delete(id),hide:id=>drawn.delete(id),
    async show(id){const def=registrations.get(id);if(!shown.has(id))return false;const frame=def.frame();if(!frame)return false;if(drawn.get(id)!==frame){drawn.set(id,frame);frames.push([id,frame]);}return true;}};
  vm.createContext(ctx);
  ctx.loadRuntimeScript=async(key,file,ready)=>{if(!ready()){vm.runInContext(read(file),ctx);}assert.ok(ready(),file);};
  vm.runInContext(read("js/careerScreensV10.js"),ctx);
  const settle=async()=>{for(let i=0;i<20;i++)await new Promise(r=>setImmediate(r));};
  await ctx.CareerModeCareerScreensV10.mount("careerStatistics",()=>null);await settle();
  assert.equal(loads,1,"opening online Career Statistics reads the closed-Showdown career once");
  assert.equal(drawn.get("careerStatistics").status,"loading","a normal loading state while the provider read runs");
  release();await settle();
  assert.equal(drawn.get("careerStatistics"),career,"Career Statistics draws the provider-backed career model, not unavailable");
  await ctx.CareerModeCareerScreensV10.mount("trophyRoom",()=>null);await settle();
  assert.equal(drawn.get("trophyRoom"),career,"Trophy Room shows the cached model at once while it refreshes");
  release();await settle();
  assert.equal(ctx.CareerModeRivalryLegacyV10.cachedCareerModel(),career);
  ctx.CareerModeSparkConnectedAccount.getState=()=>({connected:true,accountId:"uid-other"});
  assert.equal(ctx.CareerModeRivalryLegacyV10.cachedCareerModel(),null,"another account never sees the cached career");
  const supplied={status:"empty"};
  await ctx.CareerModeCareerScreensV10.mount("careerStatistics",()=>supplied);await settle();
  assert.equal(loads,2,"a supplied model adds no provider read");
  assert.equal(drawn.get("careerStatistics"),supplied);
  const sf=read("js/seasonFinalV10.js");
  assert.ok(/function currentCareer\(\)\{[^\n]*cachedCareerModel/.test(sf)&&sf.includes('"career-mode-online-career-model-change"'),"the Standings Career view reads the same provider-backed model and redraws when it arrives");
  console.log(`ok ${++n} V-P1 online Career Statistics, Trophy Room and Standings Career read the provider-backed completed-Showdown model`);
  await headlineCountUpAcrossMounts();
  console.log(`ok ${++n} V-C1 the headline count-up lands on the career's numbers whatever order two back-to-back mounts finish in (first visit after a reload: loading, then the model)`);
  console.log(`PASS career screens V10 contracts: ${n} checks.`);finished=true;
})().catch(error=>{console.error(error);process.exitCode=1;});
