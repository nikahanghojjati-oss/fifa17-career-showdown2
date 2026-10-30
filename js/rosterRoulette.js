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
  // Contract v4: always a full formation XI + 4 subs, with hidden local reserves. Shots permanently
  // remove a player; kept signings, the bench and reserves replace him before the next board is returned.
  // The Special Player is excluded and all 15 slots keep the same target chance.
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
  function rrPlayers(){
    return root.CareerModeFifa17Players||(typeof module!=="undefined"&&module.exports?require("../data/fifa17Players.js"):null);
  }
  const rrRow=(slot,pos,name,extra)=>Object.freeze({slot,bench:slot>=XI_SIZE,pos,name,...extra});
  // The launch board as the club's FIFA 17 squad lists it: XI first (slots 0-10), then the 4 subs (slots 11-14).
  function rrBoard(club){
    const data=rrSquads(),squad=data&&Object.prototype.hasOwnProperty.call(data.squads,club)?data.squads[club]:null;
    if(!squad||!rrPlayers())return null;
    return Object.freeze([...squad.xi,...squad.subs].map(([pos,name,number,rating],i)=>rrRow(i,i<XI_SIZE?pos:"SUB",name,{number,rating,positions:rrPlayerPositions(name,club),special:false,signedSeason:null})));
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
  // Player positions travel with the player; pos remains the formation slot even after a substitution.
  // Name ambiguity: prefer the manager's launch club, then catalog/source order. Preserve the source's short_name.
  const byName=new Map();
  let indexed=false;
  function rrPlayerPositions(name,club){
    const database=rrPlayers();
    if(!indexed&&database){
      for(const [sourceClub,data] of Object.entries(database.clubs))for(const row of data.players){
        const key=rrKey(row[0]),matches=byName.get(key)||[];
        matches.push({club:sourceClub,positions:row[2]});byName.set(key,matches);
      }
      indexed=true;
    }
    const matches=byName.get(rrKey(name));
    return matches?(matches.find(p=>p.club===club)||matches[0]).positions:Object.freeze([]);
  }
  const SIGNING_POSITIONS=new Set(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  function rrLine(pos){
    if(pos==="GK")return "GK";
    if(["CB","LCB","RCB","SW"].includes(pos))return "CB";
    if(["RB","RWB"].includes(pos))return "RB";
    if(["LB","LWB"].includes(pos))return "LB";
    if(["CDM","RDM","LDM","CM","RCM","LCM","CAM","RAM","LAM"].includes(pos))return "CM";
    if(["RM","RW"].includes(pos))return "RW";
    if(["LM","LW"].includes(pos))return "LW";
    if(["ST","CF","RS","LS","RF","LF"].includes(pos))return "ST";
    return null;
  }
  // 2 = preferred attacking-midfield slot, 1 = compatible line, 0 = incompatible or sub-only.
  function rrFit(player,pos){
    const line=rrLine(pos);
    if(!line)return 0;
    let fit=0;
    for(const position of player.positions){
      if(rrLine(position)!==line)continue;
      fit=Math.max(fit,position==="CAM"&&["CAM","RAM","LAM"].includes(pos)?2:1);
    }
    return fit;
  }
  const rrPlace=(slot,player)=>rrRow(slot.slot,slot.pos,player.name,{number:player.number??null,rating:player.rating,positions:player.positions,special:false,signedSeason:player.signedSeason??null});
  const rrRank=(a,b)=>b.rating-a.rating||(a.number??100)-(b.number??100);
  const rrDatabasePlayer=p=>({name:p[0],rating:p[1],positions:p[2],number:p[4],signedSeason:null});
  const rrOnBoard=(state,name)=>state.board.some(p=>rrKey(p.name)===rrKey(name));
  function rrReserve(state,player){
    const key=rrKey(player.name);
    if(state.excluded.has(key)||rrOnBoard(state,key)||state.reserves.some(p=>rrKey(p.name)===key))return;
    state.reserves.push(player);
  }
  // Database replacements use bundled data only. Never resurrect a shot player or the Special Player,
  // and never select the second source row of an already-used short name (e.g. Manu García).
  function rrNextReserve(state,predicate=()=>true){
    const eligible=p=>
      predicate(p)&&!state.excluded.has(rrKey(p.name))&&!rrOnBoard(state,p.name)&&!state.reserves.some(r=>rrKey(r.name)===rrKey(p.name));
    const next=rrPlayers().clubs[state.club].players.map(rrDatabasePlayer).sort(rrRank).find(eligible);
    if(next)state.reserves.push(next);
    return next;
  }
  function rrTakeReserve(state,predicate=()=>true){
    if(!state.reserves.some(predicate))rrNextReserve(state,predicate);
    let at=-1;
    for(let i=0;i<state.reserves.length;i+=1)if(predicate(state.reserves[i])&&(at<0||rrRank(state.reserves[i],state.reserves[at])<0))at=i;
    if(at<0){
      // Nik: replacements stay club-only even when the finite pool is exhausted.
      // Report the exhaustion rather than returning an empty row or reviving a loss.
      const error=new Error('Club roster exhausted: '+state.club);
      error.code='ROSTER_EXHAUSTED';error.club=state.club;throw error;
    }
    const [player]=state.reserves.splice(at,1);
    return player;
  }
  // Strict improvements retain incumbents on ties. A displaced player stays in the local squad.
  function rrBench(state,player){
    const board=state.board;
    let at=XI_SIZE;
    for(let i=XI_SIZE+1;i<BOARD_SIZE;i+=1)if(board[i].rating<board[at].rating)at=i;
    if(!(player.rating>board[at].rating)){rrReserve(state,player);return false;}
    const replaced=board[at];board[at]=rrPlace(replaced,player);rrReserve(state,replaced);
    return true;
  }
  function rrJoin(state,player){
    if(state.excluded.has(rrKey(player.name))||rrOnBoard(state,player.name))return false;
    state.reserves=state.reserves.filter(p=>rrKey(p.name)!==rrKey(player.name));
    let at=-1;
    for(let i=0;i<XI_SIZE;i+=1){
      const current=state.board[i];
      if(!rrFit(player,current.pos)||!(player.rating>current.rating))continue;
      if(at<0||rrFit(player,current.pos)>rrFit(player,state.board[at].pos)||(rrFit(player,current.pos)===rrFit(player,state.board[at].pos)&&current.rating<state.board[at].rating))at=i;
    }
    if(at<0)return rrBench(state,player);
    const replaced=state.board[at];state.board[at]=rrPlace(replaced,player);
    rrBench(state,replaced);
    return true;
  }
  // Replace directly: no intermediate empty row is ever written to a board. Kept signings get
  // first refusal, even below the lost player's rating. Otherwise promote the best same-line
  // sub, then the best outfield overall, and immediately refill the bench from hidden reserves.
  function rrReplace(state,at,kept){
    const slot=state.board[at];
    const candidates=[...kept,...state.reserves.filter(p=>p.signedSeason!==null)].filter(p=>
      !state.excluded.has(rrKey(p.name))&&!rrOnBoard(state,p.name)&&(slot.bench||rrFit(p,slot.pos)>0));
    candidates.sort((a,b)=>b.rating-a.rating||(a.slot??0)-(b.slot??0));
    if(candidates.length){
      const player=candidates[0];state.board[at]=rrPlace(slot,player);
      state.reserves=state.reserves.filter(p=>rrKey(p.name)!==rrKey(player.name));
      return;
    }
    if(slot.bench){state.board[at]=rrPlace(slot,rrTakeReserve(state));return;}
    const keeper=slot.pos==='GK';
    let bench=-1;
    for(let i=XI_SIZE;i<BOARD_SIZE;i+=1){
      const player=state.board[i];
      if(!player.positions.length||(player.positions[0]==='GK')!==keeper)continue;
      if(bench<0||rrFit(player,slot.pos)>rrFit(state.board[bench],slot.pos)||(rrFit(player,slot.pos)===rrFit(state.board[bench],slot.pos)&&rrRank(player,state.board[bench])<0))bench=i;
    }
    if(bench>=0){
      const player=state.board[bench],replacement=rrTakeReserve(state);
      state.board[at]=rrPlace(slot,player);state.board[bench]=rrPlace(state.board[bench],replacement);
    }else{
      // A club need not carry a keeper among its four subs. Its next database keeper
      // fills GK directly; unknown-position signings remain bench-only.
      state.board[at]=rrPlace(slot,rrTakeReserve(state,p=>(p.positions[0]==='GK')===keeper));
    }
  }
  // special = {playerOne:{name, overall}, playerTwo:{...}} from the Special Player draw, or null for an older Showdown.
  function rrSpecial(special,role){
    const p=special&&special[role];
    return p&&typeof p.name==="string"&&p.name.trim()&&rrOverall(p.overall)?{name:p.name.trim(),rating:p.overall}:null;
  }
  // Kept signings of one season for one manager: Transfer War verdict rows with a valid overall that were not released
  // by the rival's guess, best overall first (equal overalls by signing slot).
  function rrKept(rows,season,club){
    if(!Array.isArray(rows))return null;
    return rows.filter(r=>r&&r.release===false&&typeof r.name==="string"&&r.name.trim()&&rrOverall(r.overall))
      .map(r=>({slot:Number(r.slot)||0,name:r.name.trim(),rating:r.overall,positions:Object.freeze(SIGNING_POSITIONS.has(r.position)?[r.position]:rrPlayerPositions(r.name.trim(),club).slice(0,1)),signedSeason:season}))
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
    const formations=Object.freeze(Object.fromEntries(ROLES.map(role=>[role,rrPlayers().clubs[clubs[role]].formation])));
    for(const role of ROLES){
      const sp=rrSpecial(special,role),state={club:clubs[role],board:args.launch[role].slice(),reserves:[],excluded:new Set(sp?[rrKey(sp.name)]:[])};
      for(const [,name,number,rating] of rrSquads().squads[state.club].reserves)
        rrReserve(state,{name,number,rating,positions:rrPlayerPositions(name,state.club),signedSeason:null});
      if(sp){
        const same=state.board.findIndex(p=>rrKey(p.name)===rrKey(sp.name));
        if(same>=0)rrReplace(state,same,[]);
        while(state.reserves.length<3&&rrNextReserve(state)){} // skip him in the hidden three too
      }
      for(let k=1;k<season;k+=1){
        const kept=rrKept(history&&history[k]&&history[k][role],k,state.club);
        if(!kept)return null;
        // A guessed signing must not sneak in later through the club database refill.
        for(const row of history[k][role])if(row&&row.release===true&&typeof row.name==='string')state.excluded.add(rrKey(row.name));
        state.reserves=state.reserves.filter(p=>!state.excluded.has(rrKey(p.name)));
        const turn=rrTurn(args.hex,k,role,state.board);
        if(turn.fired){
          state.excluded.add(rrKey(state.board[turn.hitSlot].name));
          rrReplace(state,turn.hitSlot,kept);
        }
        for(const player of kept)rrJoin(state,player);
      }
      const board=state.board;
      boards[role]=Object.freeze(board);
      turns[role]=rrTurn(args.hex,season,role,board);
    }
    const order=ROLES.map(role=>{const turn=turns[role],board=boards[role];return Object.freeze({...turn,player:turn.hitSlot!==null?board[turn.hitSlot]:null});});
    return Object.freeze({contractVersion:4,season,chambers:CHAMBERS,order:ROLES,formations,boards:Object.freeze(boards),turns:Object.freeze(order)});
  }

  return Object.freeze({contractVersion:4,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,overallMin:OVERALL_MIN,overallMax:OVERALL_MAX,positions:POSITIONS,roles:ROLES,board:rrBoard,forSeason:rrForSeason});
});
