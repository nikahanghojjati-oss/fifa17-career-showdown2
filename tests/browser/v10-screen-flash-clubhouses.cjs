#!/usr/bin/env node
"use strict";
// r100 B7: the flash audit in the three new clubhouses (Silver, Metallic Black, Premium Matte Black). Wooden runs on every
// Gate route as V10_FLASH_BROWSER; this is V10_FLASH_CLUBHOUSES, routed by the POS20 router when a clubhouse-look file
// changes (or on any full seal). All three always run, so one red run still shows every clubhouse's problems; the exit
// code is red if any clubhouse failed.
const {spawnSync}=require("node:child_process");
const path=require("node:path");
const AUDIT=path.join(__dirname,"v10-screen-flash-audit.cjs");
const failed=[];
for(const clubhouse of ["silver","black","matte"]){
  console.log(`\n== v10 screen flash audit: ${clubhouse} clubhouse ==`);
  const run=spawnSync(process.execPath,[AUDIT],{stdio:"inherit",env:{...process.env,CMS_CHROMIUM_MULTI_CONTEXT:"1",CMS_CLUBHOUSE:clubhouse}});
  if(run.status!==0)failed.push(`${clubhouse} (${run.status===null?run.signal:`exit ${run.status}`})`);
}
if(failed.length){console.error(`v10 screen flash audit FAILED in: ${failed.join(", ")}`);process.exit(1);}
console.log("v10 screen flash audit: PASS in silver, black and matte clubhouses");
