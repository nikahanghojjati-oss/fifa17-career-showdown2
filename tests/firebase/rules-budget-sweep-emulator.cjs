"use strict";

// R93-08 worst-case Rules budget sweep (follow-up of hunt T2-1). Firestore refuses any write whose Rules evaluation spends
// more than 1,000 expressions on one document, and the app then shows a refusal for a write that is perfectly legal. This
// sweep plays the real flows of a Showdown on the emulator against the COMPOSED production Rules, measures every write they
// make (tests/support/rules-budget-recorder.cjs) and holds each kind of write to the agreed bar:
//   - no write the flows make may be refused by the expression limit;
//   - every kind of write keeps at least 15% headroom (uses at most 850 of the 1,000);
//   - no kind of write is more expensive than its recorded baseline (tests/fixtures/rules-budget/baseline.json, with one
//     calibration step of tolerance);
//   - every baseline kind is still played (a kind that disappears is a coverage loss, not a pass).
// Every kind under 30% headroom (over 700) is printed as the close-to-limit list. Kinds the bar cannot hold yet are listed
// in the baseline as "knownOver" with the reason; they still fail if they get any worse.
// R94-06: the same replays also count each write's Rules lookups (get/exists/getAfter/existsAfter), which Firestore caps at
// 10 distinct documents for one written document and 20 for a whole batch or transaction:
//   - no kind of write may come within 1 of its cap (9 of 10 for a one-document request, 19 of 20 for a batch or
//     transaction, 9 of 10 for any one document of it);
//   - no kind may look up more documents than its recorded baseline ("lookups" in the same baseline file; exact counts).
// `--update-baseline` rewrites the baseline from this run (review the diff like any other pin).

const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawnSync}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const BASELINE=path.join(ROOT,"tests/fixtures/rules-budget/baseline.json");
const RECORDER=path.join(ROOT,"tests/support/rules-budget-recorder.cjs");
const HARD_LIMIT=850,CLOSE=700;
const LOOKUP_CAP={request:20,single:10,doc:10},LOOKUP_MARGIN=1;
const lookupCap=item=>item.documents>1?LOOKUP_CAP.request:LOOKUP_CAP.single;
// The flows. Each runs exactly as in the Gate, with the recorder preloaded; its own assertions still decide pass or fail.
const SUITES=[
  {file:"tests/firebase/two-manager-journey-emulator.cjs",env:{CMS_SHOWDOWN_LENGTH:"10"},covers:"pairing, sessions, setup, Career Start, Transfer War, Season Results, season commits, Final and Terminal Close over 10 seasons, both managers"},
  {file:"tests/firebase/transfer-lock-budget-emulator.cjs",env:{LOCK_BUDGET_QUICK:"1"},covers:"worst Transfer War locks: 3 guesses, 3 picked signings with every key and 80-character names"},
  {file:"tests/firebase/prime-pack-ten-season-emulator.cjs",env:{},covers:"Prime Pack rounds over 10 seasons"},
  {file:"tests/firebase/sacked-rules-emulator.cjs",env:{},covers:"Sacked ticks, both managers sacked, 15-point seasons"},
  {file:"tests/firebase/europa-league-rules-emulator.cjs",env:{},covers:"Europa League and Champions League results"},
  {file:"tests/firebase/chamber-men-rules-emulator.cjs",env:{},covers:"Chamber Men rounds and Russian Roulette"},
  {file:"tests/firebase/squad-sheets-rules-emulator.cjs",env:{},covers:"Squad Management sheets"},
  {file:"tests/firebase/persistent-nik-daniel-pair-provider-emulator.cjs",env:{},covers:"permanent pairing and joining"},
  {file:"tests/firebase/shared-terminal-close-production-provider-emulator.cjs",env:{},covers:"Terminal Close"},
  {file:"tests/firebase/career-index-emulator.cjs",env:{},covers:"career index and History"},
  {file:"tests/firebase/r94-club-draw-rules-emulator.cjs",env:{},covers:"R94-02 club draw: setup ledgers with stops (open, steps 2-4, both confirms) and the old shape"},
  {file:"tests/firebase/r95-ball-game-rules-emulator.cjs",env:{},covers:"R95-01 Ball Game: draw 3 setup ledgers with stops + draw (6 clubs per ball; open, steps 2-4, both confirms)"},
  // R94-06 job 4: the saves the flows above never make (tests/fixtures/rules-budget/write-sites.json maps every client save).
  {file:"tests/firebase/career-start-marker-emulator.cjs",env:{},covers:"R94-06: the real-career marker (accounts/*/careerStart/current)"},
  {file:"tests/firebase/career-summary-emulator.cjs",env:{},covers:"R94-06: career summaries written on first open"},
  {file:"tests/firebase/permanent-partner-emulator.cjs",env:{},covers:"R94-06: permanent partner records and the JOIN note"},
  {file:"tests/firebase/shared-reads-meter-emulator.cjs",env:{},covers:"R94-06: the shared reads-today meter"},
  {file:"tests/firebase/spark-account-bootstrap-emulator.cjs",env:{RULES_BUDGET_SWEEP_COMPOSE:"1"},covers:"R94-06: first sign-in account bootstrap (suite moved onto the composed Rules for the sweep)"},
  {file:"tests/firebase/r94-other-saves-emulator.cjs",env:{},covers:"R94-06: device register and revoke, session offer, connected shared state"}
];

