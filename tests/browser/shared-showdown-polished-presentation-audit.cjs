const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

function setupState({phase,revision,leagueId=null,clubs=null,totalSeasons=null,confirmedRoles=[]}={}){
  return {schemaVersion:1,bindingHash:"sha256:"+"1".repeat(64),catalogHash:"sha256:"+"2".repeat(64),coordinatorRole:"playerOne",phase,revision,leagueId,clubs,totalSeasons,confirmedRoles,receipts:[],contentHash:"sha256:"+"3".repeat(64)};
}

async function prepare(page,{managerRole,remoteRole,initialSetup,reducedMotion=true,totalRounds=5,providerDelayMs=0}){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==="function"&&typeof window.loadRuntimeScript==="function",null,{timeout:12000});
  // This proof owns the already-authorized Shared Showdown presentation subsystem, not the new
  // normal-play sign-in gate. Let online identity finish booting, then remove only its visual
  // gate so the fixture below can exercise the presentation contract in isolation.
  await page.waitForFunction(()=>window.CareerModeOnlinePlayerIdentity&&window.CareerModeOnlinePlayerIdentity.getState().initialized===true,null,{timeout:12000}).catch(()=>{});
  await page.evaluate(()=>document.getElementById("onlinePlayerIdentityOverlay")?.remove());
  await page.evaluate(async({managerRole,remoteRole,initialSetup,reducedMotion,totalRounds,providerDelayMs})=>{
    sessionStorage.setItem("careerModeShowdown.sharedJourneyPending.v1","1");
    window.CareerModeProductionSharedJourneyEntry={isPending:()=>true};
    window.isReducedClubMotionPreferred=()=>reducedMotion;
    await ensureGameplayModules();
    currentShowdown={name:"Daniel vs Nik",managers:{playerOne:"Daniel",playerTwo:"Nik"},totalRounds,currentRound:1,status:"Created",selectedLeague:null,clubs:{playerOne:null,playerTwo:null},score:{playerOne:0,playerTwo:0},transferChallenges:[],rounds:[],sharedJourney:{contractVersion:1,mode:"shared",setupPending:true}};
    let serverSetup=initialSetup;
    window.__sharedMutationCounts={open:0,"commit-league":0,"commit-clubs":0,"commit-length":0,confirm:0};
    window.__getSharedMutationCounts=()=>structuredClone(window.__sharedMutationCounts);
    window.__getSharedServerSetup=()=>serverSetup;
    window.__careerStartOpenCount=0;
    window.__careerStartInstallCount=0;
    window.CareerModeProductionSharedCareerStart={
      install(){window.__careerStartInstallCount+=1;return true;},
      async openPanel(){window.__careerStartOpenCount+=1;return true;}
    };
    let current={status:"ready",open:false,busy:false,ready:true,revision:serverSetup?serverSetup.revision:0,phase:serverSetup?serverSetup.phase:null,rivalryId:"pair_5"+"a".repeat(63),sessionId:"session_"+"b".repeat(64),accountId:managerRole==="playerOne"?"account_one":"account_two",deviceId:managerRole==="playerOne"?"device_"+"1".repeat(32):"device_"+"2".repeat(32),managerRole,remoteRole,setup:serverSetup,message:"ready"};
    const listeners=new Set();
    const emit=()=>{current={...current,revision:serverSetup?serverSetup.revision:0,phase:serverSetup?serverSetup.phase:null,setup:serverSetup};for(const listener of listeners)listener(current);};
    window.__setSharedServerSetup=value=>{serverSetup=value;};window.__setSharedReady=value=>{current={...current,ready:Boolean(value)};};window.__setSharedRivalryId=value=>{current={...current,rivalryId:String(value)};};
    window.CareerModeProductionSharedShowdownSetup={
      getState:()=>current,
      subscribe(listener){listeners.add(listener);listener(current);return()=>listeners.delete(listener);},
      async refresh(){emit();return {ok:true};},
      async mutate(type,extra={}){
        window.__sharedMutationCounts[type]=(window.__sharedMutationCounts[type]||0)+1;
        if(providerDelayMs>0)await new Promise(resolve=>setTimeout(resolve,providerDelayMs));
        if(type==="open")serverSetup={schemaVersion:1,bindingHash:"sha256:"+"1".repeat(64),catalogHash:"sha256:"+"2".repeat(64),coordinatorRole:"playerOne",phase:"SHARED_SETUP_OPEN",revision:1,leagueId:null,clubs:null,totalSeasons:null,confirmedRoles:[],receipts:[],contentHash:"sha256:"+"3".repeat(64)};
        else if(type==="commit-league")serverSetup={...serverSetup,phase:"LEAGUE_WHEEL_COMMITTED",revision:2,leagueId:"laliga"};
        else if(type==="commit-clubs")serverSetup={...serverSetup,phase:"CLUB_ASSIGNMENTS_COMMITTED",revision:3,clubs:{playerOne:"Osasuna",playerTwo:"Espanyol"}};
        else if(type==="commit-length")serverSetup={...serverSetup,phase:"SEASON_LENGTH_COMMITTED",revision:4,totalSeasons:extra.totalSeasons};
        else if(type==="confirm"){const roles=[...(serverSetup.confirmedRoles||[])];if(!roles.includes(managerRole))roles.push(managerRole);serverSetup={...serverSetup,phase:roles.length===2?"SHOWDOWN_CONFIRMED":"SEASON_LENGTH_COMMITTED",revision:4+roles.length,confirmedRoles:roles};}
        emit();return {ok:true};
      },
      openPanel(){throw new Error("Engineering panel must not be player-facing in polished audit.");}
    };
    await loadRuntimeScript("ssjr-polished-presentation-audit","js/productionSharedShowdownPresentation.js",()=>window.CareerModeProductionSharedShowdownPresentation);
    CareerModeProductionSharedShowdownPresentation.install();
    await CareerModeProductionSharedShowdownPresentation.activate();
  },{managerRole,remoteRole,initialSetup,reducedMotion,totalRounds,providerDelayMs});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const mismatchContext=await browser.newContext({viewport:{width:940,height:700}});
  const host=await hostContext.newPage();
  const peer=await peerContext.newPage();
  const mismatch=await mismatchContext.newPage();
  const errors=[];host.on("pageerror",e=>errors.push(`host: ${e.message}`));peer.on("pageerror",e=>errors.push(`peer: ${e.message}`));
  try{
    await prepare(host,{managerRole:"playerOne",remoteRole:"host",initialSetup:null,reducedMotion:false,providerDelayMs:180});
    assert.equal(await host.locator("#leagueWheelScreen").isVisible(),true,"Player 1 must enter the real League Wheel screen.");
    const firstSpinButton=host.locator("#spinLeague");
    await firstSpinButton.click({noWaitAfter:true});
    await host.waitForFunction(()=>document.getElementById("spinLeague")?.getAttribute("aria-busy")==="true",null,{timeout:1500});
    assert.equal(await firstSpinButton.isDisabled(),true,"The authoritative league action must disable immediately while provider work is in flight instead of accepting throwaway extra taps.");
    await firstSpinButton.click({force:true,noWaitAfter:true});
    await host.waitForFunction(()=>document.getElementById("leagueWheelScreen")?.dataset.sharedLeagueWitnessed==="laliga",null,{timeout:5000});
    assert.deepEqual(await host.evaluate(()=>window.__getSharedMutationCounts()),{open:1,"commit-league":1,"commit-clubs":0,"commit-length":0,confirm:0},"Rapid repeat taps must coalesce into one open + one league commit.");
    assert.equal(await host.locator("#leagueWheelScreen").isVisible(),true,"Player 1 must remain on League Wheel to witness the authoritative result.");
    assert.equal(await host.locator("#selectedLeague").textContent(),"LaLiga");
    await host.locator("#spinLeague").click();
    await host.locator("#clubWheelScreen").waitFor({state:"visible",timeout:5000});
    assert.equal(await host.locator("#leagueWheelScreen").isVisible(),false,"One Continue to Club Packs click must complete the route; no second tap is allowed.");
    const packButton=host.locator("#openClubPack");
    await packButton.click({noWaitAfter:true});
    await host.waitForFunction(()=>document.getElementById("openClubPack")?.getAttribute("aria-busy")==="true"||document.getElementById("openClubPack")?.classList.contains("hidden"),null,{timeout:1500});
    await packButton.click({force:true,noWaitAfter:true});
    await host.waitForFunction(()=>window.__getSharedMutationCounts()["commit-clubs"]===1,null,{timeout:3000});
    assert.equal((await host.evaluate(()=>window.__getSharedMutationCounts()))["commit-clubs"],1,"Rapid pack taps must create exactly one authoritative club assignment.");
    await host.waitForFunction(()=>Boolean(document.getElementById("clubWheelScreen")?.dataset.sharedClubPacksWitnessed),null,{timeout:6500});
    assert.equal(await host.locator("#clubNameOne").textContent(),"Osasuna");
    assert.equal(await host.locator("#clubNameTwo").textContent(),"Espanyol");
    assert.equal(await host.locator("#clubWheelScreen").getAttribute("data-shared-presentation-role"),"playerOne");
    await host.waitForFunction(()=>window.CareerModeProductionSharedShowdownPresentation.getState().phase==="SEASON_LENGTH_COMMITTED",null,{timeout:5000});
    const hostSeason=await host.evaluate(()=>({provider:window.__getSharedServerSetup()?.totalSeasons,local:currentShowdown?.totalRounds}));
    assert.deepEqual(hostSeason,{provider:5,local:5},"Daniel's original five-season choice must auto-commit after clubs without a second season decision.");
    assert.equal(await host.locator("#sharedShowdownSeasonChoice [data-shared-season]:visible").count(),0,"The shared setup must never show a second season-choice button.");
    assert.match(await host.locator("#sharedShowdownSeasonChoice").innerText(),/5 SEASONS LOCKED/i);

    await host.evaluate(async()=>{
      const setup=window.__getSharedServerSetup();
      window.__setSharedServerSetup({...setup,phase:"SEASON_LENGTH_COMMITTED",revision:5,confirmedRoles:["playerTwo"]});
      await window.CareerModeProductionSharedShowdownPresentation.refresh();
    });
    const careerStartButton=host.locator("#continueClubAssignment");
    await careerStartButton.waitFor({state:"visible",timeout:3000});
    assert.equal(await careerStartButton.textContent(),"CONFIRM SHARED SHOWDOWN");
    await careerStartButton.click();
    await host.waitForFunction(()=>window.__careerStartOpenCount===1,null,{timeout:5000});
    assert.equal((await host.evaluate(()=>window.__getSharedMutationCounts())).confirm,1,"The final manager confirmation must be written exactly once.");
    const careerRoute=await host.evaluate(()=>({opened:window.__careerStartOpenCount,installed:window.__careerStartInstallCount}));
    assert.deepEqual(careerRoute,{opened:1,installed:1},"When the rival already confirmed, one Confirm Shared Showdown click must both finish setup and enter Career Start; no second Continue tap.");

    await host.evaluate(async()=>{
      window.CareerModeProductionSharedShowdownPresentation.activate=window.CareerModeProductionSharedShowdownPresentation.activate;
      window.CareerModeProductionSharedShowdownPresentation.deactivate();
      window.__setSharedRivalryId("pair_5"+"c".repeat(63));
      window.__setSharedServerSetup({schemaVersion:1,bindingHash:"sha256:"+"1".repeat(64),catalogHash:"sha256:"+"2".repeat(64),coordinatorRole:"playerOne",phase:"SHARED_SETUP_OPEN",revision:1,leagueId:null,clubs:null,totalSeasons:null,confirmedRoles:[],receipts:[],contentHash:"sha256:"+"3".repeat(64)});
      await window.CareerModeProductionSharedShowdownPresentation.activate();
    });
    const resetState=await host.evaluate(()=>window.CareerModeProductionSharedShowdownPresentation.getState());
    assert.equal(resetState.leagueWitnessed,null,"A fresh rivalry must not inherit the previous rivalry's league reveal witness.");
    assert.equal(resetState.clubPacksWitnessed,null,"A fresh rivalry must not inherit the previous rivalry's club-pack witness.");
    assert.equal(resetState.clubRevealComplete,false,"A fresh rivalry must not inherit the previous rivalry's completed reveal state.");

    const peerLateSetup=setupState({phase:"CLUB_ASSIGNMENTS_COMMITTED",revision:3,leagueId:"laliga",clubs:{playerOne:"Osasuna",playerTwo:"Espanyol"}});
    await prepare(peer,{managerRole:"playerTwo",remoteRole:"peer",initialSetup:peerLateSetup,reducedMotion:true});
    assert.equal(await peer.locator("#leagueWheelScreen").isVisible(),true,"Player 2 must see League Wheel even when provider authority has already advanced to clubs.");
    await peer.waitForFunction(()=>document.getElementById("leagueWheelScreen")?.dataset.sharedLeagueWitnessed==="laliga",null,{timeout:5000});
    assert.equal(await peer.locator("#selectedLeague").textContent(),"LaLiga");
    assert.equal(await peer.locator("#clubWheelScreen").isVisible(),false,"Player 2 must not skip the League Wheel witness.");
    await peer.locator("#spinLeague").click();
    await peer.locator("#clubWheelScreen").waitFor({state:"visible",timeout:5000});
    await peer.waitForFunction(()=>Boolean(document.getElementById("clubWheelScreen")?.dataset.sharedClubPacksWitnessed),null,{timeout:5000});
    assert.equal(await peer.locator("#clubNameOne").textContent(),"Osasuna");
    assert.equal(await peer.locator("#clubNameTwo").textContent(),"Espanyol");
    assert.equal(await peer.locator("#clubWheelScreen").getAttribute("data-shared-presentation-role"),"playerTwo");
    assert.equal(await peer.locator("#sharedShowdownSeasonChoice [data-shared-season]:visible").count(),0,"Nik must never receive a second season-choice action.");

    const mismatchSetup=setupState({phase:"CLUB_ASSIGNMENTS_COMMITTED",revision:3,leagueId:"laliga",clubs:{playerOne:"Osasuna",playerTwo:"Espanyol"}});
    await prepare(mismatch,{managerRole:"playerOne",remoteRole:"host",initialSetup:mismatchSetup,reducedMotion:true,totalRounds:3});
    await mismatch.waitForFunction(()=>document.getElementById("leagueWheelScreen")?.dataset.sharedLeagueWitnessed==="laliga",null,{timeout:5000});
    await mismatch.locator("#spinLeague").click();
    await mismatch.locator("#clubWheelScreen").waitFor({state:"visible",timeout:5000});
    await mismatch.waitForFunction(()=>Boolean(document.getElementById("clubWheelScreen")?.dataset.sharedClubPacksWitnessed),null,{timeout:5000});
    const mismatchState=await mismatch.evaluate(()=>({phase:window.CareerModeProductionSharedShowdownPresentation.getState().phase,provider:window.__getSharedServerSetup()?.totalSeasons??null,local:currentShowdown?.totalRounds??null}));
    assert.deepEqual(mismatchState,{phase:"CLUB_ASSIGNMENTS_COMMITTED",provider:null,local:3},"A drifted local season must not overwrite the five-season plan encoded in paired authority.");
    assert.match(await mismatch.locator("#sharedShowdownSeasonChoice").innerText(),/SEASON PLAN MISMATCH|recovery/i);
    assert.equal(await mismatch.locator("#sharedShowdownSeasonChoice [data-shared-season]:visible").count(),0,"Season mismatch recovery must not fall back to a second season picker.");

    assert.deepEqual(errors,[],"Polished two-role presentation emitted page errors.");
    process.stdout.write("PASS Shared Showdown polished presentation + bunny click reliability: delayed provider work disables controls immediately, rapid repeat taps coalesce to one authoritative mutation, one Continue click enters club packs, one final confirmation enters Career Start when the rival already confirmed, fresh rivalries reset reveal witnesses, Daniel's original season choice remains authoritative, and both manager roles still witness the real League Wheel and two-pack club reveal.\n");
  }finally{
    await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await mismatchContext.close().catch(()=>{});await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});