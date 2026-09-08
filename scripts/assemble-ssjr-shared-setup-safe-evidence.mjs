#!/usr/bin/env node
import fs from 'node:fs';

const RUNTIME='1.9.1-r6';
const POSITIVE_TYPE='SSJR-1.1-production-shared-setup-guided-positive-draft';
const NEGATIVE_TYPE='SSJR-1.1-production-shared-setup-negatives-safe';
const OUTPUT_TYPE='SSJR-1.1-production-shared-setup';
const REQUIRED=['wrongSession','expiredSession','unrelatedAccount','revokedIdentity','staleRevision','replayConflict','directFieldSubstitution','coordinatorBypass'];
const HASH=/^sha256:[a-f0-9]{64}$/;
const RAW=/\b(?:pair|session)_[a-f0-9]{64}\b|\bdevice_[a-f0-9]{32}\b|\b(?:profile|save)_[a-f0-9]{24}\b/i;
const FORBIDDEN_KEYS=new Set(['accountid','deviceid','rivalryid','sessionid','capability','capabilitytoken','pairingcode','privateidentifiers']);
const POSITIVE_FIELDS=new Set(['evidenceType','privacySafe','rawAuthorityIncluded','canonicalStorageRawIncluded','generatedAt','schemaVersion','runtimeRevision','startedAt','managerRole','remoteRole','accountFingerprint','deviceFingerprint','rivalryFingerprint','canonicalStorageBeforeHash','canonicalStorageAfterHash','canonicalStorageViolation','pairedActiveBeforeSetup','authoritativeSetupObserved','identicalFinalSetup','reloadResume','freshActiveSessionResume','finalSetup']);
const NEGATIVE_FIELDS=new Set(['schemaVersion','evidenceType','runtimeRevision','managerRole','accountFingerprint','deviceFingerprint','rivalryFingerprint','observations']);
const OBS_FIELDS=new Set(['at','status','source','code','localStorageUnchanged']);

