"use strict";
// Job 21: simultaneous taps. When both managers write the same shared ledger at once, the loser's Firestore transaction is
// rejected by the Rules with `permission-denied` (or by the provider with STALE / PHASE_INVALID / ALREADY_* codes). The three
// UI wrappers (Transfer Challenge, Career Start, Shared Setup) must re-read and retry the same step ONCE, stay silent when the
// refreshed state already shows the outcome, never loop more than once, and still surface a real denial after that one retry.
//   A. Transfer Challenge: retry once with a fresh baseRevision and a new operationId; advanceExpiredWindow only refreshes.
//   B. Career Start acknowledge: permission-denied is treated like a stale revision (re-read, retry once, silent if done).
//   C. Shared Setup mutate: same, including the "already shown" silent finish.
//   E. Job 22: LOCK MY GUESSES / LOCK MY SIGNINGS ask before locking a partly filled form (cancel = no provider call; full form or no confirm = lock as before).
//   D. Human validation messages are shown before raw codes; signing name inputs are capped at 80; stale commit copy is gone.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"7".repeat(64),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32),ACCOUNT="account_one";
async function settle(){for(let pass=0;pass<3;pass+=1){await new Promise(resolve=>setTimeout(resolve,10));for(let i=0;i<40;i+=1)await new Promise(resolve=>setImmediate(resolve));}}
const clone=value=>JSON.parse(JSON.stringify(value));

// ---------------------------------------------------------------- A. Transfer Challenge wrapper
function transferHarness(initial,confirmFn){
  const server={revision:initial.revision,state:clone(initial.state)};
  const calls={read:0,mutations:[]},nodes=new Map(),handlers={},intervals=[];
  const scripts={};
  function node(id){
    if(!nodes.has(id)){
      const classes=new Set(id==="transferChallenge"?[]:["hidden"]);
      const n={id,value:"",textContent:"",disabled:false,dataset:{},attributes:{},className:"",placeholder:"",
        classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle:(c,force)=>{const want=force===undefined?!classes.has(c):Boolean(force);if(want)classes.add(c);else classes.delete(c);return want;}},
        setAttribute(k,v){n.attributes[k]=String(v);},removeAttribute(k){delete n.attributes[k];},hasAttribute:k=>Object.hasOwn(n.attributes,k),addEventListener(){},append(){},replaceChildren(){},
        closest:()=>node(`closest:${id}`),querySelectorAll:()=>[],querySelector:()=>node(`query:${id}`)};
      nodes.set(id,n);
    }
    return nodes.get(id);
  }
  const document={visibilityState:"visible",getElementById:node,querySelector:selector=>node(`sel:${selector}`),querySelectorAll:()=>[],addEventListener(type,fn){handlers[type]=fn;},createElement:()=>node(`created:${nodes.size}`)};
  function projection(){return {ok:true,revision:server.revision,state:clone(server.state),managerRole:"playerOne",seasonNumber:1,ownInputs:null,opponentInputs:null,verdicts:null};}
  const provider={read:async()=>{calls.read+=1;return projection();}};
  for(const method of ["startWindow","requestEndWindow","advanceExpiredWindow","lockGuesses","lockSignings"]){
    scripts[method]=[];
    provider[method]=async options=>{calls.mutations.push({method,baseRevision:options.baseRevision,operationId:options.operationId});const step=scripts[method].shift();if(!step)throw new Error(`unscripted ${method} call`);return step(options);};
  }
  const sandbox={console,crypto:webcrypto,performance,setTimeout,clearTimeout,Promise,Date,document};
  if(confirmFn)sandbox.confirm=confirmFn;
  sandbox.globalThis=sandbox;sandbox.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length;};
  sandbox.currentShowdown={id:"save_1",sharedJourney:{mode:"shared",rivalryId:RIVALRY},currentRound:1};
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>null,getState:()=>({ready:true,managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",clubs:{playerOne:"A",playerTwo:"B"}}})};
  sandbox.CareerModeProductionSharedCareerStart={refresh:async()=>null,getState:()=>({state:{phase:"CAREER_START_READY",revision:2}})};
  sandbox.CareerModeSharedTransferChallenge={};sandbox.CareerModeSparkSharedTransferChallenge=provider;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{getIdTokenResult:async()=>({issuedAtTime:new Date().toUTCString()})}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedTransferChallenge.js").replace(/^\(function\(root,factory\)\{[\s\S]*?\}\)\(typeof globalThis/,"(function(root,factory){root.CareerModeProductionSharedTransferChallenge=factory(root);})(typeof globalThis"),sandbox,{filename:"productionSharedTransferChallenge.js"});
  const api=sandbox.CareerModeProductionSharedTransferChallenge;
  assert.ok(api&&typeof api.install==="function","Transfer wrapper must load in the harness");
  async function tap(id){
    assert.equal(typeof handlers.click,"function","install() must register the click capture");
    await handlers.click({target:{id,closest:()=>({id})},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}});
    await settle();
  }
  const accepted=(next,patch={})=>options=>{server.revision+=1;Object.assign(server.state,patch);return {ok:true,status:"accepted",revision:server.revision,state:clone(server.state),managerRole:"playerOne",seasonNumber:1,needsRefresh:false};};
  return {api,server,calls,scripts,node,tap,accepted,intervals,error:()=>node("transferChallengeError").textContent};
}
const windowOpen=(patch={})=>({revision:2,state:{seasonNumber:1,coordinatorRole:"playerOne",phase:"WINDOW_OPEN",revision:2,startedAtEpochMs:Date.now(),endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],...patch}});
const denied=code=>async()=>({ok:false,code});

