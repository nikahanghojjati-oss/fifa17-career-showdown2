import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const relayModel = "TDS-3";
export const debugBudgetModel = "ADB-4";
export const failureClasses = Object.freeze(["PRODUCT_DEFECT","TEST_DEFECT","PROCESS_DRIFT","DORMANT_PROVENANCE","INFRA_FLAKE","HEAD_MOVED","UNKNOWN"]);

export function emptySignals(){
  return {
    failureClass:"UNKNOWN",
    failureReproduced:false,
    unresolvedFailureFamilies:0,
    unresolvedStates:0,
    failedCorrectionCycles:0,
    contextDamageEvents:0,
    hardStateReconstruction:false,
    activeMutationLanes:1,
    ownerReportedUsageWarning:false,
    ownerRequestsRelay:false,
    nextAtomicUnitRisksLoss:false,
    atomicOperation:false,
    recoveryBeaconFresh:true,
    uncheckpointedAtomicUnits:0,
    liveAuthorityUnavailable:false
  };
}

function validate(s){
  const base=emptySignals();
  if(!s||typeof s!=="object")throw new Error("POS5 signals required.");
  for(const [k,v] of Object.entries(base)){
    if(!(k in s))throw new Error(`Missing POS5 signal: ${k}`);
    if(k==="failureClass"){
      if(!failureClasses.includes(s[k]))throw new Error(`Unknown failureClass: ${s[k]}`);
    }else if(typeof v==="boolean"){
      if(typeof s[k]!=="boolean")throw new Error(`${k} must be boolean.`);
    }else if(!Number.isInteger(s[k])||s[k]<0)throw new Error(`${k} must be a non-negative integer.`);
  }
}

export function computeDebugBudget(s){
  validate(s);
  let budget=10;
  if(s.failureClass==="TEST_DEFECT"||s.failureClass==="PROCESS_DRIFT")budget+=5;
  if(s.failureClass==="DORMANT_PROVENANCE")budget+=3;
  if(s.failureClass==="PRODUCT_DEFECT")budget-=1;
  if(s.failureClass==="HEAD_MOVED")budget-=2;
  if(s.failureClass==="UNKNOWN")budget-=2;
  if(s.unresolvedFailureFamilies<=1)budget+=2;
  if(s.unresolvedStates<=1)budget+=1;
  if(s.contextDamageEvents===0)budget+=2;
  if(s.contextDamageEvents>=2)budget-=4;
  if(s.hardStateReconstruction)budget-=3;
  if(s.activeMutationLanes>=2)budget-=2;
  if(s.unresolvedFailureFamilies>=3)budget-=3;
  if(s.unresolvedStates>=3)budget-=2;
  if(s.uncheckpointedAtomicUnits>1)budget-=4;
  return Math.max(3,Math.min(20,budget));
}

export function assessRelay(s){
  validate(s);
  const budget=computeDebugBudget(s);
  const active=s.unresolvedFailureFamilies>0||s.unresolvedStates>0;
  const unreproducedFlake=s.failureClass==="INFRA_FLAKE"&&!s.failureReproduced;
  const consumed=unreproducedFlake?0:s.failedCorrectionCycles;
  const reasons=[];
  if(s.ownerReportedUsageWarning)reasons.push("Owner reported a platform usage/capacity warning.");
  if(s.ownerRequestsRelay)reasons.push("Owner explicitly requested a developer relay.");
  if(s.liveAuthorityUnavailable)reasons.push("Current environment cannot safely resolve required live authority.");
  if(s.uncheckpointedAtomicUnits>1)reasons.push("CLB-1 exceeded: more than one atomic unit is ahead of durable recovery state.");
  if(s.nextAtomicUnitRisksLoss)reasons.push("Another atomic unit would risk unrecoverable volatile state.");
  if(active&&!unreproducedFlake&&consumed>=budget)reasons.push(`ADB-4 budget ${budget} exhausted with unresolved meaningful failure.`);
  if(active&&s.hardStateReconstruction&&s.contextDamageEvents>=2&&consumed>=Math.max(2,Math.ceil(budget/2)))reasons.push("Reconstructed context plus repeated unresolved correction reached the safety boundary.");
  const mustRelay=reasons.length>0;
  const status=mustRelay?(s.atomicOperation?"RELAY_AFTER_ATOMIC":"RELAY_NOW"):"CONTINUE";
  return {
    model:relayModel,status,reason:reasons.join(" ")||"No relay condition is present.",
    adaptiveDebugBudget:budget,consumedCorrectionCycles:consumed,
    remainingDebugAllowance:Math.max(0,budget-consumed),
    crashLossBudget:"1_AWU",
    recoveryBeaconDue:!s.recoveryBeaconFresh||s.uncheckpointedAtomicUnits>0||mustRelay,
    generateDeveloperRelayFile:status==="RELAY_NOW",
    percentage:null
  };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2); let signals=emptySignals();
    for(let i=0;i<args.length;i++){
      if(args[i]==="--signals-json"&&args[i+1])signals={...signals,...JSON.parse(args[++i])};
      else if(args[i]==="--signals-file"&&args[i+1])signals={...signals,...JSON.parse(fs.readFileSync(path.resolve(args[++i]),"utf8"))};
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const r=assessRelay(signals);
    process.stdout.write(`Relay state: ${r.status}\nRecovery beacon due: ${r.recoveryBeaconDue}\nADB-4 budget: ${r.adaptiveDebugBudget}\nConsumed correction cycles: ${r.consumedCorrectionCycles}\nRemaining allowance: ${r.remainingDebugAllowance}\nCrash loss budget: ${r.crashLossBudget}\nReason: ${r.reason}\n`);
  }catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
