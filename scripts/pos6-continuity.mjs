import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const model = "CWS-6";
export const debugBudgetModel = "ADB-6";
export const weights = Object.freeze({recoverability:0.35,contextIntegrity:0.25,failurePressure:0.20,concurrencyRisk:0.10,debugPressure:0.10});
export const failureClasses = Object.freeze(["PRODUCT_DEFECT","TEST_DEFECT","PROCESS_DRIFT","DORMANT_PROVENANCE","INFRA_FLAKE","HEAD_MOVED","UNKNOWN"]);
const clamp=n=>Math.max(0,Math.min(100,n));

export function emptySignals(){return {
  failureClass:"UNKNOWN",failureReproduced:false,criticalSafetyFailure:false,
  unresolvedFailureFamilies:0,unresolvedStates:0,failedCorrectionCycles:0,
  contextDamageEvents:0,hardStateReconstruction:false,activeMutationLanes:1,
  headMovedSinceCheckpoint:false,recoveryBeaconFresh:true,uncheckpointedAtomicUnits:0,
  liveAuthorityUnavailable:false,atomicOperation:false,ownerRequestsTransition:false,
  nextAtomicUnitRisksLoss:false
};}

function validate(s){
  const base=emptySignals();
  if(!s||typeof s!=="object")throw new Error("CWS-6 signals required.");
  for(const [k,v] of Object.entries(base)){
    if(!(k in s))throw new Error(`Missing CWS-6 signal: ${k}`);
    if(k==="failureClass"){
      if(!failureClasses.includes(s[k]))throw new Error(`Unknown failureClass: ${s[k]}`);
    }else if(typeof v==="boolean"){
      if(typeof s[k]!=="boolean")throw new Error(`${k} must be boolean.`);
    }else if(!Number.isInteger(s[k])||s[k]<0)throw new Error(`${k} must be a non-negative integer.`);
  }
}

export function computeDebugBudget(s){
  validate(s);
  let budget=12;
  if(s.failureClass==="TEST_DEFECT"||s.failureClass==="PROCESS_DRIFT")budget+=4;
  if(s.failureClass==="DORMANT_PROVENANCE")budget+=3;
  if(s.failureClass==="PRODUCT_DEFECT")budget-=2;
  if(s.failureClass==="HEAD_MOVED"||s.failureClass==="UNKNOWN")budget-=1;
  if(s.criticalSafetyFailure)budget-=3;
  if(s.unresolvedFailureFamilies<=1)budget+=2;
  if(s.unresolvedStates<=1)budget+=1;
  if(s.contextDamageEvents===0)budget+=2;
  if(s.contextDamageEvents>=2)budget-=3;
  if(s.hardStateReconstruction)budget-=3;
  if(s.activeMutationLanes>=2)budget-=2;
  if(s.unresolvedFailureFamilies>=3)budget-=3;
  if(s.unresolvedStates>=3)budget-=2;
  if(s.headMovedSinceCheckpoint)budget-=2;
  if(s.uncheckpointedAtomicUnits>1)budget-=4;
  return Math.max(3,Math.min(20,budget));
}

export function scoreContinuity(s){
  validate(s);
  const budget=computeDebugBudget(s);
  const active=s.unresolvedFailureFamilies>0||s.unresolvedStates>0;
  const unreproducedFlake=s.failureClass==="INFRA_FLAKE"&&!s.failureReproduced;
  const consumed=unreproducedFlake?0:s.failedCorrectionCycles;
  const components={
    recoverability:clamp((s.recoveryBeaconFresh?0:25)+s.uncheckpointedAtomicUnits*45+(s.headMovedSinceCheckpoint?35:0)+(s.nextAtomicUnitRisksLoss?50:0)+(s.liveAuthorityUnavailable?100:0)),
    contextIntegrity:clamp(s.contextDamageEvents*22+(s.hardStateReconstruction?55:0)),
    failurePressure:unreproducedFlake?0:clamp(s.unresolvedFailureFamilies*22+s.unresolvedStates*12+(s.failureClass==="PRODUCT_DEFECT"?10:0)+(s.criticalSafetyFailure?35:0)),
    concurrencyRisk:clamp(Math.max(0,s.activeMutationLanes-1)*50),
    debugPressure:active&&!unreproducedFlake?clamp(Math.round(consumed*100/Math.max(1,budget))):0
  };
  const weighted=Math.round(Object.entries(weights).reduce((sum,[k,w])=>sum+components[k]*w,0));
  let floor=0; const reasons=[];
  if(s.liveAuthorityUnavailable){floor=Math.max(floor,90);reasons.push("required live authority unavailable");}
  if(!s.recoveryBeaconFresh&&s.uncheckpointedAtomicUnits>=1){floor=Math.max(floor,45);reasons.push("one atomic unit is ahead of a stale recovery beacon");}
  if(s.uncheckpointedAtomicUnits>1){floor=Math.max(floor,90);reasons.push("crash-loss budget exceeded");}
  if(s.nextAtomicUnitRisksLoss){floor=Math.max(floor,80);reasons.push("another atomic unit risks unrecoverable volatile state");}
  if(active&&!unreproducedFlake&&consumed>=budget){floor=Math.max(floor,80);reasons.push(`ADB-6 budget ${budget} exhausted`);}
  if(active&&s.hardStateReconstruction&&s.contextDamageEvents>=2){floor=Math.max(floor,75);reasons.push("reconstructed context plus repeated context damage");}
  if(s.ownerRequestsTransition){floor=100;reasons.push("owner requested transition");}
  const score=Math.max(weighted,floor);
  let decision="CONTINUE";
  if(score>=85)decision="TRANSITION_NOW";
  else if(score>=65)decision=s.atomicOperation?"TRANSITION_AFTER_ATOMIC":"TRANSITION_NOW";
  else if(score>=45)decision="CHECKPOINT";
  const ranked=Object.entries(components).sort((a,b)=>b[1]-a[1]).filter(([,v])=>v>0).slice(0,2).map(([k,v])=>`${k} ${v}/100`);
  return {model,score,decision,components,weights,adaptiveDebugBudget:budget,consumedCorrectionCycles:consumed,remainingDebugAllowance:Math.max(0,budget-consumed),dominantFactors:ranked,reasons,scoreMeaning:"engineering transition risk only"};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2); let signals=emptySignals(); let json=false;
    for(let i=0;i<args.length;i++){
      if(args[i]==="--signals-json"&&args[i+1])signals={...signals,...JSON.parse(args[++i])};
      else if(args[i]==="--signals-file"&&args[i+1])signals={...signals,...JSON.parse(fs.readFileSync(path.resolve(args[++i]),"utf8"))};
      else if(args[i]==="--json")json=true;
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    const result=scoreContinuity(signals);
    process.stdout.write(json?`${JSON.stringify(result,null,2)}\n`:`Continuity: ${result.decision} · ${result.score}/100\nADB-6: ${result.consumedCorrectionCycles}/${result.adaptiveDebugBudget}\nDominant factors: ${result.dominantFactors.join(", ")||"none"}\n`);
  }catch(e){process.stderr.write(`${e.message}\n`);process.exitCode=1;}
}
