const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawnSync}=require('node:child_process');
const manifest=JSON.parse(fs.readFileSync('CURRENT_PRODUCT_TEST_MANIFEST.json','utf8'));
const graph=JSON.parse(fs.readFileSync('POS7_IMPACT_GRAPH.json','utf8'));
const forbidden=['NEXT_TASK.md','AGENTS.md','PROJECT_OPERATING_SYSTEM_V7.md','PROJECT_OPERATING_SYSTEM_V7.json','POS7_CONTINUITY_MODEL.json','POS7_IMPACT_GRAPH.json','PROJECT_OPERATING_SYSTEM_V8.md','PROJECT_OPERATING_SYSTEM_V8.json','POS8_RECOVERY_MODEL.json','scripts/pos8-crash-shield.mjs','WORK_ENVIRONMENT_STATUS.json','WORK_ENVIRONMENT_ARCHIVE','START_NEXT_SESSION','SUCCESSOR_HANDOFF'];
function executableSource(source){return String(source).split(/\r?\n/).filter(line=>!/^[ \t]*(?:\/\/|\/\*|\*|\*\/)/.test(line)).join('\n');}
function dependencyPattern(name){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:readFileSync|readJson|read|require)[ \\t]*\\([\\s\\S]{0,180}?["'](?:[^"']*/)?${escaped}["']`,'m');}
const offenders=[];
for(const file of manifest.tests){
  const src=executableSource(fs.readFileSync(file,'utf8'));
  for(const name of forbidden) if(dependencyPattern(name).test(src)) offenders.push(`${file} -> ${name}`);
}
assert.deepEqual(offenders,[],`POS8 product gates must not import process/continuity authority:\n${offenders.join('\n')}`);
assert.equal(manifest.operatingSystem,'POS-7','The retained deterministic registry belongs to the IMPACT-7 selection engine; POS8 process authority is separate.');
assert.equal(manifest.automaticOwner,'tests/support/run-selected-product-contracts.cjs');
const ownedIndexes=Object.values(graph.invariants).flatMap(inv=>inv.testIndexes||[]);
assert.equal(ownedIndexes.length,manifest.tests.length);
assert.equal(new Set(ownedIndexes).size,ownedIndexes.length);
assert.deepEqual(new Set(ownedIndexes),new Set(manifest.tests.map((_,index)=>index)));
for(const [id,meta] of Object.entries(graph.proofSources||{})){
  assert.ok(fs.existsSync(meta.source),`Proof source missing for ${id}`);
  const result=spawnSync('git',['hash-object',meta.source],{encoding:'utf8'});
  assert.equal(result.status,0,`Unable to hash proof source ${meta.source}`);
  assert.equal(result.stdout.trim(),meta.gitBlobSha,`Byte-preserved proof source drifted for ${id}`);
}
console.log(`PASS POS8 gate purity (${manifest.tests.length} single-owner deterministic product gates; process authority remains outside product tests).`);
