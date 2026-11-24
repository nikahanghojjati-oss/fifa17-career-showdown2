"use strict";
// POS1M laws, checked during and after every Ring 1 story. Each law must have one planted bug that only it catches,
// or it is cut (tests/pos1m/planted/). Laws read the authoritative record (server docs and the write log) and what
// each phone was shown; they never trust the code under test to grade itself (scoring has its own oracle here).
//
// L1  At most one commit per season, and it never changes once accepted.
// L2  No phone ever writes an action for the other manager.
// L3  Equal totals are a draw. There is no tiebreak anywhere.
// L4  Nothing private shows early: guesses, signings and results stay hidden until the game reveals them.
// L5  The season order is never skipped or reordered (Ring 1 part: Transfer War -> Results -> Commit -> next season).
// L6  Prime Pack has one winner worth 4, 3, 2 or 1 by the server time of his right guess, or no winner.
// L7  Europa League +3 or Champions League +5, never both; season scores follow the rules (independent oracle).
// L8  A guessed player never joins the board and cannot be signed again.               (step modules: tests/pos1m/steps)
// L9  Sacked ends the Showdown after that season, and points so far decide.
// L10 History and career totals count only finished seasons and Showdowns, each once.
// L11 Once the faults stop, both phones agree on the step and the totals.
// L12 From every state there is a fair way to the end (the story finishes inside its time budget).
// L13 A repeated tap counts once.
// L14 Reads, writes and time per season stay inside their budgets.
const W=require("./world.cjs");
const {canonical}=require("./standin.cjs");

const ROLE_OF_UID={[W.ACCOUNT.playerOne]:"playerOne",[W.ACCOUNT.playerTwo]:"playerTwo"};
const BASE=`rivalries/${W.RIVALRY}`;
const seasonOf=(collection,path)=>{const m=path.match(new RegExp(`^${BASE}/${collection}/season_(\\d+)$`));return m?Number(m[1]):null;};
// Budgets per accepted season on the stand-in (billed reads counted per document read, as Firestore bills).
// Day-one ceilings; the release baseline file replaces them (fail at more than 3% over the baseline).
// Ring 1 reads depend on how often the test actors look, so the per-season READ budget is measured in Ring 3 (CE2PG
// meter, the game's real cadence). Ring 1 guards what the game code alone decides: writes per accepted season and
// document reads inside one provider call.
const BUDGET={writesPerSeason:60,readsPerCall:40};

// Independent scoring oracle from the product rules (Nik's rules, not the code under test):
// CL +5, EL +3 (never with CL), league title +3, domestic cup +1, 100 league points or 100 goals +1, top scorer or top
// assist +1, Prime Pack 4/3/2/1 for the one winner.
function oracleScore(result){
  return (result.championsLeague?5:0)+(result.europaLeague===true?3:0)+(result.leaguePosition===1?3:0)+(result.domesticCup?1:0)+((result.leaguePoints>=100||result.leagueGoals>=100)?1:0)+((result.topScorer||result.topAssist)?1:0)+(Number.isInteger(result.primePack)?result.primePack:0);
}

function state(story){if(!story.lawState)story.lawState={scanned:0,commits:new Map(),acknowledged:new Map(),transferDone:new Set(),resultsReady:new Set()};return story.lawState;}

// A chapter starts from a checkpoint the real providers played: the laws start from what that record already holds.
function fromCheckpoint(story){
  const ls=state(story);
  for(const [path,entry] of story.world.server.docs){
    const d=entry.data;
    const c=seasonOf("seasonCommits",path);if(c!==null){ls.commits.set(c,canonical(d.results));if(d.phase==="ACKNOWLEDGED")ls.acknowledged.set(c,0);}
    const t=seasonOf("transferChallenges",path);if(t!==null&&d.phase==="COMPLETED")ls.transferDone.add(t);
    const r=seasonOf("seasonResults",path);if(r!==null&&d.phase==="RESULTS_READY")ls.resultsReady.add(r);
  }
}

