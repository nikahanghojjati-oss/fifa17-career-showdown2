# Fable job 9: Prime Pack hunt (Career Mode Showdown 2.0.0)

Code snapshot: PR #1149, branch claude/r88-icon-unmasked @ 28f0adee0 (Prime Pack diffs are against gameplay/r87 @ 3057aa660), repo nikahanghojjati-oss/fifa17-career-showdown2. Prime Pack is a brand-new screen shipping in r87 (2.0.0) today. Below this brief you get the full source of the Prime Pack files, the Rules fragment that guards it, the service worker, and the PR's diff for every other code file it touches (career totals, validators, the step hook). You cannot run code here, so reason carefully, show the timing arithmetic, and quote code.

## The product
A private two-player FIFA 17 Career Mode competition web app (vanilla JS, Firebase Firestore on the free Spark plan with no Cloud Functions, GitHub Pages, a service worker). Two managers, Daniel (playerOne) and Nik (playerTwo), each on his own phone, play a "Showdown" of 1, 3, 5 or 10 seasons. Each season both phones walk through shared screens; the app scores the season and keeps a lifetime career.

## Prime Pack: the rules (the truth; the code must match)
- **When:** once per season, on both phones, right after Roster Roulette and before the Transfer Challenge window opens. Only Showdowns confirmed on or after the Prime Pack boundary (2026-10-30) get it; older Showdowns never load it and keep their old maximums.
- **The card:** a pack opens and one masked card of one random player rises (no flip). The player is drawn from the list in data/icons.js, seeded from the Showdown id, never the same player twice in one Showdown. The answer is never stored; both phones derive it.
- **Stages (one table, `STAGES` in js/iconGuess.js):**

  | Stage | Points | Shows | Timing |
  |---|---|---|---|
  | count-in | — | — | 3 s |
  | S1 | 4 | position + 1 real card stat | animates 2.5 s, then 25 s to guess |
  | S2 | 3 | + 1 more stat (2 shown) | animates 1.5 s, then 20 s |
  | S3 | 2 | + 1 more stat (3 shown) | animates 1.5 s, then 20 s |
  | S4 | 1 | + 1 more stat (4 shown); last chance | animates 1.5 s, then 20 s |
  | S5 | — | no guessing: reveals the last 2 stats, the name, the flag, the overall | — |

  Each stage shows its own timer. Stat values always come from the player's real card; only which stats show, and their order, is random. A right guess at any stage jumps straight to S5.
- **Guessing:** one guess box for Daniel and one for Nik, both always on screen. Each manager has 2 tokens for the whole round. A wrong guess spends a token; a manager with no tokens is out. Wrong guesses are never stored.
- **Name matching (`typoRule` in js/iconNames.js):** accents ignored. An exact name, full name or accepted name always wins. Otherwise 1 slip is allowed for 4-5 letters and 2 slips for 6+ letters; none for 3 or fewer; a guess needs at least 4 letters. The match must be unique and closest: a guess is refused (no token spent) if any other player is as close. A clean match to the wrong player is a wrong guess and spends a token.
- **Scoring:** the first right guess wins, ordered by server time. Exactly one manager scores 4, 3, 2 or 1 (the stage he guessed in), or nobody scores. **Never both. No tiebreak anywhere.** Nobody right by the end of S4 = nobody scores, then S5 reveals the card.
- **Totals:** a season is now max 15 (was 11). Golden Showdown is 150 in a 10-season Prime Pack Showdown (old Showdowns stay 110). A 150-150 is still a DRAW. Equal totals = DRAW; equal career points = LEVEL.
- **Kill switch:** `CMS_PRIME_PACK = "off"` skips Prime Pack.
- **Reus Gate:** a loading screen stays until the next screen is ready. No dimming, ever. Nothing covers anything. No flash of an old design.

## Trust model
Normal play only: two real phones, reloads mid-round, phone locks, app switching, offline/online, slow networks, clock skew between phones, one phone far behind the other, a fresh phone, cleared storage, two tabs, a service-worker update landing mid-Showdown. "Rules abuse" here means: can a normal app, through timing or retries, get a write accepted that breaks the rules above, or get a legitimate write refused? A deliberately modified app is out of scope, except where the Rules are the only guard on points (report those as P1 if a crafted write could give a manager points he did not win).

## Hunt these specifically
1. **Both-phones sync:** do both phones always show the same stage, timer, stats and result? Arrival order, the "later arrival" anchor, one phone arriving during another's S2, a phone arriving after the round is decided.
2. **Timing edges:** client STAGES vs the Rules stage edges (30.5 s, 52 s, 73.5 s after the later arrival; 97 s close; guesses allowed from 2 s). Work the arithmetic. Can a guess shown on screen as S2 (3 pts) be refused or scored as S3 by the Rules, or vice versa? Clock skew. A guess sent at 19.9 s of S4 that lands at the server after the close.
3. **Reload mid-round:** tokens, stage, timer and the answer after a reload or phone lock at every stage; a reload after a right guess; a reload during S5; Continue after a reload.
4. **Timeouts and stalls:** a write that never returns, a listener that never fires, a transaction retry, offline at the moment of guessing. Can the round hang, double-spend a token, lose a right guess, or score twice?
5. **Never both / first right wins:** two right guesses within milliseconds; transaction contention; `namedBy` races.
6. **Points into the season:** `primePack: N` on the private result, the Rules check of N against the stage of the winning write's server time, season cap 15, terminal-close cap, Golden 150 vs 110, old Showdowns at 11/110. Any total that can exceed 15 or under-count.
7. **Draw and matching:** the seeded draw (no repeat in 10 seasons, same on both phones, stable across reloads and app updates), `typoRule` holes (a guess accepted as the wrong player, a fair guess refused, accent and multi-word names).
8. **Screen:** the icon-guess page (visual-assets/v10_1/icon-guess/index.html): Reus Gate, no dimming, nothing covering the boxes or the card at phone width, timers, focus and keyboard on phones, the S5 reveal, "Prime Pack" wording everywhere a player can see.
9. **Service worker:** is anything Prime Pack needs missing from the cached shell, so a returning phone runs an old or half-cached copy? A version mismatch between the two phones.
10. **Reads:** listener and transaction reads per round; any read loop.

## Do not re-report
Card art (Team V is replacing the stand-in card). Layout outside Prime Pack. Anything in a pre-Prime-Pack Showdown other than its 11/110 totals.

## Your job
Work as the senior engineer who owns "Prime Pack is fair, synced and never stalls". Report each real bug. For each finding give:
- ID (F9-NN) and severity: P0 = wrong points, wrong winner, both scoring, a stuck round, or a refused legitimate guess a player sees; P1 = rare or edge; P2 = cosmetic;
- file:line, quoting the code;
- the exact steps or timeline (with seconds) that shows it;
- expected vs actual;
- the smallest fix as a unified diff.

Then list what you checked and found correct, area by area. Rank findings most severe first. Say "none found" where that is true.

Keep the visible reply under about 60,000 characters.


## FILE: js/iconGuess.js
```javascript
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
```javascript
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
      let record=null,ready=false,stop=null,timer=null,shownBeat=-2,finished=false,resultShown=false,sentChips={playerOne:null,playerTwo:null};
      const end=value=>{if(finished)return;finished=true;root.clearInterval(timer);root.removeEventListener("message",onMessage);try{stop&&stop();}catch(_error){}resolve(value);};
      const fail=error=>{root.CareerModeFirestoreBudget?.noteError?.(error);end(error||{code:"PRIME_PACK_FAILED"});};
      const render=()=>{
        if(!ready||!record||finished)return;
        let now;try{now=io.now();}catch(error){return fail(error);}
        const out=guess.outcome(record,now);if(!out)return;
        for(const role of ROLES){if(sentChips[role]!==out.chips[role]){sentChips[role]=out.chips[role];igsPost(frame,"cms-ig-chips",{role,count:out.chips[role]});}}
        if(out.state==="won"||out.state==="draw"){
          if(!resultShown){
            resultShown=true;back.hidden=true;
            const points=out.winner?guess.points(record)[out.winner]:0;
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
            record=next.record;
            if(!check.correct)igsPost(frame,"cms-ig-feedback",{kind:"wrong"});
            render();
          },error=>{root.CareerModeFirestoreBudget?.noteError?.(error);igsPost(frame,"cms-ig-feedback",{kind:/permission/.test(String(error&&error.code))?"late":"error"});});
        }else if(m.type==="cms-ig-continue"){
          if(resultShown)end("continue");
        }else if(m.type==="cms-ig-error"){
          // A page fault never decides the round: it is reported and the round carries on with the server's record.
          root.CareerModeFirestoreBudget?.noteError?.({code:"PRIME_PACK_PAGE",message:String(m.message||"")});
        }
      };
      back.addEventListener("click",()=>end("back"));
      root.addEventListener("message",onMessage);
      timer=root.setInterval(render,TICK_MS);
      root.setTimeout(()=>{if(!ready&&!finished)fail({code:"PRIME_PACK_PAGE_TIMEOUT"});},READY_WAIT_MS);
      Promise.resolve().then(async()=>{
        await igsArrive(io,ctx);
        if(finished)return;
        const unsubscribe=await igsWatch(io,ctx,onData,fail);
        if(finished){try{unsubscribe();}catch(_error){}return;}
        stop=unsubscribe;
      }).catch(fail);
    });
  }

  return Object.freeze({contractVersion:1,feature:"cms-prime-pack-step",page:PAGE,stageId:STAGE_ID,panelId:PANEL_ID,collection:COLLECTION,doneKey:DONE_KEY,
    applies:igsApplies,record:igsRecord,round:igsRound,suggestions:igsSuggestions,pointsFor:igsPointsFor,arrive:igsArrive,applyGuess:igsApplyGuess,run:igsRun,close:igsClose,wentHome:()=>wentHome,ensure:igsEnsure});
});

```


## FILE: js/iconNames.js
```javascript
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


## FILE: data/icons.js (EXCERPT: first 9000 bytes of 71877; the rest has the same row shape)
```javascript
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
...[excerpt ends]
```


