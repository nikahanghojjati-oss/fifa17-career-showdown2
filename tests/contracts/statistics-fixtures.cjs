const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert');

const context = { console };
context.window = context;
context.currentShowdown = null;
context.loadLegacyShowdowns = () => [];
context.loadSavedShowdown = () => null;
context.getLegacyStorageRevision = () => 0;
vm.createContext(context);

const scoringSource = fs.readFileSync('js/scoring.js', 'utf8');
vm.runInContext(scoringSource, context, { filename: 'js/scoring.js' });
const analyticsSource = fs.readFileSync('js/analytics.js', 'utf8');
vm.runInContext(`${analyticsSource}\n;globalThis.__analyticsTest = { buildCareerAnalytics, buildRivalryAnalytics };`, context, { filename: 'js/analytics.js' });
const api = context.__analyticsTest;

const history = [
  {
    id: 's1',
    name: 'First Rivalry',
    status: 'Completed',
    managers: { playerOne: 'Alex', playerTwo: 'Jordan' },
    clubs: { playerOne: 'Arsenal', playerTwo: 'Chelsea' },
    selectedLeague: { id: 'premier-league', name: 'Premier League' },
    score: { playerOne: 6, playerTwo: 5 },
    transferChallenges: [{
      seasonNumber: 1,
      status: 'completed',
      signings: {
        playerOne: [{ name: 'A', release: false }, { name: 'B', release: true }],
        playerTwo: [{ name: 'C', release: false }]
      }
    }],
    rounds: [{
      roundNumber: 1,
      winner: 'playerOne',
      playerOne: {
        leaguePosition: 1,
        leaguePoints: 100,
        leagueGoals: 95,
        domesticCup: true,
        championsLeague: false,
        topScorer: true,
        topAssist: false,
        scoring: { total: 6, performanceBonus: 1, individualAwardsBonus: 1 }
      },
      playerTwo: {
        leaguePosition: 2,
        leaguePoints: 90,
        leagueGoals: 85,
        domesticCup: false,
        championsLeague: true,
        topScorer: false,
        topAssist: false,
        scoring: { total: 5, performanceBonus: 0, individualAwardsBonus: 0 }
      }
    }]
  },
  {
    id: 's2',
    name: 'Second Rivalry',
    status: 'Completed',
    managers: { playerOne: 'Alex', playerTwo: 'Jordan' },
    clubs: { playerOne: 'Liverpool', playerTwo: 'Manchester City' },
    selectedLeague: { id: 'premier-league', name: 'Premier League' },
    score: { playerOne: 6, playerTwo: 10 },
    transferChallenges: [],
    rounds: [
      {
        roundNumber: 1,
        winner: 'playerTwo',
        playerOne: {
          leaguePosition: 3,
          leaguePoints: 80,
          leagueGoals: 80,
          domesticCup: true,
          championsLeague: false,
          topScorer: false,
          topAssist: false,
          scoring: { total: 1, performanceBonus: 0, individualAwardsBonus: 0 }
        },
        playerTwo: {
          leaguePosition: 1,
          leaguePoints: 95,
          leagueGoals: 100,
          domesticCup: false,
          championsLeague: false,
          topScorer: false,
          topAssist: true,
          scoring: { total: 5, performanceBonus: 1, individualAwardsBonus: 1 }
        }
      },
      {
        roundNumber: 2,
        winner: 'draw',
        playerOne: {
          leaguePosition: 2,
          leaguePoints: 88,
          leagueGoals: 91,
          domesticCup: false,
          championsLeague: true,
          topScorer: false,
          topAssist: false,
          scoring: { total: 5, performanceBonus: 0, individualAwardsBonus: 0 }
        },
        playerTwo: {
          leaguePosition: 2,
          leaguePoints: 88,
          leagueGoals: 92,
          domesticCup: false,
          championsLeague: true,
          topScorer: false,
          topAssist: false,
          scoring: { total: 5, performanceBonus: 0, individualAwardsBonus: 0 }
        }
      }
    ]
  }
];

const career = api.buildCareerAnalytics(history);
assert.strictEqual(career.totals.showdowns, 2, 'Career totals must count completed showdowns once.');
assert.strictEqual(career.totals.seasons, 3, 'Career totals must count showdown seasons once, not once per manager.');
assert.strictEqual(career.totals.points, 27, 'Career points total must equal both managers final showdown points.');
assert.strictEqual(career.totals.trophies, 7, 'Career trophy total must include league, domestic-cup and Champions League wins.');
assert.strictEqual(career.managers.length, 2, 'Two distinct manager labels should produce two current career rows. This fixture does not prove stable profile identity semantics.');

const alex = career.managers.find(manager => manager.name === 'Alex');
const jordan = career.managers.find(manager => manager.name === 'Jordan');
assert.ok(alex && jordan, 'Both manager labels must exist in Career Statistics.');
assert.strictEqual(alex.showdowns, 2, 'Alex showdown count is incorrect.');
assert.strictEqual(jordan.showdowns, 2, 'Jordan showdown count is incorrect.');
assert.strictEqual(alex.showdownWins, 1, 'Alex showdown-win count is incorrect.');
assert.strictEqual(jordan.showdownWins, 1, 'Jordan showdown-win count is incorrect.');
assert.strictEqual(alex.totalPoints, 12, 'Alex career points are incorrect.');
assert.strictEqual(jordan.totalPoints, 15, 'Jordan career points are incorrect.');
assert.strictEqual(alex.totalTrophies, 4, 'Alex trophy total is incorrect.');
assert.strictEqual(jordan.totalTrophies, 3, 'Jordan trophy total is incorrect.');
assert.strictEqual(alex.signings, 2, 'Alex transfer signing accumulation is incorrect.');
assert.strictEqual(alex.releasedSignings, 1, 'Alex release accumulation is incorrect.');
assert.strictEqual(jordan.signings, 1, 'Jordan transfer signing accumulation is incorrect.');
assert.strictEqual(career.records.highestLeaguePoints.value, 100, 'Highest league-points record is incorrect.');
assert.strictEqual(career.records.highestLeagueGoals.value, 100, 'Highest league-goals record is incorrect.');
assert.strictEqual(career.records.highestSeasonScore.value, 6, 'Highest season-score record is incorrect.');
assert.strictEqual(career.managers[0].name, 'Alex', 'Career table tie-break should keep the manager with more trophies first.');

const rivalry = api.buildRivalryAnalytics(history[0]);
assert.strictEqual(rivalry.playerOne.name, 'Alex', 'Rivalry manager label changed.');
assert.strictEqual(rivalry.playerOne.totalPoints, 6, 'Rivalry points are incorrect.');
assert.strictEqual(rivalry.playerTwo.totalPoints, 5, 'Rivalry points are incorrect.');
assert.strictEqual(rivalry.seasonRows.length, 1, 'Rivalry season progression is incorrect.');
assert.strictEqual(rivalry.seasonRows[0].winner, 'playerOne', 'Rivalry season winner is incorrect.');

console.log('Career totals, current label-grouped manager records, trophy accumulation, transfer totals, and Rivalry Statistics fixtures passed.');
