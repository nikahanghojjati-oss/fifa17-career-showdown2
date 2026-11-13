#!/usr/bin/env node
"use strict";
// 2.4.0 Squad Management x END SHOWDOWN. Played in CE2PG on gameplay/r91 64e01891: Nik's phone on the Squad screen (pre, before
// the Russian Roulette, and post, after the Transfer War) while Daniel taps END SHOWDOWN. Terminal Close saw the Showdown ended
// (DELETED) and showed Showdown Home with its notice, but the Squad stage (#sqStage, a full-screen dialog) stayed on top of
// Home, still editable, and its LOCK could still send the squad of an ended Showdown.
//   TC-1 pre, nothing locked: the ended Showdown takes the stage down at once; the run resolves false without a second
//        navigation (Terminal Close already showed Home); nothing is written; LOCK on the gone screen sends nothing.
//   TC-2 pre, locked and waiting for the rival: the rival listener stops and nothing more is read or written.
//   TC-3 post: the stage goes the same way.
//   TC-4 a LOCK whose read is in flight when the Showdown ends sets nothing, and starts no rival listener.
//   TC-5 the stage is still loading (its own read in flight): no screen is drawn after it, the loading screen goes.
//   TC-6 another Showdown's end leaves this stage alone; Terminal Close passes the ended rivalry.
//   TC-7 Terminal Close takes the stage down also when Home already shows under it.
// Real files: js/squadSheetStep.js, js/squadScreen.js, js/squadSheet.js, the club data, and Terminal Close's own
// leave-for-Home function from js/productionSharedTerminalClose.js, in Chromium. On 64e01891 TC-1 fails (the stage stays).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};

const tcSource=read("js/productionSharedTerminalClose.js");
const leaveMatch=/\n  function ptcLeaveEndedShowdown\([^)]*\)\{[\s\S]*?\n  \}\n/.exec(tcSource);
assert.ok(leaveMatch,"Terminal Close keeps its leave-for-Home function");

const RID="pair_"+"a".repeat(64),OTHER="pair_"+"b".repeat(64);
const SHELL=`<!doctype html><html><body>
<div id="loadingScreen" class="hidden" hidden><p id="loadingText">LOADING</p></div>
<section id="mainMenu" class="screen hidden">HOME</section>
<section id="dashboard" class="screen">DASHBOARD</section>
<section id="transferChallenge" class="screen hidden">TRANSFER WAR</section>
</body></html>`;

// The page side: a fake Firestore that counts reads, writes and listeners, and can hold a read open.
function pageSetup({rid,leave}){
  const log={reads:0,writes:[],listeners:0,stopped:0,navigations:[],screens:[],notices:[]};
  let hold=null;
  window.__sq={log,holdNextRead(){let release;const gate=new Promise(r=>{release=r;});hold=gate;return ()=>release();}};
  const snap=data=>({exists:()=>Boolean(data),data:()=>data});
  const store=new Map();
  const sdk={
    doc:(_fs,...parts)=>({path:parts.join("/")}),
    serverTimestamp:()=>"server-time",
    runTransaction:async(_fs,fn)=>{
      const sets=[];
      const tx={get:async ref=>{log.reads+=1;if(hold){const gate=hold;hold=null;await gate;}return snap(store.get(ref.path)||null);},set:(ref,data)=>{sets.push([ref.path,data]);}};
      const out=await fn(tx);
      for(const [p,d] of sets){store.set(p,d);log.writes.push(p);}
      return out;
    },
    onSnapshot:(_ref,_opts,_next,_error)=>{log.listeners+=1;return ()=>{log.stopped+=1;};}
  };
  window.__sq.io={sdk,firestore:{},rivalryId:rid};
  window.readStorageValue=key=>{try{return window.sessionStorage.getItem(key);}catch(_e){return null;}};
  window.writeStorageValue=(key,value)=>{try{window.sessionStorage.setItem(key,value);}catch(_e){}};
  window.navigateTo=async id=>{log.navigations.push(id);return true;};
  window.showScreen=id=>{log.screens.push(id);for(const s of document.querySelectorAll(".screen"))s.classList.toggle("hidden",s.id!==id);};
  window.showAppNotice=text=>{log.notices.push(text);};
  window.refreshMainMenuExperience=()=>{};
  // Terminal Close's own leave-for-Home function, as shipped.
  window.__sq.leave=new Function("root",`${leave}\nreturn ptcLeaveEndedShowdown;`)(window);
}

