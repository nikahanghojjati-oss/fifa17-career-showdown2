(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRoulette=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Roster Russian Roulette (Nik 2026-10-28/29): every season, after Career Start and before the transfer window,
  // each manager spins a seven-chamber revolver (six empty, one bullet). Daniel spins first, then Nik. If it fires, the
  // bullet always hits one player on that manager's board (starting XI + 4 subs) and he releases that player in FIFA 17.
  // Like the Marquee Player draw, every result is read from the Showdown's own Firebase id (64 random hex digits, the
  // same on both phones): no read, no write, no Rules change, and a refresh or a second tap can never re-spin.
  // A player hit in an earlier season is gone from that manager's board, so a later bullet picks among the rest.
  // No ratings, scoring, season lengths or limits change.
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]); // turn order: Daniel (Player One) first
  const CHAMBERS=7;
  const BOARD_SIZE=15;
  const MAX_SEASONS=10;

  function rrSquads(){
    const data=root.CareerModeRosterSquads||(typeof module!=="undefined"&&module.exports?require("../data/rosterSquads.js"):null);
    return data&&data.squads?data:null;
  }
  // The board one manager holds: XI first (slots 0-10), then the 4 subs (slots 11-14).
  function rrBoard(club){
    const data=rrSquads(),squad=data&&Object.prototype.hasOwnProperty.call(data.squads,club)?data.squads[club]:null;
    if(!squad)return null;
    const slot=(bench)=>([pos,name,number,rating],i)=>Object.freeze({slot:bench?11+i:i,bench,pos,name,number,rating});
    return Object.freeze([...squad.xi.map(slot(false)),...squad.subs.map(slot(true))]);
  }
  // A 32-bit stream seeded from the id, the season and the role (xmur3 + mulberry32). Synchronous, so the screen
  // can show the result the moment the trigger is pulled; the id itself is the randomness.
  function rrStream(hex,season,role){
    const text=`rrr-v1|${hex}|${season}|${role}`;
    let h=1779033703^text.length;
    for(let i=0;i<text.length;i+=1){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
    let a=(()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;})();
    return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0);};
  }
  // One manager's turn in one season, given the slots already released. The bullet sits in one chamber, the cylinder
  // stops on one chamber; it fires only when they match (exactly 1 in 7). The animation must settle on stopChamber.
  function rrTurn(hex,season,role,released){
    const next=rrStream(hex,season,role);
    const bulletChamber=next()%CHAMBERS,stopChamber=next()%CHAMBERS,fired=bulletChamber===stopChamber;
    const left=[];for(let s=0;s<BOARD_SIZE;s+=1)if(!released.has(s))left.push(s);
    const pick=next();
    return {role,season,bulletChamber,stopChamber,fired,hitSlot:fired&&left.length?left[pick%left.length]:null,boardEmpty:fired&&!left.length};
  }
  // Every turn from season 1 to `season` for both managers. clubs = {playerOne, playerTwo} club names.
  // Returns null for a malformed id, an unknown club or a season outside 1..10 (the screen then shows no roulette).
  function rrSeasons(rivalryId,clubs,season){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(season)||season<1||season>MAX_SEASONS||!clubs)return null;
    const boards={};
    for(const role of ROLES){boards[role]=rrBoard(clubs[role]);if(!boards[role])return null;}
    const released={playerOne:new Set(),playerTwo:new Set()},seasons=[];
    for(let n=1;n<=season;n+=1){
      const turns=ROLES.map(role=>{
        const turn=rrTurn(match[1],n,role,released[role]);
        const player=turn.hitSlot===null?null:boards[role][turn.hitSlot];
        if(player)released[role].add(turn.hitSlot);
        return Object.freeze({...turn,player});
      });
      seasons.push(Object.freeze({season:n,turns:Object.freeze(turns)}));
    }
    return {boards,seasons,released};
  }
  // What the screen shows for one season: both boards (with players released in earlier seasons marked) and the two
  // turns in order.
  function rrForSeason(rivalryId,clubs,season){
    const all=rrSeasons(rivalryId,clubs,season);
    if(!all)return null;
    const current=all.seasons[season-1];
    const before=all.seasons.slice(0,season-1);
    const boards=Object.fromEntries(ROLES.map(role=>{
      const gone=new Set(before.map(s=>s.turns.find(t=>t.role===role).hitSlot).filter(s=>s!==null));
      return [role,Object.freeze(all.boards[role].map(p=>Object.freeze({...p,releasedEarlier:gone.has(p.slot)})))];
    }));
    return Object.freeze({contractVersion:1,season,chambers:CHAMBERS,order:ROLES,boards:Object.freeze(boards),turns:current.turns});
  }

  return Object.freeze({contractVersion:1,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,roles:ROLES,board:rrBoard,forSeason:rrForSeason,history:(id,clubs,season)=>{const all=rrSeasons(id,clubs,season);return all?Object.freeze(all.seasons):null;}});
});
