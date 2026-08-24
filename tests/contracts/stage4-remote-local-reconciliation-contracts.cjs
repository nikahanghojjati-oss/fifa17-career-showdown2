const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const vm=require("node:vm");
const {TextEncoder}=require("node:util");

const read=file=>fs.readFileSync(file,"utf8");
const clone=value=>JSON.parse(JSON.stringify(value));
function canonical(value){
  if(value===null||typeof value!=="object")return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}
function hash(value){return `sha256:${crypto.createHash("sha256").update(canonical(value)).digest("hex")}`;}

const localSave="save_222222222222222222222222";
const otherSave="save_999999999999999999999999";
const sharedSave="save_111111111111111111111111";
const localP1="profile_aaaaaaaaaaaaaaaaaaaaaaaa";
const localP2="profile_bbbbbbbbbbbbbbbbbbbbbbbb";
const remoteP1="profile_cccccccccccccccccccccccc";
const localSeason="season_aaaaaaaaaaaaaaaaaaaaaaaa";
const otherSeason="season_999999999999999999999999";
const remoteSeason="season_cccccccccccccccccccccccc";
const rivalryId=`pair_${"d".repeat(64)}`;

function showdown({id,name,saveId,p1,p2,seasonId,score=0}){
  return {
    schemaVersion:2,
    id,
    name,
    managers:{playerOne:"Hawk",playerTwo:"Rival"},
    totalRounds:3,
    currentRound:1,
    status:"In Progress",
    selectedLeague:{id:"england-premier-league"},
    clubs:{playerOne:"Arsenal",playerTwo:"Chelsea"},
    score:{playerOne:score,playerTwo:0},
    transferChallenges:[],
    rounds:[{roundNumber:1,seasonId,playerOne:{points:score},playerTwo:{points:0},winner:score?"playerOne":null}],
    integrityWarnings:[],
    createdAt:"2026-08-20T10:00:00.000Z",
    updatedAt:"2026-08-24T10:00:00.000Z",
    completedAt:null,
    archivedAt:null,
    identity:{schemaVersion:1,saveId,managerProfileIds:{playerOne:p1,playerTwo:p2}}
  };
}

const localTarget=showdown({id:"local-target",name:"Local Before",saveId:localSave,p1:localP1,p2:localP2,seasonId:localSeason,score:1});
const localOther=showdown({id:"other-save",name:"Other Save",saveId:otherSave,p1:localP1,p2:localP2,seasonId:otherSeason,score:7});
const library={
  schemaVersion:1,
  activeSaveId:localSave,
  profiles:[
    {schemaVersion:1,profileId:localP1,displayName:"Hawk"},
    {schemaVersion:1,profileId:localP2,displayName:"Rival"}
  ],
  saves:[
    {saveId:localSave,showdown:localTarget},
    {saveId:otherSave,showdown:localOther}
  ]
};
const remotePayload=showdown({id:"remote-record",name:"Remote Authoritative",saveId:sharedSave,p1:remoteP1,p2:localP2,seasonId:remoteSeason,score:5});
const remoteData={
  saveId:sharedSave,
  managerBindings:[
    {slotId:"playerOne",profileId:remoteP1},
    {slotId:"playerTwo",profileId:localP2}
  ],
  seasonIds:[remoteSeason],
  activeSeasonId:remoteSeason,
  payloadFormatVersion:1,
  payload:remotePayload,
  mutationReceipt:{idempotencyKeyHash:"e".repeat(64),requestFingerprint:`sha256:${"f".repeat(64)}`,baseRevision:0}
};
function envelope(revision=1,data=remoteData){
  const value={
    schemaVersion:1,
    objectType:"sharedState",
    objectId:rivalryId,
    revision,
    parentRevision:revision?revision-1:null,
    lifecycleState:"live",
    contentHash:null,
    priorContentHash:revision?`sha256:${"0".repeat(64)}`:null,
    updatedAt:null,
    updatedByAccountId:"acct_remote",
    updatedByDeviceId:`device_${"a".repeat(32)}`,
    data:clone(data),
    tombstone:null
  };
  value.contentHash=hash({objectType:"sharedState",objectId:rivalryId,revision,data:value.data});
  return value;
}

