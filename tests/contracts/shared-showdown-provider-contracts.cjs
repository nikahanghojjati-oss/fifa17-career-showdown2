const assert=require("node:assert/strict");
const fs=require("node:fs");
const provider=require("../../js/sparkSharedShowdownSetup.js");

const adapterSource=fs.readFileSync("js/sparkSharedShowdownSetup.js","utf8");
const candidateRules=fs.readFileSync("firestore.shared-setup-candidate.rules","utf8");
const productionRules=fs.readFileSync("firestore.spark.rules","utf8");
const packageJson=JSON.parse(fs.readFileSync("package.json","utf8"));

assert.equal(provider.contractVersion,1);
assert.equal(provider.implementationState,"candidate-spark-exact-path");
assert.equal(provider.productionEnabled,false,"Shared Setup provider must remain candidate-only until publication gates are complete.");
assert.equal(provider.billingRequired,false,"Shared Setup provider must remain Spark-compatible and billing-free.");
assert.equal(provider.canonicalStorageMutation,false,"Remote setup authority must not mutate canonical local saves.");
assert.equal(provider.setupPath,"rivalries/{rivalryId}/sharedSetup/authoritative");
assert.deepEqual(provider.canonicalStorageKeys,[
  "careerModeShowdown.saveLibrary",
  "careerModeShowdown.legacyShowdowns",
  "careerModeShowdown.preferences"
]);

assert.match(adapterSource,/return Object\.freeze\(\{sessionId,data,expiresAt\}\)/,"Provider session validation must retain the exact Firestore session document ID.");
assert.match(adapterSource,/session:\{sessionId:session\.sessionId,rivalryId,state:"active"/,"Provider-neutral authority must receive the exact validated ACTIVE session ID.");
assert.match(adapterSource,/syntheticSession\(rivalryId,rivalry,ledger\.coordinatorRole,ledger\.activeSessionId\)/,"Ledger reconstruction must preserve the last provider-authorized session identity rather than inventing a caller session.");
assert.doesNotMatch(adapterSource,/session\.data\.sessionId\s*\|\|/,"No synthetic zero-session fallback may substitute for exact provider session identity.");
assert.doesNotMatch(adapterSource,/localStorage|sessionStorage/,"Provider adapter must not read or write browser canonical storage.");

for(const required of [
  "exactPairedRivalry(rivalryId)",
  "activeAccount(data.managerSlots[0].accountId)",
  "activeAccount(data.managerSlots[1].accountId)",
  "activeOwnedDevice(root.updatedByDeviceId)",
  "activeSession(rivalryId, root.activeSessionId)",
  "sessionHostIsActor(rivalryId, after.activeSessionId)",
  "match /sharedSetup/authoritative",
  "allow create: if validCreateLedger(rivalryId)",
  "allow update: if validUpdateLedger(rivalryId)"
]) assert.ok(candidateRules.includes(required),`Candidate Shared Setup Rules must enforce: ${required}`);

assert.equal(candidateRules.includes("allow list, delete: if false;"),true,"Shared Setup authority must remain non-listable and non-deletable from modified clients.");
assert.equal(productionRules.includes("sharedSetup"),false,"Candidate Shared Setup Rules must not silently alter production Firestore authority.");

for(const source of ["index.html","js/optionalModules.js","service-worker.js"]){
  assert.equal(fs.readFileSync(source,"utf8").includes("sparkSharedShowdownSetup.js"),false,`${source} must not activate the candidate provider before publication gates.`);
}
assert.ok(packageJson.scripts["test:ssjr"].includes("shared-showdown-provider-contracts.cjs"),"The SSJR contract command must permanently include provider-boundary regression proof.");

process.stdout.write("PASS Shared Showdown Spark provider boundary contracts: exact ACTIVE session identity, exactly-two-manager Rules gates, zero billing, no canonical local mutation, candidate-only production isolation.\n");
