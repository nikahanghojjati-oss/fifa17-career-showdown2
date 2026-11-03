(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeChamberMen=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r88 Chamber Men (Nik 2026-11-02 13:53 UTC, name and rule; design https://claude.ai/artifact/KzN1uypy5EZhLx8C4AiQMK):
  // every season, before Roster Russian Roulette, the two managers take a 7-round penalty shootout against each other.
  // Turn by turn (Nik 2026-11-03: "In each turn one player shoots and the other dives, then the other player shoots and the
  // first one dives. No one does both at the same time."): each round has two kicks. Kick A: Daniel (playerOne, the
  // Showdown starter) shoots and Nik keeps; kick B: Nik shoots and Daniel keeps. So the 14 kicks go Daniel, Nik, Daniel, ...
  // On each kick the shooter only picks his shot and the keeper only picks his dive (Left, Middle, Right). A kick is a goal
  // when the shot and the keeper's dive differ. Each manager always takes exactly 7 shots (no early finish). Kick k of a
  // manager (his k-th shot) fills chamber k of the RIVAL's roulette cylinder: a goal is a live round, a miss an empty
  // chamber. The roulette then spins once as before and fires only on a live round, so the chance a manager loses a player
  // is the rival's goals out of 7. No Showdown points: the 15-a-season total is unchanged.
  // penaltymen.com (the inspiration) is not open source: nothing of it is copied, only the pick-a-corner idea.
  //
  // This file is the pure part: the pick format, the scoring and the cylinders. No read, no write, no clock.
  // The shared record (js/chamberMenStep.js) keeps each manager's picks as one string, one letter per kick (14 at most):
  // on a kick he shoots it is his shot, on a kick he keeps it is his dive; each one of L M R, or "-" when his own clock ran
  // out (a "-" shot is a miss, a "-" dive stays in the middle). A string only ever grows by one kick, never runs more than
  // one kick ahead of the other, and is never changed (the Rules bind all three).
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
  const ROUNDS=7,KICKS_TOTAL=14,CHAMBERS=7,MAX_SEASONS=10;
  const SIDES=Object.freeze(["L","M","R"]),TIMEOUT="-";
  const KICKS=/^[LMR-]{0,14}$/;
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

  // Kick n (1-14): its round (1-7), its half (A: Daniel shoots, B: Nik shoots), who shoots and who keeps, and which of the
  // shooter's 7 shots it is. null for anything else.
  function cmKick(n){
    if(!Number.isInteger(n)||n<1||n>KICKS_TOTAL)return null;
    const shooter=n%2===1?"playerOne":"playerTwo";
    return Object.freeze({kick:n,round:Math.ceil(n/2),half:n%2===1?"A":"B",shooter,keeper:OTHER[shooter],shot:Math.ceil(n/2)});
  }
  // What this manager does on kick n: "shot" or "dive" (null for a bad kick or role).
  function cmRole(n,role){const k=cmKick(n);return k&&ROLES.includes(role)?(k.shooter===role?"shot":"dive"):null;}
  // One kick's letter for a manager. side is L, M or R; null (or anything else) means his clock ran out.
  function cmPick(side){return cmSide(side)?side:TIMEOUT;}
  // Where the keeper ends up: a "-" dive stays in the middle.
  function cmDive(dive){return cmSide(dive)?dive:"M";}
  // A kick scores when it was taken (not "-") and the keeper went the other way.
  function cmGoal(shot,dive){return cmSide(shot)&&shot!==cmDive(dive);}

  // The shared record as the two phones see it: {playerOne:"LRM-", playerTwo:"RLL"}. null for anything malformed.
  function cmRecord(value){
    if(!value||typeof value!=="object")return null;
    const kicks={};
    for(const role of ROLES){const k=value[role]===undefined||value[role]===null?"":value[role];if(!cmKicks(k))return null;kicks[role]=k;}
    // Nobody is ever more than one kick ahead (the Rules refuse it), so a record that is cannot be trusted.
    if(Math.abs(kicks.playerOne.length-kicks.playerTwo.length)>1)return null;
    return Object.freeze(kicks);
  }
  // How far the shootout is: kicks both managers have sent (done, 0-14), whether all 14 are in, and each one's letters.
  function cmProgress(record){
    const r=cmRecord(record);if(!r)return null;
    const done=Math.min(r.playerOne.length,r.playerTwo.length);
    return Object.freeze({done,complete:done===KICKS_TOTAL,sent:Object.freeze({playerOne:r.playerOne.length,playerTwo:r.playerTwo.length})});
  }
  // The kick this manager picks for next (1-14), or null when he has sent all 14 or is waiting for the rival's letter for
  // the kick on now (he may be at most one kick ahead: he sends kick n+1 only once the rival has sent kick n).
  function cmNextKick(record,role){
    const r=cmRecord(record);if(!r||!ROLES.includes(role))return null;
    const mine=r[role].length,theirs=r[OTHER[role]].length;
    if(mine>=KICKS_TOTAL||mine>theirs)return null;
    return mine+1;
  }
  // The record after this manager sends his letter for his next kick, or null when he may not (wrong role, waiting, bad pick).
  function cmSend(record,role,letter){
    const r=cmRecord(record);
    if(!r||typeof letter!=="string"||!/^[LMR-]$/.test(letter)||cmNextKick(r,role)===null)return null;
    return cmRecord({...r,[role]:r[role]+letter});
  }
  // Every kick both managers have sent, in order: who shot where, where the keeper went, and whether it went in. A kick only
  // one manager has sent is never shown (his pick stays hidden until the rival's is in).
  function cmKicksOf(record){
    const r=cmRecord(record);if(!r)return null;
    const done=Math.min(r.playerOne.length,r.playerTwo.length),list=[];
    for(let i=0;i<done;i+=1){
      const k=cmKick(i+1),shot=r[k.shooter][i],dive=r[k.keeper][i];
      list.push(Object.freeze({...k,shotSide:shot,dive,goal:cmGoal(shot,dive)}));
    }
    return Object.freeze(list);
  }
  // Goals so far for each manager.
  function cmScore(record){
    const kicks=cmKicksOf(record);if(!kicks)return null;
    const score={playerOne:0,playerTwo:0};
    for(const kick of kicks)if(kick.goal)score[kick.shooter]+=1;
    return Object.freeze(score);
  }
  // The two roulette cylinders once all 14 kicks are in: cylinders[role] is that manager's OWN cylinder, chamber k loaded
  // when the rival's k-th shot went in. null while the shootout is still running (the roulette never spins on a part).
  function cmCylinders(record){
    const kicks=cmKicksOf(record);
    if(!kicks||kicks.length!==KICKS_TOTAL)return null;
    const out={};
    for(const role of ROLES)out[role]=Object.freeze(kicks.filter(kick=>kick.shooter===OTHER[role]).map(kick=>kick.goal));
    return Object.freeze(out);
  }
  const cmBullets=cylinder=>Array.isArray(cylinder)?cylinder.filter(Boolean).length:0;
  // A cylinder as the roulette takes it: exactly 7 booleans.
  function cmValidCylinder(value){return Array.isArray(value)&&value.length===CHAMBERS&&value.every(item=>typeof item==="boolean");}

  return Object.freeze({
    contractVersion:2,feature:"cms-chamber-men",roles:ROLES,rounds:ROUNDS,kicks:KICKS_TOTAL,chambers:CHAMBERS,sides:SIDES,timeout:TIMEOUT,maxSeasons:MAX_SEASONS,
    fromMs:CHAMBER_FROM_MS,eligible:cmEligible,validSeason:cmSeason,validKicks:cmKicks,kick:cmKick,roleOn:cmRole,
    pick:cmPick,dive:cmDive,goal:cmGoal,record:cmRecord,progress:cmProgress,nextKick:cmNextKick,send:cmSend,
    kicksOf:cmKicksOf,score:cmScore,cylinders:cmCylinders,bullets:cmBullets,validCylinder:cmValidCylinder
  });
});
