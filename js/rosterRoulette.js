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
  // Contract v4: launch formation XI + 4 subs; each later season removes the shot player, places kept
  // signings by compatible line and overall, then promotes from the bench into any remaining XI vacancies.
  // The Special Player is excluded and every filled slot keeps the same target chance.
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
  const rrEmpty=p=>rrRow(p.slot,p.pos,"",{number:null,rating:0,positions:Object.freeze([]),special:false,signedSeason:null});
  const rrPlace=(slot,player)=>rrRow(slot.slot,slot.pos,player.name,{number:player.number??null,rating:player.rating,positions:player.positions,special:false,signedSeason:player.signedSeason??null});
  // Prefer an empty bench slot, then the weakest sub. Strict improvement retains incumbents on ties.
  function rrBench(board,player){
    let at=board.findIndex(p=>p.bench&&!p.name);
    if(at<0){
      for(let i=XI_SIZE;i<BOARD_SIZE;i+=1)if(at<0||board[i].rating<board[at].rating)at=i;
      if(!(player.rating>board[at].rating))return false;
    }
    board[at]=rrPlace(board[at],player);
    return true;
  }
  function rrJoin(board,player){
    if(!player.name||board.some(p=>rrKey(p.name)===rrKey(player.name)))return false;
    // Vacancies take precedence, with CAM preferring an AM slot among compatible vacancies.
    let at=-1;
    for(let i=0;i<XI_SIZE;i+=1)if(!board[i].name&&rrFit(player,board[i].pos)>0&&(at<0||rrFit(player,board[i].pos)>rrFit(player,board[at].pos)))at=i;
    if(at<0){
      for(let i=0;i<XI_SIZE;i+=1){
        const current=board[i];
        if(!current.name||!rrFit(player,current.pos)||!(player.rating>current.rating))continue;
        if(at<0||rrFit(player,current.pos)>rrFit(player,board[at].pos)||(rrFit(player,current.pos)===rrFit(player,board[at].pos)&&current.rating<board[at].rating))at=i;
      }
    }
    if(at<0)return rrBench(board,player);
    const replaced=board[at];board[at]=rrPlace(replaced,player);
    if(replaced.name)rrBench(board,replaced);
    return true;
  }
  // Promotion happens after every kept signing has had its chance. Protect the GK line: only keepers fill GK,
  // and keepers never fill an outfield hole. Unknown-position signings remain sub-only.
  function rrFill(board){
    for(let i=0;i<XI_SIZE;i+=1){
      if(board[i].name)continue;
      let at=-1;
      for(let j=XI_SIZE;j<BOARD_SIZE;j+=1){
        const player=board[j];
        if(!player.name||!player.positions.length)continue;
        const keeper=player.positions[0]==="GK";
        if((board[i].pos==="GK")!==keeper)continue;
        const fit=rrFit(player,board[i].pos);
        if(at<0||fit>rrFit(board[at],board[i].pos)||(fit===rrFit(board[at],board[i].pos)&&player.rating>board[at].rating))at=j;
      }
      if(at>=0){board[i]=rrPlace(board[i],board[at]);board[at]=rrEmpty(board[at]);}
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
      const board=args.launch[role].slice(),sp=rrSpecial(special,role);
      // r87 (Nik 2026-10-30): the Special Player is never on the board, so he can never be hit. If he is in the club's
      // launch squad his slot starts empty and the next kept signing fills it.
      if(sp){const same=board.findIndex(p=>rrKey(p.name)===rrKey(sp.name));if(same>=0)board[same]=rrEmpty(board[same]);}
      for(let k=1;k<season;k+=1){
        const turn=rrTurn(args.hex,k,role,board);
        if(turn.fired){const old=board[turn.hitSlot];board[turn.hitSlot]=rrEmpty(old);}
        const kept=rrKept(history&&history[k]&&history[k][role],k,clubs[role]);
        if(!kept)return null;
        for(const player of kept)if(!sp||rrKey(player.name)!==rrKey(sp.name))rrJoin(board,player);
        rrFill(board);
      }
      boards[role]=Object.freeze(board);
      turns[role]=rrTurn(args.hex,season,role,board);
    }
    const order=ROLES.map(role=>{const turn=turns[role],board=boards[role];return Object.freeze({...turn,player:turn.hitSlot!==null?board[turn.hitSlot]:null});});
    return Object.freeze({contractVersion:4,season,chambers:CHAMBERS,order:ROLES,formations,boards:Object.freeze(boards),turns:Object.freeze(order)});
  }

  return Object.freeze({contractVersion:4,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,overallMin:OVERALL_MIN,overallMax:OVERALL_MAX,positions:POSITIONS,roles:ROLES,board:rrBoard,forSeason:rrForSeason});
});
