const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const totalSeasons=3;
const rivalryId='pair_'+'a'.repeat(64);

function ids(role,fresh=0){
  const host=role==='playerOne';
  return {
    accountId:host?'account_one':'account_two',
    deviceId:'device_'+(host?'1':'2').repeat(32),
    sessionId:'session_'+(fresh?(host?'3':'4'):(host?'1':'2')).repeat(64),
    terminalSessionId:'session_'+(host?'5':'6').repeat(64)
  };
}

async function suppressAutomaticR14(page){
  await page.route('**/js/ssjr.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.__r14AutomaticBootstrapSuppressed=true;'}));
  await page.addInitScript(()=>{window.getOfflineAppDiagnostics=()=>({isolatedR14Audit:true});});
}

async function prepare(page,{role,accepted=1,withSession=true,fresh=0}){
  await suppressAutomaticR14(page);
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function',null,{timeout:12000});
  const identity=ids(role,fresh);
  return page.evaluate(async({role,accepted,withSession,identity,rivalryId,totalSeasons,canonicalKeys})=>{
    await ensureGameplayModules();
    currentShowdown={
      id:`r14_${role}`,currentRound:9,totalRounds:totalSeasons,status:'Ready',
      sharedJourney:{mode:'shared',rivalryId},
      managers:{playerOne:'Nik',playerTwo:'Daniel'},selectedLeague:null,
      clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}
    };
    window.__r14Role=role;
    window.__r14Identity=identity;
    window.__r14Accepted=accepted;
    window.__r14SetupReads=0;
    window.__r14ProgressionReads=0;
    window.__r14Remote=withSession?{
      sessionState:'active',sessionId:identity.sessionId,rivalryId,accountId:identity.accountId,deviceId:identity.deviceId,pendingAction:null,expiresAtEpochMs:Date.now()+3600000
    }:null;
    const acceptedKey=count=>Array.from({length:count},(_,index)=>`${index+1}:2:sha256:${String(index+1).repeat(64)}`).join('|');
    const multiState=()=>({
      schemaVersion:1,runtimeRevision:'1.9.1-r13',phase:window.__r14Accepted===totalSeasons?'SHOWDOWN_COMPLETE':'SEASON_READY',revision:window.__r14Accepted,
      rivalryId,setupRevision:6,leagueId:'premier_league',totalSeasons,acceptedSeasons:window.__r14Accepted,
      activeSeason:window.__r14Accepted===totalSeasons?null:window.__r14Accepted+1,completedSeason:window.__r14Accepted||null,
      fixedClubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},acceptedRevisionKey:acceptedKey(window.__r14Accepted),terminal:window.__r14Accepted===totalSeasons,
      canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false
    });
    const setup=()=>({phase:'SHOWDOWN_CONFIRMED',revision:6,rivalryId,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons,confirmedRoles:['playerOne','playerTwo']});
    window.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:identity.accountId})};
    window.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:identity.deviceId})};
    window.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId,binding:{managerRole:role}})};
    window.CareerModeSparkRemoteJoining={getState:()=>window.__r14Remote,subscribe:()=>()=>{}};
    window.CareerModeProductionSharedShowdownSetup={
      refresh:async()=>{window.__r14SetupReads+=1;return window.CareerModeProductionSharedShowdownSetup.getState();},
      getState:()=>({ready:true,rivalryId,sessionId:window.__r14Remote?.sessionId||null,setup:setup()})
    };
    window.CareerModeProductionSharedMultiSeasonProgression={
      refresh:async()=>{window.__r14ProgressionReads+=1;return window.CareerModeProductionSharedMultiSeasonProgression.getState();},
      getState:()=>({authoritative:true,rivalryId,state:multiState()})
    };
    const storageBefore=Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]));
    const loadCandidate=path=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.async=false;script.onload=()=>resolve(true);script.onerror=()=>reject(new Error(`Unable to load candidate ${path}`));document.head.appendChild(script);});
    await loadCandidate('js/sharedHistoryConvergence.js');
    await loadCandidate('js/sharedMultiSeasonProgression.js');
    await loadCandidate('js/sharedJourneyReconnect.js');
    await loadCandidate('js/productionSharedJourneyReconnect.js');
    CareerModeProductionSharedJourneyReconnect.install();
    await CareerModeProductionSharedJourneyReconnect.refresh();
    return {identity,storageBefore};
  },{role,accepted,withSession,identity,rivalryId,totalSeasons,canonicalKeys});
}

