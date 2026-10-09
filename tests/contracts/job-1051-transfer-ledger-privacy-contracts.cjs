// JOB-1051: the rival-readable public Transfer ledger must never hold a value derived from a private payload.
const assert=require('node:assert/strict');
const nodeCrypto=require('node:crypto');
const {webcrypto}=nodeCrypto;
global.window=globalThis;
require('../../data/transferOptions.js');
const leagueIds=global.FIFA17_TRANSFER_LEAGUES.map(item=>item.id);
const nationalityIds=global.FIFA17_TRANSFER_NATIONALITIES.map(item=>item.id);
const Provider=require('../../js/sparkSharedTransferChallenge.js');

const rivalryId='pair_'+('a'.repeat(64));
const sessionId='session_'+('b'.repeat(64));
const device1='device_'+('1'.repeat(32));
const device2='device_'+('2'.repeat(32));
const uid1='manager_one';
const uid2='manager_two';
const op=n=>`transfer_op_${Number(n).toString(16).padStart(32,'0')}`;
const ts=millis=>({toMillis:()=>millis});
function clone(value){
  if(value===undefined)return undefined;
  const text=JSON.stringify(value,(_key,item)=>item&&typeof item.toMillis==='function'?{__millis:item.toMillis()}:item);
  return JSON.parse(text,(_key,item)=>item&&Number.isFinite(item.__millis)?ts(item.__millis):item);
}