function scanWrites(story){
  const ls=state(story),log=story.world.server.writeLog;
  for(;ls.scanned<log.length;ls.scanned+=1){
    const w=log[ls.scanned];
    if(w.via==="admin")continue;
    const writer=ROLE_OF_UID[w.uid];
    // L14: looking at a step never writes (a write on every look is a billed write per poll).
    if(w.call&&/\.read$/.test(w.call))story.violation("L14_BUDGET",`${w.call} wrote ${w.path.split("/").slice(2).join("/")}`);
    // L2: a role array may only grow by the writer's own role; appended operation receipts are the writer's own.
    if(w.after){
      for(const [key,value] of Object.entries(w.after)){
        if(!/Roles$/.test(key)||!Array.isArray(value))continue;
        const before=w.before&&Array.isArray(w.before[key])?w.before[key]:[];
        const added=value.slice(before.length);
        const prefixKept=before.every((item,i)=>value[i]===item);
        if(!prefixKept)story.violation("L2_NO_INVENTED_ACTION",`${w.path}: ${key} rewrote earlier entries ${JSON.stringify(before)} -> ${JSON.stringify(value)} (writer ${writer})`);
        else if(added.some(role=>role!==writer))story.violation("L2_NO_INVENTED_ACTION",`${w.path}: ${writer} added ${JSON.stringify(added)} to ${key}`);
      }
      const roleDoc=w.path.match(/\/roles\/(playerOne|playerTwo)$/);
      if(roleDoc&&roleDoc[1]!==writer)story.violation("L2_NO_INVENTED_ACTION",`${writer} wrote ${w.path}`);
      if(roleDoc&&w.after.managerRole&&w.after.managerRole!==writer)story.violation("L2_NO_INVENTED_ACTION",`${writer} wrote managerRole ${w.after.managerRole} at ${w.path}`);
    }
    // L1: a season commit, once accepted, never changes its results and is never deleted.
    const commitSeason=seasonOf("seasonCommits",w.path);
    if(commitSeason!==null){
      const prior=ls.commits.get(commitSeason);
      if(!w.after){story.violation("L1_ONE_COMMIT",`season ${commitSeason} commit deleted`);}
      else{
        const key=canonical(w.after.results);
        if(prior!==undefined&&prior!==key)story.violation("L1_ONE_COMMIT",`season ${commitSeason} commit results changed after acceptance`);
        if(prior===undefined)ls.commits.set(commitSeason,key);
        if(w.before&&Number(w.after.revision)<Number(w.before.revision))story.violation("L1_ONE_COMMIT",`season ${commitSeason} commit revision went back ${w.before.revision} -> ${w.after.revision}`);
        if(w.after.phase==="ACKNOWLEDGED")ls.acknowledged.set(commitSeason,w.seq);
      }
      // L5: no commit before both results are published and the Transfer War of that season is complete.
      if(w.after&&!w.before&&!ls.resultsReady.has(commitSeason))story.violation("L5_ORDER",`season ${commitSeason} committed before its results were ready`);
    }
    const resultsSeason=seasonOf("seasonResults",w.path);
    if(resultsSeason!==null&&w.after){
      if(!ls.transferDone.has(resultsSeason))story.violation("L5_ORDER",`season ${resultsSeason} results written before its Transfer War completed`);
      if(w.after.phase==="RESULTS_READY")ls.resultsReady.add(resultsSeason);
    }
    const roleResult=w.path.match(new RegExp(`^${BASE}/seasonResults/season_(\\d+)/roles/`));
    if(roleResult&&!ls.transferDone.has(Number(roleResult[1])))story.violation("L5_ORDER",`season ${roleResult[1]} private result written before its Transfer War completed`);
    const transferSeason=seasonOf("transferChallenges",w.path);
    if(transferSeason!==null&&w.after){
      if(w.after.phase==="COMPLETED")ls.transferDone.add(transferSeason);
      if(transferSeason>1&&!w.before&&!ls.acknowledged.has(transferSeason-1))story.violation("L5_ORDER",`season ${transferSeason} Transfer War opened before season ${transferSeason-1} was acknowledged`);
      transferStep(story,transferSeason,w);
    }
    const packSeason=seasonOf("primePackRounds",w.path);
    if(packSeason!==null)packStep(story,packSeason,w);
    // L9: nothing of a later season is written after a sacked season was accepted.
    if(ls.sackedSeason&&(transferSeason||resultsSeason||commitSeason)>ls.sackedSeason)story.violation("L9_SACKED_ENDS",`season ${transferSeason||resultsSeason||commitSeason} written after the Showdown ended at sacked season ${ls.sackedSeason}`);
    if(commitSeason!==null&&w.after&&w.after.phase==="ACKNOWLEDGED"&&w.after.results&&Object.values(w.after.results).some(r=>r&&r.sacked===true))ls.sackedSeason=commitSeason;
  }
}

