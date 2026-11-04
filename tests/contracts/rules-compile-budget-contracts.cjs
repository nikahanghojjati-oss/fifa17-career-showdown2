"use strict";
// r88 Rules slimming (Fable job 19): the composed production Rules must stay inside a compile-cost budget.
//
// The Firebase Rules service rejects a ruleset with HTTP 503 once its compile runs past about 5.1 s, and its speed
// swings by more than 2x within minutes. The 2.1.0 deploy (main 666df321) failed 24 times that way. Measured with the
// compile-only probe (scripts/time-firestore-rules-compile.mjs), the cost follows the expansion model in
// tests/support/rules-compile-cost.cjs: chiefly the sum of the fully expanded helper-function bodies. This contract
// pins that model on the composed artifact (the exact text the deploy publishes), with headroom for the r89 Sacked
// change (about +1,100 expansion), so growth past the budget fails here instead of at the deploy.
const assert=require("node:assert/strict");
const {composeCandidate}=require("../support/composed-production-rules.cjs");
const {measure,report}=require("../support/rules-compile-cost.cjs");

// Measured on the localized 2.1.0 artifact (2026-11-04): 242 functions, 153 with parameters (137 moved into their match
// blocks), sumParameterizedExpansions 31,490 (102,905 before the localize step), sumFunctionExpansions 102,404,
// sumAllowExpansions 68,464, maxExpansion 6,117. Probe round 14: 1.7-1.9 s against 4.5-5.5 s for the unchanged Rules.
// The parameterized sum tracks the compile time; the others catch a shape change the model would otherwise miss.
const BUDGET=Object.freeze({
  functions:250,
  parameterizedFunctions:175,
  sumParameterizedExpansions:38000,
  sumFunctionExpansions:112000,
  sumAllowExpansions:76000,
  maxExpansion:7000
});

const artifact=composeCandidate();
const m=measure(artifact);
process.stdout.write(`RULES_COMPILE_BUDGET ${Object.keys(BUDGET).map(key=>`${key}=${m[key]}/${BUDGET[key]}`).join(' ')}\n`);
for(const key of Object.keys(BUDGET)){
  assert.ok(m[key]<=BUDGET[key],`composed Rules exceed the compile-cost budget: ${key}=${m[key]} > ${BUDGET[key]}\n${report(m,5)}\nKeep new validators single-use with wildcard or request/resource arguments so the localize build step can move them, hoist shared conjuncts, or raise the budget only with a probe run (.github/workflows/measure-firestore-rules-compile.yml) that shows 3/3 compiles well under 5 s.`);
}
console.log("PASS rules-compile-budget-contracts");
