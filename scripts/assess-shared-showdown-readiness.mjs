import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

export const SSJR1_MODEL_SHA256 = "246aa4572600bc00e14b505e0de15308373fdb57575015a60092d84935697f4e";
const BASELINE_SHA = "39ffe88d61dcda973df03a18e0266fcfe4cf5638";
function requireCondition(condition, message){ if(!condition) throw new Error(message); }
function canonical(value){
  if(Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if(value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
export function assessSharedShowdown(model, ledger, rjr){
  const fingerprint = crypto.createHash("sha256").update(canonical(model)).digest("hex");
  requireCondition(fingerprint === SSJR1_MODEL_SHA256 && ledger.modelSha256 === fingerprint, "Frozen SSJR-1 definition changed; create a separately backcast model version.");
  requireCondition(model.modelVersion === "SSJR-1" && ledger.modelVersion === "SSJR-1" && model.denominator === 100 && ledger.denominator === 100, "SSJR-1 identity or denominator changed.");
  requireCondition(rjr.modelVersion === "RJR-1" && rjr.currentScore === 100, "Completed RJR-1 prerequisite must be verified before reporting SSJR credit.");
  const capabilities = new Map(model.domains.flatMap(domain => domain.capabilities.map(capability => [capability.id, {...capability, domainId:domain.id}])));
  requireCondition(capabilities.size === model.domains.reduce((sum, domain) => sum + domain.capabilities.length, 0), "Duplicate capability definition.");
  requireCondition(model.domains.reduce((sum, domain) => sum + domain.weight, 0) === 100, "Domain weights must total 100.");
  for(const domain of model.domains) requireCondition(domain.weight === domain.capabilities.reduce((sum, capability) => sum + capability.weight, 0), "Capability weights disagree with domain weight.");
  const baseline = ledger.baseline;
  requireCondition(baseline.eventId === "ssjr1-initial-backcast" && baseline.sourceSha === BASELINE_SHA && baseline.runtimeRevision === "1.9.1-r2" && baseline.score === 0 && Array.isArray(baseline.creditedCapabilityIds) && baseline.creditedCapabilityIds.length === 0, "The one-time SSJR-1 baseline cannot be rewritten.");
  const bundles = new Map();
  for(const bundle of ledger.evidenceBundles){
    requireCondition(typeof bundle.id === "string" && bundle.id.length > 0 && !bundles.has(bundle.id), "Duplicate or missing evidence bundle ID.");
    requireCondition(/^[0-9a-f]{40}$/.test(bundle.sourceSha) && /^[0-9]+\.[0-9]+\.[0-9]+-r[1-9][0-9]*$/.test(bundle.runtimeRevision), "Evidence requires exact source and runtime identities.");
    requireCondition(Array.isArray(bundle.references) && bundle.references.length > 0 && bundle.references.every(ref => typeof ref === "string" && ref.trim().length > 0), "Evidence requires reviewable references.");
    requireCondition(Array.isArray(bundle.capabilityIds) && bundle.capabilityIds.length > 0 && bundle.capabilityIds.every(id => capabilities.has(id)), "Evidence refers to an unknown capability.");
    requireCondition(Array.isArray(bundle.layers) && new Set(bundle.layers).size === bundle.layers.length, "Evidence layers must be explicit and unique.");
    requireCondition(typeof bundle.finding === "string" && bundle.finding.trim().length > 0, "Evidence requires a concrete finding.");
    bundles.set(bundle.id, bundle);
  }
  const active = new Map(), eventIds = new Set(), consumed = new Set();
  const history = [];
  for(const event of ledger.events){
    requireCondition(typeof event.id === "string" && event.id.length > 0 && !eventIds.has(event.id), "Duplicate or missing SSJR event ID.");
    eventIds.add(event.id);
    const capability = capabilities.get(event.capabilityId), bundle = bundles.get(event.evidenceId);
    requireCondition(capability && bundle && bundle.capabilityIds.includes(capability.id), "Event must cite evidence for its exact capability.");
    const evidenceUse = `${event.evidenceId}:${event.capabilityId}:${event.kind}`;
    requireCondition(!consumed.has(evidenceUse), "Consumed evidence cannot be credited again.");
    consumed.add(evidenceUse);
    let delta = 0;
    if(event.kind === "credit"){
      requireCondition(!active.has(capability.id), "Capability already credited; no double counting.");
      requireCondition(capability.requiredEvidenceLayers.every(layer => bundle.layers.includes(layer)), "Capability evidence is missing a required proof layer; process work alone earns zero.");
      requireCondition(capability.dependsOn.every(id => active.has(id)), "Required shared-journey dependency has not been credited.");
      active.set(capability.id, bundle.id);
      delta = capability.weight;
    }else if(event.kind === "invalidate"){
      requireCondition(active.has(capability.id) && bundle.layers.includes("regression-reproduction"), "Invalidation requires an active credit and reproduced regression evidence.");
      const removed = new Set([capability.id]);
      let changed = true;
      while(changed){
        changed = false;
        for(const id of active.keys()){
          if(!removed.has(id) && capabilities.get(id).dependsOn.some(dependency => removed.has(dependency))){ removed.add(id); changed = true; }
        }
      }
      for(const id of removed){ active.delete(id); delta -= capabilities.get(id).weight; }
    }else throw new Error("Unknown SSJR event kind.");
    requireCondition(event.delta === delta, "Event delta disagrees with fixed capability credit or dependent invalidation.");
    history.push({id:event.id, delta});
  }
  const domains = model.domains.map(domain => ({id:domain.id, weight:domain.weight, earned:domain.capabilities.reduce((sum, capability) => sum + (active.has(capability.id) ? capability.weight : 0), 0)}));
  const score = domains.reduce((sum, domain) => sum + domain.earned, 0);
  requireCondition(score === ledger.currentScore, "Stored SSJR score disagrees with evidence calculation.");
  const remainingCapabilityIds = [...capabilities.keys()].filter(id => !active.has(id));
  requireCondition(JSON.stringify(remainingCapabilityIds) === JSON.stringify(ledger.remainingCapabilityIds), "Remaining-capability ledger is stale.");
  return {modelVersion:"SSJR-1", score, denominator:100, remaining:100-score, domains, remainingCapabilityIds, history, baseline:0, processCredit:0};
}

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  const read = name => JSON.parse(fs.readFileSync(name, "utf8"));
  const result = assessSharedShowdown(read("SHARED_SHOWDOWN_JOURNEY_MODEL.json"), read("SHARED_SHOWDOWN_JOURNEY_READINESS.json"), read("REMOTE_JOINING_READINESS.json"));
  console.log(JSON.stringify(result, null, 2));
}
