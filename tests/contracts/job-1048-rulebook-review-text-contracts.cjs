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
assert.equal(sections.length, 6, "Keep the existing six-section Rule Book");
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

const tiebreak = section("05");
assert.match(tiebreak, /same league points.*season is a draw/i,
  "After tied Showdown points, league position, and league points the season is a draw");

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
