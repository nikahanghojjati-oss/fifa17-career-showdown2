"use strict";
// r87 W3-3 career-screen number oracle: the seeder.
// Adds finished Showdowns to an EXISTING emulator career (the Daniel and Nik accounts a CE2PG run signed in and paired), played
// through the game's own Spark providers with the composed production Rules switched ON for every gameplay write: Setup, Career
// Start, both roulette marks, the transfer window, both results, commit, both acknowledgements, Terminal Close. Only the bits a
// browser would write before play (the rivalry root, its private session, the two career-index appends) and the END SHOWDOWN close
// are written with the Rules off, in the same envelope shape the app writes. Emulator only (demo project); never production.
const crypto=require("node:crypto");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,getDocs,collection,setDoc}=firestoreSdk;
const {initializeApp,deleteApp}=require("firebase/app");

global.window=globalThis;
require("../../../data/transferOptions.js");
const Setup=require("../../../js/sparkSharedShowdownSetup.js");
const Career=require("../../../js/sparkSharedCareerStart.js");
const Transfer=require("../../../js/sparkSharedTransferChallenge.js");
const Results=require("../../../js/sparkSharedSeasonResults.js");
const Commit=require("../../../js/sparkSharedSeasonCommit.js");
const History=require("../../../js/sparkSharedHistoryConvergence.js");
const Multi=require("../../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../../js/sharedFinalReconciliation.js");
const Terminal=require("../../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../../js/sparkTerminalClose.js");
const Sessions=require("../../../js/sparkPrivateSession.js");
const PersistentPair=require("../../../js/persistentNikDanielPair.js");
const Catalog=require("../../../js/sharedShowdownCatalog.js");

const ROLES=["playerOne","playerTwo"];
function sdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp:firestoreSdk.serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
async function digest(value){const hash=await crypto.webcrypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(canonical(value))));return `sha256:${Buffer.from(hash).toString("hex")}`;}
async function envelope(objectType,objectId,revision,data,{accountId,deviceId,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}){
  return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:priorHash,updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};
}
const rnd=bytes=>crypto.randomBytes(bytes).toString("hex");
let opCounter=0;
const op=prefix=>prefix+(++opCounter).toString(16).padStart(8,"0")+rnd(12);

// One manager's season input in the stored 7/8-key shape; clamped to the drawn league so the Rules accept it.
function storedResult(r,teamCount){
  const maxPoints=(teamCount-1)*6;
  const out={leaguePosition:Math.min(Math.max(1,r.pos),teamCount),leaguePoints:Math.min(r.pts,maxPoints),leagueGoals:Math.min(r.gls,300),domesticCup:Boolean(r.cup),championsLeague:Boolean(r.cl),topScorer:Boolean(r.ts),topAssist:Boolean(r.ta)};
  if(r.el&&!r.cl)out.europaLeague=true;
  return out;
}

// A small stand-in for @firebase/rules-unit-testing (not a dependency of this repo): the plain SDK against the emulator, with
// the emulator's mock tokens. authenticatedContext(uid) = a signed-in manager (Rules apply); withSecurityRulesDisabled = the
// emulator's "owner" token (Rules off).
async function connect({projectId,firestorePort,rules}){
  const put=await fetch(`http://127.0.0.1:${firestorePort}/emulator/v1/projects/${projectId}:securityRules`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({rules:{files:[{name:"firestore.rules",content:rules}]}})});
  if(put.status!==200)throw new Error(`could not load the composed Rules into the emulator (${put.status})`);
  const apps=[],cache=new Map();let n=0;
  const contextFor=token=>{
    const key=typeof token==="string"?token:JSON.stringify(token);
    if(cache.has(key))return cache.get(key);
    const app=initializeApp({projectId,apiKey:"demo-key"},`oracle-${++n}`);apps.push(app);
    const db=firestoreSdk.getFirestore(app);firestoreSdk.connectFirestoreEmulator(db,"127.0.0.1",firestorePort,{mockUserToken:token});
    const ctx={firestore:()=>db};cache.set(key,ctx);return ctx;
  };
  return {
    authenticatedContext:uid=>contextFor({user_id:uid,sub:uid}),
    withSecurityRulesDisabled:async fn=>fn(contextFor("owner")),
    cleanup:async()=>{for(const app of apps)await deleteApp(app).catch(()=>{});}
  };
}

