const assert=require("node:assert/strict");
const fs=require("node:fs");
const policy=fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md","utf8");
const next=fs.readFileSync("NEXT_TASK.md","utf8");
const historicalNext=fs.readFileSync("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const providerProof=fs.readFileSync("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md","utf8");
const acceptance=fs.readFileSync("PRODUCTION_R5_ONE_PASTE_AUTOMATIC_CONVERGENCE_ACCEPTANCE_2026-09-03.md","utf8");
const stage5fAcceptance=fs.readFileSync("PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const bootstrap=JSON.parse(fs.readFileSync("SESSION_BOOTSTRAP.json","utf8"));
const readiness=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));
const productionR2=bootstrap.runtime?.productionRuntimeRevision==="1.9.1-r2"&&bootstrap.runtime?.productionStatus==="production-proven";

for(const term of ["accountId","profileId","saveId","seasonId","deviceId","installationId","baseRevision","tombstone","idempotency"]){
  assert.ok(policy.includes(term),`Phase 1C lost required identity/sync term: ${term}`);
}
for(const heading of [
  "Account principal metadata","Account-to-profile authorization linkage","Connected rivalry / shared Save authority","Registered device metadata","Private pairing / invite records","Private session membership / authorization","Mutation idempotency / replay metadata","Tombstones / deletion authority","Minimal security/audit metadata"
])assert.ok(policy.includes(heading),`Missing remote data class: ${heading}`);

assert.match(policy,/Candidate A export files[\s\S]+Candidate B analysis[\s\S]+Candidate C raw restore snapshots/i,"Local recovery material must remain local-only by default.");
assert.match(policy,/unshared Save Library Saves/i,"Unshared Saves must remain local-only by default.");
assert.match(policy,/Remote Joining does not authorize automatic upload of every local Save/i,"Remote Joining must not silently become full cloud backup.");
assert.match(policy,/Optional Private Cloud Backup remains a separate future opt-in product/i,"Cloud Backup must remain separate and opt-in.");
assert.match(policy,/Public community|public community/i);assert.match(policy,/global leaderboards or global rankings/i);assert.match(policy,/public matchmaking/i);assert.match(policy,/No public lobby or discoverability index is allowed/i);

assert.match(policy,/Tombstones[\s\S]+lifetime of the owning account\/connected namespace/i,"Tombstone metadata must remain strong enough for long-offline anti-resurrection.");
assert.match(policy,/Tombstones must not retain deleted gameplay content/i,"Tombstones must not become deleted-content backups.");
assert.match(policy,/Pairing \/ invite records[\s\S]+no more than 7 days/i,"Expired pairing metadata must have bounded retention.");
assert.match(policy,/Idempotency metadata[\s\S]+7 days by default/i,"Idempotency metadata must have bounded retention.");
assert.match(policy,/Security\/audit metadata[\s\S]+30 days by default/i,"App security/audit metadata must have bounded retention.");
assert.match(policy,/account-deletion request must immediately revoke normal remote access and new mutation authority/i,"Account deletion must revoke connected authority immediately.");
assert.match(policy,/shared two-owner rivalry when only one account requests deletion[\s\S]+Phase 1D/i,"Shared-object deletion ambiguity must remain documented in the historical policy lineage.");

for(const forbidden of ["passwords","raw authentication tokens","raw invite secrets","full Save payloads"]){assert.match(policy,new RegExp(`Do not log[\\s\\S]+${forbidden}`,"i"),`Policy must prohibit logging ${forbidden}.`);}
assert.match(policy,/detailed browsing history, unrelated device telemetry, exact location/i,"Device metadata must remain minimized.");
assert.match(policy,/Do not use timestamps as conflict authority/i);assert.match(policy,/No Firebase\/Firestore region is selected in Phase 1C/i);assert.match(policy,/local-only use must remain available/i);assert.match(policy,/Candidate A export, Candidate B analysis, Candidate C recovery and formatVersion 2 portability must remain available/i);assert.match(policy,/no remote module may bypass local transaction authority/i);

