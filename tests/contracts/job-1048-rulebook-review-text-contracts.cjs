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
// r91 / 2.4.0 (Nik 2026-11-11): the cards follow the order a manager meets each step, numbered 01, 02, 03... in that order.
const ORDER = ["THE SHOWDOWN", "SPECIAL PLAYER", "CHAMBER MEN", "SQUAD MANAGEMENT", "ROSTER RUSSIAN ROULETTE", "PRIME PACK",
  "TRANSFER WAR", "PLAYING THE SEASON", "SEASON RESULTS", "END OF THE SHOWDOWN", "CONNECTION & RECOVERY"];
assert.equal(sections.length, ORDER.length, "eleven cards, one per step of the game");
sections.forEach((node, index) => {
  const number = String(index + 1).padStart(2, "0");
  assert.equal(node.children[0]?.children[0]?.textContent, number, `card ${index + 1} is numbered ${number}`);
  assert.equal(node.children[0]?.children[1]?.textContent, ORDER[index], `card ${number} is ${ORDER[index]}`);
});
const section = number => {
  const found = sections.find(node => node.children[0]?.children[0]?.textContent === number);
  assert.ok(found, `Rule Book section ${number} exists`);
  return found.textContent;
};

// The season order line names the real screens in the real order (js/squadSheetStep.js pre/post, the roulette, Prime Pack).
const format = section("01");
assert.match(format, /Daniel starts every Showdown and picks its length: 1, 3, 5 or 10 seasons\./);
assert.match(format, /Chamber Men, Squad Management, Roster Russian Roulette, Prime Pack, Transfer War, Squad Management again, then the season itself and Season Results\./);

// Nik 2026-11-11 15:29 / 15:31 UTC: Squad Management mirrors each manager's own save; season 1 keeps the launch overalls.
const squad = section("04");
assert.match(squad, /Set the same formation and squad as in your own Career Mode save for this Showdown: the same players, the same overalls and the same departures\./);
assert.match(squad, /Season 1 is your club's FIFA 17 launch squad at its launch overalls\./);
assert.match(squad, /From season 2, also set each player's overall to match your save\./);
assert.match(squad, /after Chamber Men, and again after the Transfer War/);

const end = section("10");
assert.match(end, /most Showdown points.*across all seasons.*wins/i,
  "The Rule Book must describe the all-season accumulated Showdown winner");
assert.match(end, /equal totals.*draw/i,
  "An equal final Showdown points total must be a draw");

const transfer = section("07");
assert.match(transfer, /both managers.*close the window early/i,
  "Both managers can agree to end the shared transfer window early");
assert.match(transfer, /one manager.*cannot.*alone/i,
  "One manager cannot end the shared transfer window alone");
assert.match(transfer, /all 17,597 players, free agents included/, "the autocomplete list is the full FIFA 17 launch list (js/playerSearch.js)");

// Nik 2026-10-29 21:10 UTC: the draws card is gone from the page; the no-tiebreak rules stay in the scoring engine.
assert.ok(!sections.some(node => /DRAWS/.test(node.children[0]?.textContent || "")), "no DRAWS card on the page");
assert.doesNotMatch(main.textContent, /There is no tiebreak|Same Showdown points in a season/, "the draws lines are off the page");
assert.match(read("js/scoring.js"), /no tiebreak/i, "the no-tiebreak rule stays in the scoring engine");
// Nik 2026-11-11 12:35 UTC: no dates in the Rule Book, only today's rules.
assert.doesNotMatch(main.textContent, /20\d\d|Boston time|November|started from/, "no dates or old-era start times");

const play = section("08");
assert.match(play, /1- and 3-season Showdowns: your Special Player is the only player you can train\./,
  "r86 (Nik 2026-10-29): in 1- and 3-season Showdowns only the Special Player can be trained");
assert.match(play, /5- and 10-season Showdowns: all players can be trained\./,
  "r86 (Nik 2026-10-29): in 5- and 10-season Showdowns all players can be trained");
assert.equal((main.textContent.match(/can be trained/g) || []).length, 1, "the training rule is written once");

const special = section("02");
for (const pattern of [/Right after Club Assignment, you each draw one Special Player/, /top 300 FIFA 17 players by potential/,
  /never plays for your own club/, /never draw the same player/,
  /free extra signing\. He never counts toward your three Transfer War signings, and your rival's guesses can never release him\./,
  /Career Start shows his FIFA 17 club/, /roulette can never hit him/, /scores no Showdown points/]) {
  assert.match(special, pattern, `Special Player card: ${pattern}`);
}
assert.doesNotMatch(special, /marquee|\bMP\b/i, "Special Player card never uses the old name");

// Prime Pack (brief RULE_BOOK_REWRITE, Nik 2026-11-11): the card states the player list exactly as data/icons.js holds it:
// the player count, the overall range, and one row per card type with the games its cards come from and how many.
{
  const icons = require(path.join(ROOT, "data/icons.js")).players;
  const pack = section("06");
  const overalls = icons.map(p => p.overall);
  assert.match(pack, new RegExp(`The pack holds ${icons.length} male outfield players, from ${Math.min(...overalls)} to ${Math.max(...overalls)} overall\\.`), "player count and overall range match data/icons.js");
  const ORDER_TYPES = ["Legend", "Icon Prime", "Icon Base", "Hero", "Hall of FUT"];
  const gameKey = g => [/^FC/.test(g) ? 1 : 0, Number(g.replace(/\D+/g, ""))];
  const list = items => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  const expected = ORDER_TYPES.filter(type => icons.some(p => p.cardVersion === type)).map(type => {
    const rows = icons.filter(p => p.cardVersion === type);
    const games = [...new Set(rows.map(p => p.game))].sort((a, b) => { const x = gameKey(a), y = gameKey(b); return x[0] - y[0] || x[1] - y[1]; });
    return [`${type} · ${list(games)}`, String(rows.length)];
  });
  assert.equal(icons.filter(p => !ORDER_TYPES.includes(p.cardVersion)).length, 0, "every card type in data/icons.js has a Rule Book row");
  const table = sections[5].children.find(node => /rulePackTable/.test(node.className));
  assert.ok(table, "the Prime Pack card has its card-type table");
  assert.deepEqual(table.children.map(row => row.children.map(cell => cell.textContent)), expected, "the card-type table matches data/icons.js");
  assert.match(pack, /his highest-rated one, whether Legend, Icon, Hero or Hall of FUT\. On a tie, the Legend or Icon card is used, then the newer game's card\./, "Nik 2026-11-11 15:09 UTC: the highest-rated card wins");
}

const seasonSource = read("js/seasonEngine.js");
const initialIntro = seasonSource.match(
  /intro\.className\s*=\s*["']seasonReviewIntro["'];\s*intro\.textContent\s*=\s*["']([^"']+)["'];/
);
assert.ok(initialIntro, "Find the Season Review introduction displayed by its constructor");
assert.match(initialIntro[1], /both managers.*results.*calculated scores/i,
  "The shared review instruction must describe the results and calculated scores");
assert.doesNotMatch(initialIntro[1], /Nothing becomes permanent|Confirm & Save Season/i,
  "Published results must not direct a manager to a button that is absent");

console.log("PASS Job 1048 Rule Book in game order (01-11) and published Season Review text.");
