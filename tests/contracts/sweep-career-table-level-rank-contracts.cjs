"use strict";
// CARD-HUNT-A08-2: equal career points and Season wins must share first place.
// The fallback seam is affected; Team V's active Trophy Room already ranks ties correctly.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const Seam=require("../../js/careerScreenSeam.js");
const V10=require("../../js/careerScreensV10.js");
const {buildCareerModel}=require("../../js/sharedCareerAnalytics.js");
const {result,projection,finalFor}=require("../support/career-fixture-helpers.cjs");
const clone=value=>JSON.parse(JSON.stringify(value));
const entry=p=>({rivalryId:p.rivalryId,classification:"completed",projection:p,final:finalFor(p)});
const model=seasons=>buildCareerModel({indexStatus:"ready",showdowns:[entry(projection({totalSeasons:seasons.length,seasons}))]});
const seven=result({championsLeague:true,domesticCup:true,topScorer:true});
const five=result({championsLeague:true});
// Two-Season Showdowns are not allowed. A scoreless third Season preserves
// the card's 12/12 points and 1/1 Season wins in a valid completed Showdown.
const tied=model([[seven,five],[five,seven],[result(),result()]]);
const danielLeads=model([[seven,five]]);
const nikLeads=model([[five,seven]]);
const browser={};
vm.createContext(browser);
for(const file of ["careerScreenSeam.js","careerScreensV10.js"]){
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../../js",file),"utf8"),browser,{filename:file});
}
const errors=[];
let cases=0;
function check(name,fn){
  try{fn();cases++;console.log("PASS "+name);}
  catch(error){error.message=name+": "+error.message;errors.push(error);console.error(error);}
}
check("the completed fixture has exactly 12 points and one Season win per manager",()=>{
  assert.equal(tied.status,"ready");
  assert.deepEqual(tied.trophyRoom.standings.map(row=>[row.manager,row.careerPoints,row.seasonWins,row.level]),[
    ["daniel",12,1,true],["nik",12,1,true]
  ]);
  for(const manager of ["daniel","nik"]){
    assert.equal(tied.managers[manager].careerPoints,12);
    assert.equal(tied.managers[manager].seasonWins,1);
  }
});
for(const [runtime,seam,v10] of [["Node",Seam,V10],["browser VM",browser.CareerModeCareerScreenSeam,browser.CareerModeCareerScreensV10]]){
  const table=m=>clone(seam.careerScreenView("trophyRoom",m).sections.find(section=>section.heading==="CAREER TABLE").rows);
  check(runtime+": unique leaders retain first and second place",()=>{
    assert.deepEqual(table(danielLeads),[
      {label:"1. Daniel",value:"7 points, 1 season wins"},
      {label:"2. Nik",value:"5 points, 0 season wins"}
    ]);
    assert.deepEqual(table(nikLeads),[
      {label:"1. Nik",value:"7 points, 1 season wins"},
      {label:"2. Daniel",value:"5 points, 0 season wins"}
    ]);
  });
  check(runtime+": Team V keeps both tied managers ranked #1",()=>{
    assert.deepEqual(clone(v10.toV10Frame(tied,"trophyRoom").standings.map(row=>[row.manager,row.rank,row.careerPoints,row.seasonWins])),[
      ["daniel","#1",12,1],["nik","#1",12,1]
    ]);
  });
  check(runtime+": the fallback Career Table ranks both tied managers first",()=>{
    assert.deepEqual(table(tied),[
      {label:"1. Daniel (level)",value:"12 points, 1 season wins"},
      {label:"1. Nik (level)",value:"12 points, 1 season wins"}
    ]);
  });
}
if(errors.length)throw new AggregateError(errors,"Career Table level-rank contracts: "+errors.length+" failed; "+cases+" passed.");
console.log("PASS Career Table level-rank contracts (7/7): exact tie totals, unique leaders, fallback shared rank and Team V parity in Node/browser VM.");
