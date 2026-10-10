// JOB-1051: the rival-readable public Transfer ledger must never hold a value that can be derived from public inputs plus a guessable private payload.
// Design: a lock's operationHash commits to the payload AND a fresh random salt that is stored only in the actor's own private role document.
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
// The exact payload-bound hash that r66 clients wrote into the public ledger (no salt).
const legacyHash=(actorRole,type,operationId,baseRevision,payload)=>sha({actorRole,type,operationId,baseRevision,...payload});
// The salted commitment: the same payload hash plus the salt held in the actor's private role document.
const saltedHash=(actorRole,type,operationId,baseRevision,payload,salt)=>sha({actorRole,type,operationId,baseRevision,...payload,salt});
const publicOnlyHash=(actorRole,type,operationId,baseRevision)=>sha({actorRole,type,operationId,baseRevision});
const SALT=/^[0-9a-f]{64}$/;

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
  assert.equal(matches,0,'no catalog guess list may reproduce the public ledger hash for a guess lock (an unsalted attacker finds nothing)');
  for(const slot of [1,2,3])for(const o of options){if(legacyHash('playerOne','lock-guesses',op(4),3,{guesses:[{slot,...o}]})===storedHash)matches++;}
  assert.equal(matches,0,'single-guess lists must not reproduce the public ledger hash either');
  assert.notEqual(storedHash,publicOnlyHash('playerOne','lock-guesses',op(4),3),'the lock hash is not a function of public inputs alone');
  // The commitment is exactly the salted payload hash, and the salt lives only in the actor's own private role document.
  const own1=h.store.get(p1Path);
  assert.match(own1.guessSalt,SALT,'the guess salt is 32 random bytes as 64 lowercase hex');assert.equal(own1.signingSalt,null,'no signing salt before the signings lock');
  assert.equal(storedHash,saltedHash('playerOne','lock-guesses',op(4),3,{guesses:p1Guesses},own1.guessSalt),'operationHash must commit to the payload and the stored salt');
  // Even an attacker who knows every public input AND the real payload cannot confirm it without the salt, and the salt is never public.
  assert.notEqual(storedHash,legacyHash('playerOne','lock-guesses',op(4),3,{guesses:p1Guesses}),'the real payload alone must not reproduce the public hash');
  const publicText=JSON.stringify(publicLedger);
  for(const g of p1Guesses)assert.equal(publicText.includes(g.valueId),false,'public ledger must not contain guess ids');
  assert.equal(publicText.includes(own1.guessSalt),false,'public ledger must not contain the salt');
  assert.deepEqual(own1.guesses,p1Guesses,'the private role document still holds the guesses');
  // The salt is not derivable from anything public.
  for(const candidate of [sha({operationId:op(4)}),storedHash,publicOnlyHash('playerOne','lock-guesses',op(4),3)])assert.notEqual(candidate.slice('sha256:'.length),own1.guessSalt);
  // The rival cannot even see the role document through the provider before completion.
  r=await Provider.read(h.options('playerTwo',1_101_050));assert.equal(r.ok,true);assert.equal(r.opponentInputs,null,'rival gets no opponent inputs (and so no salt) before completion');
  assert.equal(JSON.stringify(r).includes(own1.guessSalt),false,'nothing the rival can read through the provider holds the salt');

  // 1b. Same guesses, same public inputs, two locks: different hashes (fresh salt each time).
  const twin=await (async()=>{const x=createHarness();await toGuessEntry(x);return x;})();
  r=await Provider.lockGuesses({...twin.options('playerOne',1_101_000),operationId:op(4),baseRevision:3,guesses:p1Guesses});assert.equal(r.ok,true);
  const twinLedger=twin.store.get(twin.key('rivalries',rivalryId,'transferChallenges','season_1'));
  assert.notEqual(twinLedger.operationHashes[3],storedHash,'identical guesses and public inputs must still produce a different commitment');
  assert.notEqual(twin.store.get(twin.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerOne')).guessSalt,own1.guessSalt,'salts are fresh per lock');

  // 2. Idempotent replay is accepted and does not change anything.
  const before=JSON.stringify(h.store.get(transferPath)),beforeOwn=JSON.stringify(h.store.get(p1Path));
  r=await Provider.lockGuesses({...h.options('playerOne',1_101_500),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,true);assert.equal(r.replayed,true);assert.equal(r.revision,4);
  assert.equal(JSON.stringify(h.store.get(transferPath)),before,'replay must not rewrite the ledger');
  assert.equal(JSON.stringify(h.store.get(p1Path)),beforeOwn,'replay must not rewrite the private role document or its salt');

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
  // A stored salt that no longer matches the ledger commitment is a conflict, not a silent accept.
  const flipped=h.store.get(p1Path);h.store.set(p1Path,{...flipped,guessSalt:'0'.repeat(64)});
  r=await Provider.lockGuesses({...h.options('playerOne',1_101_950),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','a replay recomputes with the stored salt: a different salt must conflict');
  h.store.set(p1Path,flipped);

  // 4. Signings: same privacy and replay rules, with their own fresh salt.
  r=await Provider.lockGuesses({...h.options('playerTwo',1_102_000),operationId:op(5),baseRevision:4,guesses:p2Guesses});assert.equal(r.state.phase,'SIGNING_ENTRY');
  const p1Signings=[{slot:1,name:'Player A',leagueId:'england-premier-league',nationalityId:'spain'},{slot:2,name:'Player B',leagueId:'italy-serie-a',nationalityId:'brazil'}];
  r=await Provider.lockSignings({...h.options('playerOne',1_103_000),operationId:op(6),baseRevision:5,signings:p1Signings});assert.equal(r.ok,true);
  const ledger2=h.store.get(transferPath),own1b=h.store.get(p1Path);
  assert.match(own1b.signingSalt,SALT);assert.notEqual(own1b.signingSalt,own1b.guessSalt,'the signings lock has its own fresh salt');assert.equal(own1b.guessSalt,own1.guessSalt,'the guess salt is immutable across the signings lock');
  assert.equal(ledger2.operationHashes[5],saltedHash('playerOne','lock-signings',op(6),5,{signings:p1Signings},own1b.signingSalt));
  assert.notEqual(ledger2.operationHashes[5],legacyHash('playerOne','lock-signings',op(6),5,{signings:p1Signings}));
  assert.notEqual(ledger2.operationHashes[5],publicOnlyHash('playerOne','lock-signings',op(6),5));
  assert.equal(ledger2.operationHashes[4],saltedHash('playerTwo','lock-guesses',op(5),4,{guesses:p2Guesses},h.store.get(p2Path).guessSalt));
  assert.notEqual(ledger2.operationHashes[4],legacyHash('playerTwo','lock-guesses',op(5),4,{guesses:p2Guesses}));
  r=await Provider.lockSignings({...h.options('playerOne',1_103_100),operationId:op(6),baseRevision:5,signings:p1Signings});
  assert.equal(r.ok,true);assert.equal(r.replayed,true);
  r=await Provider.lockSignings({...h.options('playerOne',1_103_200),operationId:op(6),baseRevision:5,signings:[{...p1Signings[0],name:'Player Z'}]});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT');

  // 5. Public-only operations keep their historical hash shape (no salt, no private payload).
  assert.equal(ledger2.operationHashes[0],publicOnlyHash('playerOne','start-window',op(1),0));
  assert.equal(ledger2.operationHashes[0],legacyHash('playerOne','start-window',op(1),0,{}));
  assert.equal(ledger2.operationHashes[1],publicOnlyHash('playerOne','request-end-window',op(2),1));

  // 6. Completion: both role documents carry salts and the whole thing reads back, for both managers.
  const p2Signings=[{slot:1,name:'Player C',leagueId:'germany-bundesliga',nationalityId:'france'}];
  r=await Provider.lockSignings({...h.options('playerTwo',1_104_000),operationId:op(7),baseRevision:6,signings:p2Signings});assert.equal(r.ok,true);assert.equal(r.state.phase,'COMPLETED');
  for(const role of ['playerOne','playerTwo']){r=await Provider.read(h.options(role,1_104_100));assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.state.phase,'COMPLETED');assert.equal(r.opponentInputs!==null,true);}
  const own2=h.store.get(p2Path),finalLedger=h.store.get(transferPath);
  assert.equal(finalLedger.operationHashes[6],saltedHash('playerTwo','lock-signings',op(7),6,{signings:p2Signings},own2.signingSalt));
  assert.equal(Object.keys(own2).length,14,'new role documents carry the 12 r66 keys plus guessSalt and signingSalt');

  // 7. Role documents written by r66 (no salt keys, unsalted payload hash in the ledger) still read, replay and conflict correctly.
  const legacy=await (async()=>{const x=createHarness();await toGuessEntry(x);return x;})();
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_101_000),operationId:op(4),baseRevision:3,guesses:p1Guesses});assert.equal(r.ok,true);
  const lp=legacy.key('rivalries',rivalryId,'transferChallenges','season_1'),lroleOne=legacy.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerOne');
  const toR66=(ledgerPath,rolePath,hashIndex,hash)=>{
    const led=legacy.store.get(ledgerPath);led.operationHashes[hashIndex]=hash;legacy.store.set(ledgerPath,led);
    const role=legacy.store.get(rolePath);delete role.guessSalt;delete role.signingSalt;legacy.store.set(rolePath,role);
  };
  toR66(lp,lroleOne,3,legacyHash('playerOne','lock-guesses',op(4),3,{guesses:p1Guesses}));
  assert.equal(Object.keys(legacy.store.get(lroleOne)).length,12,'fixture: an r66 role document has exactly the 12 original keys');
  r=await Provider.read(legacy.options('playerTwo',1_101_100));assert.equal(r.ok,true);assert.equal(r.state.revision,4);
  r=await Provider.read(legacy.options('playerOne',1_101_150));assert.equal(r.ok,true,'the r66 owner reads its own unsalted role document');assert.deepEqual(r.ownInputs.guesses,p1Guesses);
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_101_200),operationId:op(4),baseRevision:3,guesses:p1Guesses});
  assert.equal(r.ok,true);assert.equal(r.replayed,true,'replay of an r66-written lock must be accepted');
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_101_300),operationId:op(4),baseRevision:3,guesses:other});
  assert.equal(r.ok,false);assert.equal(r.code,'TRANSFER_IDEMPOTENCY_CONFLICT','conflicting replay of an r66-written lock must fail');
  r=await Provider.lockGuesses({...legacy.options('playerTwo',1_102_000),operationId:op(5),baseRevision:4,guesses:p2Guesses});assert.equal(r.ok,true);
  // A new client finishing a season that r66 started: its own signings lock is salted, the r66 guess lock stays unsalted (guessSalt null).
  r=await Provider.lockSignings({...legacy.options('playerOne',1_103_000),operationId:op(6),baseRevision:5,signings:p1Signings});assert.equal(r.ok,true,JSON.stringify(r));
  const mixed=legacy.store.get(lroleOne);
  assert.equal(mixed.guessSalt,null,'an r66 guess lock has no salt');assert.match(mixed.signingSalt,SALT);
  assert.equal(legacy.store.get(lp).operationHashes[3],legacyHash('playerOne','lock-guesses',op(4),3,{guesses:p1Guesses}));
  assert.equal(legacy.store.get(lp).operationHashes[5],saltedHash('playerOne','lock-signings',op(6),5,{signings:p1Signings},mixed.signingSalt));
  r=await Provider.lockGuesses({...legacy.options('playerOne',1_103_100),operationId:op(4),baseRevision:3,guesses:p1Guesses});assert.equal(r.ok,true);assert.equal(r.replayed,true,'the r66 guess lock still replays after the salted signings lock');
  r=await Provider.lockSignings({...legacy.options('playerOne',1_103_200),operationId:op(6),baseRevision:5,signings:p1Signings});assert.equal(r.ok,true);assert.equal(r.replayed,true);
  assert.equal(legacy.store.has(p1Path),true);assert.equal(legacy.store.has(p2Path),true);

  // 8. Only the two valid role-document shapes read: r66 (no salt keys) and salted (both keys, each null or 64 lowercase hex).
  const shape=await (async()=>{const x=createHarness();await toGuessEntry(x);return x;})();
  r=await Provider.lockGuesses({...shape.options('playerOne',1_101_000),operationId:op(4),baseRevision:3,guesses:p1Guesses});assert.equal(r.ok,true);
  const sp=shape.key('rivalries',rivalryId,'transferChallenges','season_1','roles','playerOne'),good=shape.store.get(sp);
  const readP1=async()=>Provider.read(shape.options('playerOne',1_101_500));
  for(const [label,mutate] of [
    ['uppercase hex salt',d=>{d.guessSalt=d.guessSalt.toUpperCase();}],
    ['63-character salt',d=>{d.guessSalt=d.guessSalt.slice(1);}],
    ['65-character salt',d=>{d.guessSalt+='a';}],
    ['non-hex salt',d=>{d.guessSalt='g'+d.guessSalt.slice(1);}],
    ['numeric salt',d=>{d.guessSalt=7;}],
    ['empty-string salt',d=>{d.guessSalt='';}],
    ['signing salt without a signings lock',d=>{d.signingSalt='a'.repeat(64);}],
    ['only guessSalt present',d=>{delete d.signingSalt;}],
    ['only signingSalt present',d=>{delete d.guessSalt;}],
    ['unknown extra key',d=>{d.extra=true;}]
  ]){
    shape.store.set(sp,{...good});mutate(shape.store.get(sp));
    r=await readP1();assert.equal(r.ok,false,`${label} must not read`);assert.match(r.code,/^TRANSFER_PROVIDER_STATE_INVALID$|^TRANSFER_PRIVATE_STATE_INVALID$/,label);
  }
  shape.store.set(sp,{...good});r=await readP1();assert.equal(r.ok,true,'the untouched salted document reads');
  const noSalts={...good};delete noSalts.guessSalt;delete noSalts.signingSalt;shape.store.set(sp,noSalts);r=await readP1();assert.equal(r.ok,true,'an r66 document without salt keys reads');
  shape.store.set(sp,{...good,signingSalt:null});r=await readP1();assert.equal(r.ok,true,'explicit null salts read');

  console.log('PASS JOB-1051 Transfer ledger privacy: lock hashes commit to the private payload plus a random salt kept only in the actor\'s own role document (40000-list brute force finds no match, fresh salt per lock, rival never sees it), idempotent replays succeed, conflicting replays fail with TRANSFER_IDEMPOTENCY_CONFLICT, r66 unsalted role documents still read and replay, and only the r66 and salted shapes are accepted.');
})().catch(error=>{console.error(error);process.exitCode=1;});
