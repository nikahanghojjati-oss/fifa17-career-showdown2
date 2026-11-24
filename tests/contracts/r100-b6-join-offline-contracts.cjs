"use strict";
// r100 B6 (Phoenix Ironman, fault network at point home-join): Nik taps JOIN on Home and the network drops at once. Before,
// the tap's pair check went unanswered and Connect Players' paste-a-code box opened over Home with an empty code field, so the
// JOIN never landed (Gate run 45328820940). Now the cut tap keeps Home and is made once more by itself when the network is
// back, for the same Showdown only, through the same START flow and the join's own guards.
// Real modules (sparkPrivatePairing, persistentNikDanielPair, whichShowdownIsLive, onlinePlayerIdentity) on the Home JOIN
// fixture; only Firestore, storage, clock and the network are fakes.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {world,MINUTE,INBOX,settle}=require("../support/home-join-window-fixture.cjs");
const OFFLINE=()=>Object.assign(new Error("Failed to get document because the client is offline."),{code:"unavailable",name:"FirebaseError"});
// The network of Nik's phone: every Firestore call fails "unavailable" while it is down; the browser's offline/online events fire.
function cutNetwork(w,nik){
  const real=w.sdk.runTransaction;w.offline=false;
  w.sdk.runTransaction=async(...args)=>{if(w.offline)throw OFFLINE();return real(...args);};
  return {
    async down(){w.offline=true;nik.s.navigator.onLine=false;nik.s.dispatchEvent(new nik.s.CustomEvent("offline"));await settle();},
    async up(){w.offline=false;nik.s.navigator.onLine=true;nik.s.dispatchEvent(new nik.s.CustomEvent("online"));await settle();}
  };
}
// The join's writes to the Showdown itself (rivalry + invite): a clean join writes each exactly once.
const rivalryWrites=(w,rid)=>w.writes.slice(w.joinFrom).filter(path=>path===`rivalries/${rid}`||path===`rivalries/${rid}/invites/${rid}`).length;
async function nikOnJoin(){
  const w=world(),rid=await w.start(),nik=w.page("nik");await nik.init();
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");assert.equal(nik.pair.getJoinNoteState().note?.rivalryId,rid);
  w.joinFrom=w.writes.length;return {w,rid,nik,net:cutNetwork(w,nik)};
}
// The resend's START runs real hashing and many awaits: let it finish (bounded) before checking.
async function quiet(nik){for(let i=0;i<200&&(nik.pair.getState().busy||nik.identity.getState().busy);i++)await settle();await settle();}
// The tile's own click (openHomeStart), as a player's tap; waits for that one START flow.
async function tapTile(nik){await nik.tap();}
// The Ironman network fault: the tap first, then the network drops at once (the flow is in flight).
async function tapAsNetworkDrops(nik,net){const flow=nik.tap();await net.down();await flow;}

test("B6-1: a JOIN tap whose pair check the network cut keeps Home (no paste box) and lands once when the network is back",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  assert.equal(nik.fallbacks,0,"the paste-a-code box must not open over Home for a JOIN the network cut");
  assert.equal(nik.redeems,0);assert.notEqual(nik.pair.getState().connectionState,"active");
  await w.advance(30*1000);assert.equal(nik.redeems,0,"nothing is sent while the phone is offline");
  await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.pair.getState().connectionState,"active","the JOIN lands by itself once the network is back");
  assert.equal(nik.pair.getState().rivalryId,rid,"it joins the Showdown Nik tapped");
  assert.equal(nik.redeems,1,"exactly one join");assert.equal(nik.entered,1,"Nik goes on into the Showdown once");
  assert.equal(rivalryWrites(w,rid),2,"the Showdown and its invite were written once each");
  assert.equal(nik.fallbacks,0);
  await w.advance(5*MINUTE);assert.equal(nik.redeems,1,"no second resend");assert.equal(nik.entered,1);
});

test("B6-2: a JOIN whose join transaction the network cut keeps Home and lands once when the network is back",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  const pairing=nik.s.CareerModeSparkPrivatePairing,redeem=pairing.redeemPairing;let cut=true;
  pairing.redeemPairing=async options=>{if(cut){cut=false;await net.down();}return redeem(options);};
  await tapTile(nik);
  assert.equal(nik.redeems,1,"the first join was tapped");assert.notEqual(nik.pair.getState().connectionState,"active");
  assert.equal(nik.fallbacks,0,"no paste box after a join the network cut");
  await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);
  assert.equal(nik.redeems,2,"the one resend");assert.equal(nik.entered,1);
  assert.equal(rivalryWrites(w,rid),2,"the Showdown and its invite were written once each (no doubled join)");
});

