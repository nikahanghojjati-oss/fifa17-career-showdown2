const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const {resolveChromiumRuntime}=require("../support/chromium-runtime.cjs");

const baseUrl=new URL(process.env.CMS_BASE_URL||"http://127.0.0.1:4173/");

function setupState({phase,revision,leagueId=null,clubs=null,totalSeasons=null,confirmedRoles=[]}={}){
  return {schemaVersion:1,bindingHash:"sha256:"+"1".repeat(64),catalogHash:"sha256:"+"2".repeat(64),coordinatorRole:"playerOne",phase,revision,leagueId,clubs,totalSeasons,confirmedRoles,receipts:[],contentHash:"sha256:"+"3".repeat(64)};
}

async function prepare(page,{managerRole,remoteRole,initialSetup}){
  await page.goto(baseUrl.href,{waitUntil:"domcontentloaded"});
  await page.locator("#loadingScreen").waitFor({state:"hidden",timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==="function"&&typeof window.loadRuntimeScript==="function",null,{timeout:12000});
  await page.evaluate(async({managerRole,remoteRole,initialSetup})=>{
    sessionStorage.setItem("careerModeShowdown.sharedJourneyPending.v1","1");
    window.CareerModeProductionSharedJourneyEntry={isPending:()=>true};
    window.isReducedClubMotionPreferred=()=>true;
    await ensureGameplayModules();
    let serverSetup=initialSetup;
    let current={status:"ready",open:false,busy:false,ready:true,revision:serverSetup?serverSetup.revision:0,phase:serverSetup?serverSetup.phase:null,rivalryId:"pair_"+"a".repeat(64),sessionId:"session_"+"b".repeat(64),accountId:managerRole==="playerOne"?"account_one":"account_two",deviceId:managerRole==="playerOne"?"device_"+"1".repeat(32):"device_"+"2".repeat(32),managerRole,remoteRole,setup:serverSetup,message:"ready"};
    const listeners=new Set();
    const emit=()=>{current={...current,revision:serverSetup?serverSetup.revision:0,phase:serverSetup?serverSetup.phase:null,setup:serverSetup};for(const listener of listeners)listener(current);};
    window.__setSharedServerSetup=value=>{serverSetup=value;};
    window.CareerModeProductionSharedShowdownSetup={
      getState:()=>current,
      subscribe(listener){listeners.add(listener);listener(current);return()=>listeners.delete(listener);},
      async refresh(){emit();return {ok:true};},
      async mutate(type,extra={}){
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
  },{managerRole,remoteRole,initialSetup});
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const host=await hostContext.newPage();
  const peer=await peerContext.newPage();
  const errors=[];host.on("pageerror",e=>errors.push(`host: ${e.message}`));peer.on("pageerror",e=>errors.push(`peer: ${e.message}`));
  try{
    await prepare(host,{managerRole:"playerOne",remoteRole:"host",initialSetup:null});
    assert.equal(await host.locator("#leagueWheelScreen").isVisible(),true,"Player 1 must enter the real League Wheel screen.");
    await host.locator("#spinLeague").click();
    await host.waitForFunction(()=>document.getElementById("leagueWheelScreen")?.dataset.sharedLeagueWitnessed==="laliga",null,{timeout:5000});
    assert.equal(await host.locator("#leagueWheelScreen").isVisible(),true,"Player 1 must remain on League Wheel to witness the authoritative result.");
    assert.equal(await host.locator("#selectedLeague").textContent(),"LaLiga");
    await host.locator("#spinLeague").click();
    await host.locator("#clubWheelScreen").waitFor({state:"visible",timeout:5000});
    await host.locator("#openClubPack").click();
    await host.waitForFunction(()=>Boolean(document.getElementById("clubWheelScreen")?.dataset.sharedClubPacksWitnessed),null,{timeout:5000});
    assert.equal(await host.locator("#clubNameOne").textContent(),"Osasuna");
    assert.equal(await host.locator("#clubNameTwo").textContent(),"Espanyol");
    assert.equal(await host.locator("#clubWheelScreen").getAttribute("data-shared-presentation-role"),"playerOne");

    const peerLateSetup=setupState({phase:"CLUB_ASSIGNMENTS_COMMITTED",revision:3,leagueId:"laliga",clubs:{playerOne:"Osasuna",playerTwo:"Espanyol"}});
    await prepare(peer,{managerRole:"playerTwo",remoteRole:"peer",initialSetup:peerLateSetup});
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
    assert.deepEqual(errors,[],"Polished two-role presentation emitted page errors.");
    process.stdout.write("PASS Shared Showdown polished presentation: Player 1 and Player 2 each witness the real League Wheel and original two-pack club reveal, including late peer authority, while provider state remains authoritative.\n");
  }finally{
    await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