async function transferContracts(){
  // A1. permission-denied (the other manager wrote first): re-read and retry once with a fresh base revision and a new operation id.
  {
    const h=transferHarness(windowOpen());await h.api.refresh();
    h.scripts.requestEndWindow.push(async()=>{h.server.revision+=1;h.server.state.revision+=1;return {ok:false,code:"permission-denied"};},h.accepted(null,{endRequestedRoles:["playerOne","playerTwo"],phase:"GUESS_ENTRY"}));
    h.api.install();await h.tap("endTransferTimer");
    assert.equal(h.calls.mutations.length,2,"a lost race must be retried exactly once");
    assert.ok(h.calls.mutations[1].baseRevision>h.calls.mutations[0].baseRevision,"the retry must use a fresh baseRevision");
    assert.notEqual(h.calls.mutations[1].operationId,h.calls.mutations[0].operationId,"the retry must use a new operationId");
    assert.equal(h.error(),"","a retry that succeeds must not show an error");
  }
  // A2. Provider STALE code is treated the same way.
  {
    const h=transferHarness(windowOpen());await h.api.refresh();
    h.scripts.requestEndWindow.push(async()=>{h.server.revision+=1;return {ok:false,code:"TRANSFER_STALE_BASE_REVISION"};},h.accepted(null,{phase:"GUESS_ENTRY"}));
    h.api.install();await h.tap("endTransferTimer");
    assert.equal(h.calls.mutations.length,2);assert.equal(h.error(),"");
  }
  // A3. A real denial surfaces after the single retry and never loops.
  {
    const h=transferHarness(windowOpen());await h.api.refresh();
    h.scripts.requestEndWindow.push(denied("permission-denied"),denied("permission-denied"),denied("permission-denied"));
    h.api.install();await h.tap("endTransferTimer");
    assert.equal(h.calls.mutations.length,2,"a real denial must be tried at most twice (one retry), never looped");
    assert.equal(h.error(),"permission-denied","a real denial must still be visible after the one retry");
  }
  // A4. The refreshed state already shows the outcome (partner already moved the phase on): silent, no second write.
  {
    const h=transferHarness({revision:3,state:{...windowOpen().state,phase:"GUESS_ENTRY",revision:3,endRequestedRoles:["playerOne","playerTwo"]}});
    // The page still believes WINDOW_OPEN (stale view): rebuild view from a window-open read, then the server moves on.
    const stale=transferHarness(windowOpen());await stale.api.refresh();
    stale.server.revision=3;stale.server.state={...stale.server.state,phase:"GUESS_ENTRY",revision:3,endRequestedRoles:["playerOne","playerTwo"]};
    stale.scripts.requestEndWindow.push(denied("TRANSFER_PHASE_INVALID"));
    stale.api.install();await stale.tap("endTransferTimer");
    assert.equal(stale.calls.mutations.length,1,"when the refreshed phase already moved past the action there is no second write");
    assert.equal(stale.error(),"","a lost race whose outcome is already visible must be silent");
    assert.equal(stale.api.getState().state.phase,"GUESS_ENTRY","the view must show the refreshed phase");
    void h;
  }
  // A5. lockGuesses lost to the partner finishing the phase: silent refresh.
  {
    const h=transferHarness({revision:3,state:{...windowOpen().state,phase:"GUESS_ENTRY",revision:3,guessLockedRoles:["playerTwo"]}});h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
    h.scripts.lockGuesses.push(async()=>{h.server.revision=4;h.server.state={...h.server.state,guessLockedRoles:["playerTwo","playerOne"],phase:"SIGNING_ENTRY",revision:4};return {ok:false,code:"permission-denied"};});
    h.api.install();await h.tap("completeTransferChallenge");
    assert.equal(h.calls.mutations.length,1);assert.equal(h.error(),"");assert.equal(h.api.getState().state.phase,"SIGNING_ENTRY");
  }
  // A6. advanceExpiredWindow: never retried, never shows an error; it just refreshes.
  for(const code of ["permission-denied","firestore/permission-denied","TRANSFER_PHASE_INVALID"]){
    const h=transferHarness(windowOpen({startedAtEpochMs:Date.now()-16*60*1000}));
    h.scripts.advanceExpiredWindow.push(async()=>{h.server.revision=3;h.server.state={...h.server.state,phase:"GUESS_ENTRY",revision:3};return {ok:false,code};});
    h.api.install();await h.api.refresh();await settle();
    const attempts=h.calls.mutations.filter(call=>call.method==="advanceExpiredWindow");
    assert.equal(attempts.length,1,`advanceExpiredWindow must not retry after ${code}`);
    assert.equal(h.error(),"",`advanceExpiredWindow must stay silent after ${code}`);
    assert.equal(h.api.getState().state.phase,"GUESS_ENTRY",`advanceExpiredWindow must refresh the view after ${code}`);
  }
  // D1. A human validation sentence is shown before the raw code.
  {
    const h=transferHarness({revision:3,state:{...windowOpen().state,phase:"GUESS_ENTRY",revision:3}});h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
    h.node("p2Guess1Type").value="league";
    h.api.install();await h.tap("completeTransferChallenge");
    assert.match(h.error(),/^Complete guess 1 with a FIFA 17 league or nationality\.$/,"the validation sentence must be shown, not TRANSFER_GUESSES_INVALID");
    assert.equal(h.calls.mutations.length,0,"an invalid form must not reach the provider");
  }
  // D2. Provider codes are still shown as codes (the generic wrapper sentence is not more useful than the code).
  {
    const h=transferHarness(windowOpen());await h.api.refresh();
    h.scripts.requestEndWindow.push(denied("TRANSFER_COORDINATOR_REQUIRED"));
    h.api.install();await h.tap("endTransferTimer");
    assert.equal(h.error(),"TRANSFER_COORDINATOR_REQUIRED");
  }
  // D3. Signing name inputs are capped at the provider's 80 characters (set from this lazy module; index.html is in the startup budget).
  {
    const h=transferHarness(windowOpen());await h.api.refresh();
    for(const id of ["p1Signing1Name","p1Signing3Name","p2Signing2Name"])assert.equal(h.node(id).attributes.maxlength,"80",`${id} must be capped at 80`);
  }
  // E. Job 22: a partial lock asks first (a lock cannot be undone); a full lock, or a page without confirm, locks as before.
  {
    const guessState=()=>({revision:3,state:{...windowOpen().state,phase:"GUESS_ENTRY",revision:3}});
    const signingState=()=>({revision:3,state:{...windowOpen().state,phase:"SIGNING_ENTRY",revision:3}});
    const fillGuesses=(h,count)=>{for(let i=1;i<=count;i+=1){h.node(`p2Guess${i}Type`).value="league";const v=h.node(`p2Guess${i}Value`);v.value=`League ${i}`;v.dataset.canonicalId=`league_${i}`;}};
    const fillSignings=(h,count)=>{for(let i=1;i<=count;i+=1){h.node(`p1Signing${i}Name`).value=`Player ${i}`;h.node(`p1Signing${i}League`).value=`League ${i}`;h.node(`p1Signing${i}League`).dataset.canonicalId=`league_${i}`;h.node(`p1Signing${i}Nationality`).value=`Nation ${i}`;h.node(`p1Signing${i}Nationality`).dataset.canonicalId=`nation_${i}`;}};
    for(const kind of ["guesses","signings"]){
      const method=kind==="guesses"?"lockGuesses":"lockSignings",initial=kind==="guesses"?guessState:signingState,fill=kind==="guesses"?fillGuesses:fillSignings;
      // E1. Partial lock, confirm returns false: no provider call, no error.
      {
        const asked=[],h=transferHarness(initial(),message=>{asked.push(message);return false;});h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
        h.scripts[method].push(h.accepted(null,{}));
        h.api.install();fill(h,1);await h.tap("completeTransferChallenge");
        assert.equal(asked.length,1,`E1 ${kind}: a partial lock must ask once`);
        assert.equal(asked[0],`Lock 1 of 3 ${kind}? You can't change them after locking.`,`E1 ${kind}: plain confirm text`);
        assert.equal(h.calls.mutations.length,0,`E1 ${kind}: cancelling must make no provider call`);
        assert.equal(h.error(),"",`E1 ${kind}: cancelling must not show an error`);
      }
      // E2. Partial lock, confirm returns true: locks with the filled rows only.
      {
        const asked=[],h=transferHarness(initial(),message=>{asked.push(message);return true;});h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
        h.scripts[method].push(h.accepted(null,{}));
        h.api.install();fill(h,2);await h.tap("completeTransferChallenge");
        assert.equal(asked.length,1,`E2 ${kind}: asked once`);assert.equal(asked[0],`Lock 2 of 3 ${kind}? You can't change them after locking.`);
        assert.equal(h.calls.mutations.length,1,`E2 ${kind}: confirming must lock`);assert.equal(h.calls.mutations[0].method,method);
      }
      // E3. Blank form is a partial lock too (0 of 3) and asks.
      {
        const asked=[],h=transferHarness(initial(),message=>{asked.push(message);return false;});h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
        h.api.install();await h.tap("completeTransferChallenge");
        assert.equal(asked.length,1);assert.equal(asked[0],`Lock 0 of 3 ${kind}? You can't change them after locking.`);assert.equal(h.calls.mutations.length,0);
      }
      // E4. Full lock never calls confirm.
      {
        let asked=0;const h=transferHarness(initial(),()=>{asked+=1;return false;});h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
        h.scripts[method].push(h.accepted(null,{}));
        h.api.install();fill(h,3);await h.tap("completeTransferChallenge");
        assert.equal(asked,0,`E4 ${kind}: a full lock must not prompt`);assert.equal(h.calls.mutations.length,1,`E4 ${kind}: a full lock locks`);
      }
      // E5. No confirm function: the partial lock works as before.
      {
        const h=transferHarness(initial());h.node("transferChallenge").classList.add("hidden");await h.api.refresh();
        h.scripts[method].push(h.accepted(null,{}));
        h.api.install();fill(h,1);await h.tap("completeTransferChallenge");
        assert.equal(h.calls.mutations.length,1,`E5 ${kind}: without confirm the lock works as before`);assert.equal(h.error(),"");
      }
    }
  }
}