## FILE: visual-assets/v10_1/icon-guess/index.html
```text
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<title>Prime Pack</title>
<!--
  R88 Prime Pack: STAND-IN page (workstream C). Team V's final card art replaces the card face later; the hooks stay.
  Spec: project-documents/r88-icon-guess/R88_ICON_GUESS_FEATURE_SPEC.md · Look: R88_ICON_CARD_TEAM_V_BRIEF.md.
  G Lead 2026-11-01 10:30 UTC: the pack (it says PRIME PACK) opens, the card RISES (no flip) and then reveals in the
  game's four stages (round.stages; Nik's rule, G Lead 11:08 UTC: the position + 1 stat, then one more stat each, so at most
  4 stats in play; the flag and the overall stay ?? in every stage). Stage 5 has no guessing: the result (a right guess at
  any stage jumps straight there, or nobody) turns up everything left: the last stats, the flag, the overall and the name.
  One guess box each, both always on
  screen; each manager types only in their own. G Lead 10:44 UTC (HO-051): Duet builds how the screen WORKS, Team V restyles
  it with the real Prime Pack art in its own PR. So the styling here is deliberately plain marble, with no drawn pack art,
  rays, glow, pieces or shake; the open and rise is a plain fade and slide on the stage clock.
  The name (G Lead 11:12): the #name plate is empty (no placeholder) in every stage, a reload included, and #nameValue in it
  is filled with the name only by the result (cms-ig-result: a right guess at any stage, or nobody after stage 4).
  The page never picks a player and never decides whether a guess is right. The game sends the round and the stages;
  the page shows them and sends typed text out. Wrong guesses are only ever shown on the phone that made them.
  No network: local fonts, no CDN, no EA assets, no photos. The flags and the silhouette are drawn in code.
  Restyling hooks for Team V (ids, logic never needs touching): #pack (#packWord, .pk-frame, .pk-crown, .pk-top, .pk-rule,
  .pk-17, #crack), #rays, #glow, #shards (empty, unstyled: the stand-in draws nothing in them), #card,
  #pos, #flag, #ovr, #stat-PAC..#stat-PHY (.tile.stat[data-stat]), #name (#nameValue), #beat (stage label),
  #ring (timer), #boxOne / #boxTwo (.gbox[data-role][data-me][data-out][data-won]), #chipsOne / #chipsTwo (.chip, .used),
  #guess, #go, #other (read-only box), #suggest, #note, #banner (result), #cta (Continue), #source.
  State to style on: [data-shown="1"] on a tile, .fresh on the parts the current stage just turned up, [hidden].
-->
<style>
@font-face { font-family: "Barlow Condensed"; font-weight: 600; font-display: swap; src: url("../shared/fonts/barlow-condensed-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Barlow Condensed"; font-weight: 700; font-display: swap; src: url("../shared/fonts/barlow-condensed-latin-700-normal.woff2") format("woff2"); }
:root {
  --ink: #07080a; --text: #f4f1ea; --text-2: #c9c0ab;
  --pearl-1: #fffdf6; --pearl-2: #f4ecd9; --pearl-3: #e6d7b5; --pearl-ink: #2a2110; --pearl-ink-2: #6b5a35;
  --foil-1: #fff6d2; --foil-2: #f1cf7a; --foil-3: #c4932f; --foil-4: #7d5a17;
  --daniel: #2c7399; --nik: #f0d900;
  --cond: "Barlow Condensed", "Arial Narrow", sans-serif; --body: "Barlow Condensed", system-ui, sans-serif; /* only the two condensed weights: r87 already serves them to framed pages offline */
  --reveal: 520ms; --ease: cubic-bezier(.22, 1, .36, 1);
  color-scheme: dark;
}
html.rm { --reveal: 220ms; }
html, body { height: 100%; margin: 0; }
body { background: radial-gradient(120% 70% at 50% 18%, #2a2416 0%, #12100b 46%, var(--ink) 100%); color: var(--text); font-family: var(--body);
  overflow: hidden; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; }
/* #app follows the visual viewport, so with the iPhone keyboard open everything sits above it (nothing behind the keyboard) */
#app { position: fixed; left: 0; right: 0; top: 0; height: 100%; display: flex; flex-direction: column;
  padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px calc(env(safe-area-inset-bottom, 0px) + 10px); box-sizing: border-box; gap: 7px; }
html.kb #app { padding-bottom: 8px; }
html.kb .packtitle { display: none; }
[hidden] { display: none !important; }

/* ---------- title and status line: which stage, its points, and that stage's guessing timer ---------- */
.packtitle { flex: none; margin: 0; text-align: center; font: 700 15px/1.1 var(--cond); letter-spacing: .34em; padding-left: .34em; text-transform: uppercase; color: var(--foil-1); }
.status { flex: none; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 34px; }
.beat { font: 700 17px/1 var(--cond); letter-spacing: .14em; text-transform: uppercase; color: var(--foil-1); white-space: nowrap; }
.beat.last { color: #ffd77a; }
.ring { width: 34px; height: 34px; position: relative; flex: none; }
.ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring circle { fill: none; stroke-width: 3.5; }
.ring .track { stroke: rgba(255,240,200,.18); }
.ring .left { stroke: var(--foil-2); stroke-linecap: round; }
.ring.low .left { stroke: #ff9a6a; }
.ring b { position: absolute; inset: 0; display: grid; place-items: center; font: 700 14px/1 var(--cond); color: var(--text); }
.pill { font: 700 15px/1 var(--cond); letter-spacing: .12em; text-transform: uppercase; color: var(--ink); padding: 7px 12px 6px; border-radius: 999px;
  background: linear-gradient(180deg, var(--foil-1), var(--foil-2) 55%, var(--foil-3)); }

/* ---------- the stage: the PRIME PACK, and the card that rises out of it (plain: Team V restyles both, HO-051) ---------- */
.stagewrap { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; position: relative; container-type: size; overflow: hidden; }
.pack { position: absolute; left: 50%; top: 50%; width: min(74cqw, 100cqh * 5 / 7 * .86, 300px); aspect-ratio: 5 / 7.2; z-index: 2; box-sizing: border-box;
  transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center; border-radius: 10px;
  background: linear-gradient(170deg, var(--pearl-1) 0%, var(--pearl-2) 46%, var(--pearl-3) 100%); border: 2px solid var(--foil-3); box-shadow: 0 10px 22px rgba(0,0,0,.5); }
.pack .pk-word { margin: 0; text-align: center; font: 700 44px/1 var(--cond); letter-spacing: .08em; color: var(--pearl-ink); }
.pack .pk-word span { display: block; font-size: 22px; letter-spacing: .5em; padding-left: .5em; color: var(--pearl-ink-2); }
.pack .pk-top, .pack .pk-17 { font: 700 13px/1 var(--cond); letter-spacing: .3em; padding-left: .3em; color: var(--pearl-ink-2); }
/* hooks Team V styles in HO-051; the stand-in leaves them empty and out of the layout */
.rays, .glow, .shards { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }
/* ---------- the card (stand-in white marble with gold veins and a gold foil edge; Team V replaces the face) ---------- */
.card { width: min(100cqw, 100cqh * 5 / 7, 380px); aspect-ratio: 5 / 7; position: relative; container-type: size; z-index: 1; opacity: 0; visibility: hidden; }
.card .foil, .card .face { position: absolute; inset: 0; clip-path: polygon(50% 0, 88% 3.5%, 100% 11%, 100% 89%, 88% 96.5%, 50% 100%, 12% 96.5%, 0 89%, 0 11%, 12% 3.5%); }
.card .foil { background: linear-gradient(135deg, var(--foil-1) 0%, var(--foil-2) 22%, var(--foil-4) 38%, var(--foil-2) 52%, var(--foil-1) 64%, var(--foil-3) 82%, var(--foil-1) 100%);
  filter: drop-shadow(0 10px 22px rgba(0,0,0,.55)); }
.card .face { inset: 2.2cqw; background:
  radial-gradient(90% 55% at 70% 30%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 60%),
  linear-gradient(32deg, rgba(255,255,255,0) 44%, rgba(150,136,112,.12) 46%, rgba(255,255,255,0) 48.5%),
  linear-gradient(151deg, rgba(255,255,255,0) 60%, rgba(196,147,47,.18) 61.6%, rgba(255,255,255,0) 63.4%),
  linear-gradient(74deg, rgba(255,255,255,0) 70%, rgba(150,136,112,.08) 71.5%, rgba(255,255,255,0) 73%),
  repeating-linear-gradient(118deg, rgba(196,147,47,.06) 0 2px, rgba(255,255,255,0) 2px 9px),
  linear-gradient(170deg, var(--pearl-1) 0%, var(--pearl-2) 46%, var(--pearl-3) 100%); overflow: hidden; }
.inner-line { position: absolute; inset: 1.4cqw; pointer-events: none; }
.inner-line svg { width: 100%; height: 100%; display: block; overflow: visible; }
.inner-line polygon { fill: none; stroke: rgba(196,147,47,.6); stroke-width: 1.2; vector-effect: non-scaling-stroke; }

.side { position: absolute; left: 9cqw; top: 11cqh; width: 20cqw; display: flex; flex-direction: column; align-items: center; gap: 1.6cqh; z-index: 2; }
.ovr { font: 700 17cqw/0.85 var(--cond); color: var(--pearl-ink); letter-spacing: -.02em; }
.pos { font: 700 8.5cqw/1 var(--cond); color: var(--pearl-ink); letter-spacing: .04em; }
.side .rule { width: 70%; height: .5cqw; background: linear-gradient(90deg, rgba(196,147,47,0), var(--foil-3), rgba(196,147,47,0)); }
.flagtile canvas { width: 100%; height: 100%; display: block; box-shadow: 0 0 0 .4cqw rgba(125,90,23,.55); }

.portrait { position: absolute; right: 4cqw; top: 6cqh; width: 66cqw; height: 50cqh; z-index: 1;
  -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 100%); mask-image: linear-gradient(180deg, #000 72%, transparent 100%); }
.portrait svg { width: 100%; height: 100%; display: block; }
.iconword { position: absolute; right: 9cqw; top: 9.5cqh; z-index: 2; font: 700 4.6cqw/1 var(--cond); letter-spacing: .42em; color: var(--foil-4);
  padding-left: .42em; border-top: .35cqw solid var(--foil-3); border-bottom: .35cqw solid var(--foil-3); padding-block: .5cqw .35cqw; }

.tile.nameplate { position: absolute; left: 8cqw; right: 8cqw; top: 57cqh; text-align: center; z-index: 2;
  font: 700 9.5cqw/1.05 var(--cond); letter-spacing: .06em; text-transform: uppercase; color: var(--pearl-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.underline { position: absolute; left: 14cqw; right: 14cqw; top: 66.4cqh; height: .5cqw; background: linear-gradient(90deg, rgba(196,147,47,0), var(--foil-3) 20%, var(--foil-3) 80%, rgba(196,147,47,0)); }

.stats { position: absolute; left: 12cqw; right: 12cqw; top: 69.5cqh; display: grid; grid-template-columns: 1fr 1fr; grid-auto-flow: column; grid-template-rows: repeat(3, 7.2cqh); column-gap: 7cqw; row-gap: .8cqh; z-index: 2; }
.stats .divider { position: absolute; left: 50%; top: 4%; bottom: 4%; width: .4cqw; background: linear-gradient(180deg, rgba(196,147,47,0), var(--foil-3), rgba(196,147,47,0)); }
/* a slot (and the overall, flag and name) shows "??" until its stage or the result; the value then rises into place. No flip. */
.tile { position: relative; }
.tile .b, .tile .f { position: absolute; inset: 0; display: flex; align-items: center; transition: transform var(--reveal) var(--ease), opacity var(--reveal) linear; }
.tile .f { opacity: 0; transform: translateY(40%) scale(.9); }
.tile[data-shown="1"] .b { opacity: 0; transform: translateY(-30%); }
.tile[data-shown="1"] .f { opacity: 1; transform: none; }
html.rm .tile .b, html.rm .tile .f { transform: none !important; }
.stat .b, .stat .f { gap: 2.4cqw; font: 700 7.4cqw/1 var(--cond); color: var(--pearl-ink); }
.stat .b { justify-content: flex-start; }
.stat .b i { font-style: normal; width: 11cqw; text-align: center; border-radius: .9cqw; padding: .6cqw 0 .3cqw; color: var(--foil-1);
  background: linear-gradient(180deg, #b48a32, #7d5a17); box-shadow: inset 0 .3cqw 0 rgba(255,246,210,.45); letter-spacing: .06em; }
.stat .b span, .stat .f span { color: var(--pearl-ink-2); font-size: 6.2cqw; letter-spacing: .05em; }
.stat .f em { font-style: normal; width: 11cqw; text-align: center; }
.stat.fresh .f em { color: #8a5d00; text-shadow: 0 0 2.4cqw rgba(241,207,122,.95); }
.big .b, .big .f { justify-content: center; }
.ovrtile { width: 20cqw; height: 15cqw; }
.ovrtile .b { font: 700 13cqw/1 var(--cond); color: var(--foil-3); }
.postile { width: 20cqw; height: 8.5cqw; }
.flagtile { width: 15cqw; height: 10cqw; }
.flagtile .b { justify-content: center; border-radius: .6cqw; background: linear-gradient(180deg, #b48a32, #7d5a17); color: var(--foil-1); font: 700 6cqw/1 var(--cond); }
.nametile { height: 11cqw; }
.nametile .b, .nametile .f { justify-content: center; }
.nametile .b { color: var(--foil-3); letter-spacing: .5em; padding-left: .5em; }
.flagtile.fresh .f canvas { box-shadow: 0 0 0 .4cqw rgba(125,90,23,.55), 0 0 4cqw rgba(241,207,122,.95); }
.ovrtile.fresh .f { text-shadow: 0 0 3cqw rgba(241,207,122,.95); }

.source { flex: none; text-align: center; font: 600 13px/1.2 var(--cond); letter-spacing: .2em; text-transform: uppercase; color: var(--foil-1); min-height: 16px; }

/* ---------- result banner (no dimming layer: it sits in the status line's place, never over the card or the boxes) ---------- */
.banner { flex: none; text-align: center; font: 700 clamp(24px, 7.4vw, 40px)/1 var(--cond); letter-spacing: .06em; text-transform: uppercase;
  background: linear-gradient(180deg, #fffdf2 0%, #fff0b8 30%, #f2c35a 50%, #a8731f 54%, #f3cf73 74%, #fff3c6 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 0 #2a1c05); animation: pop 600ms var(--ease) both; }
.banner.draw { background: none; color: var(--text); filter: none; }
html.rm .banner { animation: fade 220ms linear both; }
@keyframes pop { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

/* ---------- the two guess boxes: Daniel's and Nik's, both always on screen, each with its manager's 2 tokens ---------- */
.guessbar { flex: none; position: relative; display: flex; flex-direction: column; gap: 6px; }
.gbox { display: flex; align-items: center; gap: 8px; min-height: 48px; padding: 4px 8px 4px 10px; box-sizing: border-box; border-radius: 6px;
  background: rgba(21,19,14,.92); border: 1.5px solid rgba(241,207,122,.28); }
.gbox[data-me="1"] { border-color: rgba(241,207,122,.75); }
.gbox[data-won="1"] { border-color: var(--foil-2); box-shadow: 0 0 14px rgba(241,207,122,.45); }
.gbox .who { flex: none; width: 62px; display: flex; flex-direction: column; gap: 3px; font: 700 17px/1 var(--cond); letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; }
.gbox[data-role="playerOne"] .who { color: #8fc6e4; }
.gbox[data-role="playerTwo"] .who { color: var(--nik); }
.gbox .you { align-self: flex-start; font: 700 10px/1 var(--cond); letter-spacing: .14em; color: var(--ink); background: var(--foil-2); padding: 3px 5px 2px; border-radius: 2px; }
.gbox:not([data-me="1"]) .you { display: none; }
.gbox .slot { flex: 1; min-width: 0; display: flex; }
.mine { flex: 1; min-width: 0; }
.row { display: flex; gap: 6px; }
.row input { flex: 1; min-width: 0; height: 40px; box-sizing: border-box; border-radius: 4px; border: 1.5px solid rgba(241,207,122,.6); background: #0f0d09; color: var(--text);
  font: 600 19px/1 var(--body); letter-spacing: .02em; padding: 0 10px; outline: none; }
.row input:focus { border-color: var(--foil-2); box-shadow: 0 0 0 3px rgba(241,207,122,.22); }
.row input:disabled { opacity: .55; }
.ro { flex: 1; min-width: 0; height: 40px; box-sizing: border-box; display: flex; align-items: center; padding: 0 10px; border-radius: 4px;
  border: 1.5px dashed rgba(201,192,171,.35); color: var(--text-2); font: 600 17px/1 var(--body); letter-spacing: .03em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none; }
.gbox[data-out="1"] .ro { color: #ffb48a; border-style: solid; border-color: rgba(255,180,138,.4); }
.gbox[data-won="1"] .ro { color: var(--foil-1); }
.btn { height: 40px; padding: 0 14px; border: 0; border-radius: 4px; font: 700 17px/1 var(--cond); letter-spacing: .1em; text-transform: uppercase; color: var(--ink);
  background: linear-gradient(180deg, var(--foil-1), var(--foil-2) 55%, var(--foil-3)); box-shadow: inset 0 1px 0 #fff; cursor: pointer; }
.btn:disabled { background: #4a4232; color: #9c927b; box-shadow: none; cursor: default; }
.chips { flex: none; display: flex; gap: 5px; }
.chip { width: 18px; height: 18px; border-radius: 50%; box-sizing: border-box; transition: opacity 300ms, transform 300ms var(--ease);
  background: radial-gradient(circle at 35% 30%, var(--foil-1), var(--foil-2) 45%, var(--foil-3) 80%); box-shadow: 0 0 0 1.5px var(--foil-4), 0 2px 4px rgba(0,0,0,.5); }
.chip.used { opacity: .28; transform: scale(.82); background: transparent; box-shadow: inset 0 0 0 2px var(--foil-3); }
.suggest { position: absolute; left: 0; right: 0; bottom: calc(100% + 6px); margin: 0; padding: 4px; list-style: none; border-radius: 4px; background: #1b1810; z-index: 5;
  border: 1px solid rgba(241,207,122,.45); box-shadow: 0 -8px 20px rgba(0,0,0,.45); max-height: 40vh; overflow: auto; }
.suggest li { padding: 11px 10px; font: 600 19px/1.1 var(--body); letter-spacing: .02em; color: var(--text); border-radius: 3px; cursor: pointer; }
.suggest li[aria-selected="true"], .suggest li:hover { background: rgba(241,207,122,.16); }
.note { min-height: 18px; font: 600 16px/1.15 var(--body); letter-spacing: .03em; text-align: center; color: var(--text-2); }
.note.warn { color: #ffb48a; }
.cta { flex: none; width: 100%; height: 48px; font-size: 18px; }

/* the test clock freezes every CSS transition and animation, so a still is the end state of each moment */
html.still *, html.still *::before, html.still *::after { transition: none !important; animation: none !important; }
@media (prefers-reduced-motion: reduce) { .chip { transition: none; } }
</style>
</head>
<body>
<div id="app">
  <h1 class="packtitle" id="packTitle">Prime Pack</h1>
  <div class="status" id="status">
    <span class="pill" id="waiting" hidden></span>
    <span class="beat" id="beat"></span>
    <span class="ring" id="ring" hidden><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="track" cx="20" cy="20" r="17"/><circle class="left" id="ringLeft" cx="20" cy="20" r="17" stroke-dasharray="106.8" stroke-dashoffset="0"/></svg><b id="ringNum"></b></span>
  </div>
  <div class="banner" id="banner" hidden></div>

  <div class="stagewrap" id="stagewrap">
    <div class="rays" id="rays" aria-hidden="true"></div>
    <div class="glow" id="glow" aria-hidden="true"></div>
    <div class="pack" id="pack" aria-label="Prime Pack">
      <div class="pk-frame"></div>
      <div class="pk-crown"></div>
      <div class="pk-top">FIFA 17 SHOWDOWN</div>
      <p class="pk-word" id="packWord">PRIME<span>PACK</span></p>
      <div class="pk-rule"></div>
      <div class="pk-17">17</div>
      <div class="crack" id="crack"></div>
    </div>
    <div class="shards" id="shards" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="card" id="card" aria-label="Icon card">
      <div class="foil"></div>
      <div class="face">
        <div class="inner-line"><svg viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true"><polygon points="50,0 88,4.9 100,15.4 100,124.6 88,135.1 50,140 12,135.1 0,124.6 0,15.4 12,4.9"/></svg></div>
        <div class="portrait" id="portrait"></div>
        <div class="iconword">ICON</div>
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

  <div class="source" id="source"></div>

  <div class="guessbar" id="guessbar">
    <ul class="suggest" id="suggest" role="listbox" hidden></ul>
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
      <form class="row" id="form" autocomplete="off">
        <input id="guess" name="guess" type="text" inputmode="text" enterkeyhint="send" autocapitalize="words" autocorrect="off" spellcheck="false" placeholder="Who is he?" aria-label="Your guess" aria-controls="suggest" disabled>
        <button class="btn" id="go" type="submit" disabled>Guess</button>
      </form>
    </div>
    <!-- the other manager's box: read only, it shows their tokens and whether they are out, never what they typed -->
    <div class="ro" id="other" aria-live="polite"></div>
    <div class="note" id="note" aria-live="polite"></div>
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
  $("guess").value=""; setSuggestions([]); note("");
  still(()=>render());
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
  if(!S.round || S.result) return;
  S.result = ROLES.includes(winner) ? winner : "draw"; S.pending=false;
  S.points = S.result==="draw" ? 0 : clamp(Math.floor(Number(points)) || stagePoints(Math.max(0,S.beat)), 1, 4);
  S.nameAt = now() + NAME_AFTER_MS;
  $("nameValue").textContent=S.round.name;                          // guessing has ended: the only place the name is written
  const b=$("banner"); b.hidden=false;
  if(S.result==="draw"){ b.textContent="Nobody got him · 0 points"; b.classList.add("draw"); }
  else { b.textContent=`${S.names[S.result]} +${S.points} Showdown point${S.points===1?"":"s"}`; b.classList.remove("draw"); }
  b.dataset.winner=S.result;
  $("boxOne").dataset.won = S.result==="playerOne" ? "1" : "0"; $("boxTwo").dataset.won = S.result==="playerTwo" ? "1" : "0";
  $("source").textContent = S.round.source || "";
  $("guess").blur(); $("guess").value=""; setSuggestions([]); note("");
  const cta=$("cta"); cta.hidden=false; cta.disabled=false; cta.textContent="Continue";
  render();
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
}
if(window.visualViewport){ visualViewport.addEventListener("resize",fitViewport); visualViewport.addEventListener("scroll",fitViewport); fitViewport(); }

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
  if(!pack.hidden){
    pack.style.opacity = String(1-out);
    pack.style.transform = REDUCED ? "translate(-50%, -50%)" : `translate(-50%, ${(-50-12*out).toFixed(2)}%)`;
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
```text
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
    // then one guess at a time (his own chip count +1, at most 2, and namedBy set to himself when right), only while
    // the round runs: the stages start 3 s after the later arrival and last 9.5 s each (1.5 s reveal + the 8 s guess window,
    // js/iconGuess.js), so guesses count from 2 s to 43 s after the later arrival (1 s and 2 s of slack for the network).
    // Whether a guess is right is decided on the guessing phone (the answer is not stored, so it is never readable early);
    // the Rules bind the order: namedBy is set once, never changed, the other manager's facts never touched, and the record's
    // updatedAt is the winning write's server time (no write is allowed after it). A season result may carry primePack:N only
    // for the manager this record names, with N the points of the stage that server time falls in: 4 before 12.5 s after the
    // later arrival, 3 before 22 s, 2 before 31.5 s, then 1 (ssjrPackPoints). Changing the guess window means changing these.
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
        && (ssjrPackArrive(before, after, role) || ssjrPackGuess(before, after, role));
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


