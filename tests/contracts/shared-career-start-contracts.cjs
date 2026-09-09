const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Career=require('../../js/sharedCareerStart.js');

const setup={
  schemaVersion:1,
  runtimeRevision:'1.9.1-r7',
  rivalryId:'pair_'+('a'.repeat(64)),
  revision:6,
  phase:'SHOWDOWN_CONFIRMED',
  coordinatorRole:'playerOne',
  leagueId:'premier_league',
  clubs:{playerOne:'Arsenal',playerTwo:'Liverpool'},
  totalSeasons:3,
  confirmedRoles:['playerOne','playerTwo']
};
const op=n=>`career_start_op_${String(n).padStart(32,'0')}`;

assert.equal(Career.feature,'ssjr-shared-career-start');
assert.equal(Career.runtimeRevision,'1.9.1-r7');
assert.equal(Career.billingRequired,false);
assert.equal(Career.canonicalStorageMutation,false);
assert.deepEqual(Career.localAssignment(setup,'playerOne'),{managerRole:'playerOne',club:'Arsenal',leagueId:'premier_league',totalSeasons:3});
assert.deepEqual(Career.localAssignment(setup,'playerTwo'),{managerRole:'playerTwo',club:'Liverpool',leagueId:'premier_league',totalSeasons:3});

const first=Career.apply({state:null,setup,actorRole:'playerOne',command:{type:'acknowledge-career-start',operationId:op(1),baseRevision:0,actorRole:'playerTwo'}});
assert.equal(first.ok,true);
assert.equal(first.state.revision,1);
assert.equal(first.state.phase,'ONE_MANAGER_ACKNOWLEDGED');
assert.deepEqual(first.state.acknowledgedRoles,['playerOne'],'caller-supplied actor hints must not override provider actor authority');

const replay=Career.apply({state:first.state,setup,actorRole:'playerOne',command:{type:'acknowledge-career-start',operationId:op(1),baseRevision:0}});
assert.equal(replay.idempotent,true);
assert.deepEqual(replay.state,first.state);
assert.throws(()=>Career.apply({state:first.state,setup,actorRole:'playerOne',command:{type:'acknowledge-career-start',operationId:op(2),baseRevision:1}}),error=>error.code==='CAREER_START_ROLE_ALREADY_ACKNOWLEDGED');
assert.throws(()=>Career.apply({state:first.state,setup,actorRole:'playerTwo',command:{type:'acknowledge-career-start',operationId:op(2),baseRevision:0}}),error=>error.code==='CAREER_START_STALE_BASE_REVISION');

const second=Career.apply({state:first.state,setup,actorRole:'playerTwo',command:{type:'acknowledge-career-start',operationId:op(2),baseRevision:1}});
assert.equal(second.state.revision,2);
assert.equal(second.state.phase,'CAREER_START_READY');
assert.deepEqual(second.state.acknowledgedRoles,['playerOne','playerTwo']);
assert.throws(()=>Career.apply({state:second.state,setup,actorRole:'playerOne',command:{type:'acknowledge-career-start',operationId:op(3),baseRevision:2}}),error=>error.code==='CAREER_START_ALREADY_READY');

for(const bad of [
  {...setup,phase:'SEASON_LENGTH_COMMITTED',revision:4},
  {...setup,clubs:{playerOne:'Arsenal',playerTwo:'Arsenal'}},
  {...setup,totalSeasons:2},
  {...setup,confirmedRoles:['playerOne']}
])assert.throws(()=>Career.validateConfirmedSetup(bad));

const provider=fs.readFileSync(path.resolve('js/sparkSharedCareerStart.js'),'utf8');
for(const required of [
  '"accounts",uid',
  '"devices",deviceId',
  '"rivalries",rivalryId',
  '"sessions",sessionId',
  '"sharedSetup","authoritative"',
  '"careerStart","authoritative"',
  'value.revision!==6',
  'value.phase!=="SHOWDOWN_CONFIRMED"',
  'CAREER_START_ACTIVE_SESSION_REQUIRED',
  'protocol.apply({state:ctx.state,setup,actorRole',
  'canonicalStorageMutation:false',
  'billingRequired:false',
  'cloudRunRequired:false',
  'cloudFunctionsRequired:false'
])assert.ok(provider.includes(required),`provider missing required Career Start boundary: ${required}`);
assert.doesNotMatch(provider,/options\.actorRole|options\.managerRole/,'provider must derive manager role from the paired rivalry rather than caller input');

const guard=fs.readFileSync(path.resolve('js/productionSharedJourneyGuard.js'),'utf8');
assert.match(guard,/target\.id!=="continueClubAssignment"\|\|target\.dataset\.sharedCareerStart!=="true"/,'shared click guard must recognize the confirmed Career Start control');
assert.match(guard,/if\(routeCareerStartClick\(target\)\)return;[\s\S]+if\(routePresentationClick\(target\)\)return;/,'Career Start must outrank the finished Shared Setup presentation at the capture gate');
assert.match(guard,/routesCareerStartAfterConfirmedSetup:true/,'guard diagnostics must expose Career Start routing authority');

const entry=fs.readFileSync(path.resolve('js/productionSharedJourneyEntry.js'),'utf8');
assert.match(entry,/snapshot&&snapshot\.ready===true&&snapshot\.setup&&snapshot\.setup\.phase==="SHOWDOWN_CONFIRMED"&&snapshot\.setup\.revision===6/,'resume entry must resolve exact confirmed Shared Setup before choosing a route');
assert.match(entry,/if\(confirmed\)\{await openCareerStart\(\);applyLocalDrawLock\(\);return true;\}/,'confirmed Shared Setup must resume directly into Career Start instead of replaying league/club setup');
assert.match(entry,/confirmed\?"CONTINUE TO CAREER START":"CONTINUE TO LEAGUE WHEEL"/,'paired-first entry must expose the correct resume action to the owner');
assert.match(entry,/confirmedSetupResumesAtCareerStart:true/,'entry diagnostics must expose direct confirmed-setup Career Start resume');

console.log('PASS Shared Career Start contracts: exact confirmed setup gates entry, each bound role acknowledges once, replay/stale/duplicate-role attempts fail closed, finished setup routes directly into Career Start on click and reload/fresh-session resume, and Spark provider authority is account/device/rivalry/ACTIVE-session bound with zero billing.');