function onObserve(story,role,provider,fn,extra,result){
  if(!result||!result.ok)return;
  // L4: what a phone is shown before the reveal.
  if(provider==="Transfer"){
    const phase=result.state&&result.state.phase;
    const opp=result.opponentInputs;
    if(phase!=="COMPLETED"&&opp&&((Array.isArray(opp.guesses)&&opp.guesses.length)||(Array.isArray(opp.signings)&&opp.signings.length)))story.violation("L4_PRIVACY",`${role} saw the rival's ${phase} transfer inputs early`);
  }
  if(provider==="Results"){
    const phase=result.state&&result.state.phase;
    if(phase!=="RESULTS_READY"&&(result.opponentResult||(result.allResults&&result.allResults[W.other(role)])))story.violation("L4_PRIVACY",`${role} saw the rival's season ${extra.seasonNumber} result before both published`);
  }
  // L3 and L7: the scoring a phone is shown.
  if(provider==="Scoring"&&result.scoring){
    const a=result.scoring.playerOne.total,b=result.scoring.playerTwo.total;
    const expected=a>b?"playerOne":b>a?"playerTwo":"draw";
    if(result.winner!==expected)story.violation("L3_NO_TIEBREAK",`season ${extra.seasonNumber}: totals ${a}-${b} but winner ${result.winner}`);
  }
}

// L5 inside the Transfer War: each phase is reached only the fair way, in order, never skipped and never back.
//   WINDOW_OPEN -> GUESS_ENTRY  both managers asked to end, or 15 minutes passed on the server clock since the stamped
//                              start (less 3.5 s: each phone's server estimate may be 1.5 s off, plus rounding)
//   GUESS_ENTRY -> SIGNING_ENTRY  both locked their guesses;  SIGNING_ENTRY -> COMPLETED  both locked their signings
const TRANSFER_ORDER=["NOT_STARTED","WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"];
const WINDOW_MS=15*60_000,ESTIMATE_SLACK_MS=3_500;
const bothIn=list=>Array.isArray(list)&&W.ROLES.every(role=>list.includes(role));
const millisOf=value=>value&&typeof value.toMillis==="function"?value.toMillis():value&&Number.isFinite(value.seconds)?value.seconds*1000+Math.floor((value.nanoseconds||0)/1e6):null;
function transferStep(story,season,w){
  const from=w.before?w.before.phase:"NOT_STARTED",to=w.after.phase;
  if(from===to)return;
  const a=TRANSFER_ORDER.indexOf(from),b=TRANSFER_ORDER.indexOf(to);
  if(a<0||b<0||b<a){story.violation("L5_ORDER",`season ${season} Transfer War went ${from} -> ${to}`);return;}
  if(b>a+1&&!(from==="NOT_STARTED"&&to==="WINDOW_OPEN")){story.violation("L5_ORDER",`season ${season} Transfer War skipped from ${from} to ${to}`);return;}
  if(to==="GUESS_ENTRY"&&!bothIn(w.after.endRequestedRoles)){
    const started=millisOf(w.after.startedAt);
    if(started===null||w.at<started+WINDOW_MS-ESTIMATE_SLACK_MS)story.violation("L5_ORDER",`season ${season} Transfer War closed after ${started===null?"?":Math.round((w.at-started)/1000)} s with end requests ${JSON.stringify(w.after.endRequestedRoles)}`);
  }
  if(to==="SIGNING_ENTRY"&&!bothIn(w.after.guessLockedRoles))story.violation("L5_ORDER",`season ${season} signings opened with guesses locked by ${JSON.stringify(w.after.guessLockedRoles)}`);
  if(to==="COMPLETED"&&!bothIn(w.after.signingLockedRoles))story.violation("L5_ORDER",`season ${season} Transfer War completed with signings locked by ${JSON.stringify(w.after.signingLockedRoles)}`);
}

