"use strict";
// r87 W3-5: prove the END of a Showdown and the start of the next one, on the Firebase emulator (CE2PG, never production).
//
// One run = two Showdowns on the same two accounts:
//   S  a Showdown of R87FR_SEASONS (1, 3, 5 or 10) seasons played to the end. R87FR_SCENARIO picks the end:
//        win     (default) one manager wins;
//        draw    the totals end level: Final Winner reads DRAW, no tiebreak;
//        golden  10 seasons only: Nik scores 15 in every season (11 from FIFA plus Prime Pack 4, CE2PG_PRIME=golden), 150 points,
//                so career screens must show a Golden Showdown (150 is the only Golden total).
//      On Final Winner, Nik taps REMATCH ("DANIEL STARTS IT"): the final Gazette, then his Showdown Home.
//      Daniel taps REMATCH: the final Gazette, then the seasons screen with S's length already picked.
//   R  the rematch. Daniel taps START on that preset screen; Nik's Home JOIN tile picks it up (no code typed).
//      Checked fresh: a new rivalry (S stays closed), Season 1 / N, the roulette and the Special Player reveal (left on here,
//      CE2PG turns it off) run again,
//      none of S's typed transfer names on either phone, and no tap of a CLOSE button.
//      R87FR_REMATCH=full (default for 1 and 3 seasons) plays R to the end too; end1 (default for 5 and 10) commits
//      season 1 and Daniel taps END SHOWDOWN, so R must show as one "Ended early" History row and count nowhere.
//   After R the CE2PG career checks run on both phones (History, Standings, Career Statistics, Trophy Room, Legacy,
//   Rivalry, Settings), then again after a local-storage wipe and in brand-new browsers: S is counted exactly once.
//
// This file adds no copy of the CE2PG harness. It loads tests/browser/ce2pg-journey.cjs as it stands, swaps a handful of
// exact lines (each swap fails loudly if the harness changed) and runs it with the plan above, so every CE2PG check runs too.
//
// Run (needs firebase@12.17.0 in node_modules: npm i --no-save firebase@12.17.0):
//   R87FR_SEASONS=1 node tests/browser/r87-finish-rematch-proof.cjs
//   R87FR_SEASONS=1 R87FR_SCENARIO=draw node tests/browser/r87-finish-rematch-proof.cjs
//   R87FR_SEASONS=3 node tests/browser/r87-finish-rematch-proof.cjs
//   R87FR_SEASONS=5 node tests/browser/r87-finish-rematch-proof.cjs
//   R87FR_SEASONS=10 R87FR_SCENARIO=golden node tests/browser/r87-finish-rematch-proof.cjs
// Ports: CE2PG_PORT_BASE / CE2PG_APP_PORT as in CE2PG (pick different ones to run several at once).
// Output: test-results/r87-finish-<seasons>-<scenario>.json (+ screenshots in the folder of the same name).
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");

const LEN=Number(process.env.R87FR_SEASONS||1);
const SCEN=process.env.R87FR_SCENARIO||"win";
const REMATCH=process.env.R87FR_REMATCH||(LEN<=3?"full":"end1");
if(![1,3,5,10].includes(LEN)||!["win","draw","golden"].includes(SCEN)||!["full","end1"].includes(REMATCH)||(SCEN==="golden"&&(LEN!==10||REMATCH!=="end1"))){
  console.error(`R87FR_SEASONS 1|3|5|10, R87FR_SCENARIO win|draw|golden (golden needs 10 and end1), R87FR_REMATCH full|end1 (got ${LEN}, ${SCEN}, ${REMATCH})`);process.exit(2);
}
// r87 (Nik 2026-11-01): a Golden Showdown is 150 only, so the golden run plays Prime Pack with Nik naming the Icon every season.
if(SCEN==="golden")process.env.CE2PG_PRIME="golden";
process.env.CE2PG_PLAN="single";
process.env.CE2PG_SEASONS=String(LEN);
process.env.CE2PG_SCENARIO=SCEN==="draw"?"draw":"";
process.env.R87FR_TAG=process.env.R87FR_TAG||`r87-finish-${LEN}-${SCEN}-${REMATCH}`;

