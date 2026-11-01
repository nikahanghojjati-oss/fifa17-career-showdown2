# Fable job 14: the 15-point season, from guess to career save, on the 2.0.0 candidate (Career Mode Showdown)

Code snapshot: repo nikahanghojjati-oss/fifa17-career-showdown2, branch gameplay/r87 @ 258f3f3eedab0a04ca81ab71478cba292cd9254b (the frozen 2.0.0 candidate). Below the brief: the full source of the authoritative scoring path (season results, scoring, season commit, terminal close, history convergence) and the three Firestore Rules fragments that guard it.

2.0.0 changes the scoring system for the first time since the project began: a season goes from 0-11 to 0-15 points, and Golden Showdown from 110 to 150. This job follows a Prime Pack point (and Europa League / Champions League points) through the **authoritative data path and the Rules**: what each phone writes, what the Rules accept, what gets committed, and what the closed Showdown stores for the lifetime career. A separate review is checking every display screen (Gazette, commentary, career pages) for wording, so focus on data, maths and Rules. Report display-only issues only when a stored value is wrong.

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
1. **Any place still assuming 11 (or 12, or 110):** constants, caps, validators, `Math.min`, Rules `<= 11`, terminal-close totals, Golden detection, "perfect season" checks (`>= 11` vs `=== max`). For each, say whether a real 2.0.0 game can reach it and what goes wrong.
2. **The season total:** league points + Europa/Champions bonus + `primePack`. Can a season exceed 15, under-count, double-count the Prime Pack point, or count it for the wrong manager? Both phones must compute the same total from the same stored data.
3. **Rules caps and cost:** the season-results create/update, season-commit and terminal-close Rules at season 10 with Europa/Champions and Prime Pack wins on both sides across seasons. Count `get()`/`exists()` lookups per request (each is a billed read on Spark) and estimate expressions against the 1,000-expression limit; an earlier measurement was 904/1000 at the old +1 rule. Can a legitimate write be refused at the new cap? Can a write be accepted that moves a committed result?
4. **Season commit and terminal close:** idempotent on retries and double taps; committed totals match what both phones showed; the closing totals and winner (or DRAW) match the sum of committed seasons; a 150-150 is a DRAW, never a winner.
5. **Mixed Showdowns:** a pre-2.0.0 Showdown (no Prime Pack, `ICON_FROM_MS` later than its confirm time) must keep its own math without crashing; a 2.0.0 Showdown must never fall back to the 11-point maths in any season.
6. **History and career save:** the closed Showdown's stored totals, Golden flag and winner feed History and the lifetime career; check the stored shape carries Prime Pack points and that the reader sums them once.

## Do not re-report
Prime Pack round timing and the guess screen (another job covers them). Layout. Modified-app-only attacks except the P1 hardening case.

Finding IDs: F14-NN.


## FILE: js/sharedCanonicalScoring.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r11";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const BREAKDOWN_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total","triggers"]);
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","seasonCommitRevision","seasonCommitContentHash","scoring","winner","contentHash"]);
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RULES=Object.freeze({championsLeague:5,leagueTitle:3,domesticCup:1,performanceBonus:1,individualAwardsBonus:1,europaLeague:3,primePack:4});
  // r80 Europa League: a sparse 8th result key. It is present only when that manager won the Europa League, and then it is exactly
  // true with championsLeague false (one manager's season is CL or EL, never both; the two managers are never compared). A result
  // without the key is the unchanged 7-key r79 shape, so every hash over old results stays byte-identical. The breakdown carries
  // europaLeague:3 only for such a result.
  const EUROPA_LEAGUE="europaLeague";
  // r88 Prime Pack: a sparse 9th key, primePack 1 to 4 for the manager who named the season's masked Icon first
  // (new R88 Showdowns only; the Rules tie it to that season's iconRounds record). Worth 4, 3, 2 or 1 by the stage of the right guess; a season scores at most 15.
  const PRIME_PACK="primePack";

  function scFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function scExact(value,keys,code="CANONICAL_SCORING_VALUE_INVALID"){if(!scPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))scFail(code);return value;}
  function scClone(value){return JSON.parse(JSON.stringify(value));}
  function scFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scFreeze);Object.freeze(value);}return value;}
  function scCanonical(value){if(Array.isArray(value))return `[${value.map(scCanonical).join(",")}]`;if(scPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function scHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scFail("CANONICAL_SCORING_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function scTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)scFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return value;}
  function scEuropaLeague(value,code){if(!scPlain(value))scFail(code);const won=Object.hasOwn(value,EUROPA_LEAGUE);scExact(value,[...RESULT_KEYS,...(won?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,PRIME_PACK)?[PRIME_PACK]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scFail(code);if(Object.hasOwn(value,PRIME_PACK)&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))scFail(code);return won;}
  function scResult(value,teamCount){const europaLeague=scEuropaLeague(value,"CANONICAL_SCORING_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)scFail("CANONICAL_SCORING_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scFail("CANONICAL_SCORING_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};}
  function scBreakdown(result){
    const hundredLeaguePoints=result.leaguePoints>=100,hundredLeagueGoals=result.leagueGoals>=100,topScorer=result.topScorer,topAssist=result.topAssist;
    const breakdown={championsLeague:result.championsLeague?RULES.championsLeague:0,...(result.europaLeague===true?{europaLeague:RULES.europaLeague}:{}),...(Number.isInteger(result.primePack)&&result.primePack>=1&&result.primePack<=RULES.primePack?{primePack:result.primePack}:{}),leagueTitle:result.leaguePosition===1?RULES.leagueTitle:0,domesticCup:result.domesticCup?RULES.domesticCup:0,performanceBonus:(hundredLeaguePoints||hundredLeagueGoals)?RULES.performanceBonus:0,individualAwardsBonus:(topScorer||topAssist)?RULES.individualAwardsBonus:0,total:0,triggers:{hundredLeaguePoints,hundredLeagueGoals,topScorer,topAssist}};
    breakdown.total=breakdown.championsLeague+(breakdown.europaLeague||0)+(breakdown.primePack||0)+breakdown.leagueTitle+breakdown.domesticCup+breakdown.performanceBonus+breakdown.individualAwardsBonus;return breakdown;
  }
  function scWinner(results,scoring){if(scoring.playerOne.total>scoring.playerTwo.total)return "playerOne";if(scoring.playerTwo.total>scoring.playerOne.total)return "playerTwo";return "draw";}
  function scValidateBreakdown(value){const europaLeague=scPlain(value)&&Object.hasOwn(value,EUROPA_LEAGUE),icon=scPlain(value)&&Object.hasOwn(value,PRIME_PACK);scExact(value,[...BREAKDOWN_KEYS,...(europaLeague?[EUROPA_LEAGUE]:[]),...(icon?[PRIME_PACK]:[])],"CANONICAL_SCORING_STATE_INVALID");if(europaLeague&&(value.europaLeague!==RULES.europaLeague||value.championsLeague!==0))scFail("CANONICAL_SCORING_STATE_INVALID");if(icon&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=RULES.primePack))scFail("CANONICAL_SCORING_STATE_INVALID");scExact(value.triggers,TRIGGER_KEYS,"CANONICAL_SCORING_STATE_INVALID");for(const key of ["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]){if(!Number.isInteger(value[key])||value[key]<0||value[key]>15)scFail("CANONICAL_SCORING_STATE_INVALID");}for(const key of TRIGGER_KEYS){if(typeof value.triggers[key]!=="boolean")scFail("CANONICAL_SCORING_STATE_INVALID");}return value;}

  async function scCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonCommitModule=(typeof require==="function"?require("./sharedSeasonCommit.js"):root.CareerModeSharedSeasonCommit)}={}){
    const teams=scTeamCount(teamCount);if(!seasonCommitModule||typeof seasonCommitModule.createProtocol!=="function")scFail("CANONICAL_SCORING_SEASON_COMMIT_PROTOCOL_UNAVAILABLE");const commitProtocol=await seasonCommitModule.createProtocol({teamCount:teams,cryptoImpl});
    function scScoreAuthoritativeResults(value){scExact(value,ROLES,"CANONICAL_SCORING_RESULTS_INVALID");const results={playerOne:scResult(value.playerOne,teams),playerTwo:scResult(value.playerTwo,teams)},scoring={playerOne:null,playerTwo:null};scoring.playerOne=scBreakdown(results.playerOne);scoring.playerTwo=scBreakdown(results.playerTwo);return scFreeze({results,scoring,winner:scWinner(results,scoring)});}
    async function scAcknowledgedCommit(value){let verified;try{verified=await commitProtocol.verifyState(value);}catch(_error){scFail("CANONICAL_SCORING_SEASON_COMMIT_INVALID");}if(verified.phase!=="ACKNOWLEDGED"||verified.revision!==3||!verified.results?.playerOne||!verified.results?.playerTwo)scFail("CANONICAL_SCORING_SEASON_COMMIT_NOT_ACKNOWLEDGED");return verified;}
    async function scSealState(core){return scFreeze({...scClone(core),contentHash:await scHash(core,cryptoImpl)});}
    async function scReconcile({seasonCommit}){const committed=await scAcknowledgedCommit(seasonCommit),projection=scScoreAuthoritativeResults(committed.results);const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:committed.seasonNumber,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:committed.revision,seasonCommitContentHash:committed.contentHash,scoring:projection.scoring,winner:projection.winner};return scSealState(core);}
    async function scVerifyScoringState(value,{seasonCommit}={}){scExact(value,STATE_KEYS,"CANONICAL_SCORING_STATE_INVALID");const core=scClone(value),hash=core.contentHash;delete core.contentHash;if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||value.phase!=="SCORING_RECONCILED"||value.revision!==1||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||value.seasonCommitRevision!==3||!HASH.test(value.seasonCommitContentHash)||!HASH.test(hash)||!["playerOne","playerTwo","draw"].includes(value.winner))scFail("CANONICAL_SCORING_STATE_INVALID");scExact(value.scoring,ROLES,"CANONICAL_SCORING_STATE_INVALID");ROLES.forEach(role=>scValidateBreakdown(value.scoring[role]));if(await scHash(core,cryptoImpl)!==hash)scFail("CANONICAL_SCORING_STATE_HASH_MISMATCH");if(seasonCommit){const expected=await scReconcile({seasonCommit});if(expected.seasonNumber!==value.seasonNumber||expected.seasonCommitContentHash!==value.seasonCommitContentHash||scCanonical(expected.scoring)!==scCanonical(value.scoring)||expected.winner!==value.winner)scFail("CANONICAL_SCORING_RECOMPUTE_MISMATCH");}return scFreeze(scClone(value));}
    function scProjectForRole(state,role){if(!ROLES.includes(role))scFail("CANONICAL_SCORING_ROLE_INVALID");return scFreeze({schemaVersion:state.schemaVersion,runtimeRevision:state.runtimeRevision,seasonNumber:state.seasonNumber,phase:state.phase,revision:state.revision,seasonCommitRevision:state.seasonCommitRevision,seasonCommitContentHash:state.seasonCommitContentHash,managerRole:role,scoring:scClone(state.scoring),winner:state.winner});}
    return scFreeze({contractVersion:1,feature:"ssjr-canonical-scoring",runtimeRevision:RUNTIME_REVISION,roles:ROLES,rules:RULES,reconcile:scReconcile,verifyState:scVerifyScoringState,projectForRole:scProjectForRole,scoreAuthoritativeResults:scScoreAuthoritativeResults,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,leaguePositionThenPointsTiebreak:false,drawOnEqualTotals:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-canonical-scoring-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,rules:RULES,createProtocol:scCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,requiresAcknowledgedSeasonCommit:true,leaguePositionThenPointsTiebreak:false,drawOnEqualTotals:true});
});
```


## FILE: js/productionSharedCanonicalScoring.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedCanonicalScoring=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): after this manager acknowledged, read every 3 s for at most 3 minutes until the canonical score is reconciled.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  let installed=false,busy=false,view=null,contextKey="",setupApi=null,commitApi=null,provider=null,catalogApi=null,refreshPromise=null,headingObserver=null,bootstrapObserver=null;

  function pcscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pcscShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pcscSharedMarker(){const showdown=pcscShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pcscField(id){return root.document&&root.document.getElementById(id);}
  function pcscText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function pcscHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pcscReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pcscLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pcscEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pcscLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pcscLoadScript("ssjr-production-season-commit","js/productionSharedSeasonCommit.js",()=>root.CareerModeProductionSharedSeasonCommit);
    await pcscLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pcscLoadScript("ssjr-season-commit-provider","js/sparkSharedSeasonCommit.js",()=>root.CareerModeSparkSharedSeasonCommit);
    await pcscLoadScript("ssjr-canonical-scoring-protocol","js/sharedCanonicalScoring.js",()=>root.CareerModeSharedCanonicalScoring);
    await pcscLoadScript("ssjr-canonical-scoring-provider","js/sparkSharedCanonicalScoring.js",()=>root.CareerModeSparkSharedCanonicalScoring);
    await pcscLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;commitApi=root.CareerModeProductionSharedSeasonCommit;provider=root.CareerModeSparkSharedCanonicalScoring;catalogApi=root.CareerModeSharedShowdownCatalog;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pcscFail("CANONICAL_SCORING_SETUP_UNAVAILABLE");
    if(!commitApi||typeof commitApi.refresh!=="function"||typeof commitApi.getState!=="function")pcscFail("CANONICAL_SCORING_SEASON_COMMIT_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function")pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE");
    if(!catalogApi||!catalogApi.catalog)pcscFail("CANONICAL_SCORING_CATALOG_UNAVAILABLE");
  }
  function pcscTeamCount(){const setup=setupApi?.getState?.()?.setup,clubs=setup?.leagueId?catalogApi?.catalog?.[setup.leagueId]:null;if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)pcscFail("CANONICAL_SCORING_TEAM_COUNT_INVALID");return clubs.length;}
  function pcscSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pcscShowdown()?.currentRound,season=Number(pcscSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pcscFail("CANONICAL_SCORING_SEASON_INVALID");return season;}
  function pcscConfirmedSetupRivalry(){try{const s=(setupApi||root.CareerModeProductionSharedShowdownSetup)?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
  function pcscRequestContext(){const showdown=pcscShowdown(),rivalryId=String(showdown?.sharedJourney?.rivalryId||pcscConfirmedSetupRivalry()||"").trim();let seasonNumber;try{seasonNumber=pcscSeason();}catch(_error){return null;}const saveId=String(showdown?.id||showdown?.saveId||"").trim(),key=rivalryId?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";return key?Object.freeze({key,rivalryId,seasonNumber}):null;}
  function pcscContextMatches(request){const current=pcscRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function pcscCommitReady(request=pcscRequestContext()){const state=commitApi?.getState?.();return Boolean(request&&state&&state.committed===true&&state.phase==="ACKNOWLEDGED"&&state.revision===3&&Number(state.seasonNumber)===request.seasonNumber&&String(state.rivalryId||"")===request.rivalryId);}
  function pcscResult(result){if(result&&result.ok===true)return result;const error=new Error("Shared canonical scoring could not be verified.");error.code=result&&result.code||"CANONICAL_SCORING_PROVIDER_FAILED";throw error;}
  function pcscManagerName(role){return pcscShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function pcscEnsureUi(){
    const review=pcscField("seasonReviewPanel"),actions=review?.querySelector?.(".seasonReviewActions");if(!review||!actions)return null;
    let panel=pcscField("sharedCanonicalScoringPanel");if(!panel){panel=root.document.createElement("section");panel.id="sharedCanonicalScoringPanel";panel.className="seasonReviewBreakdown sharedCanonicalScoringPanel hidden";panel.setAttribute("aria-live","polite");panel.innerHTML='<h3 id="sharedCanonicalScoringHeading">SEASON SCORE</h3><p id="sharedCanonicalScoringTotals"></p><p id="sharedCanonicalScoringBreakdown"></p><p id="sharedCanonicalScoringWinner"></p>';actions.parentNode.insertBefore(panel,actions);}
    return {panel,totals:pcscField("sharedCanonicalScoringTotals"),breakdown:pcscField("sharedCanonicalScoringBreakdown"),winner:pcscField("sharedCanonicalScoringWinner")};
  }
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pcscWatchedKey=null;
  function pcscWatchSync(){let key="";try{key=pcscWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pcscWatchedKey)return;pcscWatchedKey=key;try{pcscWatchWait();}catch(_error){}}
  function pcscRender(){pcscWatchSync();
    const ui=pcscEnsureUi();if(!ui)return false;const request=pcscRequestContext(),eligible=Boolean(pcscSharedMarker()&&request&&contextKey===request.key&&view&&view.authoritative===true&&view.phase==="SCORING_RECONCILED");pcscHidden(ui.panel,!eligible);if(!eligible)return false;
    const p1=view.scoring.playerOne,p2=view.scoring.playerTwo,n1=pcscManagerName("playerOne"),n2=pcscManagerName("playerTwo");
    pcscText(ui.totals,`${n1}: ${p1.total} · ${n2}: ${p2.total}`);
    pcscText(ui.breakdown,`Champions League ${p1.championsLeague}–${p2.championsLeague}${p1.europaLeague||p2.europaLeague?` · Europa League ${p1.europaLeague||0}–${p2.europaLeague||0}`:""}${p1.primePack||p2.primePack?` · Prime Pack ${p1.primePack||0}–${p2.primePack||0}`:""} · League Title ${p1.leagueTitle}–${p2.leagueTitle} · Domestic Cup ${p1.domesticCup}–${p2.domesticCup} · Performance Bonus ${p1.performanceBonus}–${p2.performanceBonus} · Awards Bonus ${p1.individualAwardsBonus}–${p2.individualAwardsBonus}`);
    pcscText(ui.winner,view.winner==="draw"?"Season result: Draw":`Season winner: ${pcscManagerName(view.winner)}`);pcscBoard(ui.panel,p1,p2,n1,n2,view.winner);return true;
  }
  // r87 match-day polish: the same numbers drawn as a scoreboard (names, big totals, one row per category with the higher
  // number gold, the season verdict). The three text lines above stay for screen readers and the audits; the board is
  // aria-hidden. Equal stays level: a row or a season is never split by anything else (no tiebreak).
  function pcscBoard(panel,p1,p2,n1,n2,winner){
    const doc=root.document;if(!doc||!panel)return;
    let board=panel.querySelector(":scope > .pcscBoard");if(!board){board=doc.createElement("div");board.className="pcscBoard";board.setAttribute("aria-hidden","true");panel.appendChild(board);}
    const key=JSON.stringify([p1,p2,n1,n2,winner]);if(board.dataset.key===key)return;board.dataset.key=key;
    const el=(tag,cls,text)=>{const node=doc.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=String(text);return node;};
    const side=(a,b)=>a>b?" is-lead":"";
    const head=el("div","pcscBoard__head");
    head.append(el("span","pcscBoard__name",n1),el("strong",`pcscBoard__total${side(p1.total,p2.total)}`,p1.total),el("span","pcscBoard__colon",":"),el("strong",`pcscBoard__total${side(p2.total,p1.total)}`,p2.total),el("span","pcscBoard__name",n2));
    const rows=el("div","pcscBoard__rows");
    const lines=[["Champions League",p1.championsLeague,p2.championsLeague],...(p1.europaLeague||p2.europaLeague?[["Europa League",p1.europaLeague||0,p2.europaLeague||0]]:[]),...(p1.primePack||p2.primePack?[["Prime Pack",p1.primePack||0,p2.primePack||0]]:[]),["League Title",p1.leagueTitle,p2.leagueTitle],["Domestic Cup",p1.domesticCup,p2.domesticCup],["Performance Bonus",p1.performanceBonus,p2.performanceBonus],["Awards Bonus",p1.individualAwardsBonus,p2.individualAwardsBonus]];
    for(const [label,a,b] of lines){const one=Number(a)||0,two=Number(b)||0,row=el("div",`pcscBoard__row${one||two?"":" is-zero"}`);row.append(el("span",`pcscBoard__val${side(one,two)}`,`+${one}`),el("span","pcscBoard__label",label),el("span",`pcscBoard__val${side(two,one)}`,`+${two}`));rows.append(row);}
    const verdict=el("div",`pcscBoard__verdict${winner==="draw"?" is-draw":""}`,winner==="draw"?"SEASON DRAWN":`SEASON WINNER · ${pcscManagerName(winner)}`);
    board.replaceChildren(head,rows,verdict);panel.classList.add("hasPcscBoard");
  }
  async function pcscProviderOptions(request){
    const setup=setupApi?.getState?.();if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pcscFail("CANONICAL_SCORING_SETUP_NOT_CONFIRMED");
    if(String(setup.rivalryId)!==request.rivalryId)pcscFail("CANONICAL_SCORING_CONTEXT_STALE");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await root.CareerModeProductionFirebaseRuntime.ensureAccountServices());if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pcscFail("CANONICAL_SCORING_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return {user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,teamCount:pcscTeamCount(),cryptoImpl:root.crypto,nowEpochMs:Date.now()};
  }
  // Job 33 (R1): a fast waiting read (light) reuses the already-ACKNOWLEDGED (immutable) Season Commit and confirmed Setup.
  async function pcscRefreshNow(request=pcscRequestContext(),light=false){
    if(!request||!pcscSharedMarker())return null;await pcscEnsureDependencies();if(!pcscContextMatches(request))return null;
    if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
    if(light!==true){await setupApi.refresh();if(!pcscContextMatches(request))return null;await commitApi.refresh();if(!pcscContextMatches(request))return null;}
    if(!pcscCommitReady(request)){view=null;contextKey=request.key;pcscRender();return null;}
    const result=pcscResult(await provider.read(await pcscProviderOptions(request)));if(!pcscContextMatches(request))return null;
    if(result.phase!=="SCORING_RECONCILED"||result.revision!==1||result.seasonCommitRevision!==3||Number(result.seasonNumber)!==request.seasonNumber)pcscFail("CANONICAL_SCORING_PROJECTION_INVALID");
    view={...result,rivalryId:request.rivalryId};contextKey=request.key;pcscRender();return view;
  }
  function pcscRefresh(light=false,reread=false){const request=pcscRequestContext();if(!request)return Promise.resolve(null);if(reread!==true&&view&&contextKey===request.key&&view.phase==="SCORING_RECONCILED"&&!refreshPromise)return Promise.resolve(view);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pcscRefreshNow(request,light===true);refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function pcscWaitingKey(){
    const screen=pcscField("seasonEntry"),request=pcscRequestContext(),commit=(commitApi||root.CareerModeProductionSharedSeasonCommit)?.getState?.();if(!screen||screen.classList.contains("hidden")||!request||!commit)return "";
    if(commit.committed!==true||!(commit.ownAcknowledged===true||commit.phase==="ACKNOWLEDGED")||Number(commit.seasonNumber)!==request.seasonNumber||String(commit.rivalryId||"")!==request.rivalryId)return "";
    if(contextKey===request.key&&view&&view.phase==="SCORING_RECONCILED")return "";
    return `${request.key}|score`;
  }
  function pcscFastPollDue(){const key=pcscWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // the 3 s check below keeps running as the fallback and reads from the listener while it is healthy.
  function pcscWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pcscWaitingKey()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonCommits/season_${request.seasonNumber}`:null)(pcscRequestContext()):null);}catch(_error){path=null;}budget.watchWaitPoint("canonical-scoring",path,pcscWaitWake);}
  function pcscWaitWake(){const inflight=refreshPromise;if(inflight){const again=()=>{if(!busy)void pcscTick(true);};inflight.then(again,again);return;}if(!busy){void pcscTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pcscTick(true);},400);}
  function pcscFastTick(){pcscWatchWait();if(root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.()||root.document?.visibilityState==="hidden"||busy||!pcscFastPollDue())return;void pcscTick(true);}
  // Job 33: a failed fast (3 s) read is retried by the next poll and is not reported; the 15 s poll still reports a real failure.
  // Job 33: a reconciled score is immutable, so the poll stops re-reading it (Spark reads, emulator contention) until the season changes.
  // A read that was overtaken by CONTINUE TO SEASON N (the season cursor moved mid-read) is not an error; the next tick reads the new season.
  // A season cursor change event still re-reads (reread=true), so a real failure there is reported and clears the view.
  // *_CONTEXT_STALE means the season moved on while a nested read ran; the next tick re-reads. Stay quiet and keep the view:
  // pcscRender only shows it for its own season key, and a reconciled season score never changes.
  function pcscContextStale(error){return /_CONTEXT_STALE$/.test(String(error?.code||""));}
  async function pcscTick(light=false,reread=false){if(!pcscSharedMarker()||busy||root.document?.visibilityState==="hidden")return;const screen=pcscField("seasonEntry");if(!screen||screen.classList.contains("hidden"))return;const request=pcscRequestContext();if(reread!==true&&request&&contextKey===request.key&&view?.phase==="SCORING_RECONCILED"){pcscRender();return;}busy=true;try{await pcscRefresh(light===true,reread===true);}catch(error){if(request&&!pcscContextMatches(request))return;if(pcscContextStale(error)){pcscRender();return;}if(light===true)return;view=null;pcscRender();pcscReport("Unable to refresh Shared Canonical Scoring",error);}finally{busy=false;}}
  function pcscAttachHeadingObserver(){if(!root.MutationObserver||!root.document)return false;const heading=pcscField("seasonReviewHeading");if(!heading)return false;if(headingObserver)return true;headingObserver=new root.MutationObserver(()=>void pcscTick());headingObserver.observe(heading,{childList:true,characterData:true,subtree:true});return true;}
  function pcscInstallObservers(){if(pcscAttachHeadingObserver()||!root.MutationObserver||!root.document?.documentElement)return;bootstrapObserver=new root.MutationObserver(()=>{if(pcscAttachHeadingObserver()){bootstrapObserver.disconnect();bootstrapObserver=null;}});bootstrapObserver.observe(root.document.documentElement,{childList:true,subtree:true});}
  function pcscInstall(){if(installed)return true;installed=true;pcscInstallObservers();root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pcscTick(false,true));if(typeof root.setInterval==="function"){root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pcscTick();},POLL_MS);root.setInterval(pcscFastTick,FAST_POLL_MS);}if(typeof root.setTimeout==="function")root.setTimeout(()=>void pcscTick(),0);return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-canonical-scoring",scoreBoard:pcscBoard,productionEnabled:true,runtimeRevision:"1.9.1-r11",requiresAcknowledgedSeasonCommit:true,providerEnforcedSource:true,readOnlyDerivedProjection:true,reusesSeasonReview:true,canonicalStorageMutation:false,authoritativeScoring:true,trustsSubmittedTotals:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pcscWaitingKey()),install:pcscInstall,refresh:pcscRefresh,getState:()=>view,isActive:pcscSharedMarker});
});

```


## FILE: js/seasonEngine.js
```
/* =====================================================
   FIFA 17 Career Mode Showdown
   v1.0.1
   Season Entry, Pre-Commit Review and Progression Engine
===================================================== */

let seasonCompletionInProgress = false;
let seasonEntryRenderedRound = null;
let seasonEntryRenderedShowdownId = null;
let seasonReviewDraft = null;
let seasonReviewActive = false;
let seasonUI = null;

function ensureSeasonReviewUI(){
    if(document.getElementById("seasonReviewPanel")){
        return;
    }

    const seasonEntry = document.getElementById("seasonEntry");
    const completeButton = document.getElementById("completeSeason");
    const entryActions = completeButton ? completeButton.closest(".seasonEntryActions") : null;
    if(!seasonEntry || !entryActions){
        throw new Error("Season Review could not initialize because the Season Results shell is incomplete.");
    }

    const panel = document.createElement("section");
    panel.id = "seasonReviewPanel";
    panel.className = "seasonReviewPanel hidden";
    panel.setAttribute("aria-labelledby", "seasonReviewHeading");

    const status = document.createElement("div");
    status.className = "seasonReviewStatus";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = "FINAL CHECK";
    const statusMeta = document.createElement("strong");
    statusMeta.id = "seasonReviewStatusMeta";
    statusMeta.textContent = "NOT SAVED YET";
    status.append(statusLabel, statusMeta);

    const heading = document.createElement("h3");
    heading.id = "seasonReviewHeading";
    heading.tabIndex = -1;
    heading.textContent = "REVIEW SEASON BEFORE SAVING";

    const intro = document.createElement("p");
    intro.className = "seasonReviewIntro";
    intro.textContent = "Check both managers: results and calculated scores.";

    const result = document.createElement("p");
    result.id = "seasonReviewResult";
    result.className = "summaryResult seasonReviewResult";
    result.setAttribute("aria-live", "polite");

    const grid = document.createElement("div");
    grid.className = "seasonSummaryGrid seasonReviewGrid";

    const playerOne = document.createElement("div");
    playerOne.id = "seasonReviewOne";
    playerOne.className = "seasonSummaryCard seasonReviewCard";

    const playerTwo = document.createElement("div");
    playerTwo.id = "seasonReviewTwo";
    playerTwo.className = "seasonSummaryCard seasonReviewCard";
    grid.append(playerOne, playerTwo);

    const overall = document.createElement("div");
    overall.className = "overallScoreBox seasonReviewOverall";
    const overallLabel = document.createElement("span");
    overallLabel.textContent = "SHOWDOWN SCORE AFTER THIS SEASON";
    const overallValue = document.createElement("strong");
    overallValue.id = "seasonReviewOverallScore";
    overallValue.textContent = "0 • 0";
    overall.append(overallLabel, overallValue);

    const warning = document.createElement("p");
    warning.className = "seasonReviewWarning";
    warning.textContent = "CONFIRMING IS FINAL · THE SEASON CAN'T BE EDITED AFTER";

    const error = document.createElement("p");
    error.id = "seasonReviewError";
    error.className = "formError seasonReviewError";
    error.setAttribute("aria-live", "assertive");

    const actions = document.createElement("div");
    actions.className = "seasonEntryActions seasonReviewActions";

    const confirm = document.createElement("button");
    confirm.id = "confirmSeasonCompletion";
    confirm.className = "menuButton";
    confirm.type = "button";
    confirm.textContent = "CONFIRM & SAVE SEASON";

    const edit = document.createElement("button");
    edit.id = "editSeasonResults";
    edit.className = "compactButton";
    edit.type = "button";
    edit.textContent = "EDIT RESULTS";

    actions.append(confirm, edit);
    panel.append(status, heading, intro, result, grid, overall, warning, error, actions);
    entryActions.parentNode.insertBefore(panel, entryActions);

    seasonUI = null;
}

function cacheSeasonUI(){
    seasonUI = {
        entryScreen: document.getElementById("seasonEntry"),
        entryHint: document.querySelector("#seasonEntry .seasonEntryHint"),
        entryGrid: document.querySelector("#seasonEntry .seasonEntryGrid"),
        entryActions: document.getElementById("completeSeason")?.closest(".seasonEntryActions") || null,
        completeButton: document.getElementById("completeSeason"),
        nextButton: document.getElementById("nextSeasonAction"),
        entryError: document.getElementById("seasonEntryError"),
        entryTitle: document.getElementById("seasonEntryTitle"),
        managerOne: document.getElementById("seasonManagerOne"),
        managerTwo: document.getElementById("seasonManagerTwo"),
        clubOne: document.getElementById("seasonClubOne"),
        clubTwo: document.getElementById("seasonClubTwo"),
        reviewPanel: document.getElementById("seasonReviewPanel"),
        reviewHeading: document.getElementById("seasonReviewHeading"),
        reviewStatusMeta: document.getElementById("seasonReviewStatusMeta"),
        reviewResult: document.getElementById("seasonReviewResult"),
        reviewOne: document.getElementById("seasonReviewOne"),
        reviewTwo: document.getElementById("seasonReviewTwo"),
        reviewOverall: document.getElementById("seasonReviewOverallScore"),
        reviewError: document.getElementById("seasonReviewError"),
        reviewConfirm: document.getElementById("confirmSeasonCompletion"),
        reviewEdit: document.getElementById("editSeasonResults"),
        summaryTitle: document.getElementById("seasonSummaryTitle"),
        summaryResult: document.getElementById("seasonSummaryResult"),
        overall: document.getElementById("seasonOverallScore"),
        summaryOne: document.getElementById("seasonSummaryOne"),
        summaryTwo: document.getElementById("seasonSummaryTwo")
    };
    return seasonUI;
}

function getSeasonUI(){
    return seasonUI || cacheSeasonUI();
}

function setSeasonText(element, value){
    if(!element){ return; }
    const next = String(value ?? "");
    if(element.textContent !== next){ element.textContent = next; }
}

function cloneSeasonValue(value){
    if(typeof cloneForStorage === "function"){
        return cloneForStorage(value);
    }
    return JSON.parse(JSON.stringify(value));
}

function getSeasonReviewIntegrity(){
    const ui = getSeasonUI();
    const required = {
        panel: ui.reviewPanel,
        heading: ui.reviewHeading,
        playerOne: ui.reviewOne,
        playerTwo: ui.reviewTwo,
        overall: ui.reviewOverall,
        confirm: ui.reviewConfirm,
        edit: ui.reviewEdit
    };
    const missing = Object.entries(required)
        .filter(([, element]) => !element)
        .map(([name]) => name);
    const bindingProblems = [];

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        bindingProblems.push("review entry is not bound");
    }
    if(ui.reviewConfirm && ui.reviewConfirm.dataset.seasonConfirmBound !== "true"){
        bindingProblems.push("season confirmation is not bound");
    }
    if(ui.reviewEdit && ui.reviewEdit.dataset.seasonEditBound !== "true"){
        bindingProblems.push("season edit return is not bound");
    }

    return {
        healthy: missing.length === 0 && bindingProblems.length === 0,
        missing,
        bindingProblems,
        active: seasonReviewActive,
        hasDraft: Boolean(seasonReviewDraft)
    };
}

function initializeSeasonEngine(){
    ensureSeasonReviewUI();
    const ui = cacheSeasonUI();

    if(ui.completeButton && ui.completeButton.dataset.seasonEngineBound !== "true"){
        ui.completeButton.dataset.seasonEngineBound = "true";
        ui.completeButton.addEventListener("click", completeCurrentSeason);
    }

    if(ui.reviewConfirm && ui.reviewConfirm.dataset.seasonConfirmBound !== "true"){
        ui.reviewConfirm.dataset.seasonConfirmBound = "true";
        ui.reviewConfirm.addEventListener("click", confirmCurrentSeason);
    }

    if(ui.reviewEdit && ui.reviewEdit.dataset.seasonEditBound !== "true"){
        ui.reviewEdit.dataset.seasonEditBound = "true";
        ui.reviewEdit.addEventListener("click", editSeasonResults);
    }

    if(!seasonContinentalBound && typeof document.addEventListener === "function"){
        seasonContinentalBound = true;
        document.addEventListener("change", keepContinentalExclusive, true);
    }

    if(ui.nextButton && ui.nextButton.dataset.seasonEngineBound !== "true"){
        ui.nextButton.dataset.seasonEngineBound = "true";
        ui.nextButton.addEventListener("click", handleSeasonSummaryAction);
    }

    setSeasonText(ui.completeButton, "REVIEW SEASON");
    setSeasonEntryMode(false);

    const integrity = getSeasonReviewIntegrity();
    if(!integrity.healthy){
        throw new Error(`Season Review initialization failed: ${integrity.missing.concat(integrity.bindingProblems).join(", ")}`);
    }
}

