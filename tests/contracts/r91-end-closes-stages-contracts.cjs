#!/usr/bin/env node
"use strict";
// E1 (2.4.0, Fable re-check 2 of gameplay/r91 fe4a1d36): Nik's phone on the Russian Roulette result panel, or in the Prime
// Pack, while Daniel taps END SHOWDOWN. Terminal Close saw the Showdown ended and showed Showdown Home with its notice, but the
// roulette panel (or the Prime Pack takeover) stayed on top of Home and covered the notice; I HAVE RELEASED HIM on the left-over
// panel opened the ended Showdown's Career Start, and the Prime Pack ran on to its reveal. Also on the live 2.3.0 code. #1449
// fixed the same for the Squad stage; these stages now end the same way.
//   E1-1 roulette result panel: the ended Showdown takes the panel down at once; the run resolves false without a second
//        navigation (Terminal Close already showed Home); no loading screen; the release is never remembered (no write).
//   E1-2 another Showdown's end leaves a running roulette alone; its BACK still works as before.
//   E1-3 Prime Pack on screen (page ready, this manager arrived, the round watched): the stage goes at once, the watch stops,
//        no arrival or withdraw is written after it, the run resolves false as "went home" (no error line), no navigation.
//   E1-4 Prime Pack "could not load" card: answered by the end at once, stage and card gone, no TRY AGAIN loop.
//   E1-5 Chamber Men: a stage left up is taken down by the end, and the loading screen goes.
//   E1-6 Terminal Close ends all four stages (Squad, Chamber Men, roulette, Prime Pack) with the ended rivalry, also when
//        Home already shows under them.
// Real files in Chromium: js/rosterRouletteStep.js with the real roulette engine and club data, js/iconGuessStep.js with the
// real round logic and Icon list, js/chamberMenStep.js, and Terminal Close's own leave-for-Home function. The two embedded
// pages are stubs served in their place. On fe4a1d36 E1-1 fails (the panel stays).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
let passed=0;const ok=label=>{passed+=1;console.log(`ok ${passed} ${label}`);};

const tcSource=read("js/productionSharedTerminalClose.js");
const leaveMatch=/\n  function ptcLeaveEndedShowdown\([^)]*\)\{[\s\S]*?\n  \}\n/.exec(tcSource);
assert.ok(leaveMatch,"Terminal Close keeps its leave-for-Home function");

const RID="pair_"+"a".repeat(64),OTHER="pair_"+"b".repeat(64);
const BASE="http://e1.test/";
const SCRIPTS=["data/fifa17Players.js","data/rosterSquads.js","js/rosterRoulette.js","data/marqueePlayers.js","js/marqueePlayer.js","js/rosterRouletteStep.js",
  "js/iconGuess.js","data/icons.js","js/iconNames.js","js/iconGuessStep.js","js/chamberMenStep.js"];
const SHELL=`<!doctype html><html><head><meta charset="utf-8"></head><body>
<section id="loadingScreen" class="hidden" hidden><p id="loadingText">LOADING</p></section>
<section id="mainMenu" class="screen hidden">HOME</section>
<section id="dashboard" class="screen">DASHBOARD</section>
<script>
  window.__e1={log:{writes:[],reads:0,listeners:0,stopped:0,navigations:[],screens:[],notices:[],remembered:[]}};
  window.readStorageValue=key=>{try{return window.sessionStorage.getItem(key);}catch(_e){return null;}};
  window.writeStorageValue=(key,value)=>{try{window.sessionStorage.setItem(key,value);}catch(_e){}};
  window.navigateTo=async id=>{window.__e1.log.navigations.push(id);return true;};
  window.showScreen=id=>{window.__e1.log.screens.push(id);for(const s of document.querySelectorAll(".screen"))s.classList.toggle("hidden",s.id!==id);};
  window.showAppNotice=text=>{window.__e1.log.notices.push(text);};
  window.refreshMainMenuExperience=()=>{};
</script>
${SCRIPTS.map(src=>`<script src="${src}"></script>`).join("\n")}
</body></html>`;
// The Prime Pack page: says it is ready as soon as it loads (the real page then draws the round).
const PRIME_PAGE=`<!doctype html><html><body><script>parent.postMessage({type:"cms-ig-ready"},location.origin);</script></body></html>`;
const ROULETTE_PAGE=`<!doctype html><html><body></body></html>`;

