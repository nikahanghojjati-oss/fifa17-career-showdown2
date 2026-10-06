"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");

const providerSource = fs.readFileSync("js/sparkSharedTransferChallenge.js", "utf8");
const rulesSource = fs.readFileSync("firestore.transfer-challenge-production.fragment.rules", "utf8");

assert.match(
  providerSource,
  /stspHash\(\{actorRole:ctx\.role,type,operationId,baseRevision,\.\.\.normalizedPayload\},cryptoImpl\)/,
  "provider must still hash the private normalized payload into the operation hash"
);
assert.match(
  providerSource,
  /operationIds\.push\(operationId\);next\.operationTypes\.push\(type\);next\.operationHashes\.push\(operationHash\);next\.baseRevisions\.push\(revision\);next\.actorRoles\.push\(ctx\.role\)/,
  "provider must still publish the hash and all command metadata together"
);
assert.match(
  providerSource,
  /CANONICAL_LEAGUE_IDS\.length!==36\|\|CANONICAL_NATIONALITY_IDS\.length!==164/,
  "repro assumes the production catalog remains 36 leagues plus 164 nationalities"
);
assert.match(
  rulesSource,
  /match \/transferChallenges\/\{transferId\}[\s\S]*?allow get: if ssjrEntitled\(rivalryId\);/,
  "the rival must still be allowed to read the public transfer ledger"
);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value) {
  return "sha256:" + crypto.createHash("sha256").update(canonical(value)).digest("hex");
}

// The real app exposes 36 league IDs and 164 nationality IDs. Synthetic IDs are
// sufficient here because the weakness is the cardinality of the public catalog:
// an attacker can substitute the real repository-owned IDs byte-for-byte.
const candidates = [
  ...Array.from({length:36}, (_, i) => ({type:"league", valueId:`league-${i}`})),
  ...Array.from({length:164}, (_, i) => ({type:"nationality", valueId:`nationality-${i}`}))
];

const publicReceipt = {
  actorRole:"playerOne",
  type:"lock-guesses",
  operationId:"transfer_op_" + "a".repeat(32),
  baseRevision:2
};
const secret = {slot:1, type:"nationality", valueId:"nationality-73"};
const publicHash = hash({...publicReceipt, guesses:[secret]});

let recovered = null;
let attempts = 0;
for (const candidate of candidates) {
  attempts += 1;
  const guess = {slot:1, type:candidate.type, valueId:candidate.valueId};
  if (hash({...publicReceipt, guesses:[guess]}) === publicHash) {
    recovered = guess;
    break;
  }
}

console.log(JSON.stringify({
  publicHash,
  attempts,
  candidateCount:candidates.length,
  recovered,
  threeSlotUpperBound:Math.pow(candidates.length + 1, 3)
}, null, 2));

// Privacy control: a rival-readable receipt must not let an exhaustive catalog
// search verify the private guess before COMPLETED. This assertion is expected
// to fail on the vulnerable design.
assert.equal(recovered, null, "private guess is recoverable from the public operation hash");
