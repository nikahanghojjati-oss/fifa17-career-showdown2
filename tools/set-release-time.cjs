#!/usr/bin/env node
"use strict";
// 2.0.0 release time: the one place the lead sets it at freeze. Every start constant that must equal the release time is
// listed here; the release contract (tests/contracts/r87-release-contracts.cjs RX2) fails if any of them differ.
//   node tools/set-release-time.cjs 2026-11-01T17:00:00Z   (sets them all)
//   node tools/set-release-time.cjs                        (prints them)
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const RELEASE_TIME_CONSTANTS=Object.freeze([
  {file:"js/rosterRouletteStep.js",name:"RRR_FROM_MS"},
  {file:"js/sparkSharedTransferChallenge.js",name:"ROULETTE_FROM_MS"}
]);
const pattern=name=>new RegExp(`(const ${name}=Date\\.parse\\(")([^"]+)("\\);)`);
function read(){return RELEASE_TIME_CONSTANTS.map(c=>{const source=fs.readFileSync(path.join(ROOT,c.file),"utf8"),m=pattern(c.name).exec(source);if(!m)throw new Error(`${c.file}: no ${c.name}=Date.parse("...") literal`);return {...c,value:m[2]};});}
if(require.main===module){
  const at=process.argv[2];
  if(at){
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)||!Number.isFinite(Date.parse(at))){console.error(`not a UTC time like 2026-11-01T17:00:00Z: ${at}`);process.exit(1);}
    for(const c of RELEASE_TIME_CONSTANTS){const file=path.join(ROOT,c.file),source=fs.readFileSync(file,"utf8");if(!pattern(c.name).test(source))throw new Error(`${c.file}: no ${c.name} literal`);fs.writeFileSync(file,source.replace(pattern(c.name),`$1${at}$3`));}
  }
  for(const c of read())console.log(`${c.value}  ${c.name}  ${c.file}`);
}
module.exports={RELEASE_TIME_CONSTANTS,read};