## FILE: service-worker.js
```javascript
const RUNTIME_REVISION = "1.9.10-r86";
const PREVIOUS_RUNTIME_REVISION = "1.9.9-r85";
const CACHE_PREFIX = "career-mode-showdown-shell-";
const MODE_CACHE_PREFIX = "career-mode-showdown-runtime-mode-";
const CACHE_NAME = `${CACHE_PREFIX}${RUNTIME_REVISION}`;
const PREVIOUS_CACHE_NAME = PREVIOUS_RUNTIME_REVISION ? `${CACHE_PREFIX}${PREVIOUS_RUNTIME_REVISION}` : "";
const MODE_CACHE_NAME = `${MODE_CACHE_PREFIX}${RUNTIME_REVISION}`;
// JOB-24: Team V images are not precached on install (about 20 MB in all). They load on first view into
// this cache-first runtime cache, keyed by RUNTIME_REVISION. Activate keeps it and the retained recovery
// revision's image cache (for rollback) and clears the others.
const V10_IMAGE_CACHE_PREFIX = "career-mode-showdown-v10-images-";
const V10_IMAGE_CACHE_NAME = `${V10_IMAGE_CACHE_PREFIX}${RUNTIME_REVISION}`;
function v10ImageCacheName(revision){ return revision ? `${V10_IMAGE_CACHE_PREFIX}${revision}` : ""; }
// r87: the Russian Roster Roulette sounds (visual-assets/v10_1/roulette/assets/sfx/*.wav, 1.8 MB) follow the same cache-first
// runtime rule as Team V's images instead of the install precache.
const V10_IMAGE_PATH = /^visual-assets\/v10_1\/.+\.(?:webp|png|jpe?g|avif|gif|svg|wav)$/i;
const NETWORK_PROBE_TIMEOUT_MS = 1800;
const RUNTIME_CONFIG_PATH = "firebase.runtime-config.json";
const APP_CHECK_BOOTSTRAP_PATH = "js/productionAppCheckBootstrap.js";
const NETWORK_ONLY_NAVIGATION_PATHS = new Set([
    "production-authorization-acceptance.html"
]);
// r86: the Special Player page is its own document in a frame (js/specialPlayerReveal.js). A frame load is a navigation:
// it gets that page from the shell the app runs (then the network), never the shell's index.html. Its images follow the
// Team V cache-first image rule.
const SHELL_FRAME_NAVIGATION_PATHS = new Set([
    "visual-assets/v10_1/special-player/index.html",
    "visual-assets/v10_1/roulette/index.html",
    // r87 Prime Pack: its page in the #igStage frame (js/iconGuessStep.js), same rule.
    "visual-assets/v10_1/icon-guess/index.html"
]);
// Precached shell files that a stylesheet asks for by a relative url(), so the request has no ?v=: css/r78-marble-surfaces.css
// draws its panels with url("r78-marble-tile.webp"). They come from the shell the page runs (the precached copy), then the network.
// r87: the Roulette page in its frame asks for its 3D library and data the same way (no ?v=), so offline it still gets the
// precached copies of the shell it runs (red team R87-B-03).
const UNVERSIONED_SHELL_ASSET_PATHS = new Set([
    "css/r78-marble-tile.webp",
    "visual-assets/v10_1/roulette/vendor/three-r128.min.js",
    "visual-assets/v10_1/roulette/platemap.json",
    "visual-assets/v10_1/roulette/assets/squads.json",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-800-normal.woff2",
    // r87: the rest of the local faces, so the offline and error screens keep the brush title and body type offline
    "visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2"
]);
const NETWORK_ONLY_ASSET_PATHS = new Set([
    "js/productionAuthorizationAcceptance.js",
    "js/productionProviderAbuseAcceptance.js"
]);

const SHELL_PATHS = Object.freeze([
    "index.html",
    "manifest.webmanifest",
    "css/app.css",
    "assets/fonts/barlow-condensed.css",
    "assets/fonts/barlow-condensed-vietnamese-600-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-700-normal.woff2",
    "assets/fonts/barlow-condensed-vietnamese-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-ext-800-normal.woff2",
    "assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "assets/fonts/barlow-condensed-latin-800-normal.woff2",
    "css/visual-fidelity-r3.css",
    "css/offline.css",
    "css/remoteJoining.css",
    "css/analytics.css",
    "css/footballVisuals.css",
    "css/footballVisuals-v113.css",
    "css/legacy.css",
    "css/restore.css",
    "css/rulebook.css",
    "css/saveLibrary.css",
    "css/season.css",
    "css/settings.css",
    "css/transfer.css",
    "data/clubs.js",
    "data/footballVisuals.js",
    "data/leagues.js",
    "data/transferOptions.js",
    "js/analytics.js",
    "js/careerScreenSeam.js",
    "js/careerScreensV10.js",
  "visual-assets/v10_1/legacy/legacy.css",
  "visual-assets/v10_1/legacy/legacy.js",
  "visual-assets/v10_1/legacy/strings.json",
  "visual-assets/v10_1/legacy/assets/platemap.json",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.css",
  "visual-assets/v10_1/rivalry-statistics/rivalry-statistics.js",
  "visual-assets/v10_1/rivalry-statistics/strings.json",
  "visual-assets/v10_1/rivalry-statistics/assets/platemap.json",
  "js/rivalryLegacyV10.js",
  "js/rivalryLegacyV10Markup.js",
  "js/sharedCareerAnalytics.js",
  "js/sharedActiveShowdownAdapter.js",
  "js/sharedClosedShowdownAdapter.js",
  "js/sparkCompletedShowdownReader.js",
  "js/sparkClosedShowdownCareerLoader.js",
  "js/careerSummaryStore.js",
  "js/specialPlayerReveal.js",
  "visual-assets/v10_1/special-player/index.html",
  "js/marqueePlayer.js",
  "data/marqueePlayers.js",
  "js/deadlineDay.js",
  "data/deadlineDayLines.js",
  "js/rosterRouletteStep.js",
  "js/rosterRoulette.js",
  "data/rosterSquads.js",
  "data/fifa17Players.js",
  "css/v10Roulette.css",
  "visual-assets/v10_1/roulette/index.html",
  "visual-assets/v10_1/roulette/platemap.json",
  "visual-assets/v10_1/roulette/vendor/three-r128.min.js",
  "visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt",
  "visual-assets/v10_1/roulette/assets/squads.json",
  "js/touchlineGazette.js",
  "js/commentaryV3.js",
  "js/commentaryEngine.js",
  "data/commentaryLines.js",
  "data/gazetteCopy.js",
  "data/frontPages.js",
  "css/v10Gazette.css",
  "visual-assets/v10_1/content/content.css",
  "visual-assets/v10_1/content/frontpage.js",
  "visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2",
  "visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2",
  "visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt",
  "visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt",
  "visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt",
  "js/iconGuessStep.js",
  "js/iconGuess.js",
  "js/iconNames.js",
  "data/icons.js",
  "visual-assets/v10_1/icon-guess/index.html",
  "js/specialPlayerChip.js",
  "js/careerStartMarker.js",
  "css/rivalryLegacyV10.css",
    "js/app.js",
    "js/backup.js",
    "js/clubAssignment.js",
    "js/dataEngine.js",
    "js/diagnostics.js",
    "js/footballVisuals.js",
    "js/importAnalysis.js",
    "js/leagueWheel.js",
    "js/legacy.js",
    "js/menuExperience.js",
    "js/menuFeedback.js",
    "js/offlineApp.js",
    "js/optionalModules.js",
    "js/onlinePlayerIdentity.js",
    "js/persistentNikDanielPair.js",
    "js/whichShowdownIsLive.js",
    "js/showdownModes.js",
    "js/productionFirebaseRuntime.js",
    "js/fullMotionHonor.js",
    "js/ssjr.js",
    "js/ssjrProductionAcceptanceRecorder.js",
    "js/ssjrProductionNegativeProbeRunner.js",
    "js/ssjrProductionNegativeEvidence.js",
    "js/stage5fProductionAuthenticatedNegatives.js",
    "js/ssjrAcceptancePolishedBridge.js",
    "js/ssjrPhysicalJourneyAcceptance.js",
    "js/productionSharedJourneyEntry.js",
    "js/productionSharedJourneyGuard.js",
    "js/productionSharedShowdownPresentation.js",
    "js/productionSharedShowdownSetup.js",
    "js/sharedShowdownSetup.js",
    "js/sharedShowdownCatalog.js",
    "js/sparkSharedShowdownSetup.js",
    "js/sharedCareerStart.js",
    "js/sparkSharedCareerStart.js",
    "js/productionSharedCareerStart.js",
    "js/sharedTransferChallenge.js",
    "js/sparkSharedTransferChallenge.js",
    "js/productionSharedTransferChallenge.js",
    "js/sharedSeasonResults.js",
    "js/sparkSharedSeasonResults.js",
    "js/productionSharedSeasonResults.js",
    "js/productionSharedSeasonResultsRoute.js",
    "js/sharedSeasonCommit.js",
    "js/sparkSharedSeasonCommit.js",
    "js/productionSharedSeasonCommit.js",
    "js/sharedCanonicalScoring.js",
    "js/sparkSharedCanonicalScoring.js",
    "js/productionSharedCanonicalScoring.js",
    "js/sharedHistoryConvergence.js",
    "js/sparkSharedHistoryConvergence.js",
    "js/productionSharedHistoryConvergence.js",
    "js/sharedMultiSeasonProgression.js",
    "js/sparkSharedMultiSeasonProgression.js",
    "js/productionSharedMultiSeasonProgression.js",
    "js/sharedJourneyReconnect.js",
    "js/productionSharedJourneyReconnect.js",
    "js/sharedJourneyConflicts.js",
    "js/productionSharedJourneyConflicts.js",
    "js/sharedLocalReconciliation.js",
    "js/productionSharedLocalReconciliation.js",
    "js/sharedFinalReconciliation.js",
    "js/productionSharedFinalReconciliation.js",
    "js/sharedTerminalClose.js",
    "js/sparkTerminalClose.js",
    "js/productionSharedTerminalClose.js",
    "js/remoteJoiningAcceptance.js",
    "js/sparkRemoteJoining.js",
    "js/sparkAccountBootstrap.js",
    "js/sparkConnectedAccount.js",
    "js/sparkPrivatePairing.js",
    "js/sparkConnectedRivalry.js",
    "js/sparkPrivateSession.js",
    "js/sparkStandardAuthPrivateSession.js",
    "js/restore.js",
    "js/restoreUI.js",
    "js/ruleBook.js",
    "js/saveLibraryCutover.js",
    "js/saveLibraryFoundation.js",
    "js/saveLibraryPersistence.js",
    "js/saveLibraryRuntime.js",
    "js/saveLibraryUI.js",
    "js/scoring.js",
    "js/screens.js",
    "js/seasonEngine.js",
    "js/settings.js",
    "js/showdown.js",
    "js/showdownUI.js",
    "js/statistics.js",
    "js/storage.js",
    "js/storageTransaction.js",
    "js/transferChallenge.js",
    "js/transferSelector.js",
    "js/trophyRoom.js",
    "js/visualIdentity.js",
    "assets/marco-reus-2015-cc-by.webp",
    "assets/LOADING_REUS_DESKTOP.webp",
    "assets/LOADING_REUS_PHONE.webp",
    "assets/football/anthony-martial-cska-2017-v113.webp",
    "assets/football/antoine-griezmann-atletico-2016-v113.webp",
    "assets/football/cristiano-ronaldo-euro-2016-v113.webp",
    "assets/football/james-rodriguez-world-cup-2014-v113.webp",
    "assets/football/lionel-messi-barcelona-2016-subject-r4.webp",
    "assets/football/marcus-rashford-chelsea-2017-v113.webp",
    "assets/football/mario-balotelli-euro-2012-celebration-v113.webp",
    "assets/football/neymar-brazil-olympic-gold-2016-v113.webp",
    "assets/football/paul-pogba-man-utd-2016-v113.webp",
    "assets/football/philipp-lahm-world-cup-2014-focus-r4.webp",
    "assets/football/radamel-falcao-europa-league-2012-v113.webp",
    "assets/football/zlatan-ibrahimovic-man-utd-2016-v113.webp",
    "assets/icons/showdown-192.svg",
    "assets/icons/showdown-512.svg",
    "assets/icons/showdown-maskable-512.svg",
    "visual-assets/v10_1/career-statistics/assets/platemap.json",
    "visual-assets/v10_1/career-statistics/career-statistics.css",
    "visual-assets/v10_1/career-statistics/career-statistics.js",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-condensed-latin-700-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/fonts/barlow-latin-600-normal.woff2",
    "visual-assets/v10_1/shared/fonts/kaushan-script-latin-400-normal.woff2",
    "visual-assets/v10_1/shared/motion.css",
    "visual-assets/v10_1/shared/motion.js",
    "visual-assets/v10_1/shared/showdown-tokens.css",
    "visual-assets/v10_1/shared/showdown-type.css",
    "visual-assets/v10_1/shared/showdown-ui.css",
    "visual-assets/v10_1/shared/stage.css",
    "visual-assets/v10_1/shared/stage.js",
    "visual-assets/v10_1/trophy-room/assets/platemap.json",
    "visual-assets/v10_1/trophy-room/trophy-room.css",
    "visual-assets/v10_1/trophy-room/trophy-room.js",
    "visual-assets/v10_1/season-results/season-results.css",
    "visual-assets/v10_1/season-results/season-results.js",
    "visual-assets/v10_1/season-results/app-shell.html",
    "visual-assets/v10_1/final-winner/final-winner.css",
    "visual-assets/v10_1/final-winner/final-winner.js",
    "visual-assets/v10_1/final-winner/app-shell.html",
    "visual-assets/v10_1/standings/standings.css",
    "visual-assets/v10_1/standings/standings.js",
    "visual-assets/v10_1/standings/app-shell.html",
    "visual-assets/v10_1/final-winner/app-strings.json",
    "visual-assets/v10_1/standings/app-strings.json",
    "js/seasonFinalV10.js",
    "visual-assets/v10_1/season-results/app.css",
    "js/v10Screens.js",
    "js/homeScreensV10.js",
    "visual-assets/v10_1/home/home.css",
    "visual-assets/v10_1/home/soundtrack.js",
    "js/musicDockV10.js",
    "css/homeV10.css",
    "js/rulesSettingsV10.js",
    "css/rulesSettingsV10.css",
    "visual-assets/v10_1/rule-book/rule-book.css",
    "visual-assets/v10_1/settings/settings.css",
    "js/startJoinViewModel.js",
    "css/v10Shell.css",
    "css/r78-type.css",
    "css/r78-marble-surfaces.css",
    "css/r78-marble-tile.webp",
    "js/showdownConfirm.js",
    "visual-assets/v10_1/shared/navbar/navbar.css",
    "visual-assets/v10_1/shared/navbar/navbar.js",
    "js/v10Setup.js",
    "css/v10Setup.css",
    "js/connectPlayersScreenV10.js",
    "css/connectPlayersV10.css",
    "js/transferScreenV10.js",
    "css/v10Transfer.css",
    "visual-assets/v10_1/tr2/slice-02-plate/plate.css",
    "visual-assets/v10_1/tr2/slice-02-plate/plate.js",
    "visual-assets/v10_1/tr2/slice-02-plate/platemap.json",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-condensed-latin-600-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-condensed-latin-700-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-latin-400-normal.woff2",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/barlow-latin-600-normal.woff2",
    "js/clubScreenV10.js",
    "css/v10Club.css",
    "visual-assets/v10_1/club/club.css",
    "visual-assets/v10_1/club/club.js",
    "visual-assets/v10_1/club/assets/platemap.json",
    "visual-assets/v10_1/club/assets/handmap.json",
    "visual-assets/v10_1/tr2/slice-02-plate/assets/fonts/kaushan-script-latin-400-normal.woff2"
]);
const SHELL_PATH_SET = new Set(SHELL_PATHS);
// The retained previous shell was installed by its own worker with its own list, so it is verified against that list, not
// this one: checked against SHELL_PATHS it would lack this release's new files, fail, and be deleted on activation, leaving
// nothing to roll back to. Each release lists here the shell paths it added since PREVIOUS_RUNTIME_REVISION (and empties
// the set when it changes PREVIOUS_RUNTIME_REVISION again). r80 adds no shell path to r79's 221 paths and removes none.
// r86: PREVIOUS is now r85, whose own list already holds the music player; these are the six files r86 adds to its 222.
// r87 (until its own release moves PREVIOUS to r86): r86's six, plus the Deadline Day strip and lines and the Russian Roster
// Roulette step, engine, squads, styles and Team V's page with its vendored three.js.
// r87 Touchline Gazette (Nik 2026-10-31): its page script, copy, headline pack, styles, Team V's paper and sheet and the
// seven OFL Gazette fonts (licences beside them). Its press photos are Team V images (V10_IMAGE_PATH, runtime cache).
// r87 first load: Google Fonts' Barlow Condensed sheet and its nine files, now served from this site.
// r87 Prime Pack: its step, round engine, name matcher, Icon list and page.
const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["js/careerSummaryStore.js","js/specialPlayerReveal.js","visual-assets/v10_1/special-player/index.html","js/marqueePlayer.js","data/marqueePlayers.js","js/specialPlayerChip.js","js/rosterRouletteStep.js","js/rosterRoulette.js","data/rosterSquads.js","css/v10Roulette.css","visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/roulette/platemap.json","visual-assets/v10_1/roulette/vendor/three-r128.min.js","visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt","visual-assets/v10_1/roulette/assets/squads.json","js/deadlineDay.js","data/deadlineDayLines.js","data/fifa17Players.js","js/touchlineGazette.js","data/gazetteCopy.js","data/frontPages.js","css/v10Gazette.css","visual-assets/v10_1/content/content.css","visual-assets/v10_1/content/frontpage.js","visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt","js/commentaryV3.js","js/commentaryEngine.js","data/commentaryLines.js","assets/fonts/barlow-condensed.css","assets/fonts/barlow-condensed-vietnamese-600-normal.woff2","assets/fonts/barlow-condensed-vietnamese-700-normal.woff2","assets/fonts/barlow-condensed-vietnamese-800-normal.woff2","assets/fonts/barlow-condensed-latin-ext-600-normal.woff2","assets/fonts/barlow-condensed-latin-ext-700-normal.woff2","assets/fonts/barlow-condensed-latin-ext-800-normal.woff2","assets/fonts/barlow-condensed-latin-600-normal.woff2","assets/fonts/barlow-condensed-latin-700-normal.woff2","assets/fonts/barlow-condensed-latin-800-normal.woff2","js/iconGuessStep.js","js/iconGuess.js","js/iconNames.js","data/icons.js","visual-assets/v10_1/icon-guess/index.html"]);
const PREVIOUS_SHELL_PATHS = Object.freeze(SHELL_PATHS.filter(path=>!SHELL_PATHS_ADDED_SINCE_PREVIOUS.has(path)));
function shellPathsForRevision(revision){ return revision&&revision!==RUNTIME_REVISION&&revision===PREVIOUS_RUNTIME_REVISION?PREVIOUS_SHELL_PATHS:SHELL_PATHS; }

function scopeUrl(path = ""){
    return new URL(path, self.registration.scope);
}
function versionedShellUrl(path, revision = RUNTIME_REVISION){
    const url = scopeUrl(path); url.searchParams.set("v", revision); return url.href;
}
function networkOnlyRequest(request){ return new Request(request,{cache:"reload"}); }
function cacheNameForRevision(revision){ return revision ? `${CACHE_PREFIX}${revision}` : ""; }
function revisionFromCacheName(cacheName){ return cacheName&&cacheName.startsWith(CACHE_PREFIX)?cacheName.slice(CACHE_PREFIX.length):""; }
function compareRuntimeRevisions(a,b){
    const parse=value=>{const match=/^(\d+)\.(\d+)\.(\d+)-r(\d+)$/.exec(value||"");return match?match.slice(1).map(Number):null;};
    const left=parse(a),right=parse(b); if(!left&&!right)return 0;if(!left)return-1;if(!right)return 1;
    for(let index=0;index<left.length;index+=1){if(left[index]!==right[index])return left[index]-right[index];}return 0;
}
async function verifyRetainedRuntime(revision){
    if(!revision)return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
    if(revision===RUNTIME_REVISION||revision===PREVIOUS_RUNTIME_REVISION)return verifyCache(revision);
    const cacheName=cacheNameForRevision(revision); if(!(await cacheExists(cacheName)))return {ok:false,available:false,cacheName,revision,expected:0,missing:["index.html"]};
    const cache=await caches.open(cacheName); const index=await cache.match(versionedShellUrl("index.html",revision));
    return {ok:Boolean(index&&index.ok),available:true,cacheName,revision,expected:null,missing:index&&index.ok?[]:["index.html"]};
}
async function findRecoveryRuntime(){
    const names=(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME);
    const revisions=names.map(revisionFromCacheName).filter(Boolean).sort((a,b)=>compareRuntimeRevisions(b,a));
    if(PREVIOUS_RUNTIME_REVISION){
        const preferred=await verifyRetainedRuntime(PREVIOUS_RUNTIME_REVISION); if(preferred.ok)return preferred;
    }
    for(const revision of revisions){
        if(revision===PREVIOUS_RUNTIME_REVISION)continue;
        const candidate=await verifyRetainedRuntime(revision); if(candidate.ok)return candidate;
    }
    return {ok:false,available:false,cacheName:"",revision:"",expected:0,missing:[]};
}
function requestForShellPath(path){ return new Request(versionedShellUrl(path), { cache: "reload", credentials:"same-origin" }); }
function relativeScopePath(url){
    const scope = scopeUrl();
    if(url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)){ return ""; }
    return url.pathname.slice(scope.pathname.length).replace(/^\/+/, "") || "index.html";
}
async function cacheExists(cacheName){ if(!cacheName){ return false; } return (await caches.keys()).includes(cacheName); }
async function verifyCache(revision = RUNTIME_REVISION){
    const cacheName = cacheNameForRevision(revision); const paths=shellPathsForRevision(revision);
    if(!revision || !(await cacheExists(cacheName))){ return { ok:false, available:false, cacheName, revision, expected:paths.length, missing:paths.slice() }; }
    const cache=await caches.open(cacheName); const missing=[];
    for(const path of paths){ const response=await cache.match(versionedShellUrl(path,revision)); if(!response||!response.ok){ missing.push(path); } }
    return { ok:missing.length===0, available:true, cacheName, revision,expected:paths.length, missing };
}
async function populateCurrentCache(){
    const cache=await caches.open(CACHE_NAME);
    try{ await cache.addAll(SHELL_PATHS.map(requestForShellPath)); const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){ throw new Error(`Application shell cache is incomplete: ${status.missing.join(", ")}`); } return status; }
    catch(error){ await caches.delete(CACHE_NAME); throw error; }
}
async function readForcedRevision(){
    if(!(await cacheExists(MODE_CACHE_NAME))){ return ""; }
    const cache=await caches.open(MODE_CACHE_NAME); const response=await cache.match(scopeUrl("__cms_runtime_mode__").href); if(!response){ return ""; }
    try{return(await response.text()).trim();}catch(error){return"";}
}
async function writeForcedRevision(revision){ const cache=await caches.open(MODE_CACHE_NAME); await cache.put(scopeUrl("__cms_runtime_mode__").href,new Response(String(revision||""),{headers:{"content-type":"text/plain; charset=utf-8"}})); }
async function clearForcedRevision(){ await caches.delete(MODE_CACHE_NAME); }
async function chooseNavigationRuntime(){
    const forcedRevision=await readForcedRevision();
    if(forcedRevision){ const forcedStatus=await verifyRetainedRuntime(forcedRevision); if(forcedStatus.ok){return forcedStatus;} await clearForcedRevision(); }
    const currentStatus=await verifyCache(RUNTIME_REVISION); if(currentStatus.ok){return currentStatus;}
    const recovery=await findRecoveryRuntime(); if(recovery.ok)return recovery;
    return null;
}
async function getStatusBundle(){ const current=await verifyCache(RUNTIME_REVISION); const previous=PREVIOUS_RUNTIME_REVISION?await verifyCache(PREVIOUS_RUNTIME_REVISION):{ok:false,available:false,cacheName:"",revision:"",expected:SHELL_PATHS.length,missing:SHELL_PATHS.slice()}; const recovery=await findRecoveryRuntime(); return{current,previous,recovery,forcedRevision:await readForcedRevision(),cacheNames:await caches.keys()}; }
async function probeNetwork(){
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),NETWORK_PROBE_TIMEOUT_MS); const url=scopeUrl("service-worker.js"); url.searchParams.set("network-probe",`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try{ const response=await fetch(new Request(url.href,{cache:"no-store",credentials:"same-origin",signal:controller.signal})); return{online:response.ok,status:response.status}; }
    catch(error){ return{online:false,status:0,error:error?.name||error?.message||String(error)}; }
    finally{ clearTimeout(timeout); }
}
function replyToClient(event,payload){ const port=event.ports&&event.ports[0]; if(port){port.postMessage(payload);} }
self.addEventListener("install",event=>{ event.waitUntil(populateCurrentCache()); });
self.addEventListener("message",event=>{
    const type=event.data&&event.data.type;
    if(type==="CMS_PROBE_NETWORK"){ event.waitUntil((async()=>{ const status=await probeNetwork(); replyToClient(event,{type:"CMS_NETWORK_STATUS",ok:true,...status}); })()); return; }
    if(type==="CMS_GET_CACHE_STATUS"){ event.waitUntil((async()=>{ try{ const status=await getStatusBundle(); replyToClient(event,{type:"CMS_CACHE_STATUS",ok:status.current.ok,revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,...status}); }catch(error){ replyToClient(event,{type:"CMS_CACHE_STATUS",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_ACTIVATE_UPDATE"){ event.waitUntil((async()=>{ try{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){ replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,missing:status.missing}); return; } await self.skipWaiting(); replyToClient(event,{type:"CMS_ACTIVATION_ACCEPTED",ok:true,revision:RUNTIME_REVISION}); }catch(error){ replyToClient(event,{type:"CMS_ACTIVATION_REJECTED",ok:false,revision:RUNTIME_REVISION,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_ROLLBACK_TO_PREVIOUS"){ event.waitUntil((async()=>{ try{ const recovery=await findRecoveryRuntime(); if(!recovery.ok){throw new Error("No verified previous application shell is available for rollback.");} await writeForcedRevision(recovery.revision); replyToClient(event,{type:"CMS_ROLLBACK_ACCEPTED",ok:true,revision:recovery.revision}); }catch(error){ replyToClient(event,{type:"CMS_ROLLBACK_REJECTED",ok:false,error:error?.message||String(error)}); } })()); return; }
    if(type==="CMS_CLEAR_ROLLBACK"){ event.waitUntil((async()=>{ await clearForcedRevision(); replyToClient(event,{type:"CMS_ROLLBACK_CLEARED",ok:true,revision:RUNTIME_REVISION}); })()); }
});
self.addEventListener("activate",event=>{ event.waitUntil((async()=>{ const status=await verifyCache(RUNTIME_REVISION); if(!status.ok){throw new Error(`Refusing activation with incomplete application shell: ${status.missing.join(", ")}`);} await clearForcedRevision(); const recovery=await findRecoveryRuntime(); const keepShellCaches=new Set([CACHE_NAME,recovery.ok?recovery.cacheName:""] .filter(Boolean)); const keepImageCaches=new Set([V10_IMAGE_CACHE_NAME,recovery.ok?v10ImageCacheName(recovery.revision):""].filter(Boolean)); const cacheNames=await caches.keys(); await Promise.all(cacheNames.map(name=>{if(name.startsWith(CACHE_PREFIX)&&!keepShellCaches.has(name)){return caches.delete(name);}if(name.startsWith(MODE_CACHE_PREFIX)&&name!==MODE_CACHE_NAME){return caches.delete(name);}if(name.startsWith(V10_IMAGE_CACHE_PREFIX)&&!keepImageCaches.has(name)){return caches.delete(name);}return Promise.resolve(false);})); await self.clients.claim(); })()); });
async function cachedShellResponse(path,revision){ const cacheName=cacheNameForRevision(revision); if(!cacheName||!(await cacheExists(cacheName))){return null;} const cache=await caches.open(cacheName); return cache.match(versionedShellUrl(path,revision)); }
function isV10ImagePath(path){ return V10_IMAGE_PATH.test(path); }
// Images follow the shell the page runs: after a rollback they come from the retained revision's own image cache
// (or its shell cache, for revisions that precached them), so an offline rollback keeps the art it had viewed. A miss is
// fetched by path: each Team V image path names one generation (_V<n> name, bytes pinned by v10-foundation F9c).
async function v10ImageRevision(){ const forced=await readForcedRevision(); return forced&&forced!==RUNTIME_REVISION&&await cacheExists(cacheNameForRevision(forced))?forced:RUNTIME_REVISION; }
async function v10ImageResponse(event,request,path){
    const revision=await v10ImageRevision(); const cache=await caches.open(v10ImageCacheName(revision)); const key=scopeUrl(path).href;
    const cached=await cache.match(key); if(cached){ return cached; }
    if(revision!==RUNTIME_REVISION){ const retained=await cachedShellResponse(path,revision); if(retained){ return retained; } }
    const response=await fetch(request);
    if(response&&response.ok&&response.type==="basic"){ event.waitUntil(cache.put(key,response.clone()).catch(()=>{})); }
    return response;
}
async function unversionedShellResponse(request,path){
    const revision=await v10ImageRevision(); const cached=await cachedShellResponse(path,revision)||(revision!==RUNTIME_REVISION?await cachedShellResponse(path,RUNTIME_REVISION):null);
    return cached||fetch(request);
}
self.addEventListener("fetch",event=>{
    const request=event.request; if(request.method!=="GET"){return;} const url=new URL(request.url); const scope=scopeUrl(); if(url.origin!==scope.origin){return;}
    if(request.mode==="navigate"){
        const path=relativeScopePath(url);
        if(NETWORK_ONLY_NAVIGATION_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; }
        if(SHELL_FRAME_NAVIGATION_PATHS.has(path)){ event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); const cached=selected?await cachedShellResponse(path,selected.revision):null; return cached||fetch(request); })()); return; }
        event.respondWith((async()=>{ const selected=await chooseNavigationRuntime(); if(selected){const cached=await cachedShellResponse("index.html",selected.revision);if(cached){return cached;}} return fetch(request); })()); return;
    }
    const path=relativeScopePath(url); if(!path){return;} if(isV10ImagePath(path)){ event.respondWith(v10ImageResponse(event,request,path)); return; } if(NETWORK_ONLY_ASSET_PATHS.has(path)){ event.respondWith(fetch(networkOnlyRequest(request))); return; } if(path===RUNTIME_CONFIG_PATH){return;} if(path===APP_CHECK_BOOTSTRAP_PATH){return;} if(UNVERSIONED_SHELL_ASSET_PATHS.has(path)&&!url.searchParams.get("v")){ event.respondWith(unversionedShellResponse(request,path)); return; } const requestedRevision=url.searchParams.get("v")||""; if(!requestedRevision){return;}
    event.respondWith((async()=>{const cached=await cachedShellResponse(path,requestedRevision);return cached||Response.error();})());
});
self.__CMS_SERVICE_WORKER_DIAGNOSTICS__=Object.freeze({revision:RUNTIME_REVISION,previousRevision:PREVIOUS_RUNTIME_REVISION,cacheName:CACHE_NAME,previousCacheName:PREVIOUS_CACHE_NAME,modeCacheName:MODE_CACHE_NAME,shellPaths:SHELL_PATHS,previousShellPaths:PREVIOUS_SHELL_PATHS});
```


## FILE: tests/firebase/prime-pack-rules-emulator.cjs
```javascript
"use strict";
// r87 Prime Pack (Nik 2026-10-31/11-01) in the composed production Rules (firestore.spark.generated.rules).
// One shared round record per season, rivalries/{rid}/primePackRounds/season_N, written only by the two managers through
// js/iconGuessStep.js (the real step code runs here against the emulator):
//   1. Arrivals: each manager writes only his own arrival, at server time, once; the other's facts never move.
//   2. Guesses: only after both arrived, from 2 s to 43 s after the later arrival (four stages of 9.5 s after a 3 s count-in),
//      one chip at a time, two at most; a manager can name only himself the winner; once there is a winner nothing changes.
//   3. The points (Nik 2026-11-01): a Season Result with primePack N (1 to 4) is accepted only from the manager the round names,
//      and only when N is the stage of the winning write's server time (4 before 12.5 s after the later arrival, 3 before 22 s,
//      2 before 31.5 s, then 1). The phone's clock plays no part.
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


## FILE: PR #1149 diff for every other code file it touches (unified diff, 3 lines context; minified lines are long)
```diff
diff --git a/firestore.season-commit-production.fragment.rules b/firestore.season-commit-production.fragment.rules
index 97b9ecbb1..571075379 100644
--- a/firestore.season-commit-production.fragment.rules
+++ b/firestore.season-commit-production.fragment.rules
@@ -23,7 +23,7 @@
     function ssjrCommitResultShape(value, teamCount) {
       return teamCount >= 2
         && value is map
-        && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague'])
+        && value.keys().hasOnly(['leaguePosition','leaguePoints','leagueGoals','domesticCup','championsLeague','topScorer','topAssist','europaLeague','primePack'])
         && value.leaguePosition is int
         && value.leaguePosition >= 1
         && value.leaguePosition <= teamCount
@@ -37,7 +37,8 @@
         && value.championsLeague is bool
         && value.topScorer is bool
         && value.topAssist is bool
-        && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false));
+        && (!('europaLeague' in value) || (value.europaLeague == true && value.championsLeague == false))
+        && (!('primePack' in value) || (value.primePack is int && value.primePack >= 1 && value.primePack <= 4));
     }
     function ssjrCommitExactKeys(root) {
       return root.keys().hasOnly([
diff --git a/firestore.terminal-close-production.fragment.rules b/firestore.terminal-close-production.fragment.rules
index 1c6834d84..e73ebc943 100644
--- a/firestore.terminal-close-production.fragment.rules
+++ b/firestore.terminal-close-production.fragment.rules
@@ -39,10 +39,11 @@
         && intent.billingRequired == false;
     }
     // Canonical season score: CL +5, EL +3 (r80; the key exists only when won), league title +3, cup +1,
-    // 100 points or 100 goals +1, top scorer or top assist +1. A season stays at most 11 (an EL season at most 9).
+    // 100 points or 100 goals +1, top scorer or top assist +1, Prime Pack 4, 3, 2 or 1 (the key exists only when won). A season is at most 15.
     function ssjrTerminalScore(result) {
       return (result.championsLeague == true ? 5 : 0)
         + (result.get('europaLeague', false) == true ? 3 : 0)
+        + result.get('primePack', 0)
         + (result.leaguePosition == 1 ? 3 : 0)
         + (result.domesticCup == true ? 1 : 0)
         + ((result.leaguePoints >= 100 || result.leagueGoals >= 100) ? 1 : 0)
@@ -78,10 +79,10 @@
         && progress.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
         && progress.managerTotals.playerOne is int
         && progress.managerTotals.playerOne >= 0
-        && progress.managerTotals.playerOne <= progress.acceptedThroughSeason * 11
+        && progress.managerTotals.playerOne <= progress.acceptedThroughSeason * 15
         && progress.managerTotals.playerTwo is int
         && progress.managerTotals.playerTwo >= 0
-        && progress.managerTotals.playerTwo <= progress.acceptedThroughSeason * 11
+        && progress.managerTotals.playerTwo <= progress.acceptedThroughSeason * 15
         && (progress.closedSessionRevision == null || (progress.closedSessionRevision is int && progress.closedSessionRevision >= 1));
     }
     function ssjrTerminalBaseRivalryPreserved(before, after) {
diff --git a/js/analytics.js b/js/analytics.js
index 6503e6377..0197722d7 100644
--- a/js/analytics.js
+++ b/js/analytics.js
@@ -137,9 +137,14 @@ function getAnalyticsScoring(player){
     if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
         return player.scoring;
     }
-    return typeof calculatePlayerSeasonScore === "function"
-        ? calculatePlayerSeasonScore(player || {})
-        : { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
+    if(typeof calculatePlayerSeasonScore !== "function"){
+        return { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
+    }
+    // r87 Prime Pack: js/scoring.js (startup, at its size budget) leaves the sparse primePack key (1 to 4) to the callers.
+    const scoring = calculatePlayerSeasonScore(player || {});
+    const primePack = player && [1, 2, 3, 4].includes(player.primePack) ? player.primePack : 0;
+    if(primePack && !scoring.primePack){ scoring.primePack = primePack; scoring.total += primePack; }
+    return scoring;
 }
 
 function createManagerCareerStats(name, key = analyticsNormalizeName(name), profileId = null){
@@ -254,7 +259,7 @@ function accumulateRoundStats(stats, showdown, round, playerKey){
     if(leagueGoals >= 100){ stats.hundredGoalSeasons += 1; }
     if(player.topScorer){ stats.topScorerSeasons += 1; }
     if(player.topAssist){ stats.topAssistSeasons += 1; }
-    if(score === 11){ stats.perfectSeasons += 1; }
+    if(score >= 11){ stats.perfectSeasons += 1; }
 
     if(Number.isFinite(leaguePosition) && leaguePosition > 0){
         stats.bestLeaguePosition = stats.bestLeaguePosition === null
diff --git a/js/careerScreenSeam.js b/js/careerScreenSeam.js
index a35e9995a..e5b65db39 100644
--- a/js/careerScreenSeam.js
+++ b/js/careerScreenSeam.js
@@ -1,8 +1,8 @@
 (function(root,factory){
-  const api=factory();
+  const api=factory(root);
   if(typeof module!=="undefined"&&module.exports)module.exports=api;
   else root.CareerModeCareerScreenSeam=api;
-})(typeof globalThis!=="undefined"?globalThis:this,function(){
+})(typeof globalThis!=="undefined"?globalThis:this,function(root){
   "use strict";
   const SCREENS=["careerStatistics","trophyRoom","legacy","rivalryStatistics"];
   const STATUSES=["loading","empty","unavailable","partial","ready"];
@@ -56,13 +56,37 @@
     let date="-";if(at){try{date=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(at);}catch(_error){date="-";}}
     return TEXT.historyStatus.abandoned+" · "+date+" · "+(played===null?"- seasons":played+(played===1?" season":" seasons"));
   }
-  // r84 Golden Showdown (Nik): a manager who scores 110 Showdown points (11, the most a season can score, in every season)
-  // in a finished 10-season Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An
-  // ended-early, unfinished or shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
-  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110});
+  // r84 Golden Showdown (Nik): a manager who scores the most a season can score in every season of a finished 10-season
+  // Showdown. Each manager is judged on their own total, so both can earn it in one Showdown. An ended-early, unfinished or
+  // shorter Showdown never earns it. Read from the completed rows already loaded; nothing is stored.
+  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so its
+  // Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 a season and 110. PRIME_PACK_FROM_MS is
+  // js/iconGuess.js fromMs (the Roster Roulette boundary; tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
+  const GOLDEN_SHOWDOWN=Object.freeze({seasons:10,points:110,primePackPoints:150});
+  const SEASON_MAX=Object.freeze({before:11,primePack:15});
+  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  const PAIR_ID=/^pair_[0-9a-f]{64}$/;
+  function csSeasonScores(row){
+    const out=[];
+    for(const season of Array.isArray(row&&row.seasons)?row.seasons:[]){const score=season&&season.score;if(score)for(const key of ["daniel","nik","playerOne","playerTwo"])if(Number.isInteger(score[key]))out.push(score[key]);}
+    return out;
+  }
+  function csLiveSetup(){try{const state=root.CareerModeProductionSharedShowdownSetup?.getState?.();return state&&state.ready===true&&state.setup?.phase==="SHOWDOWN_CONFIRMED"&&PAIR_ID.test(String(state.rivalryId))&&Number.isFinite(state.setupUpdatedAtMs)?state:null;}catch(_error){return null;}}
+  // The most one season of this Showdown can score: 15 with Prime Pack, 11 before. Known from the Showdown's confirm time;
+  // without one, a season over 11 can only be Prime Pack, and the live Showdown's Setup (when it is this Showdown) decides.
+  function seasonMaxFor(row){
+    const pack=SEASON_MAX.primePack,before=SEASON_MAX.before;
+    if(row&&PAIR_ID.test(String(row.rivalryId))&&Number.isFinite(row.setupConfirmedAt))return row.setupConfirmedAt>=PRIME_PACK_FROM_MS?pack:before;
+    if(csSeasonScores(row).some(score=>score>before))return pack;
+    const live=csLiveSetup();
+    if(live&&(row?.rivalryId==null||row.rivalryId===live.rivalryId))return live.setupUpdatedAtMs>=PRIME_PACK_FROM_MS?pack:before;
+    return before;
+  }
+  function goldenShowdownPoints(row){return GOLDEN_SHOWDOWN.seasons*seasonMaxFor(row);}
   function goldenShowdownManagers(row){
     if(!row||row.status!=="completed"||row.totalSeasons!==GOLDEN_SHOWDOWN.seasons||row.seasonsPlayed!==GOLDEN_SHOWDOWN.seasons||!row.totals)return [];
-    return ["daniel","nik"].filter(manager=>Number.isInteger(row.totals[manager])&&row.totals[manager]>=GOLDEN_SHOWDOWN.points);
+    const points=goldenShowdownPoints(row);
+    return ["daniel","nik"].filter(manager=>Number.isInteger(row.totals[manager])&&row.totals[manager]>=points);
   }
   function goldenShowdownCounts(rows){
     const counts={daniel:0,nik:0};
@@ -171,5 +195,5 @@
     }
     fragment.appendChild(root);return fragment;
   }
-  return csFreeze({contractVersion:1,SCREENS,STATUSES,TEXT,GOLDEN_SHOWDOWN,endedEarlyText,goldenShowdownManagers,goldenShowdownCounts,normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
+  return csFreeze({contractVersion:1,SCREENS,STATUSES,TEXT,GOLDEN_SHOWDOWN,SEASON_MAX,PRIME_PACK_FROM_MS,seasonMaxFor,goldenShowdownPoints,endedEarlyText,goldenShowdownManagers,goldenShowdownCounts,normalizeRenderRequest,isOnlineCareerRoute,selectCareerScreenSource,careerScreenView,paintCareerScreenView});
 });
diff --git a/js/careerScreensV10.js b/js/careerScreensV10.js
index 6c58e5c86..396f355f5 100644
--- a/js/careerScreensV10.js
+++ b/js/careerScreensV10.js
@@ -38,7 +38,7 @@
       return {manager,rank:index<0?null:standings[index].level===true?1:index+1};
     });
   }
-  // r84 Golden Showdown: how many finished 10-season Showdowns each manager closed on 110 points, counted from the completed
+  // r84 Golden Showdown: how many finished 10-season Showdowns each manager closed on the Golden total (110, or 150 with Prime Pack), counted from the completed
   // rows this model already holds (the seam owns the rule). Only a career with one carries the field.
   function v10GoldenShowdowns(model,frame){
     const counts=v10Seam().goldenShowdownCounts(model.history&&model.history.showdowns);
diff --git a/js/commentaryEngine.js b/js/commentaryEngine.js
index e1b0027da..550af1bbd 100644
--- a/js/commentaryEngine.js
+++ b/js/commentaryEngine.js
@@ -67,7 +67,15 @@
     "OGC Nice":"Nice","Sevilla FC":"Sevilla","Málaga CF":"Málaga","SD Eibar":"Eibar","RC Celta":"Celta Vigo","Toulouse Football Club":"Toulouse",
     "Granada CF":"Granada","AS Saint-Étienne":"Saint-Étienne","Stade Rennais FC":"Rennes"
   });
-  const MAX_SEASON_POINTS=11;
+  // The most one season can score: 11, or 15 in a Showdown that plays r87 Prime Pack (11 + up to 4; G Lead and Nik
+  // 2026-11-01). facts.primePack (true/false) says which; without it, a Prime Pack point or a season over 11 can only be Prime Pack. A season is
+  // checked against the larger maximum; every "maximum", "clinched" and Golden line uses this Showdown's own.
+  const MAX_SEASON_POINTS=11,MAX_PRIME_PACK_SEASON_POINTS=15;
+  function ceSeasonMax(facts,sd){
+    if(facts&&facts.primePack===true)return MAX_PRIME_PACK_SEASON_POINTS;
+    if(facts&&facts.primePack===false)return MAX_SEASON_POINTS;
+    return sd.seasons.some(row=>ROLES.some(role=>row.primePack[role]||row.points[role]>MAX_SEASON_POINTS))?MAX_PRIME_PACK_SEASON_POINTS:MAX_SEASON_POINTS;
+  }
   // {mpPosition} is read aloud, so it is the spoken position, never the list's code (Nik 2026-10-29). A code not listed here
   // leaves the slot out rather than reading a code.
   const POSITION_WORDS=Object.freeze({LW:"left winger",RW:"right winger",LM:"left midfielder",RM:"right midfielder",CM:"central midfielder",
@@ -109,14 +117,14 @@
   // calculatePlayerSeasonScore (js/scoring.js) is used; with neither, the facts are refused rather than re-scored here.
   function ceSeason(value,index){
     if(!value||typeof value!=="object")ceFail("COMMENTARY_SEASON_INVALID");
-    const out={number:index+1,result:{},breakdown:{},points:{},teamCount:{}};
+    const out={number:index+1,result:{},breakdown:{},points:{},teamCount:{},primePack:{}};
     for(const role of ROLES){
       const result=value.results?value.results[role]:value[role];
       if(!result||typeof result!=="object")ceFail("COMMENTARY_SEASON_INVALID");
       let breakdown=value.scoring?value.scoring[role]:result.scoring;
-      if(!breakdown&&typeof root.calculatePlayerSeasonScore==="function")breakdown=root.calculatePlayerSeasonScore(result);
+      if(!breakdown&&typeof root.calculatePlayerSeasonScore==="function"){breakdown=root.calculatePlayerSeasonScore(result);const pp=[1,2,3,4].includes(result.primePack)?result.primePack:0;if(pp&&!breakdown.primePack){breakdown={...breakdown,primePack:pp,total:breakdown.total+pp};}}
       if(!breakdown||typeof breakdown!=="object")ceFail("COMMENTARY_SCORING_MISSING");
-      if(!Number.isInteger(breakdown.total)||breakdown.total<0||breakdown.total>MAX_SEASON_POINTS)ceFail("COMMENTARY_SCORING_INVALID");
+      if(!Number.isInteger(breakdown.total)||breakdown.total<0||breakdown.total>MAX_PRIME_PACK_SEASON_POINTS)ceFail("COMMENTARY_SCORING_INVALID");
       const teams=value.teamCounts&&Number.isInteger(value.teamCounts[role])?value.teamCounts[role]:value.teamCount;
       if(!Number.isInteger(teams)||teams<2)ceFail("COMMENTARY_TEAM_COUNT_INVALID");
       const position=Number(result.leaguePosition);
@@ -127,6 +135,7 @@
         performance:breakdown.performanceBonus>0,award:breakdown.individualAwardsBonus>0,
         hundredPoints:triggers.hundredLeaguePoints===true,hundredGoals:triggers.hundredLeagueGoals===true,topScorer:triggers.topScorer===true,topAssist:triggers.topAssist===true};
       out.points[role]=breakdown.total;
+      out.primePack[role]=Number.isInteger(breakdown.primePack)&&breakdown.primePack>0;
       out.teamCount[role]=teams;
     }
     const a=out.points.playerOne,b=out.points.playerTwo;
@@ -210,7 +219,7 @@
     if(leader)Object.assign(values,{leader:m[leader].name,trailer:m[ceOther(leader)].name,gap:before[leader]-before[ceOther(leader)]});
     // Final-season and leader previews speak of a race both can still win: none once the trailer can no longer win
     // (the season result before already said so with clock-clinched / clock-dead-rubber).
-    const open=!leader||values.gap<MAX_SEASON_POINTS*values.seasonsLeft,out=[];
+    const open=!leader||values.gap<ceSeasonMax(facts,sd)*values.seasonsLeft,out=[];
     if(s===1)out.push(ceEntry("preview-first-season",values));
     if(s===1&&sd.length===10)out.push(ceEntry("preview-golden",values));
     if(s===sd.length&&open)out.push(ceEntry("preview-final-season",values));
@@ -221,7 +230,7 @@
 
   function ceTrophies(bd){return bd.league||bd.cl||bd.el||bd.cup;}
   function ceSeasonResult(facts){
-    const m=ceManagers(facts),sd=ceShowdown(facts),s=sd.current;
+    const m=ceManagers(facts),sd=ceShowdown(facts),s=sd.current,max=ceSeasonMax(facts,sd);
     if(sd.seasons.length<s)ceFail("COMMENTARY_SEASON_INVALID");
     const row=sd.seasons[s-1],out=[],pa=row.points.playerOne,pb=row.points.playerTwo,W=row.winner==="draw"?null:row.winner;
     // N1 margins, N2 draws and totals
@@ -237,7 +246,7 @@
     // N3-N6 one manager's season
     for(const role of ROLES){
       const bd=row.breakdown[role],result=row.result[role],values=ceManagerSlots(m,row,role),won=ceTrophies(bd),teams=row.teamCount[role],add=situation=>out.push(ceEntry(situation,values));
-      if(row.points[role]===MAX_SEASON_POINTS)add("season-perfect");
+      if(row.points[role]===max)add("season-perfect");
       if(bd.cl&&bd.league&&bd.cup)add("trophy-treble");
       if(bd.cl&&bd.league&&!bd.cup)add("trophy-cl-and-league");
       if(bd.cl&&!bd.league)add("trophy-cl-only");
@@ -286,9 +295,9 @@
     // N10 the clock (after this season)
     if((sd.length===5||sd.length===10)&&s===Math.ceil(sd.length/2))out.push(ceEntry("clock-halfway",overall));
     if(left===1)out.push(ceEntry("clock-penultimate",overall));
-    if(left===1&&gap<MAX_SEASON_POINTS)out.push(ceEntry("clock-final-open",overall));
-    if(left>0&&gap>MAX_SEASON_POINTS*left)out.push(ceEntry("clock-clinched",overall));
-    if(left===1&&gap>MAX_SEASON_POINTS)out.push(ceEntry("clock-dead-rubber",overall));
+    if(left===1&&gap<max)out.push(ceEntry("clock-final-open",overall));
+    if(left>0&&gap>max*left)out.push(ceEntry("clock-clinched",overall));
+    if(left===1&&gap>max)out.push(ceEntry("clock-dead-rubber",overall));
     return out;
   }
 
@@ -308,8 +317,9 @@
       out.push(ceEntry(margin===1?"final-won-by-1":margin<=5?"final-won-by-2-5":margin<=15?"final-won-by-6-15":"final-won-by-16-plus",values));
       if(sd.totals.slice(0,N-1).some(pair=>pair[W]<pair[L]))out.push(ceEntry("final-comeback",values));
       if(sd.totals.every(pair=>pair[W]>pair[L]))out.push(ceEntry("final-wire-to-wire",values));
-      // r86 (red team #12): the Golden Showdown is the Rule Book's 110 (11 in every season of a 10-season Showdown), not any 10-season win.
-      if(N===10&&totals[W]===MAX_SEASON_POINTS*N)out.push(ceEntry("final-golden",values));
+      // r86 (red team #12): the Golden Showdown is the Rule Book's 110 (11 in every season of a 10-season Showdown), not any
+      // 10-season win; 150 (15 in every season) in a Showdown with Prime Pack.
+      if(N===10&&totals[W]===ceSeasonMax(facts,sd)*N)out.push(ceEntry("final-golden",values));
       if(N===1)out.push(ceEntry("final-sprint",values));
       if(N>=2&&ceLeaderOf(sd.totals[N-2])===L)out.push(ceEntry("final-last-season-swing",values));
     }else{
diff --git a/js/legacy.js b/js/legacy.js
index 75c617eda..746f8173b 100644
--- a/js/legacy.js
+++ b/js/legacy.js
@@ -196,9 +196,14 @@ function getLegacyScoring(player){
     if(player && player.scoring && Number.isFinite(Number(player.scoring.total))){
         return player.scoring;
     }
-    return typeof calculatePlayerSeasonScore === "function"
-        ? calculatePlayerSeasonScore(player || {})
-        : { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
+    if(typeof calculatePlayerSeasonScore !== "function"){
+        return { total: 0, performanceBonus: 0, individualAwardsBonus: 0, awardsBonus: 0 };
+    }
+    // r87 Prime Pack: js/scoring.js (startup, at its size budget) leaves the sparse primePack key (1 to 4) to the callers.
+    const scoring = calculatePlayerSeasonScore(player || {});
+    const primePack = player && [1, 2, 3, 4].includes(player.primePack) ? player.primePack : 0;
+    if(primePack && !scoring.primePack){ scoring.primePack = primePack; scoring.total += primePack; }
+    return scoring;
 }
 
 function getPlayerHonours(player){
diff --git a/js/productionSharedCanonicalScoring.js b/js/productionSharedCanonicalScoring.js
index 202a15977..712fb7f2b 100644
--- a/js/productionSharedCanonicalScoring.js
+++ b/js/productionSharedCanonicalScoring.js
@@ -55,7 +55,7 @@
     const ui=pcscEnsureUi();if(!ui)return false;const request=pcscRequestContext(),eligible=Boolean(pcscSharedMarker()&&request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="SCORING_RECONCILED");pcscHidden(ui.panel,!eligible);if(!eligible)return false;
     const p1=view.scoring.playerOne,p2=view.scoring.playerTwo,n1=pcscManagerName("playerOne"),n2=pcscManagerName("playerTwo");
     pcscText(ui.totals,`${n1}: ${p1.total} · ${n2}: ${p2.total}`);
-    pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague}${p1.europaLeague||p2.europaLeague?` · Europa League ${p1.europaLeague||0}–${p2.europaLeague||0}`:""} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.domesticCup}–${p2.domesticCup} · Performance Bonus ${p1.performanceBonus}–${p2.performanceBonus} · Awards Bonus ${p1.individualAwardsBonus}–${p2.individualAwardsBonus}`);
+    pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague}${p1.europaLeague||p2.europaLeague?` · Europa League ${p1.europaLeague||0}–${p2.europaLeague||0}`:""}${p1.primePack||p2.primePack?` · Prime Pack ${p1.primePack||0}–${p2.primePack||0}`:""} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.domesticCup}–${p2.domesticCup} · Performance Bonus ${p1.performanceBonus}–${p2.performanceBonus} · Awards Bonus ${p1.individualAwardsBonus}–${p2.individualAwardsBonus}`);
     pcscText(ui.winner,view.winner==="draw"?"Season result: Draw":`Season winner: ${pcscManagerName(view.winner)}`);pcscBoard(ui.panel,p1,p2,n1,n2,view.winner);return true;
   }
   // r87 match-day polish: the same numbers drawn as a scoreboard (names, big totals, one row per category with the higher
@@ -70,7 +70,7 @@
     const head=el("div","pcscBoard__head");
     head.append(el("span","pcscBoard__name",n1),el("strong",`pcscBoard__total${side(p1.total,p2.total)}`,p1.total),el("span","pcscBoard__colon",":"),el("strong",`pcscBoard__total${side(p2.total,p1.total)}`,p2.total),el("span","pcscBoard__name",n2));
     const rows=el("div","pcscBoard__rows");
-    const lines=[["Champions League",p1.championsLeague,p2.championsLeague],...(p1.europaLeague||p2.europaLeague?[["Europa League",p1.europaLeague||0,p2.europaLeague||0]]:[]),["League Title",p1.leagueTitle,p2.leagueTitle],["Domestic Cup",p1.domesticCup,p2.domesticCup],["Performance Bonus",p1.performanceBonus,p2.performanceBonus],["Awards Bonus",p1.individualAwardsBonus,p2.individualAwardsBonus]];
+    const lines=[["Champions League",p1.championsLeague,p2.championsLeague],...(p1.europaLeague||p2.europaLeague?[["Europa League",p1.europaLeague||0,p2.europaLeague||0]]:[]),...(p1.primePack||p2.primePack?[["Prime Pack",p1.primePack||0,p2.primePack||0]]:[]),["League Title",p1.leagueTitle,p2.leagueTitle],["Domestic Cup",p1.domesticCup,p2.domesticCup],["Performance Bonus",p1.performanceBonus,p2.performanceBonus],["Awards Bonus",p1.individualAwardsBonus,p2.individualAwardsBonus]];
     for(const [label,a,b] of lines){const one=Number(a)||0,two=Number(b)||0,row=el("div",`pcscBoard__row${one||two?"":" is-zero"}`);row.append(el("span",`pcscBoard__val${side(one,two)}`,`+${one}`),el("span","pcscBoard__label",label),el("span",`pcscBoard__val${side(two,one)}`,`+${two}`));rows.append(row);}
     const verdict=el("div",`pcscBoard__verdict${winner==="draw"?" is-draw":""}`,winner==="draw"?"SEASON DRAWN":`SEASON WINNER · ${pcscManagerName(winner)}`);
     board.replaceChildren(head,rows,verdict);panel.classList.add("hasPcscBoard");
diff --git a/js/productionSharedCareerStart.js b/js/productionSharedCareerStart.js
index 8836c455b..be6126632 100644
--- a/js/productionSharedCareerStart.js
+++ b/js/productionSharedCareerStart.js
@@ -140,9 +140,9 @@
       transferOpening=true;
       const opened=await transfer.open();
       transferOpening=false;
-      // r87: the manager left the Russian Roster Roulette for Showdown Home; it opens again from there. Not a failure.
-      if(opened!==true&&root.CareerModeRosterRouletteStep?.wentHome?.()){pcstClosePanel();return false;}
-      // The roulette could not start (Setup not read, its files not loaded): its own reason, not a generic one (Fable F2-05).
+      // r87: the manager left the Russian Roster Roulette or the Prime Pack for Showdown Home; it opens again from there. Not a failure.
+      if(opened!==true&&(root.CareerModeRosterRouletteStep?.wentHome?.()||root.CareerModeIconGuessStep?.wentHome?.())){pcstClosePanel();return false;}
+      // The roulette or the Prime Pack could not start (Setup not read, its files not loaded): its own reason, not a generic one (Fable F2-05).
       const reason=opened!==true&&typeof transfer.rouletteError==="function"?transfer.rouletteError():"";
       if(reason){lastError=reason;return false;}
       if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
@@ -497,7 +497,7 @@
     // Fable F6-01: a BACK TO SHOWDOWN HOME from the roulette opened here (CONTINUE CAREER from Home) stays on Home, as it does
     // from the panel; only a roulette that could not start (its own reason) or a failed open shows Career Start below.
     if(!pcstPanelOpen()&&pcstReadyHere()&&await request.wait(pcstOpenTransferChallenge()))return pcstCloseReveal();
-    if(!pcstPanelOpen()&&pcstReadyHere()&&root.CareerModeRosterRouletteStep?.wentHome?.())return pcstCloseReveal();
+    if(!pcstPanelOpen()&&pcstReadyHere()&&(root.CareerModeRosterRouletteStep?.wentHome?.()||root.CareerModeIconGuessStep?.wentHome?.()))return pcstCloseReveal();
     const overlay=pcstEnsurePanel();stageRetries=0;stageFailed=false;retryFailed=false;stageFailed=!(await request.wait(pcstClubBackdrop()));overlay.classList.remove("hidden");pcstRender();pcstCloseReveal();await request.wait(pcstRefresh(false,request));return true;
   }
   function pcstClosePanel(){const overlay=root.document&&root.document.getElementById(PANEL_ID);if(overlay){overlay.classList.add("hidden");pcstStageOff(overlay);}return true;}
diff --git a/js/productionSharedSeasonResults.js b/js/productionSharedSeasonResults.js
index b56a375a6..4ee888847 100644
--- a/js/productionSharedSeasonResults.js
+++ b/js/productionSharedSeasonResults.js
@@ -174,6 +174,24 @@
     try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrSetError("");pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
   }
   function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrSetError("");pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
+  // Prime Pack: the manager who named this season's masked Icon first publishes his result with primePack:N, N = 4, 3, 2 or 1
+  // by the stage of his right guess (the Rules accept it only when the round record names him and its server time gives N). Read once from the round record, only for a Showdown that plays
+  // Prime Pack; an older Showdown never loads the step or reads anything. A read that fails stops the publish (TRY AGAIN),
+  // so a won point is never dropped by a bad connection.
+  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  async function pssrWithPrimePack(ctx,request,result){
+    const confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
+    // Old Showdowns never load the step (the same boundary as js/iconGuess.js fromMs; a contract keeps them equal).
+    if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off"||!result||typeof result!=="object")return result;
+    const step=root.CareerModeIconGuessStep||await (typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep).then(()=>root.CareerModeIconGuessStep,()=>null):null);
+    // applies() needs the round engine (js/iconGuess.js): load it first, or a won Prime Pack point would be dropped.
+    if(!step||!await step.ensure())pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","Prime Pack could not load. Check the connection and try again.");
+    const gameCtx={rivalryId:ctx.options.rivalryId,managerRole:ctx.setup.managerRole,season:request.seasonNumber,confirmedAtMs};
+    if(!step.applies(gameCtx))return result;
+    const points=await step.pointsFor({firestore:ctx.options.firestore,sdk:ctx.options.firebaseSdk,rivalryId:ctx.options.rivalryId},gameCtx);
+    const{primePack:_drop,...rest}=result;
+    return Number.isInteger(points)&&points>=1&&points<=4?{...rest,primePack:points}:rest;
+  }
   async function pssrPublish(){
     if(busy||!draft||!view?.managerRole)return false;
     if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("The shared season context changed. Review your result again.");draft=null;return false;}
@@ -188,7 +206,8 @@
         for(;;){
           if(current.ownResult){pssrDraftClear(publishRole,request);view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
           draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
-          const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:draft.result});
+          const publishedResult=await pssrWithPrimePack(ctx,request,draft.result);if(!pssrContextMatches(request))return false;
+          const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:publishedResult});
           if(published?.code==="SEASON_RESULTS_STALE_BASE_REVISION"&&!staleRetried){staleRetried=true;current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;continue;}
           // JOB-1611: two same-moment publishes can both lose to lock contention instead of one losing to the other's write.
           // One manager then gets aborted (SDK retries spent) or permission-denied (the rival's retried write had not landed
diff --git a/js/productionSharedTransferChallenge.js b/js/productionSharedTransferChallenge.js
index 754df6b63..ffd433bbf 100644
--- a/js/productionSharedTransferChallenge.js
+++ b/js/productionSharedTransferChallenge.js
@@ -22,7 +22,9 @@
   const witnessedByContext=new Map();
   let fastWaitKey="",fastWaitSince=0;
   // The reason the roulette could not start on this phone (shown on the dashboard and on Career Start), or "" (Fable F2-05).
-  let rouletteError="";
+  let rouletteError="",primePackLoadError=false;
+  const PSTC_PRIME_PACK_TEXT="Prime Pack could not load. Check the connection and tap again.";
+  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
   const PSTC_ROULETTE_TEXT=Object.freeze({
     load:"The roulette could not load. Check the connection and tap again.",
     setup:"This season's roulette needs the Showdown's confirmed Setup, and it could not be read just now. Tap again to retry.",
@@ -453,7 +455,7 @@
     const refresh=pstcEnsureRefreshButton();pstcDisable(refresh,busy||isReplay);return true;
   }
   function pstcEnsureRefreshButton(){let button=pstcField("refreshSharedTransferChallenge");if(button)return button;const actions=root.document&&root.document.querySelector("#transferChallenge .transferTimerActions");if(!actions)return null;button=root.document.createElement("button");button.id="refreshSharedTransferChallenge";button.className="menuButton";button.type="button";button.textContent="REFRESH CHALLENGE";button.addEventListener("click",event=>{event.preventDefault();if(pstcReplayPhase())return;void pstcRefresh().catch(error=>{pstcSetError(pstcErrorText(error,"The Transfer Challenge did not refresh. Try again."));pstcReport("Unable to refresh Shared Transfer Challenge",error);});});actions.append(button);return button;}
-  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER CHALLENGE…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} TRANSFER CHALLENGE`;status.textContent="Transfer Challenge: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN TRANSFER WINDOW";status.textContent="Transfer Challenge: window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="ENTER GUESSES";status.textContent="Transfer Challenge: guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="ENTER SIGNINGS";status.textContent="Transfer Challenge: signings";}else{button.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer Challenge: complete";}if(rouletteError)status.textContent=rouletteError;return true;}
+  function pstcDecorateDashboard(){if(!root.document||!pstcSharedMarker())return false;const currentKey=pstcCurrentContextKey();if(viewContextKey&&currentKey&&viewContextKey!==currentKey)return false;const button=pstcField("seasonPrimaryAction"),status=pstcField("dashboardTransferStatus"),state=view?.state||null;if(!button||!status)return false;button.dataset.sharedTransferChallenge="true";button.disabled=Boolean(openPromise);if(openPromise){button.setAttribute("aria-busy","true");button.textContent="OPENING TRANSFER CHALLENGE…";return true;}if(button.hasAttribute("aria-busy"))button.removeAttribute("aria-busy");const season=view?.seasonNumber||(()=>{try{return pstcSeason();}catch(_error){return 1;}})();if(!state){button.textContent=`START SEASON ${season} TRANSFER CHALLENGE`;status.textContent="Transfer Challenge: ready";}else if(state.phase==="WINDOW_OPEN"){button.textContent="OPEN TRANSFER WINDOW";status.textContent="Transfer Challenge: window live";}else if(state.phase==="GUESS_ENTRY"){button.textContent="ENTER GUESSES";status.textContent="Transfer Challenge: guesses";}else if(state.phase==="SIGNING_ENTRY"){button.textContent="ENTER SIGNINGS";status.textContent="Transfer Challenge: signings";}else{button.textContent="VIEW TRANSFER VERDICTS";status.textContent="Transfer Challenge: complete";}if(rouletteError)status.textContent=rouletteError;else if(primePackLoadError)status.textContent=PSTC_PRIME_PACK_TEXT;return true;}
   // r50: the first open loads the Transfer runtime and reads authority; show it and share one attempt.
   // r87 Russian Roster Roulette (js/rosterRouletteStep.js): before this season's Transfer Challenge opens, this manager does
   // the season's roulette once (board from season 2, both spins, the release). It decides for itself whether it applies (a
@@ -488,6 +490,33 @@
       return go;
     }catch(_error){rouletteError=PSTC_ROULETTE_TEXT.error;return false;}
   }
