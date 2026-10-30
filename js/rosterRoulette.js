(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRoulette=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Roster Russian Roulette (Nik 2026-10-28/29/30): every season, after Career Start and before the transfer window,
  // each manager spins a seven-chamber revolver (six empty, one bullet). Daniel spins first, then Nik. It fires exactly
  // when the cylinder stops on the bullet (1 in 7), and a fired shot always hits one player on that manager's board
  // (starting XI + 4 subs); he releases that player in FIFA 17. Like the Special Player draw, every result is read from
  // the Showdown's own Firebase id (64 random hex digits, the same on both phones): no read, no Rules lookup, and a refresh
  // or a second tap can never re-spin.
  // The board builds itself (Nik 2026-10-30, "Auto: replace the lowest overall"). Season 1: the FIFA 17 launch board.
  // The Special Player is never on the board (Nik 2026-10-30 16:53 UTC), so he can never be hit. From season 2: last
  // season's board minus the player shot last season, then last season's kept Transfer War signings, best overall
  // first: each fills the empty slot if there is one, otherwise replaces the lowest overall on the board when it is
  // strictly better. Every player on the board has the same chance.
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]); // turn order: Daniel (Player One) first
  const CHAMBERS=7;
  const XI_SIZE=11;
  const BOARD_SIZE=15;
  const MAX_SEASONS=10;
  const OVERALL_MIN=30,OVERALL_MAX=99;
  const POSITIONS=Object.freeze(["GK","SW","RWB","RB","RCB","CB","LCB","LB","LWB","RDM","CDM","LDM","RM","RCM","CM","LCM","LM","RAM","CAM","LAM","RF","CF","LF","RW","RS","ST","LS","LW","SUB"]);

  function rrSquads(){
    const data=root.CareerModeRosterSquads||(typeof module!=="undefined"&&module.exports?require("../data/rosterSquads.js"):null);
    return data&&data.squads?data:null;
  }
  const rrRow=(slot,pos,name,extra)=>Object.freeze({slot,bench:slot>=XI_SIZE,pos,name,...extra});
  // The launch board as the club's FIFA 17 squad lists it: XI first (slots 0-10), then the 4 subs (slots 11-14).
  function rrBoard(club){
    const data=rrSquads(),squad=data&&Object.prototype.hasOwnProperty.call(data.squads,club)?data.squads[club]:null;
    if(!squad)return null;
    return Object.freeze([...squad.xi,...squad.subs].map(([pos,name,number,rating],i)=>rrRow(i,i<XI_SIZE?pos:"SUB",name,{number,rating,special:false,signedSeason:null})));
  }
  const rrOverall=value=>Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;
  const rrKey=name=>String(name||"").trim().toLowerCase();
  // A 32-bit stream seeded from the id, the season and the role (xmur3 + mulberry32). Synchronous, so the screen
  // can show the result the moment the trigger is pulled; the id itself is the randomness.
  function rrStream(hex,season,role){
    const text=`rrr-v1|${hex}|${season}|${role}`;
    let h=1779033703^text.length;
    for(let i=0;i<text.length;i+=1){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
    let a=(()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;})();
    return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0);};
  }
  // Who can be hit: every filled slot except the Special Player, each with the same chance.
  const rrTargets=board=>board.filter(p=>p.name&&!p.special).map(p=>p.slot);
  // One manager's turn in one season. The bullet sits in one chamber, the cylinder stops on one chamber; it fires only
  // when they match (exactly 1 in 7). The animation must settle on stopChamber. A fired turn hits one target slot.
  function rrTurn(hex,season,role,board){
    const next=rrStream(hex,season,role);
    const bulletChamber=next()%CHAMBERS,stopChamber=next()%CHAMBERS,pick=next(),targets=rrTargets(board);
    const fired=bulletChamber===stopChamber&&targets.length>0;
    return {role,season,bulletChamber,stopChamber,fired,hitSlot:fired?targets[pick%targets.length]:null};
  }
  // The weakest player a better newcomer replaces: lowest overall, never the Special Player; on equal overalls the last
  // one on the board (subs before the XI).
  function rrWeakest(board){
    let at=-1;
    board.forEach((p,i)=>{if(!p.name||p.special)return;if(at<0||p.rating<=board[at].rating)at=i;});
    return at;
  }
  // A newcomer joins: into the empty slot if there is one, otherwise over the weakest player when strictly better.
  // The Special Player always joins (over the weakest, whatever his overall). The slot keeps its position on the board.
  // A player already on the board never joins twice.
  function rrJoin(board,player){
    if(!player.name||board.some(p=>rrKey(p.name)===rrKey(player.name)))return false;
    let at=board.findIndex(p=>!p.name);
    if(at<0){at=rrWeakest(board);if(at<0||(player.special!==true&&!(player.rating>board[at].rating)))return false;}
    const old=board[at];
    board[at]=rrRow(old.slot,old.pos,player.name,{number:null,rating:player.rating,special:player.special===true,signedSeason:player.signedSeason??null});
    return true;
  }
  // special = {playerOne:{name, overall}, playerTwo:{...}} from the Special Player draw, or null for an older Showdown.
  function rrSpecial(special,role){
    const p=special&&special[role];
    return p&&typeof p.name==="string"&&p.name.trim()&&rrOverall(p.overall)?{name:p.name.trim(),rating:p.overall}:null;
  }
  // Kept signings of one season for one manager: Transfer War verdict rows with a valid overall that were not released
  // by the rival's guess, best overall first (equal overalls by signing slot).
  function rrKept(rows,season){
    if(!Array.isArray(rows))return null;
    return rows.filter(r=>r&&r.release===false&&typeof r.name==="string"&&r.name.trim()&&rrOverall(r.overall))
      .map(r=>({slot:Number(r.slot)||0,name:r.name.trim(),rating:r.overall,signedSeason:season}))
      .sort((a,b)=>b.rating-a.rating||a.slot-b.slot);
  }
  function rrArgs(rivalryId,clubs,season){
    const match=RIVALRY_ID.exec(String(rivalryId||""));
    if(!match||!Number.isInteger(season)||season<1||season>MAX_SEASONS||!clubs)return null;
    const launch={};
    for(const role of ROLES){launch[role]=rrBoard(clubs[role]);if(!launch[role])return null;}
    return {hex:match[1],launch};
  }
  // What the screen shows for one season. clubs = {playerOne, playerTwo} club names; options.special = the Special
  // Players; options.history[k] = {playerOne:[verdict rows], playerTwo:[verdict rows]} for every season k before this
  // one (index 1..season-1). Returns null for a malformed id, an unknown club, a season outside 1..10 or a missing season
  // of history (the screen then shows no roulette).
  function rrForSeason(rivalryId,clubs,season,options){
    const args=rrArgs(rivalryId,clubs,season);
    if(!args)return null;
    const history=options&&options.history,special=options&&options.special;
    const boards={},turns={};
    for(const role of ROLES){
      const board=args.launch[role].slice(),sp=rrSpecial(special,role);
      // r87 (Nik 2026-10-30): the Special Player is never on the board, so he can never be hit. If he is in the club's
      // launch squad his slot starts empty and the next kept signing fills it.
      if(sp){const same=board.findIndex(p=>rrKey(p.name)===rrKey(sp.name));if(same>=0)board[same]=rrRow(board[same].slot,board[same].pos,"",{number:null,rating:0,special:false,signedSeason:null});}
      for(let k=1;k<season;k+=1){
        const turn=rrTurn(args.hex,k,role,board);
        if(turn.fired){const old=board[turn.hitSlot];board[turn.hitSlot]=rrRow(old.slot,old.pos,"",{number:null,rating:0,special:false,signedSeason:null});}
        const kept=rrKept(history&&history[k]&&history[k][role],k);
        if(!kept)return null;
        for(const player of kept)if(!sp||rrKey(player.name)!==rrKey(sp.name))rrJoin(board,player);
      }
      boards[role]=Object.freeze(board);
      turns[role]=rrTurn(args.hex,season,role,board);
    }
    const order=ROLES.map(role=>{const turn=turns[role],board=boards[role];return Object.freeze({...turn,player:turn.hitSlot!==null?board[turn.hitSlot]:null});});
    return Object.freeze({contractVersion:3,season,chambers:CHAMBERS,order:ROLES,boards:Object.freeze(boards),turns:Object.freeze(order)});
  }

  return Object.freeze({contractVersion:3,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,overallMin:OVERALL_MIN,overallMax:OVERALL_MAX,positions:POSITIONS,roles:ROLES,board:rrBoard,forSeason:rrForSeason});
});
