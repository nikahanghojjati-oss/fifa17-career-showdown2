"use strict";
// Career Start READY reuse (CI run 37236653129, J8.3). Shared Season Results publish -> Transfer refresh -> Career Start refresh
// re-read the Career Start ledger on every call. That read is a transaction plus a nested Shared Setup transaction; when it failed
// once (the emulator answered a contended Rules get() with permission-denied), the manager's publish failed with
// "Career Start could not be read." even though Career Start had been READY for the whole season.
// CAREER_START_READY is final for one confirmed Shared Setup, and the Transfer and Season Result providers re-check it inside
// their own transactions, so the wrapper reuses a READY view for the exact same Setup and only reads again when it must.
//   CS1  the first refresh reads the provider and shows READY.
//   CS2  later refreshes for the same confirmed Setup reuse READY with no provider read, even if a read would now fail.
//   CS3  a different Setup (another rivalry, or a different confirmed Setup) reads again and still surfaces a failed read.
//   CS4  a Career Start that is not READY yet reads on every refresh (no reuse before both managers acknowledged).
//   CS5  an unconfirmed Shared Setup never reuses READY; the existing "finish Shared Setup" gate still applies.
//   CS6  an acknowledgement that reaches READY is reused the same way.
//   CS7  the Transfer wrapper still checks Career Start READY before its read, and both providers re-check it server-side.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RIVALRY="pair_"+"7".repeat(64),OTHER_RIVALRY="pair_"+"8".repeat(64),SESSION="session_"+"6".repeat(64),DEVICE="device_"+"1".repeat(32);
const SETUP=Object.freeze({phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",leagueId:"premier_league",clubs:{playerOne:"Arsenal",playerTwo:"Liverpool"},totalSeasons:3,confirmedRoles:["playerOne","playerTwo"],contentHash:"sha256:"+"a".repeat(64)});
const READY=Object.freeze({phase:"CAREER_START_READY",revision:2,acknowledgedRoles:["playerOne","playerTwo"]});
const ONE=Object.freeze({phase:"ONE_MANAGER_ACKNOWLEDGED",revision:1,acknowledgedRoles:["playerOne"]});
const ok=(state)=>({ok:true,revision:state?state.revision:0,state,managerRole:"playerTwo"});

function fakeDocument(){
  const nodes=[],byId=new Map();
  function node(){const classes=new Set();const n={id:"",children:[],dataset:{},className:"",textContent:"",type:"",disabled:false,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},setAttribute(){},removeAttribute(){},hasAttribute:()=>false,
    append(...c){n.children.push(...c);for(const child of c)if(child&&child.id)byId.set(child.id,child);},replaceChildren(){n.children=[];},
    addEventListener(type,fn){if(type==="click")n.onclick=fn;},querySelector:selector=>selector===".remoteJoiningBody"?find(n,"remoteJoiningBody"):null};nodes.push(n);return n;}
  function find(root,className){if(root.className===className)return root;for(const child of root.children){const hit=child&&find(child,className);if(hit)return hit;}return null;}
  const body=node();
  body.append=(...c)=>{for(const child of c){body.children.push(child);if(child.id)byId.set(child.id,child);}};
  return {document:{visibilityState:"visible",body,documentElement:node(),getElementById:id=>byId.get(id)||null,createElement:()=>node(),addEventListener(){}},nodes};
}

function harness(){
  const calls={read:0,acknowledge:0,setupRefresh:0};
  const dom=fakeDocument();
  const setupState={ready:true,setup:SETUP,managerRole:"playerTwo",rivalryId:RIVALRY,sessionId:SESSION,deviceId:DEVICE};
  const reads=[],acks=[];
  const provider={
    read:async()=>{calls.read+=1;const next=reads.shift();if(!next)throw new Error("unscripted Career Start read");return next;},
    acknowledge:async()=>{calls.acknowledge+=1;const next=acks.shift();if(!next)throw new Error("unscripted Career Start acknowledge");return next;}
  };
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise,Date,JSON,document:dom.document};
  sandbox.globalThis=sandbox;
  sandbox.CareerModeProductionSharedShowdownSetup={refresh:async()=>{calls.setupRefresh+=1;return setupState;},getState:()=>setupState};
  for(const name of ["CareerModeSharedShowdownSetup","CareerModeSharedShowdownCatalog","CareerModeSparkSharedShowdownSetup","CareerModeSharedCareerStart","CareerModeProductionSharedTransferChallenge"])sandbox[name]={};
  sandbox.CareerModeSparkSharedCareerStart=provider;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"nik"}},firestore:{},firestoreSdk:{}})};
  vm.createContext(sandbox);
  vm.runInContext(read("js/productionSharedCareerStart.js"),sandbox,{filename:"productionSharedCareerStart.js"});
  const api=sandbox.CareerModeProductionSharedCareerStart;
  assert.ok(api&&typeof api.refresh==="function","Career Start wrapper must load in the harness");
  return {api,calls,setupState,reads,acks,dom};
}

