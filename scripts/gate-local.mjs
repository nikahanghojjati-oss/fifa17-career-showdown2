// npm run gate:local — the pre-push check (about 90 s): every registered contract, the operations audit,
// POS10 syntax, the Showdown Gate route preview for this branch versus origin/main, and the zero-billing
// assert (which needs no Java). Exits non-zero if any part fails.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const results=[];
function run(label,command,args){
  const started=Date.now();
  process.stdout.write(`\n== gate:local ${label}: ${[command,...args].join(' ')}\n`);
  const result=spawnSync(command,args,{cwd:root,stdio:'inherit'});
  results.push({label,ok:result.status===0,seconds:Math.round((Date.now()-started)/1000)});
}
function git(args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});return r.status===0?r.stdout.trim():null;}

run('contracts','npm',['run','-s','test:contracts']);
run('operations','npm',['run','-s','test:ops']);
run('syntax',process.execPath,['scripts/pos10-syntax.mjs']);

const base=git(['merge-base','origin/main','HEAD']);
if(!base){results.push({label:'route preview',ok:false,seconds:0});console.error('origin/main is not available; run git fetch origin main');}
else{
  const files=[...new Set([...(git(['diff','--name-only',base])||'').split('\n'),...(git(['ls-files','--others','--exclude-standard'])||'').split('\n')].filter(Boolean))].sort();
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gate-local-'));
  const filesFile=path.join(dir,'changed-files.txt');
  fs.writeFileSync(filesFile,files.length?`${files.join('\n')}\n`:'');
  const started=Date.now();
  const r=spawnSync(process.execPath,['scripts/pos20-impact-router.mjs','--files-file',filesFile,'--json'],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
  fs.rmSync(dir,{recursive:true,force:true});
  if(r.status!==0){console.error(r.stderr);results.push({label:'route preview',ok:false,seconds:0});}
  else{
    const route=JSON.parse(r.stdout);
    console.log(`\n== gate:local route preview vs origin/main (${base.slice(0,10)}): ${files.length} changed file(s)`);
    console.log(`profile ${route.profile}; ${route.testCount} routed contracts (Showdown Gate L1 runs all registered); ${route.proofCount} proofs in groups ${JSON.stringify(route.proofGroups||[])}; operations ${Boolean(route.operations)}`);
    results.push({label:'route preview',ok:true,seconds:Math.round((Date.now()-started)/1000)});
  }
}
run('zero-billing assert',process.execPath,['scripts/assert-firestore-zero-billing-boundary.mjs']);

console.log('\n== gate:local summary');
for(const r of results)console.log(`${r.ok?'PASS':'FAIL'}  ${r.label} (${r.seconds}s)`);
console.log('Not run locally (Showdown Gate lanes own them): proof groups, emulator suites, Rules regression, browser journey.');
if(results.some(r=>!r.ok))process.exitCode=1;