// ---------------------------------------------------------------- B. Career Start wrapper
function createDom(){
  class El{
    constructor(tag){this.tagName=String(tag).toUpperCase();this.children=[];this.parent=null;this.id="";this.className="";this.ownText="";this.dataset={};this.attributes={};this.listeners={};this.disabled=false;this.type="";this.title="";
      const self=this;this.classList={add:(...c)=>{const s=new Set(self.className.split(/\s+/).filter(Boolean));c.forEach(x=>s.add(x));self.className=[...s].join(" ");},remove:(...c)=>{self.className=self.className.split(/\s+/).filter(x=>x&&!c.includes(x)).join(" ");},contains:c=>self.className.split(/\s+/).includes(c),toggle:()=>false};}
    get textContent(){return this.ownText+this.children.map(c=>c.textContent).join("");}
    set textContent(v){this.ownText=v==null?"":String(v);this.children=[];}
    append(...nodes){for(let n of nodes){if(typeof n==="string"){const t=new El("#text");t.ownText=n;n=t;}if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);n.parent=this;this.children.push(n);}}
    replaceChildren(...nodes){for(const c of this.children)c.parent=null;this.children=[];this.append(...nodes);}
    addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
    setAttribute(k,v){this.attributes[k]=String(v);}removeAttribute(k){delete this.attributes[k];}
    all(){return this.children.flatMap(c=>[c,...c.all()]);}
    querySelector(sel){if(sel===".remoteJoiningBody")return this.all().find(n=>n.classList.contains("remoteJoiningBody"))||null;return null;}
  }
  const documentElement=new El("html"),body=new El("body");documentElement.append(body);
  return {El,documentElement,body,createElement:tag=>new El(tag),getElementById:id=>documentElement.all().find(n=>n.id===id)||null,querySelector:()=>null,addEventListener(){}};
}
const SETUP_STATE={ready:true,managerRole:"playerOne",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons:1,confirmedRoles:["playerOne","playerTwo"]}};
async function careerStartContracts(){
  function harness(serverStates){
    const calls={acks:[]};let readIndex=0;
    const document=createDom();
    const view=state=>({ok:true,revision:state.revision,state,managerRole:"playerOne"});
    const provider={
      read:async()=>view(serverStates[Math.min(readIndex++,serverStates.length-1)]),
      acknowledge:async options=>{calls.acks.push({baseRevision:options.baseRevision,operationId:options.operationId});const step=harness.script.shift();return step();}
    };
    const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date,document,MutationObserver:class{observe(){}}};sandbox.globalThis=sandbox;
    sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>SETUP_STATE,getState:()=>SETUP_STATE};
    sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={};sandbox.CareerModeSparkSharedShowdownSetup={};sandbox.CareerModeSharedCareerStart={};
    sandbox.CareerModeSparkSharedCareerStart=provider;sandbox.CareerModeProductionSharedTransferChallenge={install(){},open:async()=>true};
    sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:ACCOUNT}},firestore:{},firestoreSdk:{}})};
    vm.createContext(sandbox);
    vm.runInContext(read("js/productionSharedCareerStart.js").replace(/^\(function\(root,factory\)\{[\s\S]*?\}\)\(typeof globalThis/,"(function(root,factory){root.CareerModeProductionSharedCareerStart=factory(root);})(typeof globalThis"),sandbox,{filename:"productionSharedCareerStart.js"});
    const api=sandbox.CareerModeProductionSharedCareerStart;
    async function tapConfirm(){
      await api.openPanel();await settle();
      const button=document.documentElement.all().find(n=>n.tagName==="BUTTON"&&/^I STARTED AT/.test(n.textContent));
      assert.ok(button,"the I STARTED button must be rendered");
      for(const fn of button.listeners.click||[])fn();await settle();
      return document.documentElement.all().map(n=>n.ownText).filter(Boolean).join("\n");
    }
    return {api,calls,tapConfirm};
  }
  harness.script=[];
  const empty={phase:"WAITING_FOR_ACKNOWLEDGEMENTS",revision:0,acknowledgedRoles:[]};
  // B1. permission-denied then a fresh read still shows no acknowledgement: retry once and succeed silently.
  harness.script=[async()=>({ok:false,code:"permission-denied"}),async()=>({ok:true,revision:1,state:{phase:"WAITING_FOR_ACKNOWLEDGEMENTS",revision:1,acknowledgedRoles:["playerOne"]},managerRole:"playerOne"})];
  let h=harness([empty,empty,empty,empty]);let text=await h.tapConfirm();
  assert.equal(h.calls.acks.length,2,"Career Start acknowledge must retry once after permission-denied");
  assert.ok(h.calls.acks[1].baseRevision>=h.calls.acks[0].baseRevision);assert.ok(!/NOT RECORDED/.test(text),"a recovered lost race must not show NOT RECORDED");
  // B2. The refreshed state already shows my acknowledgement (or READY): silent, no second write.
  harness.script=[async()=>({ok:false,code:"permission-denied"})];
  h=harness([empty,empty,{phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]}]);text=await h.tapConfirm();
  assert.equal(h.calls.acks.length,1,"no second write when the refreshed state already shows the outcome");assert.ok(!/NOT RECORDED/.test(text));
  // B3. A real denial surfaces after the single retry and never loops.
  harness.script=[async()=>({ok:false,code:"permission-denied"}),async()=>({ok:false,code:"permission-denied"}),async()=>({ok:false,code:"permission-denied"})];
  h=harness([empty,empty,empty,empty,empty]);text=await h.tapConfirm();
  assert.equal(h.calls.acks.length,2,"a real denial is tried at most twice");assert.match(text,/NOT RECORDED · permission-denied/,"a real denial must stay visible");
}

