'use strict';
// POS20 supplemental product-test registry: one small JSON file per contract in tests/pos20-registry/ (speed-up 2, lead brief
// 2026-11-24, Nik "All six"). It replaces the single POS20_SUPPLEMENTAL_PRODUCT_TESTS.json list and the control plane's
// hand-kept expected list, which every new contract appended to, so parallel PRs conflicted after almost every merge.
// Each file is tests/pos20-registry/<contract name>.json = {"path":"tests/contracts/<contract name>.cjs","patterns":[...]}.
// Same strictness as the list, read the same way by every consumer (router, Gate, census runner, contracts):
//   - the file name must equal the contract's name, the contract must exist, every pattern must be a valid RegExp;
//   - no duplicate, no entry that is also in the frozen POS10 manifest;
//   - every tests/contracts/*.cjs must be in the POS10 manifest, in this registry, or in the frozen legacy list
//     (tests/pos20-registry/_unregistered-legacy.json, which may only shrink): a new unregistered contract fails.
const fs=require('node:fs');
const path=require('node:path');

const ROOT=path.resolve(__dirname,'../..');
const DIR='tests/pos20-registry';
const LEGACY='_unregistered-legacy.json';

function loadPos20Registry(root=ROOT){
  const dir=path.join(root,DIR);
  const names=fs.readdirSync(dir).filter(name=>name.endsWith('.json')&&name!==LEGACY).sort();
  const tests=[];
  for(const name of names){
    let entry;
    try{entry=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));}catch(error){throw new Error(`Invalid POS20 registry file ${DIR}/${name}: ${error.message}`);}
    const keys=entry&&typeof entry==='object'?Object.keys(entry).sort().join(','):'';
    if(keys!=='path,patterns')throw new Error(`Invalid POS20 registry file ${DIR}/${name}: exactly "path" and "patterns" (got ${keys||typeof entry}).`);
    if(typeof entry.path!=='string'||!/^tests\/contracts\/[A-Za-z0-9._-]+\.cjs$/.test(entry.path))throw new Error(`Invalid POS20 supplemental product-test path in ${DIR}/${name}.`);
    if(path.basename(entry.path,'.cjs')!==path.basename(name,'.json'))throw new Error(`POS20 registry file ${DIR}/${name} must be named after its contract (${path.basename(entry.path,'.cjs')}.json).`);
    if(!fs.existsSync(path.join(root,entry.path)))throw new Error(`POS20 registry file ${DIR}/${name} points at a missing contract: ${entry.path}`);
    if(!Array.isArray(entry.patterns)||!entry.patterns.length||entry.patterns.some(pattern=>typeof pattern!=='string'||!pattern))throw new Error(`Invalid POS20 supplemental pattern for ${entry.path}.`);
    for(const pattern of entry.patterns)new RegExp(pattern);
    tests.push({path:entry.path,patterns:[...entry.patterns]});
  }
  const paths=tests.map(entry=>entry.path);
  if(new Set(paths).size!==paths.length)throw new Error('Duplicate POS20 supplemental product-test path.');
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'CURRENT_PRODUCT_TEST_MANIFEST.json'),'utf8'));
  const overlap=paths.filter(file=>manifest.tests.includes(file));
  if(overlap.length)throw new Error(`POS20 supplemental tests duplicate the frozen POS10 manifest: ${overlap.join(', ')}`);
  return {schemaVersion:1,operatingSystem:'POS20',tests};
}

function loadUnregisteredLegacy(root=ROOT){
  const legacy=JSON.parse(fs.readFileSync(path.join(root,DIR,LEGACY),'utf8'));
  if(!Array.isArray(legacy.contracts)||legacy.contracts.some(file=>typeof file!=='string'))throw new Error(`Invalid ${DIR}/${LEGACY}.`);
  return legacy.contracts;
}

// Every contract file is accounted for: POS10 manifest, POS20 registry, or the frozen legacy list (which only shrinks).
function unaccountedContracts(root=ROOT){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'CURRENT_PRODUCT_TEST_MANIFEST.json'),'utf8')).tests;
  const registered=loadPos20Registry(root).tests.map(entry=>entry.path);
  const legacy=loadUnregisteredLegacy(root);
  const files=fs.readdirSync(path.join(root,'tests/contracts')).filter(name=>name.endsWith('.cjs')).map(name=>`tests/contracts/${name}`);
  return files.filter(file=>!manifest.includes(file)&&!registered.includes(file)&&!legacy.includes(file));
}

module.exports={loadPos20Registry,loadUnregisteredLegacy,unaccountedContracts,POS20_REGISTRY_DIR:DIR,POS20_LEGACY_FILE:LEGACY};
