"use strict";
// POS1M Ring 3: budgets. Compares the Ring 3 meter of a CE2PG run (report.ring3, tests/browser/support/ring3-meter.cjs) with the
// baseline (tests/pos1m/ring3-baseline.json, measured on 2.12.0 = gameplay/r99 a64b284a, the release Phoenix builds on).
//   node tests/pos1m/ring3.cjs --after test-results/ce2pg-single-3-1.json [--before <ce2pg report or baseline file>] [--out ring3.json]
//   node tests/pos1m/ring3.cjs --make-baseline <ce2pg report> --commit <sha> --release 2.12.0 > tests/pos1m/ring3-baseline.json
// Hard budgets (exit 1 when broken), both phones, per season:
//   billed reads (documents + Rules lookups)   after <= before x 1.05 + 20
//   writes                                     after <= before x 1.05 + 5
//   minutes outside FIFA (FIFA time stubbed)   after <= before x 1.10 + 0.25 min
//   tap -> next screen ready, all steps, p90   after <= before x 1.25 + 250 ms
//   Reus Gate hold, all screens, p90           after <= before x 1.25 + 500 ms
//   rival move -> screen, all screens, p90     after <= before x 1.25 + 500 ms
// Per step (screen or tap step, seen at least 3 times in both runs): the same timing ratios and billed reads x 1.10 + 25 are WARN
// lines, not failures (one run on a shared runner is too noisy to fail a PR on one step).
const fs=require("node:fs");
const {seasonMinutes}=require("../browser/support/ring3-meter.cjs");

const LIMITS={
  billed:{ratio:1.05,plus:20,unit:"billed reads/season"},
  writes:{ratio:1.05,plus:5,unit:"writes/season"},
  minutes:{ratio:1.10,plus:0.25,unit:"min/season"},
  tapToReady:{ratio:1.25,plus:250,unit:"ms p90"},
  reusHold:{ratio:1.25,plus:500,unit:"ms p90"},
  rivalToScreen:{ratio:1.25,plus:500,unit:"ms p90"},
  stepBilled:{ratio:1.10,plus:25,unit:"billed/season"}
};
const MIN_SAMPLES=3;

function args(argv){
  const out={after:null,before:"tests/pos1m/ring3-baseline.json",out:null,"make-baseline":null,commit:null,release:null};
  for(let i=0;i<argv.length;i+=2){const k=argv[i].replace(/^--/,"");if(!(k in out))throw new Error(`unknown option ${argv[i]}`);out[k]=argv[i+1];}
  return out;
}
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
// The per-season figures of one run (or of a baseline file, which already holds them).
function figures(file){
  const json=JSON.parse(fs.readFileSync(file,"utf8"));
  if(json.kind==="pos1m-ring3-baseline")return json;
  const r=json.ring3;
  if(!r||r.error)throw new Error(`${file} has no Ring 3 meter (${r&&r.error||"report.ring3 missing"}); run CE2PG from a tree with tests/browser/support/ring3-meter.cjs`);
  const seasons=r.seasons.billed;
  return {
    kind:"pos1m-ring3-run",source:file,verdict:json.verdict,
    perSeason:{
      seasons:seasons.length,
      billed:+mean(seasons.map(s=>s.billed)).toFixed(1),
      writes:+mean(seasons.map(s=>s.writes)).toFixed(1),
      minutes:+mean(seasonMinutes(json.timings.phases).map(s=>s.minutes)).toFixed(2)
    },
    all:{tapToReady:r.all.tapToReady,reusHold:r.all.reusHold,rivalToScreen:r.all.rivalToScreen},
    tapToReady:r.tapToReady,reusHold:r.reusHold,rivalToScreen:r.rivalToScreen,steps:r.steps
  };
}
const within=(after,before,l)=>after<=before*l.ratio+l.plus;
const fmt=x=>x===null||x===undefined?"-":Number.isInteger(x)?String(x):x.toFixed(x<10?2:1);

