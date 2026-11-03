(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeChamberMen=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r88 Chamber Men (Nik 2026-11-02 13:53 UTC, name and rule; design https://claude.ai/artifact/KzN1uypy5EZhLx8C4AiQMK):
  // every season, before Roster Russian Roulette, the two managers take a 7-kick penalty shootout against each other.
  // Each round both pick at once where they shoot and where they dive (Left, Middle, Right). A kick is a goal when the
  // shot and the rival's dive differ. Kick k of a manager fills chamber k of the RIVAL's roulette cylinder: a goal is a
  // live round, a miss an empty chamber. The roulette then spins once as before and fires only on a live round, so the
  // chance a manager loses a player is the rival's goals out of 7. No Showdown points: the 15-a-season total is unchanged.
  // penaltymen.com (the inspiration) is not open source: nothing of it is copied, only the pick-a-corner idea.
  //
  // This file is the pure part: the pick format, the scoring and the cylinders. No read, no write, no clock.
  // The shared record (js/chamberMenStep.js) keeps each manager's picks as one string, two letters per round:
  // shot then dive, each one of L M R, or "-" when his own clock ran out (a "-" shot is a miss, a "-" dive stays in the
  // middle). A string only ever grows by one round and is never changed (the Rules bind both).
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
  const ROUNDS=7,CHAMBERS=7,MAX_SEASONS=10;
  const SIDES=Object.freeze(["L","M","R"]),TIMEOUT="-";
  const KICKS=/^(?:[LMR-]{2}){0,7}$/;
  // CHAMBER_FROM_MS is the r88 release time: only Showdowns confirmed at or after it play Chamber Men; every older
  // Showdown keeps the one-bullet roulette exactly as 2.0.0 plays it. It is a placeholder until the r88 release PR pins it
  // (tools/set-release-time.cjs R88 list). Never move it outside the release PR.
  const CHAMBER_FROM_MS=Date.parse("2026-11-03T21:00:00Z");

  function cmMillis(at){
    if(Number.isFinite(at))return at;
    if(at&&typeof at.toMillis==="function"){const value=at.toMillis();return Number.isFinite(value)?value:null;}
    if(at instanceof Date){const value=at.getTime();return Number.isFinite(value)?value:null;}
    return null;
  }
  // Does this Showdown play Chamber Men? confirmedAt is the shared Setup's confirm time (millis, Timestamp or Date).
  function cmEligible(rivalryId,confirmedAt,{fromMs=CHAMBER_FROM_MS}={}){
    const at=cmMillis(confirmedAt);
    return RIVALRY_ID.test(String(rivalryId||""))&&at!==null&&Number.isFinite(fromMs)&&at>=fromMs;
  }
  const cmSeason=season=>Number.isInteger(season)&&season>=1&&season<=MAX_SEASONS;
  const cmKicks=value=>typeof value==="string"&&KICKS.test(value);
  const cmSide=value=>SIDES.includes(value);

  // One round's two letters for a manager. shot/dive are L, M or R; null (or anything else) means his clock ran out.
  function cmPick(shot,dive){return `${cmSide(shot)?shot:TIMEOUT}${cmSide(dive)?dive:TIMEOUT}`;}
  // Where the keeper ends up: a "-" dive stays in the middle.
  function cmDive(dive){return cmSide(dive)?dive:"M";}
  // A kick scores when it was taken (not "-") and the keeper went the other way.
  function cmGoal(shot,dive){return cmSide(shot)&&shot!==cmDive(dive);}

  // The shared record as the two phones see it: {playerOne:"LRM-", playerTwo:"RL"}. null for anything malformed.
  function cmRecord(value){
    if(!value||typeof value!=="object")return null;
    const kicks={};
    for(const role of ROLES){const k=value[role]===undefined||value[role]===null?"":value[role];if(!cmKicks(k))return null;kicks[role]=k;}
    // Nobody is ever more than one round ahead (the Rules refuse it), so a record that is cannot be trusted.
    if(Math.abs(kicks.playerOne.length-kicks.playerTwo.length)>2)return null;
    return Object.freeze(kicks);
  }
  const cmCount=kicks=>kicks.length/2;
  // How far the shootout is: rounds both managers have sent, and whether all 7 are in.
  function cmProgress(record){
    const r=cmRecord(record);if(!r)return null;
    const done=Math.min(cmCount(r.playerOne),cmCount(r.playerTwo));
    return Object.freeze({done,complete:done===ROUNDS,sent:Object.freeze({playerOne:cmCount(r.playerOne),playerTwo:cmCount(r.playerTwo)})});
  }
  // The round this manager picks next (1-7), or null when he has sent all 7 or is waiting for the rival to catch up
  // (he may be at most one round ahead: he sends round k+1 only once the rival has sent round k).
  function cmNextRound(record,role){
    const r=cmRecord(record);if(!r||!ROLES.includes(role))return null;
    const mine=cmCount(r[role]),theirs=cmCount(r[OTHER[role]]);
    if(mine>=ROUNDS||mine>theirs)return null;
    return mine+1;
  }
  // The record after this manager sends his next round, or null when he may not (wrong role, waiting, bad pick).
  function cmSend(record,role,pick){
    const r=cmRecord(record);
    if(!r||typeof pick!=="string"||!/^[LMR-]{2}$/.test(pick)||cmNextRound(r,role)===null)return null;
    return cmRecord({...r,[role]:r[role]+pick});
  }
  // Every round both managers have sent, in order: who shot where, who dived where, and whose kick went in. A round only
  // one manager has sent is never shown (his pick stays hidden until the rival's is in).
  function cmRounds(record){
    const r=cmRecord(record);if(!r)return null;
    const done=Math.min(cmCount(r.playerOne),cmCount(r.playerTwo)),list=[];
    for(let i=0;i<done;i+=1){
      const picks={};
      for(const role of ROLES)picks[role]=Object.freeze({shot:r[role][i*2],dive:r[role][i*2+1]});
      const goal=Object.freeze({playerOne:cmGoal(picks.playerOne.shot,picks.playerTwo.dive),playerTwo:cmGoal(picks.playerTwo.shot,picks.playerOne.dive)});
      list.push(Object.freeze({round:i+1,picks:Object.freeze(picks),goal}));
    }
    return Object.freeze(list);
  }
  // Goals so far for each manager.
  function cmScore(record){
    const rounds=cmRounds(record);if(!rounds)return null;
    const score={playerOne:0,playerTwo:0};
    for(const round of rounds)for(const role of ROLES)if(round.goal[role])score[role]+=1;
    return Object.freeze(score);
  }
  // The two roulette cylinders once all 7 rounds are in: cylinders[role] is that manager's OWN cylinder, chamber k loaded
  // when the rival's kick k went in. null while the shootout is still running (the roulette never spins on a part).
  function cmCylinders(record){
    const rounds=cmRounds(record);
    if(!rounds||rounds.length!==ROUNDS)return null;
    const out={};
    for(const role of ROLES)out[role]=Object.freeze(rounds.map(round=>round.goal[OTHER[role]]));
    return Object.freeze(out);
  }
  const cmBullets=cylinder=>Array.isArray(cylinder)?cylinder.filter(Boolean).length:0;
  // A cylinder as the roulette takes it: exactly 7 booleans.
  function cmValidCylinder(value){return Array.isArray(value)&&value.length===CHAMBERS&&value.every(item=>typeof item==="boolean");}

  return Object.freeze({
    contractVersion:1,feature:"cms-chamber-men",roles:ROLES,rounds:ROUNDS,chambers:CHAMBERS,sides:SIDES,timeout:TIMEOUT,maxSeasons:MAX_SEASONS,
    fromMs:CHAMBER_FROM_MS,eligible:cmEligible,validSeason:cmSeason,validKicks:cmKicks,
    pick:cmPick,dive:cmDive,goal:cmGoal,record:cmRecord,progress:cmProgress,nextRound:cmNextRound,send:cmSend,
    roundsOf:cmRounds,score:cmScore,cylinders:cmCylinders,bullets:cmBullets,validCylinder:cmValidCylinder
  });
});