test("B6-3: one resend per tap; if it is cut too, Home still offers JOIN and a tap joins",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  // The network comes back only for a moment: the resend is cut again.
  nik.s.navigator.onLine=true;nik.s.dispatchEvent(new nik.s.CustomEvent("online"));await w.advance(10*1000);await quiet(nik);
  assert.notEqual(nik.pair.getState().connectionState,"active");assert.equal(nik.fallbacks,0);
  w.offline=false;nik.s.dispatchEvent(new nik.s.CustomEvent("online"));await w.advance(10*MINUTE);await quiet(nik);
  assert.equal(nik.redeems,0,"no further automatic attempt after the one resend");
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN","Home still offers JOIN");
  await tapTile(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);
  assert.equal(nik.redeems,1);assert.equal(nik.entered,1);
});

test("B6-4: the resend never joins another Showdown than the one Nik tapped",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  // While Nik is offline, Daniel's JOIN note comes to name a different Showdown.
  const other=`pair_3${"b".repeat(63)}`,note=w.docs.get(INBOX);
  w.docs.set(INBOX,{...note,rivalryId:other});
  await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.pair.getJoinNoteState().note?.rivalryId,other,"the fresh read sees the other Showdown");
  assert.equal(nik.redeems,0,"no join is sent for a Showdown Nik did not tap");
  assert.notEqual(nik.pair.getState().rivalryId,rid);assert.notEqual(nik.pair.getState().connectionState,"active");
  assert.equal(nik.fallbacks,0);
});

test("B6-5: the resend is dropped when Nik left Home; his tap on Home joins as before",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);await nik.screen("history");
  await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.redeems,0,"nothing is sent for him away from Home");
  await nik.screen("mainMenu");await tapTile(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);assert.equal(nik.redeems,1);
});

test("B6-6: a tap of his own as the network returns and the resend make one join together",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  await net.up();await tapTile(nik);await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);
  assert.equal(nik.redeems,1,"one join");assert.equal(nik.entered,1);assert.equal(rivalryWrites(w,rid),2);
});

test("B6-7: online, a refused JOIN still opens Connect Players as before (no resend)",async()=>{
  const {w,nik}=await nikOnJoin();
  const pairing=nik.s.CareerModeSparkPrivatePairing;let calls=0;
  pairing.redeemPairing=async()=>{calls++;return {ok:false,code:"PAIRING_CAPABILITY_NOT_FOUND",message:"This code was not found."};};
  await tapTile(nik);
  assert.equal(calls,1);assert.equal(nik.fallbacks,1,"an answered refusal keeps today's Connect Players fallback");
  await w.advance(10*MINUTE);assert.equal(calls,1,"no automatic resend for a join the provider answered");
});

test("B6-8: a refusal the provider answered while the network blinked still opens Connect Players with its reason (no resend)",async()=>{
  const {w,nik,net}=await nikOnJoin();
  const pairing=nik.s.CareerModeSparkPrivatePairing;let calls=0;
  // The network drops and comes back between the tap and the provider's answer, which is a real refusal.
  pairing.redeemPairing=async()=>{calls++;await net.down();await net.up();return {ok:false,code:"PAIRING_CAPABILITY_EXPIRED",message:"This code has expired."};};
  await tapTile(nik);
  assert.equal(calls,1);assert.equal(nik.fallbacks,1,"the refusal keeps the Connect Players fallback, so Nik sees why");
  assert.equal(nik.pair.getState().status,"error");assert.equal(nik.pair.getState().joinRefused,undefined,"the refusal flag never sticks on the page state");
  await w.advance(10*MINUTE);assert.equal(calls,1,"no automatic resend after a refusal");
});

test("B6-9: leaving Home forgets the resend, even if Nik is back on Home before the network returns",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);await nik.screen("history");await nik.screen("mainMenu");
  await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.redeems,0,"no automatic join after Home was left");assert.equal(nik.fallbacks,0);
  await tapTile(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);assert.equal(nik.redeems,1);
});

