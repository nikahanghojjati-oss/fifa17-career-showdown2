"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const {world,MINUTE,INBOX,settle}=require("../support/home-join-window-fixture.cjs");
for(const minute of [16,28])test(`F2: Nik opens Home at minute ${minute} and joins the actual START invite`,async()=>{
  const w=world(),start=w.now(),rid=await w.start();await w.advance(minute*MINUTE);
  const nik=w.page("nik");await nik.init();
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");assert.equal(nik.pair.getJoinNoteState().note?.rivalryId,rid,"the Home JOIN must still be usable");
  assert.equal(w.docs.get(INBOX).expiresAt.toMillis(),start+29*MINUTE);
  assert.equal(w.docs.get(`rivalries/${rid}/invites/${rid}`).data.expiresAt.toMillis(),start+29*MINUTE,"invite and note share the full window");
  await nik.tap();assert.equal(nik.redeems,1);assert.equal(nik.entered,1);assert.equal(nik.pair.getState().connectionState,"active");
});
test("F2: after 30 minutes Home hides JOIN and the real provider refuses the expired code",async()=>{
  const w=world(),rid=await w.start();await w.advance(29*MINUTE+100);
  const nik=w.page("nik");await nik.init();assert.equal(nik.pair.getJoinNoteState().note,null);
  const result=await nik.provider.redeemPairing({user:{uid:"nik"},identity:nik.device,binding:nik.binding,capability:rid,firestore:{},firebaseSdk:w.sdk,cryptoImpl:webcrypto});
  assert.equal(result.code,"PAIRING_CAPABILITY_EXPIRED");assert.equal(nik.entered,0);
});
test("F3: an eleven-minute visible Home wait visibly pauses; its CHECK STATUS tap finds Daniel's next START",async()=>{
  const w=world(),nik=w.page("nik");await nik.init();assert.equal(nik.label(),"WAITING FOR DANIEL");
  await w.advance(11*MINUTE);assert.equal(w.listeners.size,0);
  assert.equal(nik.label(),"CHECK STATUS","Home must stop promising an automatic wait when discovery stops");
  const rid=await w.start();assert.equal(nik.pair.getJoinNoteState().note,null);
  await nik.tap();assert.equal(nik.redeems,1);assert.equal(nik.entered,1);assert.equal(nik.pair.getState().rivalryId,rid);
});
test("F3: an untapped JOIN expires into CHECK STATUS, which finds and joins the replacement",async()=>{
  const w=world(),rid=await w.start(),nik=w.page("nik");await nik.init();assert.equal(nik.pair.getJoinNoteState().note?.rivalryId,rid);
  assert.equal(w.listeners.size,0,"JOIN detaches the listener");const reads=w.reads.length;
  await w.advance(29*MINUTE+100);assert.equal(w.reads.length,reads,"expiry performs no reads");
  assert.equal(nik.label(),"CHECK STATUS","expiry must provide an honest, visible recovery action");
  const replacement=await w.start();assert.notEqual(replacement,rid);await nik.tap();
  assert.equal(nik.pair.getState().rivalryId,replacement);assert.equal(nik.redeems,1);assert.equal(nik.entered,1);
});
test("Home watching and failed-listener rechecks remain bounded, hidden/off-Home reads stay zero, and rendering never rechecks",async()=>{
  const w=world(),nik=w.page("nik");await nik.init();w.failListener();await settle();
  await w.advance(11*MINUTE);assert.equal(nik.label(),"CHECK STATUS");assert.equal(w.listeners.size,0);
  assert.ok(w.reads.filter(path=>path===INBOX).length<=22,"one failed-listener visit costs at most the bounded 30-second checks");
  let reads=w.reads.length;for(let i=0;i<20;i++)nik.identity.refreshHome();await w.advance(60*MINUTE);assert.equal(w.reads.length,reads,"no endless fallback poll or render-driven checks");
  await nik.visibility(false);reads=w.reads.length;await w.advance(60*MINUTE);assert.equal(w.reads.length,reads);
  await nik.visibility(true);assert.equal(w.listeners.size,1);await nik.screen("settings");reads=w.reads.length;
  await w.advance(60*MINUTE);assert.equal(w.listeners.size,0);assert.equal(w.reads.length,reads);
});
