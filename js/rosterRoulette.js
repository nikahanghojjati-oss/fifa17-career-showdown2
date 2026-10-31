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
  // Both managers' Special Players are excluded from both boards and both reserve pools (red team R87-C-01), and all 15
  // slots keep the same target chance.
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]); // turn order: Daniel (Player One) first
  const CHAMBERS=7;
  const XI_SIZE=11;
  const BOARD_SIZE=15;
  const MAX_SEASONS=10;
  const OVERALL_MIN=30,OVERALL_MAX=99;
  // F2-02 (Fable job 2): the engine revision. Bump it whenever a board or a shot can come out differently for the same
  // Showdown, season and history (tests/contracts/r87-roulette-hits-contracts.cjs pins it to this file's text). It is part of
  // the version string each manager's spin mark carries (rrVersion), so two phones on different builds are told so.
  const ENGINE_REVISION=1;
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
    return Object.freeze([...squad.xi,...squad.subs].map(([pos,name,number,rating],i)=>rrRow(i,i<XI_SIZE?pos:"SUB",name,{number,rating,positions:rrPlayerPositions(name,club,number),special:false,signedSeason:null})));
  }
  const rrOverall=value=>Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;
  // Identity (red team R87-C-05, Sol SQ-4-01): names compare with accents folded, trimmed and lower-cased ("M. Ozil" =
  // "M. Özil"; no initials guessing). There are two kinds of people and they never match each other:
  // - a club player (a database row of the manager's own club, signedSeason null) is one person by (name, shirt number),
  //   so Alavés' two Manu García rows stay two people;
  // - a Transfer War signing (signedSeason set, no shirt number) is one person by name among that manager's signings.
  // A manager never buys his own player, so a signing who shares a name with a club player is a namesake from another
  // club (WBA's J. Ward is not Palace's J. Ward). Guessing, shooting or re-entering a signing never touches a club player.
  const rrKeys=new Map();
  function rrKey(name){
    const text=String(name||"");let key=rrKeys.get(text);
    if(key===undefined){key=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();if(rrKeys.size<20000)rrKeys.set(text,key);}
    return key;
  }
  const rrNumber=p=>Number.isInteger(p&&p.number)?p.number:null;
  const rrSigning=p=>Boolean(p)&&p.signedSeason!==null&&p.signedSeason!==undefined;
  // One identity string per person: "s|name" for a signing, "c|name#shirt" for a club player.
  const rrId=p=>rrSigning(p)?`s|${rrKey(p.name)}`:`c|${rrKey(p.name)}#${rrNumber(p)}`;
  const rrSame=(a,b)=>rrId(a)===rrId(b);
  // Plain code-point order: identical on every phone (localeCompare depends on the browser's ICU data).
  const rrCmp=(a,b)=>a<b?-1:a>b?1:0;
  // Equal overalls rank by a stable identity, never by the Transfer War entry slot (red team R87-C-04).
  const rrOrder=(a,b)=>b.rating-a.rating||rrCmp(rrKey(a.name),rrKey(b.name))||rrCmp(a.positions[0]||"",b.positions[0]||"")||rrCmp(a.name,b.name);
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
  // aimSlot is where the barrel points when it stops (red team R87-C-06): the hit slot, or for a safe turn the same
  // third draw on the same target list, so both phones aim at the same player with no extra randomness.
  function rrTurn(hex,season,role,board){
    const next=rrStream(hex,season,role);
    const bulletChamber=next()%CHAMBERS,stopChamber=next()%CHAMBERS,pick=next(),targets=rrTargets(board);
    const fired=bulletChamber===stopChamber&&targets.length>0,aimSlot=targets.length?targets[pick%targets.length]:null;
    return {role,season,bulletChamber,stopChamber,fired,hitSlot:fired?aimSlot:null,aimSlot};
  }
  // Player positions travel with the player; pos remains the formation slot even after a substitution.
  // Name ambiguity: prefer the same shirt at the manager's launch club, then the club, then catalog/source order.
  // Preserve the source's short_name.
  const byName=new Map();
  let indexed=false;
  function rrPlayerPositions(name,club,number=null){
    const database=rrPlayers();
    if(!indexed&&database){
      for(const [sourceClub,data] of Object.entries(database.clubs))for(const row of data.players){
        const key=rrKey(row[0]),matches=byName.get(key)||[];
        matches.push({club:sourceClub,number:row[4],positions:row[2]});byName.set(key,matches);
      }
      indexed=true;
    }
    const matches=byName.get(rrKey(name));
    return matches?(matches.find(p=>p.club===club&&p.number===number)||matches.find(p=>p.club===club)||matches[0]).positions:Object.freeze([]);
  }
  // A signing comes from another club, so a namesake elsewhere wins over the manager's own player.
  function rrSigningPositions(name,club){
    rrPlayerPositions(name,club);
    const matches=byName.get(rrKey(name));
    return matches?(matches.find(p=>p.club!==club)||matches[0]).positions:Object.freeze([]);
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
  // Positional fit only decides eligibility (red team R87-C-03): 1 = one of his positions is in the slot's line, 0 = not
  // (or a sub-only player with no known position). Among eligible players the overall decides.
  function rrFit(player,pos){
    const line=rrLine(pos);
    return line&&player.positions.some(position=>rrLine(position)===line)?1:0;
  }
  // Nik 2026-10-31: a club that has run out of players keeps an EMPTY slot (no name, rating 0); the roulette still runs
  // and the bullet only ever hits a filled slot (rrTargets).
  const rrEmpty=slot=>rrRow(slot.slot,slot.pos,null,{number:null,rating:0,positions:Object.freeze([]),special:false,signedSeason:null});
  const rrPlace=(slot,player)=>player?rrRow(slot.slot,slot.pos,player.name,{number:player.number??null,rating:player.rating,positions:player.positions,special:false,signedSeason:player.signedSeason??null}):rrEmpty(slot);
  const rrRank=(a,b)=>b.rating-a.rating||(a.number??100)-(b.number??100);
  const rrDatabasePlayer=p=>({name:p[0],rating:p[1],positions:p[2],number:p[4],signedSeason:null});
  const rrOnBoard=(state,player)=>state.board.some(p=>p.name&&rrSame(p,player));
  // Who may never come back: shot players, guessed signings and both Special Players. One identity set holds them all
  // (rrId), and every path that puts a player on the board, the bench or the reserves asks rrExcluded, so a blocked
  // person can never return by any route. A guessed or shot signing blocks only that signing: his club namesake stays.
  // A shot club player blocks his own row and any later signing with his name (a released player could be bought back,
  // and a shot player never returns). A Special Player blocks his own club row (every row with his name when the draw has
  // no shirt number) and any signing with his name.
  function rrExclude(state,player){
    state.excluded.add(rrId(player));
    if(!rrSigning(player))state.excluded.add(`s|${rrKey(player.name)}`);
  }
  function rrExcludeSpecial(state,sp){
    const key=rrKey(sp.name);
    state.excluded.add(`s|${key}`);
    if(rrNumber(sp)===null)state.excludedClubNames.add(key);else state.excluded.add(`c|${key}#${rrNumber(sp)}`);
  }
  function rrExcluded(state,player){
    return state.excluded.has(rrId(player))||(!rrSigning(player)&&state.excludedClubNames.has(rrKey(player.name)));
  }
  function rrReserve(state,player){
    if(rrExcluded(state,player)||rrOnBoard(state,player)||state.reserves.some(p=>rrSame(p,player)))return;
    state.reserves.push(player);
  }
  // Database replacements use bundled data only. Never resurrect a shot player or a Special Player, and never pick a
  // row already on the board or in the reserves (one person = name + shirt number).
  function rrBestDatabase(state,predicate){
    const eligible=p=>
      predicate(p)&&!rrExcluded(state,p)&&!rrOnBoard(state,p)&&!state.reserves.some(r=>rrSame(r,p));
    return rrPlayers().clubs[state.club].players.map(rrDatabasePlayer).sort(rrRank).find(eligible)||null;
  }
  function rrNextReserve(state,predicate=()=>true){
    const next=rrBestDatabase(state,predicate);
    if(next)state.reserves.push(next);
    return next;
  }
  // Every refill takes the best available club player (red team RT5 Q2): the best of the reserves (hidden three, dropped
  // starters, parked signings) and the club's unused database players, by overall then lower shirt number, the build
  // script's tie rule. A weak player in the reserves never blocks a better unused club player.
  function rrTakeReserve(state,predicate=()=>true){
    let at=-1;
    for(let i=0;i<state.reserves.length;i+=1)if(predicate(state.reserves[i])&&(at<0||rrRank(state.reserves[i],state.reserves[at])<0))at=i;
    const next=rrBestDatabase(state,predicate);
    if(next&&(at<0||rrRank(next,state.reserves[at])<0))return next;
    // Replacements stay club-only: a club with no player left gets an empty slot (null), never a revived loss or an import.
    if(at<0)return null;
    const [player]=state.reserves.splice(at,1);
    return player;
  }
  // Strict improvements retain incumbents on ties. A displaced player stays in the local squad.
  // A shot sub's place goes to a kept signing of this window; a starter a signing displaced only goes to the bench when
  // he beats the weakest remaining sub (red team RT5 Q1), otherwise he joins the reserves, and the shot sub's place is
  // refilled afterwards with the best available club player (who may be him).
  function rrBench(state,player,signing=false){
    const board=state.board,benchVacancy=state.vacant!==null&&state.vacant>=XI_SIZE;
    const fillVacancy=()=>{board[state.vacant]=rrPlace(board[state.vacant],player);state.vacant=null;return true;};
    if(signing&&benchVacancy)return fillVacancy();
    let at=-1;
    for(let i=XI_SIZE;i<BOARD_SIZE;i+=1)if(i!==state.vacant&&(at<0||board[i].rating<board[at].rating))at=i;
    if(at<0&&benchVacancy)return fillVacancy();
    if(at<0||!(player.rating>board[at].rating)){rrReserve(state,player);return false;}
    if(benchVacancy)return fillVacancy();
    const replaced=board[at];board[at]=rrPlace(replaced,player);rrReserve(state,replaced);
    return true;
  }
  // A stopgap (Sol SQ-2-01): an XI player standing in a slot outside his line because nobody fitting was left, unless
  // he is the club's own FIFA 17 launch pick for that slot (the source puts some starters out of position on purpose).
  function rrStopgap(state,i){
    const current=state.board[i];
    if(i>=XI_SIZE||!current.name||rrFit(current,current.pos))return false;
    const launch=state.launch&&state.launch[i];
    return !(launch&&launch.name&&rrSame(launch,current));
  }
  // A kept signing starts only in a slot of his line: the shot player's slot, else the weakest compatible starter when
  // he is strictly better (equal weakest: the lower board slot). Otherwise the bench rule below.
  function rrJoin(state,player){
    if(rrExcluded(state,player)||rrOnBoard(state,player))return false;
    state.reserves=state.reserves.filter(p=>!rrSame(p,player));
    let at=state.vacant!==null&&state.vacant<XI_SIZE&&rrFit(player,state.board[state.vacant].pos)>0?state.vacant:-1;
    if(at<0){
      for(let i=0;i<XI_SIZE;i+=1){
        const current=state.board[i];
        if(i===state.vacant||!rrFit(player,current.pos))continue;
        // A stopgap (an outfielder in goal, R87-E-02, or any player outside his line, Sol SQ-2-01) gives way to any
        // fitting signing.
        const stopgap=rrStopgap(state,i);
        if(!stopgap&&!(player.rating>current.rating))continue;
        if(at<0||stopgap||current.rating<state.board[at].rating)at=i;
      }
    }
    if(at<0)return rrBench(state,player,true);
    const replaced=state.board[at];state.board[at]=rrPlace(replaced,player);
    if(at===state.vacant)state.vacant=null;
    else rrBench(state,replaced);
    return true;
  }
  // Replace directly: no intermediate empty row is ever written to a board. Kept signings get first refusal, even below
  // the lost player's rating. Otherwise (red team R87-C-02) the best sub who FITS the slot moves up and the best reserve
  // refills the bench; with no fitting sub, the best fitting reserve or club database player goes straight into the slot.
  // Only when nobody left at the club fits does the best available player of the same kind (keeper / outfielder) take
  // it, and only a club that has run out entirely leaves the slot empty.
  // Only signings of the window being processed (season) get first refusal (red team R87-E-01): one from an earlier
  // window who never made the board is an ordinary reserve.
  function rrReplace(state,at,kept,season=null){
    const slot=state.board[at];
    const candidates=[...kept,...state.reserves.filter(p=>season!==null&&p.signedSeason===season)].filter(p=>
      !rrExcluded(state,p)&&!rrOnBoard(state,p)&&(slot.bench||rrFit(p,slot.pos)>0));
    candidates.sort(rrOrder);
    if(candidates.length){
      const player=candidates[0];state.board[at]=rrPlace(slot,player);
      state.reserves=state.reserves.filter(p=>!rrSame(p,player));
      return;
    }
    if(slot.bench){state.board[at]=rrPlace(slot,rrTakeReserve(state));return;}
    const keeper=slot.pos==='GK';
    const fits=p=>rrFit(p,slot.pos)>0;
    const sameKind=p=>p.positions.length>0&&(p.positions[0]==='GK')===keeper;
    const bestBench=predicate=>{
      let bench=-1;
      for(let i=XI_SIZE;i<BOARD_SIZE;i+=1){
        const player=state.board[i];
        if(!player.name||rrExcluded(state,player)||!predicate(player))continue;
        if(bench<0||rrRank(player,state.board[bench])<0)bench=i;
      }
      return bench;
    };
    const promote=bench=>{
      const player=state.board[bench],replacement=rrTakeReserve(state);// null = the bench slot stays empty
      state.board[at]=rrPlace(slot,player);state.board[bench]=rrPlace(state.board[bench],replacement);
    };
    let bench=bestBench(fits);
    if(bench>=0){promote(bench);return;}
    const direct=rrTakeReserve(state,fits);
    if(direct){state.board[at]=rrPlace(slot,direct);return;}
    bench=bestBench(sameKind);
    if(bench>=0){promote(bench);return;}
    // A club need not carry a keeper among its four subs; unknown-position signings remain bench-only.
    const last=rrTakeReserve(state,sameKind);
    if(last||!keeper){state.board[at]=rrPlace(slot,last);return;}
    // No keeper left at the club at all (red team R87-E-02, rare): the best remaining outfielder goes in goal; the slot is
    // empty only when the club has nobody left.
    bench=bestBench(p=>p.positions.length>0);
    if(bench>=0){promote(bench);return;}
    state.board[at]=rrPlace(slot,rrTakeReserve(state,p=>p.positions.length>0));
  }
  // Sol SQ-2-01: once a fitting club player or signing is available again, a stopgap hands his slot back (best fitting
  // player by the normal refill order) and returns to the bench or the reserves.
  function rrRepairStopgaps(state,season){
    for(let i=0;i<XI_SIZE;i+=1){
      if(!rrStopgap(state,i))continue;
      const slot=state.board[i],fits=p=>p.name&&!rrExcluded(state,p)&&rrFit(p,slot.pos)>0;
      let available=false;
      for(let b=XI_SIZE;b<BOARD_SIZE&&!available;b+=1)available=fits(state.board[b]);
      if(!available)available=state.reserves.some(fits)||Boolean(rrBestDatabase(state,p=>rrFit(p,slot.pos)>0));
      if(!available)continue;
      const stopgap=slot;
      rrReplace(state,i,[],season);
      rrBench(state,stopgap);
    }
  }
  // Sol SQ-2-02: a player the rival guessed must be released, so he leaves the board too (not only the reserves); his
  // slot is refilled the normal way. Runs after that season's shot, so the shot already shown never changes.
  function rrEvictExcluded(state,season){
    for(let i=0;i<BOARD_SIZE;i+=1)if(state.board[i].name&&rrExcluded(state,state.board[i]))rrReplace(state,i,[],season);
  }
  // special = {playerOne:{name, overall, number?, sourceName?}, playerTwo:{...}} from the Special Player draw, or null for
  // an older Showdown. With his shirt number only his own database row is excluded (red team R87-C-05: Empoli's other
  // Matheus Pereira stays); sourceName is his squad database name when it differs (R87-D-01: "K. Mbappe Lottin").
  // Without a number, every row with his name.
  function rrSpecial(special,role){
    const p=special&&special[role];
    if(!(p&&typeof p.name==="string"&&p.name.trim()&&rrOverall(p.overall)))return null;
    const number=rrNumber(p),names=[p.name.trim()];
    if(typeof p.sourceName==="string"&&p.sourceName.trim())names.push(p.sourceName.trim());
    return names.map(name=>({name,rating:p.overall,number}));
  }
  // Kept signings of one season for one manager: Transfer War verdict rows with a valid overall that were not released
  // by the rival's guess, best overall first; equal overalls by identity (name, then position), never by entry slot.
  function rrKept(rows,season,club){
    if(!Array.isArray(rows))return null;
    return rows.filter(r=>r&&r.release===false&&typeof r.name==="string"&&r.name.trim()&&rrOverall(r.overall))
      .map(r=>({name:r.name.trim(),rating:r.overall,positions:Object.freeze(SIGNING_POSITIONS.has(r.position)?[r.position]:rrSigningPositions(r.name.trim(),club).slice(0,1)),signedSeason:season}))
      .sort(rrOrder);
  }
  // ---------- F2-02: persisted hits and the version pin ----------
  // A spin mark (js/sparkSharedTransferChallenge.js markSpun) records that season's outcome for that manager: fired, hitName,
  // hitNumber, hitSlot and this version. The version names the engine revision and a hash of exactly the data this Showdown's
  // boards are built from (both clubs' squad rows and database rows, and both Special Players), so a data fix for another club
  // never stops a running Showdown, and any change that can move a board or a shot here does.
  function rrHash(text){let h=0x811c9dc5;for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(16).padStart(8,"0");}
  function rrVersion(clubs,options){
    const squads=rrSquads(),players=rrPlayers();
    if(!squads||!players||!clubs)return null;
    const parts=[];
    for(const role of ROLES){
      const club=clubs[role];
      if(!Object.prototype.hasOwnProperty.call(squads.squads,club)||!players.clubs||!Object.prototype.hasOwnProperty.call(players.clubs,club))return null;
      parts.push(club,squads.squads[club],players.clubs[club]);
    }
    const special=options&&options.special;
    parts.push(ROLES.map(role=>rrSpecial(special,role)));
    return `rr${4}.${ENGINE_REVISION}.${rrHash(JSON.stringify(parts))}`;
  }
  // A persisted outcome is used only when it is whole: fired true with a name and a board slot 0-14, or fired false with none.
  function rrSavedHit(hits,season,role){
    const h=hits&&hits[season]&&hits[season][role];
    if(!h||typeof h!=="object"||typeof h.fired!=="boolean")return null;
    if(!h.fired)return {fired:false};
    if(typeof h.hitName!=="string"||!h.hitName.trim()||!Number.isInteger(h.hitSlot)||h.hitSlot<0||h.hitSlot>=BOARD_SIZE)return null;
    return {fired:true,hitName:h.hitName.trim(),hitNumber:Number.isInteger(h.hitNumber)?h.hitNumber:null,hitSlot:h.hitSlot};
  }
  // Where the saved shot player stands on this phone's board: his saved slot when that slot still holds him, else wherever he
  // is (a later build may have moved him), else -1 (not on this board at all: he is still out, nobody else is).
  function rrSavedAt(board,saved){
    const shot={name:saved.hitName,number:saved.hitNumber};
    const row=board[saved.hitSlot];
    if(row&&row.name&&rrSame(row,shot))return {shot,at:saved.hitSlot};
    return {shot,at:board.findIndex(p=>p.name&&rrSame(p,shot))};
  }
  // This season's turn with a saved outcome as the authority. The chambers stay the seeded ones (they never depend on a board);
  // the stop chamber follows the saved result so the animation agrees with it.
  function rrSavedTurn(turn,saved,board){
    if(!saved.fired)return {...turn,fired:false,hitSlot:null,stopChamber:turn.bulletChamber===turn.stopChamber?(turn.bulletChamber+1)%CHAMBERS:turn.stopChamber,authority:"saved",shot:null};
    const {shot,at}=rrSavedAt(board,saved),slot=at>=0?at:saved.hitSlot;
    return {...turn,fired:true,hitSlot:slot,aimSlot:slot,stopChamber:turn.bulletChamber,authority:"saved",shot:at>=0?null:shot};
  }
  // The outcome a manager's spin mark records for his own turn of this plan.
  function rrOutcome(plan,role,version){
    const turn=plan&&Array.isArray(plan.turns)?plan.turns.find(item=>item.role===role):null;
    if(!turn||typeof version!=="string"||!version)return null;
    if(!turn.fired||!turn.player||!turn.player.name)return Object.freeze({fired:false,hitName:null,hitNumber:null,hitSlot:null,version});
    return Object.freeze({fired:true,hitName:String(turn.player.name).trim(),hitNumber:Number.isInteger(turn.player.number)?turn.player.number:null,hitSlot:turn.hitSlot,version});
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
  // one (index 1..season-1). options.hits[k] = {playerOne:outcome|null, playerTwo:outcome|null}: the outcomes the spin marks
  // saved (F2-02). A saved outcome is the authority for that season and manager: the saved player is out even if this build's
  // board would have aimed elsewhere; a season or manager without one is computed as before. Returns null for a malformed id,
  // an unknown club, a season outside 1..10 or a missing season of history (the screen then shows no roulette).
  function rrForSeason(rivalryId,clubs,season,options){
    const args=rrArgs(rivalryId,clubs,season);
    if(!args)return null;
    const history=options&&options.history,special=options&&options.special,hits=options&&options.hits;
    const boards={},turns={};
    const formations=Object.freeze(Object.fromEntries(ROLES.map(role=>[role,rrPlayers().clubs[clubs[role]].formation])));
    // The Special Player is never on any board, bench or reserve list anywhere: both managers' draws are excluded from
    // both clubs (red team R87-C-01). One in the club's launch board is skipped and the next player takes his place.
    const specials=ROLES.flatMap(role=>rrSpecial(special,role)||[]);
    for(const role of ROLES){
      const state={club:clubs[role],launch:args.launch[role],board:args.launch[role].slice(),reserves:[],vacant:null,excluded:new Set(),excludedClubNames:new Set()};
      for(const sp of specials)rrExcludeSpecial(state,sp);
      for(const [,name,number,rating] of rrSquads().squads[state.club].reserves)
        rrReserve(state,{name,number,rating,positions:rrPlayerPositions(name,state.club,number),signedSeason:null});
      for(let i=0;i<BOARD_SIZE;i+=1)if(rrExcluded(state,state.board[i]))rrReplace(state,i,[]);
      while(state.reserves.length<3&&rrNextReserve(state)){} // skip him in the hidden three too
      for(let k=1;k<season;k+=1){
        const allKept=rrKept(history&&history[k]&&history[k][role],k,state.club);
        if(!allKept)return null;
        const turn=rrTurn(args.hex,k,role,state.board);
        // A guessed signing must not sneak in later through the club database refill. Applied after this season's turn
        // was drawn (the board it aimed at is the one the screen showed); a guessed player already on the board is
        // evicted below (Sol SQ-2-02).
        for(const row of history[k][role])if(row&&row.release===true&&typeof row.name==='string'&&row.name.trim())rrExclude(state,{name:row.name.trim(),number:null,signedSeason:k});
        state.reserves=state.reserves.filter(p=>!rrExcluded(state,p));
        // Sol SQ-2-03: a player this manager already signed in an earlier window is not a new signing when entered again;
        // he keeps his first window and his place (board or reserves).
        const kept=allKept.filter(p=>!state.reserves.some(r=>r.signedSeason!==null&&rrSame(r,p)));
        const saved=rrSavedHit(hits,k,role);
        let shot=null,at=-1;
        if(saved){if(saved.fired)({shot,at}=rrSavedAt(state.board,saved));}
        else if(turn.fired){shot=state.board[turn.hitSlot];at=turn.hitSlot;}
        if(shot){
          rrExclude(state,shot);
          // Keep the old row until it can be overwritten directly. Vacancy metadata lets
          // R87-2's XI/bench signing placement run first without ever writing a blank row.
          if(at>=0)state.vacant=at;
        }
        for(const player of kept)rrJoin(state,player);
        if(state.vacant!==null){rrReplace(state,state.vacant,[],k);state.vacant=null;}
        rrEvictExcluded(state,k);
        rrRepairStopgaps(state,k);
      }
      const board=state.board;
      boards[role]=Object.freeze(board);
      const turn=rrTurn(args.hex,season,role,board),saved=rrSavedHit(hits,season,role);
      turns[role]=saved?rrSavedTurn(turn,saved,board):{...turn,authority:"computed",shot:null};
    }
    const order=ROLES.map(role=>{
      const {shot,...turn}=turns[role],board=boards[role];
      const player=turn.hitSlot===null?null:shot?rrRow(turn.hitSlot,board[turn.hitSlot].pos,shot.name,{number:shot.number,rating:0,positions:Object.freeze([]),special:false,signedSeason:null}):board[turn.hitSlot];
      return Object.freeze({...turn,player});
    });
    return Object.freeze({contractVersion:4,season,chambers:CHAMBERS,order:ROLES,formations,boards:Object.freeze(boards),turns:Object.freeze(order)});
  }

  return Object.freeze({contractVersion:4,feature:"cms-roster-russian-roulette",chambers:CHAMBERS,boardSize:BOARD_SIZE,xiSize:XI_SIZE,overallMin:OVERALL_MIN,overallMax:OVERALL_MAX,positions:POSITIONS,roles:ROLES,engineRevision:ENGINE_REVISION,board:rrBoard,forSeason:rrForSeason,version:rrVersion,outcome:rrOutcome});
});
