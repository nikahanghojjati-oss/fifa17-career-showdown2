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
    const records=model.trophyRoom.records.filter(r=>typeof r.value==="number");
    assert.deepEqual(frame.records.map(r=>[r.manager,r.value]),records.map(r=>[r.manager,r.value]),`${id} records`);
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
  const isImage=file=>/\.(webp|png|jpe?g|avif|gif|svg)$/i.test(file);
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
console.log(`PASS career screens V10 contracts: ${n} checks.`);
