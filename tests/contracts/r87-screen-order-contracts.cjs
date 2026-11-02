"use strict";
// Nik 2026-11-02 (gallery): "rrr button says go to transfer window ... we call it transfer war; after rrr is prime pack, make
// sure wording on button is consistent and order of screens is always consistent and never skip screens or jump past them".
//   O1 the roulette's button names the real next screen: GO TO THE PRIME PACK when it applies here, else GO TO THE TRANSFER WAR
//   O2 one on-screen name, Transfer War (the 15-minute clock inside it stays "transfer window"); ids and keys unchanged
//   O3 the order is always roulette -> Prime Pack -> Transfer War: one open path, each step skipped only when finished,
//      in every resume case (fresh start, reload mid-roulette, after the roulette, after the Prime Pack, fresh browser
//      after the Transfer War started, BACK then re-enter, RESUME); nothing finished is shown again
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.join(__dirname,"..","..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let checks=0;const ok=(id,label)=>{checks+=1;console.log(`ok ${checks} ${id} ${label}`);};
let failed=0;
function section(id,fn){try{fn();}catch(error){if(!process.env.SCREEN_ORDER_ALL)throw error;failed+=1;console.log(`not ok ${id} ${error.message.split("\n")[0]}`);}}

const RID=`pair_${"7".repeat(64)}`,CONFIRMED=Date.parse("2026-11-01T18:00:00Z");
const store=new Map();
global.window=globalThis;
globalThis.readStorageValue=key=>store.has(key)?store.get(key):null;
globalThis.writeStorageValue=(key,value)=>{store.set(key,value);};
const pstcSrc=read("js/productionSharedTransferChallenge.js");

// pstcPrimePackApplies / pstcPrimePackNext from the shipped file, in a sandbox with a fake view and storage.
function gate(view,{off=false}={}){
  const from=pstcSrc.indexOf("  const PRIME_PACK_DONE_KEY="),to=pstcSrc.indexOf("  async function pstcPrimePackFirst(request){");
  assert.ok(from>0&&to>from,"the Prime Pack gate sits just before pstcPrimePackFirst");
  const box={root:{CMS_PRIME_PACK:off?"off":undefined,readStorageValue:globalThis.readStorageValue},view,PRIME_PACK_FROM_MS:Date.parse("2026-10-30T00:00:00Z"),JSON,Array,Number};
  vm.createContext(box);vm.runInContext(`${pstcSrc.slice(from,to)};this.applies=pstcPrimePackApplies;this.next=pstcPrimePackNext;`,box);
  return box;
}

section("O1",()=>{
  const Step=require("../../js/rosterRouletteStep.js");
  assert.equal(Step.nextLabel({primePackNext:()=>true}),"GO TO THE PRIME PACK","the Prime Pack comes next: the button says so");
  assert.equal(Step.nextLabel({primePackNext:()=>false}),"GO TO THE TRANSFER WAR","no Prime Pack next: straight to the Transfer War");
  assert.equal(Step.nextLabel({}),"GO TO THE TRANSFER WAR");
  assert.equal(Step.nextLabel({primePackNext:()=>{throw new Error("x");}}),"GO TO THE TRANSFER WAR");
  const rrs=read("js/rosterRouletteStep.js");
  assert.match(rrs,/\{id:"go",label:"I'VE RELEASED HIM",primary:true\}/,"a fired spin still asks I'VE RELEASED HIM");
  assert.match(rrs,/\{id:"go",label:rrsNextLabel\(ctx\),primary:true\}/,"the safe card's button is the next screen's name");
  assert.doesNotMatch(rrs,/GO TO THE TRANSFER WINDOW/);
  assert.match(pstcSrc,/primePackNext:\(\)=>pstcPrimePackNext\(request,confirmedAtMs\)/,"the Transfer Challenge gives the roulette its own Prime Pack gate");
  const v={managerRole:"playerOne",state:null},req={rivalryId:RID,seasonNumber:2};
  store.clear();
  assert.equal(gate(v).next(req,CONFIRMED),true,"an r87 Showdown, season 2, not played here: the Prime Pack is next");
  assert.equal(gate(v,{off:true}).next(req,CONFIRMED),false,"the kill switch: the Transfer War is next");
  assert.equal(gate(v).next(req,Date.parse("2026-10-01T00:00:00Z")),false,"an older Showdown has no Prime Pack");
  assert.equal(gate(v).next({...req,seasonNumber:11},CONFIRMED),false);
  store.set("careerModeShowdown.primePackDone.v1",JSON.stringify([`${RID}|2|playerOne`]));
  assert.equal(gate(v).next(req,CONFIRMED),false,"already passed on this phone: the Transfer War is next");
  assert.equal(gate({...v,managerRole:"playerTwo"}).next(req,CONFIRMED),true,"the done key is per manager");
  store.clear();
  assert.equal(gate({...v,state:{phase:"WINDOW_OPEN"}}).next(req,CONFIRMED),false,"the Transfer War already started: it is next");
  assert.equal(require("../../js/iconGuessStep.js").doneKey,"careerModeShowdown.primePackDone.v1","the gate reads the step's own done key");
  ok("O1","the roulette's button names the real next screen (Prime Pack or Transfer War) from the Prime Pack's own gate");
});

section("O2",()=>{
  const files={
    "js/productionSharedTransferChallenge.js":['"OPEN TRANSFER WINDOW"','TRANSFER CHALLENGE`','"OPENING TRANSFER CHALLENGE…"','"Transfer Challenge: ','"TRANSFER CHALLENGE COMPLETE','"The Transfer Challenge ','so the transfer window stays shut','before the transfer window opens'],
    "js/showdownUI.js":["TRANSFER WINDOW`"],
    "js/productionSharedSeasonResultsRoute.js":["Transfer Challenge complete"],
    "js/productionSharedCareerStart.js":["CONTINUE TO TRANSFER CHALLENGE","Continue to the Transfer Challenge"],
    "js/ruleBook.js":['"TRANSFER CHALLENGE"',"Before each transfer window"],
    "js/rosterRouletteStep.js":["before the transfer window","The transfer window stays shut"],
    "visual-assets/v10_1/icon-guess/index.html":["Opening Transfer Challenge",'textContent="Continue"','hidden>Continue<'],
    "index.html":[">START TRANSFER CHALLENGE<",">SEASON 1 TRANSFER CHALLENGE<",">LOCK TRANSFER CHALLENGE RESULTS<",">START NEXT SEASON TRANSFER CHALLENGE<",">Transfer challenge: not started<"]};
  for(const [file,olds] of Object.entries(files)){const src=read(file);for(const old of olds)assert.ok(!src.includes(old),`${file} still shows "${old}"`);}
  assert.match(pstcSrc,/"OPEN TRANSFER WAR"/);assert.match(pstcSrc,/`START SEASON \$\{season\} TRANSFER WAR`/);assert.match(pstcSrc,/`SEASON \$\{view\?\.seasonNumber\|\|pstcSeason\(\)\} TRANSFER WAR`/);
  assert.match(read("js/showdownUI.js"),/`RESUME SEASON \$\{season\} TRANSFER WAR`/);
  assert.match(read("js/ruleBook.js"),/createRuleSection\("03", "TRANSFER WAR",/,"the Rule Book card is the Transfer War");
  assert.match(read("js/ruleBook.js"),/"The transfer window lasts 15 minutes\."/,"the 15-minute clock is still the transfer window");
  assert.match(pstcSrc,/"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD"/,"TRANSFER WINDOW LIVE (the clock) stays");
  const page=read("visual-assets/v10_1/icon-guess/index.html");
  assert.match(page,/id="cta" type="button" hidden>Go to the Transfer War</,"the Prime Pack's exit button names the Transfer War");
  assert.match(page,/c\.textContent="Opening the Transfer War…"/);
  for(const id of ['id="seasonPrimaryAction"','id="transferChallengeTitle"','id="completeTransferChallenge"','id="nextSeasonAction"','id="dashboardTransferStatus"'])assert.ok(read("index.html").includes(id),`${id} keeps its id`);
  ok("O2","one on-screen name, Transfer War, on the dashboard, RESUME, Career Start, Season Results, Rule Book, roulette and Prime Pack exit; the clock stays the transfer window");
});

section("O3",()=>{
  // One open path: roulette, then Prime Pack, then the Transfer War screen, each must say go.
  const open=pstcSrc.slice(pstcSrc.indexOf("async function pstcOpenNow(){"),pstcSrc.indexOf("async function pstcOpenNow(){")+1400);
  const r=open.indexOf("await pstcRouletteFirst(request)"),p=open.indexOf("await pstcPrimePackFirst(request)"),n=open.indexOf('root.navigateTo("transferChallenge")');
  assert.ok(r>0&&p>r&&n>p,"pstcOpenNow: roulette, then Prime Pack, then the Transfer War, and stops when either says no");
  assert.equal((pstcSrc.match(/navigateTo\("transferChallenge"\)/g)||[]).length,1,"the Transfer War screen opens from that one path only");
  for(const file of ["js/showdownUI.js","js/productionSharedCareerStart.js","js/productionSharedMultiSeasonProgression.js","js/screens.js"])assert.doesNotMatch(read(file),/navigateTo\(\s*["']transferChallenge["']/,`${file} never opens the Transfer War past the roulette and Prime Pack`);
  // Roulette: fresh start and reload mid-roulette play it (not done); after it (done key) it is passed; a fresh browser after the
  // Transfer War started (passed, set only when the Prime Pack applies) marks it done without its finished card.
  const Step=require("../../js/rosterRouletteStep.js");
  const ctx={rivalryId:RID,managerRole:"playerTwo",season:3,clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},confirmedAtMs:CONFIRMED,phase:"NOT_STARTED"};
  store.clear();
  assert.equal(Step.decide(ctx),true,"fresh start (and a reload mid-roulette: nothing is marked done until its last tap) plays the roulette");
  store.set(Step.doneKey,JSON.stringify([`${RID}|3|playerTwo`]));
  assert.equal(Step.decide(ctx),false,"after the roulette (BACK from the Prime Pack, re-enter, RESUME): it is passed, never replayed");
  store.clear();
  assert.match(read("js/rosterRouletteStep.js"),/if\(!rrsDecide\(ctx\)\|\|!rrsDoc\(\)\)return true;\s*\/\/[^\n]*\n[^\n]*\n\s*if\(ctx\.passed===true\)\{rrsMark\(DONE_KEY,rrsKey\(ctx\)\);return true;\}/,"a finished roulette (the Transfer War started after it) is marked done before any card");
  assert.match(pstcSrc,/passed:Boolean\(view\.state\)&&pstcPrimePackApplies\(request,confirmedAtMs\)/,"passed only once the Transfer War started and the Prime Pack applies (both phones passed the roulette to reach it)");
  // Prime Pack: after it (done key) it is passed; a fresh browser after the Transfer War started marks it done (no finished round).
  const prime=pstcSrc.slice(pstcSrc.indexOf("async function pstcPrimePackFirst(request){"),pstcSrc.indexOf("async function pstcPrimePackFirst(request){")+3000);
  assert.ok(prime.indexOf("if(!step.applies(ctx))return true;")<prime.indexOf("if(view.state){step.markDone?.(ctx);return true;}")&&prime.indexOf("if(view.state){step.markDone?.(ctx);return true;}")<prime.indexOf("step.run(ctx,"),"the Transfer War already started: the Prime Pack is marked done, not shown again");
  const Prime=require("../../js/iconGuessStep.js");
  const pctx={rivalryId:RID,managerRole:"playerOne",season:3,confirmedAtMs:CONFIRMED};
  Prime.markDone(pctx);
  assert.ok(JSON.parse(store.get(Prime.doneKey)).includes(`${RID}|3|playerOne`),"markDone writes the step's own done key");
  assert.match(read("js/iconGuessStep.js"),/if\(igsList\(DONE_KEY\)\.includes\(igsKey\(ctx\)\)\)return true;/,"a passed Prime Pack goes straight on to the Transfer War");
  // BACK from either step returns home with nothing marked done, so re-entering starts at the first unfinished step.
  assert.match(read("js/iconGuessStep.js"),/if\(result==="back"\)\{wentHome=true;return false;\}/);
  ok("O3","roulette -> Prime Pack -> Transfer War on one path; each step is passed only when finished, in every resume case");
});

if(failed){console.log(`FAIL r87 screen order contracts: ${failed} failed.`);process.exit(1);}
console.log(`PASS r87 screen order contracts: ${checks} checks.`);
