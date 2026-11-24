"use strict";
// POS1M Ring 2: the same stories on the real Firestore emulator, under the composed production Rules
// (firestore.spark.generated.rules), through the real Firebase JS SDK. A differential, not a second game engine:
//  1. Ring 1 plays the story on the stand-in in recording mode (plan.serial: one provider call at a time across both
//     phones, so the recorded order is the order the server ran them). Calm network; repeated taps and second tabs stay
//     on, so the Rules see the game's idempotent replays; the Prime Pack is short (one right guess in stage 1).
//  2. The recorded calls run again, in order, on the emulator through the same game providers and the same Prime Pack
//     step module, with the real SDK, real time and real server timestamps. A Prime Pack guess waits for its stage.
//  3. Every answer must match: accepted or refused, the game's code, a repeat recognised as one. A call the stand-in
//     accepted that the real Rules refuse is the KINDER-STAND-IN ALARM (Ring 1 would be blind there). A call the stand-in
//     refused that the emulator accepts is HARSHER (a Ring 1 false alarm). Then the calm differential: every document the
//     stand-in holds exists on the emulator with the same phase, revision and season.
// Run inside the emulator (free runner, no billing, never production):
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-pos1m-ring2 \
//     "node tests/pos1m/ring2.cjs --stories 200 --workers 4 --out pos1m-ring2.json"
//   --self-test kinder: the stand-in without its Rules model must raise the alarm (exit 1 with ALARM).
// Needs firebase@12.17.1 and @firebase/rules-unit-testing@5.0.1 (installed --no-save, as the Gate's emulator lanes do).
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const crypto=require("node:crypto");
const {spawn}=require("node:child_process");
const ROOT=path.resolve(__dirname,"../..");

