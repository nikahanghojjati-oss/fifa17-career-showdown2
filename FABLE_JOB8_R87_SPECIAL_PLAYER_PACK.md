# Fable job 8: r87 Special Player pack hunt (Career Mode Showdown 2.0.0)

Code snapshot: gameplay/r87 @ 55a7a96f1, repo nikahanghojjati-oss/fifa17-career-showdown2. The full source of every file on this screen's path is below this brief. Static crest art and the two long data lines are excerpted; each cut is marked with a BUNDLE NOTE. You cannot run code here, so reason carefully and show your trace.

## The product
Career Mode Showdown is a private web app where two managers compete in FIFA 17 Career Mode. It is vanilla JS, runs on Firebase Firestore (free Spark plan) and is served from GitHub Pages. Daniel (playerOne) starts each Showdown and Nik (playerTwo) joins it, each on his own phone or laptop. A Showdown lasts 1, 3, 5 or 10 seasons. Firestore reads are the scarce resource.

## The screen you own: the Special Player pack
In season 1, after Club Assignment and before Career Start, each manager watches a full-screen 3D "pack opening". Both Special Players come out of the pack, Daniel's first and then Nik's. Each card rises and shows the player's card face with tier colours, stats, original club crest and a scouting note. A CONTINUE button then opens Career Start.

How it fits together:
1. **The draw** (js/marqueePlayer.js) is read from the Showdown's 64-hex Firebase id. It needs no read and no write, both phones get the same pair, and the two players are never the same. Only a Showdown confirmed at or after MARQUEE_FROM_MS has Special Players.
2. **Career Start** (js/productionSharedCareerStart.js, `pcstOpenPanel` → `pcstSpecialPlayerFirst`) calls `CareerModeSpecialPlayerReveal.runBeforeCareerStart`. The reveal runs outside the 25 s Career Start timeout. Its stage stays up until Career Start or the Transfer Challenge is up underneath it (`pcstCloseReveal`).
3. **The host** (js/specialPlayerReveal.js) decides whether this manager should see the reveal on this browser (seen list in localStorage). It shows the app loading screen, mounts a full-screen iframe stage (`?embed=1&d=<index>&n=<index>`) and waits for `cms-sp-ready`. It keeps the loading screen at least 1 s and at most 15 s. It then shows the stage, posts `cms-sp-start`, marks seen and waits for `cms-sp-continue` or `cms-sp-error`. A page that fails before it starts is skipped (not marked seen) and Career Start opens as before.
4. **The page** (visual-assets/v10_1/special-player/index.html) is three.js r128 (vendor file, shell-cached, not included). It loads fonts, textures, crests, pack and card art, draws one frame, posts `cms-sp-ready`, starts its animation loop on `cms-sp-start`, and posts `cms-sp-continue` from its CONTINUE button. It also has optional sound (WebAudio, unlocked on first pointerdown) and a preview mode (`?tools=1`) that is not used in the game.
5. **The SP chip** (js/specialPlayerChip.js) is the small tiered badge the other screens use (Career Start, Season Results, Final Winner, Gazette, Rule Book, career screens). Include it in the hunt where it meets this screen: Career Start shows both chips right after the reveal.
6. **The service worker** caches the page, its assets and three.js in the shell so the reveal can play offline (red team R87-SP-03). A frame load is a navigation (see its comment).

Checked by script before this bundle was built (do not re-check):
- The page's MP_LIST is row for row identical to data/marqueePlayers.js (305 rows).
- Every MP_LIST row has a SCOUT entry.
- No duplicate names.
- Every asset path the page names exists in visual-assets/v10_1/special-player/assets/.

## House rules (a break is a bug)
- Always "Special Player" or "SP" on screen, never Marquee or MP. Internal names (marqueePlayer.js, MP_LIST) are fine.
- One random player each from the FIFA 17 top 300 by potential, after Club Assignment. Both phones show the same two players. Never the same player twice in one Showdown.
- The look is a white burst, the SP chip and tiered colours: top 3 black-blue-gold, top 10 blue-gold, top 20 gold, top 50 silver, the rest bronze. Career Start shows each player's original club.
- The Special Player is never on any squad or roulette board.
- **Reus Gate:** the loading screen stays until the next screen is ready. Never dim. Nothing covers anything at any size (phone upright and sideways, tablet, desktop). No flash of an old design or a blank or black frame between steps.
- The reveal shows once per manager per Showdown, and never over a live game after season 1. A rematch is a new Showdown, so it gets a new pair and a new reveal.
- A broken reveal must never block the game. On any failure, Career Start opens.

## Threat model
Normal play only. That covers two honest players, reloads at every step, and iPhone Safari evicting a locked page. It covers offline/online, slow networks and two tabs. It covers a service-worker upgrade with one phone a build behind. It covers low-end phones: WebGL context loss, texture memory limits and devicePixelRatio 3. It covers browsers that block autoplay or WebAudio, and old Showdowns confirmed before r86. Anything that needs a modified app, the console or direct database writes is out of scope.

## Already fixed: verify they still hold, do not re-report as new
- R87-SP-02: a typed Transfer War signing that is your own Special Player is caught (`isOwnSpecial`).
- R87-SP-03: a page that never started is not marked seen, and three.js is shell-cached.
- Codex P2 on #1035: an error after ready ends the Continue wait.
- Red team #1 (r86): seen is kept as soon as the reveal is shown, so a reload does not replay it over the live game.
- #1132 / W3-5: the reveal shows again in a rematch.
- A-04: the deeper bronze tier gives chip text 4.5:1 contrast.
- F2-16: the Gazette loads the chip with its files.

## Do not report
- Player data accuracy against the real FIFA 17 database.
- Crest artwork, and whether a crest looks like the real one.
- Taste notes on the animation look (Team V owns the design). An animation that stutters, freezes, jumps, flashes, overlaps text or never ends IS in scope.
- The MARQUEE_FROM_MS date.

## Your job
Work as the senior engineer who owns "the Special Player pack never gets stuck and never lies". Read every file in full.

Walk these cases from both phones and ask at each step what happens if this phone reloads, locks, goes offline, is a step ahead or behind, or opens in a second tab:
- a new 10-season Showdown, season 1, on Daniel's phone and on Nik's;
- the same Showdown re-entered from Home (CONTINUE CAREER) before and after Career Start is READY;
- a rematch;
- a Showdown confirmed before r86;
- a 1-season Showdown.

Then hunt in five areas.

**1. Stuck or blank screens.** Find every way to end on the loading screen forever, a black or empty stage, a stage with no CONTINUE, a CONTINUE that does nothing, or a stage left over Career Start, the Transfer Challenge or Home. Trace every promise in `spRun`, `runBeforeCareerStart`, `pcstOpenPanel` and `pcstCloseReveal`. Check whether each one can stay pending, and what the `running` and `openPromise` guards do then.

**2. Messaging.** Cover message ordering and races: `cms-sp-ready` arriving before `spListen` attaches, `cms-sp-start` lost or sent twice, and a frame `load` event firing before the scripts finish. Cover the frame reloading itself (the service worker, or a bfcache restore) and an origin mismatch (optionalAssetUrl, a GitHub Pages subpath). Check that every listener is removed and every timer is cleared.

**3. Animation and engine.** Cover the requestAnimationFrame loop, timing (`tick`, `vtt`, phase changes, `manual`), and a hidden tab or locked phone mid-animation (does time jump, skip the reveal or freeze?). Cover resize and orientation change mid-animation, WebGL context loss, texture load failures (which ones resolve and which reject), and fonts that never load. Cover memory: textures, geometries and canvases never disposed, the loop still running after CONTINUE, the stage removed while its frame is still animating, and audio contexts left open. Cover sound: autoplay blocked, the speaker toggle and unlock-on-pointerdown.

**4. Truth.** Check that the card shown is the player the draw picks for each role (index passing, `d`/`n` order, clamping in `mpByIdx`, `listVersion`). Check the right tier per rank at the boundaries 3/4, 10/11, 20/21 and 50/51 in the page (`RANKTIER`) and in the chip, and that the club, crest, stats and scouting text belong to that row. Check that both phones agree, and that the chip on Career Start and later screens agrees with the reveal. Report any visible "Marquee" or "MP" text.

**5. Seen-state.** Cover the seen list: key format, the 40 cap with many Showdowns, storage blocked or full (Safari private mode), two tabs, and a reveal skipped after an error. Check that it never shows twice over a live game and never goes missing when it should show.

Report every way a player can:
- get stuck;
- see a blank, black or covered screen;
- see a wrong or different player from the other phone;
- see the reveal twice or never;
- leak memory or CPU into later screens;
- waste reads (there should be none);
- hit a crash on honest input.

For each finding give:
- ID (F8-NN) and severity: P0 stuck or blocks the game; P1 wrong player, wrong screen or broken animation a player will hit; P2 rare; P3 polish;
- file:line, quoting the code so it can be found by text;
- exact steps on the device(s);
- expected vs actual;
- your trace through the code;
- the smallest fix as a diff.

Put anything you are not sure of in a separate "suspected" list. No style notes. End with the top 5 to fix first.

Keep the visible reply under about 50,000 characters.


## FILE: js/specialPlayerReveal.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSpecialPlayerReveal=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 Special Player reveal (Nik 2026-10-27, look = Team V HO-035): after Club Assignment, before Career Start, each
  // manager watches both Special Players come out of a pack, on Team V's page in a full-screen frame. The draw is
  // js/marqueePlayer.js (no read, no write). The loading screen stays up until the page has drawn its first frame (Reus
  // Gate: at least 1 s, at most 15 s); a page that fails or is too slow is skipped and Career Start opens as before.
  // Shown once per manager per Showdown on this browser; never for a Showdown confirmed before r86.
  // r86 (red team #1): "seen" is kept as soon as the reveal is shown, and a skipped reveal counts as seen too, both on this
  // browser's storage. Before, a reload in season 1 (before Continue, or after a skip) ran the reveal again over the live game.
  const PAGE="visual-assets/v10_1/special-player/index.html";
  const STAGE_ID="specialPlayerStage";
  const SEEN_KEY="careerModeShowdown.specialPlayerSeen.v1",SEEN_MAX=40;
  const MIN_LOADING_MS=1000,MAX_LOADING_MS=15000,REFRESH_WAIT_MS=5000;
  const LOADING_TEXT="PREPARING YOUR SPECIAL PLAYERS";
  let running=null;

  function spDoc(){return root.document||null;}
  function spWait(ms){return new Promise(resolve=>root.setTimeout(resolve,ms));}
  function spKey(state){return `${state.rivalryId}|${state.managerRole}`;}
  // The seen list goes through the app's storage helpers (js/storage.js), like every other browser-kept value.
  function spSeenList(){try{const value=JSON.parse(typeof root.readStorageValue==="function"&&root.readStorageValue(SEEN_KEY)||"[]");return Array.isArray(value)?value.filter(item=>typeof item==="string"):[];}catch(_error){return [];}}
  function spSeen(key){return spSeenList().includes(key);}
  function spMarkSeen(key){try{const list=spSeenList().filter(item=>item!==key);list.push(key);if(typeof root.writeStorageValue==="function")root.writeStorageValue(SEEN_KEY,JSON.stringify(list.slice(-SEEN_MAX)));}catch(_error){}}
  async function spLoad(key,path,ready){if(ready())return true;if(typeof root.loadRuntimeScript!=="function")return false;await root.loadRuntimeScript(key,path,ready);return Boolean(ready());}
  async function spEnsureDraw(){
    return await spLoad("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers))&&await spLoad("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer));
  }
  // {key, d, n} (Daniel's and Nik's rows in the list) when this manager should see the reveal now, else null.
  function spDecide(state){
    if(root.CMS_SPECIAL_PLAYER_REVEAL==="off")return null;
    if(!state||state.ready!==true||!state.setup||state.setup.phase!=="SHOWDOWN_CONFIRMED"||!state.rivalryId||!state.managerRole)return null;
    const key=spKey(state);if(spSeen(key))return null;
    const draw=root.CareerModeMarqueePlayer,list=root.CareerModeMarqueePlayers;
    if(!draw||!list||!Array.isArray(list.players)||!Number.isFinite(state.setupUpdatedAtMs))return null;
    if(!draw.forShowdown(state.rivalryId,state.setupUpdatedAtMs))return null;
    const picks=draw.picks(state.rivalryId,list.players.length);
    return picks?{key,d:picks.playerOne,n:picks.playerTwo}:null;
  }
  // The confirm time comes with every Setup read; a manager whose last Setup state came from their own confirm tap has none yet.
  async function spSetupState(setupApi){
    let state=setupApi.getState();
    if(state&&state.ready===true&&!Number.isFinite(state.setupUpdatedAtMs)&&typeof setupApi.refresh==="function"){
      await Promise.race([Promise.resolve(setupApi.refresh()).catch(()=>null),spWait(REFRESH_WAIT_MS)]);state=setupApi.getState();
    }
    return state;
  }
  function spShowLoading(){
    const doc=spDoc(),el=doc&&doc.getElementById("loadingScreen");if(!el)return {hide(){}};
    const text=doc.getElementById("loadingText"),priorText=text?text.textContent:"",priorLabel=el.getAttribute("aria-label");
    el.style.transition="none";el.classList.remove("is-exiting","hidden");el.hidden=false;el.removeAttribute("aria-hidden");el.setAttribute("aria-busy","true");el.setAttribute("aria-label","Preparing your Special Players");
    if(text)text.textContent=LOADING_TEXT;
    void el.offsetWidth;el.style.transition="";
    let hidden=false;
    return {hide(){
      if(hidden)return;hidden=true;el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      root.setTimeout(()=>{el.hidden=true;el.classList.add("hidden");if(text)text.textContent=priorText;if(priorLabel!==null)el.setAttribute("aria-label",priorLabel);},240);
    }};
  }
  function spRemoveStage(){const stage=spDoc()?.getElementById(STAGE_ID);if(stage)stage.remove();}
  function spCreateStage(pick){
    const doc=spDoc();spRemoveStage();
    const stage=doc.createElement("div");stage.id=STAGE_ID;stage.setAttribute("role","dialog");stage.setAttribute("aria-modal","true");stage.setAttribute("aria-label","Your Special Players");
    stage.style.cssText="position:fixed;inset:0;z-index:95;background:#050403;visibility:hidden";
    const frame=doc.createElement("iframe");frame.title="Special Player reveal";frame.allow="autoplay";
    const base=typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(PAGE):PAGE;
    frame.src=`${base}${base.includes("?")?"&":"?"}embed=1&d=${pick.d}&n=${pick.n}`;
    frame.style.cssText="display:block;width:100%;height:100%;border:0;background:#050403";
    stage.append(frame);doc.body.append(stage);
    return {stage,frame};
  }
  // Resolves "ready", "error" or "timeout"; then waits for the Continue tap.
  function spListen(frame){
    const origin=root.location&&root.location.origin;let onReady,onContinue;
    const ready=new Promise(resolve=>{onReady=resolve;}),cont=new Promise(resolve=>{onContinue=resolve;});
    const handler=event=>{
      if(event.source!==frame.contentWindow||event.origin!==origin||!event.data)return;
      if(event.data.type==="cms-sp-ready")onReady("ready");
      // An error after "ready" (the animation failing before Continue) also ends the Continue wait, so the stage is removed
      // and Career Start opens instead of the manager being stuck on a broken reveal (Codex P2 on #1035).
      else if(event.data.type==="cms-sp-error"){onReady("error");onContinue("error");}
      else if(event.data.type==="cms-sp-continue")onContinue("continue");
    };
    root.addEventListener("message",handler);
    // A page that loads without its 3D library, or not at all, is skipped at once instead of after the full wait.
    frame.addEventListener("load",()=>{try{const view=frame.contentWindow;if(view&&String(view.location.href)==="about:blank")return;if(!view||!view.THREE)onReady("error");}catch(_error){onReady("error");}});
    frame.addEventListener("error",()=>onReady("error"));
    const timer=root.setTimeout(()=>onReady("timeout"),MAX_LOADING_MS);
    return {ready:ready.finally(()=>root.clearTimeout(timer)),cont,stop(){root.removeEventListener("message",handler);root.clearTimeout(timer);}};
  }
  async function spRun(setupApi){
    if(!setupApi||typeof setupApi.getState!=="function")return null;
    if(root.CMS_SPECIAL_PLAYER_REVEAL==="off"||!spDoc())return null;
    if(!await Promise.race([spEnsureDraw(),spWait(REFRESH_WAIT_MS*2).then(()=>false)]))return null;
    const pick=spDecide(await spSetupState(setupApi));if(!pick)return null;
    const loading=spShowLoading(),shownAt=Date.now();let channel=null,stage=null,frame=null;
    try{
      ({stage,frame}=spCreateStage(pick));channel=spListen(frame);
      const outcome=await channel.ready;
      if(outcome!=="ready")throw new Error(`Special Player page ${outcome}.`);
      const left=MIN_LOADING_MS-(Date.now()-shownAt);if(left>0)await spWait(left);
      stage.style.visibility="visible";
      frame.contentWindow.postMessage({type:"cms-sp-start"},root.location.origin);
      spMarkSeen(pick.key);
    // Red team R87-SP-03: a page that never started (no 3D library, no network, timeout) is NOT marked seen, so the reveal
    // plays the next time Career Start opens and the page can load.
    }catch(_error){if(channel)channel.stop();spRemoveStage();loading.hide();return null;}
    loading.hide();
    try{frame.focus();}catch(_error){}
    const end=await channel.cont;channel.stop();
    if(end==="error"){spRemoveStage();return null;}
    return Object.freeze({close(){spRemoveStage();return true;}});
  }
  // Never rejects: any failure means no reveal, and Career Start opens as before.
  function runBeforeCareerStart(setupApi){
    if(running)return running;
    const run=Promise.resolve().then(()=>spRun(setupApi)).catch(()=>{spRemoveStage();return null;}).finally(()=>{if(running===run)running=null;});
    running=run;return run;
  }

  return Object.freeze({contractVersion:1,feature:"cms-special-player-reveal",page:PAGE,stageId:STAGE_ID,seenKey:SEEN_KEY,minLoadingMs:MIN_LOADING_MS,maxLoadingMs:MAX_LOADING_MS,decide:spDecide,runBeforeCareerStart});
});

