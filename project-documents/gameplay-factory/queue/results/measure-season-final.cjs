#!/usr/bin/env node
// JOB-1585: report only. Run from the repository root with node <this file>.
// Reuses prepare, enterResults, provider projection and input entry from
// tests/browser/shared-season-results-audit.cjs; the original audit is unchanged.
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawn,execFileSync}=require('node:child_process');
process.env.CMS_CHROMIUM_MULTI_CONTEXT='1';
const ROOT=path.resolve(__dirname,'../../../..');
process.chdir(ROOT);
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../../../../tests/support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const rivalryId='pair_'+('9'.repeat(64));
const sessionId='session_'+('8'.repeat(64));
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const server={revision:0,order:[],results:{},publishes:[],loseAckFor:null};

function otherRole(role){return role==='playerOne'?'playerTwo':'playerOne';}
function projection(role){
  const own=server.results[role]||null;
  const opponent=server.revision===2?server.results[otherRole(role)]||null:null;
  const state=server.revision===0?null:{phase:server.revision===2?'RESULTS_READY':'COLLECTING',revision:server.revision,publishedRoles:[...server.order]};
  const allResults=server.revision===2?{playerOne:server.results.playerOne,playerTwo:server.results.playerTwo}:null;
  return {ok:true,revision:server.revision,state,managerRole:role,seasonNumber:1,ownResult:own,opponentResult:opponent,allResults};
}
function publish({role,baseRevision,result,operationId}){
  if(baseRevision!==server.revision)return {ok:false,code:'SEASON_RESULTS_STALE_BASE_REVISION'};
  if(server.results[role])return {ok:false,code:'SEASON_RESULTS_ROLE_ALREADY_PUBLISHED'};
  server.results[role]=structuredClone(result);server.order.push(role);server.revision+=1;server.publishes.push({role,operationId,result:structuredClone(result)});
  return server.loseAckFor===role?{ok:false,code:'SIMULATED_RESPONSE_LOST_AFTER_ACCEPTANCE'}:projection(role);
}

async function exposeServer(page){
  await page.exposeFunction('__ssjrResultsAuditRead',role=>projection(role));
  await page.exposeFunction('__ssjrResultsAuditPublish',payload=>publish(payload));
}

async function prepare(page,{role,saveId,entry}){
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  await page.waitForFunction(()=>typeof window.ensureGameplayModules==='function'&&typeof window.loadRuntimeScript==='function'&&typeof window.navigateTo==='function',null,{timeout:12000});
  await page.evaluate(async({role,saveId,entry,rivalryId,sessionId,canonicalKeys})=>{
    await ensureGameplayModules();
    await loadRuntimeScript('ssjr-results-audit-catalog','js/sharedShowdownCatalog.js',()=>window.CareerModeSharedShowdownCatalog);
    const appErrors=[];
    const originalReport=window.reportApplicationError;
    window.reportApplicationError=(context,error)=>{
      appErrors.push({context:String(context||''),message:error?.message||String(error||'')});
      if(typeof originalReport==='function')originalReport(context,error);
    };
    currentShowdown={
      id:saveId,currentRound:1,totalRounds:3,status:'Ready',sharedJourney:{mode:'shared',rivalryId},
      managers:{playerOne:'Daniel',playerTwo:'Nik'},selectedLeague:null,clubs:{playerOne:null,playerTwo:null},
      transferChallenges:[],rounds:[],score:{playerOne:0,playerTwo:0}
    };
    const setup={
      status:'ready',ready:true,revision:6,phase:'SHOWDOWN_CONFIRMED',rivalryId,sessionId,
      deviceId:'device_'+(role==='playerOne'?'1':'2').repeat(32),managerRole:role,
      setup:{phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo']}
    };
    const transfer={ok:true,revision:7,seasonNumber:1,managerRole:role,rivalryId,setup:setup.setup,state:{phase:'COMPLETED',revision:7,guessLockedRoles:['playerOne','playerTwo'],signingLockedRoles:['playerOne','playerTwo']}};
    window.CareerModeProductionSharedShowdownSetup={getState:()=>setup,refresh:async()=>setup};
    window.CareerModeProductionSharedTransferChallenge={getState:()=>transfer,refresh:async()=>transfer};
    window.CareerModeSparkSharedSeasonResults={
      read:async()=>window.__ssjrResultsAuditRead(role),
      publishResult:async options=>window.__ssjrResultsAuditPublish({role,baseRevision:options.baseRevision,operationId:options.operationId,result:options.result})
    };
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:role==='playerOne'?'account_one':'account_two'}},firestore:{},firestoreSdk:{}})};
    window.__postResultsInstalls=[];
    window.CareerModeSparkSharedSeasonCommit={
      read:async()=>{
        const results=await window.__ssjrResultsAuditRead(role);
        const ready=results?.state?.phase==='RESULTS_READY'&&results?.revision===2&&results?.allResults?.playerOne&&results?.allResults?.playerTwo;
        return {ok:true,committed:false,ready:Boolean(ready),coordinatorRole:'playerOne',seasonNumber:1,phase:ready?'RESULTS_READY':'COLLECTING',revision:0,results:ready?results.allResults:null,managerRole:role,ownAcknowledged:false,acknowledgedRoles:[]};
      },
      commitSeason:async()=>({ok:false,code:'AUDIT_COMMIT_MUTATION_NOT_EXPECTED'}),
      acknowledgeSeason:async()=>({ok:false,code:'AUDIT_ACK_MUTATION_NOT_EXPECTED'})
    };
    window.CareerModeSharedLocalReconciliation={contractVersion:1};
    window.CareerModeProductionSharedMultiSeasonProgression={
      install(){window.__postResultsInstalls.push('CareerModeProductionSharedMultiSeasonProgression');return true;},
      resolveSeason:fallback=>Number(fallback)||1,
      getState:()=>null,
      refresh:async()=>null
    };
    for(const name of [
      'CareerModeProductionSharedJourneyReconnect',
      'CareerModeProductionSharedLocalReconciliation',
      'CareerModeProductionSharedFinalReconciliation',
      'CareerModeProductionSharedTerminalClose'
    ])window[name]={install(){window.__postResultsInstalls.push(name);return true;},getState:()=>null,refresh:async()=>null};
    await loadRuntimeScript('ssjr-results-audit-adapter','js/productionSharedSeasonResults.js',()=>window.CareerModeProductionSharedSeasonResults);
    await loadRuntimeScript('ssjr-results-audit-route','js/productionSharedSeasonResultsRoute.js',()=>window.CareerModeProductionSharedSeasonResultsRoute);
    CareerModeProductionSharedSeasonResults.install();CareerModeProductionSharedSeasonResultsRoute.install();
    window.__ssjrResultsAudit={
      role,entry,
      storageBefore:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      storageAfter:()=>Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)])),
      localState:()=>({selectedLeague:currentShowdown.selectedLeague,clubs:structuredClone(currentShowdown.clubs),transferChallenges:structuredClone(currentShowdown.transferChallenges),rounds:structuredClone(currentShowdown.rounds),score:structuredClone(currentShowdown.score)}),
      canRoute:()=>CareerModeProductionSharedSeasonResults.canRoute(),
      routeCanRoute:()=>CareerModeProductionSharedSeasonResultsRoute.canRoute(),
      refreshResults:()=>CareerModeProductionSharedSeasonResults.refresh(),
      postResultsInstalls:()=>[...window.__postResultsInstalls],
      postResultsReady:()=>({
        commit:typeof window.CareerModeProductionSharedSeasonCommit?.refresh==='function',
        scoring:typeof window.CareerModeProductionSharedCanonicalScoring?.refresh==='function',
        history:typeof window.CareerModeProductionSharedHistoryConvergence?.refresh==='function',
        multi:typeof window.CareerModeProductionSharedMultiSeasonProgression?.install==='function',
        reconnect:typeof window.CareerModeProductionSharedJourneyReconnect?.install==='function',
        local:typeof window.CareerModeProductionSharedLocalReconciliation?.install==='function',
        final:typeof window.CareerModeProductionSharedFinalReconciliation?.install==='function',
        terminal:typeof window.CareerModeProductionSharedTerminalClose?.install==='function'
      }),
      diagnostics:()=>({
        routeReady:CareerModeProductionSharedSeasonResultsRoute.canRoute(),
        adapterCanRoute:CareerModeProductionSharedSeasonResults.canRoute(),
        adapterState:CareerModeProductionSharedSeasonResults.getState(),
        // Optional screens (job 29 Standings) may wrap the core router and tag the wrapper .original; the core hook must still be the innermost function.
        routerOwnsResults:(()=>{let fn=window.isRouteStateValid;for(let hops=0;hops<5&&typeof fn?.original==='function';hops+=1)fn=fn.original;return String(fn||'').includes('CareerModeProductionSharedSeasonResults');})(),
        activeScreen:typeof window.getActiveScreenName==='function'?window.getActiveScreenName():null,
        navigation:typeof window.getNavigationDiagnostics==='function'?window.getNavigationDiagnostics():null,
        seasonHidden:Boolean(document.getElementById('seasonEntry')?.classList.contains('hidden')),
        appErrors:structuredClone(appErrors)
      })
    };
    if(entry==='dashboard'){
      await navigateTo('dashboard',{addToHistory:false});
      CareerModeProductionSharedSeasonResultsRoute.decorate();
    }else{
      document.querySelectorAll('.screen').forEach(node=>node.classList.add('hidden'));
      const transferScreen=document.getElementById('transferChallenge');transferScreen.classList.remove('hidden');transferScreen.removeAttribute('data-shared-transfer-replay');
      CareerModeProductionSharedSeasonResultsRoute.decorate();
    }
  },{role,saveId,entry,rivalryId,sessionId,canonicalKeys});
}