// The two accounts as the browsers registered them: uid, device, and the manager slots of their rivalry (copied, so the profile and
// save bindings are the real ones).
async function readCareerAccounts(env){
  let out=null;
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    const accounts=await getDocs(collection(db,"accounts"));const found={};
    for(const account of accounts.docs){
      const link=await getDoc(doc(db,"accounts",account.id,"pairLinks","current"));
      if(!link.exists())continue;const data=link.data().data||{};
      const devices=await getDocs(collection(db,"accounts",account.id,"devices"));
      const device=devices.docs.map(d=>d.data()).find(d=>d.data?.state==="active");
      found[data.managerId]={uid:account.id,role:data.managerRole,deviceId:device?.data?.deviceId||devices.docs[0]?.id,rivalryId:data.rivalryId};
    }
    if(!found.daniel||!found.nik)throw new Error(`career accounts not found (pair links: ${JSON.stringify(found)})`);
    const root=(await getDoc(doc(db,"rivalries",found.daniel.rivalryId))).data();
    const slots=root.data.managerSlots.map(slot=>({slotId:slot.slotId,accountId:slot.accountId,profileId:slot.profileId,saveId:slot.saveId,displayLabel:slot.displayLabel??null,entitlementState:"active",deletionConsent:false}));
    out={daniel:found.daniel,nik:found.nik,slots,templateRoot:root};
  });
  return out;
}

async function appendCareerIndex(db,uid,deviceId,rivalryId){
  const head=await getDoc(doc(db,"accounts",uid,"careerIndex","current"));
  const writes=await PersistentPair.planCareerIndexAppend({headValue:head.exists()?head.data():null,rivalryId,accountId:uid,deviceId,now:Timestamp.fromMillis(Date.now()),cryptoImpl:crypto.webcrypto});
  for(const write of writes)await setDoc(doc(db,"accounts",uid,"careerIndex",write.indexId),write.value);
}

