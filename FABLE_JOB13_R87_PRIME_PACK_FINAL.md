# Fable job 13: Prime Pack final check on the 2.0.0 candidate (Career Mode Showdown)

Code snapshot: repo nikahanghojjati-oss/fifa17-career-showdown2, branch gameplay/r87 @ 258f3f3eedab0a04ca81ab71478cba292cd9254b (the frozen 2.0.0 candidate). The release PR #1156 will only change `ICON_FROM_MS` / `RRR_FROM_MS` to the release time and bump the version. Below the brief: the full Prime Pack source, the screen, the Rules fragment that guards it, its emulator tests, and every other place in the app that touches Prime Pack (grep with 6 lines of context; long minified lines cut at 400 characters).

An earlier hunt (job 12) ran on an older Prime Pack build. Its fixes are now in: F12-01/03 (the winner's phone took the stage from its own clock; now the point uses the server time of the winning write), F12-02 (leaving the screen before the other manager arrives withdraws the arrival), F12-04/06/10/12. Verify those fixes really close the holes, then hunt for anything still wrong. Since job 12 the season maximum moved to 15, Golden to 150, and the stage table changed to the one below.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore on the free Spark plan with no Cloud Functions, GitHub Pages, a service worker). Two managers, Daniel (playerOne) and Nik (playerTwo), each on his own phone, play a "Showdown" of 1, 3, 5 or 10 seasons. Each season both phones walk through shared screens: Career Start, Russian Roster Roulette (each manager spins), **Prime Pack** (new in 2.0.0), the Transfer Challenge, results, a season commit both acknowledge, then scoring, history and a lifetime career. 2.0.0 (release r87) is the biggest release ever and the **first change to the scoring system since the project began.**

## Scoring truth for 2.0.0 (owner rules; the code must match)
- A season is worth **0 to 15** points (it was 0 to 11). Europa League +3 or Champions League +5, never both. Prime Pack adds 4, 3, 2 or 1 to exactly one manager, or to nobody. **Both managers never score Prime Pack in the same season.**
- **Golden Showdown = 150** in a 10-season Showdown (15 x 10). The owner said on 1 Nov 2026: no real 10-season Showdown was ever played, so there is no 110 record to preserve; every screen, note, Gazette line and record book must say 15 / 150 only. Showdowns started before 2.0.0 never play Prime Pack, and breaking a pre-2.0.0 game is acceptable; a new 2.0.0 game must fully work.
- **No tiebreak anywhere.** Equal totals = DRAW (a 150-150 is a draw); equal career points = LEVEL. League position never decides anything.
- Lengths 1, 3, 5, 10 only. Reus Gate: the loading screen stays until the next screen is ready. No dimming ever. Nothing covers anything at any size. No flash of an old design.

## Prime Pack rules
- Once per season on both phones, after both roulette spins and before the transfer window opens. Only Showdowns confirmed at or after `ICON_FROM_MS` (equal to the roulette's `RRR_FROM_MS`; the release PR pins both to the release time) play it. Kill switch `CMS_PRIME_PACK = "off"`.
- One masked card of a real player (data/icons.js), seeded from the Showdown id, never the same player twice in one Showdown. The answer is never stored; both phones derive it.
- Stages (one table, `STAGES` in js/iconGuess.js): 3 s count-in after the later arrival; S1 = 4 pts (position + 1 real stat; 2.5 s reveal + 25 s guessing); S2 = 3 pts (+1 stat; 1.5 s + 20 s); S3 = 2 pts (+1 stat; 1.5 s + 20 s); S4 = 1 pt (+1 stat; 1.5 s + 20 s); S5 = no guessing, reveals the last 2 stats, name, nationality, overall. A right guess at any stage jumps to S5.
- Each manager has 2 guesses (tokens) per round; wrong guesses spend a token and are never stored. Name matching: `typoRule` in js/iconNames.js.
- The first right guess **by server time** wins; points come from the server time of the winning write at the stage edges (Rules `ssjrPackStagePoints`). The point lands as a sparse `primePack` key on the winner's Season Result; the round record is `rivalries/{rid}/primePackRounds/season_N`.

## Trust model
Normal play only: two real phones, reloads, phone locks, app switching, offline/online, slow networks, clock skew, one phone far behind, cleared storage, two tabs, a service-worker update mid-Showdown, one phone on 1.9.10 and one on 2.0.0. A deliberately modified app is out of scope, EXCEPT where the Firestore Rules are the only guard on points: report a crafted write that gives a manager points he did not win as P1 "hardening".

## How to report
You cannot run code here, so reason carefully, show timing and arithmetic, and quote code. For each finding:
- ID and severity: P0 = wrong points, wrong winner, both scoring, a lost or doubled result, a stuck screen, or a refused legitimate write a player sees; P1 = rare or edge; P2 = cosmetic or wording;
- file:line, quoting the code;
- exact steps or timeline that show it;
- expected vs actual;
- the smallest fix as a unified diff.
Then list what you checked and found correct, area by area. Rank findings most severe first. Say "none found" where true. Keep the visible reply under about 50,000 characters.

## Hunt these specifically
1. **Never both, first right wins:** two right guesses within milliseconds; transaction retries; `namedBy` races; a right guess whose write returns an error but did land; both phones writing the `primePack` key.
2. **Timing:** client `STAGES` vs Rules edges (30.5 s, 52 s, 73.5 s after the later arrival; guesses allowed from 2 s to 97 s). Work the arithmetic including the 3 s count-in. Can a guess the screen shows as S2 (3 pts) be refused, or scored as 2? Clock skew between phones. A guess at 19.9 s of S4 landing after the close. What the loser's screen shows.
3. **The point into the season:** the `primePack: N` key on the winner's Season Result, the Rules check of N against the round record, the season cap 15 and terminal-close cap, Golden 150. Can a point land twice, for the wrong season, for the wrong manager, or be lost (winner reloads before writing the result; winner never presses on)?
4. **Stuck or skipped:** can the round hang so the transfer window never opens, open with no result, be skipped, or run twice? Reload or phone lock at every stage, after a right guess, during S5; one phone offline; the other manager arriving very late or never; kill switch flipped mid-Showdown.
5. **Privacy:** can a phone see the answer, the other manager's guess text, or his tokens before the reveal?
6. **Old and cutoff Showdowns:** a Showdown confirmed before `ICON_FROM_MS` never loads Prime Pack; one confirmed after always does, on both phones, every season.
7. **Draw and matching:** seeded draw (no repeat in 10 seasons, same on both phones, stable across reloads and app updates); `typoRule` holes (accepting the wrong player, refusing a fair guess, accents, multi-word names, shared card names).
8. **Screen (visual-assets/v10_1/icon-guess/index.html):** Reus Gate, no dimming, nothing covering the guess boxes or the card at 360 px wide, timers match the stage, phone keyboard and focus, S5 reveal, "Prime Pack" wording.
9. **Reads:** listener and transaction reads per round on each phone; any read loop or a listener left running after the round.

## Do not re-report
Card art. Layout outside Prime Pack. Anything only a modified app can do (except the P1 hardening case above). Scoring wording on career screens other than Prime Pack's own (another review covers those).

Finding IDs: F13-NN.


## FILE: js/iconGuess.js
```
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
  const LEAD_MS=3000;   // after the second manager arrives, both phones count in together before the card rises
  const RECORD_VERSION=1;
  // Nik 2026-10-31 (N1), moved to r87 on 2026-11-01: the game runs only in Showdowns confirmed on the release that ships it,
  // like Roster Roulette, so one Showdown never mixes 11-point and 15-point seasons. ICON_FROM_MS is the same boundary as
  // js/rosterRouletteStep.js RRR_FROM_MS (a contract keeps them equal); the r87 release PR pins both to the release time.
  // Do not change it outside the release PR.
  const ICON_FROM_MS=Date.parse("2026-10-30T00:00:00Z");

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
    if(Number.isFinite(nowMs)&&nowMs>=igEndsAt(startMs))return Object.freeze({state:"draw",winner:null,beat:null,chips});
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
    endsAt:igEndsAt,beatAt:igBeatAt,revealed:igRevealed,stagePointsAt:igStagePoints,resultView:igResultView,
    newRecord:igNewRecord,validRecord:igValid,startMs:igStartMs,arrive:igArrive,outcome:igOutcome,applyGuess:igApplyGuess,points:igPoints
  });
});

```


## FILE: js/iconGuessStep.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconGuessStep=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r87 Prime Pack, the season step (Nik 2026-10-31, renamed and moved to r87 on 2026-11-01; spec
  // project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md). Once a season, right after Roster Roulette and before the
  // Transfer Challenge opens, both phones show one masked Icon card (the stand-in page visual-assets/v10_1/icon-guess, Team V's
  // art later) and reveal it in four stages (Nik 2026-11-01): the position and one seeded stat, then one more stat per stage.
  // Each manager has two guesses; the first right one the server records wins 4, 3, 2 or 1 Showdown points by its stage (the
  // sparse primePack result key, season maximum 15). Nobody by the end of stage 4 is a draw and the whole card is shown.
  // Old Showdowns never play it (js/iconGuess.js eligible, the same boundary as Roster Roulette).
  //
  // What the phones share is one small record, rivalries/{rid}/primePackRounds/season_N (Rules: the season-results fragment):
  // each arrival (server time), each manager's used guesses and namedBy (the winner). The start is the later arrival + 3 s, so both
  // phones count in together and every stage follows from the server clock the Transfer Challenge already keeps (a reload
  // lands on the current stage). Fair first guess: guesses are transactions on this one record, so the server orders them;
  // the first right one to commit sets namedBy and every later write is refused. Its stage, and so its points, comes from
  // that write's server time (updatedAt), never from a phone clock, and the Rules check the result against it. Which icon it is comes from the Showdown id (no read, never stored); whether a guess is
  // right is decided here, and the record only says who won. Wrong guesses are never stored: the other phone sees only
  // the chip count drop.
  //
  // Reads: one listener on the round record while the screen is open (each change is one read: two arrivals, up to four
  // guesses), one transaction read per write. A Showdown the game does not apply to costs nothing.
  //
  // The file names keep the working name (iconGuess*, icon-guess) so the three reviewed parts stay where they were reviewed;
  // everything a player sees says Prime Pack.
  const PAGE="visual-assets/v10_1/icon-guess/index.html";
  const STAGE_ID="igStage",PANEL_ID="igStepPanel",COLLECTION="primePackRounds";
  const DONE_KEY="careerModeShowdown.primePackDone.v1",KEYS_MAX=60;
  const LOAD_WAIT_MS=10000,READY_WAIT_MS=10000,TICK_MS=200,POLL_MS=2500;
  const ROLES=Object.freeze(["playerOne","playerTwo"]),NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
  const wonMemo=new Map();
  // wentHome: the last run ended because the manager chose Showdown Home (not a fault), so the caller shows no error.
  let running=null,wentHome=false;

  function igsDoc(){return root.document||null;}
  function igsWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function igsOther(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function igsKey(ctx){return `${ctx.rivalryId}|${ctx.season}|${ctx.managerRole}`;}
  function igsSeasonId(season){return `season_${season}`;}
  function igsList(key){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(key)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function igsMark(key,item){try{const list=igsList(key).filter(value=>value!==item);list.push(item);if(typeof root.writeStorageValue==="function")root.writeStorageValue(key,JSON.stringify(list.slice(-KEYS_MAX)));}catch(_error){}}
  async function igsLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  // The round logic, the matcher and the list. false when any of them cannot load in time.
  async function igsEnsure(){
    const loads=Promise.all([
      igsLoad("icon-guess","js/iconGuess.js",()=>Boolean(root.CareerModeIconGuess)),
      igsLoad("icon-list","data/icons.js",()=>Boolean(root.CareerModeIcons)),
      igsLoad("icon-names","js/iconNames.js",()=>Boolean(root.CareerModeIconNames))
    ]).then(list=>list.every(Boolean),()=>false);
    return Promise.race([loads,igsWait(LOAD_WAIT_MS).then(()=>false)]);
  }
  function igsGuess(){return root.CareerModeIconGuess||(typeof require==="function"?require("./iconGuess.js"):null);}

  // ctx = {rivalryId, managerRole, season, confirmedAtMs}. Does this Showdown play Prime Pack this season? It needs
  // js/iconGuess.js: a browser caller awaits ensure() first (before it, the answer is always false).
  function igsApplies(ctx){
    if(root.CMS_PRIME_PACK==="off"||!ctx)return false;
    if(!/^pair_[0-9a-f]{64}$/.test(String(ctx.rivalryId||""))||!ROLES.includes(ctx.managerRole))return false;
    if(!Number.isInteger(ctx.season)||ctx.season<1||ctx.season>10)return false;
    const guess=igsGuess();
    return Boolean(guess&&guess.eligible(ctx.rivalryId,ctx.confirmedAtMs));
  }

  // ---------- the record: Firestore <-> js/iconGuess.js ----------
  function igsMillis(value){if(value&&typeof value.toMillis==="function"){const ms=value.toMillis();return Number.isFinite(ms)?ms:null;}return null;}
  // The stored document as the round logic's record. The winner's beat and time come from the winning write (no later write
  // is allowed once there is a winner, so updatedAt is that write's server time).
  function igsRecord(data,season){
    const guess=igsGuess();
    if(!data||data.objectType!=="sharedPrimePackRound"||data.seasonNumber!==season)return null;
    const arrived={playerOne:igsMillis(data.arrived?.playerOne),playerTwo:igsMillis(data.arrived?.playerTwo)};
    let winner=null;
    if(ROLES.includes(data.namedBy)){
      const atMs=igsMillis(data.updatedAt),startMs=arrived.playerOne&&arrived.playerTwo?Math.max(arrived.playerOne,arrived.playerTwo)+guess.leadMs:null;
      const at=startMs&&atMs?guess.beatAt(startMs,atMs):null;
      winner={role:data.namedBy,beat:at&&at.beat>=0?Math.min(at.beat,guess.lastBeat):0,atMs:atMs||1};
    }
    const record={v:1,season,arrived,chipsUsed:{playerOne:data.chipsUsed?.playerOne,playerTwo:data.chipsUsed?.playerTwo},winner};
    return guess.outcome(record,0)?record:null;
  }
  function igsRef(io,season){return io.sdk.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(season));}
  function igsStamp(io){return {activeSessionId:io.sessionId,updatedByDeviceId:io.deviceId,updatedAt:io.sdk.serverTimestamp()};}
  // This manager is on the screen: his arrival is written once (the first one stands; a reload never moves the start).
  async function igsArrive(io,ctx){
    const ref=igsRef(io,ctx.season),me=ctx.managerRole;
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(!data){
        tx.set(ref,{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:io.rivalryId,seasonNumber:ctx.season,
          arrived:{[me]:io.sdk.serverTimestamp(),[igsOther(me)]:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...igsStamp(io)});
        return "created";
      }
      if(data.arrived&&data.arrived[me]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:io.sdk.serverTimestamp(),revision:data.revision+1,...igsStamp(io)});return "arrived";}
      return "already";
    });
  }
  // Leaving (BACK, or the phone hidden) before the other manager has arrived withdraws this arrival (Fable F12-02), so the
  // round can never start while this manager is away; coming back arrives again. Once both have arrived it stays.
  async function igsLeave(io,ctx){
    const ref=igsRef(io,ctx.season),me=ctx.managerRole;
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null;
      if(data&&data.arrived&&data.arrived[me]!=null&&data.arrived[igsOther(me)]===null&&data.namedBy===null){tx.update(ref,{[`arrived.${me}`]:null,revision:data.revision+1,...igsStamp(io)});return "left";}
      return "stays";
    });
  }
  // Arrive and leave run one after the other, in the order they were asked for (a quick hide and show never leaves a
  // withdrawn arrival behind).
  let igsPresenceChain=Promise.resolve();
  function igsPresence(task){const run=igsPresenceChain.then(task,task);igsPresenceChain=run.catch(()=>{});return run;}
  // One matched guess: this manager's used guesses +1, and the winner when it is right, on the latest record.
  async function igsApplyGuess(io,ctx,correct){
    const ref=igsRef(io,ctx.season),guess=igsGuess();
    return io.sdk.runTransaction(io.firestore,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():null,record=igsRecord(data,ctx.season);
      if(!record)return {ok:false,reason:"BAD_RECORD"};
      const next=guess.applyGuess(record,{role:ctx.managerRole,correct,atMs:io.now()});
      if(!next.ok)return next;
      tx.update(ref,{[`chipsUsed.${ctx.managerRole}`]:next.record.chipsUsed[ctx.managerRole],namedBy:correct?ctx.managerRole:null,revision:data.revision+1,...igsStamp(io)});
      return next;
    });
  }
  // The listener on the round record (counted by the read meter); a timed transaction read when no listener is available.
  async function igsSnapshotApi(io){
    const meter=root.CareerModeFirestoreBudget?.meterSdk||(s=>s);
    if(typeof io.sdk.onSnapshot==="function")return meter(io.sdk);
    const url=root.CareerModeProductionFirebaseRuntime?.firebaseFirestoreModule;
    if(typeof url!=="string"||!/^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-firestore\.js$/.test(url))return null;
    try{const module=await import(url);return module&&typeof module.onSnapshot==="function"&&typeof module.doc==="function"?meter(module):null;}catch(_error){return null;}
  }
  async function igsWatch(io,ctx,onData,onError){
    const api=await igsSnapshotApi(io),ref=igsRef(io,ctx.season);
    if(api){
      const listenRef=api===io.sdk?ref:api.doc(io.firestore,"rivalries",io.rivalryId,COLLECTION,igsSeasonId(ctx.season));
      return api.onSnapshot(listenRef,{includeMetadataChanges:true},snap=>{if(snap.metadata?.hasPendingWrites||snap.metadata?.fromCache)return;onData(snap.exists()?snap.data():null);},onError);
    }
    let stopped=false;
    const poll=async()=>{while(!stopped){try{const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});if(!stopped)onData(data);}catch(error){if(!stopped)onError(error);return;}await igsWait(POLL_MS);}};
    void poll();
    return ()=>{stopped=true;};
  }

  // How many Prime Pack points this manager won this season (0, or 4 to 1 by stage). Read by the season results before they
  // are published, so the points go in as primePack:N (the Rules check N against the round record). io = {firestore, sdk,
  // rivalryId}. One read, once per season, only for a Showdown the game applies to.
  async function igsPointsFor(io,ctx){
    if(!igsApplies(ctx))return 0;
    const key=igsKey(ctx);if(wonMemo.has(key))return wonMemo.get(key);
    const ref=igsRef(io,ctx.season);
    const data=await io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(ref);return snap.exists()?snap.data():null;});
    const record=igsRecord(data,ctx.season);
    const points=record&&record.winner?igsGuess().points(record)[ctx.managerRole]:0;
    if(record&&record.winner)wonMemo.set(key,points);
    return points;
  }

  // ---------- the screen ----------
  function igsEl(tag,className,text){const node=igsDoc().createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=String(text);return node;}
  function igsRemove(id){const node=igsDoc()?.getElementById(id);if(node)node.remove();}
  function igsClose(){igsRemove(PANEL_ID);igsRemove(STAGE_ID);}
  // A plain choice card over the stage (the same look as the roulette's step panel when its styles are loaded).
  function igsAsk({heading,lines=[],buttons}){
    return new Promise(resolve=>{
      igsRemove(PANEL_ID);
      const overlay=igsEl("div","remoteJoiningOverlay rrStepOverlay");overlay.id=PANEL_ID;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label",heading);
      overlay.style.cssText="position:fixed;inset:0;z-index:96;display:flex;align-items:center;justify-content:center;background:#050403;padding:16px";
      const shell=igsEl("div","remoteJoiningShell rrStepShell");shell.style.cssText="max-width:420px;width:100%;background:#15130f;color:#f3ead7;border:1px solid #6b5a33;border-radius:12px;padding:20px";
      shell.append(igsEl("strong","","PRIME PACK"),igsEl("h2","rrStepTitle",heading));
      for(const line of lines)shell.append(igsEl("p","rrStepLine",line));
      const row=igsEl("div","rrStepActions");row.style.cssText="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px";
      for(const b of buttons){const button=igsEl("button",b.primary?"menuButton rrStepPrimary":"backButton",b.label);button.type="button";button.addEventListener("click",()=>{igsRemove(PANEL_ID);resolve(b.id);});row.append(button);}
      shell.append(row);overlay.append(shell);igsDoc().body.append(overlay);row.querySelector("button")?.focus();
    });
  }
  function igsStage(){
    const doc=igsDoc();igsRemove(STAGE_ID);
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Prime Pack");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403";
    const frame=doc.createElement("iframe");frame.title="Prime Pack";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    // Leaving while the other manager has not arrived (the window then stays shut; tapping the button again comes back here).
    const back=doc.createElement("button");back.type="button";back.className="backButton";back.textContent="BACK TO SHOWDOWN HOME";back.hidden=true;
    back.style.cssText="position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2";
    stage.append(frame,back);doc.body.append(stage);
    // The roulette's result panel (z-index 96) would stand over this stage and take its taps: it goes once this stage is up.
    try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}
    return {stage,frame,back};
  }
  function igsPost(frame,type,data={}){try{frame.contentWindow?.postMessage({type,...data},root.location?.origin||"*");}catch(_error){}}
  // What the page needs for this season's card. The name and overall go with it (the page never shows them before the
  // result: N2); the manager names are fixed, Daniel is playerOne.
  function igsRound(ctx){
    const guess=igsGuess(),list=root.CareerModeIcons,players=list&&list.players;
    const draw=players&&guess.draw(ctx.rivalryId,ctx.season,players.length,list.listVersion);
    const icon=draw&&players[draw.index];
    if(!icon)return null;
    const source=`${String(icon.cardVersion||"").toUpperCase()} · ${icon.game}`;
    return {answerId:icon.id,round:{me:ctx.managerRole,names:{...NAMES},stages:guess.stages,position:icon.position,overall:icon.overall,name:icon.name,
      stats:{...icon.stats},statOrder:[...draw.statOrder],stagePoints:[...guess.stagePoints],nation:icon.nationCode,source}};
  }
  // A suggestion shows the card name, or the full name when two icons share that card name (typing it alone is ambiguous).
  function igsSuggestions(index,text){
    const names=root.CareerModeIconNames;
    return names.suggest(index,text).map(s=>{const m=names.match(index,s.name);return m.status==="ambiguous"?s.fullName:s.name;});
  }

  // Runs this season's Prime Pack for this manager. io = {firestore, sdk (doc, runTransaction, serverTimestamp, onSnapshot?),
  // rivalryId, sessionId, deviceId, now() (server time)}. Resolves true when the Transfer Challenge may open (the round is over
  // and this manager pressed Continue, or the game does not apply), false when he went back to Showdown Home or the step
  // could not run (the window then stays shut and the dashboard says why; tapping again retries).
  async function igsRun(ctx,io){
    if(running)return running;
    wentHome=false;
    // On true the stage stays up until the Transfer Challenge is on screen (the caller closes it), so nothing flashes between.
    running=igsRunNow(ctx,io).then(go=>{if(!go)igsClose();return go;},error=>{igsClose();throw error;}).finally(()=>{running=null;});
    return running;
  }
  async function igsRunNow(ctx,io){
    if(!igsApplies(ctx))return true;
    if(!await igsEnsure())return false;
    // This phone already saw this season's result and pressed Continue: straight on to the Transfer Challenge.
    if(igsList(DONE_KEY).includes(igsKey(ctx)))return true;
    const index=root.CareerModeIconNames.defaultIndex(),pick=igsRound(ctx),guess=igsGuess();
    if(!index||!pick)return false;
    for(;;){
      const result=await igsPlay(ctx,io,{index,pick,guess});
      if(result==="continue"){igsMark(DONE_KEY,igsKey(ctx));return true;}
      if(result==="back"){wentHome=true;return false;}
      const choice=await igsAsk({heading:"Prime Pack could not load",lines:[root.CareerModeFirestoreBudget?.quotaMessage?.(result)||"Check the connection and try again."],buttons:[{id:"retry",label:"TRY AGAIN",primary:true},{id:"back",label:"BACK TO SHOWDOWN HOME"}]});
      if(choice==="back"){wentHome=true;return false;}
    }
  }
  // One screen session: "continue", "back", or an error object.
  function igsPlay(ctx,io,{index,pick,guess}){
    return new Promise(resolve=>{
      const me=ctx.managerRole,other=igsOther(me);
      const {frame,back}=igsStage();
      // resultShown: the result on screen as "winner:points" (or "draw:0"); it follows the server's record, so a winner that
      // lands after a shown draw (the Rules' 2 s slack) replaces it (Fable F12-03).
      let record=null,ready=false,stop=null,timer=null,shownBeat=-2,finished=false,resultShown="",sentChips={playerOne:null,playerTwo:null};
      // After this phone's right guess: the round record as the server stamped it (its updatedAt gives the stage and points).
      const readBack=()=>io.sdk.runTransaction(io.firestore,async tx=>{const snap=await tx.get(igsRef(io,ctx.season));return snap.exists()?snap.data():null;}).then(data=>onData(data),()=>{});
      const end=value=>{if(finished)return;finished=true;root.clearInterval(timer);root.removeEventListener("message",onMessage);igsDoc().removeEventListener?.("visibilitychange",onVisibility);try{stop&&stop();}catch(_error){}resolve(value);};
      // Away while the other manager has not arrived: withdraw (igsLeave); back on screen: arrive again.
      let away=false;
      const leave=()=>igsPresence(()=>igsLeave(io,ctx)).catch(error=>{root.CareerModeFirestoreBudget?.noteError?.(error);});
      const onVisibility=()=>{
        if(finished)return;
        if(igsDoc().visibilityState==="hidden"){if(record&&!record.winner&&record.arrived[other]===null){away=true;leave();}}
        else if(away){away=false;igsPresence(()=>igsArrive(io,ctx)).catch(fail);}
      };
      const fail=error=>{root.CareerModeFirestoreBudget?.noteError?.(error);end(error||{code:"PRIME_PACK_FAILED"});};
      const render=()=>{
        if(!ready||!record||finished)return;
        let now;try{now=io.now();}catch(error){return fail(error);}
        const out=guess.outcome(record,now);if(!out)return;
        for(const role of ROLES){if(sentChips[role]!==out.chips[role]){sentChips[role]=out.chips[role];igsPost(frame,"cms-ig-chips",{role,count:out.chips[role]});}}
        if(out.state==="won"||out.state==="draw"){
          const points=out.winner?guess.points(record)[out.winner]:0,shown=`${out.winner||"draw"}:${points}`;
          if(resultShown!==shown&&!(out.state==="draw"&&resultShown)){
            resultShown=shown;back.hidden=true;
            igsPost(frame,"cms-ig-result",{winner:out.winner||"draw",points});
            if(out.winner)for(const role of ROLES)wonMemo.set(igsKey({...ctx,managerRole:role}),role===out.winner?points:0);
          }
          return;
        }
        if(out.state==="waiting"){const waitingFor=record.arrived[other]===null?other:me;back.hidden=waitingFor!==other;if(shownBeat!==-1){shownBeat=-1;igsPost(frame,"cms-ig-waiting",{role:waitingFor});}return;}
        back.hidden=true;
        const at=guess.beatAt(guess.startMs(record),now);
        if(at.phase==="waiting"){if(shownBeat!==-1.5){shownBeat=-1.5;igsPost(frame,"cms-ig-waiting",{role:null});}return;}
        if(at.beat!==shownBeat){shownBeat=at.beat;igsPost(frame,"cms-ig-reveal",{index:at.beat,phase:at.phase,remainingMs:at.stageMsLeft,revealMsLeft:at.phase==="reveal"?at.msLeft:0});}
      };
      const onData=data=>{
        const next=igsRecord(data,ctx.season);
        if(!next)return;
        record=next;render();
      };
      const onMessage=event=>{
        if(event.source!==frame.contentWindow||!event.data||typeof event.data.type!=="string")return;
        const m=event.data;
        if(m.type==="cms-ig-ready"){
          if(ready)return;ready=true;
          igsPost(frame,"cms-ig-start",{round:pick.round,waitingFor:other});shownBeat=-2;sentChips={playerOne:null,playerTwo:null};
          render();
        }else if(m.type==="cms-ig-input"){
          igsPost(frame,"cms-ig-suggestions",{names:igsSuggestions(index,String(m.text||""))});
        }else if(m.type==="cms-ig-guess"){
          const check=root.CareerModeIconNames.check(index,String(m.text||""),pick.answerId);
          if(check.status==="empty"||check.status==="not-in-list")return igsPost(frame,"cms-ig-feedback",{kind:"not-in-list"});
          if(check.status==="ambiguous")return igsPost(frame,"cms-ig-feedback",{kind:"ambiguous"});
          igsApplyGuess(io,ctx,check.correct).then(next=>{
            if(!next.ok)return igsPost(frame,"cms-ig-feedback",{kind:next.reason==="NO_CHIPS"?"used":"late"});
            // A right guess: its stage, and so its points, is the SERVER time of the write (updatedAt), never this phone's clock
            // when the transaction read ran (Fable F12-01: a commit landing past a stage edge scores the later stage). Only the
            // stamped record is shown or remembered, so both phones and the season result agree with the Rules.
            if(check.correct)return readBack();
            record=next.record;igsPost(frame,"cms-ig-feedback",{kind:"wrong"});render();
          },error=>{root.CareerModeFirestoreBudget?.noteError?.(error);igsPost(frame,"cms-ig-feedback",{kind:/permission/.test(String(error&&error.code))?"late":"error"});});
        }else if(m.type==="cms-ig-continue"){
          if(resultShown)end("continue");
        }else if(m.type==="cms-ig-error"){
          // A page fault never decides the round: it is reported and the round carries on with the server's record.
          root.CareerModeFirestoreBudget?.noteError?.({code:"PRIME_PACK_PAGE",message:String(m.message||"")});
        }
      };
      back.addEventListener("click",()=>{if(finished)return;leave();end("back");});
      igsDoc().addEventListener?.("visibilitychange",onVisibility);
      root.addEventListener("message",onMessage);
      timer=root.setInterval(render,TICK_MS);
      root.setTimeout(()=>{if(!ready&&!finished)fail({code:"PRIME_PACK_PAGE_TIMEOUT"});},READY_WAIT_MS);
      Promise.resolve().then(async()=>{
        await igsPresence(()=>igsArrive(io,ctx));
        if(finished)return;
        const unsubscribe=await igsWatch(io,ctx,onData,fail);
        if(finished){try{unsubscribe();}catch(_error){}return;}
        stop=unsubscribe;
      }).catch(fail);
    });
  }

  return Object.freeze({contractVersion:1,feature:"cms-prime-pack-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,collection:COLLECTION,doneKey:DONE_KEY,
    applies:igsApplies,record:igsRecord,round:igsRound,suggestions:igsSuggestions,pointsFor:igsPointsFor,arrive:igsArrive,leave:igsLeave,applyGuess:igsApplyGuess,run:igsRun,close:igsClose,wentHome:()=>wentHome,ensure:igsEnsure});
});