const HARNESS=path.join(__dirname,"ce2pg-journey.cjs");
let src=fs.readFileSync(HARNESS,"utf8");
function swap(from,to){
  const at=src.indexOf(from);
  if(at<0||src.indexOf(from,at+1)>=0)throw new Error(`r87-finish-rematch-proof: the CE2PG harness changed, this line is ${at<0?"missing":"not unique"}: ${from.slice(0,120)}`);
  src=src.slice(0,at)+to+src.slice(at+from.length);
}
// 1. Own report name.
swap("const TAG=(PLAN_NAME===","const TAG=process.env.R87FR_TAG||(PLAN_NAME===");
// 1b. Keep the Special Player reveal on (CE2PG turns it off), so the rematch must show it again (Codex #1132).
swap("const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}`;",
  "const urlFor=user=>`${BASE}?cmsEmulator=1&cmsEmulatorUser=${user}&cmsAuthPort=${PORTS.auth}&cmsFirestorePort=${PORTS.firestore}&cmsSpecialPlayer=1`;");
// The Gate's Chromium runtime starts with --disable-webgl, so the reveal's three.js scene logs "Error creating WebGL context"
// and the reveal goes on without its animation (the stage, its text and Continue still show; turning WebGL on in this
// single-process runtime stops the journey at boot). Only those two exact messages are set aside from the console check and
// listed in the report; every other page or console error still fails it.
swap(`await check(m,"zz.pageerrors","no uncaught page errors or console errors",m.log.pageErrors.length===0&&m.log.consoleErrors.length===0,`,
  `r87SetAsideWebgl(m);await check(m,"zz.pageerrors","no uncaught page errors or console errors",m.log.pageErrors.length===0&&m.log.consoleErrors.length===0,`);
// 2. The plan: S then the rematch R.
swap(`]:[{name:"S",length:SEASONS,firstRealStart:true,target:SCENARIO==="draw"?"draw":RUN===2?"nik":"daniel",seed:SEASONS}];`,
  `]:r87Specs();`);
swap(`    for(const spec of specs){
      await playShowdown(ctx,spec);
    }`,`    await r87PlayAll(ctx,specs);`);
// 3. Final Winner exit: S leaves by REMATCH on both phones; R by BACK TO SHOWDOWN HOME as in CE2PG.
swap(`await m.page.locator("#v10ExitSlot [data-smart-back]").first().click({timeout:8000});paper=await gazette.passGazette(m.page,"final");landed=Boolean(paper)&&await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false);`,
  `if(spec.rematchNext){({paper,landed}=await r87RematchExit(m,spec));}else{await m.page.locator("#v10ExitSlot [data-smart-back]").first().click({timeout:8000});paper=await gazette.passGazette(m.page,"final");landed=Boolean(paper)&&await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false);}`);
// The career pages for S are read after R (they open from Home, which would drop Daniel's preset seasons screen).
swap("if(!SLIM)await careerCheckpoint(ctx,`${spec.name}.end`,{settingsLive:false});",
  "if(!SLIM&&!spec.rematchNext)await careerCheckpoint(ctx,`${spec.name}.end`,{settingsLive:false});");
// 4. R's START is tapped on the preset seasons screen REMATCH opened, not from Home.
swap(`  await backToShowdownHome(m);
  await m.page.locator("#newShowdown").click({timeout:30000});
  await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});`,
  `  if(!await r87UsePreset(m,length)){await backToShowdownHome(m);
  await m.page.locator("#newShowdown").click({timeout:30000});}
  await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:30000});`);
// 5. Run after the extension below is defined.
swap("\nmain().catch(error=>{","\nconst r87Start=()=>main().catch(error=>{");