+  // r87 Prime Pack (Nik 2026-10-31/11-01): after the roulette and before the window, both managers name one masked Icon
+  // (js/iconGuessStep.js). Only Showdowns confirmed on r87 or later play it (the same boundary as the roulette); for the
+  // rest nothing is loaded. false keeps the window shut: he went back to Showdown Home, or the step could not load (the
+  // dashboard then says so and tapping again retries). The round runs on the Transfer Challenge's server clock.
+  async function pstcPrimePackFirst(request){
+    primePackLoadError=false;
+    try{
+      if(!view||!view.managerRole||!request)return true;
+      const confirmedAtMs=pstcSetupState()?.setupUpdatedAtMs;
+      // Old Showdowns never load the Prime Pack step (the boundary is js/iconGuess.js fromMs).
+      if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off")return true;
+      let timer;const step=await Promise.race([pstcLoadScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep),new Promise(resolve=>{timer=root.setTimeout(()=>resolve(null),10000);})]).finally(()=>root.clearTimeout(timer));
+      if(!step){primePackLoadError=true;return false;}
+      // applies() needs the round engine (js/iconGuess.js): load it first, or an r87 Showdown would skip the Prime Pack.
+      if(!await step.ensure()){primePackLoadError=true;return false;}
+      const ctx={rivalryId:request.rivalryId,managerRole:view.managerRole,season:request.seasonNumber,confirmedAtMs};
+      if(!step.applies(ctx))return true;
+      const provided=await pstcProviderOptions(request,true);
+      if(!provided){primePackLoadError=true;return false;}
+      if(!pstcRequestMatches(request))return false;
+      const options=provided.options;
+      const go=await step.run(ctx,{firestore:options.firestore,sdk:options.firebaseSdk,rivalryId:options.rivalryId,sessionId:options.sessionId,deviceId:options.deviceId,now:()=>pstcAuthoritativeNow(request)});
+      // false without the manager choosing Showdown Home is a fault: the caller says so instead of a generic error.
+      if(go!==true&&!step.wentHome?.())primePackLoadError=true;
+      return go===true;
+    }catch(_error){primePackLoadError=true;return false;}
+  }
   // r87 roulette boards: each finished season's verdicts (both managers' signings, overall and release) are kept on this
   // phone when the Transfer Challenge shows them, so the next spins build their boards with no read. A season not kept
   // here (another phone, cleared storage) costs one Transfer Challenge read, once.
