const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
globalThis.crypto = webcrypto;
const foundation = require('../../js/saveLibraryFoundation.js');

const showdown = {
  schemaVersion: 2,
  id: 1700000001771,
  name: 'Saved Showdown with Season 1',
  managers: { playerOne: 'Daniel', playerTwo: 'Nik' },
  totalRounds: 3,
  currentRound: 2,
  status: 'In Progress',
  rounds: [{ roundNumber: 1, playerOne: {}, playerTwo: {} }]
};
const rawPlan = activeShowdown => foundation.buildRawSingletonMigrationPlan({
  saveLibrary: null,
  activeShowdown: JSON.stringify(activeShowdown),
  legacyShowdowns: '[]',
  preferences: null
});

(async () => {
  const good = await rawPlan(showdown);
  assert.equal(good.ok, true, 'An ordinary one-season career remains migratable.');
  assert.equal(good.library.saves[0].showdown.rounds.length, 1);

  const malformed = { ...showdown, rounds: { 0: showdown.rounds[0] } };
  const rejected = await rawPlan(malformed);
  assert.equal(rejected.ok, false,
    'A non-array Season history must fail instead of silently becoming an empty season list.');
  assert.equal(rejected.status, 'identity-migration-unavailable');
  assert.deepEqual(rejected.candidateRaw, {},
    'An invalid history cannot produce a migration candidate that would erase seasons.');

  console.log('PASS save-library migration preserves history or refuses an invalid Season list.');
})().catch(error => { console.error(error); process.exitCode = 1; });
