'use strict';
// r87 Fable job 3 (Rules / reads / connectivity hunt), the budget-layer findings in js/sparkPrivatePairing.js:
//   Q1 F3-07 the quota pause never runs past the Pacific reset (+1 min): a 40-minute step tripped at 11:52 pm Pacific ends at
//      12:01 am, and the next day's first trip starts again at the 10-minute step.
//   Q2 F3-13 a direct get (career pages, Settings history) is refused on the phone while the pause holds; it reaches the SDK again
//      once the pause is over.
//   Q3 F3-14 a season acknowledged before the Pacific reset is not noted again after it (no stale meter write with today's counts),
//      live and after a reload; a new season after the reset is noted as usual.
// The REAL budget layer runs in a VM with a fake clock. No emulator, no network.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(ROOT,'js/sparkPrivatePairing.js'),'utf8');
const BUDGET=source.slice(source.indexOf('// Firestore budget layer (r75).'));
const RID='pair_'+'a'.repeat(64);
let checks=0;
async function check(label,fn){await fn();checks+=1;console.log(`ok ${checks} ${label}`);}
// 2026-10-31 23:52 Pacific (PDT, UTC-7) = 2026-11-01 06:52 UTC.
const LATE=Date.UTC(2026,10,1,6,52);
const MIDNIGHT=Date.UTC(2026,10,1,7,0);
function page(clock,storage=new Map()){
  const RealDate=Date;
  class FakeDate extends RealDate{constructor(...a){super(...(a.length?a:[clock.now]));}static now(){return clock.now;}}
  const c=vm.createContext({console,Date:FakeDate,Intl,setTimeout:()=>0,clearTimeout:()=>{},readStorageValue:k=>storage.has(k)?storage.get(k):null,writeStorageValue:(k,v)=>{storage.set(k,v);return true;}});
  vm.runInContext(BUDGET,c);
  return {budget:c.CareerModeFirestoreBudget,storage};
}
const quota=()=>Object.assign(new Error('Quota exceeded.'),{code:'resource-exhausted'});

(async()=>{
  await check('Q1 F3-07 the quota pause ends at the Pacific reset (+1 min), never later; the new day starts at the first step',async()=>{
    const clock={now:LATE};const {budget}=page(clock);
    budget.noteError(quota());
    let s=budget.state();assert.equal(s.paused,true);assert.equal(s.step,0);assert.equal(s.until,MIDNIGHT+60000,'8 minutes before the reset: the 10-minute step is cut to 12:01 am');
    // Trip again right after each pause until the 40-minute step, near the reset.
    clock.now=Date.UTC(2026,10,1,6,0);const p2=page(clock).budget;p2.noteError(quota());clock.now=p2.state().until+1000;p2.noteError(quota());
    clock.now=p2.state().until+1000;p2.noteError(quota());s=p2.state();
    assert.equal(s.step,2,'third trip in a row: the 40-minute step');
    assert.ok(s.until<=MIDNIGHT+60000,`the pause ends by 12:01 am Pacific (until ${new Date(s.until).toISOString()})`);
    assert.equal(s.until,MIDNIGHT+60000);
    clock.now=s.until+1000;assert.equal(p2.state().paused,false,'over at 12:01 am');
    p2.noteError(quota());assert.equal(p2.state().step,0,'a trip on the new day starts again at 10 minutes');
  });

  await check('Q2 F3-13 a direct get is refused on the phone while paused, and reaches the SDK again after the pause',async()=>{
    const clock={now:Date.UTC(2026,10,1,18,0)};const {budget}=page(clock);
    let calls=0;const sdk=budget.meterSdk({doc:(_db,...parts)=>({path:parts.join('/')}),getDoc:async()=>{calls+=1;return {exists:()=>true,data:()=>({}),metadata:{fromCache:false}};}});
    await sdk.getDoc({path:`rivalries/${RID}/state/authoritative`});assert.equal(calls,1);
    budget.noteError(quota());
    await assert.rejects(sdk.getDoc({path:`rivalries/${RID}/state/authoritative`}),error=>error.code==='resource-exhausted'&&error.quotaPaused===true);
    assert.equal(calls,1,'nothing reached the SDK while paused');
    clock.now=budget.state().until+1000;
    await sdk.getDoc({path:`rivalries/${RID}/state/authoritative`});assert.equal(calls,2,'after the pause the get goes through');
  });

  await check('Q3 F3-14 a season acknowledged before the Pacific reset is not noted again after it (live and after a reload)',async()=>{
    const clock={now:LATE};const storage=new Map();const {budget}=page(clock,storage);
    assert.equal(budget.noteSeasonDone(`${RID}|4`,true,{role:'playerOne',season:4}),true,'noted before midnight');
    clock.now=MIDNIGHT+5*60000;
    assert.equal(budget.noteSeasonDone(`${RID}|4`,false,{role:'playerOne',season:4}),false,'the same season after the reset: not noted again');
    const reloaded=page(clock,storage).budget;
    assert.equal(reloaded.noteSeasonDone(`${RID}|4`,false,{role:'playerOne',season:4}),false,'nor after a reload past the reset');
    assert.equal(reloaded.noteSeasonDone(`${RID}|5`,true,{role:'playerOne',season:5}),true,'a new season is noted as usual');
  });

  console.log(`PASS r87 Fable job 3 meter fixes contracts: ${checks} checks`);
})().catch(error=>{console.error(error);process.exit(1);});