function setSeasonEntryError(message = ""){
    setSeasonText(getSeasonUI().entryError, message);
}

function setSeasonReviewError(message = ""){
    setSeasonText(getSeasonUI().reviewError, message);
}

function setSeasonConfirmationBusy(isBusy){
    const ui = getSeasonUI();

    if(ui.reviewConfirm){
        ui.reviewConfirm.disabled = isBusy;
        ui.reviewConfirm.classList.toggle("isBusy", isBusy);
        ui.reviewConfirm.setAttribute("aria-busy", isBusy ? "true" : "false");
        setSeasonText(ui.reviewConfirm, isBusy ? "SAVING SEASON..." : "CONFIRM & SAVE SEASON");
    }
    if(ui.reviewEdit){
        ui.reviewEdit.disabled = isBusy;
    }
}

function reportSeasonError(message, error){
    console.error(`[Career Mode Showdown] ${message}:`, error);
    const detail = `${message}. ${error && error.message ? error.message : "Please try again."}`;
    if(seasonReviewActive){ setSeasonReviewError(detail); }
    else { setSeasonEntryError(detail); }

    if(typeof window.reportApplicationError === "function"){
        window.reportApplicationError(message, error);
    }
}

function setSeasonEntryMode(reviewing){
    const ui = getSeasonUI();
    seasonReviewActive = Boolean(reviewing);

    if(ui.entryScreen){
        ui.entryScreen.dataset.seasonEntryMode = reviewing ? "review" : "entry";
    }
    [ui.entryHint, ui.entryGrid, ui.entryActions, ui.entryError].forEach(element => {
        if(element){ element.classList.toggle("hidden", reviewing); }
    });
    if(ui.reviewPanel){
        ui.reviewPanel.classList.toggle("hidden", !reviewing);
    }
}

function clearSeasonReviewDraft(){
    seasonReviewDraft = null;
    setSeasonReviewError("");
}

function restoreSeasonEntryFromReview({ focus = false, clearDraft = true } = {}){
    if(clearDraft){ clearSeasonReviewDraft(); }
    setSeasonEntryMode(false);

    if(currentShowdown){
        setSeasonText(getSeasonUI().entryTitle, `SEASON ${Number(currentShowdown.currentRound)} RESULTS`);
    }

    if(focus){
        const firstInput = getSeasonInput("p1", "LeaguePosition");
        if(firstInput){ firstInput.focus({ preventScroll: true }); }
    }
}

function openSeasonEntry(){
    if(!currentShowdown){
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice("No Showdown in progress. Start or join one from Home.", "error");
        }
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    restoreSeasonEntryFromReview({ focus: false, clearDraft: true });

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        openTransferChallenge();
        return;
    }

    const ui = getSeasonUI();
    const currentRound = Number(currentShowdown.currentRound);
    const currentShowdownId = String(currentShowdown.id);

    setSeasonText(ui.entryTitle, `SEASON ${currentRound} RESULTS`);
    setSeasonText(ui.managerOne, currentShowdown.managers.playerOne);
    setSeasonText(ui.managerTwo, currentShowdown.managers.playerTwo);
    setSeasonText(ui.clubOne, currentShowdown.clubs.playerOne);
    setSeasonText(ui.clubTwo, currentShowdown.clubs.playerTwo);
    setSeasonText(ui.completeButton, "REVIEW SEASON");

    if(
        seasonEntryRenderedRound !== currentRound
        || String(seasonEntryRenderedShowdownId) !== currentShowdownId
    ){
        resetSeasonEntryFields();
        seasonEntryRenderedRound = currentRound;
        seasonEntryRenderedShowdownId = currentShowdownId;
    }

    setSeasonEntryError("");
    showScreen("seasonEntry");

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function resetSeasonEntryFields(){
    ["p1", "p2"].forEach(prefix => {
        ["LeaguePosition", "LeaguePoints", "LeagueGoals"].forEach(field => {
            const input = document.getElementById(`${prefix}${field}`);
            if(input && input.value !== ""){ input.value = ""; }
        });

        ["DomesticCup", "ChampionsLeague", "EuropaLeague", "TopScorer", "TopAssist"].forEach(field => {
            const checkbox = document.getElementById(`${prefix}${field}`);
            if(checkbox && checkbox.checked){ checkbox.checked = false; }
        });
    });
}

// Review and summary breakdown lines. They live here (moved out of the startup js/scoring.js in r80), the only place they are shown.
function buildPerformanceBonusLabel(scoring){
    const triggers = scoring.triggers || {};
    const achievements = [];

    if(triggers.hundredLeaguePoints){ achievements.push("100 Points"); }
    if(triggers.hundredLeagueGoals){ achievements.push("100 Goals"); }

    return achievements.length
        ? `Performance Bonus (${achievements.join(" + ")})`
        : "Performance Bonus";
}

function buildAwardsBonusLabel(scoring){
    const triggers = scoring.triggers || {};
    const achievements = [];

    if(triggers.topScorer){ achievements.push("Top Scorer"); }
    if(triggers.topAssist){ achievements.push("Top Assist"); }

    return achievements.length
        ? `Awards Bonus (${achievements.join(" + ")})`
        : "Awards Bonus";
}

function getScoringBreakdownLines(scoring, options = {}){
    // r80: the Europa League line shows only for a season that won it (+3), so every other season reads as before.
    // r87 polish: the review passes europaRow when either manager won it, so both cards list the same rows (+0 for the
    // other) and their SEASON SCORE plaques line up.
    return [
        ["Champions League", scoring.championsLeague || 0],
        ...(scoring.europaLeague > 0 || options.europaRow === true ? [["Europa League", scoring.europaLeague || 0]] : []),
        ...(scoring.primePack > 0 ? [["Prime Pack", scoring.primePack]] : []),
        ["League Title", scoring.leagueTitle || 0],
        ["Domestic Cup", scoring.domesticCup || 0],
        [buildPerformanceBonusLabel(scoring), scoring.performanceBonus || 0],
        [buildAwardsBonusLabel(scoring), scoring.individualAwardsBonus || scoring.awardsBonus || 0]
    ];
}

function getSeasonInput(prefix, field){
    return document.getElementById(`${prefix}${field}`);
}

function readSeasonResult(prefix){
    const position = getSeasonInput(prefix, "LeaguePosition");
    const points = getSeasonInput(prefix, "LeaguePoints");
    const goals = getSeasonInput(prefix, "LeagueGoals");
    const domesticCup = getSeasonInput(prefix, "DomesticCup");
    const championsLeague = getSeasonInput(prefix, "ChampionsLeague");
    const topScorer = getSeasonInput(prefix, "TopScorer");
    const topAssist = getSeasonInput(prefix, "TopAssist");
    const europaLeague = getSeasonInput(prefix, "EuropaLeague");

    if(!position || !points || !goals || !domesticCup || !championsLeague || !topScorer || !topAssist){
        throw new Error(`Season form controls are missing for ${prefix}.`);
    }

    const result = {
        leaguePosition: Number(position.value),
        leaguePoints: Number(points.value),
        leagueGoals: Number(goals.value),
        domesticCup: domesticCup.checked,
        championsLeague: championsLeague.checked,
        topScorer: topScorer.checked,
        topAssist: topAssist.checked
    };
    // r80: the stored result carries europaLeague only when that manager won it (never together with the Champions League).
    if(europaLeague && europaLeague.checked && !result.championsLeague){ result.europaLeague = true; }
    return result;
}

// r80: one manager's season is Champions League or Europa League, never both. Ticking one unticks the other for that manager
// only; the two managers play different FIFA saves, so their boxes are never compared.
let seasonContinentalBound = false;
function keepContinentalExclusive(event){
    const match = /^(p[12])(ChampionsLeague|EuropaLeague)$/.exec(String(event && event.target && event.target.id || ""));
    if(!match || !event.target.checked){ return; }
    const other = getSeasonInput(match[1], match[2] === "ChampionsLeague" ? "EuropaLeague" : "ChampionsLeague");
    if(other && other.checked){ other.checked = false; }
}

function getCurrentLeagueTeamCount(){
    if(!currentShowdown || !currentShowdown.selectedLeague || typeof getClubsForLeague !== "function"){
        return null;
    }

    const clubs = getClubsForLeague(currentShowdown.selectedLeague.id);
    return Array.isArray(clubs) && clubs.length ? clubs.length : null;
}

function getSeasonEntryValidationMessage(prefix, managerLabel){
    const positionInput = getSeasonInput(prefix, "LeaguePosition");
    const pointsInput = getSeasonInput(prefix, "LeaguePoints");
    const goalsInput = getSeasonInput(prefix, "LeagueGoals");

    if(!positionInput || !pointsInput || !goalsInput){
        return `${managerLabel}'s season form is incomplete.`;
    }

    if(positionInput.value === "" || pointsInput.value === "" || goalsInput.value === ""){
        return `Enter league position, league points and league goals for ${managerLabel}.`;
    }

    const position = Number(positionInput.value);
    const points = Number(pointsInput.value);
    const goals = Number(goalsInput.value);
    const teamCount = getCurrentLeagueTeamCount();

    if(!Number.isInteger(position) || position < 1){
        return `${managerLabel}'s league position must be a whole number of 1 or higher.`;
    }

    if(teamCount && position > teamCount){
        return `${managerLabel}'s league position cannot be lower than ${teamCount}th in this league.`;
    }

    if(!Number.isInteger(points) || points < 0){
        return `${managerLabel}'s league points must be a non-negative whole number.`;
    }

    if(!Number.isInteger(goals) || goals < 0){
        return `${managerLabel}'s league goals must be a non-negative whole number.`;
    }

    const championsLeague = getSeasonInput(prefix, "ChampionsLeague");
    const europaLeague = getSeasonInput(prefix, "EuropaLeague");
    if(championsLeague && championsLeague.checked && europaLeague && europaLeague.checked){
        return `${managerLabel}: pick Champions League or Europa League, not both.`;
    }

    return "";
}

function validateSeasonEntry(prefix){
    const label = prefix === "p1"
        ? (currentShowdown ? currentShowdown.managers.playerOne : "Manager 1")
        : (currentShowdown ? currentShowdown.managers.playerTwo : "Manager 2");

    return getSeasonEntryValidationMessage(prefix, label) === "";
}

function buildSeasonRecord(seasonNumber, playerOne, playerTwo, completedAt = new Date().toISOString()){
    playerOne.scoring = calculatePlayerSeasonScore(playerOne);
    playerTwo.scoring = calculatePlayerSeasonScore(playerTwo);

    return {
        roundNumber: seasonNumber,
        completedAt,
        transferChallengeSeason: seasonNumber,
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    };
}

function getSeasonReviewFingerprint(roundRecord){
    if(!roundRecord || !roundRecord.playerOne || !roundRecord.playerTwo){
        return "";
    }

    const normalizePlayer = player => ({
        leaguePosition: Number(player.leaguePosition),
        leaguePoints: Number(player.leaguePoints),
        leagueGoals: Number(player.leagueGoals),
        domesticCup: Boolean(player.domesticCup),
        championsLeague: Boolean(player.championsLeague),
        europaLeague: player.europaLeague === true,
        topScorer: Boolean(player.topScorer),
        topAssist: Boolean(player.topAssist),
        scoring: calculatePlayerSeasonScore(player)
    });

    const playerOne = normalizePlayer(roundRecord.playerOne);
    const playerTwo = normalizePlayer(roundRecord.playerTwo);

    return JSON.stringify({
        roundNumber: Number(roundRecord.roundNumber),
        transferChallengeSeason: Number(roundRecord.transferChallengeSeason),
        playerOne,
        playerTwo,
        winner: determineSeasonWinner(playerOne, playerTwo)
    });
}

function buildTrustedSeasonRecordFromReview(draft){
    if(!draft || !draft.roundRecord){
        throw new Error("No reviewed season is available to save.");
    }

    const source = draft.roundRecord;
    const playerOne = cloneSeasonValue(source.playerOne);
    const playerTwo = cloneSeasonValue(source.playerTwo);
    delete playerOne.scoring;
    delete playerTwo.scoring;

    const trusted = buildSeasonRecord(draft.seasonNumber, playerOne, playerTwo, null);
    const fingerprint = getSeasonReviewFingerprint(trusted);
    if(!draft.fingerprint || fingerprint !== draft.fingerprint){
        throw new Error("The reviewed season changed before confirmation. Return to Edit Results and review it again.");
    }

    trusted.completedAt = new Date().toISOString();
    return trusted;
}

function persistCompletedSeason(roundRecord, seasonNumber){
    const previousState = {
        roundsLength: currentShowdown.rounds.length,
        currentRound: currentShowdown.currentRound,
        status: currentShowdown.status,
        completedAt: currentShowdown.completedAt,
        score: cloneForStorage(currentShowdown.score)
    };

    currentShowdown.rounds.push(roundRecord);
    recalculateShowdownScores(currentShowdown);

    if(seasonNumber >= currentShowdown.totalRounds){
        currentShowdown.status = "Completed";
        currentShowdown.completedAt = currentShowdown.completedAt || new Date().toISOString();
    }else{
        currentShowdown.currentRound = seasonNumber + 1;
        currentShowdown.status = "Ready";
    }

    if(!saveCurrentShowdown()){
        currentShowdown.rounds.length = previousState.roundsLength;
        currentShowdown.currentRound = previousState.currentRound;
        currentShowdown.status = previousState.status;
        currentShowdown.completedAt = previousState.completedAt;
        currentShowdown.score = previousState.score;
        throw new Error("The season could not be saved.");
    }

    if(currentShowdown.status === "Completed"){
        const archived = archiveShowdown(currentShowdown);
        if(!archived && typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved, but the completed showdown could not be copied to Legacy. The active save is safe and can be archived again later.",
                "error",
                10000
            );
        }
    }
}

function getSeasonCompletionContextMessage(){
    if(!currentShowdown){
        return "No Showdown in progress. Start or join one from Home.";
    }

    if(currentShowdown.status === "Completed"){
        return "This showdown is already completed.";
    }

    if(!isTransferChallengeComplete(currentShowdown.currentRound)){
        return "Complete the current season's Transfer Challenge before submitting results.";
    }

    const playerOneValidation = getSeasonEntryValidationMessage("p1", currentShowdown.managers.playerOne);
    if(playerOneValidation){ return playerOneValidation; }

    const playerTwoValidation = getSeasonEntryValidationMessage("p2", currentShowdown.managers.playerTwo);
    if(playerTwoValidation){ return playerTwoValidation; }

    const seasonNumber = Number(currentShowdown.currentRound);
    const alreadyCompleted = currentShowdown.rounds.some(
        round => Number(round.roundNumber) === seasonNumber
    );
    return alreadyCompleted
        ? "This season has already been completed. Return to Showdown Home to continue."
        : "";
}

function createSeasonReviewDraft(){
    const seasonNumber = Number(currentShowdown.currentRound);
    const playerOne = readSeasonResult("p1");
    const playerTwo = readSeasonResult("p2");
    const roundRecord = buildSeasonRecord(seasonNumber, playerOne, playerTwo, null);

    return {
        showdownId: String(currentShowdown.id),
        seasonNumber,
        roundRecord: cloneSeasonValue(roundRecord),
        fingerprint: getSeasonReviewFingerprint(roundRecord)
    };
}

function appendSeasonReviewLine(container, label, value, className = ""){
    const row = document.createElement("div");
    row.className = `summaryLine seasonReviewLine${className ? ` ${className}` : ""}`;

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    container.appendChild(row);
}

function renderSeasonReviewAchievements(container, playerRecord){
    const group = document.createElement("div");
    group.className = "seasonReviewAchievements";

    [
        ["Champions League", playerRecord.championsLeague],
        ["Europa League", playerRecord.europaLeague === true],
        ["Domestic Cup", playerRecord.domesticCup],
        ["Top Scorer", playerRecord.topScorer],
        ["Top Assist", playerRecord.topAssist]
    ].forEach(([label, active]) => {
        const item = document.createElement("span");
        item.className = active ? "isEarned" : "isNotEarned";
        item.textContent = `${active ? "✓" : "—"} ${label}`;
        group.appendChild(item);
    });

    container.appendChild(group);
}

function renderManagerSeasonReview(container, managerName, clubName, playerRecord, options = {}){
    if(!container || !playerRecord){ return; }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSeasonReviewLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSeasonReviewLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSeasonReviewLine(fragment, "League Goals", playerRecord.leagueGoals);
    renderSeasonReviewAchievements(fragment, playerRecord);

    const scoreHeading = document.createElement("p");
    scoreHeading.className = "seasonReviewScoreHeading";
    scoreHeading.textContent = "CALCULATED SCORE";
    fragment.appendChild(scoreHeading);

    getScoringBreakdownLines(playerRecord.scoring, options).forEach(([label, points]) => {
        appendSeasonReviewLine(fragment, label, `+${points}`, points === 0 ? "isZero" : "isScoring");
    });

    const total = document.createElement("div");
    total.className = "summaryTotal seasonReviewTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function renderSeasonReview(draft){
    const ui = getSeasonUI();
    const roundRecord = draft.roundRecord;
    const seasonNumber = Number(draft.seasonNumber);

    setSeasonText(ui.entryTitle, `SEASON ${seasonNumber} REVIEW`);
    setSeasonText(ui.reviewHeading, `REVIEW SEASON ${seasonNumber} BEFORE SAVING`);
    setSeasonText(ui.reviewStatusMeta, `SEASON ${seasonNumber} · NOT SAVED YET`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.reviewResult, `${currentShowdown.managers.playerOne} is projected to win Season ${seasonNumber}`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.reviewResult, `${currentShowdown.managers.playerTwo} is projected to win Season ${seasonNumber}`);
    }else{
        setSeasonText(ui.reviewResult, `Season ${seasonNumber} is heading for a draw`);
    }

    const reviewRows = { europaRow: [roundRecord.playerOne, roundRecord.playerTwo].some(record => Number(record && record.scoring && record.scoring.europaLeague) > 0) };
    renderManagerSeasonReview(
        ui.reviewOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne,
        reviewRows
    );
    renderManagerSeasonReview(
        ui.reviewTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo,
        reviewRows
    );

    const priorOne = Number(currentShowdown.score && currentShowdown.score.playerOne) || 0;
    const priorTwo = Number(currentShowdown.score && currentShowdown.score.playerTwo) || 0;
    setSeasonText(
        ui.reviewOverall,
        `${currentShowdown.managers.playerOne} ${priorOne + roundRecord.playerOne.scoring.total}  •  ${priorTwo + roundRecord.playerTwo.scoring.total} ${currentShowdown.managers.playerTwo}`
    );

    setSeasonReviewError("");
    setSeasonEntryMode(true);

    if(ui.reviewHeading){
        window.requestAnimationFrame(() => ui.reviewHeading.focus({ preventScroll: true }));
    }
}

function completeCurrentSeason(){
    if(seasonCompletionInProgress){ return; }

    if(!currentShowdown){
        setSeasonEntryError("No Showdown in progress. Start or join one from Home.");
        return;
    }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    if(currentShowdown.status === "Completed"){
        const latestRound = currentShowdown.rounds[currentShowdown.rounds.length - 1];
        if(latestRound){
            renderSeasonSummary(latestRound);
            showScreen("seasonSummary");
        }
        return;
    }

    const validationMessage = getSeasonCompletionContextMessage();
    if(validationMessage){
        setSeasonEntryError(validationMessage);
        return;
    }

    try{
        seasonReviewDraft = createSeasonReviewDraft();
        if(!seasonReviewDraft.fingerprint){
            throw new Error("The Season Review snapshot could not be verified.");
        }
        setSeasonEntryError("");
        renderSeasonReview(seasonReviewDraft);
    }catch(error){
        clearSeasonReviewDraft();
        reportSeasonError("Season review failed", error);
    }
}

function getSeasonReviewConfirmationMessage(draft){
    if(!draft || !currentShowdown){
        return "The reviewed season is no longer available. Return to Edit Results and review it again.";
    }
    if(String(currentShowdown.id) !== String(draft.showdownId)){
        return "The active showdown changed after this review. Return to Edit Results and review the current season again.";
    }
    if(Number(currentShowdown.currentRound) !== Number(draft.seasonNumber)){
        return "The active season changed after this review. Return to Showdown Home before continuing.";
    }
    if(currentShowdown.status === "Completed"){
        return "This showdown has already been completed.";
    }
    if(!isTransferChallengeComplete(draft.seasonNumber)){
        return "The Transfer Challenge is no longer complete for this reviewed season.";
    }
    if(currentShowdown.rounds.some(round => Number(round.roundNumber) === Number(draft.seasonNumber))){
        return "This season has already been saved. Return to Showdown Home to continue.";
    }
    return "";
}

function confirmCurrentSeason(){
    if(seasonCompletionInProgress){ return; }

    if(typeof window.ensureCurrentShowdownNormalized === "function"){
        window.ensureCurrentShowdownNormalized();
    }

    const contextMessage = getSeasonReviewConfirmationMessage(seasonReviewDraft);
    if(contextMessage){
        setSeasonReviewError(contextMessage);
        return;
    }

    let roundRecord;
    try{
        roundRecord = buildTrustedSeasonRecordFromReview(seasonReviewDraft);
    }catch(error){
        reportSeasonError("Season confirmation blocked", error);
        return;
    }

    const seasonNumber = Number(seasonReviewDraft.seasonNumber);
    seasonCompletionInProgress = true;
    setSeasonConfirmationBusy(true);
    setSeasonReviewError("");

    try{
        persistCompletedSeason(roundRecord, seasonNumber);
        seasonEntryRenderedRound = null;
        seasonEntryRenderedShowdownId = null;
        seasonReviewDraft = null;
    }catch(error){
        reportSeasonError("Season completion failed", error);
        seasonCompletionInProgress = false;
        setSeasonConfirmationBusy(false);
        return;
    }

    try{
        seasonReviewActive = false;
        updateShowdownUI();
        renderSeasonSummary(roundRecord);

        if(!showScreen("seasonSummary")){
            throw new Error("The Season Summary screen could not be opened.");
        }

        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(`Season ${seasonNumber} saved successfully.`, "success", 3500);
        }
    }catch(error){
        console.error("Season was saved but the summary screen failed to render:", error);
        if(typeof window.reportApplicationError === "function"){
            window.reportApplicationError("The season is saved, but its summary did not open", error);
        }
        if(typeof window.showAppNotice === "function"){
            window.showAppNotice(
                "Season saved successfully, but the summary could not be displayed. Showdown Home remains safe to continue from.",
                "error",
                9000
            );
        }
        showScreen("dashboard");
    }finally{
        seasonCompletionInProgress = false;
        setSeasonConfirmationBusy(false);
    }
}

function editSeasonResults(){
    if(seasonCompletionInProgress){ return; }
    restoreSeasonEntryFromReview({ focus: true, clearDraft: true });
}

