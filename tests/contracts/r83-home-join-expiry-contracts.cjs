"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {world,MINUTE}=require("../support/home-join-window-fixture.cjs");
test("JOIN changes to CHECK STATUS when the local expiry timer fires without reads or a Home refresh",async()=>{
  const w=world();await w.start();const nik=w.page("nik");await nik.init();
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");
  const reads=w.reads.length;
  await w.advance(29*MINUTE-1);assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");
  await w.advance(51);assert.equal(nik.label(),"CHECK STATUS");
  assert.equal(w.reads.length,reads);assert.equal(w.listeners.size,0);
});
test("discovery stops at its deadline and redraws CHECK STATUS without a read",async()=>{
  const w=world(),nik=w.page("nik");await nik.init();
  assert.equal(nik.label(),"WAITING FOR DANIEL");const reads=w.reads.length;
  await w.advance(10*MINUTE);assert.equal(nik.label(),"CHECK STATUS");
  assert.equal(w.reads.length,reads);assert.equal(w.listeners.size,0);
});
test("stopping discovery after a suspended clock expires JOIN redraws even when JOIN already detached the watch",async()=>{
  const w=world();await w.start();const nik=w.page("nik");await nik.init();
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");assert.equal(w.listeners.size,0);
  const reads=w.reads.length;
  // A suspended tab / gallery clock jump: the local timeout has not run yet.
  w.jump(29*MINUTE);nik.pair.stopJoinNoteWatch();
  assert.equal(nik.label(),"CHECK STATUS");assert.equal(w.reads.length,reads);
});
