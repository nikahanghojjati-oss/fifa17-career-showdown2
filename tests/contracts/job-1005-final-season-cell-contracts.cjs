#!/usr/bin/env node
"use strict";
// JOB-1005 (Team V HO-011 / JOB-1006): the Final Winner screen shows the last season's score. The live frame carries
// frame.lastSeason read from the last accepted season of the verified history; the view renders label, score and result only.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const api=require("../../js/seasonFinalV10.js");

// 1. Frame: lastSeason is read from the accepted history record; the winner is never computed here.
const KEY="rev-key";
const season=(n,p1,p2,winner)=>({roundNumber:n,playerOne:{scoring:{total:p1}},playerTwo:{scoring:{total:p2}},winner});
const record=total=>({totalPoints:total,championsLeagues:1,leagueTitles:1,domesticCups:1,totalTrophies:3});
function frameFor(last,{seasons=3}={}){
  const reconciliation={phase:"FINAL_SEASON_RECONCILED",finalSeasonReconciled:true,winner:"playerOne",managerTotals:{playerOne:20,playerTwo:10},acceptedSeasons:seasons,rivalryId:"r",acceptedRevisionKey:KEY};
  const history=last===null?null:{authoritative:true,phase:"HISTORY_CONVERGED",rivalryId:"r",projection:{acceptedRevisionKey:KEY,acceptedSeasons:seasons,seasonHistory:[season(1,5,5,"draw"),last],managerRecords:{playerOne:record(20),playerTwo:record(10)}}};
  return api.finalFrame(reconciliation,null,history);
}
assert.deepEqual({...frameFor(season(3,7,2,"playerOne")).lastSeason},{season:3,daniel:7,nik:2,winner:"daniel"});
assert.deepEqual({...frameFor(season(3,4,9,"playerTwo")).lastSeason},{season:3,daniel:4,nik:9,winner:"nik"});
assert.deepEqual({...frameFor(season(3,6,6,"draw")).lastSeason},{season:3,daniel:6,nik:6,winner:"draw"});
assert.deepEqual({...frameFor(season(3,0,11,"playerTwo")).lastSeason},{season:3,daniel:0,nik:11,winner:"nik"},"0 is a real score");
// The record's winner is passed through even where a points comparison alone would say otherwise (tie decided on league position).
assert.equal(frameFor(season(3,1,1,"playerOne")).lastSeason.winner,"daniel");
for(const [label,bad] of [["no history",null],["wrong season number",season(2,7,2,"playerOne")],["points above 11",season(3,12,2,"playerOne")],["negative points",season(3,-1,2,"playerOne")],["missing points",{roundNumber:3,playerOne:{scoring:{}},playerTwo:{scoring:{total:2}},winner:"playerOne"}],["unknown winner",season(3,7,2,"someone")]]){
  const f=frameFor(bad);assert.equal(f.lastSeason,undefined,`${label}: no lastSeason`);assert.equal(f.winner,"daniel",`${label}: the final winner is unaffected`);
}

// 2. View: the real Team V script renders the cell from the frame, with the real app strings.
const html=read("visual-assets/v10_1/final-winner/app-shell.html"),strings=JSON.parse(read("visual-assets/v10_1/final-winner/app-strings.json")).strings;
for(const id of ["finalWinnerLastSeason","panelLastSeasonLabel","panelLastSeasonDaniel","panelLastSeasonNik","panelLastSeasonResult"])assert.equal(html.split(`id="${id}"`).length,2,`${id} appears once in the live shell`);
assert.ok(html.indexOf('id="finalWinnerLastSeason"')<html.indexOf('id="panelSeasons"'),"the cell comes first in the summary strip");
assert.ok(html.indexOf('id="panelLastSeasonDaniel"')<html.indexOf('id="panelLastSeasonNik"'),"Daniel is always on the left");
function render(frame){
  const els=new Map();
  const el=()=>({textContent:"",dataset:{},classList:{add(){},remove(){},contains:()=>false},style:{},setAttribute(){},removeAttribute(){},appendChild(){},querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},getBoundingClientRect:()=>({})});
  const document={getElementById:id=>{if(!els.has(id))els.set(id,el());return els.get(id);},createElement:el,addEventListener(){},dispatchEvent(){}};
  const rootEl=el();
  const window={FINAL_WINNER_APP:true,FINAL_WINNER_ROOT:rootEl,FINAL_WINNER_FIXTURES:{strings,frames:{LIVE:frame}},setTimeout(){return 0;},document};
  window.window=window;
  const ctx={window,document,location:{search:""},console,URLSearchParams,CustomEvent:function(){},fetch:()=>new Promise(()=>{})};
  vm.runInNewContext(read("visual-assets/v10_1/final-winner/final-winner.js"),ctx);
  window.ShowdownFinalWinnerBoot();
  const text=id=>document.getElementById(id);
  return {label:text("panelLastSeasonLabel").textContent,daniel:text("panelLastSeasonDaniel"),nik:text("panelLastSeasonNik"),result:text("panelLastSeasonResult").textContent};
}
const base={status:"ready",state:"completed",winner:"daniel",totals:{daniel:20,nik:10},margin:10,seasonsPlayed:3,presentation:{spotlight:"daniel"},heading:"H",trophies:{daniel:{championsLeague:1,leagueTitles:1,domesticCups:1,total:3},nik:{championsLeague:0,leagueTitles:0,domesticCups:0,total:0}}};
for(const [ls,label,d,n,result] of [
  [{season:3,daniel:7,nik:2,winner:"daniel"},"FINAL SEASON 3","7","2","DANIEL TAKES THE SEASON"],
  [{season:5,daniel:4,nik:9,winner:"nik"},"FINAL SEASON 5","4","9","NIK TAKES THE SEASON"],
  [{season:3,daniel:6,nik:6,winner:"draw"},"FINAL SEASON 3","6","6","SEASON DRAWN"],
  [{season:1,daniel:0,nik:11,winner:"nik"},"FINAL SEASON 1","0","11","NIK TAKES THE SEASON"]
]){
  const r=render({...base,lastSeason:ls});
  assert.equal(r.label,label);assert.equal(r.daniel.textContent,d);assert.equal(r.nik.textContent,n);assert.equal(r.result,result);
  assert.equal(r.daniel.dataset.missing,"false");
}
const missing=render({...base});
assert.equal(missing.label,"FINAL SEASON");assert.equal(missing.daniel.textContent,"—");assert.equal(missing.nik.textContent,"—");assert.equal(missing.daniel.dataset.missing,"true");assert.equal(missing.result,"","no result text when the data is missing");

// 3. The port stays in the live Team V files only; the view never computes a winner.
assert.ok(/\/\* JOB-1006\b/.test(read("visual-assets/v10_1/final-winner/final-winner.css")));
assert.ok(!/ls\.daniel\s*[<>]|ls\.nik\s*[<>]/.test(read("visual-assets/v10_1/final-winner/final-winner.js")),"the view does not compare scores");
console.log("PASS job-1005-final-season-cell-contracts");
