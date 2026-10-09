const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');

const production=read('js/productionSharedJourneyReconnect.js');
const coreSource=read('js/sharedJourneyReconnect.js');
const multiSource=read('js/sharedMultiSeasonProgression.js');
const entry=read('js/productionSharedJourneyEntry.js');
const bootstrap=read('js/ssjr.js');
const serviceWorker=read('service-worker.js');

assert.match(production,/runtimeRevision:"1\.9\.1-r14"/);
assert.match(production,/js\/sharedMultiSeasonProgression\.js/);
assert.match(production,/js\/sharedJourneyReconnect\.js/);
assert.ok(production.indexOf('js/sharedMultiSeasonProgression.js')<production.indexOf('js/sharedJourneyReconnect.js'),'r13 Multi Season verifier must load before r14 protocol capture.');
assert.match(production,/factory\.createProtocol\(\{multiSeasonModule:resolved\["ssjr-multi-season-protocol"\]\}\)/);
assert.match(production,/js\/productionSharedShowdownSetup\.js/);
assert.match(production,/js\/productionSharedMultiSeasonProgression\.js/);
assert.match(production,/js\/sparkRemoteJoining\.js/);
assert.match(production,/setupApi\.refresh\(\)/);
assert.match(production,/multiApi\.refresh\(\)/);
assert.match(production,/latestExactActive[\s\S]*protocol\.observe\(\{authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote\}\)/,"An expiry race during progression verification must downgrade to FRESH_SESSION_REQUIRED instead of surfacing a generic reconnect error.");
assert.match(production,/remoteApi\?\.getState/);
assert.match(production,/Number\.isFinite\(remoteExpiry\)&&now<remoteExpiry/,'r14 must require exact finite unexpired Remote Joining authority.');
assert.match(production,/if\(!previous\)return pjrPublish\(null\)/,'Normal ACTIVE gameplay with no recovery history must keep Journey Reconnect dormant instead of polling progression or surfacing recovery errors.');
assert.match(production,/if\(!pjrOnline\(\)\)return pjrOfflineHold\(\)/,'offline recovery must stop before provider Shared Setup/progression reads.');
assert.match(production,/function pjrSetupPending\(\)[\s\S]*setupPending===true/,'The prepared shared-setup shell must retain an explicit pending marker.');
assert.match(production,/function pjrPrePairShell\(\)[\s\S]*pjrSetupPending\(\)[\s\S]*!pjrMarkerRivalry\(\)/,'The prepared pre-pair shell must be recognized as a legitimate non-reconnect state.');
assert.match(production,/pjrPrePairShell\(\)&&!rivalryApi\?\.getState\?\.\(\)\?\.attached\)return null/,'Journey reconnect must defer while Connect Players has not attached a rivalry yet.');
assert.match(production,/const authority=await pjrResolveIdentity\(\);if\(!authority\)return pjrPublish\(null\)/,'A deferred pre-pair shell must clear recovery state without reporting an application error.');
assert.match(production,/pjrSetupPending\(\)&&pjrSetupPresentationActive\(\)\)return pjrPublish\(null\)/,'An active authoritative setup presentation must own the screen without Journey Reconnect banners.');
assert.match(production,/sameSetupContext&&pjrSetupPending\(\)&&\(!setupState\.setup\|\|setupState\.setup\.phase!=="SHOWDOWN_CONFIRMED"\)\)return pjrPublish\(null\)/,'An authoritative pre-confirmation setup must clear stale reconnect state rather than throw JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED.');
assert.ok(production.indexOf('sameSetupContext&&pjrSetupPending()')<production.indexOf('JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED'),'pre-confirmation ownership must be resolved before the confirmed-journey failure gate.');
assert.ok(production.indexOf('if(!pjrOnline())return pjrOfflineHold()')<production.indexOf('const setupResult=await setupApi.refresh()'),'offline hold must precede provider setup refresh.');
assert.match(production,/FRESH_SESSION_REQUIRED/);
assert.match(production,/ACTIVE_RECOVERED/);
assert.match(production,/TERMINAL_RECOVERED/);
assert.match(production,/sharedJourneyReconnectStatus/);
assert.match(production,/sharedJourneyReconnectAction/,'Expired or unresolved session recovery must expose a direct player action from the current game screen.');
assert.match(production,/remoteApi\?\.openPanel/,'The recovery action must reuse the existing private Remote Joining surface instead of inventing a second session system.');
assert.match(production,/openSessionRecovery:pjrOpenSessionRecovery/,'Direct session recovery must remain observable to browser tests.');
assert.match(production,/career-mode-shared-journey-reconnect-state-change/);
assert.match(production,/sessionAuthorityReplaceable:true/);
assert.match(production,/durableRivalryStatePreserved:true/);
assert.match(production,/expiredSessionNeverActive:true/);
assert.match(production,/offlineNeverAuthoritative:true/);
assert.match(production,/freshRuntimeRequiresReauthorization:true/);
assert.match(production,/dualManagerStatusVisible:true/);
assert.doesNotMatch(production,/\blocalStorage\b/);
assert.doesNotMatch(production,/saveCurrentShowdown|saveShowdown|careerModeShowdown\.saveLibrary/);
for(const lock of ['canonicalStorageMutation:false','providerWriteRequired:false','listPermissionRequired:false','billingRequired:false','blazeRequired:false','cloudRunRequired:false','cloudFunctionsRequired:false'])assert.ok(production.includes(lock),lock);

