#!/usr/bin/env node
"use strict";

// Job 1048: gameplay truth already exists; the Rule Book and review must describe it.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { FakeNode } = require("../support/fake-dom.cjs");
const ROOT = path.resolve(__dirname, "../..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

const main = new FakeNode("main");
const document = {
  createElement: tag => new FakeNode(tag),
  createDocumentFragment: () => new FakeNode("#fragment", true),
  getElementById: id => main.all().find(node => node.id === id) || null,
  querySelector: selector => selector === "main" ? main : null
};
const context = { document, showScreen() {} };
context.window = context;
vm.createContext(context);
vm.runInContext(read("js/ruleBook.js"), context);
context.createRuleBookScreen();

const sections = main.findByClass("ruleSection");
assert.equal(sections.length, 6, "Six-section Rule Book (r86 adds 06 SPECIAL PLAYER and drops the draws card)");
const section = number => {
  const found = sections.find(node => node.children[0]?.children[0]?.textContent === number);
  assert.ok(found, `Rule Book section ${number} exists`);
  return found.textContent;
};

const format = section("01");
assert.match(format, /most Showdown points.*across all seasons.*wins/i,
  "The Rule Book must describe the all-season accumulated Showdown winner");
assert.match(format, /equal totals.*draw/i,
  "An equal final Showdown points total must be a draw");

const transfer = section("03");
assert.match(transfer, /both managers.*end.*transfer window early/i,
  "Both managers can agree to end the shared transfer window early");
assert.match(transfer, /one manager.*cannot.*alone/i,
  "One manager cannot end the shared transfer window alone");

// Nik 2026-10-29 21:10 UTC: the draws card is gone from the page; the no-tiebreak rules stay in the scoring engine.
assert.ok(!sections.some(node => /DRAWS/.test(node.children[0]?.textContent || "")), "no DRAWS card on the page");
assert.doesNotMatch(main.textContent, /There is no tiebreak|Same Showdown points in a season/, "the draws lines are off the page");
assert.match(read("js/scoring.js"), /no tiebreak/i, "the no-tiebreak rule stays in the scoring engine");
assert.match(section("05"), /^05CONNECTION & RECOVERY/, "card 05 is Connection & Recovery");

assert.match(transfer, /Special Player is a free extra signing: he never counts toward the three, and guesses never release him\./,
  "r86 (Nik 2026-10-29 15:29 UTC): the Special Player is a free extra signing that guesses never release");

const matchPlay = section("02");
assert.match(matchPlay, /1- and 3-season Showdowns: only your Special Player can be trained\./,
  "r86 (Nik 2026-10-29): in 1- and 3-season Showdowns only the Special Player can be trained");
assert.match(matchPlay, /5- and 10-season Showdowns: all players can be trained\./,
  "r86 (Nik 2026-10-29): in 5- and 10-season Showdowns all players can be trained");
assert.doesNotMatch(matchPlay, /allowed only in 5- and 10-season/i, "the old no-training-in-short-Showdowns line is gone");

const special = section("06");
assert.match(special, /^06SPECIAL PLAYER/, "card 06 is the Special Player card");
for (const pattern of [/after Club Assignment, each manager draws one Special Player/, /top 300 FIFA 17 players by potential/,
  /never draw the same player/, /free extra signing\. He doesn't count toward your three signings, and your rival's guesses can never release him\./, /Career Start shows each Special Player's FIFA 17 club/,
  /1- and 3-season Showdowns: your Special Player is the only player you can train\./,
  /5- and 10-season Showdowns: all players can be trained\./, /scores no Showdown points/]) {
  assert.match(special, pattern, `Special Player card: ${pattern}`);
}
assert.doesNotMatch(special, /marquee|\bMP\b/i, "Special Player card never uses the old name");

const seasonSource = read("js/seasonEngine.js");
const initialIntro = seasonSource.match(
  /intro\.className\s*=\s*["']seasonReviewIntro["'];\s*intro\.textContent\s*=\s*["']([^"']+)["'];/
);
assert.ok(initialIntro, "Find the Season Review introduction displayed by its constructor");
assert.match(initialIntro[1], /both managers.*results.*calculated scores/i,
  "The shared review instruction must describe the results and calculated scores");
assert.doesNotMatch(initialIntro[1], /Nothing becomes permanent|Confirm & Save Season/i,
  "Published results must not direct a manager to a button that is absent");

console.log("PASS Job 1048 Rule Book and published Season Review text: 7 assertions.");
