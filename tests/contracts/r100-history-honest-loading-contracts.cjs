"use strict";
// Phoenix 3.0 pre-freeze hunt H1 (B3, 2026-11-27). Nik: History, Standings and the career screens never look stuck, broken or
// stale; they show the current truth or an honest loading state.
//   HL1 (H1 F1) right after a reload or sign-in, History's own box said "Career history is unavailable right now..." in full view
//       until Team V's History drew (js/legacy.js painted the seam with no model, and no model reads as unavailable). It now
//       says loading while the hand-over to js/rivalryLegacyV10.js is on its way, and unavailable only when that hand-over
//       cannot load (so it never stays on loading for good).
//   HL2 js/statistics.js openRivalryLegacyV10 answers whether the screen was handed over (true / false), never undefined.
//   HL3 (H1 F2) the first History open after a Showdown ends showed the frame drawn before the close ("No finished Showdowns
//       yet") until the read landed: the same account and manager keep their frame across a key change. A frame older than the
//       close (the pair now names a closed Showdown the frame does not list as finished) is dropped to loading instead; the
//       read that key change starts anyway is the only read. A frame that already lists it is kept (nothing flashes).
//   HL4 (Verify follow-up) a hand-over that never settles (a Team V History file fetch hanging on a half-up link) says
//       unavailable after History's own 15 s deadline instead of loading for good; a late success still paints History.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const ROOT=path.resolve(__dirname,"..","..");
const read=rel=>fs.readFileSync(path.join(ROOT,rel),"utf8");
const LEGACY=read("js/legacy.js"),STATS=read("js/statistics.js"),RL=read("js/rivalryLegacyV10.js");
const Seam=require(path.join(ROOT,"js/careerScreenSeam.js"));
let passed=0;const ok=(id,label)=>{passed++;console.log(`ok   ${id} ${label}`);};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function settle(){for(let i=0;i<6;i++)await tick();}

// A tiny document: the History host with its original .legacyBox, enough for the seam's painter.
function fakeDoc(){
  const el=(tag,cls="")=>{const node={tagName:tag,className:cls,children:[],attrs:{},textContent:"",
    setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},
    appendChild(c){this.children.push(c);return c;},append(...c){this.children.push(...c);},replaceChildren(...c){this.children=c;}};return node;};
  const box=el("div","legacyBox");
  const text=node=>[node.textContent||"",...(node.children||[]).map(text)].join(" ").replace(/\s+/g," ").trim();
  const status=node=>node?.attrs?.["data-career-status"]??(node.children||[]).map(status).find(Boolean)??null;
  return {box,text:()=>text(box),status:()=>status(box),doc:{createElement:tag=>el(tag),createDocumentFragment:()=>el("#fragment"),querySelector:sel=>sel==="#legacy .legacyBox"?box:null}};
}
function legacyPage({handOver,withOpener=true,withLoader=true,clock=null}){
  const page=fakeDoc(),errors=[];
  const sandbox={document:page.doc,console,Promise,Object,...(clock?{setTimeout:clock.setTimeout,clearTimeout:clock.clearTimeout}:{}),
    CareerModeCareerScreenSeam:Seam,CareerModeOnlinePlayerIdentity:{getState:()=>({registered:true,managerId:"nik"})},
    reportApplicationError:(c,e)=>errors.push(`${c}: ${e&&e.message}`)};
  if(withOpener)sandbox.openRivalryLegacyV10=()=>handOver();
  if(withLoader)sandbox.loadRuntimeScript=()=>handOver();
  sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(LEGACY,sandbox,{filename:"js/legacy.js"});
  return {...page,errors,render:arg=>sandbox.renderLegacy(arg)};
}
// A fake clock: timers fire only when the test moves time on.
function fakeClock(){
  let now=0,next=1;const timers=new Map();
  return {timers,setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{at:now+ms,fn});return id;},clearTimeout:id=>{timers.delete(id);},
    advance(ms){now+=ms;for(const [id,t] of [...timers].sort((a,b)=>a[1].at-b[1].at)){if(t.at<=now&&timers.has(id)){timers.delete(id);t.fn();}}}};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