@@ -594,12 +623,12 @@
     })().catch(()=>false).finally(()=>{if(spinWriting===run)spinWriting=null;});
     spinWriting=run;return run;
   }
-  function pstcCloseRoulette(){try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}}
+  function pstcCloseRoulette(){try{root.CareerModeRosterRouletteStep?.close?.();}catch(_error){}try{root.CareerModeIconGuessStep?.close?.();}catch(_error){}}
   function pstcOpen(){if(openPromise)return openPromise;const run=Promise.resolve().then(pstcOpenNow);openPromise=run;run.finally(()=>{if(openPromise===run)openPromise=null;pstcDecorateDashboard();}).catch(()=>{});try{pstcDecorateDashboard();}catch(_error){}return run;}
   // Fable F2-11: an earlier BACK from the roulette is forgotten first. Fable F2-14: the replay of phases this phone did not see
   // is set before the screen shows, so it never mounts the live phase first. Fable F2-01: the roulette's card and stage come
   // down on every way out, a navigation that fails included.
-  async function pstcOpenNow(){if(!pstcSharedMarker())return false;try{root.CareerModeRosterRouletteStep?.forgetHome?.();}catch(_error){}await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");if(!await pstcRouletteFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}let shown=false;try{pstcPrepareReplay();pstcRender();shown=await root.navigateTo("transferChallenge");}finally{pstcCloseRoulette();}if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
+  async function pstcOpenNow(){if(!pstcSharedMarker())return false;try{root.CareerModeRosterRouletteStep?.forgetHome?.();}catch(_error){}await pstcEnsureDependencies();const request=pstcRequestContext(),result=await pstcRefresh();if(!request||!result||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pstcFail("TRANSFER_NAVIGATION_UNAVAILABLE");if(!await pstcRouletteFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}if(!await pstcPrimePackFirst(request)||!pstcRequestMatches(request)||viewContextKey!==request.key){pstcCloseRoulette();return false;}let shown=false;try{pstcPrepareReplay();pstcRender();shown=await root.navigateTo("transferChallenge");}finally{pstcCloseRoulette();}if(shown===false||!pstcRequestMatches(request)||viewContextKey!==request.key)return false;pstcPrepareReplay();pstcRender();return true;}
   async function pstcHandleAction(id){
     if(id==="seasonPrimaryAction")return pstcOpen();
     if(id==="continueFromTransfers"&&pstcReplayPhase())return pstcAdvanceReplay();
@@ -673,5 +702,5 @@
   }
   function pstcInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pstcCapture,true);root.document.addEventListener("change",pstcGuessTypeChange,true);root.document.addEventListener("input",pstcSigningDraftChange);root.document.addEventListener("change",pstcSigningDraftChange);if(typeof root.addEventListener==="function")root.addEventListener("storage",pstcSigningDraftStorage);root.document.addEventListener("input",pstcGuessDraftChange,true);root.document.addEventListener("change",pstcGuessDraftChange,true);root.document.addEventListener("visibilitychange",pstcVisibilityChange);}root.addEventListener?.("online",pstcVisibilityChange);root.addEventListener?.("career-mode-shared-season-cursor-change",()=>{pstcClearCachedContext();void pstcTick();});if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>void pstcTick(),POLL_MS);timerLoop=root.setInterval(pstcTimerTick,TIMER_MS);root.setInterval(pstcFastTick,FAST_POLL_MS);}if(pstcSharedMarker())void pstcTick();return true;}
 
-  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),spinsMissing:()=>[...pstcSpinsMissing()],rouletteError:()=>rouletteError,rouletteAppliesTo:pstcRouletteAppliesTo,install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute,canResumeResults:pstcCanResumeResults,rememberResultsView:pstcRememberResultsView});
+  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-transfer-challenge",productionEnabled:true,requiresCareerStartReady:true,requiresExactActiveSession:true,privateUntilCompleted:true,serverClockAuthoritative:true,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,orderedFullScreenReplay:true,inMemoryWitnessOnly:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pstcWaitingKey()),spinsMissing:()=>[...pstcSpinsMissing()],rouletteError:()=>rouletteError||(primePackLoadError?PSTC_PRIME_PACK_TEXT:""),rouletteAppliesTo:pstcRouletteAppliesTo,install:pstcInstall,open:pstcOpen,refresh:pstcRefresh,getState:()=>view,isActive:pstcSharedMarker,canRoute:pstcCanRoute,canResumeResults:pstcCanResumeResults,rememberResultsView:pstcRememberResultsView});
 });
