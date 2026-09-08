const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const Negative=require('../../js/ssjrProductionNegativeEvidence.js');

const assembler=path.resolve('scripts/assemble-ssjr-shared-setup-safe-evidence.mjs');
const validator=path.resolve('scripts/validate-ssjr-shared-setup-production-evidence.mjs');
const H=value=>`sha256:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
const D=value=>`sha256:${crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')}`;
const finalCore={leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},clubLeagueIds:{playerOne:'premier_league',playerTwo:'premier_league'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],phase:'SHOWDOWN_CONFIRMED',revision:6};
const finalSetup={...finalCore,digest:D(finalCore)};
const seedDigest=H('shared-seed-rev4');
function positive(managerRole,remoteRole,suffix){return {evidenceType:'SSJR-1.1-production-shared-setup-guided-positive-draft',privacySafe:true,rawAuthorityIncluded:false,canonicalStorageRawIncluded:false,generatedAt:'2026-09-08T20:00:06Z',schemaVersion:1,runtimeRevision:'1.9.1-r6',startedAt:'2026-09-08T20:00:00Z',managerRole,remoteRole,accountFingerprint:H(`account-${suffix}`),deviceFingerprint:H(`device-${suffix}`),rivalryFingerprint:H('shared-rivalry'),canonicalStorageBeforeHash:H('canonical'),canonicalStorageAfterHash:H('canonical'),canonicalStorageViolation:false,pairedActiveBeforeSetup:{at:'2026-09-08T20:00:01Z',paired:true,sessionState:'active',setupMutationSeen:false,sessionFingerprint:H('initial-session')},authoritativeSetupObserved:{at:'2026-09-08T20:00:02Z',revision:4,setupDigest:seedDigest},identicalFinalSetup:{at:'2026-09-08T20:00:03Z',setupDigest:finalSetup.digest},reloadResume:{at:'2026-09-08T20:00:04Z',setupDigest:finalSetup.digest,resetOrRedraw:false},freshActiveSessionResume:{at:'2026-09-08T20:00:05Z',setupDigest:finalSetup.digest,resetOrRedraw:false,sessionFingerprint:H('fresh-session')},finalSetup:structuredClone(finalSetup)};}
const rules={
  wrongSession:['production-shared-setup-wrong-session-probe','SETUP_SESSION_MISMATCH'],
  expiredSession:['production-shared-setup-expired-session-probe','SETUP_ACTIVE_SESSION_REQUIRED'],
  unrelatedAccount:['stage5f-third-account-provider-probe','STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED'],
  revokedIdentity:['stage5f-revoked-device-provider-probe','STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED'],
  staleRevision:['production-shared-setup-stale-revision-probe','SETUP_STALE_BASE_REVISION'],
  replayConflict:['production-shared-setup-replay-conflict-probe','SETUP_IDEMPOTENCY_CONFLICT'],
  directFieldSubstitution:['shared-setup-production-direct-field-probe','SETUP_DRAW_MISMATCH'],
  coordinatorBypass:['shared-setup-production-coordinator-bypass-probe','SETUP_COORDINATOR_REQUIRED']
};
function negatives(p){return {schemaVersion:1,evidenceType:'SSJR-1.1-production-shared-setup-negatives-safe',runtimeRevision:'1.9.1-r6',managerRole:p.managerRole,accountFingerprint:p.accountFingerprint,deviceFingerprint:p.deviceFingerprint,rivalryFingerprint:p.rivalryFingerprint,observations:Object.fromEntries(Object.entries(rules).map(([name,[source,code]])=>[name,{at:'2026-09-08T20:00:02Z',status:'denied',source,code,localStorageUnchanged:true}]))};}
function write(dir,name,value){const file=path.join(dir,name);fs.writeFileSync(file,JSON.stringify(value));return file;}
function assemble(p,n,dir,label){return spawnSync(process.execPath,[assembler,write(dir,`${label}-p.json`,p),write(dir,`${label}-n.json`,n)],{encoding:'utf8'});}

// Browser-side ledger accepts only known proof shapes and persists sanitized metadata.
Negative.clear();
Negative.bindIdentity({managerRole:'playerOne',accountFingerprint:H('account-one'),deviceFingerprint:H('device-one'),rivalryFingerprint:H('shared-rivalry')});
assert.throws(()=>Negative.record('staleRevision',{source:'production-shared-setup-stale-revision-probe',denied:true,code:'SETUP_STALE_BASE_REVISION',localStorageUnchanged:false}),/closed production-denial contract/i);
const revoked={source:'stage5f-revoked-device-provider-probe',denied:true,code:'STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED',localStorageUnchanged:true,applicationAdapterDenied:true,providerMutationDenied:true,sessionUnchangedAfterDeniedMutation:true,cleanupTerminal:true,rawDeviceId:'device_SECRET_SHOULD_NEVER_PERSIST'};
Negative.record('revokedIdentity',revoked);
assert.equal(JSON.stringify(Negative.getState()).includes('SECRET_SHOULD_NEVER_PERSIST'),false);
Negative.clear();

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ssjr-safe-assembly-'));
try{
  const p1=positive('playerOne','host','one'),p2=positive('playerTwo','peer','two');
  const a=assemble(p1,negatives(p1),dir,'one'),b=assemble(p2,negatives(p2),dir,'two');
  assert.equal(a.status,0,a.stderr);assert.equal(b.status,0,b.stderr);
  const outA=JSON.parse(a.stdout),outB=JSON.parse(b.stdout);
  assert.equal(outA.evidenceType,'SSJR-1.1-production-shared-setup');
  assert.deepEqual(Object.values(outA.negatives),Array(8).fill('denied'));
  assert.equal(outA.checkpoints[0].name,'paired-active-before-setup');
  assert.equal(outA.checkpoints[4].name,'fresh-active-session-resume');
  assert.equal(a.stdout.includes('account-one'),false);assert.equal(a.stdout.includes('device-one'),false);assert.equal(a.stdout.includes('shared-rivalry'),false);
  const aPath=write(dir,'assembled-one.json',outA),bPath=write(dir,'assembled-two.json',outB);
  const pair=spawnSync(process.execPath,[validator,aPath,bPath],{encoding:'utf8'});
  assert.equal(pair.status,0,pair.stderr);const summary=JSON.parse(pair.stdout);assert.equal(summary.ok,true);assert.equal(summary.negativesProvenPerManager,8);

  const mismatch=negatives(p1);mismatch.accountFingerprint=H('other-account');let bad=assemble(p1,mismatch,dir,'mismatch');assert.notEqual(bad.status,0);assert.match(bad.stderr,/accountFingerprint differ/i);
  const missing=negatives(p1);delete missing.observations.wrongSession;bad=assemble(p1,missing,dir,'missing');assert.notEqual(bad.status,0);assert.match(bad.stderr,/wrongSession is not a proven denial|unknown field|must be an object/i);
  const raw=negatives(p1);raw.observations.staleRevision.sessionId='session_'+('a'.repeat(64));bad=assemble(p1,raw,dir,'raw');assert.notEqual(bad.status,0);assert.match(bad.stderr,/unknown field sessionId|Forbidden raw authority/i);
  const stale=positive('playerOne','host','one');stale.runtimeRevision='1.9.1-r5';bad=assemble(stale,negatives(p1),dir,'stale');assert.notEqual(bad.status,0);assert.match(bad.stderr,/exact SSJR r6/i);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('PASS SSJR safe evidence assembly contracts: production denial metadata is sanitized, positive fingerprints are bound to the denial bundle, exact r6 is enforced, and validator-ready two-account evidence is assembled without raw authority.');
