const assert = require('node:assert/strict');
const reconnectFactory = require('../../js/sharedJourneyReconnect.js');

const RIVALRY = `pair_${'a'.repeat(64)}`;
const ACCOUNT = 'acct-reconnect-a';
const DEVICE = `device_${'b'.repeat(32)}`;
const SESSION_A = `session_${'c'.repeat(64)}`;
const SESSION_B = `session_${'d'.repeat(64)}`;
const NOW = 1_000_000;

const authority = Object.freeze({rivalryId:RIVALRY,accountId:ACCOUNT,deviceId:DEVICE,managerRole:'playerOne'});
const setup = Object.freeze({
  rivalryId:RIVALRY,
  revision:6,
  phase:'SHOWDOWN_CONFIRMED',
  leagueId:'premier-league',
  totalSeasons:3,
  clubs:Object.freeze({playerOne:'Arsenal',playerTwo:'Chelsea'})
});
function acceptedKey(count){
  return Array.from({length:count},(_,index)=>`${index+1}:2:sha256:${String((index+1)%10).repeat(64)}`).join('|');
}
function progression(accepted=1,total=3){
  const terminal=accepted===total;
  return Object.freeze({
    schemaVersion:1,runtimeRevision:'1.9.1-r13',phase:terminal?'SHOWDOWN_COMPLETE':'SEASON_READY',revision:accepted,
    rivalryId:RIVALRY,setupRevision:6,leagueId:'premier-league',totalSeasons:total,acceptedSeasons:accepted,
    activeSeason:terminal?null:accepted+1,completedSeason:accepted||null,
    fixedClubs:Object.freeze({playerOne:'Arsenal',playerTwo:'Chelsea'}),acceptedRevisionKey:acceptedKey(accepted),terminal,
    canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false
  });
}
function remote(sessionId=SESSION_A,overrides={}){
  return Object.freeze({
    sessionId,rivalryId:RIVALRY,accountId:ACCOUNT,deviceId:DEVICE,sessionState:'active',pendingAction:null,expiresAtEpochMs:NOW+60_000,
    ...overrides
  });
}
function observe(protocol,options={}){
  return protocol.observe({authority,nowEpochMs:NOW,networkOnline:true,remote:remote(),setup,progression:progression(),...options});
}
function code(expected,fn){assert.throws(fn,error=>error&&error.code===expected,`expected ${expected}`);}

