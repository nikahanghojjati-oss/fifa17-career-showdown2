const assert=require("node:assert/strict");
const fs=require("node:fs");
const policy=fs.readFileSync("REMOTE_DATA_PRIVACY_RETENTION_POLICY.md","utf8");
const next=fs.readFileSync("NEXT_TASK.md","utf8");
const historicalNext=fs.readFileSync("authority-history/NEXT_TASK_PRE_R3_CONNECTED_ACCOUNT_REGRESSION_2026-08-25.md","utf8");
const providerProof=fs.readFileSync("PRODUCTION_FIRESTORE_RULES_PROVIDER_PROOF_2026-08-29.md","utf8");
const acceptance=fs.readFileSync("PRODUCTION_R5_ONE_PASTE_AUTOMATIC_CONVERGENCE_ACCEPTANCE_2026-09-03.md","utf8");
const stage5fAcceptance=fs.readFileSync("PRODUCTION_STAGE5F_AUTHENTICATED_NEGATIVES_ACCEPTANCE_2026-09-04.md","utf8");
const finalRjrAcceptance=fs.readFileSync("FINAL_RJR100_REMOTE_JOINING_ACCEPTANCE_2026-09-05.md","utf8");
const index=fs.readFileSync("index.html","utf8");
const optional=fs.readFileSync("js/optionalModules.js","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const bootstrap=JSON.parse(fs.readFileSync("SESSION_BOOTSTRAP.json","utf8"));
const readiness=JSON.parse(fs.readFileSync("REMOTE_JOINING_READINESS.json","utf8"));
const productionR3=bootstrap.runtime?.productionRuntimeRevision==="1.9.1-r3"&&bootstrap.runtime?.productionStatus==="production-proven";

for(const term of ["accountId","profileId","saveId","seasonId","deviceId","installationId","baseRevision","tombstone","idempotency"]){assert.ok(policy.includes(term),`Phase 1C lost required identity/sync term: ${term}`);}
for(const heading of ["Account principal metadata","Account-to-profile authorization linkage","Connected rivalry / shared Save authority","Registered device metadata","Private pairing / invite records","Private session membership / authorization","Mutation idempotency / replay metadata","Tombstones / deletion authority","Minimal security/audit metadata"])assert.ok(policy.includes(heading),`Missing remote data class: ${heading}`);

assert.match(policy,/Candidate A export files[\s\S]+Candidate B analysis[\s\S]+Candidate C raw restore snapshots/i);
assert.match(policy,/unshared Save Library Saves/i);
assert.match(policy,/Remote Joining does not authorize automatic upload of every local Save/i);
assert.match(policy,/Optional Private Cloud Backup remains a separate future opt-in product/i);
assert.match(policy,/Public community|public community/i);assert.match(policy,/global leaderboards or global rankings/i);assert.match(policy,/public matchmaking/i);assert.match(policy,/No public lobby or discoverability index is allowed/i);
assert.match(policy,/Tombstones[\s\S]+lifetime of the owning account\/connected namespace/i);assert.match(policy,/Tombstones must not retain deleted gameplay content/i);assert.match(policy,/Pairing \/ invite records[\s\S]+no more than 7 days/i);assert.match(policy,/Idempotency metadata[\s\S]+7 days by default/i);assert.match(policy,/Security\/audit metadata[\s\S]+30 days by default/i);assert.match(policy,/account-deletion request must immediately revoke normal remote access and new mutation authority/i);assert.match(policy,/shared two-owner rivalry when only one account requests deletion[\s\S]+Phase 1D/i);
for(const forbidden of ["passwords","raw authentication tokens","raw invite secrets","full Save payloads"]){assert.match(policy,new RegExp(`Do not log[\\s\\S]+${forbidden}`,"i"));}
assert.match(policy,/detailed browsing history, unrelated device telemetry, exact location/i);assert.match(policy,/Do not use timestamps as conflict authority/i);assert.match(policy,/No Firebase\/Firestore region is selected in Phase 1C/i);assert.match(policy,/local-only use must remain available/i);assert.match(policy,/Candidate A export, Candidate B analysis, Candidate C recovery and formatVersion 2 portability must remain available/i);assert.match(policy,/no remote module may bypass local transaction authority/i);

assert.match(policy,/Status:\s*Cloud\/Sync Readiness Phase 1C architecture authority/i);
assert.match(policy,/Runtime status:\s*architecture\/policy only;\s*no Firebase SDK[\s\S]{0,240}is authorized by this document/i);
const runtimeRevision=(index.match(/app-asset-revision"\s+content="([^"]+)/)||[])[1];
const runtimeVersion=(runtimeRevision.match(/^(\d+\.\d+\.\d+)-r[1-9]\d*$/)||[])[1];
assert.equal(runtimeVersion,pkg.version);
assert.doesNotMatch(index,/firebase|firestore/i);assert.doesNotMatch(optional,/firebase|firestore/i);assert.doesNotMatch(policy,/Firebase SDK installation:\s*AUTHORIZED|Firestore collection\/schema creation:\s*AUTHORIZED/i);assert.match(historicalNext,/Cloud\/sync runtime remains NOT YET IMPLEMENTATION-AUTHORIZED/i);

// Current privacy authority follows production-proven PR203/r3. PR194/r2 is rollback provenance; PR187/r5 and Stage 5F remain immutable consumed provenance.
assert.equal(productionR3,true,"Current privacy authority must identify production-proven v1.9.1-r3.");
assert.equal(bootstrap.lastProductionProvenRuntime?.pullRequest,203);
assert.equal(bootstrap.lastProductionProvenRuntime?.runtimeRevision,"1.9.1-r3");
assert.equal(bootstrap.lastProductionProvenRuntime?.mergeSha,"65d88b1b413501b328bdf722bc6e8a0aa0d46ef2");
assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.pullRequest,187);assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.runtimeRevision,"1.9.0-r5");assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.mergeSha,"277f1b55dc362ee84d285445b99172b9fbed8509");assert.equal(bootstrap.historicalPr187PublicationCheckpoint?.rjrAfterEvidence,89);
assert.equal(bootstrap.previousProductionProvenRuntime?.runtimeRevision,"1.9.1-r2");
assert.equal(bootstrap.remoteJoiningReadiness?.score,100);assert.equal(bootstrap.remoteJoiningReadiness?.remaining,0);assert.equal(readiness.currentScore,100);assert.equal(readiness.modelVersion,"RJR-1");
assert.match(acceptance,/PASS \/ OWNER PRODUCTION ACCEPTANCE/i);assert.match(acceptance,/zero manual Verify\/Reattach/i);assert.doesNotMatch(acceptance,/pair_[0-9a-f]{32,}/i);
assert.match(stage5fAcceptance,/PASS/i);assert.match(stage5fAcceptance,/revoked-device/i);assert.match(stage5fAcceptance,/third-account|third account/i);assert.match(stage5fAcceptance,/91\/100/i);assert.doesNotMatch(stage5fAcceptance,/pair_[0-9a-f]{32,}/i);
const physicalAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-physical-two-device-two-network-acceptance");
const stableReleaseAcceptance=readiness.evidenceHistory?.find(entry=>entry.eventId==="production-rjr-final-stable-release-acceptance");
assert.equal(physicalAcceptance?.score,99);assert.equal(physicalAcceptance?.delta,8);assert.equal(stableReleaseAcceptance?.score,100);assert.equal(stableReleaseAcceptance?.delta,1);assert.equal(readiness.evidenceHistory?.at(-2)?.eventId,physicalAcceptance?.eventId);assert.equal(readiness.evidenceHistory?.at(-1)?.eventId,stableReleaseAcceptance?.eventId);
assert.match(finalRjrAcceptance,/RJR-1 100\/100/i);assert.match(finalRjrAcceptance,/privacy-safe|sanitized/i);assert.doesNotMatch(finalRjrAcceptance,/pair_[0-9a-f]{32,}/i);

assert.match(next,/100\/100|RJR100/i);assert.match(next,/PR #198/i);assert.match(next,/physical proof used a Chromebook[\s\S]+iPhone|Chromebook[\s\S]+cellular/i);assert.match(next,/evidence\/continuity publication only[\s\S]+zero RJR credit|earns zero RJR credit/i);assert.match(next,/Billing must never be activated[\s\S]+Firebase remains Spark/i);assert.match(next,/Firestore browser persistence remains memory-only/i);assert.match(next,/Google Auth remains popup-only `browserSessionPersistence` with no extra scopes/i);assert.match(next,/App Check enforcement remains OFF/i);assert.match(next,/No public discovery[\s\S]+global leaderboards/i);assert.match(next,/Never durably retain[\s\S]+private capabilit|Never paste the raw private capability/i);
assert.match(providerProof,/Status: PROVIDER-VERIFIED DEPLOYED[\s\S]+firestore\.spark\.rules[\s\S]+Today · 7:48 AM/i);

process.stdout.write("PASS Phase 1C remote data inventory, privacy, retention, anti-resurrection, deletion and local-only boundaries; historical non-runtime provenance remains archived while production-proven PR203/r3, r2 rollback, immutable PR187/r5 and Stage5F evidence, live evidence-accepted RJR100 and capability-secret minimization are explicit.\n");