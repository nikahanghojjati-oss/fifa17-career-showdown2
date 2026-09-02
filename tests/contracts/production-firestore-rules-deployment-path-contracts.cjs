const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const readJson = file => JSON.parse(read(file));

const rootConfig = readJson("firebase.json");
const rootRc = readJson(".firebaserc");
const productionConfig = readJson("firebase.production.rules.json");
const productionEnvironment = readJson("firebase.production.environment.json");
const deploymentGuide = read("PRODUCTION_FIRESTORE_RULES_DEPLOYMENT.md");
const providerProof = read("STAGE5D_PRODUCTION_RULES_PROVIDER_LIVE_PROOF_2026-09-02.md");
const strengthenedRules = read("firestore.spark.rules");

assert.equal(rootConfig.firestore.rules,"firestore.rules","The historical Phase 1F/emulator firebase.json lane must remain on firestore.rules.");
assert.equal(rootRc.projects.default,"demo-career-mode-showdown-phase1f","The root Firebase default must remain the Phase 1F demo project.");
assert.equal(rootRc.projects.production,"fifa17-career-showdown-prod","The existing named production alias must remain the production project without becoming the root default.");
assert.deepEqual(Object.keys(productionConfig).sort(),["$schema", "firestore"],"The production Rules config must expose only schema metadata and Firestore.");
assert.equal(Array.isArray(productionConfig.firestore),false,"The bounded production Rules config must remain the single default-database shape.");
assert.deepEqual(Object.keys(productionConfig.firestore).sort(),["rules"],"The bounded production Rules config must not co-deploy indexes or another Firestore resource.");
assert.equal(productionConfig.firestore.rules,"firestore.spark.rules","The production-only config must target the strengthened Rules source.");

assert.equal(productionEnvironment.environment,"production");
assert.equal(productionEnvironment.projectId,"fifa17-career-showdown-prod");
assert.equal(productionEnvironment.firestore.databaseId,"(default)");
assert.equal(productionEnvironment.activation.productionSecurityRulesSource,"firestore.spark.rules","After direct provider proof, the production manifest must name the strengthened deployed Rules source.");
assert.equal(productionEnvironment.activation.productionSecurityRulesSourceBlobSha,"363af783d7e5436fdfaa3766d4aa413fc9952a08","The production manifest must retain the exact provider-live Stage 5D Rules blob.");
assert.match(productionEnvironment.activation.productionSecurityRulesVerificationEvidence,/2026-09-02[\s\S]+33575616044[\s\S]+firestore\.spark\.rules[\s\S]+363af783d7e5436fdfaa3766d4aa413fc9952a08/i,"The provider-live Rules claim must retain exact authenticated publication and readback provenance.");
assert.match(providerProof,/Status: VERIFIED PROVIDER-LIVE/i,"The dedicated provider proof must preserve provider-live status.");
assert.match(providerProof,/Firebase project: `fifa17-career-showdown-prod`/i,"The dedicated provider proof must preserve the exact production project.");
assert.match(providerProof,/cloud\.firestore/i,"The dedicated provider proof must preserve the live Firestore release boundary.");
assert.match(providerProof,/33575616044[\s\S]+100078816667/i,"The dedicated provider proof must preserve the exact authenticated publication run and job.");
assert.match(providerProof,/Reviewed repository Rules source: `firestore\.spark\.rules`/i,"The dedicated provider proof must preserve the strengthened Rules source.");
assert.match(providerProof,/363af783d7e5436fdfaa3766d4aa413fc9952a08/i,"The dedicated provider proof must preserve the exact provider-live source blob.");

assert.match(strengthenedRules, /function signedIn\(\)/);
assert.match(strengthenedRules, /function activeDevice\(deviceId\)/);
assert.match(strengthenedRules, /function currentlyEntitled\(rivalryId\)/);
assert.match(strengthenedRules, /function activePairedRivalry\(rivalryId\)/);
assert.match(strengthenedRules, /request\.auth\.uid in rivalry\.data\.data\.authorizedAccountIds/);
assert.match(strengthenedRules, /allow get: if currentlyEntitled\(rivalryId\) \|\| capabilityCanReadPendingRivalry\(rivalryId\)/);
assert.match(strengthenedRules, /allow list, delete: if false;/,"Rivalry enumeration and direct delete must remain denied in the provider-published source.");
assert.match(strengthenedRules, /match \/\{document=\*\*\} \{[\s\S]*allow read, write: if false;/);

const exactDeployCommand = "firebase deploy --config firebase.production.rules.json --project fifa17-career-showdown-prod --only firestore";
assert.ok(deploymentGuide.includes(exactDeployCommand),"The guide must expose one explicit production-project deployment command using the isolated config.");
assert.match(deploymentGuide, /production publication remains `UNVERIFIED`/i);
assert.match(deploymentGuide, /successful CLI exit is necessary but not sufficient for RJR credit/i);
assert.match(deploymentGuide, /do not rewrite `firebase\.production\.environment\.json` to claim the strengthened source is deployed/i);
assert.match(deploymentGuide, /root `firebase\.json` continues to reference `firestore\.rules`/i);
assert.match(deploymentGuide, /root `\.firebaserc` continues to default to `demo-career-mode-showdown-phase1f`/i);
assert.match(deploymentGuide, /App Check enforcement remains OFF/i);
assert.match(deploymentGuide, /Spark \/ zero billing/i);
assert.match(deploymentGuide, /pair_a07108\.\.\.756fb/);

for(const forbidden of ["--force","service-account","GOOGLE_APPLICATION_CREDENTIALS","firebase use fifa17-career-showdown-prod"]){
  assert.equal(exactDeployCommand.includes(forbidden),false,`The exact bounded deploy command must not depend on ${forbidden}.`);
}

process.stdout.write("PASS production Firestore Rules deployment path contracts: the Phase 1F demo/emulator lane stays isolated, the strengthened source is provider-verified in production from direct evidence, no indexes or unrelated Firebase services co-deploy, and the original pre-publication verification discipline remains preserved.\n");