// L6 Prime Pack, from the product rules (Nik 2026-11-01 and the r88 spec): the round starts 3 s after the later arrival;
// stage k is its reveal then its guessing timer (reveal 2.5 s then 25 s; then 1.5 s + 20 s three times); a right guess
// in stage 1, 2, 3, 4 is worth 4, 3, 2, 1, judged by the server time of the winning write; the Rules take it until 2 s
// after the stage 4 timer. Two guesses each. One winner at most, and only he scores.
const PACK_LEAD_MS=3_000,PACK_STAGE_MS=[27_500,21_500,21_500,21_500],PACK_SLACK_MS=2_000,PACK_POINTS=[4,3,2,1],PACK_CHIPS=2;
function packOracle(round){
  if(!round||!W.ROLES.includes(round.namedBy))return null;
  const a=millisOf(round.arrived&&round.arrived.playerOne),b=millisOf(round.arrived&&round.arrived.playerTwo),at=millisOf(round.updatedAt);
  if(a===null||b===null||at===null)return {role:round.namedBy,points:null,why:"winner without both arrivals"};
  let elapsed=at-(Math.max(a,b)+PACK_LEAD_MS);
  if(elapsed<0)return {role:round.namedBy,points:null,why:`winning guess ${-elapsed} ms before the start`};
  for(let i=0;i<PACK_STAGE_MS.length;i+=1){if(elapsed<PACK_STAGE_MS[i]||(i===PACK_STAGE_MS.length-1&&elapsed<PACK_STAGE_MS[i]+PACK_SLACK_MS))return {role:round.namedBy,points:PACK_POINTS[i]};elapsed-=PACK_STAGE_MS[i];}
  return {role:round.namedBy,points:null,why:"winning guess after the round ended"};
}
function packStep(story,season,w){
  const before=w.before,after=w.after;
  if(!after){story.violation("L6_PRIME_PACK",`season ${season} Prime Pack round deleted`);return;}
  if(before&&before.namedBy&&after.namedBy!==before.namedBy)story.violation("L6_PRIME_PACK",`season ${season} Prime Pack winner changed ${before.namedBy} -> ${after.namedBy}`);
  if(after.namedBy&&ROLE_OF_UID[w.uid]!==after.namedBy&&!(before&&before.namedBy===after.namedBy))story.violation("L6_PRIME_PACK",`season ${season} ${ROLE_OF_UID[w.uid]} named ${after.namedBy} the Prime Pack winner`);
  for(const role of W.ROLES){
    const used=after.chipsUsed&&after.chipsUsed[role],was=before&&before.chipsUsed?before.chipsUsed[role]:0;
    if(!Number.isInteger(used)||used<was||used>PACK_CHIPS)story.violation("L6_PRIME_PACK",`season ${season} ${role} guesses used ${was} -> ${used}`);
    const arrivedBefore=before&&before.arrived?millisOf(before.arrived[role]):null,arrivedAfter=after.arrived?millisOf(after.arrived[role]):null;
    const bothBefore=before&&before.arrived&&W.ROLES.every(r=>millisOf(before.arrived[r])!==null);
    if(bothBefore&&arrivedAfter!==arrivedBefore)story.violation("L6_PRIME_PACK",`season ${season} ${role} arrival moved after the round started`);
  }
}
function packFinal(story,commits){
  const docs=story.world.server.docs;
  for(const c of commits){
    const results=c.data.results;if(!results)continue;
    const scored=W.ROLES.filter(role=>results[role]&&results[role].primePack!==undefined);
    if(scored.length>1){story.violation("L6_PRIME_PACK",`season ${c.season}: both managers scored the Prime Pack`);continue;}
    const round=docs.get(`${BASE}/primePackRounds/season_${c.season}`);
    const oracle=packOracle(round&&round.data);
    if(!oracle){if(scored.length)story.violation("L6_PRIME_PACK",`season ${c.season}: ${scored[0]} scored ${results[scored[0]].primePack} for a Prime Pack nobody won`);continue;}
    if(oracle.points===null){story.violation("L6_PRIME_PACK",`season ${c.season}: ${oracle.why}`);continue;}
    if(scored.length&&scored[0]!==oracle.role)story.violation("L6_PRIME_PACK",`season ${c.season}: ${scored[0]} scored the Prime Pack ${oracle.role} won`);
    else if(!scored.length)story.violation("L6_PRIME_PACK",`season ${c.season}: ${oracle.role} won the Prime Pack (${oracle.points}) but scored nothing`);
    else if(results[oracle.role].primePack!==oracle.points)story.violation("L6_PRIME_PACK",`season ${c.season}: ${oracle.role} scored ${results[oracle.role].primePack} for a stage worth ${oracle.points}`);
  }
}

