'use strict';

const fs = require('fs');
const assert = require('assert');

const rulesPath = 'firestore.transfer-challenge-production.fragment.rules';
const providerPath = 'js/sparkSharedTransferChallenge.js';
const catalogPath = 'data/transferOptions.js';

const rules = fs.readFileSync(rulesPath, 'utf8');
const provider = fs.readFileSync(providerPath, 'utf8');
const catalogSource = fs.readFileSync(catalogPath, 'utf8');

assert(rules.includes('function ssjrTransferValidOptionId(value)'));
assert(rules.includes("value.matches('^[a-z0-9]+(-[a-z0-9]+)*$')"));
assert(rules.includes('ssjrTransferValidOptionId(value.leagueId)'));
assert(rules.includes('ssjrTransferValidOptionId(value.nationalityId)'));
assert(provider.includes('!catalog.leagueIds.has(item.leagueId)'));
assert(provider.includes('!catalog.nationalityIds.has(item.nationalityId)'));
assert(provider.includes('item.name!==item.name.trim()'));

const explicitLeagueIds = new Set(
  [...catalogSource.matchAll(/"id":"([^"]+)"/g)].map(match => match[1])
);
assert.strictEqual(explicitLeagueIds.size, 36, 'Expected the repository FIFA 17 league catalog to contain 36 explicit IDs.');

const weakRulesOptionId = value =>
  typeof value === 'string'
  && value.length >= 2
  && value.length <= 80
  && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

const weakRulesSigningName = value =>
  typeof value === 'string'
  && value.length >= 1
  && value.length <= 80;

const providerSigningName = value =>
  typeof value === 'string'
  && value.length >= 1
  && value.length <= 80
  && value === value.trim();

const fakeLeagueId = 'definitely-not-a-fifa17-league';
const spacedName = ' Player ';

const observations = {
  fakeLeagueId,
  fakeLeagueIsCanonical: explicitLeagueIds.has(fakeLeagueId),
  rulesAcceptFakeLeagueId: weakRulesOptionId(fakeLeagueId),
  providerAcceptFakeLeagueId: explicitLeagueIds.has(fakeLeagueId),
  spacedName,
  rulesAcceptSpacedName: weakRulesSigningName(spacedName),
  providerAcceptSpacedName: providerSigningName(spacedName)
};

console.log(JSON.stringify(observations, null, 2));

const mismatches = [];
if (observations.rulesAcceptFakeLeagueId !== observations.providerAcceptFakeLeagueId) {
  mismatches.push('fake league ID passes Rules shape but fails provider canonical catalog membership');
}
if (observations.rulesAcceptSpacedName !== observations.providerAcceptSpacedName) {
  mismatches.push('untrimmed signing name passes Rules length check but fails provider trim invariant');
}

assert.deepStrictEqual(
  mismatches,
  [],
  'Firestore transfer write validation is weaker than the normal provider read validation: ' + mismatches.join('; ')
);
