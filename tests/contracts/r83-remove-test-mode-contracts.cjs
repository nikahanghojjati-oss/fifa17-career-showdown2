"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const fs=require("node:fs"),vm=require("node:vm"),{webcrypto}=require("node:crypto");
const {page}=require("../support/showdown-settings-fixture.cjs");
const {game,UID,partnerPath}=require("../support/real-pair-fixture.cjs");
const Marker=require("../../js/careerStartMarker.js");

for(const managerId of ["daniel","nik"])test(`${managerId}: Settings, seasons and game labels expose only real play`,async()=>{
  for(const marker of [null,{active:true},{active:false}]){
    const p=page({managerId,marker});p.modes.install();await p.modes.resolve();
    const settings=p.settings();
    assert.equal(settings.rows.mode,"Saved online for both of you");
    assert.equal(settings.buttons.some(text=>/TEST|FORGET/.test(text)),false);
    assert.equal(typeof p.modes.startTestRun,"undefined","no client test-start path remains");
    assert.equal(p.dom.doc.body.textContent.includes("TEST RUN"),false);
    assert.equal(p.dom.doc.getElementById("cmsRealCareerCheck"),null,"START needs no mode choice");
  }
});

test("a new two-account Showdown writes real career authority and both career indexes",async()=>{
  const g=game();g.prepare("playerOne");const d=g.page("playerOne");
  // The actual seasons START gate must persist the marker without a checkbox or test arming.
  d.root.CareerModeOnlinePlayerIdentity.getState=()=>({status:"ready",registered:true,accountId:UID.playerOne,managerId:"daniel"});
  vm.runInContext(fs.readFileSync(require.resolve("../../js/showdownModes.js"),"utf8"),d.root);
  assert.equal(await d.root.CareerModeShowdownModes.beforeSeasonsStart(),true);
  const waiting=await d.pair.startPairing({managerRole:"playerOne"});
  assert.match(waiting.capability,/^CMS17R-/);
  const n=g.page("playerTwo");
  assert.equal((await n.pair.joinPairing(waiting.capability,{managerRole:"playerTwo",autoContinue:false})).connectionState,"active");
  await d.pair.initialize({force:true});await d.pair.ensurePartnerRecord();await n.pair.ensurePartnerRecord();
  for(const role of ["playerOne","playerTwo"]){
    const uid=UID[role],marker=g.docs.get(`accounts/${uid}/careerStart/current`);
    assert.ok(marker);assert.deepEqual(Array.from(marker.data.hiddenRivalryIds),[]);
    assert.ok(g.docs.get(`accounts/${uid}/careerIndex/current`).data.rivalryIds.includes(waiting.rivalryId));
    assert.equal(g.docs.get(partnerPath(role)).active,true);
  }
  assert.equal(g.docs.get(`rivalries/${waiting.rivalryId}`).data.connectionState,"active");
  assert.ok(g.transactions.findIndex(t=>t.writes.includes(`accounts/${UID.playerOne}/careerStart/current`))<g.transactions.findIndex(t=>t.writes.includes(`rivalries/${waiting.rivalryId}`)));
});

test("markerless direct creation and old unpaired plain-code JOIN cannot create a test game",async()=>{
  const g=game();g.prepare("playerOne");const d=g.page("playerOne"),before=g.docs.size;
  assert.notEqual((await d.pair.startPairing({managerRole:"playerOne"})).connectionState,"pending-pair");
  assert.equal(g.docs.size,before);
  const n=g.page("playerTwo"),count=g.docs.size;
  const result=await n.pair.joinPairing("CMS17-pair_1"+"a".repeat(63),{managerRole:"playerTwo",autoContinue:false});
  assert.notEqual(result.connectionState,"active");assert.equal(g.docs.size,count);
});

