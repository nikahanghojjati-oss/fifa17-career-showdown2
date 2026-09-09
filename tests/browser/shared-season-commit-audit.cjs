const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('7'.repeat(64));
const sessionId='session_'+('6'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const resultOne={leaguePosition:1,leaguePoints:96,leagueGoals:101,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};
const resultTwo={leaguePosition:3,leaguePoints:84,leagueGoals:79,domesticCup:false,championsLeague:true,topScorer:false,topAssist:true};
const server={revision:0,acknowledgedRoles:[],calls:[],staleInjected:false};

function projection(role){
  if(server.revision===0)return {ok:true,committed:false,ready:true,managerRole:role,seasonNumber:1,phase:'RESULTS_READY',revision:0,results:{playerOne:resultOne,playerTwo:resultTwo},coordinatorRole:'playerOne'};
  const phase=server.revision===3?'ACKNOWLEDGED':'COMMITTED';
  return {ok:true,committed:true,ready:true,coordinatorRole:'playerOne',schemaVersion:1,runtimeRevision:'1.9.1-r10',seasonNumber:1,phase,revision:server.revision,resultsRevision:2,resultsContentHash:'sha256:'+('a'.repeat(64)),results:{playerOne:resultOne,playerTwo:resultTwo},managerRole:role,ownAcknowledged:server.acknowledgedRoles.includes(role),acknowledgedRoles:[...server.acknowledgedRoles]};
}
function mutate(type,{role,baseRevision,operationId}){
  server.calls.push({type,role,baseRevision,operationId});
  if(type==='commit'){
    if(role!=='playerOne')return {ok:false,code:'SEASON_COMMIT_COORDINATOR_REQUIRED'};
    if(server.revision!==0)return {ok:false,code:'SEASON_COMMIT_ALREADY_COMMITTED'};
    if(baseRevision!==0)return {ok:false,code:'SEASON_COMMIT_STALE_BASE_REVISION'};
    server.revision=1;return projection(role);
  }
  if(type==='acknowledge'&&role==='playerTwo'&&!server.staleInjected){server.staleInjected=true;return {ok:false,code:'SEASON_COMMIT_STALE_BASE_REVISION'};}
  if(server.revision<1)return {ok:false,code:'SEASON_COMMIT_NOT_COMMITTED'};
  if(baseRevision!==server.revision)return {ok:false,code:'SEASON_COMMIT_STALE_BASE_REVISION'};
  if(server.acknowledgedRoles.includes(role))return {ok:false,code:'SEASON_COMMIT_ROLE_ALREADY_ACKNOWLEDGED'};
  server.acknowledgedRoles.push(role);server.revision+=1;return projection(role);
}
async function exposeServer(page){
  await page.exposeFunction('__ssjrCommitAuditRead',role=>projection(role));
  await page.exposeFunction('__ssjrCommitAuditMutate',(type,payload)=>mutate(type,payload));
}
async function prepare(page,{role,saveId}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function'&&typeof window.navigateTo==='function',null,{timeout:12000});
  await page.evaluate(async({role,saveId,rivalryId,sessionId,canonicalKeys,resultOne,resultTwo})=>{
    await ensureGameplayModules();
    currentShowdown={id:saveId,currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},managers:{playerOne:'Nik',playerTwo:'Daniel'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};
    const setup={status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo']}};
    const transfer={ok:true,revision:7,seasonNumber:1,managerRole:role,rivalryId,setup:setup.setup,state:{phase:'COMPLETED',revision:7,guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']}};
    const readyResults={ok:true,revision:2,state:{phase:'RESULTS_READY',revision:2,publishedRoles:['playerOne','playerTwo']},managerRole:role,seasonNumber:1,ownResult:role==='playerOne'?resultOne:resultTwo,opponentResult:role==='playerOne'?resultTwo:resultOne,allResults:{playerOne:resultOne,playerTwo:resultTwo}};
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedTransferChallenge={getState:()=>transfer,refresh:async()=>transfer};
    window.CareerModeSparkSharedSeasonResults={read:async()=>readyResults,publishResult:async()=>({ok:false,code:'AUDIT_RESULTS_ALREADY_READY'})};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role==='playerOne'?'account_one':'account_two'}},firestore:{},firestoreSdk:{}})};
    await loadRuntimeScript('ssjr-r10-audit-results','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    CareerModeProductionSharedSeasonResults.install();
    const opened=await CareerModeProductionSharedSeasonResults.open();if(!opened)throw new Error('r9 Shared Season Results did not open for r10 audit.');
    window.CareerModeSparkSharedSeasonCommit={
      read:async()=>window.__ssjrCommitAuditRead(role),
      commitSeason:async options=>window.__ssjrCommitAuditMutate('commit',{role,baseRevision:options.baseRevision,operationId:options.operationId}),
      acknowledgeSeason:async options=>window.__ssjrCommitAuditMutate('acknowledge',{role,baseRevision:options.baseRevision,operationId:options.operationId})
    };
    await loadRuntimeScript('ssjr-r10-audit-adapter','js/productionSharedSeasonCommit.js',()=>window.CareerModeProductionSharedSeasonCommit);
    CareerModeProductionSharedSeasonCommit.install();await CareerModeProductionSharedSeasonCommit.refresh();
    window.__ssjrCommitAudit={storageBefore:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),localState:()=>({selectedLeague:currentShowdown.selectedLeague,clubs:structuredClone(currentShowdown.clubs),transferChallenges:structuredClone(currentShowdown.transferChallenges),rounds:structuredClone(currentShowdown.rounds),score:structuredClone(currentShowdown.score)}),refresh:()=>CareerModeProductionSharedSeasonCommit.refresh(),state:()=>CareerModeProductionSharedSeasonCommit.getState()};
  },{role,saveId,rivalryId,sessionId,canonicalKeys,resultOne,resultTwo});
  await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
  await page.locator('#seasonReviewPanel').waitFor({state:'visible',timeout:5000});
  await page.locator('#sharedSeasonCommitAction').waitFor({state:'visible',timeout:5000});
}
async function refresh(page){await page.evaluate(()=>window.__ssjrCommitAudit.refresh());}
const unchanged={selectedLeague:null,clubs:{playerOne:null,playerTwo:null},transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}};

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1280,height:800}}),peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const host=await hostContext.newPage(),peer=await peerContext.newPage(),errors=[];host.on('pageerror',error=>errors.push(`host: ${error.message}`));peer.on('pageerror',error=>errors.push(`peer: ${error.message}`));
  await exposeServer(host);await exposeServer(peer);
  try{
    await prepare(host,{role:'playerOne',saveId:'shared_commit_host'});await prepare(peer,{role:'playerTwo',saveId:'shared_commit_peer'});
    assert.equal(await host.locator('#seasonReviewOne').isVisible(),true);assert.equal(await host.locator('#seasonReviewTwo').isVisible(),true,'coordinator must experience the complete shared Season Review before commit');
    assert.equal(await peer.locator('#seasonReviewOne').isVisible(),true);assert.equal(await peer.locator('#seasonReviewTwo').isVisible(),true,'peer must experience the same complete shared Season Review before commit');
    assert.equal(await host.locator('#sharedSeasonCommitAction').textContent(),'COMMIT SHARED SEASON');assert.equal(await host.locator('#sharedSeasonCommitAction').isEnabled(),true);
    assert.equal(await peer.locator('#sharedSeasonCommitAction').textContent(),'WAITING FOR COORDINATOR');assert.equal(await peer.locator('#sharedSeasonCommitAction').isDisabled(),true,'non-coordinator must not create the commit');
    await host.locator('#sharedSeasonCommitAction').click();await host.waitForFunction(()=>document.getElementById('sharedSeasonCommitAction')?.textContent==='ACKNOWLEDGE SHARED SEASON',null,{timeout:5000});
    assert.equal(server.revision,1);assert.equal(server.calls.filter(call=>call.type==='commit').length,1);
    await refresh(peer);assert.equal(await peer.locator('#sharedSeasonCommitAction').textContent(),'ACKNOWLEDGE SHARED SEASON');assert.equal(await peer.locator('#sharedSeasonCommitAction').isEnabled(),true);
    await host.locator('#sharedSeasonCommitAction').click();await host.waitForFunction(()=>/ACKNOWLEDGED/.test(document.getElementById('sharedSeasonCommitAction')?.textContent||''),null,{timeout:5000});assert.equal(server.revision,2);
    await peer.locator('#sharedSeasonCommitAction').click();await peer.waitForFunction(()=>document.getElementById('sharedSeasonCommitAction')?.textContent==='SEASON COMMIT ACKNOWLEDGED ✓',null,{timeout:5000});assert.equal(server.revision,3);assert.deepEqual(server.acknowledgedRoles,['playerOne','playerTwo']);
    const peerAckCalls=server.calls.filter(call=>call.type==='acknowledge'&&call.role==='playerTwo');assert.equal(peerAckCalls.length,2,'peer acknowledgement must retry exactly once after injected stale CAS');
    await refresh(host);assert.equal(await host.locator('#sharedSeasonCommitAction').textContent(),'SEASON COMMIT ACKNOWLEDGED ✓');assert.match(await host.locator('#sharedSeasonCommitStatus').textContent(),/SCORING REMAINS LOCKED/);assert.match(await peer.locator('#sharedSeasonCommitStatus').textContent(),/SCORING REMAINS LOCKED/);
    for(const page of [host,peer]){assert.deepEqual(await page.evaluate(()=>window.__ssjrCommitAudit.storageAfter()),await page.evaluate(()=>window.__ssjrCommitAudit.storageBefore),'r10 shared commit must not mutate canonical local storage');assert.deepEqual(await page.evaluate(()=>window.__ssjrCommitAudit.localState()),unchanged,'r10 shared commit must not mutate local setup, transfer, history or scoring authority');}
    assert.deepEqual(errors,[],'Shared Season Commit browser audit emitted page errors.');
    process.stdout.write('PASS Shared Season Commit desktop/mobile production flow: both managers experience the complete r9 Season Review; only the coordinator creates the immutable shared commit; both managers independently acknowledge it; one injected stale CAS is retried exactly once; both converge on terminal ACKNOWLEDGED; shared scoring remains locked; and canonical local storage/history/scoring stay untouched.\n');
  }finally{await hostContext.close().catch(()=>{});await peerContext.close().catch(()=>{});await browser.close().catch(()=>{});}
})().catch(error=>{console.error(error);process.exitCode=1;});