const EXTENSION=String.raw`
// ===================== r87 W3-5 extension (tests/browser/r87-finish-rematch-proof.cjs) =====================
const R87={len:${LEN},scenario:${JSON.stringify(SCEN)},rematch:${JSON.stringify(REMATCH)},preset:{},roulette:{},special:{},reveal:{},final:{}};
report.r87FinishRematch=R87;
report.realUiSteps.push("Final Winner REMATCH (both phones), the final Gazette, Daniel's preset seasons screen START, Nik's Home JOIN tile");
function r87Specs(){
  const target=R87.scenario==="draw"?"draw":R87.scenario==="golden"?"nik":RUN===2?"nik":"daniel";
  const S={name:"S",length:R87.len,firstRealStart:true,target,seed:R87.len,rematchNext:true,golden:R87.scenario==="golden"};
  const R={name:"R",length:R87.len,target:RUN===2?"daniel":"nik",seed:R87.len+50,rematchOf:"S"};
  if(R87.rematch==="end1"){R.endAfter=1;R.target=null;}
  return [S,R];
}
// Golden Showdown: CE2PG_PRIME=golden makes Nik's every season Champions League 5 + title 3 + cup 1 + performance 1 + individual 1
// + Prime Pack 4 = 15 (150 in 10 seasons); this only checks the plan says so.
const r87BuildPlan=buildPlan;
buildPlan=function(seasons,teamCount,target,seed){
  const plan=r87BuildPlan(seasons,teamCount,target,seed);
  if(R87.scenario==="golden"&&showdownNow==="S")for(const s of plan)if(scoreSeason(s.nik).total!==15)throw new Error("golden plan: Nik's season is not 15 points");
  return plan;
};
// The roulette steps each phone plays before every season's Transfer Challenge (CE2PG ignores them).
const r87Wait=rosterRoulette.waitForTransfer;
rosterRoulette.waitForTransfer=async function(page,timeout){
  const seen=await r87Wait(page,timeout);
  const who=ctxRef&&(ctxRef.daniel.page===page?"daniel":ctxRef.nik.page===page?"nik":null);
  if(who){const key=showdownNow+".S"+(seasonNow||1);(R87.roulette[key]||(R87.roulette[key]={}))[who]=(R87.roulette[key][who]||[]).concat(seen);}
  return seen;
};
// The Special Player rows of the Career Start screen, read while it is up; and whether the reveal stage was ever added
// (without WebGL the stage can come and go between two polls).
async function r87WatchSpecial(m){
  await m.page.evaluate(()=>{
    window.__r87Special=null;window.__r87Reveal=false;
    const read=()=>{if(document.getElementById("specialPlayerStage"))window.__r87Reveal=true;const rows=[...document.querySelectorAll("#productionSharedCareerStartOverlay [data-special-player]")];if(rows.length)window.__r87Special=rows.map(r=>r.dataset.specialPlayer+": "+r.textContent.replace(/\s+/g," ").trim());};
    if(window.__r87SpecialObs)window.__r87SpecialObs.disconnect();
    window.__r87SpecialObs=new MutationObserver(read);window.__r87SpecialObs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});read();
  });
}
// The Special Player reveal stage (js/specialPlayerReveal.js) shows before Career Start: note it and tap through it
// (the scene's #stage, then its Continue #cta), as tests/browser/r86-special-player-reveal-audit.cjs does.
function r87PassReveal(m,key,stop){
  return (async()=>{
    while(!stop.done){
      try{
        if(await m.page.locator("#specialPlayerStage").count()){
          R87.reveal[key]=true;
          const frame=m.page.frameLocator("#specialPlayerStage iframe"),cta=frame.locator("#cta");
          if(await cta.isVisible({timeout:300}).catch(()=>false)&&await cta.isEnabled().catch(()=>false))await cta.click({timeout:3000}).catch(()=>{});
          else await m.page.locator("#specialPlayerStage iframe").evaluate(el=>el.contentDocument?.getElementById("stage")?.click()).catch(()=>{});
        }
      }catch(_e){}
      await m.page.waitForTimeout(400).catch(()=>{});
    }
  })();
}
const r87PlaySetup=playSetup;
playSetup=async function(daniel,nik){
  for(const m of [daniel,nik])await r87WatchSpecial(m);
  const stop={done:false},passing=[daniel,nik].map(m=>r87PassReveal(m,showdownNow+"."+m.user,stop));
  let out;try{out=await r87PlaySetup(daniel,nik);}finally{stop.done=true;await Promise.all(passing);}
  for(const m of [daniel,nik]){const got=await m.page.evaluate(()=>{window.__r87SpecialObs?.disconnect();return {rows:window.__r87Special,reveal:window.__r87Reveal};});R87.special[showdownNow+"."+m.user]=got.rows;if(got.reveal)R87.reveal[showdownNow+"."+m.user]=true;}
  if(showdownNow==="R")await r87FreshChecks(daniel,nik);
  return out;
};
async function r87PlayAll(ctx,specs){
  for(const spec of specs){
    const entry=await playShowdown(ctx,spec);
    if(spec.name==="S")R87.sRivalry=entry.rivalryId;
    if(spec.name==="R"){
      R87.rRivalry=entry.rivalryId;
      await check(null,"r87.R.newRivalry","the rematch is a new Showdown (new rivalry id), not S reopened",Boolean(entry.rivalryId&&R87.sRivalry&&entry.rivalryId!==R87.sRivalry),{S:R87.sRivalry,R:entry.rivalryId},{screen:"Database"});
      const s=await admin("rivalries/"+R87.sRivalry);
      await eq(null,"r87.S.staysClosed","after the rematch, S is still closed with its own finish witness",[field(s,"data","connectionState")?.stringValue,Boolean(field(s,"data","terminalClose"))],["closed",true],{screen:"Database"});
    }
  }
  await r87CareerTextChecks(ctx);
}
// Final Winner on S: what each phone's REMATCH shows and where it goes.
async function r87RematchExit(m,spec){
  const btn=m.page.locator("#finalWinnerRematch");
  const seen=await btn.waitFor({state:"visible",timeout:20000}).then(()=>true).catch(()=>false);
  const info=seen?await btn.evaluate(b=>({text:[...b.childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(" "),seasons:b.dataset.rematchSeasons,starter:b.dataset.rematchStarter,disabled:b.disabled})):null;
  R87.final[m.user]={button:info,headline:await m.page.locator("#finalWinnerScreen").innerText().then(t=>t.replace(/\s+/g," ").slice(0,300)).catch(()=>"")};
  const starter=m.user==="daniel";
  const want=starter?"REMATCH "+spec.length+" SEASON"+(spec.length===1?"":"S"):"REMATCH DANIEL STARTS IT";
  await eq(m,"r87.S.rematch.button",starter?"Daniel's Final Winner offers REMATCH with S's length":"Nik's Final Winner offers REMATCH that says Daniel starts it",info&&[info.text,info.seasons,info.starter,info.disabled],[want,String(spec.length),String(starter),false],{screen:"Showdown Champion"});
  await shot(m,"r87-final-winner");
  if(!seen)return {paper:null,landed:false};
  await btn.click({timeout:8000});
  const paper=await gazette.passGazette(m.page,"final");
  let landed;
  if(starter){
    landed=await m.page.locator("#createShowdown").waitFor({state:"visible",timeout:20000}).then(()=>true).catch(()=>false);
    const picked=await m.page.locator("#roundAmount").inputValue().catch(()=>null);
    R87.preset.daniel={screen:landed,picked};
    await eq(m,"r87.S.rematch.preset","Daniel's REMATCH opens the seasons screen with "+spec.length+" season(s) already picked",[landed,picked],[true,String(spec.length)],{screen:"Seasons"});
    await shot(m,"r87-rematch-preset");
    // CE2PG's own check of this step wants Showdown Home; on Daniel's rematch the seasons screen is the right place.
    landed=landed&&Boolean(paper);
  }else{
    landed=Boolean(paper)&&await m.page.locator("#mainMenu").waitFor({state:"visible",timeout:15000}).then(()=>true).catch(()=>false);
  }
  return {paper,landed};
}
// Daniel's START on R: use the preset seasons screen once (the first START after REMATCH).
async function r87UsePreset(m,length){
  if(showdownNow!=="R"||R87.presetUsed)return false;
  R87.presetUsed=true;
  const up=await m.page.locator("#createShowdown").isVisible().catch(()=>false);
  const picked=await m.page.locator("#roundAmount").inputValue().catch(()=>null);
  await eq(m,"r87.R.presetStillUp","the preset seasons screen is still up when Daniel taps START",[up,picked],[true,String(length)],{screen:"Seasons"});
  return up;
}
// R, right after setup (before season 1's Transfer Challenge is played).
async function r87FreshChecks(daniel,nik){
  const L=R87.len;
  for(const m of [daniel,nik]){
    await eq(m,"r87.R.season1","the rematch starts on Season 1 / "+L,await textOf(m,"#seasonIndicator"),"Season 1 / "+L,{screen:"Shared Transfer Challenge"});
    // S's typed transfer names (CE2PG tokens QW<S><k>X / ZP<S><k>V) must not be on R's screens or inputs.
    const left=await m.page.evaluate(()=>{const re=/\b(QWS\d+X|ZPS\d+V)\b/;const t=document.body.innerText||"";return {text:(t.match(re)||[])[0]||null,inputs:[...document.querySelectorAll("input,textarea")].filter(n=>re.test(String(n.value||""))).map(n=>n.id)};});
    await check(m,"r87.R.noLeftoverTransfers","no transfer guess or signing from S shows in the rematch (screen and inputs)",!left.text&&left.inputs.length===0,left,{screen:"Shared Transfer Challenge"});
    const tc=await m.page.evaluate(()=>{const s=window.CareerModeProductionSharedTransferChallenge?.getState?.();return s?{rivalryId:s.rivalryId||s.state?.rivalryId||null,season:s.state?.seasonNumber??s.seasonNumber??null}:null;});
    if(tc&&tc.rivalryId)await check(m,"r87.R.transferRivalry","the Transfer Challenge runs on the rematch's rivalry",tc.rivalryId!==R87.sRivalry,tc,{screen:"Shared Transfer Challenge"});
    const sRoul=(R87.roulette["S.S1"]||{})[m.user]||[],rRoul=(R87.roulette["R.S1"]||{})[m.user]||[];
    await check(m,"r87.R.roulette","the roulette runs again before the rematch's first Transfer Challenge (when S had one)",sRoul.length===0||rRoul.length>0,{S:sRoul,R:rRoul},{screen:"Roster Roulette"});
    await eq(m,"r87.R.revealAgain","the Special Player reveal stage shows in S and again in the rematch",[Boolean(R87.reveal["S."+m.user]),Boolean(R87.reveal["R."+m.user])],[true,true],{screen:"Special Player reveal"});
    const sSp=R87.special["S."+m.user],rSp=R87.special["R."+m.user];
    await check(m,"r87.R.specialPlayer","Career Start shows the rematch's Special Players again (when S showed them)",!sSp||Boolean(rSp&&rSp.length===sSp.length),{S:sSp,R:rSp},{screen:"Career Start"});
    await check(m,"r87.R.noCloseTap","no CLOSE tap was needed anywhere",!m.log.taps.some(t=>t.id==="sharedTerminalCloseAction"||t.id==="sharedTerminalCloseRetry"),"a CLOSE tap was needed",{screen:"Showdown Champion"});
    await shot(m,"r87-rematch-season1");
  }
}
function r87SetAsideWebgl(m){
  const webgl=t=>/^(THREE\.WebGLRenderer: )?Error creating WebGL context\.$/.test(String(t&&t.message||t).trim());
  const set=[...m.log.pageErrors.filter(webgl),...m.log.consoleErrors.filter(webgl)].map(t=>String(t&&t.message||t));
  m.log.pageErrors=m.log.pageErrors.filter(t=>!webgl(t));m.log.consoleErrors=m.log.consoleErrors.filter(t=>!webgl(t));
  if(set.length)report.observations.push({where:"console",user:m.user,setAside:"no WebGL in the Gate runtime (--disable-webgl): Special Player reveal without its 3D scene",messages:set});
}
// Words on the career pages at the very end (the numbers are CE2PG's checks).
async function r87CareerTextChecks(ctx){
  const last=report.checkpoints.at(-1);
  if(!last)return;
  const raw=report.raw[last.label]||{};
  for(const who of ["daniel","nik"]){
    const text=JSON.stringify(raw[who]||""),stats=JSON.stringify((raw[who]||{}).careerStatistics||"");
    // Career Statistics draws the gold line "GOLDEN SHOWDOWN Daniel ×1" only for a manager who earned one (the bare words
    // "Golden Showdown" are also in the Trophy Room's category copy, so only the line with a name and a count counts).
    const line=((/GOLDEN SHOWDOWN\s*((?:Daniel|Nik) ×\d+(?: · (?:Daniel|Nik) ×\d+)?)/i.exec(stats)||[])[1]||"").replace(/\b(DANIEL|NIK)\b/gi,w=>w[0].toUpperCase()+w.slice(1).toLowerCase())||null;
    if(R87.scenario==="golden")await eq(ctx[who],"r87.golden.shown","a finished 10-season Showdown on 150 points: Career Statistics shows the gold line GOLDEN SHOWDOWN Nik ×1",line,"Nik ×1",{screen:"Career Statistics"});
    else await eq(ctx[who],"r87.golden.none","no Golden Showdown line without 150 points in a 10-season Showdown",line,null,{screen:"Career Statistics"});
    if(R87.rematch==="end1")await check(ctx[who],"r87.R.endedEarlyRow","the ended rematch shows as an Ended early History row",/Ended early/i.test(text),"no Ended early row",{screen:"History"});
  }
}
r87Start();
`;
src=src.replace(/\s*$/,"\n")+EXTENSION;
const mod=new Module(__filename,module);
mod.filename=__filename;
mod.paths=Module._nodeModulePaths(__dirname);
mod._compile(src,__filename);