```


## FILE: js/iconNames.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIconNames=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // R88 Prime Pack (Nik 2026-10-31): the typed guess and its live suggestions. Pure functions, no IO.
  // - Matching ignores accents, case, spaces, dots, hyphens and apostrophes, so "Cech", "cech" and "Čech" are one name.
  // - A guess counts when its text is one of an icon's accepted names (card name, full name, and the database's
  //   accepted_names). An exact name always wins. A name that two icons share is "ambiguous": no chip, and the
  //   suggestions show both so the manager can pick.
  // - G Lead 2026-11-01 (it's a football game, not a spelling test): with no exact name, a small typo still counts, but only
  //   when it can point to one icon alone (TYPO_RULE below). Anything else is "not-in-list" and uses no guess chip, so a
  //   typo that is refused never burns a chance.
  // The list is data/icons.js (written by scripts/r88-icons-from-csv.mjs from GPT's checked CSVs), or any array of rows
  // with {id, name, fullName, acceptedNames}.
  const MIN_SUGGEST_CHARS=2;
  const DEFAULT_SUGGEST_LIMIT=6;
  // Typo tolerance, all its numbers in one place (G Lead 2026-11-01, second rule). Lengths are folded letters (a-z, 0-9),
  // so accents never count as typos. A typed text with no exact name counts as icon X only when ALL of these hold:
  //  1 the text has at least minTypedLetters letters ("pel" is not yet "Pele");
  //  2 the edit distance (Levenshtein: one letter added, dropped or changed is 1) from the text to one of X's names is at
  //    most that name's allowance: 0 for 3 or fewer letters, 1 for 4 to 5, 2 for 6 or more ("posks" is 2 from "puskas");
  //  3 no OTHER icon has any name within othersWithin slips of the text, whatever that name's length, where a slip is a
  //    letter added, dropped or changed or two neighbours swapped (full Damerau-Levenshtein). So one or two slips on one
  //    icon's name can never count as another icon: that icon is within 2 and the text is refused ("reme" is 1 from Remy
  //    but 2 from Brehme: refused);
  //  4 the text is not a whole word of another icon's name ("Ronald" is Koeman's first name, not a typo of Ronaldo).
  // A refused typo is "not-in-list" and costs no guess chip. Only ever tighten these numbers.
  const TYPO_RULE=Object.freeze({minTypedLetters:4,oneEditFrom:4,twoEditsFrom:6,maxEdits:2,othersWithin:2});
  // Letters NFD does not split into base letter + accent.
  const SPECIAL_LETTERS=Object.freeze({"ø":"o","Ø":"o","æ":"ae","Æ":"ae","œ":"oe","Œ":"oe","ß":"ss","ẞ":"ss","đ":"d","Đ":"d","ð":"d","Ð":"d","þ":"th","Þ":"th","ł":"l","Ł":"l","ı":"i","ħ":"h","Ħ":"h","ŀ":"l","Ŀ":"l"});
  const SPECIAL_RE=new RegExp(`[${Object.keys(SPECIAL_LETTERS).join("")}]`,"g");

  // The comparison key of any text: plain lower-case a-z and 0-9 only.
  function inFold(text){
    return String(text??"").replace(SPECIAL_RE,ch=>SPECIAL_LETTERS[ch]).normalize("NFD").replace(/[̀-ͯ]/g,"")
      .toLowerCase().replace(/[^a-z0-9]/g,"");
  }
  // The same, but keeping word breaks, for word-start suggestions ("Petr Čech" -> ["petr","cech"]).
  function inWords(text){
    return String(text??"").replace(SPECIAL_RE,ch=>SPECIAL_LETTERS[ch]).normalize("NFD").replace(/[̀-ͯ]/g,"")
      .toLowerCase().replace(/['’.]/g,"").split(/[^a-z0-9]+/).filter(Boolean);
  }
  // Every name a row accepts, in order, without repeats under folding: card name, full name, then accepted_names.
  function inNamesFor(row){
    const seen=new Set(),names=[];
    for(const name of [row&&row.name,row&&row.fullName,...(Array.isArray(row&&row.acceptedNames)?row.acceptedNames:[])]){
      if(typeof name!=="string")continue;
      const text=name.trim(),key=inFold(text);
      if(!key||seen.has(key))continue;
      seen.add(key);names.push(text);
    }
    return Object.freeze(names);
  }

  // Build the lookup once per list. Throws on a row without an id or a name, or on a repeated id.
  function inIndex(rows){
    if(!Array.isArray(rows))throw new TypeError("icon list must be an array");
    const byKey=new Map(),entries=[],ids=new Set();
    for(const row of rows){
      const id=row&&row.id;
      if(typeof id!=="string"||!id)throw new TypeError("icon row without id");
      if(ids.has(id))throw new Error(`repeated icon id ${id}`);
      ids.add(id);
      const names=inNamesFor(row);
      if(!names.length)throw new Error(`icon ${id} has no name`);
      const keys=names.map(inFold);
      const words=[...new Set(names.flatMap(inWords))];
      for(const key of keys){
        if(!byKey.has(key))byKey.set(key,[]);
        if(!byKey.get(key).includes(id))byKey.get(key).push(id);
      }
      entries.push(Object.freeze({id,name:typeof row.name==="string"&&row.name.trim()?row.name.trim():names[0],fullName:typeof row.fullName==="string"?row.fullName.trim():null,
        names,keys:Object.freeze(keys),words:Object.freeze(words),sortKey:inFold(row.name||names[0])}));
    }
    // For typos: every (name key, icon) pair once, grouped by length, and which icons each whole name word belongs to.
    const typoKeys=[],wordOwners=new Map();
    for(const entry of entries){
      for(const key of new Set(entry.keys)){
        while(typoKeys.length<=key.length)typoKeys.push([]);
        typoKeys[key.length].push(Object.freeze({key,id:entry.id,bag:inBag(key)}));
      }
      for(const word of entry.words){
        if(!wordOwners.has(word))wordOwners.set(word,new Set());
        wordOwners.get(word).add(entry.id);
      }
    }
    return Object.freeze({size:entries.length,entries:Object.freeze(entries),byId:new Map(entries.map(e=>[e.id,e])),byKey,
      typoKeys:Object.freeze(typoKeys.map(Object.freeze)),wordOwners});
  }

  // Letter counts of a folded key (a-z then 0-9). One added, dropped or changed letter moves the counts by at most 2 in all
  // and a swap by 0, so names whose counts differ by more than 2 per allowed slip are skipped without the full count.
  function inBag(key){
    const bag=new Uint8Array(36);
    for(let i=0;i<key.length;i++){const c=key.charCodeAt(i);bag[c>=97?c-97:c-48+26]+=1;}
    return bag;
  }
  function inBagGap(x,y){let gap=0;for(let i=0;i<36;i++)gap+=x[i]>y[i]?x[i]-y[i]:y[i]-x[i];return gap;}
  // How many typo edits a name of this many folded letters allows (TYPO_RULE).
  function inTypoAllowance(length){
    if(length>=TYPO_RULE.twoEditsFrom)return 2;
    if(length>=TYPO_RULE.oneEditFrom)return 1;
    return 0;
  }
  // Edit distance between two folded keys, or max+1 as soon as it is known to be more than max. Plain Levenshtein (one
  // letter added, dropped or changed is 1 edit; two swapped letters are 2). With swaps=true, two neighbouring letters
  // swapped count as 1 edit (optimal string alignment): never more than Levenshtein, so it is used only where a smaller
  // distance makes the rule stricter, to judge whether ANOTHER icon is as close.
  // Only the cells within max of the diagonal are worked out (the rest are already more than max), so it stays quick.
  let rowA=new Int32Array(64),rowB=new Int32Array(64),rowC=new Int32Array(64);
  function inDistance(a,b,max=Infinity,swaps=false){
    a=String(a);b=String(b);
    if(a===b)return 0;
    const la=a.length,lb=b.length;
    if(!Number.isFinite(max))max=Math.max(la,lb);
    if(Math.abs(la-lb)>max)return max+1;
    if(rowA.length<=lb+1){rowA=new Int32Array(lb+2);rowB=new Int32Array(lb+2);rowC=new Int32Array(lb+2);}
    const far=max+1;
    let back=rowC,prev=rowA,cur=rowB;
    for(let j=0;j<=lb;j++)prev[j]=j<=max?j:far;
    for(let i=1;i<=la;i++){
      const lo=Math.max(1,i-max),hi=Math.min(lb,i+max);
      cur[0]=i<=max?i:far;
      if(lo>1)cur[lo-1]=far;
      let rowMin=lo===1?cur[0]:far;
      const ca=a.charCodeAt(i-1);
      for(let j=lo;j<=hi;j++){
        const cb=b.charCodeAt(j-1);
        let v=prev[j-1]+(ca===cb?0:1);
        if(prev[j]+1<v)v=prev[j]+1;
        if(cur[j-1]+1<v)v=cur[j-1]+1;
        if(swaps&&i>1&&j>1&&ca===b.charCodeAt(j-2)&&a.charCodeAt(i-2)===cb&&back[j-2]+1<v)v=back[j-2]+1;
        cur[j]=v;if(v<rowMin)rowMin=v;
      }
      if(hi<lb)cur[hi+1]=far;
      if(rowMin>max)return far;
      const t=back;back=prev;prev=cur;cur=t;
    }
    return prev[lb]>max?far:prev[lb];
  }
  // Full Damerau-Levenshtein distance (Lowrance-Wagner): any mix of letters added, dropped, changed and neighbours swapped,
  // each 1, including a swap next to another slip ("toure" -> "ture" -> "utre" is 2). Never more than the distances above.
  // Used only by rule 3, so that ANY two slips on another icon's name stay within reach of the refusal.
  let damTable=new Int32Array(0);const damLast=new Int32Array(128);
  function inDamerau(a,b){
    a=String(a);b=String(b);
    const la=a.length,lb=b.length,w=lb+2,inf=la+lb;
    if(damTable.length<(la+2)*w)damTable=new Int32Array((la+2)*w);
    const H=damTable;damLast.fill(0);
    H[0]=inf;
    for(let i=0;i<=la;i++){H[(i+1)*w]=inf;H[(i+1)*w+1]=i;}
    for(let j=0;j<=lb;j++){H[j+1]=inf;H[w+j+1]=j;}
    for(let i=1;i<=la;i++){
      let lastMatch=0;const ca=a.charCodeAt(i-1)&127;
      for(let j=1;j<=lb;j++){
        const cb=b.charCodeAt(j-1)&127,i1=damLast[cb],j1=lastMatch,cost=ca===cb?0:1;
        if(!cost)lastMatch=j;
        let v=H[i*w+j]+cost;
        if(H[(i+1)*w+j]+1<v)v=H[(i+1)*w+j]+1;
        if(H[i*w+j+1]+1<v)v=H[i*w+j+1]+1;
        const t=H[i1*w+j1]+(i-i1-1)+1+(j-j1-1);if(t<v)v=t;
        H[(i+1)*w+j+1]=v;
      }
      damLast[ca]=i;
    }
    return H[(la+1)*w+lb+1];
  }
  // Is another icon's name within two slips of the text? Quick checks first; the full count only when it can matter
  // (two slips are never more than 4 plain edits).
  function inWithinSlips(key,name,within,keyBag,nameBag){
    if(Math.abs(key.length-name.length)>within)return false;
    if(keyBag&&nameBag&&inBagGap(keyBag,nameBag)>2*within)return false;
    if(inDistance(key,name,within,true)<=within)return true;
    if(inDistance(key,name,2*within)>2*within)return false;
    return inDamerau(key,name)<=within;
  }
  // The one icon a typo points to, or null. key has no exact name in the index.
  function inTypo(index,key){
    if(key.length<TYPO_RULE.minTypedLetters||!index.typoKeys)return null;
    const buckets=index.typoKeys,last=buckets.length-1,max=TYPO_RULE.maxEdits,within=TYPO_RULE.othersWithin,bag=inBag(key);
    // Rule 2: the closest name within its own allowance (only names within max letters of the text's length can be).
    let winner=null,winnerD=Infinity;
    for(let length=Math.max(0,key.length-max);length<=Math.min(last,key.length+max);length++){
      const allowance=inTypoAllowance(length);
      if(!allowance)continue;
      for(const {key:name,id,bag:nameBag} of buckets[length]){
        if(inBagGap(bag,nameBag)>2*Math.min(allowance,winnerD))continue;
        const d=inDistance(key,name,Math.min(allowance,winnerD));
        if(d<=allowance&&d<winnerD){winner=id;winnerD=d;}
      }
    }
    if(!winner)return null;
    // Rule 3: no other icon has any name within othersWithin slips (added, dropped, changed or swapped letters, each 1).
    for(let length=Math.max(0,key.length-within);length<=Math.min(last,key.length+within);length++){
      for(const {key:name,id,bag:nameBag} of buckets[length])if(id!==winner&&inWithinSlips(key,name,within,bag,nameBag))return null;
    }
    // Rule 4: the text is not a whole word of another icon's name.
    const owners=index.wordOwners&&index.wordOwners.get(key);
    if(owners)for(const id of owners)if(id!==winner)return null;
    return {id:winner,distance:winnerD};
  }

  // What a typed guess means: {status:"empty"|"not-in-list"|"ambiguous"|"match", id?, ids?, usesChip}.
  // Only "match" uses a chip. A match found through a typo also has typo:true, the edit distance and the icon's card name
  // (so the screen can say who it counted as).
  function inMatch(index,text){
    const key=inFold(text);
    if(!key)return Object.freeze({status:"empty",usesChip:false});
    const ids=index.byKey.get(key);
    if(!ids){
      const typo=inTypo(index,key);
      if(!typo)return Object.freeze({status:"not-in-list",usesChip:false});
      return Object.freeze({status:"match",id:typo.id,usesChip:true,typo:true,distance:typo.distance,name:index.byId.get(typo.id).name});
    }
    if(ids.length>1)return Object.freeze({status:"ambiguous",ids:Object.freeze([...ids]),usesChip:false});
    return Object.freeze({status:"match",id:ids[0],usesChip:true});
  }
  // The guess against the answer: the match plus correct true/false (always false when no chip is used).
  function inCheck(index,text,answerId){
    const match=inMatch(index,text);
    return Object.freeze({...match,correct:match.status==="match"&&match.id===answerId});
  }

  // Live suggestions while typing, from MIN_SUGGEST_CHARS folded letters on. Best first:
  // 0 a whole name equals the text, 1 a name starts with it, 2 a word of a name starts with it, 3 a name contains it.
  // Ties go alphabetically by card name, then id, so both phones list the same order. Each icon appears once.
  function inSuggest(index,text,{limit=DEFAULT_SUGGEST_LIMIT,minChars=MIN_SUGGEST_CHARS}={}){
    const key=inFold(text);
    if(key.length<minChars)return Object.freeze([]);
    const queryWords=inWords(text);
    const scored=[];
    for(const entry of index.entries){
      let rank=null;
      if(entry.keys.includes(key))rank=0;
      else if(entry.keys.some(k=>k.startsWith(key)))rank=1;
      else if(queryWords.length&&queryWords.every(q=>entry.words.some(w=>w.startsWith(q))))rank=2;
      else if(entry.keys.some(k=>k.includes(key)))rank=3;
      if(rank!==null)scored.push([rank,entry]);
    }
    scored.sort((a,b)=>a[0]-b[0]||(a[1].sortKey<b[1].sortKey?-1:a[1].sortKey>b[1].sortKey?1:0)||(a[1].id<b[1].id?-1:a[1].id>b[1].id?1:0));
    return Object.freeze(scored.slice(0,Math.max(0,limit)).map(([,entry])=>Object.freeze({id:entry.id,name:entry.name,fullName:entry.fullName})));
  }

  // The shipped list (data/icons.js), or null when it is not loaded yet.
  function inDefaultRows(){
    if(root.CareerModeIcons&&Array.isArray(root.CareerModeIcons.players))return root.CareerModeIcons.players;
    if(typeof module!=="undefined"&&module.exports){
      try{const list=require("../data/icons.js");return list&&Array.isArray(list.players)?list.players:null;}catch(error){return null;}
    }
    return null;
  }
  let defaultIndex=null;
  function inDefaultIndex(){
    if(defaultIndex)return defaultIndex;
    const rows=inDefaultRows();
    return rows?(defaultIndex=inIndex(rows)):null;
  }

  return Object.freeze({contractVersion:1,feature:"cms-icon-names",minSuggestChars:MIN_SUGGEST_CHARS,suggestLimit:DEFAULT_SUGGEST_LIMIT,typoRule:TYPO_RULE,
    fold:inFold,words:inWords,namesFor:inNamesFor,index:inIndex,match:inMatch,check:inCheck,suggest:inSuggest,defaultIndex:inDefaultIndex,
    distance:inDistance,damerau:inDamerau,typoAllowance:inTypoAllowance});
});

```


