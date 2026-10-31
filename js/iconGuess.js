(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconGuess=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // r88 Icon Unmasked (working name; Nik 2026-10-31, spec project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md):
  // once a season, after Roster Roulette and before the transfer window, both managers race to name a male outfield Legend
  // or Icon from a card that reveals itself: the position, then the six face stats one at a time in random order, then the
  // nation flag. Each manager has two guesses; the first right guess the server records wins 1 Showdown point; nobody by
  // the end of the flag window is a draw.
  //
  // This module is the round logic only, with no IO, no clock and no randomness of its own:
  //  - the draw: which icon each season and the stat order, read from the Showdown's own id like js/marqueePlayer.js and
  //    js/rosterRoulette.js, so both phones agree with zero reads or writes, and no icon repeats in one Showdown;
  //  - the reveal clock: which beat is showing at a given server time, from the round's server start time;
  //  - the round record: the one small shared record per season round (arrivals, chips used, the winner). applyGuess is
  //    the pure step the sync layer runs inside its transaction, so the first right guess the server records wins and
  //    phone clocks never decide it. Wrong guesses are never stored: only the chip count moves.
  // Name matching and the icon list live elsewhere (js/iconNames.js, data/icons.js); the round speaks in list indexes
  // and icon ids only.
  const RIVALRY_ID=/^pair_([0-9a-f]{64})$/;
  const ROLES=Object.freeze(["playerOne","playerTwo"]); // playerOne = Daniel, playerTwo = Nik (app-wide convention)
  const STATS=Object.freeze(["PAC","SHO","PAS","DRI","DEF","PHY"]);
  const MAX_SEASONS=10;
  const CHIPS=2;
  // Beats: 0 position, 1-6 one stat each (in statOrder), 7 the flag. Each beat is a short reveal then a guess window.
  const BEATS=8,FLAG_BEAT=7;
  const WINDOW_MS=8000,WINDOW_MIN_MS=5000,WINDOW_MAX_MS=10000;
  const REVEAL_MS=1500; // Team V brief: each reveal beat takes at most about 2 s so the guessing time stays the focus
  const LEAD_MS=3000;   // after the second manager arrives, both phones count in together before the position shows
  const RECORD_VERSION=1;
  // Nik 2026-10-31 (N1): the game runs only in Showdowns confirmed on R88 or later, like Special Player and Roster Roulette,
  // so one Showdown never mixes 11-point and 12-point seasons. ICON_FROM_MS is a placeholder that no Showdown can reach;
  // the R88 release PR pins it to the release time. Do not change it outside the release PR.
  const ICON_FROM_MS=Date.parse("2099-01-01T00:00:00Z");

  // ---------- the draw ----------
  // The id's first hex digit is the season count (js/persistentNikDanielPair.js), so it is left out: a new season must
  // never change the order already drawn.
  function igHex(rivalryId){const match=RIVALRY_ID.exec(String(rivalryId||""));return match?match[1].slice(1):null;}
  // A 32-bit stream seeded from text (xmur3 + mulberry32, as js/rosterRoulette.js): synchronous and the same on every phone.
  function igStream(text){
    let h=1779033703^text.length;
    for(let i=0;i<text.length;i+=1){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}
    let a=(()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^=h>>>16)>>>0;})();
    return ()=>{a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0);};
  }
  // Unbiased integer in [0, n) from the stream (rejection sampling keeps every icon equally likely).
  function igBelow(next,n){const limit=Math.floor(0x100000000/n)*n;let value=next();while(value>=limit)value=next();return value%n;}
  function igShuffle(items,next){
    const out=items.slice();
    for(let i=out.length-1;i>0;i-=1){const j=igBelow(next,i+1);[out[i],out[j]]=[out[j],out[i]];}
    return out;
  }
  // The Showdown's icon order: a seeded shuffle of list indexes; season n takes entry n-1, so no icon repeats. The list
  // version is part of the seed: a new list is a new order, never a silent reshuffle of the old one.
  function igOrder(rivalryId,size,listVersion=1){
    const hex=igHex(rivalryId);
    if(!hex||!Number.isInteger(size)||size<MAX_SEASONS)return null;
    return Object.freeze(igShuffle(Array.from({length:size},(_,i)=>i),igStream(`icon-v1|order|${listVersion}|${hex}`)));
  }
  // The six stats in the order they flip this season.
  function igStatOrder(rivalryId,season){
    const hex=igHex(rivalryId);
    if(!hex||!igSeason(season))return null;
    return Object.freeze(igShuffle(STATS,igStream(`icon-v1|stats|${hex}|${season}`)));
  }
  const igSeason=season=>Number.isInteger(season)&&season>=1&&season<=MAX_SEASONS;
  // {index, statOrder} for one season, or null for a bad id, season or list.
  function igDraw(rivalryId,season,size,listVersion=1){
    if(!igSeason(season))return null;
    const order=igOrder(rivalryId,size,listVersion),statOrder=igStatOrder(rivalryId,season);
    return order&&statOrder?Object.freeze({season,index:order[season-1],statOrder}):null;
  }

  // Does this Showdown play the game? confirmedAt is the shared Setup's confirm time (millis, Timestamp or Date), as
  // js/marqueePlayer.js reads it. Older Showdowns, and any without a confirm time, never play it: no error, no point.
  function igMillis(at){
    if(Number.isFinite(at))return at;
    if(at&&typeof at.toMillis==="function"){const value=at.toMillis();return Number.isFinite(value)?value:null;}
    if(at instanceof Date){const value=at.getTime();return Number.isFinite(value)?value:null;}
    return null;
  }
  function igEligible(rivalryId,confirmedAt,{fromMs=ICON_FROM_MS}={}){
    const at=igMillis(confirmedAt);
    return Boolean(igHex(rivalryId))&&at!==null&&at>=fromMs;
  }

  // ---------- the reveal clock ----------
  function igWindow(windowMs){return Number.isInteger(windowMs)&&windowMs>=WINDOW_MIN_MS&&windowMs<=WINDOW_MAX_MS?windowMs:WINDOW_MS;}
  const igPeriod=windowMs=>REVEAL_MS+igWindow(windowMs);
  // When the flag window closes: the last moment a guess counts.
  function igEndsAt(startMs,windowMs){return Number.isFinite(startMs)?startMs+BEATS*igPeriod(windowMs):null;}
  // What a phone shows at server time nowMs. phase: "waiting" (before the start), "reveal" (a beat flipping), "window"
  // (guessing open after the flip), "over" (the flag window has closed). A phone that reloads or rejoins calls this with the
  // current server time and lands on the current beat; one that missed the whole game gets "over".
  function igBeatAt(startMs,nowMs,windowMs){
    if(!Number.isFinite(startMs)||!Number.isFinite(nowMs))return null;
    const period=igPeriod(windowMs),elapsed=nowMs-startMs;
    if(elapsed<0)return Object.freeze({phase:"waiting",beat:-1,msLeft:-elapsed});
    const beat=Math.floor(elapsed/period);
    if(beat>=BEATS)return Object.freeze({phase:"over",beat:FLAG_BEAT,msLeft:0});
    const into=elapsed-beat*period;
    return into<REVEAL_MS?Object.freeze({phase:"reveal",beat,msLeft:REVEAL_MS-into}):Object.freeze({phase:"window",beat,msLeft:period-into});
  }
  // Which parts of the card are face up once beat `beat` has flipped. The overall and the name never show during play
  // (Nik 2026-10-31, N2: the overall gives the player away); only the result screen (igResultView) shows them.
  function igRevealed(beat,statOrder){
    const stats=Array.isArray(statOrder)?statOrder.slice(0,Math.max(0,Math.min(6,beat))):[];
    return Object.freeze({position:beat>=0,stats:Object.freeze(stats),flag:beat>=FLAG_BEAT,overall:false,name:false});
  }
  // The result screen: everything face up.
  function igResultView(statOrder){
    return Object.freeze({position:true,stats:Object.freeze(Array.isArray(statOrder)?statOrder.slice():STATS.slice()),flag:true,overall:true,name:true});
  }

  // ---------- the round record ----------
  // One record per season round, the only thing the two phones share for this game:
  //   {v, season, arrived:{playerOne, playerTwo} (server ms or null), chipsUsed:{playerOne, playerTwo},
  //    winner: null | {role, beat, atMs}}
  // The start time is never stored: both phones derive it from the two arrival times. Wrong guesses are never stored.
  function igNewRecord(season){
    if(!igSeason(season))return null;
    return Object.freeze({v:RECORD_VERSION,season,arrived:Object.freeze({playerOne:null,playerTwo:null}),chipsUsed:Object.freeze({playerOne:0,playerTwo:0}),winner:null});
  }
  const igMs=value=>Number.isFinite(value)&&value>0;
  function igValid(record){
    if(!record||record.v!==RECORD_VERSION||!igSeason(record.season))return false;
    if(!record.arrived||!record.chipsUsed)return false;
    for(const role of ROLES){
      const at=record.arrived[role],used=record.chipsUsed[role];
      if(at!==null&&!igMs(at))return false;
      if(!Number.isInteger(used)||used<0||used>CHIPS)return false;
      if(used>0&&at===null)return false;
    }
    const w=record.winner;
    if(w!==null){
      if(!w||!ROLES.includes(w.role)||!Number.isInteger(w.beat)||w.beat<0||w.beat>FLAG_BEAT||!igMs(w.atMs))return false;
      if(record.chipsUsed[w.role]<1)return false;
    }
    return true;
  }
  // The round starts LEAD_MS after the later arrival; null until both managers are on the screen.
  function igStartMs(record){
    if(!record||!record.arrived)return null;
    const a=record.arrived.playerOne,b=record.arrived.playerTwo;
    return igMs(a)&&igMs(b)?Math.max(a,b)+LEAD_MS:null;
  }
  // A manager opens the screen. The first arrival time stands: a reload never moves the start.
  function igArrive(record,role,atMs){
    if(!igValid(record))return {ok:false,reason:"BAD_RECORD"};
    if(!ROLES.includes(role)||!igMs(atMs))return {ok:false,reason:"BAD_ARRIVAL"};
    if(record.arrived[role]!==null)return {ok:true,changed:false,record};
    return {ok:true,changed:true,record:Object.freeze({...record,arrived:Object.freeze({...record.arrived,[role]:atMs})})};
  }
  // How the round stands at server time nowMs: "waiting" (someone hasn't arrived), "live", or the end:
  // "won" (winner set), "draw" (flag window closed, or both managers out of chips, with no winner).
  function igOutcome(record,nowMs,windowMs){
    if(!igValid(record))return null;
    const chips=Object.freeze({playerOne:CHIPS-record.chipsUsed.playerOne,playerTwo:CHIPS-record.chipsUsed.playerTwo});
    if(record.winner)return Object.freeze({state:"won",winner:record.winner.role,beat:record.winner.beat,chips});
    const startMs=igStartMs(record);
    if(startMs===null)return Object.freeze({state:"waiting",winner:null,beat:null,chips});
    if(chips.playerOne===0&&chips.playerTwo===0)return Object.freeze({state:"draw",winner:null,beat:null,chips});
    if(Number.isFinite(nowMs)&&nowMs>=igEndsAt(startMs,windowMs))return Object.freeze({state:"draw",winner:null,beat:null,chips});
    return Object.freeze({state:"live",winner:null,beat:null,chips});
  }
  // One accepted guess (a name already matched to an icon in the list; text that matched nothing never gets here and
  // costs no chip). correct is whether that icon is this season's answer. atMs is the SERVER time of the write (the
  // transaction's request time), never the phone's clock. Returns the next record, or why the guess doesn't count.
  // Run inside a transaction on the latest record: the first right guess to commit wins; a later one sees the winner.
  function igApplyGuess(record,{role,correct,atMs}={},windowMs){
    if(!igValid(record))return {ok:false,reason:"BAD_RECORD"};
    if(!ROLES.includes(role)||typeof correct!=="boolean"||!igMs(atMs))return {ok:false,reason:"BAD_GUESS"};
    if(record.winner)return {ok:false,reason:"ROUND_OVER"};
    const startMs=igStartMs(record);
    if(startMs===null)return {ok:false,reason:"NOT_STARTED"};
    if(record.chipsUsed[role]>=CHIPS)return {ok:false,reason:"NO_CHIPS"};
    const at=igBeatAt(startMs,atMs,windowMs);
    if(at.phase==="waiting")return {ok:false,reason:"NOT_STARTED"};
    if(at.phase==="over")return {ok:false,reason:"ROUND_OVER"};
    const chipsUsed=Object.freeze({...record.chipsUsed,[role]:record.chipsUsed[role]+1});
    const winner=correct?Object.freeze({role,beat:at.beat,atMs}):null;
    return {ok:true,correct,record:Object.freeze({...record,chipsUsed,winner})};
  }
  // The Showdown point this round gives each manager (1 to the winner, 0 otherwise; nothing until the round is over).
  // The point always comes from the record, never from a typed value.
  function igPoints(record){
    if(!igValid(record)||!record.winner)return Object.freeze({playerOne:0,playerTwo:0});
    return Object.freeze({playerOne:record.winner.role==="playerOne"?1:0,playerTwo:record.winner.role==="playerTwo"?1:0});
  }

  return Object.freeze({
    contractVersion:1,feature:"cms-icon-guess",roles:ROLES,stats:STATS,maxSeasons:MAX_SEASONS,chips:CHIPS,
    beats:BEATS,flagBeat:FLAG_BEAT,windowMs:WINDOW_MS,windowMinMs:WINDOW_MIN_MS,windowMaxMs:WINDOW_MAX_MS,revealMs:REVEAL_MS,leadMs:LEAD_MS,
    fromMs:ICON_FROM_MS,eligible:igEligible,order:igOrder,statOrder:igStatOrder,draw:igDraw,
    endsAt:igEndsAt,beatAt:igBeatAt,revealed:igRevealed,resultView:igResultView,
    newRecord:igNewRecord,validRecord:igValid,startMs:igStartMs,arrive:igArrive,outcome:igOutcome,applyGuess:igApplyGuess,points:igPoints
  });
});