async function enterResults(page,entry){
  const button=entry==='dashboard'?page.locator('#seasonPrimaryAction'):page.locator('#continueFromTransfers');
  await button.waitFor({state:'visible',timeout:5000});
  const before=await page.evaluate(()=>window.__ssjrResultsAudit.diagnostics());
  assert.equal(before.routeReady,true,`${entry} entry must be eligible before capture. Diagnostics: ${JSON.stringify(before)}`);
  assert.equal(before.routerOwnsResults,true,`live browser must execute the r9 core Season Results route hook. Diagnostics: ${JSON.stringify(before)}`);
  await button.click();
  try{
    await page.locator('#seasonEntry').waitFor({state:'visible',timeout:8000});
  }catch(error){
    const after=await page.evaluate(()=>window.__ssjrResultsAudit.diagnostics());
    throw new Error(`Shared Season Results ${entry} entry stayed hidden. Before=${JSON.stringify(before)} After=${JSON.stringify(after)} Original=${error.message}`);
  }
  const after=await page.evaluate(()=>window.__ssjrResultsAudit.diagnostics());
  assert.equal(after.adapterCanRoute,true,`refreshed shared authority must grant the Season Results route without local transfer completion. Diagnostics: ${JSON.stringify(after)}`);
  await page.waitForFunction(()=>Object.values(window.__ssjrResultsAudit.postResultsReady()).every(Boolean),null,{timeout:8000});
  assert.deepEqual(await page.evaluate(()=>window.__ssjrResultsAudit.postResultsReady()),{
    commit:true,scoring:true,history:true,multi:true,reconnect:true,local:true,final:true,terminal:true
  },'real Shared Season Results route must expose the complete post-results production chain');
}

async function fillOwnResult(page,role,result){
  const prefix=role==='playerOne'?'p1':'p2';
  await page.locator(`#${prefix}LeaguePosition`).fill(String(result.leaguePosition));
  await page.locator(`#${prefix}LeaguePoints`).fill(String(result.leaguePoints));
  await page.locator(`#${prefix}LeagueGoals`).fill(String(result.leagueGoals));
  for(const [suffix,key] of [['DomesticCup','domesticCup'],['ChampionsLeague','championsLeague'],['TopScorer','topScorer'],['TopAssist','topAssist']]){
    const checkbox=page.locator(`#${prefix}${suffix}`);if(result[key])await checkbox.check();else await checkbox.uncheck();
  }
}