// ---------------------------------------------------------------- C. Shared Setup wrapper
async function setupContracts(){
  function harness({reads}){
    const calls={mutations:[],reads:0},script=[];
    const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise};sandbox.globalThis=sandbox;
    sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:ACCOUNT}},firestore:{},firestoreSdk:{}})};
    sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:ACCOUNT})};
    sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:DEVICE})};
    sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId:RIVALRY,binding:{managerRole:"playerOne"},accountId:ACCOUNT,deviceId:DEVICE})};
    sandbox.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId:SESSION,expiresAtEpochMs:Date.now()+3_600_000,rivalryId:RIVALRY,accountId:ACCOUNT,deviceId:DEVICE,role:"host",pendingAction:null})};
    sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={catalog:{}};
    sandbox.CareerModeSparkSharedShowdownSetup={
      read:async()=>{const item=reads[Math.min(calls.reads,reads.length-1)];calls.reads+=1;return {ok:true,status:item?"ready":"empty",revision:item?item.revision:0,state:item};},
      mutate:async request=>{calls.mutations.push({type:request.type,baseRevision:request.baseRevision,operationId:request.operationId});return script.shift()();}
    };
    sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_intent,write)=>write()};
    vm.createContext(sandbox);vm.runInContext(read("js/productionSharedShowdownSetup.js"),sandbox,{filename:"productionSharedShowdownSetup.js"});
    return {api:sandbox.CareerModeProductionSharedShowdownSetup,calls,script};
  }
  const base=revision=>({phase:"SEASON_LENGTH_COMMITTED",revision,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},totalSeasons:3,confirmedRoles:[]});
  const confirmed=(revision,roles)=>({...base(revision),confirmedRoles:roles});
  // C1. permission-denied, refreshed state not yet showing my confirmation: retry once with a fresh revision/operation id.
  let h=harness({reads:[base(4),base(4),confirmed(5,["playerTwo"]),confirmed(5,["playerTwo"])]});
  h.script.push(async()=>({ok:false,code:"permission-denied"}),async()=>({ok:true,revision:6,state:confirmed(6,["playerTwo","playerOne"])}));
  await h.api.refresh();let result=await h.api.mutate("confirm");
  assert.equal(h.calls.mutations.length,2,"Setup confirm must retry once after permission-denied");
  assert.ok(h.calls.mutations[1].baseRevision>h.calls.mutations[0].baseRevision,"fresh baseRevision on the retry");assert.notEqual(h.calls.mutations[1].operationId,h.calls.mutations[0].operationId);
  assert.equal(result.status,"ready","a recovered lost race must end in the ready state");assert.equal(h.api.getState().revision,6);
  // C2. SETUP_STALE_BASE_REVISION is retried the same way.
  h=harness({reads:[base(4),base(5),base(5)]});h.script.push(async()=>({ok:false,code:"SETUP_STALE_BASE_REVISION"}),async()=>({ok:true,revision:6,state:confirmed(6,["playerOne"])}));
  await h.api.refresh();result=await h.api.mutate("confirm");assert.equal(h.calls.mutations.length,2);assert.equal(result.status,"ready");
  // C3. The refreshed Setup already shows my confirmation: silent success, no second write.
  h=harness({reads:[base(4),base(4),confirmed(5,["playerOne"])]});h.script.push(async()=>({ok:false,code:"permission-denied"}));
  await h.api.refresh();result=await h.api.mutate("confirm");
  assert.equal(h.calls.mutations.length,1,"no second write when the refreshed Setup already shows this step");assert.equal(result.status,"ready");assert.equal(h.api.getState().revision,5);assert.notEqual(h.api.getState().status,"error");
  // C4. A real denial surfaces after the one retry and never loops.
  h=harness({reads:[base(4)]});h.script.push(async()=>({ok:false,code:"permission-denied"}),async()=>({ok:false,code:"permission-denied"}),async()=>({ok:false,code:"permission-denied"}));
  await h.api.refresh();result=await h.api.mutate("confirm");
  assert.equal(h.calls.mutations.length,2,"a real denial is tried at most twice");assert.equal(result.ok,false);assert.equal(result.code,"permission-denied");assert.equal(h.api.getState().status,"error");
  // C5. Unrelated codes are not retried.
  h=harness({reads:[base(4)]});h.script.push(async()=>({ok:false,code:"SETUP_ACTOR_NOT_ENTITLED"}));
  await h.api.refresh();result=await h.api.mutate("confirm");assert.equal(h.calls.mutations.length,1);assert.equal(result.code,"SETUP_ACTOR_NOT_ENTITLED");
}

