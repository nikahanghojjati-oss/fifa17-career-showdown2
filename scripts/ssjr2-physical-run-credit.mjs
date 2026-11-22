#!/usr/bin/env node
// SSJR-2.x credit assessor (model version comes from the model file): one validated two-device production Physical Journey pair
// + Nik's hash-bound owner attestation + automated suites verified live on production main.
// It never invents credit: without all three layers nothing is creditable or recordable.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {validatePhysicalJourneyPair} from "./validate-ssjr-physical-journey-evidence.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const REPOSITORY="nikahanghojjati-oss/fifa17-career-showdown2";
export const MODEL_FILE="SHARED_SHOWDOWN_JOURNEY_MODEL_SSJR2.json";
export const LEDGER_FILE="SHARED_SHOWDOWN_JOURNEY_READINESS_SSJR2.json";
export const ATTESTATION_SCHEMA="career-mode-showdown.ssjr2-owner-attestation.v1";
export const ATTESTATION_STATEMENT="I confirm that Daniel and Nik personally played this Shared Showdown on the production game, on their own separate devices and networks, and that the two attached exports came from those devices without editing.";
export const REQUIRED_MAIN_CHECKS=Object.freeze(["POS20 exact-head cognitive seal","POS20 gameplay lifecycle 1/3/5/10","deploy","deployed-site-smoke"]);
export const RULES_WORKFLOW="deploy-firestore-rules-zero-billing.yml";
const ATTESTATION_KEYS=["schema","owner","runDate","runtimeRevision","managers","deviceLabels","exportHashes","statement","stableReleaseAccepted"];
const HASH=/^sha256:[a-f0-9]{64}$/;

const plain=value=>!!value&&typeof value==="object"&&!Array.isArray(value);
export const hashText=text=>`sha256:${crypto.createHash("sha256").update(String(text)).digest("hex")}`;
const label=value=>String(value||"").trim().toLowerCase();

export function currentProductionRuntime(repoRoot=root){return runtimeFromServiceWorker(fs.readFileSync(path.join(repoRoot,"service-worker.js"),"utf8"));}
export function runtimeFromServiceWorker(source){const match=String(source||"").match(/const RUNTIME_REVISION = "([^"]+)";/);if(!match)throw new Error("service-worker.js does not declare RUNTIME_REVISION.");return match[1];}
export function loadModel(repoRoot=root){return JSON.parse(fs.readFileSync(path.join(repoRoot,MODEL_FILE),"utf8"));}
export function loadLedger(repoRoot=root){return JSON.parse(fs.readFileSync(path.join(repoRoot,LEDGER_FILE),"utf8"));}
export function capabilities(model){return model.domains.flatMap(domain=>domain.capabilities);}
export function exportHashesFor(firstText,secondText){return [hashText(firstText),hashText(secondText)].sort();}

export function validateAttestation(attestation,first,second,runtimeRevision,exportHashes){
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
  const hashes=Array.isArray(attestation.exportHashes)?[...attestation.exportHashes].sort():[];
  need(hashes.length===2&&hashes.every(value=>HASH.test(value))&&Array.isArray(exportHashes)&&hashes[0]===exportHashes[0]&&hashes[1]===exportHashes[1],"ATTESTATION_EXPORT_HASH_MISMATCH","The attestation must name the SHA-256 of exactly these two export files.");
  return issues;
}

function stagesOf(evidence){return new Set((Array.isArray(evidence?.milestones)?evidence.milestones:[]).filter(plain).map(item=>item.stage));}