## FILE: visual-assets/v10_1/icon-guess/index.html
```
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>Prime Pack</title>
<!--
  R87 Prime Pack page (HO-051, Team V skin on Team G's workstream C page). Art: Nik's GPT set (sealed pack, opening pack,
  black marble Prime card frame, full/spent guess tokens, desktop and phone stage plates) in ./assets as webp. The hooks,
  ids and messages are Team G's and unchanged; the skin only places and dresses them. (Re-applied by G Lead's Prime Pack
  thread 2026-11-01 onto the staged page: Team V's look, Team G's behaviour.)
  Spec: project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md · Look: R88_ICON_CARD_TEAM_V_BRIEF.md.
  G Lead 2026-11-01 10:30 UTC: the pack (it says PRIME PACK) opens, the card RISES (no flip) and then reveals in the
  game's four stages (round.stages; Nik's rule, G Lead 11:08 UTC: the position + 1 stat, then one more stat each, so at most
  4 stats in play; the flag and the overall stay ?? in every stage). Stage 5 has no guessing: the result (a right guess at
  any stage jumps straight there, or nobody) turns up everything left: the last stats, the flag, the overall and the name.
  One guess box each, both always on
  screen; each manager types only in their own. G Lead 10:44 UTC (HO-051): Duet builds how the screen WORKS, Team V restyles
  it with the real Prime Pack art in its own PR (this skin). The open and rise run on the stage clock: the sealed pack shows
  its opening art and fades out, then the card rises onto the pedestal; no flip, shake, flash or dimming.
  The name (G Lead 11:12): the #name plate is empty (no placeholder) in every stage, a reload included, and #nameValue in it
  is filled with the name only by the result (cms-ig-result: a right guess at any stage, or nobody after stage 4).
  The page never picks a player and never decides whether a guess is right. The game sends the round and the stages;
  the page shows them and sends typed text out. Wrong guesses are only ever shown on the phone that made them.
  No network: local fonts and the local art, no CDN, no EA assets, no photos. The flags are drawn in code.
  Restyling hooks for Team V (ids, logic never needs touching): #pack (#packWord, .pk-frame, .pk-crown, .pk-top, .pk-rule,
  .pk-17, #crack; the art is .sealed/.opened, #app[data-pack]), #rays, #glow, #shards (empty), #card,
  #pos, #flag, #ovr, #stat-PAC..#stat-PHY (.tile.stat[data-stat]), #name (#nameValue), #beat (stage label),
  #ring (timer), #boxOne / #boxTwo (.gbox[data-role][data-me][data-out][data-won]), #chipsOne / #chipsTwo (.chip, .used),
  #guess, #go, #other (read-only box), #suggest, #note, #banner (result), #cta (Continue), #source.
  State to style on: [data-shown="1"] on a tile, .fresh on the parts the current stage just turned up, [hidden].
-->
<style>
@font-face { font-family: "Barlow Condensed"; font-weight: 600; font-display: swap; src: url("../shared/fonts/barlow-condensed-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Barlow Condensed"; font-weight: 700; font-display: swap; src: url("../shared/fonts/barlow-condensed-latin-700-normal.woff2") format("woff2"); }
:root {
  --ink: #07080a; --text: #f4f1ea; --text-2: #d6c9a6;
  --foil-1: #fff6d2; --foil-2: #f1cf7a; --foil-3: #c4932f; --foil-4: #7d5a17;
  --slot-ink: #fff1c9; --slot-label: #e2bf6a;
  --daniel: #8fc6e4; --nik: #f0d900;
  --cond: "Barlow Condensed", "Arial Narrow", sans-serif; --body: "Barlow Condensed", system-ui, sans-serif; /* only the two condensed weights: r87 already serves them to framed pages offline */
  --reveal: 520ms; --ease: cubic-bezier(.22, 1, .36, 1);
  color-scheme: dark;
}
html.rm { --reveal: 220ms; }
html, body { height: 100%; margin: 0; }
body { background: #050403; color: var(--text); font-family: var(--body);
  overflow: hidden; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; }
/* #app follows the visual viewport, so with the iPhone keyboard open everything sits above it (nothing behind the keyboard).
   layoutStage() measures it and sets the stage numbers below; every part is placed from them, so nothing overlaps at any size. */
#app { position: fixed; left: 0; right: 0; top: 0; height: 100%; overflow: hidden;
  --st-l: 0px; --st-t: 0px; --st-w: 100vw; --st-h: 100vh; --ped: 60vh; --card-w: 200px; --card-h: 300px; --floor: 66vh; --top: 88px; --box-w: 300px; --box-y: 40vh; }
html.kb .packtitle { display: none; }
[hidden] { display: none !important; }

/* ---------- Nik's stage art: marble hall, pedestal, gold arcs (desktop plate wide, phone plate tall) ---------- */
.stage { position: absolute; left: var(--st-l); top: var(--st-t); width: var(--st-w); height: var(--st-h); z-index: 0; pointer-events: none;
  background: #050403 url("assets/stage_desktop.webp") center / 100% 100% no-repeat; }
#app[data-shape="tall"] .stage { background-image: url("assets/stage_phone.webp"); }

/* ---------- top: PRIME PACK, the stage and its timer, then the result line ---------- */
.top { position: absolute; left: 12px; right: 12px; top: calc(env(safe-area-inset-top, 0px) + 6px); z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.packtitle { margin: 0; text-align: center; font: 700 clamp(22px, 3.2vh, 38px)/1 var(--cond); letter-spacing: .3em; padding-left: .3em; text-transform: uppercase;
  background: linear-gradient(180deg, #fffdf2 0%, #fff0b8 32%, #f2c35a 52%, #a8731f 56%, #f3cf73 76%, #fff3c6 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 0 #1d1404); }
.status { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 46px; }
.beat { font: 700 18px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--foil-1); text-shadow: 0 2px 6px #000; white-space: nowrap; }
.beat.last { color: #ffd77a; }
.ring { width: 46px; height: 46px; position: relative; flex: none; border-radius: 50%; background: radial-gradient(circle, #1a150c 0 60%, #0c0a06 61%); box-shadow: 0 0 0 1.5px var(--foil-4), 0 4px 10px rgba(0,0,0,.6); }
.ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring circle { fill: none; stroke-width: 3.5; }
.ring .track { stroke: rgba(255,240,200,.16); }
.ring .left { stroke: var(--foil-2); stroke-linecap: round; }
.ring.low .left { stroke: #ff9a6a; }
.ring b { position: absolute; inset: 0; display: grid; place-items: center; font: 700 20px/1 var(--cond); color: var(--foil-1); }
.pill { font: 700 16px/1 var(--cond); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); padding: 8px 14px 7px; border-radius: 999px;
  background: linear-gradient(180deg, var(--foil-1), var(--foil-2) 55%, var(--foil-3)); box-shadow: 0 3px 10px rgba(0,0,0,.55); }
.source { text-align: center; font: 600 13px/1.2 var(--cond); letter-spacing: .2em; text-transform: uppercase; color: var(--foil-2); min-height: 16px; text-shadow: 0 2px 4px #000; }
.source:empty { display: none; }

/* ---------- result line (no dimming layer: it takes the timer's place, never over the card or the boxes) ---------- */
.banner { text-align: center; font: 700 clamp(24px, 4.4vh, 44px)/1 var(--cond); letter-spacing: .06em; text-transform: uppercase;
  background: linear-gradient(180deg, #fffdf2 0%, #fff0b8 30%, #f2c35a 50%, #a8731f 54%, #f3cf73 74%, #fff3c6 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 0 #2a1c05); animation: pop 600ms var(--ease) both; }
.banner.draw { background: none; color: var(--text); filter: none; text-shadow: 0 2px 6px #000; }
html.rm .banner { animation: fade 220ms linear both; }
@keyframes pop { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

/* ---------- the stage: Nik's PRIME PACK on the pedestal; on the stage clock it opens (his opening art) and fades out, then
   the card rises out of it (paintCard drives both: no flip, no flash) ---------- */
.stagewrap { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.pack { position: absolute; z-index: 2; height: calc(var(--card-h) * 1.02); aspect-ratio: 1024 / 1420;
  left: 50%; top: calc(var(--ped) - var(--card-h) * 1.02); transform: translateX(-50%); }
.pack i { position: absolute; inset: 0; background: center / 100% 100% no-repeat; transition: opacity 260ms linear; }
.pack .sealed { background-image: url("assets/pack_sealed.webp"); }
.pack .opened { background-image: url("assets/pack_opening.webp"); opacity: 0; }
#app[data-pack="open"] .pack .sealed { opacity: 0; }
#app[data-pack="open"] .pack .opened { opacity: 1; }
.pack .pk-word { position: absolute; left: 12%; right: 10%; top: 31%; margin: 0; display: flex; flex-direction: column; align-items: center; gap: .02em;
  font: 700 calc(var(--card-h) * .105)/.92 var(--cond); letter-spacing: .14em; padding-left: .14em; text-transform: uppercase;
  background: linear-gradient(180deg, #fffdf2 0%, #ffe9a0 35%, #e0ad45 55%, #9a6a1c 60%, #f0cc70 80%, #fff1c0 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 0 #120c02); }
.pack .pk-word span { display: block; font-size: .78em; letter-spacing: .34em; padding-left: .34em; }
.pack .pk-frame, .pack .pk-crown, .pack .pk-top, .pack .pk-rule, .pack .pk-17, .pack .crack { display: none; }
/* hooks kept for later art; empty and out of the layout */
.rays, .glow, .shards { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }

/* ---------- the card: Nik's black marble Prime frame, standing on the pedestal ---------- */
.card { position: absolute; z-index: 1; width: var(--card-w); height: var(--card-h); left: calc(50% - var(--card-w) / 2); top: calc(var(--ped) - var(--card-h)); container-type: size;
  opacity: 0; visibility: hidden; pointer-events: auto; }
.card .foil { display: none; }
.card .face { position: absolute; inset: 0; background: url("assets/card_frame.webp") center / 100% 100% no-repeat; overflow: hidden;
  filter: drop-shadow(0 14px 26px rgba(0,0,0,.6)); }
.card .face::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,240,196,.22) 50%, rgba(255,255,255,0) 60%) 0 0 / 300% 100% no-repeat;
  -webkit-mask: url("assets/card_frame.webp") center / 100% 100% no-repeat; mask: url("assets/card_frame.webp") center / 100% 100% no-repeat;
  animation: sheen 6s var(--ease) infinite 1.2s; }
@keyframes sheen { 0%, 70% { background-position: 100% 0; } 100% { background-position: 0 0; } }
.inner-line, .portrait, .iconword, .side .rule, .underline, .stats .divider { display: none; }

/* slots measured on Nik's frame (03_prime_card_frame, 1024x1536): shield = overall, plate under it = position,
   six stat plates in two columns, small plate at the foot = flag; the name sits on the gold line above the stats */
.side { position: absolute; inset: 0; z-index: 2; }
/* a slot (and the overall, flag and name) shows "??" until its stage or the result; the value then rises into place. No flip. */
.tile { position: relative; }
.side .tile, .nameplate { position: absolute; }
.tile .b, .tile .f { position: absolute; inset: 0; display: flex; align-items: center; transition: transform var(--reveal) var(--ease), opacity var(--reveal) linear; }
.tile .f { opacity: 0; transform: translateY(40%) scale(.9); }
.tile[data-shown="1"] .b { opacity: 0; transform: translateY(-30%); }
.tile[data-shown="1"] .f { opacity: 1; transform: none; }
html.rm .tile .b, html.rm .tile .f { transform: none !important; }
.big .b, .big .f { justify-content: center; }
.ovrtile { left: 13.9cqw; top: 13.7cqh; width: 21.5cqw; height: 13.4cqh; }
.ovrtile .b, .ovr { font: 700 15cqw/1 var(--cond); letter-spacing: -.01em; }
.ovrtile .b { color: var(--foil-3); }
.ovr { color: var(--slot-ink); text-shadow: 0 0 2.4cqw rgba(241,207,122,.55); }
.ovrtile.fresh .f { text-shadow: 0 0 3cqw rgba(241,207,122,.95); }
.postile { left: 14.3cqw; top: 32.2cqh; width: 20.3cqw; height: 6.1cqh; }
.postile .b, .pos { font: 700 7.4cqw/1 var(--cond); letter-spacing: .06em; }
.postile .b { color: var(--foil-3); }
.pos { color: var(--slot-ink); }
.flagtile { left: 42.2cqw; top: 84.5cqh; width: 16.8cqw; height: 6.6cqh; }
.flagtile .b { justify-content: center; color: var(--foil-3); font: 700 6.4cqw/1 var(--cond); }
.flagtile .f { justify-content: center; }
.flagtile canvas { width: 76%; height: 70%; display: block; border-radius: .5cqw; box-shadow: 0 0 0 .4cqw rgba(196,147,47,.7); }
.flagtile.fresh .f canvas { box-shadow: 0 0 0 .4cqw rgba(196,147,47,.7), 0 0 4cqw rgba(241,207,122,.95); }
/* HO-051 addendum A (Nik): the frame has no name slot, so the plate is built here in the frame's gold-rim style: one wide
   plate (70% of the card) centred on the gold line under the silhouette. Empty and dark while guessing (never a hint);
   the name fades in when guessing ends, and a long name shrinks to one line (fitName), never cut off. */
.nameplate { left: 15cqw; right: 15cqw; top: 55.3cqh; height: 6cqh; text-align: center; z-index: 2; border-radius: 1.3cqw; box-sizing: border-box;
  background: linear-gradient(180deg, #1a150d 0%, #0b0906 100%);
  box-shadow: inset 0 0 0 .55cqw #c99a3c, inset 0 0 0 .95cqw #3a2a0e, inset 0 0 0 1.25cqw rgba(241,207,122,.45), 0 .6cqw 1.6cqw rgba(0,0,0,.6);
  font: 700 7.6cqw/1 var(--cond); letter-spacing: .05em; text-transform: uppercase; color: var(--slot-ink); white-space: nowrap; }
.nametile .b { visibility: hidden; }
.nametile .b, .nametile .f { justify-content: center; overflow: hidden; transform: none !important; }
.nametile .f { left: 3cqw; right: 3cqw; opacity: 0; transition: opacity 650ms linear; text-shadow: 0 0 2cqw rgba(241,207,122,.45); }
.nametile[data-shown="1"] .f { opacity: 1; }
.stats { position: absolute; left: 16cqw; right: 15.2cqw; top: 61.85cqh; display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column;
  grid-template-rows: repeat(3, 5.86cqh); column-gap: 11.7cqw; row-gap: 1.43cqh; z-index: 2; }
.stat .b, .stat .f { justify-content: center; gap: 3cqw; font: 700 6.6cqw/1 var(--cond); }
.stat .b i { font-style: normal; color: var(--foil-3); letter-spacing: .06em; width: 8cqw; text-align: right; }
.stat .b span, .stat .f span { color: var(--slot-label); font-size: 5.4cqw; letter-spacing: .08em; width: 9cqw; }
.stat .f em { font-style: normal; color: var(--slot-ink); width: 8cqw; text-align: right; }
.stat.fresh .f em { color: #ffe08a; text-shadow: 0 0 2.4cqw rgba(241,207,122,.95); }

/* ---------- the two boxes: Daniel's (left) and Nik's (right), both always on screen, each with his two guess tokens ---------- */
.guessbar { position: absolute; z-index: 3; }
#app[data-shape="wide"] .guessbar { inset: 0; pointer-events: none; }
#app[data-shape="tall"] .guessbar { left: 10px; right: 10px; top: calc(var(--floor) + 6px); display: flex; gap: 10px; align-items: stretch; }
.gbox { pointer-events: auto; box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "who chips" "slot slot";
  align-items: center; gap: 8px; padding: 10px 12px 8px; border-radius: 6px; min-width: 0;
  background:
    linear-gradient(32deg, rgba(255,255,255,0) 46%, rgba(196,147,47,.16) 47.5%, rgba(255,255,255,0) 49%),
    linear-gradient(151deg, rgba(255,255,255,0) 62%, rgba(230,196,120,.10) 63.2%, rgba(255,255,255,0) 64.6%),
    linear-gradient(180deg, #1c170e 0%, #0e0c08 100%);
  box-shadow: inset 0 0 0 1.5px var(--foil-3), inset 0 0 0 4px #0e0c08, inset 0 0 0 5px rgba(241,207,122,.35), 0 10px 26px rgba(0,0,0,.6); }
.gbox[data-role="playerTwo"] { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "chips who" "slot slot"; }
.gbox[data-won="1"] { box-shadow: inset 0 0 0 1.5px var(--foil-2), inset 0 0 0 4px #0e0c08, inset 0 0 0 5px rgba(241,207,122,.6), 0 0 18px rgba(241,207,122,.45), 0 10px 26px rgba(0,0,0,.6); }
#app[data-shape="tall"] .gbox { flex: 1 1 0; }
#app[data-shape="wide"] .gbox { position: absolute; width: var(--box-w); top: var(--box-y); }
#app[data-shape="wide"] #boxOne { left: calc(50% - var(--card-w) / 2 - 32px - var(--box-w)); }
#app[data-shape="wide"] #boxTwo { left: calc(50% + var(--card-w) / 2 + 32px); }
.gbox .who { grid-area: who; display: flex; align-items: center; gap: 8px; min-height: 30px; min-width: 0;
  font: 700 20px/1 var(--cond); letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
.gbox .who span:first-child { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.gbox[data-role="playerTwo"] .who { flex-direction: row-reverse; }
.gbox[data-role="playerOne"] .who { color: var(--daniel); }
.gbox[data-role="playerTwo"] .who { color: var(--nik); }
.gbox .you { font: 700 11px/1 var(--cond); letter-spacing: .14em; color: var(--ink); background: var(--foil-2); padding: 3px 5px 2px; border-radius: 2px; flex: none; }
.gbox:not([data-me="1"]) .you { display: none; }
.chips { grid-area: chips; display: flex; gap: 6px; flex: none; }
.chip { width: 30px; height: 30px; display: block; transition: transform 300ms var(--ease);
  background: url("assets/token_full.webp") center / contain no-repeat; filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
.chip.used { background-image: url("assets/token_spent.webp"); transform: scale(.9); }
.gbox .slot { grid-area: slot; min-height: 46px; min-width: 0; display: flex; }
.mine { flex: 1; min-width: 0; }
/* the suggestions open from the top of the boxes: above both on a phone (the row), above this phone's own box on a wide screen */
/* the other manager's box: read only (his tokens and whether he is out, never what he typed) */
.ro { flex: 1; min-width: 0; height: 46px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 8px;
  border-radius: 4px; border: 1.5px solid rgba(196,147,47,.55); background: #0b0906; font: 600 15px/1.05 var(--body); letter-spacing: .04em; color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none; }
.gbox[data-out="1"] .ro { color: #ffb48a; border-color: rgba(255,180,138,.45); }
.gbox[data-won="1"] .ro { color: var(--foil-1); border-color: var(--foil-2); }

/* ---------- guess bar (lives in this phone's own box): suggestions open upwards, so the iPhone keyboard never hides them ---------- */
.row { display: flex; gap: 6px; }
.row input { flex: 1; min-width: 0; height: 46px; box-sizing: border-box; border-radius: 4px; border: 1.5px solid rgba(241,207,122,.7); background: #0b0906; color: var(--text);
  font: 600 18px/1 var(--body); letter-spacing: .02em; padding: 0 10px; outline: none; }
.row input::placeholder { color: #a99a76; }
/* the round is over: the own box's line ("Named him · +3", "Round over") gets the whole box, so the Guess button never cuts it */
#app[data-over="1"] .row #go { display: none; }
#app[data-over="1"] .row input { text-align: center; }
.row input:focus { border-color: var(--foil-2); box-shadow: 0 0 0 3px rgba(241,207,122,.22); }
.row input:disabled { border-color: rgba(196,147,47,.45); color: #b3a580; }
.btn { height: 46px; padding: 0 14px; border: 0; border-radius: 4px; font: 700 18px/1 var(--cond); letter-spacing: .1em; text-transform: uppercase; color: var(--ink); flex: none;
  background: linear-gradient(180deg, var(--foil-1), var(--foil-2) 55%, var(--foil-3)); box-shadow: inset 0 1px 0 #fff, 0 3px 8px rgba(0,0,0,.5); cursor: pointer; }
.btn:disabled { background: linear-gradient(180deg, #4d4430, #2f2919); color: #b3a580; box-shadow: inset 0 0 0 1px rgba(196,147,47,.5); cursor: default; }
.suggest { position: absolute; left: 0; right: 0; bottom: calc(100% + 6px); margin: 0; padding: 4px; list-style: none; border-radius: 4px; background: #1b1810;
  border: 1px solid rgba(241,207,122,.55); box-shadow: 0 -8px 20px rgba(0,0,0,.55); max-height: 40vh; overflow: auto; z-index: 5; }
.suggest li { padding: 11px 10px; font: 600 18px/1.1 var(--body); letter-spacing: .02em; color: var(--text); border-radius: 3px; cursor: pointer; }
.suggest li[aria-selected="true"], .suggest li:hover { background: rgba(241,207,122,.16); }
.note { min-height: 18px; margin-top: 5px; font: 600 15px/1.15 var(--body); letter-spacing: .03em; text-align: center; color: var(--text-2); }
.note.warn { color: #ffb48a; }

/* ---------- Continue: under the boxes on a phone, under the pedestal on a wide screen ---------- */
.cta { position: absolute; z-index: 3; height: 50px; font-size: 20px; padding: 0 34px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
#app[data-shape="wide"] .cta { top: calc((var(--floor) + 100%) / 2 - 25px); }
#app[data-shape="tall"] .cta { left: 10px; right: 10px; transform: none; top: calc(var(--floor) + 6px + var(--boxes-h, 76px) + 12px); }

/* small screens */
#app[data-shape="tall"] .gbox { padding: 8px 8px 7px; gap: 7px; }
#app[data-shape="tall"] .gbox .who { font-size: min(18px, 4.5vw); letter-spacing: .05em; gap: 5px; }
#app[data-shape="tall"] .chips { gap: 4px; }
#app[data-shape="tall"] .chip { width: min(28px, 6.6vw); height: min(28px, 6.6vw); }
#app[data-shape="tall"] .btn:not(.cta) { padding: 0 10px; font-size: 16px; }
#app[data-shape="tall"] .row input { font-size: 16px; padding: 0 8px; }
#app[data-shape="tall"] .ro { font-size: 14px; }
#app.short .packtitle { font-size: 18px; }
#app.short .status { min-height: 40px; }
#app.short .ring { width: 40px; height: 40px; }
#app.short .banner { font-size: 24px; }
#app[data-shape="tall"] .banner { font-size: min(7.2vw, 34px); white-space: nowrap; }

/* the test clock freezes every CSS transition and animation, so a still is the end state of each moment */
html.still *, html.still *::before, html.still *::after { transition: none !important; animation: none !important; }
@media (prefers-reduced-motion: reduce) { .card .face::after { animation: none; } .chip { transition: none; } }
html.rm .card .face::after { animation: none; }
</style>
</head>
<body>
<div id="app" data-pack="sealed" data-shape="tall">
  <div class="stage" id="stage" aria-hidden="true"></div>

  <div class="top">
  <h1 class="packtitle" id="packTitle">Prime Pack</h1>
  <div class="status" id="status">
    <span class="pill" id="waiting" hidden></span>
    <span class="beat" id="beat"></span>
    <span class="ring" id="ring" hidden><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="track" cx="20" cy="20" r="17"/><circle class="left" id="ringLeft" cx="20" cy="20" r="17" stroke-dasharray="106.8" stroke-dashoffset="0"/></svg><b id="ringNum"></b></span>
  </div>
  <div class="banner" id="banner" hidden></div>
  <div class="source" id="source"></div>
  </div>

  <div class="stagewrap" id="stagewrap">
    <div class="rays" id="rays" aria-hidden="true"></div>
    <div class="glow" id="glow" aria-hidden="true"></div>
    <div class="pack" id="pack" aria-label="Prime Pack">
      <i class="sealed"></i><i class="opened"></i>
      <div class="pk-frame"></div>
      <div class="pk-crown"></div>
      <div class="pk-top">FIFA 17 SHOWDOWN</div>
      <p class="pk-word" id="packWord">PRIME<span>PACK</span></p>
      <div class="pk-rule"></div>
      <div class="pk-17">17</div>
      <div class="crack" id="crack"></div>
    </div>
    <div class="shards" id="shards" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="card" id="card" aria-label="Prime Pack card">
      <div class="foil"></div>
      <div class="face">
        <div class="inner-line"><svg viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><polygon points="50,0 88,4.9 100,15.4 100,124.6 88,135.1 50,140 12,135.1 0,124.6 0,15.4 12,4.9"/></svg></div>
        <div class="portrait" id="portrait"></div>
        <div class="iconword">PRIME</div>
        <div class="side">
          <div class="tile big ovrtile" id="ovr" data-shown="0"><div class="b">??</div><div class="f ovr" id="ovrValue"></div></div>
          <div class="tile big postile" id="pos" data-shown="0"><div class="b pos">??</div><div class="f pos" id="posValue"></div></div>
          <div class="rule"></div>
          <div class="tile big flagtile" id="flag" data-shown="0"><div class="b">?</div><div class="f"><canvas id="flagCanvas" width="180" height="120"></canvas></div></div>
        </div>
        <div class="tile nameplate nametile" id="name" data-shown="0"><div class="b"></div><div class="f" id="nameValue"></div></div>
        <div class="underline"></div>
        <div class="stats" id="stats"><div class="divider"></div></div>
      </div>
    </div>
  </div>

  <div class="guessbar" id="guessbar">
    <div class="gbox" id="boxOne" data-role="playerOne" data-me="0" data-out="0" data-won="0">
      <div class="who"><span id="nameOne">Daniel</span><span class="you">YOU</span></div>
      <div class="slot" id="slotOne"></div>
      <span class="chips" id="chipsOne" data-role="playerOne" data-count="2" aria-label="2 guesses left"><i class="chip"></i><i class="chip"></i></span>
    </div>
    <div class="gbox" id="boxTwo" data-role="playerTwo" data-me="0" data-out="0" data-won="0">
      <div class="who"><span id="nameTwo">Nik</span><span class="you">YOU</span></div>
      <div class="slot" id="slotTwo"></div>
      <span class="chips" id="chipsTwo" data-role="playerTwo" data-count="2" aria-label="2 guesses left"><i class="chip"></i><i class="chip"></i></span>
    </div>
    <!-- this manager's own box: moved into their slot on load -->
    <div class="mine" id="mine">
      <ul class="suggest" id="suggest" role="listbox" hidden></ul>
      <form class="row" id="form" autocomplete="off">
        <input id="guess" name="guess" type="text" inputmode="text" enterkeyhint="send" autocapitalize="words" autocorrect="off" spellcheck="false" placeholder="Who is he?" aria-label="Your guess" aria-controls="suggest" disabled>
        <button class="btn" id="go" type="submit" disabled>Guess</button>
      </form>
      <div class="note" id="note" aria-live="polite"></div>
    </div>
    <!-- the other manager's box: read only, it shows their tokens and whether they are out, never what they typed -->
    <div class="ro" id="other" aria-live="polite"></div>
  </div>
  <button class="btn cta" id="cta" type="button" hidden>Continue</button>
</div>

<script>
(function(){
"use strict";
/* ================= constants ================= */
const STAT_KEYS = ["PAC","SHO","PAS","DRI","DEF","PHY"];            // FIFA layout: left column PAC SHO PAS, right DRI DEF PHY
const ROLES = ["playerOne","playerTwo"];                            // playerOne = Daniel (top box), playerTwo = Nik (bottom box), as on the Special Player page
const LAST_BEAT = 3;                                                // four stages, 0..3
const CHIPS_PER_MANAGER = 2;                                        // two guesses each for the whole round
// The page holds no timings of its own in play: every stage's points, reveal and guess time, and what it shows come with
// round.stages (js/iconGuess.js STAGES, G Lead 2026-11-01 10:30 UTC). Only the preview (no embed) carries a copy, below.
// Where the newly shown parts of a stage land inside its reveal (as a share of that stage's revealMs): stage 1 first opens
// the pack and raises the card, so its parts come late.
const PACK_OUT = .3, CARD_UP = .7;                                  // stage 1: the pack fades out, then the card slides up
const ITEMS_FIRST = [.78, .95], ITEMS_LATER = [.15, .8];
const EMBED = /[?&]embed=1(&|$)/.test(location.search);
const QS = new URLSearchParams(location.search);
const REDUCED = QS.get("rm")==="1" || (typeof matchMedia==="function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
const NAME_AFTER_MS = REDUCED ? 300 : 900;                          // the result: who won first, then the name
if(REDUCED) document.documentElement.classList.add("rm");
const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, x) => { const k=clamp((x-a)/(b-a),0,1); return k*k*(3-2*k); };

/* ================= messages to the game ================= */
function toGame(type, data){
  const msg = Object.assign({ type }, data || {});
  try { window.dispatchEvent(new CustomEvent("cms-ig", { detail: msg })); } catch(e) {}
  if(EMBED){ try { parent.postMessage(msg, location.origin); } catch(e) {} }
}
window.addEventListener("error", (e) => { if(EMBED){ try{ parent.postMessage({type:"cms-ig-error", message:String(e && e.message || "error")}, location.origin); }catch(_e){} } });

/* ================= clock (real time, or the test clock) ================= */
let frozen = QS.get("still")==="1", manualMs = 0;
const realNow = () => performance.now();
const now = () => frozen ? manualMs : realNow();
if(frozen) document.documentElement.classList.add("still");

/* ================= state ================= */
const S = {
  round: null, stages: null, me: "playerTwo", names: { playerOne: "Daniel", playerTwo: "Nik" },
  beat: -1, revealEndsAt: null, closesAt: null, nameAt: null,
  chips: { playerOne: CHIPS_PER_MANAGER, playerTwo: CHIPS_PER_MANAGER },
  waitingFor: null, countIn: false, view: { opening: 0, cardUp: false }, result: null, points: null, pending: false, suggestions: [], active: -1, continued: false
};

/* ================= art: silhouette and flags (drawn in code; generic, the same for every player) ================= */
const SILHOUETTE = '<svg viewBox="0 0 300 300" aria-hidden="true"><defs>'+
  '<linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d6232"/><stop offset=".6" stop-color="#4a3a1c"/><stop offset="1" stop-color="#2f2511"/></linearGradient>'+
  '<radialGradient id="halo" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#fff7da" stop-opacity=".95"/><stop offset="1" stop-color="#fff7da" stop-opacity="0"/></radialGradient></defs>'+
  '<ellipse cx="150" cy="128" rx="140" ry="120" fill="url(#halo)"/>'+
  '<g id="bust"><path d="M150 40c-27 0-45 21-45 50 0 19 7 35 17 45l-2 22c-1 8-6 13-14 16l-46 17c-24 9-38 28-40 54l-2 26h264l-2-26c-2-26-16-45-40-54l-46-17c-8-3-13-8-14-16l-2-22c10-10 17-26 17-45 0-29-18-50-45-50z" fill="url(#sil)"/>'+
  '<path d="M124 172l26 30 26-30" fill="none" stroke="#c4932f" stroke-width="5" stroke-linejoin="round" opacity=".75"/></g>'+
  '<path d="M118 66c8-17 20-24 32-24" fill="none" stroke="#fff3c4" stroke-width="4" stroke-linecap="round" opacity=".5"/></svg>';

/* simple real flags drawn in code: h = horizontal bands top to bottom, v = vertical bands left to right */
const FLAGS = { FR:["v","#0055a4","#ffffff","#ef4135"], IT:["v","#009246","#ffffff","#ce2b37"], IE:["v","#169b62","#ffffff","#ff883e"], BE:["v","#1a1a1a","#fdda24","#ef3340"],
  CI:["v","#f77f00","#ffffff","#009e60"], NG:["v","#008751","#ffffff","#008751"], ML:["v","#14b53a","#fcd116","#ce1126"], RO:["v","#002b7f","#fcd116","#ce1126"], MX:["v","#006847","#ffffff","#ce1126"],
  DE:["h","#000000","#dd0000","#ffce00"], NL:["h","#ae1c28","#ffffff","#21468b"], AT:["h","#ed2939","#ffffff","#ed2939"], HU:["h","#ce2939","#ffffff","#477050"], BG:["h","#ffffff","#00966e","#d62612"],
  RU:["h","#ffffff","#0039a6","#d52b1e"], UA:["h","#0057b7","#ffd700"], PL:["h","#ffffff","#dc143c"], HR:["h","#ff0000","#ffffff","#171796"], RS:["h","#c6363c","#0c4076","#ffffff"],
  CO:["h","#fcd116","#fcd116","#003893","#ce1126"], PY:["h","#d52b1e","#ffffff","#0038a8"], GA:["h","#009e60","#fcd116","#3a75c4"], EE:["h","#0072ce","#000000","#ffffff"] };
function star(ctx, cx, cy, r){ ctx.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.4:r; ctx[i?"lineTo":"moveTo"](cx+Math.cos(a)*rr, cy+Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); }
function cross(ctx, w, h, fg, cx, t){ ctx.fillStyle=fg; ctx.fillRect(cx-t/2,0,t,h); ctx.fillRect(0,h/2-t/2,w,t); }
function nordic(ctx, w, h, bg, fg, inner){ ctx.fillStyle=bg; ctx.fillRect(0,0,w,h); const cx=w*.36; ctx.fillStyle=fg; ctx.fillRect(cx-h*.12,0,h*.24,h); ctx.fillRect(0,h*.38,w,h*.24); if(inner){ ctx.fillStyle=inner; ctx.fillRect(cx-h*.06,0,h*.12,h); ctx.fillRect(0,h*.44,w,h*.12); } }
function drawFlag(canvas, code){
  const ctx=canvas.getContext("2d"), w=canvas.width, h=canvas.height; ctx.clearRect(0,0,w,h);
  const c=String(code||"").toUpperCase(), band=(cols,vertical)=>cols.forEach((col,i)=>{ ctx.fillStyle=col; vertical?ctx.fillRect(i*w/cols.length,0,w/cols.length+1,h):ctx.fillRect(0,i*h/cols.length,w,h/cols.length+1); });
  if(FLAGS[c]){ const f=FLAGS[c]; band(f.slice(1), f[0]==="v");
    if(c==="MX"){ ctx.fillStyle="#7a5230"; ctx.beginPath(); ctx.ellipse(w/2,h/2,h*.11,h*.14,0,0,7); ctx.fill(); } }
  else if(c==="EN"||c==="GB-ENG"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h); cross(ctx,w,h,"#ce1124",w/2,h*.2); }
  else if(c==="GB-SCT"||c==="SCO"){ ctx.fillStyle="#005eb8"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="#fff"; ctx.lineWidth=h*.2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w,h); ctx.moveTo(w,0); ctx.lineTo(0,h); ctx.stroke(); }
  else if(c==="GB-NIR"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h); cross(ctx,w,h,"#c8102e",w/2,h*.2); }
  else if(c==="GB-WLS"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h/2); ctx.fillStyle="#00b140"; ctx.fillRect(0,h/2,w,h/2); ctx.fillStyle="#d30731";
    ctx.beginPath(); ctx.moveTo(w*.22,h*.62); ctx.quadraticCurveTo(w*.3,h*.3,w*.5,h*.34); ctx.lineTo(w*.66,h*.22); ctx.lineTo(w*.7,h*.36); ctx.quadraticCurveTo(w*.8,h*.5,w*.72,h*.7); ctx.lineTo(w*.6,h*.62); ctx.lineTo(w*.5,h*.76); ctx.lineTo(w*.4,h*.64); ctx.closePath(); ctx.fill(); }
  else if(c==="SE") nordic(ctx,w,h,"#006aa7","#fecc02");
  else if(c==="DK") nordic(ctx,w,h,"#c8102e","#ffffff");
  else if(c==="NO") nordic(ctx,w,h,"#ba0c2f","#ffffff","#00205b");
  else if(c==="FI") nordic(ctx,w,h,"#ffffff","#002f6c");
  else if(c==="IS") nordic(ctx,w,h,"#02529c","#ffffff","#dc1e35");
  else if(c==="CH"){ ctx.fillStyle="#da291c"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#fff"; const s=h; ctx.fillRect(w/2-s*.1,h/2-s*.32,s*.2,s*.64); ctx.fillRect(w/2-s*.32,h/2-s*.1,s*.64,s*.2); }
  else if(c==="ES"){ band(["#aa151b","#f1bf00","#f1bf00","#aa151b"],false); ctx.fillStyle="#aa151b"; ctx.fillRect(w*.24,h*.36,w*.1,h*.28); }
  else if(c==="PT"){ ctx.fillStyle="#da291c"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#046a38"; ctx.fillRect(0,0,w*.4,h); ctx.strokeStyle="#ffe000"; ctx.lineWidth=h*.05; ctx.beginPath(); ctx.arc(w*.4,h/2,h*.2,0,7); ctx.stroke();
    ctx.fillStyle="#fff"; ctx.fillRect(w*.4-h*.09,h/2-h*.11,h*.18,h*.22); }
  else if(c==="BR"){ ctx.fillStyle="#009c3b"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#ffdf00"; ctx.beginPath(); ctx.moveTo(w*.08,h/2); ctx.lineTo(w/2,h*.1); ctx.lineTo(w*.92,h/2); ctx.lineTo(w/2,h*.9); ctx.fill();
    ctx.fillStyle="#002776"; ctx.beginPath(); ctx.arc(w/2,h/2,h*.22,0,7); ctx.fill(); ctx.strokeStyle="#fff"; ctx.lineWidth=h*.03; ctx.beginPath(); ctx.arc(w/2,h*.95,h*.5,Math.PI*1.33,Math.PI*1.67); ctx.stroke(); }
  else if(c==="AR"){ band(["#74acdf","#ffffff","#74acdf"],false); ctx.fillStyle="#f6b40e"; ctx.beginPath(); ctx.arc(w/2,h/2,h*.1,0,7); ctx.fill(); }
  else if(c==="UY"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#0038a8"; for(let i=1;i<9;i+=2) ctx.fillRect(0,i*h/9,w,h/9+.5); ctx.fillStyle="#fff"; ctx.fillRect(0,0,w*.37,h*5/9); ctx.fillStyle="#fcd116"; ctx.beginPath(); ctx.arc(w*.185,h*.278,h*.13,0,7); ctx.fill(); }
  else if(c==="CL"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h/2); ctx.fillStyle="#d52b1e"; ctx.fillRect(0,h/2,w,h/2); ctx.fillStyle="#0039a6"; ctx.fillRect(0,0,w/3,h/2); ctx.fillStyle="#fff"; star(ctx,w/6,h/4,h*.13); }
  else if(c==="CZ"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h/2); ctx.fillStyle="#d7141a"; ctx.fillRect(0,h/2,w,h/2); ctx.fillStyle="#11457e"; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(w*.5,h/2); ctx.lineTo(0,h); ctx.fill(); }
  else if(c==="US"){ for(let i=0;i<13;i++){ ctx.fillStyle=i%2?"#ffffff":"#b22234"; ctx.fillRect(0,i*h/13,w,h/13+.5); } ctx.fillStyle="#3c3b6e"; ctx.fillRect(0,0,w*.4,h*7/13); }
  else if(c==="LR"){ for(let i=0;i<11;i++){ ctx.fillStyle=i%2?"#ffffff":"#bf0a30"; ctx.fillRect(0,i*h/11,w,h/11+.5); } ctx.fillStyle="#002868"; ctx.fillRect(0,0,h*5/11,h*5/11); ctx.fillStyle="#fff"; star(ctx,h*2.5/11,h*2.5/11,h*.15); }
  else if(c==="GH"){ band(["#ce1126","#fcd116","#006b3f"],false); ctx.fillStyle="#000"; star(ctx,w/2,h/2,h*.16); }
  else if(c==="CM"){ band(["#007a5e","#ce1126","#fcd116"],true); ctx.fillStyle="#fcd116"; star(ctx,w/2,h/2,h*.16); }
  else if(c==="SN"){ band(["#00853f","#fdef42","#e31b23"],true); ctx.fillStyle="#00853f"; star(ctx,w/2,h/2,h*.16); }
  else if(c==="TR"){ ctx.fillStyle="#e30a17"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(w*.38,h/2,h*.25,0,7); ctx.fill(); ctx.fillStyle="#e30a17"; ctx.beginPath(); ctx.arc(w*.42,h/2,h*.2,0,7); ctx.fill(); ctx.fillStyle="#fff"; star(ctx,w*.55,h/2,h*.11); }
  else if(c==="GR"){ for(let i=0;i<9;i++){ ctx.fillStyle=i%2?"#ffffff":"#0d5eaf"; ctx.fillRect(0,i*h/9,w,h/9+.5); } ctx.fillStyle="#0d5eaf"; ctx.fillRect(0,0,w*.37,h*5/9); ctx.fillStyle="#fff"; ctx.fillRect(w*.15,0,w*.07,h*5/9); ctx.fillRect(0,h*2/9,w*.37,h/9); }
  else if(c==="JP"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#bc002d"; ctx.beginPath(); ctx.arc(w/2,h/2,h*.3,0,7); ctx.fill(); }
  else if(c==="KR"){ ctx.fillStyle="#fff"; ctx.fillRect(0,0,w,h); ctx.fillStyle="#cd2e3a"; ctx.beginPath(); ctx.arc(w/2,h/2,h*.25,Math.PI,0); ctx.fill(); ctx.fillStyle="#0047a0"; ctx.beginPath(); ctx.arc(w/2,h/2,h*.25,0,Math.PI); ctx.fill(); }
  else { // a nation this stand-in has no flag for: a plain gold plate with its code (never a wrong flag)
    const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,"#f1cf7a"); g.addColorStop(1,"#c4932f"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.fillStyle="#2a2110"; ctx.font=`700 ${Math.round(h*.42)}px "Barlow Condensed", sans-serif`; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(c.replace(/^GB-/,"")||"?",w/2,h/2+h*.03); }
  const sh=ctx.createLinearGradient(0,0,w,h); sh.addColorStop(0,"rgba(255,255,255,.18)"); sh.addColorStop(.5,"rgba(255,255,255,0)"); sh.addColorStop(1,"rgba(0,0,0,.14)"); ctx.fillStyle=sh; ctx.fillRect(0,0,w,h);
}

/* ================= building the card ================= */
$("portrait").innerHTML = SILHOUETTE;
const statsEl = $("stats");
STAT_KEYS.forEach((key) => {
  const t=document.createElement("div"); t.className="tile stat"; t.id="stat-"+key; t.dataset.stat=key; t.dataset.shown="0";
  t.innerHTML=`<div class="b"><i>??</i><span>${key}</span></div><div class="f"><em></em><span>${key}</span></div>`; statsEl.appendChild(t);
});
const statEl = (key) => statsEl.querySelector(`[data-stat="${key}"]`);
const show = (el, on) => { const v = on ? "1" : "0"; if(el.dataset.shown!==v) el.dataset.shown = v; };

/* ================= validation of the round the game sends ================= */
function validStages(st){
  if(!Array.isArray(st) || st.length!==LAST_BEAT+1) throw new Error("round: stages must be four");
  let prev=0;
  st.forEach((s,i)=>{
    if(!s || typeof s!=="object") throw new Error("round: stage "+(i+1));
    if(!Number.isInteger(s.points) || s.points<1 || s.points>4) throw new Error("round: stage "+(i+1)+" points");
    if(!Number.isFinite(s.revealMs) || s.revealMs<0 || !Number.isFinite(s.guessMs) || s.guessMs<=0) throw new Error("round: stage "+(i+1)+" timing");
    if(!Number.isInteger(s.stats) || s.stats<prev || s.stats>6) throw new Error("round: stage "+(i+1)+" stats");
    for(const k of ["position","flag","overall"]) if(typeof s[k]!=="boolean") throw new Error("round: stage "+(i+1)+" "+k);
    prev=s.stats;
  });
  return st;
}
function validRound(r){
  if(!r || typeof r!=="object") throw new Error("round: missing");
  if(typeof r.position!=="string" || !/^[A-Z]{2,3}$/.test(r.position)) throw new Error("round: position");
  if(!Array.isArray(r.statOrder) || r.statOrder.length!==6 || [...r.statOrder].sort().join()!==[...STAT_KEYS].sort().join()) throw new Error("round: statOrder must be the six stats once each");
  for(const k of STAT_KEYS){ const v=r.stats && r.stats[k]; if(!Number.isInteger(v) || v<1 || v>99) throw new Error("round: stat "+k); }
  if(typeof r.nation!=="string" || !r.nation) throw new Error("round: nation");
  if(typeof r.name!=="string" || !r.name.trim()) throw new Error("round: name");
  if(!Number.isInteger(r.overall) || r.overall<1 || r.overall>99) throw new Error("round: overall");
  if(r.me!=null && !ROLES.includes(r.me)) throw new Error("round: me");
  validStages(r.stages);
  return r;
}
const otherRole = () => S.me==="playerOne" ? "playerTwo" : "playerOne";
const stagePoints = (b) => (S.stages && S.stages[b] ? S.stages[b].points : 0);

/* ================= play hooks (the game calls these; the page never decides anything) ================= */
function load(round){
  validRound(round);
  S.round = round; S.stages = round.stages.map(s=>Object.assign({}, s)); S.me = round.me || "playerTwo";
  S.names = Object.assign({ playerOne:"Daniel", playerTwo:"Nik" }, round.names || {});
  S.beat=-1; S.revealEndsAt=null; S.closesAt=null; S.nameAt=null; S.result=null; S.points=null; S.pending=false; S.continued=false; S.waitingFor=null; S.countIn=false;
  S.chips = { playerOne: CHIPS_PER_MANAGER, playerTwo: CHIPS_PER_MANAGER };
  $("nameOne").textContent=S.names.playerOne; $("nameTwo").textContent=S.names.playerTwo;
  // the two boxes: this manager types in their own; the other one is read only
  const mineBox = S.me==="playerOne" ? $("boxOne") : $("boxTwo"), otherBox = S.me==="playerOne" ? $("boxTwo") : $("boxOne");
  mineBox.dataset.me="1"; otherBox.dataset.me="0"; [mineBox, otherBox].forEach(b=>{ b.dataset.won="0"; b.dataset.out="0"; });
  mineBox.querySelector(".slot").appendChild($("mine")); otherBox.querySelector(".slot").appendChild($("other"));
  $("posValue").textContent=round.position; $("ovrValue").textContent=String(round.overall);
  $("nameValue").textContent="";                                     // the name plate stays empty until the result
  STAT_KEYS.forEach(k=>{ statEl(k).querySelector("em").textContent=String(round.stats[k]); show(statEl(k),false); });
  drawFlag($("flagCanvas"), round.nation);
  [$("pos"),$("flag"),$("name"),$("ovr")].forEach(el=>show(el,false)); fresh([]);
  $("source").textContent=""; $("banner").hidden=true; $("banner").className="banner"; $("cta").hidden=true; $("cta").disabled=false; $("cta").textContent="Continue";
  $("guess").value=""; setSuggestions([]); note(""); $("app").dataset.over="0";
  still(()=>render());  layoutStage();
}
// role: the manager still to arrive; null once both are here (the game counts in before the pack opens)
function setWaiting(role){ S.waitingFor = ROLES.includes(role) ? role : null; S.countIn = !S.waitingFor; render(); }
// reveal(index, {phase, remainingMs, revealMsLeft}): stage `index` is on (0..3). remainingMs is what is left of the whole stage
// (reveal plus guessing), revealMsLeft what is left of its reveal (0 once in the guessing window), both from the game's shared
// server clock. Every earlier stage is put face up at once, and only what is left of this stage's reveal plays, so a phone
// that reloads lands on the current state with nothing replayed. The timer counts this stage's guessing time.
function reveal(index, opts){
  if(!S.round || S.result) return;
  const n = Number(index); if(!Number.isFinite(n)) return;
  const i = clamp(Math.floor(n), 0, LAST_BEAT), st = S.stages[i], o = opts || {}, full = st.revealMs + st.guessMs;
  const remaining = Number.isFinite(o.remainingMs) ? clamp(o.remainingMs, 0, full) : full;
  let revealLeft = Number.isFinite(o.revealMsLeft) ? clamp(o.revealMsLeft, 0, st.revealMs) : (o.phase==="window" ? 0 : Math.max(0, remaining - st.guessMs));
  revealLeft = Math.min(revealLeft, remaining);
  const guessLeft = clamp(remaining - revealLeft, 0, st.guessMs), t = now();
  S.beat = i; S.waitingFor = null; S.countIn = false;
  S.revealEndsAt = t + revealLeft; S.closesAt = S.revealEndsAt + guessLeft;
  still(()=>render());                                             // what is already past shows at once, with no animation
}
function setChips(role, count){
  if(!ROLES.includes(role)) return;
  const n = Math.floor(Number(count)); if(!Number.isFinite(n)) return;
  S.chips[role] = clamp(n, 0, CHIPS_PER_MANAGER); if(role===S.me && S.pending){ S.pending=false; note(""); } render();
}
// The game turns the typed text into names from the icon list (workstream B's matcher) and sends them back here.
function setSuggestions(names){
  S.suggestions = Array.isArray(names) ? names.filter(n=>typeof n==="string" && n.trim()).slice(0,6) : []; S.active=-1;
  const ul=$("suggest"); ul.textContent="";
  S.suggestions.forEach((n,i)=>{ const li=document.createElement("li"); li.textContent=n; li.setAttribute("role","option"); li.id="sg"+i;
    li.addEventListener("pointerdown",(e)=>{ e.preventDefault(); pick(i); }); ul.appendChild(li); });
  ul.hidden = !S.suggestions.length || !canType();
}
// Feedback on this phone's own guess. "not-in-list": costs no token. "wrong": shown only here; the other phone sees
// only the token count drop. "used": both tokens gone. Anything else just clears the pending state.
function guessFeedback(kind){
  S.pending=false;
  if(kind==="not-in-list") note("Not an icon in the list", true);
  else if(kind==="wrong") { note("Not him."); $("guess").value=""; setSuggestions([]); }
  else if(kind==="used") note("No guesses left. Watch the rest.");
  else if(kind==="late") note("Too late for that one.");
  else if(kind==="ambiguous") note("More than one icon has that name. Type his full name.", true);
  else if(kind==="error") note("That guess didn't go through. Try again.", true);
  render();
}
// The result (stage 5, no guessing): the winner and the points the game's round record gives (4 to 1 by stage), or nobody
// (0 points); then the whole card is face up (paintCard: every stat left, the flag, the overall) and, a moment later, the name.
// A right guess at any stage comes straight here.
function showResult(winner, points){
  if(!S.round) return;
  const result = ROLES.includes(winner) ? winner : "draw";
  // Only a late winner may replace a shown draw (the game's record decides; Fable F12-03). Anything else stays as shown.
  if(S.result && (S.result!=="draw" || result==="draw")) return;
  S.result = result; S.pending=false;
  S.points = S.result==="draw" ? 0 : clamp(Math.floor(Number(points)) || stagePoints(Math.max(0,S.beat)), 1, 4);
  S.nameAt = now() + NAME_AFTER_MS;
  $("nameValue").textContent=S.round.name;                          // guessing has ended: the only place the name is written
  const b=$("banner"); b.hidden=false;
  if(S.result==="draw"){ b.textContent="Nobody got him · 0 points"; b.classList.add("draw"); }
  else { b.textContent=`${S.names[S.result]} +${S.points} Showdown point${S.points===1?"":"s"}`; b.classList.remove("draw"); }
  b.dataset.winner=S.result;
  $("boxOne").dataset.won = S.result==="playerOne" ? "1" : "0"; $("boxTwo").dataset.won = S.result==="playerTwo" ? "1" : "0";
  $("source").textContent = S.round.source || ""; fitName();
  $("guess").blur(); $("guess").value=""; setSuggestions([]); note("");
  const cta=$("cta"); cta.hidden=false; cta.disabled=false; cta.textContent="Continue"; $("app").dataset.over="1";
  render();  layoutStage();
}

/* ================= the guess box ================= */
// Typing stays open through the stages (so the iPhone keyboard never drops mid-round); a guess counts at any moment of a
// stage, its reveal included, until that stage's timer runs out.
function canType(){ return Boolean(S.round) && !S.result && !S.waitingFor && S.beat>=0 && S.chips[S.me]>0; }
function canGuess(){ return canType() && S.closesAt!==null && now()<S.closesAt && !S.pending; }
function note(text, warn){ const n=$("note"); n.textContent=text||""; n.classList.toggle("warn",Boolean(warn)); }
function pick(i){ const n=S.suggestions[i]; if(!n) return; $("guess").value=n; setSuggestions([]); submit(); }
function submit(){
  const text=$("guess").value.trim();
  if(!text || !canGuess()) return;
  S.pending=true; setSuggestions([]); note("Checking…");
  toGame("cms-ig-guess", { text, beat:S.beat, role:S.me });
  render();
}
$("form").addEventListener("submit",(e)=>{ e.preventDefault(); if(S.active>=0) pick(S.active); else submit(); });
$("guess").addEventListener("input",()=>{ const t=$("guess").value; if($("note").classList.contains("warn")) note(""); toGame("cms-ig-input", { text:t }); if(t.trim().length<2) setSuggestions([]); });
$("guess").addEventListener("keydown",(e)=>{
  if(!S.suggestions.length) return;
  const n=S.suggestions.length;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault();
    S.active = e.key==="ArrowDown" ? (S.active+1>=n ? -1 : S.active+1) : (S.active-1<-1 ? n-1 : S.active-1);
    [...$("suggest").children].forEach((li,i)=>li.setAttribute("aria-selected",String(i===S.active))); }
  else if(e.key==="Escape") setSuggestions([]);
});
$("cta").addEventListener("click",()=>{ if(S.continued) return; S.continued=true; const c=$("cta"); c.disabled=true; c.textContent="Opening Transfer Challenge…"; toGame("cms-ig-continue"); });

/* ================= iPhone keyboard: keep the whole screen inside the visible viewport ================= */
function fitViewport(){
  const vv=window.visualViewport, app=$("app"); if(!vv) return;
  app.style.height=vv.height+"px"; app.style.top=vv.offsetTop+"px";
  document.documentElement.classList.toggle("kb", window.innerHeight - vv.height > 120);
  layoutStage();
}

/* ================= skin: the stage layout and the name plate (look only; nothing here decides anything) ================= */
// Stage layout: the stage plate covers the screen and the card stands on its pedestal. Wide screens use the desktop plate
// with the two boxes inside the gold arcs, left and right of the card; tall screens use the phone plate with the boxes side
// by side on the floor below the pedestal. Everything is placed from these numbers, so nothing covers anything at any size.
const STAGE_ART = { wide:{ w:2560, h:1440, ped:.705, front:.05 }, tall:{ w:1179, h:2556, ped:.428, front:.036 } };
function layoutStage(){
  const app=$("app"), W=app.clientWidth||innerWidth, H=app.clientHeight||innerHeight;
  // Wide only when it really fits: a card of at least 120 px plus both boxes (190 px each at least) and their gaps across the
  // width. A phone held upright with the keyboard open (e.g. 390x350) is wider than tall but keeps the phone layout.
  const tall = W/H < 1.05 || W < 120 + 2*(190+32+12), art = tall ? STAGE_ART.tall : STAGE_ART.wide;
  app.dataset.shape = tall ? "tall" : "wide";
  let s = Math.max(W/art.w, H/art.h), ped = (H-art.h*s)/2 + art.ped*art.h*s;
  const boxesH = tall ? Math.ceil($("guessbar").getBoundingClientRect().height) || 76 : 0;
  if(tall){
    const floorNeed = boxesH + 6 + (S.result ? 74 : 12) + 8, want = Math.min(Math.max(ped, H*.6), H - floorNeed - art.front*art.h*s);
    ped = Math.max(want, 140);
    s = Math.max(W/art.w, ped/(art.ped*art.h), (H-ped)/((1-art.ped)*art.h));
  }
  const imgW=art.w*s, imgH=art.h*s, short = H < 520;
  const top = tall ? (short ? 62 : 92) : Math.min(132, Math.max(76, H*.16));
  let cardH = Math.max(90, ped - top - 4), cardW = cardH*2/3;
  const gap = 32, maxW = tall ? W*.7 : Math.min(W*.3, W - 2*(190+gap+12)); if(cardW>maxW){ cardW=Math.max(80,maxW); cardH=cardW*1.5; }
  const floor = ped + art.front*imgH, boxW = Math.max(150, Math.min(360, (W-cardW)/2 - gap - 12));
  const v = { "--st-l":(W-imgW)/2, "--st-t":ped-art.ped*imgH, "--st-w":imgW, "--st-h":imgH, "--ped":ped, "--card-w":cardW, "--card-h":cardH,
    "--floor":floor, "--top":top, "--box-w":boxW, "--box-y":Math.max(top+8, ped - cardH*.55 - 60), "--boxes-h":boxesH };
  for(const k in v) app.style.setProperty(k, Math.round(v[k])+"px");
  app.classList.toggle("short", short || (!tall && H<480));
}
addEventListener("resize", layoutStage);
// One line, never cut off: shrink the name's font until it fits the plate (in card units, so it holds at every size).
const NAME_CQW = 7.6;
function fitName(){
  const el=$("nameValue"); el.style.fontSize="";
  const range=document.createRange(); range.selectNodeContents(el);
  const room=el.clientWidth, need=range.getBoundingClientRect().width * (el.offsetWidth ? el.offsetWidth/el.getBoundingClientRect().width : 1);
  if(room>0 && need>room) el.style.fontSize=(NAME_CQW*room/need*.97).toFixed(2)+"cqw";
}
if(window.visualViewport){ visualViewport.addEventListener("resize",fitViewport); visualViewport.addEventListener("scroll",fitViewport); fitViewport(); } else layoutStage();
if(document.fonts && document.fonts.ready) document.fonts.ready.then(layoutStage);

/* ================= the stages on the card ================= */
// How far stage b's reveal has played (0..1). Earlier stages, and everything once the result is in, are fully played.
function progressOf(b, t){
  if(S.result || b<S.beat) return 1;
  if(b>S.beat || S.revealEndsAt===null) return 0;
  const ms = S.stages[b].revealMs; return ms>0 ? clamp(1-(S.revealEndsAt-t)/ms, 0, 1) : 1;
}
// The parts stage b turns face up, in order, straight from its row of round.stages: the position, the next stats in the
// round's statOrder (stats is how many are up from that stage on), and the flag and the overall if a row ever turns them
// up (Nik's rule, 11:08 UTC: none does; they come with the result). The name is never a stage.
function itemsFor(b){
  const st=S.stages[b], prev=b>0 ? S.stages[b-1] : { stats:0, position:false, flag:false, overall:false }, out=[];
  if(st.position && !prev.position) out.push($("pos"));
  for(let k=prev.stats;k<st.stats;k++) out.push(statEl(S.round.statOrder[k]));
  if(st.flag && !prev.flag) out.push($("flag"));
  if(st.overall && !prev.overall) out.push($("ovr"));
  return out;
}
function fresh(list){ document.querySelectorAll(".fresh").forEach(x=>{ if(!list.includes(x)) x.classList.remove("fresh"); }); list.forEach(x=>x.classList.add("fresh")); }
function paintCard(t){
  if(!S.round) return;
  const up=new Set(), latest=[];
  for(let b=0;b<=Math.min(S.beat,LAST_BEAT);b++){
    const p=progressOf(b,t), items=itemsFor(b), [a,z]=b===0 ? ITEMS_FIRST : ITEMS_LATER;
    items.forEach((el,k)=>{ const at = items.length>1 ? a+(z-a)*k/(items.length-1) : a; if(p>=at){ up.add(el); if(b===S.beat) latest.push(el); } });
  }
  const all=[$("pos"),$("flag"),$("ovr"),...STAT_KEYS.map(statEl)];
  all.forEach(el=>show(el, Boolean(S.result) || up.has(el)));
  show($("name"), Boolean(S.result) && S.nameAt!==null && t>=S.nameAt);  // the name: only on the result
  fresh(S.result ? [] : latest);
  // stage 1's opening, plain: the pack fades and slides out, then the card fades and slides up into place. Driven from the
  // page clock, so a reload mid-opening plays only what is left. (Team V's art replaces the look, HO-051.)
  const pp = S.result ? 1 : S.beat<0 ? 0 : progressOf(0,t);
  const out = smooth(0, PACK_OUT, pp), rise = smooth(PACK_OUT, CARD_UP, pp);
  const pack=$("pack"), card=$("card");
  S.view = { opening: pp, cardUp: pp>=CARD_UP };
  pack.hidden = pp>=PACK_OUT;
  const packState = pp>=PACK_OUT ? "gone" : pp>0 ? "open" : "sealed";        // the skin: sealed art, then Nik's opening art
  if($("app").dataset.pack!==packState) $("app").dataset.pack = packState;
  if(!pack.hidden){
    pack.style.opacity = String(1-out);
    pack.style.transform = REDUCED ? "translateX(-50%)" : `translateX(-50%) translateY(${(-12*out).toFixed(2)}%)`;
  }
  card.style.visibility = pp>=PACK_OUT ? "visible" : "hidden";
  card.style.opacity = String(rise);
  card.style.transform = REDUCED ? "none" : `translateY(${((1-rise)*16).toFixed(2)}%)`;
}
function still(fn){
  const root=document.documentElement, was=root.classList.contains("still");
  root.classList.add("still"); fn(); void document.body.offsetWidth; if(!was && !frozen) root.classList.remove("still");
}

/* ================= render (cheap; runs on every hook and every frame) ================= */
const RING=106.8;
const guessLeft = (t) => S.closesAt===null ? 0 : Math.max(0, S.closesAt - Math.max(t, S.revealEndsAt));
function render(){
  const t=now();
  ROLES.forEach(r=>{ const el=r==="playerOne"?$("chipsOne"):$("chipsTwo"); el.dataset.count=String(S.chips[r]); el.setAttribute("aria-label", `${S.chips[r]} guess${S.chips[r]===1?"":"es"} left`);
    [...el.children].forEach((c,i)=>c.classList.toggle("used", i>=S.chips[r])); });
  const w=$("waiting"), beat=$("beat"), ring=$("ring");
  w.hidden = Boolean(S.result) || !S.round || S.beat>=0 || (!S.waitingFor && !S.countIn);
  if(S.waitingFor) w.textContent=`Waiting for ${S.names[S.waitingFor]}`; else if(S.countIn) w.textContent="Both here · Get ready";
  $("status").hidden = Boolean(S.result);
  if(S.result || S.beat<0 || !S.round){ beat.textContent=""; beat.hidden=true; ring.hidden=true; }
  else {
    const pts=stagePoints(S.beat), st=S.stages[S.beat], left=guessLeft(t);
    beat.hidden=false; beat.textContent = `Stage ${S.beat+1} · ${pts} pt${pts===1?"":"s"}`; beat.classList.toggle("last", S.beat===LAST_BEAT);
    ring.hidden=false;
    $("ringLeft").setAttribute("stroke-dashoffset", String(RING*(1-clamp(left/st.guessMs,0,1))));
    $("ringNum").textContent=String(Math.ceil(left/1000)); ring.classList.toggle("low", left<5000);
  }
  paintCard(t);
  // the boxes
  const ok=canGuess(), mine=S.chips[S.me], oth=otherRole(), otherBox = oth==="playerOne" ? $("boxOne") : $("boxTwo"), mineBox = S.me==="playerOne" ? $("boxOne") : $("boxTwo");
  otherBox.dataset.out = S.round && S.chips[oth]<=0 ? "1" : "0"; mineBox.dataset.out = S.round && mine<=0 ? "1" : "0";
  const o=$("other");
  o.textContent = !S.round ? "" : S.result ? (S.result===oth ? `Named him · +${S.points}` : S.chips[oth]<=0 ? "Out of guesses" : "No luck")
    : S.chips[oth]<=0 ? "Out of guesses" : S.waitingFor===oth ? "Not here yet" : S.beat<0 ? "Ready" : "Guessing…";
  $("guess").disabled = !canType(); $("go").disabled = !ok;
  if(S.round){
    $("guess").placeholder = S.result ? (S.result===S.me ? `Named him · +${S.points}` : "Round over") : S.waitingFor ? "Waiting…" : S.beat<0 ? "Get ready…" : mine<=0 ? "No guesses left" : S.pending ? "Checking…" : ok ? "Who is he?" : "Time's up";
    if(!canType()) $("suggest").hidden=true;
  }
}
function frame(){ tickDriver(); render(); if(!frozen) requestAnimationFrame(frame); }

/* ================= preview driver (no embed): plays a made-up round so the page can be looked at on its own =================
   The player is fictional, with made-up numbers: the page never carries real card data. SAMPLE_STAGES is a copy of the
   game's one table (js/iconGuess.js STAGES); in the game the stages always come with the round. ?fast=1 runs it at a tenth. */
const SAMPLE_STAGES = Object.freeze([
  Object.freeze({points:4,revealMs:2500,guessMs:25000,stats:1,position:true,flag:false,overall:false}),
  Object.freeze({points:3,revealMs:1500,guessMs:20000,stats:2,position:true,flag:false,overall:false}),
  Object.freeze({points:2,revealMs:1500,guessMs:20000,stats:3,position:true,flag:false,overall:false}),
  Object.freeze({points:1,revealMs:1500,guessMs:20000,stats:4,position:true,flag:false,overall:false})
]);
const FAST = QS.get("fast")==="1" ? 0.1 : 1;
const SAMPLE = { position:"CAM", statOrder:["DRI","PAC","PHY","PAS","DEF","SHO"], stats:{PAC:88,SHO:86,PAS:90,DRI:93,DEF:41,PHY:72},
  nation:"NL", name:"Sample Icon", overall:94, source:"PRIME ICON · SAMPLE CARD", me:"playerTwo", names:{playerOne:"Daniel",playerTwo:"Nik"} };
const SAMPLE_NAMES = ["Sample Icon","Sample Striker","Sample Winger","Simon Sample","Samuel Example"];
let driver = null;
function startPreview(){
  const stages=SAMPLE_STAGES.map(s=>Object.assign({}, s, { revealMs: Math.round(s.revealMs*FAST), guessMs: Math.round(s.guessMs*FAST) }));
  const round=Object.assign({}, SAMPLE, { stages });
  if(QS.get("me")==="playerOne") round.me="playerOne";
  load(round);
  const other=round.me==="playerTwo"?"playerOne":"playerTwo", t=now(), plan=[];
  setWaiting(other);
  plan.push({ at:t+1000*FAST, run:()=>setWaiting(null) });                // the other manager arrives; both count in
  let at=t+1500*FAST;
  stages.forEach((s,b)=>{ const start=at;
    plan.push({ at:start, run:(late)=>reveal(b, { phase: late<s.revealMs?"reveal":"window", remainingMs:s.revealMs+s.guessMs-late, revealMsLeft:Math.max(0,s.revealMs-late) }) });
    if(b===1) plan.push({ at:start+s.revealMs+Math.round(s.guessMs*.3), run:()=>setChips(other,1) });   // their wrong guess: only the count drops
    at += s.revealMs+s.guessMs; });
  plan.push({ at, run:()=>showResult("draw", 0) });
  plan.sort((x,y)=>x.at-y.at);
  driver = { plan, other };
}
function tickDriver(){ if(!driver) return; const t=now(); while(driver && driver.plan.length && t>=driver.plan[0].at && !S.result){ const p=driver.plan.shift(); p.run(t-p.at); } }
if(!EMBED){
  window.addEventListener("cms-ig",(e)=>{ const m=e.detail; if(!driver) return;
    if(m.type==="cms-ig-input"){ const q=m.text.trim().toLowerCase(); setSuggestions(q.length>=2?SAMPLE_NAMES.filter(n=>n.toLowerCase().includes(q)):[]); }
    else if(m.type==="cms-ig-guess"){ const hit=SAMPLE_NAMES.find(n=>n.toLowerCase()===m.text.toLowerCase());
      if(!hit) guessFeedback("not-in-list");
      else { setChips(S.me,S.chips[S.me]-1); if(hit===SAMPLE.name) showResult(S.me, stagePoints(S.beat)); else guessFeedback("wrong"); } }
    else if(m.type==="cms-ig-continue"){ setTimeout(()=>{ driver=null; startPreview(); }, 600); }
  });
}

/* ================= game messages (embed=1), origin- and frame-checked like the Special Player page ================= */
window.addEventListener("message",(e)=>{
  if(e.source!==parent||e.origin!==location.origin||!e.data||typeof e.data.type!=="string"||e.data.type.indexOf("cms-ig-")!==0) return;
  const d=e.data;
  try {
    if(d.type==="cms-ig-start"){ load(d.round); if(d.waitingFor) setWaiting(d.waitingFor); }
    else if(d.type==="cms-ig-waiting") setWaiting(d.role);
    else if(d.type==="cms-ig-reveal") reveal(d.index, { phase:d.phase, remainingMs:d.remainingMs, revealMsLeft:d.revealMsLeft });
    else if(d.type==="cms-ig-chips") setChips(d.role, d.count);
    else if(d.type==="cms-ig-suggestions") setSuggestions(d.names);
    else if(d.type==="cms-ig-feedback") guessFeedback(d.kind);
    else if(d.type==="cms-ig-result") showResult(d.winner, d.points);
  } catch(err) { try{ parent.postMessage({type:"cms-ig-error", message:String(err&&err.message||err)}, location.origin); }catch(_e){} }
});

/* ================= same-window API and the test clock ================= */
window.PrimePackPage = Object.freeze({ load, setWaiting, reveal, setChips, setSuggestions, guessFeedback, showResult,
  reduced: REDUCED, lastBeat: LAST_BEAT, chipsPerManager: CHIPS_PER_MANAGER, statKeys: STAT_KEYS.slice(), stages: SAMPLE_STAGES, fast: FAST });
// Deterministic test clock (like __mq on the Special Player page): freeze() stops real time and every CSS transition,
// advance(sec) steps the page clock (timer, pack opening and preview driver), state() reads what is on screen.
window.__ig = {
  freeze(){ if(!frozen){ manualMs=realNow(); frozen=true; } document.documentElement.classList.add("still"); render(); },
  advance(sec){ if(!frozen) this.freeze(); manualMs+=Math.max(0,Number(sec)||0)*1000; tickDriver(); render(); },
  now, preview(on){ if(on===false){ driver=null; } else { driver=null; startPreview(); } render(); },
  state(){ const shown=(id)=>$(id).dataset.shown==="1", t=now(), card=$("card"), box=(r)=>{ const el=r==="playerOne"?$("boxOne"):$("boxTwo"), rc=el.getBoundingClientRect();
      return { mine:el.dataset.me==="1", visible:!el.closest("[hidden]") && rc.height>0, typeable:Boolean(el.querySelector("#guess")), out:el.dataset.out==="1", won:el.dataset.won==="1",
        text: el.querySelector("#other") ? $("other").textContent : null, tokens:el.querySelectorAll(".chip").length, tokensLeft:el.querySelectorAll(".chip:not(.used)").length }; };
    return { beat:S.beat, stage:S.beat>=0?S.beat+1:null, label:$("beat").hidden?null:$("beat").textContent, stagePoints:S.beat>=0?stagePoints(S.beat):null, points:S.result?S.points:null,
      waitingFor:S.waitingFor, waitingText:$("waiting").hidden?null:$("waiting").textContent, result:S.result, me:S.me, chips:Object.assign({},S.chips), pending:S.pending,
      position:shown("pos")?$("posValue").textContent:null, overall:shown("ovr")?$("ovrValue").textContent:null,
      flag:shown("flag"), name:shown("name")?$("nameValue").textContent:null, namePlate:$("name").textContent,
      stats:Object.fromEntries(STAT_KEYS.map(k=>[k, statEl(k).dataset.shown==="1"?Number(statEl(k).querySelector("em").textContent):null])),
      revealing: S.beat>=0 && !S.result && S.revealEndsAt!==null && t<S.revealEndsAt,
      packShown: !$("pack").hidden, opening: S.view.opening, cardUp: S.view.cardUp && card.style.visibility==="visible" && Number(card.style.opacity)>=1,
      secondsLeft:S.closesAt===null||S.result?null:Math.ceil(guessLeft(t)/1000), canGuess:canGuess(),
      boxes:{ playerOne:box("playerOne"), playerTwo:box("playerTwo") },
      banner:$("banner").hidden?null:$("banner").textContent, source:$("source").textContent||null, cta:!$("cta").hidden, reduced:REDUCED }; }
};

if(EMBED) toGame("cms-ig-ready", { reduced: REDUCED });
else startPreview();
if(frozen){ manualMs=0; render(); } else requestAnimationFrame(frame);
})();
</script>
</body>
</html>

```