(() => {
  const protocol = reconnectFactory.createProtocol();
  assert.equal(reconnectFactory.runtimeRevision,'1.9.1-r14');
  assert.equal(protocol.feature,'ssjr-shared-journey-reconnect');
  assert.deepEqual(protocol.phases,['OFFLINE_HOLD','RECOVERY_PENDING','FRESH_SESSION_REQUIRED','ACTIVE_RECOVERED','TERMINAL_RECOVERED']);
  for (const [key,value] of Object.entries({sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false})) assert.equal(protocol[key],value,key);

  const active = observe(protocol);
  assert.equal(active.phase,'ACTIVE_RECOVERED');
  assert.equal(active.activeAuthorization,true);
  assert.equal(active.recovered,true);
  assert.equal(active.resumable,true);
  assert.equal(active.sessionId,SESSION_A);
  assert.equal(active.lastKnownSessionId,SESSION_A);
  assert.equal(active.sessionChanged,false);
  assert.equal(active.acceptedSeasons,1);
  assert.equal(active.activeSeason,2);
  assert.equal(active.acceptedRevisionKey,acceptedKey(1));
  assert.equal(active.canonicalStorageMutation,false);
  assert.equal(active.providerWriteRequired,false);
  assert.equal(active.listPermissionRequired,false);
  assert.equal(active.billingRequired,false);
  assert.equal(protocol.verifyState(active).durableKey,active.durableKey);

  const offline = protocol.observe({authority,previous:active,nowEpochMs:NOW+1,networkOnline:false,remote:null});
  assert.equal(offline.phase,'OFFLINE_HOLD');
  assert.equal(offline.activeAuthorization,false);
  assert.equal(offline.resumable,true);
  assert.equal(offline.recovered,false);
  assert.equal(offline.sessionId,null);
  assert.equal(offline.lastKnownSessionId,SESSION_A);
  assert.equal(offline.durableKey,active.durableKey);
  assert.equal(offline.planKey,active.planKey);
  assert.equal(offline.acceptedRevisionKey,active.acceptedRevisionKey);

  const pending = protocol.observe({authority,previous:active,nowEpochMs:NOW+2,networkOnline:true,remote:remote(SESSION_A,{pendingAction:'close'})});
  assert.equal(pending.phase,'RECOVERY_PENDING');
  assert.equal(pending.activeAuthorization,false);
  assert.equal(pending.resumable,true);
  assert.equal(pending.sessionId,SESSION_A);

  const expired = protocol.observe({authority,previous:active,nowEpochMs:NOW+60_001,networkOnline:true,remote:remote(SESSION_A,{expiresAtEpochMs:NOW+60_000})});
  assert.equal(expired.phase,'FRESH_SESSION_REQUIRED');
  assert.equal(expired.activeAuthorization,false);
  assert.equal(expired.freshSessionRequired,true);
  assert.equal(expired.resumable,true);
  assert.equal(expired.lastKnownSessionId,SESSION_A);
  assert.equal(expired.durableKey,active.durableKey);

  const fresh = protocol.observe({authority,previous:expired,nowEpochMs:NOW+60_002,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup,progression:progression()});
  assert.equal(fresh.phase,'ACTIVE_RECOVERED');
  assert.equal(fresh.activeAuthorization,true);
  assert.equal(fresh.sessionChanged,true);
  assert.equal(fresh.sessionId,SESSION_B);
  assert.equal(fresh.lastKnownSessionId,SESSION_B);
  assert.equal(fresh.durableKey,active.durableKey,'fresh session re-entry must preserve exact durable journey revision');
  assert.equal(fresh.planKey,active.planKey,'fresh session re-entry must preserve league, clubs and length');

  const reloaded = protocol.observe({authority,previous:fresh,nowEpochMs:NOW+60_003,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup,progression:progression()});
  assert.equal(reloaded.phase,'ACTIVE_RECOVERED');
  assert.equal(reloaded.sessionChanged,false);
  assert.equal(reloaded.durableKey,fresh.durableKey);

  const advanced = protocol.observe({authority,previous:reloaded,nowEpochMs:NOW+60_004,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup,progression:progression(2)});
  assert.equal(advanced.acceptedSeasons,2);
  assert.equal(advanced.activeSeason,3);
  assert.equal(advanced.planKey,reloaded.planKey);

  const terminal = protocol.observe({authority,previous:advanced,nowEpochMs:NOW+60_005,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup,progression:progression(3)});
  assert.equal(terminal.phase,'TERMINAL_RECOVERED');
  assert.equal(terminal.activeAuthorization,true);
  assert.equal(terminal.terminal,true);
  assert.equal(terminal.activeSeason,null);

  const closedAfterTerminal = protocol.observe({authority,previous:terminal,nowEpochMs:NOW+60_006,networkOnline:true,remote:remote(SESSION_B,{sessionState:'closed',expiresAtEpochMs:NOW+120_000})});
  assert.equal(closedAfterTerminal.phase,'FRESH_SESSION_REQUIRED');
  assert.equal(closedAfterTerminal.terminal,true,'terminal durable state survives loss of session authorization');

  code('JOURNEY_RECONNECT_AUTHORITY_MISMATCH',()=>observe(protocol,{remote:remote(SESSION_A,{rivalryId:`pair_${'e'.repeat(64)}`})}));
  code('JOURNEY_RECONNECT_AUTHORITY_MISMATCH',()=>observe(protocol,{remote:remote(SESSION_A,{accountId:'wrong-account'})}));
  code('JOURNEY_RECONNECT_AUTHORITY_MISMATCH',()=>observe(protocol,{remote:remote(SESSION_A,{deviceId:`device_${'e'.repeat(32)}`})}));
  code('JOURNEY_RECONNECT_SESSION_INVALID',()=>observe(protocol,{remote:{sessionId:SESSION_A,sessionState:'active',expiresAtEpochMs:NOW+60_000}}));
  code('JOURNEY_RECONNECT_SESSION_INVALID',()=>observe(protocol,{remote:remote(SESSION_A,{expiresAtEpochMs:null})}));

  const replayAltered = {...reloaded,durableKey:`${RIVALRY}|6|1|tampered`};
  code('JOURNEY_RECONNECT_PREVIOUS_INVALID',()=>protocol.observe({authority,previous:replayAltered,nowEpochMs:NOW+60_007,networkOnline:false,remote:null}));
  const planAltered = {...reloaded,planKey:'6|la-liga|3|Arsenal|Chelsea'};
  code('JOURNEY_RECONNECT_PREVIOUS_INVALID',()=>protocol.observe({authority,previous:planAltered,nowEpochMs:NOW+60_008,networkOnline:false,remote:null}));

  code('JOURNEY_RECONNECT_REGRESSION',()=>protocol.observe({authority,previous:advanced,nowEpochMs:NOW+60_009,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup,progression:progression(1)}));
  const driftSetup={...setup,leagueId:'la-liga'};
  const driftProgression={...progression(),leagueId:'la-liga'};
  code('JOURNEY_RECONNECT_PLAN_DRIFT',()=>protocol.observe({authority,previous:reloaded,nowEpochMs:NOW+60_010,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup:driftSetup,progression:driftProgression}));
  code('JOURNEY_RECONNECT_TERMINAL_RESURRECTION',()=>protocol.observe({authority,previous:terminal,nowEpochMs:NOW+60_011,networkOnline:true,remote:remote(SESSION_B,{expiresAtEpochMs:NOW+120_000}),setup,progression:progression(2)}));

  process.stdout.write('PASS Journey Reconnect deterministic offline/reload/expiry/fresh-session recovery, durable-state monotonicity, malformed-authority denial and terminal non-resurrection\n');
})();
