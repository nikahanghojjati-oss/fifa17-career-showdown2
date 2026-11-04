#!/usr/bin/env node
"use strict";
// 2.0.0 release time: the one place the lead sets it at freeze. Every start constant that must equal the release time is
// listed here; the release contract (tests/contracts/r86-release-contracts.cjs RR5) fails if any of them differ.
//   node tools/set-release-time.cjs 2026-11-01T17:00:00Z   (sets them all)
// The release time is the next whole hour at or after the merge + 90 min, so 2.0.0 is live on both phones before any
// Showdown can start on its features (Opus job 15 O15-01). An earlier time is refused unless --allow-early is passed.
//   node tools/set-release-time.cjs                        (prints them)
const fs=require("node:fs");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const RELEASE_TIME_CONSTANTS=Object.freeze([
  {file:"js/rosterRouletteStep.js",name:"RRR_FROM_MS"},
  {file:"js/sparkSharedTransferChallenge.js",name:"ROULETTE_FROM_MS"},
  // Prime Pack (#1149): the guessing round and every 15-a-season total start with the same Showdowns as the roulette.
  {file:"js/iconGuess.js",name:"ICON_FROM_MS"},
  {file:"js/careerScreenSeam.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/touchlineGazette.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/sharedCareerAnalytics.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/productionSharedTransferChallenge.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/productionSharedSeasonResults.js",name:"PRIME_PACK_FROM_MS"},
  {file:"js/commentaryV3.js",name:"PRIME_PACK_FROM_MS"},
  // Special Player from the manager's own club (#1173).
  {file:"js/marqueePlayer.js",name:"OWN_CLUB_FROM_MS"}
]);
// r88's own start time (2.1.x): Chamber Men starts with the Showdowns confirmed from the r88 release on, not with 2.0.0's.
// The r88 release PR pins it with:  node tools/set-release-time.cjs --r88 <UTC time>  (same 90-minute rule).
const R88_RELEASE_TIME_CONSTANTS=Object.freeze([
  {file:"js/chamberMen.js",name:"CHAMBER_FROM_MS"},
  {file:"js/productionSharedTransferChallenge.js",name:"CHAMBER_FROM_MS"}
]);
// r89's own start time (2.2.x): the Sacked tick on Season Results starts with the Showdowns confirmed from the r89 release on.
// The r89 release PR pins it with:  node tools/set-release-time.cjs --r89 <UTC time>  (same 90-minute rule).
const R89_RELEASE_TIME_CONSTANTS=Object.freeze([
  {file:"js/productionSharedSeasonResults.js",name:"SACKED_FROM_MS"}
]);
// js/marqueePlayer.js MARQUEE_FROM_MS is r86's own boundary and is never moved.
const NOT_RELEASE_TIME=Object.freeze(["MARQUEE_FROM_MS"]);
const pattern=name=>new RegExp(`(\\b${name}=Date\\.parse\\(")([^"]+)("\\);)`);
function read(list=RELEASE_TIME_CONSTANTS){return list.map(c=>{const source=fs.readFileSync(path.join(ROOT,c.file),"utf8"),m=pattern(c.name).exec(source);if(!m)throw new Error(`${c.file}: no ${c.name}=Date.parse("...") literal`);return {...c,value:m[2]};});}
if(require.main===module){
  const args=process.argv.slice(2),allowEarly=args.includes("--allow-early"),r88=args.includes("--r88"),r89=args.includes("--r89"),at=args.find(a=>a!=="--allow-early"&&a!=="--r88"&&a!=="--r89");
  const LIST=r89?R89_RELEASE_TIME_CONSTANTS:r88?R88_RELEASE_TIME_CONSTANTS:RELEASE_TIME_CONSTANTS;
  if(at){
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)||!Number.isFinite(Date.parse(at))){console.error(`not a UTC time like 2026-11-01T17:00:00Z: ${at}`);process.exit(1);}
    const earliest=Date.now()+90*60*1000;
    if(Date.parse(at)<earliest&&!allowEarly){
      const next=new Date(Math.ceil(earliest/3600000)*3600000).toISOString().replace(".000Z","Z");
      console.error(`${at} is less than 90 min from now: 2.0.0 must be live on both phones first. Use ${next} (the next whole hour at or after now + 90 min), or pass --allow-early.`);process.exit(1);
    }
    for(const c of LIST){const file=path.join(ROOT,c.file),source=fs.readFileSync(file,"utf8");if(!pattern(c.name).test(source))throw new Error(`${c.file}: no ${c.name} literal`);fs.writeFileSync(file,source.replace(pattern(c.name),`$1${at}$3`));}
  }
  for(const c of read(LIST))console.log(`${c.value}  ${c.name}  ${c.file}`);
}
module.exports={RELEASE_TIME_CONSTANTS,R88_RELEASE_TIME_CONSTANTS,R89_RELEASE_TIME_CONSTANTS,NOT_RELEASE_TIME,read};
