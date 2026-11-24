"use strict";
// POS1M shrinker: a failing story becomes the smallest plan that still breaks the same law, saved as a replay file
// (tests/pos1m/replays/, kept forever) and remembered in tests/pos1m/memory.json (capped at 200 entries).
//   node tests/pos1m/shrink.cjs --seed 70001 [--law L13_REPEAT_ONCE] [--mutant P19-results-replay-lost] [--dir out/]
// Greedy, one knob at a time, each kept only when the same law still breaks: fewer fault moves (halving to none), each
// network fault off, listener delay and clock skew off, the window run-out off, a shorter whole Showdown. The story is
// deterministic from (seed, plan), so the replay reproduces it exactly on the same code.
// Prints the fix brief (template below). With --mutant the planted bug is installed first (to prove the shrinker; such
// replays go to --dir, never into tests/pos1m/replays/, because the unchanged game passes them).
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {execSync}=require("node:child_process");

const REPLAYS=path.join(__dirname,"replays");
const MEMORY=path.join(__dirname,"memory.json");
const MEMORY_CAP=200;
// What each law means in Nik's words, for the fix brief.
const LAW_TEXT={
  L1_ONE_COMMIT:"At most one commit per season, holding exactly what both managers published, never changed once accepted.",
  L2_NO_INVENTED_ACTION:"No phone ever writes an action for the other manager.",
  L3_NO_TIEBREAK:"Equal totals are a draw. There is no tiebreak anywhere.",
  L4_PRIVACY:"Guesses, signings and results stay hidden until the game reveals them.",
  L5_ORDER:"The steps happen in order and none is skipped (League Roulette, roulette, Prime Pack, Transfer War, results, commit).",
  L6_PRIME_PACK:"Prime Pack has one winner worth 4, 3, 2 or 1 by the server time of his right guess, or no winner.",
  L7_EL_OR_CL:"Europa League +3 or Champions League +5, never both; season scores follow the rules.",
  L8_GUESSED_PLAYER:"A signing the rival guessed is released and can never be signed again.",
  L9_SACKED_ENDS:"Sacked ends the Showdown after that season, and the points so far decide.",
  L10_HISTORY_ONCE:"History counts only finished seasons, each once, with the right totals.",
  L11_CONVERGE:"Once the faults stop, both phones show the same step and totals.",
  L12_LIVENESS:"From every state there is a fair way to the end.",
  L13_REPEAT_ONCE:"A repeated tap counts once, and a tap that took effect is never answered as refused.",
  L14_BUDGET:"A look never writes; writes per season stay inside the budget."
};

function head(){try{return execSync("git rev-parse HEAD",{cwd:path.resolve(__dirname,"../.."),encoding:"utf8"}).trim();}catch(_error){return null;}}
const signatureOf=(law,detail)=>`${law}: ${String(detail||"").replace(/season_\d+|\d+/g,"#").replace(/(playerOne|playerTwo)/g,"P").slice(0,160)}`;

function variants(plan){
  const out=[];
  if(plan.chaos&&plan.chaos.rate){
    for(let b=Math.floor(plan.chaos.budget/2);b>=1;b=Math.floor(b/2))out.push(["chaos budget "+b,p=>({...p,chaos:{...p.chaos,budget:b}})]);
    out.push(["no fault moves",p=>({...p,chaos:{rate:0}})]);
  }
  for(const key of ["callError","lostAck","phantomAbort","listenerStall","listenerDeath"])if(plan.faults&&plan.faults[key])out.push([`${key} off`,p=>({...p,faults:{...p.faults,[key]:0}})]);
  if(plan.faults&&plan.faults.listenerDelayMs)out.push(["listener delay off",p=>({...p,faults:{...p.faults,listenerDelayMs:0}})]);
  if(plan.skewMs&&(plan.skewMs.playerOne||plan.skewMs.playerTwo))out.push(["clock skew off",p=>({...p,skewMs:{playerOne:0,playerTwo:0}})]);
  if(plan.expireWindow)out.push(["window run-out off",p=>({...p,expireWindow:false})]);
  if(plan.kind==="full"&&!plan.sackedSeason)for(const L of [1,3,5].filter(L=>L<plan.totalSeasons))out.push([`${L}-season Showdown`,p=>({...p,totalSeasons:L})]);
  return out;
}