const allSizes=[[360,640],[390,844],[430,932],[844,390],[932,430],[768,1024],[1280,650],[1366,768],[1920,1080],[2560,1080]];
const sizes=process.env.CMS_MEASURE_SIZE?allSizes.filter(size=>size.join('x')===process.env.CMS_MEASURE_SIZE):allSizes;
const resultOne={leaguePosition:1,leaguePoints:101,leagueGoals:102,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true};
const resultTwo={leaguePosition:2,leaguePoints:90,leagueGoals:80,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false};
const artifactDir=process.env.CMS_MEASURE_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'measure-season-final-'));
fs.mkdirSync(artifactDir,{recursive:true});
const measurements=[],unreachable=[],errors=[];

function finalFixture(winner){
  const History=require(path.join(ROOT,'js/sharedHistoryConvergence.js'));
  const Final=require(path.join(ROOT,'js/sharedFinalReconciliation.js'));
  const Career=require(path.join(ROOT,'js/sharedCareerAnalytics.js'));
  const Terminal=require(path.join(ROOT,'js/sharedTerminalClose.js'));
  const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:1,leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'}};
  const slots=[{slotId:'playerOne',accountId:'account_one',profileId:'profile_'+ 'b'.repeat(24),saveId:'save_'+ 'c'.repeat(24),entitlementState:'active'},{slotId:'playerTwo',accountId:'account_two',profileId:'profile_'+ 'd'.repeat(24),saveId:'save_'+ 'e'.repeat(24),entitlementState:'active'}];
  const left=winner==='playerTwo'?resultTwo:resultOne,right=winner==='playerOne'?resultTwo:resultOne;
  const score=r=>({championsLeague:r.championsLeague?5:0,leagueTitle:r.leaguePosition===1?3:0,domesticCup:r.domesticCup?1:0,performanceBonus:r.leaguePoints>=100||r.leagueGoals>=100?1:0,individualAwardsBonus:r.topScorer||r.topAssist?1:0,total:(r.championsLeague?5:0)+(r.leaguePosition===1?3:0)+(r.domesticCup?1:0)+(r.leaguePoints>=100||r.leagueGoals>=100?1:0)+(r.topScorer||r.topAssist?1:0)});
  const hash='sha256:'+ '1'.repeat(64);
  const projection=History.buildProjection({rivalryId,setup,managerSlots:slots,seasons:[{commit:{ok:true,committed:true,phase:'ACKNOWLEDGED',revision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:1,results:{playerOne:left,playerTwo:right}},scoring:{ok:true,authoritative:true,phase:'SCORING_RECONCILED',revision:1,seasonCommitRevision:3,resultsRevision:2,resultsContentHash:hash,seasonNumber:1,scoring:{playerOne:score(left),playerTwo:score(right)},winner}}]});
  const multi={ok:true,authoritative:true,phase:'SHOWDOWN_COMPLETE',rivalryId,state:{phase:'SHOWDOWN_COMPLETE',rivalryId,terminal:true,totalSeasons:1,acceptedSeasons:1,completedSeason:1,activeSeason:null,acceptedRevisionKey:projection.acceptedRevisionKey,leagueId:setup.leagueId,fixedClubs:setup.clubs}};
  const history={ok:true,authoritative:true,phase:'HISTORY_CONVERGED',rivalryId,projection};
  const local={phase:'REMOTE_OBSERVED',canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slots[0].saveId,profileId:slots[0].profileId,managerRole:'playerOne'}};
  const final=Final.reconcile({sharedActive:true,multiSeason:multi,history,localReconciliation:local});
  const career=Career.buildCareerModel({indexStatus:'ready',showdowns:[{rivalryId,classification:'completed',projection,final:{totals:final.managerTotals,winner}}]});
  const terminal={phase:'CLOSED',terminal:true,rivalryId,terminalWitness:Terminal.prepare(final,{sessionId})};
  return {slots,multi,history,local,final,career,terminal};
}

async function settle(page){
  await page.waitForTimeout(450); // Let the production screen entrance settle before geometry and screenshots.
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].filter(img=>img.getClientRects().length).map(img=>img.decode().catch(()=>{})));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    window.scrollTo(0,0);
    document.querySelectorAll('#seasonEntry,#standings,.v10SeasonStage,.v10FinalStage,.sdg-stage').forEach(el=>{el.scrollTop=0;el.scrollLeft=0;});
  });
}