assert.match(entry,/Number\.isFinite\(remote\.expiresAtEpochMs\)&&Date\.now\(\)<remote\.expiresAtEpochMs/,'Shared Journey Entry must reject missing and nonfinite expiry.');
assert.doesNotMatch(entry,/!Number\.isFinite\(remote\.expiresAtEpochMs\)\|\|Date\.now\(\)<remote\.expiresAtEpochMs/,'the old permissive unknown-expiry ACTIVE condition must not return.');

assert.match(bootstrap,/ssjr-production-history-convergence/);
assert.match(bootstrap,/ssjr-production-multi-season/);
assert.match(bootstrap,/ssjr-journey-reconnect-protocol/);
assert.match(bootstrap,/ssjr-production-journey-reconnect/);
assert.ok(bootstrap.indexOf('ssjr-production-history-convergence')<bootstrap.indexOf('ssjr-production-multi-season'),'History Convergence must precede Multi Season.');
assert.ok(bootstrap.indexOf('ssjr-production-multi-season')<bootstrap.indexOf('ssjr-production-journey-reconnect'),'Multi Season must precede Journey Reconnect.');
assert.match(serviceWorker,/js\/sharedJourneyReconnect\.js/,'r14 protocol must survive reload/offline service-worker control.');
assert.match(serviceWorker,/js\/productionSharedJourneyReconnect\.js/,'r14 production adapter must survive reload/offline service-worker control.');

assert.match(coreSource,/RUNTIME_REVISION="1\.9\.1-r14"/);
assert.match(coreSource,/canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false/);
assert.match(multiSource,/RUNTIME_REVISION="1\.9\.1-r13"/);
const core=require('../../js/sharedJourneyReconnect.js');
const multi=require('../../js/sharedMultiSeasonProgression.js');
assert.equal(core.runtimeRevision,'1.9.1-r14');
assert.equal(core.providerWriteRequired,false);
assert.equal(core.listPermissionRequired,false);
assert.equal(core.billingRequired,false);
const protocol=core.createProtocol({multiSeasonModule:multi});
assert.equal(protocol.runtimeRevision,'1.9.1-r14');
assert.equal(protocol.providerWriteRequired,false);
assert.equal(protocol.listPermissionRequired,false);
assert.equal(protocol.billingRequired,false);


