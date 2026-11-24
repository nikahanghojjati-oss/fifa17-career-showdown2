"use strict";
// POS1M vs today's Gate on the same planted bugs (brief bar: POS1M beats the Gate by at least 25 points).
//   node tests/pos1m/gate-compare.cjs --pos1m <planted report.json> [--workers 4] [--only id,id] [--out file.json]
// "Today's Gate" here is its contract lane: every registered product contract (CURRENT_PRODUCT_TEST_MANIFEST.json +
// POS20_SUPPLEMENTAL_PRODUCT_TESTS.json, exactly what `run-selected-product-contracts.cjs --all` runs) that can see the
// changed file: a contract that names the changed file, or any game file that requires it (transitively). A contract
// that names none of them loads none of them, so it cannot fail on the change. Each relevant contract first runs on the
// unchanged copy; one that already fails there is reported and not counted for either side.
// The emulator lane (L3A) needs the Firestore emulator; run it on the same mutants with --emulator when it is installed.
// Each mutant runs in its own copy of the working tree (node_modules linked), so the checkout is never changed.
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {spawn}=require("node:child_process");
const Mutant=require("./mutant.cjs");
const ROOT=path.resolve(__dirname,"../..");
const PIN=/operator: '(match|doesNotMatch)'|input did not match the regular expression|input was expected to not match/;

