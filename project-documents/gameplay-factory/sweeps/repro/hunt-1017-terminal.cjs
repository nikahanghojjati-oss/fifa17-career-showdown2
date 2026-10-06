// Run from repository root: node --test project-documents/gameplay-factory/sweeps/repro/hunt-1017-terminal.cjs
// Unmodified production module in a VM; dependencies are deterministic fakes, no Firebase calls.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const {test} = require('node:test');
const root = path.resolve(__dirname, '../../../..');
const protocol = require(path.join(root, 'js/sharedTerminalClose.js'));
const pair = 'pair_' + 'a'.repeat(64), session = 'session_' + 'b'.repeat(64);
const device = 'device_' + 'c'.repeat(32), save = 'save_' + 'd'.repeat(24);
const p1 = 'profile_' + 'e'.repeat(24), p2 = 'profile_' + 'f'.repeat(24);
const final = {schemaVersion:1, runtimeRevision:'1.9.1-r17', phase:'FINAL_SEASON_RECONCILED',
  rivalryId:pair, leagueId:'premier_league', totalSeasons:10, acceptedSeasons:10,
  completedSeason:10, acceptedRevisionKey:'accepted', fixedClubs:{playerOne:'A',playerTwo:'B'},
  managerTotals:{playerOne:10,playerTwo:5}, winner:'playerOne', terminal:true,
  finalSeasonReconciled:true, nextSeason:null, extraSeasonAllowed:false, terminalCloseRequired:true,
  canonicalStorageMutation:false, providerWriteRequired:false, listPermissionRequired:false, billingRequired:false};
function harness() {
  const control = {read:async()=>({ok:true,terminal:false}), calls:[]};
  const context = vm.createContext({console, TextEncoder, setTimeout, clearTimeout,
    currentShowdown:{id:'local',identity:{saveId:save,managerProfileIds:{playerOne:p1,playerTwo:p2}},sharedJourney:{mode:'shared',rivalryId:pair}},
    CareerModeSharedTerminalClose:protocol,
    CareerModeSparkTerminalClose:{read:o=>control.read(o),close:async o=>{control.calls.push(o);return {ok:false,code:'unavailable'};}},
    CareerModeProductionSharedFinalReconciliation:{getState:()=>final,refresh:async()=>final},
    CareerModeProductionFirebaseRuntime:{ensureAccountServices:async()=>({ok:true,auth:{currentUser:{uid:'nik'}},firestore:{},firestoreSdk:{}})},
    CareerModeSparkConnectedAccount:{getState:()=>({connected:true,accountId:'nik'})},
    CareerModeSparkPrivatePairing:{getState:()=>({registered:true,deviceId:device})},
    CareerModeSparkConnectedRivalry:{getState:()=>({attached:true,rivalryId:pair,accountId:'nik',deviceId:device})},
    CareerModeSparkRemoteJoining:{getState:()=>({sessionState:'active',sessionId:session,rivalryId:pair,accountId:'nik',deviceId:device,pendingAction:null,expiresAtEpochMs:Date.now()+60000})}
  });
  vm.runInContext(fs.readFileSync(path.join(root,'js/productionSharedTerminalClose.js'),'utf8'),context);
  return {context,control,api:context.CareerModeProductionSharedTerminalClose};
}
test('H1017-1: a poll preserves an unresolved exact close intent', async()=>{
  const {api}=harness();
  await api.refresh(); assert.equal(api.getState().phase,'READY');
  await api.close(); assert.equal(api.getState().phase,'RECOVERY_PENDING');
  const held=api.getState().intent;
  await api.refresh();
  console.log('H1017-1: phase after poll =',api.getState().phase,'; retry =',(await api.retry()).code);
  assert.equal(api.getState().phase,'RECOVERY_PENDING');
  assert.deepEqual(api.getState().intent,held);
});
test('H1017-2: switching saves during retry read must prevent the old close write', async()=>{
  const {api,context,control}=harness();
  await api.refresh(); await api.close();
  let release,started;
  const entered=new Promise(resolve=>{started=resolve;});
  control.read=()=>{started();return new Promise(resolve=>{release=resolve;});};
  const retry=api.retry(); await entered;
  context.currentShowdown={id:'different-save',identity:{saveId:'save_'+'1'.repeat(24),managerProfileIds:{playerOne:p1,playerTwo:p2}},sharedJourney:{mode:'shared',rivalryId:'pair_'+'2'.repeat(64)}};
  release({ok:true,terminal:false});
  await retry;
  console.log('H1017-2: provider close calls =',control.calls.length,'; retry wrote old rivalry =',control.calls[1]?.rivalryId===pair);
  assert.equal(control.calls.length,1,'context changed during read: do not invoke old provider.close');
});