function renderSeasonSummary(roundRecord){
    if(!currentShowdown || !roundRecord){
        return;
    }

    const ui = getSeasonUI();
    setSeasonText(ui.summaryTitle, `SEASON ${roundRecord.roundNumber} SUMMARY`);

    if(roundRecord.winner === "playerOne"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerOne} wins the season`);
    }else if(roundRecord.winner === "playerTwo"){
        setSeasonText(ui.summaryResult, `${currentShowdown.managers.playerTwo} wins the season`);
    }else{
        setSeasonText(ui.summaryResult, "Season is a draw");
    }

    renderManagerSeasonSummary(
        ui.summaryOne,
        currentShowdown.managers.playerOne,
        currentShowdown.clubs.playerOne,
        roundRecord.playerOne
    );

    renderManagerSeasonSummary(
        ui.summaryTwo,
        currentShowdown.managers.playerTwo,
        currentShowdown.clubs.playerTwo,
        roundRecord.playerTwo
    );

    setSeasonText(
        ui.overall,
        `${currentShowdown.managers.playerOne} ${currentShowdown.score.playerOne}  •  ${currentShowdown.score.playerTwo} ${currentShowdown.managers.playerTwo}`
    );

    if(ui.nextButton){
        setSeasonText(
            ui.nextButton,
            currentShowdown.status === "Completed"
                ? "VIEW COMPLETED SHOWDOWN"
                : `START SEASON ${currentShowdown.currentRound} TRANSFER CHALLENGE`
        );
    }

    if(typeof window.refreshClubVisualIdentity === "function"){
        window.refreshClubVisualIdentity(currentShowdown);
    }
}

function renderManagerSeasonSummary(container, managerName, clubName, playerRecord){
    if(!container || !playerRecord){
        return;
    }

    const fragment = document.createDocumentFragment();

    const heading = document.createElement("h3");
    heading.textContent = managerName;
    fragment.appendChild(heading);

    const club = document.createElement("p");
    club.className = "summaryClub";
    club.textContent = clubName;
    fragment.appendChild(club);

    appendSummaryLine(fragment, "League Position", playerRecord.leaguePosition);
    appendSummaryLine(fragment, "League Points", playerRecord.leaguePoints);
    appendSummaryLine(fragment, "League Goals", playerRecord.leagueGoals);

    getScoringBreakdownLines(playerRecord.scoring).forEach(([label, points]) => {
        if(points > 0){
            appendSummaryLine(fragment, label, `+${points}`);
        }
    });

    const total = document.createElement("div");
    total.className = "summaryTotal";
    total.textContent = `SEASON SCORE  ${playerRecord.scoring.total}`;
    fragment.appendChild(total);

    container.replaceChildren(fragment);
}

function appendSummaryLine(container, label, value){
    const row = document.createElement("div");
    row.className = "summaryLine";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    container.appendChild(row);
}

function handleSeasonSummaryAction(){
    if(!currentShowdown){
        return;
    }

    if(currentShowdown.status === "Completed"){
        updateShowdownUI();
        showScreen("dashboard");
        return;
    }

    openTransferChallenge();
}

window.initializeSeasonEngine = initializeSeasonEngine;
window.openSeasonEntry = openSeasonEntry;
window.completeCurrentSeason = completeCurrentSeason;
window.confirmCurrentSeason = confirmCurrentSeason;
window.editSeasonResults = editSeasonResults;
window.getSeasonReviewIntegrity = getSeasonReviewIntegrity;
window.renderSeasonSummary = renderSeasonSummary;

```


## FILE: js/sharedSeasonResults.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r9";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["COLLECTING","RESULTS_READY"]);
  const OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  // r80 Europa League: optional 8th key, present only as exactly true for a manager who won it, never with championsLeague true
  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old hashes never change.
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","publishedRoles","results","receipts","contentHash"]);

  function ssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssrPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function ssrExact(value,keys,code="SEASON_RESULTS_VALUE_INVALID"){if(!ssrPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrFail(code);return value;}
  function ssrEuropaLeague(value,code){if(!ssrPlain(value))ssrFail(code);const won=Object.hasOwn(value,"europaLeague");ssrExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))ssrFail(code);return won;}
  function ssrClone(value){return JSON.parse(JSON.stringify(value));}
  function ssrFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrFreeze);Object.freeze(value);}return value;}
  function ssrCanonical(value){if(Array.isArray(value))return `[${value.map(ssrCanonical).join(",")}]`;if(ssrPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function ssrHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function ssrRole(value){if(!ROLES.includes(value))ssrFail("SEASON_RESULTS_ROLE_INVALID");return value;}
  function ssrSeason(value,totalSeasons){if(!Number.isInteger(value)||value<1||value>totalSeasons)ssrFail("SEASON_RESULTS_SEASON_INVALID");return value;}
  function ssrTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)ssrFail("SEASON_RESULTS_TEAM_COUNT_INVALID");return value;}
  function ssrRoleList(value,code="SEASON_RESULTS_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))ssrFail(code);return value;}
  function ssrConfirmedSetup(value){if(!ssrPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||![1,3,5,10].includes(value.totalSeasons))ssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))ssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");return value;}
  function ssrCareerReady(value){if(!ssrPlain(value)||value.phase!=="CAREER_START_READY"||value.revision!==2||!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))ssrFail("SEASON_RESULTS_CAREER_START_NOT_READY");return value;}
  function ssrTransferComplete(value,seasonNumber){if(!ssrPlain(value)||value.phase!=="COMPLETED"||value.seasonNumber!==seasonNumber||!Number.isInteger(value.revision)||value.revision<1)ssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");return value;}
  // An absent stat (null, "", blank, boolean, array) must not become a real 0.
  function ssrNumber(value){return typeof value==="number"||(typeof value==="string"&&value.trim()!=="")?Number(value):Number.NaN;}
  function ssrNormalizeResult(value,teamCount){
    const europaLeague=ssrEuropaLeague(value,"SEASON_RESULTS_PAYLOAD_INVALID");
    const position=ssrNumber(value.leaguePosition),points=ssrNumber(value.leaguePoints),goals=ssrNumber(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(position)||position<1||position>teamCount)ssrFail("SEASON_RESULTS_POSITION_INVALID");
    if(!Number.isInteger(points)||points<0||points>maxPoints)ssrFail("SEASON_RESULTS_POINTS_INVALID");
    if(!Number.isInteger(goals)||goals<0||goals>300)ssrFail("SEASON_RESULTS_GOALS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrFail("SEASON_RESULTS_PAYLOAD_INVALID");}
    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};
  }
  function ssrReceipt(value){ssrExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_RESULTS_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||value.type!=="publish-result"||!HASH.test(value.commandHash))ssrFail("SEASON_RESULTS_STATE_INVALID");return value;}
  async function ssrVerifyState(value,teamCount,cryptoImpl){
    ssrExact(value,STATE_KEYS,"SEASON_RESULTS_STATE_INVALID");const core=ssrClone(value),hash=core.contentHash;delete core.contentHash;
    if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>2||!HASH.test(hash))ssrFail("SEASON_RESULTS_STATE_INVALID");
    ssrRoleList(value.publishedRoles);
    ssrExact(value.results,ROLES,"SEASON_RESULTS_STATE_INVALID");
    for(const role of ROLES){const result=value.results[role];if(result!==null)ssrNormalizeResult(result,teamCount);if(value.publishedRoles.includes(role)!==(result!==null))ssrFail("SEASON_RESULTS_STATE_INVALID");}
    if(value.publishedRoles.length!==value.revision)ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(value.phase==="COLLECTING"&&value.publishedRoles.length!==1)ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(value.phase==="RESULTS_READY"&&value.publishedRoles.length!==2)ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)ssrFail("SEASON_RESULTS_STATE_INVALID");value.receipts.forEach(ssrReceipt);
    if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length||value.receipts.some((receipt,index)=>receipt.baseRevision!==index))ssrFail("SEASON_RESULTS_STATE_INVALID");
    if(await ssrHash(core,cryptoImpl)!==hash)ssrFail("SEASON_RESULTS_STATE_HASH_MISMATCH");
    return ssrFreeze(ssrClone(value));
  }
  function ssrCommand(value,teamCount){if(!ssrPlain(value))ssrFail("SEASON_RESULTS_COMMAND_INVALID");ssrExact(value,["type","operationId","baseRevision","result"],"SEASON_RESULTS_COMMAND_INVALID");if(value.type!=="publish-result"||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||value.baseRevision>2)ssrFail("SEASON_RESULTS_COMMAND_INVALID");return {type:value.type,operationId:value.operationId,baseRevision:value.baseRevision,result:ssrNormalizeResult(value.result,teamCount)};}

  async function ssrCreateProtocol({teamCount,cryptoImpl=root.crypto}={}){
    const teams=ssrTeamCount(teamCount);
    async function seal(core){return ssrFreeze({...ssrClone(core),contentHash:await ssrHash(core,cryptoImpl)});}
    async function verifyState(value){return ssrVerifyState(value,teams,cryptoImpl);}
    async function apply({state=null,setup,careerStart,transferChallenge,seasonNumber,actorRole,command}){
      const confirmed=ssrConfirmedSetup(setup);ssrCareerReady(careerStart);const season=ssrSeason(seasonNumber,confirmed.totalSeasons);ssrTransferComplete(transferChallenge,season);const role=ssrRole(actorRole),cmd=ssrCommand(command,teams),current=state?await verifyState(state):null;
      if(current&&current.seasonNumber!==season)ssrFail("SEASON_RESULTS_SEASON_MISMATCH");
      const commandHash=await ssrHash({actorRole:role,...cmd},cryptoImpl);
      if(current){const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);if(prior){if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)ssrFail("SEASON_RESULTS_IDEMPOTENCY_CONFLICT");return ssrFreeze({ok:true,idempotent:true,state:current});}}
      const revision=current?current.revision:0;if(cmd.baseRevision!==revision)ssrFail("SEASON_RESULTS_STALE_BASE_REVISION");if(current&&current.phase==="RESULTS_READY")ssrFail("SEASON_RESULTS_ALREADY_READY");if(current&&current.publishedRoles.includes(role))ssrFail("SEASON_RESULTS_ROLE_ALREADY_PUBLISHED");
      const core=current?ssrClone(current):{schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:season,phase:"COLLECTING",revision:0,publishedRoles:[],results:{playerOne:null,playerTwo:null},receipts:[]};delete core.contentHash;
      core.results[role]=cmd.result;core.publishedRoles.push(role);core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});core.revision=revision+1;if(core.publishedRoles.length===2)core.phase="RESULTS_READY";
      const next=await seal(core);await verifyState(next);return ssrFreeze({ok:true,idempotent:false,state:next});
    }
    function projectForRole(state,role){ssrRole(role);const current=ssrClone(state),opponent=role==="playerOne"?"playerTwo":"playerOne";const ready=current.phase==="RESULTS_READY";return ssrFreeze({schemaVersion:current.schemaVersion,runtimeRevision:current.runtimeRevision,seasonNumber:current.seasonNumber,phase:current.phase,revision:current.revision,publishedRoles:[...current.publishedRoles],managerRole:role,ownResult:current.results[role],opponentResult:ready?current.results[opponent]:null,allResults:ready?current.results:null});}
    return ssrFreeze({contractVersion:1,feature:"ssjr-shared-season-results",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,resultKeys:RESULT_KEYS,teamCount:teams,apply,verifyState,projectForRole,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,privateUntilBothPublished:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-season-results-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,resultKeys:RESULT_KEYS,createProtocol:ssrCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,privateUntilBothPublished:true});
});
```


## FILE: js/productionSharedSeasonResults.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  // Job 33 (R1): after publishing, read every 3 s for at most 3 minutes while the rival has not published yet.
  const FAST_POLL_MS=3000,FAST_POLL_WINDOW_MS=180000;
  let fastWaitKey="",fastWaitSince=0;
  const CONTROL_IDS=Object.freeze(["completeSeason","confirmSeasonCompletion","editSeasonResults"]);
  // r80: EuropaLeague is a check like the others (index >= 3). One manager plays the Champions League or the Europa League in a
  // season, never both: ticking one unticks the other (pssrContinental), and the read refuses both. The two managers play different
  // FIFA saves, so nothing is ever compared across them.
  const RESULT_SUFFIXES=Object.freeze(["LeaguePosition","LeaguePoints","LeagueGoals","DomesticCup","ChampionsLeague","EuropaLeague","TopScorer","TopAssist"]);
  let formContextKey="",installed=false,busy=false,provider=null,setupApi=null,transferApi=null,catalogApi=null,view=null,draft=null,pollTimer=null,providerChain=Promise.resolve(),refreshPromise=null,contextKey="",renderedContextKey="",errorNode=null,errorMessage="";

  function pssrFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function pssrShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function pssrSharedMarker(){const showdown=pssrShowdown();return Boolean(showdown&&showdown.sharedJourney&&showdown.sharedJourney.mode==="shared");}
  function pssrReport(context,error){const terminalClose=root.CareerModeProductionSharedTerminalClose;if(terminalClose&&typeof terminalClose.reportUnlessClosed==="function"){void terminalClose.reportUnlessClosed(context,error);return;}if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function pssrField(id){return root.document&&root.document.getElementById(id);}
  function pssrText(id,value){const node=pssrField(id);if(node)node.textContent=String(value??"");return node;}
  function pssrHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function pssrDisable(node,disabled){if(!node)return;node.disabled=Boolean(disabled);node.setAttribute("aria-disabled",disabled?"true":"false");}
  function pssrLoadScript(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("Release-owned runtime loader is unavailable."));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)throw new Error(`${path} loaded without its expected API.`);return api;});}
  async function pssrEnsureDependencies(){
    if(typeof root.ensureGameplayModules==="function")await root.ensureGameplayModules();
    else if(typeof root.ensureGameplayRuntime==="function")await root.ensureGameplayRuntime();
    await pssrLoadScript("ssjr-production-setup","js/productionSharedShowdownSetup.js",()=>root.CareerModeProductionSharedShowdownSetup);
    await pssrLoadScript("ssjr-production-transfer-challenge","js/productionSharedTransferChallenge.js",()=>root.CareerModeProductionSharedTransferChallenge);
    await pssrLoadScript("ssjr-shared-setup-catalog","js/sharedShowdownCatalog.js",()=>root.CareerModeSharedShowdownCatalog);
    await pssrLoadScript("ssjr-shared-setup-protocol","js/sharedShowdownSetup.js",()=>root.CareerModeSharedShowdownSetup);
    await pssrLoadScript("ssjr-season-results-protocol","js/sharedSeasonResults.js",()=>root.CareerModeSharedSeasonResults);
    await pssrLoadScript("ssjr-season-results-provider","js/sparkSharedSeasonResults.js",()=>root.CareerModeSparkSharedSeasonResults);
    await pssrLoadScript("firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime);
    setupApi=root.CareerModeProductionSharedShowdownSetup;transferApi=root.CareerModeProductionSharedTransferChallenge;provider=root.CareerModeSparkSharedSeasonResults;catalogApi=root.CareerModeSharedShowdownCatalog;
    if(!setupApi||typeof setupApi.refresh!=="function"||typeof setupApi.getState!=="function")pssrFail("SEASON_RESULTS_SETUP_UNAVAILABLE");
    if(!transferApi||typeof transferApi.refresh!=="function"||typeof transferApi.getState!=="function")pssrFail("SEASON_RESULTS_TRANSFER_UNAVAILABLE");
    if(!provider||typeof provider.read!=="function"||typeof provider.publishResult!=="function")pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
  }
  function pssrSeason(){const progression=root.CareerModeProductionSharedMultiSeasonProgression,fallback=pssrShowdown()?.currentRound,season=Number(pssrSharedMarker()&&progression&&typeof progression.resolveSeason==="function"?progression.resolveSeason(fallback):fallback);if(!Number.isInteger(season)||season<1)pssrFail("SEASON_RESULTS_SEASON_INVALID");return season;}
  function pssrRolePrefix(role){return role==="playerOne"?"p1":"p2";}
  function pssrOtherRole(role){return role==="playerOne"?"playerTwo":"playerOne";}
  function pssrManagerName(role){const showdown=pssrShowdown();return showdown?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2");}
  function pssrSetupState(){try{return setupApi?.getState?.()||null;}catch(_error){return null;}}
  function pssrTransferState(){try{return transferApi?.getState?.()||null;}catch(_error){return null;}}
  function pssrClubName(role){const setup=pssrSetupState()?.setup||pssrTransferState()?.setup;return setup?.clubs?.[role]||pssrShowdown()?.clubs?.[role]||"Club";}
  function pssrRequestContext(){
    const showdown=pssrShowdown(),setup=pssrSetupState(),rivalryId=String(showdown?.sharedJourney?.rivalryId||setup?.rivalryId||"").trim();let seasonNumber;
    try{seasonNumber=pssrSeason();}catch(_error){return null;}
    const saveId=String(showdown?.id||showdown?.saveId||"").trim();
    const key=rivalryId&&seasonNumber?`${saveId||"shared"}|${rivalryId}:season_${seasonNumber}`:"";
    return key?Object.freeze({key,rivalryId,seasonNumber}):null;
  }
  function pssrContextMatches(request){const current=pssrRequestContext();return Boolean(request&&current&&request.key===current.key);}
  function pssrTransferComplete(request){const transfer=pssrTransferState();return Boolean(request&&transfer&&Number(transfer.seasonNumber)===request.seasonNumber&&transfer.state&&transfer.state.phase==="COMPLETED");}
  // F1 (fault suite): after a reload or in a stale tab, a closed Showdown's Champion screen is this screen (js/seasonFinalV10.js
  // draws Final Winner from Terminal Close's verified witness), so the route allows it while Terminal Close holds it CLOSED.
  function pssrClosedChampion(){try{const t=root.CareerModeProductionSharedTerminalClose?.getState?.();return Boolean(pssrSharedMarker()&&t&&t.phase==="CLOSED"&&t.terminal===true&&t.terminalWitness);}catch(_error){return false;}}
  function pssrCanRoute(){if(pssrClosedChampion())return true;const request=pssrRequestContext();return Boolean(pssrSharedMarker()&&request&&contextKey===request.key&&view&&view.managerRole&&view.rivalryId===request.rivalryId&&Number(view.seasonNumber)===request.seasonNumber&&pssrTransferComplete(request));}
  function pssrResultError(result,message){if(result&&result.ok===true)return result;const error=new Error(message||"The Season Results request was rejected.");error.code=result&&result.code||"SEASON_RESULTS_PROVIDER_FAILED";throw error;}
  // JOB-1611: provider codes that mean "contended", not "refused": Firestore lock contention after the SDK's own retries.
  const PSSR_CONTENTION_CODES=Object.freeze(["aborted","failed-precondition","permission-denied","firestore/permission-denied","permission_denied"]);
  const PSSR_CONTENTION_RETRY_MS=Object.freeze([500,1000,1500]);
  const PSSR_DENIED_CODES=Object.freeze(["permission-denied","firestore/permission-denied","permission_denied"]),PSSR_READ_RETRY_CODES=Object.freeze([...PSSR_CONTENTION_CODES,"unavailable","deadline-exceeded","SEASON_RESULTS_PROVIDER_UNAVAILABLE","SEASON_RESULTS_PROVIDER_FAILED"]);
  function pssrWait(ms){return new Promise(resolve=>{const timer=typeof root.setTimeout==="function"?root.setTimeout:setTimeout;timer(resolve,ms);});}
  // JOB-1611: the reads inside a publish meet the same contention; they get the same bounded wait before failing as before.
  async function pssrPublishRead(ctx,request){let read=await provider.read(ctx.options);for(let retry=0;read?.ok!==true&&PSSR_CONTENTION_CODES.includes(read?.code)&&retry<PSSR_CONTENTION_RETRY_MS.length&&pssrContextMatches(request);retry+=1){await pssrWait(PSSR_CONTENTION_RETRY_MS[retry]);read=await provider.read(ctx.options);}return pssrResultError(read,"Season Results could not be refreshed before publishing.");}
  function pssrQueueProvider(task){const run=providerChain.then(task,task);providerChain=run.catch(()=>{});return run;}
  // Job 33 (R1): a fast waiting read (light) reuses the already-confirmed Setup and the COMPLETED Transfer Challenge.
  async function pssrProviderContext(request=pssrRequestContext(),light=false){
    if(!pssrSharedMarker())pssrFail("SEASON_RESULTS_SHARED_MODE_REQUIRED");
    if(!request||!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    await pssrEnsureDependencies();
    if(!(light===true&&pssrSetupState()?.ready===true&&pssrTransferComplete(request))){
      await setupApi.refresh();if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
      try{await transferApi.refresh();}catch(error){if(!(pssrContextMatches(request)&&pssrTransferComplete(request)))throw error;}if(!pssrContextMatches(request))pssrFail("SEASON_RESULTS_CONTEXT_STALE");
    }
    if(!pssrTransferComplete(request))pssrFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE","Finish the Transfer Challenge before publishing Season Results.");
    const setup=pssrSetupState();
    if(!setup||setup.ready!==true||!setup.setup||setup.setup.phase!=="SHOWDOWN_CONFIRMED"||setup.setup.revision!==6||!setup.managerRole||!setup.rivalryId||!setup.sessionId||!setup.deviceId)pssrFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    const runtime=root.CareerModeProductionFirebaseRuntime,services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtime.ensureAccountServices());
    if(!services||services.ok===false||!services.auth?.currentUser||!services.firestore||!services.firestoreSdk)pssrFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE","Connected account services are unavailable.");
    return Object.freeze({setup,options:{user:services.auth.currentUser,firestore:services.firestore,firebaseSdk:services.firestoreSdk,rivalryId:setup.rivalryId,sessionId:setup.sessionId,deviceId:setup.deviceId,seasonNumber:request.seasonNumber,cryptoImpl:root.crypto,nowEpochMs:Date.now()}});
  }
  async function pssrRefreshNow(request=pssrRequestContext(),light=false){
    if(!request)return null;
    const ctx=await pssrProviderContext(request,light);if(!pssrContextMatches(request))return null;
    const result=pssrResultError(await provider.read(ctx.options),"Season Results could not be loaded.");if(!pssrContextMatches(request))return null;
    view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;pssrRender();
    if(result.ownResult||result.state?.phase==="RESULTS_READY")pssrSetError("");
    return view;
  }
  function pssrRefresh(light=false){const request=pssrRequestContext();if(!request)return Promise.resolve(null);if(refreshPromise&&contextKey===request.key)return refreshPromise;const current=pssrQueueProvider(()=>pssrRefreshNow(request,light===true));refreshPromise=current;current.then(()=>{if(refreshPromise===current)refreshPromise=null;},()=>{if(refreshPromise===current)refreshPromise=null;});return current;}
  function pssrRandomOperationId(){if(!root.crypto||typeof root.crypto.getRandomValues!=="function")pssrFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=new Uint8Array(16);root.crypto.getRandomValues(bytes);return `season_result_op_${Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")}`;}
  function pssrTeamCount(){const stateCount=view?.state?.teamCount;if(Number.isInteger(stateCount)&&stateCount>=2&&stateCount<=20)return stateCount;const leagueId=view?.setup?.leagueId||pssrSetupState()?.setup?.leagueId,catalog=catalogApi?.catalog;const clubs=catalog&&leagueId?catalog[leagueId]:null;return Array.isArray(clubs)&&clubs.length>=2&&clubs.length<=20?clubs.length:20;}
  function pssrReadForm(role){
    const prefix=pssrRolePrefix(role),position=pssrField(`${prefix}LeaguePosition`),points=pssrField(`${prefix}LeaguePoints`),goals=pssrField(`${prefix}LeagueGoals`);
    if(!position||!points||!goals||position.value===""||points.value===""||goals.value==="")pssrFail("SEASON_RESULTS_FORM_INCOMPLETE",`Enter league position, league points and league goals for ${pssrManagerName(role)}.`);
    const result={leaguePosition:Number(position.value),leaguePoints:Number(points.value),leagueGoals:Number(goals.value),domesticCup:Boolean(pssrField(`${prefix}DomesticCup`)?.checked),championsLeague:Boolean(pssrField(`${prefix}ChampionsLeague`)?.checked),topScorer:Boolean(pssrField(`${prefix}TopScorer`)?.checked),topAssist:Boolean(pssrField(`${prefix}TopAssist`)?.checked)};
    // The stored result carries europaLeague only when it is true (the sparse key; an unticked box leaves the 7-key r79 shape).
    if(pssrField(`${prefix}EuropaLeague`)?.checked===true){if(result.championsLeague)pssrFail("SEASON_RESULTS_CONTINENTAL_CONFLICT",`${pssrManagerName(role)}: pick Champions League or Europa League, not both.`);result.europaLeague=true;}
    const teamCount=pssrTeamCount(),maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(result.leaguePosition)||result.leaguePosition<1||result.leaguePosition>teamCount)pssrFail("SEASON_RESULTS_POSITION_INVALID",`${pssrManagerName(role)}'s league position must be a whole number from 1 to ${teamCount}.`);
    if(!Number.isInteger(result.leaguePoints)||result.leaguePoints<0||result.leaguePoints>maxPoints)pssrFail("SEASON_RESULTS_POINTS_INVALID",`${pssrManagerName(role)}'s league points must be a whole number from 0 to ${maxPoints}.`);
    if(!Number.isInteger(result.leagueGoals)||result.leagueGoals<0||result.leagueGoals>300)pssrFail("SEASON_RESULTS_GOALS_INVALID",`${pssrManagerName(role)}'s league goals must be a whole number from 0 to 300.`);
    return Object.freeze(result);
  }
  function pssrFingerprint(result){return JSON.stringify({leaguePosition:Number(result.leaguePosition),leaguePoints:Number(result.leaguePoints),leagueGoals:Number(result.leagueGoals),domesticCup:Boolean(result.domesticCup),championsLeague:Boolean(result.championsLeague),topScorer:Boolean(result.topScorer),topAssist:Boolean(result.topAssist),europaLeague:result.europaLeague===true});}
  function pssrPopulate(role,result){if(!result)return;const prefix=pssrRolePrefix(role);pssrField(`${prefix}LeaguePosition`).value=String(result.leaguePosition);pssrField(`${prefix}LeaguePoints`).value=String(result.leaguePoints);pssrField(`${prefix}LeagueGoals`).value=String(result.leagueGoals);for(const [suffix,key] of [["DomesticCup","domesticCup"],["ChampionsLeague","championsLeague"],["EuropaLeague","europaLeague"],["TopScorer","topScorer"],["TopAssist","topAssist"]]){const input=pssrField(`${prefix}${suffix}`);if(input)input.checked=result[key]===true;}}
  function pssrDisableRole(role,disabled){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach(suffix=>pssrDisable(pssrField(`${prefix}${suffix}`),disabled));}
  // QoL 3: a half-typed result survives a reload. Own manager only, this device only, through the js/storage.js draft helpers; removed on publish.
  function pssrDraftFieldIds(role){const prefix=pssrRolePrefix(role);return RESULT_SUFFIXES.map(suffix=>`${prefix}${suffix}`);}
  function pssrDraftKey(role,request=pssrRequestContext()){return request&&(role==="playerOne"||role==="playerTwo")?`cms.draft.v1:${request.rivalryId}:${request.seasonNumber}:${role}:seasonResult`:"";}
  function pssrDraftClear(role,request=pssrRequestContext()){const key=pssrDraftKey(role,request);if(key&&typeof root.removeStorageValue==="function")root.removeStorageValue(key);}
  function pssrDraftSave(){
    const request=pssrRequestContext(),role=view?.managerRole;
    const key=pssrDraftKey(role,request);if(!key||contextKey!==request.key||view.ownResult||view.state?.phase==="RESULTS_READY"||typeof root.writeStorageValue!=="function")return false;
    const prefix=pssrRolePrefix(role),values={},checks={};let any=false;
    RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){values[suffix]=String(input.value||"");if(values[suffix])any=true;}else if(suffix!=="EuropaLeague"||input.checked){checks[suffix]=Boolean(input.checked);if(checks[suffix])any=true;}});
    if(!any){pssrDraftClear(role,request);return true;}
    return root.writeStorageValue(key,JSON.stringify({version:1,rivalryId:request.rivalryId,seasonNumber:request.seasonNumber,role,values,checks}))===true;
  }
  function pssrDraftRestore(role){
    const request=pssrRequestContext(),key=pssrDraftKey(role,request);if(!key||typeof root.readStorageValue!=="function")return false;
    let saved;try{saved=JSON.parse(root.readStorageValue(key)||"null");}catch(_error){return false;}
    if(!saved||saved.version!==1||saved.rivalryId!==request.rivalryId||Number(saved.seasonNumber)!==request.seasonNumber||saved.role!==role)return false;
    const prefix=pssrRolePrefix(role),values=saved.values&&typeof saved.values==="object"?saved.values:{},checks=saved.checks&&typeof saved.checks==="object"?saved.checks:{};
    RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3){if(input.value===""&&typeof values[suffix]==="string")input.value=values[suffix].slice(0,12);}else if(!input.checked&&checks[suffix]===true)input.checked=true;});
    return true;
  }
  function pssrContinental(id){const match=/^(p[12])(ChampionsLeague|EuropaLeague)$/.exec(String(id||""));if(!match||pssrField(id)?.checked!==true)return;const other=pssrField(`${match[1]}${match[2]==="ChampionsLeague"?"EuropaLeague":"ChampionsLeague"}`);if(other?.checked)other.checked=false;}
  function pssrDraftChange(event){const role=view?.managerRole,id=event?.target?.id;pssrContinental(id);if(!role||!id||!pssrSharedMarker()||!pssrDraftFieldIds(role).includes(id))return;pssrDraftSave();}
  function pssrCard(role){const input=pssrField(`${pssrRolePrefix(role)}LeaguePosition`);return input&&input.closest?input.closest(".seasonResultCard"):null;}
  function pssrSetError(message=""){
    const value=String(message||"");
    if(!value){if(errorNode&&errorNode.textContent===errorMessage)errorNode.textContent="";errorNode=null;errorMessage="";return;}
    const panel=pssrField("seasonReviewPanel"),target=panel&&!panel.classList.contains("hidden")?pssrField("seasonReviewError"):pssrField("seasonEntryError");
    if(target){target.textContent=value;errorNode=target;errorMessage=value;}
  }
  function pssrAppendLine(container,label,value){const row=root.document.createElement("div"),name=root.document.createElement("span"),data=root.document.createElement("strong");row.className="summaryLine seasonReviewLine";name.textContent=label;data.textContent=String(value);row.append(name,data);container.append(row);}
  // r86: the published card shows the manager's Special Player under the name, as the entry card does (none before r86).
  function pssrSpecialPlayerSlot(role){try{const api=root.CareerModeSpecialPlayerChip,sp=api?.live?.(),chip=sp?api.element(root.document,sp[role==="playerOne"?"daniel":"nik"]):null;if(!chip)return null;const slot=root.document.createElement("span");slot.className="seasonSpecialPlayer";slot.appendChild(chip);return slot;}catch(_error){return null;}}
  function pssrRenderReviewCard(container,role,result){if(!container||!result)return;const fragment=root.document.createDocumentFragment(),heading=root.document.createElement("h3"),club=root.document.createElement("p"),special=pssrSpecialPlayerSlot(role);heading.textContent=pssrManagerName(role);club.className="summaryClub";club.textContent=pssrClubName(role);fragment.append(heading);if(special)fragment.append(special);fragment.append(club);pssrAppendLine(fragment,"League Position",result.leaguePosition);pssrAppendLine(fragment,"League Points",result.leaguePoints);pssrAppendLine(fragment,"League Goals",result.leagueGoals);const achievements=root.document.createElement("div");achievements.className="seasonReviewAchievements";[["Champions League",result.championsLeague],["Europa League",result.europaLeague===true],["Domestic Cup",result.domesticCup],["Top Scorer",result.topScorer],["Top Assist",result.topAssist]].forEach(([label,active])=>{const item=root.document.createElement("span");item.className=active?"isEarned":"isNotEarned";item.textContent=`${active?"✓":"—"} ${label}`;achievements.append(item);});fragment.append(achievements);container.replaceChildren(fragment);}
  function pssrEntryMode(reviewing){const panel=pssrField("seasonReviewPanel"),grid=root.document?.querySelector?.("#seasonEntry .seasonEntryGrid"),hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint"),actions=pssrField("completeSeason")?.closest?.(".seasonEntryActions");pssrHidden(panel,!reviewing);pssrHidden(grid,reviewing);pssrHidden(hint,reviewing);pssrHidden(actions,reviewing);if(pssrField("seasonEntry"))pssrField("seasonEntry").dataset.sharedSeasonResults=reviewing?"review":"entry";}
  function pssrRenderReview(result,{waiting=false,ready=false}={}){
    const role=view?.managerRole,other=pssrOtherRole(role),one=pssrField("seasonReviewOne"),two=pssrField("seasonReviewTwo"),ownCard=role==="playerOne"?one:two,otherCard=role==="playerOne"?two:one,confirm=pssrField("confirmSeasonCompletion"),edit=pssrField("editSeasonResults"),overall=pssrField("seasonReviewOverallScore")?.closest?.(".seasonReviewOverall"),warning=root.document?.querySelector?.("#seasonReviewPanel .seasonReviewWarning");
    pssrEntryMode(true);pssrHidden(overall,true);pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonReviewHeading",ready?"BOTH MANAGERS PUBLISHED":waiting?"YOUR RESULT IS PUBLISHED":"REVIEW YOUR SEASON RESULT");pssrText("seasonReviewStatusMeta",ready?"":waiting?"PUBLISHED · WAITING FOR YOUR RIVAL":"NOT PUBLISHED YET");pssrHidden(pssrField("seasonReviewStatusMeta")?.closest?.(".seasonReviewStatus"),ready);
    pssrRenderReviewCard(ownCard,role,result);pssrHidden(ownCard,false);
    if(ready&&view?.opponentResult){pssrRenderReviewCard(otherCard,other,view.opponentResult);pssrHidden(otherCard,false);pssrText("seasonReviewResult","Both managers published their FIFA 17 season results.");}
    else{pssrHidden(otherCard,true);pssrText("seasonReviewResult",waiting?"Your rival sees this only after publishing theirs. This screen updates by itself.":"Check your results. Once published, they are final.");}
    // Job 33 (R8): once both published, the Shared Season Commit status below is the one banner that says what to tap next.
    if(warning){pssrHidden(warning,ready);if(!ready)warning.textContent="PUBLISHING IS FINAL";}
    if(confirm){pssrHidden(confirm,ready);pssrDisable(confirm,busy||waiting);confirm.textContent=waiting?"PUBLISHED ✓":"PUBLISH MY SEASON RESULT";}
    if(edit){pssrHidden(edit,ready||waiting);pssrDisable(edit,busy);edit.textContent="EDIT MY RESULT";}
  }
  function pssrRenderEntry(){
    const role=view?.managerRole;if(!role)return;const other=pssrOtherRole(role),own=view?.ownResult||null,ready=view?.state?.phase==="RESULTS_READY";
    pssrText("seasonEntryTitle",`SEASON ${view?.seasonNumber||pssrSeason()} RESULTS`);pssrText("seasonManagerOne",pssrManagerName("playerOne"));pssrText("seasonManagerTwo",pssrManagerName("playerTwo"));pssrText("seasonClubOne",pssrClubName("playerOne"));pssrText("seasonClubTwo",pssrClubName("playerTwo"));
    if(own)pssrPopulate(role,own);if(ready&&view?.opponentResult)pssrPopulate(other,view.opponentResult);
    if(own||ready){pssrDraftClear(role);pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(own||view?.allResults?.[role],{waiting:!ready,ready});return;}
    if(draft&&draft.contextKey===contextKey&&draft.seasonNumber===view.seasonNumber&&draft.managerRole===role){pssrDisableRole(role,true);pssrDisableRole(other,true);pssrRenderReview(draft.result);return;}
    pssrEntryMode(false);pssrHidden(pssrCard(role),false);pssrHidden(pssrCard(other),true);pssrDraftRestore(role);pssrDisableRole(role,false);pssrDisableRole(other,true);const complete=pssrField("completeSeason");if(complete){complete.textContent="REVIEW MY SEASON RESULT";pssrDisable(complete,busy);}const hint=root.document?.querySelector?.("#seasonEntry .seasonEntryHint");if(hint)hint.textContent=`Enter ${pssrManagerName(role)}'s FIFA 17 season result. Your rival enters theirs on their own device.`;
  }
  // H1017-4: a new shared season or manager role starts from an empty form for both managers. Same-context polls keep typed input.
  // formContextKey is the last context the form was rendered for; the tick's context reset leaves it alone so the change is still seen.
  function pssrClearForm(){for(const role of ["playerOne","playerTwo"]){const prefix=pssrRolePrefix(role);RESULT_SUFFIXES.forEach((suffix,index)=>{const input=pssrField(`${prefix}${suffix}`);if(!input)return;if(index<3)input.value="";else input.checked=false;});}}
  // r75: a screen that starts or stops waiting on the partner registers its live listener at once (on the render that
  // shows the new state) instead of on the next 3 s check, so the partner's move is seen as soon as it lands.
  let pssrWatchedKey=null;
  function pssrWatchSync(){let key="";try{key=pssrWaitingKey()+"|"+(root.document?.visibilityState||"");}catch(_error){key="";}if(key===pssrWatchedKey)return;pssrWatchedKey=key;try{pssrWatchWait();}catch(_error){}}
  function pssrRender(){pssrWatchSync();if(!root.document||!pssrSharedMarker()||!view)return false;const request=pssrRequestContext();if(!request||contextKey!==request.key)return false;if(renderedContextKey!==request.key){renderedContextKey=request.key;draft=null;}const formKey=`${request.key}|${view.managerRole||""}`;if(formContextKey&&formContextKey!==formKey){draft=null;pssrClearForm();}formContextKey=formKey;pssrRenderEntry();return true;}
  function pssrBeginReview(){
    if(!view||!view.managerRole)return false;if(view.ownResult){root.CareerModeSeasonFinalV10?.reviewFinalSeason?.();pssrRender();return true;}
    try{const result=pssrReadForm(view.managerRole);draft={contextKey,seasonNumber:view.seasonNumber,managerRole:view.managerRole,result,fingerprint:pssrFingerprint(result),operationId:null,baseRevision:null};pssrSetError("");pssrRenderReview(result);return true;}catch(error){draft=null;pssrSetError(error.message||error.code);return false;}
  }
  function pssrEdit(){if(busy||view?.ownResult)return false;draft=null;pssrSetError("");pssrEntryMode(false);pssrRenderEntry();const input=pssrField(`${pssrRolePrefix(view.managerRole)}LeaguePosition`);input?.focus?.({preventScroll:true});return true;}
  // Prime Pack: the manager who named this season's masked Icon first publishes his result with primePack:N, N = 4, 3, 2 or 1
  // by the stage of his right guess (the Rules accept it only when the round record names him and its server time gives N). Read once from the round record, only for a Showdown that plays
  // Prime Pack; an older Showdown never loads the step or reads anything. A read that fails stops the publish (TRY AGAIN),
  // so a won point is never dropped by a bad connection.
  const PRIME_PACK_FROM_MS=Date.parse("2026-10-30T00:00:00Z");
  async function pssrWithPrimePack(ctx,request,result){
    const confirmedAtMs=pssrSetupState()?.setupUpdatedAtMs;
    // Old Showdowns never load the step (the same boundary as js/iconGuess.js fromMs; a contract keeps them equal).
    if(!Number.isFinite(confirmedAtMs)||confirmedAtMs<PRIME_PACK_FROM_MS||root.CMS_PRIME_PACK==="off"||!result||typeof result!=="object")return result;
    const step=root.CareerModeIconGuessStep||await (typeof root.loadRuntimeScript==="function"?root.loadRuntimeScript("prime-pack-step","js/iconGuessStep.js",()=>root.CareerModeIconGuessStep).then(()=>root.CareerModeIconGuessStep,()=>null):null);
    // applies() needs the round engine (js/iconGuess.js): load it first, or a won Prime Pack point would be dropped.
    if(!step||!await step.ensure())pssrFail("SEASON_RESULTS_PRIME_PACK_UNAVAILABLE","Prime Pack could not load. Check the connection and try again.");
    const gameCtx={rivalryId:ctx.options.rivalryId,managerRole:ctx.setup.managerRole,season:request.seasonNumber,confirmedAtMs};
    if(!step.applies(gameCtx))return result;
    const points=await step.pointsFor({firestore:ctx.options.firestore,sdk:ctx.options.firebaseSdk,rivalryId:ctx.options.rivalryId},gameCtx);
    const{primePack:_drop,...rest}=result;
    return Number.isInteger(points)&&points>=1&&points<=4?{...rest,primePack:points}:rest;
  }
  async function pssrPublish(){
    if(busy||!draft||!view?.managerRole)return false;
    if(draft.contextKey!==contextKey||draft.seasonNumber!==view.seasonNumber||draft.managerRole!==view.managerRole){pssrSetError("The shared season context changed. Review your result again.");draft=null;return false;}
    let currentResult;try{currentResult=pssrReadForm(view.managerRole);}catch(error){pssrSetError(error.message||error.code);return false;}
    if(pssrFingerprint(currentResult)!==draft.fingerprint){pssrSetError("Your season result changed after review. Choose Edit My Result and review it again before publishing.");return false;}
    const request=pssrRequestContext();if(!request||!pssrContextMatches(request))return false;busy=true;pssrSetError("");const publishRole=view.managerRole;pssrRender();
    try{
      return await pssrQueueProvider(async()=>{
        const ctx=await pssrProviderContext(request);if(!pssrContextMatches(request))return false;
        let current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;
        let staleRetried=false,contentionRetries=0;
        for(;;){
          if(current.ownResult){pssrDraftClear(publishRole,request);view={...current,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;pssrRender();return true;}
          draft.operationId=draft.operationId||pssrRandomOperationId();draft.baseRevision=Number(current.revision||0);
          const publishedResult=await pssrWithPrimePack(ctx,request,draft.result);if(!pssrContextMatches(request))return false;
          const published=await provider.publishResult({...ctx.options,operationId:draft.operationId,baseRevision:draft.baseRevision,result:publishedResult});
          if(published?.code==="SEASON_RESULTS_STALE_BASE_REVISION"&&!staleRetried){staleRetried=true;current=await pssrPublishRead(ctx,request);if(!pssrContextMatches(request))return false;continue;}
          // JOB-1611: two same-moment publishes can both lose to lock contention instead of one losing to the other's write.
          // One manager then gets aborted (SDK retries spent) or permission-denied (the rival's retried write had not landed
          // by the provider's last re-read) while the rival quietly retries and wins. Wait, re-read and publish again with
          // the same operationId (an own write that did land is bound, never written twice); bounded, then surfaced as before.
          // Fable job 3 F3-11: a denied publish whose re-read is refused outright (the partner ENDed the Showdown: RIVALRY_INACTIVE;
          // the Session closed) is a refusal, not contention: it stops at once with the same message instead of three more
          // publishes and re-reads. A re-read that is itself contended, denied or offline keeps the bounded JOB-1611 retry.
          if(PSSR_CONTENTION_CODES.includes(published?.code)&&contentionRetries<PSSR_CONTENTION_RETRY_MS.length){await pssrWait(PSSR_CONTENTION_RETRY_MS[contentionRetries]);contentionRetries+=1;if(!pssrContextMatches(request))return false;const fresh=await provider.read(ctx.options);if(!pssrContextMatches(request))return false;if(!(fresh?.ok!==true&&PSSR_DENIED_CODES.includes(published.code)&&!PSSR_READ_RETRY_CODES.includes(fresh?.code))){if(fresh?.ok===true)current=fresh;continue;}}
          const result=pssrResultError(published,"Your Season Result could not be published.");if(!pssrContextMatches(request))return true;
          pssrDraftClear(publishRole,request);view={...result,setup:ctx.setup.setup,rivalryId:ctx.setup.rivalryId};contextKey=request.key;draft=null;try{await pssrRefreshNow(request);}catch(_error){pssrRefresh().catch(()=>{});}return true;
        }
      });
    }catch(error){if(pssrContextMatches(request)){pssrSetError(error.message||error.code||"Shared Season Result publication failed.");pssrReport("Unable to publish Shared Season Result",error);}return false;}
    finally{busy=false;if(pssrContextMatches(request))pssrRender();}
  }
  async function pssrOpen(){
    const navAtTap=typeof root.getNavigationRevision==="function"?root.getNavigationRevision():null;
    if(!pssrSharedMarker())return false;await pssrEnsureDependencies();const request=pssrRequestContext();if(!request)return false;const result=await pssrRefresh();if(!result||!pssrContextMatches(request)||contextKey!==request.key)return false;if(typeof root.navigateTo!=="function")pssrFail("SEASON_RESULTS_NAVIGATION_UNAVAILABLE");if(navAtTap!==null&&root.getNavigationRevision()!==navAtTap)return false;const shown=await root.navigateTo("seasonEntry");if(shown===false||!pssrContextMatches(request))return false;pssrRender();return true;
  }
  function pssrCapture(event){const target=event.target&&event.target.closest&&event.target.closest("button");if(!target||!CONTROL_IDS.includes(target.id)||!pssrSharedMarker())return;const active=pssrField("seasonEntry");if(!active||active.classList.contains("hidden"))return;event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();if(target.id==="completeSeason")pssrBeginReview();else if(target.id==="editSeasonResults")pssrEdit();else void pssrPublish();}
  function pssrWaitingKey(){const active=["seasonEntry","mainMenu","standings"].some(id=>{const node=pssrField(id);return node&&!node.classList.contains("hidden");});if(!view||contextKey!==pssrRequestContext()?.key||!view.ownResult||view.state?.phase==="RESULTS_READY"||!active)return "";return `${contextKey}|publish`;}
  function pssrFastPollDue(){const key=pssrWaitingKey();if(!key){fastWaitKey="";fastWaitSince=0;return false;}const now=Date.now();if(key!==fastWaitKey){fastWaitKey=key;fastWaitSince=now;}return now-fastWaitSince<FAST_POLL_WINDOW_MS;}
  // r75: while this screen waits on the partner, one live listener watches the shared document the partner's move changes;
  // timer checks stop while that listener is healthy; deliveries still wake the provider immediately.
  function pssrWatchWait(){const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchWaitPoint!=="function")return;let path=null;try{path=root.document?.visibilityState==="hidden"?null:(pssrWaitingKey()||pssrLiveScreen()?(request=>request&&request.rivalryId&&Number.isInteger(request.seasonNumber)?`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`:null)(pssrRequestContext()):null);}catch(_error){path=null;}let relaxed=false;try{relaxed=Boolean(path&&!pssrWaitingKey()&&pssrLiveScreen());}catch(_error){relaxed=false;}return budget.watchWaitPoint("season-results",path,pssrWaitWake,{relaxed});}
  function pssrWaitWake(){if(!busy){void pssrTick(true);return;}if(typeof root.setTimeout==="function")root.setTimeout(()=>{if(!busy)void pssrTick(true);},400);}
  function pssrWaitHealthy(){const request=pssrRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();return Boolean(request&&live?.watchHealthy&&live.watching===`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`);}
  function pssrFastTick(){pssrWatchWait();if(pssrWaitHealthy()||root.document?.visibilityState==="hidden"||busy||!pssrFastPollDue())return;void pssrTick(true);}
  // r75: the 15 s check of the visible Season Results screen reads the shared results from the server (see Transfer).
  // r84: the listener also watches while Season Results is open and not yet RESULTS_READY (not only after this manager publishes):
  // 15 s fresh reads here were ~32 billed reads/min for both phones over a 30-90 minute results wait.
  function pssrLiveScreen(){const active=pssrField("seasonEntry");return Boolean(view&&contextKey===pssrRequestContext()?.key&&view.state?.phase!=="RESULTS_READY"&&active&&!active.classList.contains("hidden"));}
  function pssrScreenFresh(request){if(request&&request.rivalryId&&Number.isInteger(request.seasonNumber)){const path=`rivalries/${request.rivalryId}/seasonResults/season_${request.seasonNumber}`;if(!root.CareerModeFirestoreBudget?.watchesHealthy?.(path))root.CareerModeFirestoreBudget?.wantFresh?.(path);}}
  async function pssrTick(light=false){if(!pssrSharedMarker()||root.document?.visibilityState==="hidden"||busy)return;const request=pssrRequestContext();if(!request)return;if(contextKey&&contextKey!==request.key){view=null;draft=null;contextKey="";renderedContextKey="";}if(view?.state?.phase==="RESULTS_READY"&&view.allResults?.playerOne&&view.allResults?.playerTwo)return;const active=pssrField("seasonEntry");if(view||active&&!active.classList.contains("hidden")){if(light!==true&&active&&!active.classList.contains("hidden"))pssrScreenFresh(request);try{await pssrRefresh(light===true);}catch(_error){}}}
  function pssrInstall(){if(installed)return true;installed=true;if(root.document){root.document.addEventListener("click",pssrCapture,true);root.document.addEventListener("input",pssrDraftChange,true);root.document.addEventListener("change",pssrDraftChange,true);}root.addEventListener?.("career-mode-shared-season-cursor-change",()=>void pssrTick());if(typeof root.setInterval==="function"){pollTimer=root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())void pssrTick();},POLL_MS);root.setInterval(pssrFastTick,FAST_POLL_MS);}return true;}

  return Object.freeze({contractVersion:1,feature:"ssjr-production-shared-season-results",productionEnabled:true,requiresCompletedSharedTransfer:true,privateUntilBothPublished:true,reusesSeasonEntry:true,interceptsLocalSeasonPersistence:true,authoritativeScoring:false,canonicalStorageMutation:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,pollIntervalMs:POLL_MS,fastPollIntervalMs:FAST_POLL_MS,fastPollWindowMs:FAST_POLL_WINDOW_MS,isWaitingForRival:()=>Boolean(pssrWaitingKey()),install:pssrInstall,open:pssrOpen,refresh:pssrRefresh,getState:()=>view,isActive:pssrSharedMarker,canRoute:pssrCanRoute});
});

