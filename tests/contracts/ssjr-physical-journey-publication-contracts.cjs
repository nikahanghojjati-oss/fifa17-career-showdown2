"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");

const index=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("js/app.js","utf8");
const menu=fs.readFileSync("js/menuExperience.js","utf8");
const manifest=fs.readFileSync("manifest.webmanifest","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const bootstrap=fs.readFileSync("js/ssjr.js","utf8");
const entry=fs.readFileSync("js/productionSharedJourneyEntry.js","utf8");
const reconciliation=fs.readFileSync("js/productionSharedLocalReconciliation.js","utf8");
const recorder=fs.readFileSync("js/ssjrPhysicalJourneyAcceptance.js","utf8");
const validator=fs.readFileSync("scripts/validate-ssjr-physical-journey-evidence.mjs","utf8");
const guide=fs.readFileSync("SSJR2_PHYSICAL_RUN_GUIDE.md","utf8"),retired=fs.readFileSync("PHYSICAL_JOURNEY_ACCEPTANCE.md","utf8");
const release=fs.readFileSync("RELEASE_V1.9.1_R20.md","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const supplemental=JSON.parse(fs.readFileSync("POS20_SUPPLEMENTAL_PRODUCT_TESTS.json","utf8"));

const currentRevision=(index.match(/meta name="app-asset-revision" content="([^"]+)"/)||[])[1];
assert.match(currentRevision||"",new RegExp(`^${pkg.version.replace(/\./g,"\\.")}-r[1-9]\\d*$`));
assert.match(app,new RegExp(`VISUAL_FIDELITY_STYLESHEET="css\\/visual-fidelity-r3\\.css\\?v=${currentRevision.replace(/\./g,"\\.")}"`));
assert.match(menu,new RegExp(`marco-reus-2015-cc-by\\.webp\\?v=${currentRevision.replace(/\./g,"\\.")}`),
  "lazy menu image must share the current whole-shell identity while the acceptance recorder implementation remains historically r20");
assert.match(manifest,new RegExp(`showdown-192\\.svg\\?v=${currentRevision.replace(/\./g,"\\.")}`));
assert.match(worker,new RegExp(`const RUNTIME_REVISION = "${currentRevision.replace(/\./g,"\\.")}";`));
assert.match(worker,/"js\/ssjrPhysicalJourneyAcceptance\.js"/,"current offline shell must retain the acceptance recorder across physical offline/reload proof");
assert.match(bootstrap,/params\.get\("ssjr-physical"\)==="1"/);
assert.match(bootstrap,/const ssjrTestEnabled=params\.get\("ssjr"\)==="1";/,"r85: ?ssjr=1 turns on the simple SSJR test");
assert.match(bootstrap,/if\(ssjrTestEnabled&&!acceptanceEnabled\)return install\("ssjr-physical-journey-acceptance"/,"r85: the simple test loads only its panel");
assert.match(bootstrap,/ssjr-physical-journey-acceptance/);
assert.match(bootstrap,/js\/ssjrPhysicalJourneyAcceptance\.js/);
assert.match(entry,/career-mode-remote-joining-state-change|subscribe/,
  "current Shared Journey entry must observe Remote Joining state for peer handoff");
assert.match(entry,/peer/i,"current Shared Journey entry must contain an explicit peer handoff boundary");
assert.match(reconciliation,/captureLocalReconciliationBaseline|verifyLocalReconciliationPreview/,
  "current Local Reconciliation must bracket the read-only preview with the acceptance storage proof");
assert.match(recorder,/physicalJourneyMode:true/);
assert.match(recorder,/candidateCAutomaticApply:false/);
assert.match(recorder,/recorderNetworkWrites:false/);
assert.match(recorder,/1\.9\.1-r20/);
assert.doesNotMatch(recorder,/\bfetch\s*\(/);
assert.match(validator,/validatePhysicalJourneyPair/);
assert.match(validator,/1\.9\.8-r84/);
assert.match(guide,/SSJR test: one 3-season game, Daniel and Nik \(r85, SSJR-2\.2\)/);
assert.match(guide,/\?ssjr=1`/);
assert.match(guide,/Nothing to type/);
assert.match(guide,/SAVE RESULT FILE/);
assert.doesNotMatch(guide,/RESET RECORDER|SAVE LABELS|ssjr-acceptance=1/,"r85: the simple guide has no labels, reset or old URL");
assert.match(retired,/retired \(r85\)/);
assert.match(retired,/never apply Candidate C/i);
assert.match(retired,/Both devices/);
assert.match(release,/Runtime r20/i);
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

console.log("PASS r85 Physical Journey acceptance tooling is coherently versioned, offline-retained, query-gated and permanently routed into POS20 without changing provider authority");