test("old stored test games and all pre-r79 games stay hidden; r79 real games still reach career history",async()=>{
  const id=n=>"pair_1"+String(n).repeat(63),pre=id(1),oldTest=id(2),liverpool=id(3),frankfurt=id(4);
  const cutoff=Date.UTC(2026,9,18,17,17,45),hidden=[pre,oldTest,liverpool,frankfurt],log=[];
  // Existing markers retain immutable hidden IDs. The r79 recovery window reveals real closed games only.
  const roots=Object.fromEntries([[pre,cutoff-1],[oldTest,cutoff+1],[liverpool,cutoff+2],[frankfurt,cutoff+3]].map(([rid,time])=>[rid,{objectType:"rivalry",objectId:rid,updatedAt:{toMillis:()=>time},data:{connectionState:"closed",terminalClose:{},...(rid===oldTest?{mode:"test"}:{})}}]));
  const marker={status:"ready",startedAt:cutoff+1000,contentHash:"job16",hiddenRivalryIds:hidden,active:false};
  const excluded=await Marker.careerHiddenRivalryIds({marker,firestore:{},accountId:"account",firebaseSdk:{doc:(_db,_collection,rid)=>rid,getDoc:async rid=>{log.push(rid);return {exists:()=>true,data:()=>roots[rid]};}}});
  assert.deepEqual(excluded,[pre,oldTest]);assert.deepEqual(marker.hiddenRivalryIds,hidden,"old data is never rewritten");
  // Use the real loader/adapter/model for the two visible results; every career screen consumes this model.
  const F=require("../support/active-showdown-fixtures.cjs"),C=require("../support/career-fixture-helpers.cjs");
  const reads={};
  for(const [rid,seed] of [[liverpool,"3"],[frankfurt,"4"]]){const p=F.projection({seed,totalSeasons:1,seasons:[[F.result(),F.result({leaguePosition:1})]]});const projection={...p,rivalryId:rid};reads[rid]={status:"completed",rivalryId:rid,projection,terminalWitness:F.closed(projection).terminalWitness,final:C.finalFor(projection)};}
  const c=vm.createContext({CareerModePersistentNikDanielPair:{readCareerIndex:async()=>({status:"ready",rivalryIds:hidden})},CareerModeSparkCompletedShowdownReader:{readCompletedShowdown:async o=>{assert.ok(!excluded.includes(o.rivalryId));return reads[o.rivalryId];}},CareerModeSharedClosedShowdownAdapter:require("../../js/sharedClosedShowdownAdapter.js"),CareerModeSharedCareerAnalytics:require("../../js/sharedCareerAnalytics.js")});
  vm.runInContext(fs.readFileSync(require.resolve("../../js/sparkClosedShowdownCareerLoader.js"),"utf8"),c);
  const loaded=await c.CareerModeSparkClosedShowdownCareerLoader.loadClosedShowdownCareer({user:{uid:"account"},firestore:{},firebaseSdk:{doc(){},async getDoc(){}},hiddenRivalryIds:excluded});
  assert.deepEqual(Array.from(loaded.model.history.showdowns,row=>row.rivalryId).sort(),[liverpool,frankfurt].sort());
});

// Exercise the stored field through the real integrity-checking reader, not only the marker recovery scan.
test("stored test mode is excluded even outside the marker list; the r79 fixture still counts without it",async()=>{
  function decode(v){
    if("mapValue" in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,decode(x)]));
    if("arrayValue" in v)return (v.arrayValue.values||[]).map(decode);
    if("timestampValue" in v)return {toMillis:()=>Date.parse(v.timestampValue)};
    if("integerValue" in v)return Number(v.integerValue);
    if("nullValue" in v)return null;
    return Object.values(v)[0];
  }
  function canonical(v){if(v&&typeof v.toMillis==="function")return {$timestamp:v.toMillis()};if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==="object")return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
  const fixture=JSON.parse(fs.readFileSync(require.resolve("../fixtures/saved-showdowns/r79-1season-win.json"),"utf8")),rid=fixture.rivalryId;
  const docs=Object.fromEntries(fixture.documents.map(d=>[d.path,decode({mapValue:{fields:d.fields}})])),root=docs[`rivalries/${rid}`],uid=root.data.managerSlots[0].accountId;
  const sdk={doc:(_db,...parts)=>parts.join("/"),getDoc:async ref=>({exists:()=>Boolean(docs[ref]),data:()=>docs[ref]})};
  const options={user:{uid},firestore:{},firebaseSdk:sdk,rivalryId:rid,cryptoImpl:webcrypto};
  const Reader=require("../../js/sparkCompletedShowdownReader.js"),Adapter=require("../../js/sharedClosedShowdownAdapter.js"),Career=require("../../js/sharedCareerAnalytics.js");
  const real=await Reader.readCompletedShowdown(options);assert.equal(real.status,"completed",real.code);
  root.data.mode="test";
  root.contentHash="sha256:"+require("node:crypto").createHash("sha256").update(JSON.stringify(canonical({objectType:"rivalry",objectId:rid,revision:root.revision,data:root.data}))).digest("hex");
  const old=await Reader.readCompletedShowdown(options);assert.equal(old.status,"hidden");
  const model=Career.buildCareerModel(Adapter.buildClosedCareerInput({index:{status:"ready",rivalryIds:[rid]},reads:{[rid]:old}}));
  assert.equal(model.status,"empty");assert.deepEqual(model.history.showdowns,[]);
  // Old test codes closed before Nik joined must not surface as Ended early either.
  delete root.data.terminalClose;delete root.data.terminalProgress;
  root.data.authorizedAccountIds=[uid];
  root.data.managerSlots=root.data.managerSlots.map((slot,i)=>i===0?slot:{...slot,accountId:null,profileId:null,saveId:null,entitlementState:"open"});
  root.contentHash="sha256:"+require("node:crypto").createHash("sha256").update(JSON.stringify(canonical({objectType:"rivalry",objectId:rid,revision:root.revision,data:root.data}))).digest("hex");
  assert.equal((await Reader.readCompletedShowdown(options)).status,"hidden");
});