function createHarness(){
  const store=new Map(),getLog=[];
  const key=(...parts)=>parts.join('/');
  const put=(path,value)=>store.set(path,clone(value));
  put(key('accounts',uid1),{objectType:'account',objectId:uid1,lifecycleState:'live',data:{status:'active'}});
  put(key('accounts',uid2),{objectType:'account',objectId:uid2,lifecycleState:'live',data:{status:'active'}});
  put(key('accounts',uid1,'devices',device1),{objectType:'device',objectId:device1,lifecycleState:'live',data:{deviceId:device1,state:'active'}});
  put(key('accounts',uid2,'devices',device2),{objectType:'device',objectId:device2,lifecycleState:'live',data:{deviceId:device2,state:'active'}});
  put(key('rivalries',rivalryId),{objectType:'rivalry',objectId:rivalryId,lifecycleState:'live',data:{connectionState:'active',authorizedAccountIds:[uid1,uid2],managerSlots:[{slotId:'playerOne',accountId:uid1,entitlementState:'active'},{slotId:'playerTwo',accountId:uid2,entitlementState:'active'}]}});
  put(key('rivalries',rivalryId,'sessions',sessionId),{objectType:'session',objectId:sessionId,lifecycleState:'live',data:{rivalryId,state:'active',memberAccountIds:[uid1,uid2],expiresAt:ts(10_000_000)}});
  put(key('rivalries',rivalryId,'sharedSetup','authoritative'),{schemaVersion:1,objectType:'sharedSetupLedger',rivalryId,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo']});
  put(key('rivalries',rivalryId,'careerStart','authoritative'),{schemaVersion:1,objectType:'sharedCareerStart',rivalryId,setupRevision:6,totalSeasons:3,revision:2,phase:'CAREER_START_READY',acknowledgedRoles:['playerOne','playerTwo']});
  let nowForServerTimestamp=0;
  const sdk={
    doc:(_db,...parts)=>key(...parts),
    Timestamp:{fromMillis:millis=>ts(millis)},
    serverTimestamp:()=>ts(nowForServerTimestamp),
    runTransaction:async(_db,callback)=>{
      const pending=[];
      const transaction={
        get:async ref=>{getLog.push(ref);return {exists:()=>store.has(ref),data:()=>clone(store.get(ref))};},
        set:(ref,value)=>pending.push([ref,clone(value)])
      };
      const result=await callback(transaction);
      pending.forEach(([ref,value])=>store.set(ref,value));
      return result;
    }
  };
  const options=(role,nowEpochMs)=>{nowForServerTimestamp=nowEpochMs;return {user:{uid:role==='playerOne'?uid1:uid2},firestore:{},firebaseSdk:sdk,rivalryId,sessionId,deviceId:role==='playerOne'?device1:device2,seasonNumber:1,cryptoImpl:webcrypto,nowEpochMs};};
  return {store,getLog,options,key};
}


function canonical(value){
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
const sha=value=>'sha256:'+nodeCrypto.createHash('sha256').update(canonical(value)).digest('hex');
// The exact payload-bound hash that r66 clients wrote into the public ledger.
const legacyHash=(actorRole,type,operationId,baseRevision,payload)=>sha({actorRole,type,operationId,baseRevision,...payload});
const publicOnlyHash=(actorRole,type,operationId,baseRevision)=>sha({actorRole,type,operationId,baseRevision});

async function toGuessEntry(h){
  let r=await Provider.startWindow({...h.options('playerOne',1_000_000),operationId:op(1),baseRevision:0});assert.equal(r.ok,true);
  r=await Provider.requestEndWindow({...h.options('playerOne',1_100_000),operationId:op(2),baseRevision:1});assert.equal(r.ok,true);
  r=await Provider.requestEndWindow({...h.options('playerTwo',1_100_500),operationId:op(3),baseRevision:2});assert.equal(r.state.phase,'GUESS_ENTRY');
}

(async()=>{
  const h=await (async()=>{const x=createHarness();await toGuessEntry(x);return x;})();
  const transferPath=h.key('rivalries',rivalryId,'transferChallenges','season_1');
  const p1Path=h.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerOne');
  const p2Path=h.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerTwo');

  const p1Guesses=[{slot:1,type:'league',valueId:'spain-primera-division'},{slot:2,type:'nationality',valueId:'brazil'}];
  const p2Guesses=[{slot:1,type:'league',valueId:'england-premier-league'},{slot:2,type:'nationality',valueId:'brazil'}];
  let r=await Provider.lockGuesses({...h.options('playerOne',1_101_000),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,true);assert.equal(r.replayed,false);

  // 1. Brute force every catalog guess list in the (slot 1, slot 2) space, including the real one, against the public ledger.
  const publicLedger=h.store.get(transferPath);
  const storedHash=publicLedger.operationHashes[3];
  assert.match(storedHash,/^sha256:[0-9a-f]{64}$/,'ledger must keep the HASH format Rules validate');
  const options=[...leagueIds.map(valueId=>({type:'league',valueId})),...nationalityIds.map(valueId=>({type:'nationality',valueId}))];
  assert.equal(options.length,200);
  let tried=0,matches=0;
  for(const a of options)for(const b of options){
    const guesses=[{slot:1,...a},{slot:2,...b}];tried++;
    if(legacyHash('playerOne','lock-guesses',op(4),3,{guesses})===storedHash)matches++;
  }
  assert.equal(tried,40000);
  assert.equal(matches,0,'no catalog guess list may reproduce the public ledger hash for a guess lock');
  for(const slot of [1,2,3])for(const o of options){if(legacyHash('playerOne','lock-guesses',op(4),3,{guesses:[{slot,...o}]})===storedHash)matches++;}
  assert.equal(matches,0,'single-guess lists must not reproduce the public ledger hash either');
  assert.equal(storedHash,publicOnlyHash('playerOne','lock-guesses',op(4),3),'lock hash must be a function of public inputs only');
  const publicText=JSON.stringify(publicLedger);
  for(const g of p1Guesses)assert.equal(publicText.includes(g.valueId),false,'public ledger must not contain guess ids');
  assert.deepEqual(h.store.get(p1Path).guesses,p1Guesses,'the private role document still holds the guesses');

  // 2. Idempotent replay is accepted and does not change anything.
  const before=JSON.stringify(h.store.get(transferPath));
  r=await Provider.lockGuesses({...h.options('playerOne',1_101_500),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,true);assert.equal(r.replayed,true);assert.equal(r.revision,4);
  assert.equal(JSON.stringify(h.store.get(transferPath)),before,'replay must not rewrite the ledger');

  // 3. Conflicting replays still fail.
  const other=[{slot:1,type:'league',valueId:'italy-serie-a'},{slot:2,type:'nationality',valueId:'brazil'}];
  r=await Provider.lockGuesses({...h.options('playerOne',1_101_600),operationId:op(4),baseRevision:3,guesses:other});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','different guesses under the same operation id must conflict');
  r=await Provider.lockGuesses({...h.options('playerOne',1_101_700),operationId:op(4),baseRevision:2,guesses:p1Guesses});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','different base revision under the same operation id must conflict');
  r=await Provider.requestEndWindow({...h.options('playerOne',1_101_800),operationId:op(4),baseRevision:3});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','different operation type under the same operation id must conflict');
  r=await Provider.lockGuesses({...h.options('playerTwo',1_101_900),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','another manager cannot replay someone else\'s operation id');
  assert.equal(JSON.stringify(h.store.get(transferPath)),before);

  // 4. Signings: same privacy and replay rules.
  r=await Provider.lockGuesses({...h.options('playerTwo',1_102_000),operationId:op(5),baseRevision:4,guesses:p2Guesses});assert.equal(r.state.phase,'SIGNING_ENTRY');
  const p1Signings=[{slot:1,name:'Player A',leagueId:'england-premier-league',nationalityId:'spain'},{slot:2,name:'Player B',leagueId:'italy-serie-a',nationalityId:'brazil'}];
  r=await Provider.lockSignings({...h.options('playerOne',1_103_000),operationId:op(6),baseRevision:5,signings:p1Signings});assert.equal(r.ok,true);
  const ledger2=h.store.get(transferPath);
  assert.equal(ledger2.operationHashes[5],publicOnlyHash('playerOne','lock-signings',op(6),5));
  assert.notEqual(ledger2.operationHashes[5],legacyHash('playerOne','lock-signings',op(6),5,{signings:p1Signings}));
  assert.notEqual(ledger2.operationHashes[4],legacyHash('playerTwo','lock-guesses',op(5),4,{guesses:p2Guesses}));
  r=await Provider.lockSignings({...h.options('playerOne',1_103_100),operationId:op(6),baseRevision:5,signings:p1Signings});
  assert.equal(r.ok,true);assert.equal(r.replayed,true);
  r=await Provider.lockSignings({...h.options('playerOne',1_103_200),operationId:op(6),baseRevision:5,signings:[{...p1Signings[0],name:'Player Z'}]});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT');

  // 5. Public-only operations keep their historical hash shape.
  assert.equal(ledger2.operationHashes[0],publicOnlyHash('playerOne','start-window',op(1),0));
  assert.equal(ledger2.operationHashes[0],legacyHash('playerOne','start-window',op(1),0,{}));

  // 6. Ledgers written by r66 (payload-bound hashes) still read and still replay or conflict correctly.
  const legacy=await (async()=>{const x=createHarness();await toGuessEntry(x);return x;})();
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_101_000),operationId:op(4),baseRevision:3,guesses:p1Guesses});assert.equal(r.ok,true);
  const lp=legacy.key('rivalries',rivalryId,'transferChallenges','season_1');
  const led=legacy.store.get(lp);led.operationHashes[3]=legacyHash('playerOne','lock-guesses',op(4),3,{guesses:p1Guesses});legacy.store.set(lp,led);
  r=await Provider.read(legacy.options('playerTwo',1_101_100));assert.equal(r.ok,true);assert.equal(r.state.revision,4);
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_101_200),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,true);assert.equal(r.replayed,true,'replay of an r66-written lock must be accepted');
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_101_300),operationId:op(4),baseRevision:3,guesses:other});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','conflicting replay of an r66-written lock must fail');
  r=await Provider.lockGuesses({...legacy.options('playerTwo',1_102_000),operationId:op(5),baseRevision:4,guesses:p2Guesses});assert.equal(r.ok,true);
  assert.equal(legacy.store.has(p1Path),true);assert.equal(legacy.store.has(p2Path),true);

  console.log('PASS JOB-1051 Transfer ledger privacy: public operationHashes never derive from private guesses or signings (40000-list brute force finds no match), idempotent replays succeed, conflicting replays fail with TRANSFER_IDEMPOTENCY_CONFLICT, and r66-written ledgers still read and replay.');
})().catch(error=>{console.error(error);process.exitCode=1;});