```

## FILE: visual-assets/v10_1/special-player/index.html (crest art and the two data lines excerpted)
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
<title>Special Player Big Jump</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Big+Shoulders+Display:wght@700;800;900&display=swap">
<style>
/* One full-bleed 3D stage. Title over the sky, broadcast lower third (desktop), control strip on the bottom edge. */
:root {
  --ink: #050506; --gold: #f1c35a; --gold-hi: #fff3c4; --gold-deep: #9c6e22; --ivory: #f6eedb; --muted: #c9bc9c;
  --num: "Barlow Condensed", "Arial Narrow", sans-serif;
  --disp: "Big Shoulders Display", "Arial Narrow", sans-serif;
  color-scheme: dark;
}
html, body { height: 100%; }
body { margin: 0; background: var(--ink); color: var(--ivory); font-family: var(--num); overflow: hidden; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; }
#stage { position: fixed; inset: 0; touch-action: none; } /* idea 9: a finger drag tilts the card instead of panning */
#stage canvas { display: block; width: 100%; height: 100%; }
.hud { position: fixed; inset: 0; pointer-events: none; }
.top { position: absolute; left: 0; right: 0; top: 0; padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 0; text-align: center; }
/* title lockup: gold plate badge, ornament rules, foil title with a moving shine */
.kicker { display: flex; justify-content: center; align-items: center; gap: 12px; }
.kicker::before, .kicker::after { content: ""; width: clamp(28px, 7vw, 90px); height: 1px; background: linear-gradient(90deg, transparent, var(--gold-hi)); box-shadow: 0 0 6px rgba(255,220,140,.8); }
.kicker::after { transform: scaleX(-1); }
.badge { position: relative; font: 900 15px/1 var(--disp); letter-spacing: .16em; text-transform: uppercase; color: #1a1105; padding: 5px 14px 4px 16px;
  background: linear-gradient(180deg, #fffbe6 0%, #f6d47c 45%, #c8922f 55%, #f3cf73 100%); clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%);
  box-shadow: inset 0 1px 0 #fff; text-shadow: 0 1px 0 rgba(255,255,255,.55); }
.title { position: relative; display: inline-block; margin: 6px 0 0; font: 900 clamp(36px, 5.4vw, 64px)/.92 var(--disp); letter-spacing: .05em; text-transform: uppercase; }
.title span { display: block; background: linear-gradient(180deg, #fffdf2 0%, #fff0b8 30%, #f2c35a 48%, #a8731f 52%, #e6b04c 70%, #fff3c6 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.title::before { content: attr(data-t); position: absolute; inset: 0; color: transparent; -webkit-text-stroke: 3px #2a1c05; filter: drop-shadow(0 3px 0 #120c02) drop-shadow(0 10px 16px rgba(0,0,0,.5)); z-index: -1; }
.title::after { content: attr(data-t); position: absolute; inset: 0; color: transparent; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.95) 48%, transparent 56%) no-repeat; background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; animation: shine 4.5s ease-in-out infinite; }
@keyframes shine { 0%, 55% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
@media (prefers-reduced-motion: reduce) { .title::after { animation: none; } }
.who { margin-top: 6px; font: 700 14px/1 var(--num); letter-spacing: .3em; text-transform: uppercase; color: var(--gold-hi); text-shadow: 0 1px 2px #000, 0 0 12px rgba(0,0,0,.6); min-height: 14px; }
/* broadcast lower third, desktop only */
.l3 { position: absolute; left: max(28px, env(safe-area-inset-left, 0px)); bottom: 150px; width: min(440px, 31vw); transform: translateX(-24px); opacity: 0; transition: transform .6s cubic-bezier(.2,.8,.2,1), opacity .4s; }
.l3.on { transform: none; opacity: 1; }
.l3 .tag { display: inline-block; font: 800 13px/1 var(--num); letter-spacing: .22em; text-transform: uppercase; color: #160f03; background: linear-gradient(180deg, var(--gold-hi), var(--gold)); padding: 6px 10px 5px; }
.l3 .name { margin-top: 6px; font: 900 clamp(44px, 4.6vw, 66px)/.86 var(--disp); text-transform: uppercase; letter-spacing: .01em; color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,.35), 0 8px 24px rgba(0,0,0,.55); white-space: nowrap; }
/* r87 start-polish BUG-4: the name sat white-on-yellow over the LED board. A solid dark nameplate with a gold edge sits
   behind the name only (not a scrim, nothing dimmed); the name keeps its place, size and colour. */
.l3 .name { display: block; width: -moz-fit-content; width: fit-content; padding: .1em .22em .04em; margin-left: -.22em; background: linear-gradient(180deg, #17140e, #070605); border-left: 3px solid var(--gold); box-shadow: inset 0 1px 0 rgba(255,243,196,.22), 0 0 0 1px rgba(241,195,90,.55); }
.l3 .rule { height: 3px; margin: 10px 0 8px; background: linear-gradient(90deg, var(--gold-hi), var(--gold) 40%, transparent); }
.l3 .meta { display: flex; flex-wrap: wrap; gap: 6px 14px; font: 700 16px/1 var(--num); letter-spacing: .14em; text-transform: uppercase; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.9); }
.l3 .meta i { font-style: normal; color: var(--gold-hi); }
/* r87 scene polish: the tag line and the meta line sat on the LED board's letters ("SPECIAL PLAYER" showed between them).
   One solid black-and-gold plate now holds the whole lower third (an opaque nameplate, not a scrim: nothing is dimmed). */
.l3 { box-sizing: border-box; padding: 12px 16px 14px 18px; background: linear-gradient(180deg, #17140e, #070605); border-left: 3px solid var(--gold); box-shadow: inset 0 1px 0 rgba(255,243,196,.22), 0 0 0 1px rgba(241,195,90,.55); }
.l3 .name { box-shadow: none; border-left: 0; background: none; margin-left: 0; padding-left: 0; }
.bottom { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: auto; padding: 10px max(16px, env(safe-area-inset-right, 0px)) calc(env(safe-area-inset-bottom, 0px) + 10px) max(16px, env(safe-area-inset-left, 0px)); }
.strip { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center; background: linear-gradient(180deg, #17140e, #070605); border: 1px solid rgba(241,195,90,.9); padding: 8px 12px; box-shadow: inset 0 1px 0 rgba(255,243,196,.25), 0 10px 30px rgba(0,0,0,.45); }
.slot { display: grid; grid-template-columns: auto 1fr; column-gap: 10px; align-items: center; min-width: 0; }
.slot.nik { grid-template-columns: 1fr auto; text-align: right; }
.slot em { grid-row: 1 / 3; font: 800 24px/1 var(--disp); font-style: normal; color: #1a1205; background: linear-gradient(180deg, var(--gold-hi), var(--gold)); padding: 4px 7px 3px; }
.slot.nik em { grid-column: 2; }
.slot b { font: 600 12px/1.1 var(--num); letter-spacing: .3em; text-transform: uppercase; color: var(--muted); }
.slot span { font: 800 21px/1.1 var(--disp); letter-spacing: .03em; text-transform: uppercase; color: #fff8e6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.slot span.wait { font: 700 15px/1.4 var(--num); color: var(--gold); letter-spacing: .26em; }
.slot i.rk { font: 700 12px/1.2 var(--num); font-style: normal; letter-spacing: .12em; text-transform: uppercase; color: var(--gold-hi); white-space: nowrap; }
.slot.nik i.rk { grid-column: 1; }
.slot i.rk:empty { display: none; }
@media (min-width: 900px) { .slot i.rk { display: none; } } /* desktop shows the rank in the name panel */
.cta { font: 800 18px/1 var(--disp); letter-spacing: .08em; text-transform: uppercase; color: #140e04; background: linear-gradient(180deg, #fff6d2, var(--gold) 55%, #c4943e); border: 0; padding: 13px 22px 12px; box-shadow: 0 0 0 1px #000, inset 0 -2px 0 rgba(0,0,0,.2); cursor: pointer; white-space: nowrap; transition: filter .3s; }
/* HO-049 (HO-027 no dimming): the waiting button keeps its size and full brightness: black with a gold edge and gold label */
.cta[disabled] { cursor: default; color: var(--gold-hi); background: linear-gradient(180deg, #17120a, #0a0805); box-shadow: 0 0 0 1px #000, inset 0 0 0 2px var(--gold); }
/* hype idea 7 (2026-10-29): Replay beside Continue once both cards are out; the hint for a guarded skip shows in the who line */
.mid { display: flex; gap: 8px; align-items: stretch; justify-content: center; min-width: 0; }
.again { flex: none; width: 44px; padding: 0; display: grid; place-items: center; color: var(--gold-hi); background: rgba(8,7,6,.82); border: 1px solid rgba(241,195,90,.75); cursor: pointer; }
.again[hidden] { display: none; }
.again svg { width: 22px; height: 22px; }
.again:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
.who.hint { color: #fff; }
/* idea 3: the handover line pops big in the top band (scale only, so nothing moves in the layout) */
.who { transition: transform .45s cubic-bezier(.2,1.5,.4,1), color .3s; transform-origin: 50% 0; }
.who.big { transform: scale(var(--pop, 1.8)); color: #fff; }
@media (prefers-reduced-motion: reduce) { .who { transition: none; } .who.big { transform: none; } }
/* idea 11: the better pull's name pulses gold; Continue shines once, then pulses gently (faster after a top-3 pull). Glow only. */
.slot span.best { animation: best 2.4s ease-in-out infinite; }
@keyframes best { 0%, 100% { color: #fff8e6; text-shadow: none; } 50% { color: var(--gold-hi); text-shadow: 0 0 10px rgba(241,195,90,.95), 0 0 2px #fff6d2; } }
.cta.shine { position: relative; overflow: hidden; animation: ctaPulse 2.6s ease-in-out 1.2s infinite; }
.cta.shine.fast { animation-duration: 1.5s; }
.cta.shine::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.9) 50%, transparent 65%); transform: translateX(-130%); animation: ctaShine 1.1s ease-out .15s 1 forwards; }
@keyframes ctaShine { to { transform: translateX(130%); } }
@keyframes ctaPulse { 0%, 100% { filter: drop-shadow(0 0 0 rgba(241,195,90,0)); } 50% { filter: drop-shadow(0 0 12px rgba(241,195,90,.9)); } }
@media (prefers-reduced-motion: reduce) { .slot span.best { animation: none; color: var(--gold-hi); } .cta.shine { animation: none; } .cta.shine::after { display: none; } }
.tools { max-width: 1000px; margin: 8px auto 0; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
.tools button, .tools select { font: 700 13px/1 var(--num); letter-spacing: .16em; text-transform: uppercase; color: var(--ivory); background: rgba(8,7,6,.82); border: 1px solid rgba(241,195,90,.55); border-radius: 999px; padding: 8px 14px; cursor: pointer; }
body.game .tools { display: none; }
#tools-back { display: none; position: fixed; top: 10px; right: 10px; z-index: 9; font: 700 11px/1 var(--num); letter-spacing: .14em; text-transform: uppercase; color: var(--ivory); background: rgba(8,7,6,.7); border: 1px solid rgba(241,195,90,.5); border-radius: 999px; padding: 7px 11px; }
body.game #tools-back { display: block; }
/* In-game sound switch (2026-10-29): before, the only Sound button sat in the hidden preview tools, so the game reveal was always silent. */
#spk { display: none; position: fixed; top: calc(10px + env(safe-area-inset-top, 0px)); right: calc(10px + env(safe-area-inset-right, 0px)); z-index: 9; width: 40px; height: 40px; padding: 0; border-radius: 50%; color: var(--gold-hi); background: rgba(8,7,6,.72); border: 1px solid rgba(241,195,90,.6); cursor: pointer; place-items: center; }
body.game #spk { display: grid; }
#spk svg { width: 20px; height: 20px; }
#spk .x { display: none; }
#spk.off .w { display: none; }
#spk.off .x { display: inline; }
#spk:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
.tools select { appearance: none; -webkit-appearance: none; }
.tools small { width: 100%; text-align: center; font: 500 11px/1.3 var(--num); letter-spacing: .1em; color: rgba(246,238,219,.8); text-shadow: 0 1px 2px #000; }
.tools button:focus-visible, .tools select:focus-visible, .cta:focus-visible { outline: 2px solid var(--gold-hi); outline-offset: 2px; }
.toast { position: fixed; left: 50%; top: 42%; transform: translate(-50%, -50%); background: rgba(8,7,6,.94); border: 1px solid var(--gold); padding: 10px 16px; font: 700 14px/1 var(--num); letter-spacing: .14em; text-transform: uppercase; opacity: 0; transition: opacity .3s; pointer-events: none; }
.toast.on { opacity: 1; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 899px) { .l3 { display: none; } }
@media (max-width: 640px) {
  .strip { grid-template-columns: 1fr 1fr; gap: 8px 12px; }
  .mid { grid-column: 1 / 3; grid-row: 2; }
  .cta { flex: 1; min-width: 0; font-size: 17px; padding: 12px; }
  .again:not([hidden]) + .cta { font-size: 15px; letter-spacing: .04em; padding: 12px 6px; overflow: hidden; text-overflow: ellipsis; } /* Replay beside it: the label still fits from 360 px */
  .again { width: 42px; }
  .slot span { font-size: 18px; }
  .slot b { letter-spacing: .18em; }
  .slot span.wait { font-size: 13px; letter-spacing: .12em; } /* "REVEALING" fits from 360 px */
  .title { font-size: 40px; }
  .badge { font-size: 13px; }
  .tools small { display: none; }
}
</style>

<div id="stage" aria-hidden="true"></div>
<div class="hud">
  <div class="top" id="top">
    <div class="kicker"><span class="badge">FIFA 17 Showdown</span></div>
    <div class="title" data-t="Special Player"><span>Special Player</span></div>
    <div class="who" id="who"></div>
  </div>
  <div class="l3" id="l3" aria-hidden="true">
    <span class="tag" id="l3tag"></span>
    <div class="name" id="l3name"></div>
    <div class="rule"></div>
    <div class="meta" id="l3meta"></div>
  </div>
  <div class="bottom" id="bottom">
    <div class="strip">
      <div class="slot dan"><em>01</em><b>Daniel</b><span id="slotD" class="wait">Revealing</span><i class="rk" id="rkD"></i></div>
      <div class="mid"><button type="button" id="again" class="again" hidden aria-label="Replay both reveals" title="Replay both reveals"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3 3.5v5h5"/></svg></button><button class="cta" id="cta" type="button" disabled>Continue to Career Start</button></div>
      <div class="slot nik"><em>02</em><b>Nik</b><span id="slotN" class="wait">Next</span><i class="rk" id="rkN"></i></div>
    </div>
    <div class="tools">
      <button type="button" id="skip">Skip</button>
      <button type="button" id="replay">Replay</button>
      <button type="button" id="sound" aria-pressed="false">Sound: off</button>
      <button type="button" id="gameview" title="Hide the preview buttons so the bar sits where it will in the game">Game view</button>
      <select id="tierShow" aria-label="Show a card design"><option value="">Card design…</option><option value="0,1">Black · ranks 1–3</option><option value="4,7">Blue · ranks 4–10</option><option value="12,16">Gold · ranks 11–20</option><option value="25,40">Silver · ranks 21–50</option><option value="70,150">Bronze · ranks 51–300</option></select>
      <select id="pickD" aria-label="Daniel's player (rank)"></select>
      <select id="pickN" aria-label="Nik's player (rank)"></select>
      <small>Big Jump · top 300 Special Players, FIFA 17 launch data (Team G list, 305 with ties) · pick a card design or any rank for Daniel and Nik · tap the pitch to skip</small>
    </div>
  </div>
</div>
<button type="button" id="tools-back">Preview tools</button>
<button type="button" id="spk" class="off" aria-pressed="false" aria-label="Sound off"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="w" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M17 9l5 6M22 9l-5 6"/></svg></button>
<div class="toast" id="toast">Preview only</div>
<div class="sr" aria-live="polite" id="live"></div>

<script>/* preview only: show any error on screen instead of a black page; in the game (?embed=1) the error goes to the game, which skips the reveal */
(function(){ var EMBED=/[?&]embed=1(?:&|$)/.test(location.search); function show(m){ if(EMBED){ try{ parent.postMessage({type:"cms-sp-error",message:String(m).slice(0,300)},location.origin); }catch(e){} return; } try{ var d=document.getElementById('errbox'); if(!d){ d=document.createElement('div'); d.id='errbox'; d.style.cssText='position:fixed;left:12px;right:12px;top:12px;z-index:99;background:#300;color:#fff;font:13px/1.4 monospace;padding:10px;border:1px solid #f66;white-space:pre-wrap'; (document.body||document.documentElement).appendChild(d); } d.textContent+=m+'\n'; }catch(e){} }
 window.addEventListener('error',function(e){ show('Error: '+(e.message||e.type)+(e.filename?' @'+e.filename.split('/').pop()+':'+e.lineno:'')+(e.target&&e.target.src?' '+e.target.src:'')); },true);
 window.addEventListener('unhandledrejection',function(e){ show('Error: '+(e.reason&&e.reason.message||e.reason)); });
 document.addEventListener('webglcontextlost',function(){ show('3D graphics were reset by the phone. Close the tab and open the link again.'); },true);
 setTimeout(function(){ if(!window.THREE) show('3D library did not load (three.js). Check the connection and reload.'); },8000); })();</script>
<script src="../roulette/vendor/three-r128.min.js"></script><!-- red team R87-SP-03: the same r128 build, shell-cached by the service worker, so the reveal also plays offline -->
<script>/* r85 crest collection (js/visualIdentity.js, claude-gameplay/r85-crests) */
/* =====================================================
   Career Mode Showdown
   v1.1.0
   Original Club Crest / League Mark Identity System (CREST-V1)

   Club-associated colours and one redrawn theme per club are the
   only shared cues. Crest geometry, poses and layouts are original
   hand-authored artwork. No official artwork, text or raster files.
===================================================== */

/* [BUNDLE NOTE: lines 180-1012 omitted. Static crest art: club palettes, SVG shape/pattern/motif drawings, league marks. No control flow; the logic that uses them follows.] */
function getClubIdentityHash(value){
    let hash = 2166136261;
    const text = String(value || "").normalize("NFKD");
    for(let index = 0; index < text.length; index += 1){
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function getClubIdentityInitials(clubName){
    const clean = String(clubName || "")
        .replace(/\b(fc|cf|afc|sc|ac|ss|calcio|club|football)\b/gi, " ")
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .trim();

    if(!clean || clean === "?"){
        return "--";
    }

    const words = clean.split(/[\s-]+/).filter(Boolean);
    if(words.length === 1){
        return words[0].slice(0, 3).toUpperCase();
    }

    return words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase();
}

function escapeClubIdentityXml(value){
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/* Unknown names keep the old hash path, drawn in the new frame. */
function buildFallbackCrestRecipe(hash){
    const shapes = ["heater", "roundel", "hex", "point", "tall"];
    const patterns = ["stripes:s", "halves:s", "sash:s", "hoops:s", "chevron:s", "foot:s rule:a"];
    const motifs = ["star:a", "castle:a:p", "bird:a", "waves:a", "crown:a:p", "leaf:a:p", "wheel:a"];
    return crestRecipe(shapes[hash % shapes.length], patterns[(hash >>> 4) % patterns.length], motifs[(hash >>> 9) % motifs.length], "generated colours", "generated fallback crest");
}

function getClubCrestSvg(clubName){
    const identity = getClubIdentity(clubName);
    return buildCrestSvgMarkup(identity.recipe, identity, nextCrestIdPrefix());
}

function getClubIdentity(clubName){
    const name = String(clubName || "").trim();
    if(clubIdentityCache.has(name)){
        return clubIdentityCache.get(name);
    }

    const hash = getClubIdentityHash(name);
    const palette = (Object.prototype.hasOwnProperty.call(CLUB_IDENTITY_PALETTES, name) && CLUB_IDENTITY_PALETTES[name])
        || CLUB_IDENTITY_FALLBACK_PALETTES[hash % CLUB_IDENTITY_FALLBACK_PALETTES.length];
    const recipe = Object.prototype.hasOwnProperty.call(CLUB_CREST_RECIPES, name)
        ? CLUB_CREST_RECIPES[name]
        : buildFallbackCrestRecipe(hash);

    const draft = {
        initials: getClubIdentityInitials(name),
        primary: palette[0],
        secondary: palette[1],
        accent: palette[2],
        angle: `${30 + (hash % 31)}deg`,
        recipe
    };

    draft.crest = toSvgDataUri(buildCrestSvgMarkup(recipe, draft, "k"));
    Object.defineProperty(draft, "crestSvg", {
        enumerable: true,
        get(){ return buildCrestSvgMarkup(recipe, draft, nextCrestIdPrefix()); }
    });
    const identity = Object.freeze(draft);
    clubIdentityCache.set(name, identity);
    return identity;
}

function clearClubIdentity(element){
    if(!element){ return; }
    if(!element.dataset.clubIdentity && !element.dataset.clubName){ return; }

    delete element.dataset.clubIdentity;
    delete element.dataset.clubInitials;
    delete element.dataset.clubName;
    delete element.dataset.clubCrest;
    element.style.removeProperty("--club-primary");
    element.style.removeProperty("--club-secondary");
    element.style.removeProperty("--club-accent");
    element.style.removeProperty("--club-angle");
    element.style.removeProperty("--club-crest-image");
}

function applyClubIdentity(element, clubName){
    if(!element){ return; }

    const name = String(clubName || "").trim();
    if(!name || name === "?" || /not assigned/i.test(name)){
        clearClubIdentity(element);
        return;
    }

    if(element.dataset.clubIdentity === "true" && element.dataset.clubName === name){
        return;
    }

    const identity = getClubIdentity(name);
    element.dataset.clubIdentity = "true";
    element.dataset.clubName = name;
    element.dataset.clubInitials = identity.initials;
    element.dataset.clubCrest = "original";
    element.style.setProperty("--club-primary", identity.primary);
    element.style.setProperty("--club-secondary", identity.secondary);
    element.style.setProperty("--club-accent", identity.accent);
    element.style.setProperty("--club-angle", identity.angle);
    element.style.setProperty("--club-crest-image", identity.crest);
}

function refreshClubVisualIdentity(showdown = null){
    const active = showdown || (typeof currentShowdown !== "undefined" ? currentShowdown : null);
    if(!active || !active.clubs){ return; }

    const mappings = [
        [document.getElementById("clubNameOne"), active.clubs.playerOne],
        [document.getElementById("clubNameTwo"), active.clubs.playerTwo],
        [document.getElementById("clubConfirmationClubOne"), active.clubs.playerOne],
        [document.getElementById("clubConfirmationClubTwo"), active.clubs.playerTwo],
        [document.getElementById("dashboardClubOne"), active.clubs.playerOne],
        [document.getElementById("dashboardClubTwo"), active.clubs.playerTwo],
        [document.getElementById("transferClubOne"), active.clubs.playerOne],
        [document.getElementById("transferClubTwo"), active.clubs.playerTwo],
        [document.getElementById("seasonClubOne"), active.clubs.playerOne],
        [document.getElementById("seasonClubTwo"), active.clubs.playerTwo],
        [document.querySelector("#seasonSummaryOne .summaryClub"), active.clubs.playerOne],
        [document.querySelector("#seasonSummaryTwo .summaryClub"), active.clubs.playerTwo]
    ];

    mappings.forEach(([element, clubName]) => {
        applyClubIdentity(element, clubName);
    });
}

window.getClubIdentity = getClubIdentity;
window.applyClubIdentity = applyClubIdentity;
window.refreshClubVisualIdentity = refreshClubVisualIdentity;
window.getClubCrestSvg = getClubCrestSvg;
window.getLeagueMark = getLeagueMark;
window.applyLeagueMark = applyLeagueMark;

</script>
<script>
(function(){
"use strict";
const T = THREE;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const L = (hex) => new T.Color(hex).convertSRGBToLinear();

/* ================= sample data (Team G sends the real list) ================= */
const PAIRS = {
  a: { daniel: { name:"P. Dybala", short:"DYBALA", pos:"ST", nation:"AR", club:"Juventus", number:21, ovr:86, pot:93, rank:5, tier:"blue-gold", stats:[["PAC",84],["SHO",84],["PAS",80],["DRI",89],["DEF",25],["PHY",63]] },
       nik:    { name:"K. De Bruyne", short:"DE BRUYNE", pos:"CAM", nation:"BE", club:"Manchester City", number:17, ovr:88, pot:91, rank:12, tier:"gold", stats:[["PAC",77],["SHO",85],["PAS",89],["DRI",86],["DEF",39],["PHY",74]] } },
  b: { daniel: { name:"C. Ronaldo", short:"RONALDO", pos:"LW", nation:"PT", club:"Real Madrid", number:7, ovr:94, pot:94, rank:1, tier:"black-blue-gold", stats:[["PAC",92],["SHO",92],["PAS",81],["DRI",91],["DEF",33],["PHY",80]] },
       nik:    { name:"H. Kane", short:"KANE", pos:"ST", nation:"EN", club:"Tottenham Hotspur", number:10, ovr:85, pot:90, rank:26, tier:"silver", stats:[["PAC",70],["SHO",86],["PAS",70],["DRI",78],["DEF",41],["PHY",78]] } },
  c: { daniel: { name:"De Gea", short:"DE GEA", pos:"GK", nation:"ES", club:"Manchester United", number:1, ovr:90, pot:92, rank:8, tier:"blue-gold", stats:[["DIV",88],["HAN",85],["KIC",86],["REF",90],["SPD",59],["POS",87]] },
       nik:    { name:"Oscar", short:"OSCAR", pos:"CAM", nation:"BR", club:null, number:8, ovr:83, pot:86, rank:165, tier:"bronze", stats:[["PAC",73],["SHO",77],["PAS",83],["DRI",85],["DEF",42],["PHY",62]] } }
};
const TIERLABEL = { "black-blue-gold":"TOP 3", "blue-gold":"TOP 10", "gold":"TOP 20", "silver":"TOP 50", "bronze":"TOP 300" };
/* hype ideas (2026-10-29): one tier scale for every effect, 0 = bronze (rank 51+) up to 4 = black-blue-gold (top 3) */
const TIER_ORDER=["bronze","silver","gold","blue-gold","black-blue-gold"]; const tierLevel=(tier)=>Math.max(0,TIER_ORDER.indexOf(tier));
/* idea 4 timing (also read by the skip guard): the pack's colour ladder steps from 2.45 s, one step every .26 s */
const LADDER_T0=2.45, LADDER_DT=.26;
/* card finishes: g = background stops, line = inner frame, text/sub = type colours, glow = light colour, power = how big the show is */
const TIER = {
  "black-blue-gold": { g:["#1d2440","#07080d","#0a0f22","#1a2a66"], facet:"rgba(90,140,255,.10)", line:"#e9b950", text:"#f3cd6b", sub:"#cfdcff", band:["#fff2c0","#e4b24c","#8f6420"], bandText:"#120c02", glow:0x4d86ff, power:1.8 },
  "blue-gold":       { g:["#2f6ce8","#0f2f8f","#0a2370","#2a5cd0"], facet:"rgba(255,255,255,.08)", line:"#f0c461", text:"#ffe9a8", sub:"#e3ebff", band:["#fff2c0","#e7b955","#9a6c22"], bandText:"#120c02", glow:0x4f8bff, power:1.4 },
  "gold":            { g:["#fbe8a6","#e1b453","#c8932f","#f3d27f"], facet:"rgba(255,255,255,.16)", line:"#fff4cf", text:"#3a2905", sub:"#4b360c", band:["#fff7da","#f0cd75","#c08a2c"], bandText:"#2a1d03", glow:0xffc74f, power:1.1 },
  "silver":          { g:["#f6f8fb","#c5ccd5","#98a1ad","#e6eaef"], facet:"rgba(255,255,255,.22)", line:"#ffffff", text:"#1d2228", sub:"#2c333b", band:["#ffffff","#d9dee5","#9aa3ae"], bandText:"#14181c", glow:0xe8eef7, power:.8 },
  "bronze":          { g:["#f0c08f","#c27c43","#9a5a28","#dda070"], facet:"rgba(255,255,255,.14)", line:"#ffe1c2", text:"#1a0a02", sub:"#241005", band:["#ffe6cc","#d8995f","#8e4f22"], bandText:"#221004", glow:0xe0904e, power:.6 }
};
const KITS = {
  "Juventus":{base:"#f4f2ec",alt:"#121316",trim:"#c9a24a",num:"#121316",pattern:"stripes"},
  "Manchester City":{base:"#8cc2ea",alt:"#8cc2ea",trim:"#f4f2ec",num:"#13274a",pattern:"plain"},
  "Real Madrid":{base:"#f6f5f1",alt:"#f6f5f1",trim:"#c9a24a",num:"#1c2b4f",pattern:"plain"},
  "Tottenham Hotspur":{base:"#f6f5f1",alt:"#f6f5f1",trim:"#13224a",num:"#13224a",pattern:"plain"},
  "Manchester United":{base:"#d0201d",alt:"#d0201d",trim:"#121316",num:"#f6f5f1",pattern:"plain"},
  "":{base:"#17140f",alt:"#2b2419",trim:"#d6ab4f",num:"#f1c35a",pattern:"stripes"}
};
const kit = (c) => { if(KITS[c||""]) return KITS[c||""]; if(!c||!window.getClubIdentity) return KITS[""]; const id=window.getClubIdentity(crestName(c)); const light=lum(id.primary)>150; return KITS[c]={base:id.primary,alt:id.secondary,trim:id.accent,num:light?id.secondary:"#f6f5f1",pattern:"plain"}; };
/* Team G's real list (data/marqueePlayers.js @ claude-gameplay/r86-mp-numbers, LIST_VERSION 1): rank, name, club, ovr, pot, number, nation, position, six stats */
const MP_LIST=[[1,"Neymar","FC Barcelona",92,95,11,"BR","LW",[["PAC",91],["SHO",84],["PAS",78],["DRI",95],["DEF",30],["PHY",56]]],[2,"Cristiano Ronaldo","Real Madrid",94,94,7,"PT","LW",[["PAC",92],["SHO",92],["PAS",81],["DRI",91],["DEF",33],["PHY",80]]],[3,"P. Pogba","Manchester United",88,94,6,"FR","CM",[["PAC",77],["SHO",80],["PAS",83],["DRI",87],["DEF",72],["PHY",87]]],/* [BUNDLE NOTE: 305 rows total, same shape. Verified by script: row for row identical to data/marqueePlayers.js (rank, name, club, overall, potential, number, nationCode, position, stats in order).] */];
const NATION = {"BR": "Brazil", "PT": "Portugal", "FR": "France", "AR": "Argentina", "BE": "Belgium", "DE": "Germany", "UY": "Uruguay", "ES": "Spain", "CO": "Colombia", "SI": "Slovenia", "SE": "Sweden", "GB-WLS": "Wales", "PL": "Poland", "AT": "Austria", "IT": "Italy", "GB-ENG": "England", "CI": "Ivory Coast", "HR": "Croatia", "CZ": "Czech Republic", "DZ": "Algeria", "DK": "Denmark", "NL": "Netherlands", "PY": "Paraguay", "CH": "Switzerland", "NG": "Nigeria", "CL": "Chile", "GA": "Gabon", "BA": "Bosnia and Herzegovina", "GR": "Greece", "TR": "Turkey", "MX": "Mexico", "RS": "Serbia", "UA": "Ukraine", "ME": "Montenegro", "EG": "Egypt", "MA": "Morocco", "SN": "Senegal", "VE": "Venezuela", "JM": "Jamaica", "SK": "Slovakia", "AM": "Armenia", "CR": "Costa Rica", "CD": "DR Congo", "US": "United States", "GH": "Ghana", "BF": "Burkina Faso"};
/* simple real flags: h = horizontal bands top to bottom, v = vertical bands left to right */
const FLAGS = { FR:["v","#0055a4","#ffffff","#ef4135"], IT:["v","#009246","#ffffff","#ce2b37"], CI:["v","#f77f00","#ffffff","#009e60"], GN:["v","#ce1126","#fcd116","#009460"], NG:["v","#008751","#ffffff","#008751"], SN:["v","#00853f","#fdef42","#e31b23"],
  DE:["h","#000000","#dd0000","#ffce00"], AT:["h","#ed2939","#ffffff","#ed2939"], NL:["h","#ae1c28","#ffffff","#21468b"], AM:["h","#d90012","#0033a0","#f2a800"], UA:["h","#0057b7","#ffd700"], PY:["h","#d52b1e","#ffffff","#0038a8"], GA:["h","#009e60","#fcd116","#3a75c4"],
  SI:["h","#ffffff","#005ce5","#ed1c24"], HR:["h","#ff0000","#ffffff","#171796"], RS:["h","#c6363c","#0c4076","#ffffff"], SK:["h","#ffffff","#0b4ea2","#ee1c25"], PL:["h","#ffffff","#dc143c"], GH:["h","#ce1126","#fcd116","#006b3f"], BF:["h","#ef2b2d","#009e49"], EG:["h","#ce1126","#ffffff","#000000"], VE:["h","#ffcc00","#00247d","#cf142b"], MX:["v","#006847","#ffffff","#ce1126"], CO:["h","#fcd116","#fcd116","#003893","#ce1126"] };
const NATION_COLORS = {}; Object.keys(NATION).forEach(k=>{ const f=FLAGS[k]; NATION_COLORS[k]=f?f.slice(1).map(c=>parseInt(c.slice(1),16)):[0xffffff,0xf1c35a]; });
Object.assign(NATION_COLORS,{ AR:[0x74acdf,0xffffff,0xf6b40e], BE:[0x1a1a1a,0xfdda24,0xef3340], PT:[0x046a38,0xda291c,0xffe000], "GB-ENG":[0xffffff,0xce1124,0xffffff], ES:[0xaa151b,0xf1bf00,0xaa151b], BR:[0x009c3b,0xffdf00,0x2a52be],
  UY:[0xffffff,0x0038a8,0xfcd116], "GB-WLS":[0xffffff,0x00b140,0xd30731], SE:[0x006aa7,0xfecc02], DK:[0xc8102e,0xffffff], CH:[0xda291c,0xffffff], US:[0xb22234,0xffffff,0x3c3b6e], CL:[0xd52b1e,0xffffff,0x0039a6], CZ:[0xffffff,0xd7141a,0x11457e], JM:[0x009b3a,0xfed100,0x000000], BA:[0x002395,0xfecb00,0xffffff], GR:[0x0d5eaf,0xffffff], ME:[0xc40308,0xd4af3a] });
const RANKTIER=(r)=>r<=3?"black-blue-gold":r<=10?"blue-gold":r<=20?"gold":r<=50?"silver":"bronze";
function mpCard(row){ const [rank,name,club,ovr,pot,number,nation,pos,stats]=row; const sur=name.includes(". ")?name.slice(name.indexOf(". ")+2):name;
  return { name, short:sur.toUpperCase(), pos, nation, club:club||null, number, ovr, pot, rank, tier:RANKTIER(rank), stats }; }

/* ================= canvas art ================= */
/* small emblems on band flags, kept simple but in the right place and colours */
function shieldAt(ctx,cx,cy,sw,sh,fill,edge,lw){ ctx.beginPath(); ctx.moveTo(cx-sw/2,cy-sh/2); ctx.lineTo(cx+sw/2,cy-sh/2); ctx.lineTo(cx+sw/2,cy+sh*.1); ctx.quadraticCurveTo(cx+sw/2,cy+sh/2,cx,cy+sh/2); ctx.quadraticCurveTo(cx-sw/2,cy+sh/2,cx-sw/2,cy+sh*.1); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); if(edge){ ctx.strokeStyle=edge; ctx.lineWidth=lw; ctx.stroke(); } }
function flagEmblem(ctx,code,x,y,w,h){
  if(code==="GH"){ ctx.fillStyle="#000"; star(ctx,x+w/2,y+h/2+h*.02,h*.16); return; }
  if(code==="BF"){ ctx.fillStyle="#fcd116"; star(ctx,x+w/2,y+h/2+h*.02,h*.17); return; }
  if(code==="VE"){ ctx.fillStyle="#fff"; for(let i=0;i<8;i++){ const a=Math.PI*(1.12+i*.76/7); star(ctx,x+w/2+Math.cos(a)*h*.24,y+h*.62+Math.sin(a)*h*.24,h*.035); } return; }
  if(code==="EG"){ const cx=x+w/2, cy=y+h/2, s=h*.13; ctx.fillStyle="#c09300"; ctx.beginPath(); ctx.moveTo(cx,cy-s*.9); ctx.lineTo(cx+s*.25,cy-s*.5); ctx.lineTo(cx+s*1.1,cy-s*.3); ctx.lineTo(cx+s*.6,cy+s*.5); ctx.lineTo(cx+s*.4,cy+s*1.0); ctx.lineTo(cx-s*.4,cy+s*1.0); ctx.lineTo(cx-s*.6,cy+s*.5); ctx.lineTo(cx-s*1.1,cy-s*.3); ctx.lineTo(cx-s*.25,cy-s*.5); ctx.closePath(); ctx.fill(); ctx.fillStyle="#fff"; ctx.fillRect(cx-s*.25,cy-s*.2,s*.5,s*.6); ctx.fillStyle="#ce1126"; ctx.fillRect(cx-s*.25,cy-s*.2,s*.17,s*.6); ctx.fillStyle="#000"; ctx.fillRect(cx+s*.08,cy-s*.2,s*.17,s*.6); return; }
  if(code==="MX"){ const cx=x+w/2, cy=y+h/2, s=h*.16; ctx.strokeStyle="#2f7d32"; ctx.lineWidth=h*.025; ctx.beginPath(); ctx.arc(cx,cy+s*.1,s*.95,Math.PI*.15,Math.PI*.85); ctx.stroke(); ctx.fillStyle="#7a5230"; ctx.beginPath(); ctx.ellipse(cx,cy-s*.05,s*.42,s*.6,-.3,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx-s*.2,cy-s*.4); ctx.lineTo(cx-s*.9,cy-s*.8); ctx.lineTo(cx-s*.5,cy-s*.1); ctx.fill(); ctx.fillStyle="#4a7d2a"; ctx.fillRect(cx-s*.5,cy+s*.5,s,s*.18); ctx.strokeStyle="#3d8c40"; ctx.lineWidth=h*.012; ctx.beginPath(); ctx.moveTo(cx+s*.3,cy-s*.1); ctx.bezierCurveTo(cx+s*.8,cy-s*.3,cx+s*.4,cy+s*.3,cx+s*.9,cy+s*.2); ctx.stroke(); return; }
  if(code==="SN"){ ctx.fillStyle="#00853f"; star(ctx,x+w/2,y+h/2+h*.02,h*.17); }
  else if(code==="HR"){ const cx=x+w/2, cy=y+h*.5, sw=h*.3, sh=h*.36; ctx.save(); shieldAt(ctx,cx,cy,sw,sh,"#ffffff"); ctx.clip(); const q=sw/5; for(let i=0;i<5;i++) for(let j=0;j<6;j++) if((i+j)%2===0){ ctx.fillStyle="#ff0000"; ctx.fillRect(cx-sw/2+i*q,cy-sh/2+j*q,q,q); } ctx.restore(); shieldAt(ctx,cx,cy,sw,sh,"rgba(0,0,0,0)","#ff0000",h*.012); ctx.fillStyle="#171796"; for(let i=0;i<5;i++) ctx.fillRect(cx-sw/2+i*sw/5+sw*.02,cy-sh/2-h*.07,sw/5-sw*.04,h*.06); }
  else if(code==="SI"){ const cx=x+w*.27, cy=y+h*.37, sw=h*.2, sh=h*.25; shieldAt(ctx,cx,cy,sw,sh,"#005ce5","#ed1c24",h*.014); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(cx-sw*.4,cy+sh*.18); ctx.lineTo(cx-sw*.15,cy-sh*.05); ctx.lineTo(cx,cy-sh*.22); ctx.lineTo(cx+sw*.15,cy-sh*.05); ctx.lineTo(cx+sw*.4,cy+sh*.18); ctx.fill(); ctx.fillStyle="#fcd116"; [-.2,0,.2].forEach((d,i)=>star(ctx,cx+d*sw,cy-sh*(i===1?.36:.3),h*.02)); }
  else if(code==="SK"){ const cx=x+w*.36, cy=y+h*.5, sw=h*.34, sh=h*.44; shieldAt(ctx,cx,cy,sw,sh,"#ee1c25","#ffffff",h*.022); ctx.save(); shieldAt(ctx,cx,cy,sw,sh,"#ee1c25"); ctx.clip(); ctx.fillStyle="#0b4ea2"; [[-.32,.36,.22],[.32,.36,.22],[0,.26,.24]].forEach(([u,v,r])=>{ ctx.beginPath(); ctx.arc(cx+u*sw,cy+v*sh,r*sw,0,7); ctx.fill(); }); ctx.fillRect(cx-sw/2,cy+sh*.36,sw,sh*.2); ctx.restore(); shieldAt(ctx,cx,cy,sw,sh,"rgba(0,0,0,0)","#ffffff",h*.022); ctx.fillStyle="#fff"; ctx.fillRect(cx-sw*.04,cy-sh*.36,sw*.08,sh*.5); ctx.fillRect(cx-sw*.24,cy-sh*.22,sw*.48,sh*.06); ctx.fillRect(cx-sw*.3,cy-sh*.08,sw*.6,sh*.07); }
  else if(code==="RS"){ const cx=x+w*.33, cy=y+h*.48, sw=h*.24, sh=h*.3; ctx.fillStyle="#c6363c"; ctx.beginPath(); ctx.ellipse(cx,cy,sw*.95,sh*.72,0,0,7); ctx.fill(); ctx.strokeStyle="#edb92e"; ctx.lineWidth=h*.012; ctx.stroke(); shieldAt(ctx,cx,cy+sh*.05,sw*.6,sh*.65,"#c6363c","#ffffff",h*.01); ctx.fillStyle="#fff"; ctx.fillRect(cx-sw*.03,cy-sh*.2,sw*.06,sh*.5); ctx.fillRect(cx-sw*.25,cy,sw*.5,sh*.06); ctx.fillStyle="#edb92e"; ctx.fillRect(cx-sw*.3,cy-sh*.62,sw*.6,sh*.14); }
  else if(code==="PY"){ const cx=x+w/2, cy=y+h/2; ctx.fillStyle="#ffffff"; ctx.beginPath(); ctx.arc(cx,cy,h*.12,0,7); ctx.fill(); ctx.strokeStyle="#0038a8"; ctx.lineWidth=h*.012; ctx.stroke(); ctx.strokeStyle="#009b3a"; ctx.lineWidth=h*.014; ctx.beginPath(); ctx.arc(cx,cy,h*.085,Math.PI*.15,Math.PI*.85); ctx.stroke(); ctx.fillStyle="#fcd116"; star(ctx,cx,cy-h*.01,h*.04); }
  else if(code==="ES"){ const cx=x+w*.32, cy=y+h*.5, sw=h*.16, sh=h*.22; ctx.fillStyle="#aa151b"; ctx.fillRect(cx-sw*1.05,cy-sh*.45,sw*.18,sh*.95); ctx.fillRect(cx+sw*.87,cy-sh*.45,sw*.18,sh*.95); shieldAt(ctx,cx,cy+sh*.04,sw,sh,"#aa151b","#c8a200",h*.01); ctx.save(); ctx.beginPath(); ctx.rect(cx,cy-sh*.46,sw/2,sh*.48); ctx.fillStyle="#f1f1f1"; ctx.fill(); ctx.restore(); ctx.fillStyle="#f1bf00"; ctx.fillRect(cx-sw*.42,cy-sh*.3,sw*.3,sh*.25); ctx.fillStyle="#aa151b"; ctx.fillRect(cx-sw*.4,cy+sh*.06,sw*.32,sh*.3); ctx.fillStyle="#f1bf00"; for(let i=0;i<4;i++) ctx.fillRect(cx+sw*.02+i*sw*.12,cy+sh*.06,sw*.06,sh*.3); ctx.fillStyle="#c8a200"; ctx.fillRect(cx-sw*.4,cy-sh*.66,sw*.8,sh*.14); }
}
function drawFlag(ctx, code, x, y, w, h, noStroke){
  ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
  const band=(cols,vertical)=>cols.forEach((c,i)=>{ctx.fillStyle=c; vertical?ctx.fillRect(x+i*w/cols.length,y,w/cols.length+1,h):ctx.fillRect(x,y+i*h/cols.length,w,h/cols.length+1);});
  if(code==="AR"){ band(["#74acdf","#ffffff","#74acdf"],false); ctx.fillStyle="#f6b40e"; ctx.beginPath(); ctx.arc(x+w/2,y+h/2,h*.1,0,7); ctx.fill(); ctx.strokeStyle="#c48a08"; ctx.lineWidth=Math.max(1,h*.012); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2; ctx.beginPath(); ctx.moveTo(x+w/2+Math.cos(a)*h*.11,y+h/2+Math.sin(a)*h*.11); ctx.lineTo(x+w/2+Math.cos(a)*h*.15,y+h/2+Math.sin(a)*h*.15); ctx.stroke(); } }
  else if(code==="BE") band(["#1a1a1a","#fdda24","#ef3340"],true);
  else if(code==="PT"){ ctx.fillStyle="#da291c"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#046a38"; ctx.fillRect(x,y,w*.4,h); const cx=x+w*.4, cy=y+h/2, r=h*.21; ctx.strokeStyle="#ffe000"; ctx.lineWidth=h*.035; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx,cy,r,r*.35,0,0,7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy); ctx.stroke();
    const sw=h*.2, shh=h*.24, sx=cx-sw/2, sy=cy-shh/2; ctx.fillStyle="#ffffff"; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+sw,sy); ctx.lineTo(sx+sw,sy+shh*.6); ctx.quadraticCurveTo(sx+sw,sy+shh,cx,sy+shh); ctx.quadraticCurveTo(sx,sy+shh,sx,sy+shh*.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle="#da291c"; ctx.lineWidth=h*.03; ctx.stroke();
    ctx.fillStyle="#003399"; [[0,-1],[-1,0],[0,0],[1,0],[0,1]].forEach(([i,j])=>ctx.fillRect(cx+i*sw*.24-sw*.07,cy+j*shh*.24-shh*.08,sw*.14,shh*.16)); }
  else if(FLAGS[code]){ const f=FLAGS[code]; band(f.slice(1),f[0]==="v"); flagEmblem(ctx,code,x,y,w,h); }
  else if(code==="UY"){ ctx.fillStyle="#fff"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#0038a8"; for(let i=1;i<9;i+=2) ctx.fillRect(x,y+i*h/9,w,h/9+.5); ctx.fillStyle="#fff"; ctx.fillRect(x,y,w*.37,h*5/9); ctx.fillStyle="#fcd116"; const ux=x+w*.185, uy=y+h*.278; for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r1=h*.09, r2=h*(i%2?.17:.2); ctx.beginPath(); ctx.moveTo(ux+Math.cos(a-.12)*r1,uy+Math.sin(a-.12)*r1); ctx.lineTo(ux+Math.cos(a)*r2,uy+Math.sin(a)*r2); ctx.lineTo(ux+Math.cos(a+.12)*r1,uy+Math.sin(a+.12)*r1); ctx.fill(); } ctx.beginPath(); ctx.arc(ux,uy,h*.09,0,7); ctx.fill(); ctx.strokeStyle="#7d5a00"; ctx.lineWidth=h*.008; ctx.stroke(); }
  else if(code==="GB-WLS"){ ctx.fillStyle="#fff"; ctx.fillRect(x,y,w,h/2); ctx.fillStyle="#00b140"; ctx.fillRect(x,y+h/2,w,h/2); ctx.save(); ctx.translate(x,y); ctx.scale(w/300,h/200); const dp=WALES_DRAGON||(WALES_DRAGON=new Path2D(WALES_D)); ctx.fillStyle="#d30731"; ctx.fill(dp); ctx.lineJoin="round"; ctx.lineWidth=2.2; ctx.strokeStyle="#d30731"; ctx.stroke(dp); ctx.restore(); }
  else if(code==="DZ"){ ctx.fillStyle="#006233"; ctx.fillRect(x,y,w/2,h); ctx.fillStyle="#fff"; ctx.fillRect(x+w/2,y,w/2,h); crescent(ctx,x+w*.52,y+h/2,h*.25,h*.2,h*.05,"#d21034",0); ctx.fillStyle="#d21034"; star(ctx,x+w*.58,y+h/2,h*.12,-Math.PI/2+Math.PI/10*0); }
  else if(code==="TR"){ ctx.fillStyle="#e30a17"; ctx.fillRect(x,y,w,h); crescent(ctx,x+w*.36,y+h/2,h*.25,h*.2,h*.0625,"#fff",0); ctx.fillStyle="#fff"; star(ctx,x+w*.5,y+h/2,h*.125); }
  else if(code==="MA"){ ctx.fillStyle="#c1272d"; ctx.fillRect(x,y,w,h); ctx.strokeStyle="#006233"; ctx.lineWidth=h*.035; ctx.beginPath(); const r=h*.24; for(let i=0;i<=5;i++){ const a=-Math.PI/2+i*4*Math.PI/5; i?ctx.lineTo(x+w/2+Math.cos(a)*r,y+h/2+Math.sin(a)*r):ctx.moveTo(x+w/2+Math.cos(a)*r,y+h/2+Math.sin(a)*r); } ctx.closePath(); ctx.stroke(); }
  else if(code==="CR"){ [["#002b7f",0,1],["#fff",1,1],["#ce1126",2,2],["#fff",4,1],["#002b7f",5,1]].forEach(([c,a,n])=>{ ctx.fillStyle=c; ctx.fillRect(x,y+a*h/6,w,n*h/6+.5); }); }
  else if(code==="CD"){ ctx.fillStyle="#007fff"; ctx.fillRect(x,y,w,h); ctx.save(); ctx.translate(x,y+h); ctx.rotate(-Math.atan2(h,w)); const L=Math.hypot(w,h); ctx.fillStyle="#f7d618"; ctx.fillRect(-10,-h*.17,L+20,h*.34); ctx.fillStyle="#ce1021"; ctx.fillRect(-10,-h*.12,L+20,h*.24); ctx.restore(); ctx.fillStyle="#f7d618"; star(ctx,x+w*.15,y+h*.22,h*.15); }
  else if(code==="SE"){ ctx.fillStyle="#006aa7"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#fecc02"; ctx.fillRect(x+w*.3125,y,w*.125,h); ctx.fillRect(x,y+h*.4,w,h*.2); }
  else if(code==="DK"){ ctx.fillStyle="#c8102e"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#ffffff"; ctx.fillRect(x+w*.324,y,w*.108,h); ctx.fillRect(x,y+h*.4286,w,h*.1428); }
  else if(code==="CH"){ ctx.fillStyle="#da291c"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#fff"; const c=Math.min(w,h); ctx.fillRect(x+w/2-c*.1,y+h/2-c*.32,c*.2,c*.64); ctx.fillRect(x+w/2-c*.32,y+h/2-c*.1,c*.64,c*.2); }
  else if(code==="US"){ for(let i=0;i<13;i++){ ctx.fillStyle=i%2?"#ffffff":"#b22234"; ctx.fillRect(x,y+i*h/13,w,h/13+.5); } ctx.fillStyle="#3c3b6e"; ctx.fillRect(x,y,w*.4,h*7/13); ctx.fillStyle="#fff"; for(let r=0;r<9;r++){ const n=r%2?5:6; for(let c=0;c<n;c++) star(ctx,x+w*.4*((r%2?2:1)+c*2)/12,y+h*7/13*(r+1)/10,h*.022); } }
  else if(code==="CL"){ ctx.fillStyle="#fff"; ctx.fillRect(x,y,w,h/2); ctx.fillStyle="#d52b1e"; ctx.fillRect(x,y+h/2,w,h/2); ctx.fillStyle="#0039a6"; ctx.fillRect(x,y,w/3,h/2); ctx.fillStyle="#fff"; star(ctx,x+w/6,y+h/4,h*.13); }
  else if(code==="CZ"){ ctx.fillStyle="#fff"; ctx.fillRect(x,y,w,h/2); ctx.fillStyle="#d7141a"; ctx.fillRect(x,y+h/2,w,h/2); ctx.fillStyle="#11457e"; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w*.5,y+h/2); ctx.lineTo(x,y+h); ctx.fill(); }
  else if(code==="JM"){ ctx.fillStyle="#009b3a"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#000"; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w/2,y+h/2); ctx.lineTo(x,y+h); ctx.fill(); ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x+w/2,y+h/2); ctx.lineTo(x+w,y+h); ctx.fill(); ctx.strokeStyle="#fed100"; ctx.lineWidth=h*.16; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y+h); ctx.moveTo(x+w,y); ctx.lineTo(x,y+h); ctx.stroke(); }
  else if(code==="BA"){ ctx.fillStyle="#002395"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#fecb00"; ctx.beginPath(); ctx.moveTo(x+w*.27,y); ctx.lineTo(x+w*.72,y); ctx.lineTo(x+w*.72,y+h); ctx.fill(); ctx.fillStyle="#fff"; for(let i=0;i<9;i++) star(ctx,x+w*(.2+i*.064),y+h*(.02+i*.12),h*.05); }
  else if(code==="GR"){ for(let i=0;i<9;i++){ ctx.fillStyle=i%2?"#ffffff":"#0d5eaf"; ctx.fillRect(x,y+i*h/9,w,h/9+.5); } ctx.fillStyle="#0d5eaf"; ctx.fillRect(x,y,w*.37,h*5/9); ctx.fillStyle="#fff"; ctx.fillRect(x+w*.15,y,w*.07,h*5/9); ctx.fillRect(x,y+h*2/9,w*.37,h/9); }
  else if(code==="ME"){ ctx.fillStyle="#d4af3a"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#c40308"; ctx.fillRect(x+h*.06,y+h*.06,w-h*.12,h*.88); ctx.fillStyle="#d4af3a"; const cx=x+w/2, cy=y+h/2, s=h*.32;
    const P=(pts)=>{ ctx.beginPath(); pts.forEach(([u,v],i)=>i?ctx.lineTo(cx+u*s,cy+v*s):ctx.moveTo(cx+u*s,cy+v*s)); ctx.closePath(); ctx.fill(); };
    P([[-.25,-.35],[-.95,-.75],[-.85,-.2],[-1.0,.0],[-.7,.2],[-.3,.15]]); P([[.25,-.35],[.95,-.75],[.85,-.2],[1.0,.0],[.7,.2],[.3,.15]]); // wings
    P([[-.28,-.45],[.28,-.45],[.3,.5],[0,.75],[-.3,.5]]); // body
    P([[-.1,-.45],[-.25,-.85],[-.45,-.8],[-.3,-.6]]); P([[.1,-.45],[.25,-.85],[.45,-.8],[.3,-.6]]); // heads
    P([[-.2,-1.05],[.2,-1.05],[.15,-.85],[-.15,-.85]]); // crown
    ctx.fillStyle="#2a5bd7"; ctx.fillRect(cx-s*.18,cy-s*.15,s*.36,s*.4); ctx.fillStyle="#3a9a3a"; ctx.fillRect(cx-s*.18,cy+s*.12,s*.36,s*.13); ctx.fillStyle="#d4af3a"; ctx.fillRect(cx-s*.1,cy-s*.05,s*.2,s*.12); }
  else if(code==="EN"||code==="GB-ENG"){ ctx.fillStyle="#ffffff"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#ce1124"; ctx.fillRect(x+w*.43,y,w*.14,h); ctx.fillRect(x,y+h*.4,w,h*.2); }
  else if(code==="ES"){ ctx.fillStyle="#aa151b"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#f1bf00"; ctx.fillRect(x,y+h*.25,w,h*.5); flagEmblem(ctx,code,x,y,w,h); }
  else if(code==="BR"){ ctx.fillStyle="#009c3b"; ctx.fillRect(x,y,w,h); ctx.fillStyle="#ffdf00"; ctx.beginPath(); ctx.moveTo(x+w*.08,y+h/2); ctx.lineTo(x+w/2,y+h*.1); ctx.lineTo(x+w*.92,y+h/2); ctx.lineTo(x+w/2,y+h*.9); ctx.fill(); ctx.fillStyle="#002776"; ctx.beginPath(); ctx.arc(x+w/2,y+h/2,h*.22,0,7); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(x+w/2,y+h/2,h*.22,0,7); ctx.clip(); ctx.strokeStyle="#fff"; ctx.lineWidth=h*.035; ctx.beginPath(); ctx.arc(x+w/2-h*.05,y+h*1.0,h*.55,-Math.PI*.72,-Math.PI*.22); ctx.stroke(); ctx.fillStyle="#fff"; for(let i=0;i<9;i++) star(ctx,x+w/2+(((i*37)%9)/9-.5)*h*.3,y+h/2+h*.04+((i*53)%7)/7*h*.13,h*.014); ctx.restore(); }
  const sh=ctx.createLinearGradient(x,y,x+w,y+h); sh.addColorStop(0,"rgba(255,255,255,.18)"); sh.addColorStop(.5,"rgba(255,255,255,0)"); sh.addColorStop(1,"rgba(0,0,0,.14)"); ctx.fillStyle=sh; ctx.fillRect(x,y,w,h);
  ctx.restore();
  if(!noStroke){ ctx.strokeStyle="rgba(0,0,0,.35)"; ctx.lineWidth=1.5; ctx.strokeRect(x+.5,y+.5,w-1,h-1); }
}
function clubPattern(ctx, k, x, y, w, h, n){
  ctx.fillStyle=k.base; ctx.fillRect(x,y,w,h); ctx.fillStyle=k.alt;
  if(k.pattern==="stripes"){ n=n||7; const sw=w/n; for(let i=1;i<n;i+=2) ctx.fillRect(x+i*sw,y,sw,h); }
  else if(k.pattern==="hoops"){ n=n||6; const sh=h/n; for(let i=1;i<n;i+=2) ctx.fillRect(x,y+i*sh,w,sh); }
}
function lum(h){ const n=parseInt(h.slice(1),16); return .2126*(n>>16)+.7152*((n>>8)&255)+.0722*(n&255); }
/* back view of the shirt, drawn with soft fabric shading */
function shirtBack(ctx, p, cx, top, s){
  const k=kit(p.club);
  ctx.save(); ctx.translate(cx,top); ctx.scale(s,s);
  const path=()=>{ ctx.beginPath(); ctx.moveTo(-26,0); ctx.quadraticCurveTo(0,10,26,0); ctx.lineTo(54,10); ctx.quadraticCurveTo(84,24,100,50); ctx.lineTo(80,86); ctx.quadraticCurveTo(68,80,58,74);
    ctx.quadraticCurveTo(60,140,62,206); ctx.quadraticCurveTo(0,214,-62,206); ctx.quadraticCurveTo(-60,140,-58,74); ctx.quadraticCurveTo(-68,80,-80,86); ctx.lineTo(-100,50); ctx.quadraticCurveTo(-84,24,-54,10); ctx.closePath(); };
  ctx.shadowColor="rgba(0,0,0,.45)"; ctx.shadowBlur=18; ctx.shadowOffsetY=8; path(); ctx.fillStyle=k.base; ctx.fill(); ctx.shadowColor="transparent";
  ctx.save(); path(); ctx.clip();
  clubPattern(ctx,k,-100,0,200,216,9);
  const side=ctx.createLinearGradient(-100,0,100,0); side.addColorStop(0,"rgba(0,0,0,.32)"); side.addColorStop(.22,"rgba(0,0,0,.04)"); side.addColorStop(.55,"rgba(255,255,255,.10)"); side.addColorStop(.8,"rgba(0,0,0,.05)"); side.addColorStop(1,"rgba(0,0,0,.34)"); ctx.fillStyle=side; ctx.fillRect(-100,0,200,216);
  [[-38,96,.10],[30,150,.08],[-10,190,.07]].forEach(([fx,fy,a])=>{ const g=ctx.createRadialGradient(fx,fy,2,fx,fy,46); g.addColorStop(0,`rgba(0,0,0,${a})`); g.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=g; ctx.fillRect(-100,0,200,216); });
  const top2=ctx.createLinearGradient(0,0,0,60); top2.addColorStop(0,"rgba(0,0,0,.18)"); top2.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=top2; ctx.fillRect(-100,0,200,60);
  ctx.restore();
  ctx.strokeStyle=k.trim; ctx.lineWidth=7; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(-25,1); ctx.quadraticCurveTo(0,11,25,1); ctx.stroke();
  ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(100,51); ctx.lineTo(81,85); ctx.moveTo(-100,51); ctx.lineTo(-81,85); ctx.stroke();
  ctx.textAlign="center"; ctx.textBaseline="alphabetic"; ctx.lineJoin="round";
  const edge = lum(k.num)>140 ? "#0b0d10" : "#f4f2ec";
  let fs=26; const setN=()=>ctx.font=`700 ${fs}px "Barlow Condensed"`; setN(); while(ctx.measureText(p.short).width>108 && fs>13){fs--; setN();}
  ctx.lineWidth=4; ctx.strokeStyle=edge; ctx.strokeText(p.short,0,50); ctx.fillStyle=k.num; ctx.fillText(p.short,0,50);
  const num=String(p.number); ctx.font=`800 ${num.length>1?112:122}px "Big Shoulders Display"`;
  ctx.lineWidth=10; ctx.strokeStyle=k.trim; ctx.strokeText(num,0,166);
  ctx.lineWidth=4; ctx.strokeStyle=edge; ctx.strokeText(num,0,166);
  ctx.fillStyle=k.num; ctx.fillText(num,0,166);
  ctx.restore();
}
const CREST_IMG={};
const CLUB_ALIAS={"FC Barcelona":"Barcelona","FC Bayern München":"Bayern Munich","AS Monaco":"Monaco","Bayer 04 Leverkusen":"Bayer Leverkusen","Inter":"Inter Milan","Toulouse Football Club":"Toulouse","Olympique Lyonnais":"Lyon","Athletic Club de Bilbao":"Athletic Club","TSG 1899 Hoffenheim":"Hoffenheim","Villarreal CF":"Villarreal","UD Las Palmas":"Las Palmas","FC Schalke 04":"Schalke 04","OGC Nice":"Nice","Deportivo Alavés":"Alavés","Olympique de Marseille":"Marseille","Sporting Club de Bastia":"Bastia","Sevilla FC":"Sevilla","Valencia CF":"Valencia","Hamburger SV":"Hamburg","VfL Wolfsburg":"Wolfsburg","Málaga CF":"Málaga","SD Eibar":"Eibar","RC Celta":"Celta Vigo","Granada CF":"Granada","AS Saint-Étienne":"Saint-Étienne","Stade Rennais FC":"Rennes"};
const crestName=(c)=>CLUB_ALIAS[c]||c;
function loadCrests(){ const clubs=new Set(); Object.values(pair).forEach(p=>p.club&&!CREST_IMG[p.club]&&clubs.add(p.club));
  return Promise.all([...clubs].map(c=>new Promise(res=>{ try{ const im=new Image(); im.onload=()=>{ CREST_IMG[c]=im; res(); }; im.onerror=()=>res(); im.src="data:image/svg+xml,"+encodeURIComponent(window.getClubCrestSvg(crestName(c))); }catch(e){ res(); } }))); }
function coinFace(ctx, club, cx, cy, r){
  const k=kit(club);
  ctx.save();
  const rim=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r); rim.addColorStop(0,"#fff6cf"); rim.addColorStop(.35,"#efc565"); rim.addColorStop(.7,"#a8761f"); rim.addColorStop(1,"#f5d483");
  ctx.fillStyle=rim; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
  ctx.strokeStyle="rgba(90,60,10,.5)"; ctx.lineWidth=r*.012; for(let i=0;i<120;i++){ const a=i/120*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r*.9,cy+Math.sin(a)*r*.9); ctx.lineTo(cx+Math.cos(a)*r*.985,cy+Math.sin(a)*r*.985); ctx.stroke(); }
  ctx.fillStyle="#0c0c0e"; ctx.beginPath(); ctx.arc(cx,cy,r*.86,0,7); ctx.fill();
  ctx.strokeStyle="#e2b452"; ctx.lineWidth=r*.035; ctx.beginPath(); ctx.arc(cx,cy,r*.78,0,7); ctx.stroke();
  const sh=(sx)=>{ ctx.beginPath(); ctx.moveTo(cx-r*.42*sx,cy-r*.5*sx); ctx.lineTo(cx+r*.42*sx,cy-r*.5*sx); ctx.lineTo(cx+r*.42*sx,cy+r*.08*sx); ctx.quadraticCurveTo(cx+r*.38*sx,cy+r*.42*sx,cx,cy+r*.6*sx); ctx.quadraticCurveTo(cx-r*.38*sx,cy+r*.42*sx,cx-r*.42*sx,cy+r*.08*sx); ctx.closePath(); };
  const im=CREST_IMG[club];
  if(im){ const hh=r*1.12, ww=hh*120/144; ctx.drawImage(im,cx-ww/2,cy-hh*.5,ww,hh); }
  else { sh(1.08); ctx.fillStyle="#e2b452"; ctx.fill(); ctx.save(); sh(1); ctx.clip(); clubPattern(ctx,k,cx-r*.45,cy-r*.55,r*.9,r*1.2,5); ctx.restore(); }
  for(let i=0;i<3;i++){ const a=-Math.PI/2+(i-1)*.5; ctx.fillStyle="#e2b452"; star(ctx,cx+Math.cos(a)*r*.68,cy+Math.sin(a)*r*.68,r*.06); }
  ctx.restore();
}
const WALES_D="M70 78 L56 74 L50 78 L40 78 L32 74 L36 80 L32 86 L42 83 L52 82 L52 88 L62 88 L70 84 L80 86 L88 92 L98 104 L102 112 L86 114 L74 108 L64 110 L70 116 L62 120 L74 121 L66 127 L80 124 L92 122 L106 124 L112 132 L118 132 L126 128 L132 140 L124 156 L116 162 L128 164 L136 154 L144 140 L170 140 L190 136 L198 146 L196 160 L188 166 L200 168 L208 156 L212 140 L224 130 L240 132 L252 140 L262 136 L274 124 L278 108 L272 96 L284 88 L270 84 L264 72 L258 88 L264 102 L260 116 L250 120 L238 114 L226 104 L214 100 L200 102 L186 104 L176 98 L170 84 L180 70 L196 56 L214 50 L200 48 L208 38 L192 40 L194 30 L178 36 L176 26 L162 40 L156 32 L148 48 L140 60 L134 74 L128 88 L118 92 L106 84 L98 74 L96 64 L104 58 L94 56 L86 62 L80 60 L82 50 L74 58 Z"; let WALES_DRAGON=null;
function crescent(ctx,cx,cy,r1,r2,off,col){ const c=document.createElement("canvas"), n=Math.ceil(r1*2+4); c.width=c.height=n; const g=c.getContext("2d"); g.fillStyle=col; g.beginPath(); g.arc(n/2,n/2,r1,0,7); g.fill(); g.globalCompositeOperation="destination-out"; g.beginPath(); g.arc(n/2+off,n/2,r2,0,7); g.fill(); ctx.drawImage(c,cx-n/2,cy-n/2); }
function star(ctx,x,y,r){ ctx.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);} ctx.closePath(); ctx.fill(); }

/* card shield: same outline as the 3D mesh (units, origin centre, 2.2 x 3.2) */
const SHIELD=[[-1.1,1.36],[-0.9,1.6],[-0.26,1.6],[0,1.48],[0.26,1.6],[0.9,1.6],[1.1,1.36],[1.1,-0.9],[0,-1.6],[-1.1,-0.9]];
const CW=512, CH=745, SC=2, toC=([x,y])=>[(x+1.1)/2.2*CW,(1.6-y)/3.2*CH];
function shieldPath(ctx, inset){
  const c=toC([0,0]); ctx.beginPath();
  SHIELD.forEach((pt,i)=>{ let [x,y]=toC(pt); if(inset){ x=c[0]+(x-c[0])*(1-inset/CW*2); y=c[1]+(y-c[1])*(1-inset/CH*2); } i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
  ctx.closePath();
}
function seeded(seed){ let s=seed; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }
/* painted card plates (tickets 1850-4 / 1850-7): shield bounds in the picture, and its own band moved down to our name band */
const CARD_ART={}, CARD_SRC={gold:{f:"assets/card_gold.jpg",x0:27,x1:996,y0:63,y1:1472,band:[698,797],period:46},"blue-gold":{f:"assets/card_blue.jpg",x0:27,x1:996,y0:63,y1:1472,band:[698,797],period:46},"black-blue-gold":{f:"assets/card_black.jpg",x0:0,x1:1024,y0:0,y1:1490,band:[820,936],period:1},silver:{f:"assets/card_silver.jpg",x0:0,x1:1024,y0:0,y1:1490,band:[820,936],period:1},bronze:{f:"assets/card_bronze.jpg",x0:0,x1:1024,y0:0,y1:1490,band:[820,936],period:1}};
function loadCardArt(){ return Promise.all(Object.entries(CARD_SRC).map(([k,c])=>new Promise(res=>{ const im=new Image(); im.onload=()=>{ CARD_ART[k]=im; res(); }; im.onerror=()=>res(); im.src=c.f; }))); }
function cardBase(ctx, t){
  ctx.setTransform(SC,0,0,SC,0,0); ctx.clearRect(0,0,CW,CH);
  const key=Object.keys(TIER).find(k=>TIER[k]===t), art=CARD_ART[key];
  if(art){ const c=CARD_SRC[key], sx=CW/(c.x1-c.x0), sy=CH/(c.y1-c.y0); shieldPath(ctx,0); ctx.save(); ctx.clip();
    ctx.drawImage(art,c.x0,c.y0,c.x1-c.x0,c.y1-c.y0,0,0,CW,CH);
    const h=c.band[1]-c.band[0], src=c.band[0]-c.period*Math.ceil(h/c.period); ctx.drawImage(art,c.x0,src,c.x1-c.x0,h,0,(c.band[0]-c.y0)*sy,CW,h*sy);
    ctx.restore(); return; }
  shieldPath(ctx,0); ctx.save(); ctx.clip();
  const g=ctx.createLinearGradient(0,0,CW*.7,CH); t.g.forEach((c,i)=>g.addColorStop(i/(t.g.length-1),c)); ctx.fillStyle=g; ctx.fillRect(0,0,CW,CH);
  const r=seeded(7); for(let i=0;i<14;i++){ ctx.fillStyle=i%2?t.facet:"rgba(0,0,0,.06)"; ctx.beginPath(); const x=r()*CW, y=r()*CH; ctx.moveTo(x,y); ctx.lineTo(x+(r()-.3)*420,y+(r()-.5)*300); ctx.lineTo(x+(r()-.5)*300,y+(r()+.2)*360); ctx.closePath(); ctx.fill(); }
  ctx.globalAlpha=.06; for(let i=0;i<CH;i+=2){ ctx.fillStyle=r()<.5?"#fff":"#000"; ctx.fillRect(0,i,CW,1); } ctx.globalAlpha=1;
  const s=ctx.createRadialGradient(CW*.18,CH*.02,10,CW*.18,CH*.02,CW*.95); s.addColorStop(0,"rgba(255,255,255,.34)"); s.addColorStop(.5,"rgba(255,255,255,.06)"); s.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=s; ctx.fillRect(0,0,CW,CH);
  ctx.restore();
  ctx.lineJoin="round"; ctx.lineWidth=3; ctx.strokeStyle=t.line; shieldPath(ctx,14); ctx.stroke();
  ctx.lineWidth=1; ctx.globalAlpha=.6; shieldPath(ctx,22); ctx.stroke(); ctx.globalAlpha=1;
}
function emboss(ctx, txt, x, y, col, light){
  ctx.fillStyle=light?"rgba(255,255,255,.45)":"rgba(255,255,255,.28)"; ctx.fillText(txt,x,y+1.2);
  ctx.fillStyle="rgba(0,0,0,.28)"; ctx.fillText(txt,x,y-.8);
  ctx.fillStyle=col; ctx.fillText(txt,x,y);
}
const LEFT_X=106, COIN_Y=336;
function leftStack(ctx, p, t, clues){
  ctx.textAlign="center";
  if(clues>=1){ ctx.font='600 50px "Barlow Condensed"'; emboss(ctx,p.pos,LEFT_X,208,t.text); }
  if(clues>=2){ ctx.fillStyle=t.text; ctx.globalAlpha=.55; ctx.fillRect(LEFT_X-30,224,60,1.5); ctx.globalAlpha=1; ctx.save(); ctx.shadowColor="rgba(0,0,0,.35)"; ctx.shadowBlur=4; ctx.shadowOffsetY=2; drawFlag(ctx,p.nation,LEFT_X-31,238,62,40); ctx.restore(); }
  if(clues>=3){ ctx.fillStyle=t.text; ctx.globalAlpha=.55; ctx.fillRect(LEFT_X-30,292,60,1.5); ctx.globalAlpha=1; ctx.save(); ctx.shadowColor="rgba(0,0,0,.35)"; ctx.shadowBlur=5; ctx.shadowOffsetY=2; coinFace(ctx,p.club,LEFT_X,COIN_Y,32); ctx.restore(); }
}
function drawCardBack(ctx, p, clues){
  const t=TIER[p.tier]; cardBase(ctx,t);
  ctx.save(); shieldPath(ctx,14); ctx.clip();
  const bg=ctx.createLinearGradient(0,404,0,470); bg.addColorStop(0,t.band[0]); bg.addColorStop(.5,t.band[1]); bg.addColorStop(1,t.band[2]); ctx.fillStyle=bg; ctx.fillRect(0,410,CW,58);
  ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(0,468,CW,2);
  ctx.textAlign="center"; ctx.font='800 34px "Big Shoulders Display"'; ctx.fillStyle=t.bandText; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="4px"; ctx.fillText("SPECIAL PLAYER",CW/2,450); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.globalAlpha=.16; ctx.fillStyle=t.text; ctx.font='900 300px "Big Shoulders Display"'; ctx.fillText("17",CW/2+30,370); ctx.globalAlpha=1;
  ctx.textAlign="center";
  if(clues>=1){ ctx.font='700 72px "Barlow Condensed"'; emboss(ctx,p.pos,112,150,t.text,true); }
  if(clues>=2){ ctx.save(); ctx.shadowColor="rgba(0,0,0,.4)"; ctx.shadowBlur=8; ctx.shadowOffsetY=3; drawFlag(ctx,p.nation,66,176,92,60); ctx.restore(); }
  if(clues>=3){ ctx.save(); ctx.shadowColor="rgba(0,0,0,.4)"; ctx.shadowBlur=8; ctx.shadowOffsetY=3; coinFace(ctx,p.club,112,304,46); ctx.restore(); }
  ctx.restore();
}
/* HO-036 scouting card: the back of the Special Player card after the face (Team G data/scoutingCards.js, gameplay/r86 b9e4e8f7) */
const SCOUT={"1|Neymar":["Inventive attacking dribbler","A skilful wide attacker who excels in one on one situations, using close control and changes of direction to beat defenders. He can create chances for teammates or finish moves himself. FIFA 17: 92 overall, 95 potential.","His improvisation and close control unlock even crowded defensive lines."],"2|Cristiano Ronaldo":["Explosive goalscoring winger","A powerful wide forward who attacks space at speed and strikes cleanly with either foot. His movement into the box, aerial threat and appetite for shooting make him a constant danger. FIFA 17: 94 overall, 94 potential.","Combines explosive movement and aerial power with prolific finishing ability."],"3|P. Pogba":["Powerful creative midfielder","A physically imposing midfielder with the technique to carry the ball through pressure and pick ambitious passes. His long stride and shooting ability give him an influence beyond simple possession. FIFA 17: 88 overall, 94 potential.","Power, passing range and flair make him a distinctive midfielder."],"4|L. Messi":["Mercurial attacking playmaker","A left footed attacker who glides past opponents with close control and sudden acceleration. Equally comfortable creating or finishing, he can dictate attacks from wide areas or central pockets. FIFA 17: 93 overall, 93 potential.","Rare close control and vision transform tight spaces into opportunities."],/* [BUNDLE NOTE: 305 entries total, key "rank|name", value [headline, paragraph, line]. Verified: every MP_LIST row has an entry.] */};
function wrapLines(ctx, txt, maxW){ const out=[]; let line=""; String(txt||"").split(/\s+/).forEach(w=>{ const t=line?line+" "+w:w; if(ctx.measureText(t).width>maxW&&line){ out.push(line); line=w; } else line=t; }); if(line) out.push(line); return out; }
/* r87 scene polish: balanced wrap for the scouting card: the narrowest width that keeps the same number of lines, so the
   last line is never a lone word ("potential.") and the block reads as an even column */
function wrapBalanced(ctx, txt, maxW){ const first=wrapLines(ctx,txt,maxW); if(first.length<2) return first; let lo=maxW*.5, hi=maxW;
  for(let i=0;i<12;i++){ const mid=(lo+hi)/2; if(wrapLines(ctx,txt,mid).length>first.length) lo=mid; else hi=mid; } return wrapLines(ctx,txt,hi); }
function drawScoutBack(ctx, p){
  const t=TIER[p.tier], sc=SCOUT[p.rank+"|"+p.name]; cardBase(ctx,t);
  if(!sc){ drawCardBack(ctx,p,3); return; }
  ctx.save(); shieldPath(ctx,14); ctx.clip();
  const dark=t.text.charAt(1)<"8"; // gold, silver, bronze cards carry dark ink
  const plate=dark?"rgba(255,250,236,.62)":"rgba(6,8,16,.58)";
  ctx.fillStyle=plate; ctx.beginPath(); ctx.roundRect?ctx.roundRect(52,72,CW-104,326,14):ctx.rect(52,72,CW-104,326); ctx.fill();
  ctx.textAlign="center"; ctx.fillStyle=t.sub; ctx.font='700 17px "Barlow Condensed"'; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="4px";
  ctx.fillText("SCOUTING REPORT",CW/2,104); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.font='700 40px "Barlow Condensed"'; emboss(ctx,p.short+"  ·  "+p.pos,CW/2,146,t.text,!dark);
  ctx.font='italic 600 24px "Barlow Condensed"'; ctx.fillStyle=t.text; ctx.fillText(sc[0],CW/2,178);
  ctx.globalAlpha=.5; ctx.fillRect(CW/2-60,192,120,2); ctx.globalAlpha=1;
  let fs=24, lines; do { ctx.font='600 '+fs+'px "Barlow Condensed"'; lines=wrapBalanced(ctx,sc[1],CW-140); fs--; } while(lines.length*fs*1.3>180&&fs>14);
  ctx.fillStyle=t.sub; const lh=(fs+1)*1.3, top=222+Math.max(0,(180-lines.length*lh)/2); /* centred in its 180 px band, not hung from the top */ lines.forEach((l,i)=>ctx.fillText(l,CW/2,top+i*lh));
  const bg=ctx.createLinearGradient(0,404,0,470); bg.addColorStop(0,t.band[0]); bg.addColorStop(.5,t.band[1]); bg.addColorStop(1,t.band[2]); ctx.fillStyle=bg; ctx.fillRect(0,410,CW,58);
  ctx.fillStyle="rgba(0,0,0,.25)"; ctx.fillRect(0,468,CW,2);
  ctx.font='800 30px "Big Shoulders Display"'; ctx.fillStyle=t.bandText; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="4px"; ctx.fillText("WHY HE IS SPECIAL",CW/2,449); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.fillStyle=plate; ctx.beginPath(); ctx.moveTo(70,484); ctx.lineTo(CW-70,484); ctx.lineTo(CW-70,590); ctx.lineTo(CW/2,668); ctx.lineTo(70,590); ctx.closePath(); ctx.fill();
  fs=25; do { ctx.font='600 '+fs+'px "Barlow Condensed"'; lines=wrapBalanced(ctx,sc[2],CW-170); fs--; } while(lines.length*fs*1.25>140&&fs>14);
  ctx.fillStyle=t.text; const lh2=(fs+1)*1.25, top2=514+Math.max(0,(120-lines.length*lh2)/2); /* centred in the plate's upper part (it narrows to a point below) */ lines.forEach((l,i)=>ctx.fillText(l,CW/2,top2+i*lh2));
  ctx.restore();
}
function shieldHalf(y){ const Y=1.6-y/CH*3.2; return Y>=-.9?1.1:Math.max(0,1.1*(Y+1.6)/.7); } // half width (card units) at canvas y
function fitLine(ctx, txt, y, size, weight, col, sp){
  const room=2*(shieldHalf(y-size*.8)/2.2*CW)-48; let fs=size;
  const set=()=>{ ctx.font=weight+' '+fs+'px "Barlow Condensed"'; if(ctx.letterSpacing!==undefined) ctx.letterSpacing=sp+"px"; };
  set(); while(ctx.measureText(txt).width>room&&fs>10){ fs-=.5; set(); }
  emboss(ctx,txt,CW/2,y,col); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
}
function drawCardFront(ctx, p, noOvr){
  const t=TIER[p.tier]; cardBase(ctx,t);
  ctx.save(); shieldPath(ctx,14); ctx.clip();
  const sp=ctx.createRadialGradient(318,210,10,318,210,190); sp.addColorStop(0,"rgba(255,255,255,.28)"); sp.addColorStop(1,"rgba(255,255,255,0)"); ctx.fillStyle=sp; ctx.fillRect(120,40,392,360);
  shirtBack(ctx,p,318,96,1.3);
  ctx.textAlign="center";
  if(!noOvr){ ctx.font='600 112px "Barlow Condensed"'; emboss(ctx,String(p.ovr),LEFT_X,150,t.text,true); } /* idea 8: the count-up draws it until it lands */
  leftStack(ctx,p,t,3);
  const nb=ctx.createLinearGradient(0,408,0,462); nb.addColorStop(0,t.band[0]); nb.addColorStop(.5,t.band[1]); nb.addColorStop(1,t.band[2]); ctx.fillStyle=nb; ctx.fillRect(0,412,CW,52);
  ctx.fillStyle="rgba(255,255,255,.5)"; ctx.fillRect(0,412,CW,1.5); ctx.fillStyle="rgba(0,0,0,.3)"; ctx.fillRect(0,463,CW,2);
  let fs=46; const setF=()=>ctx.font=`800 ${fs}px "Big Shoulders Display"`; setF(); while(ctx.measureText(p.short).width>CW-120&&fs>26){fs--;setF();}
  ctx.fillStyle="rgba(255,255,255,.4)"; ctx.fillText(p.short,CW/2,453.5); ctx.fillStyle=t.bandText; ctx.fillText(p.short,CW/2,452);
  ctx.fillStyle=t.text; ctx.globalAlpha=.5; ctx.fillRect(CW/2-.75,484,1.5,118); ctx.globalAlpha=1;
  p.stats.forEach(([lab,v],i)=>{
    const col=i<3?0:1, row=i%3, x=col?CW/2+70:CW/2-118, y=516+row*40;
    ctx.textAlign="right"; ctx.font='700 40px "Barlow Condensed"'; emboss(ctx,String(v),x+40,y,t.text);
    ctx.textAlign="left"; ctx.font='500 32px "Barlow Condensed"'; emboss(ctx,lab,x+48,y,t.sub);
  });
  ctx.textAlign="center";
  ctx.fillStyle=t.text; ctx.globalAlpha=.5; ctx.fillRect(CW/2-110,612,220,1.5); ctx.globalAlpha=1;
  /* HO-042: the shield narrows below y≈582, so both lines sit high and shrink to the width left at their baseline */
  fitLine(ctx,`POT ${p.pot}  ·  #${p.rank}  ${TIERLABEL[p.tier]}`,642,25,'700',t.text,0);
  fitLine(ctx,(p.club||"No club").toUpperCase(),670,18,'600',t.sub,2);
  ctx.restore();
}
function drawPack(ctx, w, h){
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#26231d"); g.addColorStop(.45,"#060607"); g.addColorStop(1,"#211e18"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="rgba(241,195,90,.28)"; ctx.lineWidth=3; for(let i=-4;i<12;i++){ ctx.beginPath(); ctx.moveTo(0,i*80); ctx.lineTo(w/2,i*80+120); ctx.lineTo(w,i*80); ctx.stroke(); }
  const fr=ctx.createLinearGradient(0,0,w,h); fr.addColorStop(0,"#fff3c4"); fr.addColorStop(.4,"#e3ad44"); fr.addColorStop(.7,"#8f621c"); fr.addColorStop(1,"#f6d27c");
  ctx.strokeStyle=fr; ctx.lineWidth=14; ctx.strokeRect(18,18,w-36,h-36); ctx.lineWidth=3; ctx.strokeRect(40,40,w-80,h-80);
  ctx.fillStyle=fr; ctx.save(); ctx.translate(w/2,h*.33); ctx.beginPath(); ctx.moveTo(-96,46); ctx.lineTo(-108,-40); ctx.lineTo(-52,4); ctx.lineTo(0,-66); ctx.lineTo(52,4); ctx.lineTo(108,-40); ctx.lineTo(96,46); ctx.closePath(); ctx.fill(); ctx.fillRect(-98,58,196,18); ctx.restore();
  ctx.textAlign="center"; ctx.font='900 34px "Big Shoulders Display"'; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="6px"; ctx.fillText("FIFA 17 SHOWDOWN",w/2+5,h*.53); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.font='900 116px "Big Shoulders Display"'; ctx.fillText("SPECIAL",w/2,h*.65);
  ctx.font='600 34px "Barlow Condensed"'; ctx.fillStyle="#efe5cc"; if(ctx.letterSpacing!==undefined) ctx.letterSpacing="12px"; ctx.fillText("PLAYER",w/2+6,h*.72); if(ctx.letterSpacing!==undefined) ctx.letterSpacing="0px";
  ctx.fillStyle=fr; ctx.fillRect(w*.3,h*.78,w*.4,4);
  ctx.font='900 60px "Big Shoulders Display"'; ctx.fillStyle="#fff3c4"; ctx.fillText("17",w/2,h*.88);
}
function drawLed(c){
  c.fillStyle="#050505"; c.fillRect(0,0,2048,64);
  const g=c.createLinearGradient(0,0,0,64); g.addColorStop(0,"#fff4c8"); g.addColorStop(.5,"#f2bf4c"); g.addColorStop(1,"#a77219");
  c.fillStyle=g; c.font='800 46px "Big Shoulders Display"'; c.textBaseline="middle"; c.textAlign="center"; if(c.letterSpacing!==undefined) c.letterSpacing="6px";
  ["FIFA 17 SHOWDOWN","SPECIAL PLAYER"].forEach((s,i)=>{ c.fillText(s,i*1024+512,34); c.fillRect(i*1024+60,30,40,4); c.fillRect(i*1024+924,30,40,4); });
  c.fillStyle="rgba(0,0,0,.35)"; for(let x=0;x<2048;x+=4) c.fillRect(x,0,1,64); for(let y=0;y<64;y+=4) c.fillRect(0,y,2048,1);
}
function canvasTex(w,h,draw,linear){ const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d"); draw&&draw(ctx); const tx=new T.CanvasTexture(c); if(!linear) tx.encoding=T.sRGBEncoding; tx.anisotropy=8; return {c,ctx,tx}; }

/* ================= renderer + bloom ================= */
const stage=document.getElementById("stage");
const renderer=new T.WebGLRenderer({antialias:false, powerPreference:"high-performance"});
/* r87 start-polish: phones (a touch screen whose short side is at most 600px) get a lighter pipeline: pixel ratio
   capped at 1.5, a 1024 shadow map and 2x MSAA. Desktop, laptops and tablets keep 2 / 2048 / 4x. */
const PHONE_GPU=matchMedia("(pointer: coarse)").matches && Math.min(innerWidth,innerHeight)<=600;
const DPR=Math.min(devicePixelRatio||1, PHONE_GPU?1.5:2);
renderer.setPixelRatio(DPR);
renderer.outputEncoding=T.LinearEncoding; renderer.toneMapping=T.NoToneMapping;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
const isGL2=renderer.capabilities.isWebGL2;
const RTO={type:T.HalfFloatType, format:T.RGBAFormat, minFilter:T.LinearFilter, magFilter:T.LinearFilter, depthBuffer:false};
const sceneRT=isGL2?new T.WebGLMultisampleRenderTarget(4,4,{type:T.HalfFloatType,format:T.RGBAFormat}):new T.WebGLRenderTarget(4,4,{type:T.HalfFloatType,format:T.RGBAFormat});
if(isGL2) sceneRT.samples=PHONE_GPU?2:4;
const LV=4, mipA=[], mipB=[]; for(let i=0;i<LV;i++){ mipA.push(new T.WebGLRenderTarget(4,4,RTO)); mipB.push(new T.WebGLRenderTarget(4,4,RTO)); }
const VS="varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }";
const brightMat=new T.ShaderMaterial({uniforms:{tex:{value:null},thr:{value:1.5}},vertexShader:VS,depthTest:false,depthWrite:false,
  fragmentShader:"uniform sampler2D tex; uniform float thr; varying vec2 vUv; void main(){ vec3 c=texture2D(tex,vUv).rgb; float l=max(c.r,max(c.g,c.b)); float w=smoothstep(thr,thr+.8,l); gl_FragColor=vec4(min(c*w,vec3(30.)),1.); }"});
const blurMat=new T.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new T.Vector2()}},vertexShader:VS,depthTest:false,depthWrite:false,
  fragmentShader:"uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c=texture2D(tex,vUv).rgb*.2270; c+=texture2D(tex,vUv+dir*1.3846).rgb*.3162; c+=texture2D(tex,vUv-dir*1.3846).rgb*.3162; c+=texture2D(tex,vUv+dir*3.2308).rgb*.0703; c+=texture2D(tex,vUv-dir*3.2308).rgb*.0703; gl_FragColor=vec4(c,1.); }"});
