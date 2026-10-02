'use strict';
// JOB-07 career index contracts. Plain node:assert, no Firebase, no emulator.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const Pair=require(path.join(root,'js/persistentNikDanielPair.js'));
const rid=n=>`pair_${n.toString(16).padStart(64,'0')}`;
const ts=ms=>({toMillis:()=>ms});
const CAP=500;

(async()=>{
  // 1. constants
  assert.equal(Pair.careerIndexPageCapacity,CAP);
  const fragment=read('firestore.persistent-pair-production.fragment.rules');
  assert.match(fragment,/function cmsCareerIndexPageCapacity\(\) \{\s*return 500;\s*\}/,'Rules capacity must equal the client constant');

  // 2. pure append plan
  const at=ts(1);
  let w=await Pair.planCareerIndexAppend({headValue:null,rivalryId:rid(1),accountId:'acct',deviceId:'device_x',now:at});
  assert.equal(w.length,1);assert.equal(w[0].indexId,'current');assert.deepEqual(w[0].value.data,{rivalryIds:[rid(1)],sealedPageCount:0});assert.equal(w[0].value.revision,0);assert.equal(w[0].value.parentRevision,null);
  const head=w[0].value;
  w=await Pair.planCareerIndexAppend({headValue:head,rivalryId:rid(2),accountId:'acct',deviceId:'device_x',now:at});
  assert.deepEqual(w[0].value.data.rivalryIds,[rid(1),rid(2)]);assert.equal(w[0].value.revision,1);assert.equal(w[0].value.priorContentHash,head.contentHash);
  assert.deepEqual(await Pair.planCareerIndexAppend({headValue:head,rivalryId:rid(1),accountId:'acct',deviceId:'device_x',now:at}),[],'already indexed: no write (idempotent)');
  const full={...head,data:{rivalryIds:Array.from({length:CAP},(_,i)=>rid(1000+i)),sealedPageCount:2}};
  w=await Pair.planCareerIndexAppend({headValue:full,rivalryId:rid(9),accountId:'acct',deviceId:'device_x',now:at});
  assert.deepEqual(w.map(x=>x.indexId),['page_3','current'],'seal page before head');
  assert.deepEqual(w[0].value.data,{pageNumber:3,rivalryIds:full.data.rivalryIds});assert.deepEqual(w[1].value.data,{rivalryIds:[rid(9)],sealedPageCount:3});
  await assert.rejects(Pair.planCareerIndexAppend({headValue:{...head,data:{rivalryIds:[rid(1),rid(1)],sealedPageCount:0}},rivalryId:rid(2),accountId:'a',deviceId:'d',now:at}),/invalid/i);
  await assert.rejects(Pair.planCareerIndexAppend({headValue:{...head,data:{rivalryIds:[rid(1)],sealedPageCount:0,extra:1}},rivalryId:rid(2),accountId:'a',deviceId:'d',now:at}),/invalid/i);

  // 3. all transaction reads before any write, both witnesses, including replacement and rollover
  function fakeTx(docs){const log=[];return {log,tx:{get:async ref=>{log.push(['get',ref]);const v=docs[ref];return {exists:()=>v!==undefined,data:()=>v};},set:(ref,value)=>{log.push(['set',ref,value]);}}};}
  const sdk={doc:(_f,...parts)=>parts.join('/'),Timestamp:{fromMillis:ts}};
  const ctx={services:{firestoreSdk:sdk,firestore:{}},accountId:'acct',deviceId:`device_${'a'.repeat(32)}`};
  const binding={saveId:`save_${'a'.repeat(24)}`,profileId:`profile_${'a'.repeat(24)}`,managerRole:'playerOne'};
  const prior={schemaVersion:1,objectType:'pairLink',objectId:'current',revision:0,lifecycleState:'live',contentHash:'sha256:p',data:{rivalryId:rid(7),managerRole:'playerOne',managerId:'daniel',linkedAt:at,lastConfirmedAt:at}};
  const closed={schemaVersion:1,objectType:'rivalry',objectId:rid(7),revision:3,lifecycleState:'live',contentHash:'sha256:r',data:{connectionState:'closed'}};
  for(const [label,docs] of [['first',{}],['replacement',{'accounts/acct/pairLinks/current':prior,[`rivalries/${rid(7)}`]:closed,'accounts/acct/careerIndex/current':head}],['rollover',{'accounts/acct/pairLinks/current':prior,[`rivalries/${rid(7)}`]:closed,'accounts/acct/careerIndex/current':full}]]){
    for(const kind of ['creation','redemption']){
      const {log,tx}=fakeTx(docs);
      const witness=kind==='creation'?Pair.createDurableCreationWitness(ctx,'playerOne',Pair.managerByRole.playerOne):Pair.createDurableRedemptionWitness(ctx,'playerOne',Pair.managerByRole.playerOne,rid(5));
      const result=await witness({transaction:tx,binding,capability:rid(5),now:at,nowEpochMs:1});
      assert.equal(result.ok,true);
      const firstSet=log.findIndex(e=>e[0]==='set');
      assert.ok(firstSet>0,`${label}/${kind}: writes happen`);
      assert.equal(log.slice(firstSet).some(e=>e[0]==='get'),false,`${label}/${kind}: no transaction.get after the first transaction.set`);
      assert.ok(log.some(e=>e[0]==='get'&&e[1]==='accounts/acct/careerIndex/current'),`${label}/${kind}: index head is read`);
      const sets=log.filter(e=>e[0]==='set').map(e=>e[1]);
      assert.ok(sets.includes('accounts/acct/pairLinks/current')&&sets.includes('accounts/acct/careerIndex/current'),`${label}/${kind}: pair link and index written together`);
      if(label==='rollover')assert.ok(sets.includes('accounts/acct/careerIndex/page_3'));
    }
  }

  // 4. readCareerIndex: never throws, ready/unavailable, ordered, memory only
  const env=(docs,{fail}={})=>({firestore:{},accountId:'acct',firebaseSdk:{doc:(_f,...p)=>p.join('/'),getDoc:async ref=>{if(fail)throw Object.assign(new Error('denied'),{code:'permission-denied'});const v=docs[ref];return {exists:()=>v!==undefined,data:()=>v};}}});
  let r=await Pair.readCareerIndex(env({}));assert.deepEqual([r.status,r.rivalryIds],['ready',[]]);
  const page1={schemaVersion:1,objectType:'careerIndexPage',objectId:'page_1',revision:0,lifecycleState:'live',contentHash:'sha256:x',data:{pageNumber:1,rivalryIds:full.data.rivalryIds}};
  const head2={...head,data:{rivalryIds:[rid(1)],sealedPageCount:1}};
  r=await Pair.readCareerIndex(env({'accounts/acct/careerIndex/current':head2,'accounts/acct/careerIndex/page_1':page1}));
  assert.equal(r.status,'ready');assert.deepEqual(r.rivalryIds,[...full.data.rivalryIds,rid(1)],'sealed pages first, oldest first');
  r=await Pair.readCareerIndex(env({'accounts/acct/careerIndex/current':head2}));assert.deepEqual([r.status,r.rivalryIds],['unavailable',[]]);
  r=await Pair.readCareerIndex(env({},{fail:true}));assert.equal(r.status,'unavailable');
  r=await Pair.readCareerIndex(env({'accounts/acct/careerIndex/current':{...head,data:{rivalryIds:'x',sealedPageCount:0}}}));assert.equal(r.status,'unavailable');
  assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.rivalryIds));
  const src=read('js/persistentNikDanielPair.js');const block=src.slice(src.indexOf('const CAREER_INDEX_HEAD_ID'),src.indexOf('function pairIsEnvelopeValue('));
  assert.doesNotMatch(block,/localStorage|sessionStorage|indexedDB|getDocs\(|collection\(|query\(/,'career index code is memory-only and reads exact documents');

  // 5. Rules text (fragment) and the composed production artifact
  assert.match(fragment,/next\[0:prior\.size\(\)\] == prior/,'exact old-order preservation');
  assert.match(fragment,/!\(next\[prior\.size\(\)\] in prior\)/,'exactly one new unique id');
  assert.match(fragment,/cmsCareerIndexPairLinkCoupled\(accountId, root\.data\.rivalryId\)/,'coupling on first pair-link creation');
  assert.match(fragment,/cmsCareerIndexPairLinkCoupled\(accountId, after\.data\.rivalryId\)/,'coupling on pair-link replacement');
  const witnessBlock=fragment.slice(fragment.indexOf('function cmsPersistentPairCreationWitnessValid'),fragment.indexOf('function cmsPersistentPairDataValid'));
  assert.doesNotMatch(witnessBlock,/careerIndex/,'rivalry create/redeem rules are at the 1,000-expression edge: never add career index checks there');
  const indexMatch=fragment.slice(fragment.indexOf('match /accounts/{accountId}/careerIndex/{indexId}'),fragment.indexOf('// CMS_PERSISTENT_PAIR_MATCH_END'));
  assert.match(indexMatch,/allow list, delete: if false;/);
  assert.doesNotMatch(fragment,/billing|blaze|cloud[\s_-]*functions|cloud[\s_-]*run/i);
  for(const script of ['scripts/build-production-firestore-rules.mjs','scripts/build-production-firestore-rules-with-persistent-pair.mjs']){const run=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);}
  const generated=read('firestore.spark.generated.rules');
  assert.equal((generated.match(/match \/accounts\/\{accountId\}\/careerIndex\/\{indexId\}/g)||[]).length,1);
  assert.equal((generated.match(/function cmsCareerIndexHeadUpdateValid\(accountId\)/g)||[]).length,1);
  console.log('PASS career index contracts: constants, pure append plan, reads-before-writes, readCareerIndex states, Rules text, composed artifact.');
})().catch(e=>{console.error(e);process.exit(1);});
