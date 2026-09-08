import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {routeFiles,validateAuthority} from '../../scripts/pos10-impact-router.mjs';
import {checkPackage,filingVersion} from '../../scripts/pos10-recovery.mjs';

const read=file=>fs.readFileSync(file,'utf8');
const json=file=>JSON.parse(read(file));
const authority=json('PROJECT_OPERATING_SYSTEM_POS10.json');
const graph=json('POS10_IMPACT_GRAPH.json');
const manifest=json('CURRENT_PRODUCT_TEST_MANIFEST.json');
const baseline=json('POS10_PRODUCT_BASELINE.json');
const registry=json('POS10_RETIRED_CONCEPTS.json');
const startup=authority.activeStartupSurfaces;

test('POS10 is the sole identity across active startup, machine authority, commands and workflows',()=>{
  const workflowFiles=fs.readdirSync('.github/workflows').map(file=>`.github/workflows/${file}`);
  const scripts=fs.readdirSync('scripts').filter(file=>file.startsWith('pos10-')).map(file=>`scripts/${file}`);
  const files=[...startup,...Object.values(authority.machineAuthority).filter(file=>file!=='POS10_RETIRED_CONCEPTS.json'),...workflowFiles,...scripts,'PROJECT_OPERATING_SYSTEM_POS10.json','package.json','tests/support/run-operations-audit.cjs','tests/support/run-selected-product-contracts.cjs'];
  const packet=checkPackage();assert.equal(packet.recoveryState,'RECOVERY_READY',packet.reason);
  files.push(packet.index.currentSuccessor,packet.index.currentRecoveryManifest);
  for(const file of new Set(files)){
    const content=read(file);
    for(const pattern of registry.forbiddenPatterns)assert.ok(!new RegExp(pattern,'i').test(content),`${file} reactivates retired authority/reporting: ${pattern}`);
    const executableAuthority=file==='PROJECT_OPERATING_SYSTEM_POS10.json'?JSON.stringify({...authority,archivedProcessRoot:undefined}):content;
    assert.ok(!executableAuthority.includes(authority.archivedProcessRoot),`${file} must not depend on archived process files`);
  }
  assert.equal(authority.operatingSystem,'POS10');assert.equal(manifest.operatingSystem,'POS10');assert.equal(json('CURRENT_PRODUCT_GUARDS.json').operatingSystem,'POS10');
  assert.equal(workflowFiles.filter(file=>/^\s*pull_request\s*:/m.test(read(file))).length,1);
});
test('current filing, response and recovery policies are versioned and internally consistent',()=>{
  for(const file of ['PROJECT_OPERATING_SYSTEM_POS10.json','POS10_FILING_SCHEMA.json','POS10_RETIRED_CONCEPTS.json','POS10_CURRENT_FILE_INDEX.json','POS10_RESPONSE_CONTRACT.json','POS10_IMPACT_GRAPH.json','CURRENT_PRODUCT_GUARDS.json','CURRENT_PRODUCT_TEST_MANIFEST.json'])assert.equal(json(file).filingVersion,filingVersion,file);
  assert.deepEqual(json('POS10_FILING_SCHEMA.json').recoveryStates,json('POS10_RESPONSE_CONTRACT.json').allowedRecoveryStates);
  assert.deepEqual(authority.productCredit,{SSJR:0,MDP:0});
  assert.equal(authority.maxOpenAtomicUnits,1);assert.equal(authority.maxLocalUnpublishedPackets,1);assert.equal(authority.recoveryBranchesPerCandidate,1);
  assert.equal(authority.candidateMutationDuringPendingValidation,false);assert.equal(authority.mergeRequiresExpectedHead,true);
});
test('all valuable product invariants, contract owners and heavy proofs survive migration',()=>{
  validateAuthority();
  for(const file of baseline.deterministicProductContracts)assert.ok(manifest.tests.includes(file),`Product contract lost: ${file}`);
  const proofs=Object.values(graph.proofBundles).flat();
  for(const id of baseline.heavyProofIds)assert.ok(proofs.includes(id),`Heavy proof lost: ${id}`);
  const guards=json('CURRENT_PRODUCT_GUARDS.json');
  for(const key of ['provider','product','privacy','testing'])assert.deepEqual(guards[key],baseline.productGuards[key],`${key} locks changed`);
  for(const [id,meta] of Object.entries(graph.proofSources))assert.equal(execFileSync('git',['hash-object',meta.source],{encoding:'utf8'}).trim(),meta.gitBlobSha,`${id} product proof bytes changed`);
});
test('known changes select exact consumers; mixed process risk is retained; unknown executable risk closes to full seal',()=>{
  const docs=routeFiles(['README.md']);assert.equal(docs.profile,'DOC_ONLY');
  for(const files of [['NEXT_TASK.md'],['scripts/pos10-recovery.mjs'],['POS10_RESPONSE_CONTRACT.json']])assert.equal(routeFiles(files).profile,'OPS_ONLY');
  const css=routeFiles(['css/app.css']);assert.equal(css.fullSeal,false);assert.ok(css.tests.includes('tests/contracts/shared-showdown-dual-full-screen-contracts.cjs'));assert.ok(css.proofs.includes('HOME_BOOTSTRAP_INLINE'));assert.ok(!css.proofs.includes('STAGE3_PAIRING_EMULATOR'));
  const mixed=routeFiles(['css/app.css','scripts/pos10-recovery.mjs']);assert.equal(mixed.operations,true);assert.equal(mixed.fullSeal,false);
  const pairing=routeFiles(['js/stage4ConnectedRivalry.js']);for(const id of ['PAIRING_RIVALRY','REMOTE_JOINING','SHARED_SETUP'])assert.ok(pairing.invariants.includes(id));
  for(const file of ['unknown-executable.bin','package.json','service-worker.js','.github/workflows/validate-pos10.yml','CURRENT_PRODUCT_GUARDS.json','scripts/pos10-impact-router.mjs']){const result=routeFiles([file]);assert.equal(result.profile,'FULL_SEAL');assert.equal(result.testCount,manifest.tests.length);assert.equal(result.proofCount,Object.values(graph.proofBundles).flat().length);assert.equal(result.operations,true);}
  assert.equal(routeFiles([]).profile,'FULL_SEAL');assert.equal(routeFiles(['README.md'],{forceFull:true}).profile,'FULL_SEAL');
});
test('product tests import no process, filing, routing or recovery authority',()=>{
  const forbidden=Object.values(authority.machineAuthority).filter(file=>!['CURRENT_PRODUCT_GUARDS.json','CURRENT_PRODUCT_TEST_MANIFEST.json'].includes(file));
  forbidden.push(...startup,'PROJECT_OPERATING_SYSTEM_POS10.json','operatingSystem');
  for(const file of manifest.tests){
    const source=read(file).split(/\r?\n/).filter(line=>!/^\s*(?:\/\/|\/\*|\*)/.test(line)).join('\n');
    for(const needle of forbidden)assert.ok(!source.includes(needle),`${file} imports process authority: ${needle}`);
    assert.ok(!/PROJECT_OPERATING_SYSTEM|WORK_ENVIRONMENT|START_NEXT_SESSION|SUCCESSOR_HANDOFF/.test(source),`${file} imports historical process authority`);
  }
});
test('workflow validates one exact head and never treats a skipped required lane as successful',()=>{
  const workflow=read('.github/workflows/validate-pos10.yml');
  assert.equal((workflow.match(/ref: \$\{\{ github.event.pull_request.head.sha \|\| github.sha \}\}/g)||[]).length,4);
  assert.match(workflow,/--force-full/);
  assert.match(workflow,/\[\[ '\$\{\{ needs.route.result \}\}' == success \]\]/);
  assert.match(workflow,/Required POS10 lane did not pass/);
  assert.match(workflow,/check_lane operations/);assert.match(workflow,/check_lane deterministic/);assert.match(workflow,/check_lane proofs/);
  assert.ok(!/success\|skipped\)\s*;;/.test(workflow));
});
