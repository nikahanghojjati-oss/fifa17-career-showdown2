'use strict';
// JOB-08 completed-only read grant + session-free reader contracts. Plain node:assert, no Firebase, no emulator.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const Reader=require(path.join(root,'js/sparkCompletedShowdownReader.js'));

const A='acct_daniel',B='acct_nik',C='acct_stranger';
const RID=`pair_${'a'.repeat(64)}`;
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==='function')return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function sha(value){return 'sha256:'+crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
function rivalryDoc(data,{id=RID,revision=4}={}){return {schemaVersion:1,objectType:'rivalry',objectId:id,revision,parentRevision:revision-1,lifecycleState:'live',contentHash:sha({objectType:'rivalry',objectId:id,revision,data}),priorContentHash:`sha256:${'0'.repeat(64)}`,updatedAt:{toMillis:()=>1},updatedByAccountId:A,updatedByDeviceId:`device_${'a'.repeat(32)}`,data,tombstone:null};}
const slots=[{slotId:'playerOne',accountId:A,profileId:`profile_${'1'.repeat(24)}`,saveId:`save_${'3'.repeat(24)}`,displayLabel:'Daniel',entitlementState:'active',deletionConsent:false},{slotId:'playerTwo',accountId:B,profileId:`profile_${'2'.repeat(24)}`,saveId:`save_${'4'.repeat(24)}`,displayLabel:'Nik',entitlementState:'active',deletionConsent:false}];
const baseData=state=>({connectionState:state,connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:{toMillis:()=>1}});
const intent=(over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',phase:'TERMINAL_CLOSE_READY',rivalryId:RID,sessionId:`session_${'a'.repeat(64)}`,totalSeasons:1,completedSeason:1,managerTotals:{playerOne:5,playerTwo:0},winner:'playerOne',terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,rivalryConnectionState:'closed',sessionTargetState:'closed',terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false,...over});
const progress=(over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',totalSeasons:1,acceptedThroughSeason:1,managerTotals:{playerOne:5,playerTwo:0},closedSessionRevision:3,...over});

function fakeSdk(docs,{deny=new Set()}={}){
  const log=[];
  return {log,sdk:{
    doc:(_db,...parts)=>({path:parts.join('/')}),
    getDoc:async ref=>{log.push(ref.path);if(deny.has(ref.path)){const e=new Error('denied');e.code='permission-denied';throw e;}const value=docs[ref.path];return {exists:()=>value!==undefined,data:()=>value};}
  }};
}
const readWith=(docs,opts={},uid=A)=>{const f=fakeSdk(docs,opts);return Reader.readCompletedShowdown({firestore:{},firebaseSdk:f.sdk,user:{uid},rivalryId:RID,cryptoImpl:crypto.webcrypto}).then(r=>({r,log:f.log}));};

(async()=>{
  // K1. API surface and safety flags
  assert.equal(typeof Reader.readCompletedShowdown,'function');
  assert.deepEqual([...Reader.statuses],['completed','abandoned','not-closed','unavailable']);
  for(const [k,v] of Object.entries({sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false}))assert.equal(Reader[k],v,k);
  assert.equal(Object.isFrozen(Reader),true);

  // K2. Reader source: exact gets only; no session, transaction, list, write or browser storage
  const src=read('js/sparkCompletedShowdownReader.js');
  for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/listDocuments/,/setDoc|updateDoc|deleteDoc|\.set\(|\.update\(|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"|'sessions'/,/onSnapshot/])assert.doesNotMatch(src,banned,String(banned));
  assert.match(src,/sdk\.getDoc\(sdk\.doc\(/);

  // K3. Never throws; bad input is unavailable, frozen, with a code
  for(const bad of [undefined,{},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},user:{uid:A},rivalryId:'nope'},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},rivalryId:RID}]){
    const r=await Reader.readCompletedShowdown(bad);assert.equal(r.status,'unavailable');assert.ok(r.code);assert.equal(r.projection,null);assert.equal(Object.isFrozen(r),true);
  }

  // K4. Classification from the root alone, without reading anything below it
  const path0=`rivalries/${RID}`;
  for(const state of ['active','pending-pair']){const {r,log}=await readWith({[path0]:rivalryDoc(baseData(state))});assert.equal(r.status,'not-closed',state);assert.deepEqual(log,[path0]);assert.equal(r.managerRole,'playerOne');}
  {const {r,log}=await readWith({[path0]:rivalryDoc({...baseData('closed')})},{},B);assert.equal(r.status,'abandoned');assert.equal(r.managerRole,'playerTwo');assert.deepEqual(log,[path0],'abandoned reads nothing below the root');assert.equal(r.final,null);}
  {const {r}=await readWith({[path0]:rivalryDoc({...baseData('closed'),terminalProgress:progress({closedSessionRevision:null})})});assert.equal(r.status,'abandoned','closed without terminalClose is abandoned even with staged progress');}

  // K5. Terminal witness checks happen before any child read
  const witnessCases=[
    ['winner contradicts totals',{terminalClose:intent({winner:'draw'}),terminalProgress:progress()}],
    ['no closed session revision',{terminalClose:intent(),terminalProgress:progress({closedSessionRevision:null})}],
    ['accepted < total',{terminalClose:intent({totalSeasons:3,completedSeason:3}),terminalProgress:progress({totalSeasons:3,acceptedThroughSeason:2})}],
    ['totals differ',{terminalClose:intent(),terminalProgress:progress({managerTotals:{playerOne:4,playerTwo:0}})}],
    ['other rivalry',{terminalClose:intent({rivalryId:`pair_${'b'.repeat(64)}`}),terminalProgress:progress()}],
    ['extra progress key',{terminalClose:intent(),terminalProgress:{...progress(),extra:1}}],
    ['missing progress',{terminalClose:intent()}]
  ];
  for(const [label,extra] of witnessCases){const {r,log}=await readWith({[path0]:rivalryDoc({...baseData('closed'),...extra})});assert.equal(r.status,'unavailable',label);assert.equal(r.code,'COMPLETED_TERMINAL_WITNESS_INVALID',label);assert.deepEqual(log,[path0],label);}

  // K6. Integrity, membership and read failures are unavailable, never empty
  {const value=rivalryDoc(baseData('closed'));value.data={...value.data,connectionState:'active'};const {r}=await readWith({[path0]:value});assert.equal(r.code,'COMPLETED_RIVALRY_INTEGRITY_FAILED');}
  {const {r}=await readWith({[path0]:rivalryDoc(baseData('closed'))},{},C);assert.equal(r.code,'COMPLETED_NOT_A_MANAGER');}
  {const {r}=await readWith({});assert.equal(r.code,'COMPLETED_RIVALRY_MISSING');}
  {const {r}=await readWith({},{deny:new Set([path0])});assert.equal(r.status,'unavailable');assert.equal(r.code,'permission-denied');}
  {const docs={[path0]:rivalryDoc({...baseData('closed'),terminalClose:intent(),terminalProgress:progress()})};const {r,log}=await readWith(docs);assert.equal(r.code,'COMPLETED_SETUP_INVALID','missing setup ledger');assert.deepEqual(log,[path0,`${path0}/sharedSetup/authoritative`]);}
  {const docs={[path0]:rivalryDoc({...baseData('closed'),terminalClose:intent(),terminalProgress:progress()})};const {r}=await readWith(docs,{deny:new Set([`${path0}/sharedSetup/authoritative`])});assert.equal(r.code,'permission-denied','old Rules: honest unavailable');}

  // K7. Rules text: get-only grant on exactly four seams, witness-keyed, no billing words
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  const grant=fragment.slice(fragment.indexOf('function cmsCompletedShowdownReadable'),fragment.indexOf('// CMS_PERSISTENT_PAIR_FUNCTIONS_END'));
  for(const needle of ["data.connectionState == 'closed'","'terminalClose' in data",'ssjrTerminalValidIntent(rivalryId, data.terminalClose)','ssjrTerminalProgressShape(progress)','progress.acceptedThroughSeason == progress.totalSeasons','progress.closedSessionRevision is int','data.terminalClose.managerTotals == progress.managerTotals','request.auth.uid in data.authorizedAccountIds','activeAccount(request.auth.uid)',"[0:total]"])assert.ok(grant.includes(needle),needle);
  assert.doesNotMatch(grant,/getAfter|request\.resource/,'read grant never inspects a write');
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  const inject=read('scripts/inject-persistent-pair-rules.mjs');
  for(const label of ['completed Showdown setup read','completed Showdown season results read','completed Showdown season result role read','completed Showdown season commit read'])assert.ok(inject.includes(label),label);

  // K8. Composed artifact: both builds pass; grant appears on exactly setup, results, roles and commits, never on a write rule
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  const getLines=generated.split('\n').filter(line=>/cmsCompleted(Showdown|Season)Readable\(rivalryId/.test(line)&&!/function /.test(line));
  assert.equal(getLines.length,7,'setup, results, roles, commits + the season helper call; JOB-10 adds the transfer challenge get and the transfer role helper call');
  assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(generated),false);
  for(const [match,granted] of [['match /sharedSetup/authoritative',true],['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /transferChallenges/{transferId}',true],['match /seasonResults/{seasonId}',true],['match /seasonCommits/{seasonId}',true],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false]]){
    const at=generated.indexOf(match);assert.ok(at>=0,match);const getLine=generated.slice(at).split('\n').find(line=>line.includes('allow get'));
    assert.equal(/cmsCompleted/.test(getLine),granted,match);
  }
  const transferAt=generated.indexOf('match /transferChallenges/{transferId}'),transferRoles=generated.slice(generated.indexOf('match /roles/{managerRole}',transferAt),generated.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END'));assert.doesNotMatch(transferRoles,/cmsCompleted(Showdown|Season)Readable/,'transfer roles never get the blanket season grant (G-10 keeps the COMPLETED condition)');assert.match(transferRoles,/cmsCompletedTransferRoleReadable\(rivalryId, transferId\)/,'G-10: transfer roles only through the COMPLETED-gated grant');
  console.log('PASS completed-only read contracts: reader API, exact-get source, classification, witness checks, unavailable states, Rules text, composed artifact.');
})().catch(e=>{console.error(e);process.exit(1);});
