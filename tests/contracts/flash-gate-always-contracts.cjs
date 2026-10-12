#!/usr/bin/env node
"use strict";
// Owner request 2026-10-12 ("make flash test as usual gate as well from now on"): the browser screen-flash guard
// (V10_FLASH_BROWSER, npm run test:v10-flash) runs and blocks on every Showdown Gate route, not only on the full seal.
// POS20 escalates: the router adds V10_FLASH_BROWSER and the VISUAL group to every route, so L3B always runs it.
// Season Results and Final Winner block too, now that PR #824 fixed their old-design frame (no reportOnly).
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {pathToFileURL}=require("node:url");
const ROOT=path.resolve(__dirname,"../..");
const FLASH="V10_FLASH_BROWSER";

(async()=>{
  const router=await import(pathToFileURL(path.join(ROOT,"scripts/pos20-impact-router.mjs")).href);
  const gate=await import(pathToFileURL(path.join(ROOT,"scripts/showdown-gate.mjs")).href);
  assert.equal(gate.groupOf(FLASH),"VISUAL","V10_FLASH_BROWSER belongs to the VISUAL proof group");

  const routes={
    "doc-only":[["README.md"],"POS20_DOC_ONLY"],
    "operations-only":[["NEXT_TASK.md"],"POS20_OPS_ONLY"],
    "small JS":[["js/analytics.js"],"POS20_IMPACT_STATISTICS_ANALYTICS"],
    "full seal":[["js/ui.js"],"POS20_FULL_SEAL"]
  };
  for(const [label,[files,profile]] of Object.entries(routes)){
    const route=router.routeFiles(files);
    assert.equal(route.profile,profile,`${label} route profile`);
    assert.ok(route.proofs.includes(FLASH),`${label} route selects ${FLASH}`);
    assert.ok((route.proofGroups||[]).includes("VISUAL"),`${label} route lists the VISUAL proof group`);
    assert.equal(gate.laneFlags(route).has_visual,true,`${label} route turns L3B on (has_visual=true)`);
    assert.ok(gate.selectedFor("L3B",route).includes(FLASH),`${label} route makes L3B responsible for ${FLASH}`);
    assert.ok(gate.routedIds(route).includes(FLASH),`${label} route makes the seal require ${FLASH}`);
  }
  // Escalation contexts keep it too.
  assert.ok(router.routeFiles(["README.md"],{uncertainty:"HIGH"}).proofs.includes(FLASH),"cognitive full seal selects the flash guard");

  // Season Results and Final Winner are blocking journeys.
  const audit=fs.readFileSync(path.join(ROOT,"tests/browser/v10-screen-flash-audit.cjs"),"utf8");
  for(const name of ["seasonResults","finalWinner"]){
    const line=audit.split(/\r?\n/).find(text=>new RegExp(`\\{\\s*name:\\s*"${name}"`).test(text));
    assert.ok(line,`flash audit still covers the ${name} journey`);
    assert.match(line,/required:\s*true/,`${name} journey stays required`);
    assert.doesNotMatch(line,/reportOnly/,`${name} journey blocks (no reportOnly)`);
  }
  console.log("PASS flash gate always contracts: V10_FLASH_BROWSER is routed to L3B on doc-only, operations-only, small-JS and full-seal routes; Season Results and Final Winner block.");
})().catch(error=>{console.error(error&&error.stack||error);process.exitCode=1;});
