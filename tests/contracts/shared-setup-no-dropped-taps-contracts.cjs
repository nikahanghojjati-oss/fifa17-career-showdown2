const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {webcrypto}=require("node:crypto");

// r49 regression: Nik and Daniel had to tap the league wheel / club packs / confirm twice. The
// production Setup adapter answered every tap that arrived while any module's background refresh
// was in flight (every 2.5-15s) with SHARED_SETUP_BUSY, silently. A tap must now wait for the
// in-flight refresh and then perform exactly one write.
const root=path.resolve(__dirname,"../..");
const R="pair_"+"7".repeat(64),S="session_"+"6".repeat(64),D="device_"+"1".repeat(32),U="account_one";

function sandboxWithStubs({hangFirstRead=true,waitMs=null}={}){
  const calls={reads:0,mutations:[]};let releaseRead=null;
  const sandbox={console,crypto:webcrypto,setTimeout,clearTimeout,Promise};sandbox.globalThis=sandbox;if(waitMs)sandbox.CMS_SETUP_REFRESH_WAIT_MS=waitMs;
  sandbox.CareerModeProductionFirebaseRuntime={ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:U}},firestore:{},firestoreSdk:{}})};
  sandbox.CareerModeSparkConnectedAccount={initialize:async()=>true,getState:()=>({connected:true,accountId:U})};
  sandbox.CareerModeSparkPrivatePairing={initialize:async()=>true,getState:()=>({registered:true,deviceId:D})};
  sandbox.CareerModeSparkConnectedRivalry={initialize:async()=>true,getState:()=>({attached:true,rivalryId:R,binding:{managerRole:"playerOne"},accountId:U,deviceId:D})};
  sandbox.CareerModeSparkRemoteJoining={getState:()=>({sessionState:"active",sessionId:S,expiresAtEpochMs:Date.now()+3_600_000,rivalryId:R,accountId:U,deviceId:D,role:"host",pendingAction:null})};
  sandbox.CareerModeSharedShowdownSetup={};sandbox.CareerModeSharedShowdownCatalog={catalog:{}};
  sandbox.CareerModeSparkSharedShowdownSetup={
    read:async()=>{calls.reads+=1;if(hangFirstRead&&calls.reads===1)await new Promise(resolve=>{releaseRead=resolve;});return {ok:true,status:"empty",revision:0,state:null};},
    mutate:async request=>{calls.mutations.push(request.type);return {ok:true,revision:1,state:{phase:"SHARED_SETUP_OPEN",revision:1}};}
  };
  sandbox.CareerModeProductionSharedJourneyConflicts={execute:async(_intent,write)=>write()};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,"js/productionSharedShowdownSetup.js"),"utf8"),sandbox,{filename:"productionSharedShowdownSetup.js"});
  return {api:sandbox.CareerModeProductionSharedShowdownSetup,calls,release:()=>releaseRead&&releaseRead()};
}

const watchdog=setTimeout(()=>{console.error('shared-setup-no-dropped-taps: a promise never settled');process.exit(1);},15000);
(async()=>{
  const {api,calls,release}=sandboxWithStubs();
  assert.ok(api&&typeof api.refresh==="function"&&typeof api.mutate==="function","production Setup adapter must install on the page global");

  // A background refresh is in flight when the manager taps.
  const background=api.refresh();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.reads,1,"the background refresh must be reading");
  const secondRefresh=api.refresh();
  assert.equal(secondRefresh,background,"concurrent background refreshes must coalesce into one read");

  const tap=api.mutate("open");
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(calls.mutations,[],"the write must wait for the in-flight refresh, not race it");
  release();
  const result=await tap;
  assert.notEqual(result?.code,"SHARED_SETUP_BUSY","a tap during a background refresh must never be dropped as SHARED_SETUP_BUSY");
  assert.equal(result?.status,"ready",`the waited tap must succeed and return the accepted Setup state (got ${result?.code||result?.status})`);assert.equal(result?.revision,1);
  assert.deepEqual(calls.mutations,["open"],"exactly one write must be performed for one tap");
  await background;

  // A second tap while the first write is still running is refused (never a duplicate write).
  const {api:api2,calls:calls2}=sandboxWithStubs({hangFirstRead:false});
  await api2.refresh();
  const first=api2.mutate("open"),duplicate=await api2.mutate("open");
  assert.equal(duplicate.code,"SHARED_SETUP_BUSY","a concurrent duplicate tap must not issue a second write");
  await first;assert.equal(calls2.mutations.length,1,"one write for two overlapping taps");

  // A refresh that starts during a write must not overwrite the write's newer state with a stale read.
  const {api:api3,calls:calls3}=sandboxWithStubs({hangFirstRead:false});await api3.refresh();
  const readsBefore=calls3.reads;const writing=api3.mutate("open");const during=await api3.refresh();
  assert.equal(calls3.reads,readsBefore+1,"a refresh during a write must not issue its own racing read (only the write's read)");
  assert.equal(during?.revision,1,"a refresh during a write must resolve with the write's accepted state, not the pre-write state");
  await writing;

  // A background read that never settles must not wedge taps forever: the write proceeds after the bound.
  const {api:api4,calls:calls4}=sandboxWithStubs({waitMs:300});
  api4.refresh();await new Promise(resolve=>setImmediate(resolve));
  const realSetTimeout=setTimeout;
  const hungTap=api4.mutate("open");
  // the bound is shortened to 300ms for this test via CMS_SETUP_REFRESH_WAIT_MS (production default 20s)
  const settled=await Promise.race([hungTap.then(()=>"settled"),new Promise(resolve=>realSetTimeout(()=>resolve("still-waiting"),3000))]);
  assert.equal(settled,"settled","a tap waiting on a hung refresh must proceed after the bounded wait");
  assert.deepEqual(calls4.mutations,["open"],"the bounded tap still performs exactly one write");

  clearTimeout(watchdog);
  console.log("PASS Shared Setup no-dropped-taps contracts: a tap during a background refresh waits and performs exactly one write, background refreshes coalesce, overlapping taps never duplicate a write, and a refresh during a write never races it.");
})().catch(error=>{console.error(error);process.exit(1);});