// Plays one Showdown. spec: {seasons:[{playerOne:{pos,pts,gls,cup,cl,el,ts,ta},playerTwo:{...}}], totalSeasons, endAfter?}
// Daniel (playerOne in the browsers' pair, read from the pair link) hosts. Returns what was stored.
async function playShowdown(env,who,spec){
  const host=who.daniel.role==="playerOne"?who.daniel:who.nik,guest=host===who.daniel?who.nik:who.daniel;
  const rivalryId=`pair_${rnd(32)}`,sessionId=`session_${rnd(32)}`;
  const total=spec.totalSeasons||spec.seasons.length;
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore(),now=Date.now();
    const created=Timestamp.fromMillis(now-90000);
    const data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:who.slots,authorizedAccountIds:[host.uid,guest.uid],createdByAccountId:host.uid,createdAt:created};
    await setDoc(doc(db,"rivalries",rivalryId),await envelope("rivalry",rivalryId,0,data,{accountId:host.uid,deviceId:host.deviceId,updatedAt:created}));
    const lastActivityAt=Timestamp.fromMillis(now-1000);
    await setDoc(doc(db,"rivalries",rivalryId,"sessions",sessionId),await Sessions.buildEnvelope({sessionId,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:host.uid,deviceId:host.deviceId,data:{rivalryId,state:"active",hostAccountId:host.uid,memberAccountIds:[host.uid,guest.uid],createdAt:Timestamp.fromMillis(now-60000),expiresAt:Timestamp.fromMillis(now+3*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto}));
    for(const m of [host,guest])await appendCareerIndex(db,m.uid,m.deviceId,rivalryId);
  });
  const dbH=env.authenticatedContext(host.uid).firestore(),dbG=env.authenticatedContext(guest.uid).firestore();
  const ctx=(db,m)=>()=>({user:{uid:m.uid},firestore:db,firebaseSdk:sdk(),rivalryId,sessionId,deviceId:m.deviceId,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto});
  const h=ctx(dbH,host),g=ctx(dbG,guest);
  const must=(label,v)=>{if(!v||v.ok!==true)throw new Error(`${label}: ${JSON.stringify(v).slice(0,600)}`);return v;};
  let rev=0;
  for(const [type,extra] of [["open",{}],["commit-league",{}],["commit-clubs",{}],["commit-length",{totalSeasons:total}]])must(`setup ${type}`,await Setup.mutate({...h(),type,baseRevision:rev++,operationId:op("setup_op_"),...extra}));
  must("setup confirm host",await Setup.mutate({...h(),type:"confirm",baseRevision:rev++,operationId:op("setup_op_")}));
  const setup=must("setup confirm guest",await Setup.mutate({...g(),type:"confirm",baseRevision:rev++,operationId:op("setup_op_")}));
  const teamCount=Catalog.catalog[setup.state.leagueId].length;
  must("career start host",await Career.acknowledge({...h(),operationId:op("career_start_op_"),baseRevision:0}));
  must("career start guest",await Career.acknowledge({...g(),operationId:op("career_start_op_"),baseRevision:1}));
  const roleCtx={[host.role]:h,[guest.role]:g};
  const played=Math.min(spec.endAfter??total,spec.seasons.length);
  const stored=[];let lastHistory=null,lastMulti=null;
  for(let season=1;season<=played;season+=1){
    for(const role of ROLES)must(`S${season} spin ${role}`,await Transfer.markSpun({...roleCtx[role](),seasonNumber:season,managerRole:role}));
    must(`S${season} window`,await Transfer.startWindow({...h(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:0}));
    must(`S${season} end host`,await Transfer.requestEndWindow({...h(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:1}));
    must(`S${season} end guest`,await Transfer.requestEndWindow({...g(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:2}));
    must(`S${season} guesses host`,await Transfer.lockGuesses({...h(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"}]}));
    must(`S${season} guesses guest`,await Transfer.lockGuesses({...g(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:4,guesses:[{slot:1,type:"nationality",valueId:"brazil"}]}));
    must(`S${season} signings host`,await Transfer.lockSignings({...h(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:5,signings:[{slot:1,name:`Oracle S${season} A`,leagueId:"spain-primera-division",nationalityId:"england"}]}));
    must(`S${season} signings guest`,await Transfer.lockSignings({...g(),seasonNumber:season,operationId:op("transfer_op_"),baseRevision:6,signings:[{slot:1,name:`Oracle S${season} B`,leagueId:"england-premier-league",nationalityId:"brazil"}]}));
    const input={playerOne:storedResult(spec.seasons[season-1].playerOne,teamCount),playerTwo:storedResult(spec.seasons[season-1].playerTwo,teamCount)};
    must(`S${season} result host`,await Results.publishResult({...h(),seasonNumber:season,operationId:op("season_result_op_"),baseRevision:0,result:input[host.role]}));
    must(`S${season} result guest`,await Results.publishResult({...g(),seasonNumber:season,operationId:op("season_result_op_"),baseRevision:1,result:input[guest.role]}));
    must(`S${season} commit`,await Commit.commitSeason({...h(),seasonNumber:season,operationId:op("season_commit_op_"),baseRevision:0}));
    must(`S${season} ack guest`,await Commit.acknowledgeSeason({...g(),seasonNumber:season,operationId:op("season_commit_op_"),baseRevision:1}));
    must(`S${season} ack host`,await Commit.acknowledgeSeason({...h(),seasonNumber:season,operationId:op("season_commit_op_"),baseRevision:2}));
    stored.push(input);
    if(season===total){lastHistory=must(`S${season} history`,await History.read({...h(),throughSeason:season}));lastMulti=await Multi.read(h());}
  }
  if(played===total){
    const binding=ROLES.reduce((o,role)=>{const slot=who.slots.find(s=>s.slotId===role);o[role]={phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};return o;},{});
    const final=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:binding[host.role]});
    if(final.phase!=="FINAL_SEASON_RECONCILED")throw new Error(`final: ${JSON.stringify(final).slice(0,400)}`);
    must("terminal close",await TerminalProvider.close({...h(),intent:Terminal.prepare(final,{sessionId})}));
  }else{
    // END SHOWDOWN after `played` committed seasons: the root closes with the ended-early mark (as Settings writes it).
    await env.withSecurityRulesDisabled(async context=>{
      const db=context.firestore(),before=(await getDoc(doc(db,"rivalries",rivalryId))).data();
      const data={...before.data,connectionState:"closed",endedEarly:{seasonsPlayed:played}};
      await setDoc(doc(db,"rivalries",rivalryId),await envelope("rivalry",rivalryId,before.revision+1,data,{accountId:guest.uid,deviceId:guest.deviceId,priorHash:before.contentHash}));
    });
  }
  return {rivalryId,totalSeasons:total,played,leagueId:setup.state.leagueId,teamCount,stored,ended:played!==total};
}

// Season helpers for specs.
const R=(pos,pts,gls,flags="")=>({pos,pts,gls,cup:flags.includes("c"),cl:flags.includes("C"),el:flags.includes("E"),ts:flags.includes("s"),ta:flags.includes("a")});
const PERFECT=R(1,100,105,"cCs");// 5 + 3 + 1 + 1 + 1 = 11

module.exports={connect,readCareerAccounts,playShowdown,R,PERFECT,storedResult};