function createRuntime(){
  const events=[];
  const raw={
    saveLibrary:JSON.stringify(library),
    activeShowdown:null,
    legacyShowdowns:'[{"id":"legacy-preserved"}]',
    preferences:'{"schemaVersion":2,"reducedMotion":false,"menuFeedback":true}'
  };
  let transactionArgs=null;
  const context={
    console,
    crypto:crypto.webcrypto,
    TextEncoder,
    Blob,
    structuredClone,
    setTimeout,
    clearTimeout
  };
  context.window=context;
  vm.createContext(context);
  for(const file of ["js/saveLibraryFoundation.js","js/importAnalysis.js","js/storageTransaction.js"]){
    vm.runInContext(read(file),context,{filename:file});
  }
  const snapshot=()=>clone(raw);
  context.captureCareerModeRawRestoreSnapshot=()=>({ok:true,raw:{activeShowdown:raw.activeShowdown,legacyShowdowns:raw.legacyShowdowns,preferences:raw.preferences},failedKeys:[]});
  context.captureCareerModeRawSaveLibraryMigrationSnapshot=()=>({ok:true,raw:snapshot(),failedKeys:[]});
  context.flushPendingApplicationWrites=()=>{events.push("flush");return true;};
  context.createCareerModeBackupEnvelope=async()=>{
    events.push("backup-create");
    return {formatVersion:2,runtimeRevision:"1.8.0-r1",exportedAt:"2026-08-24T12:00:00.000Z",checksum:"backup-ok",payload:{saveLibrary:JSON.parse(raw.saveLibrary)}};
  };
  context.verifyCareerModeBackupEnvelopeChecksum=async backup=>{events.push("backup-verify");return backup.checksum==="backup-ok";};
  context.downloadCareerModeBackupEnvelope=backup=>{events.push("backup-download");return backup;};
  context.applyCareerModeRawStorageTransaction=(candidateRaw,expectedRaw,options)=>{
    events.push("transaction");
    transactionArgs={candidateRaw:clone(candidateRaw),expectedRaw:clone(expectedRaw),options:clone(options)};
    return context.runCareerModeRawStorageTransaction(candidateRaw,{
      read:name=>({ok:true,value:raw[name]}),
      write:(name,value)=>{raw[name]=value;return true;}
    },expectedRaw,options);
  };
  context.CareerModeSaveLibraryRuntime={
    invalidateAuthority(){events.push("invalidate");},
    async activate(){events.push("activate");return {ok:true};},
    async switchActiveSave(saveId){events.push(`switch:${saveId}`);return true;}
  };
  vm.runInContext(read("js/restore.js"),context,{filename:"js/restore.js"});
  return {context,raw,events,snapshot,transactionArgs:()=>transactionArgs};
}