async function snapshot(page){
  return page.evaluate(canonicalKeys=>{
    const state=CareerModeProductionSharedJourneyReconnect.getState();
    const node=document.getElementById('sharedJourneyReconnectStatus');
    return {
      state,
      statusText:node?.textContent||'',statusPhase:node?.dataset?.recoveryPhase||'',statusAuthoritative:node?.dataset?.authoritative||'',statusHidden:Boolean(node?.classList?.contains('hidden')),
      setupReads:window.__r14SetupReads,progressionReads:window.__r14ProgressionReads,
      storage:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]))
    };
  },canonicalKeys);
}

async function refresh(page){return page.evaluate(()=>CareerModeProductionSharedJourneyReconnect.refresh());}
async function expire(page){
  await page.evaluate(()=>{window.__r14Remote={...window.__r14Remote,expiresAtEpochMs:Date.now()-1};});
  await refresh(page);
}
async function freshSession(page,terminal=false){
  await page.evaluate(({terminal})=>{
    const identity=window.__r14Identity;
    window.__r14Remote={sessionState:'active',sessionId:terminal?identity.terminalSessionId:'session_'+(window.__r14Role==='playerOne'?'3':'4').repeat(64),rivalryId:currentShowdown.sharedJourney.rivalryId,accountId:identity.accountId,deviceId:identity.deviceId,pendingAction:null,expiresAtEpochMs:Date.now()+3600000};
  },{terminal});
  await refresh(page);
}
async function setTerminal(page){await page.evaluate(total=>{window.__r14Accepted=total;},totalSeasons);await refresh(page);}
async function loseSession(page){await page.evaluate(()=>{window.__r14Remote=null;});await refresh(page);}