test("B6-10: the resend expires 10 minutes after the tap; later Home still offers JOIN and a tap joins",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  await w.advance(10*MINUTE+1000);await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.redeems,0,"no join made by itself more than 10 minutes after the tap");assert.equal(nik.fallbacks,0);
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");
  await tapTile(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);assert.equal(nik.redeems,1);
});

// ---- Daniel's side (Ironman fault reload at point home-join, Gate run 45387682623): Daniel's phone reloads right as Nik taps
// JOIN. The reload read Daniel's pair link while it was still "pending" and his code just after Nik's join closed it, so the
// code counted as expired and the waiting poll stopped for good: Daniel sat on WAITING over the league wheel while Nik waited
// for him. Now a code whose end is known gets one last look (the same two reads) before the poll stops.
// Daniel reloads (a fresh page of the same phone); Nik's join lands between his pair-link read and his code read.
async function danielReloadsAsNikJoins({join=true}={}){
  const w=world(),rid=await w.start(),nik=w.page("nik");await nik.init();
  assert.equal(nik.label(),"JOIN DANIEL'S SHOWDOWN");w.joinFrom=w.writes.length;
  const invite=`rivalries/${rid}/invites/${rid}`,real=w.sdk.runTransaction;let armed=false;
  w.sdk.runTransaction=(db,fn)=>real(db,tx=>fn({...tx,get:async ref=>{if(armed&&ref.path===invite){armed=false;
    if(join){await nik.tap();assert.equal(nik.pair.getState().connectionState,"active","Nik's JOIN landed");}
    else{const doc=w.docs.get(invite);w.docs.set(invite,{...doc,data:{...doc.data,state:"revoked"}});}}return tx.get(ref);}}));
  const daniel=w.page("daniel");armed=true;await daniel.init();
  // The reload's own pair check runs after init returns: wait (bounded) until it settled, never a fixed settle.
  await until(w,()=>{const s=daniel.pair.getState();return s.initialized===true&&s.busy!==true&&Boolean(s.connectionState);},"Daniel's reload settled its pair check");
  assert.equal(armed,false,"Nik's join (or the closed code) came between Daniel's pair-link read and his code read");
  return {w,rid,nik,daniel};
}
// Bounded wait: the page's hashing (webcrypto) resolves on real time, so each step yields 10 ms of real time and moves the fake
// clock 100 ms; at most 300 steps (3 s real, 30 s on the page's clock).
const realPause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(w,ok,label){for(let i=0;i<300&&!ok();i++){await realPause(10);await w.advance(100);await settle();}assert.ok(ok(),`${label} (within 30 s)`);}

test("B6-11: Daniel's phone reloads as Nik's JOIN lands: Daniel still goes on into that Showdown by himself, once",async()=>{
  const {w,rid,nik,daniel}=await danielReloadsAsNikJoins();
  await until(w,()=>daniel.pair.getState().connectionState==="active"&&daniel.entered===1,"Daniel learns that Nik joined and goes on (no stuck WAITING)");await quiet(daniel);
  assert.equal(daniel.pair.getState().rivalryId,rid,"the same Showdown");
  assert.equal(daniel.entered,1,"Daniel goes on into the Showdown once");
  assert.equal(nik.redeems,1,"one join");assert.equal(rivalryWrites(w,rid),2,"the Showdown and its invite were written once each");
  const reads=w.reads.length;await w.advance(10*MINUTE);
  assert.equal(daniel.entered,1);assert.equal(w.reads.filter((p,i)=>i>=reads&&p.startsWith("accounts/daniel/pairLinks")).length,0,"no waiting poll is left running");
});

test("B6-12: a code seen closed without a join gets one last look (two reads), then the wait stops as before",async()=>{
  const {w,rid,daniel}=await danielReloadsAsNikJoins({join:false});
  const before=w.reads.length;await w.advance(10*1000);await quiet(daniel);await until(w,()=>!daniel.pair.getState().busy,"the last look settled");
  assert.equal(daniel.pair.getState().connectionState,"pending-pair","nobody joined");assert.equal(daniel.pair.getState().rivalryId,rid);
  assert.deepEqual(w.reads.slice(before).sort(),["accounts/daniel/pairLinks/current",`rivalries/${rid}`].sort(),"one last look: the pair link and the rivalry only");
  const after=w.reads.length;await w.advance(30*MINUTE);
  assert.equal(w.reads.length,after,"then no more reads");assert.equal(daniel.entered,0);
});

