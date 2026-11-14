#!/usr/bin/env node
"use strict";
// G1 (2.4.0 bug hunt, P3): a phone that lost its kept squad sheets (new device, cleared storage) printed a story paragraph
// where the other phone printed the squad news sentence. js/squadSheetStep.js gazetteEnsure made its up to 4 reads one after
// another, and js/touchlineGazette.js waits only SQUAD_CAP_MS (4 s) for them; on a slow connection the 4th read was still
// out when the paper printed (gazette-forget-3: 3 of 4 reads done at the cap).
// The fix reads the missing sheets at the same time. Same reads, same count, same answers:
//   G1-1 four missing sheets on a 1.2 s-per-read connection are all kept well inside the 4 s cap (one after another: 4.8 s);
//   G1-2 exactly the 4 missing documents, each once; a phone that keeps them reads nothing;
//   G1-3 a failed read still answers false; an empty answer is still kept.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const Step=require(path.join(ROOT,"js/squadSheetStep.js"));
const CAP=Number((fs.readFileSync(path.join(ROOT,"js/touchlineGazette.js"),"utf8").match(/SQUAD_CAP_MS=(\d+)/)||[])[1]);
assert.equal(CAP,4000,"the paper waits 4 s for the squad sheets");
const LATENCY=1200;
let passed=0;const ok=name=>{passed+=1;console.log(`ok ${passed} ${name}`);};

const rid="pair_"+"e".repeat(64);
const sheet=(season,role,ov)=>({schemaVersion:1,objectType:"sharedSquadSheet",rivalryId:rid,seasonNumber:season,stage:"pre",role,formation:"4-3-3",
  names:Array.from({length:18},(_,i)=>`P${i}`),numbers:Array.from({length:18},(_,i)=>i+1),signed:Array(18).fill(0),
  outNames:[],outNumbers:[],outSigned:[],outReasons:[],outSeasons:[],ovNames:ov?["P3"]:[],ovNumbers:ov?[4]:[],ovSigned:ov?[0]:[],ovValues:ov?[ov]:[]});
const server=new Map([["season_1_pre_playerOne",sheet(1,"playerOne")],["season_1_pre_playerTwo",sheet(1,"playerTwo")],["season_2_pre_playerOne",sheet(2,"playerOne",88)],["season_2_pre_playerTwo",sheet(2,"playerTwo")]]);
function phone({fail=false}={}){
  const store=new Map(),reads=[];let inFlight=0,most=0;
  const sdk={doc:(_db,...seg)=>({path:seg.join("/"),id:seg[seg.length-1]}),runTransaction:async(_db,fn)=>fn({get:async ref=>{
    reads.push(ref.id);inFlight+=1;most=Math.max(most,inFlight);
    await new Promise(r=>setTimeout(r,LATENCY));inFlight-=1;
    if(fail&&ref.id==="season_2_pre_playerTwo")throw Object.assign(new Error("offline"),{code:"unavailable"});
    const d=server.get(ref.id);return {exists:()=>Boolean(d),data:()=>JSON.parse(JSON.stringify(d))};}})};
  return {store,reads,most:()=>most,env:{readStorageValue:k=>store.has(k)?store.get(k):null,writeStorageValue:(k,v)=>{store.set(k,String(v));},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:"u"}},firestore:{},firestoreSdk:sdk})}}};
}
const use=env=>{for(const k of ["readStorageValue","writeStorageValue","CareerModeProductionFirebaseRuntime"])globalThis[k]=env[k];};

(async()=>{
  const B=phone();use(B.env);
  const t0=Date.now();
  assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);
  const took=Date.now()-t0;
  assert.ok(took<CAP-1000,`G1-1 the 4 missing sheets are in after ${took} ms, inside the ${CAP} ms cap (one after another took ${4*LATENCY} ms)`);
  assert.equal(B.most(),4,"G1-1 the 4 reads are made at the same time");
  ok(`four missing sheets at ${LATENCY} ms each are kept in ${took} ms (cap ${CAP} ms)`);
  assert.deepEqual([...B.reads].sort(),["season_1_pre_playerOne","season_1_pre_playerTwo","season_2_pre_playerOne","season_2_pre_playerTwo"],"G1-2 the 4 missing documents, once each");
  assert.ok(Step.gazetteNews({rivalryId:rid,season:2})?.playerOne.rated.length===1,"the squad news is there");
  assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);assert.equal(B.reads.length,4,"G1-2 never twice");
  ok("the same 4 reads, each once, then none");
  server.delete("season_2_pre_playerTwo");const C=phone();use(C.env);
  assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),true);await Step.gazetteEnsure({rivalryId:rid,season:2});
  assert.equal(C.reads.length,4,"G1-3 an empty answer is kept too");
  server.set("season_2_pre_playerTwo",sheet(2,"playerTwo"));
  const D=phone({fail:true});use(D.env);
  assert.equal(await Step.gazetteEnsure({rivalryId:rid,season:2}),false,"G1-3 a failed read says false");
  assert.equal(D.reads.length,4);
  ok("an empty answer is kept, a failed read says false");
  for(const k of ["readStorageValue","writeStorageValue","CareerModeProductionFirebaseRuntime"])delete globalThis[k];
  console.log(`PASS r91 Gazette parallel squad reads (${passed} checks)`);
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});