diff --git a/js/rivalryLegacyV10.js b/js/rivalryLegacyV10.js
index 3b6891fe6..fae6375f3 100644
--- a/js/rivalryLegacyV10.js
+++ b/js/rivalryLegacyV10.js
@@ -18,7 +18,8 @@
   function bare(status){return {status,managerOrder:ORDER.slice()};}
   function validSeason(s){return s&&Number.isInteger(s.season)&&["daniel","nik","draw"].includes(s.winner)&&["score","leaguePosition","leaguePoints","leagueGoals"].every(k=>pair(s[k]));}
   function validRow(r){return r&&Number.isInteger(r.number)&&typeof r.leagueId==="string"&&r.clubs&&ORDER.every(k=>typeof r.clubs[k]==="string")&&finite(r.seasonsPlayed)&&finite(r.totalSeasons)&&pair(r.totals)&&["daniel","nik","draw"].includes(r.winner)&&Array.isArray(r.seasons)&&r.seasons.every(validSeason);}
-  // r84 Golden Showdown: the managers who closed this finished 10-season Showdown on 110 points (the seam owns the rule). Only a
+  // r84 Golden Showdown: the managers who closed this finished 10-season Showdown on the most every season can score (110, or
+  // 150 with Prime Pack; the seam owns the rule). Only a
   // Showdown that has one carries the field.
   function golden(row){const managers=seam().goldenShowdownManagers(row);return managers.length?{goldenShowdown:managers}:{};}
   // r86 Special Player chip (js/specialPlayerChip.js): a Showdown confirmed on r86 or later carries each manager's Special
@@ -51,7 +52,7 @@
       if(status==="loading"||status==="unavailable")return bare(status);
       const row=model.history.showdowns[0];
       if(!row||["abandoned","unavailable"].includes(row.status))return bare(status==="empty"?"empty":"unavailable");
-      source={status,leagueId:row.leagueId,clubs:row.clubs,score:row.totals,totalSeasons:row.totalSeasons,seasons:row.seasons,managers:model.managers};lifecycle=row.status;sp=rowSpecial(row);
+      source={status,leagueId:row.leagueId,clubs:row.clubs,score:row.totals,totalSeasons:row.totalSeasons,seasons:row.seasons,managers:model.managers,rivalryId:row.rivalryId,setupConfirmedAt:row.setupConfirmedAt};lifecycle=row.status;sp=rowSpecial(row);
     }else{source=model;status=STATES.includes(source?.status)?source.status:"unavailable";lifecycle=source?.lifecycle??null;sp=liveSpecial();}
     if(status==="unavailable"&&source?.notice==="continue")return {...bare("unavailable"),notice:"continue"};
     if(status==="loading"||status==="unavailable")return bare(status);
@@ -59,7 +60,7 @@
     if(!source.managers||!ORDER.every(k=>source.managers[k]&&FIELDS.every(f=>finite(source.managers[k][f])||(f==="bestSeasonScore"&&source.managers[k][f]===null))))return bare("unavailable");
     if(!Array.isArray(source.seasons)||!source.seasons.every(validSeason))return bare("unavailable");
     if(status!=="empty"&&(!pair(source.score)||!finite(source.totalSeasons)||!source.clubs||!ORDER.every(k=>typeof source.clubs[k]==="string")))return bare("unavailable");
-    const frame={...bare(status),leagueId:source.leagueId??null,clubs:source.clubs?{daniel:source.clubs.daniel,nik:source.clubs.nik}:null,totalSeasons:source.totalSeasons??null,score:source.score?{daniel:source.score.daniel,nik:source.score.nik}:null,managerRecords:Object.fromEntries(ORDER.map(k=>[k,Object.fromEntries([...FIELDS,...(finite(source.managers[k].europaLeagues)?["europaLeagues"]:[])].map(f=>[f,source.managers[k][f]]))])),seasons:copy(source.seasons),transfers:{status:"unavailable"},ui:{lifecycle},...golden({status:lifecycle,totalSeasons:source.totalSeasons,seasonsPlayed:source.seasons.length,totals:source.score}),...sp};
+    const frame={...bare(status),leagueId:source.leagueId??null,clubs:source.clubs?{daniel:source.clubs.daniel,nik:source.clubs.nik}:null,totalSeasons:source.totalSeasons??null,score:source.score?{daniel:source.score.daniel,nik:source.score.nik}:null,managerRecords:Object.fromEntries(ORDER.map(k=>[k,Object.fromEntries([...FIELDS,...(finite(source.managers[k].europaLeagues)?["europaLeagues"]:[])].map(f=>[f,source.managers[k][f]]))])),seasons:copy(source.seasons),transfers:{status:"unavailable"},ui:{lifecycle},...golden({status:lifecycle,totalSeasons:source.totalSeasons,seasonsPlayed:source.seasons.length,totals:source.score,seasons:source.seasons,rivalryId:source.rivalryId,setupConfirmedAt:source.setupConfirmedAt}),...sp};
     if(status==="partial"){
       if(!source.coverage||!Number.isInteger(source.coverage.readable)||!Number.isInteger(source.coverage.indexed))return bare("unavailable");
       frame.coverage=copy(source.coverage);
diff --git a/js/ruleBook.js b/js/ruleBook.js
index 21e71535c..2354bd1c0 100644
--- a/js/ruleBook.js
+++ b/js/ruleBook.js
@@ -139,7 +139,10 @@ function createScoringRuleSection(){
         ["Domestic league winner", "+3"],
         ["Main domestic cup winner", "+1"],
         ["100 league points or 100 league goals", "+1 MAX"],
-        ["League top scorer or top assist", "+1 MAX"]
+        ["League top scorer or top assist", "+1 MAX"],
+        // Prime Pack (Nik 2026-11-01): once a season, before the transfer window, in Showdowns that play it. The first right
+        // name scores 4 with one stat showing, 3 with two, 2 with three, 1 with four.
+        ["Prime Pack: first to name the masked Icon (4, 3, 2 or 1 by stage)", "+4 MAX"]
     ].forEach(([label, value]) => {
         const row = document.createElement("div");
         const labelElement = document.createElement("span");
@@ -153,7 +156,7 @@ function createScoringRuleSection(){
 
     const maximum = document.createElement("div");
     maximum.className = "ruleScoreMaximum";
-    maximum.innerHTML = "<span>MAXIMUM PER MANAGER / SEASON</span><strong>11</strong>";
+    maximum.innerHTML = "<span>MAXIMUM PER MANAGER / SEASON</span><strong>15</strong>";
 
     // r80 Europa League (owner rules, 2026-10-19). r86 (Nik 2026-10-29): the lines FIFA 17 already enforces (no CL and EL
     // in one season, the 3rd-place drop, EL by league position, only winning scores, best season 11/9) stay in the scoring
@@ -174,7 +177,8 @@ function createScoringRuleSection(){
     const goldenLabel = document.createElement("strong");
     goldenLabel.textContent = "GOLDEN SHOWDOWN";
     const goldenText = document.createElement("span");
-    goldenText.textContent = "Score 110 points in a 10-season Showdown (11 in every season) to win the gold trophy.";
+    // r87 Prime Pack (G Lead and Nik 2026-11-01): 15 a season with Prime Pack, so 150; older Showdowns keep 110.
+    goldenText.textContent = "Score 150 points in a 10-season Showdown (15 in every season) to win the gold trophy. A Showdown started before Prime Pack needs 110.";
     golden.append(goldenLabel, goldenText);
 
     // r86 Special Player (Nik 2026-10-29): the SP chip's own rule line, in the Golden Showdown's style. The live Showdown's
@@ -195,7 +199,17 @@ function createScoringRuleSection(){
     specialLive.hidden = true;
     special.append(specialLabel, specialText, specialLive);
 
-    article.append(header, scoring, maximum, golden, special, notes);
+    // r87 Prime Pack (Nik 2026-11-01): its own line in the same style. The values shown are the Icon's real card stats from the
+    // list; only which of the six shows at each stage is random (each once). The flag comes only with the full reveal.
+    const primePack = document.createElement("p");
+    primePack.className = "ruleGoldenShowdown rulePrimePack";
+    const primePackLabel = document.createElement("strong");
+    primePackLabel.textContent = "PRIME PACK";
+    const primePackText = document.createElement("span");
+    primePackText.textContent = "A masked Icon shows his position and one real card stat, then one more real stat each stage, up to four. Which stats show is random; the values never are. Each manager has two guesses. Name him first for 4, 3, 2 or 1 points. Nobody right after stage 4 scores 0. Then the whole card is revealed: the last two stats, his name, flag and overall.";
+    primePack.append(primePackLabel, primePackText);
+
+    article.append(header, scoring, maximum, golden, special, primePack, notes);
     return article;
 }
 
diff --git a/js/seasonEngine.js b/js/seasonEngine.js
index c1038cd64..fb42a3278 100644
--- a/js/seasonEngine.js
+++ b/js/seasonEngine.js
@@ -395,6 +395,7 @@ function getScoringBreakdownLines(scoring, options = {}){
     return [
         ["Champions League", scoring.championsLeague || 0],
         ...(scoring.europaLeague > 0 || options.europaRow === true ? [["Europa League", scoring.europaLeague || 0]] : []),
+        ...(scoring.primePack > 0 ? [["Prime Pack", scoring.primePack]] : []),
         ["League Title", scoring.leagueTitle || 0],
         ["Domestic Cup", scoring.domesticCup || 0],
         [buildPerformanceBonusLabel(scoring), scoring.performanceBonus || 0],
diff --git a/js/seasonFinalV10.js b/js/seasonFinalV10.js
index 62f50f1d4..fee2623d9 100644
--- a/js/seasonFinalV10.js
+++ b/js/seasonFinalV10.js
@@ -31,7 +31,7 @@
     if(p&&(r===reconciliation?p.acceptedRevisionKey===r.acceptedRevisionKey:closedHistoryBound(p,r))&&p.acceptedSeasons===frame.seasonsPlayed&&p.managerRecords?.playerOne?.totalPoints===frame.totals.daniel&&p.managerRecords?.playerTwo?.totalPoints===frame.totals.nik){
       // JOB-1005: the last accepted season of the verified history. Points and winner are read as the record stores them; nothing is computed.
       const last=p.seasonHistory[p.seasonHistory.length-1],lp=last?.playerOne?.scoring?.total,ln=last?.playerTwo?.scoring?.total;
-      if(last&&last.roundNumber===frame.seasonsPlayed&&number(lp)&&number(ln)&&lp>=0&&lp<=11&&ln>=0&&ln<=11&&ROLES[last.winner])frame.lastSeason={season:last.roundNumber,daniel:lp,nik:ln,winner:ROLES[last.winner]};
+      if(last&&last.roundNumber===frame.seasonsPlayed&&number(lp)&&number(ln)&&lp>=0&&lp<=15&&ln>=0&&ln<=15&&ROLES[last.winner])frame.lastSeason={season:last.roundNumber,daniel:lp,nik:ln,winner:ROLES[last.winner]};
       const trophies={};
       for(const [role,m] of [["playerOne","daniel"],["playerTwo","nik"]]){const rec=p.managerRecords[role];if(!["championsLeagues","europaLeagues","leagueTitles","domesticCups","totalTrophies"].every(k=>number(rec[k])))return freeze(frame);trophies[m]={championsLeague:rec.championsLeagues,europaLeague:rec.europaLeagues,leagueTitles:rec.leagueTitles,domesticCups:rec.domesticCups,total:rec.totalTrophies};}
       frame.trophies=trophies;frame.status="ready";frame.message="";
diff --git a/js/sharedCanonicalScoring.js b/js/sharedCanonicalScoring.js
index 3cb41ec2d..e9a8ea71a 100644
--- a/js/sharedCanonicalScoring.js
+++ b/js/sharedCanonicalScoring.js
@@ -12,12 +12,15 @@
   const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
   const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","seasonCommitRevision","seasonCommitContentHash","scoring","winner","contentHash"]);
   const HASH=/^sha256:[0-9a-f]{64}$/;
-  const RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,europaLeague:3});
+  const RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,europaLeague:3,primePack:4});
   // r80 Europa League: a sparse 8th result key. It is present only when that manager won the Europa League, and then it is exactly
   // true with championsLeague false (one manager's season is CL or EL, never both; the two managers are never compared). A result
   // without the key is the unchanged 7-key r79 shape, so every hash over old results stays byte-identical. The breakdown carries
   // europaLeague:3 only for such a result.
   const EUROPA_LEAGUE="europaLeague";
+  // r88 Prime Pack: a sparse 9th key, primePack 1 to 4 for the manager who named the season's masked Icon first
+  // (new R88 Showdowns only; the Rules tie it to that season's iconRounds record). Worth 4, 3, 2 or 1 by the stage of the right guess; a season scores at most 15.
+  const PRIME_PACK="primePack";
 
   function scFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
   function scPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
@@ -27,15 +30,15 @@
   function scCanonical(value){if(Array.isArray(value))return `[${value.map(scCanonical).join(",")}]`;if(scPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
   async function scHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scFail("CANONICAL_SCORING_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
   function scTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)scFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return value;}
-  function scEuropaLeague(value,code){if(!scPlain(value))scFail(code);const won=Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,won?[...RESULT_KEYS,EUROPA_LEAGUE]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scFail(code);return won;}
-  function scResult(value,teamCount){const europaLeague=scEuropaLeague(value,"CANONICAL_SCORING_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)scFail("CANONICAL_SCORING_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scFail("CANONICAL_SCORING_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{})};}
+  function scEuropaLeague(value,code){if(!scPlain(value))scFail(code);const won=Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,[...RESULT_KEYS,...(won?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,PRIME_PACK)?[PRIME_PACK]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scFail(code);if(Object.hasOwn(value,PRIME_PACK)&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))scFail(code);return won;}
+  function scResult(value,teamCount){const europaLeague=scEuropaLeague(value,"CANONICAL_SCORING_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)scFail("CANONICAL_SCORING_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scFail("CANONICAL_SCORING_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};}
   function scBreakdown(result){
     const hundredLeaguePoints=result.leaguePoints>=100,hundredLeagueGoals=result.leagueGoals>=100,topScorer=result.topScorer,topAssist=result.topAssist;
-    const breakdown={championsLeague:result.championsLeague?RULES.championsLeague:0,...(result.europaLeague===true?{europaLeague:RULES.europaLeague}:{}),leagueTitle:result.leaguePosition===1?RULES.leagueTitle:0,domesticCup:result.domesticCup?RULES.domesticCup:0,performanceBonus:(hundredLeaguePoints||hundredLeagueGoals)?RULES.performanceBonus:0,individualAwardsBonus:(topScorer||topAssist)?RULES.individualAwardsBonus:0,total:0,triggers:{hundredLeaguePoints,hundredLeagueGoals,topScorer,topAssist}};
-    breakdown.total=breakdown.championsLeague+(breakdown.europaLeague||0)+breakdown.leagueTitle+breakdown.domesticCup+breakdown.performanceBonus+breakdown.individualAwardsBonus;return breakdown;
+    const breakdown={championsLeague:result.championsLeague?RULES.championsLeague:0,...(result.europaLeague===true?{europaLeague:RULES.europaLeague}:{}),...(Number.isInteger(result.primePack)&&result.primePack>=1&&result.primePack<=RULES.primePack?{primePack:result.primePack}:{}),leagueTitle:result.leaguePosition===1?RULES.leagueTitle:0,domesticCup:result.domesticCup?RULES.domesticCup:0,performanceBonus:(hundredLeaguePoints||hundredLeagueGoals)?RULES.performanceBonus:0,individualAwardsBonus:(topScorer||topAssist)?RULES.individualAwardsBonus:0,total:0,triggers:{hundredLeaguePoints,hundredLeagueGoals,topScorer,topAssist}};
+    breakdown.total=breakdown.championsLeague+(breakdown.europaLeague||0)+(breakdown.primePack||0)+breakdown.leagueTitle+breakdown.domesticCup+breakdown.performanceBonus+breakdown.individualAwardsBonus;return breakdown;
   }
   function scWinner(results,scoring){if(scoring.playerOne.total>scoring.playerTwo.total)return "playerOne";if(scoring.playerTwo.total>scoring.playerOne.total)return "playerTwo";return "draw";}
-  function scValidateBreakdown(value){const europaLeague=scPlain(value)&&Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,europaLeague?[...BREAKDOWN_KEYS,EUROPA_LEAGUE]:BREAKDOWN_KEYS,"CANONICAL_SCORING_STATE_INVALID");if(europaLeague&&(value.europaLeague!==RULES.europaLeague||value.championsLeague!==0))scFail("CANONICAL_SCORING_STATE_INVALID");scExact(value.triggers,TRIGGER_KEYS,"CANONICAL_SCORING_STATE_INVALID");for(const key of ["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]){if(!Number.isInteger(value[key])||value[key]<0||value[key]>11)scFail("CANONICAL_SCORING_STATE_INVALID");}for(const key of TRIGGER_KEYS){if(typeof value.triggers[key]!=="boolean")scFail("CANONICAL_SCORING_STATE_INVALID");}return value;}
+  function scValidateBreakdown(value){const europaLeague=scPlain(value)&&Object.hasOwn(value,EUROPA_LEAGUE),icon=scPlain(value)&&Object.hasOwn(value,PRIME_PACK);scExact(value,[...BREAKDOWN_KEYS,...(europaLeague?[EUROPA_LEAGUE]:[]),...(icon?[PRIME_PACK]:[])],"CANONICAL_SCORING_STATE_INVALID");if(europaLeague&&(value.europaLeague!==RULES.europaLeague||value.championsLeague!==0))scFail("CANONICAL_SCORING_STATE_INVALID");if(icon&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=RULES.primePack))scFail("CANONICAL_SCORING_STATE_INVALID");scExact(value.triggers,TRIGGER_KEYS,"CANONICAL_SCORING_STATE_INVALID");for(const key of ["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]){if(!Number.isInteger(value[key])||value[key]<0||value[key]>15)scFail("CANONICAL_SCORING_STATE_INVALID");}for(const key of TRIGGER_KEYS){if(typeof value.triggers[key]!=="boolean")scFail("CANONICAL_SCORING_STATE_INVALID");}return value;}
 
   async function scCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonCommitModule=(typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit)}={}){
     const teams=scTeamCount(teamCount);if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")scFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");const commitProtocol=await seasonCommitModule.createProtocol({teamCount:teams,cryptoImpl});
diff --git a/js/sharedCareerAnalytics.js b/js/sharedCareerAnalytics.js
index 32ebda0fa..689b29238 100644
--- a/js/sharedCareerAnalytics.js
+++ b/js/sharedCareerAnalytics.js
@@ -72,7 +72,14 @@
     const europaLeague=season.playerOne.europaLeague===true||season.playerTwo.europaLeague===true?{europaLeague:{daniel:season.playerOne.europaLeague===true,nik:season.playerTwo.europaLeague===true}}:{};
     return {season:season.roundNumber,score:{daniel:season.playerOne.scoring.total,nik:season.playerTwo.scoring.total},winner:managerFor(season.winner),tiebreak:seasonTiebreak(season),leaguePosition:pair("leaguePosition"),leaguePoints:pair("leaguePoints"),leagueGoals:pair("leagueGoals"),...europaLeague};
   }
-  function accumulate(record,season,role,sums){
+  // r87 Prime Pack: a perfect season is the Showdown's own maximum, 15 for a Showdown confirmed on or after the Prime Pack
+  // boundary (js/iconGuess.js fromMs) and 11 before it; with no confirm time, a season with Prime Pack or above 11 means 15.
+  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  function seasonMaxOf(entry,seasons){
+    if(Number.isFinite(entry.setupConfirmedAt))return entry.setupConfirmedAt>=PRIME_PACK_FROM_MS?15:11;
+    return seasons.some(season=>ROLES.some(role=>season[role]&&(season[role].primePack!==undefined||season[role].scoring.total>11)))?15:11;
+  }
+  function accumulate(record,season,role,sums,max=11){
     const r=season[role],score=r.scoring.total;
     record.seasons+=1;record.careerPoints+=score;
     sums.points+=r.leaguePoints;sums.goals+=r.leagueGoals;
@@ -85,7 +92,7 @@
     if(r.leagueGoals>=100)record.hundredGoalSeasons+=1;
     if(r.topScorer)record.topScorerSeasons+=1;
     if(r.topAssist)record.topAssistSeasons+=1;
-    if(score===11)record.perfectSeasons+=1;
+    if(score===max)record.perfectSeasons+=1;
     record.performanceBonuses+=r.scoring.performanceBonus;
     record.awardsBonuses+=r.scoring.individualAwardsBonus;
     for(const [key,value] of [["bestSeasonScore",score],["bestLeaguePoints",r.leaguePoints],["bestLeagueGoals",r.leagueGoals],["bestLeaguePosition",r.leaguePosition]]){
@@ -131,10 +138,11 @@
       // agrees with History/Legacy and never depends on whether this page holds the live History. An unfinished Showdown
       // keeps its row and shows on THIS SHOWDOWN / Rivalry Statistics. The labelled current-only view (interimLabel) is that
       // live Showdown on its own, so it still counts it.
+      const seasonMax=seasonMaxOf(entry,p.seasonHistory);
       if(classification==="completed"||interimLabel!==null)for(const season of p.seasonHistory){
         for(let i=0;i<ROLES.length;i+=1){
           const role=ROLES[i],manager=MANAGERS[i],r=season[role];
-          accumulate(managers[manager],season,role,sums[manager]);
+          accumulate(managers[manager],season,role,sums[manager],seasonMax);
           const ref={rivalryId:entry.rivalryId,season:season.roundNumber};
           for(const [index,value] of [r.scoring.total,r.leaguePoints,r.leagueGoals].entries())candidates[index].push({manager,value,ref});
         }
diff --git a/js/sharedHistoryConvergence.js b/js/sharedHistoryConvergence.js
index ef1982a41..102388b04 100644
--- a/js/sharedHistoryConvergence.js
+++ b/js/sharedHistoryConvergence.js
@@ -26,8 +26,8 @@
   function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
   function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
   function hcTeamCount(leagueId){const n=LEAGUE_TEAM_COUNTS[String(leagueId||"").trim()];if(!Number.isInteger(n))hcFail("HISTORY_CONVERGENCE_LEAGUE_INVALID");return n;}
-  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,won?[...RESULT_KEYS,EUROPA_LEAGUE]:RESULT_KEYS,"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");return won;}
-  function hcResultKeys(value){return Object.hasOwn(value,EUROPA_LEAGUE)?[...RESULT_KEYS,EUROPA_LEAGUE]:RESULT_KEYS;}
+  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,hcResultKeys(value),"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");return won;}
+  function hcResultKeys(value){return [...RESULT_KEYS,...(Object.hasOwn(value,EUROPA_LEAGUE)?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])];}
   function hcResult(value,teamCount){
     hcEuropaLeague(value);
     const maxPoints=(teamCount-1)*2*3;
@@ -37,20 +37,21 @@
     return Object.fromEntries(hcResultKeys(value).map(key=>[key,value[key]]));
   }
   function hcExpectedScore(result){
-    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0;
+    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0,primePack=Number.isInteger(result.primePack)?result.primePack:0;
     const leagueTitle=result.leaguePosition===1?3:0;
     const domesticCup=result.domesticCup?1:0;
     const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
     const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
-    return {championsLeague,...(europaLeague?{europaLeague}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
+    return {championsLeague,...(europaLeague?{europaLeague}:{}),...(primePack?{primePack}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+primePack+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
   }
   function hcScore(value,result){
     if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
-    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE);
-    const scoreKeys=hasEuropaLeague?[...SCORE_KEYS,EUROPA_LEAGUE]:SCORE_KEYS,allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
+    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE),hasPrimePack=Object.hasOwn(value,"primePack");
+    // r87 Prime Pack: the sparse primePack breakdown key (1 to 4) sits beside the others exactly when the result carries it.
+    const scoreKeys=[...SCORE_KEYS,...(hasEuropaLeague?[EUROPA_LEAGUE]:[]),...(hasPrimePack?["primePack"]:[])],allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
     if(keys.length!==allowed.length||allowed.some(key=>!Object.hasOwn(value,key)))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
     const expected=hcExpectedScore(result);
-    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
+    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE)||hasPrimePack!==Object.hasOwn(expected,"primePack"))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
     for(const key of scoreKeys){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
     if(hasTriggers){
       hcExact(value.triggers,TRIGGER_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
@@ -99,7 +100,7 @@
   function hcAccumulate(record,season,role){
     const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
     if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
-    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score===11)record.perfectSeasons+=1;
+    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score>=11)record.perfectSeasons+=1;
     record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
   }
   function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues+record.europaLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
diff --git a/js/sharedSeasonCommit.js b/js/sharedSeasonCommit.js
index e706fac4c..187dda916 100644
--- a/js/sharedSeasonCommit.js
+++ b/js/sharedSeasonCommit.js
@@ -18,7 +18,7 @@
   function sscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
   function sscPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
   function sscExact(value,keys,code="SEASON_COMMIT_VALUE_INVALID"){if(!sscPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))sscFail(code);return value;}
-  function sscEuropaLeague(value,code){if(!sscPlain(value))sscFail(code);const won=Object.hasOwn(value,"europaLeague");sscExact(value,won?[...RESULT_KEYS,"europaLeague"]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))sscFail(code);return won;}
+  function sscEuropaLeague(value,code){if(!sscPlain(value))sscFail(code);const won=Object.hasOwn(value,"europaLeague");sscExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))sscFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))sscFail(code);return won;}
   function sscClone(value){return JSON.parse(JSON.stringify(value));}
   function sscFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sscFreeze);Object.freeze(value);}return value;}
   function sscCanonical(value){if(Array.isArray(value))return `[${value.map(sscCanonical).join(",")}]`;if(sscPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${sscCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
@@ -26,7 +26,7 @@
   function sscRole(value){if(!ROLES.includes(value))sscFail("SEASON_COMMIT_ROLE_INVALID");return value;}
   function sscTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)sscFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return value;}
   function sscSetup(value){if(!sscPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return value;}
-  function sscResult(value,teamCount){const europaLeague=sscEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)sscFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")sscFail("SEASON_COMMIT_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{})};}
+  function sscResult(value,teamCount){const europaLeague=sscEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)sscFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")sscFail("SEASON_COMMIT_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};}
   function sscReceipt(value){sscExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_COMMIT_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||!["commit-season","acknowledge-season"].includes(value.type)||!HASH.test(value.commandHash))sscFail("SEASON_COMMIT_STATE_INVALID");return value;}
   function sscCommand(value){if(!sscPlain(value))sscFail("SEASON_COMMIT_COMMAND_INVALID");sscExact(value,["type","operationId","baseRevision"],"SEASON_COMMIT_COMMAND_INVALID");if(!["commit-season","acknowledge-season"].includes(value.type)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||value.baseRevision>3)sscFail("SEASON_COMMIT_COMMAND_INVALID");return {type:value.type,operationId:value.operationId,baseRevision:value.baseRevision};}
 
