(function(root,factory){
  const api=factory(root);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.CareerModeV10Screens=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // JOB-24 (G-13 part 2a): one lazy loader for Team V's screens (visual-assets/v10_1, pinned 5e05a1f)
  // and Team V's navigation bar. Visual only: it never changes routes, data, storage or scoring.
  // - register(appScreenId, {css, js, prepare, frame, mount, unmount, auto}) then show(appScreenId).
  //   Files load once; a screen mounts when the app shows it and unmounts when the app leaves it.
  // - The app's showScreen is wrapped once, here (not in the startup files), and dispatches
  //   "career-mode-screen-shown" on document with {screen}.
  // - The bar (NAV_CONTRACT.md) appears after Loading; taps call the app's own navigation.
  const v10Node=typeof module!=="undefined"&&module.exports;
  const BASE="visual-assets/v10_1/";
  const EVENT="career-mode-screen-shown";
  const UI_KEY="cms.v10.ui";
  const STYLE_TIMEOUT_MS=4000;
  const KIT=Object.freeze({
    styles:Object.freeze(["shared/showdown-tokens.css","shared/showdown-type.css","shared/showdown-ui.css","shared/stage.css","shared/motion.css"]),
    scripts:Object.freeze([
      Object.freeze(["career-v10-stage","shared/stage.js",()=>Boolean(root.ShowdownStage)]),
      Object.freeze(["career-v10-motion","shared/motion.js",()=>typeof root.sdEnter==="function"])
    ])
  });
  const NAV=Object.freeze({
    tabs:Object.freeze(["home","career","standings","stats","rules"]),
    style:"shared/navbar/navbar.css",
    script:Object.freeze(["v10-navbar","shared/navbar/navbar.js",()=>Boolean(root.SDNav)]),
    shellStyle:"css/v10Shell.css",
    model:Object.freeze(["start-join-view-model","js/startJoinViewModel.js",()=>Boolean(root.CareerModeStartJoinViewModel)])
  });
  // NAV_CONTRACT.md: active tab per app screen, and where the phone bar shows (hub) or not (hidden).
  const NAV_SCREENS=Object.freeze({
    mainMenu:["home","hub"],createShowdown:["career","hub"],legacy:["career","hub"],trophyRoom:["career","hub"],
    careerStatistics:["stats","hub"],statistics:["stats","hub"],standings:["standings","hub"],ruleBook:["rules","hub"],settings:["settings","hub"],
    leagueWheelScreen:["career","hidden"],clubWheelScreen:["career","hidden"],dashboard:["career","hidden"],
    transferChallenge:["career","hidden"],seasonEntry:["career","hidden"],seasonSummary:["career","hidden"]
  });
  // Tab -> app destination. Screens built on demand open through the app's openOptionalModule (the same
  // path as the Home tiles); the rest through navigateTo. "career" is the Showdown's live step.
  const ROUTES=Object.freeze({home:"mainMenu",career:"career",standings:"dashboard",stats:"careerStatistics",rules:"ruleBook",settings:"settings"});
  const OPTIONAL_SCREENS=Object.freeze(["careerStatistics","statistics","trophyRoom","legacy","ruleBook","settings"]);
  // JOB-1635: screens whose Team V file registers only after the app shows them (their module loads on demand). They are
  // expect()ed from the first frame, so the old header, page and footer never paint while that file is still on its way.
  const LAZY_V10_SCREENS=Object.freeze(["careerStatistics","statistics","trophyRoom","legacy","ruleBook"]);
  const DECODE_TIMEOUT_MS=1500;
  const PLATE_TIMEOUT_MS=8000;
  const IMAGE_HOLD_MS=8000;
  const REVEAL_MS=220;
  const TAP_GUARD_MS=350;
  // r87 (transitions, Reus Gate: the loading screen stays until the next screen is ready). A screen still held after
  // GATE_GRACE_MS (its look, pictures or plate still on their way) hands over to the Reus loading screen instead of a black
  // page; Reus then stays at least GATE_MIN_MS, so it never blinks, and leaves with its own crossfade once the screen is ready.
  // A quick change (most of them, once files are cached) never shows it.
  const GATE_GRACE_MS=250;
  const GATE_MIN_MS=600;
  const GATE_EXIT_MS=240;
  // r87 (lane C C-05): how long after a Home tile tap the second tap of a pointer double tap is swallowed, wherever it lands.
  const DOUBLE_TAP_MS=500;
  // r78 (HO-028 / HO-029): Team V's readable body type and the black-and-gold marble for errors, notes, pop-ups and
  // toasts. They load with the kit sheets (never in the startup bundle) and stay on, like the shell sheet.
  const R78_STYLES=Object.freeze(["css/r78-type.css","css/r78-marble-surfaces.css"]);
  const ALWAYS_ON=Object.freeze([BASE+KIT.styles[0],BASE+NAV.style,NAV.shellStyle,...R78_STYLES]);

  const registry=new Map();
  const mounted=new Map();
  const screenLoads=new Map();
  const styles=new Map();
  const routeOverrides=new Map();
  const pending=new Map();
  let kitPromise=null,navPromise=null,navMounted=false,installed=false;

  function vsFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.values(value).forEach(vsFreeze);Object.freeze(value);}return value;}
  const vsDoc=()=>root.document||null;
  function vsReport(context,error){
    if(typeof root.reportApplicationError==="function")root.reportApplicationError(context,error);
    else if(root.console&&typeof root.console.warn==="function")root.console.warn(`[Career Mode Showdown] ${context}`,error);
  }
  function vsStartJoin(){
    if(root.CareerModeStartJoinViewModel)return root.CareerModeStartJoinViewModel;
    return v10Node?require("./startJoinViewModel.js"):null;
  }

  // ---- pure nav model ----
  function vsNavLock(screen){
    const model=vsStartJoin();
    if(!screen||!model||typeof model.navLockState!=="function")return {locked:false,reason:null};
    try{const state=model.navLockState(screen);return {locked:state.locked===true,reason:state.locked===true?state.reason:null};}
    catch(error){return {locked:false,reason:null};}
  }
  function vsNavFor(screen,loading=false){
    const entry=Object.prototype.hasOwnProperty.call(NAV_SCREENS,screen)?NAV_SCREENS[screen]:null;
    const lock=vsNavLock(screen);
    return vsFreeze({active:entry?entry[0]:"home",locked:lock.locked,reason:lock.reason,mode:loading?"none":entry?entry[1]:"hidden"});
  }
  async function vsOpenCareer(app){
    const target=typeof app.resolveCanonicalShowdownRoute==="function"?app.resolveCanonicalShowdownRoute():"mainMenu";
    // Same special openers the app's resume path uses for these two live steps.
    const opener=target==="transferChallenge"?"openTransferChallenge":target==="clubWheelScreen"?"prepareClubAssignment":null;
    if(opener&&typeof app[opener]==="function"){
      if(typeof app.ensureGameplayModules==="function")await app.ensureGameplayModules();
      return app[opener]();
    }
    // r78: no Showdown loaded yet (Home before resume) resolves to "mainMenu", which went nowhere. Hand the tap to
    // the CONTINUE CAREER tile so the tab runs that tile's own click path and reaches the same destination.
    const tile=target==="mainMenu"&&app.document?app.document.getElementById("continueCareer"):null;
    if(tile&&!tile.disabled&&typeof tile.click==="function"){tile.click();return true;}
    return app.navigateTo(target);
  }
  async function vsNavigate(key,app=root){
    if(!Object.prototype.hasOwnProperty.call(ROUTES,key))throw new TypeError("V10_NAV_ROUTE_UNKNOWN");
    if(routeOverrides.has(key))return routeOverrides.get(key)(app);
    const route=ROUTES[key];
    if(route==="career")return vsOpenCareer(app);
    if(OPTIONAL_SCREENS.includes(route))return app.openOptionalModule(route);
    return app.navigateTo(route);
  }
  function vsSetNavRoute(key,handler){
    if(!Object.prototype.hasOwnProperty.call(ROUTES,key))throw new TypeError("V10_NAV_ROUTE_UNKNOWN");
    if(typeof handler!=="function")throw new TypeError("V10_NAV_ROUTE_HANDLER");
    routeOverrides.set(key,handler);
  }

  // ---- UI-only preferences: one storage key (UI_KEY), never game data ----
  // storage.js owns browser storage; its readStorageValue/writeStorageValue helpers are used with UI_KEY only.
  function vsReadUi(){
    if(typeof root.readStorageValue!=="function")return {};
    try{const raw=root.readStorageValue(UI_KEY);const value=raw?JSON.parse(raw):{};return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
    catch(error){return {};}
  }
  function vsGetUiPreference(name){const value=vsReadUi()[name];return value===undefined?null:value;}
  function vsSetUiPreference(name,value){
    if(typeof name!=="string"||!name||typeof root.writeStorageValue!=="function")return false;
    try{const next=vsReadUi();next[name]=value;return root.writeStorageValue(UI_KEY,JSON.stringify(next))===true;}
    catch(error){return false;}
  }

  // ---- files ----
  const vsAssetUrl=file=>typeof root.optionalAssetUrl==="function"?root.optionalAssetUrl(file):file;
  function vsScript(key,file,ready){
    if(typeof root.loadRuntimeScript!=="function")return Promise.reject(new Error("The runtime loader is unavailable."));
    return root.loadRuntimeScript(key,file,ready);
  }
  function vsStyle(file){
    if(styles.has(file))return styles.get(file).ready;
    const doc=vsDoc(),link=doc.createElement("link");
    link.rel="stylesheet";link.href=vsAssetUrl(file);link.setAttribute("data-v10-style",file);
    // A link is left alone until it settles (load, error or timeout): disabling a stylesheet that is still loading
    // makes Chromium drop the request, and enabling it later never reloads it. On settling, the wanted state applies.
    const entry={link,ready:null,settled:false};
    entry.ready=new Promise(resolve=>{
      let timer=null;
      // The timeout releases the screen, but a link whose sheet is still null is still loading: it stays unsettled (left
      // alone) until it really loads or errors. The sync runs in the load handler itself, so an unwanted sheet is off before paint.
      const done=real=>{if(timer!==null)root.clearTimeout(timer);timer=null;if(real||link.sheet!==null)entry.settled=true;vsSyncStyles();if(resolve)resolve(true);resolve=null;};
      link.addEventListener("load",()=>done(true));link.addEventListener("error",()=>done(true));
      timer=root.setTimeout(()=>done(false),STYLE_TIMEOUT_MS);
    });
    styles.set(file,entry);
    doc.head.appendChild(link);
    return entry.ready;
  }
  function vsEnsureKit(){
    if(!kitPromise)kitPromise=(async()=>{
      // r78: the readable body type and marble sheets come with the kit, so Home's first reveal already has them (the Reus Gate
      // waits for every data-v10-style sheet and for fonts.ready); they are always on (ALWAYS_ON) and never in the startup bundle.
      const css=[...KIT.styles.map(file=>vsStyle(BASE+file)),...R78_STYLES.map(vsStyle)];
      for(const [key,file,ready] of KIT.scripts)await vsScript(key,BASE+file,ready);
      await Promise.all(css);
      vsSyncStyles();
      return true;
    })().catch(error=>{kitPromise=null;throw error;});
    return kitPromise;
  }
  function vsLoadScreen(id){
    if(!screenLoads.has(id)){
      const def=registry.get(id);
      screenLoads.set(id,(async()=>{
        await vsEnsureKit();
        const css=def.css.map(file=>vsStyle(BASE+file));
        for(const [key,file,ready] of def.js)await vsScript(key,BASE+file,ready);
        if(def.prepare)await def.prepare();
        await Promise.all(css);
        vsSyncStyles();
        return true;
      })().catch(error=>{screenLoads.delete(id);throw error;}));
    }
    return screenLoads.get(id);
  }

  // JOB-1635: pictures a Team V screen adds after its reveal are held at opacity 0 (css/v10Shell.css img[data-v10-decoding])
  // until they are decoded, then shown. One observer per mounted host; it stops when the screen unmounts.
  const imageWatchers=new Map();
  // A picture that will paint but is not loaded yet. An <img> inside <picture> whose only source is a matching <source> (Team V's
  // phone heroes) has no src and, right after insertion, no currentSrc either: it still counts, or it was revealed half-decoded.
  function vsPictureSource(img){
    const picture=img.parentNode;
    if(!picture||picture.tagName!=="PICTURE"||typeof picture.querySelectorAll!=="function")return false;
    return [...picture.querySelectorAll("source[srcset]")].some(source=>{const media=source.getAttribute("media");if(!media)return true;try{return typeof root.matchMedia==="function"&&root.matchMedia(media).matches;}catch(_){return false;}});
  }
  function vsImagePending(img){
    if(!img||(img.complete&&img.naturalWidth>0))return false;
    if(img.currentSrc||img.src||(typeof img.getAttribute==="function"&&img.getAttribute("srcset")))return true;
    return !img.complete&&vsPictureSource(img);
  }
  // Settles once the picture is decoded (or failed). decode() rejects at once before a <picture> has picked its source, and also when
  // the browser swaps the request it was waiting on; a picture that is still loading then waits for its load event and decodes again.
  // r87 (transitions, P-05): only a picture that paints on this reveal is waited for. A picture inside a part of the screen that
  // is not shown (display:none: Final Winner's trophy while Season Results shows) or a lazy one below the fold is not fetched
  // until it is needed, so its decode never settled and every Season Results / Final Winner open sat black for the whole
  // DECODE_TIMEOUT_MS. Such a picture is still held by the watcher (data-v10-decoding) until it is decoded once it shows.
  function vsImageWillPaint(img){
    if(typeof img.getClientRects!=="function")return true;
    const rects=img.getClientRects();
    if(!rects.length)return false;
    if(img.loading!=="lazy"||typeof img.getBoundingClientRect!=="function")return true;
    const r=img.getBoundingClientRect(),h=root.innerHeight||0,w=root.innerWidth||0;
    return !(h&&w)||(r.bottom>=-h&&r.top<=2*h&&r.right>=-w&&r.left<=2*w);
  }
  function vsImageSettled(img){
    const loaded=()=>new Promise(resolve=>{if(img.complete){resolve(img.naturalWidth>0);return;}img.addEventListener("load",()=>resolve(true),{once:true});img.addEventListener("error",()=>resolve(false),{once:true});});
    if(typeof img.decode!=="function")return loaded();
    const decode=()=>img.decode().then(()=>true,()=>false);
    const retry=ok=>ok||img.complete?ok:loaded().then(again=>again?decode():false);
    if(img.currentSrc||img.src)return decode().then(retry);
    return loaded().then(ok=>ok?decode():false);
  }
  // cap: how long a picture may stay held. A longer hold replaces a shorter one (a picture still loading when the screen's own
  // decode wait ran out stays hidden until it is ready instead of painting half-decoded).
  const imageHolds=new WeakMap();
  function vsHoldImage(img,cap=DECODE_TIMEOUT_MS){
    if(!img||!img.dataset||!vsImagePending(img))return;
    const held=imageHolds.get(img);
    if(held&&held.cap>=cap)return;
    const token={cap};imageHolds.set(img,token);
    img.dataset.v10Decoding="1";
    const release=()=>{if(imageHolds.get(img)!==token)return;imageHolds.delete(img);if(img.dataset)delete img.dataset.v10Decoding;};
    Promise.race([vsImageSettled(img),new Promise(resolve=>root.setTimeout(resolve,cap))]).then(release,release);
  }
  function vsWatchImages(id,host){
    if(imageWatchers.has(id)||typeof root.MutationObserver!=="function"||!host||typeof host.querySelectorAll!=="function")return;
    const observer=new root.MutationObserver(records=>{
      for(const record of records){
        if(record.type==="attributes"){if(record.target.tagName==="IMG")vsHoldImage(record.target);continue;}
        for(const node of record.addedNodes){
          if(!node||node.nodeType!==1)continue;
          if(node.tagName==="IMG")vsHoldImage(node);
          else if(typeof node.querySelectorAll==="function")node.querySelectorAll("img").forEach(img=>vsHoldImage(img));
        }
      }
    });
    observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:["src","srcset"]});
    imageWatchers.set(id,observer);
  }
  function vsUnwatchImages(id){const observer=imageWatchers.get(id);if(observer){observer.disconnect();imageWatchers.delete(id);}}

  // ---- screens ----
  const vsActiveScreen=()=>typeof root.getActiveScreenName==="function"?root.getActiveScreenName()||null:null;
  function vsHost(id){const doc=vsDoc();return doc?doc.getElementById(id):null;}
  function vsIsShown(id){const host=vsHost(id);return Boolean(host&&!host.classList.contains("hidden")&&(registry.get(id)?.overlay===true||vsActiveScreen()===id));}
  // Team V stylesheets style more than their own markup, so they are on only while a mounted Team V screen shows.
  function vsSyncStyles(){
    // A shown screen that is still loading (expect()ed, not yet mounted) counts as live too: dropping its look for
    // that gap showed the old header, background and footer, and disabled Team V's sheets (Chromium then refetches them).
    // (Some screens expect() before their Team V file has registered them: they keep the attribute but add no sheets yet.)
    const liveIds=[...new Set([...mounted.keys(),...pending.keys()])].filter(vsIsShown),live=liveIds.map(id=>registry.get(id)).filter(Boolean);
    // html[data-v10-screen] names the Team V screen on show, so css/v10Shell.css can restyle the app's own header around it.
    const doc=vsDoc(),html=doc&&doc.documentElement,screen=liveIds.find(id=>registry.get(id)?.overlay!==true)||null;
    if(html&&html.dataset&&(html.dataset.v10Screen||null)!==screen){if(screen)html.dataset.v10Screen=screen;else delete html.dataset.v10Screen;}
    for(const [file,entry] of styles){
      const link=entry.link;
      if(!entry.settled)continue;
      let on=ALWAYS_ON.includes(file);
      if(!on&&live.length)on=KIT.styles.some(kit=>BASE+kit===file)||live.some(def=>def.css.some(css=>BASE+css===file));
      // JOB-1635 C-1: only the loaded CSSStyleSheet is toggled, never link.disabled. Chromium drops a disabled link's sheet and
      // fetches it again on enable, which blanked Home's tile and tab labels for about 100 ms on every return. A link that
      // errored has no sheet and nothing to toggle (js/rulesSettingsV10.js does the same for its own glue sheet).
      if(link.sheet&&link.sheet.disabled!==!on)link.sheet.disabled=!on;
    }
  }
  function vsRegister(id,definition){
    if(typeof id!=="string"||!id)throw new TypeError("V10_SCREEN_ID");
    if(!definition||typeof definition.frame!=="function"||typeof definition.mount!=="function")throw new TypeError("V10_SCREEN_DEFINITION");
    if(registry.has(id))throw new Error("V10_SCREEN_DUPLICATE");
    registry.set(id,Object.freeze({
      css:Object.freeze((definition.css||[]).slice()),
      js:Object.freeze((definition.js||[]).map(entry=>Object.freeze(entry.slice()))),
      prepare:typeof definition.prepare==="function"?definition.prepare:null,
      frame:definition.frame,mount:definition.mount,
      unmount:typeof definition.unmount==="function"?definition.unmount:null,
      overlay:definition.overlay===true,
      auto:definition.auto!==false,
      // hold: a screen its own module shows (auto:false) is still expect()ed on the frame the app shows it (JOB-1651).
      hold:definition.hold===true
    }));
    return api;
  }
  function vsUnmount(id){
    const state=mounted.get(id);
    if(!state)return;
    mounted.delete(id);
    vsUnwatchImages(id);
    const def=registry.get(id);
    if(def&&def.unmount){try{def.unmount(state.host);}catch(error){vsReport("Team V screen could not close",error);}}
  }
  // The app draws its own screen at once and Team V's look mounts only after its files load. expect(id) keeps the
  // host's own content invisible meanwhile (css/v10Shell.css [data-v10-pending]); show() ends it on every outcome
  // (mounted, null frame, not shown, load error) and STYLE_TIMEOUT_MS ends it anyway, so the app's screen is never lost.
  // ---- in-app Reus Gate ----
  // The gate owns the loading screen only when it raised it (data-v10-gate): the startup splash, Roster Roulette and the Special
  // Player reveal raise it themselves and are never touched. Only full screens count; an overlay (Settings) never raises it.
  const gate={timer:null,raisedAt:0,lowering:null};
  const vsGateHeld=()=>[...pending.keys()].some(id=>registry.get(id)?.overlay!==true&&vsIsShown(id));
  function vsGateEl(){const el=vsHost("loadingScreen");return el&&el.dataset&&el.classList&&typeof el.getAttribute==="function"&&typeof el.setAttribute==="function"&&typeof el.removeAttribute==="function"?el:null;}
  function vsGateHold(){
    if(gate.lowering!==null){root.clearTimeout(gate.lowering);gate.lowering=null;const el=vsGateEl();if(vsGateOwns(el)){el.classList.remove("is-exiting");el.setAttribute("aria-busy","true");el.removeAttribute("aria-hidden");vsSetNavMode("none");}else{gate.raisedAt=0;vsGateForget(el);}}
    if(gate.timer!==null||gate.raisedAt)return;
    gate.timer=root.setTimeout(vsGateRaise,GATE_GRACE_MS);
  }
  function vsGateRaise(){
    gate.timer=null;
    const el=vsGateEl();
    // Another owner already shows it (or it is on its way out from startup): leave it alone.
    if(!el||!vsGateHeld()||!el.hidden&&!el.classList.contains("hidden"))return;
    const text=vsHost("loadingText");
    el.dataset.v10Gate="1";el.dataset.v10GateText=text?text.textContent:"";el.dataset.v10GateLabel=el.getAttribute("aria-label")||"";
    if(text)text.textContent="LOADING";
    el.setAttribute("aria-label","Loading");el.setAttribute("aria-busy","true");el.removeAttribute("aria-hidden");
    // Fades in over the dark page with the splash's own opacity transition (is-exiting is its 0 state).
    el.classList.add("is-exiting");el.classList.remove("hidden");el.hidden=false;void el.offsetWidth;el.classList.remove("is-exiting");
    gate.raisedAt=Date.now();
    vsSetNavMode("none");
  }
  // Roster Roulette or the Special Player reveal may take the loading screen over while it is up (they relabel it): from then
  // on it is theirs to hide.
  const vsGateOwns=el=>Boolean(el&&el.dataset.v10Gate==="1"&&el.getAttribute("aria-label")==="Loading");
  function vsGateForget(el){if(el&&el.dataset){delete el.dataset.v10Gate;delete el.dataset.v10GateText;delete el.dataset.v10GateLabel;}}
  function vsGateRelease(){
    if(vsGateHeld())return;
    if(gate.timer!==null){root.clearTimeout(gate.timer);gate.timer=null;}
    if(!gate.raisedAt||gate.lowering!==null)return;
    gate.lowering=root.setTimeout(()=>{
      const el=vsGateEl();
      if(!el||!vsGateOwns(el)){gate.lowering=null;gate.raisedAt=0;vsGateForget(el);return;}
      el.setAttribute("aria-hidden","true");el.setAttribute("aria-busy","false");el.classList.add("is-exiting");
      // The bar comes back with the screen, as it does when the startup splash leaves.
      vsPaintNav(vsActiveScreen());
      gate.lowering=root.setTimeout(()=>{
        gate.lowering=null;gate.raisedAt=0;
        if(!vsGateOwns(el)){vsGateForget(el);return;}
        const text=vsHost("loadingText");
        if(text)text.textContent=el.dataset.v10GateText||"";
        if(el.dataset.v10GateLabel)el.setAttribute("aria-label",el.dataset.v10GateLabel);
        delete el.dataset.v10Gate;delete el.dataset.v10GateText;delete el.dataset.v10GateLabel;
        el.hidden=true;el.classList.add("hidden");
      },GATE_EXIT_MS);
    },Math.max(0,GATE_MIN_MS-(Date.now()-gate.raisedAt)));
  }
  function vsSettle(id,reveal=false){
    const entry=pending.get(id);
    if(!entry)return;
    pending.delete(id);root.clearTimeout(entry.timer);
    vsGateRelease();
    if(entry.host.dataset){
      delete entry.host.dataset.v10Pending;
      // One short reveal for every Team V screen (css/v10Shell.css [data-v10-reveal]); reduced motion makes it instant.
      if(reveal){entry.host.dataset.v10Reveal="1";root.setTimeout(()=>{if(entry.host.dataset&&entry.host.dataset.v10Reveal==="1"&&!pending.has(id))delete entry.host.dataset.v10Reveal;},REVEAL_MS+60);}
    }
    vsSyncStyles();
  }
  // r75 ready gate (owner, 2026-10-13: on a slow link a screen was revealed as a dark stage and its plate or title art painted in
  // seconds later). A Team V screen's plate, title wordmarks and backdrops are mostly CSS backgrounds, which the <img> wait below
  // never covered: each background a shown element of the screen paints (from an image-set, the density this screen picks;
  // Chromium reports densities as dppx) is decoded before the reveal too. Capped at PLATE_TIMEOUT_MS, and the cover's own timer is
  // moved to match, so a plate that never arrives never holds the screen longer. <img> pictures keep DECODE_TIMEOUT_MS and their hold.
  function vsPlates(host){
    if(typeof root.getComputedStyle!=="function"||typeof root.Image!=="function"||typeof host.querySelectorAll!=="function")return [];
    const dpr=root.devicePixelRatio||1,urls=new Set();
    for(const el of [host,...host.querySelectorAll("*")]){
      if(typeof el.getClientRects!=="function"||!el.getClientRects().length)continue;
      const bg=root.getComputedStyle(el).backgroundImage;
      if(!bg||bg.indexOf("url(")<0)continue;
      const list=[...bg.matchAll(/url\("?([^")]+)"?\)\s*(?:([\d.]+)(?:x|dppx))?/g)].map(m=>({url:m[1],x:Number(m[2]||0)})).filter(e=>!e.url.startsWith("data:"));
      if(/image-set\(/.test(bg)&&list.length>1){const set=list.sort((a,b)=>a.x-b.x);urls.add((set.find(e=>e.x>=dpr)||set[set.length-1]).url);}
      else list.forEach(e=>urls.add(e.url));
    }
    return [...urls].map(url=>{const img=new root.Image();img.src=url;return img;});
  }
  const vsWithin=(promise,ms)=>Promise.race([promise.then(()=>true),new Promise(resolve=>root.setTimeout(()=>resolve(false),ms))]);
  // JOB-1635: a screen's pictures are decoded before it is revealed, so artwork never paints half-loaded or at low resolution in
  // front of the player. Capped: a slow network never holds the screen longer than DECODE_TIMEOUT_MS (PLATE_TIMEOUT_MS for plates).
  async function vsDecodeImages(host,id){
    if(!host||typeof host.querySelectorAll!=="function")return false;
    // One frame first: an <img> inside <picture> has no currentSrc until the browser has picked its source.
    await new Promise(resolve=>typeof root.requestAnimationFrame==="function"?root.requestAnimationFrame(()=>resolve()):root.setTimeout(resolve,0));
    const waiting=[...host.querySelectorAll("img")].filter(vsImagePending),images=waiting.filter(vsImageWillPaint);
    // Pictures this reveal does not wait for keep the longer hold, as a picture still loading at the cap does below.
    for(const img of waiting)if(!images.includes(img))vsHoldImage(img,IMAGE_HOLD_MS);
    let plates=[];
    try{plates=vsPlates(host);}catch(error){plates=[];}
    if(!images.length&&!plates.length)return false;
    const entry=id?pending.get(id):null;
    if(plates.length&&entry){root.clearTimeout(entry.timer);entry.timer=root.setTimeout(()=>vsSettle(id),PLATE_TIMEOUT_MS+250);}
    const [done,platesDone]=await Promise.all([
      images.length?vsWithin(Promise.all(images.map(vsImageSettled)),DECODE_TIMEOUT_MS):Promise.resolve(true),
      plates.length?vsWithin(Promise.all(plates.map(vsImageSettled)),PLATE_TIMEOUT_MS):Promise.resolve(true)
    ]);
    // The screen is never held longer than its cap, but a picture that is still not ready then (slow load, or a request
    // the browser swapped) is held on its own (opacity 0 until decoded, capped) instead of painting half-loaded after the reveal.
    for(const img of images)if(vsImagePending(img))vsHoldImage(img,IMAGE_HOLD_MS);
    return done&&platesDone;
  }
  function vsExpect(id){
    const host=vsHost(id);
    if(!host||!host.dataset||mounted.has(id))return false;
    vsSettle(id);
    host.dataset.v10Pending="1";
    pending.set(id,{host,timer:root.setTimeout(()=>vsSettle(id),STYLE_TIMEOUT_MS)});
    vsGateHold();
    vsSyncStyles();
    return true;
  }
  // Draws a registered screen if the app is showing it. A null frame keeps the app's own screen.
  // r75: the show() whose pictures and plate are still decoding owns the cover. Another show() of the same screen meanwhile (a
  // module re-showing on a data change with the same frame) used to settle it at once and reveal the screen before its plate.
  const decoding=new Map();
  async function vsShow(id){
    let revealed=false;const token={};
    try{
      const def=registry.get(id);
      if(!def)return false;
      await vsLoadScreen(id);
      if(!vsIsShown(id))return false;
      const host=vsHost(id),frame=def.frame();
      if(frame===null||frame===undefined){vsUnmount(id);vsSyncStyles();return false;}
      const current=mounted.get(id);
      if(current&&current.frame===frame&&current.host===host&&host.isConnected!==false)return true;
      // A screen drawn for the first time (or drawn again) keeps its content invisible until its pictures are decoded, then
      // reveals once; a screen the app did not expect() gets that pending state here.
      if(!current&&!pending.has(id)&&host.dataset){host.dataset.v10Pending="1";pending.set(id,{host,timer:root.setTimeout(()=>vsSettle(id),STYLE_TIMEOUT_MS)});vsGateHold();}
      // Styles first, then mount: Team V's layout code measures a container its own CSS already sizes.
      mounted.set(id,{frame,host});
      vsSyncStyles();
      // The picture watcher is on before mount, so every picture Team V's mount or boot adds (now or later) is held until decoded.
      vsWatchImages(id,host);
      try{def.mount(frame,host);}
      catch(error){if(mounted.get(id)?.frame===frame){mounted.delete(id);vsUnwatchImages(id);}vsSyncStyles();throw error;}
      vsSyncStyles();
      // Still pending (content invisible) while the pictures decode; the reveal below starts only once they are ready.
      if(pending.has(id)){decoding.set(id,token);try{await vsDecodeImages(host,id);}finally{if(decoding.get(id)===token)decoding.delete(id);}if(vsIsShown(id)&&mounted.get(id)?.frame===frame)revealed=true;}
      return true;
    }finally{if(!decoding.has(id))vsSettle(id,revealed);}
  }
  function vsHide(id){vsSettle(id);vsUnmount(id);vsSyncStyles();}
  // The app rewrote the screen's host (e.g. its old renderer ran): forget the drawn frame so the next show() draws
  // again even when the frame is unchanged. A screen the app is not showing is simply closed.
  function vsInvalidate(id){if(!vsIsShown(id)){vsHide(id);return;}mounted.delete(id);}
  const vsIsMounted=id=>mounted.has(id);

  // ---- navigation bar ----
  // r87 (Reus Gate): a loading screen whose crossfade has begun (is-exiting) no longer hides the bar, so Home and its bar
  // fade in together.
  function vsLoadingVisible(){const el=vsHost("loadingScreen");return Boolean(el&&!el.hidden&&!el.classList.contains("hidden")&&!el.classList.contains("is-exiting"));}
  function vsSetNavMode(mode){const doc=vsDoc();if(doc&&doc.documentElement&&doc.documentElement.dataset.nav!==mode)doc.documentElement.dataset.nav=mode;}
  function vsPaintNav(screen){
    const loading=vsLoadingVisible();
    if(loading)vsSetNavMode("none");
    if(!navMounted||!root.SDNav)return;
    const state=vsNavFor(screen,loading);
    root.SDNav.set({active:state.active,locked:state.locked,reason:state.reason});
    vsSetNavMode(state.mode);
  }
  // The app already has a banner (#topHeader), so the bar's top <header> must not be a second one: it becomes
  // a plain container and its inner <nav aria-label="Primary"> stays the navigation landmark. Team V's file is unchanged.
  function vsLandmarks(){
    const top=vsDoc().querySelector(".sd-nav-top");
    if(!top)return;
    top.setAttribute("role","none");
    top.removeAttribute("aria-label");
  }
  function vsGo(key){
    Promise.resolve().then(()=>vsNavigate(key,root)).catch(error=>vsReport(`Unable to open ${key}`,error));
  }
  function vsMountNav(){
    if(!navPromise)navPromise=(async()=>{
      const css=ALWAYS_ON.map(vsStyle);
      await vsScript(...NAV.model);
      await vsScript(NAV.script[0],BASE+NAV.script[1],NAV.script[2]);
      await Promise.all(css);
      const state=vsNavFor(vsActiveScreen(),vsLoadingVisible());
      root.SDNav.mount({nav:{active:state.active,locked:state.locked,reason:state.reason},routes:ROUTES,onNavigate:vsGo,adopt:false,bottomHost:"body"});
      vsLandmarks();
      navMounted=true;
      vsPaintNav(vsActiveScreen());
      vsSyncStyles();
      return true;
    })().catch(error=>{navPromise=null;throw error;});
    return navPromise;
  }
  function vsWhenStarted(start){
    if(!vsLoadingVisible())return start();
    vsSetNavMode("none");
    const loading=vsHost("loadingScreen");
    if(typeof root.MutationObserver==="function"){
      const observer=new root.MutationObserver(()=>{if(!vsLoadingVisible()){observer.disconnect();start();}});
      observer.observe(loading,{attributes:true,attributeFilter:["class","hidden"]});
    }else{
      const poll=()=>vsLoadingVisible()?root.setTimeout(poll,300):start();
      root.setTimeout(poll,300);
    }
  }

  // ---- screen-change hook ----
  function vsOnScreenShown(){
    try{
      const screen=vsActiveScreen();lastScreen=screen;
      for(const id of [...mounted.keys()])if(!vsIsShown(id))vsUnmount(id);
      const def=screen?registry.get(screen):null;
      // expect() before the style sync, so the screen keeps Team V's look while it loads (also for a screen whose Team V
      // file has not registered yet: its module's show() or the style timeout settles it).
      // Legacy's data tools page (backup, restore, reset) is the one career screen that keeps the app's own markup
      // (js/careerScreenSeam.js): it is never held for a Team V look that will not come.
      const lazy=screen&&LAZY_V10_SCREENS.includes(screen)&&!(screen==="legacy"&&root.careerModeLegacyDataTools===true);
      // A screen its own module shows (auto:false) but registered with hold (Season Results / Final Winner) is held the same way:
      // without it html[data-v10-screen] and the dark page waited for the module's next tick and the old design painted first.
      const expected=def?(def.auto||def.hold)&&vsExpect(screen):lazy&&vsExpect(screen);
      if(!expected)vsSyncStyles();
      vsPaintNav(screen);
      if(def&&def.auto)vsShow(screen).catch(error=>vsReport("Team V screen could not load",error));
    }catch(error){vsReport("Team V screen could not update",error);}
  }
  function vsHookShowScreen(){
    const original=root.showScreen;
    if(typeof original!=="function"||original.v10Screens===true)return;
    const wrapped=function(){
      const shown=original.apply(this,arguments);
      if(shown){
        try{const doc=vsDoc();if(doc&&typeof root.CustomEvent==="function")doc.dispatchEvent(new root.CustomEvent(EVENT,{detail:{screen:vsActiveScreen()}}));}
        catch(error){}
      }
      return shown;
    };
    wrapped.v10Screens=true;wrapped.original=original;
    root.showScreen=wrapped;
  }
  // Some flows (Shared Setup's ssjpForceScreen) switch screens by toggling "hidden" on the
  // .screen sections directly, without showScreen. Watch those class changes too, so the bar's
  // active tab and setup lock follow every screen change.
  let lastScreen=null;
  function vsWatchScreenClasses(){
    const doc=vsDoc(),main=doc&&(doc.querySelector?.("main")||doc.body);
    if(typeof root.MutationObserver!=="function"||!main)return;
    new root.MutationObserver(records=>{
      if(!records.some(r=>r.target&&r.target.classList&&r.target.classList.contains("screen")))return;
      if(vsActiveScreen()!==lastScreen)vsOnScreenShown();
    }).observe(main,{subtree:true,attributes:true,attributeFilter:["class"]});
  }
  // JOB-1635: a second tap for the same target while its navigation is still in flight joins that navigation instead of
  // starting another (two shows, two renders). Synchronous results are returned untouched, so timing is unchanged.
  function vsDedupe(name){
    const fn=root[name];
    if(typeof fn!=="function"||fn.v10Once===true)return;
    const inflight=new Map();
    const wrapped=function(target){
      const key=String(target);
      if(inflight.has(key))return inflight.get(key);
      const result=fn.apply(this,arguments);
      if(result&&typeof result.then==="function"){inflight.set(key,result);result.then(()=>inflight.delete(key),()=>inflight.delete(key));}
      return result;
    };
    wrapped.v10Once=true;wrapped.original=fn;
    root[name]=wrapped;
  }
  function vsInstall(){
    if(installed||!vsDoc())return api;
    installed=true;
    vsHookShowScreen();
    vsDedupe("navigateTo");vsDedupe("openOptionalModule");
    // A Home tile ignores a repeat tap whenever its navigation is already underway, however late the second tap is delivered
    // (a throttled CPU can run a 30 ms timer after several hundred ms): the tile is busy, or Home is no longer the screen being
    // shown (the first tap already left it). A repeat tap for the same target that still gets through joins the in-flight
    // navigation (vsDedupe). There is no global in-flight lock, so a navigation that never settles cannot freeze Home's tiles.
    // TAP_GUARD_MS stays as an extra debounce. Programmatic navigation is untouched.
    // r87 (lane C C-05): once the first tap has switched the screen, the second tap of a double tap lands on the next screen's
    // control under the finger (STATISTICS opened the Trophy Room on desktop; RULE BOOK bounced back Home on a phone, through a
    // BACK TO HOME still pending and invisible). Any other pointer tap within DOUBLE_TAP_MS of a Home tile tap is that second
    // tap, so it is swallowed. Keyboard and programmatic clicks (detail 0) pass; a deliberate tap a moment later works.
    let lastTileTapAt=0,lastTile=null;
    vsDoc().addEventListener("click",event=>{
      const tile=event.target&&typeof event.target.closest==="function"?event.target.closest("#mainMenu .menuTile"):null;
      if(lastTileTapAt&&tile!==lastTile&&Number(event.detail)>0&&Date.now()-lastTileTapAt<DOUBLE_TAP_MS){event.stopImmediatePropagation();event.preventDefault();return;}
      if(!tile||!tile.dataset)return;
      const now=Date.now(),last=Number(tile.dataset.v10Tap||0),home=vsHost("mainMenu"),active=vsActiveScreen();
      const homeGone=Boolean(home&&home.classList.contains("hidden"))||(active!==null&&active!=="mainMenu");
      if(tile.getAttribute("aria-busy")==="true"||homeGone||(last&&now-last<TAP_GUARD_MS)){event.stopImmediatePropagation();event.preventDefault();return;}
      tile.dataset.v10Tap=String(now);lastTileTapAt=now;lastTile=tile;
    },true);
    vsDoc().addEventListener(EVENT,vsOnScreenShown);
    vsWatchScreenClasses();
    // r87 (Reus Gate: Loading stays until the next screen is ready): the bar mounts at once, behind the loading screen
    // (html[data-nav="none"] keeps it hidden), and js/ssjr.js waits for it before Home is handed over. It used to mount
    // only after Loading had gone, so Home showed for a moment without its bar, music dock and account chips.
    vsMountNav().catch(error=>{if(root.console&&typeof root.console.warn==="function")root.console.warn("[Career Mode Showdown] Navigation bar unavailable.",error);});
    vsWhenStarted(()=>vsPaintNav(vsActiveScreen()));
    return api;
  }

  const api=Object.freeze({
    contractVersion:1,BASE,EVENT,UI_KEY,KIT,NAV,R78_STYLES,NAV_SCREENS,ROUTES,
    install:vsInstall,mountNav:vsMountNav,ensureKit:vsEnsureKit,register:vsRegister,show:vsShow,hide:vsHide,expect:vsExpect,settle:vsSettle,invalidate:vsInvalidate,isMounted:vsIsMounted,
    navFor:vsNavFor,navigate:vsNavigate,setNavRoute:vsSetNavRoute,getUiPreference:vsGetUiPreference,setUiPreference:vsSetUiPreference
  });
  return api;
});
