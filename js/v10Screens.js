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
  const ALWAYS_ON=Object.freeze([BASE+KIT.styles[0],BASE+NAV.style,NAV.shellStyle]);

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
      // A sheet that arrives after the timeout settled it is synced again: Chromium applies a late sheet even when its
      // link was disabled while it loaded.
      const done=()=>{if(timer!==null)root.clearTimeout(timer);timer=null;entry.settled=true;vsSyncStyles();resolve(true);};
      link.addEventListener("load",done,{once:true});link.addEventListener("error",done,{once:true});
      timer=root.setTimeout(done,STYLE_TIMEOUT_MS);
    });
    styles.set(file,entry);
    doc.head.appendChild(link);
    return entry.ready;
  }
  function vsEnsureKit(){
    if(!kitPromise)kitPromise=(async()=>{
      const css=KIT.styles.map(file=>vsStyle(BASE+file));
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

  // ---- screens ----
  const vsActiveScreen=()=>typeof root.getActiveScreenName==="function"?root.getActiveScreenName()||null:null;
  function vsHost(id){const doc=vsDoc();return doc?doc.getElementById(id):null;}
  function vsIsShown(id){const host=vsHost(id);return Boolean(host&&!host.classList.contains("hidden")&&(registry.get(id)?.overlay===true||vsActiveScreen()===id));}
  // Team V stylesheets style more than their own markup, so they are on only while a mounted Team V screen shows.
  function vsSyncStyles(){
    const liveIds=[...mounted.keys()].filter(vsIsShown),live=liveIds.map(id=>registry.get(id));
    // html[data-v10-screen] names the Team V screen on show, so css/v10Shell.css can restyle the app's own header around it.
    const doc=vsDoc(),html=doc&&doc.documentElement,screen=liveIds.find(id=>registry.get(id).overlay!==true)||null;
    if(html&&html.dataset&&(html.dataset.v10Screen||null)!==screen){if(screen)html.dataset.v10Screen=screen;else delete html.dataset.v10Screen;}
    for(const [file,{link,settled}] of styles){
      if(!settled)continue;
      let on=ALWAYS_ON.includes(file);
      if(!on&&live.length)on=KIT.styles.some(kit=>BASE+kit===file)||live.some(def=>def.css.some(css=>BASE+css===file));
      if(link.disabled!==!on)link.disabled=!on;
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
      auto:definition.auto!==false
    }));
    return api;
  }
  function vsUnmount(id){
    const state=mounted.get(id);
    if(!state)return;
    mounted.delete(id);
    const def=registry.get(id);
    if(def&&def.unmount){try{def.unmount(state.host);}catch(error){vsReport("Team V screen could not close",error);}}
  }
  // The app draws its own screen at once and Team V's look mounts only after its files load. expect(id) keeps the
  // host's own content invisible meanwhile (css/v10Shell.css [data-v10-pending]); show() ends it on every outcome
  // (mounted, null frame, not shown, load error) and STYLE_TIMEOUT_MS ends it anyway, so the app's screen is never lost.
  function vsSettle(id){
    const entry=pending.get(id);
    if(!entry)return;
    pending.delete(id);root.clearTimeout(entry.timer);
    if(entry.host.dataset)delete entry.host.dataset.v10Pending;
  }
  function vsExpect(id){
    const host=vsHost(id);
    if(!host||!host.dataset||mounted.has(id))return false;
    vsSettle(id);
    host.dataset.v10Pending="1";
    pending.set(id,{host,timer:root.setTimeout(()=>vsSettle(id),STYLE_TIMEOUT_MS)});
    return true;
  }
  // Draws a registered screen if the app is showing it. A null frame keeps the app's own screen.
  async function vsShow(id){
    try{
      const def=registry.get(id);
      if(!def)return false;
      await vsLoadScreen(id);
      if(!vsIsShown(id))return false;
      const host=vsHost(id),frame=def.frame();
      if(frame===null||frame===undefined){vsUnmount(id);vsSyncStyles();return false;}
      const current=mounted.get(id);
      if(current&&current.frame===frame&&current.host===host&&host.isConnected!==false)return true;
      // Styles first, then mount: Team V's layout code measures a container its own CSS already sizes.
      mounted.set(id,{frame,host});
      vsSyncStyles();
      try{def.mount(frame,host);}
      catch(error){if(mounted.get(id)?.frame===frame)mounted.delete(id);vsSyncStyles();throw error;}
      vsSyncStyles();
      return true;
    }finally{vsSettle(id);}
  }
  function vsHide(id){vsSettle(id);vsUnmount(id);vsSyncStyles();}
  // The app rewrote the screen's host (e.g. its old renderer ran): forget the drawn frame so the next show() draws
  // again even when the frame is unchanged. A screen the app is not showing is simply closed.
  function vsInvalidate(id){if(!vsIsShown(id)){vsHide(id);return;}mounted.delete(id);}
  const vsIsMounted=id=>mounted.has(id);

  // ---- navigation bar ----
  function vsLoadingVisible(){const el=vsHost("loadingScreen");return Boolean(el&&!el.hidden&&!el.classList.contains("hidden"));}
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
      vsSyncStyles();
      vsPaintNav(screen);
      const def=screen?registry.get(screen):null;
      if(def&&def.auto){vsExpect(screen);vsShow(screen).catch(error=>vsReport("Team V screen could not load",error));}
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
  function vsInstall(){
    if(installed||!vsDoc())return api;
    installed=true;
    vsHookShowScreen();
    vsDoc().addEventListener(EVENT,vsOnScreenShown);
    vsWatchScreenClasses();
    vsWhenStarted(()=>{vsMountNav().catch(error=>{if(root.console&&typeof root.console.warn==="function")root.console.warn("[Career Mode Showdown] Navigation bar unavailable.",error);});});
    return api;
  }

  const api=Object.freeze({
    contractVersion:1,BASE,EVENT,UI_KEY,KIT,NAV,NAV_SCREENS,ROUTES,
    install:vsInstall,ensureKit:vsEnsureKit,register:vsRegister,show:vsShow,hide:vsHide,expect:vsExpect,settle:vsSettle,invalidate:vsInvalidate,isMounted:vsIsMounted,
    navFor:vsNavFor,navigate:vsNavigate,setNavRoute:vsSetNavRoute,getUiPreference:vsGetUiPreference,setUiPreference:vsSetUiPreference
  });
  return api;
});