function compare(before,after){
  const rows=[],warns=[];
  const hard=(name,b,a,l)=>{if(b===null||a===null||b===undefined||a===undefined){rows.push({name,before:b,after:a,limit:null,pass:false,note:"missing"});return;}const limit=+(b*l.ratio+l.plus).toFixed(2);rows.push({name,before:b,after:a,limit,unit:l.unit,pass:within(a,b,l)});};
  hard("billed reads per season",before.perSeason.billed,after.perSeason.billed,LIMITS.billed);
  hard("writes per season",before.perSeason.writes,after.perSeason.writes,LIMITS.writes);
  hard("minutes per season outside FIFA",before.perSeason.minutes,after.perSeason.minutes,LIMITS.minutes);
  for(const k of ["tapToReady","reusHold","rivalToScreen"])hard(`${k} (all, p90)`,before.all[k]&&before.all[k].p90,after.all[k]&&after.all[k].p90,LIMITS[k]);
  for(const k of ["tapToReady","reusHold","rivalToScreen"]){
    for(const [step,a] of Object.entries(after[k]||{})){
      const b=(before[k]||{})[step];if(!a||!b||a.n<MIN_SAMPLES||b.n<MIN_SAMPLES)continue;
      if(!within(a.p90,b.p90,LIMITS[k]))warns.push(`${k} ${step}: p90 ${b.p90} -> ${a.p90} ms (n ${b.n} -> ${a.n})`);
    }
  }
  for(const [step,a] of Object.entries(after.steps||{})){
    const b=(before.steps||{})[step];if(!b)continue;
    if(!within(a.billedPerSeason,b.billedPerSeason,LIMITS.stepBilled))warns.push(`billed on ${step}: ${b.billedPerSeason} -> ${a.billedPerSeason} per season`);
  }
  return {pass:rows.every(r=>r.pass),rows,warns};
}

function main(){
  const opt=args(process.argv.slice(2));
  if(opt["make-baseline"]){
    const f=figures(opt["make-baseline"]);
    const base={kind:"pos1m-ring3-baseline",release:opt.release||null,commit:opt.commit||null,measuredAt:new Date().toISOString().slice(0,10),
      how:"CE2PG_PLAN=single CE2PG_SEASONS=3 node tests/browser/ce2pg-journey.cjs on that commit, with the Ring 3 meter added to its harness only",
      limits:LIMITS,perSeason:f.perSeason,all:f.all,tapToReady:f.tapToReady,reusHold:f.reusHold,rivalToScreen:f.rivalToScreen,steps:f.steps};
    process.stdout.write(`${JSON.stringify(base,null,1)}\n`);return;
  }
  if(!opt.after)throw new Error("--after <ce2pg report> is required");
  const before=figures(opt.before),after=figures(opt.after),result=compare(before,after);
  const label=before.release?`${before.release} (${String(before.commit||"").slice(0,8)})`:opt.before;
  console.log(`POS1M Ring 3 budgets: before ${label}, after ${opt.after}`);
  for(const r of result.rows)console.log(`${r.pass?"ok  ":"FAIL"} ${r.name}: ${fmt(r.before)} -> ${fmt(r.after)}${r.limit!==null?` (limit ${fmt(r.limit)} ${r.unit})`:` (${r.note})`}`);
  for(const w of result.warns)console.log(`WARN ${w}`);
  if(opt.out)fs.writeFileSync(opt.out,`${JSON.stringify({engine:"POS1M",ring:3,before:label,after:opt.after,...result,perSeason:{before:before.perSeason,after:after.perSeason}},null,1)}\n`);
  console.log(result.pass?`PASS POS1M Ring 3: every budget held (${result.warns.length} step warning(s))`:`FAIL POS1M Ring 3: ${result.rows.filter(r=>!r.pass).length} budget(s) broken`);
  process.exitCode=result.pass?0:1;
}
if(require.main===module)main();
module.exports={compare,figures,LIMITS};