## FILE: firestore.season-results-production.fragment.rules
```
// SSJR_SEASON_RESULTS_FUNCTIONS_BEGIN
    function ssjrResultsValidOperationId(value) { return value is string && value.matches('^season_result_op_[0-9a-f]{32}$'); }
    function ssjrResultsValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
    function ssjrResultsValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
    function ssjrResultsSeasonMatches(seasonId, seasonNumber) {
      return seasonNumber is int
        && seasonNumber >= 1
        && seasonNumber <= 10
        && seasonId == 'season_' + string(seasonNumber);
    }
    function ssjrResultsSetup(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data; }
    function ssjrResultsProjectedTeamCount(rivalryId) { return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/leagueProjection).data.teamCount; }
    function ssjrResultsCareer(rivalryId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/careerStart/authoritative).data; }
    function ssjrResultsTransfer(rivalryId, seasonId) { return get(/databases/$(database)/documents/rivalries/$(rivalryId)/transferChallenges/$(seasonId)).data; }
    function ssjrResultsPrerequisites(rivalryId, seasonId, seasonNumber) {
      let setup = ssjrResultsSetup(rivalryId);
      let career = ssjrResultsCareer(rivalryId);
      let transfer = ssjrResultsTransfer(rivalryId, seasonId);
      return setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && (setup.coordinatorRole == 'playerOne' || setup.coordinatorRole == 'playerTwo')
        && setup.operationIds is list
        && setup.operationIds.size() == 6
        && setup.totalSeasons in [1,3,5,10]
        && seasonNumber >= 1
        && seasonNumber <= setup.totalSeasons
        && career.schemaVersion == 1
        && career.objectType == 'sharedCareerStart'
        && career.rivalryId == rivalryId
        && career.setupRevision == 6
        && career.setupOperationIds is list
        && career.setupOperationIds == setup.operationIds
        && career.totalSeasons == setup.totalSeasons
        && career.revision == 2
        && career.phase == 'CAREER_START_READY'
        && career.acknowledgedRoles is list
        && career.acknowledgedRoles.size() == 2
        && 'playerOne' in career.acknowledgedRoles
        && 'playerTwo' in career.acknowledgedRoles
        && transfer.schemaVersion == 1
        && transfer.objectType == 'sharedTransferChallenge'
        && transfer.rivalryId == rivalryId
        && transfer.seasonNumber == seasonNumber
        && transfer.runtimeRevision == '1.9.1-r8'
        && transfer.coordinatorRole == setup.coordinatorRole
        && transfer.phase == 'COMPLETED'
        && (transfer.revision == 6 || transfer.revision == 7)
        && transfer.guessLockedRoles is list
        && transfer.guessLockedRoles.size() == 2
        && 'playerOne' in transfer.guessLockedRoles
        && 'playerTwo' in transfer.guessLockedRoles
        && transfer.signingLockedRoles is list
        && transfer.signingLockedRoles.size() == 2
        && 'playerOne' in transfer.signingLockedRoles
        && 'playerTwo' in transfer.signingLockedRoles;
    }
    function ssjrResultsRoleListValid(value) {
      return value is list
        && value.size() >= 1
        && value.size() <= 2
        && value.toSet().size() == value.size()
        && value.toSet().hasOnly(['playerOne','playerTwo']);
    }
    function ssjrResultsPublicExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','phase','revision','teamCount','publishedRoles',
        'operationIds','operationHashes','baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    function ssjrResultsPublicShape(root, rivalryId, seasonId) {
      let n = root.revision;
      return ssjrResultsPublicExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonResults'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && root.teamCount == ssjrResultsProjectedTeamCount(rivalryId)
        && ssjrEntitled(rivalryId)
        && root.runtimeRevision == '1.9.1-r9'
        && (root.phase == 'COLLECTING' || root.phase == 'RESULTS_READY')
        && root.revision is int
        && root.revision >= 1
        && root.revision <= 2
        && ssjrResultsRoleListValid(root.publishedRoles)
        && root.publishedRoles.size() == n
        && root.operationIds is list
        && root.operationHashes is list
        && root.baseRevisions is list
        && root.actorRoles is list
        && root.operationIds.size() == n
        && root.operationHashes.size() == n
        && root.baseRevisions.size() == n
        && root.actorRoles.size() == n
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId)
        && ((root.phase == 'COLLECTING' && n == 1) || (root.phase == 'RESULTS_READY' && n == 2));
    }
    function ssjrResultsPublicUpdateShape(root, rivalryId, seasonId) {
      return ssjrResultsPublicExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonResults'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && root.runtimeRevision == '1.9.1-r9'
        && root.teamCount is int
        && root.teamCount in [18,20]
        && root.teamCount == resource.data.teamCount
        && root.teamCount == ssjrResultsProjectedTeamCount(rivalryId)
        && root.phase == 'RESULTS_READY'
        && root.revision == 2
        && ssjrResultsRoleListValid(root.publishedRoles)
        && root.publishedRoles.size() == 2
        && root.operationIds is list
        && root.operationIds.size() == 2
        && root.operationHashes is list
        && root.operationHashes.size() == 2
        && root.baseRevisions is list
        && root.baseRevisions.size() == 2
        && root.actorRoles is list
        && root.actorRoles.size() == 2
        && root.updatedAt == request.time;
    }
    function ssjrResultsPublicPrefixPreserved(before, after) {
      return after.publishedRoles[0] == before.publishedRoles[0]
        && after.operationIds[0] == before.operationIds[0]
        && after.operationHashes[0] == before.operationHashes[0]
        && after.baseRevisions[0] == before.baseRevisions[0]
        && after.actorRoles[0] == before.actorRoles[0];
    }
    function ssjrResultsPrivateAfter(rivalryId, seasonId, managerRole) {
      return getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole)).data;
    }
    // r80 Europa League: 'europaLeague' is present only when that manager won the EL, and then it is exactly true
    // (false is refused, so there is one encoding per fact and old 7-key results are unchanged). One manager's season
    // never has CL and EL both true. Nothing compares the two managers' results: both may win the same trophy.
    function ssjrResultsResultShape(value, teamCount) {
      return teamCount >= 2
        && value is map
        && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague','primePack'])
        && value.leaguePosition is int
        && value.leaguePosition >= 1
        && value.leaguePosition <= teamCount
        && value.leaguePoints is int
        && value.leaguePoints >= 0
        && value.leaguePoints <= (teamCount - 1) * 6
        && value.leagueGoals is int
        && value.leagueGoals >= 0
        && value.leagueGoals <= 300
        && value.domesticCup is bool
        && value.championsLeague is bool
        && value.topScorer is bool
        && value.topAssist is bool
        && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false))
        && (!('primePack' in value) || (value.primePack is int && value.primePack >= 1 && value.primePack <= 4));
    }
    function ssjrResultsPrivateExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','managerRole','result','operationId','commandHash',
        'activeSessionId','publishedAt','updatedByDeviceId'
      ]);
    }
    function ssjrResultsPrivateBase(root, rivalryId, seasonId, managerRole, teamCount) {
      return ssjrResultsPrivateExactKeys(root)
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonResultRole'
        && root.rivalryId == rivalryId
        && root.seasonNumber is int
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && root.managerRole == managerRole
        && managerRole == ssjrActorRole(rivalryId)
        && ssjrResultsResultShape(root.result, teamCount)
        && ssjrResultsValidOperationId(root.operationId)
        && ssjrResultsValidHash(root.commandHash)
        && root.publishedAt == request.time
        && ssjrEntitled(rivalryId);
    }
    function ssjrResultsPrivateLinked(rivalryId, seasonId, publicAfter, managerRole) {
      let own = ssjrResultsPrivateAfter(rivalryId, seasonId, managerRole);
      let i = publicAfter.revision - 1;
      return own.operationId == publicAfter.operationIds[i]
        && publicAfter.actorRoles[i] == managerRole
        && publicAfter.publishedRoles[i] == managerRole
        && own.activeSessionId == publicAfter.activeSessionId
        && own.updatedByDeviceId == publicAfter.updatedByDeviceId
        && own.publishedAt == request.time;
    }
    function ssjrResultsValidCreate(rivalryId, seasonId) {
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      return ssjrResultsPublicShape(after, rivalryId, seasonId)
        && after.revision == 1
        && ssjrResultsValidOperationId(after.operationIds[0])
        && ssjrResultsValidHash(after.operationHashes[0])
        && after.baseRevisions[0] == 0
        && ssjrResultsPrivateLinked(rivalryId, seasonId, after, role);
    }
    // Audit R84 F01 (r85): the second publish (revision 1 -> 2) now carries the same write authority as the first. Before,
    // it was bound only to rivalry membership (through the role-private document's ssjrEntitled).
    function ssjrResultsValidUpdate(rivalryId, seasonId) {
      let before = resource.data;
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      let i = before.revision;
      return ssjrResultsPublicUpdateShape(after, rivalryId, seasonId)
        && before.revision == 1
        && ssjrResultsPublicPrefixPreserved(before, after)
        && ssjrResultsPrivateLinked(rivalryId, seasonId, after, role)
        && ssjrWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
    function ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole) {
      let after = request.resource.data;
      let public = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
      let i = public.revision - 1;
      return ssjrResultsPrivateBase(after, rivalryId, seasonId, managerRole, public.teamCount)
        && (!('primePack' in after.result) || ssjrPackPoints(rivalryId, seasonId, managerRole, after.result.primePack))
        && public.schemaVersion == 1
        && public.objectType == 'sharedSeasonResults'
        && public.runtimeRevision == '1.9.1-r9'
        && public.seasonNumber == after.seasonNumber
        && public.operationIds[i] == after.operationId
        && (public.revision == 1 || public.operationIds[i] != public.operationIds[0])
        && ssjrResultsValidHash(public.operationHashes[i])
        && public.baseRevisions[i] == public.revision - 1
        && public.actorRoles[i] == managerRole
        && public.publishedRoles[i] == managerRole
        && public.activeSessionId == after.activeSessionId
        && public.updatedByDeviceId == after.updatedByDeviceId
        && public.updatedAt == request.time;
    }
    function ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole) {
      let public = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
      return ssjrEntitled(rivalryId)
        && (managerRole == ssjrActorRole(rivalryId) || public.phase == 'RESULTS_READY');
    }
    // r87 Prime Pack (Nik 2026-10-31/11-01; feature spec project-documents/r88-icon-guess): once a season, before the transfer
    // window, both phones reveal one masked card in four stages and each manager has two guesses. The round record is
    // rivalries/{rid}/primePackRounds/season_N. Each manager writes only his own facts: his arrival (the server time, once),
    // which he withdraws again only while the other manager has not arrived (he left the screen: ssjrPackLeave), then one
    // guess at a time (his own chip count +1, at most 2, and namedBy set to himself when right), only while the round
    // runs: the stages start 3 s after the later arrival and their guess timers are 25/20/20/20 s, each after a 1.5 s
    // reveal (js/iconGuess.js), so guesses count from 2 s to 97 s after the later arrival (1 s and 2 s of network slack).
    // Whether a guess is right is decided on the guessing phone (the answer is not stored, so it is never readable early);
    // the Rules bind the order: namedBy is set once, never changed, the other manager's facts never touched, and the record's
    // updatedAt is the winning write's server time (no write is allowed after it). A season result may carry primePack:N only
    // for the manager this record names, with N the points of the stage that server time falls in: 4 before 30.5 s after the
    // later arrival, 3 before 52 s, 2 before 73.5 s, then 1 (ssjrPackPoints). Changing the guess window means changing these.
    function ssjrPackOther(role) { return role == 'playerOne' ? 'playerTwo' : 'playerOne'; }
    function ssjrPackRoleMap(value) {
      return value is map && value.keys().size() == 2 && value.keys().hasOnly(['playerOne','playerTwo']);
    }
    function ssjrPackShape(root, rivalryId, seasonId) {
      return root.keys().size() == 11
        && root.keys().hasOnly(['schemaVersion','objectType','rivalryId','seasonNumber','arrived','chipsUsed','namedBy','revision','activeSessionId','updatedByDeviceId','updatedAt'])
        && root.schemaVersion == 1
        && root.objectType == 'sharedPrimePackRound'
        && root.rivalryId == rivalryId
        && ssjrResultsSeasonMatches(seasonId, root.seasonNumber)
        && ssjrPackRoleMap(root.arrived)
        && ssjrPackRoleMap(root.chipsUsed)
        && root.chipsUsed.playerOne is int && root.chipsUsed.playerOne >= 0 && root.chipsUsed.playerOne <= 2
        && root.chipsUsed.playerTwo is int && root.chipsUsed.playerTwo >= 0 && root.chipsUsed.playerTwo <= 2
        && (root.namedBy == null || root.namedBy == 'playerOne' || root.namedBy == 'playerTwo')
        && root.revision is int
        && root.updatedAt == request.time
        && ssjrWriteAuthorityValid(rivalryId, root.updatedByDeviceId, root.activeSessionId);
    }
    function ssjrPackCreateValid(rivalryId, seasonId) {
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      return ssjrPackShape(after, rivalryId, seasonId)
        && after.revision == 1
        && after.arrived[role] == request.time
        && after.arrived[ssjrPackOther(role)] == null
        && after.chipsUsed.playerOne == 0
        && after.chipsUsed.playerTwo == 0
        && after.namedBy == null;
    }
    function ssjrPackArrive(before, after, role) {
      return before.arrived[role] == null
        && after.arrived[role] == request.time
        && after.chipsUsed[role] == before.chipsUsed[role]
        && after.namedBy == null;
    }
    function ssjrPackLeave(before, after, role) {
      return before.arrived[role] != null
        && before.arrived[ssjrPackOther(role)] == null
        && after.arrived[role] == null
        && after.chipsUsed[role] == before.chipsUsed[role]
        && after.namedBy == null;
    }
    function ssjrPackGuessInTime(a, b) {
      return request.time >= (a > b ? a : b) + duration.value(2, 's')
        && request.time <= (a > b ? a : b) + duration.value(97, 's');
    }
    function ssjrPackGuess(before, after, role) {
      return before.arrived.playerOne != null
        && before.arrived.playerTwo != null
        && after.arrived[role] == before.arrived[role]
        && after.chipsUsed[role] == before.chipsUsed[role] + 1
        && (after.namedBy == null || after.namedBy == role)
        && ssjrPackGuessInTime(before.arrived.playerOne, before.arrived.playerTwo);
    }
    function ssjrPackUpdateValid(rivalryId, seasonId) {
      let before = resource.data;
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      let other = ssjrPackOther(role);
      return ssjrPackShape(after, rivalryId, seasonId)
        && after.seasonNumber == before.seasonNumber
        && after.revision == before.revision + 1
        && before.namedBy == null
        && after.arrived[other] == before.arrived[other]
        && after.chipsUsed[other] == before.chipsUsed[other]
        && (ssjrPackArrive(before, after, role) || ssjrPackLeave(before, after, role) || ssjrPackGuess(before, after, role));
    }
    function ssjrPackStagePoints(at, a, b) {
      return at < (a > b ? a : b) + duration.value(30500, 'ms') ? 4
        : (at < (a > b ? a : b) + duration.value(52000, 'ms') ? 3
        : (at < (a > b ? a : b) + duration.value(73500, 'ms') ? 2 : 1));
    }
    function ssjrPackPoints(rivalryId, seasonId, managerRole, points) {
      let round = get(/databases/$(database)/documents/rivalries/$(rivalryId)/primePackRounds/$(seasonId)).data;
      return round.namedBy == managerRole
        && points == ssjrPackStagePoints(round.updatedAt, round.arrived.playerOne, round.arrived.playerTwo);
    }
// SSJR_SEASON_RESULTS_FUNCTIONS_END

// SSJR_SEASON_RESULTS_MATCH_BEGIN
      match /seasonResults/{seasonId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrResultsValidCreate(rivalryId, seasonId);
        allow update: if ssjrResultsValidUpdate(rivalryId, seasonId);

        match /roles/{managerRole} {
          allow get: if ssjrResultsPrivateReadable(rivalryId, seasonId, managerRole);
          allow list, update, delete: if false;
          allow create: if ssjrResultsPrivateCreateValid(rivalryId, seasonId, managerRole);
        }
      }
      match /primePackRounds/{seasonId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrPackCreateValid(rivalryId, seasonId);
        allow update: if ssjrPackUpdateValid(rivalryId, seasonId);
      }
// SSJR_SEASON_RESULTS_MATCH_END

```


## FILE: tests/firebase/prime-pack-rules-emulator.cjs
```
"use strict";
// r87 Prime Pack (Nik 2026-10-31/11-01) in the composed production Rules (firestore.spark.generated.rules).
// One shared round record per season, rivalries/{rid}/primePackRounds/season_N, written only by the two managers through
// js/iconGuessStep.js (the real step code runs here against the emulator):
//   1. Arrivals: each manager writes only his own arrival, at server time, once; the other's facts never move. Leaving the
//      screen before the other manager has arrived withdraws it (Fable F12-02), once both have arrived it stays.
//   2. Guesses: only after both arrived, from 2 s to 97 s after the later arrival (stage timers 25/20/20/20 s after a 3 s
//      count-in, each after a 1.5 s reveal), one chip at a time, two at most; a manager can name only himself the winner;
//      once there is a winner nothing changes.
//   3. The points (Nik 2026-11-01): a Season Result with primePack N (1 to 4) is accepted only from the manager the round names,
//      and only when N is the stage of the winning write's server time (4 before 30.5 s after the later arrival, 3 before 52 s,
//      2 before 73.5 s, then 1). The phone's clock plays no part.
//   4. No list, no delete, reads only for the two managers.
// The score (up to +4, season maximum 15) and the 10-season expression budget are in tests/firebase/europa-league-rules-emulator.cjs.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/prime-pack-rules-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment,assertSucceeds,assertFails}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const PROJECT="demo-cms-prime-pack-rules";
let projectSeq=0;
const nextProject=label=>`${PROJECT}-${label}-${projectSeq++}`;
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const hex64=seed=>crypto.createHash("sha256").update(String(seed)).digest("hex");

// Every expected refusal must be an ordinary Rules denial, never the evaluation limit.
async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}
async function assertAccepted(promise,label){
  try{await promise;}
  catch(error){throw new assert.AssertionError({message:`${label}: must be accepted, got ${error.code}: ${String(error.message||"").trim().split("\n")[0]}`});}
}

// ---------------------------------------------------------------------------------------------------------------
// 1 + 2. Season Results and Season Commit (rivalry built by the real providers, as the Results diagnostic does).
// ---------------------------------------------------------------------------------------------------------------
const A="acct_pack_rules_a",B="acct_pack_rules_b";
const RID=`pair_${"7".repeat(64)}`;
const SID=`session_${"d".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
// The Results provider validates the 7-key result it is given (the EL key is the protocol PR). To test the Rules alone,
// this SDK swaps the result inside the private role document the provider writes, right at transaction.set.
function injectingSdk(result){
  return {Timestamp,doc,serverTimestamp,runTransaction:(db,callback)=>firestoreSdk.runTransaction(db,transaction=>callback(new Proxy(transaction,{
    get(target,property){
      if(property==="set")return (ref,data,...rest)=>{
        if(/\/seasonResults\/season_[0-9]+\/roles\/(playerOne|playerTwo)$/.test(ref.path))data={...data,result:JSON.parse(JSON.stringify(result))};
        return target.set(ref,data,...rest);
      };
      const value=target[property];
      return typeof value==="function"?value.bind(target):value;
    }
  })))};
}
function account(id){return {objectType:"account",objectId:id,lifecycleState:"live",data:{status:"active"}};}
function device(id){return {objectType:"device",objectId:id,lifecycleState:"live",data:{deviceId:id,state:"active"}};}
function rivalryDoc(){return {objectType:"rivalry",objectId:RID,lifecycleState:"live",data:{connectionState:"active",authorizedAccountIds:[A,B],managerSlots:[
  {slotId:"playerOne",accountId:A,profileId:`profile_${"1".repeat(24)}`,saveId:`save_${"3".repeat(24)}`,entitlementState:"active"},
  {slotId:"playerTwo",accountId:B,profileId:`profile_${"2".repeat(24)}`,saveId:`save_${"4".repeat(24)}`,entitlementState:"active"}
]}};}
function sessionDoc(now){
  const createdAt=Timestamp.fromMillis(now-60_000),lastActivityAt=Timestamp.fromMillis(now-1_000),expiresAt=Timestamp.fromMillis(now+4*60*60*1000);
  return {schemaVersion:1,objectType:"session",objectId:SID,revision:1,parentRevision:0,lifecycleState:"live",contentHash:`sha256:${"0".repeat(64)}`,priorContentHash:`sha256:${"1".repeat(64)}`,updatedAt:lastActivityAt,updatedByAccountId:A,updatedByDeviceId:DA,data:{rivalryId:RID,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt,lastActivityAt,revokedAt:null},tombstone:null};
}
function base(db,uid,deviceId,now,sdk=plainSdk()){return {user:{uid},firestore:db,firebaseSdk:sdk,rivalryId:RID,sessionId:SID,deviceId,nowEpochMs:now,cryptoImpl:crypto.webcrypto};}
const SEVEN={leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,championsLeague:false,topScorer:true,topAssist:false};

async function prepareJourney(env,now){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,"accounts",A),account(A));await setDoc(doc(db,"accounts",B),account(B));
    await setDoc(doc(db,"accounts",A,"devices",DA),device(DA));await setDoc(doc(db,"accounts",B,"devices",DB),device(DB));
    await setDoc(doc(db,"rivalries",RID),rivalryDoc());await setDoc(doc(db,"rivalries",RID,"sessions",SID),sessionDoc(now));
  });
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const a=t=>base(dbA,A,DA,now+t),b=t=>base(dbB,B,DB,now+t);
  const must=(label,value)=>{if(!value||!value.ok)throw new Error(`${label} failed: ${JSON.stringify(value)}`);};
  for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:3}]])must(`setup ${type}`,await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}));
  must("setup confirm A",await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}));
  must("setup confirm B",await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}));
  must("career A",await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}));
  must("career B",await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}));
  must("transfer start",await startAfterSpins({...a(100),seasonNumber:1,operationId:op("transfer_op_",11),baseRevision:0},{...b(100),seasonNumber:1}));
  must("transfer end A",await Transfer.requestEndWindow({...a(200),seasonNumber:1,operationId:op("transfer_op_",12),baseRevision:1}));
  must("transfer end B",await Transfer.requestEndWindow({...b(300),seasonNumber:1,operationId:op("transfer_op_",13),baseRevision:2}));
  must("guess A",await Transfer.lockGuesses({...a(400),seasonNumber:1,operationId:op("transfer_op_",14),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
  must("guess B",await Transfer.lockGuesses({...b(500),seasonNumber:1,operationId:op("transfer_op_",15),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
  must("signing A",await Transfer.lockSignings({...a(600),seasonNumber:1,operationId:op("transfer_op_",16),baseRevision:5,signings:[{slot:1,name:"Daniel Pack",leagueId:"spain-primera-division",nationalityId:"england"}]}));
  must("signing B",await Transfer.lockSignings({...b(700),seasonNumber:1,operationId:op("transfer_op_",17),baseRevision:6,signings:[{slot:1,name:"Nik Pack",leagueId:"england-premier-league",nationalityId:"brazil"}]}));
  return {dbA,dbB};
}

const {updateDoc,deleteDoc,getDocs,collection}=firestoreSdk;
const Step=require("../../js/iconGuessStep.js");
const Guess=require("../../js/iconGuess.js");
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const io=(db,deviceId)=>({firestore:db,sdk:plainSdk(),rivalryId:RID,sessionId:SID,deviceId,now:()=>Date.now()});
const ctx=(role,season=1)=>({rivalryId:RID,managerRole:role,season,confirmedAtMs:Date.now()});
const stamp=deviceId=>({activeSessionId:SID,updatedByDeviceId:deviceId,updatedAt:serverTimestamp()});

(async()=>{
  const checks=[];
  const env=await initializeTestEnvironment({projectId:nextProject("round"),firestore:{rules:RULES}});
  try{
    const now=Date.now(),{dbA,dbB}=await prepareJourney(env,now);
    const roundRef=(db,season=1)=>doc(db,"rivalries",RID,"primePackRounds",`season_${season}`);
    const read=async(season=1)=>{let data;await env.withSecurityRulesDisabled(async context=>{data=(await getDoc(roundRef(context.firestore(),season))).data();});return data;};
    assert.equal(Step.applies(ctx("playerOne")),true,"a Showdown confirmed now plays Prime Pack");
    assert.equal(Step.applies({...ctx("playerOne"),confirmedAtMs:Date.parse("2026-10-01T00:00:00Z")}),false,"a Showdown confirmed before r87 does not");

    // 1. Arrivals.
    await assertPlainDenial(setDoc(roundRef(dbB),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:serverTimestamp(),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...stamp(DB)}),"Nik creates the round with Daniel's arrival");
    checks.push("a manager cannot create the round with the other manager's arrival");
    await assertPlainDenial(setDoc(roundRef(dbA),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:Timestamp.fromMillis(Date.now()-60_000),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...stamp(DA)}),"an arrival time from the phone");
    checks.push("an arrival is the server's time, never the phone's");
    await assertPlainDenial(setDoc(roundRef(dbA),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:1,arrived:{playerOne:serverTimestamp(),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:"playerOne",revision:1,...stamp(DA)}),"a round created with a winner");
    checks.push("a round cannot be created with a winner");
    assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne")),"created");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"arrived.playerOne":serverTimestamp(),revision:2,...stamp(DA)}),"Daniel arrives a second time");
    assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne")),"already","the step never moves an arrival");
    checks.push("Daniel's arrival (the step) is accepted once; a second arrival never moves the start");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"arrived.playerTwo":serverTimestamp(),revision:2,...stamp(DA)}),"Daniel writes Nik's arrival");
    checks.push("a manager cannot write the other manager's arrival");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"chipsUsed.playerOne":1,revision:2,...stamp(DA)}),"a guess before both arrived");
    checks.push("no guess before both managers are on the screen");
    assert.equal(await Step.arrive(io(dbB,DB),ctx("playerTwo")),"arrived");
    const arrivedDoc=await read();
    assert.ok(arrivedDoc.arrived.playerOne&&arrivedDoc.arrived.playerTwo&&arrivedDoc.revision===2);
    checks.push("Nik's arrival (the step) is accepted; both arrivals are server times");

    // 2. Guesses.
    await assertPlainDenial(updateDoc(roundRef(dbA),{"chipsUsed.playerOne":1,revision:3,...stamp(DA)}),"a guess within 2 s of the later arrival");
    checks.push("a guess is refused before the round can have started (later arrival + 2 s)");
    await wait(3200);// past the 3 s lead: the step itself refuses a guess before the first beat
    const wrong=await Step.applyGuess(io(dbA,DA),ctx("playerOne"),false);
    assert.equal(wrong.ok,true,`Daniel's wrong guess: ${JSON.stringify(wrong)}`);
    let current=await read();assert.deepEqual(current.chipsUsed,{playerOne:1,playerTwo:0});assert.equal(current.namedBy,null);
    checks.push("a wrong guess (the step) uses one chip and stores no name");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerOne":2,revision:4,...stamp(DB)}),"Nik spends Daniel's chip");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":1,namedBy:"playerOne",revision:4,...stamp(DB)}),"Nik names Daniel the winner");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":2,revision:4,...stamp(DB)}),"Nik spends two chips at once");
    await assertPlainDenial(updateDoc(roundRef(dbB),{namedBy:"playerTwo",revision:4,...stamp(DB)}),"Nik wins without a guess");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":1,revision:3,...stamp(DB)}),"a guess that skips the revision");
    checks.push("a manager cannot spend the other's chip, name the other the winner, spend two chips at once, win without a guess or skip the revision");
    const right=await Step.applyGuess(io(dbB,DB),ctx("playerTwo"),true);
    assert.equal(right.ok,true,`Nik's right guess: ${JSON.stringify(right)}`);
    current=await read();assert.equal(current.namedBy,"playerTwo");assert.deepEqual(current.chipsUsed,{playerOne:1,playerTwo:1});
    checks.push("the first right guess (the step) wins the round");
    const late=await Step.applyGuess(io(dbA,DA),ctx("playerOne"),true);
    assert.equal(late.ok,false);assert.equal(late.reason,"ROUND_OVER");
    await assertPlainDenial(updateDoc(roundRef(dbA),{"chipsUsed.playerOne":2,namedBy:"playerOne",revision:5,...stamp(DA)}),"a right guess after the winner");
    await assertPlainDenial(updateDoc(roundRef(dbB),{"chipsUsed.playerTwo":2,revision:5,...stamp(DB)}),"the winner guesses again");
    checks.push("once there is a winner nothing changes: a later right guess loses, and the winner cannot write again");
    const record=Step.record(current,1);
    assert.equal(record.winner.role,"playerTwo");assert.equal(record.winner.beat,0,"named in stage 1");
    checks.push("the stored round reads back as the round logic's record (winner, stage)");

    // A round whose later arrival was 100 s ago: every guess is too late.
    await env.withSecurityRulesDisabled(async context=>{
      const old=Timestamp.fromMillis(Date.now()-120_000);
      await setDoc(roundRef(context.firestore(),2),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:2,arrived:{playerOne:old,playerTwo:old},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:2,activeSessionId:SID,updatedByDeviceId:DA,updatedAt:old});
    });
    await assertPlainDenial(updateDoc(roundRef(dbA,2),{"chipsUsed.playerOne":1,namedBy:"playerOne",revision:3,...stamp(DA)}),"a right guess 120 s after the later arrival");
    await env.withSecurityRulesDisabled(async context=>{
      const old=Timestamp.fromMillis(Date.now()-99_000);
      await setDoc(roundRef(context.firestore(),2),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:2,arrived:{playerOne:old,playerTwo:old},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:2,activeSessionId:SID,updatedByDeviceId:DA,updatedAt:old});
    });
    await assertPlainDenial(updateDoc(roundRef(dbA,2),{"chipsUsed.playerOne":1,revision:3,...stamp(DA)}),"a guess 99 s after the later arrival, after stage 4 closed");
    checks.push("a guess more than 97 s after the later arrival is refused (stage 4 closes at 95 s): no guessing during the full reveal");
    await assertPlainDenial(setDoc(roundRef(dbA,"x"),{seasonNumber:1}),"a round outside season_N");
    await assertPlainDenial(setDoc(roundRef(dbA,3),{schemaVersion:1,objectType:"sharedPrimePackRound",rivalryId:RID,seasonNumber:4,arrived:{playerOne:serverTimestamp(),playerTwo:null},chipsUsed:{playerOne:0,playerTwo:0},namedBy:null,revision:1,...stamp(DA)}),"a round whose season does not match its id");
    checks.push("the round's id and season must match");

    // Leaving while waiting (Fable F12-02): Daniel arrives, goes back Home before Nik is there, so the round cannot start
    // without him; he comes back and arrives again. Once both are on the screen, nobody can withdraw.
    assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne",4)),"created");
    await assertPlainDenial(updateDoc(roundRef(dbB,4),{"arrived.playerOne":null,revision:2,...stamp(DB)}),"Nik withdraws Daniel's arrival");
    checks.push("a manager cannot withdraw the other manager's arrival");
    assert.equal(await Step.leave(io(dbA,DA),ctx("playerOne",4)),"left");
    current=await read(4);assert.equal(current.arrived.playerOne,null);assert.equal(current.revision,2);
    assert.equal(await Step.arrive(io(dbB,DB),ctx("playerTwo",4)),"arrived");
    await assertPlainDenial(updateDoc(roundRef(dbB,4),{"chipsUsed.playerTwo":1,revision:4,...stamp(DB)}),"Nik guesses while Daniel is away");
    checks.push("Daniel's arrival (the step) is withdrawn when he leaves before Nik arrives: Nik alone cannot start or guess");
    assert.equal(await Step.arrive(io(dbA,DA),ctx("playerOne",4)),"arrived");
    current=await read(4);assert.ok(current.arrived.playerOne&&current.arrived.playerTwo);assert.equal(current.revision,4);
    assert.equal(await Step.leave(io(dbA,DA),ctx("playerOne",4)),"stays");
    await assertPlainDenial(updateDoc(roundRef(dbA,4),{"arrived.playerOne":null,revision:5,...stamp(DA)}),"Daniel withdraws after both arrived");
    checks.push("coming back arrives again (a fresh server time); once both are on the screen an arrival is never withdrawn");

    // 3. The points.
    const publish=async(db,uid,deviceId,result,n,baseRevision,t)=>Results.publishResult({...base(db,uid,deviceId,now+t),seasonNumber:1,operationId:op("season_result_op_",n),baseRevision,result});
    const daniel=await publish(dbA,A,DA,{...SEVEN,primePack:4},31,0,900);
    assert.equal(daniel.ok,false,`Daniel claims the Prime Pack points Nik won: ${JSON.stringify(daniel)}`);assert.equal(daniel.code,"permission-denied");
    checks.push("a Season Result with Prime Pack points from the manager who did not win is refused");
    // The stage comes from the winning write's server time. Move that time through the four stages (Rules off) and claim
    // every other value: each is refused. The real round (stage 1) is put back before the real publish.
    const real=await read();
    const later=Math.max(real.arrived.playerOne.toMillis(),real.arrived.playerTwo.toMillis());
    let n=40;
    for(const [offset,points] of [[3_000,4],[30_400,4],[30_600,3],[51_900,3],[52_100,2],[73_400,2],[73_600,1],[94_000,1]]){
      await env.withSecurityRulesDisabled(async context=>{await setDoc(roundRef(context.firestore()),{...real,updatedAt:Timestamp.fromMillis(later+offset)});});
      for(const wrongPoints of [1,2,3,4].filter(v=>v!==points)){
        const claim=await publish(dbB,B,DB,{...SEVEN,leaguePosition:2,primePack:wrongPoints},n+=1,0,1000+n);
        assert.equal(claim.ok,false,`Nik claims ${wrongPoints} for a win ${offset} ms after the later arrival: ${JSON.stringify(claim)}`);
      }
      const page=Step.record({...real,updatedAt:Timestamp.fromMillis(later+offset)},1);
      assert.equal(Guess.points(page).playerTwo,points,`the step gives ${points} for ${offset} ms, as the Rules do`);
    }
    await env.withSecurityRulesDisabled(async context=>{await setDoc(roundRef(context.firestore()),real);});
    checks.push("the Rules accept only the stage's points by the winning write's server time (4, 3, 2, 1 across 30.5 s, 52 s and 73.5 s) and the step agrees at every edge");
    assert.equal(await Step.pointsFor({firestore:dbA,sdk:plainSdk(),rivalryId:RID},ctx("playerOne")),0);
    assert.equal(await Step.pointsFor({firestore:dbB,sdk:plainSdk(),rivalryId:RID},ctx("playerTwo")),4);
    checks.push("the step reads the points back for each manager (Daniel 0, Nik 4 for a stage 1 win)");
    const danielPlain=await publish(dbA,A,DA,SEVEN,32,0,1000);
    assert.equal(danielPlain.ok,true,`Daniel's result without the key: ${JSON.stringify(danielPlain)}`);
    const nik=await publish(dbB,B,DB,{...SEVEN,leaguePosition:2,primePack:4},33,1,1100);
    assert.equal(nik.ok,true,`Nik's result with the Prime Pack points: ${JSON.stringify(nik)}`);
    let stored;await env.withSecurityRulesDisabled(async context=>{stored=(await getDoc(doc(context.firestore(),"rivalries",RID,"seasonResults","season_1","roles","playerTwo"))).data();});
    assert.equal(stored.result.primePack,4);
    checks.push("the winner's Season Result with primePack 4 is accepted and stored as the integer 4; the other's plain result is accepted");

    // 4. Reads, lists, deletes.
    await assertAccepted(getDoc(roundRef(dbA)),"Daniel reads the round");
    await assertPlainDenial(getDoc(roundRef(env.authenticatedContext("acct_stranger").firestore())),"a stranger reads the round");
    await assertPlainDenial(getDocs(collection(dbA,"rivalries",RID,"primePackRounds")),"listing the rounds");
    await assertPlainDenial(deleteDoc(roundRef(dbB)),"deleting the round");
    checks.push("only the two managers read the round; no list, no delete");
  }finally{await env.cleanup();}
  for(const check of checks)process.stdout.write(`ok ${check}\n`);
  process.stdout.write(`PASS r87 Prime Pack Rules emulator: ${checks.length} checks.\n`);
})().catch(error=>{console.error(error);process.exitCode=1;});

