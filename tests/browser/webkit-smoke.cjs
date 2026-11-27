"use strict";
// WebKit smoke (r100, Nik 2026-11-27): a one-time check of the frozen release candidate in Playwright's WebKit (Safari's engine),
// run by hand (.github/workflows/webkit-smoke.yml, workflow_dispatch only) next to the last red team. It is not a Gate lane and
// changes nothing in the Chromium runs: it reuses the CE2PG journey (tests/browser/ce2pg-journey.cjs) with its browser switch.
// Each leg is one real two-manager 1-season Showdown on the Firebase emulators with the composed Rules, start to Champion:
// sign in, the first-time code pairing and JOIN, League Roulette (WebGL2 works in WebKit, so the 3D board must draw), the
// Ball Game, Career Start, the Transfer War locks, Season Results, LOCK & CONFIRM SEASON and CONFIRM SEASON, the Showdown
// Champion screen, every career page on both phones, and a brand-new browser that signs in again. Pictures of Home, League
// Roulette and the Champion screen are kept for every page.
//   wooden    WebKit on both phones, Wooden clubhouse; Daniel desktop 1920x866, Nik phone 390x844 with touch. Nik's page
//             reloads mid-season (Chamber Men) and walks back in; Daniel double-taps LOCK & CONFIRM SEASON.
//   graphite  WebKit on both phones, Graphite clubhouse (key matte); the sizes swapped, Daniel's phone reloads mid-season.
//   mixed     Daniel on WebKit (phone 390x844, touch), Nik on Chromium (desktop 1920x866): the same Showdown across engines.
// Fail closed: a leg PASSES only if the journey exited 0 with verdict PASS, every required step is in its report and passed,
// and every planned mid-season reload fired and came back. A run that never got going (the browser, the emulators or the
// app server would not start) is INFRA; anything else is FAIL. Neither is a pass.
// Run:     node tests/browser/webkit-smoke.cjs leg <wooden|graphite|mixed>     (needs `npx playwright install webkit`)
//          node tests/browser/webkit-smoke.cjs infra <leg>                       (the workflow: setup failed before the leg ran)
//          node tests/browser/webkit-smoke.cjs summary [dir]                     (the table of every leg's report; fails closed)
// Output:  test-results/webkit-smoke-<leg>.json and .log, the journey's own report and screenshots (test-results/ce2pg-*).
// Test database only (demo project on the local emulators). Never touches production Firebase.
const fs=require("node:fs");
const path=require("node:path");
const {spawn}=require("node:child_process");

const ROOT=path.resolve(__dirname,"../..");
const OUT_DIR=path.join(ROOT,"test-results");
const JOURNEY="tests/browser/ce2pg-journey.cjs";
const COMMON={CE2PG_PLAN:"single",CE2PG_SEASONS:"1",CE2PG_RUN:"1",CMS_CHROMIUM_MULTI_CONTEXT:"1"};
const LEGS={
  wooden:{label:"WebKit both phones, Wooden; Daniel 1920x866, Nik 390x844 touch; Nik reloads mid-season; Daniel double-taps LOCK & CONFIRM SEASON",
    env:{CE2PG_BROWSER:"webkit",CE2PG_VP_DANIEL:"1920x866",CE2PG_VP_NIK:"390x844",CE2PG_RELOAD_AT:"chamber-continue:1:nik",CE2PG_DOUBLE_TAP:"commit"},webkit:["daniel","nik"]},
  graphite:{label:"WebKit both phones, Graphite; Daniel 390x844 touch, Nik 1920x866; Daniel reloads mid-season",
    env:{CE2PG_BROWSER:"webkit",CE2PG_CLUBHOUSE:"matte",CE2PG_VP_DANIEL:"390x844",CE2PG_VP_NIK:"1920x866",CE2PG_RELOAD_AT:"chamber-continue:1:daniel"},webkit:["daniel","nik"]},
  mixed:{label:"Daniel WebKit 390x844 touch, Nik Chromium 1920x866, Wooden",
    env:{CE2PG_BROWSER:"mixed",CE2PG_VP_DANIEL:"390x844",CE2PG_VP_NIK:"1920x866"},webkit:["daniel"]}
};
// The steps a leg must show in its report, each passed (a missing one is a red, never a pass).
function requiredChecks(leg){
  const def=LEGS[leg],both=["daniel","nik"],ids=[];
  ids.push(...both.map(u=>["boot.switch",u]),["boot.accounts","both"],["S.code","daniel"],["S.session","both"]);
  for(const u of both)ids.push(["smoke.home.shot",u],["smoke.home.clubhouse",u],["smoke.champion.shot",u],["smoke.champion.clubhouse",u]);
  for(const u of def.webkit)ids.push(["smoke.league.3d",u],["smoke.league-roulette.shot",u]);
  if(def.env.CE2PG_DOUBLE_TAP)ids.push(["smoke.S1.doubleTap","daniel"]);
  return ids;
}
const INFRA=/browserType\.launch|Executable doesn't exist|Host system is missing dependencies|Could not start the (Firestore|Auth) Emulator|emulators? (failed|exited)|EADDRINUSE|npm ERR!|Failed to load the composed Rules|composed production Rules did not activate/;