function shown(page,selector){return page.evaluate(sel=>{const n=document.querySelector(sel);return Boolean(n&&n.getClientRects().length>0&&getComputedStyle(n).visibility!=="hidden");},selector);}
function loadingShown(page){return page.evaluate(()=>{const n=document.getElementById("loadingScreen");return Boolean(n&&!n.hidden&&!n.classList.contains("hidden"));});}

(async()=>{
  const {chromium}=require("playwright");
  const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");
  let browser=null;
  try{
    const runtime=await resolveChromiumRuntime();
    browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args.filter(arg=>arg!=="--single-process")});
    const fresh=async({primeFails=false}={})=>{
      const context=await browser.newContext({viewport:{width:390,height:844}});
      await context.route(`${BASE}**`,route=>{
        const url=new URL(route.request().url()),file=decodeURIComponent(url.pathname.slice(1));
        if(file==="shell.html")return route.fulfill({status:200,contentType:"text/html",body:SHELL});
        if(file==="visual-assets/v10_1/icon-guess/index.html")return route.fulfill({status:200,contentType:"text/html",body:PRIME_PAGE});
        if(file==="visual-assets/v10_1/roulette/index.html")return route.fulfill({status:200,contentType:"text/html",body:ROULETTE_PAGE});
        if(SCRIPTS.includes(file))return route.fulfill({status:200,contentType:"application/javascript",body:read(file)});
        return route.fulfill({status:404,body:""});
      });
      const page=await context.newPage();
      page.on("pageerror",error=>{throw error;});
      await page.goto(`${BASE}shell.html`);
      await page.waitForFunction(()=>Boolean(window.CareerModeRosterRouletteStep&&window.CareerModeIconGuessStep&&window.CareerModeChamberMenStep&&window.CareerModeIconNames&&window.CareerModeIcons));
      await page.evaluate(({rid,leave,primeFails})=>{
        const log=window.__e1.log;
        // A fake Firestore for the Prime Pack: counts reads, writes and listeners.
        const store=new Map(),snap=data=>({exists:()=>Boolean(data),data:()=>data,metadata:{}});
        window.__e1.io={firestore:{},rivalryId:rid,sessionId:"s1",deviceId:"d1",now:()=>Date.now(),
          sdk:{doc:(_fs,...parts)=>({path:parts.join("/")}),serverTimestamp:()=>({server:true}),
            runTransaction:async(_fs,fn)=>{if(primeFails)throw Object.assign(new Error("unavailable"),{code:"unavailable"});const sets=[];const tx={get:async ref=>{log.reads+=1;return snap(store.get(ref.path)||null);},set:(ref,data)=>sets.push([ref.path,data]),update:(ref,data)=>sets.push([ref.path,{...(store.get(ref.path)||{}),...data}])};const out=await fn(tx);for(const [p,d] of sets){store.set(p,d);log.writes.push(p);}return out;},
            onSnapshot:(_ref,_opts,_next)=>{log.listeners+=1;window.__e1.push=_next;return ()=>{log.stopped+=1;};}}};
        window.__e1.leave=new Function("root",`${leave}\nreturn ptcLeaveEndedShowdown;`)(window);
        window.__e1.rrCtx=season=>{
          const keys=Object.keys(window.CareerModeFifa17Players.clubs).filter(k=>window.CareerModeRosterRoulette.board(k)).sort();
          return {rivalryId:rid,managerRole:"playerTwo",season,clubs:{playerOne:keys[0],playerTwo:keys[1]},confirmedAtMs:Date.now(),phase:"NOT_STARTED",marks:null,windowStarted:false,
            remember:outcome=>{log.remembered.push(outcome);},verdicts:async()=>({ok:true,verdicts:{playerOne:[],playerTwo:[]},hits:null})};
        };
      },{rid:RID,leave:leaveMatch[0],primeFails});
      return {page,context};
    };
    // The roulette with its scene already watched on this phone: straight to this season's result panel.
    const rouletteToPanel=async page=>{
      await page.evaluate(()=>{
        const step=window.CareerModeRosterRouletteStep,ctx=window.__e1.rrCtx(1);
        window.writeStorageValue(step.watchedKey,JSON.stringify([`${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`]));
        window.__e1.rr={settled:false,go:null};
        step.runBeforeTransfers(ctx).then(go=>{window.__e1.rr={settled:true,go};});
      });
      await page.waitForFunction(()=>Boolean(document.querySelector("#rrStepPanel .rrStepPrimary")),null,{timeout:20000});
    };

    // E1-1
    {
      const {page,context}=await fresh();
      await rouletteToPanel(page);
      const heading=await page.evaluate(()=>document.querySelector("#rrStepPanel .rrStepTitle")?.textContent||"");
      assert.ok(/Release|Your squad is safe/.test(heading),`fixture: the roulette result panel is up (${heading})`);
      const done=await page.evaluate(rid=>window.CareerModeRosterRouletteStep.end?.(rid)??"no end()",RID);
      assert.equal(done,true,"E1-1 the roulette step ends for the ended Showdown (on fe4a1d36 it has no end and the panel stays)");
      await page.waitForFunction(()=>window.__e1.rr.settled,null,{timeout:5000});
      assert.equal(await shown(page,"#rrStepPanel"),false,"E1-1 the result panel is gone");
      assert.equal(await shown(page,"#rrStage"),false,"E1-1 no roulette stage");
      await page.waitForTimeout(400);
      assert.equal(await loadingShown(page),false,"E1-1 no loading screen over Home");
      const state=await page.evaluate(()=>({rr:window.__e1.rr,log:window.__e1.log,active:window.CareerModeRosterRouletteStep.active(),wentHome:window.CareerModeRosterRouletteStep.wentHome()}));
      assert.equal(state.rr.go,false,"E1-1 the run resolves false (the Transfer War never opens)");
      assert.deepEqual(state.log.navigations,[],"E1-1 no second navigation (Terminal Close already showed Home)");
      assert.deepEqual(state.log.remembered,[],"E1-1 the release is never remembered (no write after the end)");
      assert.equal(state.active,false,"E1-1 the roulette no longer counts as on screen");
      assert.equal(state.wentHome,true,"E1-1 read as the way home, so the dashboard shows no error line");
      ok("E1-1 roulette result panel: down at once, run false, no navigation, no loading screen, nothing remembered");
      await context.close();
    }
    // E1-2
    {
      const {page,context}=await fresh();
      await rouletteToPanel(page);
      const done=await page.evaluate(rid=>window.CareerModeRosterRouletteStep.end(rid),OTHER);
      assert.equal(done,false,"E1-2 another Showdown's end is refused");
      assert.equal(await shown(page,"#rrStepPanel"),true,"E1-2 this Showdown's panel stays");
      await page.locator("#rrStepPanel button",{hasText:"BACK TO SHOWDOWN HOME"}).click();
      await page.waitForFunction(()=>window.__e1.rr.settled,null,{timeout:5000});
      await page.waitForTimeout(300);
      const state=await page.evaluate(()=>({rr:window.__e1.rr,log:window.__e1.log}));
      assert.equal(state.rr.go,false);
      assert.deepEqual(state.log.navigations,["mainMenu"],"E1-2 BACK TO SHOWDOWN HOME still opens Home, as before");
      assert.equal(await shown(page,"#rrStepPanel"),false);
      ok("E1-2 another Showdown's end leaves the roulette alone; BACK works as before");
      await context.close();
    }
    // E1-3
    {
      const {page,context}=await fresh();
      await page.evaluate(()=>{
        const step=window.CareerModeIconGuessStep,ctx={rivalryId:window.__e1.io.rivalryId,managerRole:"playerTwo",season:1,confirmedAtMs:Date.now()};
        window.__e1.ig={settled:false,go:null};
        if(!step.applies(ctx))throw new Error("fixture: the Prime Pack applies");
        step.run(ctx,window.__e1.io).then(go=>{window.__e1.ig={settled:true,go};});
      });
      await page.waitForFunction(()=>window.__e1.log.listeners===1&&window.__e1.log.writes.length===1,null,{timeout:15000});
      assert.equal(await shown(page,"#igStage"),true,"fixture: the Prime Pack is on screen, this manager arrived and watches the round");
      const done=await page.evaluate(rid=>window.CareerModeIconGuessStep.end?.(rid)??"no end()",RID);
      assert.equal(done,true,"E1-3 the Prime Pack step ends for the ended Showdown");
      await page.waitForFunction(()=>window.__e1.ig.settled,null,{timeout:5000});
      assert.equal(await shown(page,"#igStage"),false,"E1-3 the Prime Pack takeover is gone");
      assert.equal(await shown(page,"#igStepPanel"),false);
      // A late round record and the phone going away and back write nothing now.
      await page.evaluate(()=>{window.__e1.push?.({exists:()=>true,data:()=>null,metadata:{}});document.dispatchEvent(new Event("visibilitychange"));});
      await page.waitForTimeout(700);
      const state=await page.evaluate(()=>({ig:window.__e1.ig,log:window.__e1.log,wentHome:window.CareerModeIconGuessStep.wentHome()}));
      assert.equal(state.ig.go,false,"E1-3 the run resolves false (the Transfer War never opens)");
      assert.equal(state.log.stopped,1,"E1-3 the round watch stops");
      assert.equal(state.log.writes.length,1,"E1-3 no arrival or withdraw is written after the end");
      assert.deepEqual(state.log.navigations,[],"E1-3 no second navigation");
      assert.equal(state.wentHome,true,"E1-3 read as the way home, so the dashboard shows no error");
      ok("E1-3 Prime Pack on screen: down at once, watch stopped, nothing written after, no navigation");
      await context.close();
    }
    // E1-4
    {
      const {page,context}=await fresh({primeFails:true});
      await page.evaluate(()=>{
        const step=window.CareerModeIconGuessStep,ctx={rivalryId:window.__e1.io.rivalryId,managerRole:"playerTwo",season:1,confirmedAtMs:Date.now()};
        window.__e1.ig={settled:false,go:null};
        step.run(ctx,window.__e1.io).then(go=>{window.__e1.ig={settled:true,go};});
      });
      await page.waitForFunction(()=>Boolean(document.querySelector("#igStepPanel .rrStepPrimary")),null,{timeout:15000});
      assert.equal(await page.evaluate(rid=>window.CareerModeIconGuessStep.end(rid),RID),true);
      await page.waitForFunction(()=>window.__e1.ig.settled,null,{timeout:5000});
      await page.waitForTimeout(300);
      assert.equal(await shown(page,"#igStepPanel"),false,"E1-4 the card is gone");
      assert.equal(await shown(page,"#igStage"),false,"E1-4 the stage is gone");
      const state=await page.evaluate(()=>({ig:window.__e1.ig,log:window.__e1.log}));
      assert.equal(state.ig.go,false);
      assert.deepEqual(state.log.navigations,[],"E1-4 no second navigation");
      ok("E1-4 Prime Pack could-not-load card: answered by the end, nothing left up");
      await context.close();
    }
    // E1-5 and E1-6
    {
      const {page,context}=await fresh();
      await page.evaluate(()=>{const s=document.createElement("div");s.id="cmStage";s.style.cssText="position:fixed;inset:0;z-index:95;background:#000";document.body.append(s);});
      assert.equal(await page.evaluate(rid=>window.CareerModeChamberMenStep.end?.(rid)??"no end()",RID),true,"E1-5 Chamber Men ends");
      assert.equal(await shown(page,"#cmStage"),false,"E1-5 the Chamber Men stage is gone");
      ok("E1-5 Chamber Men: a stage left up is taken down by the end");
      // E1-6: Terminal Close's own leave-for-Home, with spies on the four steps; Home already showing or not.
      const calls=await page.evaluate(rid=>{
        const seen=[];for(const name of ["CareerModeSquadSheetStep","CareerModeChamberMenStep","CareerModeRosterRouletteStep","CareerModeIconGuessStep"]){const real=window[name]||{};window[name]={...real,end:id=>{seen.push([name,id]);return true;}};}
        window.__e1.leave(rid);
        document.getElementById("mainMenu").classList.remove("hidden");
        window.__e1.leave(rid);
        return seen;
      },RID);
      for(const name of ["CareerModeSquadSheetStep","CareerModeChamberMenStep","CareerModeRosterRouletteStep","CareerModeIconGuessStep"])
        assert.equal(calls.filter(([n,id])=>n===name&&id===RID).length,2,`E1-6 Terminal Close ends ${name} with the ended rivalry, also when Home already shows`);
      ok("E1-6 Terminal Close ends all four stages with the ended rivalry, also when Home already shows");
      await context.close();
    }
    console.log(`PASS r91 end closes stages contracts: ${passed} checks.`);
  }finally{if(browser)await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