```


## FILE: js/sparkSharedSeasonResults.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedSeasonResults=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const resultsModule=typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults;
  const setupModule=typeof require==="function"?require("./sharedShowdownSetup.js"):root.CareerModeSharedShowdownSetup;
  const catalogModule=typeof require==="function"?require("./sharedShowdownCatalog.js"):root.CareerModeSharedShowdownCatalog;
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  // r80 Europa League: optional 8th key, present only as exactly true for a manager who won it, never with championsLeague true
  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old hashes never change.
  const OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const PUBLIC_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","teamCount","publishedRoles","operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const PROJECTION_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","teamCount","createdAt"]);
  const PRIVATE_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","managerRole","result","operationId","commandHash","activeSessionId","publishedAt","updatedByDeviceId"]);
  const SETUP_LEDGER_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole","operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons","confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const TRANSFER_PUBLIC_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","coordinatorRole","phase","revision","startedAt","endedAt","endRequestedRoles","guessLockedRoles","signingLockedRoles","operationIds","operationTypes","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const TRANSFER_TYPES=Object.freeze(["start-window","request-end-window","advance-expired-window","lock-guesses","lock-signings"]);

  function ssrpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ssrpResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SEASON_RESULTS_PROVIDER_FAILED"});}
  function ssrpSnapshot(value){return value&&typeof value.exists==="function"&&value.exists()?value.data():null;}
  function ssrpPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function ssrpExact(value,keys,code="SEASON_RESULTS_PROVIDER_STATE_INVALID"){if(!ssrpPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))ssrpFail(code);return value;}
  function ssrpEuropaLeague(value,code){if(!ssrpPlain(value))ssrpFail(code);const won=Object.hasOwn(value,"europaLeague");ssrpExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))ssrpFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))ssrpFail(code);return won;}
  function ssrpClone(value){return JSON.parse(JSON.stringify(value));}
  function ssrpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ssrpFreeze);Object.freeze(value);}return value;}
  function ssrpCanonical(value){if(Array.isArray(value))return `[${value.map(ssrpCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${ssrpCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function ssrpHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")ssrpFail("SEASON_RESULTS_CRYPTO_UNAVAILABLE");const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(ssrpCanonical(value)));return `sha256:${Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function ssrpNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))ssrpFail("SEASON_RESULTS_RIVALRY_INVALID");return id;}
  function ssrpNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))ssrpFail("SEASON_RESULTS_SESSION_INVALID");return id;}
  function ssrpNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))ssrpFail("SEASON_RESULTS_DEVICE_INACTIVE");return id;}
  function ssrpNormalizeOperationId(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))ssrpFail("SEASON_RESULTS_COMMAND_INVALID");return id;}
  function ssrpAccountId(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)ssrpFail("SEASON_RESULTS_AUTH_REQUIRED");return id;}
  function ssrpEpoch(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)ssrpFail("SEASON_RESULTS_CLOCK_INVALID");return n;}
  function ssrpTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function ssrpServerTimestamp(sdk){if(typeof sdk.serverTimestamp!=="function")ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");return sdk.serverTimestamp();}
  function ssrpValidateSdk(options){if(!options.firestore)ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");}}
  function ssrpRoleList(value,code="SEASON_RESULTS_PROVIDER_STATE_INVALID"){if(!Array.isArray(value)||value.length>2||new Set(value).size!==value.length||value.some(role=>!ROLES.includes(role)))ssrpFail(code);return value;}
  // A stored stat that is absent (null, "", blank, boolean, array) is not a hash-valid 0.
  function ssrpNumber(value){return typeof value==="number"||(typeof value==="string"&&value.trim()!=="")?Number(value):Number.NaN;}
  function ssrpResultShape(value,teamCount){
    const europaLeague=ssrpEuropaLeague(value,"SEASON_RESULTS_PRIVATE_STATE_INVALID");
    const position=ssrpNumber(value.leaguePosition),points=ssrpNumber(value.leaguePoints),goals=ssrpNumber(value.leagueGoals),maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");}
    return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};
  }

  function ssrpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||!value.data||value.data.status!=="active")ssrpFail("SEASON_RESULTS_MANAGER_INACTIVE");}
  function ssrpAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||!value.data||value.data.deviceId!==deviceId||value.data.state!=="active")ssrpFail("SEASON_RESULTS_DEVICE_INACTIVE");}
  function ssrpAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||!value.data||value.data.connectionState!=="active")ssrpFail("SEASON_RESULTS_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)ssrpFail("SEASON_RESULTS_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(item=>item&&item.slotId===role));
    if(ordered.some(item=>!item||item.entitlementState!=="active"||typeof item.accountId!=="string"||!/^profile_[0-9a-f]{24}$/.test(item.profileId||"")||!/^save_[0-9a-f]{24}$/.test(item.saveId||"")))ssrpFail("SEASON_RESULTS_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||!ordered.every(item=>authorized.includes(item.accountId))||!authorized.every(id=>ordered.some(item=>item.accountId===id)))ssrpFail("SEASON_RESULTS_TWO_MANAGERS_REQUIRED");
    const actor=ordered.find(item=>item.accountId===uid);if(!actor)ssrpFail("SEASON_RESULTS_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actor});
  }
  function ssrpAssertSession(value,rivalryId,sessionId,authorized,now){
    if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||!value.data)ssrpFail("SEASON_RESULTS_SESSION_INVALID");
    const members=Array.isArray(value.data.memberAccountIds)?value.data.memberAccountIds:[],expires=ssrpTimestampMillis(value.data.expiresAt);
    if(value.data.rivalryId!==rivalryId||value.data.state!=="active"||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!Number.isFinite(expires))ssrpFail("SEASON_RESULTS_ACTIVE_SESSION_REQUIRED");
  }
  function ssrpAssertSetupLedger(value,rivalryId){
    ssrpExact(value,SETUP_LEDGER_KEYS,"SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    if(value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==6)ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");}
    const expectedTypes=["open","commit-league","commit-clubs","commit-length","confirm","confirm"];
    if(new Set(value.operationIds).size!==6||value.operationIds.some(id=>!/^setup_op_[0-9a-f]{32}$/.test(id))||value.operationTypes.some((type,index)=>type!==expectedTypes[index])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    if(value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||JSON.stringify(value.confirmedRoles)!==JSON.stringify(value.actorRoles.slice(4))||new Set(value.confirmedRoles).size!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    return value;
  }
  function ssrpAssertCareer(value,rivalryId,setup){
    if(!value||value.schemaVersion!==1||value.objectType!=="sharedCareerStart"||value.rivalryId!==rivalryId||value.setupRevision!==6||value.totalSeasons!==setup.totalSeasons||value.revision!==2||value.phase!=="CAREER_START_READY")ssrpFail("SEASON_RESULTS_CAREER_START_NOT_READY");
    if(!Array.isArray(value.setupOperationIds)||JSON.stringify(value.setupOperationIds)!==JSON.stringify(setup.operationIds)||!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==2||!ROLES.every(role=>value.acknowledgedRoles.includes(role)))ssrpFail("SEASON_RESULTS_CAREER_START_NOT_READY");return value;
  }
  function ssrpAssertTransfer(value,rivalryId,seasonNumber,setup){
    ssrpExact(value,TRANSFER_PUBLIC_KEYS,"SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    if(value.schemaVersion!==1||value.objectType!=="sharedTransferChallenge"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r8"||value.coordinatorRole!==setup.coordinatorRole||value.phase!=="COMPLETED"||!Number.isInteger(value.revision)||value.revision<6||value.revision>7)ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    if(!Array.isArray(value.guessLockedRoles)||value.guessLockedRoles.length!==2||!ROLES.every(role=>value.guessLockedRoles.includes(role))||!Array.isArray(value.signingLockedRoles)||value.signingLockedRoles.length!==2||!ROLES.every(role=>value.signingLockedRoles.includes(role)))ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    for(const key of ["operationIds","operationTypes","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");}
    if(new Set(value.operationIds).size!==value.revision||value.operationIds.some(id=>!/^transfer_op_[0-9a-f]{32}$/.test(id))||value.operationTypes.some(type=>!TRANSFER_TYPES.includes(type))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");
    if(value.endedAt===null||!Number.isFinite(ssrpTimestampMillis(value.startedAt))||!Number.isFinite(ssrpTimestampMillis(value.endedAt)))ssrpFail("SEASON_RESULTS_TRANSFER_NOT_COMPLETE");return value;
  }

  function ssrpAuthority({rivalryId,rivalry,role,sessionId,deviceId,now,hostRole}){
    const slot=rivalry.slots.find(item=>item.slotId===role),host=rivalry.slots.find(item=>item.slotId===hostRole);if(!slot||!host)ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");
    return {rivalryId,connectionState:"active",managerSlots:rivalry.slots.map(item=>({slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"})),actor:{accountId:slot.accountId,deviceId,deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},session:{sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Math.max(now+1,Number.MAX_SAFE_INTEGER-1)},nowEpochMs:now};
  }
  async function ssrpRebuildSetup(ledger,rivalry,rivalryId,sessionId,deviceId,now,cryptoImpl){
    if(!setupModule||typeof setupModule.createProtocol!=="function"||!catalogModule||catalogModule.version!=="shared-showdown-catalog-v1"||!catalogModule.catalog)ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");
    const setupProtocol=await setupModule.createProtocol({catalog:catalogModule.catalog,cryptoImpl});let state=null;
    for(let index=0;index<ledger.revision;index++){
      const type=ledger.operationTypes[index],role=ledger.actorRoles[index],authority=ssrpAuthority({rivalryId,rivalry,role,sessionId,deviceId,now,hostRole:ledger.coordinatorRole});let command;
      if(type==="commit-league"||type==="commit-clubs")command=await setupProtocol.prepareDraw({state,type,operationId:ledger.operationIds[index]});
      else if(type==="commit-length")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],totalSeasons:ledger.totalSeasons};
      else if(type==="confirm")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],setupHash:await setupProtocol.confirmationHash(state)};
      else command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index]};
      const applied=await setupProtocol.apply({state,authority,command});if(!applied.ok)ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");state=applied.state;
    }
    if(!state||state.phase!=="SHOWDOWN_CONFIRMED"||state.revision!==6||!catalogModule.catalog[state.leagueId])ssrpFail("SEASON_RESULTS_SETUP_NOT_CONFIRMED");return state;
  }

  function ssrpPublicState(value,rivalryId,seasonNumber,teamCount){
    if(!value)return null;ssrpExact(value,PUBLIC_KEYS);
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!==resultsModule.runtimeRevision||value.teamCount!==teamCount||![18,20].includes(value.teamCount)||!["COLLECTING","RESULTS_READY"].includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>2)ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    ssrpRoleList(value.publishedRoles);for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");}
    if(value.publishedRoles.length!==value.revision||new Set(value.operationIds).size!==value.operationIds.length||value.operationIds.some(id=>!OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some((role,index)=>!ROLES.includes(role)||role!==value.publishedRoles[index]))ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    if((value.phase==="COLLECTING"&&value.revision!==1)||(value.phase==="RESULTS_READY"&&value.revision!==2)||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||""))ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");
    return ssrpFreeze({phase:value.phase,revision:value.revision,publishedRoles:[...value.publishedRoles],operationIds:[...value.operationIds],operationHashes:[...value.operationHashes],baseRevisions:[...value.baseRevisions],actorRoles:[...value.actorRoles]});
  }
  function ssrpLeagueProjection(value,rivalryId,teamCount){if(!value)return null;ssrpExact(value,PROJECTION_KEYS,"SEASON_RESULTS_LEAGUE_PROJECTION_INVALID");if(value.schemaVersion!==1||value.objectType!=="sharedLeagueProjection"||value.rivalryId!==rivalryId||value.teamCount!==teamCount||![18,20].includes(value.teamCount)||!Number.isFinite(ssrpTimestampMillis(value.createdAt)))ssrpFail("SEASON_RESULTS_LEAGUE_PROJECTION_INVALID");return value;}
  function ssrpPrivateState(value,rivalryId,seasonNumber,role,teamCount){
    if(!value)return null;ssrpExact(value,PRIVATE_KEYS,"SEASON_RESULTS_PRIVATE_STATE_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||!OPERATION.test(value.operationId)||!HASH.test(value.commandHash)||!/^session_[0-9a-f]{64}$/.test(value.activeSessionId||"")||!/^device_[0-9a-f]{32}$/.test(value.updatedByDeviceId||"")||!Number.isFinite(ssrpTimestampMillis(value.publishedAt)))ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
    return ssrpFreeze({result:ssrpResultShape(value.result,teamCount),operationId:value.operationId,commandHash:value.commandHash});
  }
  async function ssrpVerifyPublicHashes(state,cryptoImpl){
    if(!state)return;for(let index=0;index<state.revision;index++){const expected=await ssrpHash({actorRole:state.actorRoles[index],type:"publish-result",operationId:state.operationIds[index],baseRevision:state.baseRevisions[index]},cryptoImpl);if(expected!==state.operationHashes[index])ssrpFail("SEASON_RESULTS_PROVIDER_STATE_INVALID");}
  }
  async function ssrpVerifyPrivateCommand(privateState,state,role,cryptoImpl){
    if(!privateState)return;if(!state)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");const index=state.operationIds.indexOf(privateState.operationId);if(index<0||state.actorRoles[index]!==role)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
    const expected=await ssrpHash({actorRole:role,type:"publish-result",operationId:privateState.operationId,baseRevision:state.baseRevisions[index],result:privateState.result},cryptoImpl);if(expected!==privateState.commandHash)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
  }
  async function ssrpNormalizeResult(value,teamCount,setupState,career,transfer,seasonNumber,role,operationId,cryptoImpl){
    if(!resultsModule||typeof resultsModule.createProtocol!=="function")ssrpFail("SEASON_RESULTS_PROVIDER_UNAVAILABLE");const resultProtocol=await resultsModule.createProtocol({teamCount,cryptoImpl});
    const applied=await resultProtocol.apply({state:null,setup:setupState,careerStart:career,transferChallenge:transfer,seasonNumber,actorRole:role,command:{type:"publish-result",operationId,baseRevision:0,result:value}});if(!applied.ok||!applied.state?.results?.[role])ssrpFail("SEASON_RESULTS_PAYLOAD_INVALID");return ssrpClone(applied.state.results[role]);
  }

  async function ssrpContext(options,transaction,{readOpponent=false}={}){
    ssrpValidateSdk(options);const uid=ssrpAccountId(options.user),rivalryId=ssrpNormalizeRivalryId(options.rivalryId),sessionId=ssrpNormalizeSessionId(options.sessionId),deviceId=ssrpNormalizeDeviceId(options.deviceId),now=ssrpEpoch(options.nowEpochMs),sdk=options.firebaseSdk,db=options.firestore,cryptoImpl=options.cryptoImpl||root.crypto;
    const refs={account:sdk.doc(db,"accounts",uid),device:sdk.doc(db,"accounts",uid,"devices",deviceId),rivalry:sdk.doc(db,"rivalries",rivalryId),session:sdk.doc(db,"rivalries",rivalryId,"sessions",sessionId),setup:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","authoritative"),projection:sdk.doc(db,"rivalries",rivalryId,"sharedSetup","leagueProjection"),career:sdk.doc(db,"rivalries",rivalryId,"careerStart","authoritative")};
    ssrpAssertAccount(ssrpSnapshot(await transaction.get(refs.account)),uid);ssrpAssertDevice(ssrpSnapshot(await transaction.get(refs.device)),deviceId);const rivalry=ssrpAssertRivalry(ssrpSnapshot(await transaction.get(refs.rivalry)),rivalryId,uid);ssrpAssertSession(ssrpSnapshot(await transaction.get(refs.session)),rivalryId,sessionId,rivalry.authorized,now);
    const ledger=ssrpAssertSetupLedger(ssrpSnapshot(await transaction.get(refs.setup)),rivalryId),setupState=await ssrpRebuildSetup(ledger,rivalry,rivalryId,sessionId,deviceId,now,cryptoImpl),career=ssrpAssertCareer(ssrpSnapshot(await transaction.get(refs.career)),rivalryId,ledger);
    const seasonNumber=Number(options.seasonNumber);if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>setupState.totalSeasons)ssrpFail("SEASON_RESULTS_SEASON_INVALID");const teamCount=catalogModule.catalog[setupState.leagueId].length,role=rivalry.actor.slotId,opponentRole=role==="playerOne"?"playerTwo":"playerOne",seasonId=`season_${seasonNumber}`;
    const projection=ssrpLeagueProjection(ssrpSnapshot(await transaction.get(refs.projection)),rivalryId,teamCount);
    refs.transfer=sdk.doc(db,"rivalries",rivalryId,"transferChallenges",seasonId);refs.public=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId);refs.own=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId,"roles",role);refs.opponent=sdk.doc(db,"rivalries",rivalryId,"seasonResults",seasonId,"roles",opponentRole);
    const transfer=ssrpAssertTransfer(ssrpSnapshot(await transaction.get(refs.transfer)),rivalryId,seasonNumber,ledger),state=ssrpPublicState(ssrpSnapshot(await transaction.get(refs.public)),rivalryId,seasonNumber,teamCount);await ssrpVerifyPublicHashes(state,cryptoImpl);
    const own=ssrpPrivateState(ssrpSnapshot(await transaction.get(refs.own)),rivalryId,seasonNumber,role,teamCount),published=state?state.publishedRoles.includes(role):false;if(published!==Boolean(own))ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");await ssrpVerifyPrivateCommand(own,state,role,cryptoImpl);
    let opponent=null;if(readOpponent){if(!state||state.phase!=="RESULTS_READY")ssrpFail("SEASON_RESULTS_PRIVATE_READ_BLOCKED");opponent=ssrpPrivateState(ssrpSnapshot(await transaction.get(refs.opponent)),rivalryId,seasonNumber,opponentRole,teamCount);if(!opponent||!state.publishedRoles.includes(opponentRole))ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");await ssrpVerifyPrivateCommand(opponent,state,opponentRole,cryptoImpl);}
    return Object.freeze({uid,rivalryId,sessionId,deviceId,now,sdk,db,cryptoImpl,rivalry,ledger,setupState,career,transfer,seasonNumber,teamCount,projection,role,opponentRole,state,own,opponent,refs});
  }

  function ssrpProjection(ctx){const state=ctx.state;if(!state)return Object.freeze({ok:true,revision:0,state:null,managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:null,opponentResult:null,allResults:null});const ownResult=ctx.own?ssrpClone(ctx.own.result):null,ready=state.phase==="RESULTS_READY",opponentResult=ready&&ctx.opponent?ssrpClone(ctx.opponent.result):null;let allResults=null;if(ready&&opponentResult){allResults={};allResults[ctx.role]=ownResult;allResults[ctx.opponentRole]=opponentResult;}return ssrpFreeze({ok:true,revision:state.revision,state:ssrpClone(state),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult,opponentResult,allResults});}
  async function ssrpRead(options={}){try{ssrpValidateSdk(options);return await options.firebaseSdk.runTransaction(options.firestore,async transaction=>{const base=await ssrpContext(options,transaction);if(base.state&&base.state.phase==="RESULTS_READY")return ssrpProjection(await ssrpContext(options,transaction,{readOpponent:true}));return ssrpProjection(base);});}catch(error){return ssrpResultError(error);}}
  async function ssrpEnsureLeagueProjection(options){
    return options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
      const ctx=await ssrpContext(options,transaction);
      if(ctx.projection)return ctx.teamCount;
      transaction.set(ctx.refs.projection,{schemaVersion:1,objectType:"sharedLeagueProjection",rivalryId:ctx.rivalryId,teamCount:ctx.teamCount,createdAt:ssrpServerTimestamp(ctx.sdk)});
      return ctx.teamCount;
    });
  }
  async function ssrpPublishResult(options={}){
    try{ssrpValidateSdk(options);const operationId=ssrpNormalizeOperationId(options.operationId),baseRevision=Number(options.baseRevision);if(!Number.isInteger(baseRevision)||baseRevision<0||baseRevision>2)ssrpFail("SEASON_RESULTS_COMMAND_INVALID");
      const runPublishTransaction=()=>options.firebaseSdk.runTransaction(options.firestore,async transaction=>{
        const ctx=await ssrpContext(options,transaction),current=ctx.state,revision=current?current.revision:0,normalizedResult=await ssrpNormalizeResult(options.result,ctx.teamCount,ctx.setupState,ctx.career,ctx.transfer,ctx.seasonNumber,ctx.role,operationId,ctx.cryptoImpl),operationHash=await ssrpHash({actorRole:ctx.role,type:"publish-result",operationId,baseRevision},ctx.cryptoImpl),commandHash=await ssrpHash({actorRole:ctx.role,type:"publish-result",operationId,baseRevision,result:normalizedResult},ctx.cryptoImpl);
        if(current){const index=current.operationIds.indexOf(operationId);if(index>=0){if(current.operationHashes[index]!==operationHash||current.baseRevisions[index]!==baseRevision||current.actorRoles[index]!==ctx.role||!ctx.own||ctx.own.operationId!==operationId||ctx.own.commandHash!==commandHash)ssrpFail("SEASON_RESULTS_IDEMPOTENCY_CONFLICT");const projected=current.phase==="RESULTS_READY"?ssrpProjection(await ssrpContext(options,transaction,{readOpponent:true})):ssrpProjection(ctx);return ssrpFreeze({...projected,status:"accepted",replayed:true,needsRefresh:current.phase==="RESULTS_READY"});}}
        if(baseRevision!==revision)ssrpFail("SEASON_RESULTS_STALE_BASE_REVISION");if(current&&current.phase==="RESULTS_READY")ssrpFail("SEASON_RESULTS_ALREADY_READY");if(current&&current.publishedRoles.includes(ctx.role))ssrpFail("SEASON_RESULTS_ROLE_ALREADY_PUBLISHED");if(ctx.own)ssrpFail("SEASON_RESULTS_PRIVATE_STATE_INVALID");
        const next=current?ssrpClone(current):{phase:"COLLECTING",revision:0,publishedRoles:[],operationIds:[],operationHashes:[],baseRevisions:[],actorRoles:[]};next.publishedRoles.push(ctx.role);next.operationIds.push(operationId);next.operationHashes.push(operationHash);next.baseRevisions.push(revision);next.actorRoles.push(ctx.role);next.revision=revision+1;if(next.revision===2)next.phase="RESULTS_READY";
        const serverNow=ssrpServerTimestamp(ctx.sdk);transaction.set(ctx.refs.public,{schemaVersion:1,objectType:"sharedSeasonResults",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,runtimeRevision:resultsModule.runtimeRevision,phase:next.phase,revision:next.revision,teamCount:ctx.teamCount,publishedRoles:[...next.publishedRoles],operationIds:[...next.operationIds],operationHashes:[...next.operationHashes],baseRevisions:[...next.baseRevisions],actorRoles:[...next.actorRoles],activeSessionId:ctx.sessionId,updatedAt:serverNow,updatedByDeviceId:ctx.deviceId});transaction.set(ctx.refs.own,{schemaVersion:1,objectType:"sharedSeasonResultRole",rivalryId:ctx.rivalryId,seasonNumber:ctx.seasonNumber,managerRole:ctx.role,result:normalizedResult,operationId,commandHash,activeSessionId:ctx.sessionId,publishedAt:serverNow,updatedByDeviceId:ctx.deviceId});
        return ssrpFreeze({ok:true,status:"accepted",replayed:false,revision:next.revision,state:ssrpClone(next),managerRole:ctx.role,seasonNumber:ctx.seasonNumber,ownResult:ssrpClone(normalizedResult),opponentResult:null,allResults:null,needsRefresh:next.phase==="RESULTS_READY"});
      });
      // The league-projection preflight runs its own transaction, so a same-moment denial there gets the same recovery.
      const ssrpDenied=failure=>{const code=failure&&typeof failure.code==="string"?failure.code:"";return code==="permission-denied"||code==="firestore/permission-denied"||code==="permission_denied";};
      let projectionReady=false;
      const publishOnce=async()=>{if(!projectionReady){await ssrpEnsureLeagueProjection(options);projectionReady=true;}return await runPublishTransaction();};
      try{return await publishOnce();}
      catch(firstError){
        let error=firstError;
        if(!ssrpDenied(error))throw error;
        // A denied preflight can be a lost race to create the immutable league projection. The projection now exists,
        // so retry the idempotent preflight and the publish once instead of depending on the rival's publish landing.
        if(!projectionReady){try{return await publishOnce();}catch(retryError){if(!ssrpDenied(retryError))throw retryError;error=retryError;}}
        const sdk=options.firebaseSdk;
        const rivalryId=ssrpNormalizeRivalryId(options.rivalryId),seasonNumber=Number(options.seasonNumber);if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>10)throw error;
        // Race fix: the production SDK bundle (productionFirebaseRuntime firestoreSdk) and the emulator
        // journey expose only doc/runTransaction/serverTimestamp, so a getDoc-only re-read never ran and the
        // loser of two simultaneous taps saw the raw permission-denied. The fresh read of the public document
        // now goes through a read-only transaction when getDoc is absent (same Rules, same document).
        const readPublic=async()=>{const ref=sdk.doc(options.firestore,"rivalries",rivalryId,"seasonResults",`season_${seasonNumber}`);return typeof sdk.getDoc==="function"?await sdk.getDoc(ref):await sdk.runTransaction(options.firestore,transaction=>transaction.get(ref));};
        // Job 31: the rival's winning write can land a moment after this denial is reported, so a readable
        // public document that does not show it yet is re-read twice more (250 ms, then 500 ms) before the
        // denial is surfaced. An unreadable document (stranger) is still answered after exactly one read.
        for(let attempt=0;attempt<3;attempt+=1){
          if(attempt>0)await new Promise(resolve=>setTimeout(resolve,250*attempt));
          let fresh;
          try{fresh=ssrpSnapshot(await readPublic());}
          catch(readError){
            // A denied re-read (stranger) answers at once; a contended or transient re-read is retried like a stale one.
            if(ssrpDenied(readError))throw error;
            continue;
          }
          if(fresh&&Array.isArray(fresh.operationIds)&&fresh.operationIds.includes(operationId))return await runPublishTransaction();
          if(fresh&&Number.isInteger(fresh.revision)&&fresh.revision>baseRevision)ssrpFail("SEASON_RESULTS_STALE_BASE_REVISION");
        }
        throw error;
      }
    }catch(error){return ssrpResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-season-results",runtimeRevision:resultsModule&&resultsModule.runtimeRevision||null,read:ssrpRead,publishResult:ssrpPublishResult,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,privateInputsSplit:true,privateCommandHash:true,publicResultHash:false,serverClockAuthoritative:true,repositorySetupCatalog:true,callerTeamCountOverride:false});
});
```


## FILE: js/sharedSeasonCommit.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r10";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PHASES=Object.freeze(["COMMITTED","ACKNOWLEDGED"]);
  const OPERATION=/^season_commit_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  // r80 Europa League: optional 8th key, present only as exactly true for a manager who won it, never with championsLeague true
  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old hashes never change.
  const STATE_KEYS=Object.freeze(["schemaVersion","runtimeRevision","seasonNumber","phase","revision","resultsRevision","resultsContentHash","results","acknowledgedRoles","receipts","contentHash"]);

  function sscFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function sscPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  function sscExact(value,keys,code="SEASON_COMMIT_VALUE_INVALID"){if(!sscPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))sscFail(code);return value;}
  function sscEuropaLeague(value,code){if(!sscPlain(value))sscFail(code);const won=Object.hasOwn(value,"europaLeague");sscExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))sscFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))sscFail(code);return won;}
  function sscClone(value){return JSON.parse(JSON.stringify(value));}
  function sscFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(sscFreeze);Object.freeze(value);}return value;}
  function sscCanonical(value){if(Array.isArray(value))return `[${value.map(sscCanonical).join(",")}]`;if(sscPlain(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${sscCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function sscHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")sscFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(sscCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function sscRole(value){if(!ROLES.includes(value))sscFail("SEASON_COMMIT_ROLE_INVALID");return value;}
  function sscTeamCount(value){if(!Number.isInteger(value)||value<2||value>20)sscFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return value;}
  function sscSetup(value){if(!sscPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");if(!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))sscFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return value;}
  function sscResult(value,teamCount){const europaLeague=sscEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const position=Number(value.leaguePosition),points=Number(value.leaguePoints),goals=Number(value.leagueGoals),maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(position)||position<1||position>teamCount||!Number.isInteger(points)||points<0||points>maxPoints||!Number.isInteger(goals)||goals<0||goals>300)sscFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")sscFail("SEASON_COMMIT_RESULTS_INVALID");}return {leaguePosition:position,leaguePoints:points,leagueGoals:goals,domesticCup:value.domesticCup,championsLeague:value.championsLeague,topScorer:value.topScorer,topAssist:value.topAssist,...(europaLeague?{europaLeague:true}:{}),...(Object.hasOwn(value,"primePack")?{primePack:value.primePack}:{})};}
  function sscReceipt(value){sscExact(value,["operationId","baseRevision","actorRole","type","commandHash"],"SEASON_COMMIT_STATE_INVALID");if(!OPERATION.test(value.operationId)||!Number.isInteger(value.baseRevision)||value.baseRevision<0||!ROLES.includes(value.actorRole)||!["commit-season","acknowledge-season"].includes(value.type)||!HASH.test(value.commandHash))sscFail("SEASON_COMMIT_STATE_INVALID");return value;}
  function sscCommand(value){if(!sscPlain(value))sscFail("SEASON_COMMIT_COMMAND_INVALID");sscExact(value,["type","operationId","baseRevision"],"SEASON_COMMIT_COMMAND_INVALID");if(!["commit-season","acknowledge-season"].includes(value.type)||!OPERATION.test(String(value.operationId||""))||!Number.isInteger(value.baseRevision)||value.baseRevision<0||value.baseRevision>3)sscFail("SEASON_COMMIT_COMMAND_INVALID");return {type:value.type,operationId:value.operationId,baseRevision:value.baseRevision};}

  async function sscCreateProtocol({teamCount,cryptoImpl=root.crypto,seasonResultsModule=(typeof require==="function"?require("./sharedSeasonResults.js"):root.CareerModeSharedSeasonResults)}={}){
    const teams=sscTeamCount(teamCount);
    if(!seasonResultsModule||typeof seasonResultsModule.createProtocol!=="function")sscFail("SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE");
    const resultsProtocol=await seasonResultsModule.createProtocol({teamCount:teams,cryptoImpl});
    async function seal(core){return sscFreeze({...sscClone(core),contentHash:await sscHash(core,cryptoImpl)});}
    async function readyResults(value,seasonNumber,totalSeasons){
      if(!Number.isInteger(seasonNumber)||seasonNumber<1||seasonNumber>totalSeasons)sscFail("SEASON_COMMIT_SEASON_INVALID");
      let ready;try{ready=await resultsProtocol.verifyState(value);}catch(_error){sscFail("SEASON_COMMIT_RESULTS_NOT_READY");}
      if(ready.phase!=="RESULTS_READY"||ready.revision!==2||ready.seasonNumber!==seasonNumber||!ready.results||!ready.results.playerOne||!ready.results.playerTwo)sscFail("SEASON_COMMIT_RESULTS_NOT_READY");
      return ready;
    }
    async function sscVerifyState(value){
      sscExact(value,STATE_KEYS,"SEASON_COMMIT_STATE_INVALID");const core=sscClone(value),hash=core.contentHash;delete core.contentHash;
      if(value.schemaVersion!==1||value.runtimeRevision!==RUNTIME_REVISION||!Number.isInteger(value.seasonNumber)||value.seasonNumber<1||!PHASES.includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>3||value.resultsRevision!==2||!HASH.test(value.resultsContentHash)||!HASH.test(hash))sscFail("SEASON_COMMIT_STATE_INVALID");
      sscExact(value.results,ROLES,"SEASON_COMMIT_STATE_INVALID");for(const role of ROLES)sscResult(value.results[role],teams);
      if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==value.revision-1||value.acknowledgedRoles.length>2||new Set(value.acknowledgedRoles).size!==value.acknowledgedRoles.length||value.acknowledgedRoles.some(role=>!ROLES.includes(role)))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(!Array.isArray(value.receipts)||value.receipts.length!==value.revision)sscFail("SEASON_COMMIT_STATE_INVALID");value.receipts.forEach(sscReceipt);
      if(new Set(value.receipts.map(receipt=>receipt.operationId)).size!==value.receipts.length||value.receipts.some((receipt,index)=>receipt.baseRevision!==index))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(value.receipts[0].type!=="commit-season"||value.receipts.slice(1).some(receipt=>receipt.type!=="acknowledge-season"))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(JSON.stringify(value.acknowledgedRoles)!==JSON.stringify(value.receipts.slice(1).map(receipt=>receipt.actorRole)))sscFail("SEASON_COMMIT_STATE_INVALID");
      if((value.phase==="COMMITTED"&&value.revision===3)||(value.phase==="ACKNOWLEDGED"&&value.revision!==3))sscFail("SEASON_COMMIT_STATE_INVALID");
      if(await sscHash(core,cryptoImpl)!==hash)sscFail("SEASON_COMMIT_STATE_HASH_MISMATCH");
      return sscFreeze(sscClone(value));
    }
    async function sscApply({state=null,setup,seasonResults,seasonNumber,actorRole,command}){
      const confirmed=sscSetup(setup),role=sscRole(actorRole),ready=await readyResults(seasonResults,seasonNumber,confirmed.totalSeasons),cmd=sscCommand(command),current=state?await sscVerifyState(state):null;
      if(current&&current.seasonNumber!==seasonNumber)sscFail("SEASON_COMMIT_SEASON_MISMATCH");
      if(current&&(current.resultsContentHash!==ready.contentHash||current.resultsRevision!==ready.revision))sscFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
      const commandHash=await sscHash({actorRole:role,...cmd},cryptoImpl);
      if(current){const prior=current.receipts.find(receipt=>receipt.operationId===cmd.operationId);if(prior){if(prior.actorRole!==role||prior.baseRevision!==cmd.baseRevision||prior.type!==cmd.type||prior.commandHash!==commandHash)sscFail("SEASON_COMMIT_IDEMPOTENCY_CONFLICT");return sscFreeze({ok:true,idempotent:true,state:current});}}
      const revision=current?current.revision:0;if(cmd.baseRevision!==revision)sscFail("SEASON_COMMIT_STALE_BASE_REVISION");
      if(cmd.type==="commit-season"){
        if(current)sscFail("SEASON_COMMIT_ALREADY_COMMITTED");
        if(role!==confirmed.coordinatorRole)sscFail("SEASON_COMMIT_COORDINATOR_REQUIRED");
        const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber,phase:"COMMITTED",revision:1,resultsRevision:ready.revision,resultsContentHash:ready.contentHash,results:{playerOne:sscResult(ready.results.playerOne,teams),playerTwo:sscResult(ready.results.playerTwo,teams)},acknowledgedRoles:[],receipts:[{operationId:cmd.operationId,baseRevision:0,actorRole:role,type:cmd.type,commandHash}]};
        const next=await seal(core);await sscVerifyState(next);return sscFreeze({ok:true,idempotent:false,state:next});
      }
      if(!current)sscFail("SEASON_COMMIT_NOT_COMMITTED");
      if(current.phase==="ACKNOWLEDGED")sscFail("SEASON_COMMIT_ALREADY_ACKNOWLEDGED");
      if(current.acknowledgedRoles.includes(role))sscFail("SEASON_COMMIT_ROLE_ALREADY_ACKNOWLEDGED");
      const core=sscClone(current);delete core.contentHash;core.acknowledgedRoles.push(role);core.receipts.push({operationId:cmd.operationId,baseRevision:revision,actorRole:role,type:cmd.type,commandHash});core.revision=revision+1;if(core.acknowledgedRoles.length===2)core.phase="ACKNOWLEDGED";
      const next=await seal(core);await sscVerifyState(next);return sscFreeze({ok:true,idempotent:false,state:next});
    }
    function projectForRole(state,role){sscRole(role);return sscFreeze({schemaVersion:state.schemaVersion,runtimeRevision:state.runtimeRevision,seasonNumber:state.seasonNumber,phase:state.phase,revision:state.revision,resultsRevision:state.resultsRevision,resultsContentHash:state.resultsContentHash,results:sscClone(state.results),managerRole:role,ownAcknowledged:state.acknowledgedRoles.includes(role),acknowledgedRoles:[...state.acknowledgedRoles]});}
    return sscFreeze({contractVersion:1,feature:"ssjr-shared-season-commit",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,apply:sscApply,verifyState:sscVerifyState,projectForRole,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,requiresResultsReady:true,requiresBothAcknowledgements:true});
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-season-commit-protocol-factory",runtimeRevision:RUNTIME_REVISION,roles:ROLES,phases:PHASES,createProtocol:sscCreateProtocol,billingRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,requiresResultsReady:true,requiresBothAcknowledgements:true});
});
```


