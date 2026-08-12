const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert');

const context = { console };
context.window = context;
context.cloneForStorage = value => JSON.parse(JSON.stringify(value));
vm.createContext(context);

vm.runInContext(fs.readFileSync('js/scoring.js', 'utf8'), context, { filename: 'js/scoring.js' });
const seasonSource = fs.readFileSync('js/seasonEngine.js', 'utf8');
vm.runInContext(
  `${seasonSource}\n;globalThis.__seasonReviewTest = { buildSeasonRecord, getSeasonReviewFingerprint, buildTrustedSeasonRecordFromReview };`,
  context,
  { filename: 'js/seasonEngine.js' }
);

const api = context.__seasonReviewTest;
const playerOne = {
  leaguePosition: 1,
  leaguePoints: 100,
  leagueGoals: 100,
  domesticCup: true,
  championsLeague: true,
  topScorer: true,
  topAssist: true
};
const playerTwo = {
  leaguePosition: 2,
  leaguePoints: 84,
  leagueGoals: 79,
  domesticCup: false,
  championsLeague: false,
  topScorer: false,
  topAssist: false
};

const preview = api.buildSeasonRecord(2, { ...playerOne }, { ...playerTwo }, null);
assert.strictEqual(preview.completedAt, null, 'Review preview must not claim a completion timestamp.');
assert.strictEqual(preview.playerOne.scoring.total, 11, 'Season Review must use locked max-11 scoring.');
assert.strictEqual(preview.playerTwo.scoring.total, 0, 'Review scoring fixture changed unexpectedly.');
assert.strictEqual(preview.winner, 'playerOne', 'Review winner must use the canonical scoring winner.');

const fingerprint = api.getSeasonReviewFingerprint(preview);
assert.ok(fingerprint, 'Reviewed snapshot must have a deterministic fingerprint.');

const draft = {
  showdownId: 'fixture',
  seasonNumber: 2,
  roundRecord: JSON.parse(JSON.stringify(preview)),
  fingerprint
};
const trusted = api.buildTrustedSeasonRecordFromReview(draft);
assert.ok(typeof trusted.completedAt === 'string' && trusted.completedAt.length > 10, 'Completion timestamp must be created only at final confirmation.');
assert.strictEqual(api.getSeasonReviewFingerprint(trusted), fingerprint, 'Confirmed record must exactly match the reviewed snapshot.');

const tampered = JSON.parse(JSON.stringify(draft));
tampered.roundRecord.playerOne.leaguePoints = 99;
assert.throws(
  () => api.buildTrustedSeasonRecordFromReview(tampered),
  /changed before confirmation/i,
  'Tampered reviewed data must be blocked before persistence.'
);

console.log('Season Review preview, canonical scoring, fingerprint and tamper-blocking fixtures passed.');