function runSuite(suite,out){
  const started=Date.now();
  const result=spawnSync(process.execPath,["-r",RECORDER,suite.file],{cwd:ROOT,encoding:"utf8",maxBuffer:256*1024*1024,
    env:{...process.env,...suite.env,RULES_BUDGET_SWEEP_OUT:out,RULES_BUDGET_SWEEP_SUITE:path.basename(suite.file)}});
  const seconds=Math.round((Date.now()-started)/1000);
  if(result.status!==0){process.stderr.write(result.stdout.slice(-4000)+result.stderr.slice(-8000));throw new Error(`${suite.file} failed under the sweep (exit ${result.status})`);}
  return seconds;
}

function aggregate(records){
  const kinds=new Map();
  for(const record of records){
    if(record.inSuite!=="accepted")continue;
    if(!kinds.has(record.kind))kinds.set(record.kind,{kind:record.kind,writes:0,used:null,lookups:null,lookupsPerDoc:{},documents:0,suites:new Set(),replayRefused:0,uids:new Set()});
    const item=kinds.get(record.kind);
    item.writes+=1;item.suites.add(record.suite);item.uids.add(record.uid);item.documents=Math.max(item.documents,(record.paths||[]).length);
    if(record.replayRefused){item.replayRefused+=1;item.replayMessage=record.replayRefused;continue;}
    const lookups=typeof record.lookups==="number"?record.lookups:record.lookupsAtMost;
    if(typeof lookups==="number"&&(item.lookups===null||lookups>item.lookups))item.lookups=lookups;
    for(const [doc,count] of Object.entries(record.lookupsPerDoc||{}))item.lookupsPerDoc[doc]=Math.max(item.lookupsPerDoc[doc]??0,count);
    const used=typeof record.used==="number"?record.used:(typeof record.notWorseThanUsed==="number"?null:null);
    if(used!==null&&(item.used===null||used>item.used)){item.used=used;item.worstSuite=record.suite;item.worstSeq=record.seq;item.worstPaths=record.paths;}
  }
  return [...kinds.values()].sort((a,b)=>(b.used??-1)-(a.used??-1));
}

