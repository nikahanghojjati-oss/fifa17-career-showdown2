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
// the outcome, twice: "raw" feeds the provider the phone's own clock (what the app did before r87 W3-6, kept as a reference)
// and "app" takes nowEpochMs from js/sparkRemoteJoining.js serverNow() with the phone's Date.now() moved, exactly as the app
// does before every session write. It fails while the app path leaves a phone within 5 minutes unable to open or join.
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
const REAL_NOW=Date.now.bind(Date);
// The app's clock: a fresh copy of js/sparkRemoteJoining.js per phone, its Date.now() moved by skew, and an ID token whose
// issuedAtTime is the server's (the emulator runs on this machine's clock), whole seconds like a real token.
async function appNow(uid,skew){
  const file=require.resolve("../../js/sparkRemoteJoining.js");delete require.cache[file];
  Date.now=()=>REAL_NOW()+skew;
  try{
    const remote=require(file);
    const user={uid,async getIdTokenResult(force){assert.equal(force,true);await new Promise(r=>setTimeout(r,40));return {issuedAtTime:new Date(Math.floor(REAL_NOW()/1000)*1000).toUTCString()};}};
    return await remote.serverNow(user);
  }finally{Date.now=REAL_NOW;}
}

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
let mode="raw";
const nowFor=async(uid,skew)=>mode==="raw"?Date.now()+skew:appNow(uid,skew);
const opts=async(db,uid,deviceId,sessionId,skew,extra={})=>({user:{uid},deviceId,rivalryId:R,sessionId,firestore:db,firebaseSdk:sdk,cryptoImpl:crypto.webcrypto,nowEpochMs:await nowFor(uid,skew),...extra});
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
    const saneOpen=await run(async()=>session.openSession(await opts(dbA,A,DA,sane,0,{ttlMs:HOST_TTL_MS})));
    assert.equal(saneOpen.ok,true,`right clock must open: ${JSON.stringify(saneOpen)}`);
    const saneJoin=await run(async()=>session.joinSession(await opts(dbB,B,DB,sane,0)));
    assert.equal(saneJoin.ok,true,`right clock must join: ${JSON.stringify(saneJoin)}`);

    let n=1;
    for(const which of ["raw","app"])for(const skew of SKEWS){
      mode=which;
      // Host (Daniel) phone wrong, peer right.
      const s1=sessionIdFor(n++,"host");
      const open=await run(async()=>session.openSession(await opts(dbA,A,DA,s1,skew,{ttlMs:HOST_TTL_MS})));
      // Peer (Nik) phone wrong, host right.
      const s2=sessionIdFor(n++,"peer");
      const open2=await run(async()=>session.openSession(await opts(dbA,A,DA,s2,0,{ttlMs:HOST_TTL_MS})));
      const join=open2.ok?await run(async()=>session.joinSession(await opts(dbB,B,DB,s2,skew))):{ok:false,code:"host-open-failed"};
      // Right-clock peer joins the session the wrong-clock host opened.
      const join1=open.ok?await run(async()=>session.joinSession(await opts(dbB,B,DB,s1,0))):{ok:false,code:"not opened"};
      // Wrong-clock peer closes the session it joined (the session write at the end of a connection).
      const close=join.ok?await run(async()=>session.closeSession(await opts(dbB,B,DB,s2,skew))):{ok:false,code:"not joined"};
      rows.push({mode:which,skew,open:outcome(open),join:outcome(join),joinAfterSkewedHost:outcome(join1),close:outcome(close)});
    }
  }finally{await env.cleanup();}

  for(const which of ["raw","app"]){
    process.stdout.write(`\n${which==="raw"?"raw phone clock (before W3-6, reference only)":"app clock (js/sparkRemoteJoining.js serverNow)"}\n`);
    process.stdout.write("phone clock | host opens         | peer joins         | peer joins skewed host | skewed peer closes\n");
    for(const row of rows.filter(r=>r.mode===which))process.stdout.write(`${label(row.skew).padEnd(11)} | ${row.open.padEnd(18)} | ${row.join.padEnd(18)} | ${row.joinAfterSkewedHost.padEnd(22)} | ${row.close}\n`);
  }
  const bad=rows.filter(row=>row.mode==="app"&&Math.abs(row.skew)<=5*MIN&&[row.open,row.join,row.joinAfterSkewedHost,row.close].some(v=>v!=="ok"));
  if(bad.length){
    process.stdout.write(`\nFAIL r87-clock-skew: with the app clock a phone ${bad.map(row=>label(row.skew)).join(", ")} off cannot connect (server time does not win).\n`);
    if(process.env.CLOCK_SKEW_REPORT_ONLY!=="1")process.exitCode=1;
  }else process.stdout.write("\nok r87-clock-skew: with the app clock every phone within 5 minutes opens, joins and closes\n");
})().catch(error=>{console.error(error);process.exitCode=1;});
