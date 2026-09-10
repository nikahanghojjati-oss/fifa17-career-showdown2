const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolveChromiumRuntime}=require('../support/chromium-runtime.cjs');

const baseUrl=new URL(process.env.CMS_BASE_URL||'http://127.0.0.1:4173/');
const canonicalKeys=['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
const rivalryId='pair_'+'a'.repeat(64);

async function prepare(page,role){
  await page.route('**/js/ssjr.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:'window.__r15AutomaticBootstrapSuppressed=true;'}));
  await page.goto(baseUrl.href,{waitUntil:'domcontentloaded'});
  await page.locator('#loadingScreen').waitFor({state:'hidden',timeout:12000});
  return page.evaluate(async({role,rivalryId,canonicalKeys})=>{
    const load=path=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=path;script.async=false;script.onload=()=>resolve(true);script.onerror=()=>reject(new Error(`Unable to load ${path}`));document.head.appendChild(script);});
    await load('js/sharedJourneyConflicts.js');
    await load('js/productionSharedJourneyConflicts.js');
    CareerModeProductionSharedJourneyConflicts.install();
    await new Promise(resolve=>setTimeout(resolve,0));
    const host=role==='playerOne';
    const identity={accountId:host?'account_one':'account_two',deviceId:'device_'+(host?'1':'2').repeat(32),sessionId:'session_'+(host?'3':'4').repeat(64),managerRole:role,rivalryId};
    localStorage.setItem('careerModeShowdown.preferences',JSON.stringify({r15Sentinel:role}));
    window.__r15ProviderCalls=0;
    window.__r15Identity=identity;
    const storageBefore=Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]));
    return {identity,storageBefore};
  },{role,rivalryId,canonicalKeys});
}

async function runHost(page){
  return page.evaluate(async canonicalKeys=>{
    const a=window.__r15Identity;
    const execute=(options,result)=>CareerModeProductionSharedJourneyConflicts.execute(options,async()=>{window.__r15ProviderCalls+=1;return result;});
    const base={surface:'shared-setup',action:'commit-length',operationId:'setup_op_'+'1'.repeat(32),baseRevision:3,authority:a,intent:{totalSeasons:3},nowEpochMs:1000};
    const accepted={ok:true,status:'accepted',revision:4};
    const first=await execute(base,accepted);
    let alteredCode='';
    try{await execute({...base,baseRevision:4,nowEpochMs:1100},accepted);}catch(error){alteredCode=error.code;}
    const callsAfterAltered=window.__r15ProviderCalls;
    const quota={ok:false,code:'resource-exhausted'};
    const quotaResult=await execute({...base,operationId:'setup_op_'+'2'.repeat(32),nowEpochMs:1200},quota);
    const quotaReceipt=CareerModeProductionSharedJourneyConflicts.getState();
    const unauthorized={ok:false,code:'SETUP_DEVICE_INACTIVE'};
    const unauthorizedResult=await execute({...base,operationId:'setup_op_'+'3'.repeat(32),nowEpochMs:1300},unauthorized);
    const unauthorizedReceipt=CareerModeProductionSharedJourneyConflicts.getState();
    const expiring={...base,operationId:'setup_op_'+'4'.repeat(32),nowEpochMs:2000};
    await execute(expiring,accepted);
    let expiryCode='';
    try{await execute({...expiring,nowEpochMs:122001},accepted);}catch(error){expiryCode=error.code;}
    const expiryReceipt=CareerModeProductionSharedJourneyConflicts.getState();
    return {first,alteredCode,callsAfterAltered,quotaResult,quotaReceipt,unauthorizedResult,unauthorizedReceipt,expiryCode,expiryReceipt,providerCalls:window.__r15ProviderCalls,storage:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]))};
  },canonicalKeys);
}

