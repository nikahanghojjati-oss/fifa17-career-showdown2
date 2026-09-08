import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {routeFiles as pos10Route} from './pos10-impact-router.mjs';
export const model='POS20';
function uniq(a){return [...new Set(a||[])];}
function superset(base,next,label){for(const item of base||[])if(!(next||[]).includes(item))throw new Error(`POS20 may not reduce POS10 ${label}: ${item}`);}
export function routeFiles(files,context={}){
  const escalation=Boolean(context.forceFull||context.uncertainty==='HIGH'||Number(context.evidenceDebt||0)>=3||context.repeatedFailure===true||context.authorityChange===true);
  const base=pos10Route(files,{forceFull:false});
  const selected=escalation?pos10Route(files,{forceFull:true}):base;
  superset(base.tests,selected.tests,'tests');superset(base.proofs,selected.proofs,'proofs');
  return {...selected,model,profile:escalation?'COGNITIVE_FULL_SEAL':`POS20_${selected.profile}`,reason:escalation?'POS20 cognitive escalation requires complete inherited seal.':`POS20 preserves POS10 minimum proof and accepts its exact impact route. ${selected.reason}`,cognitiveEscalation:escalation,inheritedKernel:'POS10',tests:uniq(selected.tests),proofs:uniq(selected.proofs)};
}
function output(result,file){const lines=[`profile=${result.profile}`,`tests_csv=${result.tests.join(',')}`,`proofs_csv=${result.proofs.join(',')}`,`proof_groups_json=${JSON.stringify(result.proofGroups||[])}`,`run_operations=${Boolean(result.operations)}`,`full_seal=${Boolean(result.fullSeal)}`,`test_count=${result.testCount||0}`,`proof_count=${result.proofCount||0}`,`selected_proof_cost=${result.selectedProofCost||0}`,`full_proof_cost=${result.fullProofCost||0}`,`proof_cost_saved_percent=${result.proofCostSavedPercent||0}`];fs.appendFileSync(path.resolve(file),`${lines.join('\n')}\n`);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const args=process.argv.slice(2);let files=[];let out=null;let json=false;const context={};for(let i=0;i<args.length;i++){if(args[i]==='--files-file')files.push(...fs.readFileSync(path.resolve(args[++i]),'utf8').split(/\r?\n/).filter(Boolean));else if(args[i]==='--files')files.push(...args[++i].split(',').filter(Boolean));else if(args[i]==='--github-output')out=args[++i];else if(args[i]==='--force-full')context.forceFull=true;else if(args[i]==='--uncertainty')context.uncertainty=args[++i];else if(args[i]==='--evidence-debt')context.evidenceDebt=Number(args[++i]);else if(args[i]==='--repeated-failure')context.repeatedFailure=true;else if(args[i]==='--json')json=true;else throw new Error(`Unknown argument: ${args[i]}`);}const result=routeFiles(files,context);if(out)output(result,out);if(json||!out)console.log(JSON.stringify(result,null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
