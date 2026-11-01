"use strict";
// r87 upgrade (R4): a Showdown that was live on 1.9.10 must keep going after the 2.0.0 update. #1164 (F1) holds a phone on
// the last accepted season's results when its "continued into" note (cms.seasonContinued.v1:<rivalry>) is behind the
// server. 1.9.10 never wrote that note, so without this guard every upgraded phone was sent back to Season 1's results
// instead of the season-2 transfer (CE2PG upgrade run, bisected to 76e60a1b). The hold now applies only when this phone has a note,
// and 2.0.0 writes season 1's note as soon as it sees a Showdown with nothing accepted, so 2.0.0 Showdowns keep F1 exactly.
// Run: node tests/contracts/r87-upgrade-continue-hold-contracts.cjs
const assert=require("node:assert/strict");
const path=require("node:path");
const store=new Map();
globalThis.readStorageValue=key=>store.has(key)?store.get(key):null;
globalThis.writeStorageValue=(key,value)=>{store.set(key,String(value));};
const api=require(path.resolve(__dirname,"../../js/productionSharedMultiSeasonProgression.js"));
const hold=api.upgradeHold;
const R="pair_"+"a".repeat(64),R2="pair_"+"b".repeat(64);
let passed=0;
function test(name,fn){store.clear();fn();passed+=1;console.log(`ok ${name}`);}

test("UH1 the progression module exposes its upgrade-hold decision",()=>{
  assert.ok(hold&&typeof hold.holds==="function"&&typeof hold.note==="function","upgradeHold.holds/note missing: the hold cannot tell a 1.9.10 Showdown from a 2.0.0 one");
});
test("UH2 a Showdown carried over from 1.9.10 (no note) is never held: CONTINUE SHOWDOWN goes on to the next season",()=>{
  for(const [accepted,total] of [[1,3],[2,3],[1,10],[5,10],[9,10]])assert.equal(hold.holds(R,accepted,total,false),false,`held at ${accepted}/${total} with no note`);
});
test("UH3 a 2.0.0 Showdown notes season 1 while nothing is accepted, and keeps F1's hold after season 1 is accepted",()=>{
  hold.note(R,0);assert.equal(hold.continuedInto(R),1);
  assert.equal(hold.holds(R,1,3,false),true,"accepted season 1 but never tapped CONTINUE: must reopen its results");
  hold.markContinued(R,2);assert.equal(hold.holds(R,1,3,false),false);
  assert.equal(hold.holds(R,2,3,false),true);hold.markContinued(R,3);assert.equal(hold.holds(R,2,3,false),false);
});
test("UH4 the note is per Showdown pairing and only written while nothing is accepted",()=>{
  hold.note(R,0);hold.note(R2,1);hold.note(R2,2);
  assert.equal(hold.continuedInto(R2),0);assert.equal(hold.holds(R2,1,3,false),false);assert.equal(hold.holds(R,1,3,false),true);
});
test("UH5 a 1.9.10 Showdown upgraded during season 1 behaves like a 2.0.0 one",()=>{
  hold.note(R,0);assert.equal(hold.holds(R,1,5,false),true);
});
test("UH6 the final season and a closed Showdown are never held (F1's own limits stay)",()=>{
  hold.note(R,0);assert.equal(hold.holds(R,3,3,false),false);assert.equal(hold.holds(R,1,3,true),false);assert.equal(hold.holds(R,0,3,false),false);
});
console.log(`r87 upgrade continue-hold contracts: ${passed} passed`);
