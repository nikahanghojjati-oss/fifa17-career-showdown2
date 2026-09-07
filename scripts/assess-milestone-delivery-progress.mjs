import fs from "node:fs";
import { fileURLToPath } from "node:url";

const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const round2 = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function invariant(condition, message) {
  if (!condition) throw new Error(`MDP-1 invariant failed: ${message}`);
}

export function assessMilestoneDelivery(trackerModel, ledger, milestoneModel) {
  invariant(trackerModel?.trackerId === "MDP-1", "tracker model must be MDP-1");
  invariant(ledger?.trackerId === trackerModel.trackerId, "ledger trackerId must match model");
  invariant(ledger?.milestoneModel === milestoneModel?.modelVersion, "ledger milestone binding must match the active milestone model");
  invariant(Number(trackerModel.scale) === 100, "tracker scale must remain 100");
  invariant(Number(trackerModel.precision) === 2, "tracker precision must remain two decimal places");

  const lifecycleStages = trackerModel.lifecycleStages || [];
  invariant(lifecycleStages.length > 0, "lifecycle stages are required");
  invariant(round2(lifecycleStages.reduce((sum, stage) => sum + Number(stage.weight || 0), 0)) === 100, "lifecycle-stage weights must sum to 100");
  const stageIds = lifecycleStages.map(stage => stage.id);
  invariant(new Set(stageIds).size === stageIds.length, "lifecycle stage IDs must be unique");

  const milestoneCapabilities = (milestoneModel.domains || []).flatMap(domain =>
    (domain.capabilities || []).map(capability => ({
      ...capability,
      domainId: domain.id
    }))
  );
  invariant(milestoneCapabilities.length > 0, "active milestone requires features/capabilities");
  invariant(round2(milestoneCapabilities.reduce((sum, capability) => sum + Number(capability.weight || 0), 0)) === 100, "active milestone capability weights must sum to 100");

  const ledgerCapabilities = ledger.capabilities || [];
  invariant(ledgerCapabilities.length === milestoneCapabilities.length, "ledger must contain every active milestone capability exactly once");
  const ledgerById = new Map(ledgerCapabilities.map(capability => [capability.id, capability]));
  invariant(ledgerById.size === ledgerCapabilities.length, "ledger capability IDs must be unique");

  let total = 0;
  let fullyLifecycleDelivered = 0;
  let preIntegrationComplete = 0;
  let designDefinedOnly = 0;

  for (const milestoneCapability of milestoneCapabilities) {
    const feature = ledgerById.get(milestoneCapability.id);
    invariant(feature, `missing capability ${milestoneCapability.id}`);
    invariant(Number(feature.milestoneWeight) === Number(milestoneCapability.weight), `${feature.id} weight drift from milestone authority`);
    invariant(Array.isArray(feature.evidenceRefs) && feature.evidenceRefs.length > 0, `${feature.id} requires reviewable MDP evidence references`);

    const stageStateKeys = Object.keys(feature.stages || {});
    invariant(stageStateKeys.length === stageIds.length && stageIds.every(id => stageStateKeys.includes(id)), `${feature.id} must record every lifecycle stage`);

    let lifecyclePercent = 0;
    let nonCompleteSeen = false;
    let inProgressCount = 0;
    for (const stage of lifecycleStages) {
      const state = feature.stages[stage.id];
      invariant((trackerModel.allowedStageStates || []).includes(state), `${feature.id}/${stage.id} has unsupported state ${state}`);
      if (state === "complete") {
        invariant(!nonCompleteSeen, `${feature.id} cannot complete ${stage.id} after an earlier lifecycle stage is incomplete`);
        lifecyclePercent += Number(stage.weight);
      } else {
        nonCompleteSeen = true;
        if (state === "in_progress") inProgressCount += 1;
      }
    }
    invariant(inProgressCount <= 1, `${feature.id} may have at most one in-progress lifecycle stage`);

    lifecyclePercent = round2(lifecyclePercent);
    invariant(Number(feature.lifecyclePercent) === lifecyclePercent, `${feature.id} stored lifecyclePercent must be derived from completed stages`);
    const contribution = round2(Number(milestoneCapability.weight) * lifecyclePercent / 100);
    invariant(Number(feature.weightedContribution) === contribution, `${feature.id} stored weightedContribution must match milestone weight and lifecycle maturity`);
    total = round2(total + contribution);

    if (lifecyclePercent === 100) fullyLifecycleDelivered += 1;
    if (lifecyclePercent === 90 && feature.stages["product-integration"] === "in_progress") preIntegrationComplete += 1;
    if (lifecyclePercent === 10 && feature.stages.design === "complete" && feature.stages.implementation === "not_started") designDefinedOnly += 1;
  }

  invariant(total === Number(ledger.currentScore), `stored milestone score ${ledger.currentScore} must equal derived ${total}`);
  invariant(ledger.formattedScore === `${total.toFixed(2)}/100`, "formattedScore must use exactly two decimal places");
  invariant(Number(ledger.summary?.featureCount) === milestoneCapabilities.length, "summary featureCount must match milestone capability count");
  invariant(Number(ledger.summary?.fullyLifecycleDelivered) === fullyLifecycleDelivered, "summary fullyLifecycleDelivered drift");
  invariant(Number(ledger.summary?.preIntegrationComplete) === preIntegrationComplete, "summary preIntegrationComplete drift");
  invariant(Number(ledger.summary?.designDefinedOnly) === designDefinedOnly, "summary designDefinedOnly drift");

  return {
    trackerId: trackerModel.trackerId,
    milestoneModel: milestoneModel.modelVersion,
    score: total,
    formattedScore: `${total.toFixed(2)}/100`,
    featureCount: milestoneCapabilities.length,
    fullyLifecycleDelivered,
    preIntegrationComplete,
    designDefinedOnly
  };
}

function main() {
  const trackerModel = readJson("MILESTONE_DELIVERY_PROGRESS_MODEL.json");
  const ledger = readJson("MILESTONE_DELIVERY_PROGRESS.json");
  const milestoneModel = readJson(ledger.milestoneModelFile);
  const result = assessMilestoneDelivery(trackerModel, ledger, milestoneModel);
  process.stdout.write(`Milestone Delivery Progress (${result.trackerId}, ${result.milestoneModel}): ${result.formattedScore}\n`);
  process.stdout.write(`Features: ${result.fullyLifecycleDelivered} integrated, ${result.preIntegrationComplete} pre-integration complete, ${result.designDefinedOnly} design-defined only, ${result.featureCount} total.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(error?.stack || error);
    process.exitCode = 1;
  }
}
