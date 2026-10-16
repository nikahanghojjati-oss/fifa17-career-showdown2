'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const pair='pair_'+'a'.repeat(64),session='session_'+'b'.repeat(64),device='device_'+'1'.repeat(32),uid='one';
const ts=n=>({toMillis:()=>n});
const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value,(_,v)=>v?.toMillis?{millis:v.toMillis()}:v),(_,v)=>v&&Number.isFinite(v.millis)?ts(v.millis):v);
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
const budgetSource=fs.readFileSync(path.join(ROOT,'js/sparkPrivatePairing.js'),'utf8');
const budgetStart=budgetSource.indexOf('// Firestore budget layer (r75).');
assert.ok(budgetStart>0,'load the real r75 budget layer');
async function world(){
  let now=1800000000000,fail=false,gate=null;
  const authorityListeners=[],snapshotListeners=[];
  const store=new Map(),counts=new Map(),serverCounts=new Map(),timers=[],events=new Map(),documentEvents=new Map(),fields=new Map(),storage=new Map();
  const base=`rivalries/${pair}`,pub=`${base}/transferChallenges/season_1`,own=`${pub}/roles/playerOne`;
  const put=(p,v)=>{store.set(p,copy(v));for(const listener of snapshotListeners)if(listener.active&&listener.path===p){counts.set(p,(counts.get(p)||0)+1);listener.next({exists:()=>store.has(p),data:()=>copy(store.get(p)),metadata:{fromCache:false,hasPendingWrites:false}});}};
  put(`accounts/${uid}`,{objectType:'account',objectId:uid,lifecycleState:'live',data:{status:'active'}});
  put(`accounts/${uid}/devices/${device}`,{objectType:'device',objectId:device,lifecycleState:'live',data:{deviceId:device,state:'active'}});
  put(base,{objectType:'rivalry',objectId:pair,lifecycleState:'live',data:{connectionState:'active',authorizedAccountIds:[uid,'two'],managerSlots:[{slotId:'playerOne',accountId:uid,entitlementState:'active'},{slotId:'playerTwo',accountId:'two',entitlementState:'active'}]}});
  const sessionValue=id=>({objectType:'session',objectId:id,lifecycleState:'live',data:{rivalryId:pair,state:'active',memberAccountIds:[uid,'two'],expiresAt:ts(now+86400000)}});
  put(`${base}/sessions/${session}`,sessionValue(session));
  const setup={schemaVersion:1,objectType:'sharedSetupLedger',rivalryId:pair,revision:6,phase:'SHOWDOWN_CONFIRMED',coordinatorRole:'playerOne',totalSeasons:3,confirmedRoles:['playerOne','playerTwo']};
  const career={schemaVersion:1,objectType:'sharedCareerStart',rivalryId:pair,setupRevision:6,totalSeasons:3,revision:2,phase:'CAREER_START_READY',acknowledgedRoles:['playerOne','playerTwo']};
  put(`${base}/sharedSetup/authoritative`,setup);put(`${base}/careerStart/authoritative`,career);
  const read=async ref=>{if(gate&&gate.path===ref.path){const held=gate;gate=null;await held.promise;}counts.set(ref.path,(counts.get(ref.path)||0)+1);serverCounts.set(ref.path,(serverCounts.get(ref.path)||0)+1);if(fail)throw Object.assign(new Error('denied'),{code:'permission-denied'});const value=copy(store.get(ref.path));return {exists:()=>value!==undefined,data:()=>value,metadata:{fromCache:false,hasPendingWrites:false}};};
  const db={},sdk={doc:(_,...parts)=>({path:parts.join('/')}),Timestamp:{fromMillis:ts},serverTimestamp:()=>ts(now),onSnapshot(ref,_options,next,error){const listener={path:ref.path,next,error,active:true};snapshotListeners.push(listener);counts.set(ref.path,(counts.get(ref.path)||0)+1);next({exists:()=>store.has(ref.path),data:()=>copy(store.get(ref.path)),metadata:{fromCache:false,hasPendingWrites:false}});return ()=>{listener.active=false;};},async runTransaction(_,fn){const writes=[];const value=await fn({get:read,set:(ref,data)=>writes.push([ref.path,data])});for(const [p,v] of writes)put(p,v);return value;}};
  const user={uid,getIdTokenResult:async()=>({issuedAtTime:new Date(now).toISOString()})},auth={currentUser:user};
  let state={ready:true,accountId:uid,rivalryId:pair,sessionId:session,deviceId:device,managerRole:'playerOne',setup};
  let remote={sessionState:'active',sessionId:session,rivalryId:pair,accountId:uid,deviceId:device,expiresAtEpochMs:now+86400000};
  const account={connected:true,accountId:uid},pairing={registered:true,deviceId:device},rivalry={attached:true,rivalryId:pair,accountId:uid,deviceId:device,binding:{managerRole:'playerOne'}};
  let setupRefreshes=0,careerRefreshes=0;
  const setupApi={getState:()=>state,async refresh(){setupRefreshes++;await read({path:`${base}/sharedSetup/authoritative`});if(!auth.currentUser||!account.connected||!rivalry.attached||remote.sessionState!=='active'||pairing.deviceId!==device)throw new Error('authority unavailable');state={...state,sessionId:remote.sessionId,deviceId:pairing.deviceId};return state;}};
  const careerApi={getState:()=>({state:career}),async refresh(){careerRefreshes++;await read({path:`${base}/careerStart/authoritative`});}};
  const services={ok:true,auth,firestore:db,firestoreSdk:sdk};
  const node=id=>{if(!fields.has(id))fields.set(id,{id,value:'',textContent:'',disabled:false,dataset:{},classList:{contains:()=>false,toggle(){},add(){},remove(){}},setAttribute(){},addEventListener:(name,fn)=>{node(id)[name]=fn;},closest:()=>null});return fields.get(id);};
  // Only presentation DOM is minimal. Provider, refresh queue, wait registration, rendering and mutation/retry are real.
  const visible=new Set(['transferChallenge','transferPhaseStatus','endTransferTimer','transferTimerDisplay','p1Signing1Name','p2Guess1Value','completeTransferChallenge','continueFromTransfers','startTransferTimer']);
  const sandbox={console,crypto:webcrypto,TextEncoder,performance:{now:()=>now},__now:()=>now,
    currentShowdown:{id:'save',currentRound:1,sharedJourney:{mode:'shared',rivalryId:pair}},
    document:{visibilityState:'visible',getElementById:id=>visible.has(id)?node(id):null,querySelector:selector=>selector==='#transferChallenge .transferTimerActions'?{append:button=>{visible.add(button.id);fields.set(button.id,button);}}:null,createElement:()=>({dataset:{},setAttribute(){},addEventListener(name,fn){this[name]=fn;}}),addEventListener:(name,fn)=>{if(!documentEvents.has(name))documentEvents.set(name,[]);documentEvents.get(name).push(fn);}},
    setInterval:(fn,ms)=>{timers.push({fn,ms});return timers.length;},setTimeout:fn=>{timers.push({fn,ms:0});return timers.length;},clearTimeout(){},
    addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},
    dispatchEvent:event=>{for(const fn of events.get(event.type)||[])fn(event);return true;},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},
    writeStorageValue:(key,value)=>{storage.set(key,value);return true;},readStorageValue:key=>storage.get(key)||null,removeStorageValue:key=>storage.delete(key),
    CareerModeProductionSharedShowdownSetup:setupApi,CareerModeProductionSharedCareerStart:careerApi,
    CareerModeSparkConnectedAccount:{getState:()=>account},CareerModeSparkPrivatePairing:{getState:()=>pairing},CareerModeSparkConnectedRivalry:{getState:()=>rivalry},CareerModeSparkRemoteJoining:{getState:()=>remote},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>services}
  };
  for(const api of [setupApi,sandbox.CareerModeSparkConnectedAccount,sandbox.CareerModeSparkPrivatePairing,sandbox.CareerModeSparkConnectedRivalry,sandbox.CareerModeSparkRemoteJoining])api.subscribe=fn=>{authorityListeners.push(fn);return ()=>{};};
  sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext('Date.now=()=>__now()',sandbox);
  vm.runInContext(budgetSource.slice(budgetStart),sandbox,{filename:'sparkPrivatePairing.js#budget'});
  for(const file of ['data/transferOptions.js','js/sharedTransferChallenge.js','js/sparkSharedTransferChallenge.js'])vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
  const provider=sandbox.CareerModeSparkSharedTransferChallenge;
  const options=()=>({user:auth.currentUser,firestore:db,firebaseSdk:sdk,rivalryId:pair,sessionId:remote.sessionId,deviceId:pairing.deviceId,seasonNumber:1,nowEpochMs:now,cryptoImpl:webcrypto});
  const command=async(method,n,extra={})=>{const revision=store.get(pub)?.revision||0;const result=await provider[method]({...options(),baseRevision:revision,operationId:`transfer_op_${n.toString(16).padStart(32,'0')}`,...extra});assert.equal(result.ok,true,result.code);};
  await command('startWindow',1);await command('requestEndWindow',2);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'js/productionSharedTransferChallenge.js'),'utf8').replace('  const SIGNING_NAME_MAX=80;','  root.__mutate=pstcMutate;\n  const SIGNING_NAME_MAX=80;'),sandbox,{filename:'js/productionSharedTransferChallenge.js'});
  const api=sandbox.CareerModeProductionSharedTransferChallenge;
  counts.clear();serverCounts.clear();
  return {api,sandbox,store,counts,serverCounts,pub,own,base,setupApi,careerApi,auth,remote,account,pairing,rivalry,fields,timers,events,storage,options,provider,put,sessionValue,
    event:name=>{for(const fn of events.get(name)||[])fn({detail:{}});},input:id=>{for(const fn of documentEvents.get('input')||[])fn({target:node(id)});},
    hold:p=>{let release;const promise=new Promise(resolve=>{release=resolve;});gate={path:p,promise};return release;},notifyAuthority:()=>authorityListeners.forEach(fn=>fn()),step:ms=>{now+=ms;},wake:async()=>{for(const timer of timers.filter(t=>t.ms===0))timer.fn();await flush();},coverage:value=>{for(const l of snapshotListeners)if(l.active)l.next({exists:()=>store.has(l.path),data:()=>copy(store.get(l.path)),metadata:{fromCache:!value,hasPendingWrites:false}});},healthy:value=>{for(const l of snapshotListeners)if(l.active)l.next({exists:()=>store.has(l.path),data:()=>copy(store.get(l.path)),metadata:{fromCache:!value,hasPendingWrites:false}});},fail:value=>{fail=value;},refreshCounts:()=>[setupRefreshes,careerRefreshes],mutate:(...a)=>sandbox.__mutate(...a)};
}
async function regressions(){
  const cases={
    async denied(){
      const w=await world();w.api.install();await flush();await w.api.refresh();w.step(60000);
      const timer=w.timers.find(t=>t.ms===1000);timer.fn();const before=w.api.getState(),clock=w.fields.get('transferTimerDisplay').textContent;
      w.fields.get('p1Signing1Name').value='Typed mid-window';
      w.event('career-mode-firestore-authority-denied');
      assert.strictEqual(w.api.getState(),before,'unrelated permission denial must retain the live view');
      timer.fn();assert.equal(w.fields.get('transferTimerDisplay').textContent,clock,'denial must not reset the server clock');
      await w.api.refresh();assert.equal(w.fields.get('p1Signing1Name').value,'Typed mid-window','denial and next render retain typed input');
      assert.equal(w.api.isWaitingForRival(),true,'denial retains the fast waiting check');
      // Private draft entry must still work after an unrelated denial.
      const state=w.store.get(w.pub);state.revision++;state.phase='GUESS_ENTRY';state.endedAt=ts(1800000060000);state.endRequestedRoles=['playerOne','playerTwo'];state.operationIds.push('transfer_op_'+'3'.padStart(32,'0'));state.operationTypes.push('request-end-window');state.operationHashes.push('sha256:'+'c'.repeat(64));state.baseRevisions.push(2);state.actorRoles.push('playerTwo');w.put(w.pub,state);await w.wake();await w.api.refresh();
      w.event('career-mode-firestore-authority-denied');w.fields.get('p2Guess1Value').value='Unfinished guess';w.input('p2Guess1Value');
      assert.ok([...w.storage.values()].some(value=>value.includes('Unfinished guess')),'typed private draft is saved after denial');
    },
    async registered(){
      const w=await world();w.api.install();await flush();await w.api.refresh();const before=w.api.getState();
      w.fields.get('p1Signing1Name').value='Keep my entry';w.pairing.registered=false;w.notifyAuthority();
      assert.strictEqual(w.api.getState(),before,'temporary registration loss must retain the view');
      await w.api.refresh();assert.equal(w.api.getState().state.phase,'WINDOW_OPEN');
      w.pairing.registered=true;w.notifyAuthority();await w.api.refresh();
      assert.equal(w.fields.get('p1Signing1Name').value,'Keep my entry','registration recovery must not reset role fields');
    },
    async refresh(){
      const w=await world();w.api.install();await flush();await w.api.refresh();w.step(3000);
      const before=w.counts.get(w.pub)||0;
      await w.fields.get('refreshSharedTransferChallenge').click({preventDefault(){}});await flush();
      assert.ok((w.counts.get(w.pub)||0)>before,'REFRESH button must read the challenge from the server');
    }
  };
  for(const [name,run] of Object.entries(cases))if(!process.env.TRANSFER_READ_CASE||process.env.TRANSFER_READ_CASE===name){await run();console.log(`PASS regression ${name} with real Firestore budget`);}
}
(async()=>{
  if(process.env.TRANSFER_READ_CASE!=='dedupe'){await regressions();if(process.env.TRANSFER_READ_CASE)return;}
  const w=await world();
  // Five separate refreshes over 12 s, while the existing wait listener confirms no public revision change.
  w.api.install();await flush();await w.api.refresh();w.counts.clear();
  for(let i=0;i<5;i++){await w.api.refresh();if(i<4)w.step(3000);}
  for(const p of [w.own,w.pub,`${w.base}/careerStart/authoritative`,`${w.base}/sessions/${session}`,w.base,`${w.base}/sharedSetup/authoritative`])assert.ok((w.counts.get(p)||0)<=1,`unchanged presentation must read ${p} at most once, got ${w.counts.get(p)||0}`);
  console.log('PASS unchanged context: after initial read/listener attachment, five refreshes read six documents at most once each');
  const before=w.counts.get(w.pub)||0;
  // A rival's write changes its private role and public revision atomically; private data stays hidden until completion.
  const state=w.store.get(w.pub);state.revision++;state.phase='GUESS_ENTRY';state.endedAt=ts(1800000005000);state.endRequestedRoles=['playerOne','playerTwo'];
  state.operationIds.push('transfer_op_'+'3'.padStart(32,'0'));state.operationTypes.push('request-end-window');state.operationHashes.push('sha256:'+'c'.repeat(64));state.baseRevisions.push(2);state.actorRoles.push('playerTwo');w.put(w.pub,state);
  await w.wake();await w.api.refresh();
  assert.ok(w.counts.get(w.pub)>before);assert.equal(w.api.getState().state.phase,'GUESS_ENTRY');assert.equal(w.api.getState().opponentInputs,null);assert.match(w.fields.get('transferPhaseStatus').textContent,/GUESS ENTRY/);
  console.log('PASS partner/public change: next refresh shows GUESS_ENTRY without exposing private inputs');
  // Every authority boundary must discard the presentation result, including the in-flight queue key.
  const second='session_'+'c'.repeat(64);w.put(`${w.base}/sessions/${second}`,w.sessionValue(second));w.remote.sessionId=second;
  await w.api.refresh();assert.ok(w.counts.get(`${w.base}/sessions/${second}`)>0,'replacement session is read');
  w.sandbox.currentShowdown.currentRound=2;await w.api.refresh();assert.equal(w.api.getState().seasonNumber,2);assert.ok(w.counts.get(`${w.base}/transferChallenges/season_2`)>0);
  w.pairing.deviceId='device_'+'2'.repeat(32);await assert.rejects(w.api.refresh());w.pairing.deviceId=device;
  w.rivalry.attached=false;const retained=w.api.getState();w.notifyAuthority();assert.strictEqual(w.api.getState(),retained,'membership notification invalidates presentation without wiping the view');await assert.rejects(w.api.refresh());w.rivalry.attached=true;
  w.auth.currentUser=null;w.account.connected=false;await assert.rejects(w.api.refresh());
  console.log('PASS session, device, season, closed membership and sign-out invalidate presentation');
  const pending=await world(),release=pending.hold(pending.pub),read=pending.api.refresh();await flush();pending.auth.currentUser=null;release();assert.equal(await read,null,'an old account read cannot bind after sign-out');assert.equal(pending.api.getState(),null);
  const co=await world();await Promise.all(Array.from({length:5},()=>co.api.refresh()));assert.equal(co.serverCounts.get(co.pub),1,'same-context concurrent calls share the read');
  // Authority outside the public wait document is confirmed at the real budget's unchanged 60 s boundary.
  const closed=await world();closed.api.install();await flush();await closed.api.refresh();let prior=closed.counts.get(closed.pub);const root=closed.store.get(closed.base);root.data.connectionState='closed';closed.put(closed.base,root);closed.step(60001);await assert.rejects(closed.api.refresh(),e=>e.code==='TRANSFER_RIVALRY_INACTIVE');assert.ok(closed.counts.get(closed.base)>1);
  const inactive=await world();inactive.api.install();await flush();await inactive.api.refresh();const ended=inactive.store.get(`${inactive.base}/sessions/${session}`);ended.data.state='closed';inactive.put(`${inactive.base}/sessions/${session}`,ended);inactive.step(60001);await assert.rejects(inactive.api.refresh(),e=>e.code==='TRANSFER_ACTIVE_SESSION_REQUIRED');
  const unconfirmed=await world();unconfirmed.api.install();await flush();await unconfirmed.api.refresh();prior=unconfirmed.counts.get(unconfirmed.pub);unconfirmed.coverage(false);unconfirmed.step(3000);await unconfirmed.api.refresh();assert.ok(unconfirmed.counts.get(unconfirmed.pub)>prior,'cache-only authority coverage retains fallback reads');
  console.log('PASS outside-public rivalry/session changes and unconfirmed authority coverage retain fresh reads');
  // Slow confirmation and listener failure preserve the base polling fallback.
  const f=await world();f.api.install();await flush();await f.api.refresh();let n=f.counts.get(f.pub);f.healthy(false);f.step(3000);await f.api.refresh(true);assert.ok(f.counts.get(f.pub)>n);
  f.healthy(true);await f.api.refresh();n=f.sandbox.CareerModeFirestoreBudget.stats().listenerServed;f.step(15000);await f.timers.find(t=>t.ms===15000).fn();await flush();assert.ok(f.sandbox.CareerModeFirestoreBudget.stats().listenerServed>n,'existing 15 s confirmation still reads through the real budget listener');
  // Writes and race recovery never use the presentation result, even with a healthy listener.
  const m=await world();m.api.install();await flush();await m.api.refresh();n=(m.counts.get(m.pub)||0)+m.sandbox.CareerModeFirestoreBudget.stats().listenerServed;const refreshes=m.refreshCounts();
  assert.equal(await m.mutate('requestEndWindow'),true,'race recovery recognizes the already-saved end request after fresh reads');
  assert.ok((m.counts.get(m.pub)||0)+m.sandbox.CareerModeFirestoreBudget.stats().listenerServed>=n+3,'each attempt reads through the real budget before race recovery');assert.ok(m.refreshCounts()[0]>refreshes[0]);
  const e=await world();await e.api.refresh();e.healthy(false);e.step(60001);e.fail(true);await assert.rejects(e.api.refresh());e.fail(false);await e.api.refresh();
  console.log('PASS listener fallback, 15 s confirmation, fresh writes/race retry and read-error recovery');
  // Completion used to run the full context twice inside the same read-only transaction.
  const c=await world();
  c.put('accounts/two',{objectType:'account',objectId:'two',lifecycleState:'live',data:{status:'active'}});
  c.put(`accounts/two/devices/${device}`,{objectType:'device',objectId:device,lifecycleState:'live',data:{deviceId:device,state:'active'}});
  let operation=3;
  for(const [method,who,payload] of [['requestEndWindow','two',{}],['lockGuesses',uid,{guesses:[]}],['lockGuesses','two',{guesses:[]}],['lockSignings',uid,{signings:[]}],['lockSignings','two',{signings:[]}]]){
    const result=await c.provider[method]({...c.options(),user:{uid:who},baseRevision:c.store.get(c.pub).revision,operationId:`transfer_op_${(operation++).toString(16).padStart(32,'0')}`,...payload});assert.equal(result.ok,true,result.code);
  }
  c.counts.clear();const completed=await c.provider.read(c.options());assert.equal(completed.ok,true,completed.code);assert.equal(completed.state.phase,'COMPLETED');assert.deepEqual(JSON.parse(JSON.stringify(completed.opponentInputs)),{guesses:[],signings:[]});
  for(const [p,count] of c.counts)assert.equal(count,1,`completed context must read ${p} only once per transaction`);
  assert.ok(c.counts.has(`${c.pub}/roles/playerTwo`));
  // A completed partner role is rendered as soon as its atomic public update wakes the existing listener.
  const partner=await world();partner.put('accounts/two',c.store.get('accounts/two'));partner.put(`accounts/two/devices/${device}`,c.store.get(`accounts/two/devices/${device}`));
  operation=3;partner.api.install();await flush();await partner.api.refresh();
  for(const [method,who,payload] of [['requestEndWindow','two',{}],['lockGuesses',uid,{guesses:[]}],['lockGuesses','two',{guesses:[]}],['lockSignings',uid,{signings:[]}]]){
    if(who===uid)assert.equal(await partner.mutate(method,payload),true);
    else{const result=await partner.provider[method]({...partner.options(),user:{uid:who},baseRevision:partner.store.get(partner.pub).revision,operationId:`transfer_op_${(operation++).toString(16).padStart(32,'0')}`,...payload});assert.equal(result.ok,true,result.code);}
    await partner.wake();await partner.api.refresh();
  }
  partner.api.install();await flush();await partner.api.refresh();assert.equal(partner.api.getState().opponentInputs,null);
  const result=await partner.provider.lockSignings({...partner.options(),user:{uid:'two'},baseRevision:6,operationId:`transfer_op_${(operation++).toString(16).padStart(32,'0')}`,signings:[{slot:1,name:'Partner signing',leagueId:'england-premier-league',nationalityId:'brazil'}]});assert.equal(result.ok,true,result.code);
  await partner.wake();await partner.api.refresh();assert.equal(partner.api.getState().opponentInputs.signings[0].name,'Partner signing');assert.match(partner.fields.get('transferPhaseStatus').textContent,/COMPLETE/);
  console.log('PASS completed reads touch each document once; partner role update appears on the next refresh');
  console.log('PASS Transfer Challenge read dedupe contracts');
})().catch(error=>{console.error(error);process.exitCode=1;});
