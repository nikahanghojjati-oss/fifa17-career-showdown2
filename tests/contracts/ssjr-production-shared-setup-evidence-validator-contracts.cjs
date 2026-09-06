const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const validator = path.resolve('scripts/validate-ssjr-shared-setup-production-evidence.mjs');
function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
function hash(value){return `sha256:${crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(stable(value))).digest('hex')}`;}
function finalSetup(){
  const canonical={leagueId:'premier_league',clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},clubLeagueIds:{playerOne:'premier_league',playerTwo:'premier_league'},totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],phase:'SHOWDOWN_CONFIRMED',revision:6};
  return {...canonical,digest:hash(canonical)};
}
function redigest(setup){const canonical={...setup};delete canonical.digest;setup.digest=hash(canonical);return setup;}
function bundle(managerRole,remoteRole,account,device){
  const setup=finalSetup();const session=hash('session-a');const fresh=hash('session-b');const seed=hash({revision:1,phase:'SHARED_SETUP_OPEN'});const storage=hash(`${managerRole}-canonical-storage`);
  return {schemaVersion:1,evidenceType:'SSJR-1.1-production-shared-setup',capturedAt:'2026-09-06T12:00:00Z',runtimeRevision:'1.9.1-r3',managerRole,remoteRole,accountFingerprint:hash(account),deviceFingerprint:hash(device),rivalryFingerprint:hash('rivalry-a'),canonicalStorageBeforeHash:storage,canonicalStorageAfterHash:storage,checkpoints:[
    {name:'paired-active-before-setup',at:'2026-09-06T12:00:01Z',paired:true,sessionState:'active',setupMutationSeen:false,sessionFingerprint:session},
    {name:'authoritative-setup-observed',at:'2026-09-06T12:00:02Z',revision:1,setupDigest:seed},
    {name:'identical-final-setup',at:'2026-09-06T12:00:03Z',setupDigest:setup.digest},
    {name:'reload-resume',at:'2026-09-06T12:00:04Z',setupDigest:setup.digest,resetOrRedraw:false},
    {name:'fresh-active-session-resume',at:'2026-09-06T12:00:05Z',setupDigest:setup.digest,resetOrRedraw:false,sessionFingerprint:fresh}
  ],negatives:{wrongSession:'denied',expiredSession:'denied',unrelatedAccount:'denied',revokedIdentity:'denied',staleRevision:'denied',replayConflict:'denied',directFieldSubstitution:'denied',coordinatorBypass:'denied'},finalSetup:setup};
}
function syncSetupDigests(bundle){bundle.checkpoints[2].setupDigest=bundle.finalSetup.digest;bundle.checkpoints[3].setupDigest=bundle.finalSetup.digest;bundle.checkpoints[4].setupDigest=bundle.finalSetup.digest;}
function run(a,b){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ssjr-evidence-'));const one=path.join(dir,'one.json'),two=path.join(dir,'two.json');fs.writeFileSync(one,JSON.stringify(a));fs.writeFileSync(two,JSON.stringify(b));const result=spawnSync(process.execPath,[validator,one,two],{encoding:'utf8'});fs.rmSync(dir,{recursive:true,force:true});return result;}
const source=bundle('playerOne','host','account-1','device-1');const peer=bundle('playerTwo','peer','account-2','device-2');
let result=run(source,peer);assert.equal(result.status,0,result.stderr);const summary=JSON.parse(result.stdout);assert.equal(summary.ok,true);assert.equal(summary.runtimeRevision,'1.9.1-r3');assert.equal(summary.finalRevision,6);assert.equal(summary.finalPhase,'SHOWDOWN_CONFIRMED');assert.equal(summary.authoritativeCatalogValidated,true);assert.equal(summary.rawAuthorityRejected,true);assert.equal(summary.canonicalStoragePreserved,true);assert.equal(summary.negativesProvenPerManager,8);
for(const [label,mutate,needle] of [
  ['same account',(a,b)=>{b.accountFingerprint=a.accountFingerprint;},'accounts must be distinct'],
  ['same device',(a,b)=>{b.deviceFingerprint=a.deviceFingerprint;},'browser identities must be distinct'],
  ['pairing after setup',(a)=>{a.checkpoints[0].setupMutationSeen=true;},'must precede every Shared Setup mutation'],
  ['local save mutation',(a)=>{a.canonicalStorageAfterHash=hash('changed');},'mutated canonical local gameplay storage'],
  ['negative bypass',(a)=>{a.negatives.coordinatorBypass='allowed';},'coordinatorBypass must be denied'],
  ['redraw on reload',(a)=>{a.checkpoints[3].resetOrRedraw=true;},'reset/redrew Shared Setup'],
  ['different convergence',(a,b)=>{b.finalSetup.totalSeasons=5;redigest(b.finalSetup);syncSetupDigests(b);},'identical final Shared Setup'],
  ['obsolete runtime',(a,b)=>{a.runtimeRevision='1.9.1-r2';b.runtimeRevision='1.9.1-r2';},'exact deployed production runtime 1.9.1-r3'],
  ['impossible runtime',(a,b)=>{a.runtimeRevision='1.9.1-r999';b.runtimeRevision='1.9.1-r999';},'exact deployed production runtime 1.9.1-r3'],
  ['raw authority field',(a)=>{a.accountId='raw-account-authority';},'raw authority field'],
  ['raw authority value',(a)=>{a.finalSetup.clubs.playerOne=`pair_${'a'.repeat(64)}`;redigest(a.finalSetup);syncSetupDigests(a);},'raw private authority value'],
  ['partial final revision',(a)=>{a.finalSetup.revision=5;redigest(a.finalSetup);syncSetupDigests(a);},'exact production revision 6'],
  ['impossible final revision',(a)=>{a.finalSetup.revision=7;redigest(a.finalSetup);syncSetupDigests(a);},'exact production revision 6'],
  ['wrong final phase',(a)=>{a.finalSetup.phase='SEASON_LENGTH_COMMITTED';redigest(a.finalSetup);syncSetupDigests(a);},'phase must be SHOWDOWN_CONFIRMED'],
  ['forged wrong-league clubs',(a)=>{a.finalSetup.clubs={playerOne:'Real Madrid',playerTwo:'Barcelona'};a.finalSetup.clubLeagueIds={playerOne:'premier_league',playerTwo:'premier_league'};redigest(a.finalSetup);syncSetupDigests(a);},'authoritative repository catalog'],
  ['unknown root field',(a)=>{a.note='not in schema';},'unknown evidence field'],
  ['unknown checkpoint field',(a)=>{a.checkpoints[0].accountAlias='manager';},'unknown evidence field']
]){
  const a=structuredClone(source),b=structuredClone(peer);mutate(a,b);result=run(a,b);assert.notEqual(result.status,0,`${label} must fail`);assert.match(result.stderr,new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`${label}: ${result.stderr}`);
}
console.log('PASS SSJR production Shared Setup evidence validator contracts: exact r3, schema-closed privacy, catalog membership and final revision 6 are enforced.');
