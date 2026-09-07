const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const readJson = file => JSON.parse(read(file));

const contract = readJson("SHARED_SHOWDOWN_DUAL_SCREEN_EXPERIENCE.json");
const ssjr = readJson("SHARED_SHOWDOWN_JOURNEY_MODEL.json");
const mdp = readJson("MILESTONE_DELIVERY_PROGRESS_MODEL.json");
const authority = read("00_SHARED_SHOWDOWN_DUAL_FULL_SCREEN_RULE.md");
const presentation = read("js/productionSharedShowdownPresentation.js");

assert.equal(contract.contractId, "SSJR-DUAL-FULL-SCREEN-1");
assert.equal(contract.permanentRules.exactlyTwoManagers, true);
assert.equal(contract.permanentRules.bothManagersMustRenderEveryCanonicalGameplayScreen, true);
assert.equal(contract.permanentRules.roleSpecificActionsMayDiffer, true);
assert.equal(contract.permanentRules.roleSpecificScreenSkippingForbidden, true);
assert.equal(contract.permanentRules.lateOrReloadedPeerMustReplayMissedCanonicalScreensInOrder, true);
assert.equal(contract.permanentRules.canonicalGameplayScreenAdditionsInheritThisRuleAutomatically, true);
assert.equal(contract.permanentRules.pairingAndExactActiveStillPrecedeLeagueOrClubAuthority, true);
assert.equal(contract.implementationGate.appliesToAllCurrentAndFutureSharedJourneyGameplayScreens, true);
assert.match(contract.implementationGate.mdpRule, /cannot complete MDP implementation[\s\S]+both/i);
assert.match(contract.implementationGate.ssjrRule, /does not change SSJR weights or grant SSJR credit/i);

const capabilityIds = ssjr.domains.flatMap(domain => domain.capabilities.map(capability => capability.id));
const mappedIds = new Set(contract.canonicalJourneyStages.flatMap(stage => stage.capabilityIds));
assert.deepEqual([...mappedIds].sort(), [...capabilityIds].sort(), "Every fixed SSJR-1.1 capability must be covered by the dual-full-screen journey contract.");
assert.equal(contract.canonicalJourneyStages.length, 20, "The current canonical journey map should explicitly cover all 20 stage/capability groupings.");

for (const stage of contract.canonicalJourneyStages) {
  assert.ok(stage.id && stage.screenRequirement && stage.currentEngineeringStatus, "Every canonical stage needs an explicit screen requirement and engineering status.");
  assert.ok(stage.capabilityIds.length > 0, `${stage.id} must bind to at least one SSJR capability.`);
}

for (const requiredStage of ["league-wheel", "club-packs", "season-length", "setup-confirmation", "career-start", "transfer-challenge", "results-publication", "season-commit-review", "canonical-score-result", "history-records-trophies", "next-season-transition", "local-reconciliation", "final-reconciliation", "terminal-close"]) {
  assert.ok(contract.canonicalJourneyStages.some(stage => stage.id === requiredStage), `Missing canonical gameplay stage ${requiredStage}.`);
}

assert.match(authority, /Both private managers must individually experience every canonical gameplay screen/i);
assert.match(authority, /Different controls are allowed\. Skipping the gameplay screen for one role is not allowed/i);
assert.match(authority, /late, reloaded or temporarily offline[\s\S]+replay or render every missed canonical gameplay screen in order/i);
assert.match(authority, /toast, badge, status line, background refresh, summary label[\s\S]+not equivalent/i);
assert.match(authority, /does not itself award MDP points/i);
assert.match(authority, /does not change the frozen SSJR-1\.1 denominator/i);

assert.match(mdp.crossCuttingFeatureExitRules.dualFullScreenExperience, /SSJR-DUAL-FULL-SCREEN-1/);
assert.match(mdp.crossCuttingFeatureExitRules.dualFullScreenExperience, /both managers/i);

assert.match(presentation, /bothManagerRolesWitnessLeagueWheel:true/);
assert.match(presentation, /bothManagerRolesWitnessClubPacks:true/);
assert.match(presentation, /witnessedLeagueId!==state\.setup\.leagueId/);
assert.match(presentation, /clubRevealComplete/);
assert.match(presentation, /SEASON_PANEL_ID="sharedShowdownSeasonChoice"/);
assert.match(presentation, /confirmedRoles\.includes\(state\.managerRole\)/);
assert.match(presentation, /ssjpForceScreen\("leagueWheelScreen"\)/);
assert.match(presentation, /ssjpForceScreen\("clubWheelScreen"\)/);

process.stdout.write("PASS SSJR dual-full-screen contract: both managers individually traverse every canonical gameplay screen, role authority may differ, late peers replay missed screens, and MDP/SSJR remain separately governed.\n");
