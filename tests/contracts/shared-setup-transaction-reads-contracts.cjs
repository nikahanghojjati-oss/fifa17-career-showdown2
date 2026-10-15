"use strict";
// JOB-1804: SDK commits verify entries for transaction reads that were not written.
// Authority preflight must commit nothing; setup writes must read only their ledger.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {webcrypto}=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const R="pair_"+"a".repeat(64),S="session_"+"b".repeat(64);
const A="manager_one",B="manager_two",DA="device_"+"1".repeat(32),DB="device_"+"2".repeat(32);
const SETUP=`rivalries/${R}/sharedSetup/authoritative`,NOW=1_800_000_000_000;
const clone=value=>Array.isArray(value)?Array.from(value,clone):value&&typeof value==="object"?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,clone(item)])):value;

function world({budget=false,retry=false}={}){
  const documents=new Map(),calls=[];
  for(const [uid,deviceId] of [[A,DA],[B,DB]]){
    documents.set(`accounts/${uid}`,{objectType:"account",objectId:uid,lifecycleState:"live",data:{status:"active"}});
    documents.set(`accounts/${uid}/devices/${deviceId}`,{objectType:"device",objectId:deviceId,lifecycleState:"live",data:{deviceId,state:"active"}});
  }
  documents.set(`rivalries/${R}`,{objectType:"rivalry",objectId:R,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[A,B].map((uid,index)=>({slotId:index?"playerTwo":"playerOne",accountId:uid,profileId:"profile_"+String(index+1).repeat(24),saveId:"save_"+String(index+1).repeat(24),entitlementState:"active"}))}});
  documents.set(`rivalries/${R}/sessions/${S}`,{objectType:"session",objectId:S,lifecycleState:"live",data:{rivalryId:R,state:"active",hostAccountId:A,memberAccountIds:[A,B],expiresAt:{toMillis:()=>NOW+600000}}});
  let committed=0,denied=false,beforeWrite=null;
  const sandbox={console,crypto:webcrypto,TextEncoder};
  vm.createContext(sandbox);
  for(const file of ["sharedShowdownCatalog.js","sharedShowdownSetup.js","sparkSharedShowdownSetup.js"]){
    vm.runInContext(fs.readFileSync(path.join(ROOT,"js",file),"utf8"),sandbox,{filename:file});
  }
  const sdk={
    doc:(_db,...parts)=>({path:parts.join("/")}),
    serverTimestamp:()=>({toMillis:()=>NOW}),
    async runTransaction(_db,callback){
      for(let attempt=0;;attempt+=1){
        const trace={reads:[],writes:new Map(),committed:false,verifies:[]};calls.push(trace);
        const value=await callback({
          async get(ref){
            if(beforeWrite&&ref.path===SETUP){const fn=beforeWrite;beforeWrite=null;fn();}
            trace.reads.push(ref.path);
            const data=clone(documents.get(ref.path));
            return {exists:()=>data!==undefined,data:()=>data,metadata:{fromCache:false,hasPendingWrites:false}};
          },
          set(ref,data){trace.writes.set(ref.path,clone(data));}
        });
        if(retry&&trace.writes.size&&attempt===0)continue; // SDK reruns the callback after contention.
        if(denied&&trace.writes.size)throw Object.assign(new Error("Rules denied revoked authority."),{code:"permission-denied"});
        trace.committed=true;committed+=1;
        trace.verifies=trace.reads.filter(name=>!trace.writes.has(name));
        for(const [name,data] of trace.writes)documents.set(name,data);
        return value;
      }
    }
  };
  const db={};
  function options(type,baseRevision,number,uid=A,extra={}){
    let firebaseSdk=sdk;
    if(budget){
      const services=sandbox.CareerModeFirestoreBudget.services({ok:true,firestore:db,firestoreSdk:sdk,auth:{currentUser:{uid}}});
      firebaseSdk=services.firestoreSdk;
    }
    return {firestore:db,firebaseSdk,user:{uid},rivalryId:R,sessionId:S,deviceId:uid===A?DA:DB,nowEpochMs:NOW,type,baseRevision,operationId:"setup_op_"+number.toString(16).padStart(32,"0"),...extra};
  }
  if(budget){
    const source=fs.readFileSync(path.join(ROOT,"js/sparkPrivatePairing.js"),"utf8");
    const marker=source.indexOf("// Firestore budget layer (r75).");assert.ok(marker>0);
    vm.runInContext(source.slice(marker),sandbox,{filename:"sparkPrivatePairing.js#budget"});
  }
  return {api:sandbox.CareerModeSparkSharedShowdownSetup,documents,calls,options,
    commits:()=>committed,denyWrites:()=>{denied=true;},beforeWrite:fn=>{beforeWrite=fn;}};
}

