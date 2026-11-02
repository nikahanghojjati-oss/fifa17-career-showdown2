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
  // GC-04 (Nik 2026-11-01): from 2.0.0 a manager's Special Player never plays for that manager's own club (he would be a
  // "free extra signing" of a player the manager already owns). The draw skips forward from the same id-derived positions
  // to the next player not at his club, so it stays read-free and the same on both phones. Showdowns confirmed before
  // OWN_CLUB_FROM_MS keep the r86 draw exactly. It is a placeholder at the planned 2.0.0 go-live that tools/set-release-time.cjs
  // pins to the exact release time with RRR_FROM_MS (tests/contracts/r87-sp-own-club-contracts.cjs: never before the Roster
  // Roulette boundary). From it the draw needs both managers' clubs: a caller without them gets no Special Player rather
  // than a wrong one.
  const OWN_CLUB_FROM_MS=Date.parse("2026-11-02T05:00:00Z");
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
  // clubs = {playerOne, playerTwo} (or {daniel, nik}) club names: when given, each pick moves forward through the list to
  // the next player who is not at that manager's club (and, for Nik, not Daniel's pick). Without clubs: the r86 draw.
  // The list's FIFA 17 club names for catalog clubs drawn under another name: the same table as js/commentaryEngine.js
  // CLUB_ALIASES and js/visualIdentity.js CLUB_IDENTITY_ALIASES (tests/contracts/r87-sp-own-club-contracts.cjs keeps them equal).
  const CLUB_ALIASES=Object.freeze({"FC Barcelona":"Barcelona","FC Bayern München":"Bayern Munich","Bayer 04 Leverkusen":"Bayer Leverkusen","Olympique Lyonnais":"Lyon","Hamburger SV":"Hamburg","Athletic Club de Bilbao":"Athletic Club","Inter":"Inter Milan","AS Monaco":"Monaco","UD Las Palmas":"Las Palmas","FC Schalke 04":"Schalke 04","VfL Wolfsburg":"Wolfsburg","Villarreal CF":"Villarreal","TSG 1899 Hoffenheim":"Hoffenheim","Valencia CF":"Valencia","OGC Nice":"Nice","Sevilla FC":"Sevilla","Málaga CF":"Málaga","SD Eibar":"Eibar","RC Celta":"Celta Vigo","Toulouse Football Club":"Toulouse","Granada CF":"Granada","AS Saint-Étienne":"Saint-Étienne","Stade Rennais FC":"Rennes"});
  const mpCatalogClub=name=>typeof name==="string"&&name?(Object.prototype.hasOwnProperty.call(CLUB_ALIASES,name)?CLUB_ALIASES[name]:name):null;
  function mpClubs(clubs){
    if(!clubs||typeof clubs!=="object")return null;
    const one=clubs.playerOne??clubs.daniel,two=clubs.playerTwo??clubs.nik;
    return typeof one==="string"&&one&&typeof two==="string"&&two?{playerOne:one,playerTwo:two}:null;
  }
  function mpPicks(rivalryId,size,clubs){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(size)||size<2)return null;
    let a=parseInt(match[1].slice(8,16),16)%size,b=(a+1+parseInt(match[1].slice(16,24),16)%(size-1))%size;
    const own=mpClubs(clubs),list=own?mpList():null;
    if(own){
      if(!list||list.players.length!==size)return null;
      const clubOf=i=>mpCatalogClub(list.players[i].club);
      let n=0;while(clubOf(a)===own.playerOne&&n<size){a=(a+1)%size;n+=1;}
      n=0;while((b===a||clubOf(b)===own.playerTwo)&&n<size){b=(b+1)%size;n+=1;}
      if(clubOf(a)===own.playerOne||b===a||clubOf(b)===own.playerTwo)return null;
    }
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
  // clubs: both managers' clubs (needed from OWN_CLUB_FROM_MS, GC-04). ownClubFromMs is for tests and galleries only.
  function mpUsesClubs(at,ownClubFromMs){return at!==null&&at>=ownClubFromMs;}
  function mpForShowdown(rivalryId,confirmedAt,{fromMs=MARQUEE_FROM_MS,clubs=null,ownClubFromMs=OWN_CLUB_FROM_MS}={}){
    const at=mpMillis(confirmedAt),list=mpList();
    if(at===null||at<fromMs||!list)return null;
    const useClubs=mpUsesClubs(at,ownClubFromMs);
    if(useClubs&&!mpClubs(clubs))return null;
    const picks=mpPicks(rivalryId,list.players.length,useClubs?clubs:null);
    if(!picks)return null;
    return Object.freeze(Object.fromEntries(ROLES.map(role=>[role,mpPlayer(list.players[picks[role]],list.listVersion)])));
  }
  // The same pair for a Showdown being set up on this build right now (the reveal): no confirm time yet.
  function mpForNewShowdown(rivalryId,clubs){return mpForShowdown(rivalryId,Number.MAX_SAFE_INTEGER,{fromMs:0,clubs});}
  // The list positions of the pair (the reveal animates the list): the same choice as mpForShowdown.
  function mpPicksForShowdown(rivalryId,confirmedAt,clubs){
    const at=mpMillis(confirmedAt),list=mpList();
    if(!list||!mpForShowdown(rivalryId,confirmedAt,{clubs}))return null;
    return mpPicks(rivalryId,list.players.length,mpUsesClubs(at,OWN_CLUB_FROM_MS)?clubs:null);
  }
  // Red team R87-SP-02: is a typed Transfer War signing name this manager's own Special Player? Names compare with accents
  // folded, trimmed and lower-cased, against the display name and the squad database name (data/marqueePlayers.js
  // sourceNames, R87-D-01). No initials guessing. False when the Showdown has no Special Player.
  const mpFold=name=>String(name||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();
  function mpIsOwnSpecial(rivalryId,confirmedAt,role,name,clubs){
    const pair=ROLES.includes(role)&&mpFold(name)?mpForShowdown(rivalryId,confirmedAt,{clubs}):null;
    if(!pair)return false;
    const list=mpList(),player=pair[role],source=list&&list.sourceNames&&Object.prototype.hasOwnProperty.call(list.sourceNames,player.name)?list.sourceNames[player.name]:null;
    return [player.name,source].some(n=>n&&mpFold(n)===mpFold(name));
  }

  return Object.freeze({contractVersion:1,feature:"cms-marquee-player",fromMs:MARQUEE_FROM_MS,ownClubFromMs:OWN_CLUB_FROM_MS,roles:ROLES,tier:mpTier,picks:mpPicks,picksForShowdown:mpPicksForShowdown,clubAliases:CLUB_ALIASES,forShowdown:mpForShowdown,forNewShowdown:mpForNewShowdown,isOwnSpecial:mpIsOwnSpecial});
});