test("B6-13: leaving Home while the tap's own check is still in flight also forgets it (Codex #1598): no join made by itself later",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  // Hold the tap's first Firestore call until Nik has left Home and the network is gone; it then fails "unavailable".
  const inner=w.sdk.runTransaction;let release=null,held=false;const gate=new Promise(resolve=>{release=resolve;});
  w.sdk.runTransaction=async(...args)=>{if(!held){held=true;await gate;}return inner(...args);};
  const flow=nik.tap();
  for(let i=0;i<200&&!held;i++)await Promise.resolve();
  assert.equal(held,true,"the tap's check is in flight");
  await nik.screen("history");await net.down();release();await flow;await quiet(nik);
  await nik.screen("mainMenu");
  await net.up();await w.advance(10*1000);await quiet(nik);await w.advance(5*MINUTE);await quiet(nik);
  assert.equal(nik.redeems,0,"the tap was forgotten when Nik left Home: nothing joins by itself");assert.notEqual(nik.pair.getState().connectionState,"active");
  assert.equal(nik.fallbacks,0,"and no paste-a-code box opens over the screen he went to");
  await tapTile(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);assert.equal(nik.redeems,1,"his own tap on Home joins as before");
});

test("B6-14: a hidden Home tab keeps the resend (Codex #1591): it is made once Home is shown again, still once",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  await nik.visibility(false);await net.up();await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.redeems,0,"nothing is sent while the tab is hidden");
  await nik.visibility(true);await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.pair.getState().connectionState,"active","shown again on Home: the cut JOIN lands by itself");assert.equal(nik.pair.getState().rivalryId,rid);
  assert.equal(nik.redeems,1,"exactly one join");assert.equal(nik.entered,1);assert.equal(nik.fallbacks,0);
  await w.advance(5*MINUTE);assert.equal(nik.redeems,1);
});

test("B6-15: leaving Home while the resend's own checks are in flight cancels it (Codex #1598): no join over the screen he chose",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  await tapAsNetworkDrops(nik,net);
  // Hold the resend's own Showdown check (which.read), leave Home, then release it (online): the resend must not go on.
  const which=nik.s.CareerModeWhichShowdownIsLive,realRead=which.read;let release=null,held=false;const gate=new Promise(resolve=>{release=resolve;});
  nik.s.CareerModeWhichShowdownIsLive={...which,read:async(...args)=>{if(!held){held=true;await gate;}return realRead.apply(which,args);}};
  await net.up();
  for(let i=0;i<300&&!held;i++){await w.advance(500);await settle();}
  assert.equal(held,true,"the resend's check is in flight");
  await nik.screen("history");release();await quiet(nik);await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.redeems,0,"no join after Nik left Home");assert.equal(nik.entered,0,"never taken into the Showdown over History");assert.equal(nik.fallbacks,0);
  await nik.screen("mainMenu");await tapTile(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);assert.equal(nik.redeems,1,"his own tap on Home joins as before");
});

test("B6-16: a cut JOIN that did land (only its answer was lost) goes on into that Showdown once the network is back (Codex #1598)",async()=>{
  const {w,rid,nik,net}=await nikOnJoin();
  // The join's transaction commits, then the network drops before the phone hears back.
  const inner=w.sdk.runTransaction;let lost=false;
  w.sdk.runTransaction=async(...args)=>{const before=rivalryWrites(w,rid);const out=await inner(...args);if(!lost&&rivalryWrites(w,rid)>before){lost=true;await net.down();throw OFFLINE();}return out;};
  await tapTile(nik);
  assert.equal(lost,true,"the join was written and its answer lost");assert.equal(nik.entered,0);assert.equal(nik.fallbacks,0,"no paste box for a cut answer");
  await net.up();await w.advance(10*1000);await quiet(nik);await w.advance(10*1000);await quiet(nik);
  assert.equal(nik.pair.getState().connectionState,"active");assert.equal(nik.pair.getState().rivalryId,rid);
  assert.equal(nik.entered,1,"Nik goes on into the Showdown he tapped, once, without another tap");
  assert.equal(rivalryWrites(w,rid),2,"never joined twice");
  await w.advance(5*MINUTE);assert.equal(nik.entered,1);
});