// The Ring 2 sample: whole Showdowns, every length and Sacked first, middle, last and none, rotating with the seed.
const ROTATION=[{L:1,sack:null},{L:3,sack:null},{L:1,sack:"first"},{L:3,sack:"middle"},{L:5,sack:null},{L:3,sack:"last"},{L:10,sack:null},{L:5,sack:"first"}];
function ring2Plan(seed){
  const spec=ROTATION[seed%ROTATION.length];
  return {kind:"full",totalSeasons:spec.L,sack:spec.sack,faults:{contentionDenied:0},skewMs:{playerOne:0,playerTwo:0},expireWindow:false,
    chaos:{rate:0.25,budget:6,weights:{kill:0,offline:0,swap:0,secondTab:1,repeat:4,skew:0}},serial:true,packShort:true};
}
function args(argv){
  const out={stories:200,workers:Math.max(1,Math.min(os.availableParallelism?os.availableParallelism():os.cpus().length,4)),seed:200_000,out:null,worker:null,seeds:null,"self-test":null};
  for(let i=0;i<argv.length;i+=2){const k=argv[i].replace(/^--/,"");if(!(k in out))throw new Error(`unknown option ${argv[i]}`);out[k]=["stories","workers","seed","worker"].includes(k)?Number(argv[i+1]):argv[i+1];}
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// One story: record on the stand-in, replay on the emulator, compare.
// ---------------------------------------------------------------------------------------------------------------
async function replayStory(seed,env,real){
  const {runStory}=require("./ring1.cjs");
  const W=require("./world.cjs");
  const {freshModule}=require("./fresh.cjs");
  const Guess=require(path.join(ROOT,"js","iconGuess.js"));
  const {PROVIDERS}=require("./ring1.cjs");
  const recorded=await runStory(seed,{keep:true,plan:ring2Plan(seed)});
  const story=recorded.story,calls=story.recording||[];
  const report={seed,totalSeasons:recorded.plan.totalSeasons,sackedSeason:recorded.plan.sackedSeason,calls:calls.length,ring1:{violations:recorded.violations.map(v=>v.law),error:recorded.error||null},alarms:[],differences:[],wallMs:0};
  if(recorded.error||recorded.violations.length){report.differences.push({kind:"RING1",detail:"the recording story itself broke a law; fix Ring 1 first"});return report;}
  const started=Date.now();
  // The world on the emulator: the same accounts, devices, pair and session, with real timestamps.
  const toReal=value=>{
    if(value&&typeof value==="object"&&typeof value.toMillis==="function"&&Number.isInteger(value.seconds))return real.Timestamp.fromMillis(value.toMillis());
    if(Array.isArray(value))return value.map(toReal);
    if(value&&typeof value==="object"){const o={};for(const [k,v] of Object.entries(value))o[k]=toReal(v);return o;}
    return value;
  };
  const seedWrites=[];W.seed({adminSet:(p,data)=>seedWrites.push([p,data])},Date.now());
  await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();for(const [p,data] of seedWrites)await real.setDoc(real.doc(db,p),toReal(data));});
  const packStep={},packPoints={},dbFor={};
  const db=role=>dbFor[role]||(dbFor[role]=env.authenticatedContext(W.ACCOUNT[role]).firestore());
  const sdk={doc:real.doc,collection:real.collection,getDoc:real.getDoc,setDoc:real.setDoc,updateDoc:real.updateDoc,deleteDoc:real.deleteDoc,onSnapshot:real.onSnapshot,runTransaction:real.runTransaction,writeBatch:real.writeBatch,serverTimestamp:real.serverTimestamp,deleteField:real.deleteField,Timestamp:real.Timestamp};
  const adminRead=async p=>{let data=null;await env.withSecurityRulesDisabled(async context=>{const snap=await real.getDoc(real.doc(context.firestore(),p));data=snap.exists()?snap.data():null;});return data;};
  const confirmedAtMs=async()=>{const s=await adminRead(`rivalries/${W.RIVALRY}/sharedSetup/authoritative`);return s&&s.updatedAt&&typeof s.updatedAt.toMillis==="function"?s.updatedAt.toMillis():null;};
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const standinPoints={};
  for(const call of calls)if(call.provider==="Pack"&&call.fn==="pointsFor"&&call.out.value>0)standinPoints[`${call.extra.season}:${call.role}`]=call.out.value;
  for(const call of calls){
    const role=call.role;let got;
    try{
      if(call.provider==="Pack"){
        const step=packStep[call.tab]||(packStep[call.tab]=freshModule("js/iconGuessStep.js"));
        const season=call.extra.season;
        const io={firestore:db(role),sdk,rivalryId:W.RIVALRY,sessionId:W.SESSION,deviceId:call.deviceId,now:()=>Date.now()};
        const ctx={rivalryId:W.RIVALRY,managerRole:role,season,confirmedAtMs:await confirmedAtMs()};
        if(call.fn==="arrive"){const v=await step.arrive(io,ctx);got={ok:true,value:v};}
        else if(call.fn==="guess"){
          // Wait, in real time, for the same stage window the stand-in guess landed in (the round starts after both arrived).
          const record=step.record(await adminRead(`rivalries/${W.RIVALRY}/primePackRounds/season_${season}`),season);
          const start=record&&Guess.startMs(record);
          // Aim for the stage the stand-in guess landed in. The serial recording queue can hold a stage-1 tap past the stage-1
          // timer, so take the stage from the points the stand-in gave this manager (4/3/2/1), else the planned stage.
          const won=standinPoints[`${season}:${role}`],beat=Guess.stagePoints.indexOf(won)>=0?Guess.stagePoints.indexOf(won):call.extra.stage-1;
          if(start){const at=start+Guess.stageStarts[beat]+Guess.stages[beat].revealMs+250;if(at>Date.now())await sleep(at-Date.now());}
          const v=await step.applyGuess(io,ctx,call.extra.correct);got={ok:v.ok!==false,reason:v.reason};
        }else if(call.fn==="pointsFor"){const v=await step.pointsFor(io,ctx);packPoints[`${season}:${role}`]=v;got={ok:true,value:v};}
      }else{
        const extra=JSON.parse(JSON.stringify(call.extra));
        // The published result carries the Prime Pack points this emulator round gave (its own server clock decides them).
        if(call.provider==="Results"&&call.fn==="publishResult"&&extra.result){const k=`${extra.seasonNumber}:${role}`;if(k in packPoints){if(packPoints[k]>0)extra.result.primePack=packPoints[k];else delete extra.result.primePack;}}
        const options={user:{uid:W.ACCOUNT[role]},firestore:db(role),firebaseSdk:sdk,rivalryId:W.RIVALRY,sessionId:W.SESSION,deviceId:call.deviceId,nowEpochMs:Date.now(),cryptoImpl:crypto.webcrypto,...extra};
        const {outcomeOf}=require("./ring1.cjs");
        got=outcomeOf(await PROVIDERS[call.provider][call.fn](options));
      }
    }catch(error){got={threw:error.code||String(error.message||error).slice(0,160)};}
    const want=call.out;
    const same=want.threw!==undefined?got.threw===want.threw:got.threw===undefined&&got.ok===want.ok&&(got.code||null)===(want.code||null)&&Boolean(got.replayed)===Boolean(want.replayed)&&(call.fn!=="pointsFor"||got.value===want.value)&&(got.reason||null)===(want.reason||null);
    if(!same){
      // Kinder: the stand-in took it as a new action, production did not (refused it, or the provider found it already
      // done because the Rules had refused the stand-in's extra write).
      const kinder=want.ok&&!want.threw&&!want.replayed&&(got.threw==="permission-denied"||got.ok===false||got.replayed===true);
      const harsher=(want.ok===false||want.threw)&&got.ok===true&&!got.threw;
      const entry={kind:kinder?"KINDER_STANDIN":harsher?"HARSHER_STANDIN":"DIFFER",seq:call.seq,role,call:`${call.provider}.${call.fn}`,extra:JSON.stringify(call.extra).slice(0,300),standin:want,emulator:got};
      (kinder?report.alarms:report.differences).push(entry);
      break;// later calls build on this one; the first difference is the finding
    }
  }
  // The calm differential: every document the stand-in holds is on the emulator with the same phase, revision, season.
  if(!report.alarms.length&&!report.differences.length){
    for(const [p,entry] of story.world.server.docs){
      const mine=entry.data,theirs=await adminRead(p);
      if(!theirs){report.differences.push({kind:"DOC_MISSING",path:p});continue;}
      for(const key of ["phase","revision","seasonNumber","totalSeasons","objectType"])if(mine[key]!==undefined&&JSON.stringify(mine[key])!==JSON.stringify(theirs[key]))report.differences.push({kind:"DOC_DIFFERS",path:p,key,standin:mine[key],emulator:theirs[key]});
    }
  }
  report.wallMs=Date.now()-started;
  return report;
}