function reconnectDocument(){
  const byId=new Map();
  function element(tag){
    let id="";
    const classes=new Set();
    const node={tagName:String(tag).toUpperCase(),children:[],parentNode:null,dataset:{},attributes:{},className:"",
      classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);},contains(name){return classes.has(name);}},
      setAttribute(name,value){this.attributes[name]=String(value);},
      addEventListener(){},
      append(...items){for(const item of items){if(item&&typeof item==="object")item.parentNode=this;this.children.push(item);}},
      prepend(...items){for(const item of items){if(item&&typeof item==="object")item.parentNode=this;}this.children.unshift(...items);},
      replaceChildren(...items){this.children=[];this.append(...items);},
      insertAdjacentElement(_where,item){this.append(item);}
    };
    Object.defineProperty(node,"id",{get(){return id;},set(value){id=String(value);if(id)byId.set(id,node);}});
    return node;
  }
  const app=element("main");app.id="app";
  return {visibilityState:"visible",createElement:element,createTextNode:text=>({nodeType:3,textContent:String(text),parentNode:null}),getElementById:id=>byId.get(id)||null,app};
}
async function renderFreshReconnect(terminalState){
  const document=reconnectDocument();
  const authority={rivalryId:"pair_job1014",accountId:"account_job1014",deviceId:"device_job1014",managerRole:"playerOne"};
  const fresh=Object.freeze({...authority,phase:"FRESH_SESSION_REQUIRED",sessionId:"session_job1014",resumable:true,activeAuthorization:false,recovered:false,acceptedSeasons:1,activeSeason:1,totalSeasons:1,terminal:false,sessionChanged:true});
  const root={
    console,navigator:{onLine:true},document,
    currentShowdown:{managers:{playerOne:"Daniel",playerTwo:"Nik"},sharedJourney:{mode:"shared",rivalryId:authority.rivalryId}},
    CareerModeProductionSharedTerminalClose:{getState:()=>terminalState},
    CareerModeSharedMultiSeasonProgression:{},
    CareerModeSharedJourneyReconnect:{createProtocol:()=>({observe:()=>fresh})},
    CareerModeProductionSharedShowdownSetup:{refresh:async()=>true,getState:()=>null},
    CareerModeProductionSharedMultiSeasonProgression:{refresh:async()=>true,getState:()=>null},
    CareerModeSparkRemoteJoining:{getState:()=>({sessionState:"expired",sessionId:fresh.sessionId,expiresAtEpochMs:0}),openPanel:async()=>true},
    CareerModeSparkConnectedAccount:{initialize:async()=>true,getState:()=>({connected:true,accountId:authority.accountId})},
    CareerModeSparkPrivatePairing:{initialize:async()=>true,getState:()=>({registered:true,deviceId:authority.deviceId})},
    CareerModeSparkConnectedRivalry:{initialize:async()=>true,getState:()=>({attached:true,rivalryId:authority.rivalryId,binding:{managerRole:authority.managerRole}})}
  };
  vm.runInNewContext(production,root,{filename:"productionSharedJourneyReconnect.js"});
  await root.CareerModeProductionSharedJourneyReconnect.refresh();
  const status=document.getElementById("sharedJourneyReconnectStatus");
  return {message:status?.children?.[0]?.textContent||"",hasReconnect:Boolean(document.getElementById("sharedJourneyReconnectAction"))};
}

(async()=>{
  const closed=await renderFreshReconnect({phase:"CLOSED",terminal:true});
  assert.equal(closed.message,"SHOWDOWN COMPLETE · Open the Final Winner or History from Home.");
  assert.equal(closed.hasReconnect,false,"A terminal CLOSED Showdown must not offer RECONNECT SESSION.");
  const open=await renderFreshReconnect({phase:"READY",terminal:false});
  assert.match(open.message,/^NEW CONNECTION NEEDED ·/,"A non-closed Showdown must keep the existing reconnect line.");
  assert.equal(open.hasReconnect,true,"A non-closed FRESH_SESSION_REQUIRED Showdown must keep RECONNECT SESSION.");

  console.log('PASS Journey Reconnect production contract: strict finite ACTIVE session authority, normal ACTIVE-gameplay dormancy, authoritative pre-confirmation setup deferral, ordered r12→r13→r14 bootstrap, read-only durable recovery, visible dual-manager status, terminal-closed completion messaging, a direct fresh-session recovery action, and permanent Spark zero-billing boundary.');
  require('./persistent-nik-daniel-pair-contracts.cjs');
})().catch(error=>{console.error(error);process.exitCode=1;});