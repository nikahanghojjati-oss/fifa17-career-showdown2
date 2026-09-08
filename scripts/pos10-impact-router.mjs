import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const model = 'POS10';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const graphPath = path.join(root, 'POS10_IMPACT_GRAPH.json');
const manifestPath = path.join(root, 'CURRENT_PRODUCT_TEST_MANIFEST.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const norm = value => String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
const match = (value, patterns) => (patterns || []).some(pattern => new RegExp(pattern).test(value));
const uniq = values => [...new Set(values)];
const proofIds = () => Object.values(graph.proofBundles).flat();
const testsForInvariant = id => (graph.invariants[id].testIndexes || []).map(index => manifest.tests[index]);
const bundleCost = bundle => Number(graph.proofBundleCosts[bundle] || 0);
const fullProofCost = (graph.fullSealProofBundles || []).reduce((sum,bundle)=>sum+bundleCost(bundle),0);
const savingsPercent = selected => fullProofCost ? Math.round((1-selected/fullProofCost)*10000)/100 : 0;

function expandInvariantClosure(seedIds){
  const selected = new Set(seedIds);
  const queue = [...selected];
  while(queue.length){
    const id = queue.shift();
    const inv = graph.invariants[id];
    if(!inv) throw new Error(`Unknown POS10 invariant: ${id}`);
    for(const consumer of inv.consumers || []){
      if(!selected.has(consumer)){
        selected.add(consumer);
        queue.push(consumer);
      }
    }
  }
  return [...selected];
}

function expandBundles(bundleIds){
  const proofs = [];
  for(const bundle of bundleIds){
    const ids = graph.proofBundles[bundle];
    if(!ids) throw new Error(`Unknown POS10 proof bundle: ${bundle}`);
    proofs.push(...ids);
  }
  return uniq(proofs);
}

function fullSeal(files, reason){
  const invariantIds = Object.keys(graph.invariants);
  const tests = uniq(invariantIds.flatMap(testsForInvariant));
  const proofBundles = graph.fullSealProofBundles || [];
  const proofs = expandBundles(proofBundles);
  const proofGroups = uniq(proofBundles.map(bundle => graph.proofBundleGroups[bundle]).filter(Boolean)).sort();
  return {
    model,
    profile: 'FULL_SEAL',
    files,
    reason,
    invariants: invariantIds,
    tests,
    testCount: tests.length,
    proofBundles,
    proofs,
    proofCount: proofs.length,
    selectedProofCost: fullProofCost,
    fullProofCost,
    proofCostSavedPercent: 0,
    proofGroups,
    operations: Boolean(graph.fullSealIncludesOperations),
    fullSeal: true
  };
}

export function routeFiles(input, options = {}){
  validateAuthority();
  const files = uniq((input || []).map(norm).filter(Boolean)).sort();
  if(options.forceFull) return fullSeal(files, 'Full seal explicitly required.');
  if(!files.length) return fullSeal(files, 'No changed-file evidence; fail closed.');

  const authorityChange = files.some(file => match(file, graph.fullSealPatterns));
  if(authorityChange) return fullSeal(files, 'Workflow, dependency, product guard, manifest, router, proof authority, or release authority changed.');

  const operationFiles = files.filter(file => match(file, graph.operationsPatterns));
  const nonDocs = files.filter(file => !match(file, graph.docsPatterns) && !operationFiles.includes(file));
  const operationsOnly = operationFiles.length > 0 && nonDocs.length === 0;
  if(operationsOnly){
    return {model,profile:'OPS_ONLY',files,reason:'Operating-system-only change.',invariants:[],tests:[],testCount:0,proofBundles:[],proofs:[],proofCount:0,selectedProofCost:0,fullProofCost,proofCostSavedPercent:100,proofGroups:[],operations:true,fullSeal:false};
  }
  if(nonDocs.length === 0){
    return {model,profile:'DOC_ONLY',files,reason:'Documentation-only change.',invariants:[],tests:[],testCount:0,proofBundles:[],proofs:[],proofCount:0,selectedProofCost:0,fullProofCost,proofCostSavedPercent:100,proofGroups:[],operations:false,fullSeal:false};
  }

  const directInvariants = new Set();
  const directBundles = new Set();
  const unmatched = [];
  for(const file of nonDocs){
    const rules = graph.artifactRules.filter(rule => match(file, rule.patterns));
    if(!rules.length){
      unmatched.push(file);
      continue;
    }
    for(const rule of rules){
      for(const invariant of rule.invariants || []) directInvariants.add(invariant);
      for(const bundle of rule.proofBundles || []) directBundles.add(bundle);
    }
  }
  if(unmatched.length) return fullSeal(files, `Unclassified non-document artifacts fail closed: ${unmatched.join(', ')}`);

  const invariantIds = expandInvariantClosure([...directInvariants]);
  const bundleIds = new Set(directBundles);
  for(const id of invariantIds){
    for(const bundle of graph.invariants[id].proofBundles || []) bundleIds.add(bundle);
  }
  const tests = uniq(invariantIds.flatMap(testsForInvariant));
  const proofBundles = [...bundleIds];
  const proofs = expandBundles(proofBundles);
  const proofGroups = uniq(proofBundles.map(bundle => graph.proofBundleGroups[bundle]).filter(Boolean)).sort();
  const operations = files.some(file => match(file, graph.operationsPatterns));
  const profile = invariantIds.length === 1 ? `IMPACT_${invariantIds[0]}` : 'IMPACT_COMPOSITE';
  const selectedProofCost=proofBundles.reduce((sum,bundle)=>sum+bundleCost(bundle),0);
  return {model,profile,files,reason:'Exact artifact impact plus transitive consumers selected.',invariants:invariantIds,tests,testCount:tests.length,proofBundles,proofs,proofCount:proofs.length,selectedProofCost,fullProofCost,proofCostSavedPercent:savingsPercent(selectedProofCost),proofGroups,operations,fullSeal:false};
}

export function validateAuthority(){
  if(graph.model !== model) throw new Error(`Graph model must be ${model}.`);
  if(manifest.operatingSystem !== 'POS10') throw new Error('CURRENT_PRODUCT_TEST_MANIFEST.json must declare POS10.');
  const ownedIndexes = Object.values(graph.invariants).flatMap(inv => inv.testIndexes || []);
  if(ownedIndexes.length !== manifest.tests.length) throw new Error(`POS10 test ownership count ${ownedIndexes.length} does not equal manifest count ${manifest.tests.length}.`);
  if(new Set(ownedIndexes).size !== ownedIndexes.length) throw new Error('POS10 deterministic test ownership contains duplicate manifest indexes.');
  const expectedIndexes = manifest.tests.map((_,index)=>index);
  const missing = expectedIndexes.filter(index => !ownedIndexes.includes(index));
  const extra = ownedIndexes.filter(index => index < 0 || index >= manifest.tests.length);
  if(missing.length || extra.length) throw new Error(`POS10 ownership mismatch. missingIndexes=${missing.join(',')} extraIndexes=${extra.join(',')}`);
  const exactProofIds = proofIds();
  if(new Set(exactProofIds).size !== exactProofIds.length) throw new Error('POS10 proof IDs must belong to exactly one bundle.');
  for(const bundle of Object.keys(graph.proofBundles)){
    if(!graph.proofBundleGroups[bundle]) throw new Error(`Proof group missing for bundle: ${bundle}`);
    if(!Number.isFinite(Number(graph.proofBundleCosts[bundle]))) throw new Error(`Proof cost missing for bundle: ${bundle}`);
  }
  for(const [id, invariant] of Object.entries(graph.invariants)){
    for(const consumer of invariant.consumers || []) if(!graph.invariants[consumer]) throw new Error(`Unknown consumer ${consumer} of ${id}.`);
    for(const bundle of invariant.proofBundles || []) if(!graph.proofBundles[bundle]) throw new Error(`Unknown proof bundle ${bundle} of ${id}.`);
  }
  if(new Set(graph.fullSealProofBundles).size !== Object.keys(graph.proofBundles).length || Object.keys(graph.proofBundles).some(id=>!graph.fullSealProofBundles.includes(id))) throw new Error('Complete seal must include every registered proof bundle.');
}

function githubOutput(result, outputPath){
  const lines = [
    `profile=${result.profile}`,
    `tests_csv=${result.tests.join(',')}`,
    `proofs_csv=${result.proofs.join(',')}`,
    `proof_groups_json=${JSON.stringify(result.proofGroups)}`,
    `run_operations=${result.operations}`,
    `full_seal=${result.fullSeal}`,
    `test_count=${result.testCount}`,
    `proof_count=${result.proofCount}`,
    `selected_proof_cost=${result.selectedProofCost}`,
    `full_proof_cost=${result.fullProofCost}`,
    `proof_cost_saved_percent=${result.proofCostSavedPercent}`
  ];
  fs.appendFileSync(path.resolve(outputPath), `${lines.join('\n')}\n`);
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  try{
    validateAuthority();
    const args = process.argv.slice(2);
    let files = [];
    let json = false;
    let githubOutputPath = null;
    let forceFull = false;
    for(let i=0;i<args.length;i++){
      if(args[i] === '--files' && args[i+1]) files.push(...args[++i].split(','));
      else if(args[i] === '--files-file' && args[i+1]) files.push(...fs.readFileSync(path.resolve(args[++i]),'utf8').split(/\r?\n/));
      else if(args[i] === '--github-output' && args[i+1]) githubOutputPath = args[++i];
      else if(args[i] === '--force-full') forceFull = true;
      else if(args[i] === '--json') json = true;
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const result = routeFiles(files,{forceFull});
    if(githubOutputPath) githubOutput(result,githubOutputPath);
    if(json || !githubOutputPath) process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
  }catch(error){
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