const compMat=new T.ShaderMaterial({uniforms:{tex:{value:sceneRT.texture},b0:{value:mipA[0].texture},b1:{value:mipA[1].texture},b2:{value:mipA[2].texture},b3:{value:mipA[3].texture},strength:{value:.3},exposure:{value:.9},flash:{value:0}},vertexShader:VS,depthTest:false,depthWrite:false,
  fragmentShader:`uniform sampler2D tex,b0,b1,b2,b3; uniform float strength,exposure,flash; varying vec2 vUv;
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }
  void main(){ vec3 c=texture2D(tex,vUv).rgb; vec3 b=texture2D(b0,vUv).rgb*.6+texture2D(b1,vUv).rgb*.8+texture2D(b2,vUv).rgb*1.0+texture2D(b3,vUv).rgb*1.2;
    c=(c+b*strength)*exposure+vec3(flash); c=aces(c); c=pow(c,vec3(1./2.2)); gl_FragColor=vec4(c,1.); }`});
const quadScene=new T.Scene(), quadCam=new T.OrthographicCamera(-1,1,1,-1,0,1), quad=new T.Mesh(new T.PlaneGeometry(2,2),compMat); quad.frustumCulled=false; quadScene.add(quad);
function pass(mat,target){ quad.material=mat; renderer.setRenderTarget(target); renderer.render(quadScene,quadCam); }

