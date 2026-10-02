"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const StartJoin=require("../../js/startJoinViewModel.js");
const Pair=require("../../js/persistentNikDanielPair.js");
const Session=require("../../js/sparkRemoteJoining.js");
const Identity=require("../../js/onlinePlayerIdentity.js");

const clone=value=>JSON.parse(JSON.stringify(value));
const pairId="pair_"+"1".repeat(64);
const sessionId="session_"+"2".repeat(64);
const saveId="save_"+"a".repeat(24);
const profileId="profile_"+"a".repeat(24);
const capability="CMS17-"+pairId;
const screenIds=["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"];
const pairingNames=["createCode","join","copyCode","newCode","checkStatus","retry"];
const sessionNames=["host","join","refresh","revoke","close","forget"];
const models=[];

const identity=(managerId="daniel",extra={})=>({status:"ready",registered:true,managerId,busy:false,accountId:"acct_test",...extra});
const pair=(managerRole="playerOne",extra={})=>({status:"unpaired",initialized:true,busy:false,managerRole,managerId:managerRole==="playerOne"?"daniel":"nik",connectionState:null,capability:null,rivalryId:pairId,accountId:"acct_test",deviceId:"device_test",providerSaveId:saveId,providerProfileId:profileId,message:"provider text",...extra});
const session=(sessionState=null,extra={})=>({status:"ready",busy:false,sessionId,sessionState,expiresAtEpochMs:1000,pendingAction:null,...extra});
const build=(managerId="daniel",pairState=pair(managerId==="daniel"?"playerOne":"playerTwo"),sessionState=null,nowEpochMs=500,identityState=identity(managerId))=>{
  const model=StartJoin.buildStartJoinViewModel({identity:identityState,pair:pairState,session:sessionState,nowEpochMs});
  models.push(model);
  return model;
};
const actionById=(model,id)=>{
  if(id==="abandonShowdown"||id==="forgetThisDevice")return model[id];
  const [group,name]=id.split(".");
  return model[group].actions[name];
};
const allActions=model=>[
  ...pairingNames.map(name=>model.pairing.actions[name]),
  ...sessionNames.map(name=>model.session.actions[name]),
  model.abandonShowdown,
  model.forgetThisDevice
];
const unavailable=action=>assert.deepEqual(action,{available:false,enabled:false,provider:null,args:null,confirm:null,confirmedByProvider:false});
let cases=0;
function check(name,fn){try{fn();cases+=1;}catch(error){error.message=name+": "+error.message;throw error;}}

