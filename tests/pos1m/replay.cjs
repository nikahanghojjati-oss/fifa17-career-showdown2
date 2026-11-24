"use strict";
// POS1M replays: every saved failure (tests/pos1m/replays/*.json, kept forever) must now pass.
//   node tests/pos1m/replay.cjs [file ...]     (no files: all of tests/pos1m/replays/; POS1M_TRACE=1 prints the story)
// A replay file holds {seed, plan, law, detail}; the story runs again exactly as it was found. Exit 1 when any replay
// breaks a law again (with its fix brief). A replay found with a planted bug (planted: id) installs that bug first and
// must break its law: that proves the replay file still reproduces.
const fs=require("node:fs");
const path=require("node:path");
const {fixBrief}=require("./shrink.cjs");
const DIR=path.join(__dirname,"replays");

const files=process.argv.slice(2).length?process.argv.slice(2).map(f=>path.resolve(f)):fs.readdirSync(DIR).filter(n=>n.endsWith(".json")).sort().map(n=>path.join(DIR,n));
const planted=files.map(f=>JSON.parse(fs.readFileSync(f,"utf8"))).find(r=>r.planted);
if(planted&&files.length>1)throw new Error("run a planted-bug replay on its own (it installs that bug)");
if(planted){const M=require("./mutant.cjs");M.install(M.list().find(b=>b.id===planted.planted));}
const {runStory}=require("./ring1.cjs");
(async()=>{
  let failed=0;
  for(const file of files){
    const replay=JSON.parse(fs.readFileSync(file,"utf8"));
    const trace=process.env.POS1M_TRACE==="1";
    const s=await runStory(replay.seed,{plan:replay.plan,keep:trace});
    if(trace){for(const line of s.story.sim.trace.slice(-300))console.log(line);for(const m of s.story.moves)console.log(JSON.stringify(m));}
    const again=s.violations.find(v=>v.law===replay.law);
    if(replay.planted){
      if(again)console.log(`OK ${path.basename(file)}: the planted bug ${replay.planted} still breaks ${replay.law}`);
      else{failed+=1;console.log(`FAIL ${path.basename(file)}: the planted bug ${replay.planted} no longer breaks ${replay.law} on this replay`);}
      continue;
    }
    if(s.violations.length||s.error){failed+=1;console.log(`FAIL ${path.basename(file)}: ${s.violations.map(v=>`${v.law}: ${v.detail}`).join(" | ")||s.error}`);console.log(fixBrief(replay,file));}
    else console.log(`PASS ${path.basename(file)}`);
  }
  console.log(failed?`FAIL POS1M replays: ${failed} of ${files.length}`:`PASS POS1M replays: ${files.length} of ${files.length}`);
  process.exitCode=failed?1:0;
})();
