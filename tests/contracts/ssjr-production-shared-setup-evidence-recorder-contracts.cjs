const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const recorder = process.env.RECORDER_PATH || path.resolve('scripts/record-ssjr-shared-setup-production-evidence.mjs');
const validator = process.env.VALIDATOR_PATH || path.resolve('scripts/validate-ssjr-shared-setup-production-evidence.mjs');
const canonicalKeys = ['careerModeShowdown.saveLibrary','careerModeShowdown.legacyShowdowns','careerModeShowdown.preferences'];
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
function hash(value){return `sha256:${crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(stable(value))).digest('hex')}`;}
function observation(managerRole, remoteRole, suffix){
  const storage=Object.fromEntries(canonicalKeys.map(key=>[key, key.endsWith('preferences')?{music:true}:[]]));
  const seed={leagueId:'premier_league',phase:'SHARED_SETUP_OPEN',revision:1};
  return {
    schemaVersion:1,capturedAt:'2026-09-06T15:30:00Z',runtimeRevision:'1.9.1-r3',managerRole,remoteRole,
    privateIdentifiers:{account:`account-${suffix}`,device:`device-${suffix}`,rivalry:'rivalry-shared',initialSession:'session-initial',freshSession:'session-fresh'},
    canonicalStorageBefore:storage,canonicalStorageAfter:structuredClone(storage),
    pairedActiveBeforeSetup:{at:'2026-09-06T15:30:01Z',paired:true,sessionState:'active',setupMutationSeen:false},
    authoritativeSetupObserved:{at:'2026-09-06T15:30:02Z',revision:1,setup:seed},
    identicalFinalSetup:{at:'2026-09-06T15:30:03Z'},reloadResume:{at:'2026-09-06T15:30:04Z',resetOrRedraw:false},freshActiveSessionResume:{at:'2026-09-06T15:30:05Z',resetOrRedraw:false},
    negatives:{wrongSession:'denied',expiredSession:'denied',unrelatedAccount:'denied',revokedIdentity:'denied',staleRevision:'denied',replayConflict:'denied',directFieldSubstitution:'denied',coordinatorBypass:'denied'},
    finalSetup:{leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},clubLeagueIds:{playerOne:'premier_league',playerTwo:'premier_league'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],phase:'SHOWDOWN_CONFIRMED',revision:6}
  };
}
function record(input){return spawnSync(process.execPath,[recorder],{input:JSON.stringify(input),encoding:'utf8'});}
const rawOne=observation('playerOne','host','one');
const rawTwo=observation('playerTwo','peer','two');
const one=record(rawOne);const two=record(rawTwo);
assert.equal(one.status,0,one.stderr);assert.equal(two.status,0,two.stderr);
const a=JSON.parse(one.stdout),b=JSON.parse(two.stdout);
for(const raw of ['account-one','account-two','device-one','device-two','rivalry-shared','session-initial','session-fresh']){
  assert.equal(one.stdout.includes(raw),false,`raw private value leaked: ${raw}`);
  assert.equal(two.stdout.includes(raw),false,`raw private value leaked: ${raw}`);
}
assert.equal(a.accountFingerprint,hash('account-one'));
assert.equal(b.accountFingerprint,hash('account-two'));
assert.equal(a.rivalryFingerprint,b.rivalryFingerprint);
assert.equal(a.checkpoints[0].sessionFingerprint,b.checkpoints[0].sessionFingerprint);
assert.equal(a.checkpoints[4].sessionFingerprint,b.checkpoints[4].sessionFingerprint);
assert.notEqual(a.checkpoints[0].sessionFingerprint,a.checkpoints[4].sessionFingerprint);
assert.equal(a.canonicalStorageBeforeHash,a.canonicalStorageAfterHash);
assert.equal(a.finalSetup.digest,b.finalSetup.digest);
assert.deepEqual(Object.keys(a.negatives).sort(),Object.keys(rawOne.negatives).sort());

if (process.env.SKIP_PAIR_VALIDATOR !== '1') {
  const fs=require('node:fs'),os=require('node:os');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ssjr-recorder-'));
  const onePath=path.join(dir,'one.json'),twoPath=path.join(dir,'two.json');
  fs.writeFileSync(onePath,one.stdout);fs.writeFileSync(twoPath,two.stdout);
  const validated=spawnSync(process.execPath,[validator,onePath,twoPath],{encoding:'utf8'});
  fs.rmSync(dir,{recursive:true,force:true});
  assert.equal(validated.status,0,validated.stderr);
  const summary=JSON.parse(validated.stdout);assert.equal(summary.ok,true);assert.equal(summary.finalRevision,6);assert.equal(summary.negativesProvenPerManager,8);
}

const sameSession=structuredClone(rawOne);sameSession.privateIdentifiers.freshSession=sameSession.privateIdentifiers.initialSession;
let bad=record(sameSession);assert.notEqual(bad.status,0);assert.match(bad.stderr,/different raw session identity/i);
const badNegative=structuredClone(rawOne);badNegative.negatives.wrongSession='allowed';
bad=record(badNegative);assert.notEqual(bad.status,0);assert.match(bad.stderr,/wrongSession must be denied/i);
const extra=structuredClone(rawOne);extra.privateIdentifiers.capability='pair_secret';
bad=record(extra);assert.notEqual(bad.status,0);assert.match(bad.stderr,/unknown field capability/i);
console.log('PASS SSJR production Shared Setup evidence recorder contracts: stdin-only raw authority is sanitized, closed-schema output is deterministic, and validator-compatible pair evidence is produced.');