async function shrink(seed,{law=null,runStory,planFor}){
  let plan=planFor(seed);
  const first=await runStory(seed,{plan});
  const broken=first.violations.find(v=>!law||v.law===law);
  if(!broken)return {reproduced:false,first};
  law=broken.law;let detail=broken.detail;const steps=[];
  for(let changed=true;changed;){
    changed=false;
    for(const [label,apply] of variants(plan)){
      const next=apply(plan),s=await runStory(seed,{plan:next});
      const v=s.violations.find(x=>x.law===law);
      if(v){plan=next;detail=v.detail;steps.push(label);changed=true;break;}
    }
  }
  return {reproduced:true,law,detail,plan,steps};
}

function fixBrief(replay,file){
  return [
    `POS1M FIX BRIEF: ${replay.law}`,
    `Rule: ${LAW_TEXT[replay.law]||replay.law}`,
    `What broke: ${replay.detail}`,
    `Replay (deterministic): node tests/pos1m/replay.cjs ${path.relative(path.resolve(__dirname,"../.."),file)}`,
    `Story: seed ${replay.seed}, ${replay.plan.kind} ${replay.plan.totalSeasons}-season Showdown from season ${replay.plan.fromSeason}${replay.plan.sackedSeason?`, sacked in season ${replay.plan.sackedSeason}`:""}; shrunk by: ${replay.shrunk.join(", ")||"nothing"}.`,
    `Found at: ${replay.head||"unknown head"}${replay.planted?` with planted bug ${replay.planted}`:""}.`,
    "Fix: find the cause in the game code the replay runs (trace with POS1M_TRACE=1), fix it, keep the replay file (it must pass from now on), and add a planted bug if no law would have named the cause.",
    "Model: sensitive work (integrity, sync, saves, History): Opus high or Fable high only."
  ].join("\n");
}

function remember(replay,file){
  let memory={schemaVersion:1,cap:MEMORY_CAP,entries:[]};
  try{memory=JSON.parse(fs.readFileSync(MEMORY,"utf8"));}catch(_error){}
  const signature=signatureOf(replay.law,replay.detail),now=new Date().toISOString();
  const entry=memory.entries.find(e=>e.signature===signature);
  if(entry){entry.count+=1;entry.lastSeen=now;entry.lastHead=replay.head;}
  else memory.entries.push({signature,law:replay.law,detail:replay.detail,replay:path.basename(file),firstSeen:now,lastSeen:now,firstHead:replay.head,lastHead:replay.head,count:1});
  memory.entries.sort((a,b)=>b.lastSeen.localeCompare(a.lastSeen));
  memory.entries=memory.entries.slice(0,MEMORY_CAP);
  fs.writeFileSync(MEMORY,`${JSON.stringify(memory,null,1)}\n`);
  return signature;
}

if(require.main===module){
  (async()=>{
    const argv=process.argv.slice(2),opt={};
    for(let i=0;i<argv.length;i+=2)opt[argv[i].replace(/^--/,"")]=argv[i+1];
    if(opt.mutant){const M=require("./mutant.cjs");M.install(M.list().find(b=>b.id===opt.mutant));}
    const {runStory,planFor}=require("./ring1.cjs");
    const seed=Number(opt.seed);
    const result=await shrink(seed,{law:opt.law||null,runStory,planFor});
    if(!result.reproduced){console.log(`seed ${seed}: no ${opt.law||"law"} broke, nothing to shrink`);process.exitCode=1;return;}
    const replay={schemaVersion:1,engine:"POS1M",law:result.law,detail:result.detail,seed,plan:result.plan,shrunk:result.steps,head:head(),planted:opt.mutant||null,savedAt:new Date().toISOString()};
    const dir=opt.dir?path.resolve(opt.dir):opt.mutant?null:REPLAYS;
    if(!dir){console.log("a planted-bug replay needs --dir (tests/pos1m/replays holds real failures only)");process.exitCode=1;return;}
    fs.mkdirSync(dir,{recursive:true});
    const id=crypto.createHash("sha256").update(JSON.stringify({seed,plan:result.plan})).digest("hex").slice(0,10);
    const file=path.join(dir,`${result.law}-${seed}-${id}.json`);
    fs.writeFileSync(file,`${JSON.stringify(replay,null,1)}\n`);
    if(!opt.mutant)remember(replay,file);
    console.log(fixBrief(replay,file));
  })().catch(error=>{console.error(error);process.exitCode=1;});
}
module.exports={shrink,fixBrief,remember,signatureOf,LAW_TEXT,MEMORY_CAP};