(async()=>{
  const runtime=createRuntime();
  const {context,raw,events,snapshot}=runtime;
  const target={saveId:localSave,profileId:localP2,managerRole:"playerTwo"};
  const remoteEnvelope=envelope();
  const original=snapshot();

  const preview=await context.prepareCareerModeRemoteReconciliationIntent({rivalryId,envelope:remoteEnvelope,target});
  assert.equal(preview.ok,true,JSON.stringify(preview));
  assert.equal(preview.status,"preview-ready");
  assert.equal(preview.preview.mutating,false);
  assert.equal(preview.preview.remoteRevision,1);
  assert.equal(preview.preview.localSaveId,localSave);
  assert.ok(Object.isFrozen(preview.intent));
  assert.ok(Object.isFrozen(preview.intent.expectedRaw));
  assert.ok(Object.isFrozen(preview.intent.candidateRaw));
  assert.match(preview.intent.confirmationText,/remote revision 1/i);
  assert.match(preview.intent.confirmationText,new RegExp(localSave));
  assert.deepEqual(snapshot(),original,"Preview must not mutate canonical browser storage.");
  assert.deepEqual(events,[],"Preview must not flush, back up, download or transact.");

  const candidateLibrary=JSON.parse(preview.intent.candidateRaw.saveLibrary);
  const candidateTarget=candidateLibrary.saves.find(entry=>entry.saveId===localSave).showdown;
  assert.equal(candidateTarget.name,"Remote Authoritative");
  assert.equal(candidateTarget.score.playerOne,5);
  assert.equal(candidateTarget.id,"local-target","The local legacy record identity must remain local.");
  assert.equal(candidateTarget.identity.saveId,localSave,"The exact local Save identity must remain local.");
  assert.deepEqual(candidateTarget.identity.managerProfileIds,{playerOne:localP1,playerTwo:localP2},"Peer profile identifiers must not enter the local Save Library.");
  assert.equal(candidateTarget.rounds[0].seasonId,localSeason,"Existing local Season identity must remain stable while gameplay is reconciled.");
  assert.deepEqual(candidateLibrary.saves.find(entry=>entry.saveId===otherSave).showdown,localOther,"Unrelated saves must remain byte-semantically unchanged.");
  assert.equal(preview.intent.candidateRaw.legacyShowdowns,original.legacyShowdowns);
  assert.equal(preview.intent.candidateRaw.preferences,original.preferences);
  assert.equal(preview.intent.candidateRaw.activeShowdown,null);

  const unconfirmed=await context.applyCareerModeRemoteReconciliation(preview.intent,{verifyRemote:async()=>({ok:true,exists:true,tombstoned:false,envelope:remoteEnvelope})});
  assert.equal(unconfirmed.ok,false);
  assert.equal(unconfirmed.status,"confirmation-required");
  assert.deepEqual(snapshot(),original);
  assert.deepEqual(events,[]);

  raw.preferences='{"schemaVersion":2,"reducedMotion":true,"menuFeedback":true}';
  const localStale=await context.applyCareerModeRemoteReconciliation(preview.intent,{
    confirmed:true,
    confirmationFingerprint:preview.intent.confirmationFingerprint,
    verifyRemote:async()=>{events.push("remote");return {ok:true,exists:true,tombstoned:false,envelope:remoteEnvelope};}
  });
  assert.equal(localStale.ok,false);
  assert.equal(localStale.status,"stale-state");
  assert.deepEqual(events,["flush"]);
  raw.preferences=original.preferences;
  events.length=0;

  const revision2Data=clone(remoteData);
  revision2Data.mutationReceipt={idempotencyKeyHash:"1".repeat(64),requestFingerprint:`sha256:${"2".repeat(64)}`,baseRevision:1};
  revision2Data.payload.score.playerOne=6;
  const revision2=envelope(2,revision2Data);
  let remoteReads=0;
  const remoteStale=await context.applyCareerModeRemoteReconciliation(preview.intent,{
    confirmed:true,
    confirmationFingerprint:preview.intent.confirmationFingerprint,
    verifyRemote:async phase=>{
      events.push(`remote:${phase}`);
      remoteReads+=1;
      return {ok:true,exists:true,tombstoned:false,envelope:remoteReads===1?remoteEnvelope:revision2};
    }
  });
  assert.equal(remoteStale.ok,false);
  assert.equal(remoteStale.status,"remote-stale");
  assert.ok(remoteStale.backup,"The canonical backup must remain reported when a post-backup remote guard blocks Apply.");
  assert.deepEqual(snapshot(),original);
  assert.equal(events.includes("transaction"),false);
  assert.ok(events.indexOf("backup-download")<events.indexOf("remote:after-backup"));
  events.length=0;

  const applied=await context.applyCareerModeRemoteReconciliation(preview.intent,{
    confirmed:true,
    confirmationFingerprint:preview.intent.confirmationFingerprint,
    verifyRemote:async phase=>{events.push(`remote:${phase}`);return {ok:true,exists:true,tombstoned:false,envelope:remoteEnvelope};}
  });
  assert.equal(applied.ok,true,JSON.stringify(applied));
  assert.equal(applied.status,"success");
  assert.equal(applied.remoteRevision,1);
  assert.equal(applied.localSaveId,localSave);
  assert.equal(applied.backup.checksum,"backup-ok");
  assert.deepEqual(runtime.transactionArgs().options,{order:["activeShowdown","legacyShowdowns","preferences","saveLibrary"],guardRequestedBeforeEachWrite:true});
  assert.deepEqual(runtime.transactionArgs().expectedRaw,original);
  assert.equal(events.filter(event=>event.startsWith("remote:")).length,2,"Remote authority must be checked before and after backup.");
  for(const [before,after] of [["flush","remote:before-backup"],["remote:before-backup","backup-create"],["backup-create","backup-verify"],["backup-verify","backup-download"],["backup-download","remote:after-backup"],["remote:after-backup","invalidate"],["invalidate","transaction"],["transaction","activate"],["activate",`switch:${localSave}`]]){
    assert.ok(events.indexOf(before)>=0&&events.indexOf(before)<events.indexOf(after),`${before} must precede ${after}`);
  }
  assert.equal(raw.legacyShowdowns,original.legacyShowdowns);
  assert.equal(raw.preferences,original.preferences);
  assert.equal(raw.activeShowdown,null);
  const committedLibrary=JSON.parse(raw.saveLibrary);
  assert.equal(committedLibrary.saves.find(entry=>entry.saveId===localSave).showdown.score.playerOne,5);
  assert.deepEqual(committedLibrary.saves.find(entry=>entry.saveId===otherSave).showdown,localOther);

  const badEnvelope=clone(remoteEnvelope);
  badEnvelope.contentHash=`sha256:${"9".repeat(64)}`;
  const badPreview=await context.prepareCareerModeRemoteReconciliationIntent({rivalryId,envelope:badEnvelope,target});
  assert.equal(badPreview.ok,false);
  assert.equal(badPreview.status,"remote-integrity-failed");

  const source=read("js/sparkConnectedRivalry.js");
  assert.match(source,/REMOTE OBSERVED/);
  assert.match(source,/LOCAL TARGET/);
  assert.match(source,/LOCAL COMMIT/);
  assert.match(source,/PREVIEW REMOTE → LOCAL/);
  assert.match(source,/BACK UP \+ APPLY EXACT REVISION/);
  assert.match(source,/automaticLocalApply:false/);
  assert.doesNotMatch(source,/sessions\/|sessionId|private-session/,"Stage 5 session orchestration must remain absent.");

  process.stdout.write("PASS Stage 4 remote-to-local reconciliation: non-mutating preview, local identity preservation, immutable exact intent, backup-before-Apply, dual remote guards and Candidate C transaction authority\n");
})().catch(error=>{
  process.stderr.write(`${error&&error.stack?error.stack:error}\n`);
  process.exit(1);
});
