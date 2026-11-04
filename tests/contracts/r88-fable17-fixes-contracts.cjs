"use strict";
// r88 Fable job 17 fixes (gameplay/r88/fable-hunt/FABLE17_HUNT_2026-11-03.md).
//   F17-01 a Chamber Men Showdown whose earlier season's spin mark holds no saved outcome replays that season from its own
//          shootout (its cylinders; one bullet when that season has no finished shootout), instead of "No roulette board"
//          for ever; a season that still cannot be rebuilt names itself and Chamber Men in the card's reason.
//   F17-02 "The pick did not go through" stays on screen (render() no longer writes over it at the next tick).
//   F17-03 a kick says its clock starts only when the rival locks in (turn by turn: every kick).
//   F17-06 full time reads "Daniel 4 · Nik 3" / "Level · Daniel 3 · Nik 3".
//   F17-07 (layout) is checked in the browser: tests/contracts/r88-fable17-chamber-fold-browser-contracts.cjs.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const ROOT=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const RR=require("../../js/rosterRoulette.js");
const Squads=require("../../data/rosterSquads.js");
let checks=0;const ok=(id,text)=>{checks+=1;console.log(`ok ${checks} ${id} ${text}`);};
const clubs=Object.keys(Squads.squads),pair={playerOne:clubs[0],playerTwo:clubs[1]};
const loaded=n=>Array.from({length:7},(_,i)=>i<n);
const history=[null,{playerOne:[],playerTwo:[]}];
const names=board=>board.map(row=>row&&row.name);

