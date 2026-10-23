"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {game,UID,partnerPath}=require("../support/real-pair-fixture.cjs");

for(const first of ["playerOne","playerTwo"])test(`${first} reopens first: interrupted first real pairing recovers both records and next START supplies Home JOIN`,async()=>{
  const g=game(),id=await g.interrupted();
  for(const role of first==="playerOne"?["playerOne","playerTwo"]:["playerTwo","playerOne"]){
    const p=g.page(role);assert.equal((await p.pair.initialize({force:true})).connectionState,"active");
    await p.pair.ensurePartnerRecord();
    assert.equal(g.docs.get(partnerPath(role))?.active,true,`${role}: fresh healthy page restores permanent pairing when neither record existed`);
    assert.equal(g.docs.get(partnerPath(role)).pairedViaRivalryId,id);
    assert.deepEqual(Object.keys(g.docs.get(partnerPath(role))).sort(),["active","myRole","pairedAt","pairedViaRivalryId","partnerAccountId","schemaVersion","updatedAt"]);
  }
  // Finish the accepted Showdown (the terminal provider is outside this client contract).
  g.docs.get(`rivalries/${id}`).data.connectionState="closed";g.advance(1000);g.prepare("playerOne");
  const d=g.page("playerOne"),n=g.page("playerTwo");await d.pair.initialize({force:true});await n.pair.initialize({force:true});
  const next=await d.pair.startPairing({managerRole:"playerOne"});assert.match(next.capability,/^CMS17-pair_/);
  await n.pair.readPartnerRecord();await n.pair.readJoinNote({fresh:true});
  assert.equal(n.pair.getJoinNoteState().note?.rivalryId,next.rivalryId,"Nik's Home has Daniel's next JOIN note");
  assert.equal((await n.pair.joinPairing(next.capability,{managerRole:"playerTwo",autoContinue:false})).connectionState,"active");
});

test("a failed fresh-page repair stays retriable on the same page once the connection returns",async()=>{
  const g=game();await g.interrupted();const n=g.page("playerTwo");await n.pair.initialize({force:true});await n.pair.readPartnerRecord();
  g.failWrites(2);const first=n.pair.ensurePartnerRecord();assert.equal(n.pair.ensurePartnerRecord(),first,"recovery has one flight");await first;assert.equal(g.docs.has(partnerPath("playerTwo")),false);
  const attempts=g.transactions.length;await n.pair.ensurePartnerRecord();assert.equal(g.transactions.length,attempts,"no retry within 30 seconds");
  g.failWrites(0);g.advance(31000);await n.pair.ensurePartnerRecord();assert.equal(g.docs.get(partnerPath("playerTwo"))?.active,true);
  const count=g.transactions.filter(t=>t.writes.includes(partnerPath("playerTwo"))).length;
  await n.pair.ensurePartnerRecord();assert.equal(g.transactions.filter(t=>t.writes.includes(partnerPath("playerTwo"))).length,count,"settled repair never rewrites the record");
});

for(const change of ["test-no-marker","hidden-test","pre-career-test","own-unpair","other-unpair","foreign-membership","wrong-role","closed","unreadable-marker"])test(`recovery guard: ${change}`,async()=>{
  const g=game(),id=await g.interrupted(),role="playerTwo",marker=`accounts/${UID[role]}/careerStart/current`,r=g.docs.get(`rivalries/${id}`);
  if(change==="test-no-marker")g.docs.delete(marker);
  if(change==="unreadable-marker")g.setMarkerUnavailable(true);
  if(change==="hidden-test")g.docs.get(marker).data.hiddenRivalryIds=[id];
  if(change==="pre-career-test")g.docs.get(marker).data.startedAt=ts(r.data.createdAt.toMillis()+36*60000);
  if(change==="own-unpair"||change==="other-unpair"){
    const owner=change==="own-unpair"?role:"playerOne",other=owner===role?"playerOne":role;
    g.docs.set(partnerPath(owner),{schemaVersion:1,partnerAccountId:UID[other],myRole:owner,pairedViaRivalryId:id,pairedAt:ts(1),active:false,updatedAt:ts(1)});
  }
  if(change==="foreign-membership")r.data.managerSlots[1].accountId="stranger";
  if(change==="wrong-role")g.docs.get(`accounts/${UID[role]}/pairLinks/current`).data.managerRole="playerOne";
  if(change==="closed")r.data.connectionState="closed";
  const p=g.page(role);await p.pair.initialize({force:true});const before=g.docs.get(partnerPath(role));
  await p.pair.ensurePartnerRecord();assert.equal(g.docs.get(partnerPath(role)),before,"no permanent partner created or reactivated");
});
