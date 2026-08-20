const assert=require("node:assert/strict");
const fs=require("node:fs");
const policy=fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md","utf8");
const next=fs.readFileSync("NEXT_TASK.md","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));

for(const term of ["accountId","profileId","saveId","seasonId","deviceId","installationId","baseRevision","tombstone","idempotency"]){
  assert.ok(policy.includes(term),`Phase 1C lost required identity/sync term: ${term}`);
}
for(const heading of [
  "Account principal metadata",
  "Account-to-profile authorization linkage",
  "Connected rivalry / shared Save authority",
  "Registered device metadata",
  "Private pairing / invite records",
  "Private session membership / authorization",
  "Mutation idempotency / replay metadata",
  "Tombstones / deletion authority",
  "Minimal security/audit metadata"
])assert.ok(policy.includes(heading),`Missing remote data class: ${heading}`);

assert.match(policy,/Candidate A export files[\s\S]+Candidate B analysis[\s\S]+Candidate C raw restore snapshots/i,"Local recovery material must remain local-only by default.");
assert.match(policy,/unshared Save Library Saves/i,"Unshared Saves must remain local-only by default.");
assert.match(policy,/Remote Joining does not authorize automatic upload of every local Save/i,"Remote Joining must not silently become full cloud backup.");
assert.match(policy,/Optional Private Cloud Backup remains a separate future opt-in product/i,"Cloud Backup must remain separate and opt-in.");
assert.match(policy,/Public community|public community/i);
assert.match(policy,/global leaderboards or global rankings/i);
assert.match(policy,/public matchmaking/i);
assert.match(policy,/No public lobby or discoverability index is allowed/i);

assert.match(policy,/Tombstones[\s\S]+lifetime of the owning account\/connected namespace/i,"Tombstone metadata must remain strong enough for long-offline anti-resurrection.");
assert.match(policy,/Tombstones must not retain deleted gameplay content/i,"Tombstones must not become deleted-content backups.");
assert.match(policy,/Pairing \/ invite records[\s\S]+no more than 7 days/i,"Expired pairing metadata must have bounded retention.");
assert.match(policy,/Idempotency metadata[\s\S]+7 days by default/i,"Idempotency metadata must have bounded retention.");
assert.match(policy,/Security\/audit metadata[\s\S]+30 days by default/i,"App security/audit metadata must have bounded retention.");
assert.match(policy,/account-deletion request must immediately revoke normal remote access and new mutation authority/i,"Account deletion must revoke connected authority immediately.");
assert.match(policy,/shared two-owner rivalry when only one account requests deletion[\s\S]+Phase 1D/i,"Shared-object deletion ambiguity must be explicitly deferred to the exact schema/authorization phase.");

for(const forbidden of ["passwords","raw authentication tokens","raw invite secrets","full Save payloads"]){
  assert.match(policy,new RegExp(`Do not log[\\s\\S]+${forbidden}`,"i"),`Policy must prohibit logging ${forbidden}.`);
}
assert.match(policy,/detailed browsing history, unrelated device telemetry, exact location/i,"Device metadata must remain minimized.");
assert.match(policy,/Do not use timestamps as conflict authority/i);
assert.match(policy,/No Firebase\/Firestore region is selected in Phase 1C/i);
assert.match(policy,/local-only use must remain available/i);
assert.match(policy,/Candidate A export, Candidate B analysis, Candidate C recovery and formatVersion 2 portability must remain available/i);
assert.match(policy,/no remote module may bypass local transaction authority/i);

assert.equal(pkg.version,"1.4.0","Phase 1C remains architecture/privacy policy and must not independently change the application semantic version.");
const runtimeRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
assert.match(runtimeRevision,/^1\.4\.0-r[1-9]\d*$/,"Current runtime identity must remain release-owned within v1.4.0; the historical Phase 1C policy must not freeze later legitimate runtime revisions.");
assert.doesNotMatch(index,/firebase|firestore/i,"Phase 1C must not itself add a direct Firebase/Firestore production-shell dependency; later controlled runtime integration remains lazy behind app.js.");
assert.doesNotMatch(optional,/firebase|firestore/i,"Phase 1C must not connect Firebase through optional modules.");
assert.doesNotMatch(policy,/Firebase SDK installation:\s*AUTHORIZED|Firestore collection\/schema creation:\s*AUTHORIZED/i);
assert.match(next,/Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Historical Phase 1C authorization provenance must remain recorded without overriding later explicit runtime authority.");

process.stdout.write("PASS Phase 1C remote data inventory, privacy, retention, anti-resurrection, deletion and local-only boundaries\n");