const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function loadUI({ shared = true, localSeason = 1, progression } = {}) {
  const label = { textContent: '' };
  const meta = { textContent: '' };
  const tile = {
    disabled: false,
    querySelector: selector => selector === '.menuTileLabel' ? label : meta,
    setAttribute() {}
  };
  const indicator = { textContent: '' };
  const round = { textContent: '' };
  const nodes = { continueCareer: tile, seasonIndicator: indicator, dashboardRound: round };
  const showdown = {
    currentRound: localSeason, totalRounds: 5, status: 'Active', name: 'Shared showdown',
    managers: { playerOne: 'Nik', playerTwo: 'Daniel' }, clubs: {},
    score: { playerOne: 0, playerTwo: 0 }, rounds: [],
    ...(shared ? { sharedJourney: { mode: 'shared', rivalryId: 'chip-test' } } : {})
  };
  const context = vm.createContext({
    currentShowdown: showdown,
    document: {
      getElementById: id => nodes[id] || null,
      querySelector: () => null,
      querySelectorAll: () => []
    },
    getTransferChallengeForSeason: () => null
  });
  context.window = context;
  if (progression) context.CareerModeProductionSharedMultiSeasonProgression = progression;
  for (const file of ['js/menuExperience.js', 'js/showdownUI.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return { context, meta, indicator, round, showdown };
}

function assertLabels(ui, season) {
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.meta.textContent, `Nik vs Daniel · Season ${season} of 5`);
  assert.equal(ui.indicator.textContent, `Season ${season} / 5`);
  ui.context.updateShowdownUI();
  assert.equal(ui.round.textContent, `Season ${season} of 5`);
  assert.equal(ui.indicator.textContent, `Season ${season} / 5`);
}

test('Home tile uses shared season 3 while the local round remains 1', () => {
  const ui = loadUI({ progression: { resolveSeason: fallback => {
    assert.equal(fallback, 1);
    return 3;
  } } });
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.meta.textContent, 'Nik vs Daniel · Season 3 of 5');
  assert.equal(ui.indicator.textContent, 'Season 3 / 5');
  assert.equal(ui.showdown.currentRound, 1);
});

test('Dashboard season label and header chip use shared season 3', () => {
  const ui = loadUI({ progression: { resolveSeason: () => 3 } });
  ui.context.updateShowdownUI();
  assert.equal(ui.round.textContent, 'Season 3 of 5');
  assert.equal(ui.indicator.textContent, 'Season 3 / 5');
  assert.equal(ui.showdown.currentRound, 1);
});

test('Solo labels keep the local round even with a shared progression module loaded', () => {
  assertLabels(loadUI({ shared: false, localSeason: 2, progression: {
    resolveSeason: () => { throw new Error('Solo must not consult shared progression'); }
  } }), 2);
});

test('Shared labels fall back locally before the progression module is available', () => {
  assertLabels(loadUI({ localSeason: 2 }), 2);
  assertLabels(loadUI({ localSeason: 2, progression: {} }), 2);
});

test('Labels follow a shared cursor change on the next refresh without mutating the save', () => {
  let season = 3;
  const ui = loadUI({ progression: { resolveSeason: () => season } });
  const before = JSON.stringify(ui.showdown);
  assertLabels(ui, 3);
  season = 4;
  assertLabels(ui, 4);
  assert.equal(JSON.stringify(ui.showdown), before);
});

// r79 gallery (fix 3): after Daniel's DELETE CURRENT SHOWDOWN Nik's pair holds the rivalry as closed (closedRivalryId +
// closedProviderSaveId) and keeps its save as the library's active save. Home then shows no live career for it.
test('A Showdown the pair holds as closed is not offered as CONTINUE CAREER and drops the season chip', () => {
  const ui = loadUI({ localSeason: 1 });
  ui.showdown.totalRounds = 3; ui.showdown.status = 'Created';
  const closedSave = 'save_' + 'a'.repeat(24);
  let pair = { status: 'unpaired', rivalryId: null, closedRivalryId: 'pair_' + 'b'.repeat(64), closedProviderSaveId: closedSave };
  ui.context.CareerModePersistentNikDanielPair = { getState: () => pair };
  ui.context.CareerModeSaveLibraryRuntime = { getLibrarySnapshot: () => ({ activeSaveId: closedSave }) };
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.meta.textContent, 'No Showdown live');
  assert.equal(ui.indicator.textContent, 'No Active Showdown');
  // a live pair (or another save) keeps the career
  pair = { status: 'paired', rivalryId: 'pair_' + 'c'.repeat(64), connectionState: 'active', closedRivalryId: null };
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.meta.textContent, 'Nik vs Daniel · Season 1 of 3');
  assert.equal(ui.indicator.textContent, 'Season 1 / 3');
  // a finished (Completed) closed Showdown still reads VIEW COMPLETED SHOWDOWN
  pair = { status: 'unpaired', rivalryId: null, closedRivalryId: 'pair_' + 'b'.repeat(64), closedProviderSaveId: closedSave };
  ui.showdown.status = 'Completed';
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.indicator.textContent, 'Showdown Complete');
  // Codex #916: a cold reload of a closed pair never starts the Save Library runtime; the save's own id decides
  ui.showdown.status = 'Created'; ui.showdown.identity = { ...(ui.showdown.identity || {}), saveId: closedSave };
  delete ui.context.CareerModeSaveLibraryRuntime;
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.indicator.textContent, 'No Active Showdown', 'the save id alone identifies the closed Showdown');
  ui.showdown.identity.saveId = 'save_' + 'd'.repeat(24);
  ui.context.refreshMainMenuExperience();
  assert.equal(ui.indicator.textContent, 'Season 1 / 3', 'another save stays a live career');
  // ...and Home drawn before the pair answered is redrawn once the pair is initialised
  const identitySource = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../js/onlinePlayerIdentity.js'), 'utf8');
  assert.match(identitySource, /\.finally\(\(\)=>\{persistentPairSyncPromise=null;[^}]*try\{root\.refreshMainMenuExperience\?\.\(\);\}catch\(_\)\{\}\}\);return persistentPairSyncPromise;\}/);
});