diff --git a/js/sharedSeasonResults.js b/js/sharedSeasonResults.js
index 8ecdeb5c1..3f15976d2 100644
--- a/js/sharedSeasonResults.js
+++ b/js/sharedSeasonResults.js
@@ -18,7 +18,7 @@
   function ssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
   function ssrPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
   function ssrExact(value,keys,code="SEASON_RESULTS_VALUE_INVALID"){if(!ssrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrFail(code);return value;}
-  function ssrEuropaLeague(value,code){if(!ssrPlain(value))ssrFail(code);const won=Object.hasOwn(value,"europaLeague");ssrExact(value,won?[...RESULT_KEYS,"europaLeague"]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrFail(code);return won;}
+  function ssrEuropaLeague(value,code){if(!ssrPlain(value))ssrFail(code);const won=Object.hasOwn(value,"europaLeague");ssrExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))ssrFail(code);return won;}
   function ssrClone(value){return JSON.parse(JSON.stringify(value));}
   function ssrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrFreeze);Object.freeze(value);}return value;}
   function ssrCanonical(value){if(Array.isArray(value))return `[${value.map(ssrCanonical).join(",")}]`;if(ssrPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
@@ -39,7 +39,7 @@
     if(!Number.isInteger(points)||points<0||points>maxPoints)ssrFail("SEASON_RESULTS_POINTS_INVALID");
     if(!Number.isInteger(goals)||goals<0||goals>300)ssrFail("SEASON_RESULTS_GOALS_INVALID");
     for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrFail("SEASON_RESULTS_PAYLOAD_INVALID");}
-    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{})};
+    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};
   }
   function ssrReceipt(value){ssrExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_RESULTS_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||value.type!=="publish-result"||!HASH.test(value.commandHash))ssrFail("SEASON_RESULTS_STATE_INVALID");return value;}
   async function ssrVerifyState(value,teamCount,cryptoImpl){
diff --git a/js/sparkCompletedShowdownReader.js b/js/sparkCompletedShowdownReader.js
index 2c198c295..4a6a07188 100644
--- a/js/sparkCompletedShowdownReader.js
+++ b/js/sparkCompletedShowdownReader.js
@@ -39,10 +39,10 @@
   function csrEnvelopeCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(csrEnvelopeCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=csrEnvelopeCanonical(value[key]);return out;}return value;}
   async function csrDigest(text,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")csrFail("COMPLETED_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(text));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
   function csrSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
-  function csrEuropaLeague(value,code){if(!csrPlain(value))csrFail(code);const won=Object.hasOwn(value,"europaLeague");csrExact(value,won?[...RESULT_KEYS,"europaLeague"]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))csrFail(code);return won;}
+  function csrEuropaLeague(value,code){if(!csrPlain(value))csrFail(code);const won=Object.hasOwn(value,"europaLeague");csrExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))csrFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))csrFail(code);return won;}
   // r82: live Firestore returns map fields in its own order (the emulator keeps the written order), so every result is
   // rebuilt in one fixed key order before any comparison, projection or replay. Order never changes a hash (sorted canonical).