async function measure(page,size,screen,root,primary){
  await settle(page);
  const data=await page.evaluate(({root,primary,touch})=>{
    const host=document.querySelector(root);
    if(!host||!host.getClientRects().length)throw new Error('Measurement root is hidden or absent: '+root);
    const visible=el=>{if(!el.getClientRects().length)return false;for(let node=el;node;node=node.parentElement){const s=getComputedStyle(node);if(node.hidden||s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
    const selector=el=>{
      const uniqueId=n=>n.id&&document.querySelectorAll('[id="'+CSS.escape(n.id)+'"]').length===1;
      if(uniqueId(el))return '#'+CSS.escape(el.id);
      const segments=[];
      for(let n=el;n;n=n.parentElement){
        if(n===host){segments.unshift(root);break;}
        if(uniqueId(n)){segments.unshift('#'+CSS.escape(n.id));break;}
        const siblings=n.parentElement?[...n.parentElement.children].filter(x=>x.tagName===n.tagName):[n];
        segments.unshift(n.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(n)+1)+')');
      }
      return segments.join(' > ');
    };
    const round=x=>Math.round(x*100)/100;
    const nodes=[host,...host.querySelectorAll('*')].filter(visible);
    const findings=[],measuredTargets=new Set();
    for(const el of nodes){
      const r=el.getBoundingClientRect(),s=getComputedStyle(el),sel=selector(el);
      const decorative=!!el.closest('[aria-hidden="true"],.sd-visually-hidden')||/\b(?:art|plate|dust|backdrop|spotlight)\b|plate|dust|backdrop|spotlight/i.test(el.className?.toString()||'')||(r.width<=1&&r.height<=1&&(s.clip!=='auto'||s.clipPath!=='none'));
      if(r.width>innerWidth+1)findings.push({problem:decorative?'oversized decorative element':'element wider than window',selector:sel,value:`width=${round(r.width)}, window=${innerWidth}, left=${round(r.left)}, right=${round(r.right)}`});
      // The requested width test is applied to nodes with direct text, not whole containers.
      if([...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&el.scrollWidth>el.clientWidth){
        let classification=decorative?'decorative/visually-hidden text width excess':s.overflowX==='auto'||s.overflowX==='scroll'?'scrollable text width excess':s.overflowX==='hidden'||s.overflowX==='clip'||s.textOverflow==='ellipsis'?'text clipped':'text width excess (visible overflow)';
        findings.push({problem:classification,selector:sel,value:`scrollWidth=${el.scrollWidth}, clientWidth=${el.clientWidth}, overflowX=${s.overflowX}, text=${el.textContent.trim().replace(/\s+/g,' ').slice(0,85)}`});
      }
      if(touch&&el.matches('button,a[href],input,select,textarea,summary,label[for],[role="button"],[role="tab"]')&&!el.closest('[aria-hidden="true"]')){
        let target=el;
        if(el.matches('input[type="checkbox"],input[type="radio"]')){
          const labels=[...(el.labels||[])].filter(visible);target=labels.find(label=>label.contains(el))||labels[0]||el;
        }
        if(measuredTargets.has(target))continue;measuredTargets.add(target);
        const tr=target.getBoundingClientRect();
        if(tr.width<44||tr.height<44)findings.push({problem:'touch control below 44 px',selector:selector(target),value:`target=${round(tr.width)}x${round(tr.height)}; control=${sel}${el.disabled?'; disabled':''}`});
      }
    }
    const de=document.documentElement,sc=document.scrollingElement,overflow=getComputedStyle(de).overflowX;
    const horizontal=sc.scrollWidth>de.clientWidth&&!['hidden','clip'].includes(overflow);
    const primaryEl=primary?document.querySelector(primary):null;
    const action=primaryEl&&visible(primaryEl)?(()=>{const r=primaryEl.getBoundingClientRect();let fully=r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;let clippedBy=null;for(let p=primaryEl.parentElement;p;p=p.parentElement){const s=getComputedStyle(p),pr=p.getBoundingClientRect();if(['hidden','clip','auto','scroll'].includes(s.overflowY)&&(r.top<pr.top-1||r.bottom>pr.bottom+1)){fully=false;clippedBy=selector(p);break;}}return {selector:primary,visible:true,inside:fully,top:round(r.top),bottom:round(r.bottom),height:innerHeight,clippedBy};})():{selector:primary,visible:false,inside:null};
    return {appErrors:window.__ssjrResultsAudit?.diagnostics()?.appErrors||[],horizontal,documentWidth:sc.scrollWidth,clientWidth:de.clientWidth,rootOverflow:overflow,findings,action,visibleCount:nodes.length};
  },{root,primary,touch:size[0]<=932});
  if(data.appErrors.length)throw new Error('Fixture emitted application errors before '+screen+': '+JSON.stringify(data.appErrors));
  measurements.push({size:size.join('x'),screen,root,...data});
  fs.writeFileSync(path.join(artifactDir,'progress.json'),JSON.stringify({measurements,unreachable,errors},null,2));
  await page.screenshot({path:path.join(artifactDir,size.join('x')+'-'+screen.replace(/[^a-z0-9-]/gi,'-')+'.png')});
  console.log(size.join('x'),screen,data.findings.length,'findings');
}

async function showFinal(page,fixture,mode){
  await page.evaluate(async({fixture,mode})=>{
    const fixed=s=>({install:()=>true,getState:()=>s,refresh:async()=>s});
    currentShowdown.identity={saveId:fixture.slots[0].saveId,managerProfileIds:{playerOne:fixture.slots[0].profileId,playerTwo:fixture.slots[1].profileId}};
    currentShowdown.totalRounds=1;
    window.CareerModeSaveLibraryRuntime={isReady:()=>true};
    window.CareerModeProductionSharedMultiSeasonProgression={...fixed(fixture.multi),resolveSeason:()=>1};
    window.CareerModeProductionSharedHistoryConvergence=fixed(fixture.history);
    window.CareerModeProductionSharedLocalReconciliation={...fixed(fixture.local),refresh:()=>fixture.local};
    // The visual binder consumes protocol-built snapshots at this boundary.
    // Reading live Final Reconciliation here wakes unrelated startup authority;
    // the separate terminal fixture below uses the real close/retry adapter.
    window.CareerModeProductionSharedFinalReconciliation=fixed(fixture.final);
    if(mode==='partial')window.CareerModeProductionSharedHistoryConvergence={...fixed(fixture.history),getState:()=>null};
    window.CareerModeProductionSharedTerminalClose=fixed(mode==='closed'?fixture.terminal:mode==='failed'?{phase:'READY',automaticCloseFailed:true,automaticSaving:false,rivalryId:fixture.final.rivalryId}:null);
    if(getActiveScreenName()!=='seasonEntry')await navigateTo('seasonEntry',{addToHistory:false});
    CareerModeV10Screens.invalidate('seasonEntry');
    await CareerModeV10Screens.show('seasonEntry');
  },{fixture,mode});
  await page.locator('#finalWinnerScreen').waitFor({state:'visible',timeout:8000});
}

async function showStandings(page,status){
  await page.evaluate(async(status)=>{
    const fixed=s=>({install:()=>true,getState:()=>s,refresh:async()=>s});
    window.CareerModeOnlinePlayerIdentity=fixed({status:'ready',managerId:'daniel'});
    const pair=status==='ready'||status==='partial'?{initialized:true,status:'paired',connectionState:'active',rivalryId:currentShowdown.sharedJourney.rivalryId,managerId:'daniel'}:status==='empty'?{initialized:true,status:'unpaired',connectionState:null,rivalryId:null,managerId:'daniel'}:status==='loading'?{initialized:false,status:'idle'}:{initialized:true,status:'unavailable'};
    window.CareerModePersistentNikDanielPair=fixed(pair);
    if(status==='empty'||status==='loading'||status==='unavailable'){
      window.CareerModeProductionSharedHistoryConvergence=fixed(null);
      window.CareerModeProductionSharedMultiSeasonProgression=fixed(null);
      window.CareerModeProductionSharedFinalReconciliation=fixed(null);
      window.CareerModeProductionSharedTerminalClose=fixed(null);
    }
    careerStatisticsModel=window.__measureCareer;
    if(status==='partial')careerStatisticsModel={...careerStatisticsModel,status:'partial',coverage:{readable:1,indexed:2}};
    else if(status==='empty')careerStatisticsModel={status:'empty'};
    else if(status==='loading'||status==='unavailable')careerStatisticsModel={status};
    await CareerModeV10Screens.navigate('standings');
    CareerModeV10Screens.invalidate('standings');await CareerModeV10Screens.show('standings');
  },status);
  await page.locator('#sdgViewShowdown').waitFor({state:'visible',timeout:8000});
}

async function measureTerminal(page,size){
  const fixture=finalFixture('playerOne');await showFinal(page,fixture,'pending');
  await page.evaluate(async({fixture,rivalryId,sessionId})=>{
    const fixed=s=>({getState:()=>s,initialize:async()=>s});
    const deviceId='device_'+ '1'.repeat(32);
    window.__measureTerminal={remote:null,closed:false,resolve:null};
    window.CareerModeSparkConnectedAccount=fixed({connected:true,accountId:'account_one'});
    window.CareerModeSparkPrivatePairing=fixed({registered:true,deviceId});
    window.CareerModeSparkConnectedRivalry=fixed({attached:true,rivalryId,accountId:'account_one',deviceId});
    window.CareerModeSparkRemoteJoining={getState:()=>window.__measureTerminal.remote,forgetSession:()=>{window.__measureTerminal.remote=null;}};
    window.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'account_one'}},firestore:{},firestoreSdk:{}})};
    window.CareerModeSparkTerminalClose={
      read:async()=>window.__measureTerminal.closed?{ok:true,terminal:true,terminalWitness:fixture.terminal.terminalWitness,rivalryRevision:2}:{ok:true,terminal:false},
      close:()=>new Promise(resolve=>{window.__measureTerminal.resolve=resolve;})
    };
    // A previous runtime may have created this panel with handlers closed over
    // another adapter instance. Let the real adapter create its own fresh nodes.
    document.getElementById('sharedTerminalClosePanel')?.remove();
    delete window.CareerModeProductionSharedTerminalClose;
    await loadRuntimeScript('measure-terminal-adapter','js/productionSharedTerminalClose.js',()=>window.CareerModeProductionSharedTerminalClose);
    window.__measureTerminalApi=CareerModeProductionSharedTerminalClose;
    CareerModeProductionSharedTerminalClose.install();
    await CareerModeProductionSharedTerminalClose.refresh();
  },{fixture,rivalryId,sessionId});
  const primary='#seasonEntry .seasonEntryActions [data-smart-back]';
  await measure(page,size,'Terminal-blocked','#seasonEntry',primary);
  await page.evaluate(async({rivalryId,sessionId})=>{
    window.__measureTerminal.remote={sessionState:'active',sessionId,rivalryId,accountId:'account_one',deviceId:'device_'+ '1'.repeat(32),pendingAction:null,expiresAtEpochMs:Date.now()+3600000};
    await CareerModeProductionSharedTerminalClose.refresh();
  },{rivalryId,sessionId});
  await page.waitForFunction(()=>typeof window.__measureTerminal.resolve==='function');
  await measure(page,size,'Terminal-saving','#seasonEntry',primary);
  await page.evaluate(()=>window.__measureTerminal.resolve({ok:false,code:'SIMULATED_CLOSE_FAILURE'}));
  await page.waitForFunction(()=>CareerModeProductionSharedTerminalClose.getState()?.automaticCloseFailed===true);
  await measure(page,size,'Terminal-failed','#seasonEntry','#sharedTerminalCloseAction');
  await page.evaluate(()=>{window.__measureTerminal.resolve=null;});
  await page.locator('#sharedTerminalCloseAction').click();
  await page.waitForFunction(()=>typeof window.__measureTerminal.resolve==='function'&&CareerModeProductionSharedTerminalClose.getState()?.automaticSaving===true);
  await page.evaluate(()=>window.__measureTerminal.resolve({ok:false,code:'network-request-failed'}));
  await page.waitForFunction(()=>CareerModeProductionSharedTerminalClose.getState()?.phase==='RECOVERY_PENDING');
  await measure(page,size,'Terminal-recovery-pending','#seasonEntry','#sharedTerminalCloseRetry');
  await page.evaluate(async()=>{window.__measureTerminal.closed=true;await CareerModeProductionSharedTerminalClose.refresh();});
  await page.waitForFunction(()=>CareerModeProductionSharedTerminalClose.getState()?.phase==='CLOSED');
  await measure(page,size,'Terminal-closed','#seasonEntry',primary);
}