function assertActive(result,label,{sessionChanged}={}){
  assert.equal(result.state.phase,'ACTIVE_RECOVERED',`${label} must recover active shared state.`);
  assert.equal(result.state.activeAuthorization,true);
  assert.equal(result.state.recovered,true);
  assert.equal(result.state.leagueId,'premier_league');
  assert.deepEqual(result.state.fixedClubs,{playerOne:'Arsenal',playerTwo:'Liverpool'});
  assert.equal(result.state.totalSeasons,totalSeasons);
  assert.equal(result.state.acceptedSeasons,1);
  assert.equal(result.state.activeSeason,2);
  assert.equal(result.statusPhase,'ACTIVE_RECOVERED');
  assert.equal(result.statusAuthoritative,'true');
  assert.equal(result.statusHidden,false);
  assert.match(result.statusText,/SHARED JOURNEY RECOVERED/);
  if(sessionChanged!==undefined)assert.equal(result.state.sessionChanged,sessionChanged);
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  let host=await hostContext.newPage(),peer=await peerContext.newPage();
  const errors=[];
  const watch=(page,label)=>page.on('pageerror',error=>errors.push(`${label}: ${error.message}`));
  watch(host,'host');watch(peer,'peer');
  try{
    const [hostMeta,peerMeta]=await Promise.all([prepare(host,{role:'playerOne'}),prepare(peer,{role:'playerTwo'})]);
    let [hostState,peerState]=await Promise.all([snapshot(host),snapshot(peer)]);
    assertActive(hostState,'host');assertActive(peerState,'peer');
    assert.equal(hostState.state.durableKey,peerState.state.durableKey,'both managers must recover the same durable rivalry state.');

    const hostReadsBeforeOffline={setup:hostState.setupReads,progression:hostState.progressionReads};
    await hostContext.setOffline(true);
    await host.evaluate(()=>window.dispatchEvent(new Event('offline')));
    await refresh(host);
    hostState=await snapshot(host);peerState=await snapshot(peer);
    assert.equal(hostState.state.phase,'OFFLINE_HOLD');
    assert.equal(hostState.state.activeAuthorization,false,'offline manager must never claim ACTIVE authority.');
    assert.equal(hostState.state.acceptedSeasons,1);
    assert.equal(hostState.state.activeSeason,2);
    assert.equal(hostState.setupReads,hostReadsBeforeOffline.setup,'offline refresh must not read Shared Setup provider state.');
    assert.equal(hostState.progressionReads,hostReadsBeforeOffline.progression,'offline refresh must not read progression provider state.');
    assertActive(peerState,'online peer while host is offline');
    await hostContext.setOffline(false);
    await host.evaluate(()=>window.dispatchEvent(new Event('online')));
    await refresh(host);
    assertActive(await snapshot(host),'host after network restore');

    const [hostBeforeExpiry,peerBeforeExpiry]=await Promise.all([snapshot(host),snapshot(peer)]);
    await Promise.all([expire(host),expire(peer)]);
    hostState=await snapshot(host);peerState=await snapshot(peer);
    for(const [label,result,before] of [['host',hostState,hostBeforeExpiry],['peer',peerState,peerBeforeExpiry]]){
      assert.equal(result.state.phase,'FRESH_SESSION_REQUIRED',`${label} expired session must require fresh authority.`);
      assert.equal(result.state.activeAuthorization,false);
      assert.equal(result.state.resumable,true);
      assert.equal(result.state.acceptedSeasons,1);
      assert.equal(result.setupReads,before.setupReads,'expired authority must not read Shared Setup.');
      assert.equal(result.progressionReads,before.progressionReads,'expired authority must not read progression.');
    }
    await Promise.all([freshSession(host),freshSession(peer)]);
    assertActive(await snapshot(host),'host fresh-session re-entry',{sessionChanged:true});
    assertActive(await snapshot(peer),'peer fresh-session re-entry',{sessionChanged:true});

    await Promise.all([host.close(),peer.close()]);
    host=await hostContext.newPage();peer=await peerContext.newPage();watch(host,'host-fresh');watch(peer,'peer-fresh');
    const [hostFreshMeta,peerFreshMeta]=await Promise.all([
      prepare(host,{role:'playerOne',withSession:false}),
      prepare(peer,{role:'playerTwo',withSession:false})
    ]);
    hostState=await snapshot(host);peerState=await snapshot(peer);
    for(const [label,result] of [['host fresh runtime',hostState],['peer fresh runtime',peerState]]){
      assert.equal(result.state.phase,'FRESH_SESSION_REQUIRED',`${label} must not inherit ACTIVE authority from an old page.`);
      assert.equal(result.state.activeAuthorization,false);
      assert.equal(result.state.resumable,false,'fresh page without recovered memory must not invent durable page-memory authority.');
      assert.equal(result.state.acceptedSeasons,null);
    }
    await Promise.all([freshSession(host),freshSession(peer)]);
    assertActive(await snapshot(host),'host fresh runtime after reauthorization',{sessionChanged:false});
    assertActive(await snapshot(peer),'peer fresh runtime after reauthorization',{sessionChanged:false});

    await Promise.all([setTerminal(host),setTerminal(peer)]);
    hostState=await snapshot(host);peerState=await snapshot(peer);
    for(const [label,result] of [['host terminal',hostState],['peer terminal',peerState]]){
      assert.equal(result.state.phase,'TERMINAL_RECOVERED',`${label} must recover terminal state.`);
      assert.equal(result.state.terminal,true);
      assert.equal(result.state.acceptedSeasons,totalSeasons);
      assert.equal(result.state.activeSeason,null);
      assert.equal(result.state.activeAuthorization,true);
      assert.match(result.statusText,/ALL 3 SEASONS REMAIN TERMINAL/);
    }
    const terminalDurable=hostState.state.durableKey;
    await Promise.all([loseSession(host),loseSession(peer)]);
    for(const result of await Promise.all([snapshot(host),snapshot(peer)])){
      assert.equal(result.state.phase,'FRESH_SESSION_REQUIRED');
      assert.equal(result.state.terminal,true,'session loss must preserve terminal durable memory.');
      assert.equal(result.state.activeAuthorization,false);
    }
    await Promise.all([freshSession(host,true),freshSession(peer,true)]);
    hostState=await snapshot(host);peerState=await snapshot(peer);
    for(const [label,result] of [['host terminal re-entry',hostState],['peer terminal re-entry',peerState]]){
      assert.equal(result.state.phase,'TERMINAL_RECOVERED',`${label} must remain terminal after replacement session.`);
      assert.equal(result.state.acceptedSeasons,totalSeasons);
      assert.equal(result.state.activeSeason,null,'terminal re-entry must not create another season.');
      assert.equal(result.state.durableKey,terminalDurable,'terminal durable state must not drift across session replacement.');
    }

    assert.deepEqual((await snapshot(host)).storage,hostFreshMeta.storageBefore,'r14 reconnect must not mutate host canonical local storage.');
    assert.deepEqual((await snapshot(peer)).storage,peerFreshMeta.storageBefore,'r14 reconnect must not mutate peer canonical local storage.');
    assert.deepEqual(errors,[],'Journey Reconnect browser audit emitted page errors.');
    process.stdout.write('PASS Shared Journey Reconnect desktop/mobile audit: both managers independently recover the same durable journey, offline hold makes no provider claim, expiry blocks provider reads, fresh sessions reauthorize without redraw/reset, fresh runtimes do not inherit ACTIVE authority, terminal state cannot resurrect, and canonical local storage remains unchanged.\n');
  }finally{
    await host?.close().catch(()=>{});await peer?.close().catch(()=>{});
    await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