(async()=>{
  const update=process.argv.includes("--update-baseline");
  const only=process.env.RULES_BUDGET_SWEEP_ONLY;
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"rules-budget-sweep-"));
  const records=[];const timings=[];
  for(const suite of SUITES){
    if(only&&!suite.file.includes(only))continue;
    const out=path.join(dir,`${path.basename(suite.file)}.jsonl`);
    const seconds=runSuite(suite,out);timings.push(`${path.basename(suite.file)} ${seconds}s`);
    if(fs.existsSync(out))for(const line of fs.readFileSync(out,"utf8").split("\n"))if(line.trim())records.push(JSON.parse(line));
  }
  const calibration=records.find(r=>r.calibration)?.calibration;
  const step=calibration?Math.ceil(1000/(calibration.plain+1)):4;
  const kinds=aggregate(records);
  const baseline=fs.existsSync(BASELINE)?JSON.parse(fs.readFileSync(BASELINE,"utf8")):{kinds:{}};
  const lines=[];
  lines.push(`RULES_BUDGET_SWEEP calibration=${JSON.stringify(calibration)} step=+/-${step} writes=${records.filter(r=>r.inSuite==="accepted").length} kinds=${kinds.length} (${timings.join(", ")})`);
  for(const item of kinds){
    const base=baseline.kinds[item.kind];
    const tag=item.used===null?"UNMEASURED":item.used>1000?"REFUSED":item.used>HARD_LIMIT?"OVER-85%":item.used>CLOSE?"CLOSE":"ok";
    const perDoc=Object.values(item.lookupsPerDoc);
    lines.push(`RULES_BUDGET ${tag.padEnd(10)} used~${String(item.used??"?").padStart(4)}/1000 headroom~${item.used===null?"?":1000-item.used} baseline=${base?base.used:"-"} lookups=${item.lookups??"?"}/${lookupCap(item)}${perDoc.length?` perDoc<=${Math.max(...perDoc)}/10`:""} (baseline ${base&&typeof base.lookups==="number"?base.lookups:"-"}) writes=${item.writes} by=${[...item.uids].length} :: ${item.kind}`);
  }
  process.stdout.write(lines.join("\n")+"\n");
  if(process.env.RULES_BUDGET_SWEEP_REPORT)fs.writeFileSync(process.env.RULES_BUDGET_SWEEP_REPORT,JSON.stringify({calibration,step,kinds:kinds.map(k=>({...k,suites:[...k.suites],uids:[...k.uids]}))},null,2));
  if(update){
    const next={schemaVersion:1,note:"R93-08 Rules budget sweep baseline: the worst measured expressions per kind of write (of 1,000). Regenerate with node tests/firebase/rules-budget-sweep-emulator.cjs --update-baseline under the Firestore emulator, and review the diff.",kinds:{}};
    for(const item of kinds)if(item.used!==null)next.kinds[item.kind]={used:item.used,...(item.lookups!==null?{lookups:item.lookups}:{}),...(baseline.kinds[item.kind]?.knownOver?{knownOver:baseline.kinds[item.kind].knownOver}:{})};
    fs.mkdirSync(path.dirname(BASELINE),{recursive:true});
    fs.writeFileSync(BASELINE,JSON.stringify(next,null,2)+"\n");
    process.stdout.write(`UPDATED ${path.relative(ROOT,BASELINE)} (${Object.keys(next.kinds).length} kinds)\n`);
    return;
  }
  const failures=[];
  for(const item of kinds){
    const base=baseline.kinds[item.kind];
    if(item.replayRefused)failures.push(`${item.kind}: ${item.replayRefused} replay(s) refused outside the expression limit (${item.replayMessage})`);
    if(item.used===null){if(!item.replayRefused)failures.push(`${item.kind}: not measured`);continue;}
    if(item.used>1000)failures.push(`${item.kind}: refused by the 1,000-expression limit`);
    if(!base){if(!only)failures.push(`${item.kind}: new kind of write with no baseline (used ~${item.used}); record it with --update-baseline`);continue;}
    if(item.used>base.used+step)failures.push(`${item.kind}: used ~${item.used}, worse than its baseline ${base.used}`);
    if(item.used>HARD_LIMIT&&!base.knownOver)failures.push(`${item.kind}: used ~${item.used}, under 15% headroom`);
  }
  for(const item of kinds){
    if(item.replayRefused)continue;
    const base=baseline.kinds[item.kind],cap=lookupCap(item);
    if(item.lookups===null){failures.push(`${item.kind}: Rules lookups not measured`);continue;}
    if(item.lookups>=cap-LOOKUP_MARGIN)failures.push(`${item.kind}: ${item.lookups} of ${cap} Rules lookups for the request, within ${LOOKUP_MARGIN} of the lookup cap`);
    for(const [doc,count] of Object.entries(item.lookupsPerDoc))if(count>=LOOKUP_CAP.doc-LOOKUP_MARGIN)failures.push(`${item.kind}: up to ${count} of ${LOOKUP_CAP.doc} Rules lookups for ${doc}, within ${LOOKUP_MARGIN} of the lookup cap`);
    if(!base)continue;
    if(typeof base.lookups!=="number"){if(!only)failures.push(`${item.kind}: no lookup baseline (${item.lookups} lookups); record it with --update-baseline`);continue;}
    if(item.lookups>base.lookups)failures.push(`${item.kind}: ${item.lookups} Rules lookups, more than its baseline ${base.lookups}`);
  }
  if(!only)for(const kind of Object.keys(baseline.kinds))if(!kinds.some(item=>item.kind===kind))failures.push(`${kind}: in the baseline but no flow made it any more`);
  assert.equal(failures.length,0,`Rules budget sweep failed:\n- ${failures.join("\n- ")}`);
  const close=kinds.filter(item=>item.used>CLOSE);
  const lookupWorst=[...kinds].sort((a,b)=>b.lookups/lookupCap(b)-a.lookups/lookupCap(a)).slice(0,3);
  process.stdout.write(`PASS R93-08 Rules budget sweep: ${kinds.length} kinds of write from ${SUITES.length} flows on the composed production Rules; none refused, none worse than its baseline; ${close.length} under 30% headroom: ${close.map(item=>`~${item.used}`).join(", ")}. R94-06 lookups: none within ${LOOKUP_MARGIN} of a cap, none above its baseline; most used ${lookupWorst.map(item=>`${item.lookups}/${lookupCap(item)}`).join(", ")}.\n`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
