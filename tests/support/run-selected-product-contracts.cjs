const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname,'../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'CURRENT_PRODUCT_TEST_MANIFEST.json'),'utf8'));
const args = process.argv.slice(2);
let selected = [];
let all = false;
for(let i=0;i<args.length;i++){
  if(args[i] === '--tests' && args[i+1]) selected.push(...args[++i].split(','));
  else if(args[i] === '--tests-file' && args[i+1]) selected.push(...fs.readFileSync(path.resolve(args[++i]),'utf8').split(/\r?\n/));
  else if(args[i] === '--all') all = true;
  else throw new Error(`Unknown argument: ${args[i]}`);
}
if(all) selected = [...manifest.tests];
selected = [...new Set(selected.map(v=>String(v||'').trim()).filter(Boolean))];
if(!selected.length){
  console.log('PASS POS10 selected deterministic census: no product contracts selected.');
  process.exit(0);
}
const unknown = selected.filter(file=>!manifest.tests.includes(file));
if(unknown.length) throw new Error(`Selected contract(s) are outside CURRENT_PRODUCT_TEST_MANIFEST.json: ${unknown.join(', ')}`);
const failures = [];
for(const file of selected){
  const absolute = path.join(root,file);
  if(!fs.existsSync(absolute)){
    failures.push({file,error:'missing file'});
    continue;
  }
  const result = spawnSync(process.execPath,[absolute],{cwd:root,encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
  if(result.stdout) process.stdout.write(result.stdout);
  if(result.stderr) process.stderr.write(result.stderr);
  if(result.status !== 0 || result.error) failures.push({file,error:result.error?.message || `exit ${result.status}`});
}
if(failures.length){
  console.error(`POS10 selected deterministic census failed in ${failures.length}/${selected.length} contract(s):`);
  for(const failure of failures) console.error(`- ${failure.file}: ${failure.error}`);
  process.exitCode = 1;
}else{
  console.log(`PASS POS10 selected deterministic census (${selected.length}/${manifest.tests.length} current blocking contracts).`);
}
