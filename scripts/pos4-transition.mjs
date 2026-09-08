import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model = "TDS-2";
export const debugBudgetModel = "ADB-3";
export const failureClasses = Object.freeze(["PRODUCT_DEFECT","TEST_DEFECT","PROCESS_DRIFT","DORMANT_PROVENANCE","INFRA_FLAKE","UNKNOWN"]);

export function emptySignals(){
  return {
    failureClass:"UNKNOWN",
    failureReproduced:false,
    unresolvedFailureFamilies:0,
    unresolvedStates:0,
    failedCorrectionCycles:0,
    contextDamageEvents:0,
    hardStateReconstruction:false,
    taskLanes:1,
    usageWarning:false,
    ownerRequestsTransfer:false,
    nextSubstantialTaskRisksLoss:false,
    atomicOperation:false,
    recoveryBeaconFresh:true
  };
}

function validate(s){
  const base=emptySignals();
  if(!s||typeof s!=="object")throw new Error("TDS-2 signals required.");
  for(const [k,v] of Object.entries(base)){
    if(!(k in s))throw new Error(`Missing TDS-2 signal: ${k}`);
    if(k==="failureClass"){
      if(!failureClasses.includes(s[k]))throw new Error(`Unknown failureClass: ${s[k]}`);
    }else if(typeof v==="boolean"){
      if(typeof s[k]!=="boolean")throw new Error(`${k} must be boolean.`);
    }else if(!Number.isInteger(s[k])||s[k]<0)throw new Error(`${k} must be non-negative integer.`);
  }
}

export function computeDebugBudget(s){
  validate(s);
  let budget=9;
  if(s.failureClass==="TEST_DEFECT"||s.failureClass==="PROCESS_DRIFT")budget+=5;
  if(s.failureClass==="DORMANT_PROVENANCE")budget+=3;
  if(s.failureClass==="PRODUCT_DEFECT")budget-=1;
  if(s.failureClass==="UNKNOWN")budget-=2;
  if(s.unresolvedFailureFamilies<=1)budget+=3;
  if(s.unresolvedStates<=1)budget+=2;
  if(s.contextDamageEvents===0)budget+=2;
  else if(s.contextDamageEvents>=2)budget-=3;
  if(s.hardStateReconstruction)budget-=3;
  if(s.taskLanes>=3)budget-=2;
  if(s.unresolvedFailureFamilies>=3)budget-=3;
  if(s.unresolvedStates>=3)budget-=2;
  return Math.max(3,Math.min(20,budget));
}

export function assessTransition(s){
  validate(s);
  const budget=computeDebugBudget(s);
  const active=s.unresolvedFailureFamilies>0||s.unresolvedStates>0;
  const flakePending=s.failureClass==="INFRA_FLAKE"&&!s.failureReproduced;
  const consumed=flakePending?0:s.failedCorrectionCycles;
  const reasons=[];
  if(s.usageWarning)reasons.push("Owner reported a platform usage/capacity warning.");
  if(s.ownerRequestsTransfer)reasons.push("Owner explicitly requested transfer.");
  if(s.nextSubstantialTaskRisksLoss)reasons.push("Another substantial task risks unrecoverable context loss.");
  if(active&&!flakePending&&consumed>=budget)reasons.push(`ADB-3 budget ${budget} exhausted with unresolved failure.`);
  if(active&&s.hardStateReconstruction&&s.contextDamageEvents>=2&&consumed>=Math.max(2,Math.ceil(budget/2)))reasons.push("Reconstructed context plus repeated unresolved correction reached the degraded safety boundary.");
  const status=reasons.length?(s.atomicOperation?"TRANSFER_AFTER_ATOMIC":"TRANSFER_NOW"):"CONTINUE";
  return {
    model,status,reason:reasons.join(" ")||"No transfer condition is present.",
    adaptiveDebugBudget:budget,consumedCorrectionCycles:consumed,
    remainingDebugAllowance:Math.max(0,budget-consumed),
    recoveryBeaconDue:!s.recoveryBeaconFresh||reasons.length>0,
    generateResumeCapsule:status==="TRANSFER_NOW",
    percentage:null
  };
}

export function signalsFromLegacyWec(state){
  const o=state?.sessionHandoffProximity?.checkpoints?.at?.(-1)?.observations||{};
  const remaining=state?.signals?.usageRemainingPercent;
  return {
    ...emptySignals(),
    failureClass:"UNKNOWN",
    failureReproduced:Number(o.redCiFamilies||0)>0,
    unresolvedFailureFamilies:Number(o.redCiFamilies??state?.signals?.unresolvedFailures??0),
    unresolvedStates:Number(o.unresolvedStates??state?.signals?.unresolvedFailures??0),
    failedCorrectionCycles:Math.max(Number(o.ciDebugCycles||0),Number(o.unresolvedDebugLoops||0),Number(state?.signals?.correctedFailures||0)),
    contextDamageEvents:Number(o.truncations||0)+Number(o.recoveries||0)+Number(o.compactions||0),
    hardStateReconstruction:o.hardStateReconstruction===true,
    taskLanes:Math.max(1,Number(o.taskLanes||1)),
    usageWarning:state?.signals?.usageWarning===true||(Number.isFinite(remaining)&&remaining<=10),
    ownerRequestsTransfer:o.ownerRequestedWrap===true,
    nextSubstantialTaskRisksLoss:o.nextSubstantialTaskRisksLoss===true,
    atomicOperation:state?.signals?.atomicOperation===true,
    recoveryBeaconFresh:false
  };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2);let signals;
    for(let i=0;i<args.length;i++){
      if(args[i]==="--signals-json"&&args[i+1])signals=JSON.parse(args[++i]);
      else if(args[i]==="--state"&&args[i+1])signals=signalsFromLegacyWec(JSON.parse(fs.readFileSync(path.resolve(args[++i]),"utf8")));
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    if(!signals)signals=signalsFromLegacyWec(JSON.parse(fs.readFileSync("WORK_ENVIRONMENT_STATUS.json","utf8")));
    const r=assessTransition(signals);
    process.stdout.write(`Transfer decision: ${r.status}\nRecovery beacon due: ${r.recoveryBeaconDue}\nADB-3 budget: ${r.adaptiveDebugBudget}\nConsumed correction cycles: ${r.consumedCorrectionCycles}\nRemaining allowance: ${r.remainingDebugAllowance}\nReason: ${r.reason}\n`);
  }catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
