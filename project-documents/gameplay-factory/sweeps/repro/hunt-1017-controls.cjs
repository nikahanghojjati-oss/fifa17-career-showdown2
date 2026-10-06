// Control run: node --test project-documents/gameplay-factory/sweeps/repro/hunt-1017-controls.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./hunt-1017-fixture.cjs');
for(const length of [1,3,5,10])test('control: '+length+' seasons, privacy, stale publication, replay, final draw',async()=>{
  const f=await fixture(length);
  for(const s of f.states){
    const firstView=f.results.projectForRole(s.first.state,'playerTwo');
    assert.equal(firstView.opponentResult,null);assert.equal(firstView.allResults,null);
    await assert.rejects(f.results.apply({...s.options,state:s.first.state,actorRole:'playerTwo',command:{...s.firstCommand,operationId:'season_result_op_'+'f'.repeat(32)}}),{code:'SEASON_RESULTS_STALE_BASE_REVISION'});
    assert.equal((await f.results.apply({...s.options,state:s.second.state,actorRole:'playerOne',command:s.firstCommand})).idempotent,true);
    assert.equal(s.acknowledgedTwo.state.revision,3);
    assert.equal(s.acknowledgedTwo.state.phase,'ACKNOWLEDGED');
    await assert.rejects(f.commit.apply({...s.commitOptions,state:s.committed.state,actorRole:'playerTwo',command:{type:'acknowledge-season',operationId:'season_commit_op_'+'f'.repeat(32),baseRevision:0}}),{code:'SEASON_COMMIT_STALE_BASE_REVISION'});
  }
  assert.equal(f.history.projection.acceptedSeasons,length);
  assert.equal(f.multi.state.terminal,true);assert.equal(f.multi.state.activeSeason,null);
  assert.equal(f.final.winner,'draw');assert.equal(f.final.extraSeasonAllowed,false);
  assert.equal(f.terminal.terminalWitness.winner,'draw');
});