function fail(message){throw new Error(message);}
function plain(value){return !!value&&typeof value==='object'&&!Array.isArray(value);}
function key(value){return String(value||'').replace(/[^a-z0-9]/gi,'').toLowerCase();}
function privacy(value,label='$'){
  if(Array.isArray(value)){value.forEach((entry,index)=>privacy(entry,`${label}[${index}]`));return;}
  if(plain(value)){for(const [name,entry] of Object.entries(value)){if(FORBIDDEN_KEYS.has(key(name)))fail(`Forbidden raw authority field at ${label}.`);privacy(entry,`${label}.${name}`);}return;}
  if(typeof value==='string'&&RAW.test(value))fail(`Raw private authority value appears at ${label}.`);
}
function exact(value,allowed,label){if(!plain(value))fail(`${label} must be an object.`);for(const name of Object.keys(value))if(!allowed.has(name))fail(`${label}: unknown field ${name}.`);}
function hash(value,label){if(!HASH.test(String(value||'')))fail(`${label} must be sha256:<64 hex>.`);return value;}
function iso(value,label){if(!Number.isFinite(Date.parse(String(value||''))))fail(`${label} must be an ISO timestamp.`);return value;}
function read(path,label){if(!path)fail(`${label} path is required.`);return JSON.parse(fs.readFileSync(path,'utf8'));}
function clone(value){return JSON.parse(JSON.stringify(value));}
function assertPositive(p){
  exact(p,POSITIVE_FIELDS,'positive');privacy(p,'positive');
  if(p.evidenceType!==POSITIVE_TYPE||p.schemaVersion!==1||p.runtimeRevision!==RUNTIME)fail('Positive draft must be exact SSJR r6 guided evidence.');
  if(p.privacySafe!==true||p.rawAuthorityIncluded!==false||p.canonicalStorageRawIncluded!==false)fail('Positive draft must be privacy-safe and contain no raw authority/storage.');
  if(!['playerOne','playerTwo'].includes(p.managerRole)||!['host','peer'].includes(p.remoteRole))fail('Positive manager/remote roles are invalid.');
  for(const name of ['accountFingerprint','deviceFingerprint','rivalryFingerprint','canonicalStorageBeforeHash','canonicalStorageAfterHash'])hash(p[name],`positive.${name}`);
  if(p.canonicalStorageViolation===true||p.canonicalStorageBeforeHash!==p.canonicalStorageAfterHash)fail('Positive draft did not preserve canonical local storage.');
  iso(p.generatedAt,'positive.generatedAt');
  for(const name of ['pairedActiveBeforeSetup','authoritativeSetupObserved','identicalFinalSetup','reloadResume','freshActiveSessionResume','finalSetup'])if(!plain(p[name]))fail(`positive.${name} is required.`);
  const first=p.pairedActiveBeforeSetup;if(first.paired!==true||first.sessionState!=='active'||first.setupMutationSeen===true)fail('Pairing + exact ACTIVE must precede Shared Setup.');
  hash(first.sessionFingerprint,'positive.pairedActiveBeforeSetup.sessionFingerprint');
  if(!Number.isInteger(p.authoritativeSetupObserved.revision)||p.authoritativeSetupObserved.revision<1||p.authoritativeSetupObserved.revision>=6)fail('Authoritative setup observation revision is invalid.');
  hash(p.authoritativeSetupObserved.setupDigest,'positive.authoritativeSetupObserved.setupDigest');
  hash(p.identicalFinalSetup.setupDigest,'positive.identicalFinalSetup.setupDigest');
  hash(p.reloadResume.setupDigest,'positive.reloadResume.setupDigest');
  hash(p.freshActiveSessionResume.setupDigest,'positive.freshActiveSessionResume.setupDigest');
  hash(p.freshActiveSessionResume.sessionFingerprint,'positive.freshActiveSessionResume.sessionFingerprint');
  if(p.reloadResume.resetOrRedraw!==false||p.freshActiveSessionResume.resetOrRedraw!==false)fail('Reload/fresh-session resume must prove no reset or redraw.');
  if(p.freshActiveSessionResume.sessionFingerprint===first.sessionFingerprint)fail('Fresh session fingerprint must differ from initial session fingerprint.');
  hash(p.finalSetup.digest,'positive.finalSetup.digest');
  if(p.identicalFinalSetup.setupDigest!==p.finalSetup.digest||p.reloadResume.setupDigest!==p.finalSetup.digest||p.freshActiveSessionResume.setupDigest!==p.finalSetup.digest)fail('Positive final setup digests do not converge.');
  for(const item of [first,p.authoritativeSetupObserved,p.identicalFinalSetup,p.reloadResume,p.freshActiveSessionResume])iso(item.at,'positive checkpoint');
}
function assertNegative(n,p){
  exact(n,NEGATIVE_FIELDS,'negative');privacy(n,'negative');
  if(n.schemaVersion!==1||n.evidenceType!==NEGATIVE_TYPE||n.runtimeRevision!==RUNTIME)fail('Negative bundle must be exact SSJR r6 safe evidence.');
  if(n.managerRole!==p.managerRole)fail('Positive and negative manager roles differ.');
  for(const name of ['accountFingerprint','deviceFingerprint','rivalryFingerprint']){hash(n[name],`negative.${name}`);if(n[name]!==p[name])fail(`Positive and negative ${name} differ.`);}
  exact(n.observations,new Set(REQUIRED),'negative.observations');
  for(const name of REQUIRED){
    const observation=n.observations[name];exact(observation,OBS_FIELDS,`negative.${name}`);
    if(observation.status!=='denied'||observation.localStorageUnchanged!==true)fail(`negative.${name} is not a proven denial.`);
    iso(observation.at,`negative.${name}.at`);
    if(typeof observation.source!=='string'||!observation.source||typeof observation.code!=='string'||!observation.code)fail(`negative.${name} source/code are required.`);
  }
}
function checkpoint(name,value){return {name,...clone(value)};}
function assemble(p,n){
  assertPositive(p);assertNegative(n,p);
  return {
    schemaVersion:1,evidenceType:OUTPUT_TYPE,capturedAt:p.generatedAt,runtimeRevision:RUNTIME,
    managerRole:p.managerRole,remoteRole:p.remoteRole,
    accountFingerprint:p.accountFingerprint,deviceFingerprint:p.deviceFingerprint,rivalryFingerprint:p.rivalryFingerprint,
    canonicalStorageBeforeHash:p.canonicalStorageBeforeHash,canonicalStorageAfterHash:p.canonicalStorageAfterHash,
    checkpoints:[
      checkpoint('paired-active-before-setup',p.pairedActiveBeforeSetup),
      checkpoint('authoritative-setup-observed',p.authoritativeSetupObserved),
      checkpoint('identical-final-setup',p.identicalFinalSetup),
      checkpoint('reload-resume',p.reloadResume),
      checkpoint('fresh-active-session-resume',p.freshActiveSessionResume)
    ],
    negatives:Object.fromEntries(REQUIRED.map(name=>[name,'denied'])),
    finalSetup:clone(p.finalSetup)
  };
}

try{
  const [positivePath,negativePath]=process.argv.slice(2);
  const output=assemble(read(positivePath,'positive'),read(negativePath,'negative'));
  privacy(output,'output');
  process.stdout.write(`${JSON.stringify(output,null,2)}\n`);
}catch(error){process.stderr.write(`SSJR_SAFE_EVIDENCE_ASSEMBLY_INVALID ${error.message}\n`);process.exit(1);}
