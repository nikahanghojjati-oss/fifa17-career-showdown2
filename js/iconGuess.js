(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconGuess=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // r88 Prime Pack (named by Nik 2026-11-01; earlier working name Prime Pack; Nik 2026-10-31, spec project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md):
  // once a season, after Roster Roulette and before the transfer window, both managers race to name a male outfield Legend,
  // Icon, FUT Hero or Hall of FUT player from a card that reveals itself in four stages (Nik 2026-11-01): stage 1 shows the
  // position and one random face stat, and each later stage adds one more stat. The first right guess the server records
  // wins 4 Showdown points in stage 1, 3 in stage 2, 2 in stage 3 and 1 in stage 4; nobody by the end of stage 4 is a draw
  // and the whole card is shown. Each manager has two guesses a card (default until Nik says otherwise).
  //
  // This module is the round logic only, with no IO, no clock and no randomness of its own:
  //  - the draw: which icon each season and the stat order, read from the Showdown's own id like js/marqueePlayer.js and
  //    js/rosterRoulette.js, so both phones agree with zero reads or writes, and no icon repeats in one Showdown;
  //  - the reveal clock: which stage ("beat") is showing at a given server time, from the round's server start time; both
  //    phones show each stage at the same server moment, and a guess counts for the stage its server write time falls in;
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
  // THE ONE TABLE (Nik's final stage rule via G Lead, 2026-11-01 11:08 UTC; tune here only). Beats are the four guessing
  // stages. Each stage is a reveal animation (revealMs) then guessing time with a visible timer (guessMs); a guess at any
  // moment of a stage, reveal included, counts for that stage. stats is how many of the six real card stats are face up from
  // that stage on (1, 2, 3, 4; which stats is the seeded statOrder; the values are always the player's own). Stage 5 has no
  // guessing: when the round ends (a right guess at any stage, both out of guesses, or stage 4's timer) the result reveals
  // the last two stats, the name, the flag and the overall (igResultView). The Rules hold the same stage edges
  // (ssjrPackStagePoints and ssjrPackGuessInTime in firestore.season-results-production.fragment.rules); contract G8 fails
  // until they match this table.
  const STAGES=Object.freeze([
    Object.freeze({points:4,revealMs:2500,guessMs:25000,stats:1,position:true,flag:false,overall:false}),
    Object.freeze({points:3,revealMs:1500,guessMs:20000,stats:2,position:true,flag:false,overall:false}),
    Object.freeze({points:2,revealMs:1500,guessMs:20000,stats:3,position:true,flag:false,overall:false}),
    Object.freeze({points:1,revealMs:1500,guessMs:20000,stats:4,position:true,flag:false,overall:false})
  ]);
  const BEATS=STAGES.length,LAST_BEAT=BEATS-1;
  const STAGE_POINTS=Object.freeze(STAGES.map(stage=>stage.points)),MAX_POINTS=STAGE_POINTS[0];
  // Each stage's start, relative to the round start, and the round's end (the last moment a guess counts).
  const STAGE_STARTS=Object.freeze(STAGES.reduce((out,stage,i)=>[...out,i?out[i-1]+STAGES[i-1].revealMs+STAGES[i-1].guessMs:0],[]));
  const ROUND_MS=STAGE_STARTS[LAST_BEAT]+STAGES[LAST_BEAT].revealMs+STAGES[LAST_BEAT].guessMs;
  const DRAW_SLACK_MS=2000; // the Rules' guess window ends at L+97 s, 2 s after the stage 4 window (L+95 s)
  const LEAD_MS=3000;   // after the second manager arrives, both phones count in together before the card rises
  const RECORD_VERSION=1;
  // Nik 2026-10-31 (N1), moved to r87 on 2026-11-01: the game runs only in Showdowns confirmed on the release that ships it,
  // like Roster Roulette, so one Showdown never mixes 11-point and 15-point seasons. ICON_FROM_MS is the same boundary as
  // js/rosterRouletteStep.js RRR_FROM_MS (a contract keeps them equal); the r87 release PR pins both to the release time.
  // Do not change it outside the release PR.
  const ICON_FROM_MS=Date.parse("2026-11-02T04:00:00Z");

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
  // When the stage 4 timer runs out: the last moment a guess counts. (A windowMs argument from older callers is ignored:
  // every timing lives in STAGES.)
  function igEndsAt(startMs){return Number.isFinite(startMs)?startMs+ROUND_MS:null;}
  // What a phone shows at server time nowMs. phase: "waiting" (before the start), "reveal" (a stage animating in),
  // "window" (that stage's guessing timer), "over" (the stage 4 timer has run out). msLeft is what is left of the current
  // phase; stageMsLeft is what is left of the whole stage (reveal plus timer). A phone that reloads or rejoins calls this
  // with the current server time and lands on the current stage; one that missed the whole game gets "over".
  function igBeatAt(startMs,nowMs){
    if(!Number.isFinite(startMs)||!Number.isFinite(nowMs))return null;
    const elapsed=nowMs-startMs;
    if(elapsed<0)return Object.freeze({phase:"waiting",beat:-1,msLeft:-elapsed,stageMsLeft:-elapsed});
    if(elapsed>=ROUND_MS)return Object.freeze({phase:"over",beat:LAST_BEAT,msLeft:0,stageMsLeft:0});
    let beat=LAST_BEAT;
    while(beat>0&&elapsed<STAGE_STARTS[beat])beat-=1;
    const stage=STAGES[beat],into=elapsed-STAGE_STARTS[beat],stageMsLeft=stage.revealMs+stage.guessMs-into;
    return into<stage.revealMs
      ?Object.freeze({phase:"reveal",beat,msLeft:stage.revealMs-into,stageMsLeft})
      :Object.freeze({phase:"window",beat,msLeft:stageMsLeft,stageMsLeft});
  }
  // Which parts of the card are face up once stage `beat` has started, straight from STAGES: the position and that stage's
  // stat count (in the seeded order). The last two stats, the flag, the overall and the name only show in the stage 5
  // reveal (igResultView).
  function igRevealed(beat,statOrder){
    const stage=Number.isInteger(beat)&&beat>=0?STAGES[Math.min(beat,LAST_BEAT)]:null;
    const stats=stage&&Array.isArray(statOrder)?statOrder.slice(0,stage.stats):[];
    return Object.freeze({position:Boolean(stage&&stage.position),stats:Object.freeze(stats),flag:Boolean(stage&&stage.flag),overall:Boolean(stage&&stage.overall),name:false});
  }
  // What a right guess in beat `beat` is worth (0 outside the four stages).
  function igStagePoints(beat){return Number.isInteger(beat)&&beat>=0&&beat<BEATS?STAGE_POINTS[beat]:0;}
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
      if(!w||!ROLES.includes(w.role)||!Number.isInteger(w.beat)||w.beat<0||w.beat>LAST_BEAT||!igMs(w.atMs))return false;
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
  // "won" (winner set), "draw" (stage 4 window closed, or both managers out of chips, with no winner).
  function igOutcome(record,nowMs){
    if(!igValid(record))return null;
    const chips=Object.freeze({playerOne:CHIPS-record.chipsUsed.playerOne,playerTwo:CHIPS-record.chipsUsed.playerTwo});
    if(record.winner)return Object.freeze({state:"won",winner:record.winner.role,beat:record.winner.beat,chips});
    const startMs=igStartMs(record);
    if(startMs===null)return Object.freeze({state:"waiting",winner:null,beat:null,chips});
    if(chips.playerOne===0&&chips.playerTwo===0)return Object.freeze({state:"draw",winner:null,beat:null,chips});
    // Fable F13-06: the Rules take a right guess until 97 s after the later arrival (the end of stage 4 plus DRAW_SLACK_MS),
    // so a time draw shows only once that has passed; a guess from 95 s is still refused here (igApplyGuess).
    if(Number.isFinite(nowMs)&&nowMs>igEndsAt(startMs)+DRAW_SLACK_MS)return Object.freeze({state:"draw",winner:null,beat:null,chips});
    return Object.freeze({state:"live",winner:null,beat:null,chips});
  }
  // One accepted guess (a name already matched to an icon in the list; text that matched nothing never gets here and
  // costs no chip). correct is whether that icon is this season's answer. atMs is the SERVER time of the write (the
  // transaction's request time), never the phone's clock. Returns the next record, or why the guess doesn't count.
  // Run inside a transaction on the latest record: the first right guess to commit wins; a later one sees the winner.
  function igApplyGuess(record,{role,correct,atMs}={}){
    if(!igValid(record))return {ok:false,reason:"BAD_RECORD"};
    if(!ROLES.includes(role)||typeof correct!=="boolean"||!igMs(atMs))return {ok:false,reason:"BAD_GUESS"};
    if(record.winner)return {ok:false,reason:"ROUND_OVER"};
    const startMs=igStartMs(record);
    if(startMs===null)return {ok:false,reason:"NOT_STARTED"};
    if(record.chipsUsed[role]>=CHIPS)return {ok:false,reason:"NO_CHIPS"};
    const at=igBeatAt(startMs,atMs);
    if(at.phase==="waiting")return {ok:false,reason:"NOT_STARTED"};
    if(at.phase==="over")return {ok:false,reason:"ROUND_OVER"};
    const chipsUsed=Object.freeze({...record.chipsUsed,[role]:record.chipsUsed[role]+1});
    const winner=correct?Object.freeze({role,beat:at.beat,atMs}):null;
    return {ok:true,correct,record:Object.freeze({...record,chipsUsed,winner})};
  }
  // The Showdown points this round gives each manager: 4, 3, 2 or 1 to the winner by the stage of the winning write, 0
  // otherwise (nothing until the round is over). The points always come from the record, never from a typed value.
  function igPoints(record){
    if(!igValid(record)||!record.winner)return Object.freeze({playerOne:0,playerTwo:0});
    const points=igStagePoints(record.winner.beat);
    return Object.freeze({playerOne:record.winner.role==="playerOne"?points:0,playerTwo:record.winner.role==="playerTwo"?points:0});
  }

  return Object.freeze({
    contractVersion:1,feature:"cms-icon-guess",roles:ROLES,stats:STATS,maxSeasons:MAX_SEASONS,chips:CHIPS,
    beats:BEATS,lastBeat:LAST_BEAT,stagePoints:STAGE_POINTS,maxPoints:MAX_POINTS,stages:STAGES,stageStarts:STAGE_STARTS,roundMs:ROUND_MS,leadMs:LEAD_MS,
    fromMs:ICON_FROM_MS,eligible:igEligible,order:igOrder,statOrder:igStatOrder,draw:igDraw,
    endsAt:igEndsAt,drawSlackMs:DRAW_SLACK_MS,beatAt:igBeatAt,revealed:igRevealed,stagePointsAt:igStagePoints,resultView:igResultView,
    newRecord:igNewRecord,validRecord:igValid,startMs:igStartMs,arrive:igArrive,outcome:igOutcome,applyGuess:igApplyGuess,points:igPoints
  });
});