async function runPeer(page){
  return page.evaluate(async canonicalKeys=>{
    const a=window.__r15Identity;
    const execute=(options,result)=>CareerModeProductionSharedJourneyConflicts.execute(options,async()=>{window.__r15ProviderCalls+=1;return result;});
    const firstAttempt={surface:'season-commit',action:'acknowledge-season',operationId:'season_commit_op_'+'5'.repeat(32),baseRevision:1,authority:a,intent:{seasonNumber:1},nowEpochMs:3000};
    const stale={ok:false,code:'SEASON_COMMIT_STALE_BASE_REVISION'};
    const first=await execute(firstAttempt,stale);
    const staleReceipt=CareerModeProductionSharedJourneyConflicts.getState();
    const accepted={ok:true,status:'accepted',revision:3};
    const retry=await execute({...firstAttempt,baseRevision:2,nowEpochMs:3100},accepted);
    const retryReceipt=CareerModeProductionSharedJourneyConflicts.getState();
    let secondChangedBase='';
    try{await execute({...firstAttempt,baseRevision:3,nowEpochMs:3200},accepted);}catch(error){secondChangedBase=error.code;}
    return {first,staleReceipt,retry,retryReceipt,secondChangedBase,providerCalls:window.__r15ProviderCalls,storage:Object.fromEntries(canonicalKeys.map(key=>[key,localStorage.getItem(key)]))};
  },canonicalKeys);
}

(async()=>{
  const runtime=await resolveChromiumRuntime();
  const browser=await chromium.launch({executablePath:runtime.executablePath,headless:true,args:runtime.args});
  const hostContext=await browser.newContext({viewport:{width:1365,height:900}});
  const peerContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  const host=await hostContext.newPage(),peer=await peerContext.newPage();
  const pageErrors=[];host.on('pageerror',error=>pageErrors.push(`host:${error.message}`));peer.on('pageerror',error=>pageErrors.push(`peer:${error.message}`));
  const hostPrepared=await prepare(host,'playerOne');
  const peerPrepared=await prepare(peer,'playerTwo');
  const hostResult=await runHost(host);
  const peerResult=await runPeer(peer);

  assert.equal(hostResult.first.ok,true);
  assert.equal(hostResult.alteredCode,'JOURNEY_CONFLICT_REPLAY_ALTERED');
  assert.equal(hostResult.callsAfterAltered,1,'altered replay must not reach provider');
  assert.strictEqual(hostResult.quotaResult.code,'resource-exhausted');
  assert.equal(hostResult.quotaReceipt.classification,'QUOTA');
  assert.equal(hostResult.quotaReceipt.providerCode,'resource-exhausted');
  assert.strictEqual(hostResult.unauthorizedResult.code,'SETUP_DEVICE_INACTIVE');
  assert.equal(hostResult.unauthorizedReceipt.classification,'UNAUTHORIZED');
  assert.equal(hostResult.unauthorizedReceipt.authoritative,false);
  assert.equal(hostResult.expiryCode,'JOURNEY_CONFLICT_RECEIPT_EXPIRED');
  assert.equal(hostResult.expiryReceipt.classification,'RECEIPT_EXPIRED');
  assert.equal(hostResult.expiryReceipt.providerInvoked,false);

  assert.equal(peerResult.first.code,'SEASON_COMMIT_STALE_BASE_REVISION');
  assert.equal(peerResult.staleReceipt.classification,'STALE');
  assert.equal(peerResult.retry.ok,true);
  assert.equal(peerResult.retryReceipt.classification,'ACCEPTED');
  assert.equal(peerResult.retryReceipt.retryCount,1);
  assert.equal(peerResult.secondChangedBase,'JOURNEY_CONFLICT_REPLAY_ALTERED');
  assert.equal(peerResult.providerCalls,2,'peer gets exactly one stale call and one bounded retry');

  assert.deepEqual(hostResult.storage,hostPrepared.storageBefore,'host canonical local storage must remain byte-identical');
  assert.deepEqual(peerResult.storage,peerPrepared.storageBefore,'peer canonical local storage must remain byte-identical');
  assert.equal(hostResult.unauthorizedReceipt.authorityKey.includes('account_one'),true);
  assert.equal(peerResult.retryReceipt.authorityKey.includes('account_two'),true);
  assert.notEqual(hostResult.unauthorizedReceipt.authorityKey,peerResult.retryReceipt.authorityKey,'two manager client receipts must remain identity-isolated');
  assert.deepEqual(pageErrors,[]);

  await hostContext.close();await peerContext.close();await browser.close();
  console.log('PASS Journey Conflicts browser audit: isolated two-manager contention, bounded stale retry, altered replay pre-provider denial, receipt expiry, quota/revocation classification, provider-code preservation and zero canonical local-save mutation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