const scene=new T.Scene(); scene.fog=new T.Fog(L(0xc9dcef),70,240);
const camera=new T.PerspectiveCamera(40,1,0.1,900);
scene.add(new T.HemisphereLight(L(0xcfe4ff),L(0x2d5a22),0.45));
const SUN=new T.Vector3(-36,79,49);
const sun=new T.DirectionalLight(L(0xfff0d8),2.3); sun.position.copy(SUN); sun.target.position.set(0,0,-10); sun.castShadow=true;
sun.shadow.mapSize.set(PHONE_GPU?1024:2048,PHONE_GPU?1024:2048); Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:10,far:320}); sun.shadow.bias=-.0004; sun.shadow.normalBias=.06; scene.add(sun,sun.target);

const sky=new T.Mesh(new T.SphereGeometry(500,32,16), new T.ShaderMaterial({side:T.BackSide, depthWrite:false, fog:false,
  uniforms:{top:{value:L(0x1f5fbf)},hor:{value:L(0xd2e6f7)},sunDir:{value:SUN.clone().normalize()}},
  vertexShader:"varying vec3 vP; void main(){ vP=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*viewMatrix*vec4(vP,1.); }",
  fragmentShader:"uniform vec3 top,hor,sunDir; varying vec3 vP; void main(){ vec3 d=normalize(vP); float h=clamp(d.y*1.5,0.,1.); vec3 c=mix(hor,top,pow(h,.6)); float s=max(dot(d,sunDir),0.); c+=vec3(1.,.9,.7)*(pow(s,600.)*30.+pow(s,12.)*.25); gl_FragColor=vec4(c,1.); }"}));
scene.add(sky);
const cloudTex=canvasTex(256,128,(c)=>{ const r=seeded(3); for(let i=0;i<18;i++){ const x=40+r()*176, y=50+r()*40, rr=18+r()*32; const g=c.createRadialGradient(x,y,0,x,y,rr); g.addColorStop(0,"rgba(255,255,255,.85)"); g.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=g; c.fillRect(0,0,256,128);} });
[[-160,110,-330,1.2],[60,150,-380,1.6],[190,95,-300,1],[-40,175,-420,1.4],[260,140,-160,1.1],[-280,120,-120,1.3]].forEach(([x,y,z,s])=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:cloudTex.tx, transparent:true, depthWrite:false, fog:false, color:new T.Color(1.4,1.4,1.45)})); sp.position.set(x,y,z); sp.scale.set(170*s,62*s,1); scene.add(sp); });

/* ================= pitch ================= */
const pitchTex=canvasTex(1024,2048,(c)=>{
  const W=1024,H=2048, X=(x)=>W/2+x/42*W/2, Z=(z)=>H/2-z/66*H/2;
  for(let i=0;i<24;i++){ c.fillStyle=i%2?"#2f6a22":"#3b7d2b"; c.fillRect(0,Z(66-i*5.5),W,5.5/66*H/2+1); }
  for(let i=0;i<10;i++){ c.fillStyle=i%2?"rgba(255,255,255,.035)":"rgba(0,0,0,.05)"; c.fillRect(X(-42+i*8.4),0,8.4/42*W/2+1,H); }
  const img=c.getImageData(0,0,W,H), r=seeded(11); for(let i=0;i<img.data.length;i+=4){ const n=(r()-.5)*20; img.data[i]+=n*.7; img.data[i+1]+=n; img.data[i+2]+=n*.5; } c.putImageData(img,0,0);
  c.strokeStyle="rgba(255,255,255,.93)"; c.lineWidth=5;
  c.strokeRect(X(-34),Z(52.5),X(34)-X(-34),Z(-52.5)-Z(52.5));
  c.beginPath(); c.moveTo(X(-34),Z(0)); c.lineTo(X(34),Z(0)); c.stroke();
  c.beginPath(); c.ellipse(X(0),Z(0),9.15/42*W/2,9.15/66*H/2,0,0,7); c.stroke();
  c.fillStyle="#fff"; c.beginPath(); c.ellipse(X(0),Z(0),5,5,0,0,7); c.fill();
  [1,-1].forEach(s=>{ const ez=52.5*s; c.strokeRect(X(-20.16),Math.min(Z(ez),Z(ez-16.5*s)),X(20.16)-X(-20.16),16.5/66*H/2); c.strokeRect(X(-9.16),Math.min(Z(ez),Z(ez-5.5*s)),X(9.16)-X(-9.16),5.5/66*H/2);
    c.beginPath(); c.ellipse(X(0),Z(ez-11*s),2,2,0,0,7); c.fill(); });
});
const pitch=new T.Mesh(new T.PlaneGeometry(84,132), new T.MeshStandardMaterial({map:pitchTex.tx, roughness:.82}));
pitch.rotation.x=-Math.PI/2; pitch.receiveShadow=true; scene.add(pitch);
const apron=new T.Mesh(new T.PlaneGeometry(600,600), new T.MeshStandardMaterial({color:L(0x3a7a2a), roughness:1})); apron.rotation.x=-Math.PI/2; apron.position.y=-0.03; apron.receiveShadow=true; scene.add(apron);
const postMat=new T.MeshStandardMaterial({color:L(0xffffff), roughness:.35});
[-52.5,52.5].forEach(gz=>{ [-3.66,3.66].forEach(x=>{ const p=new T.Mesh(new T.CylinderGeometry(.07,.07,2.44,12),postMat); p.position.set(x,1.22,gz); p.castShadow=true; scene.add(p); });
  const bar=new T.Mesh(new T.CylinderGeometry(.07,.07,7.32,12),postMat); bar.rotation.z=Math.PI/2; bar.position.set(0,2.44,gz); bar.castShadow=true; scene.add(bar);
  const net=new T.Mesh(new T.BoxGeometry(7.32,2.44,2), new T.MeshStandardMaterial({color:0xffffff, transparent:true, opacity:.16, depthWrite:false})); net.position.set(0,1.22,gz+Math.sign(gz)*1); scene.add(net); });

/* ================= stadium bowl (lofted along a rounded rectangle) ================= */
const BA=41, BB=61, BR=17;
function perimeter(A,B,R){
  const pts=[]; const corner=(cx,cz,a0)=>{ for(let i=0;i<=10;i++){ const a=a0+i/10*Math.PI/2; pts.push([cx+Math.cos(a)*R,cz+Math.sin(a)*R,Math.cos(a),Math.sin(a)]); } };
  const side=(x0,z0,x1,z1,nx,nz,n)=>{ for(let i=1;i<n;i++){ const k=i/n; pts.push([x0+(x1-x0)*k,z0+(z1-z0)*k,nx,nz]); } };
  corner(A-R,B-R,0); side(A-R,B,-(A-R),B,0,1,8); corner(-(A-R),B-R,Math.PI/2); side(-A,B-R,-A,-(B-R),-1,0,12); corner(-(A-R),-(B-R),Math.PI); side(-(A-R),-B,A-R,-B,0,-1,8); corner(A-R,-(B-R),Math.PI*1.5); side(A,-(B-R),A,B-R,1,0,12);
  pts.push(pts[0].slice()); let s=0; pts.forEach((p,i)=>{ if(i) s+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]); p[4]=s; }); return pts;
}
const PER=perimeter(BA,BB,BR);
function loft(p0,p1,mat,uLen,vRep,cast){
  const pos=[],uv=[],idx=[];
  PER.forEach((q,i)=>{ [p0,p1].forEach(([d,h],j)=>{ pos.push(q[0]+q[2]*d,h,q[1]+q[3]*d); uv.push(q[4]/uLen, j*vRep); }); if(i){ const a=(i-1)*2; idx.push(a,a+2,a+1,a+1,a+2,a+3); } });
  const g=new T.BufferGeometry(); g.setAttribute("position",new T.Float32BufferAttribute(pos,3)); g.setAttribute("uv",new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const m=new T.Mesh(g,mat); m.castShadow=!!cast; m.receiveShadow=true; scene.add(m); return m;
}
const seatTex=canvasTex(512,512,(c)=>{
  c.fillStyle="#2c2a26"; c.fillRect(0,0,512,512);
  const r=seeded(5);
  for(let row=0;row<16;row++){ c.fillStyle="#46433d"; c.fillRect(0,row*32+24,512,8); c.fillStyle="#1d1c1a"; c.fillRect(0,row*32+22,512,2);
    for(let s=0;s<16;s++){ const x=s*32, y=row*32; if(s===0){ c.fillStyle="#6a675f"; c.fillRect(x,y,32,32); c.fillStyle="#4a4741"; c.fillRect(x,y+15,32,2); continue; }
      const black=row<2; const base=black?[22,22,26]:[232,178,36]; const v=(r()-.5)*14;
      const g=c.createLinearGradient(0,y+3,0,y+21); g.addColorStop(0,`rgb(${base[0]+30+v},${base[1]+30+v},${base[2]+20+v})`); g.addColorStop(1,`rgb(${base[0]-40+v},${base[1]-40+v},${Math.max(0,base[2]-20)})`);
      c.fillStyle=g; c.beginPath(); c.moveTo(x+4,y+21); c.lineTo(x+4,y+7); c.quadraticCurveTo(x+16,y+2,x+28,y+7); c.lineTo(x+28,y+21); c.fill();
      c.fillStyle="rgba(0,0,0,.35)"; c.fillRect(x+4,y+20,24,2); } }
});
seatTex.tx.wrapS=seatTex.tx.wrapT=T.RepeatWrapping;
const ledTex=canvasTex(2048,64,drawLed);
ledTex.tx.wrapS=T.RepeatWrapping;
const seatsLo=new T.MeshStandardMaterial({map:seatTex.tx, roughness:.75});
const seatsUp=new T.MeshStandardMaterial({map:seatTex.tx, roughness:.75, color:L(0xe8e8e8)});
const concrete=new T.MeshStandardMaterial({color:L(0x2a2a2e), roughness:.9, side:T.DoubleSide});
const roofUnder=new T.MeshStandardMaterial({color:L(0x3b3d43), roughness:.7, metalness:.2, side:T.DoubleSide});
const goldMetal=new T.MeshStandardMaterial({color:L(0xe9b74e), metalness:1, roughness:.24});
const ledMat=new T.MeshBasicMaterial({map:ledTex.tx, side:T.DoubleSide}); ledMat.color.setScalar(2.2);
const floodMat=new T.MeshBasicMaterial({color:new T.Color(2.6,2.6,2.4), side:T.DoubleSide});
loft([-.2,0],[-.2,1.2],concrete,10,1);
loft([0,1.2],[13,10.4],seatsLo,8,1.3,true);
loft([13,10.4],[13,12.2],ledMat,48,1);
loft([13,12.2],[14.6,12.6],concrete,10,1,true);
loft([14.6,12.6],[30,23.6],seatsUp,8,1.2,true);
loft([30,23.6],[30.4,31],concrete,10,1,true);
loft([30.4,31],[5,26.8],roofUnder,10,1,true);
loft([5,26.8],[5,25.6],goldMetal,10,1,true);
loft([5.4,25.55],[7.4,25.9],floodMat,10,1);
loft([-5.2,0],[-5.2,.95],ledMat,24,1);
{ const ribGeo=new T.BoxGeometry(.45,.7,26), postGeo=new T.BoxGeometry(.35,6,.35); const ribs=new T.InstancedMesh(ribGeo,goldMetal,PER.length), posts=new T.InstancedMesh(postGeo,goldMetal,PER.length); const o=new T.Object3D(); let n=0;
  PER.forEach((q,i)=>{ if(i%2) return; o.position.set(q[0]+q[2]*17.6,29.2,q[1]+q[3]*17.6); o.rotation.set(0,Math.atan2(q[2],q[3]),0); o.rotateX(-.16); o.updateMatrix(); ribs.setMatrixAt(n,o.matrix);
    o.position.set(q[0]+q[2]*5.6,28.4,q[1]+q[3]*5.6); o.rotation.set(0,Math.atan2(q[2],q[3]),0); o.rotateX(-.5); o.updateMatrix(); posts.setMatrixAt(n,o.matrix); n++; });
  ribs.count=posts.count=n; ribs.castShadow=true; scene.add(ribs,posts); }
const glareTex=canvasTex(128,128,(c)=>{ const g=c.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.15,"rgba(255,250,235,.55)"); g.addColorStop(1,"rgba(255,240,210,0)"); c.fillStyle=g; c.fillRect(0,0,128,128); c.fillStyle="rgba(255,255,255,.5)"; c.fillRect(0,63,128,2); }, true);
PER.forEach((q,i)=>{ if(i%3) return; const sp=new T.Sprite(new T.SpriteMaterial({map:glareTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, color:new T.Color(1.6,1.55,1.4)})); sp.position.set(q[0]+q[2]*6.4,25.2,q[1]+q[3]*6.4); sp.scale.set(5,5,1); scene.add(sp); });
const flagMounts=[];
/* Big Jump: flags hang from the roof edge of the HD stand photo (29 deg up from the pitch camera, about 46 m away) */
[-25,-12.5,0,12.5,25].forEach(x=>flagMounts.push({pos:new T.Vector3(x,19.8,-40),rotY:0,w:9.0,h:6.0}));
const roofPoints=PER.filter((q,i)=>i%3===0&&q[1]<20).map(q=>new T.Vector3(q[0]+q[2]*5.2,25.4,q[1]+q[3]*5.2));

/* ================= giant nation flags (unroll from the roof) ================= */
const flags=flagMounts.map((m)=>{
  const geo=new T.PlaneGeometry(m.w,m.h,12,18); geo.translate(0,-m.h/2,0);
  const tex=canvasTex(384,256,null); const mat=new T.MeshStandardMaterial({map:tex.tx, side:T.DoubleSide, roughness:.8});
  const mesh=new T.Mesh(geo,mat); mesh.position.copy(m.pos); mesh.rotation.y=m.rotY; mesh.scale.y=.001; mesh.visible=false; mesh.castShadow=true; scene.add(mesh);
  return {mesh, tex, base:geo.attributes.position.array.slice(), drop:0, target:0, h:m.h};
});
function setFlagNation(code){ flags.forEach(f=>{ const c=f.tex.ctx; c.clearRect(0,0,384,256); drawFlag(c,code,0,0,384,256,true); f.tex.tx.needsUpdate=true; }); }

/* ================= particles (additive HDR sparks) ================= */
const MAXP=4000;
const pGeo=new T.BufferGeometry();
const pPos=new Float32Array(MAXP*3), pCol=new Float32Array(MAXP*3), pSize=new Float32Array(MAXP), pAlpha=new Float32Array(MAXP);
pGeo.setAttribute("position",new T.BufferAttribute(pPos,3)); pGeo.setAttribute("color",new T.BufferAttribute(pCol,3));
pGeo.setAttribute("size",new T.BufferAttribute(pSize,1)); pGeo.setAttribute("alpha",new T.BufferAttribute(pAlpha,1));
const pMat=new T.ShaderMaterial({transparent:true, depthWrite:false, blending:T.AdditiveBlending, uniforms:{scale:{value:600}},
  vertexShader:"attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC=color; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=max(1.5,size*scale/-mv.z); gl_Position=projectionMatrix*mv; }",
  fragmentShader:"varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-.5; float r=length(d); float core=smoothstep(.5,0.,r); float star=max(0.,1.-abs(d.x)*16.)*smoothstep(.5,0.,abs(d.y))+max(0.,1.-abs(d.y)*16.)*smoothstep(.5,0.,abs(d.x)); float a=(pow(core,3.)+star*.6)*vA; if(a<.01) discard; gl_FragColor=vec4(vC*(1.+core*1.5),a); }"});
const points=new T.Points(pGeo,pMat); points.frustumCulled=false; points.renderOrder=2; scene.add(points);
const parts=[]; for(let i=0;i<MAXP;i++) parts.push({life:0,max:1,v:new T.Vector3(),p:new T.Vector3(),c:new T.Color(),s:1,g:0,drag:0,tw:0});
let pCursor=0;
let pAlive=0, pDirty=false;
function emit(p,v,col,life,size,g,drag,tw){ pDirty=true; const q=parts[pCursor]; pCursor=(pCursor+1)%MAXP; q.p.copy(p); q.v.copy(v); q.c.copy(L(col)); q.life=q.max=life; q.s=size; q.g=g||0; q.drag=drag||0; q.tw=tw||0; }
const tmpV=new T.Vector3();
function burst(at,col,n,speed,life,size){ for(let i=0;i<n;i++){ tmpV.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(speed*(.55+Math.random()*.6)); emit(at,tmpV,Array.isArray(col)?col[i%col.length]:col,life*(.7+Math.random()*.5),size,-2.6,1.2,1); } }
/* Fireworks and fountains are placed inside what the camera sees (red team / hype study B, 2026-10-29): before, the sky volleys
   burst at y 36-43 behind the stands, above the top of the frame, and on a phone the pitch fountains and most of the confetti rain
   fell outside the narrow view. viewTanH is set by resize(). */
let viewTanH=.4;
const halfWAt=(z)=>Math.max(.5,(camRest.z-z)*viewTanH*camera.aspect);
function skyPoint(nx,ny,z){ camera.updateMatrixWorld(); const o=camera.position, q=new T.Vector3(nx,ny,.5).unproject(camera), k=(z-o.z)/((q.z-o.z)||-1e-6); return new T.Vector3(o.x+(q.x-o.x)*k,o.y+(q.y-o.y)*k,z); }
const fitX=(x,z)=>x*Math.min(1,halfWAt(z)*.85/6.5);
function starburst(at,col,n,speed,size){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, e=(Math.random()-.2)*Math.PI*.9; tmpV.set(Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e)).multiplyScalar(speed*(.85+Math.random()*.3)); emit(at,tmpV,Array.isArray(col)?col[i%col.length]:col,1.4+Math.random()*.6,size||.9,-3.5,.9,1); } }
function fountain(at,col,n,h,spread){ for(let i=0;i<n;i++){ tmpV.set((Math.random()-.5)*(spread||1.2),h*(.8+Math.random()*.4),(Math.random()-.5)*(spread||1.2)); emit(at,tmpV,col,1.1+Math.random()*.5,.2+Math.random()*.1,-9.8,.25,1); } }
function stepParticles(dt){ if(!pDirty&&!pAlive) return; pDirty=false; pAlive=0; /* nothing alive: no loop, no upload */
  for(let i=0;i<MAXP;i++){ const q=parts[i];
    if(q.life>0){ pAlive++; q.life-=dt; q.v.y+=q.g*dt; q.v.multiplyScalar(Math.max(0,1-q.drag*dt)); q.p.addScaledVector(q.v,dt);
      const k=Math.max(0,q.life/q.max); pPos[i*3]=q.p.x; pPos[i*3+1]=q.p.y; pPos[i*3+2]=q.p.z; pCol[i*3]=q.c.r*1.6; pCol[i*3+1]=q.c.g*1.6; pCol[i*3+2]=q.c.b*1.6; pSize[i]=q.s*(.35+.65*k); pAlpha[i]=Math.min(1,k*1.8)*(q.tw?(.55+Math.random()*.45):1);
    } else { pAlpha[i]=0; pSize[i]=0; } }
  pGeo.attributes.position.needsUpdate=pGeo.attributes.color.needsUpdate=pGeo.attributes.size.needsUpdate=pGeo.attributes.alpha.needsUpdate=true;
}

/* ================= pyro smoke (soft sprites, normal blend) ================= */
const smokeTex=canvasTex(128,128,(c)=>{ const r=seeded(21); for(let i=0;i<26;i++){ const x=34+r()*60, y=34+r()*60, rr=14+r()*24; const g=c.createRadialGradient(x,y,0,x,y,rr); g.addColorStop(0,"rgba(255,255,255,.22)"); g.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=g; c.fillRect(0,0,128,128);} }, true);
const smoke=[]; for(let i=0;i<70;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:smokeTex.tx, transparent:true, depthWrite:false, opacity:0, color:new T.Color(.85,.85,.82)})); sp.visible=false; scene.add(sp); smoke.push({sp,life:0,max:1,v:new T.Vector3(),s0:1,rot:0}); }
let smokeNext=0;
function puff(at,n,spread,size){ if(REDUCED) return; for(let k=0;k<n;k++){ const q=smoke[smokeNext]; smokeNext=(smokeNext+1)%smoke.length; q.sp.visible=true; q.sp.position.set(at.x+(Math.random()-.5)*spread,at.y+Math.random()*.5,at.z+(Math.random()-.5)*spread); q.v.set((Math.random()-.5)*.3,.35+Math.random()*.4,(Math.random()-.5)*.2); q.life=q.max=2.6+Math.random()*1.6; q.s0=(size||1.6)*(.7+Math.random()*.6); q.sp.material.rotation=Math.random()*6; } }
function stepSmoke(dt){ smoke.forEach(q=>{ if(q.life<=0){ q.sp.visible=false; return; } q.life-=dt; const k=1-q.life/q.max; q.sp.position.addScaledVector(q.v,dt); const s=q.s0*(1+k*2.2); q.sp.scale.set(s,s,1); q.sp.material.opacity=Math.sin(Math.min(1,k*1.4)*Math.PI)*.5; q.sp.material.rotation+=dt*.15; }); }
function clearSmoke(){ smoke.forEach(q=>{ q.life=0; q.sp.visible=false; }); }

/* ================= confetti (metallic paper) ================= */
const CONF=REDUCED?1:900;
const confetti=new T.InstancedMesh(new T.PlaneGeometry(.12,.075), new T.MeshStandardMaterial({side:T.DoubleSide, roughness:.35, metalness:.55}), CONF);
confetti.instanceMatrix.setUsage(T.DynamicDrawUsage); confetti.frustumCulled=false; scene.add(confetti);
const conf=[]; const dummy=new T.Object3D();
for(let i=0;i<CONF;i++){ conf.push({on:false,p:new T.Vector3(),v:new T.Vector3(),r:new T.Euler(),w:new T.Vector3(),ph:Math.random()*6}); dummy.scale.set(0,0,0); dummy.updateMatrix(); confetti.setMatrixAt(i,dummy.matrix); confetti.setColorAt(i,new T.Color(1,1,1)); }
let confNext=0;
function confettiRain(cols,n,zc,zs,y0,yr){ for(let k=0;k<n;k++){ const i=confNext; confNext=(confNext+1)%CONF; const c=conf[i]; c.on=true; c.rest=false; c.p.set((Math.random()-.5)*Math.min(14,2.1*halfWAt(zc||-2)),(y0||5)+Math.random()*(yr||9),(zc||-2)+(Math.random()-.5)*(zs||9)); c.v.set((Math.random()-.5)*.5,-(.9+Math.random()*.9),(Math.random()-.5)*.3); c.w.set(2+Math.random()*6,2+Math.random()*6,Math.random()*4); c.g=0; confetti.setColorAt(i,L(cols[i%cols.length]).multiplyScalar(1.15)); } confetti.instanceColor.needsUpdate=true; }
function confettiCannon(side,cols,n){ for(let k=0;k<n;k++){ const i=confNext; confNext=(confNext+1)%CONF; const c=conf[i]; c.on=true; c.rest=false; c.g=1; c.p.set(side*(4.6+Math.random()*.6),.3+Math.random()*.3,-2.2+(Math.random()-.5)*.6); c.v.set(-side*(1.6+Math.random()*4.2),6+Math.random()*6,-Math.random()*1.6); /* behind the card plane (Nik: nothing covers anything) */ c.w.set(3+Math.random()*8,3+Math.random()*8,Math.random()*5); confetti.setColorAt(i,L(cols[k%cols.length]).multiplyScalar(1.15)); } confetti.instanceColor.needsUpdate=true; }
/* Hype pass (2026-10-29, Nik: nothing covers anything): every confetti source starts and flies behind the card plane, and any
   piece that would still cross the card's screen rect in front of it (a turning card swings its edges ~1.1 forward) is taken
   away, from the moment the card appears; pieces that have landed stop being redrawn, so a still frame costs nothing. */
const confV=new T.Vector3();
function cardShield(){ card.updateMatrixWorld(); let x0=1,x1=-1,y0=1,y1=-1; [[-1.2,1.7],[1.2,1.7],[-1.2,-1.7],[1.2,-1.7]].forEach(([x,y])=>{ confV.set(x,y,0); card.localToWorld(confV).project(camera); x0=Math.min(x0,confV.x); x1=Math.max(x1,confV.x); y0=Math.min(y0,confV.y); y1=Math.max(y1,confV.y); }); const pad=.02; return {x0:x0-pad,x1:x1+pad,y0:y0-pad,y1:y1+pad,z:phase==="settled"?CARD_POS.z-.2:CARD_POS.z-1.25}; }
function stepConfetti(dt,t,shield){ let moved=false; for(let i=0;i<CONF;i++){ const c=conf[i]; if(!c.on) continue;
  if(shield&&c.p.z>shield.z){ confV.copy(c.p).project(camera); if(confV.x>shield.x0&&confV.x<shield.x1&&confV.y>shield.y0&&confV.y<shield.y1){ c.on=false; dummy.scale.set(0,0,0); dummy.updateMatrix(); confetti.setMatrixAt(i,dummy.matrix); moved=true; continue; } }
  if(c.rest) continue; moved=true; if(c.g){ c.v.y=Math.max(c.v.y-9*dt,-1.1); c.v.x*=1-1.4*dt; c.v.z*=1-1.4*dt; } c.p.addScaledVector(c.v,dt); c.p.x+=Math.sin(t*1.9+c.ph)*dt*.6; c.r.x+=c.w.x*dt; c.r.y+=c.w.y*dt; c.r.z+=c.w.z*dt;
  if(c.p.y<0.02){ c.p.y=0.02; c.v.set(0,0,0); c.w.set(0,0,0); c.r.x=-Math.PI/2; c.r.y=0; c.rest=true; }
  dummy.position.copy(c.p); dummy.rotation.copy(c.r); dummy.scale.set(1,1,1); dummy.updateMatrix(); confetti.setMatrixAt(i,dummy.matrix); }
  if(moved) confetti.instanceMatrix.needsUpdate=true; }
function clearConfetti(){ for(let i=0;i<CONF;i++){ conf[i].on=false; dummy.scale.set(0,0,0); dummy.updateMatrix(); confetti.setMatrixAt(i,dummy.matrix);} confetti.instanceMatrix.needsUpdate=true; }

/* ================= pack, card, coin, light rays ================= */
const packTex=canvasTex(512,736,null);
const packFace=new T.MeshStandardMaterial({map:packTex.tx, metalness:.55, roughness:.3, emissive:new T.Color(0,0,0)});
const blackMetal=new T.MeshStandardMaterial({color:L(0x121214), metalness:.7, roughness:.32});
const PACK_W=1.8, PACK_H=2.6, PACK_D=.46, PACK_REST=new T.Vector3(0,1.78,-1.2);
const pack=new T.Group(); scene.add(pack);
{ const body=new T.Mesh(new T.BoxGeometry(PACK_W-.06,PACK_H-.06,PACK_D),blackMetal); body.castShadow=true; pack.add(body);
  const fr=new T.Shape(); const ow=PACK_W/2+.03, oh=PACK_H/2+.03, iw=PACK_W/2-.13, ih=PACK_H/2-.13;
  fr.moveTo(-ow,-oh); fr.lineTo(ow,-oh); fr.lineTo(ow,oh); fr.lineTo(-ow,oh); fr.closePath();
  const hole=new T.Path(); hole.moveTo(-iw,-ih); hole.lineTo(-iw,ih); hole.lineTo(iw,ih); hole.lineTo(iw,-ih); hole.closePath(); fr.holes.push(hole);
  const frame=new T.Mesh(new T.ExtrudeGeometry(fr,{depth:PACK_D+.06,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:2}),goldMetal); frame.geometry.translate(0,0,-(PACK_D+.06)/2); frame.castShadow=true; pack.add(frame);
  const panelGeo=new T.PlaneGeometry(ow*2+.06,oh*2+.06), PZ=(PACK_D+.06)/2+.04;
  const pf=new T.Mesh(panelGeo,packFace); pf.position.z=PZ; pack.add(pf);
  const pb=new T.Mesh(panelGeo,packFace); pb.position.z=-PZ; pb.rotation.y=Math.PI; pack.add(pb); }
const crackTex=canvasTex(64,256,(c)=>{ const g=c.createLinearGradient(0,0,64,0); g.addColorStop(0,"rgba(255,255,255,0)"); g.addColorStop(.5,"rgba(255,255,255,1)"); g.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=g; c.fillRect(0,0,64,256); const v=c.createLinearGradient(0,0,0,256); v.addColorStop(0,"rgba(0,0,0,1)"); v.addColorStop(.12,"rgba(0,0,0,0)"); v.addColorStop(.88,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(0,0,0,1)"); c.globalCompositeOperation="destination-out"; c.fillStyle=v; c.fillRect(0,0,64,256); }, true);
const crack=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:crackTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, fog:false, color:new T.Color(0,0,0)}));
crack.position.z=(PACK_D+.06)/2+.05; pack.add(crack);
const pillarMat=new T.MeshBasicMaterial({map:crackTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, fog:false, color:new T.Color(0,0,0)});
const pillarGeo=new T.PlaneGeometry(1,1); pillarGeo.translate(0,.5,0); const pillar=new T.Mesh(pillarGeo,pillarMat); pillar.visible=false; scene.add(pillar);
/* idea 5: light beams behind the card at the flash (centre beam from the top 20, two side beams from the top 10) */
const beamMat=new T.MeshBasicMaterial({map:crackTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, fog:false, color:new T.Color(0,0,0)});
const beams=[0,1,2].map(()=>{ const b=new T.Mesh(pillarGeo,beamMat); b.visible=false; scene.add(b); return b; });
const packLight=new T.PointLight(L(0xffc457),0,9,2); packLight.position.set(0,1.3,-.4); scene.add(packLight);
const CHUNKS=[]; {
  const qw=(PACK_W+.12)/2, qh=(PACK_H+.12)/2;
  [[0,0],[1,0],[0,1],[1,1]].forEach(([qx,qy])=>{ const g=new T.Group();
    const b=new T.Mesh(new T.BoxGeometry(qw,qh,PACK_D),blackMetal); b.castShadow=true; g.add(b);
    const pg=new T.PlaneGeometry(qw,qh); const uv=pg.attributes.uv; for(let k=0;k<uv.count;k++) uv.setXY(k,qx*.5+uv.getX(k)*.5,qy*.5+uv.getY(k)*.5);
    const f=new T.Mesh(pg,packFace); f.position.z=PACK_D/2+.01; g.add(f); const bk=new T.Mesh(pg,packFace); bk.position.z=-PACK_D/2-.01; bk.rotation.y=Math.PI; g.add(bk);
    g.visible=false; scene.add(g); CHUNKS.push({m:g,off:new T.Vector3((qx-.5)*qw,(qy-.5)*qh,0),v:new T.Vector3(),w:new T.Vector3(),h:.25,on:false}); });
  [-1,1].forEach(sd=>{ const m=new T.Mesh(new T.BoxGeometry(.16,PACK_H+.1,PACK_D+.08),goldMetal); m.castShadow=true; m.visible=false; scene.add(m); CHUNKS.push({m,off:new T.Vector3(sd*(PACK_W/2+.04),0,0),v:new T.Vector3(),w:new T.Vector3(),h:.08,on:false}); });
  for(let k=0;k<8;k++){ const m=new T.Mesh(new T.BoxGeometry(.22,.16,.06),k%2?goldMetal:blackMetal); m.castShadow=true; m.visible=false; scene.add(m); CHUNKS.push({m,off:new T.Vector3((Math.random()-.5)*PACK_W,(Math.random()-.5)*PACK_H,0),v:new T.Vector3(),w:new T.Vector3(),h:.03,on:false,small:1}); }
}
function explodePack(){ pack.updateMatrixWorld();
  CHUNKS.forEach(q=>{ q.m.position.copy(pack.localToWorld(q.off.clone())); q.m.quaternion.copy(pack.quaternion); q.m.scale.setScalar(1);
    const out=q.off.clone().applyQuaternion(pack.quaternion); out.y*=.6; const sp=q.small?4+Math.random()*3:2.6+Math.random()*.8;
    q.v.copy(out.normalize().multiplyScalar(sp)); q.v.z+=q.small?2:.5; q.v.y+=q.small?2:.3;
    const ws=q.small?10:1.4; q.w.set((Math.random()-.5)*ws,(Math.random()-.5)*ws,(Math.random()-.5)*ws); q.on=true; q.m.visible=true; q.age=0; }); }
function stepChunks(dt){ CHUNKS.forEach(q=>{ if(!q.on) return; q.age+=dt; if(q.small||q.age>.45) q.v.y-=(q.small?9.8:5)*dt; q.m.position.addScaledVector(q.v,dt);
  q.m.rotation.x+=q.w.x*dt; q.m.rotation.y+=q.w.y*dt; q.m.rotation.z+=q.w.z*dt;
  if(q.m.position.y<q.h){ q.m.position.y=q.h; q.v.y*=-.32; q.v.x*=.55; q.v.z*=.55; q.w.multiplyScalar(.5); }
  if(q.age>1.4){ const k=Math.max(0,1-(q.age-1.4)/.5); q.m.scale.multiplyScalar(k>0?Math.pow(k,dt*6):0); if(k<=0){ q.on=false; q.m.visible=false; } } }); }
function clearChunks(){ CHUNKS.forEach(q=>{ q.on=false; q.m.visible=false; }); }

const shape=new T.Shape(); SHIELD.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
const card=new T.Group(); scene.add(card);
const cardBody=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelThickness:.025,bevelSize:.04,bevelSegments:3}), goldMetal);
cardBody.geometry.translate(0,0,-.03); cardBody.castShadow=true; card.add(cardBody);
const front=canvasTex(CW*SC,CH*SC,null), back=canvasTex(CW*SC,CH*SC,null);
[front,back].forEach(f=>{ f.tx.repeat.set(1/2.2,1/3.2); f.tx.offset.set(.5,.5); });
const faceGeo=new T.ShapeGeometry(shape);
const frontMat=new T.MeshStandardMaterial({map:front.tx, metalness:.25, roughness:.38, envMapIntensity:.7});
const backMat=new T.MeshStandardMaterial({map:back.tx, metalness:.25, roughness:.38, envMapIntensity:.7});
const frontMesh=new T.Mesh(faceGeo,frontMat); frontMesh.position.z=.058; card.add(frontMesh);
const backMesh=new T.Mesh(faceGeo,backMat); backMesh.position.z=-.058; backMesh.rotation.y=Math.PI; card.add(backMesh);
/* foil layer on both faces: angle-dependent holographic tint, tiny glints, and the light sweep */
const sheenMat=new T.ShaderMaterial({transparent:true, depthWrite:false, blending:T.AdditiveBlending, uniforms:{p:{value:-3},amt:{value:1},t:{value:0},tint:{value:new T.Color(1,.8,.4)}},
  vertexShader:"varying vec2 vP; varying vec3 vV; varying vec3 vN; void main(){ vP=position.xy; vec4 wp=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-wp.xyz); vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*wp; }",
  fragmentShader:`uniform float p,amt,t; uniform vec3 tint; varying vec2 vP; varying vec3 vV; varying vec3 vN;
  void main(){ float f=clamp(1.-abs(dot(vN,vV)),0.,1.); float d=(vP.x*.75+vP.y*.55)-p; float band=exp(-d*d*22.)*.9+exp(-d*d*3.)*.12;
    vec3 holo=.5+.5*cos(6.2831*(vP.x*.35-vP.y*.25+f*1.8+t*.07)+vec3(0.,2.1,4.2)); holo=mix(holo,tint,.55);
    float h=fract(sin(dot(floor(vP*55.),vec2(12.9898,78.233)))*43758.5453); float gl=step(.993,h)*pow(max(0.,sin(t*2.6+h*90.)),14.);
    vec3 c=holo*(.05+f*.55)*.55+vec3(1.)*band*amt*.6+vec3(1.,.95,.8)*gl*1.6; gl_FragColor=vec4(c,1.); }`});