// Game refusals are upper-case codes (SEASON_RESULTS_...); Firestore transport errors are lower-case (unavailable, ...).
const GAME_CODE=/^[A-Z][A-Z0-9_]+$/;

function afterMove(story){scanWrites(story);}

function onRepeat(story,role,key,provider,fn,extra,first,again){
  // L13: the exact same command again (same operation id and base) must be a replay, never a second action.
  if(again&&again.ok&&again.replayed!==true&&!(provider==="Transfer"&&fn==="markSpun"))story.violation("L13_REPEAT_ONCE",`${role} ${key}: the repeated tap was accepted as a new action`);
  // ...and answered with the saved result, never a game error (a network error on the repeat is fine: it is retried).
  if(first&&first.ok&&again&&!again.ok&&GAME_CODE.test(again.code||""))story.violation("L13_REPEAT_ONCE",`${role} ${key}: the repeated tap was refused with ${again.code}`);
  scanWrites(story);
}

function final(story,views){
  scanWrites(story);
  const server=story.world.server,docs=server.docs;
  const commits=[];
  for(const [path,entry] of docs){const s=seasonOf("seasonCommits",path);if(s!==null)commits.push({season:s,data:entry.data});}
  commits.sort((x,y)=>x.season-y.season);
  const accepted=commits.filter(c=>c.data.phase==="ACKNOWLEDGED");
  // L7: results never carry both; and every season score follows the rules.
  for(const c of commits){for(const role of W.ROLES){const r=c.data.results&&c.data.results[role];if(r&&r.europaLeague===true&&r.championsLeague===true)story.violation("L7_EL_OR_CL",`season ${c.season} ${role} has Europa League and Champions League`);}}
  packFinal(story,commits);
  // L1: each commit holds exactly what the two managers published (no swapped, stale or edited copy).
  for(const c of commits)for(const role of W.ROLES){
    const own=docs.get(`${BASE}/seasonResults/season_${c.season}/roles/${role}`);
    if(own&&own.data.result&&c.data.results&&canonical(own.data.result)!==canonical(c.data.results[role]))story.violation("L1_ONE_COMMIT",`season ${c.season} commit holds ${role} ${canonical(c.data.results[role])}, published ${canonical(own.data.result)}`);
  }
  const a=views.playerOne,b=views.playerTwo;
  if(!a.multi.ok||!b.multi.ok){story.violation("L11_CONVERGE",`final read failed: ${a.multi.code||""} ${b.multi.code||""}`);return;}
  // L11: both phones agree once the faults stop.
  const strip=value=>{const copy=JSON.parse(JSON.stringify(value));delete copy.managerRole;if(copy.state)delete copy.state.managerRole;return copy;};
  if(canonical(strip(a.multi.state))!==canonical(strip(b.multi.state)))story.violation("L11_CONVERGE","the two phones disagree on the step");
  else if(canonical(strip(a.multi))!==canonical(strip(b.multi)))story.violation("L11_CONVERGE","the two phones disagree on the Home dashboard or its History");
  if(a.history&&b.history&&canonical(a.history.projection)!==canonical(b.history.projection))story.violation("L11_CONVERGE","the two phones disagree on History");
  for(let i=0;i<a.scoring.length;i+=1){const x=a.scoring[i],y=b.scoring[i];if(!x.ok||!y.ok||canonical(x.scoring)!==canonical(y.scoring)||x.winner!==y.winner)story.violation("L11_CONVERGE",`the two phones disagree on season ${i+1} scoring`);}
  // L7 oracle and L3 on every accepted season.
  const totals={playerOne:0,playerTwo:0};
  a.scoring.forEach((score,i)=>{
    if(!score.ok)return;
    const commit=accepted[i];
    for(const role of W.ROLES){
      const expected=commit&&commit.data.results?oracleScore(commit.data.results[role]):null;
      if(expected!==null&&score.scoring[role].total!==expected)story.violation("L7_EL_OR_CL",`season ${i+1} ${role}: scored ${score.scoring[role].total}, the rules give ${expected}`);
      totals[role]+=score.scoring[role].total;
    }
    onObserve(story,"final","Scoring","read",{seasonNumber:i+1},score);
  });
  // L10: History counts each accepted season once, with the right totals.
  const multi=a.multi.state;
  if(multi.acceptedSeasons!==accepted.length)story.violation("L10_HISTORY_ONCE",`Multi says ${multi.acceptedSeasons} accepted seasons, the record has ${accepted.length}`);
  if(a.history&&a.history.ok){
    const p=a.history.projection;
    if(p.acceptedSeasons!==accepted.length||p.seasonHistory.length!==accepted.length)story.violation("L10_HISTORY_ONCE",`History holds ${p.seasonHistory.length} seasons (says ${p.acceptedSeasons}), the record has ${accepted.length}`);
    for(const role of W.ROLES)if(p.managerRecords[role].totalPoints!==totals[role])story.violation("L10_HISTORY_ONCE",`History total ${role} ${p.managerRecords[role].totalPoints}, the seasons add up to ${totals[role]}`);
    const wins=role=>a.scoring.filter(s=>s.ok&&s.winner===role).length,draws=a.scoring.filter(s=>s.ok&&s.winner==="draw").length;
    for(const role of W.ROLES){if(p.managerRecords[role].seasonWins!==wins(role))story.violation("L3_NO_TIEBREAK",`History season wins ${role} ${p.managerRecords[role].seasonWins}, the seasons give ${wins(role)}`);if(p.managerRecords[role].seasonDraws!==draws)story.violation("L3_NO_TIEBREAK",`History draws ${p.managerRecords[role].seasonDraws}, the seasons give ${draws}`);}
  }else if(accepted.length)story.violation("L10_HISTORY_ONCE",`History read failed: ${a.history&&a.history.code}`);
  // L9 and L12: the Showdown ends exactly at its length, or right after a sacked season.
  const sacked=accepted.find(c=>W.ROLES.some(role=>c.data.results[role].sacked===true));
  if(story.status==="done"){
    const stop=story.plan.stopAtSeason;// a prefix or a chapter stops before this season
    if(sacked){
      if(!multi.terminal||multi.acceptedSeasons!==sacked.season)story.violation("L9_SACKED_ENDS",`sacked in season ${sacked.season}, but the Showdown ${multi.terminal?"ended":"goes on"} after ${multi.acceptedSeasons} seasons`);
    }else if(stop){
      if(multi.terminal||multi.acceptedSeasons!==stop-1)story.violation("L12_LIVENESS",`the story should stop before season ${stop}, it holds ${multi.acceptedSeasons} accepted seasons (terminal ${multi.terminal})`);
    }else{
      if(!multi.terminal)story.violation("L12_LIVENESS","the managers stopped but the Showdown is not complete");
      if(multi.acceptedSeasons!==story.plan.totalSeasons)story.violation("L12_LIVENESS",`the Showdown ended after ${multi.acceptedSeasons} seasons, expected ${story.plan.totalSeasons}`);
    }
  }
  // L14: budgets per accepted season.
  const seasons=Math.max(1,accepted.length);
  if(server.meter.writes/seasons>BUDGET.writesPerSeason)story.violation("L14_BUDGET",`${Math.round(server.meter.writes/seasons)} writes per season (budget ${BUDGET.writesPerSeason})`);
}

module.exports={fromCheckpoint,onObserve,afterMove,onRepeat,final,oracleScore,BUDGET};