check("1. Lock table",()=>{
  const expected={transferChallenge:"transfer-window",seasonEntry:"season-entry",leagueWheelScreen:"setup",clubWheelScreen:"setup"};
  for(const [id,reason] of Object.entries(expected))assert.deepEqual(StartJoin.navLockState(id),{locked:true,reason});
  for(const id of screenIds.filter(id=>!Object.hasOwn(expected,id)))assert.deepEqual(StartJoin.navLockState(id),{locked:false,reason:null});
  assert.deepEqual(StartJoin.navLockState(null),{locked:false,reason:null});
  assert.throws(()=>StartJoin.navLockState("shop"),error=>error instanceof TypeError&&error.message==="NAV_SCREEN_UNKNOWN");
  assert.equal(StartJoin.NAV_LOCK_TEXT,"Finish this step first");
  assert.equal(StartJoin.contractVersion,1);
});
check("2. Screen ids are real",()=>{
  const source=fs.readFileSync("js/screens.js","utf8");
  for(const id of Object.keys(StartJoin.LOCKED_SCREENS))assert.match(source,new RegExp('"' + id + '"'));
});
check("3. Status",()=>{
  const variants=[
    [identity("daniel",{status:"offline"}),pair("playerOne"),"unavailable"],
    [identity("daniel",{registered:false}),pair("playerOne"),"unavailable"],
    [identity(null,{managerId:null}),pair(null,{managerRole:null,managerId:null}),"unavailable"],
    [identity("daniel"),pair("playerOne",{status:"unavailable"}),"unavailable"],
    [identity("daniel"),pair("playerOne",{status:"signed-out"}),"unavailable"],
    [identity("daniel"),pair("playerOne",{initialized:false}),"loading"],
    [identity("daniel"),pair("playerOne",{status:"idle"}),"loading"]
  ];
  for(const [identityState,pairState,status] of variants){
    const model=StartJoin.buildStartJoinViewModel({identity:identityState,pair:pairState,session:session("open"),nowEpochMs:500});
    models.push(model);
    assert.equal(model.status,status);
    assert.equal(model.pairing.state,"none");
    assert.equal(model.session.state,null);
    assert.deepEqual(model.primaryActions,[]);
    assert.deepEqual(model.moreActions,[]);
    for(const name of pairingNames)unavailable(model.pairing.actions[name]);
    for(const name of sessionNames)unavailable(model.session.actions[name]);
    unavailable(model.abandonShowdown);
  }
  assert.equal(build().status,"ready");
});
check("4. Daniel fresh start",()=>{
  for(const status of ["unpaired","save-required","error"]){
    const model=build("daniel",pair("playerOne",{status}));
    assert.equal(model.pairing.actions.createCode.available,true);
    assert.equal(model.pairing.actions.createCode.enabled,true);
    assert.deepEqual(model.pairing.actions.createCode.args,{managerRole:"playerOne"});
    unavailable(model.pairing.actions.join);
    assert.deepEqual(model.primaryActions,["pairing.createCode"]);
  }
});
check("5. Nik fresh start",()=>{
  const model=build("nik",pair("playerTwo"));
  assert.equal(model.pairing.actions.join.available,true);
  assert.equal(model.pairing.actions.join.provider,"pair.joinPairing");
  assert.deepEqual(model.pairing.actions.join.args,{managerRole:"playerTwo"});
  unavailable(model.pairing.actions.createCode);
  assert.deepEqual(model.primaryActions,["pairing.join"]);
});
check("6. Daniel code created",()=>{
  const model=build("daniel",pair("playerOne",{status:"waiting",connectionState:"pending-pair",capability}));
  assert.equal(model.pairing.state,"code-created");
  assert.equal(model.pairing.code,capability);
  for(const name of ["copyCode","newCode","checkStatus"])assert.equal(model.pairing.actions[name].available,true);
  assert.deepEqual(model.primaryActions,["pairing.copyCode","pairing.checkStatus"]);
});
check("7. Waiting for Nik",()=>{
  const model=build("daniel",pair("playerOne",{status:"waiting",connectionState:"pending-pair",capability:null}));
  assert.equal(model.pairing.state,"waiting-for-nik");
  assert.equal(model.pairing.code,null);
  assert.equal(model.pairing.actions.checkStatus.available,true);
  assert.equal(model.pairing.actions.copyCode.available,false);
  assert.equal(model.pairing.actions.newCode.available,false);
  assert.deepEqual(model.primaryActions,["pairing.checkStatus"]);
});
check("8. Nik never sees a code",()=>{
  const states=[
    pair("playerTwo",{connectionState:null,capability}),
    pair("playerTwo",{status:"waiting",connectionState:"pending-pair",capability}),
    pair("playerTwo",{status:"paired",connectionState:"active",capability})
  ];
  for(const state of states)assert.equal(build("nik",state).pairing.code,null);
});
check("9. Retry",()=>{
  const model=build("daniel",pair("playerOne",{status:"pair-link-retry"}));
  for(const name of pairingNames)assert.equal(model.pairing.actions[name].available,name==="retry");
  assert.equal(model.pairing.actions.retry.provider,"pair.retryPairLink");
  assert.deepEqual(model.primaryActions,["pairing.retry"]);
});
check("10. Paired, no session",()=>{
  const model=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}),null);
  assert.equal(model.pairing.state,"paired");
  assert.equal(model.session.state,null);
  assert.equal(model.session.actions.host.enabled,true);
  assert.equal(model.session.actions.join.enabled,true);
  assert.deepEqual(model.primaryActions,["session.host","session.join"]);
  assert.deepEqual(model.moreActions,[]);
});
check("11. Open session",()=>{
  const model=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}),session("open"),500);
  assert.equal(model.session.state,"open");
  assert.equal(model.session.actions.refresh.enabled,true);
  assert.equal(model.session.actions.revoke.enabled,true);
  assert.equal(model.session.actions.close.enabled,false);
  assert.equal(model.session.actions.forget.enabled,false);
  assert.equal(model.session.actions.host.enabled,false);
  assert.equal(model.session.actions.join.enabled,false);
  assert.deepEqual(model.primaryActions,["session.refresh"]);
  assert.deepEqual(model.moreActions,["session.revoke","session.close","session.forget"]);
});
check("12. Active session",()=>{
  const model=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}),session("active"),500);
  assert.equal(model.session.state,"active");
  assert.equal(model.session.actions.close.enabled,true);
  assert.equal(model.session.actions.revoke.enabled,false);
});
check("13. Expired by clock",()=>{
  const expired=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}),session("open"),1000);
  assert.equal(expired.session.state,"expired");
  assert.equal(expired.session.actions.revoke.enabled,false);
  assert.equal(expired.session.actions.close.enabled,false);
  assert.equal(expired.session.actions.forget.enabled,true);
  assert.equal(expired.session.actions.host.enabled,true);
  assert.equal(expired.session.actions.join.enabled,true);
  const live=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}),session("open"),999);
  assert.equal(live.session.state,"open");
});
check("14. Unresolved request",()=>{
  const model=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}),session("unresolved",{pendingAction:"host"}),500);
  assert.equal(model.session.state,null);
  for(const name of ["host","join","refresh","forget"])assert.equal(model.session.actions[name].enabled,false);
});
check("15. Busy",()=>{
  const pairState=pair("playerOne",{status:"waiting",connectionState:"pending-pair",capability});
  const base=build("daniel",pairState,null,500);
  for(const variant of [
    {identityState:identity("daniel",{busy:true}),pairState,sessionState:null},
    {identityState:identity("daniel"),pairState:{...pairState,busy:true},sessionState:null},
    {identityState:identity("daniel"),pairState,sessionState:{busy:true}}
  ]){
    const model=StartJoin.buildStartJoinViewModel({identity:variant.identityState,pair:variant.pairState,session:variant.sessionState,nowEpochMs:500});
    models.push(model);
    for(let index=0;index<pairingNames.length;index+=1){
      const name=pairingNames[index],action=model.pairing.actions[name],baseAction=base.pairing.actions[name];
      assert.equal(action.available,baseAction.available);
      if(action.available)assert.equal(action.enabled,name==="copyCode");
    }
    for(const name of sessionNames)if(model.session.actions[name].available)assert.equal(model.session.actions[name].enabled,false);
    if(model.abandonShowdown.available)assert.equal(model.abandonShowdown.enabled,false);
    if(model.forgetThisDevice.available)assert.equal(model.forgetThisDevice.enabled,false);
  }
});
check("16. Abandon variants",()=>{
  const source=fs.readFileSync("js/persistentNikDanielPair.js","utf8");
  const normal=build("daniel",pair("playerOne",{status:"paired",connectionState:"active"}));
  assert.equal(normal.abandonShowdown.provider,"pair.abandonCurrentShowdown");
  assert.equal(normal.abandonShowdown.confirm,StartJoin.CONFIRM.abandon);
  assert.equal(normal.abandonShowdown.confirmedByProvider,false);
  const recovery=build("daniel",pair("playerOne",{status:"recovery-required",connectionState:"active"}));
  assert.equal(recovery.abandonShowdown.provider,"pair.startOver");
  assert.equal(recovery.abandonShowdown.confirmedByProvider,true);
  assert.ok(source.includes(recovery.abandonShowdown.confirm));
  assert.deepEqual(recovery.primaryActions,["abandonShowdown"]);
  const stale=build("nik",pair("playerTwo",{status:"waiting",connectionState:"pending-pair"}));
  assert.equal(stale.abandonShowdown.provider,"pair.discardStalePendingConnection");
  assert.equal(stale.abandonShowdown.confirmedByProvider,true);
  assert.ok(source.includes(stale.abandonShowdown.confirm));
  assert.deepEqual(stale.primaryActions,["abandonShowdown","pairing.checkStatus"]);
  unavailable(build("daniel",pair("playerOne")).abandonShowdown);
});
check("17. Forget this device",()=>{
  for(const status of ["ready","offline"]){
    const model=StartJoin.buildStartJoinViewModel({identity:identity("daniel",{status}),pair:pair("playerOne"),session:null,nowEpochMs:500});
    models.push(model);
    assert.equal(model.forgetThisDevice.available,true);
    assert.ok(model.forgetThisDevice.confirm);
    assert.equal(model.forgetThisDevice.confirmedByProvider,false);
  }
});
check("18. Providers exist and destructive actions confirm",()=>{
  const exportsByPrefix={pair:Pair,session:Session,identity:Identity};
  for(const model of models){
    for(const action of allActions(model)){
      if(!action.available)continue;
      if(action.provider!=="clipboard.pairingCode"){
        const [prefix,name]=action.provider.split(".");
        assert.equal(typeof exportsByPrefix[prefix]?.[name],"function",action.provider+" must exist");
      }
    }
    for(const action of [model.abandonShowdown,model.forgetThisDevice,model.session.actions.revoke,model.session.actions.close,model.session.actions.forget]){
      if(action.available)assert.equal(typeof action.confirm==="string"&&action.confirm.length>0,true);
    }
    for(const id of [...model.primaryActions,...model.moreActions])assert.equal(actionById(model,id).available,true,id+" must name an available action");
  }
});
check("19. No leaks",()=>{
  const secrets=["acct_test","device_test",saveId,profileId,sessionId,pairId,"provider text"];
  for(const model of models){
    const safe=clone(model);
    safe.pairing.code=null;
    const text=JSON.stringify(safe);
    for(const secret of secrets)assert.equal(text.includes(secret),false,"leaked "+secret);
  }
});
check("20. Pure and frozen",()=>{
  const input={identity:identity("daniel"),pair:pair("playerOne",{status:"paired",connectionState:"active"}),session:session("closed"),nowEpochMs:500};
  const before=clone(input),one=StartJoin.buildStartJoinViewModel(input),two=StartJoin.buildStartJoinViewModel(input);
  function frozen(value){if(value&&typeof value==="object"){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);}}
  frozen(one);
  frozen(StartJoin.navLockState("dashboard"));
  assert.deepEqual(one,two);
  assert.deepEqual(input,before);
  const source=fs.readFileSync("js/startJoinViewModel.js","utf8");
  assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|window\.|document|Date\.now|Math\.random|confirm\(/);
  const context=vm.createContext({});
  vm.runInContext(source,context);
  assert.equal(typeof context.CareerModeStartJoinViewModel.buildStartJoinViewModel,"function");
});

console.log("PASS Start/Join view model contracts (20/20 cases): lock table, status, pairing/session actions, confirms, privacy, purity and frozen outputs.");
