# Fable job 2: r87 between-seasons flow bug hunt (Career Mode Showdown r87 / 2.0.0)

Code snapshot: gameplay/r87 @ 78b43f8ce, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of every file on this flow is below this brief. You cannot run code here, so reason carefully and show your working.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore on the free Spark plan, GitHub Pages). Two managers, Daniel (playerOne, the coordinator who taps START) and Nik (playerTwo), each on his own phone or laptop, play a "Showdown" of 1, 3, 5 or 10 seasons. Firestore reads are the scarce resource (Rules get() lookups are billed reads too).

## The flow you own (new in r87)
Every season, in this order, on both phones:
1. **Career Start** (season 1: club assignment, then the Special Player reveal, then the Career Start card with both clubs' crests and each Special Player's original club).
2. **Roster Russian Roulette**: each manager spins a 7-chamber revolver (Daniel first, then Nik). Every result comes from the Showdown's own 64-hex id, so both phones agree with no reads and a refresh can never re-spin. A shot hits one player on that manager's 15-player board (XI + 4 subs); he releases him in FIFA 17. Boards for season s are rebuilt from the launch board, both Special Players and every earlier season's Transfer War verdicts (js/rosterRoulette.js, wired by js/rosterRouletteStep.js). Old Showdowns confirmed before RRR_FROM_MS show no roulette.
3. **Transfer War / transfer window** (js/*TransferChallenge*.js, js/transferScreenV10.js, Rules fragment): each manager enters signings, the rival guesses, verdicts decide which signings are kept.
4. Season results and the season commit both phones acknowledge (js/productionSharedSeasonCommit.js), then the Touchline Gazette front page (js/touchlineGazette.js).
Reconnect and resume after reload or phone lock: js/productionSharedJourneyReconnect.js, js/productionSharedJourneyEntry.js, js/productionSharedJourneyGuard.js.

## House rules (a break is a bug)
- Equal scores = DRAW; equal career points = level. No tiebreak anywhere.
- Reus Gate: the loading screen stays until the next screen is ready; no half-drawn screen, no flash of an old design. Never dim the screen. Nothing covers anything at any size.
- Never skip, hide or reorder a needed screen. **The roulette must never be skipped** for a Showdown where it applies (the owner's rule), and it must never run twice for the same season.
- Both phones must always show the same boards, the same shot, the same verdicts and the same paper.
- The Special Player is never on any roulette board; it is always called "Special Player" / "SP" on screen.

## Threat model
Normal play only: two honest players, reloads, phone locks, offline/online, slow networks, two tabs, timing races between the phones, service-worker upgrades, iPhone Safari lifecycle, old Showdowns from earlier builds. Anything that needs a modified app, the console or direct database writes is out of scope.

## Already known or in progress, do not re-report
- "The transfer window can start before both managers have spun": being fixed now in PR #1101 (both spins write a mark; START waits for both). Do not report the missing gate itself; DO report other ways the roulette can be skipped, repeated or desynced.
- RRR_FROM_MS placeholder date (set in the release PR). Accented names in a fallback font on the 3D boards. Initials matching for names (parked).
- Squad-content accuracy against the FIFA 17 database is a separate audit; here judge the engine's logic and the flow, not the data rows.
- Career-screen numbers are Fable job 1.

## Your job
Work as the senior engineer who owns "the season-to-season flow never breaks". Read every file below in full.

Reply 1 (this message): a bug hunt. Walk the flow step by step for seasons 1, 2 and 10 of a 10-season Showdown, from both phones, and for each step ask: what if this phone reloads here, locks here, goes offline here, is a step ahead or behind the other phone, or opens in a second tab? Report every way that a player can get stuck, see a skipped or repeated screen, see a different board/shot/verdict/paper from the other phone, lose or duplicate a signing, have the wrong player released, waste reads (loops, re-reads, listeners left running), or hit a crash on honest input. Also check the engine (js/rosterRoulette.js) chain logic: shot players out forever, kept signings in, guessed signings out, Special Players excluded, 11 starters in fitting positions + 4 subs while the club has players, the bullet never hitting an empty slot.

For each finding: ID (F2-NN), severity (P0 stuck/lost data/wrong release, P1 wrong screen or desync a player will hit, P2 rare, P3 polish), file:line, exact steps on the two phones, expected vs actual, and your reasoning trace through the code. Put anything you are not sure of in a separate "suspected" list. No style notes. End with the top 5 to fix first.

Reply 2 (I will ask): for each P0/P1, a minimal fix as a unified diff against the file shown, plus a Node test (CommonJS, tests/contracts style) that fails before and passes after.

Keep each reply's visible text under about 60,000 characters.


## FILE: js/rosterRoulette.js
```js
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
  // Identity (red team R87-C-05): names compare with accents folded, trimmed and lower-cased ("M. Ozil" = "M. Özil"; no
  // initials guessing). A database row is one person by (name, shirt number), so Alavés' two Manu García rows stay two
  // people; a typed signing has no shirt number and matches every row with his name (the cautious reading).
  const rrKeys=new Map();
  function rrKey(name){
    const text=String(name||"");let key=rrKeys.get(text);
    if(key===undefined){key=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();if(rrKeys.size<20000)rrKeys.set(text,key);}
    return key;
  }
  const rrNumber=p=>Number.isInteger(p&&p.number)?p.number:null;
  const rrSame=(a,b)=>rrKey(a.name)===rrKey(b.name)&&(rrNumber(a)===null||rrNumber(b)===null||rrNumber(a)===rrNumber(b));
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
  // Who may never come back: shot players, guessed signings and both Special Players. A person with a shirt number blocks
  // only his own row (a namesake at the club stays) plus any typed signing with his name; a name-only entry (a guessed
  // signing, a shot signing, a Special Player without a number) blocks the name.
  function rrExclude(state,player){
    const key=rrKey(player.name),number=rrNumber(player);
    state.excludedNames.add(key);
    if(number===null)state.excludedAll.add(key);else state.excludedIds.add(`${key}#${number}`);
  }
  function rrExcluded(state,player){
    const key=rrKey(player.name),number=rrNumber(player);
    if(state.excludedAll.has(key))return true;
    return number===null?state.excludedNames.has(key):state.excludedIds.has(`${key}#${number}`);
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
        // An outfielder standing in goal because the club ran out of keepers (red team R87-E-02) gives way to any keeper.
        const stopgap=current.pos==="GK"&&current.name&&current.positions[0]!=="GK";
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
      .map(r=>({name:r.name.trim(),rating:r.overall,positions:Object.freeze(SIGNING_POSITIONS.has(r.position)?[r.position]:rrPlayerPositions(r.name.trim(),club).slice(0,1)),signedSeason:season}))
      .sort(rrOrder);
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
    // The Special Player is never on any board, bench or reserve list anywhere: both managers' draws are excluded from
    // both clubs (red team R87-C-01). One in the club's launch board is skipped and the next player takes his place.
    const specials=ROLES.flatMap(role=>rrSpecial(special,role)||[]);
    for(const role of ROLES){
      const state={club:clubs[role],board:args.launch[role].slice(),reserves:[],vacant:null,excludedNames:new Set(),excludedIds:new Set(),excludedAll:new Set()};
      for(const sp of specials)rrExclude(state,sp);
      for(const [,name,number,rating] of rrSquads().squads[state.club].reserves)
        rrReserve(state,{name,number,rating,positions:rrPlayerPositions(name,state.club,number),signedSeason:null});
      for(let i=0;i<BOARD_SIZE;i+=1)if(rrExcluded(state,state.board[i]))rrReplace(state,i,[]);
      while(state.reserves.length<3&&rrNextReserve(state)){} // skip him in the hidden three too
      for(let k=1;k<season;k+=1){
        const kept=rrKept(history&&history[k]&&history[k][role],k,state.club);
        if(!kept)return null;
        // A guessed signing must not sneak in later through the club database refill.
        for(const row of history[k][role])if(row&&row.release===true&&typeof row.name==='string')rrExclude(state,{name:row.name,number:null});
        state.reserves=state.reserves.filter(p=>!rrExcluded(state,p));
        const turn=rrTurn(args.hex,k,role,state.board);
        if(turn.fired){
          rrExclude(state,state.board[turn.hitSlot]);
          // Keep the old row until it can be overwritten directly. Vacancy metadata lets
          // R87-2's XI/bench signing placement run first without ever writing a blank row.
          state.vacant=turn.hitSlot;
        }
        for(const player of kept)rrJoin(state,player);
        if(state.vacant!==null){rrReplace(state,state.vacant,[],k);state.vacant=null;}
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

```

## FILE: js/rosterRouletteStep.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeRosterRouletteStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Russian Roster Roulette, the season step (Nik 2026-10-28/29/30; look = Team V HO-040, approved 29 Oct). Every season,
  // before this manager's Transfer Challenge opens, both spins play in Team V's page in a full-screen frame, Daniel first, with
  // the outcome from js/rosterRoulette.js (the Showdown id decides, so both phones agree; HO040-M1); then he confirms the
  // release in his FIFA 17 save. The app never releases anyone itself. The boards build themselves (Nik 2026-10-30): the
  // FIFA 17 launch board excluding the Special Player, then each season's shot player out and kept signings in by position and overall, from
  // last seasons' Transfer War verdicts (kept on this phone when they were shown; otherwise one Transfer Challenge read per
  // missing season). No board is saved anywhere and nobody types one.
  // Shown once per manager per season on this browser (the watched spin is not replayed); never for a Showdown confirmed
  // before r87. A page that fails to load skips only the animation: the result and the release still show. Anything else that
  // fails (engine, data, an error) keeps the Transfer Challenge closed behind TRY AGAIN / BACK (red team R87-B-02): the seeded
  // shot still counts on later boards, so a manager must never reach the window without being told about it.
  const PAGE="visual-assets/v10_1/roulette/index.html";
  const STAGE_ID="rrStage",PANEL_ID="rrStepPanel";
  const DONE_KEY="careerModeShowdown.rouletteDone.v1",WATCHED_KEY="careerModeShowdown.rouletteWatched.v1",KEYS_MAX=60;
  // RRR_FROM_MS is set to the r87 release time in the release PR (red team R87-C-07: the placeholder below is earlier than
  // the r86 boundary, js/marqueePlayer.js MARQUEE_FROM_MS 03:00 UTC that day, so until the release PR pins it, r86
  // Showdowns confirmed after midnight would get a roulette). Do not change it outside the release PR.
  const RRR_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,LOAD_WAIT_MS=10000,ARMED_WAIT_MS=5000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const sceneFailedHere=new Set();
  let running=null,leftForHome=false;

  function rrsDoc(){return root.document||null;}
  function rrsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function rrsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function rrsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  // Both lists go through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function rrsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function rrsHas(key,item){return rrsList(key).includes(item);}
  function rrsMark(key,item){try{const list=rrsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function rrsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  async function rrsEnsure(){
    const loads=Promise.all([
      rrsLoad("fifa17-players","data/fifa17Players.js",()=>Boolean(root.CareerModeFifa17Players)),
      rrsLoad("roster-squads","data/rosterSquads.js",()=>Boolean(root.CareerModeRosterSquads)),
      rrsLoad("roster-roulette","js/rosterRoulette.js",()=>Boolean(root.CareerModeRosterRoulette)),
      rrsLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)),
      rrsLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)),
      typeof root.loadRuntimeStyle==="function"?Promise.resolve(root.loadRuntimeStyle("roulette-step","css/v10Roulette.css")).then(()=>true,()=>true):true
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,rrsWait(LOAD_WAIT_MS).then(()=>false)]);
  }

  // ctx = {rivalryId, managerRole, season, clubs:{playerOne,playerTwo}, confirmedAtMs, phase, verdicts(k)} from the Transfer
  // Challenge. True when this manager still has this season's roulette to do on this browser.
  function rrsDecide(ctx){
    if(root.CMS_ROSTER_ROULETTE==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    if(!ctx.clubs||!ctx.clubs.playerOne||!ctx.clubs.playerTwo||ctx.phase==="COMPLETED")return false;
    if(!Number.isFinite(ctx.confirmedAtMs)||ctx.confirmedAtMs<RRR_FROM_MS)return false;
    const key=rrsKey(ctx);
    return !rrsHas(DONE_KEY,key);
  }

  // ---------- the panel (marble, like Career Start; no scrim: it sits on the scene or the page as an opaque card) ----------
  function rrsEl(tag,className,text){const node=rrsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function rrsButton(label,className,onClick){const button=rrsEl("button",className,label);button.type="button";button.addEventListener("click",onClick);return button;}
  function rrsRemovePanel(){const panel=rrsDoc()?.getElementById(PANEL_ID);if(panel)panel.remove();}
  function rrsPanel(ctx,heading,label){
    rrsRemovePanel();
    const overlay=rrsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",label);
    const shell=rrsEl("div","remoteJoiningShell rrStepShell"),header=rrsEl("div","remoteJoiningHeader");
    header.append(rrsEl("strong","",`SEASON ${ctx.season} · RUSSIAN ROSTER ROULETTE`));
    const body=rrsEl("div","rrStepBody");body.append(rrsEl("h2","rrStepTitle",heading));
    // No finished scene behind the card (WebGL missing, scene seen before a reload, history retry): stand it in the room, never on the page below.
    if(!rrsDoc().getElementById(STAGE_ID))overlay.classList.add("rrStepRoom");
    shell.append(header,body);overlay.append(shell);rrsDoc().body.append(overlay);
    return {overlay,body};
  }
  // A choice panel: resolves with the id of the button pressed.
  function rrsAsk(ctx,{heading,label,lines=[],note="",buttons}){
    return new Promise(resolve=>{
      const {body}=rrsPanel(ctx,heading,label);
      for(const line of lines)body.append(rrsEl("p","rrStepLine",line));
      if(note)body.append(rrsEl("p","rrStepNote",note));
      const row=rrsEl("div","rrStepActions");
      for(const b of buttons)row.append(rrsButton(b.label,b.primary?"menuButton rrStepPrimary":"backButton",()=>resolve(b.id)));
      body.append(row);row.querySelector("button")?.focus();
    });
  }

  // ---------- season 2+: this manager's board ----------
  // The same rules as the engine and the Rules (js/rosterRoulette.js normalizeBoard), with a reason a person can act on.
  function rrsReadError(result){
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(result);if(quota)return quota;
    if(result&&/permission/.test(String(result.code)))return "Last season's Transfer War could not be read: the Showdown is not open here. Go back to Showdown Home and open it again.";
    return "Last season's Transfer War could not be reached. Check the connection and try again.";
  }
  // The Special Players both phones drew for this Showdown (js/marqueePlayer.js): {role:{name, overall, number,
  // sourceName}}, or null for a Showdown confirmed before the Special Player. The engine excludes BOTH from both boards
  // (red team R87-C-01) by his own squad database row: name + shirt number (R87-C-05), under the database name when it
  // differs from the display name (R87-D-01, data/marqueePlayers.js sourceNames).
  function rrsSpecial(ctx){
    const draw=root.CareerModeMarqueePlayer,picks=draw&&draw.forShowdown(ctx.rivalryId,ctx.confirmedAtMs);
    const sourceNames=(root.CareerModeMarqueePlayers&&root.CareerModeMarqueePlayers.sourceNames)||{};
    return picks?Object.fromEntries(ROLES.map(role=>[role,{name:picks[role].name,overall:picks[role].overall,number:picks[role].number,
      sourceName:Object.prototype.hasOwnProperty.call(sourceNames,picks[role].name)?sourceNames[picks[role].name]:null}])):null;
  }
  /* rrsSpecial end */
  // A cosmetic seed for the scene (red team R87-C-06): from the Showdown id and the season, the same on both phones.
  function rrsSeed(ctx){return (parseInt(String(ctx.rivalryId).slice(-8),16)^Math.imul(ctx.season,0x9E3779B1))>>>0;}
  // history[k] = both managers' Transfer War verdicts of season k, for every season before this one; null when the
  // manager leaves.
  async function rrsHistory(ctx){
    const history=[null];
    for(let k=1;k<ctx.season;k+=1){
      for(;;){
        const result=await ctx.verdicts(k);
        if(result&&result.ok){history.push(result.verdicts);break;}
        const choice=await rrsAsk(ctx,{heading:"Building the boards",label:"Building the boards",lines:[rrsReadError(result)],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return null;
      }
    }
    return history;
  }

  // ---------- the spins (Team V's page in a frame) ----------
  function rrsShowLoading(){
    const doc=rrsDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    const text=doc.getElementById("loadingText"),priorText=text?text.textContent:"",priorLabel=el.getAttribute("aria-label");
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Loading the revolver");
    if(text)text.textContent="LOADING THE REVOLVER";
    void el.offsetWidth;el.style.transition="";
    let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
  }
  function rrsRemoveStage(){const stage=rrsDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
  function rrsCreateStage(ctx){
    const doc=rrsDoc();rrsRemoveStage();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Russian Roster Roulette");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
    const frame=doc.createElement("iframe");frame.title="Russian Roster Roulette";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${encodeURIComponent(ctx.clubs.playerOne)}&n=${encodeURIComponent(ctx.clubs.playerTwo)}`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    stage.append(frame);doc.body.append(stage);
    return {stage,frame};
  }
  function rrsListen(frame){
    const origin=root.location&&root.location.origin;let onReady,onDone,onArmed;
    const ready=new Promise(resolve=>{onReady=resolve;}),done=new Promise(resolve=>{onDone=resolve;}),armed=new Promise(resolve=>{onArmed=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-rr-ready")onReady("ready");
      else if(event.data.type==="cms-rr-armed")onArmed("armed");
      else if(event.data.type==="cms-rr-error"){onReady("error");onArmed("error");onDone("error");}
      else if(event.data.type==="cms-rr-continue")onDone("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is dropped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const timer=root.setTimeout(()=>onReady("timeout"),MAX_LOADING_MS);
    return {ready:ready.finally(()=>root.clearTimeout(timer)),armed,done,stop(){root.removeEventListener("message",handler);root.clearTimeout(timer);}};
  }
  // "watched" when both spins played to the end, "skipped" when the page could not run (the result still shows).
  async function rrsScene(ctx,plan){
    const loading=rrsShowLoading(),shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=rrsCreateStage(ctx));channel=rrsListen(frame);
      if(await channel.ready!=="ready")throw new Error("Roulette page did not start.");
      const boardOf=role=>plan.boards[role].map(p=>({pos:p.pos,position:p.positions[0]||null,name:p.name||"EMPTY SLOT",special:p.special===true,rating:p.name&&p.rating>0?p.rating:null}));
      // The whole spin plan (red team R87-C-06): the scene loads bulletChamber, stops on stopChamber and aims at hitSlot
      // (a safe turn at aimSlot), so both phones show the same chambers and the same player.
      const turns=plan.turns.map(turn=>({fire:turn.fired,target:turn.player?turn.player.name:null,bulletChamber:turn.bulletChamber,stopChamber:turn.stopChamber,hitSlot:turn.hitSlot,aimSlot:turn.aimSlot}));
      frame.contentWindow.postMessage({type:"cms-rr-setup",d:ctx.clubs.playerOne,n:ctx.clubs.playerTwo,boards:{D:boardOf("playerOne"),N:boardOf("playerTwo")},formations:{D:plan.formations.playerOne,N:plan.formations.playerTwo},turns,seed:rrsSeed(ctx)},root.location.origin);
      // Red team RT5-FLOW-01: the stage stays hidden until the page says it took the setup ("cms-rr-armed"). A page that
      // drops it (its squads file failed) or never answers is removed after ARMED_WAIT_MS and the result panel shows.
      let armedTimer;
      const armed=await Promise.race([channel.armed,new Promise(resolve=>{armedTimer=root.setTimeout(()=>resolve("timeout"),ARMED_WAIT_MS);})]);
      root.clearTimeout(armedTimer);
      if(armed!=="armed")throw new Error("Roulette page did not take the spins.");
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await rrsWait(left);
      stage.style.visibility="visible";
    }catch(_error){if(channel)channel.stop();sceneFailedHere.add(rrsKey(ctx));rrsRemoveStage();loading.hide();return "skipped";}
    loading.hide();
    try{frame.focus();}catch(_error){}
    const end=await channel.done;channel.stop();
    if(end!=="continue"){sceneFailedHere.add(rrsKey(ctx));return "skipped";}
    return "watched";
  }

  // ---------- the result and the release ----------
  function rrsOutcomeLine(turn){return turn.fired?`${NAMES[turn.role]} lost ${turn.player.name}.`:`${NAMES[turn.role]}: empty chamber. Squad safe.`;}
  async function rrsResult(ctx,plan){
    const mine=plan.turns.find(turn=>turn.role===ctx.managerRole);
    const lines=plan.turns.map(rrsOutcomeLine);
    const choice=mine.fired
      ?await rrsAsk(ctx,{heading:`Release ${mine.player.name}`,label:"Release your player",lines,
        note:`Release ${mine.player.name} in your FIFA 17 save now, before the transfer window. The game can't do it for you.`,
        buttons:[{id:"go",label:"I'VE RELEASED HIM",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]})
      :await rrsAsk(ctx,{heading:"Your squad is safe",label:"Your squad is safe",lines,note:"Your squad stays as it is this season.",
        buttons:[{id:"go",label:"GO TO THE TRANSFER WINDOW",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
    return choice==="go";
  }

  async function rrsRun(ctx){
    if(!rrsDecide(ctx)||!rrsDoc())return true;
    while(!await rrsEnsure()){
      const choice=await rrsAsk(ctx,{heading:"Loading the roulette",label:"Loading the roulette",lines:["The roulette could not load. Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back")return false;
    }
    const engine=root.CareerModeRosterRoulette,key=rrsKey(ctx);
    const history=ctx.season>1?await rrsHistory(ctx):[null];if(!history)return false;
    // Never skipped (Nik 2026-10-31): a short squad shows empty slots and the bullet only hits a real player.
    const plan=engine.forSeason(ctx.rivalryId,ctx.clubs,ctx.season,{special:rrsSpecial(ctx),history});
    if(!plan||plan.turns.some(turn=>turn.fired&&!turn.player)){rrsMark(DONE_KEY,key);return true;}
    if(!rrsHas(WATCHED_KEY,key)&&!sceneFailedHere.has(key)){
      const scene=await rrsScene(ctx,plan);
      if(scene==="watched")rrsMark(WATCHED_KEY,key);
    }
    const go=await rrsResult(ctx,plan);
    if(!go)return false;
    rrsMark(DONE_KEY,key);
    return true;
  }
  // An unexpected error asks TRY AGAIN / BACK; the same seeded plan is rebuilt on retry and nothing is marked done.
  async function rrsRunGuarded(ctx){
    for(;;){
      try{return await rrsRun(ctx);}
      catch(_error){
        rrsRemoveStage();
        const choice=await rrsAsk(ctx,{heading:"The roulette hit a problem",label:"The roulette hit a problem",lines:["This season's spins could not be shown. Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
        if(choice==="back")return false;
      }
    }
  }
  // Resolves true when the Transfer Challenge may open, false when the manager went back to Showdown Home (or the step could
  // not even show its panel). Never rejects, and never opens the Transfer Challenge without this season's result.
  // The panel and the stage stay up until close() so nothing shows between them and the next screen.
  function rrsRunBeforeTransfers(ctx){
    if(running)return running;
    leftForHome=false;
    const run=Promise.resolve().then(()=>rrsRunGuarded(ctx)).catch(()=>false).then(go=>{
      if(go===false){leftForHome=true;rrsRemovePanel();rrsRemoveStage();if(typeof root.navigateTo==="function")void Promise.resolve(root.navigateTo("mainMenu")).catch(()=>{});}
      return go!==false;
    }).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }
  function rrsClose(){rrsRemovePanel();rrsRemoveStage();return true;}
  // Red team R87-SP-02: for the Transfer War signing form, is a typed name this manager's own Special Player? The draw is
  // loaded by rrsEnsure before the window opens; false when it is not loaded or the Showdown has none.
  function rrsIsOwnSpecial(rivalryId,confirmedAtMs,role,name){
    const draw=root.CareerModeMarqueePlayer;
    try{return Boolean(draw&&typeof draw.isOwnSpecial==="function"&&draw.isOwnSpecial(rivalryId,confirmedAtMs,role,name));}catch(_error){return false;}
  }
  // For the screens that open the Transfer Challenge: a roulette is on screen (its pace is the manager's, so no load timeout
  // may end it), and whether the last one ended with the manager going back to Showdown Home (not a failure).
  function rrsActive(){return Boolean(running);}
  function rrsWentHome(){return leftForHome;}

  return Object.freeze({contractVersion:1,feature:"cms-roster-roulette-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,doneKey:DONE_KEY,watchedKey:WATCHED_KEY,fromMs:RRR_FROM_MS,decide:rrsDecide,runBeforeTransfers:rrsRunBeforeTransfers,close:rrsClose,active:rrsActive,wentHome:rrsWentHome,isOwnSpecial:rrsIsOwnSpecial});
});

```

## FILE: js/marqueePlayer.js
```js
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
  // Red team R87-SP-02: is a typed Transfer War signing name this manager's own Special Player? Names compare with accents
  // folded, trimmed and lower-cased, against the display name and the squad database name (data/marqueePlayers.js
  // sourceNames, R87-D-01). No initials guessing. False when the Showdown has no Special Player.
  const mpFold=name=>String(name||"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();
  function mpIsOwnSpecial(rivalryId,confirmedAt,role,name){
    const pair=ROLES.includes(role)&&mpFold(name)?mpForShowdown(rivalryId,confirmedAt):null;
    if(!pair)return false;
    const list=mpList(),player=pair[role],source=list&&list.sourceNames&&Object.prototype.hasOwnProperty.call(list.sourceNames,player.name)?list.sourceNames[player.name]:null;
    return [player.name,source].some(n=>n&&mpFold(n)===mpFold(name));
  }

  return Object.freeze({contractVersion:1,feature:"cms-marquee-player",fromMs:MARQUEE_FROM_MS,roles:ROLES,tier:mpTier,picks:mpPicks,forShowdown:mpForShowdown,forNewShowdown:mpForNewShowdown,isOwnSpecial:mpIsOwnSpecial});
});

```

## FILE: js/sharedCareerStart.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const SCHEMA_VERSION=1;
  const RUNTIME_REVISION="1.9.1-r7";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASE_ONE="ONE_MANAGER_ACKNOWLEDGED";
  const PHASE_READY="CAREER_START_READY";
  const OPERATION=/^career_start_op_[0-9a-f]{32}$/;
  const SEASONS=new Set([1,3,5,10]);

  function scsFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scsClone(value){return JSON.parse(JSON.stringify(value));}
  function scsExact(value,keys){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
  function scsValidRole(value){return ROLES.includes(value);}
  function scsValidateConfirmedSetup(setup){
    if(!setup||setup.phase!=="SHOWDOWN_CONFIRMED"||setup.revision!==6)scsFail("CAREER_START_SETUP_NOT_CONFIRMED","Shared Setup must be fully confirmed before Career Start.");
    if(!scsValidRole(setup.coordinatorRole))scsFail("CAREER_START_SETUP_INVALID");
    if(typeof setup.leagueId!=="string"||!setup.leagueId)scsFail("CAREER_START_SETUP_INVALID");
    if(!setup.clubs||typeof setup.clubs.playerOne!=="string"||typeof setup.clubs.playerTwo!=="string"||!setup.clubs.playerOne||!setup.clubs.playerTwo||setup.clubs.playerOne===setup.clubs.playerTwo)scsFail("CAREER_START_SETUP_INVALID");
    if(!SEASONS.has(setup.totalSeasons))scsFail("CAREER_START_SETUP_INVALID");
    if(!Array.isArray(setup.confirmedRoles)||setup.confirmedRoles.length!==2||new Set(setup.confirmedRoles).size!==2||!ROLES.every(role=>setup.confirmedRoles.includes(role)))scsFail("CAREER_START_SETUP_INVALID");
    return setup;
  }
  function scsValidateState(value){
    const keys=["schemaVersion","runtimeRevision","revision","phase","acknowledgedRoles","operationIds","baseRevisions","actorRoles"];
    if(!scsExact(value,keys)||value.schemaVersion!==SCHEMA_VERSION||value.runtimeRevision!==RUNTIME_REVISION)scsFail("CAREER_START_STATE_INVALID");
    if(!Number.isInteger(value.revision)||value.revision<1||value.revision>2)scsFail("CAREER_START_STATE_INVALID");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==value.revision||new Set(value.acknowledgedRoles).size!==value.acknowledgedRoles.length||value.acknowledgedRoles.some(role=>!scsValidRole(role)))scsFail("CAREER_START_STATE_INVALID");
    for(const key of ["operationIds","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)scsFail("CAREER_START_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id)))scsFail("CAREER_START_STATE_INVALID");
    if(value.baseRevisions.some((base,index)=>base!==index))scsFail("CAREER_START_STATE_INVALID");
    if(value.actorRoles.some((role,index)=>!scsValidRole(role)||role!==value.acknowledgedRoles[index]))scsFail("CAREER_START_STATE_INVALID");
    if(value.revision===1&&value.phase!==PHASE_ONE)scsFail("CAREER_START_STATE_INVALID");
    if(value.revision===2&&value.phase!==PHASE_READY)scsFail("CAREER_START_STATE_INVALID");
    return value;
  }
  function scsNormalizeCommand(command){
    if(!command||command.type!=="acknowledge-career-start"||!OPERATION.test(String(command.operationId||""))||!Number.isInteger(command.baseRevision)||command.baseRevision<0||command.baseRevision>2)scsFail("CAREER_START_COMMAND_INVALID");
    return {type:"acknowledge-career-start",operationId:command.operationId,baseRevision:command.baseRevision};
  }
  function scsLocalAssignment(setup,managerRole){scsValidateConfirmedSetup(setup);if(!scsValidRole(managerRole))scsFail("CAREER_START_ROLE_INVALID");return Object.freeze({managerRole,club:setup.clubs[managerRole],leagueId:setup.leagueId,totalSeasons:setup.totalSeasons});}
  function scsApply({state=null,setup,actorRole,command}){
    scsValidateConfirmedSetup(setup);if(!scsValidRole(actorRole))scsFail("CAREER_START_ROLE_INVALID");const normalized=scsNormalizeCommand(command);const current=state?scsValidateState(scsClone(state)):null;
    if(current){
      const existing=current.operationIds.indexOf(normalized.operationId);
      if(existing>=0){
        if(current.actorRoles[existing]!==actorRole||current.baseRevisions[existing]!==normalized.baseRevision)scsFail("CAREER_START_IDEMPOTENCY_CONFLICT");
        return Object.freeze({ok:true,idempotent:true,state:Object.freeze(scsClone(current))});
      }
    }
    const revision=current?current.revision:0;
    if(normalized.baseRevision!==revision)scsFail("CAREER_START_STALE_BASE_REVISION");
    if(current&&current.phase===PHASE_READY)scsFail("CAREER_START_ALREADY_READY");
    if(current&&current.acknowledgedRoles.includes(actorRole))scsFail("CAREER_START_ROLE_ALREADY_ACKNOWLEDGED");
    const acknowledgedRoles=current?[...current.acknowledgedRoles,actorRole]:[actorRole];
    const operationIds=current?[...current.operationIds,normalized.operationId]:[normalized.operationId];
    const baseRevisions=current?[...current.baseRevisions,normalized.baseRevision]:[normalized.baseRevision];
    const actorRoles=current?[...current.actorRoles,actorRole]:[actorRole];
    const next={schemaVersion:SCHEMA_VERSION,runtimeRevision:RUNTIME_REVISION,revision:revision+1,phase:revision+1===2?PHASE_READY:PHASE_ONE,acknowledgedRoles,operationIds,baseRevisions,actorRoles};
    scsValidateState(next);
    return Object.freeze({ok:true,idempotent:false,state:Object.freeze(scsClone(next))});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-career-start",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:Object.freeze([PHASE_ONE,PHASE_READY]),validateConfirmedSetup:scsValidateConfirmedSetup,validateState:scsValidateState,localAssignment:scsLocalAssignment,apply:scsApply,billingRequired:false,canonicalStorageMutation:false});
});

```

## FILE: js/sparkSharedCareerStart.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocol=typeof require==="function"?require("./sharedCareerStart.js"):root.CareerModeSharedCareerStart;
  function scspSetupProvider(){const provider=typeof require==="function"?require("./sparkSharedShowdownSetup.js"):root.CareerModeSparkSharedShowdownSetup;if(!provider||typeof provider.read!=="function")scspFail("CAREER_START_SETUP_PROVIDER_UNAVAILABLE");return provider;}
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^career_start_op_[0-9a-f]{32}$/;
  const LEDGER_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","revision","phase","setupRevision","setupOperationIds","totalSeasons","acknowledgedRoles","operationIds","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);

  function scspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"CAREER_START_PROVIDER_FAILED"});}
  function scspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function scspExact(value,keys){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));}
  function scspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))scspFail("CAREER_START_RIVALRY_INVALID");return id;}
  function scspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))scspFail("CAREER_START_SESSION_INVALID");return id;}
  function scspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))scspFail("CAREER_START_DEVICE_INACTIVE");return id;}
  function scspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))scspFail("CAREER_START_COMMAND_INVALID");return id;}
  function scspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)scspFail("CAREER_START_AUTH_REQUIRED");return id;}
  function scspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)scspFail("CAREER_START_CLOCK_INVALID");return n;}
  function scspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function scspValidateSdk(options){if(!options.firestore)scspFail("CAREER_START_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")scspFail("CAREER_START_PROVIDER_UNAVAILABLE");}if(typeof options.firebaseSdk.serverTimestamp!=="function"&&(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function"))scspFail("CAREER_START_PROVIDER_UNAVAILABLE");}
  function scspUpdatedAt(sdk,now){return typeof sdk.serverTimestamp==="function"?sdk.serverTimestamp():sdk.Timestamp.fromMillis(now);}
  function scspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")scspFail("CAREER_START_MANAGER_INACTIVE");}
  function scspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")scspFail("CAREER_START_DEVICE_INACTIVE");}
  function scspAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")scspFail("CAREER_START_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)scspFail("CAREER_START_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))scspFail("CAREER_START_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)scspFail("CAREER_START_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function scspAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)scspFail("CAREER_START_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=scspTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))scspFail("CAREER_START_ACTIVE_SESSION_REQUIRED");
  }
  function scspAssertConfirmedSetupLedger(value,rivalryId){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!Array.isArray(value.operationIds)||value.operationIds.length!==6||new Set(value.operationIds).size!==6||![1,3,5,10].includes(value.totalSeasons))scspFail("CAREER_START_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||new Set(value.confirmedRoles).size!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))scspFail("CAREER_START_SETUP_NOT_CONFIRMED");
    return value;
  }
  function scspStateFromLedger(value,rivalryId,setupLedger){
    if(!value)return null;
    if(!scspExact(value,LEDGER_KEYS)||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||JSON.stringify(value.setupOperationIds)!==JSON.stringify(setupLedger.operationIds)||value.totalSeasons!==setupLedger.totalSeasons)scspFail("CAREER_START_PROVIDER_STATE_INVALID");
    const state={schemaVersion:1,runtimeRevision:protocol.runtimeRevision,revision:value.revision,phase:value.phase,acknowledgedRoles:value.acknowledgedRoles,operationIds:value.operationIds,baseRevisions:value.baseRevisions,actorRoles:value.actorRoles};
    protocol.validateState(state);
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))scspFail("CAREER_START_PROVIDER_STATE_INVALID");
    return state;
  }
  function scspLedgerFrom({state,rivalryId,setupLedger,sessionId,deviceId,updatedAtValue}){return {schemaVersion:1,objectType:"sharedCareerStart",rivalryId,revision:state.revision,phase:state.phase,setupRevision:6,setupOperationIds:[...setupLedger.operationIds],totalSeasons:setupLedger.totalSeasons,acknowledgedRoles:[...state.acknowledgedRoles],operationIds:[...state.operationIds],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:sessionId,updatedAt:updatedAtValue,updatedByDeviceId:deviceId};}
  async function scspConfirmedSetup(options){
    const setupProvider=scspSetupProvider();
    const result=await setupProvider.read(options);if(!result||result.ok!==true||!result.state)scspFail(result&&result.code||"CAREER_START_SETUP_NOT_CONFIRMED");protocol.validateConfirmedSetup(result.state);return result.state;
  }
  async function scspContext(options,transaction){
    const uid=scspAccountId(options.user),rivalryId=scspNormalizeRivalryId(options.rivalryId),sessionId=scspNormalizeSessionId(options.sessionId),deviceId=scspNormalizeDeviceId(options.deviceId),now=scspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const refs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    scspAssertAccount(scspSnapshot(await transaction.get(refs.account)),uid);scspAssertDevice(scspSnapshot(await transaction.get(refs.device)),deviceId);const rivalry=scspAssertRivalry(scspSnapshot(await transaction.get(refs.rivalry)),rivalryId,uid);scspAssertSession(scspSnapshot(await transaction.get(refs.session)),rivalryId,sessionId,rivalry.authorized,now);const setupLedger=scspAssertConfirmedSetupLedger(scspSnapshot(await transaction.get(refs.setup)),rivalryId);const careerValue=scspSnapshot(await transaction.get(refs.career));const state=scspStateFromLedger(careerValue,rivalryId,setupLedger);return Object.freeze({uid,rivalryId,sessionId,deviceId,now,rivalry,setupLedger,state,refs});
  }
  async function scspRead(options={}){
    try{scspValidateSdk(options);const setup=await scspConfirmedSetup(options);return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const ctx=await scspContext(options,transaction);return Object.freeze({ok:true,revision:ctx.state?ctx.state.revision:0,state:ctx.state?Object.freeze({...ctx.state}):null,setup:Object.freeze(JSON.parse(JSON.stringify(setup))),managerRole:ctx.rivalry.actor.slotId,assignment:protocol.localAssignment(setup,ctx.rivalry.actor.slotId)});});}catch(error){return scspResultError(error);}
  }
  async function scspAcknowledge(options={}){
    try{
      scspValidateSdk(options);const operationId=scspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>2)scspFail("CAREER_START_COMMAND_INVALID");const setup=await scspConfirmedSetup(options);
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const ctx=await scspContext(options,transaction),actorRole=ctx.rivalry.actor.slotId;const applied=protocol.apply({state:ctx.state,setup,actorRole,command:{type:"acknowledge-career-start",operationId,baseRevision}});if(applied.idempotent)return Object.freeze({ok:true,status:"accepted",replayed:true,revision:applied.state.revision,state:applied.state,setup,managerRole:actorRole,assignment:protocol.localAssignment(setup,actorRole)});transaction.set(ctx.refs.career,scspLedgerFrom({state:applied.state,rivalryId:ctx.rivalryId,setupLedger:ctx.setupLedger,sessionId:ctx.sessionId,deviceId:ctx.deviceId,updatedAtValue:scspUpdatedAt(options.firebaseSdk,ctx.now)}));return Object.freeze({ok:true,status:"accepted",replayed:false,revision:applied.state.revision,state:applied.state,setup,managerRole:actorRole,assignment:protocol.localAssignment(setup,actorRole)});});
    }catch(error){return scspResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-career-start",read:scspRead,acknowledge:scspAcknowledge,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false});
});

```

## FILE: js/productionSharedCareerStart.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCareerStart=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PANEL_ID="productionSharedCareerStartOverlay";
  const CONTROL_ID="continueClubAssignment";
  const POLL_MS=15000;
  // Job 33 (R1): once this manager has acknowledged, read every 3 s for at most 3 minutes while waiting on the rival.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let installed=false,busy=false,revealStage=null,pollTimer=null,setupApi=null,provider=null,view=null,lastError="",operationTail=Promise.resolve(),refreshPromise=null,openPromise=null,readyKey="",fastWaitKey="",fastWaitSince=0,autoContinueKey="";

  function pcstCreate(tag,className,text){const node=root.document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function pcstReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  async function pcstLoadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Release-owned runtime loader is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function pcstEnsureDependencies(){
    if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-career-start","css/remoteJoining.css");
    await pcstLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pcstLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await pcstLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pcstLoadScript("ssjr-spark-shared-setup","js/sparkSharedShowdownSetup.js",()=>root.CareerModeSparkSharedShowdownSetup);
    await pcstLoadScript("ssjr-career-start-protocol","js/sharedCareerStart.js",()=>root.CareerModeSharedCareerStart);
    await pcstLoadScript("ssjr-career-start-provider","js/sparkSharedCareerStart.js",()=>root.CareerModeSparkSharedCareerStart);
    await pcstLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    await pcstLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;provider=root.CareerModeSparkSharedCareerStart;
    if(!setupApi||typeof setupApi.getState!=="function"||typeof setupApi.refresh!=="function")throw new Error("Shared Setup authority is unavailable for Career Start.");
    if(!provider||typeof provider.read!=="function"||typeof provider.acknowledge!=="function")throw new Error("Shared Career Start provider is unavailable.");
    // r86: the Special Player lines (each player's original club) are drawn with the panel's first frame. Optional: a failure
    // only leaves the lines out.
    try{await pcstLoadScript("special-player-chip","js/specialPlayerChip.js",()=>root.CareerModeSpecialPlayerChip);await root.CareerModeSpecialPlayerChip.ensure();}catch(_error){}
  }
  // r86 Special Player: the club he played for in FIFA 17 at launch, so each manager can sign him in-game. Only a Showdown
  // confirmed on r86 or later has one (no line otherwise).
  function pcstSpecialPlayers(){try{const chip=root.CareerModeSpecialPlayerChip,state=pcstSetupState();return chip&&state&&Number.isFinite(state.setupUpdatedAtMs)?chip.forShowdown(state.rivalryId,state.setupUpdatedAtMs):null;}catch(_error){return null;}}
  function pcstSetupState(){try{return setupApi&&setupApi.getState?setupApi.getState():root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function pcstConfirmed(){const state=pcstSetupState();return Boolean(state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pcstReady(){return Boolean(view&&view.state&&view.state.phase==="CAREER_START_READY");}
  function pcstStopPolling(){if(pollTimer!==null&&typeof root.clearInterval==="function"){root.clearInterval(pollTimer);pollTimer=null;}return true;}
  function pcstWithTimeout(task,request){
    if(request)return task(request);
    let timer;const error=Object.assign(new Error("Career Start took too long. Check your connection and tap again."),{code:"CAREER_START_TIMEOUT"});
    // r87: the Russian Roster Roulette between Career Start and the Transfer Challenge runs at the manager's pace, so the 25 s
    // limit waits while it is on screen (js/rosterRouletteStep.js active()).
    const timeout=new Promise((_,reject)=>{const fire=()=>{if(root.CareerModeRosterRouletteStep?.active?.()){timer=root.setTimeout(fire,25000);return;}reject(error);};timer=root.setTimeout(fire,25000);});
    let active=true;request={wait:promise=>Promise.race([promise,timeout]).then(value=>{if(!active)throw error;return value;})};
    return Promise.race([Promise.resolve().then(()=>task(request)),timeout]).catch(failure=>{if(failure===error){lastError=error.message;if(task===pcstOpenPanelNow)pcstEnsurePanel();pcstRender();pcstDecorateControl();}throw failure;}).finally(()=>{active=false;root.clearTimeout(timer);});
  }
  function pcstSerialize(task){const run=operationTail.then(task,task);operationTail=run.then(()=>undefined,()=>undefined);return run;}
  function pcstDeactivateSetupPresentation(){const presentation=root.CareerModeProductionSharedShowdownPresentation;if(presentation&&typeof presentation.deactivate==="function")presentation.deactivate();return true;}
  function pcstLeagueName(id){try{const item=typeof root.getLeagueById==="function"&&root.getLeagueById(id);if(item&&item.name)return item.name;}catch(_error){}return String(id||"").replaceAll("_"," ").replace(/\b\w/g,char=>char.toUpperCase());}
  function pcstRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")throw new Error("Secure randomness is unavailable.");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `career_start_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup instead of re-reading it.
  async function pcstProviderOptions(light=false,request){
    await request.wait(pcstEnsureDependencies());if(!(light===true&&pcstConfirmed()))await request.wait(setupApi.refresh());const state=setupApi.getState();if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)throw new Error("Both managers must finish Shared Setup before Career Start.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await request.wait(runtime.ensureAccountServices()));
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)throw new Error("Connected account services are unavailable.");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,cryptoImpl:root.crypto}};
  }
  function pcstSetupKey(state){return state&&state.ready===true&&state.rivalryId&&state.managerRole&&state.setup?`${state.rivalryId}|${state.managerRole}|${JSON.stringify(state.setup)}`:"";}
  function pcstApplyView(result,state){
    view={...result,setup:state.setup};readyKey=pcstReady()?pcstSetupKey(state):"";lastError="";pcstRender();pcstDecorateControl();pcstNoteSeasonStart(state);if(pcstReady()){pcstStopPolling();pcstScheduleAutoContinue();}return view;
  }
  // r87 RE-05: Career Start READY is where season 1 starts for the reads meter; the reads before it (Home, pairing, setup, Special
  // Player, this panel) are setup, never part of a season's cost (js/sparkPrivatePairing.js, noteSeasonStart).
  function pcstNoteSeasonStart(state){if(!pcstReady()||!state?.rivalryId)return;try{root.CareerModeFirestoreBudget?.noteSeasonStart?.(`${state.rivalryId}|1`);}catch(_error){}}
  function pcstPanelOpen(){const overlay=root.document&&root.document.getElementById(PANEL_ID);return Boolean(overlay&&!overlay.classList.contains("hidden"));}
  // Job 33 (R4b): once BOTH managers have attested (CAREER_START_READY), an open Career Start moves on to the Transfer
  // Challenge by itself. Navigation only: each manager's own I STARTED AT tap is still required, and the button stays as a fallback.
  function pcstAutoContinueKey(){return view&&view.state&&view.setup?`${view.setup.rivalryId||pcstSetupState()?.rivalryId||""}|${view.state.revision}`:"";}
  function pcstScheduleAutoContinue(){if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcstAutoContinue(),0);else void pcstAutoContinue();}
  async function pcstAutoContinue(){
    if(busy||!pcstReady()||!pcstPanelOpen())return false;const key=pcstAutoContinueKey();if(!key||key===autoContinueKey)return false;
    autoContinueKey=key;return pcstOpenTransferChallenge();
  }
  function pcstOwnAcknowledged(result){
    const role=result?.managerRole,state=result?.state;
    return Boolean(role&&state&&Array.isArray(state.acknowledgedRoles)&&state.acknowledgedRoles.includes(role));
  }
  // CAREER_START_READY is final for one confirmed Shared Setup, and the Transfer and Season Result providers re-check it inside
  // their own transactions. Transfer and Season Results call this before every read and publish, so re-reading it there only
  // added a request that could fail ("Career Start could not be read.") and block a publish. Reuse it for the same Setup.
  function pcstRefresh(light=false,request){
    if(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()))return Promise.resolve(view);
    if(refreshPromise)return refreshPromise;
    const run=pcstSerialize(()=>pcstWithTimeout(async request=>{const ctx=await pcstProviderOptions(light===true,request),result=await request.wait(provider.read(ctx.options));if(!result||result.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:result&&result.code});return pcstApplyView(result,ctx.state);},request));
    refreshPromise=run.finally(()=>{if(refreshPromise===wrapped)refreshPromise=null;});
    const wrapped=refreshPromise;
    return wrapped;
  }
  async function pcstAcknowledge(){
    if(busy)return false;
    busy=true;lastError="";pcstRender();
    const operationId=pcstRandomOperationId();
    try{
      return await pcstSerialize(async()=>{
        return pcstWithTimeout(async request=>{
        const ctx=await pcstProviderOptions(false,request);
        let current=await request.wait(provider.read(ctx.options));
        if(!current||current.ok!==true)throw Object.assign(new Error("Career Start could not be read."),{code:current&&current.code});
        if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
        for(let attempt=0;attempt<2;attempt+=1){
          const result=await request.wait(provider.acknowledge({...ctx.options,operationId,baseRevision:current.revision||0}));
          if(result&&result.ok===true){pcstApplyView(result,ctx.state);return true;}
          const code=result&&result.code||"CAREER_START_PROVIDER_FAILED";
          // Job 21: two managers acknowledging at once -> the loser is rejected by the Rules (permission-denied); treat it like a stale revision (re-read, retry once).
          if(["CAREER_START_STALE_BASE_REVISION","CAREER_START_ROLE_ALREADY_ACKNOWLEDGED","CAREER_START_ALREADY_READY","permission-denied","firestore/permission-denied","permission_denied"].includes(code)){
            const refreshed=await request.wait(provider.read(ctx.options));
            if(!refreshed||refreshed.ok!==true)throw Object.assign(new Error("Career Start could not be reconciled after another acknowledgement."),{code:refreshed&&refreshed.code||code});
            current=refreshed;
            if(current?.state?.phase==="CAREER_START_READY"||pcstOwnAcknowledged(current)){pcstApplyView(current,ctx.state);return true;}
            if((code==="CAREER_START_STALE_BASE_REVISION"||code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied")&&attempt===0)continue;
          }
          throw Object.assign(new Error("Career Start acknowledgement was rejected."),{code});
        }
        throw Object.assign(new Error("Career Start acknowledgement could not be reconciled."),{code:"CAREER_START_ACK_RETRY_EXHAUSTED"});
        });
      });
    }catch(error){
      lastError=pcstErrorText(error,"Your Career Start was not recorded.");
      pcstReport("Unable to acknowledge Shared Career Start",error);
      return false;
    }finally{
      busy=false;pcstRender();if(pcstReady())pcstScheduleAutoContinue();
    }
  }
  async function pcstOpenTransferChallenge(){
    if(busy||!pcstReady())return false;
    busy=true;pcstRender();
    try{
      await pcstEnsureDependencies();
      const transfer=root.CareerModeProductionSharedTransferChallenge;
      if(!transfer||typeof transfer.install!=="function"||typeof transfer.open!=="function")throw new Error("Shared Transfer Challenge is unavailable.");
      transfer.install();
      const opened=await transfer.open();
      // r87: the manager left the Russian Roster Roulette for Showdown Home; it opens again from there. Not a failure.
      if(opened!==true&&root.CareerModeRosterRouletteStep?.wentHome?.()){pcstClosePanel();return false;}
      if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
      pcstClosePanel();
      return true;
    }catch(error){
      lastError=pcstErrorText(error,"The Transfer Challenge could not be opened.");
      pcstReport("Unable to continue to Shared Transfer Challenge",error);
      return false;
    }finally{
      busy=false;pcstRender();
    }
  }
  // Keep provider codes in diagnostics, not in the sentence shown beneath the Career Start button.
  function pcstErrorText(error,fallback){
    if(error?.code==="CAREER_START_TIMEOUT")return error.message;
    const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;
    const code=String(error?.code||""),message=String(error?.message||"");
    const plain=error&&error.providerResult!==true&&message&&message!==code&&!/\b\w+(?:[-_/]\w+)+\b/.test(message)?message:fallback;
    return `${plain} Please try again.`;
  }
  function pcstManagerLabel(role){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;const name=showdown&&showdown.managers&&showdown.managers[role];if(name)return name;}catch(_error){}return role==="playerOne"?"PLAYER ONE":"PLAYER TWO";}
  function pcstRow(label,value,state){const item=pcstCreate("div","settingsInfoRow");item.dataset.careerRow=state||"";item.append(pcstCreate("span","",label),pcstCreate("strong","",value));return item;}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pcstWatchedKey=null;
  function pcstWatchSync(){let key="";try{key=pcstWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcstWatchedKey)return;pcstWatchedKey=key;try{pcstWatchWait();}catch(_error){}}
  // HO-049 item 4 · Career Start option B (Nik picked B, 2026-10-31; spec CAREER_START_B_SPEC.md). On the Club Assignment
  // screen Career Start is its own stage on the Club plate, never a box over the wordmark or the faces: Daniel (left) and
  // Nik (right) each hold his club's crest and name inside his pack face; a narrow marble pillar between them (desktop) or
  // one marble panel under the packs (phone) holds the words; the two buttons sit on the lower deck (desktop) or at the
  // panel's foot (phone). Layout only: the same nodes, texts, buttons, listeners, status and reads as the card above. Any
  // other screen keeps the card. No dim, no scrim, no flash: the stage is set in the same task that shows the panel, and
  // its styles arrive with css/remoteJoining.css, which the panel loads before it opens.
  // Nik's rule: the crest and the name ALWAYS fit inside the pack frame. Inner box = the frame inset 10% on each side (with
  // overflow hidden as a safety net); name clamp(11px, innerH x 0.16, 22px) on one line (a name wider than the box shrinks
  // until it fits); crest = square floor(min(innerW, innerH - 1.5 x label)), contain fit.
  const STAGE_HOST="clubWheelScreen",STAGE_ATTR="careerStartStage";
  // The two painted packs on ENV_CLUB_PHONE_V2 (1179x2096 plate px), drawn centre top at max(100vw, 100svh x 1179/2096).
  const PHONE_PLATE=Object.freeze({w:1179,h:2096,packs:Object.freeze([Object.freeze([236,556]),Object.freeze([668,996])]),top:584,bottom:924});
  let stageWatch=null;
  function pcstFitHold(frame){
    const ix=frame.w*.1,iy=frame.h*.1,w=frame.w-2*ix,h=frame.h-2*iy,label=Math.max(11,Math.min(22,h*.16));
    return {x:frame.x+ix,y:frame.y+iy,w,h,label,crest:Math.max(0,Math.floor(Math.min(w,h-label*1.5))),gap:label*.2};
  }
  function pcstStageHost(){
    const doc=root.document,host=doc&&typeof doc.getElementById==="function"?doc.getElementById(STAGE_HOST):null;
    if(!host||!host.classList||host.classList.contains("hidden")||!host.classList.contains("cl-on"))return null;
    return doc.documentElement&&doc.documentElement.dataset&&doc.documentElement.dataset.v10Screen===STAGE_HOST?host:null;
  }
  // desktop: Team V's Club layout places .clubPackStage on each held pack. phone (upright phone or tablet): the packs are
  // painted on the plate behind the screen. band (sideways phone): the plate fills the left band (cover, centre top).
  function pcstStageMode(host){
    const scene=host.querySelector(".clPhoneScene");
    if(scene&&typeof root.getComputedStyle==="function"&&root.getComputedStyle(scene).display!=="none")return root.innerWidth>root.innerHeight?"band":"phone";
    return host.querySelectorAll(".clubPackStage").length===2?"desktop":null;
  }
  function pcstStageBox(node,origin){const r=node.getBoundingClientRect();return {x:r.left-origin.left,y:r.top-origin.top,w:r.width,h:r.height};}
  function pcstStageFrames(overlay,host,mode,origin){
    if(mode==="desktop")return [...host.querySelectorAll(".clubPackStage")].slice(0,2).map(node=>pcstStageBox(node,origin));
    let k,x0,y0;
    if(mode==="phone"){const box=pcstStageBox(host,origin),probe=overlay.querySelector(".pcstPlateProbe"),width=probe?probe.getBoundingClientRect().width:Math.max(box.w,root.innerHeight*PHONE_PLATE.w/PHONE_PLATE.h);k=width/PHONE_PLATE.w;x0=box.x+(box.w-width)/2;y0=box.y;}
    else{const band=pcstStageBox(host.querySelector(".clPhoneScene"),origin);k=Math.max(band.w/PHONE_PLATE.w,band.h/PHONE_PLATE.h);x0=band.x+(band.w-PHONE_PLATE.w*k)/2;y0=band.y;}
    return PHONE_PLATE.packs.map(([a,b])=>({x:x0+a*k,y:y0+PHONE_PLATE.top*k,w:(b-a)*k,h:(PHONE_PLATE.bottom-PHONE_PLATE.top)*k}));
  }
  function pcstStageHold(role,club){
    const hold=pcstCreate("div","pcstHold");hold.dataset.side=role;hold.setAttribute("aria-hidden","true");
    const crest=pcstCreate("div","pcstHoldCrest");try{if(typeof root.getClubCrestSvg==="function")crest.innerHTML=root.getClubCrestSvg(club);}catch(_error){}
    hold.append(crest,pcstCreate("div","pcstHoldName",club));return hold;
  }
  // stageFailed: the Club screen's visuals could not load (a missing map, script or style), so Career Start shows on its own
  // black-and-gold marble plate (mode "fallback") with every control, plus RETRY, instead of waiting behind an invisible panel.
  let stageRetry=null,stageRetries=0,stageFailed=false,retryFailed=false;
  function pcstStageGiveWay(){
    if(stageFailed)return;stageFailed=true;
    const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden"))pcstRender();
  }
  function pcstStageRetry(){
    // Where the Club screen exists, for at most 30 s per open; after that (or with no Club screen at all) the marble fallback.
    if(stageRetry||typeof root.setTimeout!=="function")return;
    if(!root.document?.getElementById?.(STAGE_HOST)||stageRetries>=100){root.setTimeout(pcstStageGiveWay,0);return;}
    stageRetries+=1;
    stageRetry=root.setTimeout(()=>{stageRetry=null;const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&!overlay.classList.contains("pcstStage"))pcstRender();},300);
  }
  function pcstStageOff(overlay){
    try{
      const doc=root.document;pcstStageWatch(false);
      if(doc&&doc.documentElement&&doc.documentElement.dataset)delete doc.documentElement.dataset[STAGE_ATTR];
      if(overlay&&overlay.classList&&overlay.classList.contains("pcstStage")){overlay.classList.remove("pcstStage");delete overlay.dataset.stageMode;overlay.style.removeProperty("top");if(doc.body&&overlay.parentNode!==doc.body)doc.body.append(overlay);}
    }catch(_error){}
    return false;
  }
  // Re-lays the stage on a resize (the Club layout moves the packs with the window); a turn of the phone rebuilds it.
  function pcstStageWatch(on){
    if(!on){if(stageWatch){root.removeEventListener?.("resize",stageWatch.schedule);root.document?.removeEventListener?.("keydown",stageWatch.escape);stageWatch.observer?.disconnect?.();if(stageWatch.frame)root.cancelAnimationFrame?.(stageWatch.frame);stageWatch=null;}return;}
    if(stageWatch||typeof root.addEventListener!=="function")return;
    const watch={frame:0,observer:null};
    watch.schedule=()=>{if(watch.frame||typeof root.requestAnimationFrame!=="function")return;watch.frame=root.requestAnimationFrame(()=>{watch.frame=0;pcstStageLayout();});};
    root.addEventListener("resize",watch.schedule);
    watch.escape=event=>{if(event.key==="Escape"&&!event.defaultPrevented&&pcstPanelOpen()){event.preventDefault();pcstClosePanel();}};root.document?.addEventListener?.("keydown",watch.escape);
    try{const host=pcstStageHost();if(host&&typeof root.ResizeObserver==="function"){watch.observer=new root.ResizeObserver(watch.schedule);watch.observer.observe(host);host.querySelectorAll(".clubPackStage").forEach(node=>watch.observer.observe(node));}}catch(_error){}
    stageWatch=watch;
  }
  // Every way into Career Start (the Club screen's own button, the first confirmer's automatic open, resume from Home, a
  // reload) shows option B, never the old card: when the Club screen is not up, it opens behind Career Start first with the
  // confirmed Setup's clubs, drawn as the shared presentation draws them (no draw, no write, no save change). The Club
  // screen's own parts already step aside (html[data-career-start-stage]) and the v10 loader keeps its content invisible
  // until it is ready (Reus Gate), so neither the wheel nor the packs ever show; the panel goes up the moment the screen is.
  function pcstForceScreen(host){
    const doc=root.document;for(const el of doc.querySelectorAll(".screen")){const show=el===host;el.classList.toggle("hidden",!show);el.setAttribute("aria-hidden",show?"false":"true");}
  }
  function pcstPaintClubBackdrop(host,state){
    const doc=root.document,setup=state.setup,text=(id,value)=>{const node=doc.getElementById(id);if(node&&node.textContent!==value)node.textContent=value;};
    host.dataset.sharedPresentationRole=state.managerRole||"unresolved";
    text("clubAssignmentLeague",pcstLeagueName(setup.leagueId));text("clubPlayerOne",pcstManagerLabel("playerOne"));text("clubPlayerTwo",pcstManagerLabel("playerTwo"));
    if(typeof root.setClubRevealStage==="function")root.setClubRevealStage("confirmation");else host.dataset.clubRevealStage="confirmation";
    for(const [suffix,role] of [["One","playerOne"],["Two","playerTwo"]]){
      const card=doc.getElementById(`clubCard${suffix}`),name=doc.getElementById(`clubName${suffix}`),stateNode=doc.getElementById(`clubCardState${suffix}`),club=String(setup.clubs[role]||"");
      if(typeof root.applyClubRevealCard==="function")root.applyClubRevealCard(card,name,stateNode,club);else{if(name)name.textContent=club;if(card)card.classList.add("is-revealed");}
    }
  }
  function pcstWaitForStageHost(host,ms){
    return new Promise(resolve=>{
      if(pcstStageHost())return resolve(true);
      let done=false,observer=null,timer=null;
      const finish=ok=>{if(done)return;done=true;try{observer&&observer.disconnect();}catch(_error){}if(timer)root.clearTimeout(timer);resolve(ok);};
      try{observer=new root.MutationObserver(()=>{if(pcstStageHost())finish(true);});observer.observe(root.document.documentElement,{attributes:true,attributeFilter:["data-v10-screen"]});observer.observe(host,{attributes:true,attributeFilter:["class"]});}catch(_error){}
      timer=root.setTimeout(()=>finish(Boolean(pcstStageHost())),ms);
    });
  }
  // Loads (or reloads) the Club screen's visuals through the v10 loader: a load that failed before (its maps, script or styles)
  // is tried again, because the loader forgets a failed load. false only when they cannot load.
  async function pcstShowClubVisuals(){
    const screens=root.CareerModeV10Screens;
    if(!screens||typeof screens.show!=="function")return false;
    // No toast: the fallback panel says it once, and a toast would cover its buttons.
    try{await screens.show(STAGE_HOST);return true;}catch(error){try{root.console?.warn?.("[Career Mode Showdown] Club visuals unavailable for Career Start.",error);}catch(_error){}return false;}
  }
  async function pcstClubBackdrop(){
    if(pcstStageHost())return true;
    const doc=root.document,host=doc&&typeof doc.getElementById==="function"?doc.getElementById(STAGE_HOST):null,state=pcstSetupState();
    if(!host||!doc.documentElement||!doc.documentElement.dataset||!state||!state.setup||!state.setup.clubs)return false;
    try{if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();}catch(_error){}
    try{if(root.CareerModeClubScreenV10&&typeof root.CareerModeClubScreenV10.install==="function")await root.CareerModeClubScreenV10.install();}catch(_error){}
    if(pcstStageHost())return true;
    doc.documentElement.dataset[STAGE_ATTR]="opening";
    let shown=false;
    try{shown=typeof root.showScreen==="function"&&root.showScreen(STAGE_HOST,false)===true;}catch(_error){shown=false;}
    if(!shown)pcstForceScreen(host);
    pcstPaintClubBackdrop(host,state);
    const ready=await pcstShowClubVisuals()&&await pcstWaitForStageHost(host,10000);
    if(!ready&&doc.documentElement.dataset[STAGE_ATTR]==="opening")delete doc.documentElement.dataset[STAGE_ATTR];
    return ready;
  }
  function pcstStageTarget(){
    const host=pcstStageHost(),mode=host&&pcstStageMode(host);
    if(mode)return {host,mode};
    return stageFailed&&root.document&&root.document.body?{host:root.document.body,mode:"fallback"}:null;
  }
  function pcstStage(overlay,body,ctx){
    try{
      const target=overlay.classList.contains("hidden")?null:pcstStageTarget(),host=target&&target.host,mode=target&&target.mode;
      if(!mode){if(!overlay.classList.contains("hidden"))pcstStageRetry();return pcstStageOff(overlay);}
      const doc=root.document,fallback=mode==="fallback";
      if(!fallback){stageRetries=0;stageFailed=false;retryFailed=false;}
      if(overlay.parentNode!==host)host.append(overlay);overlay.style.removeProperty("top");
      overlay.classList.add("pcstStage");overlay.dataset.stageMode=mode;if(fallback)delete doc.documentElement.dataset[STAGE_ATTR];else doc.documentElement.dataset[STAGE_ATTR]=mode;
      const title=pcstCreate("div","pcstTitle");title.append(pcstCreate("span","pcstTitleKicker","CAREER MODE SHOWDOWN 17"));
      const eyebrow=body.querySelector(".remoteJoiningEyebrow");title.append(eyebrow||pcstCreate("span","remoteJoiningEyebrow","CAREER START"));title.lastChild.classList.add("pcstTitleWord");
      const pillar=pcstCreate("div","pcstPillar"),heading=body.querySelector("h2"),note=body.querySelector(":scope > p:not(.remoteJoiningStatus)");
      if(heading){heading.classList.add(ctx?"pcstKicker":"pcstSrOnly");pillar.append(heading);}
      const holds=[];
      if(ctx){
        const grid=body.querySelector(".settingsInfoGrid"),rows=grid?[...grid.children]:[],row=label=>rows.find(item=>item.firstChild&&item.firstChild.textContent===label);
        const chips=pcstCreate("div","pcstChips");for(const label of ["LEAGUE","SHOWDOWN LENGTH"]){const item=row(label);if(item)chips.append(item);}pillar.append(chips);
        // The product's own message. Its idle status ("…confirm below") is folded into it, so the stage says it once.
        if(note){note.classList.add("pcstNote");note.replaceChildren("Your club is ",pcstCreate("b","",ctx.ownClub),`. Start or load a FIFA 17 Career Mode save with that club${ctx.idle?", then confirm":""}.`);pillar.append(note);}
        if(ctx.idle)ctx.status.dataset.stageIdle="true";pillar.append(ctx.status);
        const rival=row("RIVAL");if(rival){rival.classList.add("pcstRival");pillar.append(rival);}
        // Nik's rule (2026-10-29): each Special Player's original club stays on Career Start.
        for(const item of rows)if(item.dataset.careerRow==="special"){item.classList.add("pcstSpecial");pillar.append(item);}
        const you=row("YOU");if(you){you.classList.add("pcstSrOnly");pillar.append(you);}
        if(grid)grid.remove();
        if(!fallback)holds.push(pcstStageHold("playerOne",ctx.setup.clubs.playerOne),pcstStageHold("playerTwo",ctx.setup.clubs.playerTwo));
      }else if(note){note.classList.add("pcstNote");pillar.append(note);}
      const actions=body.querySelector(".remoteJoiningActions");
      if(actions&&mode!=="desktop")pillar.append(actions);
      // The card's × and the Club screen's BACK both step aside with the stage, so the stage carries its own way out
      // (Escape too): it closes Career Start and gives the Club screen back, where CONTINUE TO CAREER START reopens it.
      const back=pcstCreate("button","compactButton pcstBack","BACK");back.type="button";back.setAttribute("aria-label","Close Career Start");back.addEventListener("click",pcstClosePanel);
      if(fallback){
        // The Club screen did not load: say so once, keep every control, and offer RETRY (it loads the Club visuals again).
        const notice=pcstCreate("p","pcstFallbackNote",retryFailed?"The Club screen still didn't load. Career Start works here; try RETRY again in a moment.":"The Club screen didn't load. Career Start works here; RETRY loads the Club screen again.");notice.setAttribute("role","status");
        pillar.insertBefore(notice,pillar.children[heading?1:0]||null);
        const retry=pcstCreate("button","compactButton pcstRetry","RETRY");retry.type="button";retry.addEventListener("click",()=>void pcstRetryStage(retry));
        if(actions)actions.append(retry);else pillar.append(retry);
      }
      const probe=pcstCreate("div","pcstPlateProbe");probe.setAttribute("aria-hidden","true");
      body.prepend(title,...holds,pillar);if(actions&&mode==="desktop"){actions.append(back);body.append(actions);}else body.append(back);body.append(probe);
      pcstStageWatch(true);pcstStageLayout();return true;
    }catch(error){pcstReport("Career Start stage could not be drawn; using the marble fallback",error);pcstStageOff(overlay);if(!stageFailed&&typeof root.setTimeout==="function")root.setTimeout(pcstStageGiveWay,0);return false;}
  }
  function pcstStageLayout(){
    const doc=root.document,overlay=doc&&doc.getElementById(PANEL_ID);
    if(!overlay||!overlay.classList.contains("pcstStage")||overlay.classList.contains("hidden"))return null;
    const target=pcstStageTarget(),host=target&&target.host,mode=target&&target.mode;
    if(!mode||mode!==overlay.dataset.stageMode){pcstRender();return null;}
    if(mode==="fallback")return pcstFallbackLayout(overlay);
    const origin=overlay.getBoundingClientRect(),W=origin.width,H=origin.height,frames=pcstStageFrames(overlay,host,mode,origin);
    overlay.querySelectorAll(".pcstHold").forEach((hold,index)=>{
      const frame=frames[index];if(!frame)return;const fit=pcstFitHold(frame),crest=hold.querySelector(".pcstHoldCrest"),name=hold.querySelector(".pcstHoldName");
      hold.dataset.frame=[frame.x,frame.y,frame.w,frame.h].map(v=>Math.round(v*100)/100).join(",");
      Object.assign(hold.style,{left:`${fit.x}px`,top:`${fit.y}px`,width:`${fit.w}px`,height:`${fit.h}px`,gap:`${fit.gap}px`});
      // One line at the clamp size; a slightly long name shrinks to fit; a long one ("Borussia Mönchengladbach") takes two
      // lines and shrinks until both fit, and the crest gives up the height the name needs.
      const setName=(size,wrap)=>{name.style.fontSize=`${size}px`;name.style.whiteSpace=wrap?"normal":"nowrap";};
      setName(fit.label,false);
      if(name.scrollWidth>fit.w){
        const one=Math.floor(fit.label*fit.w/name.scrollWidth*.97*10)/10;
        if(one>=fit.label*.8)setName(one,false);
        else{let size=fit.label;setName(size,true);for(let step=0;step<12&&size>7&&(name.scrollWidth>fit.w+.5||name.scrollHeight>size*2.3);step++){size=Math.max(7,Math.floor(size*.92*10)/10);setName(size,true);}}
      }
      crest.style.width=crest.style.height=`${Math.max(0,Math.min(fit.crest,Math.floor(Math.min(fit.w,fit.h-name.offsetHeight-fit.gap))))}px`;
    });
    const title=overlay.querySelector(".pcstTitle"),pillar=overlay.querySelector(".pcstPillar"),actions=overlay.querySelector(".remoteJoiningActions"),scene=host.querySelector(".clPhoneScene");
    if(!title||!pillar)return null;
    pillar.removeAttribute("data-room");pillar.removeAttribute("style");title.removeAttribute("style");
    if(mode==="desktop"){
      title.style.top=`${Math.round(H*.09)}px`;title.style.setProperty("--pcst-title",`${Math.round(H*.058)}px`);
      const left=frames[0].x+frames[0].w,right=frames[1].x,room=right-left-16,width=Math.round(room>=240?Math.min(380,room):Math.min(380,W*.27));
      const below=title.getBoundingClientRect().bottom-origin.top+10;
      Object.assign(pillar.style,{left:`${Math.round((left+right)/2-width/2)}px`,width:`${width}px`,top:`${Math.round(Math.max(H*.25,below))}px`});
      if(actions){actions.removeAttribute("style");actions.style.top=`${Math.round(Math.max(H*.755,pillar.getBoundingClientRect().bottom-origin.top+12))}px`;}
    }else{
      const band=scene?pcstStageBox(scene,origin):{x:0,y:0,w:0,h:0},packBottom=Math.max(...frames.map(f=>f.y+f.h));
      // Where the site's top bar shows (sideways phones wider than 900px), the stage starts below it.
      const top=Math.max(band.y,pcstTopBarBottom(origin));
      // Portrait or sideways, the panel is placed first; the BACK is placed on its own after (it never decides the layout).
      if(mode==="phone"){title.style.top=`${Math.round(top+12)}px`;pillar.style.top=`${Math.round(Math.max(band.y+band.h,packBottom+6))}px`;}
      else{Object.assign(title.style,{top:`${Math.round(top+10)}px`,left:`${Math.round(band.x)}px`,width:`${Math.round(band.w)}px`});Object.assign(pillar.style,{left:`${Math.round(band.x+band.w+8)}px`,top:`${Math.round(top+8)}px`});}
      const back=overlay.querySelector(".pcstBack");if(back&&!pillar.contains(back)&&!(actions&&actions.contains(back))){back.removeAttribute("style");back.style.top=`${Math.round(top+(mode==="phone"?10:8))}px`;}
      // The rival line shows only when the panel has 290px or more; then the panel tightens until nothing overflows.
      const room=pillar.getBoundingClientRect().height;if(room<290)pillar.dataset.room="short";
      for(const step of ["tight","tighter","tightest"])if(pillar.scrollHeight>pillar.clientHeight+1)pillar.dataset.room=step;
    }
    return mode;
  }
  // The app's runtime notice for the same failure ("Team V screen could not load…") says what the fallback panel already says,
  // and on a small phone it would cover the panel's buttons: it is dismissed through its own close button. Other notices stay.
  function pcstDismissClubNotice(){
    try{const notice=root.document.getElementById("appRuntimeNotice");if(notice&&/Team V screen could not (load|update)|Club Assignment visuals|CLUB_V10_MAP/.test(notice.textContent||""))notice.querySelector("button")?.click();}catch(_error){}
  }
  function pcstFallbackLayout(overlay){
    pcstDismissClubNotice();
    overlay.style.top=`${Math.round(pcstTopBarBottom({top:0}))}px`;
    const title=overlay.querySelector(".pcstTitle"),pillar=overlay.querySelector(".pcstPillar"),back=overlay.querySelector(".pcstBack");
    if(!title||!pillar)return null;
    pillar.removeAttribute("data-room");pillar.removeAttribute("style");title.removeAttribute("style");
    const origin=overlay.getBoundingClientRect();
    title.style.top="12px";title.style.setProperty("--pcst-title",`${Math.round(Math.max(22,Math.min(34,origin.height*.05)))}px`);
    if(back){back.removeAttribute("style");back.style.top="10px";}
    const below=Math.max(title.getBoundingClientRect().bottom,back?back.getBoundingClientRect().bottom:0)-origin.top+10;
    pillar.style.top=`${Math.round(below)}px`;pillar.style.maxHeight=`${Math.max(0,Math.floor(origin.height-below-8))}px`;
    const room=pillar.getBoundingClientRect().height;if(room<290)pillar.dataset.room="short";
    for(const step of ["tight","tighter","tightest"])if(pillar.scrollHeight>pillar.clientHeight+1)pillar.dataset.room=step;
    return "fallback";
  }
  async function pcstRetryStage(button){
    if(button){button.disabled=true;button.textContent="RETRYING…";}
    let ok=false;try{ok=await pcstClubBackdrop();}catch(_error){ok=false;}
    stageFailed=!ok;retryFailed=!ok;stageRetries=0;
    if(pcstPanelOpen())pcstRender();
    return ok;
  }
  function pcstTopBar(){
    const doc=root.document,bar=doc&&doc.querySelector(".sd-nav-top");if(!bar||typeof root.getComputedStyle!=="function")return null;
    const style=root.getComputedStyle(bar),rect=bar.getBoundingClientRect();
    return style.display==="none"||style.visibility==="hidden"||rect.height<1||!/fixed|sticky/.test(style.position)?null:rect;
  }
  function pcstTopBarBottom(origin){const rect=pcstTopBar();return rect?Math.max(0,rect.bottom-origin.top):0;}
  // The audit Nik asked for (HO-049): at every size the crest and the name sit inside the pack frame ("fits"), and nothing
  // covers anything (packs, title, pillar or panel, buttons), the words never overflow their panel, and all stays on screen.
  function pcstStageAudit(){
    const doc=root.document,overlay=doc&&doc.getElementById(PANEL_ID);
    if(!overlay||!overlay.classList.contains("pcstStage")||overlay.classList.contains("hidden"))return {stage:false};
    const origin=overlay.getBoundingClientRect(),box=node=>{const r=node.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
    const inside=(r,f)=>r.left>=f.left-.5&&r.right<=f.right+.5&&r.top>=f.top-.5&&r.bottom<=f.bottom+.5;
    const overlap=(a,b)=>a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5;
    const frames=[],holds=[...overlay.querySelectorAll(".pcstHold")].map(hold=>{
      const [x,y,w,h]=String(hold.dataset.frame||"").split(",").map(Number),frame={left:origin.left+x,top:origin.top+y,right:origin.left+x+w,bottom:origin.top+y+h};frames.push(frame);
      const name=hold.querySelector(".pcstHoldName"),crest=box(hold.querySelector(".pcstHoldCrest")),label=box(name);
      const fits=[x,y,w,h].every(Number.isFinite)&&crest.right-crest.left>0&&inside(crest,frame)&&inside(label,frame)&&name.scrollWidth<=name.clientWidth+1;
      return {side:hold.dataset.side,club:name.textContent,fits:fits?"fits":"OVERFLOW",frame:[x,y,w,h].map(Math.round),crest:Math.round(crest.right-crest.left),label:parseFloat(name.style.fontSize)};
    });
    const title=box(overlay.querySelector(".pcstTitle")),pillarNode=overlay.querySelector(".pcstPillar"),pillar=box(pillarNode),actionsNode=overlay.querySelector(".remoteJoiningActions"),actions=actionsNode?box(actionsNode):null;
    const backNode=overlay.querySelector(".pcstBack"),covers=[],named={title,pillar};if(actions&&!pillarNode.contains(actionsNode))named.buttons=actions;
    if(backNode&&!(actionsNode&&actionsNode.contains(backNode))){named.back=box(backNode);if(overlap(named.back,pillar))covers.push("back covers pillar");}
    frames.forEach((frame,index)=>{for(const [key,r] of Object.entries(named))if(overlap(r,frame))covers.push(`${key} covers pack ${index+1}`);});
    const bar=pcstTopBar();if(bar){const barBox={left:bar.left,top:bar.top,right:bar.right,bottom:bar.bottom};for(const [key,r] of Object.entries(named))if(overlap(barBox,r))covers.push(`top bar covers ${key}`);frames.forEach((frame,index)=>{if(overlap(barBox,frame))covers.push(`top bar covers pack ${index+1}`);});}
    if(overlap(title,pillar))covers.push("title covers pillar");if(named.back){const word=box(overlay.querySelector(".pcstTitleWord"));if(overlap(named.back,word))covers.push("back covers title");}if(named.buttons&&overlap(named.buttons,pillar))covers.push("buttons cover pillar");
    const viewH=root.innerHeight,viewW=root.innerWidth,onScreen=Object.values(named).every(r=>r.top>=-.5&&r.left>=-.5&&r.bottom<=viewH+.5&&r.right<=viewW+.5);
    const overflow=pillarNode.scrollHeight>pillarNode.clientHeight+1||pillarNode.scrollWidth>pillarNode.clientWidth+1;
    const retryNode=overlay.querySelector(".pcstRetry");
    return {stage:true,back:Boolean(backNode&&backNode.getBoundingClientRect().width>0),retry:Boolean(retryNode&&retryNode.getBoundingClientRect().width>0),mode:overlay.dataset.stageMode,room:pillarNode.dataset.room||"",holds,fits:holds.length===2&&holds.every(item=>item.fits==="fits"),covers,overflow,onScreen,ok:holds.length===2&&holds.every(item=>item.fits==="fits")&&!covers.length&&!overflow&&onScreen};
  }
  function pcstRender(){pcstWatchSync();
    const overlay=root.document&&root.document.getElementById(PANEL_ID);if(!overlay)return;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return;body.replaceChildren();
    const setup=view&&view.setup||pcstSetupState()?.setup,role=view&&view.managerRole||pcstSetupState()?.managerRole,career=view&&view.state||null,acknowledged=new Set(career&&career.acknowledgedRoles||[]);if(!setup||!role){body.append(pcstCreate("h2","","CAREER START"),pcstCreate("p","","Loading your Showdown…"));pcstStage(overlay,body,null);return;}
    const ownClub=setup.clubs[role],otherRole=role==="playerOne"?"playerTwo":"playerOne",otherClub=setup.clubs[otherRole],ready=career&&career.phase==="CAREER_START_READY",mine=acknowledged.has(role);
    body.append(pcstCreate("span","remoteJoiningEyebrow","CAREER START"),pcstCreate("h2","","START YOUR FIFA 17 CAREER"),pcstCreate("p","",`Your club is ${ownClub}. Start or load a FIFA 17 Career Mode save with that club.`));
    const grid=pcstCreate("div","settingsInfoGrid");grid.append(pcstRow("YOU",`${pcstManagerLabel(role)} · ${ownClub}`,mine?"ready":"pending"),pcstRow("RIVAL",`${pcstManagerLabel(otherRole)} · ${otherClub}`,acknowledged.has(otherRole)?"ready":"pending"),pcstRow("LEAGUE",pcstLeagueName(setup.leagueId)),pcstRow("SHOWDOWN LENGTH",`${setup.totalSeasons} SEASON${setup.totalSeasons===1?"":"S"}`));
    const special=pcstSpecialPlayers(),chip=root.CareerModeSpecialPlayerChip,manager=r=>r==="playerOne"?"daniel":"nik";
    if(special&&chip)for(const [label,who] of [["YOUR SPECIAL PLAYER",role],["RIVAL'S SPECIAL PLAYER",otherRole]]){const line=chip.clubLine(special[manager(who)]);if(line){const row=pcstRow(label,line,"special");row.dataset.specialPlayer=manager(who);grid.append(row);}}
    body.append(grid);
    const statusText=lastError||(ready?"BOTH MANAGERS STARTED ✓ · Continue to the Transfer Challenge.":mine?"YOUR CAREER IS CONFIRMED · Waiting for your rival to start theirs.":"Once your FIFA 17 career is set up at your club, confirm below.");
    const status=pcstCreate("p","remoteJoiningStatus",statusText);status.dataset.careerStatus="true";status.setAttribute("role","status");status.setAttribute("aria-live","polite");body.append(status);
    const actions=pcstCreate("div","remoteJoiningActions");const confirm=pcstCreate("button","compactButton r78-btn--primary",ready?"CONTINUE TO TRANSFER CHALLENGE":mine?"MY CAREER STARTED ✓":`I STARTED AT ${String(ownClub).toUpperCase()}`);confirm.type="button";confirm.disabled=busy||(!ready&&mine);confirm.addEventListener("click",()=>void (ready?pcstOpenTransferChallenge():pcstAcknowledge()));actions.append(confirm);const refreshButton=pcstCreate("button","compactButton","REFRESH");refreshButton.type="button";refreshButton.disabled=busy;refreshButton.addEventListener("click",()=>void pcstRefresh().catch(error=>pcstReport("Unable to refresh Shared Career Start",error)));actions.append(refreshButton);body.append(actions);
    pcstStage(overlay,body,{setup,role,ownClub,status:status,idle:!lastError&&!ready&&!mine});
  }
  // r50: opening Career Start loads its protocol, provider and styles on first use. The tapped control
  // shows OPENING… and stays disabled until the panel is up, and overlapping opens share one attempt,
  // so a slow first load never looks like a tap that did nothing.
  // r86: a Showdown confirmed on r86 or later first shows this manager's Special Player reveal (js/specialPlayerReveal.js),
  // outside the 25 s Career Start timeout. Its full-screen stage stays until Career Start (or the Transfer Challenge) is up
  // under it, so nothing in between shows. Any failure means no reveal.
  async function pcstSpecialPlayerFirst(){
    try{
      // The confirmed Setup is already loaded (it is what offers this control), so the reveal waits on no Career Start dependency.
      const api=setupApi||root.CareerModeProductionSharedShowdownSetup;
      if(!api||!pcstConfirmed()||pcstReadyHere())return null;
      let timer;const loaded=await Promise.race([pcstLoadScript("special-player-reveal","js/specialPlayerReveal.js",()=>root.CareerModeSpecialPlayerReveal),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
      if(!loaded)return null;
      return await root.CareerModeSpecialPlayerReveal.runBeforeCareerStart(api);
    }catch(_error){return null;}
  }
  function pcstCloseReveal(){const stage=revealStage;revealStage=null;if(stage)try{stage.close();}catch(_error){}return true;}
  function pcstOpenPanel(){
    if(openPromise)return openPromise;
    const run=pcstSpecialPlayerFirst().then(stage=>{revealStage=stage;return pcstWithTimeout(pcstOpenPanelNow);}).finally(pcstCloseReveal);openPromise=run;
    run.finally(()=>{if(openPromise===run)openPromise=null;pcstDecorateControl();}).catch(()=>{});
    try{pcstDecorateControl();}catch(_error){}
    return run;
  }
  function pcstEnsurePanel(){let overlay=root.document.getElementById(PANEL_ID);if(!overlay){overlay=pcstCreate("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Shared Career Start");const shell=pcstCreate("div","remoteJoiningShell"),header=pcstCreate("div","remoteJoiningHeader");header.append(pcstCreate("strong","","CAREER MODE SHOWDOWN // 17"));const close=pcstCreate("button","remoteJoiningDismiss","×");close.type="button";close.setAttribute("aria-label","Close Career Start");close.addEventListener("click",pcstClosePanel);header.append(close);const body=pcstCreate("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}return overlay;}
  // r80 resume (G7): a Career Start this page already holds as READY for the current Setup (both managers started) is not
  // shown again: it goes straight on to the Transfer Challenge, as its automatic continue does, with no read and no frame of
  // this panel. The automatic continue fires once per page, so re-entering the game from Home used to stop here.
  function pcstReadyHere(){return Boolean(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()));}
  async function pcstOpenPanelNow(request){
    pcstDeactivateSetupPresentation();await request.wait(pcstEnsureDependencies());
    if(!pcstPanelOpen()&&pcstReadyHere()&&await request.wait(pcstOpenTransferChallenge()))return pcstCloseReveal();
    const overlay=pcstEnsurePanel();stageRetries=0;stageFailed=false;retryFailed=false;stageFailed=!(await request.wait(pcstClubBackdrop()));overlay.classList.remove("hidden");pcstRender();pcstCloseReveal();await request.wait(pcstRefresh(false,request));return true;
  }
  function pcstClosePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay){overlay.classList.add("hidden");pcstStageOff(overlay);}return true;}
  function pcstPresentationOwnsControl(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function pcstClearControlOwnership(button){if(button&&button.dataset.sharedCareerStart==="true")delete button.dataset.sharedCareerStart;return false;}
  function pcstDecorateControl(){
    const button=root.document&&root.document.getElementById(CONTROL_ID);if(!button)return false;
    if(!pcstConfirmed()||pcstPresentationOwnsControl())return pcstClearControlOwnership(button);
    const opening=Boolean(openPromise),label=opening?"OPENING CAREER START…":"CONTINUE TO CAREER START";
    if(button.textContent!==label)button.textContent=label;
    if(button.disabled!==opening)button.disabled=opening;
    if(opening)button.setAttribute("aria-busy","true");else if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");
    if(button.classList.contains("hidden"))button.classList.remove("hidden");
    if(button.getAttribute("aria-disabled")!==String(opening))button.setAttribute("aria-disabled",String(opening));
    if(button.dataset.sharedCareerStart!=="true")button.dataset.sharedCareerStart="true";
    return true;
  }
  function pcstCapture(event){const button=event.target&&event.target.closest&&event.target.closest(`#${CONTROL_ID}`);if(!button||button.dataset.sharedCareerStart!=="true"||!pcstConfirmed())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pcstOpenPanel().catch(error=>pcstReport("Unable to open Shared Career Start",error));}
  function pcstWaitingKey(){if(!view||!view.state||pcstReady()||!pcstOwnAcknowledged(view)||!pcstPanelOpen())return "";return `${view.managerRole}|${view.state.revision}`;}
  function pcstFastPollDue(){const key=pcstWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  // RS-01 (r87): the view never carries the rivalry id (neither the Career Start projection nor its setup half), so the path
  // comes from the Shared Setup state, as pcstAutoContinueKey does. Before, the listener watched nothing and the first manager
  // to tap "I STARTED" read the career document from the server every 3 s for up to 3 minutes.
  function pcstWaitPath(){const rivalryId=String(view?.setup?.rivalryId||view?.rivalryId||pcstSetupState()?.rivalryId||"").trim();return rivalryId?`rivalries/${rivalryId}/careerStart/authoritative`:null;}
  function pcstWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pcstWaitingKey()?pcstWaitPath():null);}catch(_error){path=null;}budget.watchWaitPoint("career-start",path,pcstWaitWake);}
  // While that listener is healthy the partner's acknowledgement wakes this screen through it (pcstWaitWake), so the 3 s check stands
  // down, as the Transfer screen's does (pstcWaitHealthy); the 15 s check and the listener's own server confirms keep running.
  function pcstWaitHealthy(){const path=pcstWaitPath(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(path&&live?.watchHealthy&&live.watching===path);}
  function pcstWaitWake(){if(!busy){void pcstTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pcstTick(true);},400);}
  function pcstFastTick(){pcstWatchWait();if(root.document&&root.document.visibilityState==="hidden")return;if(busy||!pcstFastPollDue()||pcstWaitHealthy())return;void pcstTick(true);}
  async function pcstTick(light=false){
    if(root.document&&root.document.visibilityState==="hidden")return false;
    if(pcstReady()){pcstStopPolling();return false;}
    try{if(!setupApi&&root.CareerModeProductionSharedShowdownSetup)setupApi=root.CareerModeProductionSharedShowdownSetup;pcstDecorateControl();const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay&&!overlay.classList.contains("hidden")&&pcstConfirmed()&&!busy)await pcstRefresh(light===true);return true;}catch(_error){return false;}
  }
  function pcstInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pcstCapture,true);const observer=new MutationObserver(()=>pcstDecorateControl());observer.observe(root.document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled","class"]});}if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pcstTick(),POLL_MS);root.setInterval(pcstFastTick,FAST_POLL_MS);}void pcstEnsureDependencies().then(()=>pcstTick()).catch(()=>{});return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-career-start",productionEnabled:true,requiresConfirmedSharedSetup:true,requiresExactActiveSession:true,twoManagerAcknowledgement:true,routesReadyStateToTransferChallenge:true,reconcilesConcurrentAcknowledgement:true,persistentVisibleErrors:true,canonicalStorageMutation:false,billingRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcstWaitingKey()),autoContinuesWhenBothStarted:true,visibilityAwarePolling:true,serializedOperations:true,terminalPollingStops:true,deactivatesSetupPresentation:true,install:pcstInstall,openPanel:pcstOpenPanel,closePanel:pcstClosePanel,refresh:pcstRefresh,openTransferChallenge:pcstOpenTransferChallenge,errorText:pcstErrorText,careerStartStage:"option-b",fitHold:pcstFitHold,layoutAudit:pcstStageAudit,getState:()=>view});
});

```

## FILE: js/careerStartMarker.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeCareerStartMarker=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // Career start marker (owner decision): the first real START (the one-time START REAL CAREER checkmark on the seasons
  // screen; Nik's app before he redeems a first real pairing code) writes accounts/{uid}/careerStart/current. It names the
  // Showdowns already in that account's career index (hiddenRivalryIds, oldest first): the test games, which stay stored
  // and are never shown again (r79 PR4, Nik 2026-10-17: the SHOW TEST SHOWDOWNS AGAIN switch is gone, so `active` no
  // longer matters). The account is REAL once this document exists. Exact gets and one small transaction only; loaded
  // lazily by the career screens, Settings and the modes module, never at startup.
  const DOC_ID="current",OBJECT_TYPE="careerStart",INDEX_CAPACITY=500,RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const CHANGE_EVENT="career-mode-career-start-change";
  const markers=new Map(),failedReads=new Set(),settled=new Map();
  let markerEpoch=0,state=Object.freeze({status:"unknown",accountId:null,epoch:0});

  function csmError(code,message){const error=new Error(message);error.code=code;return error;}
  function csmFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(csmFreeze);Object.freeze(value);}return value;}
  function csmCanonicalize(value){if(value===null||value===undefined)return null;if(value&&typeof value.toMillis==="function")return{$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(csmCanonicalize);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=csmCanonicalize(value[key]);return out;}return value;}
  async function csmSha256(value,cryptoImpl){
    const crypto=cryptoImpl||root.crypto;
    if(!crypto?.subtle||typeof crypto.subtle.digest!=="function")throw csmError("CAREER_START_CRYPTO_UNAVAILABLE","Secure browser hashing is unavailable.");
    const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(csmCanonicalize(value)))));
    return "sha256:"+Array.from(digest,byte=>byte.toString(16).padStart(2,"0")).join("");
  }
  function csmMillis(value){try{const ms=value&&typeof value.toMillis==="function"?value.toMillis():null;return Number.isFinite(ms)?ms:null;}catch(_error){return null;}}
  function csmIdsValid(ids,min,max){return Array.isArray(ids)&&ids.length>=min&&ids.length<=max&&ids.every(id=>typeof id==="string"&&RIVALRY_ID.test(id))&&new Set(ids).size===ids.length;}
  function csmEnvelopeValid(value,objectType,objectId){return Boolean(value&&value.schemaVersion===1&&value.objectType===objectType&&value.objectId===objectId&&value.lifecycleState==="live"&&Number.isInteger(value.revision)&&value.revision>=0&&typeof value.contentHash==="string");}

  const NONE=csmFreeze({status:"none",active:false,hiddenRivalryIds:[],startedAt:null,revision:null});
  function parseMarker(value){
    if(!csmEnvelopeValid(value,OBJECT_TYPE,DOC_ID))throw csmError("CAREER_START_INVALID","The career start marker is invalid.");
    const data=value.data||{};
    const startedAt=csmMillis(data.startedAt);
    if(Object.keys(data).sort().join(",")!=="active,hiddenRivalryIds,startedAt"||typeof data.active!=="boolean"||startedAt===null||!csmIdsValid(data.hiddenRivalryIds,0,INDEX_CAPACITY))throw csmError("CAREER_START_INVALID","The career start marker is invalid.");
    // startedAt is the server time of the first press (immutable), so toggles never move the shown date.
    return csmFreeze({status:"ready",active:data.active,hiddenRivalryIds:[...data.hiddenRivalryIds],startedAt,revision:value.revision,contentHash:value.contentHash});
  }
  // The ids the career screens leave out. r79 PR4: always, whatever `active` says (an account that switched the retired
  // SHOW TEST SHOWDOWNS AGAIN on keeps its test games stored but hidden).
  function hiddenRivalryIds(marker){return marker&&marker.status==="ready"?marker.hiddenRivalryIds.slice():[];}
  // r80 (Nik's missing first real game, 2026-10-18): r79's Home START could reopen an old code, or make one for a code-less
  // shell, without the checkmark (js/productionSharedJourneyEntry.js, fixed there), so the pair's first r79 game was played
  // as a test Showdown and the checkmark at the next START named it here. A marker made on r79 (see below) shows again the
  // Showdowns it hides that were FINISHED (closed with a Terminal Close) on r79 or later: newest first, at most
  // REVEAL_SCAN_LIMIT exact gets of rivalries/{id}, caching successful scans per account and marker per page, stopping at
  // the first one last written before r79 went live. A failed read rejects the scope (fail closed) and is not cached, so
  // the career screens show unavailable and retry on the next open. A missing or foreign document keeps it and every
  // older one hidden. Read-only: the marker, the index and every Showdown stay exactly as they are.
  // Codex #936: only markers made BEFORE R80_PREVENTION_MS (2026-10-19 12:00 UTC). From r80 on a test-mode account cannot
  // play a test code by accident (Home START, CONTINUE CAREER and the reload go through the checkmark), so a later marker
  // hides only deliberate Settings > START TEST RUN games, and those stay hidden. Nik's and Daniel's markers were both
  // written on r79 (2026-10-18, after 17:17:45 UTC), inside the window. A START TEST RUN game finished on r79 before an
  // account's real start still shows (nothing in the data tells it from the leaked game; the owner's call).
  const R79_LIVE_MS=Date.UTC(2026,9,18,17,17,45),R80_PREVENTION_MS=Date.UTC(2026,9,19,12,0,0),REVEAL_SCAN_LIMIT=10;
  const reveals=new Map();
  function careerHiddenRivalryIds({marker,firestore,firebaseSdk,accountId}={}){
    const hidden=hiddenRivalryIds(marker);
    if(!hidden.length||!(marker.startedAt>=R79_LIVE_MS&&marker.startedAt<R80_PREVENTION_MS)||!firestore||typeof firebaseSdk?.doc!=="function"||typeof firebaseSdk.getDoc!=="function")return Promise.resolve(hidden);
    const key=`${accountId}|${marker.startedAt}|${marker.contentHash}`;
    if(reveals.has(key))return reveals.get(key);
    const promise=(async()=>{
      const shown=new Set();
      for(const id of hidden.slice(-REVEAL_SCAN_LIMIT).reverse()){
        const snapshot=await firebaseSdk.getDoc(firebaseSdk.doc(firestore,"rivalries",id)),value=snapshot.exists()?snapshot.data():null;
        const written=csmMillis(value?.updatedAt);
        if(!value||value.objectType!=="rivalry"||value.objectId!==id||written===null||written<R79_LIVE_MS)break;
        if(value.data?.mode!=="test"&&value.data?.connectionState==="closed"&&Object.hasOwn(value.data,"terminalClose"))shown.add(id);
      }
      return hidden.filter(id=>!shown.has(id));
    })();
    reveals.set(key,promise);
    promise.catch(()=>{if(reveals.get(key)===promise)reveals.delete(key);});
    return promise;
  }
  function parseIndexHead(value){
    if(!csmEnvelopeValid(value,"careerIndex","current"))throw csmError("CAREER_START_INDEX_INVALID","The career index is invalid.");
    const data=value.data||{};
    if(Object.keys(data).sort().join(",")!=="rivalryIds,sealedPageCount"||!csmIdsValid(data.rivalryIds,1,INDEX_CAPACITY)||!Number.isInteger(data.sealedPageCount)||data.sealedPageCount<0)throw csmError("CAREER_START_INDEX_INVALID","The career index is invalid.");
    return {rivalryIds:[...data.rivalryIds],sealedPageCount:data.sealedPageCount};
  }
  async function csmEnvelope({revision,parentRevision,priorContentHash,now,accountId,deviceId,data,hashData=data,cryptoImpl}){
    const contentHash=await csmSha256({objectType:OBJECT_TYPE,objectId:DOC_ID,revision,data:hashData},cryptoImpl);
    return {schemaVersion:1,objectType:OBJECT_TYPE,objectId:DOC_ID,revision,parentRevision,lifecycleState:"live",contentHash,priorContentHash,updatedAt:now,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};
  }
  // Pure plans (the Rules check the same things): create names exactly the career index head, never a paged index.
  // startedAt is the provider's serverTimestamp() sentinel (the Rules require request.time); it is hashed as a marker.
  async function planCreate({indexValue,accountId,deviceId,now,serverTimestamp,cryptoImpl}){
    let ids=[];
    if(indexValue){const head=parseIndexHead(indexValue);if(head.sealedPageCount>0)throw csmError("CAREER_START_INDEX_PAGED","This career is too long to mark from here.");ids=head.rivalryIds;}
    if(!serverTimestamp)throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
    return csmEnvelope({revision:0,parentRevision:null,priorContentHash:null,now,accountId,deviceId,data:{hiddenRivalryIds:ids,active:true,startedAt:serverTimestamp},hashData:{hiddenRivalryIds:ids,active:true,startedAt:{$serverTimestamp:true}},cryptoImpl});
  }
  async function planToggle({markerValue,active,accountId,deviceId,now,cryptoImpl}){
    const before=parseMarker(markerValue);
    return csmEnvelope({revision:before.revision+1,parentRevision:before.revision,priorContentHash:before.contentHash,now,accountId,deviceId,data:{hiddenRivalryIds:[...before.hiddenRivalryIds],active:active===true,startedAt:markerValue.data.startedAt},cryptoImpl});
  }

  function csmRef(sdk,firestore,accountId,...path){return sdk.doc(firestore,"accounts",accountId,...path);}
  function csmPublish(accountId,marker,changed){
    const published=Promise.resolve(marker);markers.set(accountId,published);settled.set(accountId,{status:marker.status,promise:published});
    if(changed)markerEpoch+=1;
    state=Object.freeze({status:marker.status,accountId,epoch:markerEpoch});
    if(changed&&typeof root.CustomEvent==="function")try{root.dispatchEvent?.(new root.CustomEvent(CHANGE_EVENT,{detail:state}));}catch(_error){}
    return marker;
  }
  // One exact get per account per page load. A failed read is not kept, so the next screen load asks again.
  // r80 (real vs test): recheckNone (the career screens) asks again while the answer is "no marker": that account's career
  // pages show nothing (every Showdown it holds is a test run), so a real career started meanwhile on another browser must
  // not stay hidden here. A marker, once read, is kept (it is never deleted).
  function readMarker({firestore,firebaseSdk,accountId,recheckNone=false}={}){
    if(typeof accountId!=="string"||!accountId)return Promise.reject(csmError("CAREER_START_AUTH_REQUIRED","Sign in before continuing."));
    const prior=settled.get(accountId)||null;
    if(markers.has(accountId)&&!(recheckNone===true&&prior&&prior.status==="none"&&markers.get(accountId)===prior.promise))return markers.get(accountId);
    const promise=(async()=>{
      if(!firestore||typeof firebaseSdk?.doc!=="function"||typeof firebaseSdk.getDoc!=="function")throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
      const snapshot=await firebaseSdk.getDoc(csmRef(firebaseSdk,firestore,accountId,"careerStart",DOC_ID));
      const marker=snapshot.exists()?parseMarker(snapshot.data()):NONE;
      // r80 (fail-closed): the career screens show nothing while the marker is unknown. A read that answers after a failed
      // one, or a marker found after "no marker", changes what they show: count it as a change so cached careers drop and
      // mounted screens reload.
      const recovered=failedReads.delete(accountId);
      if(markers.get(accountId)===promise){
        settled.set(accountId,{status:marker.status,promise});
        if(recovered||(prior&&prior.status==="none"&&marker.status==="ready"))return csmPublish(accountId,marker,true);
        state=Object.freeze({status:marker.status,accountId,epoch:markerEpoch});
      }
      return marker;
    })();
    markers.set(accountId,promise);
    promise.catch(()=>{failedReads.add(accountId);if(markers.get(accountId)===promise)markers.delete(accountId);});
    return promise;
  }

  // Signed-in services for this page (the same ones the career screens use); a device id only for writes.
  async function resolveServices({write=false}={}){
    const runtime=root.CareerModeProductionFirebaseRuntime,account=root.CareerModeSparkConnectedAccount;
    const accountState=account?.getState?.();
    if(!runtime||!accountState?.connected||!accountState.accountId)throw csmError("CAREER_START_AUTH_REQUIRED","Sign in before continuing.");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    const user=services?.auth?.currentUser;
    if(!services?.ok||!user||user.uid!==accountState.accountId)throw csmError("CAREER_START_AUTH_REQUIRED","The signed-in account is unavailable.");
    const sdk=(root.CareerModeFirestoreBudget?.meterSdk||(s=>s))(services.firestoreSdk?.getDoc?services.firestoreSdk:{...services.firestoreSdk,getDoc:(await import(runtime.firebaseFirestoreModule)).getDoc});
    const out={firestore:services.firestore,firebaseSdk:sdk,accountId:user.uid};
    if(write){
      const pairing=root.CareerModeSparkPrivatePairing;
      if(typeof pairing?.initialize==="function")await pairing.initialize();
      const pairingState=pairing?.getState?.();
      if(!pairingState?.registered||!pairingState.deviceId)throw csmError("CAREER_START_DEVICE_REQUIRED",root.CareerModeFirestoreBudget?.quotaMessage?.()||"This browser is not ready yet.");
      out.deviceId=pairingState.deviceId;
    }
    return out;
  }
  async function readCurrentMarker(){return readMarker(await resolveServices());}

  // A Showdown that is still being played (or waiting for the other manager) is part of the real career. Checked
  // inside the write transaction: the pair link read is part of it, so a Showdown started in another tab meanwhile
  // makes the transaction retry and refuse. A rivalry this account cannot read is not its unfinished Showdown.
  // r79 PR4: a pending rivalry whose code has expired or was used up is finished (nobody can join it any more), so an
  // old test code never blocks the first real START. An invite that cannot be read keeps it unfinished (fail closed).
  // Codex #908: this device's clock may run ahead of the server, so a code counts as expired only 10 minutes after its expiry.
  const INVITE_CLOCK_MARGIN_MS=10*60*1000;
  function csmInviteOpen(value,nowMs){const expires=csmMillis(value?.data?.expiresAt);return value?.data?.state==="open"&&(expires===null||expires>nowMs-INVITE_CLOCK_MARGIN_MS);}
  async function csmAssertNoUnfinishedShowdown(transaction,sdk,firestore,accountId){
    const pair=await transaction.get(csmRef(sdk,firestore,accountId,"pairLinks","current"));
    const rivalryId=pair.exists()?pair.data()?.data?.rivalryId:null;
    let connectionState=null,codeOpen=true;
    if(typeof rivalryId==="string"&&RIVALRY_ID.test(rivalryId)){
      try{const rivalry=await transaction.get(sdk.doc(firestore,"rivalries",rivalryId));connectionState=rivalry.exists()?rivalry.data()?.data?.connectionState??null:null;}
      catch(_error){connectionState=null;}
      if(connectionState==="pending-pair"){
        try{const invite=await transaction.get(sdk.doc(firestore,"rivalries",rivalryId,"invites",rivalryId));codeOpen=invite.exists()&&csmInviteOpen(invite.data(),Date.now());}
        catch(_error){codeOpen=true;}
      }
    }
    if(connectionState==="active"||(connectionState==="pending-pair"&&codeOpen))throw csmError("CAREER_START_SHOWDOWN_UNFINISHED","Finish or end the current Showdown before starting your real career.");
  }
  async function csmWrite(options,mode,active){
    const o=options&&options.firestore?options:await resolveServices({write:true});
    const {firestore,firebaseSdk:sdk,accountId,deviceId,cryptoImpl}=o;
    if(typeof sdk?.runTransaction!=="function"||typeof sdk.doc!=="function")throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
    const markerRef=csmRef(sdk,firestore,accountId,"careerStart",DOC_ID),indexRef=csmRef(sdk,firestore,accountId,"careerIndex","current");
    const now=sdk.Timestamp?.fromMillis?sdk.Timestamp.fromMillis(Date.now()):null;
    if(!now)throw csmError("CAREER_START_PROVIDER_UNAVAILABLE","The career service is unavailable.");
    const outcome=await sdk.runTransaction(firestore,async transaction=>{
      const markerSnapshot=await transaction.get(markerRef);
      const existing=markerSnapshot.exists()?parseMarker(markerSnapshot.data()):null;
      const wanted=mode==="start"?true:active===true;
      if(existing&&existing.active===wanted)return {marker:existing,changed:false};
      if(!existing&&mode!=="start")throw csmError("CAREER_START_MISSING","Start your real career first.");
      let value;
      if(existing)value=await planToggle({markerValue:markerSnapshot.data(),active:wanted,accountId,deviceId,now,cryptoImpl});
      else{
        await csmAssertNoUnfinishedShowdown(transaction,sdk,firestore,accountId);
        const indexSnapshot=await transaction.get(indexRef);
        value=await planCreate({indexValue:indexSnapshot.exists()?indexSnapshot.data():null,accountId,deviceId,now,serverTimestamp:typeof sdk.serverTimestamp==="function"?sdk.serverTimestamp():null,cryptoImpl});
      }
      transaction.set(markerRef,value);
      // The server fills startedAt on create; until the next read this page shows the local time of the press.
      return {marker:parseMarker(existing?value:{...value,data:{...value.data,startedAt:now}}),changed:true};
    });
    return csmPublish(accountId,outcome.marker,outcome.changed);
  }
  function startRealCareer(options){return csmWrite(options,"start",true);}
  function setActive(active,options){return csmWrite(options,"toggle",active===true);}
  function clearCache(){markers.clear();failedReads.clear();settled.clear();reveals.clear();markerEpoch+=1;state=Object.freeze({status:"unknown",accountId:null,epoch:markerEpoch});}

  return Object.freeze({contractVersion:2,feature:"cms-career-start-marker",hiddenWhateverActive:true,changeEvent:CHANGE_EVENT,documentPath:"accounts/{uid}/careerStart/current",
    readMarker,readCurrentMarker,hiddenRivalryIds,careerHiddenRivalryIds,revealSinceEpochMs:R79_LIVE_MS,revealBeforeEpochMs:R80_PREVENTION_MS,startRealCareer,setActive,clearCache,parseMarker,planCreate,planToggle,
    epoch:()=>markerEpoch,getState:()=>state,listPermissionRequired:false,deletionRequired:false,billingRequired:false});
});

```

## FILE: js/sharedTransferChallenge.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r8";
  const WINDOW_MS=15*60*1000;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const STATE_KEYS=Object.freeze([
    "schemaVersion","runtimeRevision","seasonNumber","coordinatorRole","phase","revision",
    "startedAtEpochMs","endedAtEpochMs","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "inputs","receipts","contentHash"
  ]);

  function stcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stcPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function stcExact(value,keys,code="TRANSFER_VALUE_INVALID"){
    if(!stcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stcFail(code);
  }
  function stcClone(value){return JSON.parse(JSON.stringify(value));}
  function stcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stcFreeze);Object.freeze(value);}return value;}
  function stcCanonical(value){
    if(Array.isArray(value))return `[${value.map(stcCanonical).join(",")}]`;
    if(stcPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stcCanonical(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  async function stcHash(value,cryptoImpl){
    if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stcFail("TRANSFER_CRYPTO_UNAVAILABLE");
    const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stcCanonical(value)));
    return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;
  }
  function stcRole(value){if(!ROLES.includes(value))stcFail("TRANSFER_ROLE_INVALID");return value;}
  function stcEpoch(value){if(!Number.isSafeInteger(value)||value<0)stcFail("TRANSFER_CLOCK_INVALID");return value;}
  function stcRoleList(value,code){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stcFail(code);return value;}
  function stcCatalogIds(values,code){
    if(!Array.isArray(values)||!values.length||new Set(values).size!==values.length||values.some(value=>typeof value!=="string"||!value||value!==value.trim()))stcFail(code);
    return new Set(values);
  }
  function stcConfirmedSetup(value){
    if(!stcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6)stcFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stcFail("TRANSFER_SETUP_INVALID");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stcFail("TRANSFER_SETUP_INVALID");
    if(!value.clubs||typeof value.clubs.playerOne!=="string"||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerOne||!value.clubs.playerTwo||value.clubs.playerOne===value.clubs.playerTwo)stcFail("TRANSFER_SETUP_INVALID");
    return value;
  }
  function stcCareerReady(value){
    if(!stcPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2)stcFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stcFail("TRANSFER_CAREER_START_NOT_READY");
    return value;
  }
  function stcNormalizeGuesses(value,leagueIds,nationalityIds){
    if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_GUESSES_INVALID");
    const seen=new Set();
    return value.map(item=>{
      stcExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");
      if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_GUESSES_INVALID");
      seen.add(item.slot);
      if(item.type!=="league"&&item.type!=="nationality")stcFail("TRANSFER_GUESSES_INVALID");
      const catalog=item.type==="league"?leagueIds:nationalityIds;
      if(!catalog.has(item.valueId))stcFail("TRANSFER_GUESSES_INVALID");
      return {slot:item.slot,type:item.type,valueId:item.valueId};
    }).sort((a,b)=>a.slot-b.slot);
  }
  const OVERALL_MIN=30,OVERALL_MAX=99;
  function stcPlainHasOverall(item){return Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall"));}
  function stcOverallValid(value){return Number.isInteger(value)&&value>=OVERALL_MIN&&value<=OVERALL_MAX;}
  const POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  function stcNormalizeSignings(value,leagueIds,nationalityIds){
    if(!Array.isArray(value)||value.length>3)stcFail("TRANSFER_SIGNINGS_INVALID");
    const seen=new Set();
    return value.map(item=>{
      // r87 (Nik 2026-10-30): a signing also carries the player's FIFA 17 overall (30-99), entered by his own manager and never
      // guessed; Russian Roster Roulette uses it for the board from season 2. Rows locked before r87 have none.
      // r87 (Nik 2026-10-30 16:53 UTC): and his FIFA 17 position (own only, never guessed), so the board can place him.
      const hasOverall=stcPlainHasOverall(item),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position"));
      stcExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[])],"TRANSFER_SIGNINGS_INVALID");
      if(hasOverall&&!stcOverallValid(item.overall))stcFail("TRANSFER_SIGNINGS_INVALID");
      if(hasPosition&&!POSITIONS.includes(item.position))stcFail("TRANSFER_SIGNINGS_INVALID");
      if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||seen.has(item.slot))stcFail("TRANSFER_SIGNINGS_INVALID");
      seen.add(item.slot);
      const name=String(item.name||"").trim();
      if(!name||name.length>80||name!==item.name)stcFail("TRANSFER_SIGNINGS_INVALID");
      if(!leagueIds.has(item.leagueId)||!nationalityIds.has(item.nationalityId))stcFail("TRANSFER_SIGNINGS_INVALID");
      const row={slot:item.slot,name,leagueId:item.leagueId,nationalityId:item.nationalityId};
      if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;
      return row;
    }).sort((a,b)=>a.slot-b.slot);
  }
  function stcInputs(value){
    stcExact(value,ROLES,"TRANSFER_STATE_INVALID");
    for(const role of ROLES){
      stcExact(value[role],["guesses","signings"],"TRANSFER_STATE_INVALID");
      if(value[role].guesses!==null&&!Array.isArray(value[role].guesses))stcFail("TRANSFER_STATE_INVALID");
      if(value[role].signings!==null&&!Array.isArray(value[role].signings))stcFail("TRANSFER_STATE_INVALID");
    }
    return value;
  }
  function stcReceipt(value){
    stcExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"TRANSFER_STATE_INVALID");
    if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||typeof value.type!=="string"||!HASH.test(value.commandHash))stcFail("TRANSFER_STATE_INVALID");
    return value;
  }
  async function stcVerifyState(value,leagueIds,nationalityIds,cryptoImpl){
    stcExact(value,STATE_KEYS,"TRANSFER_STATE_INVALID");
    const state=stcClone(value),hash=state.contentHash;delete state.contentHash;
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!ROLES.includes(value.coordinatorRole)||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||!HASH.test(hash))stcFail("TRANSFER_STATE_INVALID");
    stcEpoch(value.startedAtEpochMs);
    if(value.endedAtEpochMs!==null)stcEpoch(value.endedAtEpochMs);
    stcRoleList(value.endRequestedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.guessLockedRoles,"TRANSFER_STATE_INVALID");stcRoleList(value.signingLockedRoles,"TRANSFER_STATE_INVALID");
    stcInputs(value.inputs);
    if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)stcFail("TRANSFER_STATE_INVALID");
    value.receipts.forEach(stcReceipt);
    if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length)stcFail("TRANSFER_STATE_INVALID");
    if(value.receipts.some((receipt,index)=>receipt.baseRevision!==index))stcFail("TRANSFER_STATE_INVALID");
    for(const role of ROLES){
      const roleInput=value.inputs[role];
      if(roleInput.guesses!==null)stcNormalizeGuesses(roleInput.guesses,leagueIds,nationalityIds);
      if(roleInput.signings!==null)stcNormalizeSignings(roleInput.signings,leagueIds,nationalityIds);
      if(value.guessLockedRoles.includes(role)!==(roleInput.guesses!==null))stcFail("TRANSFER_STATE_INVALID");
      if(value.signingLockedRoles.includes(role)!==(roleInput.signings!==null))stcFail("TRANSFER_STATE_INVALID");
    }
    if(value.phase==="WINDOW_OPEN"&&(value.guessLockedRoles.length||value.signingLockedRoles.length||value.endedAtEpochMs!==null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.signingLockedRoles.length||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2||value.endedAtEpochMs===null))stcFail("TRANSFER_STATE_INVALID");
    if(await stcHash(state,cryptoImpl)!==hash)stcFail("TRANSFER_STATE_HASH_MISMATCH");
    return stcFreeze(stcClone(value));
  }
  function stcCommand(value,leagueIds,nationalityIds){
    if(!stcPlain(value)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||typeof value.type!=="string")stcFail("TRANSFER_COMMAND_INVALID");
    const common=["type","operationId","baseRevision"];
    if(value.type==="start-window"||value.type==="request-end-window"||value.type==="advance-expired-window")stcExact(value,common,"TRANSFER_COMMAND_INVALID");
    else if(value.type==="lock-guesses"){stcExact(value,[...common,"guesses"],"TRANSFER_COMMAND_INVALID");return {...value,guesses:stcNormalizeGuesses(value.guesses,leagueIds,nationalityIds)};}
    else if(value.type==="lock-signings"){stcExact(value,[...common,"signings"],"TRANSFER_COMMAND_INVALID");return {...value,signings:stcNormalizeSignings(value.signings,leagueIds,nationalityIds)};}
    else stcFail("TRANSFER_COMMAND_INVALID");
    return {...value};
  }
  function stcEvaluateRole(role,state){
    stcRole(role);
    if(state.phase!=="COMPLETED")stcFail("TRANSFER_VERDICT_NOT_READY");
    const opponent=role==="playerOne"?"playerTwo":"playerOne";
    const guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{
      const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));
      return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};
    });
  }

  async function stcCreateProtocol({leagueIds,nationalityIds,cryptoImpl=root.crypto}={}){
    const leagues=stcCatalogIds(leagueIds,"TRANSFER_LEAGUE_CATALOG_INVALID"),nationalities=stcCatalogIds(nationalityIds,"TRANSFER_NATIONALITY_CATALOG_INVALID");
    async function stcSeal(core){return stcFreeze({...stcClone(core),contentHash:await stcHash(core,cryptoImpl)});}
    async function stcVerifyProtocolState(value){return stcVerifyState(value,leagues,nationalities,cryptoImpl);}
    async function stcApply({state=null,setup,careerStart,seasonNumber,actorRole,command,nowEpochMs}){
      const confirmed=stcConfirmedSetup(setup);stcCareerReady(careerStart);const role=stcRole(actorRole),now=stcEpoch(nowEpochMs),cmd=stcCommand(command,leagues,nationalities);
      if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>confirmed.totalSeasons)stcFail("TRANSFER_SEASON_INVALID");
      const current=state?await stcVerifyProtocolState(state):null;
      if(current&&current.seasonNumber!==seasonNumber)stcFail("TRANSFER_SEASON_MISMATCH");
      if(current&&current.coordinatorRole!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_MISMATCH");
      const commandHash=await stcHash({actorRole:role,...cmd},cryptoImpl);
      if(current){
        const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);
        if(prior){
          if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)stcFail("TRANSFER_IDEMPOTENCY_CONFLICT");
          return stcFreeze({ok:true,idempotent:true,state:current});
        }
      }
      const revision=current?current.revision:0;
      if(cmd.baseRevision!==revision)stcFail("TRANSFER_STALE_BASE_REVISION");
      if(!current&&cmd.type!=="start-window")stcFail("TRANSFER_NOT_STARTED");
      if(current&&cmd.type==="start-window")stcFail("TRANSFER_ALREADY_STARTED");
      if(current&&current.phase==="COMPLETED")stcFail("TRANSFER_ALREADY_COMPLETED");
      let core=current?stcClone(current):{
        schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,coordinatorRole:confirmed.coordinatorRole,
        phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],
        inputs:{playerOne:{guesses:null,signings:null},playerTwo:{guesses:null,signings:null}},receipts:[]
      };
      delete core.contentHash;
      if(cmd.type==="start-window"){
        if(role!==confirmed.coordinatorRole)stcFail("TRANSFER_COORDINATOR_REQUIRED");
        core.startedAtEpochMs=now;
      }else if(cmd.type==="request-end-window"){
        if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
        if(core.endRequestedRoles.includes(role))stcFail("TRANSFER_END_ALREADY_REQUESTED");
        core.endRequestedRoles.push(role);
        if(core.endRequestedRoles.length===2){core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;}
      }else if(cmd.type==="advance-expired-window"){
        if(core.phase!=="WINDOW_OPEN")stcFail("TRANSFER_PHASE_INVALID");
        if(now<core.startedAtEpochMs+WINDOW_MS)stcFail("TRANSFER_WINDOW_STILL_OPEN");
        core.phase="GUESS_ENTRY";core.endedAtEpochMs=now;
      }else if(cmd.type==="lock-guesses"){
        if(core.phase!=="GUESS_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
        if(core.guessLockedRoles.includes(role))stcFail("TRANSFER_GUESSES_ALREADY_LOCKED");
        core.inputs[role].guesses=cmd.guesses;core.guessLockedRoles.push(role);
        if(core.guessLockedRoles.length===2)core.phase="SIGNING_ENTRY";
      }else if(cmd.type==="lock-signings"){
        if(core.phase!=="SIGNING_ENTRY")stcFail("TRANSFER_PHASE_INVALID");
        if(core.signingLockedRoles.includes(role))stcFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");
        core.inputs[role].signings=cmd.signings;core.signingLockedRoles.push(role);
        if(core.signingLockedRoles.length===2)core.phase="COMPLETED";
      }
      core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});
      core.revision=revision+1;
      const next=await stcSeal(core);await stcVerifyProtocolState(next);
      return stcFreeze({ok:true,idempotent:false,state:next});
    }
    function stcProjectForRole(state,role){
      stcRole(role);const current=stcClone(state),opponent=role==="playerOne"?"playerTwo":"playerOne";
      if(current.phase!=="COMPLETED")current.inputs[opponent]={guesses:null,signings:null};
      const projection={
        schemaVersion:current.schemaVersion,runtimeRevision:current.runtimeRevision,seasonNumber:current.seasonNumber,coordinatorRole:current.coordinatorRole,
        phase:current.phase,revision:current.revision,startedAtEpochMs:current.startedAtEpochMs,endedAtEpochMs:current.endedAtEpochMs,
        endRequestedRoles:[...current.endRequestedRoles],guessLockedRoles:[...current.guessLockedRoles],signingLockedRoles:[...current.signingLockedRoles],
        managerRole:role,inputs:current.inputs,verdicts:current.phase==="COMPLETED"?{playerOne:stcEvaluateRole("playerOne",current),playerTwo:stcEvaluateRole("playerTwo",current)}:null
      };
      return stcFreeze(projection);
    }
    return stcFreeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,apply:stcApply,verifyState:stcVerifyProtocolState,projectForRole:stcProjectForRole,evaluateRole:(role,state)=>stcFreeze(stcEvaluateRole(role,state)),billingRequired:false,canonicalStorageMutation:false});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-transfer-challenge-protocol-factory",runtimeRevision:RUNTIME_REVISION,windowMs:WINDOW_MS,roles:ROLES,phases:PHASES,createProtocol:stcCreateProtocol,billingRequired:false,canonicalStorageMutation:false});
});

```

## FILE: js/sparkSharedTransferChallenge.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const protocol=typeof require==="function"?require("./sharedTransferChallenge.js"):root.CareerModeSharedTransferChallenge;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^transfer_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const PUBLIC_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision",
    "startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles",
    "operationIds","operationTypes","operationHashes","baseRevisions","actorRoles",
    "activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  const PRIVATE_KEYS=Object.freeze([
    "schemaVersion","objectType","rivalryId","seasonNumber","managerRole","guesses","signings",
    "guessLockedAt","signingLockedAt","activeSessionId","updatedAt","updatedByDeviceId"
  ]);
  // JOB-1051: a role document written by r66 has exactly PRIVATE_KEYS (no salts); a new one has PRIVATE_KEYS plus both salt keys.
  const SALT_KEYS=Object.freeze(["guessSalt","signingSalt"]);
  const SALT=/^[0-9a-f]{64}$/;
  const COMMAND_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);
  const CANONICAL_LEAGUE_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_LEAGUES)?root.FIFA17_TRANSFER_LEAGUES:[]).map(item=>item&&item.id).filter(Boolean));
  const CANONICAL_NATIONALITY_IDS=Object.freeze((Array.isArray(root.FIFA17_TRANSFER_NATIONALITIES)?root.FIFA17_TRANSFER_NATIONALITIES:[]).map(item=>item&&item.id).filter(Boolean));

  function stspFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stspResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"TRANSFER_PROVIDER_FAILED"});}
  function stspSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function stspPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function stspExact(value,keys,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!stspPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))stspFail(code);return value;}
  function stspClone(value){return JSON.parse(JSON.stringify(value));}
  function stspFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stspFreeze);Object.freeze(value);}return value;}
  function stspCanonical(value){if(Array.isArray(value))return `[${value.map(stspCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stspCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function stspHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(stspCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  // JOB-1051: 32 random bytes, hex. Stored only in the actor's own private role document (unreadable by the rival until COMPLETED).
  function stspNewSalt(cryptoImpl){if(!cryptoImpl||typeof cryptoImpl.getRandomValues!=="function")stspFail("TRANSFER_CRYPTO_UNAVAILABLE");return Array.from(cryptoImpl.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,"0")).join("");}
  function stspNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_RIVALRY_INVALID");return id;}
  function stspNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))stspFail("TRANSFER_SESSION_INVALID");return id;}
  function stspNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))stspFail("TRANSFER_DEVICE_INACTIVE");return id;}
  function stspNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))stspFail("TRANSFER_COMMAND_INVALID");return id;}
  function stspAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)stspFail("TRANSFER_AUTH_REQUIRED");return id;}
  function stspSeason(value,totalSeasons){const season=Number(value);if(!Number.isInteger(season)||season<1||season>totalSeasons)stspFail("TRANSFER_SEASON_INVALID");return season;}
  function stspEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)stspFail("TRANSFER_CLOCK_INVALID");return n;}
  function stspTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function stspTimestamp(sdk,epoch){if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.Timestamp.fromMillis(epoch);}
  function stspServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
  function stspValidateSdk(options){if(!options.firestore)stspFail("TRANSFER_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}if(!options.firebaseSdk.Timestamp||typeof options.firebaseSdk.Timestamp.fromMillis!=="function")stspFail("TRANSFER_PROVIDER_UNAVAILABLE");}
  function stspRoleList(value,code="TRANSFER_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))stspFail(code);return value;}
  function stspCatalog(){
    if(CANONICAL_LEAGUE_IDS.length!==36||CANONICAL_NATIONALITY_IDS.length!==164)stspFail("TRANSFER_CATALOG_UNAVAILABLE");
    return Object.freeze({leagueIds:new Set(CANONICAL_LEAGUE_IDS),nationalityIds:new Set(CANONICAL_NATIONALITY_IDS)});
  }
  function stspNormalizeGuesses(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_GUESSES_INVALID");const slots=new Set();
    return value.map(item=>{stspExact(item,["slot","type","valueId"],"TRANSFER_GUESSES_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_GUESSES_INVALID");slots.add(item.slot);if(item.type!=="league"&&item.type!=="nationality")stspFail("TRANSFER_GUESSES_INVALID");const allowed=item.type==="league"?catalog.leagueIds:catalog.nationalityIds;if(!allowed.has(item.valueId))stspFail("TRANSFER_GUESSES_INVALID");return {slot:item.slot,type:item.type,valueId:item.valueId};}).sort((a,b)=>a.slot-b.slot);
  }
  function stspNormalizeSignings(value,catalog){
    if(!Array.isArray(value)||value.length>3)stspFail("TRANSFER_SIGNINGS_INVALID");const slots=new Set();
    return value.map(item=>{const hasOverall=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"overall")),hasPosition=Boolean(item&&typeof item==="object"&&Object.hasOwn(item,"position"));/* r87: optional FIFA 17 overall (30-99) and position */stspExact(item,["slot","name","leagueId","nationalityId",...(hasOverall?["overall"]:[]),...(hasPosition?["position"]:[])],"TRANSFER_SIGNINGS_INVALID");if(hasPosition&&!["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"].includes(item.position))stspFail("TRANSFER_SIGNINGS_INVALID");if(hasOverall&&!(Number.isInteger(item.overall)&&item.overall>=30&&item.overall<=99))stspFail("TRANSFER_SIGNINGS_INVALID");if(!Number.isInteger(item.slot)||item.slot<1||item.slot>3||slots.has(item.slot))stspFail("TRANSFER_SIGNINGS_INVALID");slots.add(item.slot);if(typeof item.name!=="string"||!item.name||item.name!==item.name.trim()||item.name.length>80||!catalog.leagueIds.has(item.leagueId)||!catalog.nationalityIds.has(item.nationalityId))stspFail("TRANSFER_SIGNINGS_INVALID");const row={slot:item.slot,name:item.name,leagueId:item.leagueId,nationalityId:item.nationalityId};if(hasOverall)row.overall=item.overall;if(hasPosition)row.position=item.position;return row;}).sort((a,b)=>a.slot-b.slot);
  }
  function stspAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")stspFail("TRANSFER_MANAGER_INACTIVE");}
  function stspAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")stspFail("TRANSFER_DEVICE_INACTIVE");}
  function stspAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")stspFail("TRANSFER_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)stspFail("TRANSFER_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string")||ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId)))stspFail("TRANSFER_BINDING_INVALID");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)stspFail("TRANSFER_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function stspAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)stspFail("TRANSFER_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=stspTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))stspFail("TRANSFER_ACTIVE_SESSION_REQUIRED");
  }
  function stspAssertSetup(value,rivalryId){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))stspFail("TRANSFER_SETUP_NOT_CONFIRMED");return value;
  }
  function stspAssertCareer(value,rivalryId,setup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")stspFail("TRANSFER_CAREER_START_NOT_READY");
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))stspFail("TRANSFER_CAREER_START_NOT_READY");return value;
  }
  function stspPublicState(value,rivalryId,seasonNumber,setup){
    if(!value)return null;stspExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==protocol.runtimeRevision||value.coordinatorRole!==setup.coordinatorRole||!protocol.phases.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>7)stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    const startedAtEpochMs=stspTimestampMillis(value.startedAt),endedAtEpochMs=value.endedAt===null?null:stspTimestampMillis(value.endedAt);if(!Number.isFinite(startedAtEpochMs)||(value.endedAt!==null&&!Number.isFinite(endedAtEpochMs)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    stspRoleList(value.endRequestedRoles);stspRoleList(value.guessLockedRoles);stspRoleList(value.signingLockedRoles);
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)stspFail("TRANSFER_PROVIDER_STATE_INVALID");}
    if(new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationTypes.some(type=>!COMMAND_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="WINDOW_OPEN"&&(value.endedAt!==null||value.guessLockedRoles.length||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="GUESS_ENTRY"&&(value.endedAt===null||value.signingLockedRoles.length))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="SIGNING_ENTRY"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length>1))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(value.phase==="COMPLETED"&&(value.endedAt===null||value.guessLockedRoles.length!==2||value.signingLockedRoles.length!==2))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    if(!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PROVIDER_STATE_INVALID");
    return stspFreeze({seasonNumber,coordinatorRole:value.coordinatorRole,phase:value.phase,revision:value.revision,startedAtEpochMs,endedAtEpochMs,endRequestedRoles:[...value.endRequestedRoles],guessLockedRoles:[...value.guessLockedRoles],signingLockedRoles:[...value.signingLockedRoles],operationIds:[...value.operationIds],operationTypes:[...value.operationTypes],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
  }
  function stspPrivateState(value,rivalryId,seasonNumber,role,catalog){
    if(!value)return null;
    const salted=stspPlain(value)&&Object.hasOwn(value,SALT_KEYS[0]);stspExact(value,salted?[...PRIVATE_KEYS,...SALT_KEYS]:PRIVATE_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallengeRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guesses=value.guesses===null?null:stspNormalizeGuesses(value.guesses,catalog),signings=value.signings===null?null:stspNormalizeSignings(value.signings,catalog),guessLockedAtEpochMs=value.guessLockedAt===null?null:stspTimestampMillis(value.guessLockedAt),signingLockedAtEpochMs=value.signingLockedAt===null?null:stspTimestampMillis(value.signingLockedAt);
    if((guesses===null)!==(guessLockedAtEpochMs===null)||(signings===null)!==(signingLockedAtEpochMs===null)||(guessLockedAtEpochMs!==null&&!Number.isFinite(guessLockedAtEpochMs))||(signingLockedAtEpochMs!==null&&!Number.isFinite(signingLockedAtEpochMs))||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    const guessSalt=salted?value.guessSalt:null,signingSalt=salted?value.signingSalt:null;
    // A salt exists only together with the lock it belongs to, and is exactly 64 lowercase hex characters.
    for(const [salt,locked] of [[guessSalt,guesses],[signingSalt,signings]])if(salt!==null&&(typeof salt!=="string"||!SALT.test(salt)||locked===null))stspFail("TRANSFER_PRIVATE_STATE_INVALID");
    return stspFreeze({guesses,signings,guessLockedAtEpochMs,signingLockedAtEpochMs,guessSalt,signingSalt});
  }
  function stspPublicLedger(state,ctx,serverNow,type){
    const prior=ctx.publicValue||null,startedAt=type==="start-window"?serverNow:(prior?.startedAt||stspTimestamp(ctx.sdk,state.startedAtEpochMs));let endedAt=null;
    if(state.endedAtEpochMs!==null){
      const earlyEnd=type==="request-end-window"&&state.phase==="GUESS_ENTRY"&&state.endRequestedRoles.length===2;
      if(earlyEnd||type==="advance-expired-window")endedAt=serverNow;
      else endedAt=prior?.endedAt||stspTimestamp(ctx.sdk,state.endedAtEpochMs);
    }
    return {schemaVersion:1,objectType:"sharedTransferChallenge",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:protocol.runtimeRevision,coordinatorRole:state.coordinatorRole,phase:state.phase,revision:state.revision,startedAt,endedAt,endRequestedRoles:[...state.endRequestedRoles],guessLockedRoles:[...state.guessLockedRoles],signingLockedRoles:[...state.signingLockedRoles],operationIds:[...state.operationIds],operationTypes:[...state.operationTypes],operationHashes:[...state.operationHashes],baseRevisions:[...state.baseRevisions],actorRoles:[...state.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId};
  }
  function stspPrivateLedger(privateState,ctx,role,serverNow,type){
    const prior=ctx.ownValue||null;
    const guessLockedAt=type==="lock-guesses"?serverNow:(prior?.guessLockedAt||(privateState.guessLockedAtEpochMs===null||privateState.guessLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.guessLockedAtEpochMs)));
    const signingLockedAt=type==="lock-signings"?serverNow:(prior?.signingLockedAt||(privateState.signingLockedAtEpochMs===null||privateState.signingLockedAtEpochMs===undefined?null:stspTimestamp(ctx.sdk,privateState.signingLockedAtEpochMs)));
    return {schemaVersion:1,objectType:"sharedTransferChallengeRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:role,guesses:privateState.guesses?stspClone(privateState.guesses):null,signings:privateState.signings?stspClone(privateState.signings):null,guessLockedAt,signingLockedAt,activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId,guessSalt:privateState.guessSalt||null,signingSalt:privateState.signingSalt||null};
  }
  async function stspContext(options,transaction,{readOpponent=false}={}){
    stspValidateSdk(options);const catalog=stspCatalog(),uid=stspAccountId(options.user),rivalryId=stspNormalizeRivalryId(options.rivalryId),sessionId=stspNormalizeSessionId(options.sessionId),deviceId=stspNormalizeDeviceId(options.deviceId),now=stspEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore;
    const baseRefs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    stspAssertAccount(stspSnapshot(await transaction.get(baseRefs.account)),uid);stspAssertDevice(stspSnapshot(await transaction.get(baseRefs.device)),deviceId);const rivalry=stspAssertRivalry(stspSnapshot(await transaction.get(baseRefs.rivalry)),rivalryId,uid);stspAssertSession(stspSnapshot(await transaction.get(baseRefs.session)),rivalryId,sessionId,rivalry.authorized,now);const setup=stspAssertSetup(stspSnapshot(await transaction.get(baseRefs.setup)),rivalryId);stspAssertCareer(stspSnapshot(await transaction.get(baseRefs.career)),rivalryId,setup);const seasonNumber=stspSeason(options.seasonNumber,setup.totalSeasons),role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",transferId=`season_${seasonNumber}`;
    const refs={...baseRefs,public:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId),own:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",role),opponent:sdk.doc(db,"rivalries",rivalryId,"transferChallenges",transferId,"roles",opponentRole)};
    const publicValue=stspSnapshot(await transaction.get(refs.public)),state=stspPublicState(publicValue,rivalryId,seasonNumber,setup),ownValue=stspSnapshot(await transaction.get(refs.own)),own=stspPrivateState(ownValue,rivalryId,seasonNumber,role,catalog);let opponent=null;
    if(readOpponent==="ifCompleted"&&!(state&&state.phase==="COMPLETED"))readOpponent=false;if(readOpponent){if(!state||state.phase!=="COMPLETED")stspFail("TRANSFER_PRIVATE_READ_BLOCKED");opponent=stspPrivateState(stspSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,catalog);if(!opponent)stspFail("TRANSFER_PRIVATE_STATE_INVALID");}
    return Object.freeze({catalog,uid,rivalryId,sessionId,deviceId,now,sdk,db,rivalry,setup,seasonNumber,role,opponentRole,state,own,publicValue,ownValue,opponent,refs});
  }
  function stspProjection(ctx){
    const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownInputs:null,opponentInputs:null,verdicts:null});
    const ownInputs=ctx.own?{guesses:stspClone(ctx.own.guesses),signings:stspClone(ctx.own.signings)}:{guesses:null,signings:null};
    const opponentInputs=state.phase==="COMPLETED"&&ctx.opponent?{guesses:stspClone(ctx.opponent.guesses),signings:stspClone(ctx.opponent.signings)}:null;let verdicts=null;
    if(state.phase==="COMPLETED"){
      if(!ctx.own||!ctx.opponent||!ctx.own.guesses||!ctx.own.signings||!ctx.opponent.guesses||!ctx.opponent.signings)stspFail("TRANSFER_PRIVATE_STATE_INVALID");
      const inputs={};inputs[ctx.role]=ctx.own;inputs[ctx.opponentRole]=ctx.opponent;const evalState={phase:"COMPLETED",inputs};
      verdicts={playerOne:stspProtocolVerdict("playerOne",evalState),playerTwo:stspProtocolVerdict("playerTwo",evalState)};
    }
    return stspFreeze({ok:true,revision:state.revision,state:stspClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownInputs,opponentInputs,verdicts});
  }
  function stspProtocolVerdict(role,state){
    const opponent=role==="playerOne"?"playerTwo":"playerOne",guesses=state.inputs[opponent].guesses||[];
    return (state.inputs[role].signings||[]).map(signing=>{const matchedBy=guesses.filter(guess=>(guess.type==="league"&&guess.valueId===signing.leagueId)||(guess.type==="nationality"&&guess.valueId===signing.nationalityId));return {...signing,release:matchedBy.length>0,matchedBy:matchedBy.map(guess=>({type:guess.type,valueId:guess.valueId}))};});
  }
  // RS-02 (r87): one pass. The opponent's private document is read only after this same pass has seen the public document
  // COMPLETED (the Rules allow it only then); before, a COMPLETED season read the whole context twice (17 gets in one transaction).
  async function stspRead(options={}){try{return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{return stspProjection(await stspContext(options,transaction,{readOpponent:"ifCompleted"}));});}catch(error){return stspResultError(error);}}
  async function stspMutate(options,type,payload){
    try{
      stspValidateSdk(options);const operationId=stspNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>7)stspFail("TRANSFER_COMMAND_INVALID");const cryptoImpl=options.cryptoImpl||root.crypto;
      return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await stspContext(options,transaction),current=ctx.state,revision=current?current.revision:0;let normalizedPayload={};
        if(type==="lock-guesses")normalizedPayload={guesses:stspNormalizeGuesses(payload.guesses,ctx.catalog)};else if(type==="lock-signings")normalizedPayload={signings:stspNormalizeSignings(payload.signings,ctx.catalog)};
        // JOB-1051: a lock's hash commits to the private payload AND a fresh random salt that only the actor's own private role document holds.
        // The rival can read the public ledger but not the role document before COMPLETED, so it cannot brute-force the small guess space.
        const privateType=type==="lock-guesses"||type==="lock-signings",saltKey=type==="lock-guesses"?"guessSalt":"signingSalt";
        const commit=salt=>stspHash({actorRole:ctx.role,type,operationId,baseRevision,...normalizedPayload,...(salt?{salt}:{})},cryptoImpl);
        if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){
          // Replays recompute with the salt already stored in the actor's own document; a role document without a salt (written by r66) uses the old unsalted payload hash.
          const storedSalt=privateType&&ctx.own?ctx.own[saltKey]:null;
          if(current.operationTypes[index]!==type||current.operationHashes[index]!==await commit(storedSalt)||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role)stspFail("TRANSFER_IDEMPOTENCY_CONFLICT");return stspFreeze({ok:true,status:"accepted",replayed:true,revision:current.revision,state:stspClone(current),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:current.phase==="COMPLETED"});}}
        const salt=privateType?stspNewSalt(cryptoImpl):null,operationHash=await commit(salt);
        if(baseRevision!==revision)stspFail("TRANSFER_STALE_BASE_REVISION");if(!current&&type!=="start-window")stspFail("TRANSFER_NOT_STARTED");if(current&&type==="start-window")stspFail("TRANSFER_ALREADY_STARTED");if(current&&current.phase==="COMPLETED")stspFail("TRANSFER_ALREADY_COMPLETED");
        let next=current?stspClone(current):{seasonNumber:ctx.seasonNumber,coordinatorRole:ctx.setup.coordinatorRole,phase:"WINDOW_OPEN",revision:0,startedAtEpochMs:ctx.now,endedAtEpochMs:null,endRequestedRoles:[],guessLockedRoles:[],signingLockedRoles:[],operationIds:[],operationTypes:[],operationHashes:[],baseRevisions:[],actorRoles:[]};
        let own=ctx.own?stspClone(ctx.own):{guesses:null,signings:null,guessLockedAtEpochMs:null,signingLockedAtEpochMs:null,guessSalt:null,signingSalt:null};let writePrivate=false;
        if(type==="start-window"){if(ctx.role!==ctx.setup.coordinatorRole)stspFail("TRANSFER_COORDINATOR_REQUIRED");next.startedAtEpochMs=ctx.now;}
        else if(type==="request-end-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(next.endRequestedRoles.includes(ctx.role))stspFail("TRANSFER_END_ALREADY_REQUESTED");next.endRequestedRoles.push(ctx.role);if(next.endRequestedRoles.length===2){next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}}
        else if(type==="advance-expired-window"){if(next.phase!=="WINDOW_OPEN")stspFail("TRANSFER_PHASE_INVALID");if(ctx.now<next.startedAtEpochMs+protocol.windowMs)stspFail("TRANSFER_WINDOW_STILL_OPEN");next.phase="GUESS_ENTRY";next.endedAtEpochMs=ctx.now;}
        else if(type==="lock-guesses"){if(next.phase!=="GUESS_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(next.guessLockedRoles.includes(ctx.role)||own.guesses!==null)stspFail("TRANSFER_GUESSES_ALREADY_LOCKED");own.guesses=normalizedPayload.guesses;own.guessSalt=salt;next.guessLockedRoles.push(ctx.role);if(next.guessLockedRoles.length===2)next.phase="SIGNING_ENTRY";writePrivate=true;}
        else if(type==="lock-signings"){if(next.phase!=="SIGNING_ENTRY")stspFail("TRANSFER_PHASE_INVALID");if(!next.guessLockedRoles.includes(ctx.role)||!own.guesses)stspFail("TRANSFER_GUESSES_REQUIRED");if(next.signingLockedRoles.includes(ctx.role)||own.signings!==null)stspFail("TRANSFER_SIGNINGS_ALREADY_LOCKED");own.signings=normalizedPayload.signings;own.signingSalt=salt;next.signingLockedRoles.push(ctx.role);if(next.signingLockedRoles.length===2)next.phase="COMPLETED";writePrivate=true;}
        else stspFail("TRANSFER_COMMAND_INVALID");
        next.operationIds.push(operationId);next.operationTypes.push(type);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;
        const serverNow=stspServerTimestamp(ctx.sdk);transaction.set(ctx.refs.public,stspPublicLedger(next,ctx,serverNow,type));if(writePrivate)transaction.set(ctx.refs.own,stspPrivateLedger(own,ctx,ctx.role,serverNow,type));
        return stspFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:stspClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,needsRefresh:type==="start-window"||next.phase==="COMPLETED"});
      });
    }catch(error){return stspResultError(error);}
  }
  const stspStartWindow=options=>stspMutate(options,"start-window",{});
  const stspRequestEndWindow=options=>stspMutate(options,"request-end-window",{});
  const stspAdvanceExpiredWindow=options=>stspMutate(options,"advance-expired-window",{});
  const stspLockGuesses=options=>stspMutate(options,"lock-guesses",{guesses:options.guesses});
  const stspLockSignings=options=>stspMutate(options,"lock-signings",{signings:options.signings});

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-transfer-challenge",runtimeRevision:protocol.runtimeRevision,read:stspRead,startWindow:stspStartWindow,requestEndWindow:stspRequestEndWindow,advanceExpiredWindow:stspAdvanceExpiredWindow,lockGuesses:stspLockGuesses,lockSignings:stspLockSignings,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,privateInputsSplit:true,serverClockAuthoritative:true,repositoryCatalogSnapshot:true,callerCatalogOverride:false});
});
```

## FILE: js/productionSharedTransferChallenge.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedTransferChallenge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): while this manager waits on the rival, read every 3 s for at most 3 minutes, then the normal 15 s.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  const TIMER_MS=1000;
  const EXPIRY_RETRY_MS=30000,EXPIRY_MAX_ATTEMPTS=3;
  const CLOCK_REFRESH_MS=5*60*1000;
  const CONTROL_IDS=Object.freeze(["seasonPrimaryAction","startTransferTimer","endTransferTimer","completeTransferChallenge","continueFromTransfers"]);
  const PHASE_PROGRESS=Object.freeze({NOT_STARTED:"window",WINDOW_OPEN:"window",GUESS_ENTRY:"guess_entry",SIGNING_ENTRY:"signing_entry",COMPLETED:"completed"});
  const REPLAY_PHASES=Object.freeze(["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY","COMPLETED"]);
  // r87 (Nik 2026-10-30): each signing's FIFA 17 position, chosen by his own manager and never guessed (roulette boards).
  const SIGNING_POSITIONS=Object.freeze(["GK","RB","RWB","CB","LB","LWB","CDM","CM","CAM","RM","LM","RW","LW","CF","ST"]);
  let installed=false,busy=false,provider=null,setupApi=null,careerApi=null,view=null,pollTimer=null,timerLoop=null,openedKey="",expiryAttemptRevision=-1,expiryAttemptAt=0,providerChain=Promise.resolve(),refreshPromise=null,refreshContextKey="",viewContextKey="",replayContextKey="",replayQueue=[],openPromise=null;
  let expiryAttemptContextKey="",expiryAttemptCount=0,expiryPermissionDenied=false,expiryNeedsAuthority=false,refreshExpiryRequest=null;
  let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;
  const witnessedByContext=new Map();
  let fastWaitKey="",fastWaitSince=0;
  let rouletteLoadError=false;

  function pstcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pstcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pstcSharedMarker(){const showdown=pstcShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pstcReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pstcText(id,value){const node=root.document&&root.document.getElementById(id);if(node)node.textContent=String(value??"");return node;}
  function pstcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pstcDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pstcLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pstcEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pstcLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pstcLoadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
    await pstcLoadScript("ssjr-transfer-protocol","js/sharedTransferChallenge.js",()=>root.CareerModeSharedTransferChallenge);
    await pstcLoadScript("ssjr-transfer-provider","js/sparkSharedTransferChallenge.js",()=>root.CareerModeSparkSharedTransferChallenge);
    await pstcLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;careerApi=root.CareerModeProductionSharedCareerStart;provider=root.CareerModeSparkSharedTransferChallenge;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pstcFail("TRANSFER_SETUP_UNAVAILABLE");
    if(!careerApi||typeof careerApi.refresh!=="function"||typeof careerApi.getState!=="function")pstcFail("TRANSFER_CAREER_START_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.startWindow!=="function"||typeof provider.requestEndWindow!=="function"||typeof provider.advanceExpiredWindow!=="function"||typeof provider.lockGuesses!=="function"||typeof provider.lockSignings!=="function")pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
  }
  // A restored local shell may have no rivalry id. Shared Setup has already verified it before entry resumes;
  // use that snapshot while this module's dependencies are still cold so the first refresh can bind its request.
  function pstcSetupState(){try{return setupApi?.getState?.()||root.CareerModeProductionSharedShowdownSetup?.getState?.()||null;}catch(_error){return null;}}
  function pstcCareerReady(){try{const career=careerApi?.getState?.();return Boolean(career&&career.state&&career.state.phase==="CAREER_START_READY"&&career.state.revision===2);}catch(_error){return false;}}
  function pstcConfirmedShared(){const state=pstcSetupState();return Boolean(pstcSharedMarker()&&state&&state.ready===true&&state.setup&&state.setup.phase==="SHOWDOWN_CONFIRMED"&&state.setup.revision===6&&state.managerRole&&state.rivalryId&&state.sessionId&&state.deviceId);}
  function pstcSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pstcShowdown()?.currentRound,season=Number(pstcSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pstcFail("TRANSFER_SEASON_INVALID");return season;}
  function pstcLocalContextKey(){const showdown=pstcShowdown(),id=String(showdown?.id||showdown?.saveId||"").trim();let season;try{season=pstcSeason();}catch(_error){return "";}return id&&Number.isInteger(season)&&season>0?`${id}:${season}`:"";}
  function pstcBoundContextKey(rivalryId,season,localContextKey=pstcLocalContextKey()){const local=String(localContextKey||"").trim(),remote=String(rivalryId||"").trim(),round=Number(season);return local&&remote&&Number.isInteger(round)&&round>0?`${local}|${remote}:${round}`:"";}
  function pstcCurrentContextKey(){const showdown=pstcShowdown(),setup=pstcSetupState(),rivalry=showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"";let season;try{season=pstcSeason();}catch(_error){return "";}return pstcBoundContextKey(rivalry,season);}
  function pstcRequestContext(){const showdown=pstcShowdown(),localKey=pstcLocalContextKey(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pstcSetupState()?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=pstcSeason();}catch(_error){return null;}const key=pstcBoundContextKey(rivalryId,seasonNumber,localKey);return key?Object.freeze({key,localKey,rivalryId,seasonNumber}):null;}
  function pstcRequestMatches(request,ctx=null){if(!request||pstcCurrentContextKey()!==request.key)return false;if(!ctx)return true;return String(ctx.state?.rivalryId||"").trim()===request.rivalryId&&Number(ctx.options?.seasonNumber)===request.seasonNumber;}
  function pstcBindView(result,ctx,request){if(!pstcRequestMatches(request,ctx))return false;view={...result,setup:ctx.state.setup,rivalryId:ctx.state.rivalryId};viewContextKey=request.key;if(view.state?.phase==="COMPLETED"&&view.verdicts)pstcKeepVerdicts(request.rivalryId,request.seasonNumber,view.verdicts);return true;}
  function pstcResetExpiryAttempts(){expiryAttemptContextKey="";expiryAttemptRevision=-1;expiryAttemptAt=0;expiryAttemptCount=0;expiryPermissionDenied=false;}
  function pstcExpiryPaused(){return root.document?.visibilityState==="hidden"||expiryNeedsAuthority;}
  function pstcExpiryPermissionRefused(error,request){if(["permission-denied","firestore/permission-denied","permission_denied"].includes(error?.code)&&pstcRequestMatches(request)&&view?.state?.phase==="WINDOW_OPEN"){expiryAttemptContextKey=request.key;expiryAttemptRevision=Number(view.revision);expiryPermissionDenied=true;}}
  function pstcClearClock(){clockContextKey="";clockServerEpochMs=0;clockPerformanceMs=0;clockRefreshPerformanceMs=0;}
  function pstcClearCachedContext(){view=null;viewContextKey="";openedKey="";replayContextKey="";replayQueue=[];pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcClearClock();}
  function pstcMonotonicNow(){const value=Number(root.performance&&typeof root.performance.now==="function"?root.performance.now():Number.NaN);if(!Number.isFinite(value)||value<0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","A monotonic browser clock is required for the shared Transfer Challenge.");return value;}
  function pstcClockReady(request){return Boolean(request&&clockContextKey===request.key&&Number.isFinite(clockServerEpochMs)&&clockServerEpochMs>0&&Number.isFinite(clockPerformanceMs));}
  function pstcAuthoritativeNow(request=pstcRequestContext()){if(!pstcClockReady(request))pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Server time has not been established for this shared Transfer Challenge.");return Math.floor(clockServerEpochMs+Math.max(0,pstcMonotonicNow()-clockPerformanceMs));}
  async function pstcEnsureServerClock(user,request){
    if(!request||!pstcRequestMatches(request))return false;
    const monotonicNow=pstcMonotonicNow();
    if(pstcClockReady(request)&&Number.isFinite(clockRefreshPerformanceMs)&&monotonicNow-clockRefreshPerformanceMs<CLOCK_REFRESH_MS)return true;
    if(!user||typeof user.getIdTokenResult!=="function")pstcFail("TRANSFER_CLOCK_UNAVAILABLE","Connected account server time is unavailable.");
    const requestPerformanceMs=pstcMonotonicNow();
    const token=await user.getIdTokenResult(true);
    if(!pstcRequestMatches(request))return false;
    const issuedAtEpochMs=Date.parse(String(token?.issuedAtTime||""));
    if(!Number.isFinite(issuedAtEpochMs)||issuedAtEpochMs<=0)pstcFail("TRANSFER_CLOCK_UNAVAILABLE","The connected account did not provide a valid server time anchor.");
    const receiptPerformanceMs=pstcMonotonicNow();
    clockContextKey=request.key;
    clockServerEpochMs=issuedAtEpochMs+(issuedAtEpochMs%1000===0?500:0);
    clockPerformanceMs=(requestPerformanceMs+receiptPerformanceMs)/2;
    clockRefreshPerformanceMs=receiptPerformanceMs;
    return true;
  }
  function pstcCanRoute(){const request=pstcRequestContext();return Boolean(request&&view&&viewContextKey===request.key&&pstcRequestMatches(request)&&pstcConfirmedShared()&&pstcCareerReady()&&String(view.rivalryId||"")===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber);}
  // Browser-only viewing hints. Provider state still owns the phase, private inputs and every action.
  function pstcViewingStorageKey(){const request=pstcRequestContext(),role=view?.managerRole;return request&&viewContextKey===request.key&&role?`cms.transferViews.v1:${request.rivalryId}:${request.seasonNumber}:${role}`:"";}
  function pstcWitnessSet(key){
    const scope=`${key}|${view?.managerRole||""}`;
    if(!witnessedByContext.has(scope)){
      let saved=null;try{const storageKey=pstcViewingStorageKey();if(storageKey)saved=JSON.parse(root.readStorageValue?.(storageKey)||"null");}catch(_error){}
      witnessedByContext.set(scope,new Set(Array.isArray(saved)?saved.filter(phase=>REPLAY_PHASES.includes(phase)||phase==="RESULTS_VIEWED"):[]));
    }
    return witnessedByContext.get(scope);
  }
  function pstcCanResumeResults(){return Boolean(pstcCanRoute()&&view.state?.phase==="COMPLETED"&&!pstcReplayPhase()&&REPLAY_PHASES.every(phase=>pstcWitnessSet(viewContextKey).has(phase))&&pstcWitnessSet(viewContextKey).has("RESULTS_VIEWED"));}
  // Seeing completed verdicts does not mean Results was opened. Keep that navigation hint separate so a
  // reload before the Results tap still follows the normal season dashboard / transfer recovery route.
  function pstcRememberResultsView(){
    if(!pstcCanRoute()||view.state?.phase!=="COMPLETED"||pstcReplayPhase())return false;
    const witnessed=pstcWitnessSet(viewContextKey);if(!REPLAY_PHASES.every(phase=>witnessed.has(phase)))return false;
    if(witnessed.has("RESULTS_VIEWED"))return true;witnessed.add("RESULTS_VIEWED");
    try{const key=pstcViewingStorageKey();if(key)root.writeStorageValue?.(key,JSON.stringify([...witnessed]));}catch(_error){}
    return true;
  }
  function pstcTransferScreenVisible(){const screen=root.document&&root.document.getElementById("transferChallenge");return Boolean(screen&&!screen.classList.contains("hidden"));}
  function pstcReplayPhase(key=viewContextKey){return replayContextKey===key&&replayQueue.length?replayQueue[0]:null;}
  function pstcPrepareReplay(){
    const key=viewContextKey,actual=view?.state?.phase;
    if(!key||!REPLAY_PHASES.includes(actual)){replayContextKey="";replayQueue=[];return false;}
    if(replayContextKey===key&&replayQueue.length)return true;
    const actualIndex=REPLAY_PHASES.indexOf(actual),witnessed=pstcWitnessSet(key),missing=REPLAY_PHASES.slice(0,actualIndex).filter(phase=>!witnessed.has(phase));
    replayContextKey=missing.length?key:"";replayQueue=missing;return missing.length>0;
  }
  function pstcMarkWitness(key,phase){
    if(!key||!REPLAY_PHASES.includes(phase)||!pstcTransferScreenVisible())return;
    const witnessed=pstcWitnessSet(key);if(witnessed.has(phase))return;witnessed.add(phase);
    try{const storageKey=pstcViewingStorageKey();if(storageKey)root.writeStorageValue?.(storageKey,JSON.stringify([...witnessed]));}catch(_error){}
  }
  function pstcAdvanceReplay(){if(!pstcReplayPhase())return false;replayQueue.shift();if(!replayQueue.length){replayContextKey="";pstcPrepareReplay();}pstcRender();return true;}
  function pstcRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pstcFail("TRANSFER_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `transfer_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and Career Start instead of re-reading them.
  async function pstcProviderOptions(request=pstcRequestContext(),light=false,expiryOnly=false){
    if(!pstcSharedMarker())pstcFail("TRANSFER_SHARED_MODE_REQUIRED");
    if(!request||!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    await pstcEnsureDependencies();
    if(expiryOnly&&pstcExpiryPaused())return null;
    const reuse=light===true&&pstcConfirmedShared()&&pstcCareerReady();
    if(!reuse)await setupApi.refresh();
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const state=setupApi.getState();
    if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||state.setup.revision!==6)pstcFail("TRANSFER_SETUP_NOT_CONFIRMED","Both managers must finish setup before the Transfer Challenge.");
    if(!reuse)await careerApi.refresh();
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    const career=careerApi.getState();
    if(!career||!career.state||career.state.phase!=="CAREER_START_READY"||career.state.revision!==2)pstcFail("TRANSFER_CAREER_START_NOT_READY","Both managers must finish Career Start before the Transfer Challenge.");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(expiryOnly&&pstcExpiryPaused())return null;
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    if(!await pstcEnsureServerClock(services.auth.currentUser,request))pstcFail("TRANSFER_CONTEXT_STALE");
    if(!pstcRequestMatches(request))pstcFail("TRANSFER_CONTEXT_STALE");
    return {state,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:state.rivalryId,sessionId:state.sessionId,deviceId:state.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:pstcAuthoritativeNow(request)}};
  }
  function pstcResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Transfer Challenge request was rejected.");error.code=result&&result.code||"TRANSFER_PROVIDER_FAILED";error.providerResult=true;throw error;}
  function pstcQueueProvider(task){const queued=providerChain.then(task,task);providerChain=queued.catch(()=>{});return queued;}
  async function pstcRefreshNow(request=pstcRequestContext(),light=false,expiryOnly=false){
    if(!request)return null;
    const ctx=await pstcProviderOptions(request,light,expiryOnly);if(!ctx||!pstcRequestMatches(request,ctx)||(expiryOnly&&pstcExpiryPaused()))return null;
    const result=pstcResultError(await provider.read(ctx.options),"The Transfer Challenge could not be loaded.");if(!pstcRequestMatches(request,ctx))return null;
    if(!pstcBindView(result,ctx,request))return null;if(pstcTransferScreenVisible())pstcPrepareReplay();pstcSetError("");pstcRender();pstcDecorateDashboard();return view;
  }
  // Routine polls and concurrent-expiry reconciliation must not replenish the automatic retry budget. A poll that lands while
  // a wake refresh failed still counts as the fresh authority that wake was waiting for, so expiry cannot stay paused forever.
  function pstcRefresh(light=false,rearmExpiry=true){
    const request=pstcRequestContext();if(!request)return Promise.resolve(null);
    if(viewContextKey&&viewContextKey!==request.key)pstcClearCachedContext();
    if(rearmExpiry)expiryNeedsAuthority=true;
    if(refreshPromise&&refreshContextKey===request.key){refreshExpiryRequest.rearm=refreshExpiryRequest.rearm||rearmExpiry;return refreshPromise;}
    const expiryRefresh={rearm:rearmExpiry};refreshExpiryRequest=expiryRefresh;
    const current=pstcQueueProvider(async()=>{
      const fresh=await pstcRefreshNow(request,light===true);
      if(fresh&&pstcRequestMatches(request)&&(expiryRefresh.rearm||expiryNeedsAuthority)){pstcResetExpiryAttempts();expiryNeedsAuthority=false;pstcRender();}
      return fresh;
    });
    refreshPromise=current;refreshContextKey=request.key;
    const clear=()=>{if(refreshPromise===current){refreshPromise=null;refreshContextKey="";refreshExpiryRequest=null;}};
    current.then(clear,clear);return current;
  }
  // Job 21: when both managers tap at once the loser's write is rejected by the Rules (permission-denied) or by the provider
  // (stale revision / phase already moved). Re-read once; if the refreshed state already shows the outcome, finish silently,
  // otherwise retry the same method once with a fresh revision and operation id. A real denial surfaces after that one retry.
  const PSTC_RACE_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied","TRANSFER_STALE_BASE_REVISION","TRANSFER_PHASE_INVALID","TRANSFER_END_ALREADY_REQUESTED","TRANSFER_ALREADY_STARTED","TRANSFER_GUESSES_ALREADY_LOCKED","TRANSFER_SIGNINGS_ALREADY_LOCKED"]);
  function pstcOutcomeShown(method,fresh){
    const state=fresh&&fresh.state,role=fresh&&fresh.managerRole;if(!state)return false;
    if(method==="startWindow")return state.phase!=="NOT_STARTED";
    if(method==="requestEndWindow")return state.phase!=="WINDOW_OPEN"||Boolean(state.endRequestedRoles?.includes(role));
    if(method==="advanceExpiredWindow")return state.phase!=="WINDOW_OPEN";
    if(method==="lockGuesses")return state.phase!=="GUESS_ENTRY"||Boolean(state.guessLockedRoles?.includes(role));
    if(method==="lockSignings")return state.phase==="COMPLETED"||Boolean(state.signingLockedRoles?.includes(role));
    return false;
  }
  // BUG-3: the provider rejects a signing name over 80 characters with only a code, so the inputs are capped to the same limit and the known codes read as plain sentences.
  const SIGNING_NAME_MAX=80;
  // Red team R87-B-05: a dropped connection or an expired session reads as what to do next, never as a raw code.
  const PSTC_CONNECTION_TEXT="Could not confirm this step. Check the connection, tap REFRESH CHALLENGE to see if it saved, then try again if it did not.";
  const PSTC_SESSION_TEXT="Your Showdown session has lapsed. Go back to Showdown Home and open the Showdown again; nothing saved is lost.";
  const PLAIN_PROVIDER_CODES=Object.freeze({TRANSFER_SIGNINGS_INVALID:"Check each signing: a player name (80 characters at most), a previous league and a nationality.",TRANSFER_GUESSES_INVALID:"Check each guess: choose a FIFA 17 league or nationality."});
  function pstcCapSigningNames(){if(!root.document)return;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const input=pstcField(`${prefix}Signing${i}Name`);if(input&&typeof input.setAttribute==="function")input.setAttribute("maxlength",String(SIGNING_NAME_MAX));}}
  function pstcErrorText(error,fallback){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota)return quota;const code=String(error?.code||""),message=String(error?.message||"");if(error&&error.providerResult!==true&&message&&message!==code)return message;if(PLAIN_PROVIDER_CODES[code])return PLAIN_PROVIDER_CODES[code];if(/unavailable|deadline|offline|network|aborted/i.test(code))return PSTC_CONNECTION_TEXT;if(/permission/i.test(code))return PSTC_SESSION_TEXT;return code||message||fallback;}
  async function pstcMutate(method,payload={}){
    const request=pstcRequestContext();if(!request||busy||pstcReplayPhase()||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;busy=true;pstcSetError("");pstcRender();
    try{
      return await pstcQueueProvider(async()=>{
        for(let attempt=0;;attempt+=1){
          if(!pstcRequestMatches(request)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
          const ctx=await pstcProviderOptions(request,false,method==="advanceExpiredWindow");if(!ctx||!pstcRequestMatches(request,ctx)||(method==="advanceExpiredWindow"&&pstcExpiryPaused()))return false;
          const current=pstcResultError(await provider.read(ctx.options),"The Transfer Challenge could not be refreshed.");if(!pstcRequestMatches(request,ctx))return false;
          if(method==="advanceExpiredWindow"&&pstcExpiryPaused())return false;
          if(attempt>0&&pstcOutcomeShown(method,current)){if(pstcBindView(current,ctx,request)){pstcSetError("");if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}return true;}
          const options={...ctx.options,nowEpochMs:pstcAuthoritativeNow(request),operationId:pstcRandomOperationId(),baseRevision:Number(current.revision||0),...payload};
          let result;
          try{result=pstcResultError(await provider[method](options),"The Transfer Challenge update was rejected.");}
          catch(error){
            if(!PSTC_RACE_CODES.includes(error&&error.code)||attempt>0)throw error;
            if(method==="advanceExpiredWindow"){try{if(!pstcExpiryPaused())await pstcRefreshNow(request,false,true);}catch(_refreshError){}pstcExpiryPermissionRefused(error,request);return true;}
            continue;
          }
          if(!pstcRequestMatches(request,ctx))return true;
          if(!pstcBindView(result,ctx,request))return true;if(method==="lockSignings")pstcClearSigningDraft(view.managerRole);if(method==="lockGuesses")pstcClearGuessDraft(view.managerRole);pstcSetError("");
          if(result.needsRefresh||result.state?.phase==="COMPLETED")await pstcRefreshNow(request);else{if(pstcTransferScreenVisible())pstcPrepareReplay();pstcRender();pstcDecorateDashboard();}
          return true;
        }
      });
    }catch(error){if(method==="advanceExpiredWindow")pstcExpiryPermissionRefused(error,request);if(pstcRequestMatches(request)){pstcSetError(pstcErrorText(error,"The Transfer Challenge update failed."));pstcReport("Unable to update Shared Transfer Challenge",error);}return false;}
    finally{busy=false;if(pstcRequestMatches(request))pstcRender();}
  }
  function pstcSetError(message=""){const node=root.document&&root.document.getElementById("transferChallengeError");if(node)node.textContent=String(message||"");}
  function pstcRolePrefix(role){return role==="playerOne"?"p1":"p2";}
  function pstcGuessPrefix(role){return role==="playerOne"?"p2":"p1";}
  function pstcManagerName(role){const showdown=pstcShowdown();return showdown?.managers?.[role]|| (role==="playerOne"?"Manager 1":"Manager 2");}
  function pstcClubName(role){const showdown=pstcShowdown();return showdown?.clubs?.[role]||view?.setup?.clubs?.[role]||"Club";}
  function pstcCardFor(id,selector){const node=root.document&&root.document.getElementById(id);return node&&node.closest?node.closest(selector):null;}
  function pstcOwnGuessCard(role){return pstcCardFor(`${pstcGuessPrefix(role)}Guess1Type`,".transferGuessCard");}
  function pstcOtherGuessCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnGuessCard(other);}
  function pstcOwnSigningCard(role){return pstcCardFor(`${pstcRolePrefix(role)}Signing1Name`,".transferManagerCard");}
  function pstcOtherSigningCard(role){const other=role==="playerOne"?"playerTwo":"playerOne";return pstcOwnSigningCard(other);}
  function pstcField(id){return root.document&&root.document.getElementById(id);}
  function pstcSetSelector(input,kind,id){if(!input)return;if(typeof root.setTransferSelectorValue==="function")root.setTransferSelectorValue(input,kind,id||"");else input.value=String(id||"");}
  function pstcCanonical(input){return typeof root.getTransferSelectorCanonicalValue==="function"?root.getTransferSelectorCanonicalValue(input):String(input?.dataset?.canonicalId||"");}
  function pstcClearRole(role){
    const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);
    for(let i=1;i<=3;i+=1){
      const name=pstcField(`${signing}Signing${i}Name`),overall=pstcField(`${signing}Signing${i}Overall`),position=pstcField(`${signing}Signing${i}Position`),league=pstcField(`${signing}Signing${i}League`),nationality=pstcField(`${signing}Signing${i}Nationality`),type=pstcField(`${guess}Guess${i}Type`),value=pstcField(`${guess}Guess${i}Value`);
      if(name)name.value="";if(overall)overall.value="";if(position)position.value="";pstcSetSelector(league,"league","");pstcSetSelector(nationality,"nationality","");if(type)type.value="";if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.disabled=true;}
    }
  }
  function pstcResetForContext(key,role){const guessRef=pstcGuessDraftRef(role);if(guessDraftRef&&guessRef&&!pstcSameGuessDraftRef(guessDraftRef,guessRef))pstcRemoveGuessDraft(guessDraftRef);if(guessRef)guessDraftRef=guessRef;const draftKey=pstcSigningDraftKey(role);if(signingDraftKey&&draftKey&&signingDraftKey!==draftKey)pstcRemoveSigningDraft(signingDraftKey);if(draftKey)signingDraftKey=draftKey;if(openedKey===key)return;openedKey=key;for(const prefix of ["p1","p2"])for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`);if(name&&typeof name.setAttribute==="function")name.setAttribute("maxlength","80");}pstcResetExpiryAttempts();pstcClearRole("playerOne");pstcClearRole("playerTwo");pstcSetError("");}
  const PSTC_MAX_ROWS=3;
  // r78 (HO-029): the shared marble confirm box (js/showdownConfirm.js, loaded on first use) replaces the native confirm().
  // It resolves true only for OK; Cancel, Esc or a box that cannot load resolve false (undefined when no loader exists).
  function pstcAskConfirm(message,tone){return typeof root.askShowdownConfirm==="function"?root.askShowdownConfirm(message,{tone}):typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("showdown-confirm","js/showdownConfirm.js",()=>typeof root.askShowdownConfirm==="function").then(()=>root.askShowdownConfirm(message,{tone}),()=>false):Promise.resolve(undefined);}
  // A lock cannot be undone, so a partly filled form asks first. Cancel (or any confirm failure) means do nothing; no confirm box at all means lock as before.
  async function pstcConfirmPartialLock(filled,noun){
    if(filled>=PSTC_MAX_ROWS)return true;
    return (await pstcAskConfirm(`Lock ${filled} of ${PSTC_MAX_ROWS} ${noun}? You can't change them after locking.`,"primary"))!==false;
  }
  function pstcBuildGuesses(role){
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`),kind=String(type?.value||""),id=pstcCanonical(value),display=String(value?.value||"").trim();if(!kind&&!display)continue;if((kind!=="league"&&kind!=="nationality")||!display||!id)pstcFail("TRANSFER_GUESSES_INVALID",`Complete guess ${i} with a FIFA 17 league or nationality.`);rows.push({slot:i,type:kind,valueId:id});}
    return rows;
  }
  // Red team R87-SP-02 (Rule Book cards 03 and 06): the manager's own Special Player is a free extra signing that a rival's
  // guess can never release, so he is refused as one of the three Transfer War signings. Asked of the season step (which
  // loaded the draw before the window opened), with the Setup confirm time this page already holds: no read, nothing in
  // any protocol document. Without them (older Showdown, draw not loaded) nothing is refused.
  function pstcIsOwnSpecial(role,name){
    try{const step=root.CareerModeRosterRouletteStep,request=pstcRequestContext(),at=pstcSetupState()?.setupUpdatedAtMs;
      return Boolean(step&&typeof step.isOwnSpecial==="function"&&request&&Number.isFinite(at)&&step.isOwnSpecial(request.rivalryId,at,role,name));}
    catch(_error){return false;}
  }
  function pstcBuildSignings(role){
    const prefix=pstcRolePrefix(role),rows=[];
    for(let i=1;i<=3;i+=1){const name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`),league=pstcField(`${prefix}Signing${i}League`),nationality=pstcField(`${prefix}Signing${i}Nationality`),player=String(name?.value||"").trim(),ovrText=String(ovr?.value||"").trim(),posText=String(pos?.value||"").trim(),leagueId=pstcCanonical(league),nationalityId=pstcCanonical(nationality),hasAny=Boolean(player||ovrText||posText||String(league?.value||"").trim()||String(nationality?.value||"").trim());if(!hasAny)continue;if(!player||!leagueId||!nationalityId||(ovr&&!/^[3-9][0-9]$/.test(ovrText))||(pos&&!SIGNING_POSITIONS.includes(posText)))pstcFail("TRANSFER_SIGNINGS_INVALID",`Complete signing ${i} with player name, position, overall (30-99), previous league and nationality.`);if(pstcIsOwnSpecial(role,player))pstcFail("TRANSFER_SIGNING_SPECIAL_PLAYER",`Signing ${i} is your Special Player. He is a free extra signing that a guess can never release, so don't enter him here.`);const row={slot:i,name:player,leagueId,nationalityId};if(ovr)row.overall=Number(ovrText);if(pos)row.position=posText;rows.push(row);}
    return rows;
  }
  function pstcSyncGuessValue(type,value,editable){
    if(!value)return;const kind=String(type?.value||""),valid=kind==="league"||kind==="nationality";
    if(valid){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,kind);value.placeholder=kind==="league"?"Search FIFA 17 league":"Search nationality";pstcDisable(value,!editable);return;}
    value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;value.placeholder="Choose League or Nationality first";pstcDisable(value,true);
  }
  function pstcSyncOwnGuessControls(role,editable){
    const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1)pstcSyncGuessValue(pstcField(`${prefix}Guess${i}Type`),pstcField(`${prefix}Guess${i}Value`),editable);
  }
  function pstcGuessTypeChange(event){
    if(!pstcSharedMarker()||view?.state?.phase!=="GUESS_ENTRY")return;const role=view?.managerRole,target=event.target;if(!role||!target?.id)return;
    const prefix=pstcGuessPrefix(role),match=target.id.match(new RegExp(`^${prefix}Guess([1-3])Type$`));if(!match)return;
    pstcSyncGuessValue(target,pstcField(`${prefix}Guess${match[1]}Value`),!busy&&!view?.state?.guessLockedRoles?.includes(role));
  }
  function pstcPopulateGuesses(role,guesses){const prefix=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){const row=(guesses||[]).find(item=>item.slot===i),type=pstcField(`${prefix}Guess${i}Type`),value=pstcField(`${prefix}Guess${i}Value`);if(type)type.value=row?.type||"";if(value&&row){if(typeof root.updateTransferSelectorKind==="function")root.updateTransferSelectorKind(value,row.type);pstcSetSelector(value,row.type,row.valueId);}else if(value){value.value="";delete value.dataset.canonicalId;delete value.dataset.canonicalLabel;}}}
  function pstcPopulateSignings(role,signings){const prefix=pstcRolePrefix(role);for(let i=1;i<=3;i+=1){const row=(signings||[]).find(item=>item.slot===i),name=pstcField(`${prefix}Signing${i}Name`),ovr=pstcField(`${prefix}Signing${i}Overall`),pos=pstcField(`${prefix}Signing${i}Position`);if(name)name.value=row?.name||"";if(ovr)ovr.value=Number.isInteger(row?.overall)?String(row.overall):"";if(pos)pos.value=SIGNING_POSITIONS.includes(row?.position)?row.position:"";pstcSetSelector(pstcField(`${prefix}Signing${i}League`),"league",row?.leagueId||"");pstcSetSelector(pstcField(`${prefix}Signing${i}Nationality`),"nationality",row?.nationalityId||"");}}
  function pstcPopulateRole(role,inputs){if(!inputs)return;if(inputs.guesses)pstcPopulateGuesses(role,inputs.guesses);if(inputs.signings)pstcPopulateSignings(role,inputs.signings);}
  let signingDraftKey="";
  function pstcSigningDraftKey(role){const request=pstcRequestContext();return request&&role?(`cms.signingDraft.v1:${request.rivalryId}:${request.seasonNumber}:${role}`):"";}
  function pstcRemoveSigningDraft(key){if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pstcClearSigningDraft(role){const key=pstcSigningDraftKey(role);pstcRemoveSigningDraft(key);if(signingDraftKey===key)signingDraftKey="";}
  function pstcSaveSigningDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="SIGNING_ENTRY"||state.signingLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase())return false;
    const prefix=pstcRolePrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);rows.push({slot,name:String(name?.value||""),overall:String(ovr?.value||""),position:String(pos?.value||""),leagueId:pstcCanonical(league),league:String(league?.value||""),nationalityId:pstcCanonical(nationality),nationality:String(nationality?.value||"")});}
    const key=pstcSigningDraftKey(role);if(!key||typeof root.writeStorageValue!=="function")return false;if(!root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows})))return false;signingDraftKey=key;return true;
  }
  function pstcRestoreSigningDraft(role,own,force=false){
    const key=pstcSigningDraftKey(role),request=pstcRequestContext(),state=view?.state;
    if(!key||!request||!state||state.phase!=="SIGNING_ENTRY")return false;
    const shared=Array.isArray(own?.signings)?own.signings:[];
    if(state.signingLockedRoles?.includes(role)||shared.length){pstcRemoveSigningDraft(key);return false;}
    let draft;try{draft=JSON.parse((typeof root.readStorageValue==="function"?root.readStorageValue(key):null)||"null");}catch(_error){return false;}
    if(!draft||draft.version!==1||draft.rivalryId!==request.rivalryId||Number(draft.seasonNumber)!==request.seasonNumber||draft.role!==role||!Array.isArray(draft.rows))return false;
    const prefix=pstcRolePrefix(role);
    for(let slot=1;slot<=3;slot+=1){if(shared.some(row=>Number(row.slot)===slot))continue;const row=draft.rows.find(item=>Number(item.slot)===slot);if(!row)continue;const name=pstcField(`${prefix}Signing${slot}Name`),ovr=pstcField(`${prefix}Signing${slot}Overall`),pos=pstcField(`${prefix}Signing${slot}Position`),league=pstcField(`${prefix}Signing${slot}League`),nationality=pstcField(`${prefix}Signing${slot}Nationality`);const fill=node=>node&&(force||!String(node.value||""));if(fill(name))name.value=String(row.name||"");if(fill(ovr))ovr.value=String(row.overall||"").replace(/\D/g,"").slice(0,2);if(fill(pos)&&(force||SIGNING_POSITIONS.includes(row.position)))pos.value=SIGNING_POSITIONS.includes(row.position)?row.position:"";if(fill(league)){if(row.leagueId)pstcSetSelector(league,"league",row.leagueId);else{league.value=String(row.league||"");delete league.dataset.canonicalId;delete league.dataset.canonicalLabel;}}if(fill(nationality)){if(row.nationalityId)pstcSetSelector(nationality,"nationality",row.nationalityId);else{nationality.value=String(row.nationality||"");delete nationality.dataset.canonicalId;delete nationality.dataset.canonicalLabel;}}}
    signingDraftKey=key;return true;
  }
  // QoL 6: half-typed guesses against the rival survive a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on lock.
  let guessDraftRef=null;
  function pstcGuessDraftRef(role){const request=pstcRequestContext();return request&&role?{rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role}:null;}
  function pstcSameGuessDraftRef(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.seasonNumber===b.seasonNumber&&a.role===b.role);}
  function pstcGuessDraftKey(ref){return ref?`cms.draft.v1:${ref.rivalryId}:${ref.seasonNumber}:${ref.role}:transferGuess`:"";}
  function pstcRemoveGuessDraft(ref){const key=pstcGuessDraftKey(ref);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pstcClearGuessDraft(role){const ref=pstcGuessDraftRef(role);pstcRemoveGuessDraft(ref);if(pstcSameGuessDraftRef(guessDraftRef,ref))guessDraftRef=null;}
  function pstcSaveGuessDraft(role){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="GUESS_ENTRY"||state.guessLockedRoles?.includes(role)||view.managerRole!==role||pstcReplayPhase()||typeof root.writeStorageValue!=="function")return false;
    const prefix=pstcGuessPrefix(role),rows=[];
    for(let slot=1;slot<=3;slot+=1){const type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`),kind=String(type?.value||""),text=String(value?.value||"");if(!kind&&!text)continue;rows.push({slot,type:kind,valueId:pstcCanonical(value),value:text});}
    if(!rows.length){pstcClearGuessDraft(role);return true;}
    const ref=pstcGuessDraftRef(role);if(root.writeStorageValue(pstcGuessDraftKey(ref),JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,rows}))!==true)return false;guessDraftRef=ref;return true;
  }
  function pstcRestoreGuessDraft(role,own){
    const request=pstcRequestContext(),state=view?.state;
    if(!request||!state||state.phase!=="GUESS_ENTRY"||typeof root.readStorageValue!=="function")return false;
    if(state.guessLockedRoles?.includes(role)||(Array.isArray(own?.guesses)&&own.guesses.length)){pstcClearGuessDraft(role);return false;}
    let saved;try{saved=JSON.parse(root.readStorageValue(pstcGuessDraftKey(pstcGuessDraftRef(role)))||"null");}catch(_error){return false;}
    if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role||!Array.isArray(saved.rows))return false;
    const prefix=pstcGuessPrefix(role);
    for(let slot=1;slot<=3;slot+=1){
      const row=saved.rows.find(item=>Number(item?.slot)===slot),type=pstcField(`${prefix}Guess${slot}Type`),value=pstcField(`${prefix}Guess${slot}Value`);
      if(!row||!type||!value||String(type.value||"")||String(value.value||""))continue;
      const kind=String(row.type||"");if(kind!=="league"&&kind!=="nationality")continue;
      type.value=kind;pstcSyncGuessValue(type,value,true);
      const text=String(row.value||"").slice(0,120);if(row.valueId||text)pstcSetSelector(value,kind,String(row.valueId||text));
    }
    guessDraftRef=pstcGuessDraftRef(role);return true;
  }
  function pstcGuessDraftChange(event){
    const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!pstcSharedMarker())return;
    const prefix=pstcGuessPrefix(role);if(!new RegExp(`^${prefix}Guess[1-3](Type|Value)$`).test(target.id))return;
    if(view?.state?.phase!=="GUESS_ENTRY"||view.state.guessLockedRoles?.includes(role))return;
    pstcSaveGuessDraft(role);
    // The selector fills its canonical id in its own input handler, which runs after this capture handler; save once more when it has.
    if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(view?.managerRole===role)pstcSaveGuessDraft(role);},0);
  }
  function pstcDisableRole(role,disabled){const signing=pstcRolePrefix(role),guess=pstcGuessPrefix(role);for(let i=1;i<=3;i+=1){[`${signing}Signing${i}Name`,`${signing}Signing${i}Overall`,`${signing}Signing${i}Position`,`${signing}Signing${i}League`,`${signing}Signing${i}Nationality`,`${guess}Guess${i}Type`,`${guess}Guess${i}Value`].forEach(id=>pstcDisable(pstcField(id),disabled));}}
  function pstcRenderVerdictCard(role,rows){const target=pstcField(role==="playerOne"?"transferResultsOne":"transferResultsTwo");if(!target)return;target.replaceChildren();const heading=root.document.createElement("h4");heading.textContent=`${pstcManagerName(role)} · ${pstcClubName(role)}`;target.append(heading);if(!rows||!rows.length){const empty=root.document.createElement("p");empty.textContent="No signings were entered.";target.append(empty);return;}rows.forEach(row=>{const item=root.document.createElement("p"),name=root.document.createElement("strong"),status=root.document.createElement("span");name.textContent=row.name;status.textContent=row.release?"RELEASE · MATCHED BY RIVAL GUESS":"KEEP · NO RIVAL GUESS MATCH";item.append(name,root.document.createTextNode(" — "),status);target.append(item);});}
  function pstcRenderProgress(phase){
    const localPhase=PHASE_PROGRESS[phase]||"window",order=["window","guess_entry","signing_entry","completed"],index=order.indexOf(localPhase),screen=pstcField("transferChallenge");
    if(screen)screen.dataset.transferPhase=localPhase;
    root.document?.querySelectorAll?.("#transferPhaseNavigator [data-transfer-phase-step]").forEach(step=>{const stepIndex=order.indexOf(step.dataset.transferPhaseStep);step.classList.toggle("active",stepIndex===index);step.classList.toggle("done",stepIndex>=0&&stepIndex<index);});
    const copy={NOT_STARTED:`Transfer Window · ${pstcManagerName(view?.setup?.coordinatorRole||"playerOne")} starts the 15-minute window.`,WINDOW_OPEN:"Transfer Window · you both see the same clock and can agree to end it early.",GUESS_ENTRY:"Guesses · enter your guesses. Your rival can't see them yet.",SIGNING_ENTRY:"Signings · guesses are locked. Enter the signings you made in FIFA 17.",COMPLETED:"Verdicts · both sides are revealed and checked the same way."};
    pstcText("transferPhaseIntro",copy[phase]||copy.NOT_STARTED);
  }
  function pstcRenderTimer(){
    if(pstcExpiryPaused())return;
    const timer=pstcField("transferTimerDisplay"),state=view?.state;if(!timer)return;
    if(pstcReplayPhase()){timer.textContent="REPLAY";return;}
    if(!state||state.phase!=="WINDOW_OPEN"){timer.textContent=state?"00:00":"15:00";return;}
    const request=pstcRequestContext();
    if(!request||!pstcClockReady(request)){timer.textContent="SYNC";return;}
    const now=pstcAuthoritativeNow(request),deadline=Number(state.startedAtEpochMs)+15*60*1000,remaining=Math.max(0,Math.ceil((deadline-now)/1000)),minutes=Math.floor(remaining/60),seconds=remaining%60;timer.textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    const revision=Number(view.revision);
    if(expiryAttemptContextKey!==request.key||expiryAttemptRevision!==revision){pstcResetExpiryAttempts();expiryAttemptContextKey=request.key;expiryAttemptRevision=revision;}
    const retryAllowed=!expiryPermissionDenied&&expiryAttemptCount<EXPIRY_MAX_ATTEMPTS&&(expiryAttemptCount===0||now-expiryAttemptAt>=EXPIRY_RETRY_MS);
    if(remaining===0&&!busy&&retryAllowed){expiryAttemptCount+=1;expiryAttemptAt=now;void pstcMutate("advanceExpiredWindow");}
  }
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pstcWatchedKey=null;
  function pstcWatchSync(){let key="";try{key=pstcWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pstcWatchedKey)return;pstcWatchedKey=key;try{pstcWatchWait();}catch(_error){}}
  function pstcRender(){
    if(!root.document||!pstcSharedMarker())return false;
    pstcCapSigningNames();pstcWatchSync();
    const state=view?.state||null,role=view?.managerRole||pstcSetupState()?.managerRole||null;
    if(!role)return false;
    const key=viewContextKey||pstcBoundContextKey(view?.rivalryId||pstcSetupState()?.rivalryId||"",view?.seasonNumber||pstcSeason());pstcResetForContext(key,role);
    const other=role==="playerOne"?"playerTwo":"playerOne",actualPhase=state?.phase||"NOT_STARTED",replayPhase=pstcReplayPhase(key),phase=replayPhase||actualPhase,isReplay=Boolean(replayPhase),own=view?.ownInputs||null,opponent=view?.opponentInputs||null,screen=pstcField("transferChallenge");
    if(screen){if(isReplay)screen.dataset.sharedTransferReplay=phase;else delete screen.dataset.sharedTransferReplay;}
    pstcRenderProgress(phase);
    pstcText("transferChallengeTitle",`SEASON ${view?.seasonNumber||pstcSeason()} TRANSFER CHALLENGE`);pstcText("transferManagerOne",pstcManagerName("playerOne"));pstcText("transferManagerTwo",pstcManagerName("playerTwo"));pstcText("transferClubOne",pstcClubName("playerOne"));pstcText("transferClubTwo",pstcClubName("playerTwo"));pstcText("guessAgainstOneHeading",`${pstcManagerName("playerTwo")} guesses ${pstcManagerName("playerOne")}'s signings`);pstcText("guessAgainstTwoHeading",`${pstcManagerName("playerOne")} guesses ${pstcManagerName("playerTwo")}'s signings`);
    const start=pstcField("startTransferTimer"),end=pstcField("endTransferTimer"),complete=pstcField("completeTransferChallenge"),continueButton=pstcField("continueFromTransfers"),results=pstcField("transferChallengeResults"),actionBar=pstcField("transferPhaseActionBar"),signingGrid=root.document.querySelector("#transferChallenge .transferManagersGrid"),guessGrid=root.document.querySelector("#transferChallenge .transferGuessesGrid"),privacy=pstcField("transferGuessPrivacyNote"),summary=pstcField("transferPhaseLockSummary");
    pstcHidden(start,true);pstcHidden(end,true);pstcHidden(complete,true);pstcHidden(actionBar,true);pstcHidden(continueButton,true);pstcHidden(results,true);pstcHidden(signingGrid,true);pstcHidden(guessGrid,true);pstcHidden(privacy,true);pstcHidden(summary,true);pstcHidden(pstcOwnSigningCard(role),false);pstcHidden(pstcOtherSigningCard(role),true);pstcHidden(pstcOwnGuessCard(role),false);pstcHidden(pstcOtherGuessCard(role),true);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);
    if(own)pstcPopulateRole(role,own);if(actualPhase==="SIGNING_ENTRY"&&state?.signingLockedRoles?.includes(role))pstcClearSigningDraft(role);if(actualPhase==="SIGNING_ENTRY"&&!isReplay&&!state?.signingLockedRoles?.includes(role))pstcRestoreSigningDraft(role,own);
    if(actualPhase==="SIGNING_ENTRY"||actualPhase==="COMPLETED"||(actualPhase==="GUESS_ENTRY"&&state?.guessLockedRoles?.includes(role)))pstcClearGuessDraft(role);else if(actualPhase==="GUESS_ENTRY"&&!isReplay)pstcRestoreGuessDraft(role,own);
    if(phase==="NOT_STARTED"){
      pstcText("transferPhaseStatus",role===view?.setup?.coordinatorRole?"READY · YOU START THE WINDOW":`READY · WAITING FOR ${String(pstcManagerName(view?.setup?.coordinatorRole||"playerOne")).toUpperCase()} TO START`);
      if(role===view?.setup?.coordinatorRole){pstcHidden(start,false);start.textContent="START 15-MINUTE WINDOW";pstcDisable(start,busy);}
    }else if(phase==="WINDOW_OPEN"){
      if(isReplay){pstcText("transferPhaseStatus","REPLAY · TRANSFER WINDOW");pstcText("transferTimerDisplay","REPLAY");}
      else{const requested=state.endRequestedRoles?.includes(role);pstcText("transferPhaseStatus",requested?"TRANSFER WINDOW LIVE · YOU ASKED TO END EARLY":"TRANSFER WINDOW LIVE · BUILD YOUR FIFA 17 SQUAD");pstcHidden(end,false);end.textContent=requested?"EARLY END REQUESTED ✓":"REQUEST EARLY END";pstcDisable(end,busy||requested);pstcRenderTimer();}
    }else if(phase==="GUESS_ENTRY"){
      const locked=state.guessLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · GUESSES":locked?"GUESSES LOCKED · WAITING FOR YOUR RIVAL":"GUESSES · HIDDEN FROM YOUR RIVAL UNTIL YOU BOTH LOCK");pstcHidden(guessGrid,false);pstcHidden(privacy,false);if(privacy)privacy.textContent=isReplay?"Replay: read-only. Nothing new about your rival is shown.":"Enter your guesses. Your rival can't see them until you both finish.";if(!isReplay&&!locked){const card=pstcOwnGuessCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcSyncOwnGuessControls(role,true);pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY GUESSES";pstcDisable(complete,busy);}
    }else if(phase==="SIGNING_ENTRY"){
      const locked=state.signingLockedRoles?.includes(role);pstcText("transferPhaseStatus",isReplay?"REPLAY · SIGNINGS":locked?"SIGNINGS LOCKED · WAITING FOR YOUR RIVAL":"SIGNINGS · ENTER YOUR FIFA 17 TRANSFERS");pstcHidden(signingGrid,false);pstcHidden(summary,false);if(summary)summary.textContent=isReplay?"Replay: your signings are read-only. Nothing here changes the game or your save.":"Both sets of guesses are locked. Enter your own signings; your rival still can't see them.";if(!isReplay&&!locked){const card=pstcOwnSigningCard(role);card?.querySelectorAll("input,select").forEach(node=>pstcDisable(node,false));pstcHidden(actionBar,false);pstcHidden(complete,false);complete.textContent="LOCK MY SIGNINGS";pstcDisable(complete,busy);}
    }else if(phase==="COMPLETED"){
      pstcText("transferPhaseStatus","TRANSFER CHALLENGE COMPLETE · VERDICTS REVEALED");pstcHidden(signingGrid,false);pstcHidden(guessGrid,false);pstcHidden(results,false);pstcHidden(pstcOtherSigningCard(role),false);pstcHidden(pstcOtherGuessCard(role),false);pstcPopulateRole(role,own);pstcPopulateRole(other,opponent);pstcDisableRole("playerOne",true);pstcDisableRole("playerTwo",true);pstcRenderVerdictCard("playerOne",view?.verdicts?.playerOne||[]);pstcRenderVerdictCard("playerTwo",view?.verdicts?.playerTwo||[]);if(continueButton){continueButton.textContent="SEASON RESULTS NEXT";pstcHidden(continueButton,false);pstcDisable(continueButton,true);}
    }
    if(isReplay&&continueButton){continueButton.textContent=`CONTINUE REPLAY · ${phase.replaceAll("_"," ")}`;pstcHidden(actionBar,false);pstcHidden(continueButton,false);pstcDisable(continueButton,false);}
    pstcMarkWitness(key,phase);
    const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
  }
  function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButton";button.type="button";button.textContent="REFRESH CHALLENGE";button.addEventListener("click",event=>{event.preventDefault();if(pstcReplayPhase())return;void pstcRefresh().catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer Challenge could not be refreshed."));pstcReport("Unable to refresh Shared Transfer Challenge",error);});});actions.append(button);return button;}
  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER CHALLENGE…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} TRANSFER CHALLENGE`;status.textContent="Transfer Challenge: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN TRANSFER WINDOW";status.textContent="Transfer Challenge: window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="ENTER GUESSES";status.textContent="Transfer Challenge: guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="ENTER SIGNINGS";status.textContent="Transfer Challenge: signings";}else{button.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer Challenge: complete";}if(rouletteLoadError)status.textContent="The roulette could not load. Check the connection and tap again.";return true;}
  // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
  // r87 Russian Roster Roulette (js/rosterRouletteStep.js): before this season's Transfer Challenge opens, this manager does
  // the season's roulette once (board from season 2, both spins, the release). It decides for itself whether it applies (a
  // Showdown confirmed on r87 or later, not done yet on this browser) and never rejects. false = he went back to Home, or the
  // step itself could not load: the window then stays shut with a TRY AGAIN line on the dashboard (red team R87-B-02).
  // The confirm time comes with the Setup read; only a manager whose Setup state came from his own confirm tap reads it once.
  async function pstcRouletteFirst(request){
    rouletteLoadError=false;
    try{
      if(!view||!view.managerRole||!request)return true;
      let confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
      if(!Number.isFinite(confirmedAtMs)&&typeof setupApi?.refresh==="function"){await Promise.resolve(setupApi.refresh()).catch(()=>null);confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;}
      // No confirm time = a Showdown the roulette never applies to (the step's own rule), so nothing is loaded.
      if(!Number.isFinite(confirmedAtMs))return true;
      const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,clubs:{playerOne:pstcClubName("playerOne"),playerTwo:pstcClubName("playerTwo")},confirmedAtMs,phase:view.state?.phase||"NOT_STARTED",
        verdicts:season=>pstcRouletteVerdicts(request,season)};
      let timer;const step=await Promise.race([pstcLoadScript("roster-roulette-step","js/rosterRouletteStep.js",()=>root.CareerModeRosterRouletteStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
      if(!step){rouletteLoadError=true;return false;}
      if(!step.decide(ctx))return true;
      return await step.runBeforeTransfers(ctx);
    }catch(_error){rouletteLoadError=true;return false;}
  }
  // r87 roulette boards: each finished season's verdicts (both managers' signings, overall and release) are kept on this
  // phone when the Transfer Challenge shows them, so the next spins build their boards with no read. A season not kept
  // here (another phone, cleared storage) costs one Transfer Challenge read, once.
  const PSTC_ROULETTE_VERDICTS_KEY="careerModeShowdown.rouletteVerdicts.v1",PSTC_ROULETTE_VERDICTS_MAX=40;
  function pstcVerdictRows(rows){return Array.isArray(rows)?rows.map(row=>({slot:row.slot,name:row.name,overall:Number.isInteger(row.overall)?row.overall:null,position:SIGNING_POSITIONS.includes(row.position)?row.position:null,release:row.release===true})):null;}
  function pstcVerdictList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(PSTC_ROULETTE_VERDICTS_KEY)||"[]");return Array.isArray(value)?value.filter(item=>Array.isArray(item)&&item.length===2&&typeof item[0]==="string"):[];}catch(_error){return [];}}
  function pstcKeptVerdicts(rivalryId,season){const found=pstcVerdictList().find(item=>item[0]===`${rivalryId}|${season}`),value=found&&found[1];return value&&Array.isArray(value.playerOne)&&Array.isArray(value.playerTwo)?value:null;}
  function pstcKeepVerdicts(rivalryId,season,verdicts){
    const value={playerOne:pstcVerdictRows(verdicts?.playerOne),playerTwo:pstcVerdictRows(verdicts?.playerTwo)};if(!rivalryId||!value.playerOne||!value.playerTwo)return null;
    try{const key=`${rivalryId}|${season}`,list=pstcVerdictList().filter(item=>item[0]!==key);list.push([key,value]);if(typeof root.writeStorageValue==="function")root.writeStorageValue(PSTC_ROULETTE_VERDICTS_KEY,JSON.stringify(list.slice(-PSTC_ROULETTE_VERDICTS_MAX)));}catch(_error){}
    return value;
  }
  async function pstcRouletteVerdicts(request,season){
    try{
      const kept=pstcKeptVerdicts(request.rivalryId,season);if(kept)return {ok:true,verdicts:kept};
      const provided=await pstcProviderOptions(request,true);if(!provided?.options)pstcFail("TRANSFER_PROVIDER_UNAVAILABLE");
      const result=await provider.read({...provided.options,seasonNumber:season});
      if(!result||result.ok!==true)return {ok:false,code:result?.code||"TRANSFER_PROVIDER_FAILED"};
      if(result.state?.phase!=="COMPLETED"||!result.verdicts)return {ok:false,code:"TRANSFER_NOT_COMPLETED"};
      const value=pstcKeepVerdicts(request.rivalryId,season,result.verdicts);
      return value?{ok:true,verdicts:value}:{ok:false,code:"TRANSFER_PROVIDER_STATE_INVALID"};
    }catch(error){return {ok:false,code:error?.code||"TRANSFER_PROVIDER_FAILED"};}
  }
  function pstcCloseRoulette(){try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}}
  function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
  async function pstcOpenNow(){if(!pstcSharedMarker())return false;await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");if(!await pstcRouletteFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}const shown=await root.navigateTo("transferChallenge");pstcCloseRoulette();if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
  async function pstcHandleAction(id){
    if(id==="seasonPrimaryAction")return pstcOpen();
    if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
    if(pstcReplayPhase())return false;
    if(id==="startTransferTimer")return pstcMutate("startWindow");
    if(id==="endTransferTimer")return pstcMutate("requestEndWindow");
    if(id==="completeTransferChallenge"){
      const phase=view?.state?.phase,role=view?.managerRole;if(phase==="GUESS_ENTRY"){const guesses=pstcBuildGuesses(role);if(!await pstcConfirmPartialLock(guesses.length,"guesses"))return false;return pstcMutate("lockGuesses",{guesses});}if(phase==="SIGNING_ENTRY"){const signings=pstcBuildSignings(role);if(!await pstcConfirmPartialLock(signings.length,"signings"))return false;return pstcMutate("lockSignings",{signings});}pstcFail("TRANSFER_PHASE_INVALID");
    }
    if(id==="continueFromTransfers"){pstcSetError("Season results are not open yet. Tap REFRESH, then try again.");return false;}
    return false;
  }
  function pstcCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pstcSharedMarker())return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();void pstcHandleAction(target.id).catch(error=>{pstcSetError(pstcErrorText(error,"Shared Transfer Challenge failed."));if(!pstcFormMistake(error))pstcReport("Shared Transfer Challenge action failed",error);});}
  // r87: a form mistake caught on this phone is shown on the card only; a second toast covered the signing rows on phones.
  function pstcFormMistake(error){return Boolean(error)&&error.providerResult!==true&&(error.code==="TRANSFER_SIGNINGS_INVALID"||error.code==="TRANSFER_GUESSES_INVALID");}
  async function pstcTick(light=false){
    if(!pstcSharedMarker()||root.document?.visibilityState==="hidden")return;
    const currentKey=pstcCurrentContextKey();if(viewContextKey&&(!currentKey||viewContextKey!==currentKey))pstcClearCachedContext();
    // RS-04 (r87): a COMPLETED view is final, except while this page has neither its verdicts nor a kept copy (a post-lock refresh
    // that failed): then the next check reads it once more, while both managers are still on this screen, instead of the roulette
    // paying a slower read of it next season on one phone only.
    if(view?.state?.phase==="COMPLETED"&&viewContextKey&&currentKey&&viewContextKey===currentKey&&(view.verdicts||pstcKeptVerdicts(view.rivalryId,view.seasonNumber))){pstcDecorateDashboard();return;}
    try{if(!pstcConfirmedShared()||!pstcCareerReady()){await pstcEnsureDependencies();await setupApi.refresh();await careerApi.refresh();}if(pstcConfirmedShared()&&pstcCareerReady()&&!busy){const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden")){if(light!==true)pstcScreenFresh();await pstcRefresh(light===true,false);}else if(!view)await pstcRefresh(false,false);else pstcDecorateDashboard();}}catch(_error){}
  }
  // Read-only: the fast lane only calls pstcTick (the same provider read as REFRESH CHALLENGE), never a write.
  function pstcWaitingKey(){
    if(!view||!view.managerRole||!pstcTransferScreenVisible()||pstcReplayPhase())return "";
    const state=view.state||{phase:"NOT_STARTED"},role=view.managerRole,other=role==="playerOne"?"playerTwo":"playerOne",has=(list,item)=>Array.isArray(list)&&list.includes(item);
    if((state.phase||"NOT_STARTED")==="NOT_STARTED"&&view.setup?.coordinatorRole&&role!==view.setup.coordinatorRole)return `${viewContextKey}|start`;
    if(state.phase==="WINDOW_OPEN"&&has(state.endRequestedRoles,role)&&!has(state.endRequestedRoles,other))return `${viewContextKey}|end`;
    if(state.phase==="GUESS_ENTRY"&&has(state.guessLockedRoles,role))return `${viewContextKey}|guesses`;
    if(state.phase==="SIGNING_ENTRY"&&has(state.signingLockedRoles,role))return `${viewContextKey}|signings`;
    return "";
  }
  function pstcFastPollDue(){const key=pstcWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  function pstcWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pstcWaitingKey()||pstcLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`:null)(pstcRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pstcWaitingKey()&&pstcLiveScreen());}catch(_error){relaxed=false;}budget.watchWaitPoint("transfer",path,pstcWaitWake,{relaxed});}
  // r75: the 15 s check of the visible Transfer screen always reads the shared challenge from the server, so a partner's
  // lock still shows within one poll on the screen the manager is looking at; checks from other screens reuse recent reads.
  // r84: the listener also watches while the window, guesses or signings are open on screen (not only after this manager's own
  // move): 15 s fresh reads of this document were ~32 billed reads/min for both phones over a 25-40 minute transfer window.
  // r84 trim: also before the window starts (no challenge yet), the most expensive idle: the coordinator's own START screen
  // re-read the context every 15 s; the listener now watches the (still missing) challenge document instead.
  function pstcLiveScreen(){try{return Boolean(view&&view.managerRole&&pstcTransferScreenVisible()&&!pstcReplayPhase()&&(!view.state||["WINDOW_OPEN","GUESS_ENTRY","SIGNING_ENTRY"].includes(view.state.phase)));}catch(_error){return false;}}
  function pstcScreenFresh(){try{const request=pstcRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
  function pstcWaitWake(){if(!busy){void pstcTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pstcTick(true);},400);}
  // r84 trim: like Results and Commit, the 3 s fallback check stands down while the wait listener on this exact challenge is
  // healthy; the listener's delivery wakes pstcTick at once and the 15 s check still runs. Each fallback check re-ran the
  // read-only transaction (challenge, rivalry, session, own role) about 20 times a minute on the waiting phone.
  function pstcWaitHealthy(){const request=pstcRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/transferChallenges/season_${request.seasonNumber}`);}
  function pstcFastTick(){pstcWatchWait();if(pstcWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pstcFastPollDue())return;void pstcTick(true);}
  // Listen during bubbling so selector target handlers normalize the ID before the synchronous draft save.
  // Red team R87-B-04: a second tab of the same signing entry saved a newer draft. This tab takes it over before its next
  // autosave, so a stale form never writes over the newer signings (the browser sends this event only to the other tabs).
  function pstcSigningDraftStorage(event){const role=view?.managerRole,key=role&&pstcSigningDraftKey(role);if(!key||event?.key!==key||!event.newValue)return;if(view?.state?.phase!=="SIGNING_ENTRY"||view.state.signingLockedRoles?.includes(role)||pstcReplayPhase())return;pstcRestoreSigningDraft(role,view.ownInputs||null,true);}
  function pstcSigningDraftChange(event){const target=event?.target,role=view?.managerRole;if(!target?.id||!role||!target.id.startsWith(`${pstcRolePrefix(role)}Signing`))return;if(view?.state?.phase==="SIGNING_ENTRY"&&!view.state.signingLockedRoles?.includes(role))pstcSaveSigningDraft(role);}
  function pstcTimerTick(){if(!pstcSharedMarker()||pstcReplayPhase()||pstcExpiryPaused())return;const active=root.document&&root.document.getElementById("transferChallenge");if(active&&!active.classList.contains("hidden"))pstcRenderTimer();}
  function pstcVisibilityChange(){
    if(!pstcSharedMarker())return;
    if(root.document?.visibilityState==="hidden"){if(view?.state?.phase==="WINDOW_OPEN")expiryNeedsAuthority=true;return;}
    if(view?.state?.phase!=="WINDOW_OPEN"||pstcReplayPhase()){expiryNeedsAuthority=false;void pstcTick();return;}
    // Keep the shared deadline; refresh its clock and authority before expiry may act again.
    pstcClearClock();expiryNeedsAuthority=true;pstcScreenFresh();void pstcRefresh().catch(()=>{});
  }
  function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("input",pstcSigningDraftChange);root.document.addEventListener("change",pstcSigningDraftChange);if(typeof root.addEventListener==="function")root.addEventListener("storage",pstcSigningDraftStorage);root.document.addEventListener("input",pstcGuessDraftChange,true);root.document.addEventListener("change",pstcGuessDraftChange,true);root.document.addEventListener("visibilitychange",pstcVisibilityChange);}root.addEventListener?.("online",pstcVisibilityChange);root.addEventListener?.("career-mode-shared-season-cursor-change",()=>{pstcClearCachedContext();void pstcTick();});if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pstcTick(),POLL_MS);timerLoop=root.setInterval(pstcTimerTick,TIMER_MS);root.setInterval(pstcFastTick,FAST_POLL_MS);}if(pstcSharedMarker())void pstcTick();return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute,canResumeResults:pstcCanResumeResults,rememberResultsView:pstcRememberResultsView});
});

```

## FILE: firestore.transfer-challenge-production.fragment.rules
```text
// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_BEGIN
    function ssjrTransferValidOperationId(value) { return value is string && value.matches('^transfer_op_[0-9a-f]{32}$'); }
    function ssjrTransferValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
    function ssjrTransferValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
    // JOB-1052: exactly the repository FIFA 17 catalog the game's reader accepts. One anchored alternation per catalog (and one over both), so each
    // id costs one regex match, not a list membership scan: the max-size 3-guess/3-signing transaction stays inside the evaluation budget.
    // The build script fills the placeholders from data/transferOptions.js; they are never hand-edited. A non-string value makes matches() error, which denies.
    function ssjrTransferValidOptionId(value) { return value.matches('__SSJR_TRANSFER_OPTION_ID_PATTERN__'); }
    function ssjrTransferCatalogLeagueId(value) { return value.matches('__SSJR_TRANSFER_LEAGUE_ID_PATTERN__'); }
    function ssjrTransferCatalogNationalityId(value) { return value.matches('__SSJR_TRANSFER_NATIONALITY_ID_PATTERN__'); }
    // JOB-1052: a signing name the reader accepts: 1 to 80 characters and unchanged by JavaScript String.trim() (no leading or trailing
    // white space or line terminator: TAB..CR, space, U+00A0, U+1680, U+2000..U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF).
    function ssjrTransferValidSigningName(value) {
      return value is string
        && value.size() >= 1
        && value.size() <= 80
        && value.matches('^[^\\t-\\r \\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}]([\\s\\S]*[^\\t-\\r \\x{00A0}\\x{1680}\\x{2000}-\\x{200A}\\x{2028}\\x{2029}\\x{202F}\\x{205F}\\x{3000}\\x{FEFF}])?$');
    }
    // JOB-1051: a lock salt is null (not set yet) or exactly 64 lowercase hex characters.
    function ssjrTransferValidSalt(value) { return value == null || (value is string && value.matches('^[0-9a-f]{64}$')); }
    function ssjrTransferSeasonMatches(transferId, seasonNumber) {
      return seasonNumber is int
        && seasonNumber >= 1
        && seasonNumber <= 10
        && transferId == 'season_' + string(seasonNumber);
    }
    function ssjrTransferSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data; }
    function ssjrTransferCareer(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/careerStart/authoritative).data; }
    function ssjrTransferPrerequisites(rivalryId, seasonNumber) {
      let setup = ssjrTransferSetup(rivalryId);
      let career = ssjrTransferCareer(rivalryId);
      return setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && setup.totalSeasons in [1,3,5,10]
        && seasonNumber >= 1
        && seasonNumber <= setup.totalSeasons
        && career.setupRevision == 6
        && career.totalSeasons == setup.totalSeasons
        && career.revision == 2
        && career.phase == 'CAREER_START_READY'
        && career.acknowledgedRoles is list
        && career.acknowledgedRoles.size() == 2
        && 'playerOne' in career.acknowledgedRoles
        && 'playerTwo' in career.acknowledgedRoles;
    }
    function ssjrTransferRoleListValid(value) {
      return value is list
        && value.size() <= 2
        && value.toSet().size() == value.size()
        && value.toSet().hasOnly(['playerOne','playerTwo']);
    }
    function ssjrTransferPublicExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','coordinatorRole','phase','revision',
        'startedAt','endedAt','endRequestedRoles','guessLockedRoles','signingLockedRoles',
        'operationIds','operationTypes','operationHashes','baseRevisions','actorRoles',
        'activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrTransferPublicShape(root, rivalryId, transferId) {
      let setup = ssjrTransferSetup(rivalryId);
      let historySize = root.operationIds.size();
      return ssjrTransferPublicExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedTransferChallenge'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
        && ssjrTransferPrerequisites(rivalryId, root.seasonNumber)
        && root.runtimeRevision == '1.9.1-r8'
        && root.coordinatorRole == setup.coordinatorRole
        && (root.phase == 'WINDOW_OPEN' || root.phase == 'GUESS_ENTRY' || root.phase == 'SIGNING_ENTRY' || root.phase == 'COMPLETED')
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 7
        && root.startedAt is timestamp
        && (root.endedAt == null || root.endedAt is timestamp)
        && ssjrTransferRoleListValid(root.endRequestedRoles)
        && ssjrTransferRoleListValid(root.guessLockedRoles)
        && ssjrTransferRoleListValid(root.signingLockedRoles)
        && root.operationIds is list
        && root.operationTypes is list
        && root.operationHashes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && historySize == root.revision
        && root.operationTypes.size() == historySize
        && root.operationHashes.size() == historySize
        && root.baseRevisions.size() == historySize
        && root.actorRoles.size() == historySize
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrTransferPublicPrefixPreserved(before, after) {
      let i = before.revision;
      return after.operationIds == before.operationIds.concat([after.operationIds[i]])
        && after.operationTypes == before.operationTypes.concat([after.operationTypes[i]])
        && after.operationHashes == before.operationHashes.concat([after.operationHashes[i]])
        && after.baseRevisions == before.baseRevisions.concat([after.baseRevisions[i]])
        && after.actorRoles == before.actorRoles.concat([after.actorRoles[i]]);
    }
    function ssjrTransferNewOperationValid(before, after) {
      let i = before.revision;
      return ssjrTransferValidOperationId(after.operationIds[i])
        && !(after.operationIds[i] in before.operationIds)
        && ssjrTransferValidHash(after.operationHashes[i])
        && after.baseRevisions[i] == before.revision
        && after.actorRoles[i] == ssjrActorRole(after.rivalryId);
    }
    function ssjrTransferOwnRoleAfter(rivalryId, transferId) {
      let role = ssjrActorRole(rivalryId);
      return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)/roles/$(role)).data;
    }
    function ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, operationType) {
      let role = ssjrActorRole(rivalryId);
      let own = ssjrTransferOwnRoleAfter(rivalryId, transferId);
      return own.managerRole == role
        && own.activeSessionId == after.activeSessionId
        && own.updatedByDeviceId == after.updatedByDeviceId
        && own.updatedAt == request.time
        && (
          (operationType == 'lock-guesses' && own.guessLockedAt == request.time && own.signingLockedAt == null)
          || (operationType == 'lock-signings' && own.signingLockedAt == request.time)
        );
    }
    function ssjrTransferEndRequestTransition(before, after, actorRole) {
      let priorSize = before.endRequestedRoles.size();
      return before.phase == 'WINDOW_OPEN'
        && priorSize <= 1
        && !(actorRole in before.endRequestedRoles)
        && after.endRequestedRoles == before.endRequestedRoles.concat([actorRole])
        && after.guessLockedRoles == before.guessLockedRoles
        && after.signingLockedRoles == before.signingLockedRoles
        && (
          (priorSize == 0 && after.phase == 'WINDOW_OPEN' && after.endedAt == null)
          || (priorSize == 1 && after.phase == 'GUESS_ENTRY' && after.endedAt == request.time)
        );
    }
    function ssjrTransferExpiryTransition(before, after) {
      return before.phase == 'WINDOW_OPEN'
        && request.time >= before.startedAt + duration.value(15, 'm')
        && after.phase == 'GUESS_ENTRY'
        && after.endedAt == request.time
        && after.endRequestedRoles == before.endRequestedRoles
        && after.guessLockedRoles == before.guessLockedRoles
        && after.signingLockedRoles == before.signingLockedRoles;
    }
    function ssjrTransferGuessLockTransition(rivalryId, transferId, before, after, actorRole) {
      let priorSize = before.guessLockedRoles.size();
      return before.phase == 'GUESS_ENTRY'
        && priorSize <= 1
        && !(actorRole in before.guessLockedRoles)
        && after.guessLockedRoles == before.guessLockedRoles.concat([actorRole])
        && after.endRequestedRoles == before.endRequestedRoles
        && after.signingLockedRoles == before.signingLockedRoles
        && after.endedAt == before.endedAt
        && ((priorSize == 0 && after.phase == 'GUESS_ENTRY') || (priorSize == 1 && after.phase == 'SIGNING_ENTRY'))
        && ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, 'lock-guesses');
    }
    function ssjrTransferSigningLockTransition(rivalryId, transferId, before, after, actorRole) {
      let priorSize = before.signingLockedRoles.size();
      return before.phase == 'SIGNING_ENTRY'
        && priorSize <= 1
        && actorRole in before.guessLockedRoles
        && !(actorRole in before.signingLockedRoles)
        && after.signingLockedRoles == before.signingLockedRoles.concat([actorRole])
        && after.endRequestedRoles == before.endRequestedRoles
        && after.guessLockedRoles == before.guessLockedRoles
        && after.endedAt == before.endedAt
        && ((priorSize == 0 && after.phase == 'SIGNING_ENTRY') || (priorSize == 1 && after.phase == 'COMPLETED'))
        && ssjrTransferPrivatePayloadLinked(rivalryId, transferId, after, 'lock-signings');
    }
    function ssjrTransferValidCreate(rivalryId, transferId) {
      let after = request.resource.data;
      return ssjrTransferPublicShape(after, rivalryId, transferId)
        && after.revision == 1
        && after.phase == 'WINDOW_OPEN'
        && after.startedAt == request.time
        && after.endedAt == null
        && after.endRequestedRoles.size() == 0
        && after.guessLockedRoles.size() == 0
        && after.signingLockedRoles.size() == 0
        && ssjrValidOperationId(after.operationIds[0]) == false
        && ssjrTransferValidOperationId(after.operationIds[0])
        && after.operationTypes[0] == 'start-window'
        && ssjrTransferValidHash(after.operationHashes[0])
        && after.baseRevisions[0] == 0
        && after.actorRoles[0] == after.coordinatorRole
        && after.coordinatorRole == ssjrActorRole(rivalryId);
    }
    // Updates preserve the secured creation envelope and validate only the append-only transition delta.
    function ssjrTransferValidUpdate(rivalryId, transferId) {
      let before = resource.data;
      let after = request.resource.data;
      let i = before.revision;
      let type = after.operationTypes[i];
      let role = ssjrActorRole(rivalryId);
      return ssjrTransferPublicExactKeys(after)
        && after.schemaVersion == before.schemaVersion
        && after.objectType == before.objectType
        && after.rivalryId == before.rivalryId
        && after.seasonNumber == before.seasonNumber
        && after.runtimeRevision == before.runtimeRevision
        && after.coordinatorRole == before.coordinatorRole
        && after.startedAt == before.startedAt
        && after.revision == before.revision + 1
        && after.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)
        && ssjrTransferPublicPrefixPreserved(before, after)
        && ssjrTransferNewOperationValid(before, after)
        && (
          (type == 'request-end-window' && ssjrTransferEndRequestTransition(before, after, role))
          || (type == 'advance-expired-window' && ssjrTransferExpiryTransition(before, after))
          || (type == 'lock-guesses' && ssjrTransferGuessLockTransition(rivalryId, transferId, before, after, role))
          || (type == 'lock-signings' && ssjrTransferSigningLockTransition(rivalryId, transferId, before, after, role))
        );
    }
    function ssjrTransferGuessRowValid(value) {
      return value is map
        && value.keys().hasOnly(['slot','type','valueId'])
        && value.slot is int
        && value.slot >= 1
        && value.slot <= 3
        && (value.type == 'league' || value.type == 'nationality')
        && ssjrTransferValidOptionId(value.valueId)
        && ((value.type == 'league' && ssjrTransferCatalogLeagueId(value.valueId))
          || (value.type == 'nationality' && ssjrTransferCatalogNationalityId(value.valueId)));
    }
    function ssjrTransferSigningRowValid(value) {
      return value is map
        && value.keys().hasOnly(['slot','name','leagueId','nationalityId','overall','position'])
        && (!('overall' in value) || (value.overall is int && value.overall >= 30 && value.overall <= 99))
        && (!('position' in value) || value.position in ['GK','RB','RWB','CB','LB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'])
        && value.slot is int
        && value.slot >= 1
        && value.slot <= 3
        && ssjrTransferValidSigningName(value.name)
        && ssjrTransferValidOptionId(value.leagueId)
        && ssjrTransferCatalogLeagueId(value.leagueId)
        && ssjrTransferValidOptionId(value.nationalityId)
        && ssjrTransferCatalogNationalityId(value.nationalityId);
    }
    function ssjrTransferGuessesValid(value) {
      return value is list
        && value.size() <= 3
        && (value.size() < 1 || ssjrTransferGuessRowValid(value[0]))
        && (value.size() < 2 || (ssjrTransferGuessRowValid(value[1]) && value[1].slot != value[0].slot))
        && (value.size() < 3 || (ssjrTransferGuessRowValid(value[2]) && value[2].slot != value[0].slot && value[2].slot != value[1].slot));
    }
    function ssjrTransferSigningsValid(value) {
      return value is list
        && value.size() <= 3
        && (value.size() < 1 || ssjrTransferSigningRowValid(value[0]))
        && (value.size() < 2 || (ssjrTransferSigningRowValid(value[1]) && value[1].slot != value[0].slot))
        && (value.size() < 3 || (ssjrTransferSigningRowValid(value[2]) && value[2].slot != value[0].slot && value[2].slot != value[1].slot));
    }
    // JOB-1051: a role document written by r66 has no salt keys; a salted one has both (each null or 64 lowercase hex). Never only one.
    function ssjrTransferPrivateExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','managerRole','guesses','signings',
        'guessLockedAt','signingLockedAt','activeSessionId','updatedAt','updatedByDeviceId',
        'guessSalt','signingSalt'
      ])
        && (root.keys().hasAll(['guessSalt','signingSalt']) || !root.keys().hasAny(['guessSalt','signingSalt']));
    }
    function ssjrTransferPrivateBase(root, rivalryId, transferId, managerRole) {
      return ssjrTransferPrivateExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedTransferChallengeRole'
        && root.rivalryId == rivalryId
        && ssjrTransferSeasonMatches(transferId, root.seasonNumber)
        && root.managerRole == managerRole
        && managerRole == ssjrActorRole(rivalryId)
        && ssjrTransferGuessesValid(root.guesses)
        && (root.signings == null || ssjrTransferSigningsValid(root.signings))
        && root.guessLockedAt is timestamp
        && (root.signingLockedAt == null || root.signingLockedAt is timestamp)
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrTransferPublicAfter(rivalryId, transferId) {
      return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
    }
    function ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole) {
      let after = request.resource.data;
      let public = ssjrTransferPublicAfter(rivalryId, transferId);
      let i = public.revision - 1;
      return ssjrTransferPrivateBase(after, rivalryId, transferId, managerRole)
        && after.signings == null
        && after.signingLockedAt == null
        && ssjrTransferValidSalt(after.get('guessSalt', null))
        && after.get('signingSalt', null) == null
        && after.guessLockedAt == request.time
        && public.operationTypes[i] == 'lock-guesses'
        && public.actorRoles[i] == managerRole
        && managerRole in public.guessLockedRoles
        && public.activeSessionId == after.activeSessionId
        && public.updatedByDeviceId == after.updatedByDeviceId
        && public.updatedAt == request.time;
    }
    function ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole) {
      let before = resource.data;
      let after = request.resource.data;
      let public = ssjrTransferPublicAfter(rivalryId, transferId);
      let i = public.revision - 1;
      return ssjrTransferPrivateExactKeys(after)
        && after.schemaVersion == before.schemaVersion
        && after.objectType == before.objectType
        && after.rivalryId == before.rivalryId
        && after.seasonNumber == before.seasonNumber
        && after.managerRole == before.managerRole
        && managerRole == before.managerRole
        && managerRole == ssjrActorRole(rivalryId)
        && after.guesses == before.guesses
        && after.guessLockedAt == before.guessLockedAt
        && after.get('guessSalt', null) == before.get('guessSalt', null)
        && before.get('signingSalt', null) == null
        && ssjrTransferValidSalt(after.get('signingSalt', null))
        && before.signings == null
        && before.signingLockedAt == null
        && ssjrTransferSigningsValid(after.signings)
        && after.signingLockedAt == request.time
        && after.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId)
        && public.operationTypes[i] == 'lock-signings'
        && public.actorRoles[i] == managerRole
        && managerRole in public.signingLockedRoles
        && public.activeSessionId == after.activeSessionId
        && public.updatedByDeviceId == after.updatedByDeviceId
        && public.updatedAt == request.time;
    }
    function ssjrTransferPrivateReadable(rivalryId, transferId, managerRole) {
      let public = get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(transferId)).data;
      return ssjrEntitled(rivalryId)
        && (managerRole == ssjrActorRole(rivalryId) || public.phase == 'COMPLETED');
    }
// SSJR_TRANSFER_CHALLENGE_FUNCTIONS_END

// SSJR_TRANSFER_CHALLENGE_MATCH_BEGIN
      match /transferChallenges/{transferId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrTransferValidCreate(rivalryId, transferId);
        allow update: if ssjrTransferValidUpdate(rivalryId, transferId);

        match /roles/{managerRole} {
          allow get: if ssjrTransferPrivateReadable(rivalryId, transferId, managerRole);
          allow list, delete: if false;
          allow create: if ssjrTransferPrivateCreateValid(rivalryId, transferId, managerRole);
          allow update: if ssjrTransferPrivateUpdateValid(rivalryId, transferId, managerRole);
        }
      }
// SSJR_TRANSFER_CHALLENGE_MATCH_END

```

## FILE: js/transferScreenV10.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTransferScreenV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-27 (G-13 part 2d): Team V's Transfer War skin (visual-assets/v10_1/tr2/slice-02-plate, pinned 5e05a1f)
  // on the shared Transfer Challenge screen. Skin, don't rewire:
  // - js/productionSharedTransferChallenge.js keeps rendering into its own elements. While the skin is mounted those
  //   very elements (same ids, classes, data-* hooks, text and listeners) are moved into Team V's layout, and they
  //   go back to their original place when the skin unmounts or redraws. The status line is drawn by Team V's sign
  //   from production's own status text.
  // - Team V's own copies of those elements are dropped; Team V elements that only label things keep a "tw-" id.
  // - The frame is built from the production view the module already exposes (getState) and from the text it already
  //   rendered. The rival's guesses and signings are read only when the provider has revealed them (COMPLETED).
  const SCREEN="transferChallenge";
  const DIR="tr2/slice-02-plate/";
  const FILES=Object.freeze({
    css:Object.freeze([DIR+"plate.css","../../css/v10Transfer.css"]),
    script:Object.freeze(["v10-transfer-plate",DIR+"plate.js",()=>Boolean(root.TWPlate&&typeof root.TWPlate.render==="function")]),
    platemap:DIR+"platemap.json"
  });
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const LAYOUTS=Object.freeze({window:"WINDOW_OPEN",guess_entry:"GUESS_ENTRY",signing_entry:"SIGNING_ENTRY",completed:"COMPLETED"});
  // Team V's approved copy (fixtures.json "strings" at 5e05a1f, f1Action as factory/v1-wtt5ye 273115c) for the labels Team V draws itself. Production keeps
  // every text it renders (status, buttons, timer, lock summary, errors): those elements are the production ones.
  const STRINGS=Object.freeze({
    title:"SEASON {season} · TRANSFER CHALLENGE",back:"HOME",refresh:"REFRESH",rail:Object.freeze(["Window","Guesses","Signings","Verdicts"]),railAriaLabel:"Transfer Challenge progress",
    f1Intro:"Ends early only if you both agree.",f1RulesLine:"15 MIN · 3 SIGNINGS · 3 GUESSES",f1Action:"REQUEST EARLY END",f1ActionRequested:"EARLY END REQUESTED ✓",
    ruleNote:"Guess a league or nationality. A matching signing must be released.",
    guessHeading:"Guess {RIVAL}'s signings",privacyNote:"Hidden from {RIVAL} until you both lock.",
    selectPlaceholder:"Guess type",selectLeague:"League",selectNationality:"Nationality",valuePlaceholder:"Pick a type first",primary:"LOCK GUESSES",
    signWindowClosed:"WINDOW CLOSED",tagYou:"YOU",tagSealed:"SEALED",tagPrivate:"PRIVATE",
    signingPrimary:"LOCK MY SIGNINGS",signingInvalid:"Complete signing {n} with player name, position, overall (30-99), previous league and nationality.",
    signingPlaceholderName:"Player name",signingPlaceholderLeague:"Previous league",signingPlaceholderNationality:"Nationality",signingPlaceholderOverall:"OVR",signingPlaceholderPosition:"POS",
    verdictHeading:"{MANAGER} · {CLUB}",verdictEmpty:"No signings were entered.",verdictRelease:"RELEASE · MATCHED BY RIVAL GUESS",verdictKeep:"KEEP · NO RIVAL GUESS MATCH",
    continueLabel:"SEASON RESULTS NEXT",guessRevealHeading:"{GUESSER} guesses {OWNER}'s signings"
  });
  const tfNode=typeof module!=="undefined"&&module.exports;

  function tfFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(tfFreeze);Object.freeze(value);}return value;}
  const tfText=value=>String(value??"").trim();
  const tfOther=role=>role==="playerOne"?"playerTwo":"playerOne";
  function tfLabel(label,kind,id){
    const value=tfText(id);if(!value)return "";
    try{const option=typeof label==="function"?label(kind,value):null;if(option&&tfText(option.label))return tfText(option.label);}catch(_error){}
    return value;
  }
  function tfSigningRows(rows,label){
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,name:tfText(row.name),league:tfLabel(label,"league",row.leagueId),nationality:tfLabel(label,"nationality",row.nationalityId),overall:Number.isInteger(row.overall)?row.overall:null,position:typeof row.position==="string"?row.position:null})).sort((a,b)=>a.slot-b.slot);
  }
  function tfGuessRows(rows,label){
    return (Array.isArray(rows)?rows:[]).filter(row=>row&&(row.type==="league"||row.type==="nationality")).slice().sort((a,b)=>(a.slot||0)-(b.slot||0)).map(row=>({type:row.type,value:tfLabel(label,row.type,row.valueId)}));
  }

  // Pure: the production view plus what production already rendered -> the frame Team V's layout is drawn from.
  // input: {active, view, step (#transferChallenge data-transfer-phase), replay (data-shared-transfer-replay), status,
  //         managers {playerOne, playerTwo}, clubs {playerOne, playerTwo}, label(kind, id) -> {label}}
  // Returns null (keep the app's own screen) when the shared challenge has no view or role yet.
  function toTransferFrame(input){
    const source=input||{},view=source.view;
    if(source.active!==true||!view||typeof view!=="object")return null;
    const role=view.managerRole;
    if(!ROLES.includes(role))return null;
    const phase=LAYOUTS[source.step];
    if(!phase)return null;
    const state=view.state&&typeof view.state==="object"?view.state:null,actual=state&&state.phase?String(state.phase):"NOT_STARTED";
    const replay=Boolean(source.replay),season=Number(view.seasonNumber);
    if(!Number.isInteger(season)||season<1)return null;
    const managers={},clubs={};
    for(const r of ROLES){managers[r]=tfText(source.managers&&source.managers[r])||(r==="playerOne"?"Manager 1":"Manager 2");clubs[r]=tfText(source.clubs&&source.clubs[r])||"Club";}
    const frame={screen:SCREEN,phase,viewer:role,replay,actualPhase:actual,season,managers,clubs,status:tfText(source.status),
      windowLive:phase==="WINDOW_OPEN"&&actual==="WINDOW_OPEN"&&!replay,
      endRequested:phase==="WINDOW_OPEN"&&actual==="WINDOW_OPEN"&&!replay&&Array.isArray(state&&state.endRequestedRoles)&&state.endRequestedRoles.includes(role),
      guessesLocked:phase==="GUESS_ENTRY"&&(replay||(Array.isArray(state&&state.guessLockedRoles)&&state.guessLockedRoles.includes(role))),
      // A historical replay keeps production's own (read-only, disabled by production) signing fields in the rows.
      signingsLocked:phase==="SIGNING_ENTRY"&&!replay&&Array.isArray(state&&state.signingLockedRoles)&&state.signingLockedRoles.includes(role),
      ownSignings:[],verdicts:null};
    // Own committed signings read back when they are locked (own data only).
    if(frame.signingsLocked)frame.ownSignings=tfSigningRows(view.ownInputs&&view.ownInputs.signings,source.label);
    // Both sides only after the provider revealed them: COMPLETED, not a replay, with provider verdicts.
    if(phase==="COMPLETED"&&actual==="COMPLETED"&&!replay&&view.verdicts&&typeof view.verdicts==="object"){
      const guessesBy={},verdicts={};
      guessesBy[role]=tfGuessRows(view.ownInputs&&view.ownInputs.guesses,source.label);
      guessesBy[tfOther(role)]=tfGuessRows(view.opponentInputs&&view.opponentInputs.guesses,source.label);
      for(const r of ROLES){
        verdicts[r]=(Array.isArray(view.verdicts[r])?view.verdicts[r]:[]).filter(row=>row&&Number.isInteger(row.slot)).map(row=>({slot:row.slot,release:row.release===true,
          name:tfText(row.name),league:tfLabel(source.label,"league",row.leagueId),nationality:tfLabel(source.label,"nationality",row.nationalityId)})).sort((a,b)=>a.slot-b.slot);
      }
      // guessesAgainst[r]: the rival's guesses against r's signings (why a signing is released).
      frame.verdicts={rows:verdicts,guessesAgainst:{playerOne:guessesBy.playerTwo,playerTwo:guessesBy.playerOne}};
    }
    frame.key=JSON.stringify([frame.phase,frame.viewer,frame.replay,frame.actualPhase,frame.season,managers,clubs,frame.status,frame.windowLive,frame.endRequested,frame.guessesLocked,frame.signingsLocked,frame.ownSignings,frame.verdicts]);
    return tfFreeze(frame);
  }

  // Pure: frame -> the fixtures shape Team V's plate.js renders (one frame, "LIVE"). No fixture data is used.
  function toPlateFixtures(frame){
    if(!frame)throw new TypeError("TRANSFER_V10_FRAME");
    const rival=tfOther(frame.viewer),fill=(text,map)=>Object.keys(map).reduce((out,key)=>out.split(`{${key}}`).join(map[key]),text);
    const strings={...STRINGS,rail:STRINGS.rail.slice(),
      title:fill(STRINGS.title,{season:String(frame.season)}),
      f1Intro:frame.windowLive?STRINGS.f1Intro:"",
      // plate.js picks the Nik-viewer string when Nik views and the Daniel-viewer string when Daniel views.
      guessHeadingNikViewer:fill(STRINGS.guessHeading,{RIVAL:frame.managers.playerOne}),guessHeadingDanielViewer:fill(STRINGS.guessHeading,{RIVAL:frame.managers.playerTwo}),
      privacyNoteNikViewer:fill(STRINGS.privacyNote,{RIVAL:frame.managers.playerOne}),privacyNoteDanielViewer:fill(STRINGS.privacyNote,{RIVAL:frame.managers.playerTwo}),
      nameplateOne:frame.managers.playerOne.toUpperCase(),nameplateTwo:frame.managers.playerTwo.toUpperCase(),
      // Status lines: exactly the text production shows in #transferPhaseStatus.
      f1Status:frame.status,guessStatus:frame.status,signingStatus:frame.status,signingStatusLocked:frame.status,completedStatus:frame.status,
      signingLockSummary:""};
    const inputs={playerOne:{signings:[],guessesAgainstRival:[]},playerTwo:{signings:[],guessesAgainstRival:[]}},results={live:{playerOne:[],playerTwo:[]}};
    if(frame.signingsLocked)inputs[frame.viewer].signings=frame.ownSignings.map(row=>({...row}));
    if(frame.verdicts){
      for(const r of ROLES){
        inputs[r].signings=frame.verdicts.rows[r].map(row=>({slot:row.slot,name:row.name,league:row.league,nationality:row.nationality}));
        results.live[r]=frame.verdicts.rows[r].map(row=>({slot:row.slot,release:row.release}));
        // plate.js reads the guesses against r from inputs[rival(r)].guessesAgainstRival.
        inputs[tfOther(r)].guessesAgainstRival=frame.verdicts.guessesAgainst[r].map(row=>({...row}));
      }
    }
    const cfg={viewer:frame.viewer,phase:frame.phase,timerSeconds:0,endRequested:frame.endRequested,signingsLocked:frame.signingsLocked,result:"live"};
    return {managers:{...frame.managers},clubs:{...frame.clubs},seasonNumber:frame.season,frames:{LIVE:cfg},strings,inputs,results,rival};
  }

  // Which production elements go into Team V's layout for a frame. Own fields only, by the production prefixes:
  // signings p1 = Daniel (playerOne) / p2 = Nik; guesses are named after the manager they target.
  function adoptionPlan(frame){
    const own=frame.viewer==="playerOne"?"p1":"p2",guess=frame.viewer==="playerOne"?"p2":"p1",ids=["transferChallengeError","refreshSharedTransferChallenge"];
    const extras=[];
    if(frame.phase==="WINDOW_OPEN"){ids.push("transferTimerDisplay","endTransferTimer");extras.push("startTransferTimer","continueFromTransfers");}
    else if(frame.phase==="GUESS_ENTRY"){for(let i=1;i<=3;i+=1)ids.push(`${guess}Guess${i}Type`,`${guess}Guess${i}Value`);ids.push("completeTransferChallenge");extras.push("continueFromTransfers");}
    else if(frame.phase==="SIGNING_ENTRY"){
      if(!frame.signingsLocked){for(let i=1;i<=3;i+=1)ids.push(`${own}Signing${i}Name`,`${own}Signing${i}Position`,`${own}Signing${i}Overall`,`${own}Signing${i}League`,`${own}Signing${i}Nationality`);ids.push("completeTransferChallenge");}
      ids.push("transferPhaseLockSummary");extras.push("continueFromTransfers");
    }else ids.push("continueFromTransfers");
    return tfFreeze({ids,extras});
  }

  // ---- Browser binding (lazy; never runs in Node) ----
  const BASE="visual-assets/v10_1/";
  const ASSET_BASE=BASE+DIR;
  const ACTION_CLASSES=Object.freeze({start:"btn-end sd-btn sd-btn--secondary",continueReplay:"btn-continue sd-btn sd-btn--secondary",error:"error-line"});
  let nameCells=[],installed=false,registered=null,platemap=null,cached=null,mountedFrame=null,stage=null,adopted=[],cardSwaps=[],pending=false,timerNode=null,statusNode=null,stageSize=null,reframe=null,desktopLayout=null;
  const v10Screens=()=>root.CareerModeV10Screens;
  const tfDoc=()=>root.document||null;
  function tfWarn(context,error){if(root.console&&typeof root.console.warn==="function")root.console.warn(`[Career Mode Showdown] ${context}`,error);}
  // Absolute URLs: plate.js puts some of them in CSS custom properties, which plate.css would otherwise resolve
  // against its own folder.
  function tfAbsolute(path){try{return new root.URL(path,root.document.baseURI).href;}catch(_error){return path;}}
  function tfTransfer(){return root.CareerModeProductionSharedTransferChallenge||null;}
  function tfSection(){const doc=tfDoc();return doc?doc.getElementById(SCREEN):null;}
  function tfDomText(id){const doc=tfDoc(),node=doc&&doc.getElementById(id);return node?node.textContent:"";}
  function tfLive(){
    const transfer=tfTransfer(),section=tfSection();
    if(!transfer||!section||typeof transfer.getState!=="function")return null;
    let active=false,view=null;
    try{active=typeof transfer.isActive==="function"&&transfer.isActive()===true;view=transfer.getState();}catch(_error){return null;}
    return toTransferFrame({active,view,step:section.dataset.transferPhase,replay:section.dataset.sharedTransferReplay,status:tfDomText("transferPhaseStatus"),
      managers:{playerOne:tfDomText("transferManagerOne"),playerTwo:tfDomText("transferManagerTwo")},clubs:{playerOne:tfDomText("transferClubOne"),playerTwo:tfDomText("transferClubTwo")},
      label:typeof root.resolveFifa17TransferOption==="function"?root.resolveFifa17TransferOption:null});
  }
  // The loader compares frames by identity, so an unchanged view returns the same frame object.
  function tfFrame(){const next=tfLive();if(!next){cached=null;return null;}if(cached&&cached.key===next.key)return cached;cached=next;return cached;}

  // ---- adopting production elements into Team V's layout ----
  // A selector-enhanced field lives in its .transferCombobox wrapper (js/transferSelector.js); the wrapper moves with it.
  function tfUnit(node){const parent=node&&node.parentElement;return parent&&parent.classList.contains("transferCombobox")?parent:node;}
  function tfProduction(id){const doc=tfDoc();for(const node of doc.querySelectorAll(`[id="${id}"]`))if(!stage||!stage.contains(node))return node;return null;}
  function tfAdopt(node,place,mode,classes){
    // mode: "replace" (Team V's element) | "before" | "append"
    if(!node||!place)return false;
    const doc=tfDoc(),unit=tfUnit(node),marker=doc.createComment(`v10-transfer:${node.id||node.className}`);
    unit.parentNode.insertBefore(marker,unit);
    const record={node,marker,classes:[],style:node.getAttribute("style")};
    const add=classes!==undefined?String(classes).split(/\s+/).filter(Boolean):mode==="replace"?Array.from(place.classList):[];
    for(const name of add)if(!node.classList.contains(name)){node.classList.add(name);record.classes.push(name);}
    const style=mode==="replace"?place.getAttribute("style"):null;
    if(style)node.setAttribute("style",record.style?`${record.style};${style}`:style);
    if(mode==="replace")place.replaceWith(unit);else if(mode==="before")place.parentNode.insertBefore(unit,place);else place.appendChild(unit);
    adopted.push(record);
    return true;
  }
  // r87 (Nik 2026-10-30): the signing's position and overall have no slot in Team V's plate. They join the adopted
  // player name in one name cell (name, POS, OVR), so each breakpoint's four-column row keeps its shape
  // (css/v10Transfer.css). Own signings only.
  function tfOverallCells(plan){
    const doc=tfDoc();
    for(const id of plan.ids){
      if(!/Signing\dOverall$/.test(id))continue;
      const node=tfProduction(id),name=stage.querySelector(`[id="${id.replace(/Overall$/,"Name")}"]`),pos=tfProduction(id.replace(/Overall$/,"Position"));
      if(!node||!name||!tfIsAdopted(name)||!name.parentNode)continue;
      const cell=doc.createElement("div");cell.className="signing-name-cell";
      name.parentNode.insertBefore(cell,name);cell.appendChild(name);nameCells.push(cell);
      if(pos)tfAdopt(pos,cell,"append");
      tfAdopt(node,cell,"append");
    }
  }
  function tfRestore(){
    for(const {card,name,className} of cardSwaps.splice(0)){
      const now=card.getAttribute("class")||"";
      if(now===className.split(/\s+/).filter(part=>part!==name).join(" "))card.setAttribute("class",className);else card.classList.add(name);
    }
    for(const record of adopted.splice(0).reverse()){
      const {node,marker}=record;
      for(const name of record.classes)node.classList.remove(name);
      if(record.style===null)node.removeAttribute("style");else node.setAttribute("style",record.style);
      if(node.id==="transferTimerDisplay"){const clock=node.querySelector(".timer-clock");if(clock)clock.remove();}
      if(marker.parentNode){marker.parentNode.insertBefore(tfUnit(node),marker);marker.remove();}
    }
    for(const cell of nameCells.splice(0))cell.remove();
  }
  // A production node, or anything inside one (e.g. the selector's listbox inside its .transferCombobox wrapper).
  const tfIsAdopted=node=>adopted.some(record=>record.node===node||(record.node.contains&&record.node.contains(node)));
  // Team V's labelling elements keep their place under a "tw-" id, so no id exists twice.
  function tfRenameIds(){
    const renamed=new Map();
    for(const node of stage.querySelectorAll("[id]")){if(tfIsAdopted(node)||node.id.startsWith("tw-"))continue;const next=`tw-${node.id}`;renamed.set(node.id,next);node.id=next;}
    for(const node of stage.querySelectorAll("[aria-labelledby]")){const value=node.getAttribute("aria-labelledby").split(/\s+/).map(id=>renamed.get(id)||id).join(" ");node.setAttribute("aria-labelledby",value);}
  }
  function tfPlace(id){for(const node of stage.querySelectorAll(`[id="${id}"]`))if(!tfIsAdopted(node))return node;return null;}
  // Decorative second hand beside the live clock; the clock text itself is production's.
  function tfSyncClock(){
    const node=timerNode;if(!node||!tfIsAdopted(node))return;
    const text=Array.from(node.childNodes).filter(child=>child.nodeType===3).map(child=>child.nodeValue).join("").trim();
    // Team V's phone status band repeats the live clock (data-clock); the band text is production's status line.
    const band=stage&&stage.querySelector(".sign-status");if(band&&band.dataset.clock!==text)band.dataset.clock=text;
    let clock=node.querySelector(".timer-clock");
    if(!clock){const doc=tfDoc();clock=doc.createElement("span");clock.className="timer-clock";clock.setAttribute("aria-hidden","true");const hand=doc.createElement("span");hand.className="timer-hand";hand.setAttribute("aria-hidden","true");clock.appendChild(hand);node.appendChild(clock);}
    const match=/^(\d{1,2}):(\d{2})$/.exec(text),hand=clock.firstChild;
    if(hand&&match){const angle=(Number(match[2])%60)*6;hand.style.transform=`translate(-50%, -100%) rotate(${angle}deg)`;}
    tfDeadline(text);
  }
  // r87 Deadline Day (js/deadlineDay.js): the last minute of a live window, from this same clock text. Loaded with the skin.
  function tfDeadline(text){
    const deadline=root.CareerModeDeadlineDay;
    if(!deadline||typeof deadline.sync!=="function"||!stage)return;
    try{deadline.sync(stage,mountedFrame,text);}catch(error){tfWarn("Deadline Day strip skipped.",error);}
  }
  function tfAdoptAll(frame,section){
    const plan=adoptionPlan(frame);
    // Production finds the viewer's own guess / signing card with closest(".transferGuessCard" / ".transferManagerCard")
    // to enable and show its fields, so the Team V block that holds them carries that card class (its card look is
    // reset in css/v10Transfer.css).
    const guessCols=stage.querySelector(".panel.own .guess-cols"),signingRows=stage.querySelector(".panel.own .signing-rows");
    if(guessCols&&frame.phase==="GUESS_ENTRY")guessCols.classList.add("transferGuessCard");
    if(signingRows&&frame.phase==="SIGNING_ENTRY"&&!frame.signingsLocked)signingRows.classList.add("transferManagerCard");
    for(const id of plan.ids){
      const node=tfProduction(id),place=tfPlace(id);
      if(node&&place)tfAdopt(node,place,"replace");
    }
    tfOverallCells(plan);
    // The production card whose fields moved hands its card class to the Team V block while they are there, so one card
    // per manager carries it (production's own/rival lookups and the replay's one-visible-card guard stay exact).
    for(const name of ["transferGuessCard","transferManagerCard"]){
      if(!stage.querySelector(`.panel.own .${name}`))continue;
      for(const record of adopted){
        const parent=record.marker.parentNode,card=parent&&parent.closest?parent.closest(`.${name}`):null;
        if(card&&!stage.contains(card)&&!cardSwaps.some(swap=>swap.card===card)){cardSwaps.push({card,name,className:card.getAttribute("class")||""});card.classList.remove(name);}
      }
    }
    // HOME: the screen's own smart-back control (delegated by its .backButton class in js/screens.js).
    const home=section.querySelector(":scope > .seasonEntryActions .backButton"),homePlace=tfPlace("backToShowdownHome");
    if(home&&homePlace&&!stage.contains(home))tfAdopt(home,homePlace,"replace");
    // Production controls Team V has no slot for in this phase: next to the frame's own action, still hidden by
    // production until it shows them (the coordinator's start, the replay continue).
    const anchor=stage.querySelector(".panel.own .end-row, .panel.own .action-row")||stage.querySelector(".rules-inner");
    for(const id of plan.extras){
      const node=tfProduction(id);if(!node||!anchor)continue;
      tfAdopt(node,anchor,"append",id==="startTransferTimer"?ACTION_CLASSES.start:ACTION_CLASSES.continueReplay);
    }
    // Errors always stay on screen (the verdict layout has no error line of its own).
    // Signing entry: beside LOCK MY SIGNINGS, since laptops hide the status card then (css/v10Transfer.css, Nik 2026-10-30).
    const error=tfProduction("transferChallengeError"),rules=(frame.phase==="SIGNING_ENTRY"&&!frame.signingsLocked&&stage.querySelector(".panel.own .action-row"))||stage.querySelector(".rules-inner")||stage;
    if(error&&!tfIsAdopted(error))tfAdopt(error,rules,"append",ACTION_CLASSES.error);
    // Guess entry: production's status has two parts (phase · privacy line) where Team V's guess sign has room for the
    // phase name only, so the sign uses Team V's own signing-phase status board for it (css/v10Transfer.css: band).
    const band=stage.querySelector(".sign-status"),board=stage.querySelector(".sign-screen");
    if(frame.phase==="GUESS_ENTRY"&&band&&board&&frame.status.includes(" · ")){
      board.classList.add("status-board");band.classList.add("full");if(frame.status.split(" · ")[0].length<=14)band.classList.add("lead");
    }
    tfRenameIds();
    tfSyncClock();
  }
  // The refresh button is created by production on its first render; adopt it if it appeared later.
  function tfAdoptLate(){
    if(!stage||!mountedFrame)return;
    const place=stage.querySelector(`[id="tw-refreshSharedTransferChallenge"]`),node=tfProduction("refreshSharedTransferChallenge");
    if(place&&node&&!stage.contains(node))tfAdopt(node,place,"replace");
  }
  function tfHostMarkup(){
    const media="(max-width: 760px) and (orientation: portrait)",a=ASSET_BASE+"assets/";
    const pic=(cls,file,enter,size)=>`<picture class="${cls}"${enter?` data-sd-enter="${enter}"`:""}><source media="${media}" srcset="${file.includes("/")?BASE+file:a+file}" type="image/webp"><img alt=""${size||""} decoding="async"></picture>`;
    // r78 HO-031: the phone plate is Team V's ENV_TRANSFER_PHONE_V2 with both managers painted in (css/v10Transfer.css),
    // so the phone cut-outs (OVL_TRANSFER_*_PHONE_V2) are gone.
    return `<div class="phone-hero-art" aria-hidden="true" data-sd-enter="scene">${pic("phone-hero-bg","plates-v2/ENV_TRANSFER_PHONE_V2.webp","",' width="1179" height="2096"')}</div><div class="stage" data-phone-contract="cinematic" role="region" aria-label="Transfer Challenge"></div>`;
  }
  // JOB-1699: on desktop the entry and verdict phases need more room than Team V's painted frames give them.
  // Only those phases move the existing panels (same nodes, ids, copy and listeners) as one ordered group beside the
  // frozen plate camera, so the cards can grow; every other phase keeps the plate's own painted layout.
  // The group is aligned to the plate by the world's real rectangle (plate pixels x k), so the cards cover the painted
  // frames instead of leaving them showing underneath. Rotation and teardown restore the original world children.
  function tfFlowWanted(frame){
    if(!frame)return false;
    if(frame.phase==="COMPLETED")return Boolean(frame.verdicts);
    if(frame.phase==="GUESS_ENTRY")return !frame.guessesLocked;
    if(frame.phase==="SIGNING_ENTRY")return !frame.signingsLocked;
    return false;
  }
  function tfFlowDesktop(frame){
    if(!stage||typeof root.matchMedia!=="function"||!tfFlowWanted(frame))return;
    const world=stage.querySelector(".world"),footer=stage.querySelector(".hud-footer");
    if(!world||!footer)return;
    const media=root.matchMedia("(min-width: 1101px)");
    let group=null,places=[],frameRequest=null;
    const PLATE_W=1672;
    const restore=()=>{
      for(const {node,marker} of places){if(marker.parentNode){marker.parentNode.insertBefore(node,marker);marker.remove();}}
      places=[];if(group)group.remove();group=null;
    };
    // Plate pixel size, world offset and the painted frames' bottom edge, as the group's CSS custom properties.
    const measure=()=>{
      frameRequest=null;
      if(!group||!world.isConnected)return;
      const box=world.getBoundingClientRect(),host=stage.getBoundingClientRect();
      if(!box.width||!host.height)return;
      const k=box.width/PLATE_W;
      group.style.setProperty("--tw-k",`${k.toFixed(4)}px`);
      group.style.setProperty("--tw-x0",`${Math.round(box.left-host.left)}px`);
      group.style.setProperty("--tw-pb",`${Math.max(56,Math.round(host.height-(box.top-host.top)-792*k))}px`);
    };
    const schedule=()=>{if(frameRequest===null&&typeof root.requestAnimationFrame==="function")frameRequest=root.requestAnimationFrame(measure);};
    const sync=()=>{
      if(!media.matches){restore();return;}
      if(group)return;
      group=tfDoc().createElement("div");group.className="tw-desktop-content";
      footer.parentNode.insertBefore(group,footer);
      for(const node of Array.from(world.children).filter(node=>node.matches(".panel, .rules-card"))){
        const marker=tfDoc().createComment("v10-transfer:desktop-panel");
        node.parentNode.insertBefore(marker,node);places.push({node,marker});group.appendChild(node);
      }
      measure();schedule();
    };
    if(typeof media.addEventListener==="function")media.addEventListener("change",sync);else if(typeof media.addListener==="function")media.addListener(sync);
    if(typeof root.addEventListener==="function")root.addEventListener("resize",schedule);
    desktopLayout={dispose:()=>{
      if(typeof media.removeEventListener==="function")media.removeEventListener("change",sync);else if(typeof media.removeListener==="function")media.removeListener(sync);
      if(typeof root.removeEventListener==="function")root.removeEventListener("resize",schedule);
      if(frameRequest!==null&&typeof root.cancelAnimationFrame==="function")root.cancelAnimationFrame(frameRequest);
      frameRequest=null;restore();
    }};
    sync();
  }
  function tfTeardown(section){
    try{root.CareerModeDeadlineDay?.detach?.();}catch(_error){}
    if(desktopLayout){desktopLayout.dispose();desktopLayout=null;}
    tfRestore();
    if(stage&&stage.__tw&&typeof stage.__tw.dispose==="function"){try{stage.__tw.dispose();}catch(_error){}}
    const host=section&&section.querySelector(":scope > .tw-host");
    if(stageSize){stageSize.disconnect();stageSize=null;}
    if(reframe!==null){root.cancelAnimationFrame(reframe);reframe=null;}
    if(host)host.remove();
    if(section)section.classList.remove("tw-on");
    stage=null;mountedFrame=null;
  }
  function tfMount(frame,section){
    tfTeardown(section);
    try{
      const doc=tfDoc(),host=doc.createElement("div");
      host.className="tw-host";host.innerHTML=tfHostMarkup();
      section.appendChild(host);section.classList.add("tw-on");
      stage=host.querySelector(".stage");mountedFrame=frame;
      const drawn=root.TWPlate.render(stage,toPlateFixtures(frame),platemap,"LIVE",{webpOnly:true,freeze:true});
      // Team V's desktop camera is computed at render, but the screen's own styles switch on only after mount (js/v10Screens.js),
      // so the stage is still the tall unstyled section then and the panels and actions land below the screen. The plate
      // re-frames on window resize only, so tell it whenever the observer reports a stage size, the first report included:
      // when the styles apply before the observer's first report, that report is already the styled size and is the only
      // one. The resize goes out on the next frame, never inside the observer callback: re-framing there resizes the
      // still-unstyled stage again in the same delivery, and Chromium then reports "ResizeObserver loop completed with
      // undelivered notifications", which the app's error boundary shows as a 10 s error toast over the phone HUD's REFRESH.
      if(typeof root.ResizeObserver==="function"&&typeof root.requestAnimationFrame==="function"){let last="";stageSize=new root.ResizeObserver(entries=>{const box=entries[0]&&entries[0].contentRect;const size=box?`${Math.round(box.width)}x${Math.round(box.height)}`:"";if(!size||size===last)return;last=size;if(reframe===null&&typeof root.dispatchEvent==="function"&&typeof root.Event==="function")reframe=root.requestAnimationFrame(()=>{reframe=null;root.dispatchEvent(new root.Event("resize"));});});stageSize.observe(stage);}
      tfAdoptAll(frame,section);
      tfFlowDesktop(frame);
      if(drawn&&typeof drawn.catch==="function")drawn.catch(error=>tfWarn("Transfer War motion skipped.",error));
    }catch(error){
      // Any failure leaves the app's own screen exactly as production rendered it.
      tfTeardown(section);
      tfWarn("Transfer War visuals unavailable; showing the standard screen.",error);
    }
  }
  function tfSchedule(){
    if(pending)return;pending=true;
    Promise.resolve().then(()=>{
      pending=false;
      const screens=v10Screens();
      if(!screens||!registered)return;
      tfAdoptLate();
      screens.show(SCREEN).catch(error=>tfWarn("Transfer War visuals could not update.",error));
    });
  }
  function tfObserve(){
    const section=tfSection();
    if(!section||typeof root.MutationObserver!=="function")return;
    new root.MutationObserver(tfSchedule).observe(section,{attributes:true,attributeFilter:["data-transfer-phase","data-shared-transfer-replay"]});
    // index.html's own status and clock elements; production never replaces them.
    statusNode=root.document.getElementById("transferPhaseStatus");timerNode=root.document.getElementById("transferTimerDisplay");
    // Team V's sign draws production's status text (frame.status), so a new status line redraws the frame.
    if(statusNode)new root.MutationObserver(tfSchedule).observe(statusNode,{childList:true,characterData:true,subtree:true});
    if(timerNode)new root.MutationObserver(tfSyncClock).observe(timerNode,{childList:true,characterData:true,subtree:true});
    // Managers/clubs/title are rewritten on each production render (cheap: an unchanged frame does nothing).
    for(const id of ["transferManagerOne","transferManagerTwo","transferClubOne","transferClubTwo"]){const node=root.document.getElementById(id);if(node)new root.MutationObserver(tfSchedule).observe(node,{childList:true,characterData:true,subtree:true});}
  }
  async function tfPlatemap(){
    if(platemap)return platemap;
    const response=await root.fetch(typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(BASE+FILES.platemap):BASE+FILES.platemap);
    if(!response.ok)throw new Error("TRANSFER_V10_PLATEMAP");
    const map=await response.json();
    // Overlay and glass paths are relative to Team V's folder; the app page is elsewhere.
    const fingertip=map.overlays&&map.overlays.nikFingertip;
    if(fingertip&&fingertip.files)for(const size of Object.keys(fingertip.files))fingertip.files[size]=tfAbsolute(ASSET_BASE+fingertip.files[size]);
    if(map.mobile&&map.mobile.glass&&map.mobile.glass.file)map.mobile.glass.file=tfAbsolute(ASSET_BASE+map.mobile.glass.file);
    platemap=map;
    return platemap;
  }
  function tfInstall(){
    if(installed||tfNode||!root.document)return registered||Promise.resolve(null);
    installed=true;
    // Read by plate.js when it loads: no self-start, and asset paths from the app page.
    root.TRANSFER_WAR_APP=true;root.TRANSFER_WAR_BASE=tfAbsolute(ASSET_BASE);
    registered=root.loadRuntimeScript("v10-screens","js/v10Screens.js",()=>Boolean(root.CareerModeV10Screens)).then(()=>{
      const screens=v10Screens().install();
      screens.register(SCREEN,{
        css:FILES.css.slice(),
        js:[FILES.script.slice()],
        prepare:()=>tfPlatemap(),
        frame:()=>tfFrame(),
        mount:(frame,host)=>tfMount(frame,host),
        unmount:host=>tfTeardown(host)
      });
      tfObserve();
      // r87 Deadline Day: a small static script, fetched with the skin (no Firebase); the clock drives it.
      Promise.resolve(root.loadRuntimeScript("deadline-day","js/deadlineDay.js",()=>Boolean(root.CareerModeDeadlineDay))).catch(error=>tfWarn("Deadline Day strip unavailable.",error));
      if(typeof root.getActiveScreenName==="function"&&root.getActiveScreenName()===SCREEN)tfSchedule();
      return screens;
    }).catch(error=>{registered=null;installed=false;tfWarn("Transfer War visuals unavailable.",error);return null;});
    return registered;
  }

  return Object.freeze({contractVersion:1,SCREEN,DIR,FILES,STRINGS,toTransferFrame,toPlateFixtures,adoptionPlan,install:tfInstall,
    isMounted:()=>Boolean(mountedFrame)});
});

```

## FILE: js/productionSharedSeasonCommit.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): read every 3 s for at most 3 minutes while waiting for the coordinator's commit or the rival's acknowledge.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  function psscReadTimeoutMs(){const value=Number(root.CMS_COMMIT_READ_TIMEOUT_MS);return Number.isFinite(value)&&value>=1000&&value<=25000?value:25000;}
  const ACTION_ID="sharedSeasonCommitAction";
  let installed=false,busy=false,provider=null,conflictGuard=null,setupApi=null,resultsApi=null,view=null,contextKey="",providerChain=Promise.resolve(),refreshPromise=null,refreshRequestKey="",headingObserver=null,bootstrapObserver=null,errorMessage="",pendingErrorKind="",readError="",readErrorKey="",readGeneration=0,heldReportKey="";

  function psscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function psscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function psscSharedMarker(){const showdown=psscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function psscField(id){return root.document&&root.document.getElementById(id);}
  function psscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function psscDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function psscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function psscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function psscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function psscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await psscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await psscLoadScript("ssjr-production-season-results","js/productionSharedSeasonResults.js",()=>root.CareerModeProductionSharedSeasonResults);
    await psscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await psscLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await psscLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await psscLoadScript("ssjr-season-commit-protocol","js/sharedSeasonCommit.js",()=>root.CareerModeSharedSeasonCommit);
    await psscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await psscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    await psscLoadScript("ssjr-production-journey-conflicts","js/productionSharedJourneyConflicts.js",()=>root.CareerModeProductionSharedJourneyConflicts);
    setupApi=root.CareerModeProductionSharedShowdownSetup;resultsApi=root.CareerModeProductionSharedSeasonResults;provider=root.CareerModeSparkSharedSeasonCommit;conflictGuard=root.CareerModeProductionSharedJourneyConflicts;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")psscFail("SEASON_COMMIT_SETUP_UNAVAILABLE");
    if(!resultsApi||typeof resultsApi.refresh!=="function"||typeof resultsApi.getState!=="function")psscFail("SEASON_COMMIT_RESULTS_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.commitSeason!=="function"||typeof provider.acknowledgeSeason!=="function")psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");
    if(!conflictGuard||typeof conflictGuard.execute!=="function")psscFail("JOURNEY_CONFLICT_GUARD_UNAVAILABLE");
  }
  function psscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=psscShowdown()?.currentRound,season=Number(psscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)psscFail("SEASON_COMMIT_SEASON_INVALID");return season;}
  function psscSetupState(){try{return (setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.()||null;}catch(_error){return null;}}
  function psscResultsState(){try{return (resultsApi||root.CareerModeProductionSharedSeasonResults)?.getState?.()||null;}catch(_error){return null;}}
  function psscRequestContext(){const showdown=psscShowdown(),setup=psscSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;try{seasonNumber=psscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function psscContextMatches(request){const current=psscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function psscResultsPublished(request=psscRequestContext()){const results=psscResultsState();return Boolean(request&&results&&results.state?.phase==="RESULTS_READY"&&results.state?.revision===2&&Number(results.seasonNumber)===request.seasonNumber&&String(results.rivalryId||"")===request.rivalryId);}
  function psscResultsReady(request=psscRequestContext()){const results=psscResultsState();return Boolean(psscResultsPublished(request)&&results.allResults?.playerOne&&results.allResults?.playerTwo);}
  function psscResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The season request was rejected.");error.code=result&&result.code||"SEASON_COMMIT_PROVIDER_FAILED";throw error;}
  function psscWithTimeout(promise,ms,code){let timer=null;const timeout=new Promise((_,reject)=>{timer=root.setTimeout?.(()=>{const error=new Error("The Shared Season Commit check took too long. Check your connection and retry.");error.code=code;reject(error);},ms);});return Promise.race([promise,timeout]).finally(()=>{if(timer!==null)root.clearTimeout?.(timer);});}
  function psscQueue(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  function psscRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")psscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_commit_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the RESULTS_READY Season Results.
  async function psscProviderContext(request=psscRequestContext(),light=false){
    if(!psscSharedMarker())psscFail("SEASON_COMMIT_SHARED_MODE_REQUIRED");
    if(!request||!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    await psscEnsureDependencies();
    if(!psscResultsPublished(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish their Season Results first.");
    if(!(light===true&&psscSetupState()?.ready===true&&psscResultsReady(request))){
      await setupApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
      await resultsApi.refresh();if(!psscContextMatches(request))psscFail("SEASON_COMMIT_CONTEXT_STALE");
    }
    if(!psscResultsReady(request))psscFail("SEASON_COMMIT_RESULTS_NOT_READY","Both managers must publish their Season Results first.");
    const setup=psscSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)psscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)psscFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  function psscEnsureUi(){
    const panel=psscField("seasonReviewPanel"),actions=panel?.querySelector?.(".seasonReviewActions");if(!panel||!actions)return null;
    let status=psscField("sharedSeasonCommitStatus");if(!status){status=root.document.createElement("p");status.id="sharedSeasonCommitStatus";status.className="seasonReviewWarning sharedSeasonCommitStatus";actions.parentNode.insertBefore(status,actions);}
    let action=psscField(ACTION_ID);if(!action){action=root.document.createElement("button");action.id=ACTION_ID;action.className="menuButton";action.type="button";actions.prepend(action);}
    return {panel,actions,status,action};
  }
  function psscSetError(message=""){
    const node=psscField("seasonReviewError"),value=String(message||"");
    if(!value){if(node&&errorMessage&&node.textContent===errorMessage)node.textContent="";errorMessage="";return;}
    if(node){node.textContent=value;errorMessage=value;}
  }
  // r80 (Nik, 2026-10-19): the two managers play different FIFA saves, so both winning the league (same position), the
  // Champions League or the domestic cup in the same season is normal and is never a clash. Only a same-manager
  // impossibility (one save winning both the Champions League and the Europa League) may ever be listed here; none is yet.
  function psscSeasonResultClash(_results){
    const lines=[];
    return lines;
  }
  function psscClashWarning(who){
    const lines=psscSeasonResultClash(psscResultsState()?.allResults);
    return lines.length?` · CHECK RESULTS: ${lines.join(" ")} ${who} can still lock the season; scores use what was entered.`:"";
  }
  function psscManagerName(role){return psscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let psscWatchedKey=null;
  function psscWatchSync(){let key="";try{key=psscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===psscWatchedKey)return;psscWatchedKey=key;try{psscWatchWait();}catch(_error){}}
  function psscRender(){psscWatchSync();
    const ui=psscEnsureUi();if(!ui)return false;
    const request=psscRequestContext(),ready=Boolean(psscSharedMarker()&&request&&psscResultsPublished(request)),eligible=Boolean(ready&&psscResultsReady(request)&&contextKey===request.key&&view);
    psscHidden(ui.status,!ready);psscHidden(ui.action,!ready);if(!ready)return false;
    if(!eligible){
      psscText(ui.status,readError?`SEASON CHECK FAILED · ${readError} · YOUR RESULTS ARE SAVED`:'CHECKING THE SEASON · YOUR RESULTS ARE SAVED');
      psscText(ui.action,readError?'CHECK AGAIN':'CHECK SEASON');psscDisable(ui.action,busy||Boolean(refreshPromise));return false;
    }
    const role=view.managerRole,coordinator=view.coordinatorRole,phase=view.phase||"RESULTS_READY";
    if(phase==="ACKNOWLEDGED"){
      psscText(ui.status,"SEASON COMMITTED · SCORE BELOW");psscText(ui.action,"SEASON CONFIRMED ✓");psscDisable(ui.action,true);return true;
    }
    if(view.committed){
      if(view.ownAcknowledged){psscText(ui.status,"YOU CONFIRMED THIS SEASON · WAITING FOR YOUR RIVAL");psscText(ui.action,"CONFIRMED ✓ · WAITING FOR RIVAL");psscDisable(ui.action,true);}
      else{psscText(ui.status,"SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT");psscText(ui.action,"CONFIRM SEASON");psscDisable(ui.action,busy);}
      return true;
    }
    if(role===coordinator){psscText(ui.status,`BOTH RESULTS ARE IN · LOCK THE SEASON${psscClashWarning("You")}`);psscText(ui.action,"LOCK & CONFIRM SEASON");psscDisable(ui.action,busy);}
    else{psscText(ui.status,`BOTH RESULTS ARE IN · WAITING FOR ${psscManagerName(coordinator)} TO LOCK THE SEASON${psscClashWarning(psscManagerName(coordinator))}`);psscText(ui.action,`WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()}`);psscDisable(ui.action,true);}
    return true;
  }
  // r87 shared reads meter: the season's ACKNOWLEDGED also tells the reads meter this phone's role and Firestore, so it writes this
  // phone's meter document once and reads the partner's (js/sparkPrivatePairing.js, fsbShareSeason). Season 1 is measured from
  // its Career Start (noteSeasonStart), never from the setup before it.
  function psscBind(result,ctx,request){if(!psscContextMatches(request))return false;const before=view&&contextKey===request.key?view.phase:null;view={...result,rivalryId:ctx.setup.rivalryId,coordinatorRole:result.coordinatorRole||ctx.setup.setup.coordinatorRole};contextKey=request.key;readError="";readErrorKey="";psscRender();if(before&&before!=="ACKNOWLEDGED"&&view.phase==="ACKNOWLEDGED")psscNudgeHistory();if(view.phase==="ACKNOWLEDGED"){try{root.CareerModeFirestoreBudget?.noteSeasonDone?.(`${view.rivalryId}|${request.seasonNumber}`,Boolean(before&&before!=="ACKNOWLEDGED"),{role:ctx.setup.managerRole,season:request.seasonNumber,rivalryId:view.rivalryId,firestore:ctx.options?.firestore||null});}catch(_error){}}return true;}
  // r75: the moment this page sees the season commit become ACKNOWLEDGED, Canonical Scoring and then Shared History check
  // once, in that order (History needs the reconciled score), instead of each waiting for its next 3 s check: nothing else
  // announces the commit change to them. The next season, the history screens and Final Winner follow from History's event.
  function psscNudgeHistory(){if(typeof root.setTimeout!=="function"||root.document?.visibilityState==="hidden")return;root.setTimeout(()=>{void (async()=>{
    const scoring=root.CareerModeProductionSharedCanonicalScoring,history=root.CareerModeProductionSharedHistoryConvergence;
    try{if(scoring&&typeof scoring.refresh==="function"){let state=await scoring.refresh(true);if(state?.phase!=="SCORING_RECONCILED")state=await scoring.refresh(true);}}catch(_error){}
    try{if(history&&typeof history.refresh==="function"){const state=await history.refresh(true);if(state?.phase!=="HISTORY_CONVERGED")await history.refresh(true);}}catch(_error){}
  })();},0);}
  async function psscRefreshNow(request=psscRequestContext(),generation=0,light=false){
    if(!request)return null;
    if(contextKey&&contextKey!==request.key){psscSetError("");pendingErrorKind="";}
    const ctx=await psscProviderContext(request,light);if(!psscContextMatches(request))return null;const result=psscResultError(await provider.read(ctx.options),"The season could not be checked.");if(!psscContextMatches(request))return null;
    if(generation&&generation!==readGeneration)return null;
    if(pendingErrorKind&&psscSatisfied(pendingErrorKind,result)){psscSetError("");pendingErrorKind="";}
    psscBind(result,ctx,request);return view;
  }
  function psscRefresh(light=false){
    const request=psscRequestContext();if(!request)return Promise.resolve(null);
    // Job 33: an ACKNOWLEDGED commit is immutable (Rules cap it at revision 3), so later callers reuse it instead of re-reading it.
    if(view&&contextKey===request.key&&view.phase==="ACKNOWLEDGED"&&!refreshPromise)return Promise.resolve(view);
    if(refreshPromise&&refreshRequestKey===request.key)return refreshPromise;
    if(contextKey!==request.key){view=null;contextKey="";if(readErrorKey!==request.key){readError="";readErrorKey="";}}
    refreshRequestKey=request.key;
    const generation=++readGeneration;
    const current=psscQueue(()=>psscWithTimeout(psscRefreshNow(request,generation,light===true),psscReadTimeoutMs(),"SEASON_COMMIT_CHECK_TIMEOUT"));refreshPromise=current;psscRender();
    // Job 33: the check failure shows at once (CHECK AGAIN), but it is reported only when the same failure repeats on the
    // next poll, like Shared History and Multi Season; a single aborted read under contention is not an application error.
    current.then(()=>{heldReportKey="";if(refreshPromise===current){refreshPromise=null;psscRender();}},error=>{
      if(error?.code==="SEASON_COMMIT_CHECK_TIMEOUT"&&readGeneration===generation)readGeneration+=1;
      // Job 33: a failed fast (3 s) read keeps the current view and is retried by the next poll; the 15 s poll still reports a real failure.
      if(light===true&&refreshPromise===current&&view&&contextKey===request.key){refreshPromise=null;psscRender();return;}
      if(refreshPromise===current){refreshPromise=null;if(psscContextMatches(request)&&psscResultsPublished(request)&&!/_CONTEXT_STALE$/.test(String(error?.code||""))){const previous=readErrorKey===request.key?readError:"";view=null;contextKey="";readErrorKey=request.key;readError=String(error?.code||"SEASON_COMMIT_CHECK_FAILED").replace(/[^A-Za-z0-9_-]/g,"").slice(0,80);psscRender();const reportKey=request.key+"|"+readError;if(readError!==previous)heldReportKey=reportKey;else if(heldReportKey===reportKey){heldReportKey="";psscReport("Unable to check Shared Season Commit",error);}}}
    });
    return current;
  }
  function psscSatisfied(kind,current){if(kind==="commit")return Boolean(current.committed);return Boolean(current.ownAcknowledged||current.phase==="ACKNOWLEDGED");}
  async function psscWrite(kind,ctx,request,current){
    const operationId=psscRandomOperationId(),method=kind==="commit"?"commitSeason":"acknowledgeSeason";
    if(kind==="commit"&&current.managerRole!==current.coordinatorRole)psscFail("SEASON_COMMIT_COORDINATOR_REQUIRED",`Only ${psscManagerName(current.coordinatorRole)} can lock the season.`);
    for(let attempt=0;attempt<2;attempt+=1){
      const baseRevision=Number(current.revision||0);
      const providerRequest={...ctx.options,operationId,baseRevision};
      const result=await conflictGuard.execute({surface:"season-commit",action:kind==="commit"?"commit-season":"acknowledge-season",operationId,baseRevision,authority:{accountId:ctx.options.user.uid,deviceId:ctx.setup.deviceId,rivalryId:ctx.setup.rivalryId,sessionId:ctx.setup.sessionId,managerRole:ctx.setup.managerRole},intent:{seasonNumber:request.seasonNumber}},()=>provider[method](providerRequest));
      if(result&&result.ok===true)return true;
      if(result?.code==="SEASON_COMMIT_STALE_BASE_REVISION"&&attempt===0){current=psscResultError(await provider.read(ctx.options));if(psscSatisfied(kind,current))return true;continue;}
      psscResultError(result,kind==="commit"?"The season could not be locked.":"Your season confirmation could not be saved.");
    }
    return false;
  }
  async function psscMutate(kind){
    if(busy)return false;const request=psscRequestContext();if(!request)return false;busy=true;readGeneration+=1;psscSetError("");pendingErrorKind="";psscRender();
    let stage=kind;
    try{
      return await psscQueue(async()=>{
        const ctx=await psscProviderContext(request);if(!psscContextMatches(request))return false;let current=psscResultError(await provider.read(ctx.options));
        if(!psscContextMatches(request))return false;
        if(!psscSatisfied(kind,current)){if(!await psscWrite(kind,ctx,request,current))return false;if(kind==="commit")stage="acknowledge";current=psscResultError(await provider.read(ctx.options));if(!psscContextMatches(request))return false;}
        psscBind(current,ctx,request);
        // One tap for the coordinator: COMMIT & ACKNOWLEDGE records his own acknowledgement right after the commit (each write keeps its own operationId and stale retry).
        // If this second half fails, the committed view shows the existing CONFIRM SEASON button (only this R7 case re-reads
        // at once; a manager's own ACKNOWLEDGE failure keeps its error until the next read, exactly as before).
        if(kind!=="commit"||current.managerRole!==current.coordinatorRole||psscSatisfied("acknowledge",current))return true;
        stage="acknowledge";
        if(!await psscWrite("acknowledge",ctx,request,current))return false;
        try{await psscRefreshNow(request);}catch(_error){psscRefresh().catch(()=>{});}return true;
      });
    }catch(error){if(psscContextMatches(request)){pendingErrorKind=stage;if(stage==="acknowledge"&&view&&contextKey===request.key&&!view.committed)view={...view,committed:true};psscSetError(error.message||error.code||"Shared Season Commit failed.");psscReport("Unable to update Shared Season Commit",error);if(kind==="commit"&&stage==="acknowledge")void psscRefresh().catch(()=>{});}return false;}
    finally{busy=false;if(psscContextMatches(request))psscRender();}
  }
  function psscCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||target.id!==ACTION_ID||!psscSharedMarker())return;const screen=psscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.disabled)return;const request=psscRequestContext();if(!request||contextKey!==request.key||!view||!psscResultsReady(request)){void psscRefresh().catch(()=>{});return;}void psscMutate(view.committed?"acknowledge":"commit");}
  // All three waiting screens share the same season authority; navigation does not end the partner wait.
  function psscWaitScreen(){return ["seasonEntry","mainMenu","standings"].some(id=>{const node=psscField(id);return node&&!node.classList.contains("hidden");});}
  // A Results/Commit listener alone cannot cover Setup, session, later commits or terminal authority.
  // These listeners live only for the wait, share its existing health/fallback cadence, and never poll.
  // A hidden page stops them (keep=true) and the same wait attaches them again when it returns (psscWaitReturn); their first
  // server delivery is the new baseline and answers the return check's reads of the same documents (one read each).
  // An ACKNOWLEDGED revision-3 commit can never change again (Rules), so the next attach leaves it out.
  let waitContext=null,waitReturn=null;const waitSettled=new Set();
  function psscDropWaitContext(keep=false){const held=waitContext,budget=root.CareerModeFirestoreBudget;waitContext=null;if(keep===true&&held&&!held.failed)waitReturn={key:held.key,watching:held.watching};else if(keep!==true||held){waitReturn=null;budget?.returnListen?.([]);}if(!held)return;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();budget?.listened?.();}
  function psscWaitReturn(){const back=waitReturn,request=psscRequestContext();waitReturn=null;if(back&&request&&psscWaitScreen()&&!root.CareerModeFirestoreBudget?.paused?.())psscWaitContext(request,back.watching,back.key);else root.CareerModeFirestoreBudget?.returnListen?.([]);}
  function psscContextWake(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-wait-context-change"));}catch(_error){}}
  function psscWaitContext(request,watching,returnKey){
    const setup=psscSetupState(),runtime=root.CareerModeProductionFirebaseRuntime,budget=root.CareerModeFirestoreBudget;
    const key=`${request.rivalryId}|${setup?.accountId}|${setup?.deviceId}|${setup?.sessionId}`;
    if(returnKey!==undefined&&returnKey!==key){budget?.returnListen?.([]);return false;}
    if(waitContext?.key===key){
      const held=waitContext;
      if(held.failed&&Date.now()>=held.retryAt)psscDropWaitContext();
      else if(watching!==held.watching){
        // One listener per document: the wait listener now watches this one, so its authority listener stops. A document
        // the wait listener stops watching gets its authority listener back (rebuild).
        const old=held.watching;held.watching=watching;
        if(held.paths?.includes(old)&&!waitSettled.has(old))psscDropWaitContext();
        else{const stop=held.stops.get(watching);held.stops.delete(watching);if(stop)try{stop();}catch(_error){}if(held.pending?.delete(watching))held.ready=!held.failed&&held.pending.size===0;return held.ready&&!held.failed;}
      }else return held.ready&&!held.failed;
    }
    if(waitContext)psscDropWaitContext();
    const held={key,watching,stops:new Map(),ready:false,failed:false,retryAt:0,returnUntil:returnKey===undefined?0:Date.now()+10000};waitContext=held;
    const fail=error=>{if(waitContext!==held)return;held.failed=true;held.ready=false;held.retryAt=Date.now()+60000;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();/* r86 red team #19: the context listeners take the rivalry and Session back while these wait to retry. */budget?.returnListen?.([]);budget?.listened?.();budget?.noteError?.(error);};
    Promise.resolve().then(async()=>{
      const services=await runtime?.ensureAccountServices?.();if(waitContext!==held)return;
      if(!services?.ok||!setup?.sessionId||services.auth?.currentUser?.uid!==setup.accountId)throw new Error("Waiting context is unresolved.");
      let sdk=services.firestoreSdk;
      if(typeof sdk?.onSnapshot!=="function"){
        const url=runtime?.firebaseFirestoreModule;
        if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))throw new Error("Waiting listener SDK is unavailable.");
        sdk=await import(url);
      }
      // r85: every delivery of these listeners is counted once by the budget layer's read meter.
      sdk=(budget?.meterSdk||(s=>s))(sdk);
      if(waitContext!==held)return;
      const base=`rivalries/${request.rivalryId}`,paths=[base,`${base}/sharedSetup/authoritative`,`${base}/sessions/${setup.sessionId}`];
      const total=Number(setup.setup?.totalSeasons);
      if([1,3,5,10].includes(total))for(let n=1;n<=total;n++)paths.push(`${base}/seasonCommits/season_${n}`);
      held.paths=paths;
      const pending=held.pending=new Set(paths.filter(path=>path!==held.watching&&!waitSettled.has(path)));let queued=false,sessionChanged=false,dirty=false,notified=false;
      budget?.returnListen?.([...pending]);
      const wake=(changed=false)=>{dirty=dirty||changed;if(queued)return;queued=true;Promise.resolve().then(async()=>{queued=false;if(waitContext!==held||held.failed)return;if(dirty){dirty=false;root.CareerModeFirestoreBudget?.forgetContext?.();}if(sessionChanged){sessionChanged=false;try{await root.CareerModeSparkRemoteJoining?.refreshSession?.();}catch(_error){}}if(waitContext===held&&!held.failed)psscContextWake();});};
      for(const path of pending){
        let serial;
        const stop=sdk.onSnapshot(sdk.doc(services.firestore,path),{includeMetadataChanges:true},snapshot=>{
          if(waitContext!==held||held.failed)return;
          /* r86 red team #18: a cached copy (the SDK delivers one first on a return) no longer hands the waiting reads back to the server: they wait for this listener's server copy (the budget layer gives up after 5 s). */if(snapshot.metadata?.fromCache||snapshot.metadata?.hasPendingWrites){held.ready=false;pending.add(path);return;}
          const value=snapshot.exists()?snapshot.data():null,next=JSON.stringify(value),changed=serial!==undefined&&serial!==next;
          if(serial===undefined)budget?.listened?.(path,snapshot);
          if(/\/seasonCommits\/season_\d+$/.test(path)&&value?.phase==="ACKNOWLEDGED"&&value.revision===3)waitSettled.add(path);/* r86: a confirmed Setup (revision 6) never changes again either, and the budget layer keeps it. */if(/\/sharedSetup\/authoritative$/.test(path)&&value?.revision===6&&value?.phase==="SHOWDOWN_CONFIRMED")waitSettled.add(path);
          if(serial!==undefined&&changed&&(path===base||path===`${base}/sessions/${setup.sessionId}`))sessionChanged=true;
          serial=next;pending.delete(path);held.ready=pending.size===0;
          if(changed)wake(true);
          if(held.ready&&!notified){notified=true;wake();}
        },fail);
        if(held.failed)stop();else held.stops.set(path,stop);
      }
      held.ready=pending.size===0;
    }).catch(fail);
    return false;
  }
  function psscWaitHealthy(){const request=psscRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();const healthy=Boolean(request&&root.document?.visibilityState!=="hidden"&&!root.CareerModeFirestoreBudget?.paused?.()&&live?.watchHealthy&&["seasonResults","seasonCommits"].some(collection=>live.watching===`rivalries/${request.rivalryId}/${collection}/season_${request.seasonNumber}`));if(!healthy){const hidden=root.document?.visibilityState==="hidden";if(!(request&&!hidden&&!root.CareerModeFirestoreBudget?.paused?.()&&waitContext?.returnUntil>Date.now()))psscDropWaitContext(hidden);return false;}return ![root.CareerModeProductionSharedMultiSeasonProgression,root.CareerModeProductionSharedFinalReconciliation,root.CareerModeProductionSharedJourneyReconnect,root.CareerModeProductionSharedTerminalClose].some(api=>api?.productionEnabled===true)||psscWaitContext(request,live.watching);}

  function psscWaitingKey(){
    const screen=psscField("seasonEntry"),request=psscRequestContext();if(!psscWaitScreen()||!view||!request||contextKey!==request.key||!psscResultsReady(request))return "";
    if(!view.committed&&view.managerRole!==view.coordinatorRole)return `${contextKey}|commit`;
    if(view.committed&&view.ownAcknowledged&&view.phase!=="ACKNOWLEDGED")return `${contextKey}|acknowledge`;
    return "";
  }
  function psscFastPollDue(){const key=psscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
  function psscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(psscWaitScreen()&&psscResultsReady()&&view?.phase!=="ACKNOWLEDGED"?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(psscRequestContext()):null);}catch(_error){path=null;}return budget.watchWaitPoint("season-commit",path,psscWaitWake);}
  function psscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void psscTick(true);};inflight.then(again,again);return;}if(!busy){void psscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void psscTick(true);},400);}
  function psscFastTick(){psscWatchWait();if(psscWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!psscFastPollDue())return;void psscTick(true);}
  // r75: the 15 s check of the visible Season Commit screen reads the shared commit from the server (see Transfer).
  // r84: no commit exists before both results are published, so the fresh read starts then (before, it ran every check of the
  // results wait: ~37 billed reads/min for both phones); a healthy listener on the commit replaces it.
  function psscScreenFresh(){try{const request=psscRequestContext();if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)&&psscResultsReady(request)){const path=`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}catch(_error){}}
  async function psscTick(light=false){if(!psscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=psscField("seasonEntry");if(!psscWaitScreen())return;psscRender();if(view?.phase==="ACKNOWLEDGED"&&contextKey===psscRequestContext()?.key)return;if(light!==true)psscScreenFresh();try{await psscRefresh(light===true);}catch(_error){}}
  function psscAttachHeadingObserver(){
    if(!root.MutationObserver||!root.document)return false;const heading=psscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;
    headingObserver=new root.MutationObserver(()=>void psscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;
  }
  function psscInstallObservers(){if(psscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(psscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function psscInstall(){if(installed)return true;installed=true;for(const event of ["career-mode-connected-account-state-change","career-mode-firestore-quota"])root.addEventListener?.(event,()=>psscDropWaitContext());root.addEventListener?.("career-mode-shared-wait-context-change",()=>void psscTick());root.document?.addEventListener?.("visibilitychange",()=>{if(root.document.visibilityState==="hidden")psscDropWaitContext(true);else psscWaitReturn();});if(root.document)root.document.addEventListener("click",psscCapture,true);psscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void psscTick());if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!psscWaitHealthy())void psscTick();},POLL_MS);root.setInterval(psscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void psscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-commit",productionEnabled:true,runtimeRevision:"1.9.1-r10",requiresResultsReady:true,requiresCoordinatorCommit:true,requiresBothAcknowledgements:true,coordinatorCommitAlsoAcknowledges:true,reusesSeasonReview:true,distinctFromLocalConfirm:true,boundedStaleRetry:true,canonicalStorageMutation:false,authoritativeScoring:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,waitingListenerHealthy:psscWaitHealthy,isWaitingForRival:()=>Boolean(psscWaitingKey()),install:psscInstall,refresh:psscRefresh,seasonResultClash:psscSeasonResultClash,getState:()=>view,isActive:psscSharedMarker});
});

```

## FILE: js/touchlineGazette.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeTouchlineGazette=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Touchline Gazette (Nik 2026-10-31: "the Gazette is part of r87"). Team V's HO-041 newspaper
  // (visual-assets/v10_1/content/frontpage.js) on its own page:
  //   SEASON edition: after a season's Season Results, when the player taps CONTINUE TO SEASON N+1. Its one CONTINUE then
  //     runs exactly what that tap ran (js/productionSharedMultiSeasonProgression.js continueToNextSeason).
  //   FINAL edition: after Final Winner, when the player leaves it (BACK TO SHOWDOWN HOME or REMATCH). Its CONTINUE then
  //     runs that same button (the same click, let through untouched).
  //   The last season of a Showdown has no CONTINUE TO SEASON tap (Final Winner follows by itself), so it is told by the
  //   FINAL edition, whose table carries every season.
  // Every word comes from what the screen already holds (the converged Shared History projection, the Final Winner frame
  // and the Special Player chip): no Firebase read, no write, nothing sent. Each phone builds its own copy; nothing waits for
  // the partner. The text is chosen by a hash of the Showdown id, the edition and the season, never by who is looking, so
  // both phones print the same paper. Equal points are a DRAW (no tiebreak) and the copy is picked only from the situations
  // that are true (a 1-point win is never a big win, a draw is never a win). Screen words say "Special Player" or "SP".
  // A paper already shown on this phone is not shown again (one small local list, careerModeShowdown.gazetteSeen.v1). If its
  // files cannot load within a few seconds the tap simply goes on as before, so the Gazette can never hold anyone up.
  const node=typeof module!=="undefined"&&module.exports;
  const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
  const LENGTHS=Object.freeze([1,3,5,10]);
  const GOLDEN=Object.freeze({seasons:10,points:110});
  const TROPHY_ART=Object.freeze({"champions-league":"TRO_CONTINENTAL","europa-league":"TRO_EUROPA","league-title":"TRO_LEAGUE_TITLE","domestic-cup":"TRO_DOMESTIC_CUP"});
  // A headline, story, quote or caption that talks about silverware is not printed for a winner whose season had no
  // trophy (a 1 or 2 point win from the bonuses alone); final pages never print "next season" lines.
  const SILVER=/silver|trophy|trophies|cabinet|shelf|shelves|title|cup\b|cups\b|crown|medal|engrav|plaque|display case|glass case/i;
  // Screen words say "Special Player" or "SP": the one pack row that uses the old word (h1-461) is never printed.
  const BANNED=/marquee/i;
  const WINNER_TAKES_ALL=/whoever wins it|whoever finishes the closing season ahead/i;
  const FUTURE=/next season|new season|season ahead|next year|next few evenings/i;

  const plain=x=>Boolean(x)&&typeof x==="object"&&!Array.isArray(x);
  const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
  function tgCopy(){return root.CareerModeGazetteCopy||(node?require("../data/gazetteCopy.js"):null);}
  function tgPages(){return root.CareerModeFrontPages||(node?require("../data/frontPages.js"):null);}
  // FNV-1a: a small stable hash, the same on every phone and every browser
  // (with a final mix, so the low bits used by "% n" vary too)
  function tgHash(text){
    let h=0x811c9dc5;const s=String(text);for(let i=0;i<s.length;i+=1){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}
    h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;return h>>>0;
  }
  // Rows are picked by situation, never by id. Each slot of each Showdown walks its own fixed shuffle of the rows (seeded by
  // the Showdown id, the edition and the slot), starting at the season's place in it: the same paper on both phones, and
  // no row repeated from one season of a Showdown to the next while the situation still has unused rows.
  function shuffled(seed,list){
    const out=list.slice();let h=tgHash(seed)||1;
    for(let i=out.length-1;i>0;i-=1){h=Math.imul(h^(h>>>15),0x2c1b3c6d)>>>0;h=(h^(h>>>12))>>>0;const j=h%(i+1);const t=out[i];out[i]=out[j];out[j]=t;}
    return out;
  }
  // `used` holds the rows earlier papers of the same Showdown printed: they are passed over while an unused row fits.
  const rowKey=row=>plain(row)?String(row.id||row.text||row.head||""):null;
  function walker(rivalryId,kind,start,used){
    const taken={};
    const walk=(slot,list,make)=>{
      if(!list||!list.length)return null;
      const order=shuffled(`${rivalryId}|${kind}|${slot}`,list);
      for(const fresh of [true,false]){
        for(let k=0;k<order.length;k+=1){
          const row=order[(start+k)%order.length];
          if(plain(row)&&BANNED.test(words(row)))continue;
          if(fresh&&used&&used.has(rowKey(row)))continue;
          const out=make?make(row):row;if(out){taken[slot]=rowKey(row);return out;}
        }
        if(!used)break;
      }
      return null;
    };
    walk.keep=slots=>{if(used)for(const slot of slots)if(taken[slot])used.add(taken[slot]);};
    return walk;
  }
  // Fills {placeholders}; a row naming a value this paper does not have is refused (null), never printed with braces.
  function fill(text,vals){
    let missing=false;
    const out=String(text??"").replace(/\{(\w+)\}/g,(match,key)=>{if(vals[key]===undefined||vals[key]===null||vals[key]===""){missing=true;return match;}return String(vals[key]);});
    return missing?null:out.replace(/\b1 points\b/g,"1 point");
  }
  function fillRow(row,keys,vals){const out={...row};for(const k of keys){if(row[k]===undefined)continue;const t=fill(row[k],vals);if(t===null)return null;out[k]=t;}return out;}
  function fillStory(row,vals){
    if(!row)return null;const paragraphs=[];
    for(const p of row.paragraphs){const t=fill(p,vals);if(t===null)return null;paragraphs.push(t);}
    const standfirst=row.standfirst?fill(row.standfirst,vals):null;if(row.standfirst&&standfirst===null)return null;
    return {id:row.id,byline:row.byline,standfirst,paragraphs};
  }
  const words=row=>[row.headline,row.subhead,row.kicker,row.standfirst,row.pullquote,row.text,row.head,...(row.paragraphs||[])].filter(Boolean).join(" ");

  // ---------- the facts, read from the converged Shared History projection ----------
  function seasonItems(result){
    const s=result.scoring||{};
    return {
      "champions-league":result.championsLeague===true,"europa-league":result.europaLeague===true,"league-title":result.leaguePosition===1,"domestic-cup":result.domesticCup===true,
      "performance-bonus":s.performanceBonus===1,"awards-bonus":s.individualAwardsBonus===1,
      points:{championsLeague:s.championsLeague||0,europaLeague:s.europaLeague||0,leagueTitle:s.leagueTitle||0,domesticCup:s.domesticCup||0,performance:s.performanceBonus||0,awards:s.individualAwardsBonus||0,total:s.total}
    };
  }
  const trophyCount=items=>["champions-league","europa-league","league-title","domestic-cup"].filter(k=>items[k]).length;
  // Every accepted season up to `through`, checked: scores 0-11, and the stored winner is the one the scores give (equal is a draw).
  function readHistory(projection,through){
    if(!plain(projection)||!Array.isArray(projection.seasonHistory)||!LENGTHS.includes(projection.totalSeasons)||!plain(projection.managerRecords))return null;
    const T=projection.totalSeasons;if(!int(through,1,T)||projection.seasonHistory.length<through)return null;
    const clubs={};for(const role of ROLES){const club=projection.managerRecords[role]?.club;if(typeof club!=="string"||!club.trim())return null;clubs[role]=club;}
    const seasons=[];
    for(let i=0;i<through;i+=1){
      const row=projection.seasonHistory[i];if(!plain(row)||row.roundNumber!==i+1||!plain(row.playerOne)||!plain(row.playerTwo))return null;
      const a=row.playerOne.scoring?.total,b=row.playerTwo.scoring?.total;if(!int(a,0,11)||!int(b,0,11))return null;
      const winner=a>b?"playerOne":b>a?"playerTwo":"draw";if(row.winner!==winner)return null;
      seasons.push({number:i+1,score:{playerOne:a,playerTwo:b},winner,items:{playerOne:seasonItems(row.playerOne),playerTwo:seasonItems(row.playerTwo)}});
    }
    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons};
  }
  const totalsOf=seasons=>seasons.reduce((t,s)=>({playerOne:t.playerOne+s.score.playerOne,playerTwo:t.playerTwo+s.score.playerTwo}),{playerOne:0,playerTwo:0});
  function spOf(sp){return plain(sp)&&plain(sp.daniel)&&plain(sp.nik)&&typeof sp.daniel.name==="string"&&sp.daniel.name&&typeof sp.nik.name==="string"&&sp.nik.name?{daniel:sp.daniel.name,nik:sp.nik.name}:null;}

  // Trophy desk: each manager's biggest item of the season (or of the Showdown on a final page). Team V's briefs cover the
  // Champions League, the Europa League and the league title; the smaller items get one plain line of fact.
  const BRIEF_ORDER=["champions-league","europa-league","league-title","domestic-cup","performance-bonus","awards-bonus"];
  function briefFor(walk,slot,role,items,clubs,final){
    const C=tgCopy(),topic=BRIEF_ORDER.find(k=>items[k])||"none",club=clubs[role],name=NAMES[role],span=final?"in this Showdown":"this season";
    const rows=C.small.briefs.filter(b=>b.situation===topic);
    if(rows.length){const row=walk(slot,rows,r=>final&&FUTURE.test(r.text)?null:r);if(row)return {head:row.head,text:row.text,trophy:TROPHY_ART[topic],club,id:`brief:${topic}:${C.small.briefs.indexOf(row)}`};}
    const plainLine={
      "domestic-cup":{head:"Cup for "+club,text:`${name} and ${club} won the domestic cup ${span}.`},
      "performance-bonus":{head:"Bonus point",text:`${name} earned the performance bonus with ${club} ${span}.`},
      "awards-bonus":{head:"Awards night",text:`${name} took the individual awards bonus with ${club} ${span}.`},
      none:{head:"Nothing on the shelf",text:`No trophy and no bonus point for ${name} and ${club} ${span}.`}
    }[topic];
    return {...plainLine,trophy:TROPHY_ART[topic]||null,club,id:`brief:${topic}`};
  }
  function earsFor(walk){const C=tgCopy(),first=walk("ear1",C.small.ears);const second=walk("ear2",C.small.ears.filter(e=>e!==first));return [first?.text||"",second?.text||""];}
  // The pull quote: a winner or runner-up line (a draw: either manager), said by that manager.
  function quoteFor(walk,side,vals,keep){
    const C=tgCopy(),who=side==="draw"?null:side==="winner"?"{winner}":"{loser}";
    const rows=C.small.quotes.filter(q=>side==="draw"?q.situation==="draw":q.situation==="win"&&q.who===who);
    const row=walk("quote",rows,r=>keep(r)?fillRow(r,["who","text"],vals):null);
    return row?{text:row.text,who:row.who}:null;
  }
  function captionFor(walk,draw,vals,keep){
    const C=tgCopy(),rows=C.small.captions.filter(c=>c.photo===(draw?"lead-draw":"lead-season"));
    return walk("caption",rows,r=>keep(r)?fillRow(r,["text"],vals):null);
  }

  // ---------- SEASON edition ----------
  // Only the situations that are true are offered (pick by situation, never by id). A drawn season is told only by the
  // drawn pages; level totals only by the level pages; a 1-point win is never a big win.
  function seasonSituations(facts,N){
    const T=facts.totalSeasons,season=facts.seasons[N-1],W=season.winner;
    const before=totalsOf(facts.seasons.slice(0,N-1)),after=totalsOf(facts.seasons.slice(0,N));
    const level=after.playerOne===after.playerTwo,gap=Math.abs(after.playerOne-after.playerTwo);
    const list=[];
    if(W==="draw")list.push("draw");
    else{
      const L=OTHER[W],margin=Math.abs(season.score.playerOne-season.score.playerTwo),gapBefore=before[W]-before[L],gapAfter=after[W]-after[L];
      list.push(margin>=6?"big-win":margin>=3?"comfortable-win":"narrow-win");
      if(N>=2&&gapBefore<0&&gapAfter<0)list.push("comeback");
      if(N>=2&&gapBefore>0)list.push("lead-extended");
      let streak=0;for(let i=N-1;i>=0&&facts.seasons[i].winner===W;i-=1)streak+=1;
      if(streak>=3)list.push("winning-streak");
      const wi=season.items[W],li=season.items[L];
      if(wi["champions-league"]&&!li["champions-league"])list.push("champions-league");
      if(wi["europa-league"]&&!li["europa-league"])list.push("europa-league");
      if(wi["league-title"]&&!li["league-title"])list.push("league-title");
    }
    if(N>=2&&level)list.push("level-overall");
    // shown on the paper before the last season, while the last season can still settle it (a season is worth at most 11)
    if(T>=3&&N===T-1&&gap<=11)list.push("final-season-decider");
    return list;
  }
  // Each paper is built after the papers of the Showdown's earlier seasons (the same rows on both phones), so it can pass
  // over the rows they printed.
  function seasonEdition({projection,seasonNumber,specialPlayers=null}={}){
    const C=tgCopy(),P=tgPages();if(!C||!P)return null;
    const N=seasonNumber,facts=readHistory(projection,N);if(!facts||N>=facts.totalSeasons)return null;
    const used=new Set();let edition=null;
    for(let k=1;k<=N;k+=1)edition=buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,k===N?specialPlayers:null,used);
    return edition;
  }
  function buildSeason(facts,N,specialPlayers,used){
    const C=tgCopy(),P=tgPages();
    const T=facts.totalSeasons,season=facts.seasons[N-1],W=season.winner,draw=W==="draw",L=draw?null:OTHER[W];
    const key=`${facts.rivalryId}|season|${N}`,walk=walker(facts.rivalryId,"season",N-1,used);
    const after=totalsOf(facts.seasons),leader=after.playerOne>after.playerTwo?"playerOne":after.playerTwo>after.playerOne?"playerTwo":null;
    const margin=Math.abs(season.score.playerOne-season.score.playerTwo);
    const base={seasonNo:N,seasonsTotal:T,managerA:NAMES.playerOne,managerB:NAMES.playerTwo,clubA:facts.clubs.playerOne,clubB:facts.clubs.playerTwo};
    if(!draw)Object.assign(base,{winner:NAMES[W],loser:NAMES[L],winnerClub:facts.clubs[W],loserClub:facts.clubs[L],winnerPoints:season.score[W],loserPoints:season.score[L],margin});
    if(leader)Object.assign(base,{leader:NAMES[leader],trailer:NAMES[OTHER[leader]]});
    // {points}: the season points each on a drawn season, the overall total each when the totals are level
    const valsFor=situation=>situation==="level-overall"?{...base,points:after.playerOne}:situation==="draw"?{...base,points:season.score.playerOne}:base;
    const noSilver=!draw&&trophyCount(season.items[W])===0;
    // "whoever wins the last season takes the Showdown" is only true while the totals are level
    const keep=row=>!(noSilver&&SILVER.test(words(row)))&&!(leader&&WINNER_TAKES_ALL.test(words(row)));
    const options=seasonSituations(facts,N).map(situation=>{
      const vals=valsFor(situation);
      const heads=P.season.filter(r=>r.situation===situation),stories=C.stories.filter(s=>s.edition==="season"&&s.situation===situation);
      const head=walk(`headline:${situation}`,heads,r=>keep(r)?fillRow(r,["headline","subhead","kicker"],vals):null);
      const story=walk(`story:${situation}`,stories,r=>keep(r)?fillStory(r,vals):null);
      return head&&story?{situation,head,story,vals}:null;
    }).filter(Boolean);
    if(!options.length)return null;
    const chosen=options[tgHash(`${key}|situation`)%options.length],{head,story}=chosen,vals=valsFor(draw?"draw":"");
    const side=draw?"draw":walk("quote-side",["winner","runner-up"]);
    const quote=quoteFor(walk,side,vals,keep);
    const photo=draw?"GZ_LEAD_DRAW":walk("photo",["GZ_LEAD_SEASON","GZ_LEAD_PRESS"]);
    const caption=captionFor(walk,draw,vals,keep);
    let portrait=null;
    if(!draw){
      const think=walk("portrait",["winner","thinker"])==="thinker",role=think?L:W;
      portrait={name:`GZ_${think?"THINK":"WIN"}_${role==="playerOne"?"DANIEL":"NIK"}`,caption:think?`${NAMES[L]} and ${facts.clubs[L]} regroup after season ${N}.`:`${NAMES[W]}, season ${N} winner with ${facts.clubs[W]}.`};
    }
    const i1=season.items.playerOne,i2=season.items.playerTwo,rows=[{label:"Champions League",k:"championsLeague"}];
    if(i1["europa-league"]||i2["europa-league"])rows.push({label:"Europa League",k:"europaLeague"});
    rows.push({label:"League title",k:"leagueTitle"},{label:"Domestic cup",k:"domesticCup"},{label:"Performance",k:"performance"},{label:"Awards",k:"awards"});
    const numbers=rows.map(r=>({label:r.label,left:i1.points[r.k],right:i2.points[r.k]}));
    numbers.push({label:"Season points",left:season.score.playerOne,right:season.score.playerTwo,total:true});
    if(N>1)numbers.push({label:"Showdown total",left:after.playerOne,right:after.playerTwo});
    const briefs=ROLES.map((role,i)=>briefFor(walk,"brief"+i,role,season.items[role],facts.clubs,false));
    const ears=earsFor(walk);
    walk.keep([`headline:${chosen.situation}`,`story:${chosen.situation}`,"quote","caption","brief0","brief1","ear1","ear2"]);
    return Object.freeze({
      kind:"season",key,rivalryId:facts.rivalryId,seasonNumber:N,totalSeasons:T,situation:chosen.situation,winner:draw?"draw":NAMES[W],
      paper:{
        variant:draw?"draw":"season",kicker:draw?"DRAWN":head.kicker||`${NAMES[W].toUpperCase()} WINS`,headline:head.headline,subhead:head.subhead,
        season:`Season ${N} of ${T}`,dateline:"Season review",edition:"Price: one point",issue:`Vol. I · No. ${N}`,ears,
        left:{name:NAMES.playerOne,club:facts.clubs.playerOne,score:season.score.playerOne},right:{name:NAMES.playerTwo,club:facts.clubs.playerTwo,score:season.score.playerTwo},
        photo:{name:photo,caption:caption?caption.text:"",credit:"Gazette photo"},
        story:{byline:story.byline,paragraphs:story.paragraphs},
        numbersTitle:"Season in numbers",numbers,quote:quote?{text:quote.text,who:quote.who}:null,portrait,briefs,
        inside:[],specialPlayers:spOf(specialPlayers)
      },
      ids:{headline:head.id,story:story.id,briefs:briefs.map(b=>b.id)}
    });
  }

  // ---------- FINAL edition ----------
  function finalEdition({projection,final=null,specialPlayers=null}={}){
    const C=tgCopy(),P=tgPages();if(!C||!P||!plain(projection))return null;
    const T=projection.totalSeasons,facts=readHistory(projection,T);if(!facts||facts.seasons.length!==T)return null;
    const totals=totalsOf(facts.seasons),W=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw";
    // The Final Winner frame, when given, must say the same (it reads the reconciled winner; the paper never disagrees with it).
    if(final){const fw={daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner];if(fw!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
    const draw=W==="draw",L=draw?null:OTHER[W],margin=Math.abs(totals.playerOne-totals.playerTwo);
    const golden=!draw&&T===GOLDEN.seasons&&totals[W]>=GOLDEN.points;
    const used=new Set();for(let k=1;k<T;k+=1)buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,null,used);
    const key=`${facts.rivalryId}|final|${T}`,walk=walker(facts.rivalryId,"final",0,used);
    const vals={seasonsTotal:T,managerA:NAMES.playerOne,managerB:NAMES.playerTwo,clubA:facts.clubs.playerOne,clubB:facts.clubs.playerTwo};
    if(draw)vals.points=totals.playerOne;
    else Object.assign(vals,{winner:NAMES[W],loser:NAMES[L],winnerClub:facts.clubs[W],loserClub:facts.clubs[L],winnerPoints:totals[W],loserPoints:totals[L],margin,leader:NAMES[W],trailer:NAMES[L]});
    // Situations: a draw only the drawn pages; the Golden Showdown (first to 110 over ten seasons); otherwise the Showdown's
    // length (ten seasons read as the long, five-season pages), decided in its last season (the winner did not lead before
    // it), or a dominant win (already out of reach before the last season: a season is worth at most 11 points).
    let situations;
    if(draw)situations=["showdown-drawn"];
    else if(golden)situations=["golden-showdown-won"];
    else{
      situations=[T===1?"showdown-won-1-season":T===3?"showdown-won-3-seasons":"showdown-won-5-seasons"];
      if(T>=3){const before=totalsOf(facts.seasons.slice(0,T-1));if(before[W]<=before[L])situations.push("won-on-the-final-day");if(before[W]-before[L]>11)situations.push("dominant-win");}
    }
    const keep=row=>!FUTURE.test(words(row));
    const options=situations.map(situation=>{
      const head=walk(`headline:${situation}`,P.final.filter(r=>r.situation===situation),r=>keep(r)?fillRow(r,["headline","subhead","kicker"],vals):null);
      const story=walk(`story:${situation}`,C.stories.filter(s=>s.edition==="final"&&s.situation===situation),r=>keep(r)?fillStory(r,vals):null);
      return head&&story?{situation,head,story}:null;
    }).filter(Boolean);
    if(!options.length)return null;
    const chosen=options[tgHash(`${key}|situation`)%options.length],{head,story}=chosen;
    const side=draw?"draw":walk("quote-side",["winner","runner-up"]);
    const quote=quoteFor(walk,side,vals,keep);
    const photo=golden?"GZ_LEAD_GOLD":draw?"GZ_LEAD_DRAW":"GZ_LEAD_FINAL";
    const caption=captionFor(walk,draw,vals,row=>keep(row)&&!/\bseason/i.test(row.text));
    const portrait=draw?null:{name:`GZ_WIN_${W==="playerOne"?"DANIEL":"NIK"}`,caption:`${NAMES[W]}, Showdown ${golden?"Golden champion":"champion"} with ${facts.clubs[W]}.`};
    // The Showdown in numbers: every season (up to five), or the trophy count over ten seasons.
    let numbers;
    const rec=role=>{const r={cl:0,el:0,league:0,cup:0,wins:0,best:0};for(const s of facts.seasons){const it=s.items[role];r.cl+=it["champions-league"]?1:0;r.el+=it["europa-league"]?1:0;r.league+=it["league-title"]?1:0;r.cup+=it["domestic-cup"]?1:0;r.wins+=s.winner===role?1:0;r.best=Math.max(r.best,s.score[role]);}return r;};
    const r1=rec("playerOne"),r2=rec("playerTwo");
    if(T<=5)numbers=facts.seasons.map(s=>({label:`Season ${s.number}`,left:s.score.playerOne,right:s.score.playerTwo}));
    else{numbers=[{label:"Champions Leagues",left:r1.cl,right:r2.cl}];if(r1.el||r2.el)numbers.push({label:"Europa Leagues",left:r1.el,right:r2.el});numbers.push({label:"League titles",left:r1.league,right:r2.league},{label:"Domestic cups",left:r1.cup,right:r2.cup},{label:"Seasons won",left:r1.wins,right:r2.wins},{label:"Best season",left:r1.best,right:r2.best});}
    numbers.push({label:"Overall",left:totals.playerOne,right:totals.playerTwo,total:true});
    // Trophy desk: the Showdown trophy for the winner (none on a draw), and each other manager's biggest prize of the Showdown.
    const showdownItems=role=>{const r=rec(role);return {"champions-league":r.cl>0,"europa-league":r.el>0,"league-title":r.league>0,"domestic-cup":r.cup>0,"performance-bonus":facts.seasons.some(s=>s.items[role]["performance-bonus"]),"awards-bonus":facts.seasons.some(s=>s.items[role]["awards-bonus"])};};
    const briefs=draw?ROLES.map((role,i)=>briefFor(walk,"brief"+i,role,showdownItems(role),facts.clubs,true))
      :[{head:golden?"Golden Showdown won":"The Showdown trophy",text:golden?`${NAMES[W]} reaches ${GOLDEN.points} points, the target that wins the Golden Showdown.`:`${NAMES[W]}'s name goes on the trophy that outranks every cup in either cabinet.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[W],id:"showdown-trophy"},briefFor(walk,"brief1",L,showdownItems(L),facts.clubs,true)];
    return Object.freeze({
      kind:"final",key,rivalryId:facts.rivalryId,seasonNumber:T,totalSeasons:T,situation:chosen.situation,winner:draw?"draw":NAMES[W],golden,
      paper:{
        variant:golden?"gold":draw?"draw":"season",kicker:draw?"DRAWN":head.kicker||"SHOWDOWN WINNER",headline:head.headline,subhead:head.subhead,
        season:`${T} season${T===1?"":"s"}`,dateline:golden?"Golden edition":"Final edition",edition:golden?"Commemorative edition":"Price: one point",issue:golden?"Vol. I · Golden edition":"Vol. I · Final edition",ears:earsFor(walk),
        left:{name:NAMES.playerOne,club:facts.clubs.playerOne,score:totals.playerOne},right:{name:NAMES.playerTwo,club:facts.clubs.playerTwo,score:totals.playerTwo},
        photo:{name:photo,caption:caption?caption.text:"",credit:"Gazette photo"},
        story:{byline:story.byline,paragraphs:story.paragraphs},
        numbersTitle:golden?"The Golden Showdown":"The Showdown in numbers",numbers,quote:quote?{text:quote.text,who:quote.who}:null,portrait,briefs,
        inside:[],specialPlayers:spOf(specialPlayers)
      },
      ids:{headline:head.id,story:story.id,briefs:briefs.map(b=>b.id)}
    });
  }

  // Every word a paper prints (for the contracts: no braces, no "Marquee", the same on both phones).
  function paperText(edition){
    const p=edition?.paper;if(!p)return "";
    return [p.kicker,p.headline,p.subhead,p.season,p.dateline,p.edition,p.issue,...p.ears,p.left.name,p.left.club,p.right.name,p.right.club,p.photo.caption,p.photo.credit,p.story.byline,...p.story.paragraphs,p.numbersTitle,...p.numbers.map(n=>`${n.label} ${n.left} ${n.right}`),p.quote?.text,p.quote?.who,p.portrait?.caption,...p.briefs.map(b=>`${b.head} ${b.text}`),...p.inside,p.specialPlayers?`Special Players ${p.specialPlayers.daniel} ${p.specialPlayers.nik}`:""].filter(x=>x!==null&&x!==undefined).join("\n");
  }

  // ---------- the inputs, read from what this screen already holds (no read, no write) ----------
  function tgState(name){try{return root[name]?.getState?.()??null;}catch(_error){return null;}}
  function tgSpecial(rivalryId){try{const chip=root.CareerModeSpecialPlayerChip;return chip&&typeof chip.liveFor==="function"?chip.liveFor(rivalryId):null;}catch(_error){return null;}}
  // SEASON: the season this phone's CONTINUE TO SEASON N+1 belongs to (Shared History converged through it).
  function seasonInput(states){
    const history=states?.history,projection=history?.projection;
    if(history?.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||!plain(projection))return null;
    const N=Number(history.throughSeason);if(!Number.isInteger(N)||projection.acceptedSeasons!==N)return null;
    return {projection,seasonNumber:N,specialPlayers:states.specialPlayers||null};
  }
  // FINAL: the Final Winner frame on screen and the verified history it was drawn from (js/seasonFinalV10.js).
  function finalInput(states){
    const final=states?.final,history=states?.history,projection=history?.projection;
    if(!plain(final)||!final.winner||!plain(projection)||history?.phase!=="HISTORY_CONVERGED")return null;
    if(Number.isInteger(final.seasonsPlayed)&&final.seasonsPlayed!==projection.totalSeasons)return null;
    return {projection,final,specialPlayers:final.specialPlayers||states.specialPlayers||null};
  }

  // ---------- the page (browser only) ----------
  const SEEN_KEY="careerModeShowdown.gazetteSeen.v1",SEEN_MAX=60;
  const ASSET_CAP_MS=4000,FINAL_SAFETY_MS=2500,SEASON_SAFETY_MS=9000;
  const BASE="visual-assets/v10_1/content/";
  const FONTS=Object.freeze([["Gazette Mast","normal",400,"unifrakturmaguntia-latin-400-normal"],["Gazette Head","normal",700,"playfair-display-latin-700-normal"],["Gazette Head","normal",900,"playfair-display-latin-900-normal"],["Gazette Head","italic",400,"playfair-display-latin-400-italic"],["Gazette Body","normal",400,"old-standard-tt-latin-400-normal"],["Gazette Body","italic",400,"old-standard-tt-latin-400-italic"],["Gazette Body","normal",700,"old-standard-tt-latin-700-normal"]]);
  const FONT_FILES=Object.freeze(FONTS.map(f=>`${BASE}gazette/fonts/${f[3]}.woff2`));
  let installed=false,opening=null,current=null,passing=false,assetsPromise=null;
  // (through js/storage.js, the app's one door to the browser's local storage)
  function seenList(){try{const raw=typeof root.readStorageValue==="function"?root.readStorageValue(SEEN_KEY):null;const v=JSON.parse(raw||"[]");return Array.isArray(v)?v.filter(x=>typeof x==="string"):[];}catch(_error){return [];}}
  function seen(key){return seenList().includes(key);}
  function markSeen(key){try{const list=seenList().filter(k=>k!==key);list.push(key);if(typeof root.writeStorageValue==="function")root.writeStorageValue(SEEN_KEY,JSON.stringify(list.slice(-SEEN_MAX)));}catch(_error){}}
  const assetUrl=path=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(path):path;
  const activeScreen=()=>{try{return typeof root.getActiveScreenName==="function"?root.getActiveScreenName():null;}catch(_error){return null;}};
  const within=(promise,ms)=>Promise.race([Promise.resolve(promise).then(()=>true,()=>false),new Promise(resolve=>root.setTimeout(()=>resolve(false),ms))]);
  // The page's own files: Team V's sheet and paper, this page's sheet and the copy. The fonts are declared with the shell's
  // versioned urls (service-worker.js precaches them), so a phone that has played once prints the paper offline too.
  function tgFontRule(doc){
    if(doc.getElementById("tgzFontFaces"))return;
    const style=doc.createElement("style");style.id="tgzFontFaces";
    style.textContent=FONTS.map((f,i)=>`@font-face{font-family:"${f[0]}";font-style:${f[1]};font-weight:${f[2]};font-display:swap;src:url("${assetUrl(FONT_FILES[i])}") format("woff2")}`).join("\n");
    doc.head.appendChild(style);
  }
  function loadAssets(){
    if(assetsPromise)return assetsPromise;
    const load=root.loadRuntimeScript,style=root.loadRuntimeStyle;
    if(typeof load!=="function"||typeof style!=="function")return Promise.reject(new Error("GAZETTE_LOADER_UNAVAILABLE"));
    const doc=root.document;
    assetsPromise=Promise.all([
      style("gazette-content",BASE+"content.css"),style("gazette-page","css/v10Gazette.css"),
      load("gazette-frontpage",BASE+"frontpage.js",()=>Boolean(root.ShowdownContent?.frontPage)),
      load("gazette-copy","data/gazetteCopy.js",()=>Boolean(root.CareerModeGazetteCopy)),
      load("gazette-headlines","data/frontPages.js",()=>Boolean(root.CareerModeFrontPages)),
      load("visual-identity","js/visualIdentity.js",()=>typeof root.getClubCrestSvg==="function").catch(()=>null)
    ]).then(()=>{tgFontRule(doc);return doc.fonts&&typeof doc.fonts.load==="function"?Promise.all(FONTS.map(f=>doc.fonts.load(`${f[1]} ${f[2]} 16px "${f[0]}"`).catch(()=>null))):null;}).then(()=>true);
    assetsPromise.catch(()=>{assetsPromise=null;});
    return assetsPromise;
  }
  const art=name=>root.ShowdownContent?.frontPage?.art?root.ShowdownContent.frontPage.art(name):`${BASE}gazette/${name}.webp`;
  function edPictures(edition){const p=edition.paper;return [p.photo?.name,p.portrait?.name,...p.briefs.map(b=>b.trophy)].filter(Boolean).map(art);}
  function decode(url){return new Promise(resolve=>{const img=new root.Image();img.decoding="async";img.onload=img.onerror=()=>resolve();img.src=url;if(typeof img.decode==="function")img.decode().then(resolve,resolve);});}
  function tgPrepare(edition){return loadAssets().then(()=>Promise.all(edPictures(edition).map(decode)));}
  function compactNow(){try{return root.matchMedia?.("(max-width: 700px), (max-height: 520px) and (max-width: 1000px)")?.matches===true;}catch(_error){return false;}}
  function paperFor(edition,compact){
    const p={...edition.paper,compact:compact?(edition.kind==="final"?"short":true):false};
    p.photo={...p.photo,src:art(p.photo.name)};
    if(p.portrait)p.portrait={...p.portrait,src:art(p.portrait.name)};
    p.briefs=p.briefs.map(b=>({...b,trophy:b.trophy?art(b.trophy):null}));
    if(!p.quote)delete p.quote;
    return p;
  }
  function eyebrowFor(edition){return edition.kind==="final"?(edition.golden?"Golden Showdown · front page":"Final front page"):`Season ${edition.seasonNumber} of ${edition.totalSeasons} · front page`;}
  // The Special Players line, under the score strip (phone and desktop): "SP" with each manager's player.
  function addSpecialPlayers(paper,sp,doc){
    if(!sp)return;const strip=paper.querySelector(".cmx-paper__photo");if(!strip)return;
    const line=doc.createElement("p");line.className="tgz-sp";
    const label=doc.createElement("b");label.textContent="Special Players";
    const a=doc.createElement("span");a.textContent=`${NAMES.playerOne}: ${sp.daniel}`;
    const b=doc.createElement("span");b.textContent=`${NAMES.playerTwo}: ${sp.nik}`;
    line.append(label,a,b);strip.after(line);
  }
  // The whole paper and its CONTINUE fit the window: the paper is scaled down a little on short windows (never below 72% on
  // desktop or 82% for the phone edition), after which the page scrolls as usual. CONTINUE itself is never scaled.
  function fit(){
    const state=current;if(!state||!state.page.isConnected)return;
    const compact=compactNow();
    if(compact!==state.compact){tgRender(state.plan,state);return;}
    const desk=state.page.querySelector(".cmx-fp-screen__desk");if(!desk)return;
    desk.style.zoom="";
    const screen=state.page.querySelector(".cmx-fp-screen"),paper=desk.firstElementChild;if(!screen||!paper)return;
    const top=state.page.getBoundingClientRect().top,avail=root.innerHeight-Math.max(0,top);
    const over=screen.scrollHeight-avail;if(over<=0)return;
    const k=Math.max(compact?0.82:0.72,Math.min(1,(paper.offsetHeight-over)/paper.offsetHeight));desk.style.zoom=String(Math.round(k*1000)/1000);
  }
  function tgClose(){
    const state=current;current=null;if(!state)return;
    root.removeEventListener?.("resize",state.onResize);root.clearTimeout(state.safety);
    state.page.remove();
    if(state.host?.dataset?.gazette)delete state.host.dataset.gazette;
    if(root.document?.documentElement?.dataset?.gazette)delete root.document.documentElement.dataset.gazette;
  }
  function tgRender(plan,previous=null){
    const doc=root.document,host=doc.getElementById("seasonEntry");if(!host)return false;
    if(previous&&previous.page.isConnected)previous.page.remove();
    const page=doc.createElement("div");page.id="touchlineGazette";page.className=`tgzPage tgzPage--${plan.kind}`;page.setAttribute("role","region");page.setAttribute("aria-label","The Touchline Gazette");
    page.dataset.gazetteKey=plan.edition.key;
    // the plate the screen just showed (Season Results or Final Winner), with the shell's own urls: already in the cache
    const plate=plan.kind==="final"?"FINAL_WINNER":"SEASON_RESULTS",dir="visual-assets/v10_1/plates-v2/ENV_"+plate;
    // (absolute: a url() inside a custom property resolves against the stylesheet that uses it, css/)
    const abs=path=>{const url=assetUrl(path);try{return new URL(url,doc.baseURI).href;}catch(error){return url;}};
    page.style.setProperty("--tgz-plate-desktop",`image-set(url("${abs(dir+"_PLATE_V2_1X.webp")}") 1x,url("${abs(dir+"_PLATE_V2_2X.webp")}") 2x)`);
    page.style.setProperty("--tgz-plate-phone",`url("${abs(dir+"_PHONE_V2.webp")}")`);
    host.appendChild(page);
    const compact=compactNow();
    root.ShowdownContent.frontPage.screen(page,paperFor(plan.edition,compact),()=>proceed(),{eyebrow:eyebrowFor(plan.edition),title:"Read all about it",button:"Continue",still:Boolean(previous)});
    page.querySelector(".cmx-fp-screen__title")?.remove();
    const paper=page.querySelector(".cmx-paper");if(paper)addSpecialPlayers(paper,plan.edition.paper.specialPlayers,doc);
    const button=page.querySelector(".cmx-continue");if(button)button.id="touchlineGazetteContinue";
    host.dataset.gazette=plan.kind;doc.documentElement.dataset.gazette=plan.kind;
    const state=previous||{plan,host,onResize:null,safety:null,leaving:false};
    state.page=page;state.compact=compact;state.host=host;
    if(!previous){state.onResize=()=>fit();root.addEventListener?.("resize",state.onResize);}
    current=state;
    if(!previous){const main=host.closest("main");if(main)main.scrollTop=0;root.scrollTo?.(0,0);button?.focus?.({preventScroll:true});}
    fit();if(doc.fonts?.ready)doc.fonts.ready.then(()=>fit());
    return true;
  }
  // CONTINUE: the same step the tapped button ran. If it does not leave this screen (it could not go on), the paper closes
  // and the screen the player came from is back with its own button, so nobody is ever left on the paper.
  function proceed(){
    const state=current;if(!state||state.leaving)return;state.leaving=true;
    const button=state.page.querySelector(".cmx-continue");if(button){button.disabled=true;button.setAttribute("aria-busy","true");}
    state.safety=root.setTimeout(()=>{if(current===state)tgClose();},state.plan.kind==="final"?FINAL_SAFETY_MS:SEASON_SAFETY_MS);
    let result;try{result=state.plan.proceed();}catch(_error){result=false;}
    Promise.resolve(result).then(value=>{if(value===false&&current===state)tgClose();},()=>{if(current===state)tgClose();});
  }
  // The tapped button, let through once exactly as it was tapped (its own listeners run; this page does not touch it).
  function clickThrough(find){
    const target=find();if(!target||target.disabled||!target.isConnected)return false;
    passing=true;try{target.click();}finally{passing=false;}
    return true;
  }
  // Whether a tap is due a paper is decided from the screen and the verified history alone (no copy needed), so a tap made
  // before the paper's files have arrived is still held for its paper: the files load after the tap (within ASSET_CAP_MS)
  // and the paper is built then. Only if they cannot load, or the paper cannot be built, does the tap simply go on.
  function seasonKey(input){const facts=input&&readHistory(input.projection,input.seasonNumber);return facts&&input.seasonNumber<facts.totalSeasons?`${facts.rivalryId}|season|${input.seasonNumber}`:null;}
  function finalKey(input){
    if(!input)return null;const T=input.projection.totalSeasons,facts=readHistory(input.projection,T);if(!facts||facts.seasons.length!==T)return null;
    const totals=totalsOf(facts.seasons),W=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw",final=input.final;
    if(plain(final)){if({daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner]!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
    return `${facts.rivalryId}|final|${T}`;
  }
  function planFor(button){
    if(activeScreen()!=="seasonEntry")return null;
    const host=root.document.getElementById("seasonEntry");if(!host||host.classList.contains("hidden")||!host.contains(button))return null;
    if(button.id==="sharedMultiSeasonContinueAction"){
      const progression=root.CareerModeProductionSharedMultiSeasonProgression;
      if(button.disabled||!progression||typeof progression.canContinue!=="function"||!progression.canContinue())return null;
      const history=tgState("CareerModeProductionSharedHistoryConvergence"),rivalryId=history?.rivalryId||history?.projection?.rivalryId;
      const input=seasonInput({history,specialPlayers:tgSpecial(rivalryId)}),key=seasonKey(input);if(!key||seen(key))return null;
      return {kind:"season",key,button,build:()=>seasonEdition(input),proceed:()=>typeof progression.continueToNextSeason==="function"?progression.continueToNextSeason():clickThrough(()=>root.document.getElementById("sharedMultiSeasonContinueAction"))};
    }
    const finalStage=button.closest(".v10FinalStage");
    if(finalStage&&host.classList.contains("v10FinalMode")&&!button.disabled&&(button.id==="finalWinnerRematch"||button.classList.contains("backButton"))){
      const final=root.FINAL_WINNER_FIXTURES?.frames?.LIVE||null,history=root.CareerModeSeasonFinalV10?.gazetteHistory?.()||null;
      const input=finalInput({final,history}),key=finalKey(input);if(!key||seen(key))return null;
      const rematch=button.id==="finalWinnerRematch";
      return {kind:"final",key,button,build:()=>finalEdition(input),proceed:()=>clickThrough(()=>rematch?root.document.getElementById("finalWinnerRematch"):(button.isConnected?button:root.document.querySelector("#seasonEntry .seasonEntryActions .backButton")))};
    }
    return null;
  }
  // The files, then the paper, then its pictures, all inside the cap: resolves true only when the paper is ready to show.
  function tgReady(plan){
    const work=loadAssets().then(()=>{const edition=plan.build();if(!edition||edition.key!==plan.key)return false;plan.edition=edition;return Promise.all(edPictures(edition).map(decode)).then(()=>true);}).then(value=>value===true,()=>false);
    return Promise.race([work,new Promise(resolve=>root.setTimeout(()=>resolve(false),ASSET_CAP_MS))]);
  }
  function onClick(event){
    if(passing)return;
    const button=event.target?.closest?.("button");if(!button)return;
    if(current&&current.page.contains(button))return;
    if(opening){if(button===opening.button){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}return;}
    if(current)return;
    let plan=null;try{plan=planFor(button);}catch(_error){plan=null;}
    if(!plan)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
    opening=plan;
    tgReady(plan).then(ready=>{
      opening=null;
      // The player went somewhere else meanwhile: nothing happens. Files or paper not ready: the tap goes on as before.
      if(activeScreen()!=="seasonEntry"||!plan.button.isConnected&&plan.kind==="season")return;
      if(!ready||!plan.edition||!root.ShowdownContent?.frontPage){void Promise.resolve().then(()=>plan.proceed()).catch(()=>{});return;}
      let shown=false;try{shown=tgRender(plan);}catch(_error){shown=false;tgClose();}
      if(shown)markSeen(plan.key);else void Promise.resolve().then(()=>plan.proceed()).catch(()=>{});
    });
  }
  function onScreen(event){const screen=event?.detail?.screen??activeScreen();if(current&&screen!=="seasonEntry")tgClose();}
  // Warm the page's files while Season Results or Final Winner is up, so the paper is ready the moment it is tapped.
  let warmTimer=null;
  function warm(){
    if(warmTimer||activeScreen()!=="seasonEntry")return;
    warmTimer=root.setTimeout(()=>{warmTimer=null;if(activeScreen()!=="seasonEntry")return;
      const history=tgState("CareerModeProductionSharedHistoryConvergence");
      if(history?.phase==="HISTORY_CONVERGED"||root.document?.getElementById("seasonEntry")?.classList.contains("v10FinalMode"))loadAssets().catch(()=>{});
    },400);
  }
  function tgInstall(){
    if(installed||!root.document||typeof root.addEventListener!=="function")return installed;
    installed=true;
    // Window capture runs before the game's own document listeners, so the tap reaches the Gazette first.
    root.addEventListener("click",onClick,true);
    root.document.addEventListener("career-mode-screen-shown",onScreen);
    for(const e of ["career-mode-shared-history-convergence-state-change","career-mode-shared-final-reconciliation-state-change","career-mode-shared-terminal-close-state-change"])root.addEventListener(e,warm);
    root.document.addEventListener("career-mode-screen-shown",warm);
    return true;
  }
  // Proof and test hook: draws an edition on the current Season Results screen exactly as a tap would.
  function showForProof(edition,proceedFn){return within(tgPrepare(edition),ASSET_CAP_MS).then(ready=>ready&&tgRender({kind:edition.kind,edition,button:null,proceed:proceedFn||(()=>false)}));}

  return Object.freeze({contractVersion:1,feature:"r87-touchline-gazette",firestoreReads:0,firestoreWrites:0,SEEN_KEY,FONT_FILES,hash:tgHash,fill,seasonSituations:(projection,N)=>{const f=readHistory(projection,N);return f?seasonSituations(f,N):null;},seasonEdition,finalEdition,seasonInput,finalInput,paperText,planFor,install:tgInstall,showForProof,isOpen:()=>Boolean(current),close:tgClose});
});

```

## FILE: js/productionSharedJourneyGuard.js
```js
(function(root){
  "use strict";

  const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
  const GUARDED=Object.freeze([
    "handleLeagueWheelAction",
    "spinLeagueWheel",
    "confirmLeagueSelectionAndContinue",
    "prepareClubAssignment",
    "assignClubs",
    "continueToShowdownHome"
  ]);
  const CLICK_TARGETS=Object.freeze({spinLeague:"league selection",openClubPack:"club assignment",continueClubAssignment:"shared rivalry confirmation"});
  const WRAPPED=Symbol("ssjrSharedJourneyGuard");
  const LOADER_WRAPPED=Symbol("ssjrSharedJourneyGuardLoader");
  let timer=null,eventGateInstalled=false;

  function persistedPending(){
    try{
      const runtime=root.CareerModeSaveLibraryRuntime;
      if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return null;
      const library=runtime.getLibrarySnapshot();
      if(!library||!library.activeSaveId||!Array.isArray(library.saves))return null;
      const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      if(!entry||!entry.showdown)return null;
      const marker=entry.showdown.sharedJourney;
      return Boolean(marker&&marker.mode==="shared"&&marker.setupPending===true);
    }catch(_error){return null;}
  }
  function pending(){
    // A verified active save owns either verdict; no shell yet retains the transient lock.
    const saved=persistedPending();if(saved!==null)return saved;
    try{return Boolean(root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1");}
    catch(_error){return false;}
  }
  function deny(name){
    if(typeof root.showAppNotice==="function"){
      root.showAppNotice(
        `In an online Showdown, ${name} happens only in setup, with both players connected.`,
        "error",
        9000
      );
    }
    return false;
  }
  function blockLocalDraw(name){if(!pending())return false;deny(name);return true;}
  function wrap(name){
    const original=root[name];
    if(typeof original!=="function"||original[WRAPPED])return false;
    function guarded(...args){
      if(blockLocalDraw(name))return false;
      return original.apply(this,args);
    }
    Object.defineProperty(guarded,WRAPPED,{value:true});
    Object.defineProperty(guarded,"ssjrOriginal",{value:original});
    root[name]=guarded;
    return true;
  }
  function routeCareerStartClick(target){
    if(target.id!=="continueClubAssignment"||target.dataset.sharedCareerStart!=="true")return false;
    const careerStart=root.CareerModeProductionSharedCareerStart;
    if(!careerStart||typeof careerStart.openPanel!=="function")return false;
    Promise.resolve(careerStart.openPanel()).catch(error=>{
      if(typeof root.reportApplicationError==="function")root.reportApplicationError("Shared Career Start action failed",error);
      else console.error(error);
    });
    return true;
  }
  function routePresentationClick(target){
    const presentation=root.CareerModeProductionSharedShowdownPresentation;
    if(!presentation||typeof presentation.handlesControl!=="function"||typeof presentation.handleControlClick!=="function")return false;
    if(!presentation.handlesControl(target.id))return false;
    Promise.resolve(presentation.handleControlClick(target.id)).catch(error=>{
      if(typeof root.reportApplicationError==="function")root.reportApplicationError("Shared Showdown polished presentation action failed",error);
      else console.error(error);
    });
    return true;
  }
  function installEventGate(){
    if(eventGateInstalled||!root.document||typeof root.document.addEventListener!=="function")return false;
    root.document.addEventListener("click",event=>{
      const source=event&&event.target;
      const target=source&&typeof source.closest==="function"?source.closest("#spinLeague,#openClubPack,#continueClubAssignment"):null;
      if(!target||!pending())return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(routeCareerStartClick(target))return;
      if(routePresentationClick(target))return;
      deny(CLICK_TARGETS[target.id]||target.id);
    },true);
    eventGateInstalled=true;return true;
  }
  function hookRuntimeLoader(){
    const original=root.loadRuntimeScript;
    if(typeof original!=="function"||original[LOADER_WRAPPED])return false;
    function guardedRuntimeLoader(...args){
      return Promise.resolve(original.apply(this,args)).then(value=>{
        install();
        return value;
      });
    }
    Object.defineProperty(guardedRuntimeLoader,LOADER_WRAPPED,{value:true});
    Object.defineProperty(guardedRuntimeLoader,"ssjrOriginal",{value:original});
    root.loadRuntimeScript=guardedRuntimeLoader;
    return true;
  }
  function install(){
    installEventGate();hookRuntimeLoader();GUARDED.forEach(wrap);
    if(timer===null&&typeof root.setInterval==="function"){
      let attempts=0;
      timer=root.setInterval(()=>{
        installEventGate();hookRuntimeLoader();GUARDED.forEach(wrap);
        attempts+=1;
        if(attempts>=120){root.clearInterval(timer);timer=null;}
      },250);
    }
    return true;
  }

  const api=Object.freeze({
    contractVersion:2,
    feature:"ssjr-local-random-authority-guard",
    guardedFunctions:GUARDED,
    hooksLazyRuntimeLoader:true,
    capturesActualDrawClicks:true,
    routesPolishedPresentationClicks:true,
    routesCareerStartAfterConfirmedSetup:true,
    usesPersistedSaveMarker:true,
    canonicalLocalStorageMutation:false,
    billingRequired:false,
    isSharedJourneyPending:pending,
    blockLocalDraw,
    install
  });
  root.CareerModeProductionSharedJourneyGuard=api;
  install();
})(typeof globalThis!=="undefined"?globalThis:this);

```

## FILE: js/productionSharedJourneyReconnect.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedJourneyReconnect=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const STATUS_ID="sharedJourneyReconnectStatus";
  const ACTION_ID="sharedJourneyReconnectAction";
  const NEW_CODE_ACTION_ID="sharedJourneyReconnectNewCode";
  const DEPENDENCIES=Object.freeze([
    ["ssjr-multi-season-protocol","js/sharedMultiSeasonProgression.js",()=>root.CareerModeSharedMultiSeasonProgression],
    ["ssjr-journey-reconnect-protocol","js/sharedJourneyReconnect.js",()=>root.CareerModeSharedJourneyReconnect],
    ["ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup],
    ["ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression],
    ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining],
    ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
    ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
    ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry]
  ]);
  let installed=false,busy=false,state=null,protocol=null,setupApi=null,multiApi=null,remoteApi=null,accountApi=null,pairingApi=null,rivalryApi=null,unsubscribeRemote=null,refreshPromise=null,contextKey="";
  let lastReportedCode="";
  // A progression read can be denied for one poll right after a fresh session or a close while the
  // rivalry catches up; that check retries itself, so it is reported only if the same failure repeats.
  let heldTransientCode="";
  // Hunt 1018 (H1018-4): going offline bumps the generation, so a refresh still awaiting its reads cannot publish over OFFLINE_HOLD.
  let pjrGeneration=0,wakePending=false;

  function pjrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pjrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pjrSharedMarker(){const showdown=pjrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pjrMarkerRivalry(){return String(pjrShowdown()?.sharedJourney?.rivalryId||"").trim();}
  function pjrSetupPending(){const journey=pjrShowdown()?.sharedJourney;return Boolean(journey&&journey.mode==="shared"&&journey.setupPending===true);}
  function pjrPrePairShell(){return Boolean(pjrSetupPending()&&!pjrMarkerRivalry());}
  function pjrSetupPresentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function pjrReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pjrLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)pjrFail("JOURNEY_RECONNECT_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
  async function pjrEnsureDependencies(){
    const resolved={};for(const [key,path,ready] of DEPENDENCIES)resolved[key]=await pjrLoad(key,path,ready);
    const factory=resolved["ssjr-journey-reconnect-protocol"];
    if(!factory||typeof factory.createProtocol!=="function")pjrFail("JOURNEY_RECONNECT_PROTOCOL_UNAVAILABLE");
    protocol=protocol||factory.createProtocol({multiSeasonModule:resolved["ssjr-multi-season-protocol"]});
    setupApi=resolved["ssjr-production-setup"];multiApi=resolved["ssjr-production-multi-season"];remoteApi=resolved.rj;accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;
    if(typeof setupApi?.refresh!=="function"||typeof setupApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SETUP_UNAVAILABLE");
    if(typeof multiApi?.refresh!=="function"||typeof multiApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_PROGRESSION_UNAVAILABLE");
    if(typeof remoteApi?.getState!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UNAVAILABLE");
    return true;
  }
  function pjrCurrentIdentity(){
    const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
    const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),rivalryId=String(rivalry?.rivalryId||"").trim(),managerRole=rivalry?.binding?.managerRole;
    if(!account?.connected||!accountId)pjrFail("JOURNEY_RECONNECT_AUTH_REQUIRED");
    if(!device?.registered||!deviceId)pjrFail("JOURNEY_RECONNECT_DEVICE_REQUIRED");
    if(!rivalry?.attached||!rivalryId||!rivalry?.binding)pjrFail("JOURNEY_RECONNECT_RIVALRY_REQUIRED");
    if(managerRole!=="playerOne"&&managerRole!=="playerTwo")pjrFail("JOURNEY_RECONNECT_ROLE_INVALID");
    const marker=pjrMarkerRivalry();if(marker&&marker!==rivalryId)pjrFail("JOURNEY_RECONNECT_RIVALRY_MISMATCH");
    return Object.freeze({rivalryId,accountId,deviceId,managerRole});
  }
  async function pjrResolveIdentity(){
    if(typeof accountApi?.initialize==="function")await accountApi.initialize();
    if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
    if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
    if(pjrPrePairShell()&&!rivalryApi?.getState?.()?.attached)return null;
    return pjrCurrentIdentity();
  }
  function pjrSameAuthority(a,b){return Boolean(a&&b&&a.rivalryId===b.rivalryId&&a.accountId===b.accountId&&a.deviceId===b.deviceId&&a.managerRole===b.managerRole);}
  function pjrExactActive(remote,authority,now){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&now<expiry);}
  // Hunt 1018 (H1018-4): after each awaited read, a refresh that went offline or whose account, device or rivalry changed stops.
  function pjrAssertCurrent(generation,authority){if(generation!==pjrGeneration||!pjrOnline())pjrFail("JOURNEY_RECONNECT_SUPERSEDED");if(!pjrSameAuthority(pjrCurrentIdentity(),authority))pjrFail("JOURNEY_RECONNECT_CONTEXT_CHANGED");}
  function pjrPreviousFor(authority){
    if(!state)return null;
    if(state.rivalryId!==authority.rivalryId||state.accountId!==authority.accountId||state.deviceId!==authority.deviceId||state.managerRole!==authority.managerRole){state=null;contextKey="";return null;}
    return state;
  }
  function pjrRemoteSnapshot(){const remote=remoteApi?.getState?.();return remote&&typeof remote==="object"?remote:null;}
  function pjrStatusElement(){
    if(!root.document)return null;let node=root.document.getElementById(STATUS_ID);if(node)return node;
    const app=root.document.getElementById("app");if(!app)return null;
    node=root.document.createElement("div");node.id=STATUS_ID;node.className="stateNote hidden";node.setAttribute("role","status");node.setAttribute("aria-live","polite");node.dataset.sharedJourneyReconnect="true";
    const header=root.document.getElementById("topHeader");if(header?.parentNode===app)header.insertAdjacentElement("afterend",node);else app.prepend(node);return node;
  }
  // Permanent pairs reuse the same automatic connection as Home > CONTINUE CAREER.
  function pjrPermanentlyPaired(){try{const partner=root.CareerModePersistentNikDanielPair?.getPartnerState?.(),account=accountApi?.getState?.();return Boolean(partner?.status==="ready"&&partner.record?.active===true&&account&&partner.accountId===account.accountId);}catch(_error){return false;}}
  function pjrAutomaticStep(){return "Tap RECONNECT to connect Daniel and Nik again.";}
  // Accounts without a permanent partner retain the existing manual recovery instructions.
  function pjrManagerName(role){const name=pjrShowdown()?.managers?.[role];return String(name||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function pjrReconnectStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();return role==="playerTwo"?`Tap RECONNECT, paste the new code from ${pjrManagerName("playerOne")} and tap JOIN PRIVATE SESSION.`:`Tap RECONNECT, then HOST PRIVATE SESSION and send the new code to ${pjrManagerName("playerTwo")}.`;}
  // BH-11 (#1): a reload drops the page-memory session code, so this phone simply has no session. That is not an ended
  // session; say so plainly. Kept about as short as the ended-session line so the banner does not reflow the game screens;
  // where the other phone takes the new code is said in the Remote Joining panel.
  function pjrNotConnectedStep(role){if(pjrPermanentlyPaired())return pjrAutomaticStep();const other=pjrManagerName(role==="playerTwo"?"playerOne":"playerTwo");return `Tap RECONNECT, then HOST and send the code to ${other}, or JOIN ${other}'s new code.`;}
  function pjrShowdownClosed(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(t&&t.phase==="CLOSED"&&t.terminal===true);}catch(_){return false;}}
  // r80 END SHOWDOWN: the other phone ended this Showdown (Terminal Close holds it DELETED: closed, no finish witness). This
  // page has already left it for Home with the ended-early notice, and a closed rivalry never reopens, so there is no session
  // to reconnect: no banner, no RECONNECT SESSION (the gallery saw both over Nik's Home and History right after Daniel's END).
  function pjrShowdownEnded(){try{return root.CareerModeProductionSharedTerminalClose?.getState?.()?.phase==="DELETED";}catch(_){return false;}}
  function pjrMessage(value){
    if(!value)return "";
    if(value.phase==="FRESH_SESSION_REQUIRED"&&pjrShowdownClosed())return "SHOWDOWN COMPLETE · Open the Final Winner or History from Home.";
    if(value.phase==="OFFLINE_HOLD")return "OFFLINE · Reconnect to carry on.";
    if(value.phase==="RECOVERY_PENDING")return "RECONNECTING · Finish reconnecting both players before continuing.";
    if(value.phase==="FRESH_SESSION_REQUIRED"&&!value.sessionId)return `NOT CONNECTED ON THIS PHONE · Reloading drops the connection. ${pjrNotConnectedStep(value.managerRole)}`;
    if(value.phase==="FRESH_SESSION_REQUIRED")return `NEW CONNECTION NEEDED · ${value.resumable?"Your Showdown is saved; the connection ended":"The connection ended"} (a connection lasts up to 4 hours). ${pjrReconnectStep(value.managerRole)}`;
    if(value.phase==="TERMINAL_RECOVERED")return `RECONNECTED · ALL ${value.totalSeasons} SEASONS COMPLETE · No new season can be added.`;
    if(value.phase==="ACTIVE_RECOVERED")return `RECONNECTED · SEASON ${value.activeSeason} OF ${value.totalSeasons} · League, clubs and history pick up where you left off.`;
    return "RECONNECT STATUS UNAVAILABLE";
  }
  // Job 31: after RECONNECT SESSION the Remote Joining panel stayed open over the game once the fresh session was ACTIVE.
  // It now closes itself as soon as this page holds an exact unexpired ACTIVE session, and the banner re-checks at once.
  let recoveryReturnUnsubscribe=null;
  function pjrRemoteExactActive(remote){const expiry=Number(remote?.expiresAtEpochMs);return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry);}
  function pjrArmRecoveryReturn(exceptSessionId=null,authority=pjrCurrentIdentity()){
    if(typeof recoveryReturnUnsubscribe==="function")recoveryReturnUnsubscribe();recoveryReturnUnsubscribe=null;
    if(typeof remoteApi?.subscribe!=="function")return false;
    const onState=next=>{
      if(!pjrSharedMarker()||pjrShowdownEnded()||!pjrExactActive(next,authority,Date.now())||(exceptSessionId&&next.sessionId===exceptSessionId))return;
      try{if(!pjrSameAuthority(pjrCurrentIdentity(),authority))return;}catch(_error){return;}
      const stop=recoveryReturnUnsubscribe;recoveryReturnUnsubscribe=null;if(typeof stop==="function")stop();
      try{remoteApi.closePanel?.();}catch(_error){}
      void pjrRefresh();
    };
    recoveryReturnUnsubscribe=remoteApi.subscribe(onState);
    // Adoption can finish while openPanel awaits; include that already-delivered ACTIVE result.
    onState(pjrRemoteSnapshot());
    return true;
  }
  async function pjrOpenRecovery(fresh=false){
    try{
      await pjrEnsureDependencies();
      if(typeof remoteApi?.openPanel!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Reconnecting is unavailable right now.");
      const authority=pjrCurrentIdentity(),held=pjrRemoteSnapshot(),automatic=pjrPermanentlyPaired();
      if(automatic&&typeof remoteApi.autoConnect!=="function")pjrFail("JOURNEY_RECONNECT_SESSION_UI_UNAVAILABLE","Reconnecting is unavailable right now.");
      const auto=automatic?remoteApi.autoConnect():null;
      await remoteApi.openPanel();
      if(automatic||fresh||!pjrRemoteExactActive(held))pjrArmRecoveryReturn(!automatic&&fresh&&pjrRemoteExactActive(held)?held.sessionId:null,authority);
      if(auto)void auto;
      return true;
    }catch(error){pjrReport("Unable to open private session recovery",error);return false;}
  }
  async function pjrOpenSessionRecovery(){return pjrOpenRecovery();}
  // A paired phone reuses its exact ACTIVE session; manual recovery waits for a different session.
  async function pjrOpenFreshSessionCode(){return pjrOpenRecovery(true);}
  function pjrRender(){
    const node=pjrStatusElement();if(!node)return false;const visible=pjrSharedMarker()&&Boolean(state)&&!pjrShowdownEnded();node.classList.toggle("hidden",!visible);if(!visible){node.replaceChildren();return false;}const text=pjrMessage(state);node.replaceChildren(root.document.createTextNode(text));if((state.phase==="FRESH_SESSION_REQUIRED"&&!pjrShowdownClosed())||state.phase==="RECOVERY_PENDING"){const action=root.document.createElement("button");action.id=ACTION_ID;action.type="button";action.className="compactButton";action.textContent=state.phase==="FRESH_SESSION_REQUIRED"?"RECONNECT":"CHECK CONNECTION";action.disabled=busy;action.addEventListener("click",()=>{void pjrOpenSessionRecovery();});node.append(root.document.createTextNode(" "),action);}else if(state.phase==="ACTIVE_RECOVERED"){/* BH-11 (#1): this phone may still hold the session the other phone lost; let it take the other phone's new code. */const fresh=root.document.createElement("button");fresh.id=NEW_CODE_ACTION_ID;fresh.type="button";fresh.className="compactButton";fresh.textContent=pjrPermanentlyPaired()?"RECONNECT":"NEW CODE";fresh.disabled=busy;fresh.addEventListener("click",()=>{void pjrOpenFreshSessionCode();});node.append(root.document.createTextNode(" "),fresh);}node.dataset.recoveryPhase=state.phase;node.dataset.authoritative=state.activeAuthorization?"true":"false";return true;
  }
  function pjrPublish(next){
    state=next||null;contextKey=state?`${state.accountId}|${state.deviceId}|${state.rivalryId}`:"";pjrRender();
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-journey-reconnect-state-change",{detail:state?{phase:state.phase,rivalryId:state.rivalryId,managerRole:state.managerRole,activeAuthorization:state.activeAuthorization,resumable:state.resumable,recovered:state.recovered,acceptedSeasons:state.acceptedSeasons,activeSeason:state.activeSeason,totalSeasons:state.totalSeasons,terminal:state.terminal,sessionChanged:state.sessionChanged}:null}));}catch(_error){}
    return state;
  }
  function pjrOnline(){return !root.navigator||root.navigator.onLine!==false;}
  function pjrOfflineHold(){
    pjrGeneration+=1;
    if(!state||!protocol)return pjrPublish(null);
    try{
      const authority={rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole};
      return pjrPublish(protocol.observe({authority,previous:state,nowEpochMs:Date.now(),networkOnline:false,remote:null}));
    }catch(error){pjrReport("Unable to hold Shared Journey offline",error);return pjrPublish(null);}
  }
  // Hunt 1018 (H1018-3): losing account, device or rivalry authority after recovery keeps the durable plan and history but
  // publishes a non-authoritative state (recovered and activeAuthorization false) until the identity is verified again.
  function pjrDropAuthority(){
    if(!state?.activeAuthorization||!protocol)return state;
    try{return pjrPublish(protocol.observe({authority:{rivalryId:state.rivalryId,accountId:state.accountId,deviceId:state.deviceId,managerRole:state.managerRole},previous:state,nowEpochMs:Date.now(),networkOnline:pjrOnline(),remote:null}));}
    catch(error){pjrReport("Unable to drop Shared Journey authority",error);return pjrPublish(null);}
  }
  function pjrBootstrap(){return pjrEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>pjrWake());});}
  async function pjrRefreshNow(){
    const generation=pjrGeneration;
    // Codex #942: a refresh superseded while it awaited (END landed: DELETED, or offline) never publishes a banner state over the newer one.
    const publish=next=>generation===pjrGeneration?pjrPublish(next):state;
    if(!pjrSharedMarker()||pjrShowdownEnded())return pjrPublish(null);
    if(pjrSetupPending()&&pjrSetupPresentationActive())return pjrPublish(null);
    await pjrBootstrap();
    if(!pjrOnline())return pjrOfflineHold();
    const authority=await pjrResolveIdentity();if(!authority)return pjrPublish(null);const previous=pjrPreviousFor(authority),remote=pjrRemoteSnapshot();
    const now=Date.now(),base={authority,previous,nowEpochMs:now,networkOnline:true,remote};
    const remoteExpiry=Number(remote?.expiresAtEpochMs);
    const exactActive=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.rivalryId===authority.rivalryId&&remote.accountId===authority.accountId&&remote.deviceId===authority.deviceId&&remote.pendingAction==null&&Number.isFinite(remoteExpiry)&&now<remoteExpiry);
    if(!exactActive)return publish(protocol.observe(base));
    if(!previous)return pjrPublish(null);
    const setupResult=await setupApi.refresh(),setupState=setupApi.getState();
    pjrAssertCurrent(generation,authority);
    const sameSetupContext=Boolean(setupResult&&setupState&&setupState.ready===true&&setupState.rivalryId===authority.rivalryId&&setupState.sessionId===remote.sessionId);
    if(sameSetupContext&&pjrSetupPending()&&(!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"))return pjrPublish(null);
    if(!sameSetupContext||!setupState.setup||setupState.setup.phase!=="SHOWDOWN_CONFIRMED"||setupState.setup.revision!==6)pjrFail("JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED");
    const progressionResult=await multiApi.refresh(),progressionView=multiApi.getState();
    pjrAssertCurrent(generation,authority);
    if(!progressionResult||!progressionView||progressionView.authoritative!==true||progressionView.rivalryId!==authority.rivalryId||!progressionView.state){const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now(),latestExpiry=Number(latestRemote?.expiresAtEpochMs),latestExactActive=Boolean(latestRemote&&latestRemote.sessionState==="active"&&latestRemote.sessionId&&latestRemote.rivalryId===authority.rivalryId&&latestRemote.accountId===authority.accountId&&latestRemote.deviceId===authority.deviceId&&latestRemote.pendingAction==null&&Number.isFinite(latestExpiry)&&latestNow<latestExpiry);if(!latestExactActive)return publish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));pjrFail("JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE",`Season progress could not be checked (${String(multiApi?.lastError?.()||"NO_PROGRESSION_VIEW")}). You are connected; this retries by itself.`);}
    // Hunt 1018 (H1018-5): recovered authority is claimed only for the same exact session, still unexpired after the reads.
    const latestRemote=pjrRemoteSnapshot(),latestNow=Date.now();
    if(!pjrExactActive(latestRemote,authority,latestNow))return publish(protocol.observe({authority,previous,nowEpochMs:latestNow,networkOnline:true,remote:latestRemote}));
    if(latestRemote.sessionId!==remote.sessionId)return state;
    return publish(protocol.observe({...base,nowEpochMs:latestNow,remote:latestRemote,setup:setupState.setup,progression:progressionView.state}));
  }
  // A new Showdown setup or a lagging progression read can fail for one poll; report only when the same failure repeats.
  const PJR_HELD_CODES=Object.freeze(["JOURNEY_RECONNECT_PROGRESSION_NOT_AUTHORITATIVE","JOURNEY_RECONNECT_SETUP_NOT_CONFIRMED"]);
  // Account, device or rivalry authority not resolved yet (reload, startup, provider transition) is a quiet pending state:
  // the banner cannot speak for an unresolved identity, and the next poll or wake re-checks. Role/rivalry mismatches still report.
  const PJR_PENDING_AUTHORITY_CODES=Object.freeze(["JOURNEY_RECONNECT_AUTH_REQUIRED","JOURNEY_RECONNECT_DEVICE_REQUIRED","JOURNEY_RECONNECT_RIVALRY_REQUIRED"]);
  function pjrRefresh(){
    if(refreshPromise)return refreshPromise;busy=true;
    const run=pjrRefreshNow().then(value=>{lastReportedCode="";heldTransientCode="";return value;},error=>{if(pjrShowdownEnded()){heldTransientCode="";return state;}if(error?.code==="JOURNEY_RECONNECT_SUPERSEDED"){heldTransientCode="";return pjrOnline()?state:pjrOfflineHold();}if(PJR_PENDING_AUTHORITY_CODES.includes(error?.code)||error?.code==="JOURNEY_RECONNECT_CONTEXT_CHANGED"){heldTransientCode="";return pjrDropAuthority();}const code=`${String(accountApi?.getState?.()?.accountId||"")}|${String(pairingApi?.getState?.()?.deviceId||"")}|${String(pjrMarkerRivalry()||"")}|${String(error?.code||"JOURNEY_RECONNECT_FAILED")}|${String(multiApi?.lastError?.()||"")}`;if(PJR_HELD_CODES.includes(error?.code)&&code!==heldTransientCode&&code!==lastReportedCode){heldTransientCode=code;return state;}heldTransientCode="";if(code!==lastReportedCode)pjrReport("Unable to refresh Shared Journey recovery",error);lastReportedCode=code;return state;}).finally(()=>{busy=false;if(refreshPromise===run)refreshPromise=null;pjrRender();if(wakePending){wakePending=false;pjrWake();}});refreshPromise=run;return run;
  }
  // Codex #942: END landing while a refresh is in flight (busy) must not wait for that refresh: the banner and its action are
  // cleared at once and the in-flight refresh is superseded (it can no longer publish), then the usual wake follows.
  function pjrOnTerminalClose(){if(pjrShowdownEnded()){pjrGeneration+=1;pjrPublish(null);}pjrWake();}
  function pjrWake(){if(!pjrSharedMarker()||root.document?.visibilityState==="hidden")return;if(busy){wakePending=true;return;}void pjrRefresh();}
  function pjrInstall(){
    // r75: an ordinary startup with no Shared Journey loads none of the recovery runtime (Remote Joining stays unloaded);
    // the first wake that finds the shared marker loads it through pjrRefreshNow.
    if(installed)return true;installed=true;if(pjrSharedMarker())void pjrBootstrap().then(()=>pjrWake()).catch(error=>pjrReport("Shared Journey recovery bootstrap unavailable",error));
    root.addEventListener?.("career-mode-shared-wait-context-change",pjrWake);
    root.addEventListener?.("online",pjrWake);
    root.addEventListener?.("offline",()=>pjrOfflineHold());
    root.addEventListener?.("career-mode-shared-setup-state-change",pjrWake);
    root.addEventListener?.("career-mode-shared-season-cursor-change",pjrWake);
    root.addEventListener?.("career-mode-connected-account-state-change",pjrWake);
    root.addEventListener?.("career-mode-shared-terminal-close-state-change",pjrOnTerminalClose);
    root.document?.addEventListener?.("visibilitychange",pjrWake);
    if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.()||Date.now()>=Number(root.CareerModeSparkRemoteJoining?.getState?.()?.expiresAtEpochMs))pjrWake();},POLL_MS);
    if(typeof root.setTimeout==="function")root.setTimeout(pjrWake,0);
    return true;
  }

  return Object.freeze({
    contractVersion:1,feature:"ssjr-production-shared-journey-reconnect",productionEnabled:true,runtimeRevision:"1.9.1-r14",pollIntervalMs:POLL_MS,
    sessionAuthorityReplaceable:true,durableRivalryStatePreserved:true,expiredSessionNeverActive:true,offlineNeverAuthoritative:true,freshRuntimeRequiresReauthorization:true,
    dualManagerStatusVisible:true,canonicalStorageMutation:false,providerWriteRequired:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
    install:pjrInstall,refresh:pjrRefresh,openSessionRecovery:pjrOpenSessionRecovery,openFreshSessionCode:pjrOpenFreshSessionCode,getState:()=>state,isRecovered:()=>Boolean(state?.recovered&&state?.activeAuthorization),isBusy:()=>busy
  });
});
```

## FILE: js/productionSharedJourneyEntry.js
```js
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedJourneyEntry=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const PENDING_KEY="careerModeShowdown.sharedJourneyPending.v1";
  const PANEL_ID="productionSharedJourneyEntryOverlay";
  const SHARED_START_ID="startSharedShowdown";
  const SHARED_CONTINUE_ID="continueSharedSetupGate";
  const LOCAL_SPIN_ID="spinLeague";
  const LOCAL_CLUB_ID="openClubPack";
  let installed=false,busy=false,remoteUnsubscribe=null,identityUnsubscribe=null,remoteReturnBusy=false,renderGeneration=0;

  function activeSavedShowdown(){
    try{
      const runtime=root.CareerModeSaveLibraryRuntime;
      if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.getLibrarySnapshot!=="function")return null;
      const library=runtime.getLibrarySnapshot();
      if(!library||!library.activeSaveId||!Array.isArray(library.saves))return null;
      const entry=library.saves.find(item=>item&&item.saveId===library.activeSaveId);
      return entry&&entry.showdown||null;
    }catch(_error){return null;}
  }
  function persistedPending(){const showdown=activeSavedShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared"&&showdown.sharedJourney.setupPending===true);}
  function pending(){if(activeSavedShowdown())return persistedPending();try{return root.sessionStorage&&root.sessionStorage.getItem(PENDING_KEY)==="1";}catch(_error){return false;}}
  function presentationActive(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
  function setPending(value){try{if(root.sessionStorage){if(value)root.sessionStorage.setItem(PENDING_KEY,"1");else root.sessionStorage.removeItem(PENDING_KEY);}}catch(_error){}applyLocalDrawLock();}
  function currentSaveShell(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function normalizeCanonicalPlayers(){const showdown=currentSaveShell();if(!showdown)throw new Error("The prepared Showdown is unavailable.");showdown.name="Daniel vs Nik";showdown.managers={...(showdown.managers&&typeof showdown.managers==="object"?showdown.managers:{}),playerOne:"Daniel",playerTwo:"Nik"};return showdown;}
  function persistPendingMarker(){
    const showdown=currentSaveShell();
    if(!showdown||showdown.selectedLeague||showdown.clubs&&((showdown.clubs.playerOne)||(showdown.clubs.playerTwo))||Array.isArray(showdown.rounds)&&showdown.rounds.length)throw new Error("Career setup can be attached only before league and club selection.");
    const runtime=root.CareerModeSaveLibraryRuntime;
    if(!runtime||typeof runtime.isReady!=="function"||!runtime.isReady()||typeof runtime.saveCurrentShowdown!=="function")throw new Error("Career storage is unavailable.");
    const previous=showdown.sharedJourney;showdown.sharedJourney={contractVersion:1,mode:"shared",setupPending:true};
    if(runtime.saveCurrentShowdown()!==true){showdown.sharedJourney=previous;throw new Error("Career setup could not be saved.");}
    if(!persistedPending()){showdown.sharedJourney=previous;runtime.saveCurrentShowdown();throw new Error("Career setup could not be verified.");}
    return true;
  }
  function discardUnmarkedShell(){try{const runtime=root.CareerModeSaveLibraryRuntime;if(runtime&&typeof runtime.isReady==="function"&&runtime.isReady()&&typeof runtime.clearActiveShowdown==="function")runtime.clearActiveShowdown();}catch(_error){}}
  function create(tag,className,text){const element=root.document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=String(text);return element;}
  function report(context,error){const quota=root.CareerModeFirestoreBudget?.quotaMessage?.(error);if(quota){context="Online play is paused for today";error=Object.assign(new Error(quota),{code:"resource-exhausted"});}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else console.error(context,error);}
  function entryIdentity(){return root.CareerModeOnlinePlayerIdentity||null;}
  function entryIdentityState(){try{return entryIdentity()?.getState?.()||null;}catch(_error){return null;}}
  function entryIdentityReady(){const current=entryIdentityState();return Boolean(current&&current.status==="ready"&&current.managerId&&current.registered);}
  function syncStartButtonIdentity(){
    const start=root.document&&root.document.getElementById("startShowdown");if(!start)return false;const current=entryIdentityState(),ready=entryIdentityReady();
    const label=ready?"START A SHOWDOWN":current?.status==="choose-manager"?"CHOOSE PLAYER TO START":current?.status==="offline"?"RECONNECT TO START":current?.status==="signed-out"?"SIGN IN TO START":"CONNECT TO START";
    if(start.textContent!==label)start.textContent=label;start.title=ready?"":"Sign in and choose Daniel or Nik before starting a Showdown.";return ready;
  }
  async function loadScript(key,path,ready){if(ready())return ready();if(typeof root.loadRuntimeScript!=="function")throw new Error("Required runtime is unavailable.");await root.loadRuntimeScript(key,path,ready);return ready();}
  async function loadStyle(){if(typeof root.loadRuntimeStyle==="function")await root.loadRuntimeStyle("ssjr-entry","css/remoteJoining.css");}
  function applyLocalDrawLock(){
    const locked=pending(),presentationOwns=locked&&presentationActive();
    for(const id of [LOCAL_SPIN_ID,LOCAL_CLUB_ID]){
      const button=root.document&&root.document.getElementById(id);if(!button)continue;
      if(locked&&!presentationOwns){button.disabled=true;button.dataset.sharedJourneyLocked="true";button.setAttribute("aria-disabled","true");button.title="Both players must be connected before this step.";}
      else if(button.dataset.sharedJourneyLocked==="true"){button.disabled=false;delete button.dataset.sharedJourneyLocked;button.removeAttribute("aria-disabled");button.removeAttribute("title");}
    }
    const wheel=root.document&&root.document.querySelector("#leagueWheelScreen .wheelContainer");
    if(wheel){
      let resume=root.document.getElementById(SHARED_CONTINUE_ID);
      if(locked&&!presentationOwns&&!resume){resume=create("button","menuButton","CONTINUE CAREER");resume.id=SHARED_CONTINUE_ID;resume.type="button";resume.addEventListener("click",()=>void continueFromLockedWheel());wheel.insertBefore(resume,wheel.querySelector(".backButton")||null);}
      if((!locked||presentationOwns)&&resume)resume.remove();
      let note=root.document.getElementById("sharedJourneyLeagueLockNote");
      if(locked&&!presentationOwns&&!note){note=create("p","stateNote","Connect Daniel and Nik to pick the league.");note.id="sharedJourneyLeagueLockNote";wheel.insertBefore(note,wheel.firstChild);}
      if((!locked||presentationOwns)&&note)note.remove();
    }
  }
  async function ensureSaveAuthority(){
    await loadScript("save-library-cutover","js/saveLibraryCutover.js",()=>typeof root.ensureSaveLibraryRuntimeAuthority==="function");
    await root.ensureSaveLibraryRuntimeAuthority();
    if(typeof root.ensureGameplayModules!=="function")throw new Error("Gameplay runtime is unavailable.");
    await root.ensureGameplayModules();
  }
  // r79: the pair names the Showdown it last saw CLOSED (finished, or deleted on Daniel's phone) and that Showdown's save.
  function activeSaveIsClosedShowdown(runtime){
    try{
      const pair=root.CareerModePersistentNikDanielPair?.getState?.(),closed=pair&&pair.closedProviderSaveId;
      if(!pair||pair.rivalryId||!/^pair_[0-9a-f]{64}$/.test(String(pair.closedRivalryId||""))||typeof closed!=="string"||!/^save_[0-9a-f]{24}$/.test(closed))return false;
      return runtime.getLibrarySnapshot?.()?.activeSaveId===closed;
    }catch(_error){return false;}
  }
  async function provisionJoinerShell(totalRounds){
    const rounds=Number(totalRounds);
    if(![1,3,5,10].includes(rounds))throw new Error("Daniel's connection code does not contain a valid season length.");
    await ensureSaveAuthority();
    const runtime=root.CareerModeSaveLibraryRuntime;
    if(!runtime?.isReady?.())throw new Error("Career storage is unavailable.");

    const existing=activeSavedShowdown();
    const existingIsEmptyShared=Boolean(
      existing
      && existing.sharedJourney?.mode==="shared"
      && existing.sharedJourney?.setupPending===true
      && !existing.selectedLeague
      && !existing.clubs?.playerOne
      && !existing.clubs?.playerTwo
      && (!Array.isArray(existing.rounds)||existing.rounds.length===0)
    );
    if(existingIsEmptyShared&&Number(existing.totalRounds)===rounds){
      setPending(true);
      applyLocalDrawLock();
      return true;
    }
    // r79: the save of a Showdown that is already closed (the pair names it: finished, or deleted on Daniel's phone) never blocks
    // Nik's next JOIN. The new shell is made beside it, exactly as Daniel's next START does; that save is kept, never rewritten.
    if(existing&&!activeSaveIsClosedShowdown(runtime)){
      throw new Error("You already have a different current Showdown. End it in Settings (END SHOWDOWN), then paste Daniel's code again.");
    }

    const round=root.document?.getElementById("roundAmount");
    if(!round)throw new Error("Season setup is unavailable.");
    const prior=round.value;
    let created=false,marked=false;
    try{
      round.value=String(rounds);
      setPending(true);
      if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
      created=Boolean(await root.createShowdown());
      if(!created)throw new Error("Nik's career could not be prepared.");
      normalizeCanonicalPlayers();
      persistPendingMarker();
      marked=true;
      if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);
      applyLocalDrawLock();
      return true;
    }catch(error){
      if(created&&!marked)discardUnmarkedShell();
      setPending(false);
      throw error;
    }finally{
      round.value=prior;
    }
  }

  async function currentPairStateForFreshStart(){
    const identity=root.CareerModeOnlinePlayerIdentity;
    if(!identity||typeof identity.syncPair!=="function")throw new Error("The current Showdown connection service is unavailable.");
    const first=await identity.syncPair();
    const next=!first||first.status==="unavailable"?await identity.syncPair():first;
    if(!next)throw new Error("The current Showdown connection could not be verified.");
    return next;
  }
  // r79: START never offers to close a live Showdown (closing stays in Settings). It asks whichShowdownIsLive instead: a live
  // game continues, Daniel's code already out (or his seasons chosen with no code yet) reopens WAITING, a fresh start creates the
  // shell, and Nik is never given a shell of his own here (he JOINs). Pair authority that cannot be read fails closed.
  async function whichShowdownIsLive(pairState=null){
    const which=await loadScript("which-showdown","js/whichShowdownIsLive.js",()=>root.CareerModeWhichShowdownIsLive);
    if(!which||typeof which.read!=="function")throw new Error("Showdown start is unavailable.");
    const decision=await which.read(root,pairState?{pair:pairState}:{});
    if(decision.reason==="pair-unknown")throw new Error("The current Showdown connection could not be verified. Try again before starting a new Showdown.");
    return decision;
  }
  // Codex #904 (P1): createShowdown() shows the locked league wheel at once, so on a cold cache WAITING's script, stylesheet and
  // plate are made ready first (alongside START's own checks, while the seasons screen and its disabled START stay up); openWaiting
  // then covers the wheel in the same task as the route change. Files only, no Firestore read. A failure here is left to
  // openWaiting, which reports it as before.
  function prepareWaiting(){
    return (async()=>{
      await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
      const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);
      if(layer&&typeof layer.prepare==="function")await layer.prepare();
      return true;
    })().catch(()=>false);
  }
  // WAITING: the Connect Players layer over the locked league wheel (no trip back to Home). With createCode the pair code is made
  // here, once, from the shell START just prepared; Daniel no longer taps CREATE CODE FOR NIK. A layer that cannot open falls back
  // to GET READY.
  async function openWaiting(options={}){
    closePanel();
    try{
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
      const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);
      if(!pair||typeof pair.startPairing!=="function"||!layer||typeof layer.open!=="function")throw new Error("Player connection is unavailable.");
      // A new code that replaces an older open one is begun while the layer
      // opens, so WAITING shows "Preparing your Showdown…" and then the new code, never the old code in between.
      const opening=layer.open({sync:false,stayOnScreen:true});Promise.resolve(opening).catch(()=>{});
      if(!(options.createCode===true&&pair.getState?.()?.connectionState==="pending-pair"))await opening;
      if(options.createCode===true)await pair.startPairing({managerRole:"playerOne"});
      await opening;
      pair.render?.();
      return true;
    }catch(error){report("Unable to open the waiting screen",error);await openPanel({routeToRemote:false});return false;}
  }
  // PR #901 P2: CONTINUE CAREER on the locked league wheel (shown once WAITING is closed with BACK or Escape) asks the same
  // question START asks, so it reopens WAITING over the wheel (same stayOnScreen path) instead of the old GET READY overlay.
  let lockedWheelContinuePromise=null;
  function continueFromLockedWheel(){
    if(lockedWheelContinuePromise)return lockedWheelContinuePromise;
    lockedWheelContinuePromise=(async()=>{
      try{const decision=await whichShowdownIsLive();if(decision.action==="new")return openWaiting({createCode:false});return await followStartDecision(decision);}
      catch(error){report("Unable to continue the Showdown",error);return openWaiting({createCode:false});}
    })().finally(()=>{lockedWheelContinuePromise=null;});
    return lockedWheelContinuePromise;
  }
  // Nik's call (2026-10-17): Daniel's START on a Showdown that has ENDED but was never CLOSED closes it for both managers through
  // exactly the final-screen terminal close (it requires the final reconciliation, i.e. history saved first, and one exact ACTIVE
  // private session; same writes, same guards), then opens the seasons screen. Nothing is created unless the close succeeded; a
  // close that cannot happen stops on the existing Connect Players / CHECK STATUS path with the reason.
  // r87 Rematch (js/onlinePlayerIdentity.js openRematch): followStartDecision(decision,{openSeasons:false}) does everything up to the
  // seasons screen and answers "seasons" instead of opening it; the caller then opens that screen with the length preset.
  let seasonsHandOff=false;
  let closeEndedPromise=null;
  function closeEndedThenNew(){
    if(closeEndedPromise)return closeEndedPromise;
    closeEndedPromise=(async()=>{
      let state=null,result=null;
      let pair=null;
      try{
        // Loaded first so its CLOSED listener hears this close (Codex #904: it is let go right after, below).
        pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
        const close=await loadScript("ssjr-production-terminal-close","js/productionSharedTerminalClose.js",()=>root.CareerModeProductionSharedTerminalClose);
        if(!close||typeof close.refresh!=="function"||typeof close.close!=="function")throw new Error("Showdown close is unavailable.");
        close.install?.();
        state=close.getState?.()||null;
        if(!state||state.phase!=="CLOSED")state=await close.refresh();
        if(state&&state.phase==="READY")result=await close.close();
        else if(state&&state.phase==="RECOVERY_PENDING"&&typeof close.retry==="function")result=await close.retry();
        if(close.getState?.()?.phase!=="CLOSED"&&result?.ok!==true){
          throw new Error(state&&state.phase==="BLOCKED"
            ?"This Showdown has ended. It closes when Daniel and Nik are both connected; nothing new was started."
            :(result&&result.message)||"This Showdown has ended but could not be closed. Nothing new was started.");
        }
      }catch(error){report("Unable to close the ended Showdown",error);await openPersistentPairControls();return false;}
      // Codex #904 (P2): the pair keeps a CLOSED rivalry until Home is shown (the final screen still runs on it). This path leaves
      // for the seasons screen instead, so it lets the closed Showdown go now; otherwise START there would find it live again and
      // reopen the same screen. No read, no write.
      try{pair?.settleOnHome?.();}catch(_error){}
      const opened=seasonsHandOff?"seasons":typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");
      return opened==="seasons"?opened:opened!==false;
    })().finally(()=>{closeEndedPromise=null;});
    return closeEndedPromise;
  }
  // Markerless waiting codes belong to the retired path. A real START closes them before writing the boundary.
  async function needsCareerStart(decision){
    if(!decision||decision.action!=="resume-waiting"||entryIdentityState()?.managerId!=="daniel")return false;
    try{
      const modes=await loadScript("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);
      modes?.install?.();return (await modes?.resolve?.())?.careerStarted===false;
    }catch(_error){return false;}
  }
  async function openSeasonsForRealStart(){
    closePanel();
    const opened=seasonsHandOff?"seasons":typeof root.navigateTo==="function"?await root.navigateTo("createShowdown"):root.showScreen?.("createShowdown");
    return opened==="seasons"?opened:opened!==false;
  }
  async function followStartDecision(decision,options){
    if(options&&options.openSeasons===false){seasonsHandOff=true;try{return await followStartDecision(decision);}finally{seasonsHandOff=false;}}
    if(!decision)return false;
    if(decision.action==="resume-waiting"&&await needsCareerStart(decision))return openSeasonsForRealStart();
    if(decision.action==="close-then-new")return closeEndedThenNew();
    if(decision.action==="continue"){
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair);
      if(!pair||typeof pair.continuePair!=="function")throw new Error("Career continue is unavailable.");
      // PR #901: continuePair() reports a failure in its returned state (error / recovery-required) instead of rejecting, so a
      // failed continue reopens Connect Players with that state (TRY CONTINUE AGAIN / RESTORE BACKUP) like the auto-continue
      // fallback does, instead of rendering into a hidden panel. Nothing is created.
      const next=await pair.continuePair();
      if(next&&next.busy!==true&&next.status!=="paired"){
        report("Unable to continue the Showdown",Object.assign(new Error(next.message||"The career could not be opened."),{code:next.status}));
        try{const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer?.open?.({sync:false,stayOnScreen:true});pair.render?.();}
        catch(_error){await openPersistentPairControls();}
        return false;
      }
      return true;
    }
    if(decision.action==="resume-waiting")return openWaiting({createCode:!decision.rivalryId});
    const identity=entryIdentity();
    if(identity&&typeof identity.openJoin==="function"){await identity.openJoin({pair:decision.pair||null,decision});return true;}
    await openPersistentPairControls();return true;
  }
  async function startShared(options={}){
    if(busy)return false;
    if(!entryIdentityReady()){
      const identity=entryIdentity();syncStartButtonIdentity();
      if(identity&&typeof identity.openGate==="function"){identity.openGate();return false;}
      root.showAppNotice?.("Sign in and choose Daniel or Nik before starting a Showdown.","error",6000);return false;
    }
    busy=true;const button=root.document.getElementById(SHARED_START_ID)||root.document.getElementById("startShowdown");if(button)button.disabled=true;
    const round=root.document.getElementById("roundAmount"),priorRound=round?round.value:null;let shellCreated=false,markerPersisted=false;
    try{
      const waitingReady=prepareWaiting();await ensureSaveAuthority();
      const decision=await whichShowdownIsLive(),realStart=await needsCareerStart(decision);
      if(decision.action!=="new"&&!realStart){await followStartDecision(decision);return false;}
      // Persist the career boundary before a new Showdown; a refusal creates nothing.
      if(options&&typeof options.beforeCreate==="function"&&await options.beforeCreate()!==true)return false;
      setPending(true);
      if(typeof root.createShowdown!=="function")throw new Error("Showdown preparation is unavailable.");
      await waitingReady;const created=await root.createShowdown();shellCreated=Boolean(created);if(!created)throw new Error("The Showdown could not be prepared.");
      normalizeCanonicalPlayers();persistPendingMarker();markerPersisted=true;applyLocalDrawLock();await openWaiting({createCode:true});return true;
    }catch(error){if(shellCreated&&!markerPersisted)discardUnmarkedShell();setPending(false);report("Unable to prepare Showdown",error);return false;}
    finally{if(round&&priorRound!==null)round.value=priorRound;if(button)button.disabled=false;busy=false;syncStartButtonIdentity();}
  }
  async function openPersistentPairControls(){
    closePanel();
    try{
      const pair=await loadScript("persistent-pair","js/persistentNikDanielPair.js",()=>root.CareerModePersistentNikDanielPair),identity=root.CareerModeOnlinePlayerIdentity;
      if(!pair||typeof pair.render!=="function"||!identity||typeof identity.syncPair!=="function")throw new Error("Player connection controls are unavailable.");
      const layer=await loadScript("connect-players-screen","js/connectPlayersScreenV10.js",()=>root.CareerModeConnectPlayersScreenV10);await layer.open({sync:false});
      const first=await identity.syncPair(),next=!first||first.status==="unavailable"?await identity.syncPair():first;
      if(!next||next.status==="unavailable")throw new Error("Player connection controls are temporarily unavailable.");
      pair.render();
      const panel=root.document.getElementById("persistentNikDanielPairPanel");if(!panel)throw new Error("Player connection controls could not be opened.");
      panel.scrollIntoView?.({block:"center"});panel.querySelector("button,input")?.focus?.();
    }catch(error){report("Unable to open player connection setup",error);}
  }
  async function remoteState(){
    try{await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);const remote=root.CareerModeSparkRemoteJoining;return remote&&typeof remote.getState==="function"?remote.getState():null;}catch(_error){return null;}
  }
  function disarmRemoteReturn(){if(typeof remoteUnsubscribe==="function")remoteUnsubscribe();remoteUnsubscribe=null;}
  function armRemoteReturn(remote){
    disarmRemoteReturn();if(!remote||typeof remote.subscribe!=="function"||!pending())return false;
    const onState=next=>{
      if(!pending()||remoteReturnBusy||!next||next.sessionState!=="active"||next.pendingAction!=null)return;
      // Job 33 (R6): an ACTIVE private session continues straight into the Showdown (league wheel, Career Start or the
      // current season); openSharedExperience shows GET READY again if that fails. An expired session never auto-continues.
      // Codex P1 on #358: Remote Joining keeps its last ACTIVE session in page memory, so after a new Showdown (no reload) it can
      // still belong to the previous rivalry. Only a session bound to the current account, device and rivalry auto-continues.
      if(!remoteBoundToAuthority(next,root.CareerModeSparkConnectedAccount?.getState?.(),root.CareerModeSparkPrivatePairing?.getState?.(),root.CareerModeSparkConnectedRivalry?.getState?.()))return;
      remoteReturnBusy=true;disarmRemoteReturn();
      Promise.resolve().then(async()=>{if(typeof remote.closePanel==="function")remote.closePanel();await openSharedExperience();}).catch(error=>report("Unable to continue the Showdown after connection",error)).finally(()=>{remoteReturnBusy=false;});
    };
    remoteUnsubscribe=remote.subscribe(onState);if(typeof remote.getState==="function")onState(remote.getState());return true;
  }
  // Studio Z3: a one-bit "this tab is in a game" flag (never the session itself). After a refresh the identity module sees
  // it and taps CONTINUE CAREER for the player, which re-attaches through the pair's session pointer.
  const LIVE_GAME_KEY="careerModeShowdown.liveGame.v1";let liveGameWatch=null;
  function markLiveGame(remote){
    if(liveGameWatch||!remote||typeof remote.subscribe!=="function")return;
    const apply=next=>{try{if(!root.sessionStorage||!next)return;if(["open","active"].includes(next.sessionState))root.sessionStorage.setItem(LIVE_GAME_KEY,"1");else if(["closed","revoked","expired"].includes(next.sessionState))root.sessionStorage.removeItem(LIVE_GAME_KEY);}catch(_error){}};
    liveGameWatch=remote.subscribe(apply);apply(typeof remote.getState==="function"?remote.getState():null);
  }
  async function openRemote(){
    closePanel();
    try{
      await Promise.all([loadStyle(),loadScript("rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining)]);
      const remote=root.CareerModeSparkRemoteJoining;if(!remote||typeof remote.openPanel!=="function")throw new Error("Player connection is unavailable.");
      // Studio Z3/Z4: connect by itself (this tab's session after a refresh, else the pair's shared session); no typed code.
      const auto=typeof remote.autoConnect==="function"?remote.autoConnect():null;await remote.openPanel();armRemoteReturn(remote);markLiveGame(remote);if(auto)void auto;
    }catch(error){disarmRemoteReturn();report("Unable to connect the players",error);}
  }
  async function confirmedSetupSnapshot(){
    try{
      await loadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
      const setup=root.CareerModeProductionSharedShowdownSetup;
      if(!setup||typeof setup.refresh!=="function"||typeof setup.getState!=="function")return null;
      await setup.refresh();const snapshot=setup.getState();
      return snapshot&&snapshot.ready===true&&snapshot.setup&&snapshot.setup.phase==="SHOWDOWN_CONFIRMED"&&snapshot.setup.revision===6?snapshot:null;
    }catch(_error){return null;}
  }
  async function openCareerStart(){
    await loadScript("ssjr-production-career-start","js/productionSharedCareerStart.js",()=>root.CareerModeProductionSharedCareerStart);
    const career=root.CareerModeProductionSharedCareerStart;if(!career||typeof career.openPanel!=="function")throw new Error("Career Start is unavailable.");
    await career.openPanel();return true;
  }
  // Job 19: a fresh runtime (reload) re-establishes the exact ACTIVE session and then resumes at the
  // provider-authoritative active season instead of replaying Career Start and season 1.
  async function resumeSeasonResults(resumed){
    const confirmed=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(!confirmed||confirmed.ready!==true)return false;
    const season=Number(resumed.season),role=confirmed.managerRole,rivalryId=confirmed.rivalryId;
    if(resumed.terminal===true||!rivalryId||!role||!Number.isInteger(season)||season<1)return false;
    // A hint selects a possible route, never gameplay authority. Missing/unavailable storage keeps the full-screen fallback.
    let hint=null;try{hint=root.readStorageValue?.(`cms.transferViews.v1:${rivalryId}:${season}:${role}`);}catch(_error){}
    if(!hint)return false;
    await loadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    const transfer=root.CareerModeProductionSharedTransferChallenge;await transfer.refresh();
    if(!transfer.canResumeResults())return false;
    transfer.install();
    await loadScript("ssjr-production-season-results-route","js/productionSharedSeasonResultsRoute.js",()=>root.CareerModeProductionSharedSeasonResultsRoute);
    const route=root.CareerModeProductionSharedSeasonResultsRoute;route.install();return route.open();
  }
  async function resumeAcceptedSeason(){
    await loadScript("ssjr-production-multi-season","js/productionSharedMultiSeasonProgression.js",()=>root.CareerModeProductionSharedMultiSeasonProgression);
    const progression=root.CareerModeProductionSharedMultiSeasonProgression;
    if(!progression||typeof progression.resumeFromAuthority!=="function")return false;
    progression.install?.();
    const resumed=await progression.resumeFromAuthority();
    if(!resumed||!Number.isInteger(resumed.acceptedSeasons)||resumed.acceptedSeasons<0)return false;
    // The Results route is a nicer landing, never a new way to fail: any error here keeps the existing fallback.
    let routed=false;try{routed=await resumeSeasonResults(resumed);}catch(_error){}
    if(routed)return true;
    if(resumed.acceptedSeasons<1)return false;
    if(typeof root.navigateTo==="function")await root.navigateTo("dashboard",{addToHistory:false,allowCanonicalFallback:true});else if(typeof root.showScreen==="function")await root.showScreen("dashboard",false);
    progression.decorateDashboard?.();
    return true;
  }
  async function openSharedExperience(){
    closePanel();
    try{
      await ensureSaveAuthority();
      const confirmed=await confirmedSetupSnapshot();
      if(confirmed&&await resumeAcceptedSeason()){applyLocalDrawLock();return true;}
      if(confirmed){await openCareerStart();applyLocalDrawLock();return true;}
      await loadScript("ssjr-polished-presentation","js/productionSharedShowdownPresentation.js",()=>root.CareerModeProductionSharedShowdownPresentation);
      const presentation=root.CareerModeProductionSharedShowdownPresentation;if(!presentation||typeof presentation.activate!=="function")throw new Error("Showdown presentation is unavailable.");
      await presentation.activate();applyLocalDrawLock();return true;
    }catch(error){report("Unable to enter the Showdown",error);await openPanel({routeToRemote:false});return false;}
  }
  function remoteBoundToAuthority(remote,account,pairing,rivalry){return Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&rivalry.rivalryId&&remote.rivalryId===rivalry.rivalryId&&account&&account.accountId&&remote.accountId===account.accountId&&pairing&&pairing.deviceId&&remote.deviceId===pairing.deviceId&&Number.isFinite(remote.expiresAtEpochMs)&&Date.now()<remote.expiresAtEpochMs);}
  async function statusSnapshot(){
    let account=null,pairing=null,rivalry=null,remote=null;
    try{
      await Promise.all([loadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime),loadScript("spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount)]);
      const connected=root.CareerModeSparkConnectedAccount;if(connected&&typeof connected.initialize==="function")await connected.initialize();account=connected&&connected.getState?connected.getState():null;
      if(account&&account.connected){
        await Promise.all([loadScript("pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing),loadScript("rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry)]);
        const pairingApi=root.CareerModeSparkPrivatePairing;if(pairingApi&&pairingApi.initialize)await pairingApi.initialize();pairing=pairingApi&&pairingApi.getState?pairingApi.getState():null;
        const rivalryApi=root.CareerModeSparkConnectedRivalry;if(rivalryApi&&rivalryApi.initialize)await rivalryApi.initialize();rivalry=rivalryApi&&rivalryApi.getState?rivalryApi.getState():null;
      }
      remote=await remoteState();
    }catch(_error){}
    const active=Boolean(remote&&remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&rivalry&&remote.rivalryId===rivalry.rivalryId&&account&&remote.accountId===account.accountId&&pairing&&remote.deviceId===pairing.deviceId&&Number.isFinite(remote.expiresAtEpochMs)&&Date.now()<remote.expiresAtEpochMs);
    return Object.freeze({accountReady:Boolean(account&&account.connected),deviceReady:Boolean(pairing&&pairing.registered),rivalryReady:Boolean(rivalry&&rivalry.attached&&rivalry.rivalryId),active});
  }
  function row(label,value){const item=create("div","settingsInfoRow");item.append(create("span","",label),create("strong","",value));return item;}
  async function renderPanel(options={}){
    const generation=++renderGeneration,overlay=root.document.getElementById(PANEL_ID);if(!overlay)return false;const body=overlay.querySelector(".remoteJoiningBody");if(!body)return false;
    const status=options.status||await statusSnapshot();if(generation!==renderGeneration)return false;
    if(routesToRemote(status,options)){await openRemote();return false;}
    const confirmed=status.active?await confirmedSetupSnapshot():null;if(generation!==renderGeneration)return false;
    body.replaceChildren();body.append(create("span","remoteJoiningEyebrow","CAREER MODE SHOWDOWN"),create("h2","","GET READY"),create("p","","Connect Daniel and Nik before the career starts."));
    const grid=create("div","settingsInfoGrid");
    grid.append(row("ACCOUNT",status.accountReady?"READY":"REQUIRED"),row("THIS BROWSER",status.deviceReady?"READY":"REQUIRED"),row("DANIEL + NIK",status.rivalryReady?"CONNECTED":"CONNECT"),row("CAREER",status.active?"READY":"WAITING"));body.append(grid);
    const actions=create("div","remoteJoiningActions");
    const save=create("button","compactButton",status.rivalryReady?"REVIEW CONNECTION":"CONNECT PLAYERS");save.type="button";save.addEventListener("click",()=>void openPersistentPairControls());actions.append(save);
    const remote=create("button","compactButton",status.active?"CONNECTED":"CONTINUE");remote.type="button";remote.disabled=!status.rivalryReady;remote.addEventListener("click",()=>void openRemote());actions.append(remote);
    const setup=create("button","compactButton",status.active?"START CAREER":"WAITING FOR BOTH PLAYERS");setup.type="button";setup.disabled=!status.active;setup.addEventListener("click",()=>void openSharedExperience());actions.append(setup);
    const refresh=create("button","compactButton","REFRESH");refresh.type="button";refresh.addEventListener("click",()=>void renderPanel());actions.append(refresh);body.append(actions);
    const note=create("p","remoteJoiningStatus",status.active?(confirmed?"Ready. Continue to Career Start.":"Ready. Continue when both players are set."):"Both players must be connected before league and club selection.");note.setAttribute("role","status");note.setAttribute("aria-live","polite");body.append(note);return true;
  }
  // Job 33 (R5b): connected players without an ACTIVE private session go straight to Remote Joining instead of
  // waiting on GET READY for a CONTINUE tap. GET READY still shows before pairing, once the session is ACTIVE, and
  // after a failed Showdown entry (routeToRemote:false), so it never bounces between the two overlays.
  function routesToRemote(status,options){return Boolean(options.routeToRemote!==false&&status&&status.rivalryReady&&!status.active);}
  async function openPanel(options={}){
    await loadStyle();applyLocalDrawLock();
    const status=options.routeToRemote===false?null:await statusSnapshot();
    if(routesToRemote(status,options)){await openRemote();return true;}
    // r80 resume (G7): continuing a Showdown whose private session this page already holds ACTIVE (Home START / CONTINUE CAREER
    // after going Home from the game) enters the game exactly as a reload does once Remote Joining is ACTIVE again
    // (armRemoteReturn: openSharedExperience), instead of GET READY, whose START CAREER replayed Career Start. GET READY stays
    // the fallback when that entry fails (routeToRemote:false) and for every other caller.
    if(options.resumeActive===true&&status&&status.active){closePanel();await openSharedExperience();return true;}
    let overlay=root.document.getElementById(PANEL_ID);
    if(!overlay){overlay=create("div","remoteJoiningOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Career Mode Showdown entry");const shell=create("div","remoteJoiningShell"),header=create("div","remoteJoiningHeader");header.append(create("strong","","CAREER MODE SHOWDOWN // 17"));const dismiss=create("button","remoteJoiningDismiss","×");dismiss.type="button";dismiss.setAttribute("aria-label","Close career entry");dismiss.addEventListener("click",closePanel);header.append(dismiss);const body=create("div","remoteJoiningBody");shell.append(header,body);overlay.append(shell);root.document.body.append(overlay);}
    // JOB-1015: the entry card replaces an open Connect Players layer instead of opening underneath it.
    root.CareerModeConnectPlayersScreenV10?.close?.({restoreFocus:false});
    overlay.classList.remove("hidden");await renderPanel({...options,status});return true;
  }
  function closePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay)overlay.classList.add("hidden");return true;}
  async function seasonsStartGate(){
    try{
      const modes=await loadScript("showdown-modes","js/showdownModes.js",()=>root.CareerModeShowdownModes);
      if(modes&&typeof modes.beforeSeasonsStart==="function"){modes.install?.();return await modes.beforeSeasonsStart()===true;}
    }catch(_error){}
    report("Unable to start the Showdown",new Error("Your career could not be checked, so nothing was started. Check your internet, then press START again."));
    return false;
  }
  function installStartButton(){
    const start=root.document.getElementById("startShowdown");if(!start)return false;
    syncStartButtonIdentity();
    if(start.dataset.canonicalShowdownStart==="true")return true;
    start.dataset.canonicalShowdownStart="true";
    // The fallback START uses the same real-career gate as the identity entry.
    start.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();void startShared({beforeCreate:seasonsStartGate});},true);
    const duplicate=root.document.getElementById(SHARED_START_ID);if(duplicate)duplicate.remove();
    const note=root.document.getElementById("sharedShowdownOrderingNote");if(note)note.remove();
    return true;
  }
  // Job 19: the shared marker is a permanent local-draw lock, so it cannot decide alone whether GET READY
  // should open after a reload. Durable pair authority decides: a pre-pair shell still opens GET READY;
  // an ACTIVE pair resumes through the single CONTINUE CAREER action; a CLOSED Showdown never re-opens it.
  const AUTO_OPEN_IDENTITY_WAIT_MS=15000;
  function settledIdentity(){
    if(entryIdentityReady())return Promise.resolve(true);
    const identity=entryIdentity();if(!identity||typeof identity.subscribe!=="function")return Promise.resolve(false);
    return new Promise(resolve=>{let done=false,unsubscribe=null;const finish=value=>{if(done)return;done=true;try{unsubscribe?.();}catch(_error){}resolve(value);};unsubscribe=identity.subscribe(()=>{if(entryIdentityReady())finish(true);});setTimeout(()=>finish(entryIdentityReady()),AUTO_OPEN_IDENTITY_WAIT_MS);if(entryIdentityReady())finish(true);});
  }
  function pairAlreadyEstablished(pairState){if(!pairState)return false;if(pairState.rivalryId&&(pairState.connectionState==="active"||pairState.connectionState==="closed"))return true;return Boolean(pairState.status==="unpaired"&&!pairState.rivalryId&&/^pair_[0-9a-f]{64}$/.test(String(pairState.closedRivalryId||""))&&closedRivalryOwnsActiveShell(pairState));}
  // PR #901 (as whichShowdownIsLive): a closed rivalry only counts against the save it was bound to, so a fresh shell made after an
  // older closed Showdown still reopens WAITING over the wheel on reload; only the closed Showdown's own shell stays shut.
  function closedRivalryOwnsActiveShell(pairState){
    const closed=pairState&&pairState.closedProviderSaveId;if(typeof closed!=="string"||!/^save_[0-9a-f]{24}$/.test(closed))return false;
    try{const library=root.CareerModeSaveLibraryRuntime?.getLibrarySnapshot?.();return Boolean(library&&library.activeSaveId===closed);}catch(_error){return false;}
  }
  async function autoOpenAfterLoad(){
    if(!pending())return false;
    let pairState=null;
    try{if(await settledIdentity()){const known=root.CareerModePersistentNikDanielPair?.getState?.();pairState=known&&known.initialized===true&&known.busy!==true&&(known.rivalryId||known.closedRivalryId)?known:await currentPairStateForFreshStart();}}catch(_error){pairState=null;}
    // Only a positively observed pre-pair state reopens anything; unresolved authority (offline, timeout, error) keeps it closed.
    if(!pairState||!["unpaired","waiting"].includes(pairState.status)||pairAlreadyEstablished(pairState))return false;
    if(!pending())return false;
    // r79: a pending pre-pair shell reopens WAITING for Daniel (his code, or the code made now from his chosen seasons) and JOIN
    // for Nik. GET READY stays only as the fallback when neither applies or the decision cannot be made.
    let decision=null;try{decision=await whichShowdownIsLive(pairState);}catch(_error){decision=null;}
    // An older closed Showdown is remembered: only Daniel's fresh code-less shell (resume-waiting) reopens; nothing else (no GET READY).
    if(/^pair_[0-9a-f]{64}$/.test(String(pairState.closedRivalryId||""))&&!pairState.rivalryId&&!(decision&&decision.action==="resume-waiting"))return false;
    // PR #901: reload recovery puts Daniel's WAITING back over the locked league wheel (startup leaves Home active), so closing it
    // shows the wheel and its CONTINUE CAREER, not Home. The loading screen is held until this settles (js/ssjr.js, Reus Gate).
    // A markerless old code waits for an explicit real START.
    if(decision&&decision.action==="resume-waiting"&&await needsCareerStart(decision))return false;
    if(decision&&decision.action==="resume-waiting")await showLockedWheel();
    if(decision&&["resume-waiting","join","wait-for-daniel"].includes(decision.action))return followStartDecision(decision);
    return openPanel();
  }
  // Right after a reload the saved shell is not loaded yet (currentShowdown is null) and the wheel route falls back to Home (seen
  // in a real browser), so the saved shell is resumed first, exactly as Home's CONTINUE does: its canonical route is the wheel.
  function loadedShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  async function showLockedWheel(){
    try{
      if(!loadedShowdown()&&typeof root.resumeSavedShowdown==="function"){await ensureSaveAuthority();if(typeof root.loadSavedShowdown==="function"&&root.loadSavedShowdown())await root.resumeSavedShowdown();}
      if(root.getActiveScreenName?.()!=="leagueWheelScreen"){if(typeof root.navigateTo==="function")await root.navigateTo("leagueWheelScreen",{addToHistory:false});else root.showScreen?.("leagueWheelScreen");}
    }catch(error){report("Unable to reopen the league screen",error);}
    applyLocalDrawLock();
  }
  // The startup hold is kept only while this recovery can still end on the wheel: a player who is signed out, offline or still
  // choosing (anything but a restoring or ready identity) releases it at once, and js/ssjr.js bounds it anyway.
  let startupResumePromise=null,releaseStartupHold=null;
  function startupHoldWorthKeeping(){const current=entryIdentityState();return !current||entryIdentityReady()||["idle","connecting","signing-in","saving-manager"].includes(current.status);}
  function startStartupResume(){
    startupResumePromise=new Promise(resolve=>{releaseStartupHold=()=>resolve(true);});
    const identity=entryIdentity();let unsubscribe=null;const watch=()=>{if(!startupHoldWorthKeeping())releaseStartupHold();};
    try{unsubscribe=typeof identity?.subscribe==="function"?identity.subscribe(watch):null;}catch(_error){unsubscribe=null;}watch();
    setTimeout(()=>void autoOpenAfterLoad().catch(error=>report("Unable to open career entry",error)).finally(()=>{releaseStartupHold();try{unsubscribe?.();}catch(_error){}}),0);
  }
  function install(){if(installed)return true;installed=true;installStartButton();applyLocalDrawLock();const identity=entryIdentity();if(identity&&typeof identity.subscribe==="function")identityUnsubscribe=identity.subscribe(()=>syncStartButtonIdentity());const observer=new MutationObserver(()=>{installStartButton();applyLocalDrawLock();});observer.observe(root.document.documentElement,{childList:true,subtree:true});if(pending())startStartupResume();return true;}

  return Object.freeze({contractVersion:7,feature:"ssjr-production-paired-first-entry",startOpensWaitingOverLeagueWheel:true,startNeverOffersToCloseLiveShowdown:true,connectedPairOpensRemoteJoiningDirectly:true,activeSessionContinuesIntoShowdown:true,productionEnabled:true,singleProductEntry:true,pairingBeforeLeagueClub:true,activeSessionBeforeLeagueClub:true,peerActiveReturnToSharedEntry:true,bothDevicesPrepareSharedShell:true,joinerShellProvisionedAutomatically:true,continueCareerUsesPairedAuthority:true,polishedLeagueWheelAfterAuthority:true,polishedClubPacksAfterAuthority:true,confirmedSetupResumesAtCareerStart:true,acceptedSeasonResumesAtActiveSeason:true,establishedPairNeverAutoOpensEntry:true,closedShowdownNeverReopensEntry:true,engineeringSetupPanelPlayerFacing:false,persistedSaveMarker:true,canonicalLocalSaveMutationDuringSharedSetup:false,billingRequired:false,install,preparePairingShell:startShared,provisionJoinerShell,openWaiting,followStartDecision,closeEndedThenNew,continueFromLockedWheel,startupResume:()=>startupResumePromise,openPanel,closePanel,openSharedExperience,isPending:pending});
});

```