// ---------------------------------------------------------------------------------------------------------------
// Worker: one emulator project, its seeds in order. Parent: the pool and the report.
// ---------------------------------------------------------------------------------------------------------------
async function worker(opt){
  if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error("run inside the Firestore emulator (FIRESTORE_EMULATOR_HOST is not set)");
  // --self-test kinder: the stand-in drops its Rules model (accepts every write), so the alarm must fire. An alarm that
  // never fires proves nothing.
  if(opt["self-test"]==="kinder")require("./rules-model.cjs").rules=()=>null;
  const real=require("firebase/firestore");
  const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");
  const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(":");
  const rules=fs.readFileSync(path.join(ROOT,"firestore.spark.generated.rules"),"utf8");
  // One emulator project per worker (a project per story exhausts the emulator's memory), emptied before each story, and
  // signed-in clients that live for one story only (cleanup closes them): no open stream or transaction lock carries over.
  for(const seed of opt.seeds.split(",").map(Number)){
    let report,env=null;
    try{
      env=await initializeTestEnvironment({projectId:`demo-pos1m-ring2-w${opt.worker}`,firestore:{rules,host,port:Number(port)}});
      await env.clearFirestore();
      report=await replayStory(seed,env,real);
    }catch(error){report={seed,crash:String(error.stack||error).slice(0,800),alarms:[],differences:[{kind:"CRASH"}]};}
    finally{if(env)await env.cleanup().catch(()=>{});}
    process.stdout.write(`POS1M_RING2 ${JSON.stringify(report)}\n`);
  }
}