function assertWritingReads(h){
  const writes=h.calls.filter(call=>call.writes.size);
  assert.ok(writes.length,"the real provider must attempt a setup write");
  for(const call of writes){
    assert.deepEqual(call.reads,[SETUP],"setup writing transaction must read ONLY sharedSetup/authoritative (no account/device/rivalry/session verify entries)");
    assert.deepEqual([...call.writes.keys()],[SETUP]);
    assert.deepEqual(call.verifies,[]);
  }
  assert.ok(h.calls.some(call=>call.reads.includes(`accounts/${A}`)),"account authority is still read before mutation");
}

(async()=>{
  for(const budget of [false,true]){
    for(const totalSeasons of [1,3,5,10]){
      const h=world({budget,retry:true});
      const steps=["open","commit-league","commit-clubs","commit-length","confirm","confirm"];
      let result;
      for(let index=0;index<steps.length;index+=1){
        result=await h.api.mutate(h.options(steps[index],index,index+1,index===5?B:A,{totalSeasons}));
        assert.equal(result.ok,true,JSON.stringify(result));
        assert.equal(result.revision,index+1);assert.equal(result.status,"accepted");
        assertWritingReads(h);
      }
      assert.equal(h.commits(),6,"preflight must never commit, even without the r75 budget wrapper");
      assert.equal(result.state.phase,"SHOWDOWN_CONFIRMED");assert.equal(result.state.totalSeasons,totalSeasons);
      assert.notEqual(result.state.clubs.playerOne,result.state.clubs.playerTwo);
      assert.deepEqual(Array.from(result.state.confirmedRoles),["playerOne","playerTwo"]);
      const ledger=h.documents.get(SETUP);
      assert.deepEqual(ledger.operationTypes,steps);assert.deepEqual(ledger.baseRevisions,[0,1,2,3,4,5]);
      const before=h.commits(),replay=await h.api.mutate(h.options("confirm",5,6,B,{totalSeasons}));
      assert.equal(replay.ok,true);assert.equal(replay.status,"replayed");assert.equal(replay.state.contentHash,result.state.contentHash);
      assert.equal(h.documents.get(SETUP).revision,6);
      // A bare SDK may commit read-only callbacks; the preflight itself must still not commit.
      assert.ok(h.commits()-before<=1);
      console.log(`PASS ${totalSeasons}-season setup (${budget?"r75 budget":"bare SDK"}): ledger-only write reads, no preflight commits, retry and actor-bound replay`);
    }
  }
  for(const [name,change,code,readCount] of [
    ["account",h=>{h.documents.get(`accounts/${A}`).data.status="inactive";},"SETUP_MANAGER_INACTIVE",1],
    ["device",h=>{h.documents.get(`accounts/${A}/devices/${DA}`).data.state="inactive";},"SETUP_DEVICE_INACTIVE",2],
    ["rivalry",h=>{h.documents.get(`rivalries/${R}`).data.connectionState="pending";},"SETUP_RIVALRY_INACTIVE",3],
    ["session",h=>{h.documents.get(`rivalries/${R}/sessions/${S}`).data.state="revoked";},"SETUP_ACTIVE_SESSION_REQUIRED",4]
  ]){
    const h=world();change(h);
    const result=await h.api.mutate(h.options("open",0,1));assert.equal(result.code,code);assert.equal(h.commits(),0);
    assert.equal(h.calls.flatMap(call=>call.reads).length,readCount,`${name}: preserve validation order and stop before ledger reads`);
  }
  {
    const h=world();const original=h.options("open",0,1);assert.equal((await h.api.mutate(original)).ok,true);
    const before=h.documents.get(SETUP);
    const stale=await h.api.mutate(h.options("commit-league",0,2));assert.equal(stale.code,"SETUP_STALE_BASE_REVISION");
    const conflict=await h.api.mutate(h.options("open",0,1,B));assert.equal(conflict.code,"SETUP_IDEMPOTENCY_CONFLICT");
    assert.deepEqual(h.documents.get(SETUP),before);
  }
  {
    const h=world();h.beforeWrite(()=>{h.documents.get(`rivalries/${R}/sessions/${S}`).data.state="revoked";h.denyWrites();});
    const result=await h.api.mutate(h.options("open",0,1));assert.equal(result.code,"permission-denied");
    assert.equal(h.documents.has(SETUP),false);assert.equal(h.commits(),0);assertWritingReads(h);
  }
  console.log("PASS Shared Setup transaction reads: all six mutations, 1/3/5/10 seasons, SDK retries, stale revisions, actor-bound replay, authority validation order and Rules denial propagation");
})().catch(error=>{console.error(error);process.exitCode=1;});
