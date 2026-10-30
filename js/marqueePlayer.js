(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeMarqueePlayer=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 Special Player (Nik 2026-10-27): each manager gets one player from the FIFA 17 top 200, never the same one.
  // The draw is read from the Showdown's own Firebase id (64 random hex digits, the same on both phones), so it costs no
  // read, no write and no Rules change, and nothing is added to any hashed document (Sol round 2 design rule). Only a
  // Showdown confirmed on r86 or later has a Special Player: older Showdowns and saves show none, never an error.
  // The confirm time is the shared Setup's last updatedAt (the Rules pin it to request.time at SHOWDOWN_CONFIRMED).
  // MARQUEE_FROM_MS is the r86 release time (red team #3): the release PR's start, 2026-10-30 03:00 UTC. Showdowns
  // confirmed before it get no Special Player.
  const MARQUEE_FROM_MS=Date.parse("2026-10-30T03:00:00Z");
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  // Ranking badge (Nik): top 3 black-blue-gold, top 10 blue-gold, top 20 gold, top 50 silver, others bronze.
  const TIERS=Object.freeze([[3,"black-blue-gold"],[10,"blue-gold"],[20,"gold"],[50,"silver"],[Infinity,"bronze"]]);

  function mpList(){
    const list=root.CareerModeMarqueePlayers||(typeof module!=="undefined"&&module.exports?require("../data/marqueePlayers.js"):null);
    return list&&Array.isArray(list.players)&&list.players.length>1?list:null;
  }
  function mpTier(rank){return Number.isInteger(rank)&&rank>0?TIERS.find(([top])=>rank<=top)[1]:null;}
  // Two distinct positions from the id. Its first hex digit is the season count (js/persistentNikDanielPair.js), so the
  // draw uses digits 9-16 for Daniel's player and 17-24 to move Nik's along the rest; both are browser randomness.
  function mpPicks(rivalryId,size){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(size)||size<2)return null;
    const a=parseInt(match[1].slice(8,16),16)%size,b=(a+1+parseInt(match[1].slice(16,24),16)%(size-1))%size;
    return {playerOne:a,playerTwo:b};
  }
  function mpPlayer(row,listVersion){
    return Object.freeze({listVersion,rank:row.rank,name:row.name,club:row.club??null,overall:row.overall,potential:row.potential,number:Number.isInteger(row.number)?row.number:null,
      nation:row.nation??null,nationCode:row.nationCode??null,position:row.position??null,stats:row.stats?Object.freeze({...row.stats}):null,tier:mpTier(row.rank)});
  }
  function mpMillis(at){
    if(Number.isFinite(at))return at;
    if(at&&typeof at.toMillis==="function"){const value=at.toMillis();return Number.isFinite(value)?value:null;}
    if(at instanceof Date){const value=at.getTime();return Number.isFinite(value)?value:null;}
    return null;
  }
  // {playerOne, playerTwo} for a Showdown confirmed at confirmedAt (millis, Timestamp or Date), or null (none).
  // fromMs is for tests and galleries only.
  function mpForShowdown(rivalryId,confirmedAt,{fromMs=MARQUEE_FROM_MS}={}){
    const at=mpMillis(confirmedAt),list=mpList();
    if(at===null||at<fromMs||!list)return null;
    const picks=mpPicks(rivalryId,list.players.length);
    if(!picks)return null;
    return Object.freeze(Object.fromEntries(ROLES.map(role=>[role,mpPlayer(list.players[picks[role]],list.listVersion)])));
  }
  // The same pair for a Showdown being set up on this build right now (the reveal): no confirm time yet.
  function mpForNewShowdown(rivalryId){return mpForShowdown(rivalryId,Number.MAX_SAFE_INTEGER,{fromMs:0});}

  return Object.freeze({contractVersion:1,feature:"cms-marquee-player",fromMs:MARQUEE_FROM_MS,roles:ROLES,tier:mpTier,picks:mpPicks,forShowdown:mpForShowdown,forNewShowdown:mpForNewShowdown});
});
