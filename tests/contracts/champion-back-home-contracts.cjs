#!/usr/bin/env node
"use strict";
// r76 (CE2PG final.backHome.tap): BACK TO SHOWDOWN HOME on the Showdown Champion screen (#seasonEntry in final mode) must
// open Showdown Home even when the final season was entered from the dashboard (after a reload or CONTINUE CAREER from Home),
// i.e. when "dashboard" is the newest legal entry in the screen history. Mid-season #seasonEntry keeps going back to the dashboard.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const screensSource=fs.readFileSync(path.join(ROOT,"js/screens.js"),"utf8");
const SeasonFinal=require("../../js/seasonFinalV10.js");

function classList(initial=[]){const set=new Set(initial);return {add:(...n)=>n.forEach(x=>set.add(x)),remove:(...n)=>n.forEach(x=>set.delete(x)),contains:n=>set.has(n),toggle:(n,f)=>{const on=f===undefined?!set.has(n):Boolean(f);on?set.add(n):set.delete(n);return on;}};}
function element(id,hidden=true){return {id,classList:classList(hidden?["screen","hidden"]:["screen"]),setAttribute(){},getAttribute(){return null;},removeAttribute(){},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},removeEventListener(){},focus(){},dataset:{}};}
async function world(finalMode){
  const ids=["mainMenu","createShowdown","leagueWheelScreen","clubWheelScreen","dashboard","transferChallenge","seasonEntry","seasonSummary","statistics","careerStatistics","trophyRoom","legacy","ruleBook"];
  const nodes=Object.fromEntries(ids.map(id=>[id,element(id,id!=="seasonEntry")]));
  if(finalMode)nodes.seasonEntry.classList.add("v10FinalMode");
  const document={getElementById:id=>nodes[id]||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},activeElement:null};
  const sandbox={console,document,setTimeout,clearTimeout,requestAnimationFrame:fn=>setTimeout(fn,0),
    ensureRequiredFootballVisualExperience:async()=>true,ensureGameplayModules:async()=>true,
    currentShowdown:{status:"Created",currentRound:1,totalRounds:3,selectedLeague:{id:"serie_a"},clubs:{playerOne:"Genoa",playerTwo:"Sampdoria"},clubConfirmation:null,rounds:[],transferChallenges:[]}};
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  vm.runInContext(screensSource,sandbox,{filename:"js/screens.js"});
  // Dashboard is a valid route here (as in the CE2PG run: isRouteStateValid("dashboard") === true at the final).
  vm.runInContext('isClubConfirmationPending=()=>false;renderScreenBeforeEnter=()=>{};',sandbox);
  assert.equal(vm.runInContext('isRouteStateValid("dashboard")',sandbox),true);
  // The history CE2PG recorded on the Champion screen of a 3-season run (S2 excursion, then season 3 entered from the dashboard).
  for(const name of ["mainMenu","careerStatistics","trophyRoom","mainMenu","legacy","mainMenu","standings","dashboard","transferChallenge"])vm.runInContext(`pushScreenHistory(${JSON.stringify(name)})`,sandbox);
  SeasonFinal.installChampionBack?.(sandbox);
  assert.equal(vm.runInContext("getActiveScreenName()",sandbox),"seasonEntry");
  await vm.runInContext("navigateBackSmart()",sandbox);
  return vm.runInContext("getActiveScreenName()",sandbox);
}
(async()=>{
  assert.equal(await world(true),"mainMenu","Showdown Champion: BACK TO SHOWDOWN HOME opens Showdown Home, not the dashboard");
  assert.equal(await world(false),"dashboard","mid-season Season Results: back still returns to the dashboard");
  console.log("PASS Showdown Champion BACK TO SHOWDOWN HOME opens Showdown Home after a dashboard-entered final season; other #seasonEntry backs unchanged");
})().catch(error=>{console.error(error);process.exitCode=1;});