(async()=>{
  // HL1 -----------------------------------------------------------------------------------------------------------------
  {
    // While Team V's History is on its way: loading, never "unavailable".
    const d=deferred(),p=legacyPage({handOver:()=>d.promise});p.render();
    assert.equal(p.status(),"loading");assert.match(p.text(),/^Loading career history\.$/);assert.doesNotMatch(p.text(),/unavailable/i);
    d.resolve(true);await settle();assert.equal(p.status(),"loading","once handed over, Team V's History replaces this box itself");
    // The hand-over could not load (false or a rejection): unavailable, so it never stays on loading for good.
    const f=deferred(),q=legacyPage({handOver:()=>f.promise});q.render();assert.equal(q.status(),"loading");
    f.resolve(false);await settle();assert.equal(q.status(),"unavailable");assert.equal(q.text(),Seam.TEXT.unavailable);
    const r=deferred(),x=legacyPage({handOver:()=>r.promise});x.render();r.reject(new Error("offline"));await settle();
    assert.equal(x.status(),"unavailable","a rejected hand-over says unavailable");
    // No way to hand over at all: unavailable at once.
    const none=legacyPage({handOver:()=>undefined});none.render();assert.equal(none.status(),"unavailable");
    const bare=legacyPage({handOver:null,withOpener:false,withLoader:false});bare.render();assert.equal(bare.status(),"unavailable");
    // A retry (opening History again) starts from loading again.
    const g=deferred();let calls=0;const y=legacyPage({handOver:()=>{calls++;return calls===1?Promise.resolve(false):g.promise;}});
    y.render();await settle();assert.equal(y.status(),"unavailable");y.render();assert.equal(y.status(),"loading","opening History again tries again");
    // The seam's own rule is unchanged: no model is still "unavailable" for every other caller.
    assert.equal(Seam.selectCareerScreenSource({identityState:null,model:null}),"unavailable");
    ok("HL1","History's box says loading while Team V's History is on its way; unavailable only when it cannot load");
  }
  // HL2 -----------------------------------------------------------------------------------------------------------------
  {
    const start=STATS.indexOf("function openRivalryLegacyV10(");const end=STATS.indexOf("\n}\n",start)+3;assert.ok(start>0&&end>start);
    const run=async(load,mount)=>{const errors=[],settled=[];const sandbox={Promise,console,CareerModeV10Screens:{expect(){},settle:h=>settled.push(h)},
      loadRuntimeScript:load,CareerModeRivalryLegacyV10:{mount},reportApplicationError:c=>errors.push(c)};
      sandbox.window=sandbox;vm.createContext(sandbox);vm.runInContext(`${STATS.slice(start,end)}\nglobalThis.open=openRivalryLegacyV10;`,sandbox);
      return {result:await sandbox.open("legacy",()=>null),errors,settled};};
    assert.equal((await run(async()=>true,async()=>false)).result,true,"mounted (even when the screen was left meanwhile)");
    const bad=await run(async()=>{throw new Error("script");},async()=>true);assert.equal(bad.result,false);assert.deepEqual(bad.settled,["legacy"]);assert.equal(bad.errors.length,1);
    assert.equal((await run(async()=>true,async()=>{throw new Error("mount");})).result,false);
    assert.equal((await run(undefined,async()=>true)).result,false,"no loader: false at once, never undefined");
    ok("HL2","openRivalryLegacyV10 answers true once mounted and false when it cannot load");
  }
  // HL3 -----------------------------------------------------------------------------------------------------------------
  {
    const start=RL.indexOf("  const rlClosedOf=");const end=RL.indexOf("\n  function refresh(",start);assert.ok(start>0&&end>start);
    const sandbox={JSON};vm.createContext(sandbox);
    vm.runInContext(`const LOADING={status:"loading"},UNAVAILABLE={status:"unavailable"};\n${RL.slice(start,end)}\nglobalThis.older=rlOlderThanClose;globalThis.LOADING=LOADING;globalThis.UNAVAILABLE=UNAVAILABLE;`,sandbox);
    const R="pair_"+"a".repeat(64),OLD="pair_"+"b".repeat(64);
    const key=(rivalryId,closed)=>JSON.stringify(["acct","nik",rivalryId,closed,0]);
    const empty={status:"empty"},withRow=status=>({status:"ready",history:{showdowns:[{rivalryId:OLD,status:"completed"},{rivalryId:R,status}]}});
    assert.equal(sandbox.older(empty,key(R,null),key(null,R)),true,"the 'No finished Showdowns yet' frame from before the close");
    assert.equal(sandbox.older(empty,key(null,null),key(null,R)),true,"a frame from before that Showdown started");
    assert.equal(sandbox.older(withRow("in-progress"),key(R,null),key(null,R)),true,"a frame showing it still in progress");
    assert.equal(sandbox.older({status:"ready",history:{showdowns:[{rivalryId:OLD,status:"completed"}]}},key(null,OLD),key(null,R)),true,"a frame of the previous closed Showdown only");
    assert.equal(sandbox.older(withRow("completed"),key(R,null),key(null,R)),false,"a frame that lists it finished is kept");
    assert.equal(sandbox.older(withRow("abandoned"),key(R,null),key(null,R)),false,"an ended-early row is its final row");
    assert.equal(sandbox.older(empty,key(null,R),key("pair_"+"c".repeat(64),R)),false,"the same closed Showdown on both keys: no close since");
    assert.equal(sandbox.older(empty,key(R,null),key(R,null).replace("0]","1]")),false,"no closed Showdown: unchanged rule");
    assert.equal(sandbox.older(sandbox.LOADING,key(R,null),key(null,R)),false);assert.equal(sandbox.older(sandbox.UNAVAILABLE,key(R,null),key(null,R)),false);
    assert.equal(sandbox.older(null,key(R,null),key(null,R)),false);
    // Wired into refresh: same account and manager keep their frame unless it is older than the close; then LOADING, so the
    // first entry is covered (Reus) while the read the key change starts anyway lands. No new read call.
    assert.match(RL,/const olderThanClose=sameOwner&&screen==="legacy"&&rlOlderThanClose\(sources\[screen\],sourceKeys\[screen\],key\);\n\s*sourceKeys\[screen\]=key;\n\s*if\(!sameOwner\|\|olderThanClose\)\{\n\s*sources\[screen\]=LOADING;/);
    assert.doesNotMatch(RL.slice(start,end),/rlLoadCareerModel|loadClosedShowdownCareer|getDoc|getDocs|runTransaction/,"the check reads nothing");
    // The pair names its closed Showdown in the key (slot 3), which is what the check reads.
    assert.match(RL,/return JSON\.stringify\(\[state\("CareerModeSparkConnectedAccount"\)\?\.accountId\?\?null,identity\(\)\?\.managerId\?\?null,pair\?\.rivalryId\?\?null,pair\?\.closedRivalryId\?\?null,markerEpoch\(\)\]\);/);
    ok("HL3","a History frame older than the close is never shown again; loading until the fresh read lands, nothing extra read");
  }
  // HL4 -----------------------------------------------------------------------------------------------------------------
  {
    // A hand-over that never settles (a Team V History file fetch hanging on a half-up link): loading until History's own
    // deadline, then unavailable, so it never stays on loading for good. A late success still paints History.
    const clock=fakeClock(),hang=deferred(),p=legacyPage({handOver:()=>hang.promise,clock});p.render();
    assert.equal(p.status(),"loading");assert.equal(clock.timers.size,1,"one deadline per open");
    clock.advance(14999);await settle();assert.equal(p.status(),"loading","still inside the deadline");
    clock.advance(1);await settle();assert.equal(p.status(),"unavailable","past the deadline it says unavailable");
    assert.equal(p.text(),Seam.TEXT.unavailable);
    hang.resolve(true);await settle();assert.equal(p.status(),"unavailable","a late success leaves the box to Team V's History, which draws over it");
    assert.equal(p.errors.length,0);
    // Settled in time: the deadline is cleared, nothing fires later.
    const c2=fakeClock(),quick=deferred(),q=legacyPage({handOver:()=>quick.promise,clock:c2});q.render();
    quick.resolve(true);await settle();assert.equal(c2.timers.size,0,"settled hand-over clears its deadline");
    c2.advance(60000);await settle();assert.equal(q.status(),"loading","no late unavailable over a mounted History");
    // Only the latest open counts: an older open's deadline and its late failure never paint over a newer open.
    const c3=fakeClock();const opens=[deferred(),deferred()];let n=0;const r=legacyPage({handOver:()=>opens[n++].promise,clock:c3});
    r.render();c3.advance(10000);r.render();assert.equal(c3.timers.size,1,"reopening replaces the deadline");
    c3.advance(6000);await settle();assert.equal(r.status(),"loading","the first open's deadline was dropped");
    opens[0].resolve(false);await settle();assert.equal(r.status(),"loading","an older open's late failure is ignored");
    c3.advance(9000);await settle();assert.equal(r.status(),"unavailable","the newer open's own deadline still ends it");
    // The deadline is History's own (js/rivalryLegacyV10.js LOAD_TIMEOUT).
    const deadline=Number(LEGACY.match(/const LEGACY_HAND_OVER_DEADLINE_MS = (\d+);/)?.[1]);
    assert.equal(deadline,Number(RL.match(/const LOAD_TIMEOUT=(\d+),/)?.[1]));assert.equal(deadline,15000);
    ok("HL4","a hand-over that never settles says unavailable after History's 15 s deadline; a late success still paints");
  }
  console.log(`PASS r100 History honest loading contracts (${passed})`);
})().catch(error=>{console.error(error);process.exit(1);});