async function main(){
  // CS1 + CS2: one read, then READY is reused for the same Setup even when a read would fail.
  {
    const h=harness();h.reads.push(ok(READY));
    const first=await h.api.refresh();
    assert.equal(first.state.phase,"CAREER_START_READY","CS1 first refresh shows READY");
    assert.equal(h.calls.read,1,"CS1 first refresh reads the provider once");
    h.reads.push({ok:false,code:"permission-denied"});
    for(let i=0;i<3;i+=1){
      const again=await h.api.refresh();
      assert.equal(again&&again.state&&again.state.phase,"CAREER_START_READY","CS2 READY is reused for the same confirmed Setup");
    }
    assert.equal(h.calls.read,1,"CS2 no provider read while READY is known for the same Setup (a failing read must not block a publish)");
    assert.equal(h.api.getState().state.phase,"CAREER_START_READY","CS2 the visible state stays READY");
  }
  // CS3: another rivalry, or a different confirmed Setup, reads again and surfaces a failure.
  {
    const h=harness();h.reads.push(ok(READY));await h.api.refresh();
    h.setupState.rivalryId=OTHER_RIVALRY;
    h.reads.push({ok:false,code:"permission-denied"});
    await assert.rejects(h.api.refresh(),error=>error.message==="Career Start could not be read."&&error.code==="permission-denied","CS3 a new rivalry never reuses the old READY");
    assert.equal(h.calls.read,2,"CS3 a new rivalry reads the provider");
    h.setupState.rivalryId=RIVALRY;h.setupState.setup={...SETUP,contentHash:"sha256:"+"b".repeat(64)};
    h.reads.push(ok(READY));await h.api.refresh();
    assert.equal(h.calls.read,3,"CS3 a different confirmed Setup reads the provider");
    h.setupState.setup={...SETUP,contentHash:"sha256:"+"b".repeat(64)};
    await h.api.refresh();
    assert.equal(h.calls.read,3,"CS3 the same Setup content is reused again after that read");
  }
  // CS4: not READY yet -> every refresh reads.
  {
    const h=harness();h.reads.push(ok(ONE),ok(ONE),ok(null));
    await h.api.refresh();await h.api.refresh();await h.api.refresh();
    assert.equal(h.calls.read,3,"CS4 a Career Start that is not READY reads on every refresh");
  }
  // CS5: an unconfirmed Setup never reuses READY.
  {
    const h=harness();h.reads.push(ok(READY));await h.api.refresh();
    h.setupState.ready=false;
    await assert.rejects(h.api.refresh(),/Both managers must finish Shared Setup before Career Start\./,"CS5 an unconfirmed Setup keeps the finish-Setup gate");
    assert.equal(h.calls.read,1,"CS5 the gate fails before any provider read");
  }
  // CS6: an acknowledgement that reaches READY is reused.
  {
    const h=harness();h.reads.push(ok(ONE),ok(ONE));h.acks.push(ok(READY));
    assert.equal(await h.api.openPanel(),true,"CS6 the Career Start panel opens");
    const confirm=h.dom.nodes.find(node=>/^I STARTED AT /.test(node.textContent)&&typeof node.onclick==="function");
    assert.ok(confirm,"CS6 the panel renders the acknowledgement button");
    confirm.onclick();
    for(let i=0;i<100&&h.api.getState()?.state?.phase!=="CAREER_START_READY";i+=1)await new Promise(resolve=>setTimeout(resolve,2));
    assert.equal(h.api.getState().state.phase,"CAREER_START_READY","CS6 acknowledgement records READY");
    assert.equal(h.calls.acknowledge,1,"CS6 one acknowledgement write");
    const afterAck=h.calls.read;
    await h.api.refresh();await h.api.refresh();
    assert.equal(h.calls.read,afterAck,"CS6 READY reached by acknowledgement is reused with no further read");
  }
  // CS7: the dependent wrappers and providers still enforce READY.
  {
    const transfer=read("js/productionSharedTransferChallenge.js");
    assert.match(transfer,/await careerApi\.refresh\(\);[\s\S]{0,200}const career=careerApi\.getState\(\);\s*if\(!career\|\|!career\.state\|\|career\.state\.phase!=="CAREER_START_READY"\|\|career\.state\.revision!==2\)pstcFail\("TRANSFER_CAREER_START_NOT_READY"/,"CS7 Transfer still requires Career Start READY before its read");
    for(const file of ["js/sparkSharedTransferChallenge.js","js/sparkSharedSeasonResults.js"]){
      const source=read(file);
      assert.match(source,/"careerStart","authoritative"/,`CS7 ${file} reads Career Start inside its own transaction`);
      assert.match(source,/CAREER_START_READY/,`CS7 ${file} re-checks CAREER_START_READY server-side`);
    }
    const career=read("js/productionSharedCareerStart.js");
    assert.match(career,/if\(pcstReady\(\)&&readyKey&&pcstConfirmed\(\)&&readyKey===pcstSetupKey\(pcstSetupState\(\)\)\)return Promise\.resolve\(view\);/,"CS7 reuse requires READY, a confirmed Setup and the exact same Setup key");
    assert.match(career,/readyKey=pcstReady\(\)\?pcstSetupKey\(state\):""/,"CS7 the reuse key is cleared whenever the view is not READY");
  }
  console.log("PASS Career Start READY reuse contracts: 7 numbered checks (CS1-CS7) - READY is read once per confirmed Setup and reused by Transfer and Season Results, a failing re-read no longer blocks a publish, and a new Setup, an unfinished Career Start or an unconfirmed Setup still read or gate as before.");
}

main().catch(error=>{console.error(error);process.exitCode=1;});
