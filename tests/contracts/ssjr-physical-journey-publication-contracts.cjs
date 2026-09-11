"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");

const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("js/app.js","utf8");
const menu=fs.readFileSync("js/menuExperience.js","utf8");
const manifest=fs.readFileSync("manifest.webmanifest","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const bootstrap=fs.readFileSync("js/ssjr.js","utf8");
const recorder=fs.readFileSync("js/ssjrPhysicalJourneyAcceptance.js","utf8");
const validator=fs.readFileSync("scripts/validate-ssjr-physical-journey-evidence.mjs","utf8");
const guide=fs.readFileSync("PHYSICAL_JOURNEY_ACCEPTANCE.md","utf8");
const release=fs.readFileSync("RELEASE_V1.9.1_R19.md","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const supplemental=JSON.parse(fs.readFileSync("POS20_SUPPLEMENTAL_PRODUCT_TESTS.json","utf8"));

assert.match(index,/meta name="app-asset-revision" content="1\.9\.1-r19"/);
assert.equal(index.includes("?v=1.9.1-r18"),false,"r19 HTML shell must not retain r18 asset queries");
assert.match(app,/VISUAL_FIDELITY_STYLESHEET="css\/visual-fidelity-r3\.css\?v=1\.9\.1-r19"/);
assert.match(menu,/marco-reus-2015-cc-by\.webp\?v=1\.9\.1-r19/);
assert.equal(manifest.includes("?v=1.9.1-r18"),false,"r19 manifest must not retain r18 icon queries");
assert.match(manifest,/showdown-192\.svg\?v=1\.9\.1-r19/);
assert.match(worker,/const RUNTIME_REVISION = "1\.9\.1-r19";/);
assert.match(worker,/const PREVIOUS_RUNTIME_REVISION = "1\.9\.1-r18";/);
assert.match(worker,/"js\/ssjrPhysicalJourneyAcceptance\.js"/,"r19 offline shell must retain the acceptance recorder across physical offline/reload proof");
assert.match(bootstrap,/params\.get\("ssjr-physical"\)==="1"/);
assert.match(bootstrap,/ssjr-physical-journey-acceptance/);
assert.match(bootstrap,/js\/ssjrPhysicalJourneyAcceptance\.js/);
assert.match(recorder,/physicalJourneyMode:true/);
assert.match(recorder,/candidateCAutomaticApply:false/);
assert.match(recorder,/recorderNetworkRequests:false/);
assert.doesNotMatch(recorder,/\bfetch\s*\(/);
assert.match(validator,/validatePhysicalJourneyPair/);
assert.match(guide,/ssjr-acceptance=1&ssjr-physical=1/);
assert.match(guide,/Chromebook host/i);
assert.match(guide,/iPhone peer/i);
assert.match(guide,/do not apply Candidate C/i);
assert.match(release,/MDP remains `95\.50\/100`/);
assert.match(release,/SSJR-1\.1 remains exactly `0\/100`/);
assert.match(release,/no Firestore Rules change/i);
assert.equal(pkg.scripts["test:ssjr:physical-journey"],"node tests/contracts/ssjr-physical-journey-acceptance-contracts.cjs && node tests/contracts/ssjr-physical-journey-publication-contracts.cjs");
assert.equal(pkg.scripts["test:ssjr:physical-journey:browser"],"node tests/browser/ssjr-physical-journey-acceptance-audit.cjs");
assert.equal(pkg.scripts["validate:ssjr-physical-journey"],"node scripts/validate-ssjr-physical-journey-evidence.mjs");
for(const command of [pkg.scripts["test:ssjr"],pkg.scripts["test:ssjr:browser"]])assert.match(command,/ssjr-physical-journey/);
for(const testPath of ["tests/contracts/ssjr-physical-journey-acceptance-contracts.cjs","tests/contracts/ssjr-physical-journey-publication-contracts.cjs"]){
  const item=supplemental.tests.find(entry=>entry.path===testPath);assert.ok(item,`POS20 supplemental routing missing ${testPath}`);assert.ok(item.patterns.some(pattern=>pattern.includes("ssjrPhysicalJourneyAcceptance")),`${testPath} must route recorder changes`);assert.ok(item.patterns.some(pattern=>pattern.includes("service-worker")),`${testPath} must route offline-shell changes`);
}

console.log("PASS r19 Physical Journey acceptance instrumentation is coherently versioned, offline-retained, query-gated and permanently routed into POS20 without changing provider authority");