async function measureLegacySummary(page,size){
  await prepare(page,{role:'playerOne',saveId:'measure_legacy_summary',entry:'verdict'});
  const opened=await page.evaluate(async()=>{
    const round={roundNumber:1,winner:'playerOne',playerOne:window.__measureSummaryOne,playerTwo:window.__measureSummaryTwo};
    currentShowdown.sharedJourney=null;currentShowdown.status='Completed';currentShowdown.clubs={playerOne:'Arsenal',playerTwo:'Liverpool'};
    currentShowdown.rounds=[round];currentShowdown.score={playerOne:11,playerTwo:0};
    renderSeasonSummary(round);await navigateTo('seasonSummary',{addToHistory:false});
    return getActiveScreenName();
  });
  if(opened==='seasonSummary')await measure(page,size,'Legacy-season-summary','#seasonSummary','#nextSeasonAction');
  else unreachable.push({size:size.join('x'),screen:'Legacy-season-summary',error:'Normal route opened '+opened+' instead of seasonSummary; identity/route gate retained.'});
}

async function runSize(browser,size){
  const context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:size[0]<=932,isMobile:false,deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',error=>errors.push({size:size.join('x'),message:error.message}));
  page.setDefaultTimeout(8000);
  try{
    // Static layout snapshots are driven by explicit refresh calls. Suppress interval
    // pollers that would read unrelated live authority while switching test fixtures.
    await page.addInitScript(()=>{window.setInterval=()=>0;});
    await exposeServer(page);
    const summary=finalFixture('playerOne').history.projection.seasonHistory[0];
    await page.addInitScript(({one,two})=>{window.__measureSummaryOne=one;window.__measureSummaryTwo=two;},{one:summary.playerOne,two:summary.playerTwo});
    if(process.env.CMS_MEASURE_SUMMARY_ONLY){await measureLegacySummary(page,size);return;}
    for(const role of ['playerOne','playerTwo']){
      server.revision=0;server.order=[];server.results={};server.publishes=[];server.loseAckFor=null;
      await prepare(page,{role,saveId:'measure_'+role,entry:'verdict'});
      await enterResults(page,'verdict');
      await page.evaluate(async()=>{
        await loadRuntimeScript('measure-v10-loader','js/v10Screens.js',()=>window.CareerModeV10Screens);
        await loadRuntimeScript('measure-season-final','js/seasonFinalV10.js',()=>window.CareerModeSeasonFinalV10);
        await CareerModeSeasonFinalV10.install();await CareerModeV10Screens.show('seasonEntry');
      });
      await page.locator('.v10SeasonStage').waitFor({state:'visible'});
      const name=role==='playerOne'?'Daniel':'Nik';
      await measure(page,size,'Results-'+name+'-entry','#seasonEntry','#completeSeason');
      const scoring=page.locator('label[for="season-phone-scoring-toggle"].season-phone-scoring-open');
      if(await scoring.isVisible()){
        await scoring.click();await measure(page,size,'Results-'+name+'-scoring-sheet','#seasonEntry','label.season-phone-sheet-close');
        await page.locator('label.season-phone-sheet-close').click();
      }
      await fillOwnResult(page,role,resultOne);
      await page.locator('#completeSeason').click();
      await page.locator('#seasonReviewPanel').waitFor({state:'visible'});
      await measure(page,size,'Results-'+name+'-review','#seasonEntry','#confirmSeasonCompletion');
      await page.evaluate(prefix=>{document.getElementById(prefix+'LeaguePoints').value='100';},role==='playerOne'?'p1':'p2');
      await page.locator('#confirmSeasonCompletion').click();
      await page.waitForFunction(()=>/changed after review/i.test(document.getElementById('seasonReviewError')?.textContent||''));
      await measure(page,size,'Results-'+name+'-review-error','#seasonEntry','#editSeasonResults');
      await page.locator('#editSeasonResults').click();await fillOwnResult(page,role,resultOne);await page.locator('#completeSeason').click();
      await page.locator('#confirmSeasonCompletion').click();
      await page.waitForFunction(()=>/PUBLISHED/.test(document.getElementById('seasonReviewHeading')?.textContent||''));
      await measure(page,size,'Results-'+name+'-waiting','#seasonEntry','#seasonEntry .seasonEntryActions [data-smart-back]');
      server.results[otherRole(role)]=resultTwo;server.order.push(otherRole(role));server.revision=2;
      await page.evaluate(()=>CareerModeProductionSharedSeasonResults.refresh());
      await page.waitForFunction(()=>/BOTH MANAGERS PUBLISHED/.test(document.getElementById('seasonReviewHeading')?.textContent||''));
      await measure(page,size,'Results-'+name+'-both-published','#seasonEntry',role==='playerOne'?'#confirmSeasonCompletion':'#seasonEntry .seasonEntryActions [data-smart-back]');
    }
    for(const winner of ['playerOne','playerTwo','draw']){
      const fixture=finalFixture(winner);await page.evaluate(c=>{window.__measureCareer=c;},fixture.career);
      for(const mode of ['pending','failed','closed','partial']){
        await showFinal(page,fixture,mode);
        await measure(page,size,'Final-'+winner+'-'+mode,'#seasonEntry','#seasonEntry .seasonEntryActions [data-smart-back]');
        const honours=page.locator('label[for="finalWinnerTabHonours"]');
        if(await honours.isVisible()){
          await honours.click();await measure(page,size,'Final-'+winner+'-'+mode+'-honours','#seasonEntry','#seasonEntry .seasonEntryActions [data-smart-back]');
        }
        const partial=page.locator('label[for="finalWinnerPartialToggle"]');
        if(mode==='partial'&&await partial.isVisible()){
          await partial.click();await measure(page,size,'Final-'+winner+'-history-coverage','#seasonEntry',null);
        }
      }
    }
    try{await measureTerminal(page,size);}catch(error){unreachable.push({size:size.join('x'),screen:'Terminal Close remaining states',error:error.message});}
    for(const status of ['ready','partial','empty','loading','unavailable']){
      // Restore exact ready history before each populated standings projection.
      if(status==='ready'||status==='partial'){const fixture=finalFixture('playerOne');await showFinal(page,fixture,'pending');await page.evaluate(c=>{window.__measureCareer=c;},fixture.career);}
      await showStandings(page,status);
      await measure(page,size,'Standings-Showdown-'+status,'#standings',null);
      await page.locator('#sdgViewCareer').click();
      await measure(page,size,'Standings-Career-'+status,'#standings',null);
    }
    await measureLegacySummary(page,size);
  }catch(error){unreachable.push({size:size.join('x'),error:error.message});console.error('UNREACHABLE',size.join('x'),error.message);}
  finally{await context.close();}
}

