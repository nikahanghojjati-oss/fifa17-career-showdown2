const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const readJson = file => JSON.parse(read(file));

const rootConfig = readJson("firebase.json");
const rootRc = readJson(".firebaserc");
const productionConfig = readJson("firebase.production.rules.json");
const productionEnvironment = readJson("firebase.production.environment.json");
const deploymentGuide = read("PRODUCTION_FIRESTORE_RULES_DEPLOYMENT.md");
const strengthenedRules = read("firestore.spark.rules");

assert.equal(
  rootConfig.firestore.rules,
  "firestore.rules",
  "The historical Phase 1F/emulator firebase.json lane must remain on firestore.rules."
);
assert.equal(
  rootRc.projects.default,
  "fifa17-career-showdown-demo",
  "The root Firebase default must remain the demo project."
);

assert.deepEqual(
  Object.keys(productionConfig).sort(),
  ["$schema", "firestore"],
  "The production Rules config must expose only schema metadata and Firestore."
);
assert.equal(
  Array.isArray(productionConfig.firestore),
  false,
  "The bounded production Rules config must remain the single default-database shape."
);
assert.deepEqual(
  Object.keys(productionConfig.firestore).sort(),
  ["rules"],
  "The bounded production Rules config must not co-deploy indexes or another Firestore resource."
);
assert.equal(
  productionConfig.firestore.rules,
  "firestore.spark.rules",
  "The production-only config must target the strengthened Rules candidate."
);

assert.equal(productionEnvironment.environment, "production");
assert.equal(productionEnvironment.projectId, "fifa17-career-showdown-prod");
assert.equal(productionEnvironment.firestore.databaseId, "(default)");
assert.equal(
  productionEnvironment.activation.productionSecurityRulesSource,
  "firestore.rules",
  "The historical provider-verified manifest must not silently claim firestore.spark.rules is deployed before new provider proof."
);
assert.match(
  productionEnvironment.activation.productionSecurityRulesVerificationEvidence,
  /Firebase Console/i,
  "The existing provider-verified Rules claim must retain its direct-provider evidence provenance."
);

assert.match(strengthenedRules, /function isSignedIn\(\)/);
assert.match(strengthenedRules, /function hasRegisteredActiveDevice\(\)/);
assert.match(strengthenedRules, /function isRivalryParticipant/);
assert.match(strengthenedRules, /allow read: if isRivalryParticipant/);
assert.match(strengthenedRules, /allow write: if false/);

const exactDeployCommand = "firebase deploy --config firebase.production.rules.json --project fifa17-career-showdown-prod --only firestore";
assert.ok(
  deploymentGuide.includes(exactDeployCommand),
  "The guide must expose one explicit production-project deployment command using the isolated config."
);
assert.match(deploymentGuide, /production publication remains `UNVERIFIED`/i);
assert.match(deploymentGuide, /successful CLI exit is necessary but not sufficient for RJR credit/i);
assert.match(deploymentGuide, /do not rewrite `firebase\.production\.environment\.json` to claim the strengthened source is deployed/i);
assert.match(deploymentGuide, /root `firebase\.json` continues to reference `firestore\.rules`/i);
assert.match(deploymentGuide, /root `\.firebaserc` continues to default only to `fifa17-career-showdown-demo`/i);
assert.match(deploymentGuide, /App Check enforcement remains OFF/i);
assert.match(deploymentGuide, /Spark \/ zero billing/i);
assert.match(deploymentGuide, /pair_a07108\.\.\.756fb/);

for(const forbidden of [
  "--force",
  "service-account",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "firebase use fifa17-career-showdown-prod"
]){
  assert.equal(
    exactDeployCommand.includes(forbidden),
    false,
    `The exact bounded deploy command must not depend on ${forbidden}.`
  );
}

process.stdout.write("PASS production Firestore Rules deployment path contracts: the demo/emulator lane stays isolated, strengthened Rules target production explicitly, no indexes or unrelated Firebase services co-deploy, and provider publication remains unclaimed until direct evidence exists.\n");