export function evaluateRun({first,second,firstText,secondText,attestation,model=loadModel(),ledger=loadLedger(),runtimeRevision=currentProductionRuntime(),repoRoot=root}){
  if(typeof firstText!=="string"||typeof secondText!=="string")throw new Error("SSJR2_EXPORT_TEXT_REQUIRED: the exact export file contents are required to bind the attestation.");
  const exportHashes=exportHashesFor(firstText,secondText);
  const pair=validatePhysicalJourneyPair(first,second,{expectedRuntimeRevision:runtimeRevision});
  const issues=[...pair.issues.map(item=>({...item})),...validateAttestation(attestation,first,second,runtimeRevision,exportHashes)];
  const already=new Set(ledger.creditedCapabilityIds||[]),credited=new Set(already),newly=[],blocked=[];
  const valid=issues.length===0,a=stagesOf(first),b=stagesOf(second);
  for(const capability of capabilities(model)){
    if(already.has(capability.id))continue;
    const reasons=[];
    if(!valid)reasons.push("physical pair or owner attestation is not valid");
    const missingSuites=(capability.automatedEvidence||[]).filter(file=>!fs.existsSync(path.join(repoRoot,file)));
    if(missingSuites.length)reasons.push(`automated suites missing: ${missingSuites.join(", ")}`);
    const production=capability.productionEvidence||{};
    if(production.capturable===false)reasons.push("the current Physical Journey recorder cannot capture this capability; a recorder and validator revision is required");
    for(const stage of production.requiredMilestonesOnBothDevices||[])if(!a.has(stage)||!b.has(stage))reasons.push(`milestone ${stage} missing on a device`);
    const minimumSeasons=Number(production.requiresConfirmedSeasons?.minimum||0),runSeasons=Number(pair.summary?.totalSeasons||0);
    if(minimumSeasons&&runSeasons<minimumSeasons)reasons.push(`needs a run of at least ${minimumSeasons} confirmed seasons (this run confirmed ${runSeasons||"none"})`);
    if(capability.requiresOwnerStableReleaseAcceptance&&attestation?.stableReleaseAccepted!==true)reasons.push("owner has not accepted the stable release");
    const missingDeps=capability.dependsOn.filter(id=>!credited.has(id));
    if(missingDeps.length)reasons.push(`depends on uncredited ${missingDeps.join(", ")}`);
    if(reasons.length)blocked.push({id:capability.id,weight:capability.weight,reasons});
    else{credited.add(capability.id);newly.push({id:capability.id,weight:capability.weight});}
  }
  const weightOf=id=>capabilities(model).find(item=>item.id===id)?.weight||0;
  const scoreBefore=[...already].reduce((sum,id)=>sum+weightOf(id),0),scoreAfter=[...credited].reduce((sum,id)=>sum+weightOf(id),0);
  return Object.freeze({schema:"career-mode-showdown.ssjr2-physical-run-assessment.v1",modelVersion:model.modelVersion,runtimeRevision,exportHashes,valid,issues,pairSummary:pair.summary,newlyCreditable:newly,blocked,scoreBefore,scoreAfter,creditRecorded:false});
}

export function draftAttestation({first,second,firstText,secondText,runtimeRevision=currentProductionRuntime(),runDate=new Date().toISOString().slice(0,10)}){
  return {schema:ATTESTATION_SCHEMA,owner:"Nik",runDate,runtimeRevision,managers:{playerOne:"Daniel",playerTwo:"Nik"},deviceLabels:[String(first?.deviceLabel||""),String(second?.deviceLabel||"")],exportHashes:exportHashesFor(firstText,secondText),statement:ATTESTATION_STATEMENT,stableReleaseAccepted:false};
}

export function curlJson(url){
  const headers=process.env.GITHUB_TOKEN?["-H",`Authorization: Bearer ${process.env.GITHUB_TOKEN}`]:[];
  const result=spawnSync("curl",["-sS","-f","-H","Accept: application/vnd.github+json",...headers,url],{encoding:"utf8"});
  if(result.status!==0)throw new Error(`SSJR2_GITHUB_UNREACHABLE: ${url} (${(result.stderr||"").trim()})`);
  return JSON.parse(result.stdout);
}
export function curlText(url){const result=spawnSync("curl",["-sS","-f","-H","Accept: application/vnd.github.raw",...(process.env.GITHUB_TOKEN?["-H",`Authorization: Bearer ${process.env.GITHUB_TOKEN}`]:[]),url],{encoding:"utf8"});if(result.status!==0)throw new Error(`SSJR2_GITHUB_UNREACHABLE: ${url}`);return result.stdout;}