```


## FILE: tests/firebase/prime-pack-ten-season-emulator.cjs
```
"use strict";
// r87 Prime Pack, two whole 10-season Showdowns in the Firestore emulator under the composed production Rules
// (firestore.spark.generated.rules). Built on tests/firebase/prime-pack-three-season-emulator.cjs: the real step code
// (js/iconGuessStep.js) writes every round, the real providers publish the private Season Results, commit each season
// (commit + 2 acknowledgements), read Scoring / History / Multi after every season, reconcile the final and run the real
// Terminal Close (js/sparkTerminalClose.js); then the session-free completed reader, the Adapter and the career Analytics
// build the career rows that js/careerScreenSeam.js judges for Golden Showdown.
//   Showdown A (both phones play Prime Pack, 10 seasons): Prime Pack wins of 4, 3, 2, 1 (stages 1 to 4) and nobody, spread over
//     both managers. Totals are checked against the score() helper after every season; at the end the Golden Showdown
//     threshold is 150 (not 110) and nobody is Golden.
//   Showdown B (a new Showdown of the same pair): Nik plays the maximum season (CL, league, cup, 100 points, awards = 11) plus
//     Prime Pack 4 in every season, 15 x 10 = 150 = Golden.
// Run inside the Firestore emulator:
//   npx --yes firebase-tools@15.28.1 emulators:exec --only firestore --project demo-cms-gameplay-fast-terminal \
//     "node tests/firebase/prime-pack-ten-season-emulator.cjs"
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const firestoreSdk=require("firebase/firestore");
const {Timestamp,doc,getDoc,setDoc,serverTimestamp}=firestoreSdk;
const {initializeTestEnvironment}=require("@firebase/rules-unit-testing");

global.window=globalThis;
require("../../data/transferOptions.js");
const Setup=require("../../js/sparkSharedShowdownSetup.js");
const Career=require("../../js/sparkSharedCareerStart.js");
const Transfer=require("../../js/sparkSharedTransferChallenge.js");
// r87 RT5-FLOW-02: in a roulette-eligible Showdown START needs both managers' spun marks, so each manager writes his own first.
async function startAfterSpins(start,partner){for(const [options,role] of [[start,"playerOne"],[partner,"playerTwo"]]){const mark=await Transfer.markSpun({...options,managerRole:role});if(!mark||mark.ok!==true)return mark;}return Transfer.startWindow(start);}
const Results=require("../../js/sparkSharedSeasonResults.js");
const Commit=require("../../js/sparkSharedSeasonCommit.js");
const Scoring=require("../../js/sparkSharedCanonicalScoring.js");
const History=require("../../js/sparkSharedHistoryConvergence.js");
const HistoryProtocol=require("../../js/sharedHistoryConvergence.js");
const Multi=require("../../js/sparkSharedMultiSeasonProgression.js");
const Final=require("../../js/sharedFinalReconciliation.js");
const Terminal=require("../../js/sharedTerminalClose.js");
const TerminalProvider=require("../../js/sparkTerminalClose.js");
const Sessions=require("../../js/sparkPrivateSession.js");
const Reader=require("../../js/sparkCompletedShowdownReader.js");
const Adapter=require("../../js/sharedClosedShowdownAdapter.js");
const Analytics=require("../../js/sharedCareerAnalytics.js");
const Active=require("../../js/sharedActiveShowdownAdapter.js");
const Seam=require("../../js/careerScreenSeam.js");
const Step=require("../../js/iconGuessStep.js");
const Guess=require("../../js/iconGuess.js");
const Icons=require("../../data/icons.js");
const Names=require("../../js/iconNames.js");
const {score}=require("../support/career-fixture-helpers.cjs");

const RULES=fs.readFileSync("firestore.spark.generated.rules","utf8");
const LIMIT=/maximum of 1000 expressions/;
const PROJECT="demo-cms-prime-pack-ten-season";
function op(prefix,n){return prefix+Number(n).toString(16).padStart(32,"0");}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function assertPlainDenial(promise,label){
  let error=null;
  try{await promise;}catch(caught){error=caught;}
  assert.ok(error,`${label}: must be refused`);
  assert.equal(error.code,"permission-denied",`${label}: expected permission-denied, got ${error.code}: ${error.message}`);
  assert.doesNotMatch(String(error.message||""),LIMIT,`${label}: refused by the Rules evaluation limit, not by the Rules`);
}

// ---------------------------------------------------------------------------------------------------------------
// Fixture: the same envelope documents the completed-Showdown emulator test seeds (so the real Terminal Close and the
// session-free reader run on them). playerOne = Daniel (account A, coordinator), playerTwo = Nik (account B).
// ---------------------------------------------------------------------------------------------------------------
const A="acct_pack10_daniel",B="acct_pack10_nik";
const RID_A=`pair_a${"1".repeat(63)}`,RID_B=`pair_a${"2".repeat(63)}`;
const SID_A=`session_${"a".repeat(64)}`,SID_B=`session_${"b".repeat(64)}`;
const DA=`device_${"a".repeat(32)}`,DB=`device_${"b".repeat(32)}`;
const PA=`profile_${"1".repeat(24)}`,PB=`profile_${"2".repeat(24)}`,SA=`save_${"3".repeat(24)}`,SB=`save_${"4".repeat(24)}`;
const TOTAL_SEASONS=10;
function plainSdk(){return {Timestamp,doc,runTransaction:firestoreSdk.runTransaction,serverTimestamp};}
function canonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(Array.isArray(value))return value.map(canonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=canonical(value[key]);return out;}return value;}
async function digest(value){const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));const hash=await crypto.webcrypto.subtle.digest("SHA-256",bytes);return `sha256:${Buffer.from(hash).toString("hex")}`;}
async function envelope(objectType,objectId,revision,data,{accountId=A,deviceId=DA,updatedAt=Timestamp.fromMillis(Date.now()),priorHash=null}={}){return {schemaVersion:1,objectType,objectId,revision,parentRevision:revision===0?null:revision-1,lifecycleState:"live",contentHash:await digest({objectType,objectId,revision,data}),priorContentHash:revision===0?null:(priorHash||`sha256:${"0".repeat(64)}`),updatedAt,updatedByAccountId:accountId,updatedByDeviceId:deviceId,data,tombstone:null};}
async function accountDoc(uid){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("account",uid,0,{status:"active",createdAt:now,deletionRequestedAt:null},{accountId:uid,deviceId:null,updatedAt:now});}
async function deviceDoc(uid,id,seedChar){const now=Timestamp.fromMillis(Date.now()-120000);return envelope("device",id,0,{deviceId:id,installationId:`installation_${seedChar.repeat(32).slice(0,32)}`,displayLabel:null,state:"active",registeredAt:now,lastSeenAt:now,revokedAt:null},{accountId:uid,deviceId:id,updatedAt:now});}
function slots(){return [
  {slotId:"playerOne",accountId:A,profileId:PA,saveId:SA,displayLabel:"Daniel",entitlementState:"active",deletionConsent:false},
  {slotId:"playerTwo",accountId:B,profileId:PB,saveId:SB,displayLabel:"Nik",entitlementState:"active",deletionConsent:false}
];}
async function rivalryDoc(id){const now=Timestamp.fromMillis(Date.now()-90000),data={connectionState:"active",connectionStateBeforeDeletion:null,managerSlots:slots(),authorizedAccountIds:[A,B],createdByAccountId:A,createdAt:now};return envelope("rivalry",id,0,data,{accountId:A,deviceId:DA,updatedAt:now});}
async function sessionDoc(id,sid,nowMs){const createdAt=Timestamp.fromMillis(nowMs-60000),lastActivityAt=Timestamp.fromMillis(nowMs-1000);return Sessions.buildEnvelope({sessionId:sid,revision:1,parentRevision:0,priorContentHash:`sha256:${"9".repeat(64)}`,updatedAt:lastActivityAt,accountId:A,deviceId:DA,data:{rivalryId:id,state:"active",hostAccountId:A,memberAccountIds:[A,B],createdAt,expiresAt:Timestamp.fromMillis(nowMs+4*60*60*1000),lastActivityAt,revokedAt:null},cryptoImpl:crypto.webcrypto});}
function localAuthority(role){const slot=slots().find(item=>item.slotId===role);return {phase:"REMOTE_OBSERVED",canonicalStorageMutation:false,providerWriteRequired:false,automaticLocalApply:false,candidateCOnly:true,binding:{saveId:slot.saveId,profileId:slot.profileId,managerRole:role}};}

// Base results (no Prime Pack key) and their hand-checked scores; every league value is valid for an 18 or a 20 team league.
const R=(o)=>({leaguePosition:9,leaguePoints:40,leagueGoals:40,domesticCup:false,championsLeague:false,topScorer:false,topAssist:false,...o});
const PROFILES=[
  {score:0,r:R({})},                                                                                                                    // 0: nothing
  {score:1,r:R({leaguePosition:5,topAssist:true})},                                                                                     // 1: award
  {score:4,r:R({leaguePosition:1,leaguePoints:90,leagueGoals:70,domesticCup:true})},                                                    // 2: title + cup
  {score:6,r:R({leaguePosition:1,leaguePoints:102,leagueGoals:92,domesticCup:true,topScorer:true})},                                    // 3: title + cup + 100 pts + award
  {score:5,r:R({leaguePosition:2,leaguePoints:80,leagueGoals:70,championsLeague:true})},                                                // 4: CL only
  {score:9,r:R({leaguePosition:1,leaguePoints:100,leagueGoals:95,domesticCup:true,topScorer:true,europaLeague:true})},                  // 5: EL + title + cup + 100 pts + award
  {score:11,r:R({leaguePosition:1,leaguePoints:102,leagueGoals:101,domesticCup:true,championsLeague:true,topScorer:true,topAssist:true})},// 6: the old maximum
  {score:5,r:R({leaguePosition:3,leaguePoints:60,leagueGoals:55,domesticCup:true,topAssist:true,europaLeague:true})}                    // 7: EL + cup + award
];
// plan[season-1] = {winner: role or null, stage: 1..4 or null}; the stage's points are 4, 3, 2, 1.
const NOBODY={winner:null,stage:null};
const D=stage=>({winner:"playerOne",stage}),N=stage=>({winner:"playerTwo",stage});
const SHOWDOWNS={
  A:{label:"Showdown A",rid:RID_A,sid:SID_A,
    plan:[N(1),D(2),N(3),D(4),NOBODY,D(1),N(2),D(3),N(4),NOBODY],
    profiles:{playerOne:[3,0,5,2,1,7,4,6,0,3],playerTwo:[6,1,2,7,3,0,5,4,2,1]}},
  B:{label:"Showdown B",rid:RID_B,sid:SID_B,
    plan:Array.from({length:TOTAL_SEASONS},()=>N(1)),
    profiles:{playerOne:[3,0,3,0,3,0,3,0,3,0],playerTwo:Array.from({length:TOTAL_SEASONS},()=>6)}}
};
for(const spec of Object.values(SHOWDOWNS)){
  spec.expected=spec.plan.map((entry,i)=>{
    const out={};
    for(const role of ["playerOne","playerTwo"]){
      const profile=PROFILES[spec.profiles[role][i]],points=entry.winner===role?[4,3,2,1][entry.stage-1]:0;
      const result={...profile.r,...(points?{primePack:points}:{})};
      out[role]={result,points,total:profile.score+points};
    }
    return out;
  });
}

async function seedBase(env,now){
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    for(const [uid,id,seedChar] of [[A,DA,"a"],[B,DB,"b"]]){await setDoc(doc(db,"accounts",uid),await accountDoc(uid));await setDoc(doc(db,"accounts",uid,"devices",id),await deviceDoc(uid,id,seedChar));}
    for(const spec of Object.values(SHOWDOWNS)){await setDoc(doc(db,"rivalries",spec.rid),await rivalryDoc(spec.rid));await setDoc(doc(db,"rivalries",spec.rid,"sessions",spec.sid),await sessionDoc(spec.rid,spec.sid,now));}
  });
}