// F17-01 engine: an earlier season with no saved outcome replays from that season's cylinders, or one bullet.
{
  assert.equal(typeof RR.savedHit,"function","the engine shares its saved-outcome check with the step");
  let firedSeen=0;
  for(let i=0;i<40;i+=1){
    const rid=`pair_${crypto.createHash("sha256").update(`f17-${i}`).digest("hex")}`;
    const c1={playerOne:loaded(i%8),playerTwo:loaded(7-(i%8))},c2={playerOne:loaded(3),playerTwo:loaded(4)};
    const version=RR.version(pair,{});
    const season1=RR.forSeason(rid,pair,1,{chamberMen:true,chambers:{1:c1}});
    const hits={1:{playerOne:RR.outcome(season1,"playerOne",version),playerTwo:RR.outcome(season1,"playerTwo",version)}};
    firedSeen+=season1.turns.filter(t=>t.fired).length;
    const fromMarks=RR.forSeason(rid,pair,2,{chamberMen:true,chambers:{2:c2},history,hits});
    const fromShootout=RR.forSeason(rid,pair,2,{chamberMen:true,chambers:{1:c1,2:c2},history});
    assert.ok(fromShootout,"no saved outcome, but that season's cylinders: a plan");
    for(const role of ["playerOne","playerTwo"])assert.deepEqual(names(fromShootout.boards[role]),names(fromMarks.boards[role]),"the same board as the saved marks give");
    // A season that played no Chamber Men (switched off then) spun one bullet: the same board as a one-bullet replay.
    const oneBullet=RR.forSeason(rid,pair,2,{chamberMen:true,chambers:{1:{oneBullet:true},2:c2},history});
    const classic=RR.forSeason(rid,pair,2,{history});
    assert.ok(oneBullet,"a season with no finished shootout replays one bullet");
    for(const role of ["playerOne","playerTwo"])assert.deepEqual(names(oneBullet.boards[role]),names(classic.boards[role]));
    // Still never one bullet by default (CM4): no saved outcome and nothing said about that season is no plan.
    assert.equal(RR.forSeason(rid,pair,2,{chamberMen:true,chambers:{2:c2},history}),null);
  }
  assert.ok(firedSeen>0,"some season-1 spins hit a player, so the boards really differ");
  ok("F17-01a","an earlier Chamber Men season with no saved outcome replays from its own cylinders (or one bullet when it had no shootout)");
}
// F17-01 step: only seasons missing an outcome are read; the shootout's answer becomes that season's chambers.
(async()=>{
  const Step=require("../../js/rosterRouletteStep.js");
  assert.equal(typeof Step.earlierChambers,"function");
  const rid=`pair_${"cd".repeat(32)}`,ctx={rivalryId:rid,season:3,managerRole:"playerOne",clubs:pair};
  const full={fired:false,hitName:null,hitNumber:null,hitSlot:null,hitSignedSeason:null,version:"v"};
  const now={playerOne:loaded(2),playerTwo:loaded(5)};
  const asked=[];
  const chamber=answers=>({active:true,chambers:{3:now},earlier:async k=>{asked.push(k);return answers[k];}});
  // Both outcomes saved in seasons 1 and 2: nothing is read.
  let out=await Step.earlierChambers(ctx,RR,{1:{playerOne:full,playerTwo:full},2:{playerOne:full,playerTwo:full}},chamber({}));
  assert.deepEqual(asked,[]);assert.deepEqual(Object.keys(out),["3"]);
  // Season 1 lost Nik's outcome (finished shootout), season 2 has no marks at all (no finished shootout: one bullet).
  out=await Step.earlierChambers(ctx,RR,{1:{playerOne:full,playerTwo:null},2:null},chamber({1:{ok:true,chambers:{playerOne:loaded(1),playerTwo:loaded(6)}},2:{ok:false,reason:"NOT_FINISHED"}}));
  assert.deepEqual(asked,[1,2]);
  assert.deepEqual(out[1],{playerOne:loaded(1),playerTwo:loaded(6)});assert.deepEqual({...out[2]},{oneBullet:true});assert.equal(out[3],now);
  // A record the engine cannot read leaves the season out (no plan; the card names it).
  asked.length=0;
  out=await Step.earlierChambers({...ctx,season:2},RR,{1:null},chamber({1:{ok:false,reason:"BAD_RECORD"}}));
  assert.deepEqual(asked,[1]);assert.equal(out[1],undefined);
  const step=read("js/rosterRouletteStep.js");
  assert.match(step,/const chambers=chamber&&known\?await rrsEarlierChambers\(ctx,engine,hits,chamber\):null;if\(chamber&&known&&!chambers\)return false;/,"a failed read asks TRY AGAIN / BACK, never spins");
  assert.match(step,/Season \$\{k\}'s roulette spin was not saved and its Chamber Men result could not be used to replay it/,"the card's reason names the season and Chamber Men");
  const pstc=read("js/productionSharedTransferChallenge.js");
  assert.match(pstc,/earlier:k=>step\.cylinders\(\{\.\.\.ctx,season:k\},io\)\};/,"the shootout step reads an earlier season's cylinders");
  assert.match(pstc,/score:chamberGate\.score,earlier:chamberGate\.earlier\}:null\};/,"and the roulette gets that reader");
  ok("F17-01b","the roulette reads an earlier season's shootout only when that season's saved outcome is missing");

  // F17-02 / F17-03 / F17-06 (wording on the shootout screen).
  const cm=read("js/chamberMenStep.js");
  assert.match(cm,/notice=\{text:"The pick did not go through\. Tap LOCK IN again\.",until:Date\.now\(\)\+NOTICE_MS\}/);
  assert.match(cm,/ui\.status\.textContent=notice&&Date\.now\(\)<notice\.until\?notice\.text:/,"render() keeps the notice up");
  assert.ok(!/ui\.status\.textContent="The pick did not go through/.test(cm),"no longer written straight over by the next tick");
  ok("F17-02","a failed lock-in says so and stays on screen");
  // Turn by turn (Nik 2026-11-03): every kick's clock waits for the rival's lock-in, and the screen says so.
  assert.match(cm,/`Pick your \$\{part\}, then lock in\. No clock until \$\{NAMES\[other\]\} locks in his \$\{theirPart\}\.`/);
  ok("F17-03","each kick says the clock waits for the rival");
  assert.match(cm,/const line=`\$\{NAMES\.playerOne\} \$\{score\.playerOne\} · \$\{NAMES\.playerTwo\} \$\{score\.playerTwo\}`;/);
  assert.match(cm,/score\.playerOne===score\.playerTwo\?`Level · \$\{line\}`:line;/);
  assert.ok(!/`Level, \$\{/.test(cm));
  ok("F17-06","full time has one shape: Daniel 4 · Nik 3, Level · Daniel 3 · Nik 3");
  console.log(`PASS r88 Fable 17 fixes contracts: ${checks} checks.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
