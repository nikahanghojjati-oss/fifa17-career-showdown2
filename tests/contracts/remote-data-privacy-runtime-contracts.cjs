const assert = require("node:assert/strict");
const fs = require("node:fs");

const policy = fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md", "utf8");
const next = fs.readFileSync("NEXT_TASK.md", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const bootstrap = JSON.parse(fs.readFileSync("SESSION_BOOTSTRAP.json", "utf8"));
const readiness = JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json", "utf8"));

for (const term of ["accountId","profileId","saveId","seasonId","deviceId","installationId","baseRevision","tombstone","idempotency"]) {
  assert.ok(policy.includes(term), `Privacy authority lost required identity/sync term: ${term}`);
}
for (const heading of [
  "Account principal metadata",
  "Account-to-profile authorization linkage",
  "Connected rivalry / shared Save authority",
  "Registered device metadata",
  "Private pairing / invite records",
  "Private session membership / authorization",
  "Mutation idempotency / replay metadata",
  "Tombstones / deletion authority",
  "Minimal security/audit metadata"
]) {
  assert.ok(policy.includes(heading), `Missing active remote data class: ${heading}`);
}

assert.match(policy, /Candidate A export files[\s\S]+Candidate B analysis[\s\S]+Candidate C raw restore snapshots/i);
assert.match(policy, /unshared Save Library Saves/i);
assert.match(policy, /Remote Joining does not authorize automatic upload of every local Save/i);
assert.match(policy, /Optional Private Cloud Backup remains a separate future opt-in product/i);
assert.match(policy, /No public lobby or discoverability index is allowed/i);
assert.match(policy, /public matchmaking/i);
assert.match(policy, /global leaderboards or global rankings/i);
assert.match(policy, /Tombstones[\s\S]+lifetime of the owning account\/connected namespace/i);
assert.match(policy, /Tombstones must not retain deleted gameplay content/i);
assert.match(policy, /Pairing \/ invite records[\s\S]+no more than 7 days/i);
assert.match(policy, /Idempotency metadata[\s\S]+7 days by default/i);
assert.match(policy, /Security\/audit metadata[\s\S]+30 days by default/i);
assert.match(policy, /account-deletion request must immediately revoke normal remote access and new mutation authority/i);
for (const forbidden of ["passwords","raw authentication tokens","raw invite secrets","full Save payloads"]) {
  assert.match(policy, new RegExp(`Do not log[\\s\\S]+${forbidden}`, "i"));
}
assert.match(policy, /detailed browsing history, unrelated device telemetry, exact location/i);
assert.match(policy, /Do not use timestamps as conflict authority/i);
assert.match(policy, /local-only use must remain available/i);
assert.match(policy, /Candidate A export, Candidate B analysis, Candidate C recovery and formatVersion 2 portability must remain available/i);
assert.match(policy, /no remote module may bypass local transaction authority/i);

const runtimeRevision = (index.match(/app-asset-revision"\s+content="([^"]+)/) || [])[1];
const runtimeVersion = (runtimeRevision?.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/) || [])[1];
assert.equal(runtimeVersion, pkg.version, "Runtime revision must remain coherent with package version.");

assert.equal(bootstrap.liveRuntime?.billingRequired, false, "Current runtime must remain zero billing.");
assert.equal(bootstrap.liveRuntime?.firebasePlan, "Spark", "Current runtime must remain on Firebase Spark.");
assert.equal(bootstrap.liveRuntime?.appCheckEnforcement, false, "App Check enforcement must remain OFF.");
assert.equal(bootstrap.liveRuntime?.firestorePersistence, "memory-only", "Firestore persistence must remain memory-only.");
assert.equal(
  bootstrap.liveRuntime?.googleAuthPersistence,
  "browserSessionPersistence-popup-only-no-extra-scopes",
  "Google Auth must remain popup-only browserSessionPersistence with no extra scopes."
);

assert.equal(readiness.modelVersion, "RJR-1");
assert.equal(readiness.denominator, 100);
assert.equal(readiness.currentScore, 100);
assert.equal(
  readiness.domains.reduce((total, domain) => total + domain.earned, 0),
  readiness.currentScore,
  "Frozen RJR completion must remain backed by its actual capability-domain evidence."
);

assert.match(next, /Billing must never be activated[\s\S]+Firebase remains Spark/i);
assert.match(next, /Firestore browser persistence remains memory-only/i);
assert.match(next, /Google Auth remains popup-only `browserSessionPersistence` with no extra scopes/i);
assert.match(next, /App Check enforcement remains OFF/i);
assert.match(next, /No public discovery[\s\S]+global leaderboards/i);
assert.match(next, /Never durably retain[\s\S]+private capabilit|Never paste the raw private capability/i);

process.stdout.write(
  "PASS Active remote-data privacy contract: privacy boundaries, retention, local-only safety, zero billing, Spark, auth persistence, App Check state and current RJR completion remain protected without historical wording locks.\n"
);