async function parent(opt){
  const seeds=Array.from({length:opt.stories},(_,i)=>opt.seed+i);
  const groups=Array.from({length:Math.min(opt.workers,seeds.length)},()=>[]);
  seeds.forEach((s,i)=>groups[i%groups.length].push(s));
  const started=Date.now(),reports=[];
  await Promise.all(groups.map((group,i)=>new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[__filename,"--worker",String(i+1),"--seeds",group.join(","),...(opt["self-test"]?["--self-test",opt["self-test"]]:[])],{stdio:["ignore","pipe","inherit"],env:process.env});
    let buffer="";
    child.stdout.on("data",d=>{buffer+=d;let n;while((n=buffer.indexOf("\n"))>=0){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);if(line.startsWith("POS1M_RING2 ")){const r=JSON.parse(line.slice(12));reports.push(r);const bad=r.alarms.length||r.differences.length;console.log(`${bad?"FAIL":"ok  "} seed ${r.seed} (${r.totalSeasons} seasons${r.sackedSeason?`, sacked ${r.sackedSeason}`:""}): ${r.calls} calls${bad?`: ${JSON.stringify((r.alarms[0]||r.differences[0])).slice(0,400)}`:""} ${r.crash?r.crash.slice(0,300):""}`);}}});
    child.on("close",code=>code===0?resolve():reject(new Error(`worker ${i+1} exited ${code}`)));
  })));
  reports.sort((a,b)=>a.seed-b.seed);
  const alarms=reports.filter(r=>r.alarms.length),differ=reports.filter(r=>r.differences.length);
  const summary={engine:"POS1M",ring:2,stories:reports.length,survived:reports.length-new Set([...alarms,...differ].map(r=>r.seed)).size,kinderStandinAlarms:alarms.length,differences:differ.length,calls:reports.reduce((n,r)=>n+(r.calls||0),0),wallMs:Date.now()-started,firstSeed:opt.seed,reports};
  if(opt.out)fs.writeFileSync(opt.out,JSON.stringify(summary,null,1));
  console.log(alarms.length?`ALARM POS1M Ring 2: the stand-in was kinder than the production Rules in ${alarms.length} of ${reports.length} stories (Ring 1 is blind there; fix tests/pos1m/rules-model.cjs or the stand-in first)`:"no kinder-stand-in alarm");
  console.log(summary.survived===reports.length?`PASS POS1M Ring 2: ${reports.length} stories on the emulator under the composed Rules matched the stand-in call for call (${summary.calls} calls, ${(summary.wallMs/1000).toFixed(0)} s)`:`FAIL POS1M Ring 2: ${reports.length-summary.survived} of ${reports.length} stories differ`);
  process.exitCode=summary.survived===reports.length?0:1;
  if(opt["self-test"]==="kinder"){
    const fired=alarms.length>0;
    console.log(fired?`PASS POS1M Ring 2 self-test: without its Rules model the stand-in is kinder, and the alarm fired in ${alarms.length} stories`:"FAIL POS1M Ring 2 self-test: the stand-in had no Rules model and no alarm fired");
    process.exitCode=fired?0:1;
  }
}

if(require.main===module){
  const opt=args(process.argv.slice(2));
  (opt.worker?worker(opt):parent(opt)).catch(error=>{console.error(error.stack||error);process.exit(1);});
}
module.exports={ring2Plan,replayStory};