// A Rules deployment run on an older SHA is only evidence for mainSha when none of the
// inputs its Rules/emulator suites depend on changed in between (conservative superset).
export const RULES_INPUT_PATTERNS=Object.freeze([/^js\//,/^tests\/firebase\//,/^tests\/support\//,/^firestore[^/]*\.rules$/,/^firebase[^/]*\.json$/,/^package(-lock)?\.json$/,/^ops\/firebase-rules-deploy-request\.json$/,/^\.github\/workflows\/deploy-firestore-rules-zero-billing\.yml$/]);
export function rulesWorkflowInputs(workflowText){
  const text=String(workflowText||""),paths=new Set();
  const filter=text.match(/paths:\s*\n((?:\s+-\s+[^\n]+\n?)+)/);if(filter)for(const line of filter[1].split("\n"))if(line.trim().startsWith("- "))paths.add(line.trim().slice(2).trim());
  for(const match of text.matchAll(/\b(?:tests|scripts)\/[A-Za-z0-9_./-]+\.(?:cjs|mjs|js)\b/g))paths.add(match[0]);
  return paths;
}
export function rulesInputsUnchanged({api,fromSha,mainSha,fetchJson,fetchText}){
  const problems=[],compare=fetchJson(`${api}/compare/${fromSha}...${mainSha}`);
  if(!compare||!["ahead","identical"].includes(compare.status))return [`the last successful Rules deployment (${String(fromSha).slice(0,7)}) is not an ancestor of main`];
  const files=Array.isArray(compare.files)?compare.files.map(item=>item.filename):[];
  if(files.length>=300)return ["too many files changed since the last successful Rules deployment to prove its suites still apply"];
  let inputs;try{inputs=rulesWorkflowInputs(fetchText(`${api}/contents/.github/workflows/${RULES_WORKFLOW}?ref=${mainSha}`));}catch(error){return [error.message];}
  const changed=files.filter(file=>inputs.has(file)||RULES_INPUT_PATTERNS.some(pattern=>pattern.test(file)));
  if(changed.length)problems.push(`Rules suite inputs changed since the last successful Rules deployment (${String(fromSha).slice(0,7)}): ${changed.slice(0,8).join(", ")}${changed.length>8?", ...":""}. Run the "${RULES_WORKFLOW}" workflow on main once, then record again`);
  return problems;
}

// Live verification of the automated layer for the credited production main.
export function verifyAutomatedEvidence({mainSha,runtimeRevision,fetchJson=curlJson,fetchText=curlText,repository=REPOSITORY}){
  const api=`https://api.github.com/repos/${repository}`,problems=[];
  if(!/^[0-9a-f]{40}$/.test(String(mainSha||"")))throw new Error("SSJR2_MAIN_SHA_REQUIRED: --main-sha must be the exact 40-character production main SHA.");
  const live=fetchJson(`${api}/commits/main`);if(live?.sha!==mainSha)problems.push(`main is ${live?.sha||"unknown"}, not ${mainSha}`);
  const runs=fetchJson(`${api}/commits/${mainSha}/check-runs?per_page=100`)?.check_runs||[];
  if(!runs.length)problems.push("no check runs exist for that SHA");
  for(const run of runs)if(run.status!=="completed"||!["success","skipped","neutral"].includes(run.conclusion))problems.push(`check ${run.name} is ${run.status}/${run.conclusion}`);
  for(const name of REQUIRED_MAIN_CHECKS)if(!runs.some(run=>run.name===name&&run.conclusion==="success"))problems.push(`required check ${name} did not succeed`);
  const rules=fetchJson(`${api}/actions/workflows/${RULES_WORKFLOW}/runs?branch=main&per_page=1`)?.workflow_runs||[];
  if(!rules.length||rules[0].conclusion!=="success")problems.push("the latest main zero-billing Firestore Rules deployment did not succeed");
  else if(rules[0].head_sha!==mainSha)problems.push(...rulesInputsUnchanged({api,fromSha:rules[0].head_sha,mainSha,fetchJson,fetchText}));
  let mainRuntime=null;try{mainRuntime=runtimeFromServiceWorker(fetchText(`${api}/contents/service-worker.js?ref=${mainSha}`));}catch(error){problems.push(error.message);}
  if(mainRuntime&&mainRuntime!==runtimeRevision)problems.push(`production main runtime ${mainRuntime} differs from the evidence runtime ${runtimeRevision}`);
  if(problems.length)throw new Error(`SSJR2_AUTOMATED_EVIDENCE_UNVERIFIED: ${problems.join("; ")}`);
  return Object.freeze({mainSha,runtimeRevision:mainRuntime,requiredChecks:[...REQUIRED_MAIN_CHECKS],checkRunCount:runs.length,rulesDeploymentRunId:rules[0].id,rulesDeploymentHeadSha:rules[0].head_sha});
}

export function recordRun({assessment,attestationText,verification,ledger=loadLedger(),recordedAt=new Date().toISOString()}){
  if(!assessment.valid)throw new Error("SSJR2_RUN_INVALID: an invalid run cannot be recorded.");
  if(!verification||!/^[0-9a-f]{40}$/.test(String(verification.mainSha||""))||verification.runtimeRevision!==assessment.runtimeRevision||!Number.isInteger(verification.rulesDeploymentRunId))throw new Error("SSJR2_AUTOMATED_EVIDENCE_UNVERIFIED: a live verification of production main is required.");
  const exportHashes=assessment.exportHashes;
  if((ledger.events||[]).some(event=>JSON.stringify(event.exportHashes)===JSON.stringify(exportHashes)))throw new Error("SSJR2_RUN_ALREADY_RECORDED: this exact physical pair is already in the ledger.");
  const creditedIds=[...(ledger.creditedCapabilityIds||[]),...assessment.newlyCreditable.map(item=>item.id)];
  const event={eventId:`ssjr2-physical-run-${recordedAt.slice(0,10)}-${exportHashes[0].slice(7,15)}`,recordedAt,modelVersion:assessment.modelVersion,runtimeRevision:assessment.runtimeRevision,productionMainSha:verification.mainSha,automatedEvidence:{requiredChecks:verification.requiredChecks,checkRunCount:verification.checkRunCount,rulesDeploymentRunId:verification.rulesDeploymentRunId,rulesDeploymentHeadSha:verification.rulesDeploymentHeadSha},exportHashes,attestationHash:hashText(attestationText),provenance:"owner-delivered hash-bound attestation",creditedCapabilityIds:assessment.newlyCreditable.map(item=>item.id),blockedCapabilityIds:assessment.blocked.map(item=>item.id),scoreBefore:assessment.scoreBefore,scoreAfter:assessment.scoreAfter};
  return {...ledger,currentScore:assessment.scoreAfter,creditedCapabilityIds:creditedIds,events:[...(ledger.events||[]),event]};
}

const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&path.resolve(process.argv[1])===self){
  const args=process.argv.slice(2),flags=new Set(args.filter(arg=>arg.startsWith("--")));
  const shaIndex=args.indexOf("--main-sha"),mainSha=shaIndex>=0?args[shaIndex+1]:null,files=args.filter((arg,index)=>!arg.startsWith("--")&&index!==shaIndex+1);
  const usage="Usage:\n  node scripts/ssjr2-physical-run-credit.mjs --draft-attestation <daniel.json> <nik.json>\n  node scripts/ssjr2-physical-run-credit.mjs <daniel.json> <nik.json> <attestation.json> [--record --main-sha <production-main-sha>]";
  const texts=files.map(file=>fs.readFileSync(path.resolve(file),"utf8"));
  if(flags.has("--draft-attestation")){if(files.length!==2){console.error(usage);process.exit(2);}console.log(JSON.stringify(draftAttestation({first:JSON.parse(texts[0]),second:JSON.parse(texts[1]),firstText:texts[0],secondText:texts[1]}),null,2));process.exit(0);}
  if(files.length!==3){console.error(usage);process.exit(2);}
  const assessment=evaluateRun({first:JSON.parse(texts[0]),second:JSON.parse(texts[1]),firstText:texts[0],secondText:texts[1],attestation:JSON.parse(texts[2])});
  if(flags.has("--record")){
    try{const verification=verifyAutomatedEvidence({mainSha,runtimeRevision:assessment.runtimeRevision});const next=recordRun({assessment,attestationText:texts[2],verification});fs.writeFileSync(path.join(root,LEDGER_FILE),`${JSON.stringify(next,null,2)}\n`);console.log(JSON.stringify({...assessment,verification,creditRecorded:true},null,2));}
    catch(error){console.error(error.message);process.exit(1);}
  }else console.log(JSON.stringify(assessment,null,2));
  if(!assessment.valid)process.exit(1);
}