// Phase 1C itself remains historical architecture/policy, not a retroactive runtime authorization.
assert.match(policy,/Status:\s*Cloud\/Sync Readiness Phase 1C architecture authority/i);
assert.match(policy,/Runtime status:\s*architecture\/policy only;\s*no Firebase SDK[\s\S]{0,240}is authorized by this document/i);
const runtimeRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const runtimeVersion=(runtimeRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version,"Current application/runtime release identity must remain coherent while historical Phase 1C stays version-neutral.");
assert.doesNotMatch(index,/firebase|firestore/i,"Firebase/Firestore production integration must remain lazy rather than hardwired into the static shell markup.");
assert.doesNotMatch(optional,/firebase|firestore/i,"Historical optional-module boundary must not become an implicit Firebase connector.");
assert.doesNotMatch(policy,/Firebase SDK installation:\s*AUTHORIZED|Firestore collection\/schema creation:\s*AUTHORIZED/i);
assert.match(historicalNext,/Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i,"Historical Phase 1C authorization provenance must remain preserved without overriding later explicit runtime authority.");

// Current privacy authority follows production-proven PR194/r2 while PR187/r5 remains immutable consumed provenance.
assert.equal(productionR2,true,"Current privacy authority must identify production-proven v1.9.1-r2.");
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,194);
assert.equal(bootstrap.lastProductionProvenRuntime?.runtimeRevision,"1.9.1-r2");
assert.equal(bootstrap.lastProductionProvenRuntime?.mergeSha,"11bb681527a9b78884baf0c384350c90493dc9bd");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.pullRequest,187);
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.runtimeRevision,"1.9.0-r5");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.rjrAfterEvidence,89);
assert.equal(bootstrap.previousProductionProvenRuntime?.runtimeRevision,"1.9.1-r1");
assert.equal(bootstrap.remoteJoiningReadiness?.score,91,"Current bootstrap must expose fixed RJR91 at the physical-acceptance boundary.");
assert.equal(readiness.currentScore,91);assert.equal(readiness.modelVersion,"RJR-1");
assert.match(acceptance,/PASS \/ OWNER PRODUCTION ACCEPTANCE/i);assert.match(acceptance,/zero manual Verify\/Reattach/i);assert.doesNotMatch(acceptance,/pair_[0-9a-f]{32,}/i,"Durable production evidence must not retain a full private pairing capability.");
assert.match(stage5fAcceptance,/PASS/i);assert.match(stage5fAcceptance,/revoked-device/i);assert.match(stage5fAcceptance,/third-account|third account/i);assert.match(stage5fAcceptance,/91\/100/i);assert.doesNotMatch(stage5fAcceptance,/pair_[0-9a-f]{32,}/i,"Stage 5F evidence must preserve capability-secret minimization.");

assert.match(next,/CURRENT OVERRIDE[\s\S]+PR #194[\s\S]+1\.9\.1-r2[\s\S]+RJR91[\s\S]+PHYSICAL ACCEPTANCE/i,"Current NEXT_TASK must expose PR194/r2 production / RJR91 / physical acceptance authority.");
assert.match(next,/genuine production Remote Joining acceptance[\s\S]+two physical devices[\s\S]+two independent networks/i,"Current NEXT_TASK must route to genuine physical network proof rather than re-credit browser automation.");
assert.match(next,/PR\/CI\/review\/merge\/deployment\/docs\/WEC\/SLE\/SNS[\s\S]+zero credit/i,"Current NEXT_TASK must preserve evidence-only RJR movement.");
assert.match(next,/Billing must never be activated[\s\S]+Firebase remains Spark/i,"Current NEXT_TASK must preserve zero-billing provider/privacy locks.");
assert.match(next,/Firestore browser persistence remains memory-only/i,"Current NEXT_TASK must preserve memory-only Firestore.");
assert.match(next,/Google Auth remains popup-only `browserSessionPersistence` with no extra scopes/i,"Current NEXT_TASK must preserve popup-only browser-session Auth.");
assert.match(next,/App Check enforcement remains OFF/i,"Current NEXT_TASK must preserve the App Check enforcement-off lock.");
assert.match(next,/No public discovery[\s\S]+global leaderboards/i,"Current NEXT_TASK must preserve private-only product scope.");
assert.match(next,/Never durably retain a full private pairing\/session capability|Never paste the raw private capability/i,"Current NEXT_TASK must preserve capability-secret minimization.");
assert.match(providerProof,/Status: PROVIDER-VERIFIED DEPLOYED[\s\S]+firestore\.spark\.rules[\s\S]+Today · 7:48 AM/i,"Privacy authority must retain direct provider provenance for strengthened Rules publication.");

process.stdout.write("PASS Phase 1C remote data inventory, privacy, retention, anti-resurrection, deletion and local-only boundaries; historical non-runtime provenance remains archived while production-proven PR194/r2, immutable PR187/r5 evidence, live RJR91 and capability-secret minimization are explicit.\n");