#!/usr/bin/env node
// SSJR-2.0 credit assessor: one validated two-device production Physical Journey pair
// + Nik's owner attestation + automated suites at the credited production main.
// It never invents credit: without a valid pair and attestation nothing is creditable.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {validatePhysicalJourneyPair} from "./validate-ssjr-physical-journey-evidence.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const MODEL_FILE="SHARED_SHOWDOWN_JOURNEY_MODEL_SSJR2.json";
export const LEDGER_FILE="SHARED_SHOWDOWN_JOURNEY_READINESS_SSJR2.json";
export const ATTESTATION_SCHEMA="career-mode-showdown.ssjr2-owner-attestation.v1";
export const ATTESTATION_STATEMENT="I confirm that Daniel and Nik personally played this Shared Showdown on the production game, on their own separate devices and networks, and that the two attached exports came from those devices without editing.";
const ATTESTATION_KEYS=["schema","owner","runDate","runtimeRevision","managers","deviceLabels","statement","stableReleaseAccepted"];

const plain=value=>!!value&&typeof value==="object"&&!Array.isArray(value);
const sha=text=>`sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
const label=value=>String(value||"").trim().toLowerCase();

export function currentProductionRuntime(repoRoot=root){
  const source=fs.readFileSync(path.join(repoRoot,"service-worker.js"),"utf8");
  const match=source.match(/const RUNTIME_REVISION = "([^"]+)";/);
  if(!match)throw new Error("service-worker.js does not declare RUNTIME_REVISION.");
  return match[1];
}
export function loadModel(repoRoot=root){return JSON.parse(fs.readFileSync(path.join(repoRoot,MODEL_FILE),"utf8"));}
export function loadLedger(repoRoot=root){return JSON.parse(fs.readFileSync(path.join(repoRoot,LEDGER_FILE),"utf8"));}
export function capabilities(model){return model.domains.flatMap(domain=>domain.capabilities);}

export function validateAttestation(attestation,first,second,runtimeRevision){
  const issues=[];const need=(ok,code,message)=>{if(!ok)issues.push({source:"attestation",code,message});};
  need(plain(attestation),"ATTESTATION_REQUIRED","A completed owner attestation is required.");
  if(!plain(attestation))return issues;
  need(Object.keys(attestation).length===ATTESTATION_KEYS.length&&ATTESTATION_KEYS.every(key=>Object.hasOwn(attestation,key)),"ATTESTATION_FIELDS_INVALID","The attestation must contain exactly the template fields.");
  need(attestation.schema===ATTESTATION_SCHEMA,"ATTESTATION_SCHEMA_INVALID","Unknown attestation schema.");
  need(attestation.owner==="Nik","ATTESTATION_OWNER_INVALID","Only the product owner, Nik, can attest a physical run.");
  need(/^\d{4}-\d{2}-\d{2}$/.test(String(attestation.runDate||""))&&Number.isFinite(Date.parse(attestation.runDate)),"ATTESTATION_DATE_INVALID","runDate must be a real YYYY-MM-DD date.");
  need(attestation.runtimeRevision===runtimeRevision,"ATTESTATION_RUNTIME_MISMATCH",`The attested runtime must be the production runtime ${runtimeRevision}.`);
  need(plain(attestation.managers)&&attestation.managers.playerOne==="Daniel"&&attestation.managers.playerTwo==="Nik"&&Object.keys(attestation.managers).length===2,"ATTESTATION_MANAGERS_INVALID","Managers must be exactly playerOne Daniel and playerTwo Nik.");
  need(attestation.statement===ATTESTATION_STATEMENT,"ATTESTATION_STATEMENT_INVALID","The attestation statement must be exactly the template statement.");
  need(typeof attestation.stableReleaseAccepted==="boolean","ATTESTATION_STABLE_FLAG_INVALID","stableReleaseAccepted must be true or false.");
  const attested=Array.isArray(attestation.deviceLabels)?attestation.deviceLabels.map(label).sort():[];
  const exported=[label(first?.deviceLabel),label(second?.deviceLabel)].sort();
  need(attested.length===2&&attested[0]&&attested[1]&&attested[0]===exported[0]&&attested[1]===exported[1],"ATTESTATION_DEVICES_MISMATCH","Attested device labels must match the two exports exactly.");
  return issues;
}

function stagesOf(evidence){return new Set((Array.isArray(evidence?.milestones)?evidence.milestones:[]).filter(plain).map(item=>item.stage));}
function confirmedSeasons(evidence){const setup=(evidence?.milestones||[]).find(item=>plain(item)&&item.stage==="setup-confirmed");return Number(setup?.totalSeasons||0);}

export function evaluateRun({first,second,attestation,model=loadModel(),ledger=loadLedger(),runtimeRevision=currentProductionRuntime(),repoRoot=root}){
  const pair=validatePhysicalJourneyPair(first,second,{expectedRuntimeRevision:runtimeRevision});
  const issues=[...pair.issues.map(item=>({...item})),...validateAttestation(attestation,first,second,runtimeRevision)];
  const already=new Set(ledger.creditedCapabilityIds||[]),credited=new Set(already),newly=[],blocked=[];
  const valid=issues.length===0,a=stagesOf(first),b=stagesOf(second),seasons=Math.min(confirmedSeasons(first),confirmedSeasons(second));
  for(const capability of capabilities(model)){
    if(already.has(capability.id))continue;
    const reasons=[];
    if(!valid)reasons.push("physical pair or owner attestation is not valid");
    const missingSuites=(capability.automatedEvidence||[]).filter(file=>!fs.existsSync(path.join(repoRoot,file)));
    if(missingSuites.length)reasons.push(`automated suites missing: ${missingSuites.join(", ")}`);
    const production=capability.productionEvidence||{};
    if(production.requiresConfirmedSeasons&&seasons<production.requiresConfirmedSeasons.minimum)reasons.push(`needs a physical run with at least ${production.requiresConfirmedSeasons.minimum} seasons`);
    for(const stage of production.requiredMilestonesOnBothDevices||[])if(!a.has(stage)||!b.has(stage))reasons.push(`milestone ${stage} missing on a device`);
    if(capability.requiresOwnerStableReleaseAcceptance&&attestation?.stableReleaseAccepted!==true)reasons.push("owner has not accepted the stable release");
    const missingDeps=capability.dependsOn.filter(id=>!credited.has(id));
    if(missingDeps.length)reasons.push(`depends on uncredited ${missingDeps.join(", ")}`);
    if(reasons.length)blocked.push({id:capability.id,weight:capability.weight,reasons});
    else{credited.add(capability.id);newly.push({id:capability.id,weight:capability.weight});}
  }
  const weightOf=id=>capabilities(model).find(item=>item.id===id)?.weight||0;
  const scoreBefore=[...already].reduce((sum,id)=>sum+weightOf(id),0),scoreAfter=[...credited].reduce((sum,id)=>sum+weightOf(id),0);
  return Object.freeze({schema:"career-mode-showdown.ssjr2-physical-run-assessment.v1",modelVersion:model.modelVersion,runtimeRevision,valid,issues,pairSummary:pair.summary,newlyCreditable:newly,blocked,scoreBefore,scoreAfter,creditRecorded:false});
}

export function recordRun({assessment,firstText,secondText,attestationText,mainSha,automatedVerified,ledger=loadLedger(),recordedAt=new Date().toISOString()}){
  if(!assessment.valid)throw new Error("SSJR2_RUN_INVALID: an invalid run cannot be recorded.");
  if(!/^[0-9a-f]{40}$/.test(String(mainSha||"")))throw new Error("SSJR2_MAIN_SHA_REQUIRED: --main-sha must be the exact 40-character production main SHA.");
  if(automatedVerified!==true)throw new Error("SSJR2_AUTOMATED_EVIDENCE_UNVERIFIED: confirm Validate POS20 and the zero-billing Rules deployment succeeded for that production main with --automated-verified.");
  const exportHashes=[sha(firstText),sha(secondText)].sort();
  if((ledger.events||[]).some(event=>JSON.stringify(event.exportHashes)===JSON.stringify(exportHashes)))throw new Error("SSJR2_RUN_ALREADY_RECORDED: this exact physical pair is already in the ledger.");
  const creditedIds=[...(ledger.creditedCapabilityIds||[]),...assessment.newlyCreditable.map(item=>item.id)];
  const event={eventId:`ssjr2-physical-run-${recordedAt.slice(0,10)}-${exportHashes[0].slice(7,15)}`,recordedAt,modelVersion:assessment.modelVersion,runtimeRevision:assessment.runtimeRevision,productionMainSha:mainSha,automatedEvidenceVerified:true,exportHashes,attestationHash:sha(attestationText),creditedCapabilityIds:assessment.newlyCreditable.map(item=>item.id),blockedCapabilityIds:assessment.blocked.map(item=>item.id),scoreBefore:assessment.scoreBefore,scoreAfter:assessment.scoreAfter};
  return {...ledger,currentScore:assessment.scoreAfter,creditedCapabilityIds:creditedIds,events:[...(ledger.events||[]),event]};
}

const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===self){
  const args=process.argv.slice(2),flags=new Set(args.filter(arg=>arg.startsWith("--"))),files=args.filter(arg=>!arg.startsWith("--")&&!/^[0-9a-f]{40}$/.test(arg));
  const shaIndex=args.indexOf("--main-sha"),mainSha=shaIndex>=0?args[shaIndex+1]:null;
  if(files.length!==3){console.error("Usage: node scripts/ssjr2-physical-run-credit.mjs <daniel-export.json> <nik-export.json> <owner-attestation.json> [--record --main-sha <sha> --automated-verified]");process.exit(2);}
  const texts=files.map(file=>fs.readFileSync(path.resolve(file),"utf8"));
  const assessment=evaluateRun({first:JSON.parse(texts[0]),second:JSON.parse(texts[1]),attestation:JSON.parse(texts[2])});
  if(flags.has("--record")){
    try{const next=recordRun({assessment,firstText:texts[0],secondText:texts[1],attestationText:texts[2],mainSha,automatedVerified:flags.has("--automated-verified")});fs.writeFileSync(path.join(root,LEDGER_FILE),`${JSON.stringify(next,null,2)}\n`);console.log(JSON.stringify({...assessment,creditRecorded:true},null,2));}
    catch(error){console.error(error.message);process.exit(1);}
  }else console.log(JSON.stringify(assessment,null,2));
  if(!assessment.valid)process.exit(1);
}
