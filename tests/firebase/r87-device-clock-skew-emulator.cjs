"use strict";
// r87 W3-6 proof lane: a phone whose clock is wrong must still connect. Server time must win.
//
// The connection session (js/sparkPrivateSession.js through js/sparkStandardAuthPrivateSession.js, called by
// js/sparkRemoteJoining.js with nowEpochMs:Date.now()) writes createdAt, expiresAt and lastActivityAt from the phone's own
// clock. The production Rules (firestore.spark.rules validOpenSessionCreate / freshSessionActivity) only accept those values
// inside [server - 5 min, server + 1 min] and expiresAt <= server + 4 h. The app asks for a 4 h - 60 s session, so a phone
// that is more than about 1 minute fast, or about 5 minutes slow, is refused when it opens or joins a session.
//
// This test drives the real provider on the generated production Rules with the phone clock moved by each skew and prints
// the outcome. It fails while a phone 5 minutes fast or 5 minutes slow cannot open or join a session.
// CLOCK_SKEW_REPORT_ONLY=1 prints the table and exits 0.
//
// Run (needs Java):
//   node scripts/build-production-firestore-rules.mjs && node scripts/build-production-firestore-rules-with-persistent-pair.mjs
//   npm install --no-save --package-lock=false firebase@12.17.1 @firebase/rules-unit-testing@5.0.1
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-r87-clock-skew "node tests/firebase/r87-device-clock-skew-emulator.cjs"

const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,runTransaction}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
const session=require("../../js/sparkStandardAuthPrivateSession.js");

const PROJECT_ID="demo-cms-r87-clock-skew";
const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const A="acct_clock_daniel",B="acct_clock_nik";
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const R=`pair_${"c".repeat(64)}`;
// sparkRemoteJoining.js SRJ_HOST_TTL_MS
const HOST_TTL_MS=4*60*60*1000-60*1000;
const MIN=60*1000;
const SKEWS=[0,30*1000,-30*1000,2*MIN,-2*MIN,-4*MIN,5*MIN,-5*MIN];

const hash=seed=>`sha256:${seed.repeat(64).slice(0,64)}`;
function envelope(objectType,objectId,accountId,deviceId,data,seed){
  return {schemaVersion:1,objectType,objectId,revision:0,parentRevision:null,lifecycleState:"live",contentHash:hash(seed),priorContentHash:null,
    updatedAt:Timestamp.fromMillis(Date.now()),updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};
}
const accountDoc=(id,seed)=>envelope("account",id,id,null,{status:"active",createdAt:Timestamp.fromMillis(Date.now()),deletionRequestedAt:null},seed);
const deviceDoc=(acct,id,seed)=>envelope("device",id,acct,id,{deviceId:id,installationId:`installation_${seed.repeat(32)}`,displayLabel:null,state:"active",
  registeredAt:Timestamp.fromMillis(Date.now()),lastSeenAt:Timestamp.fromMillis(Date.now()),revokedAt:null},seed);
const rivalryDoc=()=>envelope("rivalry",R,A,DA,{connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"1".repeat(24)}`,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"2".repeat(24)}`,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}],
  authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:Timestamp.fromMillis(Date.now())},"d");

const sdk={Timestamp,doc,runTransaction,serverTimestamp:firestoreSdk.serverTimestamp};
const sessionIdFor=(n,who)=>`session_${crypto.createHash("sha256").update(`${n}:${who}`).digest("hex")}`;
const label=ms=>ms===0?"exact":`${ms>0?"+":"-"}${Math.abs(ms)>=MIN?`${Math.abs(ms)/MIN} min`:`${Math.abs(ms)/1000} s`}`;
const opts=(db,uid,deviceId,sessionId,skew,extra={})=>({user:{uid},deviceId,rivalryId:R,sessionId,firestore:db,firebaseSdk:sdk,cryptoImpl:crypto.webcrypto,nowEpochMs:Date.now()+skew,...extra});
const outcome=result=>result&&result.ok===true?"ok":`REFUSED (${result&&(result.code||result.status)||"error"})`;
async function run(fn){try{return await fn();}catch(error){return {ok:false,code:error&&(error.code||error.message)};}}

(async()=>{
  firestoreSdk.setLogLevel("silent");
  const env=await initializeTestEnvironment({projectId:PROJECT_ID,firestore:{rules:RULES}});
  const rows=[];
  try{
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore();
      await setDoc(doc(db,"accounts",A),accountDoc(A,"a"));await setDoc(doc(db,"accounts",B),accountDoc(B,"b"));
      await setDoc(doc(db,"accounts",A,"devices",DA),deviceDoc(A,DA,"a"));await setDoc(doc(db,"accounts",B,"devices",DB),deviceDoc(B,DB,"b"));
      await setDoc(doc(db,"rivalries",R),rivalryDoc());
    });
    const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();

    // Sanity: a right clock opens and joins.
    const sane=sessionIdFor(0,"sanity");
    const saneOpen=await run(()=>session.openSession(opts(dbA,A,DA,sane,0,{ttlMs:HOST_TTL_MS})));
    assert.equal(saneOpen.ok,true,`right clock must open: ${JSON.stringify(saneOpen)}`);
    const saneJoin=await run(()=>session.joinSession(opts(dbB,B,DB,sane,0)));
    assert.equal(saneJoin.ok,true,`right clock must join: ${JSON.stringify(saneJoin)}`);

    let n=1;
    for(const skew of SKEWS){
      // Host (Daniel) phone wrong, peer right.
      const s1=sessionIdFor(n++,"host");
      const open=await run(()=>session.openSession(opts(dbA,A,DA,s1,skew,{ttlMs:HOST_TTL_MS})));
      // Peer (Nik) phone wrong, host right.
      const s2=sessionIdFor(n++,"peer");
      const open2=await run(()=>session.openSession(opts(dbA,A,DA,s2,0,{ttlMs:HOST_TTL_MS})));
      const join=open2.ok?await run(()=>session.joinSession(opts(dbB,B,DB,s2,skew))):{ok:false,code:"host-open-failed"};
      // Peer joins a session the wrong-clock host opened (when it opened).
      const join1=open.ok?await run(()=>session.joinSession(opts(dbB,B,DB,s1,0))):{ok:false,code:"not opened"};
      rows.push({skew,open:outcome(open),join:outcome(join),joinAfterSkewedHost:outcome(join1)});
    }
  }finally{await env.cleanup();}

  process.stdout.write("\nphone clock | host opens session | peer joins session | right-clock peer joins skewed host's session\n");
  for(const row of rows)process.stdout.write(`${label(row.skew).padEnd(11)} | ${row.open.padEnd(18)} | ${row.join.padEnd(18)} | ${row.joinAfterSkewedHost}\n`);
  const bad=rows.filter(row=>Math.abs(row.skew)<=5*MIN&&(row.open!=="ok"||row.join!=="ok"));
  if(bad.length){
    process.stdout.write(`\nFAIL r87-clock-skew: a phone ${bad.map(row=>label(row.skew)).join(", ")} off cannot connect (server time does not win).\n`);
    if(process.env.CLOCK_SKEW_REPORT_ONLY!=="1")process.exitCode=1;
  }else process.stdout.write("\nok r87-clock-skew: every phone within 5 minutes connects\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
