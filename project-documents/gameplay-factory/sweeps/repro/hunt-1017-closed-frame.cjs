// Run: node --test project-documents/gameplay-factory/sweeps/repro/hunt-1017-closed-frame.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {fixture}=require('./hunt-1017-fixture.cjs');
test('H1017-3: terminal witness still joins the available accepted trophy history',async()=>{
  const f=await fixture(10);
  const api=require(path.join(f.root,'js/seasonFinalV10.js'));
  const before=api.finalFrame(f.final,null,f.history);
  assert.equal(before.status,'ready'); assert.equal(before.winner,'draw');
  const after=api.finalFrame(null,f.terminal,f.history);
  console.log('H1017-3: before='+before.status+'; closed='+after.status+'; trophies='+Boolean(after.trophies)+'; acceptedRevisionKey in witness='+Object.hasOwn(f.terminal.terminalWitness,'acceptedRevisionKey'));
  assert.equal(after.status,'ready','full matching accepted history is still supplied after close');
  assert.deepEqual(after.trophies,before.trophies);
});