/* idea 8: the rating counts up from 40 on its own small plane over the face (cheap to redraw), then the face is drawn whole */
const COUNT_FROM=40, COUNT_S=[.7,.9,1.1,1.4,1.7];
const ovrTex=canvasTex(280,240,null);
const ovrMat=new T.MeshStandardMaterial({map:ovrTex.tx, transparent:true, depthWrite:false, metalness:.25, roughness:.38, envMapIntensity:.7});
const ovrMesh=new T.Mesh(new T.PlaneGeometry(140/CW*2.2,120/CH*3.2),ovrMat); ovrMesh.position.set(LEFT_X/CW*2.2-1.1,1.6-110/CH*3.2,.0595); ovrMesh.visible=false; card.add(ovrMesh);
const sheenF=new T.Mesh(faceGeo,sheenMat); sheenF.position.z=.061; card.add(sheenF);
const sheenB=new T.Mesh(faceGeo,sheenMat); sheenB.position.z=-.061; sheenB.rotation.y=Math.PI; card.add(sheenB);
const CARD_POS=new T.Vector3(0,1.86,-1.2);
const blobTex=canvasTex(128,128,(c)=>{ const g=c.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,"rgba(0,0,0,.55)"); g.addColorStop(1,"rgba(0,0,0,0)"); c.fillStyle=g; c.fillRect(0,0,128,128); });
const blob=new T.Mesh(new T.PlaneGeometry(3,1.1), new T.MeshBasicMaterial({map:blobTex.tx, transparent:true, depthWrite:false})); blob.rotation.x=-Math.PI/2; blob.position.set(0,.02,-1.2); scene.add(blob);

const coinTex=canvasTex(1024,1024,null);
const coinFaceMat=new T.MeshStandardMaterial({map:coinTex.tx, metalness:.55, roughness:.28, envMapIntensity:1.3});
const coinEdgeTex=canvasTex(512,32,(c)=>{ c.fillStyle="#d9a644"; c.fillRect(0,0,512,32); c.fillStyle="#8d621d"; for(let x=0;x<512;x+=6) c.fillRect(x,0,2,32); });
coinEdgeTex.tx.wrapS=T.RepeatWrapping; coinEdgeTex.tx.repeat.set(8,1);
const coin=new T.Mesh(new T.CylinderGeometry(1,1,.2,96,1), [new T.MeshStandardMaterial({map:coinEdgeTex.tx, metalness:1, roughness:.3}),coinFaceMat,coinFaceMat]);
coin.castShadow=true; scene.add(coin);
const COIN_R=.62, COIN_SPIN=Math.PI/2;

const raysTex=canvasTex(512,512,(c)=>{ c.translate(256,256); const r=seeded(9); for(let i=0;i<36;i++){ const a=i/36*Math.PI*2+r()*.08, w=.025+r()*.05; const g=c.createLinearGradient(0,0,Math.cos(a)*256,Math.sin(a)*256); g.addColorStop(0,"rgba(255,255,255,.9)"); g.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=g; c.beginPath(); c.moveTo(0,0); c.arc(0,0,256,a-w,a+w); c.closePath(); c.fill(); } }, true);
const rays=new T.Mesh(new T.PlaneGeometry(1,1), new T.MeshBasicMaterial({map:raysTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, opacity:0, fog:false, color:new T.Color(.35,.35,.35)}));
rays.position.set(0,1.9,-1.5); rays.scale.set(14,14,1); scene.add(rays);
const glowTex=canvasTex(256,256,(c)=>{ const g=c.createRadialGradient(128,128,0,128,128,128); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.2,"rgba(255,255,255,.5)"); g.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=g; c.fillRect(0,0,256,256); }, true);
const aura=new T.Sprite(new T.SpriteMaterial({map:glowTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, fog:false, opacity:0})); aura.position.set(0,1.86,-1.65); aura.visible=false; scene.add(aura);
const glow=new T.Sprite(new T.SpriteMaterial({map:glowTex.tx, transparent:true, depthWrite:false, blending:T.AdditiveBlending, fog:false})); glow.scale.set(0,0,1); glow.position.set(0,1.86,-1.3); scene.add(glow);

/* reflections for the gold: capture the stadium once */
const pmrem=new T.PMREMGenerator(renderer);
/* Big Jump: the photo panorama is the stadium. It is drawn on a sphere that follows the camera,
   pre-compensated so the film curve in the final pass gives back the photo's own colours. */
let pano=null;
const panoMat=new T.ShaderMaterial({side:T.BackSide, depthWrite:false, depthTest:false, fog:false, uniforms:{tex:{value:null},plate:{value:null},hasPlate:{value:0},plateL:{value:null},hasL:{value:0},plateR:{value:null},hasR:{value:0},yaw:{value:0},expo:{value:.9}},
  vertexShader:"varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader:`uniform sampler2D tex,plate,plateL,plateR; uniform float yaw,expo,hasPlate,hasL,hasR; varying vec3 vD;
  vec3 plateMix(vec3 c, vec3 d, sampler2D pl, float a){ vec3 q=vec3(d.x*cos(a)+d.z*sin(a), d.y, -d.x*sin(a)+d.z*cos(a)); if(q.z>-.2) return c; vec2 g=q.xy/(-q.z); vec2 pu=vec2(.5+g.x/1.453, (g.y+.098)/.8177);
    float m=smoothstep(0.,.09,pu.x)*smoothstep(1.,.91,pu.x)*smoothstep(0.,.04,pu.y)*smoothstep(1.,.8,pu.y); return m>0.?mix(c,pow(texture2D(pl,clamp(pu,0.,1.)).rgb,vec3(2.2)),m):c; }
  vec3 invAces(vec3 y){ y=min(y,vec3(.985)); vec3 a=2.51-2.43*y, b=.03-.59*y, c=-.14*y; return (-b+sqrt(b*b-4.*a*c))/(2.*a); }
  void main(){ vec3 d=normalize(vD); float lon=atan(d.x,-d.z)+yaw; vec2 uv=vec2(fract(lon/6.2831853+.5), asin(clamp(d.y,-1.,1.))/3.1415926+.5);
    vec3 c=pow(texture2D(tex,uv).rgb,vec3(2.2));
    if(hasL>.5) c=plateMix(c,d,plateL,yaw-1.2566); if(hasR>.5) c=plateMix(c,d,plateR,yaw+1.2566);
    if(hasPlate>.5) c=plateMix(c,d,plate,yaw);
    gl_FragColor=vec4(min(invAces(c)/expo,vec3(1.35)),1.); }`});
const panoSphere=new T.Mesh(new T.SphereGeometry(400,64,32),panoMat); panoSphere.renderOrder=-1; panoSphere.frustumCulled=false;
const grassMat=new T.MeshStandardMaterial({color:L(0xc9d9b4), roughness:.92, metalness:0, transparent:true, depthWrite:true});
grassMat.onBeforeCompile=(sh)=>{
  sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vWp;").replace("#include <worldpos_vertex>","#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;");
  sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vWp;")
   .replace("#include <map_fragment>","#include <map_fragment>\n float st=smoothstep(.46,.54,abs(fract(vWp.x/11.+.25)-.5)*2.); diffuseColor.rgb*=mix(1.07,.88,st); float dd=length(vWp.xz-cameraPosition.xz); diffuseColor.a*=1.-smoothstep(26.,46.,dd);")
   .replace("#include <dithering_fragment>","#include <dithering_fragment>\n gl_FragColor.a=diffuseColor.a;"); };
const shadowGround=new T.Mesh(new T.PlaneGeometry(110,110),grassMat); shadowGround.rotation.x=-Math.PI/2; shadowGround.position.y=0; shadowGround.receiveShadow=true;
function loadGrass(){ return new Promise(res=>new T.TextureLoader().load("assets/grass.jpg",t=>{ t.wrapS=t.wrapT=T.MirroredRepeatWrapping; t.repeat.set(110/2.4,110/2.4); t.encoding=T.sRGBEncoding; t.anisotropy=renderer.capabilities.getMaxAnisotropy(); grassMat.map=t; grassMat.needsUpdate=true; res(); },undefined,()=>res())); }
function loadPackArt(){ return new Promise(res=>new T.TextureLoader().load("assets/pack.jpg",t=>{ t.encoding=T.sRGBEncoding; t.anisotropy=8; packFace.map=t; packFace.metalness=.35; packFace.roughness=.35; packFace.needsUpdate=true; res(); },undefined,()=>res())); }
function loadSide(f,u,h){ return new Promise(res=>new T.TextureLoader().load(f,t=>{ t.generateMipmaps=false; t.minFilter=T.LinearFilter; panoMat.uniforms[u].value=t; panoMat.uniforms[h].value=1; res(); },undefined,()=>res())); }
/* pitch-side LED boards (ticket 1850-5) in front of the main stand. HO-049: board.jpg holds two stacked messages, one per panel
   (FIFA 17 SHOWDOWN on top, SPECIAL PLAYER below); every panel shows one whole message and they roll up in turn, so no word crosses a join */
const boards=new T.Group(); let boardTex=null, boardTex2=null;
function loadBoards(){ return new Promise(res=>new T.TextureLoader().load("assets/board.jpg",t=>{ t.encoding=T.sRGBEncoding; t.wrapT=T.RepeatWrapping; t.repeat.set(1,.5); t.anisotropy=8; boardTex=t;
  boardTex2=t.clone(); boardTex2.needsUpdate=true;
  const face=new T.MeshBasicMaterial({map:t, fog:false}); face.color.setScalar(1.25); const face2=face.clone(); face2.map=boardTex2;
  const frame=new T.MeshStandardMaterial({color:L(0x0b0b0c), roughness:.6, metalness:.3});
  for(let i=-4;i<=4;i++){ const g=new T.Group(); const box=new T.Mesh(new T.BoxGeometry(9.6,1.66,.3),frame); box.position.y=.83; g.add(box);
    const f=new T.Mesh(new T.PlaneGeometry(9.5,1.58),i&1?face2:face); f.position.set(0,.83,.3); g.add(f); g.position.set(i*9.62,0,-15); boards.add(g); }
  res(); },undefined,()=>res())); }
/* HO-049: hold each message 4.4 s, then roll it up over .6 s (a cut with reduced motion) */
function stepBoards(now){ if(!boardTex) return; const P=5, R=.6, k=now%P, n=Math.floor(now/P), r=REDUCED?(k>=P-R?1:0):ease.inOut(clamp01((k-(P-R))/R));
  const y=((n+r)*.5)%1; boardTex.offset.y=y; boardTex2.offset.y=(y+.5)%1; }
function loadPlate(){ return new Promise(res=>new T.TextureLoader().load("assets/stand.jpg",t=>{ t.generateMipmaps=false; t.minFilter=T.LinearFilter; panoMat.uniforms.plate.value=t; panoMat.uniforms.hasPlate.value=1; res(); },undefined,()=>res())); }
function buildEnv(){
  const keep=new Set([pack,card,coin,points,confetti,rays,glow,aura,blob,sun,sun.target,packLight]); smoke.forEach(q=>keep.add(q.sp)); CHUNKS.forEach(q=>keep.add(q.m)); keep.add(pillar); beams.forEach(b=>keep.add(b)); keep.add(boards); flags.forEach(f=>keep.add(f.mesh));
  scene.children.slice().forEach(o=>{ if(!keep.has(o)&&!o.isLight) scene.remove(o); });
  scene.fog=null; scene.add(panoSphere,shadowGround,boards);
  panoMat.uniforms.tex.value=pano;
  const e=pano.clone(); e.needsUpdate=true; e.mapping=T.EquirectangularReflectionMapping; e.encoding=T.sRGBEncoding; scene.environment=pmrem.fromEquirectangular(e).texture;
}
/* r86 (red team #2): the stadium is the one image the scene cannot draw without, so a failed load ends the page at once (the game skips the reveal) instead of waiting out the 15 s limit */
function loadPano(){ return new Promise((res,rej)=>new T.TextureLoader().load("assets/stadium.jpg",t=>{ t.generateMipmaps=false; t.minFilter=T.LinearFilter; t.magFilter=T.LinearFilter; t.anisotropy=1; pano=t; res(); },undefined,()=>rej(new Error("The stadium image did not load.")))); }

/* ================= timeline ================= */
const ease={ out:(t)=>1-Math.pow(1-t,3), inOut:(t)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, outQuint:(t)=>1-Math.pow(1-t,5) };
const clamp01=(x)=>Math.max(0,Math.min(1,x));
const quadInOut=(t)=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
/* idea 1 by tier: top 3 and top 10 get all of the crescendo, top 20 a lighter one, top 50 and rank 51+ only the riser */
const CRES=[0,0,.5,1,1];
const lerp=(a,b,k)=>a+(b-a)*k;
const mpByIdx=(i)=>mpCard(MP_LIST[Math.max(0,Math.min(MP_LIST.length-1,i))]); let pickD=4, pickN=12; const qs=new URLSearchParams(location.search); if(qs.get('d')) pickD=+qs.get('d'); if(qs.get('n')) pickN=+qs.get('n');
let bothShown=false, guardUntil=0, whoText="", PK=1, packPulse=0;
let roll=0, pair={daniel:mpByIdx(pickD), nik:mpByIdx(pickN)}, order=["daniel","nik"], idx=0, t0=0, phase="run", shake=0, settledAt=0, fired={}, flash=0, pulse=0;
const $=(id)=>document.getElementById(id);
const who=$("who"), slotD=$("slotD"), slotN=$("slotN"), cta=$("cta"), live=$("live"), l3=$("l3");
const cur=()=>pair[order[idx]];
function setWho(text){ whoText=text; if(!who.classList.contains("hint")) who.textContent=text; }
function hint(on){ who.classList.toggle("hint",on); who.textContent=on?"Tap again to skip":whoText; }
const natCols=(code)=>NATION_COLORS[code]||[0xffffff];
/* idea 1: a short slow-motion freeze on the face turn, just before the white burst (which itself is unchanged): the clock runs at
   .2x for FREEZE_S real seconds ending at FREEZE_END. Top 3 .2 s, top 10 .16 s, top 20 .1 s, top 50 and rank 51+ none. */
const FREEZE_S=[0,0,.1,.16,.2], FREEZE_END=9.58, FREEZE_K=.2; let freezeS=0;
const freezeAt=(t)=>freezeS&&t>=FREEZE_END-freezeS*FREEZE_K&&t<FREEZE_END?FREEZE_K:1;
let vtt=0; const slowAt=(t)=>REDUCED?1:Math.min(1-.68*Math.max(0,Math.min(1,(t-3.6)/.12,(4.15-t)/.2)),freezeAt(t)); let camK=1, camRest=new T.Vector3(0,1.05,6.6), lookRest=new T.Vector3(0,2.15,-1.2), coinStopX=-2.2, coinLift=0;
const COIN_ON_CARD=new T.Vector3(-1.1+112/CW*2.2, CARD_POS.y+1.6-304/CH*3.2, CARD_POS.z+.07);
function startPlayer(i,bridge){
  idx=i; const p=cur(); fired={}; t0=clock(); vtt=bridge?BRIDGE_T0:0; phase="run"; camBlendAt=-1; if(!bridge) who.classList.remove("big");
  if(bridge){ camBlendAt=clock(); camFrom.copy(camPos); lookFrom.copy(camLook); } flash=0; SFX.bed(.05); freezeS=FREEZE_S[tierLevel(p.tier)]; aura.visible=false; endSig(); tiltX=tiltY=tiltTX=tiltTY=0;
  if(packFace.map===packTex.tx){ drawPack(packTex.ctx,512,736); packTex.tx.needsUpdate=true; } sheenMat.uniforms.tint.value.copy(L(TIER[p.tier].glow)); packFace.emissive.setRGB(0,0,0);
  drawCardBack(back.ctx,p,0); back.tx.needsUpdate=true; drawCardFront(front.ctx,p,true); front.tx.needsUpdate=true; frontFull=false; count=null; ovrMesh.visible=false;
  coinTex.ctx.setTransform(1,0,0,1,0,0); coinTex.ctx.clearRect(0,0,1024,1024); coinFace(coinTex.ctx,p.club,512,512,510); coinTex.tx.needsUpdate=true;
  if(!bridge){ flags.forEach(f=>{f.target=0; f.drop=0; f.rolling=false; f.mesh.visible=false; f.mesh.scale.y=.001;}); clearConfetti(); parts.forEach(q=>q.life=0); pDirty=true; } /* idea 3: Daniel's flags roll up and his confetti lands */
  clearSmoke(); clearChunks(); pillar.visible=false; crack.material.color.setScalar(0); packLight.intensity=0; pack.position.set(0,40,-1.2); pack.scale.setScalar(1);
  frontMat.map=back.tx; frontMat.needsUpdate=true;
  card.visible=false; coin.visible=false; pack.visible=true; rays.material.opacity=0; l3.classList.remove("on");
  setWho((order[idx]==="daniel"?"Daniel's":"Nik's")+" Special Player");
  if(i===0){ slotD.textContent="Revealing"; slotD.className="wait"; slotN.textContent="Next"; slotN.className="wait"; cta.disabled=!bothShown||Boolean(cta.dataset.sent); $("again").hidden=true; cta.classList.remove("shine","fast"); $("rkD").textContent=""; $("rkN").textContent=""; }
  else { slotN.textContent="Revealing"; slotN.className="wait"; }
  if(REDUCED) settle();
}
/* after the face: flip to the scouting card, hold, flip back to the face */
/* Nik 2026-10-29: the face holds longer before the flip, by tier: top 3 x6, top 10 x5, top 20 x4, top 50 x3, top 300 x2 of 1.5 s */
const SCOUT_IN_BASE=1.5, SCOUT_HOLD=3.4, SCOUT_X={ "black-blue-gold":6, "blue-gold":5, "gold":4, "silver":3, "bronze":2 };
const scoutInFor=(tier)=>SCOUT_IN_BASE*(SCOUT_X[tier]||2), scoutEndFor=(tier)=>scoutInFor(tier)+.7+SCOUT_HOLD+.7;
let SCOUT_IN=scoutInFor("bronze"), SCOUT_END=scoutEndFor("bronze");
function scoutFlip(k){ const e=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, a=SCOUT_IN, b=a+.7, c=b+SCOUT_HOLD, d=c+.7;
  if(k>=a&&!fired.sc1){ fired.sc1=1; SFX.play("flip"); } if(k>=c&&!fired.sc2){ fired.sc2=1; SFX.play("flip"); }
  return k<a?0:k<b?Math.PI*e((k-a)/.7):k<c?Math.PI:k<d?Math.PI+Math.PI*e((k-c)/.7):0; }
function settle(natural){
  const p=cur(); phase="settled"; if(!natural) endSig(); if(!natural||!count) finishCount(); guardUntil=0; hint(false); SFX.play("sting",tierLevel(p.tier)); SFX.bed(.05+tierLevel(p.tier)*.008); settledAt=clock(); fired.sc1=fired.sc2=0; SCOUT_IN=scoutInFor(p.tier); SCOUT_END=scoutEndFor(p.tier);
  drawScoutBack(back.ctx,p); back.tx.needsUpdate=true;
  frontMat.map=front.tx; frontMat.needsUpdate=true;
  pack.visible=false; coin.visible=false; packLight.intensity=0; card.visible=true; card.position.copy(CARD_POS); card.rotation.set(0,0,0); card.scale.setScalar(1);
  rays.material.opacity=.16; rays.material.color.copy(L(TIER[p.tier].glow)).multiplyScalar(.35);
  
  const slot=order[idx]==="daniel"?slotD:slotN; slot.textContent=p.name; slot.className=""; $(order[idx]==="daniel"?"rkD":"rkN").textContent="#"+p.rank+" "+TIERLABEL[p.tier];
  $("l3tag").textContent=(order[idx]==="daniel"?"01 · Daniel":"02 · Nik")+" · #"+p.rank+" "+TIERLABEL[p.tier];
  $("l3name").textContent=p.name;
  $("l3meta").innerHTML=`<span><i>${p.ovr}</i> ${p.pos}</span><span>${NATION[p.nation]}</span><span>${p.club||"No club"}</span><span><i>#${p.number}</i></span>`;
  l3.classList.add("on");
  live.textContent=`${order[idx]==="daniel"?"Daniel":"Nik"}'s FIFA 17 Showdown Special Player: ${p.name}, ${p.pos}, ${NATION[p.nation]}, ${p.club||"no club"}, number ${p.number}, overall ${p.ovr}, potential ${p.pot}, rank ${p.rank}.`;
  if(idx===1){ bothShown=true; if(!cta.dataset.sent){ cta.disabled=false; $("again").hidden=false; } ending(); }
}
const S=(at,dur,tt)=>clamp01((tt-at)/dur);

/* ================= sound (Web Audio, all synthesized, no files) ================= */
const SFX=(()=>{ let ctx=null, master=null, verb=null, on=false, noiseBuf=null, bedG=null, bedLevel=0, bedNow=-1;
  function init(){ if(ctx) return; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; ctx=new AC(); master=ctx.createGain(); master.gain.value=.8;
    const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; master.connect(comp); comp.connect(ctx.destination);
    noiseBuf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate); const d=noiseBuf.getChannelData(0); let b=0; for(let i=0;i<d.length;i++){ const w=Math.random()*2-1; b=.97*b+.03*w; d[i]=w*.6+b*3; }
    verb=ctx.createConvolver(); const L=ctx.sampleRate*2.2, ir=ctx.createBuffer(2,L,ctx.sampleRate); for(let c=0;c<2;c++){ const x=ir.getChannelData(c); for(let i=0;i<L;i++) x[i]=(Math.random()*2-1)*Math.pow(1-i/L,3); } verb.buffer=ir; const vg=ctx.createGain(); vg.gain.value=.35; verb.connect(vg); vg.connect(master); }
  const now=()=>ctx.currentTime;
  function out(node,pan,wet){ let n=node; if(pan&&ctx.createStereoPanner){ const p=ctx.createStereoPanner(); p.pan.value=pan; n.connect(p); n=p; } n.connect(master); if(wet) n.connect(verb); return n; }
  function env(g,t,a,peak,d){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  function noise(t,dur,type,f0,f1,q,peak,a,pan,wet){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; const f=ctx.createBiquadFilter(); f.type=type; f.Q.value=q; f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=ctx.createGain(); env(g,t,a,peak,Math.max(.05,dur-a)); s.connect(f); f.connect(g); out(g,pan,wet); s.start(t,Math.random()*2); s.stop(t+dur+.1); }
  function tone(t,type,f0,f1,dur,peak,a,pan,wet){ const o=ctx.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1!==f0) o.frequency.exponentialRampToValueAtTime(f1,t+dur); const g=ctx.createGain(); env(g,t,a,peak,dur); o.connect(g); out(g,pan,wet); o.start(t); o.stop(t+a+dur+.05); }
  const fx={
    whoosh:(pw)=>{ const t=now(); noise(t,.9,"bandpass",300,2400,1.4,.5,.35,0,true); },
    land:()=>{ const t=now(); tone(t,"sine",90,38,.5,1.0,.005); noise(t,.35,"lowpass",900,120,.7,.6,.004,0,true); noise(t+.02,.6,"highpass",4000,9000,.5,.08,.01,0,true); },
    charge:()=>{ const t=now(); const o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(70,t); o.frequency.exponentialRampToValueAtTime(330,t+1.45); const f=ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2600,t+1.45); const g=ctx.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.22,t+1.35); g.gain.exponentialRampToValueAtTime(.0001,t+1.5); o.connect(f); f.connect(g); out(g,0,true); o.start(t); o.stop(t+1.55); noise(t,1.45,"bandpass",500,5000,3,.12,1.3,0,false); },
    crack:()=>{ const t=now(); for(let i=0;i<4;i++) noise(t+i*.035,.08,"highpass",2500,6000,.8,.5-i*.08,.002,0,true); tone(t,"triangle",1800,900,.4,.18,.003,0,true); },
    comet:(side)=>{ const t=now(); const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; const f=ctx.createBiquadFilter(); f.type="bandpass"; f.Q.value=2; f.frequency.setValueAtTime(800,t); f.frequency.exponentialRampToValueAtTime(3800,t+.55); f.frequency.exponentialRampToValueAtTime(1200,t+1.1); const g=ctx.createGain(); env(g,t,.4,.45,.8); const p=ctx.createStereoPanner?ctx.createStereoPanner():null; s.connect(f); f.connect(g); if(p){ p.pan.setValueAtTime(-.9*side,t); p.pan.linearRampToValueAtTime(.9*side,t+1.2); g.connect(p); p.connect(master); p.connect(verb); } else { g.connect(master); } s.start(t); s.stop(t+1.3); tone(t+.1,"sine",1400,2600,.9,.05,.3,0,true); },
    /* idea 6: the boom gets longer with the tier (1.6 s at rank 51+, 2.8 s for the top 3) */
    boom:(pw,lvl)=>{ const t=now(), k=Math.min(1.3,.75+pw*.3), L=1.6+(lvl||0)*.3; tone(t,"sine",70,28,L,1.0*k,.005); noise(t,L,"lowpass",2600,90,.6,.9*k,.004,0,true); noise(t,1.2,"highpass",3000,8000,.4,.18*k,.01,0,true);
      [1568,2093,2637,3136,4186].forEach((f,i)=>tone(t+.05+i*.06,"sine",f,f,1.6,.05*k,.004,(i%2?.4:-.4),true)); },
    crowd:(dur,lvl)=>{ const t=now(); [[-.6,500,1400],[.6,700,2200],[0,350,900]].forEach(([pan,f0,f1])=>{ const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; const f=ctx.createBiquadFilter(); f.type="bandpass"; f.Q.value=.7; f.frequency.setValueAtTime(f0,t); f.frequency.linearRampToValueAtTime(f1,t+dur*.4); const g=ctx.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.16*lvl,t+dur*.3); g.gain.setValueAtTime(.16*lvl,t+dur*.6); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=2.3+Math.random()*2; lg.gain.value=.04*lvl; lfo.connect(lg); lg.connect(g.gain); s.connect(f); f.connect(g); out(g,pan,true); s.start(t,Math.random()*2); s.stop(t+dur+.1); lfo.start(t); lfo.stop(t+dur+.1); }); },
    hit:(n)=>{ const t=now(), f=[523.25,659.25,783.99,1046.5][n]||523.25; tone(t,"triangle",f,f,1.2,.22,.004,0,true); tone(t,"sine",f*2,f*2,.9,.08,.004,0,true); tone(t,"sine",f/2,f/2,.6,.18,.004,0,false); noise(t,.25,"lowpass",3000,200,.7,.25,.003,0,true); },
    coin:()=>{ const t=now(); for(let i=0;i<14;i++){ const tt=t+i*.11*(1-i*.03); tone(tt,"sine",2400+((i*733)%900),2200,.18,.05,.002,(i%2?.3:-.3),true); } },
    pops:(n)=>{ const t=now(); for(let i=0;i<n;i++){ const tt=t+i*.17+Math.random()*.1; noise(tt,.22,"bandpass",1800,500,1,.35,.002,(Math.random()-.5)*1.6,true); noise(tt+.2,.9,"highpass",5000,9000,.5,.05,.05,(Math.random()-.5)*1.6,true); } },
    cannon:()=>{ const t=now(); [-.8,.8].forEach((pan,i)=>{ noise(t+i*.05,.3,"lowpass",1500,200,.8,.7,.002,pan,true); noise(t+.05+i*.05,.9,"highpass",3000,6000,.4,.08,.05,pan,true); }); },
    flip:()=>{ const t=now(); noise(t,.45,"bandpass",600,3200,1.6,.35,.12,0,true); },
    /* idea 4: a rising tick for each step of the pack's colour ladder */
    /* idea 1: a riser from the club clue into the burst; it stops just before the burst, so the freeze is a quiet beat */
    riser:(dur,lvl)=>{ const t=now(), o=ctx.createOscillator(); o.type="sawtooth"; o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(700+lvl*120,t+dur); const f=ctx.createBiquadFilter(); f.type="lowpass"; f.Q.value=5; f.frequency.setValueAtTime(380,t); f.frequency.exponentialRampToValueAtTime(5200,t+dur);
      const g=ctx.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.1+lvl*.025,t+dur-.02); g.gain.exponentialRampToValueAtTime(.0001,t+dur+.03); o.connect(f); f.connect(g); out(g,0,true); o.start(t); o.stop(t+dur+.1); noise(t,dur,"bandpass",600,7000,2.5,.08+lvl*.03,dur-.05,0,false); },
    /* idea 8: the rating count's tick, and a brighter one when it lands */
    count:(last)=>{ const t=now(); if(last){ tone(t,"triangle",1760,1760,.3,.09,.002,0,true); return; } tone(t,"square",2300,2100,.025,.022,.001,0,false); },
    /* idea 11: the closing chord when both cards are out (wider after a top-3 pull) */
    close:(top)=>{ const t=now(); [261.63,329.63,392,523.25,659.25].concat(top?[783.99,1046.5]:[]).forEach((f,i)=>{ tone(t+i*.05,"triangle",f,f,2.2,.08,.09,(i%3-1)*.3,true); tone(t+i*.05,"sine",f/2,f/2,2.4,.045,.12,0,false); }); },
    step:(i)=>{ const t=now(), f=523.25*Math.pow(2,i*3/12); tone(t,"triangle",f,f*1.01,.22,.15,.003,0,true); tone(t,"sine",f*2,f*2,.14,.05,.003,0,true); noise(t,.06,"highpass",5000,8000,.6,.08,.002,0,false); },
    /* idea 6: a bigger chord for a higher tier (4 notes at rank 51+, 9 with the low octaves and the shimmer for the top 3) */
    chord:(lvl)=>{ const t=now(), N=[[523.25],[659.25],[783.99],[1046.5],[1318.51,2],[261.63,3],[1567.98,3],[2093,4],[130.81,4]].filter(n=>(n[1]||0)<=lvl).map(n=>n[0]), g=.26/Math.sqrt(N.length/3);
      N.forEach((f,i)=>{ tone(t+i*.012,"triangle",f,f,1.4+lvl*.25,g,.004,(i%3-1)*.35,true); if(f>500&&f<1600) tone(t,"sine",f*2,f*2,1+lvl*.2,g*.3,.004,0,true); });
      tone(t,"sine",130.81,130.81,.8+lvl*.3,.18,.004,0,false); noise(t,.25,"lowpass",3000,200,.7,.25,.003,0,true); },
    flash:(pw,lvl)=>{ lvl=lvl||0; fx.boom(pw,lvl); fx.crowd(5+lvl*1.2,1+lvl*.15); fx.pops(4+lvl*2); fx.chord(lvl); },
    /* idea 6: a short sting when the card settles, brighter and with more notes for a higher tier */
    sting:(lvl)=>{ const t=now(), b=[392,440,523.25,587.33,659.25][lvl]||392; [1,1.25,1.5,2,2.5].slice(0,2+Math.ceil(lvl*.75)).forEach((m,i)=>tone(t+i*.075,"triangle",b*m,b*m,.45+lvl*.06,.11,.004,(i%2?.3:-.3),true)); }
  };
  /* idea 6: a quiet crowd bed under the whole reveal, from the first second; it follows the speaker (off = silent) */
  function bedStart(){ const s=ctx.createBufferSource(); s.buffer=noiseBuf; s.loop=true; const f=ctx.createBiquadFilter(); f.type="bandpass"; f.Q.value=.6; f.frequency.value=650; const lp=ctx.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=2200;
    const wob=ctx.createGain(); wob.gain.value=1; const lfo=ctx.createOscillator(), lg=ctx.createGain(); lfo.frequency.value=.29; lg.gain.value=.25; lfo.connect(lg); lg.connect(wob.gain);
    bedG=ctx.createGain(); bedG.gain.value=.0001; s.connect(f); f.connect(lp); lp.connect(wob); wob.connect(bedG); out(bedG,0,true); s.start(); lfo.start(); }
  function bedApply(){ if(!ctx||ctx.state!=="running") return; const want=on?bedLevel:0; if(want===bedNow) return; bedNow=want; if(!bedG){ if(!want) return; bedStart(); } bedG.gain.setTargetAtTime(Math.max(.0001,want),now(),want?.8:.12); }
  return { get on(){ return on; }, enable(v){ on=v; if(v){ init(); if(ctx&&ctx.state==="suspended") ctx.resume(); } bedApply(); },
    bed(level){ bedLevel=level; bedApply(); }, tick(){ bedApply(); },
    /* A context the browser has not let start yet (no tap in this frame) would queue every cue and play them all at once on the
       first tap, so cues are only played while it runs. */
    get running(){ return Boolean(ctx&&ctx.state==="running"); },
    play(name,...a){ if(!on||!ctx||ctx.state!=="running") return; try{ fx[name](...a); }catch(e){} } };
})();

/* idea 10: a short phone buzz at the pack boom, each clue and the face flash, longer for a higher tier. Android only: where the
   browser has no vibrate (iPhone, most Chromebooks) nothing happens, and nothing buzzes while the speaker is off. Each buzz
   lands on a beat that is also seen. A beat more than .3 s late (skip, seek) stays still. */
const CAN_BUZZ=typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";
function buzz(pattern){ if(!CAN_BUZZ||!SFX.on||REDUCED) return; try{ navigator.vibrate(pattern); }catch(e){} }
function buzzAt(tt,t,k,pattern){ if(tt>=t&&!fired[k]){ fired[k]=1; if(tt-t<.3) buzz(pattern); } }
function at(tt,t,k,fn){ if(tt>=t&&!fired[k]){ fired[k]=1; fn(); } }
/* sound cues; a cue more than .3 s late (skip, seek) stays silent */
function sfxAt(tt,t,k,name,...a){ if(tt>=t&&!fired[k]){ fired[k]=1; if(tt-t<.6) SFX.play(name,...a); } }
const camPos=new T.Vector3(), camLook=new T.Vector3();
/* idea 4: colour ladder on the pack while it charges: bronze, silver, gold, blue, black-blue-gold. A step every LADDER_DT from
   LADDER_T0; the last step is the real tier (rank 51+ stops at bronze, the top 3 climbs all five), so it never shows more. */
