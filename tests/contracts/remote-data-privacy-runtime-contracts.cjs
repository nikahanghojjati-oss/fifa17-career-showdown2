const assert = require("node:assert/strict");
const fs = require("node:fs");

const guards = JSON.parse(fs.readFileSync("CURRENT_PRODUCT_GUARDS.json", "utf8"));
const productionEnvironment = JSON.parse(fs.readFileSync("firebase.production.environment.json", "utf8"));
const index = fs.readFileSync("index.html", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

assert.equal(guards.schemaVersion >= 2, true);

const privacy = guards.privacy;
assert.equal(privacy.remoteByNeedOnly, true);
assert.equal(privacy.unsharedSaveLibraryAutoUpload, false);
assert.equal(privacy.localOnlyUseAvailable, true);
assert.equal(privacy.publicDiscovery, false);
assert.equal(privacy.publicListing, false);
assert.equal(privacy.publicLobby, false);
assert.equal(privacy.publicMatchmaking, false);
assert.equal(privacy.community, false);
assert.equal(privacy.rankings, false);
assert.equal(privacy.globalLeaderboards, false);
assert.equal(privacy.durableRawPrivateIdentifiersAllowed, false);
assert.equal(privacy.timestampsAsConflictAuthority, false);
assert.equal(privacy.tombstonesMayRetainDeletedGameplayContent, false);
assert.equal(privacy.accountDeletionImmediateRemoteRevocation, true);
assert.equal(privacy.pairingInviteRetentionMaxDays, 7);
assert.equal(privacy.idempotencyRetentionDefaultDays, 7);
assert.equal(privacy.securityAuditRetentionDefaultDays, 30);
for (const forbidden of [
  "passwords",
  "raw-authentication-tokens",
  "raw-invite-secrets",
  "full-save-payloads",
  "exact-location",
  "unrelated-device-telemetry",
  "detailed-browsing-history"
]) {
  assert.ok(privacy.forbiddenDurableLogs.includes(forbidden), `Missing current privacy log prohibition: ${forbidden}`);
}

const provider = guards.provider;
assert.equal(provider.billingEnabled, false);
assert.equal(provider.firebasePlan, "Spark");
assert.equal(provider.cloudBillingAccountAllowed, false);
assert.equal(provider.blazeAllowed, false);
assert.equal(provider.cloudRunAllowed, false);
assert.equal(provider.cloudFunctionsAllowed, false);
assert.equal(provider.appCheckEnforcement, false);
assert.equal(provider.firestoreBrowserPersistence, "memory-only");
assert.equal(provider.googleAuthPersistence, "browserSessionPersistence-popup-only-no-extra-scopes");

assert.equal(productionEnvironment.projectId, "fifa17-career-showdown-prod");
assert.equal(productionEnvironment.activation?.productionSecurityRulesSource, provider.productionRulesSource);
assert.equal(productionEnvironment.activation?.appCheckEnforcement, provider.appCheckEnforcement);
assert.equal(productionEnvironment.securityLocks?.persistentFirestoreOfflineCache, false);
assert.equal(productionEnvironment.securityLocks?.publicDiscovery, privacy.publicDiscovery);
assert.equal(productionEnvironment.securityLocks?.publicMatchmaking, privacy.publicMatchmaking);
assert.equal(productionEnvironment.securityLocks?.community, privacy.community);
assert.equal(productionEnvironment.securityLocks?.rankings, privacy.rankings);

const runtimeRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const runtimeVersion = (runtimeRevision?.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/) || [])[1];
assert.equal(runtimeVersion, pkg.version, "Runtime revision must remain coherent with package version.");

assert.ok(fs.existsSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md"), "Human-readable privacy architecture record must remain available for reference.");
assert.equal(guards.testing.historicalWordingMayBlock, false);
assert.equal(guards.testing.frozenRjrScoreMayBlockUnrelatedProductWork, false);

process.stdout.write(
  "PASS Active remote-data privacy contract: machine-readable privacy/retention/provider guards and production configuration are protected without NEXT_TASK, handoff or frozen RJR score wording dependencies.\n"
);
