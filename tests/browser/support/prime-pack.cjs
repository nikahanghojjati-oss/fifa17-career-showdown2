"use strict";
// r87 Prime Pack in browser journeys. Every season, after Roster Roulette and before the Transfer Challenge, both phones show the
// masked-Icon round (#igStage, an iframe on visual-assets/v10_1/icon-guess). This helper plays it with a fixed plan so a journey
// covers wins worth 4, 3, 2 and 1 and a season nobody names the Icon:
//   CE2PG_PRIME=table (default)  season 1 Daniel stage 1 (4), 2 Nik stage 2 (3), 3 Daniel stage 3 (2), 4 Nik stage 4 (1), 5 nobody,
//                                6 Nik 4, 7 Daniel 3, 8 Nik 2, 9 Daniel 1, 10 nobody (then the table repeats)
//   CE2PG_PRIME=golden           Nik names the Icon in stage 1 every season (the plan also makes his season results perfect: 11 + 4 = 15)
//   CE2PG_PRIME=off              the step is not played (a build without Prime Pack)
// The guess is sent the way the stand-in page sends it ("cms-ig-guess" with the card name, posted from inside the frame to the
// game page); the answer is the name the game itself sent to the page ("cms-ig-start" round.name). Nothing here reads production.
const MODE=process.env.CE2PG_PRIME||"table";
const TABLE=[["daniel",0],["nik",1],["daniel",2],["nik",3],[null,0],["nik",0],["daniel",1],["nik",2],["daniel",3],[null,0]];
const POINTS=[4,3,2,1];
function planFor(season){
  if(MODE==="off")return null;
  if(MODE==="golden")return {winner:"nik",beat:0,points:4};
  const e=TABLE[(season-1)%TABLE.length];
  return {winner:e[0],beat:e[1],points:e[0]?POINTS[e[1]]:0};
}
const enabled=()=>MODE!=="off";
const golden=()=>MODE==="golden";
// Adds primePack (and, in golden mode, Nik's perfect season) to a season's plan entry {daniel,nik}. maxPoints = the league's.
function decorate(entry,season){
  const plan=planFor(season);
  if(!plan)return entry;
  if(golden())entry.nik={...entry.nik,leaguePosition:1,leagueGoals:Math.max(100,entry.nik.leagueGoals),domesticCup:true,championsLeague:true,topScorer:true};
  if(plan.winner)entry[plan.winner]={...entry[plan.winner],primePack:plan.points};
  return entry;
}
// In every frame: remember what the game sent to the page.
const PROBE=()=>{window.addEventListener("message",event=>{
  const d=event.data;if(!d||typeof d.type!=="string")return;
  const s=window.__ig=window.__ig||{};
  if(d.type==="cms-ig-start"){s.name=d.round&&d.round.name||null;s.beat=-2;s.result=null;}
  else if(d.type==="cms-ig-reveal")s.beat=d.index;
  else if(d.type==="cms-ig-result")s.result={winner:d.winner,points:d.points};
});};
async function install(context){if(enabled())await context.addInitScript(PROBE);}

const dbg={n:0};const observed=[];const guessed=new Set(),continued=new Set();
async function whoAndSeason(page){
  return page.evaluate(()=>{
    const who=(document.getElementById("onlinePlayerIdentityBadge")?.textContent||"").trim().toLowerCase();
    const m=/Season\s+(\d+)\s*\/\s*\d+/.exec(document.getElementById("seasonIndicator")?.textContent||"");
    return {who,season:m?Number(m[1]):0};
  }).catch(()=>({who:"",season:0}));
}
// One poll. null = no Prime Pack stage on this page; otherwise a short word for what happened.
async function playPrime(page){
  if(!enabled())return null;
  if(!await page.locator("#igStage").isVisible().catch(()=>false)){
    if(process.env.CE2PG_PRIME_DEBUG&&(dbg.n+=1)<=40&&dbg.n%4===0)console.log("PRIME none",JSON.stringify(await page.evaluate(()=>({step:typeof window.CareerModeIconGuessStep,setup:window.CareerModeProductionSharedShowdownSetup?.getState?.()?.setupUpdatedAtMs??null,off:window.CMS_PRIME_PACK||null,tc:Boolean(document.getElementById("transferChallenge")&&document.getElementById("transferChallenge").offsetParent),rr:Boolean(document.getElementById("rrStage")||document.getElementById("rrStepPanel")),ig:Boolean(document.getElementById("igStage"))})).catch(e=>String(e))));
    return null;
  }
  const frame=page.frames().find(f=>/icon-guess/.test(f.url()));
  if(process.env.CE2PG_PRIME_DEBUG)console.log("PRIME stage visible",Boolean(frame),page.frames().map(f=>f.url()).join(" "));
  if(!frame)return "wait";
  const {who,season}=await whoAndSeason(page);
  if(!season||!who)return "wait";
  const plan=planFor(season),state=await frame.evaluate(()=>window.__ig||{}).catch(()=>({}));
  const key=`${who}|${season}|${state.name||""}`;
  if(state.result){
    if(!continued.has(key)){
      continued.add(key);
      observed.push({user:who,season,winner:state.result.winner,points:state.result.points});
      await frame.evaluate(()=>parent.postMessage({type:"cms-ig-continue"},"*")).catch(()=>{});
    }
    return "continue";
  }
  if(plan&&plan.winner===who&&state.name&&state.beat===plan.beat&&!guessed.has(key)){
    guessed.add(key);
    await frame.evaluate(name=>parent.postMessage({type:"cms-ig-guess",text:name},"*"),state.name).catch(()=>{});
    return "guess";
  }
  return "wait";
}
// Every observed round against the plan: who won and what it was worth (both phones must have seen the same result).
function verify(){
  const problems=[];
  const bySeason=new Map();
  for(const o of observed){(bySeason.get(o.season)||bySeason.set(o.season,[]).get(o.season)).push(o);}
  for(const [season,list] of bySeason){
    const plan=planFor(season),want=plan.winner?{winner:plan.winner==="daniel"?"playerOne":"playerTwo",points:plan.points}:{winner:"draw",points:0};
    for(const o of list)if(o.winner!==want.winner||o.points!==want.points)problems.push(`season ${season} ${o.user} saw ${o.winner}/${o.points}, plan ${want.winner}/${want.points}`);
  }
  return {seasons:[...bySeason.keys()].length,observed:observed.length,problems};
}
module.exports={enabled,golden,planFor,decorate,install,playPrime,verify,observed,MODE};