(async()=>{
  const checks=[];
  const ok=label=>checks.push(label);
  const startedAt=Date.now();
  const env=await initializeTestEnvironment({projectId:PROJECT,firestore:{rules:RULES}});
  const dbA=env.authenticatedContext(A).firestore(),dbB=env.authenticatedContext(B).firestore();
  const dbOf={playerOne:dbA,playerTwo:dbB},deviceOf={playerOne:DA,playerTwo:DB},acctOf={playerOne:A,playerTwo:B};
  const readRaw=async ref=>{let data;await env.withSecurityRulesDisabled(async context=>{const snap=await getDoc(ref(context.firestore()));data=snap.exists()?snap.data():null;});return data;};
  const index=Names.defaultIndex();
  let opSeq=1000;
  const finals={};
  try{
    const now=Date.now();
    await seedBase(env,now);

    async function playShowdown(spec,{dual,refusals}){
      const {rid,sid,plan,expected,label}=spec;
      const base=(db,uid,deviceId,t)=>({user:{uid},firestore:db,firebaseSdk:plainSdk(),rivalryId:rid,sessionId:sid,deviceId,nowEpochMs:now+t,cryptoImpl:crypto.webcrypto});
      const a=t=>base(dbA,A,DA,t),b=t=>base(dbB,B,DB,t);
      const io=(role)=>({firestore:dbOf[role],sdk:plainSdk(),rivalryId:rid,sessionId:sid,deviceId:deviceOf[role],now:()=>Date.now()});
      const ctx=(role,season)=>({rivalryId:rid,managerRole:role,season,confirmedAtMs:Date.now()});
      const roundRef=(db,season)=>doc(db,"rivalries",rid,"primePackRounds",`season_${season}`);
      const must=(what,value)=>{if(!value||!value.ok)throw new Error(`${label} ${what} failed: ${JSON.stringify(value)}`);return value;};
      const tag=`${label}`;

      // ---- Setup (10 seasons), confirmed after the Prime Pack boundary, Career Start. ----
      for(const [type,baseRevision,n,extra] of [["open",0,1,{}],["commit-league",1,2,{}],["commit-clubs",2,3,{}],["commit-length",3,4,{totalSeasons:TOTAL_SEASONS}]])must(`setup ${type}`,await Setup.mutate({...a(n*10),type,baseRevision,operationId:op("setup_op_",n),...extra}));
      must("setup confirm A",await Setup.mutate({...a(50),type:"confirm",baseRevision:4,operationId:op("setup_op_",5)}));
      const confirmed=must("setup confirm B",await Setup.mutate({...b(60),type:"confirm",baseRevision:5,operationId:op("setup_op_",6)}));
      assert.equal(confirmed.state.phase,"SHOWDOWN_CONFIRMED");assert.equal(confirmed.state.totalSeasons,TOTAL_SEASONS);
      const ledger=await readRaw(d=>doc(d,"rivalries",rid,"sharedSetup","authoritative"));
      const confirmedAt=ledger.updatedAt.toMillis();
      assert.ok(Guess.eligible(rid,confirmedAt),`${label}: confirmed after the Prime Pack boundary`);
      assert.ok(confirmedAt>=Seam.PRIME_PACK_FROM_MS);
      must("career A",await Career.acknowledge({...a(70),operationId:op("career_start_op_",1),baseRevision:0}));
      must("career B",await Career.acknowledge({...b(80),operationId:op("career_start_op_",2),baseRevision:1}));
      ok(`${tag}: a 10-season Showdown is confirmed after the Prime Pack boundary and plays Prime Pack`);

      // ---- The ten rounds. The Rules do not order a round against the Transfer Challenge, so all ten run at once (each waits for
      // its own stage, measured from the server-stamped later arrival) instead of one after the other. ----
      const stageWaitMs={1:3_300,2:33_000,3:55_000,4:76_000};// inside stage 1 (3 to 30.5 s), 2 (30.5 to 52 s), 3 (52 to 73.5 s), 4 (73.5 to 95 s)
      const playRound=async season=>{
        const entry=plan[season-1];
        const draw=Guess.draw(rid,season,Icons.players.length,Icons.listVersion);
        const answer=Icons.players[draw.index],decoy=Icons.players[(draw.index+1)%Icons.players.length];
        const right=Names.check(index,answer.name,answer.id),wrong=Names.check(index,decoy.name,answer.id);
        assert.equal(right.correct,true);assert.equal(wrong.status,"match");assert.equal(wrong.correct,false);
        assert.equal(await Step.arrive(io("playerOne"),ctx("playerOne",season)),"created");
        assert.equal(await Step.arrive(io("playerTwo"),ctx("playerTwo",season)),"arrived");
        const arrived=(await getDoc(roundRef(dbA,season))).data();
        const later=Math.max(arrived.arrived.playerOne.toMillis(),arrived.arrived.playerTwo.toMillis());
        await wait(Math.max(0,later+stageWaitMs[entry.stage||1]-Date.now()));
        if(entry.winner===null){
          for(const role of ["playerOne","playerTwo","playerOne","playerTwo"]){const step=await Step.applyGuess(io(role),ctx(role,season),wrong.correct);assert.equal(step.ok,true,`${label} S${season} ${role} wrong guess: ${JSON.stringify(step)}`);}
        }else{
          const loser=entry.winner==="playerOne"?"playerTwo":"playerOne";
          const w=await Step.applyGuess(io(loser),ctx(loser,season),wrong.correct);assert.equal(w.ok,true,`${label} S${season} ${loser} wrong guess: ${JSON.stringify(w)}`);
          const r=await Step.applyGuess(io(entry.winner),ctx(entry.winner,season),right.correct);assert.equal(r.ok,true,`${label} S${season} ${entry.winner} right guess: ${JSON.stringify(r)}`);
        }
      };
      await Promise.all(plan.map((_,i)=>playRound(i+1)));
      for(let season=1;season<=TOTAL_SEASONS;season+=1){
        const entry=plan[season-1],stored=await readRaw(d=>roundRef(d,season));
        const draw=Guess.draw(rid,season,Icons.players.length,Icons.listVersion),answer=Icons.players[draw.index],decoy=Icons.players[(draw.index+1)%Icons.players.length];
        assert.equal(stored.namedBy,entry.winner);
        const record=Step.record(stored,season);
        if(entry.winner){
          assert.equal(record.winner.role,entry.winner);assert.equal(record.winner.beat,entry.stage-1,`${label} S${season}: the winning write lands in stage ${entry.stage}`);
          assert.equal(Guess.points(record)[entry.winner],[4,3,2,1][entry.stage-1]);
          assert.deepEqual(stored.chipsUsed,{playerOne:1,playerTwo:1});
        }else{
          assert.deepEqual(stored.chipsUsed,{playerOne:2,playerTwo:2});assert.equal(Guess.outcome(record,Date.now()).state,"draw");
        }
        assert.deepEqual(Object.keys(stored).sort(),["activeSessionId","arrived","chipsUsed","namedBy","objectType","revision","rivalryId","schemaVersion","seasonNumber","updatedAt","updatedByDeviceId"]);
        const text=JSON.stringify(stored);
        for(const secret of [answer.id,answer.name,decoy.id,decoy.name])assert.ok(!text.toLowerCase().includes(secret.toLowerCase()),`${label} S${season}: the round record stores "${secret}"`);
      }
      ok(`${tag}: all 10 rounds are played by the real step (wins in stage 1, 2, 3 and 4 for both managers, and nobody); each stage is the one the plan names`);
      ok(`${tag}: no stored round holds the Icon's name or id (exact key set, no secret in the JSON)`);

      // ---- The ten seasons. ----
      const publish=(role,season,result,baseRevision)=>Results.publishResult({...base(dbOf[role],acctOf[role],deviceOf[role],season*10_000+800+(opSeq%50)),seasonNumber:season,operationId:op("season_result_op_",opSeq++),baseRevision,result});
      const mustPublish=async(what,promise)=>{const value=await promise;assert.equal(value.ok,true,`${label} ${what}: ${JSON.stringify(value)}`);};
      const refuse=async(what,promise)=>{const value=await promise;assert.equal(value.ok,false,`${label} ${what}: must be refused, got ${JSON.stringify(value)}`);assert.equal(value.code,"permission-denied",`${label} ${what}: expected a Rules denial, got ${JSON.stringify(value)}`);};
      const cumulative={playerOne:0,playerTwo:0};
      let lastHistory=null,lastMulti=null,refused=0;
      for(let season=1;season<=TOTAL_SEASONS;season+=1){
        const offset=season*10_000,entry=plan[season-1],want=expected[season-1];
        for(const role of ["playerOne","playerTwo"])assert.ok(want[role].total>=0&&want[role].total<=15,`${label} S${season} ${role}: planned total ${want[role].total} is outside 0..15`);

        // Transfer Challenge.
        const n=season*10;
        must(`S${season} transfer start`,await startAfterSpins({...a(offset+100),seasonNumber:season,operationId:op("transfer_op_",n+1),baseRevision:0},{...b(offset+100),seasonNumber:season}));
        must(`S${season} end A`,await Transfer.requestEndWindow({...a(offset+200),seasonNumber:season,operationId:op("transfer_op_",n+2),baseRevision:1}));
        must(`S${season} end B`,await Transfer.requestEndWindow({...b(offset+300),seasonNumber:season,operationId:op("transfer_op_",n+3),baseRevision:2}));
        must(`S${season} guess A`,await Transfer.lockGuesses({...a(offset+400),seasonNumber:season,operationId:op("transfer_op_",n+4),baseRevision:3,guesses:[{slot:1,type:"league",valueId:"england-premier-league"},{slot:2,type:"nationality",valueId:"brazil"}]}));
        must(`S${season} guess B`,await Transfer.lockGuesses({...b(offset+500),seasonNumber:season,operationId:op("transfer_op_",n+5),baseRevision:4,guesses:[{slot:1,type:"league",valueId:"spain-primera-division"},{slot:2,type:"nationality",valueId:"germany"}]}));
        must(`S${season} signing A`,await Transfer.lockSignings({...a(offset+600),seasonNumber:season,operationId:op("transfer_op_",n+6),baseRevision:5,signings:[{slot:1,name:`Daniel Pack S${season}`,leagueId:"spain-primera-division",nationalityId:"england"}]}));
        must(`S${season} signing B`,await Transfer.lockSignings({...b(offset+700),seasonNumber:season,operationId:op("transfer_op_",n+7),baseRevision:6,signings:[{slot:1,name:`Nik Pack S${season}`,leagueId:"england-premier-league",nationalityId:"brazil"}]}));

        // Private Season Results: the winner (when there is one) carries primePack N; every other claim is refused.
        const loser=entry.winner==="playerOne"?"playerTwo":"playerOne";
        const plain=role=>{const {primePack:_pack,...rest}=want[role].result;return rest;};
        if(refusals){
          if(entry.winner){
            await refuse(`S${season} ${loser} (not the winner) claims primePack ${want[entry.winner].points}`,publish(loser,season,{...plain(loser),primePack:want[entry.winner].points},0));
            await refuse(`S${season} ${entry.winner} claims a wrong value`,publish(entry.winner,season,{...plain(entry.winner),primePack:want[entry.winner].points%4+1},0));
            refused+=2;
          }else{
            await refuse(`S${season} Daniel claims primePack 4 though nobody named the Icon`,publish("playerOne",season,{...plain("playerOne"),primePack:4},0));
            await refuse(`S${season} Nik claims primePack 1 though nobody named the Icon`,publish("playerTwo",season,{...plain("playerTwo"),primePack:1},0));
            refused+=2;
          }
        }
        const order=season%2===1?["playerOne","playerTwo"]:["playerTwo","playerOne"];
        for(const [i,role] of order.entries()){
          await mustPublish(`S${season} ${role}'s result`,publish(role,season,want[role].result,i));
          if(refusals&&i===0&&role===entry.winner){await refuse(`S${season} ${loser} also scores after the winner`,publish(loser,season,{...plain(loser),primePack:want[entry.winner].points},1));refused+=1;}
        }
        for(const role of ["playerOne","playerTwo"]){
          const stored=(await readRaw(d=>doc(d,"rivalries",rid,"seasonResults",`season_${season}`,"roles",role))).result;
          assert.deepEqual(stored,want[role].result,`${label} S${season} ${role}: the stored private result`);
          assert.equal("primePack" in stored,role===entry.winner,`${label} S${season} ${role}: primePack only for the winner`);
        }

        // Season commit: commit + both acknowledgements.
        let commit=await Commit.commitSeason({...a(offset+1000),seasonNumber:season,operationId:op("season_commit_op_",n+1),baseRevision:0});must(`S${season} commit`,commit);
        commit=await Commit.acknowledgeSeason({...b(offset+1100),seasonNumber:season,operationId:op("season_commit_op_",n+2),baseRevision:1});must(`S${season} Nik acknowledges`,commit);
        commit=await Commit.acknowledgeSeason({...a(offset+1200),seasonNumber:season,operationId:op("season_commit_op_",n+3),baseRevision:2});must(`S${season} Daniel acknowledges`,commit);
        assert.equal(commit.phase,"ACKNOWLEDGED");
        const committed=await readRaw(d=>doc(d,"rivalries",rid,"seasonCommits",`season_${season}`));
        assert.deepEqual(committed.results,{playerOne:want.playerOne.result,playerTwo:want.playerTwo.result},`${label} S${season}: the committed results carry the Prime Pack points`);

        // Scoring, History and Multi after the commit.
        const scoreA=await Scoring.read({...a(offset+1300),seasonNumber:season,teamCount:20});must(`S${season} scoring A`,scoreA);
        if(dual){const scoreB=await Scoring.read({...b(offset+1300),seasonNumber:season,teamCount:20});must(`S${season} scoring B`,scoreB);assert.deepEqual(scoreA.scoring,scoreB.scoring,`${label} S${season}: canonical scoring converges`);}
        for(const role of ["playerOne","playerTwo"]){
          const total=scoreA.scoring[role].total;
          assert.equal(total,want[role].total,`${label} S${season} ${role}: Scoring total (hand-checked table)`);
          assert.equal(total,score(want[role].result).total,`${label} S${season} ${role}: Scoring total equals the score() helper`);
          assert.ok(total>=0&&total<=15,`${label} S${season} ${role}: season total ${total} is outside 0..15`);
          assert.equal(scoreA.scoring[role].primePack,want[role].points||undefined,`${label} S${season} ${role}: primePack breakdown`);
        }
        const expectedWinner=want.playerOne.total>want.playerTwo.total?"playerOne":want.playerTwo.total>want.playerOne.total?"playerTwo":"draw";
        assert.equal(scoreA.winner,expectedWinner,`${label} S${season}: season winner`);
        cumulative.playerOne+=want.playerOne.total;cumulative.playerTwo+=want.playerTwo.total;
        const history=await History.read({...a(offset+1400),throughSeason:season});must(`S${season} history A`,history);
        if(dual){const historyB=await History.read({...b(offset+1400),throughSeason:season});must(`S${season} history B`,historyB);assert.deepEqual(history.projection,historyB.projection,`${label} S${season}: shared history converges`);}
        HistoryProtocol.verifyProjection(history.projection);
        assert.equal(history.projection.acceptedSeasons,season);assert.equal(history.projection.seasonHistory.length,season);
        for(let s=1;s<=season;s+=1){
          const row=history.projection.seasonHistory[s-1];
          for(const role of ["playerOne","playerTwo"])assert.equal(row[role].scoring.total,expected[s-1][role].total,`${label} after S${season}: history season ${s} ${role}`);
        }
        assert.equal(history.projection.managerRecords.playerOne.totalPoints,cumulative.playerOne,`${label} after S${season}: Daniel cumulative`);
        assert.equal(history.projection.managerRecords.playerTwo.totalPoints,cumulative.playerTwo,`${label} after S${season}: Nik cumulative`);
        assert.equal(cumulative.playerOne,expected.slice(0,season).reduce((sum,s)=>sum+score(s.playerOne.result).total,0),`${label} after S${season}: Daniel cumulative equals the score() helper`);
        assert.equal(cumulative.playerTwo,expected.slice(0,season).reduce((sum,s)=>sum+score(s.playerTwo.result).total,0),`${label} after S${season}: Nik cumulative equals the score() helper`);
        const multi=await Multi.read(a(offset+1500));must(`S${season} multi A`,multi);
        if(dual){const multiB=await Multi.read(b(offset+1500));must(`S${season} multi B`,multiB);assert.deepEqual(multi.state,multiB.state,`${label} S${season}: progression converges`);}
        assert.equal(multi.state.acceptedSeasons,season);assert.equal(multi.state.acceptedRevisionKey,history.projection.acceptedRevisionKey,`${label} S${season}: Multi and History accept the same season revisions`);
        if(season<TOTAL_SEASONS){assert.equal(multi.state.activeSeason,season+1);assert.equal(multi.state.terminal,false);}
        else{assert.equal(multi.state.activeSeason,null);assert.equal(multi.state.terminal,true);assert.equal(multi.state.phase,"SHOWDOWN_COMPLETE");}
        lastHistory=history;lastMulti=multi;
      }
      ok(`${tag}: every season's private results, commit (+2 acknowledgements), Scoring and History match the hand-checked table and the score() helper (all season totals 0..15; History cumulative totals checked after each of the 10 seasons)`);
      if(refusals)ok(`${tag}: ${refused} Prime Pack claims were refused by the Rules across the 10 seasons (the loser, a wrong value, a second scorer, a claim when nobody named the Icon)`);
      ok(`${tag}: Multi and History agree after every season (accepted seasons, revision key, terminal state at season 10)${dual?"; both managers' reads converge":""}`);

      const totals={playerOne:cumulative.playerOne,playerTwo:cumulative.playerTwo};
      assert.equal(lastHistory.projection.managerRecords.playerOne.totalPoints,totals.playerOne);

      // ---- Final reconciliation and the real Terminal Close. ----
      const finalA=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerOne")});
      const finalB=Final.reconcile({sharedActive:true,multiSeason:lastMulti,history:lastHistory,localReconciliation:localAuthority("playerTwo")});
      assert.deepEqual(finalA,finalB,"both managers derive the same final");
      assert.equal(finalA.phase,"FINAL_SEASON_RECONCILED");assert.deepEqual(finalA.managerTotals,totals);
      assert.equal(finalA.winner,totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw");
      // Terminal Close progress is written by the provider with Rules-checked cumulative totals: a forged total (one more or one
      // fewer than the committed seasons score) is refused, at the manager that scored a Prime Pack point and at the one that did not.
      const rivalryRef=doc(dbA,"rivalries",rid);
      const prior=(await getDoc(rivalryRef)).data(),first=expected[0];
      const progress=totalsNow=>envelope("rivalry",prior.objectId,prior.revision+1,{...prior.data,terminalProgress:{schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons:TOTAL_SEASONS,acceptedThroughSeason:1,managerTotals:totalsNow,closedSessionRevision:null}},{accountId:A,deviceId:DA,priorHash:prior.contentHash});
      const season1={playerOne:first.playerOne.total,playerTwo:first.playerTwo.total};
      let forged=0;
      for(const [role,delta] of [["playerOne",1],["playerTwo",1],["playerTwo",-1],["playerOne",-1]]){
        if(season1[role]+delta<0)continue;
        await assertPlainDenial(setDoc(rivalryRef,await progress({...season1,[role]:season1[role]+delta})),`${label} Terminal Close progress with ${role} ${delta>0?"+":""}${delta}`);forged+=1;
      }
      await setDoc(rivalryRef,await progress(season1));// the exact season 1 totals are accepted (progress is then finished by the provider)
      ok(`${tag}: Terminal Close progress with season 1 totals ${forged>2?"one too high or one too low":"forged"} for either manager is refused (${forged} forgeries); the exact totals are accepted`);
      const intent=Terminal.prepare(finalA,{sessionId:sid});
      const wrongIntent=JSON.parse(JSON.stringify(intent));wrongIntent.managerTotals={playerOne:totals.playerOne,playerTwo:totals.playerTwo+1};wrongIntent.winner=wrongIntent.managerTotals.playerOne>wrongIntent.managerTotals.playerTwo?"playerOne":wrongIntent.managerTotals.playerTwo>wrongIntent.managerTotals.playerOne?"playerTwo":"draw";
      const refusedClose=await TerminalProvider.close({...a(0),nowEpochMs:Date.now(),intent:wrongIntent});
      assert.equal(refusedClose.ok,false,`${label}: a Terminal Close intent with forged totals is refused`);
      const closed=await TerminalProvider.close({...a(0),nowEpochMs:Date.now(),intent});
      assert.equal(closed.ok,true,`${label} Terminal Close: ${JSON.stringify(closed)}`);assert.equal(closed.rivalryState,"closed");
      const closedDoc=(await getDoc(doc(dbB,"rivalries",rid))).data();
      assert.equal(closedDoc.data.connectionState,"closed");assert.deepEqual(closedDoc.data.terminalProgress.managerTotals,totals);assert.deepEqual(closedDoc.data.terminalClose.managerTotals,totals);
      ok(`${tag}: Final reconciliation (Daniel ${totals.playerOne}, Nik ${totals.playerTwo}) and the real Terminal Close agree: forged intent refused, the 10-season close is accepted and stores the same totals as History`);
      finals[spec.label]={totals,rid,confirmedAt,expected};
    }

    await playShowdown(SHOWDOWNS.A,{dual:true,refusals:true});
    await playShowdown(SHOWDOWNS.B,{dual:false,refusals:false});

    // ---- Career: session-free reader -> adapter -> analytics -> Golden Showdown in the seam. ----
    const readerSdk={doc,getDoc};
    const reads={};
    for(const spec of Object.values(SHOWDOWNS)){
      reads[spec.rid]=await Reader.readCompletedShowdown({firestore:dbA,firebaseSdk:readerSdk,user:{uid:A},rivalryId:spec.rid,cryptoImpl:crypto.webcrypto});
      assert.equal(reads[spec.rid].status,"completed",JSON.stringify(reads[spec.rid]));
      const nik=await Reader.readCompletedShowdown({firestore:dbB,firebaseSdk:readerSdk,user:{uid:B},rivalryId:spec.rid,cryptoImpl:crypto.webcrypto});
      assert.deepEqual(nik.projection,reads[spec.rid].projection);
      assert.deepEqual(reads[spec.rid].final.totals,finals[spec.label].totals);assert.equal(reads[spec.rid].final.seasonsPlayed,TOTAL_SEASONS);
    }
    ok("the session-free reader returns both finished Showdowns for each manager with the Terminal Close totals");
    const model=Analytics.buildCareerModel(Adapter.buildClosedCareerInput({index:{status:"ready",rivalryIds:[RID_A,RID_B]},reads,current:Active.careerInput({pair:{initialized:true,status:"unpaired"}})}));
    assert.equal(model.status,"ready");
    const rowOf=rid=>model.history.showdowns.find(row=>row.rivalryId===rid);
    const rowA=rowOf(RID_A),rowB=rowOf(RID_B);
    for(const [row,label] of [[rowA,"A"],[rowB,"B"]]){
      const f=finals[`Showdown ${label}`];
      assert.equal(row.status,"completed");assert.equal(row.totalSeasons,10);assert.equal(row.seasonsPlayed,10);
      assert.deepEqual(row.totals,{daniel:f.totals.playerOne,nik:f.totals.playerTwo},`Showdown ${label} career row totals equal the Terminal Close totals`);
      assert.equal(row.setupConfirmedAt,f.confirmedAt);
      const seasonScores=row.seasons.flatMap(s=>[s.score.daniel,s.score.nik]);
      assert.equal(seasonScores.length,20);assert.ok(seasonScores.every(v=>Number.isInteger(v)&&v>=0&&v<=15));
    }
    const careerSum=(label,role)=>finals[`Showdown ${label}`].totals[role];
    assert.equal(model.managers.daniel.careerPoints,careerSum("A","playerOne")+careerSum("B","playerOne"),"Daniel's career points are the sum of both Showdowns");
    assert.equal(model.managers.nik.careerPoints,careerSum("A","playerTwo")+careerSum("B","playerTwo"),"Nik's career points are the sum of both Showdowns");
    assert.equal(model.managers.nik.seasons,20);assert.equal(model.managers.daniel.seasons,20);
    assert.equal(model.managers.nik.bestSeasonScore,15);
    ok("career analytics: both rows' totals equal the Terminal Close totals, every season score is 0..15, career points and seasons add up across the two Showdowns, and Nik's best season is 15");

    // Showdown A: threshold 150, nobody Golden.
    assert.equal(Seam.seasonMaxFor(rowA),15);assert.equal(Seam.goldenShowdownPoints(rowA),150);
    assert.deepEqual(Seam.goldenShowdownManagers(rowA),[]);
    assert.ok(finals["Showdown A"].totals.playerOne<150&&finals["Showdown A"].totals.playerTwo<150);
    assert.equal(Seam.goldenShowdownPoints({...rowA,setupConfirmedAt:Date.parse("2026-10-01T00:00:00Z")}),110,"a Showdown confirmed before Prime Pack keeps 110");
    ok(`Showdown A (Daniel ${finals["Showdown A"].totals.playerOne}, Nik ${finals["Showdown A"].totals.playerTwo}): goldenShowdownPoints is 150 (110 only for a Showdown confirmed before Prime Pack) and nobody is Golden`);
    // Showdown B: Nik at 150.
    assert.equal(finals["Showdown B"].totals.playerTwo,150);
    assert.equal(Seam.goldenShowdownPoints(rowB),150);assert.deepEqual(Seam.goldenShowdownManagers(rowB),["nik"]);
    assert.deepEqual(Seam.goldenShowdownCounts(model.history.showdowns),{daniel:0,nik:1});
    assert.deepEqual(Seam.goldenShowdownManagers({...rowB,totals:{...rowB.totals,nik:149}}),[],"149 is not Golden");
    ok("Showdown B: Nik totals 150 (15 x 10) and is Golden Showdown at 150; one point less is not Golden; Daniel is not Golden; the career counts are Daniel 0, Nik 1");
  }finally{await env.cleanup();}
  for(const check of checks)process.stdout.write(`ok ${check}\n`);
  process.stdout.write(`run time ${Math.round((Date.now()-startedAt)/1000)} s\n`);
  process.stdout.write(`PASS r87 Prime Pack ten-season emulator: ${checks.length} checks.\n`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});

```


## FILE: data/icons.js (EXCERPT: first 9000 bytes; the rest has the same row shape)
```text
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeIcons=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // R88 Prime Pack (Nik 2026-10-31/11-01): male outfield Legends, Icons, FUT Heroes and Hall of FUT players, one card each
  // (the Icon card always wins: the highest Legend or Icon card; a Hero or Hall of FUT card only for a player with none; the
  // newer game wins a tie). Written by scripts/r88-icons-from-csv.mjs on 2026-11-01 from the checked CSVs:
  // 232 players (17 Legend, 103 Icon Prime, 26 Icon Base, 68 Hero, 18 Hall of FUT),
  // Prime cards up to FIFA 23. Do not edit by hand: fix the CSVs and run the script again.
  // The order is part of the draw: never reorder rows or change who is in them once released; a new list is a new LIST_VERSION.
  const LIST_VERSION=1;
  const PLAYERS=Object.freeze([
    {"id":"abedi-pele","name":"Abedi Pelé","fullName":"Abedi Ayew","acceptedNames":["Abedi Pelé","Abedi Ayew"],"nation":"Ghana","nationCode":"GH","position":"CAM","game":"FC 27","cardVersion":"Hero","overall":89,"stats":{"PAC":91,"SHO":83,"PAS":87,"DRI":91,"DEF":48,"PHY":66}},
    {"id":"adebayo-akinfenwa","name":"Akinfenwa","fullName":"Adebayo Akinfenwa","acceptedNames":["Akinfenwa","Adebayo Akinfenwa"],"nation":"England","nationCode":"GB-ENG","position":"ST","game":"FC 27","cardVersion":"Hall of FUT","overall":84,"stats":{"PAC":72,"SHO":80,"PAS":61,"DRI":74,"DEF":36,"PHY":88}},
    {"id":"aiden-mcgeady","name":"McGeady","fullName":"Aiden McGeady","acceptedNames":["McGeady","Aiden McGeady"],"nation":"Ireland","nationCode":"IE","position":"RM","game":"FC 27","cardVersion":"Hall of FUT","overall":84,"stats":{"PAC":89,"SHO":75,"PAS":82,"DRI":86,"DEF":42,"PHY":65}},
    {"id":"alan-shearer","name":"Shearer","fullName":"Alan Shearer","acceptedNames":["Shearer","Alan Shearer"],"nation":"England","nationCode":"GB-ENG","position":"ST","game":"FIFA 23","cardVersion":"Icon Prime","overall":91,"stats":{"PAC":81,"SHO":93,"PAS":77,"DRI":78,"DEF":52,"PHY":85}},
    {"id":"aleksandr-mostovoi","name":"Mostovoi","fullName":"Aleksandr Mostovoi","acceptedNames":["Mostovoi","Aleksandr Mostovoi"],"nation":"Russia","nationCode":"RU","position":"CAM","game":"FC 25","cardVersion":"Hero","overall":86,"stats":{"PAC":78,"SHO":83,"PAS":86,"DRI":88,"DEF":62,"PHY":77}},
    {"id":"alessandro-del-piero","name":"Del Piero","fullName":"Alessandro Del Piero","acceptedNames":["Del Piero","Alessandro Del Piero","Piero"],"nation":"Italy","nationCode":"IT","position":"CF","game":"FIFA 23","cardVersion":"Icon Prime","overall":92,"stats":{"PAC":83,"SHO":92,"PAS":89,"DRI":92,"DEF":43,"PHY":67}},
    {"id":"alessandro-florenzi","name":"Florenzi","fullName":"Alessandro Florenzi","acceptedNames":["Florenzi","Alessandro Florenzi"],"nation":"Italy","nationCode":"IT","position":"RB","game":"FC 27","cardVersion":"Hall of FUT","overall":84,"stats":{"PAC":86,"SHO":80,"PAS":80,"DRI":82,"DEF":78,"PHY":77}},
    {"id":"alessandro-nesta","name":"Nesta","fullName":"Alessandro Nesta","acceptedNames":["Nesta","Alessandro Nesta"],"nation":"Italy","nationCode":"IT","position":"CB","game":"FIFA 23","cardVersion":"Icon Prime","overall":92,"stats":{"PAC":72,"SHO":42,"PAS":65,"DRI":67,"DEF":94,"PHY":86}},
    {"id":"alexandre-pato","name":"Alexandre Pato","fullName":"Alexandre Rodrigues da Silva","acceptedNames":["Alexandre Pato","Alexandre Rodrigues da Silva","Pato"],"nation":"Brazil","nationCode":"BR","position":"ST","game":"FC 27","cardVersion":"Hall of FUT","overall":85,"stats":{"PAC":90,"SHO":85,"PAS":71,"DRI":86,"DEF":33,"PHY":73}},
    {"id":"alexi-lalas","name":"Lalas","fullName":"Panayotis Alexander Lalas","acceptedNames":["Lalas","Panayotis Alexander Lalas","Alexi Lalas"],"nation":"United States","nationCode":"US","position":"CB","game":"FIFA 17","cardVersion":"Legend","overall":86,"stats":{"PAC":78,"SHO":55,"PAS":72,"DRI":62,"DEF":84,"PHY":86}},
    {"id":"andrea-barzagli","name":"Andrea Barzagli","fullName":"Andrea Barzagli","acceptedNames":["Andrea Barzagli","Barzagli"],"nation":"Italy","nationCode":"IT","position":"CB","game":"FC 27","cardVersion":"Hero","overall":87,"stats":{"PAC":78,"SHO":48,"PAS":64,"DRI":68,"DEF":91,"PHY":85}},
    {"id":"andrea-pirlo","name":"Pirlo","fullName":"Andrea Pirlo","acceptedNames":["Pirlo","Andrea Pirlo"],"nation":"Italy","nationCode":"IT","position":"CM","game":"FIFA 23","cardVersion":"Icon Prime","overall":92,"stats":{"PAC":73,"SHO":80,"PAS":95,"DRI":91,"DEF":71,"PHY":67}},
    {"id":"andreas-brehme","name":"Brehme","fullName":"Andreas Brehme","acceptedNames":["Brehme","Andreas Brehme"],"nation":"Germany","nationCode":"DE","position":"LWB","game":"FIFA 17","cardVersion":"Legend","overall":87,"stats":{"PAC":89,"SHO":66,"PAS":82,"DRI":75,"DEF":86,"PHY":86}},
    {"id":"andres-iniesta","name":"Iniesta","fullName":"Andrés Iniesta Luján","acceptedNames":["Iniesta","Andrés Iniesta Luján","Luján","Andrés Iniesta"],"nation":"Spain","nationCode":"ES","position":"CM","game":"FC 27","cardVersion":"Icon Base","overall":92,"stats":{"PAC":83,"SHO":80,"PAS":91,"DRI":92,"DEF":62,"PHY":68}},
    {"id":"andriy-shevchenko","name":"Shevchenko","fullName":"Andriy Shevchenko","acceptedNames":["Shevchenko","Andriy Shevchenko"],"nation":"Ukraine","nationCode":"UA","position":"ST","game":"FIFA 23","cardVersion":"Icon Prime","overall":91,"stats":{"PAC":88,"SHO":92,"PAS":72,"DRI":87,"DEF":34,"PHY":75}},
    {"id":"antonio-di-natale","name":"Antonio Di Natale","fullName":"Antonio Di Natale","acceptedNames":["Antonio Di Natale","Di Natale"],"nation":"Italy","nationCode":"IT","position":"ST","game":"FC 27","cardVersion":"Hero","overall":88,"stats":{"PAC":90,"SHO":91,"PAS":85,"DRI":90,"DEF":46,"PHY":70}},
    {"id":"antonio-valencia","name":"Valencia","fullName":"Luis Antonio Valencia Mosquera","acceptedNames":["Valencia","Luis Antonio Valencia Mosquera","Antonio Valencia"],"nation":"Ecuador","nationCode":"EC","position":"RM","game":"FC 27","cardVersion":"Hall of FUT","overall":85,"stats":{"PAC":90,"SHO":75,"PAS":81,"DRI":83,"DEF":79,"PHY":87}},
    {"id":"ashley-cole","name":"Cole","fullName":"Ashley Cole","acceptedNames":["Cole","Ashley Cole"],"nation":"England","nationCode":"GB-ENG","position":"LB","game":"FIFA 23","cardVersion":"Icon Prime","overall":89,"stats":{"PAC":89,"SHO":67,"PAS":83,"DRI":83,"DEF":88,"PHY":80}},
    {"id":"bastian-schweinsteiger","name":"Schweinsteiger","fullName":"Bastian Schweinsteiger","acceptedNames":["Schweinsteiger","Bastian Schweinsteiger"],"nation":"Germany","nationCode":"DE","position":"CM","game":"FIFA 23","cardVersion":"Icon Prime","overall":91,"stats":{"PAC":76,"SHO":86,"PAS":89,"DRI":86,"DEF":86,"PHY":86}},
    {"id":"bixente-lizarazu","name":"Bixente Lizarazu","fullName":"Bixente Lizarazu","acceptedNames":["Bixente Lizarazu","Lizarazu"],"nation":"France","nationCode":"FR","position":"LB","game":"FC 27","cardVersion":"Hero","overall":88,"stats":{"PAC":87,"SHO":59,"PAS":80,"DRI":82,"DEF":83,"PHY":82}},
    {"id":"blaise-matuidi","name":"Blaise Matuidi","fullName":"Blaise Matuidi","acceptedNames":["Blaise Matuidi","Matuidi"],"nation":"France","nationCode":"FR","position":"CDM","game":"FC 27","cardVersion":"Hero","overall":86,"stats":{"PAC":83,"SHO":72,"PAS":79,"DRI":78,"DEF":84,"PHY":85}},
    {"id":"bobby-charlton","name":"Charlton","fullName":"Robert Charlton","acceptedNames":["Charlton","Robert Charlton","Bobby Charlton"],"nation":"England","nationCode":"GB-ENG","position":"CAM","game":"FC 27","cardVersion":"Icon Base","overall":92,"stats":{"PAC":90,"SHO":91,"PAS":87,"DRI":91,"DEF":50,"PHY":74}},
    {"id":"bobby-moore","name":"Moore","fullName":"Robert Frederick Chelsea Moore","acceptedNames":["Moore","Robert Frederick Chelsea Moore","Bobby Moore"],"nation":"England","nationCode":"GB-ENG","position":"CB","game":"FIFA 23","cardVersion":"Icon Prime","overall":92,"stats":{"PAC":68,"SHO":64,"PAS":83,"DRI":78,"DEF":93,"PHY":85}},
    {"id":"brian-laudrup","name":"Laudrup","fullName":"Brian Laudrup","acceptedNames":["Laudrup","Brian Laudrup"],"nation":"Denmark","nationCode":"DK","position":"CF","game":"FIFA 17","cardVersion":"Legend","overall":88,"stats":{"PAC":87,"SHO":83,"PAS":80,"DRI":88,"DEF":27,"PHY":65}},
    {"id":"cafu","name":"Cafú","fullName":"Marcos Evangelista de Moraes","acceptedNames":["Cafú","Marcos Evangelista de Moraes","Marcos Evangelista de Morais"],"nation":"Brazil","nationCode":"BR","position":"RWB","game":"FIFA 23","cardVersion":"Icon Prime","overall":93,"stats":{"PAC":92,"SHO":58,"PAS":85,"DRI":88,"DEF":91,"PHY":86}},
    {"id":"capdevila","name":"Capdevila","fullName":"Joan Capdevila Méndez","acceptedNames":["Capdevila","Joan Capdevila Méndez","Joan Capdevila"],"nation":"Spain","nationCode":"ES","position":"LB","game":"FC 27","cardVersion":"Hero","overall":86,"stats":{"PAC":84,"SHO":76,"PAS":81,"DRI":79,"DEF":85,"PHY":80}},
    {"id":"carles-puyol","name":"Puyol","fullNa
```


## FILE: js/ruleBook.js Prime Pack lines (grep excerpt)
```text
143-        ["100 league points or 100 league goals", "+1 MAX"],
144-        ["League top scorer or top assist", "+1 MAX"],
145:        // Prime Pack (Nik 2026-11-01): once a season, before the transfer window, in Showdowns that play it. The first right
146-        // name scores 4 with one stat showing, 3 with two, 2 with three, 1 with four.
147:        ["Prime Pack: first to name the masked Icon (4, 3, 2 or 1 by stage)", "+4 MAX"]
148-    ].forEach(([label, value]) => {
149-        const row = document.createElement("div");
150-        const labelElement = document.createElement("span");
151-        const valueElement = document.createElement("strong");
152-        labelElement.textContent = label;
153-        valueElement.textContent = value;
154-        row.append(labelElement, valueElement);
155-        fragment.appendChild(row);
156-    });
157-    scoring.appendChild(fragment);
158-
159-    const maximum = document.createElement("div");
--
180-    goldenLabel.textContent = "GOLDEN SHOWDOWN";
181-    const goldenText = document.createElement("span");
182:    // r87 Prime Pack (G Lead and Nik 2026-11-01): 15 a season with Prime Pack, so 150; older Showdowns keep 110.
183:    goldenText.textContent = "Score 150 points in a 10-season Showdown (15 in every season) to win the gold trophy. A Showdown started before Prime Pack needs 110.";
184-    golden.append(goldenLabel, goldenText);
185-
186-    // r86 Special Player (Nik 2026-10-29): the SP chip's own rule line, in the Golden Showdown's style. The live Showdown's
187-    // two chips are filled in when the Rule Book opens (renderRuleBookSpecialPlayers); none before r86.
188-    const special = document.createElement("p");
189-    special.className = "ruleGoldenShowdown ruleSpecialPlayer";
190-    const specialLabel = document.createElement("strong");
191-    const specialTag = document.createElement("span");
192-    specialTag.className = "ruleSpecialPlayerTag";
193-    specialTag.textContent = "SP";
194-    const specialName = document.createElement("span");
195-    specialName.textContent = " SPECIAL PLAYER";
--
202-    special.append(specialLabel, specialText, specialLive);
203-
204:    // r87 Prime Pack (Nik 2026-11-01): its own line in the same style. The values shown are the Icon's real card stats from the
205-    // list; only which of the six shows at each stage is random (each once). The flag comes only with the full reveal.
206-    const primePack = document.createElement("p");
207-    primePack.className = "ruleGoldenShowdown rulePrimePack";
208-    const primePackLabel = document.createElement("strong");
209:    primePackLabel.textContent = "PRIME PACK";
210-    const primePackText = document.createElement("span");
211-    primePackText.textContent = "A masked Icon shows his position and one real card stat, then one more real stat each stage, up to four. Which stats show is random; the values never are. Each manager has two guesses. Name him first for 4, 3, 2 or 1 points. Nobody right after stage 4 scores 0. Then the whole card is revealed: the last two stats, his name, flag and overall.";
212-    primePack.append(primePackLabel, primePackText);
213-
214-    article.append(header, scoring, maximum, golden, special, primePack, notes);
215-    return article;
216-}
217-
218-// r86 Special Player rules (Nik 2026-10-29 15:24 UTC): the full card, last, with the training rule by length.
219-// The draws card is gone (Nik 2026-10-29 21:10 UTC): the no-tiebreak rules stay in scoring.js, not on the page.
220-function createSpecialPlayerRuleSection(){
221-    const article = createRuleSection("06", "SPECIAL PLAYER", [

```


## FILE: every other Prime Pack touchpoint in js/ and visual-assets/ (grep -B6 -A6, lines cut at 400 chars)
```text
js/productionSharedCareerStart.js-138-      if(!transfer||typeof transfer.install!=="function"||typeof transfer.open!=="function")throw new Error("Shared Transfer Challenge is unavailable.");
js/productionSharedCareerStart.js-139-      transfer.install();
js/productionSharedCareerStart.js-140-      transferOpening=true;
js/productionSharedCareerStart.js-141-      const opened=await transfer.open();
js/productionSharedCareerStart.js-142-      transferOpening=false;
js/productionSharedCareerStart.js-143-      // r87: the manager left the Russian Roster Roulette or the Prime Pack for Showdown Home; it opens again from there. Not a failure.
js/productionSharedCareerStart.js:144:      if(opened!==true&&(root.CareerModeRosterRouletteStep?.wentHome?.()||root.CareerModeIconGuessStep?.wentHome?.())){pcstClosePanel();return false;}
js/productionSharedCareerStart.js-145-      // The roulette or the Prime Pack could not start (Setup not read, its files not loaded): its own reason, not a generic one (Fable F2-05).
js/productionSharedCareerStart.js-146-      const reason=opened!==true&&typeof transfer.rouletteError==="function"?transfer.rouletteError():"";
js/productionSharedCareerStart.js-147-      if(reason){lastError=reason;return false;}
js/productionSharedCareerStart.js-148-      if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
js/productionSharedCareerStart.js-149-      pcstClosePanel();
js/productionSharedCareerStart.js-150-      return true;
--
js/productionSharedCareerStart.js-498-  function pcstReadyHere(){return Boolean(pcstReady()&&readyKey&&pcstConfirmed()&&readyKey===pcstSetupKey(pcstSetupState()));}
js/productionSharedCareerStart.js-499-  async function pcstOpenPanelNow(request){
js/productionSharedCareerStart.js-500-    pcstDeactivateSetupPresentation();await request.wait(pcstEnsureDependencies());
js/productionSharedCareerStart.js-501-    // Fable F6-01: a BACK TO SHOWDOWN HOME from the roulette opened here (CONTINUE CAREER from Home) stays on Home, as it does
js/productionSharedCareerStart.js-502-    // from the panel; only a roulette that could not start (its own reason) or a failed open shows Career Start below.
js/productionSharedCareerStart.js-503-    if(!pcstPanelOpen()&&pcstReadyHere()&&await request.wait(pcstOpenTransferChallenge()))return pcstCloseReveal();
js/productionSharedCareerStart.js:504:    if(!pcstPanelOpen()&&pcstReadyHere()&&(root.CareerModeRosterRouletteStep?.wentHome?.()||root.CareerModeIconGuessStep?.wentHome?.()))return pcstCloseReveal();
js/productionSharedCareerStart.js-505-    const overlay=pcstEnsurePanel();stageRetries=0;stageFailed=false;retryFailed=false;stageFailed=!(await request.wait(pcstClubBackdrop()));overlay.classList.remove("hidden");pcstRender();pcstCloseReveal();await request.wait(pcstRefresh(false,request));return true;
js/productionSharedCareerStart.js-506-  }
js/productionSharedCareerStart.js-507-  function pcstClosePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay){overlay.classList.add("hidden");pcstStageOff(overlay);}return true;}
js/productionSharedCareerStart.js-508-  function pcstPresentationOwnsControl(){const presentation=root.CareerModeProductionSharedShowdownPresentation;return Boolean(presentation&&typeof presentation.isPresentationActive==="function"&&presentation.isPresentationActive());}
js/productionSharedCareerStart.js-509-  function pcstClearControlOwnership(button){if(button&&button.dataset.sharedCareerStart==="true")delete button.dataset.sharedCareerStart;return false;}
js/productionSharedCareerStart.js-510-  function pcstDecorateControl(){
--
js/productionSharedTransferChallenge.js-19-  let installed=false,busy=false,provider=null,setupApi=null,careerApi=null,view=null,pollTimer=null,timerLoop=null,openedKey="",expiryAttemptRevision=-1,expiryAttemptAt=0,providerChain=Promise.resolve(),refreshPromise=null,refreshContextKey="",viewContextKey="",replayContextKey="",replayQueue=[],openPromise=null;
js/productionSharedTransferChallenge.js-20-  let expiryAttemptContextKey="",expiryAttemptCount=0,expiryPermissionDenied=false,expiryNeedsAuthority=false,refreshExpiryRequest=null;
js/productionSharedTransferChallenge.js-21-  let clockContextKey="",clockServerEpochMs=0,clockPerformanceMs=0,clockRefreshPerformanceMs=0;
js/productionSharedTransferChallenge.js-22-  const witnessedByContext=new Map();
js/productionSharedTransferChallenge.js-23-  let fastWaitKey="",fastWaitSince=0;
js/productionSharedTransferChallenge.js-24-  // The reason the roulette could not start on this phone (shown on the dashboard and on Career Start), or "" (Fable F2-05).
js/productionSharedTransferChallenge.js:25:  let rouletteError="",primePackLoadError=false;
js/productionSharedTransferChallenge.js-26-  const PSTC_PRIME_PACK_TEXT="Prime Pack could not load. Check the connection and tap again.";
js/productionSharedTransferChallenge.js-27-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/productionSharedTransferChallenge.js-28-  const PSTC_ROULETTE_TEXT=Object.freeze({
js/productionSharedTransferChallenge.js-29-    load:"The roulette could not load. Check the connection and tap again.",
js/productionSharedTransferChallenge.js-30-    setup:"This season's roulette needs the Showdown's confirmed Setup, and it could not be read just now. Tap again to retry.",
js/productionSharedTransferChallenge.js-31-    draw:"The Special Player list could not load, so the transfer window stays shut. Tap again to retry.",
--
js/productionSharedTransferChallenge.js-470-    }
js/productionSharedTransferChallenge.js-471-    if(isReplay&&continueButton){continueButton.textContent=`CONTINUE REPLAY · ${phase.replaceAll("_"," ")}`;pstcHidden(actionBar,false);pstcHidden(continueButton,false);pstcDisable(continueButton,false);}
js/productionSharedTransferChallenge.js-472-    pstcMarkWitness(key,phase);
js/productionSharedTransferChallenge.js-473-    const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
js/productionSharedTransferChallenge.js-474-  }
js/productionSharedTransferChallenge.js-475-  function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButto
js/productionSharedTransferChallenge.js:476:  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.da
js/productionSharedTransferChallenge.js-477-  // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
js/productionSharedTransferChallenge.js-478-  // r87 Russian Roster Roulette (js/rosterRouletteStep.js): before this season's Transfer Challenge opens, this manager does
js/productionSharedTransferChallenge.js-479-  // the season's roulette once (board from season 2, both spins, the release). It decides for itself whether it applies (a
js/productionSharedTransferChallenge.js-480-  // Showdown confirmed on r87 or later, not done yet on this browser) and never rejects. false = he went back to Home, or the
js/productionSharedTransferChallenge.js-481-  // step itself could not load: the window then stays shut with a TRY AGAIN line on the dashboard (red team R87-B-02).
js/productionSharedTransferChallenge.js-482-  // The confirm time comes with the Setup read; only a manager whose Setup state came from his own confirm tap reads it once.
--
js/productionSharedTransferChallenge.js-506-      const go=await step.runBeforeTransfers(ctx);
js/productionSharedTransferChallenge.js-507-      if(go){rouletteClearedKey=request.key;await pstcAfterSpin(request);}
js/productionSharedTransferChallenge.js-508-      return go;
js/productionSharedTransferChallenge.js-509-    }catch(_error){rouletteError=PSTC_ROULETTE_TEXT.error;return false;}
js/productionSharedTransferChallenge.js-510-  }
js/productionSharedTransferChallenge.js-511-  // r87 Prime Pack (Nik 2026-10-31/11-01): after the roulette and before the window, both managers name one masked Icon
js/productionSharedTransferChallenge.js:512:  // (js/iconGuessStep.js). Only Showdowns confirmed on r87 or later play it (the same boundary as the roulette); for the
js/productionSharedTransferChallenge.js-513-  // rest nothing is loaded. false keeps the window shut: he went back to Showdown Home, or the step could not load (the
js/productionSharedTransferChallenge.js-514-  // dashboard then says so and tapping again retries). The round runs on the Transfer Challenge's server clock.
js/productionSharedTransferChallenge.js:515:  async function pstcPrimePackFirst(request){
js/productionSharedTransferChallenge.js:516:    primePackLoadError=false;
js/productionSharedTransferChallenge.js-517-    try{
js/productionSharedTransferChallenge.js-518-      if(!view||!view.managerRole||!request)return true;
js/productionSharedTransferChallenge.js-519-      const confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
js/productionSharedTransferChallenge.js:520:      // Old Showdowns never load the Prime Pack step (the boundary is js/iconGuess.js fromMs).
js/productionSharedTransferChallenge.js-521-      if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off")return true;
js/productionSharedTransferChallenge.js:522:      let timer;const step=await Promise.race([pstcLoadScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
js/productionSharedTransferChallenge.js:523:      if(!step){primePackLoadError=true;return false;}
js/productionSharedTransferChallenge.js:524:      // applies() needs the round engine (js/iconGuess.js): load it first, or an r87 Showdown would skip the Prime Pack.
js/productionSharedTransferChallenge.js:525:      if(!await step.ensure()){primePackLoadError=true;return false;}
js/productionSharedTransferChallenge.js-526-      const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,confirmedAtMs};
js/productionSharedTransferChallenge.js-527-      if(!step.applies(ctx))return true;
js/productionSharedTransferChallenge.js-528-      const provided=await pstcProviderOptions(request,true);
js/productionSharedTransferChallenge.js:529:      if(!provided){primePackLoadError=true;return false;}
js/productionSharedTransferChallenge.js-530-      if(!pstcRequestMatches(request))return false;
js/productionSharedTransferChallenge.js-531-      const options=provided.options;
js/productionSharedTransferChallenge.js-532-      const go=await step.run(ctx,{firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,now:()=>pstcAuthoritativeNow(request)});
js/productionSharedTransferChallenge.js-533-      // false without the manager choosing Showdown Home is a fault: the caller says so instead of a generic error.
js/productionSharedTransferChallenge.js:534:      if(go!==true&&!step.wentHome?.())primePackLoadError=true;
js/productionSharedTransferChallenge.js-535-      return go===true;
js/productionSharedTransferChallenge.js:536:    }catch(_error){primePackLoadError=true;return false;}
js/productionSharedTransferChallenge.js-537-  }
js/productionSharedTransferChallenge.js-538-  // r87 roulette boards: each finished season's verdicts (both managers' signings, overall and release) are kept on this
js/productionSharedTransferChallenge.js-539-  // phone when the Transfer Challenge shows them, so the next spins build their boards with no read. A season not kept
js/productionSharedTransferChallenge.js-540-  // here (another phone, cleared storage) costs one Transfer Challenge read, once.
js/productionSharedTransferChallenge.js-541-  const PSTC_ROULETTE_VERDICTS_KEY="careerModeShowdown.rouletteVerdicts.v1",PSTC_ROULETTE_VERDICTS_MAX=40;
js/productionSharedTransferChallenge.js-542-  function pstcVerdictRows(rows){return Array.isArray(rows)?rows.map(row=>({slot:row.slot,name:row.name,overall:Number.isInteger(row.overall)?row.overall:null,position:SIGNING_POSITIONS.includes(row.position)?row.position:null,release:row.release===true})):null;}
--
js/productionSharedTransferChallenge.js-638-      }
js/productionSharedTransferChallenge.js-639-      if(/permission/i.test(String(result?.code||""))&&view&&!view.state){spinPendingKey="";spinRefusedKey=request.key;pstcRender();}
js/productionSharedTransferChallenge.js-640-      return false;
js/productionSharedTransferChallenge.js-641-    })().catch(()=>false).finally(()=>{if(spinWriting===run)spinWriting=null;});
js/productionSharedTransferChallenge.js-642-    spinWriting=run;return run;
js/productionSharedTransferChallenge.js-643-  }
js/productionSharedTransferChallenge.js:644:  function pstcCloseRoulette(){try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}try{root.CareerModeIconGuessStep?.close?.();}catch(_error){}}
js/productionSharedTransferChallenge.js-645-  function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
js/productionSharedTransferChallenge.js-646-  // Fable F2-11: an earlier BACK from the roulette is forgotten first. Fable F2-14: the replay of phases this phone did not see
js/productionSharedTransferChallenge.js-647-  // is set before the screen shows, so it never mounts the live phase first. Fable F2-01: the roulette's card and stage come
js/productionSharedTransferChallenge.js-648-  // down on every way out, a navigation that fails included.
js/productionSharedTransferChallenge.js:649:  async function pstcOpenNow(){if(!pstcSharedMarker())return false;try{root.CareerModeRosterRouletteStep?.forgetHome?.();}catch(_error){}await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="fun
js/productionSharedTransferChallenge.js-650-  async function pstcHandleAction(id){
js/productionSharedTransferChallenge.js-651-    if(id==="seasonPrimaryAction")return pstcOpen();
js/productionSharedTransferChallenge.js-652-    if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
js/productionSharedTransferChallenge.js-653-    if(pstcReplayPhase())return false;
js/productionSharedTransferChallenge.js-654-    if(id==="startTransferTimer"){if(pstcSpinsMissing().length)return false;return pstcMutate("startWindow");}
js/productionSharedTransferChallenge.js-655-    if(id==="endTransferTimer")return pstcMutate("requestEndWindow");
--
js/productionSharedTransferChallenge.js-738-    if(view?.state?.phase!=="WINDOW_OPEN"||pstcReplayPhase()){expiryNeedsAuthority=false;void pstcTick();return;}
js/productionSharedTransferChallenge.js-739-    // Keep the shared deadline; refresh its clock and authority before expiry may act again.
js/productionSharedTransferChallenge.js-740-    pstcClearClock();expiryNeedsAuthority=true;pstcScreenFresh();void pstcRefresh().catch(()=>{});
js/productionSharedTransferChallenge.js-741-  }
js/productionSharedTransferChallenge.js-742-  function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("input",pstcSigningDraftChange);root.document.addEventListener("change",pstcSigningDraftChange);if(typeof root.addEvent
js/productionSharedTransferChallenge.js-743-
js/productionSharedTransferChallenge.js:744:  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",guessedBefore:pstcGuessedBefore,productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequire
js/productionSharedTransferChallenge.js-745-});
--
js/sharedSeasonCommit.js-15-  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old hashes never change.
js/sharedSeasonCommit.js-16-  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","resultsRevision","resultsContentHash","results","acknowledgedRoles","receipts","contentHash"]);
js/sharedSeasonCommit.js-17-
js/sharedSeasonCommit.js-18-  function sscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
js/sharedSeasonCommit.js-19-  function sscPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
js/sharedSeasonCommit.js-20-  function sscExact(value,keys,code="SEASON_COMMIT_VALUE_INVALID"){if(!sscPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))sscFail(code);return value;}
js/sharedSeasonCommit.js:21:  function sscEuropaLeague(value,code){if(!sscPlain(value))sscFail(code);const won=Object.hasOwn(value,"europaLeague");sscExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))sscFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isIn
js/sharedSeasonCommit.js-22-  function sscClone(value){return JSON.parse(JSON.stringify(value));}
js/sharedSeasonCommit.js-23-  function sscFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sscFreeze);Object.freeze(value);}return value;}
js/sharedSeasonCommit.js-24-  function sscCanonical(value){if(Array.isArray(value))return `[${value.map(sscCanonical).join(",")}]`;if(sscPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${sscCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
js/sharedSeasonCommit.js-25-  async function sscHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")sscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(sscCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
js/sharedSeasonCommit.js-26-  function sscRole(value){if(!ROLES.includes(value))sscFail("SEASON_COMMIT_ROLE_INVALID");return value;}
js/sharedSeasonCommit.js-27-  function sscTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)sscFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return value;}
js/sharedSeasonCommit.js-28-  function sscSetup(value){if(!sscPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))sscFail("SEA
js/sharedSeasonCommit.js:29:  function sscResult(value,teamCount){const europaLeague=sscEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Nu
js/sharedSeasonCommit.js-30-  function sscReceipt(value){sscExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_COMMIT_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||!["commit-season","acknowledge-season"].includes(value.type)||!HASH.test(value.commandHash))sscFail
js/sharedSeasonCommit.js-31-  function sscCommand(value){if(!sscPlain(value))sscFail("SEASON_COMMIT_COMMAND_INVALID");sscExact(value,["type","operationId","baseRevision"],"SEASON_COMMIT_COMMAND_INVALID");if(!["commit-season","acknowledge-season"].includes(value.type)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||value.baseRevision>3)s
js/sharedSeasonCommit.js-32-
js/sharedSeasonCommit.js-33-  async function sscCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonResultsModule=(typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults)}={}){
js/sharedSeasonCommit.js-34-    const teams=sscTeamCount(teamCount);
js/sharedSeasonCommit.js-35-    if(!seasonResultsModule||typeof seasonResultsModule.createProtocol!=="function")sscFail("SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE");
--
js/seasonEngine.js-392-    // r80: the Europa League line shows only for a season that won it (+3), so every other season reads as before.
js/seasonEngine.js-393-    // r87 polish: the review passes europaRow when either manager won it, so both cards list the same rows (+0 for the
js/seasonEngine.js-394-    // other) and their SEASON SCORE plaques line up.
js/seasonEngine.js-395-    return [
js/seasonEngine.js-396-        ["Champions League", scoring.championsLeague || 0],
js/seasonEngine.js-397-        ...(scoring.europaLeague > 0 || options.europaRow === true ? [["Europa League", scoring.europaLeague || 0]] : []),
js/seasonEngine.js:398:        ...(scoring.primePack > 0 ? [["Prime Pack", scoring.primePack]] : []),
js/seasonEngine.js-399-        ["League Title", scoring.leagueTitle || 0],
js/seasonEngine.js-400-        ["Domestic Cup", scoring.domesticCup || 0],
js/seasonEngine.js-401-        [buildPerformanceBonusLabel(scoring), scoring.performanceBonus || 0],
js/seasonEngine.js-402-        [buildAwardsBonusLabel(scoring), scoring.individualAwardsBonus || scoring.awardsBonus || 0]
js/seasonEngine.js-403-    ];
js/seasonEngine.js-404-}
--
js/sparkPrivatePairing.js-714-      ["rivalries/*/sharedSetup/leagueProjection",1,1,["accounts/{@self}","rivalries/{rivalryId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
js/sparkPrivatePairing.js-715-      ["rivalries/*/careerStart/authoritative",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
js/sparkPrivatePairing.js-716-      ["rivalries/*/transferChallenges/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/careerStart/authoritative","rivalries/{rivalryId}/seasonCommits/{'season_'+stringafter.seasonNumber-1}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authorit
js/sparkPrivatePairing.js-717-      ["rivalries/*/transferChallenges/*/roulette/*",1,1,["rivalries/{rivalryId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
js/sparkPrivatePairing.js-718-      ["rivalries/*/transferChallenges/*/roles/*",2,3,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
js/sparkPrivatePairing.js-719-      ["rivalries/*/seasonResults/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{role}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/leagueProjection"]],
js/sparkPrivatePairing.js:720:      ["rivalries/*/seasonResults/*/roles/*",2,3,["rivalries/{rivalryId}","rivalries/{rivalryId}/primePackRounds/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}"]],
js/sparkPrivatePairing.js:721:      ["rivalries/*/primePackRounds/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}"]],
js/sparkPrivatePairing.js-722-      ["rivalries/*/seasonCommits/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerOne'}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerTwo'}","rivalries/{rivalryId}/sessions/{after.active
js/sparkPrivatePairing.js-723-      ["rivalries/*/meters/*",1,2,["rivalries/{rivalryId}"]],
js/sparkPrivatePairing.js-724-      ["rivalries/*/sessions/*",2,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
js/sparkPrivatePairing.js-725-      ["rivalries/*/sessionOffers/*",1,1,["accounts/{@pair0}","accounts/{@pair1}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{offer.sessionId}"]]
js/sparkPrivatePairing.js-726-  ].map(row=>Object.freeze([Object.freeze(row[0].split("/")),row[1],row[2],Object.freeze(row[3])])));
js/sparkPrivatePairing.js-727-  // END generated Rules lookup table.
--
js/sharedCanonicalScoring.js-9-  const ROLES=Object.freeze(["playerOne","playerTwo"]);
js/sharedCanonicalScoring.js-10-  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
js/sharedCanonicalScoring.js-11-  const BREAKDOWN_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total","triggers"]);
js/sharedCanonicalScoring.js-12-  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
js/sharedCanonicalScoring.js-13-  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","seasonCommitRevision","seasonCommitContentHash","scoring","winner","contentHash"]);
js/sharedCanonicalScoring.js-14-  const HASH=/^sha256:[0-9a-f]{64}$/;
js/sharedCanonicalScoring.js:15:  const RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,europaLeague:3,primePack:4});
js/sharedCanonicalScoring.js-16-  // r80 Europa League: a sparse 8th result key. It is present only when that manager won the Europa League, and then it is exactly
js/sharedCanonicalScoring.js-17-  // true with championsLeague false (one manager's season is CL or EL, never both; the two managers are never compared). A result
js/sharedCanonicalScoring.js-18-  // without the key is the unchanged 7-key r79 shape, so every hash over old results stays byte-identical. The breakdown carries
js/sharedCanonicalScoring.js-19-  // europaLeague:3 only for such a result.
js/sharedCanonicalScoring.js-20-  const EUROPA_LEAGUE="europaLeague";
js/sharedCanonicalScoring.js:21:  // r88 Prime Pack: a sparse 9th key, primePack 1 to 4 for the manager who named the season's masked Icon first
js/sharedCanonicalScoring.js-22-  // (new R88 Showdowns only; the Rules tie it to that season's iconRounds record). Worth 4, 3, 2 or 1 by the stage of the right guess; a season scores at most 15.
js/sharedCanonicalScoring.js:23:  const PRIME_PACK="primePack";
js/sharedCanonicalScoring.js-24-
js/sharedCanonicalScoring.js-25-  function scFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
js/sharedCanonicalScoring.js-26-  function scPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
js/sharedCanonicalScoring.js-27-  function scExact(value,keys,code="CANONICAL_SCORING_VALUE_INVALID"){if(!scPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))scFail(code);return value;}
js/sharedCanonicalScoring.js-28-  function scClone(value){return JSON.parse(JSON.stringify(value));}
js/sharedCanonicalScoring.js-29-  function scFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scFreeze);Object.freeze(value);}return value;}
js/sharedCanonicalScoring.js-30-  function scCanonical(value){if(Array.isArray(value))return `[${value.map(scCanonical).join(",")}]`;if(scPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
js/sharedCanonicalScoring.js-31-  async function scHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scFail("CANONICAL_SCORING_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
js/sharedCanonicalScoring.js-32-  function scTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)scFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return value;}
js/sharedCanonicalScoring.js:33:  function scEuropaLeague(value,code){if(!scPlain(value))scFail(code);const won=Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,[...RESULT_KEYS,...(won?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,PRIME_PACK)?[PRIME_PACK]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scFail(code);if(Object.hasOwn(value,PRIME_PACK)&&!(Number.isInteger(
js/sharedCanonicalScoring.js:34:  function scResult(value,teamCount){const europaLeague=scEuropaLeague(value,"CANONICAL_SCORING_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoint
js/sharedCanonicalScoring.js-35-  function scBreakdown(result){
js/sharedCanonicalScoring.js-36-    const hundredLeaguePoints=result.leaguePoints>=100,hundredLeagueGoals=result.leagueGoals>=100,topScorer=result.topScorer,topAssist=result.topAssist;
js/sharedCanonicalScoring.js:37:    const breakdown={championsLeague:result.championsLeague?RULES.championsLeague:0,...(result.europaLeague===true?{europaLeague:RULES.europaLeague}:{}),...(Number.isInteger(result.primePack)&&result.primePack>=1&&result.primePack<=RULES.primePack?{primePack:result.primePack}:{}),leagueTitle:result.leaguePosition===1?RULES.leagueTitle:0,domesticCup:result.domesticCu
js/sharedCanonicalScoring.js:38:    breakdown.total=breakdown.championsLeague+(breakdown.europaLeague||0)+(breakdown.primePack||0)+breakdown.leagueTitle+breakdown.domesticCup+breakdown.performanceBonus+breakdown.individualAwardsBonus;return breakdown;
js/sharedCanonicalScoring.js-39-  }
js/sharedCanonicalScoring.js-40-  function scWinner(results,scoring){if(scoring.playerOne.total>scoring.playerTwo.total)return "playerOne";if(scoring.playerTwo.total>scoring.playerOne.total)return "playerTwo";return "draw";}
js/sharedCanonicalScoring.js:41:  function scValidateBreakdown(value){const europaLeague=scPlain(value)&&Object.hasOwn(value,EUROPA_LEAGUE),icon=scPlain(value)&&Object.hasOwn(value,PRIME_PACK);scExact(value,[...BREAKDOWN_KEYS,...(europaLeague?[EUROPA_LEAGUE]:[]),...(icon?[PRIME_PACK]:[])],"CANONICAL_SCORING_STATE_INVALID");if(europaLeague&&(value.europaLeague!==RULES.europaLeague||value.championsL
js/sharedCanonicalScoring.js-42-
js/sharedCanonicalScoring.js-43-  async function scCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonCommitModule=(typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit)}={}){
js/sharedCanonicalScoring.js-44-    const teams=scTeamCount(teamCount);if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")scFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");const commitProtocol=await seasonCommitModule.createProtocol({teamCount:teams,cryptoImpl});
js/sharedCanonicalScoring.js-45-    function scScoreAuthoritativeResults(value){scExact(value,ROLES,"CANONICAL_SCORING_RESULTS_INVALID");const results={playerOne:scResult(value.playerOne,teams),playerTwo:scResult(value.playerTwo,teams)},scoring={playerOne:null,playerTwo:null};scoring.playerOne=scBreakdown(results.playerOne);scoring.playerTwo=scBreakdown(results.playerTwo);return scFreeze({results,
js/sharedCanonicalScoring.js-46-    async function scAcknowledgedCommit(value){let verified;try{verified=await commitProtocol.verifyState(value);}catch(_error){scFail("CANONICAL_SCORING_SEASON_COMMIT_INVALID");}if(verified.phase!=="ACKNOWLEDGED"||verified.revision!==3||!verified.results?.playerOne||!verified.results?.playerTwo)scFail("CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");return verif
js/sharedCanonicalScoring.js-47-    async function scSealState(core){return scFreeze({...scClone(core),contentHash:await scHash(core,cryptoImpl)});}
--
js/legacy.js-196-    if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
js/legacy.js-197-        return player.scoring;
js/legacy.js-198-    }
js/legacy.js-199-    if(typeof calculatePlayerSeasonScore !== "function"){
js/legacy.js-200-        return { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
js/legacy.js-201-    }
js/legacy.js:202:    // r87 Prime Pack: js/scoring.js (startup, at its size budget) leaves the sparse primePack key (1 to 4) to the callers.
js/legacy.js-203-    const scoring = calculatePlayerSeasonScore(player || {});
js/legacy.js:204:    const primePack = player && [1, 2, 3, 4].includes(player.primePack) ? player.primePack : 0;
js/legacy.js:205:    if(primePack && !scoring.primePack){ scoring.primePack = primePack; scoring.total += primePack; }
js/legacy.js-206-    return scoring;
js/legacy.js-207-}
js/legacy.js-208-
js/legacy.js-209-function getPlayerHonours(player){
js/legacy.js-210-    if(!player){ return "No honours"; }
js/legacy.js-211-    const honours = [];
--
--
--
--
--
js/careerScreenSeam.js-58-  }
js/careerScreenSeam.js-59-  // r84 Golden Showdown (Nik): a manager who scores the most a season can score in every season of a finished 10-season
js/careerScreenSeam.js-60-  // Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An ended-early, unfinished or
js/careerScreenSeam.js-61-  // shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
js/careerScreenSeam.js-62-  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so its
js/careerScreenSeam.js-63-  // Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 a season and 110. PRIME_PACK_FROM_MS is
js/careerScreenSeam.js:64:  // js/iconGuess.js fromMs (the Roster Roulette boundary; tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
js/careerScreenSeam.js:65:  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110,primePackPoints:150});
js/careerScreenSeam.js:66:  const SEASON_MAX=Object.freeze({before:11,primePack:15});
js/careerScreenSeam.js-67-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/careerScreenSeam.js-68-  const PAIR_ID=/^pair_[0-9a-f]{64}$/;
js/careerScreenSeam.js-69-  function csSeasonScores(row){
js/careerScreenSeam.js-70-    const out=[];
js/careerScreenSeam.js-71-    for(const season of Array.isArray(row&&row.seasons)?row.seasons:[]){const score=season&&season.score;if(score)for(const key of ["daniel","nik","playerOne","playerTwo"])if(Number.isInteger(score[key]))out.push(score[key]);}
js/careerScreenSeam.js-72-    return out;
js/careerScreenSeam.js-73-  }
js/careerScreenSeam.js-74-  function csLiveSetup(){try{const state=root.CareerModeProductionSharedShowdownSetup?.getState?.();return state&&state.ready===true&&state.setup?.phase==="SHOWDOWN_CONFIRMED"&&PAIR_ID.test(String(state.rivalryId))&&Number.isFinite(state.setupUpdatedAtMs)?state:null;}catch(_error){return null;}}
js/careerScreenSeam.js-75-  // The most one season of this Showdown can score: 15 with Prime Pack, 11 before. Known from the Showdown's confirm time;
js/careerScreenSeam.js-76-  // without one, a season over 11 can only be Prime Pack, and the live Showdown's Setup (when it is this Showdown) decides.
js/careerScreenSeam.js-77-  function seasonMaxFor(row){
js/careerScreenSeam.js:78:    const pack=SEASON_MAX.primePack,before=SEASON_MAX.before;
js/careerScreenSeam.js-79-    if(row&&PAIR_ID.test(String(row.rivalryId))&&Number.isFinite(row.setupConfirmedAt))return row.setupConfirmedAt>=PRIME_PACK_FROM_MS?pack:before;
js/careerScreenSeam.js-80-    if(csSeasonScores(row).some(score=>score>before))return pack;
js/careerScreenSeam.js-81-    const live=csLiveSetup();
js/careerScreenSeam.js-82-    if(live&&(row?.rivalryId==null||row.rivalryId===live.rivalryId))return live.setupUpdatedAtMs>=PRIME_PACK_FROM_MS?pack:before;
js/careerScreenSeam.js-83-    return before;
js/careerScreenSeam.js-84-  }
--
js/sparkSharedSeasonResults.js-23-
js/sparkSharedSeasonResults.js-24-  function ssrpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
js/sparkSharedSeasonResults.js-25-  function ssrpResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SEASON_RESULTS_PROVIDER_FAILED"});}
js/sparkSharedSeasonResults.js-26-  function ssrpSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
js/sparkSharedSeasonResults.js-27-  function ssrpPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
js/sparkSharedSeasonResults.js-28-  function ssrpExact(value,keys,code="SEASON_RESULTS_PROVIDER_STATE_INVALID"){if(!ssrpPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrpFail(code);return value;}
js/sparkSharedSeasonResults.js:29:  function ssrpEuropaLeague(value,code){if(!ssrpPlain(value))ssrpFail(code);const won=Object.hasOwn(value,"europaLeague");ssrpExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrpFail(code);if(Object.hasOwn(value,"primePack")&&!(
js/sparkSharedSeasonResults.js-30-  function ssrpClone(value){return JSON.parse(JSON.stringify(value));}
js/sparkSharedSeasonResults.js-31-  function ssrpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrpFreeze);Object.freeze(value);}return value;}
js/sparkSharedSeasonResults.js-32-  function ssrpCanonical(value){if(Array.isArray(value))return `[${value.map(ssrpCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrpCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
js/sparkSharedSeasonResults.js-33-  async function ssrpHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrpFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrpCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
js/sparkSharedSeasonResults.js-34-  function ssrpNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))ssrpFail("SEASON_RESULTS_RIVALRY_INVALID");return id;}
js/sparkSharedSeasonResults.js-35-  function ssrpNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))ssrpFail("SEASON_RESULTS_SESSION_INVALID");return id;}
--
js/sparkSharedSeasonResults.js-45-  function ssrpNumber(value){return typeof value==="number"||(typeof value==="string"&&value.trim()!=="")?Number(value):Number.NaN;}
js/sparkSharedSeasonResults.js-46-  function ssrpResultShape(value,teamCount){
js/sparkSharedSeasonResults.js-47-    const europaLeague=ssrpEuropaLeague(value,"SEASON_RESULTS_PRIVATE_STATE_INVALID");
js/sparkSharedSeasonResults.js-48-    const position=ssrpNumber(value.leaguePosition),points=ssrpNumber(value.leaguePoints),goals=ssrpNumber(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
js/sparkSharedSeasonResults.js-49-    if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
js/sparkSharedSeasonResults.js-50-    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");}
js/sparkSharedSeasonResults.js:51:    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};
js/sparkSharedSeasonResults.js-52-  }
js/sparkSharedSeasonResults.js-53-
js/sparkSharedSeasonResults.js-54-  function ssrpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")ssrpFail("SEASON_RESULTS_MANAGER_INACTIVE");}
js/sparkSharedSeasonResults.js-55-  function ssrpAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")ssrpFail("SEASON_RESULTS_DEVICE_INACTIVE");}
js/sparkSharedSeasonResults.js-56-  function ssrpAssertRivalry(value,rivalryId,uid){
js/sparkSharedSeasonResults.js-57-    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")ssrpFail("SEASON_RESULTS_RIVALRY_INACTIVE");
--
js/sharedSeasonResults.js-15-  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old hashes never change.
js/sharedSeasonResults.js-16-  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","publishedRoles","results","receipts","contentHash"]);
js/sharedSeasonResults.js-17-
js/sharedSeasonResults.js-18-  function ssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
js/sharedSeasonResults.js-19-  function ssrPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
js/sharedSeasonResults.js-20-  function ssrExact(value,keys,code="SEASON_RESULTS_VALUE_INVALID"){if(!ssrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrFail(code);return value;}
js/sharedSeasonResults.js:21:  function ssrEuropaLeague(value,code){if(!ssrPlain(value))ssrFail(code);const won=Object.hasOwn(value,"europaLeague");ssrExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isI
js/sharedSeasonResults.js-22-  function ssrClone(value){return JSON.parse(JSON.stringify(value));}
js/sharedSeasonResults.js-23-  function ssrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrFreeze);Object.freeze(value);}return value;}
js/sharedSeasonResults.js-24-  function ssrCanonical(value){if(Array.isArray(value))return `[${value.map(ssrCanonical).join(",")}]`;if(ssrPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
js/sharedSeasonResults.js-25-  async function ssrHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
js/sharedSeasonResults.js-26-  function ssrRole(value){if(!ROLES.includes(value))ssrFail("SEASON_RESULTS_ROLE_INVALID");return value;}
js/sharedSeasonResults.js-27-  function ssrSeason(value,totalSeasons){if(!Number.isInteger(value)||value<1||value>totalSeasons)ssrFail("SEASON_RESULTS_SEASON_INVALID");return value;}
--
js/sharedSeasonResults.js-36-    const europaLeague=ssrEuropaLeague(value,"SEASON_RESULTS_PAYLOAD_INVALID");
js/sharedSeasonResults.js-37-    const position=ssrNumber(value.leaguePosition),points=ssrNumber(value.leaguePoints),goals=ssrNumber(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
js/sharedSeasonResults.js-38-    if(!Number.isInteger(position)||position<1||position>teamCount)ssrFail("SEASON_RESULTS_POSITION_INVALID");
js/sharedSeasonResults.js-39-    if(!Number.isInteger(points)||points<0||points>maxPoints)ssrFail("SEASON_RESULTS_POINTS_INVALID");
js/sharedSeasonResults.js-40-    if(!Number.isInteger(goals)||goals<0||goals>300)ssrFail("SEASON_RESULTS_GOALS_INVALID");
js/sharedSeasonResults.js-41-    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrFail("SEASON_RESULTS_PAYLOAD_INVALID");}
js/sharedSeasonResults.js:42:    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};
js/sharedSeasonResults.js-43-  }
js/sharedSeasonResults.js-44-  function ssrReceipt(value){ssrExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_RESULTS_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||value.type!=="publish-result"||!HASH.test(value.commandHash))ssrFail("SEASON_RESULTS_STATE_INVALI
js/sharedSeasonResults.js-45-  async function ssrVerifyState(value,teamCount,cryptoImpl){
js/sharedSeasonResults.js-46-    ssrExact(value,STATE_KEYS,"SEASON_RESULTS_STATE_INVALID");const core=ssrClone(value),hash=core.contentHash;delete core.contentHash;
js/sharedSeasonResults.js-47-    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>2||!HASH.test(hash))ssrFail("SEASON_RESULTS_STATE_INVALID");
js/sharedSeasonResults.js-48-    ssrRoleList(value.publishedRoles);
--
js/sharedCareerAnalytics.js-70-    const pair=field=>({daniel:season.playerOne[field],nik:season.playerTwo[field]});
js/sharedCareerAnalytics.js-71-    // r80: a season with a Europa League win also names who won it (History shows it); other seasons keep the r79 row shape.
js/sharedCareerAnalytics.js-72-    const europaLeague=season.playerOne.europaLeague===true||season.playerTwo.europaLeague===true?{europaLeague:{daniel:season.playerOne.europaLeague===true,nik:season.playerTwo.europaLeague===true}}:{};
js/sharedCareerAnalytics.js-73-    return {season:season.roundNumber,score:{daniel:season.playerOne.scoring.total,nik:season.playerTwo.scoring.total},winner:managerFor(season.winner),tiebreak:seasonTiebreak(season),leaguePosition:pair("leaguePosition"),leaguePoints:pair("leaguePoints"),leagueGoals:pair("leagueGoals"),...europaLeague};
js/sharedCareerAnalytics.js-74-  }
js/sharedCareerAnalytics.js-75-  // r87 Prime Pack: a perfect season is the Showdown's own maximum, 15 for a Showdown confirmed on or after the Prime Pack
js/sharedCareerAnalytics.js:76:  // boundary (js/iconGuess.js fromMs) and 11 before it; with no confirm time, a season with Prime Pack or above 11 means 15.
js/sharedCareerAnalytics.js-77-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/sharedCareerAnalytics.js-78-  function seasonMaxOf(entry,seasons){
js/sharedCareerAnalytics.js-79-    if(Number.isFinite(entry.setupConfirmedAt))return entry.setupConfirmedAt>=PRIME_PACK_FROM_MS?15:11;
js/sharedCareerAnalytics.js:80:    return seasons.some(season=>ROLES.some(role=>season[role]&&(season[role].primePack!==undefined||season[role].scoring.total>11)))?15:11;
js/sharedCareerAnalytics.js-81-  }
js/sharedCareerAnalytics.js-82-  function accumulate(record,season,role,sums,max=11){
js/sharedCareerAnalytics.js-83-    const r=season[role],score=r.scoring.total;
js/sharedCareerAnalytics.js-84-    record.seasons+=1;record.careerPoints+=score;
js/sharedCareerAnalytics.js-85-    sums.points+=r.leaguePoints;sums.goals+=r.leagueGoals;
js/sharedCareerAnalytics.js-86-    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
--
js/analytics.js-137-    if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
js/analytics.js-138-        return player.scoring;
js/analytics.js-139-    }
js/analytics.js-140-    if(typeof calculatePlayerSeasonScore !== "function"){
js/analytics.js-141-        return { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
js/analytics.js-142-    }
js/analytics.js:143:    // r87 Prime Pack: js/scoring.js (startup, at its size budget) leaves the sparse primePack key (1 to 4) to the callers.
js/analytics.js-144-    const scoring = calculatePlayerSeasonScore(player || {});
js/analytics.js:145:    const primePack = player && [1, 2, 3, 4].includes(player.primePack) ? player.primePack : 0;
js/analytics.js:146:    if(primePack && !scoring.primePack){ scoring.primePack = primePack; scoring.total += primePack; }
js/analytics.js-147-    return scoring;
js/analytics.js-148-}
js/analytics.js-149-
js/analytics.js-150-function createManagerCareerStats(name, key = analyticsNormalizeName(name), profileId = null){
js/analytics.js-151-    return {
js/analytics.js-152-        key,
--
js/productionSharedSeasonResults.js-174-  function pssrRender(){pssrWatchSync();if(!root.document||!pssrSharedMarker()||!view)return false;const request=pssrRequestContext();if(!request||contextKey!==request.key)return false;if(renderedContextKey!==request.key){renderedContextKey=request.key;draft=null;}const formKey=`${request.key}|${view.managerRole||""}`;if(formContextKey&&formContextKey!==form
js/productionSharedSeasonResults.js-175-  function pssrBeginReview(){
js/productionSharedSeasonResults.js-176-    if(!view||!view.managerRole)return false;if(view.ownResult){root.CareerModeSeasonFinalV10?.reviewFinalSeason?.();pssrRender();return true;}
js/productionSharedSeasonResults.js-177-    try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrSetError("");pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
js/productionSharedSeasonResults.js-178-  }
js/productionSharedSeasonResults.js-179-  function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrSetError("");pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
js/productionSharedSeasonResults.js:180:  // Prime Pack: the manager who named this season's masked Icon first publishes his result with primePack:N, N = 4, 3, 2 or 1
js/productionSharedSeasonResults.js-181-  // by the stage of his right guess (the Rules accept it only when the round record names him and its server time gives N). Read once from the round record, only for a Showdown that plays
js/productionSharedSeasonResults.js-182-  // Prime Pack; an older Showdown never loads the step or reads anything. A read that fails stops the publish (TRY AGAIN),
js/productionSharedSeasonResults.js-183-  // so a won point is never dropped by a bad connection.
js/productionSharedSeasonResults.js-184-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/productionSharedSeasonResults.js:185:  async function pssrWithPrimePack(ctx,request,result){
js/productionSharedSeasonResults.js-186-    const confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
js/productionSharedSeasonResults.js:187:    // Old Showdowns never load the step (the same boundary as js/iconGuess.js fromMs; a contract keeps them equal).
js/productionSharedSeasonResults.js-188-    if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off"||!result||typeof result!=="object")return result;
js/productionSharedSeasonResults.js:189:    const step=root.CareerModeIconGuessStep||await (typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep).then(()=>root.CareerModeIconGuessStep,()=>null):null);
js/productionSharedSeasonResults.js:190:    // applies() needs the round engine (js/iconGuess.js): load it first, or a won Prime Pack point would be dropped.
js/productionSharedSeasonResults.js-191-    if(!step||!await step.ensure())pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","Prime Pack could not load. Check the connection and try again.");
js/productionSharedSeasonResults.js-192-    const gameCtx={rivalryId:ctx.options.rivalryId,managerRole:ctx.setup.managerRole,season:request.seasonNumber,confirmedAtMs};
js/productionSharedSeasonResults.js-193-    if(!step.applies(gameCtx))return result;
js/productionSharedSeasonResults.js-194-    const points=await step.pointsFor({firestore:ctx.options.firestore,sdk:ctx.options.firebaseSdk,rivalryId:ctx.options.rivalryId},gameCtx);
js/productionSharedSeasonResults.js:195:    const{primePack:_drop,...rest}=result;
js/productionSharedSeasonResults.js:196:    return Number.isInteger(points)&&points>=1&&points<=4?{...rest,primePack:points}:rest;
js/productionSharedSeasonResults.js-197-  }
js/productionSharedSeasonResults.js-198-  async function pssrPublish(){
js/productionSharedSeasonResults.js-199-    if(busy||!draft||!view?.managerRole)return false;
js/productionSharedSeasonResults.js-200-    if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("The shared season context changed. Review your result again.");draft=null;return false;}
js/productionSharedSeasonResults.js-201-    let currentResult;try{currentResult=pssrReadForm(view.managerRole);}catch(error){pssrSetError(error.message||error.code);return false;}
js/productionSharedSeasonResults.js-202-    if(pssrFingerprint(currentResult)!==draft.fingerprint){pssrSetError("Your season result changed after review. Choose Edit My Result and review it again before publishing.");return false;}
--
js/productionSharedSeasonResults.js-206-        const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return false;
js/productionSharedSeasonResults.js-207-        let current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;
js/productionSharedSeasonResults.js-208-        let staleRetried=false,contentionRetries=0;
js/productionSharedSeasonResults.js-209-        for(;;){
js/productionSharedSeasonResults.js-210-          if(current.ownResult){pssrDraftClear(publishRole,request);view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
js/productionSharedSeasonResults.js-211-          draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
js/productionSharedSeasonResults.js:212:          const publishedResult=await pssrWithPrimePack(ctx,request,draft.result);if(!pssrContextMatches(request))return false;
js/productionSharedSeasonResults.js-213-          const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:publishedResult});
js/productionSharedSeasonResults.js-214-          if(published?.code==="SEASON_RESULTS_STALE_BASE_REVISION"&&!staleRetried){staleRetried=true;current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;continue;}
js/productionSharedSeasonResults.js-215-          // JOB-1611: two same-moment publishes can both lose to lock contention instead of one losing to the other's write.
js/productionSharedSeasonResults.js-216-          // One manager then gets aborted (SDK retries spent) or permission-denied (the rival's retried write had not landed
js/productionSharedSeasonResults.js-217-          // by the provider's last re-read) while the rival quietly retries and wins. Wait, re-read and publish again with
js/productionSharedSeasonResults.js-218-          // the same operationId (an own write that did land is bound, never written twice); bounded, then surfaced as before.
--
js/sparkTerminalClose.js-30-    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);if(!Number.isFinite(nowEpochMs)||nowEpochMs<=0)stpFail("TERMINAL_CLOSE_TIME_INVALID");
js/sparkTerminalClose.js-31-    return Object.freeze({firestore:options.firestore,firebaseSdk:options.firebaseSdk,accountId:stcNormalizeAccount(options.user),deviceId:stcNormalizeId(options.deviceId,/^device_[0-9a-f]{32}$/,"TERMINAL_CLOSE_DEVICE_INVALID"),rivalryId,sessionId,intent,nowEpochMs,cryptoImpl:options.cryptoImpl||root.crypto});
js/sparkTerminalClose.js-32-  }
js/sparkTerminalClose.js-33-  function stcRefs(operation){const sdk=operation.firebaseSdk,db=operation.firestore;return Object.freeze({account:sdk.doc(db,"accounts",operation.accountId),device:sdk.doc(db,"accounts",operation.accountId,"devices",operation.deviceId),rivalry:sdk.doc(db,"rivalries",operation.rivalryId),session:sdk.doc(db,"rivalries",operation.rivalryId,"sessions",operation.sessionId),
js/sparkTerminalClose.js-34-  function stcEntitledRivalry(rivalry,accountId){const ids=Array.isArray(rivalry.data.authorizedAccountIds)?rivalry.data.authorizedAccountIds:[],slots=Array.isArray(rivalry.data.managerSlots)?rivalry.data.managerSlots:[];if(ids.length!==2||new Set(ids).size!==2||!ids.includes(accountId)||slots.length!==2||slots.some(slot=>!slot||slot.entitlementState!=="active"||typeof 
js/sparkTerminalClose.js-35-  function stcExactObject(value,keys){return Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)));}
js/sparkTerminalClose.js:36:  function stcEuropaLeague(value){const won=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"europaLeague"));const icon=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"primePack"));if(!stcExactObject(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(icon?["primePack"]:[])])||(won&&(value.europaL
js/sparkTerminalClose.js:37:  function stcScoreResult(value){const europaLeague=stcEuropaLeague(value);for(const key of ["leaguePosition","leaguePoints","leagueGoals"]){if(!Number.isInteger(value[key]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}if(value.leaguePosition<1||value.leaguePosition>20||value.leaguePoints<0||value.leaguePoints>114||value.leagueGoals<0||value.leagueGoals>300)stpFail(
js/sparkTerminalClose.js-38-  function stcCommit(value,rivalryId,season){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.rivalryId!==rivalryId||value.seasonNumber!==season||value.runtimeRevision!=="1.9.1-r10"||value.phase!=="ACKNOWLEDGED"||value.revision!==3||!stcExactObject(value.results,["playerOne","playerTwo"]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");
js/sparkTerminalClose.js-39-  function stcSetup(value,rivalryId,totalSeasons){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||value.totalSeasons!==totalSeasons)stpFail("TERMINAL_CLOSE_SETUP_INVALID");return value;}
js/sparkTerminalClose.js-40-  function stcProgress(value,totalSeasons){if(!stcExactObject(value,PROGRESS_KEYS)||value.schemaVersion!==1||value.runtimeRevision!=="1.9.1-r18"||value.totalSeasons!==totalSeasons||!Number.isInteger(value.acceptedThroughSeason)||value.acceptedThroughSeason<1||value.acceptedThroughSeason>totalSeasons||!stcExactObject(value.managerTotals,["playerOne","playerTwo"])||!Numbe
js/sparkTerminalClose.js-41-  async function stcBuildRivalryEnvelope(operation,prior,data,now){const revision=prior.revision+1;return {schemaVersion:1,objectType:"rivalry",objectId:operation.rivalryId,revision,parentRevision:prior.revision,lifecycleState:"live",contentHash:await stcHashEnvelopeValue({objectType:"rivalry",objectId:operation.rivalryId,revision,data},operation.cryptoImpl),priorConten
js/sparkTerminalClose.js-42-  function stcAccepted(operation,rivalry,sessionRevision,replayed){return stpFreeze({ok:true,status:replayed?"replayed":"accepted",replayed:Boolean(replayed),rivalryId:operation.rivalryId,sessionId:operation.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:rivalry.revision,sessionRevision,terminalWitness:stpClone(operation.intent),canonicalStorageMu
js/sparkTerminalClose.js-43-  async function stcPrepareProgress(operation,references){return operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
--
js/commentaryV3.js-28-  // goals never decide anything between the two managers).
js/commentaryV3.js-29-
js/commentaryV3.js-30-  const ROLES=Object.freeze(["playerOne","playerTwo"]);
js/commentaryV3.js-31-  const NAMES=Object.freeze({playerOne:"Daniel",playerTwo:"Nik"});
js/commentaryV3.js-32-  const LENGTHS=Object.freeze([1,3,5,10]);
js/commentaryV3.js-33-  const MAX=11,PACK_MAX=15;
js/commentaryV3.js:34:  // The Prime Pack boundary is js/iconGuess.js fromMs: a Showdown confirmed on or after it plays Prime Pack.
js/commentaryV3.js-35-  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/commentaryV3.js-36-  const node=typeof module!=="undefined"&&module.exports;
js/commentaryV3.js-37-  const other=role=>role==="playerOne"?"playerTwo":"playerOne";
js/commentaryV3.js-38-  const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
js/commentaryV3.js-39-  const plain=x=>Boolean(x)&&typeof x==="object"&&!Array.isArray(x);
js/commentaryV3.js-40-  function engine(){return root.CareerModeCommentaryEngine||(node?require("./commentaryEngine.js"):null);}
--
js/commentaryV3.js-46-  const ORDINAL_WORDS=["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];
js/commentaryV3.js-47-  function nth(n){return ORDINAL_WORDS[n]||ordinal(n);}
js/commentaryV3.js-48-
js/commentaryV3.js-49-  // ---------- the season maximum ----------
js/commentaryV3.js-50-  // GC-01 (consistency check 2026-11-01): every "decided", "draw-only", "points still to win", "final-late" and Golden line
js/commentaryV3.js-51-  // uses this Showdown's own season maximum, the same rule as js/commentaryEngine.js and js/careerScreenSeam.js: 15 in a
js/commentaryV3.js:52:  // Showdown that plays Prime Pack, 11 before it. facts.primePack (true/false) decides when given; otherwise a season over 11
js/commentaryV3.js-53-  // or with Prime Pack points can only be Prime Pack, and the career seam (when loaded) knows the live Showdown's boundary.
js/commentaryV3.js-54-  function cvSeasonMax(facts){
js/commentaryV3.js:55:    if(facts&&facts.primePack===true)return PACK_MAX;
js/commentaryV3.js:56:    if(facts&&facts.primePack===false)return MAX;
js/commentaryV3.js-57-    const rows=Array.isArray(facts&&facts.history)?facts.history:[];
js/commentaryV3.js:58:    if(rows.some(row=>plain(row)&&ROLES.some(role=>{const r=row[role];return plain(r)&&((Number.isInteger(r.scoring?.total)&&r.scoring.total>MAX)||int(r.primePack,1,4)||int(r.scoring?.primePack,1,4));})))return PACK_MAX;
js/commentaryV3.js-59-    try{if(facts&&facts.showdownId&&root.CareerModeCareerScreenSeam?.seasonMaxFor?.({rivalryId:String(facts.showdownId)})===PACK_MAX)return PACK_MAX;}catch(_){}
js/commentaryV3.js-60-    return MAX;
js/commentaryV3.js-61-  }
js/commentaryV3.js-62-
js/commentaryV3.js-63-  // ---------- facts ----------
js/commentaryV3.js-64-  // facts = {showdownId, seasons (1|3|5|10), clubs:{playerOne,playerTwo}, league, teamCount, history:[row...]}
--
js/commentaryV3.js-193-    const rank=e=>{if(quiet(e))return first.length+1;const i=first.indexOf(e.situation);return i<0?first.length:i;};
js/commentaryV3.js-194-    return entries.filter(e=>!NEEDS_CAREER.test(e.situation)&&!(e.situation==="final-wire-to-wire"&&Number(e.slots.seasons)<3)).map((e,i)=>({e,i})).sort((x,y)=>(avoid.has(x.e.situation)-avoid.has(y.e.situation))||rank(x.e)-rank(y.e)||x.i-y.i).map(x=>x.e);
js/commentaryV3.js-195-  }
js/commentaryV3.js-196-  function v2Facts(facts,season){
js/commentaryV3.js-197-    const league=typeof facts.league==="string"?facts.league:null,clubs=plain(facts.clubs)?facts.clubs:{};
js/commentaryV3.js-198-    return {managers:{playerOne:{name:NAMES.playerOne,club:clubs.playerOne||null,league},playerTwo:{name:NAMES.playerTwo,club:clubs.playerTwo||null,league}},
js/commentaryV3.js:199:      seasons:facts.seasons,season,primePack:cvSeasonMax(facts)===PACK_MAX,results:facts.history.slice(0,season).map(row=>({...row,teamCount:facts.teamCount}))};
js/commentaryV3.js-200-  }
js/commentaryV3.js-201-  // Stock lines were written for any number; "1 points" reads wrong on air, so the booth says "1 point".
js/commentaryV3.js-202-  function grammar(value){return String(value).replace(/(^|[^\d.])1 (Showdown |league )?points\b/g,"$11 $2point");}
js/commentaryV3.js-203-  function linesOf(lines){return Array.isArray(lines)?lines:Array.isArray(lines?.results)?lines.results:[];}
js/commentaryV3.js-204-
js/commentaryV3.js-205-  // One booth call per season: {season, moment, lead:{id,situation,text}|null, numbers:{id,topic,text}|null}.
--
js/commentaryV3.js-248-    const own=accepted[s-1]&&accepted[s-1].roundNumber===s?accepted[s-1]:{playerOne:{...commit.results.playerOne,scoring:scoring.scoring?.playerOne},playerTwo:{...commit.results.playerTwo,scoring:scoring.scoring?.playerTwo},winner:scoring.winner};
js/commentaryV3.js-249-    rows.push(own);
js/commentaryV3.js-250-    const teams=root.CareerModeSharedShowdownCatalog?.catalog?.[setup.leagueId];
js/commentaryV3.js-251-    // Prime Pack is known from this Showdown's confirm time, so an early season with no Prime Pack points yet still counts 15.
js/commentaryV3.js-252-    const at=setupState.setupUpdatedAtMs;
js/commentaryV3.js-253-    return {showdownId:rivalryId,seasons:N,league:setup.leagueId,clubs:setup.clubs,teamCount:Array.isArray(teams)?teams.length:null,history:rows,season:s,
js/commentaryV3.js:254:      primePack:Number.isFinite(at)?at>=PRIME_PACK_FROM_MS:undefined};
js/commentaryV3.js-255-  }
js/commentaryV3.js-256-  function cvLoadAssets(){
js/commentaryV3.js-257-    if(assets)return assets;
js/commentaryV3.js-258-    const load=root.loadRuntimeScript,style=root.loadRuntimeStyle;
js/commentaryV3.js-259-    if(typeof load!=="function")return Promise.reject(new Error("COMMENTARY_LOADER_UNAVAILABLE"));
js/commentaryV3.js-260-    assets=Promise.all([
--
js/commentaryV3.js-355-    let a=0,b=0;for(const row of p.seasonHistory){a+=row.playerOne?.scoring?.total;b+=row.playerTwo?.scoring?.total;}
js/commentaryV3.js-356-    if(!frame||frame.totals?.daniel!==a||frame.totals?.nik!==b)return null;
js/commentaryV3.js-357-    const teams=root.CareerModeSharedShowdownCatalog?.catalog?.[p.leagueId],rid=String(p.rivalryId||history.rivalryId||"");
js/commentaryV3.js-358-    // Prime Pack: this Showdown's confirm time (the closed read carries it), else the live Setup when it is this Showdown.
js/commentaryV3.js-359-    let at=history.setupConfirmedAt;
js/commentaryV3.js-360-    if(!Number.isFinite(at)){const live=state("CareerModeProductionSharedShowdownSetup");if(live&&String(live.rivalryId)===rid&&live.setup?.phase==="SHOWDOWN_CONFIRMED")at=live.setupUpdatedAtMs;}
js/commentaryV3.js:361:    return {showdownId:rid,primePack:Number.isFinite(at)?at>=PRIME_PACK_FROM_MS:undefined,seasons:p.totalSeasons,league:p.leagueId,clubs:{playerOne:p.managerRecords?.playerOne?.club,playerTwo:p.managerRecords?.playerTwo?.club},
js/commentaryV3.js-362-      teamCount:Array.isArray(teams)?teams.length:null,history:p.seasonHistory,season:p.totalSeasons};
js/commentaryV3.js-363-  }
js/commentaryV3.js-364-  function cvFinalRule(doc){
js/commentaryV3.js-365-    if(doc.getElementById("commentaryV3FinalRule"))return;
js/commentaryV3.js-366-    const style=doc.createElement("style");style.id="commentaryV3FinalRule";
js/commentaryV3.js-367-    style.textContent=`
--
js/touchlineGazette.js-30-  const ROLES=Object.freeze(["playerOne","playerTwo"]);
js/touchlineGazette.js-31-  const OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
js/touchlineGazette.js-32-  const LENGTHS=Object.freeze([1,3,5,10]);
js/touchlineGazette.js-33-  const GOLDEN=Object.freeze({seasons:10,points:110});
js/touchlineGazette.js-34-  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so
js/touchlineGazette.js-35-  // its race counts 15 a season left and its Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 and 110.
js/touchlineGazette.js:36:  // PRIME_PACK_FROM_MS is js/iconGuess.js fromMs (tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
js/touchlineGazette.js:37:  const SEASON_MAX=Object.freeze({before:11,primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
js/touchlineGazette.js-38-  // true/false when this Showdown's confirm time is known (given, or the live Setup when it is this Showdown), else null.
js/touchlineGazette.js:39:  function tgPrimePack(rivalryId,confirmedAt){
js/touchlineGazette.js-40-    if(Number.isFinite(confirmedAt))return confirmedAt>=PRIME_PACK_FROM_MS;
js/touchlineGazette.js-41-    try{const setup=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(setup&&setup.rivalryId===rivalryId&&setup.setup?.phase==="SHOWDOWN_CONFIRMED"&&Number.isFinite(setup.setupUpdatedAtMs))return setup.setupUpdatedAtMs>=PRIME_PACK_FROM_MS;}catch(_error){}
js/touchlineGazette.js-42-    return null;
js/touchlineGazette.js-43-  }
js/touchlineGazette.js-44-  const TROPHY_ART=Object.freeze({"champions-league":"TRO_CONTINENTAL","europa-league":"TRO_EUROPA","league-title":"TRO_LEAGUE_TITLE","domestic-cup":"TRO_DOMESTIC_CUP"});
js/touchlineGazette.js-45-  // A headline, story, quote or caption that talks about silverware is not printed for a winner whose season had no
--
js/touchlineGazette.js-127-      "performance-bonus":s.performanceBonus===1,"awards-bonus":s.individualAwardsBonus===1,
js/touchlineGazette.js-128-      points:{championsLeague:s.championsLeague||0,europaLeague:s.europaLeague||0,leagueTitle:s.leagueTitle||0,domesticCup:s.domesticCup||0,performance:s.performanceBonus||0,awards:s.individualAwardsBonus||0,total:s.total}
js/touchlineGazette.js-129-    };
js/touchlineGazette.js-130-  }
js/touchlineGazette.js-131-  const trophyCount=items=>["champions-league","europa-league","league-title","domestic-cup"].filter(k=>items[k]).length;
js/touchlineGazette.js-132-  // Every accepted season up to `through`, checked: scores 0-15, and the stored winner is the one the scores give (equal is a draw).
js/touchlineGazette.js:133:  // max is this Showdown's season maximum: from primePack when known, else 15 once any season has a Prime Pack point or
js/touchlineGazette.js-134-  // scored over 11, else 11.
js/touchlineGazette.js:135:  function readHistory(projection,through,primePack=null){
js/touchlineGazette.js-136-    if(!plain(projection)||!Array.isArray(projection.seasonHistory)||!LENGTHS.includes(projection.totalSeasons)||!plain(projection.managerRecords))return null;
js/touchlineGazette.js-137-    const T=projection.totalSeasons;if(!int(through,1,T)||projection.seasonHistory.length<through)return null;
js/touchlineGazette.js-138-    const clubs={};for(const role of ROLES){const club=projection.managerRecords[role]?.club;if(typeof club!=="string"||!club.trim())return null;clubs[role]=club;}
js/touchlineGazette.js-139-    const seasons=[];
js/touchlineGazette.js-140-    for(let i=0;i<through;i+=1){
js/touchlineGazette.js-141-      const row=projection.seasonHistory[i];if(!plain(row)||row.roundNumber!==i+1||!plain(row.playerOne)||!plain(row.playerTwo))return null;
js/touchlineGazette.js:142:      const a=row.playerOne.scoring?.total,b=row.playerTwo.scoring?.total;if(!int(a,0,SEASON_MAX.primePack)||!int(b,0,SEASON_MAX.primePack))return null;
js/touchlineGazette.js-143-      const winner=a>b?"playerOne":b>a?"playerTwo":"draw";if(row.winner!==winner)return null;
js/touchlineGazette.js-144-      seasons.push({number:i+1,score:{playerOne:a,playerTwo:b},winner,items:{playerOne:seasonItems(row.playerOne),playerTwo:seasonItems(row.playerTwo)}});
js/touchlineGazette.js-145-    }
js/touchlineGazette.js-146-    // unknown confirm time: a Prime Pack point, or a season over 11, can only come from a Showdown that plays Prime Pack
js/touchlineGazette.js-147-    const sides=projection.seasonHistory.flatMap(row=>plain(row)?[row.playerOne,row.playerTwo].filter(plain):[]);
js/touchlineGazette.js:148:    const pack=primePack===true||primePack===false?primePack:sides.some(side=>Number.isInteger(side.primePack)||Number.isInteger(side.scoring?.primePack)||(Number.isInteger(side.scoring?.total)&&side.scoring.total>SEASON_MAX.before));
js/touchlineGazette.js:149:    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons,max:pack?SEASON_MAX.primePack:SEASON_MAX.before};
js/touchlineGazette.js-150-  }
js/touchlineGazette.js-151-  const totalsOf=seasons=>seasons.reduce((t,s)=>({playerOne:t.playerOne+s.score.playerOne,playerTwo:t.playerTwo+s.score.playerTwo}),{playerOne:0,playerTwo:0});
js/touchlineGazette.js-152-  function spOf(sp){return plain(sp)&&plain(sp.daniel)&&plain(sp.nik)&&typeof sp.daniel.name==="string"&&sp.daniel.name&&typeof sp.nik.name==="string"&&sp.nik.name?{daniel:sp.daniel.name,nik:sp.nik.name}:null;}
js/touchlineGazette.js-153-
js/touchlineGazette.js-154-  // ---------- the Gazette desk (2.0.0): plain facts worked out from the seasons, never from copy ----------
js/touchlineGazette.js-155-  // THE RACE: where the Showdown stands after this paper's season, with what is still possible (a season is worth at most
--
js/touchlineGazette.js-265-    // most 11, or 15 with Prime Pack, and equal totals are a draw, so a gap of a full season can only be levelled, never turned)
js/touchlineGazette.js-266-    if(T>=3&&N===T-1&&gap<facts.max)list.push("final-season-decider");
js/touchlineGazette.js-267-    return list;
js/touchlineGazette.js-268-  }
js/touchlineGazette.js-269-  // Each paper is built after the papers of the Showdown's earlier seasons (the same rows on both phones), so it can pass
js/touchlineGazette.js-270-  // over the rows they printed.
js/touchlineGazette.js:271:  function seasonEdition({projection,seasonNumber,specialPlayers=null,primePack=null}={}){
js/touchlineGazette.js-272-    const C=tgCopy(),P=tgPages();if(!C||!P)return null;
js/touchlineGazette.js:273:    const N=seasonNumber,facts=readHistory(projection,N,primePack);if(!facts||N>=facts.totalSeasons)return null;
js/touchlineGazette.js-274-    const used=new Set();let edition=null;
js/touchlineGazette.js-275-    for(let k=1;k<=N;k+=1)edition=buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,k===N?specialPlayers:null,used);
js/touchlineGazette.js-276-    return edition;
js/touchlineGazette.js-277-  }
js/touchlineGazette.js-278-  function buildSeason(facts,N,specialPlayers,used){
js/touchlineGazette.js-279-    const C=tgCopy(),P=tgPages();
--
js/touchlineGazette.js-330-      },
js/touchlineGazette.js-331-      ids:{headline:head.id,story:story.id,briefs:briefs.map(b=>b.id)}
js/touchlineGazette.js-332-    });
js/touchlineGazette.js-333-  }
js/touchlineGazette.js-334-
js/touchlineGazette.js-335-  // ---------- FINAL edition ----------
js/touchlineGazette.js:336:  function finalEdition({projection,final=null,specialPlayers=null,primePack=null}={}){
js/touchlineGazette.js-337-    const C=tgCopy(),P=tgPages();if(!C||!P||!plain(projection))return null;
js/touchlineGazette.js:338:    const T=projection.totalSeasons,facts=readHistory(projection,T,primePack);if(!facts||facts.seasons.length!==T)return null;
js/touchlineGazette.js-339-    const totals=totalsOf(facts.seasons),W=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw";
js/touchlineGazette.js-340-    // The Final Winner frame, when given, must say the same (it reads the reconciled winner; the paper never disagrees with it).
js/touchlineGazette.js-341-    if(final){const fw={daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner];if(fw!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
js/touchlineGazette.js-342-    const draw=W==="draw",L=draw?null:OTHER[W],margin=Math.abs(totals.playerOne-totals.playerTwo);
js/touchlineGazette.js-343-    // A Golden Showdown is a manager on 110 over ten seasons (150 with Prime Pack): the winner, or both managers on a 110-110
js/touchlineGazette.js-344-    // (150-150) draw (still a draw, no tiebreak; the paper is the gold edition with the drawn copy).
--
js/touchlineGazette.js-425-  function tgChip(load){return load("special-player-chip","js/specialPlayerChip.js",()=>Boolean(root.CareerModeSpecialPlayerChip)).then(()=>root.CareerModeSpecialPlayerChip?.ensure?.()).then(ready=>{if(ready===false)throw new Error("GAZETTE_SPECIAL_PLAYER_UNAVAILABLE");return true;});}
js/touchlineGazette.js-426-  // SEASON: the season this phone's CONTINUE TO SEASON N+1 belongs to (Shared History converged through it).
js/touchlineGazette.js-427-  function seasonInput(states){
js/touchlineGazette.js-428-    const history=states?.history,projection=history?.projection;
js/touchlineGazette.js-429-    if(history?.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||!plain(projection))return null;
js/touchlineGazette.js-430-    const N=Number(history.throughSeason);if(!Number.isInteger(N)||projection.acceptedSeasons!==N)return null;
js/touchlineGazette.js:431:    return {projection,seasonNumber:N,specialPlayers:states.specialPlayers||null,primePack:tgPrimePack(projection.rivalryId,history.setupConfirmedAt)};
js/touchlineGazette.js-432-  }
js/touchlineGazette.js-433-  // FINAL: the Final Winner frame on screen and the verified history it was drawn from (js/seasonFinalV10.js).
js/touchlineGazette.js-434-  function finalInput(states){
js/touchlineGazette.js-435-    const final=states?.final,history=states?.history,projection=history?.projection;
js/touchlineGazette.js-436-    if(!plain(final)||!final.winner||!plain(projection)||history?.phase!=="HISTORY_CONVERGED")return null;
js/touchlineGazette.js-437-    if(Number.isInteger(final.seasonsPlayed)&&final.seasonsPlayed!==projection.totalSeasons)return null;
js/touchlineGazette.js:438:    return {projection,final,specialPlayers:final.specialPlayers||states.specialPlayers||null,primePack:tgPrimePack(projection.rivalryId,history.setupConfirmedAt)};
js/touchlineGazette.js-439-  }
js/touchlineGazette.js-440-
js/touchlineGazette.js-441-  // ---------- the page (browser only) ----------
js/touchlineGazette.js-442-  const SEEN_KEY="careerModeShowdown.gazetteSeen.v1",SEEN_MAX=60;
js/touchlineGazette.js-443-  const ASSET_CAP_MS=4000,FINAL_SAFETY_MS=2500;
js/touchlineGazette.js-444-  const BASE="visual-assets/v10_1/content/";
--
--
--
--
--
js/sparkSharedSeasonCommit.js-37-  function scpSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)scpFail("SEASON_COMMIT_SEASON_INVALID");return n;}
js/sparkSharedSeasonCommit.js-38-  function scpOperation(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))scpFail("SEASON_COMMIT_COMMAND_INVALID");return id;}
js/sparkSharedSeasonCommit.js-39-  function scpBase(value){const n=Number(value);if(!Number.isInteger(n)||n<0||n>3)scpFail("SEASON_COMMIT_COMMAND_INVALID");return n;}
js/sparkSharedSeasonCommit.js-40-  function scpUid(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)scpFail("SEASON_COMMIT_AUTH_REQUIRED");return id;}
js/sparkSharedSeasonCommit.js-41-  function scpNow(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)scpFail("SEASON_COMMIT_CLOCK_INVALID");return n;}
js/sparkSharedSeasonCommit.js-42-  function scpTeamCount(setup){const clubs=scpModules.catalogModule?.catalog?.[setup?.leagueId];if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)scpFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return clubs.length;}
js/sparkSharedSeasonCommit.js:43:  function scpEuropaLeague(value,code){if(!scpPlain(value))scpFail(code);const won=Object.hasOwn(value,"europaLeague");scpExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scpFail(code);if(Object.hasOwn(value,"primePack")&&!(Number
js/sparkSharedSeasonCommit.js-44-  function scpResult(value,teamCount){scpEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagu
js/sparkSharedSeasonCommit.js-45-  function scpSdk(options){if(!options.firestore)scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");}return options.firebaseSdk;}
js/sparkSharedSeasonCommit.js-46-  function scpPath(sdk,db,...parts){return sdk.doc(db,...parts);}
js/sparkSharedSeasonCommit.js-47-  async function scpGet(tx,ref){return scpSnapshot(await tx.get(ref));}
js/sparkSharedSeasonCommit.js-48-
js/sparkSharedSeasonCommit.js-49-  function scpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||value.data?.status!=="active")scpFail("SEASON_COMMIT_MANAGER_INACTIVE");}
--
js/productionSharedCanonicalScoring.js-52-  let pcscWatchedKey=null;
js/productionSharedCanonicalScoring.js-53-  function pcscWatchSync(){let key="";try{key=pcscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcscWatchedKey)return;pcscWatchedKey=key;try{pcscWatchWait();}catch(_error){}}
js/productionSharedCanonicalScoring.js-54-  function pcscRender(){pcscWatchSync();
js/productionSharedCanonicalScoring.js-55-    const ui=pcscEnsureUi();if(!ui)return false;const request=pcscRequestContext(),eligible=Boolean(pcscSharedMarker()&&request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="SCORING_RECONCILED");pcscHidden(ui.panel,!eligible);if(!eligible)return false;
js/productionSharedCanonicalScoring.js-56-    const p1=view.scoring.playerOne,p2=view.scoring.playerTwo,n1=pcscManagerName("playerOne"),n2=pcscManagerName("playerTwo");
js/productionSharedCanonicalScoring.js-57-    pcscText(ui.totals,`${n1}: ${p1.total} · ${n2}: ${p2.total}`);
js/productionSharedCanonicalScoring.js:58:    pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague}${p1.europaLeague||p2.europaLeague?` · Europa League ${p1.europaLeague||0}–${p2.europaLeague||0}`:""}${p1.primePack||p2.primePack?` · Prime Pack ${p1.primePack||0}–${p2.primePack||0}`:""} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.
js/productionSharedCanonicalScoring.js-59-    pcscText(ui.winner,view.winner==="draw"?"Season result: Draw":`Season winner: ${pcscManagerName(view.winner)}`);pcscBoard(ui.panel,p1,p2,n1,n2,view.winner);return true;
js/productionSharedCanonicalScoring.js-60-  }
js/productionSharedCanonicalScoring.js-61-  // r87 match-day polish: the same numbers drawn as a scoreboard (names, big totals, one row per category with the higher
js/productionSharedCanonicalScoring.js-62-  // number gold, the season verdict). The three text lines above stay for screen readers and the audits; the board is
js/productionSharedCanonicalScoring.js-63-  // aria-hidden. Equal stays level: a row or a season is never split by anything else (no tiebreak).
js/productionSharedCanonicalScoring.js-64-  function pcscBoard(panel,p1,p2,n1,n2,winner){
--
js/productionSharedCanonicalScoring.js-67-    const key=JSON.stringify([p1,p2,n1,n2,winner]);if(board.dataset.key===key)return;board.dataset.key=key;
js/productionSharedCanonicalScoring.js-68-    const el=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=String(text);return node;};
js/productionSharedCanonicalScoring.js-69-    const side=(a,b)=>a>b?" is-lead":"";
js/productionSharedCanonicalScoring.js-70-    const head=el("div","pcscBoard__head");
js/productionSharedCanonicalScoring.js-71-    head.append(el("span","pcscBoard__name",n1),el("strong",`pcscBoard__total${side(p1.total,p2.total)}`,p1.total),el("span","pcscBoard__colon",":"),el("strong",`pcscBoard__total${side(p2.total,p1.total)}`,p2.total),el("span","pcscBoard__name",n2));
js/productionSharedCanonicalScoring.js-72-    const rows=el("div","pcscBoard__rows");
js/productionSharedCanonicalScoring.js:73:    const lines=[["Champions League",p1.championsLeague,p2.championsLeague],...(p1.europaLeague||p2.europaLeague?[["Europa League",p1.europaLeague||0,p2.europaLeague||0]]:[]),...(p1.primePack||p2.primePack?[["Prime Pack",p1.primePack||0,p2.primePack||0]]:[]),["League Title",p1.leagueTitle,p2.leagueTitle],["Domestic Cup",p1.domesticCup,p2.domesticCup],["Per
js/productionSharedCanonicalScoring.js-74-    for(const [label,a,b] of lines){const one=Number(a)||0,two=Number(b)||0,row=el("div",`pcscBoard__row${one||two?"":" is-zero"}`);row.append(el("span",`pcscBoard__val${side(one,two)}`,`+${one}`),el("span","pcscBoard__label",label),el("span",`pcscBoard__val${side(two,one)}`,`+${two}`));rows.append(row);}
js/productionSharedCanonicalScoring.js-75-    const verdict=el("div",`pcscBoard__verdict${winner==="draw"?" is-draw":""}`,winner==="draw"?"SEASON DRAWN":`SEASON WINNER · ${pcscManagerName(winner)}`);
js/productionSharedCanonicalScoring.js-76-    board.replaceChildren(head,rows,verdict);panel.classList.add("hasPcscBoard");
js/productionSharedCanonicalScoring.js-77-  }
js/productionSharedCanonicalScoring.js-78-  async function pcscProviderOptions(request){
js/productionSharedCanonicalScoring.js-79-    const setup=setupApi?.getState?.();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pcscFail("CANONICAL_SCORING_SETUP_NOT_CONFIRMED");
--
js/sparkCompletedShowdownReader.js-36-  function csrExact(value,keys,code){if(!csrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))csrFail(code);return value;}
js/sparkCompletedShowdownReader.js-37-  function csrClone(value){return JSON.parse(JSON.stringify(value));}
js/sparkCompletedShowdownReader.js-38-  function csrSortedCanonical(value){if(Array.isArray(value))return `[${value.map(csrSortedCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${csrSortedCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
js/sparkCompletedShowdownReader.js-39-  function csrEnvelopeCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(csrEnvelopeCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(
js/sparkCompletedShowdownReader.js-40-  async function csrDigest(text,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")csrFail("COMPLETED_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
js/sparkCompletedShowdownReader.js-41-  function csrSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
js/sparkCompletedShowdownReader.js:42:  function csrEuropaLeague(value,code){if(!csrPlain(value))csrFail(code);const won=Object.hasOwn(value,"europaLeague");csrExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))csrFail(code);if(Object.hasOwn(value,"primePack")&&!(N
js/sparkCompletedShowdownReader.js-43-  // r82: live Firestore returns map fields in its own order (the emulator keeps the written order), so every result is
js/sparkCompletedShowdownReader.js-44-  // rebuilt in one fixed key order before any comparison, projection or replay. Order never changes a hash (sorted canonical).
js/sparkCompletedShowdownReader.js:45:  function csrOrdered(value){const out={};for(const key of RESULT_KEYS)out[key]=value[key];if(Object.hasOwn(value,"europaLeague"))out.europaLeague=value.europaLeague;if(Object.hasOwn(value,"primePack"))out.primePack=value.primePack;return out;}
js/sparkCompletedShowdownReader.js-46-  function csrResult(value,teamCount){csrEuropaLeague(value,"COMPLETED_SEASON_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagu
js/sparkCompletedShowdownReader.js-47-
js/sparkCompletedShowdownReader.js-48-  function csrState(status,fields={}){
js/sparkCompletedShowdownReader.js-49-    return csrFreeze({status,code:fields.code||null,rivalryId:fields.rivalryId||null,managerRole:fields.managerRole||null,terminalWitness:fields.terminalWitness||null,projection:fields.projection||null,final:fields.final||null,ended:fields.ended||null,setupConfirmedAt:Number.isFinite(fields.setupConfirmedAt)?fields.setupConfirmedAt:null});
js/sparkCompletedShowdownReader.js-50-  }
js/sparkCompletedShowdownReader.js-51-  async function csrGet(sdk,db,parts){
--
js/ruleBook.js-200-    specialLive.className = "ruleSpecialPlayerLive spChipPair";
js/ruleBook.js-201-    specialLive.hidden = true;
js/ruleBook.js-202-    special.append(specialLabel, specialText, specialLive);
js/ruleBook.js-203-
js/ruleBook.js-204-    // r87 Prime Pack (Nik 2026-11-01): its own line in the same style. The values shown are the Icon's real card stats from the
js/ruleBook.js-205-    // list; only which of the six shows at each stage is random (each once). The flag comes only with the full reveal.
js/ruleBook.js:206:    const primePack = document.createElement("p");
js/ruleBook.js:207:    primePack.className = "ruleGoldenShowdown rulePrimePack";
js/ruleBook.js:208:    const primePackLabel = document.createElement("strong");
js/ruleBook.js:209:    primePackLabel.textContent = "PRIME PACK";
js/ruleBook.js:210:    const primePackText = document.createElement("span");
js/ruleBook.js:211:    primePackText.textContent = "A masked Icon shows his position and one real card stat, then one more real stat each stage, up to four. Which stats show is random; the values never are. Each manager has two guesses. Name him first for 4, 3, 2 or 1 points. Nobody right after stage 4 scores 0. Then the whole card is revealed: the last two stats, his name, flag and overall.";
js/ruleBook.js:212:    primePack.append(primePackLabel, primePackText);
js/ruleBook.js-213-
js/ruleBook.js:214:    article.append(header, scoring, maximum, golden, special, primePack, notes);
js/ruleBook.js-215-    return article;
js/ruleBook.js-216-}
js/ruleBook.js-217-
js/ruleBook.js-218-// r86 Special Player rules (Nik 2026-10-29 15:24 UTC): the full card, last, with the training rule by length.
js/ruleBook.js-219-// The draws card is gone (Nik 2026-10-29 21:10 UTC): the no-tiebreak rules stay in scoring.js, not on the page.
js/ruleBook.js-220-function createSpecialPlayerRuleSection(){
--
js/sharedHistoryConvergence.js-23-  function hcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
js/sharedHistoryConvergence.js-24-  function hcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcFreeze);Object.freeze(value);}return value;}
js/sharedHistoryConvergence.js-25-  function hcExact(value,keys,code){if(!hcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))hcFail(code);return value;}
js/sharedHistoryConvergence.js-26-  function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
js/sharedHistoryConvergence.js-27-  function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
js/sharedHistoryConvergence.js-28-  function hcTeamCount(leagueId){const n=LEAGUE_TEAM_COUNTS[String(leagueId||"").trim()];if(!Number.isInteger(n))hcFail("HISTORY_CONVERGENCE_LEAGUE_INVALID");return n;}
js/sharedHistoryConvergence.js:29:  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,hcResultKeys(value),"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");if(Object.hasOwn(value,"primePack")&&
js/sharedHistoryConvergence.js:30:  function hcResultKeys(value){return [...RESULT_KEYS,...(Object.hasOwn(value,EUROPA_LEAGUE)?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])];}
js/sharedHistoryConvergence.js-31-  function hcResult(value,teamCount){
js/sharedHistoryConvergence.js-32-    hcEuropaLeague(value);
js/sharedHistoryConvergence.js-33-    const maxPoints=(teamCount-1)*2*3;
js/sharedHistoryConvergence.js-34-    if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");
js/sharedHistoryConvergence.js-35-    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");}
js/sharedHistoryConvergence.js-36-    // The 7 keys in their fixed order, then europaLeague only when present (the order every normalizer writes), so the tamper rebuild matches.
js/sharedHistoryConvergence.js-37-    return Object.fromEntries(hcResultKeys(value).map(key=>[key,value[key]]));
js/sharedHistoryConvergence.js-38-  }
js/sharedHistoryConvergence.js-39-  function hcExpectedScore(result){
js/sharedHistoryConvergence.js:40:    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0,primePack=Number.isInteger(result.primePack)?result.primePack:0;
js/sharedHistoryConvergence.js-41-    const leagueTitle=result.leaguePosition===1?3:0;
js/sharedHistoryConvergence.js-42-    const domesticCup=result.domesticCup?1:0;
js/sharedHistoryConvergence.js-43-    const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
js/sharedHistoryConvergence.js-44-    const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
js/sharedHistoryConvergence.js:45:    return {championsLeague,...(europaLeague?{europaLeague}:{}),...(primePack?{primePack}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+primePack+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
js/sharedHistoryConvergence.js-46-  }
js/sharedHistoryConvergence.js-47-  function hcScore(value,result){
js/sharedHistoryConvergence.js-48-    if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
js/sharedHistoryConvergence.js:49:    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE),hasPrimePack=Object.hasOwn(value,"primePack");
js/sharedHistoryConvergence.js:50:    // r87 Prime Pack: the sparse primePack breakdown key (1 to 4) sits beside the others exactly when the result carries it.
js/sharedHistoryConvergence.js:51:    const scoreKeys=[...SCORE_KEYS,...(hasEuropaLeague?[EUROPA_LEAGUE]:[]),...(hasPrimePack?["primePack"]:[])],allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
js/sharedHistoryConvergence.js-52-    if(keys.length!==allowed.length||allowed.some(key=>!Object.hasOwn(value,key)))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
js/sharedHistoryConvergence.js-53-    const expected=hcExpectedScore(result);
js/sharedHistoryConvergence.js:54:    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE)||hasPrimePack!==Object.hasOwn(expected,"primePack"))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
js/sharedHistoryConvergence.js-55-    for(const key of scoreKeys){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
js/sharedHistoryConvergence.js-56-    if(hasTriggers){
js/sharedHistoryConvergence.js-57-      hcExact(value.triggers,TRIGGER_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
js/sharedHistoryConvergence.js-58-      const expectedTriggers={
js/sharedHistoryConvergence.js-59-        hundredLeaguePoints:result.leaguePoints>=100,
js/sharedHistoryConvergence.js-60-        hundredLeagueGoals:result.leagueGoals>=100,
--
js/commentaryEngine.js-65-    "Hamburger SV":"Hamburg","Athletic Club de Bilbao":"Athletic Club","Inter":"Inter Milan","AS Monaco":"Monaco","UD Las Palmas":"Las Palmas",
js/commentaryEngine.js-66-    "FC Schalke 04":"Schalke 04","VfL Wolfsburg":"Wolfsburg","Villarreal CF":"Villarreal","TSG 1899 Hoffenheim":"Hoffenheim","Valencia CF":"Valencia",
js/commentaryEngine.js-67-    "OGC Nice":"Nice","Sevilla FC":"Sevilla","Málaga CF":"Málaga","SD Eibar":"Eibar","RC Celta":"Celta Vigo","Toulouse Football Club":"Toulouse",
js/commentaryEngine.js-68-    "Granada CF":"Granada","AS Saint-Étienne":"Saint-Étienne","Stade Rennais FC":"Rennes"
js/commentaryEngine.js-69-  });
js/commentaryEngine.js-70-  // The most one season can score: 11, or 15 in a Showdown that plays r87 Prime Pack (11 + up to 4; G Lead and Nik
js/commentaryEngine.js:71:  // 2026-11-01). facts.primePack (true/false) says which; without it, a Prime Pack point or a season over 11 can only be Prime Pack. A season is
js/commentaryEngine.js-72-  // checked against the larger maximum; every "maximum", "clinched" and Golden line uses this Showdown's own.
js/commentaryEngine.js-73-  const MAX_SEASON_POINTS=11,MAX_PRIME_PACK_SEASON_POINTS=15;
js/commentaryEngine.js-74-  function ceSeasonMax(facts,sd){
js/commentaryEngine.js:75:    if(facts&&facts.primePack===true)return MAX_PRIME_PACK_SEASON_POINTS;
js/commentaryEngine.js:76:    if(facts&&facts.primePack===false)return MAX_SEASON_POINTS;
js/commentaryEngine.js:77:    return sd.seasons.some(row=>ROLES.some(role=>row.primePack[role]||row.points[role]>MAX_SEASON_POINTS))?MAX_PRIME_PACK_SEASON_POINTS:MAX_SEASON_POINTS;
js/commentaryEngine.js-78-  }
js/commentaryEngine.js-79-  // {mpPosition} is read aloud, so it is the spoken position, never the list's code (Nik 2026-10-29). A code not listed here
js/commentaryEngine.js-80-  // leaves the slot out rather than reading a code.
js/commentaryEngine.js-81-  const POSITION_WORDS=Object.freeze({LW:"left winger",RW:"right winger",LM:"left midfielder",RM:"right midfielder",CM:"central midfielder",
js/commentaryEngine.js-82-    CAM:"attacking midfielder",CDM:"defensive midfielder",ST:"striker",CF:"centre-forward",CB:"centre-back",LB:"left-back",RB:"right-back",GK:"goalkeeper"});
js/commentaryEngine.js-83-
--
js/commentaryEngine.js-114-  }
js/commentaryEngine.js-115-  // One finished season: the canonical projection {results, scoring, winner?} (sharedCanonicalScoring) or a saved round
js/commentaryEngine.js-116-  // {playerOne:{...result, scoring}, playerTwo:{...}} (js/scoring.js). Without a breakdown the browser's own
js/commentaryEngine.js-117-  // calculatePlayerSeasonScore (js/scoring.js) is used; with neither, the facts are refused rather than re-scored here.
js/commentaryEngine.js-118-  function ceSeason(value,index){
js/commentaryEngine.js-119-    if(!value||typeof value!=="object")ceFail("COMMENTARY_SEASON_INVALID");
js/commentaryEngine.js:120:    const out={number:index+1,result:{},breakdown:{},points:{},teamCount:{},primePack:{}};
js/commentaryEngine.js-121-    for(const role of ROLES){
js/commentaryEngine.js-122-      const result=value.results?value.results[role]:value[role];
js/commentaryEngine.js-123-      if(!result||typeof result!=="object")ceFail("COMMENTARY_SEASON_INVALID");
js/commentaryEngine.js-124-      let breakdown=value.scoring?value.scoring[role]:result.scoring;
js/commentaryEngine.js:125:      if(!breakdown&&typeof root.calculatePlayerSeasonScore==="function"){breakdown=root.calculatePlayerSeasonScore(result);const pp=[1,2,3,4].includes(result.primePack)?result.primePack:0;if(pp&&!breakdown.primePack){breakdown={...breakdown,primePack:pp,total:breakdown.total+pp};}}
js/commentaryEngine.js-126-      if(!breakdown||typeof breakdown!=="object")ceFail("COMMENTARY_SCORING_MISSING");
js/commentaryEngine.js-127-      if(!Number.isInteger(breakdown.total)||breakdown.total<0||breakdown.total>MAX_PRIME_PACK_SEASON_POINTS)ceFail("COMMENTARY_SCORING_INVALID");
js/commentaryEngine.js-128-      const teams=value.teamCounts&&Number.isInteger(value.teamCounts[role])?value.teamCounts[role]:value.teamCount;
js/commentaryEngine.js-129-      if(!Number.isInteger(teams)||teams<2)ceFail("COMMENTARY_TEAM_COUNT_INVALID");
js/commentaryEngine.js-130-      const position=Number(result.leaguePosition);
js/commentaryEngine.js-131-      if(!Number.isInteger(position)||position<1||position>teams)ceFail("COMMENTARY_SEASON_INVALID");
js/commentaryEngine.js-132-      const triggers=breakdown.triggers||{};
js/commentaryEngine.js-133-      out.result[role]={position,leaguePoints:ceCount(Number(result.leaguePoints),"COMMENTARY_SEASON_INVALID"),leagueGoals:ceCount(Number(result.leagueGoals),"COMMENTARY_SEASON_INVALID")};
js/commentaryEngine.js-134-      out.breakdown[role]={league:breakdown.leagueTitle>0,cl:breakdown.championsLeague>0,el:(breakdown.europaLeague||0)>0,cup:breakdown.domesticCup>0,
js/commentaryEngine.js-135-        performance:breakdown.performanceBonus>0,award:breakdown.individualAwardsBonus>0,
js/commentaryEngine.js-136-        hundredPoints:triggers.hundredLeaguePoints===true,hundredGoals:triggers.hundredLeagueGoals===true,topScorer:triggers.topScorer===true,topAssist:triggers.topAssist===true};
js/commentaryEngine.js-137-      out.points[role]=breakdown.total;
js/commentaryEngine.js:138:      out.primePack[role]=Number.isInteger(breakdown.primePack)&&breakdown.primePack>0;
js/commentaryEngine.js-139-      out.teamCount[role]=teams;
js/commentaryEngine.js-140-    }
js/commentaryEngine.js-141-    const a=out.points.playerOne,b=out.points.playerTwo;
js/commentaryEngine.js-142-    out.winner=a>b?"playerOne":b>a?"playerTwo":"draw";
js/commentaryEngine.js-143-    if(value.winner!==undefined&&value.winner!==out.winner)ceFail("COMMENTARY_SEASON_WINNER_MISMATCH");
js/commentaryEngine.js-144-    return out;

```
