const assert=require("node:assert/strict");
const fs=require("node:fs");
const policy=fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md","utf8");
const next=fs.readFileSync("NEXT_TASK.md","utf8");
const historicalNext=fs.readFileSync("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const providerProof=fs.readFileSync("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const bootstrap=JSON.parse(fs.readFileSync("SESSION_BOOTSTRAP.json","utf8"));
const r5Production=bootstrap.runtime?.productionRuntimeRevision==="1.8.1-r5"&&!bootstrap.runtime?.candidateRuntimeRevision;

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

assert.match(policy,/Status:\s*Cloud\/Sync Readiness Phase 1C architecture authority/i,"Phase 1C must remain explicitly historical architecture authority.");
assert.match(policy,/Runtime status:\s*architecture\/policy only;\s*no Firebase SDK[\s\S]{0,240}is authorized by this document/i,"Phase 1C itself must remain non-runtime and must not independently authorize a product release or provider connection.");
const runtimeRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const runtimeVersion=(runtimeRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current application/runtime release identity must remain coherent while historical Phase 1C stays version-neutral.");
assert.doesNotMatch(index,/firebase|firestore/i,"Phase 1C must not itself add a direct Firebase/Firestore production-shell dependency; later controlled runtime integration remains lazy behind app.js.");
assert.doesNotMatch(optional,/firebase|firestore/i,"Phase 1C must not connect Firebase through optional modules.");
assert.doesNotMatch(policy,/Firebase SDK installation:\s*AUTHORIZED|Firestore collection\/schema creation:\s*AUTHORIZED/i);
assert.match(historicalNext,/Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Historical Phase 1C authorization provenance must remain preserved in the lossless pre-r3 archive without overriding later explicit runtime authority.");
if(r5Production){
  assert.match(next,/Status:[\s\S]+v1\.8\.1 \/ 1\.8\.1-r5[\s\S]+DEPLOYED \/ PRODUCTION-PROVEN[\s\S]+STAGE 5A IS AUTHORIZED NEXT/i,"Current NEXT_TASK must expose promoted r5 production authority and the Stage 5A activation.");
  assert.match(next,/TOKEN-LIFECYCLE SAFETY PRODUCTION-PROVEN|stage4-token-lifecycle-contracts\.cjs/i,"Current NEXT_TASK must preserve deployed App Check token-lifecycle authority after r5 promotion.");
}else{
  assert.match(next,/Status:[\s\S]+production `v1\.8\.1 \/ 1\.8\.1-r4` remains DEPLOYED \/ PRODUCTION-PROVEN[\s\S]+candidate `v1\.8\.1 \/ 1\.8\.1-r5` is EVIDENCE-PROVEN \/ PUBLICATION PENDING[\s\S]+App Check enforcement remains OFF/i,"Current NEXT_TASK must retain deployed r4 Firebase/App Check authority while truthfully exposing the r5 publication candidate.");
}
assert.match(next,/Firebase remains Spark \/ zero billing[\s\S]+Firestore remains memory-only[\s\S]+Google Auth remains popup-only `browserSessionPersistence`/i,"Current NEXT_TASK must preserve the bounded production provider/privacy locks inherited after Phase 1C.");
assert.match(next,/App Check enforcement remains OFF/i,"Current NEXT_TASK must preserve the App Check enforcement-off lock.");
assert.match(next,/Strengthened Rules provider proof[\s\S]+Published production Rules source:[\s\S]+firestore\.spark\.rules/i,"Current NEXT_TASK must preserve direct provider verification of the strengthened Rules without conflating it with repository/emulator evidence.");
assert.match(providerProof,/Status: PROVIDER-VERIFIED DEPLOYED[\s\S]+firestore\.spark\.rules[\s\S]+Today · 7:48 AM/i,"Current privacy authority must retain direct provider provenance for the strengthened Rules publication claim.");

process.stdout.write(`PASS Phase 1C remote data inventory, privacy, retention, anti-resurrection, deletion and local-only boundaries; historical non-runtime provenance is archived while ${r5Production?"production-proven r5 with provider-verified strengthened Rules and Stage 5A activation":"deployed r4 and candidate r5"} authority remains explicit\n`);