function args(argv){
  const out={pos1m:null,workers:Math.max(1,Math.min(os.availableParallelism?os.availableParallelism():os.cpus().length,8)),only:null,out:null,timeoutMs:180_000};
  for(let i=0;i<argv.length;i+=1){const k=argv[i].replace(/^--/,"");out[k]=k==="workers"||k==="timeoutMs"?Number(argv[i+1]):k==="only"?argv[i+1].split(","):argv[i+1];i+=1;}
  return out;
}
function registered(){
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,"CURRENT_PRODUCT_TEST_MANIFEST.json"),"utf8"));
  const supplemental=JSON.parse(fs.readFileSync(path.join(ROOT,"POS20_SUPPLEMENTAL_PRODUCT_TESTS.json"),"utf8"));
  return [...new Set([...manifest.tests,...supplemental.tests.map(entry=>entry.path)])];
}
// Game files that require each game file (require("./x.js") between js/*.js), closed transitively.
function dependents(){
  const users=new Map();
  for(const name of fs.readdirSync(path.join(ROOT,"js")).filter(n=>n.endsWith(".js"))){
    const text=fs.readFileSync(path.join(ROOT,"js",name),"utf8");
    for(const m of text.matchAll(/require\(\s*["']\.\/([\w.-]+\.js)["']\s*\)/g)){if(!users.has(m[1]))users.set(m[1],new Set());users.get(m[1]).add(name);}
  }
  return file=>{const seen=new Set([file]),todo=[file];while(todo.length){const f=todo.pop();for(const u of users.get(f)||[])if(!seen.has(u)){seen.add(u);todo.push(u);}}return seen;};
}
function relevantTests(tests,bug,closureOf){
  const names=new Set();
  for(const file of Mutant.mutatedFiles(bug).keys())for(const n of closureOf(path.basename(file)))names.add(n);
  return tests.filter(test=>{const text=fs.readFileSync(path.join(ROOT,test),"utf8");return [...names].some(n=>text.includes(n));});
}
function copyTree(dir){
  fs.mkdirSync(dir,{recursive:true});
  for(const entry of fs.readdirSync(ROOT)){
    if(entry===".git")continue;
    if(entry==="node_modules"){fs.symlinkSync(path.join(ROOT,"node_modules"),path.join(dir,"node_modules"));continue;}
    fs.cpSync(path.join(ROOT,entry),path.join(dir,entry),{recursive:true});
  }
}
function runTest(cwd,test,timeoutMs){
  return new Promise(resolve=>{
    const child=spawn(process.execPath,[path.join(cwd,test)],{cwd,stdio:["ignore","pipe","pipe"]});
    let out="";child.stdout.on("data",d=>{out+=d;if(out.length>20000)out=out.slice(-20000);});child.stderr.on("data",d=>{out+=d;if(out.length>20000)out=out.slice(-20000);});
    const timer=setTimeout(()=>child.kill("SIGKILL"),timeoutMs);
    child.on("close",code=>{clearTimeout(timer);resolve({test,pass:code===0,code,tail:out.slice(-400)});});
  });
}
async function pool(items,workers,fn){const out=[];let next=0;await Promise.all(Array.from({length:workers},async()=>{while(next<items.length){const i=next++;out[i]=await fn(items[i]);}}));return out;}

(async()=>{
  const opt=args(process.argv.slice(2));
  const tests=registered(),closureOf=dependents();
  let bugs=Mutant.list();if(opt.only)bugs=bugs.filter(b=>opt.only.includes(b.id));
  const pos1m=opt.pos1m?JSON.parse(fs.readFileSync(opt.pos1m,"utf8")):null;
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),"pos1m-gate-"));
  const started=Date.now();
  // The unchanged copy: which relevant contracts pass before any change.
  const plan=bugs.map(bug=>({bug,tests:relevantTests(tests,bug,closureOf)}));
  const needed=[...new Set(plan.flatMap(p=>p.tests))];
  const clean=path.join(scratch,"clean");copyTree(clean);
  const baseline=new Map((await pool(needed,opt.workers,test=>runTest(clean,test,opt.timeoutMs))).map(r=>[r.test,r]));
  const results=[];
  for(const {bug,tests:relevant} of plan){
    const dir=path.join(scratch,bug.id);copyTree(dir);
    for(const [file,{mutated}] of Mutant.mutatedFiles(bug))fs.writeFileSync(path.join(dir,file),mutated);
    const counted=relevant.filter(t=>baseline.get(t).pass);
    const runs=await pool(counted,opt.workers,test=>runTest(dir,test,opt.timeoutMs));
    const failing=runs.filter(r=>!r.pass).map(r=>r.test);
    // A contract that failed only on a source-text pin (assert.match on the file's text) goes red on any edit of that
    // line, a refactor too; one that failed on behaviour ran the code. Both turn the Gate red; the report keeps them apart.
    const byBehaviour=runs.filter(r=>!r.pass&&!PIN.test(r.tail)).map(r=>r.test);
    const p=pos1m&&pos1m.results.find(r=>r.id===bug.id);
    results.push({id:bug.id,law:bug.law,ledger:bug.ledger||null,contractsRun:counted.length,contractsFailing:failing,gateCaught:failing.length>0,gateCaughtByBehaviour:byBehaviour.length>0,failTails:runs.filter(r=>!r.pass).map(r=>({test:r.test,pin:PIN.test(r.tail),tail:r.tail.slice(-300)})),pos1mCaught:p?p.caught:null});
    console.log(`${bug.id}: Gate contracts ${failing.length?`CAUGHT by ${failing.map(f=>path.basename(f)).join(", ")}`:`missed (${counted.length} relevant ran green)`}; POS1M ${p?p.caught?"CAUGHT":"MISSED":"?"}`);
    fs.rmSync(dir,{recursive:true,force:true});
  }
  fs.rmSync(scratch,{recursive:true,force:true});
  const n=results.length,gate=results.filter(r=>r.gateCaught).length,ours=results.filter(r=>r.pos1mCaught).length,behaviour=results.filter(r=>r.gateCaughtByBehaviour).length;
  const brokenBefore=[...baseline.values()].filter(r=>!r.pass).map(r=>({test:r.test,tail:r.tail}));
  const report={engine:"POS1M",kind:"gate-compare",lane:"contracts",bugs:n,gateCaught:gate,pos1mCaught:ours,gatePercent:Math.round(100*gate/Math.max(1,n)),gateCaughtByBehaviour:behaviour,gateBehaviourPercent:Math.round(100*behaviour/Math.max(1,n)),pos1mPercent:Math.round(100*ours/Math.max(1,n)),contractsFailingBeforeChange:brokenBefore,results,wallMs:Date.now()-started};
  if(opt.out)fs.writeFileSync(opt.out,JSON.stringify(report,null,1));
  console.log(`Gate contract lane caught ${gate} of ${n} (${report.gatePercent}%; ${behaviour} by running the code, the rest only by a source-text pin); POS1M Ring 1 caught ${ours} of ${n} (${report.pos1mPercent}%): ${report.pos1mPercent-report.gatePercent} points (${report.pos1mPercent-report.gateBehaviourPercent} against behaviour catches).`);
  if(brokenBefore.length)console.log(`Not counted (already failing on the unchanged copy): ${brokenBefore.map(b=>b.test).join(", ")}`);
})().catch(error=>{console.error(error);process.exitCode=1;});