function journeyReport(leg){
  const env={...COMMON,...LEGS[leg].env};
  // the journey's own tag (tests/browser/ce2pg-journey.cjs TAG): single, 1 season, run 1, then browser and clubhouse
  return path.join(OUT_DIR,`ce2pg-single-1-1${env.CE2PG_BROWSER!=="chromium"?`-${env.CE2PG_BROWSER}`:""}${env.CE2PG_CLUBHOUSE?`-${env.CE2PG_CLUBHOUSE}`:""}.json`);
}

function judge(leg,{code,log,report}){
  const reasons=[];
  const checks=report&&Array.isArray(report.checks)?report.checks:[];
  if(!report||checks.length===0){
    const infra=INFRA.test(log);
    return {verdict:infra?"INFRA":"FAIL",reasons:[infra?`setup broke before the journey ran: ${(log.match(INFRA)||[""])[0]}`:"the journey wrote no report with checks"]};
  }
  if(code!==0)reasons.push(`the journey exited ${code}`);
  if(report.verdict!=="PASS")reasons.push(`journey verdict ${report.verdict||"none"}`);
  if(report.fatal)reasons.push(`stopped: ${String(report.fatal.message||report.fatal).slice(0,300)}`);
  for(const c of checks.filter(c=>!c.pass).slice(0,12))reasons.push(`check ${c.id} [${c.context}] failed: ${c.label}${c.detail?` -> ${String(c.detail).slice(0,200)}`:""}`);
  for(const [id,who] of requiredChecks(leg)){
    const found=checks.filter(c=>c.id===id&&(who==="both"||c.context===who));
    if(found.length===0)reasons.push(`required step missing: ${id} [${who}]`);
  }
  const rules=(LEGS[leg].env.CE2PG_RELOAD_AT||"").split(",").filter(Boolean);
  if(rules.length){
    const fired=log.match(/RELOAD rules fired (\d+)\/(\d+)/);
    const back=(log.match(/^RELOAD back /gm)||[]).length;
    if(!fired||fired[1]!==fired[2]||Number(fired[2])!==rules.length)reasons.push(`mid-season reload did not fire as planned (${fired?fired[0]:"no RELOAD summary"})`);
    if(back<rules.length)reasons.push(`a reloaded page never came back into the game (${back} of ${rules.length})`);
    if(/^RELOAD STUCK /m.test(log))reasons.push("a reloaded page was stuck for 120 s");
  }
  if(report.smoke&&report.smoke.browser!==LEGS[leg].env.CE2PG_BROWSER)reasons.push(`the journey ran ${report.smoke.browser}, not ${LEGS[leg].env.CE2PG_BROWSER}`);
  if(!report.smoke)reasons.push("the journey did not run its WebKit smoke steps");
  return {verdict:reasons.length?"FAIL":"PASS",reasons};
}