/* bronze is a muted copper and silver a cool blue-white, so neither reads as the pack's own gold */
const LADDER=[0xa85a30,0xb9c8e0,0xffc74f,0x4f8bff,0x3355ff], LADDER_ACC=[0x9c5530,0xc4d2ea,0xffc74f,0x9cc4ff,0xffc74f], LADDER_BASE=0xffc457;
const ladderStep=(p,tt)=>tt<LADDER_T0?-1:Math.min(tierLevel(p.tier),Math.floor((tt-LADDER_T0)/LADDER_DT));
const ladC=new T.Color(), ladA=new T.Color();
function ladderMix(out,cols,p,tt){ const st=ladderStep(p,tt); if(st<0) return out.copy(L(LADDER_BASE)); const k=clamp01((tt-LADDER_T0-st*LADDER_DT)/.12); return out.copy(L(st?cols[st-1]:LADDER_BASE)).lerp(L(cols[st]),k); }
const ladderColor=(p,tt)=>ladderMix(ladC,LADDER,p,tt), ladderAccent=(p,tt)=>ladderMix(ladA,LADDER_ACC,p,tt);
function comet(tt,t,dur,a,b,c,col){ const k=(tt-t)/dur; if(k<0||k>1) return; const e=ease.inOut(k), u=1-e;
  const h=new T.Vector3(u*u*a.x+2*u*e*b.x+e*e*c.x, u*u*a.y+2*u*e*b.y+e*e*c.y, u*u*a.z+2*u*e*b.z+e*e*c.z);
  for(let i=0;i<14;i++) emit(h.clone().add(new T.Vector3((Math.random()-.5)*.12,(Math.random()-.5)*.12,(Math.random()-.5)*.12)),new T.Vector3((Math.random()-.5)*.5,(Math.random()-.5)*.5,(Math.random()-.5)*.5),i%3?col:0xffffff,.35+Math.random()*.25,.12+Math.random()*.1,0,1.5,1);
  emit(h,new T.Vector3(),0xffffff,.06,.9,0,0,0); }
function run(tt){
  const p=cur(), tier=TIER[p.tier], pw=tier.power, tc=tier.glow, nat=natCols(p.nation), lvl=tierLevel(p.tier);
  const side=idx===0?1:-1, BLUE=0x58b8ff;
  /* camera, shot by shot like the reference: low on the grass facing the main stand */
  const zk=(z)=>-1.2+(z+1.2)*camK; const A=new T.Vector3(2.6*side,1.0,zk(7.6)), Bp=new T.Vector3(1.1*side,.95,zk(6.4)), Cp=new T.Vector3(.55*side,1.0,zk(5.1)), D=camRest.clone();
  const lookStand=new T.Vector3(.4*side,3.2,-30), lookPack=new T.Vector3(0,1.6,-1.2);
  if(tt<1.6){ const k=ease.inOut(S(0,1.6,tt)); camPos.lerpVectors(A,Bp,k); camLook.lerpVectors(lookStand,lookPack,ease.inOut(S(.7,.9,tt))); }
  else if(tt<3.7){ const k=ease.inOut(S(1.6,2.1,tt)); camPos.lerpVectors(Bp,Cp,k); camLook.copy(lookPack); camLook.y+=S(2.6,1.1,tt)*.2; }
  else { const k=ease.out(S(3.7,1.1,tt)); camPos.lerpVectors(Cp,D,k); camLook.lerpVectors(new T.Vector3(0,1.45,-1.2),lookRest,k); camPos.z-=ease.inOut(S(4.8,6,tt))*(camK>1?.1:.5);
    /* idea 1: a small camera push from the club clue into the turn, back out by the time the card settles */
    camPos.z-=.12*CRES[lvl]*(ease.inOut(S(8.0,1.6,tt))-ease.inOut(S(9.7,1.1,tt))); }
  { const orb=Math.sin(S(4.6,4.3,tt)*Math.PI)*.2*side; const dx=camPos.x-CARD_POS.x, dz=camPos.z-CARD_POS.z; camPos.x=CARD_POS.x+dx*Math.cos(orb)+dz*Math.sin(orb); camPos.z=CARD_POS.z-dx*Math.sin(orb)+dz*Math.cos(orb); }
  roll=Math.sin(S(8.9,1.2,tt)*Math.PI)*.03*side;
  /* 1  the pack drops from the sky and thumps onto the grass (1.0 - 1.6 s) */
  const fall=S(.9,.75,tt), fk=1-Math.pow(1-fall,3);
  pack.visible=tt>=.9&&tt<3.7;
  if(pack.visible){ pack.position.set(PACK_REST.x,lerp(9,PACK_REST.y,fk)+Math.sin(tt*1.7)*.05*fall,PACK_REST.z);
    pack.rotation.set(-.12+(1-fk)*.9,.72*side*(1-S(2.2,1.3,tt)*.45)+Math.sin(tt*.6)*.06+(1-fk)*1.6*side,(1-fk)*.5*side); pack.scale.setScalar(1+packPulse*.06);
    /* idea 4: the charge climbs the colour ladder up to the real tier, never past it */
    const lad=ladderColor(p,tt), ladA=ladderAccent(p,tt);
    for(let i=0;i<=lvl;i++){ const at0=LADDER_T0+i*LADDER_DT; at(tt,at0,"lad"+i,()=>{ if(tt-at0<.3) SFX.play("step",i); packPulse=1; burst(PACK_REST.clone().add(new T.Vector3(0,0,.4)),LADDER[i],Math.round(46*PK),3.6,.55,.13); }); }
    const charge=S(2.3,1.4,tt); packFace.emissive.copy(lad).multiplyScalar(charge*charge*.4);
    if(charge>.5){ pack.position.x+=(Math.random()-.5)*.05*charge; pack.position.y+=(Math.random()-.5)*.03*charge; }
    keepPackUnderTitle();
    /* the crack opens (2.4 s) and a pillar of light shoots up through it */
    const cr=S(2.4,.25,tt); crack.scale.set(.05+charge*.12,PACK_H*.97*cr,1); crack.material.color.copy(L(0xfff0c0)).lerp(lad,.7).multiplyScalar(cr*(4+charge*10));
    pillar.visible=cr>0; if(cr>0){ const pp=pack.localToWorld(new T.Vector3(-.12,0,PACK_D/2+.1)); pillar.position.set(pp.x,.05,pp.z); pillar.rotation.y=Math.atan2(camera.position.x-pp.x,camera.position.z-pp.z);
      pillar.scale.set(.25+charge*.7,18*ease.out(S(2.4,.45,tt)),1); pillarMat.color.copy(L(0xfff0c8)).lerp(lad,.85).multiplyScalar(1.5+charge*charge*4); }
    packLight.intensity=charge*charge*9; packLight.color.copy(lad); rays.position.set(0,PACK_REST.y,-.55); rays.material.opacity=charge*charge*.55; rays.material.color.copy(ladA).multiplyScalar(.5); rays.rotation.z=tt*.5; rays.scale.setScalar(6+charge*6);
    /* gold glitter swirling round the pack */
    if(fall>=1) for(let i=0;i<3;i++){ const a=Math.random()*Math.PI*2, r=.8+Math.random()*.8; emit(new T.Vector3(Math.cos(a)*r,.3+Math.random()*1.6,PACK_REST.z+Math.sin(a)*r),new T.Vector3(-Math.sin(a)*1.2,.3+Math.random()*.5,Math.cos(a)*1.2),Math.random()<.6?0xffd77a:0xfff1c2,.9+Math.random()*.6,.05+Math.random()*.04,-.2,.6,1); } }
  else pillar.visible=false;
  /* a carpet of gold glitter on the grass under the pack and then the card */
  if(tt>1.3&&tt<7){ const n=tt<4.5?26:10; for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*2.1*Math.min(1,(tt-1.3)/.6); emit(new T.Vector3(Math.cos(a)*r,.03,PACK_REST.z+Math.sin(a)*r*.75),new T.Vector3(0,.05+Math.random()*.15,0),Math.random()<.7?0xffd77a:0xfff1c2,.5+Math.random()*.7,.08+Math.random()*.07,0,0,1); } }
  /* 2  blue comet swoops in (3.15 s) and the pack explodes into chunks (3.7 s) */
  comet(tt,2.95,.75,new T.Vector3(-7*side,3.4,1.5),new T.Vector3(-2.5*side,2.6,1.2),new T.Vector3(0,1.5,-.9),BLUE);
  sfxAt(tt,.9,"s_fall","whoosh"); sfxAt(tt,1.65,"s_land","land"); sfxAt(tt,2.3,"s_charge","charge"); sfxAt(tt,2.4,"s_crack","crack"); sfxAt(tt,2.95,"s_comet","comet",side);
  sfxAt(tt,3.7,"s_boom","boom",pw,lvl); buzzAt(tt,3.7,"v_boom",18+lvl*10); buzzAt(tt,5.0,"v_pos",12); buzzAt(tt,5.8,"v_nat",12); buzzAt(tt,8.0,"v_club",14); buzzAt(tt,9.6,"v_flash",[30+lvl*15,40,50+lvl*25]); sfxAt(tt,3.75,"s_crowd1","crowd",4.5+lvl*.6,.8+lvl*.12); sfxAt(tt,5.0,"s_pos","hit",0); sfxAt(tt,5.8,"s_nat","hit",1); sfxAt(tt,5.85,"s_natpops","pops",4);
  sfxAt(tt,6.4,"s_coin","coin"); sfxAt(tt,8.0,"s_club","hit",2); sfxAt(tt,8.05,"s_cannon","cannon"); sfxAt(tt,CRES[lvl]?8.45:8.9,"s_flip","flip"); sfxAt(tt,8.05,"s_riser","riser",FREEZE_END-freezeS*FREEZE_K-8.05+(freezeS?0:.02),lvl); sfxAt(tt,9.6,"s_flash","flash",pw,lvl);
  at(tt,3.7,"burst",()=>{ shake=.45; flash=.35*Math.min(1.4,pw); explodePack(); pack.visible=false; pillar.visible=false; packLight.intensity=0; card.visible=true;
    burst(new T.Vector3(0,1.4,-1.0),[0xffd77a,0xffffff,0xffc457],Math.round(150*pw),9,1.0,.16); 
    glow.material.color.copy(L(0xffe2a0)); });
  const gb=S(3.7,.75,tt); if(gb>0&&gb<1){ const s=Math.sin(gb*Math.PI)*5.5*pw; glow.position.set(0,PACK_REST.y,-.8); glow.scale.set(s,s*1.3,1); glow.material.opacity=(1-gb)*.6; }
  /* 3  the card is left floating, face hidden (3.7 - 4.6 s); the comet leaves to the other side */
  if(tt>=3.7){ rays.position.set(0,1.9,-1.5); rays.scale.set(14,14,1); const ap=ease.outQuint(S(3.7,.9,tt)); card.position.set(0,lerp(PACK_REST.y,CARD_POS.y,ap),CARD_POS.z); card.scale.setScalar(.8+.2*ap+pulse*.035); card.rotation.set(0,Math.PI+(1-ap)*.9*side,0);
    rays.material.opacity=Math.max(0,.4-S(3.7,1.5,tt)*.28); rays.material.color.copy(L(tc)).multiplyScalar(.35); rays.rotation.z=tt*.08; }
  comet(tt,4.2,.55,new T.Vector3(.3,1.9,-.9),new T.Vector3(2.4*side,2.4,.2),new T.Vector3(7.5*side,3.2,1.2),BLUE);
  at(tt,4.5,"twinkle",()=>{ [[-1.05,1.5],[1.05,-.85]].forEach(([x,y])=>emit(card.localToWorld(new T.Vector3(x,y,.1)),new T.Vector3(),0xffffff,.5,1.1,0,0,0)); });
  const sweep=(t)=>{ if(tt>=t&&tt<t+.9) sheenMat.uniforms.p.value=lerp(-2.6,2.6,(tt-t)/.9); };
  /* 4  clues one at a time: position (5.0), nation (5.8) */
  at(tt,5.0,"pos",()=>{ drawCardBack(back.ctx,p,1); back.tx.needsUpdate=true; pulse=1; burst(new T.Vector3(-.62,2.9,-1.1),[0xffffff,tc],70,3.2,.6,.16); });
  sweep(5.0);
  at(tt,5.8,"nat",()=>{ drawCardBack(back.ctx,p,2); back.tx.needsUpdate=true; pulse=1; shake=.1; burst(new T.Vector3(-.62,2.55,-1.1),nat,90,3.4,.7,.16);
    setFlagNation(p.nation); flags.forEach((f,i)=>{ f.mesh.visible=true; f.rolling=false; f.drop=Math.min(f.drop,.001); later(()=>f.target=1,i*110); });
    [-.8,-.4,0,.4,.8].forEach((x,i)=>later(()=>starburst(skyPoint(x+(Math.random()-.5)*.1,.42+Math.random()*.18,-34),nat.concat([0xffffff]),Math.round(38*pw),7,1.3),200+i*160)); });
  if(tt>5.8&&tt<7.6) flagMounts.forEach(m=>{ if(Math.random()<.5) emit(new T.Vector3(m.pos.x+(Math.random()-.5)*m.w,m.pos.y+.3,m.pos.z+.5),new T.Vector3((Math.random()-.5)*.6,-1-Math.random()*2,0),Math.random()<.5?0xfff1c2:0xffd77a,1.6,.55,-4,.3,1); });
  sweep(5.8);
  /* 5  the club badge coin rolls in, then flies onto the card (6.4 - 8.0 s); confetti cannons fire from both sides */
  const rollT=S(6.4,1.1,tt), flyT=S(7.5,.5,tt);
  coin.visible=tt>6.4&&tt<8.0;
  if(coin.visible){
    const zC=-.1, y0=COIN_R+coinLift;
    if(flyT<=0){ const k=ease.out(rollT), x=lerp(-9*side,coinStopX*side,k); coin.scale.set(COIN_R,1,COIN_R); coin.position.set(x,y0,zC); coin.rotation.set(Math.PI/2,0,0); coin.rotateY(-(x-coinStopX*side)/COIN_R+COIN_SPIN);
      if(rollT>=1){ const w=tt-7.5; coin.rotation.set(Math.PI/2+Math.sin(w*9)*.05*Math.exp(-w*2),0,0); coin.rotateY(COIN_SPIN); }
      if(rollT<1&&Math.random()<.8) emit(new T.Vector3(x,.04,zC),new T.Vector3(-side*(1+Math.random()*2),1+Math.random(),(Math.random()-.5)),0xfff1c2,.6,.08,-4,.6,1); }
    else { const k=ease.inOut(flyT); coin.position.lerpVectors(new T.Vector3(coinStopX*side,y0,zC),COIN_ON_CARD,k); coin.position.y+=Math.sin(k*Math.PI)*.8; const s=lerp(COIN_R,46/CW*2.2,k); coin.scale.set(s,1-.6*k,s); coin.rotation.set(Math.PI/2,0,0); coin.rotateY(k*Math.PI*2+COIN_SPIN); }
  }
  at(tt,8.0,"club",()=>{ drawCardBack(back.ctx,p,3); back.tx.needsUpdate=true; pulse=1; shake=.15; burst(COIN_ON_CARD,[0xffffff,0xffd77a],70,3,.6,.16);
    const cc=[tc,0xf1c35a,0xfff3c4,0x2f7bff]; confettiCannon(1,cc,Math.round(200*pw)); confettiCannon(-1,cc,Math.round(200*pw)); });
  sweep(8.0);
  /* 6  the card turns to show the face, big flash (8.9 - 10.1 s) */
  /* idea 1: for the top 20 and up the turn starts at 8.45 s and speeds up from its first frame (quad), so it is seen at once;
     the face still swaps in under the white burst. Top 50 and rank 51+ keep the old turn. */
  const cres=CRES[lvl], turnAt=cres?8.45:8.9, fl=S(turnAt,cres?1.65:1.2,tt);
  if(tt>turnAt){ const k=cres?quadInOut(fl):ease.inOut(fl); if(k>=5/6&&frontMat.map!==front.tx){ frontMat.map=front.tx; frontMat.needsUpdate=true; startCount(p); } card.rotation.set(0,Math.PI+k*Math.PI*3,0); card.position.y=CARD_POS.y+Math.sin(k*Math.PI)*.22; }
  at(tt,9.6,"sig",()=>startSig(p));
  at(tt,9.6,"flash",()=>{ shake=.3; glow.position.set(0,1.86,-1.3); flash=1.0*Math.min(1.4,pw); glow.material.color.copy(L(tc)); burst(CARD_POS.clone().add(new T.Vector3(0,0,.3)),[tc,0xffffff,0xfff1c2],Math.round(240*pw),11,1.3,.2);
    confettiRain(nat.concat([0xf1c35a,0xfff3c4]),Math.round(380*pw),-4.6,5); /* z -7.1 to -2.1: behind the card */
    [-.85,-.55,-.2,.2,.55,.85].forEach((x,i)=>later(()=>starburst(skyPoint(x,.38+Math.random()*.22,-36),[tc,0xffffff,0xfff1c2].concat(nat),Math.round(44*pw),8,1.4),i*120)); });
  if(tt>9.6&&tt<12.2) [[-6.5,-6],[6.5,-6],[-3.2,-7],[3.2,-7]].forEach(([x,z])=>fountain(new T.Vector3(fitX(x,z),.1,z),Math.random()<.5?0xfff1c2:0xffffff,Math.round(3*pw)+1,8.5,.9));
  /* idea 1: the tier glow grows behind the card (depth-hidden by it, so never over its text) into the burst, then hands over */
  aura.visible=cres>0&&tt>8.0&&tt<10.3; if(aura.visible){ const a=ease.inOut(S(8.0,1.6,tt)); aura.material.color.copy(L(tc)).multiplyScalar(1.5); aura.scale.setScalar((3.4+lvl*1.1)*(.5+cres*.5)*(.3+a*.7)*(1+S(9.6,.7,tt)*.4)); aura.material.opacity=(.4+.5*cres)*a*(1-S(9.6,.7,tt))*(lvl>=3?.67:1); } /* top 3/top 10 blue: a third lighter so the stands stay readable */
  const gs=S(9.6,1.2,tt); if(gs>0&&gs<1){ const s=Math.sin(gs*Math.PI)*8*pw; glow.scale.set(s,s,1); glow.material.opacity=(1-gs)*.6; } else if(gb<=0||gb>=1) glow.scale.set(0,0,1);
  if(tt>9.6){ rays.material.opacity=lerp(.5,.16,S(9.6,2,tt)); rays.material.color.copy(L(tc)).multiplyScalar(.35); rays.rotation.z=tt*.06; }
  if(tt>10.3&&tt<11.2) sheenMat.uniforms.p.value=lerp(-2.6,2.6,(tt-10.3)/.9);
  if(tt>10.8&&phase==="run") settle(true);
}

/* idea 2: encore volleys during the long face hold: top 3 three, top 10 two, top 20 one, top 50 and rank 51+ none. Fireworks
   burst far behind the card and the confetti falls behind it, so nothing passes over the card text; the last volley ends
   ENCORE_TAIL s before the scouting report turns in. */
const ENCORE={ "black-blue-gold":[2.2,4.0,5.8], "blue-gold":[2.2,4.2], "gold":[2.4] }, ENCORE_TAIL=2.2;
const encoreFor=(tier)=>(ENCORE[tier]||[]).filter(t=>t+ENCORE_TAIL<scoutInFor(tier));
function encore(p,i){ const tc=TIER[p.tier].glow, lvl=tierLevel(p.tier), side=i%2?-1:1, cols=[tc,0xffffff,0xfff1c2,0xf1c35a];
  [[.78,.5],[-.6,.42],[.55,.6],[-.8,.56]].forEach(([x,y],j)=>later(()=>starburst(skyPoint(side*x,y+(Math.random()-.5)*.08,-34),cols.concat(natCols(p.nation)),Math.round(52*PK*(.8+lvl*.1)),7.5,1.3),j*170));
  confettiRain(natCols(p.nation).concat([0xf1c35a,0xfff3c4]),Math.round(110*PK),-6,6,3,4);
  SFX.play("crowd",3,.55+lvl*.1); SFX.play("pops",3+lvl); }

/* idea 8: rating count-up from 40, landing on the real number with a tick per step; quicker for a lower tier (.7 s at rank 51+,
   1.7 s for the top 3). A skip lands it at once. */
let count=null, frontFull=false;
function drawOvr(v){ const c=ovrTex.ctx, t=TIER[cur().tier]; c.setTransform(2,0,0,2,0,0); c.clearRect(0,0,140,120); c.textAlign="center"; c.font='600 112px "Barlow Condensed"'; emboss(c,String(v),70,100,t.text,true); ovrTex.tx.needsUpdate=true; }
function startCount(p){ if(frontFull||REDUCED){ finishCount(); return; } count={t0:clock(),dur:COUNT_S[tierLevel(p.tier)],to:p.ovr,shown:COUNT_FROM,tickAt:-1}; drawOvr(COUNT_FROM); ovrMesh.visible=true; }
function finishCount(){ count=null; ovrMesh.visible=false; if(!frontFull){ drawCardFront(front.ctx,cur()); front.tx.needsUpdate=true; frontFull=true; } }
function stepCount(now){ if(!count) return; const k=clamp01((now-count.t0-.15)/count.dur), v=Math.round(COUNT_FROM+(count.to-COUNT_FROM)*(1-Math.pow(1-k,2)));
  if(v!==count.shown){ count.shown=v; drawOvr(v); if(now-count.tickAt>.045||v===count.to){ count.tickAt=now; SFX.play("count",v===count.to); } } if(k>=1) finishCount(); }

/* idea 5: one signature effect per tier at the flash, on top of the unchanged white burst; each tier keeps the ones below it.
   rank 51+: the floor fountains (all tiers); top 50: + a ring of light; top 20: + an upward beam; top 10: + two side beams;
   top 3: + a bloom spike and a two-colour (blue and gold) firework mix. All of it sits behind the card plane, so the card hides it. */
let sigAt=-1, sigLvl=0; const sigCol=new T.Color(), WHITE=new T.Color(1,1,1);
function startSig(p){ const lvl=tierLevel(p.tier), tc=TIER[p.tier].glow; sigAt=clock(); sigLvl=lvl; sigCol.copy(L(tc));
  if(lvl>=1){ const n=Math.round(150*PK); for(let i=0;i<n;i++){ const a=i/n*Math.PI*2; tmpV.set(Math.cos(a),Math.sin(a),0).multiplyScalar(6.2+Math.random()*.5); emit(new T.Vector3(Math.cos(a)*.5,CARD_POS.y+Math.sin(a)*.5,CARD_POS.z-.55),tmpV,i%2?tc:0xffffff,.95,.24,0,1.9,0); } }
  if(lvl>=4) [-.72,.72,-.4,.4].forEach((x,i)=>later(()=>starburst(skyPoint(x,.42+(i%2)*.1,-34),[0x3355ff,0xf1c35a,0x6f9bff,0xffe39a],Math.round(70*PK),8,1.4),420+i*190)); }
function endSig(){ sigAt=-1; beams.forEach(b=>b.visible=false); compMat.uniforms.strength.value=.3; }
function stepSig(now){ if(sigAt<0) return; const s=now-sigAt; if(s>2.6){ endSig(); return; }
  const grow=ease.out(clamp01(s/.35)), fade=1-clamp01((s-1.1)/1.2);
  beams.forEach((b,i)=>{ b.visible=sigLvl>=(i?3:2)&&fade>0; if(!b.visible) return; const x=i?fitX((i===1?-1:1)*2.3,CARD_POS.z-.9):0;
    b.position.set(x,.05,CARD_POS.z-(i?.9:.6)); b.rotation.set(0,Math.atan2(camera.position.x-x,camera.position.z-b.position.z),0); if(i) b.rotateZ(i===1?.12:-.12); b.scale.set((i?.7:1.7)*(.35+grow*.65),24*grow,1); });
  beamMat.color.copy(sigCol).lerp(WHITE,.2).multiplyScalar(2.6*grow*fade);
  compMat.uniforms.strength.value=.3+(sigLvl>=4?.5*Math.sin(clamp01((s-.2)/1.1)*Math.PI):0); }

/* idea 11: the ending. Once both cards are out, the better pull's name in the bar gets a gold pulse (both on a tie), a closing
   chord plays, and Continue shines once and then pulses gently (faster after a top-3 pull). */
function ending(){ const d=pair.daniel, n=pair.nik, top3=d.rank<=3||n.rank<=3;
  slotD.classList.toggle("best",d.rank<=n.rank); slotN.classList.toggle("best",n.rank<=d.rank);
  if(!cta.dataset.sent){ cta.classList.remove("shine"); void cta.offsetWidth; cta.classList.add("shine"); cta.classList.toggle("fast",top3); }
  later(()=>SFX.play("close",top3),600); }

/* idea 3: Daniel to Nik handover. Daniel's card flies off to his side, his flags roll up and his confetti lands instead of
   vanishing, a big "NIK'S SPECIAL PLAYER" pops in the top band, and Nik's pack drops straight away (his run starts at
   BRIDGE_T0, so no empty pitch). The bridge is a little longer after a bigger Daniel pull (.45 s at rank 51+, .81 s top 3).
   Nothing about Nik's tier shows before his own reveal. */
const BRIDGE_T0=.7; let hoAt=0, hoDur=0, camBlendAt=-1; const camFrom=new T.Vector3(), lookFrom=new T.Vector3(), hoV=new T.Vector3();
function popWho(text){ setWho(text); if(REDUCED) return; const r=document.createRange(); r.selectNodeContents(who); const w=r.getBoundingClientRect().width||1;
  who.style.setProperty("--pop",Math.max(1,Math.min(2.1,(innerWidth-32)/w)).toFixed(2)); who.classList.add("big"); }
function startHandover(){ const d=cur(); phase="handover"; hoAt=clock(); hoDur=.45+tierLevel(d.tier)*.09; tiltTX=tiltTY=0; l3.classList.remove("on");
  flags.forEach(f=>{ if(f.mesh.visible){ f.target=0; f.rolling=true; } }); SFX.play("whoosh"); SFX.play("hit",2); popWho("Nik's Special Player");
  later(()=>who.classList.remove("big"),(hoDur+.9)*1000); if(REDUCED) startPlayer(1,true); }
function stepHandover(now,dt){ const k=clamp01((now-hoAt)/hoDur), e=k*k;
  camPos.copy(camRest); camPos.z-=(camK>1?.1:.5); camLook.copy(lookRest);
  card.position.set(CARD_POS.x-e*6.5,CARD_POS.y+Math.sin(k*Math.PI)*.15,CARD_POS.z-e*2.2); card.rotation.set(-e*.35,tiltY*(1-k)+e*Math.PI*2,e*.5); card.scale.setScalar(1-e*.45);
  if(!REDUCED&&Math.random()<.8){ hoV.set((Math.random()-.5)*.6,(Math.random()-.5)*.6,0); emit(card.position,hoV,Math.random()<.5?0xffd77a:0xfff1c2,.5,.12,-1,.8,1); }
  if(k>=1){ card.visible=false; startPlayer(1,true); } }

/* ================= frame loop ================= */
let last=performance.now()/1000, W=1, H=1, manual=null; const clock=()=>manual!==null?manual:performance.now()/1000; const queue=[]; function later(fn,ms){ queue.push({t:clock()+ms/1000,fn}); }
/* Follow-up (Nik): the card never reaches the title or the "Daniel's/Nik's Special Player" line, at any size. The turn's bob,
   the camera push, a tilt or the handover flight are clamped so the card's top edge (corners included, so a turning card's near
   corner counts) stays under the top band; while the handover line pops big, under that line. */
const CARD_TOP=[[-1.16,1.65],[1.16,1.65],[0,1.56],[-1.16,1.38],[1.16,1.38]], CARD_BOT=[[0,-1.66],[-1.16,-.92],[1.16,-.92]], bandV=new T.Vector3(); let bandTop=1, bandBot=-1, bandDbg=null;
function cardSpan(){ card.updateMatrixWorld(); let top=-9, bot=9;
  CARD_TOP.forEach(([x,y])=>{ bandV.set(x,y,0); card.localToWorld(bandV).project(camera); top=Math.max(top,bandV.y); });
  CARD_BOT.forEach(([x,y])=>{ bandV.set(x,y,0); card.localToWorld(bandV).project(camera); bot=Math.min(bot,bandV.y); }); return [top,bot]; }
function keepCardInBand(){ camera.updateMatrixWorld(); let [top,bot]=cardSpan(), k=1;
  let lim=bandTop; if(who.classList.contains("big")) lim=Math.min(lim,1-2*(who.getBoundingClientRect().bottom+6)/H);
  const room=lim-bandBot, excess=top-lim; /* a turning card's near corners reach further: shrink it a touch rather than let it out */
  if(top-bot>room&&room>0){ k=room/(top-bot)*.985; card.scale.multiplyScalar(k); [top,bot]=cardSpan(); }
  const perNdc=camera.position.distanceTo(card.position)*Math.tan(camera.fov*Math.PI/360);
  if(top>lim) card.position.y-=(top-lim)*perNdc*1.03; else if(bot<bandBot) card.position.y+=Math.min(bandBot-bot,lim-top)*perNdc;
  [top,bot]=cardSpan(); bandDbg={excess,k,top,lim,bot,limB:bandBot}; }
/* r87 start-polish BUG-3: on a short desktop (1366x768) the landed pack's top edge rose into the "DANIEL'S SPECIAL
   PLAYER" line. Measure where the pack's top corners would sit at the top of its landed float (ignoring the fall, with
   the current tilt, pulse and camera) and lower the pack just enough
   to stay under the title band; the fall and the wobble are unchanged and taller screens need no lowering. */
const PACK_TOP=[[-1,-1],[1,-1],[-1,1],[1,1]], packV=new T.Vector3();
function keepPackUnderTitle(){ const yNow=pack.position.y; pack.position.y=PACK_REST.y+.05; pack.updateMatrixWorld(); /* .05: the landed float's highest point */ camera.updateMatrixWorld();
  let top=-9; PACK_TOP.forEach(([x,z])=>{ packV.set(x*PACK_W/2,PACK_H/2+.04,z*(PACK_D/2+.04)); pack.localToWorld(packV).project(camera); top=Math.max(top,packV.y); });
  const perNdc=camera.position.distanceTo(PACK_REST)*Math.tan(camera.fov*Math.PI/360);
  pack.position.y=yNow-(top>bandTop?Math.min(.45,(top-bandTop)*perNdc*1.03):0); pack.updateMatrixWorld(); }
function bandNdc(){ const top=$("top").getBoundingClientRect(), bot=$("bottom").getBoundingClientRect(); return [1-2*(top.bottom+6)/H, 1-2*(bot.top-6)/H]; }
function resize(){
  W=innerWidth; H=innerHeight; renderer.setSize(W,H,false);
  const pw=Math.floor(W*DPR), ph=Math.floor(H*DPR); sceneRT.setSize(pw,ph); for(let i=0;i<LV;i++){ const d=Math.pow(2,i+1); mipA[i].setSize(Math.max(1,pw/d|0),Math.max(1,ph/d|0)); mipB[i].setSize(Math.max(1,pw/d|0),Math.max(1,ph/d|0)); }
  camera.aspect=W/H;
  const [yt,yb]=bandNdc(); bandTop=yt; bandBot=yb; const band=Math.max(.5,yt-yb); const dist=camRest.distanceTo(CARD_POS);
  const tV=3.5/(dist*band*.96), tH=2.5/(dist*1.7*camera.aspect);
  const fov=Math.max(2*Math.atan(Math.max(tV,tH))*180/Math.PI,38); camera.fov=fov; camera.updateProjectionMatrix();
  const tanH=Math.tan(fov*Math.PI/360); lookRest=CARD_POS.clone().add(new T.Vector3(0,-(yt+yb)/2*tanH*dist+.1,0));
  viewTanH=tanH; const halfW=(camRest.z+.1)*tanH*camera.aspect; coinStopX=-Math.min(2.6,Math.max(.5,halfW-COIN_R*.9)); coinLift=camera.aspect<1?.75:.35; camK=camera.aspect<1?1.3:1;
  pMat.uniforms.scale.value=ph/(2*tanH); PK=W<700?.6:1; /* phones: fewer sparks in the new effects */
}
addEventListener("resize",resize);
function render(){
  renderer.setRenderTarget(sceneRT); renderer.render(scene,camera);
  brightMat.uniforms.tex.value=sceneRT.texture; pass(brightMat,mipA[0]);
  for(let i=0;i<LV;i++){ const src=i?mipA[i-1]:mipA[0]; blurMat.uniforms.tex.value=src.texture; blurMat.uniforms.dir.value.set(1/mipA[i].width,0); pass(blurMat,mipB[i]);
    blurMat.uniforms.tex.value=mipB[i].texture; blurMat.uniforms.dir.value.set(0,1/mipA[i].height); pass(blurMat,mipA[i]); }
  compMat.uniforms.flash.value=flash*.18; pass(compMat,null);
}
function tick(draw){
  const now=clock(), dt=Math.min(.05,now-last); last=now; SFX.tick();
  for(let i=queue.length-1;i>=0;i--) if(queue[i].t<=now){ const q=queue.splice(i,1)[0]; q.fn(); }
  const sc=phase==="run"?slowAt(vtt):1; if(phase==="run") vtt+=dt*sc; const tt=vtt;
  if(phase==="run") run(tt);
  else if(phase==="handover") stepHandover(now,dt);
  else { const k=now-settledAt; camPos.copy(camRest); camPos.z-=(camK>1?.1:.5); camLook.copy(lookRest); tiltX+=(tiltTX-tiltX)*Math.min(1,dt*6); tiltY+=(tiltTY-tiltY)*Math.min(1,dt*6);
    card.rotation.y=Math.sin(k*.7)*.14+(REDUCED?0:scoutFlip(k))+tiltY; card.rotation.x=tiltX; card.scale.setScalar(1); card.position.y=CARD_POS.y+Math.sin(k*1.5)*.03; rays.rotation.z=now*.06;
    if((k%4)<.9) sheenMat.uniforms.p.value=lerp(-2.6,2.6,(k%4)/.9);
    if(!REDUCED&&Math.random()<dt*1.2){ const v=SHIELD[(Math.random()*SHIELD.length)|0]; emit(card.localToWorld(new T.Vector3(v[0]*1.03,v[1]*1.03,.08)),new T.Vector3(0,0,0),0xfff6d8,.45,.5,0,0,0); }
    
    if(!REDUCED&&k<1.6&&Math.random()<.6) [[-6.5,-6],[6.5,-6],[-3.2,-7],[3.2,-7]].forEach(([x,z])=>fountain(new T.Vector3(fitX(x,z),.1,z),0xfff1c2,1,8.5,.9));
    /* idea 2: encore volleys while the face holds (late ones, after a tap to the report, are dropped) */
    if(!REDUCED){ const ec=encoreFor(cur().tier); for(let i=0;i<ec.length;i++){ const t=ec[i]; if(k>=t&&!fired["enc"+i]){ fired["enc"+i]=1; if(k-t<.3&&k<SCOUT_IN-ENCORE_TAIL) encore(cur(),i); } } }
    if(idx===0&&k>(REDUCED?.2:SCOUT_END+.15)) startHandover(); }
  if(camBlendAt>=0){ const b=ease.inOut(clamp01((now-camBlendAt)/.8)); camPos.lerpVectors(camFrom,camPos,b); camLook.lerpVectors(lookFrom,camLook,b); if(b>=1) camBlendAt=-1; }
  flags.forEach((f,i)=>{ if(!f.mesh.visible) return; if(f.rolling&&f.drop<.02){ f.rolling=false; f.mesh.visible=false; return; } f.drop+=(f.target-f.drop)*Math.min(1,dt*2.6); f.mesh.scale.y=Math.max(.001,f.drop);
    const a=f.mesh.geometry.attributes.position; for(let j=0;j<a.count;j++){ const x=f.base[j*3], y=f.base[j*3+1], d=-y/f.h; a.array[j*3+2]=(Math.sin(x*.9+now*2.2+i)*.5+Math.sin(y*.6+now*1.6+i*.5)*.35)*d; } a.needsUpdate=true; f.mesh.geometry.computeVertexNormals(); });
  stepSig(now); stepCount(now);
  stepParticles(dt*sc); stepChunks(dt*sc); stepConfetti(dt,now,card.visible?cardShield():null); stepSmoke(dt); sheenMat.uniforms.t.value=now%1000;
  ledTex.tx.offset.x=(now*.04)%1; stepBoards(now);
  pulse*=Math.pow(.004,dt); packPulse*=Math.pow(.002,dt); flash*=Math.pow(.02,dt); shake*=Math.pow(.02,dt);
  blob.material.opacity=card.visible?clamp01(1-(card.position.y-CARD_POS.y)*1.2):pack.visible?1:0;
  camera.position.copy(camPos).add(new T.Vector3((Math.random()-.5)*shake,(Math.random()-.5)*shake,0));
  camera.lookAt(camLook); panoSphere.position.copy(camera.position); if(phase!=="run") roll*=Math.pow(.05,dt); camera.rotateZ(roll);
  if(card.visible) keepCardInBand();
  if(draw) render();
}
function frame(){ if(manual===null) tick(true); requestAnimationFrame(frame); }

