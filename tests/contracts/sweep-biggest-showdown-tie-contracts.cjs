"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const {test}=require("node:test");
const History=require("../../js/sharedHistoryConvergence.js");
const {result,projection,finalFor}=require("../support/career-fixture-helpers.cjs");
const clone=value=>JSON.parse(JSON.stringify(value));
const entry=p=>({rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)});
const label="Biggest Showdown win";
const record=m=>m.trophyRoom.records.find(row=>row.label===label);
const summary=(Seam,m)=>Seam.careerScreenView("careerStatistics",m).sections.flatMap(section=>section.rows).find(row=>row.label===label).value;
const a=projection({seed:"1",totalSeasons:1,seasons:[[result({domesticCup:true}),result()]]});
const b=projection({seed:"2",totalSeasons:1,seasons:[[result(),result({domesticCup:true})]]});
const larger=projection({seed:"3",totalSeasons:1,seasons:[[result({championsLeague:true}),result()]]});
const browser=vm.createContext({CareerModeSharedHistoryConvergence:History});
for(const file of ["js/sharedCareerAnalytics.js","js/careerScreenSeam.js"]){
  vm.runInContext(fs.readFileSync(file,"utf8"),browser,{filename:file});
}
const apis=[
  ["Node",require("../../js/sharedCareerAnalytics.js"),require("../../js/careerScreenSeam.js")],
  ["browser VM",browser.CareerModeSharedCareerAnalytics,browser.CareerModeCareerScreenSeam]
];
for(const [runtime,Analytics,Seam] of apis){
  const model=showdowns=>clone(Analytics.buildCareerModel({indexStatus:"ready",showdowns}));
  const ties=[model([entry(a),entry(b)]),model([entry(b),entry(a)])];
  test(runtime+": single completed winner keeps its Showdown reference",()=>{
    const m=model([entry(a)]);
    assert.equal(m.status,"ready");
    assert.deepEqual(m.biggestShowdownWin,{manager:"daniel",margin:1,showdownRef:a.rivalryId});
    assert.deepEqual(record(m),{label,manager:"daniel",value:1,ref:{rivalryId:a.rivalryId}});
    assert.equal(summary(Seam,m),"Daniel by 1");
  });
  test(runtime+": unique larger Daniel win overrides the smaller cross-manager tie",()=>{
    for(const showdowns of [[entry(a),entry(b),entry(larger)],[entry(larger),entry(b),entry(a)]]){
      const m=model(showdowns);
      assert.deepEqual(m.biggestShowdownWin,{manager:"daniel",margin:5,showdownRef:larger.rivalryId});
      assert.deepEqual(record(m),{label,manager:"daniel",value:5,ref:{rivalryId:larger.rivalryId}});
      assert.equal(summary(Seam,m),"Daniel by 5");
    }
  });
  test(runtime+": Trophy Room keeps the shared tied record in either history order",()=>{
    for(const m of ties){
      assert.equal(m.status,"ready");
      assert.deepEqual(record(m),{label,manager:"shared",value:1,ref:null});
    }
  });
  test(runtime+": tied career summary keeps the maximum margin",()=>{
    for(const m of ties)assert.equal(m.biggestShowdownWin.margin,1);
  });
  test(runtime+": tied biggest win credits both managers in either history order",()=>{
    assert.deepEqual(ties.map(m=>m.biggestShowdownWin.manager),["shared","shared"],"equal cross-manager wins must be shared");
  });
  test(runtime+": tied biggest win has no sole Showdown reference",()=>{
    assert.deepEqual(ties.map(m=>m.biggestShowdownWin.showdownRef),[null,null],"cross-Showdown tie has no single witness");
  });
  test(runtime+": career summary agrees with Trophy Room instead of naming one manager",()=>{
    assert.deepEqual(ties.map(m=>summary(Seam,m)),["LEVEL · 1","LEVEL · 1"]);
  });
}