async function runLeg(leg){
  if(!LEGS[leg]){console.error(`webkit-smoke: leg must be one of ${Object.keys(LEGS).join(", ")} (got ${leg})`);process.exit(2);}
  fs.mkdirSync(OUT_DIR,{recursive:true});
  const reportPath=journeyReport(leg);fs.rmSync(reportPath,{force:true});
  const logPath=path.join(OUT_DIR,`webkit-smoke-${leg}.log`);const logStream=fs.createWriteStream(logPath);
  const started=Date.now();let log="";
  console.log(`WEBKIT-SMOKE ${leg}: ${LEGS[leg].label}`);
  const code=await new Promise(resolve=>{
    const child=spawn(process.execPath,[JOURNEY],{cwd:ROOT,env:{...process.env,...COMMON,...LEGS[leg].env},stdio:["ignore","pipe","pipe"]});
    const take=d=>{const t=String(d);log+=t;logStream.write(t);process.stdout.write(t);};
    child.stdout.on("data",take);child.stderr.on("data",take);
    child.on("error",error=>{take(`spawn failed: ${error.message}\n`);resolve(1);});
    child.on("exit",c=>resolve(c===null?1:c));
  });
  logStream.end();
  let report=null;try{report=JSON.parse(fs.readFileSync(reportPath,"utf8"));}catch(_e){report=null;}
  const {verdict,reasons}=judge(leg,{code,log,report});
  const checks=report&&Array.isArray(report.checks)?report.checks:[];
  const out={tool:"webkit-smoke",leg,label:LEGS[leg].label,verdict,reasons,exitCode:code,seconds:Math.round((Date.now()-started)/1000),
    sha:process.env.WEBKIT_SMOKE_SHA||process.env.GITHUB_SHA||null,journeyReport:path.relative(ROOT,reportPath),
    checks:{total:checks.length,passed:checks.filter(c=>c.pass).length},problems:(report&&report.problems||[]).length,smoke:report&&report.smoke||null};
  fs.writeFileSync(path.join(OUT_DIR,`webkit-smoke-${leg}.json`),JSON.stringify(out,null,2));
  console.log(`\nWEBKIT-SMOKE ${verdict} ${leg} (${out.seconds} s, ${out.checks.passed}/${out.checks.total} checks): ${LEGS[leg].label}`);
  for(const r of reasons)console.log(`  - ${r}`);
  process.exit(verdict==="PASS"?0:1);
}

// The workflow's setup broke before the leg could run (checkout, install, WebKit download, Rules build): INFRA, never a pass.
function infra(leg){
  if(!LEGS[leg]){console.error(`webkit-smoke: unknown leg ${leg}`);process.exit(2);}
  fs.mkdirSync(OUT_DIR,{recursive:true});
  const out={tool:"webkit-smoke",leg,label:LEGS[leg].label,verdict:"INFRA",reasons:["the workflow's setup failed before the leg ran (see the failed step above)"],exitCode:null,seconds:0,
    sha:process.env.WEBKIT_SMOKE_SHA||process.env.GITHUB_SHA||null,checks:{total:0,passed:0},problems:0,smoke:null};
  fs.writeFileSync(path.join(OUT_DIR,`webkit-smoke-${leg}.json`),JSON.stringify(out,null,2));
  console.log(`WEBKIT-SMOKE INFRA ${leg}: ${out.reasons[0]}`);
}
function summary(dir){
  const rows=Object.keys(LEGS).map(leg=>{
    let r=null;
    for(const file of findFiles(dir,`webkit-smoke-${leg}.json`)){try{r=JSON.parse(fs.readFileSync(file,"utf8"));break;}catch(_e){}}
    return r||{leg,verdict:"FAIL",reasons:["no report from this leg (the job did not finish or its artifact is missing)"],checks:{passed:0,total:0},seconds:0};
  });
  const lines=["## WebKit smoke","",`| leg | verdict | checks | time | WebKit |`,`|---|---|---|---|---|`];
  for(const r of rows)lines.push(`| ${r.leg} | ${r.verdict} | ${r.checks.passed}/${r.checks.total} | ${r.seconds} s | ${r.smoke&&r.smoke.versions&&r.smoke.versions.webkit||"-"} |`);
  for(const r of rows.filter(r=>r.verdict!=="PASS")){lines.push("",`**${r.leg}: ${r.verdict}**`);for(const why of r.reasons)lines.push(`- ${why}`);}
  const text=lines.join("\n");console.log(text);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text+"\n");
  const ok=rows.every(r=>r.verdict==="PASS");
  console.log(`\nWEBKIT-SMOKE ${ok?"PASS":"FAIL"}: ${rows.map(r=>`${r.leg} ${r.verdict}`).join(", ")}`);
  process.exit(ok?0:1);
}
function findFiles(dir,name){
  const found=[];if(!fs.existsSync(dir))return found;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())found.push(...findFiles(p,name));else if(entry.name===name)found.push(p);}
  return found;
}

module.exports={LEGS,requiredChecks,judge,journeyReport};
if(require.main===module){
  const [cmd,arg]=process.argv.slice(2);
  if(cmd==="leg")runLeg(arg);
  else if(cmd==="infra")infra(arg);
  else if(cmd==="summary")summary(path.resolve(arg||OUT_DIR));
  else{console.error("usage: node tests/browser/webkit-smoke.cjs leg <wooden|graphite|mixed> | summary [dir]");process.exit(2);}
}