async function main(){
  const port=Number(baseUrl.port||4173);
  const localServer=process.env.CMS_BASE_URL?null:spawn(process.execPath,[path.join(ROOT,'tests/support/static-server.cjs')],{stdio:'ignore',env:{...process.env,CMS_TEST_PORT:String(port)}});
  let browser;
  try{
    for(let attempt=0;attempt<40;attempt++){try{const r=await fetch(baseUrl);if(r.ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
    const runtime=await resolveChromiumRuntime();browser=await chromium.launch({executablePath:runtime.executablePath,args:runtime.args,headless:true});
    for(const size of sizes)await runSize(browser,size);
    const report={commit:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),browser:browser.version(),measurements,unreachable,errors};
    fs.writeFileSync(path.join(artifactDir,'measurements.json'),JSON.stringify(report,null,2));
    writeReport(report);
    console.log(JSON.stringify({artifactDir,count:measurements.length,unreachable,errors}));
    if(!measurements.length)process.exitCode=1;
  }finally{if(browser)await browser.close();if(localServer)localServer.kill();}
}
function writeReport(report){
  const esc=value=>String(value??'—').replace(/\|/g,'&#124;').replace(/\r?\n/g,' ');
  const code=value=>'`'+String(value).replace(/`/g,'')+'`';
  const ms=report.measurements;
  const issue=problem=>!problem.includes('decorative')&&!problem.includes('visually-hidden');
  const lines=[
    '# JOB-1585 — season-final measurements',
    '',
    `Measured application commit ${code(report.commit)} from ${code('gameplay/bug-list-1')} with Chromium ${report.browser}. ${ms.length} screen-state/window measurements across ${new Set(ms.map(m=>m.size)).size} exact CSS-pixel viewports. Report only; no game file or existing audit changed.`,
    ...(report.sourceRuns?['', 'Delivery combines the ten-size browser pass with a clean 360x640 repeat after refreshing the Terminal Close panel nodes. The repeat replaces that viewport in full; no states are counted twice.']:[]),
    '',
    '## Most important five',
    ''
  ];
  const priorities=[
    ['Terminal Close recovery controls',m=>m.screen.startsWith('Terminal-')&&m.action.selector?.startsWith('#sharedTerminalClose')],
    ['Publish/commit from Season Results review',m=>m.action.selector==='#confirmSeasonCompletion'],
    ['Touch controls below 44 px',null],
    ['Exit from Final Winner',m=>m.screen.startsWith('Final-')&&m.action.selector?.includes('data-smart-back')],
    ['Continue from legacy Season Summary',m=>m.screen==='Legacy-season-summary']
  ];
  let rank=0;
  for(const [title,predicate] of priorities){
    if(!predicate){
      const found=ms.flatMap(m=>m.findings.filter(f=>f.problem==='touch control below 44 px').map(f=>({m,f})));
      if(found.length){const {m,f}=found[0];const affected=[...new Set(found.map(x=>x.m.size))].join(', ');lines.push(`${++rank}. **${title}:** undersized hit areas at ${affected}. Example ${m.size}, ${m.screen}, ${code(f.selector)}: ${f.value}.`);}
      continue;
    }
    const failures=ms.filter(m=>predicate(m)&&m.action.visible&&!m.action.inside);
    if(!failures.length)continue;
    const example=failures[0],a=example.action;
    const affected=[...new Set(failures.map(m=>m.size))].join(', ');
    lines.push(`${++rank}. **${title}:** outside the first screenful or an ancestor scrollport at ${affected}. Example ${example.size}, ${example.screen}, ${code(a.selector)}: top ${a.top}, bottom ${a.bottom}, window height ${a.height}${a.clippedBy?'; clipped by '+code(a.clippedBy):''}.`);
  }
  if(rank<5){
    for(const type of ['touch control below 44 px','text clipped','text width excess (visible overflow)']){
      const found=ms.flatMap(m=>m.findings.filter(f=>f.problem===type).map(f=>({m,f})));
      if(!found.length||rank>=5)continue;
      const {m,f}=found[0];lines.push(`${++rank}. **${type}:** ${m.size}, ${m.screen}, ${code(f.selector)} — ${f.value}.`);
    }
  }
  if(rank<5)lines.push(`${++rank}. No horizontal document scrollbar was detected; decorative crops and deliberately hidden semantic text are listed separately from product defects.`);
  lines.push('', '## Method and coverage', '',
    '- Reuses the real startup, controlled provider read/publish, private-manager entry, review fingerprint error and normal route opener from `tests/browser/shared-season-results-audit.cjs`. Loads the actual season/final binder and production Terminal Close adapter. History, final witness and career totals use the existing protocol builders, following `tests/browser/shared-final-reconciliation-audit.cjs`; Standings opens through its registered navigation route. The legacy summary uses its real renderer and normal route with a completed one-season fixture.',
    '- Results: Daniel and Nik entry, review, changed-after-review error, privately published/waiting, and both-published/commit-waiting states; scoring sheet wherever its phone opener is displayed. Final Winner: Daniel win, Nik win and draw, each pending, failed-save presentation, closed and partial history; honours and history-coverage sheet wherever the responsive controls are displayed. Terminal Close: blocked, saving, rejected close, ambiguous network response/recovery and verified closed states, including the real Close and Retry buttons. Standings: This Showdown and Career, each ready, partial career coverage, empty, loading and unavailable. Its partial This Showdown case retains acknowledged ready rivalry data; the partial coverage applies to Career.',
    '- These are controlled browser fixtures, not production account/device or network evidence. Final failed-save presentation is supplemented by the separately measured real Terminal Close failure/retry panel. The live Final Reconciliation proof panel is not measured: attempting to refresh that adapter while swapping synthetic snapshots wakes unrelated startup Terminal Close authority and fails the exact account guard. Its final visual instead uses protocol-built snapshots, as the existing audits do at provider boundaries. Completed local Season Summary is measured separately from the shared Season Results flow. Arbitrary historic saves, every numeric input combination, real Firebase authentication/network timing, commit/acknowledgement in-flight and canonical scoring progression are not claimed.',
    '- Viewports are desktop-browser windows at DPR 1 with reduced motion, so landscape widths remain exact (no mobile viewport emulation or browser chrome). Touch checks run for 360, 390, 430, 768, 844 and 932 px widths. Visible labelled checkbox/radio hit areas are measured instead of only the drawn checkbox; visible labels for CSS-only tabs/sheets and disabled controls are included. Target below 44 means either dimension is strictly under 44 CSS px.',
    '- Background interval polling is disabled in these static fixtures; explicit refresh calls and event/timeout-driven controls still use the actual adapters. Each measurement resets page and main screen scroll offsets to zero after fonts/images and entrance motion settle. The first-screenful check requires the entire primary action to fit both the window and every clipping/scrolling ancestor. This describes its initial position; content in an `auto`/`scroll` container may be reachable by scrolling. It does not prove permanence of a crop or absence of overlap. Standings has scope tabs and no primary CTA; coverage sheets have no button CTA, so those action rows are N/A.',
    '- Horizontal scrollbar means document width exceeds client width and document overflow permits horizontal scrolling. The app normally sets overflow-x:hidden; a negative scrollbar result does not prove foreground content fits. Element-width checks allow 1 CSS px for fractional geometry. Text-width checks use scrollWidth > clientWidth on visible elements with direct text. Hidden ancestor content is excluded; deliberate 1 px clipped accessibility text and oversized decorative plate/dust/art are retained with explicit non-defect labels. Vertical text clipping, soft-keyboard occlusion and physical safe areas are not inferred from the width test.',
    `- Captured ${report.errors.length} uncaught page errors. The measurement function rejects states containing application errors recorded by the reused fixture. Screenshots and machine-readable geometry are saved outside the repository under CMS_MEASURE_ARTIFACTS (a fresh temporary directory by default).`,
    '', '## Per-size coverage', '',
    '| Size | States | Horizontal scrollbar states | Foreground oversized elements | Touch targets below 44 | Foreground text width flags | Primary actions outside first screenful |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for(const size of allSizes.map(s=>s.join('x'))){
    const states=ms.filter(m=>m.size===size),findings=states.flatMap(m=>m.findings);
    lines.push(`| ${size} | ${states.length} | ${states.filter(m=>m.horizontal).length} | ${findings.filter(f=>f.problem==='element wider than window').length} | ${findings.filter(f=>f.problem==='touch control below 44 px').length} | ${findings.filter(f=>issue(f.problem)&&f.problem.includes('text')).length} | ${states.filter(m=>m.action.visible&&!m.action.inside).length} |`);
  }
  lines.push('', 'Counts count observations, so the same control may recur across states. Each zero is a measured negative under this fixture, not a universal guarantee.', '', '## Reachability and limitations', '');
  if(report.unreachable.length)for(const item of report.unreachable)lines.push(`- ${item.size}, ${item.screen||'remaining states'}: ${esc(item.error)}`);
  else lines.push('All requested viewports completed. Every state scheduled by this script was reached; no measured screen group was blocked. Controls hidden by a desktop layout are not additional phone-sheet/tab states at that size.');
  lines.push('', '## Measurements', '', '| Size | Screen | Problem/check | Selector | Measured value |', '| --- | --- | --- | --- | --- |');
  const row=(m,problem,selector,value)=>lines.push('| '+[m.size,m.screen,problem,selector,value].map(esc).join(' | ')+' |');
  for(const m of ms){
    row(m,'Horizontal scrollbar', 'html / document.scrollingElement', `${m.horizontal?'YES':'NO'}; scroll/client width=${m.documentWidth}/${m.clientWidth}; overflow-x=${m.rootOverflow}`);
    const oversized=m.findings.filter(f=>f.problem.includes('wider')||f.problem.includes('oversized'));
    if(!oversized.length)row(m,'Any element wider than window',m.root,'NO; 0 detected');
    else for(const f of oversized)row(m,f.problem,f.selector,f.value);
    const touch=m.findings.filter(f=>f.problem==='touch control below 44 px');
    if(Number(m.size.split('x')[0])>932)row(m,'Touch control below 44 px',m.root,'N/A; desktop-size touch check not requested');
    else if(!touch.length)row(m,'Touch control below 44 px',m.root,'NO; 0 detected');
    else for(const f of touch)row(m,f.problem,f.selector,f.value);
    const text=m.findings.filter(f=>f.problem.includes('text'));
    if(!text.length)row(m,'Text scrollWidth > clientWidth',m.root,'NO; 0 detected');
    else for(const f of text)row(m,f.problem,f.selector,f.value);
    const a=m.action;
    row(m,'Primary action in first screenful',a.selector||'—',a.selector?(a.visible?`${a.inside?'YES':'NO'}; top=${a.top}, bottom=${a.bottom}, window height=${a.height}${a.clippedBy?'; clipped by '+a.clippedBy:''}`:'ABSENT/HIDDEN in this state'):'N/A; no primary button');
  }
  lines.push('', '## Reproduce', '', 'From the repository root, install the existing locked dependencies if needed, then run:', '', '```sh', 'node project-documents/gameplay-factory/queue/results/measure-season-final.cjs', '```', '', 'The script starts the existing static server on 127.0.0.1:4173, uses the existing Chromium runtime helper, writes this report, and prints the external artifact directory. CMS_BASE_URL may select an already-running local server; CMS_MEASURE_ARTIFACTS chooses the screenshot/JSON directory. CMS_MEASURE_SIZE selects one of the listed exact sizes for diagnosis; CMS_MEASURE_SUMMARY_ONLY selects only the legacy summary. Use a full run for delivery. `--report-from <measurements.json>` regenerates Markdown from saved browser measurements without rerunning the browser.', '');
  fs.writeFileSync(path.join(__dirname,'measure-season-final.md'),lines.join('\n'));
}

if(process.argv[2]==='--report-from')writeReport(JSON.parse(fs.readFileSync(process.argv[3],'utf8')));
else main().catch(error=>{console.error(error);process.exitCode=1;});