/* ================= controls ================= */
const toast=$("toast");
function skip(){ if(phase==="run") settle(); }
/* Idea 7: a stray tap must not wipe a big reveal. Top 3, top 10 and top 20 need a second tap within 3 s ("Tap again to skip");
   top 50 and rank 51+ skip on one tap. Until the pack's ladder has reached gold every reveal asks twice, so the hint never
   tells a tier the screen has not shown yet. */
const GUARD_TIERS={"black-blue-gold":1,"blue-gold":1,"gold":1}, GUARD_S=3;
const guarded=()=>vtt<LADDER_T0+2*LADDER_DT||Boolean(GUARD_TIERS[cur().tier]);
function guardedSkip(){
  if(phase!=="run") return;
  if(!guarded()||clock()<guardUntil){ guardUntil=0; skip(); return; }
  guardUntil=clock()+GUARD_S; hint(true); later(()=>{ if(guardUntil&&clock()>=guardUntil-.05){ guardUntil=0; hint(false); } },GUARD_S*1000);
}
$("skip").addEventListener("click",skip);
/* Idea 9: while the card holds, it tilts with the mouse or a finger drag (the foil already shines with the angle), and a tap ON
   the card turns to the scouting report early (hold times stay the default). A tap elsewhere keeps the skip rules above; a
   drag is never a tap. Reduced motion: no tilt. */
let tiltX=0, tiltY=0, tiltTX=0, tiltTY=0, downAt=null, pressed=false;
const ray=new T.Raycaster(), ndc=new T.Vector2();
function onCard(x,y){ if(!card.visible) return false; ndc.set(x/W*2-1,1-y/H*2); ray.setFromCamera(ndc,camera); return ray.intersectObjects([cardBody,frontMesh,backMesh],false).length>0; }
function aimTilt(x,y){ if(REDUCED||phase!=="settled") return; tiltTY=Math.max(-1,Math.min(1,x/W*2-1))*.35; tiltTX=Math.max(-1,Math.min(1,y/H*2-1))*.2; }
function toScout(){ if(phase!=="settled") return; const k=clock()-settledAt; if(k<SCOUT_IN){ finishCount(); settledAt=clock()-SCOUT_IN; } }
stage.addEventListener("pointerdown",e=>{ downAt=[e.clientX,e.clientY]; pressed=true; if(e.pointerType!=="mouse") aimTilt(e.clientX,e.clientY); });
stage.addEventListener("pointermove",e=>{ if(e.pointerType==="mouse"||pressed) aimTilt(e.clientX,e.clientY); if(e.pointerType==="mouse") stage.style.cursor=phase==="settled"&&onCard(e.clientX,e.clientY)?"pointer":""; });
const tiltHome=e=>{ pressed=false; if(!e||e.pointerType!=="mouse"){ tiltTX=tiltTY=0; } };
stage.addEventListener("pointerup",tiltHome); stage.addEventListener("pointercancel",tiltHome); stage.addEventListener("pointerleave",()=>{ pressed=false; tiltTX=tiltTY=0; });
stage.addEventListener("click",e=>{ if(unlockPending){ unlockPending=false; unlockDone=true; return; }
  if(downAt&&Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>12){ downAt=null; return; } downAt=null;
  if(phase==="settled"){ if(onCard(e.clientX,e.clientY)) toScout(); return; }
  guardedSkip(); });
/* Replay plays both reveals again here only: no message to the game (Continue still sends its one message), no network */
function replay(){ guardUntil=0; hint(false); startPlayer(0); }
$("replay").addEventListener("click",replay);
$("again").addEventListener("click",e=>{ e.stopPropagation(); replay(); });
/* Sound: on unless this phone turned it off (kept per device). A browser lets a frame start sound only after a tap inside it,
   so until then the reveal plays silent, and the first tap on the pitch turns sound on instead of skipping. */