## FILE: js/productionSharedSeasonCommit.js
```
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
      psscText(ui.status,"SEASON CONFIRMED BY BOTH MANAGERS");psscText(ui.action,"SEASON CONFIRMED ✓");psscDisable(ui.action,true);return true;
    }
    if(view.committed){
      if(view.ownAcknowledged){psscText(ui.status,"YOU CONFIRMED THIS SEASON · WAITING FOR YOUR RIVAL");psscText(ui.action,"CONFIRMED ✓ · WAITING FOR RIVAL");psscDisable(ui.action,true);}
      else{psscText(ui.status,"SEASON RESULT LOCKED · BOTH MANAGERS CONFIRM TO SCORE IT");psscText(ui.action,"CONFIRM SEASON");psscDisable(ui.action,busy);}
      return true;
    }
    if(role===coordinator){psscText(ui.status,`BOTH RESULTS ARE IN · LOCK THE SEASON${psscClashWarning("You")}`);psscText(ui.action,"LOCK & CONFIRM SEASON");psscDisable(ui.action,busy);}
    else{psscText(ui.status,`BOTH RESULTS ARE IN · WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()} TO LOCK THE SEASON${psscClashWarning(psscManagerName(coordinator))}`);psscText(ui.action,`WAITING FOR ${String(psscManagerName(coordinator)).toUpperCase()}`);psscDisable(ui.action,true);}
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
  // Fable job 3 F3-02: only the waited season's commit and the next one are watched. An earlier season is ACKNOWLEDGED before
  // this one starts, and a commit after the next cannot exist before the next is ACKNOWLEDGED, which needs this phone. Before,
  // a 10-season Showdown attached one listener per season on each new wait (measured on season 1: 58 billed to 42).
  // The season is part of the key, so a wait on the next season attaches its own pair.
  let waitContext=null,waitReturn=null;const waitSettled=new Set(),WAIT_PENDING_GRACE_MS=10000;
  function psscDropWaitContext(keep=false){const held=waitContext,budget=root.CareerModeFirestoreBudget;waitContext=null;if(keep===true&&held&&!held.failed)waitReturn={key:held.key,watching:held.watching};else if(keep!==true||held){waitReturn=null;budget?.returnListen?.([]);}if(!held)return;for(const stop of held.stops.values())try{stop();}catch(_error){}held.stops.clear();budget?.listened?.();}
  function psscWaitReturn(){const back=waitReturn,request=psscRequestContext();waitReturn=null;if(back&&request&&psscWaitScreen()&&!root.CareerModeFirestoreBudget?.paused?.())psscWaitContext(request,back.watching,back.key);else root.CareerModeFirestoreBudget?.returnListen?.([]);}
  function psscContextWake(){try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-wait-context-change"));}catch(_error){}}
  function psscWaitContext(request,watching,returnKey){
    const setup=psscSetupState(),runtime=root.CareerModeProductionFirebaseRuntime,budget=root.CareerModeFirestoreBudget;
    const key=`${request.rivalryId}|${setup?.accountId}|${setup?.deviceId}|${setup?.sessionId}|season_${request.seasonNumber}`;
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
      if([1,3,5,10].includes(total))for(let n=request.seasonNumber;n<=Math.min(total,request.seasonNumber+1);n++)paths.push(`${base}/seasonCommits/season_${n}`);
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
  // Fable job 3 F3-12: this phone's own write of the watched document leaves the same wait listener attached but not live
  // (pending writes, dirty) until the server's copy arrives. For up to WAIT_PENDING_GRACE_MS the authority listeners are kept
  // (the wait still reports not healthy, so every fallback check runs as before); a lost or replaced wait listener drops them at once.
  function psscWaitHealthy(){const request=psscRequestContext(),live=root.CareerModeFirestoreBudget?.stats?.();const waited=Boolean(request&&["seasonResults","seasonCommits"].some(collection=>live?.watching===`rivalries/${request.rivalryId}/${collection}/season_${request.seasonNumber}`));const healthy=Boolean(request&&root.document?.visibilityState!=="hidden"&&!root.CareerModeFirestoreBudget?.paused?.()&&live?.watchHealthy&&waited);if(!healthy){const hidden=root.document?.visibilityState==="hidden",now=Date.now(),held=waitContext,usable=Boolean(request&&!hidden&&!root.CareerModeFirestoreBudget?.paused?.());if(held&&usable&&waited&&held.watching===live.watching&&!held.failed&&!held.pendingSince)held.pendingSince=now;if(!(usable&&held&&(held.returnUntil>now||waited&&held.watching===live.watching&&!held.failed&&now-held.pendingSince<WAIT_PENDING_GRACE_MS)))psscDropWaitContext(hidden);return false;}if(waitContext)waitContext.pendingSince=0;return ![root.CareerModeProductionSharedMultiSeasonProgression,root.CareerModeProductionSharedFinalReconciliation,root.CareerModeProductionSharedJourneyReconnect,root.CareerModeProductionSharedTerminalClose].some(api=>api?.productionEnabled===true)||psscWaitContext(request,live.watching);}

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


## FILE: js/sparkSharedSeasonCommit.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSparkSharedSeasonCommit=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r48: resolve protocol modules when they are used, not when this file loads. In the browser the
  // bootstrap can load this provider before js/sharedSeasonResults.js, and a load-time capture then
  // stays undefined for the whole page (SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE on every read).
  const scpModule=(file,key)=>typeof require==="function"?require(file):root[key];
  const scpModules={get commitModule(){return scpModule("./sharedSeasonCommit.js","CareerModeSharedSeasonCommit");},get resultsModule(){return scpModule("./sharedSeasonResults.js","CareerModeSharedSeasonResults");},get setupModule(){return scpModule("./sharedShowdownSetup.js","CareerModeSharedShowdownSetup");},get catalogModule(){return scpModule("./sharedShowdownCatalog.js","CareerModeSharedShowdownCatalog");}};
  const RUNTIME_REVISION="1.9.1-r10";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const OPERATION=/^season_commit_op_[0-9a-f]{32}$/;
  const RESULT_OPERATION=/^season_result_op_[0-9a-f]{32}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  // r80 Europa League: optional 8th key, present only as exactly true for a manager who won it, never with championsLeague true
  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old hashes never change.
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const SETUP_LEDGER_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","revision","phase","coordinatorRole","operationIds","operationTypes","baseRevisions","actorRoles","totalSeasons","confirmedRoles","activeSessionId","updatedAt","updatedByDeviceId"]);
  const COMMIT_KEYS=Object.freeze(["schemaVersion","objectType","rivalryId","seasonNumber","runtimeRevision","phase","revision","resultsRevision","results","acknowledgedRoles","operationIds","operationHashes","baseRevisions","actorRoles","activeSessionId","updatedAt","updatedByDeviceId"]);

  function scpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function scpResultError(error){return Object.freeze({ok:false,code:error&&typeof error.code==="string"?error.code:"SEASON_COMMIT_PROVIDER_FAILED"});}
  function scpSnapshot(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function scpPlain(value){return !!value&&typeof value==="object"&&!Array.isArray(value);}
  function scpExact(value,keys,code="SEASON_COMMIT_PROVIDER_STATE_INVALID"){if(!scpPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))scpFail(code);return value;}
  function scpClone(value){return JSON.parse(JSON.stringify(value));}
  function scpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(scpFreeze);Object.freeze(value);}return value;}
  function scpCanonical(value){if(Array.isArray(value))return `[${value.map(scpCanonical).join(",")}]`;if(value&&typeof value==="object"&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${scpCanonical(value[key])}`).join(",")}}`;return JSON.stringify(value);}
  async function scpHash(value,cryptoImpl){if(!cryptoImpl?.subtle||typeof TextEncoder==="undefined")scpFail("SEASON_COMMIT_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(scpCanonical(value)));return `sha256:${Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}`;}
  function scpTimestampMillis(value){if(value&&typeof value.toMillis==="function")return value.toMillis();if(value instanceof Date)return value.getTime();return Number.NaN;}
  function scpNormalizeRivalryId(value){const id=String(value||"").trim().toLowerCase();if(!/^pair_[0-9a-f]{64}$/.test(id))scpFail("SEASON_COMMIT_RIVALRY_INVALID");return id;}
  function scpNormalizeSessionId(value){const id=String(value||"").trim().toLowerCase();if(!/^session_[0-9a-f]{64}$/.test(id))scpFail("SEASON_COMMIT_SESSION_INVALID");return id;}
  function scpNormalizeDeviceId(value){const id=String(value||"").trim().toLowerCase();if(!/^device_[0-9a-f]{32}$/.test(id))scpFail("SEASON_COMMIT_DEVICE_INACTIVE");return id;}
  function scpSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)scpFail("SEASON_COMMIT_SEASON_INVALID");return n;}
  function scpOperation(value){const id=String(value||"").trim().toLowerCase();if(!OPERATION.test(id))scpFail("SEASON_COMMIT_COMMAND_INVALID");return id;}
  function scpBase(value){const n=Number(value);if(!Number.isInteger(n)||n<0||n>3)scpFail("SEASON_COMMIT_COMMAND_INVALID");return n;}
  function scpUid(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)scpFail("SEASON_COMMIT_AUTH_REQUIRED");return id;}
  function scpNow(value){const n=Number(value===undefined?Date.now():value);if(!Number.isSafeInteger(n)||n<0)scpFail("SEASON_COMMIT_CLOCK_INVALID");return n;}
  function scpTeamCount(setup){const clubs=scpModules.catalogModule?.catalog?.[setup?.leagueId];if(!Array.isArray(clubs)||clubs.length<2||clubs.length>20)scpFail("SEASON_COMMIT_TEAM_COUNT_INVALID");return clubs.length;}
  function scpEuropaLeague(value,code){if(!scpPlain(value))scpFail(code);const won=Object.hasOwn(value,"europaLeague");scpExact(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])],code);if(won&&(value.europaLeague!==true||value.championsLeague!==false))scpFail(code);if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))scpFail(code);return won;}
  function scpResult(value,teamCount){scpEuropaLeague(value,"SEASON_COMMIT_RESULTS_INVALID");const maxPoints=(teamCount-1)*2*3;if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)scpFail("SEASON_COMMIT_RESULTS_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")scpFail("SEASON_COMMIT_RESULTS_INVALID");}return scpClone(value);}
  function scpSdk(options){if(!options.firestore)scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");for(const name of ["doc","runTransaction","serverTimestamp"]){if(!options.firebaseSdk||typeof options.firebaseSdk[name]!=="function")scpFail("SEASON_COMMIT_PROVIDER_UNAVAILABLE");}return options.firebaseSdk;}
  function scpPath(sdk,db,...parts){return sdk.doc(db,...parts);}
  async function scpGet(tx,ref){return scpSnapshot(await tx.get(ref));}

  function scpAssertAccount(value,uid){if(!value||value.objectType!=="account"||value.objectId!==uid||value.lifecycleState!=="live"||value.data?.status!=="active")scpFail("SEASON_COMMIT_MANAGER_INACTIVE");}
  function scpAssertDevice(value,deviceId){if(!value||value.objectType!=="device"||value.objectId!==deviceId||value.lifecycleState!=="live"||value.data?.deviceId!==deviceId||value.data?.state!=="active")scpFail("SEASON_COMMIT_DEVICE_INACTIVE");}
  function scpAssertRivalry(value,rivalryId,uid){
    if(!value||value.objectType!=="rivalry"||value.objectId!==rivalryId||value.lifecycleState!=="live"||value.data?.connectionState!=="active")scpFail("SEASON_COMMIT_RIVALRY_INACTIVE");
    const slots=Array.isArray(value.data.managerSlots)?value.data.managerSlots:[],authorized=Array.isArray(value.data.authorizedAccountIds)?value.data.authorizedAccountIds:[];
    if(slots.length!==2||authorized.length!==2||new Set(authorized).size!==2)scpFail("SEASON_COMMIT_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>slots.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string"||!/^profile_[0-9a-f]{24}$/.test(String(slot.profileId||""))||!/^save_[0-9a-f]{24}$/.test(String(slot.saveId||"")))||ordered[0].accountId===ordered[1].accountId||!ordered.every(slot=>authorized.includes(slot.accountId)))scpFail("SEASON_COMMIT_BINDING_INVALID");
    const actor=ordered.find(slot=>slot.accountId===uid);if(!actor)scpFail("SEASON_COMMIT_ACTOR_NOT_ENTITLED");return Object.freeze({slots:ordered,authorized,actorRole:actor.slotId});
  }
  function scpAssertSession(value,rivalryId,sessionId,authorized,now){const members=value?.data?.memberAccountIds,expires=scpTimestampMillis(value?.data?.expiresAt),host=value?.data?.hostAccountId;if(!value||value.objectType!=="session"||value.objectId!==sessionId||value.lifecycleState!=="live"||value.data?.rivalryId!==rivalryId||value.data?.state!=="active"||!Array.isArray(members)||members.length!==2||new Set(members).size!==2||!authorized.every(id=>members.includes(id))||!members.every(id=>authorized.includes(id))||!authorized.includes(host)||!Number.isFinite(expires))scpFail("SEASON_COMMIT_ACTIVE_SESSION_REQUIRED");return Object.freeze({hostAccountId:host});}
  function scpAssertSetup(value,rivalryId,seasonNumber){scpExact(value,SETUP_LEDGER_KEYS,"SEASON_COMMIT_SETUP_NOT_CONFIRMED");if(value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||seasonNumber>value.totalSeasons||!Array.isArray(value.confirmedRoles)||value.confirmedRoles.length!==2||!ROLES.every(role=>value.confirmedRoles.includes(role)))scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");for(const key of ["operationIds","operationTypes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==6)scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");}if(JSON.stringify(value.operationTypes)!==JSON.stringify(["open","commit-league","commit-clubs","commit-length","confirm","confirm"])||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.slice(0,4).some(role=>role!==value.coordinatorRole))scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return value;}
  function scpAuthority({rivalryId,rivalry,role,sessionId,deviceId,hostRole}){const slot=rivalry.slots.find(item=>item.slotId===role),host=rivalry.slots.find(item=>item.slotId===hostRole);if(!slot||!host)scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return {rivalryId,connectionState:"active",managerSlots:rivalry.slots.map(item=>({slotId:item.slotId,accountId:item.accountId,profileId:item.profileId,saveId:item.saveId,accountState:"active",entitlementState:"active"})),actor:{accountId:slot.accountId,deviceId,deviceState:"active",managerRole:role,profileId:slot.profileId,saveId:slot.saveId},session:{sessionId,rivalryId,state:"active",hostAccountId:host.accountId,memberAccountIds:[...rivalry.authorized],expiresAtEpochMs:Number.MAX_SAFE_INTEGER},nowEpochMs:0};}
  async function scpRebuildSetup(ledger,rivalry,rivalryId,sessionId,deviceId,cryptoImpl){
    if(!scpModules.setupModule||typeof scpModules.setupModule.createProtocol!=="function"||!scpModules.catalogModule||!scpModules.catalogModule.catalog)scpFail("SEASON_COMMIT_SETUP_PROTOCOL_UNAVAILABLE");
    const protocol=await scpModules.setupModule.createProtocol({catalog:scpModules.catalogModule.catalog,cryptoImpl});let state=null;
    for(let index=0;index<ledger.revision;index+=1){const type=ledger.operationTypes[index],role=ledger.actorRoles[index],authority=scpAuthority({rivalryId,rivalry,role,sessionId,deviceId,hostRole:ledger.coordinatorRole});let command;if(type==="commit-league"||type==="commit-clubs")command=await protocol.prepareDraw({state,type,operationId:ledger.operationIds[index]});else if(type==="commit-length")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],totalSeasons:ledger.totalSeasons};else if(type==="confirm")command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index],setupHash:await protocol.confirmationHash(state)};else command={type,operationId:ledger.operationIds[index],baseRevision:ledger.baseRevisions[index]};const applied=await protocol.apply({state,authority,command});if(!applied.ok)scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");state=applied.state;}
    if(!state||state.phase!=="SHOWDOWN_CONFIRMED"||state.revision!==6)scpFail("SEASON_COMMIT_SETUP_NOT_CONFIRMED");return state;
  }
  function scpAssertPublicResults(value,rivalryId,seasonNumber){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResults"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.runtimeRevision!=="1.9.1-r9"||value.phase!=="RESULTS_READY"||value.revision!==2)scpFail("SEASON_COMMIT_RESULTS_NOT_READY");for(const key of ["publishedRoles","operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==2)scpFail("SEASON_COMMIT_RESULTS_NOT_READY");}if(new Set(value.publishedRoles).size!==2||!ROLES.every(role=>value.publishedRoles.includes(role))||new Set(value.operationIds).size!==2||value.operationIds.some(id=>!RESULT_OPERATION.test(id))||value.operationHashes.some(hash=>!HASH.test(hash))||value.baseRevisions.some((base,index)=>base!==index)||value.actorRoles.some(role=>!ROLES.includes(role)))scpFail("SEASON_COMMIT_RESULTS_NOT_READY");return value;}
  function scpAssertPrivateResult(value,rivalryId,seasonNumber,role,teamCount){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonResultRole"||value.rivalryId!==rivalryId||value.seasonNumber!==seasonNumber||value.managerRole!==role||!RESULT_OPERATION.test(value.operationId||"")||!HASH.test(value.commandHash||""))scpFail("SEASON_COMMIT_RESULTS_NOT_READY");return {...value,result:scpResult(value.result,teamCount)};}

  async function scpReadyState(publicResult,privateResults,teamCount,cryptoImpl){
    const receipts=publicResult.actorRoles.map((role,index)=>{const own=privateResults[role];if(!own||own.operationId!==publicResult.operationIds[index]||publicResult.publishedRoles[index]!==role)scpFail("SEASON_COMMIT_RESULTS_NOT_READY");return {operationId:publicResult.operationIds[index],baseRevision:publicResult.baseRevisions[index],actorRole:role,type:"publish-result",commandHash:own.commandHash};});
    const core={schemaVersion:1,runtimeRevision:"1.9.1-r9",seasonNumber:publicResult.seasonNumber,phase:"RESULTS_READY",revision:2,publishedRoles:[...publicResult.publishedRoles],results:{playerOne:scpResult(privateResults.playerOne.result,teamCount),playerTwo:scpResult(privateResults.playerTwo.result,teamCount)},receipts};
    const contentHash=await scpHash(core,cryptoImpl),state={...core,contentHash};
    if(!scpModules.resultsModule||typeof scpModules.resultsModule.createProtocol!=="function")scpFail("SEASON_COMMIT_RESULTS_PROTOCOL_UNAVAILABLE");
    const protocol=await scpModules.resultsModule.createProtocol({teamCount,cryptoImpl});
    try{await protocol.verifyState(state);}catch(_error){scpFail("SEASON_COMMIT_RESULTS_NOT_READY");}
    return scpFreeze(state);
  }
  async function scpCoreFromStorage(value,ready,teamCount,cryptoImpl){
    scpExact(value,COMMIT_KEYS,"SEASON_COMMIT_PROVIDER_STATE_INVALID");
    if(value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.runtimeRevision!==RUNTIME_REVISION||value.seasonNumber!==ready.seasonNumber||!["COMMITTED","ACKNOWLEDGED"].includes(value.phase)||!Number.isInteger(value.revision)||value.revision<1||value.revision>3||value.resultsRevision!==2)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");
    scpExact(value.results,ROLES,"SEASON_COMMIT_PROVIDER_STATE_INVALID");for(const role of ROLES)scpResult(value.results[role],teamCount);
    if(scpCanonical(value.results)!==scpCanonical(ready.results))scpFail("SEASON_COMMIT_RESULTS_REVISION_MISMATCH");
    for(const key of ["operationIds","operationHashes","baseRevisions","actorRoles"]){if(!Array.isArray(value[key])||value[key].length!==value.revision)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");}
    if(!Array.isArray(value.acknowledgedRoles)||value.acknowledgedRoles.length!==value.revision-1)scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");
    const receipts=value.operationIds.map((operationId,index)=>({operationId,baseRevision:value.baseRevisions[index],actorRole:value.actorRoles[index],type:index===0?"commit-season":"acknowledge-season",commandHash:value.operationHashes[index]}));
    const core={schemaVersion:1,runtimeRevision:RUNTIME_REVISION,seasonNumber:value.seasonNumber,phase:value.phase,revision:value.revision,resultsRevision:2,resultsContentHash:ready.contentHash,results:scpClone(value.results),acknowledgedRoles:[...value.acknowledgedRoles],receipts};
    const contentHash=await scpHash(core,cryptoImpl);return {...core,contentHash};
  }
  function scpStorageFromCore(state,{rivalryId,sessionId,deviceId,serverTimestamp}){return {schemaVersion:1,objectType:"sharedSeasonCommit",rivalryId,seasonNumber:state.seasonNumber,runtimeRevision:RUNTIME_REVISION,phase:state.phase,revision:state.revision,resultsRevision:state.resultsRevision,results:scpClone(state.results),acknowledgedRoles:[...state.acknowledgedRoles],operationIds:state.receipts.map(r=>r.operationId),operationHashes:state.receipts.map(r=>r.commandHash),baseRevisions:state.receipts.map(r=>r.baseRevision),actorRoles:state.receipts.map(r=>r.actorRole),activeSessionId:sessionId,updatedAt:serverTimestamp,updatedByDeviceId:deviceId};}

  async function scpContext(tx,options){
    const sdk=scpSdk(options),db=options.firestore,uid=scpUid(options.user),rivalryId=scpNormalizeRivalryId(options.rivalryId),sessionId=scpNormalizeSessionId(options.sessionId),deviceId=scpNormalizeDeviceId(options.deviceId),seasonNumber=scpSeason(options.seasonNumber),now=scpNow(options.nowEpochMs),seasonId=`season_${seasonNumber}`;
    const accountRef=scpPath(sdk,db,"accounts",uid),deviceRef=scpPath(sdk,db,"accounts",uid,"devices",deviceId),rivalryRef=scpPath(sdk,db,"rivalries",rivalryId),sessionRef=scpPath(sdk,db,"rivalries",rivalryId,"sessions",sessionId),setupRef=scpPath(sdk,db,"rivalries",rivalryId,"sharedSetup","authoritative"),publicRef=scpPath(sdk,db,"rivalries",rivalryId,"seasonResults",seasonId),p1Ref=scpPath(sdk,db,"rivalries",rivalryId,"seasonResults",seasonId,"roles","playerOne"),p2Ref=scpPath(sdk,db,"rivalries",rivalryId,"seasonResults",seasonId,"roles","playerTwo"),commitRef=scpPath(sdk,db,"rivalries",rivalryId,"seasonCommits",seasonId);
    scpAssertAccount(await scpGet(tx,accountRef),uid);scpAssertDevice(await scpGet(tx,deviceRef),deviceId);const rivalry=scpAssertRivalry(await scpGet(tx,rivalryRef),rivalryId,uid);scpAssertSession(await scpGet(tx,sessionRef),rivalryId,sessionId,rivalry.authorized,now);const ledger=scpAssertSetup(await scpGet(tx,setupRef),rivalryId,seasonNumber),cryptoImpl=options.cryptoImpl||root.crypto,setup=await scpRebuildSetup(ledger,rivalry,rivalryId,sessionId,deviceId,cryptoImpl),teamCount=scpTeamCount(setup);const publicResult=scpAssertPublicResults(await scpGet(tx,publicRef),rivalryId,seasonNumber);const p1=scpAssertPrivateResult(await scpGet(tx,p1Ref),rivalryId,seasonNumber,"playerOne",teamCount),p2=scpAssertPrivateResult(await scpGet(tx,p2Ref),rivalryId,seasonNumber,"playerTwo",teamCount);const ready=await scpReadyState(publicResult,{playerOne:p1,playerTwo:p2},teamCount,cryptoImpl);const stored=await scpGet(tx,commitRef);
    return {sdk,db,uid,rivalryId,sessionId,deviceId,seasonNumber,seasonId,actorRole:rivalry.actorRole,setup,teamCount,ready,stored,commitRef};
  }
  // r52: Rules evaluate a transactional write against the document as it is at commit time. When the
  // rival's acknowledgement lands between this transaction's read and its commit, the server answers
  // permission-denied (the revision+1 transition no longer holds) instead of an SDK-retried abort.
  // Map that one case to the existing STALE_BASE_REVISION contract only after a fresh, fully
  // authority-checked read proves the stored commit advanced past the revision this attempt read.
  async function scpConcurrentAdvance(error,seenRevision,options){
    if((error?.code!=="permission-denied"&&error?.code!=="firestore/permission-denied"&&error?.code!=="permission_denied")||!Number.isInteger(seenRevision))return false;
    const advanced=fresh=>Boolean(fresh&&fresh.ok===true&&Number.isInteger(fresh.revision)&&fresh.revision>seenRevision);
    if(advanced(await scpRead(options)))return true;
    // r85: the rival's write can land a moment after this denial (or the check read itself can fail under the same
    // contention), so look once more after a short pause before calling the denial unproven.
    await new Promise(resolve=>setTimeout(resolve,400));
    return advanced(await scpRead(options));
  }
  async function scpRun(type,options){
    let seenRevision=null;
    try{
      const sdk=scpSdk(options),operationId=scpOperation(options.operationId),baseRevision=scpBase(options.baseRevision),cryptoImpl=options.cryptoImpl||root.crypto;
      return await sdk.runTransaction(options.firestore,async tx=>{
        seenRevision=null;
        const ctx=await scpContext(tx,options),protocol=await scpModules.commitModule.createProtocol({teamCount:ctx.teamCount,cryptoImpl,seasonResultsModule:scpModules.resultsModule});
        const storedRevision=ctx.stored?ctx.stored.revision:0;
        let current=null;if(ctx.stored){current=await scpCoreFromStorage(ctx.stored,ctx.ready,ctx.teamCount,cryptoImpl);try{current=await protocol.verifyState(current);}catch(_error){scpFail("SEASON_COMMIT_PROVIDER_STATE_INVALID");}}
        const applied=await protocol.apply({state:current,setup:ctx.setup,seasonResults:ctx.ready,seasonNumber:ctx.seasonNumber,actorRole:ctx.actorRole,command:{type,operationId,baseRevision}});
        if(!applied.idempotent){seenRevision=storedRevision;tx.set(ctx.commitRef,scpStorageFromCore(applied.state,{rivalryId:ctx.rivalryId,sessionId:ctx.sessionId,deviceId:ctx.deviceId,serverTimestamp:sdk.serverTimestamp()}));}
        return scpFreeze({ok:true,replayed:Boolean(applied.idempotent),revision:applied.state.revision,phase:applied.state.phase,state:protocol.projectForRole(applied.state,ctx.actorRole)});
      });
    }catch(error){
      try{if(await scpConcurrentAdvance(error,seenRevision,options))return scpResultError({code:"SEASON_COMMIT_STALE_BASE_REVISION"});}catch(_readError){}
      return scpResultError(error);
    }
  }
  async function scpRead(options){
    try{
      const sdk=scpSdk(options),cryptoImpl=options.cryptoImpl||root.crypto;
      return await sdk.runTransaction(options.firestore,async tx=>{const ctx=await scpContext(tx,options);if(!ctx.stored)return scpFreeze({ok:true,committed:false,ready:true,managerRole:ctx.actorRole,seasonNumber:ctx.seasonNumber,phase:"RESULTS_READY",revision:0,results:scpClone(ctx.ready.results),coordinatorRole:ctx.setup.coordinatorRole});const protocol=await scpModules.commitModule.createProtocol({teamCount:ctx.teamCount,cryptoImpl,seasonResultsModule:scpModules.resultsModule});let current=await scpCoreFromStorage(ctx.stored,ctx.ready,ctx.teamCount,cryptoImpl);current=await protocol.verifyState(current);return scpFreeze({ok:true,committed:true,ready:true,coordinatorRole:ctx.setup.coordinatorRole,...protocol.projectForRole(current,ctx.actorRole)});});
    }catch(error){return scpResultError(error);}
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-spark-shared-season-commit",runtimeRevision:RUNTIME_REVISION,commitSeason:options=>scpRun("commit-season",options),acknowledgeSeason:options=>scpRun("acknowledge-season",options),read:scpRead,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,canonicalStorageMutation:false,authoritativeScoring:false,requiresResultsReady:true,requiresBothAcknowledgements:true,storagePath:"rivalries/{rivalryId}/seasonCommits/{seasonId}"});
});
```


