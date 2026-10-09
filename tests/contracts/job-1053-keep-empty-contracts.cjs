#!/usr/bin/env node
"use strict";
// JOB-1053: on an empty device a "keep-current" Save Library choice must not become a full clean restore.
// Only an explicit "use-backup" choice may enter the full-library branch or leave the classic-path complement.
// Source anchors on js/restore.js: the two gating conditions depend on the explicit choice alone, never on destinationIsClean.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../.."),SOURCE=fs.readFileSync(path.join(ROOT,"js/restore.js"),"utf8");

// Returns the text of every if(...) condition in the source, with balanced parentheses.
function conditions(source){
  const found=[];
  for(const match of source.matchAll(/\bif\(/g)){
    let depth=1,index=match.index+3;
    for(;index<source.length&&depth>0;index+=1){
      if(source[index]==="(")depth+=1;
      else if(source[index]===")")depth-=1;
    }
    found.push(source.slice(match.index+3,index-1));
  }
  return found;
}

const FULL_LIBRARY_GATE='hasBackupLibrary&&saveLibraryChoice==="use-backup"';
const CLASSIC_COMPLEMENT_GATE='!(hasBackupLibrary&&saveLibraryChoice==="use-backup")';
const checks=[
  ["full-library branch is gated on saveLibraryChoice===\"use-backup\"",()=>{
    assert.equal(conditions(SOURCE).filter(condition=>condition===FULL_LIBRARY_GATE).length,1,"exactly one full-library gate");
  }],
  ["classic-path complement is gated on saveLibraryChoice===\"use-backup\"",()=>{
    assert.equal(conditions(SOURCE).filter(condition=>condition===CLASSIC_COMPLEMENT_GATE).length,1,"exactly one classic-path complement gate");
  }],
  ["destinationIsClean is not part of any Save Library gating if( condition",()=>{
    const gating=conditions(SOURCE).filter(condition=>/hasBackupLibrary/.test(condition)&&/saveLibraryChoice/.test(condition));
    assert.ok(gating.length>=2,"both gating conditions are present");
    for(const condition of gating)assert.doesNotMatch(condition,/destinationIsClean/,`gating condition must not read destinationIsClean: ${condition}`);
  }],
  ["destinationIsClean still selects full-restore-clean inside the explicit use-backup branch",()=>{
    assert.match(SOURCE,/if\(destinationIsClean\)\{\s*summary\.saveLibrary="full-restore-clean";/);
  }],
];

let failed=0;
for(const [name,check] of checks){
  try{check();console.log("PASS "+name);}
  catch(error){failed+=1;console.error("FAIL "+name);console.error(error.message);}
}
if(failed){console.error(`${failed} JOB-1053 contract check(s) failed`);process.exitCode=1;}
