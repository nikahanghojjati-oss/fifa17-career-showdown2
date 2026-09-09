const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const NegativePath=path.resolve('js/ssjrProductionNegativeEvidence.js');
const RunnerPath=path.resolve('js/ssjrProductionNegativeProbeRunner.js');
const retiredAssembler=path.resolve('scripts/assemble-ssjr-shared-setup-safe-evidence.mjs');
const legacyValidator=path.resolve('scripts/validate-ssjr-shared-setup-production-evidence.mjs');
const H=value=>`sha256:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
const rules={
  wrongSession:['production-shared-setup-wrong-session-probe','SETUP_SESSION_INVALID'],
  expiredSession:['production-shared-setup-expired-session-probe','SETUP_ACTIVE_SESSION_REQUIRED'],
  unrelatedAccount:['stage5f-third-account-provider-probe','STAGE5F_THIRD_ACCOUNT_PROVIDER_DENIED'],
  revokedIdentity:['stage5f-revoked-device-provider-probe','STAGE5F_REVOKED_DEVICE_PROVIDER_DENIED'],
  staleRevision:['production-shared-setup-stale-revision-probe','SETUP_STALE_BASE_REVISION'],
  replayConflict:['production-shared-setup-replay-conflict-probe','SETUP_IDEMPOTENCY_CONFLICT'],
  directFieldSubstitution:['shared-setup-production-direct-field-probe','SETUP_DRAW_MISMATCH'],
  coordinatorBypass:['shared-setup-production-coordinator-bypass-probe','SETUP_COORDINATOR_REQUIRED']
};

(async()=>{
  let stored=null;
  global.sessionStorage={
    getItem:()=>stored,
    setItem:(_key,value)=>{stored=value;},
    removeItem:()=>{stored=null;}
  };

  global.CareerModeSSJRProductionNegativeProbeRunner={
    probeContract:'ssjr-negative-probe-runner-v1',
    run:async name=>({
      ok:true,
      probeContract:'ssjr-negative-probe-runner-v1',
      denied:true,
      source:rules[name][0],
      code:rules[name][1],
      localStorageUnchanged:true,
      managerRole:'playerOne',
      accountFingerprint:H('account-one'),
      deviceFingerprint:H('device-one'),
      rivalryFingerprint:H('shared-rivalry')
    })
  };

  delete require.cache[NegativePath];
  const Negative=require(NegativePath);
  assert.equal(Negative.record,undefined,'generic caller proof ingestion must not exist');
  Negative.clear();
  Negative.bindIdentity({
    managerRole:'playerOne',
    accountFingerprint:H('account-one'),
    deviceFingerprint:H('device-one'),
    rivalryFingerprint:H('shared-rivalry')
  });
  await Negative.runProbe('staleRevision');
  assert.equal(Negative.getState().completedCount,1);
  assert.equal(JSON.parse(stored).observations.staleRevision.provenance,'direct-production-probe-v1');

  const poisoned=JSON.parse(stored);
  poisoned.sessionId='session_'+('a'.repeat(64));
  stored=JSON.stringify(poisoned);
  delete require.cache[NegativePath];
  const Reload=require(NegativePath);
  assert.equal(Reload.getState().completedCount,0,'poisoned persisted evidence must be discarded');
  assert.equal(Reload.getState().managerRole,null);

  global.crypto=crypto.webcrypto;
  global.captureCareerModeRawBackupInputs=()=>({saveLibrary:'private-save',legacyShowdowns:null,preferences:'private-preferences'});
  const baseState={
    ready:true,
    accountId:'manager1',
    rivalryId:'pair_'+('1'.repeat(64)),
    sessionId:'session_'+('2'.repeat(64)),
    deviceId:'device_'+('3'.repeat(32)),
    managerRole:'playerOne'
  };
  let liveState=baseState;
  global.CareerModeProductionSharedShowdownSetup={getState:()=>liveState};
  global.CareerModeSparkSharedShowdownSetup={
    read:async options=>options.sessionId.endsWith('0')?{ok:false,code:'SETUP_SESSION_INVALID'}:{ok:true,revision:0,state:null},
    mutate:async()=>({ok:false,code:'SETUP_STALE_BASE_REVISION'})
  };
  global.CareerModeProductionFirebaseRuntime={
    ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'manager1'}},firestore:{},firestoreSdk:{}})
  };

  delete require.cache[RunnerPath];
  const Runner=require(RunnerPath);
  const direct=await Runner.run('wrongSession');
  assert.equal(direct.denied,true);
  assert.equal(direct.source,rules.wrongSession[0]);
  assert.equal(direct.probeContract,'ssjr-negative-probe-runner-v1');
  assert.equal(direct.accountFingerprint,H('manager1'));
  assert.equal(direct.deviceFingerprint,H('device_'+('3'.repeat(32))));

  const captured=global.captureCareerModeRawBackupInputs;
  delete global.captureCareerModeRawBackupInputs;
  await assert.rejects(Runner.run('wrongSession'),{code:'SSJR_NEGATIVE_STORAGE_AUTHORITY_UNAVAILABLE'});
  global.captureCareerModeRawBackupInputs=captured;

  const identity={
    managerRole:'playerOne',
    accountFingerprint:H('account-one'),
    deviceFingerprint:H('device-one'),
    rivalryFingerprint:H('shared-rivalry')
  };
  Negative.clear();
  Negative.bindIdentity(identity);
  const ownedRunner=global.CareerModeSSJRProductionNegativeProbeRunner;
  global.CareerModeSSJRProductionNegativeProbeRunner={
    ...ownedRunner,
    run:async name=>({...await ownedRunner.run(name),accountFingerprint:H('another-account')})
  };
  await assert.rejects(Negative.runProbe('staleRevision'),{code:'SSJR_NEGATIVE_IDENTITY_CHANGED'});
  assert.equal(Negative.getState().completedCount,0);

  let finish;
  global.CareerModeSSJRProductionNegativeProbeRunner={...ownedRunner,run:()=>new Promise(resolve=>{finish=resolve;})};
  const pending=Negative.runProbe('staleRevision');
  Negative.clear();
  Negative.bindIdentity(identity);
  finish(await ownedRunner.run('staleRevision'));
  await assert.rejects(pending,{code:'SSJR_NEGATIVE_IDENTITY_CHANGED'});
  assert.equal(Negative.getState().completedCount,0,'post-reset probe result must not be accepted');
  global.CareerModeSSJRProductionNegativeProbeRunner=ownedRunner;

  let expiresAt=Date.now()+60000;
  const calls=[];
  const sdk={doc:(_db,...parts)=>parts.join('/')};
  sdk.runTransaction=async (_db,fn)=>fn({
    get:async ref=>({
      exists:()=>true,
      data:()=>ref.includes('/sessions/')
        ?{data:{state:'active',hostAccountId:'manager1',memberAccountIds:['manager1','manager2'],expiresAt:{toMillis:()=>expiresAt}}}
        :{data:{managerSlots:[{slotId:'playerOne',accountId:'manager1',profileId:'profile1',saveId:'save1',entitlementState:'active'}]}}
    })
  });
  global.CareerModeProductionFirebaseRuntime.ensureAccountServices=async()=>({ok:true,auth:{currentUser:{uid:'manager1'}},firestore:{},firestoreSdk:sdk});
  global.CareerModeSparkSharedShowdownSetup.read=async options=>{calls.push(options.nowEpochMs);return {ok:false,code:'SETUP_ACTIVE_SESSION_REQUIRED'};};
  await assert.rejects(Runner.run('expiredSession'),{code:'SSJR_NEGATIVE_SESSION_NOT_EXPIRED'});
  assert.equal(calls.length,0,'a future clock must not manufacture expiry');
  expiresAt=Date.now()-1000;
  liveState={ready:false};
  const start=Date.now();
  const expired=await Runner.run('expiredSession');
  assert.equal(expired.denied,true);
  assert.ok(calls[0]>=start&&calls[0]<=Date.now(),'expired probe must receive actual wall time');

  await assert.rejects(
    Runner.run('unrelatedAccount',{operatorConfirmedThirdAccount:true,denied:true}),
    {code:'SSJR_NEGATIVE_ACCOUNT_CONTEXT_CONFLICT'}
  );
  liveState={...baseState,accountId:'different-manager'};
  await assert.rejects(Runner.run('wrongSession'),{code:'SSJR_NEGATIVE_IDENTITY_CHANGED'});
  liveState=baseState;

  const retired=spawnSync(process.execPath,[retiredAssembler],{encoding:'utf8'});
  assert.notEqual(retired.status,0,'legacy standalone assembler must be retired');
  assert.equal(retired.stdout,'','retired assembler must never emit evidence');
  assert.match(retired.stderr,/SSJR_SAFE_EVIDENCE_ASSEMBLY_RETIRED/);
  assert.match(retired.stderr,/do not authenticate production provenance|does not authenticate production provenance|do not authenticate|do not self-authenticate/i);

  const packageJson=JSON.parse(fs.readFileSync(path.resolve('package.json'),'utf8'));
  assert.equal(
    packageJson.scripts['validate:ssjr-production-shared-setup'],
    'node scripts/validate-ssjr-shared-setup-actor-evidence.mjs',
    'default production validator command must use the current fail-closed actor path'
  );
  assert.equal(
    packageJson.scripts['assemble:ssjr-shared-setup:candidate'],
    'node scripts/assemble-ssjr-shared-setup-actor-evidence.mjs'
  );
  assert.equal(
    packageJson.scripts['validate:ssjr-production-shared-setup:legacy-schema'],
    'node scripts/validate-ssjr-shared-setup-production-evidence.mjs',
    'historical v1 validator must be explicitly labeled schema-only'
  );
  assert.equal(
    packageJson.scripts['assemble:ssjr-production-shared-setup:legacy-retired'],
    'node scripts/assemble-ssjr-shared-setup-safe-evidence.mjs'
  );
  assert.equal(packageJson.scripts['assemble:ssjr-production-shared-setup'],undefined,'unsafe unversioned v1 production assembler alias must not exist');

  const legacy=fs.readFileSync(legacyValidator,'utf8');
  assert.match(legacy,/const REQUIRED_NEGATIVES = \[/,'historical v1 schema contract remains intact');
  assert.match(legacy,/bundle\.negatives\[key\] !== 'denied'/,'historical v1 eight-denial schema rule remains intact');
  assert.doesNotMatch(legacy,/ssjr-actor-evidence-v2/,'legacy v1 validator remains independently versioned');

  const bootstrap=fs.readFileSync(path.resolve('js/ssjr.js'),'utf8');
  const sw=fs.readFileSync(path.resolve('service-worker.js'),'utf8');
  for(const file of [
    'js/stage5fProductionAuthenticatedNegatives.js',
    'js/ssjrProductionNegativeProbeRunner.js',
    'js/ssjrProductionNegativeEvidence.js'
  ]){
    const escaped=new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
    assert.match(bootstrap,escaped);
    assert.match(sw,escaped);
  }

  console.log('PASS SSJR safe evidence contracts: direct probes own browser denial capture, poisoned/reset/identity-swapped observations fail closed, expired-session proof uses real wall time, the unauthenticated v1 standalone assembler is retired, and production CLI routing no longer upgrades standalone JSON into accepted production proof.');
})().catch(error=>{console.error(error);process.exit(1);});