## FILE: js/productionSharedTerminalClose.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeProductionSharedTerminalClose=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const POLL_MS=15000;
  const PANEL_ID="sharedTerminalClosePanel";
  const AMBIGUOUS_CODES=new Set(["unavailable","deadline-exceeded","aborted","internal","unknown","network-request-failed"]);
  let installed=false,busy=false,state=null,stateContextKey="",refreshPromise=null,closePromise=null,unsubscribeRemote=null,wakePending=false;
  let rivalryWakeRequested=false;
  // JOB-1038: one automatic attempt per exact Showdown, account and device in this runtime.
  // Reloads first read the durable terminal witness; provider idempotency remains the authority.
  const automaticAttempts=new Map();
  function ptcClearDrafts(id){if(!id||typeof root.removeStorageValue!=="function")return false;for(let season=1;season<=10;season++)for(const role of ["playerOne","playerTwo"])for(const kind of ["seasonResult","transferGuess"])root.removeStorageValue(`cms.draft.v1:${id}:${season}:${role}:${kind}`);return true;}
  function ptcAutomaticKey(context){return `${context.request.key}|${context.accountId}|${context.deviceId}`;}
  function ptcScheduleAutomaticClose(context){
    if(!installed||typeof root.setTimeout!=="function")return;
    const key=ptcAutomaticKey(context);if(automaticAttempts.has(key))return;
    const request=context.request,generation=stateGeneration;let polls=0;
    const attempt=()=>{
      if(!ptcStillCurrent(request,generation)||busy||closePromise||ptcCurrentState()?.phase!=="READY"||automaticAttempts.has(key)||!ptcRemoteActive(context,ptcCurrentState().intent.sessionId))return;
      // Close forgets the session, which clears Shared History, so the close waits (bounded) for the converged history the
      // Final Winner shows as the final season and trophies. Without the history module it closes at once.
      if(!ptcHistoryConverged(request.rivalryId)&&polls<HISTORY_WAIT_POLLS){polls++;root.setTimeout(attempt,HISTORY_POLL_MS);return;}
      automaticAttempts.set(key,{failed:false});
      ptcPublish(request,{...ptcCurrentState(),automaticSaving:true,automaticCloseFailed:false});
      // r87 arch S-05: a throw before the close's own try (intent check) is a failed save too, never "Saving..." forever.
      void ptcClose(key).catch(error=>{ptcReport("Shared Showdown Terminal Close failed",error);return null;}).then(result=>{
        if(result?.ok===true)return;
        automaticAttempts.set(key,{failed:true});
        if(ptcStillCurrent(request,generation)&&ptcCurrentState()?.phase!=="CLOSED")ptcPublish(request,{...ptcCurrentState(),automaticSaving:false,automaticCloseFailed:true});
      });
    };
    root.setTimeout(attempt,0);
  }
  const HISTORY_POLL_MS=250,HISTORY_WAIT_POLLS=60;
  function ptcHistoryConverged(rivalryId){
    try{const api=root.CareerModeProductionSharedHistoryConvergence;if(typeof api?.getState!=="function")return true;const h=api.getState();return h?.authoritative===true&&h.phase==="HISTORY_CONVERGED"&&h.rivalryId===rivalryId;}catch(_){return true;}
  }
  // H1017-2: bumped whenever the held state is dropped, so an awaited retry can tell its context was cleared under it.
  let stateGeneration=0;
  // BH-7: throttled, single-flight re-ask of Connected Rivalry (see ptcRetryUnavailableRivalry).
  const RIVALRY_RETRY_MS=30000;
  let rivalryRetryAt=0,rivalryRetryInFlight=false;
  const POLL_FRESH_MS=45000;let pollFreshAt=Date.now();
  let protocol=null,provider=null,finalApi=null,runtimeApi=null,accountApi=null,pairingApi=null,rivalryApi=null,remoteApi=null;

  function ptcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function ptcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(ptcFreeze);Object.freeze(value);}return value;}
  function ptcClone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
  function ptcCode(value){return String(value&&value.code||"").split("/").pop().trim().toLowerCase();}
  function ptcAmbiguous(value){return AMBIGUOUS_CODES.has(ptcCode(value));}
  function ptcShowdown(){try{return typeof currentShowdown!=="undefined"?currentShowdown:null;}catch(_error){return null;}}
  function ptcConfirmedSetupRivalry(){try{const s=root.CareerModeProductionSharedShowdownSetup?.getState?.();return s&&s.ready===true&&s.setup&&s.setup.phase==="SHOWDOWN_CONFIRMED"&&s.setup.revision===6&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
  function ptcRivalryApi(){return rivalryApi||root.CareerModeSparkConnectedRivalry||null;}
  function ptcAttachedRivalry(saveId,playerOneProfileId,playerTwoProfileId){try{const s=ptcRivalryApi()?.getState?.(),b=s&&s.binding;return s&&s.attached===true&&b&&b.saveId===saveId&&((b.managerRole==="playerOne"&&b.profileId===playerOneProfileId)||(b.managerRole==="playerTwo"&&b.profileId===playerTwoProfileId))&&s.rivalryId?String(s.rivalryId):"";}catch(_error){return "";}}
  function ptcRequest(){
    const showdown=ptcShowdown();
    if(!showdown||showdown.sharedJourney?.mode!=="shared")return null;
    const saveId=String(showdown.identity?.saveId||"").trim();
    const playerOneProfileId=String(showdown.identity?.managerProfileIds?.playerOne||"").trim();
    const playerTwoProfileId=String(showdown.identity?.managerProfileIds?.playerTwo||"").trim();
    // Shared Setup stops being ready once the session closes, so fall back to the durable Connected Rivalry binding of this exact save and manager (it survives reloads).
    const rivalryId=String(showdown.sharedJourney?.rivalryId||ptcConfirmedSetupRivalry()||ptcAttachedRivalry(saveId,playerOneProfileId,playerTwoProfileId)||"").trim().toLowerCase();
    if(!/^pair_[0-9a-f]{64}$/.test(rivalryId)||!/^save_[0-9a-f]{24}$/.test(saveId)||!/^profile_[0-9a-f]{24}$/.test(playerOneProfileId)||!/^profile_[0-9a-f]{24}$/.test(playerTwoProfileId))return null;
    // r80: fromSetup marks a rivalry borrowed from the Shared Setup held in page memory (the shell's marker names none).
    const fromSetup=!showdown.sharedJourney?.rivalryId&&Boolean(ptcConfirmedSetupRivalry());
    return Object.freeze({rivalryId,saveId,playerOneProfileId,playerTwoProfileId,fromSetup,key:`${saveId}|${rivalryId}|${playerOneProfileId}|${playerTwoProfileId}|terminal-close`});
  }
  function ptcCurrentState(){const request=ptcRequest();return request&&state&&stateContextKey===request.key?state:null;}
  function ptcReport(context,error){if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);else root.console?.error?.(context,error);}
  function ptcLoad(key,path,ready){if(ready())return Promise.resolve(ready());if(typeof root.loadRuntimeScript!=="function")return Promise.reject(Object.assign(new Error("Release-owned runtime loader is unavailable."),{code:"TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE"}));return root.loadRuntimeScript(key,path,ready).then(()=>{const api=ready();if(!api)ptcFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE",`${path} loaded without its expected API.`);return api;});}
  async function ptcEnsureDependencies(){
    const resolved={};
    for(const [key,path,ready] of [
      ["ssjr-terminal-close-protocol","js/sharedTerminalClose.js",()=>root.CareerModeSharedTerminalClose],
      ["ssjr-terminal-close-provider","js/sparkTerminalClose.js",()=>root.CareerModeSparkTerminalClose],
      ["ssjr-production-final-reconciliation","js/productionSharedFinalReconciliation.js",()=>root.CareerModeProductionSharedFinalReconciliation],
      ["firebase-runtime","js/productionFirebaseRuntime.js",()=>root.CareerModeProductionFirebaseRuntime],
      ["spark-account","js/sparkConnectedAccount.js",()=>root.CareerModeSparkConnectedAccount],
      ["pairing","js/sparkPrivatePairing.js",()=>root.CareerModeSparkPrivatePairing],
      ["rivalry","js/sparkConnectedRivalry.js",()=>root.CareerModeSparkConnectedRivalry],
      ["rj","js/sparkRemoteJoining.js",()=>root.CareerModeSparkRemoteJoining]
    ])resolved[key]=await ptcLoad(key,path,ready);
    protocol=resolved["ssjr-terminal-close-protocol"];provider=resolved["ssjr-terminal-close-provider"];finalApi=resolved["ssjr-production-final-reconciliation"];runtimeApi=resolved["firebase-runtime"];accountApi=resolved["spark-account"];pairingApi=resolved.pairing;rivalryApi=resolved.rivalry;remoteApi=resolved.rj;
    if(typeof protocol?.prepare!=="function"||typeof protocol?.closeResult!=="function"||typeof provider?.close!=="function"||typeof provider?.read!=="function"||typeof finalApi?.refresh!=="function"||typeof finalApi?.getState!=="function"||typeof runtimeApi?.ensureAccountServices!=="function")ptcFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");
    return true;
  }
  async function ptcResolveContext(request=ptcRequest()){
    if(!request)ptcFail("TERMINAL_CLOSE_SHARED_CONTEXT_REQUIRED","No Showdown is open.");
    if(typeof accountApi?.initialize==="function")await accountApi.initialize();
    if(typeof pairingApi?.initialize==="function")await pairingApi.initialize();
    if(typeof rivalryApi?.initialize==="function")await rivalryApi.initialize();
    const account=accountApi?.getState?.(),device=pairingApi?.getState?.(),rivalry=rivalryApi?.getState?.();
    const accountId=String(account?.accountId||"").trim(),deviceId=String(device?.deviceId||"").trim(),attachedRivalry=String(rivalry?.rivalryId||"").trim().toLowerCase();
    if(account?.connected!==true||!accountId)ptcFail("TERMINAL_CLOSE_AUTH_REQUIRED","Sign in with the same account before closing this Showdown.");
    if(device?.registered!==true||!/^device_[0-9a-f]{32}$/.test(deviceId))ptcFail("TERMINAL_CLOSE_DEVICE_REQUIRED","This browser must remain an active registered device.");
    if(rivalry?.attached!==true||attachedRivalry!==request.rivalryId)ptcFail("TERMINAL_CLOSE_RIVALRY_REQUIRED","Reconnect this Showdown before closing it.");
    if(rivalry.accountId&&rivalry.accountId!==accountId)ptcFail("TERMINAL_CLOSE_RIVALRY_ACCOUNT_MISMATCH");
    if(rivalry.deviceId&&rivalry.deviceId!==deviceId)ptcFail("TERMINAL_CLOSE_RIVALRY_DEVICE_MISMATCH");
    const services=(root.CareerModeFirestoreBudget?.services||(s=>s))(await runtimeApi.ensureAccountServices());
    if(!services||services.ok!==true||!services.auth||!services.firestore||!services.firestoreSdk)ptcFail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE","Private Firebase services are unavailable. No terminal state was changed.");
    const user=services.auth.currentUser;if(!user||user.uid!==accountId)ptcFail("TERMINAL_CLOSE_AUTH_MISMATCH","The current Firebase account no longer matches Connected Account authority.");
    return Object.freeze({request,accountId,deviceId,user,services});
  }
  function ptcRemoteActive(context,exactSessionId=null){
    const remote=remoteApi?.getState?.();
    const expiry=Number(remote?.expiresAtEpochMs);
    return Boolean(remote&&remote.sessionState==="active"&&/^session_[0-9a-f]{64}$/.test(String(remote.sessionId||""))&&remote.rivalryId===context.request.rivalryId&&remote.accountId===context.accountId&&remote.deviceId===context.deviceId&&remote.pendingAction==null&&Number.isFinite(expiry)&&(!exactSessionId||remote.sessionId===exactSessionId))?remote:null;
  }
  function ptcField(id){return root.document&&root.document.getElementById(id);}
  function ptcText(node,value){if(node&&node.textContent!==String(value??""))node.textContent=String(value??"");}
  function ptcHidden(node,hidden){if(node)node.classList.toggle("hidden",Boolean(hidden));}
  function ptcManagerName(role){return String(ptcShowdown()?.managers?.[role]||(role==="playerOne"?"Manager 1":"Manager 2"));}
  function ptcEnsureUi(){
    if(!root.document)return null;const review=ptcField("seasonReviewPanel");if(!review)return null;
    let panel=ptcField(PANEL_ID);if(!panel){panel=root.document.createElement("section");panel.id=PANEL_ID;panel.className="seasonReviewSummary sharedTerminalClosePanel hidden";panel.dataset.sharedTerminalClose="true";review.appendChild(panel);}
    const ensure=(id,tag,className="")=>{let node=ptcField(id);if(!node){node=root.document.createElement(tag);node.id=id;if(className)node.className=className;panel.appendChild(node);}return node;};
    const heading=ensure("sharedTerminalCloseHeading","h3");
    const summary=ensure("sharedTerminalCloseSummary","p");
    const status=ensure("sharedTerminalCloseStatus","p","stateNote");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
    const actions=ensure("sharedTerminalCloseActions","div","seasonReviewActions");
    let close=ptcField("sharedTerminalCloseAction");if(!close){close=root.document.createElement("button");close.id="sharedTerminalCloseAction";close.className="menuButton";close.type="button";close.addEventListener("click",()=>{void (ptcCurrentState()?.phase==="RECOVERY_PENDING"?ptcRetry():ptcClose());});actions.appendChild(close);}
    let retry=ptcField("sharedTerminalCloseRetry");if(!retry){retry=root.document.createElement("button");retry.id="sharedTerminalCloseRetry";retry.className="compactButton hidden";retry.type="button";retry.addEventListener("click",()=>{void ptcRetry();});actions.appendChild(retry);}
    return {panel,heading,summary,status,actions,close,retry};
  }
  function ptcWinnerText(witness){if(!witness)return "";const winner=witness.winner==="draw"?"DRAW":`${ptcManagerName(witness.winner)} WINS`;return `${ptcManagerName("playerOne")} ${witness.managerTotals.playerOne} · ${ptcManagerName("playerTwo")} ${witness.managerTotals.playerTwo} · ${winner}`;}
  function ptcRender(){
    const ui=ptcEnsureUi();if(!ui)return false;const current=ptcCurrentState();
    const visible=Boolean(current&&["READY","RECOVERY_PENDING","CLOSED","BLOCKED"].includes(current.phase));ptcHidden(ui.panel,!visible);if(!visible)return false;
    const witness=current.terminalWitness||current.intent||current.finalReconciliation||null;
    if(current.phase==="CLOSED"){
      ptcText(ui.heading,"SHOWDOWN CLOSED");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,"CLOSED · FINAL RESULTS ARE LOCKED");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);ui.panel.dataset.terminal="true";return true;
    }
    ui.panel.dataset.terminal="false";
    if(current.phase==="RECOVERY_PENDING"){
      ptcText(ui.heading,"SHOWDOWN NOT CLOSED YET");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.automaticSaving?"Saving this Showdown to your career…":current.message||"It may have closed already. TRY CLOSING AGAIN checks.");ptcHidden(ui.close,!current.automaticCloseFailed);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHOWDOWN");ptcHidden(ui.retry,false);ui.retry.disabled=busy;ptcText(ui.retry,"TRY CLOSING AGAIN");return true;
    }
    if(current.phase==="BLOCKED"){
      ptcText(ui.heading,"SHOWDOWN CAN CLOSE WHEN BOTH PLAYERS RECONNECT");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.message||"Final results are safe. Reconnect both players to this Showdown, then refresh.");ptcHidden(ui.close,true);ptcHidden(ui.retry,true);return true;
    }
    ptcText(ui.heading,"FINAL RESULT READY TO CLOSE");ptcText(ui.summary,ptcWinnerText(witness));ptcText(ui.status,current.automaticCloseFailed?"This Showdown could not be saved. Tap CLOSE SHOWDOWN to try again.":"Saving this Showdown to your career…");ptcHidden(ui.close,!current.automaticCloseFailed);ui.close.disabled=busy;ptcText(ui.close,"CLOSE SHOWDOWN");ptcHidden(ui.retry,true);return true;
  }
  function ptcPublish(request,next){
    if(!request||!next){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
    const current=ptcRequest();if(!current||current.key!==request.key)return null;
    const previousPhase=stateContextKey===request.key?state?.phase:null;
    state=ptcFreeze(next);stateContextKey=request.key;ptcRender();
    // QoL 3+6: the Showdown has ended, so no unsent season result or guess draft for this rivalry stays on this device.
    // Swept here through the generic js/storage.js remove helper (a Showdown has at most 10 seasons) so the startup budget stays put.
    if(state.phase==="CLOSED")ptcClearDrafts(state.rivalryId||request.rivalryId);
    if(state.phase==="DELETED")ptcClearDrafts(state.rivalryId||request.rivalryId);
    if(state.phase==="CLOSED"||state.phase==="DELETED")ptcNoteEnded(state.rivalryId||request.rivalryId);
    try{root.dispatchEvent?.(new root.CustomEvent("career-mode-shared-terminal-close-state-change",{detail:{phase:state.phase,rivalryId:state.rivalryId||request.rivalryId,terminal:state.phase==="CLOSED"}}));}catch(_error){}
    if(state.phase==="DELETED"&&previousPhase!=="DELETED")ptcLeaveEndedShowdown();
    return state;
  }
  // r80 END SHOWDOWN: the Showdown was ended (this page's own terminal read saw it closed with no finish witness). This phone
  // leaves it for Home once and says so; History keeps it as Ended early. Phase names stay (DELETED).
  function ptcLeaveEndedShowdown(){
    try{
      const home=root.document?.getElementById("mainMenu");
      if(home&&!home.classList.contains("hidden"))return;
      root.stopTransferTimerLoop?.();root.resetTransientSelectionOperations?.();root.resetNavigationState?.();
      if(typeof root.showScreen==="function")root.showScreen("mainMenu",false);else void root.navigateTo?.("mainMenu",{addToHistory:false});
      root.refreshMainMenuExperience?.();
      root.showAppNotice?.("This Showdown was ended for both players. History keeps it as Ended early.","info",8000);
    }catch(_error){}
  }
  function ptcClear(){stateGeneration+=1;state=null;stateContextKey="";ptcRender();return null;}
  function ptcStillCurrent(request,generation){return ptcRequest()?.key===request.key&&stateGeneration===generation;}
  // A verified stored closure can finish the same gameplay through a replacement session. This comparison is read-only;
  // unresolved writes still resend the original intent, and the protocol/provider keep exact session-bound idempotency.
  function ptcSameFinalResult(terminalRead,intent){
    if(protocol.sameWitness(terminalRead.terminalWitness,intent))return true;
    try{const witness=protocol.verifyIntent(terminalRead.terminalWitness),held=protocol.verifyIntent(intent);return protocol.sameWitness({...witness,sessionId:held.sessionId},held);}catch(_error){return false;}
  }
  function ptcClosedState(request,terminalRead){const witness=protocol.verifyIntent(terminalRead.terminalWitness);return {phase:"CLOSED",rivalryId:request.rivalryId,sessionId:witness.sessionId,rivalryRevision:terminalRead.rivalryRevision,terminal:true,terminalWitness:ptcClone(witness),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
  function ptcBootstrap(){return ptcEnsureDependencies().then(()=>{if(!unsubscribeRemote&&typeof remoteApi?.subscribe==="function")unsubscribeRemote=remoteApi.subscribe(()=>ptcWake());});}
  function ptcOnOtherRivalry(request){try{const s=ptcRivalryApi()?.getState?.(),id=String(s?.rivalryId||"").trim().toLowerCase();return s?.attached===true&&/^pair_[0-9a-f]{64}$/.test(id)&&id!==request.rivalryId;}catch(_error){return false;}}
  // r80: right after END SHOWDOWN on this phone, START (or Nik's JOIN) opens a new save shell before its rivalry is attached.
  // The shell's marker names no rivalry, so the request borrows the ended Showdown's Shared Setup still held in page memory,
  // and Connected Rivalry, now read for the new shell, has no rivalry attached at all. That ended rivalry is not this shell's
  // Showdown, so there is nothing to close here and nothing to report. Quiet only when all of these hold: the rivalry was
  // borrowed from that Setup, this page saw that exact rivalry end (it held it CLOSED or DELETED, or the pair let it go as
  // closed: END on this phone or on the other one), and Connected Rivalry answered for this exact save with nothing attached.
  // A live Showdown whose pointer is missing on this device (a new browser continuing) has not ended, so it still reports.
  const endedRivalryIds=new Set();let unsubscribePair=null;
  function ptcNoteEnded(rivalryId){const id=String(rivalryId||"").trim().toLowerCase();if(/^pair_[0-9a-f]{64}$/.test(id))endedRivalryIds.add(id);}
  function ptcWatchPair(){try{const pair=root.CareerModePersistentNikDanielPair;if(!pair)return;if(!unsubscribePair&&typeof pair.subscribe==="function")unsubscribePair=pair.subscribe(next=>ptcNoteEnded(next?.closedRivalryId));ptcNoteEnded(pair.getState?.()?.closedRivalryId);}catch(_error){}}
  function ptcShellHasNoRivalry(request){try{ptcWatchPair();const s=ptcRivalryApi()?.getState?.(),b=s?.binding;return request.fromSetup===true&&endedRivalryIds.has(request.rivalryId)&&s?.connected===true&&s.attached!==true&&!s.rivalryId&&b?.saveId===request.saveId;}catch(_error){return false;}}
  async function ptcRefreshNow(){
    const request=ptcRequest();if(!request)return ptcClear();
    // r79: a Showdown ended by the other manager (END SHOWDOWN) stays ended (a closed rivalry never reopens): no further read for it.
    // r86 (red team #6): the same holds for a verified CLOSED one. The Champion screen's 45 s timer wake re-read it (~320 billed/hour).
    const ended=ptcCurrentState();if(ended?.phase==="DELETED"||(ended?.phase==="CLOSED"&&ended.terminal===true&&ended.rivalryId===request.rivalryId))return ended;
    await ptcBootstrap();
    // r79: right after a delete and a new JOIN, the page's rivalry can already be the new Showdown while this Showdown's request
    // (the old one) is still on screen for a moment. That is not a failure to report: this page has moved on, and the next wake
    // (the save or rivalry change) refreshes the new one. A held RECOVERY_PENDING close keeps its witness.
    let context;try{context=await ptcResolveContext(request);}catch(error){if(error?.code==="TERMINAL_CLOSE_RIVALRY_REQUIRED"&&(ptcOnOtherRivalry(request)||ptcShellHasNoRivalry(request))){const held=ptcCurrentState();return held?.phase==="RECOVERY_PENDING"?held:ptcClear();}throw error;}
    if(ptcRequest()?.key!==request.key)return null;
    const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
    if(ptcRequest()?.key!==request.key)return null;
    // H1017-1: an unresolved close holds its exact witness. A verified closed read of the same final facts resolves it here;
    // an open, mismatched or failed read keeps RECOVERY_PENDING so TRY CLOSING AGAIN stays bound to that witness.
    const held=ptcCurrentState();
    const deletedRead=terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed";
    const publishDeleted=()=>{try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcDeletedState(request,terminalRead));};
    if(held?.phase==="RECOVERY_PENDING"&&held.intent){
      // Codex #910: a pending close whose rivalry the other phone has since deleted (closed, no witness, so this close never
      // landed) is resolved as DELETED instead of being held and retried against a closed rivalry.
      if(deletedRead)return publishDeleted();
      if(terminalRead?.ok===true&&terminalRead.terminal===true&&ptcSameFinalResult(terminalRead,held.intent)){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
      return held;
    }
    if(terminalRead?.ok===true&&terminalRead.terminal===true){try{remoteApi?.forgetSession?.();}catch(_error){}return ptcPublish(request,ptcClosedState(request,terminalRead));}
    // r79: DELETE CURRENT SHOWDOWN on the other phone closed this rivalry without a terminal witness. This same read (no extra one)
    // says so; this page then lets the dead Showdown go like the CLOSE path does (session forgotten, drafts swept) and announces
    // DELETED, so the pair holds the rivalry as closed and the next JOIN is not blocked by the deleted Showdown.
    if(deletedRead)return publishDeleted();
    if(!terminalRead||terminalRead.ok!==true)ptcFail(terminalRead?.code||"TERMINAL_CLOSE_READ_FAILED",terminalRead?.message||"Could not check whether the Showdown is closed.");
    let final=finalApi.getState();if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.rivalryId!==request.rivalryId)final=await finalApi.refresh();
    if(ptcRequest()?.key!==request.key)return null;
    if(!final||final.phase!=="FINAL_SEASON_RECONCILED"||final.finalSeasonReconciled!==true||final.rivalryId!==request.rivalryId)return ptcClear();
    const remote=ptcRemoteActive(context);
    if(!remote)return ptcPublish(request,{phase:"BLOCKED",rivalryId:request.rivalryId,terminal:false,finalReconciliation:ptcClone(final),message:"Final results are safe. Reconnect both players to close the Showdown.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
    const intent=protocol.prepare(final,{sessionId:remote.sessionId});
    const failed=automaticAttempts.get(ptcAutomaticKey(context))?.failed===true;
    const ready=ptcPublish(request,{phase:"READY",rivalryId:request.rivalryId,sessionId:remote.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:!failed,automaticCloseFailed:failed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
    ptcScheduleAutomaticClose(context);
    return ready;
  }
  function ptcRefresh(){
    if(refreshPromise)return refreshPromise;busy=true;ptcRender();
    const run=ptcRefreshNow().catch(error=>{ptcReport("Unable to refresh Shared Showdown Terminal Close",error);return ptcCurrentState();}).finally(()=>{if(refreshPromise===run)refreshPromise=null;busy=false;ptcRender();ptcWatchContext(ptcRequest());if(wakePending){wakePending=false;ptcWake();}});refreshPromise=run;return run;
  }
  // Job 31: when the 4-hour private session ends (or a reload drops it) every shared refresher fails at once. The RECONNECT
  // SESSION banner owns that state, so those failures wake the banner instead of stacking red error toasts.
  function ptcSessionRecoveryOwnsFailure(){
    try{
      if(ptcShowdown()?.sharedJourney?.mode!=="shared")return false;
      const remote=root.CareerModeSparkRemoteJoining?.getState?.();
      // r75: Remote Joining now loads with Journey Reconnect's first shared refresh instead of at startup. Its session lives in
      // page memory only, so where Journey Reconnect runs, a Remote Joining not loaded yet holds no session, exactly as a freshly
      // loaded one did before: the banner owns the failure and Reconnect's refresh loads it.
      if(!remote){if(!root.CareerModeProductionSharedJourneyReconnect)return false;}
      else{const expiry=Number(remote.expiresAtEpochMs);
      if(remote.sessionState==="active"&&remote.sessionId&&remote.pendingAction==null&&Number.isFinite(expiry)&&Date.now()<expiry)return false;}
      root.console?.warn?.("[Career Mode Showdown] Shared refresh paused until the private session is reconnected.");
      void root.CareerModeProductionSharedJourneyReconnect?.refresh?.();
      return true;
    }catch(_error){return false;}
  }
  async function ptcReportUnlessClosed(context,error){
    if(ptcSessionRecoveryOwnsFailure())return false;
    // Active-journey refreshers lose read access once the rivalry closes; a verified CLOSED state makes their failure expected, anything else is still reported.
    try{let current=ptcCurrentState();if(current?.phase!=="CLOSED"&&ptcRequest())current=await ptcRefresh();if(current&&current.phase==="CLOSED")return false;if(current&&current.phase==="DELETED")return false;}catch(_error){}
    ptcReport(context,error);return true;
  }
  // r87 W3-6: the atomic session close is checked against server time (freshSessionActivity: server - 5 min .. + 1 min), so it
  // uses the connection's server-anchored clock (js/sparkRemoteJoining.js clockNow); the phone clock only if that is missing.
  function ptcNow(){try{const now=Number(root.CareerModeSparkRemoteJoining?.clockNow?.());if(Number.isFinite(now)&&now>0)return now;}catch(_error){}return Date.now();}
  function ptcCloseOptions(context,intent){return {user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:context.request.rivalryId,sessionId:intent.sessionId,deviceId:context.deviceId,intent,nowEpochMs:ptcNow(),cryptoImpl:root.crypto};}
  function ptcAccepted(request,intent,result){
    const closed=protocol.closeResult(intent,result);if(ptcRequest()?.key!==request.key)return null;try{remoteApi?.forgetSession?.();}catch(_error){}
    return ptcPublish(request,{phase:"CLOSED",rivalryId:request.rivalryId,sessionId:intent.sessionId,rivalryRevision:closed.rivalryRevision,sessionRevision:closed.sessionRevision,terminal:true,terminalWitness:ptcClone(intent),replayed:closed.replayed,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});
  }
  // BH-7: when both managers tap CLOSE together the loser's write is refused (permission-denied once the winner closed the
  // session/rivalry). Re-read once, like Season Results does; if the rivalry is already CLOSED with these final facts, show
  // CLOSED quietly. Anything else keeps the existing rejection path.
  // Codex #910: a rivalry the other phone deleted after READY rejects the close as a replay conflict (closed, no matching
  // witness); the same one re-read then shows DELETED instead of a rejected close.
  const PTC_RACE_CODES=new Set(["permission-denied","permission_denied","terminal_close_session_not_active","terminal_close_rivalry_not_active","terminal_close_replay_conflict"]);
  async function ptcClosedByRival(request,context,intent,result,generation){
    if(!PTC_RACE_CODES.has(ptcCode(result)))return null;
    try{
      const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
      if(ptcStillCurrent(request,generation)&&terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed"){try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcDeletedState(request,terminalRead));return {ok:true,status:"deleted",rivalryId:request.rivalryId};}
      if(!ptcStillCurrent(request,generation)||terminalRead?.ok!==true||terminalRead.terminal!==true||!ptcSameFinalResult(terminalRead,intent))return null;
      try{remoteApi?.forgetSession?.();}catch(_error){}
      ptcPublish(request,ptcClosedState(request,terminalRead));
      return {ok:true,status:"replayed",replayed:true,closedByRival:true,rivalryId:request.rivalryId,sessionId:terminalRead.terminalWitness.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};
    }catch(_error){return null;}
  }
  async function ptcClose(automaticKey=null){
    if(closePromise)return closePromise;
    const current=ptcCurrentState();if(!current||current.phase!=="READY"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_NOT_READY",message:"This Showdown is not ready to close yet."};
    const request=ptcRequest(),intent=protocol.verifyIntent(current.intent),generation=stateGeneration;busy=true;ptcPublish(request,{...current,automaticSaving:true,automaticCloseFailed:false});
    const run=(async()=>{
      try{
        const context=await ptcResolveContext(request);if(!ptcStillCurrent(request,generation)||(automaticKey&&ptcAutomaticKey(context)!==automaticKey))ptcFail("TERMINAL_CLOSE_CONTEXT_CHANGED");
        if(!ptcRemoteActive(context,intent.sessionId))ptcFail("TERMINAL_CLOSE_ACTIVE_SESSION_REQUIRED","The connection ended. Reconnect both players, then close the Showdown.");
        const result=await provider.close(ptcCloseOptions(context,intent));
        if(!ptcStillCurrent(request,generation))return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
        if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
        if(ptcAmbiguous(result)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:false,automaticCloseFailed:true,message:"The close is not confirmed yet. Tap TRY CLOSING AGAIN. Nothing new is started.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {...result,recoverable:true};}
        const rivalClosed=await ptcClosedByRival(request,context,intent,result,generation);if(rivalClosed)return rivalClosed;
        ptcPublish(request,{...current,automaticSaving:false,automaticCloseFailed:true,message:result?.message||"The Showdown could not be closed. Nothing was changed."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
      }catch(error){
        if(!ptcStillCurrent(request,generation))return {ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
        if(ptcAmbiguous(error)){ptcPublish(request,{phase:"RECOVERY_PENDING",rivalryId:request.rivalryId,sessionId:intent.sessionId,terminal:false,intent:ptcClone(intent),automaticSaving:false,automaticCloseFailed:true,message:"The close was not confirmed. Tap TRY CLOSING AGAIN.",canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}
        ptcPublish(request,{...current,automaticSaving:false,automaticCloseFailed:true,message:error.message});
        ptcReport("Shared Showdown Terminal Close failed",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};
      }
    })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();if(wakePending){wakePending=false;ptcWake();}});closePromise=run;return run;
  }
  function ptcDeletedState(request,terminalRead){return {phase:"DELETED",rivalryId:request.rivalryId,rivalryRevision:terminalRead.rivalryRevision,terminal:false,deleted:true,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false};}
  async function ptcRetry(){
    if(closePromise)return closePromise;
    const current=ptcCurrentState();if(!current||current.phase!=="RECOVERY_PENDING"||!current.intent)return {ok:false,code:"TERMINAL_CLOSE_RECOVERY_REQUIRED",message:"There is nothing to retry."};
    const request=ptcRequest(),intent=protocol.verifyIntent(current.intent),generation=stateGeneration;busy=true;ptcPublish(request,{...current,automaticSaving:true});
    // H1017-2: the request and state generation are re-checked after every await, before any close call or session cleanup.
    const changed={ok:false,code:"TERMINAL_CLOSE_CONTEXT_CHANGED"};
    const run=(async()=>{
      try{
        const context=await ptcResolveContext(request);if(!ptcStillCurrent(request,generation))return changed;
        const terminalRead=await provider.read({user:context.user,firestore:context.services.firestore,firebaseSdk:context.services.firestoreSdk,rivalryId:request.rivalryId,deviceId:context.deviceId,cryptoImpl:root.crypto});
        if(!ptcStillCurrent(request,generation))return changed;
        // Codex #910: the other phone deleted the rivalry before this RETRY: DELETED at once, no close sent against it.
        if(terminalRead?.ok===true&&terminalRead.deleted===true&&terminalRead.rivalryState==="closed"){try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcDeletedState(request,terminalRead));return {ok:true,status:"deleted",rivalryId:request.rivalryId};}
        if(terminalRead?.ok===true&&terminalRead.terminal===true){if(!ptcSameFinalResult(terminalRead,intent))ptcFail("TERMINAL_CLOSE_REPLAY_CONFLICT");try{remoteApi?.forgetSession?.();}catch(_error){}ptcPublish(request,ptcClosedState(request,terminalRead));return {ok:true,status:"replayed",replayed:true,rivalryId:request.rivalryId,sessionId:terminalRead.terminalWitness.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:terminalRead.rivalryRevision};}
        const result=await provider.close(ptcCloseOptions(context,intent));
        if(!ptcStillCurrent(request,generation))return changed;
        if(result?.ok===true){ptcAccepted(request,intent,result);return result;}
        if(ptcAmbiguous(result)){ptcPublish(request,current);return {...result,recoverable:true};}
        const rivalClosed=await ptcClosedByRival(request,context,intent,result,generation);if(rivalClosed)return rivalClosed;
        ptcPublish(request,{...current,message:result?.message||"Closing again did not work. Your final results are kept."});return result||{ok:false,code:"TERMINAL_CLOSE_FAILED"};
      }catch(error){if(ptcAmbiguous(error)){ptcPublish(request,current);return {ok:false,code:error.code||"TERMINAL_CLOSE_RECOVERY_PENDING",message:error.message,recoverable:true};}if(ptcStillCurrent(request,generation))ptcPublish(request,current);ptcReport("Shared Showdown Terminal Close retry failed",error);return {ok:false,code:error.code||"TERMINAL_CLOSE_FAILED",message:error.message};}
    })().finally(()=>{if(closePromise===run)closePromise=null;busy=false;ptcRender();if(wakePending){wakePending=false;ptcWake();}});closePromise=run;return run;
  }
  // BH-7: the one-shot wake below never asks again when an initialize left Connected Rivalry unattached and "unavailable".
  // Re-ask at most once per 30 s, one attempt at a time (flag cleared in finally), only while no request exists and the page is
  // visible. r52's unthrottled retry re-ran initialize on every wake; each initialize emits a rivalry state-change event that
  // wakes this module again, so it looped and stalled the season-3 publish. The 30 s clock starts before the attempt, so the
  // attempt's own state-change event cannot start another one; it is fire-and-forget and nothing else waits on it.
  function ptcRivalryRetryDue(api){
    if(rivalryRetryInFlight||root.document?.visibilityState==="hidden")return false;
    if(ptcShowdown()?.sharedJourney?.mode!=="shared"||!api||typeof api.initialize!=="function")return false;
    const s=api.getState?.();if(!s||s.initialized!==true||s.attached===true||s.status!=="unavailable"||s.busy===true)return false;
    return !rivalryRetryAt||Date.now()-rivalryRetryAt>=RIVALRY_RETRY_MS;
  }
  function ptcRetryUnavailableRivalry(api){
    if(!ptcRivalryRetryDue(api))return false;
    rivalryRetryAt=Date.now();rivalryRetryInFlight=true;
    void Promise.resolve().then(()=>{const s=api.getState?.();if(s&&s.attached!==true&&s.status==="unavailable"&&!ptcRequest())return api.initialize();return null;}).catch(()=>{}).finally(()=>{rivalryRetryInFlight=false;});
    return true;
  }
  // r84 trim: while a shared Showdown is open, the budget layer keeps one listener on the rivalry root and one on the Session
  // (see CareerModeFirestoreBudget.watchContext); a change to either wakes this module at once.
  let contextWatchKey="";
  function ptcContextWake(){ptcWake({type:"career-mode-shared-wait-context-change"});}
  function ptcWatchContext(request){
    const budget=root.CareerModeFirestoreBudget;if(!budget||typeof budget.watchContext!=="function")return;
    // A verified CLOSED (or deleted) Showdown never changes again: no context watch for it, so a phone unlock on the Champion
    // screen restores nothing for it (red team r87 A-03). The watch stays while the close can still be finished.
    const ended=request?ptcCurrentState():null,settled=ended?.phase==="DELETED"||(ended?.phase==="CLOSED"&&ended.terminal===true&&ended.rivalryId===request?.rivalryId);
    const id=request&&!settled&&root.document?.visibilityState!=="hidden"?request.rivalryId:"";
    if(id===contextWatchKey&&!id)return;
    contextWatchKey=id;try{budget.watchContext(id||null,ptcContextWake);}catch(_error){}
  }
  function ptcWake(event){
    ptcWatchPair();
    if(event?.type==="career-mode-save-library-authority-invalidated")return ptcClear();
    const request=ptcRequest();
    ptcWatchContext(request);
    if(!request){
      ptcClear();
      // After a reload the durable rivalry binding is only known once Connected Rivalry initializes; its state-change event wakes this module again.
      const api=ptcRivalryApi();if(!rivalryWakeRequested&&ptcShowdown()?.sharedJourney?.mode==="shared"&&api&&typeof api.initialize==="function"&&api.getState?.()?.initialized!==true){rivalryWakeRequested=true;rivalryRetryAt=Date.now();void Promise.resolve().then(()=>api.initialize()).catch(()=>{});}
      else ptcRetryUnavailableRivalry(api);
      return;
    }
    if(stateContextKey&&stateContextKey!==request.key)ptcClear();
    if(root.document?.visibilityState==="hidden")return;if(busy){if(event?.type==="career-mode-shared-wait-context-change")wakePending=true;return;}
    // r75: while the close is pending (FINAL RESULT READY TO CLOSE and the pending/blocked states) the partner may close at
    // any moment, so this check reads the rivalry root fresh instead of from the budget layer's quiet reuse.
    // r84 trim: a healthy context listener on the rivalry root (ptcWatchContext) delivers the partner's close at once, so the
    // fresh reads below run only while it is not confirmed (no listener, hidden page, dropped connection).
    const rootPath=`rivalries/${request.rivalryId}`,watched=Boolean(root.CareerModeFirestoreBudget?.contextHealthy?.(rootPath));
    if(["READY","RECOVERY_PENDING","BLOCKED"].includes(ptcCurrentState()?.phase)){if(!watched)root.CareerModeFirestoreBudget?.wantFresh?.(rootPath);}
    // r84: between seasons nothing else re-reads the rivalry now that Final Reconciliation no longer loops, so the 60 s quiet reuse
    // could hold a partner's END SHOWDOWN for up to 75 s. A timer wake (no event) reads the rivalry root fresh at most every 45 s:
    // one extra read per 3 min per device, and the idle phone goes Home within ~45 s.
    else if(!event&&Date.now()-pollFreshAt>=POLL_FRESH_MS){pollFreshAt=Date.now();if(!watched)root.CareerModeFirestoreBudget?.wantFresh?.(rootPath);}
    void ptcRefresh();
  }
  function ptcInstall(){
    if(installed)return true;installed=true;
    // r75: an ordinary startup with no shared Showdown loads none of the close runtime (Remote Joining stays unloaded);
    // the first wake that finds a shared Showdown loads it through ptcRefreshNow.
    if(ptcShowdown()?.sharedJourney?.mode==="shared")void ptcBootstrap().then(()=>ptcWake()).catch(error=>ptcReport("Shared Showdown Terminal Close bootstrap unavailable",error));
    for(const event of ["career-mode-shared-wait-context-change","career-mode-shared-final-reconciliation-state-change","career-mode-connected-account-state-change","career-mode-connected-rivalry-state-change","career-mode-active-save-changed","career-mode-save-library-authority-invalidated","career-mode-showdown-state-change"]){root.addEventListener?.(event,ptcWake);}
    root.document?.addEventListener?.("visibilitychange",ptcWake);
    root.addEventListener?.("career-mode-permanent-pair-ended",event=>ptcNoteEnded(event?.detail?.closedRivalryId));
    if(typeof root.setInterval==="function")root.setInterval(()=>{if(!root.CareerModeProductionSharedSeasonCommit?.waitingListenerHealthy?.())ptcWake();},POLL_MS);
    if(typeof root.setTimeout==="function")root.setTimeout(ptcWake,0);
    return true;
  }

  return Object.freeze({
    contractVersion:1,feature:"ssjr-production-shared-terminal-close",productionEnabled:true,runtimeRevision:"1.9.1-r18",pollIntervalMs:POLL_MS,
    requiresFinalReconciliation:true,requiresExactActiveSessionToClose:true,sameWitnessRetry:true,terminalReadAfterReload:true,terminalSessionResurrection:false,
    canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false,blazeRequired:false,cloudRunRequired:false,cloudFunctionsRequired:false,
    install:ptcInstall,refresh:ptcRefresh,reportUnlessClosed:ptcReportUnlessClosed,close:ptcClose,retry:ptcRetry,getState:ptcCurrentState,isBusy:()=>busy
  });
});

```


## FILE: js/sparkTerminalClose.js
```
(function(root,factory){
  const protocol=typeof module!=="undefined"&&module.exports?require("./sharedTerminalClose.js"):root.CareerModeSharedTerminalClose;
  const sessionProtocol=typeof module!=="undefined"&&module.exports?require("./sparkPrivateSession.js"):root.CareerModeSparkPrivateSession;
  const api=factory(root,protocol,sessionProtocol);if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.CareerModeSparkTerminalClose=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root,protocol,sessionProtocol){
  "use strict";
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  // r80 Europa League: optional 8th key, present only as exactly true for a manager who won it, never with championsLeague true
  // (checked per manager only). A result without it keeps the r79 7-key shape, and the key is copied only when present, so old seasons score as before.
  const PROGRESS_KEYS=Object.freeze(["schemaVersion","runtimeRevision","totalSeasons","acceptedThroughSeason","managerTotals","closedSessionRevision"]);
  function stpFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function stcResultError(error,fallback){return {ok:false,code:error&&typeof error.code==="string"?error.code:fallback,message:error&&error.message?error.message:"Terminal Close could not be completed."};}
  function stpClone(value){return JSON.parse(JSON.stringify(value));}
  function stpFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(stpFreeze);Object.freeze(value);}return value;}
  function stpCanonical(value){if(value===undefined||value===null)return null;if(value&&typeof value.toMillis==="function")return {$timestamp:value.toMillis()};if(value instanceof Date)return {$timestamp:value.getTime()};if(Array.isArray(value))return value.map(stpCanonical);if(typeof value==="object"){const out={};for(const key of Object.keys(value).sort())out[key]=stpCanonical(value[key]);return out;}return value;}
  function stcHex(bytes){return Array.from(bytes,value=>value.toString(16).padStart(2,"0")).join("");}
  async function stcHashEnvelopeValue(value,cryptoImpl=root.crypto){if(!cryptoImpl||!cryptoImpl.subtle||typeof cryptoImpl.subtle.digest!=="function")stpFail("TERMINAL_CLOSE_CRYPTO_UNAVAILABLE");const digest=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(stpCanonical(value))));return `sha256:${stcHex(new Uint8Array(digest))}`;}
  function stcNormalizeId(value,pattern,code){const normalized=typeof value==="string"?value.trim().toLowerCase():"";if(!pattern.test(normalized))stpFail(code);return normalized;}
  function stcNormalizeAccount(user){const id=user&&typeof user.uid==="string"?user.uid.trim():"";if(!id)stpFail("TERMINAL_CLOSE_AUTH_REQUIRED");return id;}
  function stcSnapshotValue(snapshot){return snapshot&&typeof snapshot.exists==="function"&&snapshot.exists()?snapshot.data():null;}
  function stcEnvelopeShape(value,type,id){return Boolean(value&&value.schemaVersion===1&&value.objectType===type&&value.objectId===id&&Number.isInteger(value.revision)&&value.revision>=0&&value.lifecycleState==="live"&&typeof value.contentHash==="string"&&/^sha256:[0-9a-f]{64}$/.test(value.contentHash)&&value.data&&typeof value.data==="object"&&value.tombstone===null);}
  async function stcVerifyEnvelope(value,type,id,cryptoImpl){if(!stcEnvelopeShape(value,type,id))stpFail("TERMINAL_CLOSE_AUTHORITY_INVALID");const expected=await stcHashEnvelopeValue({objectType:type,objectId:id,revision:value.revision,data:value.data},cryptoImpl);if(expected!==value.contentHash)stpFail("TERMINAL_CLOSE_INTEGRITY_FAILED");return value;}
  function stcAssertActiveAccount(value,accountId){if(!stcEnvelopeShape(value,"account",accountId)||value.data.status!=="active")stpFail("TERMINAL_CLOSE_ACCOUNT_INACTIVE");}
  function stcAssertActiveDevice(value,deviceId){if(!stcEnvelopeShape(value,"device",deviceId)||value.data.deviceId!==deviceId||value.data.state!=="active")stpFail(value&&value.data&&value.data.state==="revoked"?"TERMINAL_CLOSE_DEVICE_REVOKED":"TERMINAL_CLOSE_DEVICE_INACTIVE");}
  function stcValidateSdk(firestore,sdk){if(!firestore)stpFail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE");for(const method of ["doc","runTransaction"]){if(!sdk||typeof sdk[method]!=="function")stpFail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE");}if(!sdk.Timestamp||typeof sdk.Timestamp.fromMillis!=="function")stpFail("TERMINAL_CLOSE_PROVIDER_UNAVAILABLE");}
  function stcNormalizeOptions(options={}){
    stcValidateSdk(options.firestore,options.firebaseSdk);if(!protocol||typeof protocol.verifyIntent!=="function"||!sessionProtocol||typeof sessionProtocol.verifySession!=="function"||typeof sessionProtocol.buildEnvelope!=="function")stpFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");
    const intent=protocol.verifyIntent(options.intent),rivalryId=stcNormalizeId(options.rivalryId,/^pair_[0-9a-f]{64}$/,"TERMINAL_CLOSE_RIVALRY_INVALID"),sessionId=stcNormalizeId(options.sessionId,/^session_[0-9a-f]{64}$/,"TERMINAL_CLOSE_SESSION_INVALID");
    if(intent.rivalryId!==rivalryId)stpFail("TERMINAL_CLOSE_RIVALRY_MISMATCH");if(intent.sessionId!==sessionId)stpFail("TERMINAL_CLOSE_SESSION_MISMATCH");
    const nowEpochMs=options.nowEpochMs===undefined?Date.now():Number(options.nowEpochMs);if(!Number.isFinite(nowEpochMs)||nowEpochMs<=0)stpFail("TERMINAL_CLOSE_TIME_INVALID");
    return Object.freeze({firestore:options.firestore,firebaseSdk:options.firebaseSdk,accountId:stcNormalizeAccount(options.user),deviceId:stcNormalizeId(options.deviceId,/^device_[0-9a-f]{32}$/,"TERMINAL_CLOSE_DEVICE_INVALID"),rivalryId,sessionId,intent,nowEpochMs,cryptoImpl:options.cryptoImpl||root.crypto});
  }
  function stcRefs(operation){const sdk=operation.firebaseSdk,db=operation.firestore;return Object.freeze({account:sdk.doc(db,"accounts",operation.accountId),device:sdk.doc(db,"accounts",operation.accountId,"devices",operation.deviceId),rivalry:sdk.doc(db,"rivalries",operation.rivalryId),session:sdk.doc(db,"rivalries",operation.rivalryId,"sessions",operation.sessionId),setup:sdk.doc(db,"rivalries",operation.rivalryId,"sharedSetup","authoritative"),commit:season=>sdk.doc(db,"rivalries",operation.rivalryId,"seasonCommits",`season_${season}`)});}
  function stcEntitledRivalry(rivalry,accountId){const ids=Array.isArray(rivalry.data.authorizedAccountIds)?rivalry.data.authorizedAccountIds:[],slots=Array.isArray(rivalry.data.managerSlots)?rivalry.data.managerSlots:[];if(ids.length!==2||new Set(ids).size!==2||!ids.includes(accountId)||slots.length!==2||slots.some(slot=>!slot||slot.entitlementState!=="active"||typeof slot.accountId!=="string")||!ids.every(id=>slots.some(slot=>slot.accountId===id)))stpFail("TERMINAL_CLOSE_RIVALRY_AUTHORITY_INVALID");return ids;}
  function stcExactObject(value,keys){return Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)));}
  function stcEuropaLeague(value){const won=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"europaLeague"));const icon=Boolean(value&&typeof value==="object"&&!Array.isArray(value)&&Object.hasOwn(value,"primePack"));if(!stcExactObject(value,[...RESULT_KEYS,...(won?["europaLeague"]:[]),...(icon?["primePack"]:[])])||(won&&(value.europaLeague!==true||value.championsLeague!==false))||(icon&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4)))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");return won;}
  function stcScoreResult(value){const europaLeague=stcEuropaLeague(value);for(const key of ["leaguePosition","leaguePoints","leagueGoals"]){if(!Number.isInteger(value[key]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}if(value.leaguePosition<1||value.leaguePosition>20||value.leaguePoints<0||value.leaguePoints>114||value.leagueGoals<0||value.leagueGoals>300)stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");}return (value.championsLeague?5:0)+(europaLeague?3:0)+(Number.isInteger(value.primePack)?value.primePack:0)+(value.leaguePosition===1?3:0)+(value.domesticCup?1:0)+((value.leaguePoints>=100||value.leagueGoals>=100)?1:0)+((value.topScorer||value.topAssist)?1:0);}
  function stcCommit(value,rivalryId,season){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSeasonCommit"||value.rivalryId!==rivalryId||value.seasonNumber!==season||value.runtimeRevision!=="1.9.1-r10"||value.phase!=="ACKNOWLEDGED"||value.revision!==3||!stcExactObject(value.results,["playerOne","playerTwo"]))stpFail("TERMINAL_CLOSE_SEASON_COMMIT_INVALID");return Object.freeze({playerOne:stcScoreResult(value.results.playerOne),playerTwo:stcScoreResult(value.results.playerTwo)});}
  function stcSetup(value,rivalryId,totalSeasons){if(!value||value.schemaVersion!==1||value.objectType!=="sharedSetupLedger"||value.rivalryId!==rivalryId||value.revision!==6||value.phase!=="SHOWDOWN_CONFIRMED"||value.totalSeasons!==totalSeasons)stpFail("TERMINAL_CLOSE_SETUP_INVALID");return value;}
  function stcProgress(value,totalSeasons){if(!stcExactObject(value,PROGRESS_KEYS)||value.schemaVersion!==1||value.runtimeRevision!=="1.9.1-r18"||value.totalSeasons!==totalSeasons||!Number.isInteger(value.acceptedThroughSeason)||value.acceptedThroughSeason<1||value.acceptedThroughSeason>totalSeasons||!stcExactObject(value.managerTotals,["playerOne","playerTwo"])||!Number.isInteger(value.managerTotals.playerOne)||value.managerTotals.playerOne<0||!Number.isInteger(value.managerTotals.playerTwo)||value.managerTotals.playerTwo<0||(value.closedSessionRevision!==null&&(!Number.isInteger(value.closedSessionRevision)||value.closedSessionRevision<1)))stpFail("TERMINAL_CLOSE_PROGRESS_INVALID");return value;}
  async function stcBuildRivalryEnvelope(operation,prior,data,now){const revision=prior.revision+1;return {schemaVersion:1,objectType:"rivalry",objectId:operation.rivalryId,revision,parentRevision:prior.revision,lifecycleState:"live",contentHash:await stcHashEnvelopeValue({objectType:"rivalry",objectId:operation.rivalryId,revision,data},operation.cryptoImpl),priorContentHash:prior.contentHash,updatedAt:now,updatedByAccountId:operation.accountId,updatedByDeviceId:operation.deviceId,data,tombstone:null};}
  function stcAccepted(operation,rivalry,sessionRevision,replayed){return stpFreeze({ok:true,status:replayed?"replayed":"accepted",replayed:Boolean(replayed),rivalryId:operation.rivalryId,sessionId:operation.sessionId,rivalryState:"closed",sessionState:"closed",rivalryRevision:rivalry.revision,sessionRevision,terminalWitness:stpClone(operation.intent),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});}
  async function stcPrepareProgress(operation,references){return operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
    stcAssertActiveAccount(stcSnapshotValue(await transaction.get(references.account)),operation.accountId);stcAssertActiveDevice(stcSnapshotValue(await transaction.get(references.device)),operation.deviceId);
    const rivalryValue=stcSnapshotValue(await transaction.get(references.rivalry));await stcVerifyEnvelope(rivalryValue,"rivalry",operation.rivalryId,operation.cryptoImpl);stcEntitledRivalry(rivalryValue,operation.accountId);
    if(rivalryValue.data.connectionState==="closed"){if(!protocol.sameWitness(rivalryValue.data.terminalClose,operation.intent))stpFail("TERMINAL_CLOSE_REPLAY_CONFLICT");const progress=stcProgress(rivalryValue.data.terminalProgress,operation.intent.totalSeasons);if(!Number.isInteger(progress.closedSessionRevision))stpFail("TERMINAL_CLOSE_PARTIAL_STATE_INVALID");return {closed:true,done:true,rivalry:rivalryValue,sessionRevision:progress.closedSessionRevision};}
    if(rivalryValue.data.connectionState!=="active")stpFail("TERMINAL_CLOSE_RIVALRY_NOT_ACTIVE");
    const prior=rivalryValue.data.terminalProgress===undefined?null:stcProgress(rivalryValue.data.terminalProgress,operation.intent.totalSeasons);if(prior&&prior.closedSessionRevision!==null)stpFail("TERMINAL_CLOSE_PARTIAL_STATE_INVALID");if(prior&&prior.acceptedThroughSeason===operation.intent.totalSeasons)return {closed:false,done:true,rivalry:rivalryValue,progress:prior};
    const season=prior?prior.acceptedThroughSeason+1:1;if(!prior)stcSetup(stcSnapshotValue(await transaction.get(references.setup)),operation.rivalryId,operation.intent.totalSeasons);const scores=stcCommit(stcSnapshotValue(await transaction.get(references.commit(season))),operation.rivalryId,season);const nextProgress={schemaVersion:1,runtimeRevision:"1.9.1-r18",totalSeasons:operation.intent.totalSeasons,acceptedThroughSeason:season,managerTotals:{playerOne:(prior?prior.managerTotals.playerOne:0)+scores.playerOne,playerTwo:(prior?prior.managerTotals.playerTwo:0)+scores.playerTwo},closedSessionRevision:null};const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs),nextRivalry=await stcBuildRivalryEnvelope(operation,rivalryValue,{...rivalryValue.data,terminalProgress:nextProgress},now);return {closed:false,done:season===operation.intent.totalSeasons,rivalry:nextRivalry,progress:nextProgress,priorRivalry:rivalryValue};
  });}
  // Both managers close together: the partner's identical progress write can land between this write's read and its
  // commit, and the Rules then refuse the stale base (permission-denied, not an SDK-retried abort). Like r52's season
  // commit, treat it as a lost race only when a fresh read shows the rivalry moved past the revision this attempt read;
  // the next preflight re-checks everything. Any other denial is returned unchanged.
  async function stcConcurrentAdvance(error,prior,operation,references){
    if(!["permission-denied","firestore/permission-denied","permission_denied"].includes(error?.code))return false;
    try{const fresh=await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>stcSnapshotValue(await transaction.get(references.rivalry)));return Boolean(fresh&&Number.isInteger(fresh.revision)&&fresh.revision>prior.revision);}catch(_error){return false;}
  }
  async function stcAdvanceProgress(operation,references){
    // The r75 budget layer serves this read-only preflight as cached document reads without a commit.
    // Keep its account/device/setup/commit reads out of the writing transaction's Rules expression budget.
    for(let attempt=0;attempt<=operation.intent.totalSeasons;attempt++){
      const prepared=await stcPrepareProgress(operation,references);if(!prepared.priorRivalry)return prepared;
      let accepted;
      try{accepted=await operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
        const current=stcSnapshotValue(await transaction.get(references.rivalry));
        if(!current||current.revision!==prepared.priorRivalry.revision||current.contentHash!==prepared.priorRivalry.contentHash)return false;
        transaction.set(references.rivalry,prepared.rivalry);return true;
      });}catch(error){if(!await stcConcurrentAdvance(error,prepared.priorRivalry,operation,references))throw error;accepted=false;}
      // A concurrent progress write requires a new preflight for the next season, including SDK callback retries.
      if(accepted){const {priorRivalry,...progress}=prepared;return progress;}
    }
    stpFail("TERMINAL_CLOSE_PROGRESS_STALLED");
  }
  async function stcFinalize(operation,references){return operation.firebaseSdk.runTransaction(operation.firestore,async transaction=>{
    stcAssertActiveAccount(stcSnapshotValue(await transaction.get(references.account)),operation.accountId);stcAssertActiveDevice(stcSnapshotValue(await transaction.get(references.device)),operation.deviceId);
    const rivalryValue=stcSnapshotValue(await transaction.get(references.rivalry));await stcVerifyEnvelope(rivalryValue,"rivalry",operation.rivalryId,operation.cryptoImpl);const authorized=stcEntitledRivalry(rivalryValue,operation.accountId);const progress=stcProgress(rivalryValue.data.terminalProgress,operation.intent.totalSeasons);
    if(rivalryValue.data.connectionState==="closed"){if(!protocol.sameWitness(rivalryValue.data.terminalClose,operation.intent))stpFail("TERMINAL_CLOSE_REPLAY_CONFLICT");if(!Number.isInteger(progress.closedSessionRevision))stpFail("TERMINAL_CLOSE_PARTIAL_STATE_INVALID");return stcAccepted(operation,rivalryValue,progress.closedSessionRevision,true);}
    if(rivalryValue.data.connectionState!=="active")stpFail("TERMINAL_CLOSE_RIVALRY_NOT_ACTIVE");if(progress.acceptedThroughSeason!==operation.intent.totalSeasons||progress.closedSessionRevision!==null||progress.managerTotals.playerOne!==operation.intent.managerTotals.playerOne||progress.managerTotals.playerTwo!==operation.intent.managerTotals.playerTwo)stpFail("TERMINAL_CLOSE_FINAL_AUTHORITY_MISMATCH");
    const sessionValue=stcSnapshotValue(await transaction.get(references.session));if(!sessionValue)stpFail("TERMINAL_CLOSE_SESSION_NOT_FOUND");const session=await sessionProtocol.verifySession(sessionValue,operation.rivalryId,operation.sessionId,operation.cryptoImpl);if(!session.members.includes(operation.accountId))stpFail("TERMINAL_CLOSE_SESSION_MEMBER_REQUIRED");if(session.data.state!=="active"||session.members.length!==2||authorized.some(id=>!session.members.includes(id)))stpFail("TERMINAL_CLOSE_SESSION_NOT_ACTIVE");
    const now=operation.firebaseSdk.Timestamp.fromMillis(operation.nowEpochMs),sessionData={...session.data,state:"closed",lastActivityAt:now,revokedAt:null};const nextSession=await sessionProtocol.buildEnvelope({sessionId:operation.sessionId,revision:sessionValue.revision+1,parentRevision:sessionValue.revision,priorContentHash:sessionValue.contentHash,updatedAt:now,accountId:operation.accountId,deviceId:operation.deviceId,data:sessionData,cryptoImpl:operation.cryptoImpl});const nextProgress={...stpClone(progress),closedSessionRevision:nextSession.revision};const rivalryData={...rivalryValue.data,connectionState:"closed",terminalProgress:nextProgress,terminalClose:stpClone(operation.intent)},nextRivalry=await stcBuildRivalryEnvelope(operation,rivalryValue,rivalryData,now);transaction.set(references.session,nextSession);transaction.set(references.rivalry,nextRivalry);return stcAccepted(operation,nextRivalry,nextSession.revision,false);
  });}
  // The same race at the last step: both managers finalize at once and the partner's atomic close lands between this
  // attempt's rivalry read and its session read, so the Rules refuse the read of the now-closed session (permission-denied,
  // not an SDK-retried abort). A fresh preflight that finds the rivalry closed with this exact witness means the partner
  // closed this same Showdown: answer as a replay. Any other denial, or a different witness, is returned unchanged.
  async function stcConcurrentFinalize(error,operation,references){
    if(!["permission-denied","firestore/permission-denied","permission_denied"].includes(error?.code))return null;
    let fresh;try{fresh=await stcPrepareProgress(operation,references);}catch(_error){return null;}
    return fresh&&fresh.closed===true?stcAccepted(operation,fresh.rivalry,fresh.sessionRevision,true):null;
  }
  async function stcClose(options={}){try{const operation=stcNormalizeOptions(options),references=stcRefs(operation);for(let step=0;step<=operation.intent.totalSeasons;step++){const progress=await stcAdvanceProgress(operation,references);if(progress.closed)return stcAccepted(operation,progress.rivalry,progress.sessionRevision,true);if(progress.done)break;if(step===operation.intent.totalSeasons)stpFail("TERMINAL_CLOSE_PROGRESS_STALLED");}try{return await stcFinalize(operation,references);}catch(error){const replay=await stcConcurrentFinalize(error,operation,references);if(replay)return replay;throw error;}}catch(error){return stcResultError(error,"TERMINAL_CLOSE_FAILED");}}
  // r79: a rivalry closed with no terminal witness was closed by DELETE CURRENT SHOWDOWN (the pair's abandon closure), not by a
  // finished Showdown. The read says so ("deleted") instead of failing as an invalid witness, so the other manager's page knows.
  async function stcRead(options={}){try{stcValidateSdk(options.firestore,options.firebaseSdk);if(!protocol||typeof protocol.verifyIntent!=="function")stpFail("TERMINAL_CLOSE_DEPENDENCY_UNAVAILABLE");const accountId=stcNormalizeAccount(options.user),deviceId=stcNormalizeId(options.deviceId,/^device_[0-9a-f]{32}$/,"TERMINAL_CLOSE_DEVICE_INVALID"),rivalryId=stcNormalizeId(options.rivalryId,/^pair_[0-9a-f]{64}$/,"TERMINAL_CLOSE_RIVALRY_INVALID"),cryptoImpl=options.cryptoImpl||root.crypto,sdk=options.firebaseSdk,db=options.firestore;return await sdk.runTransaction(db,async transaction=>{stcAssertActiveAccount(stcSnapshotValue(await transaction.get(sdk.doc(db,"accounts",accountId))),accountId);stcAssertActiveDevice(stcSnapshotValue(await transaction.get(sdk.doc(db,"accounts",accountId,"devices",deviceId))),deviceId);const rivalry=await stcVerifyEnvelope(stcSnapshotValue(await transaction.get(sdk.doc(db,"rivalries",rivalryId))),"rivalry",rivalryId,cryptoImpl);stcEntitledRivalry(rivalry,accountId);if(rivalry.data.connectionState!=="closed")return stpFreeze({ok:true,status:"open",rivalryId,rivalryState:rivalry.data.connectionState,terminal:false});if(rivalry.data.terminalClose===undefined||rivalry.data.terminalClose===null)return stpFreeze({ok:true,status:"deleted",rivalryId,rivalryState:"closed",rivalryRevision:rivalry.revision,terminal:false,deleted:true,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});const intent=protocol.verifyIntent(rivalry.data.terminalClose),progress=stcProgress(rivalry.data.terminalProgress,intent.totalSeasons);if(intent.rivalryId!==rivalryId||progress.acceptedThroughSeason!==progress.totalSeasons||progress.managerTotals.playerOne!==intent.managerTotals.playerOne||progress.managerTotals.playerTwo!==intent.managerTotals.playerTwo||!Number.isInteger(progress.closedSessionRevision))stpFail("TERMINAL_CLOSE_RIVALRY_MISMATCH");return stpFreeze({ok:true,status:"closed",rivalryId,rivalryState:"closed",rivalryRevision:rivalry.revision,sessionRevision:progress.closedSessionRevision,terminal:true,terminalWitness:stpClone(intent),canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false});});}catch(error){return stcResultError(error,"TERMINAL_CLOSE_READ_FAILED");}}
  return Object.freeze({contractVersion:1,feature:"ssjr-spark-terminal-close",runtimeRevision:"1.9.1-r18",atomicRivalryAndSessionClose:true,stagedTerminalProof:true,maxTerminalProofSteps:10,newCollectionRequired:false,terminalReadAfterClose:true,productionRulesPublished:false,canonicalStorageMutation:false,listPermissionRequired:false,billingRequired:false,close:stcClose,read:stcRead});
});
```


## FILE: js/sharedHistoryConvergence.js
```
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSharedHistoryConvergence=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RUNTIME_REVISION="1.9.1-r12";
  const ROLES=Object.freeze(["playerOne","playerTwo"]);
  const PROFILE_ID=/^profile_[0-9a-f]{24}$/;
  const SAVE_ID=/^save_[0-9a-f]{24}$/;
  const RIVALRY_ID=/^pair_[0-9a-f]{64}$/;
  const HASH=/^sha256:[0-9a-f]{64}$/;
  const RESULT_KEYS=Object.freeze(["leaguePosition","leaguePoints","leagueGoals","domesticCup","championsLeague","topScorer","topAssist"]);
  const SCORE_KEYS=Object.freeze(["championsLeague","leagueTitle","domesticCup","performanceBonus","individualAwardsBonus","total"]);
  const TRIGGER_KEYS=Object.freeze(["hundredLeaguePoints","hundredLeagueGoals","topScorer","topAssist"]);
  // r80 Europa League: a result may carry the sparse 8th key europaLeague (exactly true, never with championsLeague true; checked per
  // manager only), and its score then carries europaLeague:3. A result without it is the unchanged r79 shape and scores as before.
  const EUROPA_LEAGUE="europaLeague";
  const LEAGUE_TEAM_COUNTS=Object.freeze({premier_league:20,laliga:20,bundesliga:18,serie_a:20,ligue_1:20});

  function hcFail(code,message){const error=new Error(message||code);error.code=code;throw error;}
  function hcPlain(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
  function hcFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(hcFreeze);Object.freeze(value);}return value;}
  function hcExact(value,keys,code){if(!hcPlain(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))hcFail(code);return value;}
  function hcRivalry(value){const id=String(value||"").trim().toLowerCase();if(!RIVALRY_ID.test(id))hcFail("HISTORY_CONVERGENCE_RIVALRY_INVALID");return id;}
  function hcSeason(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>10)hcFail("HISTORY_CONVERGENCE_SEASON_INVALID");return n;}
  function hcTeamCount(leagueId){const n=LEAGUE_TEAM_COUNTS[String(leagueId||"").trim()];if(!Number.isInteger(n))hcFail("HISTORY_CONVERGENCE_LEAGUE_INVALID");return n;}
  function hcEuropaLeague(value){if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");const won=Object.hasOwn(value,EUROPA_LEAGUE);hcExact(value,hcResultKeys(value),"HISTORY_CONVERGENCE_RESULTS_INVALID");if(won&&(value.europaLeague!==true||value.championsLeague!==false))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");if(Object.hasOwn(value,"primePack")&&!(Number.isInteger(value.primePack)&&value.primePack>=1&&value.primePack<=4))hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");return won;}
  function hcResultKeys(value){return [...RESULT_KEYS,...(Object.hasOwn(value,EUROPA_LEAGUE)?[EUROPA_LEAGUE]:[]),...(Object.hasOwn(value,"primePack")?["primePack"]:[])];}
  function hcResult(value,teamCount){
    hcEuropaLeague(value);
    const maxPoints=(teamCount-1)*2*3;
    if(!Number.isInteger(value.leaguePosition)||value.leaguePosition<1||value.leaguePosition>teamCount||!Number.isInteger(value.leaguePoints)||value.leaguePoints<0||value.leaguePoints>maxPoints||!Number.isInteger(value.leagueGoals)||value.leagueGoals<0||value.leagueGoals>300)hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");
    for(const key of ["domesticCup","championsLeague","topScorer","topAssist"]){if(typeof value[key]!=="boolean")hcFail("HISTORY_CONVERGENCE_RESULTS_INVALID");}
    // The 7 keys in their fixed order, then europaLeague only when present (the order every normalizer writes), so the tamper rebuild matches.
    return Object.fromEntries(hcResultKeys(value).map(key=>[key,value[key]]));
  }
  function hcExpectedScore(result){
    const championsLeague=result.championsLeague?5:0,europaLeague=result.europaLeague===true?3:0,primePack=Number.isInteger(result.primePack)?result.primePack:0;
    const leagueTitle=result.leaguePosition===1?3:0;
    const domesticCup=result.domesticCup?1:0;
    const performanceBonus=result.leaguePoints>=100||result.leagueGoals>=100?1:0;
    const individualAwardsBonus=result.topScorer||result.topAssist?1:0;
    return {championsLeague,...(europaLeague?{europaLeague}:{}),...(primePack?{primePack}:{}),leagueTitle,domesticCup,performanceBonus,individualAwardsBonus,total:championsLeague+europaLeague+primePack+leagueTitle+domesticCup+performanceBonus+individualAwardsBonus};
  }
  function hcScore(value,result){
    if(!hcPlain(value))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const keys=Object.keys(value),hasTriggers=Object.hasOwn(value,"triggers"),hasEuropaLeague=Object.hasOwn(value,EUROPA_LEAGUE),hasPrimePack=Object.hasOwn(value,"primePack");
    // r87 Prime Pack: the sparse primePack breakdown key (1 to 4) sits beside the others exactly when the result carries it.
    const scoreKeys=[...SCORE_KEYS,...(hasEuropaLeague?[EUROPA_LEAGUE]:[]),...(hasPrimePack?["primePack"]:[])],allowed=hasTriggers?[...scoreKeys,"triggers"]:scoreKeys;
    if(keys.length!==allowed.length||allowed.some(key=>!Object.hasOwn(value,key)))hcFail("HISTORY_CONVERGENCE_SCORE_INVALID");
    const expected=hcExpectedScore(result);
    if(hasEuropaLeague!==Object.hasOwn(expected,EUROPA_LEAGUE)||hasPrimePack!==Object.hasOwn(expected,"primePack"))hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");
    for(const key of scoreKeys){if(value[key]!==expected[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    if(hasTriggers){
      hcExact(value.triggers,TRIGGER_KEYS,"HISTORY_CONVERGENCE_SCORE_INVALID");
      const expectedTriggers={
        hundredLeaguePoints:result.leaguePoints>=100,
        hundredLeagueGoals:result.leagueGoals>=100,
        topScorer:result.topScorer,
        topAssist:result.topAssist
      };
      for(const key of TRIGGER_KEYS){if(value.triggers[key]!==expectedTriggers[key])hcFail("HISTORY_CONVERGENCE_SCORE_MISMATCH");}
    }
    return Object.fromEntries(Object.keys(expected).map(key=>[key,value[key]]));
  }
  function hcSlots(value){
    if(!Array.isArray(value)||value.length!==2)hcFail("HISTORY_CONVERGENCE_TWO_MANAGERS_REQUIRED");
    const ordered=ROLES.map(role=>value.find(slot=>slot&&slot.slotId===role));
    if(ordered.some(slot=>!slot||!PROFILE_ID.test(String(slot.profileId||""))||!SAVE_ID.test(String(slot.saveId||""))||typeof slot.accountId!=="string"||!slot.accountId.trim()||slot.entitlementState!=="active"))hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    if(ordered[0].accountId===ordered[1].accountId||ordered[0].profileId===ordered[1].profileId)hcFail("HISTORY_CONVERGENCE_BINDING_INVALID");
    return ordered.map(slot=>({slotId:slot.slotId,accountId:slot.accountId,profileId:slot.profileId,saveId:slot.saveId}));
  }
  function hcSetup(value,rivalryId){
    if(!hcPlain(value)||value.phase!=="SHOWDOWN_CONFIRMED"||value.revision!==6||!ROLES.includes(value.coordinatorRole)||![1,3,5,10].includes(value.totalSeasons)||typeof value.leagueId!=="string"||!value.leagueId.trim()||!hcPlain(value.clubs)||typeof value.clubs.playerOne!=="string"||!value.clubs.playerOne.trim()||typeof value.clubs.playerTwo!=="string"||!value.clubs.playerTwo.trim()||value.clubs.playerOne===value.clubs.playerTwo)hcFail("HISTORY_CONVERGENCE_SETUP_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return value;
  }
  function hcCommit(value,rivalryId,seasonNumber,teamCount){
    if(!hcPlain(value)||value.ok!==true||value.committed!==true||value.phase!=="ACKNOWLEDGED"||value.revision!==3||value.resultsRevision!==2||value.seasonNumber!==seasonNumber||!HASH.test(String(value.resultsContentHash||""))||!hcPlain(value.results))hcFail("HISTORY_CONVERGENCE_COMMIT_NOT_ACKNOWLEDGED");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    return {results:{playerOne:hcResult(value.results.playerOne,teamCount),playerTwo:hcResult(value.results.playerTwo,teamCount)},resultsRevision:value.resultsRevision,resultsContentHash:value.resultsContentHash};
  }
  function hcScoring(value,rivalryId,seasonNumber,commit){
    if(!hcPlain(value)||value.ok!==true||value.authoritative!==true||value.phase!=="SCORING_RECONCILED"||value.revision!==1||value.seasonCommitRevision!==3||value.resultsRevision!==commit.resultsRevision||value.resultsContentHash!==commit.resultsContentHash||value.seasonNumber!==seasonNumber||!hcPlain(value.scoring)||!ROLES.includes(value.winner)&&value.winner!=="draw")hcFail("HISTORY_CONVERGENCE_SCORING_INVALID");
    if(value.rivalryId!==undefined&&String(value.rivalryId)!==rivalryId)hcFail("HISTORY_CONVERGENCE_RIVALRY_MISMATCH");
    const scoring={playerOne:hcScore(value.scoring.playerOne,commit.results.playerOne),playerTwo:hcScore(value.scoring.playerTwo,commit.results.playerTwo)};
    const a=scoring.playerOne.total,b=scoring.playerTwo.total;
    // r83: no tiebreak. Equal Showdown points is a draw.
    const expected=a>b?"playerOne":b>a?"playerTwo":"draw";
    // r87 Fable F7-01: a season scored before r83 could name a league-position winner on equal points. Equal points is a
    // draw, so such a winner is read as "draw" (the stored results and their hashes are untouched). A winner that
    // disagrees with unequal points is still an integrity failure, and a projection whose seasonHistory keeps the old
    // winner still fails verifyProjection (its rebuild says "draw").
    if(value.winner!==expected&&a!==b)hcFail("HISTORY_CONVERGENCE_WINNER_MISMATCH");
    return {scoring,winner:expected};
  }
  function hcManagerBase(slot,club){return {role:slot.slotId,profileId:slot.profileId,saveId:slot.saveId,club,seasons:0,seasonWins:0,seasonLosses:0,seasonDraws:0,totalPoints:0,leagueTitles:0,domesticCups:0,championsLeagues:0,europaLeagues:0,totalTrophies:0,hundredPointSeasons:0,hundredGoalSeasons:0,topScorerSeasons:0,topAssistSeasons:0,perfectSeasons:0,bestLeaguePosition:null,bestLeaguePoints:null,bestLeagueGoals:null,bestSeasonScore:null,averageSeasonScore:0,averageLeaguePoints:0,averageLeagueGoals:0,totalLeaguePoints:0,totalLeagueGoals:0};}
  function hcAccumulate(record,season,role){
    const result=season[role],score=result.scoring.total;record.seasons+=1;record.totalPoints+=score;record.totalLeaguePoints+=result.leaguePoints;record.totalLeagueGoals+=result.leagueGoals;
    if(season.winner===role)record.seasonWins+=1;else if(season.winner==="draw")record.seasonDraws+=1;else record.seasonLosses+=1;
    if(result.leaguePosition===1)record.leagueTitles+=1;if(result.domesticCup)record.domesticCups+=1;if(result.championsLeague)record.championsLeagues+=1;if(result.europaLeague===true)record.europaLeagues+=1;if(result.leaguePoints>=100)record.hundredPointSeasons+=1;if(result.leagueGoals>=100)record.hundredGoalSeasons+=1;if(result.topScorer)record.topScorerSeasons+=1;if(result.topAssist)record.topAssistSeasons+=1;if(score>=11)record.perfectSeasons+=1;
    record.bestLeaguePosition=record.bestLeaguePosition===null?result.leaguePosition:Math.min(record.bestLeaguePosition,result.leaguePosition);record.bestLeaguePoints=record.bestLeaguePoints===null?result.leaguePoints:Math.max(record.bestLeaguePoints,result.leaguePoints);record.bestLeagueGoals=record.bestLeagueGoals===null?result.leagueGoals:Math.max(record.bestLeagueGoals,result.leagueGoals);record.bestSeasonScore=record.bestSeasonScore===null?score:Math.max(record.bestSeasonScore,score);
  }
  function hcFinalize(record){record.totalTrophies=record.leagueTitles+record.domesticCups+record.championsLeagues+record.europaLeagues;record.averageSeasonScore=record.seasons?record.totalPoints/record.seasons:0;record.averageLeaguePoints=record.seasons?record.totalLeaguePoints/record.seasons:0;record.averageLeagueGoals=record.seasons?record.totalLeagueGoals/record.seasons:0;return record;}
  function hcBuild({rivalryId,setup,managerSlots,seasons}={}){
    const id=hcRivalry(rivalryId),finalSetup=hcSetup(setup,id),teamCount=hcTeamCount(finalSetup.leagueId),slots=hcSlots(managerSlots);
    if(!Array.isArray(seasons)||seasons.length<1||seasons.length>finalSetup.totalSeasons)hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
    const history=[];
    for(let index=0;index<seasons.length;index+=1){
      const seasonNumber=index+1,source=seasons[index];if(!hcPlain(source))hcFail("HISTORY_CONVERGENCE_SEASONS_INVALID");
      const commit=hcCommit(source.commit,id,seasonNumber,teamCount),canonical=hcScoring(source.scoring,id,seasonNumber,commit);
      history.push({roundNumber:seasonNumber,acceptedResultRevision:commit.resultsRevision,acceptedResultContentHash:commit.resultsContentHash,seasonCommitRevision:3,canonicalScoringRevision:1,playerOne:{...commit.results.playerOne,scoring:canonical.scoring.playerOne},playerTwo:{...commit.results.playerTwo,scoring:canonical.scoring.playerTwo},winner:canonical.winner});
    }
    const managerRecords={playerOne:hcManagerBase(slots[0],finalSetup.clubs.playerOne),playerTwo:hcManagerBase(slots[1],finalSetup.clubs.playerTwo)};
    for(const season of history){for(const role of ROLES)hcAccumulate(managerRecords[role],season,role);}
    for(const role of ROLES)hcFinalize(managerRecords[role]);
    const trophyAttribution={playerOne:{profileId:managerRecords.playerOne.profileId,leagueTitles:managerRecords.playerOne.leagueTitles,domesticCups:managerRecords.playerOne.domesticCups,championsLeagues:managerRecords.playerOne.championsLeagues,europaLeagues:managerRecords.playerOne.europaLeagues,totalTrophies:managerRecords.playerOne.totalTrophies},playerTwo:{profileId:managerRecords.playerTwo.profileId,leagueTitles:managerRecords.playerTwo.leagueTitles,domesticCups:managerRecords.playerTwo.domesticCups,championsLeagues:managerRecords.playerTwo.championsLeagues,europaLeagues:managerRecords.playerTwo.europaLeagues,totalTrophies:managerRecords.playerTwo.totalTrophies}};
    const acceptedRevisionKey=history.map(item=>`${item.roundNumber}:${item.acceptedResultRevision}:${item.acceptedResultContentHash}`).join("|");
    return hcFreeze({schemaVersion:1,runtimeRevision:RUNTIME_REVISION,phase:"HISTORY_CONVERGED",revision:1,rivalryId:id,setupRevision:6,leagueId:finalSetup.leagueId,totalSeasons:finalSetup.totalSeasons,acceptedSeasons:history.length,acceptedRevisionKey,managerSlots:slots,seasonHistory:history,managerRecords,trophyAttribution,canonicalStorageMutation:false,providerWriteRequired:false});
  }
  function hcVerify(projection){
    if(!hcPlain(projection)||projection.schemaVersion!==1||projection.runtimeRevision!==RUNTIME_REVISION||projection.phase!=="HISTORY_CONVERGED"||projection.revision!==1||projection.canonicalStorageMutation!==false||projection.providerWriteRequired!==false)hcFail("HISTORY_CONVERGENCE_PROJECTION_INVALID");
    const rebuilt=hcBuild({rivalryId:projection.rivalryId,setup:{phase:"SHOWDOWN_CONFIRMED",revision:6,coordinatorRole:"playerOne",totalSeasons:projection.totalSeasons,leagueId:projection.leagueId,clubs:{playerOne:projection.managerRecords?.playerOne?.club,playerTwo:projection.managerRecords?.playerTwo?.club}},managerSlots:projection.managerSlots.map(slot=>({...slot,entitlementState:"active"})),seasons:projection.seasonHistory.map(season=>({commit:{ok:true,committed:true,phase:"ACKNOWLEDGED",revision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,results:{playerOne:Object.fromEntries(hcResultKeys(season.playerOne).map(key=>[key,season.playerOne[key]])),playerTwo:Object.fromEntries(hcResultKeys(season.playerTwo).map(key=>[key,season.playerTwo[key]]))}},scoring:{ok:true,authoritative:true,phase:"SCORING_RECONCILED",revision:1,seasonCommitRevision:3,resultsRevision:season.acceptedResultRevision,resultsContentHash:season.acceptedResultContentHash,seasonNumber:season.roundNumber,scoring:{playerOne:season.playerOne.scoring,playerTwo:season.playerTwo.scoring},winner:season.winner}}))});
    if(JSON.stringify(rebuilt)!==JSON.stringify(projection))hcFail("HISTORY_CONVERGENCE_PROJECTION_TAMPERED");return projection;
  }

  return Object.freeze({contractVersion:1,feature:"ssjr-shared-history-convergence",runtimeRevision:RUNTIME_REVISION,buildProjection:hcBuild,verifyProjection:hcVerify,canonicalStorageMutation:false,providerWriteRequired:false,requiresCanonicalScoring:true,exactSeasonAddressing:true,identitySafe:true});
});
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


## FILE: firestore.season-commit-production.fragment.rules
```
// SSJR_SEASON_COMMIT_FUNCTIONS_BEGIN
    function ssjrCommitValidOperationId(value) { return value is string && value.matches('^season_commit_op_[0-9a-f]{32}$'); }
    function ssjrCommitValidHash(value) { return value is string && value.matches('^sha256:[0-9a-f]{64}$'); }
    function ssjrCommitValidRole(value) { return value == 'playerOne' || value == 'playerTwo'; }
    function ssjrCommitSeasonMatches(seasonId, seasonNumber) {
      return seasonNumber is int
        && seasonNumber >= 1
        && seasonNumber <= 10
        && seasonId == 'season_' + string(seasonNumber);
    }
    function ssjrCommitSetup(rivalryId) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
    }
    function ssjrCommitPublicResults(rivalryId, seasonId) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)).data;
    }
    function ssjrCommitPrivateResult(rivalryId, seasonId, managerRole) {
      return get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonResults/$(seasonId)/roles/$(managerRole)).data;
    }
    // r80 Europa League: 'europaLeague' is present only when that manager won the EL, and then it is exactly true
    // (false is refused, so there is one encoding per fact and old 7-key results are unchanged). One manager's season
    // never has CL and EL both true. Nothing compares the two managers' results: both may win the same trophy.
    function ssjrCommitResultShape(value, teamCount) {
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
    function ssjrCommitExactKeys(root) {
      return root.keys().hasOnly([
        'schemaVersion','objectType','rivalryId','seasonNumber','runtimeRevision','phase','revision','resultsRevision','results',
        'acknowledgedRoles','operationIds','operationHashes','baseRevisions','actorRoles','activeSessionId','updatedAt','updatedByDeviceId'
      ]);
    }
    // Audit R84 F02 (r85): create and acknowledge both require the shared actor write authority (rivalry live and active
    // with the actor as a member, the named Session in this rivalry, state 'active' with both members, the acting account
    // active, the acting device registered to that account and active). It replaces ssjrEntitled here (same rivalry
    // document) to stay under the 1,000-expression ceiling. A Session still 'active' past its old expiresAt stays allowed:
    // ten-season play keeps one ACTIVE Session. The never-called ssjrCommitShape and its three helpers were removed.
    function ssjrCommitValidCreate(rivalryId, seasonId) {
      let after = request.resource.data;
      let setup = ssjrCommitSetup(rivalryId);
      let public = ssjrCommitPublicResults(rivalryId, seasonId);
      let p1 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerOne');
      let p2 = ssjrCommitPrivateResult(rivalryId, seasonId, 'playerTwo');
      let role = ssjrActorRole(rivalryId);
      return ssjrCommitExactKeys(after)
        && after.schemaVersion == 1
        && after.objectType == 'sharedSeasonCommit'
        && after.rivalryId == rivalryId
        && after.seasonNumber is int
        && ssjrCommitSeasonMatches(seasonId, after.seasonNumber)
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && after.seasonNumber <= setup.totalSeasons
        && public.schemaVersion == 1
        && public.objectType == 'sharedSeasonResults'
        && public.rivalryId == rivalryId
        && public.seasonNumber == after.seasonNumber
        && public.runtimeRevision == '1.9.1-r9'
        && public.phase == 'RESULTS_READY'
        && public.revision == 2
        && public.teamCount in [18,20]
        && after.runtimeRevision == '1.9.1-r10'
        && after.revision == 1
        && after.phase == 'COMMITTED'
        && after.resultsRevision == 2
        && after.results is map
        && after.results.keys().hasOnly(['playerOne','playerTwo'])
        && ssjrCommitResultShape(after.results.playerOne, public.teamCount)
        && ssjrCommitResultShape(after.results.playerTwo, public.teamCount)
        && after.results.playerOne == p1.result
        && after.results.playerTwo == p2.result
        && after.acknowledgedRoles is list
        && after.acknowledgedRoles.size() == 0
        && after.operationIds is list
        && after.operationIds.size() == 1
        && after.operationHashes is list
        && after.operationHashes.size() == 1
        && after.baseRevisions is list
        && after.baseRevisions.size() == 1
        && after.actorRoles is list
        && after.actorRoles.size() == 1
        && ssjrCommitValidOperationId(after.operationIds[0])
        && ssjrCommitValidHash(after.operationHashes[0])
        && after.baseRevisions[0] == 0
        && role == setup.coordinatorRole
        && after.actorRoles[0] == role
        && after.updatedAt == request.time
        && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
    function ssjrCommitPrefixPreserved(before, after) {
      let i = before.revision;
      return after.operationIds == before.operationIds.concat([after.operationIds[i]])
        && after.operationHashes == before.operationHashes.concat([after.operationHashes[i]])
        && after.baseRevisions == before.baseRevisions.concat([after.baseRevisions[i]])
        && after.actorRoles == before.actorRoles.concat([after.actorRoles[i]])
        && after.acknowledgedRoles == before.acknowledgedRoles.concat([after.acknowledgedRoles[i - 1]]);
    }
    function ssjrCommitValidUpdate(rivalryId, seasonId) {
      let before = resource.data;
      let after = request.resource.data;
      let role = ssjrActorRole(rivalryId);
      let i = before.revision;
      return ssjrCommitExactKeys(after)
        && before.schemaVersion == 1
        && before.objectType == 'sharedSeasonCommit'
        && before.rivalryId == rivalryId
        && before.runtimeRevision == '1.9.1-r10'
        && before.phase == 'COMMITTED'
        && before.revision >= 1
        && before.revision <= 2
        && after.schemaVersion == 1
        && after.objectType == 'sharedSeasonCommit'
        && after.rivalryId == rivalryId
        && after.runtimeRevision == '1.9.1-r10'
        && after.seasonNumber == before.seasonNumber
        && ssjrCommitSeasonMatches(seasonId, after.seasonNumber)
        && after.resultsRevision == before.resultsRevision
        && after.results == before.results
        && after.revision == before.revision + 1
        && ((after.revision < 3 && after.phase == 'COMMITTED') || (after.revision == 3 && after.phase == 'ACKNOWLEDGED'))
        && after.operationIds is list
        && after.operationIds.size() == after.revision
        && after.operationHashes is list
        && after.operationHashes.size() == after.revision
        && after.baseRevisions is list
        && after.baseRevisions.size() == after.revision
        && after.actorRoles is list
        && after.actorRoles.size() == after.revision
        && after.acknowledgedRoles is list
        && after.acknowledgedRoles.size() == after.revision - 1
        && ssjrCommitPrefixPreserved(before, after)
        && !(role in before.acknowledgedRoles)
        && ssjrCommitValidOperationId(after.operationIds[i])
        && after.operationIds[i] != before.operationIds[0]
        && (i < 2 || after.operationIds[i] != before.operationIds[1])
        && ssjrCommitValidHash(after.operationHashes[i])
        && after.baseRevisions[i] == before.revision
        && after.actorRoles[i] == role
        && after.acknowledgedRoles[i - 1] == role
        && after.acknowledgedRoles.toSet().size() == after.acknowledgedRoles.size()
        && after.acknowledgedRoles.toSet().hasOnly(['playerOne','playerTwo'])
        && after.updatedAt == request.time
        && ssjrActorWriteAuthorityValid(rivalryId, after.updatedByDeviceId, after.activeSessionId);
    }
    // R87 shared reads meter (B2): each phone keeps ONE small document per rivalry, rivalries/{rid}/meters/{its role}, with the
    // Firebase reads it was billed today (documents + Rules lookups), written once a season when it sees the season commit
    // ACKNOWLEDGED; the partner phone reads it once, so both phones show the same "both phones" total and seasons left.
    // Members of the live paired rivalry only (one lookup: the rivalry, the same as every shared read), each phone writes only
    // its own role's document, exact keys, bounded whole numbers (at most three season costs), no list and no delete.
    // A phone on an older build never writes it; nothing else reads it.
    function ssjrMeterCount(value, max) { return value is int && value >= 0 && value <= max; }
    function ssjrMeterCost(costs, index) { return costs.size() <= index || (costs[index] is int && costs[index] > 0 && costs[index] <= 100000); }
    function ssjrMeterValidWrite(rivalryId, managerRole) {
      let meter = request.resource.data;
      return ssjrEntitled(rivalryId)
        && managerRole in ['playerOne', 'playerTwo']
        && ssjrRivalryData(rivalryId).managerSlots[managerRole == 'playerOne' ? 0 : 1].accountId == request.auth.uid
        && meter.keys().hasAll(['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'])
        && meter.keys().hasOnly(['schemaVersion','objectType','rivalryId','role','day','season','game','career','costs','updatedAt'])
        && meter.schemaVersion == 1
        && meter.objectType == 'readsMeter'
        && meter.rivalryId == rivalryId
        && meter.role == managerRole
        && meter.day is string
        && meter.day.matches('^20[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')
        && meter.season is int
        && meter.season >= 1
        && meter.season <= 10
        && ssjrMeterCount(meter.game, 1000000)
        && ssjrMeterCount(meter.career, 1000000)
        && meter.costs is list
        && meter.costs.size() <= 3
        && ssjrMeterCost(meter.costs, 0)
        && ssjrMeterCost(meter.costs, 1)
        && ssjrMeterCost(meter.costs, 2)
        && meter.updatedAt == request.time;
    }
// SSJR_SEASON_COMMIT_FUNCTIONS_END

// SSJR_SEASON_COMMIT_MATCH_BEGIN
      match /seasonCommits/{seasonId} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create: if ssjrCommitValidCreate(rivalryId, seasonId);
        allow update: if ssjrCommitValidUpdate(rivalryId, seasonId);
      }
      match /meters/{managerRole} {
        allow get: if ssjrEntitled(rivalryId);
        allow list, delete: if false;
        allow create, update: if ssjrMeterValidWrite(rivalryId, managerRole);
      }
// SSJR_SEASON_COMMIT_MATCH_END

```


## FILE: firestore.terminal-close-production.fragment.rules
```
// SSJR_TERMINAL_CLOSE_FUNCTIONS_BEGIN
    function ssjrTerminalValidWinner(intent) {
      return (intent.managerTotals.playerOne > intent.managerTotals.playerTwo && intent.winner == 'playerOne')
        || (intent.managerTotals.playerTwo > intent.managerTotals.playerOne && intent.winner == 'playerTwo')
        || (intent.managerTotals.playerOne == intent.managerTotals.playerTwo && intent.winner == 'draw');
    }
    function ssjrTerminalValidIntent(rivalryId, intent) {
      return intent is map
        && intent.keys().hasOnly([
          'schemaVersion','runtimeRevision','phase','rivalryId','sessionId','totalSeasons','completedSeason',
          'managerTotals','winner','terminal','finalSeasonReconciled','nextSeason','extraSeasonAllowed',
          'rivalryConnectionState','sessionTargetState','terminalReadAllowed','canonicalStorageMutation','providerWriteRequired',
          'listPermissionRequired','billingRequired'
        ])
        && intent.schemaVersion == 1
        && intent.runtimeRevision == '1.9.1-r18'
        && intent.phase == 'TERMINAL_CLOSE_READY'
        && intent.rivalryId == rivalryId
        && validSessionId(intent.sessionId)
        && intent.totalSeasons in [1,3,5,10]
        && intent.completedSeason == intent.totalSeasons
        && intent.managerTotals is map
        && intent.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
        && intent.managerTotals.playerOne is int
        && intent.managerTotals.playerOne >= 0
        && intent.managerTotals.playerTwo is int
        && intent.managerTotals.playerTwo >= 0
        && ssjrTerminalValidWinner(intent)
        && intent.terminal == true
        && intent.finalSeasonReconciled == true
        && intent.nextSeason == null
        && intent.extraSeasonAllowed == false
        && intent.rivalryConnectionState == 'closed'
        && intent.sessionTargetState == 'closed'
        && intent.terminalReadAllowed == true
        && intent.canonicalStorageMutation == false
        && intent.providerWriteRequired == true
        && intent.listPermissionRequired == false
        && intent.billingRequired == false;
    }
    // Canonical season score: CL +5, EL +3 (r80; the key exists only when won), league title +3, cup +1,
    // 100 points or 100 goals +1, top scorer or top assist +1, Prime Pack 4, 3, 2 or 1 (the key exists only when won). A season is at most 15.
    function ssjrTerminalScore(result) {
      return (result.championsLeague == true ? 5 : 0)
        + (result.get('europaLeague', false) == true ? 3 : 0)
        + result.get('primePack', 0)
        + (result.leaguePosition == 1 ? 3 : 0)
        + (result.domesticCup == true ? 1 : 0)
        + ((result.leaguePoints >= 100 || result.leagueGoals >= 100) ? 1 : 0)
        + ((result.topScorer == true || result.topAssist == true) ? 1 : 0);
    }
    function ssjrTerminalCommitAccepted(root, rivalryId, seasonNumber) {
      return root is map
        && root.schemaVersion == 1
        && root.objectType == 'sharedSeasonCommit'
        && root.rivalryId == rivalryId
        && root.seasonNumber == seasonNumber
        && root.runtimeRevision == '1.9.1-r10'
        && root.phase == 'ACKNOWLEDGED'
        && root.revision == 3
        && root.results is map
        && root.results.keys().hasOnly(['playerOne','playerTwo'])
        && root.results.playerOne is map
        && root.results.playerTwo is map;
    }
    function ssjrTerminalSeasonId(seasonNumber) {
      return 'season_' + string(seasonNumber);
    }
    function ssjrTerminalProgressShape(progress) {
      return progress is map
        && progress.keys().hasOnly(['schemaVersion','runtimeRevision','totalSeasons','acceptedThroughSeason','managerTotals','closedSessionRevision'])
        && progress.schemaVersion == 1
        && progress.runtimeRevision == '1.9.1-r18'
        && progress.totalSeasons in [1,3,5,10]
        && progress.acceptedThroughSeason is int
        && progress.acceptedThroughSeason >= 1
        && progress.acceptedThroughSeason <= progress.totalSeasons
        && progress.managerTotals is map
        && progress.managerTotals.keys().hasOnly(['playerOne','playerTwo'])
        && progress.managerTotals.playerOne is int
        && progress.managerTotals.playerOne >= 0
        && progress.managerTotals.playerOne <= progress.acceptedThroughSeason * 15
        && progress.managerTotals.playerTwo is int
        && progress.managerTotals.playerTwo >= 0
        && progress.managerTotals.playerTwo <= progress.acceptedThroughSeason * 15
        && (progress.closedSessionRevision == null || (progress.closedSessionRevision is int && progress.closedSessionRevision >= 1));
    }
    function ssjrTerminalBaseRivalryPreserved(before, after) {
      return after.data.connectionStateBeforeDeletion == before.data.connectionStateBeforeDeletion
        && after.data.managerSlots == before.data.managerSlots
        && after.data.authorizedAccountIds == before.data.authorizedAccountIds
        && after.data.createdByAccountId == before.data.createdByAccountId
        && after.data.createdAt == before.data.createdAt;
    }
    function ssjrTerminalProgressActorValid(before, after) {
      return signedIn()
        && activeDevice(after.updatedByDeviceId)
        && after.updatedByAccountId == request.auth.uid
        && before.data.authorizedAccountIds is list
        && before.data.authorizedAccountIds.size() == 2
        && before.data.authorizedAccountIds[0] != before.data.authorizedAccountIds[1]
        && request.auth.uid in before.data.authorizedAccountIds;
    }
    function ssjrTerminalInitialProgress(rivalryId, before, after) {
      let progress = after.data.terminalProgress;
      let setup = get(/databases/$(database)/documents/rivalries/$(rivalryId)/sharedSetup/authoritative).data;
      let commit = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/season_1).data;
      return ssjrTerminalProgressShape(progress)
        && progress.acceptedThroughSeason == 1
        && progress.closedSessionRevision == null
        && setup.schemaVersion == 1
        && setup.objectType == 'sharedSetupLedger'
        && setup.rivalryId == rivalryId
        && setup.revision == 6
        && setup.phase == 'SHOWDOWN_CONFIRMED'
        && setup.totalSeasons == progress.totalSeasons
        && ssjrTerminalCommitAccepted(commit, rivalryId, 1)
        && progress.managerTotals.playerOne == ssjrTerminalScore(commit.results.playerOne)
        && progress.managerTotals.playerTwo == ssjrTerminalScore(commit.results.playerTwo);
    }
    function ssjrTerminalAdvanceProgress(rivalryId, before, after) {
      let prior = before.data.terminalProgress;
      let progress = after.data.terminalProgress;
      let nextSeason = prior.acceptedThroughSeason + 1;
      let seasonId = ssjrTerminalSeasonId(nextSeason);
      let commit = get(/databases/$(database)/documents/rivalries/$(rivalryId)/seasonCommits/$(seasonId)).data;
      return ssjrTerminalProgressShape(prior)
        && ssjrTerminalProgressShape(progress)
        && prior.closedSessionRevision == null
        && progress.closedSessionRevision == null
        && progress.totalSeasons == prior.totalSeasons
        && nextSeason <= prior.totalSeasons
        && progress.acceptedThroughSeason == nextSeason
        && ssjrTerminalCommitAccepted(commit, rivalryId, nextSeason)
        && progress.managerTotals.playerOne == prior.managerTotals.playerOne + ssjrTerminalScore(commit.results.playerOne)
        && progress.managerTotals.playerTwo == prior.managerTotals.playerTwo + ssjrTerminalScore(commit.results.playerTwo);
    }
    // Stale-write gate (both managers save the same Terminal Close step at once). After the cheap checks that every
    // other write path already fails on, the CAS revision step is the condition of a ternary: a write built on a
    // revision the document already left is refused right there, and an evaluation pass that cannot read the stored
    // document stops there too instead of running the whole check into the 1,000-expression limit. The step stays
    // required inside ssjrTerminalFinalEnvelopeCas, so no outcome changes; only the refusal comes sooner.
    function ssjrTerminalValidProgressUpdate(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      return rivalryId.matches('^pair_[0-9a-f]{64}$')
        && before.data.connectionState == 'active'
        && after.data.connectionState == 'active'
        && ((after.revision == before.revision + 1) ? (ssjrTerminalFinalEnvelopeCas(before, after, 'rivalry', rivalryId)
        && after.data.diff(before.data).affectedKeys().hasOnly(['terminalProgress'])
        && ssjrTerminalProgressActorValid(before, after)
        && (
          (!('terminalProgress' in before.data) && ssjrTerminalInitialProgress(rivalryId, before, after))
          || ('terminalProgress' in before.data && ssjrTerminalAdvanceProgress(rivalryId, before, after))
        )) : false);
    }
    function ssjrTerminalFinalEnvelopeCas(before, after, objectType, objectId) {
      return before.objectType == objectType
        && before.objectId == objectId
        && before.lifecycleState == 'live'
        && after.schemaVersion == before.schemaVersion
        && after.objectType == objectType
        && after.objectId == objectId
        && after.lifecycleState == 'live'
        && after.revision == before.revision + 1
        && after.parentRevision == before.revision
        && after.priorContentHash == before.contentHash
        && validHash(after.contentHash)
        && after.tombstone == null
        && after.diff(before).affectedKeys().hasOnly([
          'revision','parentRevision','contentHash','priorContentHash','updatedAt','updatedByAccountId','updatedByDeviceId','data'
        ]);
    }
    function ssjrTerminalParentCloseRequested(rivalryId, sessionId) {
      let parentAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      return parentAfter.data.connectionState == 'closed'
        && parentAfter.data.terminalClose.runtimeRevision == '1.9.1-r18'
        && parentAfter.data.terminalClose.sessionId == sessionId;
    }
    function ssjrTerminalValidAtomicSessionClose(rivalryId, sessionId) {
      let before = resource.data;
      let after = request.resource.data;
      let parentBefore = get(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      let parentAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)).data;
      return after.data.state == 'closed'
        && ssjrTerminalParentCloseRequested(rivalryId, sessionId)
        && ((after.revision == before.revision + 1) ? (signedIn()
        && validSessionId(sessionId)
        && before.data.rivalryId == rivalryId
        && before.data.state == 'active'
        && request.auth.uid in before.data.memberAccountIds
        && ssjrTerminalFinalEnvelopeCas(before, after, 'session', sessionId)
        && after.updatedByAccountId == request.auth.uid
        && after.data.diff(before.data).affectedKeys().hasOnly(['state','lastActivityAt'])
        && after.data.state == 'closed'
        && after.data.lastActivityAt == after.updatedAt
        && freshSessionActivity(after.data.lastActivityAt)
        && parentBefore.data.connectionState == 'active'
        && parentAfter.data.connectionState == 'closed'
        && parentAfter.data.terminalClose.sessionId == sessionId
        && parentAfter.data.terminalProgress.closedSessionRevision == after.revision
        && parentAfter.updatedByAccountId == request.auth.uid
        && parentAfter.updatedByDeviceId == after.updatedByDeviceId) : false);
    }
    function ssjrTerminalValidCloseUpdate(rivalryId) {
      let before = resource.data;
      let after = request.resource.data;
      let priorProgress = before.data.terminalProgress;
      let progress = after.data.terminalProgress;
      let intent = after.data.terminalClose;
      let sessionAfter = getAfter(/databases/$(database)/documents/rivalries/$(rivalryId)/sessions/$(intent.sessionId)).data;
      return rivalryId.matches('^pair_[0-9a-f]{64}$')
        && signedIn()
        && before.data.connectionState == 'active'
        && after.data.connectionState == 'closed'
        && ((after.revision == before.revision + 1) ? (ssjrTerminalFinalEnvelopeCas(before, after, 'rivalry', rivalryId)
        && after.data.diff(before.data).affectedKeys().hasOnly(['connectionState','terminalProgress','terminalClose'])
        && before.data.authorizedAccountIds is list
        && before.data.authorizedAccountIds.size() == 2
        && before.data.authorizedAccountIds[0] != before.data.authorizedAccountIds[1]
        && request.auth.uid in before.data.authorizedAccountIds
        && activeDevice(after.updatedByDeviceId)
        && after.updatedByAccountId == request.auth.uid
        && priorProgress.runtimeRevision == '1.9.1-r18'
        && priorProgress.acceptedThroughSeason == priorProgress.totalSeasons
        && priorProgress.closedSessionRevision == null
        && progress.diff(priorProgress).affectedKeys().hasOnly(['closedSessionRevision'])
        && progress.closedSessionRevision is int
        && progress.closedSessionRevision == sessionAfter.revision
        && ssjrTerminalValidIntent(rivalryId, intent)
        && intent.totalSeasons == priorProgress.totalSeasons
        && intent.managerTotals == priorProgress.managerTotals
        && sessionAfter.objectType == 'session'
        && sessionAfter.objectId == intent.sessionId
        && sessionAfter.data.rivalryId == rivalryId
        && sessionAfter.data.state == 'closed'
        && sessionAfter.updatedByAccountId == request.auth.uid
        && sessionAfter.updatedByDeviceId == after.updatedByDeviceId) : false);
    }
    function ssjrTerminalValidRivalryUpdate(rivalryId) {
      return (request.resource.data.data.connectionState == 'active' && ssjrTerminalValidProgressUpdate(rivalryId))
        || (request.resource.data.data.connectionState == 'closed' && ssjrTerminalValidCloseUpdate(rivalryId));
    }
// SSJR_TERMINAL_CLOSE_FUNCTIONS_END
```
