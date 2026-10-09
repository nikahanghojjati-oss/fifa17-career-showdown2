'use strict';
// JOB-10 completed-only transfer history contracts. Plain node:assert, no Firebase, no emulator.
// Fixtures are produced by the real transfer protocol (js/sharedTransferChallenge.js), then stored the way
// js/sparkSharedTransferChallenge.js stores them (public ledger + one private role document per manager).
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
global.window=globalThis;
require(path.join(root,'data/transferOptions.js'));
const Reader=require(path.join(root,'js/sparkCompletedTransferHistoryReader.js'));
const CompletedReader=require(path.join(root,'js/sparkCompletedShowdownReader.js'));
const TransferProtocol=require(path.join(root,'js/sharedTransferChallenge.js'));

const A='acct_daniel',B='acct_nik',C='acct_stranger';
const RID=`pair_${'a'.repeat(64)}`;
const SESSION=`session_${'a'.repeat(64)}`,DEVICE=`device_${'a'.repeat(32)}`;
const ts=ms=>({toMillis:()=>ms});
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==='function')return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==='object'){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
function sha(value){return 'sha256:'+crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
function rivalryDoc(data,{id=RID,revision=4}={}){return {schemaVersion:1,objectType:'rivalry',objectId:id,revision,parentRevision:revision-1,lifecycleState:'live',contentHash:sha({objectType:'rivalry',objectId:id,revision,data}),priorContentHash:`sha256:${'0'.repeat(64)}`,updatedAt:ts(1),updatedByAccountId:A,updatedByDeviceId:DEVICE,data,tombstone:null};}
const slots=[{slotId:'playerOne',accountId:A,profileId:`profile_${'1'.repeat(24)}`,saveId:`save_${'3'.repeat(24)}`,displayLabel:'Daniel',entitlementState:'active',deletionConsent:false},{slotId:'playerTwo',accountId:B,profileId:`profile_${'2'.repeat(24)}`,saveId:`save_${'4'.repeat(24)}`,displayLabel:'Nik',entitlementState:'active',deletionConsent:false}];
const baseData=state=>({connectionState:state,connectionStateBeforeDeletion:null,managerSlots:slots,authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:ts(1)});
const intent=(total,over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',phase:'TERMINAL_CLOSE_READY',rivalryId:RID,sessionId:SESSION,totalSeasons:total,completedSeason:total,managerTotals:{playerOne:5,playerTwo:0},winner:'playerOne',terminal:true,finalSeasonReconciled:true,nextSeason:null,extraSeasonAllowed:false,rivalryConnectionState:'closed',sessionTargetState:'closed',terminalReadAllowed:true,canonicalStorageMutation:false,providerWriteRequired:true,listPermissionRequired:false,billingRequired:false,...over});
const progress=(total,over={})=>({schemaVersion:1,runtimeRevision:'1.9.1-r18',totalSeasons:total,acceptedThroughSeason:total,managerTotals:{playerOne:5,playerTwo:0},closedSessionRevision:3,...over});
const ledger=(total,over={})=>({schemaVersion:1,objectType:'sharedSetupLedger',rivalryId:RID,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',operationIds:[],operationTypes:[],baseRevisions:[],actorRoles:[],totalSeasons:total,confirmedRoles:['playerOne','playerTwo'],activeSessionId:SESSION,updatedAt:ts(1),updatedByDeviceId:DEVICE,...over});
const leagueIds=window.FIFA17_TRANSFER_LEAGUES.map(item=>item.id),nationalityIds=window.FIFA17_TRANSFER_NATIONALITIES.map(item=>item.id);
const opId=n=>`transfer_op_${n.toString(16).padStart(32,'0')}`;
// Season inputs: season 1 Daniel's signing is guessed by Nik (released); season 3 has empty rows.
const SEASON_INPUTS=[
  {guesses:{playerOne:[{slot:1,type:'league',valueId:'england-premier-league'}],playerTwo:[{slot:2,type:'nationality',valueId:'england'},{slot:1,type:'league',valueId:'germany-bundesliga'}]},signings:{playerOne:[{slot:1,name:'Daniel S1',leagueId:'spain-primera-division',nationalityId:'england'}],playerTwo:[{slot:1,name:'Nik S1',leagueId:'italy-serie-a',nationalityId:'brazil'}]}},
  {guesses:{playerOne:[{slot:1,type:'nationality',valueId:'brazil'}],playerTwo:[{slot:1,type:'league',valueId:'france-ligue-1'}]},signings:{playerOne:[{slot:1,name:'Daniel S2',leagueId:'germany-bundesliga',nationalityId:'france'}],playerTwo:[{slot:1,name:'Nik S2',leagueId:'england-premier-league',nationalityId:'brazil'},{slot:2,name:'Nik S2 B',leagueId:'italy-serie-a',nationalityId:'germany'}]}},
  {guesses:{playerOne:[],playerTwo:[]},signings:{playerOne:[],playerTwo:[]}}
];

async function playSeason(protocol,seasonNumber,inputs){
  const setup={phase:'SHOWDOWN_CONFIRMED',revision:6,coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo'],clubs:{playerOne:'Arsenal',playerTwo:'Chelsea'}};
  const careerStart={phase:'CAREER_START_READY',revision:2,acknowledgedRoles:['playerOne','playerTwo']};
  let state=null,n=seasonNumber*100,now=1000*seasonNumber;
  const step=async(actorRole,command)=>{const applied=await protocol.apply({state,setup,careerStart,seasonNumber,actorRole,command:{...command,operationId:opId(++n),baseRevision:state?state.revision:0},nowEpochMs:now+=10});state=applied.state;};
  await step('playerOne',{type:'start-window'});
  await step('playerOne',{type:'request-end-window'});await step('playerTwo',{type:'request-end-window'});
  await step('playerOne',{type:'lock-guesses',guesses:inputs.guesses.playerOne});await step('playerTwo',{type:'lock-guesses',guesses:inputs.guesses.playerTwo});
  await step('playerOne',{type:'lock-signings',signings:inputs.signings.playerOne});await step('playerTwo',{type:'lock-signings',signings:inputs.signings.playerTwo});
  assert.equal(state.phase,'COMPLETED');
  return state;
}
// Stored shape of js/sparkSharedTransferChallenge.js (stspPublicLedger / stspPrivateLedger).
function storedPublic(state){const r=state.receipts;return {schemaVersion:1,objectType:'sharedTransferChallenge',rivalryId:RID,seasonNumber:state.seasonNumber,runtimeRevision:'1.9.1-r8',coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt:ts(state.startedAtEpochMs),endedAt:ts(state.endedAtEpochMs),endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:r.map(x=>x.operationId),operationTypes:r.map(x=>x.type),operationHashes:r.map(x=>x.commandHash),baseRevisions:r.map(x=>x.baseRevision),actorRoles:r.map(x=>x.actorRole),activeSessionId:SESSION,updatedAt:ts(9),updatedByDeviceId:DEVICE};}
function storedRole(state,role){const input=state.inputs[role];return {schemaVersion:1,objectType:'sharedTransferChallengeRole',rivalryId:RID,seasonNumber:state.seasonNumber,managerRole:role,guesses:JSON.parse(JSON.stringify(input.guesses)),signings:JSON.parse(JSON.stringify(input.signings)),guessLockedAt:ts(5),signingLockedAt:ts(7),activeSessionId:SESSION,updatedAt:ts(7),updatedByDeviceId:DEVICE};}

function fakeSdk(docs,{deny=new Set()}={}){
  const log=[];
  return {log,sdk:{
    doc:(_db,...parts)=>({path:parts.join('/')}),
    getDoc:async ref=>{log.push(ref.path);if(deny.has(ref.path)){const e=new Error('denied');e.code='permission-denied';throw e;}const value=docs[ref.path];return {exists:()=>value!==undefined,data:()=>value};}
  }};
}
const readWith=(docs,opts={},uid=A)=>{const f=fakeSdk(docs,opts);return Reader.readCompletedTransferHistory({firestore:{},firebaseSdk:f.sdk,user:{uid},rivalryId:RID,cryptoImpl:crypto.webcrypto}).then(r=>({r,log:f.log}));};
const P0=`rivalries/${RID}`;
const clone=value=>JSON.parse(JSON.stringify(value,(k,v)=>v));
function cloneDocs(docs){const out={};for(const [k,v] of Object.entries(docs)){out[k]=structuredCloneWithTs(v);}return out;}
function structuredCloneWithTs(value){if(value&&typeof value.toMillis==='function')return ts(value.toMillis());if(Array.isArray(value))return value.map(structuredCloneWithTs);if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))out[k]=structuredCloneWithTs(v);return out;}return value;}

(async()=>{
  const protocol=await TransferProtocol.createProtocol({leagueIds,nationalityIds,cryptoImpl:crypto.webcrypto});
  const states=[];for(let k=1;k<=3;k+=1)states.push(await playSeason(protocol,k,SEASON_INPUTS[k-1]));
  const completedDocs=total=>{const docs={[P0]:rivalryDoc({...baseData('closed'),terminalClose:intent(total),terminalProgress:progress(total)}),[`${P0}/sharedSetup/authoritative`]:ledger(total)};for(let k=1;k<=total;k+=1){const s=states[k-1],t=`${P0}/transferChallenges/season_${k}`;docs[t]=storedPublic(s);docs[`${t}/roles/playerOne`]=storedRole(s,'playerOne');docs[`${t}/roles/playerTwo`]=storedRole(s,'playerTwo');}return docs;};

  // K1. API surface and safety flags
  assert.equal(typeof Reader.readCompletedTransferHistory,'function');
  assert.deepEqual([...Reader.statuses],['completed','abandoned','not-closed','unavailable']);
  for(const [k,v] of Object.entries({sessionRequired:false,deviceRequired:false,providerWriteRequired:false,listPermissionRequired:false,canonicalStorageMutation:false,billingRequired:false}))assert.equal(Reader[k],v,k);
  assert.equal(Reader.contractVersion,1);assert.equal(Object.isFrozen(Reader),true);

  // K2. Reader source: exact gets only; no session, transaction, list, write, listener or browser storage
  const src=read('js/sparkCompletedTransferHistoryReader.js');
  for(const banned of [/runTransaction/,/getDocs\(/,/collection\(/,/query\(/,/listDocuments/,/setDoc|updateDoc|deleteDoc|\.set\(|\.update\(|writeBatch/,/localStorage|sessionStorage|indexedDB/,/"sessions"|'sessions'/,/onSnapshot/,/getAfter/])assert.doesNotMatch(src,banned,String(banned));
  assert.match(src,/sdk\.getDoc\(sdk\.doc\(/);
  assert.equal((src.match(/function\s+(?!cth)[A-Za-z_$][\w$]*\s*\(/g)||[]).length,0,'every named function starts with cth (static release contract: unique names across js/)');

  // K3. Never throws; bad input is unavailable, frozen, with a code; transfers never empty
  for(const bad of [undefined,{},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},user:{uid:A},rivalryId:'nope'},{firestore:{},firebaseSdk:{doc(){},getDoc(){}},rivalryId:RID}]){
    const r=await Reader.readCompletedTransferHistory(bad);assert.equal(r.status,'unavailable');assert.ok(r.code);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null});assert.equal(Object.isFrozen(r),true);
  }

  // K4. Classification from the root alone: live and abandoned Showdowns read nothing below the root
  for(const state of ['active','pending-pair']){const {r,log}=await readWith({[P0]:rivalryDoc(baseData(state))});assert.equal(r.status,'not-closed',state);assert.deepEqual(log,[P0]);assert.equal(r.transfers,null);}
  {const {r,log}=await readWith({[P0]:rivalryDoc(baseData('closed'))},{},B);assert.equal(r.status,'abandoned');assert.equal(r.managerRole,'playerTwo');assert.deepEqual(log,[P0]);assert.equal(r.transfers,null);}
  {const {r,log}=await readWith({[P0]:rivalryDoc({...baseData('closed'),terminalProgress:progress(1,{closedSessionRevision:null})})});assert.equal(r.status,'abandoned');assert.deepEqual(log,[P0]);}

  // K5. Forged witnesses fail before any child read
  for(const [label,extra] of [
    ['winner contradicts totals',{terminalClose:intent(1,{winner:'draw'}),terminalProgress:progress(1)}],
    ['no closed session revision',{terminalClose:intent(1),terminalProgress:progress(1,{closedSessionRevision:null})}],
    ['accepted < total',{terminalClose:intent(3),terminalProgress:progress(3,{acceptedThroughSeason:2})}],
    ['totals differ',{terminalClose:intent(1),terminalProgress:progress(1,{managerTotals:{playerOne:4,playerTwo:0}})}],
    ['other rivalry',{terminalClose:intent(1,{rivalryId:`pair_${'b'.repeat(64)}`}),terminalProgress:progress(1)}],
    ['extra progress key',{terminalClose:intent(1),terminalProgress:{...progress(1),extra:1}}],
    ['missing progress',{terminalClose:intent(1)}]
  ]){const {r,log}=await readWith({[P0]:rivalryDoc({...baseData('closed'),...extra})});assert.equal(r.code,'TRANSFER_HISTORY_TERMINAL_WITNESS_INVALID',label);assert.deepEqual(log,[P0],label);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null},label);}

  // K6. Integrity, membership, catalog and denied reads are unavailable, never empty
  {const value=rivalryDoc(baseData('closed'));value.data={...value.data,connectionState:'active'};const {r}=await readWith({[P0]:value});assert.equal(r.code,'TRANSFER_HISTORY_RIVALRY_INTEGRITY_FAILED');}
  {const {r}=await readWith({[P0]:rivalryDoc(baseData('closed'))},{},C);assert.equal(r.code,'TRANSFER_HISTORY_NOT_A_MANAGER');}
  {const {r}=await readWith({});assert.equal(r.code,'TRANSFER_HISTORY_RIVALRY_MISSING');}
  {const {r}=await readWith({},{deny:new Set([P0])});assert.equal(r.code,'permission-denied');}
  {const {r}=await readWith(completedDocs(1),{deny:new Set([`${P0}/transferChallenges/season_1`])});assert.equal(r.code,'permission-denied','JOB-08 Rules without JOB-10: honest unavailable');assert.deepEqual(r.transfers,{status:'unavailable',seasons:null});}
  {const {r}=await readWith(completedDocs(1),{deny:new Set([`${P0}/transferChallenges/season_1/roles/playerTwo`])});assert.equal(r.code,'permission-denied');}
  {const docs=completedDocs(1);delete docs[`${P0}/sharedSetup/authoritative`];const {r}=await readWith(docs);assert.equal(r.code,'TRANSFER_HISTORY_SETUP_INVALID');}
  {const saved=window.FIFA17_TRANSFER_LEAGUES;window.FIFA17_TRANSFER_LEAGUES=undefined;try{const {r,log}=await readWith(completedDocs(1));assert.equal(r.code,'TRANSFER_HISTORY_CATALOG_UNAVAILABLE');assert.deepEqual(log,[P0]);}finally{window.FIFA17_TRANSFER_LEAGUES=saved;}}

  // K7. Completed: exact gets 2 + 3N in a fixed order, keyed daniel/nik, verdicts equal the transfer protocol
  for(const total of [1,3]){
    const {r,log}=await readWith(completedDocs(total),{},total===1?A:B);
    assert.equal(r.status,'completed',JSON.stringify(r));assert.equal(r.code,null);assert.equal(r.managerRole,total===1?'playerOne':'playerTwo');assert.equal(Object.isFrozen(r.transfers.seasons[0].daniel.signings),true);
    const expectedLog=[P0,`${P0}/sharedSetup/authoritative`];for(let k=1;k<=total;k+=1){const t=`${P0}/transferChallenges/season_${k}`;expectedLog.push(t,`${t}/roles/playerOne`,`${t}/roles/playerTwo`);}
    assert.deepEqual(log,expectedLog);assert.equal(log.length,2+3*total);
    assert.equal(r.transfers.status,'ready');assert.equal(r.transfers.seasons.length,total);
    for(let k=1;k<=total;k+=1){
      const season=r.transfers.seasons[k-1],state=states[k-1];
      assert.deepEqual(Object.keys(season),['season','daniel','nik']);assert.equal(season.season,k);
      for(const [key,role] of [['daniel','playerOne'],['nik','playerTwo']]){
        const verdict=protocol.evaluateRole(role,state);
        assert.deepEqual(clone(season[key].signings),clone(verdict),`${key} S${k} verdict equals the protocol`);
        assert.deepEqual(clone(season[key].guesses),clone(state.inputs[role].guesses));
        assert.equal(season[key].released,verdict.filter(x=>x.release).length);assert.equal(season[key].kept,verdict.length-season[key].released);
      }
    }
  }
  {const {r}=await readWith(completedDocs(3));assert.equal(r.transfers.seasons[0].daniel.released,1,'Nik guessed Daniel S1 nationality: released');assert.deepEqual(r.transfers.seasons[2].daniel,{guesses:[],signings:[],released:0,kept:0},'an empty season is real, not unavailable');}
  {const a=await readWith(completedDocs(3),{},A),b=await readWith(completedDocs(3),{},B);assert.deepEqual(a.r.transfers,b.r.transfers,'both managers read the identical history');}

  // K8. Tampered or partial season data: unavailable, never shorter, never a partial list
  const tamper=async(label,mutate,code)=>{const docs=cloneDocs(completedDocs(3));mutate(docs);const {r}=await readWith(docs);assert.equal(r.status,'unavailable',label);assert.equal(r.code,code,label);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null},label);};
  const T=k=>`${P0}/transferChallenges/season_${k}`;
  await tamper('rival guess edited after lock',d=>{d[`${T(1)}/roles/playerTwo`].guesses[0].valueId='italy-serie-a';},'TRANSFER_HISTORY_PROVENANCE_MISMATCH');
  await tamper('signing renamed after lock',d=>{d[`${T(2)}/roles/playerOne`].signings[0].name='Someone else';},'TRANSFER_HISTORY_PROVENANCE_MISMATCH');
  await tamper('roles swapped',d=>{const x=d[`${T(1)}/roles/playerOne`];d[`${T(1)}/roles/playerOne`]=d[`${T(1)}/roles/playerTwo`];d[`${T(1)}/roles/playerTwo`]=x;},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('challenge not COMPLETED',d=>{d[T(2)].phase='SIGNING_ENTRY';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('missing season 3 role',d=>{delete d[`${T(3)}/roles/playerOne`];},'TRANSFER_HISTORY_SEASON_MISSING');
  await tamper('missing season 2 challenge',d=>{delete d[T(2)];},'TRANSFER_HISTORY_SEASON_MISSING');
  await tamper('unknown catalog id',d=>{d[`${T(1)}/roles/playerOne`].signings[0].leagueId='atlantis-league';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('coordinator differs from setup',d=>{d[`${P0}/sharedSetup/authoritative`].coordinatorRole='playerTwo';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('extra key on a role',d=>{d[`${T(1)}/roles/playerTwo`].note='x';},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('unlocked signings',d=>{d[`${T(1)}/roles/playerTwo`].signings=null;},'TRANSFER_HISTORY_SEASON_INVALID');
  await tamper('setup length differs from witness',d=>{d[`${P0}/sharedSetup/authoritative`].totalSeasons=5;},'TRANSFER_HISTORY_SETUP_INVALID');

  // K8b. JOB-1051 salted commitments: a role document written by the new provider carries guessSalt and signingSalt, and the public
  // hash of each lock is sha256(canonical({actorRole,type,operationId,baseRevision,...payload,salt})). r66 documents (no salt keys,
  // unsalted payload hash) keep reading. Each shape must be proven only by its own hash; nothing else is read.
  const sortedCanonical=value=>{if(Array.isArray(value))return `[${value.map(sortedCanonical).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${sortedCanonical(value[k])}`).join(',')}}`;return JSON.stringify(value);};
  const commitment=(role,type,publicDoc,index,payload,salt)=>'sha256:'+crypto.createHash('sha256').update(sortedCanonical({actorRole:role,type,operationId:publicDoc.operationIds[index],baseRevision:publicDoc.baseRevisions[index],...payload,...(salt?{salt}:{})})).digest('hex');
  const lockIndex=(publicDoc,type,role)=>publicDoc.operationTypes.findIndex((t,i)=>t===type&&publicDoc.actorRoles[i]===role);
  const saltFor=(season,role,kind)=>crypto.createHash('sha256').update(`${season}:${role}:${kind}`).digest('hex');
  // mode: 'salted' (both salts), 'mixed' (r66 guess lock, salted signings lock) or 'r66' (no salt keys, as stored by the old provider)
  const saltedDocs=(total,mode)=>{
    const docs=cloneDocs(completedDocs(total));
    for(let k=1;k<=total;k+=1){
      const pub=docs[T(k)];
      for(const role of ['playerOne','playerTwo']){
        const doc=docs[`${T(k)}/roles/${role}`];
        const gSalt=mode==='salted'?saltFor(k,role,'guess'):null,sSalt=mode==='r66'?null:saltFor(k,role,'signing');
        const gi=lockIndex(pub,'lock-guesses',role),si=lockIndex(pub,'lock-signings',role);
        pub.operationHashes[gi]=commitment(role,'lock-guesses',pub,gi,{guesses:doc.guesses},gSalt);
        pub.operationHashes[si]=commitment(role,'lock-signings',pub,si,{signings:doc.signings},sSalt);
        if(mode!=='r66'){doc.guessSalt=gSalt;doc.signingSalt=sSalt;}
      }
    }
    return docs;
  };
  const plain=await readWith(completedDocs(3));assert.equal(plain.r.status,'completed');
  for(const mode of ['salted','mixed','r66']){
    const {r}=await readWith(saltedDocs(3,mode));
    assert.equal(r.status,'completed',`${mode}: ${JSON.stringify(r)}`);assert.deepEqual(clone(r.transfers),clone(plain.r.transfers),`${mode} history equals the unsalted history`);
  }
  assert.equal(Object.keys(saltedDocs(1,'salted')[`${T(1)}/roles/playerOne`]).length,14);assert.equal(Object.keys(saltedDocs(1,'r66')[`${T(1)}/roles/playerOne`]).length,12);
  const saltTamper=async(label,mode,mutate,code)=>{const docs=saltedDocs(3,mode);mutate(docs);const {r}=await readWith(docs);assert.equal(r.status,'unavailable',label);assert.equal(r.code,code,label);assert.deepEqual(r.transfers,{status:'unavailable',seasons:null},label);};
  const MISMATCH='TRANSFER_HISTORY_PROVENANCE_MISMATCH',INVALID='TRANSFER_HISTORY_SEASON_INVALID';
  await saltTamper('salted: rival guess edited after lock','salted',d=>{d[`${T(1)}/roles/playerTwo`].guesses[0].valueId='italy-serie-a';},MISMATCH);
  await saltTamper('salted: signing renamed after lock','salted',d=>{d[`${T(2)}/roles/playerOne`].signings[0].name='Someone else';},MISMATCH);
  await saltTamper('salted: guess salt replaced','salted',d=>{d[`${T(1)}/roles/playerOne`].guessSalt='0'.repeat(64);},MISMATCH);
  await saltTamper('salted: signing salt replaced','salted',d=>{d[`${T(3)}/roles/playerTwo`].signingSalt='f'.repeat(64);},MISMATCH);
  await saltTamper('salted: guess salt swapped with the rival\'s','salted',d=>{const a=d[`${T(1)}/roles/playerOne`],b=d[`${T(1)}/roles/playerTwo`];[a.guessSalt,b.guessSalt]=[b.guessSalt,a.guessSalt];},MISMATCH);
  await saltTamper('salted: salts nulled to downgrade to the unsalted hash','salted',d=>{const doc=d[`${T(1)}/roles/playerOne`];doc.guessSalt=null;doc.signingSalt=null;},MISMATCH);
  await saltTamper('salted: salt keys removed to downgrade to the unsalted hash','salted',d=>{const doc=d[`${T(1)}/roles/playerOne`];delete doc.guessSalt;delete doc.signingSalt;},MISMATCH);
  await saltTamper('r66: a salt added to a role the ledger never salted','r66',d=>{const doc=d[`${T(1)}/roles/playerOne`];doc.guessSalt=saltFor(1,'playerOne','guess');doc.signingSalt=null;},MISMATCH);
  await saltTamper('r66: guess edited after lock still fails','r66',d=>{d[`${T(1)}/roles/playerTwo`].guesses[0].valueId='italy-serie-a';},MISMATCH);
  await saltTamper('mixed: signing renamed after lock','mixed',d=>{d[`${T(2)}/roles/playerTwo`].signings[0].name='Someone else';},MISMATCH);
  for(const [label,mutate] of [
    ['uppercase salt',doc=>{doc.guessSalt=doc.guessSalt.toUpperCase();}],
    ['63-character salt',doc=>{doc.guessSalt=doc.guessSalt.slice(1);}],
    ['65-character salt',doc=>{doc.signingSalt+='0';}],
    ['non-hex salt',doc=>{doc.guessSalt='z'+doc.guessSalt.slice(1);}],
    ['numeric salt',doc=>{doc.signingSalt=1;}],
    ['empty salt',doc=>{doc.guessSalt='';}],
    ['only guessSalt present',doc=>{delete doc.signingSalt;}],
    ['only signingSalt present',doc=>{delete doc.guessSalt;}],
    ['unknown extra key beside the salts',doc=>{doc.note='x';}]
  ])await saltTamper(`shape: ${label}`,'salted',d=>mutate(d[`${T(1)}/roles/playerOne`]),INVALID);

  // K9. Rules text: phase-gated role grant, witness-keyed, no write inspection, no billing words
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  const grant=fragment.slice(fragment.indexOf('function cmsCompletedTransferRoleReadable'),fragment.indexOf('// CMS_PERSISTENT_PAIR_FUNCTIONS_END'));
  for(const needle of ['cmsCompletedSeasonReadable(rivalryId, transferId)',"challenge.objectType == 'sharedTransferChallenge'",'challenge.rivalryId == rivalryId','ssjrTransferSeasonMatches(transferId, challenge.seasonNumber)',"challenge.phase == 'COMPLETED'","'playerOne' in challenge.guessLockedRoles","'playerTwo' in challenge.guessLockedRoles","'playerOne' in challenge.signingLockedRoles","'playerTwo' in challenge.signingLockedRoles"])assert.ok(grant.includes(needle),needle);
  assert.doesNotMatch(grant,/getAfter|request\.resource/,'read grant never inspects a write');
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  const inject=read('scripts/inject-persistent-pair-rules.mjs');
  for(const label of ['completed Showdown transfer challenge read','completed Showdown transfer role read','completed Showdown setup read','completed Showdown season commit read'])assert.ok(inject.includes(label),label);

  // K10. Composed artifact: both builds pass; the transfer grant sits on exactly two get lines, roles are phase-gated
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  assert.equal((generated.match(/allow get: if ssjrEntitled\(rivalryId\) \|\| cmsCompletedSeasonReadable\(rivalryId, transferId\);/g)||[]).length,1,'public challenge get');
  assert.match(generated,/allow get: if ssjrTransferPrivateReadable\(rivalryId, transferId, managerRole\)\n\s+\|\| \(managerRole in \['playerOne', 'playerTwo'\] && cmsCompletedTransferRoleReadable\(rivalryId, transferId\)\);/);
  const transferAt=generated.indexOf('match /transferChallenges/{transferId}'),rolesAt=generated.indexOf('match /roles/{managerRole}',transferAt),transferEnd=generated.indexOf('// SSJR_TRANSFER_CHALLENGE_MATCH_END');
  assert.ok(transferAt>0&&rolesAt>transferAt&&transferEnd>rolesAt);
  assert.doesNotMatch(generated.slice(rolesAt,transferEnd),/cmsCompleted(Showdown|Season)Readable/,'roles never get the blanket season grant (S2C-005R2 §4)');
  assert.equal(/allow (create|update|delete|list|write)[^\n]*cmsCompleted/.test(generated),false,'no write, list or delete rule mentions a completed grant');
  for(const [match,granted] of [['match /sharedSetup/leagueProjection',false],['match /careerStart/authoritative',false],['match /sessions/{sessionId}',false],['match /invites/{inviteId}',false],['match /state/authoritative',false],['match /transferChallenges/{transferId}',true]]){
    const at=generated.indexOf(match);assert.ok(at>=0,match);const getLine=generated.slice(at).split('\n').find(line=>line.includes('allow get'));assert.equal(/cmsCompleted/.test(getLine),granted,match);
  }

  // K11. JOB-08's reader keeps its API, adds JOB-1037's never-started status and never reads transfers
  assert.equal(typeof CompletedReader.readCompletedShowdown,'function');assert.deepEqual([...CompletedReader.statuses],['completed','abandoned','not-closed','unavailable','never-started']);assert.equal(CompletedReader.contractVersion,1);
  assert.doesNotMatch(read('js/sparkCompletedShowdownReader.js'),/transferChallenges/);
  console.log('PASS completed-only transfer history contracts: reader API, exact-get source, classification, witness checks, unavailable states, protocol-equal verdicts, provenance, Rules text, composed artifact, JOB-08 API intact.');
})().catch(e=>{console.error(e);process.exit(1);});