// ---------------------------------------------------------------- D. Source pins
function sourceContracts(){
  const commit=read("js/productionSharedSeasonCommit.js");
  assert.ok(!/SCORING REMAINS LOCKED FOR THE NEXT CAPABILITY/.test(commit),"stale 'scoring remains locked' copy must be gone");
  assert.ok(commit.includes('"SEASON COMMITTED · SCORE BELOW"'),"after both acknowledged the commit panel must point at the score below");
  for(const file of ["js/productionSharedTransferChallenge.js","js/productionSharedCareerStart.js","js/productionSharedShowdownSetup.js"])assert.ok(/permission-denied/.test(read(file)),`${file} must handle a lost-race permission-denied`);
}

const watchdog=setTimeout(()=>{console.error("shared-tap-race: a promise never settled");process.exit(1);},60000);
(async()=>{
  await transferContracts();await careerStartContracts();await setupContracts();sourceContracts();
  clearTimeout(watchdog);
  console.log("PASS Shared tap race contracts: Transfer Challenge, Career Start and Shared Setup retry a lost simultaneous tap once with a fresh revision, stay silent when the refreshed state already shows the outcome (advanceExpiredWindow only refreshes), surface a real denial after one retry, and show validation sentences before raw codes.");
})().catch(error=>{console.error(error);process.exit(1);});
