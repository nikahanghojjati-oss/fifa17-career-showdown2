import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceFiles=new Set();
function collect(directory){
  for(const entry of fs.readdirSync(path.join(root,directory),{withFileTypes:true})){
    const file=`${directory}/${entry.name}`;
    if(entry.isDirectory())collect(file);
    else if(/\.(?:js|cjs|mjs)$/.test(file))sourceFiles.add(file);
  }
}
for(const directory of ['js','data','scripts','tests/browser','tests/firebase','tests/operations'])collect(directory);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'CURRENT_PRODUCT_TEST_MANIFEST.json'),'utf8'));
manifest.tests.forEach(file=>sourceFiles.add(file));
// Include every exact extra contract command in current proof and workflow sources.
const sources=['scripts/pos10-proof-runner.mjs',...fs.readdirSync(path.join(root,'.github/workflows')).map(f=>`.github/workflows/${f}`),...fs.readdirSync(path.join(root,'tests/proof-sources/workflows')).map(f=>`tests/proof-sources/workflows/${f}`)];
for(const file of sources){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of text.matchAll(/tests\/contracts\/[A-Za-z0-9_.-]+\.cjs/g))sourceFiles.add(match[0]);
}
for(const file of ['chromium-runtime.cjs','run-operations-audit.cjs','run-restore-contracts.cjs','run-selected-product-contracts.cjs','run-workflow-blocks.cjs','static-server.cjs'])sourceFiles.add(`tests/support/${file}`);
let failures=0;
for(const file of [...sourceFiles].sort()){
  const result=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
  if(result.status!==0){process.stderr.write(result.stderr||`Syntax check failed: ${file}\n`);failures++;}
}
console.log(`POS10 syntax: ${sourceFiles.size} active source files, ${failures} failures`);
if(failures)process.exitCode=1;