(async()=>{
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  let browser=null;
  try{
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=="--single-process")});
    const scripts=["data/fifa17Players.js","data/rosterSquads.js","js/squadSheet.js","js/squadScreen.js","js/squadSheetStep.js"].map(read);
    const clubs=await (async()=>{
      const Players=require(path.join(ROOT,"data/fifa17Players.js"));
      const keys=Object.keys(Players.clubs).sort();return {playerOne:keys[0],playerTwo:keys[1]};
    })();
    const fresh=async()=>{
      const page=await browser.newPage({viewport:{width:390,height:844}});
      page.on("pageerror",error=>{throw error;});
      await page.setContent(SHELL);
      await page.evaluate(pageSetup,{rid:RID,leave:leaveMatch[0]});
      for(const content of scripts)await page.addScriptTag({content});
      return page;
    };
    // Starts the Squad screen on Nik's phone; resolves when it is drawn (or, with drawn:false, as soon as it started).
    const start=async(page,stage,{drawn=true}={})=>{
      await page.evaluate(({RID,clubs,stage})=>{
        const ctx={rivalryId:RID,managerRole:"playerTwo",season:1,stage,seasons:3,clubs,special:null,
          verdicts:async()=>({ok:true,verdicts:{playerOne:[],playerTwo:[]},hits:{playerOne:{fired:false},playerTwo:{fired:false}}})};
        window.__sq.result=null;
        window.__sq.run=window.CareerModeSquadSheetStep.run(ctx,window.__sq.io).then(go=>{window.__sq.result=go;return go;});
      },{RID,clubs,stage});
      if(drawn)await page.waitForSelector("#sqStage .sqmBtn.is-primary",{timeout:10000});
    };
    const state=page=>page.evaluate(()=>({
      stage:Boolean(document.getElementById("sqStage")),
      loading:(()=>{const el=document.getElementById("loadingScreen");return Boolean(el&&!el.hidden&&!el.classList.contains("hidden")&&el.getAttribute("aria-busy")==="true");})(),
      result:window.__sq.result,
      home:!document.getElementById("mainMenu").classList.contains("hidden"),
      log:JSON.parse(JSON.stringify(window.__sq.log))
    }));
    const endShowdown=(page,rid=RID)=>page.evaluate(rid=>window.__sq.leave(rid),rid);
    const settle=page=>page.waitForTimeout(400);
    const lock=page=>page.click("#sqStage .sqmBtn.is-primary");

    // TC-1
    {
      const page=await fresh();
      await start(page,"pre");
      const before=await state(page);
      assert.equal(before.stage,true);assert.equal(before.log.writes.length,0);
      // Keep a handle on the LOCK button to tap it after the close (a tap that was on its way).
      await page.evaluate(()=>{window.__sq.lockButton=document.querySelector("#sqStage .sqmBtn.is-primary");});
      await endShowdown(page);await settle(page);
      const after=await state(page);
      assert.equal(after.stage,false,"TC-1 the Squad stage is taken down when the Showdown was ended (it stayed on top of Home on 64e01891)");
      assert.equal(after.home,true,"TC-1 Showdown Home shows");
      assert.equal(after.loading,false,"TC-1 no loading screen is left up");
      assert.equal(after.result,false,"TC-1 the run resolves false: the next screen stays shut");
      assert.deepEqual(after.log.navigations,[],"TC-1 the Squad step adds no navigation of its own (Terminal Close showed Home)");
      assert.equal(after.log.notices.length,1,"TC-1 Terminal Close's notice shows once");
      await page.evaluate(()=>window.__sq.lockButton.click());await settle(page);
      const tapped=await state(page);
      assert.deepEqual(tapped.log.writes,[],"TC-1 a LOCK tap on the gone screen writes nothing");
      assert.equal(tapped.log.reads,before.log.reads,"TC-1 and reads nothing");
      await page.close();
      ok("TC-1 pre, nothing locked: END SHOWDOWN takes the Squad stage down, no write, no extra navigation, LOCK sends nothing");
    }
    // TC-2
    {
      const page=await fresh();
      await start(page,"pre");
      await lock(page);
      await page.waitForFunction(()=>window.__sq.log.listeners===1,null,{timeout:10000});
      const locked=await state(page);
      assert.equal(locked.log.writes.length,1,"TC-2 LOCK wrote this manager's squad once");
      await endShowdown(page);await settle(page);
      const after=await state(page);
      assert.equal(after.stage,false,"TC-2 the stage is gone");
      assert.equal(after.log.stopped,1,"TC-2 the rival listener stops");
      assert.equal(after.log.writes.length,1,"TC-2 nothing more is written");
      assert.equal(after.log.reads,locked.log.reads,"TC-2 nothing more is read");
      assert.equal(after.result,false);
      await page.close();
      ok("TC-2 pre, locked and waiting for the rival: the rival listener stops, nothing more is read or written");
    }
    // TC-3
    {
      const page=await fresh();
      await page.evaluate(()=>window.showScreen("transferChallenge"));
      await start(page,"post");
      assert.equal(await page.getAttribute("#sqStage","data-stage"),"post");
      await endShowdown(page);await settle(page);
      const after=await state(page);
      assert.equal(after.stage,false,"TC-3 the post stage is gone");
      assert.equal(after.home,true);assert.equal(after.result,false);assert.deepEqual(after.log.writes,[]);
      await page.close();
      ok("TC-3 post (after the Transfer War): the stage goes the same way, nothing written");
    }
    // TC-4
    {
      const page=await fresh();
      await start(page,"pre");
      await page.evaluate(()=>{window.__sq.release=window.__sq.holdNextRead();});
      await lock(page);
      await page.waitForFunction(()=>document.querySelector("#sqStage .sqmBtn.is-primary")?.getAttribute("aria-busy")==="true",null,{timeout:5000});
      await endShowdown(page);
      await page.evaluate(()=>window.__sq.release());await settle(page);
      const after=await state(page);
      assert.equal(after.stage,false,"TC-4 the stage is gone");
      assert.deepEqual(after.log.writes,[],"TC-4 the LOCK whose read was in flight sets nothing");
      assert.equal(after.log.listeners,0,"TC-4 no rival listener starts");
      assert.equal(after.result,false);
      await page.close();
      ok("TC-4 a LOCK in flight when the Showdown ends sets nothing and starts no listener");
    }
    // TC-5
    {
      const page=await fresh();
      await page.evaluate(()=>{window.__sq.release=window.__sq.holdNextRead();});
      await start(page,"pre",{drawn:false});
      await page.waitForFunction(()=>window.__sq.log.reads===1,null,{timeout:10000});
      const loading=await state(page);
      assert.equal(loading.loading,true,"TC-5 the squad is loading");
      await endShowdown(page);
      await page.evaluate(()=>window.__sq.release());await settle(page);
      const after=await state(page);
      assert.equal(after.stage,false,"TC-5 no Squad screen is drawn after the end");
      assert.equal(after.loading,false,"TC-5 the loading screen goes");
      assert.equal(after.result,false);assert.deepEqual(after.log.writes,[]);
      await page.close();
      ok("TC-5 ended while the squad was loading: nothing is drawn after it, the loading screen goes");
    }
    // TC-6
    {
      const page=await fresh();
      await start(page,"pre");
      await page.evaluate(OTHER=>window.CareerModeSquadSheetStep.end(OTHER),OTHER);await settle(page);
      const after=await state(page);
      assert.equal(after.stage,true,"TC-6 another Showdown's end leaves this stage up");
      assert.equal(after.result,null,"TC-6 and its screen open");
      await page.evaluate(()=>window.CareerModeSquadSheetStep.close());
      assert.match(tcSource,/ptcLeaveEndedShowdown\(state\.rivalryId\|\|request\.rivalryId\)/,"TC-6 Terminal Close passes the ended rivalry to its leave-for-Home");
      await page.close();
      ok("TC-6 only the ended Showdown's stage goes; Terminal Close passes that rivalry");
    }
    // TC-7
    {
      const page=await fresh();
      await page.evaluate(()=>window.showScreen("mainMenu"));
      await start(page,"pre");
      await endShowdown(page);await settle(page);
      const after=await state(page);
      assert.equal(after.stage,false,"TC-7 the stage goes also when Home already shows under it");
      assert.equal(after.result,false);
      await page.close();
      ok("TC-7 Terminal Close takes the stage down also when Home already shows under it");
    }
    console.log(`r91-squad-terminal-close: ${passed} checks passed`);
  }finally{if(browser)await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
