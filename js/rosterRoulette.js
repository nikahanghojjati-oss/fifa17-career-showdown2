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
  // same on both phones): no read, no Rules lookup, and a refresh or a second tap can never re-spin.
  // Season 1 uses the FIFA 17 launch squad. From season 2 each manager first edits his board to match his real squad
  // (Nik 2026-10-29: "Edit board before each spin"), so a player released earlier is already gone and every one of the
  // 15 slots can be hit. The draw only picks a slot; the board decides the name. No ratings, scoring, season lengths or
  // limits change.
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]); // turn order: Daniel (Player One) first
  const CHAMBERS=7;
  const XI_SIZE=11;
  const BOARD_SIZE=15;
  const MAX_SEASONS=10;
  const NAME_MAX=40;
  const POSITIONS=Object.freeze(["GK","SW","RWB","RB","RCB","CB","LCB","LB","LWB","RDM","CDM","LDM","RM","RCM","CM","LCM","LM","RAM","CAM","LAM","RF","CF","LF","RW","RS","ST","LS","LW","SUB"]);

  function rrSquads(){
    const data=root.CareerModeRosterSquads||(typeof module!=="undefined"&&module.exports?require("../data/rosterSquads.js"):null);
    return data&&data.squads?data:null;
  }
  const rrRow=(slot,pos,name,extra)=>Object.freeze({slot,bench:slot>=XI_SIZE,pos,name,...extra});
  // The launch board one manager holds in season 1: XI first (slots 0-10), then the 4 subs (slots 11-14).
  function rrBoard(club){
    const data=rrSquads(),squad=data&&Object.prototype.hasOwnProperty.call(data.squads,club)?data.squads[club]:null;
    if(!squad)return null;
    return Object.freeze([...squad.xi,...squad.subs].map(([pos,name,number,rating],i)=>rrRow(i,i<XI_SIZE?pos:"SUB",name,{number,rating})));
  }
  // An edited board: 15 rows of {pos,name}, slots 0-10 the XI with exactly one GK, slots 11-14 the subs (pos "SUB"),
  // names 1-40 characters with no outer spaces and no player twice. Returns a frozen board or null.
  function rrNormalizeBoard(rows){
    if(!Array.isArray(rows)||rows.length!==BOARD_SIZE)return null;
    const out=[],seen=new Set();let keepers=0;
    for(let i=0;i<BOARD_SIZE;i+=1){
      const row=rows[i],pos=row&&row.pos,name=row&&row.name;
      if(typeof pos!=="string"||typeof name!=="string")return null;
      if(i<XI_SIZE?(pos==="SUB"||!POSITIONS.includes(pos)):pos!=="SUB")return null;
      if(!name.length||name.length>NAME_MAX||name.trim()!==name)return null;
      const key=name.toLowerCase();if(seen.has(key))return null;seen.add(key);
      if(pos==="GK")keepers+=1;
      out.push(rrRow(i,pos,name,{}));
    }
    return keepers===1?Object.freeze(out):null;
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
  // One manager's turn in one season. The bullet sits in one chamber, the cylinder stops on one chamber; it fires only
  // when they match (exactly 1 in 7). The animation must settle on stopChamber. A fired turn hits one of the 15 slots.
  function rrTurn(hex,season,role){
    const next=rrStream(hex,season,role);
    const bulletChamber=next()%CHAMBERS,stopChamber=next()%CHAMBERS,fired=bulletChamber===stopChamber;
    const pick=next();
    return {role,season,bulletChamber,stopChamber,fired,hitSlot:fired?pick%BOARD_SIZE:null};
  }
  function rrArgs(rivalryId,clubs,season){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(season)||season<1||season>MAX_SEASONS||!clubs)return null;
    const launch={};
    for(const role of ROLES){launch[role]=rrBoard(clubs[role]);if(!launch[role])return null;}
    return {hex:match[1],launch};
  }
  // What the screen shows for one season. clubs = {playerOne, playerTwo} club names; edited = {playerOne, playerTwo}
  // boards saved for this season (ignored in season 1). A board not saved yet is null and so is the name its turn hits,
  // but the chambers and the slot are already fixed. Returns null for a malformed id, an unknown club or a season
  // outside 1..10 (the screen then shows no roulette).
  function rrForSeason(rivalryId,clubs,season,edited){
    const args=rrArgs(rivalryId,clubs,season);
    if(!args)return null;
    const boards={};
    for(const role of ROLES)boards[role]=season===1?args.launch[role]:rrNormalizeBoard(edited&&edited[role]);
    const turns=ROLES.map(role=>{
      const turn=rrTurn(args.hex,season,role),board=boards[role];
      return Object.freeze({...turn,player:turn.hitSlot!==null&&board?board[turn.hitSlot]:null});
    });
    return Object.freeze({contractVersion:2,season,chambers:CHAMBERS,order:ROLES,boards:Object.freeze(boards),turns:Object.freeze(turns)});
  }
  // The board a manager starts editing before season `season` (2..10): last season's board (the launch board before
  // season 2) with the player shot last season taken off, his slot left empty to fill. Positions stay as they were.
  function rrDraft(rivalryId,clubs,season,role,previousBoard){
    const args=rrArgs(rivalryId,clubs,season);
    if(!args||season<2||!ROLES.includes(role))return null;
    const before=season===2?args.launch[role]:rrNormalizeBoard(previousBoard);
    if(!before)return null;
    const last=rrTurn(args.hex,season-1,role);
    return Object.freeze(before.map(p=>Object.freeze({slot:p.slot,pos:p.pos,name:p.slot===last.hitSlot?"":p.name,shotLastSeason:p.slot===last.hitSlot})));
  }

  return Object.freeze({contractVersion:2,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,nameMax:NAME_MAX,positions:POSITIONS,roles:ROLES,board:rrBoard,normalizeBoard:rrNormalizeBoard,draft:rrDraft,forSeason:rrForSeason});
});