-  function csrOrdered(value){const out={};for(const key of RESULT_KEYS)out[key]=value[key];if(Object.hasOwn(value,"europaLeague"))out.europaLeague=value.europaLeague;return out;}
+  function csrOrdered(value){const out={};for(const key of RESULT_KEYS)out[key]=value[key];if(Object.hasOwn(value,"europaLeague"))out.europaLeague=value.europaLeague;if(Object.hasOwn(value,"primePack"))out.primePack=value.primePack;return out;}
   function csrResult(value,teamCount){csrEuropaLeague(value,"COMPLETED_SEASON_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)csrFail("COMPLETED_SEASON_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")csrFail("COMPLETED_SEASON_INVALID");}return csrOrdered(value);}
 
   function csrState(status,fields={}){
diff --git a/js/sparkPrivatePairing.js b/js/sparkPrivatePairing.js
index 0001fe53a..ce1d5ab83 100644
--- a/js/sparkPrivatePairing.js
+++ b/js/sparkPrivatePairing.js
@@ -693,7 +693,7 @@ async function revokePairing(options={}){
   // pricing, "Listeners and rules"), so every server delivery is billed its document plus its lookups. A write is priced at
   // every document its create or update rule can reach, once per request (a transaction is one request): an upper bound.
   // tests/contracts/r86-billed-counter-contracts.cjs fails when the Rules change and this table is not regenerated.
-  const FSB_RULES_SHA256="670ab4e63790c65c2d42f78bfbc50354cb560861a47696a4a1bc048205c2c1ef";
+  const FSB_RULES_SHA256="98a3184328c89c026823ff2f9363856867c5f327c0da15320887ce670b23495e";
   // BEGIN generated Rules lookup table (paths are priced here, never read or written by this module).
   const FSB_RULES_LOOKUPS=Object.freeze([
       ["accounts/*",0,0,[]],
@@ -717,7 +717,8 @@ async function revokePairing(options={}){
       ["rivalries/*/transferChallenges/*/roulette/*",1,1,["rivalries/{rivalryId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
       ["rivalries/*/transferChallenges/*/roles/*",2,3,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/transferChallenges/{transferId}"]],
       ["rivalries/*/seasonResults/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{role}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/leagueProjection"]],
-      ["rivalries/*/seasonResults/*/roles/*",2,3,["rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}"]],
+      ["rivalries/*/seasonResults/*/roles/*",2,3,["rivalries/{rivalryId}","rivalries/{rivalryId}/primePackRounds/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}"]],
+      ["rivalries/*/primePackRounds/*",1,1,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/sessions/{after.activeSessionId}"]],
       ["rivalries/*/seasonCommits/*",1,2,["accounts/{@self}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}","rivalries/{rivalryId}/seasonResults/{seasonId}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerOne'}","rivalries/{rivalryId}/seasonResults/{seasonId}/roles/{'playerTwo'}","rivalries/{rivalryId}/sessions/{after.activeSessionId}","rivalries/{rivalryId}/sharedSetup/authoritative"]],
       ["rivalries/*/meters/*",1,2,["rivalries/{rivalryId}"]],
       ["rivalries/*/sessions/*",2,2,["accounts/{@pair0}","accounts/{@pair1}","accounts/{@self}/devices/{after.updatedByDeviceId}","rivalries/{rivalryId}"]],
diff --git a/js/sparkSharedSeasonCommit.js b/js/sparkSharedSeasonCommit.js
index 590ab2fe1..841142e38 100644
--- a/js/sparkSharedSeasonCommit.js
+++ b/js/sparkSharedSeasonCommit.js
@@ -40,7 +40,7 @@
   function scpUid(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)scpFail("SEASON_COMMIT_AUTH_REQUIRED");return id;}
   function scpNow(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)scpFail("SEASON_COMMIT_CLOCK_INVALID");return n;}
   function scpTeamCount(setup){const clubs=scpModules.catalogModule?.catalog?.[setup?.leagueId];if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)scpFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return clubs.length;}
-  function scpEuropaLeague(value,code){if(!scpPlain(value))scpFail(code);const won=Object.hasOwn(value,"europaLeague");scpExact(value,won?[...RESULT_KEYS,"europaLeague"]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scpFail(code);return won;}
+  function scpEuropaLeague(value,code){if(!scpPlain(value))scpFail(code);const won=Object.hasOwn(value,"europaLeague");scpExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scpFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))scpFail(code);return won;}
   function scpResult(value,teamCount){scpEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)scpFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scpFail("SEASON_COMMIT_RESULTS_INVALID");}return scpClone(value);}
   function scpSdk(options){if(!options.firestore)scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");}return options.firebaseSdk;}
   function scpPath(sdk,db,...parts){return sdk.doc(db,...parts);}
diff --git a/js/sparkSharedSeasonResults.js b/js/sparkSharedSeasonResults.js
index 4a9821430..928ca8f37 100644
--- a/js/sparkSharedSeasonResults.js
+++ b/js/sparkSharedSeasonResults.js
@@ -26,7 +26,7 @@
   function ssrpSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
   function ssrpPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
   function ssrpExact(value,keys,code="SEASON_RESULTS_PROVIDER_STATE_INVALID"){if(!ssrpPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrpFail(code);return value;}
-  function ssrpEuropaLeague(value,code){if(!ssrpPlain(value))ssrpFail(code);const won=Object.hasOwn(value,"europaLeague");ssrpExact(value,won?[...RESULT_KEYS,"europaLeague"]:RESULT_KEYS,code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrpFail(code);return won;}
+  function ssrpEuropaLeague(value,code){if(!ssrpPlain(value))ssrpFail(code);const won=Object.hasOwn(value,"europaLeague");ssrpExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrpFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))ssrpFail(code);return won;}
   function ssrpClone(value){return JSON.parse(JSON.stringify(value));}
   function ssrpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrpFreeze);Object.freeze(value);}return value;}
   function ssrpCanonical(value){if(Array.isArray(value))return `[${value.map(ssrpCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrpCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
@@ -48,7 +48,7 @@
     const position=ssrpNumber(value.leaguePosition),points=ssrpNumber(value.leaguePoints),goals=ssrpNumber(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
     if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
     for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");}
-    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{})};
+    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};
   }
 
   function ssrpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")ssrpFail("SEASON_RESULTS_MANAGER_INACTIVE");}
diff --git a/js/sparkTerminalClose.js b/js/sparkTerminalClose.js
index 68abdf3ab..8183bd9df 100644
--- a/js/sparkTerminalClose.js
+++ b/js/sparkTerminalClose.js
@@ -33,8 +33,8 @@
   function stcRefs(operation){const sdk=operation.firebaseSdk,db=operation.firestore;return Object.freeze({account:sdk.doc(db,"accounts",operation.accountId),device:sdk.doc(db,"accounts",operation.accountId,"devices",operation.deviceId),rivalry:sdk.doc(db,"rivalries",operation.rivalryId),session:sdk.doc(db,"rivalries",operation.rivalryId,"sessions",operation.sessionId),setup:sdk.doc(db,"rivalries",operation.rivalryId,"sharedSetup","authoritative"),commit:season=>sdk.doc(db,"rivalries",operation.rivalryId,"seasonCommits",`season_${season}`)});}
   function stcEntitledRivalry(rivalry,accountId){const ids=Array.isArray(rivalry.data.authorizedAccountIds)?rivalry.data.authorizedAccountIds:[],slots=Array.isArray(rivalry.data.managerSlots)?rivalry.data.managerSlots:[];if(ids.length!==2||new Set(ids).size!==2||!ids.includes(accountId)||slots.length!==2||slots.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")||!ids.every(id=>slots.some(slot=>slot.accountId===id)))stpFail("TERMINAL_CLOSE_RIVALRY_AUTHORITY_INVALID");return ids;}
   function stcExactObject(value,keys){return Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)));}
-  function stcEuropaLeague(value){const won=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"europaLeague"));if(!stcExactObject(value,won?[...RESULT_KEYS,"europaLeague"]:RESULT_KEYS)||(won&&(value.europaLeague!==true||value.championsLeague!==false)))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");return won;}
-  function stcScoreResult(value){const europaLeague=stcEuropaLeague(value);for(const key of ["leaguePosition","leaguePoints","leagueGoals"]){if(!Number.isInteger(value[key]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}if(value.leaguePosition<1||value.leaguePosition>20||value.leaguePoints<0||value.leaguePoints>114||value.leagueGoals<0||value.leagueGoals>300)stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}return (value.championsLeague?5:0)+(europaLeague?3:0)+(value.leaguePosition===1?3:0)+(value.domesticCup?1:0)+((value.leaguePoints>=100||value.leagueGoals>=100)?1:0)+((value.topScorer||value.topAssist)?1:0);}
+  function stcEuropaLeague(value){const won=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"europaLeague"));const icon=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"primePack"));if(!stcExactObject(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(icon?["primePack"]:[])])||(won&&(value.europaLeague!==true||value.championsLeague!==false))||(icon&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4)))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");return won;}
+  function stcScoreResult(value){const europaLeague=stcEuropaLeague(value);for(const key of ["leaguePosition","leaguePoints","leagueGoals"]){if(!Number.isInteger(value[key]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}if(value.leaguePosition<1||value.leaguePosition>20||value.leaguePoints<0||value.leaguePoints>114||value.leagueGoals<0||value.leagueGoals>300)stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}return (value.championsLeague?5:0)+(europaLeague?3:0)+(Number.isInteger(value.primePack)?value.primePack:0)+(value.leaguePosition===1?3:0)+(value.domesticCup?1:0)+((value.leaguePoints>=100||value.leagueGoals>=100)?1:0)+((value.topScorer||value.topAssist)?1:0);}
   function stcCommit(value,rivalryId,season){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.rivalryId!==rivalryId||value.seasonNumber!==season||value.runtimeRevision!=="1.9.1-r10"||value.phase!=="ACKNOWLEDGED"||value.revision!==3||!stcExactObject(value.results,["playerOne","playerTwo"]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");return Object.freeze({playerOne:stcScoreResult(value.results.playerOne),playerTwo:stcScoreResult(value.results.playerTwo)});}
   function stcSetup(value,rivalryId,totalSeasons){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||value.totalSeasons!==totalSeasons)stpFail("TERMINAL_CLOSE_SETUP_INVALID");return value;}
   function stcProgress(value,totalSeasons){if(!stcExactObject(value,PROGRESS_KEYS)||value.schemaVersion!==1||value.runtimeRevision!=="1.9.1-r18"||value.totalSeasons!==totalSeasons||!Number.isInteger(value.acceptedThroughSeason)||value.acceptedThroughSeason<1||value.acceptedThroughSeason>totalSeasons||!stcExactObject(value.managerTotals,["playerOne","playerTwo"])||!Number.isInteger(value.managerTotals.playerOne)||value.managerTotals.playerOne<0||!Number.isInteger(value.managerTotals.playerTwo)||value.managerTotals.playerTwo<0||(value.closedSessionRevision!==null&&(!Number.isInteger(value.closedSessionRevision)||value.closedSessionRevision<1)))stpFail("TERMINAL_CLOSE_PROGRESS_INVALID");return value;}
diff --git a/js/touchlineGazette.js b/js/touchlineGazette.js
index 7f9b2b0bd..f0ae6b780 100644
--- a/js/touchlineGazette.js
+++ b/js/touchlineGazette.js
@@ -31,6 +31,16 @@
   const OTHER=Object.freeze({playerOne:"playerTwo",playerTwo:"playerOne"});
   const LENGTHS=Object.freeze([1,3,5,10]);
   const GOLDEN=Object.freeze({seasons:10,points:110});
+  // r87 Prime Pack (G Lead and Nik 2026-11-01): a Showdown that plays Prime Pack scores up to 15 a season (11 + up to 4), so
+  // its race counts 15 a season left and its Golden Showdown is 150; a Showdown confirmed before Prime Pack keeps 11 and 110.
+  // PRIME_PACK_FROM_MS is js/iconGuess.js fromMs (tests/contracts/r87-prime-pack-totals-contracts.cjs keeps them equal).
+  const SEASON_MAX=Object.freeze({before:11,primePack:15}),PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
+  // true/false when this Showdown's confirm time is known (given, or the live Setup when it is this Showdown), else null.
+  function tgPrimePack(rivalryId,confirmedAt){
+    if(Number.isFinite(confirmedAt))return confirmedAt>=PRIME_PACK_FROM_MS;
+    try{const setup=root.CareerModeProductionSharedShowdownSetup?.getState?.();if(setup&&setup.rivalryId===rivalryId&&setup.setup?.phase==="SHOWDOWN_CONFIRMED"&&Number.isFinite(setup.setupUpdatedAtMs))return setup.setupUpdatedAtMs>=PRIME_PACK_FROM_MS;}catch(_error){}
+    return null;
+  }
   const TROPHY_ART=Object.freeze({"champions-league":"TRO_CONTINENTAL","europa-league":"TRO_EUROPA","league-title":"TRO_LEAGUE_TITLE","domestic-cup":"TRO_DOMESTIC_CUP"});
   // A headline, story, quote or caption that talks about silverware is not printed for a winner whose season had no
   // trophy (a 1 or 2 point win from the bonuses alone); final pages never print "next season" lines.
@@ -119,34 +129,39 @@
     };
   }
   const trophyCount=items=>["champions-league","europa-league","league-title","domestic-cup"].filter(k=>items[k]).length;
-  // Every accepted season up to `through`, checked: scores 0-11, and the stored winner is the one the scores give (equal is a draw).
-  function readHistory(projection,through){
+  // Every accepted season up to `through`, checked: scores 0-15, and the stored winner is the one the scores give (equal is a draw).
+  // max is this Showdown's season maximum: from primePack when known, else 15 once any season has a Prime Pack point or
+  // scored over 11, else 11.
+  function readHistory(projection,through,primePack=null){
     if(!plain(projection)||!Array.isArray(projection.seasonHistory)||!LENGTHS.includes(projection.totalSeasons)||!plain(projection.managerRecords))return null;
     const T=projection.totalSeasons;if(!int(through,1,T)||projection.seasonHistory.length<through)return null;
     const clubs={};for(const role of ROLES){const club=projection.managerRecords[role]?.club;if(typeof club!=="string"||!club.trim())return null;clubs[role]=club;}
     const seasons=[];
     for(let i=0;i<through;i+=1){
       const row=projection.seasonHistory[i];if(!plain(row)||row.roundNumber!==i+1||!plain(row.playerOne)||!plain(row.playerTwo))return null;
-      const a=row.playerOne.scoring?.total,b=row.playerTwo.scoring?.total;if(!int(a,0,11)||!int(b,0,11))return null;
+      const a=row.playerOne.scoring?.total,b=row.playerTwo.scoring?.total;if(!int(a,0,SEASON_MAX.primePack)||!int(b,0,SEASON_MAX.primePack))return null;
       const winner=a>b?"playerOne":b>a?"playerTwo":"draw";if(row.winner!==winner)return null;
       seasons.push({number:i+1,score:{playerOne:a,playerTwo:b},winner,items:{playerOne:seasonItems(row.playerOne),playerTwo:seasonItems(row.playerTwo)}});
     }
-    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons};
+    // unknown confirm time: a Prime Pack point, or a season over 11, can only come from a Showdown that plays Prime Pack
+    const sides=projection.seasonHistory.flatMap(row=>plain(row)?[row.playerOne,row.playerTwo].filter(plain):[]);
+    const pack=primePack===true||primePack===false?primePack:sides.some(side=>Number.isInteger(side.primePack)||Number.isInteger(side.scoring?.primePack)||(Number.isInteger(side.scoring?.total)&&side.scoring.total>SEASON_MAX.before));
+    return {rivalryId:String(projection.rivalryId||""),totalSeasons:T,clubs,seasons,max:pack?SEASON_MAX.primePack:SEASON_MAX.before};
   }
   const totalsOf=seasons=>seasons.reduce((t,s)=>({playerOne:t.playerOne+s.score.playerOne,playerTwo:t.playerTwo+s.score.playerTwo}),{playerOne:0,playerTwo:0});
   function spOf(sp){return plain(sp)&&plain(sp.daniel)&&plain(sp.nik)&&typeof sp.daniel.name==="string"&&sp.daniel.name&&typeof sp.nik.name==="string"&&sp.nik.name?{daniel:sp.daniel.name,nik:sp.nik.name}:null;}
 
   // ---------- the Gazette desk (2.0.0): plain facts worked out from the seasons, never from copy ----------
   // THE RACE: where the Showdown stands after this paper's season, with what is still possible (a season is worth at most
-  // 11 to each manager, so a lead bigger than 11 x the seasons left cannot be caught; a lead of exactly that can only be
+  // 11 to each manager, 15 with Prime Pack, so a lead bigger than that x the seasons left cannot be caught; a lead of exactly that can only be
   // levelled, and level is a draw: no tiebreak). The RECORD BOOK: seasons won, trophies, best season, streaks, perfect seasons.
   const plural=(n,word)=>`${n} ${word}${n===1?"":"s"}`;
   const both=list=>list.length===2?`${list[0]} and ${list[1]}`:list[0];
-  function recordsOf(seasons){
+  function recordsOf(seasons,max=SEASON_MAX.before){
     const rec={};
     for(const role of ROLES){
       const r={wins:0,trophies:0,perfect:0,best:0};
-      for(const s of seasons){const it=s.items[role];r.wins+=s.winner===role?1:0;r.trophies+=trophyCount(it);r.perfect+=s.score[role]===11?1:0;r.best=Math.max(r.best,s.score[role]);}
+      for(const s of seasons){const it=s.items[role];r.wins+=s.winner===role?1:0;r.trophies+=trophyCount(it);r.perfect+=s.score[role]===max?1:0;r.best=Math.max(r.best,s.score[role]);}
       rec[role]=r;
     }
     let streak=null;
@@ -159,11 +174,11 @@
   function raceFor(facts,N,final){
     const T=facts.totalSeasons,seasons=facts.seasons.slice(0,N),totals=totalsOf(seasons);
     const gap=Math.abs(totals.playerOne-totals.playerTwo),leader=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":null;
-    const left=T-N,pointsLeft=left*11;
+    const left=T-N,pointsLeft=left*facts.max,goldenPoints=GOLDEN.seasons*facts.max;
     let line;
     if(final){
       line=leader?`${NAMES[leader]} wins the Showdown ${totals[leader]} to ${totals[OTHER[leader]]}, by ${plural(gap,"point")}.`
-        :totals.playerOne>=GOLDEN.points&&T===GOLDEN.seasons?`Level on ${totals.playerOne} points each after ${plural(T,"season")}: a drawn Showdown, and a Golden Showdown for both.`
+        :totals.playerOne>=goldenPoints&&T===GOLDEN.seasons?`Level on ${totals.playerOne} points each after ${plural(T,"season")}: a drawn Showdown, and a Golden Showdown for both.`
         :`Level on ${plural(totals.playerOne,"point")} each after ${plural(T,"season")}: a drawn Showdown, honours even.`;
     }else if(!leader){
       line=`All square on ${plural(totals.playerOne,"point")} each. ${plural(left,"season")} to go, ${pointsLeft} points still to play for on each side.`;
@@ -179,7 +194,7 @@
   }
   // One line each, most telling first; only facts that are true for this Showdown so far are printed.
   function recordBook(facts,N,final){
-    const seasons=facts.seasons.slice(0,N),r=recordsOf(seasons),out=[];
+    const seasons=facts.seasons.slice(0,N),r=recordsOf(seasons,facts.max),out=[];
     // (never beside level totals, where a seasons-won count could read as a tiebreak: level is a draw)
     const lvl=totalsOf(seasons);
     if(N>=2&&lvl.playerOne!==lvl.playerTwo)out.push(`Seasons won: ${NAMES.playerOne} ${r.playerOne.wins} · ${NAMES.playerTwo} ${r.playerTwo.wins}${r.draws?` · drawn ${r.draws}`:""}`);
@@ -188,8 +203,8 @@
     if(N>=2){const best=Math.max(r.playerOne.best,r.playerTwo.best);if(best>0)out.push(`Best season${final?"":" so far"}: ${plural(best,"point")}, ${both(ROLES.filter(x=>r[x].best===best).map(x=>NAMES[x]))}`);}
     if(N>=2&&r.biggest&&r.biggest.margin>=3)out.push(`Biggest season win: ${NAMES[r.biggest.role]} ${r.biggest.score[r.biggest.role]}–${r.biggest.score[OTHER[r.biggest.role]]} in season ${r.biggest.season}`);
     const perfect=ROLES.filter(x=>r[x].perfect>0);
-    if(perfect.length)out.push(`Perfect 11s: ${perfect.map(x=>`${NAMES[x]} ${r[x].perfect}`).join(" · ")}`);
-    // the Golden Showdown (110 over ten seasons) needs 11 in every season: it is "on" only while a manager has dropped nothing
+    if(perfect.length)out.push(`Perfect ${facts.max}s: ${perfect.map(x=>`${NAMES[x]} ${r[x].perfect}`).join(" · ")}`);
+    // the Golden Showdown (110 over ten seasons, 150 with Prime Pack) needs the maximum in every season: it is "on" only while a manager has dropped nothing
     if(!final&&facts.totalSeasons===GOLDEN.seasons){const alive=ROLES.filter(x=>r[x].perfect===N);if(alive.length)out.push(`Golden watch: ${both(alive.map(x=>NAMES[x]))} still perfect`);}
     return out;
   }
@@ -247,15 +262,15 @@
     }
     if(N>=2&&level)list.push("level-overall");
     // shown on the paper before the last season, while the trailer can still win the Showdown in it (a season is worth at
-    // most 11 and equal totals are a draw, so a gap of 11 can only be levelled, never turned)
-    if(T>=3&&N===T-1&&gap<=10)list.push("final-season-decider");
+    // most 11, or 15 with Prime Pack, and equal totals are a draw, so a gap of a full season can only be levelled, never turned)
+    if(T>=3&&N===T-1&&gap<facts.max)list.push("final-season-decider");
     return list;
   }
   // Each paper is built after the papers of the Showdown's earlier seasons (the same rows on both phones), so it can pass
   // over the rows they printed.
-  function seasonEdition({projection,seasonNumber,specialPlayers=null}={}){
+  function seasonEdition({projection,seasonNumber,specialPlayers=null,primePack=null}={}){
     const C=tgCopy(),P=tgPages();if(!C||!P)return null;
-    const N=seasonNumber,facts=readHistory(projection,N);if(!facts||N>=facts.totalSeasons)return null;
+    const N=seasonNumber,facts=readHistory(projection,N,primePack);if(!facts||N>=facts.totalSeasons)return null;
     const used=new Set();let edition=null;
     for(let k=1;k<=N;k+=1)edition=buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,k===N?specialPlayers:null,used);
     return edition;
@@ -318,16 +333,17 @@
   }
 
   // ---------- FINAL edition ----------
-  function finalEdition({projection,final=null,specialPlayers=null}={}){
+  function finalEdition({projection,final=null,specialPlayers=null,primePack=null}={}){
     const C=tgCopy(),P=tgPages();if(!C||!P||!plain(projection))return null;
-    const T=projection.totalSeasons,facts=readHistory(projection,T);if(!facts||facts.seasons.length!==T)return null;
+    const T=projection.totalSeasons,facts=readHistory(projection,T,primePack);if(!facts||facts.seasons.length!==T)return null;
     const totals=totalsOf(facts.seasons),W=totals.playerOne>totals.playerTwo?"playerOne":totals.playerTwo>totals.playerOne?"playerTwo":"draw";
     // The Final Winner frame, when given, must say the same (it reads the reconciled winner; the paper never disagrees with it).
     if(final){const fw={daniel:"playerOne",nik:"playerTwo",draw:"draw"}[final.winner];if(fw!==W)return null;if(plain(final.totals)&&(final.totals.daniel!==totals.playerOne||final.totals.nik!==totals.playerTwo))return null;}
     const draw=W==="draw",L=draw?null:OTHER[W],margin=Math.abs(totals.playerOne-totals.playerTwo);
-    // A Golden Showdown is a manager on 110 over ten seasons: the winner, or both managers on a 110-110 draw (still a draw,
-    // no tiebreak; the paper is the gold edition with the drawn copy).
-    const goldenRoles=T===GOLDEN.seasons?ROLES.filter(role=>totals[role]>=GOLDEN.points):[];
+    // A Golden Showdown is a manager on 110 over ten seasons (150 with Prime Pack): the winner, or both managers on a 110-110
+    // (150-150) draw (still a draw, no tiebreak; the paper is the gold edition with the drawn copy).
+    const goldenPoints=GOLDEN.seasons*facts.max;
+    const goldenRoles=T===GOLDEN.seasons?ROLES.filter(role=>totals[role]>=goldenPoints):[];
     const golden=goldenRoles.length>0;
     const used=new Set();for(let k=1;k<T;k+=1)buildSeason({...facts,seasons:facts.seasons.slice(0,k)},k,null,used);
     const key=`${facts.rivalryId}|final|${T}`,walk=walker(facts.rivalryId,"final",0,used);
@@ -349,7 +365,7 @@
       if(T>=3){
         const before=totalsOf(facts.seasons.slice(0,T-1));if(before[W]<=before[L])situations.push("won-on-the-final-day");
         const ledThroughout=facts.seasons.every((s,i)=>{const t=totalsOf(facts.seasons.slice(0,i+1));return t[W]>t[L];});
-        if(ledThroughout&&before[W]-before[L]>11&&margin>11)situations.push("dominant-win");
+        if(ledThroughout&&before[W]-before[L]>facts.max&&margin>facts.max)situations.push("dominant-win");
       }
     }
     // A drawn Showdown in which neither manager won a trophy prints no silverware talk (a won one has the Showdown trophy).
@@ -378,9 +394,9 @@
     numbers.push({label:"Overall",left:totals.playerOne,right:totals.playerTwo,total:true});
     // Trophy desk: the Showdown trophy for the winner (none on a draw), and each other manager's biggest prize of the Showdown.
     const showdownItems=role=>{const r=rec(role);return {"champions-league":r.cl>0,"europa-league":r.el>0,"league-title":r.league>0,"domestic-cup":r.cup>0,"performance-bonus":facts.seasons.some(s=>s.items[role]["performance-bonus"]),"awards-bonus":facts.seasons.some(s=>s.items[role]["awards-bonus"])};};
-    const briefs=draw&&golden?ROLES.map(role=>({head:"Golden Showdown",text:`${NAMES[role]} reaches ${GOLDEN.points} points over ${T} seasons: a Golden Showdown, shared.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[role],id:`golden-shared:${role}`}))
+    const briefs=draw&&golden?ROLES.map(role=>({head:"Golden Showdown",text:`${NAMES[role]} reaches ${goldenPoints} points over ${T} seasons: a Golden Showdown, shared.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[role],id:`golden-shared:${role}`}))
       :draw?ROLES.map((role,i)=>briefFor(walk,"brief"+i,role,showdownItems(role),facts.clubs,true))
-      :[{head:golden?"Golden Showdown won":"The Showdown trophy",text:golden?`${NAMES[W]} reaches ${GOLDEN.points} points, the target that wins the Golden Showdown.`:`${NAMES[W]}'s name goes on the trophy that outranks every cup in either cabinet.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[W],id:"showdown-trophy"},briefFor(walk,"brief1",L,showdownItems(L),facts.clubs,true)];
+      :[{head:golden?"Golden Showdown won":"The Showdown trophy",text:golden?`${NAMES[W]} reaches ${goldenPoints} points, the target that wins the Golden Showdown.`:`${NAMES[W]}'s name goes on the trophy that outranks every cup in either cabinet.`,trophy:"TRO_SHOWDOWN_CHAMPION",club:facts.clubs[W],id:"showdown-trophy"},briefFor(walk,"brief1",L,showdownItems(L),facts.clubs,true)];
     return Object.freeze({
       kind:"final",key,rivalryId:facts.rivalryId,seasonNumber:T,totalSeasons:T,situation:chosen.situation,winner:draw?"draw":NAMES[W],golden,
       paper:{
@@ -412,14 +428,14 @@
     const history=states?.history,projection=history?.projection;
     if(history?.authoritative!==true||history.phase!=="HISTORY_CONVERGED"||!plain(projection))return null;
     const N=Number(history.throughSeason);if(!Number.isInteger(N)||projection.acceptedSeasons!==N)return null;
-    return {projection,seasonNumber:N,specialPlayers:states.specialPlayers||null};
+    return {projection,seasonNumber:N,specialPlayers:states.specialPlayers||null,primePack:tgPrimePack(projection.rivalryId,history.setupConfirmedAt)};
   }
   // FINAL: the Final Winner frame on screen and the verified history it was drawn from (js/seasonFinalV10.js).
   function finalInput(states){
     const final=states?.final,history=states?.history,projection=history?.projection;
     if(!plain(final)||!final.winner||!plain(projection)||history?.phase!=="HISTORY_CONVERGED")return null;
     if(Number.isInteger(final.seasonsPlayed)&&final.seasonsPlayed!==projection.totalSeasons)return null;
-    return {projection,final,specialPlayers:final.specialPlayers||states.specialPlayers||null};
+    return {projection,final,specialPlayers:final.specialPlayers||states.specialPlayers||null,primePack:tgPrimePack(projection.rivalryId,history.setupConfirmedAt)};
   }
 
   // ---------- the page (browser only) ----------
diff --git a/service-worker.js b/service-worker.js
index 9adf3e381..441f1fe51 100644
--- a/service-worker.js
+++ b/service-worker.js
@@ -25,7 +25,9 @@ const NETWORK_ONLY_NAVIGATION_PATHS = new Set([
 // Team V cache-first image rule.
 const SHELL_FRAME_NAVIGATION_PATHS = new Set([
     "visual-assets/v10_1/special-player/index.html",
-    "visual-assets/v10_1/roulette/index.html"
+    "visual-assets/v10_1/roulette/index.html",
+    // r87 Prime Pack: its page in the #igStage frame (js/iconGuessStep.js), same rule.
+    "visual-assets/v10_1/icon-guess/index.html"
 ]);
 // Precached shell files that a stylesheet asks for by a relative url(), so the request has no ?v=: css/r78-marble-surfaces.css
 // draws its panels with url("r78-marble-tile.webp"). They come from the shell the page runs (the precached copy), then the network.
@@ -142,6 +144,11 @@ const SHELL_PATHS = Object.freeze([
   "visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt",
   "visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt",
   "visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt",
+  "js/iconGuessStep.js",
+  "js/iconGuess.js",
+  "js/iconNames.js",
+  "data/icons.js",
+  "visual-assets/v10_1/icon-guess/index.html",
   "js/specialPlayerChip.js",
   "js/careerStartMarker.js",
   "css/rivalryLegacyV10.css",
@@ -339,7 +346,8 @@ const SHELL_PATH_SET = new Set(SHELL_PATHS);
 // r87 Touchline Gazette (Nik 2026-10-31): its page script, copy, headline pack, styles, Team V's paper and sheet and the
 // seven OFL Gazette fonts (licences beside them). Its press photos are Team V images (V10_IMAGE_PATH, runtime cache).
 // r87 first load: Google Fonts' Barlow Condensed sheet and its nine files, now served from this site.
-const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["js/careerSummaryStore.js","js/specialPlayerReveal.js","visual-assets/v10_1/special-player/index.html","js/marqueePlayer.js","data/marqueePlayers.js","js/specialPlayerChip.js","js/rosterRouletteStep.js","js/rosterRoulette.js","data/rosterSquads.js","css/v10Roulette.css","visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/roulette/platemap.json","visual-assets/v10_1/roulette/vendor/three-r128.min.js","visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt","visual-assets/v10_1/roulette/assets/squads.json","js/deadlineDay.js","data/deadlineDayLines.js","data/fifa17Players.js","js/touchlineGazette.js","data/gazetteCopy.js","data/frontPages.js","css/v10Gazette.css","visual-assets/v10_1/content/content.css","visual-assets/v10_1/content/frontpage.js","visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt","js/commentaryV3.js","js/commentaryEngine.js","data/commentaryLines.js","assets/fonts/barlow-condensed.css","assets/fonts/barlow-condensed-vietnamese-600-normal.woff2","assets/fonts/barlow-condensed-vietnamese-700-normal.woff2","assets/fonts/barlow-condensed-vietnamese-800-normal.woff2","assets/fonts/barlow-condensed-latin-ext-600-normal.woff2","assets/fonts/barlow-condensed-latin-ext-700-normal.woff2","assets/fonts/barlow-condensed-latin-ext-800-normal.woff2","assets/fonts/barlow-condensed-latin-600-normal.woff2","assets/fonts/barlow-condensed-latin-700-normal.woff2","assets/fonts/barlow-condensed-latin-800-normal.woff2"]);
+// r87 Prime Pack: its step, round engine, name matcher, Icon list and page.
+const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["js/careerSummaryStore.js","js/specialPlayerReveal.js","visual-assets/v10_1/special-player/index.html","js/marqueePlayer.js","data/marqueePlayers.js","js/specialPlayerChip.js","js/rosterRouletteStep.js","js/rosterRoulette.js","data/rosterSquads.js","css/v10Roulette.css","visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/roulette/platemap.json","visual-assets/v10_1/roulette/vendor/three-r128.min.js","visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt","visual-assets/v10_1/roulette/assets/squads.json","js/deadlineDay.js","data/deadlineDayLines.js","data/fifa17Players.js","js/touchlineGazette.js","data/gazetteCopy.js","data/frontPages.js","css/v10Gazette.css","visual-assets/v10_1/content/content.css","visual-assets/v10_1/content/frontpage.js","visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt","js/commentaryV3.js","js/commentaryEngine.js","data/commentaryLines.js","assets/fonts/barlow-condensed.css","assets/fonts/barlow-condensed-vietnamese-600-normal.woff2","assets/fonts/barlow-condensed-vietnamese-700-normal.woff2","assets/fonts/barlow-condensed-vietnamese-800-normal.woff2","assets/fonts/barlow-condensed-latin-ext-600-normal.woff2","assets/fonts/barlow-condensed-latin-ext-700-normal.woff2","assets/fonts/barlow-condensed-latin-ext-800-normal.woff2","assets/fonts/barlow-condensed-latin-600-normal.woff2","assets/fonts/barlow-condensed-latin-700-normal.woff2","assets/fonts/barlow-condensed-latin-800-normal.woff2","js/iconGuessStep.js","js/iconGuess.js","js/iconNames.js","data/icons.js","visual-assets/v10_1/icon-guess/index.html"]);
 const PREVIOUS_SHELL_PATHS = Object.freeze(SHELL_PATHS.filter(path=>!SHELL_PATHS_ADDED_SINCE_PREVIOUS.has(path)));
 function shellPathsForRevision(revision){ return revision&&revision!==RUNTIME_REVISION&&revision===PREVIOUS_RUNTIME_REVISION?PREVIOUS_SHELL_PATHS:SHELL_PATHS; }
 

```