const SOUND_KEY="cms-sp-sound", SOUND_DEFAULT=true;
const soundPref=()=>{ try{ const v=localStorage.getItem(SOUND_KEY); return v===null?SOUND_DEFAULT:v==="1"; }catch(e){ return SOUND_DEFAULT; } };
function setSound(v,save){ SFX.enable(v); const k=$("spk"); k.classList.toggle("off",!v); k.setAttribute("aria-pressed",String(v)); k.setAttribute("aria-label",v?"Sound on":"Sound off"); $("sound").textContent="Sound: "+(v?"on":"off"); $("sound").setAttribute("aria-pressed",String(v)); if(save){ try{ localStorage.setItem(SOUND_KEY,v?"1":"0"); }catch(e){} } }
$("sound").addEventListener("click",()=>{ const v=!SFX.on; setSound(v,true); if(v) startPlayer(0); });
$("spk").addEventListener("click",e=>{ e.stopPropagation(); unlockPending=false; unlockDone=true; setSound(!SFX.on,true); });
let unlockPending=false, unlockDone=false;
addEventListener("pointerdown",()=>{ if(SFX.on&&!SFX.running){ SFX.enable(true); if(!unlockDone) unlockPending=true; } },true);
{ const opts=MP_LIST.map((r,i)=>`<option value="${i}">#${r[0]} ${r[1]} · ${r[3]} · ${({"black-blue-gold":"Black","blue-gold":"Blue","gold":"Gold","silver":"Silver","bronze":"Bronze"})[RANKTIER(r[0])]}</option>`).join("");
  [["pickD","Daniel",()=>pickD,(v)=>pickD=v],["pickN","Nik",()=>pickN,(v)=>pickN=v]].forEach(([id,who,get,set])=>{ const el=$(id); el.innerHTML=opts.replace(/<option value="/g,`<option value="`); el.value=String(get()); el.title=who+"'s player";
    el.addEventListener("change",()=>{ set(+el.value); pair={daniel:mpByIdx(pickD), nik:mpByIdx(pickN)}; loadCrests().then(()=>startPlayer(0)); }); }); }
$("tierShow").addEventListener("change",()=>{ const v=$("tierShow").value; if(!v) return; const [d,n]=v.split(",").map(Number); pickD=d; pickN=n; $("pickD").value=String(d); $("pickN").value=String(n); pair={daniel:mpByIdx(d), nik:mpByIdx(n)}; loadCrests().then(()=>startPlayer(0)); });
$("gameview").addEventListener("click",()=>document.body.classList.add("game")); $("tools-back").addEventListener("click",()=>document.body.classList.remove("game")); if(qs.get("tools")!=="1"){ document.body.classList.add("game"); $("tools-back").style.display="none"; } /* game view by default, no preview controls; ?tools=1 shows the preview tools */
window.__pick=(d,n)=>{ pickD=d; pickN=n; pair={daniel:mpByIdx(d), nik:mpByIdx(n)}; return loadCrests(); };
const EMBED=qs.get("embed")==="1"; const toGame=(type)=>{ try{ parent.postMessage({type},location.origin); }catch(e){} };
cta.addEventListener("click",()=>{ if(EMBED){ if(cta.dataset.sent) return; cta.dataset.sent="1"; cta.disabled=true; cta.textContent="Opening Career Start…"; toGame("cms-sp-continue"); $("again").hidden=true; return; } toast.classList.add("on"); setTimeout(()=>toast.classList.remove("on"),1400); });
window.__mq={ player(i){ manual=performance.now()/1000; last=manual; queue.length=0; startPlayer(i); }, advance(sec){ const n=Math.round(sec*30); for(let i=0;i<n;i++){ manual+=1/30; tick(i===n-1); } },
  get t(){ return vtt; }, get band(){ return bandDbg; }, get phase(){ return phase; }, get idx(){ return idx; } };

const fontsReady=Promise.race([Promise.all(['600 60px "Barlow Condensed"','700 30px "Barlow Condensed"','500 30px "Barlow Condensed"','800 30px "Barlow Condensed"','800 40px "Big Shoulders Display"','900 40px "Big Shoulders Display"'].map(f=>document.fonts.load(f))), new Promise(r=>setTimeout(r,3000))]);
Promise.all([fontsReady,loadPano(),loadGrass(),loadPlate(),loadBoards(),loadSide("assets/stand_left.jpg","plateL","hasL"),loadSide("assets/stand_right.jpg","plateR","hasR"),loadCrests(),loadPackArt(),loadCardArt()]).then(()=>{ drawLed(ledTex.ctx); ledTex.tx.needsUpdate=true; resize(); buildEnv(); startPlayer(0);
  /* in the game: draw the first frame, tell the game it is ready, and start once the game shows this page (its loading screen covers the wait) */
  if(EMBED){ tick(true); let started=false; addEventListener("message",e=>{ if(started||e.source!==parent||e.origin!==location.origin||!e.data||e.data.type!=="cms-sp-start") return; started=true; if(soundPref()) setSound(true,false); requestAnimationFrame(frame); }); toGame("cms-sp-ready"); }
  else requestAnimationFrame(frame); });
})();
</script>

</body>
</html>

```

## FILE: js/marqueePlayer.js
```javascript
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

## FILE: data/marqueePlayers.js (rows excerpted)
```javascript
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeMarqueePlayers=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // r86 Special Player (Nik 2026-10-27): the FIFA 17 top players by potential, then overall, from the game's LAUNCH
  // database (Nik 2026-10-28 "Launch data, re-rank all 200", HO-037; widened to the top 300 the same day): SoFIFA roster 170002, September 2016, 17,597 players
  // (players_17.csv, raw.githubusercontent.com/ifrankandrade/data-visualization). Ties share a competition rank, and a tie
  // at the cut is kept whole (Nik's pick): all 8 players at 85/75 are in, so the list has 305 rows. Gabriel Jesus is not in the launch
  // database, so he is not here.
  // Every value is the launch value from the same row: club, overall, potential, shirt number (team_jersey_number), nation
  // (nationCode ISO 3166, GB-ENG/GB-WLS for the home nations), position (first listed) and stats, the six card-face
  // stats as published (DIV HAN KIC REF SPD POS for goalkeepers), never computed here.
  // The order is part of the draw (js/marqueePlayer.js picks by position): never reorder rows or change who is in them
  // once released; a new list is a new LIST_VERSION.
  const LIST_VERSION=1;
  const PLAYERS=Object.freeze([
    {"rank":1,"name":"Neymar","club":"FC Barcelona","overall":92,"potential":95,"number":11,"nation":"Brazil","nationCode":"BR","position":"LW","stats":{"PAC":91,"SHO":84,"PAS":78,"DRI":95,"DEF":30,"PHY":56}},
    {"rank":2,"name":"Cristiano Ronaldo","club":"Real Madrid","overall":94,"potential":94,"number":7,"nation":"Portugal","nationCode":"PT","position":"LW","stats":{"PAC":92,"SHO":92,"PAS":81,"DRI":91,"DEF":33,"PHY":80}},
    {"rank":3,"name":"P. Pogba","club":"Manchester United","overall":88,"potential":94,"number":6,"nation":"France","nationCode":"FR","position":"CM","stats":{"PAC":77,"SHO":80,"PAS":83,"DRI":87,"DEF":72,"PHY":87}},
    /* [BUNDLE NOTE: rows 4-305 omitted, same shape; 305 rows, ranks 1..300 with ties kept whole, no duplicate names (verified).] */

```

## FILE: js/specialPlayerChip.js
```javascript
(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeSpecialPlayerChip=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // r86 Special Player chip (Nik 2026-10-29): every Showdown confirmed on r86 or later gives each manager one Special Player
  // (js/marqueePlayer.js, the same draw the reveal shows). The career screens show it as a small chip next to that manager's
  // name: "SP", the player's name, then his ranking badge in the tier colour (top 3 black-blue-gold, top 10 blue-gold,
  // top 20 gold, top 50 silver, the rest bronze); on a phone it shortens to "SP · Name" in the tier colour.
  // It is flavour only (no points). It is read from what the screens already hold (a finished Showdown's id and confirm
  // time, or the live Setup's): no Firebase read, no write, nothing stored. A Showdown from before r86 has none, so it shows
  // no chip and never an error. Screen text says "Special Player" or "SP" only (Nik's naming rule).
  // The draw data loads with each screen's own files (ensure() in its prepare step), so the chip is drawn with the screen's
  // first frame and never pops in later.
  const node=typeof module!=="undefined"&&module.exports;
  const STYLE_ID="cmsSpecialPlayerChipStyle";
  const MANAGERS=Object.freeze(["daniel","nik"]);
  const TIERS=Object.freeze({"black-blue-gold":"TOP 3","blue-gold":"TOP 10",gold:"TOP 20",silver:"TOP 50",bronze:"TOP 300"});
  const RULE=Object.freeze({label:"SPECIAL PLAYER",text:"Each manager draws one FIFA 17 player at the start of every Showdown. Your Special Player scores no points. Full rules in card 06."});

  function spDraw(){
    if(root.CareerModeMarqueePlayer&&root.CareerModeMarqueePlayers)return root.CareerModeMarqueePlayer;
    return node?require("./marqueePlayer.js"):null;
  }
  function spReady(){return Boolean(node||root.CareerModeMarqueePlayer&&root.CareerModeMarqueePlayers);}
  function spChip(player){
    if(!player||typeof player.name!=="string"||!player.name||!Number.isInteger(player.rank)||!Object.hasOwn(TIERS,player.tier))return null;
    return Object.freeze({name:player.name,club:typeof player.club==="string"&&player.club?player.club:null,rank:player.rank,tier:player.tier,badge:`#${player.rank} ${TIERS[player.tier]}`});
  }
  // {daniel, nik} for one Showdown (Daniel is playerOne, Nik playerTwo), or null: not r86, no confirm time, data not loaded.
  function spForShowdown(rivalryId,confirmedAt){
    try{
      const draw=spDraw(),pair=draw&&typeof draw.forShowdown==="function"?draw.forShowdown(rivalryId,confirmedAt):null;
      if(!pair)return null;
      const daniel=spChip(pair.playerOne),nik=spChip(pair.playerTwo);
      return daniel&&nik?Object.freeze({daniel,nik}):null;
    }catch(_error){return null;}
  }
  // A History row (js/sharedCareerAnalytics.js) carries its rivalryId and setupConfirmedAt.
  function spForRow(row){return row&&typeof row==="object"?spForShowdown(row.rivalryId,row.setupConfirmedAt):null;}
  function spState(name){try{return root[name]?.getState?.()??null;}catch(_error){return null;}}
  function spJourneyRivalry(){try{const showdown=typeof currentShowdown!=="undefined"?currentShowdown:null;return showdown?.sharedJourney?.mode==="shared"&&typeof showdown.sharedJourney.rivalryId==="string"?showdown.sharedJourney.rivalryId:null;}catch(_error){return null;}}
  function spPairedRivalry(){const pair=spState("CareerModePersistentNikDanielPair"),paired=pair?.rivalryId||pair?.closedRivalryId||null;return typeof paired==="string"&&paired?paired:null;}
  // The live Showdown: the confirmed shared Setup's rivalry and confirm time (the Setup read the game already made). When
  // the game or the pair names another rivalry (a new Showdown, or another save), there is no live Special Player.
  function spLiveNow(){
    const setup=spState("CareerModeProductionSharedShowdownSetup");
    if(!setup||setup.ready!==true||setup.setup?.phase!=="SHOWDOWN_CONFIRMED"||typeof setup.rivalryId!=="string"||!Number.isFinite(setup.setupUpdatedAtMs))return null;
    const journey=spJourneyRivalry();
    if(journey&&journey!==setup.rivalryId)return null;
    const paired=spPairedRivalry();
    if(paired&&paired!==setup.rivalryId)return null;
    const sp=spForShowdown(setup.rivalryId,setup.setupUpdatedAtMs);
    if(sp)lastLive={rivalryId:setup.rivalryId,sp};
    return sp;
  }
  // Closing a Showdown clears the Setup, so the screens opened right after the close (Rivalry, Standings) keep the pair
  // this page last saw for that same Showdown until the pair or the game names another one (r86, Nik 2026-10-30).
  let lastLive=null;
  function spLive(){
    const sp=spLiveNow();if(sp||!lastLive)return sp;
    const journey=spJourneyRivalry(),paired=spPairedRivalry();
    return paired===lastLive.rivalryId&&(!journey||journey===lastLive.rivalryId)?lastLive.sp:null;
  }
  // The live Showdown when it is rivalryId (or any live one when rivalryId is not given).
  function spLiveFor(rivalryId){
    if(rivalryId==null)return spLive();
    const setup=spState("CareerModeProductionSharedShowdownSetup");
    return setup?.rivalryId===rivalryId?spLive():null;
  }
  // Career-wide screens (Career Statistics, Trophy Room, the Standings Career view): the live Showdown's Special Players,
  // else those of the most recently confirmed Showdown that has them.
  // Red team R87-SP-01: a Showdown still in progress whose row has no confirm time (no live Setup this session) owns the
  // current Special Players, which cannot be known without a Setup read; show no chip rather than an older Showdown's pair.
  function spLatest(rows){
    const live=spLive();if(live)return live;
    const list=Array.isArray(rows)?rows:[];
    if(list.some(row=>row&&row.status==="in-progress"&&!Number.isFinite(row.setupConfirmedAt)))return null;
    let best=null,at=-Infinity;
    for(const row of list){
      if(!row||!Number.isFinite(row.setupConfirmedAt)||row.setupConfirmedAt<=at)continue;
      const sp=spForRow(row);if(sp){best=sp;at=row.setupConfirmedAt;}
    }
    return best;
  }
  function spEsc(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function spTitle(chip){return `Special Player: ${chip.name} · ${chip.badge}`;}
  function spValid(chip){return Boolean(chip&&typeof chip.name==="string"&&chip.name&&Object.hasOwn(TIERS,chip.tier)&&typeof chip.badge==="string");}
  // The chip as markup (for renderers that build strings), or "" when there is none.
  function spHtml(chip){
    if(!spValid(chip))return "";
    return `<span class="spChip spChip--${chip.tier}" data-sp-chip="true" data-sp-tier="${chip.tier}" title="${spEsc(spTitle(chip))}"><span class="spChipTag">SP</span><span class="spChipName">${spEsc(chip.name)}</span><span class="spChipRank">${spEsc(chip.badge)}</span></span>`;
  }
  // The chip as an element (for renderers that build nodes), or null.
  function spElement(doc,chip){
    if(!doc||typeof doc.createElement!=="function"||!spValid(chip))return null;
    const el=doc.createElement("span");el.className=`spChip spChip--${chip.tier}`;el.dataset.spChip="true";el.dataset.spTier=chip.tier;el.title=spTitle(chip);
    for(const [cls,text] of [["spChipTag","SP"],["spChipName",chip.name],["spChipRank",chip.badge]]){const part=doc.createElement("span");part.className=cls;part.textContent=text;el.appendChild(part);}
    return el;
  }
  // Career Start: the player's original club (the club in the FIFA 17 launch list), so the manager can sign him in-game.
  function spClubLine(chip){return spValid(chip)?`${chip.name} · ${chip.club||"No club"}`:"";}

  // Marble black-and-gold (the r78 tile and the shared gold tokens, as the r84 Golden Showdown); the tier colour sits on the
  // SP tag and the ranking badge. Inline next to the name: it never covers, dims or moves anything else.
  // r87 a11y A-04: the bronze tier is a deeper bronze (#9a5a26 to #6b3d16, was #d39a5c to #8a5428) so its cream ink reads
  // at 4.5:1 or better; its bright edge stays.
  const CSS=String.raw`
#app .spChip{--sp-tier-bg:linear-gradient(180deg,#9a5a26,#6b3d16);--sp-tier-ink:#fff4e6;--sp-tier-edge:#e7b07a;
  display:inline-flex;align-items:center;gap:.4em;max-width:100%;min-width:0;margin:0 0 0 .45em;padding:.14em .5em .14em .16em;
  vertical-align:middle;box-sizing:border-box;border:1px solid var(--sp-tier-edge);border-radius:999px;
  background:linear-gradient(180deg,rgba(73,55,8,.45),rgba(13,12,10,.82)),#0d0c0a url("css/r78-marble-tile.webp") 0 0/256px 256px repeat;
  box-shadow:inset 0 0 0 1px rgba(17,15,12,.9),0 1px 2px rgba(0,0,0,.5);
  color:var(--sd-gold-200,#fff1b8);font-family:var(--sd-font-condensed,"Barlow Condensed",Arial,sans-serif);font-size:11px;font-style:normal;
  font-weight:600;line-height:1.25;letter-spacing:.03em;text-transform:none;text-align:left;text-shadow:none;white-space:nowrap;}
#app .spChip>span{display:inline-block;min-width:0;font-size:inherit;font-family:inherit;line-height:inherit;letter-spacing:inherit;text-transform:none;text-align:left;white-space:nowrap;}
#app .spChip .spChipTag{flex:none;padding:.08em .42em;border-radius:999px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);font-weight:800;letter-spacing:.1em;}
#app .spChip .spChipName{flex:0 1 auto;overflow:hidden;text-overflow:ellipsis;color:#f6eedb;}
#app .spChip .spChipRank{flex:none;padding:.04em .4em;border:1px solid var(--sp-tier-edge);border-radius:2px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);font-weight:700;letter-spacing:.06em;}
#app .spChip--black-blue-gold{--sp-tier-bg:linear-gradient(135deg,#050608 0%,#0c2a66 55%,#050608 100%);--sp-tier-ink:var(--sd-gold-300,#ffd34d);--sp-tier-edge:var(--sd-gold-500,#f5c518);}
#app .spChip--blue-gold{--sp-tier-bg:linear-gradient(180deg,#1d4fa3,#0b2558);--sp-tier-ink:var(--sd-gold-300,#ffd34d);--sp-tier-edge:var(--sd-gold-600,#e0ae3a);}
#app .spChip--gold{--sp-tier-bg:linear-gradient(180deg,#ffe07a,#c99718);--sp-tier-ink:#1a1205;--sp-tier-edge:var(--sd-gold-500,#f5c518);}
#app .spChip--silver{--sp-tier-bg:linear-gradient(180deg,#f1f3f5,#9aa3ad);--sp-tier-ink:#14171a;--sp-tier-edge:#c9d0d6;}
#app .spChip--bronze{--sp-tier-bg:linear-gradient(180deg,#9a5a26,#6b3d16);--sp-tier-ink:#fff4e6;--sp-tier-edge:#e7b07a;}
#app .spChipPair{display:flex;flex-wrap:wrap;align-items:center;gap:.3em .9em;}
#app .spChipPair>span{display:inline-flex;align-items:center;min-width:0;max-width:100%;}
/* Each screen's own spot, next to (or just under) the manager's name, inside that name's own cell or box. */
#app #careerStatistics .careerTable td>.spChip{display:flex;width:max-content;max-width:100%;margin:3px 0 0;}
/* Trophy Room: on the rank card's first line, after "#1 DANIEL" (the card keeps its height). */
#app #trophyRoom .careerRank>span{display:inline-flex;align-items:center;max-width:calc(100% - 2.4em);min-width:0;vertical-align:bottom;white-space:nowrap;}
#app #trophyRoom .careerRank .spChip{flex:0 1 auto;min-width:0;margin:0 0 0 .5em;letter-spacing:.03em;}
/* Legacy / History: one line under the two managers of each Showdown card, Daniel's on the left and Nik's on the right. */
#app #legacy .legacyCardSpecial{display:flex;justify-content:space-between;align-items:center;gap:6px;min-width:0;margin:6px 0 0;}
#app #legacy .legacyCardSpecial .spChip{flex:0 1 auto;min-width:0;max-width:calc(50% - 3px);margin:0;}
#app #legacy .legacyHistorySpecialPlayers{margin:.4em 0 .6em;font-size:12px;color:#d8cfb8;}
#app #statistics .rv-manager .spChip{margin:.25em 0 0;}
#app #statistics .rv-manager .rvSpecialPlayer{display:block;min-width:0;}
#app #statistics .rv-manager--right .rvSpecialPlayer{text-align:right;}
/* Standings styles every span in a manager's side (and hides them on phones): the chip's own parts are set back here. */
#app #standings.standingsScreenV10 .sdg-side span.sdgSpecialPlayer{display:block;min-width:0;max-width:100%;font-size:inherit;text-align:center;}
#app #standings.standingsScreenV10 .sdg-side span.spChip{display:inline-flex;margin:.2em 0 0;font-size:11px;}
#app #standings.standingsScreenV10 .sdg-side .spChip>span{display:inline-block;font-size:inherit;text-transform:none;}
#app #seasonEntry .finalWinnerManager .fwSpecialPlayer{display:block;min-width:0;}
#app #seasonEntry .finalWinnerManager .spChip{margin:.2em 0 .1em;}
#app #seasonEntry .seasonManagerHeader .seasonSpecialPlayer{display:block;min-width:0;max-width:100%;margin:.2em 0 0;}
#app #seasonEntry .seasonManagerHeader .spChip{margin:0;}
#app #seasonEntry .seasonReviewCard .seasonSpecialPlayer{display:block;min-width:0;max-width:100%;margin:.2em 0 .35em;}
#app #seasonEntry .seasonReviewCard .spChip{margin:0;font-size:12px;}
#app #ruleBook .ruleSpecialPlayer .spChip{margin:0 0 0 .35em;}
#app #ruleBook .ruleSpecialPlayer .ruleSpecialPlayerTag{display:inline-flex;margin:0;padding:.08em .42em;border-radius:999px;background:linear-gradient(135deg,#050608 0%,#0c2a66 55%,#050608 100%);color:var(--sd-gold-300,#ffd34d);font-size:11px;font-weight:800;letter-spacing:.1em;vertical-align:middle;}
/* Tight spots ("SP · Name" in the tier colour: the badge's colour moves onto the whole chip, its full text stays in the
   title): the Career Table's narrow Manager column, the Trophy Room rank cards and the Legacy cards on every size, and
   every chip on phones and narrow windows. */
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip{gap:.3em;padding:.1em .45em .1em .12em;font-size:10.5px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipRank{display:none;}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipTag{background:rgba(5,6,8,.78);color:var(--sd-gold-300,#ffd34d);}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipTag::after{content:" ·";}
:is(#app #careerStatistics .careerTable,#app #trophyRoom .careerRank,#app #legacy .legacyCardSpecial) .spChip .spChipName{color:inherit;}
/* The Career Table's Manager column is narrow at every size: a long name wraps inside its chip instead of being cut (red team R87-D-04). */
#app #careerStatistics .careerTable td>.spChip{align-items:flex-start;border-radius:.7em;}
#app #careerStatistics .careerTable .spChip .spChipName{max-width:none;overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:break-word;}
@media (max-width:640px){
  #app .spChip{gap:.3em;padding:.1em .45em .1em .12em;font-size:10.5px;background:var(--sp-tier-bg);color:var(--sp-tier-ink);}
  #app .spChip .spChipRank{display:none;}
  #app .spChip .spChipTag{background:rgba(5,6,8,.78);color:var(--sd-gold-300,#ffd34d);}
  #app .spChip .spChipTag::after{content:" ·";}
  #app .spChip .spChipName{color:inherit;max-width:9.5em;}
  /* Phone rank cards are centred columns: the chip takes its own centred line under the name. */
  #app #trophyRoom .careerRank>span{display:inline;max-width:none;}
  #app #trophyRoom .careerRank .spChip{display:flex;width:max-content;max-width:100%;margin:.25em auto 0;}
  #app #standings.standingsScreenV10 .sdg-side .spChip>span.spChipRank{display:none;}
  /* The Career Table's Manager column is narrow on phones: a long name wraps inside its chip instead of being cut. */
  #app #careerStatistics .careerTable td>.spChip{align-items:flex-start;border-radius:.7em;}
  #app #careerStatistics .careerTable .spChip .spChipName{max-width:none;overflow:visible;text-overflow:clip;white-space:normal;overflow-wrap:break-word;}
}
/* Rivalry: the same three lines on both sides at every size (Nik 2026-10-30): the name, the chip under it, then the club.
   Daniel's lines sit on the left edge and Nik's on the right, so the two chips and the two clubs line up. */
#app #statistics[data-rivalry-legacy-v10] .rv-manager>div:has(>.rvSpecialPlayer){display:flex;flex-wrap:wrap;align-items:center;column-gap:5px;min-width:0;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager--right>div:has(>.rvSpecialPlayer){justify-content:flex-end;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager>div:has(>.rvSpecialPlayer)>[id^="rvClub"]{flex:0 0 100%;order:2;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager span.rvSpecialPlayer{display:flex;flex:0 0 100%;order:1;min-width:0;max-width:100%;margin:.2em 0;overflow:visible;font-size:inherit;line-height:inherit;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager--right span.rvSpecialPlayer{justify-content:flex-end;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager span.spChip{display:inline-flex;min-width:0;max-width:100%;margin:0;font-size:10.5px;line-height:1.2;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span{display:inline-block;font-size:inherit;line-height:inherit;}
#app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span.spChipName{overflow:hidden;text-overflow:ellipsis;}
@media (max-width:900px){
  #app #statistics[data-rivalry-legacy-v10] .rv-manager span.spChip{font-size:10px;}
  #app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span.spChipName{max-width:none;}
  #app #statistics[data-rivalry-legacy-v10] .rv-manager .spChip>span.spChipRank{display:none;}
}
`;
  function spInstall(doc=root.document){
    try{
      if(!doc||typeof doc.createElement!=="function"||doc.getElementById?.(STYLE_ID))return Boolean(doc&&doc.getElementById?.(STYLE_ID));
      const style=doc.createElement("style");style.id=STYLE_ID;style.textContent=CSS;(doc.head||doc.documentElement).appendChild(style);return true;
    }catch(_error){return false;}
  }
  // Loads the list and the draw (the same files and keys the reveal uses, shell-cached) and the chip's style, before a
  // screen's first frame. Never rejects: false means no chip, and the screen opens as before.
  let ensuring=null;
  function spEnsure(){
    if(node)return Promise.resolve(true);
    if(spReady()){spInstall();return Promise.resolve(true);}
    if(ensuring)return ensuring;
    const load=(key,path,ready)=>ready()?Promise.resolve(true):typeof root.loadRuntimeScript==="function"?Promise.resolve(root.loadRuntimeScript(key,path,ready)).then(()=>Boolean(ready())):Promise.resolve(false);
    const run=Promise.resolve()
      .then(()=>load("marquee-player-list","data/marqueePlayers.js",()=>Boolean(root.CareerModeMarqueePlayers)))
      .then(ok=>ok&&load("marquee-player","js/marqueePlayer.js",()=>Boolean(root.CareerModeMarqueePlayer)))
      .then(ok=>{if(ok)spInstall();return Boolean(ok);})
      .catch(()=>false)
      .finally(()=>{if(ensuring===run)ensuring=null;});
    ensuring=run;return run;
  }

  return Object.freeze({contractVersion:1,feature:"cms-special-player-chip",managers:MANAGERS,tiers:TIERS,rule:RULE,css:CSS,styleId:STYLE_ID,
    ready:spReady,ensure:spEnsure,install:spInstall,chip:spChip,forShowdown:spForShowdown,forRow:spForRow,live:spLive,liveFor:spLiveFor,latest:spLatest,
    html:spHtml,element:spElement,title:spTitle,clubLine:spClubLine});
});

```

## FILE: js/productionSharedCareerStart.js
```javascript
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
  let transferOpening=false;const TRANSFER_OPEN_LIMIT_MS=120000;
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
    // limit waits while it is on screen (js/rosterRouletteStep.js active()). Fable F6-09: it also waits while the Transfer
    // Challenge open is still in flight before the roulette shows (a cold cache loads its files), up to 2 minutes in all.
    const began=Date.now();
    const timeout=new Promise((_,reject)=>{const fire=()=>{if(root.CareerModeRosterRouletteStep?.active?.()||(transferOpening&&Date.now()-began<TRANSFER_OPEN_LIMIT_MS)){timer=root.setTimeout(fire,25000);return;}reject(error);};timer=root.setTimeout(fire,25000);});
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
      transferOpening=true;
      const opened=await transfer.open();
      transferOpening=false;
      // r87: the manager left the Russian Roster Roulette for Showdown Home; it opens again from there. Not a failure.
      if(opened!==true&&root.CareerModeRosterRouletteStep?.wentHome?.()){pcstClosePanel();return false;}
      // The roulette could not start (Setup not read, its files not loaded): its own reason, not a generic one (Fable F2-05).
      const reason=opened!==true&&typeof transfer.rouletteError==="function"?transfer.rouletteError():"";
      if(reason){lastError=reason;return false;}
      if(opened!==true)throw new Error("Shared Transfer Challenge could not be opened from this Career Start state.");
      pcstClosePanel();
      return true;
    }catch(error){
      lastError=pcstErrorText(error,"The Transfer Challenge could not be opened.");
      pcstReport("Unable to continue to Shared Transfer Challenge",error);
      return false;
    }finally{
      busy=false;transferOpening=false;pcstRender();
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
    // Escape never closes Career Start under a running roulette (Fable F2-18).
    watch.escape=event=>{if(event.key==="Escape"&&!event.defaultPrevented&&pcstPanelOpen()&&!root.CareerModeRosterRouletteStep?.active?.()){event.preventDefault();pcstClosePanel();}};root.document?.addEventListener?.("keydown",watch.escape);
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
    // Fable F6-01: a BACK TO SHOWDOWN HOME from the roulette opened here (CONTINUE CAREER from Home) stays on Home, as it does
    // from the panel; only a roulette that could not start (its own reason) or a failed open shows Career Start below.
    if(!pcstPanelOpen()&&pcstReadyHere()&&await request.wait(pcstOpenTransferChallenge()))return pcstCloseReveal();
    if(!pcstPanelOpen()&&pcstReadyHere()&&root.CareerModeRosterRouletteStep?.wentHome?.())return pcstCloseReveal();
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

## FILE: js/optionalModules.js
```javascript
function getApplicationAssetRevision(){
const meta = document.querySelector('meta[name="app-asset-revision"]');
const revision = meta && meta.content ? meta.content.trim() : "";
return revision || "1.1.4-r1";
}

const OPTIONAL_ASSET_REVISION = getApplicationAssetRevision();
const OPTIONAL_LOAD_TIMEOUT_MS = 12000;
const runtimeScriptPromises = new Map();
const runtimeStylePromises = new Map();
const optionalModuleStates = new Map();
let optionalModulesInitialized = false;
let optionalOpenRequestId = 0;
let gameplayRuntimeState = "idle";
let gameplayRuntimePromise = null;
let gameplayRuntimeInitialized = 0;
let requiredFootballVisualPromise = null;

function optionalAssetUrl(path){
return `${path}?v=${OPTIONAL_ASSET_REVISION}`;
}

function loadRuntimeStyle(key, path){
if(runtimeStylePromises.has(key)){
return runtimeStylePromises.get(key);
}

const existing = document.querySelector(`link[data-optional-style="${key}"]`);
if(existing && existing.sheet){
return Promise.resolve(existing);
}

const promise = new Promise((resolve, reject) => {
const link = existing || document.createElement("link");
let settled = false;

if(!existing){
link.rel = "stylesheet";
link.href = optionalAssetUrl(path);
link.dataset.optionalStyle = key;
}

const cleanup = () => {
link.removeEventListener("load", handleLoad);
link.removeEventListener("error", handleError);
window.clearTimeout(timeoutId);
};

const handleLoad = () => {
if(settled){ return; }
settled = true;
cleanup();
resolve(link);
};

const handleError = () => {
if(settled){ return; }
settled = true;
cleanup();
link.remove();
runtimeStylePromises.delete(key);
reject(new Error(`Unable to load ${path}.`));
};

const timeoutId = window.setTimeout(() => {
if(settled){ return; }
settled = true;
link.removeEventListener("load", handleLoad);
link.removeEventListener("error", handleError);
link.remove();
runtimeStylePromises.delete(key);
reject(new Error(`${path} timed out while loading.`));
}, OPTIONAL_LOAD_TIMEOUT_MS);

link.addEventListener("load", handleLoad, { once: true });
link.addEventListener("error", handleError, { once: true });

if(!existing){
const appStyles = document.getElementById("appStyles");
if(appStyles && appStyles.parentNode === document.head){
document.head.insertBefore(link, appStyles);
}else{
document.head.appendChild(link);
}
}
});

runtimeStylePromises.set(key, promise);
promise.catch(() => {});
return promise;
}

function loadRuntimeScript(key, path, readinessCheck){
if(typeof readinessCheck === "function" && readinessCheck()){
return Promise.resolve(true);
}

if(runtimeScriptPromises.has(key)){
return runtimeScriptPromises.get(key);
}

const promise = new Promise((resolve, reject) => {
const script = document.createElement("script");
let settled = false;
script.src = optionalAssetUrl(path);
script.async = false;
script.dataset.runtimeScript = key;

const cleanup = () => {
script.removeEventListener("load", handleLoad);
script.removeEventListener("error", handleError);
window.clearTimeout(timeoutId);
};

const failRetryable = message => {
if(settled){ return; }
settled = true;
cleanup();
script.remove();
runtimeScriptPromises.delete(key);
reject(new Error(message));
};

const failExecuted = message => {
if(settled){ return; }
settled = true;
cleanup();
reject(new Error(message));
};

const handleLoad = () => {
if(settled){ return; }
if(typeof readinessCheck === "function" && !readinessCheck()){
failExecuted(`${path} loaded but did not expose its expected API. Refresh before retrying this module.`);
return;
}
settled = true;
cleanup();
resolve(true);
};

const handleError = () => failRetryable(`Unable to load ${path}.`);
const timeoutId = window.setTimeout(
() => failRetryable(`${path} timed out while loading.`),
OPTIONAL_LOAD_TIMEOUT_MS
);

script.addEventListener("load", handleLoad, { once: true });
script.addEventListener("error", handleError, { once: true });
document.head.appendChild(script);
});

runtimeScriptPromises.set(key, promise);
return promise;
}

function initializeGameplayRuntime(){

const initializers = [
["initializeShowdownUI", window.initializeShowdownUI],
["initializeLeagueWheel", window.initializeLeagueWheel],
["initializeClubAssignment", window.initializeClubAssignment],
["initializeTransferChallenge", window.initializeTransferChallenge],
["initializeSeasonEngine", window.initializeSeasonEngine]
];

for(;gameplayRuntimeInitialized<initializers.length;gameplayRuntimeInitialized++){
const [name, initializer] = initializers[gameplayRuntimeInitialized];
if(typeof initializer !== "function"){
throw new Error(`Gameplay initializer is unavailable: ${name}`);
}
initializer();
}
}

async function loadGameplayRuntimeFiles(){
await loadRuntimeScript(
"league-data",
"data/leagues.js",
() => typeof leagues !== "undefined" && Array.isArray(leagues)
);
await loadRuntimeScript(
"club-data",
"data/clubs.js",
() => typeof window.getClubsForLeague === "function" && typeof window.getRandomClubPair === "function"
);
await loadRuntimeScript(
"data-engine",
"js/dataEngine.js",
() => typeof window.getRandomLeague === "function"
);
await loadRuntimeScript(
"visual-identity",
"js/visualIdentity.js",
() => typeof window.applyClubIdentity === "function" && typeof window.refreshClubVisualIdentity === "function"
);
await ensureRequiredFootballVisualExperience();
await loadRuntimeScript(
"showdown-ui",
"js/showdownUI.js",
() => typeof window.initializeShowdownUI === "function" && typeof window.updateShowdownUI === "function"
);
await loadRuntimeScript(
"league-wheel",
"js/leagueWheel.js",
() => typeof window.initializeLeagueWheel === "function" && typeof window.spinLeagueWheel === "function"
);
await loadRuntimeScript(
"club-assignment",
"js/clubAssignment.js",
() => typeof window.initializeClubAssignment === "function" && typeof window.prepareClubAssignment === "function"
);

const transferStylePromise = loadRuntimeStyle("transfer-ui", "css/transfer.css");
await loadRuntimeScript(
"transfer-options",
"data/transferOptions.js",
() => Array.isArray(window.FIFA17_TRANSFER_LEAGUES)
&& window.FIFA17_TRANSFER_LEAGUES.length === 36
&& Array.isArray(window.FIFA17_TRANSFER_NATIONALITIES)
&& window.FIFA17_TRANSFER_NATIONALITIES.length === 164
);
await loadRuntimeScript(
"transfer-selector",
"js/transferSelector.js",
() => typeof window.enhanceTransferSelector === "function"
&& typeof window.getTransferSelectorCanonicalValue === "function"
);
await transferStylePromise;
await loadRuntimeScript(
"transfer-challenge",
"js/transferChallenge.js",
() => typeof window.initializeTransferChallenge === "function"
&& typeof window.openTransferChallenge === "function"
&& typeof window.normalizeTransferChallengePhase === "function"
);

const seasonStylePromise = loadRuntimeStyle("season-review-ui", "css/season.css");
await loadRuntimeScript(
"season-engine",
"js/seasonEngine.js",
() => typeof window.initializeSeasonEngine === "function"
&& typeof window.openSeasonEntry === "function"
&& typeof window.confirmCurrentSeason === "function"
&& typeof window.getSeasonReviewIntegrity === "function"
);
await seasonStylePromise;
}

function ensureGameplayModules(){
if(gameplayRuntimeState === "ready"){
return Promise.resolve(true);
}
if(gameplayRuntimePromise){
return gameplayRuntimePromise;
}

gameplayRuntimeState = "loading";
gameplayRuntimePromise = (async () => {
try{
await loadGameplayRuntimeFiles();
initializeGameplayRuntime();
gameplayRuntimeState = "ready";
return true;
}catch(error){
gameplayRuntimeState = "error";
throw error;
}finally{
gameplayRuntimePromise = null;
}
})();

return gameplayRuntimePromise;
}

function getGameplayModuleState(){
return gameplayRuntimeState;
}

async function ensureDiagnosticsModule(){
await loadRuntimeScript(
"diagnostics",
"js/diagnostics.js",
() => typeof window.runApplicationDiagnostics === "function"
);
}

function ensureMenuFeedbackModule(){
return loadRuntimeScript(
"menu-feedback",
"js/menuFeedback.js",
() => typeof window.playMenuFeedbackCue === "function"
&& typeof window.getMenuFeedbackDiagnostics === "function"
);
}

async function ensureFootballVisualModule(){
const stylePromise=loadRuntimeStyle("football-visual-ui","css/footballVisuals.css").then(()=>loadRuntimeStyle("football-visual-v113-ui","css/footballVisuals-v113.css"));
await loadRuntimeScript("football-visual-data","data/footballVisuals.js",() => Boolean(window.FOOTBALL_VISUALS && window.FOOTBALL_VISUAL_SCREEN_PLAN));
await loadRuntimeScript(
"football-visual-ui","js/footballVisuals.js",
()=>["initializeFootballVisuals","prepareFootballVisualScreen","preloadFootballVisualAssets"].every(name=>typeof window[name]==="function")
);
await stylePromise;
await window.initializeFootballVisuals();
return true;
}

function ensureRequiredFootballVisualExperience(){
if(requiredFootballVisualPromise){ return requiredFootballVisualPromise; }
requiredFootballVisualPromise = ensureFootballVisualModule().catch(error => {
requiredFootballVisualPromise = null;
throw error;
});
return requiredFootballVisualPromise;
}

async function ensureAnalyticsEngine(){
await loadRuntimeScript(
"analytics-engine",
"js/analytics.js",
() => typeof window.buildRivalryAnalytics === "function" && typeof window.buildCareerAnalytics === "function"
);
}

async function ensureStatisticsScript(){
await ensureAnalyticsEngine();
await loadRuntimeScript(
"statistics-ui",
"js/statistics.js",
() => typeof window.openRivalryStatistics === "function"
&& typeof window.openCareerStatistics === "function"
&& typeof window.createAnalyticsStat === "function"
);
}

async function ensureStatisticsModule(){
const stylePromise = loadRuntimeStyle("analytics-ui", "css/analytics.css");
const visualPromise = ensureRequiredFootballVisualExperience();
await Promise.all([stylePromise, visualPromise, ensureStatisticsScript()]);
}

async function ensureTrophyRoomModule(){
const stylePromise = loadRuntimeStyle("analytics-ui", "css/analytics.css");
const visualPromise = ensureRequiredFootballVisualExperience();
await ensureStatisticsScript();
await loadRuntimeScript(
"trophy-room-ui",
"js/trophyRoom.js",
() => typeof window.openTrophyRoom === "function"
);
await Promise.all([stylePromise, visualPromise]);
}

async function ensureLegacyModule(){
const stylePromise = loadRuntimeStyle("legacy-ui", "css/legacy.css");
const restoreStylePromise = loadRuntimeStyle("restore-ui", "css/restore.css");
await ensureCandidateC();
await loadRuntimeScript(
"restore-ui",
"js/restoreUI.js",
() => typeof window.initializeCareerModeRestoreUI === "function" && typeof window.mountCareerModeRestorePanel === "function"
);
await loadRuntimeScript(
"legacy-ui",
"js/legacy.js",
() => typeof window.renderLegacy === "function"
);
await Promise.all([stylePromise, restoreStylePromise]);
window.initializeCareerModeRestoreUI();
}

async function ensureCandidateC(){
await loadRuntimeScript(
"backup-engine",
"js/backup.js",
() => typeof window.createCareerModeBackupEnvelope === "function"
&& typeof window.verifyCareerModeBackupEnvelopeChecksum === "function"
);
await loadRuntimeScript(
"import-analysis",
"js/importAnalysis.js",
() => typeof window.validateCareerModeImportShowdownRecord === "function"
);
await loadRuntimeScript("restore-transaction","js/storageTransaction.js",()=>typeof window.runCareerModeRawStorageTransaction==="function");
await loadRuntimeScript(
"restore-engine",
"js/restore.js",
() => typeof window.prepareCareerModeRemoteReconciliationIntent === "function"
&& typeof window.applyCareerModeRemoteReconciliation === "function"
);
return true;
}

async function ensureRuleBookModule(){
const stylePromise = loadRuntimeStyle("rule-book-ui", "css/rulebook.css");
await loadRuntimeScript(
"rule-book-ui",
"js/ruleBook.js",
() => typeof window.openRuleBook === "function"
);
await stylePromise;
}

async function ensureSettingsModule(){
const stylePromise = loadRuntimeStyle("settings-ui", "css/settings.css");
await loadRuntimeScript(
"settings-ui",
"js/settings.js",
() => typeof window.initializeSettings === "function" && typeof window.openSettings === "function"
);
await stylePromise;
window.initializeSettings();
}

function getOptionalModuleButton(name){
if(name === "careerStatistics"){ return document.getElementById("careerStatisticsButton"); }
if(name === "statistics"){ return document.getElementById("rivalryStatisticsButton"); }
if(name === "trophyRoom"){
return document.getElementById("careerStatisticsTrophyButton");
}
if(name === "legacy"){ return document.getElementById("legacyButton"); }
if(name === "ruleBook"){ return document.getElementById("ruleBookButton"); }
if(name === "settings"){ return document.getElementById("settingsButton"); }
return null;
}

function setOptionalModuleBusy(name, busy){
const button = getOptionalModuleButton(name);
if(!button){ return; }
button.setAttribute("aria-busy", busy ? "true" : "false");
button.classList.toggle("isBusy", busy);
}

async function ensureOptionalModule(name){
if(optionalModuleStates.get(name) === "ready"){ return true; }

optionalModuleStates.set(name, "loading");
try{
if(name === "careerStatistics" || name === "statistics"){
await ensureStatisticsModule();
}else if(name === "trophyRoom"){
await ensureTrophyRoomModule();
}else if(name === "legacy"){
await ensureLegacyModule();
}else if(name === "ruleBook"){
await ensureRuleBookModule();
}else if(name === "settings"){
await ensureSettingsModule();
}else{
throw new Error(`Unknown optional module: ${name}`);
}
optionalModuleStates.set(name, "ready");
return true;
}catch(error){
optionalModuleStates.set(name, "error");
throw error;
}
}

function isOptionalOpenContextCurrent(originScreen, originRevision, requestId){
const currentScreen = typeof window.getActiveScreenName === "function"
? window.getActiveScreenName()
: originScreen;
const currentRevision = typeof window.getNavigationRevision === "function"
? window.getNavigationRevision()
: originRevision;

return requestId === optionalOpenRequestId
&& currentScreen === originScreen
&& currentRevision === originRevision;
}

async function openOptionalModule(name){
const requestId = ++optionalOpenRequestId;
const originScreen = typeof window.getActiveScreenName === "function"
? window.getActiveScreenName()
: null;
const originRevision = typeof window.getNavigationRevision === "function"
? window.getNavigationRevision()
: 0;

setOptionalModuleBusy(name, true);
try{
await ensureOptionalModule(name);
if(!isOptionalOpenContextCurrent(originScreen, originRevision, requestId)){ return false; }

if(name === "careerStatistics"){
window.openCareerStatistics();
}else if(name === "statistics"){
if(!currentShowdown){
if(typeof window.showAppNotice === "function"){
window.showAppNotice("No Showdown in progress. Start or join one from Home.", "error");
}
return false;
}
window.openRivalryStatistics();
}else if(name === "trophyRoom"){
window.openTrophyRoom();
}else if(name === "legacy"){
const opened = showScreen("legacy");
if(opened && typeof window.mountCareerModeRestorePanel === "function"){
window.mountCareerModeRestorePanel();
}
return opened;
}else if(name === "ruleBook"){
window.openRuleBook();
}else if(name === "settings"){
window.openSettings();
}
return true;
}catch(error){
if(typeof window.reportApplicationError === "function"){
window.reportApplicationError(`Unable to open ${name}`, error);
}else{ console.error(error); }
return false;
}finally{
setOptionalModuleBusy(name, false);
}
}

function ensureStatisticsDashboardButtonShell(){
if(document.getElementById("rivalryStatisticsButton")){ return; }
const actions = document.querySelector("#dashboard .dashboardActions");
if(!actions){ return; }

const button = document.createElement("button");
button.type = "button";
button.id = "rivalryStatisticsButton";
button.className = "menuButton";
button.textContent = "RIVALRY STATISTICS";

const deleteButton = document.getElementById("deleteActiveShowdown");
if(deleteButton){ actions.insertBefore(button, deleteButton); }
else { actions.appendChild(button); }
}

function bindOptionalModuleButton(button, moduleName, marker){
if(!button || button.dataset[marker] === "true"){ return; }
button.dataset[marker] = "true";
button.addEventListener("click", () => (typeof window.openOptionalModule === "function" ? window.openOptionalModule : openOptionalModule)(moduleName));
}

function initializeOptionalModules(){
if(optionalModulesInitialized){ return; }

ensureStatisticsDashboardButtonShell();
bindOptionalModuleButton(document.getElementById("careerStatisticsButton"), "careerStatistics", "careerStatisticsBound");
bindOptionalModuleButton(document.getElementById("rivalryStatisticsButton"), "statistics", "statisticsLazyBound");
bindOptionalModuleButton(document.getElementById("ruleBookButton"), "ruleBook", "ruleBookBound");
bindOptionalModuleButton(document.getElementById("settingsButton"), "settings", "settingsBound");

ensureRequiredFootballVisualExperience().catch(error => {
if(typeof window.reportApplicationError === "function"){
window.reportApplicationError("The match art did not load", error);
}else{ console.error("The match art did not load", error); }
});
optionalModulesInitialized = true;
}

function getOptionalModuleState(){
return {
careerStatistics: optionalModuleStates.get("careerStatistics") || "idle",
statistics: optionalModuleStates.get("statistics") || "idle",
trophyRoom: optionalModuleStates.get("trophyRoom") || "idle",
legacy: optionalModuleStates.get("legacy") || "idle",
ruleBook: optionalModuleStates.get("ruleBook") || "idle",
settings: optionalModuleStates.get("settings") || "idle"
};
}

window.initializeOptionalModules = initializeOptionalModules;
window.ensureGameplayModules = ensureGameplayModules;
window.getGameplayModuleState = getGameplayModuleState;
window.ensureDiagnosticsModule = ensureDiagnosticsModule;
window.ensureMenuFeedbackModule = ensureMenuFeedbackModule;
window.ensureFootballVisualModule = ensureFootballVisualModule;
window.ensureRequiredFootballVisualExperience = ensureRequiredFootballVisualExperience;
window.ensureOptionalModule = ensureOptionalModule;
window.ensureCareerModeCandidateCAuthority = ensureCandidateC;
window.openOptionalModule = openOptionalModule;
window.getOptionalModuleState = getOptionalModuleState;

```

## FILE: js/storage.js
```javascript
const STORAGE_KEY="careerModeShowdown.activeShowdown";
const LEGACY_STORAGE_KEY="careerModeShowdown.legacyShowdowns";
const APPLICATION_PREFERENCES_KEY="careerModeShowdown.preferences";
const SAVE_KEY="careerModeShowdown.saveLibrary";
const APPLICATION_PREFERENCES_SCHEMA_VERSION=2;
const DEFAULT_DRAFT_SAVE_DELAY=420;
let pendingCurrentSaveTimer=null;
let storageLifecycleBound=false;
let legacyCache=null;
let legacyStorageRevision=0;
let applicationPreferencesCache=null;
let motionPreferenceMediaQuery=null;
let motionPreferenceMediaBound=false;
let criticalRecoveryStorageState=false;
function reportStorageError(context,error){console.error(`[Career Mode Showdown] ${context}:`,error);if(typeof window.showAppNotice==="function")window.showAppNotice(`${context}. Your browser may not have saved the latest change.`,"error",10000);}
function readStorageValue(key){try{return localStorage.getItem(key);}catch(error){reportStorageError("Unable to read saved data",error);return null;}}
function writeStorageValue(key,value){try{localStorage.setItem(key,value);return true;}catch(error){reportStorageError("Unable to write saved data",error);return false;}}
function removeStorageValue(key){try{localStorage.removeItem(key);return true;}catch(error){reportStorageError("Unable to remove saved data",error);return false;}}
function captureCareerModeRawBackupInputs(){return {saveLibrary:readStorageValue(SAVE_KEY),activeShowdown:readStorageValue(STORAGE_KEY),legacyShowdowns:readStorageValue(LEGACY_STORAGE_KEY),preferences:readStorageValue(APPLICATION_PREFERENCES_KEY)};}
function captureStorageSnapshot(keys){const raw={},failedKeys=[];for(const [name,key] of Object.entries(keys))try{raw[name]=localStorage.getItem(key);}catch(error){failedKeys.push(name);reportStorageError(`Unable to read ${name} for an exact raw snapshot`,error);}return failedKeys.length?{ok:false,raw:null,failedKeys}:{ok:true,raw,failedKeys:[]};}
function captureCareerModeRawRestoreSnapshot(){return captureStorageSnapshot({activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});}
function captureLibraryMigrationSnapshot(){return captureStorageSnapshot({saveLibrary:SAVE_KEY,activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});}
function createDefaultApplicationPreferences(){return {schemaVersion:APPLICATION_PREFERENCES_SCHEMA_VERSION,reducedMotion:false,menuFeedback:true};}
function normalizeApplicationPreferences(value){const full=value&&value.motionPreference==="full";return {schemaVersion:APPLICATION_PREFERENCES_SCHEMA_VERSION,reducedMotion:!full&&Boolean(value&&value.reducedMotion),...(full?{motionPreference:"full"}:{}),menuFeedback:!value||value.menuFeedback!==false};}
function loadApplicationPreferences(){if(applicationPreferencesCache)return {...applicationPreferencesCache};const raw=readStorageValue(APPLICATION_PREFERENCES_KEY);if(!raw){applicationPreferencesCache=createDefaultApplicationPreferences();return {...applicationPreferencesCache};}try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Application preferences are not a valid object.");applicationPreferencesCache=normalizeApplicationPreferences(parsed);}catch(error){reportStorageError("Unable to parse application preferences",error);applicationPreferencesCache=createDefaultApplicationPreferences();}return {...applicationPreferencesCache};}
function saveApplicationPreferences(preferences){const normalized=normalizeApplicationPreferences(preferences);try{if(!writeStorageValue(APPLICATION_PREFERENCES_KEY,JSON.stringify(normalized)))return false;applicationPreferencesCache=normalized;return true;}catch(error){reportStorageError("Unable to serialize application preferences",error);return false;}}
function getMotionPreferenceMediaQuery(){if(motionPreferenceMediaQuery)return motionPreferenceMediaQuery;if(typeof window.matchMedia!=="function")return null;motionPreferenceMediaQuery=window.matchMedia("(prefers-reduced-motion: reduce)");return motionPreferenceMediaQuery;}
function isSystemReducedMotionPreferred(){const query=getMotionPreferenceMediaQuery();return Boolean(query&&query.matches);}
function isReducedMotionPreferred(){return getApplicationMotionPreferenceState().effectiveReduced;}
function getApplicationMotionPreferenceState(){const p=loadApplicationPreferences(),m=p.motionPreference||(p.reducedMotion?"reduce":"follow"),systemReduced=isSystemReducedMotionPreferred();return {motionPreference:m,reducedMotionOverride:m==="reduce",systemReduced,effectiveReduced:m==="reduce"||(m==="follow"&&systemReduced)};}
function applyApplicationMotionPreference(){const root=document.documentElement;if(!root)return getApplicationMotionPreferenceState();const state=getApplicationMotionPreferenceState();root.dataset.motionPreference=state.motionPreference==="full"?"full":state.reducedMotionOverride?"reduced":"system";root.dataset.motionReduced=state.effectiveReduced?"true":"false";return state;}
function notifyApplicationPreferencesChanged(source="application"){if(typeof window.CustomEvent!=="function")return;window.dispatchEvent(new CustomEvent("career-mode-preferences-change",{detail:{source,preferences:loadApplicationPreferences(),motion:getApplicationMotionPreferenceState()}}));}
function setApplicationMotionPreference(c){if(!/^(follow|full|reduce)$/.test(c))return false;const changed=getApplicationMotionPreferenceState().motionPreference!==c;if(changed&&!saveApplicationPreferences({...loadApplicationPreferences(),reducedMotion:c==="reduce",motionPreference:c}))return false;applyApplicationMotionPreference();if(changed)notifyApplicationPreferencesChanged("user");return true;}
function isMenuFeedbackEnabled(){return loadApplicationPreferences().menuFeedback!==false;}
function setApplicationMenuFeedbackPreference(enabled){const current=loadApplicationPreferences(),nextValue=Boolean(enabled);if(current.menuFeedback===nextValue)return true;if(!saveApplicationPreferences({...current,menuFeedback:nextValue}))return false;notifyApplicationPreferencesChanged("menu-feedback");return true;}
function initializeMotionPreferenceLifecycle(){applyApplicationMotionPreference();if(motionPreferenceMediaBound)return;const query=getMotionPreferenceMediaQuery();if(!query)return;const handleChange=()=>{applyApplicationMotionPreference();notifyApplicationPreferencesChanged("system");};if(typeof query.addEventListener==="function")query.addEventListener("change",handleChange);else if(typeof query.addListener==="function")query.addListener(handleChange);motionPreferenceMediaBound=true;}
function cancelScheduledCurrentShowdownSave(){if(pendingCurrentSaveTimer){window.clearTimeout(pendingCurrentSaveTimer);pendingCurrentSaveTimer=null;}}
function saveCurrentShowdown(){cancelScheduledCurrentShowdownSave();return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.saveCurrentShowdown());}
function scheduleCurrentShowdownSave(delay=DEFAULT_DRAFT_SAVE_DELAY){if(!currentShowdown)return false;cancelScheduledCurrentShowdownSave();pendingCurrentSaveTimer=window.setTimeout(()=>{pendingCurrentSaveTimer=null;saveCurrentShowdown();},Math.max(0,Number(delay)||0));return true;}
function flushScheduledCurrentShowdownSave(){if(!pendingCurrentSaveTimer)return true;cancelScheduledCurrentShowdownSave();return saveCurrentShowdown();}
function flushPendingApplicationWrites(){const transferFlushed=typeof window.flushTransferDraftSave==="function"?window.flushTransferDraftSave():true;const currentFlushed=flushScheduledCurrentShowdownSave();return transferFlushed!==false&&currentFlushed!==false;}
function initializeStorageLifecycle(){if(storageLifecycleBound)return;storageLifecycleBound=true;initializeMotionPreferenceLifecycle();window.addEventListener("pagehide",flushPendingApplicationWrites);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flushPendingApplicationWrites();});window.addEventListener("storage",event=>{if(event.key===LEGACY_STORAGE_KEY)invalidateLegacyCache();if(event.key===APPLICATION_PREFERENCES_KEY){applicationPreferencesCache=null;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("storage");}});}
function parseStoredShowdown(raw,context){try{const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Active save data is not a valid showdown object.");return parsed;}catch(error){reportStorageError(context,error);return null;}}
function readSaveLibraryActive(){const raw=readStorageValue(SAVE_KEY);if(raw===null)return null;try{const library=JSON.parse(raw);if(!library||typeof library!=="object"||!Array.isArray(library.saves))throw new Error("Save Library is not a valid registry.");if(library.activeSaveId===null)return null;if(typeof library.activeSaveId!=="string")throw new Error("Save Library active identity is invalid.");const matches=library.saves.filter(entry=>entry&&entry.saveId===library.activeSaveId);if(matches.length!==1||!matches[0].showdown||matches[0].showdown.identity?.saveId!==matches[0].saveId)throw new Error("Save Library active entry is inconsistent.");return matches[0].showdown;}catch(error){reportStorageError("Unable to parse the Save Library active showdown",error);return null;}}
function loadSavedShowdown(){const singleton=readStorageValue(STORAGE_KEY);return singleton!==null?parseStoredShowdown(singleton,"Unable to parse the active showdown"):readSaveLibraryActive();}
function clearSavedShowdown(){cancelScheduledCurrentShowdownSave();const snapshot=captureLibraryMigrationSnapshot();if(!snapshot.ok)return false;if(snapshot.raw.saveLibrary!==null)return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.clearActiveShowdown());return removeStorageValue(STORAGE_KEY);}
function hasStoredActiveShowdownData(){if(readStorageValue(STORAGE_KEY)!==null)return true;const raw=readStorageValue(SAVE_KEY);if(raw===null)return false;try{const library=JSON.parse(raw);return Boolean(library&&library.activeSaveId!==null);}catch{return true;}}
function hasSavedShowdown(){return loadSavedShowdown()!==null;}
function invalidateLegacyCache(){legacyCache=null;legacyStorageRevision+=1;}
function getLegacyStorageRevision(){return legacyStorageRevision;}
function loadLegacyShowdowns(){if(legacyCache)return legacyCache.slice();const raw=readStorageValue(LEGACY_STORAGE_KEY);if(!raw){legacyCache=[];return [];}try{const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error("Legacy history is not a valid array.");if(parsed.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new Error("Legacy history contains an invalid record shape.");legacyCache=parsed.slice();return legacyCache.slice();}catch(error){reportStorageError("Unable to parse Legacy history",error);legacyCache=[];return [];}}
function saveLegacyShowdowns(showdowns){const safeShowdowns=Array.isArray(showdowns)?showdowns:[];try{if(!writeStorageValue(LEGACY_STORAGE_KEY,JSON.stringify(safeShowdowns)))return false;legacyCache=safeShowdowns.slice();legacyStorageRevision+=1;return true;}catch(error){reportStorageError("Unable to serialize Legacy history",error);return false;}}
function cloneForStorage(v){try{return structuredClone(v)}catch{return JSON.parse(JSON.stringify(v))}}
function archiveShowdown(showdown){return Boolean(showdown&&showdown.status==="Completed"&&window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.archiveShowdown(showdown));}
function deleteLegacyShowdown(showdownId){const history=loadLegacyShowdowns(),nextHistory=history.filter(item=>String(item.id)!==String(showdownId));if(nextHistory.length===history.length)return false;return saveLegacyShowdowns(nextHistory);}
function clearLegacyHistory(){const removed=removeStorageValue(LEGACY_STORAGE_KEY);if(removed){invalidateLegacyCache();legacyCache=[];}return removed;}
function restoreStorageSnapshot(key,value){return value===null?removeStorageValue(key):writeStorageValue(key,value);}
function invalidateRuntimeAfterCriticalRecovery(){criticalRecoveryStorageState=true;invalidateLegacyCache();applicationPreferencesCache=null;if(typeof currentShowdown!=="undefined")currentShowdown=null;}
function applyCareerModeRawStorageTransaction(plan,expectedRaw=null){if(typeof window.runCareerModeRawStorageTransaction!=="function")return {ok:false,status:"engine-unavailable"};const keys={activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY,saveLibrary:SAVE_KEY};const result=window.runCareerModeRawStorageTransaction(plan,{read(name,phase){try{return {ok:true,value:localStorage.getItem(keys[name])};}catch(error){reportStorageError(`Unable to ${phase} ${name} during restore`,error);return {ok:false};}},write(name,value){return restoreStorageSnapshot(keys[name],value);}},expectedRaw,arguments[2]||null);if(result.ok&&(result.status==="success"||result.status==="no-op")){criticalRecoveryStorageState=false;if(result.affectedKeys.includes("legacyShowdowns"))invalidateLegacyCache();if(result.affectedKeys.includes("preferences")){applicationPreferencesCache=null;applyApplicationMotionPreference();notifyApplicationPreferencesChanged("restore");}}else if(result.status==="rollback-failed-critical")invalidateRuntimeAfterCriticalRecovery();return result;}
function clearAllCareerModeData(){cancelScheduledCurrentShowdownSave();const snapshot=captureLibraryMigrationSnapshot();if(!snapshot.ok)return false;if(snapshot.raw.saveLibrary!==null)return Boolean(window.CareerModeSaveLibraryRuntime?.isReady()&&window.CareerModeSaveLibraryRuntime.clearAllData());if(!removeStorageValue(STORAGE_KEY))return false;if(!removeStorageValue(LEGACY_STORAGE_KEY)){restoreStorageSnapshot(STORAGE_KEY,snapshot.raw.activeShowdown);return false;}invalidateLegacyCache();legacyCache=[];return true;}
window.captureCareerModeRawBackupInputs=captureCareerModeRawBackupInputs;
window.captureCareerModeRawRestoreSnapshot=captureCareerModeRawRestoreSnapshot;
window.captureCareerModeRawSaveLibraryMigrationSnapshot=captureLibraryMigrationSnapshot;
window.getCareerModeStorageKeys=()=>({saveLibrary:SAVE_KEY,activeShowdown:STORAGE_KEY,legacyShowdowns:LEGACY_STORAGE_KEY,preferences:APPLICATION_PREFERENCES_KEY});
window.initializeStorageLifecycle=initializeStorageLifecycle;
window.scheduleCurrentShowdownSave=scheduleCurrentShowdownSave;
window.flushScheduledCurrentShowdownSave=flushScheduledCurrentShowdownSave;
window.flushPendingApplicationWrites=flushPendingApplicationWrites;
window.applyCareerModeRawStorageTransaction=applyCareerModeRawStorageTransaction;
window.isCareerModeCriticalRecoveryLocked=()=>criticalRecoveryStorageState;
window.getLegacyStorageRevision=getLegacyStorageRevision;
window.loadApplicationPreferences=loadApplicationPreferences;
window.getApplicationMotionPreferenceState=getApplicationMotionPreferenceState;
window.setApplicationReducedMotionPreference=enabled=>setApplicationMotionPreference(enabled?"reduce":"follow");
window.setApplicationMotionPreference=setApplicationMotionPreference;
window.isMenuFeedbackEnabled=isMenuFeedbackEnabled;
window.setApplicationMenuFeedbackPreference=setApplicationMenuFeedbackPreference;
window.isSystemReducedMotionPreferred=isSystemReducedMotionPreferred;
window.isReducedMotionPreferred=isReducedMotionPreferred;
window.applyApplicationMotionPreference=applyApplicationMotionPreference;

```

## FILE: index.html (loading screen fragment only)
```html
<div id="overlay"></div>

<section id="loadingScreen" role="status" aria-live="polite" aria-busy="true" aria-label="Career Mode Showdown is starting">
<div class="startupScene" aria-hidden="true">
<div class="startupAthleteFrame">
<picture>
<source media="(max-aspect-ratio: 7/5)" srcset="assets/LOADING_REUS_PHONE.webp?v=1.9.10-r86" width="1179" height="2096">
<img id="startupAthlete" src="assets/LOADING_REUS_DESKTOP.webp?v=1.9.10-r86" width="1920" height="1080" alt="" decoding="async" fetchpriority="high">
</picture>
</div>
</div>
<div class="startupStatus">
<div class="startupPulse" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
<p id="loadingText">PREPARING CAREER MODE SHOWDOWN</p>
<div class="startupLoader" aria-hidden="true"><i></i></div>
</div>
<p class="startupSaveNote" aria-hidden="true">TWO MANAGERS&nbsp;&nbsp;·&nbsp;&nbsp;ONE SHOWDOWN</p>
<p class="startupPhotoCredit">Marco Reus photo: <a href="https://www.flickr.com/photos/foto_db/16204330530/" tabindex="-1" rel="noopener" target="_blank">Tim Reckmann</a> · <a href="https://creativecommons.org/licenses/by/2.0/" tabindex="-1" rel="noopener" target="_blank">CC BY 2.0</a> · Cropped and edited for display</p>
</section>

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
    "visual-assets/v10_1/roulette/index.html"
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
const SHELL_PATHS_ADDED_SINCE_PREVIOUS = new Set(["js/careerSummaryStore.js","js/specialPlayerReveal.js","visual-assets/v10_1/special-player/index.html","js/marqueePlayer.js","data/marqueePlayers.js","js/specialPlayerChip.js","js/rosterRouletteStep.js","js/rosterRoulette.js","data/rosterSquads.js","css/v10Roulette.css","visual-assets/v10_1/roulette/index.html","visual-assets/v10_1/roulette/platemap.json","visual-assets/v10_1/roulette/vendor/three-r128.min.js","visual-assets/v10_1/roulette/vendor/THREE_LICENSE.txt","visual-assets/v10_1/roulette/assets/squads.json","js/deadlineDay.js","data/deadlineDayLines.js","data/fifa17Players.js","js/touchlineGazette.js","data/gazetteCopy.js","data/frontPages.js","css/v10Gazette.css","visual-assets/v10_1/content/content.css","visual-assets/v10_1/content/frontpage.js","visual-assets/v10_1/content/gazette/fonts/unifrakturmaguntia-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-900-normal.woff2","visual-assets/v10_1/content/gazette/fonts/playfair-display-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-normal.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-400-italic.woff2","visual-assets/v10_1/content/gazette/fonts/old-standard-tt-latin-700-normal.woff2","visual-assets/v10_1/content/gazette/fonts/LICENSE-unifrakturmaguntia.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-playfair-display.txt","visual-assets/v10_1/content/gazette/fonts/LICENSE-old-standard-tt.txt","js/commentaryV3.js","js/commentaryEngine.js","data/commentaryLines.js","assets/fonts/barlow-condensed.css","assets/fonts/barlow-condensed-vietnamese-600-normal.woff2","assets/fonts/barlow-condensed-vietnamese-700-normal.woff2","assets/fonts/barlow-condensed-vietnamese-800-normal.woff2","assets/fonts/barlow-condensed-latin-ext-600-normal.woff2","assets/fonts/barlow-condensed-latin-ext-700-normal.woff2","assets/fonts/barlow-condensed-latin-ext-800-normal.woff2","assets/fonts/barlow-condensed-latin-600-normal.woff2","assets/fonts/barlow-condensed-latin-700-normal.woff2","assets/fonts/barlow-condensed-latin-800-normal.woff2"]);
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
