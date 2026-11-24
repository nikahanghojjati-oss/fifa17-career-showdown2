"use strict";
// Phoenix 3.0 W3 (B3): the one shared tap memory (js/sharedTapMemory.js). A shared tap is noted before it is sent and handed out
// at most once after a reload, only while the shared record still shows that step pending for this manager, only in the same
// Showdown and the same season. A note from season N is never handed out in season N+1, nor from a closed Showdown.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"../..");
const SOURCE=fs.readFileSync(path.join(root,"js/sharedTapMemory.js"),"utf8");
const R="pair_"+"a".repeat(64),OTHER="pair_"+"b".repeat(64),OP="season_op_"+"1".repeat(32);
let passed=0;const ok=(id,label)=>{passed++;console.log(`ok   ${id} ${label}`);};

function load({clock=1_800_000_000_000,failWrites=false}={}){
  const storage=new Map();const t={now:clock};
  const ctx={console,JSON,Object,Array,Number,String,Boolean,Error,Map,Set,
    Date:{now:()=>t.now},
    readStorageValue:key=>storage.has(key)?storage.get(key):null,
    writeStorageValue:(key,value)=>{if(failWrites)return false;storage.set(key,value);return true;},
    removeStorageValue:key=>{storage.delete(key);return true;}};
  ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(SOURCE,ctx,{filename:"sharedTapMemory.js"});
  return {api:ctx.CareerModeSharedTapMemory,storage,t};
}
const scope=(over={})=>({rivalryId:R,season:3,step:"seasonPublish",role:"playerTwo",...over});

// T1: note, then one resend while pending, never a second.
{
  const {api}=load();
  assert.equal(api.note(scope(),{operationId:OP,payload:{leaguePosition:1}}),true);
  const first=api.takeForResend(scope(),{pending:true,live:{rivalryId:R,season:3}});
  assert.equal(first.operationId,OP);assert.deepEqual(first.payload,{leaguePosition:1});
  assert.equal(api.takeForResend(scope(),{pending:true,live:{rivalryId:R,season:3}}),null);
  assert.equal(api.peek(scope()),null);
  ok("T1","a noted tap is handed out once while pending, never twice");
}
// T2: the shared record shows the write landed: the note is dropped, nothing is sent.
{
  const {api}=load();api.note(scope(),{operationId:OP});
  assert.equal(api.takeForResend(scope(),{pending:false,live:{rivalryId:R,season:3}}),null);
  assert.equal(api.peek(scope()),null);
  ok("T2","a tap the shared record already holds is never resent");
}
// T3: a note from season N is never sent in season N+1.
{
  const {api}=load();api.note(scope({season:3}),{operationId:OP});
  assert.equal(api.takeForResend(scope({season:3}),{pending:true,live:{rivalryId:R,season:4}}),null);
  assert.equal(api.peek(scope({season:3})),null);
  assert.equal(api.takeForResend(scope({season:4}),{pending:true,live:{rivalryId:R,season:4}}),null);
  // noting season 4 drops whatever season 3 left
  api.note(scope({season:3,step:"seasonAck"}),{operationId:OP});api.note(scope({season:4,step:"careerStart"}),{operationId:OP});
  assert.equal(api.peek(scope({season:3,step:"seasonAck"})),null);
  ok("T3","a season N note is refused in season N+1 and dropped when season N+1 is noted");
}
// T4: a closed Showdown never sends its notes; another Showdown never matches.
{
  const {api}=load();api.note(scope(),{operationId:OP});
  assert.equal(api.takeForResend(scope(),{pending:true,live:{rivalryId:R,season:3},closed:true}),null);
  assert.equal(api.peek(scope()),null);
  api.note(scope(),{operationId:OP});
  assert.equal(api.takeForResend(scope({rivalryId:OTHER}),{pending:true,live:{rivalryId:OTHER,season:3}}),null);
  assert.equal(api.takeForResend(scope(),{pending:true,live:{rivalryId:OTHER,season:3}}),null);
  assert.equal(api.peek(scope()),null);
  api.note(scope(),{operationId:OP});api.note(scope({rivalryId:OTHER}),{operationId:OP});
  assert.equal(api.peek(scope()),null);
  ok("T4","a closed Showdown's note is never sent; a new Showdown's note drops the old one");
}
// T5: the other manager's role, another step, a bad scope never match; a note older than a play session is gone.
{
  const {api,t}=load();api.note(scope(),{operationId:OP});
  assert.equal(api.peek(scope({role:"playerOne"})),null);assert.equal(api.peek(scope({step:"seasonAck"})),null);
  assert.equal(api.note(scope({step:"spin"}),{operationId:OP}),false);assert.equal(api.note(scope({season:11}),{operationId:OP}),false);
  assert.equal(api.note(scope(),{operationId:"x"}),false);
  t.now+=api.maxAgeMs+1;assert.equal(api.peek(scope()),null);
  assert.equal(api.takeForResend(scope(),{pending:true,live:{rivalryId:R,season:3}}),null);
  ok("T5","only the exact manager, step and season match; a stale note expires");
}
// T6: storage that cannot be written never hands a note out (it could not be marked as resent).
{
  const {api,storage}=load({failWrites:true});
  storage.set(api.storageKey,JSON.stringify([{...scope(),operationId:OP,payload:null,notedAtMs:Date.now(),resent:false}]));
  assert.equal(api.takeForResend(scope(),{pending:true,live:{rivalryId:R,season:3}}),null);
  ok("T6","a note that cannot be marked resent is never handed out");
}
// T7: no Firestore anywhere in the helper; no offline queue.
{
  assert.doesNotMatch(SOURCE,/firestore\(|getFirestore|runTransaction|setDoc|updateDoc|enableIndexedDbPersistence|persistentLocalCache/);
  const {api}=load();assert.equal(api.firestoreWrites,false);assert.equal(api.firestoreReads,false);assert.equal(api.offlineQueue,false);
  ok("T7","storage only: no Firestore read or write, no offline cache, no queue");
}
console.log(`PASS r100 tap memory contracts (${passed})`);
